const { getSaldo, getClassificaRicchezza } = require('../utils/economia');
const { getNomeCache } = require('../utils/nomi');
const { getSenderId } = require('../utils/identity');

module.exports = {
    name: 'saldo',
    description: 'Vedi saldo e classifica ricchezza',
    async execute(msg) {
        const sender = await getSenderId(msg);
        const args = msg.body.trim().split(/\s+/).slice(1);
        const nome = getNomeCache(sender) || sender.split('@')[0];

        if (args[0] === 'top' || args[0] === 'classifica') {
            const top = getClassificaRicchezza(10);
            if (!top.length) {
                await msg.reply('🏦 Nessuna classifica ricchezza disponibile per ora.');
                return;
            }

            const medals = ['🥇', '🥈', '🥉'];
            const lines = ['🏦 CLASSIFICA RICCHEZZA 🏦', ''];
            top.forEach((player, index) => {
                lines.push(`${medals[index] || `${index + 1}.`} ${player.nome} — 🪙 ${player.saldo}`);
            });
            lines.push('');
            lines.push('💡 Usa .daily ogni giorno e .banca per far crescere il saldo.');
            await msg.reply(lines.join('\n'));
            return;
        }

        const saldo = getSaldo(sender);
        await msg.reply([
            `🪙 SALDO DI ${nome.toUpperCase()} 🪙`,
            '',
            `💰 Crediti disponibili: ${saldo}`,
            '',
            'Comandi utili:',
            '• .daily',
            '• .saldo top',
            '• .regala @utente importo',
            '• .banca',
            '• .missioni'
        ].join('\n'));
    }
};
