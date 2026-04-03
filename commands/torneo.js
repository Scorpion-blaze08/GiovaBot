const { aggiornaClassifica } = require('./classifica');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'torneo',
    description: 'Sistema tornei multiplayer',
    async execute(msg) {
        const args = msg.body.split(' ').slice(1);
        const sender = msg.author || msg.from;
        const torneiFile = path.join(__dirname, '..', 'data', 'tornei.json');
        const adminIds = ['16209290481885@lid'];
        
        function caricaTornei() {
            try {
                if (!fs.existsSync(torneiFile)) return {};
                return JSON.parse(fs.readFileSync(torneiFile, 'utf8'));
            } catch (e) {
                return {};
            }
        }
        
        function salvaTornei(data) {
            const dataDir = path.dirname(torneiFile);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            fs.writeFileSync(torneiFile, JSON.stringify(data, null, 2));
        }
        
        const tornei = caricaTornei();
        
        if (!args[0]) {
            return msg.reply('🏆 SISTEMA TORNEI 🏆\n\n' +
                '• .torneo crea [nome] - Crea torneo (admin)\n' +
                '• .torneo partecipa - Unisciti al torneo\n' +
                '• .torneo lista - Vedi tornei attivi\n' +
                '• .torneo stato - Stato torneo corrente\n' +
                '• .torneo inizia - Inizia torneo (admin)\n' +
                '• .torneo combatti - Combatti nel turno\n' +
                '• .torneo abbandona - Abbandona torneo');
        }
        
        if (args[0] === 'crea') {
            if (!adminIds.includes(sender)) {
                return msg.reply('❌ Solo gli admin possono creare tornei!');
            }
            
            const nome = args.slice(1).join(' ');
            if (!nome) {
                return msg.reply('❌ Specifica il nome del torneo!');
            }
            
            if (Object.values(tornei).some(t => t.stato !== 'finito')) {
                return msg.reply('❌ C\'è già un torneo attivo!');
            }
            
            const torneoId = Date.now().toString();
            tornei[torneoId] = {
                id: torneoId,
                nome: nome,
                creatore: sender,
                partecipanti: [],
                stato: 'iscrizioni',
                turno: 1,
                scontri: [],
                vincitore: null,
                timestamp: Date.now()
            };
            
            salvaTornei(tornei);
            
            return msg.reply(`🏆 TORNEO CREATO! 🏆\n\n` +
                `📋 Nome: ${nome}\n` +
                `👥 Partecipanti: 0/21\n` +
                `📝 Usa .torneo partecipa per iscriverti!\n` +
                `⏰ Iscrizioni aperte per 10 minuti`);
        }
        
        if (args[0] === 'partecipa') {
            const torneo = Object.values(tornei).find(t => t.stato === 'iscrizioni');
            if (!torneo) {
                return msg.reply('❌ Nessun torneo con iscrizioni aperte!');
            }
            
            if (torneo.partecipanti.includes(sender)) {
                return msg.reply('❌ Sei già iscritto al torneo!');
            }
            
            if (torneo.partecipanti.length >= 21) {
                return msg.reply('❌ Torneo pieno! (21/21)');
            }
            
            torneo.partecipanti.push(sender);
            salvaTornei(tornei);
            
            return msg.reply(`✅ Iscritto al torneo "${torneo.nome}"!\n\n` +
                `👥 Partecipanti: ${torneo.partecipanti.length}/21\n` +
                `${torneo.partecipanti.length >= 4 ? '🟢 Minimo raggiunto!' : '🔴 Servono almeno 4 partecipanti'}`);
        }
        
        if (args[0] === 'lista') {
            const torneiAttivi = Object.values(tornei).filter(t => t.stato !== 'finito');
            if (!torneiAttivi.length) {
                return msg.reply('❌ Nessun torneo attivo!');
            }
            
            let message = '🏆 TORNEI ATTIVI 🏆\n\n';
            torneiAttivi.forEach(t => {
                message += `📋 ${t.nome}\n`;
                message += `📊 Stato: ${t.stato}\n`;
                message += `👥 Partecipanti: ${t.partecipanti.length}\n`;
                if (t.stato === 'attivo') {
                    message += `🎯 Turno: ${t.turno}\n`;
                }
                message += '\n';
            });
            
            return msg.reply(message);
        }
        
        if (args[0] === 'inizia') {
            if (!adminIds.includes(sender)) {
                return msg.reply('❌ Solo gli admin possono iniziare tornei!');
            }
            
            const torneo = Object.values(tornei).find(t => t.stato === 'iscrizioni');
            if (!torneo) {
                return msg.reply('❌ Nessun torneo in fase di iscrizione!');
            }
            
            if (torneo.partecipanti.length < 4) {
                return msg.reply('❌ Servono almeno 4 partecipanti!');
            }
            
            // Mescola partecipanti
            const partecipanti = [...torneo.partecipanti].sort(() => Math.random() - 0.5);
            
            // Crea scontri primo turno
            torneo.scontri = [];
            for (let i = 0; i < partecipanti.length; i += 2) {
                if (i + 1 < partecipanti.length) {
                    torneo.scontri.push({
                        giocatore1: partecipanti[i],
                        giocatore2: partecipanti[i + 1],
                        vincitore: null,
                        hp1: 100,
                        hp2: 100,
                        turnoScontro: partecipanti[i]
                    });
                } else {
                    // Bye automatico per numero dispari
                    torneo.scontri.push({
                        giocatore1: partecipanti[i],
                        giocatore2: null,
                        vincitore: partecipanti[i],
                        hp1: 100,
                        hp2: 0,
                        turnoScontro: null
                    });
                }
            }
            
            torneo.stato = 'attivo';
            salvaTornei(tornei);
            
            let message = `🏆 TORNEO INIZIATO! 🏆\n\n`;
            message += `📋 ${torneo.nome}\n`;
            message += `🎯 Turno ${torneo.turno}\n\n`;
            message += `⚔️ SCONTRI:\n`;
            torneo.scontri.forEach((s, i) => {
                message += `${i + 1}. Giocatore vs Giocatore\n`;
            });
            message += `\nUsa .torneo combatti per combattere!`;
            
            return msg.reply(message);
        }
        
        if (args[0] === 'combatti') {
            const torneo = Object.values(tornei).find(t => t.stato === 'attivo');
            if (!torneo) {
                return msg.reply('❌ Nessun torneo attivo!');
            }
            
            const mioScontro = torneo.scontri.find(s => 
                (s.giocatore1 === sender || s.giocatore2 === sender) && !s.vincitore
            );
            
            if (!mioScontro) {
                return msg.reply('❌ Non hai scontri attivi!');
            }
            
            if (mioScontro.turnoScontro !== sender) {
                return msg.reply('❌ Non è il tuo turno nello scontro!');
            }
            
            const sonoGiocatore1 = mioScontro.giocatore1 === sender;
            const mioHp = sonoGiocatore1 ? 'hp1' : 'hp2';
            const avversarioHp = sonoGiocatore1 ? 'hp2' : 'hp1';
            const avversario = sonoGiocatore1 ? mioScontro.giocatore2 : mioScontro.giocatore1;
            
            const danno = Math.floor(Math.random() * 30) + 20; // 20-50 danno
            mioScontro[avversarioHp] = Math.max(0, mioScontro[avversarioHp] - danno);
            mioScontro.turnoScontro = avversario;
            
            let message = `⚔️ ATTACCO TORNEO! ⚔️\n\n`;
            message += `💥 Hai inflitto ${danno} danni!\n`;
            message += `💚 HP: ${mioScontro[mioHp]} vs ${mioScontro[avversarioHp]}`;
            
            if (mioScontro[avversarioHp] <= 0) {
                mioScontro.vincitore = sender;
                message += '\n\n🏆 HAI VINTO LO SCONTRO! 🏆';
                
                // Controlla se il turno è finito
                const scontriFiniti = torneo.scontri.filter(s => s.vincitore).length;
                if (scontriFiniti === torneo.scontri.length) {
                    const vincitori = torneo.scontri.map(s => s.vincitore);
                    
                    if (vincitori.length === 1) {
                        // Torneo finito
                        torneo.vincitore = vincitori[0];
                        torneo.stato = 'finito';
                        message += `\n\n🎉 TORNEO VINTO! 🎉`;
                        aggiornaClassifica(sender, 50, true, 'torneo');
                    } else {
                        // Prossimo turno
                        torneo.turno++;
                        torneo.scontri = [];
                        
                        for (let i = 0; i < vincitori.length; i += 2) {
                            if (i + 1 < vincitori.length) {
                                torneo.scontri.push({
                                    giocatore1: vincitori[i],
                                    giocatore2: vincitori[i + 1],
                                    vincitore: null,
                                    hp1: 100,
                                    hp2: 100,
                                    turnoScontro: vincitori[i]
                                });
                            }
                        }
                        
                        message += `\n\n🎯 TURNO ${torneo.turno} INIZIATO!`;
                    }
                }
                
                aggiornaClassifica(sender, 10, true, 'torneo');
            }
            
            salvaTornei(tornei);
            return msg.reply(message);
        }
        
        if (args[0] === 'stato') {
            const torneo = Object.values(tornei).find(t => t.stato !== 'finito');
            if (!torneo) {
                return msg.reply('❌ Nessun torneo attivo!');
            }
            
            let message = `🏆 STATO TORNEO 🏆\n\n`;
            message += `📋 Nome: ${torneo.nome}\n`;
            message += `📊 Stato: ${torneo.stato}\n`;
            
            if (torneo.stato === 'iscrizioni') {
                message += `👥 Partecipanti: ${torneo.partecipanti.length}/21\n`;
            } else if (torneo.stato === 'attivo') {
                message += `🎯 Turno: ${torneo.turno}\n`;
                message += `⚔️ Scontri attivi: ${torneo.scontri.filter(s => !s.vincitore).length}\n`;
                
                const mioScontro = torneo.scontri.find(s => 
                    (s.giocatore1 === sender || s.giocatore2 === sender) && !s.vincitore
                );
                
                if (mioScontro) {
                    const sonoGiocatore1 = mioScontro.giocatore1 === sender;
                    const mioHp = sonoGiocatore1 ? mioScontro.hp1 : mioScontro.hp2;
                    const avversarioHp = sonoGiocatore1 ? mioScontro.hp2 : mioScontro.hp1;
                    
                    message += `\n💚 I tuoi HP: ${mioHp}/100\n`;
                    message += `💚 HP avversario: ${avversarioHp}/100\n`;
                    message += `🎯 Turno: ${mioScontro.turnoScontro === sender ? 'TUO' : 'AVVERSARIO'}`;
                }
            }
            
            return msg.reply(message);
        }
        
        if (args[0] === 'abbandona') {
            const torneo = Object.values(tornei).find(t => 
                t.partecipanti.includes(sender) && t.stato !== 'finito'
            );
            
            if (!torneo) {
                return msg.reply('❌ Non sei in nessun torneo!');
            }
            
            if (torneo.stato === 'iscrizioni') {
                torneo.partecipanti = torneo.partecipanti.filter(p => p !== sender);
            } else {
                const mioScontro = torneo.scontri.find(s => 
                    (s.giocatore1 === sender || s.giocatore2 === sender) && !s.vincitore
                );
                
                if (mioScontro) {
                    const avversario = mioScontro.giocatore1 === sender ? 
                        mioScontro.giocatore2 : mioScontro.giocatore1;
                    mioScontro.vincitore = avversario;
                    aggiornaClassifica(avversario, 5, true, 'torneo');
                }
            }
            
            salvaTornei(tornei);
            return msg.reply('🏃♂️ Hai abbandonato il torneo!');
        }
    }
};
