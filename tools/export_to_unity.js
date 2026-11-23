/**
 * Export toàn bộ dữ liệu cấu hình, audio, font và ảnh PNG/JPG từ bản Web
 * sang thư mục Unity Project: D:\Camping Unity\My project\Assets
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const WEB_ROOT = path.resolve(__dirname, '..');
const UNITY_ASSETS = 'D:\\Camping Unity\\My project\\Assets';

function ensureDir(dir) {
    fs.mkdirSync(dir, { recursive: true });
}

function copyDirRecursive(srcDir, dstDir, filterFn) {
    if (!fs.existsSync(srcDir)) return 0;
    ensureDir(dstDir);
    let count = 0;
    for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
        const srcPath = path.join(srcDir, entry.name);
        const dstPath = path.join(dstDir, entry.name);
        if (entry.isDirectory()) {
            count += copyDirRecursive(srcPath, dstPath, filterFn);
        } else if (!filterFn || filterFn(entry.name, srcPath)) {
            fs.copyFileSync(srcPath, dstPath);
            count++;
        }
    }
    return count;
}

// 1. Nạp các file JS cấu hình trong sandbox để trích xuất JSON sạch
const sandbox = {
    window: {},
    addEventListener: () => {},
    removeEventListener: () => {},
    setTimeout: () => 0,
    clearTimeout: () => {},
    innerWidth: 420,
    innerHeight: 840,
    document: {
        getElementById: () => null,
        querySelector: () => null,
        querySelectorAll: () => [],
        addEventListener: () => {},
        removeEventListener: () => {}
    },
    localStorage: {
        getItem: () => null,
        setItem: () => {}
    },
    navigator: { language: 'vi' },
    console
};
sandbox.window = sandbox;

function runJs(relPath) {
    const code = fs.readFileSync(path.join(WEB_ROOT, relPath), 'utf8');
    vm.runInNewContext(code, sandbox, { filename: relPath });
}

runJs('js/i18n.js');
runJs('js/config.js');
runJs('js/data.js');
runJs('js/progress.js');
runJs('js/mycamp_config.js');

const cfgOutDir = path.join(UNITY_ASSETS, 'StreamingAssets', 'Config');
ensureDir(cfgOutDir);

const initialBoardForUnity = Object.assign({}, sandbox.GAME_CONFIG.initialBoard, {
    lockedRocksList: Object.keys(sandbox.GAME_CONFIG.initialBoard.lockedRocks || {}).map((cellKey) => ({
        cell: parseInt(cellKey, 10),
        level: sandbox.GAME_CONFIG.initialBoard.lockedRocks[cellKey]
    }))
});

fs.writeFileSync(
    path.join(cfgOutDir, 'game_config.json'),
    JSON.stringify({
        initialBoard: initialBoardForUnity,
        initialProfile: sandbox.GAME_CONFIG.initialProfile,
        gameplay: sandbox.GAME_CONFIG.gameplay,
        energyShop: sandbox.GAME_CONFIG.energyShop,
        adRewards: sandbox.GAME_CONFIG.adRewards,
        discoveryBook: sandbox.GAME_CONFIG.discoveryBook,
        itemExpByLevel: sandbox.GAME_CONFIG.itemExpByLevel,
        levelExpRequirements: sandbox.GAME_CONFIG.levelExpRequirements,
        itemBasePrices: sandbox.GAME_CONFIG.itemBasePrices,
        generatorBranchMap: sandbox.GENERATOR_BRANCH_MAP,
        generators: sandbox.GENERATORS,
        itemMaxLevel: sandbox.ITEM_MAX_LEVEL
    }, null, 2),
    'utf8'
);

fs.writeFileSync(
    path.join(cfgOutDir, 'items_catalog.json'),
    JSON.stringify({
        chains: sandbox.ITEM_CHAINS,
        pets: sandbox.PET_CHARACTERS,
        locations: sandbox.CAMP_LOCATIONS
    }, null, 2),
    'utf8'
);

fs.writeFileSync(
    path.join(cfgOutDir, 'mycamp_config.json'),
    JSON.stringify(sandbox.MYCAMP_CONFIG, null, 2),
    'utf8'
);

fs.writeFileSync(
    path.join(cfgOutDir, 'i18n.json'),
    JSON.stringify({
        ui: sandbox.I18N.ui,
        items: sandbox.I18N.items
    }, null, 2),
    'utf8'
);

// 2. Copy Audio (.wav) & Fonts (.ttf)
const sfxCount = copyDirRecursive(
    path.join(WEB_ROOT, 'assets', 'sfx_library'),
    path.join(UNITY_ASSETS, 'Audio', 'SFX'),
    (name) => name.toLowerCase().endsWith('.wav')
);
const musicCount = copyDirRecursive(
    path.join(WEB_ROOT, 'assets', 'music'),
    path.join(UNITY_ASSETS, 'Audio', 'Music'),
    (name) => /\.(wav|mp3|ogg)$/i.test(name)
);
const fontCount = copyDirRecursive(
    path.join(WEB_ROOT, 'assets', 'fonts'),
    path.join(UNITY_ASSETS, 'Fonts'),
    (name) => /\.(ttf|otf)$/i.test(name)
);

// 3. Copy Sprites PNG/JPG có sẵn từ assets/images + JSON từ npc_sheets
const imgPngCount = copyDirRecursive(
    path.join(WEB_ROOT, 'assets', 'images'),
    path.join(UNITY_ASSETS, 'Sprites'),
    (name) => /\.(png|jpg|jpeg)$/i.test(name)
);
const npcJsonCount = copyDirRecursive(
    path.join(WEB_ROOT, 'assets', 'images_webp', 'npc_sheets'),
    path.join(UNITY_ASSETS, 'Sprites', 'npc_sheets'),
    (name) => /\.json$/i.test(name)
);

// Kiểm tra các file .webp mới chưa có bản .png tương ứng trong assets/images
const missingPngs = [];
function scanWebpWithoutPng(webpDir, relPrefix) {
    if (!fs.existsSync(webpDir)) return;
    for (const entry of fs.readdirSync(webpDir, { withFileTypes: true })) {
        const full = path.join(webpDir, entry.name);
        const rel = path.join(relPrefix, entry.name);
        if (entry.isDirectory()) {
            scanWebpWithoutPng(full, rel);
        } else if (/\.webp$/i.test(entry.name)) {
            const relNorm = rel.replace(/\\/g, '/');
            if (relNorm === 'items/icon_luutru.webp') continue;
            const baseNoExt = rel.replace(/\.webp$/i, '');
            const pngCandidate = path.join(WEB_ROOT, 'assets', 'images', baseNoExt + '.png');
            const jpgCandidate = path.join(WEB_ROOT, 'assets', 'images', baseNoExt + '.jpg');
            if (!fs.existsSync(pngCandidate) && !fs.existsSync(jpgCandidate)) {
                missingPngs.push(relNorm);
            }
        }
    }
}
scanWebpWithoutPng(path.join(WEB_ROOT, 'assets', 'images_webp'), '');

console.log('EXPORT_DONE', JSON.stringify({
    configs: 4,
    sfxWav: sfxCount,
    music: musicCount,
    fonts: fontCount,
    spritesPngJpg: imgPngCount,
    npcSheetJsons: npcJsonCount,
    webpNeedConvertCount: missingPngs.length,
    webpNeedConvertSample: missingPngs.slice(0, 20)
}, null, 2));
