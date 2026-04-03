const { MessageMedia } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'musica',
    description: 'Invia una canzone casuale',
    async execute(msg, client) {
        try {
            const musicaDir = 'C:\\Users\\ASUS\\Music';
            
            // Controlla se la cartella esiste
            if (!fs.existsSync(musicaDir)) {
                await msg.reply('❌ Cartella musica non trovata!');
                return;
            }
            
            // Leggi tutti i file audio nella cartella
            const files = fs.readdirSync(musicaDir).filter(file => {
                const ext = path.extname(file).toLowerCase();
                return ['.mp3', '.m4a', '.ogg', '.wav'].includes(ext);
            });
            
            if (files.length === 0) {
                await msg.reply('🎵 Nessuna canzone disponibile!\n\nCarica dei file audio nella cartella media/musica/');
                return;
            }
            
            // Scegli una canzone casuale
            const randomFile = files[Math.floor(Math.random() * files.length)];
            const audioPath = path.join(musicaDir, randomFile);
            
            // Controlla dimensione file (max 16MB per WhatsApp)
            const stats = fs.statSync(audioPath);
            const fileSizeInMB = stats.size / (1024 * 1024);
            
            if (fileSizeInMB > 16) {
                await msg.reply(`❌ File troppo grande: ${randomFile}\n📏 Dimensione: ${fileSizeInMB.toFixed(1)}MB\n⚠️ Limite WhatsApp: 16MB`);
                return;
            }
            
            // Determina il tipo MIME
            const ext = path.extname(randomFile).toLowerCase();
            let mimeType = 'audio/mpeg';
            if (ext === '.m4a') mimeType = 'audio/mp4';
            else if (ext === '.ogg') mimeType = 'audio/ogg';
            else if (ext === '.wav') mimeType = 'audio/wav';
            
            await msg.reply('🎵 Invio canzone casuale...');
            
            // Crea il media
            const media = new MessageMedia(mimeType, fs.readFileSync(audioPath, 'base64'), randomFile);
            
            // Invia come messaggio audio
            await client.sendMessage(msg.from, media, {
                sendAudioAsVoice: false // Invia come file audio, non messaggio vocale
            });
            
            // Messaggio di conferma
            const fileName = path.parse(randomFile).name;
            await msg.reply(`🎶 ${fileName}\n\n🎲 Canzone casuale inviata!\n📁 ${files.length} canzoni disponibili`);
            
        } catch (error) {
            console.error('Errore invio musica:', error);
            await msg.reply('❌ Errore nell\'invio della canzone!');
        }
    }
};
