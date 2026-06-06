// ==================== АДМИН-ПАНЕЛЬ ====================

let adminState = {
    selectedPlayer: null,
    selectedPlayerData: null
};

let activeEvent = null;
let eventCheckInterval = null;

function showAdminPanel() {
    if (currentPlayer.nick !== 'Тоя') {
        showToast('Доступ запрещён!', 'error');
        return;
    }
    
    gameState.currentScreen = 'admin';
    const app = document.getElementById('app');
    
    app.innerHTML = `
        <div class="fade-in">
            <h1>👑 Админ-панель</h1>
            <p style="text-align:center;color:#fbbf24;margin-bottom:15px;">Добро пожаловать, Тоя</p>
            
            <!-- Поиск -->
            <div class="card" style="border:2px solid #9333ea;">
                <div class="card-header">🔍 Поиск игрока</div>
                <input type="text" id="admin-nick-input" placeholder="📝 Введите ник...">
                <button id="admin-search-btn" class="w-full mt-10">🔍 Найти</button>
            </div>
            
            <div id="admin-info" style="margin:10px 0;"></div>
            
            <!-- Выдача -->
            <div class="card" id="admin-give-card" style="display:none;border:2px solid #fbbf24;">
                <div class="card-header">🎁 Изменить ресурсы</div>
                
                <div class="stat-row" style="padding:8px 0;">
                    <span>🪙 Золото</span>
                    <div class="flex gap-10" style="align-items:center;">
                        <button class="btn-danger admin-minus" data-target="admin-gold" style="padding:8px 14px;">−</button>
                        <input type="number" id="admin-gold" value="0" style="width:80px;text-align:center;padding:8px;">
                        <button class="btn-success admin-plus" data-target="admin-gold" style="padding:8px 14px;">+</button>
                    </div>
                </div>
                
                <div class="stat-row" style="padding:8px 0;">
                    <span>💎 Кристаллы</span>
                    <div class="flex gap-10" style="align-items:center;">
                        <button class="btn-danger admin-minus" data-target="admin-crystals" style="padding:8px 14px;">−</button>
                        <input type="number" id="admin-crystals" value="0" style="width:80px;text-align:center;padding:8px;">
                        <button class="btn-success admin-plus" data-target="admin-crystals" style="padding:8px 14px;">+</button>
                    </div>
                </div>
                
                <div class="stat-row" style="padding:8px 0;">
                    <span>⭐ Опыт</span>
                    <div class="flex gap-10" style="align-items:center;">
                        <button class="btn-danger admin-minus" data-target="admin-xp" style="padding:8px 14px;">−</button>
                        <input type="number" id="admin-xp" value="0" style="width:80px;text-align:center;padding:8px;">
                        <button class="btn-success admin-plus" data-target="admin-xp" style="padding:8px 14px;">+</button>
                    </div>
                </div>
                
                <div class="stat-row" style="padding:8px 0;">
                    <span>⚡ Энергия</span>
                    <div class="flex gap-10" style="align-items:center;">
                        <button class="btn-danger admin-minus" data-target="admin-energy" style="padding:8px 14px;">−</button>
                        <input type="number" id="admin-energy" value="0" style="width:80px;text-align:center;padding:8px;">
                        <button class="btn-success admin-plus" data-target="admin-energy" style="padding:8px 14px;">+</button>
                    </div>
                </div>
                
                <button id="admin-give-btn" class="w-full mt-10" style="background: linear-gradient(135deg, #fbbf24, #d97706); color:#000; font-weight:bold;">
                    💾 Применить
                </button>
            </div>
            
            <!-- Модерация -->
            <div class="card" id="admin-mod-card" style="display:none;border:2px solid #dc2626;">
                <div class="card-header">🔨 Модерация</div>
                <div class="flex gap-10">
                    <button id="admin-ban-btn" class="btn-danger" style="flex:1;">⛔ Бан</button>
                    <button id="admin-unban-btn" class="btn-success" style="flex:1;">✅ Разбан</button>
                </div>
                <div class="flex gap-10 mt-10">
                    <button id="admin-mute-btn" class="btn-danger" style="flex:1;">🔇 Мут</button>
                    <button id="admin-unmute-btn" class="btn-success" style="flex:1;">✅ Размут</button>
                </div>
            </div>
            
            <!-- Действия -->
            <div class="card" id="admin-actions-card" style="display:none;border:2px solid #9333ea;">
                <div class="card-header">⚙️ Действия</div>
                <button id="admin-reset-btn" class="w-full mb-10" style="background: linear-gradient(135deg, #d97706, #92400e);">🔄 Сброс аккаунта</button>
                <div id="admin-reset-confirm" style="display:none;">
                    <div class="card" style="border:2px solid #fbbf24;margin-top:8px;">
                        <p style="text-align:center;color:#fbbf24;">⚠️ Точно сбросить?</p>
                        <div class="flex gap-10">
                            <button id="admin-reset-yes" class="btn-gold" style="flex:1;">✅ Да</button>
                            <button id="admin-reset-no" style="flex:1;">❌ Нет</button>
                        </div>
                    </div>
                </div>
                <button id="admin-delete-btn" class="w-full mt-10 btn-danger">🗑️ Удалить аккаунт</button>
                <div id="admin-delete-confirm" style="display:none;">
                    <div class="card" style="border:2px solid #dc2626;margin-top:8px;">
                        <p style="text-align:center;color:#dc2626;">⚠️ Удалить навсегда?</p>
                        <div class="flex gap-10">
                            <button id="admin-delete-yes" class="btn-danger" style="flex:1;">🗑️ Да</button>
                            <button id="admin-delete-no" style="flex:1;">❌ Нет</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Онлайн -->
            <div class="card" style="border:2px solid #10b981;margin-top:15px;">
                <div class="card-header">🟢 Игроки онлайн</div>
                <button id="admin-online-btn" class="w-full btn-success">📋 Показать онлайн</button>
                <div id="admin-online-list" style="margin-top:10px;"></div>
            </div>
            
            <!-- СОБЫТИЯ -->
            <div class="card" style="border:2px solid #8b5cf6;margin-top:15px;">
                <div class="card-header">📡 События</div>
                
                <div style="margin:8px 0;">
                    <label style="color:#a78bfa;">📝 Название</label>
                    <input type="text" id="admin-event-name" placeholder="Великая охота">
                </div>
                
                <div style="margin:8px 0;">
                    <label style="color:#a78bfa;">📋 Описание</label>
                    <textarea id="admin-event-desc" rows="2" placeholder="Убей как можно больше монстров!"></textarea>
                </div>
                
                <div style="margin:8px 0;">
                    <label style="color:#a78bfa;">🎯 Тип события</label>
                    <select id="admin-event-type">
                        <option value="monsters">⚔️ Убить монстров</option>
                        <option value="xp">⭐ Получить опыт</option>
                        <option value="km">🗺️ Пройти километров</option>
                    </select>
                </div>
                
                <div style="margin:8px 0;">
                    <label style="color:#a78bfa;">⏱ Длительность (минут)</label>
                    <input type="number" id="admin-event-duration" value="5" min="1" max="1440">
                </div>
                
                <div style="margin:8px 0;">
                    <label style="color:#a78bfa;">🥇 Награда 1 место</label>
                    <input type="number" id="admin-event-reward1" value="500" min="0">
                </div>
                
                <div style="margin:8px 0;">
                    <label style="color:#a78bfa;">🥈 Награда 2 место</label>
                    <input type="number" id="admin-event-reward2" value="250" min="0">
                </div>
                
                <div style="margin:8px 0;">
                    <label style="color:#a78bfa;">🥉 Награда 3 место</label>
                    <input type="number" id="admin-event-reward3" value="100" min="0">
                </div>
                
                <button id="admin-event-start" class="w-full mt-10" style="background: linear-gradient(135deg, #7c3aed, #a78bfa);">📡 Запустить</button>
                <button id="admin-event-stop" class="w-full mt-10 btn-danger">⏹ Остановить</button>
                
                <div id="admin-event-status" style="margin-top:10px;"></div>
                <div id="admin-event-results" style="margin-top:10px;"></div>
            </div>
            
            <button onclick="showMainScreen()" class="w-full mt-10">⬅️ На главную</button>
        </div>
    `;
    
    // Привязка обработчиков
    document.getElementById('admin-search-btn').addEventListener('click', adminSearchPlayer);
    document.getElementById('admin-give-btn').addEventListener('click', adminGiveResources);
    
    document.querySelectorAll('.admin-plus').forEach(btn => {
        btn.addEventListener('click', function() {
            const input = document.getElementById(this.getAttribute('data-target'));
            if (input) input.value = (parseInt(input.value) || 0) + 1;
        });
    });
    
    document.querySelectorAll('.admin-minus').forEach(btn => {
        btn.addEventListener('click', function() {
            const input = document.getElementById(this.getAttribute('data-target'));
            if (input) input.value = (parseInt(input.value) || 0) - 1;
        });
    });
    
    document.getElementById('admin-ban-btn').addEventListener('click', adminBanPlayer);
    document.getElementById('admin-unban-btn').addEventListener('click', adminUnbanPlayer);
    document.getElementById('admin-mute-btn').addEventListener('click', adminMutePlayer);
    document.getElementById('admin-unmute-btn').addEventListener('click', adminUnmutePlayer);
    
    document.getElementById('admin-reset-btn').addEventListener('click', () => {
        document.getElementById('admin-reset-confirm').style.display = 'block';
    });
    document.getElementById('admin-reset-yes').addEventListener('click', adminResetPlayer);
    document.getElementById('admin-reset-no').addEventListener('click', () => {
        document.getElementById('admin-reset-confirm').style.display = 'none';
    });
    
    document.getElementById('admin-delete-btn').addEventListener('click', () => {
        document.getElementById('admin-delete-confirm').style.display = 'block';
    });
    document.getElementById('admin-delete-yes').addEventListener('click', adminDeletePlayer);
    document.getElementById('admin-delete-no').addEventListener('click', () => {
        document.getElementById('admin-delete-confirm').style.display = 'none';
    });
    
    document.getElementById('admin-online-btn').addEventListener('click', adminShowOnline);
    document.getElementById('admin-event-start').addEventListener('click', adminStartEvent);
    document.getElementById('admin-event-stop').addEventListener('click', adminStopEvent);
    
    checkActiveEvent();
}

// ==================== СОБЫТИЯ ====================

async function checkActiveEvent() {
    try {
        const snapshot = await db.collection('events')
            .where('active', '==', true)
            .orderBy('startedAt', 'desc')
            .limit(1)
            .get();
        
        if (!snapshot.empty) {
            const eventDoc = snapshot.docs[0];
            const eventData = eventDoc.data();
            
            activeEvent = {
                id: eventDoc.id,
                ...eventData,
                endsAt: eventData.endsAt.toDate()
            };
            
            if (new Date() >= activeEvent.endsAt) {
                await finishEvent(activeEvent);
            } else {
                startEventTimer();
                updateEventStatus();
            }
        } else {
            activeEvent = null;
        }
    } catch(e) {
        console.error('Ошибка проверки:', e);
    }
}

async function adminStartEvent() {
    const nameEl = document.getElementById('admin-event-name');
    const descEl = document.getElementById('admin-event-desc');
    const typeEl = document.getElementById('admin-event-type');
    const durationEl = document.getElementById('admin-event-duration');
    const reward1El = document.getElementById('admin-event-reward1');
    const reward2El = document.getElementById('admin-event-reward2');
    const reward3El = document.getElementById('admin-event-reward3');
    
    if (!nameEl || !typeEl || !durationEl) {
        showToast('Ошибка интерфейса!', 'error');
        return;
    }
    
    const name = nameEl.value.trim();
    const desc = descEl ? descEl.value.trim() : '';
    const type = typeEl.value;
    const duration = parseInt(durationEl.value) || 5;
    const reward1 = reward1El ? (parseInt(reward1El.value) || 500) : 500;
    const reward2 = reward2El ? (parseInt(reward2El.value) || 250) : 250;
    const reward3 = reward3El ? (parseInt(reward3El.value) || 100) : 100;
    
    if (!name) {
        showToast('Введите название!', 'error');
        return;
    }
    
    try {
        const activeSnap = await db.collection('events').where('active', '==', true).get();
        if (!activeSnap.empty) {
            showToast('Уже есть активное событие! Остановите его.', 'error');
            return;
        }
        
        const endsAt = new Date(Date.now() + duration * 60000);
        
        const eventData = {
            name: name,
            description: desc,
            type: type,
            duration: duration,
            reward1: reward1,
            reward2: reward2,
            reward3: reward3,
            startedAt: firebase.firestore.FieldValue.serverTimestamp(),
            endsAt: firebase.firestore.Timestamp.fromDate(endsAt),
            active: true,
            createdBy: 'Тоя',
            participants: {}
        };
        
        const docRef = await db.collection('events').add(eventData);
        
        activeEvent = {
            id: docRef.id,
            ...eventData,
            endsAt: endsAt,
            participants: {}
        };
        
        startEventTimer();
        updateEventStatus();
        
        nameEl.value = '';
        if (descEl) descEl.value = '';
        durationEl.value = '5';
        if (reward1El) reward1El.value = '500';
        if (reward2El) reward2El.value = '250';
        if (reward3El) reward3El.value = '100';
        
        showToast('📡 Событие запущено: ' + name, 'success');
        
    } catch(e) {
        console.error('Ошибка создания:', e);
        showToast('Ошибка: ' + e.message, 'error');
    }
}

async function adminStopEvent() {
    try {
        const snapshot = await db.collection('events')
            .where('active', '==', true)
            .limit(1)
            .get();
        
        if (snapshot.empty) {
            showToast('Нет активного события!', 'error');
            return;
        }
        
        const eventDoc = snapshot.docs[0];
        const eventData = eventDoc.data();
        
        await finishEvent({
            id: eventDoc.id,
            ...eventData,
            endsAt: eventData.endsAt.toDate()
        });
        
    } catch(e) {
        console.error('Ошибка остановки:', e);
        showToast('Ошибка: ' + e.message, 'error');
    }
}

async function finishEvent(eventData) {
    try {
        const doc = await db.collection('events').doc(eventData.id).get();
        const data = doc.data();
        const participants = data.participants || {};
        
        const sorted = Object.entries(participants)
            .sort((a, b) => b[1].score - a[1].score);
        
        const rewards = [data.reward1, data.reward2, data.reward3];
        
        for (let i = 0; i < Math.min(3, sorted.length); i++) {
            const [uid, pData] = sorted[i];
            const reward = rewards[i];
            
            if (reward > 0) {
                await db.collection('players').doc(uid).update({
                    gold: firebase.firestore.FieldValue.increment(reward)
                });
            }
            
            await db.collection('events').doc(eventData.id).update({
                [`participants.${uid}.place`]: i + 1,
                [`participants.${uid}.reward`]: reward
            });
        }
        
        await db.collection('events').doc(eventData.id).update({
            active: false,
            winners: sorted.slice(0, 3).map(([uid, p], idx) => ({
                uid, nick: p.nick, score: p.score, place: idx + 1
            }))
        });
        
        // Безопасно показываем результаты
        const statusDiv = document.getElementById('admin-event-status');
        const resultsDiv = document.getElementById('admin-event-results');
        
        if (statusDiv && resultsDiv) {
            showEventResults(sorted, data);
            statusDiv.innerHTML = '<p style="color:#10b981;text-align:center;">✅ Событие завершено! Награды выданы.</p>';
        }
        
        activeEvent = null;
        if (eventCheckInterval) clearInterval(eventCheckInterval);
        
        showToast('🏆 Событие завершено! Награды выданы.', 'success');
        
    } catch(e) {
        console.error('Ошибка завершения:', e);
    }
}

function showEventResults(sorted, eventData) {
    const div = document.getElementById('admin-event-results');
    if (!div) return;
    
    const medals = ['🥇', '🥈', '🥉'];
    const typeNames = {
        monsters: 'убито монстров',
        xp: 'получено опыта',
        km: 'пройдено км'
    };
    
    let html = `<div class="card" style="border:2px solid #fbbf24;"><div class="card-header">🏆 Результаты</div>`;
    
    if (sorted.length === 0) {
        html += '<p style="text-align:center;color:#6b21a8;">Никто не участвовал</p>';
    } else {
        for (let i = 0; i < Math.min(10, sorted.length); i++) {
            const [uid, p] = sorted[i];
            const medal = i < 3 ? medals[i] : `${i+1}.`;
            html += `
                <div class="flex-between" style="padding:4px 0;">
                    <span>${medal} <span style="color:#c084fc;">${p.nick}</span></span>
                    <span style="color:#fbbf24;">${p.score} ${typeNames[eventData.type]}</span>
                </div>
            `;
        }
    }
    
    html += '</div>';
    div.innerHTML = html;
}

function startEventTimer() {
    if (eventCheckInterval) clearInterval(eventCheckInterval);
    
    eventCheckInterval = setInterval(async () => {
        if (!activeEvent) {
            clearInterval(eventCheckInterval);
            return;
        }
        
        if (new Date() >= activeEvent.endsAt) {
            await finishEvent(activeEvent);
        } else {
            if (gameState.currentScreen === 'admin') {
                updateEventStatus();
                await updateEventLeaderboard();
            }
        }
    }, 5000);
}

function updateEventStatus() {
    const div = document.getElementById('admin-event-status');
    if (!div || !activeEvent) return;
    
    const now = new Date();
    const timeLeft = Math.max(0, Math.floor((activeEvent.endsAt - now) / 1000));
    const min = Math.floor(timeLeft / 60);
    const sec = timeLeft % 60;
    
    const typeNames = {
        monsters: '⚔️ Убить монстров',
        xp: '⭐ Получить опыт',
        km: '🗺️ Пройти км'
    };
    
    div.innerHTML = `
        <div class="card" style="border:2px solid #fbbf24;background:#1a0020;">
            <p style="color:#fbbf24;text-align:center;">📡 <strong>${activeEvent.name}</strong></p>
            <p style="text-align:center;font-size:0.9em;color:#a78bfa;">${typeNames[activeEvent.type]}</p>
            <p style="text-align:center;font-size:1.5em;color:#c084fc;">⏱ ${min}:${sec.toString().padStart(2,'0')}</p>
            <p style="text-align:center;font-size:0.8em;color:#8b5cf6;">до окончания</p>
        </div>
    `;
}

async function updateEventLeaderboard() {
    if (!activeEvent) return;
    
    try {
        const doc = await db.collection('events').doc(activeEvent.id).get();
        const data = doc.data();
        const participants = data.participants || {};
        
        const sorted = Object.entries(participants)
            .sort((a, b) => b[1].score - a[1].score);
        
        showEventResults(sorted, data);
    } catch(e) {}
}

// ==================== ПОИСК ====================
async function adminSearchPlayer() {
    const nick = document.getElementById('admin-nick-input').value.trim();
    if (!nick) { showToast('Введите ник!', 'error'); return; }
    
    try {
        const snapshot = await db.collection('players').where('nick', '==', nick).limit(1).get();
        
        if (snapshot.empty) {
            showToast('Игрок не найден', 'error');
            adminState.selectedPlayer = null;
            adminState.selectedPlayerData = null;
            document.getElementById('admin-info').innerHTML = '';
            hideAdminCards();
            return;
        }
        
        const doc = snapshot.docs[0];
        adminState.selectedPlayer = doc.id;
        adminState.selectedPlayerData = doc.data();
        adminState.selectedPlayerData.uid = doc.id;
        
        updatePlayerInfoCard();
        document.getElementById('admin-give-card').style.display = 'block';
        document.getElementById('admin-mod-card').style.display = 'block';
        document.getElementById('admin-actions-card').style.display = 'block';
        
        showToast('✅ Найден: ' + adminState.selectedPlayerData.nick, 'success');
    } catch(e) { showToast('Ошибка', 'error'); }
}

function updatePlayerInfoCard() {
    const p = adminState.selectedPlayerData;
    if (!p) return;
    const rd = GAME_CONSTANTS.RANKS[p.rank] || GAME_CONSTANTS.RANKS.NOVICE;
    
    document.getElementById('admin-info').innerHTML = `
        <div class="card" style="border:2px solid #9333ea;background:#1a0030;">
            <div style="text-align:center;margin-bottom:10px;">
                <span class="${rd.color}" style="font-size:1.2em;">${rd.emoji} ${p.nick}</span>
                <span style="color:#6b21a8;"> • Ур.${p.level}</span>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:0.9em;">
                <div>⭐ XP: ${p.xp||0}</div>
                <div>🪙 ${p.gold||0}</div>
                <div>💎 ${p.crystals||0}</div>
                <div>⚡ ${p.energy||0}/${p.maxEnergy||100}</div>
            </div>
            <div style="display:flex;gap:8px;margin-top:8px;justify-content:center;font-size:0.85em;">
                <span>${p.isOnline?'🟢':'🔴'}</span>
                <span>${p.isBanned?'⛔':'✅'}</span>
                <span>${p.isMuted?'🔇':'✅'}</span>
            </div>
        </div>
    `;
}

function hideAdminCards() {
    document.getElementById('admin-give-card').style.display = 'none';
    document.getElementById('admin-mod-card').style.display = 'none';
    document.getElementById('admin-actions-card').style.display = 'none';
}

// ==================== ОНЛАЙН ====================
async function adminShowOnline() {
    const div = document.getElementById('admin-online-list');
    div.innerHTML = '<p style="text-align:center;">Загрузка...</p>';
    
    try {
        const snap = await db.collection('players').where('isOnline','==',true).get();
        if (snap.empty) { div.innerHTML = '<p style="text-align:center;color:#6b21a8;">Никого нет</p>'; return; }
        
        let html = `<p style="color:#10b981;">🟢 Онлайн: <strong>${snap.size}</strong></p>`;
        snap.forEach(d => {
            const p = d.data();
            html += `
                <div class="card" style="padding:6px;margin:2px 0;display:flex;justify-content:space-between;align-items:center;">
                    <span>${p.nick} <span style="color:#6b21a8;">Ур.${p.level}</span></span>
                    <button class="btn-copy-nick" data-nick="${p.nick}" style="padding:4px 8px;font-size:0.7em;">📋</button>
                </div>`;
        });
        div.innerHTML = html;
        
        document.querySelectorAll('.btn-copy-nick').forEach(b => {
            b.addEventListener('click', function() {
                copyToClipboard(this.getAttribute('data-nick'));
                showToast('📋 Скопировано!', 'success');
            });
        });
    } catch(e) { div.innerHTML = '<p style="color:#dc2626;">Ошибка</p>'; }
}

function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
    } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
    }
}

// ==================== ВЫДАЧА ====================
async function adminGiveResources() {
    if (!adminState.selectedPlayer) { showToast('Найдите игрока!', 'error'); return; }
    
    const gold = parseInt(document.getElementById('admin-gold').value) || 0;
    const crystals = parseInt(document.getElementById('admin-crystals').value) || 0;
    const xp = parseInt(document.getElementById('admin-xp').value) || 0;
    const energy = parseInt(document.getElementById('admin-energy').value) || 0;
    
    if (gold === 0 && crystals === 0 && xp === 0 && energy === 0) { showToast('Укажите значения!', 'error'); return; }
    
    try {
        const ref = db.collection('players').doc(adminState.selectedPlayer);
        const doc = await ref.get();
        if (!doc.exists) { showToast('Игрок исчез!', 'error'); return; }
        
        const data = doc.data();
        const updateData = {};
        
        if (gold !== 0) updateData.gold = Math.max(0, (data.gold || 0) + gold);
        if (crystals !== 0) updateData.crystals = Math.max(0, (data.crystals || 0) + crystals);
        
        if (xp !== 0) {
            let nl = data.level || 1, nxp = (data.xp || 0) + xp;
            let ns = {...(data.stats || {attack:10,defense:5,luck:5,trade:5})};
            let nr = data.rank || 'NOVICE', nme = data.maxEnergy || 100;
            if (nxp < 0) nxp = 0;
            
            if (xp > 0) {
                let lg = 0, xn = getXPForLevel(nl);
                while (nxp >= xn && nl < 150) { nxp -= xn; nl++; lg++; xn = getXPForLevel(nl); }
                if (lg > 0) {
                    ns.attack += lg*2; ns.defense += lg; ns.luck += lg*0.5; ns.trade += lg*0.5;
                    nr = getRankByLevel(nl);
                    if (Math.floor(nl/10) > Math.floor((data.level||1)/10)) { nme = getEnergyConfig(nl).max; }
                }
            }
            if (xp < 0) {
                let tl = 1, tx = nxp, xn = getXPForLevel(tl);
                while (tx >= xn && tl < nl) { tx -= xn; tl++; xn = getXPForLevel(tl); }
                if (tl < nl) {
                    let ll = nl - tl; nl = tl; nxp = tx;
                    ns.attack = Math.max(10, ns.attack - ll*2);
                    ns.defense = Math.max(5, ns.defense - ll);
                    ns.luck = Math.max(5, ns.luck - ll*0.5);
                    ns.trade = Math.max(5, ns.trade - ll*0.5);
                    nr = getRankByLevel(nl);
                }
            }
            updateData.xp = nxp; updateData.level = nl; updateData.stats = ns;
            updateData.rank = nr; updateData.maxEnergy = nme;
            updateData.location = getLocationByLevel(nl).name;
        }
        
        if (energy !== 0) updateData.energy = Math.max(0, Math.min(data.maxEnergy||100, (data.energy||0)+energy));
        
        await ref.update(updateData);
        
        const upd = await ref.get();
        adminState.selectedPlayerData = { uid: adminState.selectedPlayer, ...upd.data() };
        
        document.getElementById('admin-gold').value = 0;
        document.getElementById('admin-crystals').value = 0;
        document.getElementById('admin-xp').value = 0;
        document.getElementById('admin-energy').value = 0;
        
        updatePlayerInfoCard();
        showToast('✅ Изменено!', 'success');
    } catch(e) { showToast('Ошибка: '+e.message, 'error'); }
}

// ==================== МОДЕРАЦИЯ ====================
async function adminBanPlayer() {
    if (!adminState.selectedPlayer) return;
    try {
        await db.collection('players').doc(adminState.selectedPlayer).update({ isBanned: true });
        adminState.selectedPlayerData.isBanned = true;
        updatePlayerInfoCard();
        showToast('⛔ Забанен', 'success');
    } catch(e) { showToast('Ошибка', 'error'); }
}

async function adminUnbanPlayer() {
    if (!adminState.selectedPlayer) return;
    try {
        await db.collection('players').doc(adminState.selectedPlayer).update({ isBanned: false });
        adminState.selectedPlayerData.isBanned = false;
        updatePlayerInfoCard();
        showToast('✅ Разбанен', 'success');
    } catch(e) { showToast('Ошибка', 'error'); }
}

async function adminMutePlayer() {
    if (!adminState.selectedPlayer) return;
    try {
        await db.collection('players').doc(adminState.selectedPlayer).update({ isMuted: true });
        adminState.selectedPlayerData.isMuted = true;
        updatePlayerInfoCard();
        showToast('🔇 Замучен', 'success');
    } catch(e) { showToast('Ошибка', 'error'); }
}

async function adminUnmutePlayer() {
    if (!adminState.selectedPlayer) return;
    try {
        await db.collection('players').doc(adminState.selectedPlayer).update({ isMuted: false });
        adminState.selectedPlayerData.isMuted = false;
        updatePlayerInfoCard();
        showToast('✅ Размучен', 'success');
    } catch(e) { showToast('Ошибка', 'error'); }
}

// ==================== СБРОС ====================
async function adminResetPlayer() {
    if (!adminState.selectedPlayer) return;
    
    try {
        const resetData = {
            level: 1, xp: 0, gold: 100, crystals: 0,
            energy: 100, maxEnergy: 100, fatigue: 0,
            stats: { attack: 10, defense: 5, luck: 5, trade: 5 },
            rank: 'NOVICE', title: '', location: 'Тракт Ронтуса',
            inventory: [], equipment: { weapon: null, armor: null, accessory: null },
            friends: [], clan: null, achievements: [], dailyQuests: [],
            isBanned: false, isMuted: false
        };
        
        await db.collection('players').doc(adminState.selectedPlayer).update(resetData);
        
        document.getElementById('admin-reset-confirm').style.display = 'none';
        adminState.selectedPlayerData = { uid: adminState.selectedPlayer, ...resetData };
        updatePlayerInfoCard();
        showToast('🔄 Аккаунт сброшен!', 'success');
        
    } catch(e) {
        showToast('Ошибка: ' + e.message, 'error');
    }
}

// ==================== УДАЛЕНИЕ ====================
async function adminDeletePlayer() {
    if (!adminState.selectedPlayer) return;
    
    try {
        await db.collection('players').doc(adminState.selectedPlayer).delete();
        
        document.getElementById('admin-delete-confirm').style.display = 'none';
        adminState.selectedPlayer = null;
        adminState.selectedPlayerData = null;
        document.getElementById('admin-info').innerHTML = '<p style="text-align:center;color:#dc2626;">🗑️ Аккаунт удалён</p>';
        hideAdminCards();
        showToast('🗑️ Аккаунт удалён!', 'success');
        
    } catch(e) {
        showToast('Ошибка: ' + e.message, 'error');
    }
}

console.log('👑 Админ-панель загружена');