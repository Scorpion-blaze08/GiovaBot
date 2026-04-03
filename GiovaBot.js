// WhatsApp bot using whatsapp-web.js
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');
const { getSenderId, findMatchingKey, isAdmin } = require('./utils/identity');
const { readConfig: readAdminConfig } = require('./utils/adminConfig');

// Initialize uptime tracking
const startTime = Date.now();
global.getUptime = () => Date.now() - startTime;

// Load commands — streaks.js prima per inizializzare global.updateStreak
const commands = new Map();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
const orderedFiles = ['streaks.js', 'achievements.js', ...commandFiles.filter(f => f !== 'streaks.js' && f !== 'achievements.js')];

for (const file of orderedFiles) {
    try {
        const command = require(path.join(commandsPath, file));
        if (command.name) commands.set(command.name, command);
    } catch (e) {
        console.error(`Errore caricamento ${file}:`, e.message);
    }
}

console.log(`✅ ${commands.size} comandi caricati: ${[...commands.keys()].join(', ')}`);

// Create WhatsApp client with session persistence
const client = new Client({
    authStrategy: new LocalAuth(),
    webVersion: '2.3000.1023480842',
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1023480842.html'
    },
    puppeteer: {
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    }
});

// Generate QR code for authentication
client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
});

// When client is ready
let isReady = false;
client.on('ready', async () => {
    if (isReady) return;
    isReady = true;
    console.log('Client is ready!');
    startHomeworkReminder();
    setTimeout(sendStartupMessage, 5000);
});

// Funzione per inviare messaggio di avvio
async function sendStartupMessage() {
    const GROUP_IDS = ['120363046559211268@g.us', '120363423664616339@g.us'];
    for (const GROUP_ID of GROUP_IDS) {
        try {
            await client.sendMessage(GROUP_ID, '🤖 GIOVABOT ONLINE! 🤖\n\n✅ Bot avviato con successo!\n📝 Usa .help per vedere i comandi');
            console.log(`Messaggio avvio inviato a ${GROUP_ID}`);
        } catch (error) {
            console.error(`Errore invio messaggio a ${GROUP_ID}:`, error.message);
        }
    }
}

// Cooldown anti-spam per comandi gioco (3 secondi per utente per comando)
const GIOCHI_CON_COOLDOWN = new Set(['slot', 'dado', 'cavalli', 'blackjack', 'roulette', 'scelta', 'pesca']);
const COOLDOWN_MS = 3000;
const userCooldowns = new Map();

function isOnCooldown(userId, commandName) {
    if (!GIOCHI_CON_COOLDOWN.has(commandName)) return false;
    const key = `${userId}:${commandName}`;
    const last = userCooldowns.get(key) || 0;
    if (Date.now() - last < COOLDOWN_MS) return true;
    userCooldowns.set(key, Date.now());
    return false;
}

// Funzione per controllare se un utente è mutato
async function isUserMuted(userId) {
    const muteFile = path.join(__dirname, 'data', 'muted_users.json');
    try {
        if (!fs.existsSync(muteFile)) return false;
        const muted = JSON.parse(fs.readFileSync(muteFile, 'utf8'));
        const now = Date.now();
        const mutedKey = findMatchingKey(muted, userId);
        if (mutedKey && muted[mutedKey].scadenza > now) return true;
        if (mutedKey) {
            delete muted[mutedKey];
            fs.writeFileSync(muteFile, JSON.stringify(muted, null, 2));
        }
        return false;
    } catch (error) {
        console.error('Errore controllo mute:', error);
        return false;
    }
}

const { aggiornaNomeDaMsg } = require('./utils/nomi');

// Log comandi su file
const LOG_FILE = path.join(__dirname, 'data', 'log_comandi.json');
function logComando(sender, command) {
    try {
        let log = [];
        if (fs.existsSync(LOG_FILE)) log = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
        log.push({ ts: new Date().toISOString(), user: sender.split('@')[0], cmd: command });
        if (log.length > 500) log = log.slice(-500); // tieni solo gli ultimi 500
        fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2));
    } catch {}
}

// Handle incoming messages
client.on('message', async msg => {
    if (!msg.body) return;

    const trimmedBody = msg.body.trim();
    if (!trimmedBody.startsWith('.')) return;

    const sender = await getSenderId(msg);
    aggiornaNomeDaMsg(msg).catch(() => {});
    if (await isUserMuted(sender)) return;

    const args = trimmedBody.slice(1).split(/\s+/);
    const commandName = args[0].toLowerCase();
    const command = commands.get(commandName);

    if (command) {
        const adminConfig = readAdminConfig();
        if (!isAdmin(sender)) {
            if (adminConfig.maintenance && !['help', 'novita', 'ai'].includes(commandName)) {
                await msg.reply('🛠️ Il bot e in manutenzione in questo momento.\n\n💡 Torna tra poco oppure usa .novita per vedere cosa sta cambiando.');
                return;
            }

            if (adminConfig.lockedCommands.includes(commandName)) {
                await msg.reply(`🔒 Il comando .${commandName} e temporaneamente disattivato dall'admin.`);
                return;
            }
        }

        if (isOnCooldown(sender, commandName)) return;
        logComando(sender, commandName);
        try {
            await command.execute(msg, client);
        } catch (error) {
            console.error('Errore comando:', error);
            msg.reply('❌ Si e verificato un errore durante l\'esecuzione del comando.\n\n💡 Riprova tra poco. Se continua, usa .novita o segnala il comando che ha dato problemi.');
        }
    }
});

// Sistema promemoria compiti — controlla ogni minuto, non spara mai due volte lo stesso giorno
function startHomeworkReminder() {
    let lastHomeworkDay = -1;
    let lastMidnightDay = -1;

    setInterval(async () => {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const day = now.getDate();

        if (hours === 16 && minutes < 2 && lastHomeworkDay !== day) {
            lastHomeworkDay = day;
            await sendHomeworkReminder();
        }

        if (hours === 0 && minutes < 2 && lastMidnightDay !== day) {
            lastMidnightDay = day;
            await clearHomeworkAtMidnight();
        }
    }, 60000);
}

async function sendHomeworkReminder() {
    const COMPITI_FILE = path.join(__dirname, 'data', 'compiti.json');
    let compiti = [];
    if (fs.existsSync(COMPITI_FILE)) {
        try { compiti = JSON.parse(fs.readFileSync(COMPITI_FILE, 'utf8')); } catch (e) {}
    }
    if (compiti.length === 0) return;

    const today = new Date().toLocaleDateString('it-IT');
    let message = `🔔 PROMEMORIA COMPITI (${today})\n\n`;
    compiti.forEach((compito, index) => {
        message += `${index + 1}. ${getSubjectEmoji(compito.materia)} ${compito.materia}: ${compito.descrizione}\n`;
    });
    message += '\n📚 Buono studio a tutti!';

    try {
        await client.sendMessage('120363046559211268@g.us', message);
        console.log('Promemoria compiti inviato alle 16:00');
    } catch (error) {
        console.error('Errore invio promemoria:', error);
    }
}

async function clearHomeworkAtMidnight() {
    const COMPITI_FILE = path.join(__dirname, 'data', 'compiti.json');
    try {
        fs.writeFileSync(COMPITI_FILE, JSON.stringify([], null, 2));
        console.log('Compiti cancellati automaticamente a mezzanotte');
    } catch (error) {
        console.error('Errore cancellazione compiti a mezzanotte:', error);
    }
}

function getSubjectEmoji(materia) {
    const emojis = {
        'matematica': '📐', 'italiano': '🇮🇹', 'inglese': '🇬🇧',
        'storia': '🏛️', 'sistemi': '🖥️', 'tpsit': '🛠️',
        'informatica': '💻', 'religione': '✝️', 'civica': '⚖️',
    };
    return emojis[materia.toLowerCase()] || '📚';
}

// Gestione spegnimento graceful
async function sendShutdownMessage() {
    const GROUP_IDS = ['120363046559211268@g.us', '120363423664616339@g.us'];
    for (const GROUP_ID of GROUP_IDS) {
        try {
            await client.sendMessage(GROUP_ID, '🤖 GIOVABOT OFFLINE! 🤖\n\n❌ Bot spento per manutenzione\n⏰ Tornerò presto online!\n\n👋 A presto!');
        } catch (error) {
            console.error(`Errore spegnimento a ${GROUP_ID}:`, error.message);
        }
    }
}

process.on('SIGINT', async () => {
    console.log('\nSpegnimento in corso...');
    await sendShutdownMessage();
    setTimeout(() => process.exit(0), 3000);
});

process.on('SIGTERM', async () => {
    await sendShutdownMessage();
    setTimeout(() => process.exit(0), 3000);
});

// Gestore per Windows
if (process.platform === 'win32') {
    const rl = require('readline').createInterface({ input: process.stdin, output: process.stdout });
    rl.on('SIGINT', async () => {
        await sendShutdownMessage();
        setTimeout(() => process.exit(0), 3000);
    });
}

// Crea directory temp se non esiste
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

// Evita crash su errori non gestiti
process.on('unhandledRejection', (error) => {
    console.error('Errore non gestito:', error.message);
});

// Initialize client
client.initialize();

// Dashboard disattivata
// const { startDashboard } = require('./dashboard');
// startDashboard(client);
