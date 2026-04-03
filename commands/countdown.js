const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'countdown.json');

function carica() {
    try {
        if (!fs.existsSync(FILE)) return [];
        return JSON.parse(fs.readFileSync(FILE, 'utf8'));
    } catch { return []; }
}

function salva(data) {
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function parseData(str) {
    // Accetta formato GG/MM/AAAA o GG/MM
    const parts = str.split('/');
    if (parts.length < 2) return null;
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const year = parts[2] ? parseInt(parts[2]) : new Date().getFullYear();
    const d = new Date(year, month, day);
    if (isNaN(d.getTime())) return null;
    return d;
}

module.exports = {
    name: 'countdown',
    description: 'Conto alla rovescia per verifiche ed eventi',
    async execute(msg) {
        const args = msg.body.split(' ').slice(1);
        const eventi = carica();

        // .countdown add [data GG/MM] [nome evento]
        if (args[0] === 'add' || args[0] === 'aggiungi') {
            if (args.length < 3) {
                await msg.reply('❌ Uso: .countdown add [GG/MM] [nome evento]\nEsempio: .countdown add 25/12 Natale');
                return;
            }
            const data = parseData(args[1]);
            if (!data) {
                await msg.reply('❌ Data non valida! Usa il formato GG/MM o GG/MM/AAAA');
                return;
            }
            const nome = args.slice(2).join(' ');
            eventi.push({ nome, data: data.toISOString(), aggiunto: new Date().toISOString() });
            salva(eventi);
            await msg.reply(`✅ Evento aggiunto!\n\n📅 ${nome} — ${args[1]}`);
            return;
        }

        // .countdown del [numero]
        if (args[0] === 'del' || args[0] === 'rimuovi') {
            const idx = parseInt(args[1]) - 1;
            if (isNaN(idx) || idx < 0 || idx >= eventi.length) {
                await msg.reply('❌ Numero non valido!');
                return;
            }
            const rimosso = eventi.splice(idx, 1)[0];
            salva(eventi);
            await msg.reply(`✅ Evento "${rimosso.nome}" rimosso!`);
            return;
        }

        // .countdown — mostra tutti
        if (eventi.length === 0) {
            await msg.reply('📅 Nessun evento in lista!\n\nUsa: .countdown add [GG/MM] [nome evento]');
            return;
        }

        const ora = new Date();
        ora.setHours(0, 0, 0, 0);

        // Ordina per data
        const ordinati = eventi
            .map(e => ({ ...e, dataObj: new Date(e.data) }))
            .sort((a, b) => a.dataObj - b.dataObj);

        let resp = '📅 COUNTDOWN EVENTI\n\n';

        ordinati.forEach((e, i) => {
            const diff = Math.ceil((e.dataObj - ora) / (1000 * 60 * 60 * 24));
            let emoji = '📌';
            if (diff < 0) emoji = '✅';
            else if (diff === 0) emoji = '🎉';
            else if (diff <= 3) emoji = '🔴';
            else if (diff <= 7) emoji = '🟡';
            else emoji = '🟢';

            const dataStr = e.dataObj.toLocaleDateString('it-IT');
            if (diff < 0) {
                resp += `${i + 1}. ${emoji} ${e.nome} — ${dataStr} (passato)\n`;
            } else if (diff === 0) {
                resp += `${i + 1}. ${emoji} ${e.nome} — OGGI!\n`;
            } else {
                resp += `${i + 1}. ${emoji} ${e.nome} — ${dataStr} (${diff} giorni)\n`;
            }
        });

        resp += '\n💡 .countdown add [GG/MM] [evento] — aggiungi\n💡 .countdown del [numero] — rimuovi';
        await msg.reply(resp);
    }
};
