// ==========================================
// ENGINE: LUẬT CHƠI THUẦN (không đụng DOM)
// Dùng chung cho game (board.js) và bot mô phỏng (tools/sim.js)
// ==========================================

var COLS = 7;
var ROWS = 9;
var TOTAL_CELLS = COLS * ROWS;
var MAX_ITEM_LV = 8;
var BONUS_MIN_LV = 4; // ghép ra cấp này trở lên mới có quà (level có cờ bonus)
var BONUS_CHANCE = 0.55; // xác suất nổ quà tiếp tế khi ghép ra item Lv4+

var GENERATORS = {
    'generator_backpack': ['trai_lv1', 'tham_lv1', 'ghe_lv1'],
    'generator_crate': ['bep_lv1', 'congcu_lv1', 'antoan_lv1'],
    'generator_cooler': ['an_lv1', 'ban_lv1', 'cafe_lv1']
};

var PATTERNS = {
    box5x5: (r, c) => (c === 0 || c === 6 || r <= 1 || r >= 7),
    box5x7: (r, c) => (c === 0 || c === 6 || r === 0 || r === 8),
    rounded: (r, c) => (r === 0 || r === 8 || ((r === 1 || r === 7) && (c === 0 || c === 6))),
    cross: (r, c) => ((r <= 1 || r >= 7) && (c <= 1 || c >= 5)),
    hourglass: (r, c) => (r === 0 || r === 8 || (r >= 3 && r <= 5 && (c === 0 || c === 6)) || (r === 4 && (c === 1 || c === 5))),
    pillars: (r, c) => (r === 0 || r === 8 || ((r === 2 || r === 6) && (c === 2 || c === 4))),
    valley: (r, c) => (c === 0 || c === 6 || ((c === 1 || c === 5) && (r === 0 || r === 4 || r === 8))),
    islands: (r, c) => (r === 0 || r === 8 || (r === 4 && c !== 3)),
    fortress: (r, c) => (c === 0 || c === 6 || r === 0 || r === 8 || (r === 4 && c === 3)),
    open: (r, c) => ((r === 0 || r === 8) && (c === 0 || c === 6))
};

// Hàm random có thể bị thay thế (bot mô phỏng dùng random có seed)
var rand = Math.random;

function itemLine(id) { return id.split('_lv')[0]; }
function itemLv(id) { return parseInt(id.split('_lv')[1]) || 1; }
function makeEmptyCell() { return { id: null, isRock: false, isLocked: false }; }

// Dựng bàn cờ 63 ô từ cấu hình level (getLevelConfig trong js/data.js)
function buildBoard(level) {
    var patFn = PATTERNS[level.pattern] || PATTERNS.box5x5;
    var board = new Array(TOTAL_CELLS);
    for (var i = 0; i < TOTAL_CELLS; i++) {
        board[i] = { id: null, isRock: patFn(Math.floor(i / COLS), i % COLS), isLocked: false };
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

// Sinh 1 item từ nguồn phát vào ô trống ngẫu nhiên. Trả về index ô mới, hoặc -1 nếu bàn đầy
function spawnItem(board, genId) {
    var empty = getEmptyIndexes(board);
    if (!empty.length) return -1;
    var list = GENERATORS[genId];
    var id = list[Math.floor(rand() * list.length)];
    var target = empty[Math.floor(rand() * empty.length)];
    board[target] = { id: id, isRock: false, isLocked: false };
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

// Cấp cao nhất cần cho mỗi dòng item (từ đơn hàng chưa xong + item đang bị nhện khóa)
function neededLevels(board, orders) {
    var need = {};
    orders.forEach(o => {
        if (o.done) return;
        var l = itemLine(o.id);
        need[l] = Math.max(need[l] || 0, itemLv(o.id));
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
