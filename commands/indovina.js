const { aggiornaClassifica } = require('./classifica');

const partiteAttive = new Map();

module.exports = {
    name: 'indovina',
    description: 'Indovina il numero tra 1 e 100',
    async execute(msg, client) {
        const sender = msg.author || msg.from;
        const chatId = msg.from;
        const args = msg.body.split(' ').slice(1);

        // Se c'è una partita attiva e l'utente manda un numero
        const partita = partiteAttive.get(chatId);
        if (partita && args[0] && !isNaN(args[0])) {
            const tentativo = parseInt(args[0]);
            partita.tentativi++;

            if (tentativo === partita.numero) {
                partiteAttive.delete(chatId);
                const punti = Math.max(10 - partita.tentativi + 1, 1);
                const nome = require('../utils/nomi').getNomeCache(sender) || sender.split('@')[0];
                aggiornaClassifica(sender, punti, true, 'scelta', nome);
                await msg.reply(`🎉 CORRETTO! Il numero era ${partita.numero}!\n\n🏆 +${punti} punti (${partita.tentativi} tentativi)\n\n📝 Meno tentativi = più punti!`);
            } else if (partita.tentativi >= 7) {
                partiteAttive.delete(chatId);
                await msg.reply(`❌ Hai esaurito i tentativi!\n\n🔢 Il numero era: ${partita.numero}\n\n📝 Usa .indovina per ricominciare`);
            } else {
                const hint = tentativo < partita.numero ? '📈 Troppo basso!' : '📉 Troppo alto!';
                await msg.reply(`${hint}\n\n🎯 Tentativi rimasti: ${7 - partita.tentativi}`);
            }
            return;
        }

        if (partita) {
            await msg.reply(`🔢 Partita in corso!\n\nNumero tra 1 e 100\n🎯 Tentativi rimasti: ${7 - partita.tentativi}\n\nRispondi con: .indovina [numero]`);
            return;
        }

        // Nuova partita
        const numero = Math.floor(Math.random() * 100) + 1;
        partiteAttive.set(chatId, { numero, tentativi: 0, scadenza: Date.now() + 120000 });

        await msg.reply('🔢 INDOVINA IL NUMERO!\n\nHo pensato un numero tra 1 e 100\n🎯 Hai 7 tentativi!\n\n💡 Più sei veloce, più punti guadagni!\n\nRispondi con: .indovina [numero]');

        // Timeout 2 minuti
        setTimeout(() => {
            if (partiteAttive.has(chatId)) {
                partiteAttive.delete(chatId);
                client.sendMessage(chatId, `⏰ Tempo scaduto! Il numero era: ${numero}`).catch(() => {});
            }
        }, 120000);
    }
};
