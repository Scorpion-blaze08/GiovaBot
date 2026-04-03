const { aggiornaClassifica } = require('./classifica');
const { aggiungiMonete } = require('../utils/economia');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'pesca',
    description: 'Sistema di pesca con inventario e streak system',
    async execute(msg, client) {
        const sender = msg.author || msg.from;
        const args = msg.body.split(' ').slice(1);
        
        // Lista admin
        const adminIds = ['16209290481885@lid'];
        const isAdmin = adminIds.includes(sender);
        
        // Files
        const inventarioFile = path.join(__dirname, '..', 'data', 'inventario_pesca.json');
        const cooldownFile = path.join(__dirname, '..', 'data', 'cooldown_pesca.json');
        const streakFile = path.join(__dirname, '..', 'data', 'streak_pesca.json');
        
        // Helper functions
        function caricaFile(filePath, defaultValue = {}) {
            try {
                if (!fs.existsSync(filePath)) return defaultValue;
                return JSON.parse(fs.readFileSync(filePath, 'utf8'));
            } catch (e) {
                return defaultValue;
            }
        }
        
        function salvaFile(filePath, data) {
            const dataDir = path.dirname(filePath);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        }
        
        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        
        // Comando admin - pesca leggendaria
        if (args[0] === 'leggendaria' && isAdmin) {
            const cooldowns = caricaFile(cooldownFile);
            const now = Date.now();
            const cooldownTime = 7000;
            
            if (cooldowns[sender] && now - cooldowns[sender] < cooldownTime) {
                const rimanente = Math.ceil((cooldownTime - (now - cooldowns[sender])) / 1000);
                await msg.reply(`⏰ Aspetta ancora ${rimanente} secondi prima di pescare!`);
                return;
            }
            
            cooldowns[sender] = now;
            salvaFile(cooldownFile, cooldowns);
            
            const leggendariIds = [37, 38, 39, 40, 41, 42, 43, 44, 45];
            const randomId = leggendariIds[Math.floor(Math.random() * leggendariIds.length)];
            const pescato = { id: randomId, nome: 'Drago Marino', emoji: '🐉', prezzo: 200 };
            
            if (randomId === 38) { pescato.nome = 'Kraken'; pescato.emoji = '🐙'; pescato.prezzo = 250; }
            else if (randomId === 39) { pescato.nome = 'Leviatano'; pescato.emoji = '🐋'; pescato.prezzo = 300; }
            else if (randomId === 40) { pescato.nome = 'Poseidon'; pescato.emoji = '🔱'; pescato.prezzo = 400; }
            else if (randomId === 41) { pescato.nome = 'Pesce Sirena'; pescato.emoji = '🧜♀️'; pescato.prezzo = 450; }
            else if (randomId === 42) { pescato.nome = 'Pesce Fantasma'; pescato.emoji = '👻'; pescato.prezzo = 500; }
            else if (randomId === 43) { pescato.nome = 'Pesce Arcobaleno'; pescato.emoji = '🌈'; pescato.prezzo = 600; }
            else if (randomId === 44) { pescato.nome = 'Pesce Stellare'; pescato.emoji = '⭐'; pescato.prezzo = 750; }
            else if (randomId === 45) { pescato.nome = 'Pesce Cosmico'; pescato.emoji = '✨'; pescato.prezzo = 1000; }
            
            const inventario = caricaFile(inventarioFile);
            if (!inventario[sender]) inventario[sender] = { pesci: {}, statistiche: { pescate: 0 } };
            if (!inventario[sender].pesci[pescato.id]) inventario[sender].pesci[pescato.id] = 0;
            inventario[sender].pesci[pescato.id]++;
            inventario[sender].statistiche.pescate++;
            
            salvaFile(inventarioFile, inventario);
            
            await msg.reply(`🎣 HAI PESCATO! 🎣\n\n${pescato.emoji} ${pescato.nome}\n🟡 Rarità: Leggendario\n💰 Valore: ${pescato.prezzo} punti`);
            return;
        }
        
        // Comando admin - ruba pesce
        if (args[0] === 'ruba' && isAdmin) {
            const mentions = await msg.getMentions();
            if (!mentions.length || !args[2]) {
                await msg.reply('❌ Uso: .pesca ruba @utente [nome_pesce]');
                return;
            }
            
            const targetId = mentions[0].id._serialized;
            const nomePesce = args.slice(2).join(' ').toLowerCase();
            const inventario = caricaFile(inventarioFile);
            
            if (!inventario[targetId]) {
                await msg.reply('❌ Utente non trovato nell\'inventario!');
                return;
            }
            
            const pesci = {
                1: { nome: 'Sardina', emoji: '🐟' }, 2: { nome: 'Acciuga', emoji: '🐟' }, 3: { nome: 'Aringa', emoji: '🐠' },
                4: { nome: 'Sgombro', emoji: '🐟' }, 5: { nome: 'Merluzzo', emoji: '🐟' }, 6: { nome: 'Nasello', emoji: '🐠' },
                7: { nome: 'Platessa', emoji: '🐟' }, 8: { nome: 'Sogliola', emoji: '🐠' }, 9: { nome: 'Baccalà', emoji: '🐟' },
                10: { nome: 'Carpa', emoji: '🐠' }, 11: { nome: 'Luccio', emoji: '🐟' }, 12: { nome: 'Pesce Persico', emoji: '🐠' },
                13: { nome: 'Anguilla', emoji: '🐍' }, 14: { nome: 'Rombo', emoji: '🐟' }, 15: { nome: 'Spigola', emoji: '🐠' },
                16: { nome: 'Trota', emoji: '🐠' }, 17: { nome: 'Salmone', emoji: '🍣' }, 18: { nome: 'Branzino', emoji: '🐟' },
                19: { nome: 'Orata', emoji: '🐠' }, 20: { nome: 'Tonno', emoji: '🐟' }, 21: { nome: 'Dentice', emoji: '🐠' },
                22: { nome: 'Ricciola', emoji: '🐟' }, 23: { nome: 'Cernia', emoji: '🐠' }, 24: { nome: 'San Pietro', emoji: '🐟' },
                25: { nome: 'Ombrina', emoji: '🐠' }, 26: { nome: 'Sarago', emoji: '🐟' }, 27: { nome: 'Pagello', emoji: '🐠' },
                28: { nome: 'Squalo Bianco', emoji: '🦈' }, 29: { nome: 'Pesce Spada', emoji: '🗡️' }, 30: { nome: 'Marlin', emoji: '🐠' },
                31: { nome: 'Manta', emoji: '🐠' }, 32: { nome: 'Squalo Tigre', emoji: '🦈' }, 33: { nome: 'Barracuda', emoji: '🐟' },
                34: { nome: 'Pesce Dorato', emoji: '🟨' }, 35: { nome: 'Squalo Martello', emoji: '🦈' }, 36: { nome: 'Razza Gigante', emoji: '🐠' },
                37: { nome: 'Drago Marino', emoji: '🐉' }, 38: { nome: 'Kraken', emoji: '🐙' }, 39: { nome: 'Leviatano', emoji: '🐋' },
                40: { nome: 'Poseidon', emoji: '🔱' }, 41: { nome: 'Pesce Sirena', emoji: '🧜♀️' }, 42: { nome: 'Pesce Fantasma', emoji: '👻' },
                43: { nome: 'Pesce Arcobaleno', emoji: '🌈' }, 44: { nome: 'Pesce Stellare', emoji: '⭐' }, 45: { nome: 'Pesce Cosmico', emoji: '✨' }
            };
            
            let pesceTrovato = null;
            for (const [id, pesce] of Object.entries(pesci)) {
                if (pesce.nome.toLowerCase() === nomePesce) {
                    pesceTrovato = { id: parseInt(id), ...pesce };
                    break;
                }
            }
            
            if (!pesceTrovato || !inventario[targetId].pesci[pesceTrovato.id] || inventario[targetId].pesci[pesceTrovato.id] === 0) {
                await msg.reply('❌ L\'utente non ha questo pesce!');
                return;
            }
            
            inventario[targetId].pesci[pesceTrovato.id]--;
            if (!inventario[sender]) inventario[sender] = { pesci: {} };
            if (!inventario[sender].pesci[pesceTrovato.id]) inventario[sender].pesci[pesceTrovato.id] = 0;
            inventario[sender].pesci[pesceTrovato.id]++;
            
            salvaFile(inventarioFile, inventario);
            
            await msg.reply(`🏴☠️ PESCE RUBATO! 🏴☠️\n\n${pesceTrovato.emoji} ${pesceTrovato.nome} rubato da @${targetId.split('@')[0]}!`);
            return;
        }
        
        // Sistema pesca principale
        if (args.length === 0) {
            const cooldowns = caricaFile(cooldownFile);
            const now = Date.now();
            const cooldownTime = 7000;
            
            if (cooldowns[sender] && now - cooldowns[sender] < cooldownTime) {
                const rimanente = Math.ceil((cooldownTime - (now - cooldowns[sender])) / 1000);
                await msg.reply(`⏰ Aspetta ancora ${rimanente} secondi prima di pescare!`);
                return;
            }
            
            cooldowns[sender] = now;
            salvaFile(cooldownFile, cooldowns);
            
            // Carica streak
            const streaks = caricaFile(streakFile);
            if (!streaks[sender]) {
                streaks[sender] = { comuni: 0, rari: 0, epici: 0 };
            }
            
            // Carica inventario
            const inventario = caricaFile(inventarioFile);
            const mioNome = require('../utils/nomi').getNomeCache(sender) || sender.split('@')[0];
            const userName = mioNome || sender;
            
            if (!inventario[sender]) {
                inventario[sender] = { 
                    nome: userName, 
                    pesci: {},
                    statistiche: { pescate: 0 }
                };
            }
            
            // Controlla streak per leggendario garantito
            if (streaks[sender].epici >= 8) {
                // ANIMAZIONE LEGGENDARIO
                const animationMsg = await msg.reply('🎣 Pescando...');
                await sleep(1500);
                
                await animationMsg.edit('🌊 Qualcosa si muove nelle profondità...');
                await sleep(1500);
                
                await animationMsg.edit('⚡ La lenza vibra intensamente!');
                await sleep(1500);
                
                await animationMsg.edit('🔥 ENERGIA LEGGENDARIA RILEVATA!');
                await sleep(1500);
                
                await animationMsg.edit('✨ DESTINO SUPREMO ATTIVO! ✨');
                await sleep(1500);
                
                // Pesca leggendario garantito
                const leggendariIds = [37, 38, 39, 40, 41, 42, 43, 44, 45];
                const randomId = leggendariIds[Math.floor(Math.random() * leggendariIds.length)];
                const pescato = { id: randomId, nome: 'Drago Marino', emoji: '🐉', prezzo: 200 };
                
                if (randomId === 38) { pescato.nome = 'Kraken'; pescato.emoji = '🐙'; pescato.prezzo = 250; }
                else if (randomId === 39) { pescato.nome = 'Leviatano'; pescato.emoji = '🐋'; pescato.prezzo = 300; }
                else if (randomId === 40) { pescato.nome = 'Poseidon'; pescato.emoji = '🔱'; pescato.prezzo = 400; }
                else if (randomId === 41) { pescato.nome = 'Pesce Sirena'; pescato.emoji = '🧜♀️'; pescato.prezzo = 450; }
                else if (randomId === 42) { pescato.nome = 'Pesce Fantasma'; pescato.emoji = '👻'; pescato.prezzo = 500; }
                else if (randomId === 43) { pescato.nome = 'Pesce Arcobaleno'; pescato.emoji = '🌈'; pescato.prezzo = 600; }
                else if (randomId === 44) { pescato.nome = 'Pesce Stellare'; pescato.emoji = '⭐'; pescato.prezzo = 750; }
                else if (randomId === 45) { pescato.nome = 'Pesce Cosmico'; pescato.emoji = '✨'; pescato.prezzo = 1000; }
                
                // Reset tutti gli streak
                streaks[sender] = { comuni: 0, rari: 0, epici: 0 };
                
                // Aggiungi al inventario
                if (!inventario[sender].pesci[pescato.id]) inventario[sender].pesci[pescato.id] = 0;
                inventario[sender].pesci[pescato.id]++;
                inventario[sender].statistiche.pescate++;
                
                salvaFile(streakFile, streaks);
                salvaFile(inventarioFile, inventario);
                
                await animationMsg.edit(`💎 LEGGENDARIO PESCATO! 💎\n\n${pescato.emoji} ${pescato.nome}\n🟡 Rarità: Leggendario\n💰 Valore: ${pescato.prezzo} punti\n\n🔥 Streak Reset: 0/40 comuni`);
                return;
            }
            
            // Controlla streak per epico garantito
            if (streaks[sender].rari >= 20) {
                const epiciIds = [28, 29, 30, 31, 32, 33, 34, 35, 36];
                const randomId = epiciIds[Math.floor(Math.random() * epiciIds.length)];
                const pesci = {
                    28: { nome: 'Squalo Bianco', emoji: '🦈', prezzo: 60 },
                    29: { nome: 'Pesce Spada', emoji: '🗡️', prezzo: 70 },
                    30: { nome: 'Marlin', emoji: '🐠', prezzo: 80 },
                    31: { nome: 'Manta', emoji: '🐠', prezzo: 90 },
                    32: { nome: 'Squalo Tigre', emoji: '🦈', prezzo: 100 },
                    33: { nome: 'Barracuda', emoji: '🐟', prezzo: 110 },
                    34: { nome: 'Pesce Dorato', emoji: '🟨', prezzo: 120 },
                    35: { nome: 'Squalo Martello', emoji: '🦈', prezzo: 130 },
                    36: { nome: 'Razza Gigante', emoji: '🐠', prezzo: 140 }
                };
                
                const pescato = { id: randomId, ...pesci[randomId] };
                
                // Reset streak rari, incrementa epici
                streaks[sender].rari = 0;
                streaks[sender].epici++;
                streaks[sender].comuni = 0;
                
                if (!inventario[sender].pesci[pescato.id]) inventario[sender].pesci[pescato.id] = 0;
                inventario[sender].pesci[pescato.id]++;
                inventario[sender].statistiche.pescate++;
                
                salvaFile(streakFile, streaks);
                salvaFile(inventarioFile, inventario);
                
                await msg.reply(`🎣 HAI PESCATO! 🎣\n\n${pescato.emoji} ${pescato.nome}\n🟣 Rarità: Epico\n💰 Valore: ${pescato.prezzo} punti\n\n🌟 Karma Boost Attivato!\n🔥 Streak Reset: 0/40 comuni\n🔥 Streak Epici: ${streaks[sender].epici}/8`);
                return;
            }
            
            // Controlla streak per raro garantito
            if (streaks[sender].comuni >= 40) {
                const rariIds = [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27];
                const randomId = rariIds[Math.floor(Math.random() * rariIds.length)];
                const pesci = {
                    16: { nome: 'Trota', emoji: '🐠', prezzo: 12 },
                    17: { nome: 'Salmone', emoji: '🍣', prezzo: 15 },
                    18: { nome: 'Branzino', emoji: '🐟', prezzo: 18 },
                    19: { nome: 'Orata', emoji: '🐠', prezzo: 20 },
                    20: { nome: 'Tonno', emoji: '🐟', prezzo: 25 },
                    21: { nome: 'Dentice', emoji: '🐠', prezzo: 28 },
                    22: { nome: 'Ricciola', emoji: '🐟', prezzo: 30 },
                    23: { nome: 'Cernia', emoji: '🐠', prezzo: 32 },
                    24: { nome: 'San Pietro', emoji: '🐟', prezzo: 35 },
                    25: { nome: 'Ombrina', emoji: '🐠', prezzo: 38 },
                    26: { nome: 'Sarago', emoji: '🐟', prezzo: 40 },
                    27: { nome: 'Pagello', emoji: '🐠', prezzo: 42 }
                };
                
                const pescato = { id: randomId, ...pesci[randomId] };
                
                // Reset streak comuni, incrementa rari
                streaks[sender].comuni = 0;
                streaks[sender].rari++;
                
                if (!inventario[sender].pesci[pescato.id]) inventario[sender].pesci[pescato.id] = 0;
                inventario[sender].pesci[pescato.id]++;
                inventario[sender].statistiche.pescate++;
                
                salvaFile(streakFile, streaks);
                salvaFile(inventarioFile, inventario);
                
                await msg.reply(`🎣 HAI PESCATO! 🎣\n\n${pescato.emoji} ${pescato.nome}\n🔵 Rarità: Rara\n💰 Valore: ${pescato.prezzo} punti\n\n⚡ Bonus Fortuna Attivato!\n🔥 Streak Reset: 0/40 comuni\n🔥 Streak Rari: ${streaks[sender].rari}/20`);
                return;
            }
            
            // Pesca normale
            const pesciComuni = {
                1: { nome: 'Sardina', emoji: '🐟', prezzo: 2 },
                2: { nome: 'Acciuga', emoji: '🐟', prezzo: 2 },
                3: { nome: 'Aringa', emoji: '🐠', prezzo: 3 },
                4: { nome: 'Sgombro', emoji: '🐟', prezzo: 3 },
                5: { nome: 'Merluzzo', emoji: '🐟', prezzo: 4 },
                6: { nome: 'Nasello', emoji: '🐠', prezzo: 4 },
                7: { nome: 'Platessa', emoji: '🐟', prezzo: 5 },
                8: { nome: 'Sogliola', emoji: '🐠', prezzo: 5 },
                9: { nome: 'Baccalà', emoji: '🐟', prezzo: 6 },
                10: { nome: 'Carpa', emoji: '🐠', prezzo: 6 },
                11: { nome: 'Luccio', emoji: '🐟', prezzo: 7 },
                12: { nome: 'Pesce Persico', emoji: '🐠', prezzo: 7 },
                13: { nome: 'Anguilla', emoji: '🐍', prezzo: 8 },
                14: { nome: 'Rombo', emoji: '🐟', prezzo: 8 },
                15: { nome: 'Spigola', emoji: '🐠', prezzo: 9 }
            };
            
            const randomId = Math.floor(Math.random() * 15) + 1;
            const pescato = { id: randomId, ...pesciComuni[randomId] };
            
            // Incrementa streak comuni
            streaks[sender].comuni++;
            
            if (!inventario[sender].pesci[pescato.id]) inventario[sender].pesci[pescato.id] = 0;
            inventario[sender].pesci[pescato.id]++;
            inventario[sender].statistiche.pescate++;
            
            salvaFile(streakFile, streaks);
            salvaFile(inventarioFile, inventario);
            
            await msg.reply(`🎣 HAI PESCATO! 🎣\n\n${pescato.emoji} ${pescato.nome}\n⚪ Rarità: Comune\n💰 Valore: ${pescato.prezzo} punti\n\n🔥 Streak: ${streaks[sender].comuni}/40 comuni`);
            return;
        }
        
        // Inventario
        if (args[0] === 'inventario' || args[0] === 'inv') {
            const inventario = caricaFile(inventarioFile);
            const inv = inventario[sender];

            if (!inv || Object.keys(inv.pesci || {}).length === 0) {
                await msg.reply('🎣 Il tuo inventario è vuoto!\n\nUsa .pesca per iniziare a pescare!');
                return;
            }

            const tuttiPesci = {
                1:{nome:'Sardina',emoji:'🐟',prezzo:2,rarità:'⚪'},2:{nome:'Acciuga',emoji:'🐟',prezzo:2,rarità:'⚪'},
                3:{nome:'Aringa',emoji:'🐠',prezzo:3,rarità:'⚪'},4:{nome:'Sgombro',emoji:'🐟',prezzo:3,rarità:'⚪'},
                5:{nome:'Merluzzo',emoji:'🐟',prezzo:4,rarità:'⚪'},6:{nome:'Nasello',emoji:'🐠',prezzo:4,rarità:'⚪'},
                7:{nome:'Platessa',emoji:'🐟',prezzo:5,rarità:'⚪'},8:{nome:'Sogliola',emoji:'🐠',prezzo:5,rarità:'⚪'},
                9:{nome:'Baccalà',emoji:'🐟',prezzo:6,rarità:'⚪'},10:{nome:'Carpa',emoji:'🐠',prezzo:6,rarità:'⚪'},
                11:{nome:'Luccio',emoji:'🐟',prezzo:7,rarità:'⚪'},12:{nome:'Pesce Persico',emoji:'🐠',prezzo:7,rarità:'⚪'},
                13:{nome:'Anguilla',emoji:'🐍',prezzo:8,rarità:'⚪'},14:{nome:'Rombo',emoji:'🐟',prezzo:8,rarità:'⚪'},
                15:{nome:'Spigola',emoji:'🐠',prezzo:9,rarità:'⚪'},16:{nome:'Trota',emoji:'🐠',prezzo:12,rarità:'🔵'},
                17:{nome:'Salmone',emoji:'🍣',prezzo:15,rarità:'🔵'},18:{nome:'Branzino',emoji:'🐟',prezzo:18,rarità:'🔵'},
                19:{nome:'Orata',emoji:'🐠',prezzo:20,rarità:'🔵'},20:{nome:'Tonno',emoji:'🐟',prezzo:25,rarità:'🔵'},
                21:{nome:'Dentice',emoji:'🐠',prezzo:28,rarità:'🔵'},22:{nome:'Ricciola',emoji:'🐟',prezzo:30,rarità:'🔵'},
                23:{nome:'Cernia',emoji:'🐠',prezzo:32,rarità:'🔵'},24:{nome:'San Pietro',emoji:'🐟',prezzo:35,rarità:'🔵'},
                25:{nome:'Ombrina',emoji:'🐠',prezzo:38,rarità:'🔵'},26:{nome:'Sarago',emoji:'🐟',prezzo:40,rarità:'🔵'},
                27:{nome:'Pagello',emoji:'🐠',prezzo:42,rarità:'🔵'},28:{nome:'Squalo Bianco',emoji:'🦈',prezzo:60,rarità:'🟣'},
                29:{nome:'Pesce Spada',emoji:'🗡️',prezzo:70,rarità:'🟣'},30:{nome:'Marlin',emoji:'🐠',prezzo:80,rarità:'🟣'},
                31:{nome:'Manta',emoji:'🐠',prezzo:90,rarità:'🟣'},32:{nome:'Squalo Tigre',emoji:'🦈',prezzo:100,rarità:'🟣'},
                33:{nome:'Barracuda',emoji:'🐟',prezzo:110,rarità:'🟣'},34:{nome:'Pesce Dorato',emoji:'🟨',prezzo:120,rarità:'🟣'},
                35:{nome:'Squalo Martello',emoji:'🦈',prezzo:130,rarità:'🟣'},36:{nome:'Razza Gigante',emoji:'🐠',prezzo:140,rarità:'🟣'},
                37:{nome:'Drago Marino',emoji:'🐉',prezzo:200,rarità:'🟡'},38:{nome:'Kraken',emoji:'🐙',prezzo:250,rarità:'🟡'},
                39:{nome:'Leviatano',emoji:'🐋',prezzo:300,rarità:'🟡'},40:{nome:'Poseidon',emoji:'🔱',prezzo:400,rarità:'🟡'},
                41:{nome:'Pesce Sirena',emoji:'🧜\u200d♀️',prezzo:450,rarità:'🟡'},42:{nome:'Pesce Fantasma',emoji:'👻',prezzo:500,rarità:'🟡'},
                43:{nome:'Pesce Arcobaleno',emoji:'🌈',prezzo:600,rarità:'🟡'},44:{nome:'Pesce Stellare',emoji:'⭐',prezzo:750,rarità:'🟡'},
                45:{nome:'Pesce Cosmico',emoji:'✨',prezzo:1000,rarità:'🟡'}
            };

            let totValore = 0;
            let lines = [];
            for (const [id, qty] of Object.entries(inv.pesci)) {
                if (qty <= 0) continue;
                const p = tuttiPesci[parseInt(id)];
                if (!p) continue;
                const val = p.prezzo * qty;
                totValore += val;
                lines.push(`${p.rarità} ${p.emoji} ${p.nome} x${qty} (${val}pt)`);
            }

            const pescate = inv.statistiche?.pescate || 0;
            let resp = `🎣 INVENTARIO PESCA\n\n`;
            resp += lines.join('\n');
            resp += `\n\n💰 Valore totale: ${totValore} punti\n🎣 Pescate totali: ${pescate}\n\n💡 Usa .pesca vendi tutto per vendere tutto`;
            await msg.reply(resp);
            return;
        }

        // Vendi pesci
        if (args[0] === 'vendi') {
            const inventario = caricaFile(inventarioFile);
            const inv = inventario[sender];

            if (!inv || Object.keys(inv.pesci || {}).length === 0) {
                await msg.reply('❌ Non hai pesci da vendere!');
                return;
            }

            const tuttiPesci = {
                1:{nome:'Sardina',prezzo:2},2:{nome:'Acciuga',prezzo:2},3:{nome:'Aringa',prezzo:3},
                4:{nome:'Sgombro',prezzo:3},5:{nome:'Merluzzo',prezzo:4},6:{nome:'Nasello',prezzo:4},
                7:{nome:'Platessa',prezzo:5},8:{nome:'Sogliola',prezzo:5},9:{nome:'Baccalà',prezzo:6},
                10:{nome:'Carpa',prezzo:6},11:{nome:'Luccio',prezzo:7},12:{nome:'Pesce Persico',prezzo:7},
                13:{nome:'Anguilla',prezzo:8},14:{nome:'Rombo',prezzo:8},15:{nome:'Spigola',prezzo:9},
                16:{nome:'Trota',prezzo:12},17:{nome:'Salmone',prezzo:15},18:{nome:'Branzino',prezzo:18},
                19:{nome:'Orata',prezzo:20},20:{nome:'Tonno',prezzo:25},21:{nome:'Dentice',prezzo:28},
                22:{nome:'Ricciola',prezzo:30},23:{nome:'Cernia',prezzo:32},24:{nome:'San Pietro',prezzo:35},
                25:{nome:'Ombrina',prezzo:38},26:{nome:'Sarago',prezzo:40},27:{nome:'Pagello',prezzo:42},
                28:{nome:'Squalo Bianco',prezzo:60},29:{nome:'Pesce Spada',prezzo:70},30:{nome:'Marlin',prezzo:80},
                31:{nome:'Manta',prezzo:90},32:{nome:'Squalo Tigre',prezzo:100},33:{nome:'Barracuda',prezzo:110},
                34:{nome:'Pesce Dorato',prezzo:120},35:{nome:'Squalo Martello',prezzo:130},36:{nome:'Razza Gigante',prezzo:140},
                37:{nome:'Drago Marino',prezzo:200},38:{nome:'Kraken',prezzo:250},39:{nome:'Leviatano',prezzo:300},
                40:{nome:'Poseidon',prezzo:400},41:{nome:'Pesce Sirena',prezzo:450},42:{nome:'Pesce Fantasma',prezzo:500},
                43:{nome:'Pesce Arcobaleno',prezzo:600},44:{nome:'Pesce Stellare',prezzo:750},45:{nome:'Pesce Cosmico',prezzo:1000}
            };

            const mioNome = require('../utils/nomi').getNomeCache(sender) || sender.split('@')[0];
            const userName = mioNome || sender;

            if (args[1] === 'tutto') {
                let totale = 0;
                for (const [id, qty] of Object.entries(inv.pesci)) {
                    const p = tuttiPesci[parseInt(id)];
                    if (p && qty > 0) totale += p.prezzo * qty;
                }
                inventario[sender].pesci = {};
                salvaFile(inventarioFile, inventario);
                aggiornaClassifica(sender, totale, true, 'pesca', userName);
                aggiungiMonete(sender, totale, userName);
                await msg.reply(`💰 Hai venduto tutti i pesci!\n\n+${totale} punti e +${totale} 🪙 GiovaCoins!\n📈 Usa .classifica pesca per vedere i tuoi punti`);
            } else {
                await msg.reply('💡 Uso: .pesca vendi tutto\n\nVende tutti i pesci nell\'inventario e converte in punti classifica.');
            }
            return;
        }

        // Help
        await msg.reply('🎣 SISTEMA PESCA\n\n📝 Comandi:\n• .pesca — Pesca\n• .pesca inventario — Vedi i tuoi pesci\n• .pesca vendi tutto — Vendi tutto per punti\n\n🔥 Sistema Streak:\n• 40 comuni → Raro garantito\n• 20 rari → Epico garantito\n• 8 epici → Leggendario garantito');
    }
};
