module.exports = {
    name: 'combattimenti',
    description: 'Guida completa ai sistemi di combattimento',
    async execute(msg) {
        const guideText = `⚔️ GUIDA COMBATTIMENTI ⚔️

🤺 DUELLI (1v1)
• .duello sfida @utente - Sfida qualcuno
• .duello accetta/rifiuta - Rispondi alla sfida
• .duello attacca - Attacco base (15-40 danni)
• .duello difendi - Recupera HP (10-25)
• .duello abilita - Attacco speciale (25-60 danni)
• .duello stato - Vedi HP e abilità
• .duello abbandona - Abbandona duello

💚 HP: 100 | 🔥 Abilità: 3 per duello
🏆 Premi: 15 punti vittoria, 5 partecipazione

🏆 TORNEI (Multiplayer)
• .torneo partecipa - Iscriviti (4-21 giocatori)
• .torneo combatti - Combatti nel turno
• .torneo stato - Vedi bracket e HP
• .torneo abbandona - Esci dal torneo

⚡ Sistema eliminazione diretta
🎯 Danni: 20-50 per attacco
🏆 Premi: 50 punti vittoria, 10 per scontro

🏰 BATTAGLIE (Fazioni)
• .battaglia crea [nome] - Crea fazione
• .battaglia unisciti [nome] - Unisciti
• .battaglia sfida [fazione] - Dichiara guerra
• .battaglia attacca - Attacca in guerra
• .battaglia stato - Stato fazione/guerra

👥 Membri: Max 10 per fazione
💚 HP Guerra: 500 per fazione
🎯 Danni: 30-70 per attacco
🏆 Premi: 25 punti vittoria guerra

💡 TIPS:
• Usa abilità speciali nei momenti giusti
• Difenditi quando hai pochi HP
• Coordina gli attacchi nelle guerre
• Partecipa ai tornei per punti extra!`;

        return msg.reply(guideText);
    }
};
