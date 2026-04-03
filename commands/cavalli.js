const { aggiornaClassifica } = require('./classifica');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'cavalli',
    description: 'Corsa dei cavalli con scommesse',
    async execute(msg, client) {
        const args = msg.body.split(' ').slice(1);
        const sender = msg.author || msg.from;
        
        // Lista admin
        const adminIds = ['16209290481885@lid'];
        const isAdmin = adminIds.includes(sender);
        
        // Comando admin - trucca cavallo
        if (args[0] === 'trucca' && isAdmin) {
            const numero = parseInt(args[1]);
            if (!numero || numero < 1 || numero > 4) {
                await msg.reply('❌ Uso: .cavalli trucca [1-4]');
                return;
            }
            
            const horses = ['Fulmine 🐎', 'Stella 🏇', 'Vento 🐴', 'Lampo 🦄'];
            const mioNome = require('../utils/nomi').getNomeCache(sender) || sender.split('@')[0];
            const userName = mioNome || sender;
            
            aggiornaClassifica(sender, 10, true, 'cavalli', userName);
            
            await msg.reply(`🏇 GARA TRUCCATA! 🏇\n\n🏆 ${horses[numero-1]} ha vinto!\n💰 +10 punti admin!`);
            return;
        }
        
        // Comando admin - ruba punti
        if (args[0] === 'ruba' && isAdmin) {
            const mentions = await msg.getMentions();
            if (!mentions.length || !args[2]) {
                await msg.reply('❌ Uso: .cavalli ruba @utente [punti]');
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
            
            aggiornaClassifica(targetId, -punti, false, 'cavalli', 'Vittima');
            aggiornaClassifica(sender, punti, true, 'cavalli', userName);
            
            await msg.reply(`🏴☠️ PUNTI RUBATI! 🏴☠️\n\n💰 ${punti} punti rubati da @${targetId.split('@')[0]}!`);
            return;
        }
        
        const horses = [
            { name: 'Fulmine', emoji: '🐎', position: 0, id: 1 },
            { name: 'Stella', emoji: '🏇', position: 0, id: 2 },
            { name: 'Vento', emoji: '🐴', position: 0, id: 3 },
            { name: 'Lampo', emoji: '🦄', position: 0, id: 4 }
        ];
        
        const trackLength = 12;
        const finishLine = '🏁';
        
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
        
        // Fase scommesse
        let scommesseMessage = '🏇 CORSA DEI CAVALLI - SCOMMESSE 🏇\n\n';
        scommesseMessage += '🐎 1. Fulmine\n🏇 2. Stella\n🐴 3. Vento\n🦄 4. Lampo\n\n';
        scommesseMessage += '💰 Scommetti scrivendo: cavallo [numero]\n';
        scommesseMessage += 'Esempio: cavallo 1\n\n';
        scommesseMessage += '⏰ Hai 30 secondi per scommettere!\n';
        scommesseMessage += '🏆 Vincita: +10 punti | Perdita: -2 punti';
        
        await msg.reply(scommesseMessage);
        
        // Raccogli scommesse per 30 secondi
        const scommesse = new Map();
        const startTime = Date.now();
        const scommesseTimeout = 30000; // 30 secondi
        
        const messageHandler = (newMsg) => {
            if (Date.now() - startTime > scommesseTimeout) return;
            
            const body = newMsg.body.toLowerCase();
            if (body.startsWith('cavallo ')) {
                const numero = parseInt(body.split(' ')[1]);
                if (numero >= 1 && numero <= 4) {
                    const sender = newMsg.author || newMsg.from;
                    const mioNome = newMsg._data?.notifyName || newMsg.contact?.pushname;
                    
                    // Salva nome se disponibile
                    if (mioNome && mioNome !== sender) {
                        const nomi = caricaNomi();
                        nomi[sender] = mioNome;
                        salvaNomi(nomi);
                    }
                    
                    const userName = mioNome || sender;
                    scommesse.set(sender, {numero, nome: userName});
                    newMsg.reply(`✅ ${userName} ha scommesso su ${horses[numero-1].name} ${horses[numero-1].emoji}!`);
                }
            }
        };
        
        client.on('message', messageHandler);
        
        // Aspetta 30 secondi
        await sleep(scommesseTimeout);
        
        // Rimuovi listener
        client.removeListener('message', messageHandler);
        
        if (scommesse.size === 0) {
            msg.reply('❌ Nessuna scommessa! La gara è annullata.');
            return;
        }
        
        // Mostra scommesse
        let riepilogoScommesse = '📊 RIEPILOGO SCOMMESSE:\n\n';
        scommesse.forEach((scommessa, giocatore) => {
            riepilogoScommesse += `${scommessa.nome}: ${horses[scommessa.numero-1].name} ${horses[scommessa.numero-1].emoji}\n`;
        });
        riepilogoScommesse += '\n🚀 La gara inizia!';
        
        const raceMessage = await client.sendMessage(msg.from, riepilogoScommesse);
        await sleep(3000);
        
        // Inizia la gara
        let raceFinished = false;
        let winner = null;
        let round = 1;
        
        while (!raceFinished) {
            // Muovi ogni cavallo
            horses.forEach(horse => {
                const move = Math.floor(Math.random() * 3);
                horse.position += move;
                
                if (horse.position >= trackLength && !winner) {
                    winner = horse;
                    raceFinished = true;
                }
            });
            
            // Crea visualizzazione
            let trackDisplay = `🏇 CORSA DEI CAVALLI - Round ${round} 🏇\n\n`;
            
            horses.forEach(horse => {
                let track = '';
                for (let i = 0; i < trackLength; i++) {
                    if (i === Math.min(horse.position, trackLength - 1)) {
                        track += horse.emoji;
                    } else {
                        track += '━';
                    }
                }
                track += finishLine;
                trackDisplay += `${horse.name}: ${track}\n`;
            });
            
            // Inizializza sempre allMentions
            let allMentions = [];
            
            if (winner) {
                trackDisplay += `\n🎉 VINCITORE: ${winner.name} ${winner.emoji}!\n\n`;
                
                // Calcola vincitori e perdenti
                let vincitori = [];
                let perdenti = [];
                
                scommesse.forEach((scommessa, giocatore) => {
                    const isWin = scommessa.numero === winner.id;
                    
                    if (isWin) {
                        vincitori.push(`@${giocatore.split('@')[0]}`);
                        allMentions.push(giocatore);
                        aggiornaClassifica(giocatore, 10, true, 'cavalli', scommessa.nome);
                    } else {
                        perdenti.push(`@${giocatore.split('@')[0]}`);
                        allMentions.push(giocatore);
                        aggiornaClassifica(giocatore, -2, false, 'cavalli', scommessa.nome);
                    }
                    
                    // Sistema Streak
                    if (global.updateStreak) {
                        const streakInfo = global.updateStreak(giocatore, 'cavalli', isWin);
                        
                        if (streakInfo.current > 0) {
                            const streakEmoji = streakInfo.current >= 5 ? '🔥' : streakInfo.current >= 3 ? '🎆' : '✨';
                            const streakMsg = `${streakEmoji} Streak: ${streakInfo.current}!`;
                            
                            if (streakInfo.current === streakInfo.best && streakInfo.current > 1) {
                                client.sendMessage(msg.from, `@${giocatore.split('@')[0]} ${streakMsg} 🏆 NUOVO RECORD!`, { mentions: [giocatore] });
                            } else if (streakInfo.current >= 3) {
                                client.sendMessage(msg.from, `@${giocatore.split('@')[0]} ${streakMsg}`, { mentions: [giocatore] });
                            }
                        }
                    }
                });
                
                if (vincitori.length > 0) {
                    trackDisplay += `🏆 VINCITORI (+10 punti):\n${vincitori.join(', ')}\n\n`;
                }
                if (perdenti.length > 0) {
                    trackDisplay += `😔 PERDENTI (-2 punti):\n${perdenti.join(', ')}\n\n`;
                }
                
                trackDisplay += '📊 Usa .classifica per vedere i punti!';
            }
            
            // Modifica il messaggio esistente invece di inviarne uno nuovo
            try {
                if (winner && allMentions.length > 0) {
                    await raceMessage.edit(trackDisplay, { mentions: allMentions });
                } else {
                    await raceMessage.edit(trackDisplay);
                }
            } catch (error) {
                try {
                    if (winner && allMentions.length > 0) {
                        await client.sendMessage(msg.from, trackDisplay, { mentions: allMentions });
                    } else {
                        await client.sendMessage(msg.from, trackDisplay);
                    }
                } catch (e) {
                    console.error('Errore invio aggiornamento gara:', e.message);
                }
            }
            
            if (!raceFinished) {
                await sleep(2000);
                round++;
            }
            
            if (round > 15) {
                raceFinished = true;
                trackDisplay += '\n\n⏰ Gara troppo lunga! Pareggio!';
            }
        }
    }
};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
