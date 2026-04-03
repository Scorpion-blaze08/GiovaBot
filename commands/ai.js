const { askGemini, isAiConfigured, GEMINI_MODEL } = require('../utils/ai');

module.exports = {
    name: 'ai',
    description: 'Assistente AI per idee, testi, riassunti e aiuto rapido',
    async execute(msg) {
        const prompt = msg.body.trim().split(/\s+/).slice(1).join(' ').trim();

        if (!prompt) {
            await msg.reply([
                '🤖 MODULO AI',
                '',
                'Usi rapidi:',
                '• .ai dammi 3 idee per un evento del bot',
                '• .ai scrivi un annuncio per il gruppo',
                '• .ai inventa una missione giornaliera pesca',
                '• .ai spiegami bene il blackjack',
                '',
                `⚙️ Modello attuale: ${GEMINI_MODEL}`
            ].join('\n'));
            return;
        }

        if (!isAiConfigured()) {
            await msg.reply([
                '⚠️ Modulo AI non configurato.',
                '',
                'Per attivarlo imposta la variabile d\'ambiente:',
                'GEMINI_API_KEY=la_tua_chiave',
                '',
                '💡 Non la salvo nei file del progetto per sicurezza.'
            ].join('\n'));
            return;
        }

        const waiting = await msg.reply('🤖 Sto pensando...');

        try {
            const answer = await askGemini(prompt, {
                temperature: 0.85,
                maxOutputTokens: 420
            });

            if (waiting && typeof waiting.edit === 'function') {
                await waiting.edit(`🤖 RISPOSTA AI\n\n${answer}`);
            } else {
                await msg.reply(`🤖 RISPOSTA AI\n\n${answer}`);
            }
        } catch (error) {
            const errorText = [
                '❌ Non sono riuscito a usare il modulo AI.',
                '',
                `Dettaglio: ${error.message}`,
                '',
                '💡 Controlla la chiave Gemini, la connessione e il modello configurato.'
            ].join('\n');

            if (waiting && typeof waiting.edit === 'function') {
                await waiting.edit(errorText);
            } else {
                await msg.reply(errorText);
            }
        }
    }
};
