const axios = require('axios');

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

function getGeminiApiKey() {
    return process.env.GEMINI_API_KEY || '';
}

function isAiConfigured() {
    return Boolean(getGeminiApiKey());
}

async function askGemini(prompt, options = {}) {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY non configurata');
    }

    const systemPrompt = options.systemPrompt || [
        'Sei GiovaBot AI, un assistente utile, rapido e creativo dentro un bot WhatsApp.',
        'Rispondi in italiano in modo chiaro, pratico e piacevole da leggere.',
        'Quando possibile usa struttura breve, emoji leggere e tono amichevole.'
    ].join(' ');

    const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        {
            contents: [
                {
                    role: 'user',
                    parts: [
                        {
                            text: `${systemPrompt}\n\nRichiesta utente:\n${prompt}`
                        }
                    ]
                }
            ],
            generationConfig: {
                temperature: options.temperature ?? 0.8,
                maxOutputTokens: options.maxOutputTokens ?? 350
            }
        },
        {
            timeout: options.timeoutMs ?? 20000
        }
    );

    const text = response.data?.candidates?.[0]?.content?.parts
        ?.map(part => part.text || '')
        .join('')
        .trim();

    if (!text) {
        throw new Error('Risposta vuota da Gemini');
    }

    return text;
}

module.exports = {
    GEMINI_MODEL,
    isAiConfigured,
    askGemini
};
