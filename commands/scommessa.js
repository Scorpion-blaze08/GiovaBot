const { getSaldo, trasferisci, aggiungiMonete } = require('../utils/economia');
const { getNomeCache } = require('../utils/nomi');

const sfideAttive = new Map();

async function getSenderId(msg) {
    try {
        const contact = await msg.getContact();
        return contact.id._serialized;
    } catch {
        return msg.author || msg.from;
    }
}

module.exports = {
    name: 'scommessa',
    description: 'Sfida un utente con posta in GiovaCoins',
    async execute(msg, client) {
        const chatId = msg.from;
        const args = msg.body.split(' ').slice(1);

        const sender = await getSenderId(msg);
        const nomeSender = getNomeCache(sender) || sender.split('@')[0];

        // Accetta sfida
        if (args[0] === 'accetta') {
            const sfida = sfideAttive.get(chatId);
            if (!sfida || sfida.sfidato !== sender) {
                await msg.reply('❌ Nessuna sfida per te!');
                return;
            }

            clearTimeout(sfida.timeout);

            if (getSaldo(sender) < sfida.importo) {
                sfideAttive.delete(chatId);
                await msg.reply(`❌ Non hai abbastanza GiovaCoins per accettare!\n\n💰 Hai: ${getSaldo(sender)} 🪙\n💸 Servono: ${sfida.importo} 🪙\n\n💡 Fai .daily per guadagnare monete gratis!`);
                return;
            }

            sfideAttive.delete(chatId);

            const dadoSfidante = Math.floor(Math.random() * 100) + 1;
            const dadoSfidato = Math.floor(Math.random() * 100) + 1;

            let vincitore, perdente, nomeVincitore, nomePerdente;
            if (dadoSfidante >= dadoSfidato) {
                vincitore = sfida.sfidante; perdente = sender;
                nomeVincitore = sfida.nomeSfidante; nomePerdente = nomeSender;
            } else {
                vincitore = sender; perdente = sfida.sfidante;
                nomeVincitore = nomeSender; nomePerdente = sfida.nomeSfidante;
            }

            if (dadoSfidante === dadoSfidato) {
                let resp = `🎲 SCOMMESSA!\n\n🎯 ${sfida.nomeSfidante}: ${dadoSfidante}\n🎯 ${nomeSender}: ${dadoSfidato}\n\n🤝 PAREGGIO! Nessuno perde nulla!`;
                await client.sendMessage(chatId, resp, { mentions: [sfida.sfidante, sender] });
            } else {
                console.log('SCOMMESSA FINE - vincitore:', vincitore, '| perdente:', perdente);
                trasferisci(perdente, vincitore, sfida.importo, nomePerdente, nomeVincitore);
                console.log('SCOMMESSA SALDI - vincitore:', require('../utils/economia').getSaldo(vincitore), '| perdente:', require('../utils/economia').getSaldo(perdente));
                let resp = `🎲 SCOMMESSA!\n\n🎯 ${sfida.nomeSfidante}: ${dadoSfidante}\n🎯 ${nomeSender}: ${dadoSfidato}\n\n🏆 @${vincitore.split('@')[0]} (${nomeVincitore}) vince 🪙 ${sfida.importo} GiovaCoins!\n💰 Saldo: ${require('../utils/economia').getSaldo(vincitore)} GiovaCoins`;
                await client.sendMessage(chatId, resp, { mentions: [vincitore, perdente] });
            }
            return;
        }

        // Rifiuta sfida
        if (args[0] === 'rifiuta') {
            const sfida = sfideAttive.get(chatId);
            if (!sfida || sfida.sfidato !== sender) {
                await msg.reply('❌ Nessuna sfida per te!');
                return;
            }
            clearTimeout(sfida.timeout);
            sfideAttive.delete(chatId);
            await msg.reply('❌ Sfida rifiutata!');
            return;
        }

        // Nuova sfida
        const mentions = await msg.getMentions();
        if (!mentions.length || !args[1]) {
            await msg.reply('❌ Uso: .scommessa @utente [importo]\nEsempio: .scommessa @Mario 200\n\nIl vincitore viene deciso da un dado 1-100!');
            return;
        }

        const targetId = mentions[0].id._serialized;
        const targetNome = getNomeCache(targetId) || mentions[0].pushname || targetId.split('@')[0];
        const importo = parseInt(args[1]);

        if (isNaN(importo) || importo <= 0) {
            await msg.reply('❌ Importo non valido!');
            return;
        }
        if (targetId === sender) {
            await msg.reply('❌ Non puoi sfidare te stesso!');
            return;
        }
        if (sfideAttive.has(chatId)) {
            await msg.reply('❌ C\'è già una sfida in corso!');
            return;
        }

        const saldo = getSaldo(sender);
        if (saldo < importo) {
            await msg.reply(`❌ Saldo insufficiente!\n\n💰 Hai solo ${saldo} GiovaCoins`);
            return;
        }

        const timeout = setTimeout(() => {
            sfideAttive.delete(chatId);
            client.sendMessage(chatId, `⏰ Sfida scaduta! @${targetId.split('@')[0]} non ha risposto.`, { mentions: [targetId] }).catch(() => {});
        }, 60000);

        sfideAttive.set(chatId, { sfidante: sender, sfidato: targetId, nomeSfidante: nomeSender, nomeSfidato: targetNome, importo, timeout });

        await client.sendMessage(chatId,
            `🎲 SFIDA LANCIATA!\n\n${nomeSender} sfida @${targetId.split('@')[0]} per 🪙 ${importo} GiovaCoins!\n\n🎯 Il vincitore viene deciso da un dado 1-100\n\n@${targetId.split('@')[0]} rispondi con:\n.scommessa accetta\n.scommessa rifiuta\n\n⏰ Hai 60 secondi!`,
            { mentions: [targetId] }
        );
    }
};
