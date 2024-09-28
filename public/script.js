function fetchBotInfo() {
    fetch('/bot-info')
        .then(response => response.json())
        .then(data => {
            document.getElementById('botName').textContent = data.name;
            document.getElementById('botAvatar').src = data.avatar;
        })
        .catch(err => {
            console.error('Error fetching bot info:', err);
        });
}

function updateStatus() {
    fetch('/status')
        .then(response => response.json())
        .then(data => {
            document.getElementById('ping').textContent = data.bot.ping + ' ms';
            document.getElementById('uptime').textContent = data.bot.uptime;
            document.getElementById('memoryUsage').textContent = data.bot.memoryUsage + ' MB';
            document.getElementById('serverCount').textContent = data.bot.serverCount;
            document.getElementById('stickyChannelCount').textContent = data.bot.stickyChannelCount;

            document.getElementById('osUptime').textContent = data.system.osUptime;
            document.getElementById('totalMem').textContent = data.system.totalMem + ' MB';
            document.getElementById('freeMem').textContent = data.system.freeMem + ' MB';
            document.getElementById('cpuCount').textContent = data.system.cpuCount;
        })
        .catch(err => {
            console.error('Error fetching status:', err);
        });
}

window.onload = () => {
    fetchBotInfo();
    updateStatus();
};

setInterval(updateStatus, 1000);
