const fs = require('fs');
const path = require('path');
const { aggiungiMonete, getSaldo } = require('../utils/economia');
const { aggiornaClassifica } = require('./classifica');
const { getSenderId, isAdmin, findMatchingKey } = require('../utils/identity');
const { getNomeCache } = require('../utils/nomi');
const { processGameProgress } = require('../utils/progression');
const {
    RARITY_META,
    AREAS,
    RODS,
    BAITS,
    FISH_CATALOG,
    getFishById,
    findFish,
    getAreaFish,
    formatDuration
} = require('../utils/pescaData');
const {
    getFishingWorldState,
    applyWorldModifiers,
    formatWorldLine,
    getRecipeById,
    getBossDropFish,
    RECIPES
} = require('../utils/fishingWorld');

const INVENTORY_FILE = path.join(__dirname, '..', 'data', 'inventario_pesca.json');
const COOLDOWN_FILE = path.join(__dirname, '..', 'data', 'cooldown_pesca.json');
const STREAK_FILE = path.join(__dirname, '..', 'data', 'streak_pesca.json');
const BOSS_FILE = path.join(__dirname, '..', 'data', 'boss_pesca.json');

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

function getPlayerName(userId) {
    return getNomeCache(userId) || userId.split('@')[0];
}

function getPlayerRecord(inventory, userId) {
    const matched = findMatchingKey(inventory, userId) || userId;
    const legacy = inventory[matched] || {};
    const looksLegacyFishInventory = legacy.pesci &&
        typeof legacy.pesci === 'object' &&
        Object.keys(legacy.pesci).some(key => /^\d+$/.test(key)) &&
        !legacy.profile;
    const baseName = legacy.nome || getPlayerName(userId);
    inventory[matched] = {
        nome: baseName,
        pesci: looksLegacyFishInventory ? {} : (typeof legacy.pesci === 'object' && legacy.pesci ? legacy.pesci : {}),
        statistiche: {
            pescate: legacy.statistiche?.pescate || 0,
            rarePlus: legacy.statistiche?.rarePlus || 0,
            leggendari: legacy.statistiche?.leggendari || 0,
            tesori: legacy.statistiche?.tesori || 0,
            venduti: legacy.statistiche?.venduti || 0,
            guadagni: legacy.statistiche?.guadagni || 0,
            craft: legacy.statistiche?.craft || 0,
            bossWin: legacy.statistiche?.bossWin || 0
        },
        profile: {
            area: legacy.profile?.area || 'porto',
            rod: legacy.profile?.rod || 'bamboo',
            equippedBait: legacy.profile?.equippedBait || 'none',
            ownedRods: Array.isArray(legacy.profile?.ownedRods) && legacy.profile.ownedRods.length ? legacy.profile.ownedRods : ['bamboo'],
            unlockedAreas: Array.isArray(legacy.profile?.unlockedAreas) && legacy.profile.unlockedAreas.length ? legacy.profile.unlockedAreas : ['porto']
        },
        baits: {
            worm: Number(legacy.baits?.worm || 0),
            shrimp: Number(legacy.baits?.shrimp || 0),
            squid: Number(legacy.baits?.squid || 0),
            glow: Number(legacy.baits?.glow || 0)
        }
    };

    const record = inventory[matched];
    record.nome = getPlayerName(userId);
    record.profile.ownedRods = [...new Set(record.profile.ownedRods.filter(id => RODS[id]))];
    if (!record.profile.ownedRods.includes('bamboo')) record.profile.ownedRods.unshift('bamboo');
    record.profile.unlockedAreas = [...new Set(record.profile.unlockedAreas.filter(id => AREAS[id]))];
    if (!record.profile.unlockedAreas.includes('porto')) record.profile.unlockedAreas.unshift('porto');
    if (!RODS[record.profile.rod]) record.profile.rod = 'bamboo';
    if (!record.profile.ownedRods.includes(record.profile.rod)) record.profile.rod = 'bamboo';
    if (!AREAS[record.profile.area]) record.profile.area = 'porto';
    if (!record.profile.unlockedAreas.includes(record.profile.area)) record.profile.area = 'porto';
    if (!BAITS[record.profile.equippedBait]) record.profile.equippedBait = 'none';
    return { key: matched, player: record };
}

function getStreakRecord(streaks, userId) {
    const matched = findMatchingKey(streaks, userId) || userId;
    streaks[matched] = {
        withoutRare: Number(streaks[matched]?.withoutRare || 0),
        withoutEpic: Number(streaks[matched]?.withoutEpic || 0),
        withoutLegendary: Number(streaks[matched]?.withoutLegendary || 0)
    };
    return { key: matched, streak: streaks[matched] };
}

function weightedPick(entries) {
    const totalWeight = entries.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * totalWeight;
    for (const item of entries) {
        roll -= item.weight;
        if (roll <= 0) return item.fish;
    }
    return entries[entries.length - 1].fish;
}

function getCooldownMs(player) {
    const area = AREAS[player.profile.area];
    const rod = RODS[player.profile.rod];
    const bait = BAITS[player.profile.equippedBait] || BAITS.none;
    return Math.max(3000, Math.round(area.baseCooldown * rod.cooldownMult * bait.cooldownMult));
}

function updateStreakAfterCatch(streak, fish) {
    const rarity = fish.rarity;
    const rareOrBetter = ['rare', 'epic', 'legendary', 'treasure'];
    const epicOrBetter = ['epic', 'legendary', 'treasure'];
    const legendaryOrBetter = ['legendary', 'treasure'];

    if (rareOrBetter.includes(rarity)) streak.withoutRare = 0;
    else streak.withoutRare += 1;

    if (epicOrBetter.includes(rarity)) streak.withoutEpic = 0;
    else streak.withoutEpic += 1;

    if (legendaryOrBetter.includes(rarity)) streak.withoutLegendary = 0;
    else streak.withoutLegendary += 1;
}

function rollCatch(player, streak) {
    const areaFish = getAreaFish(player.profile.area);
    const rod = RODS[player.profile.rod];
    const bait = BAITS[player.profile.equippedBait] || BAITS.none;
    const world = getFishingWorldState();
    const areaState = world.areaStates[player.profile.area];

    let pool = areaFish.map(fish => {
        let weight = fish.weight;
        weight *= applyWorldModifiers(fish, areaState);
        if (fish.rarity === 'junk') weight *= 1 - Math.min(0.45, rod.rarityBoost);
        if (['rare', 'epic', 'legendary', 'treasure'].includes(fish.rarity)) {
            weight *= 1 + rod.rarityBoost;
        }
        if (bait.focus.includes(fish.rarity)) weight *= 1.45;
        if (bait.focus.length && !bait.focus.includes(fish.rarity)) weight *= 0.96;
        weight *= 1 + bait.luck;

        if (streak.withoutRare >= 7 && ['rare', 'epic', 'legendary', 'treasure'].includes(fish.rarity)) weight *= 1.2;
        if (streak.withoutEpic >= 12 && ['epic', 'legendary', 'treasure'].includes(fish.rarity)) weight *= 1.35;
        if (streak.withoutLegendary >= 20 && ['legendary', 'treasure'].includes(fish.rarity)) weight *= 1.45;

        return { fish, weight };
    });

    if (streak.withoutRare >= 14) {
        pool = pool.filter(item => item.fish.rarity !== 'junk' && item.fish.rarity !== 'common');
    }
    if (streak.withoutEpic >= 22) {
        pool = pool.filter(item => !['junk', 'common', 'uncommon'].includes(item.fish.rarity));
    }
    if (streak.withoutLegendary >= 36) {
        pool = pool.filter(item => ['legendary', 'treasure'].includes(item.fish.rarity));
    }

    const firstCatch = weightedPick(pool);
    const doubleCatch = Math.random() < rod.doubleCatch;
    if (!doubleCatch) return [firstCatch];

    const bonusPool = pool.filter(item => item.fish.id !== firstCatch.id);
    if (bonusPool.length === 0) return [firstCatch];
    return [firstCatch, weightedPick(bonusPool)];
}

function consumeBait(player) {
    const baitId = player.profile.equippedBait;
    if (!baitId || baitId === 'none') return null;
    if ((player.baits[baitId] || 0) <= 0) {
        player.profile.equippedBait = 'none';
        return null;
    }
    player.baits[baitId] -= 1;
    if (player.baits[baitId] <= 0) player.profile.equippedBait = 'none';
    return baitId;
}

function addFish(player, fish) {
    player.pesci[fish.id] = (player.pesci[fish.id] || 0) + 1;
    player.statistiche.pescate += 1;
    if (['rare', 'epic', 'legendary', 'treasure'].includes(fish.rarity)) player.statistiche.rarePlus += 1;
    if (fish.rarity === 'legendary') player.statistiche.leggendari += 1;
    if (fish.rarity === 'treasure') player.statistiche.tesori += 1;
}

function formatCatchLine(fish) {
    return `${fish.name} | ${RARITY_META[fish.rarity].label} | ${fish.price} crediti`;
}

function getInventoryValue(player) {
    return Object.entries(player.pesci).reduce((sum, [fishId, quantity]) => {
        const fish = getFishById(fishId);
        return sum + ((fish?.price || 0) * quantity);
    }, 0);
}

function findOwnedFish(player, token) {
    const direct = getFishById(token);
    if (direct && (player.pesci[direct.id] || 0) > 0) return direct;
    const named = findFish(token);
    if (named && (player.pesci[named.id] || 0) > 0) return named;
    return null;
}

function parseTargetAndQuantity(parts, startIndex) {
    const raw = parts.slice(startIndex);
    if (!raw.length) return { target: '', quantity: 1 };
    const last = raw[raw.length - 1];
    if (/^\d+$/.test(last)) {
        return {
            target: raw.slice(0, -1).join(' '),
            quantity: Math.max(1, Number(last))
        };
    }
    return { target: raw.join(' '), quantity: 1 };
}

function getAreaStatus(player, areaId) {
    const unlocked = player.profile.unlockedAreas.includes(areaId);
    return unlocked ? 'sbloccata' : `blocco ${AREAS[areaId].unlockPrice}`;
}

async function replyHelp(msg) {
    const text = [
        '🎣 PESCA MEGA UPDATE 🎣',
        '',
        '.pesca',
        'Pesca nella tua area attuale.',
        '',
        '.pesca profilo',
        '.pesca aree',
        '.pesca meteo',
        '.pesca area [id]',
        '.pesca shop',
        '.pesca compra canna [id]',
        '.pesca compra esca [id] [quantita]',
        '.pesca compra area [id]',
        '.pesca canna [id]',
        '.pesca esca [id|none]',
        '.pesca inv',
        '.pesca collezione [area]',
        '.pesca craft',
        '.pesca craft [ricetta]',
        '.pesca boss',
        '.pesca boss sfida',
        '.pesca vendi tutto',
        '.pesca vendi [id|nome] [quantita]',
        '.pesca tempi'
    ].join('\n');
    await msg.reply(text);
}

module.exports = {
    name: 'pesca',
    description: 'Mega update pesca con aree, shop, canne, esche e collezione',
    async execute(msg) {
        const sender = await getSenderId(msg);
        const args = msg.body.trim().split(/\s+/).slice(1);
        const action = (args[0] || '').toLowerCase();

        const inventory = readJson(INVENTORY_FILE);
        const cooldowns = readJson(COOLDOWN_FILE);
        const streaks = readJson(STREAK_FILE);
        const { key: inventoryKey, player } = getPlayerRecord(inventory, sender);
        const { key: streakKey, streak } = getStreakRecord(streaks, sender);
        const playerName = getPlayerName(sender);
        const world = getFishingWorldState();

        if (!action || action === 'fish') {
            const cooldownMs = getCooldownMs(player);
            const lastFish = cooldowns[inventoryKey] || 0;
            const remaining = cooldownMs - (Date.now() - lastFish);

            if (remaining > 0) {
                await msg.reply(`Devi aspettare ancora ${formatDuration(remaining)} prima di pescare di nuovo.`);
                return;
            }

            cooldowns[inventoryKey] = Date.now();
            const baitUsed = consumeBait(player);
            const catches = rollCatch(player, streak);

            for (const fish of catches) {
                addFish(player, fish);
                updateStreakAfterCatch(streak, fish);
            }

            inventory[inventoryKey] = player;
            streaks[streakKey] = streak;
            writeJson(INVENTORY_FILE, inventory);
            writeJson(COOLDOWN_FILE, cooldowns);
            writeJson(STREAK_FILE, streaks);

            const lines = catches.map(formatCatchLine);
            const area = AREAS[player.profile.area];
            const rod = RODS[player.profile.rod];
            const areaState = world.areaStates[player.profile.area];
            const baitInfo = baitUsed ? `Esca consumata: ${BAITS[baitUsed].name}` : `Esca attiva: ${BAITS[player.profile.equippedBait].name}`;
            const streakInfo = `Pity raro ${streak.withoutRare}/14 | Pity epico ${streak.withoutEpic}/22 | Pity leggendario ${streak.withoutLegendary}/36`;
            const rareCaught = catches.filter(fish => ['rare', 'epic', 'legendary', 'treasure'].includes(fish.rarity)).length;
            const legendaryCaught = catches.filter(fish => fish.rarity === 'legendary').length;
            const treasures = catches.filter(fish => fish.rarity === 'treasure').length;

            await processGameProgress({
                userId: sender,
                game: 'pesca',
                displayName: playerName,
                msg,
                events: {
                    plays: 1,
                    wins: rareCaught > 0 ? 1 : 0,
                    losses: rareCaught > 0 ? 0 : 1,
                    profit: 0,
                    fishCaught: catches.length,
                    rareCaught,
                    legendaryCaught,
                    treasures
                }
            });

            await msg.reply([
                `🎣 PESCATA IN ${area.name.toUpperCase()} 🎣`,
                '',
                `🌦️ ${areaState.weather.emoji} ${areaState.weather.name} | ${areaState.tide.emoji} Marea ${areaState.tide.name}`,
                `🎏 Canna: ${rod.name}`,
                `🪱 ${baitInfo}`,
                '',
                ...lines,
                '',
                catches.length > 1 ? '✨ Bonus doppia cattura attivato.' : '🌊 Nessun bonus extra questa volta.',
                `📈 ${streakInfo}`
            ].join('\n'));
            return;
        }

        if (['help', 'aiuto'].includes(action)) {
            await replyHelp(msg);
            return;
        }

        if (['profilo', 'profile'].includes(action)) {
            const area = AREAS[player.profile.area];
            const rod = RODS[player.profile.rod];
            const bait = BAITS[player.profile.equippedBait];
            const fishOwned = Object.values(player.pesci).reduce((sum, qty) => sum + qty, 0);
            const totalValue = getInventoryValue(player);
            const cooldownMs = getCooldownMs(player);

            await msg.reply([
                `🎣 PROFILO PESCA DI ${playerName} 🎣`,
                '',
                `📍 Area: ${area.name}`,
                `🎏 Canna: ${rod.name}`,
                `🪱 Esca equipaggiata: ${bait.name}`,
                `🎒 Inventario: ${fishOwned} catture`,
                `💰 Valore inventario: ${totalValue} crediti`,
                `⏱️ Cooldown attuale: ${formatDuration(cooldownMs)}`,
                '',
                `🎯 Pescate totali: ${player.statistiche.pescate}`,
                `✨ Rare o meglio: ${player.statistiche.rarePlus}`,
                `🐉 Leggendari: ${player.statistiche.leggendari}`,
                `💎 Tesori: ${player.statistiche.tesori}`,
                `🍽️ Craft completati: ${player.statistiche.craft}`,
                `👑 Boss sconfitti: ${player.statistiche.bossWin}`,
                `📦 Venduti: ${player.statistiche.venduti}`,
                `💸 Guadagni dalla pesca: ${player.statistiche.guadagni}`
            ].join('\n'));
            return;
        }

        if (['shop', 'negozio', 'mercato'].includes(action)) {
            const lines = ['NEGOZIO PESCA', '', 'Canne:'];
            for (const rod of Object.values(RODS)) {
                lines.push(`${rod.id} - ${rod.name} | ${rod.price} crediti | cooldown x${rod.cooldownMult}`);
            }
            lines.push('', 'Esche:');
            for (const bait of Object.values(BAITS).filter(item => item.id !== 'none')) {
                lines.push(`${bait.id} - ${bait.name} | ${bait.price} crediti | focus ${bait.focus.join(', ')}`);
            }
            lines.push('', 'Aree:');
            for (const area of Object.values(AREAS)) {
                lines.push(`${area.id} - ${area.name} | ${area.unlockPrice} crediti | ${area.description}`);
            }
            await msg.reply(lines.join('\n'));
            return;
        }

        if (['meteo', 'marea'].includes(action)) {
            const lines = ['🌦️ BOLLETTINO PESCA DEL GIORNO 🌦️', ''];
            for (const areaId of Object.keys(AREAS)) {
                lines.push(`• ${formatWorldLine(areaId, world.areaStates[areaId])}`);
            }
            if (world.boss) {
                lines.push('');
                lines.push(`👑 Boss weekend attivo: ${world.boss.emoji} ${world.boss.name} in ${AREAS[world.boss.area].name}`);
            }
            await msg.reply(lines.join('\n'));
            return;
        }

        if (['aree', 'zone'].includes(action)) {
            const lines = ['AREE DISPONIBILI', ''];
            for (const area of Object.values(AREAS)) {
                lines.push(`${area.id} - ${area.name}`);
                lines.push(`${area.description}`);
                lines.push(`Cooldown base: ${formatDuration(area.baseCooldown)} | Stato: ${getAreaStatus(player, area.id)}`);
                lines.push('');
            }
            await msg.reply(lines.join('\n').trim());
            return;
        }

        if (action === 'area') {
            const areaId = (args[1] || '').toLowerCase();
            if (!AREAS[areaId]) {
                await msg.reply('Area non valida. Usa .pesca aree per vedere quelle disponibili.');
                return;
            }
            if (!player.profile.unlockedAreas.includes(areaId)) {
                await msg.reply(`Non hai ancora sbloccato ${AREAS[areaId].name}. Prezzo: ${AREAS[areaId].unlockPrice} crediti.`);
                return;
            }
            player.profile.area = areaId;
            inventory[inventoryKey] = player;
            writeJson(INVENTORY_FILE, inventory);
            await msg.reply(`Area selezionata: ${AREAS[areaId].name}.`);
            return;
        }

        if (action === 'compra') {
            const category = (args[1] || '').toLowerCase();
            const targetId = (args[2] || '').toLowerCase();
            const quantity = Math.max(1, Number(args[3] || 1));

            if (category === 'canna') {
                const rod = RODS[targetId];
                if (!rod) {
                    await msg.reply('Canna non valida.');
                    return;
                }
                if (player.profile.ownedRods.includes(rod.id)) {
                    await msg.reply('Hai gia questa canna.');
                    return;
                }
                if (getSaldo(sender) < rod.price) {
                    await msg.reply(`Ti servono ${rod.price} crediti per comprare ${rod.name}.`);
                    return;
                }
                aggiungiMonete(sender, -rod.price, playerName);
                aggiornaClassifica(sender, -rod.price, false, 'pesca', playerName);
                player.profile.ownedRods.push(rod.id);
                inventory[inventoryKey] = player;
                writeJson(INVENTORY_FILE, inventory);
                await msg.reply(`Hai comprato ${rod.name} per ${rod.price} crediti.`);
                return;
            }

            if (category === 'esca') {
                const bait = BAITS[targetId];
                if (!bait || bait.id === 'none') {
                    await msg.reply('Esca non valida.');
                    return;
                }
                const cost = bait.price * quantity;
                if (getSaldo(sender) < cost) {
                    await msg.reply(`Ti servono ${cost} crediti per questa spesa.`);
                    return;
                }
                aggiungiMonete(sender, -cost, playerName);
                aggiornaClassifica(sender, -cost, false, 'pesca', playerName);
                player.baits[bait.id] = (player.baits[bait.id] || 0) + quantity;
                inventory[inventoryKey] = player;
                writeJson(INVENTORY_FILE, inventory);
                await msg.reply(`Hai comprato ${quantity}x ${bait.name} per ${cost} crediti.`);
                return;
            }

            if (category === 'area') {
                const area = AREAS[targetId];
                if (!area) {
                    await msg.reply('Area non valida.');
                    return;
                }
                if (player.profile.unlockedAreas.includes(area.id)) {
                    await msg.reply('Hai gia sbloccato questa area.');
                    return;
                }
                if (getSaldo(sender) < area.unlockPrice) {
                    await msg.reply(`Ti servono ${area.unlockPrice} crediti per sbloccare ${area.name}.`);
                    return;
                }
                aggiungiMonete(sender, -area.unlockPrice, playerName);
                aggiornaClassifica(sender, -area.unlockPrice, false, 'pesca', playerName);
                player.profile.unlockedAreas.push(area.id);
                inventory[inventoryKey] = player;
                writeJson(INVENTORY_FILE, inventory);
                await msg.reply(`Hai sbloccato ${area.name}. Usa .pesca area ${area.id} per andarci.`);
                return;
            }

            await msg.reply('Uso: .pesca compra canna|esca|area ...');
            return;
        }

        if (action === 'canna') {
            const rodId = (args[1] || '').toLowerCase();
            if (!RODS[rodId]) {
                await msg.reply('Canna non valida.');
                return;
            }
            if (!player.profile.ownedRods.includes(rodId)) {
                await msg.reply('Non possiedi questa canna.');
                return;
            }
            player.profile.rod = rodId;
            inventory[inventoryKey] = player;
            writeJson(INVENTORY_FILE, inventory);
            await msg.reply(`Canna equipaggiata: ${RODS[rodId].name}.`);
            return;
        }

        if (action === 'esca') {
            const baitId = (args[1] || '').toLowerCase();
            if (baitId === 'none') {
                player.profile.equippedBait = 'none';
                inventory[inventoryKey] = player;
                writeJson(INVENTORY_FILE, inventory);
                await msg.reply('Esca rimossa.');
                return;
            }
            if (!BAITS[baitId] || baitId === 'none') {
                await msg.reply('Esca non valida.');
                return;
            }
            if ((player.baits[baitId] || 0) <= 0) {
                await msg.reply('Non hai questa esca in inventario.');
                return;
            }
            player.profile.equippedBait = baitId;
            inventory[inventoryKey] = player;
            writeJson(INVENTORY_FILE, inventory);
            await msg.reply(`Esca equipaggiata: ${BAITS[baitId].name}.`);
            return;
        }

        if (['inv', 'inventario'].includes(action)) {
            const ownedFish = Object.entries(player.pesci)
                .filter(([, qty]) => qty > 0)
                .map(([fishId, qty]) => ({ fish: getFishById(fishId), qty }))
                .filter(entry => entry.fish)
                .sort((a, b) => b.fish.price - a.fish.price);

            if (ownedFish.length === 0) {
                await msg.reply('Inventario pesca vuoto. Inizia con .pesca');
                return;
            }

            const lines = ['INVENTARIO PESCA', ''];
            for (const entry of ownedFish.slice(0, 20)) {
                lines.push(`${entry.fish.name} x${entry.qty} | ${entry.fish.price} crediti | ${AREAS[entry.fish.area].name}`);
            }
            if (ownedFish.length > 20) lines.push('', `Altri ${ownedFish.length - 20} oggetti non mostrati.`);
            lines.push('', `Valore totale: ${getInventoryValue(player)} crediti`);
            lines.push(`Esche: verme ${player.baits.worm}, gamberetto ${player.baits.shrimp}, calamaro ${player.baits.squid}, glow ${player.baits.glow}`);
            await msg.reply(lines.join('\n'));
            return;
        }

        if (action === 'craft') {
            if (!args[1]) {
                const lines = ['🍳 CRAFTING PESCA 🍳', ''];
                for (const recipe of RECIPES) {
                    const ingredients = Object.entries(recipe.ingredients)
                        .map(([fishId, qty]) => {
                            const fish = getFishById(fishId);
                            return `${qty}x ${fish ? fish.name : fishId}`;
                        })
                        .join(', ');
                    const reward = [`${recipe.reward.coins} crediti`]
                        .concat(recipe.reward.bait ? Object.entries(recipe.reward.bait).map(([baitId, qty]) => `${qty}x ${BAITS[baitId].name}`) : [])
                        .join(' + ');
                    lines.push(`${recipe.emoji} ${recipe.id} | ${recipe.station}`);
                    lines.push(`Ingredienti: ${ingredients}`);
                    lines.push(`Ricompensa: ${reward}`);
                    lines.push('');
                }
                await msg.reply(lines.join('\n').trim());
                return;
            }

            const recipe = getRecipeById((args[1] || '').toLowerCase());
            if (!recipe) {
                await msg.reply('Ricetta non valida. Usa .pesca craft per vedere la lista.');
                return;
            }

            for (const [fishId, qty] of Object.entries(recipe.ingredients)) {
                if ((player.pesci[fishId] || 0) < qty) {
                    const fish = getFishById(fishId);
                    await msg.reply(`Ti mancano ${qty}x ${fish ? fish.name : fishId} per creare ${recipe.name}.`);
                    return;
                }
            }

            for (const [fishId, qty] of Object.entries(recipe.ingredients)) {
                player.pesci[fishId] -= qty;
            }

            player.statistiche.craft += 1;
            player.statistiche.guadagni += recipe.reward.coins;
            if (recipe.reward.bait) {
                for (const [baitId, qty] of Object.entries(recipe.reward.bait)) {
                    player.baits[baitId] = (player.baits[baitId] || 0) + qty;
                }
            }

            inventory[inventoryKey] = player;
            writeJson(INVENTORY_FILE, inventory);
            aggiungiMonete(sender, recipe.reward.coins, playerName);
            aggiornaClassifica(sender, recipe.reward.coins, true, 'pesca', playerName);
            await processGameProgress({
                userId: sender,
                game: 'pesca',
                displayName: playerName,
                msg,
                events: {
                    wins: 1,
                    profit: recipe.reward.coins,
                    crafted: 1
                }
            });

            const rewardText = [`💰 +${recipe.reward.coins} crediti`]
                .concat(recipe.reward.bait ? Object.entries(recipe.reward.bait).map(([baitId, qty]) => `🪱 +${qty} ${BAITS[baitId].name}`) : [])
                .join('\n');
            await msg.reply(`🍽️ Craft riuscito: ${recipe.emoji} ${recipe.name}\n\n${rewardText}`);
            return;
        }

        if (action === 'boss') {
            if (!world.boss) {
                await msg.reply('🌊 Nessun boss marino attivo oggi. Torna nel weekend.');
                return;
            }

            const bossState = readJson(BOSS_FILE, {});
            const bossKey = findMatchingKey(bossState, sender) || sender;
            if (!bossState[bossKey]) bossState[bossKey] = { day: '', attempts: 0, wins: 0 };
            if (bossState[bossKey].day !== world.day) bossState[bossKey] = { day: world.day, attempts: 0, wins: 0 };

            if (args[1] !== 'sfida') {
                const drop = getBossDropFish(world.boss);
                await msg.reply([
                    `👑 BOSS MARINO DEL WEEKEND 👑`,
                    '',
                    `${world.boss.emoji} ${world.boss.name}`,
                    `📍 Zona: ${AREAS[world.boss.area].name}`,
                    `💰 Ricompensa base: ${world.boss.reward} crediti`,
                    `💎 Drop esclusivo: ${drop ? drop.name : world.boss.dropId}`,
                    `🎟️ Tentativi oggi: ${bossState[bossKey].attempts}/1`,
                    '',
                    'Usa .pesca boss sfida per provarci.'
                ].join('\n'));
                return;
            }

            if (bossState[bossKey].attempts >= 1) {
                await msg.reply('⛔ Hai gia affrontato il boss oggi. Torna domani o il prossimo weekend.');
                return;
            }

            bossState[bossKey].attempts += 1;
            const power = Math.random() + (RODS[player.profile.rod].rarityBoost || 0) + ((BAITS[player.profile.equippedBait]?.luck) || 0);
            const success = power >= 0.95;
            const drop = getBossDropFish(world.boss);

            if (!success) {
                writeJson(BOSS_FILE, bossState);
                await processGameProgress({
                    userId: sender,
                    game: 'pesca',
                    displayName: playerName,
                    msg,
                    events: {
                        plays: 1,
                        losses: 1
                    }
                });
                await msg.reply(`🌪️ Il boss ${world.boss.name} ti ha respinto. Nessun bottino questa volta.`);
                return;
            }

            bossState[bossKey].wins += 1;
            player.statistiche.bossWin += 1;
            if (drop) addFish(player, drop);
            inventory[inventoryKey] = player;
            writeJson(INVENTORY_FILE, inventory);
            writeJson(BOSS_FILE, bossState);
            aggiungiMonete(sender, world.boss.reward, playerName);
            aggiornaClassifica(sender, world.boss.reward, true, 'pesca', playerName);
            await processGameProgress({
                userId: sender,
                game: 'pesca',
                displayName: playerName,
                msg,
                events: {
                    plays: 1,
                    wins: 1,
                    profit: world.boss.reward,
                    bossWins: 1,
                    legendaryCaught: drop && drop.rarity === 'legendary' ? 1 : 0,
                    treasures: drop && drop.rarity === 'treasure' ? 1 : 0
                }
            });
            await msg.reply([
                '👑 BOSS SCONFITTO! 👑',
                '',
                `${world.boss.emoji} Hai battuto ${world.boss.name}`,
                `💰 +${world.boss.reward} crediti`,
                drop ? `🎁 Drop ottenuto: ${drop.name}` : '🎁 Nessun drop speciale',
                '🌊 Il mare oggi ti ha scelto.'
            ].join('\n'));
            return;
        }

        if (action === 'collezione') {
            const areaId = (args[1] || '').toLowerCase();
            const fishList = areaId && AREAS[areaId] ? getAreaFish(areaId) : FISH_CATALOG;
            const title = areaId && AREAS[areaId] ? `COLLEZIONE ${AREAS[areaId].name.toUpperCase()}` : 'COLLEZIONE COMPLETA';
            const ownedCount = fishList.filter(fish => (player.pesci[fish.id] || 0) > 0).length;
            const lines = [title, '', `Scoperti ${ownedCount}/${fishList.length}`, ''];

            for (const fish of fishList) {
                const owned = player.pesci[fish.id] || 0;
                lines.push(`${owned > 0 ? '[OK]' : '[--]'} ${fish.name} | ${RARITY_META[fish.rarity].label} | ${fish.price}`);
            }
            await msg.reply(lines.join('\n'));
            return;
        }

        if (action === 'tempi') {
            const area = AREAS[player.profile.area];
            const rod = RODS[player.profile.rod];
            const bait = BAITS[player.profile.equippedBait];
            const cooldownMs = getCooldownMs(player);
            const lastFish = cooldowns[inventoryKey] || 0;
            const remaining = cooldownMs - (Date.now() - lastFish);

            await msg.reply([
                'TEMPI DI PESCA',
                '',
                `Area: ${area.name} (${formatDuration(area.baseCooldown)})`,
                `Canna: ${rod.name} (x${rod.cooldownMult})`,
                `Esca: ${bait.name} (x${bait.cooldownMult})`,
                `Cooldown finale: ${formatDuration(cooldownMs)}`,
                `Disponibile tra: ${remaining > 0 ? formatDuration(remaining) : 'subito'}`
            ].join('\n'));
            return;
        }

        if (action === 'vendi') {
            const parsedSale = parseTargetAndQuantity(args, 1);
            const target = parsedSale.target.toLowerCase();
            if (!target) {
                await msg.reply('Uso: .pesca vendi tutto oppure .pesca vendi [id|nome] [quantita]');
                return;
            }

            if (target === 'tutto' || target === 'all') {
                const entries = Object.entries(player.pesci).filter(([, qty]) => qty > 0);
                if (entries.length === 0) {
                    await msg.reply('Non hai nulla da vendere.');
                    return;
                }
                let total = 0;
                let sold = 0;
                for (const [fishId, qty] of entries) {
                    const fish = getFishById(fishId);
                    if (!fish) continue;
                    total += fish.price * qty;
                    sold += qty;
                    player.pesci[fishId] = 0;
                }
                player.statistiche.venduti += sold;
                player.statistiche.guadagni += total;
                inventory[inventoryKey] = player;
                writeJson(INVENTORY_FILE, inventory);
                aggiungiMonete(sender, total, playerName);
                aggiornaClassifica(sender, total, true, 'pesca', playerName);
                await processGameProgress({
                    userId: sender,
                    game: 'pesca',
                    displayName: playerName,
                    msg,
                    events: {
                        wins: 1,
                        profit: total
                    }
                });
                await msg.reply(`Hai venduto tutto il pescato per ${total} crediti.`);
                return;
            }

            const fish = findOwnedFish(player, target);
            if (!fish) {
                await msg.reply('Non hai questo pesce in inventario.');
                return;
            }
            const requestedQty = parsedSale.quantity;
            const available = player.pesci[fish.id] || 0;
            const qty = Math.min(requestedQty, available);
            const total = fish.price * qty;

            player.pesci[fish.id] -= qty;
            player.statistiche.venduti += qty;
            player.statistiche.guadagni += total;
            inventory[inventoryKey] = player;
            writeJson(INVENTORY_FILE, inventory);
            aggiungiMonete(sender, total, playerName);
            aggiornaClassifica(sender, total, true, 'pesca', playerName);
            await processGameProgress({
                userId: sender,
                game: 'pesca',
                displayName: playerName,
                msg,
                events: {
                    wins: 1,
                    profit: total
                }
            });
            await msg.reply(`Hai venduto ${qty}x ${fish.name} per ${total} crediti.`);
            return;
        }

        if (action === 'leggendaria' && isAdmin(sender)) {
            const legendaryPool = FISH_CATALOG.filter(fish => ['legendary', 'treasure'].includes(fish.rarity));
            const fish = legendaryPool[Math.floor(Math.random() * legendaryPool.length)];
            addFish(player, fish);
            inventory[inventoryKey] = player;
            writeJson(INVENTORY_FILE, inventory);
            await msg.reply(`Spawn admin riuscito: ${fish.name} aggiunto all'inventario.`);
            return;
        }

        if (action === 'ruba' && isAdmin(sender)) {
            const mentions = await msg.getMentions();
            if (!mentions.length || !args[2]) {
                await msg.reply('Uso: .pesca ruba @utente [id|nome] [quantita]');
                return;
            }

            const targetId = mentions[0].id._serialized;
            const parsedSteal = parseTargetAndQuantity(args, 2);
            const targetInventory = readJson(INVENTORY_FILE);
            const { key: targetKey, player: targetPlayer } = getPlayerRecord(targetInventory, targetId);
            const fish = findOwnedFish(targetPlayer, parsedSteal.target);

            if (!fish) {
                await msg.reply('Il bersaglio non possiede questo pesce.');
                return;
            }

            const amount = Math.min(parsedSteal.quantity, targetPlayer.pesci[fish.id] || 0);
            targetPlayer.pesci[fish.id] -= amount;
            player.pesci[fish.id] = (player.pesci[fish.id] || 0) + amount;
            targetInventory[targetKey] = targetPlayer;
            targetInventory[inventoryKey] = player;
            writeJson(INVENTORY_FILE, targetInventory);
            await msg.reply(`Hai trasferito ${amount}x ${fish.name} dal bersaglio al tuo inventario.`);
            return;
        }

        await replyHelp(msg);
    }
};
