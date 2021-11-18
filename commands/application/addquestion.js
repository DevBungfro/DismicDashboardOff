
const Guild = require('../../models/settings');
const app = require("../../models/application/application.js");
const discord = require("discord.js")

module.exports = {
  name: "addquestion",
  aliases: ["addquestions", "applicationquestions", "appquestions"],
  usage: "<question>",
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


    let questions = args.slice(0).join(" ")



    let maxQuestions = 10
    if (guildDB.premium === true) {
      maxQuestions = 25
    }

    const embed1 = new discord.MessageEmbed().setColor("RED").setDescription("Please add questions to your args\n\nTip: Use the ~ symbol to seperate each question!")

    const embed2 = new discord.MessageEmbed().setColor("GREEN").setDescription("Sucessfuly added all questions.")

    if (!questions) return message.channel.send({embeds: [embed1]})



    let split = questions.split("~")

    await app.findOne({
      guildID: message.guild.id
    }, async (err, db) => {

      let arr = []

      if (!db) {
        let actualArr = arr.concat(split)
        console.log(actualArr)
        if (actualArr.length > maxQuestions) {
          return message.channel.send({embeds: [embed1]})
        }
        let newAppDB = new app({
          guildID: message.guild.id,
          questions: actualArr,
          appToggle: false,
          appLogs: ' '
        })
        await newAppDB.save().catch((err) => { console.log(err) })

        return message.channel.send({embeds: [embed2]})
      }

      let ar = await db.questions
      let actualArr = ar.concat(split)

      if (actualArr.length > maxQuestions) {
        returnmessage.channel.send({embeds: [embed1]})
      }
      await db.updateOne({
        questions: actualArr
      })

      return message.channel.send({embeds: [embed2]})

    })


  }
}
