const fs = require('fs');
const path = require('path');
const { getSenderId, findMatchingKey } = require('../utils/identity');
const { getAllAchievements, getAchievementInfo, awardAchievement } = require('../utils/progression');

const FILE = path.join(__dirname, '..', 'data', 'achievements.json');

function readAchievements() {
    try {
        if (!fs.existsSync(FILE)) return {};
        return JSON.parse(fs.readFileSync(FILE, 'utf8'));
    } catch {
        return {};
    }
}

function getCategoryMap() {
    return {
        slot: '🎰 SLOT',
        pesca: '🎣 PESCA',
        dado: '🎲 DADO',
        blackjack: '🃏 BLACKJACK',
        roulette: '🔫 ROULETTE',
        cavalli: '🐎 CAVALLI',
        duello: '⚔️ COMBATTIMENTI',
        combattimenti: '⚔️ COMBATTIMENTI',
        speciali: '🏆 SPECIALI'
    };
}

module.exports = {
    name: 'achievements',
    description: 'Mostra achievement e ricompense sbloccate',
    async execute(msg) {
        const sender = await getSenderId(msg);
        const args = msg.body.trim().split(/\s+/).slice(1);
        const filter = (args[0] || '').toLowerCase();
        const allAchievements = getAllAchievements();
        const unlockedData = readAchievements();
        const unlockedKey = findMatchingKey(unlockedData, sender);
        const unlocked = unlockedKey ? unlockedData[unlockedKey] : {};
        const categoryMap = getCategoryMap();

        if (filter && !categoryMap[filter]) {
            await msg.reply('❌ Categoria non valida.\n\nUsa: .achievements [slot|pesca|dado|blackjack|roulette|cavalli|combattimenti|speciali]');
            return;
        }

        const groups = {};
        for (const [id, meta] of Object.entries(allAchievements)) {
            if (!groups[meta.category]) groups[meta.category] = [];
            groups[meta.category].push({ id, ...meta, unlocked: Boolean(unlocked[id]) });
        }

        const categories = filter ? [categoryMap[filter]] : Object.keys(groups);
        const totalUnlocked = Object.keys(unlocked).length;
        const totalAvailable = Object.keys(allAchievements).length;
        const lines = ['🏆 BACHECA ACHIEVEMENT 🏆', '', `Sbloccati: ${totalUnlocked}/${totalAvailable}`, ''];

        for (const category of categories) {
            const entries = (groups[category] || []).sort((a, b) => Number(b.unlocked) - Number(a.unlocked) || a.name.localeCompare(b.name));
            if (!entries.length) continue;
            lines.push(category);
            for (const entry of entries) {
                const status = entry.unlocked ? '✅' : '⬜';
                lines.push(`${status} ${entry.emoji} ${entry.name} | Ricompensa ${entry.reward}`);
            }
            lines.push('');
        }

        lines.push('💡 Gli achievement completati pagano automaticamente i crediti.');
        await msg.reply(lines.join('\n').trim());
    }
};

global.unlockAchievement = async function(userId, achievementId, msg) {
    const meta = getAchievementInfo(achievementId);
    if (!meta) return;
    const notification = awardAchievement(userId, achievementId, userId.split('@')[0]);
    if (notification && msg) {
        await msg.reply(`✨ ${notification.text}`);
    }
};
