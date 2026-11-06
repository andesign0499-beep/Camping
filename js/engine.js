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

function itemLine(id) { return id ? id.split('_lv')[0] : ''; }
function itemLv(id) { return id ? (parseInt(id.split('_lv')[1], 10) || 1) : 1; }
var itemLevel = itemLv;

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
var genBagMatchKey = {};
var genLastSpawnItem = {};
var lastSpawnResult = { target: -1, id: null, line: null, wasUnwanted: false };

function resetGeneratorPity() {
    genOffOrderStreak = {};
    genSpawnBags = {};
    genBagMatchKey = {};
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
        // Ưu tiên chia tỷ lệ theo các item có trên bảng nhiệm vụ:
        // - Nếu trên bảng nhiệm vụ có 1 item thuộc máy phát: tỷ lệ sinh ra nhánh đó là 80% (8/10 món trong túi).
        // - Nếu có 2 item thuộc máy phát: mỗi item 40% (4/10 món trong túi, tổng 8 món), nhánh còn lại 20% (2/10 món).
        // - Nếu có cả 3 item (hoặc không có item nào): chia đều cả 3 (2 món mỗi nhánh = 6 món, 33.33% mỗi nhánh).
        var ordersToCheck = (Array.isArray(activeOrders) && activeOrders.length)
            ? activeOrders
            : ((typeof currentOrders !== 'undefined' && Array.isArray(currentOrders)) ? currentOrders : []);
        if (!ordersToCheck.length && typeof SAVE !== 'undefined' && SAVE && Array.isArray(SAVE.petOrderGroups) && SAVE.petOrderGroups.length) {
            ordersToCheck = (SAVE.petOrderGroups[0] && Array.isArray(SAVE.petOrderGroups[0].orders)) ? SAVE.petOrderGroups[0].orders : [];
        }

        // Đếm các vật phẩm khả dụng đang có sẵn trên bàn cờ (không bị khóa nhện, không phải đá, không phải máy phát)
        var availableBoardItems = {};
        if (board && board.length) {
            board.forEach(function (c) {
                if (c && c.id && !c.isLocked && !c.isRock && !GENERATORS[c.id]) {
                    availableBoardItems[c.id] = (availableBoardItems[c.id] || 0) + 1;
                }
            });
        }

        var neededLines = [];
        ordersToCheck.forEach(function (o) {
            if (!o || o.done || !o.id) return;

            // Kiểm tra xem món này đã có dấu tick (đã thực thi xong / đã có sẵn trên bàn cờ hoặc stashed) chưa
            var hasTick = false;
            if (o.stashed) {
                hasTick = true;
            } else if (availableBoardItems[o.id] && availableBoardItems[o.id] > 0) {
                hasTick = true;
                availableBoardItems[o.id]--; // Trừ đi để nếu có 2 nhiệm vụ cùng món thì tính chuẩn xác
            }

            // Nếu món ĐÃ CÓ DẤU TICK: máy phát trừ món đó ra không đếm vì lúc này người chơi không cần phát ra món đó nữa!
            // Nếu người chơi ghép thêm làm mất dấu tick đi: hasTick thành false và món đó lại được cộng lại vào danh sách cần!
            if (!hasTick) {
                var ln = itemLine(o.id);
                if (ln && neededLines.indexOf(ln) === -1) {
                    neededLines.push(ln);
                }
            }
        });

        var genLines = list.map(function (baseId) { return itemLine(baseId); });
        var matchLines = genLines.filter(function (ln) { return neededLines.indexOf(ln) !== -1; });
        var nonMatchLines = genLines.filter(function (ln) { return neededLines.indexOf(ln) === -1; });

        // Tự động làm mới túi xáo trộn ngay khi danh sách nhánh nhiệm vụ của máy phát này thay đổi
        var matchKey = matchLines.slice().sort().join(',');
        if (genBagMatchKey[genId] !== matchKey) {
            genBagMatchKey[genId] = matchKey;
            genSpawnBags[genId] = null;
        }

        var bag = genSpawnBags[genId];
        if (!Array.isArray(bag) || bag.length === 0) {
            bag = [];
            var itemByLine = {};
            list.forEach(function (baseId) {
                itemByLine[itemLine(baseId)] = baseId;
            });

            if (matchLines.length === 1) {
                // 1 item trên bảng nhiệm vụ: 80% cho nhánh đó, các nhánh còn lại chia đều 20%
                var targetLine = matchLines[0];
                var targetId = itemByLine[targetLine] || list[0];
                for (var i = 0; i < 8; i++) {
                    bag.push(targetId);
                }
                if (nonMatchLines.length === 2) {
                    bag.push(itemByLine[nonMatchLines[0]] || list[1]);
                    bag.push(itemByLine[nonMatchLines[1]] || list[2]);
                } else if (nonMatchLines.length === 1) {
                    bag.push(itemByLine[nonMatchLines[0]]);
                    bag.push(itemByLine[nonMatchLines[0]]);
                } else {
                    bag.push(list[0]);
                    bag.push(list[0]);
                }
            } else if (matchLines.length === 2) {
                // 2 item trên bảng nhiệm vụ: mỗi item 40%, nhánh còn lại 20%
                var targetId1 = itemByLine[matchLines[0]] || list[0];
                var targetId2 = itemByLine[matchLines[1]] || list[1];
                for (var i = 0; i < 4; i++) {
                    bag.push(targetId1);
                }
                for (var j = 0; j < 4; j++) {
                    bag.push(targetId2);
                }
                var otherLine = nonMatchLines[0];
                var otherId = (otherLine && itemByLine[otherLine]) ? itemByLine[otherLine] : list[2];
                bag.push(otherId);
                bag.push(otherId);
            } else {
                // Có cả 3 item (hoặc không có item nào): chia đều cả 3 (mỗi nhánh 2 món = 6 món, 33.33% mỗi nhánh)
                for (var bIdx = 0; bIdx < list.length; bIdx++) {
                    bag.push(list[bIdx]);
                    bag.push(list[bIdx]);
                }
            }

            // Xáo trộn ngẫu nhiên Fisher-Yates
            for (var s = bag.length - 1; s > 0; s--) {
                var rIdx = Math.floor(rand() * (s + 1));
                var tmp = bag[s];
                bag[s] = bag[rIdx];
                bag[rIdx] = tmp;
            }

            // Tránh lặp quá 2 lần liên tiếp cùng 1 món ở điểm nối giữa 2 túi (chỉ áp dụng khi không phải túi tập trung 80% 1 món)
            var lastItem = genLastSpawnItem[genId];
            if (lastItem && bag.length > 1 && bag[0] === lastItem && matchLines.length !== 1) {
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
    if (typeof matchLines !== 'undefined' && matchLines && matchLines.length > 0) {
        wasUnwanted = (matchLines.indexOf(pickedLine) === -1);
    } else {
        wasUnwanted = false;
    }
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
// - Level 7: Thùng Đồ ('generator_crate') xuất hiện bên trái chú chó; chỉ khi người chơi KÉO VÀO BÀN CỜ thì mới tính là đang hoạt động!
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

// Danh sách máy phát đã đủ cấp độ mở khóa (Lv.4 -> Ba Lô, Lv.7 -> Thùng Đồ) nhưng CHƯA được kéo vào bàn cờ:
// Sẽ hiển thị thành icon phát sáng viền bên trái chú chó để người chơi tự tay lôi vào bàn chơi.
function getPendingDockGenerators(board, playerLv) {
    var pLv = (typeof playerLv === 'number' && playerLv > 0)
        ? playerLv
        : ((typeof SAVE !== 'undefined' && SAVE && typeof SAVE.playerLevel === 'number') ? SAVE.playerLevel : 1);

    var unlockLevels = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.initialBoard && GAME_CONFIG.initialBoard.generatorUnlockLevels)
        ? GAME_CONFIG.initialBoard.generatorUnlockLevels
        : { generator_cooler: 1, generator_backpack: 4, generator_crate: 7 };

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
    if (pLv >= (unlockLevels.generator_crate || 7) && !onBoard.has('generator_crate')) {
        pending.push('generator_crate');
    }
    return pending;
}

// Không tự động đặt Ba Lô / Thùng Đồ lên bàn cờ nữa (người chơi tự kéo từ icon bên trái chú chó khi đạt Level 4 và Level 7)
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

function getSlotCandidates(genId, slotType, existingIds, recentItems, orderNum) {
    var branches = GENERATOR_BRANCH_MAP[genId] || ['ban', 'ghe', 'trai'];
    var cands = [];
    var pCap = (typeof getProgressCapForOrder === 'function')
        ? getProgressCapForOrder(orderNum)
        : ((typeof getProgressCap === 'function') ? getProgressCap() : 3);

    branches.forEach(function (b) {
        var lineCap = (typeof getItemMaxLevel === 'function') ? getItemMaxLevel(b) : 12;
        var cap = Math.min(lineCap, pCap);
        if (slotType === 'hard') {
            var hardCap = cap;
            var minHardLv = Math.max(2, hardCap - 2);
            for (var lv = minHardLv; lv <= hardCap; lv++) {
                var id = b + '_lv' + lv;
                if (!cands.some(function (c) { return c.id === id; })) {
                    cands.push({ id: id, line: b, level: lv });
                }
            }
        } else if (slotType === 'medium') {
            var medCap = Math.max(2, Math.min(cap, pCap - 1));
            var minMedLv = Math.max(2, medCap - 2);
            for (var mlv = minMedLv; mlv <= medCap; mlv++) {
                var midId = b + '_lv' + mlv;
                if (!cands.some(function (c) { return c.id === midId; })) {
                    cands.push({ id: midId, line: b, level: mlv });
                }
            }
        } else {
            var easyCap = Math.max(2, Math.min(cap, pCap - 2));
            for (var elv = 2; elv <= easyCap; elv++) {
                var easyId = b + '_lv' + elv;
                if (!cands.some(function (c) { return c.id === easyId; })) {
                    cands.push({ id: easyId, line: b, level: elv });
                }
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
        // Tuyệt đối không chọn nhánh đã xuất hiện trong nhóm đơn này (chống trùng nhánh)
        var pool = cands.valid.filter(function (c) { return usedLines.indexOf(c.line) === -1; });
        if (pool.length === 0) pool = cands.all.filter(function (c) { return usedLines.indexOf(c.line) === -1; });
        if (pool.length === 0) pool = cands.valid;
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

    var pCap = (typeof getProgressCap === 'function') ? getProgressCap() : 3;
    branches.forEach(function (b) {
        var lineCap = (typeof getItemMaxLevel === 'function') ? getItemMaxLevel(b) : 12;
        var cap = Math.min(lineCap, pCap);
        if (tierHint === 'hard') {
            var hardCap = cap;
            var minHardLv = Math.max(2, hardCap - 2);
            for (var lv = minHardLv; lv <= hardCap; lv++) {
                allCandidates.push({ id: b + '_lv' + lv, line: b, level: lv });
            }
        } else if (tierHint === 'easy') {
            var easyCap = Math.max(2, Math.min(cap, pCap - 2));
            for (var elv = 2; elv <= easyCap; elv++) {
                allCandidates.push({ id: b + '_lv' + elv, line: b, level: elv });
            }
        } else {
            // medium
            var medCap = Math.max(2, Math.min(cap, pCap - 1));
            var minMedLv = Math.max(2, medCap - 2);
            for (var mlv = minMedLv; mlv <= medCap; mlv++) {
                allCandidates.push({ id: b + '_lv' + mlv, line: b, level: mlv });
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

// Ngữ cảnh cốt truyện lúc mới chơi cho chú chó (ngắn gọn tối đa <= 68 ký tự)
var EARLY_CAMP_STORY_CONTEXT = {
    1: {
        preferredLines: ['ghe', 'ban', 'trai'],
        dialogue: 'Gâu! Chạm Xe Kéo ghép Bàn Ghế dựng trại đầu tiên nhé!'
    },
    2: {
        preferredLines: ['trai', 'ban', 'ghe'],
        dialogue: 'Tuyệt quá! Ghép Lều và Bàn Ghế để phá ô mạng nhện nhé!'
    },
    3: {
        preferredLines: ['ban', 'ghe', 'trai'],
        dialogue: 'Gió rừng mát ghê! Ghép các món đang có giao cho mình nhé!'
    },
    4: {
        preferredLines: ['trai', 'ghe', 'ban'],
        dialogue: 'Bãi trại rộng dần rồi! Ghép các món lẻ lên cấp cao nào!'
    },
    5: {
        preferredLines: ['ghe', 'trai', 'ban'],
        dialogue: 'Khéo lắm! Tiếp tục ghép đồ để chuẩn bị đón túi mới nhé!'
    },
    6: {
        preferredLines: ['ban', 'trai', 'ghe'],
        dialogue: 'Khu trại đẹp rồi! Cùng mình dọn gọn để mở rộng đất nào!'
    }
};

// =============================================================================
// HỆ THỐNG NHIỆM VỤ TỰ ĐỘNG LINH ĐỘNG (DYNAMIC ORDERS):
// 1. Không có 2 item cùng nhánh với nhau trong cùng 1 bộ 3 order (3 slot thuộc 3 nhánh hoàn toàn khác biệt).
// 2. Cấp độ order PHẢI CAO HƠN cấp độ item đang có trên bàn chơi cho nhánh đó (+1 cấp).
// 3. Nếu trên bàn chơi CHƯA CÓ nhánh item đó, mặc định cấp order BẰNG LEVEL với nhánh item đang có trên bàn chơi (baseLevel).
// 4. Khi xuất hiện thì cố định 100%, người chơi nộp đơn xong mới chuyển sang nhiệm vụ mới.
// =============================================================================

function getBoardBranchStats(board, activeLines) {
    var b = board || (typeof boardData !== 'undefined' ? boardData : null);
    if (!b && typeof SAVE !== 'undefined' && SAVE && SAVE.persistentBoard && Array.isArray(SAVE.persistentBoard.boardData)) {
        b = SAVE.persistentBoard.boardData;
    }

    var lines = Array.isArray(activeLines) && activeLines.length ? activeLines : ['ban', 'ghe', 'trai'];
    var maxBoardLvByLine = {};
    var countByLine = {};
    var webCountByLine = {};
    var overallBoardMaxLv = 0;

    lines.forEach(function (ln) {
        maxBoardLvByLine[ln] = 0;
        countByLine[ln] = 0;
        webCountByLine[ln] = 0;
    });

    if (Array.isArray(b)) {
        for (var i = 0; i < b.length; i++) {
            var c = b[i];
            if (!c || c.isRock || !c.id || GENERATORS[c.id]) continue;
            var ln = itemLine(c.id);
            var lv = itemLv(c.id);
            if (lines.indexOf(ln) === -1) continue;

            countByLine[ln] = (countByLine[ln] || 0) + 1;
            if (c.isLocked) {
                webCountByLine[ln] = (webCountByLine[ln] || 0) + 1;
            }
            if (lv > (maxBoardLvByLine[ln] || 0)) {
                maxBoardLvByLine[ln] = lv;
            }
            if (lv > overallBoardMaxLv) {
                overallBoardMaxLv = lv;
            }
        }
    }

    // Nếu trên bàn chưa có món nào hoặc chỉ mới có Lv.1, cấp cơ sở mặc định là Lv.2
    var baseLevel = Math.max(2, overallBoardMaxLv);

    return {
        lines: lines,
        maxBoardLvByLine: maxBoardLvByLine,
        countByLine: countByLine,
        webCountByLine: webCountByLine,
        overallBoardMaxLv: overallBoardMaxLv,
        baseLevel: baseLevel
    };
}

// Lấy cấp độ đã order gần nhất của một nhánh item (dùng để đảm bảo khi lặp lại thì level sau phải cao hơn level trước)
function getLastOrderedLevelForLine(line) {
    if (!line) return 0;
    if (typeof SAVE !== 'undefined' && SAVE && SAVE.lastOrderedLevelByBranch && typeof SAVE.lastOrderedLevelByBranch[line] === 'number') {
        return SAVE.lastOrderedLevelByBranch[line];
    }
    if (typeof SAVE !== 'undefined' && SAVE && Array.isArray(SAVE.recentOrdersHistory)) {
        for (var i = SAVE.recentOrdersHistory.length - 1; i >= 0; i--) {
            var id = SAVE.recentOrdersHistory[i];
            if (id && typeof itemLine === 'function' && itemLine(id) === line) {
                var lv = (typeof itemLevel === 'function') ? itemLevel(id) : parseInt((id.match(/_lv(\d+)$/) || [])[1], 10);
                if (typeof lv === 'number' && lv > 0) return lv;
            }
        }
    }
    return 0;
}

// BẢNG CẤP ĐỘ ORDER MỞ RỘNG (TĂNG +1 CẤP ĐẨY NHANH NHỊP GAME CHO TOÀN BỘ TIẾN TRÌNH):
// - Cấp 1 (Xe Kéo): Tối đa Lv.4 (Slot 1: Lv.4 | Slot 2-3: Lv.2 - 3)
// - Cấp 2 - 3 (Xe Kéo): Tối đa Lv.5 (Slot 1: Lv.5 | Slot 2-3: Lv.3 - 4)
// - Cấp 4 (Ba Lô Dã Ngoại): Tối đa Lv.6 (Slot 1: Lv.6 | Slot 2-3: Lv.3 - 5)
// - Cấp 5 (Thùng Bếp & Sinh Tồn): Tối đa Lv.7 (Slot 1: Lv.6 - 7 | Slot 2: Lv.5 - 6 | Slot 3: Lv.4 - 5)
// - Cấp 6 - 7 (Mở rộng đất tầng 2): Tối đa Lv.8 (Slot 1: Lv.8 | Slot 2: Lv.6 - 7)
// - Cấp 8 - 9 (Mở rộng đất tầng 3): Tối đa Lv.9 (Slot 1: Lv.9 | Slot 2: Lv.7 - 8)
// - Cấp 10 - 11 (Chinh phục cấp cao): Tối đa Lv.10 (Slot 1: Lv.10 | Slot 2: Lv.8 - 9)
// - Cấp 12 - 13 (Chinh phục cấp cao): Tối đa Lv.11 (Slot 1: Lv.11 | Slot 2: Lv.9 - 10)
// - Cấp 14+ (Đỉnh cao toàn game): Tối đa Lv.12 (Slot 1: Lv.12 - Cấp cao nhất toàn game)
function getMaxSensibleLevelForPlayer(playerLv) {
    var lv = Math.max(1, parseInt(playerLv, 10) || 1);
    if (lv <= 1) return 4;
    if (lv <= 3) return 5;
    if (lv <= 4) return 6;
    if (lv <= 5) return 7;
    if (lv <= 7) return 8;
    if (lv <= 9) return 9;
    if (lv <= 11) return 10;
    if (lv <= 13) return 11;
    return 12;
}

function getProgressCap(deliveredOrders) {
    var delivered = 0;
    if (typeof deliveredOrders === 'number' && deliveredOrders >= 0) {
        delivered = deliveredOrders;
    } else if (typeof SAVE !== 'undefined' && SAVE && typeof SAVE.totalOrdersDelivered === 'number') {
        delivered = SAVE.totalOrdersDelivered;
    }
    var capFromOrders = Math.min(12, Math.floor(Math.max(0, delivered) / 3) + 4);
    var pLv = (typeof SAVE !== 'undefined' && SAVE && typeof SAVE.playerLevel === 'number') ? SAVE.playerLevel : 1;
    var capFromLevel = getMaxSensibleLevelForPlayer(pLv);
    // capFromLevel là trần cứng tuyệt đối theo Cấp độ Trại của người chơi (không bao giờ vượt quá cấp mà Trại hỗ trợ)
    return Math.min(capFromLevel, capFromOrders);
}

function getProgressCapForOrder(orderNum) {
    var num = (typeof orderNum === 'number' && orderNum > 0)
        ? orderNum
        : ((typeof SAVE !== 'undefined' && SAVE && typeof SAVE.totalOrdersDelivered === 'number') ? (SAVE.totalOrdersDelivered + 1) : 1);
    var delivered = Math.max(0, num - 1);
    var capFromOrders = Math.min(12, Math.floor(delivered / 3) + 4);
    var pLv = (typeof SAVE !== 'undefined' && SAVE && typeof SAVE.playerLevel === 'number') ? SAVE.playerLevel : 1;
    var capFromLevel = getMaxSensibleLevelForPlayer(pLv);
    // capFromLevel là trần cứng tuyệt đối theo Cấp độ Trại của người chơi (không bao giờ vượt quá cấp mà Trại hỗ trợ)
    return Math.min(capFromLevel, capFromOrders);
}

// Tính item order cho một nhánh cụ thể:
// - Khống chế trần cấp độ tối đa theo tiến trình (tăng +1 cấp cho toàn bộ để nhịp game hào hứng, cuốn hút).
// - Slot 1 (Món chính): được phép lên đến progressCap (Cấp 1: Lv.4; Cấp 2-3: Lv.5; Cấp 4: Lv.6; Cấp 5: Lv.7...).
// - Slot 2 (Món vừa): tối đa progressCap - 1 (tối thiểu Lv.2).
// - Slot 3 (Món nhẹ / van xả): tối đa progressCap - 2 (tối thiểu Lv.2).
// - Khi một nhánh đã chạm trần, luân phiên cấp độ kề trần để tránh lặp lại cùng 1 cấp liên tục!
function computeDynamicOrderItemForBranch(line, stats, lastOrderedLevel, slotIdx, orderNum) {
    var validLine = (typeof line === 'string' && line.trim()) ? line.trim() : 'ban';
    var progressCap = getProgressCapForOrder(orderNum);
    var maxLineCap = (typeof getItemMaxLevel === 'function') ? getItemMaxLevel(validLine) : 12;
    var ceiling = Math.min(maxLineCap, progressCap);

    var prevLv = (typeof lastOrderedLevel === 'number' && lastOrderedLevel > 0)
        ? lastOrderedLevel
        : getLastOrderedLevelForLine(validLine);

    // Nếu prevLv trong SAVE bị lưu vết cấp quá cao từ lỗi cũ (ví dụ 10, 11, 12), hạ ngay về mức trần cho phép
    if (prevLv > ceiling) {
        prevLv = Math.max(2, ceiling - 1);
    }

    var isSlot1 = (typeof slotIdx === 'number' && slotIdx === 0);
    var isSlot3 = (typeof slotIdx === 'number' && slotIdx === 2);

    // Slot 1 (món chính): cho phép lên đến ceiling (progressCap)
    // Slot 2 (món vừa): tối đa ceiling - 1 (tối thiểu Lv.2)
    // Slot 3 (món nhẹ): tối đa ceiling - 2 (tối thiểu Lv.2)
    var effectiveCap = isSlot1 ? ceiling : (isSlot3 ? Math.max(2, ceiling - 2) : Math.max(2, ceiling - 1));

    var orderLv;
    if (prevLv > 0) {
        if (prevLv < effectiveCap) {
            orderLv = prevLv + 1;
        } else {
            // Khi nhánh đã chạm trần cấp cho phép, luân phiên giữa (effectiveCap - 1) và effectiveCap để luôn đổi mới:
            orderLv = (prevLv >= effectiveCap) ? Math.max(2, effectiveCap - 1) : effectiveCap;
        }
    } else {
        // Nhánh xuất hiện lần đầu:
        orderLv = isSlot1 ? Math.min(4, effectiveCap) : 2;
    }

    orderLv = Math.max(2, Math.min(orderLv, effectiveCap));
    return validLine + '_lv' + orderLv;
}

// Sinh 3 item cho 3 slot order: Đảm bảo:
// 1. Tuyệt đối không có 2 item cùng nhánh với nhau trong cùng 1 bộ 3 order (3 slot thuộc 3 nhánh hoàn toàn khác biệt).
// 2. Cấp độ order tăng dần mượt mà: khi lặp lại thì tăng đúng +1 cấp so với lần order trước của chính nhánh đó.
// 3. Tránh lặp lại nhánh item theo số túi sinh đồ đang có trên bàn:
//    - 1 túi (3 nhánh): lặp lại sau tối thiểu 1 lần (minGap = 1).
//    - 2 túi (6 nhánh): lặp lại sau tối thiểu 3 lần (minGap = 3).
//    - 3 túi (9 nhánh): lặp lại sau tối thiểu 6 lần (minGap = 6).
function generateDynamic3SlotOrderItems(board, orderNum, existingIds, activeGens) {
    var b = board || (typeof boardData !== 'undefined' ? boardData : null);
    var gens = Array.isArray(activeGens) && activeGens.length ? activeGens : getActiveGeneratorsForOrders(b);
    var activeLines = [];
    gens.forEach(function (gId) {
        (GENERATOR_BRANCH_MAP[gId] || []).forEach(function (ln) {
            if (activeLines.indexOf(ln) === -1) activeLines.push(ln);
        });
    });
    if (!activeLines.length) activeLines = ['ban', 'ghe', 'trai'];

    var stats = getBoardBranchStats(b, activeLines);

    // Xác định khoảng cách giãn cách tối thiểu (minGap) dựa trên số túi sinh đồ đang có trên bàn:
    // - 1 túi (3 nhánh): lặp lại sau tối thiểu 1 lần (minGap = 1)
    // - 2 túi (6 nhánh): lặp lại sau tối thiểu 3 lần (minGap = 3)
    // - 3 túi (9 nhánh): lặp lại sau tối thiểu 6 lần (minGap = 6)
    var numGens = gens.length;
    var minGap = 1;
    if (numGens === 2) {
        minGap = 3;
    } else if (numGens >= 3) {
        minGap = 6;
    }

    // Lấy lịch sử các nhánh đã tạo gần đây (FIFO)
    var recentBranches = [];
    if (typeof SAVE !== 'undefined' && SAVE && Array.isArray(SAVE.recentBranchHistory)) {
        recentBranches = SAVE.recentBranchHistory.slice();
    } else if (typeof SAVE !== 'undefined' && SAVE && Array.isArray(SAVE.recentOrdersHistory)) {
        recentBranches = SAVE.recentOrdersHistory.map(function (id) { return itemLine(id); }).filter(Boolean);
    }

    // Với 1 túi sinh đồ: vì chỉ có đúng 3 nhánh (ban, ghe, trai) và mỗi đơn gồm 3 slot,
    // nên nhánh lặp lại ngay sau 1 lần (không bị chặn bởi đơn trước đó)
    var cooldown = (numGens === 1) ? [] : recentBranches.slice(-minGap);

    var storyCtx = (typeof EARLY_CAMP_STORY_CONTEXT !== 'undefined') ? (EARLY_CAMP_STORY_CONTEXT[orderNum] || null) : null;
    var preferredLines = (storyCtx && Array.isArray(storyCtx.preferredLines)) ? storyCtx.preferredLines : [];

    var chosenLines = [];

    // 1. CHỌN 2 NHÁNH CHO SLOT 1 (CHÍNH) VÀ SLOT 2 (PHỤ) - GIỮ NGUYÊN CƠ CHẾ HIỆN TẠI
    for (var slot = 0; slot < 2; slot++) {
        // Nhánh hợp lệ: không nằm trong cooldown minGap lần gần nhất và chưa chọn trong bộ này
        var pool = activeLines.filter(function (ln) {
            return cooldown.indexOf(ln) === -1 && chosenLines.indexOf(ln) === -1;
        });

        // Nếu pool rỗng (ví dụ tất cả các nhánh đều đang cooldown), chọn nhánh lâu chưa xuất hiện nhất (Least Recently Used)
        if (pool.length === 0) {
            var fallbackPool = activeLines.filter(function (ln) {
                return chosenLines.indexOf(ln) === -1;
            });
            if (fallbackPool.length === 0) {
                fallbackPool = ['ban', 'ghe', 'trai'].filter(function (ln) {
                    return chosenLines.indexOf(ln) === -1;
                });
            }
            if (fallbackPool.length === 0) fallbackPool = activeLines.slice();
            fallbackPool.sort(function (a, bLn) {
                var idxA = recentBranches.lastIndexOf(a);
                var idxB = recentBranches.lastIndexOf(bLn);
                return idxA - idxB;
            });
            pool = fallbackPool;
        }

        // Sắp xếp các ứng viên trong pool:
        // 1. Nhánh có đồ trên bàn trước (ưu tiên nhánh có ô nhện, nhiều đồ, cấp cao)
        // 2. Nhánh ưu tiên theo cốt truyện (preferredLines)
        // 3. Nhánh lâu chưa xuất hiện nhất
        pool.sort(function (a, bLn) {
            var countA = stats.countByLine[a] || 0;
            var countB = stats.countByLine[bLn] || 0;
            var webA = stats.webCountByLine[a] || 0;
            var webB = stats.webCountByLine[bLn] || 0;
            var lvA = stats.maxBoardLvByLine[a] || 0;
            var lvB = stats.maxBoardLvByLine[bLn] || 0;

            var prefA = preferredLines.indexOf(a);
            var prefB = preferredLines.indexOf(bLn);

            var storyBonusA = (prefA !== -1) ? (15 - prefA * 4) : 0;
            var storyBonusB = (prefB !== -1) ? (15 - prefB * 4) : 0;

            var scoreA = (webA * 20) + (countA * 10) + (lvA * 5) + storyBonusA;
            var scoreB = (webB * 20) + (countB * 10) + (lvB * 5) + storyBonusB;

            if (scoreA !== scoreB) {
                return scoreB - scoreA;
            }

            var idxA = recentBranches.lastIndexOf(a);
            var idxB = recentBranches.lastIndexOf(bLn);
            return idxA - idxB;
        });

        var chosen = pool[0];
        if (!chosen) {
            var defLines = ['ban', 'ghe', 'trai'];
            for (var d = 0; d < defLines.length; d++) {
                if (chosenLines.indexOf(defLines[d]) === -1) {
                    chosen = defLines[d];
                    break;
                }
            }
            if (!chosen) chosen = 'ban';
        }

        chosenLines.push(chosen);
        recentBranches.push(chosen);
    }

    var item0 = computeDynamicOrderItemForBranch(chosenLines[0], stats, null, 0, orderNum);
    var item1 = computeDynamicOrderItemForBranch(chosenLines[1], stats, null, 1, orderNum);

    // 2. SLOT 3: TÁCH RIÊNG - QUÉT BÀN CHƠI TÌM NHÁNH ĐANG CHIẾM NHIỀU Ô NHẤT, LEVEL = LEVEL CAO NHẤT TRÊN BÀN + 1
    var slot3Result = pickCrowdedBranchSlot3Item(b, chosenLines[0], chosenLines[1], item0, item1, orderNum, stats, activeLines);
    chosenLines.push(slot3Result.line);
    recentBranches.push(slot3Result.line);

    // Cập nhật lại SAVE.recentBranchHistory và lastOrderedLevelByBranch
    if (typeof SAVE !== 'undefined' && SAVE) {
        SAVE.recentBranchHistory = recentBranches.slice(-30);
        if (!SAVE.lastOrderedLevelByBranch) SAVE.lastOrderedLevelByBranch = {};
        SAVE.lastOrderedLevelByBranch[chosenLines[0]] = (typeof itemLevel === 'function') ? itemLevel(item0) : parseInt((item0.match(/_lv(\d+)$/) || [])[1], 10);
        SAVE.lastOrderedLevelByBranch[chosenLines[1]] = (typeof itemLevel === 'function') ? itemLevel(item1) : parseInt((item1.match(/_lv(\d+)$/) || [])[1], 10);
        SAVE.lastOrderedLevelByBranch[slot3Result.line] = slot3Result.level;
    }

    var items = [item0, item1, slot3Result.item];

    return {
        lines: chosenLines,
        items: items,
        stats: stats,
        minGap: minGap
    };
}

// =============================================================================
// HÀM SINH NHIỆM VỤ SLOT 3 (VAN XẢ / DỌN BÀN THÔNG MINH):
// Quét toàn bộ bàn chơi xem nhánh nào đang chiếm nhiều ô nhất:
// -> Tạo nhiệm vụ cho nhánh đó với level = level item cao nhất của nhánh đó trên bàn + 1
// =============================================================================
function pickCrowdedBranchSlot3Item(board, chosenLine1, chosenLine2, item0, item1, orderNum, stats, activeLines) {
    var b = board || (typeof boardData !== 'undefined' ? boardData : null);
    var lines = Array.isArray(activeLines) && activeLines.length ? activeLines : ['ban', 'ghe', 'trai'];
    var branchStats = stats || getBoardBranchStats(b, lines);

    // Xếp hạng các nhánh dựa trên số ô chiếm dụng thực tế trên bàn:
    var ranked = lines.slice().sort(function (a, bLn) {
        var countA = branchStats.countByLine[a] || 0;
        var countB = branchStats.countByLine[bLn] || 0;

        // Nhánh chiếm nhiều ô hơn luôn được ưu tiên hàng đầu:
        if (countA !== countB) {
            return countB - countA;
        }

        // Nếu cùng số ô (ví dụ cả 2 nhánh cùng 3 ô, hoặc cùng bằng 0):
        // Ưu tiên nhánh chưa được chọn ở Slot 1 và Slot 2 để tạo sự đa dạng
        var inPrevA = (a === chosenLine1 || a === chosenLine2);
        var inPrevB = (bLn === chosenLine1 || bLn === chosenLine2);
        if (inPrevA !== inPrevB) {
            return inPrevA ? 1 : -1;
        }

        // Ưu tiên nhánh có cấp độ cao nhất trên bàn cao hơn:
        var maxLvA = branchStats.maxBoardLvByLine[a] || 0;
        var maxLvB = branchStats.maxBoardLvByLine[bLn] || 0;
        return maxLvB - maxLvA;
    });

    var chosenLine = ranked[0] || 'ban';
    var maxOnBoard = branchStats.maxBoardLvByLine[chosenLine] || 0;
    var maxLineCap = (typeof getItemMaxLevel === 'function') ? getItemMaxLevel(chosenLine) : 12;

    // Cấp độ item = level cao nhất đang có trên bàn + 1 (tối thiểu Lv.2, không vượt quá maxLineCap)
    var targetLv = (maxOnBoard > 0) ? (maxOnBoard + 1) : 2;
    targetLv = Math.max(2, Math.min(targetLv, maxLineCap));

    var targetItemId = chosenLine + '_lv' + targetLv;

    // Tránh trùng 100% item ID với Slot 1 hoặc Slot 2 nếu có nhánh khác cũng có đồ trên bàn:
    if (targetItemId === item0 || targetItemId === item1) {
        var alt = ranked.find(function (ln) {
            if (ln === chosenLine) return false;
            var c = branchStats.countByLine[ln] || 0;
            if (c <= 0) return false;
            var lv = Math.max(2, Math.min((branchStats.maxBoardLvByLine[ln] || 0) + 1, (typeof getItemMaxLevel === 'function') ? getItemMaxLevel(ln) : 12));
            var altId = ln + '_lv' + lv;
            return altId !== item0 && altId !== item1;
        });

        if (alt) {
            chosenLine = alt;
            maxOnBoard = branchStats.maxBoardLvByLine[chosenLine] || 0;
            maxLineCap = (typeof getItemMaxLevel === 'function') ? getItemMaxLevel(chosenLine) : 12;
            targetLv = (maxOnBoard > 0) ? (maxOnBoard + 1) : 2;
            targetLv = Math.max(2, Math.min(targetLv, maxLineCap));
            targetItemId = chosenLine + '_lv' + targetLv;
        } else {
            if (targetLv < maxLineCap) {
                targetLv++;
            } else {
                targetLv = Math.max(2, targetLv - 1);
            }
            targetItemId = chosenLine + '_lv' + targetLv;
        }
    }

    return {
        line: chosenLine,
        item: targetItemId,
        level: targetLv
    };
}

// Sinh vật phẩm động cho Slot 1
function pickDynamicSlot1Item(board, orderNum, existingIds, activeGens) {
    var gen = generateDynamic3SlotOrderItems(board, orderNum, existingIds, activeGens);
    return gen.items[0];
}

// Sinh vật phẩm động cho Slot 2 (Bắt buộc khác nhánh với Slot 1 và tuân thủ minGap)
function pickDynamicSlot2Item(board, slot1Id, orderNum, fallbackId, existingIds, activeGens) {
    var b = board || (typeof boardData !== 'undefined' ? boardData : null);
    var gens = Array.isArray(activeGens) && activeGens.length ? activeGens : getActiveGeneratorsForOrders(b);
    var activeLines = [];
    gens.forEach(function (gId) {
        (GENERATOR_BRANCH_MAP[gId] || []).forEach(function (ln) {
            if (activeLines.indexOf(ln) === -1) activeLines.push(ln);
        });
    });
    if (!activeLines.length) activeLines = ['ban', 'ghe', 'trai'];

    var slot1Line = slot1Id ? itemLine(slot1Id) : '';
    var stats = getBoardBranchStats(b, activeLines);

    var numGens = gens.length;
    var minGap = (numGens === 1) ? 1 : ((numGens === 2) ? 3 : 6);

    var recentBranches = [];
    if (typeof SAVE !== 'undefined' && SAVE && Array.isArray(SAVE.recentBranchHistory)) {
        recentBranches = SAVE.recentBranchHistory.slice();
    }
    var cooldown = (numGens === 1) ? [] : recentBranches.slice(-minGap);

    var candidates = activeLines.filter(function (ln) {
        return ln !== slot1Line && cooldown.indexOf(ln) === -1;
    });
    if (!candidates.length) {
        candidates = activeLines.filter(function (ln) { return ln !== slot1Line; });
    }
    if (!candidates.length) candidates = activeLines.slice();

    candidates.sort(function (a, bLn) {
        var scoreA = ((stats.countByLine[a] || 0) * 10) + ((stats.webCountByLine[a] || 0) * 15);
        var scoreB = ((stats.countByLine[bLn] || 0) * 10) + ((stats.webCountByLine[bLn] || 0) * 15);
        if (scoreA !== scoreB) return scoreB - scoreA;
        return recentBranches.lastIndexOf(a) - recentBranches.lastIndexOf(bLn);
    });

    var chosenLine = candidates[0];
    var it = computeDynamicOrderItemForBranch(chosenLine, stats, null, 1, orderNum);
    var lv = (typeof itemLevel === 'function') ? itemLevel(it) : parseInt((it.match(/_lv(\d+)$/) || [])[1], 10);
    if (typeof SAVE !== 'undefined' && SAVE) {
        if (!SAVE.lastOrderedLevelByBranch) SAVE.lastOrderedLevelByBranch = {};
        SAVE.lastOrderedLevelByBranch[chosenLine] = lv;
    }
    return it;
}

// Sinh vật phẩm động cho Slot 3 (Quét bàn chơi tìm nhánh chiếm nhiều ô nhất, level = level cao nhất trên bàn + 1)
function pickDynamicSlot3Item(board, slot1Id, slot2Id, orderNum, fallbackId, existingIds, activeGens) {
    var b = board || (typeof boardData !== 'undefined' ? boardData : null);
    var gens = Array.isArray(activeGens) && activeGens.length ? activeGens : getActiveGeneratorsForOrders(b);
    var activeLines = [];
    gens.forEach(function (gId) {
        (GENERATOR_BRANCH_MAP[gId] || []).forEach(function (ln) {
            if (activeLines.indexOf(ln) === -1) activeLines.push(ln);
        });
    });
    if (!activeLines.length) activeLines = ['ban', 'ghe', 'trai'];

    var slot1Line = slot1Id ? itemLine(slot1Id) : '';
    var slot2Line = slot2Id ? itemLine(slot2Id) : '';
    var stats = getBoardBranchStats(b, activeLines);

    var res = pickCrowdedBranchSlot3Item(b, slot1Line, slot2Line, slot1Id, slot2Id, orderNum, stats, activeLines);

    if (typeof SAVE !== 'undefined' && SAVE) {
        if (!SAVE.lastOrderedLevelByBranch) SAVE.lastOrderedLevelByBranch = {};
        SAVE.lastOrderedLevelByBranch[res.line] = res.level;
    }
    return res.item;
}

// Quét bàn cờ để tạo nhiệm vụ DỌN BÀN (2 nhiệm vụ liên tiếp quét sạch vật phẩm của túi đồ cũ khi vừa kéo túi đồ mới ra bàn)
// Đảm bảo không trùng nhánh và cấp độ order cao hơn đồ có sẵn trên bàn (hoặc bằng cấp nếu chưa có)
function buildCleanupOrderGroupForOldGens(newGenId, cleanupStep, orderNum, petId, board, existingIds) {
    var pId = petId || 'character01';
    var b = board || (typeof boardData !== 'undefined' ? boardData : null);
    var activeGens = getActiveGeneratorsForOrders(b);
    var oldGens = activeGens.filter(function (g) { return g !== newGenId; });
    if (!oldGens.length) oldGens = ['generator_cooler'];

    var oldLines = [];
    oldGens.forEach(function (gId) {
        (GENERATOR_BRANCH_MAP[gId] || []).forEach(function (ln) {
            if (oldLines.indexOf(ln) === -1) oldLines.push(ln);
        });
    });
    if (!oldLines.length) oldLines = ['ban', 'ghe', 'trai'];

    var stats = getBoardBranchStats(b, oldLines);

    // Chọn đúng 3 nhánh hoàn toàn khác biệt từ các nhánh cũ (không trùng nhánh)
    var chosenLines = [];
    // Ưu tiên các nhánh có đồ trên bàn trước
    oldLines.filter(function (ln) { return (stats.countByLine[ln] || 0) > 0; })
        .sort(function (a, bLn) { return (stats.countByLine[bLn] || 0) - (stats.countByLine[a] || 0); })
        .forEach(function (ln) {
            if (chosenLines.length < 3 && chosenLines.indexOf(ln) === -1) chosenLines.push(ln);
        });
    // Bổ sung các nhánh chưa có đồ
    oldLines.forEach(function (ln) {
        if (chosenLines.length < 3 && chosenLines.indexOf(ln) === -1) chosenLines.push(ln);
    });

    var chosenIds = chosenLines.map(function (ln, sIdx) {
        var it = computeDynamicOrderItemForBranch(ln, stats, null, sIdx, orderNum);
        var lv = (typeof itemLevel === 'function') ? itemLevel(it) : parseInt((it.match(/_lv(\d+)$/) || [])[1], 10);
        if (typeof SAVE !== 'undefined' && SAVE) {
            if (!SAVE.lastOrderedLevelByBranch) SAVE.lastOrderedLevelByBranch = {};
            SAVE.lastOrderedLevelByBranch[ln] = lv;
        }
        return it;
    });

    var newGenName = (newGenId === 'generator_backpack') ? 'Ba Lô Dã Ngoại' : 'Thùng Bếp & Sinh Tồn';
    var cleanupDialogue = '';
    if (cleanupStep === 1) {
        cleanupDialogue = (newGenId === 'generator_backpack')
            ? 'Gâu! Dọn bớt Bàn Ghế cũ để khui Ba Lô nhé! (1/2)'
            : 'Gâu! Dọn bớt đồ cũ để khui Thùng Bếp nhé! (1/2)';
    } else {
        cleanupDialogue = (newGenId === 'generator_backpack')
            ? 'Còn 1 đơn nữa thôi! Giao nốt rồi mở Ba Lô nha! (2/2)'
            : 'Đơn dọn bàn 2 nè! Gom sạch đón Thùng Bếp nào! (2/2)';
    }

    var orders = chosenIds.map(function (itemId, sIdx) {
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
            isDynamic: true,
            isCleanupOrder: true
        };
    });

    return {
        petId: pId,
        orderNum: orderNum,
        isHybrid: true,
        isCleanupGroup: true,
        cleanupStep: cleanupStep,
        newGenId: newGenId,
        contextDialogue: cleanupDialogue,
        orders: orders
    };
}

// Sau khi hoàn thành 2 nhiệm vụ dọn bàn: Con vật nói hướng dẫn túi đồ mới dùng để làm gì và giao ngay nhiệm vụ cần tới item của túi đồ mới đó!
function buildNewGenIntroOrderGroup(newGenId, orderNum, petId, board, existingIds) {
    var pId = petId || 'character01';
    var b = board || (typeof boardData !== 'undefined' ? boardData : null);
    var newLines = GENERATOR_BRANCH_MAP[newGenId] ? GENERATOR_BRANCH_MAP[newGenId].slice() : ['an', 'cafe', 'congcu'];
    var stats = getBoardBranchStats(b, newLines);

    // 3 nhánh thuộc túi mới: không trùng nhánh, cấp độ theo đúng quy tắc
    var introIds = newLines.slice(0, 3).map(function (ln, sIdx) {
        var it = computeDynamicOrderItemForBranch(ln, stats, null, sIdx, orderNum);
        var lv = (typeof itemLevel === 'function') ? itemLevel(it) : parseInt((it.match(/_lv(\d+)$/) || [])[1], 10);
        if (typeof SAVE !== 'undefined' && SAVE) {
            if (!SAVE.lastOrderedLevelByBranch) SAVE.lastOrderedLevelByBranch = {};
            SAVE.lastOrderedLevelByBranch[ln] = lv;
        }
        return it;
    });

    var introDialogue = (newGenId === 'generator_backpack')
        ? '🎒 Ba Lô đã sẵn sàng! Chạm lấy đồ dã ngoại mới nào!'
        : '🧰 Thùng Bếp đã mở! Chạm lấy đồ sinh tồn xịn sò nhé!';

    var orders = introIds.map(function (itemId, sIdx) {
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
            isDynamic: true,
            isNewGenIntro: true
        };
    });

    return {
        petId: pId,
        orderNum: orderNum,
        isHybrid: true,
        isNewGenIntroGroup: true,
        newGenId: newGenId,
        contextDialogue: introDialogue,
        orders: orders
    };
}

// Tạo lời thoại ngữ cảnh tự nhiên cho chú chó dựa trên giai đoạn chơi và các vật phẩm trong nhóm đơn động
function getDynamicOrderContextDialogue(finalIds, orderNum, board) {
    if (EARLY_CAMP_STORY_CONTEXT[orderNum] && EARLY_CAMP_STORY_CONTEXT[orderNum].dialogue) {
        return EARLY_CAMP_STORY_CONTEXT[orderNum].dialogue;
    }
    var primaryId = (Array.isArray(finalIds) && finalIds[0]) ? finalIds[0] : 'ghe_lv2';
    return getPetOrderDialogue(primaryId);
}

// Tạo nhóm đơn hàng Linh Động Toàn Phần ( cả 3 Slot đều linh động 100% ):
// - Kết hợp lời thoại ngữ cảnh của chú chó và các vật phẩm thực tế đang nằm trên bàn chơi.
// - Khi người chơi kéo 1 túi đồ mới ra bàn chơi: tự động phát 2 nhiệm vụ liên tiếp quét dọn đồ của túi đang có,
//   sau đó chú chó hướng dẫn công dụng túi đồ mới và giao nhiệm vụ cần vật phẩm từ túi đồ mới đó.
function getCuratedOrderGroup(orderNum, petId, board, existingIds) {
    var pId = petId || 'character01';
    var b = board || (typeof boardData !== 'undefined' ? boardData : null);
    var activeGens = getActiveGeneratorsForOrders(b);

    // Kiểm tra tiến trình chuyển tiếp khi người chơi vừa kéo 1 túi đồ mới ra bàn chơi:
    if (typeof SAVE !== 'undefined' && SAVE && SAVE.newGenTransition && SAVE.newGenTransition.newGenId) {
        var trans = SAVE.newGenTransition;
        var tGenId = trans.newGenId;
        if (activeGens.indexOf(tGenId) !== -1) {
            if (trans.cleanupStep === 1 || trans.cleanupStep === 2) {
                var stepNum = trans.cleanupStep;
                trans.cleanupStep = stepNum + 1;
                return buildCleanupOrderGroupForOldGens(tGenId, stepNum, orderNum, pId, b, existingIds);
            } else if (trans.cleanupStep === 3) {
                SAVE.newGenTransition = null;
                return buildNewGenIntroOrderGroup(tGenId, orderNum, pId, b, existingIds);
            }
        } else {
            SAVE.newGenTransition = null;
        }
    }

    // Sinh cả 3 Slot hoàn toàn linh động: 100% không trùng nhánh, cấp order > cấp đồ đang có trên bàn (hoặc bằng cấp nếu chưa có)
    var genResult = generateDynamic3SlotOrderItems(b, orderNum, existingIds, activeGens);
    var finalIds = genResult.items;
    var contextDialogue = getDynamicOrderContextDialogue(finalIds, orderNum, b);

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
            isDynamic: true
        };
    });

    return {
        petId: pId,
        orderNum: orderNum,
        isHybrid: true,
        contextDialogue: contextDialogue,
        orders: orders
    };
}

// Kích hoạt chuỗi 2 nhiệm vụ dọn bàn + 1 nhiệm vụ hướng dẫn túi đồ mới ngay khi người chơi kéo túi đồ mới vào bàn chơi
function startNewGeneratorTransitionOrders(newGenId, board) {
    if (typeof SAVE === 'undefined' || !SAVE || !newGenId) return null;
    var b = board || (typeof boardData !== 'undefined' ? boardData : null);
    var currentOrderNum = (SAVE.totalOrdersDelivered || 0) + 1;
    var petId = (Array.isArray(SAVE.petOrderGroups) && SAVE.petOrderGroups[0] && SAVE.petOrderGroups[0].petId)
        ? SAVE.petOrderGroups[0].petId
        : 'character01';

    // Đặt trạng thái chuyển tiếp: Đơn hiện tại là Dọn bàn 1/2, đơn kế tiếp là Dọn bàn 2/2, đơn thứ 3 là Giới thiệu túi đồ mới
    SAVE.newGenTransition = {
        newGenId: newGenId,
        cleanupStep: 2
    };

    var firstCleanupGroup = buildCleanupOrderGroupForOldGens(newGenId, 1, currentOrderNum, petId, b, []);
    if (!Array.isArray(SAVE.petOrderGroups) || SAVE.petOrderGroups.length === 0) {
        SAVE.petOrderGroups = [firstCleanupGroup];
    } else {
        SAVE.petOrderGroups[0] = firstCleanupGroup;
    }
    return firstCleanupGroup;
}

// Nhiệm vụ khi đã xuất hiện thì cố định 100%, người chơi nộp đơn xong mới chuyển sang nhiệm vụ mới.
// Không tự động đổi món giữa chừng khi người chơi thay đổi hoặc ghép đồ trên bàn chơi.
function applyLiveHybridAdaptations(group, orderNum, board) {
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

// Đảm bảo luôn có đúng 1 thú cưng đồng hành đặt đơn hàng trên màn hình (đơn giản, thay thế NPC khi mua mới)
function ensurePetOrderGroups(playerLevel) {
    if (typeof SAVE === 'undefined' || !SAVE) return [];
    if (!Array.isArray(SAVE.petOrderGroups)) SAVE.petOrderGroups = [];

    var owned = (Array.isArray(SAVE.ownedPets) && SAVE.ownedPets.length > 0)
        ? SAVE.ownedPets.slice()
        : ['character01'];

    var activePet = (SAVE.activePet && owned.indexOf(SAVE.activePet) !== -1)
        ? SAVE.activePet
        : (owned[0] || 'character01');
    SAVE.activePet = activePet;

    // Giữ đúng 1 NPC duy nhất trên màn hình cho đơn giản
    var maxPets = 1;
    if (SAVE.petOrderGroups.length > maxPets) {
        SAVE.petOrderGroups = SAVE.petOrderGroups.slice(0, maxPets);
    }

    var existingIds = [];
    var hist15 = Array.isArray(SAVE.recentOrdersHistory) ? SAVE.recentOrdersHistory.slice(-15) : [];
    var b = (typeof boardData !== 'undefined' && boardData && boardData.length) ? boardData : null;
    var activeGens = (typeof getActiveGeneratorsForOrders === 'function') ? getActiveGeneratorsForOrders(b) : ['generator_cooler'];

    // Số thứ tự đơn hàng hiện tại của người chơi (bắt đầu từ 1)
    var currentOrderNum = (SAVE.totalOrdersDelivered || 0) + 1;

    // 1. Giữ CỐ ĐỊNH 100% các nhóm đơn hiện có đã xuất hiện, đồng bộ thú cưng theo activePet
    SAVE.petOrderGroups = SAVE.petOrderGroups.map(function (g, gIdx) {
        if (!g || !Array.isArray(g.orders) || g.orders.length === 0) return null;
        // Cập nhật thú cưng của khay theo NPC đang chọn
        g.petId = activePet;
        g.orders.forEach(function (o) {
            if (o) {
                o.petId = activePet;
                o.isDynamic = true;
                if (o.stashed && !o.stashedVerified) {
                    o.stashed = false;
                }
            }
        });
        var targetOrderNum = currentOrderNum + gIdx;
        var pCap = getProgressCapForOrder(targetOrderNum);

        // Tự động dọn dẹp các cấp độ bị lưu vết quá cao từ trước trong SAVE:
        if (typeof SAVE !== 'undefined' && SAVE && SAVE.lastOrderedLevelByBranch) {
            Object.keys(SAVE.lastOrderedLevelByBranch).forEach(function (k) {
                if (typeof SAVE.lastOrderedLevelByBranch[k] === 'number' && SAVE.lastOrderedLevelByBranch[k] > pCap) {
                    SAVE.lastOrderedLevelByBranch[k] = Math.max(2, pCap - 1);
                }
            });
        }

        // Đơn hàng khi đã xuất hiện trên khay thì CỐ ĐỊNH 100%, người chơi nộp xong mới chuyển sang nhóm mới.
        // Tuyệt đối không tự động tái tạo hay đổi món giữa chừng khi người chơi đang chơi/ghép đồ.
        if (!g.contextDialogue) {
            var curIds = g.orders.map(function (o) { return o && o.id; }).filter(Boolean);
            g.contextDialogue = getDynamicOrderContextDialogue(curIds, targetOrderNum, b);
        }

        g.orders.forEach(function (o) { if (o && o.id) existingIds.push(o.id); });
        return g;
    }).filter(Boolean);

    // 2. Nếu chưa có nhóm thú cưng (mới vào game hoặc vừa nộp xong), sinh 1 đơn mới cho activePet:
    while (SAVE.petOrderGroups.length < maxPets) {
        var chosenPet = activePet;
        var nextOrderNum = currentOrderNum + SAVE.petOrderGroups.length;
        var nextGroup = getCuratedOrderGroup(nextOrderNum, chosenPet, b, existingIds);
        if (!nextGroup || !Array.isArray(nextGroup.orders) || nextGroup.orders.length === 0) {
            // Sau khi hết 63 đơn tính trước hoặc fallback:
            var autoGrp = (typeof generatePetOrderGroup === 'function')
                ? generatePetOrderGroup(chosenPet, playerLevel, existingIds, hist15)
                : null;
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
                nextGroup = autoGrp;
            } else {
                var fbLines = (activeLines && activeLines.length >= 3) ? activeLines.slice(0, 3) : ['ban', 'ghe', 'trai'];
                var fbOrders = fbLines.map(function (ln, sIdx) {
                    var it = computeDynamicOrderItemForBranch(ln, null, null, sIdx, nextOrderNum);
                    return {
                        id: it,
                        done: false,
                        gold: (typeof orderReward === 'function') ? orderReward(it) : 50,
                        exp: (typeof orderExp === 'function') ? orderExp(it) : 15,
                        petId: chosenPet,
                        stashed: false,
                        slotType: (sIdx === 0) ? 'hard' : ((sIdx === 1) ? 'medium' : 'easy'),
                        isDynamic: true
                    };
                });
                nextGroup = {
                    petId: chosenPet,
                    orderNum: nextOrderNum,
                    isHybrid: true,
                    contextDialogue: getDynamicOrderContextDialogue(fbOrders.map(function (o) { return o.id; }), nextOrderNum, b),
                    orders: fbOrders
                };
            }
        }

        if (nextGroup && Array.isArray(nextGroup.orders) && nextGroup.orders.length > 0) {
            SAVE.petOrderGroups.push(nextGroup);
            nextGroup.orders.forEach(function (o) { if (o && o.id) existingIds.push(o.id); });
        }
    }

    // Bảo đảm an toàn tuyệt đối: không bao giờ để petOrderGroups rỗng nếu người chơi đang trong game
    if (SAVE.petOrderGroups.length === 0) {
        var emergencyPet = activePet || ((owned && owned[0]) ? owned[0] : 'character01');
        var emgLines = (activeLines && activeLines.length >= 3) ? activeLines.slice(0, 3) : ['ban', 'ghe', 'trai'];
        var emgOrders = emgLines.map(function (ln, sIdx) {
            var it = computeDynamicOrderItemForBranch(ln, null, null, sIdx, currentOrderNum);
            return {
                id: it,
                done: false,
                gold: (typeof orderReward === 'function') ? orderReward(it) : 50,
                exp: (typeof orderExp === 'function') ? orderExp(it) : 15,
                petId: emergencyPet,
                stashed: false,
                slotType: (sIdx === 0) ? 'hard' : ((sIdx === 1) ? 'medium' : 'easy'),
                isDynamic: true
            };
        });
        SAVE.petOrderGroups.push({
            petId: emergencyPet,
            orderNum: currentOrderNum,
            isHybrid: true,
            contextDialogue: getDynamicOrderContextDialogue(emgOrders.map(function (o) { return o.id; }), currentOrderNum, b),
            orders: emgOrders
        });
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
// - Khi người chơi đạt Level 4 (Ba Lô) và Level 7 (Thùng Đồ), máy phát sẽ hiện ở icon bên trái chú chó để người chơi tự kéo vào bàn!
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
    window.itemLine = itemLine;
    window.itemLv = itemLv;
    window.itemLevel = itemLevel;
    window.GENERATORS = GENERATORS;
    window.spawnItem = spawnItem;
    window.resetGeneratorPity = resetGeneratorPity;
    window.getProgressCap = getProgressCap;
    window.getProgressCapForOrder = getProgressCapForOrder;
    window.getMaxSensibleLevelForPlayer = getMaxSensibleLevelForPlayer;
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
    window.getBoardBranchStats = getBoardBranchStats;
    window.getLastOrderedLevelForLine = getLastOrderedLevelForLine;
    window.computeDynamicOrderItemForBranch = computeDynamicOrderItemForBranch;
    window.generateDynamic3SlotOrderItems = generateDynamic3SlotOrderItems;
    window.pickDynamicSlot1Item = pickDynamicSlot1Item;
    window.pickDynamicSlot2Item = pickDynamicSlot2Item;
    window.pickDynamicSlot3Item = pickDynamicSlot3Item;
    window.pickCrowdedBranchSlot3Item = pickCrowdedBranchSlot3Item;
    window.applyLiveHybridAdaptations = applyLiveHybridAdaptations;
    window.getCuratedOrderGroup = getCuratedOrderGroup;
    window.generatePetOrderGroup = generatePetOrderGroup;
    window.ensurePetOrderGroups = ensurePetOrderGroups;
}
