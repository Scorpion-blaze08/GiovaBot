function extractUserNumber(userId) {
    if (!userId || typeof userId !== 'string') return null;
    return userId.split('@')[0] || null;
}

function sameUser(userA, userB) {
    const numberA = extractUserNumber(userA);
    const numberB = extractUserNumber(userB);
    return Boolean(numberA && numberB && numberA === numberB);
}

async function getSenderId(msg) {
    try {
        const contact = await msg.getContact();
        return contact?.id?._serialized || msg.author || msg.from;
    } catch {
        return msg.author || msg.from;
    }
}

function getAdminNumbers() {
    const raw = process.env.ADMIN_NUMBERS || '16209290481885';
    return raw
        .split(',')
        .map(value => value.trim())
        .filter(Boolean);
}

function isAdmin(userId) {
    const number = extractUserNumber(userId);
    if (!number) return false;
    return getAdminNumbers().includes(number);
}

function findMatchingKey(record, userId) {
    if (!record || typeof record !== 'object') return null;
    if (record[userId]) return userId;

    const number = extractUserNumber(userId);
    if (!number) return null;

    return Object.keys(record).find(key => extractUserNumber(key) === number) || null;
}

module.exports = {
    extractUserNumber,
    sameUser,
    getSenderId,
    isAdmin,
    findMatchingKey
};
