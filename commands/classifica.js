const fs = require('fs');
const path = require('path');
const { getSenderId, isAdmin, findMatchingKey } = require('../utils/identity');

const GIOCHI = ['slot', 'dado', 'roulette', 'cavalli', 'scelta', 'blackjack', 'pesca', 'duello', 'torneo', 'battaglia', 'trivia'];

function getClassificaFile(gioco) {
    return path.join(__dirname, '..', 'data', `classifica_${gioco}.json`);
}

function readJson(filePath, fallback = {}) {
    try {
        if (!fs.existsSync(filePath)) return fallback;
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
        return fallback;
    }
}

function writeJson(filePath, data) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function getDisplayName(userId, explicitName = null) {
    const nomiFile = path.join(__dirname, '..', 'data', 'nomi_giocatori.json');
    const nomi = readJson(nomiFile);
    const matchedKey = findMatchingKey(nomi, userId);
    return explicitName || (matchedKey ? nomi[matchedKey] : null) || userId.split('@')[0];
}

function getOrderedStats(classifica) {
    return Object.values(classifica)
        .sort((a, b) => {
            if ((b.soldi || 0) !== (a.soldi || 0)) return (b.soldi || 0) - (a.soldi || 0);
            if ((b.vittorie || 0) !== (a.vittorie || 0)) return (b.vittorie || 0) - (a.vittorie || 0);
            return (a.perdite || 0) - (b.perdite || 0);
        })
        .slice(0, 10);
}

function formatLeaderboard(title, entries) {
    const labels = ['1.', '2.', '3.'];
    let response = `${title}\n\n`;
    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const label = labels[i] || `${i + 1}.`;
        response += `${label} @${entry.id.split('@')[0]} - Soldi: ${entry.soldi || 0}\n`;
        response += `Vittorie: ${entry.vittorie || 0} | Perdite: ${entry.perdite || 0}\n\n`;
    }
    return response.trim();
}

function resetAllClassifiche() {
    for (const gioco of GIOCHI) {
        writeJson(getClassificaFile(gioco), {});
    }
}

function aggiornaClassifica(idGiocatore, soldiDelta = 0, vittoria = false, gioco = 'generale', nome = null) {
    const classificaFile = getClassificaFile(gioco);
    const classifica = readJson(classificaFile);
    const existingKey = findMatchingKey(classifica, idGiocatore) || idGiocatore;

    if (!classifica[existingKey]) {
        classifica[existingKey] = {
            id: idGiocatore,
            nome: getDisplayName(idGiocatore, nome),
            soldi: 0,
            vittorie: 0,
            perdite: 0
        };
    }

    const entry = classifica[existingKey];
    entry.id = idGiocatore;
    entry.nome = getDisplayName(idGiocatore, nome);
    entry.soldi = (entry.soldi || 0) + soldiDelta;

    if (vittoria) entry.vittorie = (entry.vittorie || 0) + 1;
    if (!vittoria && soldiDelta < 0) entry.perdite = (entry.perdite || 0) + 1;

    writeJson(classificaFile, classifica);
    return entry;
}

module.exports = {
    name: 'classifica',
    description: 'Mostra classifiche dei giochi basate sui soldi',
    async execute(msg, client) {
        const args = msg.body.split(' ').slice(1);

        if (args.length === 0) {
            await mostraClassificaTotale(msg, client);
            return;
        }

        const gioco = args[0].toLowerCase() === 'russa' ? 'roulette' : args[0].toLowerCase();

        if (GIOCHI.includes(gioco)) {
            await mostraClassificaGioco(msg, client, gioco);
            return;
        }

        if (gioco === 'reset') {
            const sender = await getSenderId(msg);
            if (!isAdmin(sender)) {
                await msg.reply('Solo l\'admin puo resettare le classifiche.');
                return;
            }

            resetAllClassifiche();
            await msg.reply('Classifiche azzerate.');
            return;
        }

        await msg.reply('Usa .classifica oppure .classifica [gioco].');
    },
    aggiornaClassifica,
    resetAllClassifiche,
    GIOCHI_CLASSIFICA: GIOCHI
};

async function mostraClassificaTotale(msg, client) {
    const totale = {};

    for (const gioco of GIOCHI) {
        const classifica = readJson(getClassificaFile(gioco));
        for (const entry of Object.values(classifica)) {
            if (!totale[entry.id]) {
                totale[entry.id] = {
                    id: entry.id,
                    nome: entry.nome || entry.id.split('@')[0],
                    soldi: 0,
                    vittorie: 0,
                    perdite: 0
                };
            }

            totale[entry.id].nome = entry.nome || totale[entry.id].nome;
            totale[entry.id].soldi += entry.soldi || 0;
            totale[entry.id].vittorie += entry.vittorie || 0;
            totale[entry.id].perdite += entry.perdite || 0;
        }
    }

    const top = getOrderedStats(totale);
    if (top.length === 0) {
        await msg.reply('Nessuna classifica disponibile ancora.');
        return;
    }

    await client.sendMessage(msg.from, formatLeaderboard('CLASSIFICA TOTALE', top), {
        mentions: top.map(entry => entry.id)
    });
}

async function mostraClassificaGioco(msg, client, gioco) {
    const classifica = readJson(getClassificaFile(gioco));
    const top = getOrderedStats(classifica);

    if (top.length === 0) {
        await msg.reply(`Nessun dato per ${gioco}.`);
        return;
    }

    await client.sendMessage(msg.from, formatLeaderboard(`CLASSIFICA ${gioco.toUpperCase()}`, top), {
        mentions: top.map(entry => entry.id)
    });
}
