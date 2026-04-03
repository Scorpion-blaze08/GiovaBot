const fs = require('fs');
const path = require('path');

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

function updateJson(filePath, fallback, updater) {
    const current = readJson(filePath, fallback);
    const next = updater(current);
    writeJson(filePath, next);
    return next;
}

module.exports = {
    readJson,
    writeJson,
    updateJson
};
