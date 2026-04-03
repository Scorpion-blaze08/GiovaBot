const startTime = Date.now();

module.exports = {
    getUptime: () => {
        const uptime = Date.now() - startTime;
        return uptime;
    }
};