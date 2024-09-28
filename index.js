const { Client, GatewayIntentBits, Events, ChannelType, REST, Routes } = require('discord.js');
require('dotenv').config();
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const express = require('express');
const os = require('os');

const db = new sqlite3.Database('./database.sql', (err) => {
    if (err) {
        console.error('Error opening database: ' + err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

db.run(`CREATE TABLE IF NOT EXISTS sticky_channels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_id TEXT UNIQUE NOT NULL,
    sticky_message TEXT NOT NULL,
    last_message_id TEXT
);`, (err) => {
    if (err) {
        console.error('Error creating table: ' + err.message);
    }
});

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

client.commands = new Map();
const commands = [];

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
}

client.once(Events.ClientReady, async () => {
    console.log(`Logged in as ${client.user.tag}`);

    const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);
    try {
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
    } catch (error) {
        console.error('Error registering commands:', error);
    }

    db.all(`SELECT channel_id, sticky_message FROM sticky_channels`, [], (err, rows) => {
        if (err) {
            console.error('Error fetching sticky channels: ' + err.message);
            return;
        }
        client.stickyChannels = new Map(rows.map(row => [row.channel_id, row.sticky_message]));
    });

    setInterval(async () => {
        for (const [channelId, stickyMessage] of client.stickyChannels) {
            try {
                const channel = await client.channels.fetch(channelId);

                if (channel && channel.type === ChannelType.GuildText) {
                    const permissions = channel.permissionsFor(client.user);
                    if (!permissions.has('SendMessages') || !permissions.has('ViewChannel')) {
                        console.log(`Missing permissions in channel: ${channelId}. Removing from sticky message list.`);
                        
                        client.stickyChannels.delete(channelId);
                        db.run(`DELETE FROM sticky_channels WHERE channel_id = ?`, [channelId]);

                        continue;
                    }

                    const lastMessage = await channel.messages.fetch({ limit: 1 });
                    const stickyMessageId = await new Promise((resolve) => {
                        db.get(`SELECT last_message_id FROM sticky_channels WHERE channel_id = ?`, [channelId], (err, row) => {
                            resolve(row ? row.last_message_id : null);
                        });
                    });

                    if (lastMessage.size === 0 || lastMessage.first().id !== stickyMessageId) {
                        const newMessage = await channel.send(stickyMessage);
                        db.run(`UPDATE sticky_channels SET last_message_id = ? WHERE channel_id = ?`, [newMessage.id, channelId]);

                        if (stickyMessageId) {
                            try {
                                const stickyMessageToDelete = await channel.messages.fetch(stickyMessageId);
                                await stickyMessageToDelete.delete();
                            } catch (err) {
                                // Ignore channel
                            }
                        }
                    }
                }
            } catch (error) {
                if (error.code === 10003) { // Unknown Channel
                    client.stickyChannels.delete(channelId);
                    db.run(`DELETE FROM sticky_channels WHERE channel_id = ?`, [channelId]); // Cleanup DB
                } else {
                    console.error('Error in sticky message sending:', error);
                }
            }
        }
    }, 5000);
});

// Handle interactions/commands
client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction, db, client);
    } catch (error) {
        console.error('Error executing command:', error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

client.login(process.env.DISCORD_TOKEN);

// Website

const app = express();
const port = process.env.PORT;

app.use(express.static('public'));

// Route to get bot info
app.get('/bot-info', (req, res) => {
    res.json({
        name: client.user.username,
        avatar: client.user.displayAvatarURL()
    });
});

// Status route
app.get('/status', (req, res) => {
    const botPing = client.ws.ping;
    const botUptime = formatUptime(client.uptime);
    const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const serverCount = client.guilds.cache.size;

    db.get('SELECT COUNT(*) AS stickyCount FROM sticky_channels', [], (err, row) => {
        if (err) {
            console.error('Error fetching sticky channels count: ' + err.message);
            res.status(500).send('Error fetching data');
            return;
        }

        const stickyChannelCount = row.stickyCount;

        const osUptime = formatUptime(os.uptime() * 1000);
        const totalMem = (os.totalmem() / 1024 / 1024).toFixed(2);
        const freeMem = (os.freemem() / 1024 / 1024).toFixed(2);
        const cpuCount = os.cpus().length;

        res.json({
            bot: {
                ping: botPing,
                uptime: botUptime,
                memoryUsage,
                serverCount,
                stickyChannelCount
            },
            system: {
                osUptime,
                totalMem,
                freeMem,
                cpuCount
            }
        });
    });
});

app.listen(port, () => {
    console.log(`Website is running on http://localhost:${port}`);
});

function formatUptime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}
