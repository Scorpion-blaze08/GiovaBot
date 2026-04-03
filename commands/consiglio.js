module.exports = {
    name: 'consiglio',
    description: 'Invia suggerimenti per migliorare il bot',
    async execute(msg, client) {
        const args = msg.body.split(' ').slice(1);
        
        if (args.length === 0) {
            msg.reply('💡 SUGGERIMENTI PER IL BOT\n\nUsa: .consiglio [il tuo suggerimento]\n\nEsempi:\n• .consiglio aggiungere comando dado\n• .consiglio funzione per le verifiche\n• .consiglio comando per scegliere a caso\n\n📱 Il tuo suggerimento arriverà direttamente all\'admin!');
            return;
        }
        
        const suggerimento = args.join(' ');
        const userName = msg._data.notifyName || msg.author || 'Utente Anonimo';
        const timestamp = new Date().toLocaleString('it-IT');
        
        // ID del numero admin
        const ADMIN_ID = '393276613342@c.us';
        
        // Messaggio per l'admin
        const adminMessage = `💡 NUOVO SUGGERIMENTO\n\n👤 Da: ${userName}\n📅 Quando: ${timestamp}\n💭 Suggerimento: ${suggerimento}\n\n🤖 Ricevuto tramite GiovaBot`;
        
        try {
            // Invia il suggerimento all'admin
            await client.sendMessage(ADMIN_ID, adminMessage);
            
            // Conferma all'utente
            msg.reply('✅ Suggerimento inviato!\n\n💡 Il tuo consiglio è stato inviato all\'admin del bot.\n\n🙏 Grazie per aiutarci a migliorare GiovaBot!');
            
            console.log(`Suggerimento ricevuto da ${userName}: ${suggerimento}`);
            
        } catch (error) {
            console.error('Errore invio suggerimento:', error);
            msg.reply('❌ Errore nell\'invio del suggerimento. Riprova più tardi.');
        }
    }
};
