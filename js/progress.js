// ==========================================
// TIẾN TRÌNH, LƯU GAME, CÂN BẰNG KINH TẾ, SỔ TAY 72 VẬT PHẨM & KHU CẮM TRẠI
// ==========================================

// ---------- LƯU / TẢI (localStorage) ----------
var SAVE_KEY = 'mergeCamping_save_v1';
var ECON_VERSION = 3; // Tăng khi cân bằng lại kinh tế để chuyển đổi save cũ (Kinh tế Vàng x10 & Thưởng Combo)

// ---------- NĂNG LƯỢNG DÙNG CHUNG GIỮA CÁC MÀN (PERSISTENT ENERGY) ----------
// Năng lượng đọc từ js/config.js. Người chơi bắt đầu với startEnergy,
// đủ chơi liên tục Level 1 → 4; từ Level 5 cần xem quảng cáo, dùng Kim cương hoặc chờ hồi.
var START_ENERGY = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.energy) ? GAME_CONFIG.energy.startEnergy : 80;
var MAX_ENERGY_BASE = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.energy) ? GAME_CONFIG.energy.maxEnergyBase : 70;
var MAX_ENERGY_PER_LEVEL = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.energy) ? GAME_CONFIG.energy.maxEnergyPerLevel : 4;
var MAX_ENERGY_CAP = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.energy) ? GAME_CONFIG.energy.maxEnergyCap : 200;
var ENERGY_REGEN_SEC = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.energy) ? GAME_CONFIG.energy.regenIntervalSec : 30;

function getTotalStars() {
    var totalStars = 0;
    if (typeof SAVE !== 'undefined' && SAVE && SAVE.stars) {
        Object.keys(SAVE.stars).forEach(function (k) { totalStars += SAVE.stars[k] || 0; });
    }
    return totalStars;
}

function getEnergyRegenSec() {
    var baseSec = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.energy) ? GAME_CONFIG.energy.regenIntervalSec : ENERGY_REGEN_SEC;
    return getTotalStars() >= 60 ? Math.max(15, baseSec - 2) : baseSec;
}

function getMaxEnergy() {
    var passed = (typeof SAVE !== 'undefined' && SAVE && SAVE.stars) ? Object.keys(SAVE.stars).length : 0;
    var base = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.energy) ? GAME_CONFIG.energy.maxEnergyBase : MAX_ENERGY_BASE;
    var perLv = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.energy) ? GAME_CONFIG.energy.maxEnergyPerLevel : MAX_ENERGY_PER_LEVEL;
    var cap = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.energy) ? GAME_CONFIG.energy.maxEnergyCap : MAX_ENERGY_CAP;
    var totalStars = getTotalStars();
    var starBonus = totalStars >= 30 ? 5 : 0;
    return Math.min(cap, base + passed * perLv + starBonus);
}

function todayKey() {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
}

function generatePlayerId() {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var code = '';
    for (var i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return 'CAMP-' + code;
}

function defaultSave() {
    var initCoins = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.initialProfile) ? GAME_CONFIG.initialProfile.coins : 1000;
    var initGems = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.initialProfile) ? GAME_CONFIG.initialProfile.gems : 8;
    var initEnergy = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.energy) ? GAME_CONFIG.energy.startEnergy : START_ENERGY;
    return {
        playerId: generatePlayerId(),
        googleUser: null,
        currentBoardState: null,
        level: 1,
        maxLevel: 1,
        playerLevel: 1,
        playerExp: 0,
        persistentBoard: null,
        totalOrdersDelivered: 0,
        coins: initCoins,
        gems: initGems,
        energy: initEnergy,
        econVer: ECON_VERSION,
        stars: {},
        discovered: {},
        claimedBook: {},
        ownedPets: ['character01'],
        activePet: 'character01',
        ownedLocations: ['loc_doibu'],
        activeLocation: 'loc_doibu',
        campItems: [],
        campItemsMigrated: false,
        myCampEquipped: {},
        myCampUnequipped: {},
        claimedStarChests: [],
        starterPackBought: false,
        ads: { day: todayKey(), energy: 0, gem: 0, coin: 0, mystery: 0, dailyGemClaimed: false },
        settings: {
            sound: true,
            bgm: false,
            vibrate: true,
            unlockAllLevels: false,
            showTestTool: false,
            lang: (typeof I18N !== 'undefined') ? I18N.currentLang : 'vi'
        },
        petOrderGroups: [],
        lastEnergyTs: Date.now(),
        lastPetRewardTime: 0,
        recentOrdersHistory: [],
        recentBranchHistory: [],
        lastOrderedLevelByBranch: {}
    };
}

function loadSave() {
    try {
        var raw = localStorage.getItem(SAVE_KEY);
        if (raw) {
            var parsed = JSON.parse(raw);
            var s = Object.assign(defaultSave(), parsed);
            if (!Array.isArray(s.petOrderGroups)) s.petOrderGroups = [];
            if (s.settings && typeof I18N !== 'undefined') {
                var explicit = (typeof localStorage !== 'undefined') ? localStorage.getItem('camping_lang_explicit') : null;
                if (explicit === '1') {
                    var storedLang = (typeof localStorage !== 'undefined') ? localStorage.getItem('camping_language') : null;
                    I18N.currentLang = storedLang || s.settings.lang || 'vi';
                } else {
                    I18N.currentLang = 'vi';
                    try {
                        if (typeof localStorage !== 'undefined') {
                            localStorage.setItem('camping_language', 'vi');
                        }
                    } catch (e) {}
                }
                s.settings.lang = I18N.currentLang;
            }
            if (!s.playerId) s.playerId = generatePlayerId();
            if (!s.googleUser || typeof s.googleUser !== 'object') s.googleUser = null;
            if (s.currentBoardState && typeof s.currentBoardState !== 'object') s.currentBoardState = null;
            if (typeof s.playerLevel !== 'number' || s.playerLevel < 1) s.playerLevel = s.level || 1;
            if (typeof s.playerExp !== 'number' || s.playerExp < 0) s.playerExp = 0;
            if (typeof s.totalOrdersDelivered !== 'number') s.totalOrdersDelivered = 0;
            if (s.persistentBoard && typeof s.persistentBoard !== 'object') s.persistentBoard = null;

            // Tự động chuyển đổi sang cấu hình bàn cờ mới nhất (layoutVersion 8: Ô đá khóa theo cấp độ 3, 5, 7, 11, 15, 18 sử dụng board_cell_rock_lock.png)
            var targetLayoutVer = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.initialBoard && GAME_CONFIG.initialBoard.layoutVersion) || 8;
            if (s.persistentBoard && s.persistentBoard.layoutVersion !== targetLayoutVer) {
                s.persistentBoard = null;
                s.currentBoardState = null;
                s.petOrderGroups = [];
                s.totalOrdersDelivered = 0;
                s.playerLevel = 1;
                s.level = 1;
                s.playerExp = 0;
            }
            if (!s.stars || typeof s.stars !== 'object') s.stars = {};
            if (!s.discovered || typeof s.discovered !== 'object') s.discovered = {};
            if (!s.claimedBook || typeof s.claimedBook !== 'object') s.claimedBook = {};
            if (!s.ads || typeof s.ads !== 'object') s.ads = defaultSave().ads;
            if (!Array.isArray(s.ownedPets) || !s.ownedPets.length) s.ownedPets = ['character01'];
            if (!s.activePet) s.activePet = 'character01';
            if (typeof s.lastPetRewardTime !== 'number') s.lastPetRewardTime = 0;
            if (!Array.isArray(s.recentOrdersHistory)) s.recentOrdersHistory = [];
            if (!Array.isArray(s.recentBranchHistory)) s.recentBranchHistory = [];
            var maxSensibleLv = (typeof getProgressCap === 'function')
                ? getProgressCap(s.totalOrdersDelivered || 0, s.playerLevel || 1)
                : Math.min(12, Math.floor((s.totalOrdersDelivered || 0) / 3) + 4);
            if (!s.lastOrderedLevelByBranch || typeof s.lastOrderedLevelByBranch !== 'object') {
                s.lastOrderedLevelByBranch = {};
            } else {
                Object.keys(s.lastOrderedLevelByBranch).forEach(function (k) {
                    if (typeof s.lastOrderedLevelByBranch[k] === 'number' && s.lastOrderedLevelByBranch[k] > maxSensibleLv) {
                        s.lastOrderedLevelByBranch[k] = Math.max(2, maxSensibleLv - 1);
                    }
                });
            }
            if (!Array.isArray(s.petOrderGroups)) {
                s.petOrderGroups = [];
            } else {
                // Giữ nguyên 100% danh sách nhóm nhiệm vụ hợp lệ đang thực hiện của người chơi khi nạp lại save.
                // Tuyệt đối không xóa bỏ hay tái tạo nhiệm vụ khi reload trang thiết bị!
                s.petOrderGroups = s.petOrderGroups.filter(function (g) {
                    return g && Array.isArray(g.orders) && g.orders.length > 0 && g.orders.every(function (o) {
                        return o && typeof o.id === 'string' && o.id.length > 0;
                    });
                });
            }
            if (!Array.isArray(s.ownedLocations) || !s.ownedLocations.length) s.ownedLocations = ['loc_doibu'];
            if (!s.ownedLocations.includes('loc_doibu')) s.ownedLocations.unshift('loc_doibu');
            if (!s.activeLocation) s.activeLocation = 'loc_doibu';
            if (!Array.isArray(s.campItems)) s.campItems = [];
            if (!s.myCampEquipped || typeof s.myCampEquipped !== 'object') {
                s.myCampEquipped = {};
            }
            if (!s.myCampUnequipped || typeof s.myCampUnequipped !== 'object') {
                s.myCampUnequipped = {};
            }
            if (!Array.isArray(s.claimedStarChests)) s.claimedStarChests = [];
            if (!s.campItemsMigrated) {
                s.campItemsMigrated = true;
                var hasOrdersTable = (typeof PROCEDURAL_LEVEL_ORDERS !== 'undefined' && PROCEDURAL_LEVEL_ORDERS);
                Object.keys(s.stars).forEach(function (lvStr) {
                    var lvNum = parseInt(lvStr, 10);
                    if (s.stars[lvStr] > 0) {
                        var orders = hasOrdersTable ? PROCEDURAL_LEVEL_ORDERS[lvNum] : null;
                        if (!orders && typeof RAW_LEVELS !== 'undefined' && Array.isArray(RAW_LEVELS)) {
                            var row = RAW_LEVELS.find(function(r) { return r[0] === lvNum; });
                            if (row && Array.isArray(row[6])) orders = row[6];
                        }
                        if (Array.isArray(orders)) {
                            orders.forEach(function (oId) {
                                var parts = String(oId).split('_lv');
                                var itemLv = parts.length === 2 ? parseInt(parts[1], 10) || 1 : 1;
                                s.campItems.push({
                                    uid: 'camp_init_' + lvNum + '_' + Math.random().toString(36).substr(2, 7),
                                    id: oId,
                                    level: itemLv,
                                    name: getItemCleanName(oId),
                                    fromLevel: lvNum,
                                    addedAt: Date.now()
                                });
                            });
                        }
                    }
                });
            }
            s.settings = Object.assign(defaultSave().settings, parsed.settings || {});
            // Đảm bảo nhạc nền mặc định là TẮT (trừ khi người chơi đã chủ động bấm BẬT trong Cài đặt)
            if (s.settings && !s.settings.bgmUserToggled) {
                s.settings.bgm = false;
            }
            if (typeof s.gems !== 'number') s.gems = 8;
            if (typeof s.lastEnergyTs !== 'number') s.lastEnergyTs = Date.now();
            // Chuyển đổi save sang nền kinh tế Vàng x10
            if (s.econVer !== ECON_VERSION) {
                s.econVer = ECON_VERSION;
                var defCoins = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.initialProfile) ? GAME_CONFIG.initialProfile.coins : 1000;
                s.coins = Math.max(defCoins, (s.coins || 0) * 10);
                s.gems = Math.min(Math.max(s.gems || 8, 8), 50);
                s.energy = START_ENERGY;
                s.lastEnergyTs = Date.now();
            }
            if (typeof s.energy !== 'number' || isNaN(s.energy)) s.energy = START_ENERGY;

            // Giới hạn cấp độ tối đa của game là 60 màn (3 Chặng x 20 màn)
            var MAX_GAME_LEVEL = 60;
            if (s.maxLevel > MAX_GAME_LEVEL) s.maxLevel = MAX_GAME_LEVEL;
            if (s.level > MAX_GAME_LEVEL) s.level = MAX_GAME_LEVEL;
            if (s.currentBoardState && s.currentBoardState.level > MAX_GAME_LEVEL) {
                s.currentBoardState.level = MAX_GAME_LEVEL;
            }
            if (s.stars && typeof s.stars === 'object') {
                Object.keys(s.stars).forEach(function (k) {
                    if (parseInt(k, 10) > MAX_GAME_LEVEL) delete s.stars[k];
                });
            }

            return s;
        }
    } catch (e) { console.log(e); }
    return defaultSave();
}

var SAVE = loadSave();

// Cơ chế Debounce lưu trữ tối ưu: giữ cập nhật tức thì trên RAM (0ms)
// và hoãn ghi đĩa localStorage (800ms) để triệt tiêu hiện tượng lag/giật khi bấm liên tục.
var _saveDebounceTimer = null;
var _hasPendingSave = false;

function flushSave() {
    if (_saveDebounceTimer) {
        clearTimeout(_saveDebounceTimer);
        _saveDebounceTimer = null;
    }
    if (_hasPendingSave && typeof localStorage !== 'undefined') {
        try {
            localStorage.setItem(SAVE_KEY, JSON.stringify(SAVE));
            _hasPendingSave = false;
        } catch (e) {
            console.warn('Lỗi ghi saveGame:', e);
        }
    }
}

function saveGame(immediate) {
    _hasPendingSave = true;
    if (immediate) {
        flushSave();
        if (typeof FIREBASE_SYNC !== 'undefined' && FIREBASE_SYNC.isConfigured() && FIREBASE_SYNC.getCurrentUser()) {
            FIREBASE_SYNC.debouncedSave(1000);
        }
        return;
    }
    if (!_saveDebounceTimer) {
        _saveDebounceTimer = setTimeout(function () {
            flushSave();
        }, 800);
    }
    if (typeof FIREBASE_SYNC !== 'undefined' && FIREBASE_SYNC.isConfigured() && FIREBASE_SYNC.getCurrentUser()) {
        FIREBASE_SYNC.debouncedSave(1500);
    }
}

// Tự động ghi ngay lập tức khi người chơi rời khỏi tab hoặc đóng trình duyệt
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', flushSave);
    window.addEventListener('pagehide', flushSave);
    if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', function () {
            if (document.visibilityState === 'hidden') {
                flushSave();
            }
        });
    }
}

function resetSave() {
    var oldPlayerId = SAVE ? SAVE.playerId : null;
    SAVE = defaultSave();
    if (oldPlayerId) SAVE.playerId = oldPlayerId; // Giữ nguyên ID người chơi khi reset dữ liệu
    saveGame(true);
}

// ---------- ĐỒNG BỘ ĐÁM MÂY & TÀI KHOẢN GOOGLE (CLOUD SYNC) ----------
var CLOUD_STORAGE_KEY_PREFIX = 'mergeCamping_cloud_';

function syncSaveToCloud(customUser, callback) {
    var user = customUser || (SAVE && SAVE.googleUser);
    if (!user || !user.email) return false;
    try {
        var cloudKey = CLOUD_STORAGE_KEY_PREFIX + encodeURIComponent(user.email.toLowerCase().trim());
        var payload = {
            version: 1,
            savedAt: Date.now(),
            playerId: SAVE.playerId,
            googleUser: user,
            saveData: JSON.parse(JSON.stringify(SAVE))
        };
        localStorage.setItem(cloudKey, JSON.stringify(payload));
        if (SAVE.googleUser) {
            SAVE.googleUser.lastSynced = Date.now();
            try { localStorage.setItem(SAVE_KEY, JSON.stringify(SAVE)); } catch (e) {}
        }
        // Đồng thời đẩy lên Firebase Firestore nếu đã cấu hình
        if (typeof FIREBASE_SYNC !== 'undefined' && FIREBASE_SYNC.isConfigured() && FIREBASE_SYNC.getCurrentUser()) {
            FIREBASE_SYNC.save(SAVE, user, callback);
        } else if (callback) {
            callback(true);
        }
        return true;
    } catch (e) {
        console.error('Cloud save failed:', e);
        if (callback) callback(false, e);
        return false;
    }
}

function restoreSaveFromCloud(email) {
    if (!email) return null;
    try {
        var cloudKey = CLOUD_STORAGE_KEY_PREFIX + encodeURIComponent(email.toLowerCase().trim());
        var raw = localStorage.getItem(cloudKey);
        if (!raw) return null;
        var parsed = JSON.parse(raw);
        if (parsed && parsed.saveData) {
            return parsed.saveData;
        }
    } catch (e) {
        console.error('Cloud restore failed:', e);
    }
    return null;
}

// Tạo mã sao lưu di động (Export Save Code để copy sang máy khác)
function exportSyncCode() {
    try {
        var cleanSave = JSON.parse(JSON.stringify(SAVE));
        var str = JSON.stringify(cleanSave);
        if (typeof btoa !== 'undefined') {
            return btoa(unescape(encodeURIComponent(str)));
        } else if (typeof Buffer !== 'undefined') {
            return Buffer.from(str, 'utf8').toString('base64');
        }
        return null;
    } catch (e) {
        return null;
    }
}

// Nhập mã sao lưu từ máy khác (Import Save Code)
function importSyncCode(codeStr) {
    if (!codeStr || typeof codeStr !== 'string') return false;
    try {
        var decoded = '';
        if (typeof atob !== 'undefined') {
            decoded = decodeURIComponent(escape(atob(codeStr.trim())));
        } else if (typeof Buffer !== 'undefined') {
            decoded = Buffer.from(codeStr.trim(), 'base64').toString('utf8');
        }
        var parsed = JSON.parse(decoded);
        if (parsed && typeof parsed.coins === 'number' && typeof parsed.level === 'number') {
            SAVE = Object.assign(defaultSave(), parsed);
            saveGame();
            return true;
        }
    } catch (e) {
        console.error('Import failed:', e);
    }
    return false;
}

// ---------- DANH SÁCH THÚ CƯNG ĐỒNG HÀNH (PETS) ----------
var PET_PRICE = 2500;
var PET_CHARACTERS = [
    { id: 'character01', name: 'Golden', img: 'assets/images_webp/ui/character01.webp', price: 0 },
    { id: 'character05', name: 'Labrador', img: 'assets/images_webp/ui/character05.webp', price: 2500 },
    { id: 'character04', name: 'Poodle', img: 'assets/images_webp/ui/character04.webp', price: 5000 },
    { id: 'character03', name: 'Bulldog', img: 'assets/images_webp/ui/character03.webp', price: 9000 },
    { id: 'character02', name: 'Béc-giê', img: 'assets/images_webp/ui/character02.webp', price: 14000 },
    { id: 'character10', name: 'Ba Tư', img: 'assets/images_webp/ui/character10.webp', price: 20000 },
    { id: 'character09', name: 'Maine Coon', img: 'assets/images_webp/ui/character09.webp', price: 28000 },
    { id: 'character08', name: 'Ragdoll', img: 'assets/images_webp/ui/character08.webp', price: 38000 },
    { id: 'character07', name: 'Mèo Anh', img: 'assets/images_webp/ui/character07.webp', price: 50000 },
    { id: 'character06', name: 'Xiêm', img: 'assets/images_webp/ui/character06.webp', price: 68000 }
];

// ---------- HỒI NĂNG LƯỢNG THEO TƯƠNG TÁC (ACTIVE INTERACTION REGEN) ----------
// Năng lượng chỉ hồi khi người chơi tương tác với game (30 giây / 1 Năng lượng, hoặc 28 giây khi đạt 60 Sao).
// Nếu sau thời gian đó người chơi không tương tác hoặc rời game, bộ đếm dừng lại chờ tương tác tiếp theo.
function calcIdleEnergyRegen(currentEnergy, maxEnergy) {
    return { added: 0, secLeft: getEnergyRegenSec() };
}

// ---------- KINH TẾ ----------
// Item cấp n tương đương 2^(n-1) item cấp 1 (cũng là số năng lượng đã tốn)
function itemUnits(id) {
    var lv = parseInt(String(id).split('_lv')[1]) || 1;
    return Math.pow(2, lv - 1);
}

// ==========================================
// CÂN BẰNG KINH TẾ (ECON v2) - ĐỌC TỪ js/config.js
// Người dùng có thể điều chỉnh mọi chỉ số trong js/config.js
// ==========================================

// Giá bán: Tính theo năng lượng để tạo ra (15 Vàng / 1 Năng lượng, thu hồi 12.5% giá trị năng lượng)
function sellPrice(id) {
    if (!id || String(id).indexOf('_lv') === -1) return 0;
    var minLv = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.gameplay && typeof GAME_CONFIG.gameplay.sellMinLevel === 'number')
        ? GAME_CONFIG.gameplay.sellMinLevel : 1;
    var lv = parseInt(String(id).split('_lv')[1]) || 1;
    if (lv < minLv) return 0;

    var mul = 5;
    if (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.gameplay && typeof GAME_CONFIG.gameplay.sellMultiplier === 'number') {
        mul = GAME_CONFIG.gameplay.sellMultiplier;
    } else if (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.energyShop && GAME_CONFIG.energyShop.coinPack) {
        var cost = GAME_CONFIG.energyShop.coinPack.coinCost || 600;
        var eng = GAME_CONFIG.energyShop.coinPack.energy || 30;
        mul = Math.round((cost / eng) * 0.125);
    }
    var divisor = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.gameplay && typeof GAME_CONFIG.gameplay.sellDivisor === 'number')
        ? GAME_CONFIG.gameplay.sellDivisor : 1;
    return Math.floor(itemUnits(id) * mul / divisor);
}

// Thưởng Vàng khi nộp đơn hàng: tăng theo độ khó (cấp) của món hàng (12 Vàng / 1 Năng lượng, +10% khi đạt 90 Sao)
function orderReward(id) {
    var mul = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.gameplay && typeof GAME_CONFIG.gameplay.orderRewardMultiplier === 'number')
        ? GAME_CONFIG.gameplay.orderRewardMultiplier : 12;
    var base = mul * itemUnits(id);
    if (getTotalStars() >= 90) {
        return Math.round(base * 1.1);
    }
    return base;
}

// Thưởng Điểm Kinh Nghiệm (EXP) khi nộp đơn hàng cho Thú Cưng
// Điểm EXP được cân bằng tuyến tính theo cấp độ item trong GAME_CONFIG.itemExpByLevel
function orderExp(id) {
    var lv = parseInt(String(id).split('_lv')[1]) || 1;
    var base = 10;
    if (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.itemExpByLevel && typeof GAME_CONFIG.itemExpByLevel[lv] === 'number') {
        base = GAME_CONFIG.itemExpByLevel[lv];
    } else {
        base = Math.max(10, Math.round(Math.pow(lv, 1.85) * 10));
    }
    var mult = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.gameplay && typeof GAME_CONFIG.gameplay.orderExpMultiplier === 'number')
        ? GAME_CONFIG.gameplay.orderExpMultiplier
        : 1.0;
    return Math.max(10, Math.round(base * mult));
}
window.orderExp = orderExp;
window.getExpRequiredForLevel = getExpRequiredForLevel;

// Yêu cầu điểm EXP cần thiết để thăng cấp Level người chơi tiếp theo (Theo bảng GAME_CONFIG.expTable)
function getExpRequiredForLevel(lv) {
    var l = Math.max(1, parseInt(lv, 10) || 1);
    if (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.expTable && typeof GAME_CONFIG.expTable[l] === 'number') {
        return GAME_CONFIG.expTable[l];
    }
    // Fallback nếu chưa load xong GAME_CONFIG
    return Math.round(180 * Math.pow(l, 1.35));
}

// Cộng điểm kinh nghiệm và xử lý thăng cấp tài khoản
function addPlayerExp(amount, onLevelUpCallback) {
    if (!amount || amount <= 0) return false;
    SAVE.playerExp = (SAVE.playerExp || 0) + amount;
    SAVE.totalOrdersDelivered = (SAVE.totalOrdersDelivered || 0) + 1;
    var didLevelUp = false;
    var currentExpNeeded = getExpRequiredForLevel(SAVE.playerLevel || 1);
    
    while (SAVE.playerExp >= currentExpNeeded) {
        SAVE.playerExp -= currentExpNeeded;
        SAVE.playerLevel = (SAVE.playerLevel || 1) + 1;
        SAVE.level = SAVE.playerLevel;
        didLevelUp = true;
        currentExpNeeded = getExpRequiredForLevel(SAVE.playerLevel);
        if (typeof onLevelUpCallback === 'function') {
            onLevelUpCallback(SAVE.playerLevel);
        }
    }
    saveGame();
    return didLevelUp;
}

// Ghi nhận đơn hàng vừa hoàn thành vào bộ đệm FIFO lịch sử chống lặp (tối đa 15 đơn gần nhất)
function recordOrderDelivered(itemId) {
    if (!itemId || typeof SAVE === 'undefined' || !SAVE) return;
    if (!Array.isArray(SAVE.recentOrdersHistory)) {
        SAVE.recentOrdersHistory = [];
    }
    SAVE.recentOrdersHistory.push(itemId);
    if (SAVE.recentOrdersHistory.length > 15) {
        SAVE.recentOrdersHistory.splice(0, SAVE.recentOrdersHistory.length - 15);
    }

    var branch = (typeof itemLine === 'function') ? itemLine(itemId) : (itemId.split('_lv')[0]);
    if (branch) {
        if (!Array.isArray(SAVE.recentBranchHistory)) {
            SAVE.recentBranchHistory = [];
        }
        SAVE.recentBranchHistory.push(branch);
        if (SAVE.recentBranchHistory.length > 30) {
            SAVE.recentBranchHistory.splice(0, SAVE.recentBranchHistory.length - 30);
        }
    }

    saveGame();
}

// Thưởng Vàng khi tạo chuỗi Combo ghép liên tiếp
function getComboReward(comboCount) {
    var cfg = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.gameplay && GAME_CONFIG.gameplay.combo)
        ? GAME_CONFIG.gameplay.combo
        : { enabled: true, baseCoins: 10, stepCoins: 15, maxCoins: 200 };
    if (!cfg.enabled || comboCount < 2) return 0;
    var coins = (cfg.baseCoins || 10) + (comboCount - 2) * (cfg.stepCoins || 15);
    return Math.min(cfg.maxCoins || 200, coins);
}

// Shop năng lượng (đọc từ GAME_CONFIG.energyShop)
var ENERGY_PACK = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.energyShop && GAME_CONFIG.energyShop.coinPack) ? GAME_CONFIG.energyShop.coinPack.energy : 30;
var ENERGY_PACK_PRICE = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.energyShop && GAME_CONFIG.energyShop.coinPack) ? GAME_CONFIG.energyShop.coinPack.coinCost : 1200;
var GEM_ENERGY_PACK = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.energyShop && GAME_CONFIG.energyShop.gemPack) ? GAME_CONFIG.energyShop.gemPack.energy : 50;
var GEM_ENERGY_PRICE = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.energyShop && GAME_CONFIG.energyShop.gemPack) ? GAME_CONFIG.energyShop.gemPack.gemCost : 5;

// Quảng cáo thưởng: giới hạn số lượt mỗi ngày
var AD_REWARDS = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.adRewards) ? GAME_CONFIG.adRewards : {
    energy: { amount: 30, dailyLimit: 6 },
    gem: { amount: 8, dailyLimit: 6 },
    coin: { amount: 2500, dailyLimit: 5 },
    dailyGift: { amount: 5, doubleAmount: 10 },
    mysteryChest: { minGems: 12, maxGems: 25, dailyLimit: 3 }
};

function resetAdsIfNewDay() {
    var key = todayKey();
    if (!SAVE.ads || SAVE.ads.day !== key) {
        SAVE.ads = { day: key, energy: 0, gem: 0, coin: 0, mystery: 0, dailyGemClaimed: false };
    }
}

function getAdsLeft(type) {
    resetAdsIfNewDay();
    var cfg = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.adRewards) ? GAME_CONFIG.adRewards[type] : AD_REWARDS[type];
    return cfg ? Math.max(0, cfg.dailyLimit - (SAVE.ads[type] || 0)) : 0;
}

function consumeAd(type) {
    resetAdsIfNewDay();
    SAVE.ads[type] = (SAVE.ads[type] || 0) + 1;
    saveGame();
}

// Thưởng mỗi lần ghép: đọc từ GAME_CONFIG.gameplay.mergeRewards (Kinh tế x10)
function mergeReward(newId) {
    var lv = parseInt(String(newId).split('_lv')[1]) || 2;
    var table = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.gameplay && GAME_CONFIG.gameplay.mergeRewards)
        ? GAME_CONFIG.gameplay.mergeRewards
        : { 4: { coins: 20, gems: 0 }, 5: { coins: 50, gems: 0 }, 6: { coins: 120, gems: 0 }, 7: { coins: 250, gems: 1 }, 8: { coins: 600, gems: 2 } };
    var r = table[lv] || { coins: 0, gems: 0 };
    return { coins: r.coins || 0, gems: r.gems || 0 };
}

// Thưởng hoàn thành màn: đọc từ GAME_CONFIG.gameplay.levelClear
function levelClearReward(lv, stars, firstTime) {
    var cfg = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.gameplay && GAME_CONFIG.gameplay.levelClear) ? GAME_CONFIG.gameplay.levelClear : null;
    var allowReplay = cfg ? cfg.allowReplayReward : false;
    var energyMap = (cfg && cfg.energyPerStar) ? cfg.energyPerStar : { 1: 3, 2: 5, 3: 7 };
    var energyReward = energyMap[stars] || (stars === 1 ? 3 : (stars === 2 ? 5 : 7));
    if (!firstTime && !allowReplay) return { coins: 0, gems: 0, energy: 0 };
    var baseCoins = cfg ? cfg.baseCoins : 150;
    var perLevel = cfg ? cfg.perLevelCoins : 25;
    var perStar = cfg ? cfg.perStarCoins : 50;
    var gems3 = cfg ? cfg.gems3Stars : 2;
    var gemsOther = cfg ? cfg.gems1Or2Stars : 1;
    return {
        coins: baseCoins + lv * perLevel + stars * perStar,
        gems: stars === 3 ? gems3 : gemsOther,
        energy: energyReward
    };
}

// Task 4: Cấu trúc Đơn hàng Kim Tự Tháp (Pyramid Order Generation)
// Tôn trọng cấu hình đơn hàng chuẩn từ GAME_CONFIG.levels (1 Món Chủ Đạo Cấp Cao + 1 Món Vừa + 1 Món Nhẹ)
// Giới hạn tổng chi phí năng lượng lý thuyết giai đoạn Lv.3 - Lv.5 tối đa 18 - 20 Thể lực
function tuneOrders(rawOrders, lvNum, levelCfg) {
    if (rawOrders && Array.isArray(rawOrders) && rawOrders.length > 0) {
        return rawOrders.slice();
    }
    var base = (rawOrders || []).slice();
    var targetCount = lvNum <= 2 ? 2 : 3;

    // Thu thập các dòng item khả dụng từ nguồn phát của màn chơi hiện tại
    var genList = [];
    var cfgGens = (levelCfg && (levelCfg.generators || levelCfg.gens)) || [];
    cfgGens.forEach(function (g) {
        if (g && g[1]) genList.push(g[1]);
    });

    var availableLines = [];
    genList.forEach(function (gId) {
        var items = (typeof GENERATORS !== 'undefined' ? GENERATORS[gId] : null) || [];
        items.forEach(function (it) {
            var line = it.split('_lv')[0];
            if (availableLines.indexOf(line) === -1) {
                availableLines.push(line);
            }
        });
    });

    // Nếu không có generator hoặc không tìm thấy dòng từ generator, trích xuất dòng từ các đơn hàng gốc đã định nghĩa của màn
    if (!availableLines.length) {
        base.forEach(function (id) {
            var line = id.split('_lv')[0];
            if (availableLines.indexOf(line) === -1) {
                availableLines.push(line);
            }
        });
    }
    if (!availableLines.length) availableLines = ['an', 'ban', 'cafe'];

    var existingLines = base.map(function (id) { return id.split('_lv')[0]; });

    // Cấp độ đơn hàng bổ sung: Tối thiểu là Lv.3 để đảm bảo người chơi phải ghép đồ, không bị hoàn thành ngay từ đầu
    // Màn 1-5: Lv.3 - Lv.4
    // Màn 6-15: Lv.4 - Lv.5
    // Màn 16-29: Lv.5 - Lv.6
    // Màn 30+: Lv.6 - Lv.8 (Vật phẩm Cấp 8 làm nhiệm vụ từ Lv.30)
    var subMinLv = lvNum <= 5 ? 3 : (lvNum <= 15 ? 4 : (lvNum <= 29 ? 5 : 6));
    var subMaxLv = lvNum <= 5 ? 4 : (lvNum <= 15 ? 5 : (lvNum <= 29 ? 6 : 8));

    // Ưu tiên bổ sung các dòng chưa có đơn hàng
    for (var i = 0; i < availableLines.length && base.length < targetCount; i++) {
        var line = availableLines[i];
        if (existingLines.indexOf(line) === -1) {
            var lv = subMinLv + (base.length % (subMaxLv - subMinLv + 1));
            var newId = line + '_lv' + lv;
            base.push(newId);
            existingLines.push(line);
        }
    }

    // Nếu vẫn chưa đủ targetCount, bổ sung đơn hàng có cấp độ khác
    var cycleIdx = 0;
    while (base.length < targetCount && cycleIdx < 20) {
        var line = availableLines[cycleIdx % availableLines.length];
        var lv = subMinLv + (cycleIdx % (subMaxLv - subMinLv + 1));
        var candidateId = line + '_lv' + lv;
        if (base.indexOf(candidateId) === -1) {
            base.push(candidateId);
        } else {
            var altLv = Math.max(3, lv - 1);
            var altId = line + '_lv' + altLv;
            if (base.indexOf(altId) === -1) {
                base.push(altId);
            } else {
                base.push(line + '_lv' + (lv + 1));
            }
        }
        cycleIdx++;
    }

    return base.slice(0, targetCount);
}

// B5: Ngân sách năng lượng chuẩn cho mỗi level, đồng bộ với thuật toán rơi đồ theo thiếu hụt (computeLineDeficits)
// Sao được chấm trên số lượt bấm hữu ích (effectiveSpent = levelClicks - levelUnwantedClicks):
// - Chơi chuẩn kỹ thuật (tận dụng đồ mồi/nhện, không bán nhầm, không bấm thừa): luôn đạt 3 Sao công bằng, không sợ đen RNG
// - Chơi ẩu (bỏ qua mạng nhện, bấm loạn nguồn phát không cần thiết, để nhện lan): tụt xuống 2 Sao hoặc 1 Sao
function computeEnergyBudget(board, orderIds, level) {
    var lvNum = (level && level.num) ? level.num : 1;
    var adjWeb = !level || level.adjWeb !== false;

    var totalDeficit = 0;
    if (typeof computeLineDeficits === 'function') {
        var deficits = computeLineDeficits(board, orderIds, level, true);
        Object.keys(deficits).forEach(function (line) {
            totalDeficit += deficits[line] || 0;
        });
    } else {
        var existing = {};
        board.forEach(function (c) {
            if (!c || !c.id || GENERATORS[c.id]) return;
            var line = c.id.split('_lv')[0];
            existing[line] = (existing[line] || 0) + itemUnits(c.id);
        });
        orderIds.forEach(function (id) {
            var line = id.split('_lv')[0];
            var u = itemUnits(id);
            var use = Math.min(u, existing[line] || 0);
            existing[line] = (existing[line] || 0) - use;
            totalDeficit += Math.max(0, u - use);
        });
    }

    var webCount = 0;
    board.forEach(function (c) {
        if (c && c.isLocked) webCount++;
    });

    // Tính số lần click kỳ vọng dựa trên tỷ lệ rơi đồ Cấp 1, 2, 3 mới:
    // Từ Level 11 trở lên, thùng sinh đồ có thể rơi Lv.2 (2 đơn vị) và Lv.3 (4 đơn vị),
    // giúp giảm số lần bấm thực tế của người chơi. Ngân sách năng lượng và ngưỡng 3 sao
    // được chuẩn hóa lại theo số click thực tế này để đảm bảo độ chuẩn xác và hấp dẫn.
    var avgDropVal = (typeof getGeneratorDropExpectedValue === 'function')
        ? getGeneratorDropExpectedValue(lvNum)
        : 1.0;
    var expectedClicks = Math.ceil(totalDeficit / avgDropVal);
    var expectedEff = Math.max(3, expectedClicks);
    if (level && level.bonus) {
        expectedEff *= (lvNum >= 36 ? 0.86 : 0.90);
    }
    if (level && level.spreadEvery) {
        expectedEff *= 1.06;
    }
    if (adjWeb && webCount > 0) {
        expectedEff += Math.min(2, webCount * 0.10);
    }

    // Hạn mức tối đa để đạt 3 sao (effectiveSpent <= budget * 0.70):
    // Cho phép sai số nhỏ 1-2 lượt ở 10 màn đầu và ~12% ở các màn lớn
    var skillAllowance = lvNum <= 4 ? 1.0 : (lvNum <= 10 ? 1.5 : Math.max(2.0, expectedEff * 0.12));
    var target3StarMax = expectedEff + skillAllowance;
    var budget = Math.ceil(target3StarMax / 0.70);

    var minB = lvNum <= 2 ? 8 : (lvNum <= 4 ? 11 : (lvNum <= 10 ? 15 : 18));
    return Math.max(minB, Math.min(450, budget));
}

// Số sao theo phần trăm năng lượng còn lại
function calcStars(energyLeft, budget) {
    var r = budget > 0 ? energyLeft / budget : 0;
    return r >= 0.30 ? 3 : (r >= 0.15 ? 2 : 1);
}

// ---------- SỔ TAY SƯU TẬP VẬT PHẨM (9 DÒNG x 12 CẤP) ----------
var ITEM_CHAINS = [
    {
        line: 'an', icon: '', title: 'Ẩm Thực Dã Ngoại',
        names: [
            'Quả Táo Đỏ', 'Ổ Bánh Mì Dài', 'Bánh Sandwich Kẹp', 'Tô Mì Sợi Nóng',
            'Đĩa Trái Cây Tươi', 'Tô Hoa Quả Thập Cẩm', 'Đĩa Bánh Quy Nướng', 'Đại Tiệc BBQ Xiên Nướng',
            'Đĩa Bò Wagyu Thượng Hạng', 'Cua Hoàng Đế Hấp Dã Ngoại', 'Tiệc Cua Hoàng Đế Thượng Hạng', 'Đại Tiệc Hải Sản Cung Đình'
        ]
    },
    {
        line: 'ban', icon: '', title: 'Bàn Dã Ngoại',
        names: [
            'Bàn Nhôm Vuông Mini', 'Bàn Vải Gấp Dã Ngoại', 'Bàn Trà Dã Ngoại', 'Bàn Gỗ Cuộn Dã Ngoại',
            'Bàn Dã Ngoại Kèm Giá Lưới', 'Bàn Cắm Trại Đa Năng', 'Bàn Chiến Thuật IGT', 'Trạm Bếp Nấu Ăn Glamping',
            'Trạm Bếp Dã Ngoại Đôi', 'Bàn Đảo Bếp Dã Ngoại Inox', 'Bàn Đảo Bếp Glamping Đa Năng', 'Đại Trạm Bếp Glamping Hoàng Gia'
        ]
    },
    {
        line: 'cafe', icon: '', title: 'Cà Phê Sương Sớm',
        names: [
            'Hạt Cà Phê Robusta', 'Cối Xay Cà Phê Tay Gỗ', 'Ấm Rót Cổ Ngỗng', 'Tách Cà Phê Nóng',
            'Gói Cà Phê Specialty', 'Cối Xay Cầm Tay Inox', 'Ấm Pha Moka Pot Ý', 'Cốc Cà Phê Men Đỏ',
            'Phin Cà Phê Dã Ngoại Đồng', 'Máy Pha Espresso Dã Ngoại', 'Máy Pha Cà Phê Áp Suất Glamping', 'Quầy Barista Cà Phê Glamping'
        ]
    },
    {
        line: 'trai', icon: '', title: 'Lều Trại Trú Ngụ',
        names: [
            'Cọc Ghim Lều Kim Loại', 'Cuộn Dây Dù Căng Lều', 'Bộ Khung Cọc Chống Lều', 'Bạt Tăng Che Mưa Nắng',
            'Lều Vòm Cắm Trại 2 Người', 'Lều Gia Đình Chống Gió', 'Lều Kim Tự Tháp Glamping', 'Biệt Thự Lều Glamping',
            'Lều Chuông Glamping', 'Lều Bán Cầu Geodesic', 'Kén Nghỉ Dưỡng Mái Vòm', 'Biệt Thự Lều Safari Sang Trọng'
        ]
    },
    {
        line: 'tham', icon: '', title: 'Chỗ Ngủ Êm Ái',
        names: [
            'Bạt Trải Đất Dã Ngoại', 'Thảm Xốp Cuộn Cách Nhiệt', 'Thảm Thổ Cẩm Dã Ngoại', 'Chăn Đệm Gấp Ấm Áp',
            'Túi Ngủ Dã Ngoại', 'Võng Dù Giữa Rừng', 'Sofa Hơi Dã Ngoại', 'Đệm Hơi Đôi Cao Cấp'
        ]
    },
    {
        line: 'ghe', icon: '', title: 'Ghế Nghỉ Ngơi',
        names: [
            'Ghế Đôn Xếp Mini', 'Ghế Xếp Tựa Lưng Xanh', 'Ghế Xếp Dã Ngoại Màu Cát', 'Ghế Xếp Có Tay Vịn',
            'Ghế Câu Cá Có Khay', 'Ghế Mặt Trăng Moon Chair', 'Ghế Tựa Lưng Cao Có Gối', 'Ghế Đạo Diễn Cao Cấp',
            'Ghế Xếp Thư Giãn Bập Bênh', 'Ghế Sofa Đôi Glamping', 'Giường Ghế Xếp Đa Năng', 'Ghế Bành Glamping Sang Trọng'
        ]
    },
    {
        line: 'bep', icon: '', title: 'Lửa & Bếp Trại',
        names: [
            'Nhánh Củi Khô', 'Khúc Gỗ Tròn', 'Bó Củi Buộc Dây', 'Hố Đá Xếp Lửa',
            'Đống Củi Trại Vòng Đá', 'Lửa Trại Rực Hồng', 'Lò Nướng Than Hoa Tròn', 'Bếp Nướng BBQ Chữ Nhật',
            'Bếp Gas Dã Ngoại Đôi', 'Lò Nướng Bánh Pizza Dã Ngoại', 'Bếp Nấu Đa Năng Glamping', 'Bếp Hoàng Gia Lửa Trại Glamping'
        ]
    },
    {
        line: 'congcu', icon: '', title: 'Chiếu Sáng Dã Ngoại',
        names: [
            'Bóng Đèn LED Treo Lều', 'Đèn Pin Cầm Tay Dã Ngoại', 'Dây Đèn LED Đom Đóm', 'Đèn Lồng Dã Ngoại',
            'Đèn Bảng LED Dã Ngoại', 'Đèn Bão Dã Ngoại Vintage', 'Đèn Cắm Trại Chân Cao Tripod', 'Đèn Bão Cổ Điển Retro',
            'Cột Đèn Glamping Đôi', 'Đèn Thao Tác Chuyên Dụng', 'Hệ Thống Chiếu Sáng Trại Glamping', 'Đèn Cực Quang Glamping Thượng Hạng'
        ]
    },
    {
        line: 'antoan', icon: '', title: 'Nguồn Điện & Trạm Năng Lượng',
        names: [
            'Cáp Sạc Dã Ngoại Bọc Dù', 'Củ Sạc Nhanh Dã Ngoại', 'Pin Sạc Dự Phòng Bỏ Túi', 'Pin Sạc Dự Phòng Chống Sốc',
            'Quạt Tích Điện Dã Ngoại', 'Tấm Pin Năng Lượng Mặt Trời', 'Trạm Điện Di Động Mini', 'Trạm Điện Dã Ngoại Glamping',
            'Bộ Lưu Điện Dung Lượng Cao', 'Trạm Điện Mặt Trời Công Suất Lớn', 'Máy Phát Điện Siêu Cách Âm', 'Trạm Năng Lượng Glamping Hoàng Gia'
        ]
    }
];

// Đồng bộ danh mục 72 vật phẩm với bộ từ điển đa ngôn ngữ
if (typeof I18N !== 'undefined' && typeof I18N.syncItemChainsLanguage === 'function') {
    I18N.syncItemChainsLanguage();
}

function getItemDisplayName(id) {
    if (!id) return '';
    if (typeof I18N !== 'undefined' && typeof I18N.getItemName === 'function') {
        var base = I18N.getItemName(id);
        var parts = String(id).split('_lv');
        var lv = parts.length === 2 ? parseInt(parts[1]) || 1 : null;
        return lv ? base + ' (Lv.' + lv + ')' : base;
    }
    if (id === 'generator_backpack') return 'Ba Lô Dã Ngoại';
    if (id === 'generator_cooler') return 'Xe Kéo Dã Ngoại';
    if (id === 'generator_crate') return 'Thùng Dụng Cụ';
    var parts = String(id).split('_lv');
    var line = parts[0], lv = parseInt(parts[1]) || 1;
    var chain = ITEM_CHAINS.find(function (c) { return c.line === line; });
    if (!chain) return id;
    return (chain.names[lv - 1] || id) + ' (Lv.' + lv + ')';
}

function getItemCleanName(id) {
    if (!id) return '';
    if (typeof I18N !== 'undefined' && typeof I18N.getItemName === 'function') {
        return I18N.getItemName(id);
    }
    if (id === 'generator_backpack') return 'Ba Lô Dã Ngoại';
    if (id === 'generator_cooler') return 'Xe Kéo Dã Ngoại';
    if (id === 'generator_crate') return 'Thùng Dụng Cụ';
    var parts = String(id).split('_lv');
    var line = parts[0], lv = parseInt(parts[1]) || 1;
    var chain = (typeof ITEM_CHAINS !== 'undefined') ? ITEM_CHAINS.find(function (c) { return c.line === line; }) : null;
    if (chain && chain.names && chain.names[lv - 1]) return chain.names[lv - 1];
    return id;
}

function getItemImagePath(id) {
    if (!id) return '';
    return id === 'ban_lv8' ? 'assets/images_webp/items/ban_level8.webp' : ('assets/images_webp/items/' + id + '.webp');
}

function addCampItem(itemId, fromLevel) {
    if (!itemId) return null;
    if (!SAVE.campItems || !Array.isArray(SAVE.campItems)) SAVE.campItems = [];
    var parts = String(itemId).split('_lv');
    var lv = parts.length === 2 ? parseInt(parts[1]) || 1 : 1;
    var name = getItemCleanName(itemId);
    var itemObj = {
        uid: 'camp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 7),
        id: itemId,
        level: lv,
        name: name,
        fromLevel: fromLevel || 1,
        addedAt: Date.now()
    };
    SAVE.campItems.push(itemObj);

    // Tự động gắn vào Trại của bạn nếu slot tương ứng chưa có đồ
    if (typeof autoEquipIfSlotEmpty === 'function') {
        autoEquipIfSlotEmpty(itemObj);
    }

    saveGame();
    return itemObj;
}

function removeCampItem(uid) {
    if (!SAVE.campItems || !Array.isArray(SAVE.campItems)) return false;
    var idx = SAVE.campItems.findIndex(function(it) { return it.uid === uid; });
    if (idx !== -1) {
        SAVE.campItems.splice(idx, 1);
        saveGame();
        return true;
    }
    return false;
}

function getChainGenerator(line) {
    if (line === 'ban' || line === 'ghe' || line === 'trai') {
        return {
            id: 'generator_cooler',
            name: 'Xe Kéo',
            icon: 'assets/images_webp/items/generator_cooler.webp'
        };
    }
    if (line === 'tham' || line === 'antoan' || line === 'bep') {
        return {
            id: 'generator_crate',
            name: 'Thùng Dụng Cụ',
            icon: 'assets/images_webp/items/generator_crate.webp'
        };
    }
    return {
        id: 'generator_backpack',
        name: 'Ba Lô',
        icon: 'assets/images_webp/items/generator_backpack.webp'
    };
}

// Thưởng khi mở khóa lần đầu trong Cẩm Nang: trả về { coins, gems } (đọc từ GAME_CONFIG.discoveryBook)
function getBookReward(id) {
    var cfg = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.discoveryBook) ? GAME_CONFIG.discoveryBook : null;
    var lv = parseInt(String(id).split('_lv')[1]) || 1;
    var mul = cfg ? cfg.coinsMultiplier : 3;
    var gemMin = cfg ? cfg.gemUnlockMinLevel : 7;
    var gemAmt = cfg ? cfg.gemsReward : 1;
    var coins = lv * mul;
    var gems = lv >= gemMin ? gemAmt : 0;
    return { coins: coins, gems: gems };
}

// Quét bàn cờ để ghi nhận vật phẩm mới được mở khóa (không bị nhện khóa)
function scanBoardForDiscoveries(board) {
    var newlyDiscovered = [];
    board.forEach(function (c) {
        if (!c || !c.id || c.isLocked || c.isRock) return;
        if (typeof GENERATORS !== 'undefined' && GENERATORS[c.id]) return;
        if (!SAVE.discovered[c.id]) {
            SAVE.discovered[c.id] = true;
            newlyDiscovered.push(c.id);
        }
    });
    if (newlyDiscovered.length > 0) saveGame();
    return newlyDiscovered;
}

function countDiscoveredItems() {
    return Object.keys(SAVE.discovered).length;
}

function countUnclaimedBookRewards() {
    var count = 0;
    Object.keys(SAVE.discovered).forEach(function (id) {
        if (!SAVE.claimedBook[id]) count++;
    });
    return count;
}

// ---------- KHU CẮM TRẠI (60 VẬT PHẨM TƯƠNG ỨNG 60 LEVEL & 3 CHẶNG) ----------
var CAMP_DECORS = [
    // Chặng 1: Level 1 - 20 (Khởi đầu hành trình & Dựng trại tiện nghi)
    [1, 'ghe_lv4', 'Ghế Xếp Có Tay Vịn'],
    [2, 'an_lv4', 'Tô Mì Sợi Nóng'],
    [3, 'tham_lv4', 'Chăn Đệm Gấp Ấm Áp'],
    [4, 'ban_lv4', 'Bàn Gỗ Cuộn Dã Ngoại'],
    [5, 'an_lv3', 'Bánh Sandwich Kẹp'],
    [6, 'tham_lv3', 'Thảm Thổ Cẩm Dã Ngoại'],
    [7, 'ghe_lv5', 'Ghế Câu Cá Có Khay'],
    [8, 'an_lv5', 'Đĩa Trái Cây Tươi'],
    [9, 'tham_lv5', 'Túi Ngủ Dã Ngoại'],
    [10, 'trai_lv5', 'Lều Vòm Cắm Trại 2 Người'],
    [11, 'cafe_lv5', 'Gói Cà Phê Specialty'],
    [12, 'congcu_lv5', 'Đèn Bảng LED Dã Ngoại'],
    [13, 'bep_lv5', 'Đống Củi Trại Vòng Đá'],
    [14, 'antoan_lv5', 'Quạt Tích Điện Dã Ngoại'],
    [15, 'an_lv6', 'Tô Hoa Quả Thập Cẩm'],
    [16, 'cafe_lv6', 'Cối Xay Cầm Tay Inox'],
    [17, 'ban_lv6', 'Bàn Cắm Trại Đa Năng'],
    [18, 'bep_lv6', 'Lửa Trại Rực Hồng'],
    [19, 'ghe_lv6', 'Ghế Mặt Trăng Moon Chair'],
    [20, 'trai_lv6', 'Lều Gia Đình Chống Gió'],

    // Chặng 2: Level 21 - 40 (Cắm trại chuyên nghiệp & Nâng cao)
    [21, 'tham_lv6', 'Võng Dù Giữa Rừng'],
    [22, 'congcu_lv6', 'Đèn Bão Dã Ngoại Vintage'],
    [23, 'bep_lv6', 'Lửa Trại Rực Hồng'],
    [24, 'antoan_lv6', 'Tấm Pin Năng Lượng Mặt Trời'],
    [25, 'trai_lv6', 'Lều Gia Đình Chống Gió'],
    [26, 'an_lv7', 'Đĩa Bánh Quy Nướng'],
    [27, 'an_lv6', 'Tô Hoa Quả Thập Cẩm'],
    [28, 'cafe_lv7', 'Ấm Pha Moka Pot Ý'],
    [29, 'antoan_lv6', 'Tấm Pin Năng Lượng Mặt Trời'],
    [30, 'ban_lv7', 'Bàn Chiến Thuật IGT'],
    [31, 'an_lv7', 'Đĩa Bánh Quy Nướng'],
    [32, 'bep_lv7', 'Lò Nướng Than Hoa Tròn'],
    [33, 'cafe_lv7', 'Ấm Pha Moka Pot Ý'],
    [34, 'congcu_lv7', 'Đèn Cắm Trại Chân Cao Tripod'],
    [35, 'ban_lv7', 'Bàn Chiến Thuật IGT'],
    [36, 'tham_lv7', 'Sofa Hơi Dã Ngoại'],
    [37, 'tham_lv6', 'Võng Dù Giữa Rừng'],
    [38, 'ghe_lv7', 'Ghế Tựa Lưng Cao Có Gối'],
    [39, 'congcu_lv7', 'Đèn Cắm Trại Chân Cao Tripod'],
    [40, 'trai_lv7', 'Lều Kim Tự Tháp Glamping'],

    // Chặng 3: Level 41 - 60 (Đẳng cấp Glamping sang trọng & Masterpieces)
    [41, 'tham_lv7', 'Sofa Hơi Dã Ngoại'],
    [42, 'antoan_lv7', 'Trạm Điện Di Động Mini'],
    [43, 'ghe_lv7', 'Ghế Tựa Lưng Cao Có Gối'],
    [44, 'an_lv8', 'Đại Tiệc BBQ Xiên Nướng'],
    [45, 'trai_lv7', 'Lều Kim Tự Tháp Glamping'],
    [46, 'cafe_lv8', 'Cốc Cà Phê Men Đỏ'],
    [47, 'antoan_lv7', 'Trạm Điện Di Động Mini'],
    [48, 'ban_lv8', 'Trạm Bếp Nấu Ăn Glamping'],
    [49, 'an_lv8', 'Đại Tiệc BBQ Xiên Nướng'],
    [50, 'bep_lv8', 'Bếp Nướng BBQ Chữ Nhật'],
    [51, 'cafe_lv8', 'Cốc Cà Phê Men Đỏ'],
    [52, 'congcu_lv8', 'Đèn Bão Cổ Điển Retro'],
    [53, 'ban_lv8', 'Trạm Bếp Nấu Ăn Glamping'],
    [54, 'tham_lv8', 'Đệm Hơi Đôi Cao Cấp'],
    [55, 'bep_lv8', 'Bếp Nướng BBQ Chữ Nhật'],
    [56, 'ghe_lv8', 'Ghế Đạo Diễn Cao Cấp'],
    [57, 'congcu_lv8', 'Đèn Bão Cổ Điển Retro'],
    [58, 'antoan_lv8', 'Trạm Điện Dã Ngoại Glamping'],
    [59, 'tham_lv8', 'Đệm Hơi Đôi Cao Cấp'],
    [60, 'trai_lv8', 'Biệt Thự Lều Glamping']
];

function getCampDecor(level) {
    return CAMP_DECORS.find(function (d) { return d[0] === level; });
}

function isCampDecorUnlocked(d) {
    if (!d) return false;
    var lv = d[0];
    if (SAVE && SAVE.settings && SAVE.settings.unlockAllLevels) return true;
    if (SAVE && SAVE.stars && SAVE.stars[lv]) return true;
    return false;
}

function countUnlockedDecors() {
    if (SAVE && Array.isArray(SAVE.campItems) && SAVE.campItems.length > 0) {
        return SAVE.campItems.length;
    }
    return CAMP_DECORS.filter(function (d) { return isCampDecorUnlocked(d); }).length;
}
