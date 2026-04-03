const { getSenderId } = require('../utils/identity');
const { getTodayMissionsForUser } = require('../utils/progression');

module.exports = {
    name: 'missioni',
    description: 'Mostra le missioni giornaliere con ricompense',
    async execute(msg) {
        const sender = await getSenderId(msg);
        const daily = getTodayMissionsForUser(sender);

        const lines = ['🎯 MISSIONI GIORNALIERE 🎯', '', `Data: ${daily.date}`, ''];

        for (const mission of daily.missions) {
            const status = mission.completed ? '✅' : '🕒';
            const progress = Math.min(mission.progress, mission.target);
            lines.push(`${status} ${mission.emoji} ${mission.title}`);
            lines.push(`Gioco: ${mission.game} | Progresso: ${progress}/${mission.target} | Ricompensa: ${mission.reward}`);
            lines.push('');
        }

        lines.push('💡 Le ricompense vengono accreditate automaticamente appena completi la missione.');
        await msg.reply(lines.join('\n').trim());
    }
};
