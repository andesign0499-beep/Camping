// ==========================================
// DỮ LIỆU 45 LEVEL DUY NHẤT (Lộ trình mở khóa trọn vẹn Lv.1 -> Lv.8)
// - Lv 1 - 10 : Đơn hàng tối đa Lv.4 - Lv.5
// - Lv 11 - 25: Mở khóa đơn hàng Lv.6
// - Lv 26 - 35: Mở khóa đơn hàng Lv.7
// - Lv 36 - 45: Mở khóa trọn bộ 9 vật phẩm tối thượng Lv.8
// ==========================================

// Danh sách ảnh nền màn chơi (Tự động lặp tuần hoàn 1..N theo thứ tự mặc định)
var LEVEL_BACKGROUNDS = [
    'assets/images/ui/bg_01.jpg',
    'assets/images/ui/bg_02.jpg',
    'assets/images/ui/bg_03.jpg',
    'assets/images/ui/bg04.jpg',
    'assets/images/ui/bg05.jpg',
    'assets/images/ui/bg06.jpg',
    'assets/images/ui/bg07.jpg'
];

// Danh sách Điểm Đến cắm trại bán trong Khu Trại (Phân tầng giá từ 12.000 -> 65.000 Vàng)
var CAMP_LOCATIONS = [
    { id: 'loc_dongdo', name: 'Hồ Đồng Đò', img: 'assets/images/ui/bg_01.jpg', price: 0 },
    { id: 'loc_doibu', name: 'Đồi Bù', img: 'assets/images/ui/bg_03.jpg', price: 12000 },
    { id: 'loc_matthan', name: 'Núi Mắt Thần', img: 'assets/images/ui/bg07.jpg', price: 18000 },
    { id: 'loc_pudao', name: 'Bản Pú Đao', img: 'assets/images/ui/bg06.jpg', price: 28000 },
    { id: 'loc_taxua', name: 'Tà Xùa', img: 'assets/images/ui/bg_02.jpg', price: 38000 },
    { id: 'loc_bangioc', name: 'Thác Bản Giốc', img: 'assets/images/ui/bg05.jpg', price: 50000 },
    { id: 'loc_yty', name: 'Y Tý Đại Ngàn', img: 'assets/images/ui/bg04.jpg', price: 65000 }
];

function getActiveLocationBackground() {
    if (typeof SAVE !== 'undefined' && SAVE && SAVE.activeLocation && typeof CAMP_LOCATIONS !== 'undefined') {
        var found = CAMP_LOCATIONS.find(function (l) { return l.id === SAVE.activeLocation; });
        if (found && found.img) return found.img;
    }
    return null;
}

function updateActiveLocationBackground() {
    var topSceneEl = document.getElementById('top-scene');
    if (!topSceneEl) return;
    var customBg = getActiveLocationBackground();
    if (customBg) {
        topSceneEl.style.backgroundImage = "url('" + customBg + "')";
    } else if (typeof currentLevel !== 'undefined') {
        topSceneEl.style.backgroundImage = "url('" + getLevelBackground(currentLevel) + "')";
    }
}

function getLevelBackground(lvNum) {
    var customBg = getActiveLocationBackground();
    if (customBg) return customBg;
    if (!LEVEL_BACKGROUNDS || !LEVEL_BACKGROUNDS.length) return 'assets/images/ui/bg_01.jpg';
    var idx = (Math.max(1, parseInt(lvNum, 10) || 1) - 1) % LEVEL_BACKGROUNDS.length;
    return LEVEL_BACKGROUNDS[idx];
}

// Tự động quét và phát hiện các ảnh nền mới (bg08, bg09, bg10... hoặc bg_08, bg_09...)
// Khi người dùng thêm file ảnh nền mới vào assets/images/ui/, hàm này sẽ tự động nhận diện và cập nhật danh sách tuần hoàn
(function autoScanBackgrounds() {
    if (typeof window === 'undefined') return;
    var scanned = [];
    var maxProbe = 50;
    var consecutiveMisses = 0;

    function probe(num) {
        if (num > maxProbe || consecutiveMisses >= 3) {
            if (scanned.length >= 3) {
                LEVEL_BACKGROUNDS = scanned;
                if (typeof currentLevel !== 'undefined') {
                    var topSceneEl = document.getElementById('top-scene');
                    if (topSceneEl && typeof getLevelBackground === 'function') {
                        topSceneEl.style.backgroundImage = "url('" + getLevelBackground(currentLevel) + "')";
                    }
                }
            }
            return;
        }

        var s2 = String(num).padStart(2, '0');
        var candidates = [
            'assets/images/ui/bg' + s2 + '.jpg',
            'assets/images/ui/bg_' + s2 + '.jpg',
            'assets/images/ui/bg' + num + '.jpg',
            'assets/images/ui/bg_' + num + '.jpg',
            'assets/images/ui/bg' + s2 + '.png',
            'assets/images/ui/bg_' + s2 + '.png'
        ];

        function tryCandidate(cIdx) {
            if (cIdx >= candidates.length) {
                consecutiveMisses++;
                probe(num + 1);
                return;
            }
            var testUrl = candidates[cIdx];
            var img = new Image();
            img.onload = function () {
                scanned.push(testUrl);
                consecutiveMisses = 0;
                probe(num + 1);
            };
            img.onerror = function () {
                tryCandidate(cIdx + 1);
            };
            img.src = testUrl;
        }

        tryCandidate(0);
    }

    // Chạy ngầm sau khi trang tải xong
    setTimeout(function () {
        probe(1);
    }, 100);
})();

// ==========================================
// HỆ THỐNG DỮ LIỆU LEVEL TỰ ĐỘNG (120 LEVEL HIỆN TẠI & MỞ RỘNG VÔ HẠN)
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
    for (var _i = 1; _i <= 120; _i++) {
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
    var MAX_GAME_LEVEL = 120;
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
            spreadEvery: mech.spreadEvery || 0
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
        rocks: row[8] || []
    };
}

// ==========================================
// 3 NHÂN VẬT ĐỒNG HÀNH & HỘI THOẠI HƯỚNG DẪN TỰ ĐỘNG
// ==========================================
var NPC_CHARACTERS = {
    gau: {
        id: 'gau',
        name: '🐻 Bác Gấu Nâu',
        avatar: 'assets/images/items/avata_gau.png',
        role: 'Bếp Trưởng & Pha Chế'
    },
    cao: {
        id: 'cao',
        name: '🦊 Nhiếp Ảnh Cáo',
        avatar: 'assets/images/items/avata_cao.png',
        role: 'Thám Hiểm & Săn Ảnh'
    },
    de: {
        id: 'de',
        name: '🦗 Học Giả Dế Mèn',
        avatar: 'assets/images/items/avata_de.png',
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
