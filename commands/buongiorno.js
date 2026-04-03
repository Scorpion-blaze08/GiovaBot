const { MessageMedia } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'buongiorno',
    description: 'Invia una foto di buongiorno casuale',
    async execute(msg, client) {
        try {
            const fotoDir = path.join(__dirname, '..', 'media', 'foto');
            
            // Controlla se la cartella esiste
            if (!fs.existsSync(fotoDir)) {
                await msg.reply('❌ Cartella foto non trovata!');
                return;
            }
            
            // Leggi tutti i file nella cartella
            const files = fs.readdirSync(fotoDir).filter(file => {
                const ext = path.extname(file).toLowerCase();
                return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
            });
            
            if (files.length === 0) {
                await msg.reply('📷 Nessuna foto disponibile!\n\nCarica delle foto nella cartella media/foto/');
                return;
            }
            
            // Scegli una foto casuale
            const randomFile = files[Math.floor(Math.random() * files.length)];
            const imagePath = path.join(fotoDir, randomFile);
            
            // Determina il tipo MIME
            const ext = path.extname(randomFile).toLowerCase();
            let mimeType = 'image/jpeg';
            if (ext === '.png') mimeType = 'image/png';
            else if (ext === '.gif') mimeType = 'image/gif';
            else if (ext === '.webp') mimeType = 'image/webp';
            
            // Crea il media
            const media = new MessageMedia(mimeType, fs.readFileSync(imagePath, 'base64'));
            
            // Invia l'immagine con caption
            await client.sendMessage(msg.from, media, {
                caption: `🌅 Buongiorno! 🌅\n\n☀️ ${randomFile}\n📁 ${files.length} foto disponibili`
            });
            
        } catch (error) {
            console.error('Errore invio foto:', error);
            await msg.reply('❌ Errore nell\'invio della foto!');
        }
    }
};
