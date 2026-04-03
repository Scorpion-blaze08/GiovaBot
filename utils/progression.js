const path = require('path');
const { aggiungiMonete } = require('./economia');
const { findMatchingKey } = require('./identity');
const { readJson, writeJson } = require('./jsonStore');
const { askGeminiJson, isAiConfigured } = require('./ai');

const DATA_DIR = path.join(__dirname, '..', 'data');
const PROGRESSION_FILE = path.join(DATA_DIR, 'progression.json');
const ACHIEVEMENTS_FILE = path.join(DATA_DIR, 'achievements.json');
const MISSIONS_FILE = path.join(DATA_DIR, 'missions.json');

const ACHIEVEMENTS = {
    first_command: { name: 'Primo Passo', emoji: '🚀', category: '🏆 SPECIALI', reward: 40 },
    slot_first_win: { name: 'Prima Vincita Slot', emoji: '🎰', category: '🎰 SLOT', reward: 35 },
    slot_jackpot: { name: 'Jackpot Diamante', emoji: '💎', category: '🎰 SLOT', reward: 120 },
    slot_streak_5: { name: 'Slot in Fiamme', emoji: '🔥', category: '🎰 SLOT', reward: 90 },
    dado_first_roll: { name: 'Primo Lancio', emoji: '🎲', category: '🎲 DADO', reward: 25 },
    dado_double_six: { name: 'Doppio Sei', emoji: '🎯', category: '🎲 DADO', reward: 90 },
    dado_high_score: { name: 'Tavolo Caldo', emoji: '📈', category: '🎲 DADO', reward: 70 },
    bj_first_win: { name: 'Prima Mano Vinta', emoji: '🃏', category: '🃏 BLACKJACK', reward: 35 },
    bj_blackjack: { name: 'Blackjack Perfetto', emoji: '🎉', category: '🃏 BLACKJACK', reward: 100 },
    roulette_first_win: { name: 'Primo Duello Letale', emoji: '🔫', category: '🔫 ROULETTE', reward: 55 },
    roulette_survivor: { name: 'Sopravvissuto', emoji: '🫀', category: '🔫 ROULETTE', reward: 90 },
    roulette_madman: { name: 'Folle Geniale', emoji: '😈', category: '🔫 ROULETTE', reward: 130 },
    roulette_high_risk: { name: 'Rischio Massimo', emoji: '☠️', category: '🔫 ROULETTE', reward: 120 },
    cavalli_first_bet: { name: 'Primo Biglietto', emoji: '🐎', category: '🐎 CAVALLI', reward: 30 },
    cavalli_winner: { name: 'Pronostico Giusto', emoji: '🏁', category: '🐎 CAVALLI', reward: 60 },
    duello_first_win: { name: 'Primo Sangue', emoji: '⚔️', category: '⚔️ COMBATTIMENTI', reward: 70 },
    pesca_first_fish: { name: 'Primo Pescato', emoji: '🐟', category: '🎣 PESCA', reward: 25 },
    pesca_rare_hunter: { name: 'Cacciatore Raro', emoji: '✨', category: '🎣 PESCA', reward: 80 },
    pesca_legendary: { name: 'Leggenda del Molo', emoji: '🐉', category: '🎣 PESCA', reward: 160 },
    pesca_boss_slayer: { name: 'Terrore degli Abissi', emoji: '👑', category: '🎣 PESCA', reward: 220 },
    pesca_chef: { name: 'Chef del Porto', emoji: '🍽️', category: '🎣 PESCA', reward: 100 },
    trivia_scholar: { name: 'Mente Brillante', emoji: '🧠', category: '📚 STUDIO', reward: 80 },
    scelta_planner: { name: 'Decisionista', emoji: '📋', category: '📚 STUDIO', reward: 45 },
    torneo_champion: { name: 'Campione del Torneo', emoji: '🏆', category: '🏟️ EVENTI', reward: 140 },
    battaglia_warlord: { name: 'Condottiero', emoji: '🛡️', category: '🏟️ EVENTI', reward: 110 }
};

const DAILY_POOLS = {
    pesca: [
        { id: 'fish_catches', title: 'Bottino del Giorno', emoji: '🎣', game: 'pesca', metric: 'fishCaught', target: 8, reward: 90 },
        { id: 'fish_rare', title: 'Acque Preziose', emoji: '✨', game: 'pesca', metric: 'rareCaught', target: 2, reward: 140 },
        { id: 'fish_craft', title: 'Cucina di Bordo', emoji: '🍳', game: 'pesca', metric: 'crafted', target: 1, reward: 120 },
        { id: 'fish_boss', title: 'Sfida del Weekend', emoji: '👑', game: 'pesca', metric: 'bossWins', target: 1, reward: 220, weekendOnly: true }
    ],
    casino: [
        { id: 'slot_runs', title: 'Leva Calda', emoji: '🎰', game: 'slot', metric: 'plays', target: 5, reward: 80 },
        { id: 'dice_runs', title: 'Tavolo dei Dadi', emoji: '🎲', game: 'dado', metric: 'plays', target: 4, reward: 75 },
        { id: 'blackjack_wins', title: 'Banco Battuto', emoji: '🃏', game: 'blackjack', metric: 'wins', target: 2, reward: 110 },
        { id: 'roulette_runs', title: 'Tavolo del Coraggio', emoji: '🔫', game: 'roulette', metric: 'plays', target: 2, reward: 120 }
    ],
    arena: [
        { id: 'horse_runs', title: 'Tribuna in Festa', emoji: '🐎', game: 'cavalli', metric: 'plays', target: 3, reward: 95 },
        { id: 'duel_win', title: 'Gloria nell Arena', emoji: '⚔️', game: 'duello', metric: 'wins', target: 1, reward: 150 }
    ],
    school: [
        { id: 'trivia_daily', title: 'Quiz Lampo', emoji: '🧠', game: 'trivia', metric: 'plays', target: 2, reward: 85 },
        { id: 'choice_daily', title: 'Planner del Giorno', emoji: '📋', game: 'scelta', metric: 'plays', target: 2, reward: 50 }
    ],
    general: [
        { id: 'profit_push', title: 'Cassa Positiva', emoji: '💰', game: 'all', metric: 'profit', target: 160, reward: 130 }
    ]
};

const MONTHLY_POOLS = [
    { id: 'monthly_profit', title: 'Tesoro del Mese', emoji: '💎', game: 'all', metric: 'profit', target: 1800, reward: 650 },
    { id: 'monthly_pesca', title: 'Marinaio Instancabile', emoji: '🌊', game: 'pesca', metric: 'fishCaught', target: 45, reward: 500 },
    { id: 'monthly_casino', title: 'Re della Sala', emoji: '🎰', game: 'slot', metric: 'plays', target: 25, reward: 420 },
    { id: 'monthly_school', title: 'Mese da Secchione', emoji: '📚', game: 'trivia', metric: 'wins', target: 10, reward: 480 },
    { id: 'monthly_combat', title: 'Arena in Fiamme', emoji: '⚔️', game: 'duello', metric: 'wins', target: 6, reward: 520 }
];

const SEASONAL_POOLS = [
    { id: 'season_legend', title: 'Leggenda di Stagione', emoji: '👑', game: 'all', metric: 'wins', target: 40, reward: 1400 },
    { id: 'season_fishing', title: 'Dominatore degli Abissi', emoji: '🐉', game: 'pesca', metric: 'rareCaught', target: 18, reward: 1200 },
    { id: 'season_school', title: 'Master del Ripasso', emoji: '🎓', game: 'trivia', metric: 'plays', target: 24, reward: 1000 },
    { id: 'season_events', title: 'Signore degli Eventi', emoji: '🏟️', game: 'torneo', metric: 'wins', target: 4, reward: 1150 }
];

function getTodayKey() {
    return new Date().toISOString().slice(0, 10);
}

function getMonthKey() {
    return new Date().toISOString().slice(0, 7);
}

function getSeasonKey(date = new Date()) {
    const month = date.getUTCMonth() + 1;
    const year = date.getUTCFullYear();
    let season = 'winter';
    if (month >= 3 && month <= 5) season = 'spring';
    else if (month >= 6 && month <= 8) season = 'summer';
    else if (month >= 9 && month <= 11) season = 'autumn';
    return `${year}-${season}`;
}

function seedFromString(value) {
    return value.split('').reduce((sum, char, index) => sum + (char.charCodeAt(0) * (index + 1)), 0);
}

function pickFromPool(pool, seed, offset) {
    return pool[(seed + offset) % pool.length];
}

function cloneMission(mission) {
    return { ...mission };
}

function buildDailyMissions(day) {
    const seed = seedFromString(day);
    const weekday = new Date(`${day}T12:00:00`).getDay();
    const isWeekend = weekday === 0 || weekday === 6;

    const missions = [
        pickFromPool(DAILY_POOLS.pesca.filter(item => !item.weekendOnly), seed, 1),
        pickFromPool(DAILY_POOLS.casino, seed, 2),
        pickFromPool(DAILY_POOLS.arena, seed, 3),
        pickFromPool(DAILY_POOLS.school, seed, 4),
        pickFromPool(DAILY_POOLS.general, seed, 0)
    ];

    if (isWeekend) {
        missions.push(DAILY_POOLS.pesca.find(item => item.id === 'fish_boss'));
    }

    return missions.map(cloneMission);
}

function buildMonthlyMissions(monthKey) {
    const seed = seedFromString(monthKey);
    return [
        pickFromPool(MONTHLY_POOLS, seed, 0),
        pickFromPool(MONTHLY_POOLS, seed, 1),
        pickFromPool(MONTHLY_POOLS, seed, 2)
    ].map(cloneMission);
}

function buildSeasonalMissions(seasonKey) {
    const seed = seedFromString(seasonKey);
    return [
        pickFromPool(SEASONAL_POOLS, seed, 0),
        pickFromPool(SEASONAL_POOLS, seed, 1),
        pickFromPool(SEASONAL_POOLS, seed, 2)
    ].map(cloneMission);
}

function getCycleLabel(cycleName) {
    if (cycleName === 'daily') return 'giornaliere';
    if (cycleName === 'monthly') return 'mensili';
    return 'stagionali';
}

function getMissionBounds(cycleName, mission) {
    const targetFactor = cycleName === 'daily'
        ? [0.75, 1.35]
        : cycleName === 'monthly'
            ? [0.8, 1.3]
            : [0.85, 1.25];

    const rewardFactor = cycleName === 'daily'
        ? [0.8, 1.35]
        : cycleName === 'monthly'
            ? [0.85, 1.3]
            : [0.9, 1.25];

    const minTarget = Math.max(1, Math.floor(mission.target * targetFactor[0]));
    const maxTarget = Math.max(minTarget, Math.ceil(mission.target * targetFactor[1]));
    const minReward = Math.max(10, Math.floor(mission.reward * rewardFactor[0]));
    const maxReward = Math.max(minReward, Math.ceil(mission.reward * rewardFactor[1]));

    return { minTarget, maxTarget, minReward, maxReward };
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function sanitizeGeneratedMission(baseMission, rawMission, cycleName, index) {
    const bounds = getMissionBounds(cycleName, baseMission);
    const rawTitle = typeof rawMission?.title === 'string' ? rawMission.title.trim() : '';
    const rawFlavor = typeof rawMission?.flavor === 'string' ? rawMission.flavor.trim() : '';
    const rawEmoji = typeof rawMission?.emoji === 'string' ? rawMission.emoji.trim() : '';

    return {
        ...baseMission,
        id: `${baseMission.id}_${cycleName}_${index + 1}`,
        title: rawTitle || baseMission.title,
        emoji: rawEmoji || baseMission.emoji,
        target: clamp(Number(rawMission?.target || baseMission.target), bounds.minTarget, bounds.maxTarget),
        reward: clamp(Number(rawMission?.reward || baseMission.reward), bounds.minReward, bounds.maxReward),
        flavor: rawFlavor || `${baseMission.emoji} Completa ${baseMission.title.toLowerCase()} e prendi ${baseMission.reward} crediti.`
    };
}

function defaultCyclePack(cycleName, cycleKey, missions) {
    const cycleLabel = cycleName === 'daily' ? 'giornaliere' : cycleName === 'monthly' ? 'mensili' : 'stagionali';
    const seasonLabel = cycleName === 'seasonal' ? ` | Stagione: ${cycleKey}` : '';
    const generatedMissions = missions.map((mission, index) => ({
        ...mission,
        id: `${mission.id}_${cycleName}_${index + 1}`,
        flavor: `${mission.emoji} Punta su ${mission.game} e chiudi l'obiettivo per incassare ${mission.reward} crediti.`
    }));

    return {
        source: 'fallback',
        headline: `Missioni ${cycleLabel} pronte all'azione${seasonLabel}`,
        missions: generatedMissions
    };
}

async function generateAiMissionSet(cycleName, cycleKey, missions) {
    if (!isAiConfigured()) return defaultCyclePack(cycleName, cycleKey, missions);

    try {
        const payloadMissions = missions.map((mission, index) => {
            const bounds = getMissionBounds(cycleName, mission);
            return {
                slot: index + 1,
                baseId: mission.id,
                currentTitle: mission.title,
                emoji: mission.emoji,
                game: mission.game,
                metric: mission.metric,
                minTarget: bounds.minTarget,
                maxTarget: bounds.maxTarget,
                minReward: bounds.minReward,
                maxReward: bounds.maxReward
            };
        });

        const payload = await askGeminiJson([
            'Genera un pacchetto missioni per un bot WhatsApp scolastico/gaming.',
            `Ciclo: ${cycleName}`,
            `Chiave ciclo: ${cycleKey}`,
            'Restituisci JSON con questa struttura:',
            '{"headline":"...","missions":[{"slot":1,"title":"...","emoji":"...","target":1,"reward":100,"flavor":"..."}]}',
            'Vincoli:',
            '- italiano',
            '- headline massimo 80 caratteri',
            '- esattamente una missione per ogni slot passato',
            '- non cambiare gioco o metrica, cambia solo titolo/target/reward/flavor',
            '- flavor massimo 120 caratteri',
            '- tono energico, chiaro, utile in chat',
            '- niente markdown',
            '- target e reward devono rispettare i range indicati',
            '',
            `Template missioni: ${JSON.stringify(payloadMissions)}`
        ].join('\n'), {
            temperature: 0.8,
            maxOutputTokens: 500
        });

        const generated = Array.isArray(payload?.missions) ? payload.missions : [];
        const aiMissions = missions.map((mission, index) => {
            const rawMission = generated.find(item => Number(item?.slot) === index + 1);
            return sanitizeGeneratedMission(mission, rawMission, cycleName, index);
        });

        return {
            source: 'gemini',
            headline: typeof payload?.headline === 'string' && payload.headline.trim()
                ? payload.headline.trim()
                : defaultCyclePack(cycleName, cycleKey, missions).headline,
            missions: aiMissions
        };
    } catch {
        return defaultCyclePack(cycleName, cycleKey, missions);
    }
}

async function createCycleState(cycleName, key, builder) {
    const baseMissions = builder(key);
    const generatedPack = await generateAiMissionSet(cycleName, key, baseMissions);
    const cycleLabel = getCycleLabel(cycleName);

    return {
        key,
        missions: generatedPack.missions,
        users: {},
        ai: {
            source: generatedPack.source,
            headline: generatedPack.headline,
            descriptions: Object.fromEntries(
                generatedPack.missions.map(mission => [
                    mission.id,
                    mission.flavor || `${mission.emoji} Completa questa missione ${cycleLabel} e incassa ${mission.reward} crediti.`
                ])
            )
        }
    };
}

function normalizeMissionState(state) {
    if (state && state.cycles) return state;

    if (state && state.date && Array.isArray(state.missions)) {
        return {
            cycles: {
                daily: {
                    key: state.date,
                    missions: state.missions,
                    users: state.users || {},
                    ai: null
                }
            }
        };
    }

    return { cycles: {} };
}

function shouldRefreshCycle(cycleName, cycle, key) {
    if (!cycle || cycle.key !== key || !Array.isArray(cycle.missions)) return true;

    const expectedTag = `_${cycleName}_`;
    return cycle.missions.some(mission => {
        if (!mission || typeof mission !== 'object') return true;
        if (typeof mission.id !== 'string' || !mission.id.includes(expectedTag)) return true;
        return typeof mission.flavor !== 'string';
    });
}

async function ensureCycleState(cycleName, key, builder) {
    const state = normalizeMissionState(readJson(MISSIONS_FILE, {}));
    const cycles = state.cycles || {};
    const current = cycles[cycleName];

    if (shouldRefreshCycle(cycleName, current, key)) {
        cycles[cycleName] = await createCycleState(cycleName, key, builder);
    } else {
        if (!current.users || typeof current.users !== 'object') current.users = {};
    }

    const cycle = cycles[cycleName];
    if (!cycle.ai || cycle.aiKey !== key) {
        const ai = {
            source: cycle.ai?.source || 'cache',
            headline: cycle.ai?.headline || defaultCyclePack(cycleName, key, cycle.missions).headline,
            descriptions: cycle.ai?.descriptions || Object.fromEntries(
                cycle.missions.map(mission => [mission.id, mission.flavor || ''])
            )
        };
        cycle.ai = ai;
        cycle.aiKey = key;
    }

    state.cycles = cycles;
    writeJson(MISSIONS_FILE, state);
    return { state, cycle };
}

function getCycleRecord(cycle, userId) {
    const key = findMatchingKey(cycle.users, userId) || userId;
    if (!cycle.users[key]) cycle.users[key] = { progress: {}, claimed: {} };
    return { key, record: cycle.users[key] };
}

function updateProgressStats(userId, game, events) {
    const progression = readJson(PROGRESSION_FILE, {});
    const key = findMatchingKey(progression, userId) || userId;
    if (!progression[key]) progression[key] = { total: { plays: 0, wins: 0, losses: 0, profit: 0 }, games: {} };
    if (!progression[key].games[game]) progression[key].games[game] = {};

    const total = progression[key].total;
    const gameStats = progression[key].games[game];

    for (const [metric, value] of Object.entries(events)) {
        if (typeof value !== 'number') continue;
        if (['plays', 'wins', 'losses', 'profit'].includes(metric)) {
            total[metric] = (total[metric] || 0) + value;
        }
        gameStats[metric] = (gameStats[metric] || 0) + value;
    }

    writeJson(PROGRESSION_FILE, progression);
    return progression[key];
}

function getProgressForUser(userId) {
    const progression = readJson(PROGRESSION_FILE, {});
    const key = findMatchingKey(progression, userId);
    return key ? progression[key] : { total: { plays: 0, wins: 0, losses: 0, profit: 0 }, games: {} };
}

function awardAchievement(userId, achievementId, displayName) {
    const achievements = readJson(ACHIEVEMENTS_FILE, {});
    const key = findMatchingKey(achievements, userId) || userId;
    if (!achievements[key]) achievements[key] = {};
    if (achievements[key][achievementId]) return null;

    const meta = ACHIEVEMENTS[achievementId];
    if (!meta) return null;

    achievements[key][achievementId] = {
        unlockedAt: Date.now(),
        reward: meta.reward,
        date: new Date().toLocaleDateString('it-IT')
    };
    writeJson(ACHIEVEMENTS_FILE, achievements);
    aggiungiMonete(userId, meta.reward, displayName);

    return {
        type: 'achievement',
        text: `🏆 Achievement sbloccato: ${meta.emoji} ${meta.name}\n💰 Ricompensa: +${meta.reward} crediti`
    };
}

function getAchievementInfo(id) {
    return ACHIEVEMENTS[id] || null;
}

function getAllAchievements() {
    return ACHIEVEMENTS;
}

async function recordMissionProgress(userId, displayName, game, events) {
    const cycleDefinitions = [
        { name: 'daily', key: getTodayKey(), builder: buildDailyMissions },
        { name: 'monthly', key: getMonthKey(), builder: buildMonthlyMissions },
        { name: 'seasonal', key: getSeasonKey(), builder: buildSeasonalMissions }
    ];

    const notifications = [];
    const state = normalizeMissionState(readJson(MISSIONS_FILE, {}));

    for (const definition of cycleDefinitions) {
        const existingCycle = state.cycles?.[definition.name];
        let cycle = existingCycle;

        if (shouldRefreshCycle(definition.name, cycle, definition.key)) {
            cycle = await createCycleState(definition.name, definition.key, definition.builder);
            cycle.aiKey = definition.key;
        }

        if (!cycle.users || typeof cycle.users !== 'object') cycle.users = {};
        const { key, record } = getCycleRecord(cycle, userId);

        for (const mission of cycle.missions) {
            if (mission.game !== 'all' && mission.game !== game) continue;

            const incrementRaw = Number(events[mission.metric] || 0);
            const increment = mission.metric === 'profit' ? Math.max(0, incrementRaw) : incrementRaw;
            if (increment <= 0) continue;

            record.progress[mission.id] = (record.progress[mission.id] || 0) + increment;
            if (!record.claimed[mission.id] && record.progress[mission.id] >= mission.target) {
                record.claimed[mission.id] = true;
                aggiungiMonete(userId, mission.reward, displayName);
                notifications.push(
                    `${definition.name === 'daily' ? '🎯' : definition.name === 'monthly' ? '📅' : '🌦️'} Missione ${definition.name} completata: ${mission.emoji} ${mission.title}\n💰 Ricompensa: +${mission.reward} crediti`
                );
            }
        }

        cycle.users[key] = record;
        state.cycles[definition.name] = cycle;
    }

    writeJson(MISSIONS_FILE, state);
    return notifications;
}

async function getMissionBoardForUser(userId) {
    const cycleDefinitions = [
        { name: 'daily', label: 'Missioni Giornaliere', key: getTodayKey(), builder: buildDailyMissions },
        { name: 'monthly', label: 'Missioni Mensili', key: getMonthKey(), builder: buildMonthlyMissions },
        { name: 'seasonal', label: 'Missioni Stagionali', key: getSeasonKey(), builder: buildSeasonalMissions }
    ];

    const board = {};

    for (const definition of cycleDefinitions) {
        const { cycle } = await ensureCycleState(definition.name, definition.key, definition.builder);
        const userKey = findMatchingKey(cycle.users, userId);
        const userRecord = userKey ? cycle.users[userKey] : { progress: {}, claimed: {} };
        const ai = cycle.ai || defaultCyclePack(definition.name, definition.key, cycle.missions);

        board[definition.name] = {
            key: cycle.key,
            label: definition.label,
            headline: ai.headline,
            aiSource: ai.source,
            missions: cycle.missions.map(mission => ({
                ...mission,
                flavor: ai.descriptions?.[mission.id] || '',
                progress: userRecord.progress?.[mission.id] || 0,
                completed: Boolean(userRecord.claimed?.[mission.id])
            }))
        };
    }

    return board;
}

function getTodayMissionsForUser(userId) {
    const state = normalizeMissionState(readJson(MISSIONS_FILE, {}));
    const daily = state.cycles?.daily;
    const dailyKey = getTodayKey();
    const cycle = daily && daily.key === dailyKey ? daily : {
        key: dailyKey,
        missions: defaultCyclePack('daily', dailyKey, buildDailyMissions(dailyKey)).missions,
        users: {},
        ai: {
            source: 'fallback',
            headline: defaultCyclePack('daily', dailyKey, buildDailyMissions(dailyKey)).headline,
            descriptions: Object.fromEntries(
                defaultCyclePack('daily', dailyKey, buildDailyMissions(dailyKey)).missions.map(mission => [mission.id, mission.flavor])
            )
        }
    };
    const userKey = findMatchingKey(cycle.users, userId);
    const userRecord = userKey ? cycle.users[userKey] : { progress: {}, claimed: {} };

    return {
        date: cycle.key,
        missions: cycle.missions.map(mission => ({
            ...mission,
            progress: userRecord.progress?.[mission.id] || 0,
            completed: Boolean(userRecord.claimed?.[mission.id])
        }))
    };
}

async function processGameProgress({ userId, game, displayName, msg, events = {}, flags = [], streak = 0 }) {
    updateProgressStats(userId, game, events);
    const notifications = await recordMissionProgress(userId, displayName, game, events);
    const achievementsToCheck = new Set(flags);
    const stats = getProgressForUser(userId);
    const gameStats = stats.games[game] || {};

    if ((stats.total.plays || 0) >= 1) achievementsToCheck.add('first_command');
    if (game === 'slot' && (gameStats.wins || 0) >= 1) achievementsToCheck.add('slot_first_win');
    if (game === 'slot' && streak >= 5) achievementsToCheck.add('slot_streak_5');
    if (game === 'dado' && (gameStats.plays || 0) >= 1) achievementsToCheck.add('dado_first_roll');
    if (game === 'blackjack' && (gameStats.wins || 0) >= 1) achievementsToCheck.add('bj_first_win');
    if (game === 'roulette' && (gameStats.wins || 0) >= 1) achievementsToCheck.add('roulette_first_win');
    if (game === 'roulette' && (gameStats.selfSurvive || 0) >= 2) achievementsToCheck.add('roulette_survivor');
    if (game === 'roulette' && (gameStats.selfShots || 0) >= 3) achievementsToCheck.add('roulette_madman');
    if (game === 'roulette' && (gameStats.highRiskWins || 0) >= 1) achievementsToCheck.add('roulette_high_risk');
    if (game === 'cavalli' && (gameStats.plays || 0) >= 1) achievementsToCheck.add('cavalli_first_bet');
    if (game === 'cavalli' && (gameStats.wins || 0) >= 1) achievementsToCheck.add('cavalli_winner');
    if (game === 'duello' && (gameStats.wins || 0) >= 1) achievementsToCheck.add('duello_first_win');
    if (game === 'pesca' && (gameStats.fishCaught || 0) >= 1) achievementsToCheck.add('pesca_first_fish');
    if (game === 'pesca' && (gameStats.rareCaught || 0) >= 5) achievementsToCheck.add('pesca_rare_hunter');
    if (game === 'pesca' && (gameStats.legendaryCaught || 0) >= 1) achievementsToCheck.add('pesca_legendary');
    if (game === 'pesca' && (gameStats.bossWins || 0) >= 1) achievementsToCheck.add('pesca_boss_slayer');
    if (game === 'pesca' && (gameStats.crafted || 0) >= 1) achievementsToCheck.add('pesca_chef');
    if (game === 'trivia' && (gameStats.wins || 0) >= 3) achievementsToCheck.add('trivia_scholar');
    if (game === 'scelta' && (gameStats.plays || 0) >= 5) achievementsToCheck.add('scelta_planner');
    if (game === 'torneo' && (gameStats.wins || 0) >= 1) achievementsToCheck.add('torneo_champion');
    if (game === 'battaglia' && (gameStats.wins || 0) >= 3) achievementsToCheck.add('battaglia_warlord');

    for (const achievementId of achievementsToCheck) {
        const notification = awardAchievement(userId, achievementId, displayName);
        if (notification) notifications.push(notification.text);
    }

    if (notifications.length && msg) {
        await msg.reply(`✨ PROGRESSI AGGIORNATI ✨\n\n${notifications.join('\n\n')}`);
    }
}

module.exports = {
    getAchievementInfo,
    getAllAchievements,
    getTodayMissionsForUser,
    getMissionBoardForUser,
    getProgressForUser,
    processGameProgress,
    awardAchievement
};
