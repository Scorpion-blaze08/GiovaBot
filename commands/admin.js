const fs = require('fs');
const path = require('path');
const { getSenderId, isAdmin } = require('../utils/identity');
const { getSaldo, aggiungiMonete, setSaldo, resetEconomia } = require('../utils/economia');
const { resetAllClassifiche, GIOCHI_CLASSIFICA } = require('./classifica');
const { findFish } = require('../utils/pescaData');
const { awardAchievement, getTodayMissionsForUser } = require('../utils/progression');
const { readConfig, setMaintenance, lockCommand, unlockCommand } = require('../utils/adminConfig');

const DATA_DIR = path.join(__dirname, '..', 'data');
const BACKUP_DIR = path.join(__dirname, '..', 'backups');

function readJson(fileName, fallback = {}) {
    const filePath = path.join(DATA_DIR, fileName);
    try {
        if (!fs.existsSync(filePath)) return fallback;
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
        return fallback;
    }
}

function writeJson(fileName, data) {
    const filePath = path.join(DATA_DIR, fileName);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function ensureBackupDir() {
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function createBackup(scope = 'all') {
    ensureBackupDir();
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const targetDir = path.join(BACKUP_DIR, `${scope}-${stamp}`);
    fs.mkdirSync(targetDir, { recursive: true });

    const groups = {
        economia: ['economia.json', 'banca.json'],
        pesca: ['inventario_pesca.json', 'cooldown_pesca.json', 'streak_pesca.json', 'boss_pesca.json'],
        progressione: ['missions.json', 'progression.json', 'achievements.json', 'game_streaks.json'],
        roulette: ['partite_roulette.json', 'classifica_roulette.json']
    };

    let files = [];
    if (scope === 'all') {
        files = fs.readdirSync(DATA_DIR).filter(name => name.endsWith('.json'));
    } else {
        files = groups[scope] || [];
    }

    for (const file of files) {
        const source = path.join(DATA_DIR, file);
        if (!fs.existsSync(source)) continue;
        fs.copyFileSync(source, path.join(targetDir, file));
    }

    return targetDir;
}

function getFishingPlayer(name = null) {
    return {
        nome: name || null,
        pesci: {},
        statistiche: {
            pescate: 0,
            rarePlus: 0,
            leggendari: 0,
            tesori: 0,
            venduti: 0,
            guadagni: 0
        },
        profile: {
            area: 'porto',
            rod: 'bamboo',
            equippedBait: 'none',
            ownedRods: ['bamboo'],
            unlockedAreas: ['porto']
        },
        baits: {
            worm: 0,
            shrimp: 0,
            squid: 0,
            glow: 0
        }
    };
}

function getFishingUpdateAnnouncement() {
    return [
        'MEGA AGGIORNAMENTO PESCA',
        '',
        'La pesca e stata completamente rifatta.',
        '',
        'Novita principali:',
        '- nuove aree da sbloccare',
        '- tante nuove specie e tesori',
        '- canne con bonus diversi',
        '- esche equipaggiabili',
        '- tempi di pesca dinamici',
        '- inventario, collezione e profilo',
        '- vendita integrata con crediti e classifica pesca',
        '',
        'Comandi utili:',
        '.pesca',
        '.pesca profilo',
        '.pesca aree',
        '.pesca shop',
        '.pesca inv',
        '.pesca collezione',
        '.pesca vendi tutto',
        '',
        'I vecchi progressi pesca di test sono stati resettati per partire puliti con il nuovo sistema.',
        'Buona fortuna e occhio ai leggendari.'
    ].join('\n');
}

function resetGameProgress() {
    resetEconomia();
    resetAllClassifiche();
    writeJson('achievements.json', {});
    writeJson('banca.json', {});
    writeJson('cooldown_pesca.json', {});
    writeJson('daily.json', {});
    writeJson('duelli.json', {});
    writeJson('game_streaks.json', {});
    writeJson('inventario_pesca.json', {});
    writeJson('missions.json', {});
    writeJson('nomi_giocatori.json', {});
    writeJson('partite_blackjack.json', {});
    writeJson('partite_roulette.json', {});
    writeJson('progression.json', {});
    writeJson('streak_pesca.json', {});
    writeJson('tornei.json', {});
    writeJson('trade_pesca.json', {});
    writeJson('boss_pesca.json', {});
    writeJson('classifica.json', {});
    writeJson('classifica_generale.json', {});
    writeJson('classifica_carta.json', {});
    writeJson('classifica_true.json', {});
    writeJson('classifica_false.json', {});
}

module.exports = {
    name: 'admin',
    description: 'Pannello admin avanzato',
    async execute(msg, client) {
        const sender = await getSenderId(msg);
        if (!isAdmin(sender)) {
            await msg.reply('Solo l\'admin puo usare questo comando.');
            return;
        }

        const args = msg.body.split(' ').slice(1);
        const sub = (args[0] || 'help').toLowerCase();
        const mentions = await msg.getMentions();
        const targetId = mentions.length ? mentions[0].id._serialized : null;
        const targetName = targetId ? (mentions[0].pushname || mentions[0].verifiedName || targetId.split('@')[0]) : null;

        if (sub === 'help') {
            await msg.reply(
                'ADMIN COMMANDS\n\n' +
                '.admin coins add @utente importo\n' +
                '.admin coins remove @utente importo\n' +
                '.admin coins set @utente importo\n' +
                '.admin saldo @utente\n' +
                '.admin reset progress\n' +
                '.admin reset classifica [gioco|all]\n' +
                '.admin reset daily\n' +
                '.admin reset streak\n' +
                '.admin status\n' +
                '.admin maintenance on|off\n' +
                '.admin lock [comando]\n' +
                '.admin unlock [comando]\n' +
                '.admin backup [all|economia|pesca|progressione|roulette]\n' +
                '.admin missioni\n' +
                '.admin achievement give @utente [id]\n' +
                '.admin fish give @utente id_o_nome quantita\n' +
                '.admin fish clear @utente\n' +
                '.admin announce pesca [qui|gruppo1|gruppo2|all]\n' +
                '.admin say gruppo1 testo\n' +
                '.admin say gruppo2 testo'
            );
            return;
        }

        if (sub === 'coins') {
            const action = (args[1] || '').toLowerCase();
            const amount = parseInt(args[3], 10);

            if (!targetId || Number.isNaN(amount)) {
                await msg.reply('Uso: .admin coins [add|remove|set] @utente importo');
                return;
            }

            if (action === 'add') {
                const saldo = aggiungiMonete(targetId, amount, targetName);
                await msg.reply(`Accreditati ${amount} GiovaCoins. Nuovo saldo: ${saldo}`);
                return;
            }

            if (action === 'remove') {
                const saldo = aggiungiMonete(targetId, -Math.abs(amount), targetName);
                await msg.reply(`Scalati ${Math.abs(amount)} GiovaCoins. Nuovo saldo: ${saldo}`);
                return;
            }

            if (action === 'set') {
                const saldo = setSaldo(targetId, amount, targetName);
                await msg.reply(`Saldo impostato a ${saldo} GiovaCoins.`);
                return;
            }

            await msg.reply('Azione coins non valida.');
            return;
        }

        if (sub === 'saldo') {
            if (!targetId) {
                await msg.reply('Uso: .admin saldo @utente');
                return;
            }

            await msg.reply(`Saldo utente: ${getSaldo(targetId)} GiovaCoins`);
            return;
        }

        if (sub === 'status') {
            const config = readConfig();
            await msg.reply([
                '🛠️ STATO ADMIN',
                '',
                `Maintenance: ${config.maintenance ? 'ON' : 'OFF'}`,
                `Comandi bloccati: ${config.lockedCommands.length ? config.lockedCommands.join(', ') : 'nessuno'}`,
                `Missioni oggi: ${getTodayMissionsForUser(sender).missions.length}`,
                `Backup dir: ${BACKUP_DIR}`
            ].join('\n'));
            return;
        }

        if (sub === 'maintenance') {
            const mode = (args[1] || '').toLowerCase();
            if (!['on', 'off'].includes(mode)) {
                await msg.reply('Uso: .admin maintenance on|off');
                return;
            }
            setMaintenance(mode === 'on');
            await msg.reply(`Maintenance ${mode === 'on' ? 'attivata' : 'disattivata'}.`);
            return;
        }

        if (sub === 'lock') {
            const commandName = (args[1] || '').toLowerCase();
            if (!commandName) {
                await msg.reply('Uso: .admin lock [comando]');
                return;
            }
            const config = lockCommand(commandName);
            await msg.reply(`🔒 Comando .${commandName} bloccato.\nComandi attualmente bloccati: ${config.lockedCommands.join(', ')}`);
            return;
        }

        if (sub === 'unlock') {
            const commandName = (args[1] || '').toLowerCase();
            if (!commandName) {
                await msg.reply('Uso: .admin unlock [comando]');
                return;
            }
            const config = unlockCommand(commandName);
            await msg.reply(`🔓 Comando .${commandName} sbloccato.\nComandi ancora bloccati: ${config.lockedCommands.join(', ') || 'nessuno'}`);
            return;
        }

        if (sub === 'backup') {
            const scope = (args[1] || 'all').toLowerCase();
            const allowed = ['all', 'economia', 'pesca', 'progressione', 'roulette'];
            if (!allowed.includes(scope)) {
                await msg.reply('Uso: .admin backup [all|economia|pesca|progressione|roulette]');
                return;
            }
            const dir = createBackup(scope);
            await msg.reply(`📦 Backup creato con successo.\n\nScope: ${scope}\nCartella: ${dir}`);
            return;
        }

        if (sub === 'missioni') {
            const today = getTodayMissionsForUser(sender);
            const lines = ['🎯 MISSIONI DEL GIORNO', ''];
            for (const mission of today.missions) {
                lines.push(`${mission.emoji} ${mission.title} | ${mission.game} | ${mission.target} | reward ${mission.reward}`);
            }
            await msg.reply(lines.join('\n'));
            return;
        }

        if (sub === 'achievement') {
            const action = (args[1] || '').toLowerCase();
            const achievementId = args[3];
            if (action !== 'give' || !targetId || !achievementId) {
                await msg.reply('Uso: .admin achievement give @utente [id]');
                return;
            }
            const unlocked = awardAchievement(targetId, achievementId, targetName || targetId.split('@')[0]);
            if (!unlocked) {
                await msg.reply('Achievement non valido oppure già sbloccato.');
                return;
            }
            await msg.reply(`🏆 Achievement assegnato: ${achievementId}`);
            return;
        }

        if (sub === 'reset') {
            const target = (args[1] || '').toLowerCase();
            const scope = (args[2] || '').toLowerCase();

            if (target === 'progress') {
                resetGameProgress();
                await msg.reply('Progressi di test azzerati.');
                return;
            }

            if (target === 'classifica') {
                if (!scope || scope === 'all') {
                    resetAllClassifiche();
                    await msg.reply('Classifiche azzerate.');
                    return;
                }

                if (!GIOCHI_CLASSIFICA.includes(scope)) {
                    await msg.reply('Gioco non valido per reset classifica.');
                    return;
                }

                writeJson(`classifica_${scope}.json`, {});
                await msg.reply(`Classifica ${scope} azzerata.`);
                return;
            }

            if (target === 'daily') {
                writeJson('daily.json', {});
                await msg.reply('Daily azzerati.');
                return;
            }

            if (target === 'streak') {
                writeJson('game_streaks.json', {});
                writeJson('streak_pesca.json', {});
                await msg.reply('Streak azzerati.');
                return;
            }

            await msg.reply('Uso: .admin reset [progress|classifica|daily|streak]');
            return;
        }

        if (sub === 'fish') {
            const action = (args[1] || '').toLowerCase();
            const inventory = readJson('inventario_pesca.json', {});

            if (action === 'clear') {
                if (!targetId) {
                    await msg.reply('Uso: .admin fish clear @utente');
                    return;
                }

                inventory[targetId] = getFishingPlayer(targetName);
                writeJson('inventario_pesca.json', inventory);
                await msg.reply('Inventario pesca pulito.');
                return;
            }

            if (action === 'give') {
                const fishToken = args[3];
                const qty = parseInt(args[4], 10);
                const fish = findFish(fishToken);

                if (!targetId || !fish || Number.isNaN(qty) || qty <= 0) {
                    await msg.reply('Uso: .admin fish give @utente id_o_nome quantita');
                    return;
                }

                if (!inventory[targetId]) inventory[targetId] = getFishingPlayer(targetName);
                if (!inventory[targetId].pesci[fish.id]) inventory[targetId].pesci[fish.id] = 0;
                inventory[targetId].pesci[fish.id] += qty;
                writeJson('inventario_pesca.json', inventory);
                await msg.reply(`Aggiunti ${qty}x ${fish.name} all'inventario pesca.`);
                return;
            }

            await msg.reply('Uso: .admin fish [give|clear] ...');
            return;
        }

        if (sub === 'announce') {
            const topic = (args[1] || '').toLowerCase();
            const scope = (args[2] || 'all').toLowerCase();
            const groups = {
                gruppo1: '120363046559211268@g.us',
                gruppo2: '120363423664616339@g.us'
            };

            if (topic !== 'pesca') {
                await msg.reply('Uso: .admin announce pesca [qui|gruppo1|gruppo2|all]');
                return;
            }

            const text = getFishingUpdateAnnouncement();

            if (scope === 'qui') {
                await client.sendMessage(msg.from, text);
                await msg.reply('Avviso aggiornamento inviato qui.');
                return;
            }

            if (scope === 'all') {
                await client.sendMessage(groups.gruppo1, text);
                await client.sendMessage(groups.gruppo2, text);
                await msg.reply('Avviso aggiornamento pesca inviato in tutti i gruppi.');
                return;
            }

            if (!groups[scope]) {
                await msg.reply('Uso: .admin announce pesca [qui|gruppo1|gruppo2|all]');
                return;
            }

            await client.sendMessage(groups[scope], text);
            await msg.reply(`Avviso aggiornamento pesca inviato in ${scope}.`);
            return;
        }

        if (sub === 'say') {
            const group = (args[1] || '').toLowerCase();
            const text = args.slice(2).join(' ').trim();
            const groups = {
                gruppo1: '120363046559211268@g.us',
                gruppo2: '120363423664616339@g.us'
            };

            if (!groups[group] || !text) {
                await msg.reply('Uso: .admin say [gruppo1|gruppo2] testo');
                return;
            }

            await client.sendMessage(groups[group], text);
            await msg.reply('Messaggio inviato.');
            return;
        }

        await msg.reply('Comando admin non riconosciuto. Usa .admin help');
    }
};
