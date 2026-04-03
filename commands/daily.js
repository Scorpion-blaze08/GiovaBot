const { aggiungiMonete, getSaldo } = require('../utils/economia');
const { getNomeCache } = require('../utils/nomi');
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'daily.json');

function carica() {
    try {
        if (!fs.existsSync(FILE)) return {};
        return JSON.parse(fs.readFileSync(FILE, 'utf8'));
    } catch { return {}; }
}

function salva(data) {
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

async function getSenderId(msg) {
    try {
        const contact = await msg.getContact();
        return contact.id._serialized;
    } catch {
        return msg.author || msg.from;
    }
}

module.exports = {
    name: 'daily',
    description: 'Ritira il bonus giornaliero di GiovaCoins',
    async execute(msg) {
        const sender = await getSenderId(msg);
        const nome = getNomeCache(sender) || sender.split('@')[0];
        const daily = carica();
        const ora = Date.now();
        const oggi = new Date().toDateString();

        const utente = daily[sender] || { ultimoRitiro: null, streak: 0, ultimoGiorno: null };

        if (utente.ultimoGiorno === oggi) {
            const rimanente = (utente.ultimoRitiro + 24 * 60 * 60 * 1000) - ora;
            const ore = Math.floor(rimanente / (1000 * 60 * 60));
            const min = Math.floor((rimanente % (1000 * 60 * 60)) / (1000 * 60));
            await msg.reply(`⏰ Hai già ritirato il daily oggi!\n\n🕐 Prossimo daily tra: ${ore}h ${min}m\n🔥 Streak attuale: ${utente.streak} giorni`);
            return;
        }

        const ieri = new Date();
        ieri.setDate(ieri.getDate() - 1);
        utente.streak = utente.ultimoGiorno === ieri.toDateString() ? (utente.streak || 0) + 1 : 1;

        let importo = 50;
        let bonus = '';
        if (utente.streak >= 30) { importo = 500; bonus = '🏆 STREAK 30 GIORNI! BONUS LEGGENDARIO!'; }
        else if (utente.streak >= 14) { importo = 300; bonus = '💎 STREAK 2 SETTIMANE! BONUS EPICO!'; }
        else if (utente.streak >= 7) { importo = 200; bonus = '🔥 STREAK SETTIMANALE! BONUS SPECIALE!'; }
        else if (utente.streak >= 3) { importo = 100; bonus = '✨ STREAK 3 GIORNI! BONUS EXTRA!'; }

        utente.ultimoRitiro = ora;
        utente.ultimoGiorno = oggi;
        daily[sender] = utente;
        salva(daily);

        const nuovoSaldo = aggiungiMonete(sender, importo, nome);

        let resp = `🪙 DAILY RITIRATO!\n\n💰 +${importo} GiovaCoins\n`;
        if (bonus) resp += `${bonus}\n`;
        resp += `🔥 Streak: ${utente.streak} giorni\n💼 Saldo totale: ${nuovoSaldo} GiovaCoins\n\n`;
        resp += utente.streak < 7 ? `📅 Torna domani per lo streak!\n🎯 A 7 giorni: +200 GiovaCoins!` : `💡 Continua così per bonus ancora più grandi!`;

        await msg.reply(resp);
    }
};
