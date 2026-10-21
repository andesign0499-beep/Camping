// ==========================================
// TIẾN TRÌNH, LƯU GAME, CÂN BẰNG KINH TẾ, SỔ TAY 72 VẬT PHẨM & KHU CẮM TRẠI
// ==========================================

// ---------- LƯU / TẢI (localStorage) ----------
var SAVE_KEY = 'mergeCamping_save_v1';

function defaultSave() {
    return {
        level: 1,
        maxLevel: 1,
        coins: 100,
        gems: 20,
        stars: {},
        discovered: {},
        claimedBook: {},
        settings: {
            sound: true,
            bgm: true,
            vibrate: true,
            unlockAllLevels: false
        },
        lastEnergyTs: Date.now()
    };
}

function loadSave() {
    try {
        var raw = localStorage.getItem(SAVE_KEY);
        if (raw) {
            var parsed = JSON.parse(raw);
            var s = Object.assign(defaultSave(), parsed);
            if (!s.stars || typeof s.stars !== 'object') s.stars = {};
            if (!s.discovered || typeof s.discovered !== 'object') s.discovered = {};
            if (!s.claimedBook || typeof s.claimedBook !== 'object') s.claimedBook = {};
            s.settings = Object.assign(defaultSave().settings, parsed.settings || {});
            if (typeof s.gems !== 'number') s.gems = 20;
            if (typeof s.lastEnergyTs !== 'number') s.lastEnergyTs = Date.now();
            return s;
        }
    } catch (e) { console.log(e); }
    return defaultSave();
}

var SAVE = loadSave();

function saveGame() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(SAVE)); } catch (e) { console.log(e); }
}

function resetSave() {
    SAVE = defaultSave();
    saveGame();
}

// ---------- HỒI NĂNG LƯỢNG THEO THỜI GIAN (IDLE REGEN) ----------
var ENERGY_REGEN_SEC = 45; // 45 giây hồi +1 năng lượng

function calcIdleEnergyRegen(currentEnergy, maxEnergy) {
    var now = Date.now();
    if (currentEnergy >= maxEnergy) {
        SAVE.lastEnergyTs = now;
        return { added: 0, secLeft: ENERGY_REGEN_SEC };
    }
    var elapsedSec = Math.floor((now - (SAVE.lastEnergyTs || now)) / 1000);
    if (elapsedSec < 0) {
        SAVE.lastEnergyTs = now;
        return { added: 0, secLeft: ENERGY_REGEN_SEC };
    }
    var ticks = Math.floor(elapsedSec / ENERGY_REGEN_SEC);
    var added = 0;
    if (ticks > 0) {
        added = Math.min(ticks, maxEnergy - currentEnergy);
        if (currentEnergy + added >= maxEnergy) {
            SAVE.lastEnergyTs = now;
        } else {
            SAVE.lastEnergyTs += ticks * ENERGY_REGEN_SEC * 1000;
        }
        saveGame();
    }
    var rem = ENERGY_REGEN_SEC - Math.floor((now - SAVE.lastEnergyTs) / 1000);
    return { added: added, secLeft: Math.max(1, Math.min(ENERGY_REGEN_SEC, rem)) };
}

// ---------- KINH TẾ ----------
// Item cấp n tương đương 2^(n-1) item cấp 1 (cũng là số năng lượng đã tốn)
function itemUnits(id) {
    var lv = parseInt(String(id).split('_lv')[1]) || 1;
    return Math.pow(2, lv - 1);
}

// Giá bán hào phóng giúp người chơi thoải mái thu Vàng khi dọn bàn
function sellPrice(id) { return 5 * itemUnits(id); }

// Thưởng Vàng dồi dào khi nộp đơn hàng
function orderReward(id) { return 15 * itemUnits(id); }

// Shop năng lượng
var ENERGY_PACK = 50;
var ENERGY_PACK_PRICE = 120;
var GEM_ENERGY_PACK = 100;
var GEM_ENERGY_PRICE = 5;

// B7: Tính toán và mở rộng kịch bản nhiệm vụ (3 đến 5 đơn hàng mỗi level để tạo trải nghiệm chơi liên tục)
function tuneOrders(rawOrders, lvNum, levelCfg) {
    var base = (rawOrders || []).slice();
    var targetCount = 3;
    if (lvNum >= 9) {
        targetCount = 5;
    } else if (lvNum >= 3) {
        targetCount = 4;
    }

    if (base.length >= targetCount) {
        return base.slice(0, targetCount);
    }

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
    // Màn 16-35: Lv.5 - Lv.6
    // Màn 36-45: Lv.6 - Lv.7
    var subMinLv = lvNum <= 5 ? 3 : (lvNum <= 15 ? 4 : (lvNum <= 35 ? 5 : 6));
    var subMaxLv = lvNum <= 5 ? 4 : (lvNum <= 15 ? 5 : (lvNum <= 35 ? 6 : 7));

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

// B5: ngân sách năng lượng riêng cho mỗi level, đã hiệu chỉnh tương ứng với 3 - 5 đơn hàng
function computeEnergyBudget(board, orderIds, level) {
    var existing = {};
    var webCount = 0;
    board.forEach(function (c) {
        if (!c || !c.id || GENERATORS[c.id]) return;
        var line = c.id.split('_lv')[0];
        var u = itemUnits(c.id);
        existing[line] = (existing[line] || 0) + u;
        if (c.isLocked) webCount++;
    });

    var genNeedMax = {};
    var genNeedSum = {};
    orderIds.forEach(function (id) {
        var line = id.split('_lv')[0];
        var u = itemUnits(id);
        var have = existing[line] || 0;
        var use = Math.min(u, have * 0.75);
        existing[line] = have - use;
        var net = Math.max(0, u - use);

        var gKey = line;
        Object.keys(GENERATORS).forEach(function (gId) {
            if (GENERATORS[gId].indexOf(line + '_lv1') !== -1) gKey = gId;
        });
        genNeedMax[gKey] = Math.max(genNeedMax[gKey] || 0, net);
        genNeedSum[gKey] = (genNeedSum[gKey] || 0) + net;
    });

    var baseSpawns = 0;
    Object.keys(genNeedMax).forEach(function (gKey) {
        var maxLine = genNeedMax[gKey];
        var otherLines = genNeedSum[gKey] - maxLine;
        baseSpawns += maxLine * 3.0 + otherLines * 0.45;
    });

    var adjWeb = !level || level.adjWeb !== false;
    var webSpawns = webCount * (adjWeb ? 1.5 : 4.0);

    var raw = baseSpawns + webSpawns;
    if (level && level.bonus) raw *= 0.85;
    if (level && level.spreadEvery) raw *= 1.12;

    var budget = Math.round((raw * 1.35) / 5) * 5;
    return Math.max(50, Math.min(450, budget));
}

// Số sao theo phần trăm năng lượng còn lại
function calcStars(energyLeft, budget) {
    var r = budget > 0 ? energyLeft / budget : 0;
    return r >= 0.30 ? 3 : (r >= 0.15 ? 2 : 1);
}

// ---------- SỔ TAY SƯU TẬP 72 VẬT PHẨM (9 DÒNG x 8 CẤP) ----------
var ITEM_CHAINS = [
    {
        line: 'an', icon: '🍔', title: 'Ẩm Thực Dã Ngoại',
        names: ['Quả Táo Đỏ', 'Ổ Bánh Mì Dài', 'Bánh Sandwich Kẹp', 'Tô Mì Sợi Nóng', 'Đĩa Trái Cây Tươi', 'Tô Hoa Quả Thập Cẩm', 'Đĩa Bánh Quy Nướng', 'Đại Tiệc BBQ Xiên Nướng']
    },
    {
        line: 'ban', icon: '🪑', title: 'Bàn Dã Ngoại',
        names: ['Bàn Nhôm Vuông Mini', 'Bàn Vải Gấp Dã Ngoại', 'Bàn Trà Dã Ngoại', 'Bàn Gỗ Cuộn Dã Ngoại', 'Bàn Dã Ngoại Kèm Giá Lưới', 'Bàn Cắm Trại Đa Năng', 'Bàn Chiến Thuật IGT', 'Trạm Bếp Nấu Ăn Glamping']
    },
    {
        line: 'cafe', icon: '☕', title: 'Cà Phê Sương Sớm',
        names: ['Hạt Cà Phê Robusta', 'Cối Xay Cà Phê Tay Gỗ', 'Ấm Rót Cổ Ngỗng', 'Tách Cà Phê Nóng', 'Gói Cà Phê Specialty', 'Cối Xay Cầm Tay Inox', 'Ấm Pha Moka Pot Ý', 'Cốc Cà Phê Men Đỏ']
    },
    {
        line: 'trai', icon: '⛺', title: 'Lều Trại Trú Ngụ',
        names: ['Cọc Ghim Lều Kim Loại', 'Cuộn Dây Dù Căng Lều', 'Bộ Khung Cọc Chống Lều', 'Bạt Tăng Che Mưa Nắng', 'Lều Vòm Cắm Trại 2 Người', 'Lều Gia Đình Chống Gió', 'Lều Kim Tự Tháp Glamping', 'Biệt Thự Lều Glamping']
    },
    {
        line: 'tham', icon: '🛏️', title: 'Chỗ Ngủ Êm Ái',
        names: ['Bạt Trải Đất Dã Ngoại', 'Thảm Xốp Cuộn Cách Nhiệt', 'Thảm Thổ Cẩm Dã Ngoại', 'Chăn Đệm Gấp Ấm Áp', 'Túi Ngủ Dã Ngoại', 'Võng Dù Giữa Rừng', 'Sofa Hơi Dã Ngoại', 'Đệm Hơi Đôi Cao Cấp']
    },
    {
        line: 'ghe', icon: '🛋️', title: 'Ghế Nghỉ Ngơi',
        names: ['Ghế Đôn Xếp Mini', 'Ghế Xếp Tựa Lưng Xanh', 'Ghế Xếp Dã Ngoại Màu Cát', 'Ghế Xếp Có Tay Vịn', 'Ghế Câu Cá Có Khay', 'Ghế Mặt Trăng Moon Chair', 'Ghế Tựa Lưng Cao Có Gối', 'Ghế Đạo Diễn Cao Cấp']
    },
    {
        line: 'bep', icon: '🔥', title: 'Lửa & Bếp Trại',
        names: ['Nhánh Củi Khô', 'Khúc Gỗ Tròn', 'Bó Củi Buộc Dây', 'Hố Đá Xếp Lửa', 'Đống Củi Trại Vòng Đá', 'Lửa Trại Rực Hồng', 'Lò Nướng Than Hoa Tròn', 'Bếp Nướng BBQ Chữ Nhật']
    },
    {
        line: 'congcu', icon: '🔦', title: 'Dụng Cụ Sinh Tồn',
        names: ['Túi Vệ Sinh Cá Nhân', 'Can Nước Dã Ngoại', 'Bộ Bát Đĩa Dã Ngoại', 'Đầu Khò Lửa Cầm Tay', 'Bếp Gas Dã Ngoại Mini', 'Dây Đèn Led Lung Linh', 'Đèn Cắm Trại 3 Chân', 'Đèn Bão Cổ Điển']
    },
    {
        line: 'antoan', icon: '🧰', title: 'Y Tế & An Toàn',
        names: ['Chai Xịt Côn Trùng', 'Tuýp Kem Chống Nắng', 'Hộp Sơ Cứu Khẩn Cấp', 'Xẻng Sinh Tồn Dã Ngoại', 'Pin Sạc Dự Phòng', 'Lều Trú Ẩn Khẩn Cấp', 'Bộ Đàm Loa Rừng Già', 'Trạm Điện Di Động Dã Ngoại']
    }
];

function getItemDisplayName(id) {
    if (!id) return '';
    if (id === 'generator_backpack') return 'Ba Lô Dã Ngoại';
    if (id === 'generator_cooler') return 'Xe Kéo Dã Ngoại';
    if (id === 'generator_crate') return 'Thùng Dụng Cụ';
    var parts = String(id).split('_lv');
    var line = parts[0], lv = parseInt(parts[1]) || 1;
    var chain = ITEM_CHAINS.find(function (c) { return c.line === line; });
    if (!chain) return id;
    return (chain.names[lv - 1] || id) + ' (Lv.' + lv + ')';
}

function getChainGenerator(line) {
    if (line === 'ban' || line === 'ghe' || line === 'trai') {
        return {
            id: 'generator_cooler',
            name: 'Xe Kéo',
            icon: 'assets/images/items/generator_cooler.png'
        };
    }
    if (line === 'tham' || line === 'antoan' || line === 'bep') {
        return {
            id: 'generator_crate',
            name: 'Thùng Dụng Cụ',
            icon: 'assets/images/items/generator_crate.png'
        };
    }
    return {
        id: 'generator_backpack',
        name: 'Ba Lô',
        icon: 'assets/images/items/generator_backpack.png'
    };
}

// Thưởng khi mở khóa lần đầu trong Cẩm Nang: trả về { coins, gems }
function getBookReward(id) {
    var lv = parseInt(String(id).split('_lv')[1]) || 1;
    var coins = lv * 25;
    var gems = lv >= 7 ? 3 : (lv >= 5 ? 1 : 0);
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

// ---------- KHU CẮM TRẠI (45 VẬT PHẨM LƯỚI BÀN CHƠI) ----------
var CAMP_DECORS = [
    [1,  'an_lv2',             'Ổ Bánh Mì Dài'],
    [2,  'an_lv3',             'Bánh Sandwich Kẹp'],
    [3,  'an_lv4',             'Tô Mì Sợi Nóng'],
    [4,  'an_lv5',             'Đĩa Trái Cây Tươi'],
    [5,  'an_lv6',             'Tô Hoa Quả Thập Cẩm'],
    [6,  'an_lv8',             'Đại Tiệc BBQ Xiên Nướng'],
    [7,  'antoan_lv1',         'Chai Xịt Côn Trùng'],
    [8,  'antoan_lv2',         'Tuýp Kem Chống Nắng'],
    [9,  'antoan_lv4',         'Xẻng Sinh Tồn Dã Ngoại'],
    [10, 'antoan_lv5',         'Pin Sạc Dự Phòng'],
    [11, 'antoan_lv7',         'Bộ Đàm Loa Rừng Già'],
    [12, 'antoan_lv8',         'Trạm Điện Di Động Dã Ngoại'],
    [13, 'ban_lv8',            'Trạm Bếp Nấu Ăn Glamping'],
    [14, 'ban_lv2',            'Bàn Vải Gấp Dã Ngoại'],
    [15, 'ban_lv4',            'Bàn Gỗ Cuộn Dã Ngoại'],
    [16, 'ban_lv7',            'Bàn Chiến Thuật IGT'],
    [17, 'bep_lv6',            'Lửa Trại Rực Hồng'],
    [18, 'bep_lv8',            'Bếp Nướng BBQ Chữ Nhật'],
    [19, 'cafe_lv1',           'Hạt Cà Phê Robusta'],
    [20, 'cafe_lv3',           'Ấm Rót Cổ Ngỗng'],
    [21, 'cafe_lv5',           'Gói Cà Phê Specialty'],
    [22, 'cafe_lv6',           'Cối Xay Cầm Tay Inox'],
    [23, 'cafe_lv7',           'Ấm Pha Moka Pot Ý'],
    [24, 'cafe_lv8',           'Cốc Cà Phê Men Đỏ'],
    [25, 'congcu_lv1',         'Túi Vệ Sinh Cá Nhân'],
    [26, 'congcu_lv3',         'Bộ Bát Đĩa Dã Ngoại'],
    [27, 'congcu_lv5',         'Bếp Gas Dã Ngoại Mini'],
    [28, 'congcu_lv6',         'Dây Đèn Led Lung Linh'],
    [29, 'congcu_lv7',         'Đèn Cắm Trại 3 Chân'],
    [30, 'congcu_lv8',         'Đèn Bão Cổ Điển'],
    [31, 'generator_backpack', 'Ba Lô Dã Ngoại'],
    [32, 'generator_cooler',   'Xe Kéo Dã Ngoại'],
    [33, 'generator_crate',    'Thùng Dụng Cụ'],
    [34, 'ghe_lv3',            'Ghế Xếp Dã Ngoại Màu Cát'],
    [35, 'ghe_lv5',            'Ghế Câu Cá Có Khay'],
    [36, 'ghe_lv6',            'Ghế Mặt Trăng Moon Chair'],
    [37, 'ghe_lv8',            'Ghế Đạo Diễn Cao Cấp'],
    [38, 'tham_lv2',           'Thảm Xốp Cuộn Cách Nhiệt'],
    [39, 'tham_lv3',           'Thảm Thổ Cẩm Dã Ngoại'],
    [40, 'tham_lv6',           'Võng Dù Giữa Rừng'],
    [41, 'tham_lv7',           'Sofa Hơi Dã Ngoại'],
    [42, 'tham_lv8',           'Đệm Hơi Đôi Cao Cấp'],
    [43, 'trai_lv2',           'Cuộn Dây Dù Căng Lều'],
    [44, 'trai_lv7',           'Lều Kim Tự Tháp Glamping'],
    [45, 'trai_lv8',           'Biệt Thự Lều Glamping']
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
    return CAMP_DECORS.filter(function (d) { return isCampDecorUnlocked(d); }).length;
}
