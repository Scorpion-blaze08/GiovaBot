const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'achievements',
    description: 'Mostra achievement sbloccati - .achievements [gioco]',
    async execute(msg) {
        const sender = msg.author || msg.from;
        const args = msg.body.split(' ').slice(1);
        const gameFilter = args[0] ? args[0].toLowerCase() : null;
        const achievementsFile = path.join(__dirname, '..', 'data', 'achievements.json');
        
        try {
            let achievements = {};
            if (fs.existsSync(achievementsFile)) {
                achievements = JSON.parse(fs.readFileSync(achievementsFile, 'utf8'));
            }
            
            const userAchievements = achievements[sender] || {};
            
            // Mappa giochi per filtro
            const gameMap = {
                'slot': '🎰 SLOT',
                'pesca': '🎣 PESCA', 
                'dado': '🎲 DADO',
                'blackjack': '🃏 BLACKJACK',
                'cavalli': '🐎 CAVALLI',
                'duello': '⚔️ COMBATTIMENTI',
                'torneo': '⚔️ COMBATTIMENTI',
                'battaglia': '⚔️ COMBATTIMENTI',
                'combattimenti': '⚔️ COMBATTIMENTI',
                'speciali': '🏆 SPECIALI'
            };
            
            let message = '';
            
            if (gameFilter && gameMap[gameFilter]) {
                // Mostra achievement per gioco specifico
                const targetCategory = gameMap[gameFilter];
                message = `🏆 ACHIEVEMENT ${targetCategory} 🏆\n\n`;
                
                const categoryAchievements = [];
                for (const [achievementId, data] of Object.entries(userAchievements)) {
                    const achievement = getAchievementInfo(achievementId);
                    if (achievement && achievement.category === targetCategory) {
                        categoryAchievements.push(`${achievement.emoji} ${achievement.name}`);
                    }
                }
                
                if (categoryAchievements.length === 0) {
                    message += `🎯 Nessun achievement ${targetCategory.toLowerCase()} ancora!\n\n`;
                    message += `💡 Gioca a ${gameFilter} per sbloccare achievement!`;
                } else {
                    message += `📊 Sbloccati: ${categoryAchievements.length}\n\n`;
                    categoryAchievements.forEach(item => message += `• ${item}\n`);
                }
                
            } else if (gameFilter) {
                // Gioco non valido
                message = `❌ Gioco non trovato!\n\n🎮 Giochi disponibili:\n• slot\n• pesca\n• dado\n• blackjack\n• cavalli\n• combattimenti\n• speciali\n\n📝 Uso: .achievements [gioco]`;
                
            } else {
                // Mostra tutti gli achievement
                const totalUnlocked = Object.keys(userAchievements).length;
                message = `🏆 I TUOI ACHIEVEMENT 🏆\n\n`;
                message += `📊 Sbloccati: ${totalUnlocked}/50+\n\n`;
                
                if (totalUnlocked === 0) {
                    message += `🎯 Nessun achievement ancora!\n\n`;
                    message += `💡 COME SBLOCCARE:\n`;
                    message += `🎰 .achievements slot\n`;
                    message += `🎣 .achievements pesca\n`;
                    message += `🎲 .achievements dado\n`;
                    message += `🃏 .achievements blackjack\n`;
                    message += `🐎 .achievements cavalli\n`;
                    message += `⚔️ .achievements combattimenti\n\n`;
                    message += `🚀 Inizia a giocare per sbloccare achievement!`;
                } else {
                    // Raggruppa per categoria
                    const categories = {
                        '🎰 SLOT': [],
                        '🎣 PESCA': [],
                        '🎲 DADO': [],
                        '🃏 BLACKJACK': [],
                        '🐎 CAVALLI': [],
                        '⚔️ COMBATTIMENTI': [],
                        '🏆 SPECIALI': []
                    };
                    
                    for (const [achievementId, data] of Object.entries(userAchievements)) {
                        const achievement = getAchievementInfo(achievementId);
                        if (achievement) {
                            categories[achievement.category].push(`${achievement.emoji} ${achievement.name}`);
                        }
                    }
                    
                    for (const [category, items] of Object.entries(categories)) {
                        if (items.length > 0) {
                            message += `${category}: ${items.length}\n`;
                            items.forEach(item => message += `• ${item}\n`);
                            message += `\n`;
                        }
                    }
                    
                    message += `📝 Usa .achievements [gioco] per dettagli!`;
                }
            }
            
            await msg.reply(message);
            
        } catch (error) {
            console.error('Errore achievements:', error);
            await msg.reply('❌ Errore nel caricamento degli achievement!');
        }
    }
};

// Sistema achievement universale
function getAchievementInfo(id) {
    const achievements = {
        // 🎰 SLOT ACHIEVEMENTS (25 totali)
        'slot_first_win': { name: 'Prima Vincita', emoji: '🎉', category: '🎰 SLOT' },
        'slot_jackpot': { name: 'Jackpot Diamanti', emoji: '💎', category: '🎰 SLOT' },
        'slot_lucky_7': { name: 'Fortunato 7', emoji: '7️⃣', category: '🎰 SLOT' },
        'slot_cherry_lover': { name: 'Amante Ciliegie', emoji: '🍒', category: '🎰 SLOT' },
        'slot_high_roller': { name: 'High Roller', emoji: '💰', category: '🎰 SLOT' },
        'slot_streak_5': { name: 'Streak 5', emoji: '🔥', category: '🎰 SLOT' },
        'slot_star_collector': { name: 'Collezionista Stelle', emoji: '⭐', category: '🎰 SLOT' },
        'slot_bell_ringer': { name: 'Suonatore', emoji: '🔔', category: '🎰 SLOT' },
        'slot_fruit_master': { name: 'Maestro Frutta', emoji: '🍎', category: '🎰 SLOT' },
        'slot_lemon_king': { name: 'Re Limoni', emoji: '🍋', category: '🎰 SLOT' },
        'slot_orange_prince': { name: 'Principe Arance', emoji: '🍊', category: '🎰 SLOT' },
        'slot_grape_lord': { name: 'Signore Uva', emoji: '🍇', category: '🎰 SLOT' },
        'slot_lucky_streak': { name: 'Striscia Fortunata', emoji: '🍀', category: '🎰 SLOT' },
        'slot_big_winner': { name: 'Grande Vincitore', emoji: '🏆', category: '🎰 SLOT' },
        'slot_millionaire': { name: 'Milionario', emoji: '💵', category: '🎰 SLOT' },
        'slot_addicted': { name: 'Dipendente', emoji: '🎰', category: '🎰 SLOT' },
        'slot_night_owl': { name: 'Gufo Notturno', emoji: '🦉', category: '🎰 SLOT' },
        'slot_early_bird': { name: 'Mattiniero', emoji: '🐦', category: '🎰 SLOT' },
        'slot_weekend_warrior': { name: 'Guerriero Weekend', emoji: '🎆', category: '🎰 SLOT' },
        'slot_combo_master': { name: 'Maestro Combo', emoji: '🎯', category: '🎰 SLOT' },
        'slot_patient_player': { name: 'Giocatore Paziente', emoji: '⏳', category: '🎰 SLOT' },
        'slot_risk_taker': { name: 'Temerario', emoji: '🎲', category: '🎰 SLOT' },
        'slot_legend': { name: 'Leggenda Slot', emoji: '🌟', category: '🎰 SLOT' },
        'slot_perfectionist': { name: 'Perfezionista', emoji: '💯', category: '🎰 SLOT' },
        'slot_champion': { name: 'Campione Slot', emoji: '🥇', category: '🎰 SLOT' },
        
        // 🎣 PESCA ACHIEVEMENTS  
        'pesca_first_fish': { name: 'Primo Pesce', emoji: '🐟', category: '🎣 PESCA' },
        'pesca_legendary': { name: 'Leggendario!', emoji: '🐉', category: '🎣 PESCA' },
        'pesca_collector': { name: 'Collezionista', emoji: '📚', category: '🎣 PESCA' },
        'pesca_master': { name: 'Maestro Pescatore', emoji: '🎣', category: '🎣 PESCA' },
        'pesca_lucky_streak': { name: 'Fortuna Suprema', emoji: '✨', category: '🎣 PESCA' },
        
        // 🎲 DADO ACHIEVEMENTS (20 totali)
        'dado_first_roll': { name: 'Primo Lancio', emoji: '🎲', category: '🎲 DADO' },
        'dado_double_six': { name: 'Doppio 6', emoji: '🎯', category: '🎲 DADO' },
        'dado_lucky_roller': { name: 'Tiro Fortunato', emoji: '🍀', category: '🎲 DADO' },
        'dado_high_score': { name: 'Punteggio Alto', emoji: '📈', category: '🎲 DADO' },
        'dado_snake_eyes': { name: 'Occhi Serpente', emoji: '🐍', category: '🎲 DADO' },
        'dado_triple_six': { name: 'Triplo 6', emoji: '🔥', category: '🎲 DADO' },
        'dado_unlucky_one': { name: 'Sfortunato 1', emoji: '😢', category: '🎲 DADO' },
        'dado_balanced': { name: 'Equilibrato', emoji: '⚖️', category: '🎲 DADO' },
        'dado_multi_master': { name: 'Maestro Multi-Dadi', emoji: '🎲', category: '🎲 DADO' },
        'dado_perfect_roll': { name: 'Lancio Perfetto', emoji: '🎆', category: '🎲 DADO' },
        'dado_streak_king': { name: 'Re delle Strisce', emoji: '👑', category: '🎲 DADO' },
        'dado_probability_master': { name: 'Maestro Probabilità', emoji: '🧠', category: '🎲 DADO' },
        'dado_gambler': { name: 'Scommettitore', emoji: '🎰', category: '🎲 DADO' },
        'dado_mathematician': { name: 'Matematico', emoji: '📊', category: '🎲 DADO' },
        'dado_persistent': { name: 'Persistente', emoji: '💪', category: '🎲 DADO' },
        'dado_collector': { name: 'Collezionista Dadi', emoji: '📦', category: '🎲 DADO' },
        'dado_speed_roller': { name: 'Lanciatore Veloce', emoji: '⚡', category: '🎲 DADO' },
        'dado_zen_master': { name: 'Maestro Zen', emoji: '🧘', category: '🎲 DADO' },
        'dado_legend': { name: 'Leggenda Dadi', emoji: '🌟', category: '🎲 DADO' },
        'dado_champion': { name: 'Campione Dadi', emoji: '🥇', category: '🎲 DADO' },
        
        // 🃏 BLACKJACK ACHIEVEMENTS (18 totali)
        'bj_first_win': { name: 'Prima Vittoria', emoji: '🃏', category: '🃏 BLACKJACK' },
        'bj_blackjack': { name: 'Blackjack!', emoji: '🎊', category: '🃏 BLACKJACK' },
        'bj_perfect_21': { name: '21 Perfetto', emoji: '💯', category: '🃏 BLACKJACK' },
        'bj_card_counter': { name: 'Conta Carte', emoji: '🧠', category: '🃏 BLACKJACK' },
        'bj_ace_master': { name: 'Maestro Assi', emoji: '🂡', category: '🃏 BLACKJACK' },
        'bj_split_king': { name: 'Re dello Split', emoji: '✂️', category: '🃏 BLACKJACK' },
        'bj_double_down': { name: 'Raddoppiatore', emoji: '⬆️', category: '🃏 BLACKJACK' },
        'bj_insurance_expert': { name: 'Esperto Assicurazione', emoji: '🛡️', category: '🃏 BLACKJACK' },
        'bj_bust_survivor': { name: 'Sopravvissuto Sballato', emoji: '😅', category: '🃏 BLACKJACK' },
        'bj_dealer_beater': { name: 'Battitore Dealer', emoji: '🥊', category: '🃏 BLACKJACK' },
        'bj_lucky_draw': { name: 'Pescata Fortunata', emoji: '🍀', category: '🃏 BLACKJACK' },
        'bj_conservative': { name: 'Conservatore', emoji: '🛡️', category: '🃏 BLACKJACK' },
        'bj_risk_taker': { name: 'Temerario', emoji: '🔥', category: '🃏 BLACKJACK' },
        'bj_strategist': { name: 'Stratega', emoji: '🧠', category: '🃏 BLACKJACK' },
        'bj_card_shark': { name: 'Squalo delle Carte', emoji: '🦈', category: '🃏 BLACKJACK' },
        'bj_high_roller': { name: 'High Roller', emoji: '💰', category: '🃏 BLACKJACK' },
        'bj_legend': { name: 'Leggenda Blackjack', emoji: '🌟', category: '🃏 BLACKJACK' },
        'bj_champion': { name: 'Campione Blackjack', emoji: '🥇', category: '🃏 BLACKJACK' },
        
        // 🐎 CAVALLI ACHIEVEMENTS (22 totali)
        'cavalli_first_bet': { name: 'Prima Scommessa', emoji: '🐎', category: '🐎 CAVALLI' },
        'cavalli_winner': { name: 'Vincitore', emoji: '🏆', category: '🐎 CAVALLI' },
        'cavalli_longshot': { name: 'Colpo Grosso', emoji: '💥', category: '🐎 CAVALLI' },
        'cavalli_expert': { name: 'Esperto Ippico', emoji: '🎩', category: '🐎 CAVALLI' },
        'cavalli_thunder_fan': { name: 'Fan di Thunder', emoji: '⚡', category: '🐎 CAVALLI' },
        'cavalli_lightning_lover': { name: 'Amante Lightning', emoji: '🌩️', category: '🐎 CAVALLI' },
        'cavalli_storm_supporter': { name: 'Sostenitore Storm', emoji: '🌪️', category: '🐎 CAVALLI' },
        'cavalli_blaze_believer': { name: 'Credente Blaze', emoji: '🔥', category: '🐎 CAVALLI' },
        'cavalli_spirit_fan': { name: 'Fan di Spirit', emoji: '👻', category: '🐎 CAVALLI' },
        'cavalli_lucky_bettor': { name: 'Scommettitore Fortunato', emoji: '🍀', category: '🐎 CAVALLI' },
        'cavalli_underdog_picker': { name: 'Scegli Sfavoriti', emoji: '🐶', category: '🐎 CAVALLI' },
        'cavalli_favorite_hunter': { name: 'Cacciatore Favoriti', emoji: '🎯', category: '🐎 CAVALLI' },
        'cavalli_photo_finish': { name: 'Arrivo al Fotofinish', emoji: '📸', category: '🐎 CAVALLI' },
        'cavalli_jockey_whisperer': { name: 'Sussurratore Fantini', emoji: '🤫', category: '🐎 CAVALLI' },
        'cavalli_track_master': { name: 'Maestro Pista', emoji: '🏁', category: '🐎 CAVALLI' },
        'cavalli_odds_calculator': { name: 'Calcolatore Quote', emoji: '📊', category: '🐎 CAVALLI' },
        'cavalli_big_spender': { name: 'Grande Spendaccione', emoji: '💵', category: '🐎 CAVALLI' },
        'cavalli_patient_bettor': { name: 'Scommettitore Paziente', emoji: '⏳', category: '🐎 CAVALLI' },
        'cavalli_speed_demon': { name: 'Demone Velocità', emoji: '💨', category: '🐎 CAVALLI' },
        'cavalli_turf_king': { name: 'Re del Turf', emoji: '👑', category: '🐎 CAVALLI' },
        'cavalli_legend': { name: 'Leggenda Ippica', emoji: '🌟', category: '🐎 CAVALLI' },
        'cavalli_champion': { name: 'Campione Ippico', emoji: '🥇', category: '🐎 CAVALLI' },
        
        // ⚔️ COMBATTIMENTI ACHIEVEMENTS (25 totali)
        'duello_first_win': { name: 'Primo Duello', emoji: '⚔️', category: '⚔️ COMBATTIMENTI' },
        'duello_champion': { name: 'Campione Duelli', emoji: '👑', category: '⚔️ COMBATTIMENTI' },
        'torneo_winner': { name: 'Vincitore Torneo', emoji: '🏅', category: '⚔️ COMBATTIMENTI' },
        'battaglia_hero': { name: 'Eroe Battaglia', emoji: '🛡️', category: '⚔️ COMBATTIMENTI' },
        'duello_streak': { name: 'Striscia Duelli', emoji: '🔥', category: '⚔️ COMBATTIMENTI' },
        'gladiator': { name: 'Gladiatore', emoji: '🧙', category: '⚔️ COMBATTIMENTI' },
        'warrior': { name: 'Guerriero', emoji: '🧙‍♂️', category: '⚔️ COMBATTIMENTI' },
        'berserker': { name: 'Berserker', emoji: '😡', category: '⚔️ COMBATTIMENTI' },
        'strategist': { name: 'Stratega', emoji: '🧠', category: '⚔️ COMBATTIMENTI' },
        'defender': { name: 'Difensore', emoji: '🛡️', category: '⚔️ COMBATTIMENTI' },
        'attacker': { name: 'Attaccante', emoji: '🗡️', category: '⚔️ COMBATTIMENTI' },
        'tournament_king': { name: 'Re Tornei', emoji: '👑', category: '⚔️ COMBATTIMENTI' },
        'battle_lord': { name: 'Signore Battaglie', emoji: '🏰', category: '⚔️ COMBATTIMENTI' },
        'faction_leader': { name: 'Leader Fazione', emoji: '🚩', category: '⚔️ COMBATTIMENTI' },
        'undefeated': { name: 'Imbattuto', emoji: '💪', category: '⚔️ COMBATTIMENTI' },
        'comeback_king': { name: 'Re Rimonte', emoji: '🔄', category: '⚔️ COMBATTIMENTI' },
        'critical_striker': { name: 'Colpo Critico', emoji: '🎯', category: '⚔️ COMBATTIMENTI' },
        'lucky_fighter': { name: 'Combattente Fortunato', emoji: '🍀', category: '⚔️ COMBATTIMENTI' },
        'persistent_warrior': { name: 'Guerriero Persistente', emoji: '⏳', category: '⚔️ COMBATTIMENTI' },
        'arena_master': { name: 'Maestro Arena', emoji: '🏟️', category: '⚔️ COMBATTIMENTI' },
        'combat_veteran': { name: 'Veterano Combattimento', emoji: '🎖️', category: '⚔️ COMBATTIMENTI' },
        'warlord': { name: 'Signore della Guerra', emoji: '👿', category: '⚔️ COMBATTIMENTI' },
        'combat_legend': { name: 'Leggenda Combattimenti', emoji: '🌟', category: '⚔️ COMBATTIMENTI' },
        'ultimate_fighter': { name: 'Combattente Supremo', emoji: '🥇', category: '⚔️ COMBATTIMENTI' },
        'combat_god': { name: 'Dio del Combattimento', emoji: '⚡', category: '⚔️ COMBATTIMENTI' },
        
        // 🏆 SPECIALI ACHIEVEMENTS (15 totali)
        'first_command': { name: 'Primo Comando', emoji: '🚀', category: '🏆 SPECIALI' },
        'voice_user': { name: 'Utente Vocale', emoji: '🎤', category: '🏆 SPECIALI' },
        'social_butterfly': { name: 'Farfalla Sociale', emoji: '🦋', category: '🏆 SPECIALI' },
        'completionist': { name: 'Completista', emoji: '💎', category: '🏆 SPECIALI' },
        'bot_master': { name: 'Maestro Bot', emoji: '🤖', category: '🏆 SPECIALI' },
        'early_adopter': { name: 'Primo Utilizzatore', emoji: '🎆', category: '🏆 SPECIALI' },
        'helper': { name: 'Aiutante', emoji: '🤝', category: '🏆 SPECIALI' },
        'explorer': { name: 'Esploratore', emoji: '🦭', category: '🏆 SPECIALI' },
        'collector': { name: 'Collezionista Supremo', emoji: '📦', category: '🏆 SPECIALI' },
        'loyal_user': { name: 'Utente Fedele', emoji: '🐶', category: '🏆 SPECIALI' },
        'power_user': { name: 'Super Utente', emoji: '⚡', category: '🏆 SPECIALI' },
        'trendsetter': { name: 'Trendsetter', emoji: '🔥', category: '🏆 SPECIALI' },
        'community_leader': { name: 'Leader Community', emoji: '🚩', category: '🏆 SPECIALI' },
        'achievement_hunter': { name: 'Cacciatore Achievement', emoji: '🎯', category: '🏆 SPECIALI' },
        'legend': { name: 'Leggenda Assoluta', emoji: '🌟', category: '🏆 SPECIALI' }
    };
    
    return achievements[id] || null;
}

// Funzione per sbloccare achievement
global.unlockAchievement = async function(userId, achievementId, msg) {
    const achievementsFile = path.join(__dirname, '..', 'data', 'achievements.json');
    
    try {
        let achievements = {};
        if (fs.existsSync(achievementsFile)) {
            achievements = JSON.parse(fs.readFileSync(achievementsFile, 'utf8'));
        }
        
        if (!achievements[userId]) achievements[userId] = {};
        
        // Se già sbloccato, non fare nulla
        if (achievements[userId][achievementId]) return;
        
        // Sblocca achievement
        achievements[userId][achievementId] = {
            unlockedAt: Date.now(),
            date: new Date().toLocaleDateString('it-IT')
        };
        
        // Salva
        const dataDir = path.dirname(achievementsFile);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(achievementsFile, JSON.stringify(achievements, null, 2));
        
        // Notifica achievement
        const achievement = getAchievementInfo(achievementId);
        if (achievement && msg) {
            await msg.reply(`🏆 ACHIEVEMENT SBLOCCATO! 🏆\n\n${achievement.emoji} ${achievement.name}\n${achievement.category}\n\n🎉 Complimenti!`);
        }
        
    } catch (error) {
        console.error('Errore sblocco achievement:', error);
    }
};
