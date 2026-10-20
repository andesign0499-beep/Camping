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
var isAutoEnabled = false; // AUTO chỉ là chế độ debug, mặc định tắt
var levelWon = false;
var levelBudget = 0;
var regenSecLeft = ENERGY_REGEN_SEC;

var playerEnergy = 50;
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
            if (nowMs - lastMergeAudioTs < 3200) {
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

// Hiệu ứng Combo x2, x3, x4... thị giác nổi bật, tự động đổi màu rực rỡ theo cấp combo
function triggerComboEffect(cellElement, comboCount) {
    if (!cellElement) return;
    var rect = cellElement.getBoundingClientRect();
    var comboTag = document.createElement('div');
    comboTag.className = 'combo-popup-badge';
    comboTag.textContent = '🔥 COMBO x' + comboCount + '!';

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
// HỒI NĂNG LƯỢNG THEO THỜI GIAN (IDLE REGEN)
// ==========================================
function tickEnergyRegen() {
    var res = calcIdleEnergyRegen(playerEnergy, levelBudget);
    regenSecLeft = res.secLeft;
    if (res.added > 0) {
        playerEnergy += res.added;
        if (energyUI) energyUI.innerText = playerEnergy;
    }
    if (energyTimerUI) {
        if (playerEnergy < levelBudget) {
            energyTimerUI.innerText = '+' + regenSecLeft + 's';
            energyTimerUI.style.display = 'inline-block';
        } else {
            energyTimerUI.style.display = 'none';
        }
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
            var msg = levelClicks === 0
                ? 'Chào mừng tới Bữa Sáng Khởi Đầu! Chạm vào Thùng Đá trên bàn cờ để lấy nguyên liệu nhé!'
                : 'Chạm thêm 1 lần vào Thùng Đá để có đủ cặp ghép nhé!';
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

function buildCharacterHintText(npcId, actionType, itemName, lvName) {
    if (actionType === 'deliver') {
        return 'Đơn hàng đã hoàn thành! Chạm vào ô NỘP viền xanh ngay bên dưới để nhận Vàng thưởng nhé!';
    }
    if (actionType === 'merge_web') {
        return 'Thử kéo ' + itemName + ' đè lên ô Mạng Nhện cùng loại đang sáng để phá nhện nhé!';
    }
    if (actionType === 'merge_free') {
        return 'Mình thấy 2 ' + itemName + ' giống nhau kìa, ghép chúng lại để chuẩn bị đơn hàng cho "' + lvName + '" nhé!';
    }
    if (actionType === 'spawn') {
        return 'Bàn cờ hết cặp ghép rồi, chạm vào Nguồn phát đang lấp lánh để lấy thêm nguyên liệu nhé!';
    }
    return '';
}

function showIdleHint(isManualClick) {
    if (levelWon || dragState || document.getElementById('modal-overlay')) return;
    clearHintVisuals();

    var lvName = (currentLevelCfg && currentLevelCfg.name) ? currentLevelCfg.name : ('Màn ' + currentLevel);
    var speakerId = getNextNpcId();

    var readyCard = ordersContainer ? ordersContainer.querySelector('.order-card.ready') : null;
    if (readyCard) {
        showTutorialHandTap(readyCard);
        setNpcState(speakerId, '❗', buildCharacterHintText(speakerId, 'deliver', '', lvName), 4500);
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
        setNpcState(speakerId, '💡', buildCharacterHintText(speakerId, isWeb ? 'merge_web' : 'merge_free', itemName, lvName), 4500);
        return;
    }

    var empties = getEmptyIndexes(boardData);
    if (playerEnergy > 0 && empties.length > 0) {
        boardData.forEach((c, idx) => {
            if (c && GENERATORS[c.id] && !c.isLocked && boardElement.children[idx]) {
                boardElement.children[idx].classList.add('hint-pulse');
            }
        });
        setNpcState(speakerId, '⚡', buildCharacterHintText(speakerId, 'spawn', '', lvName), 4500);
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
// TẢI LEVEL & VẼ BÀN CỜ
// ==========================================
function loadLevel(lvNum) {
    closeModal();
    clearHintVisuals();
    hideNpcBubble();
    currentLevel = lvNum;
    currentLevelCfg = getLevelConfig(lvNum);
    var topSceneEl = document.getElementById('top-scene');
    if (topSceneEl && typeof getLevelBackground === 'function') {
        topSceneEl.style.backgroundImage = "url('" + getLevelBackground(lvNum) + "')";
    }
    levelClicks = 0;
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

    boardData = buildBoard(currentLevelCfg);
    var orderIds = tuneOrders(currentLevelCfg.rawOrders, lvNum);
    currentOrders = orderIds.map(id => ({ id: id, done: false }));

    // Tự động sinh sẵn một danh sách vật phẩm trên bàn cờ khi vào màn chơi, không bắt người chơi phải bấm mới có đồ
    populateInitialBoardItems();

    levelBudget = computeEnergyBudget(boardData, orderIds, currentLevelCfg);
    playerEnergy = levelBudget;
    SAVE.lastEnergyTs = Date.now();

    if (isAutoEnabled) {
        fillBoardInstantly();
    }

    renderBoard();
}

// Tự động rải sẵn khoảng 4 - 8 vật phẩm (Lv.1 - Lv.2) từ các nguồn phát khi bắt đầu màn
function populateInitialBoardItems() {
    var generators = [];
    boardData.forEach((c, idx) => {
        if (c && GENERATORS[c.id] && !c.isLocked) generators.push(idx);
    });
    if (!generators.length) return;

    var empties = getEmptyIndexes(boardData);
    if (!empties.length) return;

    // Rải sẵn từ 5 đến 8 vật phẩm (hoặc tối đa số ô trống còn lại trừ đi 4 ô đệm)
    var targetCount = Math.min(Math.max(5, Math.floor(empties.length * 0.35)), 8);
    for (var i = 0; i < targetCount; i++) {
        var currentEmpties = getEmptyIndexes(boardData);
        if (currentEmpties.length <= 3) break;
        var genIdx = generators[Math.floor(Math.random() * generators.length)];
        var genId = boardData[genIdx].id;
        spawnItem(boardData, genId);
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
        if (spawnItem(boardData, genId) === -1) break;
        playerEnergy--;
        levelClicks++;
    }
}

function updateBookBadge() {
    if (!bookBadgeUI) return;
    var n = countUnclaimedBookRewards();
    if (n > 0) {
        bookBadgeUI.innerText = n;
        bookBadgeUI.style.display = 'inline-block';
    } else {
        bookBadgeUI.style.display = 'none';
    }
}

function renderBoard() {
    boardElement.innerHTML = '';

    // Tìm các ô trên bàn cờ đáp ứng đơn hàng hiện tại (chưa hoàn thành)
    var activeOrderMap = {};
    if (currentOrders) {
        currentOrders.forEach(o => {
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
        cell.classList.add(itemData && itemData.isRock ? 'bg-rock' : ((Math.floor(i / COLS) + (i % COLS)) % 2 === 0 ? 'bg-light' : 'bg-dark'));
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
    scheduleHint();
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
    var rw = orderReward(itemId);

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

            if (isAutoEnabled) fillBoardInstantly();
            hideNpcBubble();
            renderBoard();
        };
    } else {
        boardData[boardCellIdx] = makeEmptyCell();
        playerCoins += rw;
        if (targetCardEl) spawnFlyingCurrency(targetCardEl, 'gold', rw);
        playSound('win');
        updateUIStats();
        selectedIndex = null;
        updateSellButton(null);
        if (isAutoEnabled) fillBoardInstantly();
        hideNpcBubble();
        renderBoard();
    }
}

function updateUIStats() {
    if (energyUI) energyUI.innerText = playerEnergy.toLocaleString('vi-VN');
    if (coinUI) coinUI.innerText = playerCoins.toLocaleString('vi-VN');
    if (gemUI) gemUI.innerText = playerGems.toLocaleString('vi-VN');
    if (currentLvBadgeUI) currentLvBadgeUI.innerText = 'LV' + currentLevel;
    SAVE.coins = playerCoins;
    SAVE.gems = playerGems;
    SAVE.level = currentLevel;
    saveGame();
}

function renderOrders() {
    if (!ordersContainer) return;
    ordersContainer.innerHTML = '';
    var webs = countWebs(boardData);
    if (webCountUI) webCountUI.innerText = `${webs}`;

    currentOrders.forEach((o) => {
        var card = document.createElement('div');
        card.className = 'order-card' + (o.done ? ' done' : '');
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
        if (!o.done) {
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

        // Kịch bản thưởng Vàng & Kim Cương hào phóng trực tiếp mỗi khi ghép thành công:
        // - Mọi lần ghép (từ Lv.2 trở lên) đều thưởng nhiều Vàng để xu bay lên liên tiếp
        // - Ghép liên tiếp đạt Combo x2 trở lên: thưởng thêm Vàng lớn (Combo * 10)
        // - Ghép đạt cấp tối đa (Lv.8): thưởng nóng +2 Kim Cương
        var mergedLv = 2;
        if (res.newId && res.newId.indexOf('_lv') !== -1) {
            mergedLv = parseInt(res.newId.split('_lv')[1]) || 2;
        }
        var mergeGoldTable = { 2: 10, 3: 20, 4: 35, 5: 60, 6: 100, 7: 160, 8: 250 };
        mergeGoldEarned += (mergeGoldTable[mergedLv] || (mergedLv * 10));
        if (mergeComboCount >= 2) {
            mergeGoldEarned += mergeComboCount * 10;
        }
        if (mergedLv >= 8) {
            mergeRubyEarned = 2;
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

        // Hiển thị hiệu ứng Combo bay bổng khi ghép liên tiếp (Combo x2, x3, x4...)
        if (mergeComboCount >= 2) {
            triggerComboEffect(mergedCell, mergeComboCount);
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

        // Tự động giao đơn hàng khi ghép ra đúng món nhiệm vụ đang cần
        var matchingOrderIdx = currentOrders.findIndex(o => !o.done && o.id === res.newId);
        if (matchingOrderIdx !== -1) {
            var matchingOrder = currentOrders[matchingOrderIdx];
            var targetOrderCard = ordersContainer && ordersContainer.children[matchingOrderIdx];
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
function spawnFromGenerator(gen) {
    if (playerEnergy <= 0) {
        openEnergyShop();
        return;
    }
    var target = spawnItem(boardData, gen.id);
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
    if (playerEnergy === levelBudget) {
        SAVE.lastEnergyTs = Date.now();
    }
    playerEnergy--;
    levelClicks++;

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

function handleCellClick(e, cellElement) {
    var index = parseInt(cellElement.dataset.index);
    var clickedItem = boardData[index];

    if (clickedItem && clickedItem.id && !clickedItem.isLocked && GENERATORS[clickedItem.id] && !isAutoEnabled) {
        selectedIndex = null;
        updateSellButton(null);
        spawnFromGenerator(clickedItem);
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
        budget: levelBudget,
        coins: playerCoins,
        gems: playerGems,
        secLeft: regenSecLeft,
        onBuyCoins: function () {
            playerCoins -= ENERGY_PACK_PRICE;
            playerEnergy += ENERGY_PACK;
            levelBudget = Math.max(levelBudget, playerEnergy);
            playSound('bonus');
            updateUIStats();
            showToast('⚡ Đã nạp +' + ENERGY_PACK + ' năng lượng!', '#2e7d32');
        },
        onBuyGems: function () {
            playerGems -= GEM_ENERGY_PRICE;
            playerEnergy += GEM_ENERGY_PACK;
            levelBudget = Math.max(levelBudget, playerEnergy);
            playSound('bonus');
            updateUIStats();
            var targetEl = document.getElementById('btn-refill-energy') || document.body;
            spawnFlyingCurrency(targetEl, 'ruby', 5);
            showToast('💎 Nạp siêu tốc +' + GEM_ENERGY_PACK + ' ⚡ (Bỏ qua thời gian chờ)!', '#1565c0');
        },
        onWatchAd: function () {
            simulateWatchAd('Tiếp Tế Năng Lượng Khẩn Cấp (+25 ⚡)', function () {
                playerEnergy += 25;
                levelBudget = Math.max(levelBudget, playerEnergy);
                playSound('bonus');
                updateUIStats();
                showToast('🎬 Đã nhận +25 ⚡ miễn phí từ video tài trợ!', '#2e7d32');
            });
        },
        onRescue: function () {
            playerEnergy += 20;
            levelBudget += 20;
            playSound('bonus');
            updateUIStats();
            renderBoard();
            showToast('🏕️ Kiểm lâm tiếp viện +20 ⚡ miễn phí!', '#2e7d32');
        },
        onOpenGemShop: openGemShop
    });
}

function openGemShop() {
    showGemShopModal({
        gems: playerGems,
        coins: playerCoins,
        energy: playerEnergy,
        onBuyIAP: function (pack) {
            simulateBuyIAP(pack, function () {
                var totalGems = pack.gems + (pack.bonusGems || 0);
                playerGems += totalGems;
                if (pack.coins) playerCoins += pack.coins;
                if (pack.energy) {
                    playerEnergy += pack.energy;
                    levelBudget = Math.max(levelBudget, playerEnergy);
                }
                if (pack.isStarter) {
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
            simulateWatchAd('Tài Trợ Kim Cương Hàng Ngày (+10 💎)', function () {
                playerGems += 10;
                updateUIStats();
                saveGame();
                playSound('win');
                var targetEl = document.getElementById('btn-gem-shop') || document.body;
                spawnFlyingCurrency(targetEl, 'ruby', 10);
                showToast('🎬 Bạn đã nhận +10 💎 miễn phí từ nhà tài trợ!', '#1565c0');
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
            simulateWatchAd('Tài Trợ Ngân Hàng Vàng (+500 🪙)', function () {
                playerCoins += 500;
                updateUIStats();
                saveGame();
                playSound('win');
                var targetEl = document.getElementById('btn-coin-shop') || document.body;
                spawnFlyingCurrency(targetEl, 'gold', 500);
                showToast('🎬 Bạn đã nhận +500 🪙 miễn phí từ video tài trợ!', '#2e7d32');
            });
        },
        onOpenGemShop: openGemShop
    });
}

function openLuckyDrop() {
    showLuckyDropModal(function (roll) {
        if (roll.type === 'energy') {
            playerEnergy += roll.val;
            levelBudget = Math.max(levelBudget, playerEnergy);
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
        if (sellBtnTextUI) sellBtnTextUI.innerText = 'BÁN (+' + p + ')';
        btnSell.classList.remove('disabled');
    }
}

function refreshLevelSelect() {
    if (!levelSelect) return;
    var unlockAll = SAVE.settings && SAVE.settings.unlockAllLevels;
    levelSelect.innerHTML = '';
    RAW_LEVELS.forEach(r => {
        var opt = document.createElement('option');
        opt.value = r[0];
        var st = SAVE.stars[r[0]] || 0;
        var mark = st ? ' ' + '★'.repeat(st) : ((!unlockAll && r[0] > SAVE.maxLevel) ? ' 🔒' : '');
        opt.textContent = `Lv.${r[0]}: ${r[1]}${mark}`;
        levelSelect.appendChild(opt);
    });
    levelSelect.value = currentLevel;
}

function finishLevel() {
    var stars = calcStars(playerEnergy, levelBudget);
    var firstTime = !SAVE.stars[currentLevel];
    var base = 150 + currentLevel * 25 + stars * 50;
    var coins = firstTime ? base : Math.round(base * 0.4);
    var gems = firstTime ? (stars === 3 ? 3 : 1) : 0;

    playerCoins += coins;
    playerGems += gems;
    if (boardElement && coins > 0) {
        spawnFlyingCurrency(boardElement, 'gold', coins);
    }
    SAVE.stars[currentLevel] = Math.max(SAVE.stars[currentLevel] || 0, stars);
    if (currentLevel + 1 > SAVE.maxLevel && currentLevel < RAW_LEVELS.length) SAVE.maxLevel = currentLevel + 1;
    updateUIStats();
    refreshLevelSelect();
    playSound('win');

    var hasNext = currentLevel < RAW_LEVELS.length;
    showWinModal({
        level: currentLevel,
        name: currentLevelCfg ? currentLevelCfg.name : '',
        stars: stars,
        coins: coins,
        gems: gems,
        firstTime: firstTime,
        decor: getCampDecor(currentLevel),
        hasNext: hasNext
    }, () => loadLevel(currentLevel), () => loadLevel(currentLevel + 1));
}

function toggleAutoDebug() {
    isAutoEnabled = !isAutoEnabled;
    if (isAutoEnabled) {
        fillBoardInstantly();
        renderBoard();
    }
}

function initGame() {
    refreshLevelSelect();
    if (btnRefillEnergy) btnRefillEnergy.onclick = openEnergyShop;
    var btnGemShop = document.getElementById('btn-gem-shop');
    if (btnGemShop) btnGemShop.onclick = openGemShop;
    var btnCoinShop = document.getElementById('btn-coin-shop');
    if (btnCoinShop) btnCoinShop.onclick = openCoinShop;
    var btnLuckyDrop = document.getElementById('btn-lucky-drop');
    if (btnLuckyDrop) btnLuckyDrop.onclick = openLuckyDrop;

    var btnCamp = document.getElementById('btn-camp');
    if (btnCamp) btnCamp.onclick = () => openCamp(null, null);

    var btnBook = document.getElementById('btn-book');
    if (btnBook) {
        btnBook.onclick = () => openDiscoveryBook(function (addCoins, addGems) {
            playerCoins += addCoins;
            playerGems += addGems;
            playSound('bonus');
            updateUIStats();
            updateBookBadge();
        });
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
            onRestartLevel: () => loadLevel(currentLevel),
            onResetAll: () => {
                resetSave();
                playerCoins = SAVE.coins;
                playerGems = SAVE.gems;
                refreshLevelSelect();
                loadLevel(1);
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

    var startLv = Math.min(Math.max(SAVE.level || 1, 1), RAW_LEVELS.length);
    loadLevel(startLv);

    // Bắt tương tác đầu tiên của người chơi để kích hoạt BGM nhẹ nhàng (tuân thủ autoplay policy)
    function onFirstUserGesture() {
        initAudio();
        updateBgmPlayback();
        document.removeEventListener('pointerdown', onFirstUserGesture);
        document.removeEventListener('keydown', onFirstUserGesture);
    }
    document.addEventListener('pointerdown', onFirstUserGesture);
    document.addEventListener('keydown', onFirstUserGesture);
}

initGame();