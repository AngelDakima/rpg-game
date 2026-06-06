// ==================== ЯДРО ИГРЫ ====================

// Сохранение данных игрока
async function savePlayerData() {
    if (!currentPlayer || !gameState.isLoggedIn) return;
    
    try {
        const playerRef = db.collection('players').doc(currentPlayer.uid);
        currentPlayer.lastSave = new Date();
        
        await playerRef.update({
            level: currentPlayer.level,
            xp: currentPlayer.xp,
            gold: currentPlayer.gold,
            crystals: currentPlayer.crystals,
            energy: currentPlayer.energy,
            maxEnergy: currentPlayer.maxEnergy,
            fatigue: currentPlayer.fatigue,
            stats: currentPlayer.stats,
            rank: currentPlayer.rank,
            title: currentPlayer.title,
            reputation: currentPlayer.reputation,
            location: currentPlayer.location,
            inventory: currentPlayer.inventory,
            equipment: currentPlayer.equipment,
            friends: currentPlayer.friends,
            clan: currentPlayer.clan,
            achievements: currentPlayer.achievements,
            dailyQuests: currentPlayer.dailyQuests,
            isOnline: true,
            lastSave: firebase.firestore.FieldValue.serverTimestamp()
        });
        
    } catch (error) {
        console.error('Ошибка сохранения:', error);
    }
}

// Автосохранение каждые 5 секунд
function startSaveTimer() {
    gameState.saveTimer = setInterval(async () => {
        await savePlayerData();
    }, 5000);
}

// Восстановление энергии
function startEnergyTimer() {
    gameState.energyTimer = setInterval(() => {
        if (currentPlayer && currentPlayer.energy < currentPlayer.maxEnergy) {
            currentPlayer.energy = Math.min(
                currentPlayer.maxEnergy,
                currentPlayer.energy + 1
            );
            
            if (gameState.currentScreen === 'main') {
                updateMainScreenStats();
            }
        }
    }, getEnergyConfig(currentPlayer.level).restore * 60000);
}

// Погода меняется каждые 30 минут
function startWeatherTimer() {
    const weathers = Object.keys(GAME_CONSTANTS.WEATHER);
    gameState.weather = weathers[Math.floor(Math.random() * weathers.length)];
    
    gameState.weatherTimer = setInterval(() => {
        gameState.weather = weathers[Math.floor(Math.random() * weathers.length)];
        if (gameState.currentScreen === 'main') {
            showToast('🌤️ Погода изменилась: ' + GAME_CONSTANTS.WEATHER[gameState.weather].emoji + ' ' + GAME_CONSTANTS.WEATHER[gameState.weather].name, 'success');
        }
    }, 30 * 60000);
}

// Получение опыта для следующего уровня
function getXPForLevel(level) {
    if (level <= 10) return 100 + (level - 1) * 50;
    if (level <= 20) return 500 + (level - 11) * 150;
    if (level <= 30) return 2000 + (level - 21) * 600;
    if (level <= 40) return 8000 + (level - 31) * 1700;
    if (level <= 60) return 25000 + (level - 41) * 3750;
    if (level <= 80) return 100000 + (level - 61) * 10000;
    if (level <= 100) return 300000 + (level - 81) * 25000;
    if (level <= 120) return 800000 + (level - 101) * 60000;
    return 2000000 + (level - 121) * 150000;
}

// Повышение уровня
function levelUp() {
    const xpNeeded = getXPForLevel(currentPlayer.level);
    
    while (currentPlayer.xp >= xpNeeded && currentPlayer.level < 150) {
        currentPlayer.xp -= xpNeeded;
        currentPlayer.level++;
        
        currentPlayer.stats.attack += 2;
        currentPlayer.stats.defense += 1;
        currentPlayer.stats.luck += 0.5;
        currentPlayer.stats.trade += 0.5;
        
        if (currentPlayer.level % 10 === 0) {
            const energyConfig = getEnergyConfig(currentPlayer.level);
            currentPlayer.maxEnergy = energyConfig.max;
            currentPlayer.energy = energyConfig.max;
        }
        
        const oldRank = currentPlayer.rank;
        currentPlayer.rank = getRankByLevel(currentPlayer.level);
        currentPlayer.location = getLocationByLevel(currentPlayer.level).name;
        
        if (oldRank !== currentPlayer.rank) {
            giveRankReward(currentPlayer.rank);
        }
        
        showToast('🎉 Уровень ' + currentPlayer.level + '! Статы повышены!', 'success');
    }
    
    if (gameState.currentScreen === 'main') {
        updatePlayerInfo();
    }
}

// Награды за достижение ранга
function giveRankReward(rank) {
    switch(rank) {
        case 'EXPERIENCED':
            currentPlayer.gold += 500;
            currentPlayer.title = 'Опытный';
            addItemToInventory({
                name: 'Меч опыта',
                type: 'weapon',
                rarity: 'RARE',
                stats: { attack: 15, defense: 0, luck: 2, trade: 0 },
                emoji: '⚔️'
            });
            showToast('🎁 Получен ранг Опытного! Редкий меч в инвентаре!', 'success');
            break;
        case 'VETERAN':
            currentPlayer.gold += 2000;
            currentPlayer.crystals += 10;
            currentPlayer.title = 'Ветеран';
            addItemToInventory({
                name: 'Доспех ветерана',
                type: 'armor',
                rarity: 'EPIC',
                stats: { attack: 0, defense: 25, luck: 5, trade: 0 },
                emoji: '🛡️'
            });
            showToast('🎁 Получен ранг Ветерана! Эпический доспех в инвентаре!', 'success');
            break;
        case 'LEGEND':
            currentPlayer.gold += 10000;
            currentPlayer.crystals += 50;
            currentPlayer.title = 'Легенда';
            addItemToInventory({
                name: 'Кольцо легенды',
                type: 'accessory',
                rarity: 'LEGENDARY',
                stats: { attack: 10, defense: 10, luck: 15, trade: 10 },
                emoji: '💍'
            });
            showToast('🎁 Получен ранг Легенды! Легендарное кольцо в инвентаре!', 'success');
            break;
    }
}

// Добавить предмет в инвентарь
function addItemToInventory(item) {
    if (!currentPlayer.inventory) currentPlayer.inventory = [];
    
    const newItem = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        ...item,
        durability: 100,
        obtainedAt: new Date().toISOString()
    };
    
    currentPlayer.inventory.push(newItem);
}

// Удалить предмет из инвентаря
function removeItemFromInventory(itemId) {
    currentPlayer.inventory = currentPlayer.inventory.filter(item => item.id !== itemId);
}

// Надеть предмет
function equipItem(itemId) {
    const item = currentPlayer.inventory.find(i => i.id === itemId);
    if (!item) return;
    
    const oldItem = currentPlayer.equipment[item.type];
    if (oldItem) {
        currentPlayer.inventory.push(oldItem);
        currentPlayer.stats.attack -= oldItem.stats.attack || 0;
        currentPlayer.stats.defense -= oldItem.stats.defense || 0;
        currentPlayer.stats.luck -= oldItem.stats.luck || 0;
        currentPlayer.stats.trade -= oldItem.stats.trade || 0;
    }
    
    currentPlayer.equipment[item.type] = item;
    removeItemFromInventory(itemId);
    
    currentPlayer.stats.attack += item.stats.attack || 0;
    currentPlayer.stats.defense += item.stats.defense || 0;
    currentPlayer.stats.luck += item.stats.luck || 0;
    currentPlayer.stats.trade += item.stats.trade || 0;
    
    savePlayerData();
    showToast('✅ ' + item.name + ' надет!', 'success');
}

// Снять предмет
function unequipItem(slot) {
    const item = currentPlayer.equipment[slot];
    if (!item) return;
    
    currentPlayer.equipment[slot] = null;
    addItemToInventory(item);
    
    currentPlayer.stats.attack -= item.stats.attack || 0;
    currentPlayer.stats.defense -= item.stats.defense || 0;
    currentPlayer.stats.luck -= item.stats.luck || 0;
    currentPlayer.stats.trade -= item.stats.trade || 0;
    
    savePlayerData();
    showToast('✅ Предмет снят', 'success');
}

// Главный экран
function showMainScreen() {
    gameState.currentScreen = 'main';
    
    if (!autoRefreshInterval) {
        startAutoRefresh();
    }
    
    const app = document.getElementById('app');
    const rankData = GAME_CONSTANTS.RANKS[currentPlayer.rank];
    const xpNeeded = getXPForLevel(currentPlayer.level);
    const weatherData = GAME_CONSTANTS.WEATHER[gameState.weather];
    
    app.innerHTML = `
        <div class="fade-in">
            <div class="flex-between mb-10">
                <div>
                    <span class="${rankData.color}">${rankData.emoji} ${rankData.name}</span>
                    <span style="color: #6b21a8; margin-left: 8px;">${currentPlayer.title ? '• ' + currentPlayer.title : ''}</span>
                </div>
                <div>
                    <span style="color: #fbbf24;" id="main-gold">🪙 ${Math.floor(currentPlayer.gold)}</span>
                    <span style="color: #a78bfa; margin-left: 8px;" id="main-crystals">💎 ${currentPlayer.crystals}</span>
                </div>
            </div>
            
            <h1>
                <span class="${rankData.color}">${currentPlayer.nick}</span>
                <span style="font-size: 0.7em; color: #6b21a8;"> Ур.${currentPlayer.level}</span>
            </h1>
            
            <div id="main-event-banner"></div>
            
            <div class="mb-10">
                <div class="flex-between" style="font-size: 0.8em;">
                    <span>⭐ Опыт</span>
                    <span id="xp-text">${currentPlayer.xp} / ${xpNeeded}</span>
                </div>
                <div class="stat-bar">
                    <div class="stat-bar-fill xp" id="xp-bar" style="width: ${Math.min(100, (currentPlayer.xp / xpNeeded) * 100)}%"></div>
                </div>
            </div>
            
            <div class="mb-10">
                <div class="flex-between" style="font-size: 0.8em;">
                    <span>⚡ Энергия</span>
                    <span id="energy-text">${currentPlayer.energy} / ${currentPlayer.maxEnergy}</span>
                </div>
                <div class="stat-bar">
                    <div class="stat-bar-fill energy" id="energy-bar" style="width: ${(currentPlayer.energy / currentPlayer.maxEnergy) * 100}%"></div>
                </div>
                <div style="font-size: 0.7em; color: #6b21a8;">+1 каждые ${getEnergyConfig(currentPlayer.level).restore} мин</div>
            </div>
            
            <div class="mb-10">
                <div class="flex-between" style="font-size: 0.8em;">
                    <span>😫 Усталость</span>
                    <span id="fatigue-text">${Math.floor(currentPlayer.fatigue)}%</span>
                </div>
                <div class="stat-bar">
                    <div class="stat-bar-fill fatigue" id="fatigue-bar" style="width: ${currentPlayer.fatigue}%"></div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">📊 Статы</div>
                <div class="stat-row">
                    <span class="stat-label">⚔️ Атака</span>
                    <span class="stat-value" id="stat-attack">${Math.floor(currentPlayer.stats.attack)}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">🛡️ Защита</span>
                    <span class="stat-value" id="stat-defense">${Math.floor(currentPlayer.stats.defense)}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">🍀 Удача</span>
                    <span class="stat-value" id="stat-luck">${Math.floor(currentPlayer.stats.luck)}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">💰 Торговля</span>
                    <span class="stat-value" id="stat-trade">${Math.floor(currentPlayer.stats.trade)}</span>
                </div>
            </div>
            
            <div class="card">
                <div class="flex-between">
                    <span>🌤️ Погода</span>
                    <span>${weatherData.emoji} ${weatherData.name}</span>
                </div>
                <div style="font-size: 0.8em; color: #8b5cf6;">${getWeatherDescription(gameState.weather)}</div>
            </div>
            
            <div class="card">
                <div class="flex-between">
                    <span>🗺️ Локация</span>
                    <span>${currentPlayer.location}</span>
                </div>
            </div>
            
            <div class="flex gap-10" style="flex-wrap: wrap;">
                <button onclick="goToRoad()" style="flex: 1;">🗺️ Дорога</button>
                <button onclick="goToCity()" style="flex: 1;">🏙️ Ронтус</button>
            </div>
            
            <div class="flex gap-10 mt-10" style="flex-wrap: wrap;">
                <button onclick="showInventory()" style="flex: 1;">🎒 Инвентарь</button>
                <button onclick="showEquipment()" style="flex: 1;">⚔️ Экипировка</button>
            </div>
            
            <button onclick="showChat()" class="w-full mt-10">💬 Чат</button>
            
            ${currentPlayer.nick === GAME_CONSTANTS.ADMIN_NICK ? 
                '<button onclick="showAdminPanel()" class="w-full mt-10 btn-gold">👑 Админ-панель</button>' : ''}
            
            <button onclick="logout()" class="w-full mt-10 btn-danger">🚪 Выйти</button>
        </div>
    `;
    
    loadEventBanner();
}

// Обновление информации игрока
function updatePlayerInfo() {
    showMainScreen();
}

// Описание погоды
function getWeatherDescription(weather) {
    const descriptions = {
        CLEAR: '+10% к удаче',
        RAIN: '-15% к атаке, +5% к защите',
        FOG: '+20% к шансу промаха',
        STORM: 'Случайные криты для всех',
        NIGHT: 'Монстры сильнее на 20%'
    };
    return descriptions[weather] || '';
}

// Показать инвентарь
function showInventory() {
    const app = document.getElementById('app');
    
    let inventoryHTML = '';
    if (currentPlayer.inventory && currentPlayer.inventory.length > 0) {
        currentPlayer.inventory.forEach(item => {
            const rarity = GAME_CONSTANTS.RARITIES[item.rarity];
            inventoryHTML += `
                <div class="card">
                    <div class="flex-between">
                        <span class="${rarity.color}">${rarity.emoji} ${item.name}</span>
                        <span style="font-size: 0.8em;">🔧 ${item.durability}%</span>
                    </div>
                    <div style="font-size: 0.8em; color: #8b5cf6;">
                        ${item.stats.attack ? '⚔️+' + item.stats.attack + ' ' : ''}
                        ${item.stats.defense ? '🛡️+' + item.stats.defense + ' ' : ''}
                        ${item.stats.luck ? '🍀+' + item.stats.luck + ' ' : ''}
                        ${item.stats.trade ? '💰+' + item.stats.trade : ''}
                    </div>
                    <div class="flex gap-10 mt-10">
                        <button onclick="equipItem('${item.id}'); showInventory();">⚔️ Надеть</button>
                        <button onclick="removeItemFromInventory('${item.id}'); showInventory(); savePlayerData();" class="btn-danger">🗑️</button>
                    </div>
                </div>
            `;
        });
    } else {
        inventoryHTML = '<p class="text-center" style="color: #6b21a8;">Инвентарь пуст</p>';
    }
    
    app.innerHTML = `
        <div class="fade-in">
            <h1>🎒 Инвентарь</h1>
            ${inventoryHTML}
            <button onclick="showMainScreen()" class="w-full mt-10">⬅️ Назад</button>
        </div>
    `;
}

// Показать экипировку
function showEquipment() {
    const app = document.getElementById('app');
    
    const slots = ['weapon', 'armor', 'accessory'];
    const slotNames = { weapon: '⚔️ Оружие', armor: '🛡️ Броня', accessory: '💍 Аксессуар' };
    
    let equipmentHTML = '';
    slots.forEach(slot => {
        const item = currentPlayer.equipment[slot];
        if (item) {
            const rarity = GAME_CONSTANTS.RARITIES[item.rarity];
            equipmentHTML += `
                <div class="card">
                    <div class="flex-between">
                        <span>${slotNames[slot]}</span>
                        <span class="${rarity.color}">${rarity.emoji} ${item.name}</span>
                    </div>
                    <div style="font-size: 0.8em; color: #8b5cf6;">
                        ${item.stats.attack ? '⚔️+' + item.stats.attack + ' ' : ''}
                        ${item.stats.defense ? '🛡️+' + item.stats.defense + ' ' : ''}
                        ${item.stats.luck ? '🍀+' + item.stats.luck + ' ' : ''}
                        ${item.stats.trade ? '💰+' + item.stats.trade : ''}
                    </div>
                    <button onclick="unequipItem('${slot}'); showEquipment();" class="btn-danger mt-10">Снять</button>
                </div>
            `;
        } else {
            equipmentHTML += `
                <div class="card" style="opacity: 0.5;">
                    <span>${slotNames[slot]}</span>
                    <span style="color: #6b21a8;">Пусто</span>
                </div>
            `;
        }
    });
    
    app.innerHTML = `
        <div class="fade-in">
            <h1>⚔️ Экипировка</h1>
            ${equipmentHTML}
            <button onclick="showMainScreen()" class="w-full mt-10">⬅️ Назад</button>
        </div>
    `;
}

// Toast уведомления
function showToast(message, type = '') {
    const oldToasts = document.querySelectorAll('.toast');
    oldToasts.forEach(t => t.remove());
    
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// ==================== АВТООБНОВЛЕНИЕ ====================

let autoRefreshInterval = null;

function startAutoRefresh() {
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    
    autoRefreshInterval = setInterval(async () => {
        if (!currentPlayer || !gameState.isLoggedIn) return;
        
        try {
            const doc = await db.collection('players').doc(currentPlayer.uid).get();
            
            if (doc.exists) {
                const freshData = doc.data();
                
                currentPlayer.level = freshData.level;
                currentPlayer.xp = freshData.xp;
                currentPlayer.gold = freshData.gold;
                currentPlayer.crystals = freshData.crystals;
                currentPlayer.energy = freshData.energy;
                currentPlayer.maxEnergy = freshData.maxEnergy;
                currentPlayer.fatigue = freshData.fatigue;
                currentPlayer.stats = freshData.stats;
                currentPlayer.rank = freshData.rank;
                currentPlayer.title = freshData.title;
                currentPlayer.inventory = freshData.inventory || [];
                currentPlayer.equipment = freshData.equipment || { weapon: null, armor: null, accessory: null };
                currentPlayer.friends = freshData.friends || [];
                currentPlayer.clan = freshData.clan;
                currentPlayer.isBanned = freshData.isBanned;
                currentPlayer.isMuted = freshData.isMuted;
                
                if (currentPlayer.isBanned) {
                    showToast('⛔ Ваш аккаунт забанен!', 'error');
                    stopAutoRefresh();
                    await auth.signOut();
                    currentPlayer = null;
                    gameState.isLoggedIn = false;
                    showLoginScreen();
                    return;
                }
                
                if (gameState.currentScreen === 'main') {
                    updateMainScreenStats();
                }
            }
        } catch (error) {}
    }, 1000);
}

function updateMainScreenStats() {
    const energyText = document.getElementById('energy-text');
    const energyBar = document.getElementById('energy-bar');
    if (energyText && energyBar) {
        energyText.textContent = currentPlayer.energy + ' / ' + currentPlayer.maxEnergy;
        energyBar.style.width = (currentPlayer.energy / currentPlayer.maxEnergy) * 100 + '%';
    }
    
    const fatigueText = document.getElementById('fatigue-text');
    const fatigueBar = document.getElementById('fatigue-bar');
    if (fatigueText && fatigueBar) {
        fatigueText.textContent = Math.floor(currentPlayer.fatigue) + '%';
        fatigueBar.style.width = currentPlayer.fatigue + '%';
    }
    
    const goldEl = document.getElementById('main-gold');
    if (goldEl) goldEl.textContent = '🪙 ' + Math.floor(currentPlayer.gold);
    
    const crystalsEl = document.getElementById('main-crystals');
    if (crystalsEl) crystalsEl.textContent = '💎 ' + currentPlayer.crystals;
    
    const xpText = document.getElementById('xp-text');
    const xpBar = document.getElementById('xp-bar');
    if (xpText && xpBar) {
        const xpNeeded = getXPForLevel(currentPlayer.level);
        xpText.textContent = currentPlayer.xp + ' / ' + xpNeeded;
        xpBar.style.width = Math.min(100, (currentPlayer.xp / xpNeeded) * 100) + '%';
    }
    
    const statAttack = document.getElementById('stat-attack');
    const statDefense = document.getElementById('stat-defense');
    const statLuck = document.getElementById('stat-luck');
    const statTrade = document.getElementById('stat-trade');
    
    if (statAttack) statAttack.textContent = Math.floor(currentPlayer.stats.attack);
    if (statDefense) statDefense.textContent = Math.floor(currentPlayer.stats.defense);
    if (statLuck) statLuck.textContent = Math.floor(currentPlayer.stats.luck);
    if (statTrade) statTrade.textContent = Math.floor(currentPlayer.stats.trade);
}

function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }
}

// ==================== БАННЕР СОБЫТИЯ ====================

let eventBannerInterval = null;

async function loadEventBanner() {
    try {
        const snapshot = await db.collection('events')
            .where('active', '==', true)
            .limit(1)
            .get();
        
        const banner = document.getElementById('main-event-banner');
        if (!banner) return;
        
        if (snapshot.empty) {
            banner.innerHTML = '';
            stopEventBanner();
            return;
        }
        
        const eventData = snapshot.docs[0].data();
        const endsAt = eventData.endsAt.toDate();
        
        if (new Date() >= endsAt) {
            banner.innerHTML = '';
            stopEventBanner();
            return;
        }
        
        banner.setAttribute('data-event', JSON.stringify({
            name: eventData.name,
            type: eventData.type,
            endsAt: endsAt.getTime(),
            reward1: eventData.reward1,
            reward2: eventData.reward2,
            reward3: eventData.reward3
        }));
        
        if (!eventBannerInterval) {
            eventBannerInterval = setInterval(renderEventBanner, 1000);
        }
        
        renderEventBanner();
        
    } catch(e) {}
}

function renderEventBanner() {
    const banner = document.getElementById('main-event-banner');
    if (!banner) return;
    
    const eventStr = banner.getAttribute('data-event');
    if (!eventStr) return;
    
    const event = JSON.parse(eventStr);
    const timeLeft = Math.max(0, Math.floor((event.endsAt - Date.now()) / 1000));
    
    if (timeLeft <= 0) {
        banner.innerHTML = '';
        stopEventBanner();
        return;
    }
    
    const min = Math.floor(timeLeft / 60);
    const sec = timeLeft % 60;
    
    const typeNames = { monsters: '⚔️ Убить монстров', xp: '⭐ Получить опыт', km: '🗺️ Пройти км' };
    const typeColors = { monsters: '#dc2626', xp: '#7c3aed', km: '#10b981' };
    
    banner.innerHTML = `
        <div class="card" style="border:2px solid ${typeColors[event.type] || '#fbbf24'}; background:#1a0020; margin-bottom:10px; animation: pulse 2s infinite;">
            <div style="text-align:center;">
                <p style="color:#fbbf24; margin:0;">📡 <strong>${event.name}</strong></p>
                <p style="font-size:0.8em;color:#a78bfa; margin:4px 0;">${typeNames[event.type] || event.type}</p>
                <p style="font-size:1.3em;color:#c084fc; margin:4px 0;">⏱ ${min}:${sec.toString().padStart(2,'0')}</p>
                <div style="display:flex;gap:8px;justify-content:center;font-size:0.75em;">
                    <span style="color:#fbbf24;">🥇 ${event.reward1}🪙</span>
                    <span style="color:#a78bfa;">🥈 ${event.reward2}🪙</span>
                    <span style="color:#d97706;">🥉 ${event.reward3}🪙</span>
                </div>
                <button onclick="showEventLeaderboard()" style="margin-top:6px;padding:4px 12px;font-size:0.75em;background:#3b0764;">📊 Таблица</button>
            </div>
        </div>
    `;
}

function stopEventBanner() {
    if (eventBannerInterval) {
        clearInterval(eventBannerInterval);
        eventBannerInterval = null;
    }
}

async function showEventLeaderboard() {
    try {
        const snapshot = await db.collection('events')
            .where('active', '==', true)
            .limit(1)
            .get();
        
        if (snapshot.empty) {
            showToast('Нет активных событий', 'error');
            return;
        }
        
        const eventData = snapshot.docs[0].data();
        const participants = eventData.participants || {};
        const sorted = Object.entries(participants).sort((a, b) => b[1].score - a[1].score);
        
        const typeNames = { monsters: 'убито монстров', xp: 'получено опыта', km: 'пройдено км' };
        const medals = ['🥇', '🥈', '🥉'];
        
        let html = '';
        if (sorted.length === 0) {
            html = '<p style="text-align:center;color:#6b21a8;">Пока никто не участвует</p>';
        } else {
            for (let i = 0; i < Math.min(10, sorted.length); i++) {
                const [uid, p] = sorted[i];
                const medal = i < 3 ? medals[i] : `${i+1}.`;
                const isMe = uid === currentPlayer.uid;
                html += `
                    <div class="flex-between" style="padding:6px 0;${isMe ? 'background:#1a0030;border-radius:6px;padding:6px;' : ''}">
                        <span>${medal} <span style="color:${isMe ? '#fbbf24' : '#c084fc'};">${p.nick}${isMe ? ' (вы)' : ''}</span></span>
                        <span style="color:#fbbf24;">${p.score} ${typeNames[eventData.type]}</span>
                    </div>
                `;
            }
        }
        
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="fade-in">
                <h1>📊 Турнирная таблица</h1>
                <p style="text-align:center;color:#fbbf24;">📡 ${eventData.name}</p>
                <div class="card">${html}</div>
                <button onclick="showMainScreen()" class="w-full mt-10">⬅️ Назад</button>
            </div>
        `;
        
    } catch(e) {
        showToast('Ошибка загрузки', 'error');
    }
}

// ==================== ОТПРАВКА ОЧКОВ В СОБЫТИЯ ====================

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
            const endsAt = eventData.endsAt.toDate();
            
            if (endsAt > new Date()) {
                const participantRef = `participants.${currentPlayer.uid}`;
                
                await db.collection('events').doc(eventDoc.id).update({
                    [`${participantRef}.nick`]: currentPlayer.nick,
                    [`${participantRef}.score`]: firebase.firestore.FieldValue.increment(score),
                    [`${participantRef}.uid`]: currentPlayer.uid
                });
            }
        }
    } catch(e) {}
}

// Инициализация игры
function initGame() {
    if (!gameState.isLoggedIn) {
        showLoginScreen();
    } else {
        showMainScreen();
    }
}

// Запуск при загрузке
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(initGame, 500);
});

console.log('🎮 Ядро игры загружено');