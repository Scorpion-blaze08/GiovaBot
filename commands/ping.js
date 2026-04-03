module.exports = {
    name: 'ping',
    description: 'Check bot latency and uptime',
    async execute(msg) {
        const startTime = Date.now();
        
        const uptime = global.getUptime();
        const seconds = Math.floor((uptime / 1000) % 60);
        const minutes = Math.floor((uptime / (1000 * 60)) % 60);
        const hours = Math.floor((uptime / (1000 * 60 * 60)) % 24);
        const uptimeStr = `${hours}h ${minutes}m ${seconds}s`;
        
        await msg.reply(`PONG! Calcolando...`);
        const responseTime = Date.now() - startTime;
        
        // Invia un secondo messaggio con il tempo effettivo
        setTimeout(() => {
            msg.reply(`Tempo di risposta: ${responseTime}ms\nBot attivo da ${uptimeStr}`);
        }, 100);
    }
};
