module.exports = {
    name: 'time',
    description: 'Mostra l\'ora corrente',
    async execute(msg) {
        msg.reply(new Date().toLocaleString());
    }
};
