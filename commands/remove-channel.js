const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove-channel')
        .setDescription('Remove a channel for sticky messages')
        .addChannelOption(option => 
            option.setName('channel')
                .setDescription('The channel to remove from sticky messages')
                .setRequired(true)
        ),
    async execute(interaction, db, client) {
        // Check if the member has admin permissions
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            return interaction.reply({ 
                content: 'You do not have permission to use this command!', 
                ephemeral: true 
            });
        }

        const channel = interaction.options.getChannel('channel');

        db.get(`SELECT channel_id FROM sticky_channels WHERE channel_id = ?`, [channel.id], (err, row) => {
            if (!row) {
                return interaction.reply({ content: `This channel isn't set up for sticky messages!`, ephemeral: true });
            }

            db.run(`DELETE FROM sticky_channels WHERE channel_id = ?`, [channel.id], (err) => {
                if (err) {
                    return interaction.reply({ content: 'Failed to remove channel from sticky messages.', ephemeral: true });
                }
                client.stickyChannels.delete(channel.id);
                interaction.reply({ 
                    content: `Sticky messages will no longer be sent to <#${channel.id}>.`, 
                    ephemeral: true 
                });
            });
        });
    },
};
