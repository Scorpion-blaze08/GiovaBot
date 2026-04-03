const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'compleanni',
    description: 'Gestione compleanni della classe',
    async execute(msg) {
        const args = msg.body.split(' ').slice(1);
        const compleanniFile = path.join(__dirname, '..', 'data', 'compleanni.json');
        
        function caricaCompleanni() {
            try {
                if (!fs.existsSync(compleanniFile)) return [];
                return JSON.parse(fs.readFileSync(compleanniFile, 'utf8'));
            } catch (e) {
                return [];
            }
        }
        
        function salvaCompleanni(data) {
            const dataDir = path.dirname(compleanniFile);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            fs.writeFileSync(compleanniFile, JSON.stringify(data, null, 2));
        }
        
        // Lista compleanni
        if (args.length === 0) {
            const compleanni = caricaCompleanni();
            if (compleanni.length === 0) {
                await msg.reply('🎂 COMPLEANNI CLASSE\n\n📝 Nessun compleanno salvato!\n\n➕ Usa .compleanni add [nome] [gg/mm] per aggiungere');
                return;
            }
            
            // Ordina per mese e giorno
            compleanni.sort((a, b) => {
                const [gA, mA] = a.data.split('/').map(Number);
                const [gB, mB] = b.data.split('/').map(Number);
                return mA === mB ? gA - gB : mA - mB;
            });
            
            let lista = '🎂 COMPLEANNI CLASSE 🎂\n\n';
            compleanni.forEach(comp => {
                const [giorno, mese] = comp.data.split('/');
                const mesi = ['', 'Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
                lista += `🎉 ${comp.nome}: ${giorno} ${mesi[parseInt(mese)]}\n`;
            });
            
            await msg.reply(lista);
            return;
        }
        
        // Aggiungi compleanno
        if (args[0] === 'add' && args.length >= 3) {
            const nome = args[1];
            const data = args[2];
            
            if (!/^\d{1,2}\/\d{1,2}$/.test(data)) {
                await msg.reply('❌ Formato data errato!\n\n📅 Usa: .compleanni add [nome] [gg/mm]\nEsempio: .compleanni add Marco 15/3');
                return;
            }
            
            const compleanni = caricaCompleanni();
            compleanni.push({ nome, data });
            salvaCompleanni(compleanni);
            
            await msg.reply(`🎂 Compleanno aggiunto!\n\n🎉 ${nome}: ${data}\n\n📋 Usa .compleanni per vedere tutti`);
            return;
        }
        
        // Rimuovi compleanno
        if (args[0] === 'remove' && args.length >= 2) {
            const nome = args[1];
            const compleanni = caricaCompleanni();
            
            const index = compleanni.findIndex(comp => comp.nome.toLowerCase() === nome.toLowerCase());
            if (index === -1) {
                await msg.reply(`❌ Compleanno di ${nome} non trovato!\n\n📋 Usa .compleanni per vedere la lista`);
                return;
            }
            
            const rimosso = compleanni.splice(index, 1)[0];
            salvaCompleanni(compleanni);
            
            await msg.reply(`🗑️ Compleanno rimosso!\n\n❌ ${rimosso.nome}: ${rimosso.data}\n\n📋 Usa .compleanni per vedere la lista aggiornata`);
            return;
        }
        
        await msg.reply('🎂 COMPLEANNI CLASSE\n\n📝 Comandi:\n• .compleanni - lista tutti\n• .compleanni add [nome] [gg/mm] - aggiungi\n• .compleanni remove [nome] - rimuovi\n\nEsempi:\n.compleanni add Marco 15/3\n.compleanni remove Marco');
    }
};
