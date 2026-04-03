const { aggiornaClassifica } = require('./classifica');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'battaglia',
    description: 'Battaglie di gruppo e guerre tra fazioni',
    async execute(msg) {
        const args = msg.body.split(' ').slice(1);
        const sender = msg.author || msg.from;
        const battaglieFile = path.join(__dirname, '..', 'data', 'battaglie.json');
        
        function caricaBattaglie() {
            try {
                if (!fs.existsSync(battaglieFile)) return {};
                return JSON.parse(fs.readFileSync(battaglieFile, 'utf8'));
            } catch (e) {
                return {};
            }
        }
        
        function salvaBattaglie(data) {
            const dataDir = path.dirname(battaglieFile);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            fs.writeFileSync(battaglieFile, JSON.stringify(data, null, 2));
        }
        
        const battaglie = caricaBattaglie();
        
        // Lista admin
        const adminIds = ['16209290481885@lid'];
        const isAdmin = adminIds.includes(sender);
        
        // Comando admin - trucca battaglia
        if (args[0] === 'trucca' && isAdmin) {
            const nomeFazione = args.slice(1).join(' ').toLowerCase();
            if (!nomeFazione) {
                await msg.reply('❌ Uso: .battaglia trucca [nome_fazione]');
                return;
            }
            
            const fazione = battaglie.fazioni[nomeFazione];
            if (!fazione) {
                await msg.reply('❌ Fazione non trovata!');
                return;
            }
            
            fazione.vittorie += 5;
            fazione.punti += 500;
            
            // Premi a tutti i membri
            fazione.membri.forEach(membro => {
                aggiornaClassifica(membro, 50, true, 'battaglia', 'Membro');
            });
            
            salvaBattaglie(battaglie);
            
            await msg.reply(`⚔️ BATTAGLIA TRUCCATA! ⚔️\n\n🏆 ${fazione.nome} ha ricevuto:\n+5 vittorie\n+500 punti fazione\n+50 punti a tutti i membri!`);
            return;
        }
        
        if (!args[0]) {
            return msg.reply('⚔️ SISTEMA BATTAGLIE ⚔️\n\n' +
                '🏰 FAZIONI:\n' +
                '• .battaglia crea [nome] - Crea fazione\n' +
                '• .battaglia unisciti [nome] - Unisciti a fazione\n' +
                '• .battaglia lascia - Lascia fazione\n' +
                '• .battaglia fazioni - Lista fazioni\n\n' +
                '⚔️ GUERRA:\n' +
                '• .battaglia sfida [fazione] - Sfida fazione\n' +
                '• .battaglia accetta - Accetta sfida\n' +
                '• .battaglia attacca - Attacca in battaglia\n' +
                '• .battaglia stato - Stato battaglia\n' +
                '• .battaglia resa - Arrenditi');
        }
        
        if (!battaglie.fazioni) battaglie.fazioni = {};
        if (!battaglie.guerre) battaglie.guerre = {};
        if (!battaglie.giocatori) battaglie.giocatori = {};
        
        if (args[0] === 'crea') {
            const nome = args.slice(1).join(' ');
            if (!nome) {
                return msg.reply('❌ Specifica il nome della fazione!');
            }
            
            if (battaglie.giocatori[sender]) {
                return msg.reply('❌ Sei già in una fazione!');
            }
            
            if (battaglie.fazioni[nome.toLowerCase()]) {
                return msg.reply('❌ Fazione già esistente!');
            }
            
            battaglie.fazioni[nome.toLowerCase()] = {
                nome: nome,
                leader: sender,
                membri: [sender],
                vittorie: 0,
                sconfitte: 0,
                punti: 0,
                timestamp: Date.now()
            };
            
            battaglie.giocatori[sender] = {
                fazione: nome.toLowerCase(),
                ruolo: 'leader',
                contributi: 0
            };
            
            salvaBattaglie(battaglie);
            
            return msg.reply(`🏰 FAZIONE CREATA! 🏰\n\n` +
                `👑 Nome: ${nome}\n` +
                `👥 Membri: 1/10\n` +
                `🏆 Record: 0-0\n` +
                `⭐ Punti: 0`);
        }
        
        if (args[0] === 'unisciti') {
            const nome = args.slice(1).join(' ').toLowerCase();
            if (!nome) {
                return msg.reply('❌ Specifica il nome della fazione!');
            }
            
            if (battaglie.giocatori[sender]) {
                return msg.reply('❌ Sei già in una fazione!');
            }
            
            const fazione = battaglie.fazioni[nome];
            if (!fazione) {
                return msg.reply('❌ Fazione non trovata!');
            }
            
            if (fazione.membri.length >= 10) {
                return msg.reply('❌ Fazione piena! (10/10)');
            }
            
            fazione.membri.push(sender);
            battaglie.giocatori[sender] = {
                fazione: nome,
                ruolo: 'membro',
                contributi: 0
            };
            
            salvaBattaglie(battaglie);
            
            return msg.reply(`✅ Ti sei unito alla fazione "${fazione.nome}"!\n\n` +
                `👥 Membri: ${fazione.membri.length}/10\n` +
                `🏆 Record: ${fazione.vittorie}-${fazione.sconfitte}\n` +
                `⭐ Punti: ${fazione.punti}`);
        }
        
        if (args[0] === 'lascia') {
            const giocatore = battaglie.giocatori[sender];
            if (!giocatore) {
                return msg.reply('❌ Non sei in nessuna fazione!');
            }
            
            const fazione = battaglie.fazioni[giocatore.fazione];
            
            if (giocatore.ruolo === 'leader' && fazione.membri.length > 1) {
                return msg.reply('❌ Non puoi lasciare come leader! Passa la leadership prima.');
            }
            
            fazione.membri = fazione.membri.filter(m => m !== sender);
            delete battaglie.giocatori[sender];
            
            if (fazione.membri.length === 0) {
                delete battaglie.fazioni[giocatore.fazione];
            }
            
            salvaBattaglie(battaglie);
            
            return msg.reply(`👋 Hai lasciato la fazione "${fazione.nome}"!`);
        }
        
        if (args[0] === 'fazioni') {
            const fazioniList = Object.values(battaglie.fazioni);
            if (!fazioniList.length) {
                return msg.reply('❌ Nessuna fazione esistente!');
            }
            
            let message = '🏰 FAZIONI ATTIVE 🏰\n\n';
            fazioniList.sort((a, b) => b.punti - a.punti).forEach((f, i) => {
                message += `${i + 1}. ${f.nome}\n`;
                message += `👥 Membri: ${f.membri.length}/10\n`;
                message += `🏆 Record: ${f.vittorie}-${f.sconfitte}\n`;
                message += `⭐ Punti: ${f.punti}\n\n`;
            });
            
            return msg.reply(message);
        }
        
        if (args[0] === 'sfida') {
            const giocatore = battaglie.giocatori[sender];
            if (!giocatore || giocatore.ruolo !== 'leader') {
                return msg.reply('❌ Solo i leader possono sfidare altre fazioni!');
            }
            
            const nomeTarget = args.slice(1).join(' ').toLowerCase();
            if (!nomeTarget) {
                return msg.reply('❌ Specifica la fazione da sfidare!');
            }
            
            const fazioneTarget = battaglie.fazioni[nomeTarget];
            if (!fazioneTarget) {
                return msg.reply('❌ Fazione non trovata!');
            }
            
            if (nomeTarget === giocatore.fazione) {
                return msg.reply('❌ Non puoi sfidare la tua stessa fazione!');
            }
            
            if (Object.values(battaglie.guerre).some(g => 
                (g.fazione1 === giocatore.fazione || g.fazione2 === giocatore.fazione) && 
                g.stato !== 'finita'
            )) {
                return msg.reply('❌ La tua fazione è già in guerra!');
            }
            
            const guerraId = Date.now().toString();
            battaglie.guerre[guerraId] = {
                id: guerraId,
                fazione1: giocatore.fazione,
                fazione2: nomeTarget,
                sfidante: sender,
                stato: 'attesa',
                hp1: 500,
                hp2: 500,
                turno: null,
                partecipanti1: [],
                partecipanti2: [],
                timestamp: Date.now()
            };
            
            salvaBattaglie(battaglie);
            
            return msg.reply(`⚔️ SFIDA LANCIATA! ⚔️\n\n` +
                `🏰 ${battaglie.fazioni[giocatore.fazione].nome} VS ${fazioneTarget.nome}\n\n` +
                `Il leader di "${fazioneTarget.nome}" deve usare .battaglia accetta\n` +
                `⏰ Tempo limite: 5 minuti`);
        }
        
        if (args[0] === 'accetta') {
            const giocatore = battaglie.giocatori[sender];
            if (!giocatore || giocatore.ruolo !== 'leader') {
                return msg.reply('❌ Solo i leader possono accettare sfide!');
            }
            
            const guerra = Object.values(battaglie.guerre).find(g => 
                g.fazione2 === giocatore.fazione && g.stato === 'attesa'
            );
            
            if (!guerra) {
                return msg.reply('❌ Nessuna sfida in attesa!');
            }
            
            guerra.stato = 'attiva';
            guerra.turno = guerra.fazione1;
            
            salvaBattaglie(battaglie);
            
            return msg.reply(`⚔️ GUERRA INIZIATA! ⚔️\n\n` +
                `🏰 ${battaglie.fazioni[guerra.fazione1].nome} VS ${battaglie.fazioni[guerra.fazione2].nome}\n\n` +
                `💚 HP: 500 vs 500\n` +
                `🎯 Turno: ${battaglie.fazioni[guerra.fazione1].nome}\n\n` +
                `I membri possono usare .battaglia attacca!`);
        }
        
        if (args[0] === 'attacca') {
            const giocatore = battaglie.giocatori[sender];
            if (!giocatore) {
                return msg.reply('❌ Non sei in nessuna fazione!');
            }
            
            const guerra = Object.values(battaglie.guerre).find(g => 
                (g.fazione1 === giocatore.fazione || g.fazione2 === giocatore.fazione) && 
                g.stato === 'attiva'
            );
            
            if (!guerra) {
                return msg.reply('❌ La tua fazione non è in guerra!');
            }
            
            if (guerra.turno !== giocatore.fazione) {
                return msg.reply('❌ Non è il turno della tua fazione!');
            }
            
            const mieiPartecipanti = giocatore.fazione === guerra.fazione1 ? 
                guerra.partecipanti1 : guerra.partecipanti2;
            
            if (mieiPartecipanti.includes(sender)) {
                return msg.reply('❌ Hai già attaccato questo turno!');
            }
            
            const danno = Math.floor(Math.random() * 40) + 30; // 30-70 danno
            const mioHp = giocatore.fazione === guerra.fazione1 ? 'hp1' : 'hp2';
            const avversarioHp = giocatore.fazione === guerra.fazione1 ? 'hp2' : 'hp1';
            
            guerra[avversarioHp] = Math.max(0, guerra[avversarioHp] - danno);
            mieiPartecipanti.push(sender);
            
            battaglie.giocatori[sender].contributi++;
            
            let message = `⚔️ ATTACCO IN GUERRA! ⚔️\n\n`;
            message += `💥 Hai inflitto ${danno} danni!\n`;
            message += `💚 HP: ${guerra.hp1} vs ${guerra.hp2}\n`;
            message += `👥 Attaccanti turno: ${mieiPartecipanti.length}`;
            
            // Cambia turno se tutti hanno attaccato o dopo 3 attacchi
            if (mieiPartecipanti.length >= 3 || 
                mieiPartecipanti.length >= battaglie.fazioni[giocatore.fazione].membri.length) {
                
                guerra.turno = guerra.fazione1 === giocatore.fazione ? guerra.fazione2 : guerra.fazione1;
                guerra.partecipanti1 = [];
                guerra.partecipanti2 = [];
                
                message += `\n\n🔄 Turno passato a ${battaglie.fazioni[guerra.turno].nome}!`;
            }
            
            // Controlla vittoria
            if (guerra[avversarioHp] <= 0) {
                const fazioneVincente = battaglie.fazioni[giocatore.fazione];
                const fazione1 = battaglie.fazioni[guerra.fazione1];
                const fazione2 = battaglie.fazioni[guerra.fazione2];
                
                fazioneVincente.vittorie++;
                fazioneVincente.punti += 100;
                
                const fazione_perdente = giocatore.fazione === guerra.fazione1 ? fazione2 : fazione1;
                fazione_perdente.sconfitte++;
                
                guerra.stato = 'finita';
                guerra.vincitore = giocatore.fazione;
                
                message += `\n\n🏆 ${fazioneVincente.nome} HA VINTO LA GUERRA! 🏆`;
                
                // Premi ai partecipanti
                fazioneVincente.membri.forEach(membro => {
                    aggiornaClassifica(membro, 25, true, 'battaglia');
                });
            }
            
            salvaBattaglie(battaglie);
            return msg.reply(message);
        }
        
        if (args[0] === 'stato') {
            const giocatore = battaglie.giocatori[sender];
            if (!giocatore) {
                return msg.reply('❌ Non sei in nessuna fazione!');
            }
            
            const fazione = battaglie.fazioni[giocatore.fazione];
            const guerra = Object.values(battaglie.guerre).find(g => 
                (g.fazione1 === giocatore.fazione || g.fazione2 === giocatore.fazione) && 
                g.stato === 'attiva'
            );
            
            let message = `🏰 STATO FAZIONE 🏰\n\n`;
            message += `👑 Nome: ${fazione.nome}\n`;
            message += `👥 Membri: ${fazione.membri.length}/10\n`;
            message += `🏆 Record: ${fazione.vittorie}-${fazione.sconfitte}\n`;
            message += `⭐ Punti: ${fazione.punti}\n`;
            message += `🎯 I tuoi contributi: ${giocatore.contributi}`;
            
            if (guerra) {
                const avversario = guerra.fazione1 === giocatore.fazione ? guerra.fazione2 : guerra.fazione1;
                message += `\n\n⚔️ IN GUERRA CON: ${battaglie.fazioni[avversario].nome}\n`;
                message += `💚 HP: ${guerra.hp1} vs ${guerra.hp2}\n`;
                message += `🎯 Turno: ${battaglie.fazioni[guerra.turno].nome}`;
            }
            
            return msg.reply(message);
        }
        
        if (args[0] === 'resa') {
            const giocatore = battaglie.giocatori[sender];
            if (!giocatore || giocatore.ruolo !== 'leader') {
                return msg.reply('❌ Solo i leader possono arrendersi!');
            }
            
            const guerra = Object.values(battaglie.guerre).find(g => 
                (g.fazione1 === giocatore.fazione || g.fazione2 === giocatore.fazione) && 
                g.stato === 'attiva'
            );
            
            if (!guerra) {
                return msg.reply('❌ La tua fazione non è in guerra!');
            }
            
            const fazioneVincente = guerra.fazione1 === giocatore.fazione ? guerra.fazione2 : guerra.fazione1;
            const fazione_perdente = battaglie.fazioni[giocatore.fazione];
            const fazione_vincente = battaglie.fazioni[fazioneVincente];
            
            fazione_vincente.vittorie++;
            fazione_vincente.punti += 50;
            fazione_perdente.sconfitte++;
            
            guerra.stato = 'finita';
            guerra.vincitore = fazioneVincente;
            
            salvaBattaglie(battaglie);
            
            return msg.reply(`🏳️ ${fazione_perdente.nome} si è arresa!\n\n` +
                `🏆 ${fazione_vincente.nome} vince per resa!`);
        }
    }
};
