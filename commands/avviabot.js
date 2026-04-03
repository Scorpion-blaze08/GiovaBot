const { exec } = require('child_process');
const { getSenderId, isAdmin } = require('../utils/identity');

module.exports = {
    name: 'avviabot',
    description: 'Riavvia il bot (solo admin)',
    async execute(msg, client) {
        const sender = await getSenderId(msg);

        if (!isAdmin(sender)) {
            return msg.reply("❌ Non hai i permessi per riavviare il bot.");
        }

        await msg.reply("⚡ Riavvio bot in corso...");

        exec("pm2 restart whatsapp-bot", (error, stdout, stderr) => {
            if (error) {
                console.error(`Errore riavvio: ${error}`);
                msg.reply("❌ Errore durante il riavvio.");
                return;
            }
            msg.reply("✅ Bot riavviato correttamente!");
            console.log(stdout);
        });
    }
}
