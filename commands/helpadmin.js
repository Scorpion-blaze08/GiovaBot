const { getSenderId, isAdmin } = require('../utils/identity');

module.exports = {
    name: 'helpadmin',
    description: 'Comandi admin del bot',
    async execute(msg) {
        const sender = await getSenderId(msg);

        if (!isAdmin(sender)) {
            await msg.reply('Solo l\'admin puo usare questo comando.');
            return;
        }

        const helpText =
            'COMANDI ADMIN\n\n' +
            '.admin help\n' +
            '.admin coins add/remove/set @utente importo\n' +
            '.admin saldo @utente\n' +
            '.admin reset progress\n' +
            '.admin reset classifica [gioco|all]\n' +
            '.admin reset daily\n' +
            '.admin reset streak\n' +
            '.admin status\n' +
            '.admin maintenance on|off\n' +
            '.admin lock [comando]\n' +
            '.admin unlock [comando]\n' +
            '.admin backup [all|economia|pesca|progressione|roulette]\n' +
            '.admin missioni\n' +
            '.admin achievement give @utente [id]\n' +
            '.admin fish give @utente id_o_nome quantita\n' +
            '.admin fish clear @utente\n' +
            '.admin announce pesca [qui|gruppo1|gruppo2|all]\n' +
            '.admin say gruppo1 testo\n' +
            '.admin say gruppo2 testo\n\n' +
            'ALTRI COMANDI ADMIN\n' +
            '.mute ...\n' +
            '.pulisci\n' +
            '.avviabot\n' +
            '.spegnibot\n' +
            '.groupid';

        await msg.reply(helpText);
    }
};
