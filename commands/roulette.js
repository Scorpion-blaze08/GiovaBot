const { aggiornaClassifica } = require('./classifica');
const { aggiungiMonete } = require('../utils/economia');
const { getNomeCache } = require('../utils/nomi');
const fs = require('fs');
const path = require('path');

const partiteFile = path.join(__dirname, '..', 'data', 'partite_roulette.json');

const caricaPartite = () => {
    try {
        if (!fs.existsSync(partiteFile)) return {};
        return JSON.parse(fs.readFileSync(partiteFile, 'utf8'));
    } catch { return {}; }
};

const salvaPartite = (data) => {
    const dir = path.dirname(partiteFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(partiteFile, JSON.stringify(data, null, 2));
};

const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

const tag = (id) => `@${id.split('@')[0]}`;
const nome = (id) => getNomeCache(id) || id.split('@')[0];

// Ottieni l'ID @c.us reale tramite getContact()
async function getSenderId(msg) {
    try {
        const contact = await msg.getContact();
        return contact.id._serialized; // sempre @c.us
    } catch {
        return msg.author || msg.from;
    }
}

module.exports = {
    name: 'roulette',
    description: 'Roulette russa - Sfida un avversario',
    async execute(msg, client) {
        const args = msg.body.split(' ').slice(1);
        const from = msg.from;
        const partite = caricaPartite();
        const partitaAttiva = partite[from];

        // Ottieni ID reale @c.us del sender
        const sender = await getSenderId(msg);

        // SFIDA
        if (args[0] === 'sfida') {
            const mentions = await msg.getMentions();
            if (!mentions.length) {
                await msg.reply('❌ Uso: .roulette sfida @utente');
                return;
            }

            const targetId = mentions[0].id._serialized;

            if (targetId === sender) {
                await msg.reply('❌ Non puoi sfidare te stesso!');
                return;
            }
            if (partitaAttiva) {
                await msg.reply('❌ C\'è già una partita in corso!');
                return;
            }

            partite[from] = {
                sfidante: sender,
                sfidato: targetId,
                stato: 'attesa_risposta',
                timestamp: Date.now()
            };
            salvaPartite(partite);

            await client.sendMessage(from,
                `🔫 ROULETTE RUSSA 🔫\n\n${nome(sender)} sfida ${tag(targetId)}!\n\n🎯 ${tag(targetId)}, rispondi con:\n.roulette accetto\n.roulette rifiuto`,
                { mentions: [targetId] }
            );
            return;
        }

        // ACCETTO / RIFIUTO
        if (args[0] === 'accetto' || args[0] === 'rifiuto') {
            if (!partitaAttiva || partitaAttiva.stato !== 'attesa_risposta') {
                await msg.reply('❌ Nessuna sfida in attesa!');
                return;
            }

            if (sender !== partitaAttiva.sfidato && sender !== partitaAttiva.sfidante) {
                await msg.reply('❌ Questa sfida non è per te!');
                return;
            }
            if (sender === partitaAttiva.sfidante) {
                await msg.reply('❌ Sei tu lo sfidante, aspetta che l\'altro accetti!');
                return;
            }

            if (args[0] === 'rifiuto') {
                delete partite[from];
                salvaPartite(partite);
                await msg.reply('😔 Sfida rifiutata!');
                return;
            }

            partite[from].stato = 'scelta_proiettili';
            salvaPartite(partite);
            await client.sendMessage(from,
                `✅ ${nome(sender)} ha accettato la sfida!\n\n${tag(partitaAttiva.sfidante)}, scegli quanti proiettili (1-7):\n.roulette 3`,
                { mentions: [partitaAttiva.sfidante] }
            );
            return;
        }

        // SCELTA PROIETTILI
        if ((args[0] === 'random' || (args[0] && !isNaN(args[0]))) && partitaAttiva?.stato === 'scelta_proiettili') {
            if (sender !== partitaAttiva.sfidante) {
                await msg.reply('❌ Solo lo sfidante può scegliere i proiettili!');
                return;
            }

            const numProiettili = args[0] === 'random'
                ? Math.floor(Math.random() * 7) + 1
                : parseInt(args[0]);

            if (numProiettili < 1 || numProiettili > 7) {
                await msg.reply('❌ Numero tra 1 e 7!');
                return;
            }

            let tamburo = new Array(8).fill(false);
            for (let i = 0; i < numProiettili; i++) tamburo[i] = true;
            tamburo = shuffleArray(tamburo);

            partite[from] = {
                ...partitaAttiva,
                stato: 'in_gioco',
                tamburo,
                posizione: 0,
                turno: partitaAttiva.sfidante,
                proiettiliVeri: numProiettili,
                doveSparare: null
            };
            salvaPartite(partite);

            await client.sendMessage(from,
                `🔫 PARTITA INIZIATA!\n\nTamburo: 8 colpi (${numProiettili} veri${args[0] === 'random' ? ' - scelti a caso!' : ''})\n\nTocca a ${tag(partitaAttiva.sfidante)}!\n\n⚔️ .roulette attacco — spara all'avversario\n🔫 .roulette sparo — spara a te stesso`,
                { mentions: [partitaAttiva.sfidante] }
            );
            return;
        }

        // ANNULLA
        if (args[0] === 'annulla') {
            if (!partitaAttiva) {
                await msg.reply('❌ Nessuna partita da annullare!');
                return;
            }
            delete partite[from];
            salvaPartite(partite);
            await msg.reply('🚫 Partita annullata!');
            return;
        }

        // AZIONI DI GIOCO
        if (args[0] === 'attacco' || args[0] === 'sparo') {
            if (!partitaAttiva || partitaAttiva.stato !== 'in_gioco') {
                await msg.reply('❌ Nessuna partita in corso!');
                return;
            }
            if (sender !== partitaAttiva.turno) {
                await client.sendMessage(from,
                    `❌ Non è il tuo turno! Tocca a ${tag(partitaAttiva.turno)}!`,
                    { mentions: [partitaAttiva.turno] }
                );
                return;
            }
            if (partitaAttiva.doveSparare && args[0] !== 'sparo') {
                await msg.reply('❌ Devi spararti! Usa .roulette sparo');
                return;
            }

            const colpoVero = partitaAttiva.tamburo[partitaAttiva.posizione];
            const bersaglio = args[0] === 'attacco'
                ? (sender === partitaAttiva.sfidante ? partitaAttiva.sfidato : partitaAttiva.sfidante)
                : sender;

            if (colpoVero) {
                const vincitore = bersaglio === sender
                    ? (sender === partitaAttiva.sfidante ? partitaAttiva.sfidato : partitaAttiva.sfidante)
                    : sender;

                delete partite[from];
                salvaPartite(partite);

                aggiornaClassifica(bersaglio, -3, false, 'roulette', nome(bersaglio));
                aggiornaClassifica(vincitore, 8, true, 'roulette', nome(vincitore));
                console.log('ROULETTE FINE - vincitore:', vincitore, '| bersaglio:', bersaglio);
                aggiungiMonete(vincitore, 60, nome(vincitore));
                aggiungiMonete(bersaglio, -20, nome(bersaglio));
                console.log('ROULETTE SALDI - vincitore:', require('../utils/economia').getSaldo(vincitore), '| bersaglio:', require('../utils/economia').getSaldo(bersaglio));

                await client.sendMessage(from,
                    `💥 BANG! 💥\n\n${tag(bersaglio)} è stato colpito!\n\n🏆 Vincitore: ${tag(vincitore)} (${nome(vincitore)}) +60 🪙\n💀 Sconfitto: ${tag(bersaglio)} (${nome(bersaglio)}) -20 🪙\n\n📊 Usa .classifica`,
                    { mentions: [vincitore, bersaglio] }
                );
                return;
            }

            partite[from].posizione++;
            if (args[0] === 'attacco') {
                partite[from].doveSparare = true;
                salvaPartite(partite);
                await client.sendMessage(from,
                    `CLICK 🔫\n\nColpo vuoto! Ora ${tag(sender)} devi spararti!\n\n.roulette sparo`,
                    { mentions: [sender] }
                );
            } else {
                const prossimoTurno = sender === partitaAttiva.sfidante
                    ? partitaAttiva.sfidato
                    : partitaAttiva.sfidante;
                partite[from].turno = prossimoTurno;
                partite[from].doveSparare = null;
                salvaPartite(partite);
                await client.sendMessage(from,
                    `CLICK 🔫\n\nSalvo! Tocca a ${tag(prossimoTurno)} (${nome(prossimoTurno)})!\n\n⚔️ .roulette attacco\n🔫 .roulette sparo`,
                    { mentions: [prossimoTurno] }
                );
            }
            return;
        }

        await msg.reply('🔫 ROULETTE RUSSA 🔫\n\n• .roulette sfida @utente\n• .roulette accetto / rifiuto\n• .roulette [1-7] — scegli proiettili\n• .roulette random — proiettili casuali\n• .roulette attacco — spara all\'avversario\n• .roulette sparo — spara a te stesso\n• .roulette annulla');
    }
};
