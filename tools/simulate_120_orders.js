const fs = require('fs');
const vm = require('vm');

// Mock browser environment
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
global.ENERGY_REGEN_SEC = 120;

// Load js files into global scope
function loadScript(filePath) {
    const code = fs.readFileSync(filePath, 'utf8');
    vm.runInThisContext(code, filePath);
}

loadScript('./js/config.js');
loadScript('./js/data.js');
loadScript('./js/engine.js');
loadScript('./js/progress.js');

// Initialize Save State
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

// Build initial board
const baseLevelCfg = getLevelConfig(1);
let board = buildBoard(baseLevelCfg);
if (typeof populateRockHiddenItems === 'function') {
    populateRockHiddenItems(board);
}

console.log('=== STARTING 120 ORDERS SIMULATION ===');

let totalOrdersDelivered = 0;
let totalEnergySpent = 0;
let totalMerges = 0;
let totalGeneratorTaps = { generator_cooler: 0, generator_backpack: 0, generator_crate: 0 };

// Stats per Player Level
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
            generatorsUnlocked: [],
            rocksBroken: 0
        };
    }
    return levelStats[lv];
}

// Helper to find matching generator for a line
function getGeneratorForBranch(line) {
    for (const [genId, branches] of Object.entries(GENERATOR_BRANCH_MAP)) {
        if (branches.includes(line)) return genId;
    }
    return 'generator_cooler';
}

// Check which generators are currently on board
function getActiveGensOnBoard() {
    const gens = [];
    board.forEach(c => {
        if (c && c.id && GENERATORS[c.id] && !c.isRock && !c.isLocked) {
            if (!gens.includes(c.id)) gens.push(c.id);
        }
    });
    return gens.length ? gens : ['generator_cooler'];
}

// Auto-place pending generators if unlocked
function checkAutoPlacePendingGenerators() {
    const curLv = SAVE.playerLevel;
    if (curLv >= 4 && !board.some(c => c && c.id === 'generator_backpack')) {
        const empties = getEmptyIndexes(board);
        if (empties.length) {
            const idx = empties[0];
            board[idx] = { id: 'generator_backpack', isRock: false, isLocked: false };
            getLevelStat(curLv).generatorsUnlocked.push('Ba Lô Dã Ngoại');
        }
    }
    if (curLv >= 5 && !board.some(c => c && c.id === 'generator_crate')) {
        const empties = getEmptyIndexes(board);
        if (empties.length) {
            const idx = empties[0];
            board[idx] = { id: 'generator_crate', isRock: false, isLocked: false };
            getLevelStat(curLv).generatorsUnlocked.push('Thùng Bếp & Sinh Tồn');
        }
    }
}

// Find best merge on board
function findMergeOnBoard(targetLine = null, targetLevel = null) {
    // 1. Merge into web if available
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

    // 2. Merge toward targetLine & targetLevel
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

    // 3. General merge of any duplicate free items to keep board clean
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

// Execute 120 orders
while (totalOrdersDelivered < 120) {
    const curLv = SAVE.playerLevel;
    const lStat = getLevelStat(curLv);
    checkAutoPlacePendingGenerators();

    // Ensure we have active order group
    if (!SAVE.petOrderGroups || !SAVE.petOrderGroups.length || !SAVE.petOrderGroups[0].orders.length) {
        ensurePetOrderGroups(curLv);
    }
    const curGroup = SAVE.petOrderGroups[0];
    const activeOrders = curGroup.orders;

    // Find first unfinished order
    let targetOrder = activeOrders.find(o => !o.done);
    if (!targetOrder) {
        // Group completed!
        SAVE.petOrderGroups.shift();
        continue;
    }

    const targetId = targetOrder.id;
    const tLine = itemLine(targetId);
    const tLv = itemLv(targetId);

    // Simulation inner loop to craft targetId
    let attempts = 0;
    while (!targetOrder.done && attempts < 3000) {
        attempts++;

        // 1. Check if target item already exists on board free
        const foundIdx = board.findIndex(c => c && c.id === targetId && !c.isRock && !c.isLocked);
        if (foundIdx !== -1) {
            // Deliver order!
            board[foundIdx] = makeEmptyCell();
            targetOrder.done = true;
            totalOrdersDelivered++;
            lStat.ordersCount++;
            lStat.ordersList.push(targetId);

            // Record delivered
            recordOrderDelivered(targetId);

            // Award EXP and coins
            const expGain = typeof orderExp === 'function' ? orderExp(targetId) : 15;
            addPlayerExp(expGain, (newLv) => {
                SAVE.energy += 80; // Level up energy bonus
                checkAndUnlockRocksByPlayerLevel(board, newLv);
                checkAutoPlacePendingGenerators();
            });

            break;
        }

        // 2. Try merging on board
        const mergeMove = findMergeOnBoard(tLine, tLv);
        if (mergeMove) {
            const res = doMove(board, mergeMove.from, mergeMove.to);
            if (res.type === 'merge') {
                totalMerges++;
                lStat.mergesCount++;
                if (res.brokeDirectWeb) {
                    const rev = revealAdjacentRocksAsWebs(board, [mergeMove.to]);
                    lStat.rocksBroken += rev.length;
                }
                continue;
            }
        }

        // 3. Need more items! Tap generator.
        const neededGen = getGeneratorForBranch(tLine);
        const activeGens = getActiveGensOnBoard();
        const genToTap = activeGens.includes(neededGen) ? neededGen : activeGens[0];

        const empties = getEmptyIndexes(board);
        if (!empties.length) {
            // Board is full! Sell lowest level non-target item to make room
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

        // Tap generator
        totalEnergySpent++;
        lStat.energySpent++;
        lStat.tapsCount++;
        totalGeneratorTaps[genToTap] = (totalGeneratorTaps[genToTap] || 0) + 1;

        spawnItem(board, genToTap, activeOrders, null);
    }

    // Check if entire group done
    if (activeOrders.every(o => o.done)) {
        SAVE.petOrderGroups.shift();
    }
}

console.log('=== SIMULATION FINISHED ===\n');
console.log(`Total Orders Delivered: ${totalOrdersDelivered}`);
console.log(`Final Player Level: ${SAVE.playerLevel}`);
console.log(`Total Energy Spent: ${totalEnergySpent}`);
console.log(`Total Merges (Lượt kéo): ${totalMerges}`);
console.log('Taps per Generator:', totalGeneratorTaps);

// Output level by level summary
console.log('\n=== LEVEL BY LEVEL BREAKDOWN ===');
for (const [lv, s] of Object.entries(levelStats)) {
    console.log(`[Cấp ${lv}]`);
    console.log(`  - Số đơn hoàn thành: ${s.ordersCount}`);
    console.log(`  - Năng lượng tiêu tốn: ${s.energySpent} ⚡`);
    console.log(`  - Số lượt kéo (ghép): ${s.mergesCount}`);
    console.log(`  - Số lần bấm máy phát: ${s.tapsCount}`);
    if (s.generatorsUnlocked.length) console.log(`  - Máy phát mở khóa: ${s.generatorsUnlocked.join(', ')}`);
    if (s.rocksBroken) console.log(`  - Ô đá phá vỡ: ${s.rocksBroken}`);
    const sampleItems = s.ordersList.slice(0, 5).join(', ');
    console.log(`  - Món tiêu biểu: ${sampleItems}${s.ordersList.length > 5 ? '...' : ''}`);
}
