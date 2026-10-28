// ==========================================
// BOT MÔ PHỎNG (MONTE CARLO SIMULATOR)
// Chạy thử hàng trăm ván cho toàn bộ 45 level để đo:
//  - Lượng năng lượng thực tế cần dùng (trung bình, P50, P75, P90)
//  - Tỉ lệ thắng ở mức ngân sách năng lượng hiện tại
//  - Số sao trung bình người chơi đạt được
// ==========================================

const fs = require('fs');
const vm = require('vm');

global.localStorage = { getItem: () => null, setItem: () => {} };
vm.runInThisContext(fs.readFileSync('js/config.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('js/data.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('js/engine.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('js/progress.js', 'utf8'));
const ctx = global;

function populateInitial(board, orders, lvNum) {
    if (lvNum <= 4) return;
    const genLines = [];
    board.forEach(c => {
        if (c && ctx.GENERATORS[c.id] && !c.isLocked) {
            ctx.GENERATORS[c.id].forEach(id => {
                const l = id.split('_lv')[0];
                if (genLines.indexOf(l) === -1) genLines.push(l);
            });
        }
    });
    if (!genLines.length) return;
    const orderLines = [];
    (orders || []).forEach(o => {
        if (!o || o.done || !o.id) return;
        const l = ctx.itemLine(o.id);
        if (genLines.indexOf(l) !== -1 && orderLines.indexOf(l) === -1) {
            orderLines.push(l);
        }
    });
    const lines = orderLines.length > 0 ? orderLines : genLines;
    const empties = ctx.getEmptyIndexes(board);
    const maxPairs = lvNum <= 10 ? 1 : 2;
    const pairCount = Math.min(maxPairs, Math.floor(empties.length / 6));
    for (let p = 0; p < pairCount; p++) {
        const line = lines[p % lines.length];
        const itemId = line + '_lv1';
        for (let k = 0; k < 2; k++) {
            const curEmpties = ctx.getEmptyIndexes(board);
            if (!curEmpties.length) break;
            const pick = curEmpties[Math.floor(Math.random() * curEmpties.length)];
            board[pick] = { id: itemId, isRock: false, isLocked: false };
        }
    }
}

function simulateOneGame(lvNum, maxEnergyCap) {
    const level = ctx.getLevelConfig(lvNum);
    const board = ctx.buildBoard(level);
    const orderIds = ctx.tuneOrders(level.rawOrders, lvNum, level);
    const orders = orderIds.map(id => ({ id, done: false }));
    if (typeof ctx.resetGeneratorPity === 'function') ctx.resetGeneratorPity();
    populateInitial(board, orders, lvNum);

    const gens = [];
    board.forEach((c, idx) => {
        if (c && ctx.GENERATORS[c.id] && !c.isLocked) gens.push(c.id);
    });

    let energyUsed = 0;
    let unwantedClicks = 0;
    let steps = 0;

    while (steps++ < 5000) {
        // 1. Nộp ngay đơn hàng nếu đã có sẵn trên bàn (chỉ trong tối đa 4 đơn hàng đang hiển thị)
        let submitted = false;
        const visibleOrders = ctx.getVisibleOrders ? ctx.getVisibleOrders(orders) : orders.filter(o => !o.done).slice(0, 4);
        for (const o of visibleOrders) {
            if (!o.done) {
                const mIdx = ctx.findOrderMatch(board, o.id);
                if (mIdx !== -1) {
                    o.done = true;
                    board[mIdx] = ctx.makeEmptyCell();
                    submitted = true;
                }
            }
        }
        if (submitted) continue;

        // 2. Kiểm tra điều kiện thắng
        const websLeft = ctx.countWebs(board);
        if (orders.every(o => o.done) && websLeft === 0) {
            return { won: true, energyUsed, unwantedClicks, effectiveUsed: Math.max(1, energyUsed - unwantedClicks) };
        }

        // 3. Tìm nước ghép tốt nhất
        const merge = ctx.findBestMerge(board, orders, level);
        const empties = ctx.getEmptyIndexes(board);

        // Nếu có nước ghép thì ghép ngay
        if (merge) {
            const res = ctx.doMove(board, merge.from, merge.to);
            if (res.type === 'merge') {
                ctx.clearAdjacentWebs(board, res.index, level);
                ctx.bonusDrop(board, level, res.newId);
            }
            continue;
        }

        // 4. Nếu bàn cờ đầy mà không còn nước ghép nào -> bán bớt 1 item ít giá trị nhất
        if (empties.length === 0) {
            const need = ctx.neededLevels(board, orders);
            let sellIdx = -1, worstScore = 999999;
            board.forEach((c, i) => {
                if (!c || !c.id || c.isLocked || c.isRock || ctx.GENERATORS[c.id]) return;
                const line = ctx.itemLine(c.id), lv = ctx.itemLv(c.id);
                const s = (need[line] ? 100 : 0) + lv * 10;
                if (s < worstScore) { worstScore = s; sellIdx = i; }
            });
            if (sellIdx !== -1) {
                board[sellIdx] = ctx.makeEmptyCell();
                continue;
            }
            return { won: false, energyUsed, unwantedClicks, effectiveUsed: Math.max(1, energyUsed - unwantedClicks) };
        }

        // 5. Chọn nguồn phát thông minh (ưu tiên nguồn phát chứa dòng item đang thiếu thực sự)
        if (energyUsed >= maxEnergyCap) {
            return { won: false, energyUsed, unwantedClicks, effectiveUsed: Math.max(1, energyUsed - unwantedClicks) };
        }

        const deficits = ctx.computeLineDeficits(board, orders, level);
        let bestGen = gens[0], bestWeight = -1;
        for (const gId of gens) {
            const lines = ctx.GENERATORS[gId];
            let w = 0;
            for (const lId of lines) {
                const line = ctx.itemLine(lId);
                if (deficits[line]) w += deficits[line] * 10;
            }
            w += Math.random() * 0.5;
            if (w > bestWeight) { bestWeight = w; bestGen = gId; }
        }

        ctx.spawnItem(board, bestGen, orders, level);
        energyUsed++;
        if (typeof ctx.wasLastSpawnUnwanted === 'function' && ctx.wasLastSpawnUnwanted()) {
            unwantedClicks++;
        }

        if (level.spreadEvery && energyUsed % level.spreadEvery === 0) {
            ctx.spreadWeb(board);
        }

        if (level.adjWeb && websLeft > 0) {
            relocatePairNextToWeb(board);
        }
    }
    return { won: false, energyUsed, unwantedClicks, effectiveUsed: Math.max(1, energyUsed - unwantedClicks) };
}

// Người chơi thật sẽ kéo item đến ô trống sát mạng nhện rồi mới ghép để phá nhện liền kề miễn phí
function relocatePairNextToWeb(board) {
    const emptyAdjWeb = ctx.getEmptyIndexes(board).filter(idx =>
        ctx.getOrthogonalNeighbors(idx).some(n => board[n] && board[n].isLocked)
    );
    if (!emptyAdjWeb.length) return;

    const counts = {};
    board.forEach((c, i) => {
        if (c && c.id && !c.isLocked && !c.isRock && !ctx.GENERATORS[c.id] && ctx.itemLv(c.id) < ctx.MAX_ITEM_LV) {
            (counts[c.id] = counts[c.id] || []).push(i);
        }
    });
    for (const id of Object.keys(counts)) {
        const list = counts[id];
        if (list.length >= 2) {
            const alreadyAdj = list.some(idx =>
                ctx.getOrthogonalNeighbors(idx).some(n => board[n] && board[n].isLocked)
            );
            if (!alreadyAdj) {
                ctx.doMove(board, list[0], emptyAdjWeb[0]);
                return;
            }
        }
    }
}

const RUNS = parseInt(process.argv[2]) || 100;
console.log(`Chạy mô phỏng ${RUNS} ván / level trên toàn bộ ${ctx.RAW_LEVELS.length} level...\n`);
console.log('Lv | Đơn hàng                  | Cơ chế         | Raw50 | Eff50 | Eff85 | Ngân sách | SaoTB | Thắng%');
console.log('---|---------------------------|----------------|-------|-------|-------|-----------|-------|-------');

for (let lv = 1; lv <= ctx.RAW_LEVELS.length; lv++) {
    const level = ctx.getLevelConfig(lv);
    const board0 = ctx.buildBoard(level);
    const orderIds = ctx.tuneOrders(level.rawOrders, lv, level);
    populateInitial(board0, orderIds.map(id => ({ id, done: false })), lv);
    const budget = ctx.computeEnergyBudget(board0, orderIds, level);

    const rawList = [];
    const effList = [];
    let winsWithinBudget = 0;
    let totalStars = 0;
    for (let r = 0; r < RUNS; r++) {
        const res = simulateOneGame(lv, 1500);
        rawList.push(res.energyUsed);
        effList.push(res.effectiveUsed);
        if (res.won && res.effectiveUsed <= budget) winsWithinBudget++;
        const st = ctx.calcStars(Math.max(0, budget - res.effectiveUsed), budget);
        totalStars += st;
    }
    rawList.sort((a, b) => a - b);
    effList.sort((a, b) => a - b);
    const raw50 = rawList[Math.floor(RUNS * 0.50)];
    const eff50 = effList[Math.floor(RUNS * 0.50)];
    const eff85 = effList[Math.floor(RUNS * 0.85)];
    const avgStars = (totalStars / RUNS).toFixed(2);
    const winRate = Math.round((winsWithinBudget / RUNS) * 100);
    const mechStr = [
        level.adjWeb ? 'adjWeb' : '',
        level.bonus ? 'bonus' : '',
        level.spreadEvery ? `sp:${level.spreadEvery}` : ''
    ].filter(Boolean).join(',') || '-';

    console.log(
        `${String(lv).padStart(2)} | ${orderIds.join(',').padEnd(25)} | ${mechStr.padEnd(14)} | ` +
        `${String(raw50).padStart(5)} | ${String(eff50).padStart(5)} | ${String(eff85).padStart(5)} | ` +
        `${String(budget).padStart(9)} | ${String(avgStars).padStart(5)} | ${String(winRate).padStart(5)}%`
    );
}
