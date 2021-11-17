/*
  > Index.Js is the entry point of our application.
*/
// We import the modules.
require("dotenv").config();
const Discord = require("discord.js");
const mongoose = require("mongoose");
const GuildSettings = require("./models/settings");
const Dashboard = require("./dashboard/dashboard");
const cooldown = {};
const { MessageEmbed, WebhookClient, Intents } = require("discord.js");

const webhookClient = new WebhookClient({
  id: process.env.webhookId,
  token: process.env.webhookToken
});
// We instiate the client and connect to database.
const client = new Discord.Client({

  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS]
});

const fs = require("fs");

//HANDLER VARIABLES
client.commands = new Discord.Collection();
client.slashCommands = new Discord.Collection();

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

  require("./keep-alive.js");

  for (const [id, guild] of client.guilds.cache) {
    await guild.members.fetch();
  }

  console.log("Fetched members.");

  console.log(
    `Bot is ready. (${client.guilds.cache.size} Guilds - ${client.channels.cache.size} Channels - ${client.users.cache.size} Users)`
  );
  Dashboard(client);
  client.user.setActivity("Dismic", { type: "WATCHING" });
});

client.on("guildCreate", async guild => {
  const embed = new MessageEmbed().setTitle("Error").setColor("#00FF00");

  webhookClient.send({
    content:
      "(" +
      client.guilds.cache.size +
      ") I was just added to a guild - " +
      guild.name,
    embeds: [embed]
  });
});

client.on("guildMemberAdd", async member => {
  var storedSettings = await GuildSettings.findOne({ gid: member.guild.id });
  if (!storedSettings) {
    // If there are no settings stored for this guild, we create them and try to retrive them again.
    const newSettings = new GuildSettings({
      gid: member.guild.id,
      premium: true
    });
    await newSettings.save().catch(() => {});
    storedSettings = await GuildSettings.findOne({ gid: member.guild.id });
  }

  let channel = member.guild.channels.cache.get(storedSettings.joinchannel);

  if (channel && storedSettings.joinon == true) {
    let msg = storedSettings.joinmsg;

    channel.send(
      msg.replace(/%user%|%guild%|%members%|%memberswithbots%/g, function(w) {
        switch (w) {
          case "%guild%":
            return member.guild.name;

          case "%user%":
            return member.user.username;
          case "%members%":
            return member.guild.members.cache.filter(
              member => !member.user.bot
            ).size;
          case "%memberswithbots%":
            return member.guild.members.cache.size;
        }
      })
    );
  }

  if (member.guild.id == "870024355961258014") {
    member.roles.add("870024355973832770");
  }
});

// We listen for message events.
client.on("messageCreate", async message => {
  // Declaring a reply function for easier replies - we grab all arguments provided into the function and we pass them to message.channel.send function.

  // Doing some basic command logic.
  if (message.author.bot) return;
  if (!message.channel.permissionsFor(message.guild.me).has("SEND_MESSAGES"))
    return;

  // Retriving the guild settings from database.
  var storedSettings = await GuildSettings.findOne({ gid: message.guild.id });
  if (!storedSettings) {
    // If there are no settings stored for this guild, we create them and try to retrive them again.
    const newSettings = new GuildSettings({
      gid: message.guild.id
    });
    await newSettings.save().catch(() => {});
    storedSettings = await GuildSettings.findOne({ gid: message.guild.id });
  }

  // If the message does not start with the prefix stored in database, we ignore the message.
  if (message.content.indexOf(storedSettings.prefix) !== 0) return;

  // We remove the prefix from the message and process the arguments.
  const args = message.content
    .slice(storedSettings.prefix.length)
    .trim()
    .split(/ +/g);
  const cmd = args.shift().toLowerCase();

  let command = client.commands.get(cmd);

  //IF COMMAND IS NOT FOUND IT SEARCHES FOR THE ALIASES
  if (!command) command = client.commands.get(client.aliases.get(cmd));

  if (command.cooldown) {
    if (!cooldown[message.author.id]) cooldown[message.author.id] = {};

    let time = cooldown[message.author.id][command.name] || 0;
    if (time && time > Date.now()) {
      let wait = Math.ceil((time - Date.now()) / 1000);
      let cool = new Discord.MessageEmbed().setDescription(
        `❌ Please wait ${wait} more Second(s) before reusing the ${command.name} command.`
      );
      return message.channel.send(cool);
    }
    cooldown[message.author.id][command.name] = Date.now() + command.cooldown;
  }

  if (command) command.run(client, message, args);
});

// Listening for error & warn events.
client.on("error", console.error);
client.on("warn", console.warn);

// We login into the bot.
client.login(process.env.token);
