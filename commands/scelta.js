const { aggiornaClassifica } = require('./classifica');
const { aggiungiMonete } = require('../utils/economia');
const { getSenderId } = require('../utils/identity');
const { getNomeCache } = require('../utils/nomi');
const { processGameProgress } = require('../utils/progression');
const { section, bullets } = require('../utils/messageStyle');

module.exports = {
    name: 'scelta',
    description: 'Scelta casuale tra opzioni con mini reward',
    async execute(msg) {
        const args = msg.body.trim().split(/\s+/).slice(1);
        const sender = await getSenderId(msg);
        const userName = getNomeCache(sender) || sender.split('@')[0];

        if (args.length < 2) {
            await msg.reply(section('🎯 SCELTA CASUALE', [
                'Uso: .scelta [opzione1] [opzione2] [opzione3] ...',
                '',
                ...bullets([
                    '.scelta pizza hamburger sushi',
                    '.scelta studiare ripassare esercitarsi',
                    '.scelta matematica inglese storia'
                ]),
                '',
                '💡 Più opzioni inserisci, più sale il mini bonus.'
            ]));
            return;
        }

        const chosen = args[Math.floor(Math.random() * args.length)];
        const creditDelta = Math.max(2, Math.floor(args.length * 1.5));

        aggiornaClassifica(sender, creditDelta, true, 'scelta', userName);
        aggiungiMonete(sender, creditDelta, userName);

        await processGameProgress({
            userId: sender,
            game: 'scelta',
            displayName: userName,
            msg,
            events: {
                plays: 1,
                wins: 1,
                profit: creditDelta
            }
        });

        await msg.reply(section('🎯 SCELTA EFFETTUATA', [
            `📋 Opzioni: ${args.join(', ')}`,
            `🎉 Risposta del bot: ${chosen}`,
            `💰 Mini bonus: +${creditDelta} crediti`,
            '',
            '📈 Usa .classifica scelta per vedere chi usa di più questo comando.'
        ]));
    }
};
