let count = 0;
const fetch = require("node-fetch");
var http = require("http");
var https = require("https");
const { MessageEmbed, WebhookClient } = require("discord.js");

const webhookClient = new WebhookClient({
  id: process.env.webhookId,
  token: process.env.webhookToken
});
setInterval(async () => {
  try {
    await fetch(process.env.apiUrl);
    await fetch(process.env.domain);

    const embed = new MessageEmbed().setTitle("Success").setColor("#00FF00");

    webhookClient.send({
      content: "(" + ++count + ") Kept api/dashboard alive",
      embeds: [embed]
    });
  } catch (err) {
    console.log(++count + " error keeping api and dashboard alive");
    console.log(err);

    const embed = new MessageEmbed().setTitle("Error").setColor("#FF0000");

    webhookClient.send({
      content: "(" + ++count + ") Error keeping api/dashboard alive - " + err,
      embeds: [embed]
    });
  }
}, 2 * 60 * 1000);
