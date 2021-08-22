/*
  > Index.Js is the entry point of our application.
*/
// We import the modules.
require("dotenv").config()
const Discord = require("discord.js");
const mongoose = require("mongoose");
const GuildSettings = require("./models/settings");
const Dashboard = require("./dashboard/dashboard");
const fetch = require('node-fetch');

// We instiate the client and connect to database.
const client = new Discord.Client({
  ws: {
    intents: [
      "GUILDS",
      "GUILD_MEMBERS",
      "GUILD_MESSAGES"
    ]
  }
});

mongoose.connect(process.env.mongodbUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// We listen for client's ready event.
client.on("ready", async () => {
  console.log("Fetching members...");
  require("./keep-alive.js")

  for (const [id, guild] of client.guilds.cache) {
    await guild.members.fetch();
  }

  console.log("Fetched members.");

  console.log(`Bot is ready. (${client.guilds.cache.size} Guilds - ${client.channels.cache.size} Channels - ${client.users.cache.size} Users)`);
  Dashboard(client);
  client.user.setActivity('Dismic', ({ type: "WATCHING" }))
  
  var params = {
    username: "Dismic Status",
    avatar_url: "",
    content: "Dismic's Bot and Dashboard is up!",
    embeds: [
        {
            "title": "Dismic's Status",
            "color": "#008000",
            "thumbnail": {
                "url": "",
            },
            "fields": [
                {
                    "name": "Dismic is online!",
                    "value": "Dismic has been activated!",
                    "inline": true
                }
            ]
        }
    ]
}
  
  fetch('https://discord.com/api/webhooks/879096550238859324/pOYNpzVzLB6gBCzcik5SZsDpHP0Oep5So_AC458IzOMt9fsHugqzD9r7xX3yg7O6-glL', {
    method: "POST",
    headers: {
        'Content-type': 'application/json'
    },
    body: JSON.stringify(params)
}).then(res => {
    console.log(res);
}) 
});

// We listen for message events.
client.on("message", async (message) => {
  // Declaring a reply function for easier replies - we grab all arguments provided into the function and we pass them to message.channel.send function.

  // Doing some basic command logic.
  if (message.author.bot) return;
  if (!message.channel.permissionsFor(message.guild.me).has("SEND_MESSAGES")) return;
 
  // Retriving the guild settings from database.
  var storedSettings = await GuildSettings.findOne({ gid: message.guild.id });
  if (!storedSettings) {
    // If there are no settings stored for this guild, we create them and try to retrive them again.
    const newSettings = new GuildSettings({
      gid: message.guild.id
    });
    await newSettings.save().catch(()=>{});
    storedSettings = await GuildSettings.findOne({ gid: message.guild.id });
  }

  // If the message does not start with the prefix stored in database, we ignore the message.
  if (message.content.indexOf(storedSettings.prefix) !== 0) return;

  // We remove the prefix from the message and process the arguments.
  const args = message.content.slice(storedSettings.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  // If command is ping we send a sample and then edit it with the latency.
  if (command === "dashboard") {
    const roundtripMessage = await message.reply(`Your server dashboard is: ${process.env.domain}/guild/${message.guild.id}`);
  }
});

client.off("ready", async => {
  var params = {
    username: "Dismic Status",
    avatar_url: "",
    content: "Dismic's Bot and Dashboard is offline!",
    embeds: [
        {
            "title": "Dismic's Status",
            "color": "##ff0000",
            "thumbnail": {
                "url": "",
            },
            "fields": [
                {
                    "name": "Dismic is offline!",
                    "value": "Dismic has been deactivated!",
                    "inline": true
                }
            ]
        }
    ]
}
  
  fetch('https://discord.com/api/webhooks/879096550238859324/pOYNpzVzLB6gBCzcik5SZsDpHP0Oep5So_AC458IzOMt9fsHugqzD9r7xX3yg7O6-glL', {
    method: "POST",
    headers: {
        'Content-type': 'application/json'
    },
    body: JSON.stringify(params)
}).then(res => {
    console.log(res);
}) 
})

// Listening for error & warn events.
client.on("error", console.error);
client.on("warn", console.warn);

// We login into the bot.
client.login(process.env.token);