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

const fs = require("fs")

//HANDLER VARIABLES
client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();

//HANDLER PATH INITIALIZATION
["command"].forEach(handler => {
  require(`./handlers/${handler}`)(client);
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
  
})
  
client.on("guildMemberAdd", async (member) => {
    var storedSettings = await GuildSettings.findOne({ gid: member.guild.id });
  if (!storedSettings) {
    // If there are no settings stored for this guild, we create them and try to retrive them again.
    const newSettings = new GuildSettings({
      gid: member.guild.id
    });
    await newSettings.save().catch(()=>{});
    storedSettings = await GuildSettings.findOne({ gid: member.guild.id });
  }
  
  let channel = member.guild.channels.cache.get(storedSettings.joinchannel)
  
  if (channel) {
    
    let msg = storedSettings.joinmsg
    

    
    
    channel.send(msg.replace(/%user%|%guild%/g, function(w){

        switch(w){
           case '%guild%':
                 return member.guild.name ;

              case '%user%':
                   return member.user.username;
          }

    }))

    
    
  }
})

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
  const cmd = args.shift().toLowerCase();
  
  let command = client.commands.get(cmd);
  
//IF COMMAND IS NOT FOUND IT SEARCHES FOR THE ALIASES
  if (!command) command = client.commands.get(client.aliases.get(cmd));
  
//IF IT RECOGNISES IT AS AN COMMAND IT RUNS THE COMMAND
if (command) command.run(client, message, args);


});


// Listening for error & warn events.
client.on("error", console.error);
client.on("warn", console.warn);

// We login into the bot.
client.login(process.env.token);