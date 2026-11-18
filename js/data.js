// ==========================================
// DỮ LIỆU 45 LEVEL DUY NHẤT (Lộ trình mở khóa trọn vẹn Lv.1 -> Lv.8)
// - Lv 1 - 10 : Đơn hàng tối đa Lv.4 - Lv.5
// - Lv 11 - 25: Mở khóa đơn hàng Lv.6
// - Lv 26 - 35: Mở khóa đơn hàng Lv.7
// - Lv 36 - 45: Mở khóa trọn bộ 9 vật phẩm tối thượng Lv.8
// ==========================================

// Danh sách ảnh nền màn chơi (Tự động lặp tuần hoàn theo bộ ảnh WebP 3D mới)
var LEVEL_BACKGROUNDS = [
    'assets/images_webp/background/bg_hodongdo.webp',               // Level 1: Cao nguyên Lâm Viên (Mặc định)
    'assets/images_webp/background/bg_nuimatthan.webp',             // Level 2: Núi Mắt Thần
    'assets/images_webp/background/bg_thacbandoc.webp',             // Level 3: Thác Bản Giốc
    'assets/images_webp/background/bg_doichatmuine.webp?v=10.46',   // Level 4: Đồi Cát Mũi Né
    'assets/images_webp/background/bg_songnuocbinhba.webp?v=10.46'  // Level 5: Sóng nước Bình Ba
];

// Danh sách Điểm Đến cắm trại bán trong Khu Trại (5 địa điểm - Mỗi địa điểm đều có ảnh nền 3D khu trại WebP tương ứng)
var CAMP_LOCATIONS = [
    { id: 'loc_dongdo', nameKey: 'dest_dongdo', name: 'Cao nguyên Lâm Viên', img: 'assets/images_webp/background/bg_hodongdo.webp', campBg: 'assets/images_webp/background/bg_hodongdo.webp', price: 0 },
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
    var islandEl = document.getElementById('backdrop-island');
    var targetEl = islandEl || backdropEl || document.getElementById('game-app');
    var customBg = getActiveLocationBackground();
    var bgUrl = customBg || (typeof currentLevel !== 'undefined' ? getLevelBackground(currentLevel) : 'assets/images_webp/background/bg_hodongdo.webp');
    if (bgUrl && targetEl) {
        var gradientOverlay = 'linear-gradient(180deg, ' +
            'rgba(53, 76, 48, 0) 0%, ' +
            'rgba(53, 76, 48, 0) 22%, ' +
            'rgba(53, 76, 48, 0.25) 34%, ' +
            'rgba(47, 68, 43, 0.60) 48%, ' +
            'rgba(41, 59, 37, 0.82) 64%, ' +
            'rgba(38, 54, 34, 0.90) 80%, ' +
            '#263622 100%)';
        
        if (islandEl) {
            islandEl.style.backgroundImage = gradientOverlay + ", url('" + bgUrl + "')";
            islandEl.style.backgroundPosition = "center top, center -20px";
            islandEl.style.backgroundRepeat = "no-repeat, no-repeat";
            islandEl.style.backgroundSize = "100% 100%, 80% auto";
        } else {
            targetEl.style.backgroundImage = gradientOverlay + ", url('" + bgUrl + "'), url('assets/images_webp/ui/bg_game_all.jpg')";
            targetEl.style.backgroundPosition = "center top, center -20px, center top";
            targetEl.style.backgroundRepeat = "no-repeat, no-repeat, no-repeat";
            targetEl.style.backgroundSize = "100% 100%, 80% auto, cover";
            targetEl.style.backgroundColor = '#263622';
        }
    }

    // Ưu tiên 4 đám mây hoàng hôn trong nền trời game-backdrop
    var cloudsEl = document.getElementById('top-scene-clouds');
    if (cloudsEl) {
        cloudsEl.style.display = 'none';
    }

    // Cập nhật tỷ lệ co giãn cho mây theo đúng tỷ lệ ảnh nền bg_game_all.jpg (1100x1971 cover)
    updateBackdropScale();

    // Cập nhật đồng bộ ảnh nền Trại của bạn nếu đang mở hoặc sau khi đổi điểm đến
    var myCampBgImg = document.getElementById('mycamp-bg-img');
    if (myCampBgImg && typeof getMyCampBackgroundSrc === 'function') {
        var campBg = getMyCampBackgroundSrc();
        if (myCampBgImg.getAttribute('src') !== campBg) {
            myCampBgImg.src = campBg;
        }
    }
}

// Đồng bộ tỷ lệ to/nhỏ của 4 đám mây với ảnh nền bg_game_all.jpg khi cửa sổ co giãn
function updateBackdropScale() {
    var backdrop = document.getElementById('game-backdrop');
    if (!backdrop) return;
    var w = backdrop.clientWidth || window.innerWidth || 412;
    var h = backdrop.clientHeight || window.innerHeight || 850;
    // Ảnh nền gốc bg_game_all.jpg có kích thước 1100 x 1971
    var scale = Math.max(w / 1100, h / 1971);
    backdrop.style.setProperty('--bg-scale', scale.toFixed(4));
    backdrop.style.setProperty('--backdrop-w', w + 'px');

    var myCampScreen = document.getElementById('my-camp-screen');
    if (myCampScreen) {
        myCampScreen.style.setProperty('--bg-scale', scale.toFixed(4));
        myCampScreen.style.setProperty('--backdrop-w', w + 'px');
    }

    applyCloudConfig();
}

// Áp dụng cấu hình vị trí, tốc độ, độ mờ của 4 đám mây từ GAME_CONFIG.clouds trong js/config.js
function applyCloudConfig() {
    var cfg = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.clouds)
        ? GAME_CONFIG.clouds
        : (typeof CLOUD_CONFIG !== 'undefined' ? CLOUD_CONFIG : null);
    if (!cfg) return;

    // 1. Áp dụng cho màn hình bàn chơi chính (Gameplay)
    var gpBackdrop = document.getElementById('game-backdrop');
    if (gpBackdrop && cfg.gameplay) {
        var gp = cfg.gameplay;
        for (var i = 1; i <= 4; i++) {
            var c = gp['cloud' + i];
            if (!c) continue;
            if (c.top !== undefined) gpBackdrop.style.setProperty('--cloud' + i + '-top', c.top + 'px');
            if (c.opacity !== undefined) gpBackdrop.style.setProperty('--cloud' + i + '-opacity', c.opacity);
            if (c.speed !== undefined || c.direction !== undefined) {
                var anim = (c.direction === 'R2L') ? 'bgCloudAcrossR2L' : 'bgCloudAcrossL2R';
                var dur = (c.speed || 60) + 's';
                gpBackdrop.style.setProperty('--cloud' + i + '-anim', anim + ' ' + dur + ' linear infinite');
            }
        }
    }

    // 2. Áp dụng cho màn hình Trại của bạn (My Camp)
    var mcScreen = document.getElementById('my-camp-screen');
    if (mcScreen && cfg.myCamp) {
        var mc = cfg.myCamp;
        for (var j = 1; j <= 4; j++) {
            var mcC = mc['cloud' + j];
            if (!mcC) continue;
            if (mcC.top !== undefined) mcScreen.style.setProperty('--cloud' + j + '-top', mcC.top + 'px');
            if (mcC.opacity !== undefined) mcScreen.style.setProperty('--cloud' + j + '-opacity', mcC.opacity);
            if (mcC.speed !== undefined || mcC.direction !== undefined) {
                var mcAnim = (mcC.direction === 'R2L') ? 'bgCloudAcrossR2L' : 'bgCloudAcrossL2R';
                var mcDur = (mcC.speed || 60) + 's';
                mcScreen.style.setProperty('--cloud' + j + '-anim', mcAnim + ' ' + mcDur + ' linear infinite');
            }
        }
    }
}

if (typeof window !== 'undefined') {
    window.addEventListener('resize', updateBackdropScale);
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateBackdropScale);
    } else {
        setTimeout(updateBackdropScale, 20);
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

// Kịch bản cốt truyện Hành Trình Xuyên Việt theo từng Cấp độ & 5 Địa điểm
var LOCATION_STORY_INTROS = {
    'loc_dongdo': '🌲 Chương 1 — Cao nguyên Lâm Viên: Sương sớm se lạnh, dựng trại giữa đồi thông thôi!',
    'loc_matthan': '⛰️ Chương 2 — Núi Mắt Thần: Thung lũng cỏ xanh kỳ vĩ đang chờ chúng mình khám phá!',
    'loc_bangioc': '🌊 Chương 3 — Thác Bản Giốc: Tiếng thác đổ hùng vĩ quá, bày tiệc bên bờ suối nào!',
    'loc_muine': '🏜️ Chương 4 — Đồi Cát Mũi Né: Hoàng hôn rực lửa trên đồi cát, chuẩn bị nghỉ đêm nhé!',
    'loc_songnuocbinhba': '🏝️ Chương 5 — Sóng Nước Bình Ba: Biển xanh cát trắng, mở đại tiệc Glamping thôi!'
};

var LEVEL_STORY_DIALOGUES = {
    1: { npc: 'gau', texts: ['Chào mừng đến Cao nguyên Lâm Viên! Cùng mình lấy đồ từ Xe Kéo dựng góc trại đầu tiên nhé!'] },
    2: { npc: 'gau', texts: ['Sương chiều bắt đầu xuống rồi, ghép đồ sát các ô mạng nhện để mở rộng bãi cỏ nào!'] },
    3: { npc: 'gau', texts: ['Tuyệt lắm! Đá khóa tầng 1 đã nứt, khu trại của chúng mình thoáng đãng hơn hẳn!'] },
    4: { npc: 'cao', texts: ['🎒 Ba Lô Dã Ngoại đã mở! Kéo Ba Lô vào bàn để pha cà phê nóng và làm đồ ăn nhé!'] },
    5: { npc: 'cao', texts: ['Hương cà phê thơm lừng cả đồi thông! Tiếp tục ghép đồ tích Sao mở Rương Quà nào!'] },
    6: { npc: 'cao', texts: ['Đường mòn ven suối lộ diện rồi! Máy phát giờ rớt nhiều đồ cấp cao hơn đó!'] },
    7: { npc: 'de', texts: ['🧰 Thùng Bếp & Sinh Tồn đã sẵn sàng! Kéo vào bàn để nhóm lửa trại và trải đệm êm nhé!'] },
    8: { npc: 'de', texts: ['Đêm rừng ấm áp nhờ ánh lửa trại! Bạn có thể bật ⚡×2 để ghép đồ nhanh gấp đôi!'] },
    9: { npc: 'gau', texts: ['Bữa tối hải sản bên lửa trại đang chờ! Nếu chật bàn, nhớ cất bớt vào Kho Tạm nhé!'] },
    10: { npc: 'gau', texts: ['🎉 Cột mốc Cấp 10! Khu trại sơ khai giờ đã thành điểm dừng chân mơ ước rồi!'] },
    11: { npc: 'cao', texts: ['Đất trại tầng 2 vừa mở rộng! Chuẩn bị đón những thử thách Glamping cao cấp hơn nào!'] },
    12: { npc: 'de', texts: ['Tấm pin mặt trời đã sẵn sàng cấp điện cho cả khu trại lung linh suốt đêm!'] },
    15: { npc: 'gau', texts: ['⭐ Bậc thầy cắm trại! Khu lều vòm sàn gỗ đèn LED đã hiện lên đẹp như cổ tích!'] },
    18: { npc: 'cao', texts: ['🏆 Toàn bộ đá khóa trên bàn cờ đã được giải phóng! Không gian ghép đồ rộng tối đa!'] },
    20: { npc: 'gau', texts: ['👑 Đỉnh cao Thủ Lĩnh Dã Ngoại! Hãy chinh phục trọn bộ siêu phẩm Glamping Cấp 12 nhé!'] }
};
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
