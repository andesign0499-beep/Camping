// ==========================================
// MÔ PHỎNG KINH TẾ (ECONOMY SIMULATOR)
// Chạy: node tools/economy_sim.js [số_ván_mỗi_level] [level_tối_đa]
// Mô phỏng giống game thật: đổ đầy bàn cờ miễn phí lúc đầu, bot ghép đồ thông minh,
// đo năng lượng đã tiêu + Vàng/Kim cương kiếm được mỗi màn theo công thức trong js/progress.js
// ==========================================

const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ctx = { localStorage: { getItem: () => null, setItem: () => {} }, console, Date, Math };
vm.createContext(ctx);
['js/config.js', 'js/data.js', 'js/engine.js', 'js/progress.js'].forEach(f =>
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx)
);

const RUNS = parseInt(process.argv[2]) || 120;
const MAX_LV = parseInt(process.argv[3]) || ctx.RAW_LEVELS.length;

// Sao chép logic populateInitialBoardItems() trong board.js (đổ đầy bàn miễn phí)
function populateInitial(board, orderIds) {
    const lines = [];
    board.forEach(c => {
        if (c && ctx.GENERATORS[c.id] && !c.isLocked) {
            ctx.GENERATORS[c.id].forEach(id => {
                const l = id.split('_lv')[0];
                if (lines.indexOf(l) === -1) lines.push(l);
            });
        }
    });
    if (!lines.length) return;
    const empties = ctx.getEmptyIndexes(board);
    const active = new Set(orderIds);
    const items = [];
    while (items.length < empties.length) {
        const line = lines[Math.floor(Math.random() * lines.length)];
        let id = line + '_lv' + (Math.random() < 0.25 ? 2 : 1);
        if (active.has(id)) id = line + '_lv1';
        items.push(id);
        if (items.length < empties.length) items.push(id);
    }
    for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
    }
    empties.forEach((idx, i) => { board[idx] = { id: items[i], isRock: false, isLocked: false }; });
}

function simulate(lvNum) {
    const level = ctx.getLevelConfig(lvNum);
    const board = ctx.buildBoard(level);
    const orderIds = ctx.tuneOrders(level.rawOrders, lvNum, level);
    const orders = orderIds.map(id => ({ id, done: false }));
    populateInitial(board, orderIds);
    const budget = ctx.computeEnergyBudget(board, orderIds, level);

    const gens = [];
    board.forEach(c => { if (c && ctx.GENERATORS[c.id] && !c.isLocked) gens.push(c.id); });

    let energy = 0, gold = 0, gems = 0, steps = 0;
    while (steps++ < 4000) {
        let submitted = false;
        for (const o of orders) {
            if (o.done) continue;
            const m = ctx.findOrderMatch(board, o.id);
            if (m !== -1) {
                o.done = true;
                board[m] = ctx.makeEmptyCell();
                gold += ctx.orderReward(o.id);
                submitted = true;
            }
        }
        if (submitted) continue;
        if (orders.every(o => o.done) && ctx.countWebs(board) === 0) {
            const stars = ctx.calcStars(Math.max(0, budget - energy), budget);
            const r = ctx.levelClearReward(lvNum, stars, true);
            gold += r.coins; gems += r.gems;
            board.forEach(c => {
                if (c && c.id && !c.isLocked && !c.isRock && !ctx.GENERATORS[c.id]) {
                    gold += ctx.sellPrice(c.id);
                }
            });
            return { won: true, energy, gold, gems, budget, stars };
        }
        const merge = ctx.findBestMerge(board, orders, level);
        const empties = ctx.getEmptyIndexes(board);
        if (merge && (merge.score > 1 || empties.length <= 2)) {
            const res = ctx.doMove(board, merge.from, merge.to);
            if (res.type === 'merge') {
                ctx.clearAdjacentWebs(board, res.index, level);
                ctx.bonusDrop(board, level, res.newId);
                const mr = ctx.mergeReward(res.newId);
                gold += mr.coins; gems += mr.gems;
            }
            continue;
        }
        if (empties.length === 0) {
            const need = ctx.neededLevels(board, orders);
            let sellIdx = -1, worst = 1e9;
            board.forEach((c, i) => {
                if (!c || !c.id || c.isLocked || c.isRock || ctx.GENERATORS[c.id]) return;
                const s = (need[ctx.itemLine(c.id)] ? 100 : 0) + ctx.itemLv(c.id) * 10;
                if (s < worst) { worst = s; sellIdx = i; }
            });
            if (sellIdx === -1) return { won: false, energy, gold, gems, budget, stars: 0 };
            gold += ctx.sellPrice(board[sellIdx].id);
            board[sellIdx] = ctx.makeEmptyCell();
            continue;
        }
        const need = ctx.neededLevels(board, orders);
        let bestGen = gens[0], bestW = -1;
        for (const g of gens) {
            let w = Math.random() * 0.5;
            ctx.GENERATORS[g].forEach(l => { const n = need[ctx.itemLine(l)]; if (n) w += Math.pow(2, n); });
            if (w > bestW) { bestW = w; bestGen = g; }
        }
        ctx.spawnItem(board, bestGen);
        energy++;
        if (level.spreadEvery && energy % level.spreadEvery === 0) ctx.spreadWeb(board);
    }
    return { won: false, energy, gold, gems, budget, stars: 0 };
}

const pct = (arr, p) => arr[Math.min(arr.length - 1, Math.floor(arr.length * p))];
console.log(`Mô phỏng ${RUNS} ván/level | START=${ctx.START_ENERGY} | Trần ${ctx.MAX_ENERGY_BASE}+${ctx.MAX_ENERGY_PER_LEVEL}/màn (tối đa ${ctx.MAX_ENERGY_CAP}) | hồi 1⚡/${ctx.ENERGY_REGEN_SEC}s`);
console.log(`Gói Vàng: ${ctx.ENERGY_PACK}⚡/${ctx.ENERGY_PACK_PRICE} Vàng | Gói 💎: ${ctx.GEM_ENERGY_PACK}⚡/${ctx.GEM_ENERGY_PRICE}💎\n`);
console.log('Lv | ⚡P50 | ⚡P75 | Budget | Thắng% | Vàng TB | 💎 TB | ⭐ TB | Vàng bù ⚡%');
console.log('---|------|------|--------|--------|---------|------|------|-----------');
let cumGold = 0, cumGems = 0;
const perLevel = [];
for (let lv = 1; lv <= MAX_LV; lv++) {
    const res = [];
    for (let r = 0; r < RUNS; r++) res.push(simulate(lv));
    const en = res.map(r => r.energy).sort((a, b) => a - b);
    const wins = res.filter(r => r.won);
    const avgGold = Math.round(wins.reduce((s, r) => s + r.gold, 0) / Math.max(1, wins.length));
    const avgGems = wins.reduce((s, r) => s + r.gems, 0) / Math.max(1, wins.length);
    const avgStars = (wins.reduce((s, r) => s + r.stars, 0) / Math.max(1, wins.length)).toFixed(1);
    const p50 = pct(en, 0.5), p75 = pct(en, 0.75);
    const coverPct = p50 > 0 ? Math.round((avgGold / ctx.ENERGY_PACK_PRICE * ctx.ENERGY_PACK) / p50 * 100) : 0;
    cumGold += avgGold; cumGems += avgGems;
    perLevel.push({ lv, p50, p75, gold: avgGold, gems: avgGems });
    console.log(`${String(lv).padStart(2)} | ${String(p50).padStart(4)} | ${String(p75).padStart(4)} | ` +
        `${String(res[0].budget).padStart(6)} | ${String(Math.round(wins.length / RUNS * 100)).padStart(5)}% | ` +
        `${String(avgGold).padStart(7)} | ${avgGems.toFixed(1).padStart(4)} | ${avgStars.padStart(4)} | ${String(coverPct).padStart(8)}%`);
}
console.log(`\nTổng Vàng TB: ${cumGold} | Tổng 💎 TB: ${cumGems.toFixed(1)}`);

// ---- HÀNH TRÌNH NGƯỜI CHƠI MỚI (không xem QC, không nạp) ----
// Giả định: mỗi lần bấm nguồn phát + ghép tốn ~6 giây chơi, mỗi màn thêm 40 giây đọc thoại/giao đơn.
function journey(useP) {
    const defSave = ctx.defaultSave();
    let energy = ctx.START_ENERGY, gold = defSave.coins, gems = defSave.gems, passed = 0, timeSec = 0;
    for (const L of perLevel) {
        let need = useP === 75 ? L.p75 : L.p50;
        const maxE = () => Math.min(ctx.MAX_ENERGY_CAP, ctx.MAX_ENERGY_BASE + passed * ctx.MAX_ENERGY_PER_LEVEL);
        const playSec = need * 6 + 40;
        // Hồi năng lượng trong lúc chơi
        const regen = Math.floor(playSec / ctx.ENERGY_REGEN_SEC);
        let avail = Math.min(maxE(), energy + regen);
        while (avail < need && gold >= ctx.ENERGY_PACK_PRICE) { gold -= ctx.ENERGY_PACK_PRICE; avail += ctx.ENERGY_PACK; }
        while (avail < need && gems >= ctx.GEM_ENERGY_PRICE) { gems -= ctx.GEM_ENERGY_PRICE; avail += ctx.GEM_ENERGY_PACK; }
        if (avail < need) {
            const short = need - avail;
            return `P${useP}: chơi liên tục qua Level ${passed}, bị chặn giữa Level ${L.lv} (thiếu ${short}⚡ ≈ chờ ${Math.ceil(short * ctx.ENERGY_REGEN_SEC / 60)} phút, hoặc ${Math.ceil(short / ctx.AD_REWARDS.energy.amount)} QC, hoặc ${Math.ceil(short / ctx.GEM_ENERGY_PACK) * ctx.GEM_ENERGY_PRICE}💎). Thời gian chơi ~${Math.round(timeSec / 60)} phút. Còn ${gold} Vàng, ${gems}💎`;
        }
        energy = avail - need; gold += L.gold; gems += Math.round(L.gems); passed++; timeSec += playSec;
    }
    return `P${useP}: chơi hết ${passed} level không bị chặn`;
}
console.log('\n=== HÀNH TRÌNH NGƯỜI CHƠI MỚI (không QC, không nạp, có dùng Vàng/💎 sẵn có) ===');
console.log(journey(50));
console.log(journey(75));
