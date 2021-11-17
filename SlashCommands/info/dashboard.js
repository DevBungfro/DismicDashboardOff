const { Client, CommandInteraction } = require("discord.js");

module.exports = {
    name: "dashboard",
    description: "Shows your guild's dashboard link",

    /**
     *
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */
    run: async (client, interaction, args) => {
        interaction.followUp({ content: `${process.env.domain}/guild/${interaction.guild.id}` });
    },
};
