const { SlashCommandBuilder, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add-channel')
        .setDescription('Add a channel for sticky messages')
        .addChannelOption(option => 
            option.setName('channel')
                .setDescription('The channel to add for sticky messages')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The sticky message to send')
                .setRequired(true)
        ),
    async execute(interaction, db, client) {
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            return interaction.reply({ content: 'You do not have permission to use this command!', ephemeral: true });
        }

        const channel = interaction.options.getChannel('channel');
        const stickyMessage = interaction.options.getString('message');

        if (channel.type !== ChannelType.GuildText) {
            return interaction.reply({ 
                content: 'You can only add text channels for sticky messages!', 
                ephemeral: true 
            });
        }

        db.get(`SELECT channel_id FROM sticky_channels WHERE channel_id = ?`, [channel.id], (err, row) => {
            if (row) {
                return interaction.reply({ content: `This channel is already set up for sticky messages!`, ephemeral: true });
            }

            db.run(`INSERT INTO sticky_channels (channel_id, sticky_message) VALUES (?, ?)`, [channel.id, stickyMessage], (err) => {
                if (err) {
                    return interaction.reply({ content: 'Failed to add channel for sticky messages.', ephemeral: true });
                }
                
                client.stickyChannels.set(channel.id, stickyMessage); // Store
                interaction.reply({ content: `Sticky messages will now be sent to <#${channel.id}> with the message: "${stickyMessage}"!`, ephemeral: true });
            });
        });
    },
};
