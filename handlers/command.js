//INITIALIZATION
const { readdirSync } = require("fs");
const ascii = require("ascii-table");
const { glob } = require("glob");
const { promisify } = require("util");
const { Client } = require("discord.js");

const globPromise = promisify(glob);
//NEW ASCII TABLE
let table = new ascii("Commands");
table.setHeading("Command", "Command Load Status");

//NEW MODULE
module.exports = async client => {
  //READS EVERY COMMAND IN COMMANDS FOLDER
  readdirSync("./commands/").forEach(dir => {
    //READS ONLY JS FILES
    const commands = readdirSync(`./commands/${dir}/`).filter(file =>
      file.endsWith(".js")
    );
 
//SHOWS THE LOADED COMMAND DURING THE STARTING OF THE BOT
for (let file of commands) {
      let pull = require(`../commands/${dir}/${file}`);

      if (pull.name) {
        client.commands.set(pull.name, pull);
        client.cooldowns.set(pull.name, pull.cooldown);

        table.addRow(file, "✅");
      } else {
        table.addRow(
          file,
          `❌  -> missing a help.name, or help.name is not a string.`
        );
        continue;
      }
  
//PULLS THE ALIASES
if (pull.aliases && Array.isArray(pull.aliases))
        pull.aliases.forEach(alias => client.aliases.set(alias, pull.name));
    }
  });
  
//LOG THE TABLE IN THE CONSOLE IN STRING FORM
console.log(table.toString());
  
      const slashCommands = await globPromise(
        `${process.cwd()}/SlashCommands/*/*.js`
    );

    const arrayOfSlashCommands = [];
    slashCommands.map((value) => {
        const file = require(value);
        if (!file?.name) return;
        client.slashCommands.set(file.name, file);
        if (["MESSAGE", "USER"].includes(file.type)) delete file.description;
        arrayOfSlashCommands.push(file);
    });
    client.on("ready", async () => {
        await client.application.commands.set(arrayOfSlashCommands);
    });
};