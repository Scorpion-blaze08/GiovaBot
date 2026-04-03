const { aggiornaClassifica } = require('./classifica');
const { aggiungiMonete } = require('../utils/economia');
const { getSenderId } = require('../utils/identity');
const { getNomeCache } = require('../utils/nomi');
const { processGameProgress } = require('../utils/progression');

const DOMANDE = [
    { d: '🌍 Qual è la capitale della Francia?', r: 'parigi', o: ['Londra', 'Parigi', 'Roma', 'Madrid'] },
    { d: '🔢 Quanto fa 15 x 15?', r: '225', o: ['200', '215', '225', '230'] },
    { d: '🌊 Qual è l\'oceano più grande del mondo?', r: 'pacifico', o: ['Atlantico', 'Indiano', 'Pacifico', 'Artico'] },
    { d: '🧪 Qual è il simbolo chimico dell\'oro?', r: 'au', o: ['Go', 'Or', 'Au', 'Ag'] },
    { d: '🎨 Chi ha dipinto la Gioconda?', r: 'da vinci', o: ['Michelangelo', 'Da Vinci', 'Raffaello', 'Botticelli'] },
    { d: '🌡️ A quanti gradi bolle l\'acqua?', r: '100', o: ['90', '95', '100', '110'] },
    { d: '🔭 Quanti pianeti ha il sistema solare?', r: '8', o: ['7', '8', '9', '10'] },
    { d: '🇮🇹 Quante regioni ha l\'Italia?', r: '20', o: ['18', '19', '20', '21'] }
];

const partiteAttive = new Map();

module.exports = {
    name: 'trivia',
    description: 'Quiz rapido utile anche per allenamento scolastico',
    async execute(msg, client) {
        const chatId = msg.from;

        if (partiteAttive.has(chatId)) {
            await msg.reply('❌ C’è già una domanda trivia attiva in questa chat. Rispondete prima con 1, 2, 3 o 4.');
            return;
        }

        const domanda = DOMANDE[Math.floor(Math.random() * DOMANDE.length)];
        const opzioni = [...domanda.o].sort(() => Math.random() - 0.5);
        const answerIndex = opzioni.findIndex(option => option.toLowerCase() === domanda.r) + 1;

        partiteAttive.set(chatId, {
            question: domanda,
            options: opzioni,
            answerIndex,
            expiresAt: Date.now() + 30000
        });

        let text = `🧠 QUIZ TRIVIA 🧠\n\n${domanda.d}\n\n`;
        opzioni.forEach((option, index) => {
            text += `${index + 1}. ${option}\n`;
        });
        text += '\n⏳ Avete 30 secondi per rispondere con 1, 2, 3 o 4.';

        await client.sendMessage(chatId, text);

        const handler = async newMsg => {
            if (newMsg.from !== chatId) return;
            const active = partiteAttive.get(chatId);
            if (!active || Date.now() > active.expiresAt) {
                client.removeListener('message', handler);
                partiteAttive.delete(chatId);
                return;
            }

            const answer = Number(newMsg.body.trim());
            if (answer < 1 || answer > 4) return;

            client.removeListener('message', handler);
            partiteAttive.delete(chatId);

            const playerId = await getSenderId(newMsg);
            const playerName = getNomeCache(playerId) || playerId.split('@')[0];

            if (answer === active.answerIndex) {
                aggiornaClassifica(playerId, 18, true, 'trivia', playerName);
                aggiungiMonete(playerId, 18, playerName);
                await processGameProgress({
                    userId: playerId,
                    game: 'trivia',
                    displayName: playerName,
                    msg: newMsg,
                    events: { plays: 1, wins: 1, profit: 18 }
                });
                await newMsg.reply(`✅ RISPOSTA CORRETTA!\n\n🏆 ${playerName} guadagna +18 crediti.\n💡 Soluzione: ${active.options[active.answerIndex - 1]}`);
                return;
            }

            await processGameProgress({
                userId: playerId,
                game: 'trivia',
                displayName: playerName,
                events: { plays: 1, losses: 1, profit: 0 }
            });
            await newMsg.reply(`❌ Risposta sbagliata.\n\n💡 Soluzione corretta: ${active.options[active.answerIndex - 1]}`);
        };

        client.on('message', handler);

        setTimeout(() => {
            const active = partiteAttive.get(chatId);
            if (!active) return;
            partiteAttive.delete(chatId);
            client.removeListener('message', handler);
            client.sendMessage(chatId, `⏰ Tempo scaduto!\n\n💡 La risposta corretta era: ${active.options[active.answerIndex - 1]}`).catch(() => {});
        }, 30000);
    }
};
