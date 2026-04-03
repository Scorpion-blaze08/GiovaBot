const fs = require('fs');
const path = require('path');
const { getSenderId, isAdmin } = require('../utils/identity');

module.exports = {
    name: 'mute',
    description: 'Comando admin per mutare utenti',
    async execute(msg, client) {
        const args = msg.body.split(' ').slice(1);
        const muteFile = path.join(__dirname, '..', 'data', 'muted_users.json');
        
        // Lista admin
        const sender = await getSenderId(msg);
        
        // Verifica se l'utente è admin
        if (!isAdmin(sender)) {
            await msg.reply('❌ Solo gli admin possono usare questo comando!');
            return;
        }
        
        function caricaMuted() {
            try {
                if (!fs.existsSync(muteFile)) return {};
                return JSON.parse(fs.readFileSync(muteFile, 'utf8'));
            } catch (e) {
                return {};
            }
        }
        
        function salvaMuted(data) {
            const dataDir = path.dirname(muteFile);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            fs.writeFileSync(muteFile, JSON.stringify(data, null, 2));
        }
        
        // Help comando
        if (args.length === 0 || args[0] === 'help') {
            let message = '🔇 COMANDO MUTE ADMIN 🔇\n\n';
            message += '📝 COMANDI:\n';
            message += '• .mute @utente [tempo] - Muta utente\n';
            message += '• .mute lista - Vedi utenti mutati\n';
            message += '• .mute unmute @utente - Rimuovi mute\n';
            message += '• .mute clear - Rimuovi tutti i mute\n\n';
            message += '⏰ FORMATI TEMPO:\n';
            message += '• 30s = 30 secondi\n';
            message += '• 5m = 5 minuti\n';
            message += '• 2h = 2 ore\n';
            message += '• 1d = 1 giorno\n';
            message += '• 1w = 1 settimana\n\n';
            message += '💡 ESEMPI:\n';
            message += '• .mute @Mario 30m\n';
            message += '• .mute @Luigi 2h\n';
            message += '• .mute @Bowser 1d';
            
            await msg.reply(message);
            return;
        }
        
        const muted = caricaMuted();
        
        // Lista utenti mutati
        if (args[0] === 'lista') {
            const now = Date.now();
            let message = '🔇 UTENTI MUTATI 🔇\n\n';
            const mentions = [];
            
            const activeMutes = Object.entries(muted).filter(([_, data]) => data.scadenza > now);
            
            if (activeMutes.length === 0) {
                message += '✅ Nessun utente è attualmente mutato';
            } else {
                activeMutes.forEach(([userId, data]) => {
                    const scadenza = new Date(data.scadenza);
                    const rimanente = Math.ceil((data.scadenza - now) / (1000 * 60));
                    message += `👤 @${userId.split('@')[0]}\n`;
                    message += `🔨 Mutato da: @${data.mutedBy.split('@')[0]}\n`;
                    message += `⏰ Scade: ${scadenza.toLocaleString('it-IT')}\n`;
                    message += `⏳ Rimanente: ${rimanente}m\n\n`;
                    mentions.push(userId, data.mutedBy);
                });
            }
            
            if (mentions.length > 0) {
                await client.sendMessage(msg.from, message, { mentions });
            } else {
                await msg.reply(message);
            }
            return;
        }
        
        // Rimuovi tutti i mute
        if (args[0] === 'clear') {
            salvaMuted({});
            await msg.reply('✅ Tutti i mute sono stati rimossi!');
            return;
        }
        
        // Unmute utente
        if (args[0] === 'unmute') {
            const mentions = await msg.getMentions();
            if (!mentions.length) {
                await msg.reply('❌ Devi menzionare un utente da smutare!\nEsempio: .mute unmute @utente');
                return;
            }
            
            const targetId = mentions[0].id._serialized;
            const targetName = mentions[0].pushname || mentions[0].verifiedName || 'Utente';
            
            if (muted[targetId]) {
                delete muted[targetId];
                salvaMuted(muted);
                
                const message = `✅ @${targetId.split('@')[0]} è stato smutato!`;
                await client.sendMessage(msg.from, message, { mentions: [targetId] });
            } else {
                await msg.reply('❌ Questo utente non è mutato!');
            }
            return;
        }
        
        // Muta utente
        const mentions = await msg.getMentions();
        if (!mentions.length) {
            await msg.reply('❌ Devi menzionare un utente da mutare!\nEsempio: .mute @utente 30m');
            return;
        }
        
        if (args.length < 2) {
            await msg.reply('❌ Specifica il tempo del mute!\nEsempio: .mute @utente 30m');
            return;
        }
        
        const targetId = mentions[0].id._serialized;
        const targetName = mentions[0].pushname || mentions[0].verifiedName || 'Utente';
        const timeStr = args[1];
        
        // Verifica che non stia mutando un admin
        if (isAdmin(targetId)) {
            await msg.reply('❌ Non puoi mutare un admin!');
            return;
        }
        
        // Parsing del tempo
        const timeMatch = timeStr.match(/^(\d+)([smhdw])$/);
        if (!timeMatch) {
            await msg.reply('❌ Formato tempo non valido!\nUsa: 30s, 5m, 2h, 1d, 1w');
            return;
        }
        
        const amount = parseInt(timeMatch[1]);
        const unit = timeMatch[2];
        
        let milliseconds;
        switch (unit) {
            case 's': milliseconds = amount * 1000; break;
            case 'm': milliseconds = amount * 60 * 1000; break;
            case 'h': milliseconds = amount * 60 * 60 * 1000; break;
            case 'd': milliseconds = amount * 24 * 60 * 60 * 1000; break;
            case 'w': milliseconds = amount * 7 * 24 * 60 * 60 * 1000; break;
            default: 
                await msg.reply('❌ Unità tempo non valida!');
                return;
        }
        
        const scadenza = Date.now() + milliseconds;
        
        muted[targetId] = {
            nome: targetName,
            scadenza: scadenza,
            mutedBy: sender,
            mutedAt: Date.now()
        };
        
        salvaMuted(muted);
        
        const scadenzaStr = new Date(scadenza).toLocaleString('it-IT');
        const message = `🔇 @${targetId.split('@')[0]} è stato mutato!\n\n⏰ Scadenza: ${scadenzaStr}\n⏳ Durata: ${timeStr}`;
        
        await client.sendMessage(msg.from, message, { mentions: [targetId] });
    }
};
