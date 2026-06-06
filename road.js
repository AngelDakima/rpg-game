// ==================== ДОРОГА ====================

let roadState = {
    active: false,
    totalKm: 0,
    currentKm: 0,
    encounters: [],
    foundItems: [],
    goldFound: 0,
    xpFound: 0
};

// Начать путешествие
function goToRoad() {
    if (!currentPlayer) return;
    
    gameState.currentScreen = 'road';
    
    if (currentPlayer.fatigue >= 90) {
        showToast('😫 Слишком высокая усталость! Отдохните в таверне.', 'error');
        return;
    }
    
    const km = Math.floor(Math.random() * 5) + 3;
    
    const energyNeeded = km * GAME_CONSTANTS.ENERGY_COST.WALK_1KM;
    if (currentPlayer.energy < energyNeeded) {
        showToast('⚡ Недостаточно энергии для путешествия!', 'error');
        return;
    }
    
    roadState = {
        active: true,
        totalKm: km,
        currentKm: 0,
        encounters: [],
        foundItems: [],
        goldFound: 0,
        xpFound: 0
    };
    
    showRoadScreen();
}

// Экран дороги
function showRoadScreen() {
    const app = document.getElementById('app');
    const locationData = getLocationByLevel(currentPlayer.level);
    
    app.innerHTML = `
        <div class="fade-in">
            <h1>🗺️ Дорога</h1>
            
            <div class="card">
                <div class="flex-between">
                    <span>📍 Локация</span>
                    <span>${locationData.name}</span>
                </div>
                <div class="flex-between mt-10">
                    <span>📏 Путь</span>
                    <span>${roadState.currentKm} / ${roadState.totalKm} км</span>
                </div>
                <div class="stat-bar mt-10">
                    <div class="stat-bar-fill xp" style="width: ${(roadState.currentKm / roadState.totalKm) * 100}%"></div>
                </div>
                <div style="font-size: 0.8em; color: #8b5cf6; margin-top: 5px;">
                    ⚡ Энергия: ${currentPlayer.energy} / ${currentPlayer.maxEnergy}
                </div>
            </div>
            
            ${roadState.foundItems.length > 0 || roadState.goldFound > 0 ? `
                <div class="card">
                    <div class="card-header">🎒 Находки</div>
                    ${roadState.foundItems.map(item => {
                        const rarity = GAME_CONSTANTS.RARITIES[item.rarity];
                        return `<div style="font-size: 0.85em;">${rarity.emoji} ${item.name}</div>`;
                    }).join('')}
                    ${roadState.goldFound > 0 ? `<div style="font-size: 0.85em;">🪙 +${roadState.goldFound} золота</div>` : ''}
                    ${roadState.xpFound > 0 ? `<div style="font-size: 0.85em;">⭐ +${roadState.xpFound} опыта</div>` : ''}
                </div>
            ` : ''}
            
            ${roadState.encounters.length > 0 ? `
                <div class="card">
                    <div class="card-header">👾 Встречи</div>
                    ${roadState.encounters.map(enc => `
                        <div style="font-size: 0.85em; padding: 2px 0;">${enc}</div>
                    `).join('')}
                </div>
            ` : ''}
            
            ${roadState.currentKm < roadState.totalKm && roadState.active ? `
                <button onclick="walkOneKm()" class="w-full mt-10">🚶 Пройти 1 км</button>
            ` : ''}
            
            ${roadState.currentKm >= roadState.totalKm && roadState.active ? `
                <div class="card mt-10">
                    <p class="text-center">✅ Путь завершён!</p>
                </div>
                <button onclick="goToRoad()" class="w-full mt-10">🗺️ Новый путь</button>
                <button onclick="showMainScreen()" class="w-full mt-10">🏙️ В город</button>
            ` : ''}
            
            ${!roadState.active && roadState.currentKm < roadState.totalKm ? `
                <div class="card mt-10">
                    <p class="text-center" style="color: #fbbf24;">⚔️ Идёт бой!</p>
                </div>
            ` : ''}
            
            ${roadState.active ? `
                <button onclick="showMainScreen()" class="w-full mt-10">🏙️ Вернуться в город</button>
            ` : `
                <button onclick="showMainScreen()" class="w-full mt-10">🏙️ В город</button>
            `}
        </div>
    `;
}

// Пройти 1 км
function walkOneKm() {
    if (!roadState.active || roadState.currentKm >= roadState.totalKm) return;
    if (currentPlayer.energy < GAME_CONSTANTS.ENERGY_COST.WALK_1KM) {
        showToast('⚡ Недостаточно энергии!', 'error');
        return;
    }
    
    currentPlayer.energy -= GAME_CONSTANTS.ENERGY_COST.WALK_1KM;
    roadState.currentKm++;
    currentPlayer.fatigue += 2;
    if (currentPlayer.fatigue > 100) currentPlayer.fatigue = 100;
    
    // Отправка в событие: пройден 1 км
    addEventScore('km', 1);
    
    const eventRoll = Math.random() * 100;
    
    if (eventRoll < 40) {
        // Встреча с монстром
        const locationData = getLocationByLevel(currentPlayer.level);
        const monsterName = locationData.monsters[Math.floor(Math.random() * locationData.monsters.length)];
        const isBoss = Math.random() * 100 < locationData.bossChance;
        
        roadState.encounters.push(`⚔️ Встречен ${monsterName}${isBoss ? ' (Босс)' : ''}!`);
        roadState.active = false;
        savePlayerData();
        showRoadScreen();
        
        setTimeout(() => {
            startBattle(monsterName, isBoss);
        }, 300);
        return;
        
    } else if (eventRoll < 55) {
        const gold = Math.floor(Math.random() * 20 + 5) * (1 + Math.floor(currentPlayer.stats.trade / 10));
        roadState.goldFound += gold;
        currentPlayer.gold += gold;
        roadState.encounters.push(`🪙 Найдено ${gold} золота!`);
        
    } else if (eventRoll < 65) {
        const xp = Math.floor(Math.random() * 15 + 5);
        roadState.xpFound += xp;
        currentPlayer.xp += xp;
        roadState.encounters.push(`⭐ Найдено ${xp} опыта!`);
        
        // Отправка в событие: получен опыт
        addEventScore('xp', xp);
        levelUp();
        
    } else if (eventRoll < 75) {
        // Находка предмета
        let rarity;
        const itemRoll = Math.random() * 100;
        if (itemRoll < 60) rarity = 'COMMON';
        else if (itemRoll < 85) rarity = 'UNCOMMON';
        else if (itemRoll < 95) rarity = 'RARE';
        else if (itemRoll < 99) rarity = 'EPIC';
        else rarity = 'LEGENDARY';
        
        const item = generateLoot(rarity);
        addItemToInventory(item);
        roadState.foundItems.push(item);
        roadState.encounters.push(`🎁 Найден предмет: ${GAME_CONSTANTS.RARITIES[rarity].emoji} ${item.name}!`);
        
    } else if (eventRoll < 85) {
        roadState.encounters.push('...ничего интересного.');
        
    } else if (eventRoll < 95) {
        const energyLost = Math.floor(Math.random() * 5) + 3;
        currentPlayer.energy = Math.max(0, currentPlayer.energy - energyLost);
        roadState.encounters.push(`⚠️ Ловушка! Потеряно ${energyLost} энергии.`);
        
    } else {
        currentPlayer.crystals++;
        roadState.encounters.push(`💎 Найден кристалл! Всего: ${currentPlayer.crystals}`);
    }
    
    if (currentPlayer.fatigue >= 90) {
        roadState.encounters.push('😫 Вы слишком устали продолжать путь.');
        roadState.currentKm = roadState.totalKm;
    }
    
    if (roadState.currentKm >= roadState.totalKm) {
        roadState.encounters.push('📍 Вы достигли конца пути.');
        const bonusXP = roadState.totalKm * 5;
        currentPlayer.xp += bonusXP;
        roadState.xpFound += bonusXP;
        
        // Отправка в событие: бонусный опыт за завершение пути
        addEventScore('xp', bonusXP);
        levelUp();
    }
    
    savePlayerData();
    showRoadScreen();
}

// Возврат на дорогу после боя
function returnToRoad() {
    roadState.active = true;
    gameState.currentScreen = 'road';
    showRoadScreen();
}

// Отправка очков в активное событие
async function addEventScore(type, score) {
    if (!currentPlayer) return;
    
    try {
        const snapshot = await db.collection('events')
            .where('active', '==', true)
            .where('type', '==', type)
            .limit(1)
            .get();
        
        if (!snapshot.empty) {
            const eventDoc = snapshot.docs[0];
            const eventData = eventDoc.data();
            
            if (eventData.endsAt.toDate() > new Date()) {
                const participantRef = `participants.${currentPlayer.uid}`;
                
                await db.collection('events').doc(eventDoc.id).update({
                    [`${participantRef}.nick`]: currentPlayer.nick,
                    [`${participantRef}.score`]: firebase.firestore.FieldValue.increment(score),
                    [`${participantRef}.uid`]: currentPlayer.uid
                });
            }
        }
    } catch(e) {
        // Тихо игнорируем
    }
}

console.log('🗺️ Модуль дороги загружен');