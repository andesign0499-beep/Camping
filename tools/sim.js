// ==========================================
// BOT MÔ PHỎNG (MONTE CARLO SIMULATOR)
// Chạy thử hàng trăm ván cho toàn bộ 45 level để đo:
//  - Lượng năng lượng thực tế cần dùng (trung bình, P50, P75, P90)
//  - Tỉ lệ thắng ở mức ngân sách năng lượng hiện tại
//  - Số sao trung bình người chơi đạt được
// ==========================================

const fs = require('fs');
const vm = require('vm');

const ctx = {
    localStorage: { getItem: () => null, setItem: () => {} },
    console
};
vm.createContext(ctx);

vm.runInContext(fs.readFileSync('js/config.js', 'utf8'), ctx);
vm.runInContext(fs.readFileSync('js/data.js', 'utf8'), ctx);
vm.runInContext(fs.readFileSync('js/engine.js', 'utf8'), ctx);
vm.runInContext(fs.readFileSync('js/progress.js', 'utf8'), ctx);

function simulateOneGame(lvNum, maxEnergyCap) {
    const level = ctx.getLevelConfig(lvNum);
    const board = ctx.buildBoard(level);
    const orderIds = ctx.tuneOrders(level.rawOrders, lvNum, level);
    const orders = orderIds.map(id => ({ id, done: false }));

    const gens = [];
    board.forEach((c, idx) => {
        if (c && ctx.GENERATORS[c.id] && !c.isLocked) gens.push(c.id);
    });

    let energyUsed = 0;
    let steps = 0;

    while (steps++ < 3000) {
        // 1. Nộp ngay đơn hàng nếu đã có sẵn trên bàn
        let submitted = false;
        for (const o of orders) {
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
            return { won: true, energyUsed };
        }

        // 3. Tìm nước ghép tốt nhất
        const merge = ctx.findBestMerge(board, orders, level);
        const empties = ctx.getEmptyIndexes(board);

        // Nếu có nước ghép tốt (score > 1) hoặc bàn cờ sắp đầy (<= 2 ô trống) thì ghép ngay
        if (merge && (merge.score > 1 || empties.length <= 2)) {
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
            return { won: false, energyUsed };
        }

        // 5. Chọn nguồn phát thông minh (ưu tiên nguồn phát chứa dòng item đang cần)
        if (energyUsed >= maxEnergyCap) {
            // Hết năng lượng nhưng nếu còn nước ghép rác thì thử ghép nốt
            if (merge) {
                const res = ctx.doMove(board, merge.from, merge.to);
                if (res.type === 'merge') {
                    ctx.clearAdjacentWebs(board, res.index, level);
                    ctx.bonusDrop(board, level, res.newId);
                }
                continue;
            }
            return { won: false, energyUsed };
        }

        const need = ctx.neededLevels(board, orders);
        let bestGen = gens[0], bestWeight = -1;
        for (const gId of gens) {
            const lines = ctx.GENERATORS[gId];
            let w = 0;
            for (const lId of lines) {
                const line = ctx.itemLine(lId);
                if (need[line]) w += Math.pow(2, need[line]);
            }
            // Thêm chút ngẫu nhiên nhẹ khi 2 nguồn phát ngang nhau
            w += Math.random() * 0.5;
            if (w > bestWeight) { bestWeight = w; bestGen = gId; }
        }

        // Nếu chỉ còn nhện mà không có đơn hàng cần dòng đó -> cố gắng đặt item gần nhện để phá nhện liền kề
        ctx.spawnItem(board, bestGen);
        energyUsed++;

        if (level.spreadEvery && energyUsed % level.spreadEvery === 0) {
            ctx.spreadWeb(board);
        }

        // Mẹo vị trí của người chơi: nếu có 2 item giống nhau và có thể ghép ngay cạnh ô nhện, findBestMerge đã ưu tiên.
        // Nhưng nếu có 1 item tự do giống với 1 item khác mà đặt cạnh nhện sẽ phá được nhện, di chuyển 1 bước miễn phí tới cạnh nhện:
        if (level.adjWeb && websLeft > 0) {
            relocatePairNextToWeb(board);
        }
    }
    return { won: false, energyUsed };
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

const RUNS = 150;
console.log(`Chạy mô phỏng ${RUNS} ván / level trên toàn bộ ${ctx.RAW_LEVELS.length} level...\n`);
console.log('Lv | Đơn hàng                  | Cơ chế         | P50  | P75  | P85  | Ngân sách | Thắng%');
console.log('---|---------------------------|----------------|------|------|------|-----------|-------');

for (let lv = 1; lv <= ctx.RAW_LEVELS.length; lv++) {
    const level = ctx.getLevelConfig(lv);
    const board0 = ctx.buildBoard(level);
    const orderIds = ctx.tuneOrders(level.rawOrders, lv, level);
    const budget = ctx.computeEnergyBudget(board0, orderIds, level);

    const usedList = [];
    let winsWithinBudget = 0;
    for (let r = 0; r < RUNS; r++) {
        const res = simulateOneGame(lv, 1500);
        usedList.push(res.energyUsed);
        if (res.won && res.energyUsed <= budget) winsWithinBudget++;
    }
    usedList.sort((a, b) => a - b);
    const p50 = usedList[Math.floor(RUNS * 0.50)];
    const p75 = usedList[Math.floor(RUNS * 0.75)];
    const p85 = usedList[Math.floor(RUNS * 0.85)];
    const winRate = Math.round((winsWithinBudget / RUNS) * 100);
    const mechStr = [
        level.adjWeb ? 'adjWeb' : '',
        level.bonus ? 'bonus' : '',
        level.spreadEvery ? `sp:${level.spreadEvery}` : ''
    ].filter(Boolean).join(',') || '-';

    console.log(
        `${String(lv).padStart(2)} | ${orderIds.join(',').padEnd(25)} | ${mechStr.padEnd(14)} | ` +
        `${String(p50).padStart(4)} | ${String(p75).padStart(4)} | ${String(p85).padStart(4)} | ` +
        `${String(budget).padStart(9)} | ${String(winRate).padStart(5)}%`
    );
}
