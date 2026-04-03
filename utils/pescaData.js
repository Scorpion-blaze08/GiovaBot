const RARITY_META = {
    junk: { label: 'Scarto', multiplier: 0.45 },
    common: { label: 'Comune', multiplier: 1 },
    uncommon: { label: 'Non comune', multiplier: 1.2 },
    rare: { label: 'Raro', multiplier: 1.6 },
    epic: { label: 'Epico', multiplier: 2.1 },
    legendary: { label: 'Leggendario', multiplier: 2.8 },
    treasure: { label: 'Tesoro', multiplier: 3.2 }
};

const AREAS = {
    porto: {
        id: 'porto',
        name: 'Porto',
        unlockPrice: 0,
        baseCooldown: 8000,
        description: 'Area base con catture veloci e pesci semplici.'
    },
    fiume: {
        id: 'fiume',
        name: 'Fiume',
        unlockPrice: 250,
        baseCooldown: 10000,
        description: 'Acqua dolce con pesci agili e una discreta varieta.'
    },
    lago: {
        id: 'lago',
        name: 'Lago Alpino',
        unlockPrice: 600,
        baseCooldown: 12000,
        description: 'Zona piu ricca, ma con tempi leggermente piu lunghi.'
    },
    barriera: {
        id: 'barriera',
        name: 'Barriera Corallina',
        unlockPrice: 1400,
        baseCooldown: 14000,
        description: 'Area tropicale con catture rare e pesci costosi.'
    },
    ghiacciaio: {
        id: 'ghiacciaio',
        name: 'Baia Glaciale',
        unlockPrice: 2600,
        baseCooldown: 16000,
        description: 'Pesca estrema con poche catture ma alto valore.'
    },
    abisso: {
        id: 'abisso',
        name: 'Abisso',
        unlockPrice: 3200,
        baseCooldown: 18000,
        description: 'Endgame della pesca: lunghi tempi, bottino enorme.'
    }
};

const RODS = {
    bamboo: {
        id: 'bamboo',
        name: 'Canna Bamboo',
        price: 0,
        cooldownMult: 1,
        rarityBoost: 0,
        doubleCatch: 0
    },
    spin: {
        id: 'spin',
        name: 'Canna Spin',
        price: 350,
        cooldownMult: 0.93,
        rarityBoost: 0.08,
        doubleCatch: 0.03
    },
    carbon: {
        id: 'carbon',
        name: 'Canna Carbon',
        price: 900,
        cooldownMult: 0.88,
        rarityBoost: 0.15,
        doubleCatch: 0.06
    },
    abyss: {
        id: 'abyss',
        name: 'Canna Abyss',
        price: 2200,
        cooldownMult: 0.8,
        rarityBoost: 0.28,
        doubleCatch: 0.1
    },
    titan: {
        id: 'titan',
        name: 'Canna Titan',
        price: 5000,
        cooldownMult: 0.72,
        rarityBoost: 0.4,
        doubleCatch: 0.14
    }
};

const BAITS = {
    none: {
        id: 'none',
        name: 'Nessuna',
        price: 0,
        focus: [],
        luck: 0,
        cooldownMult: 1
    },
    worm: {
        id: 'worm',
        name: 'Verme',
        price: 20,
        focus: ['common', 'uncommon'],
        luck: 0.03,
        cooldownMult: 0.98
    },
    shrimp: {
        id: 'shrimp',
        name: 'Gamberetto',
        price: 45,
        focus: ['rare'],
        luck: 0.06,
        cooldownMult: 1
    },
    squid: {
        id: 'squid',
        name: 'Calamaro',
        price: 80,
        focus: ['epic', 'legendary'],
        luck: 0.1,
        cooldownMult: 1.04
    },
    glow: {
        id: 'glow',
        name: 'Esca Glow',
        price: 130,
        focus: ['legendary', 'treasure'],
        luck: 0.14,
        cooldownMult: 1.08
    }
};

const FISH_CATALOG = [
    { id: 'boot', name: 'Stivale Rotto', area: 'porto', rarity: 'junk', price: 6, weight: 17 },
    { id: 'can', name: 'Lattina Arrugginita', area: 'porto', rarity: 'junk', price: 8, weight: 14 },
    { id: 'anchovy', name: 'Acciuga', area: 'porto', rarity: 'common', price: 14, weight: 18 },
    { id: 'sardine', name: 'Sardina', area: 'porto', rarity: 'common', price: 16, weight: 18 },
    { id: 'mackerel', name: 'Sgombro', area: 'porto', rarity: 'uncommon', price: 24, weight: 10 },
    { id: 'sea_bream', name: 'Orata', area: 'porto', rarity: 'rare', price: 42, weight: 5 },
    { id: 'octopus', name: 'Polpo Curioso', area: 'porto', rarity: 'epic', price: 78, weight: 2 },

    { id: 'minnow', name: 'Alborella', area: 'fiume', rarity: 'common', price: 18, weight: 18 },
    { id: 'chub', name: 'Cavedano', area: 'fiume', rarity: 'common', price: 21, weight: 17 },
    { id: 'perch', name: 'Persico', area: 'fiume', rarity: 'uncommon', price: 30, weight: 11 },
    { id: 'carp', name: 'Carpa Reale', area: 'fiume', rarity: 'rare', price: 48, weight: 6 },
    { id: 'pike', name: 'Luccio', area: 'fiume', rarity: 'epic', price: 95, weight: 2 },
    { id: 'gold_trout', name: 'Trota Dorata', area: 'fiume', rarity: 'legendary', price: 180, weight: 1 },

    { id: 'trout', name: 'Trota', area: 'lago', rarity: 'common', price: 22, weight: 17 },
    { id: 'whitefish', name: 'Coregone', area: 'lago', rarity: 'uncommon', price: 33, weight: 12 },
    { id: 'eel', name: 'Anguilla', area: 'lago', rarity: 'rare', price: 58, weight: 6 },
    { id: 'salmon', name: 'Salmone', area: 'lago', rarity: 'rare', price: 68, weight: 5 },
    { id: 'sturgeon', name: 'Storione', area: 'lago', rarity: 'epic', price: 120, weight: 2 },
    { id: 'moon_koi', name: 'Koi Lunare', area: 'lago', rarity: 'legendary', price: 230, weight: 1 },

    { id: 'clown', name: 'Pesce Pagliaccio', area: 'barriera', rarity: 'common', price: 26, weight: 15 },
    { id: 'surgeon', name: 'Pesce Chirurgo', area: 'barriera', rarity: 'uncommon', price: 39, weight: 11 },
    { id: 'parrot', name: 'Pesce Pappagallo', area: 'barriera', rarity: 'rare', price: 66, weight: 7 },
    { id: 'lionfish', name: 'Pesce Leone', area: 'barriera', rarity: 'rare', price: 75, weight: 6 },
    { id: 'moray', name: 'Murena', area: 'barriera', rarity: 'epic', price: 132, weight: 3 },
    { id: 'reef_shark', name: 'Squalo di Barriera', area: 'barriera', rarity: 'legendary', price: 260, weight: 1 },
    { id: 'pearl_shell', name: 'Conchiglia di Perla', area: 'barriera', rarity: 'treasure', price: 340, weight: 1 },

    { id: 'ice_shrimp', name: 'Gambero Gelido', area: 'ghiacciaio', rarity: 'common', price: 30, weight: 14 },
    { id: 'snow_cod', name: 'Merluzzo Artico', area: 'ghiacciaio', rarity: 'uncommon', price: 45, weight: 11 },
    { id: 'ice_eel', name: 'Anguilla di Ghiaccio', area: 'ghiacciaio', rarity: 'rare', price: 84, weight: 6 },
    { id: 'frost_salmon', name: 'Salmone Boreale', area: 'ghiacciaio', rarity: 'epic', price: 150, weight: 3 },
    { id: 'crystal_ray', name: 'Razza Cristallo', area: 'ghiacciaio', rarity: 'legendary', price: 290, weight: 1 },
    { id: 'ice_core', name: 'Frammento Glaciale', area: 'ghiacciaio', rarity: 'treasure', price: 390, weight: 1 },

    { id: 'lanternfish', name: 'Pesce Lanterna', area: 'abisso', rarity: 'common', price: 35, weight: 13 },
    { id: 'viperfish', name: 'Vipera Marina', area: 'abisso', rarity: 'uncommon', price: 55, weight: 10 },
    { id: 'angler', name: 'Rana Pescatrice', area: 'abisso', rarity: 'rare', price: 96, weight: 7 },
    { id: 'giant_squid', name: 'Calamaro Gigante', area: 'abisso', rarity: 'epic', price: 175, weight: 3 },
    { id: 'abyss_shark', name: 'Squalo Abissale', area: 'abisso', rarity: 'legendary', price: 320, weight: 1 },
    { id: 'kraken_eye', name: 'Occhio del Kraken', area: 'abisso', rarity: 'treasure', price: 480, weight: 1 },
    { id: 'void_serpent', name: 'Serpente del Vuoto', area: 'abisso', rarity: 'legendary', price: 420, weight: 1 }
];

function normalizeText(value) {
    return String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '');
}

function getFishById(id) {
    return FISH_CATALOG.find(fish => fish.id === id) || null;
}

function findFish(value) {
    const token = normalizeText(value);
    if (!token) return null;
    const exact = FISH_CATALOG.find(fish =>
        fish.id === value ||
        normalizeText(fish.name) === token ||
        normalizeText(fish.id) === token
    );
    if (exact) return exact;

    return FISH_CATALOG.find(fish =>
        normalizeText(fish.name).includes(token) ||
        normalizeText(fish.id).includes(token)
    ) || null;
}

function getAreaFish(areaId) {
    return FISH_CATALOG.filter(fish => fish.area === areaId);
}

function formatDuration(ms) {
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes <= 0) return `${seconds}s`;
    return `${minutes}m ${seconds}s`;
}

module.exports = {
    RARITY_META,
    AREAS,
    RODS,
    BAITS,
    FISH_CATALOG,
    normalizeText,
    getFishById,
    findFish,
    getAreaFish,
    formatDuration
};
