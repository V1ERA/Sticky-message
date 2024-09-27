const { SlashCommandBuilder, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('channel')
        .setDescription('Let’s manage those sticky message channels, shall we?')
        .addStringOption(option => 
            option.setName('action')
                .setDescription('Decide if you wanna add or ditch a sticky message channel!')
                .setRequired(true)
                .addChoices(
                    { name: 'add', value: 'add' },
                    { name: 'remove', value: 'remove' }
                )
        )
        .addChannelOption(option => 
            option.setName('channel')
                .setDescription('Pick a channel to wrangle those sticky messages!')
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('message')
                .setDescription('The sticky message to send (needed if you’re adding one!)')
                .setRequired(false)
        ),
    
    async execute(interaction, db, client) {
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            return interaction.reply({ 
                content: 'Oops! You don’t have the magic powers to use this command!', 
                ephemeral: true 
            });
        }

        const action = interaction.options.getString('action');
        const channel = interaction.options.getChannel('channel');
        const stickyMessage = interaction.options.getString('message');

        // Check if the channel is a text channel
        if (channel.type !== ChannelType.GuildText) {
            return interaction.reply({ 
                content: 'Hey there! We can only stick messages in text channels, so pick one of those!', 
                ephemeral: true 
            });
        }

        if (action === 'add') {
            if (!stickyMessage) {
                return interaction.reply({ 
                    content: 'Oops! Looks like you forgot to drop a sticky message for adding that channel!', 
                    ephemeral: true 
                });
            }

            db.get(`SELECT channel_id FROM sticky_channels WHERE channel_id = ?`, [channel.id], (err, row) => {
                if (row) {
                    return interaction.reply({ 
                        content: `Hey there! This channel is already rocking sticky messages!`, 
                        ephemeral: true 
                    });
                }

                db.run(`INSERT INTO sticky_channels (channel_id, sticky_message) VALUES (?, ?)`, [channel.id, stickyMessage], (err) => {
                    if (err) {
                        return interaction.reply({ 
                            content: 'Oops! Something went wrong while trying to add that channel for sticky messages.', 
                            ephemeral: true 
                        });
                    }

                    client.stickyChannels.set(channel.id, stickyMessage); // Store the channel
                    interaction.reply({ 
                        content: `Alright! Sticky messages are now on their way to <#${channel.id}> with the message: "${stickyMessage}"! 🎉`, 
                        ephemeral: true 
                    });
                });
            });
        } else if (action === 'remove') {
            db.get(`SELECT channel_id FROM sticky_channels WHERE channel_id = ?`, [channel.id], (err, row) => {
                if (!row) {
                    return interaction.reply({ 
                        content: `Oops! Looks like this channel isn't set up for sticky messages yet!`, 
                        ephemeral: true 
                    });
                }

                db.run(`DELETE FROM sticky_channels WHERE channel_id = ?`, [channel.id], (err) => {
                    if (err) {
                        return interaction.reply({ 
                            content: 'Uh-oh! I couldn\'t remove that channel from sticky messages. Something went wrong!', 
                            ephemeral: true 
                        });
                    }

                    client.stickyChannels.delete(channel.id);
                    interaction.reply({ 
                        content: `Alrighty! Sticky messages won't be sent to <#${channel.id}> anymore.`, 
                        ephemeral: true 
                    });
                });
            });
        } else {
            interaction.reply({ 
                content: 'Oops! Looks like you picked the wrong option. Choose "add" or "remove" next time! 😅', 
                ephemeral: true 
            });
        }
    },
};
