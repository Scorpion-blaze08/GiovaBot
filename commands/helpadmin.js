const { getSenderId, isAdmin } = require('../utils/identity');

module.exports = {
    name: 'helpadmin',
    description: 'Comandi admin del bot',
    async execute(msg) {
        // ID degli admin
        const sender = await getSenderId(msg);
        
        // Verifica se l'utente è admin
        if (!isAdmin(sender)) {
            await msg.reply('❌ Solo l\'admin può usare questo comando!');
            return;
        }
        
        let helpText = '🔧 COMANDI ADMIN GIOVABOT 🔧\n\n';
        
        helpText += '🔇 .mute - Sistema mute utenti\n';
        helpText += '   • .mute @utente [tempo] - Muta utente (solo comandi)\n';
        helpText += '   • .mute lista - Vedi utenti mutati\n';
        helpText += '   • .mute unmute @utente - Rimuovi mute\n';
        helpText += '   • .mute clear - Rimuovi tutti i mute\n\n';
        

        
        helpText += '🏓 .ping - Test connessione bot\n';
        helpText += '   • Verifica se il bot risponde\n\n';
        
        helpText += '🆔 .groupid - ID del gruppo\n';
        helpText += '   • Mostra l\'ID del gruppo corrente\n\n';
        
        helpText += '🧹 .pulisci - Elimina messaggi bot\n';
        helpText += '   • Elimina TUTTI i messaggi del bot nella chat\n';
        helpText += '   • Usa con cautela - azione irreversibile\n\n';
        
        helpText += '🏆 .torneo crea [nome] - Crea torneo\n';
        helpText += '   • Crea tornei fino a 21 partecipanti\n';
        helpText += '   • .torneo inizia - Avvia torneo\n\n';
        
        helpText += '📊 .classifica reset [gioco] - Reset classifiche\n';
        helpText += '   • Reset classifica specifica o totale\n\n';
        
        helpText += '🎮 COMANDI TROLL ADMIN:\n';
        helpText += '🎣 PESCA:\n';
        helpText += '• .pesca leggendaria - Pesca leggendario garantito\n';
        helpText += '• .pesca ruba @utente [pesce] - Ruba pesce da utente\n\n';
        
        helpText += '🎰 SLOT:\n';
        helpText += '• .slot jackpot - Jackpot garantito (+50 punti)\n';
        helpText += '• .slot ruba @utente [punti] - Ruba punti\n\n';
        
        helpText += '🎲 DADO:\n';
        helpText += '• .dado truccato [1-6] - Forza risultato dado\n';
        helpText += '• .dado ruba @utente [punti] - Ruba punti\n\n';
        
        helpText += '🃏 BLACKJACK:\n';
        helpText += '• .blackjack 21 - Blackjack garantito (+15 punti)\n';
        helpText += '• .blackjack ruba @utente [punti] - Ruba punti\n\n';
        
        helpText += '🏇 CAVALLI:\n';
        helpText += '• .cavalli trucca [1-4] - Forza vittoria cavallo\n';
        helpText += '• .cavalli ruba @utente [punti] - Ruba punti\n\n';
        
        helpText += '⚔️ COMBATTIMENTI:\n';
        helpText += '• .duello vinci @utente - Vinci automaticamente\n';
        helpText += '• .battaglia trucca [fazione] - Potenzia fazione\n\n';
        
        helpText += '⚡ Solo tu puoi usare questi comandi!';
        
        await msg.reply(helpText);
    }
};
