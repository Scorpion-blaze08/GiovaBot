const fs = require('fs');
const path = require('path');

const CACHE_FILE = path.join(__dirname, '..', 'data', 'nomi_giocatori.json');

function caricaCache() {
    try {
        if (!fs.existsSync(CACHE_FILE)) return {};
        return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    } catch { return {}; }
}

function salvaCache(data) {
    try {
        const dir = path.dirname(CACHE_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
    } catch {}
}

// Salva il nome di un utente nella cache
function salvaNome(userId, nome) {
    if (!nome || nome === userId) return;
    const cache = caricaCache();
    if (cache[userId] !== nome) {
        cache[userId] = nome;
        salvaCache(cache);
    }
}

// Ottieni nome dalla cache
function getNomeCache(userId) {
    const cache = caricaCache();
    return cache[userId] || null;
}

// Funzione principale: ottieni nome da un messaggio
// Usa getContact() di whatsapp-web.js che legge direttamente la rubrica/profilo WhatsApp
async function getNome(msg, userId = null) {
    const targetId = userId || msg.author || msg.from;

    // Prima controlla la cache
    const cached = getNomeCache(targetId);
    if (cached) return cached;

    try {
        // Usa getContact() — il metodo ufficiale che legge il nome dal profilo WhatsApp
        const contact = await msg.getContact();
        const nome = contact.pushname || contact.verifiedName || contact.name || targetId.split('@')[0];
        salvaNome(targetId, nome);
        return nome;
    } catch {
        // Fallback su _data se getContact fallisce
        const fallback = msg._data?.notifyName || msg.contact?.pushname || targetId.split('@')[0];
        if (fallback && fallback !== targetId) salvaNome(targetId, fallback);
        return fallback;
    }
}

// Aggiorna la cache da un messaggio in arrivo (chiamato in GiovaBot.js ad ogni messaggio)
async function aggiornaNomeDaMsg(msg) {
    const userId = msg.author || msg.from;
    try {
        const contact = await msg.getContact();
        const nome = contact.pushname || contact.verifiedName || contact.name;
        if (nome) salvaNome(userId, nome);
    } catch {
        const fallback = msg._data?.notifyName || msg.contact?.pushname;
        if (fallback) salvaNome(userId, fallback);
    }
}

module.exports = { getNome, getNomeCache, salvaNome, aggiornaNomeDaMsg };
