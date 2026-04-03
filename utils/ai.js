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

function extractJsonBlock(text) {
    if (!text) return null;

    const fencedMatch = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/```\s*([\s\S]*?)```/i);
    if (fencedMatch) return fencedMatch[1].trim();

    const objectMatch = text.match(/\{[\s\S]*\}/);
    if (objectMatch) return objectMatch[0].trim();

    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) return arrayMatch[0].trim();

    return null;
}

async function askGeminiJson(prompt, options = {}) {
    const text = await askGemini(prompt, {
        temperature: options.temperature ?? 0.55,
        maxOutputTokens: options.maxOutputTokens ?? 500,
        systemPrompt: options.systemPrompt || [
            'Sei GiovaBot AI.',
            'Quando ti viene richiesto JSON, rispondi solo con JSON valido.',
            'Niente markdown, niente spiegazioni fuori dal JSON.'
        ].join(' ')
    });

    const jsonText = extractJsonBlock(text) || text;
    return JSON.parse(jsonText);
}

async function generateGameNarration({ game, event, tone = 'energico', context = '' }) {
    if (!isAiConfigured()) return null;

    const prompt = [
        `Crea una mini narrazione per un gioco WhatsApp.`,
        `Gioco: ${game}`,
        `Evento: ${event}`,
        `Tono: ${tone}`,
        context ? `Contesto: ${context}` : '',
        'Vincoli:',
        '- italiano',
        '- massimo 3 righe',
        '- stile leggibile in chat',
        '- 1 o 2 emoji al massimo',
        '- niente introduzioni metatestuali'
    ].filter(Boolean).join('\n');

    return askGemini(prompt, {
        temperature: 0.9,
        maxOutputTokens: 140
    });
}

module.exports = {
    GEMINI_MODEL,
    isAiConfigured,
    askGemini,
    askGeminiJson,
    generateGameNarration
};
