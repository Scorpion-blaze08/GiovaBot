const fs = require('fs');
const path = require('path');
const { getSenderId, isAdmin } = require('../utils/identity');

module.exports = {
    name: 'classifica',
    description: 'Mostra classifiche giochi',
    async execute(msg, client) {
        const args = msg.body.split(' ').slice(1);
        
        // Se nessun argomento, mostra classifica totale
        if (args.length === 0) {
            await mostraClassificaTotale(msg, client);
            return;
        }
        
        const gioco = args[0].toLowerCase();
        
        // Classifiche specifiche per gioco
        if (['slot', 'dado', 'roulette', 'russa', 'cavalli', 'scelta', 'blackjack', 'pesca', 'duello', 'torneo', 'battaglia'].includes(gioco)) {
            // Converti russa in roulette per il file
            const nomeFile = gioco === 'russa' ? 'roulette' : gioco;
            await mostraClassificaGioco(msg, client, nomeFile);
            return;
        }
        
        // Reset classifica totale (solo admin)
        if (gioco === 'reset') {
            const sender = await getSenderId(msg);
            
            if (!isAdmin(sender)) {
                await msg.reply('❌ Solo l\'admin può cancellare le classifiche!');
                return;
            }
            
            await resetClassificaTotale(msg, client);
            return;
        }
        
        await msg.reply("🏆 CLASSIFICHE DISPONIBILI\n\n📊 .classifica - Totale\n🎰 .classifica slot\n🎲 .classifica dado\n🔫 .classifica russa\n🐎 .classifica cavalli\n🎯 .classifica scelta\n🎃 .classifica blackjack\n🎣 .classifica pesca\n⚔️ .classifica duello\n🏆 .classifica torneo\n🏰 .classifica battaglia\n\n🗑️ .classifica reset - Azzera tutto (solo admin)");
    }
};

async function mostraClassificaTotale(msg, client) {
    const giochi = ['slot', 'dado', 'roulette', 'cavalli', 'scelta', 'blackjack', 'pesca', 'duello', 'torneo', 'battaglia'];
    const classificaTotale = {};
    
    // Carica mappatura nomi -> ID
    const nomiFile = path.join(__dirname, '..', 'data', 'nomi_giocatori.json');
    let mappaId = {};
    if (fs.existsSync(nomiFile)) {
        try {
            const nomi = JSON.parse(fs.readFileSync(nomiFile, 'utf8'));
            // Inverti la mappatura: nome -> id
            for (const [id, nome] of Object.entries(nomi)) {
                mappaId[nome] = id;
            }
        } catch (e) {}
    }
    
    // Somma punti da tutti i giochi
    for (const gioco of giochi) {
        const classificaFile = path.join(__dirname, '..', 'data', `classifica_${gioco}.json`);
        if (fs.existsSync(classificaFile)) {
            try {
                const dati = JSON.parse(fs.readFileSync(classificaFile, 'utf8'));
                for (const [nome, stats] of Object.entries(dati)) {
                    if (!classificaTotale[nome]) {
                        classificaTotale[nome] = { punti: 0, vittorie: 0, partite: 0 };
                    }
                    classificaTotale[nome].punti += stats.punti || 0;
                    classificaTotale[nome].vittorie += stats.vittorie || 0;
                    classificaTotale[nome].partite += stats.partite || 0;
                }
            } catch (e) {}
        }
    }
    
    if (Object.keys(classificaTotale).length === 0) {
        await msg.reply('🏆 CLASSIFICA TOTALE\n\n📊 Nessun giocatore ancora!\n\n🎮 Gioca ai minigiochi per guadagnare punti!');
        return;
    }
    
    const giocatoriOrdinati = Object.entries(classificaTotale)
        .sort(([,a], [,b]) => b.punti - a.punti)
        .slice(0, 10);
    
    let response = '🏆 CLASSIFICA TOTALE 🏆\n\n';
    const mentions = [];
    
    giocatoriOrdinati.forEach(([nome, dati], index) => {
        const posizione = index + 1;
        let emoji = posizione <= 3 ? ['🥇', '🥈', '🥉'][posizione - 1] : `${posizione}.`;
        
        // Se ho l'ID per questo nome, tagga
        if (mappaId[nome]) {
            response += `${emoji} @${mappaId[nome].split('@')[0]}: ${dati.punti} punti\n`;
            mentions.push(mappaId[nome]);
        } else {
            response += `${emoji} ${nome}: ${dati.punti} punti\n`;
        }
        response += `   🎯 Vittorie: ${dati.vittorie} | 🎮 Partite: ${dati.partite}\n\n`;
    });
    
    response += '🎮 Usa .classifica [gioco] per classifiche specifiche!';
    
    if (mentions.length > 0) {
        await client.sendMessage(msg.from, response, { mentions });
    } else {
        await msg.reply(response);
    }
}

async function mostraClassificaGioco(msg, client, gioco) {
    const classificaFile = path.join(__dirname, '..', 'data', `classifica_${gioco}.json`);
    
    // Carica mappatura nomi -> ID
    const nomiFile = path.join(__dirname, '..', 'data', 'nomi_giocatori.json');
    let mappaId = {};
    if (fs.existsSync(nomiFile)) {
        try {
            const nomi = JSON.parse(fs.readFileSync(nomiFile, 'utf8'));
            // Inverti la mappatura: nome -> id
            for (const [id, nome] of Object.entries(nomi)) {
                mappaId[nome] = id;
            }
        } catch (e) {}
    }
    
    let classifica = {};
    if (fs.existsSync(classificaFile)) {
        try {
            classifica = JSON.parse(fs.readFileSync(classificaFile, 'utf8'));
        } catch (e) {}
    }
    
    if (Object.keys(classifica).length === 0) {
        await msg.reply(`🏆 CLASSIFICA ${gioco.toUpperCase()}\n\n📊 Nessun giocatore ancora!\n\n🎮 Gioca per apparire in classifica!`);
        return;
    }
    
    const giocatoriOrdinati = Object.entries(classifica)
        .sort(([,a], [,b]) => b.punti - a.punti)
        .slice(0, 10);
    
    const emojiGioco = {
        slot: '🎰',
        dado: '🎲', 
        carta: '🃏',
        roulette: '🔫',
        blackjack: '🎃',
        pesca: '🎣',
        cavalli: '🐎',
        scelta: '🎯',
        duello: '⚔️',
        torneo: '🏆',
        battaglia: '🏰'
    };
    
    let response = `${emojiGioco[gioco]} CLASSIFICA ${gioco.toUpperCase()} ${emojiGioco[gioco]}\n\n`;
    const mentions = [];
    
    giocatoriOrdinati.forEach(([nome, dati], index) => {
        const posizione = index + 1;
        let emoji = posizione <= 3 ? ['🥇', '🥈', '🥉'][posizione - 1] : `${posizione}.`;
        
        // Se ho l'ID per questo nome, tagga
        if (mappaId[nome]) {
            response += `${emoji} @${mappaId[nome].split('@')[0]}: ${dati.punti} punti\n`;
            mentions.push(mappaId[nome]);
        } else {
            response += `${emoji} ${nome}: ${dati.punti} punti\n`;
        }
        response += `   🎯 Vittorie: ${dati.vittorie || 0} | 🎮 Partite: ${dati.partite || 0}\n\n`;
    });
    
    if (mentions.length > 0) {
        await client.sendMessage(msg.from, response, { mentions });
    } else {
        await msg.reply(response);
    }
}

async function resetClassificaTotale(msg, client) {
    const giochi = ['slot', 'dado', 'roulette', 'cavalli', 'scelta', 'blackjack', 'pesca', 'duello', 'torneo', 'battaglia'];
    
    for (const gioco of giochi) {
        const classificaFile = path.join(__dirname, '..', 'data', `classifica_${gioco}.json`);
        if (fs.existsSync(classificaFile)) {
            fs.writeFileSync(classificaFile, JSON.stringify({}, null, 2));
        }
    }
    
    // Azzera anche il file dei nomi
    const nomiFile = path.join(__dirname, '..', 'data', 'nomi_giocatori.json');
    if (fs.existsSync(nomiFile)) {
        fs.writeFileSync(nomiFile, JSON.stringify({}, null, 2));
    }
    
    await msg.reply("🗑️ Tutte le classifiche azzerate!");
}

// Funzione helper per aggiornare punti
function aggiornaClassifica(idGiocatore, puntiVinti, vittoria = false, gioco = 'generale', nome = null) {
    console.log(`AGGIORNA CLASSIFICA: ${idGiocatore}, punti: ${puntiVinti}, gioco: ${gioco}, nome: ${nome}`);
    
    const classificaFile = path.join(__dirname, '..', 'data', `classifica_${gioco}.json`);
    const dataDir = path.dirname(classificaFile);
    
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    
    let classifica = {};
    if (fs.existsSync(classificaFile)) {
        try {
            classifica = JSON.parse(fs.readFileSync(classificaFile, 'utf8'));
        } catch (error) {
            classifica = {};
        }
    }
    
    // Usa sempre il nome se fornito, altrimenti l'ID
    const chiave = nome && nome !== idGiocatore ? nome : idGiocatore;
    
    // Rimuovi vecchia entry con ID se esiste una con nome
    if (nome && nome !== idGiocatore && classifica[idGiocatore]) {
        if (classifica[chiave]) {
            // Somma i punti della vecchia entry
            classifica[chiave].punti += classifica[idGiocatore].punti;
            classifica[chiave].vittorie += classifica[idGiocatore].vittorie;
            classifica[chiave].partite += classifica[idGiocatore].partite;
        } else {
            // Sposta la vecchia entry
            classifica[chiave] = classifica[idGiocatore];
        }
        delete classifica[idGiocatore];
    }
    
    if (!classifica[chiave]) {
        classifica[chiave] = {
            punti: 0,
            vittorie: 0,
            partite: 0
        };
    }
    
    classifica[chiave].punti += puntiVinti;
    // Non si può scendere sotto 0 punti
    if (classifica[chiave].punti < 0) {
        classifica[chiave].punti = 0;
    }
    classifica[chiave].partite += 1;
    if (vittoria) {
        classifica[chiave].vittorie += 1;
    }
    
    console.log(`Salvato in classifica con chiave: ${chiave}`);
    fs.writeFileSync(classificaFile, JSON.stringify(classifica, null, 2));
}

module.exports.aggiornaClassifica = aggiornaClassifica;
