const { aggiornaClassifica } = require('./classifica');
const fs = require('fs');
const path = require('path');

const DOMANDE = [
    { d: '🌍 Qual è la capitale della Francia?', r: 'parigi', o: ['Londra', 'Parigi', 'Roma', 'Madrid'] },
    { d: '🔢 Quanto fa 15 x 15?', r: '225', o: ['200', '215', '225', '230'] },
    { d: '⚽ Quante squadre ci sono in Serie A?', r: '20', o: ['18', '20', '22', '24'] },
    { d: '🌊 Qual è l\'oceano più grande del mondo?', r: 'pacifico', o: ['Atlantico', 'Indiano', 'Pacifico', 'Artico'] },
    { d: '🎵 Chi ha cantato "Bohemian Rhapsody"?', r: 'queen', o: ['Beatles', 'Queen', 'Rolling Stones', 'Led Zeppelin'] },
    { d: '🏔️ Qual è la montagna più alta del mondo?', r: 'everest', o: ['K2', 'Everest', 'Kilimanjaro', 'Mont Blanc'] },
    { d: '🧪 Qual è il simbolo chimico dell\'oro?', r: 'au', o: ['Go', 'Or', 'Au', 'Ag'] },
    { d: '🎮 In quale anno è uscito il primo iPhone?', r: '2007', o: ['2005', '2006', '2007', '2008'] },
    { d: '🐘 Qual è l\'animale terrestre più grande?', r: 'elefante', o: ['Ippopotamo', 'Rinoceronte', 'Elefante', 'Giraffa'] },
    { d: '🌙 Quanti giorni impiega la Luna a girare intorno alla Terra?', r: '27', o: ['24', '27', '30', '365'] },
    { d: '🍕 In quale città italiana è nata la pizza?', r: 'napoli', o: ['Roma', 'Milano', 'Napoli', 'Torino'] },
    { d: '⚡ Chi ha scoperto l\'elettricità?', r: 'franklin', o: ['Edison', 'Tesla', 'Franklin', 'Newton'] },
    { d: '🎨 Chi ha dipinto la Gioconda?', r: 'da vinci', o: ['Michelangelo', 'Da Vinci', 'Raffaello', 'Botticelli'] },
    { d: '🌡️ A quanti gradi bolle l\'acqua?', r: '100', o: ['90', '95', '100', '110'] },
    { d: '🦁 Qual è il felino più grande del mondo?', r: 'tigre', o: ['Leone', 'Tigre', 'Leopardo', 'Ghepardo'] },
    { d: '🚀 In quale anno l\'uomo è andato sulla Luna per la prima volta?', r: '1969', o: ['1965', '1967', '1969', '1972'] },
    { d: '🎭 Chi ha scritto Romeo e Giulietta?', r: 'shakespeare', o: ['Dante', 'Shakespeare', 'Cervantes', 'Molière'] },
    { d: '🔭 Quanti pianeti ha il sistema solare?', r: '8', o: ['7', '8', '9', '10'] },
    { d: '🏊 Quante vasche fa un nuotatore nei 100m in piscina olimpica?', r: '2', o: ['1', '2', '4', '5'] },
    { d: '🇮🇹 Quante regioni ha l\'Italia?', r: '20', o: ['18', '19', '20', '21'] },
];

const partiteAttive = new Map();

module.exports = {
    name: 'trivia',
    description: 'Domande a risposta multipla con punti',
    async execute(msg, client) {
        const sender = msg.author || msg.from;
        const chatId = msg.from;

        if (partiteAttive.has(chatId)) {
            await msg.reply('❌ C\'è già una domanda attiva! Rispondi prima con 1, 2, 3 o 4.');
            return;
        }

        const domanda = DOMANDE[Math.floor(Math.random() * DOMANDE.length)];
        const opzioniMescolate = [...domanda.o].sort(() => Math.random() - 0.5);
        const indiceCorretto = opzioniMescolate.findIndex(o => o.toLowerCase() === domanda.r);

        partiteAttive.set(chatId, {
            domanda,
            opzioni: opzioniMescolate,
            risposta: indiceCorretto + 1,
            scadenza: Date.now() + 30000
        });

        let testo = `🧠 TRIVIA!\n\n${domanda.d}\n\n`;
        opzioniMescolate.forEach((o, i) => { testo += `${i + 1}. ${o}\n`; });
        testo += '\n⏰ Hai 30 secondi! Rispondi con 1, 2, 3 o 4';

        await client.sendMessage(chatId, testo);

        // Listener risposta
        const handler = async (newMsg) => {
            if (newMsg.from !== chatId) return;
            const partita = partiteAttive.get(chatId);
            if (!partita || Date.now() > partita.scadenza) {
                client.removeListener('message', handler);
                partiteAttive.delete(chatId);
                return;
            }

            const risposta = parseInt(newMsg.body.trim());
            if (isNaN(risposta) || risposta < 1 || risposta > 4) return;

            client.removeListener('message', handler);
            partiteAttive.delete(chatId);

            const rispondente = newMsg.author || newMsg.from;
            const nome = require('../utils/nomi').getNomeCache(rispondente) || rispondente.split('@')[0];

            if (risposta === partita.risposta) {
                aggiornaClassifica(rispondente, 5, true, 'dado', nome);
                await newMsg.reply(`✅ CORRETTO! 🎉\n\n🏆 +5 punti a ${nome}!\n💡 La risposta era: ${partita.opzioni[partita.risposta - 1]}`);
            } else {
                await newMsg.reply(`❌ Sbagliato!\n\n💡 La risposta corretta era: ${partita.opzioni[partita.risposta - 1]}`);
            }
        };

        client.on('message', handler);

        // Timeout 30s
        setTimeout(() => {
            if (partiteAttive.has(chatId)) {
                partiteAttive.delete(chatId);
                client.removeListener('message', handler);
                client.sendMessage(chatId, `⏰ Tempo scaduto!\n\n💡 La risposta era: ${domanda.o.find(o => o.toLowerCase() === domanda.r)}`).catch(() => {});
            }
        }, 30000);
    }
};
