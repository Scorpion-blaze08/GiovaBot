const fs = require('fs');
const path = require('path');

const VOTI_FILE = path.join(__dirname, '..', 'data', 'voti.json');

function carica() {
    try {
        if (!fs.existsSync(VOTI_FILE)) return {};
        return JSON.parse(fs.readFileSync(VOTI_FILE, 'utf8'));
    } catch { return {}; }
}

function salva(data) {
    fs.writeFileSync(VOTI_FILE, JSON.stringify(data, null, 2));
}

const EMOJI_MATERIE = {
    matematica:'📐', italiano:'🇮🇹', inglese:'🇬🇧', storia:'🏛️',
    sistemi:'🖥️', tpsit:'🛠️', informatica:'💻', religione:'✝️', civica:'⚖️',
    fisica:'⚛️', chimica:'⚗️', scienze:'🔬', arte:'🎨', filosofia:'🤔'
};

module.exports = {
    name: 'voti',
    description: 'Salva e visualizza i tuoi voti per materia',
    async execute(msg) {
        const sender = msg.author || msg.from;
        const args = msg.body.split(' ').slice(1);
        const voti = carica();
        if (!voti[sender]) voti[sender] = {};

        // .voti add [materia] [voto]
        if (args[0] === 'add' || args[0] === 'aggiungi') {
            if (args.length < 3) {
                await msg.reply('❌ Uso: .voti add [materia] [voto]\nEsempio: .voti add matematica 8');
                return;
            }
            const materia = args[1].toLowerCase();
            const voto = parseFloat(args[2]);
            if (isNaN(voto) || voto < 1 || voto > 10) {
                await msg.reply('❌ Voto non valido! Usa un numero da 1 a 10');
                return;
            }
            if (!voti[sender][materia]) voti[sender][materia] = [];
            voti[sender][materia].push({ voto, data: new Date().toLocaleDateString('it-IT') });
            salva(voti);
            const emoji = EMOJI_MATERIE[materia] || '📚';
            await msg.reply(`✅ Voto aggiunto!\n\n${emoji} ${materia}: ${voto}\n\nUsa .voti per vedere tutti i tuoi voti`);
            return;
        }

        // .voti del [materia]
        if (args[0] === 'del' || args[0] === 'rimuovi') {
            const materia = args[1]?.toLowerCase();
            if (!materia || !voti[sender][materia]) {
                await msg.reply('❌ Materia non trovata!');
                return;
            }
            // Rimuove l'ultimo voto inserito
            voti[sender][materia].pop();
            if (voti[sender][materia].length === 0) delete voti[sender][materia];
            salva(voti);
            await msg.reply(`✅ Ultimo voto di ${materia} rimosso!`);
            return;
        }

        // .voti — mostra tutti
        const materieUtente = voti[sender];
        if (!materieUtente || Object.keys(materieUtente).length === 0) {
            await msg.reply('📊 Non hai ancora voti salvati!\n\nUsa: .voti add [materia] [voto]');
            return;
        }

        let resp = '📊 I TUOI VOTI\n\n';
        let sommaMediaGenerale = 0;
        let contatoreMaterie = 0;

        for (const [materia, lista] of Object.entries(materieUtente)) {
            const emoji = EMOJI_MATERIE[materia] || '📚';
            const media = lista.reduce((s, v) => s + v.voto, 0) / lista.length;
            const votiStr = lista.map(v => v.voto).join(', ');
            const mediaEmoji = media >= 6 ? '✅' : '❌';
            resp += `${emoji} ${materia}: ${votiStr}\n   ${mediaEmoji} Media: ${media.toFixed(1)}\n\n`;
            sommaMediaGenerale += media;
            contatoreMaterie++;
        }

        const mediaGen = sommaMediaGenerale / contatoreMaterie;
        const mediaGenEmoji = mediaGen >= 6 ? '🟢' : mediaGen >= 5 ? '🟡' : '🔴';
        resp += `─────────────────\n${mediaGenEmoji} Media generale: ${mediaGen.toFixed(1)}\n\n`;
        resp += '💡 .voti add [materia] [voto] — aggiungi\n💡 .voti del [materia] — rimuovi ultimo';

        await msg.reply(resp);
    }
};
