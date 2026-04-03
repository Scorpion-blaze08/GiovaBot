const fs = require('fs');
const path = require('path');
const { aggiornaClassifica } = require('./classifica');
const { aggiungiMonete, getSaldo } = require('../utils/economia');
const { getNomeCache } = require('../utils/nomi');
const { getSenderId } = require('../utils/identity');
const { processGameProgress, getProgressForUser } = require('../utils/progression');

const FILE = path.join(__dirname, '..', 'data', 'partite_roulette.json');

const MODES = {
    classica: {
        id: 'classica',
        name: 'Classica',
        emoji: '🎯',
        chambers: 8,
        minBullets: 1,
        maxBullets: 4,
        baseReward: 55,
        basePenalty: 20
    },
    hardcore: {
        id: 'hardcore',
        name: 'Hardcore',
        emoji: '☠️',
        chambers: 6,
        minBullets: 2,
        maxBullets: 4,
        baseReward: 90,
        basePenalty: 35
    },
    vip: {
        id: 'vip',
        name: 'VIP',
        emoji: '💎',
        chambers: 8,
        minBullets: 1,
        maxBullets: 5,
        baseReward: 35,
        basePenalty: 15
    }
};

function readGames() {
    try {
        if (!fs.existsSync(FILE)) return {};
        return JSON.parse(fs.readFileSync(FILE, 'utf8'));
    } catch {
        return {};
    }
}

function writeGames(data) {
    const dir = path.dirname(FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function shuffle(items) {
    const clone = [...items];
    for (let i = clone.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [clone[i], clone[j]] = [clone[j], clone[i]];
    }
    return clone;
}

function getName(userId) {
    return getNomeCache(userId) || userId.split('@')[0];
}

function tag(userId) {
    return `@${userId.split('@')[0]}`;
}

function getMode(modeId) {
    return MODES[modeId] || MODES.classica;
}

function buildDrum(chambers, bullets) {
    const drum = new Array(chambers).fill(false);
    for (let i = 0; i < bullets; i++) drum[i] = true;
    return shuffle(drum);
}

function getRiskMultiplier(game) {
    return 1 + ((game.bullets - game.mode.minBullets) * 0.35);
}

function getRewards(game) {
    const multiplier = getRiskMultiplier(game);
    const winnerGain = Math.round((game.mode.baseReward + game.stake) * multiplier);
    const loserLoss = Math.round((game.mode.basePenalty + Math.floor(game.stake * 0.5)) * multiplier);
    return { winnerGain, loserLoss };
}

function getGameSummary(game) {
    const rewards = getRewards(game);
    return [
        `${game.mode.emoji} Modalita: ${game.mode.name}`,
        `🔫 Tamburo: ${game.mode.chambers} colpi`,
        `💣 Proiettili veri: ${game.bullets}`,
        `💰 Puntata: ${game.stake}`,
        `🎁 Premio max: +${rewards.winnerGain}`,
        `⚠️ Penalita: -${rewards.loserLoss}`
    ].join('\n');
}

function createPlayerStats() {
    return { selfShots: 0, selfSurvive: 0, turns: 0 };
}

function getPlayerRoundStats(game, playerId) {
    if (!game.roundStats) game.roundStats = {};
    if (!game.roundStats[playerId]) game.roundStats[playerId] = createPlayerStats();
    return game.roundStats[playerId];
}

async function sendGameState(client, chatId, game, extra = '', mentions = []) {
    const history = (game.history || []).slice(-4);
    const lines = [
        '🔫 ROULETTE RUSSA 🔫',
        '',
        getGameSummary(game),
        '',
        `🎯 Turno attuale: ${tag(game.turn)}`,
        `📍 Posizione tamburo: ${game.position + 1}/${game.mode.chambers}`,
        game.mustSelfShoot ? '⚠️ Il prossimo colpo deve essere su te stesso.' : '🎯 Puoi scegliere se attaccare o spararti.',
        ''
    ];

    if (history.length) {
        lines.push('📜 Ultimi eventi:');
        for (const event of history) lines.push(`• ${event}`);
        lines.push('');
    }

    lines.push('Comandi:');
    lines.push('• .roulette attacco');
    lines.push('• .roulette sparo');
    lines.push('• .roulette stato');
    lines.push('• .roulette annulla');

    if (extra) {
        lines.push('');
        lines.push(extra);
    }

    await client.sendMessage(chatId, lines.join('\n'), { mentions });
}

module.exports = {
    name: 'roulette',
    description: 'Roulette russa con modalita, puntate e progressione',
    async execute(msg, client) {
        const args = msg.body.trim().split(/\s+/).slice(1);
        const chatId = msg.from;
        const games = readGames();
        const game = games[chatId];
        const sender = await getSenderId(msg);

        if (!args.length || ['help', 'aiuto'].includes(args[0])) {
            await msg.reply([
                '🔫 ROULETTE RUSSA - GUIDA 🔫',
                '',
                '• .roulette sfida @utente [classica|hardcore|vip] [puntata]',
                '• .roulette accetto',
                '• .roulette rifiuto',
                '• .roulette [numero]',
                '• .roulette random',
                '• .roulette attacco',
                '• .roulette sparo',
                '• .roulette stato',
                '• .roulette stats',
                '• .roulette annulla',
                '',
                '💡 Più proiettili scegli, più sale la ricompensa.'
            ].join('\n'));
            return;
        }

        if (args[0] === 'stats') {
            const mentions = await msg.getMentions();
            const targetId = mentions.length ? mentions[0].id._serialized : sender;
            const stats = getProgressForUser(targetId).games.roulette || {};
            await msg.reply([
                `📊 STATS ROULETTE DI ${getName(targetId).toUpperCase()}`,
                '',
                `🎮 Partite: ${stats.plays || 0}`,
                `🏆 Vittorie: ${stats.wins || 0}`,
                `💀 Sconfitte: ${stats.losses || 0}`,
                `💰 Profitto netto: ${stats.profit || 0}`,
                `🔫 Colpi su se stesso: ${stats.selfShots || 0}`,
                `🫀 Sopravvivenze personali: ${stats.selfSurvive || 0}`,
                `☠️ Vittorie high risk: ${stats.highRiskWins || 0}`
            ].join('\n'));
            return;
        }

        if (args[0] === 'sfida') {
            const mentions = await msg.getMentions();
            if (!mentions.length) {
                await msg.reply('❌ Uso: .roulette sfida @utente [classica|hardcore|vip] [puntata]');
                return;
            }

            if (game) {
                await msg.reply('⛔ C’è già una partita di roulette attiva in questa chat.');
                return;
            }

            const targetId = mentions[0].id._serialized;
            if (targetId === sender) {
                await msg.reply('❌ Non puoi sfidare te stesso.');
                return;
            }

            const requestedMode = (args[2] || 'classica').toLowerCase();
            const mode = getMode(requestedMode);
            const requestedStake = Math.max(0, Number(args[3] || 0));
            const stake = mode.id === 'vip' ? Math.max(50, requestedStake || 100) : requestedStake;

            games[chatId] = {
                challenger: sender,
                target: targetId,
                state: 'awaiting',
                mode,
                stake,
                createdAt: Date.now()
            };
            writeGames(games);

            await client.sendMessage(chatId, [
                '🔫 SFIDA ROULETTE LANCIATA 🔫',
                '',
                `${tag(sender)} sfida ${tag(targetId)}`,
                '',
                `${mode.emoji} Modalita: ${mode.name}`,
                `💰 Puntata iniziale: ${stake}`,
                '',
                `${tag(targetId)} rispondi con:`,
                '• .roulette accetto',
                '• .roulette rifiuto'
            ].join('\n'), { mentions: [sender, targetId] });
            return;
        }

        if (args[0] === 'accetto' || args[0] === 'rifiuto') {
            if (!game || game.state !== 'awaiting') {
                await msg.reply('❌ Nessuna sfida roulette in attesa.');
                return;
            }

            if (sender !== game.target) {
                await msg.reply('❌ Solo lo sfidato può rispondere a questa sfida.');
                return;
            }

            if (args[0] === 'rifiuto') {
                delete games[chatId];
                writeGames(games);
                await client.sendMessage(chatId, `😶 ${tag(sender)} ha rifiutato la sfida roulette.`, { mentions: [sender] });
                return;
            }

            games[chatId] = {
                ...game,
                state: 'choose_bullets',
                history: [`${getName(sender)} ha accettato la sfida.`]
            };
            writeGames(games);

            await client.sendMessage(chatId, [
                '✅ SFIDA ACCETTATA ✅',
                '',
                `${tag(game.challenger)}, scegli quanti proiettili usare.`,
                `Usa un numero tra ${game.mode.minBullets} e ${game.mode.maxBullets}`,
                'oppure .roulette random',
                '',
                getGameSummary(games[chatId])
            ].join('\n'), { mentions: [game.challenger] });
            return;
        }

        if ((args[0] === 'random' || (!Number.isNaN(Number(args[0])) && args[0] !== '')) && game?.state === 'choose_bullets') {
            if (sender !== game.challenger) {
                await msg.reply('❌ Solo lo sfidante può impostare i proiettili.');
                return;
            }

            const bullets = args[0] === 'random'
                ? Math.floor(Math.random() * (game.mode.maxBullets - game.mode.minBullets + 1)) + game.mode.minBullets
                : Number(args[0]);

            if (bullets < game.mode.minBullets || bullets > game.mode.maxBullets) {
                await msg.reply(`❌ Inserisci un numero tra ${game.mode.minBullets} e ${game.mode.maxBullets}.`);
                return;
            }

            games[chatId] = {
                ...game,
                state: 'active',
                bullets,
                drum: buildDrum(game.mode.chambers, bullets),
                position: 0,
                turn: game.challenger,
                mustSelfShoot: false,
                roundStats: {
                    [game.challenger]: createPlayerStats(),
                    [game.target]: createPlayerStats()
                },
                history: [
                    ...(game.history || []),
                    `${getName(game.challenger)} ha impostato ${bullets} proiettili veri.`
                ]
            };
            writeGames(games);

            await sendGameState(client, chatId, games[chatId], '🔥 La partita è iniziata.', [game.challenger]);
            return;
        }

        if (args[0] === 'stato') {
            if (!game || game.state !== 'active') {
                await msg.reply('❌ Nessuna roulette attiva al momento.');
                return;
            }
            await sendGameState(client, chatId, game);
            return;
        }

        if (args[0] === 'annulla') {
            if (!game) {
                await msg.reply('❌ Nessuna roulette da annullare.');
                return;
            }

            delete games[chatId];
            writeGames(games);
            await msg.reply('🛑 Partita roulette annullata.');
            return;
        }

        if (args[0] !== 'attacco' && args[0] !== 'sparo') {
            await msg.reply('❌ Comando roulette non valido. Usa .roulette help');
            return;
        }

        if (!game || game.state !== 'active') {
            await msg.reply('❌ Nessuna roulette in corso.');
            return;
        }

        if (sender !== game.turn) {
            await client.sendMessage(chatId, `⏳ Non è il tuo turno. Tocca a ${tag(game.turn)}.`, { mentions: [game.turn] });
            return;
        }

        if (game.mustSelfShoot && args[0] !== 'sparo') {
            await msg.reply('⚠️ Dopo un attacco andato a vuoto devi spararti. Usa .roulette sparo');
            return;
        }

        const shooterStats = getPlayerRoundStats(game, sender);
        const targetId = args[0] === 'attacco'
            ? (sender === game.challenger ? game.target : game.challenger)
            : sender;
        const currentShotIsLive = Boolean(game.drum[game.position]);

        if (args[0] === 'sparo') {
            shooterStats.selfShots += 1;
            shooterStats.turns += 1;
        } else {
            shooterStats.turns += 1;
        }

        if (currentShotIsLive) {
            const winnerId = targetId === sender
                ? (sender === game.challenger ? game.target : game.challenger)
                : sender;
            const loserId = targetId;
            const winnerName = getName(winnerId);
            const loserName = getName(loserId);
            const rewards = getRewards(game);
            const highRisk = game.bullets >= Math.ceil(game.mode.chambers / 2);

            delete games[chatId];
            writeGames(games);

            aggiornaClassifica(winnerId, rewards.winnerGain, true, 'roulette', winnerName);
            aggiornaClassifica(loserId, -rewards.loserLoss, false, 'roulette', loserName);
            aggiungiMonete(winnerId, rewards.winnerGain, winnerName);
            aggiungiMonete(loserId, -rewards.loserLoss, loserName);

            await processGameProgress({
                userId: winnerId,
                game: 'roulette',
                displayName: winnerName,
                msg,
                events: {
                    plays: 1,
                    wins: 1,
                    profit: rewards.winnerGain,
                    selfShots: game.roundStats?.[winnerId]?.selfShots || 0,
                    selfSurvive: game.roundStats?.[winnerId]?.selfSurvive || 0,
                    highRiskWins: highRisk ? 1 : 0
                },
                flags: [highRisk ? 'roulette_high_risk' : null].filter(Boolean)
            });

            await processGameProgress({
                userId: loserId,
                game: 'roulette',
                displayName: loserName,
                events: {
                    plays: 1,
                    losses: 1,
                    profit: -rewards.loserLoss,
                    selfShots: game.roundStats?.[loserId]?.selfShots || 0,
                    selfSurvive: game.roundStats?.[loserId]?.selfSurvive || 0
                }
            });

            await client.sendMessage(chatId, [
                '💥 BANG! 💥',
                '',
                `${tag(loserId)} è stato colpito.`,
                '',
                `🏆 Vincitore: ${tag(winnerId)} (${winnerName})`,
                `💰 Premio: +${rewards.winnerGain} crediti`,
                `💀 Sconfitto: ${tag(loserId)} (${loserName})`,
                `📉 Penalità: -${rewards.loserLoss} crediti`,
                '',
                `🎯 Modalita: ${game.mode.name} | Proiettili: ${game.bullets}/${game.mode.chambers}`,
                highRisk ? '☠️ Bonus rischio massimo applicato.' : '🧠 Partita chiusa senza bonus rischio massimo.'
            ].join('\n'), { mentions: [winnerId, loserId] });
            return;
        }

        game.position += 1;
        if (args[0] === 'attacco') {
            game.mustSelfShoot = true;
            game.history = [...(game.history || []), `${getName(sender)} ha tentato di sparare a ${getName(targetId)}: click.`];
            games[chatId] = game;
            writeGames(games);
            await client.sendMessage(chatId, [
                '🔫 CLICK',
                '',
                `${tag(sender)} hai mancato il colpo.`,
                '⚠️ Adesso devi spararti da solo.',
                '',
                'Usa .roulette sparo'
            ].join('\n'), { mentions: [sender] });
            return;
        }

        shooterStats.selfSurvive += 1;
        game.mustSelfShoot = false;
        game.turn = sender === game.challenger ? game.target : game.challenger;
        game.history = [...(game.history || []), `${getName(sender)} si è sparato ed è sopravvissuto.`];
        games[chatId] = game;
        writeGames(games);

        await client.sendMessage(chatId, [
            '🫀 CLICK',
            '',
            `${tag(sender)} è sopravvissuto al proprio colpo.`,
            `🎯 Ora tocca a ${tag(game.turn)}.`,
            '',
            'Comandi disponibili:',
            '• .roulette attacco',
            '• .roulette sparo'
        ].join('\n'), { mentions: [sender, game.turn] });
    }
};
