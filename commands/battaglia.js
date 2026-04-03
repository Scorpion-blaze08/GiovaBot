const path = require('path');
const { getSenderId, isAdmin } = require('../utils/identity');
const { getNomeCache } = require('../utils/nomi');
const { aggiungiMonete } = require('../utils/economia');
const { aggiornaClassifica } = require('./classifica');
const { processGameProgress } = require('../utils/progression');
const { readJson, writeJson } = require('../utils/jsonStore');

const FILE = path.join(__dirname, '..', 'data', 'battaglie.json');

function getName(userId) {
    return getNomeCache(userId) || userId.split('@')[0];
}

function ensureState(data) {
    if (!data.factions) data.factions = {};
    if (!data.players) data.players = {};
    if (!data.wars) data.wars = {};
    return data;
}

function getActiveWar(data, factionName) {
    return Object.values(data.wars).find(war =>
        war.state === 'active' && (war.faction1 === factionName || war.faction2 === factionName)
    ) || null;
}

module.exports = {
    name: 'battaglia',
    description: 'Fazioni e guerre di gruppo in stile strategico',
    async execute(msg) {
        const args = msg.body.trim().split(/\s+/).slice(1);
        const sender = await getSenderId(msg);
        const data = ensureState(readJson(FILE, {}));
        const player = data.players[sender];

        if (!args.length) {
            await msg.reply([
                '⚔️ BATTAGLIA - GUIDA',
                '',
                '🏰 Fazioni',
                '• .battaglia crea [nome]',
                '• .battaglia unisciti [nome]',
                '• .battaglia lascia',
                '• .battaglia fazioni',
                '',
                '⚔️ Guerra',
                '• .battaglia sfida [fazione]',
                '• .battaglia accetta',
                '• .battaglia attacca',
                '• .battaglia stato',
                '• .battaglia resa'
            ].join('\n'));
            return;
        }

        if (args[0] === 'crea') {
            const name = args.slice(1).join(' ').trim();
            if (!name) {
                await msg.reply('❌ Uso: .battaglia crea [nome]');
                return;
            }
            if (player) {
                await msg.reply('❌ Sei già dentro una fazione.');
                return;
            }
            const key = name.toLowerCase();
            if (data.factions[key]) {
                await msg.reply('❌ Esiste già una fazione con questo nome.');
                return;
            }
            data.factions[key] = {
                name,
                leader: sender,
                members: [sender],
                wins: 0,
                losses: 0,
                credits: 0
            };
            data.players[sender] = { faction: key, role: 'leader', attacks: 0 };
            writeJson(FILE, data);
            await msg.reply(`🏰 Fazione creata: ${name}\n\n👑 Leader: ${getName(sender)}\n👥 Membri: 1/10`);
            return;
        }

        if (args[0] === 'unisciti') {
            const key = args.slice(1).join(' ').trim().toLowerCase();
            if (!key) {
                await msg.reply('❌ Uso: .battaglia unisciti [nome]');
                return;
            }
            if (player) {
                await msg.reply('❌ Sei già in una fazione.');
                return;
            }
            const faction = data.factions[key];
            if (!faction) {
                await msg.reply('❌ Fazione non trovata.');
                return;
            }
            if (faction.members.length >= 10) {
                await msg.reply('❌ Fazione piena.');
                return;
            }
            faction.members.push(sender);
            data.players[sender] = { faction: key, role: 'member', attacks: 0 };
            writeJson(FILE, data);
            await msg.reply(`✅ Ti sei unito a ${faction.name}.\n\n👥 Membri attuali: ${faction.members.length}/10`);
            return;
        }

        if (args[0] === 'lascia') {
            if (!player) {
                await msg.reply('❌ Non fai parte di nessuna fazione.');
                return;
            }
            const faction = data.factions[player.faction];
            if (player.role === 'leader' && faction.members.length > 1) {
                await msg.reply('❌ Prima devi passare o liberare la leadership.');
                return;
            }
            faction.members = faction.members.filter(member => member !== sender);
            delete data.players[sender];
            if (!faction.members.length) {
                delete data.factions[player.faction];
            }
            writeJson(FILE, data);
            await msg.reply(`👋 Hai lasciato la fazione ${faction.name}.`);
            return;
        }

        if (args[0] === 'fazioni') {
            const factions = Object.values(data.factions).sort((a, b) => b.credits - a.credits);
            if (!factions.length) {
                await msg.reply('📭 Nessuna fazione creata per ora.');
                return;
            }
            const lines = ['🏰 FAZIONI ATTIVE', ''];
            factions.forEach((faction, index) => {
                lines.push(`${index + 1}. ${faction.name}`);
                lines.push(`👥 Membri: ${faction.members.length} | 🏆 Record: ${faction.wins}-${faction.losses} | 💰 Crediti fazione: ${faction.credits}`);
                lines.push('');
            });
            await msg.reply(lines.join('\n').trim());
            return;
        }

        if (args[0] === 'sfida') {
            if (!player || player.role !== 'leader') {
                await msg.reply('❌ Solo i leader possono lanciare una guerra.');
                return;
            }
            const targetKey = args.slice(1).join(' ').trim().toLowerCase();
            if (!targetKey) {
                await msg.reply('❌ Uso: .battaglia sfida [fazione]');
                return;
            }
            if (targetKey === player.faction) {
                await msg.reply('❌ Non puoi sfidare la tua stessa fazione.');
                return;
            }
            if (!data.factions[targetKey]) {
                await msg.reply('❌ Fazione bersaglio non trovata.');
                return;
            }
            if (getActiveWar(data, player.faction)) {
                await msg.reply('❌ La tua fazione è già impegnata in una guerra.');
                return;
            }
            const id = Date.now().toString();
            data.wars[id] = {
                id,
                faction1: player.faction,
                faction2: targetKey,
                state: 'waiting',
                hp1: 450,
                hp2: 450,
                turn: player.faction,
                attackers: []
            };
            writeJson(FILE, data);
            await msg.reply(`⚔️ Sfida inviata!\n\n${data.factions[player.faction].name} ha sfidato ${data.factions[targetKey].name}.\nIl leader avversario deve usare .battaglia accetta`);
            return;
        }

        if (args[0] === 'accetta') {
            if (!player || player.role !== 'leader') {
                await msg.reply('❌ Solo i leader possono accettare una guerra.');
                return;
            }
            const war = Object.values(data.wars).find(item => item.state === 'waiting' && item.faction2 === player.faction);
            if (!war) {
                await msg.reply('❌ Nessuna guerra in attesa per la tua fazione.');
                return;
            }
            war.state = 'active';
            war.turn = war.faction1;
            war.attackers = [];
            writeJson(FILE, data);
            await msg.reply(`🔥 Guerra iniziata!\n\n${data.factions[war.faction1].name} VS ${data.factions[war.faction2].name}\n💚 HP: ${war.hp1} - ${war.hp2}`);
            return;
        }

        if (args[0] === 'attacca') {
            if (!player) {
                await msg.reply('❌ Devi appartenere a una fazione per combattere.');
                return;
            }
            const war = getActiveWar(data, player.faction);
            if (!war) {
                await msg.reply('❌ La tua fazione non è in guerra.');
                return;
            }
            if (war.turn !== player.faction) {
                await msg.reply('❌ Non è il turno della tua fazione.');
                return;
            }
            if (war.attackers.includes(sender)) {
                await msg.reply('❌ Hai già attaccato in questo turno.');
                return;
            }

            const myHpField = war.faction1 === player.faction ? 'hp1' : 'hp2';
            const enemyHpField = war.faction1 === player.faction ? 'hp2' : 'hp1';
            const damage = Math.floor(Math.random() * 36) + 25;
            war[enemyHpField] = Math.max(0, war[enemyHpField] - damage);
            war.attackers.push(sender);
            data.players[sender].attacks = (data.players[sender].attacks || 0) + 1;

            let message = `⚔️ ATTACCO DI FAZIONE\n\n💥 Danni inflitti: ${damage}\n💚 HP: ${war.hp1} - ${war.hp2}`;

            const currentFaction = data.factions[player.faction];
            if (war.attackers.length >= Math.min(3, currentFaction.members.length)) {
                war.attackers = [];
                war.turn = war.faction1 === player.faction ? war.faction2 : war.faction1;
                message += `\n\n🔄 Turno passato a ${data.factions[war.turn].name}`;
            }

            if (war[enemyHpField] <= 0) {
                const winnerKey = player.faction;
                const loserKey = war.faction1 === winnerKey ? war.faction2 : war.faction1;
                const winnerFaction = data.factions[winnerKey];
                const loserFaction = data.factions[loserKey];

                winnerFaction.wins += 1;
                winnerFaction.credits += 180;
                loserFaction.losses += 1;
                war.state = 'finished';

                for (const member of winnerFaction.members) {
                    aggiornaClassifica(member, 30, true, 'battaglia', getName(member));
                    aggiungiMonete(member, 30, getName(member));
                    await processGameProgress({
                        userId: member,
                        game: 'battaglia',
                        displayName: getName(member),
                        events: { plays: 1, wins: 1, profit: 30 }
                    });
                }

                for (const member of loserFaction.members) {
                    aggiornaClassifica(member, -8, false, 'battaglia', getName(member));
                    aggiungiMonete(member, -8, getName(member));
                    await processGameProgress({
                        userId: member,
                        game: 'battaglia',
                        displayName: getName(member),
                        events: { plays: 1, losses: 1, profit: -8 }
                    });
                }

                writeJson(FILE, data);
                await msg.reply(`👑 GUERRA CONCLUSA!\n\n🏆 Vince ${winnerFaction.name}\n💰 Premio fazione: +180 crediti di fazione\n🎁 Premio membri: +30 crediti ciascuno`);
                return;
            }

            writeJson(FILE, data);
            await msg.reply(message);
            return;
        }

        if (args[0] === 'stato') {
            if (!player) {
                await msg.reply('❌ Non fai parte di nessuna fazione.');
                return;
            }
            const faction = data.factions[player.faction];
            const war = getActiveWar(data, player.faction);
            const lines = [
                `🏰 STATO FAZIONE: ${faction.name}`,
                '',
                `👥 Membri: ${faction.members.length}/10`,
                `🏆 Record: ${faction.wins}-${faction.losses}`,
                `💰 Crediti fazione: ${faction.credits}`,
                `⚔️ Tuoi attacchi storici: ${data.players[sender].attacks || 0}`
            ];
            if (war) {
                lines.push('');
                lines.push(`🔥 Guerra attiva contro: ${data.factions[war.faction1 === player.faction ? war.faction2 : war.faction1].name}`);
                lines.push(`💚 HP: ${war.hp1} - ${war.hp2}`);
                lines.push(`🎯 Turno: ${data.factions[war.turn].name}`);
            }
            await msg.reply(lines.join('\n'));
            return;
        }

        if (args[0] === 'resa') {
            if (!player || player.role !== 'leader') {
                await msg.reply('❌ Solo il leader può arrendersi.');
                return;
            }
            const war = getActiveWar(data, player.faction);
            if (!war) {
                await msg.reply('❌ La tua fazione non è in guerra.');
                return;
            }

            const winnerKey = war.faction1 === player.faction ? war.faction2 : war.faction1;
            const loserKey = player.faction;
            data.factions[winnerKey].wins += 1;
            data.factions[winnerKey].credits += 90;
            data.factions[loserKey].losses += 1;
            war.state = 'finished';
            writeJson(FILE, data);
            await msg.reply(`🏳️ ${data.factions[loserKey].name} si è arresa.\n\n🏆 Vince ${data.factions[winnerKey].name}`);
            return;
        }

        if (args[0] === 'trucca' && isAdmin(sender)) {
            const factionKey = args.slice(1).join(' ').trim().toLowerCase();
            const faction = data.factions[factionKey];
            if (!faction) {
                await msg.reply('❌ Fazione non trovata.');
                return;
            }
            faction.wins += 1;
            faction.credits += 250;
            writeJson(FILE, data);
            await msg.reply(`🛠️ Boost admin applicato a ${faction.name}: +1 vittoria, +250 crediti fazione.`);
            return;
        }
    }
};
