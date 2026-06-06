// ==================== АУКЦИОН ====================

let auctionState = {
    currentAuction: null, // 'novice', 'experienced', 'veteran', 'legend'
    lots: [],
    selectedLot: null
};

// Получить имя коллекции аукциона по рангу
function getAuctionCollection(rank) {
    const collections = {
        'NOVICE': 'auctions_novice',
        'EXPERIENCED': 'auctions_experienced',
        'VETERAN': 'auctions_veteran',
        'LEGEND': 'auctions_legend'
    };
    return collections[rank] || 'auctions_novice';
}

// Показать аукцион
async function showAuction() {
    if (!currentPlayer || currentPlayer.level < 31) {
        showToast('Аукцион доступен с 31 уровня!', 'error');
        return;
    }
    
    const app = document.getElementById('app');
    auctionState.currentAuction = currentPlayer.rank;
    const collectionName = getAuctionCollection(currentPlayer.rank);
    
    // Загружаем лоты
    app.innerHTML = `
        <div class="fade-in">
            <h1>🏛️ Аукцион</h1>
            <p style="text-align: center; color: #6b21a8;">
                ${GAME_CONSTANTS.RANKS[currentPlayer.rank].emoji} Аукцион ${GAME_CONSTANTS.RANKS[currentPlayer.rank].name}ов
            </p>
            <div id="auction-lots">
                <p style="text-align: center; color: #8b5cf6;">Загрузка лотов...</p>
            </div>
            ${currentPlayer.rank !== 'NOVICE' || currentPlayer.level >= 61 ? `
                <button onclick="showCreateLot()" class="w-full mt-10 btn-gold">📦 Выставить лот</button>
            ` : ''}
            <button onclick="goToCity()" class="w-full mt-10">⬅️ В город</button>
        </div>
    `;
    
    await loadAuctionLots();
}

// Загрузить лоты аукциона
async function loadAuctionLots() {
    const collectionName = getAuctionCollection(currentPlayer.rank);
    
    try {
        const snapshot = await db.collection(collectionName)
            .where('active', '==', true)
            .orderBy('endTime', 'asc')
            .get();
        
        auctionState.lots = [];
        snapshot.forEach(doc => {
            auctionState.lots.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        renderAuctionLots();
    } catch (error) {
        console.error('Ошибка загрузки лотов:', error);
        document.getElementById('auction-lots').innerHTML = 
            '<p style="text-align: center; color: #dc2626;">Ошибка загрузки</p>';
    }
}

// Отобразить лоты
function renderAuctionLots() {
    const container = document.getElementById('auction-lots');
    if (!container) return;
    
    if (auctionState.lots.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #6b21a8;">Нет активных лотов</p>';
        return;
    }
    
    const now = new Date();
    
    container.innerHTML = auctionState.lots.map(lot => {
        const rarity = GAME_CONSTANTS.RARITIES[lot.item.rarity];
        const timeLeft = Math.max(0, Math.floor((lot.endTime.toDate() - now) / 1000));
        const hours = Math.floor(timeLeft / 3600);
        const minutes = Math.floor((timeLeft % 3600) / 60);
        
        return `
            <div class="card">
                <div class="flex-between">
                    <span class="${rarity.color}">${rarity.emoji} ${lot.item.name}</span>
                    <span style="font-size: 0.8em;">⏰ ${hours}ч ${minutes}м</span>
                </div>
                <div style="font-size: 0.85em; color: #8b5cf6;">
                    ${lot.item.stats.attack ? '⚔️+' + lot.item.stats.attack + ' ' : ''}
                    ${lot.item.stats.defense ? '🛡️+' + lot.item.stats.defense + ' ' : ''}
                    ${lot.item.stats.luck ? '🍀+' + lot.item.stats.luck + ' ' : ''}
                    ${lot.item.stats.trade ? '💰+' + lot.item.stats.trade : ''}
                </div>
                <div class="flex-between mt-10">
                    <span>Продавец: ${lot.sellerNick}</span>
                    <span style="color: #fbbf24;">🪙 ${lot.currentBid || lot.startPrice}</span>
                </div>
                ${lot.bidderNick ? `<div style="font-size: 0.8em; color: #a78bfa;">Ставка: ${lot.bidderNick}</div>` : ''}
                ${lot.sellerUid !== currentPlayer.uid ? `
                    <button onclick="showBidOnLot('${lot.id}')" class="w-full mt-10">💰 Сделать ставку</button>
                ` : `
                    <button onclick="cancelAuctionLot('${lot.id}')" class="w-full mt-10 btn-danger">❌ Снять лот</button>
                `}
            </div>
        `;
    }).join('');
}

// Показать создание лота
function showCreateLot() {
    const app = document.getElementById('app');
    
    // Показываем только предметы из инвентаря
    let itemsHTML = '';
    if (currentPlayer.inventory && currentPlayer.inventory.length > 0) {
        itemsHTML = currentPlayer.inventory.map((item, index) => {
            const rarity = GAME_CONSTANTS.RARITIES[item.rarity];
            return `
                <option value="${index}">${rarity.emoji} ${item.name} (${rarity.name})</option>
            `;
        }).join('');
    } else {
        itemsHTML = '<option value="">Нет предметов для продажи</option>';
    }
    
    app.innerHTML = `
        <div class="fade-in">
            <h1>📦 Выставить лот</h1>
            
            <div class="card">
                <select id="lot-item" class="w-full">
                    ${itemsHTML}
                </select>
                <input type="number" id="lot-price" placeholder="🪙 Начальная цена" min="1" class="mt-10">
                <p style="font-size: 0.8em; color: #6b21a8;">⏰ Лот активен 24 часа</p>
                <button onclick="createAuctionLot()" class="w-full mt-10 btn-gold">📦 Выставить</button>
            </div>
            
            <button onclick="showAuction()" class="w-full mt-10">⬅️ Назад</button>
        </div>
    `;
}

// Создать лот
async function createAuctionLot() {
    const itemIndex = parseInt(document.getElementById('lot-item').value);
    const price = parseInt(document.getElementById('lot-price').value);
    
    if (isNaN(itemIndex) || !currentPlayer.inventory[itemIndex]) {
        showToast('Выберите предмет!', 'error');
        return;
    }
    
    if (!price || price < 1) {
        showToast('Укажите цену!', 'error');
        return;
    }
    
    const item = currentPlayer.inventory[itemIndex];
    const collectionName = getAuctionCollection(currentPlayer.rank);
    const endTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 часа
    
    try {
        await db.collection(collectionName).add({
            sellerUid: currentPlayer.uid,
            sellerNick: currentPlayer.nick,
            item: item,
            startPrice: price,
            currentBid: price,
            bidderUid: null,
            bidderNick: null,
            endTime: firebase.firestore.Timestamp.fromDate(endTime),
            active: true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Удаляем предмет из инвентаря
        currentPlayer.inventory.splice(itemIndex, 1);
        savePlayerData();
        
        showToast('✅ Лот выставлен на аукцион!', 'success');
        showAuction();
    } catch (error) {
        console.error('Ошибка создания лота:', error);
        showToast('Ошибка при выставлении лота', 'error');
    }
}

// Сделать ставку
async function showBidOnLot(lotId) {
    const lot = auctionState.lots.find(l => l.id === lotId);
    if (!lot) return;
    
    const minBid = (lot.currentBid || lot.startPrice) + Math.floor((lot.startPrice) * 0.1);
    
    const app = document.getElementById('app');
    const rarity = GAME_CONSTANTS.RARITIES[lot.item.rarity];
    
    app.innerHTML = `
        <div class="fade-in">
            <h1>💰 Ставка</h1>
            
            <div class="card">
                <p class="${rarity.color}">${rarity.emoji} ${lot.item.name}</p>
                <p style="color: #fbbf24;">Текущая ставка: 🪙 ${lot.currentBid || lot.startPrice}</p>
                <p style="color: #8b5cf6;">Минимальная ставка: 🪙 ${minBid}</p>
            </div>
            
            <div class="card">
                <input type="number" id="bid-amount" placeholder="🪙 Сумма ставки" min="${minBid}" value="${minBid}">
                <p style="font-size: 0.8em; color: #6b21a8;">Ваш баланс: 🪙 ${Math.floor(currentPlayer.gold)}</p>
                <button onclick="placeBid('${lotId}')" class="w-full mt-10 btn-gold">💰 Сделать ставку</button>
            </div>
            
            <button onclick="showAuction()" class="w-full mt-10">⬅️ Назад</button>
        </div>
    `;
}

// Разместить ставку
async function placeBid(lotId) {
    const amount = parseInt(document.getElementById('bid-amount').value);
    const lot = auctionState.lots.find(l => l.id === lotId);
    
    if (!lot) {
        showToast('Лот не найден', 'error');
        return;
    }
    
    const minBid = (lot.currentBid || lot.startPrice) + Math.floor(lot.startPrice * 0.1);
    
    if (!amount || amount < minBid) {
        showToast('Ставка слишком мала! Минимум: ' + minBid, 'error');
        return;
    }
    
    if (currentPlayer.gold < amount) {
        showToast('Недостаточно золота!', 'error');
        return;
    }
    
    try {
        const collectionName = getAuctionCollection(currentPlayer.rank);
        
        // Возвращаем золото предыдущему игроку
        if (lot.bidderUid && lot.bidderUid !== currentPlayer.uid) {
            const prevBidderRef = db.collection('players').doc(lot.bidderUid);
            const prevBidderDoc = await prevBidderRef.get();
            if (prevBidderDoc.exists) {
                await prevBidderRef.update({
                    gold: firebase.firestore.FieldValue.increment(lot.currentBid || lot.startPrice)
                });
            }
        }
        
        // Обновляем лот
        await db.collection(collectionName).doc(lotId).update({
            currentBid: amount,
            bidderUid: currentPlayer.uid,
            bidderNick: currentPlayer.nick
        });
        
        // Списываем золото
        currentPlayer.gold -= amount;
        savePlayerData();
        
        showToast('✅ Ставка принята!', 'success');
        showAuction();
    } catch (error) {
        console.error('Ошибка ставки:', error);
        showToast('Ошибка при размещении ставки', 'error');
    }
}

// Снять лот с аукциона
async function cancelAuctionLot(lotId) {
    if (!confirm('Снять лот с аукциона?')) return;
    
    try {
        const collectionName = getAuctionCollection(currentPlayer.rank);
        const lot = auctionState.lots.find(l => l.id === lotId);
        
        // Возвращаем предмет владельцу
        if (lot) {
            addItemToInventory(lot.item);
            
            // Если была ставка, возвращаем золото
            if (lot.bidderUid) {
                const bidderRef = db.collection('players').doc(lot.bidderUid);
                await bidderRef.update({
                    gold: firebase.firestore.FieldValue.increment(lot.currentBid || lot.startPrice)
                });
            }
        }
        
        await db.collection(collectionName).doc(lotId).update({ active: false });
        savePlayerData();
        
        showToast('✅ Лот снят с аукциона', 'success');
        showAuction();
    } catch (error) {
        console.error('Ошибка снятия лота:', error);
        showToast('Ошибка при снятии лота', 'error');
    }
}

// Проверка истёкших лотов (вызывается периодически)
async function checkExpiredAuctions() {
    const ranks = ['NOVICE', 'EXPERIENCED', 'VETERAN', 'LEGEND'];
    
    for (const rank of ranks) {
        const collectionName = getAuctionCollection(rank);
        const now = new Date();
        
        try {
            const snapshot = await db.collection(collectionName)
                .where('active', '==', true)
                .where('endTime', '<=', firebase.firestore.Timestamp.fromDate(now))
                .get();
            
            snapshot.forEach(async (doc) => {
                const lot = doc.data();
                
                // Если есть ставка — отдаём предмет победителю
                if (lot.bidderUid) {
                    const winnerRef = db.collection('players').doc(lot.bidderUid);
                    const winnerDoc = await winnerRef.get();
                    
                    if (winnerDoc.exists) {
                        const winnerData = winnerDoc.data();
                        winnerData.inventory = winnerData.inventory || [];
                        winnerData.inventory.push(lot.item);
                        await winnerRef.update({ inventory: winnerData.inventory });
                    }
                } else {
                    // Возвращаем предмет продавцу
                    const sellerRef = db.collection('players').doc(lot.sellerUid);
                    const sellerDoc = await sellerRef.get();
                    
                    if (sellerDoc.exists) {
                        const sellerData = sellerDoc.data();
                        sellerData.inventory = sellerData.inventory || [];
                        sellerData.inventory.push(lot.item);
                        await sellerRef.update({ inventory: sellerData.inventory });
                    }
                }
                
                // Деактивируем лот
                await db.collection(collectionName).doc(doc.id).update({ active: false });
            });
        } catch (error) {
            console.error('Ошибка проверки аукциона:', error);
        }
    }
}

// Запускаем проверку аукциона каждые 5 минут
setInterval(checkExpiredAuctions, 5 * 60000);

console.log('🏛️ Модуль аукциона загружен');