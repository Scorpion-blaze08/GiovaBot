const { getSaldo, getClassificaRicchezza } = require('../utils/economia');
const { getNomeCache } = require('../utils/nomi');

async function getSenderId(msg) {
    try {
        const contact = await msg.getContact();
        return contact.id._serialized;
    } catch {
        return msg.author || msg.from;
    }
}

module.exports = {
    name: 'saldo',
    description: 'Vedi le tue GiovaCoins',
    async execute(msg) {
        const sender = await getSenderId(msg);
        const args = msg.body.split(' ').slice(1);
        const nome = getNomeCache(sender) || sender.split('@')[0];

        if (args[0] === 'top' || args[0] === 'classifica') {
            const top = getClassificaRicchezza(10);
            if (top.length === 0) {
                await msg.reply('🪙 Nessuno ha ancora GiovaCoins!');
                return;
            }
            const medals = ['🥇', '🥈', '🥉'];
            let resp = '🏦 CLASSIFICA RICCHEZZA 🏦\n\n';
            top.forEach((p, i) => {
                resp += `${medals[i] || `${i + 1}.`} ${p.nome}: 🪙 ${p.saldo}\n`;
            });
            resp += '\n💡 Usa .daily per guadagnare ogni giorno!';
            await msg.reply(resp);
            return;
        }

        const saldo = getSaldo(sender);
        await msg.reply(`🪙 SALDO DI ${nome.toUpperCase()}\n\n💰 ${saldo} GiovaCoins\n\n💡 Comandi:\n• .daily — bonus giornaliero\n• .regala @utente [importo]\n• .saldo top — classifica ricchezza\n• .scommessa @utente [importo]`);
    }
};
