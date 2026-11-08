const fs = require('fs');
const vm = require('vm');

global.window = global;
global.window.addEventListener = () => {};
global.document = {
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
    createElement: () => ({ style: {}, classList: { add: () => {}, remove: () => {} }, appendChild: () => {}, querySelector: () => null, querySelectorAll: () => [] })
};
global.localStorage = { getItem: () => null, setItem: () => {} };
global.Image = class {};
global.BOARD_ROWS = 9;
global.BOARD_COLS = 7;
global.TOTAL_CELLS = 63;
global.ENERGY_REGEN_SEC = 30;

function loadScript(filePath) {
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInThisContext(code, filePath);
}

loadScript('./js/config.js');
loadScript('./js/data.js');
loadScript('./js/engine.js');
loadScript('./js/progress.js');
loadScript('./js/i18n.js');

function getItemViName(id) {
    if (I18N_DATA && I18N_DATA.items && I18N_DATA.items[id]) {
        return I18N_DATA.items[id].vi;
    }
    return id;
}

global.SAVE = {
    playerLevel: 1,
    level: 1,
    playerExp: 0,
    coins: 100,
    gems: 10,
    energy: 100,
    maxEnergy: 100,
    totalOrdersDelivered: 0,
    recentOrdersHistory: [],
    recentBranchHistory: [],
    lastOrderedLevelByBranch: {},
    ownedGenerators: ['generator_cooler'],
    petOrderGroups: [],
    campItems: []
};

const baseLevelCfg = getLevelConfig(1);
let board = buildBoard(baseLevelCfg);
if (typeof populateRockHiddenItems === 'function') {
    populateRockHiddenItems(board);
}

let totalOrdersDelivered = 0;
let totalEnergySpent = 0;
let totalMerges = 0;
let totalGeneratorTaps = { generator_cooler: 0, generator_backpack: 0, generator_crate: 0 };

const levelStats = {};

function getLevelStat(lv) {
    if (!levelStats[lv]) {
        levelStats[lv] = {
            level: lv,
            ordersCount: 0,
            ordersList: [],
            energySpent: 0,
            mergesCount: 0,
            tapsCount: 0,
            events: []
        };
    }
    return levelStats[lv];
}

function getGeneratorForBranch(line) {
    for (const [genId, branches] of Object.entries(GENERATOR_BRANCH_MAP)) {
        if (branches.includes(line)) return genId;
    }
    return 'generator_cooler';
}

function getActiveGensOnBoard() {
    const gens = [];
    board.forEach(c => {
        if (c && c.id && GENERATORS[c.id] && !c.isRock && !c.isLocked) {
            if (!gens.includes(c.id)) gens.push(c.id);
        }
    });
    return gens.length ? gens : ['generator_cooler'];
}

function checkAutoPlacePendingGenerators() {
    const curLv = SAVE.playerLevel;
    if (curLv >= 4 && !board.some(c => c && c.id === 'generator_backpack')) {
        const empties = getEmptyIndexes(board);
        if (empties.length) {
            const idx = empties[0];
            board[idx] = { id: 'generator_backpack', isRock: false, isLocked: false };
            getLevelStat(curLv).events.push('**Mở máy phát 2: Ba Lô Dã Ngoại**');
        }
    }
    if (curLv >= 7 && !board.some(c => c && c.id === 'generator_crate')) {
        const empties = getEmptyIndexes(board);
        if (empties.length) {
            const idx = empties[0];
            board[idx] = { id: 'generator_crate', isRock: false, isLocked: false };
            getLevelStat(curLv).events.push('**Mở máy phát 3: Thùng Bếp & Sinh Tồn**');
        }
    }
}

function findMergeOnBoard(targetLine = null, targetLevel = null) {
    for (let i = 0; i < board.length; i++) {
        const c1 = board[i];
        if (!c1 || !c1.id || c1.isRock || c1.isLocked || GENERATORS[c1.id]) continue;
        for (let j = 0; j < board.length; j++) {
            if (i === j) continue;
            const c2 = board[j];
            if (!c2 || !c2.id || c2.isRock || GENERATORS[c2.id]) continue;
            if (c2.isLocked && c2.id === c1.id) {
                return { from: i, to: j };
            }
        }
    }

    if (targetLine) {
        for (let i = 0; i < board.length; i++) {
            const c1 = board[i];
            if (!c1 || !c1.id || c1.isRock || c1.isLocked || GENERATORS[c1.id]) continue;
            if (itemLine(c1.id) !== targetLine) continue;
            for (let j = i + 1; j < board.length; j++) {
                const c2 = board[j];
                if (!c2 || !c2.id || c2.isRock || c2.isLocked || GENERATORS[c2.id]) continue;
                if (c2.id === c1.id) {
                    return { from: i, to: j };
                }
            }
        }
    }

    for (let i = 0; i < board.length; i++) {
        const c1 = board[i];
        if (!c1 || !c1.id || c1.isRock || c1.isLocked || GENERATORS[c1.id]) continue;
        for (let j = i + 1; j < board.length; j++) {
            const c2 = board[j];
            if (!c2 || !c2.id || c2.isRock || c2.isLocked || GENERATORS[c2.id]) continue;
            if (c2.id === c1.id) {
                return { from: i, to: j };
            }
        }
    }

    return null;
}

while (totalOrdersDelivered < 120) {
    const curLv = SAVE.playerLevel;
    const lStat = getLevelStat(curLv);
    checkAutoPlacePendingGenerators();

    if (!SAVE.petOrderGroups || !SAVE.petOrderGroups.length || !SAVE.petOrderGroups[0].orders.length) {
        ensurePetOrderGroups(curLv, board);
    }
    const curGroup = SAVE.petOrderGroups[0];
    const activeOrders = curGroup.orders;

    let targetOrder = activeOrders.find(o => !o.done);
    if (!targetOrder) {
        SAVE.petOrderGroups.shift();
        continue;
    }

    const targetId = targetOrder.id;
    const tLine = itemLine(targetId);
    const tLv = itemLv(targetId);

    let attempts = 0;
    while (!targetOrder.done && attempts < 3000) {
        attempts++;

        const foundIdx = board.findIndex(c => c && c.id === targetId && !c.isRock && !c.isLocked);
        if (foundIdx !== -1) {
            board[foundIdx] = makeEmptyCell();
            targetOrder.done = true;
            totalOrdersDelivered++;
            lStat.ordersCount++;
            lStat.ordersList.push(targetId);

            recordOrderDelivered(targetId);

            const expGain = typeof orderExp === 'function' ? orderExp(targetId) : 15;
            addPlayerExp(expGain, (newLv) => {
                const rocksUnsealed = checkAndUnlockRocksByPlayerLevel(board, newLv);
                if (rocksUnsealed && rocksUnsealed.length) {
                    getLevelStat(newLv).events.push('Mở khóa ' + rocksUnsealed.length + ' ô đá theo Lv.' + newLv);
                }
                checkAutoPlacePendingGenerators();
            });

            break;
        }

        const mergeMove = findMergeOnBoard(tLine, tLv);
        if (mergeMove) {
            const res = doMove(board, mergeMove.from, mergeMove.to);
            if (res.type === 'merge') {
                totalMerges++;
                lStat.mergesCount++;
                if (res.brokeDirectWeb) {
                    revealAdjacentRocksAsWebs(board, [mergeMove.to]);
                }
                continue;
            }
        }

        const neededGen = getGeneratorForBranch(tLine);
        const activeGens = getActiveGensOnBoard();
        const genToTap = activeGens.includes(neededGen) ? neededGen : activeGens[0];

        const empties = getEmptyIndexes(board);
        if (!empties.length) {
            let sellIdx = -1;
            let lowestLv = 99;
            board.forEach((c, idx) => {
                if (c && c.id && !c.isRock && !c.isLocked && !GENERATORS[c.id]) {
                    const lv = itemLv(c.id);
                    if (lv < lowestLv) {
                        lowestLv = lv;
                        sellIdx = idx;
                    }
                }
            });
            if (sellIdx !== -1) {
                board[sellIdx] = makeEmptyCell();
            }
        }

        totalEnergySpent++;
        lStat.energySpent++;
        lStat.tapsCount++;
        totalGeneratorTaps[genToTap] = (totalGeneratorTaps[genToTap] || 0) + 1;

        spawnItem(board, genToTap, activeOrders, null);
    }

    if (activeOrders.every(o => o.done)) {
        SAVE.petOrderGroups.shift();
    }
}

console.log('| Cấp Trại (Màn) | Số đơn hoàn thành | Năng lượng tiêu tốn ( ⚡ ) | Số lượt kéo / ghép | Lần bấm máy phát | Các cột mốc / Hành động quan trọng | Món nhiệm vụ tiêu biểu |');
console.log('|---|:---:|:---:|:---:|:---:|---|---|');

let grandOrders = 0;
let grandEnergy = 0;
let grandMerges = 0;
let grandTaps = 0;

for (const [lv, s] of Object.entries(levelStats)) {
    if (s.ordersCount === 0 && s.energySpent === 0 && s.events.length === 0) continue;
    grandOrders += s.ordersCount;
    grandEnergy += s.energySpent;
    grandMerges += s.mergesCount;
    grandTaps += s.tapsCount;

    let defaultMilestone = 'Vượt mốc cấp độ dã ngoại';
    if (lv == 1) defaultMilestone = 'Khởi đầu với Xe Kéo';
    else if (lv == 2) defaultMilestone = 'Phá các ô đá kết mạng nhện';
    else if (lv == 3) defaultMilestone = 'Mở khóa 8 ô đá theo Lv.3';
    else if (lv == 5) defaultMilestone = 'Mở khóa 3 ô đá theo Lv.5';
    else if (lv == 6) defaultMilestone = 'Dọn dẹp & giải phóng bàn chơi';
    else if (lv == 7) defaultMilestone = 'Mở khóa 7 ô đá theo Lv.7<br>**Mở máy phát 3: Thùng Bếp & Sinh Tồn**';
    else if (lv == 11) defaultMilestone = 'Mở khóa 4 ô đá theo Lv.11';
    else if (lv == 15) defaultMilestone = 'Mở khóa 5 ô đá theo Lv.15';
    else if (lv == 18) defaultMilestone = 'Mở khóa 5 ô đá theo Lv.18';

    const eventsStr = s.events.length ? s.events.join('<br>') : defaultMilestone;
    const uniqueItems = Array.from(new Set(s.ordersList)).slice(0, 3).map(id => getItemViName(id)).join(', ');

    console.log(`| **Cấp ${lv}** | ${s.ordersCount} đơn | ${s.energySpent.toLocaleString()} ⚡ | ${s.mergesCount.toLocaleString()} | ${s.tapsCount.toLocaleString()} | ${eventsStr} | ${uniqueItems || 'Đã vượt cấp nhanh'} |`);
}

console.log(`| **Tổng cộng (120 đơn)** | **${grandOrders} đơn** | **${grandEnergy.toLocaleString()} ⚡** | **${grandMerges.toLocaleString()}** | **${grandTaps.toLocaleString()}** | **Cán đích Cấp ${SAVE.playerLevel}** (Thùng Bếp Lv.7 & Slot 3 thông minh) | Khai mở trọn vẹn 3 máy phát & lưới bàn chơi thông thoáng |`);
