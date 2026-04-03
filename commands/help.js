const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'help',
    description: 'Mostra tutti i comandi disponibili',
    async execute(msg) {
        const commandsPath = path.join(__dirname);
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        
        // Emoji per ogni comando
        const commandEmojis = {
            'saldo': '🪙',
            'daily': '📅',
            'regala': '🎁',
            'scommessa': '🎲',
            'banca': '🏦',
            'ciao': '👋',
            'compiti': '📚',
            'consiglio': '💡',
            'buongiorno': '🌅',
            'meme': '🎭',
            'musica': '🎵',
            'giochi': '🎮',
            'help': '❓',
            'meteo': '🌤️',
            'orario': '📅',
            'sondaggio': '📊',
            'time': '⏰',
            'tutti': '📢',
            'compleanni': '🎂',
            'citazioni': '💬',
            'link': '🔗',
            'verifiche': '📅',
            'confessione': '🤫',
            'achievements': '🏆',
            'streaks': '🔥',
            'qr': '📱',
            'mute': '🔇'
        };
        
        let helpText = '🤖 GIOVABOT - COMANDI DISPONIBILI\n\n';
        
        for (const file of commandFiles) {
            const command = require(path.join(commandsPath, file));
            
            // Escludi comandi admin-only e tutti i giochi individuali
        const giochiEsclusi = ['cavalli', 'dado', 'scelta', 'slot', 'roulette', 'classifica', 'pesca', 'helpadmin', 'torneo', 'pulisci', 'duello', 'battaglia', 'combattimenti', 'blackjack'];
            if (['groupid', 'ping', 'mute', 'avviabot', 'spegnibot'].includes(command.name) || giochiEsclusi.includes(command.name)) {
                continue;
            }
            
            const emoji = commandEmojis[command.name] || '🔹';
            helpText += `${emoji} .${command.name} - ${command.description}\n`;
        }
        
        helpText += '\n✨ Scrivi un comando per usarlo!';
        
        msg.reply(helpText);
    }
};
