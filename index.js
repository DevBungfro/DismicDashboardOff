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
client.cooldowns = new Discord.Collection();

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
  
  if (channel && storedSettings.joinon == true) {
    
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
  let cooldown = client.cooldowns.get(cmd);

//IF COMMAND IS NOT FOUND IT SEARCHES FOR THE ALIASES
  if (!command) command = client.commands.get(client.aliases.get(cmd));
  if (!cooldown) cooldown = client.cooldowns.get(client.aliases.get(cmd));

    if (onCoolDown(message, command, cooldown)) {
      let cool = new Discord.MessageEmbed()
      .setDescription(`❌ Please wait ${onCoolDown(message, command, cooldown)} more Second(s) before reusing the ${command.name} command.`)
      return message.channel.send({embeds : [cool]})
    }if (command) command.run(client, message, args);


});

 function onCoolDown(message, command, cooldown) {
    if(!message || !message.client) throw "No Message with a valid DiscordClient granted as First Parameter";
    if(!command || !command.name) throw "No Command with a valid Name granted as Second Parameter";
    const client = message.client;
    if (!client.cooldowns.has(command.name)) { //if its not in the cooldown, set it too there
      client.cooldowns.set(command.name, new Discord.Collection());
    }
    const now = Date.now(); //get the current time
    const timestamps = client.cooldowns.get(command.name); //get the timestamp of the last used commands
    const cooldownAmount = (cooldown) * 1000; //get the cooldownamount of the command, if there is no cooldown there will be automatically 1 sec cooldown, so you cannot spam it^^
    if (timestamps.has(message.author.id)) { //if the user is on cooldown
      const expirationTime = timestamps.get(message.author.id) + cooldownAmount; //get the amount of time he needs to wait until he can run the cmd again
      if (now < expirationTime) { //if he is still on cooldonw
        const timeLeft = (expirationTime - now) / 1000; //get the lefttime
        //return true
        return timeLeft
      }
      else {
        //if he is not on cooldown, set it to the cooldown
        timestamps.set(message.author.id, now); 
        //set a timeout function with the cooldown, so it gets deleted later on again
        setTimeout(() => timestamps.delete(message.author.id), cooldownAmount); 
        //return false aka not on cooldown
        return false;
      }
    }
    else {
      //if he is not on cooldown, set it to the cooldown
      timestamps.set(message.author.id, now); 
      //set a timeout function with the cooldown, so it gets deleted later on again
      setTimeout(() => timestamps.delete(message.author.id), cooldownAmount); 
      //return false aka not on cooldown
      return false;
    }
  }


// Listening for error & warn events.
client.on("error", console.error);
client.on("warn", console.warn);

// We login into the bot.
client.login(process.env.token);