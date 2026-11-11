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

// Bảng phân bố ngẫu nhiên tự nhiên 6 biến thể ô đá (1 - 6) trên bàn cờ 7 cột x 9 hàng (63 ô)
// Đảm bảo không có 2 ô liền kề nhau (trên, dưới, trái, phải) bị trùng lặp biến thể cỏ
var ROCK_CELL_VARIANTS_MAP = [
    3, 1, 2, 6, 4, 5, 4,
    6, 2, 3, 5, 1, 2, 1,
    5, 4, 6, 3, 6, 1, 2,
    4, 3, 5, 6, 4, 2, 1,
    5, 1, 3, 5, 6, 4, 3,
    2, 3, 6, 4, 5, 1, 2,
    6, 2, 4, 1, 3, 5, 6,
    5, 4, 1, 3, 2, 1, 2,
    6, 3, 5, 4, 1, 2, 4
];

function getRockCellVariant(cellIdx, cellObj) {
    if (cellObj && typeof cellObj.rockVariant === 'number' && cellObj.rockVariant >= 1 && cellObj.rockVariant <= 6) {
        return cellObj.rockVariant;
    }
    var idx = parseInt(cellIdx, 10);
    if (!isNaN(idx) && idx >= 0 && idx < ROCK_CELL_VARIANTS_MAP.length) {
        return ROCK_CELL_VARIANTS_MAP[idx];
    }
    return ((Math.abs(idx || 0) * 7 + 11) % 6) + 1;
}

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
                rockVariant: isR ? getRockCellVariant(i) : 0,
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
// Kiểm tra xem máy phát genId có được kích hoạt chế độ sinh đồ cao cấp hay không:
// - Cấp độ tài khoản người chơi >= 12 -> TẤT CẢ máy phát đều kích hoạt
// - HOẶC trong nhóm nhiệm vụ đang mở có bất kỳ món nào >= Level 8 -> CHỈ máy phát chứa món đồ đó mới kích hoạt
function isGeneratorHighLevelActive(genId, effLv) {
    var pLv = Math.max(1, effLv || ((typeof SAVE !== 'undefined' && SAVE && typeof SAVE.playerLevel === 'number') ? SAVE.playerLevel : 1));

    // 1. Cấp độ tài khoản người chơi >= 12: tất cả máy phát kích hoạt chế độ cao cấp
    if (pLv >= 12) return true;

    // 2. Kiểm tra nếu trong nhóm nhiệm vụ đang mở có món >= Level 8:
    // CHỈ máy phát chứa món đồ đó mới kích hoạt
    if (!genId || typeof SAVE === 'undefined' || !SAVE || !Array.isArray(SAVE.petOrderGroups)) {
        return false;
    }

    var genBranches = [];
    if (typeof GENERATOR_BRANCH_MAP !== 'undefined' && GENERATOR_BRANCH_MAP && GENERATOR_BRANCH_MAP[genId]) {
        genBranches = GENERATOR_BRANCH_MAP[genId];
    } else {
        var defaultGenMap = {
            'generator_cooler': ['ban', 'ghe', 'trai'],
            'generator_backpack': ['an', 'cafe', 'congcu'],
            'generator_crate': ['bep', 'tham', 'antoan']
        };
        genBranches = defaultGenMap[genId] || [];
    }
    if (!genBranches.length && typeof GENERATORS !== 'undefined' && Array.isArray(GENERATORS[genId])) {
        GENERATORS[genId].forEach(function (itId) {
            var ln = (typeof itemLine === 'function') ? itemLine(itId) : itId.split('_lv')[0];
            if (genBranches.indexOf(ln) === -1) genBranches.push(ln);
        });
    }

    if (!genBranches.length) return false;

    for (var gi = 0; gi < SAVE.petOrderGroups.length; gi++) {
        var grp = SAVE.petOrderGroups[gi];
        if (grp && Array.isArray(grp.orders)) {
            for (var oi = 0; oi < grp.orders.length; oi++) {
                var o = grp.orders[oi];
                if (o && !o.done && o.id) {
                    var lv = (typeof itemLevel === 'function') ? itemLevel(o.id) : (parseInt(String(o.id).split('_lv')[1], 10) || 1);
                    var ln = (typeof itemLine === 'function') ? itemLine(o.id) : o.id.split('_lv')[0];
                    if (lv >= 8 && genBranches.indexOf(ln) !== -1) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}
window.isGeneratorHighLevelActive = isGeneratorHighLevelActive;

// Tính toán cấp độ rơi của vật phẩm từ thùng sinh đồ (Lv.1, Lv.2, Lv.3, Lv.4)
// Đọc trực tiếp từ cấu hình GAME_CONFIG.gameplay.generatorDrops để giảm lượng đồ Lv.1 gây đầy bàn
// Đặc biệt: Khi làm nhiệm vụ item từ Lv.8 trở lên (chỉ máy phát chứa món đó) HOẶC cấp tài khoản >= 12:
// -> Cấp 4 = 50%, Cấp 3 = 30%, Cấp 2 = 20%, Cấp 1 = 0%
function getGeneratorDropLevel(levelNum, genId) {
    var dropCfg = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.gameplay && GAME_CONFIG.gameplay.generatorDrops)
        ? GAME_CONFIG.gameplay.generatorDrops
        : null;

    var effLv = Math.max(1, levelNum || 1);

    // Kích hoạt công thức sinh đồ cao cấp
    var isHighLv = isGeneratorHighLevelActive(genId, effLv);
    if (isHighLv) {
        var hlCfg = (dropCfg && dropCfg.highLevelQuestDrops) ? dropCfg.highLevelQuestDrops : { lv4: 0.50, lv3: 0.30, lv2: 0.20 };
        var r = rand();
        var p4 = (hlCfg.lv4 != null) ? hlCfg.lv4 : 0.50;
        var p3 = (hlCfg.lv3 != null) ? hlCfg.lv3 : 0.30;
        if (r < p4) return 4;
        if (r < p4 + p3) return 3;
        return 2;
    }

    var minTierLv = (dropCfg && dropCfg.minLevelForTierDrops != null) ? dropCfg.minLevelForTierDrops : 4;
    var minLv3 = (dropCfg && dropCfg.minLevelForLv3Drops != null) ? dropCfg.minLevelForLv3Drops : 8;
    if (effLv < minTierLv) return 1;

    var tiers = (dropCfg && dropCfg.tiers) || [
        { maxLevel: 3,   lv1: 1.00, lv2: 0.00, lv3: 0.00 },
        { maxLevel: 5,   lv1: 0.50, lv2: 0.50, lv3: 0.00 },
        { maxLevel: 7,   lv1: 0.30, lv2: 0.70, lv3: 0.00 },
        { maxLevel: 99,  lv1: 0.00, lv2: 0.20, lv3: 0.30, lv4: 0.50 }
    ];

    var tier = tiers.find(function (t) { return effLv <= t.maxLevel; }) || tiers[tiers.length - 1];
    var lv3Prob = (effLv >= minLv3) ? (tier.lv3 || 0) : 0;
    var lv2Prob = (effLv >= minTierLv) ? (tier.lv2 || 0) : 0;

    var rRand = rand();
    if (effLv >= minLv3 && rRand < lv3Prob) return 3;
    if (effLv >= minTierLv && rRand < lv3Prob + lv2Prob) return 2;
    return 1;
}

// Giá trị kỳ vọng tương đương Lv.1 của 1 lần bấm sinh đồ theo cấp độ màn chơi:
// Lv.1 = 1 điểm, Lv.2 = 2 điểm, Lv.3 = 4 điểm, Lv.4 = 8 điểm
function getGeneratorDropExpectedValue(levelNum, genId) {
    var dropCfg = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.gameplay && GAME_CONFIG.gameplay.generatorDrops)
        ? GAME_CONFIG.gameplay.generatorDrops
        : null;

    var effLv = Math.max(1, levelNum || 1);
    if (isGeneratorHighLevelActive(genId, effLv)) {
        return (0.20 * 2) + (0.30 * 4) + (0.50 * 8); // = 5.6 điểm kỳ vọng
    }

    var minTierLv = (dropCfg && dropCfg.minLevelForTierDrops != null) ? dropCfg.minLevelForTierDrops : 4;
    var minLv3 = (dropCfg && dropCfg.minLevelForLv3Drops != null) ? dropCfg.minLevelForLv3Drops : 8;
    if (effLv < minTierLv) return 1.0;

    var tiers = (dropCfg && dropCfg.tiers) || [
        { maxLevel: 3,   lv1: 1.00, lv2: 0.00, lv3: 0.00 },
        { maxLevel: 5,   lv1: 0.50, lv2: 0.50, lv3: 0.00 },
        { maxLevel: 7,   lv1: 0.30, lv2: 0.70, lv3: 0.00 },
        { maxLevel: 99,  lv1: 0.00, lv2: 0.20, lv3: 0.30, lv4: 0.50 }
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
    var minTierLv = (dropCfg && dropCfg.minLevelForTierDrops != null) ? dropCfg.minLevelForTierDrops : 4;
    var dropLv = getGeneratorDropLevel(pLv, genId);

    // Khi bàn cờ sắp đầy (<= 6 ô trống), nếu nhánh vừa chọn đang có món lẻ hoặc nhện chờ ghép thì khớp đúng cấp đó để ghép ngay
    // (nhưng chỉ cho phép sinh Lv.2 khi người chơi đã đạt tối thiểu Level 4 theo đúng luật minLevelForTierDrops)
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

// Kịch bản dẫn truyện riêng biệt cho từng vật phẩm Slot 1 (1 câu ngắn gọn <= 80 ký tự, khớp 100% hình ảnh thực tế)
var ITEM_STORY_DIALOGUES = {
    // 1. Chuỗi Bàn dã ngoại (ban_lv1 -> ban_lv12)
    'ban_lv1':  'Đặt chiếc bàn nhôm mini nhỏ gọn ra bãi cỏ làm góc để đồ nhé!',
    'ban_lv2':  'Ghép chiếc bàn vải xanh có khay lưới để xếp gọn đồ nghề nhé!',
    'ban_lv3':  'Mình cần chiếc bàn gỗ xếp chữ X nhỏ gọn để bày trà chiều nào!',
    'ban_lv4':  'Ghép chiếc bàn gấp xanh rêu khung chữ X gọn nhẹ cho chuyến đi!',
    'ban_lv5':  'Thêm chiếc bàn xếp họa tiết thổ cẩm rực rỡ làm nổi bật khu trại!',
    'ban_lv6':  'Ghép chiếc bàn gỗ nan xếp chân gỗ ấm cúng để quây quần ăn tối!',
    'ban_lv7':  'Mình thích chiếc bàn gỗ viền cam khung hợp kim thật vững chãi!',
    'ban_lv8':  'Dựng chiếc bàn nhôm gấp màu xanh nhạt siêu nhẹ và sạch sẽ nhé!',
    'ban_lv9':  'Chuẩn bị chiếc bàn gỗ sồi mặt rộng để cả nhóm cùng bày đồ ăn!',
    'ban_lv10': 'Nâng cấp lên bàn gỗ óc chó chân cao tăng chỉnh thật chắc chắn!',
    'ban_lv11': 'Ghép bàn bếp IGT có sẵn bếp đơn giữa mặt bàn siêu tiện lợi!',
    'ban_lv12': 'Đỉnh cao! Hoàn thiện trạm bếp inox có cả bếp nấu và bồn rửa!',

    // 2. Chuỗi Ghế nghỉ ngơi (ghe_lv1 -> ghe_lv12)
    'ghe_lv1':  'Lấy chiếc ghế đôn xếp cầu vồng nhỏ xinh để ngồi nghỉ chân nhé!',
    'ghe_lv2':  'Chân mỏi rồi, ghép chiếc ghế xếp mini màu xanh ngọc ngồi nghỉ nhé!',
    'ghe_lv3':  'Thêm chiếc ghế vải bố màu cát êm ái để ngồi ngắm mây trời nào!',
    'ghe_lv4':  'Ghép ghế xếp xanh rêu có tay vịn và gối đầu thật thoải mái!',
    'ghe_lv5':  'Mình muốn chiếc ghế xếp họa tiết thổ cẩm thật nổi bật giữa rừng!',
    'ghe_lv6':  'Ghép chiếc ghế xếp khung cong siêu nhẹ để ngả lưng thư giãn nào!',
    'ghe_lv7':  'Nâng cấp lên ghế xếp màu xanh navy rộng rãi và cực kỳ bền bỉ!',
    'ghe_lv8':  'Ghép chiếc ghế gỗ đệm nâu cổ điển ngồi đọc sách quanh lửa trại!',
    'ghe_lv9':  'Thêm chiếc ghế khung gỗ vải kem thanh lịch đón khách ghé trại!',
    'ghe_lv10': 'Chuẩn bị ghế đạo diễn đỏ tay vịn trắng cực phong cách cho trại!',
    'ghe_lv11': 'Ghép ghế tựa lưng cao màu nâu khung bạc để ngắm sao đêm nhé!',
    'ghe_lv12': 'Tuyệt tác! Chiếc ghế đạo diễn glamping màu đỏ rực rỡ nhất trại!',

    // 3. Chuỗi Lều trại trú ngụ (trai_lv1 -> trai_lv12)
    'trai_lv1':  'Đóng chiếc cọc ghim xanh lá xuống đất để cố định góc lều nhé!',
    'trai_lv2':  'Chuẩn bị cuộn dây dù màu cam chắc chắn để căng lều đón gió nhé!',
    'trai_lv3':  'Ghép bộ khung cọc kim loại để sẵn sàng dựng chiếc lều đầu tiên!',
    'trai_lv4':  'Dựng chiếc lều vòm mini màu cam xanh xinh xắn che nắng sương nào!',
    'trai_lv5':  'Ghép chiếc lều vòm xanh rêu có ô cửa tròn cho giấc ngủ trưa nhé!',
    'trai_lv6':  'Mình thích chiếc lều chữ A vải vàng cổ điển thoáng mát này quá!',
    'trai_lv7':  'Dựng lều vòm gia đình màu nâu chống gió thật vững vàng đêm nay!',
    'trai_lv8':  'Nâng cấp lên lều đường hầm màu be rộng rãi chứa được nhiều đồ!',
    'trai_lv9':  'Ghép chiếc lều chóp Bell Tent Glamping màu kem đẹp như cổ tích!',
    'trai_lv10': 'Oa! Dựng lều vòm cầu Geodesic trắng ngắm bầu trời sao lung linh!',
    'trai_lv11': 'Hoàn thiện lều mái vòm sàn gỗ có dây đèn LED ấm áp tuyệt đẹp!',
    'trai_lv12': 'Kiệt tác! Biệt thự lều Safari sàn gỗ có hiên nghỉ dưỡng hoàng gia!',

    // 4. Chuỗi Ẩm thực dã ngoại (an_lv1 -> an_lv12)
    'an_lv1':  'Một quả táo đỏ giòn ngọt tráng miệng cho đầu buổi dã ngoại nhé!',
    'an_lv2':  'Chuẩn bị giỏ trái cây tươi đầy ắp nho, táo và lê ngọt lành nhé!',
    'an_lv3':  'Kẹp thêm rau thịt làm chiếc bánh sandwich ngon lành tiếp sức nào!',
    'an_lv4':  'Nướng chiếc đùi gà vàng ruộm thơm phức nạp năng lượng cho cả nhóm!',
    'an_lv5':  'Nướng nóng một chiếc bánh pizza dã ngoại thơm lừng phô mai nhé!',
    'an_lv6':  'Bắc nồi lẩu thập cẩm nóng hổi đầy thịt và rau giữa trời se lạnh!',
    'an_lv7':  'Bày khay sushi cá hồi và cuộn rong biển tươi ngon đổi vị nhé!',
    'an_lv8':  'Chuẩn bị dẻ sườn nướng BBQ phết sốt đậm đà thơm nức mũi nào!',
    'an_lv9':  'Làm đĩa hải sản hấp tôm ngao vắt thêm lát chanh tươi ngọt thịt!',
    'an_lv10': 'Thái lát chiếc đùi heo xông khói thơm lừng đãi tiệc lửa trại nhé!',
    'an_lv11': 'Chuẩn bị phần thịt bò Wagyu vân cẩm thạch thượng hạng để áp chảo!',
    'an_lv12': 'Đỉnh cao ẩm thực! Cua hoàng đế đỏ au hấp ướp đá cực sang trọng!',

    // 5. Chuỗi Cà phê & Đồ uống (cafe_lv1 -> cafe_lv12)
    'cafe_lv1':  'Những hạt cà phê rang mộc thơm nức mũi cho buổi sáng tỉnh táo!',
    'cafe_lv2':  'Mang bao tải hạt cà phê rang mộc dự trữ cho cả chuyến dã ngoại!',
    'cafe_lv3':  'Dùng cối xay cầm tay inox xay nhuyễn những hạt cà phê thơm lừng!',
    'cafe_lv4':  'Đặt ấm pha Moka Pot kiểu Ý lên bếp đun lấy cốt cà phê sánh đặc!',
    'cafe_lv5':  'Rót một cốc cà phê sứ đỏ nóng hổi thơm ngậy lớp bọt kem nhé!',
    'cafe_lv6':  'Pha ly Cappuccino phân tầng phủ bột ca cao cực chill buổi sáng!',
    'cafe_lv7':  'Làm ly cà phê đen đá mát lạnh giải nhiệt giữa trưa nắng rừng nhé!',
    'cafe_lv8':  'Pha ly cà phê sữa đá béo ngậy ngọt dịu cho buổi chiều thư giãn!',
    'cafe_lv9':  'Thưởng thức ly trà trái cây nhiệt đới chanh dâu cam cực sảng khoái!',
    'cafe_lv10': 'Pha hũ trà đào cam sả mát rượi thơm dịu hương thảo mộc thiên nhiên!',
    'cafe_lv11': 'Hãm ấm trà hoa thảo mộc nóng đặt trên đế giữ nhiệt thật thanh tao!',
    'cafe_lv12': 'Tuyệt phẩm! Bình trà trái cây cỡ lớn có vòi rót phục vụ cả tiệc!',

    // 6. Chuỗi Chiếu sáng dã ngoại (congcu_lv1 -> congcu_lv12)
    'congcu_lv1':  'Treo bóng đèn tròn nhỏ xinh lên dây lều cho buổi tối ấm áp nhé!',
    'congcu_lv2':  'Bật chiếc đèn pin cầm tay màu xanh để soi đường quanh bãi cỏ nhé!',
    'congcu_lv3':  'Giăng dây đèn LED đom đóm lung linh trang trí trước cửa lều nào!',
    'congcu_lv4':  'Đặt chiếc đèn lồng sạc quai cam nhỏ gọn chiếu sáng góc sinh hoạt!',
    'congcu_lv5':  'Bật đèn bảng LED gấp gọn công suất lớn soi sáng cả khoảng sân!',
    'congcu_lv6':  'Thắp chiếc đèn bão màu cam cổ điển mang lại cảm giác thật ấm cúng!',
    'congcu_lv7':  'Treo thêm chiếc đèn bão màu xanh rêu vững chãi trước hiên lều nhé!',
    'congcu_lv8':  'Chiếc đèn bão màu đỏ rực rỡ sẽ làm góc trại đêm nổi bật lắm đây!',
    'congcu_lv9':  'Thắp sáng đèn măng-xông quân đội màu xanh cực kỳ bền bỉ nhé!',
    'congcu_lv10': 'Nâng cấp lên đèn măng-xông chụp bạc tỏa ánh sáng rộng khắp bãi cỏ!',
    'congcu_lv11': 'Ghép chiếc đèn măng-xông đồng vàng sang trọng tỏa ánh sáng dịu mắt!',
    'congcu_lv12': 'Kiệt tác ánh sáng! Đèn măng-xông hoàng gia mạ vàng rực rỡ nhất trại!',

    // 7. Chuỗi Lửa & Bếp trại (bep_lv1 -> bep_lv12)
    'bep_lv1':  'Nhặt vài nhánh củi khô làm mồi nhen nhóm ngọn lửa trại đầu tiên!',
    'bep_lv2':  'Kiếm thêm khúc gỗ tròn khô ráo để chuẩn bị nhóm lửa trại đêm nay!',
    'bep_lv3':  'Buộc gọn bó củi khô dự trữ cho ngọn lửa cháy đượm suốt đêm nhé!',
    'bep_lv4':  'Xếp vòng đá quanh củi khô để làm hố đốt lửa an toàn trên bãi cỏ!',
    'bep_lv5':  'Chất đầy củi vào vòng đá, sẵn sàng châm lửa sưởi ấm cả khu trại!',
    'bep_lv6':  'Châm lửa thôi! Đống lửa trại bùng cháy rực hồng ấm áp quá đi mất!',
    'bep_lv7':  'Chuẩn bị lò nướng than hoa tròn để nướng thịt thơm phức chiều nay!',
    'bep_lv8':  'Nâng cấp lên bếp nướng than inox mini chữ nhật có tay cầm tiện lợi!',
    'bep_lv9':  'Ghép bếp nướng than chân xếp gọn nhẹ với vỉ nướng rực than hồng!',
    'bep_lv10': 'Chuẩn bị bếp nướng kiểu thùng đen nắp gập cho bữa tiệc BBQ đêm!',
    'bep_lv11': 'Bếp nướng chân cao gọn gàng đã đỏ lửa sẵn sàng nướng thịt thơm lừng!',
    'bep_lv12': 'Đỉnh cao! Đại bếp nướng BBQ inox rộng rãi phục vụ mọi đại tiệc!',

    // 8. Chuỗi Chỗ ngủ êm ái (tham_lv1 -> tham_lv12)
    'tham_lv1':  'Mang tấm chăn cuộn màu xám mềm mại giữ ấm khi ngồi ngoài trời nhé!',
    'tham_lv2':  'Thổi chiếc gối hơi màu xanh nhỏ gọn để tựa lưng nghỉ ngơi êm ái!',
    'tham_lv3':  'Trải tấm thảm picnic kẻ ca-rô đỏ trắng ra bãi cỏ cùng dã ngoại nào!',
    'tham_lv4':  'Chuẩn bị tấm thảm cuộn cách nhiệt xanh rêu chống ẩm mặt đất nhé!',
    'tham_lv5':  'Mang bộ túi ngủ cuộn màu cam đen gọn gàng sẵn sàng ngủ qua đêm!',
    'tham_lv6':  'Chui vào chiếc túi ngủ con nhộng xanh rêu lót lông cực ấm áp nhé!',
    'tham_lv7':  'Bơm chiếc đệm hơi đơn màu xanh kèm ống bơm tay thật nhanh gọn nào!',
    'tham_lv8':  'Gấp gọn bộ chăn đệm dã ngoại kèm gối trắng êm như ở nhà nhé!',
    'tham_lv9':  'Nâng cấp lên đệm hơi đôi cỡ lớn có hai gối liền cực kỳ êm ái!',
    'tham_lv10': 'Dựng chiếc giường xếp khung nhôm cách ly hoàn toàn hơi lạnh mặt đất!',
    'tham_lv11': 'Phủ thêm chăn bông chần màu cam ấm áp lên giường xếp Glamping nhé!',
    'tham_lv12': 'Đỉnh cao Glamping! Giường gỗ hoàng gia cùng thảm thổ cẩm 5 sao!',

    // 9. Chuỗi An toàn & Năng lượng (antoan_lv1 -> antoan_lv12)
    'antoan_lv1':  'Xịt chút chai chống muỗi màu cam để thoải mái vui chơi giữa rừng nhé!',
    'antoan_lv2':  'Thoa kem chống nắng tuýp vàng bảo vệ làn da suốt ngày dã ngoại!',
    'antoan_lv3':  'Mang theo túi bàn chải kem đánh răng giữ vệ sinh sạch sẽ nhé!',
    'antoan_lv4':  'Lấy sợi cáp sạc bọc dù màu cam bền bỉ kết nối các thiết bị điện!',
    'antoan_lv5':  'Cất gọn viên pin sạc dự phòng màu xanh lá để nạp điện khi cần!',
    'antoan_lv6':  'Luôn sẵn sàng túi y tế sơ cứu màu đỏ bảo vệ an toàn cho cả nhóm!',
    'antoan_lv7':  'Dùng đèn khò gas mini đầu xanh hỗ trợ nhóm bếp nhanh chóng nhé!',
    'antoan_lv8':  'Bật chiếc quạt tích điện màu cam thổi gió mát rượi giữa trưa hè!',
    'antoan_lv9':  'Dựng tấm pin năng lượng mặt trời đón nắng tự tạo nguồn điện sạch!',
    'antoan_lv10': 'Bật loa Bluetooth xanh rêu lên chill vài bản nhạc bên bờ suối nhé!',
    'antoan_lv11': 'Ghép trạm sạc dự phòng mini màu đen cấp nguồn cho đèn và quạt!',
    'antoan_lv12': 'Đỉnh cao công nghệ! Trạm năng lượng Glamping cấp điện cả khu trại!'
};

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
        'Thắp sáng góc trại bằng chiếc đèn dã ngoại ấm áp nhé!',
        'Ánh đèn lung linh cho đêm cắm trại thêm rực rỡ!',
        'Chuẩn bị đèn chiếu sáng quanh khu vực lều trại nào!'
    ],
    'tham': [
        'Trải thảm êm ra bãi cỏ để mình lăn lộn ngắm mây nào!',
        'Thảm dã ngoại hoa văn xinh xắn cho góc trại!',
        'Ngả lưng trên tấm thảm êm hít thở không khí trong lành!'
    ],
    'bep': [
        'Đốt bếp lửa trại ấm cúng để nướng đồ ăn đêm nhé!',
        'Nhóm ngọn lửa hồng sưởi ấm giữa chiều se lạnh nào!',
        'Bếp nướng dã ngoại tiện lợi cho bữa tối thịnh soạn!'
    ],
    'antoan': [
        'Chuẩn bị nguồn điện dự phòng cho chuyến dã ngoại dài ngày nhé!',
        'Nạp đầy năng lượng để quạt và đèn trại luôn hoạt động!',
        'Trạm điện thông minh giúp khu trại tiện nghi như ở nhà!'
    ]
};

function getPetOrderDialogue(itemId) {
    if (itemId && ITEM_STORY_DIALOGUES[itemId]) {
        return ITEM_STORY_DIALOGUES[itemId];
    }
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
    var maxUnlockedLvByLine = {};
    var countByLine = {};
    var unlockedCountByLine = {};
    var webCountByLine = {};
    var maxWebLvByLine = {};
    var overallBoardMaxLv = 0;
    var overallUnlockedMaxLv = 0;

    lines.forEach(function (ln) {
        maxBoardLvByLine[ln] = 0;
        maxUnlockedLvByLine[ln] = 0;
        countByLine[ln] = 0;
        unlockedCountByLine[ln] = 0;
        webCountByLine[ln] = 0;
        maxWebLvByLine[ln] = 0;
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
                if (lv > (maxWebLvByLine[ln] || 0)) {
                    maxWebLvByLine[ln] = lv;
                }
            } else {
                unlockedCountByLine[ln] = (unlockedCountByLine[ln] || 0) + 1;
                if (lv > (maxUnlockedLvByLine[ln] || 0)) {
                    maxUnlockedLvByLine[ln] = lv;
                }
                if (lv > overallUnlockedMaxLv) {
                    overallUnlockedMaxLv = lv;
                }
            }
            if (lv > (maxBoardLvByLine[ln] || 0)) {
                maxBoardLvByLine[ln] = lv;
            }
            if (lv > overallBoardMaxLv) {
                overallBoardMaxLv = lv;
            }
        }
    }

    // Cấp cơ sở tính trên các item tự do (không bị mạng nhện)
    var baseLevel = Math.max(2, overallUnlockedMaxLv);

    return {
        lines: lines,
        maxBoardLvByLine: maxBoardLvByLine,
        maxUnlockedLvByLine: maxUnlockedLvByLine,
        countByLine: countByLine,
        unlockedCountByLine: unlockedCountByLine,
        webCountByLine: webCountByLine,
        maxWebLvByLine: maxWebLvByLine,
        overallBoardMaxLv: overallBoardMaxLv,
        overallUnlockedMaxLv: overallUnlockedMaxLv,
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
    if (lv <= 2) return 4;   // Lv 1-2: max Lv.4 (Bàn gỗ, Ghế tay vịn, Lều tăng che)
    if (lv <= 4) return 5;   // Lv 3-4: max Lv.5 (Ba Lô vừa mở ở Lv.4)
    if (lv <= 6) return 6;   // Lv 5-6: max Lv.6
    if (lv <= 8) return 7;   // Lv 7-8: max Lv.7 (Thùng Đồ vừa mở ở Lv.7)
    if (lv <= 11) return 8;  // Lv 9-11: max Lv.8
    if (lv <= 14) return 9;  // Lv 12-14: max Lv.9
    if (lv <= 18) return 10; // Lv 15-18: max Lv.10
    if (lv <= 22) return 11; // Lv 19-22: max Lv.11
    return 12;               // Lv 23+: max Lv.12 (Đỉnh cao toàn game)
}

function getProgressCap(deliveredOrders, playerLv) {
    var delivered = 0;
    if (typeof deliveredOrders === 'number' && deliveredOrders >= 0) {
        delivered = deliveredOrders;
    } else if (typeof SAVE !== 'undefined' && SAVE && typeof SAVE.totalOrdersDelivered === 'number') {
        delivered = SAVE.totalOrdersDelivered;
    }
    var capFromOrders = Math.min(12, Math.floor(Math.max(0, delivered) / 4) + 4);
    var pLv = (typeof playerLv === 'number' && playerLv >= 1)
        ? playerLv
        : ((typeof SAVE !== 'undefined' && SAVE && typeof SAVE.playerLevel === 'number') ? SAVE.playerLevel : 1);
    var capFromLevel = getMaxSensibleLevelForPlayer(pLv);
    // capFromLevel là trần cứng tuyệt đối theo Cấp độ Trại của người chơi (không bao giờ vượt quá cấp mà Trại hỗ trợ)
    return Math.min(capFromLevel, capFromOrders);
}

function getProgressCapForOrder(orderNum, playerLv) {
    var num = (typeof orderNum === 'number' && orderNum > 0)
        ? orderNum
        : ((typeof SAVE !== 'undefined' && SAVE && typeof SAVE.totalOrdersDelivered === 'number') ? (SAVE.totalOrdersDelivered + 1) : 1);

    var capFromOrders;
    if (num === 1) capFromOrders = 2; // Đơn 1 làm quen nhanh gọn: Lv.2
    else if (num <= 3) capFromOrders = 3; // Đơn 2 - 3 (Level 1): trần Lv.3
    else if (num <= 7) capFromOrders = 4; // Level 2: trần Lv.4
    else if (num <= 13) capFromOrders = 5; // Level 3: trần Lv.5
    else if (num <= 21) capFromOrders = 6; // Level 4: trần Lv.6
    else if (num <= 32) capFromOrders = 7; // Level 5-6: trần Lv.7
    else if (num <= 45) capFromOrders = 8; // Level 7-8: trần Lv.8
    else if (num <= 60) capFromOrders = 9; // Level 9-11: trần Lv.9
    else if (num <= 78) capFromOrders = 10; // Level 12-15: trần Lv.10
    else if (num <= 98) capFromOrders = 11; // Level 16-20: trần Lv.11
    else capFromOrders = 12;

    var pLv = (typeof playerLv === 'number' && playerLv >= 1)
        ? playerLv
        : ((typeof SAVE !== 'undefined' && SAVE && typeof SAVE.playerLevel === 'number') ? SAVE.playerLevel : 1);
    var capFromLevel = getMaxSensibleLevelForPlayer(pLv);
    // capFromLevel là trần cứng tuyệt đối theo Cấp độ Trại của người chơi (không bao giờ vượt quá cấp mà Trại hỗ trợ)
    return Math.min(capFromLevel, capFromOrders);
}

// Xác định số lượng món hàng cho mỗi đơn (Nhịp điệu sinh động: 1 món nhanh gọn, 2 món tiêu chuẩn, 3 món thử thách)
function getOrderSlotCount(orderNum) {
    var num = Math.max(1, parseInt(orderNum, 10) || 1);
    if (num === 1) return 1; // Đơn 1: 1 món (làm quen tức thì)
    if (num === 2 || num === 3) return 2; // Đơn 2, 3: 2 món (hoàn thành chuẩn xác Level 1 với 3 đơn)
    // Từ đơn 4 trở đi: Chu kỳ nhịp điệu [2, 1, 2, 3, 2, 1, 2, 3] (~25% đơn 1 món, 50% đơn 2 món, 25% đơn 3 món)
    var cycle = [2, 1, 2, 3, 2, 1, 2, 3];
    return cycle[(num - 4) % cycle.length];
}

// Tính item order cho một nhánh cụ thể:
// - Khống chế trần cấp độ tối đa theo tiến trình (tăng +1 cấp cho toàn bộ để nhịp game hào hứng, cuốn hút).
// - Slot 1 (Món chính): được phép lên đến progressCap (Cấp 1: Lv.4; Cấp 2-3: Lv.5; Cấp 4: Lv.6; Cấp 5: Lv.7...).
// - Slot 2 (Món vừa): tối đa progressCap - 1 (tối thiểu Lv.2).
// - Slot 3 (Món nhẹ / van xả): tối đa progressCap - 2 (tối thiểu Lv.2).
// - Cơ chế Chống Lặp Tuyệt Đối: Kiểm tra lịch sử recentOrdersHistory và các item cùng nhóm để không lặp lại cùng 1 cấp liên tục!
// Ghi nhận vật phẩm vào lịch sử MRU (Most Recently Used) để chống lặp lại item liên tục
function recordItemInRecentOrdersHistory(itemId) {
    if (!itemId || typeof SAVE === 'undefined' || !SAVE) return;
    if (!Array.isArray(SAVE.recentOrdersHistory)) SAVE.recentOrdersHistory = [];
    var prevIdx = SAVE.recentOrdersHistory.indexOf(itemId);
    if (prevIdx !== -1) {
        SAVE.recentOrdersHistory.splice(prevIdx, 1);
    }
    SAVE.recentOrdersHistory.push(itemId);
    if (SAVE.recentOrdersHistory.length > 50) {
        SAVE.recentOrdersHistory = SAVE.recentOrdersHistory.slice(-50);
    }
    var ln = (typeof itemLine === 'function') ? itemLine(itemId) : String(itemId).split('_lv')[0];
    var lv = (typeof itemLevel === 'function') ? itemLevel(itemId) : (parseInt((String(itemId).match(/_lv(\d+)$/) || [])[1], 10) || 2);
    if (ln) {
        if (!Array.isArray(SAVE.recentBranchHistory)) SAVE.recentBranchHistory = [];
        SAVE.recentBranchHistory.push(ln);
        if (SAVE.recentBranchHistory.length > 40) {
            SAVE.recentBranchHistory = SAVE.recentBranchHistory.slice(-40);
        }
        if (!SAVE.lastOrderedLevelByBranch) SAVE.lastOrderedLevelByBranch = {};
        SAVE.lastOrderedLevelByBranch[ln] = lv;
    }
}

function computeDynamicOrderItemForBranch(line, stats, lastOrderedLevel, slotIdx, orderNum, existingInGroup) {
    var validLine = (typeof line === 'string' && line.trim()) ? line.trim() : 'ban';
    var progressCap = getProgressCapForOrder(orderNum);
    var maxLineCap = (typeof getItemMaxLevel === 'function') ? getItemMaxLevel(validLine) : 12;
    var ceiling = Math.min(maxLineCap, Math.max(progressCap, 3));

    var isSlot1 = (typeof slotIdx === 'number' && slotIdx === 0);
    var isSlot3 = (typeof slotIdx === 'number' && slotIdx === 2);

    // Slot 1 (món chính): cho phép lên đến ceiling (progressCap)
    // Slot 2 & 3 (món phụ): đảm bảo tối thiểu có dải cấp [2 .. 3+] để xoay vòng chống trùng lặp và không lấn sân Slot 1
    var effectiveCap;
    if (isSlot1) {
        effectiveCap = ceiling;
    } else if (isSlot3) {
        effectiveCap = Math.max(3, Math.min(maxLineCap, ceiling - (ceiling >= 6 ? 2 : (ceiling >= 5 ? 1 : 0))));
    } else {
        effectiveCap = Math.max(3, Math.min(maxLineCap, ceiling - (ceiling >= 5 ? 1 : 0)));
    }

    // Tập hợp toàn bộ các cấp độ khả dĩ trong khoảng [2 .. effectiveCap]
    var candidates = [];
    for (var lv = 2; lv <= effectiveCap; lv++) {
        candidates.push(lv);
    }
    if (candidates.length === 0) candidates = [2, 3];

    // Cấp độ kế tiếp của Slot 1 cho nhánh này (để Slot 2 & 3 không tranh mất vật phẩm cốt truyện sắp tới của Slot 1)
    var upcomingSlot1Lv = (typeof SAVE !== 'undefined' && SAVE && SAVE.slot1BranchLevelMap && typeof SAVE.slot1BranchLevelMap[validLine] === 'number')
        ? (SAVE.slot1BranchLevelMap[validLine] + 1)
        : 2;
    var lastBranchLv = (typeof SAVE !== 'undefined' && SAVE && SAVE.lastOrderedLevelByBranch && typeof SAVE.lastOrderedLevelByBranch[validLine] === 'number')
        ? SAVE.lastOrderedLevelByBranch[validLine]
        : 0;

    // Lịch sử chống lặp item: kiểm tra 16 item gần nhất
    var recentHistory = (typeof SAVE !== 'undefined' && Array.isArray(SAVE.recentOrdersHistory)) ? SAVE.recentOrdersHistory : [];
    var recentGroupIds = Array.isArray(existingInGroup) ? existingInGroup : [];
    var allRecent = recentHistory.concat(recentGroupIds);

    // Lọc các cấp độ chưa từng xuất hiện gần đây, không trùng cấp vừa đặt của nhánh, và không lấn sân cấp sắp tới của Slot 1
    var validLevels = candidates.filter(function (lvCandidate) {
        var idCandidate = validLine + '_lv' + lvCandidate;
        if (recentGroupIds.indexOf(idCandidate) !== -1) return false;
        if (allRecent.slice(-16).indexOf(idCandidate) !== -1) return false;
        if (lvCandidate === lastBranchLv && candidates.length > 1) return false;
        if (!isSlot1 && lvCandidate === upcomingSlot1Lv && candidates.length > 1) return false;
        return true;
    });

    if (validLevels.length === 0) {
        validLevels = candidates.filter(function (lvCandidate) {
            var idCandidate = validLine + '_lv' + lvCandidate;
            if (recentGroupIds.indexOf(idCandidate) !== -1) return false;
            if (allRecent.slice(-8).indexOf(idCandidate) !== -1) return false;
            if (!isSlot1 && lvCandidate === upcomingSlot1Lv && candidates.length > 1) return false;
            return true;
        });
    }

    if (validLevels.length === 0) {
        validLevels = candidates.filter(function (lvCandidate) {
            if (!isSlot1 && lvCandidate === upcomingSlot1Lv && candidates.length > 1) return false;
            return recentGroupIds.indexOf(validLine + '_lv' + lvCandidate) === -1;
        });
    }
    if (validLevels.length === 0) validLevels = candidates.slice();

    var orderLv;
    if (isSlot1) {
        orderLv = validLevels[validLevels.length - 1];
    } else {
        // Slot 2 & 3: Ưu tiên cấp độ chưa từng xuất hiện hoặc xuất hiện xa nhất trong lịch sử MRU (xoay vòng tròn đều đặn, không random lặp)
        var maxOnBoard = (stats && stats.maxUnlockedLvByLine && stats.maxUnlockedLvByLine[validLine]) ? stats.maxUnlockedLvByLine[validLine] : 0;
        var preferredBoardLv = (maxOnBoard > 0) ? Math.min(effectiveCap, Math.max(2, maxOnBoard + 1)) : 0;

        validLevels.sort(function (a, b) {
            var idxA = allRecent.lastIndexOf(validLine + '_lv' + a);
            var idxB = allRecent.lastIndexOf(validLine + '_lv' + b);
            if (idxA !== idxB) return idxA - idxB;
            if (preferredBoardLv > 0) {
                var distA = Math.abs(a - preferredBoardLv);
                var distB = Math.abs(b - preferredBoardLv);
                if (distA !== distB) return distA - distB;
            }
            return b - a;
        });
        orderLv = validLevels[0];
    }

    orderLv = Math.max(2, Math.min(orderLv, effectiveCap));
    return validLine + '_lv' + orderLv;
}

// =============================================================================
// HÀM CHỌN VẬT PHẨM KỊCH BẢN TIẾN TRÌNH KHÔNG LẶP LẠI (CHO CẢ SLOT 1, SLOT 2 & SLOT 3):
// - Đi đều qua tất cả các chuỗi vật phẩm đang mở khóa (ban, ghe, trai -> an, cafe, congcu -> bep, tham, antoan)
// - Tăng tuần tự từng cấp độ (Lv.2 -> Lv.12, riêng thảm Lv.2 -> Lv.8)
// - Cam kết đi qua trọn vẹn 95 vật phẩm từ Lv.2 đến Max Level mà KHÔNG LẶP LẠI BẤT KỲ ITEM NÀO ở mọi Slot!
// - Ở Slot 2 & Slot 3: Ưu tiên nhánh đang có sẵn nhiều vật phẩm trên bàn chơi để hỗ trợ giải phóng bàn cờ!
// =============================================================================
function pickScriptedSlot1MainQuestItem(board, orderNum, activeLines, activeGens, excludedLines, boardStats, slotIndex) {
    var b = board || (typeof boardData !== 'undefined' ? boardData : null);
    var lines = (Array.isArray(activeLines) && activeLines.length > 0)
        ? activeLines.slice()
        : ['ban', 'ghe', 'trai'];
    var exclude = Array.isArray(excludedLines) ? excludedLines : [];
    var sIdx = typeof slotIndex === 'number' ? slotIndex : 0;

    if (typeof SAVE === 'undefined' || !SAVE) {
        return lines[0] + '_lv2';
    }
    if (!SAVE.slot1BranchLevelMap || typeof SAVE.slot1BranchLevelMap !== 'object') {
        SAVE.slot1BranchLevelMap = {};
    }
    if (!Array.isArray(SAVE.slot1RecentBranches)) {
        SAVE.slot1RecentBranches = [];
    }
    if (!Array.isArray(SAVE.slot1CompletedIds)) {
        SAVE.slot1CompletedIds = [];
    }

    var allBranches = ['ban', 'ghe', 'trai', 'an', 'cafe', 'congcu', 'bep', 'tham', 'antoan'];
    allBranches.forEach(function (ln) {
        if (typeof SAVE.slot1BranchLevelMap[ln] !== 'number' || SAVE.slot1BranchLevelMap[ln] < 1) {
            SAVE.slot1BranchLevelMap[ln] = 1;
        }
    });

    // -------------------------------------------------------------------------
    // CƠ CHẾ LẶP LẠI 2 LẦN CHO CHIẾC GHẾ Ở SLOT 1 (CÁCH NHAU ĐÚNG 3 NHIỆM VỤ)
    // Để người chơi chắc chắn thu thập đủ 2 chiếc ghế giống nhau trang trí khu trại
    // -------------------------------------------------------------------------
    if (sIdx === 0) {
        if (SAVE.slot1ChairRepeat && typeof SAVE.slot1ChairRepeat === 'object' && SAVE.slot1ChairRepeat.itemId) {
            if (SAVE.slot1ChairRepeat.gapRemaining > 0) {
                // Đang trong 3 nhiệm vụ đệm ở giữa: giảm bộ đếm và loại trừ 'ghe' để dành cho lần 2
                SAVE.slot1ChairRepeat.gapRemaining--;
                exclude = exclude.concat(['ghe']);
            } else {
                // Đúng 3 nhiệm vụ đệm đã trôi qua: LẬP TỨC GIAO LẠI CHIẾC GHẾ NÀY LẦN THỨ 2!
                var repeatChairId = SAVE.slot1ChairRepeat.itemId;
                var repeatChairLv = parseInt(String(repeatChairId).split('_lv')[1], 10) || 2;
                SAVE.slot1ChairRepeat = null; // Đã xong đủ 2 lần ghế cấp này

                // Nếu chiếc ghế này đã có >= 3 lần trong kho đồ cắm trại thì không lặp lại nữa
                if (typeof isItemCompletedMaxTimes === 'function' && isItemCompletedMaxTimes(repeatChairId)) {
                    // Tiếp tục rơi xuống thuật toán chọn bình thường bên dưới
                } else {
                    SAVE.slot1BranchLevelMap['ghe'] = repeatChairLv;
                    SAVE.slot1RecentBranches.push('ghe');
                    if (SAVE.slot1RecentBranches.length > 40) {
                        SAVE.slot1RecentBranches = SAVE.slot1RecentBranches.slice(-40);
                    }
                    if (SAVE.slot1CompletedIds.indexOf(repeatChairId) === -1) {
                        SAVE.slot1CompletedIds.push(repeatChairId);
                    }
                    if (typeof recordHistoricalOrderedItem === 'function') {
                        recordHistoricalOrderedItem(repeatChairId);
                    }
                    return repeatChairId;
                }
            }
        } else {
            // Sau khi vừa hoàn thành Ghế Lần 2, tạo khoảng cách ít nhất 2 nhiệm vụ trước khi xét cấp ghế kế tiếp
            var recentLast = SAVE.slot1RecentBranches.slice(-Math.min(lines.length - 1, 2));
            if (recentLast.indexOf('ghe') !== -1) {
                exclude = exclude.concat(['ghe']);
            }
        }
    }

    // Tìm cấp độ kế tiếp chưa hoàn thành của từng nhánh đang hoạt động (trừ các nhánh đã chọn trong cùng đơn)
    var candidateLines = lines.filter(function (ln) { return exclude.indexOf(ln) === -1; });
    if (candidateLines.length === 0) candidateLines = lines.slice();

    var uncompleted = [];
    candidateLines.forEach(function (ln) {
        var maxLv = (typeof getItemMaxLevel === 'function') ? getItemMaxLevel(ln) : 12;
        var nextLv = (SAVE.slot1BranchLevelMap[ln] || 1) + 1;
        while (nextLv <= maxLv && (SAVE.slot1CompletedIds.indexOf(ln + '_lv' + nextLv) !== -1 || (typeof isItemCompletedMaxTimes === 'function' && isItemCompletedMaxTimes(ln + '_lv' + nextLv)))) {
            nextLv++;
        }
        if (nextLv <= maxLv) {
            uncompleted.push({
                line: ln,
                nextLv: nextLv,
                maxLv: maxLv
            });
        }
    });

    var recentSlot1 = SAVE.slot1RecentBranches;
    var recentOrders = Array.isArray(SAVE.recentOrdersHistory) ? SAVE.recentOrdersHistory : [];
    var stats = boardStats || getBoardBranchStats(b, lines);
    var chosenEntry = null;

    if (uncompleted.length > 0) {
        // Giãn cách nhánh thông minh để xoay vòng đều qua các chuỗi item
        var cooldownLen = 0;
        if (uncompleted.length === 2) cooldownLen = 1;
        else if (uncompleted.length === 3) cooldownLen = 2;
        else if (uncompleted.length >= 4 && uncompleted.length <= 6) cooldownLen = Math.min(uncompleted.length - 2, 3);
        else if (uncompleted.length >= 7) cooldownLen = Math.min(uncompleted.length - 3, 5);

        var recentCooldown = cooldownLen > 0 ? recentSlot1.slice(-cooldownLen) : [];
        var candidates = uncompleted.filter(function (entry) {
            return recentCooldown.indexOf(entry.line) === -1;
        });
        if (candidates.length === 0) {
            candidates = uncompleted.slice();
        }

        // Sắp xếp ưu tiên:
        // 1. Nhánh có cấp độ kế tiếp (nextLv) thấp hơn được ưu tiên để mọi chuỗi item tiến lên đều nhau
        // 2. Ở Slot 2 & 3: nếu cùng cấp nextLv, ưu tiên nhánh đang chiếm nhiều ô trên bàn để giúp người chơi dọn bàn
        // 3. Chọn nhánh lâu chưa xuất hiện nhất trong slot1RecentBranches (xoay vòng tròn đều đặn)
        candidates.sort(function (a, bEntry) {
            if (a.nextLv !== bEntry.nextLv) {
                return a.nextLv - bEntry.nextLv;
            }
            if (sIdx > 0 && stats && stats.unlockedCountByLine) {
                var cntA = stats.unlockedCountByLine[a.line] || 0;
                var cntB = stats.unlockedCountByLine[bEntry.line] || 0;
                if (cntA !== cntB) return cntB - cntA;
            }
            var idxA = recentSlot1.lastIndexOf(a.line);
            var idxB = recentSlot1.lastIndexOf(bEntry.line);
            return idxA - idxB;
        });

        chosenEntry = candidates[0];
    } else {
        // Fallback End-Game (sau khi đã hoàn thành trọn bộ các vật phẩm):
        // Xoay vòng đều qua các nhánh & cấp độ xa nhất trong lịch sử MRU, tuân thủ giới hạn hoàn thành
        var sortedEndLines = candidateLines.slice().sort(function (a, bLn) {
            return recentSlot1.lastIndexOf(a) - recentSlot1.lastIndexOf(bLn);
        });
        var chosenEndLine = null;
        var chosenEndLv = null;
        for (var sIdx2 = 0; sIdx2 < sortedEndLines.length; sIdx2++) {
            var testEndLine = sortedEndLines[sIdx2];
            var testMaxLv = (typeof getItemMaxLevel === 'function') ? getItemMaxLevel(testEndLine) : 12;
            var testCands = [];
            for (var eLv = 2; eLv <= testMaxLv; eLv++) {
                var eCandId = testEndLine + '_lv' + eLv;
                if (typeof isItemCompletedMaxTimes === 'function' && isItemCompletedMaxTimes(eCandId)) continue;
                testCands.push(eLv);
            }
            if (testCands.length > 0) {
                testCands.sort(function (lvA, lvB) {
                    return recentOrders.lastIndexOf(testEndLine + '_lv' + lvA) - recentOrders.lastIndexOf(testEndLine + '_lv' + lvB);
                });
                chosenEndLine = testEndLine;
                chosenEndLv = testCands[0];
                break;
            }
        }
        if (!chosenEndLine) {
            // Khi toàn bộ item đều đã đạt trần hoàn thành, xoay vòng qua các item trung cấp (Lv.3..6) ít xuất hiện nhất
            var endCandidatesAll = [];
            sortedEndLines.forEach(function (ln) {
                var mCap = (typeof getItemMaxLevel === 'function') ? getItemMaxLevel(ln) : 12;
                for (var l = 3; l <= Math.min(mCap, 6); l++) {
                    endCandidatesAll.push({ line: ln, level: l, id: ln + '_lv' + l });
                }
            });
            endCandidatesAll.sort(function (a, b) {
                return (recentOrders.lastIndexOf(a.id) || 0) - (recentOrders.lastIndexOf(b.id) || 0);
            });
            chosenEndLine = (endCandidatesAll[0] && endCandidatesAll[0].line) || sortedEndLines[0] || 'ban';
            chosenEndLv = (endCandidatesAll[0] && endCandidatesAll[0].level) || 3;
        }
        chosenEntry = {
            line: chosenEndLine,
            nextLv: chosenEndLv,
            maxLv: (typeof getItemMaxLevel === 'function') ? getItemMaxLevel(chosenEndLine) : 12
        };
    }

    var chosenBranch = chosenEntry.line;
    var chosenLv = chosenEntry.nextLv;
    var chosenItemId = chosenBranch + '_lv' + chosenLv;

    // Cơ chế lặp lại 2 lần cho Chiếc Ghế ở Slot 1 (cách nhau đúng 3 nhiệm vụ):
    // Lần 1: Thiết lập bộ đếm 3 nhiệm vụ đệm (gapRemaining: 3), chưa đưa vào slot1CompletedIds
    if (sIdx === 0 && chosenBranch === 'ghe') {
        SAVE.slot1ChairRepeat = {
            itemId: chosenItemId,
            gapRemaining: 3
        };
        SAVE.slot1BranchLevelMap[chosenBranch] = Math.max(SAVE.slot1BranchLevelMap[chosenBranch] || 1, chosenLv);
        SAVE.slot1RecentBranches.push(chosenBranch);
        if (SAVE.slot1RecentBranches.length > 40) {
            SAVE.slot1RecentBranches = SAVE.slot1RecentBranches.slice(-40);
        }
        if (typeof recordHistoricalOrderedItem === 'function') {
            recordHistoricalOrderedItem(chosenItemId);
        }
        return chosenItemId;
    }

    // Ghi nhận tiến trình không lặp lại cho các nhánh khác (hoặc Slot khác)
    SAVE.slot1BranchLevelMap[chosenBranch] = Math.max(SAVE.slot1BranchLevelMap[chosenBranch] || 1, chosenLv);
    SAVE.slot1RecentBranches.push(chosenBranch);
    if (SAVE.slot1RecentBranches.length > 40) {
        SAVE.slot1RecentBranches = SAVE.slot1RecentBranches.slice(-40);
    }
    if (SAVE.slot1CompletedIds.indexOf(chosenItemId) === -1) {
        SAVE.slot1CompletedIds.push(chosenItemId);
    }
    if (typeof recordHistoricalOrderedItem === 'function') {
        recordHistoricalOrderedItem(chosenItemId);
    }

    return chosenItemId;
}

// =============================================================================
// HÀM SINH NHIỆM VỤ SLOT 2 (HỒI CỨU / BACKLOG DISCOVERY):
// - Quét lại các item CHƯA TỪNG ĐƯỢC LÀM NHIỆM VỤ (có cấp thấp hơn Slot 1).
// - Khác hoàn toàn nhánh với Slot 1.
// - Ưu tiên các item cấp thấp hơn trước (Lv.2 -> Lv.3...), ưu tiên nhánh có sẵn đồ trên bàn.
// - Nếu toàn bộ item cấp thấp đã từng làm nhiệm vụ: fallback chọn item lâu nhất chưa xuất hiện lại.
// - Tuyệt đối KHÔNG ghi đè hay can thiệp vào slot1BranchLevelMap / slot1CompletedIds!
// =============================================================================
function pickBacklogSlot2Item(board, slot1Id, activeLines, activeGens, boardStats, orderNum) {
    var b = board || (typeof boardData !== 'undefined' ? boardData : null);
    var lines = (Array.isArray(activeLines) && activeLines.length > 0)
        ? activeLines.slice()
        : ['ban', 'ghe', 'trai'];
    var slot1Line = slot1Id ? ((typeof itemLine === 'function') ? itemLine(slot1Id) : slot1Id.split('_lv')[0]) : '';
    var slot1Lv = slot1Id ? ((typeof itemLevel === 'function') ? itemLevel(slot1Id) : (parseInt((slot1Id.match(/_lv(\d+)$/) || [])[1], 10) || 0)) : 0;

    // Nhánh ứng viên cho Slot 2: khác nhánh với Slot 1
    var candidateLines = lines.filter(function (ln) { return ln !== slot1Line; });
    if (candidateLines.length === 0) candidateLines = lines.slice();

    // Giới hạn cấp độ: bắt buộc thấp hơn Slot 1 (lv < slot1Lv, tối thiểu Lv.2). Nếu Slot 1 nghỉ (slot1Id null), cho phép tới Lv.6
    var maxAllowedLv = slot1Lv > 0 ? Math.max(2, slot1Lv - 1) : 6;

    var stats = boardStats || getBoardBranchStats(b, lines);
    var recentOrders = (typeof SAVE !== 'undefined' && SAVE && Array.isArray(SAVE.recentOrdersHistory))
        ? SAVE.recentOrdersHistory
        : [];
    var recentBranches = (typeof SAVE !== 'undefined' && SAVE && Array.isArray(SAVE.recentBranchHistory))
        ? SAVE.recentBranchHistory
        : [];

    var uncompletedCandidates = [];
    var allAllowedCandidates = [];

    candidateLines.forEach(function (ln) {
        var maxLineCap = (typeof getItemMaxLevel === 'function') ? getItemMaxLevel(ln) : 12;
        var branchCap = Math.min(maxLineCap, maxAllowedLv);
        for (var l = 2; l <= branchCap; l++) {
            var candId = ln + '_lv' + l;
            // KIỂM TRA KHO ĐỒ CẮM TRẠI: Đã hoàn thành quá 3 lần thì không thực hiện lại
            if (typeof isItemCompletedMaxTimes === 'function' && isItemCompletedMaxTimes(candId)) {
                continue;
            }
            allAllowedCandidates.push({ line: ln, level: l, id: candId });
            var alreadyDone = (typeof isItemEverOrdered === 'function')
                ? isItemEverOrdered(candId)
                : ((typeof SAVE !== 'undefined' && SAVE && Array.isArray(SAVE.slot1CompletedIds)) ? (SAVE.slot1CompletedIds.indexOf(candId) !== -1) : false);
            if (!alreadyDone) {
                uncompletedCandidates.push({ line: ln, level: l, id: candId });
            }
        }
    });

    var chosenCand = null;

    if (uncompletedCandidates.length > 0) {
        // Ưu tiên:
        // 1. Cấp thấp hơn trước (Lv.2, Lv.3... chưa từng làm)
        // 2. Nhánh đang có sẵn đồ trên bàn
        // 3. Nhánh lâu chưa xuất hiện trong recentBranches
        uncompletedCandidates.sort(function (a, bEntry) {
            if (a.level !== bEntry.level) {
                return a.level - bEntry.level;
            }
            var onBoardA = (stats && stats.unlockedCountByLine) ? (stats.unlockedCountByLine[a.line] || 0) : 0;
            var onBoardB = (stats && stats.unlockedCountByLine) ? (stats.unlockedCountByLine[bEntry.line] || 0) : 0;
            if (onBoardA !== onBoardB) {
                return onBoardB - onBoardA;
            }
            var idxA = recentBranches.lastIndexOf(a.line);
            var idxB = recentBranches.lastIndexOf(bEntry.line);
            return idxA - idxB;
        });
        chosenCand = uncompletedCandidates[0];
    } else if (allAllowedCandidates.length > 0) {
        // Fallback: Khi toàn bộ item cấp thấp đã từng được làm nhiệm vụ ít nhất 1 lần
        // Chọn item lâu nhất chưa xuất hiện lại trong lịch sử (hoặc ít xuất hiện nhất)
        allAllowedCandidates.sort(function (a, bEntry) {
            var idxA = recentOrders.lastIndexOf(a.id);
            var idxB = recentOrders.lastIndexOf(bEntry.id);
            if (idxA !== idxB) {
                return idxA - idxB;
            }
            if (a.level !== bEntry.level) {
                return a.level - bEntry.level;
            }
            var onBoardA = (stats && stats.unlockedCountByLine) ? (stats.unlockedCountByLine[a.line] || 0) : 0;
            var onBoardB = (stats && stats.unlockedCountByLine) ? (stats.unlockedCountByLine[bEntry.line] || 0) : 0;
            return onBoardB - onBoardA;
        });
        chosenCand = allAllowedCandidates[0];
    } else {
        // Fallback an toàn: quét toàn bộ candidateLines tìm món chưa đạt trần hoàn thành
        var fallbackCand = null;
        for (var cIdx = 0; cIdx < candidateLines.length; cIdx++) {
            var fbLine = candidateLines[cIdx];
            var fbMax = (typeof getItemMaxLevel === 'function') ? getItemMaxLevel(fbLine) : 12;
            for (var fLv = 2; fLv <= Math.min(fbMax, 6); fLv++) {
                var testFbId = fbLine + '_lv' + fLv;
                if (typeof isItemCompletedMaxTimes !== 'function' || !isItemCompletedMaxTimes(testFbId)) {
                    fallbackCand = { line: fbLine, level: fLv, id: testFbId };
                    break;
                }
            }
            if (fallbackCand) break;
        }
        if (!fallbackCand) {
            var defaultLine = candidateLines[0] || 'ghe';
            fallbackCand = { line: defaultLine, level: 2, id: defaultLine + '_lv2' };
        }
        chosenCand = fallbackCand;
    }

    var chosenItemId = chosenCand.id;
    if (typeof recordHistoricalOrderedItem === 'function') {
        recordHistoricalOrderedItem(chosenItemId);
    }
    recordItemInRecentOrdersHistory(chosenItemId);
    return chosenItemId;
}

// =============================================================================
// HÀM SINH NHIỆM VỤ SLOT 3 (VAN XẢ / DỌN BÀN VẬT PHẨM DƯ THỪA TRÊN BÀN):
// - Quét trực tiếp bàn chơi tìm vật phẩm dư thừa nhiều nhất (trùng lặp) trên bàn cờ.
// - Khác hoàn toàn nhánh với Slot 1 và Slot 2.
// - Nếu vật phẩm dư thừa nhiều nhất là Level 1 (ví dụ 4 cái Lv.1): yêu cầu Level 2 để ghép dọn ngay!
// - Nếu là Level >= 2: yêu cầu chính xác item đó (khống chế không vượt trần quá cao so với Slot 1).
// - Nếu bàn sạch không có đồ thừa: fallback về item dễ/cấp thấp của nhánh thứ 3.
// =============================================================================
function pickBoardExcessSlot3Item(board, slot1Id, slot2Id, activeLines, activeGens, boardStats, orderNum) {
    var b = board || (typeof boardData !== 'undefined' ? boardData : null);
    var lines = (Array.isArray(activeLines) && activeLines.length > 0)
        ? activeLines.slice()
        : ['ban', 'ghe', 'trai'];
    var line0 = slot1Id ? ((typeof itemLine === 'function') ? itemLine(slot1Id) : slot1Id.split('_lv')[0]) : '';
    var line1 = slot2Id ? ((typeof itemLine === 'function') ? itemLine(slot2Id) : slot2Id.split('_lv')[0]) : '';
    var lv0 = slot1Id ? ((typeof itemLevel === 'function') ? itemLevel(slot1Id) : (parseInt((slot1Id.match(/_lv(\d+)$/) || [])[1], 10) || 0)) : 0;

    // Nhánh ứng viên cho Slot 3: loại trừ cả Slot 1 và Slot 2
    var candidateLines = lines.filter(function (ln) { return ln !== line0 && ln !== line1; });
    if (candidateLines.length === 0) {
        candidateLines = lines.filter(function (ln) { return ln !== line0; });
    }
    if (candidateLines.length === 0) {
        candidateLines = lines.slice();
    }

    var stats = boardStats || getBoardBranchStats(b, lines);
    var recentOrders = (typeof SAVE !== 'undefined' && SAVE && Array.isArray(SAVE.recentOrdersHistory))
        ? SAVE.recentOrdersHistory
        : [];
    var recentBranches = (typeof SAVE !== 'undefined' && SAVE && Array.isArray(SAVE.recentBranchHistory))
        ? SAVE.recentBranchHistory
        : [];

    // Quét trực tiếp boardData đếm số lượng từng item ID trên bàn
    // Chỉ đếm các ô mở khóa (unlocked, không đá, không mạng nhện/băng, không phải máy phát)
    var boardItemCounts = {};
    if (Array.isArray(b)) {
        b.forEach(function (cell) {
            if (!cell || !cell.id) return;
            if (cell.type === 'rock' || cell.isRock || cell.locked || cell.ice || cell.isGenerator) return;
            var itId = cell.id;
            var ln = (typeof itemLine === 'function') ? itemLine(itId) : itId.split('_lv')[0];
            if (candidateLines.indexOf(ln) !== -1) {
                boardItemCounts[itId] = (boardItemCounts[itId] || 0) + 1;
            }
        });
    }

    var maxSlot3Lv = lv0 > 0 ? Math.max(3, lv0) : 6;
    var excessCandidates = [];

    Object.keys(boardItemCounts).forEach(function (itId) {
        var count = boardItemCounts[itId];
        var ln = (typeof itemLine === 'function') ? itemLine(itId) : itId.split('_lv')[0];
        var lv = (typeof itemLevel === 'function') ? itemLevel(itId) : (parseInt((itId.match(/_lv(\d+)$/) || [])[1], 10) || 1);
        var maxLineCap = (typeof getItemMaxLevel === 'function') ? getItemMaxLevel(ln) : 12;

        var targetId = itId;
        var targetLv = lv;

        if (lv === 1) {
            // Trên bàn dư nhiều Level 1: giao Level 2 để người chơi ghép giải phóng ô cờ tức thì!
            targetLv = 2;
            targetId = ln + '_lv2';
        } else if (targetLv > maxSlot3Lv) {
            targetLv = Math.min(maxLineCap, maxSlot3Lv);
            targetId = ln + '_lv' + targetLv;
        }

        // KIỂM TRA KHO ĐỒ CẮM TRẠI: Đã hoàn thành quá 3 lần thì không thực hiện lại
        if (typeof isItemCompletedMaxTimes === 'function' && isItemCompletedMaxTimes(targetId)) {
            return;
        }

        excessCandidates.push({
            origId: itId,
            targetId: targetId,
            line: ln,
            count: count,
            level: targetLv
        });
    });

    var chosenItemId = null;

    if (excessCandidates.length > 0) {
        // Sắp xếp:
        // 1. Số lượng xuất hiện trên bàn cao nhất (count lớn nhất) để dọn bàn nhanh nhất
        // 2. Cùng số lượng: ưu tiên level thấp hơn
        // 3. Ít xuất hiện trong recentOrders gần đây
        excessCandidates.sort(function (a, bEntry) {
            if (a.count !== bEntry.count) {
                return bEntry.count - a.count;
            }
            if (a.level !== bEntry.level) {
                return a.level - bEntry.level;
            }
            var idxA = recentOrders.lastIndexOf(a.targetId);
            var idxB = recentOrders.lastIndexOf(bEntry.targetId);
            return idxA - idxB;
        });

        chosenItemId = excessCandidates[0].targetId;
    }

    // Nếu trên bàn hoàn toàn không có đồ nào thuộc candidateLines:
    if (!chosenItemId) {
        var rankedLines = candidateLines.slice().sort(function (a, bLn) {
            var idxA = recentBranches.lastIndexOf(a);
            var idxB = recentBranches.lastIndexOf(bLn);
            return idxA - idxB;
        });
        for (var rIdx = 0; rIdx < rankedLines.length; rIdx++) {
            var fallbackLine = rankedLines[rIdx];
            var fallbackMax = (typeof getItemMaxLevel === 'function') ? getItemMaxLevel(fallbackLine) : 12;
            for (var fbLv = 2; fbLv <= Math.min(fallbackMax, 6); fbLv++) {
                var candFbId = fallbackLine + '_lv' + fbLv;
                if (typeof isItemCompletedMaxTimes !== 'function' || !isItemCompletedMaxTimes(candFbId)) {
                    chosenItemId = candFbId;
                    break;
                }
            }
            if (chosenItemId) break;
        }
        if (!chosenItemId) {
            chosenItemId = (candidateLines[0] || 'trai') + '_lv2';
        }
    }

    if (typeof recordHistoricalOrderedItem === 'function') {
        recordHistoricalOrderedItem(chosenItemId);
    }
    recordItemInRecentOrdersHistory(chosenItemId);
    return chosenItemId;
}

// Tính toán số lượt đơn hàng BỎ TRỐNG Slot 1 (khoảng nghỉ Tension & Release) theo cấp độ vừa xong
function getSlot1RestOrdersForLevel(lv) {
    var l = parseInt(lv, 10) || 1;
    if (l <= 4) return 0;
    if (l <= 6) return 1;
    if (l <= 8) return 2;
    if (l <= 10) return 3;
    if (l === 11) return 4;
    return 5; // Lv.12+
}
window.getSlot1RestOrdersForLevel = getSlot1RestOrdersForLevel;

// Sinh danh sách item theo kịch bản 3 Slot phân vai rõ ràng:
// - Slot 1: Kịch bản chính cố định, tăng dần / xoay vòng không lặp lại (có khoảng nghỉ sau các món cấp cao).
// - Slot 2: Nhiệm vụ hồi cứu quét lại các item chưa từng làm nhiệm vụ (có cấp thấp hơn Slot 1).
// - Slot 3: Van xả dọn bàn quét vật phẩm dư thừa nhiều nhất trên bàn cờ.
// - Cả 3 Slot bắt buộc thuộc các nhánh khác nhau và không thực hiện lại item đã có >= 3 lần trong kho cắm trại!
function generateDynamicOrderItems(board, orderNum, existingIds, activeGens) {
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
    var numSlots = getOrderSlotCount(orderNum);

    var numGens = gens.length;
    var minGap = (numGens === 1) ? 1 : ((numGens === 2) ? 3 : 6);

    // Không vượt quá số nhánh hoạt động hiện có
    numSlots = Math.min(numSlots, activeLines.length);

    var chosenLines = [];
    var items = [];

    // KIỂM TRA KHOẢNG NGHỈ CHO SLOT 1 (TENSION & RELEASE):
    // Khi đang trong đợt nghỉ: Bỏ trống Slot 1, chỉ giao Slot 2 & Slot 3 để người chơi xả đồ thừa & dọn bàn
    var isRestOrder = false;
    if (typeof SAVE !== 'undefined' && SAVE && typeof SAVE.slot1RestCooldown === 'number' && SAVE.slot1RestCooldown > 0) {
        SAVE.slot1RestCooldown--;
        isRestOrder = true;
    }

    if (!isRestOrder) {
        // 1. SLOT 1: Trụ cột kịch bản đi đều qua các chuỗi và tăng dần cấp độ không lặp lại
        var item0 = pickScriptedSlot1MainQuestItem(b, orderNum, activeLines, gens, chosenLines, stats, 0);
        var line0 = (typeof itemLine === 'function') ? itemLine(item0) : item0.split('_lv')[0];
        chosenLines.push(line0);
        items.push(item0);

        // 2. SLOT 2: Quét lại các item chưa từng được làm nhiệm vụ (cấp thấp hơn Slot 1, khác nhánh Slot 1)
        if (numSlots >= 2) {
            var item1 = pickBacklogSlot2Item(b, item0, activeLines, gens, stats, orderNum);
            var line1 = (typeof itemLine === 'function') ? itemLine(item1) : item1.split('_lv')[0];
            chosenLines.push(line1);
            items.push(item1);
        }

        // 3. SLOT 3: Van xả dọn bàn quét vật phẩm dư thừa nhiều nhất trên bàn (khác hoàn toàn nhánh Slot 1 & 2)
        if (numSlots >= 3) {
            var item2 = pickBoardExcessSlot3Item(b, item0, items[1], activeLines, gens, stats, orderNum);
            var line2 = (typeof itemLine === 'function') ? itemLine(item2) : item2.split('_lv')[0];
            chosenLines.push(line2);
            items.push(item2);
        }
    } else {
        // TRONG ĐƠN NGHỈ CHÂN: Bỏ trống Slot 1, chỉ giao Slot 2 và Slot 3
        var restItem1 = pickBacklogSlot2Item(b, null, activeLines, gens, stats, orderNum);
        var restLine1 = (typeof itemLine === 'function') ? itemLine(restItem1) : restItem1.split('_lv')[0];
        chosenLines.push(restLine1);
        items.push(restItem1);

        if (numSlots >= 2) {
            var restItem2 = pickBoardExcessSlot3Item(b, null, restItem1, activeLines, gens, stats, orderNum);
            var restLine2 = (typeof itemLine === 'function') ? itemLine(restItem2) : restItem2.split('_lv')[0];
            chosenLines.push(restLine2);
            items.push(restItem2);
        }
    }

    // BẢO VỆ TUYỆT ĐỐI CHO CẢ 3 SLOT: Nếu item nào đã hoàn thành quá số lần cho phép trong kho cắm trại -> Đổi sang item hợp lệ
    for (var idx = 0; idx < items.length; idx++) {
        var itId = items[idx];
        if (typeof isItemCompletedMaxTimes === 'function' && isItemCompletedMaxTimes(itId)) {
            var replaced = false;
            // 1. Thử tìm item chưa đạt trần trong cùng nhánh
            var bLn = (typeof itemLine === 'function') ? itemLine(itId) : itId.split('_lv')[0];
            var maxLineLv = (typeof getItemMaxLevel === 'function') ? getItemMaxLevel(bLn) : 12;
            for (var sLv = 2; sLv <= maxLineLv; sLv++) {
                var testId = bLn + '_lv' + sLv;
                if (!isItemCompletedMaxTimes(testId) && items.indexOf(testId) === -1) {
                    items[idx] = testId;
                    replaced = true;
                    break;
                }
            }
            // 2. Nếu cả nhánh bLn đều đã đạt trần hoàn thành, quét qua tất cả các nhánh khác trong activeLines
            if (!replaced) {
                for (var aIdx = 0; aIdx < activeLines.length; aIdx++) {
                    var otherLn = activeLines[aIdx];
                    var otherMax = (typeof getItemMaxLevel === 'function') ? getItemMaxLevel(otherLn) : 12;
                    for (var oLv = 2; oLv <= otherMax; oLv++) {
                        var oTestId = otherLn + '_lv' + oLv;
                        if (!isItemCompletedMaxTimes(oTestId) && items.indexOf(oTestId) === -1) {
                            items[idx] = oTestId;
                            chosenLines[idx] = otherLn;
                            replaced = true;
                            break;
                        }
                    }
                    if (replaced) break;
                }
            }
            // 3. Khi toàn bộ kho đồ game (240 lần hoàn thành) đã làm hết, xoay vòng đều qua các item trung cấp (Lv.3..6)
            if (!replaced) {
                var allEligible = [];
                activeLines.forEach(function (ln) {
                    var mCap = (typeof getItemMaxLevel === 'function') ? getItemMaxLevel(ln) : 12;
                    for (var l = 3; l <= Math.min(mCap, 6); l++) {
                        var cId = ln + '_lv' + l;
                        if (items.indexOf(cId) === -1) allEligible.push(cId);
                    }
                });
                if (allEligible.length > 0) {
                    var recentOrdersMRU = (typeof SAVE !== 'undefined' && SAVE && Array.isArray(SAVE.recentOrdersHistory)) ? SAVE.recentOrdersHistory : [];
                    allEligible.sort(function (idA, idB) {
                        return (recentOrdersMRU.lastIndexOf(idA) || 0) - (recentOrdersMRU.lastIndexOf(idB) || 0);
                    });
                    items[idx] = allEligible[0];
                    chosenLines[idx] = (typeof itemLine === 'function') ? itemLine(allEligible[0]) : allEligible[0].split('_lv')[0];
                }
            }
        }
    }

    // Cập nhật lại SAVE.recentOrdersHistory (MRU)
    if (typeof SAVE !== 'undefined' && SAVE) {
        items.forEach(function (itmId) {
            recordItemInRecentOrdersHistory(itmId);
        });
    }

    return {
        lines: chosenLines,
        items: items,
        stats: stats,
        minGap: minGap,
        slotCount: items.length,
        isRestOrder: isRestOrder
    };
}

// Giữ alias cho tương thích ngược
function generateDynamic3SlotOrderItems(board, orderNum, existingIds, activeGens) {
    return generateDynamicOrderItems(board, orderNum, existingIds, activeGens);
}

// =============================================================================
// HÀM SINH NHIỆM VỤ SLOT 3 (VAN XẢ / DỌN BÀN THÔNG MINH):
// Quét toàn bộ bàn chơi xem nhánh nào đang chiếm nhiều ô nhất (CHỈ TÍNH ITEM KHÔNG BỊ MẠNG NHỆN):
// -> Tạo nhiệm vụ cho nhánh đó với level phù hợp, chống lặp nhánh & chống lặp item liên tục!
// =============================================================================
function pickCrowdedBranchSlot3Item(board, chosenLine1, chosenLine2, item0, item1, orderNum, stats, activeLines) {
    var b = board || (typeof boardData !== 'undefined' ? boardData : null);
    var lines = Array.isArray(activeLines) && activeLines.length ? activeLines : ['ban', 'ghe', 'trai'];
    var branchStats = stats || getBoardBranchStats(b, lines);

    // Khi có từ 3 nhánh hoạt động trở lên: Slot 3 BẮT BUỘC phải là nhánh thứ 3 (khác hoàn toàn Slot 1 & Slot 2)
    var availableLines = lines.slice();
    if (lines.length >= 3) {
        var unchosen = lines.filter(function (ln) { return ln !== chosenLine1 && ln !== chosenLine2; });
        if (unchosen.length > 0) availableLines = unchosen;
    }

    var recentBranches = (typeof SAVE !== 'undefined' && SAVE && Array.isArray(SAVE.recentBranchHistory))
        ? SAVE.recentBranchHistory
        : [];
    var last6Branches = recentBranches.slice(-6);

    // Xếp hạng các nhánh kết hợp giữa số ô chiếm dụng trên bàn và tần suất xuất hiện gần đây (chống lặp nhánh)
    var ranked = availableLines.slice().sort(function (a, bLn) {
        var countA = branchStats.unlockedCountByLine ? (branchStats.unlockedCountByLine[a] || 0) : 0;
        var countB = branchStats.unlockedCountByLine ? (branchStats.unlockedCountByLine[bLn] || 0) : 0;
        var appA = last6Branches.filter(function (x) { return x === a; }).length;
        var appB = last6Branches.filter(function (x) { return x === bLn; }).length;

        var scoreA = Math.min(countA * 10, 35) - (appA * 35);
        var scoreB = Math.min(countB * 10, 35) - (appB * 35);
        if (scoreA !== scoreB) return scoreB - scoreA;

        var lastIdxA = recentBranches.lastIndexOf(a);
        var lastIdxB = recentBranches.lastIndexOf(bLn);
        if (lastIdxA !== lastIdxB) return lastIdxA - lastIdxB;

        var maxLvA = branchStats.maxUnlockedLvByLine ? (branchStats.maxUnlockedLvByLine[a] || 0) : 0;
        var maxLvB = branchStats.maxUnlockedLvByLine ? (branchStats.maxUnlockedLvByLine[bLn] || 0) : 0;
        return maxLvB - maxLvA;
    });

    var chosenLine = ranked[0] || 'trai';
    var targetItemId = computeDynamicOrderItemForBranch(chosenLine, branchStats, null, 2, orderNum, [item0, item1].filter(Boolean));
    var targetLv = (typeof itemLevel === 'function') ? itemLevel(targetItemId) : (parseInt((targetItemId.match(/_lv(\d+)$/) || [])[1], 10) || 2);

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

// Sinh vật phẩm động cho Slot 2 (Bắt buộc khác nhánh với Slot 1, ưu tiên backlog item chưa từng làm nhiệm vụ)
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
    var stats = getBoardBranchStats(b, activeLines);
    return pickBacklogSlot2Item(b, slot1Id, activeLines, gens, stats, orderNum);
}

// Sinh vật phẩm động cho Slot 3 (Quét bàn chơi tìm item dư thừa nhiều nhất để dọn bàn)
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
    var stats = getBoardBranchStats(b, activeLines);
    return pickBoardExcessSlot3Item(b, slot1Id, slot2Id, activeLines, gens, stats, orderNum);
}

// Quét bàn cờ để tạo nhiệm vụ DỌN BÀN (2 nhiệm vụ liên tiếp quét sạch vật phẩm của túi đồ cũ khi vừa kéo túi đồ mới ra bàn)
// Đảm bảo Slot 1 tiếp tục chuỗi kịch bản không lặp lại, còn Slot 2 & 3 quét dọn đồ cũ trên bàn
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

    // Slot 1 đi theo kịch bản không lặp lại trong nhóm nhánh cũ
    var slot1Item = pickScriptedSlot1MainQuestItem(b, orderNum, oldLines, oldGens);
    var chosenIds = [slot1Item];

    // Slot 2: Nhiệm vụ hồi cứu quét item chưa làm cấp thấp hơn Slot 1
    if (oldLines.length >= 2) {
        var s2 = pickBacklogSlot2Item(b, slot1Item, oldLines, oldGens, stats, orderNum);
        chosenIds.push(s2);
    }
    // Slot 3: Quét item dư thừa nhiều nhất trên bàn
    if (oldLines.length >= 3) {
        var s3 = pickBoardExcessSlot3Item(b, slot1Item, chosenIds[1], oldLines, oldGens, stats, orderNum);
        chosenIds.push(s3);
    }

    var cleanupDialogue = getPetOrderDialogue(chosenIds[0]);

    var orders = chosenIds.map(function (itemId, sIdx) {
        var slotName = (sIdx === 0) ? 'hard' : ((sIdx === 1) ? 'medium' : 'easy');
        var goldRw = (typeof orderReward === 'function') ? orderReward(itemId) : 50;
        var expRw = (typeof orderExp === 'function')
            ? orderExp(itemId)
            : ((typeof window !== 'undefined' && typeof window.orderExp === 'function')
                ? window.orderExp(itemId)
                : ((typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.itemExpByLevel)
                    ? (GAME_CONFIG.itemExpByLevel[parseInt(String(itemId).split('_lv')[1]) || 1] || 25)
                    : 25));
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

// Sau khi hoàn thành 2 nhiệm vụ dọn bàn: Giao ngay nhiệm vụ mở màn cho túi đồ mới, tất cả 3 nhánh túi mới ghi nhận vào tiến trình không lặp lại
function buildNewGenIntroOrderGroup(newGenId, orderNum, petId, board, existingIds) {
    var pId = petId || 'character01';
    var b = board || (typeof boardData !== 'undefined' ? boardData : null);
    var newLines = GENERATOR_BRANCH_MAP[newGenId] ? GENERATOR_BRANCH_MAP[newGenId].slice() : ['an', 'cafe', 'congcu'];

    var introIds = [];
    newLines.slice(0, 3).forEach(function (ln) {
        var it = pickScriptedSlot1MainQuestItem(b, orderNum, [ln], [newGenId]);
        introIds.push(it);
        recordItemInRecentOrdersHistory(it);
    });

    var introDialogue = getPetOrderDialogue(introIds[0]);

    var orders = introIds.map(function (itemId, sIdx) {
        var slotName = (sIdx === 0) ? 'hard' : ((sIdx === 1) ? 'medium' : 'easy');
        var goldRw = (typeof orderReward === 'function') ? orderReward(itemId) : 50;
        var expRw = (typeof orderExp === 'function')
            ? orderExp(itemId)
            : ((typeof window !== 'undefined' && typeof window.orderExp === 'function')
                ? window.orderExp(itemId)
                : ((typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.itemExpByLevel)
                    ? (GAME_CONFIG.itemExpByLevel[parseInt(String(itemId).split('_lv')[1]) || 1] || 25)
                    : 25));
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

// Tạo lời thoại ngữ cảnh khớp 100% với vật phẩm trụ cột ở Slot 1 (ngắn gọn 1 câu <= 80 ký tự, không gắn cứng địa điểm)
function getDynamicOrderContextDialogue(finalIds, orderNum, board) {
    var primaryId = (Array.isArray(finalIds) && finalIds[0]) ? finalIds[0] : 'ban_lv2';
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

    // Sinh các Slot hoàn toàn linh động theo nhịp điệu (1, 2 hoặc 3 món): 100% không trùng nhánh
    var genResult = generateDynamicOrderItems(b, orderNum, existingIds, activeGens);
    var finalIds = genResult.items;
    var isRest = !!genResult.isRestOrder;
    var contextDialogue = isRest
        ? "Đơn hàng nghỉ chân! Cùng thư giãn và thu dọn một chút đồ đạc nhé!"
        : getDynamicOrderContextDialogue(finalIds, orderNum, b);

    var orders = finalIds.map(function (itemId, sIdx) {
        var slotName = isRest
            ? ((sIdx === 0) ? 'medium' : 'easy')
            : ((sIdx === 0) ? 'hard' : ((sIdx === 1) ? 'medium' : 'easy'));
        var goldRw = (typeof orderReward === 'function') ? orderReward(itemId) : 50;
        var expRw = (typeof orderExp === 'function')
            ? orderExp(itemId)
            : ((typeof window !== 'undefined' && typeof window.orderExp === 'function')
                ? window.orderExp(itemId)
                : ((typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.itemExpByLevel)
                    ? (GAME_CONFIG.itemExpByLevel[parseInt(String(itemId).split('_lv')[1]) || 1] || 25)
                    : 25));
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
        isRestOrder: isRest,
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

        // Đơn hàng khi đã xuất hiện trên khay thì CỐ ĐỊNH 100%, người chơi nộp xong mới chuyển sang nhóm mới.
        // Giữ nguyên vẹn item đã sinh (Slot 1 cốt truyện, Slot 2 hồi cứu, Slot 3 van xả dọn bàn), không đè lại cấp độ!
        // Đồng bộ lời thoại khớp 100% với vật phẩm trụ cột ở Slot 1:
        var curIds = g.orders.map(function (o) { return o && o.id; }).filter(Boolean);
        if (curIds.length > 0) {
            g.contextDialogue = getDynamicOrderContextDialogue(curIds, targetOrderNum, b);
        }

        g.orders.forEach(function (o) { if (o && o.id) existingIds.push(o.id); });
        return g;
    }).filter(Boolean);

    // 2. Nếu chưa có nhóm thú cưng (mới vào game hoặc vừa nộp xong), sinh 1 đơn mới cho activePet:
    var hasNewGroupGenerated = false;
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
            hasNewGroupGenerated = true;
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
        hasNewGroupGenerated = true;
    }

    // Lưu ngay lập tức vào bộ nhớ thiết bị (localStorage) để khi reload trình duyệt
    // bộ nhiệm vụ vừa sinh KHÔNG bao giờ bị thay đổi hay tái tạo lại!
    if (hasNewGroupGenerated && typeof saveGame === 'function') {
        saveGame(true);
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
            rockVariant: getRockCellVariant(idx),
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
            rockVariant: getRockCellVariant(idx),
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
    window.getOrderSlotCount = getOrderSlotCount;
    window.generateDynamicOrderItems = generateDynamicOrderItems;
    window.generateDynamic3SlotOrderItems = generateDynamic3SlotOrderItems;
    window.pickDynamicSlot1Item = pickDynamicSlot1Item;
    window.pickDynamicSlot2Item = pickDynamicSlot2Item;
    window.pickDynamicSlot3Item = pickDynamicSlot3Item;
    window.pickBacklogSlot2Item = pickBacklogSlot2Item;
    window.pickBoardExcessSlot3Item = pickBoardExcessSlot3Item;
    window.pickCrowdedBranchSlot3Item = pickCrowdedBranchSlot3Item;
    window.applyLiveHybridAdaptations = applyLiveHybridAdaptations;
    window.ROCK_CELL_VARIANTS_MAP = ROCK_CELL_VARIANTS_MAP;
    window.getRockCellVariant = getRockCellVariant;
    window.getCuratedOrderGroup = getCuratedOrderGroup;
    window.generatePetOrderGroup = generatePetOrderGroup;
    window.ensurePetOrderGroups = ensurePetOrderGroups;
}
