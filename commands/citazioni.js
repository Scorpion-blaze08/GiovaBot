const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'citazioni',
    description: 'Citazioni epiche dei professori',
    async execute(msg) {
        const args = msg.body.split(' ').slice(1);
        const citazioniFile = path.join(__dirname, '..', 'data', 'citazioni.json');
        
        function caricaCitazioni() {
            try {
                if (!fs.existsSync(citazioniFile)) return [];
                return JSON.parse(fs.readFileSync(citazioniFile, 'utf8'));
            } catch (e) {
                return [];
            }
        }
        
        function salvaCitazioni(data) {
            const dataDir = path.dirname(citazioniFile);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            fs.writeFileSync(citazioniFile, JSON.stringify(data, null, 2));
        }
        
        // Lista citazioni
        if (args.length === 0) {
            const citazioni = caricaCitazioni();
            if (citazioni.length === 0) {
                await msg.reply('💬 CITAZIONI PROF\n\n📝 Nessuna citazione salvata!\n\n➕ Usa .citazioni add [prof] [frase] per aggiungere');
                return;
            }
            
            let lista = '💬 CITAZIONI PROF 💬\n\n';
            citazioni.slice(-10).forEach((cit, index) => {
                const data = new Date(cit.timestamp).toLocaleDateString('it-IT');
                lista += `${index + 1}. 🎭 Prof. ${cit.prof}:\n   "${cit.frase}"\n   📅 ${data}\n\n`;
            });
            
            lista += `📊 Totale: ${citazioni.length} citazioni`;
            await msg.reply(lista);
            return;
        }
        
        // Citazione casuale
        if (args[0] === 'random') {
            const citazioni = caricaCitazioni();
            if (citazioni.length === 0) {
                await msg.reply('❌ Nessuna citazione disponibile!');
                return;
            }
            
            const citazione = citazioni[Math.floor(Math.random() * citazioni.length)];
            await msg.reply(`💬 CITAZIONE CASUALE\n\n🎭 Prof. ${citazione.prof}:\n"${citazione.frase}"\n\n😂 Epica!`);
            return;
        }
        
        // Aggiungi citazione
        if (args[0] === 'add' && args.length >= 3) {
            const prof = args[1];
            const frase = args.slice(2).join(' ');
            
            if (frase.length < 5) {
                await msg.reply('❌ La citazione è troppo corta!\n\n💭 Scrivi qualcosa di più lungo!');
                return;
            }
            
            const citazioni = caricaCitazioni();
            const nuovaCitazione = {
                prof,
                frase,
                timestamp: Date.now(),
                aggiunta_da: msg._data?.notifyName || 'Anonimo'
            };
            
            citazioni.push(nuovaCitazione);
            salvaCitazioni(citazioni);
            
            await msg.reply(`💬 Citazione aggiunta!\n\n🎭 Prof. ${prof}:\n"${frase}"\n\n😂 Epica! Usa .citazioni per vederle tutte`);
            return;
        }
        
        await msg.reply('💬 CITAZIONI PROF\n\n📝 Comandi:\n• .citazioni - ultime 10\n• .citazioni random - casuale\n• .citazioni add [prof] [frase] - aggiungi\n\nEsempio:\n.citazioni add Rossi La matematica è poesia');
    }
};
