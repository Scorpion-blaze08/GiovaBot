const { getSaldo, aggiungiMonete } = require('../utils/economia');
const { getNomeCache } = require('../utils/nomi');
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'banca.json');
const TASSO_INTERESSE = 0.05;

function carica() {
    try {
        if (!fs.existsSync(FILE)) return {};
        return JSON.parse(fs.readFileSync(FILE, 'utf8'));
    } catch { return {}; }
}

function salva(data) {
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function calcolaInteressi(conto) {
    if (!conto || conto.deposito <= 0) return 0;
    const giorni = Math.floor((Date.now() - conto.ultimoAggiornamento) / (1000 * 60 * 60 * 24));
    return giorni > 0 ? Math.floor(conto.deposito * TASSO_INTERESSE * giorni) : 0;
}

async function getSenderId(msg) {
    try {
        const contact = await msg.getContact();
        return contact.id._serialized;
    } catch {
        return msg.author || msg.from;
    }
}

module.exports = {
    name: 'banca',
    description: 'Deposita GiovaCoins in banca per guadagnare interessi',
    async execute(msg) {
        const sender = await getSenderId(msg);
        const args = msg.body.split(' ').slice(1);
        const nome = getNomeCache(sender) || sender.split('@')[0];
        const banca = carica();

        if (!banca[sender]) banca[sender] = { deposito: 0, ultimoAggiornamento: Date.now() };
        const conto = banca[sender];

        const interessi = calcolaInteressi(conto);
        if (interessi > 0) {
            conto.deposito += interessi;
            conto.ultimoAggiornamento = Date.now();
            salva(banca);
        }

        if (!args[0] || args[0] === 'saldo') {
            let resp = `🏦 BANCA DI ${nome.toUpperCase()}\n\n`;
            resp += `💰 Saldo libero: ${getSaldo(sender)} 🪙\n`;
            resp += `🏦 Deposito: ${conto.deposito} 🪙\n`;
            resp += `📈 Interesse: ${TASSO_INTERESSE * 100}% al giorno\n`;
            if (interessi > 0) resp += `✅ Interessi applicati: +${interessi} 🪙\n`;
            resp += `\n💡 Comandi:\n• .banca deposita [importo]\n• .banca preleva [importo]\n• .banca preleva tutto`;
            await msg.reply(resp);
            return;
        }

        if (args[0] === 'deposita') {
            const importo = parseInt(args[1]);
            if (isNaN(importo) || importo <= 0) { await msg.reply('❌ Uso: .banca deposita [importo]'); return; }
            const saldo = getSaldo(sender);
            if (saldo < importo) { await msg.reply(`❌ Saldo insufficiente! Hai ${saldo} 🪙`); return; }
            aggiungiMonete(sender, -importo, nome);
            conto.deposito += importo;
            conto.ultimoAggiornamento = Date.now();
            salva(banca);
            await msg.reply(`✅ Depositati ${importo} 🪙 in banca!\n\n🏦 Deposito totale: ${conto.deposito} 🪙\n📈 Guadagnerai il ${TASSO_INTERESSE * 100}% al giorno!`);
            return;
        }

        if (args[0] === 'preleva') {
            if (conto.deposito <= 0) { await msg.reply('❌ Non hai nulla depositato in banca!'); return; }
            const importo = args[1] === 'tutto' ? conto.deposito : parseInt(args[1]);
            if (isNaN(importo) || importo <= 0) { await msg.reply('❌ Uso: .banca preleva [importo] oppure .banca preleva tutto'); return; }
            if (importo > conto.deposito) { await msg.reply(`❌ Hai solo ${conto.deposito} 🪙 in banca!`); return; }
            conto.deposito -= importo;
            conto.ultimoAggiornamento = Date.now();
            salva(banca);
            aggiungiMonete(sender, importo, nome);
            await msg.reply(`✅ Prelevati ${importo} 🪙 dalla banca!\n\n💰 Saldo libero: ${getSaldo(sender)} 🪙\n🏦 Deposito rimasto: ${conto.deposito} 🪙`);
            return;
        }

        await msg.reply('🏦 BANCA\n\n• .banca — vedi saldo\n• .banca deposita [importo]\n• .banca preleva [importo]\n• .banca preleva tutto\n\n📈 Interesse: 5% al giorno sul deposito!');
    }
};
