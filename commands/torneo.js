const path = require('path');
const { getSenderId, isAdmin } = require('../utils/identity');
const { getNomeCache } = require('../utils/nomi');
const { aggiungiMonete } = require('../utils/economia');
const { aggiornaClassifica } = require('./classifica');
const { processGameProgress } = require('../utils/progression');
const { readJson, writeJson } = require('../utils/jsonStore');

const FILE = path.join(__dirname, '..', 'data', 'tornei.json');

function getPlayerName(userId) {
    return getNomeCache(userId) || userId.split('@')[0];
}

function getActiveTournament(tournaments) {
    return Object.values(tournaments).find(item => item.state !== 'finished') || null;
}

function createBracket(players) {
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    const matches = [];
    for (let i = 0; i < shuffled.length; i += 2) {
        if (i + 1 < shuffled.length) {
            matches.push({
                player1: shuffled[i],
                player2: shuffled[i + 1],
                winner: null
            });
        } else {
            matches.push({
                player1: shuffled[i],
                player2: null,
                winner: shuffled[i]
            });
        }
    }
    return matches;
}

module.exports = {
    name: 'torneo',
    description: 'Torneo a eliminazione rapida',
    async execute(msg) {
        const args = msg.body.trim().split(/\s+/).slice(1);
        const sender = await getSenderId(msg);
        const tournaments = readJson(FILE, {});
        const active = getActiveTournament(tournaments);

        if (!args.length) {
            await msg.reply([
                '🏆 TORNEO - GUIDA',
                '',
                '• .torneo crea [nome] (admin)',
                '• .torneo partecipa',
                '• .torneo lista',
                '• .torneo inizia (admin)',
                '• .torneo combatti',
                '• .torneo stato',
                '• .torneo abbandona'
            ].join('\n'));
            return;
        }

        if (args[0] === 'crea') {
            if (!isAdmin(sender)) {
                await msg.reply('❌ Solo gli admin possono creare un torneo.');
                return;
            }
            if (active) {
                await msg.reply('⛔ C’è già un torneo non concluso.');
                return;
            }
            const name = args.slice(1).join(' ').trim();
            if (!name) {
                await msg.reply('❌ Uso: .torneo crea [nome]');
                return;
            }
            const id = Date.now().toString();
            tournaments[id] = {
                id,
                name,
                createdBy: sender,
                participants: [],
                state: 'signup',
                round: 0,
                matches: [],
                champion: null
            };
            writeJson(FILE, tournaments);
            await msg.reply(`🏆 Torneo creato: ${name}\n\n📝 Le iscrizioni sono aperte. Usa .torneo partecipa`);
            return;
        }

        if (args[0] === 'partecipa') {
            if (!active || active.state !== 'signup') {
                await msg.reply('❌ Nessun torneo con iscrizioni aperte.');
                return;
            }
            if (active.participants.includes(sender)) {
                await msg.reply('❌ Sei già iscritto a questo torneo.');
                return;
            }
            active.participants.push(sender);
            tournaments[active.id] = active;
            writeJson(FILE, tournaments);
            await msg.reply(`✅ Iscrizione confermata a "${active.name}".\n\n👥 Partecipanti: ${active.participants.length}`);
            return;
        }

        if (args[0] === 'lista') {
            if (!active) {
                await msg.reply('📭 Nessun torneo attivo al momento.');
                return;
            }
            await msg.reply([
                '🏆 TORNEO ATTIVO',
                '',
                `📋 Nome: ${active.name}`,
                `📊 Stato: ${active.state}`,
                `👥 Partecipanti: ${active.participants.length}`,
                active.state === 'active' ? `🎯 Round: ${active.round}` : '📝 In attesa di inizio'
            ].join('\n'));
            return;
        }

        if (args[0] === 'inizia') {
            if (!isAdmin(sender)) {
                await msg.reply('❌ Solo gli admin possono avviare il torneo.');
                return;
            }
            if (!active || active.state !== 'signup') {
                await msg.reply('❌ Nessun torneo pronto da avviare.');
                return;
            }
            if (active.participants.length < 4) {
                await msg.reply('❌ Servono almeno 4 partecipanti.');
                return;
            }
            active.state = 'active';
            active.round = 1;
            active.matches = createBracket(active.participants);
            tournaments[active.id] = active;
            writeJson(FILE, tournaments);
            await msg.reply(`🚀 Torneo "${active.name}" iniziato!\n\n🎯 Round 1 pronto. Usa .torneo stato`);
            return;
        }

        if (args[0] === 'stato') {
            if (!active) {
                await msg.reply('📭 Nessun torneo attivo.');
                return;
            }
            const lines = [
                '🏆 STATO TORNEO',
                '',
                `📋 Nome: ${active.name}`,
                `📊 Stato: ${active.state}`,
                `🎯 Round: ${active.round || 0}`,
                ''
            ];
            if (active.matches?.length) {
                lines.push('⚔️ Match del round:');
                active.matches.forEach((match, index) => {
                    lines.push(`${index + 1}. ${getPlayerName(match.player1)} vs ${match.player2 ? getPlayerName(match.player2) : 'BYE'}${match.winner ? ` → ${getPlayerName(match.winner)}` : ''}`);
                });
            }
            await msg.reply(lines.join('\n'));
            return;
        }

        if (args[0] === 'combatti') {
            if (!active || active.state !== 'active') {
                await msg.reply('❌ Nessun torneo attivo in corso.');
                return;
            }
            const match = active.matches.find(item => !item.winner && (item.player1 === sender || item.player2 === sender));
            if (!match) {
                await msg.reply('❌ Non hai nessun match aperto in questo round.');
                return;
            }

            const opponent = match.player1 === sender ? match.player2 : match.player1;
            const power = Math.floor(Math.random() * 100) + 1;
            const opponentPower = Math.floor(Math.random() * 100) + 1;
            const winner = power >= opponentPower ? sender : opponent;
            const loser = winner === sender ? opponent : sender;
            match.winner = winner;

            if (winner === sender) {
                aggiornaClassifica(sender, 35, true, 'torneo', getPlayerName(sender));
                aggiungiMonete(sender, 35, getPlayerName(sender));
                await processGameProgress({
                    userId: sender,
                    game: 'torneo',
                    displayName: getPlayerName(sender),
                    msg,
                    events: { plays: 1, wins: 1, profit: 35 }
                });
                if (loser) {
                    aggiornaClassifica(loser, -10, false, 'torneo', getPlayerName(loser));
                    aggiungiMonete(loser, -10, getPlayerName(loser));
                    await processGameProgress({
                        userId: loser,
                        game: 'torneo',
                        displayName: getPlayerName(loser),
                        events: { plays: 1, losses: 1, profit: -10 }
                    });
                }
            }

            if (active.matches.every(item => item.winner)) {
                const winners = active.matches.map(item => item.winner).filter(Boolean);
                if (winners.length === 1) {
                    active.state = 'finished';
                    active.champion = winners[0];
                    aggiornaClassifica(winners[0], 120, true, 'torneo', getPlayerName(winners[0]));
                    aggiungiMonete(winners[0], 120, getPlayerName(winners[0]));
                    await processGameProgress({
                        userId: winners[0],
                        game: 'torneo',
                        displayName: getPlayerName(winners[0]),
                        msg,
                        events: { wins: 1, profit: 120 }
                    });
                    tournaments[active.id] = active;
                    writeJson(FILE, tournaments);
                    await msg.reply(`👑 TORNEO CONCLUSO!\n\n🏆 Campione: ${getPlayerName(winners[0])}\n💰 Premio finale: +120 crediti`);
                    return;
                }

                active.round += 1;
                active.matches = createBracket(winners);
            }

            tournaments[active.id] = active;
            writeJson(FILE, tournaments);
            await msg.reply([
                '⚔️ SCONTRO TORNEO',
                '',
                `🎲 Tuo punteggio: ${power}`,
                `🎲 Punteggio avversario: ${opponentPower}`,
                `🏆 Vincitore match: ${getPlayerName(winner)}`,
                '',
                active.state === 'active' ? `🎯 Round attuale: ${active.round}` : '🏁 Torneo concluso'
            ].join('\n'));
            return;
        }

        if (args[0] === 'abbandona') {
            if (!active) {
                await msg.reply('❌ Non ci sono tornei attivi.');
                return;
            }
            if (active.state === 'signup') {
                active.participants = active.participants.filter(player => player !== sender);
                tournaments[active.id] = active;
                writeJson(FILE, tournaments);
                await msg.reply('🚪 Hai lasciato la lista iscritti del torneo.');
                return;
            }

            const match = active.matches.find(item => !item.winner && (item.player1 === sender || item.player2 === sender));
            if (!match) {
                await msg.reply('❌ Non hai match attivi da abbandonare.');
                return;
            }

            const opponent = match.player1 === sender ? match.player2 : match.player1;
            match.winner = opponent;
            aggiornaClassifica(sender, -15, false, 'torneo', getPlayerName(sender));
            aggiungiMonete(sender, -15, getPlayerName(sender));
            await processGameProgress({
                userId: sender,
                game: 'torneo',
                displayName: getPlayerName(sender),
                events: { plays: 1, losses: 1, profit: -15 }
            });
            tournaments[active.id] = active;
            writeJson(FILE, tournaments);
            await msg.reply('🏃 Hai abbandonato il torneo. Match assegnato all’avversario.');
            return;
        }
    }
};
