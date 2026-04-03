const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'admin_config.json');

function readConfig() {
    try {
        if (!fs.existsSync(FILE)) return { maintenance: false, lockedCommands: [] };
        const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
        return {
            maintenance: Boolean(data.maintenance),
            lockedCommands: Array.isArray(data.lockedCommands) ? data.lockedCommands : []
        };
    } catch {
        return { maintenance: false, lockedCommands: [] };
    }
}

function writeConfig(config) {
    const dir = path.dirname(FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(config, null, 2));
}

function setMaintenance(enabled) {
    const config = readConfig();
    config.maintenance = Boolean(enabled);
    writeConfig(config);
    return config;
}

function lockCommand(commandName) {
    const config = readConfig();
    const normalized = String(commandName || '').toLowerCase();
    if (!normalized) return config;
    if (!config.lockedCommands.includes(normalized)) config.lockedCommands.push(normalized);
    writeConfig(config);
    return config;
}

function unlockCommand(commandName) {
    const config = readConfig();
    const normalized = String(commandName || '').toLowerCase();
    config.lockedCommands = config.lockedCommands.filter(name => name !== normalized);
    writeConfig(config);
    return config;
}

module.exports = {
    readConfig,
    writeConfig,
    setMaintenance,
    lockCommand,
    unlockCommand
};
