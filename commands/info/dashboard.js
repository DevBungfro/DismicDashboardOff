module.exports = {
  name: "dashboard",
  aliases: [],
  category: "info",
  description: "Find your guild's dashboard link",
  usage: "",
  cooldown: 5000,
  run: async (client, message, args) => {
        const roundtripMessage = await message.reply(`Your server dashboard is: ${process.env.domain}/guild/${message.guild.id}`);

  }
};