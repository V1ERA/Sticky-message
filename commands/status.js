const { SlashCommandBuilder } = require('discord.js');
const os = require('os');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Here\'s how the bot\'s holding up! Stats and server info inside.'),
    async execute(interaction) {
        const ping = interaction.client.ws.ping;
        const uptime = interaction.client.uptime;
        const formattedUptime = formatUptime(uptime);
        const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
        const stickyChannelsCount = interaction.client.stickyChannels.size;

        const osType = os.type();
        const osUptime = os.uptime();
        const formattedOsUptime = formatUptime(osUptime * 1000);
        const freeMem = os.freemem() / 1024 / 1024;
        const totalMem = os.totalmem() / 1024 / 1024;
        const cpuCores = os.cpus().length;

        await interaction.reply({
            content: `**Bot Status**:
🏓 **Ping**: ${ping}ms
🕒 **Uptime**: ${formattedUptime}
💾 **Memory Usage**: ${memoryUsage.toFixed(2)} MB
📌 **Sticky Channels**: ${stickyChannelsCount}

**System Status**:
🖥️ **OS**: ${osType}
🕒 **OS Uptime**: ${formattedOsUptime}
🧠 **Free Memory**: ${freeMem.toFixed(2)} MB / ${totalMem.toFixed(2)} MB
💻 **CPU Cores**: ${cpuCores}`,
            ephemeral: true
        });
    },
};

function formatUptime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}
