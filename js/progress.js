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
var ENERGY_REGEN_SEC = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.energy) ? GAME_CONFIG.energy.regenIntervalSec : 8;

function getMaxEnergy() {
    var passed = (typeof SAVE !== 'undefined' && SAVE && SAVE.stars) ? Object.keys(SAVE.stars).length : 0;
    var base = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.energy) ? GAME_CONFIG.energy.maxEnergyBase : MAX_ENERGY_BASE;
    var perLv = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.energy) ? GAME_CONFIG.energy.maxEnergyPerLevel : MAX_ENERGY_PER_LEVEL;
    var cap = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.energy) ? GAME_CONFIG.energy.maxEnergyCap : MAX_ENERGY_CAP;
    return Math.min(cap, base + passed * perLv);
}

function todayKey() {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
}

function defaultSave() {
    var initCoins = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.initialProfile) ? GAME_CONFIG.initialProfile.coins : 1000;
    var initGems = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.initialProfile) ? GAME_CONFIG.initialProfile.gems : 8;
    var initEnergy = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.energy) ? GAME_CONFIG.energy.startEnergy : START_ENERGY;
    return {
        level: 1,
        maxLevel: 1,
        coins: initCoins,
        gems: initGems,
        energy: initEnergy,
        econVer: ECON_VERSION,
        stars: {},
        discovered: {},
        claimedBook: {},
        ads: { day: todayKey(), energy: 0, gem: 0, coin: 0 },
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
            if (!s.ads || typeof s.ads !== 'object') s.ads = defaultSave().ads;
            s.settings = Object.assign(defaultSave().settings, parsed.settings || {});
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
// ENERGY_REGEN_SEC được khai báo ở đầu file (2 phút hồi +1 năng lượng)

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

// ==========================================
// CÂN BẰNG KINH TẾ (ECON v2) - ĐỌC TỪ js/config.js
// Người dùng có thể điều chỉnh mọi chỉ số trong js/config.js
// ==========================================

// Giá bán: Tính theo năng lượng để tạo ra (30 Vàng / 1⚡, thu hồi 25% giá trị năng lượng)
function sellPrice(id) {
    if (!id || String(id).indexOf('_lv') === -1) return 0;
    var minLv = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.gameplay && typeof GAME_CONFIG.gameplay.sellMinLevel === 'number')
        ? GAME_CONFIG.gameplay.sellMinLevel : 1;
    var lv = parseInt(String(id).split('_lv')[1]) || 1;
    if (lv < minLv) return 0;

    var mul = 30;
    if (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.gameplay && typeof GAME_CONFIG.gameplay.sellMultiplier === 'number') {
        mul = GAME_CONFIG.gameplay.sellMultiplier;
    } else if (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.energyShop && GAME_CONFIG.energyShop.coinPack) {
        var cost = GAME_CONFIG.energyShop.coinPack.coinCost || 3000;
        var eng = GAME_CONFIG.energyShop.coinPack.energy || 25;
        mul = Math.round((cost / eng) * 0.25);
    }
    var divisor = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.gameplay && typeof GAME_CONFIG.gameplay.sellDivisor === 'number')
        ? GAME_CONFIG.gameplay.sellDivisor : 1;
    return Math.floor(itemUnits(id) * mul / divisor);
}

// Thưởng Vàng khi nộp đơn hàng: tăng theo độ khó (cấp) của món hàng (Kinh tế x10, 60 Vàng / 1⚡)
function orderReward(id) {
    var mul = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.gameplay && typeof GAME_CONFIG.gameplay.orderRewardMultiplier === 'number')
        ? GAME_CONFIG.gameplay.orderRewardMultiplier : 60;
    return mul * itemUnits(id);
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

// Shop năng lượng (đọc từ GAME_CONFIG.energyShop - Kinh tế x10)
var ENERGY_PACK = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.energyShop) ? GAME_CONFIG.energyShop.coinPack.energy : 25;
var ENERGY_PACK_PRICE = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.energyShop) ? GAME_CONFIG.energyShop.coinPack.coinCost : 3000;
var GEM_ENERGY_PACK = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.energyShop) ? GAME_CONFIG.energyShop.gemPack.energy : 50;
var GEM_ENERGY_PRICE = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.energyShop) ? GAME_CONFIG.energyShop.gemPack.gemCost : 8;

// Quảng cáo thưởng: giới hạn số lượt mỗi ngày (Kinh tế x10)
var AD_REWARDS = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.adRewards) ? GAME_CONFIG.adRewards : {
    energy: { amount: 25, dailyLimit: 6 },
    gem: { amount: 4, dailyLimit: 3 },
    coin: { amount: 1500, dailyLimit: 4 }
};

function resetAdsIfNewDay() {
    var key = todayKey();
    if (!SAVE.ads || SAVE.ads.day !== key) {
        SAVE.ads = { day: key, energy: 0, gem: 0, coin: 0 };
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

// Thưởng hoàn thành màn: đọc từ GAME_CONFIG.gameplay.levelClear (Kinh tế x10)
function levelClearReward(lv, stars, firstTime) {
    var cfg = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.gameplay && GAME_CONFIG.gameplay.levelClear) ? GAME_CONFIG.gameplay.levelClear : null;
    var allowReplay = cfg ? cfg.allowReplayReward : false;
    if (!firstTime && !allowReplay) return { coins: 0, gems: 0 };
    var baseCoins = cfg ? cfg.baseCoins : 200;
    var perLevel = cfg ? cfg.perLevelCoins : 40;
    var perStar = cfg ? cfg.perStarCoins : 80;
    var gems3 = cfg ? cfg.gems3Stars : 2;
    var gemsOther = cfg ? cfg.gems1Or2Stars : 1;
    return {
        coins: baseCoins + lv * perLevel + stars * perStar,
        gems: stars === 3 ? gems3 : gemsOther
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
