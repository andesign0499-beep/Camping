// ==========================================
// ENGINE: LUẬT CHƠI THUẦN (không đụng DOM)
// Dùng chung cho game (board.js) và bot mô phỏng (tools/sim.js)
// ==========================================

var COLS = 7;
var ROWS = 9;
var TOTAL_CELLS = COLS * ROWS;
var MAX_ITEM_LV = 12;
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

function getItemMaxLevel(lineOrId) {
    if (!lineOrId) return 12;
    var line = lineOrId.indexOf('_') !== -1 ? itemLine(lineOrId) : lineOrId;
    if (typeof ITEM_CHAINS !== 'undefined' && Array.isArray(ITEM_CHAINS)) {
        for (var i = 0; i < ITEM_CHAINS.length; i++) {
            if (ITEM_CHAINS[i].line === line && Array.isArray(ITEM_CHAINS[i].names)) {
                return ITEM_CHAINS[i].names.length;
            }
        }
    }
    if (line === 'tham') return 8;
    return 12;
}

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
    'congcu': 'cell-bg-08', // 8. Chiếu sáng dã ngoại
    'antoan': 'cell-bg-09'  // 9. Nguồn điện & trạm năng lượng
};

function getCellBgClass(line) {
    return (typeof ITEM_CELL_BG_MAP !== 'undefined' && ITEM_CELL_BG_MAP[line]) ? ITEM_CELL_BG_MAP[line] : 'bg-empty';
}
function makeEmptyCell() { return { id: null, isRock: false, isLocked: false }; }

// Lấy cấp độ người chơi yêu cầu để mở khóa ô đá có biểu tượng ổ khóa (board_cell_rock_lock.png)
function getRockUnlockLevel(cellIdx, cellObj) {
    if (cellObj && typeof cellObj.rockUnlockLevel === 'number') {
        return cellObj.rockUnlockLevel;
    }
    var cfgLocked = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.initialBoard && GAME_CONFIG.initialBoard.lockedRocks)
        ? GAME_CONFIG.initialBoard.lockedRocks
        : null;
    if (cfgLocked && typeof cfgLocked[cellIdx] === 'number') {
        return cfgLocked[cellIdx];
    }
    return 0;
}

function isRockCellLockedByLevel(cellIdx, cellObj, playerLv) {
    if (!cellObj || !cellObj.isRock) return false;
    var reqLv = getRockUnlockLevel(cellIdx, cellObj);
    if (!reqLv || reqLv <= 0) return false;
    var pLv = (typeof playerLv === 'number' && playerLv > 0)
        ? playerLv
        : ((typeof SAVE !== 'undefined' && SAVE && typeof SAVE.playerLevel === 'number') ? SAVE.playerLevel : 1);
    return pLv < reqLv;
}

// Dựng bàn cờ 63 ô từ cấu hình GAME_CONFIG.initialBoard hoặc cấu hình level
function buildBoard(level) {
    var board = new Array(TOTAL_CELLS);
    var cfgBoard = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.initialBoard) ? GAME_CONFIG.initialBoard : null;
    var lockedRocksMap = (cfgBoard && cfgBoard.lockedRocks) ? cfgBoard.lockedRocks : {};

    if (cfgBoard) {
        var rockSet = new Set(Array.isArray(cfgBoard.rocks) ? cfgBoard.rocks : []);
        for (var i = 0; i < TOTAL_CELLS; i++) {
            var isR = rockSet.has(i);
            board[i] = {
                id: null,
                isRock: isR,
                isLocked: false,
                rockUnlockLevel: isR ? (lockedRocksMap[i] || 0) : 0
            };
        }
        if (Array.isArray(cfgBoard.generators)) {
            cfgBoard.generators.forEach(function (g) {
                var cell = (typeof g.cell === 'number') ? g.cell : g[0];
                var id = g.id || g[1];
                if (cell >= 0 && cell < TOTAL_CELLS) {
                    board[cell] = { id: id, isRock: false, isLocked: false };
                }
            });
        }
        if (Array.isArray(cfgBoard.hiddenGenerators)) {
            cfgBoard.hiddenGenerators.forEach(function (g) {
                var cell = (typeof g.cell === 'number') ? g.cell : g[0];
                var id = g.id || g[1];
                if (cell >= 0 && cell < TOTAL_CELLS) {
                    board[cell] = { id: id, isRock: true, isLocked: false, isGeneratorRock: true };
                }
            });
        }
        if (Array.isArray(cfgBoard.freeItems)) {
            cfgBoard.freeItems.forEach(function (f) {
                var cell = (typeof f.cell === 'number') ? f.cell : f[0];
                var id = f.id || f[1];
                if (cell >= 0 && cell < TOTAL_CELLS) {
                    board[cell] = { id: id, isRock: false, isLocked: false };
                }
            });
        }
        if (Array.isArray(cfgBoard.webItems)) {
            cfgBoard.webItems.forEach(function (w) {
                var cell = (typeof w.cell === 'number') ? w.cell : w[0];
                var id = w.id || w[1];
                if (cell >= 0 && cell < TOTAL_CELLS) {
                    board[cell] = { id: id, isRock: false, isLocked: true };
                }
            });
        }
    } else {
        var patFn = (level && PATTERNS[level.pattern]) || PATTERNS.box5x5;
        var hasExplicitRocks = level && Array.isArray(level.rocks);
        var rSet = hasExplicitRocks ? new Set(level.rocks) : null;
        for (var j = 0; j < TOTAL_CELLS; j++) {
            var isRock = rSet ? rSet.has(j) : patFn(Math.floor(j / COLS), j % COLS);
            board[j] = { id: null, isRock: isRock, isLocked: false };
        }
        if (level && level.gens) level.gens.forEach(function (g) { board[g[0]] = { id: g[1], isRock: false, isLocked: false }; });
        if (level && level.free) level.free.forEach(function (f) { board[f[0]] = { id: f[1], isRock: false, isLocked: false }; });
        if (level && level.webs) level.webs.forEach(function (w) { board[w[0]] = { id: w[1], isRock: false, isLocked: true }; });
    }

    if (typeof ensureAllGeneratorsOnBoard === 'function') {
        ensureAllGeneratorsOnBoard(board, level ? level.rawOrders : null);
    }
    populateRockHiddenItems(board);
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

// Túi xáo trộn cân bằng (Balanced Shuffle Bag) cho từng nguồn phát và trạng thái lượt sinh gần nhất
var genOffOrderStreak = {};
var genSpawnBags = {};
var genLastSpawnItem = {};
var lastSpawnResult = { target: -1, id: null, line: null, wasUnwanted: false };

function resetGeneratorPity() {
    genOffOrderStreak = {};
    genSpawnBags = {};
    genLastSpawnItem = {};
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
// Đọc trực tiếp từ cấu hình GAME_CONFIG.gameplay.generatorDrops để giảm lượng đồ Lv.1 gây đầy bàn
function getGeneratorDropLevel(levelNum) {
    var dropCfg = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.gameplay && GAME_CONFIG.gameplay.generatorDrops)
        ? GAME_CONFIG.gameplay.generatorDrops
        : null;

    var minTierLv = (dropCfg && dropCfg.minLevelForTierDrops != null) ? dropCfg.minLevelForTierDrops : 5;
    var minLv3 = (dropCfg && dropCfg.minLevelForLv3Drops != null) ? dropCfg.minLevelForLv3Drops : 10;
    var effLv = Math.max(1, levelNum || 1);
    if (effLv < minTierLv) return 1;

    var tiers = (dropCfg && dropCfg.tiers) || [
        { maxLevel: 4,   lv1: 1.00, lv2: 0.00, lv3: 0.00 },
        { maxLevel: 9,   lv1: 0.72, lv2: 0.28, lv3: 0.00 },
        { maxLevel: 20,  lv1: 0.58, lv2: 0.32, lv3: 0.10 },
        { maxLevel: 35,  lv1: 0.45, lv2: 0.37, lv3: 0.18 },
        { maxLevel: 60,  lv1: 0.35, lv2: 0.40, lv3: 0.25 }
    ];

    var tier = tiers.find(function (t) { return effLv <= t.maxLevel; }) || tiers[tiers.length - 1];
    var lv3Prob = (effLv >= minLv3) ? (tier.lv3 || 0) : 0;
    var lv2Prob = (effLv >= minTierLv) ? (tier.lv2 || 0) : 0;

    var r = rand();
    if (effLv >= minLv3 && r < lv3Prob) return 3;
    if (effLv >= minTierLv && r < lv3Prob + lv2Prob) return 2;
    return 1;
}

// Giá trị kỳ vọng tương đương Lv.1 của 1 lần bấm sinh đồ theo cấp độ màn chơi:
// Lv.1 = 1 điểm, Lv.2 = 2 điểm, Lv.3 = 4 điểm (1 món Lv3 = 2 món Lv2 = 4 món Lv1)
function getGeneratorDropExpectedValue(levelNum) {
    var dropCfg = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.gameplay && GAME_CONFIG.gameplay.generatorDrops)
        ? GAME_CONFIG.gameplay.generatorDrops
        : null;

    var minTierLv = (dropCfg && dropCfg.minLevelForTierDrops != null) ? dropCfg.minLevelForTierDrops : 5;
    var minLv3 = (dropCfg && dropCfg.minLevelForLv3Drops != null) ? dropCfg.minLevelForLv3Drops : 10;
    var effLv = Math.max(1, levelNum || 1);
    if (effLv < minTierLv) return 1.0;

    var tiers = (dropCfg && dropCfg.tiers) || [
        { maxLevel: 4,   lv1: 1.00, lv2: 0.00, lv3: 0.00 },
        { maxLevel: 9,   lv1: 0.72, lv2: 0.28, lv3: 0.00 },
        { maxLevel: 20,  lv1: 0.58, lv2: 0.32, lv3: 0.10 },
        { maxLevel: 35,  lv1: 0.45, lv2: 0.37, lv3: 0.18 },
        { maxLevel: 60,  lv1: 0.35, lv2: 0.40, lv3: 0.25 }
    ];

    var tier = tiers.find(function (t) { return effLv <= t.maxLevel; }) || tiers[tiers.length - 1];
    var p3 = (effLv >= minLv3) ? (tier.lv3 != null ? tier.lv3 : 0.0) : 0.0;
    var p2 = tier.lv2 != null ? tier.lv2 : 0.0;
    var p1 = tier.lv1 != null ? tier.lv1 : Math.max(0, 1.0 - p2 - p3);
    return Math.max(1.0, (p1 * 1) + (p2 * 2) + (p3 * 4));
}

// Sinh 1 item từ nguồn phát vào ô trống ngẫu nhiên. Trả về index ô mới, hoặc -1 nếu bàn đầy
// Thuật toán chia đều 100% tỷ lệ giữa 3 nhánh vật phẩm của mỗi thùng chứa (1/3 : 1/3 : 1/3)
// thông qua cơ chế Túi Xáo Trộn Cân Bằng (Balanced Shuffle Bag: mỗi 6 lượt bấm ra đúng 2 món của mỗi nhánh),
// kết hợp hỗ trợ bắt cặp thông minh (smartPairAssist) khi bàn cờ còn ít ô trống để tránh kẹt màn.
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

    var id;
    var wasUnwanted = false;

    // Kiểm tra xem người dùng có cấu hình trọng số riêng khác nhau trong GAME_CONFIG không
    var dropCfg = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.gameplay && GAME_CONFIG.gameplay.generatorDrops)
        ? GAME_CONFIG.gameplay.generatorDrops
        : null;
    var customWeightsObj = (dropCfg && dropCfg.branchWeights && dropCfg.branchWeights[genId]) ? dropCfg.branchWeights[genId] : null;
    var weights = list.map(function (itemId) {
        var ln = itemLine(itemId);
        var w = (customWeightsObj && typeof customWeightsObj[ln] === 'number') ? customWeightsObj[ln] : 1;
        return Math.max(0, w);
    });
    var firstW = weights[0];
    var isAllEqual = weights.every(function (w) { return w === firstW && w > 0; });
    var smartAssist = !dropCfg || dropCfg.smartPairAssist !== false;

    // Quét các vật phẩm Lv.1 / Lv.2 đang lẻ cặp hoặc dính nhện trên bàn cờ để hỗ trợ giải phóng ô khi bàn hẹp
    var oddLowLvByLine = {};
    var webLowLvByLine = {};
    if (smartAssist && board && board.length) {
        var countsByLineLv = {};
        board.forEach(function (c) {
            if (!c || !c.id || c.isRock || GENERATORS[c.id]) return;
            var ln = itemLine(c.id);
            var lv = itemLv(c.id);
            if (lv <= 2) {
                if (c.isLocked) {
                    if (!webLowLvByLine[ln] || lv < webLowLvByLine[ln]) webLowLvByLine[ln] = lv;
                } else {
                    var key = ln + '_' + lv;
                    countsByLineLv[key] = (countsByLineLv[key] || 0) + 1;
                }
            }
        });
        list.forEach(function (baseId) {
            var ln = itemLine(baseId);
            if ((countsByLineLv[ln + '_1'] || 0) % 2 === 1) {
                oddLowLvByLine[ln] = 1;
            } else if ((countsByLineLv[ln + '_2'] || 0) % 2 === 1) {
                oddLowLvByLine[ln] = 2;
            }
        });
    }

    if (isAllEqual) {
        // Chia đều tuyệt đối 3 nhánh (33.33% mỗi nhánh) bằng túi xáo trộn 6 món (2 cặp cho mỗi nhánh)
        var bag = genSpawnBags[genId];
        if (!Array.isArray(bag) || bag.length === 0) {
            bag = [];
            for (var bIdx = 0; bIdx < list.length; bIdx++) {
                bag.push(list[bIdx]);
                bag.push(list[bIdx]);
            }
            // Xáo trộn ngẫu nhiên Fisher-Yates
            for (var s = bag.length - 1; s > 0; s--) {
                var rIdx = Math.floor(rand() * (s + 1));
                var tmp = bag[s];
                bag[s] = bag[rIdx];
                bag[rIdx] = tmp;
            }
            // Tránh lặp quá 2 lần liên tiếp cùng 1 món ở điểm nối giữa 2 túi
            var lastItem = genLastSpawnItem[genId];
            if (lastItem && bag.length > 1 && bag[0] === lastItem) {
                for (var k = 1; k < bag.length; k++) {
                    if (bag[k] !== lastItem) {
                        var swapTmp = bag[0];
                        bag[0] = bag[k];
                        bag[k] = swapTmp;
                        break;
                    }
                }
            }
            genSpawnBags[genId] = bag;
        }

        // Nếu bàn cờ còn ít ô trống (<= 8 ô), ưu tiên rút món còn sẵn trong túi khớp với đồ lẻ/nhện trên bàn để ghép giải phóng ô ngay
        var pickBagIdx = 0;
        if (smartAssist && empty.length <= 8 && bag.length > 1) {
            var matchedIdx = -1;
            for (var bi = 0; bi < bag.length; bi++) {
                var candLine = itemLine(bag[bi]);
                if (webLowLvByLine[candLine] || oddLowLvByLine[candLine]) {
                    matchedIdx = bi;
                    break;
                }
            }
            if (matchedIdx !== -1) {
                pickBagIdx = matchedIdx;
            }
        }
        id = bag.splice(pickBagIdx, 1)[0];
        genLastSpawnItem[genId] = id;
    } else {
        // Trường hợp người dùng chỉnh trọng số riêng trong config.js
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
        genLastSpawnItem[genId] = id;
    }

    var pickedLine = itemLine(id);
    var pLv = (typeof SAVE !== 'undefined' && SAVE && typeof SAVE.playerLevel === 'number')
        ? SAVE.playerLevel
        : ((typeof currentLevel !== 'undefined' && currentLevel) ? currentLevel : ((levelCfg && (levelCfg.num || levelCfg.level)) || 1));
    var minTierLv = (dropCfg && dropCfg.minLevelForTierDrops != null) ? dropCfg.minLevelForTierDrops : 5;
    var dropLv = getGeneratorDropLevel(pLv);

    // Khi bàn cờ sắp đầy (<= 6 ô trống), nếu nhánh vừa chọn đang có món lẻ hoặc nhện chờ ghép thì khớp đúng cấp đó để ghép ngay
    // (nhưng chỉ cho phép sinh Lv.2 khi người chơi đã đạt tối thiểu Level 5 theo đúng luật minLevelForTierDrops)
    if (smartAssist && empty.length <= 6) {
        var maxAllowedAssistLv = (pLv >= minTierLv) ? 2 : 1;
        if (webLowLvByLine[pickedLine] && webLowLvByLine[pickedLine] <= maxAllowedAssistLv) {
            dropLv = webLowLvByLine[pickedLine];
        } else if (oddLowLvByLine[pickedLine] && oddLowLvByLine[pickedLine] <= maxAllowedAssistLv) {
            dropLv = oddLowLvByLine[pickedLine];
        }
    }

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
    var maxLv = getItemMaxLevel(id);
    return lv < maxLv ? itemLine(id) + '_lv' + (lv + 1) : null;
}

// Di chuyển / ghép / hoán đổi. Trả về { type, index, newId, brokeDirectWeb }
//  type: 'none' | 'move' | 'merge' | 'swap'
function doMove(board, fromIdx, toIdx) {
    var none = { type: 'none', index: -1, newId: null, brokeDirectWeb: false };
    if (fromIdx === toIdx) return none;
    var from = board[fromIdx], to = board[toIdx];
    if (!from || !from.id || from.isLocked || from.isRock) return none;
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
        if (c && c.id && c.isLocked && !c.isRock) {
            var l = itemLine(c.id);
            need[l] = Math.max(need[l] || 0, itemLv(c.id));
        }
    });
    return need;
}

function findOrderMatch(board, orderId) {
    return board.findIndex(c => c && c.id === orderId && !c.isLocked && !c.isRock && !GENERATORS[c.id]);
}

// Nước ghép tốt nhất: ưu tiên phá nhện trực tiếp > phá nhện liền kề > tiến tới đơn hàng > ghép dọn bàn
// Dùng cho gợi ý (người chơi) và bot mô phỏng. Trả về { from, to, score } hoặc null
function findBestMerge(board, orders, level) {
    var need = neededLevels(board, orders);
    var byId = {};
    board.forEach((c, i) => {
        if (!c || !c.id || c.isRock || GENERATORS[c.id]) return;
        if (itemLv(c.id) >= getItemMaxLevel(c.id)) return;
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

// ==========================================
// HỆ THỐNG ĐƠN HÀNG THÚ CƯNG DỰNG TRẠI VÔ TẬN (MODEL B: CONTINUOUS EXP ORDERS)
// Người chơi thu thập đồ đạc cắm trại để dựng khu trại hoàn hảo cho bạn thú cưng
// ==========================================

var PET_ORDER_DIALOGUES = {
    'ban': [
        'Cần thêm một chiếc bàn gấp để bày đồ ăn dã ngoại!',
        'Bày bàn trà ngắm hoàng hôn cùng mình nhé!',
        'Một chiếc bàn nhỏ xinh xắn cho góc trại nào!'
    ],
    'ghe': [
        'Tìm giúp mình chiếc ghế êm để ngồi ngắm cảnh nhé!',
        'Chân mình mỏi rồi, cần ghế tựa lưng ngắm rừng cây!',
        'Ghế gấp gọn gàng để quây quần bên nhau nào!'
    ],
    'trai': [
        'Dựng một chiếc lều ấm áp che sương đêm cho mình nhé!',
        'Lều trại xinh xắn để chúng mình ngủ trưa đón gió!',
        'Thêm lều cắm trại kiên cố đón những chuyến đi xa!'
    ],
    'cafe': [
        'Pha một ly cà phê ấm sưởi ấm sớm mai rừng núi nào!',
        'Mùi cà phê thơm lừng giữa thiên nhiên thật tuyệt!',
        'Ly cà phê phin đậm đà cho ngày mới đầy năng lượng!'
    ],
    'an': [
        'Bụng mình reo rồi, chuẩn bị chút đồ ăn dã ngoại nhé!',
        'Bánh mì kẹp thơm ngon nạp năng lượng đi bộ đường dài!',
        'Chút đồ ăn nhẹ cho buổi dã ngoại nào!'
    ],
    'congcu': [
        'Cần bộ dụng cụ chắc chắn để gia cố cọc lều!',
        'Dụng cụ dã ngoại đa năng cho chuyến đi an toàn!',
        'Gọt cành cây và cố định lều trại nào!'
    ],
    'tham': [
        'Trải thảm êm ra bãi cỏ để mình lăn lộn ngắm mây nào!',
        'Thảm dã ngoại hoa văn xinh xắn cho góc trại!',
        'Ngả lưng trên tấm thảm êm hít thở không khí trong lành!'
    ],
    'bep': [
        'Đốt bếp lửa trại ấm cúng để nướng khoai đêm nhé!',
        'Nồi súp nóng hổi bốc khói giữa chiều lạnh rừng thông!',
        'Bếp dã ngoại tiện lợi cho bữa tối thịnh soạn!'
    ],
    'antoan': [
        'Thắp đèn bão soi sáng lối đi trong màn đêm tĩnh lặng!',
        'Hộp cứu thương và đèn an toàn luôn sẵn sàng nhé!',
        'Ánh đèn vàng ấm áp xua tan bóng tối rừng già!'
    ]
};

function getPetOrderDialogue(itemId) {
    var line = itemLine(itemId);
    var list = PET_ORDER_DIALOGUES[line] || [
        'Hãy giúp mình ghép món đồ cắm trại này nhé!',
        'Khu trại của chúng mình sắp hoàn hảo rồi!',
        'Cùng chuẩn bị đồ nghề cho chuyến dã ngoại nào!'
    ];
    return list[Math.floor(Math.random() * list.length)];
}

// =========================================================================
// THUẬT TOÁN SINH NHIỆM VỤ DỰNG TRẠI LIÊN TỤC (MODEL B)
// Áp dụng "Bộ 4 Tầng Chống Lặp" (4-Tier Anti-Duplication System)
// =========================================================================

// Tầng 3: Phân tầng dải Tier khả dụng theo Slot (easy/medium/hard) & Level người chơi
// Bắt đầu từ tối thiểu Level 3 và tăng dần theo cấp người chơi (lên tối đa Level 12)
function getContinuousOrderTierRange(pLv, tierHint) {
    pLv = Math.max(1, parseInt(pLv, 10) || 1);
    if (tierHint === 'easy') {
        if (pLv <= 3) return [{ tier: 3, w: 100 }];
        if (pLv <= 6) return [{ tier: 3, w: 60 }, { tier: 4, w: 40 }];
        if (pLv <= 10) return [{ tier: 3, w: 40 }, { tier: 4, w: 45 }, { tier: 5, w: 15 }];
        if (pLv <= 14) return [{ tier: 4, w: 40 }, { tier: 5, w: 45 }, { tier: 6, w: 15 }];
        if (pLv <= 17) return [{ tier: 4, w: 25 }, { tier: 5, w: 45 }, { tier: 6, w: 30 }];
        return [{ tier: 5, w: 30 }, { tier: 6, w: 45 }, { tier: 7, w: 25 }];
    } else if (tierHint === 'medium') {
        if (pLv <= 3) return [{ tier: 3, w: 50 }, { tier: 4, w: 50 }];
        if (pLv <= 6) return [{ tier: 4, w: 55 }, { tier: 5, w: 45 }];
        if (pLv <= 10) return [{ tier: 4, w: 30 }, { tier: 5, w: 45 }, { tier: 6, w: 25 }];
        if (pLv <= 14) return [{ tier: 5, w: 30 }, { tier: 6, w: 45 }, { tier: 7, w: 25 }];
        if (pLv <= 17) return [{ tier: 6, w: 25 }, { tier: 7, w: 45 }, { tier: 8, w: 30 }];
        return [{ tier: 6, w: 20 }, { tier: 7, w: 35 }, { tier: 8, w: 30 }, { tier: 9, w: 15 }];
    } else { // 'hard'
        if (pLv <= 3) return [{ tier: 4, w: 70 }, { tier: 5, w: 30 }];
        if (pLv <= 6) return [{ tier: 5, w: 50 }, { tier: 6, w: 50 }];
        if (pLv <= 10) return [{ tier: 5, w: 30 }, { tier: 6, w: 45 }, { tier: 7, w: 25 }];
        if (pLv <= 14) return [{ tier: 6, w: 30 }, { tier: 7, w: 40 }, { tier: 8, w: 30 }];
        if (pLv <= 17) return [{ tier: 7, w: 25 }, { tier: 8, w: 35 }, { tier: 9, w: 25 }, { tier: 10, w: 15 }];
        return [{ tier: 8, w: 20 }, { tier: 9, w: 30 }, { tier: 10, w: 25 }, { tier: 11, w: 15 }, { tier: 12, w: 10 }];
    }
}

// Sở thích phân nhóm vật phẩm của từng Thú cưng khi đặt đơn hàng (Pet Order Preferences)
var PET_PREFERENCES = {
    'character01': ['trai', 'ghe', 'ban'],         // Golden: Đồ cắm trại & bàn ghế cơ bản
    'character05': ['congcu', 'bep', 'an'],        // Labrador: Thám hiểm hoang dã & bếp nướng
    'character04': ['an', 'cafe', 'tham'],         // Poodle: Bữa ăn nhẹ, cà phê & thảm dã ngoại
    'character03': ['antoan', 'trai', 'bep'],      // Bulldog: Lều vững chãi & dụng cụ an toàn
    'character02': ['antoan', 'congcu', 'trai'],   // Béc-giê: Tuần tra & dụng cụ sinh tồn
    'character10': ['tham', 'cafe', 'ghe'],        // Ba Tư: Thảm êm, cà phê & ghế thư giãn
    'character09': ['an', 'trai', 'bep'],          // Maine Coon: Tiệc nướng ngoài trời & lều lớn
    'character08': ['tham', 'ghe', 'cafe'],        // Ragdoll: Nệm ấm, ghế xếp lười & đồ uống
    'character07': ['cafe', 'an', 'tham'],         // Mèo Anh: Trà chiều & đồ ăn ngon
    'character06': ['congcu', 'an', 'antoan']      // Xiêm: Đồ nghề nhanh nhẹn & do thám
};

function pickPetForOrder(orderItemLine, existingPetIds) {
    var owned = (typeof SAVE !== 'undefined' && SAVE && Array.isArray(SAVE.ownedPets) && SAVE.ownedPets.length > 0)
        ? SAVE.ownedPets.slice()
        : ['character01'];

    // Nếu chỉ có 1 thú cưng (khởi đầu là Golden), luôn là chú chó đó đặt đơn
    if (owned.length === 1) return owned[0];

    var existing = Array.isArray(existingPetIds) ? existingPetIds : [];

    // Ưu tiên chọn thú cưng đã mua chưa có đơn trên bàn cờ để tạo sự đa dạng
    var pool = owned.filter(function (p) { return existing.indexOf(p) === -1; });
    if (!pool.length) pool = owned.slice();

    // Trong nhóm này, ưu tiên thú cưng có sở thích trùng với dòng vật phẩm được sinh
    var matched = pool.filter(function (p) {
        var prefs = PET_PREFERENCES[p] || [];
        return prefs.indexOf(orderItemLine) !== -1;
    });

    var finalPool = (matched.length > 0) ? matched : pool;
    return finalPool[Math.floor(Math.random() * finalPool.length)];
}

// =============================================================================
// THUẬT TOÁN TẠO ĐƠN HÀNG THÚ CƯNG (3 SLOT CỐ ĐỊNH, PHÂN BỔ 3 MÁY PHÁT, CHỐNG LẶP 15 MÓN)
// 1. Cấu trúc 3 Slot Cố Định:
//    - Slot 1 (Khó - Rút Năng Lượng): level = (Max Level đã từng ghép) - Random(0..2), tối thiểu Lv 7. Tỉ lệ 100%.
//    - Slot 2 (Vừa - Sinh Vàng Lẻ): Level 4 đến Level 6. Tỉ lệ 100%.
//    - Slot 3 (Dễ - Chống Kẹt Bàn Cờ): Level 1 đến Level 3. Tỉ lệ 70% (30% đơn chỉ có 2 món).
// 2. Trọng số Máy phát (Generator Weighting):
//    - 3 Slot phải chọn 3 nhánh thuộc 3 Máy phát khác nhau để phân bổ đều áp lực nhấn máy.
// 3. Cơ chế Chống lặp (Anti-Repetition Array):
//    - Lưu ID 15 item gần nhất đã xuất hiện. Nếu New_Item in Recent_Items -> Reroll!
// =============================================================================

var GENERATOR_BRANCH_MAP = {
    'generator_cooler': ['ban', 'ghe', 'trai'],
    'generator_backpack': ['an', 'cafe', 'congcu'],
    'generator_crate': ['bep', 'tham', 'antoan']
};

var ALL_PERMUTATIONS = [
    ['generator_cooler', 'generator_backpack', 'generator_crate'],
    ['generator_cooler', 'generator_crate', 'generator_backpack'],
    ['generator_backpack', 'generator_cooler', 'generator_crate'],
    ['generator_backpack', 'generator_crate', 'generator_cooler'],
    ['generator_crate', 'generator_cooler', 'generator_backpack'],
    ['generator_crate', 'generator_backpack', 'generator_cooler']
];

function getGeneratorForLine(line) {
    if (!line) return 'generator_cooler';
    for (var genId in GENERATOR_BRANCH_MAP) {
        if (GENERATOR_BRANCH_MAP[genId].indexOf(line) !== -1) {
            return genId;
        }
    }
    return 'generator_cooler';
}

// Xác định danh sách máy phát ĐANG ĐẶT TRÊN BÀN CHƠI:
// - Bắt đầu game (Level 1..3): Chỉ có Xe Kéo Cắm Trại ('generator_cooler') trên bàn cờ.
// - Level 4: Ba Lô ('generator_backpack') xuất hiện bên trái chú chó; chỉ khi người chơi KÉO VÀO BÀN CỜ thì mới tính là đang hoạt động!
// - Level 5: Thùng Đồ ('generator_crate') xuất hiện bên trái chú chó; chỉ khi người chơi KÉO VÀO BÀN CỜ thì mới tính là đang hoạt động!
function getActiveGeneratorsForOrders(board) {
    var active = ['generator_cooler'];
    var b = board || (typeof boardData !== 'undefined' ? boardData : (typeof SAVE !== 'undefined' && SAVE ? SAVE.persistentBoard : null));
    if (Array.isArray(b)) {
        b.forEach(function (c) {
            if (c && c.id && GENERATORS[c.id] && !c.isRock && !c.isLocked && active.indexOf(c.id) === -1) {
                active.push(c.id);
            }
        });
    }
    return active;
}

// Danh sách máy phát đã đủ cấp độ mở khóa (Lv.4 -> Ba Lô, Lv.5 -> Thùng Đồ) nhưng CHƯA được kéo vào bàn cờ:
// Sẽ hiển thị thành icon phát sáng viền bên trái chú chó để người chơi tự tay lôi vào bàn chơi.
function getPendingDockGenerators(board, playerLv) {
    var pLv = (typeof playerLv === 'number' && playerLv > 0)
        ? playerLv
        : ((typeof SAVE !== 'undefined' && SAVE && typeof SAVE.playerLevel === 'number') ? SAVE.playerLevel : 1);

    var unlockLevels = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.initialBoard && GAME_CONFIG.initialBoard.generatorUnlockLevels)
        ? GAME_CONFIG.initialBoard.generatorUnlockLevels
        : { generator_cooler: 1, generator_backpack: 4, generator_crate: 5 };

    var onBoard = new Set(['generator_cooler']);
    var b = board || (typeof boardData !== 'undefined' ? boardData : (typeof SAVE !== 'undefined' && SAVE ? SAVE.persistentBoard : null));
    if (Array.isArray(b)) {
        b.forEach(function (c) {
            if (c && c.id && GENERATORS[c.id] && !c.isRock && !c.isLocked) {
                onBoard.add(c.id);
            }
        });
    }

    var pending = [];
    if (pLv >= (unlockLevels.generator_backpack || 4) && !onBoard.has('generator_backpack')) {
        pending.push('generator_backpack');
    }
    if (pLv >= (unlockLevels.generator_crate || 5) && !onBoard.has('generator_crate')) {
        pending.push('generator_crate');
    }
    return pending;
}

// Không tự động đặt Ba Lô / Thùng Đồ lên bàn cờ nữa (người chơi tự kéo từ icon bên trái chú chó khi đạt Level 4 và Level 5)
function checkAndUnlockGeneratorsByMilestone(board) {
    return [];
}

function getMaxDiscoveredLevelForLine(line) {
    var maxLv = 0;
    if (typeof SAVE !== 'undefined' && SAVE && SAVE.discovered) {
        Object.keys(SAVE.discovered).forEach(function (id) {
            if (id.indexOf(line + '_lv') === 0) {
                var lv = parseInt(id.split('_lv')[1], 10) || 0;
                if (lv > maxLv) maxLv = lv;
            }
        });
    }
    if (typeof boardData !== 'undefined' && Array.isArray(boardData)) {
        boardData.forEach(function (c) {
            if (c && c.id && c.id.indexOf(line + '_lv') === 0 && !c.isRock) {
                var lv = parseInt(c.id.split('_lv')[1], 10) || 0;
                if (lv > maxLv) maxLv = lv;
            }
        });
    }
    return maxLv;
}

function getSlotCandidates(genId, slotType, existingIds, recentItems) {
    var branches = GENERATOR_BRANCH_MAP[genId] || ['ban', 'ghe', 'trai'];
    var cands = [];
    branches.forEach(function (b) {
        var cap = getItemMaxLevel(b);
        if (slotType === 'hard') {
            var maxMerged = Math.max(7, getMaxDiscoveredLevelForLine(b));
            for (var d = 0; d <= 2; d++) {
                var lv = Math.max(7, Math.min(cap, maxMerged - d));
                var id = b + '_lv' + lv;
                if (!cands.some(function (c) { return c.id === id; })) {
                    cands.push({ id: id, line: b, level: lv });
                }
            }
        } else if (slotType === 'medium') {
            for (var lv = 4; lv <= 6; lv++) {
                if (lv <= cap) {
                    cands.push({ id: b + '_lv' + lv, line: b, level: lv });
                }
            }
        } else {
            for (var elv = 1; elv <= 3; elv++) {
                cands.push({ id: b + '_lv' + elv, line: b, level: elv });
            }
        }
    });

    var valid = cands.filter(function (c) {
        return existingIds.indexOf(c.id) === -1 && recentItems.indexOf(c.id) === -1;
    });
    return { all: cands, valid: valid };
}

function generatePetOrderGroup(petId, playerLevel, existingIds, history15, itemCountHint) {
    playerLevel = Math.max(1, parseInt(playerLevel, 10) || 1);
    existingIds = Array.isArray(existingIds) ? existingIds.slice() : [];

    var recentItems = Array.isArray(history15) ? history15.slice(-15) :
        ((typeof SAVE !== 'undefined' && Array.isArray(SAVE.recentOrdersHistory)) ? SAVE.recentOrdersHistory.slice(-15) : []);

    var shouldIncludeSlot3 = (itemCountHint !== undefined)
        ? (itemCountHint >= 3)
        : (Math.random() < 0.70);

    var activeGens = (typeof getActiveGeneratorsForOrders === 'function')
        ? getActiveGeneratorsForOrders()
        : ['generator_cooler', 'generator_backpack', 'generator_crate'];

    // Phân bổ máy phát cho từng Slot theo số lượng máy phát đang mở
    var genSlot1, genSlot2, genSlot3;
    if (activeGens.length === 1) {
        // 3 đơn đầu: Chỉ có Xe Kéo -> cả 3 slot thuộc Xe Kéo nhưng sẽ chia đều 3 nhánh (ban, ghe, trai)
        genSlot1 = activeGens[0];
        genSlot2 = activeGens[0];
        genSlot3 = activeGens[0];
    } else if (activeGens.length === 2) {
        // Đơn 4-6: Có Xe Kéo + Ba Lô -> Slot 1 và 2 thuộc 2 máy khác nhau
        var shuf2 = activeGens.slice().sort(function () { return Math.random() - 0.5; });
        genSlot1 = shuf2[0];
        genSlot2 = shuf2[1];
        genSlot3 = activeGens[Math.floor(Math.random() * activeGens.length)];
    } else {
        // Đơn 7+: Đủ cả 3 máy -> Slot 1, 2, 3 mỗi slot thuộc 1 máy phát hoàn toàn khác nhau
        var shuf3 = activeGens.slice().sort(function () { return Math.random() - 0.5; });
        genSlot1 = shuf3[0];
        genSlot2 = shuf3[1];
        genSlot3 = shuf3[2];
    }

    var groupOrders = [];
    var tempExisting = existingIds.slice();
    var usedLines = [];

    function pickSlotCandidate(genId, slotType) {
        var cands = getSlotCandidates(genId, slotType, tempExisting, recentItems);
        // Ưu tiên chọn nhánh chưa xuất hiện trong nhóm đơn này để chống trùng nhánh
        var pool = cands.valid.filter(function (c) { return usedLines.indexOf(c.line) === -1; });
        if (pool.length === 0) pool = cands.valid;
        if (pool.length === 0) pool = cands.all.filter(function (c) { return tempExisting.indexOf(c.id) === -1; });
        if (pool.length === 0) pool = cands.all;

        var chosen = pool[Math.floor(Math.random() * pool.length)];
        tempExisting.push(chosen.id);
        usedLines.push(chosen.line);
        return chosen;
    }

    var cand1 = pickSlotCandidate(genSlot1, 'hard');
    var cand2 = pickSlotCandidate(genSlot2, 'medium');
    var cand3 = shouldIncludeSlot3 ? pickSlotCandidate(genSlot3, 'easy') : null;

    function makeOrder(cand, slotName) {
        var orderId = cand.id;
        var goldRw = (typeof orderReward === 'function') ? orderReward(orderId) : 50;
        var expRw = (typeof orderExp === 'function') ? orderExp(orderId) : 15;
        existingIds.push(orderId);
        recentItems.push(orderId);
        return {
            id: orderId,
            done: false,
            gold: goldRw,
            exp: expRw,
            petId: petId,
            stashed: false,
            slotType: slotName
        };
    }

    if (cand1) groupOrders.push(makeOrder(cand1, 'hard'));
    if (cand2) groupOrders.push(makeOrder(cand2, 'medium'));
    if (cand3) groupOrders.push(makeOrder(cand3, 'easy'));

    // Cập nhật bộ đệm lịch sử chống lặp (tối đa 15 item gần nhất)
    if (typeof SAVE !== 'undefined' && SAVE) {
        SAVE.recentOrdersHistory = recentItems.slice(-15);
    }

    return {
        petId: petId,
        orders: groupOrders
    };
}

function generateContinuousOrder(playerLevel, existingIds, tierHint, justDeliveredId, recentHistory, existingPetIds) {
    existingIds = existingIds || [];
    var recentItems = Array.isArray(recentHistory) ? recentHistory.slice(-15) :
        ((typeof SAVE !== 'undefined' && Array.isArray(SAVE.recentOrdersHistory)) ? SAVE.recentOrdersHistory.slice(-15) : []);

    var allGens = (typeof getActiveGeneratorsForOrders === 'function')
        ? getActiveGeneratorsForOrders()
        : ['generator_cooler', 'generator_backpack', 'generator_crate'];
    var existingLines = existingIds.map(function (id) { return String(id).split('_lv')[0]; });
    var usedGens = existingLines.map(getGeneratorForLine);

    var availableGens = allGens.filter(function (g) { return usedGens.indexOf(g) === -1; });
    if (!availableGens.length) availableGens = allGens.slice();
    var chosenGen = availableGens[Math.floor(Math.random() * availableGens.length)];

    var branches = GENERATOR_BRANCH_MAP[chosenGen] || ['ban', 'ghe', 'trai'];
    var allCandidates = [];

    branches.forEach(function (b) {
        var cap = getItemMaxLevel(b);
        if (tierHint === 'hard') {
            var maxMerged = Math.max(7, getMaxDiscoveredLevelForLine(b));
            for (var d = 0; d <= 2; d++) {
                var lv = Math.max(7, Math.min(cap, maxMerged - d));
                allCandidates.push({ id: b + '_lv' + lv, line: b, level: lv });
            }
        } else if (tierHint === 'easy') {
            for (var elv = 1; elv <= 3; elv++) {
                allCandidates.push({ id: b + '_lv' + elv, line: b, level: elv });
            }
        } else {
            // medium: Level 4 đến 6
            for (var mlv = 4; mlv <= 6; mlv++) {
                if (mlv <= cap) allCandidates.push({ id: b + '_lv' + mlv, line: b, level: mlv });
            }
        }
    });

    var valid = allCandidates.filter(function (cand) {
        if (existingIds.indexOf(cand.id) !== -1) return false;
        if (justDeliveredId && cand.id === justDeliveredId) return false;
        if (recentItems.indexOf(cand.id) !== -1) return false;
        return true;
    });

    var chosen = null;
    if (valid.length > 0) {
        chosen = valid[Math.floor(Math.random() * valid.length)];
    } else {
        var nonExisting = allCandidates.filter(function (c) {
            return existingIds.indexOf(c.id) === -1 && (!justDeliveredId || c.id !== justDeliveredId);
        });
        var pool = nonExisting.length > 0 ? nonExisting : allCandidates;
        var bestCand = pool[0];
        var minRecentIdx = 9999;
        pool.forEach(function (c) {
            var idx = recentItems.indexOf(c.id);
            if (idx === -1) {
                minRecentIdx = -1;
                bestCand = c;
            } else if (idx < minRecentIdx) {
                minRecentIdx = idx;
                bestCand = c;
            }
        });
        chosen = bestCand;
    }

    var orderId = chosen.id;
    var goldRw = (typeof orderReward === 'function') ? orderReward(orderId) : 50;
    var expRw = (typeof orderExp === 'function') ? orderExp(orderId) : 15;
    var chosenPetId = pickPetForOrder(chosen.line, existingPetIds);

    return {
        id: orderId,
        done: false,
        gold: goldRw,
        exp: expRw,
        petId: chosenPetId,
        stashed: false,
        slotType: tierHint || 'medium'
    };
}

// =============================================================================
// HỆ THỐNG NHIỆM VỤ LAI (HYBRID ORDER SYSTEM: SLOT 1 CỐ ĐỊNH + SLOT 2 & 3 ĐỘNG QUÉT BÀN CỜ)
// - Slot 1 (Món Khó - Cố định 100%): Nhiệm vụ Cốt truyện (Main Quest) từ GAME_CONFIG.curatedOrders.
// - Slot 2 & 3 (Món Vừa & Dễ - Động 100%): Nhiệm vụ Tiêu thụ (Side Quests) dùng thuật toán Board Scanner
//   quét toàn bộ 63 ô trên bàn cờ (Lv.2 -> Lv.6), ưu tiên nhánh đang ứ đọng nhiều nhất,
//   giao nhiệm vụ "Mồi" (Teasing +1 cấp) hoặc "May mắn" (Serendipity khớp chính xác món đang găm),
//   và kích hoạt Chế độ "Giải cứu" (Van xả áp suất ở Slot 3) khi bàn cờ đầy trên 85%-90%!
// =============================================================================

function getHybridOrderConfig() {
    var cfg = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.hybridOrders) ? GAME_CONFIG.hybridOrders : {};
    return {
        enabled: cfg.enabled !== false,
        slot1OverMergeProtection: cfg.slot1OverMergeProtection !== false,
        minScanLevel: cfg.minScanLevel || 2,
        maxScanLevel: cfg.maxScanLevel || 6,
        absorbOverMergedInSlot2: cfg.absorbOverMergedInSlot2 !== false,
        teasingProbability: (typeof cfg.teasingProbability === 'number') ? cfg.teasingProbability : 0.55,
        serendipityProbability: (typeof cfg.serendipityProbability === 'number') ? cfg.serendipityProbability : 0.45,
        rescueFillThreshold: (typeof cfg.rescueFillThreshold === 'number') ? cfg.rescueFillThreshold : 0.85,
        liveRescueFillThreshold: (typeof cfg.liveRescueFillThreshold === 'number') ? cfg.liveRescueFillThreshold : 0.90
    };
}

// Bước 1 & 2: Quét toàn bộ 63 ô trên bàn cờ (Scan & Filter Lv.2 -> Lv.6) và phân tích mật độ ứ đọng theo nhánh
function scanBoardForDynamicOrders(board, reservedIds, activeGens) {
    var b = board || (typeof boardData !== 'undefined' ? boardData : null);
    if (!b && typeof SAVE !== 'undefined' && SAVE && SAVE.persistentBoard && Array.isArray(SAVE.persistentBoard.boardData)) {
        b = SAVE.persistentBoard.boardData;
    }

    var hCfg = getHybridOrderConfig();
    var gens = Array.isArray(activeGens) && activeGens.length ? activeGens : getActiveGeneratorsForOrders(b);
    var activeLines = [];
    gens.forEach(function (gId) {
        (GENERATOR_BRANCH_MAP[gId] || []).forEach(function (ln) {
            if (activeLines.indexOf(ln) === -1) activeLines.push(ln);
        });
    });
    if (!activeLines.length) activeLines = ['ban', 'ghe', 'trai'];

    var reservedCountMap = {};
    if (Array.isArray(reservedIds)) {
        reservedIds.forEach(function (id) {
            if (id) reservedCountMap[id] = (reservedCountMap[id] || 0) + 1;
        });
    }

    var byBranch = {};
    activeLines.forEach(function (ln) {
        byBranch[ln] = {
            line: ln,
            totalCount: 0,
            midCount: 0,
            lowCount: 0,
            byLv: {},
            webByLv: {},
            midLevels: [],
            lowLevels: [],
            overMergedLevels: []
        };
    });

    var openCells = 0;
    var occupiedCells = 0;

    if (Array.isArray(b)) {
        for (var i = 0; i < b.length; i++) {
            var c = b[i];
            if (!c || c.isRock) continue;
            if (!c.isLocked) {
                openCells++;
                if (c.id) occupiedCells++;
            }
            if (!c.id || GENERATORS[c.id]) continue;

            var ln = itemLine(c.id);
            var lv = itemLv(c.id);
            if (!byBranch[ln]) continue;

            if (c.isLocked) {
                byBranch[ln].webByLv[lv] = (byBranch[ln].webByLv[lv] || 0) + 1;
            } else {
                // Trừ các vật phẩm đã được giữ chỗ cho Slot trước đó
                if (reservedCountMap[c.id] && reservedCountMap[c.id] > 0) {
                    reservedCountMap[c.id]--;
                    continue;
                }
                byBranch[ln].totalCount++;
                byBranch[ln].byLv[lv] = (byBranch[ln].byLv[lv] || 0) + 1;
                if (lv >= hCfg.minScanLevel && lv <= hCfg.maxScanLevel) {
                    byBranch[ln].midCount++;
                }
                if (lv >= 2 && lv <= 4) {
                    byBranch[ln].lowCount++;
                }
            }
        }
    }

    activeLines.forEach(function (ln) {
        var st = byBranch[ln];
        for (var lv = hCfg.maxScanLevel; lv >= hCfg.minScanLevel; lv--) {
            if ((st.byLv[lv] || 0) > 0) st.midLevels.push(lv);
        }
        for (var llv = 2; llv <= 4; llv++) {
            if ((st.byLv[llv] || 0) > 0) st.lowLevels.push(llv);
        }
        for (var olv = MAX_ITEM_LV; olv >= 6; olv--) {
            if ((st.byLv[olv] || 0) > 0) st.overMergedLevels.push(olv);
        }
    });

    var emptyCount = Math.max(0, openCells - occupiedCells);
    var fillRatio = openCells > 0 ? (occupiedCells / openCells) : 0;
    var isRescueMode = (openCells > 0) && (fillRatio >= hCfg.rescueFillThreshold || emptyCount <= 3);
    var isLiveRescueMode = (openCells > 0) && (fillRatio >= hCfg.liveRescueFillThreshold || emptyCount <= 2);

    return {
        byBranch: byBranch,
        activeLines: activeLines,
        openCells: openCells,
        occupiedCells: occupiedCells,
        emptyCount: emptyCount,
        fillRatio: fillRatio,
        isRescueMode: isRescueMode,
        isLiveRescueMode: isLiveRescueMode
    };
}

// Sinh vật phẩm động cho Slot 2 (Món Vừa: Quét đồ Lv.2 -> Lv.6, ưu tiên nhánh đông nhất, giao nhiệm vụ Mồi hoặc May mắn)
function pickDynamicSlot2Item(board, slot1Id, orderNum, fallbackId, existingIds, activeGens) {
    var hCfg = getHybridOrderConfig();
    var reserved = (existingIds || []).concat(slot1Id ? [slot1Id] : []);
    var scan = scanBoardForDynamicOrders(board, reserved, activeGens);
    var slot1Line = slot1Id ? itemLine(slot1Id) : '';
    var slot1Lv = slot1Id ? itemLv(slot1Id) : 4;

    // Giới hạn cấp độ tối đa của Slot 2 theo tiến trình đơn để đầu game luôn êm ái
    var maxAllowedLv = Math.min(hCfg.maxScanLevel, Math.max(3, (orderNum <= 6) ? 4 : ((orderNum <= 15) ? 5 : 6)));
    if (slot1Lv >= 4) {
        maxAllowedLv = Math.min(maxAllowedLv, Math.max(3, slot1Lv - 1));
    }

    // 1. Cơ chế Hấp thụ đồ ghép lỡ tay (Over-merge Rescue):
    // Nếu trên bàn đang có sẵn 1 món Lv.6 hoặc Lv.7 nằm thừa (không trùng với Slot 1), Slot 2 lập tức yêu cầu chính xác món đó!
    if (hCfg.absorbOverMergedInSlot2 && orderNum >= 10) {
        var overCandidates = [];
        scan.activeLines.forEach(function (ln) {
            var st = scan.byBranch[ln];
            st.overMergedLevels.forEach(function (olv) {
                if (olv <= 7) {
                    var candId = ln + '_lv' + olv;
                    if (candId !== slot1Id && reserved.indexOf(candId) === -1) {
                        overCandidates.push({ id: candId, count: st.totalCount, lv: olv });
                    }
                }
            });
        });
        if (overCandidates.length > 0) {
            overCandidates.sort(function (a, b) { return (b.lv - a.lv) || (b.count - a.count); });
            return overCandidates[0].id;
        }
    }

    // 2. Xếp hạng các nhánh đang có vật phẩm trên bàn theo mức độ ứ đọng (Congestion Score)
    var rankedBranches = [];
    scan.activeLines.forEach(function (ln) {
        var st = scan.byBranch[ln];
        var validMid = st.midLevels.filter(function (lv) { return lv <= maxAllowedLv; });
        var hasLv1Pair = (st.byLv[1] || 0) >= 2;
        if (validMid.length === 0 && !hasLv1Pair) return;

        var hasPairToTease = validMid.some(function (lv) {
            return lv < maxAllowedLv && ((st.byLv[lv] || 0) >= 2 || ((st.byLv[lv] || 0) >= 1 && (st.webByLv[lv] || 0) >= 1));
        });

        var score = (st.totalCount * 10) +
            (st.midCount * 8) +
            (hasPairToTease ? 12 : 0) +
            (ln !== slot1Line ? 6 : 0);

        rankedBranches.push({
            line: ln,
            stats: st,
            validMid: validMid,
            hasLv1Pair: hasLv1Pair,
            score: score
        });
    });

    if (rankedBranches.length > 0) {
        rankedBranches.sort(function (a, b) { return b.score - a.score; });
        var chosen = rankedBranches[0];
        var st = chosen.stats;
        var validMid = chosen.validMid;

        if (validMid.length > 0) {
            // A. Nếu bàn cờ đang chật (Rescue Mode): đòi chính xác món cao nhất đang có để giao ngay
            if (scan.isRescueMode) {
                return chosen.line + '_lv' + validMid[0];
            }

            // B. Nhiệm vụ "Mồi" Chập Đôi (Pair-Merge Teasing):
            // Ví dụ: Đang giữ 2 món Lv.2 (hoặc 1 món tự do Lv.2 + 1 ô nhện Lv.2) -> Đòi Lv.3 để kích thích chập ngay giải phóng ô!
            for (var i = 0; i < validMid.length; i++) {
                var lv = validMid[i];
                if (lv < maxAllowedLv && ((st.byLv[lv] || 0) >= 2 || ((st.byLv[lv] || 0) >= 1 && (st.webByLv[lv] || 0) >= 1))) {
                    var teasedPairId = chosen.line + '_lv' + (lv + 1);
                    if (teasedPairId !== slot1Id) {
                        return teasedPairId;
                    }
                }
            }

            // C. Giữa "May mắn" (Serendipity - đòi đúng món đang găm) và "Mồi +1 cấp" (Teasing):
            var topLv = validMid[0];
            var exactId = chosen.line + '_lv' + topLv;
            var teasedId = chosen.line + '_lv' + Math.min(maxAllowedLv, topLv + 1);

            if (topLv >= maxAllowedLv || topLv >= 4 || teasedId === slot1Id || rand() < hCfg.serendipityProbability) {
                return exactId;
            }
            return teasedId;
        }

        if (chosen.hasLv1Pair) {
            return chosen.line + '_lv2';
        }
    }

    // 3. Fallback khi bàn cờ đang hoàn toàn trống (ví dụ mới vào Đơn 1):
    if (fallbackId && scan.activeLines.indexOf(itemLine(fallbackId)) !== -1) {
        return fallbackId;
    }
    var altLines = scan.activeLines.filter(function (ln) { return ln !== slot1Line; });
    var pickLn = altLines.length > 0 ? altLines[orderNum % altLines.length] : scan.activeLines[0];
    var defaultLv = (orderNum <= 6) ? 2 : ((orderNum <= 18) ? 3 : 4);
    return pickLn + '_lv' + defaultLv;
}

// Sinh vật phẩm động cho Slot 3 (Món Dễ / Van Xả Áp Suất: Quét đồ Lv.2 -> Lv.4, tự động chuyển sang Giải cứu khi bàn đầy)
function pickDynamicSlot3Item(board, slot1Id, slot2Id, orderNum, fallbackId, existingIds, activeGens) {
    var reserved = (existingIds || []).concat([slot1Id, slot2Id].filter(Boolean));
    var scan = scanBoardForDynamicOrders(board, reserved, activeGens);
    var slot1Line = slot1Id ? itemLine(slot1Id) : '';
    var slot2Line = slot2Id ? itemLine(slot2Id) : '';
    var maxAllowedLv = (orderNum <= 9) ? 3 : 4;

    // 1. CHẾ ĐỘ "GIẢI CỨU" (VAN XẢ ÁP SUẤT):
    // Khi bàn cờ bị lấp đầy >= 85% (hoặc còn <= 3 ô trống), Slot 3 đòi CHÍNH XÁC 100% món cấp thấp đang nằm sẵn trên bàn!
    if (scan.isRescueMode) {
        var rescueCandidates = [];
        scan.activeLines.forEach(function (ln) {
            var st = scan.byBranch[ln];
            for (var lv = 2; lv <= 5; lv++) {
                if ((st.byLv[lv] || 0) > 0) {
                    var cid = ln + '_lv' + lv;
                    if (cid !== slot1Id && cid !== slot2Id) {
                        rescueCandidates.push({
                            id: cid,
                            score: (st.totalCount * 10) + ((st.byLv[lv] || 0) * 6) - (lv * 2) + (ln !== slot1Line && ln !== slot2Line ? 5 : 0)
                        });
                    }
                }
            }
        });
        if (rescueCandidates.length > 0) {
            rescueCandidates.sort(function (a, b) { return b.score - a.score; });
            return rescueCandidates[0].id;
        }
    }

    // 2. Chế độ bình thường: Quét các nhánh có vật phẩm cấp thấp (Lv.2 -> Lv.4) để dọn bàn cờ
    // Ưu tiên chọn nhánh KHÁC với nhánh của Slot 1 và Slot 2 để không tranh nguyên liệu đang dùng để ghép Slot 2!
    var lowBranches = [];
    scan.activeLines.forEach(function (ln) {
        var st = scan.byBranch[ln];
        // Nếu Slot 2 đang giao nhiệm vụ "Mồi" (+1 cấp) trên nhánh ln (tức là trên bàn chưa có sẵn slot2Id),
        // toàn bộ đồ cấp thấp của nhánh ln đang được dùng làm nguyên liệu ghép cho Slot 2 nên không lấy cho Slot 3
        if (ln === slot2Line && slot2Id && !(st.byLv[itemLv(slot2Id)] > 0)) {
            return;
        }
        var validLow = st.lowLevels.filter(function (lv) { return lv <= maxAllowedLv; });
        var hasLv1Pair = (st.byLv[1] || 0) >= 2;
        if (validLow.length === 0 && !hasLv1Pair) return;

        var diffBonus = (ln !== slot1Line && ln !== slot2Line) ? 50 : ((ln !== slot1Line && ln !== slot2Line) ? 20 : 0);
        var score = (st.totalCount * 8) + (st.lowCount * 10) + diffBonus;
        lowBranches.push({
            line: ln,
            stats: st,
            validLow: validLow,
            hasLv1Pair: hasLv1Pair,
            score: score
        });
    });

    if (lowBranches.length > 0) {
        lowBranches.sort(function (a, b) { return b.score - a.score; });
        var chosen = lowBranches[0];
        var st = chosen.stats;
        var validLow = chosen.validLow;

        if (validLow.length > 0) {
            // Nếu có 2 món cùng cấp Lv.2 hoặc Lv.3 -> đòi cấp +1 để kích thích chập đôi dọn 2 ô thành 1
            for (var i = 0; i < validLow.length; i++) {
                var lv = validLow[i];
                if (lv < maxAllowedLv && ((st.byLv[lv] || 0) >= 2 || ((st.byLv[lv] || 0) >= 1 && (st.webByLv[lv] || 0) >= 1))) {
                    var pairTarget = chosen.line + '_lv' + (lv + 1);
                    if (pairTarget !== slot1Id && pairTarget !== slot2Id) {
                        return pairTarget;
                    }
                }
            }
            // Ngược lại ưu tiên đòi chính xác món cấp thấp đang nằm lẻ trên bàn (Serendipity dọn bàn)
            var exactLowId = chosen.line + '_lv' + validLow[0];
            if (exactLowId !== slot1Id && exactLowId !== slot2Id) {
                return exactLowId;
            }
        }
        if (chosen.hasLv1Pair) {
            var lv2Id = chosen.line + '_lv2';
            if (lv2Id !== slot1Id && lv2Id !== slot2Id) return lv2Id;
        }
    }

    // 3. Fallback khi bàn cờ đang trống:
    if (fallbackId && scan.activeLines.indexOf(itemLine(fallbackId)) !== -1 && fallbackId !== slot1Id && fallbackId !== slot2Id) {
        return fallbackId;
    }
    var remLines = scan.activeLines.filter(function (ln) { return ln !== slot1Line && ln !== slot2Line; });
    if (!remLines.length) remLines = scan.activeLines.filter(function (ln) { return ln !== slot1Line; });
    if (!remLines.length) remLines = scan.activeLines;
    var pickLn3 = remLines[orderNum % remLines.length];
    var defLv3 = (orderNum <= 12) ? 2 : 3;
    return pickLn3 + '_lv' + defLv3;
}

// Tạo nhóm đơn hàng Lai (Hybrid Order Group):
// - Slot 1: Cố định 100% từ GAME_CONFIG.curatedOrders[orderNum][0] (kèm bảo vệ chống kẹt khi người chơi lỡ ghép vượt cấp)
// - Slot 2: Động 100% quét bàn cờ (Món Vừa Lv.2 -> Lv.6: Teasing / Serendipity / Hấp thụ đồ ghép lỡ tay)
// - Slot 3: Động 100% quét bàn cờ (Món Dễ Lv.2 -> Lv.4 / Van xả Giải cứu khi bàn đầy)
function getCuratedOrderGroup(orderNum, petId, board, existingIds) {
    if (typeof GAME_CONFIG === 'undefined' || !GAME_CONFIG.curatedOrders) return null;
    var list = GAME_CONFIG.curatedOrders[orderNum];
    if (!Array.isArray(list) || list.length === 0) return null;

    var pId = petId || 'character01';
    var b = board || (typeof boardData !== 'undefined' ? boardData : null);
    var hCfg = getHybridOrderConfig();
    var activeGens = getActiveGeneratorsForOrders(b);

    var rawSlot1 = (typeof list[0] === 'string') ? list[0] : (list[0].id || list[0]);
    var rawSlot2 = list[1] ? ((typeof list[1] === 'string') ? list[1] : (list[1].id || list[1])) : null;
    var rawSlot3 = list[2] ? ((typeof list[2] === 'string') ? list[2] : (list[2].id || list[2])) : null;

    var slot1Id = rawSlot1;

    // Đảm bảo Slot 1 luôn thuộc máy phát ĐANG ĐẶT TRÊN BÀN CHƠI (nếu người chơi chưa đạt Lv.4/Lv.5 hoặc chưa kéo Ba Lô / Thùng Đồ vào bàn):
    var s1ReqGen = getGeneratorForLine(itemLine(slot1Id));
    if (activeGens.indexOf(s1ReqGen) === -1) {
        var activeLinesForS1 = [];
        activeGens.forEach(function (gId) {
            (GENERATOR_BRANCH_MAP[gId] || []).forEach(function (ln) {
                if (activeLinesForS1.indexOf(ln) === -1) activeLinesForS1.push(ln);
            });
        });
        if (!activeLinesForS1.length) activeLinesForS1 = ['ban', 'ghe', 'trai'];
        var fallbackLine = activeLinesForS1[(orderNum + 1) % activeLinesForS1.length];
        slot1Id = fallbackLine + '_lv' + itemLv(slot1Id);
    }

    // Bảo vệ chống kẹt cho Slot 1: Nếu người chơi không có món cấp L mà đã lỡ tay ghép sẵn lên cấp L+1 trên bàn, nhận luôn L+1!
    if (hCfg.enabled && hCfg.slot1OverMergeProtection) {
        var scan0 = scanBoardForDynamicOrders(b, existingIds || [], activeGens);
        var s1Line = itemLine(slot1Id);
        var s1Lv = itemLv(slot1Id);
        var st1 = scan0.byBranch[s1Line];
        if (st1 && !(st1.byLv[s1Lv] > 0) && (st1.byLv[s1Lv + 1] > 0)) {
            slot1Id = s1Line + '_lv' + (s1Lv + 1);
        }
    }

    var slot2Id = rawSlot2;
    var slot3Id = rawSlot3;

    if (hCfg.enabled) {
        slot2Id = pickDynamicSlot2Item(b, slot1Id, orderNum, rawSlot2, existingIds, activeGens);
        if ( rawSlot3 ) {
            slot3Id = pickDynamicSlot3Item(b, slot1Id, slot2Id, orderNum, rawSlot3, existingIds, activeGens);
        }
    }

    var finalIds = [slot1Id, slot2Id, slot3Id].filter(Boolean);
    var orders = finalIds.map(function (itemId, sIdx) {
        var slotName = (sIdx === 0) ? 'hard' : ((sIdx === 1) ? 'medium' : 'easy');
        var goldRw = (typeof orderReward === 'function') ? orderReward(itemId) : 50;
        var expRw = (typeof orderExp === 'function') ? orderExp(itemId) : 15;
        return {
            id: itemId,
            done: false,
            gold: goldRw,
            exp: expRw,
            petId: pId,
            stashed: false,
            slotType: slotName,
            isDynamic: sIdx > 0
        };
    });

    return {
        petId: pId,
        orderNum: orderNum,
        isHybrid: true,
        orders: orders
    };
}

// Tự động thích ứng trực tiếp (Live Adaptation) cho nhóm đơn đang hiển thị trên màn hình:
// 1. Якщо người chơi lỡ tay ghép vượt 1 cấp so với món đơn đang yêu cầu (và không còn món cấp cũ), đơn tự nâng lên nhận món vừa ghép!
// 2. Khi bàn cờ chạm ngưỡng nguy hiểm (>= 90% đầy hoặc <= 2 ô trống) mà chưa có món nào giao được, Slot 3 tự động chuyển sang
//    "Chế độ Giải cứu" - nhận ngay 1 món cấp thấp đang nằm sẵn trên bàn cờ để giải phóng chỗ trống!
function applyLiveHybridAdaptations(group, orderNum, board) {
    if (!group || !Array.isArray(group.orders) || !group.orders.length) return group;
    var hCfg = getHybridOrderConfig();
    if (!hCfg.enabled) return group;

    var b = board || (typeof boardData !== 'undefined' ? boardData : null);
    var activeGens = getActiveGeneratorsForOrders(b);
    var scan = scanBoardForDynamicOrders(b, [], activeGens);

    // 1. Kiểm tra lỡ tay ghép vượt cấp (Over-merge Protection):
    if (hCfg.slot1OverMergeProtection) {
        group.orders.forEach(function (o) {
            if (!o || o.stashed || !o.id) return;
            var ln = itemLine(o.id);
            var lv = itemLv(o.id);
            var st = scan.byBranch[ln];
            if (st && !(st.byLv[lv] > 0) && (st.byLv[lv + 1] > 0)) {
                var nextId = ln + '_lv' + (lv + 1);
                var alreadyInGroup = group.orders.some(function (other) { return other !== o && other.id === nextId; });
                if (!alreadyInGroup) {
                    o.id = nextId;
                    o.gold = (typeof orderReward === 'function') ? orderReward(nextId) : o.gold;
                    o.exp = (typeof orderExp === 'function') ? orderExp(nextId) : o.exp;
                }
            }
        });
    }

    // 2. Van xả áp suất tức thời (Live Rescue Mode) ở Slot 3 khi bàn cờ đầy >= 90%:
    if (scan.isLiveRescueMode && group.orders.length >= 3) {
        var slot3 = group.orders[2];
        var anyUnstashedReady = group.orders.some(function (o) {
            if (!o || o.stashed || !o.id) return false;
            var st = scan.byBranch[itemLine(o.id)];
            return st && (st.byLv[itemLv(o.id)] > 0);
        });
        if (!anyUnstashedReady && slot3 && !slot3.stashed) {
            var rescueId = pickDynamicSlot3Item(b, group.orders[0].id, group.orders[1].id, orderNum || 1, slot3.id, [], activeGens);
            if (rescueId && rescueId !== slot3.id) {
                slot3.id = rescueId;
                slot3.gold = (typeof orderReward === 'function') ? orderReward(rescueId) : slot3.gold;
                slot3.exp = (typeof orderExp === 'function') ? orderExp(rescueId) : slot3.exp;
                slot3.isRescue = true;
            }
        }
    }

    return group;
}

function generateStartingOrders(playerLevel) {
    var pLv = Math.max(1, parseInt(playerLevel, 10) || 1);
    var currentOrderNum = (typeof SAVE !== 'undefined' && SAVE && typeof SAVE.totalOrdersDelivered === 'number')
        ? (SAVE.totalOrdersDelivered + 1)
        : 1;
    var curated = (typeof getCuratedOrderGroup === 'function') ? getCuratedOrderGroup(currentOrderNum, 'character01') : null;
    if (curated && curated.orders) return curated.orders;

    var hist = (typeof SAVE !== 'undefined' && Array.isArray(SAVE.recentOrdersHistory)) ? SAVE.recentOrdersHistory.slice(-15) : [];
    var grp = generatePetOrderGroup('character01', pLv, [], hist, 3);
    return (grp && grp.orders) ? grp.orders : [];
}

// Đảm bảo luôn có tối đa 2 thú cưng đặt đơn hàng trên màn hình (áp dụng Hệ thống Nhiệm vụ Lai)
function ensurePetOrderGroups(playerLevel) {
    if (typeof SAVE === 'undefined' || !SAVE) return [];
    if (!Array.isArray(SAVE.petOrderGroups)) SAVE.petOrderGroups = [];

    var owned = (Array.isArray(SAVE.ownedPets) && SAVE.ownedPets.length > 0)
        ? SAVE.ownedPets.slice()
        : ['character01'];

    var maxPets = Math.min(2, owned.length);
    var existingIds = [];
    var hist15 = Array.isArray(SAVE.recentOrdersHistory) ? SAVE.recentOrdersHistory.slice(-15) : [];
    var b = (typeof boardData !== 'undefined' && boardData && boardData.length) ? boardData : null;
    var activeGens = (typeof getActiveGeneratorsForOrders === 'function') ? getActiveGeneratorsForOrders(b) : ['generator_cooler'];

    // Số thứ tự đơn hàng hiện tại của người chơi (bắt đầu từ 1)
    var currentOrderNum = (SAVE.totalOrdersDelivered || 0) + 1;

    // 1. Đồng bộ / kiểm tra thích ứng trực tiếp (Live Hybrid Adaptation) cho các nhóm đơn hiện có
    SAVE.petOrderGroups = SAVE.petOrderGroups.map(function (g, gIdx) {
        if (!g || !Array.isArray(g.orders) || g.orders.length === 0) return null;
        // Phục hồi các slot từng bị đánh dấu stashed ảo do lỗi khớp nhầm ô đá trước đây
        g.orders.forEach(function (o) {
            if (o && o.stashed && !o.stashedVerified) {
                o.stashed = false;
            }
        });
        var hasStashed = g.orders.some(function (o) { return o && o.stashed; });
        var targetOrderNum = currentOrderNum + gIdx;

        // Kiểm tra xem nhóm đơn có chứa nhánh thuộc máy phát chưa mở không
        var hasDisallowedGen = !hasStashed && g.orders.some(function (o) {
            if (!o || !o.id) return false;
            var line = o.id.split('_lv')[0];
            var gId = getGeneratorForLine(line);
            return activeGens.indexOf(gId) === -1;
        });

        // Kiểm tra xem Slot 1 (Main Quest) có khớp với định hướng của curatedOrders[targetOrderNum] không
        var curatedList = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.curatedOrders) ? GAME_CONFIG.curatedOrders[targetOrderNum] : null;
        var expectedSlot1 = (Array.isArray(curatedList) && curatedList[0])
            ? ((typeof curatedList[0] === 'string') ? curatedList[0] : curatedList[0].id)
            : null;
        var currentSlot1 = (g.orders[0] && g.orders[0].id) ? g.orders[0].id : null;
        var isSameSlot1Line = expectedSlot1 && currentSlot1 && (itemLine(expectedSlot1) === itemLine(currentSlot1));

        if (!hasStashed && (hasDisallowedGen || (expectedSlot1 && !isSameSlot1Line))) {
            var rebuilt = getCuratedOrderGroup(targetOrderNum, g.petId, b, existingIds);
            if (rebuilt) {
                rebuilt.orders.forEach(function (o) { if (o && o.id) existingIds.push(o.id); });
                return rebuilt;
            }
            if (hasDisallowedGen) {
                var fallbackGrp = generatePetOrderGroup(g.petId, playerLevel, existingIds, hist15);
                fallbackGrp.orders.forEach(function (o) { if (o && o.id) existingIds.push(o.id); });
                return fallbackGrp;
            }
        }

        // Áp dụng cơ chế Bảo vệ lỡ tay ghép vượt cấp & Van xả Giải cứu tức thời khi bàn đầy >= 90%
        applyLiveHybridAdaptations(g, targetOrderNum, b);

        g.orders.forEach(function (o) { if (o && o.id) existingIds.push(o.id); });
        return g;
    }).filter(Boolean);

    // 2. Nếu còn thiếu nhóm thú cưng (ví dụ mới vào game hoặc vừa nộp xong), sinh đơn mới theo Hệ thống Nhiệm vụ Lai:
    while (SAVE.petOrderGroups.length < maxPets) {
        var activePetIds = SAVE.petOrderGroups.map(function (g) { return g.petId; });
        var candidates = owned.filter(function (p) { return activePetIds.indexOf(p) === -1; });
        var chosenPet = candidates.length > 0 ? candidates[0] : owned[SAVE.petOrderGroups.length % owned.length];

        var nextOrderNum = currentOrderNum + SAVE.petOrderGroups.length;
        var nextGroup = getCuratedOrderGroup(nextOrderNum, chosenPet, b, existingIds);
        if (!nextGroup) {
            // Sau khi hết 63 đơn tính trước: Slot 1 sinh theo cấp cao nhất đã khám phá, Slot 2 & 3 tiếp tục quét bàn cờ!
            var autoGrp = generatePetOrderGroup(chosenPet, playerLevel, existingIds, hist15);
            if (autoGrp && Array.isArray(autoGrp.orders) && autoGrp.orders.length >= 3) {
                var s1 = autoGrp.orders[0].id;
                var s2 = pickDynamicSlot2Item(b, s1, nextOrderNum, autoGrp.orders[1].id, existingIds, activeGens);
                var s3 = pickDynamicSlot3Item(b, s1, s2, nextOrderNum, autoGrp.orders[2].id, existingIds, activeGens);
                autoGrp.orders[1].id = s2;
                autoGrp.orders[1].gold = (typeof orderReward === 'function') ? orderReward(s2) : autoGrp.orders[1].gold;
                autoGrp.orders[1].exp = (typeof orderExp === 'function') ? orderExp(s2) : autoGrp.orders[1].exp;
                autoGrp.orders[2].id = s3;
                autoGrp.orders[2].gold = (typeof orderReward === 'function') ? orderReward(s3) : autoGrp.orders[2].gold;
                autoGrp.orders[2].exp = (typeof orderExp === 'function') ? orderExp(s3) : autoGrp.orders[2].exp;
            }
            nextGroup = autoGrp;
        }

        SAVE.petOrderGroups.push(nextGroup);
        nextGroup.orders.forEach(function (o) { existingIds.push(o.id); });
    }

    return SAVE.petOrderGroups;
}

// Phá vỡ khối đá viền gần tâm nhất để mở rộng bàn cờ khi người chơi thăng cấp
function unlockNextOrganicRock(board) {
    if (!board || !board.length) return -1;
    var candidates = [];
    for (var i = 0; i < TOTAL_CELLS; i++) {
        var c = board[i];
        if (c && c.isRock) {
            // Kiểm tra có ít nhất 1 ô láng giềng đã mở (không phải đá)
            var r = Math.floor(i / COLS), col = i % COLS;
            var nbs = [];
            if (r > 0) nbs.push(i - COLS);
            if (r < ROWS - 1) nbs.push(i + COLS);
            if (col > 0) nbs.push(i - 1);
            if (col < COLS - 1) nbs.push(i + 1);
            
            var hasOpenNeighbor = nbs.some(function (nIdx) {
                return board[nIdx] && !board[nIdx].isRock;
            });
            if (hasOpenNeighbor) {
                var dist = Math.abs(r - 4) + Math.abs(col - 3);
                candidates.push({ idx: i, dist: dist });
            }
        }
    }
    if (!candidates.length) return -1;
    candidates.sort(function (a, b) { return a.dist - b.dist; });
    var minDist = candidates[0].dist;
    var bests = candidates.filter(function (cand) { return cand.dist === minDist; });
    var chosen = bests[Math.floor(Math.random() * bests.length)].idx;
    
    // Mở khóa ô đá thành ô trống
    board[chosen] = makeEmptyCell();
    return chosen;
}

// Sinh nguồn phát mới lên bàn cờ khi mở khóa ở các cột mốc Level (Lv.5 Ba Lô, Lv.10 Thùng Bếp)
function spawnNewGeneratorOnBoard(genId, board) {
    if (!board || !board.length) return -1;
    var empties = getEmptyIndexes(board);
    if (empties.length > 0) {
        empties.sort(function (a, b) {
            var ra = Math.floor(a / COLS), ca = a % COLS;
            var rb = Math.floor(b / COLS), cb = b % COLS;
            return (Math.abs(ra - 4) + Math.abs(ca - 3)) - (Math.abs(rb - 4) + Math.abs(cb - 3));
        });
        var targetCell = empties[0];
        board[targetCell] = { id: genId, isRock: false, isLocked: false };
        return targetCell;
    }
    return -1;
}

// ==========================================
// CƠ CHẾ KHÁM PHÁ LỚP ĐÁ & MẠNG NHỆN (ROCK LAYERS & DYNAMIC EXPANSION)
// - Vật phẩm ẩn dưới đá có cấp tăng dần theo từng tầng đá từ trong ra ngoài (cứ 1 lớp tăng 1 cấp).
// - Các vật phẩm tăng cấp bất ngờ (Surprise items) ẩn rải rác dưới đá mang lại cảm giác hứng khởi.
// - Người chơi ghép phá ô nhện thì các ô đá liền kề (4 hướng) sẽ tự động nứt vỡ thành ô nhện mới.
// ==========================================

// Tính khoảng cách tầng cố định (BFS Layer) từ vùng mở/nhện ban đầu ra các lớp đá phía ngoài:
// - Tầng 1: Vòng đá sát vùng nhện trung tâm
// - Tầng 2: Vòng đá trung gian
// - Tầng 3: Vòng đá rìa ngoài (Hàng 0, Hàng 7 và viền cột 0/6)
// - Tầng 4: Các góc xa nhất và toàn bộ Hàng 8 dưới đáy bàn cờ
function computeRockLayers(board) {
    var dist = new Array(TOTAL_CELLS).fill(-1);
    var queue = [];
    var cfgRocks = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.initialBoard && Array.isArray(GAME_CONFIG.initialBoard.rocks))
        ? new Set(GAME_CONFIG.initialBoard.rocks)
        : null;

    for (var i = 0; i < TOTAL_CELLS; i++) {
        var isInitialCenterOrWeb = cfgRocks ? !cfgRocks.has(i) : (!board || !board[i] || !board[i].isRock);
        if (isInitialCenterOrWeb) {
            dist[i] = 0;
            queue.push(i);
        }
    }
    while (queue.length > 0) {
        var u = queue.shift();
        getOrthogonalNeighbors(u).forEach(function (v) {
            if (dist[v] === -1) {
                dist[v] = dist[u] + 1;
                queue.push(v);
            }
        });
    }

    // Đảm bảo toàn bộ viền ngoài của bàn cờ 7x9 luôn thuộc Tầng 3 và Tầng 4 để người chơi không thể mở thông ra sát mép sớm
    for (var idx = 0; idx < TOTAL_CELLS; idx++) {
        if (dist[idx] <= 0) continue;
        var r = Math.floor(idx / COLS);
        var c = idx % COLS;
        if (r === 8 || ((r === 0 || r === 7) && (c === 0 || c === 6))) {
            dist[idx] = Math.max(dist[idx], 4);
        } else if (r === 0 || r === 7 || ((c === 0 || c === 6) && (r <= 2 || r >= 5))) {
            dist[idx] = Math.max(dist[idx], 3);
        }
    }
    return dist;
}

// Đảm bảo chỉ có Xe Kéo ('generator_cooler') luôn hiện diện trên bàn cờ từ đầu:
// - Ba Lô ('generator_backpack') và Thùng Đồ ('generator_crate') KHÔNG tự động đặt lên bàn cờ hay giấu dưới đá nữa.
// - Khi người chơi đạt Level 4 (Ba Lô) và Level 5 (Thùng Đồ), máy phát sẽ hiện ở icon bên trái chú chó để người chơi tự kéo vào bàn!
function ensureAllGeneratorsOnBoard(board, orders) {
    if (!board || !board.length) return;

    // 1. Dọn sạch mọi ô đá cũ từng giấu máy phát ở phiên bản trước (biến thành ô đá thường)
    //    Đồng thời giữ nguyên các máy phát mà người chơi đã tự kéo vào bàn cờ ở trạng thái mở khóa.
    var hasCooler = false;
    for (var i = 0; i < board.length; i++) {
        var c = board[i];
        if (!c || !c.id || !GENERATORS[c.id]) continue;
        if (c.isRock || c.isLocked) {
            if (c.id === 'generator_cooler') {
                c.isRock = false;
                c.isLocked = false;
                c.isGeneratorRock = false;
                hasCooler = true;
            } else {
                // Xóa máy phát ẩn dưới đá để không tự lộ trên bàn cờ
                board[i] = { id: null, isRock: true, isLocked: false };
            }
        } else {
            c.isGeneratorRock = false;
            if (c.id === 'generator_cooler') hasCooler = true;
        }
    }

    // 2. Nếu vì lý do nào đó Xe Kéo ('generator_cooler') bị thiếu trên bàn cờ, đặt lại vào ô 24 (hoặc ô trống gần nhất)
    if (!hasCooler) {
        var targetCell = 24;
        if (board[targetCell] && board[targetCell].id && GENERATORS[board[targetCell].id]) {
            var empties = getEmptyIndexes(board);
            targetCell = empties.length > 0 ? empties[0] : 24;
        } else if (board[targetCell] && board[targetCell].id && !board[targetCell].isRock && !board[targetCell].isLocked) {
            var empties2 = getEmptyIndexes(board);
            if (empties2.length > 0 && empties2[0] !== targetCell) {
                board[empties2[0]] = board[targetCell];
            }
        }
        board[targetCell] = {
            id: 'generator_cooler',
            isRock: false,
            isLocked: false,
            isGeneratorRock: false
        };
    }

    // 3. Đồng bộ lại các đơn hàng đang hiển thị: nếu có đơn hàng nào yêu cầu nhánh của máy phát CHƯA ĐẶT TRÊN BÀN,
    //    tự động chuyển món đó sang nhánh thuộc máy phát đang có trên bàn cờ để người chơi không bao giờ bị kẹt!
    var activeGens = getActiveGeneratorsForOrders(board);
    var activeLines = [];
    activeGens.forEach(function (gId) {
        (GENERATOR_BRANCH_MAP[gId] || []).forEach(function (ln) {
            if (activeLines.indexOf(ln) === -1) activeLines.push(ln);
        });
    });
    if (!activeLines.length) activeLines = ['ban', 'ghe', 'trai'];

    if (typeof SAVE !== 'undefined' && SAVE && Array.isArray(SAVE.petOrderGroups)) {
        SAVE.petOrderGroups.forEach(function (g) {
            if (g && Array.isArray(g.orders)) {
                g.orders.forEach(function (o, sIdx) {
                    if (o && o.id && !o.stashed) {
                        var reqGen = getGeneratorForLine(itemLine(o.id));
                        if (activeGens.indexOf(reqGen) === -1) {
                            var newLn = activeLines[sIdx % activeLines.length];
                            var newId = newLn + '_lv' + itemLv(o.id);
                            o.id = newId;
                            if (typeof orderReward === 'function') o.gold = orderReward(newId);
                            if (typeof orderExp === 'function') o.exp = orderExp(newId);
                        }
                    }
                });
            }
        });
    }
}

// Phân bổ vật phẩm ẩn dưới các lớp đá:
// - Tầng đá 1 & 2 (vòng trong): Chỉ sinh các nhánh thuộc máy phát ĐANG ĐẶT TRÊN BÀN CHƠI (chia đều 1/3 : 1/3 : 1/3), cấp Lv.2 -> Lv.4
//   để người chơi mở rộng vùng trung tâm vừa đủ.
// - Tầng đá 3 & 4 (vòng ngoài & rìa bàn cờ): Trộn đều TẤT CẢ 9 NHÁNH của cả 3 máy phát (Xe Kéo + Ba Lô + Thùng Đồ) theo tỷ lệ bằng nhau (1/9 mỗi nhánh),
//   kèm cấp độ cao (Lv.4 -> Lv.7) để chặn việc người chơi phá mở rộng toàn bộ bàn cờ quá sớm khi chưa mở khóa đủ máy phát!
function populateRockHiddenItems(board, forceReassign) {
    if (!board || !board.length) return;
    var activeGens = (typeof getActiveGeneratorsForOrders === 'function')
        ? getActiveGeneratorsForOrders(board)
        : ['generator_cooler'];

    var activeLines = [];
    activeGens.forEach(function (gId) {
        var branches = GENERATOR_BRANCH_MAP[gId] || [];
        branches.forEach(function (ln) {
            if (activeLines.indexOf(ln) === -1) activeLines.push(ln);
        });
    });
    if (!activeLines.length) activeLines = ['ban', 'ghe', 'trai'];

    // Danh sách đầy đủ 9 nhánh của cả 3 máy phát (dùng cho Tầng đá 3 và Tầng đá 4)
    var allNineLines = ['an', 'cafe', 'congcu', 'tham', 'antoan', 'bep', 'ban', 'ghe', 'trai'];

    var dist = computeRockLayers(board);

    // Thu thập các ô đá chưa có vật phẩm ẩn (hoặc khi khởi tạo bàn cờ mới)
    var innerRocks = []; // Tầng 1 & 2
    var outerRocks = []; // Tầng 3 & 4+
    var innerLineCounts = {};
    var outerLineCounts = {};
    activeLines.forEach(function (l) { innerLineCounts[l] = 0; });
    allNineLines.forEach(function (l) { outerLineCounts[l] = 0; });

    for (var i = 0; i < TOTAL_CELLS; i++) {
        var c = board[i];
        if (!c || !c.isRock) continue;
        var layer = Math.max(1, dist[i] || 1);

        // Nếu ô đá đã được gán vật phẩm ẩn hợp lệ trước đó và không ép tạo lại -> giữ nguyên để không làm xáo trộn tầng đá!
        if (!forceReassign && c.id && !GENERATORS[c.id] && c.rockLayer) {
            var existingLn = itemLine(c.id);
            if (layer <= 2) {
                if (innerLineCounts[existingLn] != null) innerLineCounts[existingLn]++;
            } else {
                if (outerLineCounts[existingLn] != null) outerLineCounts[existingLn]++;
            }
            continue;
        }

        if (layer <= 2) {
            innerRocks.push({ idx: i, layer: layer });
        } else {
            outerRocks.push({ idx: i, layer: layer });
        }
    }

    innerRocks.sort(function (a, b) { return (a.layer - b.layer) || (a.idx - b.idx); });
    outerRocks.sort(function (a, b) { return (a.layer - b.layer) || (a.idx - b.idx); });

    // 1. Gán vật phẩm cho Tầng đá 1 & 2 (chia đều giữa các nhánh của máy phát đang có trên bàn)
    innerRocks.forEach(function (item, k) {
        var idx = item.idx;
        var d = item.layer;
        var minCount = Math.min.apply(null, activeLines.map(function (l) { return innerLineCounts[l]; }));
        var candidateLines = activeLines.filter(function (l) { return innerLineCounts[l] === minCount; });
        var chosenLine = candidateLines[(k * 3 + d) % candidateLines.length];
        innerLineCounts[chosenLine]++;

        var baseLv = (d === 1) ? (2 + (k % 2)) : (3 + (k % 2)); // Tầng 1: Lv.2-3 | Tầng 2: Lv.3-4
        var isSurprise = (d === 2) && (((idx * 37 + d * 13) % 100) < 15);
        var itemLevel = isSurprise ? Math.min(5, baseLv + 1) : baseLv;
        var reqUnlockLv = getRockUnlockLevel(idx, board[idx]);

        board[idx] = {
            id: chosenLine + '_lv' + itemLevel,
            isRock: true,
            isLocked: false,
            isSurprise: isSurprise,
            rockLayer: d,
            rockUnlockLevel: reqUnlockLv
        };
    });

    // 2. Gán vật phẩm cho Tầng đá 3 & 4 (trộn đều cả 9 nhánh của 3 máy phát theo tỷ lệ bằng nhau 1/9 mỗi nhánh)
    outerRocks.forEach(function (item, k) {
        var idx = item.idx;
        var d = item.layer;
        var minCount = Math.min.apply(null, allNineLines.map(function (l) { return outerLineCounts[l]; }));
        var candidateLines = allNineLines.filter(function (l) { return outerLineCounts[l] === minCount; });
        var chosenLine = candidateLines[(k * 5 + d) % candidateLines.length];
        outerLineCounts[chosenLine]++;

        // Tầng 3: Lv.4 - Lv.5 (Ô bất ngờ Lv.6) | Tầng 4+: Lv.6 - Lv.7
        var baseLv = (d === 3) ? (4 + (k % 2)) : (6 + (k % 2));
        var isSurprise = (((idx * 37 + d * 13) % 100) < 15);
        var itemLevel = isSurprise ? Math.min(7, baseLv + 1) : baseLv;
        var reqUnlockLv2 = getRockUnlockLevel(idx, board[idx]);

        board[idx] = {
            id: chosenLine + '_lv' + itemLevel,
            isRock: true,
            isLocked: false,
            isSurprise: isSurprise,
            rockLayer: d,
            rockUnlockLevel: reqUnlockLv2
        };
    });
}

// Khi người chơi ghép mở ô nhện, các ô đá liền kề (4 hướng) tự động nứt vỡ thành ô mạng nhện mới.
// Lưu ý: Các ô đá có biểu tượng khóa (board_cell_rock_lock.png) mà người chơi chưa đủ Level sẽ KHÔNG bị mạng nhện phá!
function revealAdjacentRocksAsWebs(board, brokenWebIndices) {
    if (!Array.isArray(brokenWebIndices) || !brokenWebIndices.length) return [];
    populateRockHiddenItems(board);
    var pLv = (typeof SAVE !== 'undefined' && SAVE && typeof SAVE.playerLevel === 'number') ? SAVE.playerLevel : 1;
    var revealed = [];

    brokenWebIndices.forEach(function (wIdx) {
        getOrthogonalNeighbors(wIdx).forEach(function (nIdx) {
            var c = board[nIdx];
            if (c && c.isRock) {
                // Nếu ô đá đang bị khóa theo Level và người chơi chưa đạt đủ Level -> mạng nhện không phá được!
                if (isRockCellLockedByLevel(nIdx, c, pLv)) {
                    return;
                }
                c.rockUnlockLevel = 0;
                c.isRock = false;
                c.isLocked = true;
                if (revealed.indexOf(nIdx) === -1) {
                    revealed.push(nIdx);
                }
            }
        });
    });
    return revealed;
}

// Kiểm tra và mở khóa các ô đá khóa (board_cell_rock_lock.png) khi người chơi thăng cấp đạt mốc (Lv.3, 5, 7, 11, 15, 18):
// - Gỡ bỏ ổ khóa trên các ô đá có rockUnlockLevel <= playerLv.
// - Nếu ô đá vừa mở khóa đang nằm sát cạnh một ô trống/mở sẵn (ví dụ ô 22, 26, 33 cạnh vùng tâm),
//   tự động nứt thành mạng nhện ngay để người chơi có thể ghép mở tiếp!
function checkAndUnlockRocksByPlayerLevel(board, playerLv) {
    if (!board || !board.length) return [];
    populateRockHiddenItems(board);
    var pLv = (typeof playerLv === 'number' && playerLv > 0)
        ? playerLv
        : ((typeof SAVE !== 'undefined' && SAVE && typeof SAVE.playerLevel === 'number') ? SAVE.playerLevel : 1);

    var unlockedIndices = [];
    for (var i = 0; i < TOTAL_CELLS; i++) {
        var c = board[i];
        if (!c || !c.isRock) continue;
        var reqLv = getRockUnlockLevel(i, c);
        if (reqLv > 0 && pLv >= reqLv) {
            c.rockUnlockLevel = 0;
            // Kiểm tra xem ô đá vừa mở khóa có nằm sát cạnh ô đã mở (không phải đá, không phải nhện) không
            var touchesOpenCell = getOrthogonalNeighbors(i).some(function (nIdx) {
                var nb = board[nIdx];
                return nb && !nb.isRock && !nb.isLocked;
            });
            if (touchesOpenCell) {
                c.isRock = false;
                c.isLocked = true;
            }
            unlockedIndices.push(i);
        }
    }
    return unlockedIndices;
}

if (typeof window !== 'undefined') {
    window.computeRockLayers = computeRockLayers;
    window.populateRockHiddenItems = populateRockHiddenItems;
    window.revealAdjacentRocksAsWebs = revealAdjacentRocksAsWebs;
    window.getRockUnlockLevel = getRockUnlockLevel;
    window.isRockCellLockedByLevel = isRockCellLockedByLevel;
    window.checkAndUnlockRocksByPlayerLevel = checkAndUnlockRocksByPlayerLevel;
    window.ensureAllGeneratorsOnBoard = ensureAllGeneratorsOnBoard;
    window.getActiveGeneratorsForOrders = getActiveGeneratorsForOrders;
    window.getPendingDockGenerators = getPendingDockGenerators;
    window.checkAndUnlockGeneratorsByMilestone = checkAndUnlockGeneratorsByMilestone;
    window.GENERATOR_BRANCH_MAP = GENERATOR_BRANCH_MAP;
    window.getGeneratorForLine = getGeneratorForLine;
    window.getMaxDiscoveredLevelForLine = getMaxDiscoveredLevelForLine;
    window.scanBoardForDynamicOrders = scanBoardForDynamicOrders;
    window.pickDynamicSlot2Item = pickDynamicSlot2Item;
    window.pickDynamicSlot3Item = pickDynamicSlot3Item;
    window.applyLiveHybridAdaptations = applyLiveHybridAdaptations;
    window.getCuratedOrderGroup = getCuratedOrderGroup;
    window.generatePetOrderGroup = generatePetOrderGroup;
    window.ensurePetOrderGroups = ensurePetOrderGroups;
}
