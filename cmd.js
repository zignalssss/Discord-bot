const { Client, Message } = require("discord.js");
const { player } = require(".");

/**
 *
 * @param {Client} client
 * @param {Message} message
 * @param {String[]} args
 */
module.exports = async (client, message, cmd, args) => {
  if (cmd === "ping") {
    message.reply(`Ping :- ${client.ws.ping}`);
  } else if (cmd === "play") {
    let voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply(`You Need to Join Voice Channel`);

    let search_Song = args.join(" ");
    if (!search_Song) return message.reply(`Type Song name or Link`);

    let queue = player.createQueue(message.guild.id, {
      metadata: {
        channel: message.channel,
      },
    });

    // verify vc connection
    try {
      if (!queue.connection) await queue.connect(voiceChannel);
    } catch {
      queue.destroy();
      return await message.reply({
        content: "Could not join your voice channel!",
        ephemeral: true,
      });
    }

    let song = await player
      .search(search_Song, {
        requestedBy: message.author,
      })
      .then((x) => x.tracks[0]);

    if (!song) return message.reply(` I cant Find \`${search_Song}\` `);

    queue.play(song);

    message.channel.send({ content: `⏱️ | Loading track **${song.title}**!` });
  } else if (cmd === "skip") {
    let queue = player.getQueue(message.guild.id);
    queue.skip();
    message.channel.send(`Song Skiped`);
  } else if (cmd === "stop") {
    let queue = player.getQueue(message.guild.id);
    queue.stop();
    message.channel.send(`Song Stoped`);
  } else if (cmd === "pause") {
    let queue = player.getQueue(message.guild.id);
    queue.setPaused(true);
    message.channel.send(`Song Paused`);
  } else if (cmd === "resume") {
    let queue = player.getQueue(message.guild.id);
    queue.setPaused(false);
    message.channel.send(`Song Resumed`);
  } else if (cmd === "volume") {
    let queue = player.getQueue(message.guild.id);
    let amount = parseInt(args[0]);
    queue.setVolume(amount);
    message.channel.send(`Volume Set to \`${amount}\``);
  }
};
