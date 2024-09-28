const { SlashCommandBuilder } = require('discord.js');
const os = require('os');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Here\'s how the bot\'s holding up! Stats and server info inside.'),
    async execute(interaction) {
        // Get bot stats
        const ping = interaction.client.ws.ping;
        const uptime = interaction.client.uptime; // Bot uptime in ms
        const formattedUptime = formatUptime(uptime); // Format uptime to readable string
        const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // In MB
        const stickyChannelsCount = interaction.client.stickyChannels.size; // Sticky channels count

        // Get OS stats
        const osType = os.type(); // OS type (Linux, Windows, etc.)
        const osUptime = os.uptime(); // OS uptime in seconds
        const formattedOsUptime = formatUptime(osUptime * 1000); // Convert seconds to ms
        const freeMem = os.freemem() / 1024 / 1024; // Free memory in MB
        const totalMem = os.totalmem() / 1024 / 1024; // Total memory in MB
        const cpuCores = os.cpus().length; // Number of CPU cores

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

// Helper function to format uptime
function formatUptime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}
