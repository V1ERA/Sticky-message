const { SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('eval')
        .setDescription('Run some JavaScript code and see what happens!')
        .addStringOption(option => 
            option.setName('code')
                .setDescription('The JavaScript code you wanna test out')
                .setRequired(true)
        ),
    async execute(interaction) {
        if (interaction.user.id !== process.env.DEVELOPER_ID) {
            return interaction.reply({ content: 'Whoa there! You can\'t use this command!', ephemeral: true });
        }

        const code = interaction.options.getString('code');

        try {
            eval(code);
        } catch (error) {
            await interaction.reply({ content: `❌ Oops! Something went wrong: \`${error.message}\``, ephemeral: true });
        }
    },
};
