const { getSenderId } = require('../utils/identity');
const { getMissionBoardForUser } = require('../utils/progression');
const { section, joinBlocks } = require('../utils/messageStyle');

function renderMissionSection(blockTitle, block) {
    const lines = [
        `🗓️ Periodo: ${block.key}`,
        `✨ Tema: ${block.headline}`,
        ''
    ];

    for (const mission of block.missions) {
        const status = mission.completed ? '✅' : '🕒';
        const progress = Math.min(mission.progress, mission.target);
        lines.push(`${status} ${mission.emoji} ${mission.title}`);
        lines.push(`🎮 Gioco: ${mission.game} | 📈 Progresso: ${progress}/${mission.target} | 💰 Reward: ${mission.reward}`);
        if (mission.flavor) lines.push(`🤖 ${mission.flavor}`);
        lines.push('');
    }

    return section(blockTitle.toUpperCase(), lines).trim();
}

module.exports = {
    name: 'missioni',
    description: 'Mostra le missioni giornaliere, mensili e stagionali con ricompense',
    async execute(msg) {
        const sender = await getSenderId(msg);
        const board = await getMissionBoardForUser(sender);

        const response = joinBlocks([
            renderMissionSection('🎯 Missioni Giornaliere', board.daily),
            renderMissionSection('📅 Missioni Mensili', board.monthly),
            renderMissionSection('🌦️ Missioni Stagionali', board.seasonal),
            '💡 Le ricompense vengono accreditate automaticamente appena completi la missione.'
        ]);

        await msg.reply(response);
    }
};
