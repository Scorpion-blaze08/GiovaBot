const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'data');

function readJson(file, def = {}) {
    const p = path.join(DATA, file);
    try {
        if (!fs.existsSync(p)) return def;
        return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch { return def; }
}

module.exports = {
    name: 'stats',
    description: 'Statistiche complete di un giocatore',
    async execute(msg, client) {
        const sender = msg.author || msg.from;
        const mentions = await msg.getMentions();

        let targetId = sender;
        let targetName = require('../utils/nomi').getNomeCache(sender) || sender.split('@')[0];

        if (mentions.length > 0) {
            targetId = mentions[0].id._serialized;
            targetName = mentions[0].pushname || mentions[0].verifiedName || targetId.split('@')[0];
        }

        const nomi = readJson('nomi_giocatori.json');
        if (nomi[targetId]) targetName = nomi[targetId];

        const giochi = ['slot', 'dado', 'roulette', 'cavalli', 'scelta', 'blackjack', 'pesca', 'duello', 'torneo', 'battaglia'];
        const emojiGiochi = { slot:'🎰', dado:'🎲', roulette:'🔫', cavalli:'🐎', scelta:'🎯', blackjack:'🃏', pesca:'🎣', duello:'⚔️', torneo:'🏆', battaglia:'🏰' };

        let totPunti = 0, totVittorie = 0, totPartite = 0;
        let righe = [];

        for (const g of giochi) {
            const classifica = readJson(`classifica_${g}.json`);
            // Cerca per nome o per ID
            const entry = classifica[targetName] || classifica[targetId];
            if (entry && entry.partite > 0) {
                totPunti += entry.punti || 0;
                totVittorie += entry.vittorie || 0;
                totPartite += entry.partite || 0;
                const wr = entry.partite > 0 ? Math.round((entry.vittorie / entry.partite) * 100) : 0;
                righe.push(`${emojiGiochi[g]} ${g}: ${entry.punti}pt | ${entry.vittorie}V/${entry.partite}P (${wr}%)`);
            }
        }

        // Streak
        const streaks = readJson('game_streaks.json');
        const userStreaks = streaks[targetId] || {};
        let streakLines = [];
        for (const [game, s] of Object.entries(userStreaks)) {
            if (s.best > 0) streakLines.push(`${emojiGiochi[game] || '🎮'} ${game}: record ${s.best} | attuale ${s.current}`);
        }

        // Inventario pesca
        const inventario = readJson('inventario_pesca.json');
        const inv = inventario[targetId];
        const pescate = inv?.statistiche?.pescate || 0;

        let resp = `📊 STATISTICHE DI ${targetName.toUpperCase()}\n\n`;

        if (righe.length === 0) {
            resp += '🎮 Nessuna partita giocata ancora!\n';
        } else {
            resp += righe.join('\n');
            resp += `\n\n─────────────────\n`;
            resp += `💰 Punti totali: ${totPunti}\n`;
            resp += `🏆 Vittorie totali: ${totVittorie}\n`;
            resp += `🎮 Partite totali: ${totPartite}\n`;
            const wrTot = totPartite > 0 ? Math.round((totVittorie / totPartite) * 100) : 0;
            resp += `📈 Win rate: ${wrTot}%\n`;
        }

        if (pescate > 0) resp += `🎣 Pescate: ${pescate}\n`;

        if (streakLines.length > 0) {
            resp += `\n🔥 STREAK RECORD:\n${streakLines.join('\n')}`;
        }

        await msg.reply(resp);
    }
};
