// ==========================================
// ENGINE: LUẬT CHƠI THUẦN (không đụng DOM)
// Dùng chung cho game (board.js) và bot mô phỏng (tools/sim.js)
// ==========================================

var COLS = 7;
var ROWS = 9;
var TOTAL_CELLS = COLS * ROWS;
var MAX_ITEM_LV = 8;
var BONUS_MIN_LV = 5; // ghép ra cấp này trở lên mới có quà (level có cờ bonus)
var BONUS_CHANCE = 0.55; // xác suất nổ quà tiếp tế khi ghép ra item Lv5+

var MAX_VISIBLE_ORDERS = 4; // Tối đa 4 vật phẩm nhiệm vụ hiển thị đồng thời trên màn chơi

var GENERATORS = {
    'generator_backpack': ['an_lv1', 'cafe_lv1', 'congcu_lv1'],
    'generator_cooler': ['ban_lv1', 'ghe_lv1', 'trai_lv1'],
    'generator_crate': ['tham_lv1', 'antoan_lv1', 'bep_lv1']
};

// Hệ thống địa hình tự nhiên bất đối xứng (tránh hoàn toàn kiểu khung hình chữ nhật đều 5x5, 5x6, 5x7)
var PATTERNS = {
    creek_bend: (r, c) => (r === 0 || r === 8 || (r === 1 && (c <= 1 || c >= 5)) || (r === 2 && (c === 0 || c === 6)) || (r === 3 && c === 0) || (r === 5 && c === 6) || (r === 6 && (c === 0 || c === 6)) || (r === 7 && (c <= 1 || c >= 5)) || (r === 2 && c === 4) || (r === 6 && c === 2)),
    pine_alcove: (r, c) => ((r === 0 && c !== 3) || (r === 8 && c !== 3) || (r === 1 && (c === 0 || c >= 5)) || (r === 2 && c === 6) || (r === 3 && c === 1) || (r === 4 && (c === 0 || c === 6)) || (r === 5 && c === 5) || (r === 6 && c === 0) || (r === 7 && (c <= 1 || c === 6))),
    stepping_glade: (r, c) => ((r === 0 && (c <= 2 || c >= 5)) || (r === 1 && (c <= 1 || c === 6)) || (r === 2 && c === 0) || (r === 6 && c === 6) || (r === 7 && (c === 0 || c >= 5)) || (r === 8 && (c <= 1 || c >= 4)) || (r === 3 && c === 5) || (r === 5 && c === 1)),
    boulder_trail: (r, c) => ((r === 0 && c !== 2 && c !== 3) || (r === 8 && c !== 3 && c !== 4) || (c === 0 && (r <= 2 || r >= 6)) || (c === 6 && (r <= 2 || r >= 6)) || (r === 2 && c === 2) || (r === 4 && c === 5) || (r === 6 && c === 4)),
    zigzag: (r, c) => ((r === 0 && c <= 4) || (r === 1 && c <= 1) || (r === 3 && c === 6) || (r === 4 && c === 0) || (r === 5 && c === 6) || (r === 7 && c >= 5) || (r === 8 && c >= 2) || (r === 2 && c === 4) || (r === 6 && c === 2)),
    cross: (r, c) => (((r <= 1 || r >= 7) && (c <= 1 || c >= 5)) || (r === 0 && c === 3) || (r === 8 && c === 3) || (r === 3 && c === 1) || (r === 5 && c === 5)),
    hourglass: (r, c) => ((r === 0 && c !== 3) || (r === 8 && c !== 3) || (r >= 3 && r <= 5 && (c === 0 || c === 6)) || (r === 4 && (c === 1 || c === 5)) || (r === 1 && c === 0) || (r === 7 && c === 6)),
    pillars: (r, c) => ((r === 0 && (c <= 1 || c >= 5)) || (r === 8 && (c <= 1 || c >= 5)) || ((r === 2 || r === 6) && (c === 2 || c === 4)) || (r === 4 && (c === 0 || c === 6))),
    valley: (r, c) => ((c === 0 && r !== 3 && r !== 4) || (c === 6 && r !== 4 && r !== 5) || (r === 0 && (c <= 2 || c >= 5)) || (r === 8 && (c <= 1 || c >= 4)) || (r === 2 && c === 4) || (r === 6 && c === 2)),
    islands: (r, c) => ((r === 0 && c !== 2) || (r === 8 && c !== 4) || (r === 4 && c !== 2 && c !== 4) || (r === 2 && c === 0) || (r === 6 && c === 6)),
    fortress: (r, c) => ((r === 0 && c !== 3) || (r === 8 && c !== 3) || (c === 0 && r !== 4) || (c === 6 && r !== 4) || (r === 2 && c === 2) || (r === 6 && c === 4) || (r === 4 && c === 3)),
    open: (r, c) => (((r === 0 || r === 8) && (c <= 1 || c >= 5)) || ((r === 1 || r === 7) && (c === 0 || c === 6)) || (r === 2 && c === 1) || (r === 6 && c === 5) || (r === 3 && c === 5) || (r === 5 && c === 1))
};
// Ánh xạ tương thích ngược các tên cũ sang địa hình tự nhiên bất đối xứng
PATTERNS.box5x5 = PATTERNS.creek_bend;
PATTERNS.box5x7 = PATTERNS.stepping_glade;
PATTERNS.rounded = PATTERNS.pine_alcove;

// Lấy tối đa 4 nhiệm vụ chưa hoàn thành đang hiển thị trên màn hình
function getVisibleOrders(orders) {
    if (!orders || !Array.isArray(orders)) return [];
    var out = [];
    for (var i = 0; i < orders.length; i++) {
        var o = orders[i];
        if (!o) continue;
        if (typeof o === 'object' && o.done) continue;
        out.push(o);
        if (out.length >= MAX_VISIBLE_ORDERS) break;
    }
    return out;
}

// Hàm random có thể bị thay thế (bot mô phỏng dùng random có seed)
var rand = Math.random;

function itemLine(id) { return id.split('_lv')[0]; }
function itemLv(id) { return parseInt(id.split('_lv')[1]) || 1; }

// ==========================================
// BẢNG MÀU NỀN THEO 9 NHÓM HỌ VẬT PHẨM (9 NHÓM + Ô TRỐNG)
// Dùng chung cho: Bàn chơi (board), Đơn hàng (orders) & Cẩm nang (discovery book)
// ==========================================
var ITEM_CELL_BG_MAP = {
    'an': 'cell-bg-01',     // 1. Ẩm thực dã ngoại
    'ban': 'cell-bg-02',    // 2. Bàn dã ngoại
    'cafe': 'cell-bg-03',   // 3. Cà phê sương sớm
    'trai': 'cell-bg-04',   // 4. Lều trại trú ngụ
    'tham': 'cell-bg-05',   // 5. Chỗ ngủ êm ái
    'ghe': 'cell-bg-06',    // 6. Ghế nghỉ ngơi
    'bep': 'cell-bg-07',    // 7. Lửa & bếp trại
    'congcu': 'cell-bg-08', // 8. Dụng cụ sinh tồn
    'antoan': 'cell-bg-09'  // 9. Y tế & an toàn
};

function getCellBgClass(line) {
    return (typeof ITEM_CELL_BG_MAP !== 'undefined' && ITEM_CELL_BG_MAP[line]) ? ITEM_CELL_BG_MAP[line] : 'bg-empty';
}
function makeEmptyCell() { return { id: null, isRock: false, isLocked: false }; }

// Dựng bàn cờ 63 ô từ cấu hình level (getLevelConfig trong js/data.js)
function buildBoard(level) {
    var patFn = PATTERNS[level.pattern] || PATTERNS.box5x5;
    var board = new Array(TOTAL_CELLS);
    var hasExplicitRocks = Array.isArray(level.rocks);
    var rockSet = hasExplicitRocks ? new Set(level.rocks) : null;
    for (var i = 0; i < TOTAL_CELLS; i++) {
        var isRock = rockSet ? rockSet.has(i) : patFn(Math.floor(i / COLS), i % COLS);
        board[i] = { id: null, isRock: isRock, isLocked: false };
    }
    level.gens.forEach(g => { board[g[0]] = { id: g[1], isRock: false, isLocked: false }; });
    level.free.forEach(f => { board[f[0]] = { id: f[1], isRock: false, isLocked: false }; });
    level.webs.forEach(w => { board[w[0]] = { id: w[1], isRock: false, isLocked: true }; });
    return board;
}

function getEmptyIndexes(board) {
    var res = [];
    board.forEach((c, idx) => { if (c && !c.id && !c.isRock && !c.isLocked) res.push(idx); });
    return res;
}

function countWebs(board) {
    return board.filter(c => c && c.isLocked).length;
}

function getOrthogonalNeighbors(idx) {
    var r = Math.floor(idx / COLS), c = idx % COLS;
    var out = [];
    if (r > 0) out.push((r - 1) * COLS + c);
    if (r < ROWS - 1) out.push((r + 1) * COLS + c);
    if (c > 0) out.push(r * COLS + (c - 1));
    if (c < COLS - 1) out.push(r * COLS + (c + 1));
    return out;
}

// Cơ chế mới: Ghép ở ô toIdx sẽ phá mạng nhện của các ô liền kề (4 hướng) nếu level.adjWeb = true
function clearAdjacentWebs(board, toIdx, level) {
    if (!level || !level.adjWeb) return [];
    var cleared = [];
    getOrthogonalNeighbors(toIdx).forEach(nIdx => {
        var cell = board[nIdx];
        if (cell && cell.isLocked) {
            cell.isLocked = false;
            cleared.push(nIdx);
        }
    });
    return cleared;
}

// Bộ đếm bảo hiểm chống rơi lệch (Pity System) cho từng nguồn phát và trạng thái lượt sinh gần nhất
var genOffOrderStreak = {};
var lastSpawnResult = { target: -1, id: null, line: null, wasUnwanted: false };

function resetGeneratorPity() {
    genOffOrderStreak = {};
    lastSpawnResult = { target: -1, id: null, line: null, wasUnwanted: false };
}

function wasLastSpawnUnwanted() {
    return !!(lastSpawnResult && lastSpawnResult.wasUnwanted);
}

// Mô phỏng gộp các vật phẩm hiện có trên bàn của 1 nhánh từ Lv.1 -> Lv.8 để tính chính xác lượng đơn vị Lv.1 còn thiếu
function simulateLineProgress(fByLv, wByLv, orderByLv, canBreakWebByAdj) {
    var curF = {};
    var curW = {};
    var remOrders = {};
    for (var l = 1; l <= MAX_ITEM_LV; l++) {
        curF[l] = fByLv[l] || 0;
        curW[l] = wByLv[l] || 0;
        remOrders[l] = orderByLv[l] || 0;
    }

    function hasOrderAbove(lv) {
        for (var k = lv + 1; k <= MAX_ITEM_LV; k++) {
            if ((remOrders[k] || 0) > 0) return true;
        }
        return false;
    }

    for (var lv = 1; lv <= MAX_ITEM_LV; lv++) {
        var needAbove = hasOrderAbove(lv);

        // Nếu không còn đơn ở cấp cao hơn, ưu tiên hoàn thành đơn ngay tại cấp lv trước
        if (!needAbove && remOrders[lv] > 0 && curF[lv] > 0) {
            var takeNow = Math.min(curF[lv], remOrders[lv]);
            curF[lv] -= takeNow;
            remOrders[lv] -= takeNow;
        }

        // Ghép 1 đồ tự do + 1 ô mạng nhện cùng cấp -> 1 đồ tự do ở cấp lv+1
        if (lv < MAX_ITEM_LV && curF[lv] > 0 && curW[lv] > 0) {
            if (needAbove || !canBreakWebByAdj) {
                var webMerges = Math.min(curF[lv], curW[lv]);
                curF[lv] -= webMerges;
                curW[lv] -= webMerges;
                curF[lv + 1] = (curF[lv + 1] || 0) + webMerges;
                needAbove = hasOrderAbove(lv);
            }
        }

        // Kiểm tra lại đơn ở cấp lv sau khi đã xử lý nhện
        if (remOrders[lv] > 0 && curF[lv] > 0) {
            var takeAfter = Math.min(curF[lv], remOrders[lv]);
            curF[lv] -= takeAfter;
            remOrders[lv] -= takeAfter;
            needAbove = hasOrderAbove(lv);
        }

        // Ghép 2 đồ tự do cùng cấp -> 1 đồ tự do ở cấp lv+1 nếu vẫn cần lên cấp cao hơn
        if (lv < MAX_ITEM_LV && needAbove && curF[lv] >= 2) {
            var pairs = Math.floor(curF[lv] / 2);
            curF[lv] -= pairs * 2;
            curF[lv + 1] = (curF[lv + 1] || 0) + pairs;
        }
    }

    var missingOrderUnits = 0;
    var maxUnfinishedLv = 0;
    for (var m = 1; m <= MAX_ITEM_LV; m++) {
        if (remOrders[m] > 0) {
            missingOrderUnits += remOrders[m] * Math.pow(2, m - 1);
            maxUnfinishedLv = Math.max(maxUnfinishedLv, m);
        }
    }

    var netDeficit = 0;
    if (missingOrderUnits > 0) {
        var carryUnits = 0;
        var freeOnlyUnits = 0;
        for (var n = 1; n < maxUnfinishedLv; n++) {
            var fu = (curF[n] || 0) * Math.pow(2, n - 1);
            var wu = (curW[n] || 0) * Math.pow(2, n - 1);
            freeOnlyUnits += fu;
            carryUnits += fu + wu;
        }
        netDeficit = Math.max(0, missingOrderUnits - carryUnits);
        // Nếu tổng (free + web) đủ trên lý thuyết nhưng bị kẹt do các ô còn lại đều nằm trong nhện chưa có đồ tự do mồi
        if (netDeficit === 0) {
            netDeficit = Math.max(1, missingOrderUnits - freeOnlyUnits);
        }
    }

    return {
        deficit: netDeficit,
        remainingWebs: curW,
        remainingFree: curF
    };
}

// Tính lượng đơn vị (Lv.1 units) còn thiếu thực tế của từng nhánh vật phẩm trên bàn cờ
function computeLineDeficits(board, activeOrders, levelCfg, includeAllOrders) {
    var ordersToCheck = activeOrders || (typeof currentOrders !== 'undefined' ? currentOrders : null);
    var lvl = levelCfg || (typeof currentLevelCfg !== 'undefined' ? currentLevelCfg : null);
    var adjWeb = !lvl || lvl.adjWeb !== false;

    // Khi đang chơi (includeAllOrders = false): ưu tiên tính thiếu hụt cho tối đa 4 đơn hàng đang hiển thị.
    // Nếu 4 đơn đang hiển thị đã đủ nguyên liệu trên bàn mà vẫn còn đơn ẩn trong hàng đợi, tự động xét tiếp hàng đợi.
    var subsetOrders = (!includeAllOrders && ordersToCheck && Array.isArray(ordersToCheck))
        ? getVisibleOrders(ordersToCheck)
        : ordersToCheck;

    function runDeficitPass(orderList) {
        var deficits = {};
        var orderByLineLv = {};
        var uncompletedCount = 0;
        if (orderList && Array.isArray(orderList)) {
            orderList.forEach(function (o) {
                if (!o) return;
                if (typeof o === 'object' && o.done) return;
                var id = typeof o === 'string' ? o : o.id;
                if (!id) return;
                var line = itemLine(id);
                var lv = itemLv(id);
                if (!orderByLineLv[line]) orderByLineLv[line] = {};
                orderByLineLv[line][lv] = (orderByLineLv[line][lv] || 0) + 1;
                uncompletedCount++;
            });
        }

        var freeByLineLv = {};
        var webByLineLv = {};

        if (board && Array.isArray(board)) {
            board.forEach(function (c) {
                if (!c || !c.id || c.isRock || GENERATORS[c.id]) return;
                var line = itemLine(c.id);
                var lv = itemLv(c.id);
                if (!c.isLocked) {
                    if (!freeByLineLv[line]) freeByLineLv[line] = {};
                    freeByLineLv[line][lv] = (freeByLineLv[line][lv] || 0) + 1;
                } else {
                    if (!webByLineLv[line]) webByLineLv[line] = {};
                    webByLineLv[line][lv] = (webByLineLv[line][lv] || 0) + 1;
                }
            });
        }

        var allLines = {};
        Object.keys(orderByLineLv).forEach(function (l) { allLines[l] = true; });
        Object.keys(webByLineLv).forEach(function (l) { allLines[l] = true; });

        var allOrdersDone = uncompletedCount === 0;

        Object.keys(allLines).forEach(function (line) {
            var sim = simulateLineProgress(
                freeByLineLv[line] || {},
                webByLineLv[line] || {},
                orderByLineLv[line] || {},
                adjWeb
            );
            var d = sim.deficit;

            if (!adjWeb || allOrdersDone) {
                var remW = sim.remainingWebs;
                var remF = sim.remainingFree;
                for (var lv = 1; lv <= MAX_ITEM_LV; lv++) {
                    var wNeed = remW[lv] || 0;
                    if (wNeed > 0) {
                        var carryBelow = 0;
                        for (var b = 1; b < lv; b++) {
                            carryBelow += (remF[b] || 0) * Math.pow(2, b - 1);
                        }
                        d += Math.max(1, Math.pow(2, lv - 1) - carryBelow);
                    }
                }
            }

            if (d > 0) {
                deficits[line] = d;
            }
        });

        return deficits;
    }

    var primaryDeficits = runDeficitPass(subsetOrders);
    if (!includeAllOrders && Object.keys(primaryDeficits).length === 0 && ordersToCheck && subsetOrders && subsetOrders.length < ordersToCheck.length) {
        return runDeficitPass(ordersToCheck);
    }
    return primaryDeficits;
}

// Tính toán cấp độ rơi của vật phẩm từ thùng sinh đồ (Lv.1, Lv.2, Lv.3)
// Màn 1-10: 100% Cấp 1 (Chế độ hướng dẫn)
// Màn 11+: Mở tỷ lệ rơi Cấp 2 và Cấp 3 tăng dần theo cấp độ màn chơi
function getGeneratorDropLevel(levelNum) {
    if (!levelNum || levelNum <= 10) return 1;

    var dropCfg = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.gameplay && GAME_CONFIG.gameplay.generatorDrops)
        ? GAME_CONFIG.gameplay.generatorDrops
        : null;

    var tiers = (dropCfg && dropCfg.tiers) || [
        { maxLevel: 10,  lv1: 1.00, lv2: 0.00, lv3: 0.00 },
        { maxLevel: 20,  lv1: 0.78, lv2: 0.18, lv3: 0.04 },
        { maxLevel: 40,  lv1: 0.70, lv2: 0.23, lv3: 0.07 },
        { maxLevel: 60,  lv1: 0.62, lv2: 0.26, lv3: 0.12 },
        { maxLevel: 90,  lv1: 0.55, lv2: 0.30, lv3: 0.15 },
        { maxLevel: 120, lv1: 0.50, lv2: 0.32, lv3: 0.18 }
    ];

    var tier = tiers.find(function (t) { return levelNum <= t.maxLevel; }) || tiers[tiers.length - 1];
    var r = rand();
    if (r < (tier.lv3 || 0)) return 3;
    if (r < (tier.lv3 || 0) + (tier.lv2 || 0)) return 2;
    return 1;
}

// Sinh 1 item từ nguồn phát vào ô trống ngẫu nhiên. Trả về index ô mới, hoặc -1 nếu bàn đầy
// Giải pháp 1: Thuật toán Rơi Đồ Thông Minh Theo Thiếu Hụt Thực Tế (Deficit-Driven) & Bảo Hiểm Pity
function spawnItem(board, genId, activeOrders, levelCfg) {
    var empty = getEmptyIndexes(board);
    if (!empty.length) {
        lastSpawnResult = { target: -1, id: null, line: null, itemLv: 1, wasUnwanted: false };
        return -1;
    }
    var list = GENERATORS[genId];
    if (!list || !list.length) {
        lastSpawnResult = { target: -1, id: null, line: null, itemLv: 1, wasUnwanted: false };
        return -1;
    }

    var deficits = computeLineDeficits(board, activeOrders, levelCfg);
    var lineDeficits = list.map(function (itemId) {
        return deficits[itemLine(itemId)] || 0;
    });
    var hasNeededInGen = lineDeficits.some(function (d) { return d > 0; });

    var id;
    var wasUnwanted = false;

    if (hasNeededInGen) {
        var streak = genOffOrderStreak[genId] || 0;
        // Bảo hiểm Pity: Nếu lần bấm trước trên nguồn phát này đã rơi lệch dòng (streak >= 1),
        // lần bấm tiếp theo chắc chắn 100% rơi vào nhánh đang thiếu!
        var forceNeeded = streak >= 1;

        var weights = list.map(function (itemId, idx) {
            var d = lineDeficits[idx];
            if (d > 0) {
                return 3.5 + Math.min(6.5, d * 0.55);
            }
            return forceNeeded ? 0 : 0.45;
        });

        var totalWeight = weights.reduce(function (a, b) { return a + b; }, 0);
        var r = rand() * totalWeight;
        var acc = 0;
        id = list[list.length - 1];
        for (var i = 0; i < list.length; i++) {
            acc += weights[i];
            if (r <= acc && weights[i] > 0) {
                id = list[i];
                break;
            }
        }

        var pickedLine = itemLine(id);
        var pickedDeficit = deficits[pickedLine] || 0;
        if (pickedDeficit <= 0) {
            genOffOrderStreak[genId] = streak + 1;
            wasUnwanted = true;
        } else {
            genOffOrderStreak[genId] = 0;
            wasUnwanted = false;
        }
    } else {
        id = list[Math.floor(rand() * list.length)];
        wasUnwanted = false;
    }

    var pickedLine = itemLine(id);
    var lvNum = (levelCfg && (levelCfg.num || levelCfg.level)) || (typeof currentLevel !== 'undefined' ? currentLevel : 1);
    var dropLv = getGeneratorDropLevel(lvNum);
    var finalId = pickedLine + '_lv' + dropLv;

    var target = empty[Math.floor(rand() * empty.length)];
    board[target] = { id: finalId, isRock: false, isLocked: false };
    lastSpawnResult = {
        target: target,
        id: finalId,
        line: pickedLine,
        itemLv: dropLv,
        wasUnwanted: wasUnwanted
    };
    return target;
}

function nextItemId(id) {
    if (!id || GENERATORS[id]) return null;
    var lv = itemLv(id);
    return lv < MAX_ITEM_LV ? itemLine(id) + '_lv' + (lv + 1) : null;
}

// Di chuyển / ghép / hoán đổi. Trả về { type, index, newId, brokeDirectWeb }
//  type: 'none' | 'move' | 'merge' | 'swap'
function doMove(board, fromIdx, toIdx) {
    var none = { type: 'none', index: -1, newId: null, brokeDirectWeb: false };
    if (fromIdx === toIdx) return none;
    var from = board[fromIdx], to = board[toIdx];
    if (!from || !from.id || from.isLocked) return none;
    if (!to || to.isRock) return none;

    if (!to.id) {
        board[toIdx] = from;
        board[fromIdx] = makeEmptyCell();
        return { type: 'move', index: toIdx, newId: null, brokeDirectWeb: false };
    }
    if (to.id === from.id && !GENERATORS[from.id]) {
        var nid = nextItemId(from.id);
        if (!nid) return none;
        var broke = !!to.isLocked;
        board[toIdx] = { id: nid, isRock: false, isLocked: false }; // ghép lên ô khóa = phá nhện
        board[fromIdx] = makeEmptyCell();
        return { type: 'merge', index: toIdx, newId: nid, brokeDirectWeb: broke };
    }
    if (!to.isLocked) {
        board[fromIdx] = to;
        board[toIdx] = from;
        return { type: 'swap', index: toIdx, newId: null, brokeDirectWeb: false };
    }
    return none;
}

// Cờ bonus: ghép ra cấp >= BONUS_MIN_LV có xác suất tặng 1 item cấp 1 cùng dòng. Trả về index ô tặng hoặc -1
function bonusDrop(board, level, newId) {
    if (!level || !level.bonus || !newId || itemLv(newId) < BONUS_MIN_LV) return -1;
    if (rand() > BONUS_CHANCE) return -1;
    var empty = getEmptyIndexes(board);
    if (!empty.length) return -1;
    var target = empty[Math.floor(rand() * empty.length)];
    board[target] = { id: itemLine(newId) + '_lv1', isRock: false, isLocked: false };
    return target;
}

// Cờ spreadEvery: nhện lan sang 1 item thường cấp thấp nhất (chỉ lan khi trên bàn vẫn còn ít nhất 1 ổ nhện)
function spreadWeb(board) {
    if (countWebs(board) === 0) return -1;
    var best = [], bestLv = 99;
    board.forEach((c, idx) => {
        if (!c || !c.id || c.isLocked || c.isRock || GENERATORS[c.id]) return;
        var lv = itemLv(c.id);
        if (lv < bestLv) { bestLv = lv; best = [idx]; }
        else if (lv === bestLv) best.push(idx);
    });
    if (!best.length) return -1;
    var idx = best[Math.floor(rand() * best.length)];
    board[idx].isLocked = true;
    return idx;
}

// Cấp cao nhất cần cho mỗi dòng item (ưu tiên tối đa 4 đơn hàng đang hiển thị + item đang bị nhện khóa)
function neededLevels(board, orders) {
    var need = {};
    var vis = getVisibleOrders(orders);
    var listToUse = vis.length > 0 ? vis : (orders || []);
    listToUse.forEach(o => {
        if (!o || o.done) return;
        var id = typeof o === 'string' ? o : o.id;
        if (!id) return;
        var l = itemLine(id);
        need[l] = Math.max(need[l] || 0, itemLv(id));
    });
    board.forEach(c => {
        if (c && c.id && c.isLocked) {
            var l = itemLine(c.id);
            need[l] = Math.max(need[l] || 0, itemLv(c.id));
        }
    });
    return need;
}

function findOrderMatch(board, orderId) {
    return board.findIndex(c => c && c.id === orderId && !c.isLocked);
}

// Nước ghép tốt nhất: ưu tiên phá nhện trực tiếp > phá nhện liền kề > tiến tới đơn hàng > ghép dọn bàn
// Dùng cho gợi ý (người chơi) và bot mô phỏng. Trả về { from, to, score } hoặc null
function findBestMerge(board, orders, level) {
    var need = neededLevels(board, orders);
    var byId = {};
    board.forEach((c, i) => {
        if (!c || !c.id || c.isRock || GENERATORS[c.id]) return;
        if (itemLv(c.id) >= MAX_ITEM_LV) return;
        (byId[c.id] = byId[c.id] || []).push(i);
    });

    var best = null;
    Object.keys(byId).forEach(id => {
        var list = byId[id];
        if (list.length < 2) return;
        var lv = itemLv(id), line = itemLine(id);
        var T = need[line] || 0;
        for (var a = 0; a < list.length; a++) {
            for (var b = a + 1; b < list.length; b++) {
                var ia = list[a], ib = list[b];
                var la = board[ia].isLocked, lb = board[ib].isLocked;
                if (la && lb) continue;

                // Thử cả 2 chiều nếu cả 2 đều tự do (để chọn ô đích cạnh nhiều nhện hơn)
                var pairs = la ? [[ib, ia]] : (lb ? [[ia, ib]] : [[ia, ib], [ib, ia]]);
                pairs.forEach(p => {
                    var from = p[0], to = p[1];
                    var adjCount = (level && level.adjWeb)
                        ? getOrthogonalNeighbors(to).filter(n => board[n] && board[n].isLocked && n !== from).length
                        : 0;
                    var score;
                    if (la || lb) score = 100 + lv + adjCount * 25;
                    else if (adjCount > 0) score = 60 + adjCount * 25 + lv;
                    else if (lv < T) score = 10 + lv;
                    else score = 1;
                    if (!best || score > best.score) best = { from: from, to: to, score: score };
                });
            }
        }
    });
    return best;
}
