const { Client, Intents, MessageEmbed, } = require('discord.js');
const { Player } = require('discord-player');
const axios = require('axios');

const client = new Client({
    shards: "auto",
    restTimeOffset: 0,
    intents: 641,
    partials: ["CHANNEL", "MESSAGE", "REACTION", "USER","GUILD_MEMBER","GUILD_SCHEDULED_EVENT"]
});

Parser = require('rss-parser'),
posts = new Parser();

client.db = require("quick.db");

const { token, prefix, adminID, embed_color , channel_feed } = require('./config.json');

//random
const random_num = () => {
    return Math.floor(Math.random() * 10);
}

//Bot Online

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
    client.user.setActivity(`Visual Studio Code`, { type: "PLAYING" });
    checkOneHour();
});

//RSS TACSTER and Youtube 
async function checkOneHour() {
    if ([null, undefined].includes(client.db.get(`tcaster_last_post_id`))) client.db.set(`tcaster_last_post_id`, 0);
    let feed = await posts.parseURL(`https://tcaster.net/category/tcas-news/%E0%B8%82%E0%B9%88%E0%B8%B2%E0%B8%A7-tcas/feed/`);
    // console.log(feed);
    feed.items.reverse().forEach(async (item) => {
        const id = item.guid.match(/\d/g).join("");
        if (client.db.get(`tcaster_last_post_id`) < parseInt(id)) {
            client.db.set(`tcaster_last_post_id`, parseInt(id));
            const channel = await client.channels.fetch(channel_feed);
            
            const embed = new MessageEmbed()
                .setTitle(item.title)
                .setDescription(item.contentSnippet)
                .setURL(item.guid)
                .setColor(embed_color);
                
            channel.send({ embeds: [embed]})
                .then((m) => {
                    if (m.crosspostable) m.crosspost();
                    m.startThread({ name: `${item.title.substring(0, 50)}...`});
                })
        }
    });
    
    if ([null, undefined].includes(client.db.get(`postedVideos`))) client.db.set(`postedVideos`, []);
    let youtube = await posts.parseURL(`https://www.youtube.com/feeds/videos.xml?channel_id= < your youtube id  >`);
    // console.log(youtube);
    youtube.items.reverse().forEach(async (item) => {
        if (!client.db.get(`postedVideos`).includes(item.id)) {
            client.db.push("postedVideos", item.id);

            const channel = await client.channels.fetch(channel_feed); 
            const message = `**{author}** published **{title}**!\n{url}`
                    .replace(/{author}/g, item.author)
                    .replace(/{title}/g, item.title.replace(/\\(\*|_|`|~|\\)/g, '$1').replace(/(\*|_|`|~|\\)/g, '\\$1'))
                    .replace(/{url}/g, item.link);
            channel.send(message)
                .then((m) => {
                    if (m.crosspostable) m.crosspost();
                });
        }
    });

   setTimeout(checkOneHour, 1000 * 60 * 60);  //CheckOneHour
}

//random-food

client.on('messageCreate', msg => {
    let foods = ['ผัดกระเพรา', 'ข้าวมันไก่', 'สเต็กลุงหยิก', 'BonChon', 'KFC', 'ผัดไท', 'ข้าวต้ม',
        'หมูกระเทียม', 'พิซซ่า', 'ขนมจีน', 'ส้มตำ', 'ไก่ทอด', 'mcdonalds', 'มาม่าผัด',
        'แกงกะหรี่', 'คอหมูย่าง', 'ก๋วยเตี๋ยวหมู', 'ก๋วยเตี๋ยวเนื้อ', 'ข้าวผัด', 'สุกี้เเห้ง',
        'สุกี้น้ำ', 'ไข่ข้น', 'ข้าวมันไก่ทอด', 'ผัดผงกะหรี่', 'ผัดพริกแกง', 'ผัดขี้เมา', 'คะน้าหมูกรอบ',
        'ผัดน้ำมันหอย', 'ผัดพริกเผา', 'ผัดพริกเกลือ', 'ผัดวุ้นเส้น', 'แกงส้ม', 'ผัดซีอิ้ว', 'ราดหน้า']
    if (msg.content == 'food') {
        msg.reply(foods[random_num()])
    }
})

//Musicbot 

const player = new Player(client, {
    leaveOnEnd: true,
    leaveOnStop: true,
    leaveOnEmpty: true,
    leaveOnEmptyCooldown: 5000,
    autoSelfDeaf: true,
    initialVolume: 50,
    bufferingTimeout: 3000,
  });

module.exports = { player, client };

require('./event')(client)
client.on("messageCreate", async (message) => {
    if (!message.guild || message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;
  
    let args = message.content.slice(prefix.length).trim().split(" ");
    let cmd = args.shift()?.toLowerCase();
  
    require("./cmd")(client, message, cmd, args);
  });

//COVID Daily Report 

function covid(message){

    axios.get('	https://covid19.ddc.moph.go.th/api/Cases/today-cases-all')
    
    .then(function (response) {
        var covidData = response.data[0];
            // console.log(covidData);
        const covidembed = new MessageEmbed()
        .setColor('#0099ff')
        .setTitle('รายงานสถานการณ์ COVID-19 ประจำวัน')
        .setURL('https://covid19.ddc.moph.go.th/')
        .setDescription(`${covidData.txn_date}`)
        .addFields(
            { 
                name: '😷 ผู้ติดเชื้อรายใหม่', 
                value: `${covidData.new_case}` 
            },
            { 
                name: '🤒 ผู้ติดเชื้อ', 
                value: `${covidData.total_case}`, 
                inline: true 
            },
            { 
                name: '💀 เสียชีวิต', 
                value: `${covidData.total_death}`, 
                inline: true 
            },
            { 
                name: '✅ รักษาแล้ว', 
                value: `${covidData.total_recovered}`, 
                inline: true 
            },
        )
        .setImage(`https://cdn.discordapp.com/attachments/928273696588726312/929765800607359006/images.png`)
        .setTimestamp()
        .setFooter({ text: `${covidData. update_date}`});

        message.channel.send({ embeds: [covidembed] });
  })
}

//Embed TCAS

const TCAS = new MessageEmbed()
.setColor('#0592e3')
.setAuthor({ name: 'TCAS คือ อะไร?', iconURL: 'https://cdn.discordapp.com/attachments/928273696588726312/928301155908460584/unknown.png', url: 'https://www.mytcas.com/' })
.setTitle('TCAS คือ อะไร?')
.setURL('https://www.mytcas.com/')
.setDescription(`TCAS Thai University Central Admission System
    \nเป็นระบบนักศึกษาที่ส่วนกลางร่างขึ้นมาเพื่อให้
    \n -เพิ่มความเท่าเทียมและโอกาสการเข้ามหาลัย
    \n -ลดปัญหาการ "จองที่" และกันสิทธิ์คนอื่น
    \n -ลดปัญหาได้เปรียบเสียเปรียบของนักเรียน
    \n -แก้ปัญหา การไม่เข้าใจและต้องสอบหลายที่\n
`)
.addFields(
    { name: 'โดยรุ่นปัจจุบันจะนับเป็น DEK65 ตามปีการศึกษา', value: '\u200B' },
    { name: 'การรับนักศึกษาจะมี 4 รอบด้วยกันนั่นคือ', value: 'ข้อมูลมาจาก TCAS64 อาจมีเปลี่ยนเมื่อเป็น TCAS65' },
    { name: '\u200B', value: '\u200B' },
    { name: '1.PORTFOLIO', value: `ตามกำหนดการที่ผ่านมาเดือน ธ.ค. จะเป็นการส่งตรงเข้ามหาลัย Portfolio นั้นจำกัดเพียง 10 หน้า(ไม่รวมปก สารบัญ คำนำ) `, inline: true },
    { name: '\u200B', value: '\u200B' },
    { name: '2.โควตา(Quota)', value: 'จะเป็นการดูว่าเรามี คุณสมบัตร ตรงกับโควตาใดๆของมหาลัยและคณะนั้นซึ่งเป็นการยื่นตรงสู่มหาลัย รอบนี้นั้นคือ รอบ 2 แล้วอาจใช้คะแนน GAT/PAT , 9 วิชา สามัญ ,O-NET(แต่ DEK65 อาจจะไม่ใช้แล้ว)', inline: true },
    { name: '\u200B', value: '\u200B' },
    { name: '3.แอดมิชชั่น(Admission)', value: 'รอบนี้นั้นไม่ได้สมัครตรงกับมหาลัยแล้วแต่เป็นการใช้ระบบของ MyTCASเลือกได้ 10 อันดับ แต่สามารถติดได้เพียงตัวเลือกเดียว การติดลำดับนึงจะหยุดการพิจารณาทันทีอำนาจการคิดนั้นขึ้นอยู่กับมหาลัยเลย', inline: true },
    { name: '\u200B', value: '\u200B' },
    { name: '4.รับตรง(Direct Admission)', value: 'เป็นรอบที่ต้องดูรายละเอียดจากมหาวิทยาลัย', inline: true },
    { name: '\u200B', value: '\u200B' },
)
.setImage('https://cdn.discordapp.com/attachments/928273696588726312/928287998313893938/20200607220809-removebg-preview.png')
.setTimestamp()
.setFooter({ text: 'TCAS (Thai University Central Admission System)'});

client.on('messageCreate', (message) => {
    if (!message.guild || message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;

    let args = message.content.slice(prefix.length).trim().split(/ +/);
    let cmd = args.shift().toLowerCase();

    if(cmd === "tcas"){
        message.channel.send({ embeds: [TCAS] });
    }
    if(cmd === "covid"){
       covid(message)
    }
    
});


client.login(token);