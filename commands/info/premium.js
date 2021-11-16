const GuildSettings = require("../../models/settings");

module.exports = {
  name: "premium",
  aliases: [],
  category: "info",
  description: "Check if your guild has premium or not",
  usage: "",
  cooldown: 5000,
  run: async (client, message, args) => {
        
      var storedSettings = await GuildSettings.findOne({ gid: message.guild.id });
    
    if (storedSettings.premium == true) {
      return message.channel.send(`This guild currently has a premium subscription.`)
    } else {
      return message.channel.send(`This guild currently does not have premuim! Buy it here - ${process.env.domain}/guild/${message.guild.id}/premuim`)
    }
  }
};