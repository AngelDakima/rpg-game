// ==================== АВТОРИЗАЦИЯ ====================

// Показать экран входа/регистрации
function showLoginScreen() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="fade-in">
            <h1>🌑 Код Этернитас</h1>
            
            <div class="card">
                <div class="tabs">
                    <div class="tab active" onclick="switchAuthTab('login')">🔑 Вход</div>
                    <div class="tab" onclick="switchAuthTab('register')">✨ Регистрация</div>
                </div>
                
                <!-- Форма входа -->
                <div id="login-form">
                    <input type="text" id="login-nick" placeholder="📝 Ник" maxlength="16">
                    <input type="password" id="login-password" placeholder="🔑 Пароль" maxlength="32">
                    <button onclick="login()" class="w-full mt-10">🔓 Войти</button>
                </div>
                
                <!-- Форма регистрации -->
                <div id="register-form" class="hidden">
                    <input type="text" id="reg-nick" placeholder="📝 Ник (3-16 символов)" maxlength="16">
                    <div class="flex gap-10 mt-10">
                        <button onclick="selectGender('male')" id="btn-male" class="w-full">👨 Мужской</button>
                        <button onclick="selectGender('female')" id="btn-female" class="w-full">👩 Женский</button>
                    </div>
                    <input type="hidden" id="reg-gender" value="">
                    <input type="email" id="reg-email" placeholder="📧 Почта" class="mt-10">
                    <input type="password" id="reg-password" placeholder="🔑 Пароль (мин. 6 символов)" minlength="6" maxlength="32" class="mt-10">
                    <input type="password" id="reg-password-confirm" placeholder="🔑 Повторите пароль" class="mt-10">
                    <button onclick="register()" class="w-full mt-10 btn-success">✨ Зарегистрироваться</button>
                </div>
            </div>
            
            <p class="text-center mt-10" style="color: #6b21a8; font-size: 0.8em;">
                Тёмное фэнтези • Фиолетовые тона • Эмодзи
            </p>
        </div>
    `;
    
    gameState.currentScreen = 'login';
    gameState.selectedGender = '';
}

// Переключение вкладок
function switchAuthTab(tab) {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(t => t.classList.remove('active'));
    
    if (tab === 'login') {
        tabs[0].classList.add('active');
        document.getElementById('login-form').classList.remove('hidden');
        document.getElementById('register-form').classList.add('hidden');
    } else {
        tabs[1].classList.add('active');
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('register-form').classList.remove('hidden');
    }
}

// Выбор пола
function selectGender(gender) {
    gameState.selectedGender = gender;
    document.getElementById('reg-gender').value = gender;
    
    const btnMale = document.getElementById('btn-male');
    const btnFemale = document.getElementById('btn-female');
    
    btnMale.classList.remove('btn-success');
    btnFemale.classList.remove('btn-success');
    
    if (gender === 'male') {
        btnMale.classList.add('btn-success');
    } else {
        btnFemale.classList.add('btn-success');
    }
}

// Вход
async function login() {
    const nick = document.getElementById('login-nick').value.trim();
    const password = document.getElementById('login-password').value;
    
    if (!nick || !password) {
        showToast('Заполните все поля', 'error');
        return;
    }
    
    try {
        // Ищем игрока по нику
        const snapshot = await db.collection('players')
            .where('nick', '==', nick)
            .limit(1)
            .get();
        
        if (snapshot.empty) {
            showToast('Игрок с таким ником не найден', 'error');
            return;
        }
        
        const playerData = snapshot.docs[0].data();
        const email = playerData.email;
        
        // Вход через Firebase Auth
        await auth.signInWithEmailAndPassword(email, password);
        
        // Загружаем данные игрока
        currentPlayer = {
            uid: snapshot.docs[0].id,
            ...playerData
        };
        
        gameState.isLoggedIn = true;
        
        // Запускаем таймеры
        startSaveTimer();
        startEnergyTimer();
        startWeatherTimer();
        
        showToast('✅ Добро пожаловать, ' + nick + '!', 'success');
        showMainScreen();
        
    } catch (error) {
        console.error('Ошибка входа:', error);
        if (error.code === 'auth/wrong-password') {
            showToast('Неверный пароль', 'error');
        } else if (error.code === 'auth/user-not-found') {
            showToast('Аккаунт не найден', 'error');
        } else {
            showToast('Ошибка входа: ' + error.message, 'error');
        }
    }
}

// Регистрация
async function register() {
    const nick = document.getElementById('reg-nick').value.trim();
    const gender = document.getElementById('reg-gender').value;
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const passwordConfirm = document.getElementById('reg-password-confirm').value;
    
    // Проверки
    if (!nick || !gender || !email || !password) {
        showToast('Заполните все поля', 'error');
        return;
    }
    
    if (nick.length < 3) {
        showToast('Ник должен быть не менее 3 символов', 'error');
        return;
    }
    
    if (password.length < 6) {
        showToast('Пароль должен быть не менее 6 символов', 'error');
        return;
    }
    
    if (password !== passwordConfirm) {
        showToast('Пароли не совпадают', 'error');
        return;
    }
    
    if (!email.includes('@') || !email.includes('.')) {
        showToast('Введите корректную почту', 'error');
        return;
    }
    
    try {
        // Проверяем уникальность ника
        const nickSnapshot = await db.collection('players')
            .where('nick', '==', nick)
            .limit(1)
            .get();
        
        if (!nickSnapshot.empty) {
            showToast('Этот ник уже занят', 'error');
            return;
        }
        
        // Создаём аккаунт в Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const uid = userCredential.user.uid;
        
        // Создаём документ игрока
        const energyConfig = getEnergyConfig(1);
        
        const newPlayer = {
            uid: uid,
            nick: nick,
            gender: gender,
            email: email,
            level: 1,
            xp: 0,
            gold: 100,
            crystals: 0,
            energy: energyConfig.max,
            maxEnergy: energyConfig.max,
            fatigue: 0,
            stats: {
                attack: 10,
                defense: 5,
                luck: 5,
                trade: 5
            },
            rank: 'NOVICE',
            title: '',
            reputation: 0,
            location: 'Тракт Ронтуса',
            inventory: [],
            equipment: {
                weapon: null,
                armor: null,
                accessory: null
            },
            friends: [],
            clan: null,
            achievements: [],
            dailyQuests: [],
            isOnline: true,
            isBanned: false,
            isMuted: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastSave: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Сохраняем в Firestore
        await db.collection('players').doc(uid).set(newPlayer);
        
        // Загружаем в игру
        currentPlayer = newPlayer;
        gameState.isLoggedIn = true;
        
        // Запускаем таймеры
        startSaveTimer();
        startEnergyTimer();
        startWeatherTimer();
        
        showToast('✨ Аккаунт создан! Добро пожаловать в Код Этернитас!', 'success');
        showMainScreen();
        
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        if (error.code === 'auth/email-already-in-use') {
            showToast('Эта почта уже используется', 'error');
        } else {
            showToast('Ошибка регистрации: ' + error.message, 'error');
        }
    }
}

// Выход из игры
async function logout() {
    try {
        // Сохраняем перед выходом
        await savePlayerData();
        
        await auth.signOut();
        currentPlayer = null;
        gameState.isLoggedIn = false;
        
        // Останавливаем таймеры
        clearInterval(gameState.saveTimer);
        clearInterval(gameState.energyTimer);
        clearInterval(gameState.weatherTimer);
        
        showLoginScreen();
        showToast('👋 Вы вышли из игры', 'success');
        
    } catch (error) {
        console.error('Ошибка выхода:', error);
    }
}

// Проверка состояния авторизации
auth.onAuthStateChanged(async (user) => {
    if (user && !gameState.isLoggedIn) {
        // Пользователь уже авторизован (перезагрузка страницы)
        try {
            const doc = await db.collection('players').doc(user.uid).get();
            if (doc.exists) {
                currentPlayer = {
                    uid: user.uid,
                    ...doc.data()
                };
                gameState.isLoggedIn = true;
                
                startSaveTimer();
                startEnergyTimer();
                startWeatherTimer();
                
                showMainScreen();
            } else {
                // Документ не найден, выходим
                await auth.signOut();
                showLoginScreen();
            }
        } catch (error) {
            console.error('Ошибка загрузки:', error);
            showLoginScreen();
        }
    } else if (!user && gameState.isLoggedIn) {
        // Пользователь разлогинился
        currentPlayer = null;
        gameState.isLoggedIn = false;
        showLoginScreen();
    }
});

// Сохранение при закрытии вкладки
window.addEventListener('beforeunload', async (e) => {
    if (currentPlayer && gameState.isLoggedIn) {
        // Синхронное сохранение перед закрытием
        const playerRef = db.collection('players').doc(currentPlayer.uid);
        currentPlayer.lastSave = new Date();
        currentPlayer.isOnline = false;
        
        try {
            await playerRef.update({
                ...currentPlayer,
                lastSave: firebase.firestore.FieldValue.serverTimestamp(),
                isOnline: false
            });
        } catch (error) {
            console.error('Ошибка сохранения при выходе:', error);
        }
    }
});

console.log('🔐 Модуль авторизации загружен');