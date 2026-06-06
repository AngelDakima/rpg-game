// ==================== БОЕВАЯ СИСТЕМА ====================

let battleState = {
    active: false,
    monster: null,
    playerHP: 0,
    monsterHP: 0,
    maxPlayerHP: 0,
    maxMonsterHP: 0,
    log: [],
    isBoss: false,
    playerTurn: true,
    droppedItem: null
};

// Начать бой с монстром
function startBattle(monsterName, isBoss = false) {
    if (!currentPlayer) return;
    
    const cost = isBoss ? GAME_CONSTANTS.ENERGY_COST.FIGHT_BOSS : GAME_CONSTANTS.ENERGY_COST.FIGHT_NORMAL;
    if (currentPlayer.energy < cost) {
        showToast('Недостаточно энергии для боя!', 'error');
        if (roadState.encounters && roadState.encounters.length > 0) {
            returnToRoad();
        }
        return;
    }
    
    currentPlayer.energy -= cost;
    
    const monster = generateMonster(monsterName, isBoss);
    
    battleState = {
        active: true,
        monster: monster,
        playerHP: calculatePlayerHP(),
        monsterHP: monster.hp,
        maxPlayerHP: calculatePlayerHP(),
        maxMonsterHP: monster.hp,
        log: [],
        isBoss: isBoss,
        playerTurn: true,
        droppedItem: null
    };
    
    battleState.log.push(`⚔️ На вас нападает ${monster.emoji} ${monster.name}!`);
    
    gameState.currentScreen = 'battle';
    showBattleScreen();
    savePlayerData();
}

// Генерация монстра
function generateMonster(name, isBoss) {
    const baseLevel = currentPlayer.level;
    const multiplier = isBoss ? 2.5 : 1;
    
    let attack = Math.floor((baseLevel * 2 + 5) * multiplier);
    let defense = Math.floor((baseLevel * 1.2 + 3) * multiplier);
    let hp = Math.floor((baseLevel * 8 + 20) * multiplier);
    let xpReward = Math.floor((baseLevel * 3 + 10) * multiplier);
    let goldReward = Math.floor((baseLevel * 2 + 5) * multiplier);
    
    const monster = {
        name: name,
        emoji: getMonsterEmoji(name),
        attack: attack,
        defense: defense,
        hp: hp,
        maxHp: hp,
        xpReward: xpReward,
        goldReward: goldReward,
        critChance: 5 + (isBoss ? 10 : 0),
        missChance: 5,
        level: baseLevel
    };
    
    return monster;
}

// Получить эмодзи монстра
function getMonsterEmoji(name) {
    if (name.includes('Крыса')) return '🐀';
    if (name.includes('Слизень')) return '🟢';
    if (name.includes('Волк')) return '🐺';
    if (name.includes('Паук')) return '🕷️';
    if (name.includes('Скелет')) return '💀';
    if (name.includes('Дух')) return '👻';
    if (name.includes('Тролль')) return '🧟';
    if (name.includes('Ведьма')) return '🧙';
    if (name.includes('Демон')) return '😈';
    if (name.includes('Элементаль')) return '🔥';
    if (name.includes('Дракон')) return '🐉';
    if (name.includes('Титан')) return '🗿';
    if (name.includes('Древний бог')) return '👁️';
    if (name.includes('Архангел')) return '⚡';
    if (name.includes('Порождение')) return '🌌';
    if (name.includes('Владыка')) return '💀';
    return '👾';
}

// Расчёт HP игрока
function calculatePlayerHP() {
    return 50 + currentPlayer.level * 10 + currentPlayer.stats.defense * 2;
}

// Эффекты погоды на бой
function getWeatherBattleEffects() {
    const weather = gameState.weather;
    const effects = {
        playerAttackMod: 1,
        playerDefenseMod: 1,
        playerLuckMod: 0,
        monsterAttackMod: 1,
        monsterDefenseMod: 1,
        globalMissMod: 0
    };
    
    switch (weather) {
        case 'CLEAR':
            effects.playerLuckMod = 10;
            break;
        case 'RAIN':
            effects.playerAttackMod = 0.85;
            effects.playerDefenseMod = 1.05;
            break;
        case 'FOG':
            effects.globalMissMod = 20;
            break;
        case 'STORM':
            effects.playerAttackMod = 1.1;
            effects.monsterAttackMod = 1.1;
            break;
        case 'NIGHT':
            effects.monsterAttackMod = 1.2;
            effects.monsterDefenseMod = 1.2;
            break;
    }
    
    return effects;
}

// Атака игрока
function playerAttack() {
    if (!battleState.active || !battleState.playerTurn) return;
    
    battleState.playerTurn = false;
    updateBattleScreen();
    
    const weatherEffects = getWeatherBattleEffects();
    let damage = Math.floor(currentPlayer.stats.attack * weatherEffects.playerAttackMod) 
                 - battleState.monster.defense;
    
    if (damage < 1) damage = 1;
    
    let missChance = (100 - currentPlayer.stats.luck) / 200 + weatherEffects.globalMissMod / 100;
    if (currentPlayer.fatigue > 60) missChance += 0.15;
    if (currentPlayer.fatigue > 90) missChance += 0.3;
    
    if (Math.random() < missChance) {
        battleState.log.push('❌ Вы промахнулись!');
        updateBattleScreen();
        setTimeout(() => { monsterTurn(); }, 1000);
        return;
    }
    
    let critChance = currentPlayer.stats.luck / 100 + weatherEffects.playerLuckMod / 100;
    
    if (gameState.weather === 'STORM' && Math.random() < 0.2) {
        critChance = 1;
    }
    
    if (Math.random() < critChance) {
        damage *= 2;
        battleState.log.push(`💥 КРИТ! Вы наносите ${damage} урона!`);
    } else {
        battleState.log.push(`⚔️ Вы наносите ${damage} урона.`);
    }
    
    if (currentPlayer.fatigue > 30) damage = Math.floor(damage * 0.9);
    if (currentPlayer.fatigue > 60) damage = Math.floor(damage * 0.75);
    
    if (damage < 1) damage = 1;
    
    battleState.monsterHP -= damage;
    
    if (battleState.monsterHP <= 0) {
        battleState.monsterHP = 0;
        battleState.active = false;
        victory();
        return;
    }
    
    updateBattleScreen();
    
    setTimeout(() => { monsterTurn(); }, 1000);
}

// Ход монстра
function monsterTurn() {
    if (!battleState.active || battleState.monsterHP <= 0) return;
    
    const weatherEffects = getWeatherBattleEffects();
    let damage = Math.floor(battleState.monster.attack * weatherEffects.monsterAttackMod) 
                 - Math.floor(currentPlayer.stats.defense * weatherEffects.playerDefenseMod);
    
    if (damage < 1) damage = 1;
    
    let missChance = (battleState.monster.missChance + weatherEffects.globalMissMod) / 100;
    
    if (Math.random() < missChance) {
        battleState.log.push('😅 Монстр промахнулся!');
        battleState.playerTurn = true;
        updateBattleScreen();
        return;
    }
    
    if (Math.random() < battleState.monster.critChance / 100) {
        damage *= 2;
        battleState.log.push(`💢 Монстр наносит критический удар! ${damage} урона!`);
    } else {
        battleState.log.push(`👊 Монстр наносит ${damage} урона.`);
    }
    
    if (gameState.weather === 'STORM' && Math.random() < 0.2) {
        damage *= 2;
        battleState.log.push('⛈️ Гроза усиливает удар монстра!');
    }
    
    battleState.playerHP -= damage;
    
    if (battleState.playerHP <= 0) {
        battleState.playerHP = 0;
        battleState.active = false;
        defeat();
        return;
    }
    
    battleState.playerTurn = true;
    updateBattleScreen();
}

// Победа
function victory() {
    battleState.active = false;
    battleState.playerTurn = false;
    battleState.log.push(`🎉 Победа! Вы получаете ${battleState.monster.xpReward} XP и ${battleState.monster.goldReward} золота!`);
    
    currentPlayer.xp += battleState.monster.xpReward;
    currentPlayer.gold += battleState.monster.goldReward;
    currentPlayer.fatigue += battleState.isBoss ? 15 : 8;
    if (currentPlayer.fatigue > 100) currentPlayer.fatigue = 100;
    
    // Отправка в событие: убит монстр
    addEventScore('monsters', 1);
    // Отправка в событие: получен опыт
    addEventScore('xp', battleState.monster.xpReward);
    
    // Генерируем предмет
    const dropChance = Math.random() * 100;
    
    if (dropChance < 60) {
        battleState.droppedItem = generateLoot('COMMON');
    } else if (dropChance < 85) {
        battleState.droppedItem = generateLoot('UNCOMMON');
    } else if (dropChance < 95) {
        battleState.droppedItem = generateLoot('RARE');
    } else if (dropChance < 99) {
        battleState.droppedItem = generateLoot('EPIC');
    } else if (dropChance < 99.9) {
        battleState.droppedItem = generateLoot('LEGENDARY');
    } else {
        battleState.droppedItem = generateLoot('MYTHIC');
    }
    
    levelUp();
    showLootScreen();
    savePlayerData();
}

// Поражение
function defeat() {
    battleState.active = false;
    battleState.playerTurn = false;
    battleState.log.push('💀 Вы пали в бою...');
    battleState.log.push('Потеряно 10% золота.');
    
    currentPlayer.gold = Math.floor(currentPlayer.gold * 0.9);
    currentPlayer.fatigue += 20;
    if (currentPlayer.fatigue > 100) currentPlayer.fatigue = 100;
    
    battleState.droppedItem = null;
    updateBattleScreen();
    savePlayerData();
}

// Отправка очков в активное событие
async function addEventScore(type, score) {
    if (!currentPlayer) return;
    
    try {
        // Проверяем есть ли активное событие нужного типа
        const snapshot = await db.collection('events')
            .where('active', '==', true)
            .where('type', '==', type)
            .limit(1)
            .get();
        
        if (!snapshot.empty) {
            const eventDoc = snapshot.docs[0];
            const eventData = eventDoc.data();
            
            // Проверяем не закончилось ли
            if (eventData.endsAt.toDate() > new Date()) {
                // Добавляем очки
                const participantRef = `participants.${currentPlayer.uid}`;
                
                await db.collection('events').doc(eventDoc.id).update({
                    [`${participantRef}.nick`]: currentPlayer.nick,
                    [`${participantRef}.score`]: firebase.firestore.FieldValue.increment(score),
                    [`${participantRef}.uid`]: currentPlayer.uid
                });
            }
        }
    } catch(e) {
        // Тихо игнорируем ошибки событий
    }
}

// Экран с выбором — брать лут или нет
function showLootScreen() {
    const app = document.getElementById('app');
    const item = battleState.droppedItem;
    const rarity = GAME_CONSTANTS.RARITIES[item.rarity];
    const weatherData = GAME_CONSTANTS.WEATHER[gameState.weather];
    
    app.innerHTML = `
        <div class="fade-in">
            <h1>⚔️ Бой</h1>
            
            <div style="text-align: center; color: #8b5cf6; margin-bottom: 10px;">
                ${weatherData.emoji} ${weatherData.name}
            </div>
            
            <div class="card">
                <div class="flex-between">
                    <span>👤 ${currentPlayer.nick}</span>
                    <span>❤️ ${battleState.playerHP} / ${battleState.maxPlayerHP}</span>
                </div>
                <div class="stat-bar">
                    <div class="stat-bar-fill hp" style="width: ${(battleState.playerHP / battleState.maxPlayerHP) * 100}%"></div>
                </div>
            </div>
            
            <div class="card" style="border: 2px solid #fbbf24; background: #1a0020;">
                <div class="text-center">
                    <p style="color: #fbbf24; font-size: 1.2em;">🎉 Победа!</p>
                    <p>⭐ +${battleState.monster.xpReward} XP | 🪙 +${battleState.monster.goldReward} золота</p>
                </div>
            </div>
            
            <div class="card" style="border: 2px solid #9333ea;">
                <div class="text-center">
                    <p style="color: #c084fc;">🎁 Найден предмет:</p>
                    <p class="${rarity.color}" style="font-size: 1.3em; margin: 10px 0;">
                        ${rarity.emoji} ${item.name}
                    </p>
                    <p style="color: #8b5cf6;">
                        ${item.stats.attack ? '⚔️+' + item.stats.attack + ' ' : ''}
                        ${item.stats.defense ? '🛡️+' + item.stats.defense + ' ' : ''}
                        ${item.stats.luck ? '🍀+' + item.stats.luck + ' ' : ''}
                        ${item.stats.trade ? '💰+' + item.stats.trade : ''}
                    </p>
                    <p style="color: #6b21a8; font-size: 0.8em;">Тип: ${item.type === 'weapon' ? 'Оружие' : item.type === 'armor' ? 'Броня' : 'Аксессуар'}</p>
                </div>
            </div>
            
            <div class="flex gap-10 mt-10">
                <button onclick="takeLoot()" class="btn-success" style="flex: 1;">✅ Взять</button>
                <button onclick="dropLoot()" class="btn-danger" style="flex: 1;">❌ Выбросить</button>
            </div>
            
            <div class="card mt-10" style="max-height: 150px; overflow-y: auto;">
                <div class="card-header">📜 Лог боя</div>
                ${battleState.log.slice(-8).map(msg => `<div style="font-size: 0.85em; padding: 2px 0;">${msg}</div>`).join('')}
            </div>
        </div>
    `;
}

// Взять предмет
function takeLoot() {
    if (battleState.droppedItem) {
        addItemToInventory(battleState.droppedItem);
        showToast('✅ Предмет добавлен в инвентарь!', 'success');
    }
    battleState.droppedItem = null;
    showBattleResultScreen();
}

// Выбросить предмет
function dropLoot() {
    battleState.droppedItem = null;
    showToast('❌ Предмет выброшен', 'error');
    showBattleResultScreen();
}

// Финальный экран после выбора
function showBattleResultScreen() {
    const app = document.getElementById('app');
    
    app.innerHTML = `
        <div class="fade-in">
            <h1>⚔️ Бой завершён</h1>
            
            <div class="card text-center">
                <p style="color: #fbbf24; font-size: 1.2em;">🎉 Победа!</p>
                <p>⭐ +${battleState.monster.xpReward} XP</p>
                <p>🪙 +${battleState.monster.goldReward} золота</p>
                <p style="color: #8b5cf6;">😫 Усталость: ${Math.floor(currentPlayer.fatigue)}%</p>
            </div>
            
            ${roadState.encounters && roadState.encounters.length > 0 ? `
                <button onclick="returnToRoad()" class="w-full mt-10">🗺️ Продолжить путь</button>
            ` : ''}
            <button onclick="showMainScreen()" class="w-full mt-10">🏙️ В город</button>
            
            <div class="card mt-10" style="max-height: 150px; overflow-y: auto;">
                <div class="card-header">📜 Лог боя</div>
                ${battleState.log.slice(-8).map(msg => `<div style="font-size: 0.85em; padding: 2px 0;">${msg}</div>`).join('')}
            </div>
        </div>
    `;
}

// Экран боя
function showBattleScreen() {
    const app = document.getElementById('app');
    const weatherData = GAME_CONSTANTS.WEATHER[gameState.weather];
    
    app.innerHTML = `
        <div class="fade-in">
            <h1>⚔️ Бой</h1>
            
            <div style="text-align: center; color: #8b5cf6; margin-bottom: 10px;">
                ${weatherData.emoji} ${weatherData.name} • ${getWeatherDescription(gameState.weather)}
            </div>
            
            <div class="card">
                <div class="flex-between">
                    <span>👤 ${currentPlayer.nick}</span>
                    <span>❤️ ${battleState.playerHP} / ${battleState.maxPlayerHP}</span>
                </div>
                <div class="stat-bar">
                    <div class="stat-bar-fill hp" style="width: ${(battleState.playerHP / battleState.maxPlayerHP) * 100}%"></div>
                </div>
                <div style="font-size: 0.8em; color: #8b5cf6;">
                    ⚔️${Math.floor(currentPlayer.stats.attack)} 🛡️${Math.floor(currentPlayer.stats.defense)} 🍀${Math.floor(currentPlayer.stats.luck)}
                </div>
            </div>
            
            <div class="card">
                <div class="flex-between">
                    <span>${battleState.monster.emoji} ${battleState.monster.name}</span>
                    <span>❤️ ${battleState.monsterHP} / ${battleState.maxMonsterHP}</span>
                </div>
                <div class="stat-bar">
                    <div class="stat-bar-fill hp" style="width: ${(battleState.monsterHP / battleState.maxMonsterHP) * 100}%"></div>
                </div>
                <div style="font-size: 0.8em; color: #8b5cf6;">
                    Ур.${battleState.monster.level} ⚔️${battleState.monster.attack} 🛡️${battleState.monster.defense}
                </div>
            </div>
            
            ${battleState.active ? `
                <button onclick="playerAttack()" class="w-full mt-10" ${!battleState.playerTurn ? 'disabled style="opacity:0.5; background:#3b0764;"' : ''}>
                    ${battleState.playerTurn ? '⚔️ Бить!' : '⏳ Ожидание...'}
                </button>
            ` : `
                ${roadState.encounters && roadState.encounters.length > 0 ? `
                    <button onclick="returnToRoad()" class="w-full mt-10">🗺️ Продолжить путь</button>
                ` : ''}
                <button onclick="showMainScreen()" class="w-full mt-10">🏙️ В город</button>
            `}
            
            <div class="card mt-10" style="max-height: 200px; overflow-y: auto;">
                <div class="card-header">📜 Лог боя</div>
                ${battleState.log.slice(-10).map(msg => `<div style="font-size: 0.85em; padding: 2px 0;">${msg}</div>`).join('')}
            </div>
        </div>
    `;
}

// Обновление экрана боя
function updateBattleScreen() {
    showBattleScreen();
}

// Генерация лута
function generateLoot(rarity) {
    const level = currentPlayer.level;
    
    const prefixes = ['Старый', 'Крепкий', 'Острый', 'Тяжёлый', 'Лёгкий', 'Благословенный', 'Проклятый', 'Древний', 'Мистический'];
    const types = [
        { name: 'Меч', type: 'weapon', emoji: '⚔️' },
        { name: 'Щит', type: 'armor', emoji: '🛡️' },
        { name: 'Кольцо', type: 'accessory', emoji: '💍' },
        { name: 'Амулет', type: 'accessory', emoji: '📿' },
        { name: 'Шлем', type: 'armor', emoji: '⛑️' },
        { name: 'Кинжал', type: 'weapon', emoji: '🗡️' }
    ];
    
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    const rarityMultiplier = Object.keys(GAME_CONSTANTS.RARITIES).indexOf(rarity) + 1;
    
    const item = {
        name: prefix + ' ' + type.name,
        type: type.type,
        rarity: rarity,
        emoji: type.emoji,
        stats: {
            attack: type.type === 'weapon' ? Math.floor(level * 0.5 * rarityMultiplier + Math.random() * 5) : 0,
            defense: type.type === 'armor' ? Math.floor(level * 0.5 * rarityMultiplier + Math.random() * 5) : 0,
            luck: type.type === 'accessory' ? Math.floor(level * 0.3 * rarityMultiplier + Math.random() * 3) : Math.floor(Math.random() * 2),
            trade: Math.floor(Math.random() * rarityMultiplier)
        },
        durability: 100
    };
    
    return item;
}

console.log('⚔️ Боевая система загружена');