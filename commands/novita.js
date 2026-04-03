const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'updates_feed.json');

function readFeed() {
    try {
        if (!fs.existsSync(FILE)) return [];
        return JSON.parse(fs.readFileSync(FILE, 'utf8'));
    } catch {
        return [];
    }
}

module.exports = {
    name: 'novita',
    description: 'Mostra gli ultimi aggiornamenti pubblici del bot',
    async execute(msg) {
        const feed = readFeed().slice(0, 5);

        if (!feed.length) {
            await msg.reply('📭 Nessuna novita disponibile al momento.');
            return;
        }

        const lines = ['📢 ULTIME NOVITÀ DEL BOT 📢', ''];
        for (const entry of feed) {
            lines.push(`${entry.emoji} ${entry.title} (${entry.date})`);
            for (const item of entry.items) {
                lines.push(`• ${item}`);
            }
            lines.push('');
        }
        lines.push('💡 Usa .missioni, .achievements e .pesca help per scoprire tutto.');
        await msg.reply(lines.join('\n').trim());
    }
};
