// ==================== ГОРОД РОНТУС ====================

// Главное меню города
function goToCity() {
    gameState.currentScreen = 'city';
    const app = document.getElementById('app');
    
    const rank = currentPlayer.rank;
    const level = currentPlayer.level;
    
    app.innerHTML = `
        <div class="fade-in">
            <h1>🏙️ Ронтус</h1>
            <p style="text-align: center; color: #6b21a8; margin-bottom: 15px;">Столица тёмных земель</p>
            
            <!-- Основные здания -->
            <div class="card">
                <div class="card-header">🏛️ Основное</div>
                <button onclick="showTavern()" class="w-full mb-10">🏚️ Таверна «Пьяный тролль»</button>
                <button onclick="showShop()" class="w-full mb-10">🏪 Лавка торговца</button>
                <button onclick="showBank()" class="w-full">🏦 Банк Ронтуса</button>
            </div>
            
            <!-- Гильдия -->
            ${level >= 31 ? `
                <div class="card">
                    <div class="card-header">⚔️ Гильдия</div>
                    <button onclick="showGuild()" class="w-full">📋 Задания гильдии</button>
                </div>
            ` : `
                <div class="card" style="opacity: 0.5;">
                    <div class="card-header">⚔️ Гильдия</div>
                    <p style="color: #6b21a8; font-size: 0.85em;">🔒 Доступно с 31 уровня (Опытный)</p>
                </div>
            `}
            
            <!-- Арена -->
            ${level >= 61 ? `
                <div class="card">
                    <div class="card-header">🏟️ Арена</div>
                    <button onclick="showArena()" class="w-full">⚔️ PvP Бои</button>
                </div>
            ` : `
                <div class="card" style="opacity: 0.5;">
                    <div class="card-header">🏟️ Арена</div>
                    <p style="color: #6b21a8; font-size: 0.85em;">🔒 Доступно с 61 уровня (Ветеран)</p>
                </div>
            `}
            
            <!-- Аукцион -->
            ${level >= 31 ? `
                <div class="card">
                    <div class="card-header">🏛️ Аукцион</div>
                    <button onclick="showAuction()" class="w-full">🔨 Торги</button>
                </div>
            ` : `
                <div class="card" style="opacity: 0.5;">
                    <div class="card-header">🏛️ Аукцион</div>
                    <p style="color: #6b21a8; font-size: 0.85em;">🔒 Доступно с 31 уровня (Опытный)</p>
                </div>
            `}
            
            <!-- Развлечения и ремёсла -->
            <div class="card">
                <div class="card-header">🎯 Развлечения</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    ${level >= 10 ? `<button onclick="showFishing()">🎣 Рыбалка</button>` : `<button disabled>🎣 (10 ур.)</button>`}
                    ${level >= 20 ? `<button onclick="showMine()">⛏️ Шахта</button>` : `<button disabled>⛏️ (20 ур.)</button>`}
                    ${level >= 25 ? `<button onclick="showGarden()">🌿 Сад</button>` : `<button disabled>🌿 (25 ур.)</button>`}
                    ${level >= 15 ? `<button onclick="showCooking()">🍳 Готовка</button>` : `<button disabled>🍳 (15 ур.)</button>`}
                    <button onclick="showLottery()">🎰 Лотерея</button>
                    <button onclick="showAchievements()">🏅 Достижения</button>
                </div>
            </div>
            
            <!-- Кланы -->
            ${level >= 61 ? `
                <div class="card">
                    <div class="card-header">🛡️ Кланы</div>
                    <button onclick="showClans()" class="w-full">⚔️ Клан-холл</button>
                </div>
            ` : `
                <div class="card" style="opacity: 0.5;">
                    <div class="card-header">🛡️ Кланы</div>
                    <p style="color: #6b21a8; font-size: 0.85em;">🔒 Доступно с 61 уровня (Ветеран)</p>
                </div>
            `}
            
            <!-- Социальное -->
            <div class="card">
                <div class="card-header">👥 Социальное</div>
                <button onclick="showFriends()" class="w-full mb-10">👫 Друзья (${currentPlayer.friends ? currentPlayer.friends.length : 0})</button>
                ${level >= 31 ? `<button onclick="showMail()" class="w-full">📬 Почта</button>` : `<button disabled class="w-full">📬 Почта (с 31 ур.)</button>`}
            </div>
            
            <button onclick="showMainScreen()" class="w-full mt-10">⬅️ На главную</button>
        </div>
    `;
}

// ==================== ТАВЕРНА ====================
function showTavern() {
    const app = document.getElementById('app');
    const restCost = Math.floor(currentPlayer.level * 2 + 10);
    
    app.innerHTML = `
        <div class="fade-in">
            <h1>🏚️ Таверна «Пьяный тролль»</h1>
            
            <div class="card">
                <p style="color: #8b5cf6;">😫 Усталость: ${Math.floor(currentPlayer.fatigue)}%</p>
                <div class="stat-bar mt-10">
                    <div class="stat-bar-fill fatigue" style="width: ${currentPlayer.fatigue}%"></div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">🍺 Отдых</div>
                <p style="font-size: 0.9em;">Снять 50% усталости</p>
                <p style="color: #fbbf24;">💰 Стоимость: ${restCost} золота</p>
                <button onclick="restInTavern(${restCost})" class="w-full" ${currentPlayer.gold < restCost ? 'disabled' : ''}>
                    🍺 Отдохнуть
                </button>
            </div>
            
            <div class="card">
                <div class="card-header">🗣️ Слухи</div>
                <p style="font-size: 0.85em; color: #a78bfa; font-style: italic;">
                    «${getRandomRumor()}»
                </p>
            </div>
            
            <button onclick="goToCity()" class="w-full mt-10">⬅️ В город</button>
        </div>
    `;
}

function restInTavern(cost) {
    if (currentPlayer.gold < cost) {
        showToast('Недостаточно золота!', 'error');
        return;
    }
    
    currentPlayer.gold -= cost;
    currentPlayer.fatigue = Math.max(0, currentPlayer.fatigue - 50);
    savePlayerData();
    showToast('🍺 Вы отдохнули! Усталость снижена на 50%', 'success');
    showTavern();
}

function getRandomRumor() {
    const rumors = [
        'Говорят, в Тёмном лесу видели редкого зверя...',
        'Кузнец вчера создал эпический меч!',
        'На болотах нашли древний амулет.',
        'Дракон в Пепельных пустошах стал сильнее.',
        'В шахте обвалился новый туннель с рудой.',
        'Аукцион сегодня богат на редкие лоты.',
        'Ночью эльфы танцуют у старого дуба.',
        'Банк повысил проценты на вклады!',
        'Грядёт великая буря, запасайтесь зельями.',
        'Тоя где-то прячет легендарный предмет...'
    ];
    return rumors[Math.floor(Math.random() * rumors.length)];
}

// ==================== ЛАВКА ====================
function showShop() {
    const app = document.getElementById('app');
    const tradeBonus = 1 - (currentPlayer.stats.trade / 200);
    
    const shopItems = [
        { name: 'Зелье здоровья', emoji: '❤️', basePrice: 50, desc: '+30 HP в бою' },
        { name: 'Зелье энергии', emoji: '⚡', basePrice: 80, desc: '+25 энергии' },
        { name: 'Свиток усиления', emoji: '📜', basePrice: 150, desc: '+10 к атаке на 3 боя' },
        { name: 'Точильный камень', emoji: '🪨', basePrice: 100, desc: '+5 к урону' },
        { name: 'Оберег', emoji: '🔮', basePrice: 200, desc: '+10 к удаче на час' }
    ];
    
    let itemsHTML = shopItems.map(item => {
        const price = Math.floor(item.basePrice * tradeBonus);
        return `
            <div class="card">
                <div class="flex-between">
                    <span>${item.emoji} ${item.name}</span>
                    <span style="color: #fbbf24;">🪙 ${price}</span>
                </div>
                <p style="font-size: 0.8em; color: #8b5cf6;">${item.desc}</p>
                <button onclick="buyShopItem('${item.name}', ${price})" class="w-full mt-10" ${currentPlayer.gold < price ? 'disabled' : ''}>
                    Купить
                </button>
            </div>
        `;
    }).join('');
    
    app.innerHTML = `
        <div class="fade-in">
            <h1>🏪 Лавка</h1>
            <p style="text-align: center; color: #6b21a8; margin-bottom: 10px;">
                Скидка от торговли: ${Math.floor(currentPlayer.stats.trade / 2)}%
            </p>
            ${itemsHTML}
            <button onclick="goToCity()" class="w-full mt-10">⬅️ В город</button>
        </div>
    `;
}

function buyShopItem(itemName, price) {
    if (currentPlayer.gold < price) {
        showToast('Недостаточно золота!', 'error');
        return;
    }
    
    currentPlayer.gold -= price;
    
    // Эффекты предметов (упрощённо)
    switch(itemName) {
        case 'Зелье здоровья':
            showToast('❤️ Куплено зелье здоровья!', 'success');
            break;
        case 'Зелье энергии':
            currentPlayer.energy = Math.min(currentPlayer.maxEnergy, currentPlayer.energy + 25);
            showToast('⚡ Энергия восстановлена!', 'success');
            break;
        case 'Свиток усиления':
            currentPlayer.stats.attack += 10;
            showToast('📜 Атака временно усилена!', 'success');
            break;
        case 'Точильный камень':
            currentPlayer.stats.attack += 5;
            showToast('🪨 Урон увеличен!', 'success');
            break;
        case 'Оберег':
            currentPlayer.stats.luck += 10;
            showToast('🔮 Удача повышена!', 'success');
            break;
    }
    
    savePlayerData();
    showShop();
}

// ==================== БАНК ====================
function showBank() {
    const app = document.getElementById('app');
    
    app.innerHTML = `
        <div class="fade-in">
            <h1>🏦 Банк Ронтуса</h1>
            
            <div class="card">
                <div class="card-header">💼 Ваш счёт</div>
                <p style="font-size: 1.2em; color: #fbbf24;">🪙 ${Math.floor(currentPlayer.gold)} золота</p>
                <p style="color: #a78bfa;">💎 ${currentPlayer.crystals} кристаллов</p>
            </div>
            
            <div class="card">
                <div class="card-header">📊 Обмен</div>
                <p style="font-size: 0.9em;">1000 золота → 1 кристалл</p>
                <button onclick="exchangeGoldToCrystals()" class="w-full" ${currentPlayer.gold < 1000 ? 'disabled' : ''}>
                    💱 Обменять 1000🪙 → 1💎
                </button>
            </div>
            
            <button onclick="goToCity()" class="w-full mt-10">⬅️ В город</button>
        </div>
    `;
}

function exchangeGoldToCrystals() {
    if (currentPlayer.gold < 1000) {
        showToast('Недостаточно золота!', 'error');
        return;
    }
    
    currentPlayer.gold -= 1000;
    currentPlayer.crystals += 1;
    savePlayerData();
    showToast('💱 Обменяно 1000 золота на 1 кристалл!', 'success');
    showBank();
}

// ==================== ГИЛЬДИЯ ====================
function showGuild() {
    const app = document.getElementById('app');
    
    app.innerHTML = `
        <div class="fade-in">
            <h1>⚔️ Гильдия</h1>
            
            <div class="card">
                <div class="card-header">📋 Ежедневные задания</div>
                <p style="font-size: 0.9em;">• Убить 5 монстров</p>
                <p style="font-size: 0.9em;">• Пройти 10 км</p>
                <p style="font-size: 0.9em;">• Продать предмет</p>
                <p style="color: #fbbf24; margin-top: 10px;">🏆 Награда: 500 золота + 200 XP</p>
                <button onclick="completeDailyQuest()" class="w-full mt-10">✅ Выполнить задания</button>
            </div>
            
            <button onclick="goToCity()" class="w-full mt-10">⬅️ В город</button>
        </div>
    `;
}

function completeDailyQuest() {
    currentPlayer.gold += 500;
    currentPlayer.xp += 200;
    levelUp();
    savePlayerData();
    showToast('✅ Задания гильдии выполнены! +500🪙 +200⭐', 'success');
    showGuild();
}

// ==================== АРЕНА (заглушка) ====================
function showArena() {
    const app = document.getElementById('app');
    
    app.innerHTML = `
        <div class="fade-in">
            <h1>🏟️ Арена</h1>
            <div class="card">
                <p style="text-align: center; color: #8b5cf6;">PvP бои в разработке</p>
            </div>
            <button onclick="goToCity()" class="w-full mt-10">⬅️ В город</button>
        </div>
    `;
}

// ==================== ПРОЧИЕ ЗАГЛУШКИ ====================
function showFishing() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="fade-in">
            <h1>🎣 Рыбалка</h1>
            <div class="card">
                <p style="text-align: center; color: #8b5cf6;">В разработке</p>
            </div>
            <button onclick="goToCity()" class="w-full mt-10">⬅️ В город</button>
        </div>
    `;
}

function showMine() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="fade-in">
            <h1>⛏️ Шахта</h1>
            <div class="card">
                <p style="text-align: center; color: #8b5cf6;">В разработке</p>
            </div>
            <button onclick="goToCity()" class="w-full mt-10">⬅️ В город</button>
        </div>
    `;
}

function showGarden() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="fade-in">
            <h1>🌿 Сад</h1>
            <div class="card">
                <p style="text-align: center; color: #8b5cf6;">В разработке</p>
            </div>
            <button onclick="goToCity()" class="w-full mt-10">⬅️ В город</button>
        </div>
    `;
}

function showCooking() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="fade-in">
            <h1>🍳 Готовка</h1>
            <div class="card">
                <p style="text-align: center; color: #8b5cf6;">В разработке</p>
            </div>
            <button onclick="goToCity()" class="w-full mt-10">⬅️ В город</button>
        </div>
    `;
}

function showLottery() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="fade-in">
            <h1>🎰 Лотерея</h1>
            <div class="card">
                <p style="text-align: center; color: #8b5cf6;">В разработке</p>
            </div>
            <button onclick="goToCity()" class="w-full mt-10">⬅️ В город</button>
        </div>
    `;
}

function showAchievements() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="fade-in">
            <h1>🏅 Достижения</h1>
            <div class="card">
                <p style="text-align: center; color: #8b5cf6;">В разработке</p>
            </div>
            <button onclick="goToCity()" class="w-full mt-10">⬅️ В город</button>
        </div>
    `;
}

function showClans() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="fade-in">
            <h1>🛡️ Кланы</h1>
            <div class="card">
                <p style="text-align: center; color: #8b5cf6;">В разработке</p>
            </div>
            <button onclick="goToCity()" class="w-full mt-10">⬅️ В город</button>
        </div>
    `;
}

function showFriends() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="fade-in">
            <h1>👫 Друзья</h1>
            <div class="card">
                <p style="text-align: center; color: #8b5cf6;">В разработке</p>
            </div>
            <button onclick="goToCity()" class="w-full mt-10">⬅️ В город</button>
        </div>
    `;
}

function showMail() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="fade-in">
            <h1>📬 Почта</h1>
            <div class="card">
                <p style="text-align: center; color: #8b5cf6;">В разработке</p>
            </div>
            <button onclick="goToCity()" class="w-full mt-10">⬅️ В город</button>
        </div>
    `;
}

console.log('🏙️ Модуль города загружен');