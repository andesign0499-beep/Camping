const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// Load config.js by evaluating in sandbox
const configCode = fs.readFileSync(path.join(ROOT, 'js', 'config.js'), 'utf8');
const i18nCode = fs.readFileSync(path.join(ROOT, 'js', 'i18n.js'), 'utf8');
const progressCode = fs.readFileSync(path.join(ROOT, 'js', 'progress.js'), 'utf8');

// Mock browser globals
global.window = {
    addEventListener: () => {},
    localStorage: { getItem: () => null, setItem: () => {} }
};
global.document = { addEventListener: () => {} };
global.localStorage = global.window.localStorage;

// Run i18n
eval(i18nCode);
// Run config
eval(configCode);
// Run progress
eval(progressCode);

console.log('=== RUNNING FULL GAME AUDIT ===');
let failCount = 0;

function assert(cond, msg) {
    if (!cond) {
        console.error('❌ FAIL:', msg);
        failCount++;
    } else {
        // console.log('✅ PASS:', msg);
    }
}

// 1. Audit PROCEDURAL_LEVEL_ORDERS
assert(typeof PROCEDURAL_LEVEL_ORDERS === 'object', 'PROCEDURAL_LEVEL_ORDERS exists');
const levels = Object.keys(PROCEDURAL_LEVEL_ORDERS).map(Number).sort((a,b)=>a-b);
assert(levels.length === 60, `Exactly 60 levels (found ${levels.length})`);

const itemHistory = {};
const allUsedItems = new Set();
let prevFirstSeen = 0;
let discoveryLevels = 0;

for (let lv = 1; lv <= 60; lv++) {
    const orders = PROCEDURAL_LEVEL_ORDERS[lv];
    assert(Array.isArray(orders), `Level ${lv} has orders array`);
    assert(orders.length >= 2 && orders.length <= 6, `Level ${lv} order count ${orders.length} is between 2 and 6`);

    const inLv = new Set();
    let hasNew = false;
    orders.forEach(id => {
        // No duplicate in same level
        assert(!inLv.has(id), `Level ${lv} has duplicate item ${id}`);
        inLv.add(id);

        if (!allUsedItems.has(id)) {
            allUsedItems.add(id);
            hasNew = true;
        }

        // Strict 5-level cooldown
        if (itemHistory[id] !== undefined) {
            const gap = lv - itemHistory[id];
            assert(gap >= 5, `Level ${lv} item ${id} repeats too soon (previous was level ${itemHistory[id]}, gap = ${gap} < 5)`);
        }
        itemHistory[id] = lv;

        // Check generator coverage
        const cfg = generateLevelConfig(lv);
        const availGenLines = [];
        cfg.generators.forEach(g => {
            const gType = g[1];
            (GENERATOR_POOLS[gType] || []).forEach(l => availGenLines.push(l));
        });
        const line = id.split('_lv')[0];
        assert(availGenLines.includes(line), `Level ${lv} item ${id} (line ${line}) can be produced by level generators [${cfg.generators.map(g=>g[1]).join(',')}]`);
    });

    if (hasNew) {
        discoveryLevels++;
        const gapSinceLastDiscovery = lv - prevFirstSeen;
        assert(gapSinceLastDiscovery <= 2, `New item discovery gap is at most 2 levels (at lv ${lv}, gap was ${gapSinceLastDiscovery})`);
        prevFirstSeen = lv;
    }

    // Milestones
    if (lv === 1) {
        assert(orders[0] === 'ghe_lv4', 'Level 1 lead item is ghe_lv4 (tier 4)');
    }
    if (lv < 20) {
        assert(!orders.includes('trai_lv6'), `trai_lv6 not allowed before level 20 (found in lv ${lv})`);
    }
    if (lv === 20) {
        assert(orders[0] === 'trai_lv6', 'Level 20 climax is trai_lv6');
    }
    if (lv < 40) {
        assert(!orders.includes('trai_lv7'), `trai_lv7 not allowed before level 40 (found in lv ${lv})`);
    }
    if (lv === 40) {
        assert(orders[0] === 'trai_lv7', 'Level 40 climax is trai_lv7');
    }
    if (lv < 60) {
        assert(!orders.includes('trai_lv8'), `trai_lv8 not allowed before level 60 (found in lv ${lv})`);
    }
    if (lv === 60) {
        assert(orders[0] === 'trai_lv8', 'Level 60 ultimate climax is trai_lv8');
    }
}

// 2. Audit CAMP_DECORS
assert(Array.isArray(CAMP_DECORS), 'CAMP_DECORS is array');
assert(CAMP_DECORS.length === 60, `CAMP_DECORS has 60 entries (found ${CAMP_DECORS.length})`);

CAMP_DECORS.forEach((decor, idx) => {
    const lv = decor[0];
    const itemId = decor[1];
    const name = decor[2];
    assert(lv === idx + 1, `Decor index ${idx} matches level ${lv}`);
    assert(typeof itemId === 'string' && itemId.length > 0, `Decor ${lv} has valid itemId`);
    assert(typeof name === 'string' && name.length > 0, `Decor ${lv} has valid Vietnamese name`);
    assert(I18N_DATA.items[itemId] !== undefined && I18N_DATA.items[itemId].vi !== undefined, `Decor ${lv} itemId ${itemId} exists in I18N_DATA`);
    assert(PROCEDURAL_LEVEL_ORDERS[lv].includes(itemId), `Decor ${lv} (${itemId}) matches one of the level's crafted orders`);
});

console.log('\n--- AUDIT SUMMARY ---');
console.log(`Total levels: ${levels.length}`);
console.log(`Total distinct items utilized: ${allUsedItems.size} / 54`);
console.log(`Discovery events: ${discoveryLevels}`);
console.log(`CAMP_DECORS verified: ${CAMP_DECORS.length}`);
console.log(`Total Failures: ${failCount}`);

if (failCount === 0) {
    console.log('🎉 ALL AUDITS PASSED WITH FLYING COLORS!');
    process.exit(0);
} else {
    console.error(`❌ AUDIT FAILED with ${failCount} errors.`);
    process.exit(1);
}
