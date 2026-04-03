const { askGemini, isAiConfigured } = require('../utils/ai');

module.exports = {
    name: 'ripasso',
    description: 'Crea una mini scheda di studio su un argomento',
    async execute(msg) {
        const topic = msg.body.trim().split(/\s+/).slice(1).join(' ').trim();

        if (!topic) {
            await msg.reply([
                '📚 RIPASSO RAPIDO',
                '',
                'Uso: .ripasso [materia o argomento]',
                '',
                'Esempi:',
                '• .ripasso equazioni di secondo grado',
                '• .ripasso rivoluzione francese',
                '• .ripasso photosynthesis',
                '',
                '💡 Se l’AI è attiva, preparo una scheda breve con concetti chiave e domande di verifica.'
            ].join('\n'));
            return;
        }

        if (!isAiConfigured()) {
            await msg.reply([
                '⚠️ Modulo AI non configurato.',
                '',
                'Per usare .ripasso serve GEMINI_API_KEY attiva.',
                '',
                `Argomento richiesto: ${topic}`
            ].join('\n'));
            return;
        }

        const waiting = await msg.reply('📚 Sto preparando una mini scheda di ripasso...');

        try {
            const answer = await askGemini(
                `Crea una scheda di ripasso molto chiara sull'argomento: ${topic}.
Struttura obbligatoria:
1. spiegazione breve
2. 5 concetti chiave
3. 3 domande di autoverifica
4. 1 consiglio pratico per studiarlo meglio`,
                {
                    temperature: 0.6,
                    maxOutputTokens: 420,
                    systemPrompt: 'Sei un tutor scolastico chiaro, sintetico e affidabile. Scrivi in italiano in modo adatto a studenti delle superiori.'
                }
            );

            if (waiting && typeof waiting.edit === 'function') {
                await waiting.edit(`📚 RIPASSO: ${topic}\n\n${answer}`);
            } else {
                await msg.reply(`📚 RIPASSO: ${topic}\n\n${answer}`);
            }
        } catch (error) {
            const text = `❌ Non sono riuscito a generare il ripasso.\n\nDettaglio: ${error.message}`;
            if (waiting && typeof waiting.edit === 'function') {
                await waiting.edit(text);
            } else {
                await msg.reply(text);
            }
        }
    }
};
