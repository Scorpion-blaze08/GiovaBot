const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'verifiche',
    description: 'Calendario verifiche e interrogazioni',
    async execute(msg) {
        const args = msg.body.split(' ').slice(1);
        const verificheFile = path.join(__dirname, '..', 'data', 'verifiche.json');
        
        function caricaVerifiche() {
            try {
                if (!fs.existsSync(verificheFile)) return [];
                return JSON.parse(fs.readFileSync(verificheFile, 'utf8'));
            } catch (e) {
                return [];
            }
        }
        
        function salvaVerifiche(data) {
            const dataDir = path.dirname(verificheFile);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            fs.writeFileSync(verificheFile, JSON.stringify(data, null, 2));
        }
        
        // Lista verifiche
        if (args.length === 0) {
            const verifiche = caricaVerifiche();
            if (verifiche.length === 0) {
                await msg.reply('📅 CALENDARIO VERIFICHE\n\n📝 Nessuna verifica programmata!\n\n➕ Usa .verifiche add [gg/mm] [materia] [tipo] per aggiungere');
                return;
            }
            
            // Filtra solo future e ordina per data
            const oggi = new Date();
            const verificheFuture = verifiche.filter(v => {
                const [giorno, mese] = v.data.split('/').map(Number);
                const dataVerifica = new Date(oggi.getFullYear(), mese - 1, giorno);
                return dataVerifica >= oggi;
            }).sort((a, b) => {
                const [gA, mA] = a.data.split('/').map(Number);
                const [gB, mB] = b.data.split('/').map(Number);
                return mA === mB ? gA - gB : mA - mB;
            });
            
            if (verificheFuture.length === 0) {
                await msg.reply('📅 CALENDARIO VERIFICHE\n\n✅ Nessuna verifica in programma!\n\n🎉 Godetevi la pausa!');
                return;
            }
            
            let lista = '📅 PROSSIME VERIFICHE 📅\n\n';
            verificheFuture.forEach((ver, index) => {
                const emoji = ver.tipo === 'verifica' ? '📝' : '🗣️';
                lista += `${index + 1}. ${emoji} ${ver.data} - ${ver.materia}\n   📋 ${ver.tipo}\n`;
                if (ver.argomenti) lista += `   📚 ${ver.argomenti}\n`;
                lista += '\n';
            });
            
            await msg.reply(lista);
            return;
        }
        
        // Aggiungi verifica
        if (args[0] === 'add' && args.length >= 4) {
            const data = args[1];
            const materia = args[2];
            const tipo = args[3];
            const argomenti = args.slice(4).join(' ');
            
            if (!/^\d{1,2}\/\d{1,2}$/.test(data)) {
                await msg.reply('❌ Formato data errato!\n\n📅 Usa: .verifiche add [gg/mm] [materia] [tipo] [argomenti]\nEsempio: .verifiche add 15/3 matematica verifica Equazioni');
                return;
            }
            
            if (!['verifica', 'interrogazione'].includes(tipo.toLowerCase())) {
                await msg.reply('❌ Tipo non valido!\n\n📝 Usa: verifica o interrogazione');
                return;
            }
            
            const verifiche = caricaVerifiche();
            const nuovaVerifica = {
                data,
                materia,
                tipo: tipo.toLowerCase(),
                argomenti: argomenti || 'Non specificati',
                aggiunta_da: msg._data?.notifyName || 'Anonimo',
                timestamp: Date.now()
            };
            
            verifiche.push(nuovaVerifica);
            salvaVerifiche(verifiche);
            
            const emoji = tipo.toLowerCase() === 'verifica' ? '📝' : '🗣️';
            await msg.reply(`📅 Verifica aggiunta!\n\n${emoji} ${data} - ${materia}\n📋 ${tipo}\n📚 ${argomenti || 'Non specificati'}\n\n⚠️ Usa .verifiche per vedere tutte`);
            return;
        }
        
        // Rimuovi verifica
        if (args[0] === 'remove' && args.length >= 2) {
            const indice = parseInt(args[1]) - 1;
            const verifiche = caricaVerifiche();
            
            if (indice < 0 || indice >= verifiche.length) {
                await msg.reply('❌ Numero non valido!\n\n📋 Usa .verifiche per vedere la lista numerata');
                return;
            }
            
            const verificaRimossa = verifiche.splice(indice, 1)[0];
            salvaVerifiche(verifiche);
            
            await msg.reply(`🗑️ Verifica rimossa!\n\n📅 ${verificaRimossa.data} - ${verificaRimossa.materia} eliminata`);
            return;
        }
        
        await msg.reply('📅 CALENDARIO VERIFICHE\n\n📝 Comandi:\n• .verifiche - mostra prossime\n• .verifiche add [gg/mm] [materia] [verifica/interrogazione] [argomenti] - aggiungi\n• .verifiche remove [numero] - rimuovi\n\nEsempio:\n.verifiche add 15/3 matematica verifica Equazioni di secondo grado');
    }
};
