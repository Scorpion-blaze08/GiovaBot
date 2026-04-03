const { aggiungiMonete } = require('../utils/economia');
const { getNomeCache } = require('../utils/nomi');
const { getSenderId } = require('../utils/identity');
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'daily.json');

function readDaily() {
    try {
        if (!fs.existsSync(FILE)) return {};
        return JSON.parse(fs.readFileSync(FILE, 'utf8'));
    } catch {
        return {};
    }
}

function writeDaily(data) {
    const dir = path.dirname(FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function getRewardForStreak(streak) {
    if (streak >= 30) return { amount: 500, bonus: '🏆 Streak 30 giorni! Premio leggendario!' };
    if (streak >= 14) return { amount: 300, bonus: '💎 Streak 14 giorni! Premio epico!' };
    if (streak >= 7) return { amount: 200, bonus: '🔥 Streak settimanale! Bonus speciale!' };
    if (streak >= 3) return { amount: 100, bonus: '✨ Streak di 3 giorni! Bonus extra!' };
    return { amount: 50, bonus: '' };
}

module.exports = {
    name: 'daily',
    description: 'Ritira il bonus giornaliero',
    async execute(msg) {
        const sender = await getSenderId(msg);
        const nome = getNomeCache(sender) || sender.split('@')[0];
        const data = readDaily();
        const now = Date.now();
        const today = new Date().toDateString();
        const user = data[sender] || { ultimoRitiro: null, streak: 0, ultimoGiorno: null };

        if (user.ultimoGiorno === today) {
            const remaining = Math.max(0, (user.ultimoRitiro + 24 * 60 * 60 * 1000) - now);
            const hours = Math.floor(remaining / (1000 * 60 * 60));
            const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
            await msg.reply([
                '⏳ DAILY GIÀ RITIRATO',
                '',
                `🕒 Torna tra: ${hours}h ${minutes}m`,
                `🔥 Streak attuale: ${user.streak} giorni`,
                '',
                '💡 Intanto puoi fare .missioni o .pesca.'
            ].join('\n'));
            return;
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        user.streak = user.ultimoGiorno === yesterday.toDateString() ? (user.streak || 0) + 1 : 1;

        const reward = getRewardForStreak(user.streak);
        user.ultimoRitiro = now;
        user.ultimoGiorno = today;
        data[sender] = user;
        writeDaily(data);

        const saldo = aggiungiMonete(sender, reward.amount, nome);
        const lines = [
            '🪙 DAILY RISCATTATO 🪙',
            '',
            `💰 Ricompensa: +${reward.amount} crediti`,
            `🔥 Streak: ${user.streak} giorni`,
            `🏦 Nuovo saldo: ${saldo}`,
            ''
        ];

        if (reward.bonus) {
            lines.push(reward.bonus);
            lines.push('');
        }

        lines.push(user.streak < 7
            ? '🎯 Continua: a 7 giorni il bonus sale ancora.'
            : '🚀 Continua così: più giorni fai, più il premio cresce.');

        await msg.reply(lines.join('\n'));
    }
};
