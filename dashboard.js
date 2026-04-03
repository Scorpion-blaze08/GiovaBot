const readline = require('readline');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');

// Colori ANSI
const C = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    magenta: '\x1b[35m',
    blue: '\x1b[34m',
    gray: '\x1b[90m',
};

function color(text, ...codes) {
    return codes.join('') + text + C.reset;
}

function clearScreen() {
    process.stdout.write('\x1Bc');
}

function printHeader() {
    console.log(color('╔══════════════════════════════════════════╗', C.cyan, C.bright));
    console.log(color('║         🤖  GIOVABOT  DASHBOARD  🤖       ║', C.cyan, C.bright));
    console.log(color('╚══════════════════════════════════════════╝', C.cyan, C.bright));
    const uptime = global.getUptime ? formatUptime(global.getUptime()) : 'N/A';
    console.log(color(`  Uptime: ${uptime}`, C.gray));
    console.log();
}

function formatUptime(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}m ${s % 60}s`;
}

function readJson(file, def = {}) {
    const p = path.join(DATA_DIR, file);
    try {
        if (!fs.existsSync(p)) return def;
        return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch { return def; }
}

function writeJson(file, data) {
    const p = path.join(DATA_DIR, file);
    fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

// ─── MENU PRINCIPALE ────────────────────────────────────────────────────────

function printMenu() {
    printHeader();
    console.log(color('  MENU PRINCIPALE', C.bright));
    console.log();
    console.log(color('  1', C.yellow) + '  📚  Gestione Compiti');
    console.log(color('  2', C.yellow) + '  🔇  Gestione Mute');
    console.log(color('  3', C.yellow) + '  🏆  Classifica');
    console.log(color('  4', C.yellow) + '  📊  Statistiche Bot');
    console.log(color('  5', C.yellow) + '  💬  Invia Messaggio al Gruppo');
    console.log(color('  6', C.yellow) + '  🗑️   Reset Dati');
    console.log(color('  7', C.yellow) + '  📋  Log Comandi');
    console.log(color('  8', C.yellow) + '  🔔  Invia Promemoria Compiti Ora');
    console.log(color('  0', C.red)    + '  ❌  Esci');
    console.log();
}

// ─── COMPITI ────────────────────────────────────────────────────────────────

function menuCompiti(rl, back) {
    clearScreen();
    printHeader();
    const compiti = readJson('compiti.json', []);
    console.log(color('  📚 COMPITI', C.bright));
    console.log();

    if (compiti.length === 0) {
        console.log(color('  Nessun compito in lista.', C.gray));
    } else {
        compiti.forEach((c, i) => {
            console.log(color(`  ${i + 1}.`, C.yellow) + ` ${c.materia}: ${c.descrizione}`);
        });
    }

    console.log();
    console.log(color('  a', C.green) + '  Aggiungi compito');
    console.log(color('  r', C.red)   + '  Rimuovi compito');
    console.log(color('  c', C.red)   + '  Cancella tutti');
    console.log(color('  0', C.gray)  + '  Indietro');
    console.log();

    rl.question(color('  > ', C.cyan), (input) => {
        input = input.trim().toLowerCase();
        if (input === '0') return back();

        if (input === 'a') {
            rl.question(color('  Materia: ', C.cyan), (materia) => {
                rl.question(color('  Descrizione: ', C.cyan), (desc) => {
                    compiti.push({ materia: materia.trim(), descrizione: desc.trim(), aggiunto: new Date().toLocaleDateString('it-IT'), aggiuntoDA: 'Dashboard' });
                    writeJson('compiti.json', compiti);
                    console.log(color('  ✅ Compito aggiunto!', C.green));
                    setTimeout(() => menuCompiti(rl, back), 1000);
                });
            });
        } else if (input === 'r') {
            rl.question(color('  Numero da rimuovere: ', C.cyan), (n) => {
                const idx = parseInt(n) - 1;
                if (idx >= 0 && idx < compiti.length) {
                    compiti.splice(idx, 1);
                    writeJson('compiti.json', compiti);
                    console.log(color('  ✅ Compito rimosso!', C.green));
                } else {
                    console.log(color('  ❌ Numero non valido.', C.red));
                }
                setTimeout(() => menuCompiti(rl, back), 1000);
            });
        } else if (input === 'c') {
            writeJson('compiti.json', []);
            console.log(color('  ✅ Tutti i compiti cancellati!', C.green));
            setTimeout(() => menuCompiti(rl, back), 1000);
        } else {
            menuCompiti(rl, back);
        }
    });
}

// ─── MUTE ────────────────────────────────────────────────────────────────────

function menuMute(rl, back) {
    clearScreen();
    printHeader();
    const muted = readJson('muted_users.json', {});
    const now = Date.now();
    const attivi = Object.entries(muted).filter(([, d]) => d.scadenza > now);

    console.log(color('  🔇 UTENTI MUTATI', C.bright));
    console.log();

    if (attivi.length === 0) {
        console.log(color('  Nessun utente mutato.', C.gray));
    } else {
        attivi.forEach(([id, d]) => {
            const min = Math.ceil((d.scadenza - now) / 60000);
            console.log(color(`  • ${d.nome || id.split('@')[0]}`, C.yellow) + color(` (${min}m rimanenti)`, C.gray));
        });
    }

    console.log();
    console.log(color('  u', C.red)  + '  Unmute per ID');
    console.log(color('  c', C.red)  + '  Rimuovi tutti i mute');
    console.log(color('  0', C.gray) + '  Indietro');
    console.log();

    rl.question(color('  > ', C.cyan), (input) => {
        input = input.trim().toLowerCase();
        if (input === '0') return back();

        if (input === 'u') {
            rl.question(color('  ID utente (es. 393331234567): ', C.cyan), (id) => {
                const key = id.trim().includes('@') ? id.trim() : id.trim() + '@c.us';
                if (muted[key]) {
                    delete muted[key];
                    writeJson('muted_users.json', muted);
                    console.log(color('  ✅ Utente smutato!', C.green));
                } else {
                    console.log(color('  ❌ Utente non trovato.', C.red));
                }
                setTimeout(() => menuMute(rl, back), 1000);
            });
        } else if (input === 'c') {
            writeJson('muted_users.json', {});
            console.log(color('  ✅ Tutti i mute rimossi!', C.green));
            setTimeout(() => menuMute(rl, back), 1000);
        } else {
            menuMute(rl, back);
        }
    });
}

// ─── CLASSIFICA ──────────────────────────────────────────────────────────────

function menuClassifica(rl, back) {
    clearScreen();
    printHeader();
    const giochi = ['slot', 'dado', 'roulette', 'cavalli', 'scelta', 'blackjack', 'pesca', 'duello'];
    const totale = {};

    for (const g of giochi) {
        const dati = readJson(`classifica_${g}.json`, {});
        for (const [nome, s] of Object.entries(dati)) {
            if (!totale[nome]) totale[nome] = { punti: 0, vittorie: 0, partite: 0 };
            totale[nome].punti += s.punti || 0;
            totale[nome].vittorie += s.vittorie || 0;
            totale[nome].partite += s.partite || 0;
        }
    }

    const top = Object.entries(totale).sort(([, a], [, b]) => b.punti - a.punti).slice(0, 10);

    console.log(color('  🏆 CLASSIFICA TOTALE (TOP 10)', C.bright));
    console.log();

    if (top.length === 0) {
        console.log(color('  Nessun dato disponibile.', C.gray));
    } else {
        const medals = ['🥇', '🥈', '🥉'];
        top.forEach(([nome, d], i) => {
            const pos = medals[i] || `${i + 1}.`;
            console.log(`  ${pos} ${color(nome, C.bright)} — ${color(d.punti + ' pt', C.yellow)} | V: ${d.vittorie} | P: ${d.partite}`);
        });
    }

    console.log();
    console.log(color('  Premi INVIO per tornare...', C.gray));
    rl.question('', () => back());
}

// ─── STATISTICHE ─────────────────────────────────────────────────────────────

function menuStats(rl, back) {
    clearScreen();
    printHeader();
    console.log(color('  📊 STATISTICHE BOT', C.bright));
    console.log();

    const giochi = ['slot', 'dado', 'roulette', 'cavalli', 'scelta', 'blackjack', 'pesca', 'duello'];
    let totPartite = 0;
    let totGiocatori = new Set();

    for (const g of giochi) {
        const dati = readJson(`classifica_${g}.json`, {});
        const partite = Object.values(dati).reduce((s, v) => s + (v.partite || 0), 0);
        totPartite += partite;
        Object.keys(dati).forEach(k => totGiocatori.add(k));
        if (partite > 0) {
            console.log(`  ${color(g.padEnd(12), C.yellow)} ${partite} partite | ${Object.keys(dati).length} giocatori`);
        }
    }

    const compiti = readJson('compiti.json', []);
    const muted = readJson('muted_users.json', {});
    const mutedAttivi = Object.values(muted).filter(d => d.scadenza > Date.now()).length;

    console.log();
    console.log(color('  ─────────────────────────────', C.gray));
    console.log(`  ${color('Partite totali:', C.bright)}   ${totPartite}`);
    console.log(`  ${color('Giocatori unici:', C.bright)}  ${totGiocatori.size}`);
    console.log(`  ${color('Compiti in lista:', C.bright)} ${compiti.length}`);
    console.log(`  ${color('Utenti mutati:', C.bright)}    ${mutedAttivi}`);
    console.log(`  ${color('Uptime:', C.bright)}           ${global.getUptime ? formatUptime(global.getUptime()) : 'N/A'}`);
    console.log();
    console.log(color('  Premi INVIO per tornare...', C.gray));
    rl.question('', () => back());
}

// ─── INVIA MESSAGGIO ─────────────────────────────────────────────────────────

function menuMessaggio(rl, back, botClient) {
    clearScreen();
    printHeader();
    console.log(color('  💬 INVIA MESSAGGIO AL GRUPPO', C.bright));
    console.log();
    console.log(color('  1', C.yellow) + '  Gruppo principale (120363046559211268)');
    console.log(color('  2', C.yellow) + '  Secondo gruppo    (120363423664616339)');
    console.log(color('  0', C.gray)   + '  Indietro');
    console.log();

    rl.question(color('  > ', C.cyan), (scelta) => {
        if (scelta === '0') return back();
        const gruppi = {
            '1': '120363046559211268@g.us',
            '2': '120363423664616339@g.us'
        };
        const groupId = gruppi[scelta];
        if (!groupId) return menuMessaggio(rl, back, botClient);

        rl.question(color('  Messaggio: ', C.cyan), async (testo) => {
            if (!testo.trim()) return menuMessaggio(rl, back, botClient);
            try {
                await botClient.sendMessage(groupId, testo.trim());
                console.log(color('  ✅ Messaggio inviato!', C.green));
            } catch (e) {
                console.log(color('  ❌ Errore: ' + e.message, C.red));
            }
            setTimeout(() => menuMessaggio(rl, back, botClient), 1500);
        });
    });
}

// ─── RESET DATI ──────────────────────────────────────────────────────────────

function menuReset(rl, back) {
    clearScreen();
    printHeader();
    console.log(color('  🗑️  RESET DATI', C.bright));
    console.log();
    console.log(color('  1', C.red)   + '  Reset classifica totale');
    console.log(color('  2', C.red)   + '  Reset compiti');
    console.log(color('  3', C.red)   + '  Reset mute');
    console.log(color('  4', C.red)   + '  Reset streak');
    console.log(color('  0', C.gray)  + '  Indietro');
    console.log();

    rl.question(color('  > ', C.cyan), (input) => {
        if (input === '0') return back();

        const giochi = ['slot', 'dado', 'roulette', 'cavalli', 'scelta', 'blackjack', 'pesca', 'duello', 'torneo', 'battaglia'];

        if (input === '1') {
            rl.question(color('  Sei sicuro? (s/n): ', C.red), (conf) => {
                if (conf.toLowerCase() === 's') {
                    giochi.forEach(g => writeJson(`classifica_${g}.json`, {}));
                    console.log(color('  ✅ Classifiche azzerate!', C.green));
                }
                setTimeout(() => menuReset(rl, back), 1000);
            });
        } else if (input === '2') {
            writeJson('compiti.json', []);
            console.log(color('  ✅ Compiti cancellati!', C.green));
            setTimeout(() => menuReset(rl, back), 1000);
        } else if (input === '3') {
            writeJson('muted_users.json', {});
            console.log(color('  ✅ Mute rimossi!', C.green));
            setTimeout(() => menuReset(rl, back), 1000);
        } else if (input === '4') {
            writeJson('game_streaks.json', {});
            console.log(color('  ✅ Streak resettati!', C.green));
            setTimeout(() => menuReset(rl, back), 1000);
        } else {
            menuReset(rl, back);
        }
    });
}

// ─── LOG COMANDI ─────────────────────────────────────────────────────────────

function menuLog(rl, back) {
    clearScreen();
    printHeader();
    const log = readJson('log_comandi.json', []);
    const ultimi = log.slice(-20).reverse();

    console.log(color('  📋 LOG ULTIMI 20 COMANDI', C.bright));
    console.log();

    if (ultimi.length === 0) {
        console.log(color('  Nessun comando registrato.', C.gray));
    } else {
        const conteggio = {};
        log.forEach(e => { conteggio[e.cmd] = (conteggio[e.cmd] || 0) + 1; });
        const topCmd = Object.entries(conteggio).sort(([,a],[,b]) => b-a).slice(0, 5);

        console.log(color('  🕐 Recenti:', C.bright));
        ultimi.forEach(e => {
            const ora = new Date(e.ts).toLocaleTimeString('it-IT');
            console.log(`  ${color(ora, C.gray)} ${color(e.user, C.yellow)}: .${e.cmd}`);
        });
        console.log();
        console.log(color('  🏆 Comandi più usati:', C.bright));
        topCmd.forEach(([cmd, n]) => {
            console.log(`  .${cmd.padEnd(15)} ${color(n + 'x', C.cyan)}`);
        });
    }

    console.log();
    console.log(color('  Premi INVIO per tornare...', C.gray));
    rl.question('', () => back());
}

// ─── PROMEMORIA MANUALE ───────────────────────────────────────────────────────

async function menuPromemoria(rl, back, botClient) {
    clearScreen();
    printHeader();
    const compiti = readJson('compiti.json', []);

    console.log(color('  🔔 INVIA PROMEMORIA COMPITI ORA', C.bright));
    console.log();

    if (compiti.length === 0) {
        console.log(color('  Nessun compito in lista da inviare.', C.gray));
        console.log();
        console.log(color('  Premi INVIO per tornare...', C.gray));
        rl.question('', () => back());
        return;
    }

    const today = new Date().toLocaleDateString('it-IT');
    let message = `🔔 PROMEMORIA COMPITI (${today})\n\n`;
    compiti.forEach((c, i) => { message += `${i + 1}. ${c.materia}: ${c.descrizione}\n`; });
    message += '\n📚 Buono studio a tutti!';

    console.log(color('  Anteprima:', C.bright));
    compiti.forEach((c, i) => console.log(`  ${i + 1}. ${c.materia}: ${c.descrizione}`));
    console.log();
    console.log(color('  1', C.yellow) + '  Invia al gruppo principale');
    console.log(color('  2', C.yellow) + '  Invia a entrambi i gruppi');
    console.log(color('  0', C.gray)   + '  Annulla');
    console.log();

    rl.question(color('  > ', C.cyan), async (scelta) => {
        const gruppi = {
            '1': ['120363046559211268@g.us'],
            '2': ['120363046559211268@g.us', '120363423664616339@g.us']
        };
        const targets = gruppi[scelta];
        if (!targets) return back();

        for (const g of targets) {
            try {
                await botClient.sendMessage(g, message);
                console.log(color(`  ✅ Inviato a ${g}`, C.green));
            } catch (e) {
                console.log(color(`  ❌ Errore: ${e.message}`, C.red));
            }
        }
        setTimeout(() => back(), 1500);
    });
}

// ─── AVVIO DASHBOARD ─────────────────────────────────────────────────────────

function startDashboard(botClient) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    function mainMenu() {
        clearScreen();
        printMenu();
        rl.question(color('  > ', C.cyan), (input) => {
            input = input.trim();
            if (input === '0') {
                rl.close();
                return;
            }
            if (input === '1') menuCompiti(rl, mainMenu);
            else if (input === '2') menuMute(rl, mainMenu);
            else if (input === '3') menuClassifica(rl, mainMenu);
            else if (input === '4') menuStats(rl, mainMenu);
            else if (input === '5') menuMessaggio(rl, mainMenu, botClient);
            else if (input === '6') menuReset(rl, mainMenu);
            else if (input === '7') menuLog(rl, mainMenu);
            else if (input === '8') menuPromemoria(rl, mainMenu, botClient);
            else mainMenu();
        });
    }

    // Aspetta 2 secondi prima di mostrare il menu (il bot sta ancora avviandosi)
    setTimeout(mainMenu, 2000);
}

module.exports = { startDashboard };
