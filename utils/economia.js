const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'economia.json');

function carica() {
    try {
        if (!fs.existsSync(FILE)) return {};
        return JSON.parse(fs.readFileSync(FILE, 'utf8'));
    } catch { return {}; }
}

function salva(data) {
    const dir = path.dirname(FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

// Trova la chiave reale nell'economia per un userId
// Gestisce il caso @lid vs @c.us cercando per numero
function trovaChiave(eco, userId) {
    if (eco[userId]) return userId;
    const numero = userId.split('@')[0];
    const trovato = Object.keys(eco).find(k => k.split('@')[0] === numero);
    return trovato || userId;
}

function getSaldo(userId) {
    const eco = carica();
    const chiave = trovaChiave(eco, userId);
    return eco[chiave]?.saldo ?? 0;
}

function aggiungiMonete(userId, importo, nome = null) {
    const eco = carica();
    const chiave = trovaChiave(eco, userId);
    if (!eco[chiave]) eco[chiave] = { saldo: 0, nome: nome || userId, totaleGuadagnato: 0, totalePeso: 0 };
    if (nome) eco[chiave].nome = nome;
    eco[chiave].saldo = Math.max(0, (eco[chiave].saldo || 0) + importo);
    if (importo > 0) eco[chiave].totaleGuadagnato = (eco[chiave].totaleGuadagnato || 0) + importo;
    else eco[chiave].totalePeso = (eco[chiave].totalePeso || 0) + Math.abs(importo);
    salva(eco);
    return eco[chiave].saldo;
}

function trasferisci(fromId, toId, importo, nomeFrom = null, nomeTo = null) {
    const eco = carica();
    const chiaveFrom = trovaChiave(eco, fromId);
    const chiaveTo = trovaChiave(eco, toId);

    if (!eco[chiaveFrom]) eco[chiaveFrom] = { saldo: 0, nome: nomeFrom || fromId, totaleGuadagnato: 0, totalePeso: 0 };
    if (!eco[chiaveTo]) eco[chiaveTo] = { saldo: 0, nome: nomeTo || toId, totaleGuadagnato: 0, totalePeso: 0 };
    if (nomeFrom) eco[chiaveFrom].nome = nomeFrom;
    if (nomeTo) eco[chiaveTo].nome = nomeTo;

    if (eco[chiaveFrom].saldo < importo) return false;

    eco[chiaveFrom].saldo -= importo;
    eco[chiaveFrom].totalePeso = (eco[chiaveFrom].totalePeso || 0) + importo;
    eco[chiaveTo].saldo += importo;
    eco[chiaveTo].totaleGuadagnato = (eco[chiaveTo].totaleGuadagnato || 0) + importo;
    salva(eco);
    return true;
}

function getClassificaRicchezza(limit = 10) {
    const eco = carica();
    // Deduplicazione: se stesso numero con @lid e @c.us, tieni solo quello con saldo maggiore
    const visti = new Map();
    for (const [id, d] of Object.entries(eco)) {
        const numero = id.split('@')[0];
        if (!visti.has(numero) || d.saldo > visti.get(numero).saldo) {
            visti.set(numero, { id, ...d });
        }
    }
    return [...visti.values()]
        .sort((a, b) => b.saldo - a.saldo)
        .slice(0, limit)
        .map(d => ({ id: d.id, nome: d.nome || d.id.split('@')[0], saldo: d.saldo || 0 }));
}

module.exports = { getSaldo, aggiungiMonete, trasferisci, getClassificaRicchezza };
