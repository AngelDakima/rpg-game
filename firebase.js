// Firebase конфигурация
const firebaseConfig = {
  apiKey: "AIzaSyAIbLFExee5KhkOITgeJyJrzi62akz5HxE",
  authDomain: "rpg-game-a59b5.firebaseapp.com",
  projectId: "rpg-game-a59b5",
  storageBucket: "rpg-game-a59b5.firebasestorage.app",
  messagingSenderId: "94355006065",
  appId: "1:94355006065:web:4b46b78fc8a4c0991fb1d0"
};

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);

// Сервисы
const auth = firebase.auth();
const db = firebase.firestore();

// Настройки Firestore
db.settings({
  timestampsInSnapshots: true,
  merge: true
});

// Константы игры
const GAME_CONSTANTS = {
  VERSION: '1.0.0',
  
  // Энергия по уровням (каждые 10 уровней)
  ENERGY: {
    10: { max: 100, restore: 6 },
    20: { max: 110, restore: 6 },
    30: { max: 120, restore: 5 },
    40: { max: 130, restore: 5 },
    50: { max: 140, restore: 5 },
    60: { max: 150, restore: 4 },
    70: { max: 160, restore: 4 },
    80: { max: 170, restore: 4 },
    90: { max: 180, restore: 3 },
    100: { max: 190, restore: 3 },
    110: { max: 200, restore: 3 },
    120: { max: 210, restore: 2 },
    130: { max: 220, restore: 2 },
    140: { max: 230, restore: 2 },
    150: { max: 250, restore: 1 }
  },
  
  // Ранги
  RANKS: {
    NOVICE: { min: 1, max: 30, name: 'Новичок', color: 'rank-novice', emoji: '🌱' },
    EXPERIENCED: { min: 31, max: 60, name: 'Опытный', color: 'rank-experienced', emoji: '⚔️' },
    VETERAN: { min: 61, max: 100, name: 'Ветеран', color: 'rank-veteran', emoji: '🛡️' },
    LEGEND: { min: 101, max: 150, name: 'Легенда', color: 'rank-legend', emoji: '👑' }
  },
  
  // Редкости предметов
  RARITIES: {
    COMMON: { name: 'Обычный', color: 'rarity-common', emoji: '⚪', chance: 60, basePrice: 10 },
    UNCOMMON: { name: 'Необычный', color: 'rarity-uncommon', emoji: '🟢', chance: 25, basePrice: 50 },
    RARE: { name: 'Редкий', color: 'rarity-rare', emoji: '🔵', chance: 10, basePrice: 200 },
    EPIC: { name: 'Эпический', color: 'rarity-epic', emoji: '🟣', chance: 4, basePrice: 1000 },
    LEGENDARY: { name: 'Легендарный', color: 'rarity-legendary', emoji: '🟠', chance: 0.9, basePrice: 5000 },
    MYTHIC: { name: 'Мифический', color: 'rarity-mythic', emoji: '🔴', chance: 0.1, basePrice: 50000 }
  },
  
  // Погода
  WEATHER: {
    CLEAR: { name: 'Ясно', emoji: '☀️', effect: 'luck+10' },
    RAIN: { name: 'Дождь', emoji: '🌧️', effect: 'attack-15,defense+5' },
    FOG: { name: 'Туман', emoji: '🌫️', effect: 'miss+20' },
    STORM: { name: 'Гроза', emoji: '⛈️', effect: 'randomCrit' },
    NIGHT: { name: 'Ночь', emoji: '🌑', effect: 'monsterBuff20' }
  },
  
  // Локации дороги
  LOCATIONS: {
    1: { name: 'Тракт Ронтуса', minLevel: 1, maxLevel: 15, monsters: ['🐀 Крыса', '🟢 Слизень'], bossChance: 0 },
    16: { name: 'Тёмный лес', minLevel: 16, maxLevel: 30, monsters: ['🐺 Волк', '🕷️ Паук'], bossChance: 5 },
    31: { name: 'Забытые руины', minLevel: 31, maxLevel: 45, monsters: ['💀 Скелет', '👻 Дух'], bossChance: 8 },
    46: { name: 'Гнилые болота', minLevel: 46, maxLevel: 60, monsters: ['🧟 Тролль', '🧙 Ведьма'], bossChance: 10 },
    61: { name: 'Пепельные пустоши', minLevel: 61, maxLevel: 80, monsters: ['😈 Демон', '🔥 Элементаль'], bossChance: 12 },
    81: { name: 'Глубины Бездны', minLevel: 81, maxLevel: 100, monsters: ['🐉 Дракон', '🗿 Титан'], bossChance: 15 },
    101: { name: 'Чертоги Вечности', minLevel: 101, maxLevel: 130, monsters: ['👁️ Древний бог', '⚡ Архангел'], bossChance: 20 },
    131: { name: 'За гранью мира', minLevel: 131, maxLevel: 150, monsters: ['🌌 Порождение хаоса', '💀 Владыка пустоты'], bossChance: 25 }
  },
  
  // Расход энергии
  ENERGY_COST: {
    WALK_1KM: 1,
    FIGHT_NORMAL: 3,
    FIGHT_RARE: 5,
    FIGHT_BOSS: 8,
    MINE: 4,
    FISH: 2,
    CRAFT: 2
  },
  
  // Админ
  ADMIN_NICK: 'Тоя'
};

// Глобальные переменные игры
let currentPlayer = null;
let gameState = {
  isLoggedIn: false,
  currentScreen: 'login',
  weather: 'CLEAR',
  weatherTimer: null,
  saveTimer: null,
  energyTimer: null
};

// Получить конфиг энергии для уровня
function getEnergyConfig(level) {
  let config = { max: 100, restore: 6 };
  const thresholds = Object.keys(GAME_CONSTANTS.ENERGY).map(Number).sort((a,b) => a-b);
  
  for (let threshold of thresholds) {
    if (level >= threshold) {
      config = GAME_CONSTANTS.ENERGY[threshold];
    }
  }
  
  return config;
}

// Получить ранг по уровню
function getRankByLevel(level) {
  if (level >= 101) return 'LEGEND';
  if (level >= 61) return 'VETERAN';
  if (level >= 31) return 'EXPERIENCED';
  return 'NOVICE';
}

// Получить локацию по уровню
function getLocationByLevel(level) {
  const thresholds = Object.keys(GAME_CONSTANTS.LOCATIONS).map(Number).sort((a,b) => b-a);
  
  for (let threshold of thresholds) {
    if (level >= threshold) {
      return GAME_CONSTANTS.LOCATIONS[threshold];
    }
  }
  
  return GAME_CONSTANTS.LOCATIONS[1];
}

console.log('🔥 Firebase и константы загружены');