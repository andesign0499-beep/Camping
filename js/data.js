// ==========================================
// DỮ LIỆU 45 LEVEL DUY NHẤT (Lộ trình mở khóa trọn vẹn Lv.1 -> Lv.8)
// - Lv 1 - 10 : Đơn hàng tối đa Lv.4 - Lv.5
// - Lv 11 - 25: Mở khóa đơn hàng Lv.6
// - Lv 26 - 35: Mở khóa đơn hàng Lv.7
// - Lv 36 - 45: Mở khóa trọn bộ 9 vật phẩm tối thượng Lv.8
// ==========================================

// Danh sách ảnh nền màn chơi (Tự động lặp tuần hoàn theo bộ ảnh WebP 3D mới)
var LEVEL_BACKGROUNDS = [
    'assets/images_webp/background/bg_doibu.webp?v=10.46',          // Level 1: Đồi Bù (Đứng đầu)
    'assets/images_webp/background/bg_hodongdo.webp',       // Level 2: Cao nguyên Lâm Viên (Đứng thứ 2)
    'assets/images_webp/background/bg_nuimatthan.webp',     // Level 3: Núi Mắt Thần
    'assets/images_webp/background/bg_thacbandoc.webp',     // Level 4: Thác Bản Giốc
    'assets/images_webp/background/bg_doichatmuine.webp?v=10.46',   // Level 5: Đồi Cát Mũi Né
    'assets/images_webp/background/bg_songnuocbinhba.webp?v=10.46'  // Level 6: Sóng nước Bình Ba
];

// Danh sách Điểm Đến cắm trại bán trong Khu Trại (Mỗi địa điểm đều có ảnh nền 3D khu trại WebP tương ứng)
var CAMP_LOCATIONS = [
    { id: 'loc_doibu', nameKey: 'dest_doibu', name: 'Đồi Bù', img: 'assets/images_webp/background/bg_doibu.webp?v=10.46', campBg: 'assets/images_webp/background/bg_doibu.webp?v=10.46', price: 0 },
    { id: 'loc_dongdo', nameKey: 'dest_dongdo', name: 'Cao nguyên Lâm Viên', img: 'assets/images_webp/background/bg_hodongdo.webp', campBg: 'assets/images_webp/background/bg_hodongdo.webp', price: 4000 },
    { id: 'loc_matthan', nameKey: 'dest_matthan', name: 'Núi Mắt Thần', img: 'assets/images_webp/background/bg_nuimatthan.webp', campBg: 'assets/images_webp/background/bg_nuimatthan.webp', price: 8000 },
    { id: 'loc_bangioc', nameKey: 'dest_bangioc', name: 'Thác Bản Giốc', img: 'assets/images_webp/background/bg_thacbandoc.webp', campBg: 'assets/images_webp/background/bg_thacbandoc.webp', price: 15000 },
    { id: 'loc_muine', nameKey: 'dest_muine', name: 'Đồi Cát Mũi Né', img: 'assets/images_webp/background/bg_doichatmuine.webp?v=10.46', campBg: 'assets/images_webp/background/bg_doichatmuine.webp?v=10.46', price: 23000 },
    { id: 'loc_songnuocbinhba', nameKey: 'dest_songnuocbinhba', name: 'Sóng nước Bình Ba', img: 'assets/images_webp/background/bg_songnuocbinhba.webp?v=10.46', campBg: 'assets/images_webp/background/bg_songnuocbinhba.webp?v=10.46', price: 30000 }
];

function getActiveLocationBackground() {
    if (typeof SAVE !== 'undefined' && SAVE && SAVE.activeLocation && typeof CAMP_LOCATIONS !== 'undefined') {
        var found = CAMP_LOCATIONS.find(function (l) { return l.id === SAVE.activeLocation; });
        if (found && found.img) return found.img;
    }
    return null;
}

// Lấy ảnh nền cho màn hình "Trại của bạn" dựa trên địa điểm người dùng đang kích hoạt
// Nếu địa điểm chưa có ảnh _bg thì mặc định dùng bg_khutrai.jpg
function getMyCampBackgroundSrc() {
    var defaultSrc = 'assets/images_webp/items_khutrai/bg_khutrai.jpg';
    if (typeof MYCAMP_CONFIG !== 'undefined' && MYCAMP_CONFIG.background && MYCAMP_CONFIG.background.src) {
        defaultSrc = MYCAMP_CONFIG.background.src;
    }

    if (typeof SAVE === 'undefined' || !SAVE || !SAVE.activeLocation) {
        return defaultSrc;
    }

    var activeLocId = SAVE.activeLocation;

    // 1. Kiểm tra cấu hình liên kết trong MYCAMP_CONFIG.locationBackgrounds
    if (typeof MYCAMP_CONFIG !== 'undefined' && MYCAMP_CONFIG.locationBackgrounds && MYCAMP_CONFIG.locationBackgrounds[activeLocId]) {
        return MYCAMP_CONFIG.locationBackgrounds[activeLocId];
    }

    // 2. Kiểm tra thuộc tính campBg trong danh sách CAMP_LOCATIONS
    if (typeof CAMP_LOCATIONS !== 'undefined' && Array.isArray(CAMP_LOCATIONS)) {
        var found = CAMP_LOCATIONS.find(function (l) { return l.id === activeLocId; });
        if (found && found.campBg) {
            return found.campBg;
        }
    }

    // 3. Dự phòng mặc định nếu địa điểm chưa có ảnh _bg
    return defaultSrc;
}

function updateActiveLocationBackground() {
    var topSceneEl = document.getElementById('top-scene');
    if (topSceneEl) {
        topSceneEl.style.background = 'transparent';
        topSceneEl.style.backgroundImage = 'none';
    }
    var backdropEl = document.getElementById('game-backdrop');
    var targetEl = backdropEl || document.getElementById('game-app');
    var customBg = getActiveLocationBackground();
    var bgUrl = customBg || (typeof currentLevel !== 'undefined' ? getLevelBackground(currentLevel) : 'assets/images_webp/background/bg_doibu.webp');
    if (bgUrl && targetEl) {
        var gradientOverlay = 'linear-gradient(180deg, ' +
            'rgba(53, 76, 48, 0) 0%, ' +
            'rgba(53, 76, 48, 0) 22%, ' +
            'rgba(53, 76, 48, 0.25) 34%, ' +
            'rgba(47, 68, 43, 0.60) 48%, ' +
            'rgba(41, 59, 37, 0.82) 64%, ' +
            'rgba(38, 54, 34, 0.90) 80%, ' +
            '#263622 100%)';
        targetEl.style.backgroundImage = gradientOverlay + ", url('" + bgUrl + "'), url('assets/images_webp/ui/bg_game_all.jpg')";
        targetEl.style.backgroundPosition = "center top, center -20px, center top";
        targetEl.style.backgroundRepeat = "no-repeat, no-repeat, no-repeat";
        targetEl.style.backgroundSize = "100% 100%, 80% auto, cover";
        targetEl.style.backgroundColor = '#263622';
    }

    // Đồng bộ mây bay ở màn chơi: Hiển thị mây bay cho tất cả các map
    var cloudsEl = document.getElementById('top-scene-clouds');
    if (cloudsEl) {
        cloudsEl.style.display = 'block';
    }

    // Cập nhật đồng bộ ảnh nền Trại của bạn nếu đang mở hoặc sau khi đổi điểm đến
    var myCampBgImg = document.getElementById('mycamp-bg-img');
    if (myCampBgImg && typeof getMyCampBackgroundSrc === 'function') {
        var campBg = getMyCampBackgroundSrc();
        if (myCampBgImg.getAttribute('src') !== campBg) {
            myCampBgImg.src = campBg;
        }
    }
}

function getLevelBackground(lvNum) {
    var customBg = getActiveLocationBackground();
    if (customBg) return customBg;
    if (!LEVEL_BACKGROUNDS || !LEVEL_BACKGROUNDS.length) return 'assets/images_webp/background/bg_hodongdo.webp';
    var idx = (Math.max(1, parseInt(lvNum, 10) || 1) - 1) % LEVEL_BACKGROUNDS.length;
    return LEVEL_BACKGROUNDS[idx];
}

// ==========================================
// HỆ THỐNG DỮ LIỆU LEVEL TỰ ĐỘNG (60 LEVEL TRONG 3 CHẶNG)
// Sử dụng công thức generateLevelConfig(lvNum) từ js/config.js
// ==========================================
var RAW_LEVELS = [];

if (typeof GAME_CONFIG !== 'undefined' && Array.isArray(GAME_CONFIG.levels) && GAME_CONFIG.levels.length > 0) {
    RAW_LEVELS = GAME_CONFIG.levels.map(function (l) {
        return [
            l.level,
            '',
            l.pattern,
            l.generators || [],
            l.freeItems || [],
            l.webItems || [],
            l.orders || [],
            l.mechanics || {},
            l.rocks || []
        ];
    });
} else if (typeof generateLevelConfig === 'function') {
    for (var _i = 1; _i <= 60; _i++) {
        var _cfg = generateLevelConfig(_i);
        RAW_LEVELS.push([
            _cfg.level,
            '',
            _cfg.pattern,
            _cfg.generators || [],
            _cfg.freeItems || [],
            _cfg.webItems || [],
            _cfg.orders || [],
            _cfg.mechanics || {},
            _cfg.rocks || []
        ]);
    }
}

function getLevelConfig(lvNum) {
    var MAX_GAME_LEVEL = 60;
    lvNum = Math.max(1, Math.min(MAX_GAME_LEVEL, parseInt(lvNum, 10) || 1));

    var cfg = null;
    if (typeof GAME_CONFIG !== 'undefined' && Array.isArray(GAME_CONFIG.levels)) {
        cfg = GAME_CONFIG.levels.find(function (l) { return l.level === lvNum; });
        if (!cfg && typeof generateLevelConfig === 'function' && lvNum <= MAX_GAME_LEVEL) {
            cfg = generateLevelConfig(lvNum);
            GAME_CONFIG.levels.push(cfg);
            RAW_LEVELS.push([
                cfg.level,
                '',
                cfg.pattern,
                cfg.generators || [],
                cfg.freeItems || [],
                cfg.webItems || [],
                cfg.orders || [],
                cfg.mechanics || {},
                cfg.rocks || []
            ]);
        }
    } else if (typeof generateLevelConfig === 'function') {
        cfg = generateLevelConfig(lvNum);
    }

    if (cfg) {
        var mech = cfg.mechanics || {};
        return {
            num: cfg.level,
            name: '',
            pattern: cfg.pattern,
            rocks: cfg.rocks || [],
            gens: cfg.generators || [],
            generators: cfg.generators || [],
            free: cfg.freeItems || [],
            webs: cfg.webItems || [],
            rawOrders: cfg.orders || [],
            adjWeb: mech.adjWeb !== undefined ? mech.adjWeb : (cfg.level >= 3),
            bonus: !!mech.bonus,
            spreadEvery: mech.spreadEvery || 0,
            dialogue: cfg.dialogue || null
        };
    }

    var row = RAW_LEVELS.find(function (r) { return r[0] === lvNum; }) || RAW_LEVELS[0];
    var rMech = row[7] || {};
    return {
        num: row[0],
        name: '',
        pattern: row[2],
        gens: row[3],
        generators: row[3],
        free: row[4],
        webs: row[5],
        rawOrders: row[6],
        adjWeb: rMech.adjWeb !== undefined ? rMech.adjWeb : (row[0] >= 3),
        bonus: !!rMech.bonus,
        spreadEvery: rMech.spreadEvery || 0,
        rocks: row[8] || [],
        dialogue: null
    };
}

// ==========================================
// 3 NHÂN VẬT ĐỒNG HÀNH & HỘI THOẠI HƯỚNG DẪN TỰ ĐỘNG
// ==========================================
var NPC_CHARACTERS = {
    gau: {
        id: 'gau',
        name: 'Bác Gấu Nâu',
        avatar: 'assets/images_webp/ui/character01.webp',
        role: 'Bếp Trưởng & Pha Chế'
    },
    cao: {
        id: 'cao',
        name: 'Nhiếp Ảnh Cáo',
        avatar: 'assets/images_webp/ui/character02.webp',
        role: 'Thám Hiểm & Săn Ảnh'
    },
    de: {
        id: 'de',
        name: 'Học Giả Dế Mèn',
        avatar: 'assets/images_webp/ui/character03.webp',
        role: 'Kỹ Thuật & Sổ Tay Sinh Tồn'
    }
};

var NPC_ORDER = ['gau', 'cao', 'de'];

var LEVEL_STORY_DIALOGUES = {};
if (typeof GAME_CONFIG !== 'undefined' && Array.isArray(GAME_CONFIG.levels)) {
    GAME_CONFIG.levels.forEach(function (l) {
        if (l.dialogue && l.level) {
            LEVEL_STORY_DIALOGUES[l.level] = l.dialogue;
        }
    });
}

// Tự động khởi tạo ảnh nền màn chơi và mây bay khi trang sẵn sàng
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            updateActiveLocationBackground();
        });
    } else {
        updateActiveLocationBackground();
    }
}
