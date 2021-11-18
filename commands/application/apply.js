
const Guild = require('../../models/settings');
const app = require("../../models/application/application.js");
const discord = require("discord.js")
module.exports = {
  name: "apply",
  aliases: ["applicationapply", "application", "appapply"],
  usage: "",
  category: "Applications",
  examples: ["addquestion <Question> ~ <Question>"],
  description: "Add questions to the list and when you apply they will be there",
  cooldown: 5000,
  run: async (client, message, args) => {
    var guildDB = await Guild.findOne({ gid: message.guild.id });
    if (!guildDB) {
      // If there are no settings stored for this guild, we create them and try to retrive them again.
      const newSettings = new Guild({
        gid: message.guild.id
      });
      await newSettings.save().catch(() => { });
      guildDB = await Guild.findOne({ gid: message.guild.id });
    }



    const closed = new discord.MessageEmbed()
      .setDescription(`Applications are currently closed or there are no questions availble`)
      .setColor("RED")




    let db = await app.findOne({
      guildID: message.guild.id
    })

    if (!db) {
      let newAppDB = new app({
        guildID: message.guild.id,
        questions: [],
        appToggle: false,
        appLogs: null
      })
      await newAppDB.save().catch((err) => { console.log(err) })

    }


    if (db.questions.length === 0 || db.questions.length < 1) return message.channel.send({ embeds: [closed] });


    message.channel.send("I have started this process in your DM's. Type `cancel` to cancel")

    const dmChannel =  await message.author.send("This is the application!")


      const filter = (m) => m.author.id === message.author.id;

    const questions = db.questions;
    const collector = message.channel.createMessageCollector(filter, { time: 15000 });
    let i = 0;
    const res = []

    message.channel.send(questions[0])
    collector.on('collect', msg => {

      if (!msg.author.id == message.author.id) return;
      console.log(msg.author.username)

      if (questions.length == i) return collector.stop("MAX");
      const answer = msg.content;
      res.push({ question: questions[i], answer })
      i++
      if (questions.length == i) return collector.stop("MAX");
      else {
        message.channel.send(questions[i])
      }
    })

    collector.on('end',(collected, reason) => {
      i = -1
      if (reason == "MAX") {

      }
    })

  }
}