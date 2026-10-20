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
        names: ['Bánh Mì Lát', 'Trứng Ốp La', 'Sandwich Kẹp', 'Xúc Xích Nướng', 'Burger Lửa Trại', 'Pizza Nướng Củi', 'Gà Quay Mật Ong', 'Đại Tiệc BBQ Thượng Hạng']
    },
    {
        line: 'ban', icon: '🪑', title: 'Bàn Dã Ngoại',
        names: ['Khăn Trải Nhỏ', 'Khay Gỗ Mini', 'Bàn Xếp Vải Dù', 'Bàn Gỗ Thông', 'Bàn Nhôm Gấp Gọn', 'Bàn Đôi Cắm Trại', 'Bàn Chiến Thuật IGT', 'Bàn Đại Tiệc Glamping']
    },
    {
        line: 'cafe', icon: '☕', title: 'Cà Phê Sương Sớm',
        names: ['Hạt Robusta', 'Túi Cà Phê Rang', 'Cối Xay Tay Gỗ', 'Phin Pha Truyền Thống', 'Ca Tráng Men Ấm', 'Ấm Pha Moka Ý', 'Bộ Syphon Cổ Điển', 'Trạm Espresso Rừng Già']
    },
    {
        line: 'trai', icon: '⛺', title: 'Lều Trại Trú Ngụ',
        names: ['Cọc Ghim Đất', 'Dây Dù Căng Bạt', 'Tấm Tăng Che Mưa', 'Lều Đơn Chữ A', 'Lều Vòm 2 Người', 'Lều Gia Đình Chống Bão', 'Lều Chuông Glamping', 'Biệt Thự Lều Đỉnh Tuyết']
    },
    {
        line: 'tham', icon: '🛏️', title: 'Chỗ Ngủ Êm Ái',
        names: ['Chiếu Cói Mỏng', 'Tấm Cách Nhiệt Bạc', 'Thảm Xốp Gấp', 'Túi Ngủ Mùa Thu', 'Võng Dù Mắc Cây', 'Đệm Hơi Tự Phồng', 'Túi Ngủ Lông Vũ', 'Giường Hơi Hoàng Gia']
    },
    {
        line: 'ghe', icon: '🛋️', title: 'Ghế Nghỉ Ngơi',
        names: ['Đôn Gỗ Nhỏ', 'Ghế Đẩu Xếp', 'Ghế Vải Dù Mini', 'Ghế Tựa Lưng Thấp', 'Ghế Đạo Diễn Có Khay', 'Ghế Bập Bênh Gỗ', 'Ghế Thư Giãn Moon Chair', 'Sofa Đôi Thiên Nhiên']
    },
    {
        line: 'bep', icon: '🔥', title: 'Lửa & Bếp Trại',
        names: ['Bùi Nhùi Khô', 'Bó Củi Thông', 'Đống Lửa Trại', 'Bếp Cồn Mini', 'Bếp Củi Xếp Gọn', 'Bếp Gas Dã Ngoại', 'Lò Nướng Than Hoa', 'Bếp Gang Đúc Đại Ngàn']
    },
    {
        line: 'congcu', icon: '🔦', title: 'Dụng Cụ Sinh Tồn',
        names: ['Dây Thừng Bện', 'Dao Gấp Đa Năng', 'Rìu Bổ Củi', 'Xẻng Quân Dụng', 'Đèn Pin Siêu Sáng', 'Đèn Dây Lung Linh', 'Đèn Bão Cổ Điển', 'Trạm Điện Mặt Trời']
    },
    {
        line: 'antoan', icon: '🧰', title: 'Y Tế & An Toàn',
        names: ['Băng Cá Nhân', 'Cuộn Gạc Y Tế', 'Còi Cứu Hộ', 'La Bàn Định Hướng', 'Túi Sơ Cứu Cá Nhân', 'Hộp Y Tế Chuyên Dụng', 'Bộ Đàm Xuyên Rừng', 'Trạm Tín Hiệu Vệ Tinh']
    }
];

function getItemDisplayName(id) {
    if (!id) return '';
    var parts = String(id).split('_lv');
    var line = parts[0], lv = parseInt(parts[1]) || 1;
    var chain = ITEM_CHAINS.find(function (c) { return c.line === line; });
    if (!chain) return id;
    return (chain.names[lv - 1] || id) + ' (Lv.' + lv + ')';
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

// ---------- KHU CẮM TRẠI (D13 - MỞ RỘNG 45 VẬT TRANG TRÍ) ----------
var CAMP_DECORS = [
    [1,  '🍳', 'Bữa sáng',          22, 88, 7],
    [2,  '⛺', 'Lều cắm trại',      50, 64, 16],
    [3,  '🔥', 'Lửa trại',          50, 84, 10],
    [4,  '☕', 'Cà phê sương sớm',   33, 84, 7],
    [5,  '🎒', 'Ba lô hành trang',   68, 84, 8],
    [6,  '🫖', 'Bộ trà',            14, 76, 7],
    [7,  '🌿', 'Bãi cỏ',            86, 90, 7],
    [8,  '🧺', 'Giỏ dã ngoại',      40, 92, 7],
    [9,  '🛏️', 'Chỗ ngủ êm ái',     66, 74, 8],
    [10, '🪵', 'Củi lửa',           58, 90, 7],
    [11, '🎐', 'Chuông gió',        78, 50, 7],
    [12, '🫘', 'Hạt Robusta',        6, 90, 6],
    [13, '🌊', 'Suối nhỏ',          93, 76, 9],
    [14, '🧰', 'Hộp sơ cứu',        26, 94, 6],
    [15, '🍎', 'Tiệc trái cây',     76, 94, 6],
    [16, '🪢', 'Võng giữa rừng',    10, 62, 8],
    [17, '💡', 'Đèn dây',           36, 54, 7],
    [18, '🪑', 'Bàn gỗ xếp',        86, 66, 8],
    [19, '☔', 'Mái che mưa',       22, 42, 8],
    [20, '🏕️', 'Lều lửa rực hồng',   80, 58, 8],
    [21, '🧊', 'Thùng đá',           4, 78, 6],
    [22, '🎧', 'Góc chill',         64, 62, 6],
    [23, '📻', 'Radio rừng',        30, 70, 6],
    [24, '🍖', 'Bếp nướng',         92, 90, 7],
    [25, '🛋️', 'Sofa thiên nhiên',   12, 92, 8],
    [26, '🎲', 'Bàn chiến thuật',   46, 74, 6],
    [27, '🔦', 'Đèn bão',           58, 66, 6],
    [28, '🔋', 'Trạm điện',         18, 66, 6],
    [29, '✨', 'Glamping',          50, 42, 10],
    [30, '🏔️', 'Đỉnh núi BBQ',      35, 30, 14],
    [31, '🌤️', 'Biển mây sớm',       18, 16, 10],
    [32, '🔭', 'Kính thiên văn',    72, 38, 7],
    [33, '🕸️', 'Hang cổ thụ',        8, 48, 7],
    [34, '♨️', 'Suối nước nóng',    88, 82, 8],
    [35, '🌉', 'Cầu tre vượt thác',  92, 60, 8],
    [36, '🪴', 'Vườn thảo mộc',     28, 78, 6],
    [37, '🌫️', 'Sương mù núi cao',   62, 22, 9],
    [38, '❄️', 'Trại bão tuyết',    48, 18, 7],
    [39, '🐟', 'Cá nướng bên thác', 82, 74, 6],
    [40, '🚩', 'Cờ trại đại ngàn',  54, 48, 7],
    [41, '🧭', 'La bàn kiểm lâm',   38, 64, 6],
    [42, '🏡', 'Quán cà phê cây',   26, 52, 8],
    [43, '🎆', 'Pháo hoa cuối mùa', 76, 14, 10],
    [44, '🌌', 'Bắc cực quang',     34, 12, 11],
    [45, '👑', 'Vương miện Vua Trại', 50, 52, 8]
];

function getCampDecor(level) {
    return CAMP_DECORS.find(function (d) { return d[0] === level; });
}

function countUnlockedDecors() {
    return CAMP_DECORS.filter(function (d) { return SAVE.stars[d[0]]; }).length;
}
