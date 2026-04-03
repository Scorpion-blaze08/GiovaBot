const fs = require('fs');
const path = require('path');
const { aggiungiMonete } = require('./economia');
const { findMatchingKey } = require('./identity');

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
    pesca_chef: { name: 'Chef del Porto', emoji: '🍽️', category: '🎣 PESCA', reward: 100 }
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
        { id: 'blackjack_wins', title: 'Banco Battuto', emoji: '🃏', game: 'blackjack', metric: 'wins', target: 2, reward: 110 }
        ,
        { id: 'roulette_runs', title: 'Tavolo del Coraggio', emoji: '🔫', game: 'roulette', metric: 'plays', target: 2, reward: 120 }
    ],
    arena: [
        { id: 'horse_runs', title: 'Tribuna in Festa', emoji: '🐎', game: 'cavalli', metric: 'plays', target: 3, reward: 95 },
        { id: 'duel_win', title: 'Gloria nell Arena', emoji: '⚔️', game: 'duello', metric: 'wins', target: 1, reward: 150 }
    ],
    general: [
        { id: 'profit_push', title: 'Cassa Positiva', emoji: '💰', game: 'all', metric: 'profit', target: 160, reward: 130 }
    ]
};

function readJson(filePath, fallback = {}) {
    try {
        if (!fs.existsSync(filePath)) return fallback;
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
        return fallback;
    }
}

function writeJson(filePath, data) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function getTodayKey() {
    return new Date().toISOString().slice(0, 10);
}

function seedFromDay(day) {
    return day.split('-').reduce((sum, part) => sum + Number(part), 0);
}

function pickFromPool(pool, seed, offset) {
    return pool[(seed + offset) % pool.length];
}

function buildDailyMissions(day) {
    const seed = seedFromDay(day);
    const weekday = new Date(`${day}T12:00:00`).getDay();
    const isWeekend = weekday === 0 || weekday === 6;

    const missions = [
        pickFromPool(DAILY_POOLS.pesca.filter(item => !item.weekendOnly), seed, 1),
        pickFromPool(DAILY_POOLS.casino, seed, 2),
        pickFromPool(DAILY_POOLS.arena, seed, 3),
        pickFromPool(DAILY_POOLS.general, seed, 0)
    ];

    if (isWeekend) {
        missions.push(DAILY_POOLS.pesca.find(item => item.id === 'fish_boss'));
    }

    return missions.map(mission => ({ ...mission }));
}

function ensureProgressRecord(userId) {
    const progression = readJson(PROGRESSION_FILE);
    const key = findMatchingKey(progression, userId) || userId;
    if (!progression[key]) progression[key] = { total: { plays: 0, wins: 0, losses: 0, profit: 0 }, games: {} };
    writeJson(PROGRESSION_FILE, progression);
    return { data: progression, key, record: progression[key] };
}

function ensureMissionState() {
    const state = readJson(MISSIONS_FILE, {});
    const today = getTodayKey();
    if (state.date !== today || !Array.isArray(state.missions)) {
        const missions = buildDailyMissions(today);
        const nextState = { date: today, missions, users: {} };
        writeJson(MISSIONS_FILE, nextState);
        return nextState;
    }
    if (!state.users || typeof state.users !== 'object') state.users = {};
    return state;
}

function getMissionProgressRecord(state, userId) {
    const key = findMatchingKey(state.users, userId) || userId;
    if (!state.users[key]) state.users[key] = { progress: {}, claimed: {} };
    return { key, record: state.users[key] };
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

function recordMissionProgress(userId, displayName, game, events) {
    const state = ensureMissionState();
    const { key, record } = getMissionProgressRecord(state, userId);
    const notifications = [];

    for (const mission of state.missions) {
        if (mission.game !== 'all' && mission.game !== game) continue;

        const incrementRaw = Number(events[mission.metric] || 0);
        const increment = mission.metric === 'profit' ? Math.max(0, incrementRaw) : incrementRaw;
        if (increment <= 0) continue;

        record.progress[mission.id] = (record.progress[mission.id] || 0) + increment;
        if (!record.claimed[mission.id] && record.progress[mission.id] >= mission.target) {
            record.claimed[mission.id] = true;
            aggiungiMonete(userId, mission.reward, displayName);
            notifications.push(`🎯 Missione completata: ${mission.emoji} ${mission.title}\n💰 Ricompensa: +${mission.reward} crediti`);
        }
    }

    state.users[key] = record;
    writeJson(MISSIONS_FILE, state);
    return notifications;
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

function getTodayMissionsForUser(userId) {
    const state = ensureMissionState();
    const userKey = findMatchingKey(state.users, userId);
    const userRecord = userKey ? state.users[userKey] : { progress: {}, claimed: {} };
    return {
        date: state.date,
        missions: state.missions.map(mission => ({
            ...mission,
            progress: userRecord.progress?.[mission.id] || 0,
            completed: Boolean(userRecord.claimed?.[mission.id])
        }))
    };
}

async function processGameProgress({ userId, game, displayName, msg, events = {}, flags = [], streak = 0 }) {
    updateProgressStats(userId, game, events);
    const notifications = recordMissionProgress(userId, displayName, game, events);
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
    getProgressForUser,
    processGameProgress,
    awardAchievement
};
