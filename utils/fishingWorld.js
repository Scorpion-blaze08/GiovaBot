const { AREAS, RARITY_META, FISH_CATALOG } = require('./pescaData');

const WEATHER_TYPES = [
    { id: 'sereno', name: 'Sereno', emoji: '☀️', bonus: { common: 0.08, rare: 0.04 } },
    { id: 'vento', name: 'Vento', emoji: '💨', bonus: { uncommon: 0.12, rare: 0.08 } },
    { id: 'pioggia', name: 'Pioggia', emoji: '🌧️', bonus: { rare: 0.16, epic: 0.1 } },
    { id: 'nebbia', name: 'Nebbia', emoji: '🌫️', bonus: { epic: 0.14, legendary: 0.08 } },
    { id: 'tempesta', name: 'Tempesta', emoji: '⛈️', bonus: { legendary: 0.18, treasure: 0.12, junk: -0.2 } }
];

const TIDES = [
    { id: 'bassa', name: 'Bassa', emoji: '⬇️', bonus: { common: 0.08, junk: 0.05 } },
    { id: 'media', name: 'Media', emoji: '🌊', bonus: { uncommon: 0.06, rare: 0.06 } },
    { id: 'alta', name: 'Alta', emoji: '⬆️', bonus: { rare: 0.12, epic: 0.08 } }
];

const BOSS_POOL = [
    { id: 'kraken_re', name: 'Kraken Reale', emoji: '🦑', area: 'abisso', reward: 450, dropId: 'kraken_eye' },
    { id: 'hydra_mare', name: 'Idra Marina', emoji: '🐍', area: 'barriera', reward: 360, dropId: 'pearl_shell' },
    { id: 'leviatano_gelo', name: 'Leviatano del Gelo', emoji: '🐋', area: 'ghiacciaio', reward: 420, dropId: 'ice_core' }
];

const RECIPES = [
    {
        id: 'brodo_marino',
        name: 'Brodo Marino',
        emoji: '🍲',
        station: 'cucina',
        reward: { coins: 85 },
        ingredients: { anchovy: 2, sardine: 2 }
    },
    {
        id: 'sashimi_reale',
        name: 'Sashimi Reale',
        emoji: '🍣',
        station: 'cucina',
        reward: { coins: 170 },
        ingredients: { salmon: 1, sea_bream: 1 }
    },
    {
        id: 'perla_nera',
        name: 'Perla Nera',
        emoji: '🖤',
        station: 'mercato',
        reward: { coins: 330, bait: { glow: 1 } },
        ingredients: { pearl_shell: 1, moray: 1 }
    },
    {
        id: 'occhio_abissale',
        name: 'Occhio Abissale',
        emoji: '👁️',
        station: 'mercato',
        reward: { coins: 650, bait: { squid: 2 } },
        ingredients: { abyss_shark: 1, kraken_eye: 1 }
    }
];

function getDayKey() {
    return new Date().toISOString().slice(0, 10);
}

function seededIndex(seed, modulo) {
    return ((seed % modulo) + modulo) % modulo;
}

function buildSeed(day) {
    return day.split('-').reduce((sum, part, index) => sum + Number(part) * (index + 3), 0);
}

function getFishingWorldState(day = getDayKey()) {
    const seed = buildSeed(day);
    const areaStates = {};
    const areaIds = Object.keys(AREAS);

    areaIds.forEach((areaId, index) => {
        const weather = WEATHER_TYPES[seededIndex(seed + index * 7, WEATHER_TYPES.length)];
        const tide = TIDES[seededIndex(seed + index * 11, TIDES.length)];
        areaStates[areaId] = { weather, tide };
    });

    const today = new Date(`${day}T12:00:00`);
    const isWeekend = today.getDay() === 0 || today.getDay() === 6;
    const boss = isWeekend ? BOSS_POOL[seededIndex(seed, BOSS_POOL.length)] : null;

    return {
        day,
        isWeekend,
        areaStates,
        boss,
        recipes: RECIPES
    };
}

function applyWorldModifiers(fish, areaState) {
    let weight = 1;
    for (const [rarity, bonus] of Object.entries(areaState.weather.bonus)) {
        if (fish.rarity === rarity) weight *= 1 + bonus;
    }
    for (const [rarity, bonus] of Object.entries(areaState.tide.bonus)) {
        if (fish.rarity === rarity) weight *= 1 + bonus;
    }
    return weight;
}

function formatWorldLine(areaId, state) {
    return `${AREAS[areaId].name}: ${state.weather.emoji} ${state.weather.name} | ${state.tide.emoji} Marea ${state.tide.name}`;
}

function getRecipeById(id) {
    return RECIPES.find(recipe => recipe.id === id) || null;
}

function getBossDropFish(boss) {
    return FISH_CATALOG.find(fish => fish.id === boss.dropId) || null;
}

module.exports = {
    getFishingWorldState,
    applyWorldModifiers,
    formatWorldLine,
    getRecipeById,
    getBossDropFish,
    RECIPES,
    WEATHER_TYPES,
    TIDES,
    BOSS_POOL
};
