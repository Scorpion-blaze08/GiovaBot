const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'confessione',
    description: 'Sistema confessioni anonime',
    async execute(msg, client) {
        const args = msg.body.split(' ').slice(1);
        const confessioniFile = path.join(__dirname, '..', 'data', 'confessioni.json');
        const GROUP_ID = '120363046559211268@g.us'; // ID del gruppo
        
        function caricaConfessioni() {
            try {
                if (!fs.existsSync(confessioniFile)) return [];
                return JSON.parse(fs.readFileSync(confessioniFile, 'utf8'));
            } catch (e) {
                return [];
            }
        }
        
        function salvaConfessioni(data) {
            const dataDir = path.dirname(confessioniFile);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            fs.writeFileSync(confessioniFile, JSON.stringify(data, null, 2));
        }
        
        // Lista confessioni (solo in gruppo)
        if (args.length === 0) {
            if (msg.from !== GROUP_ID) {
                await msg.reply('🤫 CONFESSIONI ANONIME\n\n📝 Scrivi in privato al bot:\n.confessione [testo]\n\n🔒 Sarà pubblicata anonimamente nel gruppo!');
                return;
            }
            
            const confessioni = caricaConfessioni();
            if (confessioni.length === 0) {
                await msg.reply('🤫 CONFESSIONI ANONIME\n\n📝 Nessuna confessione ancora!\n\n💭 Scrivete in privato al bot per confessare!');
                return;
            }
            
            let lista = '🤫 CONFESSIONI ANONIME 🤫\n\n';
            confessioni.slice(-5).forEach((conf, index) => {
                const data = new Date(conf.timestamp).toLocaleDateString('it-IT');
                lista += `${index + 1}. 💭 "${conf.testo}"\n   📅 ${data}\n\n`;
            });
            
            lista += `📊 Totale confessioni: ${confessioni.length}\n`;
            lista += '🤐 Tutte rigorosamente anonime!';
            
            await msg.reply(lista);
            return;
        }
        
        // Nuova confessione (solo in privato)
        if (msg.from === GROUP_ID) {
            await msg.reply('🤫 Per confessare scrivi in PRIVATO al bot!\n\n🔒 Solo così sarà davvero anonimo!');
            return;
        }
        
        const confessione = args.join(' ');
        if (confessione.length < 10) {
            await msg.reply('❌ La confessione deve essere di almeno 10 caratteri!\n\n💭 Scrivi qualcosa di più significativo!');
            return;
        }
        
        if (confessione.length > 200) {
            await msg.reply('❌ La confessione è troppo lunga! Massimo 200 caratteri.\n\n✂️ Accorciala un po\'!');
            return;
        }
        
        const confessioni = caricaConfessioni();
        const nuovaConfessione = {
            testo: confessione,
            timestamp: Date.now(),
            id: confessioni.length + 1
        };
        
        confessioni.push(nuovaConfessione);
        salvaConfessioni(confessioni);
        
        // Invia conferma in privato
        await msg.reply('🤫 Confessione ricevuta!\n\n📤 Sarà pubblicata anonimamente nel gruppo!');
        
        // Pubblica nel gruppo anonimamente
        try {
            await client.sendMessage(GROUP_ID, `🤫 NUOVA CONFESSIONE ANONIMA #${nuovaConfessione.id}\n\n💭 "${confessione}"\n\n🤐 Inviata anonimamente tramite bot`);
        } catch (error) {
            console.error('Errore invio confessione:', error);
        }
    }
};
