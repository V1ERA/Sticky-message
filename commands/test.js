const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('Check the bot\'s ping'),
    async execute(interaction) {
        const ping = interaction.client.ws.ping;
        await interaction.reply({
            content: `🏓 Pong! Latency is ${ping}ms`,
            ephemeral: true
        });
    },
};
