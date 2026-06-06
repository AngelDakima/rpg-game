// ==================== МАТЕМАТИКА ИГРЫ ====================

// Все формулы и константы для баланса игры

const FORMULAS = {
    // База
    BASE_HP: 50,
    HP_PER_LEVEL: 10,
    HP_PER_VITALITY: 5,
    
    // Статы при создании персонажа
    BASE_STATS: {
        strength: 10,      // 💪 Сила
        agility: 8,        // 🤸 Ловкость
        vitality: 7,       // ❤️ Живучесть
        luck: 5,           // 🍀 Удача
        precision: 6,      // 👁️ Точность
        fortitude: 4       // 🛡️ Крепость
    },
    
    // Прибавка статов за уровень
    STATS_PER_LEVEL: {
        strength: 2,       // +2 к силе каждый уровень
        agility: 1.5,
        vitality: 1.5,
        luck: 0.5,
        precision: 1,
        fortitude: 1
    },
    
    // Урон
    MIN_DAMAGE: 1,
    DAMAGE_VARIANCE: 0.2,  // ±20% разброс урона
    
    // Сила → урон
    STRENGTH_TO_DAMAGE: 1.5,  // 1 силы = 1.5 урона
    
    // Крепость → снижение урона
    FORTITUDE_TO_DEFENSE: 1.2, // 1 крепости = 1.2 защиты
    
    // Ловкость → уклонение
    AGILITY_TO_DODGE: 0.8,  // 1 ловкости = 0.8% шанс уворота
    MAX_DODGE_CHANCE: 50,   // Максимальный шанс уворота 50%
    
    // Ловкость → двойная атака
    AGILITY_TO_DOUBLE: 0.4,  // 1 ловкости = 0.4% шанс двойной атаки
    MAX_DOUBLE_CHANCE: 35,   // Максимальный шанс 35%
    DOUBLE_DAMAGE_MULT: 0.6, // Вторая атака наносит 60% урона
    
    // Удача → крит
    LUCK_TO_CRIT: 0.7,       // 1 удачи = 0.7% шанс крита
    MAX_CRIT_CHANCE: 60,     // Максимальный шанс крита 60%
    CRIT_DAMAGE_MULT: 2.0,   // Крит ×2 урона
    
    // Удача → лут
    LUCK_TO_LOOT: 0.5,       // 1 удачи = +0.5% к шансу редкого лута
    
    // Точность → снижение промаха
    PRECISION_TO_HIT: 1.0,   // 1 точности = 1% снижение шанса промаха
    BASE_MISS_CHANCE: 15,    // Базовый шанс промаха 15%
    MIN_MISS_CHANCE: 2,      // Минимальный шанс промаха 2%
    
    // Живучесть → HP
    VITALITY_TO_HP: 5,       // 1 живучести = +5 макс. HP
    
    // Живучесть → стойкость (шанс выжить с 1 HP)
    VITALITY_TO_SURVIVE: 0.3, // 1 живучести = 0.3% шанс выжить
    MAX_SURVIVE_CHANCE: 25,   // Максимальный шанс 25%
    
    // Монстры — множители статов от уровня
    MONSTER_ATTACK_PER_LEVEL: 2.2,
    MONSTER_DEFENSE_PER_LEVEL: 1.3,
    MONSTER_HP_PER_LEVEL: 9,
    MONSTER_XP_PER_LEVEL: 3.5,
    MONSTER_GOLD_PER_LEVEL: 2.5,
    
    // Босс — множитель
    BOSS_MULTIPLIER: 2.5,
    
    // Усталость — штрафы
    FATIGUE_PENALTY_1: 30,   // Порог 30% — лёгкий штраф
    FATIGUE_PENALTY_2: 60,   // Порог 60% — средний штраф
    FATIGUE_PENALTY_3: 90,   // Порог 90% — сильный штраф
    FATIGUE_DAMAGE_MULT_1: 0.9,  // Урон ×0.9 при 30%+ усталости
    FATIGUE_DAMAGE_MULT_2: 0.75, // Урон ×0.75 при 60%+ усталости
    FATIGUE_MISS_ADD_1: 10,      // +10% к промаху при 60%+ усталости
    FATIGUE_MISS_ADD_2: 25,      // +25% к промаху при 90%+ усталости
    FATIGUE_PER_BATTLE: 8,       // +8% усталости за бой
    FATIGUE_PER_BOSS: 15,        // +15% за босса
    FATIGUE_PER_KM: 2,           // +2% за км дороги
    FATIGUE_DEFEAT_ADD: 20,      // +20% при поражении
    
    // Энергия
    ENERGY_PER_KM: 1,
    ENERGY_PER_BATTLE: 3,
    ENERGY_PER_BOSS: 8,
    
    // Погода — модификаторы
    WEATHER_EFFECTS: {
        CLEAR: { luckBonus: 10, desc: '+10% к удаче' },
        RAIN: { strengthPenalty: 15, fortitudeBonus: 5, desc: '−15% к силе, +5 к крепости' },
        FOG: { missAdd: 20, desc: '+20% к шансу промаха' },
        STORM: { randomCrit: true, damageMult: 1.1, desc: 'Случайные криты, +10% урона всем' },
        NIGHT: { monsterBuff: 20, desc: 'Монстры сильнее на 20%' }
    }
};

// ==================== ФУНКЦИИ РАСЧЁТА ====================

// Максимальное HP игрока
function calculateMaxHP(level, vitality) {
    return Math.floor(FORMULAS.BASE_HP + level * FORMULAS.HP_PER_LEVEL + vitality * FORMULAS.VITALITY_TO_HP);
}

// Базовый урон игрока
function calculateDamage(strength, weaponBonus = 0) {
    const base = strength * FORMULAS.STRENGTH_TO_DAMAGE + weaponBonus;
    const variance = 1 - FORMULAS.DAMAGE_VARIANCE + Math.random() * FORMULAS.DAMAGE_VARIANCE * 2;
    return Math.max(FORMULAS.MIN_DAMAGE, Math.floor(base * variance));
}

// Шанс крита (%)
function calculateCritChance(luck, weatherBonus = 0) {
    return Math.min(FORMULAS.MAX_CRIT_CHANCE, luck * FORMULAS.LUCK_TO_CRIT + weatherBonus);
}

// Шанс уворота (%)
function calculateDodgeChance(agility) {
    return Math.min(FORMULAS.MAX_DODGE_CHANCE, agility * FORMULAS.AGILITY_TO_DODGE);
}

// Шанс двойной атаки (%)
function calculateDoubleAttackChance(agility) {
    return Math.min(FORMULAS.MAX_DOUBLE_CHANCE, agility * FORMULAS.AGILITY_TO_DOUBLE);
}

// Шанс промаха (%)
function calculateMissChance(precision, fatigueBonus = 0, weatherBonus = 0) {
    const base = Math.max(FORMULAS.MIN_MISS_CHANCE, FORMULAS.BASE_MISS_CHANCE - precision * FORMULAS.PRECISION_TO_HIT);
    return Math.min(90, base + fatigueBonus + weatherBonus);
}

// Шанс выжить с 1 HP (%)
function calculateSurviveChance(vitality) {
    return Math.min(FORMULAS.MAX_SURVIVE_CHANCE, vitality * FORMULAS.VITALITY_TO_SURVIVE);
}

// Защита (снижение урона)
function calculateDefense(fortitude, armorBonus = 0) {
    return Math.floor(fortitude * FORMULAS.FORTITUDE_TO_DEFENSE + armorBonus);
}

// Статы монстра
function calculateMonsterStats(level, isBoss = false) {
    const mult = isBoss ? FORMULAS.BOSS_MULTIPLIER : 1;
    return {
        attack: Math.floor(level * FORMULAS.MONSTER_ATTACK_PER_LEVEL * mult + 5),
        defense: Math.floor(level * FORMULAS.MONSTER_DEFENSE_PER_LEVEL * mult + 3),
        hp: Math.floor(level * FORMULAS.MONSTER_HP_PER_LEVEL * mult + 20),
        xpReward: Math.floor(level * FORMULAS.MONSTER_XP_PER_LEVEL * mult + 10),
        goldReward: Math.floor(level * FORMULAS.MONSTER_GOLD_PER_LEVEL * mult + 5)
    };
}

// Бонус к редкому луту от удачи
function calculateLootBonus(luck) {
    return luck * FORMULAS.LUCK_TO_LOOT;
}

// Модификатор урона от усталости
function getFatigueDamageMultiplier(fatigue) {
    if (fatigue >= FORMULAS.FATIGUE_PENALTY_3) return FORMULAS.FATIGUE_DAMAGE_MULT_2;
    if (fatigue >= FORMULAS.FATIGUE_PENALTY_2) return FORMULAS.FATIGUE_DAMAGE_MULT_2;
    if (fatigue >= FORMULAS.FATIGUE_PENALTY_1) return FORMULAS.FATIGUE_DAMAGE_MULT_1;
    return 1.0;
}

// Дополнительный шанс промаха от усталости
function getFatigueMissBonus(fatigue) {
    if (fatigue >= FORMULAS.FATIGUE_PENALTY_3) return FORMULAS.FATIGUE_MISS_ADD_2;
    if (fatigue >= FORMULAS.FATIGUE_PENALTY_2) return FORMULAS.FATIGUE_MISS_ADD_1;
    return 0;
}

console.log('📐 Математика игры загружена');