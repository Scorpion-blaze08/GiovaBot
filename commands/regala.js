const { getSaldo, trasferisci } = require('../utils/economia');
const { getSenderId, sameUser } = require('../utils/identity');

module.exports = {
    name: 'regala',
    description: 'Regala GiovaCoins a un altro utente',
    async execute(msg, client) {
        const sender = await getSenderId(msg);
        const args = msg.body.split(' ').slice(1);
        const nome = require('../utils/nomi').getNomeCache(sender) || sender.split('@')[0];
        const mentions = await msg.getMentions();

        if (!mentions.length || !args[1]) {
            await msg.reply('❌ Uso: .regala @utente [importo]\nEsempio: .regala @Mario 100');
            return;
        }

        const targetId = mentions[0].id._serialized;
        const targetNome = mentions[0].pushname || mentions[0].verifiedName || targetId.split('@')[0];
        const importo = parseInt(args[1]);

        if (isNaN(importo) || importo <= 0) {
            await msg.reply('❌ Importo non valido!');
            return;
        }

        if (sameUser(targetId, sender)) {
            await msg.reply('❌ Non puoi regalarti monete da solo!');
            return;
        }

        const saldo = getSaldo(sender);
        if (saldo < importo) {
            await msg.reply(`❌ Saldo insufficiente!\n\n💰 Hai solo ${saldo} GiovaCoins`);
            return;
        }

        trasferisci(sender, targetId, importo, nome, targetNome);

        const msg2 = `🎁 REGALO INVIATO!\n\n${nome} ha regalato 🪙 ${importo} GiovaCoins a @${targetId.split('@')[0]}!\n\n💰 Tuo saldo: ${saldo - importo} GiovaCoins`;
        await client.sendMessage(msg.from, msg2, { mentions: [targetId] });
    }
};
