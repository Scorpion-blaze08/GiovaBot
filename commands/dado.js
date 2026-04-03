const { aggiornaClassifica } = require('./classifica');
const { aggiungiMonete } = require('../utils/economia');
const { getSenderId, isAdmin } = require('../utils/identity');
const { processGameProgress } = require('../utils/progression');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'dado',
    description: 'Lancia un dado',
    async execute(msg) {
        const args = msg.body.split(' ').slice(1);
        const sender = await getSenderId(msg);
        
        // Comando admin - dado truccato
        if (args[0] === 'truccato' && isAdmin(sender)) {
            const numero = parseInt(args[1]);
            if (!numero || numero < 1 || numero > 6) {
                await msg.reply('❌ Uso: .dado truccato [1-6]');
                return;
            }
            
            const diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
            let message = '🎲 DADO TRUCCATO ADMIN 🎲\n\n';
            message += `Dado 1: ${diceEmojis[numero - 1]} (${numero})\n\n`;
            
            const mioNome = require('../utils/nomi').getNomeCache(sender) || sender.split('@')[0];
            const userName = mioNome || sender;
            let punti = numero === 6 ? 5 : numero === 1 ? -1 : 1;
            
            aggiornaClassifica(sender, punti, numero === 6, 'dado', userName);
            message += `🎉 +${punti} punti!\n📈 Usa .classifica per vedere i punti!`;
            
            await msg.reply(message);
            return;
        }
        
        // Comando admin - ruba punti
        if (args[0] === 'ruba' && isAdmin(sender)) {
            const mentions = await msg.getMentions();
            if (!mentions.length || !args[2]) {
                await msg.reply('❌ Uso: .dado ruba @utente [punti]');
                return;
            }
            
            const targetId = mentions[0].id._serialized;
            const punti = parseInt(args[2]);
            
            if (isNaN(punti)) {
                await msg.reply('❌ Inserisci un numero valido!');
                return;
            }
            
            const mioNome = require('../utils/nomi').getNomeCache(sender) || sender.split('@')[0];
            const userName = mioNome || sender;
            
            aggiornaClassifica(targetId, -punti, false, 'dado', 'Vittima');
            aggiornaClassifica(sender, punti, true, 'dado', userName);
            
            await msg.reply(`🏴☠️ PUNTI RUBATI! 🏴☠️\n\n💰 ${punti} punti rubati da @${targetId.split('@')[0]}!`);
            return;
        }
        
        const numDadi = args.length > 0 ? parseInt(args[0]) : 1;
        
        if (numDadi < 1 || numDadi > 6) {
            msg.reply('🎲 Uso: .dado [numero]\n\nEsempi:\n• .dado (1 dado)\n• .dado 3 (3 dadi)\n\n📝 Massimo 6 dadi!');
            return;
        }
        
        let risultati = [];
        let totale = 0;
        
        for (let i = 0; i < numDadi; i++) {
            const risultato = Math.floor(Math.random() * 6) + 1;
            risultati.push(risultato);
            totale += risultato;
        }
        
        const diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
        
        let message = '🎲 LANCIO DEI DADI 🎲\n\n';
        
        risultati.forEach((risultato, index) => {
            message += `Dado ${index + 1}: ${diceEmojis[risultato - 1]} (${risultato})\n`;
        });
        
        if (numDadi > 1) {
            message += `\n🔢 Totale: ${totale}`;
        }
        
        // Sistema nomi
        const nomiFile = path.join(__dirname, '..', 'data', 'nomi_giocatori.json');
        
        function caricaNomi() {
            try {
                if (!fs.existsSync(nomiFile)) return {};
                return JSON.parse(fs.readFileSync(nomiFile, 'utf8'));
            } catch (e) {
                return {};
            }
        }
        
        function salvaNomi(data) {
            const dataDir = path.dirname(nomiFile);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            fs.writeFileSync(nomiFile, JSON.stringify(data, null, 2));
        }
        
        // Salva nome se disponibile
        const mioNome = require('../utils/nomi').getNomeCache(sender) || sender.split('@')[0];
        if (mioNome && mioNome !== sender) {
            const nomi = caricaNomi();
            nomi[sender] = mioNome;
            salvaNomi(nomi);
        }
        
        const userName = mioNome || sender;
        let punti = 0;
        
        if (numDadi === 1) {
            if (risultati[0] === 6) {
                punti = 5; // Sei = +5 punti
                message += '\n\n🎆 SEI! +5 punti!';
            } else if (risultati[0] === 1) {
                punti = -1; // Uno = -1 punto
                message += '\n\n😔 UNO! -1 punto!';
            } else {
                punti = 1; // Altri = +1 punto
                message += '\n\n🎉 +1 punto!';
            }
        } else {
            // Dadi multipli: punti = totale/2
            punti = Math.floor(totale / 2);
            message += `\n\n🎉 +${punti} punti!`;
        }
        
        const isWin = punti > 0;
        const coinDelta = punti * 2;
        aggiornaClassifica(sender, coinDelta, risultati.includes(6), 'dado', userName);
        if (coinDelta !== 0) aggiungiMonete(sender, coinDelta, userName);
        
        // Sistema Streak
        let streakInfo = null;
        if (global.updateStreak) {
            streakInfo = global.updateStreak(sender, 'dado', isWin);
            
            if (streakInfo.current > 0) {
                const streakEmoji = streakInfo.current >= 5 ? '🔥' : streakInfo.current >= 3 ? '🎆' : '✨';
                message += `\n${streakEmoji} Streak: ${streakInfo.current} vittorie!`;
                
                if (streakInfo.current === streakInfo.best && streakInfo.current > 1) {
                    message += ' 🏆 NUOVO RECORD!';
                }
            }
        }
        
        await processGameProgress({
            userId: sender,
            game: 'dado',
            displayName: userName,
            msg,
            events: {
                plays: 1,
                wins: isWin ? 1 : 0,
                losses: isWin ? 0 : 1,
                profit: coinDelta
            },
            flags: [
                numDadi === 2 && risultati[0] === 6 && risultati[1] === 6 ? 'dado_double_six' : null,
                numDadi > 1 && totale >= 20 ? 'dado_high_score' : null
            ].filter(Boolean)
        });

        message += `\n💰 Variazione crediti: ${coinDelta >= 0 ? '+' : ''}${coinDelta}`;
        message += '\n📈 Usa .classifica per vedere la classifica soldi!';
        
        await msg.reply(message);
    }
};
