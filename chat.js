// ==================== ЧАТ ====================

let chatState = {
    messages: [],
    chatType: 'global', // 'global', 'clan'
    listener: null
};

// Показать чат
function showChat() {
    gameState.currentScreen = 'chat';
    const app = document.getElementById('app');
    
    app.innerHTML = `
        <div class="fade-in">
            <h1>💬 Чат</h1>
            
            <div class="tabs">
                <div class="tab active" onclick="switchChatTab('global')">🌍 Общий</div>
                ${currentPlayer.clan ? `<div class="tab" onclick="switchChatTab('clan')">🛡️ Клан</div>` : ''}
            </div>
            
            <div id="chat-messages" class="card" style="height: 350px; overflow-y: auto;">
                <p style="text-align: center; color: #8b5cf6;">Загрузка сообщений...</p>
            </div>
            
            ${!currentPlayer.isMuted ? `
                <div class="flex gap-10 mt-10">
                    <input type="text" id="chat-input" placeholder="Введите сообщение..." maxlength="200">
                    <button onclick="sendMessage()">📨</button>
                </div>
            ` : `
                <p style="text-align: center; color: #dc2626;">🔇 Вы замучены</p>
            `}
            
            <button onclick="closeChat()" class="w-full mt-10">⬅️ Назад</button>
        </div>
    `;
    
    loadChatMessages();
    listenChatMessages();
}

// Переключение вкладок чата
function switchChatTab(type) {
    chatState.chatType = type;
    
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(t => t.classList.remove('active'));
    
    if (type === 'global') tabs[0].classList.add('active');
    else if (tabs[1]) tabs[1].classList.add('active');
    
    loadChatMessages();
}

// Загрузить сообщения
async function loadChatMessages() {
    try {
        const collectionName = chatState.chatType === 'clan' && currentPlayer.clan 
            ? 'chat_clan_' + currentPlayer.clan 
            : 'chat';
        
        const snapshot = await db.collection(collectionName)
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();
        
        chatState.messages = [];
        snapshot.forEach(doc => {
            chatState.messages.unshift({
                id: doc.id,
                ...doc.data()
            });
        });
        
        renderChatMessages();
    } catch (error) {
        console.error('Ошибка загрузки чата:', error);
        document.getElementById('chat-messages').innerHTML = 
            '<p style="text-align: center; color: #dc2626;">Ошибка загрузки</p>';
    }
}

// Слушать новые сообщения
function listenChatMessages() {
    // Отключаем старый слушатель
    if (chatState.listener) {
        chatState.listener();
    }
    
    const collectionName = chatState.chatType === 'clan' && currentPlayer.clan 
        ? 'chat_clan_' + currentPlayer.clan 
        : 'chat';
    
    chatState.listener = db.collection(collectionName)
        .orderBy('createdAt', 'desc')
        .limit(1)
        .onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added' && !chatState.messages.find(m => m.id === change.doc.id)) {
                    chatState.messages.push({
                        id: change.doc.id,
                        ...change.doc.data()
                    });
                    renderChatMessages();
                }
            });
        });
}

// Отобразить сообщения
function renderChatMessages() {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    
    if (chatState.messages.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #6b21a8;">Нет сообщений</p>';
        return;
    }
    
    container.innerHTML = chatState.messages.map(msg => {
        const time = msg.createdAt ? new Date(msg.createdAt.toDate()).toLocaleTimeString() : '';
        const isAdmin = msg.nick === GAME_CONSTANTS.ADMIN_NICK;
        
        return `
            <div style="padding: 4px 0; border-bottom: 1px solid #1e0040;">
                <span style="font-size: 0.7em; color: #6b21a8;">${time}</span>
                <span style="color: ${isAdmin ? '#fbbf24' : '#c084fc'}; font-weight: ${isAdmin ? 'bold' : 'normal'};">
                    ${isAdmin ? '👑 ' : ''}${msg.nick}:
                </span>
                <span style="color: #e9d5ff;">${msg.text}</span>
            </div>
        `;
    }).join('');
    
    // Скролл вниз
    container.scrollTop = container.scrollHeight;
}

// Отправить сообщение
async function sendMessage() {
    if (currentPlayer.isMuted) {
        showToast('🔇 Вы замучены!', 'error');
        return;
    }
    
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    
    if (!text) return;
    if (text.length > 200) {
        showToast('Сообщение слишком длинное!', 'error');
        return;
    }
    
    try {
        const collectionName = chatState.chatType === 'clan' && currentPlayer.clan 
            ? 'chat_clan_' + currentPlayer.clan 
            : 'chat';
        
        await db.collection(collectionName).add({
            nick: currentPlayer.nick,
            uid: currentPlayer.uid,
            text: text,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        input.value = '';
        
        // Обновляем сообщения
        await loadChatMessages();
        
    } catch (error) {
        console.error('Ошибка отправки:', error);
        showToast('Ошибка отправки сообщения', 'error');
    }
}

// Закрыть чат
function closeChat() {
    if (chatState.listener) {
        chatState.listener();
        chatState.listener = null;
    }
    
    if (gameState.currentScreen === 'road') {
        showRoadScreen();
    } else {
        goToCity();
    }
}

// Обработка Enter в чате
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && gameState.currentScreen === 'chat') {
        const input = document.getElementById('chat-input');
        if (input && document.activeElement === input) {
            sendMessage();
        }
    }
});

console.log('💬 Модуль чата загружен');