module.exports = {
    name: 'giochi',
    description: 'Mostra tutti i minigiochi disponibili',
    async execute(msg) {
        const gamesText = `🎮 MINIGIOCHI DISPONIBILI

🏇 .cavalli - Corsa dei cavalli con scommesse
🎲 .dado - Lancia un dado
🎯 .scelta - Scelta casuale tra opzioni
🎰 .slot - Slot machine
🔫 .russa - Roulette russa (sicura!)
🃏 .blackjack - Blackjack contro il banco
🎣 .pesca - Sistema pesca con inventario

⚔️ COMBATTIMENTI

🤺 .duello - Sfide 1v1
🏆 .torneo - Tornei fino a 21 giocatori
🏰 .battaglia - Guerre tra fazioni
📖 .combattimenti - Guida completa combattimenti

🏆 .classifica - Classifica punti giochi
🏅 .achievements - Tutti gli achievement
🔥 .streaks - Le tue strisce di vittorie

🎉 Scrivi un comando per giocare!
💡 Vinci punti e scala la classifica! 😄`;

        return msg.reply(gamesText);
    }
};
