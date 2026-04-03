const QRCode = require('qrcode');
const { MessageMedia } = require('whatsapp-web.js');

module.exports = {
    name: 'qr',
    description: 'Genera un QR code',
    async execute(msg) {
        const args = msg.body.split(' ').slice(1);
        
        if (args.length === 0) {
            await msg.reply('📱 QR CODE GENERATOR\n\n📝 Uso:\n• .qr [testo] - Genera QR code\n\nEsempi:\n• .qr https://google.com\n• .qr Il mio numero: 123456789\n• .qr Ciao mondo!');
            return;
        }
        
        const testo = args.join(' ');
        
        try {
            // Genera QR code come buffer
            const qrBuffer = await QRCode.toBuffer(testo, {
                width: 300,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
            
            // Converti in MessageMedia
            const media = new MessageMedia('image/png', qrBuffer.toString('base64'), 'qrcode.png');
            
            await msg.reply(media, undefined, {
                caption: `📱 QR CODE GENERATO!\n\n🔍 Scansiona per vedere il contenuto!`
            });
            
        } catch (error) {
            console.error('Errore generazione QR:', error);
            await msg.reply('❌ Errore nella generazione del QR code!');
        }
    }
};
