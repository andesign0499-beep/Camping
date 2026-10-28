// ==========================================
// BOARD UI & INTERACTION CONTROLLER
// Sử dụng dữ liệu từ js/data.js, luật chơi từ js/engine.js,
// lưu trữ từ js/progress.js và hệ thống modal từ js/camp.js
// ==========================================

var boardElement = document.getElementById('grid-board');

var currentLevel = 1;
var currentLevelCfg = null;
var boardData = [];
var currentOrders = [];
var selectedIndex = null;
var levelClicks = 0;
var levelUnwantedClicks = 0; // Số lượt nguồn phát rơi lệch sang nhánh không cần thiết (được miễn trừ khi tính Sao)
var isAutoEnabled = false; // AUTO chỉ là chế độ debug, mặc định tắt
var levelWon = false;
var levelBudget = 0; // Ngân sách năng lượng chuẩn của màn: chỉ dùng để tính sao
var isReplayLevel = false; // Màn đã từng thắng -> chơi lại không nhận Vàng/Kim cương
var regenSecLeft = ENERGY_REGEN_SEC;

// Năng lượng dùng chung giữa các màn, lưu trong SAVE (không nạp đầy khi vào màn mới)
var playerEnergy = SAVE.energy;
var playerCoins = SAVE.coins;
var playerGems = SAVE.gems;

var energyUI = document.getElementById('energy-val');
var energyTimerUI = document.getElementById('energy-timer');
var coinUI = document.getElementById('coin-val');
var gemUI = document.getElementById('gem-val');
var currentLvBadgeUI = document.getElementById('current-lv-badge');
var btnSell = document.getElementById('btn-sell');
var sellPriceUI = document.getElementById('sell-price');
var sellBtnTextUI = document.getElementById('sell-btn-text');
var bookBadgeUI = document.getElementById('book-badge');

var levelSelect = document.getElementById('level-select');
var btnPrevLv = document.getElementById('btn-prev-lv');
var btnNextLv = document.getElementById('btn-next-lv');
var btnResetLv = document.getElementById('btn-reset-lv');
var btnRefillEnergy = document.getElementById('btn-refill-energy');
var btnToggleAuto = document.getElementById('btn-toggle-auto');
var ordersContainer = document.getElementById('orders-container');
var webCountUI = document.getElementById('web-count');
var levelStatusMsg = document.getElementById('level-status-msg');

// Bộ đếm gợi ý nước đi tự động sau 10 giây không thao tác (tránh làm phiền người chơi)
var hintTimer = null;
var HINT_DELAY_MS = 10000;

// ==========================================
// ÂM THANH TIẾNG SÁO TRÚC VÒNG HỢP ÂM C TRƯỞNG & BGM CẮM TRẠI (WEB AUDIO API)
// ==========================================
var audioCtx = null;
var mergeComboStep = 0;
var mergeComboCount = 0;
var lastMergeAudioTs = 0;
var bgmGainNode = null;
var bgmOsc1 = null;
var bgmOsc2 = null;
var bgmTimer = null;
var isBgmPlaying = false;

// Vòng hợp âm C Major (Đô trưởng) ngũ cung êm dịu, vòng lặp mượt mà lên rồi xuống (Arpeggio wave)
// C4, E4, G4, A4, C5, D5, E5, G5, A5, C6 rồi lượn lại G5, E5, D5, C5, A4, G4, E4
// Không bao giờ bị kẹt ở nốt quá cao, tạo cảm giác như tiếng suối reo / sáo trúc êm đềm
var FLUTE_CHORD_CYCLE = [
    261.63, // C4
    329.63, // E4
    392.00, // G4
    440.00, // A4
    523.25, // C5
    587.33, // D5
    659.25, // E5
    783.99, // G5
    880.00, // A5
    1046.50,// C6 (Đỉnh)
    880.00, // A5 (Lượn xuống)
    783.99, // G5
    659.25, // E5
    523.25, // C5
    440.00, // A4
    392.00  // G4
];

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function triggerVibrate(pattern) {
    try {
        if (SAVE.settings && !SAVE.settings.vibrate) return;
        if (navigator && navigator.vibrate) navigator.vibrate(pattern);
    } catch (e) {}
}

// Hàm tổng hợp âm sắc Tiếng Sáo Trúc ấm, không chói gắt
function playFluteNote(freq, startTime, duration, peakGain, graceRatio) {
    if (!audioCtx) return;
    var mainOsc = audioCtx.createOscillator();
    var harmOsc = audioCtx.createOscillator();
    var filter = audioCtx.createBiquadFilter();
    var mainGain = audioCtx.createGain();
    var harmGain = audioCtx.createGain();

    mainOsc.type = 'sine';
    harmOsc.type = 'sine';

    // Bộ lọc lowpass lọc sạch tần số cao gắt, giữ âm mộc ấm
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1900, startTime);

    var startFreq = graceRatio ? freq * graceRatio : freq;
    mainOsc.frequency.setValueAtTime(startFreq, startTime);
    harmOsc.frequency.setValueAtTime(startFreq * 2, startTime);
    if (graceRatio) {
        mainOsc.frequency.exponentialRampToValueAtTime(freq, startTime + 0.045);
        harmOsc.frequency.exponentialRampToValueAtTime(freq * 2, startTime + 0.045);
    }

    // Rung sáo nhẹ nhàng
    if (duration >= 0.16) {
        var lfo = audioCtx.createOscillator();
        var lfoGain = audioCtx.createGain();
        lfo.frequency.setValueAtTime(5.0, startTime);
        lfoGain.gain.setValueAtTime(2.6, startTime);
        lfo.connect(lfoGain);
        lfoGain.connect(mainOsc.frequency);
        lfo.start(startTime + 0.04);
        lfo.stop(startTime + duration);
    }

    // Bao hình âm thanh êm ái
    var attack = Math.min(0.025, duration * 0.25);
    mainGain.gain.setValueAtTime(0.001, startTime);
    mainGain.gain.linearRampToValueAtTime(peakGain, startTime + attack);
    mainGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    harmGain.gain.setValueAtTime(0.001, startTime);
    harmGain.gain.linearRampToValueAtTime(peakGain * 0.14, startTime + attack);
    harmGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    mainOsc.connect(filter);
    harmOsc.connect(harmGain);
    harmGain.connect(filter);
    filter.connect(mainGain);
    mainGain.connect(audioCtx.destination);

    mainOsc.start(startTime);
    harmOsc.start(startTime);
    mainOsc.stop(startTime + duration + 0.02);
    harmOsc.stop(startTime + duration + 0.02);
}

// ==========================================
// HỆ THỐNG NHẠC NỀN BGM (3 BÀI HÁT TRONG ASSETS/MUSIC RANDOM XOAY VÒNG)
// ==========================================
var BGM_PLAYLIST = [
    'assets/music/' + encodeURIComponent('Góc_Nhỏ_Nắng_Mai.mp3'),
    'assets/music/' + encodeURIComponent('Khu_Trại_Rạng_Rỡ.mp3'),
    'assets/music/' + encodeURIComponent('Mưa_Vàng_Trên_Khu_Trại.mp3')
];
var bgmAudioElement = null;
var currentBgmIndex = -1;

function getNextRandomBgmIndex() {
    if (BGM_PLAYLIST.length <= 1) return 0;
    var next;
    do {
        next = Math.floor(Math.random() * BGM_PLAYLIST.length);
    } while (next === currentBgmIndex);
    return next;
}

function playBgmTrack(index) {
    if (!SAVE.settings || SAVE.settings.bgm === false) {
        stopBgm();
        return;
    }
    currentBgmIndex = index;
    if (!bgmAudioElement) {
        bgmAudioElement = new Audio();
        bgmAudioElement.volume = 0.35; // Âm lượng nhạc nền êm dịu hài hòa với tiếng SFX
        bgmAudioElement.addEventListener('ended', function () {
            // Khi hết bài, tự động random bài tiếp theo xoay vòng
            playBgmTrack(getNextRandomBgmIndex());
        });
        bgmAudioElement.addEventListener('error', function (e) {
            console.warn('BGM load error, skipping to next track:', e);
            setTimeout(function () {
                if (SAVE.settings && SAVE.settings.bgm !== false) {
                    playBgmTrack(getNextRandomBgmIndex());
                }
            }, 2000);
        });
    }

    bgmAudioElement.src = BGM_PLAYLIST[currentBgmIndex];
    bgmAudioElement.currentTime = 0;
    var playPromise = bgmAudioElement.play();
    if (playPromise !== undefined) {
        playPromise.catch(function (err) {
            // Trình duyệt có thể chặn nếu chưa có cử chỉ người dùng
            console.log('Autoplay deferred until user interaction');
        });
    }
}

function startBgm() {
    if (!SAVE.settings || SAVE.settings.bgm === false) return;
    if (bgmAudioElement && !bgmAudioElement.paused) return;
    if (currentBgmIndex === -1) {
        currentBgmIndex = Math.floor(Math.random() * BGM_PLAYLIST.length);
    }
    if (bgmAudioElement && bgmAudioElement.src) {
        bgmAudioElement.play().catch(function () {});
    } else {
        playBgmTrack(currentBgmIndex);
    }
}

function stopBgm() {
    if (bgmAudioElement) {
        bgmAudioElement.pause();
    }
}

function updateBgmPlayback() {
    if (SAVE.settings && SAVE.settings.bgm !== false) {
        startBgm();
    } else {
        stopBgm();
    }
}

// ==========================================
// HỆ THỐNG HIỆU ỨNG ÂM THANH SFX ĐỒNG BỘ (ĐÔ TRƯỞNG C-MAJOR ẤM ÁP)
// ==========================================
function playSound(type, itemId) {
    try {
        if (SAVE.settings && !SAVE.settings.sound) return;
        initAudio();
        if (!audioCtx) return;
        var now = audioCtx.currentTime;

        if (type === 'spawn') {
            // Tiếng gõ mộc ấm khi lấy đồ từ nguồn phát (G4 thanh thoát)
            playFluteNote(392.00, now, 0.08, 0.07, 0.96);
        } else if (type === 'merge') {
            // Chuỗi hợp âm Đô Trưởng tuần hoàn lên rồi xuống êm dịu, không gắt tai
            var nowMs = Date.now();
            var windowMs = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.gameplay && GAME_CONFIG.gameplay.combo && GAME_CONFIG.gameplay.combo.windowSec)
                ? GAME_CONFIG.gameplay.combo.windowSec * 1000
                : 3500;
            if (nowMs - lastMergeAudioTs < windowMs) {
                mergeComboStep = (mergeComboStep + 1) % FLUTE_CHORD_CYCLE.length;
                mergeComboCount++;
            } else {
                var itemLv = 2;
                if (itemId && itemId.indexOf('_lv') !== -1) {
                    itemLv = parseInt(itemId.split('_lv')[1]) || 2;
                }
                mergeComboStep = (itemLv - 2) % 4;
                mergeComboCount = 1;
            }
            lastMergeAudioTs = nowMs;

            var n1 = FLUTE_CHORD_CYCLE[mergeComboStep];
            var nextIdx = (mergeComboStep + 1) % FLUTE_CHORD_CYCLE.length;
            var n2 = FLUTE_CHORD_CYCLE[nextIdx];

            // Nốt dạo nhẹ + nốt sáo chính vang mượt
            playFluteNote(n1, now, 0.09, 0.09, 0.97);
            playFluteNote(n2, now + 0.05, 0.20, 0.12, 0.96);
            triggerVibrate(15);
        } else if (type === 'bonus') {
            // Hợp âm C5 - G5 êm ái khi nhận hộp tiếp tế hoặc bán đồ
            playFluteNote(523.25, now, 0.12, 0.09, 0.96);
            playFluteNote(783.99, now + 0.06, 0.22, 0.11, 0.96);
        } else if (type === 'sweep') {
            // Âm thanh vút quét chổi nhẹ nhàng: lướt 3 nốt nhẹ C5 -> E5 -> G5 mượt mà
            var sweepNotes = [523.25, 659.25, 783.99];
            sweepNotes.forEach((freq, idx) => {
                playFluteNote(freq, now + idx * 0.05, 0.12, 0.10, 0.96);
            });
            triggerVibrate(20);
        } else if (type === 'win') {
            // Khúc hòa tấu khải hoàn 5 nốt ngũ cung Đô Trưởng (C5, E5, G5, A5, C6)
            var winNotes = [523.25, 659.25, 783.99, 880.00, 1046.50];
            winNotes.forEach((freq, idx) => {
                var dur = (idx === winNotes.length - 1) ? 0.35 : 0.14;
                playFluteNote(freq, now + idx * 0.08, dur, 0.12, 0.96);
            });
            triggerVibrate([25, 45, 35]);
        }
    } catch (e) { console.log(e); }
}

// ==========================================
// HIỆU ỨNG NỔ HẠT & THÔNG BÁO NỔI
// ==========================================
function triggerParticleBurst(cellElement, customColors) {
    if (!cellElement) return;
    var rect = cellElement.getBoundingClientRect();
    var cx = rect.left + rect.width / 2;
    var cy = rect.top + rect.height / 2;
    var colors = customColors || ['#ffeb3b', '#ff9800', '#ff5722', '#00e676', '#ffffff'];

    var ring = document.createElement('div');
    ring.style.cssText = 'position:fixed;pointer-events:none;z-index:99998;border-radius:50%;' +
        'border:4px solid #fff59d;box-shadow:0 0 20px #ffeb3b;' +
        'left:' + cx + 'px;top:' + cy + 'px;width:' + rect.width * 0.5 + 'px;height:' + rect.width * 0.5 + 'px;';
    document.body.appendChild(ring);
    ring.animate([
        { transform: 'translate(-50%, -50%) scale(0.5)', opacity: 1 },
        { transform: 'translate(-50%, -50%) scale(2.2)', opacity: 0 }
    ], { duration: 450, easing: 'ease-out', fill: 'forwards' }).onfinish = () => ring.remove();
    setTimeout(() => ring.remove(), 700);

    var count = 24;
    for (let i = 0; i < count; i++) {
        var p = document.createElement('div');
        var size = 6 + Math.random() * 8;
        p.style.cssText = 'position:fixed;pointer-events:none;z-index:99999;border-radius:50%;' +
            'left:' + cx + 'px;top:' + cy + 'px;width:' + size + 'px;height:' + size + 'px;' +
            'background:' + colors[i % colors.length] + ';box-shadow:0 0 10px ' + colors[i % colors.length] + ';';
        document.body.appendChild(p);

        var angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
        var distance = rect.width * (0.7 + Math.random() * 0.9);
        var tx = Math.cos(angle) * distance;
        var ty = Math.sin(angle) * distance;

        p.animate([
            { transform: 'translate(-50%, -50%) scale(1.3)', opacity: 1 },
            { transform: 'translate(calc(-50% + ' + tx + 'px), calc(-50% + ' + ty + 'px)) scale(0.1)', opacity: 0 }
        ], {
            duration: 500 + Math.random() * 300,
            easing: 'cubic-bezier(0, .9, .57, 1)',
            fill: 'forwards'
        }).onfinish = () => p.remove();
        setTimeout(() => p.remove(), 1200);
    }

    var img = cellElement.querySelector('.item-img');
    if (img) {
        img.animate([
            { transform: 'scale(0.6)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }
        ], { duration: 350, easing: 'ease-out' });
    }
}

function showFloatingBadge(cellElement, text, color) {
    if (!cellElement) return;
    var rect = cellElement.getBoundingClientRect();
    var tag = document.createElement('div');
    tag.textContent = text;
    tag.style.cssText = 'position:fixed;pointer-events:none;z-index:100001;font-weight:800;font-size:12px;line-height:16px;' +
        'padding:4px 8px;border-radius:8px;color:#fff;background:' + (color || '#2e7d32') + ';' +
        'box-shadow:0 4px 8px rgba(0,0,0,.35);left:' + (rect.left + rect.width / 2) + 'px;top:' + rect.top + 'px;';
    document.body.appendChild(tag);
    tag.animate([
        { transform: 'translate(-50%, 0) scale(0.8)', opacity: 1 },
        { transform: 'translate(-50%, -28px) scale(1.05)', opacity: 0 }
    ], { duration: 900, easing: 'ease-out', fill: 'forwards' }).onfinish = () => tag.remove();
    setTimeout(() => tag.remove(), 1100);
}

// Hiệu ứng Combo x2, x3, x4... thị giác nổi bật, tự động đổi màu rực rỡ theo cấp combo và hiển thị số Vàng thưởng
function triggerComboEffect(cellElement, comboCount, comboGold) {
    if (!cellElement) return;
    var rect = cellElement.getBoundingClientRect();
    var comboTag = document.createElement('div');
    comboTag.className = 'combo-popup-badge';
    var html = '🔥 COMBO x' + comboCount + '!';
    if (comboGold > 0) {
        html += ' <span style="display:inline-flex;align-items:center;gap:3px;margin-left:4px;color:#fffde7;">(+' + comboGold + ' <img src="assets/images/ui/icon_glod.png" style="width:14px;height:14px;vertical-align:middle;">)</span>';
    }
    comboTag.innerHTML = html;
    if (comboGold > 0) {
        playCoinChime(comboCount);
    }

    var comboGradients = [
        'linear-gradient(135deg, #ff9800, #f57c00)',
        'linear-gradient(135deg, #ff5722, #e64a19)',
        'linear-gradient(135deg, #e91e63, #c2185b)',
        'linear-gradient(135deg, #9c27b0, #7b1fa2)',
        'linear-gradient(135deg, #673ab7, #512da8)',
        'linear-gradient(135deg, #00bcd4, #0097a7)'
    ];
    var bg = comboGradients[(comboCount - 2) % comboGradients.length];

    comboTag.style.cssText = 'position:fixed;pointer-events:none;z-index:100002;font-weight:900;' +
        'font-size:' + (comboCount >= 4 ? '16px' : '12px') + ';line-height:16px;' +
        'padding:4px 12px;border-radius:16px;color:#fff;background:' + bg + ';' +
        'border:2px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,.4);' +
        'left:' + (rect.left + rect.width / 2) + 'px;top:' + (rect.top - 12) + 'px;';
    document.body.appendChild(comboTag);

    comboTag.animate([
        { transform: 'translate(-50%, 0) scale(0.6)', opacity: 0 },
        { transform: 'translate(-50%, -16px) scale(1.25)', opacity: 1, offset: 0.25 },
        { transform: 'translate(-50%, -24px) scale(1)', opacity: 1, offset: 0.65 },
        { transform: 'translate(-50%, -44px) scale(0.9)', opacity: 0 }
    ], { duration: 950, easing: 'cubic-bezier(.17,.89,.32,1.25)', fill: 'forwards' }).onfinish = () => comboTag.remove();
    setTimeout(() => comboTag.remove(), 1150);
}

// Âm thanh tiếng đồng xu vàng ngân vang trong trẻo theo ngũ cung Đô Trưởng C-Major (C6, D6, E6, G6, A6, C7)
var COIN_CHIME_NOTES = [1046.50, 1174.66, 1318.51, 1567.98, 1760.00, 2093.00, 1760.00, 1567.98];
function playCoinChime(stepIdx) {
    try {
        if (SAVE.settings && !SAVE.settings.sound) return;
        initAudio();
        if (!audioCtx) return;
        var now = audioCtx.currentTime;
        var freq = COIN_CHIME_NOTES[(stepIdx || 0) % COIN_CHIME_NOTES.length];

        var osc = audioCtx.createOscillator();
        var filter = audioCtx.createBiquadFilter();
        var gain = audioCtx.createGain();

        osc.type = 'sine'; // Dùng sine tròn tiếng, êm ái
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2600, now); // Lọc sạch tiếng kim loại sắc chói

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.05, now + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.13);
    } catch (e) {}
}

// Hiệu ứng mưa đồng Vàng (icon_glod.png) & Kim Cương (icon_ruby.png) kèm số tiền bay lần lượt lên thanh HUD
function spawnFlyingCurrency(sourceEl, type, amount) {
    if (!sourceEl || amount <= 0) return;
    var targetBanner = document.getElementById(type === 'ruby' ? 'btn-gem-shop' : 'btn-coin-shop');
    var srcRect = sourceEl.getBoundingClientRect();
    var startX = srcRect.left + srcRect.width / 2;
    var startY = srcRect.top + srcRect.height / 2;

    var endX = startX;
    var endY = 24;
    if (targetBanner) {
        var tgtRect = targetBanner.getBoundingClientRect();
        endX = tgtRect.left - 4;
        endY = tgtRect.top + tgtRect.height / 2;
    }

    var iconSrc = type === 'ruby' ? 'assets/images/ui/icon_ruby.png' : 'assets/images/ui/icon_glod.png';
    var badgeColor = type === 'ruby' ? '#1e88e5' : '#f57f17';

    // Số lượng đồng xu bay lên lần lượt (5 - 9 đồng cho Vàng, 2 - 5 viên cho Kim cương)
    var count = type === 'ruby'
        ? Math.min(Math.max(2, amount * 2), 5)
        : Math.min(Math.max(5, Math.round(amount / 6)), 9);

    var basePerPiece = Math.floor(amount / count);
    var remainder = amount - basePerPiece * count;

    for (let i = 0; i < count; i++) {
        let pieceVal = basePerPiece + (i === count - 1 ? remainder : 0);
        if (pieceVal <= 0) pieceVal = 1;

        setTimeout(() => {
            // Tạo đồng xu độc lập trong phạm vi block (let) và fill: 'none' để không bao giờ bị kẹt lại trên màn hình
            let coin = document.createElement('img');
            coin.src = iconSrc;
            coin.className = 'flying-currency';

            let scatterX = (Math.random() - 0.5) * 28;
            let scatterY = (Math.random() - 0.5) * 20;
            let sx = startX + scatterX;
            let sy = startY + scatterY;

            coin.style.left = sx + 'px';
            coin.style.top = sy + 'px';
            document.body.appendChild(coin);

            // Tạo số tiền (+X) bay lên lần lượt theo từng đồng xu
            let numTag = document.createElement('div');
            numTag.textContent = '+' + pieceVal;
            numTag.style.cssText = 'position:fixed;pointer-events:none;z-index:180001;font-family:"Baloo 2","Nunito",sans-serif;' +
                'font-weight:800;font-size:12px;line-height:16px;padding:0 4px;border-radius:4px;color:#fff;' +
                'background:' + badgeColor + ';box-shadow:0 2px 4px rgba(0,0,0,0.3);' +
                'left:' + sx + 'px;top:' + (sy - 8) + 'px;';
            document.body.appendChild(numTag);

            let numAnim = numTag.animate([
                { transform: 'translate(-50%, 0) scale(0.8)', opacity: 1 },
                { transform: 'translate(-50%, -32px) scale(1.05)', opacity: 0 }
            ], { duration: 520, easing: 'ease-out', fill: 'none' });
            numAnim.onfinish = () => numTag.remove();
            numAnim.oncancel = () => numTag.remove();
            setTimeout(() => { if (numTag.parentNode) numTag.remove(); }, 560);

            let dx = endX - sx;
            let dy = endY - sy;
            let arcX = dx * 0.4 + (i % 2 === 0 ? -24 : 24);
            let arcY = dy * 0.4 - 32;

            let anim = coin.animate([
                { transform: 'translate(-50%, -50%) scale(0.5)', opacity: 1 },
                { transform: 'translate(calc(-50% + ' + arcX + 'px), calc(-50% + ' + arcY + 'px)) scale(1.15)', opacity: 1, offset: 0.45 },
                { transform: 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px)) scale(0.6)', opacity: 0 }
            ], {
                duration: 540,
                easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                fill: 'none'
            });

            let cleaned = false;
            let finishCoin = () => {
                if (cleaned) return;
                cleaned = true;
                if (coin.parentNode) coin.remove();
                playCoinChime(i);
                if (targetBanner) {
                    targetBanner.animate([
                        { transform: 'scale(1)' },
                        { transform: 'scale(1.12)' },
                        { transform: 'scale(1)' }
                    ], { duration: 160, easing: 'ease-out' });
                }
            };

            anim.onfinish = finishCoin;
            anim.oncancel = () => { if (coin.parentNode) coin.remove(); };
            setTimeout(() => { if (coin.parentNode) coin.remove(); }, 600);
        }, i * 70);
    }
}

function getItemImagePath(id) {
    return id === 'ban_lv8' ? 'assets/images/items/ban_level8.png' : `assets/images/items/${id}.png`;
}

// ==========================================
// HỒI NĂNG LƯỢNG THEO TƯƠNG TÁC (TỰ ĐỘNG +1 SAU MỖI 30S TƯƠNG TÁC TÍCH CỰC)
// Năng lượng chỉ hồi khi người chơi tương tác với game.
// Nếu sau 30s người chơi không tương tác, bộ đếm dừng lại chờ tương tác rồi mới đếm tiếp.
// ==========================================
var lastUserInteractionTs = Date.now();

function recordUserInteraction() {
    lastUserInteractionTs = Date.now();
}

if (typeof window !== 'undefined') {
    ['pointerdown', 'touchstart', 'mousedown', 'keydown'].forEach(function (evt) {
        window.addEventListener(evt, recordUserInteraction, { passive: true });
    });
}

function isUserInteracting() {
    var intervalSec = (typeof getEnergyRegenSec === 'function') ? getEnergyRegenSec() : ENERGY_REGEN_SEC;
    return (Date.now() - lastUserInteractionTs) <= (intervalSec * 1000);
}

function tickEnergyRegen() {
    var maxE = getMaxEnergy();
    var intervalSec = (typeof getEnergyRegenSec === 'function') ? getEnergyRegenSec() : ENERGY_REGEN_SEC;
    if (playerEnergy >= maxE) {
        regenSecLeft = intervalSec;
        return;
    }

    // Nếu sau thời gian hồi người chơi không tương tác: dừng bộ đếm chờ tương tác tiếp theo
    if (!isUserInteracting()) {
        return;
    }

    // Người chơi có tương tác: đếm lùi 1 giây
    regenSecLeft--;
    if (regenSecLeft <= 0) {
        regenSecLeft = intervalSec;
        playerEnergy++;
        SAVE.energy = playerEnergy;
        saveGame();
        if (energyUI) {
            energyUI.innerText = playerEnergy;
            energyUI.animate([
                { transform: 'scale(1)' },
                { transform: 'scale(1.25)', color: '#ffb300' },
                { transform: 'scale(1)' }
            ], { duration: 320, easing: 'ease-out' });
        }
        var energyBanner = document.getElementById('btn-refill-energy');
        if (energyBanner) {
            triggerParticleBurst(energyBanner, ['#fff700', '#ffd54f', '#ffeb3b', '#ffffff']);
            var icon = energyBanner.querySelector('.hud-stat-icon');
            if (icon) {
                icon.animate([
                    { transform: 'scale(1)' },
                    { transform: 'scale(1.3) rotate(-10deg)', filter: 'drop-shadow(0 0 10px #ffe082)' },
                    { transform: 'scale(1) rotate(0deg)' }
                ], { duration: 350, easing: 'cubic-bezier(.2,.85,.32,1.2)' });
            }
        }
    }

    if (energyTimerUI) {
        energyTimerUI.style.display = 'none';
    }
}
setInterval(tickEnergyRegen, 1000);

// ==========================================
// HỆ THỐNG NHÂN VẬT ĐỒNG HÀNH TRÊN ĐỈNH KHUNG BÀN CỜ
// Nhân vật luôn xuất hiện phía trên khung trò chơi và trò chuyện với khán giả theo kịch bản 45 Level
// ==========================================
var npcAvatarBtn = document.getElementById('npc-avatar-btn');
var npcAvatarImg = document.getElementById('npc-avatar-img');
var npcMoodDot = document.getElementById('npc-mood-dot');
var npcSpeakerName = document.getElementById('npc-speaker-name');
var npcSpeechBubble = document.getElementById('npc-speech-bubble');
var npcSpeechText = document.getElementById('npc-speech-text');
var npcBubbleTimer = null;
var currentNpcIndex = 0;
var levelIntroShown = false;
var tutMergeCount = 0;
var tutDeliveredOnce = false;

function updateCompanionAvatar() {
    var activeId = (typeof SAVE !== 'undefined' && SAVE && SAVE.activePet) ? SAVE.activePet : 'character01';
    var pet = (typeof PET_CHARACTERS !== 'undefined') ? PET_CHARACTERS.find(function (p) { return p.id === activeId; }) : null;
    var imgPath = pet ? pet.img : ('assets/images/ui/' + activeId + '.png');
    if (!npcAvatarImg) npcAvatarImg = document.getElementById('npc-avatar-img');
    if (npcAvatarImg) {
        npcAvatarImg.src = imgPath;
        if (pet) npcAvatarImg.alt = pet.name;
    }
}
window.updateCompanionAvatar = updateCompanionAvatar;

function getNpcById(npcId) {
    return (typeof NPC_CHARACTERS !== 'undefined' && NPC_CHARACTERS[npcId])
        ? NPC_CHARACTERS[npcId]
        : { id: 'gau', name: 'Cắm Trại Viên', avatar: 'assets/images/ui/character01.png' };
}

function getNextNpcId() {
    var order = (typeof NPC_ORDER !== 'undefined') ? NPC_ORDER : ['gau', 'cao', 'de'];
    currentNpcIndex = (currentNpcIndex + 1) % order.length;
    return order[currentNpcIndex];
}

function getCurrentNpcId() {
    var order = (typeof NPC_ORDER !== 'undefined') ? NPC_ORDER : ['gau', 'cao', 'de'];
    return order[currentNpcIndex % order.length];
}

function clearTutorialHand() {
    var old = document.getElementById('tutorial-hand');
    if (old) old.remove();
}

function showTutorialHandTap(targetEl) {
    clearTutorialHand();
    if (!targetEl) return;
    var rect = targetEl.getBoundingClientRect();
    if (!rect.width) return;
    var hand = document.createElement('div');
    hand.id = 'tutorial-hand';
    hand.textContent = '👆';
    hand.style.left = (rect.left + rect.width * 0.5) + 'px';
    hand.style.top = (rect.top + rect.height * 0.55) + 'px';
    document.body.appendChild(hand);
    hand.animate([
        { transform: 'translate(-50%, 0) scale(1)' },
        { transform: 'translate(-50%, -12px) scale(0.88)' },
        { transform: 'translate(-50%, 0) scale(1)' }
    ], { duration: 850, iterations: Infinity, easing: 'ease-in-out' });
}

function showTutorialHandDrag(fromEl, toEl) {
    clearTutorialHand();
    if (!fromEl || !toEl) return;
    var r1 = fromEl.getBoundingClientRect();
    var r2 = toEl.getBoundingClientRect();
    if (!r1.width || !r2.width) return;
    var dx = (r2.left + r2.width * 0.5) - (r1.left + r1.width * 0.5);
    var dy = (r2.top + r2.height * 0.5) - (r1.top + r1.height * 0.5);

    var hand = document.createElement('div');
    hand.id = 'tutorial-hand';
    hand.textContent = '👆';
    hand.style.left = (r1.left + r1.width * 0.5) + 'px';
    hand.style.top = (r1.top + r1.height * 0.5) + 'px';
    document.body.appendChild(hand);
    hand.animate([
        { transform: 'translate(-50%, 0) scale(1)', opacity: 0.95 },
        { transform: 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px)) scale(0.92)', opacity: 1 },
        { transform: 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px)) scale(0.85)', opacity: 0 }
    ], { duration: 1350, iterations: Infinity, easing: 'ease-in-out' });
}

function setNpcState(npcId, moodEmoji, speechText, autoHideMs) {
    if (npcMoodDot) {
        npcMoodDot.textContent = moodEmoji || '💡';
    }
    if (npcBubbleTimer) {
        clearTimeout(npcBubbleTimer);
        npcBubbleTimer = null;
    }
    if (document.getElementById('modal-overlay')) {
        hideNpcBubble();
        return;
    }
    if (speechText && npcSpeechBubble && npcSpeechText) {
        npcSpeechText.textContent = speechText;
        npcSpeechBubble.style.display = 'flex';
        if (npcAvatarBtn) npcAvatarBtn.classList.add('talking');
        if (autoHideMs && autoHideMs > 0) {
            npcBubbleTimer = setTimeout(hideNpcBubble, autoHideMs);
        }
    } else {
        hideNpcBubble();
    }
}

function hideNpcBubble() {
    if (npcBubbleTimer) {
        clearTimeout(npcBubbleTimer);
        npcBubbleTimer = null;
    }
    if (npcSpeechBubble) npcSpeechBubble.style.display = 'none';
    if (npcAvatarBtn) npcAvatarBtn.classList.remove('talking');
}

function clearHintVisuals() {
    clearTutorialHand();
    if (!boardElement) return;
    boardElement.querySelectorAll('.hint-pulse').forEach(c => c.classList.remove('hint-pulse'));
}

function updateLevel1Tutorial() {
    if (currentLevel !== 1 || levelWon || isAutoEnabled || document.getElementById('modal-overlay')) return false;

    // Bước 3: Chỉ hướng dẫn nộp đơn ở lần đầu tiên có đơn hàng hoàn thành
    var readyCard = ordersContainer ? ordersContainer.querySelector('.order-card.ready') : null;
    if (readyCard && !tutDeliveredOnce) {
        showTutorialHandTap(readyCard);
        setNpcState('cao', '❗', 'Đủ món rồi! Chạm vào ô NỘP viền xanh bên dưới để giao đơn nhận Vàng nhé!', 0);
        return true;
    }

    // Bước 2: Chỉ hướng dẫn kéo ghép ở lần ghép đầu tiên (tutMergeCount === 0)
    var best = findBestMerge(boardData, currentOrders, currentLevelCfg);
    if (best && tutMergeCount === 0) {
        var cFrom = boardElement.children[best.from];
        var cTo = boardElement.children[best.to];
        if (cFrom) cFrom.classList.add('hint-pulse');
        if (cTo) cTo.classList.add('hint-pulse');
        showTutorialHandDrag(cFrom, cTo);
        var isWebTarget = boardData[best.to] && boardData[best.to].isLocked;
        var itemName = getItemDisplayName(boardData[best.from].id);
        if (isWebTarget) {
            setNpcState('de', '🕸️', 'Kéo ' + itemName + ' thả đè lên ô Mạng Nhện cùng loại để phá nhện và nâng cấp nhé!', 0);
        } else {
            setNpcState('de', '✨', 'Kéo 2 ' + itemName + ' chồng lên nhau để ghép lên cấp cao hơn nhé!', 0);
        }
        return true;
    }

    // Bước 1: Chỉ hướng dẫn bấm nguồn phát khi mới vào màn 1 (levelClicks === 0) hoặc chưa có cặp ghép cho lần ghép đầu
    if (levelClicks === 0 || (tutMergeCount === 0 && !best)) {
        var genIdx = -1;
        boardData.forEach((c, idx) => {
            if (genIdx === -1 && c && GENERATORS[c.id] && !c.isLocked) genIdx = idx;
        });
        if (genIdx !== -1 && boardElement.children[genIdx]) {
            var genCell = boardElement.children[genIdx];
            genCell.classList.add('hint-pulse');
            showTutorialHandTap(genCell);
            var genName = (typeof getItemCleanName === 'function')
                ? getItemCleanName(boardData[genIdx].id)
                : 'Ba Lô Dã Ngoại';
            var msg = levelClicks === 0
                ? 'Chào mừng tới khu cắm trại! Chạm vào ' + genName + ' trên bàn cờ để lấy nguyên liệu nhé!'
                : 'Chạm thêm 1 lần vào ' + genName + ' để có đủ cặp ghép nhé!';
            setNpcState('gau', '👆', msg, 0);
            return true;
        }
    }

    return false;
}

function scheduleHint() {
    clearHintVisuals();
    if (hintTimer) clearTimeout(hintTimer);
    if (levelWon || document.getElementById('modal-overlay')) {
        hideNpcBubble();
        return;
    }
    if (updateLevel1Tutorial()) {
        return;
    }

    // Mặc định ẩn hộp thoại khi người chơi đang thao tác bình thường; chỉ hiện sau 10 giây không tương tác
    hintTimer = setTimeout(() => showIdleHint(false), HINT_DELAY_MS);
}

function buildCharacterHintText(npcId, actionType, itemName) {
    if (actionType === 'deliver') {
        return 'Đơn hàng đã hoàn thành! Chạm vào ô NỘP viền xanh ngay bên dưới để nhận Vàng thưởng nhé!';
    }
    if (actionType === 'merge_web') {
        return 'Thử kéo ' + itemName + ' đè lên ô Mạng Nhện cùng loại đang sáng để phá nhện nhé!';
    }
    if (actionType === 'merge_free') {
        return 'Mình thấy 2 ' + itemName + ' giống nhau kìa, ghép chúng lại để hoàn thành nhiệm vụ Màn ' + currentLevel + ' nhé!';
    }
    if (actionType === 'spawn') {
        return 'Bàn cờ hết cặp ghép rồi, chạm vào Nguồn phát đang lấp lánh để lấy thêm nguyên liệu nhé!';
    }
    return '';
}

function showIdleHint(isManualClick) {
    if (levelWon || dragState || document.getElementById('modal-overlay')) return;
    clearHintVisuals();

    var speakerId = getNextNpcId();

    var readyCard = ordersContainer ? ordersContainer.querySelector('.order-card.ready') : null;
    if (readyCard) {
        showTutorialHandTap(readyCard);
        setNpcState(speakerId, '❗', buildCharacterHintText(speakerId, 'deliver', ''), 4500);
        return;
    }

    var best = findBestMerge(boardData, currentOrders, currentLevelCfg);
    if (best) {
        var cFrom = boardElement.children[best.from];
        var cTo = boardElement.children[best.to];
        if (cFrom) cFrom.classList.add('hint-pulse');
        if (cTo) cTo.classList.add('hint-pulse');
        var itemName = getItemDisplayName(boardData[best.from].id);
        var isWeb = boardData[best.to] && boardData[best.to].isLocked;
        setNpcState(speakerId, '💡', buildCharacterHintText(speakerId, isWeb ? 'merge_web' : 'merge_free', itemName), 4500);
        return;
    }

    var empties = getEmptyIndexes(boardData);
    if (playerEnergy > 0 && empties.length > 0) {
        boardData.forEach((c, idx) => {
            if (c && GENERATORS[c.id] && !c.isLocked && boardElement.children[idx]) {
                boardElement.children[idx].classList.add('hint-pulse');
            }
        });
        setNpcState(speakerId, '⚡', buildCharacterHintText(speakerId, 'spawn', ''), 4500);
        return;
    }

    if (playerEnergy <= 0) {
        setNpcState('gau', '⚡', 'Hết năng lượng mất rồi! Bấm vào biểu tượng Năng lượng ở góc trên để tiếp sức nhé!', 4500);
        return;
    }
    if (empties.length === 0) {
        setNpcState('de', '🗑️', 'Bàn cờ đầy kín rồi! Hãy chạm chọn 1 món cấp thấp rồi bấm nút BÁN ở dưới để giải phóng ô trống nhé!', 4500);
    }
}

// ==========================================
// TẢI LEVEL & VẼ BÀN CỜ (CÓ LƯU & KHÔI PHỤC TRẠNG THÁI ĐANG CHƠI)
// ==========================================
function persistCurrentBoardState() {
    if (levelWon) {
        SAVE.currentBoardState = null;
    } else if (boardData && boardData.length) {
        SAVE.currentBoardState = {
            level: currentLevel,
            boardData: boardData.map(function (c) {
                return c ? { id: c.id, isRock: !!c.isRock, isLocked: !!c.isLocked } : makeEmptyCell();
            }),
            currentOrders: (currentOrders || []).map(function (o) {
                return { id: o.id, done: !!o.done };
            }),
            levelClicks: levelClicks,
            levelUnwantedClicks: levelUnwantedClicks,
            levelBudget: levelBudget,
            isReplayLevel: isReplayLevel,
            savedAt: Date.now()
        };
        SAVE.level = currentLevel;
    }
    saveGame();
}

function loadLevel(lvNum, options) {
    options = options || {};
    closeModal();
    clearHintVisuals();
    hideNpcBubble();
    updateCompanionAvatar();
    currentLevel = lvNum;
    currentLevelCfg = getLevelConfig(lvNum);
    var topSceneEl = document.getElementById('top-scene');
    if (topSceneEl && typeof getLevelBackground === 'function') {
        topSceneEl.style.backgroundImage = "url('" + getLevelBackground(lvNum) + "')";
    }
    levelClicks = 0;
    levelUnwantedClicks = 0;
    if (typeof resetGeneratorPity === 'function') {
        resetGeneratorPity();
    }
    tutMergeCount = 0;
    tutDeliveredOnce = false;
    levelIntroShown = false;
    levelWon = false;

    if (typeof LEVEL_STORY_DIALOGUES !== 'undefined' && LEVEL_STORY_DIALOGUES[lvNum]) {
        var leadNpc = LEVEL_STORY_DIALOGUES[lvNum].npc;
        var idx = (typeof NPC_ORDER !== 'undefined') ? NPC_ORDER.indexOf(leadNpc) : 0;
        currentNpcIndex = idx >= 0 ? idx : 0;
    }

    if (levelSelect) levelSelect.value = lvNum;
    selectedIndex = null;
    updateSellButton(null);

    // Phục hồi nguyên trạng bàn cờ và đơn hàng người chơi đang chơi dở từ localStorage
    var hasSavedState = !options.forceReset &&
        SAVE.currentBoardState &&
        SAVE.currentBoardState.level === lvNum &&
        Array.isArray(SAVE.currentBoardState.boardData) &&
        SAVE.currentBoardState.boardData.length === TOTAL_CELLS &&
        Array.isArray(SAVE.currentBoardState.currentOrders);

    if (hasSavedState) {
        boardData = SAVE.currentBoardState.boardData.map(function (c) {
            return c ? { id: c.id, isRock: !!c.isRock, isLocked: !!c.isLocked } : makeEmptyCell();
        });
        currentOrders = SAVE.currentBoardState.currentOrders.map(function (o) {
            return { id: o.id, done: !!o.done };
        });
        levelClicks = SAVE.currentBoardState.levelClicks || 0;
        levelUnwantedClicks = SAVE.currentBoardState.levelUnwantedClicks || 0;
        levelBudget = SAVE.currentBoardState.levelBudget || computeEnergyBudget(boardData, currentOrders.map(o => o.id), currentLevelCfg);
        isReplayLevel = SAVE.currentBoardState.isReplayLevel !== undefined ? SAVE.currentBoardState.isReplayLevel : !!SAVE.stars[lvNum];
    } else {
        boardData = buildBoard(currentLevelCfg);
        var orderIds = tuneOrders(currentLevelCfg.rawOrders, lvNum, currentLevelCfg);
        currentOrders = orderIds.map(id => ({ id: id, done: false }));

        // Khởi tạo cặp vật phẩm mồi thuộc đúng nhánh đơn hàng đang cần (từ Lv.3 trở đi)
        populateInitialBoardItems();

        levelBudget = computeEnergyBudget(boardData, orderIds, currentLevelCfg);
        isReplayLevel = !!SAVE.stars[lvNum];
        persistCurrentBoardState();
    }

    if (isAutoEnabled) {
        fillBoardInstantly();
    }

    renderBoard();

    // Hiển thị lời thoại cốt truyện của màn chơi khi vào màn (từ Lv.2+, hoặc khi đã qua hướng dẫn cơ bản)
    if (!levelIntroShown && typeof LEVEL_STORY_DIALOGUES !== 'undefined' && LEVEL_STORY_DIALOGUES[lvNum]) {
        levelIntroShown = true;
        if (lvNum > 1) {
            var dlg = LEVEL_STORY_DIALOGUES[lvNum];
            setNpcState(dlg.npc || 'gau', '💬', dlg.text, 5500);
        }
    }
}

// Khởi tạo nhẹ bàn cờ khi bắt đầu màn mới:
// - Lv.1 -> Lv.4 (bàn 5x5 nhỏ) đã có sẵn các món freeItems mồi ngay cạnh mạng nhện nên không rải thêm đồ ngẫu nhiên.
// - Lv.5 -> Lv.10: rải 1 cặp (2 món Lv.1) ưu tiên đúng dòng sản phẩm nằm trong đơn hàng.
// - Lv.11+: rải tối đa 2 cặp (4 món Lv.1) ưu tiên đúng các dòng sản phẩm nằm trong đơn hàng của màn chơi.
function populateInitialBoardItems() {
    if (currentLevel <= 4) return;

    var generators = [];
    boardData.forEach((c, idx) => {
        if (c && GENERATORS[c.id] && !c.isLocked) generators.push(idx);
    });
    if (!generators.length) return;

    var empties = getEmptyIndexes(boardData);
    if (!empties.length) return;

    // Thu thập các dòng sản phẩm từ các máy sinh đồ trong màn
    var genLines = [];
    generators.forEach(genIdx => {
        var genId = boardData[genIdx].id;
        var list = GENERATORS[genId] || [];
        list.forEach(id => {
            var line = id.split('_lv')[0];
            if (genLines.indexOf(line) === -1) {
                genLines.push(line);
            }
        });
    });

    // Ưu tiên chọn các dòng có trong đơn hàng hiện tại để không bao giờ rải đồ thừa ngoài nhiệm vụ
    var orderLines = [];
    if (currentOrders && Array.isArray(currentOrders)) {
        currentOrders.forEach(function (o) {
            if (!o || o.done || !o.id) return;
            var line = itemLine(o.id);
            if (genLines.indexOf(line) !== -1 && orderLines.indexOf(line) === -1) {
                orderLines.push(line);
            }
        });
    }
    var availableLines = orderLines.length > 0 ? orderLines : (genLines.length > 0 ? genLines : ['an', 'ban', 'cafe']);

    // Rải 1 cặp ở Lv.5-10 và tối đa 2 cặp ở Lv.11+ để mồi nước ghép đầu tiên mà vẫn giữ bàn cờ thông thoáng
    var maxPairs = currentLevel <= 10 ? 1 : 2;
    var pairCount = Math.min(maxPairs, Math.floor(empties.length / 6));
    for (var p = 0; p < pairCount; p++) {
        var line = availableLines[p % availableLines.length];
        var itemId = line + '_lv1';
        for (var k = 0; k < 2; k++) {
            var curEmpties = getEmptyIndexes(boardData);
            if (!curEmpties.length) break;
            var pick = curEmpties[Math.floor(Math.random() * curEmpties.length)];
            boardData[pick] = { id: itemId, isRock: false, isLocked: false };
        }
    }
}

function fillBoardInstantly() {
    var generators = [];
    boardData.forEach((c, idx) => {
        if (c && GENERATORS[c.id] && !c.isLocked) generators.push(idx);
    });
    if (!generators.length) return;

    while (getEmptyIndexes(boardData).length > 0 && playerEnergy > 0) {
        var genIdx = generators[Math.floor(Math.random() * generators.length)];
        var genId = boardData[genIdx].id;
        if (spawnItem(boardData, genId, currentOrders, currentLevelCfg) === -1) break;
        playerEnergy--;
        levelClicks++;
        if (typeof wasLastSpawnUnwanted === 'function' && wasLastSpawnUnwanted()) {
            levelUnwantedClicks++;
        }
    }
}

function updateBookBadge() {
    if (!bookBadgeUI) return;
    bookBadgeUI.style.display = 'none';
}

function renderBoard() {
    boardElement.innerHTML = '';

    // Tìm các ô trên bàn cờ đáp ứng tối đa 4 đơn hàng đang hiển thị (chưa hoàn thành)
    var activeOrderMap = {};
    if (currentOrders) {
        var visibleOrders = (typeof getVisibleOrders === 'function')
            ? getVisibleOrders(currentOrders)
            : currentOrders.filter(o => !o.done).slice(0, 4);
        visibleOrders.forEach(o => {
            if (!o.done) activeOrderMap[o.id] = (activeOrderMap[o.id] || 0) + 1;
        });
    }
    var readyCellIndexes = new Set();
    boardData.forEach((c, idx) => {
        if (c && c.id && !c.isLocked && !GENERATORS[c.id] && activeOrderMap[c.id] > 0) {
            readyCellIndexes.add(idx);
            activeOrderMap[c.id]--;
        }
    });

    for (var i = 0; i < TOTAL_CELLS; i++) {
        var cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = i;

        var itemData = boardData[i];
        if (itemData && itemData.isRock) {
            cell.classList.add('bg-rock');
        } else if (itemData && itemData.id && GENERATORS[itemData.id]) {
            // Máy sinh đồ (backpack, cooler, crate): mang nền 3 vạch màu tương ứng nhóm đồ nó sinh
            cell.classList.add('bg-' + itemData.id);
        } else if (itemData && itemData.id) {
            var line = itemLine(itemData.id);
            cell.classList.add(getCellBgClass(line));
        } else {
            // Ô trống: dùng nền board_cell_empty.png đồng nhất
            cell.classList.add('bg-empty');
        }

        if (selectedIndex === i) cell.classList.add('selected');

        // Đánh dấu hiệu ứng nổi bật nếu ô này đạt yêu cầu nhiệm vụ
        if (readyCellIndexes.has(i)) {
            cell.classList.add('order-ready-item');
        }

        cell.addEventListener('click', (e) => {
            if (suppressNextClick) return;
            handleCellClick(e, e.currentTarget);
        });

        if (itemData && itemData.id) {
            var img = document.createElement('img');
            img.src = getItemImagePath(itemData.id);
            img.className = 'item-img';
            img.dataset.id = itemData.id;
            img.dataset.index = i;

            if (itemData.isLocked) {
                cell.classList.add('locked');
                var web = document.createElement('img');
                web.src = 'assets/images/board/board_cell_web.png';
                web.className = 'web-overlay';
                cell.appendChild(web);
            } else {
                img.draggable = false;

                if (readyCellIndexes.has(i)) {
                    var chk = document.createElement('div');
                    chk.className = 'order-ready-badge';
                    chk.textContent = '✓';
                    cell.appendChild(chk);
                }

                if (GENERATORS[itemData.id]) {
                    cell.classList.add('generator-wrapper');
                    for (let s = 0; s < 3; s++) {
                        var star = document.createElement('div');
                        star.className = 'sparkle-star star-' + (s + 1);
                        cell.appendChild(star);
                    }
                    var energyBadge = document.createElement('img');
                    energyBadge.src = 'assets/images/board/icon_nangluong_tao.png';
                    energyBadge.className = 'generator-energy-badge';
                    energyBadge.alt = '⚡';
                    cell.appendChild(energyBadge);
                }
            }
            cell.appendChild(img);
        }
        boardElement.appendChild(cell);
    }

    // Ghi nhận khám phá sổ tay âm thầm qua chấm đỏ #book-badge, không bắn Toast gây chồng popup khi đang ghép đồ
    scanBoardForDiscoveries(boardData);
    updateBookBadge();
    renderOrders();
    updateUIStats();
    tickEnergyRegen();
    syncBoardFooterWidth();
    scheduleHint();
    persistCurrentBoardState();
}

// Hiệu ứng thẻ nhiệm vụ sau khi hoàn thành bay sang chú chó rồi mất đi để người chơi ngắm cảnh
function flyCompletedOrderToPet(cardEl, onComplete) {
    var petEl = document.getElementById('npc-avatar-btn') || document.getElementById('npc-guide-wrap');
    if (!cardEl || !petEl) {
        if (onComplete) onComplete();
        return;
    }

    var cRect = cardEl.getBoundingClientRect();
    var petRect = petEl.getBoundingClientRect();

    if (!cRect.width || !petRect.width) {
        if (onComplete) onComplete();
        return;
    }

    // Tạo bản sao của thẻ nhiệm vụ bay vút từ vị trí hiện tại sang chú chó
    var flyer = cardEl.cloneNode(true);
    flyer.classList.add('order-card-flying-away');

    // Dọn các badge con không cần thiết
    var badges = flyer.querySelectorAll('.order-ready-badge, .floating-badge');
    badges.forEach(function (b) { b.remove(); });

    flyer.style.cssText = 'position:fixed;pointer-events:none;z-index:180010;' +
        'left:' + cRect.left + 'px;top:' + cRect.top + 'px;' +
        'width:' + cRect.width + 'px;height:' + cRect.height + 'px;' +
        'margin:0;box-shadow:0 8px 24px rgba(46, 204, 113, 0.55);' +
        'border-radius:12px;transform-origin:center center;';
    document.body.appendChild(flyer);

    // Ẩn thẻ gốc trong container ngay lập tức
    cardEl.style.visibility = 'hidden';

    var dx = (petRect.left + petRect.width * 0.5) - (cRect.left + cRect.width * 0.5);
    var dy = (petRect.top + petRect.height * 0.5) - (cRect.top + cRect.height * 0.5);

    // Chờ 150ms để người chơi kịp thấy ngôi sao nổ & chữ ✨ HOÀN THÀNH! trước khi bay sang chú chó
    setTimeout(function () {
        var flyAnim = flyer.animate([
            { transform: 'translate(0, 0) scale(1) rotate(0deg)', opacity: 1 },
            { transform: 'translate(' + (dx * 0.45) + 'px, ' + (dy * 0.45 - 26) + 'px) scale(0.92) rotate(-12deg)', opacity: 0.95, offset: 0.45 },
            { transform: 'translate(' + dx + 'px, ' + dy + 'px) scale(0.12) rotate(-26deg)', opacity: 0, offset: 1 }
        ], {
            duration: 480,
            easing: 'cubic-bezier(.22, .85, .36, 1)',
            fill: 'forwards'
        });

        flyAnim.onfinish = function () {
            flyer.remove();

            // Chú chó mừng rỡ đón nhận nhiệm vụ
            petEl.animate([
                { transform: 'scale(1) translateY(0)' },
                { transform: 'scale(1.22, 0.82) translateY(6px)', offset: 0.2 },
                { transform: 'scale(0.88, 1.18) translateY(-14px)', offset: 0.48 },
                { transform: 'scale(1.06, 0.96) translateY(-3px)', offset: 0.75 },
                { transform: 'scale(1) translateY(0)', offset: 1 }
            ], { duration: 460, easing: 'cubic-bezier(.175, .885, .32, 1.275)' });

            triggerParticleBurst(petEl, ['#ff6b81', '#ffd166', '#a8e6cf', '#2ecc71', '#ffffff']);
            showFloatingBadge(petEl, '🐾 Gâu! ❤️', '#2e7d32');

            if (onComplete) onComplete();
        };
    }, 150);
}

// Hàm giao đơn hàng kèm hiệu ứng vật phẩm bay từ bàn cờ lên ô nhiệm vụ và bắn tiền thưởng ra
function deliverReadyOrderWithFlight(orderObj, boardCellIdx, targetCardEl) {
    if (!orderObj || orderObj.done || boardCellIdx === -1 || !boardData[boardCellIdx]) return;
    if (boardData[boardCellIdx].id !== orderObj.id) return;
    orderObj.done = true;
    tutDeliveredOnce = true;

    var cellEl = boardElement && boardElement.children[boardCellIdx];
    var cellImg = cellEl && cellEl.querySelector('.item-img');
    var itemId = boardData[boardCellIdx].id;
    var rw = isReplayLevel ? 0 : orderReward(itemId);

    if (cellEl && targetCardEl && cellImg) {
        var srcRect = cellEl.getBoundingClientRect();
        var tgtRect = targetCardEl.getBoundingClientRect();

        // Tạo bản sao vật phẩm bay vút lên ô đơn hàng
        var flyingItem = document.createElement('img');
        flyingItem.src = cellImg.src;
        flyingItem.style.cssText = 'position:fixed;pointer-events:none;z-index:180005;' +
            'width:' + srcRect.width * 0.8 + 'px;height:' + srcRect.height * 0.8 + 'px;' +
            'left:' + (srcRect.left + srcRect.width * 0.1) + 'px;top:' + (srcRect.top + srcRect.height * 0.1) + 'px;' +
            'filter:drop-shadow(0 0 12px #2ecc71);transition:none;';
        document.body.appendChild(flyingItem);

        // Xóa dữ liệu và ẩn item trên ô bàn cờ ngay lập tức
        boardData[boardCellIdx] = makeEmptyCell();
        cellImg.style.visibility = 'hidden';
        var oldBadge = cellEl.querySelector('.order-ready-badge');
        if (oldBadge) oldBadge.remove();
        cellEl.classList.remove('order-ready-item');

        var dx = (tgtRect.left + tgtRect.width * 0.5) - (srcRect.left + srcRect.width * 0.5);
        var dy = (tgtRect.top + tgtRect.height * 0.5) - (srcRect.top + srcRect.height * 0.5);

        var anim = flyingItem.animate([
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
            { transform: 'translate(' + (dx * 0.4) + 'px, ' + (dy * 0.4 - 24) + 'px) scale(1.25)', opacity: 1, offset: 0.5 },
            { transform: 'translate(' + dx + 'px, ' + dy + 'px) scale(0.65)', opacity: 0.8 }
        ], { duration: 420, easing: 'cubic-bezier(.2,.85,.32,1.15)', fill: 'forwards' });

        anim.onfinish = function () {
            flyingItem.remove();
            playerCoins += rw;
            spawnFlyingCurrency(targetCardEl, 'gold', rw);
            playSound('win');
            updateUIStats();
            selectedIndex = null;
            updateSellButton(null);

            // Nổ hiệu ứng ngôi sao hoàn thành tại thẻ nhiệm vụ
            triggerParticleBurst(targetCardEl, ['#2ecc71', '#a8e6cf', '#ffd54f', '#ffffff']);
            showFloatingBadge(targetCardEl, '✨ HOÀN THÀNH!', '#2e7d32');

            // Bê vật phẩm nhiệm vụ đã hoàn thành vào Khu cắm trại (chỉ lần đầu thắng màn để chống farm)
            if (!isReplayLevel && typeof addCampItem === 'function') {
                addCampItem(itemId, currentLevel);
            }

            if (isAutoEnabled) fillBoardInstantly();
            hideNpcBubble();

            // Thẻ nhiệm vụ hoàn thành bay sang chú chó rồi mất đi, đồng thời lộ diện nhiệm vụ tiếp theo trong hàng đợi
            flyCompletedOrderToPet(targetCardEl, function () {
                renderBoard();
                checkAutoDeliverRevealedOrders();
            });
        };
    } else {
        boardData[boardCellIdx] = makeEmptyCell();
        playerCoins += rw;
        if (targetCardEl) spawnFlyingCurrency(targetCardEl, 'gold', rw);
        playSound('win');
        updateUIStats();
        selectedIndex = null;
        updateSellButton(null);

        // Bê vật phẩm nhiệm vụ đã hoàn thành vào Khu cắm trại (chỉ lần đầu thắng màn để chống farm)
        if (!isReplayLevel && typeof addCampItem === 'function') {
            addCampItem(itemId, currentLevel);
        }

        if (isAutoEnabled) fillBoardInstantly();
        hideNpcBubble();

        if (targetCardEl) {
            flyCompletedOrderToPet(targetCardEl, function () {
                renderBoard();
                checkAutoDeliverRevealedOrders();
            });
        } else {
            renderBoard();
            checkAutoDeliverRevealedOrders();
        }
    }
}

// Khi 1 nhiệm vụ hoàn thành làm lộ nhiệm vụ tiếp theo (vốn đang ẩn sau 4 ô đầu),
// nếu trên bàn cờ đã có sẵn vật phẩm khớp với nhiệm vụ mới lộ ra thì tự động bay lên giao luôn
function checkAutoDeliverRevealedOrders() {
    if (currentLevel <= 1 || levelWon || !currentOrders || !ordersContainer) return;
    var maxVis = (typeof MAX_VISIBLE_ORDERS === 'number') ? MAX_VISIBLE_ORDERS : 4;
    var visCount = 0;
    for (var i = 0; i < currentOrders.length; i++) {
        var o = currentOrders[i];
        if (o.done) continue;
        if (visCount >= maxVis) break;
        visCount++;
        var matchIdx = findOrderMatch(boardData, o.id);
        if (matchIdx !== -1) {
            var cardEl = ordersContainer.querySelector('.order-card[data-order-idx="' + i + '"]');
            if (cardEl) {
                (function (ord, mIdx, cEl) {
                    setTimeout(function () {
                        if (!ord.done && boardData[mIdx] && boardData[mIdx].id === ord.id) {
                            deliverReadyOrderWithFlight(ord, mIdx, cEl);
                        }
                    }, 220);
                })(o, matchIdx, cardEl);
                break;
            }
        }
    }
}

// Tính phần trăm tiến độ màn chơi (0 -> 100%) theo số nhiệm vụ đã hoàn thành & cấp vật phẩm đang chế tạo trên bàn
function computeLevelProgressPct() {
    if (!currentOrders || !currentOrders.length) return 0;
    if (levelWon) return 100;

    var totalOrders = currentOrders.length;
    var doneOrders = 0;
    var totalUnits = 0;
    var doneUnits = 0;
    var activeNeedByLine = {};

    currentOrders.forEach(function (o) {
        var w = itemUnits(o.id);
        totalUnits += w;
        if (o.done) {
            doneOrders++;
            doneUnits += w;
        } else {
            var ln = itemLine(o.id);
            activeNeedByLine[ln] = (activeNeedByLine[ln] || 0) + w;
        }
    });

    if (totalUnits <= 0) return 0;
    if (doneOrders >= totalOrders) return 100;

    // Thu thập tổng đơn vị các vật phẩm cấp >= 2 đang có trên bàn cờ thuộc các nhánh nhiệm vụ chưa hoàn thành
    var boardUnitsByLine = {};
    if (boardData && boardData.length) {
        boardData.forEach(function (c) {
            if (!c || !c.id || c.isRock || c.isLocked || GENERATORS[c.id]) return;
            var lv = itemLv(c.id);
            if (lv >= 2) {
                var ln = itemLine(c.id);
                boardUnitsByLine[ln] = (boardUnitsByLine[ln] || 0) + itemUnits(c.id);
            }
        });
    }

    var craftedRemainingUnits = 0;
    var totalRemainingUnits = Math.max(1, totalUnits - doneUnits);
    Object.keys(activeNeedByLine).forEach(function (ln) {
        var need = activeNeedByLine[ln];
        var have = boardUnitsByLine[ln] || 0;
        // Giới hạn tối đa 85% trọng số của nhánh chưa nộp để chỉ chạm 100% khi nộp xong nhiệm vụ
        craftedRemainingUnits += Math.min(need * 0.85, have);
    });

    // Kết hợp tiến độ số lượng nhiệm vụ đã nộp (50%) + tiến độ cấp vật phẩm chế tạo (50%)
    var orderRatio = doneOrders / totalOrders;
    var unitRatio = (doneUnits + craftedRemainingUnits) / totalUnits;
    var combinedPct = Math.round(((orderRatio * 0.45) + (unitRatio * 0.55)) * 100);
    return Math.max(0, Math.min(100, combinedPct));
}

function updateUIStats() {
    if (energyUI) energyUI.innerText = playerEnergy.toLocaleString('vi-VN');
    if (coinUI) coinUI.innerText = playerCoins.toLocaleString('vi-VN');
    if (gemUI) gemUI.innerText = playerGems.toLocaleString('vi-VN');
    if (currentLvBadgeUI) {
        var numEl = currentLvBadgeUI.querySelector('.lv-map-num');
        if (numEl) numEl.innerText = currentLevel;
        else currentLvBadgeUI.innerText = currentLevel;
        var progPct = computeLevelProgressPct();
        currentLvBadgeUI.style.setProperty('--lv-prog', progPct);
    }
    SAVE.coins = playerCoins;
    SAVE.gems = playerGems;
    SAVE.energy = playerEnergy;
    SAVE.level = currentLevel;
    saveGame();
}

function renderOrders() {
    if (!ordersContainer) return;
    ordersContainer.innerHTML = '';
    var webs = countWebs(boardData);
    if (webCountUI) webCountUI.innerText = `${webs}`;

    // Hiển thị tối đa 4 vật phẩm nhiệm vụ chưa hoàn thành; ẩn các nhiệm vụ còn lại trong hàng đợi.
    // Khi người chơi hoàn thành 1 nhiệm vụ, nhiệm vụ tiếp theo tự động xuất hiện.
    var maxVisible = (typeof MAX_VISIBLE_ORDERS === 'number') ? MAX_VISIBLE_ORDERS : 4;
    var visibleCount = 0;

    currentOrders.forEach((o, idx) => {
        if (o.done) return;
        if (visibleCount >= maxVisible) return;
        visibleCount++;

        var card = document.createElement('div');
        var line = itemLine(o.id);
        var bgClass = getCellBgClass(line);
        card.className = 'order-card ' + bgClass;
        card.dataset.orderIdx = idx;
        card.dataset.orderId = o.id;
        card.title = getItemDisplayName(o.id);
        var img = document.createElement('img');
        img.src = getItemImagePath(o.id);
        card.appendChild(img);

        var parts = o.id.split('_lv');
        if (parts.length === 2) {
            var tag = document.createElement('span');
            tag.className = 'lv-tag';
            tag.innerText = 'Lv.' + parts[1];
            card.appendChild(tag);
        }
        var matchIdx = findOrderMatch(boardData, o.id);
        if (matchIdx !== -1) {
            card.classList.add('ready');
            card.addEventListener('click', () => {
                deliverReadyOrderWithFlight(o, matchIdx, card);
            });
        } else {
            card.addEventListener('click', () => {
                var askNpc = getNextNpcId();
                var targetName = getItemDisplayName(o.id);
                setNpcState(askNpc, '🎯', 'Đơn hàng này cần ' + targetName + '. Hãy ghép các món cùng loại lên đúng cấp độ nhé!', 3200);
            });
        }
        ordersContainer.appendChild(card);
    });

    var allDone = currentOrders.every(o => o.done);
    if (allDone && webs > 0 && !levelWon) {
        setNpcState('de', '🕸️', 'Đơn hàng đã xong hết! Hãy ghép phá nốt ' + webs + ' ô Mạng Nhện trên bàn cờ để hoàn thành màn chơi nhé!', 3000);
    }
    if (allDone && webs === 0 && !levelWon) {
        levelWon = true;
        hideNpcBubble();
        clearHintVisuals();
        setTimeout(finishLevel, 650);
    }
}

// ==========================================
// XỬ LÝ DI CHUYỂN / GHÉP ITEM CHUNG (DÙNG CHO CẢ KÉO THẢ & CHẠM)
// ==========================================
function executeMoveAndEffects(fromIdx, toIdx) {
    var res = doMove(boardData, fromIdx, toIdx);
    if (res.type === 'none') return;

    var clearedWebs = [];
    var bonusIdx = -1;
    var mergeGoldEarned = 0;
    var mergeRubyEarned = 0;

    if (res.type === 'move') {
        playSound('spawn');
    } else if (res.type === 'merge') {
        tutMergeCount++;
        playSound('merge', res.newId);
        clearedWebs = clearAdjacentWebs(boardData, res.index, currentLevelCfg);
        bonusIdx = bonusDrop(boardData, currentLevelCfg, res.newId);

        // Thưởng khi ghép (ECON v3 - xem mergeReward & getComboReward trong js/progress.js):
        // - Ghép ra đồ Lv.4+ thưởng Vàng, Lv.7-8 tặng thêm Kim cương
        // - Màn chơi lại (đã thắng trước đó) không nhận thưởng để tránh farm
        if (!isReplayLevel) {
            var mr = mergeReward(res.newId);
            mergeGoldEarned += mr.coins;
            mergeRubyEarned += mr.gems;
        }

        // Thưởng thêm Vàng khi người chơi tạo được chuỗi Combo ghép liên tiếp (chỉ tính ở màn mới, không farm ở màn chơi lại):
        var comboGold = 0;
        if (!isReplayLevel && mergeComboCount >= 2 && typeof getComboReward === 'function') {
            comboGold = getComboReward(mergeComboCount);
            if (comboGold > 0) {
                mergeGoldEarned += comboGold;
            }
        }

        if (mergeGoldEarned > 0 || mergeRubyEarned > 0) {
            playerCoins += mergeGoldEarned;
            playerGems += mergeRubyEarned;
        }
    }

    if (isAutoEnabled) fillBoardInstantly();
    renderBoard();

    if (res.type === 'merge') {
        var mergedCell = boardElement.children[res.index];
        triggerParticleBurst(mergedCell);

        // Hiển thị hiệu ứng Combo bay bổng khi ghép liên tiếp kèm số Vàng thưởng
        if (mergeComboCount >= 2) {
            triggerComboEffect(mergedCell, mergeComboCount, comboGold);
        }

        // Hiệu ứng Vàng & Kim cương bay từ ô vừa ghép lên thanh HUD
        if (mergeGoldEarned > 0) {
            spawnFlyingCurrency(mergedCell, 'gold', mergeGoldEarned);
        }
        if (mergeRubyEarned > 0) {
            spawnFlyingCurrency(mergedCell, 'ruby', mergeRubyEarned);
        }

        clearedWebs.forEach(wIdx => {
            var wCell = boardElement.children[wIdx];
            triggerParticleBurst(wCell, ['#ffffff', '#cfd8dc', '#80deea']);
            showFloatingBadge(wCell, '🕸️ Rách nhện!', '#00897b');
        });
        if (bonusIdx !== -1) {
            playSound('bonus');
            var bCell = boardElement.children[bonusIdx];
            triggerParticleBurst(bCell, ['#ffd54f', '#ffca28', '#fff59d']);
            showFloatingBadge(bCell, '🎁 +1 Tiếp tế!', '#f57c00');
        }

        // Tự động giao đơn hàng khi ghép ra đúng món nhiệm vụ đang hiển thị (trong tối đa 4 ô nhiệm vụ hiện tại)
        var maxVis = (typeof MAX_VISIBLE_ORDERS === 'number') ? MAX_VISIBLE_ORDERS : 4;
        var visCount = 0;
        var matchingOrderIdx = -1;
        for (var oi = 0; oi < currentOrders.length; oi++) {
            if (currentOrders[oi].done) continue;
            if (visCount < maxVis && currentOrders[oi].id === res.newId) {
                matchingOrderIdx = oi;
                break;
            }
            visCount++;
            if (visCount >= maxVis) break;
        }
        if (matchingOrderIdx !== -1) {
            var matchingOrder = currentOrders[matchingOrderIdx];
            var targetOrderCard = ordersContainer && (
                ordersContainer.querySelector('.order-card[data-order-idx="' + matchingOrderIdx + '"]') ||
                ordersContainer.querySelector('.order-card[data-order-id="' + matchingOrder.id + '"]')
            );
            var finalIndex = res.index;
            // Delay 260ms để người chơi nhìn thấy rõ món mới được ghép thành công trên bàn cờ trước khi bay vút lên
            setTimeout(function () {
                deliverReadyOrderWithFlight(matchingOrder, finalIndex, targetOrderCard);
            }, 260);
        }
    }
}

// ==========================================
// KÉO THẢ (POINTER EVENTS) - CHẠY CHO CẢ CHUỘT VÀ CẢM ỨNG
// ==========================================
var DRAG_THRESHOLD = 8;
var dragState = null;
var suppressNextClick = false;

function cellFromPoint(x, y) {
    var el = document.elementFromPoint(x, y);
    return el ? el.closest('.cell') : null;
}

function clearDragVisuals() {
    boardElement.querySelectorAll('.drag-over').forEach(c => c.classList.remove('drag-over'));
    boardElement.querySelectorAll('.dragging-source').forEach(c => c.classList.remove('dragging-source'));
}

function onPointerDown(e) {
    if (dragState) endDrag();
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    var cell = e.target.closest('.cell');
    if (!cell) return;
    var idx = parseInt(cell.dataset.index);
    var item = boardData[idx];
    if (!item || !item.id || item.isLocked) return;

    clearHintVisuals();
    hideNpcBubble();
    dragState = { from: idx, pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, active: false, ghost: null };
    document.addEventListener('pointermove', onPointerMove, { passive: false });
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerCancel);
}

function startDragging() {
    var item = boardData[dragState.from];
    var srcCell = boardElement.children[dragState.from];
    var size = srcCell.getBoundingClientRect().width;

    var ghost = document.createElement('img');
    ghost.src = getItemImagePath(item.id);
    ghost.style.cssText = 'position:fixed;left:0;top:0;z-index:100000;pointer-events:none;' +
        'width:' + size + 'px;height:' + size + 'px;object-fit:contain;' +
        'filter:drop-shadow(0 6px 6px rgba(0,0,0,.45));transform-origin:center;';
    document.body.appendChild(ghost);

    dragState.ghost = ghost;
    dragState.size = size;
    dragState.active = true;
    srcCell.classList.add('dragging-source');
    selectedIndex = null;
    updateSellButton(null);
}

function moveGhost(x, y) {
    dragState.ghost.style.transform =
        'translate(' + (x - dragState.size / 2) + 'px,' + (y - dragState.size / 2) + 'px) scale(1.15)';
}

function onPointerMove(e) {
    if (!dragState || e.pointerId !== dragState.pointerId) return;
    if (!dragState.active) {
        if (Math.hypot(e.clientX - dragState.startX, e.clientY - dragState.startY) < DRAG_THRESHOLD) return;
        startDragging();
    }
    e.preventDefault();
    moveGhost(e.clientX, e.clientY);

    boardElement.querySelectorAll('.drag-over').forEach(c => c.classList.remove('drag-over'));
    var target = cellFromPoint(e.clientX, e.clientY);
    if (target && boardElement.contains(target) && parseInt(target.dataset.index) !== dragState.from) {
        target.classList.add('drag-over');
    }
}

function endDrag() {
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
    document.removeEventListener('pointercancel', onPointerCancel);
    if (dragState && dragState.ghost) dragState.ghost.remove();
    clearDragVisuals();
    dragState = null;
}

function onPointerUp(e) {
    if (!dragState || e.pointerId !== dragState.pointerId) return;
    var wasActive = dragState.active;
    var from = dragState.from;
    var target = wasActive ? cellFromPoint(e.clientX, e.clientY) : null;
    endDrag();

    if (wasActive) {
        suppressNextClick = true;
        setTimeout(() => { suppressNextClick = false; }, 0);
        if (target && boardElement.contains(target)) {
            executeMoveAndEffects(from, parseInt(target.dataset.index));
        } else {
            scheduleHint();
        }
    } else {
        scheduleHint();
    }
}

function onPointerCancel() {
    endDrag();
    scheduleHint();
}

boardElement.addEventListener('pointerdown', onPointerDown);
boardElement.addEventListener('dragstart', e => e.preventDefault());
boardElement.addEventListener('contextmenu', e => { if (dragState) e.preventDefault(); });

// ==========================================
// SINH ITEM & CHẠM CHỌN (TAP-TO-MOVE)
// ==========================================
// Biến theo dõi số lần bấm liên tiếp máy sinh đồ (Bấm 6 lần liên tục mới kích hoạt xả đầy toàn bộ ô trống)
var lastGenClickTs = 0;
var lastGenCellIdx = -1;
var genClickStreak = 0;

function handleGeneratorClick(gen, cellElement) {
    var now = Date.now();
    var idx = parseInt(cellElement.dataset.index);
    var windowMs = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.gameplay && GAME_CONFIG.gameplay.generatorClickWindowMs)
        ? GAME_CONFIG.gameplay.generatorClickWindowMs : 550;
    var bulkClicksNeeded = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.gameplay && GAME_CONFIG.gameplay.generatorBulkClicks)
        ? GAME_CONFIG.gameplay.generatorBulkClicks : 6;

    var isConsecutive = (now - lastGenClickTs < windowMs && lastGenCellIdx === idx);
    lastGenClickTs = now;
    lastGenCellIdx = idx;

    if (isConsecutive) {
        genClickStreak++;
    } else {
        genClickStreak = 1;
    }

    if (genClickStreak >= bulkClicksNeeded) {
        genClickStreak = 0;
        lastGenClickTs = 0;
        lastGenCellIdx = -1;
        bulkSpawnFromGenerator(gen, cellElement);
    } else {
        spawnFromGenerator(gen, cellElement);
    }
}

// Bấm 1 lần: Sinh 1 item từ nguồn phát vào 1 ô trống ngẫu nhiên (tiêu tốn 1 ⚡)
function spawnFromGenerator(gen, cellElement) {
    if (playerEnergy <= 0) {
        openEnergyShop();
        return;
    }
    var target = spawnItem(boardData, gen.id, currentOrders, currentLevelCfg);
    if (target === -1) {
        renderBoard();
        var best = findBestMerge(boardData, currentOrders, currentLevelCfg);
        if (best) {
            var cFrom = boardElement.children[best.from];
            var cTo = boardElement.children[best.to];
            if (cFrom) cFrom.classList.add('hint-pulse');
            if (cTo) cTo.classList.add('hint-pulse');
            setNpcState('de', '💡', 'Bàn cờ đã đầy! Hãy ghép cặp đang sáng nhấp nháy trước nhé!', 3000);
        } else {
            setNpcState('de', '🗑️', 'Bàn cờ đầy & hết nước ghép! Hãy chọn 1 món rồi bấm nút BÁN ở dưới nhé!', 3500);
        }
        return;
    }
    if (playerEnergy >= getMaxEnergy()) {
        SAVE.lastEnergyTs = Date.now();
    }
    playerEnergy--;
    levelClicks++;
    if (typeof wasLastSpawnUnwanted === 'function' && wasLastSpawnUnwanted()) {
        levelUnwantedClicks++;
    }

    var spreadIdx = -1;
    if (currentLevelCfg && currentLevelCfg.spreadEvery && levelClicks % currentLevelCfg.spreadEvery === 0) {
        spreadIdx = spreadWeb(boardData);
    }

    playSound('spawn');
    renderBoard();

    var el = boardElement.children[target];
    var img = el && el.querySelector('.item-img');
    if (img) img.animate([{ transform: 'scale(0)' }, { transform: 'scale(1.2)' }, { transform: 'scale(1)' }], { duration: 250, easing: 'ease-out' });

    if (spreadIdx !== -1 && boardElement.children[spreadIdx]) {
        showFloatingBadge(boardElement.children[spreadIdx], '🕸️ Nhện lan!', '#6a1b9a');
    }
}

// Bấm 6 lần liên tục: Xả đồ ra toàn bộ các ô trống trên bàn cờ (tiêu tốn tương ứng với số ô trống và năng lượng hiện có)
function bulkSpawnFromGenerator(gen, cellElement) {
    if (playerEnergy <= 0) {
        openEnergyShop();
        return;
    }
    var empties = getEmptyIndexes(boardData);
    if (!empties.length) {
        renderBoard();
        showToast('⚠️ Bàn cờ đã đầy! Hãy ghép các món trên bàn trước nhé.', '#f57c00');
        return;
    }

    var spawnCount = Math.min(empties.length, playerEnergy);
    if (spawnCount <= 0) {
        openEnergyShop();
        return;
    }

    var spawnedTargets = [];
    if (playerEnergy >= getMaxEnergy()) {
        SAVE.lastEnergyTs = Date.now();
    }
    for (var i = 0; i < spawnCount; i++) {
        var tIdx = spawnItem(boardData, gen.id, currentOrders, currentLevelCfg);
        if (tIdx === -1) break;
        playerEnergy--;
        levelClicks++;
        if (typeof wasLastSpawnUnwanted === 'function' && wasLastSpawnUnwanted()) {
            levelUnwantedClicks++;
        }
        spawnedTargets.push(tIdx);

        if (currentLevelCfg && currentLevelCfg.spreadEvery && levelClicks % currentLevelCfg.spreadEvery === 0) {
            spreadWeb(boardData);
        }
    }

    playSound('spawn');
    updateUIStats();
    renderBoard();

    // Hiệu ứng pháo hoa & badge thông báo xả đồ cực đã mắt
    if (cellElement) {
        triggerParticleBurst(cellElement, ['#ffd54f', '#ffb300', '#ffffff', '#4fc3f7']);
        showFloatingBadge(cellElement, '🚀 XẢ ĐẦY Ô TRỐNG (-' + spawnedTargets.length + ' ⚡)', '#e65100');
    }

    // Hiệu ứng nảy liên hoàn lượn sóng cho các ô vừa nhận đồ
    spawnedTargets.forEach(function (idx, seq) {
        var cEl = boardElement.children[idx];
        if (cEl) {
            var img = cEl.querySelector('.item-img');
            if (img) {
                img.style.transform = 'scale(0.3)';
                setTimeout(function () {
                    img.animate([
                        { transform: 'scale(0.3)' },
                        { transform: 'scale(1.2)' },
                        { transform: 'scale(1)' }
                    ], { duration: 240, easing: 'cubic-bezier(.2,.85,.32,1.2)' });
                    img.style.transform = 'scale(1)';
                }, Math.min(seq * 20, 240));
            }
        }
    });

    if (playerEnergy <= 0) {
        setTimeout(openEnergyShop, 450);
    }
}

function handleCellClick(e, cellElement) {
    var index = parseInt(cellElement.dataset.index);
    var clickedItem = boardData[index];

    if (clickedItem && clickedItem.id && !clickedItem.isLocked && GENERATORS[clickedItem.id] && !isAutoEnabled) {
        selectedIndex = null;
        updateSellButton(null);
        handleGeneratorClick(clickedItem, cellElement);
        return;
    }

    if (selectedIndex === null) {
        if (clickedItem && clickedItem.id && !clickedItem.isLocked) {
            selectedIndex = index;
            updateSellButton(clickedItem.id);
            renderBoard();
        }
    } else {
        if (selectedIndex === index) {
            selectedIndex = null;
            updateSellButton(null);
            renderBoard();
            return;
        }

        var fromIdx = selectedIndex;
        var toIdx = index;
        var toItem = boardData[toIdx];

        selectedIndex = null;
        updateSellButton(null);

        if (toItem && toItem.isRock) {
            renderBoard();
            return;
        }

        executeMoveAndEffects(fromIdx, toIdx);
    }
}

// ==========================================
// TRẠM TIẾP NĂNG LƯỢNG, SỔ TAY, BẢN ĐỒ & CÀI ĐẶT
// ==========================================
function openEnergyShop() {
    showEnergyShopModal({
        energy: playerEnergy,
        maxEnergy: getMaxEnergy(),
        coins: playerCoins,
        gems: playerGems,
        secLeft: regenSecLeft,
        isIdle: !isUserInteracting(),
        adsLeft: getAdsLeft('energy'),
        onBuyCoins: function (pack) {
            var cost = (pack && pack.coinCost) ? pack.coinCost : (pack && pack.price ? pack.price : ENERGY_PACK_PRICE);
            var energyAmt = (pack && pack.energy) ? pack.energy : (pack && pack.amount ? pack.amount : ENERGY_PACK);
            if (playerCoins < cost) {
                showToast('❌ Không đủ Vàng!', '#c62828');
                return;
            }
            playerCoins -= cost;
            playerEnergy += energyAmt;
            playSound('bonus');
            updateUIStats();
            saveGame();
            showToast('⚡ Đã đổi +' + energyAmt + ' năng lượng!', '#2e7d32');
        },
        onBuyGems: function () {
            playerGems -= GEM_ENERGY_PRICE;
            playerEnergy += GEM_ENERGY_PACK;
            playSound('bonus');
            updateUIStats();
            showToast('💎 Nạp siêu tốc +' + GEM_ENERGY_PACK + ' ⚡ (Bỏ qua thời gian chờ)!', '#1565c0');
        },
        onWatchAd: function () {
            if (getAdsLeft('energy') <= 0) {
                showToast('🎬 Đã hết lượt xem quảng cáo hôm nay, hãy quay lại vào ngày mai nhé!', '#c62828');
                return;
            }
            var amt = AD_REWARDS.energy.amount;
            simulateWatchAd('Tiếp Tế Năng Lượng (+' + amt + ' ⚡)', function () {
                consumeAd('energy');
                playerEnergy += amt;
                playSound('bonus');
                updateUIStats();
                showToast('🎬 Đã nhận +' + amt + ' ⚡ miễn phí từ video tài trợ!', '#2e7d32');
            });
        },
        onRescue: function () {
            var rescueAmt = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.energyShop && GAME_CONFIG.energyShop.rescue)
                ? GAME_CONFIG.energyShop.rescue.amount
                : 20;
            playerEnergy += rescueAmt;
            playSound('bonus');
            updateUIStats();
            showToast('🏕️ Nhận Cứu Trợ Kiểm Lâm +' + rescueAmt + ' ⚡ miễn phí!', '#2e7d32');
        },
        onOpenGemShop: openGemShop
    });
}

function openGemShop() {
    showGemShopModal({
        gems: playerGems,
        coins: playerCoins,
        energy: playerEnergy,
        adsLeft: getAdsLeft('gem'),
        onBuyIAP: function (pack, isStarter) {
            simulateBuyIAP(pack, function () {
                var totalGems = pack.gems + (pack.bonusGems || 0);
                playerGems += totalGems;
                if (pack.coins) playerCoins += pack.coins;
                if (pack.energy) playerEnergy += pack.energy;
                if (isStarter || pack.id === 'starter_pack_camping') {
                    SAVE.starterPackBought = true;
                }
                updateUIStats();
                saveGame();
                playSound('win');
                var targetEl = document.getElementById('btn-gem-shop') || document.body;
                spawnFlyingCurrency(targetEl, 'ruby', Math.min(totalGems, 50));
                if (pack.coins) {
                    spawnFlyingCurrency(document.getElementById('btn-coin-shop') || document.body, 'gold', Math.min(pack.coins, 100));
                }
                showToast('🎉 Nạp thành công: +' + totalGems.toLocaleString('vi-VN') + ' Kim cương!', '#1565c0');
            });
        },
        onWatchAd: function () {
            if (getAdsLeft('gem') <= 0) {
                showToast('🎬 Đã hết lượt nhận Kim cương miễn phí hôm nay!', '#c62828');
                return;
            }
            var amt = AD_REWARDS.gem.amount;
            simulateWatchAd('Tài Trợ Kim Cương (+' + amt + ' 💎)', function () {
                consumeAd('gem');
                playerGems += amt;
                updateUIStats();
                saveGame();
                playSound('win');
                var targetEl = document.getElementById('btn-gem-shop') || document.body;
                spawnFlyingCurrency(targetEl, 'ruby', amt);
                showToast('🎬 Bạn đã nhận +' + amt + ' 💎 miễn phí từ nhà tài trợ!', '#1565c0');
            });
        }
    });
}

function openCoinShop() {
    showCoinShopModal({
        gems: playerGems,
        coins: playerCoins,
        onExchange: function (pack) {
            if (playerGems < pack.gemCost) {
                showToast('❌ Không đủ Kim cương! Hãy nạp thêm nhé.', '#c62828');
                return;
            }
            playerGems -= pack.gemCost;
            playerCoins += pack.coins;
            updateUIStats();
            saveGame();
            playSound('win');
            var targetEl = document.getElementById('btn-coin-shop') || document.body;
            spawnFlyingCurrency(targetEl, 'gold', Math.min(pack.coins, 100));
            showToast('🪙 Đã đổi +' + pack.coins.toLocaleString('vi-VN') + ' Vàng thành công!', '#2e7d32');
        },
        onWatchAd: function () {
            if (getAdsLeft('coin') <= 0) {
                showToast('🎬 Đã hết lượt nhận Vàng miễn phí hôm nay!', '#c62828');
                return;
            }
            var amt = AD_REWARDS.coin.amount;
            simulateWatchAd('Tài Trợ Ngân Hàng Vàng (+' + amt + ' 🪙)', function () {
                consumeAd('coin');
                playerCoins += amt;
                updateUIStats();
                saveGame();
                playSound('win');
                var targetEl = document.getElementById('btn-coin-shop') || document.body;
                spawnFlyingCurrency(targetEl, 'gold', amt);
                showToast('🎬 Bạn đã nhận +' + amt + ' 🪙 miễn phí từ video tài trợ!', '#2e7d32');
            });
        },
        onOpenGemShop: openGemShop
    });
}

function openLuckyDrop() {
    showLuckyDropModal(function (roll) {
        if (roll.type === 'energy') {
            playerEnergy += roll.val;
        } else if (roll.type === 'coin') {
            playerCoins += roll.val;
            var coinEl = document.getElementById('btn-coin-shop') || document.body;
            spawnFlyingCurrency(coinEl, 'gold', Math.min(roll.val, 100));
        } else if (roll.type === 'gem') {
            playerGems += roll.val;
            var gemEl = document.getElementById('btn-gem-shop') || document.body;
            spawnFlyingCurrency(gemEl, 'ruby', roll.val);
        }
        updateUIStats();
        saveGame();
        playSound('win');
        showToast('🎁 Mở hộp thành công: ' + roll.text + '!', roll.color || '#2e7d32');
    });
}

function updateSellButton(itemId) {
    if (!btnSell) return;
    if (!itemId || GENERATORS[itemId]) {
        btnSell.classList.add('disabled');
        if (sellPriceUI) sellPriceUI.innerText = '0';
        if (sellBtnTextUI) sellBtnTextUI.innerText = 'BÁN';
    } else {
        var p = sellPrice(itemId);
        if (sellPriceUI) sellPriceUI.innerText = p;
        if (sellBtnTextUI) sellBtnTextUI.innerText = p > 0 ? 'BÁN (+' + p + ')' : 'BÁN';
        btnSell.classList.remove('disabled');
    }
}

function refreshLevelSelect() {
    if (!levelSelect) return;
    var unlockAll = SAVE.settings && SAVE.settings.unlockAllLevels;
    var maxKnownLv = Math.max(RAW_LEVELS.length, SAVE.maxLevel || 1);
    for (var lv = RAW_LEVELS.length + 1; lv <= maxKnownLv; lv++) {
        getLevelConfig(lv);
    }
    levelSelect.innerHTML = '';
    RAW_LEVELS.forEach(r => {
        var opt = document.createElement('option');
        opt.value = r[0];
        var st = SAVE.stars[r[0]] || 0;
        var mark = st ? ' ' + '★'.repeat(st) : ((!unlockAll && r[0] > SAVE.maxLevel) ? ' 🔒' : '');
        opt.textContent = `Lv.${r[0]}${mark}`;
        levelSelect.appendChild(opt);
    });
    levelSelect.value = currentLevel;
}

function finishLevel() {
    // Giải pháp 2: Sao tính theo năng lượng thực tế hữu ích (khấu trừ các lượt nguồn phát rơi lệch RNG ngoài tầm kiểm soát)
    var effectiveSpent = Math.max(1, levelClicks - (levelUnwantedClicks || 0));
    var stars = calcStars(Math.max(0, levelBudget - effectiveSpent), levelBudget);
    var oldStars = SAVE.stars[currentLevel] || 0;
    var firstTime = oldStars === 0;
    var reward = levelClearReward(currentLevel, stars, firstTime);
    var coins = reward.coins;
    var gems = reward.gems;

    // Nếu chơi lại màn cũ và cải thiện số sao (ví dụ từ 2⭐ lên 3⭐): thưởng phần chênh lệch sao
    if (!firstTime && stars > oldStars) {
        var lcCfg = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.gameplay && GAME_CONFIG.gameplay.levelClear)
            ? GAME_CONFIG.gameplay.levelClear
            : { perStarCoins: 50, gems3Stars: 2, gems1Or2Stars: 1 };
        coins += (stars - oldStars) * (lcCfg.perStarCoins || 50);
        if (stars === 3 && oldStars < 3) {
            gems += Math.max(0, (lcCfg.gems3Stars || 2) - (lcCfg.gems1Or2Stars || 1));
        }
    }

    // Tự động thu dọn vật phẩm thừa trên bàn chơi (chỉ quy đổi thành Vàng ở lần thắng đầu tiên để chống farm)
    var sweepCoins = 0;
    var sweepCount = 0;
    if (boardData && boardData.length) {
        boardData.forEach(function (c, idx) {
            if (c && c.id && !c.isLocked && !c.isRock && !GENERATORS[c.id]) {
                var p = firstTime ? sellPrice(c.id) : 0;
                if (p > 0) {
                    sweepCoins += p;
                    sweepCount++;
                }
                boardData[idx] = null;
            }
        });
        if (sweepCount > 0) {
            renderBoard();
        }
    }

    var totalCoins = coins + sweepCoins;
    playerCoins += totalCoins;
    playerGems += gems;
    if (boardElement && totalCoins > 0) {
        spawnFlyingCurrency(boardElement, 'gold', totalCoins);
    }
    SAVE.stars[currentLevel] = Math.max(SAVE.stars[currentLevel] || 0, stars);
    if (currentLevel + 1 > SAVE.maxLevel) {
        SAVE.maxLevel = currentLevel + 1;
        getLevelConfig(SAVE.maxLevel);
    }
    SAVE.currentBoardState = null; // Màn chơi đã hoàn thành, dọn trạng thái dở dang
    saveGame();
    updateUIStats();
    refreshLevelSelect();
    playSound('win');

    var hasNext = true;
    var completedList = (currentOrders && currentOrders.length)
        ? currentOrders.map(function (o) { return o.id; })
        : (currentLevelCfg && currentLevelCfg.orders ? currentLevelCfg.orders : []);
    showWinModal({
        level: currentLevel,
        stars: stars,
        coins: coins,
        sweepCoins: sweepCoins,
        sweepCount: sweepCount,
        gems: gems,
        firstTime: firstTime,
        completedOrders: completedList,
        decor: getCampDecor(currentLevel),
        hasNext: hasNext
    }, () => loadLevel(currentLevel, { forceReset: true }), () => loadLevel(currentLevel + 1));
}

function toggleAutoDebug() {
    isAutoEnabled = !isAutoEnabled;
    if (isAutoEnabled) {
        fillBoardInstantly();
        renderBoard();
    }
}

// ==========================================
// TÍNH NĂNG DỌN DẸP BÀN CỜ (CÂY CHỔI DỌN DẸP)
// Sắp xếp các item cùng họ (cùng màu nền) lại gần nhau
// Tiêu tốn: 3 Năng lượng
// ==========================================
var TIDY_ENERGY_COST = 3;
var LINE_ORDER = ['an', 'cafe', 'congcu', 'ban', 'ghe', 'trai', 'tham', 'antoan', 'bep'];

function handleTidyBoard() {
    // 1. Kiểm tra năng lượng của người chơi
    if (playerEnergy < TIDY_ENERGY_COST) {
        showToast('⚡ Không đủ năng lượng! (Cần ' + TIDY_ENERGY_COST + ' Năng lượng để dọn dẹp)', '#e74c3c');
        var broomBtn = document.getElementById('btn-tidy-board');
        if (broomBtn) {
            broomBtn.classList.remove('broom-shake-warn');
            void broomBtn.offsetWidth;
            broomBtn.classList.add('broom-shake-warn');
        }
        return;
    }

    // 2. Thu thập các vật phẩm có thể di chuyển trên bàn cờ
    // (Bỏ qua: Đá chướng ngại vật, Ô bị khóa/mạng nhện, Ô máy sinh đồ/thùng chứa)
    var movableItems = [];
    var availableSlotIndexes = [];

    boardData.forEach(function (cell, idx) {
        if (!cell) return;
        if (cell.isRock) return; // Đá cố định
        if (cell.isLocked) return; // Mạng nhện cố định
        if (cell.id && GENERATORS[cell.id]) return; // Thùng chứa đồ cố định

        // Ô này là ô trống hoặc ô chứa vật phẩm tự do
        availableSlotIndexes.push(idx);
        if (cell.id) {
            movableItems.push({
                id: cell.id,
                isRock: false,
                isLocked: false
            });
        }
    });

    if (movableItems.length <= 1) {
        showToast('Bàn cờ chưa có nhiều vật phẩm cần dọn dẹp!', '#3498db');
        return;
    }

    // 3. Trừ 3 năng lượng & lưu dữ liệu
    playerEnergy -= TIDY_ENERGY_COST;
    updateUIStats();
    saveGame();

    // 4. Hiệu ứng âm thanh & hoạt ảnh cho cây chổi
    playSound('sweep');
    var broomEl = document.getElementById('btn-tidy-board');
    if (broomEl) {
        broomEl.classList.remove('broom-sweeping');
        void broomEl.offsetWidth;
        broomEl.classList.add('broom-sweeping');

        // Hiển thị huy hiệu bay "-3 ⚡" từ vị trí cây chổi
        showFloatingBadge(broomEl, '-' + TIDY_ENERGY_COST + ' ⚡', '#f39c12');
    }

    // 5. Sắp xếp các vật phẩm:
    // - Gom nhóm theo họ / màu nền (LINE_ORDER)
    // - Trong cùng họ: sắp xếp theo cấp độ (level) tăng dần để các item giống nhau nằm sát nhau
    movableItems.sort(function (a, b) {
        var lineA = itemLine(a.id);
        var lineB = itemLine(b.id);
        var orderA = LINE_ORDER.indexOf(lineA);
        var orderB = LINE_ORDER.indexOf(lineB);
        if (orderA === -1) orderA = 999;
        if (orderB === -1) orderB = 999;
        if (orderA !== orderB) return orderA - orderB;

        var lvA = itemLv(a.id);
        var lvB = itemLv(b.id);
        return lvA - lvB;
    });

    // 6. Xếp lại các vật phẩm vào các ô hợp lệ theo thứ tự gọn gàng
    availableSlotIndexes.forEach(function (slotIdx, k) {
        if (k < movableItems.length) {
            boardData[slotIdx] = movableItems[k];
        } else {
            boardData[slotIdx] = makeEmptyCell();
        }
    });

    // Bỏ chọn ô hiện tại nếu có
    selectedIndex = null;
    updateSellButton(null);

    // 7. Render lại bàn cờ & kích hoạt hiệu ứng xuất hiện mượt mà cho các item vừa dọn dẹp
    renderBoard();

    // Hiệu ứng hoạt ảnh gọn gàng cho các ô vừa được xếp
    availableSlotIndexes.forEach(function (slotIdx, k) {
        if (k < movableItems.length && boardElement.children[slotIdx]) {
            var itemImg = boardElement.children[slotIdx].querySelector('.item-img');
            if (itemImg) {
                itemImg.classList.add('item-tidy-settle');
            }
        }
    });

    showToast('✨ Đã dọn dẹp bàn cờ gọn gàng!', '#27ae60');
}

// Đồng bộ chiều rộng và vị trí khung bàn chơi lên biến CSS ở cả 2 khoảng (<=600px và >600px)
function syncBoardFooterWidth() {
    var frameEl = document.querySelector('.board-frame-wrapper');
    if (!frameEl) return;
    var rect = frameEl.getBoundingClientRect();
    if (rect.width > 0) {
        document.documentElement.style.setProperty('--board-actual-w', Math.round(rect.width) + 'px');
        document.documentElement.style.setProperty('--board-actual-left', Math.round(rect.left) + 'px');
        document.documentElement.style.setProperty('--board-actual-top', Math.round(rect.top) + 'px');
        document.documentElement.style.setProperty('--board-actual-h', Math.round(rect.height) + 'px');
    }
}

function initGame() {
    updateCompanionAvatar();
    refreshLevelSelect();
    syncBoardFooterWidth();
    var frameWrapEl = document.querySelector('.board-frame-wrapper');
    if (frameWrapEl && typeof ResizeObserver !== 'undefined') {
        var ro = new ResizeObserver(function () {
            syncBoardFooterWidth();
        });
        ro.observe(frameWrapEl);
    }
    window.addEventListener('resize', function () {
        syncBoardFooterWidth();
        if (document.getElementById('tutorial-hand')) {
            scheduleHint();
        }
    });
    if (btnRefillEnergy) btnRefillEnergy.onclick = openEnergyShop;
    var btnGemShop = document.getElementById('btn-gem-shop');
    if (btnGemShop) btnGemShop.onclick = openGemShop;
    var btnCoinShop = document.getElementById('btn-coin-shop');
    if (btnCoinShop) btnCoinShop.onclick = openCoinShop;
    var btnLuckyDrop = document.getElementById('btn-lucky-drop');
    if (btnLuckyDrop) btnLuckyDrop.onclick = openLuckyDrop;

    var btnTidy = document.getElementById('btn-tidy-board');
    if (btnTidy) {
        btnTidy.onclick = handleTidyBoard;
    }

    var btnCamp = document.getElementById('btn-camp');
    if (btnCamp) btnCamp.onclick = () => openCamp(null, null);

    var btnBook = document.getElementById('btn-book');
    if (btnBook) {
        btnBook.onclick = () => openDiscoveryBook();
    }

    var btnMap = document.getElementById('btn-world-map');
    if (btnMap) {
        btnMap.onclick = () => openWorldMap(currentLevel, function (lv) {
            loadLevel(lv);
        });
    }

    var btnSettings = document.getElementById('btn-settings');
    if (btnSettings) {
        btnSettings.onclick = () => openSettingsModal({
            currentLevel: currentLevel,
            onSelectLevel: function (lv) { loadLevel(lv); },
            isAuto: isAutoEnabled,
            onToggleAuto: toggleAutoDebug,
            onUnlockChanged: refreshLevelSelect,
            onRestartLevel: () => loadLevel(currentLevel, { forceReset: true }),
            onCloudRestore: () => {
                playerCoins = SAVE.coins;
                playerGems = SAVE.gems;
                playerEnergy = SAVE.energy;
                refreshLevelSelect();
                updateCompanionAvatar();
                updateUIStats();
                loadLevel(SAVE.level || 1, { restoreState: true });
            },
            onResetAll: () => {
                resetSave();
                playerCoins = SAVE.coins;
                playerGems = SAVE.gems;
                playerEnergy = SAVE.energy;
                refreshLevelSelect();
                loadLevel(1, { forceReset: true });
                showToast('🔄 Đã đặt lại toàn bộ dữ liệu về ban đầu!', '#2e7d32');
            }
        });
    }

    if (btnSell) btnSell.onclick = () => {
        if (btnSell.classList.contains('disabled') || selectedIndex === null) return;
        var soldCell = boardElement.children[selectedIndex];
        var soldId = boardData[selectedIndex].id;
        var price = sellPrice(soldId);
        playerCoins += price;
        spawnFlyingCurrency(soldCell, 'gold', price);
        playSound('bonus');
        boardData[selectedIndex] = makeEmptyCell();
        selectedIndex = null;
        updateSellButton(null);

        if (isAutoEnabled) fillBoardInstantly();
        renderBoard();
    };

    if (npcAvatarBtn) {
        npcAvatarBtn.onclick = () => {
            showIdleHint(true);
        };
    }
    if (npcSpeechBubble) {
        npcSpeechBubble.onclick = () => {
            hideNpcBubble();
            clearTutorialHand();
        };
    }

    var startLv = Math.max(SAVE.level || 1, 1);
    getLevelConfig(startLv);
    loadLevel(startLv, { restoreState: true });

    // Bắt tương tác đầu tiên của người chơi để kích hoạt BGM nhẹ nhàng (tuân thủ autoplay policy)
    function onFirstUserGesture() {
        initAudio();
        updateBgmPlayback();
        document.removeEventListener('pointerdown', onFirstUserGesture);
        document.removeEventListener('keydown', onFirstUserGesture);
    }
    document.addEventListener('pointerdown', onFirstUserGesture);
    document.addEventListener('keydown', onFirstUserGesture);

    // Tự động lưu nguyên trạng bàn cờ đang chơi khi thoát hoặc đổi tab
    window.addEventListener('beforeunload', persistCurrentBoardState);
    window.addEventListener('pagehide', persistCurrentBoardState);

    window.loadLevel = loadLevel;
    window.persistCurrentBoardState = persistCurrentBoardState;
    window.executeMoveAndEffects = executeMoveAndEffects;

    if (typeof enhanceAll3sButtons === 'function') {
        enhanceAll3sButtons(document.body);
    }
}

initGame();