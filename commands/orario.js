module.exports = {
    name: 'orario',
    description: 'Mostra l\'orario scolastico',
    async execute(msg) {
        const args = msg.body.split(' ').slice(1);
        const day = args.length > 0 ? args[0].toLowerCase() : getTodayName();
        
        const schedule = {
            'lunedi': [
                '08:00-09:00 📚 Matematica',
                '09:00-10:00 🇮🇹 Italiano', 
                '10:00-11:00 ☕ Intervallo',
                '11:00-12:00 🇬🇧 Inglese',
                '12:00-13:00 🔬 Scienze',
                '13:00-14:00 🍽️ Pausa pranzo'
            ],
            'martedi': [
                '08:00-09:00 🏛️ Storia',
                '09:00-10:00 🌍 Geografia',
                '10:00-11:00 ☕ Intervallo', 
                '11:00-12:00 💻 Informatica',
                '12:00-13:00 🎨 Arte',
                '13:00-14:00 🍽️ Pausa pranzo'
            ],
            'mercoledi': [
                '08:00-09:00 📚 Matematica',
                '09:00-10:00 🇮🇹 Italiano',
                '10:00-11:00 ☕ Intervallo',
                '11:00-12:00 ⚗️ Chimica', 
                '12:00-13:00 🏃 Educazione Fisica',
                '13:00-14:00 🍽️ Pausa pranzo'
            ],
            'giovedi': [
                '08:00-09:00 🇬🇧 Inglese',
                '09:00-10:00 🏛️ Storia',
                '10:00-11:00 ☕ Intervallo',
                '11:00-12:00 📚 Matematica',
                '12:00-13:00 🎵 Musica',
                '13:00-14:00 🍽️ Pausa pranzo'
            ],
            'venerdi': [
                '08:00-09:00 🔬 Scienze',
                '09:00-10:00 🇮🇹 Italiano',
                '10:00-11:00 ☕ Intervallo',
                '11:00-12:00 🌍 Geografia',
                '12:00-13:00 💻 Informatica',
                '13:00-14:00 🍽️ Pausa pranzo'
            ],
            'sabato': [
                '📚 Sabato libero!',
                '🎮 Tempo per i compiti e il relax'
            ],
            'domenica': [
                '🏠 Domenica di riposo!',
                '📖 Preparazione per la settimana'
            ]
        };
        
        const daySchedule = schedule[day];
        
        if (!daySchedule) {
            msg.reply(`❌ Giorno non valido. Usa: lunedi, martedi, mercoledi, giovedi, venerdi, sabato, domenica`);
            return;
        }
        
        const response = `📅 ORARIO ${day.toUpperCase()}
        
${daySchedule.join('\n')}

💡 Usa: .orario [giorno] per altri giorni`;
        
        msg.reply(response);
    }
};

function getTodayName() {
    const days = ['domenica', 'lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato'];
    return days[new Date().getDay()];
}
