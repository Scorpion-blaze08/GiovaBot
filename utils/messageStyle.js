function section(title, lines = []) {
    return [title, '', ...lines].join('\n');
}

function bullets(items = []) {
    return items.map(item => `• ${item}`);
}

function kv(label, value) {
    return `${label}: ${value}`;
}

function joinBlocks(blocks = []) {
    return blocks.filter(Boolean).join('\n\n');
}

module.exports = {
    section,
    bullets,
    kv,
    joinBlocks
};
