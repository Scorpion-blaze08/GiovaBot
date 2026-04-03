const { aggiornaClassifica } = require('./classifica');
const { aggiungiMonete } = require('../utils/economia');
const { getSenderId, isAdmin } = require('../utils/identity');
const { processGameProgress } = require('../utils/progression');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'slot',
    description: 'Slot machine',
    async execute(msg) {
        const args = msg.body.split(' ').slice(1);
        const sender = await getSenderId(msg);
        
        // Comando admin - jackpot garantito
        if (args[0] === 'jackpot' && isAdmin(sender)) {
            const slot1 = '💎';
            const slot2 = '💎';
            const slot3 = '💎';
            
            let message = '🎰 SLOT MACHINE ADMIN 🎰\n\n';
            message += '┌─────────────┐\n';
            message += `│  ${slot1}  ${slot2}  ${slot3}  │\n`;
            message += '└─────────────┘\n\n';
            message += '💎 JACKPOT ADMIN! TRE DIAMANTI! 💎\n🎉 VINCITA LEGGENDARIA! +50 punti! 🎉';
            
            const mioNome = require('../utils/nomi').getNomeCache(sender) || sender.split('@')[0];
            const userName = mioNome || sender;
            aggiornaClassifica(sender, 50, true, 'slot', userName);
            message += '\n📈 Usa .classifica per vedere i punti!';
            
            await msg.reply(message);
            return;
        }
        
        // Comando admin - ruba punti
        if (args[0] === 'ruba' && isAdmin(sender)) {
            const mentions = await msg.getMentions();
            if (!mentions.length || !args[2]) {
                await msg.reply('❌ Uso: .slot ruba @utente [punti]');
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
            
            aggiornaClassifica(targetId, -punti, false, 'slot', 'Vittima');
            aggiornaClassifica(sender, punti, true, 'slot', userName);
            
            await msg.reply(`🏴☠️ PUNTI RUBATI! 🏴☠️\n\n💰 ${punti} punti rubati da @${targetId.split('@')[0]}!`);
            return;
        }
        
        const simboli = ['🍒', '🍋', '🍊', '🍇', '🔔', '⭐', '💎', '7️⃣'];
        
        // Genera 3 simboli casuali
        const slot1 = simboli[Math.floor(Math.random() * simboli.length)];
        const slot2 = simboli[Math.floor(Math.random() * simboli.length)];
        const slot3 = simboli[Math.floor(Math.random() * simboli.length)];
        
        let message = '🎰 SLOT MACHINE 🎰\n\n';
        message += '┌─────────────┐\n';
        message += `│  ${slot1}  ${slot2}  ${slot3}  │\n`;
        message += '└─────────────┘\n\n';
        
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
        let vittoria = false;
        
        // Controlla vincite (sistema slot reali)
        if (slot1 === slot2 && slot2 === slot3) {
            // TRIS - Vincite principali
            vittoria = true;
            if (slot1 === '💎') {
                punti = 50;
                message += '💎 JACKPOT! TRE DIAMANTI! 💎\n🎉 VINCITA LEGGENDARIA! +50 punti! 🎉';
            } else if (slot1 === '7️⃣') {
                punti = 35;
                message += '7️⃣ SUPER JACKPOT! TRE SETTE! 7️⃣\n🔥 FANTASTICO! +35 punti! 🔥';
            } else if (slot1 === '⭐') {
                punti = 30;
                message += '⭐ MEGA VINCITA! TRE STELLE! ⭐\n✨ ECCELLENTE! +30 punti! ✨';
            } else if (slot1 === '🍒') {
                punti = 25;
                message += '🍒 CHERRY JACKPOT! TRE CILIEGIE! 🍒\n🎊 DOLCE VITTORIA! +25 punti! 🎊';
            } else if (slot1 === '🍋') {
                punti = 20;
                message += '🍋 LEMON BONUS! TRE LIMONI! 🍋\n🌟 FRESCO! +20 punti! 🌟';
            } else if (slot1 === '🍊') {
                punti = 18;
                message += '🍊 ORANGE WIN! TRE ARANCE! 🍊\n🧡 SUCCOSO! +18 punti! 🧡';
            } else if (slot1 === '🍇') {
                punti = 15;
                message += '🍇 GRAPE PRIZE! TRE UVE! 🍇\n💜 DOLCE! +15 punti! 💜';
            } else if (slot1 === '🔔') {
                punti = 12;
                message += '🔔 BELL BONUS! TRE CAMPANE! 🔔\n🎵 SUONA LA VITTORIA! +12 punti! 🎵';
            }
        } else if ((slot1 === '🍒' && slot2 === '🍒') || (slot2 === '🍒' && slot3 === '🍒') || (slot1 === '🍒' && slot3 === '🍒')) {
            // DUE CILIEGIE - Vincita speciale
            vittoria = true;
            punti = 8;
            message += '🍒🍒 DUE CILIEGIE! 🍒🍒\n😋 MINI JACKPOT! +8 punti! 😋';
        } else if (slot1 === '🔔' || slot2 === '🔔' || slot3 === '🔔') {
            // UNA CAMPANA - Vincita minima
            vittoria = true;
            punti = 3;
            message += '🔔 CAMPANA FORTUNATA! 🔔\n🎶 PICCOLA VINCITA! +3 punti! 🎶';
        } else if (slot1 === slot2 || slot2 === slot3 || slot1 === slot3) {
            // COPPIA NORMALE
            vittoria = true;
            punti = 5;
            message += '🎯 COPPIA! Vincita standard! 🎯\n😊 +5 punti! 😊';
        } else {
            // NESSUNA VINCITA
            punti = -2;
            const messaggiPerdita = [
                '😅 Niente questa volta! -2 punti!',
                '🎲 La fortuna gira! -2 punti!',
                '🍀 Quasi! Ci sei vicino! -2 punti!',
                '🎪 Non mollare! Riprova! -2 punti!',
                '🎰 Slot avida oggi! -2 punti!'
            ];
            message += messaggiPerdita[Math.floor(Math.random() * messaggiPerdita.length)];
        }
        
        const coinDelta = punti * 2;
        aggiornaClassifica(sender, coinDelta, vittoria, 'slot', userName);
        if (coinDelta !== 0) aggiungiMonete(sender, coinDelta, userName);
        
        // Sistema Streak
        let streakInfo = null;
        if (global.updateStreak) {
            streakInfo = global.updateStreak(sender, 'slot', vittoria && punti > 0);
            
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
            game: 'slot',
            displayName: userName,
            msg,
            events: {
                plays: 1,
                wins: vittoria ? 1 : 0,
                losses: vittoria ? 0 : 1,
                profit: coinDelta
            },
            flags: [
                slot1 === '💎' && slot2 === '💎' && slot3 === '💎' ? 'slot_jackpot' : null,
                slot1 === '7️⃣' && slot2 === '7️⃣' && slot3 === '7️⃣' ? 'slot_lucky_7' : null,
                punti >= 30 ? 'slot_high_roller' : null,
                ((slot1 === '🍒' && slot2 === '🍒') || (slot2 === '🍒' && slot3 === '🍒') || (slot1 === '🍒' && slot3 === '🍒')) ? 'slot_cherry_lover' : null
            ].filter(Boolean),
            streak: streakInfo ? streakInfo.current : 0
        });

        message += `\n💰 Variazione crediti: ${coinDelta >= 0 ? '+' : ''}${coinDelta}`;
        message += '\n📈 Usa .classifica per vedere la classifica soldi!';
        
        await msg.reply(message);
    }
};
