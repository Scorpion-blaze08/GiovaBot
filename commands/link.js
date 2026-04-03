const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'link',
    description: 'Link utili per la classe',
    async execute(msg) {
        const args = msg.body.split(' ').slice(1);
        const linkFile = path.join(__dirname, '..', 'data', 'link.json');
        
        function caricaLink() {
            try {
                if (!fs.existsSync(linkFile)) return [];
                return JSON.parse(fs.readFileSync(linkFile, 'utf8'));
            } catch (e) {
                return [];
            }
        }
        
        function salvaLink(data) {
            const dataDir = path.dirname(linkFile);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            fs.writeFileSync(linkFile, JSON.stringify(data, null, 2));
        }
        
        // Lista link
        if (args.length === 0) {
            const links = caricaLink();
            if (links.length === 0) {
                await msg.reply('🔗 LINK UTILI CLASSE\n\n📝 Nessun link salvato!\n\n➕ Usa .link add [nome] [url] [descrizione] per aggiungere');
                return;
            }
            
            let lista = '🔗 LINK UTILI CLASSE 🔗\n\n';
            links.forEach((link, index) => {
                lista += `${index + 1}. 📌 ${link.nome}\n   🌐 ${link.url}\n   📝 ${link.descrizione}\n\n`;
            });
            
            await msg.reply(lista);
            return;
        }
        
        // Aggiungi link
        if (args[0] === 'add' && args.length >= 4) {
            const nome = args[1];
            const url = args[2];
            const descrizione = args.slice(3).join(' ');
            
            if (!url.startsWith('http')) {
                await msg.reply('❌ URL non valido!\n\n🌐 Deve iniziare con http:// o https://');
                return;
            }
            
            const links = caricaLink();
            const nuovoLink = {
                nome,
                url,
                descrizione,
                aggiunto_da: msg._data?.notifyName || 'Anonimo',
                timestamp: Date.now()
            };
            
            links.push(nuovoLink);
            salvaLink(links);
            
            await msg.reply(`🔗 Link aggiunto!\n\n📌 ${nome}\n🌐 ${url}\n📝 ${descrizione}\n\n✅ Usa .link per vedere tutti`);
            return;
        }
        
        // Rimuovi link
        if (args[0] === 'remove' && args.length >= 2) {
            const indice = parseInt(args[1]) - 1;
            const links = caricaLink();
            
            if (indice < 0 || indice >= links.length) {
                await msg.reply('❌ Numero non valido!\n\n📋 Usa .link per vedere la lista numerata');
                return;
            }
            
            const linkRimosso = links.splice(indice, 1)[0];
            salvaLink(links);
            
            await msg.reply(`🗑️ Link rimosso!\n\n📌 ${linkRimosso.nome} eliminato dalla lista`);
            return;
        }
        
        await msg.reply('🔗 LINK UTILI CLASSE\n\n📝 Comandi:\n• .link - mostra tutti\n• .link add [nome] [url] [descrizione] - aggiungi\n• .link remove [numero] - rimuovi\n\nEsempio:\n.link add Registro https://registro.scuola.it Registro elettronico');
    }
};
