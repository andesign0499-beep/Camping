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

// Mô hình B: Bàn cờ duy nhất liên tục (Continuous Board), không bao giờ ngắt quãng hay khóa máy phát
function isLevelCompleted() {
    return false;
}

// Thông báo nhắc nhở nhẹ nhàng khi người chơi vẫn bấm vào thùng sinh đồ sau khi đã xong nhiệm vụ
var lastCompletedGenBadgeTs = 0;
function notifyLevelDoneOnGenerator(cellElement) {
    var now = Date.now();
    if (now - lastCompletedGenBadgeTs > 700) {
        lastCompletedGenBadgeTs = now;
        if (cellElement && typeof showFloatingBadge === 'function') {
            showFloatingBadge(cellElement, 'Đã hoàn thành nhiệm vụ!', '#2e7d32');
            var img = cellElement.querySelector('.item-img');
            if (img && typeof safeAnimate === 'function') {
                safeAnimate(img, [
                    { transform: 'scale(1)' },
                    { transform: 'scale(1.15)' },
                    { transform: 'scale(1)' }
                ], { duration: 220, easing: 'ease-out' });
            }
        }
    }
}

// Lập tức đánh dấu toàn bộ nguồn phát đồ trên bàn cờ chuyển sang trạng thái đã hoàn thành (ngừng nhấp nháy, giảm sáng nhẹ)
function markGeneratorsCompleted() {
    if (!boardElement || !boardData) return;
    boardData.forEach(function (c, idx) {
        if (c && c.id && !c.isRock && GENERATORS[c.id]) {
            var cell = boardElement.children[idx];
            if (cell) {
                cell.classList.add('generator-done');
                var badge = cell.querySelector('.generator-energy-badge');
                if (badge) {
                    badge.style.opacity = '0.25';
                    badge.style.animation = 'none';
                }
            }
        }
    });
}
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
// ==========================================
// HỆ THỐNG ÂM THANH CRYSTAL DOPAMINE BRIGHT MERGE-2 (CELESTA + BUBBLE-POP QUÃNG SÁNG C5-C7 + THƯ VIỆN MẪU .WAV & ZZFX)
// ==========================================
var audioCtx = null;
var masterBrightFilter = null;
var mergeComboStep = 0;
var mergeComboCount = 0;
var lastMergeAudioTs = 0;
var bgmGainNode = null;
var bgmOsc1 = null;
var bgmOsc2 = null;
var bgmTimer = null;
var isBgmPlaying = false;
var CUSTOM_SFX_STORAGE_KEY = 'MERGE_CAMPING_CUSTOM_SFX_V1';
var sampleBufferCache = {};

// Thang âm Đô Trưởng Quãng Sáng (Lv.1 -> Lv.7 leo từ C5 -> B5; từ Lv.8 vòng lại C5 -> G5 êm ái, không bị quá chói ở các cấp cuối)
var MERGE_SCALE_NOTES = [
    523.25, // 1: C5
    587.33, // 2: D5
    659.25, // 3: E5
    698.46, // 4: F5
    783.99, // 5: G5
    880.00, // 6: A5
    987.77, // 7: B5
    523.25, // 8: C5 (Vòng lại từ cấp 8 về lại âm C5)
    587.33, // 9: D5
    659.25, // 10: E5
    698.46, // 11: F5
    783.99  // 12: G5
];
var FLUTE_CHORD_CYCLE = MERGE_SCALE_NOTES;

function getAudioSfxConfig() {
    var base = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.gameplay && GAME_CONFIG.gameplay.audioSfx)
        ? GAME_CONFIG.gameplay.audioSfx
        : {};
    try {
        var raw = localStorage.getItem('MERGE_CAMPING_CUSTOM_SFX_V1');
        if (raw) {
            var custom = JSON.parse(raw);
            if (custom && (custom.presetName === 'merge_cook_tactile' || custom.presetName === 'crystal_dopamine_bright')) {
                localStorage.removeItem('MERGE_CAMPING_CUSTOM_SFX_V1');
                return base;
            }
            if (custom && typeof custom === 'object') {
                if (custom.bgmVolume === 0.24 || custom.bgmVolume === 0.22 || custom.bgmVolume === 0.35) {
                    custom.bgmVolume = 0.14;
                }
                if (custom.merge && Array.isArray(custom.merge.baseNotes) && custom.merge.baseNotes[11] > 1500) {
                    custom.merge.baseNotes = MERGE_SCALE_NOTES.slice();
                }
                return Object.assign({}, base, custom, {
                    spawn: Object.assign({}, base.spawn || {}, custom.spawn || {}),
                    move: Object.assign({}, base.move || {}, custom.move || {}),
                    merge: Object.assign({}, base.merge || {}, custom.merge || {}),
                    bubble: Object.assign({}, base.bubble || {}, custom.bubble || {}),
                    full_board: Object.assign({}, base.full_board || {}, custom.full_board || {}),
                    order_ready: Object.assign({}, base.order_ready || {}, custom.order_ready || {}),
                    coin: Object.assign({}, base.coin || {}, custom.coin || {}),
                    zzfxOverrides: custom.zzfxOverrides || {},
                    sampleOverrides: custom.sampleOverrides || {}
                });
            }
        }
    } catch (e) {}
    return base;
}

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx && audioCtx.state === 'suspended' && (typeof document === 'undefined' || !document.hidden)) {
        audioCtx.resume();
    }
    if (audioCtx && !masterBrightFilter) {
        try {
            masterBrightFilter = audioCtx.createBiquadFilter();
            masterBrightFilter.type = 'highshelf';
            masterBrightFilter.frequency.setValueAtTime(2200, audioCtx.currentTime);
            masterBrightFilter.gain.setValueAtTime(6.5, audioCtx.currentTime);
            masterBrightFilter.connect(audioCtx.destination);
        } catch (e) {
            masterBrightFilter = null;
        }
    }
    if (audioCtx && masterBrightFilter) {
        var cfg = getAudioSfxConfig();
        var shelfDb = (typeof cfg.brightnessHighShelfDb === 'number') ? cfg.brightnessHighShelfDb : 6.5;
        masterBrightFilter.gain.setValueAtTime(shelfDb, audioCtx.currentTime);
    }
}

function getAudioDestination() {
    initAudio();
    return masterBrightFilter || (audioCtx && audioCtx.destination);
}

// Tải trước & phát mẫu âm thanh từ thư viện miễn phí (assets/sfx_library/*.wav hoặc DataURL tùy chỉnh)
function playLibrarySample(sampleUrl, playbackRate, gainMul) {
    try {
        initAudio();
        if (!audioCtx || !sampleUrl) return false;
        var cfg = getAudioSfxConfig();
        var masterVol = (typeof cfg.masterVolume === 'number') ? cfg.masterVolume : 1.15;
        var semiOffset = (typeof cfg.pitchSemitoneOffset === 'number') ? cfg.pitchSemitoneOffset : 0;
        var semiMul = Math.pow(2, semiOffset / 12);
        var finalRate = Math.max(0.35, Math.min(3.5, (playbackRate || 1.0) * semiMul));
        var finalGain = Math.max(0.01, (gainMul || 0.85) * masterVol);

        function triggerBuffer(buf) {
            var src = audioCtx.createBufferSource();
            var g = audioCtx.createGain();
            src.buffer = buf;
            src.playbackRate.setValueAtTime(finalRate, audioCtx.currentTime);
            g.gain.setValueAtTime(finalGain, audioCtx.currentTime);
            src.connect(g);
            g.connect(getAudioDestination());
            src.start(0);
        }

        if (sampleBufferCache[sampleUrl]) {
            triggerBuffer(sampleBufferCache[sampleUrl]);
            return true;
        }

        fetch(sampleUrl)
            .then(function (r) { return r.arrayBuffer(); })
            .then(function (ab) { return audioCtx.decodeAudioData(ab); })
            .then(function (decoded) {
                sampleBufferCache[sampleUrl] = decoded;
                triggerBuffer(decoded);
            })
            .catch(function () {});
        return true;
    } catch (e) {
        return false;
    }
}

function triggerVibrate(pattern) {
    try {
        if (SAVE.settings && !SAVE.settings.vibrate) return;
        if (navigator && navigator.vibrate) navigator.vibrate(pattern);
    } catch (e) {}
}

// Trình tổng hợp âm thanh mã nguồn mở ZzFX (MIT License - Frank Force) tích hợp trực tiếp
function playZzfxArray(p) {
    try {
        initAudio();
        if (!audioCtx || !Array.isArray(p)) return false;
        var cfg = getAudioSfxConfig();
        var semiOffset = (typeof cfg.pitchSemitoneOffset === 'number') ? cfg.pitchSemitoneOffset : 0;
        var semiMul = Math.pow(2, semiOffset / 12);
        var volume = (p[0] !== undefined ? p[0] : 1) * 0.38 * (cfg.masterVolume || 1.15);
        var randomness = p[1] !== undefined ? p[1] : 0.03;
        var frequency = (p[2] !== undefined ? p[2] : 520) * semiMul;
        var attack = p[3] || 0;
        var sustain = p[4] || 0;
        var release = p[5] !== undefined ? p[5] : 0.1;
        var shape = p[6] || 0;
        var shapeCurve = p[7] !== undefined ? p[7] : 1;
        var slide = p[8] || 0;
        var deltaSlide = p[9] || 0;
        var pitchJump = p[10] || 0;
        var pitchJumpTime = p[11] || 0;
        var repeatTime = p[12] || 0;
        var noise = p[13] || 0;
        var modulation = p[14] || 0;
        var bitCrush = p[15] || 0;
        var delay = p[16] || 0;
        var sustainVolume = p[17] !== undefined ? p[17] : 1;
        var decay = p[18] || 0;
        var tremolo = p[19] || 0;

        var sampleRate = 44100;
        var PI2 = Math.PI * 2;
        frequency *= (1 + randomness * 2 * (Math.random() - 0.5)) * PI2 / sampleRate;
        slide *= 500 * PI2 / Math.pow(sampleRate, 2);
        deltaSlide *= 500 * PI2 / Math.pow(sampleRate, 3);
        attack = attack * sampleRate | 0;
        decay = decay * sampleRate | 0;
        sustain = sustain * sampleRate | 0;
        release = release * sampleRate | 0;
        delay = delay * sampleRate | 0;
        pitchJump *= PI2 / sampleRate;
        pitchJumpTime = pitchJumpTime * sampleRate | 0;
        repeatTime = repeatTime * sampleRate | 0;

        var length = attack + decay + sustain + release + delay | 0;
        if (length <= 0 || length > sampleRate * 4) return false;

        var b = new Float32Array(length);
        var t = 0, tm = 0, i = 0, j = 1, r = 0, c = 0, s = 0, f, env;
        for (; i < length; b[i++] = s) {
            if (++c > (bitCrush * 100 | 0)) {
                c = 0;
                tm = t * frequency * Math.sin(r * modulation * PI2 / sampleRate - Math.atan(r * modulation));
                s = shape ? (shape > 1 ? (shape > 2 ? (shape > 3 ? Math.sin( Math.pow(tm % PI2, 3) ) : Math.max(Math.min(Math.tan(tm), 1), -1)) : 1 - (2 * tm / PI2 % 2 + 2) % 2) : 1 - 4 * Math.abs(Math.round(tm / PI2) - tm / PI2)) : Math.sin(tm);
                s = (repeatTime ? 1 - tremolo + tremolo * Math.sin(PI2 * i / repeatTime) : 1) * (s > 0 ? 1 : -1) * Math.pow(Math.abs(s), shapeCurve) * volume;
                if (noise) s *= 1 - noise + noise * (Math.random() * 2 - 1);
                env = i < attack ? i / attack : i < attack + decay ? 1 - (i - attack) / decay * (1 - sustainVolume) : i < attack + decay + sustain ? sustainVolume : i < length - delay ? (length - i - delay) / release * sustainVolume : 0;
                s = delay ? s / 2 + (delay > i ? 0 : (i < length - delay ? 1 : (length - i) / delay) * b[i - delay | 0] / 2) : s;
                s *= env;
            }
            f = (frequency += slide += deltaSlide) * Math.cos(modulation * r++);
            t += f - f * noise * (1 - (Math.sin(i) + 1) * 1e9 % 2);
            if (j && ++j > pitchJumpTime) {
                frequency += pitchJump;
                j = 0;
            }
            if (repeatTime && !(++r % repeatTime)) {
                frequency = p[2] * semiMul * PI2 / sampleRate;
                slide = p[8] * 500 * PI2 / Math.pow(sampleRate, 2);
                j = j || 1;
            }
        }
        var buf = audioCtx.createBuffer(1, length, sampleRate);
        buf.getChannelData(0).set(b);
        var src = audioCtx.createBufferSource();
        src.buffer = buf;
        src.connect(getAudioDestination());
        src.start();
        return true;
    } catch (e) {
        return false;
    }
}

// Hàm gảy chuông pha lê Celesta + Kalimba Sáng (3 tầng họa âm 1x + 2x + 3x lấp lánh, trong veo, không bao giờ bị trầm đục)
function playKalimbaPluck(freq, startTime, duration, peakGain, graceRatio, opts) {
    if (!audioCtx) return;
    opts = opts || {};
    var cfg = getAudioSfxConfig();
    var masterVol = (typeof cfg.masterVolume === 'number') ? cfg.masterVolume : 1.15;
    var semiOffset = (typeof cfg.pitchSemitoneOffset === 'number') ? cfg.pitchSemitoneOffset : 0;
    var semiMul = Math.pow(2, semiOffset / 12);
    var targetFreq = Math.min(6000, Math.max(120, freq * semiMul));
    var finalGain = Math.max(0.002, (peakGain || 0.16) * masterVol);
    var dur = Math.max(0.035, duration || 0.125);
    var bellMix = (typeof cfg.sparkleBellMix === 'number') ? cfg.sparkleBellMix : 0.42;

    var mainOsc = audioCtx.createOscillator();
    var harmOsc = audioCtx.createOscillator();
    var bellOsc = audioCtx.createOscillator();
    var filter = audioCtx.createBiquadFilter();
    var mainGain = audioCtx.createGain();
    var harmGain = audioCtx.createGain();
    var bellGain = audioCtx.createGain();

    mainOsc.type = opts.waveType || (cfg.merge && cfg.merge.waveType) || 'sine';
    harmOsc.type = 'triangle';
    bellOsc.type = 'sine';

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(opts.filterCutoff || (cfg.merge && cfg.merge.filterCutoff) || 5800, startTime);

    var startFreq = graceRatio ? targetFreq * graceRatio : targetFreq;
    var slideTime = Math.min(0.022, dur * 0.28);
    mainOsc.frequency.setValueAtTime(startFreq, startTime);
    harmOsc.frequency.setValueAtTime(targetFreq * 2.0, startTime);
    bellOsc.frequency.setValueAtTime(targetFreq * 3.0, startTime);
    if (graceRatio && graceRatio !== 1) {
        mainOsc.frequency.exponentialRampToValueAtTime(targetFreq, startTime + slideTime);
    }

    var attack = Math.min(0.003, dur * 0.10);
    mainGain.gain.setValueAtTime(0.0005, startTime);
    mainGain.gain.linearRampToValueAtTime(finalGain, startTime + attack);
    mainGain.gain.exponentialRampToValueAtTime(0.0005, startTime + dur);

    var hRatio = (opts.harmonic2Gain !== undefined) ? opts.harmonic2Gain : 0.34;
    harmGain.gain.setValueAtTime(0.0005, startTime);
    harmGain.gain.linearRampToValueAtTime(finalGain * hRatio, startTime + attack);
    harmGain.gain.exponentialRampToValueAtTime(0.0005, startTime + dur * 0.78);

    bellGain.gain.setValueAtTime(0.0005, startTime);
    bellGain.gain.linearRampToValueAtTime(finalGain * bellMix * 0.45, startTime + attack);
    bellGain.gain.exponentialRampToValueAtTime(0.0005, startTime + dur * 0.58);

    mainOsc.connect(filter);
    harmOsc.connect(harmGain);
    harmGain.connect(filter);
    bellOsc.connect(bellGain);
    bellGain.connect(filter);
    filter.connect(mainGain);
    mainGain.connect(getAudioDestination());

    var stopTime = startTime + dur + 0.015;
    mainOsc.start(startTime);
    harmOsc.start(startTime);
    bellOsc.start(startTime);
    mainOsc.stop(stopTime);
    harmOsc.stop(stopTime);
    bellOsc.stop(stopTime);

    mainOsc.onended = function () {
        try {
            mainOsc.disconnect();
            harmOsc.disconnect();
            bellOsc.disconnect();
            filter.disconnect();
            mainGain.disconnect();
            harmGain.disconnect();
            bellGain.disconnect();
        } catch (e) {}
    };
}
var playFluteNote = playKalimbaPluck;

// ==========================================
// HỆ THỐNG NHẠC NỀN BGM LIỀN MẠCH TUYỆT ĐỐI (GAPLESS WEB AUDIO BUFFER LOOP & CROSSFADE ENGINE)
// Không bao giờ bị ngắt quãng giữa các vòng lặp hoặc khi chuyển bài
// ==========================================
var BGM_PLAYLIST = [
    'assets/music/Ukulele_Suoi_Nang.wav'
];
var bgmAudioElement = null;
var currentBgmIndex = -1;
var bgmBufferCache = {};
var bgmActiveSource = null;
var bgmActiveGain = null;
var bgmNextTimer = null;
var bgmActiveUrl = '';
var bgmIsLoading = false;

function getNextRandomBgmIndex() {
    var sfxCfg = getAudioSfxConfig();
    if (sfxCfg && typeof sfxCfg.preferredBgmIndex === 'number' && sfxCfg.preferredBgmIndex >= 0 && sfxCfg.preferredBgmIndex < BGM_PLAYLIST.length) {
        return sfxCfg.preferredBgmIndex;
    }
    if (BGM_PLAYLIST.length <= 1) return 0;
    var next;
    do {
        next = Math.floor(Math.random() * BGM_PLAYLIST.length);
    } while (next === currentBgmIndex);
    return next;
}

function stopWebAudioBgmSource(fadeSec) {
    if (bgmNextTimer) {
        clearTimeout(bgmNextTimer);
        bgmNextTimer = null;
    }
    if (bgmActiveSource) {
        var oldSrc = bgmActiveSource;
        var oldGain = bgmActiveGain;
        bgmActiveSource = null;
        bgmActiveGain = null;
        try {
            if (fadeSec && fadeSec > 0 && audioCtx && oldGain) {
                var now = audioCtx.currentTime;
                oldGain.gain.setValueAtTime(oldGain.gain.value, now);
                oldGain.gain.linearRampToValueAtTime(0.0001, now + fadeSec);
                setTimeout(function () {
                    try { oldSrc.stop(); oldSrc.disconnect(); oldGain.disconnect(); } catch (e) {}
                }, fadeSec * 1000 + 50);
            } else {
                oldSrc.stop();
                oldSrc.disconnect();
                if (oldGain) oldGain.disconnect();
            }
        } catch (e) {}
    }
}

function playBgmBufferSource(decodedBuffer, targetUrl, isSingleLoop, targetVol, targetRate) {
    if (!SAVE.settings || !SAVE.settings.bgm) return;
    initAudio();
    if (!audioCtx) return;

    // Crossfade mượt 1.2 giây từ bản đang phát (nếu có) sang bản mới để tạo chuỗi nhạc nền liên tục
    stopWebAudioBgmSource(1.2);

    var src = audioCtx.createBufferSource();
    var gain = audioCtx.createGain();
    src.buffer = decodedBuffer;
    src.playbackRate.setValueAtTime(targetRate, audioCtx.currentTime);

    // Khi chọn 1 bài cố định (như Pha Lê Rừng Thông), bật loop sample-accurate (0.000ms độ trễ nối vòng!)
    src.loop = !!isSingleLoop;
    if (isSingleLoop) {
        src.loopStart = 0;
        src.loopEnd = decodedBuffer.duration;
    }

    var now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(targetVol, now + 0.85);

    src.connect(gain);
    gain.connect(audioCtx.destination);
    src.start(0);

    bgmActiveSource = src;
    bgmActiveGain = gain;
    bgmActiveUrl = targetUrl;

    // Nếu ở chế độ xoay vòng nhiều bài (isSingleLoop === false), hẹn giờ nối bài tiếp theo sớm 1.5s trước khi hết bài (Crossfade liền mạch)
    if (!isSingleLoop) {
        var playDurMs = Math.max(2000, ((decodedBuffer.duration / targetRate) - 1.5) * 1000);
        bgmNextTimer = setTimeout(function () {
            if (SAVE.settings && SAVE.settings.bgm) {
                playBgmTrack(getNextRandomBgmIndex());
            }
        }, playDurMs);
    }
}

function playBgmTrack(index) {
    if (!SAVE.settings || !SAVE.settings.bgm) {
        stopBgm();
        return;
    }
    var sfxCfg = getAudioSfxConfig();
    var targetBgmVol = (typeof sfxCfg.bgmVolume === 'number') ? sfxCfg.bgmVolume : 0.14;
    var targetRate = (typeof sfxCfg.bgmPlaybackRate === 'number') ? sfxCfg.bgmPlaybackRate : 1.0;

    var isFixedSingleTrack = false;
    var targetUrl = '';

    if (sfxCfg && sfxCfg.customBgmDataUrl) {
        targetUrl = sfxCfg.customBgmDataUrl;
        isFixedSingleTrack = true;
    } else {
        if (typeof sfxCfg.preferredBgmIndex === 'number' && sfxCfg.preferredBgmIndex >= 0 && sfxCfg.preferredBgmIndex < BGM_PLAYLIST.length) {
            index = sfxCfg.preferredBgmIndex;
            isFixedSingleTrack = true;
        }
        currentBgmIndex = ((typeof index === 'number' && index >= 0) ? index : 5) % BGM_PLAYLIST.length;
        targetUrl = BGM_PLAYLIST[currentBgmIndex];
    }

    // Nếu bài này đang phát bằng Web Audio Buffer rồi thì chỉ cập nhật âm lượng & tốc độ mượt mà, không cắt tiếng
    if (bgmActiveSource && bgmActiveUrl === targetUrl && isFixedSingleTrack) {
        if (bgmActiveGain && audioCtx) {
            bgmActiveGain.gain.setTargetAtTime(targetBgmVol, audioCtx.currentTime, 0.15);
        }
        try { bgmActiveSource.playbackRate.setValueAtTime(targetRate, audioCtx.currentTime); } catch (e) {}
        return;
    }

    // Ưu tiên phát bằng Web Audio API AudioBufferSourceNode để nối vòng lặp 0ms không bao giờ bị khựng
    try {
        initAudio();
        if (audioCtx) {
            if (bgmBufferCache[targetUrl]) {
                if (bgmAudioElement) bgmAudioElement.pause();
                playBgmBufferSource(bgmBufferCache[targetUrl], targetUrl, isFixedSingleTrack, targetBgmVol, targetRate);
                return;
            }
            if (!bgmIsLoading) {
                bgmIsLoading = true;
                fetch(targetUrl)
                    .then(function (r) { return r.arrayBuffer(); })
                    .then(function (ab) { return audioCtx.decodeAudioData(ab); })
                    .then(function (decoded) {
                        bgmIsLoading = false;
                        bgmBufferCache[targetUrl] = decoded;
                        if (SAVE.settings && SAVE.settings.bgm) {
                            if (bgmAudioElement) bgmAudioElement.pause();
                            playBgmBufferSource(decoded, targetUrl, isFixedSingleTrack, targetBgmVol, targetRate);
                        }
                    })
                    .catch(function () {
                        bgmIsLoading = false;
                        playHtmlAudioFallback(targetUrl, isFixedSingleTrack, targetBgmVol, targetRate);
                    });
                return;
            }
        }
    } catch (e) {
        bgmIsLoading = false;
    }

    playHtmlAudioFallback(targetUrl, isFixedSingleTrack, targetBgmVol, targetRate);
}

function playHtmlAudioFallback(targetUrl, isFixedSingleTrack, targetBgmVol, targetRate) {
    if (!bgmAudioElement) {
        bgmAudioElement = new Audio();
        bgmAudioElement.addEventListener('ended', function () {
            if (!bgmAudioElement.loop) {
                playBgmTrack(getNextRandomBgmIndex());
            }
        });
        bgmAudioElement.addEventListener('error', function () {
            setTimeout(function () {
                if (SAVE.settings && SAVE.settings.bgm) {
                    playBgmTrack((currentBgmIndex + 1) % BGM_PLAYLIST.length);
                }
            }, 1200);
        });
    }
    bgmAudioElement.volume = targetBgmVol;
    bgmAudioElement.loop = !!isFixedSingleTrack;
    if (bgmAudioElement.src.indexOf(targetUrl) === -1) {
        bgmAudioElement.src = targetUrl;
        bgmAudioElement.currentTime = 0;
    }
    bgmAudioElement.playbackRate = targetRate;
    var playPromise = bgmAudioElement.play();
    if (playPromise !== undefined) {
        playPromise.catch(function () {});
    }
}

function startBgm() {
    if (!SAVE.settings || !SAVE.settings.bgm) return;
    if (typeof document !== 'undefined' && document.hidden) return;
    if (bgmActiveSource) {
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
        var sfxCfg = getAudioSfxConfig();
        if (bgmActiveGain && audioCtx) {
            bgmActiveGain.gain.setTargetAtTime((typeof sfxCfg.bgmVolume === 'number') ? sfxCfg.bgmVolume : 0.14, audioCtx.currentTime, 0.15);
        }
        return;
    }
    if (bgmAudioElement && !bgmAudioElement.paused) return;
    if (currentBgmIndex === -1) {
        currentBgmIndex = getNextRandomBgmIndex();
    }
    playBgmTrack(currentBgmIndex);
}

function stopBgm() {
    stopWebAudioBgmSource(0.25);
    if (bgmAudioElement) {
        bgmAudioElement.pause();
    }
}

function updateBgmPlayback() {
    if (SAVE.settings && SAVE.settings.bgm) {
        startBgm();
    } else {
        stopBgm();
    }
}

// Tự động tắt/tạm dừng toàn bộ nhạc nền & âm thanh ngay khi người chơi chuyển tab, thu nhỏ trình duyệt, khóa màn hình hoặc thoát game
function pauseAllAudioOnLeave() {
    try {
        if (audioCtx && audioCtx.state === 'running') {
            audioCtx.suspend();
        }
        if (bgmAudioElement && !bgmAudioElement.paused) {
            bgmAudioElement.pause();
        }
    } catch (e) {}
}

function resumeAllAudioOnReturn() {
    try {
        if (typeof document !== 'undefined' && document.hidden) return;
        if (typeof document !== 'undefined' && typeof document.hasFocus === 'function' && !document.hasFocus()) return;
        if (SAVE.settings && SAVE.settings.bgm) {
            if (audioCtx && audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            if (!bgmActiveSource && (!bgmAudioElement || bgmAudioElement.paused)) {
                startBgm();
            } else if (bgmAudioElement && bgmAudioElement.paused && !bgmActiveSource) {
                bgmAudioElement.play().catch(function () {});
            }
        }
    } catch (e) {}
}

if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
            pauseAllAudioOnLeave();
        } else {
            resumeAllAudioOnReturn();
        }
    });
}
if (typeof window !== 'undefined') {
    window.addEventListener('blur', pauseAllAudioOnLeave);
    window.addEventListener('pagehide', pauseAllAudioOnLeave);
    window.addEventListener('beforeunload', pauseAllAudioOnLeave);
    window.addEventListener('focus', resumeAllAudioOnReturn);
    window.addEventListener('pageshow', resumeAllAudioOnReturn);
}

// ==========================================
// HỆ THỐNG HIỆU ỨNG ÂM THANH SFX CRYSTAL DOPAMINE BRIGHT (QUÃNG SÁNG C5-C7 + HỖ TRỢ SAMPLE .WAV & ZZFX)
// ==========================================
function playSound(type, itemId) {
    try {
        if (SAVE.settings && !SAVE.settings.sound) return;
        initAudio();
        if (!audioCtx) return;
        var now = audioCtx.currentTime;
        var sfxCfg = getAudioSfxConfig();
        var masterVol = (typeof sfxCfg.masterVolume === 'number') ? sfxCfg.masterVolume : 1.15;
        var semiOffset = (typeof sfxCfg.pitchSemitoneOffset === 'number') ? sfxCfg.pitchSemitoneOffset : 0;
        var semiMul = Math.pow(2, semiOffset / 12);

        // Tính cấp độ vật phẩm (1..12) khi ghép để cố định âm thanh theo đúng Level của vật phẩm
        var parsedMergeLv = 2;
        if (type === 'merge') {
            if (typeof itemId === 'number') {
                parsedMergeLv = Math.max(1, Math.min(12, Math.round(itemId)));
            } else if (itemId && typeof itemId === 'string' && itemId.indexOf('_lv') !== -1) {
                parsedMergeLv = Math.max(1, Math.min(12, parseInt(itemId.split('_lv')[1], 10) || 2));
            }
            var nowMsCombo = Date.now();
            var comboWinMs = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.gameplay && GAME_CONFIG.gameplay.combo && GAME_CONFIG.gameplay.combo.windowSec)
                ? GAME_CONFIG.gameplay.combo.windowSec * 1000
                : 3800;
            if (nowMsCombo - lastMergeAudioTs < comboWinMs) {
                mergeComboCount++;
            } else {
                mergeComboCount = 1;
            }
            lastMergeAudioTs = nowMsCombo;
            mergeComboStep = parsedMergeLv - 1;
        }

        // 1. Ưu tiên phát Sample thực từ Thư Viện Âm Thanh Miễn Phí (assets/sfx_library/*.wav) nếu người dùng đã chọn trong sfx-studio.html
        var sampleKey = (type === 'merge' && sfxCfg.sampleOverrides && sfxCfg.sampleOverrides['merge_lv' + parsedMergeLv])
            ? ('merge_lv' + parsedMergeLv)
            : type;
        if (sfxCfg.sampleOverrides && sfxCfg.sampleOverrides[sampleKey]) {
            var sOv = sfxCfg.sampleOverrides[sampleKey];
            var sUrl = (typeof sOv === 'string') ? sOv : sOv.url;
            var sBaseRate = (typeof sOv === 'object' && sOv.rate) ? sOv.rate : 1.0;
            var sGain = (typeof sOv === 'object' && sOv.gain) ? sOv.gain : 0.9;
            if (type === 'merge' && sampleKey === 'merge') {
                var mgScaleS = (sfxCfg.merge && Array.isArray(sfxCfg.merge.baseNotes) && sfxCfg.merge.baseNotes.length >= 12)
                    ? sfxCfg.merge.baseNotes
                    : MERGE_SCALE_NOTES;
                var baseRef = mgScaleS[0] || 523.25;
                var targetLvFreq = mgScaleS[parsedMergeLv - 1] || 523.25;
                sBaseRate *= (targetLvFreq / baseRef);
            }
            if (playLibrarySample(sUrl, sBaseRate, sGain)) return;
        }

        // 2. Nếu người dùng đã gán một mẫu âm thanh ZzFX tùy chỉnh từ sfx-studio.html
        if (sfxCfg.zzfxOverrides && Array.isArray(sfxCfg.zzfxOverrides[type])) {
            var zArr = sfxCfg.zzfxOverrides[type].slice();
            if (type === 'merge') {
                var mgScaleZ = (sfxCfg.merge && Array.isArray(sfxCfg.merge.baseNotes) && sfxCfg.merge.baseNotes.length >= 12)
                    ? sfxCfg.merge.baseNotes
                    : MERGE_SCALE_NOTES;
                zArr[2] = mgScaleZ[parsedMergeLv - 1] || 523.25;
            }
            if (playZzfxArray(zArr)) return;
        }

        function playTransientSweep(fStart, fEnd, durSec, gainVal, wave, cutoffFreq, delaySec) {
            try {
                var t0 = now + (delaySec || 0);
                var osc = audioCtx.createOscillator();
                var flt = audioCtx.createBiquadFilter();
                var g = audioCtx.createGain();
                osc.type = wave || 'sine';
                osc.frequency.setValueAtTime(Math.max(40, fStart * semiMul), t0);
                osc.frequency.exponentialRampToValueAtTime(Math.max(40, fEnd * semiMul), t0 + durSec);
                flt.type = 'lowpass';
                flt.frequency.setValueAtTime(cutoffFreq || 5200, t0);
                var peak = Math.max(0.001, gainVal * masterVol);
                g.gain.setValueAtTime(0.0005, t0);
                g.gain.linearRampToValueAtTime(peak, t0 + Math.min(0.003, durSec * 0.14));
                g.gain.exponentialRampToValueAtTime(0.0005, t0 + durSec);
                osc.connect(flt);
                flt.connect(g);
                g.connect(getAudioDestination());
                osc.start(t0);
                osc.stop(t0 + durSec + 0.012);
                osc.onended = function () {
                    try { osc.disconnect(); flt.disconnect(); g.disconnect(); } catch (e) {}
                };
            } catch (e) {}
        }

        if (type === 'spawn') {
            // Tiếng bấm máy phát Kalimba Sáng Trong: Pop giọt sương (480Hz -> 1180Hz) + Gảy phím Kalimba B5 (987.77Hz)
            var spCfg = sfxCfg.spawn || {};
            var jitter = 1 + ((Math.random() * 2 - 1) * (spCfg.jitter || 0.035));
            var spawnLv = 1;
            if (itemId && typeof itemId === 'string' && itemId.indexOf('_lv') !== -1) {
                spawnLv = parseInt(itemId.split('_lv')[1]) || 1;
            }
            var lvPitch = spawnLv >= 3 ? 1.26 : (spawnLv === 2 ? 1.122 : 1.0);
            var f0 = (spCfg.fStart || 480) * jitter * lvPitch;
            var f1 = (spCfg.fEnd || 1180) * jitter * lvPitch;
            var spDur = spCfg.duration || 0.045;
            var spGain = spCfg.gain || 0.16;
            var spCut = spCfg.filterCutoff || 4600;

            // Lớp 1: Pop giọt nước hướng lên (480Hz -> 1180Hz)
            playTransientSweep(f0, f1, spDur, spGain, 'sine', spCut, 0);
            // Lớp 2: Nốt gảy phím Kalimba ngắn B5 (987.77Hz) sáng trong
            var bellBase = (spCfg.bellFreq || 987.77) * jitter * lvPitch;
            playKalimbaPluck(bellBase, now + 0.006, 0.075, (spCfg.woodGain || 0.09) * 1.30, 0.86, {
                filterCutoff: spCut,
                harmonic2Gain: 0.30
            });

            if (spawnLv >= 3) {
                playKalimbaPluck(987.77, now + 0.028, 0.090, 0.12, 0.90, { filterCutoff: 4600, harmonic2Gain: 0.30 });
                playKalimbaPluck(1318.51, now + 0.055, 0.110, 0.12, 0.92, { filterCutoff: 4800, harmonic2Gain: 0.28 });
                triggerVibrate([15, 20, 15]);
            } else if (spawnLv === 2) {
                playKalimbaPluck(1174.66, now + 0.026, 0.085, 0.10, 0.90, { filterCutoff: 4600, harmonic2Gain: 0.30 });
                triggerVibrate(12);
            }
        } else if (type === 'move' || type === 'tap') {
            // Tiếng chạm / đặt đồ sang ô trống theo âm sắc Kalimba Sáng Trong (520Hz -> 840Hz, 24ms)
            var mvCfg = sfxCfg.move || {};
            playTransientSweep(mvCfg.fStart || 520, mvCfg.fEnd || 840, mvCfg.duration || 0.024, mvCfg.gain || 0.05, 'sine', mvCfg.filterCutoff || 3400, 0);
        } else if (type === 'merge') {
            // Tiếng ghép đồ Kalimba Sáng Trong cố định theo từng Level vật phẩm (Lv.1-7: C5->B5, Lv.8-12: vòng lại C5->G5)
            var mgCfg = sfxCfg.merge || {};
            var scale = (Array.isArray(mgCfg.baseNotes) && mgCfg.baseNotes.length >= 12) ? mgCfg.baseNotes : MERGE_SCALE_NOTES;
            var itemLv = parsedMergeLv;
            var lvIdx = Math.max(0, Math.min(scale.length - 1, itemLv - 1));

            var noteFreq = scale[lvIdx] || 523.25;
            var lvGainMul = (Array.isArray(mgCfg.levelGains) && typeof mgCfg.levelGains[lvIdx] === 'number')
                ? mgCfg.levelGains[lvIdx]
                : 1.0;
            var popStart = mgCfg.popRatioStart || 0.58;
            var bodyDur = (mgCfg.bodyDuration || 0.115) * (1 + (lvIdx % 7) * 0.025);
            var bodyGain = (mgCfg.gain || 0.18) * lvGainMul;
            var mgCut = mgCfg.filterCutoff || 4800;

            // Lớp 1: Tiếng bật nắp giọt nước đầu nốt
            playTransientSweep(noteFreq * popStart, noteFreq * 1.28, mgCfg.popDuration || 0.024, bodyGain * 0.75, 'sine', mgCut, 0);
            // Lớp 2: Nốt gảy phím Kalimba Sáng Trong cố định của Level hiện tại
            playKalimbaPluck(noteFreq, now + 0.005, bodyDur, bodyGain, 0.82, {
                waveType: mgCfg.waveType || 'sine',
                filterCutoff: mgCut,
                harmonic2Gain: mgCfg.harmonic2Gain !== undefined ? mgCfg.harmonic2Gain : 0.30
            });
            // Lớp 3: Nốt hòa âm quãng 5 Kalimba sáng dịu đi kèm
            var spkGain = (mgCfg.sparkleGain !== undefined ? mgCfg.sparkleGain : 0.09) * lvGainMul;
            if (spkGain > 0) {
                playKalimbaPluck(noteFreq * 1.498, now + 0.028, bodyDur * 0.85, spkGain * (itemLv >= 4 ? 1.1 : 0.75), 0.92, {
                    filterCutoff: mgCut,
                    harmonic2Gain: 0.22
                });
                if (itemLv >= 5) {
                    playKalimbaPluck(noteFreq * 1.498, now + 0.052, bodyDur * 0.82, spkGain * 0.8, 0.94, {
                        filterCutoff: mgCut,
                        harmonic2Gain: 0.18
                    });
                }
            }
            triggerVibrate(itemLv >= 5 ? [12, 18, 12] : 10);
        } else if (type === 'bubble') {
            // Tiếng sinh Bong Bóng theo bộ Kalimba Sáng Trong (420Hz -> 980Hz -> 1480Hz) + nốt Kalimba C6 (1046.5Hz)
            var bbCfg = sfxCfg.bubble || {};
            var bf0 = bbCfg.fStart || 420;
            var bf1 = bbCfg.fMid || 980;
            var bf2 = bbCfg.fEnd || 1480;
            var bGain = bbCfg.gain || 0.16;
            playTransientSweep(bf0, bf1, 0.052, bGain, 'sine', 4200, 0);
            playTransientSweep(bf1 * 0.78, bf2, 0.065, bGain * 0.90, 'sine', 4600, 0.044);
            playKalimbaPluck(1046.50, now + 0.088, 0.085, bGain * 0.55, 0.92, { filterCutoff: 4600, harmonic2Gain: 0.28 });
        } else if (type === 'full_board' || type === 'error') {
            // Tiếng cảnh báo bàn cờ đầy: 2 nốt gõ Kalimba mộc D5 -> A4 (587.33Hz -> 440Hz) lịch sự, rõ ràng
            var fbCfg = sfxCfg.full_board || {};
            var fbDur = fbCfg.duration || 0.065;
            var fbGain = fbCfg.gain || 0.13;
            var fbCut = fbCfg.filterCutoff || 2400;
            playKalimbaPluck(fbCfg.f1 || 587.33, now, fbDur, fbGain, 0.95, { filterCutoff: fbCut, harmonic2Gain: 0.25 });
            playKalimbaPluck(fbCfg.f2 || 440.00, now + (fbCfg.gap || 0.065), fbDur * 1.15, fbGain * 0.92, 0.95, { filterCutoff: fbCut, harmonic2Gain: 0.25 });
            triggerVibrate([15, 25]);
        } else if (type === 'order_ready') {
            // Tiếng hoàn thành món trong đơn hàng: Tam âm Kalimba Sáng Trong G5 -> C6 -> E6
            var orCfg = sfxCfg.order_ready || {};
            var orDur = orCfg.duration || 0.130;
            var orGain = orCfg.gain || 0.15;
            var orGap = orCfg.gap || 0.052;
            playKalimbaPluck(orCfg.note1 || 783.99, now, orDur * 0.9, orGain * 0.9, 0.90, { filterCutoff: 4600, harmonic2Gain: 0.30 });
            playKalimbaPluck(orCfg.note2 || 1046.50, now + orGap, orDur, orGain, 0.92, { filterCutoff: 4800, harmonic2Gain: 0.30 });
            playKalimbaPluck(orCfg.note3 || 1318.51, now + orGap * 2, orDur * 1.2, orGain * 1.02, 0.94, { filterCutoff: 4800, harmonic2Gain: 0.28 });
        } else if (type === 'bonus') {
            // Tiếng nhận hộp quà / tiếp tế: Hợp âm Kalimba Sáng Trong C5 -> E5 -> G5 -> C6
            [523.25, 659.25, 783.99, 1046.50].forEach(function (f, idx) {
                playKalimbaPluck(f, now + idx * 0.038, 0.12, 0.13, 0.90, { filterCutoff: 4800, harmonic2Gain: 0.30 });
            });
        } else if (type === 'sweep') {
            // Âm thanh lướt phím Kalimba E5 -> G5 -> C6
            var sweepNotes = [659.25, 783.99, 1046.50];
            sweepNotes.forEach(function (freq, idx) {
                playKalimbaPluck(freq, now + idx * 0.038, 0.11, 0.12, 0.90, { filterCutoff: 4600, harmonic2Gain: 0.30 });
            });
            triggerVibrate(18);
        } else if (type === 'rock_crack') {
            // Âm thanh tách mở ô đá theo âm sắc Kalimba Sáng Trong (G5 -> C6)
            playTransientSweep(360, 780, 0.042, 0.15, 'triangle', 3400, 0);
            playKalimbaPluck(783.99, now + 0.025, 0.105, 0.12, 0.88, { filterCutoff: 4600, harmonic2Gain: 0.30 });
            playKalimbaPluck(1046.50, now + 0.055, 0.115, 0.12, 0.90, { filterCutoff: 4800, harmonic2Gain: 0.28 });
            triggerVibrate([18, 25]);
        } else if (type === 'win') {
            // Khúc nhạc Kalimba Sáng Trong hoàn thành đơn hàng / thắng màn tươi vui (C5 -> E5 -> G5 -> C6 -> E6)
            var winNotes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
            winNotes.forEach(function (freq, idx) {
                var dur = (idx === winNotes.length - 1) ? 0.22 : 0.125;
                playKalimbaPluck(freq, now + idx * 0.052, dur, 0.15, 0.90, { filterCutoff: 4800, harmonic2Gain: 0.30 });
            });
            triggerVibrate([20, 35, 25]);
        }
    } catch (e) { console.log(e); }
}

// ==========================================
// TỐI ƯU HÓA HIỆU NĂNG ANIMATION & HẠT (PERFORMANCE OPTIMIZER)
// Wrapper an toàn giúp dọn sạch hoàn toàn animation Web API khỏi bộ nhớ trình duyệt khi kết thúc
// ==========================================
function safeAnimate(element, keyframes, options, onComplete) {
    if (!element || !element.animate) {
        if (typeof onComplete === 'function') onComplete();
        return null;
    }
    var anim = null;
    var duration = (typeof options === 'number') ? options : ((options && options.duration) || 300);
    var isDone = false;

    function finish() {
        if (isDone) return;
        isDone = true;
        try {
            if (anim) {
                anim.onfinish = null;
                anim.oncancel = null;
                anim.cancel();
            }
        } catch (e) {}
        if (typeof onComplete === 'function') onComplete();
    }

    try {
        var opt = Object.assign({}, (typeof options === 'object' ? options : { duration: duration }));
        // Tuyệt đối không dùng fill: 'forwards' để tránh rò rỉ Web Animation objects trong bộ nhớ
        if (opt.fill === 'forwards') opt.fill = 'none';

        anim = element.animate(keyframes, opt);
        anim.onfinish = finish;
        anim.oncancel = finish;
        setTimeout(finish, duration + 60);
    } catch (e) {
        finish();
    }
    return anim;
}

// DỌN SẠCH MỌI PHẦN TỬ TRÔI NỔI MỒ CÔI (CHỐNG KẸT CHẤM MÀU TRÊN MÀN HÌNH)
function cleanOrphanedFx() {
    try {
        var strays = document.querySelectorAll('body > div');
        strays.forEach(function (d) {
            if (!d) return;
            if (d.id === 'game-app' || d.id === 'modal-overlay' || d.id === 'star-chest-opening-overlay' || d.classList.contains('modal-overlay')) return;
            // Xóa các giao diện test nếu setting đang tắt
            if (d.id === 'dev-floating-btn' || d.id === 'dev-floating-status' || d.id === 'dev-test-modal-overlay') {
                if (!(typeof SAVE !== 'undefined' && SAVE && SAVE.settings && SAVE.settings.showTestTool)) {
                    d.remove();
                }
                return;
            }
            // Quét sạch các chấm tròn / hạt particle trôi nổi cũ còn sót lại trên body
            var st = window.getComputedStyle(d);
            if (st.position === 'fixed' && (st.borderRadius === '50%' || parseInt(st.zIndex, 10) >= 90000 || d.style.borderRadius === '50%')) {
                d.remove();
            }
        });
    } catch (e) {}
}

// ==========================================
// HIỆU ỨNG GHÉP ĐỒ SIÊU NHẸ (KHÔNG TẠO DIV HẠT NỔ TRÔI NỔI ĐỂ CHỐNG KẸT CHẤM)
// ==========================================
function triggerParticleBurst(cellElement, customColors) {
    if (!cellElement) return;
    cleanOrphanedFx();
    var img = cellElement.querySelector ? (cellElement.querySelector('.item-img') || cellElement.querySelector('img')) : null;
    if (img) {
        safeAnimate(img, [
            { transform: 'scale(0.85)' },
            { transform: 'scale(1.18)', offset: 0.5 },
            { transform: 'scale(1.0)' }
        ], { duration: 240, easing: 'ease-out' });
    }
}

function showFloatingBadge(cellElement, text, color) {
    if (!cellElement) return;
    if (typeof window !== 'undefined' && window.autoBotRunning) return;

    var rect = cellElement.getBoundingClientRect();
    var tag = document.createElement('div');
    tag.textContent = text;
    tag.style.cssText = 'position:fixed;pointer-events:none;z-index:100001;font-weight:800;font-size:12px;line-height:16px;' +
        'padding:3px 8px;border-radius:8px;color:#fff;background:' + (color || '#2e7d32') + ';' +
        'box-shadow:0 2px 6px rgba(0,0,0,.3);left:' + (rect.left + rect.width / 2) + 'px;top:' + rect.top + 'px;';
    document.body.appendChild(tag);
    safeAnimate(tag, [
        { transform: 'translate(-50%, 0) scale(0.85)', opacity: 1 },
        { transform: 'translate(-50%, -24px) scale(1.02)', opacity: 0 }
    ], { duration: 750, easing: 'ease-out' }, function () {
        tag.remove();
    });
}

// Hiệu ứng Combo x2, x3, x4... thị giác nổi bật, tự động đổi màu rực rỡ theo cấp combo và hiển thị số Vàng thưởng
function triggerComboEffect(cellElement, comboCount, comboGold) {
    if (!cellElement) return;
    if (typeof window !== 'undefined' && window.autoBotRunning) return;

    var rect = cellElement.getBoundingClientRect();
    var comboTag = document.createElement('div');
    comboTag.className = 'combo-popup-badge';
    var html = 'COMBO x' + comboCount + '!';
    if (comboGold > 0) {
        html += ' <span style="display:inline-flex;align-items:center;gap:3px;margin-left:4px;color:#fffde7;">(+' + comboGold + ' <img src="assets/images_webp/ui/icon_glod.webp" style="width:14px;height:14px;vertical-align:middle;">)</span>';
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
        'font-size:' + (comboCount >= 4 ? '15px' : '12px') + ';line-height:16px;' +
        'padding:4px 12px;border-radius:16px;color:#fff;background:' + bg + ';' +
        'border:1.5px solid #fff;box-shadow:0 3px 8px rgba(0,0,0,.35);' +
        'left:' + (rect.left + rect.width / 2) + 'px;top:' + (rect.top - 12) + 'px;';
    document.body.appendChild(comboTag);

    safeAnimate(comboTag, [
        { transform: 'translate(-50%, 0) scale(0.6)', opacity: 0 },
        { transform: 'translate(-50%, -14px) scale(1.2)', opacity: 1, offset: 0.25 },
        { transform: 'translate(-50%, -22px) scale(1)', opacity: 1, offset: 0.65 },
        { transform: 'translate(-50%, -38px) scale(0.95)', opacity: 0 }
    ], { duration: 800, easing: 'cubic-bezier(.17,.89,.32,1.25)' }, function () {
        comboTag.remove();
    });
}

// Âm thanh tiếng đồng xu vàng & kim cương theo phong cách Kalimba Sáng Trong (C6 -> A6: 1046.5Hz -> 1760Hz)
var COIN_CHIME_NOTES = [1046.50, 1174.66, 1318.51, 1567.98, 1760.00, 1975.53, 1760.00, 1567.98];
function playCoinChime(stepIdx) {
    try {
        if (SAVE.settings && !SAVE.settings.sound) return;
        initAudio();
        if (!audioCtx) return;
        var sfxCfg = getAudioSfxConfig();
        if (sfxCfg.sampleOverrides && sfxCfg.sampleOverrides.coin) {
            var sOv = sfxCfg.sampleOverrides.coin;
            var sUrl = (typeof sOv === 'string') ? sOv : sOv.url;
            var sRate = ((typeof sOv === 'object' && sOv.rate) ? sOv.rate : 1.0) * (1.0 + ((stepIdx || 0) % 6) * 0.06);
            if (playLibrarySample(sUrl, sRate, 0.85)) return;
        }
        if (sfxCfg.zzfxOverrides && Array.isArray(sfxCfg.zzfxOverrides.coin)) {
            if (playZzfxArray(sfxCfg.zzfxOverrides.coin)) return;
        }
        var now = audioCtx.currentTime;
        var cCfg = sfxCfg.coin || {};
        var masterVol = (typeof sfxCfg.masterVolume === 'number') ? sfxCfg.masterVolume : 1.15;
        var semiOffset = (typeof sfxCfg.pitchSemitoneOffset === 'number') ? sfxCfg.pitchSemitoneOffset : 0;
        var semiMul = Math.pow(2, semiOffset / 12);
        var freq = COIN_CHIME_NOTES[(stepIdx || 0) % COIN_CHIME_NOTES.length] * semiMul;
        var dur = cCfg.duration || 0.110;
        var peak = Math.max(0.001, (cCfg.gain || 0.10) * masterVol);

        var osc = audioCtx.createOscillator();
        var shimmerOsc = audioCtx.createOscillator();
        var filter = audioCtx.createBiquadFilter();
        var gain = audioCtx.createGain();
        var shimmerGain = audioCtx.createGain();

        osc.type = 'sine';
        shimmerOsc.type = 'triangle';
        osc.frequency.setValueAtTime(freq * 0.90, now);
        osc.frequency.exponentialRampToValueAtTime(freq, now + 0.010);
        shimmerOsc.frequency.setValueAtTime(freq * (cCfg.shimmerRatio || 2.3), now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(cCfg.filterCutoff || 5200, now);

        gain.gain.setValueAtTime(0.0002, now);
        gain.gain.linearRampToValueAtTime(peak, now + 0.0025);
        gain.gain.exponentialRampToValueAtTime(0.0002, now + dur);

        shimmerGain.gain.setValueAtTime(0.0002, now);
        shimmerGain.gain.linearRampToValueAtTime(peak * 0.34, now + 0.002);
        shimmerGain.gain.exponentialRampToValueAtTime(0.0002, now + Math.min(0.045, dur * 0.5));

        osc.connect(filter);
        shimmerOsc.connect(shimmerGain);
        shimmerGain.connect(filter);
        filter.connect(gain);
        gain.connect(getAudioDestination());

        osc.start(now);
        shimmerOsc.start(now);
        osc.stop(now + dur + 0.012);
        shimmerOsc.stop(now + dur + 0.012);

        osc.onended = function () {
            try {
                osc.disconnect();
                shimmerOsc.disconnect();
                shimmerGain.disconnect();
                filter.disconnect();
                gain.disconnect();
            } catch (e) {}
        };
    } catch (e) {}
}

// Hiệu ứng mưa đồng Vàng (icon_glod.png), Kim Cương (icon_ruby.png) & Năng Lượng (icon_nangluong.png) kèm số tiền bay lần lượt lên thanh HUD
var _activeFlyingCurrencyCount = 0;

function spawnFlyingCurrency(sourceEl, type, amount) {
    if (!sourceEl || amount <= 0) return;

    // Khi Bot tự chơi hoặc khi đang có quá nhiều đồng bay trên màn hình (> 6):
    // Cập nhật UI ngay lập tức không tạo thêm DOM animation để duy trì ổn định 60 FPS
    var isBot = (typeof window !== 'undefined' && window.autoBotRunning);
    if (isBot || _activeFlyingCurrencyCount >= 6) {
        updateUIStats();
        return;
    }

    var targetBanner = document.getElementById(
        type === 'ruby' ? 'btn-gem-shop' : (type === 'energy' ? 'btn-refill-energy' : 'btn-coin-shop')
    );
    var srcRect = sourceEl.getBoundingClientRect();
    var startX = srcRect.left + srcRect.width / 2;
    var startY = srcRect.top + srcRect.height / 2;

    var endX = startX;
    var endY = 24;
    if (targetBanner) {
        var tgtRect = targetBanner.getBoundingClientRect();
        endX = tgtRect.left + tgtRect.width / 2;
        endY = tgtRect.top + tgtRect.height / 2;
    }

    var iconSrc = type === 'ruby'
        ? 'assets/images_webp/ui/icon_ruby.webp'
        : (type === 'energy' ? 'assets/images_webp/ui/icon_nangluong.webp' : 'assets/images_webp/ui/icon_glod.webp');
    var badgeColor = type === 'ruby' ? '#1e88e5' : (type === 'energy' ? '#2e7d32' : '#f57f17');

    // Chùm đồng xu / năng lượng bung tỏa rồi hút cong về HUD kiểu Flambé
    var count = type === 'ruby'
        ? Math.min(Math.max(1, amount), 3)
        : (type === 'energy' ? Math.min(Math.max(1, Math.ceil(amount / 8)), 4) : Math.min(Math.max(2, Math.round(amount / 15)), 4));

    var basePerPiece = Math.floor(amount / count);
    var remainder = amount - basePerPiece * count;

    for (let i = 0; i < count; i++) {
        let pieceVal = basePerPiece + (i === count - 1 ? remainder : 0);
        if (pieceVal <= 0) pieceVal = 1;

        _activeFlyingCurrencyCount++;
        setTimeout(() => {
            let coin = document.createElement('img');
            coin.src = iconSrc;
            coin.className = 'flying-currency';

            let angle = (i / Math.max(1, count)) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
            let burstRadius = 18 + Math.random() * 12;
            let burstX = Math.cos(angle) * burstRadius;
            let burstY = Math.sin(angle) * burstRadius;
            let sx = startX;
            let sy = startY;

            coin.style.left = sx + 'px';
            coin.style.top = sy + 'px';
            document.body.appendChild(coin);

            // Tạo số tiền (+X) bay lên lần lượt theo từng đồng xu
            let numTag = document.createElement('div');
            numTag.textContent = '+' + pieceVal;
            numTag.style.cssText = 'position:fixed;pointer-events:none;z-index:180001;font-family:"Baloo 2","Nunito",sans-serif;' +
                'font-weight:800;font-size:12px;line-height:16px;padding:0 4px;border-radius:4px;color:#fff;' +
                'background:' + badgeColor + ';box-shadow:0 2px 4px rgba(0,0,0,0.3);' +
                'left:' + (sx + burstX * 0.6) + 'px;top:' + (sy - 8) + 'px;';
            document.body.appendChild(numTag);

            safeAnimate(numTag, [
                { transform: 'translate(-50%, 0) scale(0.85)', opacity: 1 },
                { transform: 'translate(-50%, -28px) scale(1.06)', opacity: 0 }
            ], { duration: 460, easing: 'ease-out' }, function () {
                numTag.remove();
            });

            let dx = endX - sx;
            let dy = endY - sy;
            let arcX = dx * 0.42 + (i % 2 === 0 ? -24 : 24);
            let arcY = dy * 0.38 - 28;

            safeAnimate(coin, [
                { transform: 'translate(-50%, -50%) scale(0.45)', opacity: 1 },
                { transform: 'translate(calc(-50% + ' + burstX + 'px), calc(-50% + ' + burstY + 'px)) scale(1.14)', opacity: 1, offset: 0.22 },
                { transform: 'translate(calc(-50% + ' + arcX + 'px), calc(-50% + ' + arcY + 'px)) scale(1.06)', opacity: 1, offset: 0.56 },
                { transform: 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px)) scale(0.62)', opacity: 0 }
            ], { duration: 500, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }, function () {
                coin.remove();
                _activeFlyingCurrencyCount = Math.max(0, _activeFlyingCurrencyCount - 1);
                playCoinChime(i);
                if (targetBanner) {
                    safeAnimate(targetBanner, [
                        { transform: 'scale(1)' },
                        { transform: 'scale(1.14)' },
                        { transform: 'scale(1)' }
                    ], { duration: 150, easing: 'ease-out' });
                }
            });
        }, i * 55);
    }
}

function getItemImagePath(id) {
    if (!id) return '';
    if (id.indexOf('board_coin_lv') === 0) {
        return 'assets/images_webp/items/icon_coin_lv' + (parseInt(id.split('_lv')[1], 10) || 1) + '.webp';
    }
    if (id.indexOf('board_energy_lv') === 0) {
        return 'assets/images_webp/items/icon_nangluong_lv' + (parseInt(id.split('_lv')[1], 10) || 1) + '.webp';
    }
    return 'assets/images_webp/items/' + id + '.webp';
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

function applyElapsedEnergyRegen(showEffects) {
    var maxE = getMaxEnergy();
    var intervalSec = (typeof getEnergyRegenSec === 'function') ? getEnergyRegenSec() : ENERGY_REGEN_SEC;
    if (playerEnergy >= maxE) {
        regenSecLeft = intervalSec;
        if (typeof SAVE !== 'undefined' && SAVE) SAVE.lastEnergyTs = Date.now();
        return 0;
    }
    if (typeof calcIdleEnergyRegen !== 'function') return 0;
    var res = calcIdleEnergyRegen(playerEnergy, maxE);
    regenSecLeft = res.secLeft;
    if (res.added > 0) {
        playerEnergy = Math.min(maxE, playerEnergy + res.added);
        if (typeof SAVE !== 'undefined' && SAVE) SAVE.energy = playerEnergy;
        if (typeof saveGame === 'function') saveGame();
        if (typeof updateUIStats === 'function') updateUIStats();
        if (showEffects && energyUI) {
            energyUI.innerText = playerEnergy;
            safeAnimate(energyUI, [
                { transform: 'scale(1)' },
                { transform: 'scale(1.25)', color: '#ffb300' },
                { transform: 'scale(1)' }
            ], { duration: 320, easing: 'ease-out' });
        }
        var energyBanner = showEffects ? document.getElementById('btn-refill-energy') : null;
        if (energyBanner) {
            triggerParticleBurst(energyBanner, ['#fff700', '#ffd54f', '#ffeb3b', '#ffffff']);
            var icon = energyBanner.querySelector('.hud-stat-icon');
            if (icon) {
                safeAnimate(icon, [
                    { transform: 'scale(1)' },
                    { transform: 'scale(1.3) rotate(-10deg)' },
                    { transform: 'scale(1) rotate(0deg)' }
                ], { duration: 350, easing: 'cubic-bezier(.2,.85,.32,1.2)' });
            }
        }
    }
    return res.added;
}

function tickEnergyRegen() {
    applyElapsedEnergyRegen(true);
    if (typeof tickBoardBubbles === 'function') {
        tickBoardBubbles();
    }

    if (energyTimerUI) {
        energyTimerUI.style.display = 'none';
    }
}
setInterval(tickEnergyRegen, 1000);
if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', function () {
        if (!document.hidden) {
            applyElapsedEnergyRegen(false);
        }
    });
}

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
var tutNewGenTapped = false;

// =============================================================================
// HỆ THỐNG HOẠT ẢNH SPRITESHEET ĐA THÚ CƯNG (PET SPRITESHEET ANIMATIONS)
// =============================================================================
var PET_ANIMATION_CONFIGS = {
    'character01': {
        idle: {
            sheet: 'assets/images_webp/npc_sheets/golden_anim1.webp',
            frames: 20, frameW: 145, frameH: 229, cols: 5, rows: 4, fps: 8
        },
        action: {
            sheet: 'assets/images_webp/npc_sheets/golden_anim2.webp',
            frames: 20, frameW: 200, frameH: 205, cols: 5, rows: 4, fps: 8
        }
    },
    'character04': {
        idle: {
            sheet: 'assets/images_webp/npc_sheets/poodle_anim1.webp',
            frames: 24, frameW: 140, frameH: 200, cols: 5, rows: 5, fps: 8
        },
        action: {
            sheet: 'assets/images_webp/npc_sheets/poodle_anim2.webp',
            frames: 25, frameW: 140, frameH: 200, cols: 5, rows: 5, fps: 8
        }
    },
    'character03': {
        idle: {
            sheet: 'assets/images_webp/npc_sheets/bulldog_anim1.webp',
            frames: 24, frameW: 174, frameH: 205, cols: 5, rows: 5, fps: 8
        },
        action: {
            sheet: 'assets/images_webp/npc_sheets/bulldog_anim2.webp',
            frames: 25, frameW: 174, frameH: 205, cols: 5, rows: 5, fps: 8
        }
    },
    'character10': {
        idle: {
            sheet: 'assets/images_webp/npc_sheets/batu_anim1.webp',
            frames: 24, frameW: 200, frameH: 209, cols: 5, rows: 5, fps: 8
        },
        action: {
            sheet: 'assets/images_webp/npc_sheets/batu_anim2.webp',
            frames: 25, frameW: 200, frameH: 209, cols: 5, rows: 5, fps: 8
        }
    },
    'character07': {
        idle: {
            sheet: 'assets/images_webp/npc_sheets/meoanh_anim1.webp',
            frames: 24, frameW: 165, frameH: 189, cols: 5, rows: 5, fps: 8
        },
        action: {
            sheet: 'assets/images_webp/npc_sheets/meoanh_anim2.webp',
            frames: 25, frameW: 165, frameH: 189, cols: 5, rows: 5, fps: 8
        }
    },
    'character06': {
        idle: {
            sheet: 'assets/images_webp/npc_sheets/meoxiem_anim1.webp',
            frames: 24, frameW: 143, frameH: 220, cols: 5, rows: 5, fps: 8
        },
        action: {
            sheet: 'assets/images_webp/npc_sheets/meoxiem_anim2.webp',
            frames: 25, frameW: 143, frameH: 220, cols: 5, rows: 5, fps: 8
        }
    }
};

var _petSheetImages = {};
function getPetSheetImage(url) {
    if (!_petSheetImages[url]) {
        var img = new Image();
        img.src = url;
        _petSheetImages[url] = img;
    }
    return _petSheetImages[url];
}

// Khởi tạo và kích hoạt tải trước các file sheet WebP
if (typeof window !== 'undefined') {
    Object.keys(PET_ANIMATION_CONFIGS).forEach(function (k) {
        var c = PET_ANIMATION_CONFIGS[k];
        if (c.idle) getPetSheetImage(c.idle.sheet);
        if (c.action) getPetSheetImage(c.action.sheet);
    });
}

// Tạo phần tử hiển thị thú cưng: Canvas hoạt ảnh mượt nếu có sheet, hoặc Thẻ Img tĩnh nếu chưa có
function createPetAvatarElement(petId, petName, defaultImgSrc) {
    var animCfg = PET_ANIMATION_CONFIGS[petId];
    if (!animCfg || !animCfg.idle) {
        var img = document.createElement('img');
        img.className = 'pet-group-avatar-img';
        img.src = defaultImgSrc || ('assets/images_webp/ui/' + (petId || 'character01') + '.webp');
        img.alt = petName || 'Bạn đồng hành';
        return {
            element: img,
            playAction: function () {}
        };
    }

    var canvas = document.createElement('canvas');
    canvas.className = 'pet-group-avatar-canvas';
    var defaultCfg = animCfg.idle;
    canvas.width = defaultCfg.frameW;
    canvas.height = defaultCfg.frameH;
    var ctx = canvas.getContext('2d');

    var currentAnimKey = 'idle';
    var currentCfg = animCfg.idle;
    var currentImg = getPetSheetImage(currentCfg.sheet);
    var currentFrame = 0;
    var lastTime = 0;
    var actionLoopsLeft = 0;
    var rafId = null;

    function render(time) {
        if (!canvas.isConnected) {
            if (rafId) cancelAnimationFrame(rafId);
            return;
        }

        rafId = requestAnimationFrame(render);
        var fps = currentCfg.fps || 12;
        if (time - lastTime < (1000 / fps)) return;
        lastTime = time;

        if (!currentImg.complete) return;

        var col = currentFrame % currentCfg.cols;
        var row = Math.floor(currentFrame / currentCfg.cols);
        var sx = col * currentCfg.frameW;
        var sy = row * currentCfg.frameH;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(currentImg, sx, sy, currentCfg.frameW, currentCfg.frameH, 0, 0, canvas.width, canvas.height);

        currentFrame++;
        if (currentFrame >= currentCfg.frames) {
            currentFrame = 0;
            if (currentAnimKey === 'action') {
                actionLoopsLeft--;
                if (actionLoopsLeft <= 0) {
                    currentAnimKey = 'idle';
                    currentCfg = animCfg.idle;
                    currentImg = getPetSheetImage(currentCfg.sheet);
                    canvas.width = currentCfg.frameW;
                    canvas.height = currentCfg.frameH;
                }
            }
        }
    }

    rafId = requestAnimationFrame(render);

    function playAction(loops) {
        // Chỉ diễn hoạt ảnh idle trên màn chơi theo yêu cầu của người chơi
        return;
    }

    return {
        element: canvas,
        playAction: playAction
    };
}

function updateCompanionAvatar() {
    var activeId = (typeof SAVE !== 'undefined' && SAVE && SAVE.activePet) ? SAVE.activePet : 'character01';
    var pet = (typeof PET_CHARACTERS !== 'undefined') ? PET_CHARACTERS.find(function (p) { return p.id === activeId; }) : null;
    var imgPath = pet ? pet.img : ('assets/images_webp/ui/' + activeId + '.webp');
    var petName = pet ? pet.name : 'Bạn đồng hành';
    var container = document.getElementById('npc-avatar-btn');
    if (container) {
        container.innerHTML = '';
        var av = createPetAvatarElement(activeId, petName, imgPath);
        container.appendChild(av.element);
    }
}
window.updateCompanionAvatar = updateCompanionAvatar;

// =============================================================================
// HỆ THỐNG THOẠI & ĐẶT ĐƠN ĐA THÚ CƯNG (MULTI-PET DIALOGUE & SPEECH)
// =============================================================================
var PET_DIALOGUES = {
    'character01': {
        name: 'Golden',
        sound: 'Gâu gâu!',
        requests: [
            'Gâu! Ông chủ ơi, chúng ta cần {item} để cắm trại nè!',
            'Gâu gâu! Hãy giúp em ghép một chiếc {item} nhé!',
            'Gâu! Có {item} mình sẽ cắm trại thật vui!'
        ],
        thanks: [
            'Gâu gâu! {item} tuyệt vời quá, thương ông chủ nhiều!',
            'Gâu! Có {item} rồi, khu trại ấm cúng hẳn lên!',
            'Gâu gâu! Ông chủ ghép đỉnh thật đấy!'
        ]
    },
    'character05': {
        name: 'Labrador',
        sound: 'Woof!',
        requests: [
            'Woof! Mình đánh hơi thấy {item} ở gần đây, tìm giúp mình với!',
            'Gâu! Đợt dã ngoại này không thể thiếu {item} được đâu!',
            'Woof woof! Mau ghép {item} để cùng mình khám phá rừng nào!'
        ],
        thanks: [
            'Woof! Đúng chiếc {item} mình cần rồi, cảm ơn bạn!',
            'Gâu gâu! {item} này xịn thật sự, tiếp tục nào!',
            'Tuyệt cú mèo! Có {item} rồi mình an tâm khám phá tiếp!'
        ]
    },
    'character04': {
        name: 'Poodle',
        sound: 'Áng áng!',
        requests: [
            'Áng áng! Cho em xin một phần {item} xinh xắn đi mà~',
            'Hihi, có {item} thì buổi cắm trại mới nên thơ chứ!',
            'Bạn ơi, ghép giúp bé {item} đáng yêu này nha!'
        ],
        thanks: [
            'Hihi sướng quá! Em mê {item} này nhất trần đời!',
            'Áng áng! Cảm ơn bạn, {item} xinh xẻo y như em vậy!',
            'Yêu bạn quá đi! Có {item} rồi em vui cả ngày luôn!'
        ]
    },
    'character03': {
        name: 'Bulldog',
        sound: 'Hực hực!',
        requests: [
            'Hực! Cần một chiếc {item} thật bền chắc để giữ trại an toàn!',
            'Gừm, chuẩn bị {item} kỹ lưỡng thì bão tuyết cũng không sợ!',
            'Tôi cần {item} cho ca trực bảo vệ đêm nay, giúp một tay nhé!'
        ],
        thanks: [
            'Hực hực! Tốt lắm, {item} rất kiên cố và chuẩn bài!',
            'Gâu! Trại của chúng ta giờ đã vững như bàn thạch!',
            'Rất đáng khen! {item} này chất lượng ngoài mong đợi!'
        ]
    },
    'character02': {
        name: 'Béc-giê',
        sound: 'Gâu!',
        requests: [
            'Gâu! Báo cáo: Khu trại đang cần bổ sung {item}!',
            'Kỷ luật là sức mạnh! Hãy hoàn thành {item} đúng tiến độ nhé!',
            'Gâu gâu! {item} là trang bị dã ngoại thiết yếu cho hành trình!'
        ],
        thanks: [
            'Tuyệt hảo! Đã bổ sung {item} vào quân trang khu trại!',
            'Nhiệm vụ hoàn thành xuất sắc! Tác phong rất chuyên nghiệp!',
            'Gâu! Cảm ơn đồng chí, {item} đã sẵn sàng cho chuyến đi!'
        ]
    },
    'character10': {
        name: 'Ba Tư',
        sound: 'Meo~',
        requests: [
            'Meo~ Ta muốn có {item} quý phái để nằm ngắm cảnh, mau làm đi~',
            'Purr... Có {item} sang trọng sẽ hợp với ta hơn!',
            'Này bạn, đừng để ta phải chờ {item} lâu quá đấy nhé~'
        ],
        thanks: [
            'Purr~ Khá lắm con sen, chiếc {item} này làm ta hài lòng!',
            'Meo meo~ Đồ tốt đấy, ta tạm thời công nhận tài nghệ của bạn!',
            'Hừm, chiếc {item} này cũng vừa ý ta rồi đó~'
        ]
    },
    'character09': {
        name: 'Maine Coon',
        sound: 'Ngoao!',
        requests: [
            'Ngoao! Cần {item} thật xịn cho tiệc dã ngoại!',
            'Gừ... Khám phá thiên nhiên Việt Nam phải có {item} mới đã!',
            'Ngoao ngoao! Ghép {item} to nhất cho ta nào!'
        ],
        thanks: [
            'Ngoao! Quá đã! {item} chất lừ, ta ưng cái bụng rồi đó!',
            'Hahaha! Có {item} này thì chấp cả bão tuyết luôn!',
            'Tuyệt vời! Ta sẽ cùng {item} này chinh phục mọi đỉnh núi!'
        ]
    },
    'character08': {
        name: 'Ragdoll',
        sound: 'Meo meo...',
        requests: [
            'Meo meo... Có {item} để mình cuộn tròn ngủ trưa không bạn ơi?',
            'Ưm... Ở đây hơi lạnh, có {item} thì ấm áp biết mấy~',
            'Cho bé xin {item} nhé, bé hứa sẽ ngoan mà~'
        ],
        thanks: [
            'Ngoan ngoan~ {item} mềm thích quá, cho bé dụi đầu miếng nha!',
            'Meo meo! Ấm áp quá rồi, cảm ơn bạn tốt bụng!',
            'Purr... Giờ bé có thể ngủ một giấc thật ngon cùng {item} rồi!'
        ]
    },
    'character10': {
        idle: {
            sheet: 'assets/images_webp/npc_sheets/batu_anim1.webp',
            frames: 24, frameW: 200, frameH: 209, cols: 5, rows: 5, fps: 8
        },
        action: {
            sheet: 'assets/images_webp/npc_sheets/batu_anim2.webp',
            frames: 25, frameW: 200, frameH: 209, cols: 5, rows: 5, fps: 8
        }
    },
    'character07': {
        name: 'Mèo Anh',
        sound: 'Meo!',
        requests: [
            'Meo! Một chút {item} ấm cúng cho buổi chiều cắm trại nào!',
            'Nắng đẹp thế này mà có {item} thì chill phải biết!',
            'Meo meo~ Ghép xong {item} mình cùng thưởng thức nhé!'
        ],
        thanks: [
            'Meo meo! Xong rồi, {item} xịn đét luôn!',
            'Chill thật đấy! Cảm ơn bạn vì món {item} tuyệt vời này!',
            'Meo! Đời cắm trại thế này thì bão tuyết mấy năm cũng chịu!'
        ]
    },
    'character06': {
        name: 'Xiêm',
        sound: 'Meow!',
        requests: [
            'Meow! Nhanh tay ghép {item} nào, ta đang háo hức khám phá đây!',
            'Món {item} này sẽ là chìa khóa cho điểm đến tiếp theo đó!',
            'Nhanh lên nào bạn ơi, ta vừa phát hiện chỗ dùng {item} cực hay!'
        ],
        thanks: [
            'Meow! Tuyệt cú mèo! {item} đến vừa đúng lúc luôn!',
            'Cực kỳ nhanh nhẹn! Tiến lên điểm đến tiếp theo thôi!',
            'Meow meow! Có {item} rồi, lên đường thôi ông chủ!'
        ]
    }
};

function getPetOrderDialogue(orderId, petId) {
    var pId = petId || (typeof SAVE !== 'undefined' && SAVE && SAVE.activePet) || 'character01';
    var petData = PET_DIALOGUES[pId] || PET_DIALOGUES['character01'];
    var soundPrefix = (petData && petData.sound) ? (petData.sound + ' ') : '';

    if (typeof ITEM_STORY_DIALOGUES !== 'undefined' && orderId && ITEM_STORY_DIALOGUES[orderId]) {
        var baseStory = ITEM_STORY_DIALOGUES[orderId];
        // Nếu người chơi chọn thú cưng khác Golden, xen kẽ câu thoại mang đậm cá tính thú cưng (45%) và câu dẫn vật phẩm kèm tiếng kêu (55%)
        if (pId !== 'character01' && Math.random() < 0.45 && petData && Array.isArray(petData.requests) && petData.requests.length) {
            var itemName = (typeof getItemDisplayName === 'function') ? getItemDisplayName(orderId) : 'vật phẩm';
            return petData.requests[Math.floor(Math.random() * petData.requests.length)].replace('{item}', itemName);
        }
        if (baseStory.indexOf(petData.sound) === 0) return baseStory;
        return soundPrefix + baseStory;
    }

    var fallbackName = (typeof getItemDisplayName === 'function') ? getItemDisplayName(orderId) : 'vật phẩm';
    var reqs = petData.requests;
    var raw = reqs[Math.floor(Math.random() * reqs.length)];
    return raw.replace('{item}', fallbackName);
}
window.getPetOrderDialogue = getPetOrderDialogue;

function getPetThankDialogue(petId, orderId) {
    var pId = petId || (typeof SAVE !== 'undefined' && SAVE && SAVE.activePet) || 'character01';
    var petData = PET_DIALOGUES[pId] || PET_DIALOGUES['character01'];
    var itemName = (typeof getItemDisplayName === 'function') ? getItemDisplayName(orderId) : 'món đồ';
    var thks = petData.thanks;
    var raw = thks[Math.floor(Math.random() * thks.length)];
    return raw.replace('{item}', itemName);
}
window.getPetThankDialogue = getPetThankDialogue;

function setPetSpeech(petId, speechText, autoHideMs, options) {
    var pId = petId || (typeof SAVE !== 'undefined' && SAVE && SAVE.activePet) || 'character01';
    var pet = (typeof PET_CHARACTERS !== 'undefined') ? PET_CHARACTERS.find(function (p) { return p.id === pId; }) : null;

    // Tìm phần tử avatar của con vật tương ứng trên màn hình để đặt bong bóng lên đúng trên đầu
    var groupEl = document.querySelector('.pet-order-group[data-pet-id="' + pId + '"]');
    var targetWrap = groupEl ? groupEl.querySelector('.pet-group-avatar-wrap') : null;
    if (!targetWrap) {
        targetWrap = document.querySelector('.pet-group-avatar-wrap') || document.getElementById('npc-avatar-btn');
    }

    if (npcBubbleTimer) {
        clearTimeout(npcBubbleTimer);
        npcBubbleTimer = null;
    }
    if (document.getElementById('modal-overlay')) {
        hideNpcBubble();
        return;
    }

    if (!npcSpeechBubble) npcSpeechBubble = document.getElementById('npc-speech-bubble');
    if (!npcSpeechText) npcSpeechText = document.getElementById('npc-speech-text');

    var allowFullText = !!(options && options.noTruncate);
    var isGuide = !!(options && options.isGuide);
    if (speechText && typeof speechText === 'string') {
        speechText = speechText.trim();
        // Giới hạn cứng câu thoại tối đa 80 ký tự (riêng câu hướng dẫn chạm item giữ trọn đủ ý)
        var maxLen = allowFullText ? 140 : 80;
        if (speechText.length > maxLen) {
            speechText = speechText.slice(0, maxLen - 3).trim() + '...';
        }
    }

    if (speechText && npcSpeechBubble && npcSpeechText) {
        npcSpeechText.textContent = speechText;
        npcSpeechBubble.classList.toggle('is-item-guide', isGuide);
        // Luôn giữ bong bóng thoại cố định trong #scene-right-column để không bị nhảy vị trí hay bị xóa khi renderOrders()
        var rightCol = document.getElementById('scene-right-column');
        if (rightCol && npcSpeechBubble.parentNode !== rightCol) {
            rightCol.appendChild(npcSpeechBubble);
        }
        npcSpeechBubble.style.display = 'flex';

        // Tắt talking trên các con vật khác, chỉ bật cho con vật đang nói
        document.querySelectorAll('.pet-group-avatar-wrap.talking').forEach(function (el) {
            el.classList.remove('talking');
        });
        if (targetWrap) {
            targetWrap.classList.add('talking');
        }

        if (autoHideMs && autoHideMs > 0) {
            npcBubbleTimer = setTimeout(hideNpcBubble, autoHideMs);
        }
    } else {
        hideNpcBubble();
    }
}
window.setPetSpeech = setPetSpeech;

function getNpcById(npcId) {
    return (typeof NPC_CHARACTERS !== 'undefined' && NPC_CHARACTERS[npcId])
        ? NPC_CHARACTERS[npcId]
        : { id: 'gau', name: 'Cắm Trại Viên', avatar: 'assets/images_webp/ui/character01.webp' };
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
    if (old) {
        try {
            var anims = old.getAnimations ? old.getAnimations() : [];
            for (var i = 0; i < anims.length; i++) {
                if (anims[i] && anims[i].cancel) anims[i].cancel();
            }
        } catch (e) {}
        old.remove();
    }
    document.querySelectorAll('.hint-pulse').forEach(function (el) {
        if (!el.classList.contains('cell')) el.classList.remove('hint-pulse');
    });
}

function showTutorialHandTap(targetEl, targetType) {
    clearTutorialHand();
    if (!targetEl) return;
    var rect = targetEl.getBoundingClientRect();
    if (!rect.width) return;
    var hand = document.createElement('div');
    hand.id = 'tutorial-hand';
    if (targetType) hand._targetType = targetType;
    var img = document.createElement('img');
    img.src = 'assets/images_webp/ui/icon_hand.webp';
    img.alt = '';
    img.className = 'tutorial-hand-img';
    hand.appendChild(img);
    hand.style.left = (rect.left + rect.width * 0.5) + 'px';
    hand.style.top = (rect.top + rect.height * 0.5) + 'px';
    document.body.appendChild(hand);
    hand.animate([
        { transform: 'translate(-25%, -20%) scale(1)' },
        { transform: 'translate(-25%, -34%) scale(0.9)' },
        { transform: 'translate(-25%, -20%) scale(1)' }
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
    var img = document.createElement('img');
    img.src = 'assets/images_webp/ui/icon_hand.webp';
    img.alt = '';
    img.className = 'tutorial-hand-img';
    hand.appendChild(img);
    hand.style.left = (r1.left + r1.width * 0.5) + 'px';
    hand.style.top = (r1.top + r1.height * 0.5) + 'px';
    document.body.appendChild(hand);
    hand.animate([
        { transform: 'translate(-25%, -20%) scale(1)', opacity: 0.95 },
        { transform: 'translate(calc(-25% + ' + dx + 'px), calc(-20% + ' + dy + 'px)) scale(0.94)', opacity: 1 },
        { transform: 'translate(calc(-25% + ' + dx + 'px), calc(-20% + ' + dy + 'px)) scale(0.88)', opacity: 0 }
    ], { duration: 1350, iterations: Infinity, easing: 'ease-in-out' });
}

function setNpcState(npcId, moodEmoji, speechText, autoHideMs) {
    var pId = (typeof SAVE !== 'undefined' && SAVE && SAVE.activePet) ? SAVE.activePet : 'character01';
    setPetSpeech(pId, speechText, autoHideMs);
}

function hideNpcBubble() {
    if (npcBubbleTimer) {
        clearTimeout(npcBubbleTimer);
        npcBubbleTimer = null;
    }
    if (npcSpeechBubble) {
        npcSpeechBubble.style.display = 'none';
        npcSpeechBubble.classList.remove('is-item-guide');
    }
    document.querySelectorAll('.pet-group-avatar-wrap.talking').forEach(function (el) {
        el.classList.remove('talking');
    });
    if (npcAvatarBtn) npcAvatarBtn.classList.remove('talking');
}

function buildOrderItemGuideSpeech(itemId) {
    if (!itemId) return '';
    var lv = (typeof itemLv === 'function') ? itemLv(itemId) : (parseInt(String(itemId).split('_lv')[1], 10) || 1);
    var ln = (typeof itemLine === 'function') ? itemLine(itemId) : String(itemId).split('_lv')[0];
    var cleanName = '';
    if (typeof I18N !== 'undefined' && typeof I18N.getItemName === 'function') {
        cleanName = I18N.getItemName(itemId);
    } else if (typeof getItemCleanName === 'function') {
        cleanName = getItemCleanName(itemId);
    } else if (typeof getItemDisplayName === 'function') {
        cleanName = getItemDisplayName(itemId).replace(/\s*\(Lv\.\d+\)\s*$/, '');
    } else {
        cleanName = itemId;
    }

    var genId = (typeof getGeneratorForLine === 'function')
        ? getGeneratorForLine(ln)
        : ((typeof getChainGenerator === 'function') ? getChainGenerator(ln).id : 'generator_cooler');
    var genName = (typeof I18N !== 'undefined' && typeof I18N.getItemName === 'function')
        ? I18N.getItemName(genId)
        : ((typeof getChainGenerator === 'function') ? getChainGenerator(ln).name : genId);

    if (typeof I18N !== 'undefined' && typeof I18N.t === 'function') {
        var msg = I18N.t('npc.item_guide', { name: cleanName, lv: lv, gen: genName });
        if (msg && msg !== 'npc.item_guide') return msg;
    }
    return 'Món này là ' + cleanName + ' (Level ' + lv + '), nằm trong ' + genName + ' nhé!';
}

function highlightGeneratorForOrderItem(itemId) {
    if (!itemId) return;
    var ln = (typeof itemLine === 'function') ? itemLine(itemId) : String(itemId).split('_lv')[0];
    var genId = (typeof getGeneratorForLine === 'function')
        ? getGeneratorForLine(ln)
        : ((typeof getChainGenerator === 'function') ? getChainGenerator(ln).id : null);
    if (!genId) return;

    clearHintVisuals();
    document.querySelectorAll('.pending-gen-slot.hint-pulse').forEach(function (el) {
        el.classList.remove('hint-pulse');
    });
    if (Array.isArray(boardData) && boardElement) {
        var genIdx = boardData.findIndex(function (c) {
            return c && c.id === genId && !c.isRock && !c.isLocked;
        });
        if (genIdx !== -1 && boardElement.children[genIdx]) {
            boardElement.children[genIdx].classList.add('hint-pulse');
            return;
        }
    }
    var pendingDockSlot = document.querySelector('.pending-gen-slot[data-gen-id="' + genId + '"]');
    if (pendingDockSlot) {
        pendingDockSlot.classList.add('hint-pulse');
    }
}

function clearHintVisuals() {
    clearTutorialHand();
    document.querySelectorAll('.pending-gen-slot.hint-pulse').forEach(function (el) {
        el.classList.remove('hint-pulse');
    });
    if (!boardElement) return;
    boardElement.querySelectorAll('.hint-pulse').forEach(c => c.classList.remove('hint-pulse'));
}

// =============================================================================
// HỆ THỐNG KỊCH BẢN CỐT TRUYỆN MỖI LEVEL (LEVEL STORY SEQUENCES)
// Hỗ trợ hiển thị chuỗi câu thoại chú chó dẫn dắt từng bước mở đầu màn chơi
// =============================================================================
var storySequenceTimer = null;
var storyStepIndex = 0;

function advanceStoryStep() {
    if (storySequenceTimer) {
        clearTimeout(storySequenceTimer);
        storySequenceTimer = null;
    }
    var dlg = (typeof LEVEL_STORY_DIALOGUES !== 'undefined') ? LEVEL_STORY_DIALOGUES[currentLevel] : null;
    var texts = (dlg && Array.isArray(dlg.texts) && dlg.texts.length) ? dlg.texts : (dlg && dlg.text ? [dlg.text] : []);
    var nextStep = storyStepIndex + 1;
    if (nextStep < texts.length) {
        showStoryStep(nextStep, texts, dlg);
    } else {
        storyStepIndex = 999;
        scheduleHint();
    }
}

function showStoryStep(step, texts, dlg) {
    storyStepIndex = step;
    var text = texts[step];
    var isLast = (step === texts.length - 1);

    if (isLast && currentLevel <= 10 && !tutNewGenTapped) {
        // Câu cuối hướng dẫn chạm nguồn phát: hiển thị bàn tay chỉ vào nguồn phát
        var genIdx = boardData.findIndex(function (c) {
            return c && GENERATORS[c.id] && !c.isLocked && !c.isRock;
        });
        if (genIdx !== -1 && boardElement.children[genIdx]) {
            var genCell = boardElement.children[genIdx];
            genCell.classList.add('hint-pulse');
            showTutorialHandTap(genCell);
        }
        setNpcState((dlg && dlg.npc) || 'gau', '', text, 0);
    } else {
        // Tự động chuyển câu thoại tiếp theo sau 3.8s hoặc khi người chơi chạm vào bong bóng thoại
        var autoHide = isLast ? 5500 : 3800;
        setNpcState((dlg && dlg.npc) || 'gau', '', text, autoHide);
        if (!isLast) {
            storySequenceTimer = setTimeout(function () {
                advanceStoryStep();
            }, 3800);
        }
    }
}

function playLevelStory(lvNum) {
    if (typeof LEVEL_STORY_DIALOGUES === 'undefined') return false;
    var dlg = LEVEL_STORY_DIALOGUES[lvNum];
    if (!dlg) return false;
    var texts = (dlg && Array.isArray(dlg.texts) && dlg.texts.length) ? dlg.texts : (dlg && dlg.text ? [dlg.text] : []);
    if (!texts.length) return false;

    clearHintVisuals();
    showStoryStep(0, texts, dlg);
    return true;
}

function updateEarlyLevelsTutorial() {
    if (currentLevel > 10 || levelWon || isAutoEnabled || document.getElementById('modal-overlay')) return false;

    // Nếu đang trong chuỗi câu thoại mở đầu (chưa tới câu cuối hướng dẫn thùng), không ngắt ngang
    var dlg = (typeof LEVEL_STORY_DIALOGUES !== 'undefined') ? LEVEL_STORY_DIALOGUES[currentLevel] : null;
    var texts = (dlg && Array.isArray(dlg.texts) && dlg.texts.length) ? dlg.texts : [];
    if (texts.length > 1 && storyStepIndex < texts.length - 1) {
        return true;
    }

    // Cấu hình hướng dẫn cho 10 level đầu:
    // - Lv 1..3: Làm quen Xe Kéo (generator_cooler)
    // - Lv 4..6: Mở Ba Lô Dã Ngoại (generator_backpack)
    // - Lv 7..9: Mở Thùng Bếp & Sinh Tồn (generator_crate)
    var targetGenMap = {
        1: { id: 'generator_cooler', npc: 'gau', emoji: '', key: 'intro_lv1', text: 'Chạm vào xe kéo để lấy đồ cắm trại và ghép hoàn thành nhiệm vụ bạn nhé.' },
        2: { id: 'generator_cooler', npc: 'gau', emoji: '', key: 'intro_lv2', text: 'Chạm Xe Kéo để ghép bàn gỗ và ghế tựa êm ái nào!' },
        3: { id: 'generator_cooler', npc: 'gau', emoji: '', key: 'intro_lv3', text: 'Chạm Xe Kéo dựng thêm bạt che lớn và lều trại ấm áp nhé!' },
        4: { id: 'generator_backpack', npc: 'cao', emoji: '', key: 'intro_lv4', text: 'Chạm Ba Lô để lấy bánh mì và pha cà phê ấm nóng nào!' },
        5: { id: 'generator_backpack', npc: 'cao', emoji: '', key: 'intro_lv5', text: 'Mở Ba Lô chuẩn bị búa cắm cọc và làm bữa ăn no nê bạn nhé!' },
        6: { id: 'generator_backpack', npc: 'cao', emoji: '', key: 'intro_lv6', text: 'Mở Ba Lô pha bình cà phê nóng và lấy đèn pin đi dạo thôi!' },
        7: { id: 'generator_crate', npc: 'de', emoji: '', key: 'intro_lv7', text: 'Chạm Thùng Đồ lấy thảm trải cỏ và bật bếp lửa sưởi ấm nhé!' },
        8: { id: 'generator_crate', npc: 'de', emoji: '', key: 'intro_lv8', text: 'Mở Thùng Đồ chuẩn bị bếp nướng và hộp sơ cứu phòng thân nhé!' },
        9: { id: 'generator_crate', npc: 'de', emoji: '', key: 'intro_lv9', text: 'Mở Thùng Đồ nhóm ngọn lửa trại rực rỡ cho đêm tiệc đáng nhớ nhé!' },
        10: { id: 'generator_cooler', npc: 'gau', emoji: '', key: 'intro_lv10', text: 'Hội tụ 3 nguồn phát! Chạm thùng để làm nhiệm vụ!' }
    };

    var cfg = targetGenMap[currentLevel];
    if (!cfg) return false;

    // Ở Level 1: Sau khi đã chạm nguồn phát ít nhất 1 lần, tiếp tục hướng dẫn bàn tay ghép đồ và nộp đơn (không tự bật bong bóng thoại)
    if (currentLevel === 1) {
        // Bước 3: Hướng dẫn nộp đơn ở lần đầu tiên có đơn hàng hoàn thành
        var readyCard = ordersContainer ? ordersContainer.querySelector('.order-card.ready') : null;
        if (readyCard && !tutDeliveredOnce) {
            showTutorialHandTap(readyCard);
            return true;
        }

        // Bước 2: Hướng dẫn kéo ghép ở lần ghép đầu tiên (tutMergeCount === 0)
        var best = findBestMerge(boardData, currentOrders, currentLevelCfg);
        if (best && tutMergeCount === 0 && tutNewGenTapped) {
            var cFrom = boardElement.children[best.from];
            var cTo = boardElement.children[best.to];
            if (cFrom) cFrom.classList.add('hint-pulse');
            if (cTo) cTo.classList.add('hint-pulse');
            showTutorialHandDrag(cFrom, cTo);
            return true;
        }
    }

    // Hướng dẫn bàn tay chỉ vào thùng sinh đồ của màn (khi người chơi chưa bấm vào thùng)
    if (!tutNewGenTapped) {
        var genIdx = -1;
        boardData.forEach((c, idx) => {
            if (genIdx === -1 && c && c.id === cfg.id && !c.isLocked) {
                genIdx = idx;
            }
        });
        if (genIdx !== -1 && boardElement.children[genIdx]) {
            var genCell = boardElement.children[genIdx];
            genCell.classList.add('hint-pulse');
            showTutorialHandTap(genCell);
            return true;
        }
    }

    return false;
}

// Hướng dẫn người chơi chạm nút GIAO khi đã ghép xong đơn hàng
// hoặc bấm vào nút "Trại của bạn" khi đã sở hữu Lều cắm trại Lv.4 (không tự động mở bong bóng thoại)
function updateOrderActionTutorials() {
    if (levelWon || document.getElementById('modal-overlay') || dragState) return false;
    
    // 1. Ưu tiên: Nút Giao đơn hàng (khi đã đủ món trong khay đơn hàng)
    var deliverBtn = ordersContainer ? ordersContainer.querySelector('.btn-group-deliver') : null;
    if (deliverBtn) {
        var hand = document.getElementById('tutorial-hand');
        if (!hand || hand._targetType !== 'deliver') {
            showTutorialHandTap(deliverBtn, 'deliver');
            deliverBtn.classList.add('hint-pulse');
        }
        return true;
    }

    // Nếu không còn nút Giao nào mà bàn tay đang chỉ vào deliver -> xóa bàn tay
    var handEl = document.getElementById('tutorial-hand');
    if (handEl && handEl._targetType === 'deliver') {
        clearTutorialHand();
    }

    // 2. Hướng dẫn vào "Trại của bạn" khi đã sở hữu Lều Lv.4
    return checkAndShowTentLv4Hint();
}

function checkAndShowTentLv4Hint() {
    if (levelWon || document.getElementById('modal-overlay') || dragState) return false;
    if (typeof SAVE === 'undefined' || !SAVE || SAVE.tutTentLv4Seen) return false;

    var myCampScreen = document.getElementById('my-camp-screen');
    if (myCampScreen && myCampScreen.style.display !== 'none') {
        SAVE.tutTentLv4Seen = true;
        if (typeof saveGame === 'function') saveGame();
        return false;
    }

    // Kiểm tra người chơi đã sở hữu lều Lv.4 trở lên chưa:
    var hasTentLv4 = false;
    if (boardData && Array.isArray(boardData)) {
        hasTentLv4 = boardData.some(function (c) {
            return c && c.id && !c.isRock && c.id.indexOf('trai_lv') === 0 && (parseInt(c.id.split('_lv')[1], 10) >= 4);
        });
    }
    if (!hasTentLv4 && SAVE.discovered) {
        for (var k in SAVE.discovered) {
            if (k.indexOf('trai_lv') === 0 && parseInt(k.split('_lv')[1], 10) >= 4) {
                hasTentLv4 = true;
                break;
            }
        }
    }
    if (!hasTentLv4 && Array.isArray(SAVE.campItems)) {
        hasTentLv4 = SAVE.campItems.some(function (it) {
            return it && it.id && it.id.indexOf('trai_lv') === 0 && (parseInt(it.id.split('_lv')[1], 10) >= 4);
        });
    }

    if (!hasTentLv4) return false;

    var myCampBtn = document.getElementById('btn-my-camp');
    if (!myCampBtn) return false;

    var hand = document.getElementById('tutorial-hand');
    if (!hand || hand._targetType !== 'mycamp') {
        showTutorialHandTap(myCampBtn, 'mycamp');
        myCampBtn.classList.add('hint-pulse');
    }

    return true;
}

function scheduleHint() {
    clearHintVisuals();
    if (hintTimer) clearTimeout(hintTimer);
    if (levelWon || document.getElementById('modal-overlay')) {
        hideNpcBubble();
        return;
    }

    // Hiển thị bàn tay hướng dẫn giao đơn / mở Trại của bạn hoặc 3 level đầu (không tự hiện bong bóng thoại)
    if (!updateOrderActionTutorials() && currentLevel <= 3) {
        updateEarlyLevelsTutorial();
    }

    // Chỉ sau 10 giây (HINT_DELAY_MS = 10000) người chơi không tương tác với màn hình mới hiện bong bóng thoại NPC
    hintTimer = setTimeout(function () {
        showIdleHint(false);
    }, HINT_DELAY_MS);
}

function buildCharacterHintText(npcId, actionType, itemName) {
    if (typeof I18N !== 'undefined') {
        if (actionType === 'deliver') return I18N.t('npc.deliver_ready');
        if (actionType === 'merge_web') return I18N.t('npc.merge_web', { item: itemName });
        if (actionType === 'merge_free') return I18N.t('npc.merge_free', { item: itemName });
        if (actionType === 'spawn') return I18N.t('npc.spawn_prompt');
    }
    if (actionType === 'deliver') {
        return 'Xong đơn! Chạm NỘP nhận Vàng nhé!';
    }
    if (actionType === 'merge_web') {
        return 'Kéo ' + itemName + ' vào ô Nhện nhé!';
    }
    if (actionType === 'merge_free') {
        return 'Ghép 2 ' + itemName + ' để giao đơn nhé!';
    }
    if (actionType === 'spawn') {
        return 'Chạm Nguồn phát để lấy thêm đồ nhé!';
    }
    return '';
}

function showIdleHint(isManualClick) {
    if (levelWon || dragState || document.getElementById('modal-overlay')) return;
    var myCampScreen = document.getElementById('my-camp-screen');
    if (myCampScreen && myCampScreen.style.display !== 'none') return;

    clearHintVisuals();

    var liveGrp = (typeof SAVE !== 'undefined' && SAVE && Array.isArray(SAVE.petOrderGroups) && SAVE.petOrderGroups[0])
        ? SAVE.petOrderGroups[0]
        : null;
    var activePetId = (liveGrp && liveGrp.petId) || ((typeof SAVE !== 'undefined' && SAVE && SAVE.activePet) ? SAVE.activePet : 'character01');
    var slot1Id = (liveGrp && Array.isArray(liveGrp.orders) && liveGrp.orders[0]) ? liveGrp.orders[0].id : 'ban_lv2';
    var storyQuote = (liveGrp && liveGrp.contextDialogue)
        ? liveGrp.contextDialogue
        : ((typeof getPetOrderDialogue === 'function') ? getPetOrderDialogue(slot1Id, activePetId) : '');

    var deliverBtn = ordersContainer ? ordersContainer.querySelector('.btn-group-deliver') : null;
    if (deliverBtn) {
        showTutorialHandTap(deliverBtn, 'deliver');
        deliverBtn.classList.add('hint-pulse');
        setPetSpeech(activePetId, storyQuote || 'Ghép xong rồi! Chạm nút GIAO nhận thưởng và mở đất nhé!', 4500);
        return;
    }

    var best = findBestMerge(boardData, currentOrders, currentLevelCfg);
    if (best) {
        var cFrom = boardElement.children[best.from];
        var cTo = boardElement.children[best.to];
        if (cFrom) cFrom.classList.add('hint-pulse');
        if (cTo) cTo.classList.add('hint-pulse');
        setPetSpeech(activePetId, storyQuote, 4500);
        return;
    }

    var empties = getEmptyIndexes(boardData);
    if (playerEnergy > 0 && empties.length > 0) {
        boardData.forEach((c, idx) => {
            if (c && GENERATORS[c.id] && !c.isLocked && !c.isRock && boardElement.children[idx]) {
                boardElement.children[idx].classList.add('hint-pulse');
            }
        });
        setPetSpeech(activePetId, storyQuote, 4500);
        return;
    }

    if (playerEnergy <= 0) {
        var outEnergyMsg = (typeof I18N !== 'undefined') ? I18N.t('npc.out_of_energy') : 'Hết năng lượng! Hãy nạp thêm nhé!';
        setPetSpeech(activePetId, outEnergyMsg, 4000);
        return;
    }
    if (empties.length === 0) {
        var boardFullMsg = (typeof I18N !== 'undefined') ? I18N.t('npc.board_full_sell') : 'Bàn cờ đầy! Chọn đồ rồi bấm BÁN nhé!';
        setPetSpeech(activePetId, boardFullMsg, 4000);
    }
}

// ==========================================
// TẢI LEVEL & VẼ BÀN CỜ (CÓ LƯU & KHÔI PHỤC TRẠNG THÁI ĐANG CHƠI)
// ==========================================
// TẢI & LƯU BÀN CỜ DUY NHẤT VĨNH VIỄN (MODEL B: PERSISTENT BOARD + EXP LEVEL)
// - Bàn cờ giữ nguyên 100% đồ thừa, không bao giờ bị dọn sạch.
// - Tiến trình được ghi nhận liên tục qua Cấp Độ Người Chơi (SAVE.playerLevel) & EXP (SAVE.playerExp).
// ==========================================
function persistCurrentBoardState() {
    if (boardData && boardData.length) {
        var pLv = (typeof SAVE !== 'undefined' && SAVE.playerLevel) ? SAVE.playerLevel : (currentLevel || 1);
        var requiredLayoutVersion = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.initialBoard && GAME_CONFIG.initialBoard.layoutVersion) || 3;
        SAVE.persistentBoard = {
            layoutVersion: requiredLayoutVersion,
            boardData: boardData.map(function (c) {
                return c ? {
                    id: c.id,
                    isRock: !!c.isRock,
                    isLocked: !!c.isLocked,
                    isBubble: !!c.isBubble,
                    bubbleExpiresAt: c.bubbleExpiresAt || null,
                    isSurprise: !!c.isSurprise,
                    rockLayer: c.rockLayer,
                    isGeneratorRock: !!c.isGeneratorRock
                } : makeEmptyCell();
            }),
            activeOrders: (currentOrders || []).map(function (o) {
                return {
                    id: o.id,
                    done: false,
                    gold: o.gold || ((typeof orderReward === 'function') ? orderReward(o.id) : 50),
                    exp: o.exp || ((typeof orderExp === 'function') ? orderExp(o.id) : 15)
                };
            }),
            savedAt: Date.now()
        };
        SAVE.currentBoardState = SAVE.persistentBoard;
        SAVE.level = pLv;
        SAVE.playerLevel = pLv;
    }
    saveGame();
}

function loadLevel(lvNum, options) {
    options = options || {};
    closeModal();
    clearHintVisuals();
    hideNpcBubble();
    updateCompanionAvatar();

    var pLv = (typeof SAVE !== 'undefined' && SAVE.playerLevel) ? SAVE.playerLevel : (parseInt(lvNum, 10) || 1);
    currentLevel = pLv;
    SAVE.level = pLv;
    SAVE.playerLevel = pLv;
    currentLevelCfg = getLevelConfig(1);

    if (typeof updateActiveLocationBackground === 'function') {
        updateActiveLocationBackground();
    }

    levelClicks = 0;
    levelUnwantedClicks = 0;
    tutMergeCount = 0;
    tutDeliveredOnce = false;
    tutNewGenTapped = false;
    levelIntroShown = false;
    levelWon = false;
    selectedIndex = null;
    updateSellButton(null);

    // Phục hồi bàn cờ duy nhất từ localStorage
    var requiredLayoutVersion = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.initialBoard && GAME_CONFIG.initialBoard.layoutVersion) || 3;
    var hasPersistent = !options.forceReset &&
        SAVE.persistentBoard &&
        SAVE.persistentBoard.layoutVersion === requiredLayoutVersion &&
        Array.isArray(SAVE.persistentBoard.boardData) &&
        SAVE.persistentBoard.boardData.length === TOTAL_CELLS;

    if (hasPersistent) {
        var nowLoadTs = Date.now();
        boardData = SAVE.persistentBoard.boardData.map(function (c) {
            if (!c) return makeEmptyCell();
            if (c.isBubble && c.bubbleExpiresAt && nowLoadTs >= c.bubbleExpiresAt) {
                return makeEmptyCell();
            }
            return {
                id: c.id,
                isRock: !!c.isRock,
                isLocked: !!c.isLocked,
                isBubble: !!c.isBubble,
                bubbleExpiresAt: c.bubbleExpiresAt || null,
                isSurprise: !!c.isSurprise,
                rockLayer: c.rockLayer,
                isGeneratorRock: !!c.isGeneratorRock
            };
        });

        // Nạp danh sách đơn hàng cho thú cưng trước để đồng bộ máy phát theo đơn
        if (typeof ensurePetOrderGroups === 'function') {
            ensurePetOrderGroups(SAVE.playerLevel || currentLevel || 1);
        }
        syncCurrentOrdersFromGroups();

        if (typeof checkAndUnlockGeneratorsByMilestone === 'function') {
            checkAndUnlockGeneratorsByMilestone(boardData);
        }
        if (typeof ensureAllGeneratorsOnBoard === 'function') {
            ensureAllGeneratorsOnBoard(boardData, currentOrders);
        }
        if (typeof populateRockHiddenItems === 'function') {
            populateRockHiddenItems(boardData);
        }
        persistCurrentBoardState();
    } else {
        // Khởi tạo bàn cờ xuất phát từ cấu hình ban đầu
        var baseLevelCfg = getLevelConfig(1);
        boardData = buildBoard(baseLevelCfg);

        if (typeof ensurePetOrderGroups === 'function') {
            ensurePetOrderGroups(SAVE.playerLevel || currentLevel || 1);
        }
        syncCurrentOrdersFromGroups();

        if (typeof checkAndUnlockGeneratorsByMilestone === 'function') {
            checkAndUnlockGeneratorsByMilestone(boardData);
        }
        if (typeof ensureAllGeneratorsOnBoard === 'function') {
            ensureAllGeneratorsOnBoard(boardData, currentOrders);
        }
        if (typeof populateRockHiddenItems === 'function') {
            populateRockHiddenItems(boardData);
        }

        persistCurrentBoardState();
    }

    if (isAutoEnabled) {
        fillBoardInstantly();
    }

    renderBoard();
    updateUIStats();
    levelIntroShown = true;
}

// Khởi tạo nhẹ bàn cờ khi bắt đầu màn mới:
// - Lv.1 -> Lv.4 (bàn 5x5 nhỏ) đã có sẵn các món freeItems mồi ngay cạnh mạng nhện nên không rải thêm đồ ngẫu nhiên.
// - Lv.5 -> Lv.10: rải 1 cặp (2 món Lv.1) ưu tiên đúng dòng sản phẩm nằm trong đơn hàng.
// - Lv.11+: rải tối đa 2 cặp (4 món Lv.1) ưu tiên đúng các dòng sản phẩm nằm trong đơn hàng của màn chơi.
function populateInitialBoardItems() {
    if (currentLevel <= 4) return;

    var generators = [];
    boardData.forEach((c, idx) => {
        if (c && GENERATORS[c.id] && !c.isLocked && !c.isRock) generators.push(idx);
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
    if (isLevelCompleted()) return;
    var generators = [];
    boardData.forEach((c, idx) => {
        if (c && GENERATORS[c.id] && !c.isLocked && !c.isRock) generators.push(idx);
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
    if (!boardElement) return;
    // 1. Nếu boardElement chưa có đủ 63 ô (lần đầu tải), khởi tạo khung 63 ô cố định một lần duy nhất
    if (boardElement.children.length !== TOTAL_CELLS) {
        boardElement.innerHTML = '';
        for (var i = 0; i < TOTAL_CELLS; i++) {
            var isLight = ((Math.floor(i / COLS) + (i % COLS)) % 2 === 1);
            var newCell = document.createElement('div');
            newCell.className = 'cell ' + (isLight ? 'bg-empty-light' : 'bg-empty');
            newCell.dataset.index = i;
            boardElement.appendChild(newCell);
        }
    }

    // 2. Tìm các ô trên bàn cờ đáp ứng tối đa 4 đơn hàng đang hiển thị (chưa hoàn thành)
    var activeOrderMap = {};
    if (currentOrders) {
        var visibleOrders = (typeof getVisibleOrders === 'function')
            ? getVisibleOrders(currentOrders)
            : currentOrders.filter(o => !o.done).slice(0, 4);
        visibleOrders.forEach(o => {
            if (!o.done && !o.stashed) activeOrderMap[o.id] = (activeOrderMap[o.id] || 0) + 1;
        });
    }
    var readyCellIndexes = new Set();
    boardData.forEach((c, idx) => {
        if (c && c.id && !c.isLocked && !c.isRock && !c.isBubble && !GENERATORS[c.id] && activeOrderMap[c.id] > 0) {
            readyCellIndexes.add(idx);
            activeOrderMap[c.id]--;
        }
    });

    var isDoneLevel = isLevelCompleted();

    // 3. Tối ưu hóa DOM Reuse: Cập nhật tại chỗ (In-place patch) từng ô mà không phá hủy/tạo lại DOM
    for (var i = 0; i < TOTAL_CELLS; i++) {
        var cell = boardElement.children[i];
        var itemData = boardData[i];

        // Nền cờ vua xen kẽ mặc định lớp dưới cùng (board_cell_empty & board_cell_empty_light)
        var isLight = ((Math.floor(i / COLS) + (i % COLS)) % 2 === 1);
        var baseCheckerClass = isLight ? 'bg-empty-light' : 'bg-empty';

        // Xác định class nền ô đá nếu là ô đá (nằm đè lên nền cờ vua)
        var pLvForRock = (typeof SAVE !== 'undefined' && SAVE && typeof SAVE.playerLevel === 'number')
            ? SAVE.playerLevel
            : (currentLevel || 1);
        var rockLockLv = (itemData && itemData.isRock && typeof isRockCellLockedByLevel === 'function' && isRockCellLockedByLevel(i, itemData, pLvForRock))
            ? getRockUnlockLevel(i, itemData)
            : 0;

        var rockClass = '';
        if (itemData && itemData.isRock) {
            var rVar = (typeof getRockCellVariant === 'function')
                ? getRockCellVariant(i, itemData)
                : (((i * 7 + 11) % 6) + 1);
            rockClass = (rockLockLv > 0)
                ? ('bg-rock-lock bg-rock-lock-' + rVar)
                : ('bg-rock bg-rock-' + rVar);
        }

        var isSelected = (selectedIndex === i);
        var isReady = readyCellIndexes.has(i);
        var isLocked = !!(itemData && itemData.isLocked);
        var isBubble = !!(itemData && itemData.isBubble);
        var isGen = !!(itemData && itemData.id && GENERATORS[itemData.id] && !itemData.isRock);
        if (isGen) {
            isLocked = false;
            if (itemData) {
                itemData.isLocked = false;
            }
        }

        var targetClass = 'cell ' + baseCheckerClass +
            (rockClass ? (' ' + rockClass) : '') +
            (isSelected ? ' selected' : '') +
            (isReady ? ' order-ready-item' : '') +
            (isLocked ? ' locked' : '') +
            (isBubble ? ' has-bubble' : '') +
            (isGen ? ' generator-wrapper' : '') +
            (isGen && isDoneLevel ? ' generator-done' : '');

        if (cell.className !== targetClass) {
            cell.className = targetClass;
        }

        // Cập nhật nội dung bên trong ô
        if (!itemData || !itemData.id || itemData.isRock) {
            if (cell.firstElementChild) {
                cell.innerHTML = '';
            }
        } else {
            // Đảm bảo có img.item-img
            var img = cell.querySelector('.item-img');
            var targetSrc = getItemImagePath(itemData.id);
            if (!img) {
                img = document.createElement('img');
                img.className = 'item-img';
                img.draggable = false;
                img.dataset.id = itemData.id;
                img.dataset.index = i;
                img.src = targetSrc;
                cell.appendChild(img);
            } else {
                if (img.getAttribute('src') !== targetSrc) {
                    img.src = targetSrc;
                }
                img.dataset.id = itemData.id;
                img.dataset.index = i;
                if (img.style.visibility) img.style.visibility = '';
            }

            // Mạng nhện khóa ô (Tuyệt đối không bao giờ phủ mạng nhện lên nguồn phát)
            var web = cell.querySelector('.web-overlay');
            if (isLocked && !isGen) {
                if (!web) {
                    web = document.createElement('img');
                    web.src = 'assets/images_webp/board/board_cell_web.webp';
                    web.className = 'web-overlay';
                    cell.appendChild(web);
                }
            } else {
                if (web) web.remove();
            }

            // Bong bóng vật phẩm bay lơ lửng nhẹ (không hiện số đếm lùi trên ô)
            var bbl = cell.querySelector('.bubble-overlay');
            var bblTimer = cell.querySelector('.bubble-timer');
            if (bblTimer) bblTimer.remove();
            if (isBubble) {
                if (!bbl) {
                    bbl = document.createElement('img');
                    bbl.src = 'assets/images_webp/items/icon_bongbong.webp';
                    bbl.className = 'bubble-overlay';
                    bbl.alt = '';
                    cell.appendChild(bbl);
                }
            } else {
                if (bbl) bbl.remove();
            }
            var oldStarBadge = cell.querySelector('.surprise-star-badge');
            if (oldStarBadge) oldStarBadge.remove();

            // Dấu tích xanh icon_check.png sẵn sàng nộp đơn (đẩy ra góc ảnh, tuyệt đối không gắn lên bong bóng)
            var chk = cell.querySelector('.board-item-ready-tick');
            if (isReady && !isLocked && !isBubble) {
                if (!chk) {
                    chk = document.createElement('img');
                    chk.className = 'board-item-ready-tick';
                    chk.src = 'assets/images_webp/ui/icon_check.webp';
                    chk.alt = '✓';
                    cell.appendChild(chk);
                }
            } else if (chk) {
                chk.remove();
            }

            // Máy sinh đồ (ngôi sao lấp lánh & huy hiệu năng lượng)
            var star1 = cell.querySelector('.sparkle-star');
            var energyBadge = cell.querySelector('.generator-energy-badge');
            if (isGen && !isLocked) {
                if (!star1) {
                    for (var s = 0; s < 3; s++) {
                        var star = document.createElement('div');
                        star.className = 'sparkle-star star-' + (s + 1);
                        cell.appendChild(star);
                    }
                }
                if (!energyBadge) {
                    energyBadge = document.createElement('img');
                    energyBadge.src = 'assets/images_webp/board/icon_nangluong_tao.webp';
                    energyBadge.className = 'generator-energy-badge';
                    energyBadge.alt = 'Năng lượng';
                    cell.appendChild(energyBadge);
                }
                if (isDoneLevel) {
                    if (energyBadge.style.opacity !== '0.25') {
                        energyBadge.style.opacity = '0.25';
                        energyBadge.style.animation = 'none';
                    }
                } else {
                    if (energyBadge.style.opacity === '0.25') {
                        energyBadge.style.opacity = '';
                        energyBadge.style.animation = '';
                    }
                }
            } else {
                if (star1) {
                    cell.querySelectorAll('.sparkle-star').forEach(s => s.remove());
                }
                if (energyBadge) {
                    energyBadge.remove();
                }
            }
        }

        // Dọn sạch nút bán cũ trên từng ô nếu còn tồn tại trong DOM
        var oldFloatingSellBtn = cell.querySelector('.cell-floating-sell-btn');
        if (oldFloatingSellBtn) {
            oldFloatingSellBtn.remove();
        }
    }

    // Đồng bộ nút Bán cố định ở giữa bàn chơi, cách hệ 3 nút Cửa hàng/Cẩm nang/Trại của bạn 80px
    if (selectedIndex !== null && boardData[selectedIndex]) {
        var selItem = boardData[selectedIndex];
        if (selItem && selItem.id && !selItem.isRock && !selItem.isLocked && !selItem.isBubble && !GENERATORS[selItem.id]) {
            updateSellButton(selItem.id);
        } else {
            updateSellButton(null);
        }
    } else {
        updateSellButton(null);
    }

    // Ghi nhận khám phá sổ tay âm thầm qua chấm đỏ #book-badge, không bắn Toast gây chồng popup khi đang ghép đồ
    scanBoardForDiscoveries(boardData);
    updateBookBadge();
    renderOrders();
    updateUIStats();
    scheduleHint();
    cleanOrphanedFx();
    if (typeof VISUAL_FX !== 'undefined' && VISUAL_FX.syncBoardItemGlows) {
        VISUAL_FX.syncBoardItemGlows();
    }
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

    if (!cRect.width || !petRect.width || (typeof window !== 'undefined' && window.autoBotRunning)) {
        if (onComplete) onComplete();
        return;
    }

    // Tạo bản sao của thẻ nhiệm vụ bay vút từ vị trí hiện tại sang chú chó
    var flyer = cardEl.cloneNode(true);
    flyer.classList.add('order-card-flying-away');

    // Dọn các badge con không cần thiết
    var badges = flyer.querySelectorAll('.order-deliver-btn, .board-item-ready-tick, .order-ready-badge, .floating-badge');
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

    // Chờ 150ms để người chơi kịp thấy hiệu ứng hoàn thành trước khi bay sang chú chó
    setTimeout(function () {
        safeAnimate(flyer, [
            { transform: 'translate(0, 0) scale(1) rotate(0deg)', opacity: 1 },
            { transform: 'translate(' + (dx * 0.45) + 'px, ' + (dy * 0.45 - 26) + 'px) scale(0.92) rotate(-12deg)', opacity: 0.95, offset: 0.45 },
            { transform: 'translate(' + dx + 'px, ' + dy + 'px) scale(0.12) rotate(-26deg)', opacity: 0, offset: 1 }
        ], {
            duration: 480,
            easing: 'cubic-bezier(.22, .85, .36, 1)'
        }, function () {
            if (flyer.parentNode) flyer.remove();

            // Chú chó mừng rỡ đón nhận nhiệm vụ
            safeAnimate(petEl, [
                { transform: 'scale(1) translateY(0)' },
                { transform: 'scale(1.22, 0.82) translateY(6px)', offset: 0.2 },
                { transform: 'scale(0.88, 1.18) translateY(-14px)', offset: 0.48 },
                { transform: 'scale(1.06, 0.96) translateY(-3px)', offset: 0.75 },
                { transform: 'scale(1) translateY(0)', offset: 1 }
            ], { duration: 460, easing: 'cubic-bezier(.175, .885, .32, 1.275)' });

            triggerParticleBurst(petEl, ['#ff6b81', '#ffd166', '#a8e6cf', '#2ecc71', '#ffffff']);
            var cardPetId = (cardEl && cardEl.dataset && cardEl.dataset.petId) ? cardEl.dataset.petId : ((typeof SAVE !== 'undefined' && SAVE) ? SAVE.activePet : 'character01');
            var petData = (typeof PET_DIALOGUES !== 'undefined' && PET_DIALOGUES[cardPetId]) ? PET_DIALOGUES[cardPetId] : null;
            var cheerMsg = petData ? (petData.sound + ' Cảm ơn bạn!') : 'Gâu! Cảm ơn bạn!';
            showFloatingBadge(petEl, cheerMsg, '#2e7d32');

            if (onComplete) onComplete();
        });
    }, 150);
}

// Hàm giao đơn hàng kèm hiệu ứng vật phẩm bay từ bàn cờ lên ô nhiệm vụ và bắn tiền thưởng ra
function deliverReadyOrderWithFlight(orderObj, boardCellIdx, targetCardEl) {
    if (!orderObj || orderObj.done) return;

    // Tự động tìm lại ô chứa item trên bàn cờ nếu ô truyền vào không khớp (do người chơi di chuyển hoặc thao tác nhanh)
    if (boardCellIdx === -1 || !boardData[boardCellIdx] || boardData[boardCellIdx].id !== orderObj.id || boardData[boardCellIdx].isLocked || boardData[boardCellIdx].isRock || boardData[boardCellIdx].isBubble) {
        boardCellIdx = findOrderMatch(boardData, orderObj.id);
        if (boardCellIdx === -1) return;
    }

    // Tự động tìm lại thẻ nhiệm vụ tương ứng nếu targetCardEl bị thiếu hoặc không còn gắn trong DOM
    if (!targetCardEl || !document.body.contains(targetCardEl)) {
        targetCardEl = ordersContainer && (
            ordersContainer.querySelector('.order-card[data-order-id="' + orderObj.id + '"]:not(.done)') ||
            ordersContainer.querySelector('.order-card.ready')
        );
    }

    orderObj.done = true;
    tutDeliveredOnce = true;

    var cellEl = boardElement && boardElement.children[boardCellIdx];
    var cellImg = cellEl && cellEl.querySelector('.item-img');
    var itemId = boardData[boardCellIdx].id;
    var rw = (typeof orderReward === 'function') ? orderReward(itemId) : 50;

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
        var oldBadge = cellEl.querySelector('.board-item-ready-tick, .order-ready-badge');
        if (oldBadge) oldBadge.remove();
        cellEl.classList.remove('order-ready-item');

        var dx = (tgtRect.left + tgtRect.width * 0.5) - (srcRect.left + srcRect.width * 0.5);
        var dy = (tgtRect.top + tgtRect.height * 0.5) - (srcRect.top + srcRect.height * 0.5);

        var onDeliveryAnimFinish = function () {
            if (flyingItem && flyingItem.parentNode) flyingItem.remove();
            playerCoins += rw;
            spawnFlyingCurrency(targetCardEl, 'gold', rw);

            // Thưởng EXP cho người chơi và kiểm tra Lên Cấp
            var expGain = (orderObj && orderObj.exp) || ((typeof orderExp === 'function') ? orderExp(itemId) : 15);
            if (typeof addPlayerExp === 'function') {
                addPlayerExp(expGain, function (newLevel) {
                    setTimeout(function () {
                        triggerLevelUp(newLevel);
                    }, 650);
                });
            }

            playSound('win');
            updateUIStats();
            selectedIndex = null;
            updateSellButton(null);

            // Nổ hiệu ứng ngôi sao hoàn thành tại thẻ nhiệm vụ
            triggerParticleBurst(targetCardEl, ['#2ecc71', '#a8e6cf', '#ffd54f', '#ffffff']);
            showFloatingBadge(targetCardEl, '+' + rw + ' Vàng | +' + expGain + ' XP', '#2e7d32');

            // Bê vật phẩm nhiệm vụ đã hoàn thành vào Khu cắm trại
            if (typeof addCampItem === 'function') {
                addCampItem(itemId);
            }

            if (isAutoEnabled) fillBoardInstantly();

            // Thẻ nhiệm vụ hoàn thành bay sang thú cưng rồi đổi sang đơn hàng mới ngay lập tức
            flyCompletedOrderToPet(targetCardEl, function () {
                if (typeof recordOrderDelivered === 'function') {
                    recordOrderDelivered(itemId);
                }
                var oIdx = currentOrders.indexOf(orderObj);
                if (oIdx !== -1) {
                    var existingIds = currentOrders.filter(function (o) { return o !== orderObj; }).map(function (o) { return o.id; });
                    var existingPetIds = currentOrders.filter(function (o) { return o !== orderObj && o.petId; }).map(function (o) { return o.petId; });
                    var tierHint = oIdx === 0 ? 'easy' : (oIdx === 1 ? 'medium' : 'hard');
                    var hist = (typeof SAVE !== 'undefined' && Array.isArray(SAVE.recentOrdersHistory)) ? SAVE.recentOrdersHistory : [];
                    currentOrders[oIdx] = (typeof generateContinuousOrder === 'function')
                        ? generateContinuousOrder(SAVE.playerLevel || 1, existingIds, tierHint, itemId, hist, existingPetIds)
                        : { id: 'ghe_lv2', done: false, gold: 48, exp: 15, petId: 'character01' };
                }
                persistCurrentBoardState();
                renderOrders();
                renderBoard();
                checkAutoDeliverRevealedOrders();
            });
        };

        if (typeof window !== 'undefined' && window.autoBotRunning) {
            onDeliveryAnimFinish();
        } else {
            safeAnimate(flyingItem, [
                { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                { transform: 'translate(' + (dx * 0.4) + 'px, ' + (dy * 0.4 - 24) + 'px) scale(1.25)', opacity: 1, offset: 0.5 },
                { transform: 'translate(' + dx + 'px, ' + dy + 'px) scale(0.65)', opacity: 0.8 }
            ], { duration: 420, easing: 'cubic-bezier(.2,.85,.32,1.15)' }, onDeliveryAnimFinish);
        }
    } else {
        boardData[boardCellIdx] = makeEmptyCell();
        playerCoins += rw;
        if (targetCardEl) spawnFlyingCurrency(targetCardEl, 'gold', rw);

        var expGainFallback = (orderObj && orderObj.exp) || ((typeof orderExp === 'function') ? orderExp(itemId) : 15);
        if (typeof addPlayerExp === 'function') {
            addPlayerExp(expGainFallback, function (newLevel) {
                setTimeout(function () {
                    triggerLevelUp(newLevel);
                }, 650);
            });
        }

        playSound('win');
        updateUIStats();
        selectedIndex = null;
        updateSellButton(null);

        if (typeof addCampItem === 'function') {
            addCampItem(itemId);
        }

        if (isAutoEnabled) fillBoardInstantly();

        var onDoneOrder = function () {
            if (typeof recordOrderDelivered === 'function') {
                recordOrderDelivered(itemId);
            }
            var oIdx = currentOrders.indexOf(orderObj);
            if (oIdx !== -1) {
                var existingIds = currentOrders.filter(function (o) { return o !== orderObj; }).map(function (o) { return o.id; });
                var existingPetIds = currentOrders.filter(function (o) { return o !== orderObj && o.petId; }).map(function (o) { return o.petId; });
                var tierHint = oIdx === 0 ? 'easy' : (oIdx === 1 ? 'medium' : 'hard');
                var hist = (typeof SAVE !== 'undefined' && Array.isArray(SAVE.recentOrdersHistory)) ? SAVE.recentOrdersHistory : [];
                currentOrders[oIdx] = (typeof generateContinuousOrder === 'function')
                    ? generateContinuousOrder(SAVE.playerLevel || 1, existingIds, tierHint, itemId, hist, existingPetIds)
                    : { id: 'ghe_lv2', done: false, gold: 48, exp: 15, petId: 'character01' };
            }
            persistCurrentBoardState();
            renderOrders();
            renderBoard();
            checkAutoDeliverRevealedOrders();
        };

        if (targetCardEl) {
            flyCompletedOrderToPet(targetCardEl, onDoneOrder);
        } else {
            onDoneOrder();
        }
    }
}

// Cập nhật lại giao diện đơn hàng & bàn cờ khi có sự kiện mới (người chơi chủ động bấm nút NỘP để giao)
function checkAutoDeliverRevealedOrders() {
    if (levelWon || !currentOrders || !ordersContainer) return;
    renderOrders();
    renderBoard();
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
            if (!c || !c.id || c.isRock || c.isLocked || c.isBubble || GENERATORS[c.id]) return;
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

    var pLv = (typeof SAVE !== 'undefined' && SAVE.playerLevel) ? SAVE.playerLevel : (currentLevel || 1);
    var pExp = (typeof SAVE !== 'undefined' && SAVE.playerExp) ? SAVE.playerExp : 0;
    var expNeeded = (typeof getExpRequiredForLevel === 'function') ? getExpRequiredForLevel(pLv) : 50;
    var progPct = Math.min(100, Math.floor((pExp / expNeeded) * 100));

    if (currentLvBadgeUI) {
        var numEl = currentLvBadgeUI.querySelector('.lv-map-num');
        if (numEl) numEl.innerText = pLv;
        else currentLvBadgeUI.innerText = pLv;
        currentLvBadgeUI.style.setProperty('--lv-prog', progPct);
    }

    SAVE.coins = playerCoins;
    SAVE.gems = playerGems;
    SAVE.energy = playerEnergy;
    SAVE.level = pLv;
    SAVE.playerLevel = pLv;
    saveGame();
}

// ==========================================
// ĐỒNG BỘ ĐƠN HÀNG THEO NHÓM THÚ CƯNG (PET ORDER GROUPS)
// ==========================================
function syncCurrentOrdersFromGroups() {
    if (typeof ensurePetOrderGroups === 'function') {
        ensurePetOrderGroups(SAVE.playerLevel || 1);
    }
    var flat = [];
    if (SAVE && Array.isArray(SAVE.petOrderGroups)) {
        SAVE.petOrderGroups.forEach(function (group, gIdx) {
            if (group && Array.isArray(group.orders)) {
                group.orders.forEach(function (o, oIdx) {
                    o.petId = group.petId;
                    o.groupIdx = gIdx;
                    o.orderIdx = oIdx;
                    flat.push(o);
                });
            }
        });
    }
    currentOrders = flat;
    return currentOrders;
}

// Hiệu ứng vật phẩm bay từ bàn cờ lên khay đơn hàng (khi double-click hoặc chạm ô)
function flyItemToTraySlot(fromCellIdx, targetSlotEl, onFinish) {
    if (fromCellIdx === -1 || !boardData[fromCellIdx] || !boardData[fromCellIdx].id || boardData[fromCellIdx].isRock || boardData[fromCellIdx].isLocked || boardData[fromCellIdx].isBubble) {
        if (onFinish) onFinish();
        return;
    }

    var consumedItemId = boardData[fromCellIdx].id;
    // Xóa item trên bàn cờ ngay lập tức để chắc chắn vật phẩm được thu hồi khỏi bàn chơi
    boardData[fromCellIdx] = makeEmptyCell();
    if (selectedIndex === fromCellIdx) {
        selectedIndex = null;
        updateSellButton(null);
    }

    var cellEl = boardElement && boardElement.children[fromCellIdx];
    var cellImg = cellEl && cellEl.querySelector('.item-img');
    if (!cellEl || !cellImg || !targetSlotEl || (typeof window !== 'undefined' && window.autoBotRunning)) {
        if (cellEl) {
            if (cellImg) cellImg.style.visibility = 'hidden';
            var bdg = cellEl.querySelector('.board-item-ready-tick');
            if (bdg) bdg.remove();
            cellEl.classList.remove('order-ready-item');
        }
        if (onFinish) onFinish();
        return;
    }

    var srcRect = cellEl.getBoundingClientRect();
    var tgtRect = targetSlotEl.getBoundingClientRect();

    var flyer = document.createElement('img');
    flyer.src = cellImg.src || getItemImagePath(consumedItemId);
    flyer.style.cssText = 'position:fixed;pointer-events:none;z-index:180020;' +
        'width:' + (srcRect.width * 0.85) + 'px;height:' + (srcRect.height * 0.85) + 'px;' +
        'left:' + (srcRect.left + srcRect.width * 0.075) + 'px;top:' + (srcRect.top + srcRect.height * 0.075) + 'px;' +
        'filter:drop-shadow(0 0 10px #2ecc71);transition:none;';
    document.body.appendChild(flyer);

    cellImg.style.visibility = 'hidden';
    var oldBadge = cellEl.querySelector('.board-item-ready-tick');
    if (oldBadge) oldBadge.remove();
    cellEl.classList.remove('order-ready-item');

    var dx = (tgtRect.left + tgtRect.width * 0.5) - (srcRect.left + srcRect.width * 0.5);
    var dy = (tgtRect.top + tgtRect.height * 0.5) - (srcRect.top + srcRect.height * 0.5);

    safeAnimate(flyer, [
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
        { transform: 'translate(' + (dx * 0.45) + 'px, ' + (dy * 0.45 - 28) + 'px) scale(1.22)', opacity: 1, offset: 0.5 },
        { transform: 'translate(' + dx + 'px, ' + dy + 'px) scale(0.85)', opacity: 0.95 }
    ], { duration: 380, easing: 'cubic-bezier(.2,.85,.32,1.15)' }, function () {
        if (flyer.parentNode) flyer.remove();
        triggerParticleBurst(targetSlotEl, ['#2ecc71', '#a8e6cf', '#ffd54f', '#ffffff']);
        if (onFinish) onFinish();
    });

    playSound('spawn');
}

// Xử lý Double Click / Double Tap vào ô chứa vật phẩm hoàn thành trên bàn cờ
function handleCellDoubleClick(cellIdx, cellEl) {
    if (cellIdx < 0 || cellIdx >= TOTAL_CELLS) return false;
    var cellData = boardData[cellIdx];
    if (!cellData || !cellData.id || cellData.isRock || cellData.isLocked || cellData.isBubble || GENERATORS[cellData.id]) return false;

    if (typeof isBoardCurrencyItem === 'function' && isBoardCurrencyItem(cellData.id)) {
        collectBoardCurrencyAtIndex(cellIdx);
        return true;
    }

    if (!SAVE || !Array.isArray(SAVE.petOrderGroups)) return false;
    var targetGroup = null;
    var targetOrder = null;

    for (var gi = 0; gi < SAVE.petOrderGroups.length; gi++) {
        var g = SAVE.petOrderGroups[gi];
        if (!g || !Array.isArray(g.orders)) continue;
        for (var oi = 0; oi < g.orders.length; oi++) {
            var o = g.orders[oi];
            if (o && o.id === cellData.id && !o.stashed) {
                targetGroup = g;
                targetOrder = o;
                break;
            }
        }
        if (targetOrder) break;
    }

    if (!targetOrder) return false;

    var slotEl = document.querySelector('.tray-item-slot[data-order-id="' + targetOrder.id + '"]:not(.stashed)');
    if (!slotEl) slotEl = document.querySelector('.tray-item-slot[data-order-id="' + targetOrder.id + '"]');

    targetOrder.stashed = true;
    targetOrder.stashedVerified = true;
    flyItemToTraySlot(cellIdx, slotEl, function () {
        persistCurrentBoardState();
        renderOrders();
        renderBoard();
    });

    return true;
}

// Giao toàn bộ nhóm nhiệm vụ của 1 thú cưng khi đủ điều kiện
function deliverPetOrderGroup(groupIdx) {
    if (!SAVE || !Array.isArray(SAVE.petOrderGroups) || !SAVE.petOrderGroups[groupIdx]) return;
    var group = SAVE.petOrderGroups[groupIdx];
    // Chống tuyệt đối lỗi giao trùng lặp cùng 1 nhóm nhiệm vụ nhiều lần khi bấm nhanh hoặc chạy Auto-Bot
    if (!group || group._isDelivering) return;
    group._isDelivering = true;

    clearTutorialHand();
    document.querySelectorAll('.btn-group-deliver').forEach(function (btn) {
        btn.classList.remove('hint-pulse');
        btn.disabled = true;
    });
    var groupEls = document.querySelectorAll('.pet-order-group');
    var trayEl = groupEls[groupIdx];

    // 1. Nếu có món nào chưa stashed mà đang có trên bàn cờ, cho bay lên khay trước
    var unstashed = group.orders.filter(function (o) { return !o.stashed; });
    var pendingFlights = 0;
    var allLaunched = false;
    var finishCalled = false;

    var completeGroupTransition = function () {
        var currentIdx = SAVE.petOrderGroups.indexOf(group);
        if (currentIdx !== -1) {
            SAVE.petOrderGroups.splice(currentIdx, 1);
        }
        // Xuất hiện nhóm nhiệm vụ mới lần lượt
        ensurePetOrderGroups(SAVE.playerLevel || 1);
        syncCurrentOrdersFromGroups();

        // Kiểm tra và giải phóng máy phát nếu đạt mốc đơn hàng (Đơn 7 mở Ba Lô, Đơn 10 mở Thùng Chứa)
        if (typeof checkAndUnlockGeneratorsByMilestone === 'function') {
            var unlocked = checkAndUnlockGeneratorsByMilestone(boardData);
            if (Array.isArray(unlocked) && unlocked.length > 0) {
                unlocked.forEach(function (genId) {
                    var genIdx = boardData.findIndex(function (c) { return c && c.id === genId; });
                    var genName = (genId === 'generator_backpack') ? 'Ba Lô Dã Ngoại' : ((genId === 'generator_crate') ? 'Thùng Bếp & Sinh Tồn' : 'Máy Phát Mới');
                    if (genIdx !== -1 && boardElement && boardElement.children[genIdx]) {
                        var rCell = boardElement.children[genIdx];
                        triggerParticleBurst(rCell, ['#ffd700', '#ffeb3b', '#e91e63', '#00e676', '#00b0ff', '#ffffff']);
                        showFloatingBadge(rCell, '🎉 ĐÃ MỞ KHÓA ' + genName.toUpperCase() + '! 🎉', '#e67e22');
                    }
                    if (typeof showToast === 'function') {
                        showToast('🎉 Đã mở khóa ' + genName + '! Sẵn sàng nhận nhiệm vụ mới!', 4000);
                    }
                });
            }
        }
        if (typeof ensureAllGeneratorsOnBoard === 'function') {
            ensureAllGeneratorsOnBoard(boardData, currentOrders);
        }
        if (typeof populateRockHiddenItems === 'function') {
            populateRockHiddenItems(boardData);
        }
        persistCurrentBoardState();
        renderOrders();
        renderBoard();

        var nextActiveGroup = (SAVE && Array.isArray(SAVE.petOrderGroups) && SAVE.petOrderGroups[0]) ? SAVE.petOrderGroups[0] : null;
        if (nextActiveGroup && nextActiveGroup.isNewGenIntroGroup && nextActiveGroup.newGenId) {
            var introGenIdx = boardData.findIndex(function (c) {
                return c && c.id === nextActiveGroup.newGenId && !c.isRock && !c.isLocked;
            });
            if (introGenIdx !== -1 && boardElement && boardElement.children[introGenIdx]) {
                var introGenCell = boardElement.children[introGenIdx];
                introGenCell.classList.add('hint-pulse');
                triggerParticleBurst(introGenCell, ['#ffd700', '#00e676', '#ffeb3b', '#ffffff']);
                showFloatingBadge(introGenCell, '👇 Chạm lấy đồ mới!', '#e65100');
            }
        }
    };

    var finishDelivery = function () {
        var baseGroupGold = 0;
        var baseGroupExp = 0;

        group.orders.forEach(function (o) {
            var rw = (typeof orderReward === 'function') ? orderReward(o.id) : 50;
            var ex = (typeof orderExp === 'function') ? orderExp(o.id) : 15;
            baseGroupGold += (o.gold || rw);
            baseGroupExp += (o.exp || ex);

            if (typeof recordOrderDelivered === 'function') {
                recordOrderDelivered(o.id);
            }
            if (typeof addCampItem === 'function') {
                addCampItem(o.id);
            }
        });

        // Kích hoạt khoảng nghỉ cho Slot 1 sau khi nộp món cấp cao (Tension & Release)
        // (Nếu đang trong chu kỳ lặp lại 2 lần của Ghế thì chưa nghỉ vội để giữ đúng nhịp lặp lại)
        var slot1Order = group.orders.find(function (o) { return o.slotType === 'hard'; });
        if (slot1Order && (!SAVE.slot1ChairRepeat || !SAVE.slot1ChairRepeat.itemId)) {
            var s1Lv = parseInt(String(slot1Order.id).split('_lv')[1], 10) || 1;
            if (typeof getSlot1RestOrdersForLevel === 'function') {
                SAVE.slot1RestCooldown = getSlot1RestOrdersForLevel(s1Lv);
            }
        }

        // Thưởng hoàn thành trọn vẹn nhóm nhiệm vụ: Cộng toàn bộ EXP và Vàng gốc của các món + thưởng bonus 10%
        var bonusGold = Math.max(10, Math.round(baseGroupGold * 0.10));
        var bonusExp = Math.max(10, Math.round(baseGroupExp * 0.15));
        var totalGold = baseGroupGold + bonusGold;
        var totalExp = baseGroupExp + bonusExp;

        playerCoins += totalGold;
        var earnedStars = Math.max(1, group.orders.length);
        if (typeof SAVE !== 'undefined' && SAVE) {
            SAVE.questStars = (SAVE.questStars || 0) + earnedStars;
        }
        if (typeof updateStarChestUI === 'function') {
            updateStarChestUI();
        }
        if (trayEl) {
            spawnFlyingCurrency(trayEl, 'gold', totalGold);
            triggerParticleBurst(trayEl, ['#2ecc71', '#a8e6cf', '#ffd54f', '#ffffff']);
            showFloatingBadge(trayEl, 'Trọn bộ! +' + totalGold + ' 🪙 | +' + totalExp + ' XP | +' + earnedStars + ' ⭐', '#2e7d32');
        }

        if (typeof addPlayerExp === 'function') {
            addPlayerExp(totalExp, function (newLevel) {
                if (typeof window !== 'undefined' && window.autoBotRunning) {
                    triggerLevelUp(newLevel);
                } else {
                    setTimeout(function () { triggerLevelUp(newLevel); }, 650);
                }
            });
        }

        playSound('win');
        if (typeof getPetThankDialogue === 'function' && group.orders && group.orders[0]) {
            var thankMsg = getPetThankDialogue(group.petId, group.orders[0].id);
            setPetSpeech(group.petId, thankMsg, 3200);
        }
        updateUIStats();
        selectedIndex = null;
        updateSellButton(null);

        if (trayEl && !(typeof window !== 'undefined' && window.autoBotRunning)) {
            safeAnimate(trayEl, [
                { transform: 'scale(1)', opacity: 1 },
                { transform: 'scale(1.08) translateY(-8px)', opacity: 1, offset: 0.3 },
                { transform: 'scale(0.8) translateY(-30px)', opacity: 0 }
            ], { duration: 400, easing: 'ease-in-out' });
        }

        if (typeof window !== 'undefined' && window.autoBotRunning) {
            completeGroupTransition();
        } else {
            setTimeout(completeGroupTransition, 420);
        }
    };

    var tryFinishDelivery = function () {
        if (!allLaunched || pendingFlights > 0 || finishCalled) return;
        finishCalled = true;
        finishDelivery();
    };

    unstashed.forEach(function (o) {
        var matchIdx = findOrderMatch(boardData, o.id);
        if (matchIdx !== -1) {
            var slotEl = trayEl && (
                trayEl.querySelector('.tray-item-slot[data-order-id="' + o.id + '"]:not(.stashed)') ||
                trayEl.querySelector('.tray-item-slot[data-order-id="' + o.id + '"]')
            );
            if (slotEl) slotEl.classList.add('stashed');
            o.stashed = true;
            o.stashedVerified = true;
            pendingFlights++;
            flyItemToTraySlot(matchIdx, slotEl, function () {
                pendingFlights--;
                tryFinishDelivery();
            });
        }
    });

    allLaunched = true;
    tryFinishDelivery();
}

function renderOrders() {
    if (!ordersContainer) return;

    syncCurrentOrdersFromGroups();

    var webs = countWebs(boardData);
    if (webCountUI) webCountUI.innerText = `${webs}`;

    var groups = (SAVE && Array.isArray(SAVE.petOrderGroups)) ? SAVE.petOrderGroups : [];
    if (!groups.length) {
        if (typeof ensurePetOrderGroups === 'function') {
            ensurePetOrderGroups(SAVE.playerLevel || 1);
            groups = (SAVE && Array.isArray(SAVE.petOrderGroups)) ? SAVE.petOrderGroups : [];
        }
    }
    if (!groups.length) {
        ordersContainer.innerHTML = '';
        return;
    }

    // Đếm các vật phẩm khả dụng trên bàn cờ (tuyệt đối không tính vật phẩm đang nằm trong bong bóng)
    var availableBoardItems = {};
    if (boardData && boardData.length) {
        boardData.forEach(function (c) {
            if (c && c.id && !c.isLocked && !c.isRock && !c.isBubble && !GENERATORS[c.id]) {
                availableBoardItems[c.id] = (availableBoardItems[c.id] || 0) + 1;
            }
        });
    }

    // Hiển thị duy nhất 1 nhóm thú cưng trên màn hình (đơn giản, dễ theo dõi)
    var visibleGroups = groups.slice(0, 1);

    // TỐI ƯU HÓA DOM RECONCILIATION: Tránh xóa innerHTML gây giật nháy khi bấm máy sinh đồ
    var existingGroupEls = ordersContainer.querySelectorAll('.pet-order-group');
    var canReconcile = (existingGroupEls.length === visibleGroups.length);
    if (canReconcile) {
        for (var ci = 0; ci < visibleGroups.length; ci++) {
            var vg = visibleGroups[ci];
            var eg = existingGroupEls[ci];
            if (!eg || eg.dataset.petId !== vg.petId) {
                canReconcile = false;
                break;
            }
            var itemSlots = eg.querySelectorAll('.tray-item-slot');
            if (itemSlots.length !== (vg.orders ? vg.orders.length : 0)) {
                canReconcile = false;
                break;
            }
            for (var si = 0; si < vg.orders.length; si++) {
                if (itemSlots[si].dataset.orderId !== vg.orders[si].id) {
                    canReconcile = false;
                    break;
                }
            }
            if (!canReconcile) break;
        }
    }

    if (canReconcile) {
        // Cập nhật trạng thái trực tiếp trên DOM hiện có (giữ nguyên Canvas hoạt ảnh, không bị giật nháy)
        visibleGroups.forEach(function (group, gIdx) {
            var groupEl = existingGroupEls[gIdx];
            var trayWrap = groupEl.querySelector('.pet-group-tray-wrap');
            var itemSlots = groupEl.querySelectorAll('.tray-item-slot');
            var allReady = true;

            group.orders.forEach(function (o, oIdx) {
                var isReady = false;
                if (o.stashed) {
                    isReady = true;
                } else if (availableBoardItems[o.id] && availableBoardItems[o.id] > 0) {
                    isReady = true;
                    availableBoardItems[o.id]--;
                } else {
                    isReady = false;
                    allReady = false;
                }

                var slot = itemSlots[oIdx];
                if (slot) {
                    var lineBg = (typeof getCellBgClass === 'function' && typeof itemLine === 'function')
                        ? getCellBgClass(itemLine(o.id))
                        : 'cell-bg-01';
                    for (var bi = 1; bi <= 9; bi++) {
                        slot.classList.remove('cell-bg-0' + bi);
                    }
                    slot.classList.add(lineBg);

                    if (isReady) {
                        if (!slot.classList.contains('ready-glow')) slot.classList.add('ready-glow');
                        if (!slot.querySelector('.tray-check-icon')) {
                            var chk = document.createElement('img');
                            chk.className = 'tray-check-icon';
                            chk.src = 'assets/images_webp/ui/icon_check.webp';
                            chk.alt = '✓';
                            slot.appendChild(chk);
                        }
                    } else {
                        slot.classList.remove('ready-glow');
                        var oldChk = slot.querySelector('.tray-check-icon');
                        if (oldChk) oldChk.remove();
                    }

                    if (o.stashed) {
                        if (!slot.classList.contains('stashed')) slot.classList.add('stashed');
                    } else {
                        slot.classList.remove('stashed');
                    }
                }
            });

            // Cập nhật nút GIAO phía trên khay
            if (trayWrap) {
                var existingDeliverBtn = trayWrap.querySelector('.btn-group-deliver');
                if (allReady && group.orders.length > 0) {
                    if (!existingDeliverBtn) {
                        var petObj = (typeof PET_CHARACTERS !== 'undefined')
                            ? PET_CHARACTERS.find(function (p) { return p.id === group.petId; })
                            : null;
                        var petName = petObj ? petObj.name : 'Bạn đồng hành';

                        var deliverBtn = document.createElement('button');
                        deliverBtn.className = 'btn-3s btn-green btn-group-deliver';
                        deliverBtn.type = 'button';
                        deliverBtn.title = 'Nhấn để giao toàn bộ đơn hàng cho ' + petName + '!';
                        deliverBtn.innerHTML = '<span class="btn-3s-bg" aria-hidden="true">' +
                            '<span class="b3-left"></span><span class="b3-mid"></span><span class="b3-right"></span>' +
                            '</span><span class="btn-3s-text">Giao</span>';

                        deliverBtn.addEventListener('click', function (e) {
                            e.stopPropagation();
                            clearTutorialHand();
                            deliverBtn.classList.remove('hint-pulse');
                            deliverPetOrderGroup(gIdx);
                        });
                        trayWrap.insertBefore(deliverBtn, trayWrap.firstChild);
                    }
                } else {
                    if (existingDeliverBtn) existingDeliverBtn.remove();
                }
            }
        });
        syncPendingGeneratorDock();
        updateOrderActionTutorials();
        return;
    }

    // Bảo toàn bong bóng thoại nếu đang hiển thị
    if (npcSpeechBubble && ordersContainer.contains(npcSpeechBubble)) {
        var rightCol = document.getElementById('scene-right-column');
        if (rightCol) rightCol.appendChild(npcSpeechBubble);
    }

    ordersContainer.innerHTML = '';

    visibleGroups.forEach(function (group, gIdx) {
        var petObj = (typeof PET_CHARACTERS !== 'undefined')
            ? PET_CHARACTERS.find(function (p) { return p.id === group.petId; })
            : null;
        var petName = petObj ? petObj.name : 'Bạn đồng hành';
        var petImgSrc = petObj ? petObj.img : ('assets/images_webp/ui/' + (group.petId || 'character01') + '.webp');

        var groupEl = document.createElement('div');
        groupEl.className = 'pet-order-group';
        groupEl.dataset.groupIdx = gIdx;
        groupEl.dataset.petId = group.petId;

        // 1. Hình ảnh / Hoạt ảnh Thú cưng đứng cạnh khay (Canvas nếu có spritesheet, Img nếu dùng ảnh tĩnh)
        var avatarWrap = document.createElement('div');
        avatarWrap.className = 'pet-group-avatar-wrap';
        avatarWrap.title = 'Chạm để trò chuyện cùng ' + petName;

        // Hòn đảo nhỏ gắn trực tiếp dưới chân NPC để luôn di chuyển cùng nhau
        var islandImg = document.createElement('img');
        islandImg.className = 'pet-group-island-img';
        islandImg.src = 'assets/images_webp/board/npc_bg.webp';
        islandImg.alt = '';
        avatarWrap.appendChild(islandImg);

        var petAvatarObj = createPetAvatarElement(group.petId, petName, petImgSrc);
        avatarWrap.appendChild(petAvatarObj.element);
        groupEl._petAvatarObj = petAvatarObj;

        avatarWrap.addEventListener('click', function () {
            var liveGrp = (SAVE && Array.isArray(SAVE.petOrderGroups) && SAVE.petOrderGroups[gIdx]) ? SAVE.petOrderGroups[gIdx] : group;
            var sampleOrder = (liveGrp.orders && liveGrp.orders[0]) ? liveGrp.orders[0].id : '';
            var quote = liveGrp.contextDialogue
                ? liveGrp.contextDialogue
                : ((typeof getPetOrderDialogue === 'function')
                    ? getPetOrderDialogue(sampleOrder, liveGrp.petId)
                    : ('Chào bạn! Hãy giúp mình chuẩn bị đồ dã ngoại nhé!'));
            setPetSpeech(liveGrp.petId, quote, 4200);
        });

        groupEl.appendChild(avatarWrap);

        // 2. Khay đơn hàng
        var trayWrap = document.createElement('div');
        trayWrap.className = 'pet-group-tray-wrap';

        var allReady = true;
        var groupOrderStates = [];

        group.orders.forEach(function (o) {
            var ready = false;
            if (o.stashed) {
                ready = true;
            } else if (availableBoardItems[o.id] && availableBoardItems[o.id] > 0) {
                ready = true;
                availableBoardItems[o.id]--;
            } else {
                ready = false;
                allReady = false;
            }
            groupOrderStates.push(ready);
        });

        // Nút GIAO phía trên khay (khi đủ nhóm)
        if (allReady && group.orders.length > 0) {
            var deliverBtn = document.createElement('button');
            deliverBtn.className = 'btn-3s btn-green btn-group-deliver';
            deliverBtn.type = 'button';
            deliverBtn.title = 'Nhấn để giao toàn bộ đơn hàng cho ' + petName + '!';
            deliverBtn.innerHTML = '<span class="btn-3s-bg" aria-hidden="true">' +
                '<span class="b3-left"></span><span class="b3-mid"></span><span class="b3-right"></span>' +
                '</span><span class="btn-3s-text">Giao</span>';

            deliverBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                clearTutorialHand();
                deliverBtn.classList.remove('hint-pulse');
                deliverPetOrderGroup(gIdx);
            });
            trayWrap.appendChild(deliverBtn);
        }

        // 3. Khay 3-slice bằng ảnh bg_giao_left/center/right
        var trayEl = document.createElement('div');
        trayEl.className = 'pet-group-tray';

        var trayBg = document.createElement('div');
        trayBg.className = 'tray-bg';
        trayBg.innerHTML = '<div class="tray-bg-left"></div><div class="tray-bg-mid"></div><div class="tray-bg-right"></div>';
        trayEl.appendChild(trayBg);

        var itemsEl = document.createElement('div');
        itemsEl.className = 'tray-items';

        group.orders.forEach(function (o, oIdx) {
            var isReady = groupOrderStates[oIdx];
            var lineBg = (typeof getCellBgClass === 'function' && typeof itemLine === 'function')
                ? getCellBgClass(itemLine(o.id))
                : 'cell-bg-01';
            var slot = document.createElement('div');
            slot.className = 'tray-item-slot ' + lineBg + (isReady ? ' ready-glow' : '') + (o.stashed ? ' stashed' : '');
            slot.dataset.groupIdx = gIdx;
            slot.dataset.orderIdx = oIdx;
            slot.dataset.orderId = o.id;
            slot.title = getItemDisplayName(o.id) + (isReady ? ' (Sẵn sàng nộp)' : ' (Cần chế tạo)');

            var img = document.createElement('img');
            img.className = 'item-icon';
            img.src = getItemImagePath(o.id);
            img.alt = getItemDisplayName(o.id);
            slot.appendChild(img);

            // Dấu tích xanh icon_check.png ở góc ảnh khi hoàn thành
            if (isReady) {
                var chk = document.createElement('img');
                chk.className = 'tray-check-icon';
                chk.src = 'assets/images_webp/ui/icon_check.webp';
                chk.alt = '✓';
                slot.appendChild(chk);
            }

            // Chạm vào ô đơn hàng trên khay: NPC hướng dẫn tên item, Level và Thùng sinh đồ
            slot.addEventListener('click', function (e) {
                e.stopPropagation();
                var liveGroup = (SAVE && Array.isArray(SAVE.petOrderGroups) && SAVE.petOrderGroups[gIdx]) ? SAVE.petOrderGroups[gIdx] : group;
                var liveOrder = (liveGroup && Array.isArray(liveGroup.orders) && liveGroup.orders[oIdx]) ? liveGroup.orders[oIdx] : o;
                var guideSpeech = buildOrderItemGuideSpeech(liveOrder.id);

                if (typeof playSound === 'function') playSound('tap');

                if (!liveOrder.stashed) {
                    var matchIdx = findOrderMatch(boardData, liveOrder.id);
                    if (matchIdx !== -1) {
                        setPetSpeech(liveGroup.petId, guideSpeech, 4500, { noTruncate: true, isGuide: true });
                        liveOrder.stashed = true;
                        liveOrder.stashedVerified = true;
                        flyItemToTraySlot(matchIdx, slot, function () {
                            persistCurrentBoardState();
                            renderOrders();
                            renderBoard();
                        });
                    } else {
                        highlightGeneratorForOrderItem(liveOrder.id);
                        setPetSpeech(liveGroup.petId, guideSpeech, 5000, { noTruncate: true, isGuide: true });
                    }
                } else {
                    setPetSpeech(liveGroup.petId, guideSpeech, 4500, { noTruncate: true, isGuide: true });
                }
            });

            itemsEl.appendChild(slot);
        });

        trayEl.appendChild(itemsEl);
        trayWrap.appendChild(trayEl);
        groupEl.appendChild(trayWrap);
        ordersContainer.appendChild(groupEl);
    });

    syncPendingGeneratorDock();
    updateOrderActionTutorials();
}

// ==========================================
// Ô CHỜ MÁY PHÁT MỚI BÊN TRÁI CHÚ CHÓ (LEVEL 4 -> BA LÔ, LEVEL 5 -> THÙNG ĐỒ)
// ==========================================
function syncPendingGeneratorDock() {
    if (!ordersContainer) return;
    var firstGroup = ordersContainer.querySelector('.pet-order-group');
    if (!firstGroup) return;

    var pLv = (typeof SAVE !== 'undefined' && SAVE && typeof SAVE.playerLevel === 'number')
        ? SAVE.playerLevel
        : (currentLevel || 1);
    var pendingGens = (typeof getPendingDockGenerators === 'function')
        ? getPendingDockGenerators(boardData, pLv)
        : [];

    var existingDock = firstGroup.querySelector('.pending-gen-dock');
    if (!pendingGens || pendingGens.length === 0) {
        if (existingDock) existingDock.remove();
        return;
    }

    var key = pendingGens.join(',');
    if (existingDock && existingDock.dataset.gensKey === key) {
        return;
    }
    if (existingDock) existingDock.remove();

    var dock = document.createElement('div');
    dock.className = 'pending-gen-dock';
    dock.dataset.gensKey = key;

    pendingGens.forEach(function (genId) {
        var genName = (genId === 'generator_backpack') ? 'Ba Lô Dã Ngoại' : 'Thùng Bếp & Sinh Tồn';
        var slot = document.createElement('div');
        slot.className = 'pending-gen-slot';
        slot.dataset.genId = genId;
        slot.title = genName + ' mới mở khóa! Kéo thả vào ô trống trên bàn chơi!';

        var focusRing = document.createElement('span');
        focusRing.className = 'pending-gen-focus-ring';
        slot.appendChild(focusRing);

        var label = document.createElement('span');
        label.className = 'pending-gen-label';
        label.textContent = 'Kéo vào bàn';
        slot.appendChild(label);

        var img = document.createElement('img');
        img.className = 'pending-gen-img';
        img.src = getItemImagePath(genId);
        img.alt = genName;
        img.draggable = false;
        slot.appendChild(img);

        var badge = document.createElement('img');
        badge.className = 'generator-energy-badge';
        badge.src = 'assets/images_webp/board/icon_nangluong_tao.webp';
        badge.alt = '⚡';
        badge.draggable = false;
        slot.appendChild(badge);

        slot.addEventListener('pointerdown', function (e) {
            onPendingGenPointerDown(e, genId, slot);
        });

        dock.appendChild(slot);
    });

    // Đặt ngay bên trái chú chó (trước .pet-group-avatar-wrap)
    firstGroup.insertBefore(dock, firstGroup.firstChild);
}

function placePendingGeneratorOnBoard(genId, preferredCellIdx) {
    if (!boardData || !boardData.length || !genId) return false;
    // Kiểm tra xem đã có trên bàn cờ chưa
    var alreadyIdx = boardData.findIndex(function (c) {
        return c && c.id === genId && !c.isRock && !c.isLocked;
    });
    if (alreadyIdx !== -1) {
        syncPendingGeneratorDock();
        return true;
    }

    var empties = getEmptyIndexes(boardData);
    var targetIdx = -1;

    if (typeof preferredCellIdx === 'number' && preferredCellIdx >= 0 && preferredCellIdx < boardData.length) {
        var tc = boardData[preferredCellIdx];
        if (tc && !tc.isRock && !tc.isLocked) {
            if (!tc.id) {
                targetIdx = preferredCellIdx;
            } else if (!GENERATORS[tc.id] && empties.length > 0) {
                // Nếu người chơi thả vào ô đang có vật phẩm thường, dời vật phẩm đó sang ô trống gần nhất
                boardData[empties[0]] = tc;
                targetIdx = preferredCellIdx;
            }
        }
    }

    if (targetIdx === -1) {
        if (empties.length > 0) {
            // Ưu tiên ô trống gần trung tâm bàn cờ
            empties.sort(function (a, b) {
                var ra = Math.floor(a / 7), ca = a % 7;
                var rb = Math.floor(b / 7), cb = b % 7;
                return (Math.abs(ra - 3) + Math.abs(ca - 3)) - (Math.abs(rb - 3) + Math.abs(cb - 3));
            });
            targetIdx = empties[0];
        } else {
            if (typeof showToast === 'function') {
                showToast('⚠️ Bàn cờ đã đầy! Hãy ghép hoặc bán bớt 1 món đồ để lấy chỗ đặt máy phát nhé!');
            }
            return false;
        }
    }

    boardData[targetIdx] = {
        id: genId,
        isRock: false,
        isLocked: false,
        isGeneratorRock: false,
        isNewGenUnlocked: true
    };

    if (typeof populateRockHiddenItems === 'function') {
        populateRockHiddenItems(boardData);
    }

    // Kích hoạt ngay 2 nhiệm vụ liên tiếp quét dọn đồ của túi đồ cũ trên bàn chơi trước khi chuyển sang nhiệm vụ của túi đồ mới
    var cleanupGroup = null;
    if (typeof startNewGeneratorTransitionOrders === 'function') {
        cleanupGroup = startNewGeneratorTransitionOrders(genId, boardData);
        syncCurrentOrdersFromGroups();
    }

    persistCurrentBoardState();
    renderBoard();
    renderOrders();

    playSound('win');
    triggerVibrate([40, 60, 40]);

    var genName = (genId === 'generator_backpack') ? 'Ba Lô Dã Ngoại' : 'Thùng Bếp & Sinh Tồn';
    if (boardElement && boardElement.children[targetIdx]) {
        var placedCell = boardElement.children[targetIdx];
        triggerParticleBurst(placedCell, ['#ffd700', '#ffeb3b', '#00e676', '#00b0ff', '#ffffff']);
        showFloatingBadge(placedCell, '🎉 ĐÃ ĐẶT ' + genName.toUpperCase() + '! 🎉', '#e67e22');
    }
    if (typeof showToast === 'function') {
        showToast('🧹 Đã đặt ' + genName + '! Hãy hoàn thành 2 đơn dọn bàn trước khi khui túi đồ mới nhé!', 4200);
    }
    return true;
}

function onPendingGenPointerDown(e, genId, slotEl) {
    if (dragState) endDrag();
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.stopPropagation();

    clearHintVisuals();
    hideNpcBubble();

    dragState = {
        from: -1,
        fromPendingGen: genId,
        sourceEl: slotEl,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        active: false,
        ghost: null
    };
    document.addEventListener('pointermove', onPointerMove, { passive: false });
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerCancel);
}

// ==========================================
// XỬ LÝ DI CHUYỂN / GHÉP ITEM CHUNG (DÙNG CHO CẢ KÉO THẢ & CHẠM)
// ==========================================
function executeMoveAndEffects(fromIdx, toIdx) {
    var res = doMove(boardData, fromIdx, toIdx);
    if (res.type === 'none') return res;

    var clearedWebs = [];
    var bonusIdx = -1;
    var mergeGoldEarned = 0;
    var mergeRubyEarned = 0;

    if (res.type === 'move') {
        playSound('move');
    } else if (res.type === 'merge') {
        tutMergeCount++;
        playSound('merge', res.newId);
        clearedWebs = clearAdjacentWebs(boardData, res.index, currentLevelCfg);
        bonusIdx = bonusDrop(boardData, currentLevelCfg, res.newId);

        // THU THẬP TẤT CẢ Ô NHỆN VỪA BỊ PHÁ (TRỰC TIẾP & LIỀN KỀ) ĐỂ BIẾN Ô ĐÁ LIỀN KỀ THÀNH Ô NHỆN
        var brokenWebIndices = [];
        if (res.brokeDirectWeb) {
            brokenWebIndices.push(res.index);
        }
        if (Array.isArray(clearedWebs)) {
            clearedWebs.forEach(function (w) {
                if (brokenWebIndices.indexOf(w) === -1) brokenWebIndices.push(w);
            });
        }

        var revealedRocks = [];
        if (typeof revealAdjacentRocksAsWebs === 'function' && brokenWebIndices.length > 0) {
            revealedRocks = revealAdjacentRocksAsWebs(boardData, brokenWebIndices);
        }

        // Thưởng trực tiếp khi ghép:
        // - Chỉ thưởng Vàng/Kim cương trực tiếp khi ghép tới vật phẩm mốc rất cao (Lv.8+)
        // - Đã tắt cộng Vàng tự động ở mọi bước Combo vì đã có cơ chế rớt Xu/Năng lượng trên bàn chơi (board_coin / board_energy)
        var isCurrencyMerge = (typeof isBoardCurrencyItem === 'function' && isBoardCurrencyItem(res.newId));
        var comboGold = 0;
        if (!isReplayLevel && !isCurrencyMerge) {
            var mr = mergeReward(res.newId);
            mergeGoldEarned += mr.coins;
            mergeRubyEarned += mr.gems;

            if (mergeComboCount >= 2 && typeof getComboReward === 'function') {
                comboGold = getComboReward(mergeComboCount);
                if (comboGold > 0) {
                    mergeGoldEarned += comboGold;
                }
            }
        }

        if (mergeGoldEarned > 0 || mergeRubyEarned > 0) {
            playerCoins += mergeGoldEarned;
            playerGems += mergeRubyEarned;
        }
    }

    if (isAutoEnabled) fillBoardInstantly();
    // Tối ưu hiệu năng: nếu là merge, renderBoard() sẽ được gọi ở cuối sau các hiệu ứng
    // để tránh render 2 lần liên tiếp gây lag khung hình
    if (res.type !== 'merge') {
        renderBoard();
    }

    if (res.type === 'merge') {
        var mergedCell = boardElement.children[res.index];
        if (typeof VISUAL_FX === 'undefined' || !VISUAL_FX.gsapElasticMergePop) {
            triggerParticleBurst(mergedCell);
        }

        if (res.brokeDirectWeb && typeof VISUAL_FX !== 'undefined' && VISUAL_FX.emitUnlockGrassDust) {
            VISUAL_FX.emitUnlockGrassDust(mergedCell);
        }

        // Chỉ hiển thị huy hiệu thị giác khi đạt chuỗi Combo từ x3 trở lên (và không hiện khi đang ghép xu/năng lượng)
        if (!isCurrencyMerge && mergeComboCount >= 3) {
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
            if (typeof VISUAL_FX !== 'undefined' && VISUAL_FX.emitUnlockGrassDust) {
                VISUAL_FX.emitUnlockGrassDust(wCell);
            }
            showFloatingBadge(wCell, 'Rách nhện!', '#00897b');
        });

        // HIỆU ỨNG NỨT VỠ ĐÁ THÀNH MẠNG NHỆN KHI PHÁ Ô NHỆN LIỀN KỀ
        if (revealedRocks && revealedRocks.length > 0) {
            playSound('rock_crack');
            revealedRocks.forEach(function (rIdx) {
                var rCell = boardElement.children[rIdx];
                if (rCell) {
                    rCell.classList.remove('rock-reveal-anim');
                    void rCell.offsetWidth;
                    rCell.classList.add('rock-reveal-anim');
                    var cellObj = boardData[rIdx];
                    if (cellObj && (cellObj.id === 'generator_backpack' || cellObj.id === 'generator_crate')) {
                        playSound('win');
                        triggerVibrate([40, 60, 40]);
                        triggerParticleBurst(rCell, ['#ffd700', '#ffeb3b', '#e91e63', '#00e676', '#00b0ff', '#ffffff']);
                        var genName = (cellObj.id === 'generator_backpack') ? 'Ba Lô Dã Ngoại' : 'Thùng Bếp Trại';
                        showFloatingBadge(rCell, '🎉 ĐÃ TÌM THẤY ' + genName.toUpperCase() + '! 🎉', '#e67e22');
                    } else if (cellObj && cellObj.isSurprise) {
                        playSound('bonus');
                        triggerParticleBurst(rCell, ['#ffd700', '#ffeb3b', '#ff9800', '#ffffff', '#e91e63']);
                        showFloatingBadge(rCell, '★ Bất ngờ! ' + getItemDisplayName(cellObj.id) + ' ★', '#f39c12');
                    } else {
                        triggerParticleBurst(rCell, ['#8d6e63', '#a1887f', '#d7ccc8', '#b0bec5']);
                        showFloatingBadge(rCell, 'Lộ mạng nhện!', '#8d6e63');
                    }
                    if (typeof VISUAL_FX !== 'undefined' && VISUAL_FX.emitUnlockGrassDust) {
                        VISUAL_FX.emitUnlockGrassDust(rCell);
                    }
                }
            });
            persistCurrentBoardState();
        }
        if (bonusIdx !== -1) {
            playSound('bonus');
            var bCell = boardElement.children[bonusIdx];
            triggerParticleBurst(bCell, ['#ffd54f', '#ffca28', '#fff59d']);
            showFloatingBadge(bCell, '+1 Tiếp tế!', '#f57c00');
        }

        // Cập nhật lại giao diện bàn cờ (renderBoard đã tự động đồng bộ renderOrders)
        // Thả thưởng Bong Bóng vật phẩm (Lv.4-9) hoặc Xu/Năng lượng lên bàn chơi (chỉ với item thường, ở màn mới)
        if (!isReplayLevel && !isCurrencyMerge) {
            var newLvNum = itemLv(res.newId);
            if (typeof getEmptyIndexes === 'function') {
                var emptiesPost = getEmptyIndexes(boardData);
                var comboMilestoneN = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.gameplay && GAME_CONFIG.gameplay.combo && GAME_CONFIG.gameplay.combo.boardCoinEveryNCombos)
                    ? GAME_CONFIG.gameplay.combo.boardCoinEveryNCombos
                    : 6;
                var isHighComboMilestone = (mergeComboCount >= comboMilestoneN && mergeComboCount % comboMilestoneN === 0 && newLvNum >= 3);

                if (emptiesPost.length > 0 && newLvNum >= 4 && newLvNum <= 9 && Math.random() < 0.14) {
                    var bIdx = emptiesPost[Math.floor(Math.random() * emptiesPost.length)];
                    boardData[bIdx] = {
                        id: res.newId,
                        isRock: false,
                        isLocked: false,
                        isBubble: true,
                        bubbleExpiresAt: Date.now() + 60000
                    };
                    playSound('bubble');
                    if (boardElement.children[bIdx]) {
                        showFloatingBadge(boardElement.children[bIdx], '🫧 Bong bóng!', '#0288d1');
                    }
                } else if (emptiesPost.length > 0 && ((newLvNum >= 5 && Math.random() < 0.10) || isHighComboMilestone)) {
                    var cIdx = emptiesPost[Math.floor(Math.random() * emptiesPost.length)];
                    var dropCurId = (Math.random() < 0.45) ? 'board_energy_lv1' : 'board_coin_lv1';
                    boardData[cIdx] = { id: dropCurId, isRock: false, isLocked: false };
                    if (boardElement.children[cIdx]) {
                        showFloatingBadge(boardElement.children[cIdx], dropCurId === 'board_energy_lv1' ? '+⚡!' : '+🪙!', '#f57c00');
                    }
                }
            }
        }

        renderBoard();
        if (typeof VISUAL_FX !== 'undefined' && VISUAL_FX.gsapElasticMergePop) {
            VISUAL_FX.gsapElasticMergePop(boardElement.children[res.index], res.newId);
        }

        // Kiểm tra xem món vừa ghép có hoàn thành đơn hàng nào không để phát âm thanh & nảy thẻ nhiệm vụ
        var matchingOrder = currentOrders.find(function (o) { return !o.done && o.id === res.newId; });
        if (matchingOrder) {
            playSound('order_ready');
            var cardEl = ordersContainer && ordersContainer.querySelector('.order-card[data-order-id="' + res.newId + '"].ready');
            if (cardEl) {
                cardEl.classList.remove('order-card-bounce-attention');
                void cardEl.offsetWidth; // Force reflow
                cardEl.classList.add('order-card-bounce-attention');
            }
        }
    }
    return res;
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
    boardElement.querySelectorAll('.pending-gen-drop-hint').forEach(c => c.classList.remove('pending-gen-drop-hint'));
    boardElement.querySelectorAll('.drag-match-highlight').forEach(c => c.classList.remove('drag-match-highlight'));
    var stBtn = document.getElementById('btn-storage');
    if (stBtn) stBtn.classList.remove('drag-over');
    if (ordersContainer) {
        ordersContainer.querySelectorAll('.pending-gen-slot.dragging-source').forEach(s => s.classList.remove('dragging-source'));
    }
}

function onPointerDown(e) {
    if (dragState) endDrag();
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.target.closest('.cell-floating-sell-btn')) return;
    var cell = e.target.closest('.cell');
    if (!cell) return;
    var idx = parseInt(cell.dataset.index);
    var item = boardData[idx];
    if (!item || !item.id || item.isLocked || item.isRock) return;

    clearHintVisuals();
    hideNpcBubble();
    dragState = { from: idx, pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, active: false, ghost: null };
    document.addEventListener('pointermove', onPointerMove, { passive: false });
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerCancel);
}

function startDragging() {
    var imgSrc = '';
    var size = 56;

    if (dragState.fromPendingGen) {
        imgSrc = getItemImagePath(dragState.fromPendingGen);
        var refCell = boardElement.children[24] || boardElement.children[0];
        if (refCell) {
            size = refCell.getBoundingClientRect().width || 56;
        }
        if (dragState.sourceEl) {
            dragState.sourceEl.classList.add('dragging-source');
        }
        // Làm nổi bật các ô trống trên bàn cờ để người chơi biết nơi thả máy phát mới
        for (var i = 0; i < boardData.length; i++) {
            var c = boardData[i];
            if (c && !c.isRock && !c.isLocked && !c.id && boardElement.children[i]) {
                boardElement.children[i].classList.add('pending-gen-drop-hint');
            }
        }
    } else {
        var item = boardData[dragState.from];
        var srcCell = boardElement.children[dragState.from];
        size = srcCell.getBoundingClientRect().width;
        imgSrc = getItemImagePath(item.id);
        srcCell.classList.add('dragging-source');
        // Làm nổi bật tất cả ô cùng loại cùng cấp có thể ghép ngay (không áp dụng cho bong bóng)
        if (!item.isBubble && !GENERATORS[item.id] && nextItemId(item.id)) {
            for (var m = 0; m < boardData.length; m++) {
                if (m === dragState.from) continue;
                var mc = boardData[m];
                if (mc && mc.id === item.id && !mc.isRock && !mc.isBubble && boardElement.children[m]) {
                    boardElement.children[m].classList.add('drag-match-highlight');
                }
            }
        }
    }

    var ghost;
    if (!dragState.fromPendingGen && boardData[dragState.from] && boardData[dragState.from].isBubble) {
        ghost = document.createElement('div');
        ghost.style.cssText = 'position:fixed;left:0;top:0;z-index:100000;pointer-events:none;' +
            'width:' + size + 'px;height:' + size + 'px;display:flex;align-items:center;justify-content:center;' +
            'transform-origin:center;will-change:transform;';
        var gItem = document.createElement('img');
        gItem.src = imgSrc;
        gItem.style.cssText = 'width:68%;height:68%;object-fit:contain;filter:drop-shadow(0 4px 5px rgba(0,0,0,.35));';
        var gBubble = document.createElement('img');
        gBubble.src = 'assets/images_webp/items/icon_bongbong.webp';
        gBubble.style.cssText = 'position:absolute;inset:2px;width:calc(100% - 4px);height:calc(100% - 4px);object-fit:contain;filter:drop-shadow(0 4px 7px rgba(79,195,247,0.55));';
        ghost.appendChild(gItem);
        ghost.appendChild(gBubble);
    } else {
        ghost = document.createElement('img');
        ghost.src = imgSrc;
        ghost.style.cssText = 'position:fixed;left:0;top:0;z-index:100000;pointer-events:none;' +
            'width:' + size + 'px;height:' + size + 'px;object-fit:contain;' +
            'filter:drop-shadow(0 6px 6px rgba(0,0,0,.45));transform-origin:center;will-change:transform;';
    }
    document.body.appendChild(ghost);

    dragState.ghost = ghost;
    dragState.size = size;
    dragState.active = true;
    dragState.lastOverCell = null;
    dragState.rafId = null;
    selectedIndex = null;
    updateSellButton(null);
}

function moveGhost(x, y) {
    if (!dragState || !dragState.ghost) return;
    dragState.ghost.style.transform =
        'translate3d(' + (x - dragState.size / 2) + 'px,' + (y - dragState.size / 2) + 'px, 0) scale(1.15)';
}

function onPointerMove(e) {
    if (!dragState || e.pointerId !== dragState.pointerId) return;
    if (!dragState.active) {
        if (Math.hypot(e.clientX - dragState.startX, e.clientY - dragState.startY) < DRAG_THRESHOLD) return;
        startDragging();
    }
    e.preventDefault();

    dragState.currentX = e.clientX;
    dragState.currentY = e.clientY;

    if (!dragState.rafId) {
        dragState.rafId = requestAnimationFrame(function () {
            if (!dragState) return;
            dragState.rafId = null;
            if (!dragState.active) return;

            var curX = dragState.currentX;
            var curY = dragState.currentY;
            moveGhost(curX, curY);

            var target = cellFromPoint(curX, curY);
            var validTarget = (target && boardElement.contains(target) && parseInt(target.dataset.index) !== dragState.from)
                ? target
                : null;

            var stBtn = document.getElementById('btn-storage');
            if (stBtn && !dragState.fromPendingGen) {
                var hoverEl = document.elementFromPoint(curX, curY);
                var isOverStorage = !!(hoverEl && (hoverEl === stBtn || stBtn.contains(hoverEl)));
                stBtn.classList.toggle('drag-over', isOverStorage);
            }

            // Chỉ cập nhật DOM khi ô hover thực sự thay đổi, tránh querySelectorAll và style recalculation liên tục mỗi frame
            if (validTarget !== dragState.lastOverCell) {
                if (dragState.lastOverCell) {
                    dragState.lastOverCell.classList.remove('drag-over');
                }
                if (validTarget) {
                    validTarget.classList.add('drag-over');
                }
                dragState.lastOverCell = validTarget;
            }
        });
    }
}

function endDrag() {
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
    document.removeEventListener('pointercancel', onPointerCancel);
    if (dragState) {
        if (dragState.rafId) {
            cancelAnimationFrame(dragState.rafId);
            dragState.rafId = null;
        }
        if (dragState.ghost) dragState.ghost.remove();
        if (dragState.lastOverCell) {
            dragState.lastOverCell.classList.remove('drag-over');
            dragState.lastOverCell = null;
        }
    }
    clearDragVisuals();
    dragState = null;
}

function onPointerUp(e) {
    if (!dragState || e.pointerId !== dragState.pointerId) return;
    var wasActive = dragState.active;
    var from = dragState.from;
    var pendingGenId = dragState.fromPendingGen || null;
    var target = wasActive ? cellFromPoint(e.clientX, e.clientY) : null;
    var underPoint = wasActive ? document.elementFromPoint(e.clientX, e.clientY) : null;
    var draggedCard = underPoint ? underPoint.closest('.order-card') : null;
    endDrag();

    // Nếu người chơi kéo thả (hoặc chạm vào) máy phát mới ở bên trái chú chó để đưa vào bàn chơi
    if (pendingGenId) {
        suppressNextClick = true;
        setTimeout(() => { suppressNextClick = false; }, 0);
        if (wasActive) {
            if (target && boardElement.contains(target)) {
                placePendingGeneratorOnBoard(pendingGenId, parseInt(target.dataset.index));
            } else if (underPoint && boardElement && boardElement.contains(underPoint)) {
                placePendingGeneratorOnBoard(pendingGenId, -1);
            } else {
                // Nếu kéo chưa tới bàn cờ, nhắc nhẹ người chơi kéo vào ô trống trên bàn
                var gName = (pendingGenId === 'generator_backpack') ? 'Ba Lô Dã Ngoại' : 'Thùng Bếp & Sinh Tồn';
                if (typeof showToast === 'function') {
                    showToast('👇 Hãy kéo ' + gName + ' thả vào ô trống trên bàn chơi nhé!');
                }
            }
        } else {
            // Chạm trực tiếp vào icon máy phát bên trái chú chó cũng tự động đặt vào ô trống trên bàn chơi!
            placePendingGeneratorOnBoard(pendingGenId, -1);
        }
        return;
    }

    if (wasActive) {
        suppressNextClick = true;
        setTimeout(() => { suppressNextClick = false; }, 0);
        // Kéo thả vào Kho Lưu Trữ Tạm (#btn-storage)
        var storageBtnDrop = underPoint ? underPoint.closest('#btn-storage') : null;
        if (storageBtnDrop) {
            stashBoardItemToStorage(from);
            return;
        }
        // Kéo thả trực tiếp món đồ vào ô thẻ nhiệm vụ
        if (draggedCard && ordersContainer && ordersContainer.contains(draggedCard)) {
            var orderId = draggedCard.dataset.orderId;
            var fromItem = boardData[from];
            if (fromItem && fromItem.id && fromItem.id === orderId && !fromItem.isLocked && !fromItem.isRock && !fromItem.isBubble) {
                var matchingOrder = currentOrders.find(o => o.id === orderId && !o.done);
                if (matchingOrder) {
                    deliverReadyOrderWithFlight(matchingOrder, from, draggedCard);
                    return;
                }
            }
        }
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

if (boardElement) {
    boardElement.addEventListener('pointerdown', onPointerDown);
    boardElement.addEventListener('dragstart', e => e.preventDefault());
    boardElement.addEventListener('contextmenu', e => { if (dragState) e.preventDefault(); });
    boardElement.addEventListener('click', function (e) {
        if (suppressNextClick) return;
        if (e.target.closest('.cell-floating-sell-btn')) return;
        var cell = e.target.closest('.cell');
        if (cell && boardElement.contains(cell)) {
            handleCellClick(e, cell);
        }
    });
    boardElement.addEventListener('dblclick', function (e) {
        var cell = e.target.closest('.cell');
        if (cell && boardElement.contains(cell)) {
            var cellIdx = parseInt(cell.dataset.index, 10);
            if (!isNaN(cellIdx) && typeof handleCellDoubleClick === 'function') {
                handleCellDoubleClick(cellIdx, cell);
            }
        }
    });
}

// Chạm ra ngoài bàn cờ sẽ bỏ chọn item và ẩn nút Bán
document.addEventListener('pointerdown', function (e) {
    if (selectedIndex === null) return;
    if (e.target.closest('#grid-board')) return;
    if (e.target.closest('#btn-sell')) return;
    selectedIndex = null;
    updateSellButton(null);
    renderBoard();
});

// ==========================================
// SINH ITEM & CHẠM CHỌN (TAP-TO-MOVE)
// ==========================================
// Biến theo dõi số lần bấm liên tiếp máy sinh đồ (Bấm 6 lần liên tục mới kích hoạt xả đầy toàn bộ ô trống)
var lastGenClickTs = 0;
var lastGenCellIdx = -1;
var genClickStreak = 0;

function handleGeneratorClick(gen, cellElement) {
    if (isLevelCompleted()) {
        notifyLevelDoneOnGenerator(cellElement);
        return;
    }
    if (currentLevel <= 10 && !tutNewGenTapped) {
        var targetGens = {
            1: 'generator_cooler',
            2: 'generator_cooler',
            3: 'generator_cooler',
            4: 'generator_backpack',
            5: 'generator_backpack',
            6: 'generator_backpack',
            7: 'generator_crate',
            8: 'generator_crate',
            9: 'generator_crate',
            10: 'generator_cooler'
        };
        if (currentLevel === 10 || (gen && gen.id === targetGens[currentLevel])) {
            tutNewGenTapped = true;
            if (storySequenceTimer) {
                clearTimeout(storySequenceTimer);
                storySequenceTimer = null;
            }
            clearHintVisuals();
            hideNpcBubble();
        }
    }
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

    if (genClickStreak >= bulkClicksNeeded && !(typeof window !== 'undefined' && window.autoBotRunning)) {
        genClickStreak = 0;
        lastGenClickTs = 0;
        lastGenCellIdx = -1;
        bulkSpawnFromGenerator(gen, cellElement);
    } else {
        spawnFromGenerator(gen, cellElement);
    }
}

// ==========================================
// HIỆU ỨNG ĐỒ BAY RA TỪ THÙNG CHỨA / NGUỒN PHÁT SANG Ô TRỐNG
// Tạo cảm giác trực quan, sống động khi người chơi bấm sinh đồ
// ==========================================
function flyItemFromGenerator(sourceEl, targetIdx, itemId, itemLv, delayMs, onLand) {
    if (targetIdx == null || targetIdx < 0) {
        if (typeof onLand === 'function') onLand();
        return;
    }

    var targetCell = boardElement && boardElement.children[targetIdx];
    var targetImg = targetCell ? targetCell.querySelector('.item-img') : null;

    if (typeof window !== 'undefined' && window.autoBotRunning) {
        if (targetImg) targetImg.style.visibility = '';
        if (typeof onLand === 'function') onLand();
        return;
    }

    if (targetImg) {
        targetImg.style.visibility = 'hidden';
    }

    var delay = delayMs || 0;
    setTimeout(function () {
        // Fallback hiển thị ngay nếu thiếu thông tin vị trí DOM
        if (!sourceEl || !targetCell || !sourceEl.getBoundingClientRect || !targetCell.getBoundingClientRect) {
            if (targetImg) targetImg.style.visibility = '';
            if (typeof onLand === 'function') onLand();
            return;
        }

        var srcRect = sourceEl.getBoundingClientRect();
        var tgtRect = targetCell.getBoundingClientRect();

        if (srcRect.width === 0 || tgtRect.width === 0) {
            if (targetImg) targetImg.style.visibility = '';
            if (typeof onLand === 'function') onLand();
            return;
        }

        var flyWidth = Math.max(28, Math.min(tgtRect.width * 0.85, 52));
        var flyHeight = Math.max(28, Math.min(tgtRect.height * 0.85, 52));

        var x0 = srcRect.left + (srcRect.width - flyWidth) / 2;
        var y0 = srcRect.top + (srcRect.height - flyHeight) / 2;

        var x1 = tgtRect.left + (tgtRect.width - flyWidth) / 2;
        var y1 = tgtRect.top + (tgtRect.height - flyHeight) / 2;

        var dx = x1 - x0;
        var dy = y1 - y0;

        var flyer = document.createElement('img');
        flyer.src = getItemImagePath(itemId);
        flyer.alt = itemId;
        flyer.className = 'spawn-flying-item';

        var glowFilter = itemLv === 3
            ? 'drop-shadow(0 0 10px #ffd54f) drop-shadow(0 3px 6px rgba(0,0,0,0.35))'
            : (itemLv === 2 ? 'drop-shadow(0 0 8px #64b5f6) drop-shadow(0 3px 6px rgba(0,0,0,0.3))' : 'drop-shadow(0 3px 5px rgba(0,0,0,0.25))');

        flyer.style.cssText = 'position:fixed;pointer-events:none;z-index:180005;will-change:transform,opacity;' +
            'width:' + flyWidth + 'px;height:' + flyHeight + 'px;' +
            'left:' + x0 + 'px;top:' + y0 + 'px;' +
            'filter:' + glowFilter + ';object-fit:contain;';

        document.body.appendChild(flyer);

        // Nguồn phát nhún nhẹ khi đồ phóng ra
        safeAnimate(sourceEl, [
            { transform: 'scale(0.94)' },
            { transform: 'scale(1.06)' },
            { transform: 'scale(1)' }
        ], { duration: 180, easing: 'ease-out' });

        var arcPeakY = Math.min(-26, (dy * 0.5) - 32);
        var tiltDeg = (dx >= 0 ? 1 : -1) * (10 + Math.random() * 8);
        var duration = 260;

        var landed = false;
        var finishFlight = function () {
            if (landed) return;
            landed = true;
            if (flyer.parentNode) flyer.remove();

            if (targetImg) {
                targetImg.style.visibility = '';
                if (itemLv === 3) {
                    safeAnimate(targetImg, [
                        { transform: 'scale(1.35)' },
                        { transform: 'scale(0.95)' },
                        { transform: 'scale(1)' }
                    ], { duration: 220, easing: 'cubic-bezier(.2,.85,.32,1.2)' });
                } else if (itemLv === 2) {
                    safeAnimate(targetImg, [
                        { transform: 'scale(1.25)' },
                        { transform: 'scale(1)' }
                    ], { duration: 190, easing: 'ease-out' });
                } else {
                    safeAnimate(targetImg, [
                        { transform: 'scale(1.16)' },
                        { transform: 'scale(1)' }
                    ], { duration: 170, easing: 'ease-out' });
                }
            }

            if (itemLv === 3) {
                triggerParticleBurst(targetCell, ['#ffd700', '#ff9800', '#ffffff', '#ffeb3b']);
                showFloatingBadge(targetCell, 'Lv.3 CỰC MAY MẮN!', '#e65100');
            } else if (itemLv === 2) {
                showFloatingBadge(targetCell, 'Lv.2!', '#1976d2');
            }

            if (typeof onLand === 'function') {
                onLand();
            }
        };

        if (typeof VISUAL_FX !== 'undefined' && VISUAL_FX.gsapFlyFromGenerator) {
            var handledByGsap = VISUAL_FX.gsapFlyFromGenerator(sourceEl, targetCell, flyer, dx, dy, itemLv, finishFlight);
            if (handledByGsap) return;
        }

        safeAnimate(flyer, [
            { transform: 'translate(0, 0) scale(0.35) rotate(0deg)', opacity: 0.8 },
            { transform: 'translate(' + (dx * 0.45) + 'px, ' + (dy * 0.45 + arcPeakY) + 'px) scale(1.18) rotate(' + tiltDeg + 'deg)', opacity: 1, offset: 0.48 },
            { transform: 'translate(' + dx + 'px, ' + dy + 'px) scale(1.0) rotate(0deg)', opacity: 1 }
        ], {
            duration: duration,
            easing: 'cubic-bezier(0.2, 0.85, 0.32, 1.15)'
        }, finishFlight);
    }, delay);
}

// Bấm 1 lần: Sinh 1 item từ nguồn phát vào 1 ô trống ngẫu nhiên (tiêu tốn 1⚡ hoặc 2⚡ khi bật ×2)
function spawnFromGenerator(gen, cellElement) {
    if (isLevelCompleted()) return;
    if (playerEnergy <= 0) {
        openEnergyShop();
        return;
    }
    var boost = (typeof getPowerBoostMultiplier === 'function') ? getPowerBoostMultiplier() : 1;
    if (boost === 2 && playerEnergy < 2) {
        boost = 1;
        if (typeof showToast === 'function') {
            showToast('Không đủ 2⚡, tạm sinh đồ mức ×1!', 2000);
        }
    }
    var target = spawnItem(boardData, gen.id, currentOrders, currentLevelCfg, { powerBoost: boost });
    if (target === -1) {
        playSound('full_board');
        renderBoard();
        var best = findBestMerge(boardData, currentOrders, currentLevelCfg);
        if (best) {
            var cFrom = boardElement.children[best.from];
            var cTo = boardElement.children[best.to];
            if (cFrom) cFrom.classList.add('hint-pulse');
            if (cTo) cTo.classList.add('hint-pulse');
            var fullMergeMsg = (typeof I18N !== 'undefined') ? I18N.t('npc.board_full_merge') : 'Bàn cờ đầy! Ghép cặp nhấp nháy nhé!';
            setNpcState('de', '', fullMergeMsg, 2200);
        } else {
            var fullNoMovesMsg = (typeof I18N !== 'undefined') ? I18N.t('npc.board_full_no_moves') : 'Bàn cờ hết nước! Chọn đồ rồi BÁN nhé!';
            setNpcState('de', '', fullNoMovesMsg, 2400);
        }
        return;
    }
    if (playerEnergy >= getMaxEnergy()) {
        SAVE.lastEnergyTs = Date.now();
    }
    playerEnergy = Math.max(0, playerEnergy - boost);
    levelClicks++;
    if (boost === 2 && cellElement) {
        showFloatingBadge(cellElement, '⚡×2', '#ff9800');
    }
    if (typeof wasLastSpawnUnwanted === 'function' && wasLastSpawnUnwanted()) {
        levelUnwantedClicks++;
    }

    var spreadIdx = -1;
    if (currentLevelCfg && currentLevelCfg.spreadEvery && levelClicks % currentLevelCfg.spreadEvery === 0) {
        spreadIdx = spreadWeb(boardData);
    }

    var spawnedItem = lastSpawnResult ? lastSpawnResult.id : null;
    var spawnedLv = (lastSpawnResult && lastSpawnResult.itemLv) || 1;
    playSound('spawn', spawnedItem);
    renderBoard();

    // Hiệu ứng đồ bay ra từ thùng chứa sang ô đích trực quan
    flyItemFromGenerator(cellElement, target, spawnedItem, spawnedLv, 0, function () {
        if (spreadIdx !== -1 && boardElement.children[spreadIdx]) {
            showFloatingBadge(boardElement.children[spreadIdx], 'Nhện lan!', '#6a1b9a');
        }
        checkAutoDeliverRevealedOrders();
    });
}

// Bấm 6 lần liên tục: Xả đồ ra toàn bộ các ô trống trên bàn cờ (tiêu tốn tương ứng với số ô trống và năng lượng hiện có)
function bulkSpawnFromGenerator(gen, cellElement) {
    if (isLevelCompleted()) return;
    if (playerEnergy <= 0) {
        openEnergyShop();
        return;
    }
    var empties = getEmptyIndexes(boardData);
    if (!empties.length) {
        playSound('full_board');
        renderBoard();
        showToast('Bàn cờ đã đầy! Hãy ghép các món trên bàn trước nhé.', '#f57c00');
        return;
    }

    var boost = (typeof getPowerBoostMultiplier === 'function') ? getPowerBoostMultiplier() : 1;
    if (boost === 2 && playerEnergy < 2) {
        boost = 1;
    }
    var spawnCount = Math.min(empties.length, Math.floor(playerEnergy / boost));
    if (spawnCount <= 0) {
        openEnergyShop();
        return;
    }

    var spawnedTargets = [];
    var countLv2 = 0;
    var countLv3 = 0;
    if (playerEnergy >= getMaxEnergy()) {
        SAVE.lastEnergyTs = Date.now();
    }
    for (var i = 0; i < spawnCount; i++) {
        var tIdx = spawnItem(boardData, gen.id, currentOrders, currentLevelCfg, { powerBoost: boost });
        if (tIdx === -1) break;
        playerEnergy = Math.max(0, playerEnergy - boost);
        levelClicks++;
        if (typeof wasLastSpawnUnwanted === 'function' && wasLastSpawnUnwanted()) {
            levelUnwantedClicks++;
        }
        var sLv = (lastSpawnResult && lastSpawnResult.itemLv) || 1;
        var sId = (lastSpawnResult && lastSpawnResult.id) || ('an_lv' + sLv);
        if (sLv === 2) countLv2++;
        if (sLv === 3) countLv3++;
        spawnedTargets.push({ idx: tIdx, lv: sLv, id: sId });

        if (currentLevelCfg && currentLevelCfg.spreadEvery && levelClicks % currentLevelCfg.spreadEvery === 0) {
            spreadWeb(boardData);
        }
    }

    var bestSpawnItem = countLv3 > 0 ? 'an_lv3' : (countLv2 > 0 ? 'an_lv2' : 'an_lv1');
    playSound('spawn', bestSpawnItem);
    updateUIStats();
    renderBoard();

    // Hiệu ứng pháo hoa & badge thông báo xả đồ cực đã mắt
    if (cellElement) {
        triggerParticleBurst(cellElement, ['#ffd54f', '#ffb300', '#ffffff', '#4fc3f7']);
        var bulkMsg = 'XẢ ĐẦY Ô TRỐNG (-' + spawnedTargets.length + ' Năng lượng)';
        if (countLv3 > 0 && countLv2 > 0) {
            bulkMsg = 'XẢ ĐẦY (' + countLv3 + ' món Lv.3, ' + countLv2 + ' món Lv.2)';
        } else if (countLv3 > 0) {
            bulkMsg = 'XẢ ĐẦY (' + countLv3 + ' món Lv.3 CỰC MAY!)';
        } else if (countLv2 > 0) {
            bulkMsg = 'XẢ ĐẦY (' + countLv2 + ' món Lv.2)';
        }
        showFloatingBadge(cellElement, bulkMsg, countLv3 > 0 ? '#e65100' : '#2e7d32');
    }

    // Hiệu ứng vòi phun: Đồ bay lần lượt từ thùng chứa ra từng ô trống
    spawnedTargets.forEach(function (sp, seq) {
        var staggerDelay = Math.min(seq * 32, 280);
        flyItemFromGenerator(cellElement, sp.idx, sp.id, sp.lv, staggerDelay, function () {
            if (seq === spawnedTargets.length - 1) {
                checkAutoDeliverRevealedOrders();
            }
        });
    });

    if (playerEnergy <= 0) {
        setTimeout(openEnergyShop, 450);
    }
}

var lastTapCellIdx = -1;
var lastTapTime = 0;

function handleCellClick(e, cellElement) {
    var index = parseInt(cellElement.dataset.index);

    // Phát hiện chạm 2 lần liên tiếp (double-tap trên màn hình cảm ứng)
    var now = Date.now();
    if (index === lastTapCellIdx && (now - lastTapTime) < 380) {
        if (typeof handleCellDoubleClick === 'function' && handleCellDoubleClick(index, cellElement)) {
            lastTapCellIdx = -1;
            lastTapTime = 0;
            selectedIndex = null;
            updateSellButton(null);
            return;
        }
    }
    lastTapCellIdx = index;
    lastTapTime = now;

    var clickedItem = boardData[index];

    if (clickedItem && clickedItem.isBubble) {
        selectedIndex = null;
        updateSellButton(null);
        openBubbleModal(index);
        return;
    }

    if (clickedItem && clickedItem.id && !clickedItem.isLocked && !clickedItem.isRock && GENERATORS[clickedItem.id] && !isAutoEnabled) {
        selectedIndex = null;
        updateSellButton(null);
        if (isLevelCompleted()) {
            notifyLevelDoneOnGenerator(cellElement);
            return;
        }
        handleGeneratorClick(clickedItem, cellElement);
        return;
    }

    if (selectedIndex === null) {
        if (clickedItem && clickedItem.isRock) {
            cellElement.classList.remove('rock-tap-shake');
            void cellElement.offsetWidth;
            cellElement.classList.add('rock-tap-shake');
            var pLvClick = (typeof SAVE !== 'undefined' && SAVE && typeof SAVE.playerLevel === 'number') ? SAVE.playerLevel : (currentLevel || 1);
            var reqRockLv = (typeof isRockCellLockedByLevel === 'function' && isRockCellLockedByLevel(index, clickedItem, pLvClick))
                ? getRockUnlockLevel(index, clickedItem)
                : 0;
            if (reqRockLv > 0) {
                showToast('🔒 Ô đá khóa! Đạt Cấp ' + reqRockLv + ' để mở khóa ô này!');
            } else {
                showToast('Ghép ô mạng nhện liền kề để giải phóng ô đá!');
            }
            return;
        }
        if (clickedItem && clickedItem.id && !clickedItem.isRock) {
            if (!clickedItem.isLocked) {
                selectedIndex = index;
                updateSellButton(clickedItem.id);
                renderBoard();
            }
            var itemQuote = (typeof getPetOrderDialogue === 'function')
                ? getPetOrderDialogue(clickedItem.id)
                : getItemDisplayName(clickedItem.id);
            setPetSpeech(null, itemQuote, 4000);
        }
    } else {
        if (selectedIndex === index) {
            selectedIndex = null;
            updateSellButton(null);
            hideNpcBubble();
            renderBoard();
            return;
        }

        var fromIdx = selectedIndex;
        var toIdx = index;
        var toItem = boardData[toIdx];

        selectedIndex = null;
        updateSellButton(null);

        if (toItem && toItem.isRock) {
            var targetCell = boardElement.children[toIdx];
            if (targetCell) {
                targetCell.classList.remove('rock-tap-shake');
                void targetCell.offsetWidth;
                targetCell.classList.add('rock-tap-shake');
            }
            showToast('Ghép ô mạng nhện liền kề để giải phóng ô đá!');
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
                showToast('Không đủ Vàng!');
                return;
            }
            playerCoins -= cost;
            playerEnergy += energyAmt;
            playSound('bonus');
            updateUIStats();
            saveGame();
            showToast('Đã đổi +' + energyAmt + ' Năng lượng!');
        },
        onBuyGems: function () {
            playerGems -= GEM_ENERGY_PRICE;
            playerEnergy += GEM_ENERGY_PACK;
            playSound('bonus');
            updateUIStats();
            showToast('Nạp siêu tốc +' + GEM_ENERGY_PACK + ' Năng lượng!');
        },
        onWatchAd: function () {
            if (getAdsLeft('energy') <= 0) {
                showToast('Hết lượt quảng cáo hôm nay!');
                return;
            }
            var amt = AD_REWARDS.energy.amount;
            simulateWatchAd('Tiếp Tế Năng Lượng (+' + amt + ' Năng lượng)', function () {
                consumeAd('energy');
                playerEnergy += amt;
                playSound('bonus');
                updateUIStats();
                showToast('Nhận +' + amt + ' Năng lượng tài trợ!');
            });
        },
        onRescue: function () {
            var rCfg = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.energyShop && GAME_CONFIG.energyShop.rescue)
                ? GAME_CONFIG.energyShop.rescue
                : { amount: 20, dailyLimit: 2 };
            resetAdsIfNewDay();
            var used = SAVE.ads.rescue || 0;
            if (used >= (rCfg.dailyLimit || 2)) {
                showToast('Đã hết lượt Cứu Trợ hôm nay! Hãy xem Ads hoặc chờ hồi năng lượng nhé.');
                return;
            }
            SAVE.ads.rescue = used + 1;
            var rescueAmt = rCfg.amount || 20;
            playerEnergy += rescueAmt;
            playSound('bonus');
            updateUIStats();
            saveGame();
            showToast('Nhận Cứu Trợ Kiểm Lâm +' + rescueAmt + ' Năng lượng! (Còn ' + Math.max(0, (rCfg.dailyLimit || 2) - SAVE.ads.rescue) + ' lượt hôm nay)');
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
        dailyGiftClaimed: !!(SAVE && SAVE.ads && SAVE.ads.dailyGemClaimed),
        onClaimDailyFree: function () {
            if (SAVE && SAVE.ads && SAVE.ads.dailyGemClaimed) {
                showToast('Hôm nay bạn đã nhận quà rồi!');
                return;
            }
            if (!SAVE.ads) SAVE.ads = {};
            SAVE.ads.dailyGemClaimed = true;
            var amt = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.adRewards && GAME_CONFIG.adRewards.dailyGift)
                ? GAME_CONFIG.adRewards.dailyGift.amount : 5;
            playerGems += amt;
            updateUIStats();
            saveGame();
            playSound('coin');
            var targetEl = document.getElementById('btn-gem-shop') || document.body;
            spawnFlyingCurrency(targetEl, 'ruby', amt);
            showToast('Đã nhận +' + amt + ' Kim Cương hằng ngày!');
            openGemShop();
        },
        onWatchAd: function () {
            if (getAdsLeft('gem') <= 0) {
                showToast('Hết lượt nhận Kim cương hôm nay!');
                return;
            }
            var amt = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.adRewards && GAME_CONFIG.adRewards.gem)
                ? GAME_CONFIG.adRewards.gem.amount : 8;
            simulateWatchAd('Tài Trợ Kim Cương (+' + amt + ' Kim cương)', function () {
                consumeAd('gem');
                playerGems += amt;
                updateUIStats();
                saveGame();
                playSound('win');
                var targetEl = document.getElementById('btn-gem-shop') || document.body;
                spawnFlyingCurrency(targetEl, 'ruby', amt);
                showToast('Nhận +' + amt + ' Kim cương tài trợ!');
            });
        },
        onClaimTestGem: function () {
            playerGems += 500;
            SAVE.gems = playerGems;
            updateUIStats();
            saveGame();
            playSound('win');
            var targetEl = document.getElementById('btn-gem-shop') || document.body;
            spawnFlyingCurrency(targetEl, 'ruby', 500);
            showToast('Đã nhận +500 Kim Cương Test!');
            openGemShop();
        }
    });
}

function openCoinShop() {
    showCoinShopModal({
        gems: playerGems,
        coins: playerCoins,
        onExchange: function (pack) {
            if (playerGems < pack.gemCost) {
                showToast('Chưa đủ Kim cương!');
                return;
            }
            playerGems -= pack.gemCost;
            playerCoins += pack.coins;
            updateUIStats();
            saveGame();
            playSound('win');
            var targetEl = document.getElementById('btn-coin-shop') || document.body;
            spawnFlyingCurrency(targetEl, 'gold', Math.min(pack.coins, 100));
            showToast('Đã đổi +' + pack.coins.toLocaleString('vi-VN') + ' Vàng!');
        },
        onWatchAd: function () {
            if (getAdsLeft('coin') <= 0) {
                showToast('Hết lượt nhận Vàng hôm nay!');
                return;
            }
            var amt = AD_REWARDS.coin.amount;
            simulateWatchAd('Tài Trợ Ngân Hàng Vàng (+' + amt + ' Vàng)', function () {
                consumeAd('coin');
                playerCoins += amt;
                updateUIStats();
                saveGame();
                playSound('win');
                var targetEl = document.getElementById('btn-coin-shop') || document.body;
                spawnFlyingCurrency(targetEl, 'gold', amt);
                showToast('Nhận +' + amt + ' Vàng tài trợ!');
            });
        },
        onOpenGemShop: openGemShop
    });
}

function openLuckyDrop() {
    if (typeof getAdsLeft === 'function' && getAdsLeft('mystery') <= 0) {
        showToast('Hết lượt Tiếp Tế May Mắn hôm nay! Hãy quay lại vào ngày mai nhé.', '#e65100');
        return;
    }
    showLuckyDropModal(function (roll) {
        if (typeof consumeAd === 'function') consumeAd('mystery');
        if (roll.type === 'energy') {
            playerEnergy = Math.min(getEnergyOverflowCap(), playerEnergy + roll.val);
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
        showToast('Mở hộp thành công: ' + roll.text + '!', roll.color || '#2e7d32');
    });
}

function updateSellButton(itemId) {
    if (!btnSell) return;
    var sellWord = (typeof I18N !== 'undefined') ? I18N.t('hud.btn_sell') : 'Bán';
    if (!itemId || GENERATORS[itemId]) {
        btnSell.classList.add('disabled');
        btnSell.style.display = 'none';
        if (sellPriceUI) sellPriceUI.innerText = '0';
        if (sellBtnTextUI) sellBtnTextUI.innerText = sellWord;
    } else if (typeof isBoardCurrencyItem === 'function' && isBoardCurrencyItem(itemId)) {
        var cInfo = getBoardCurrencyInfo(itemId);
        var unit = (cInfo && cInfo.type === 'energy') ? '⚡' : '🪙';
        var val = cInfo ? cInfo.value : 2;
        if (sellPriceUI) sellPriceUI.innerText = val;
        if (sellBtnTextUI) sellBtnTextUI.innerText = 'Thu (+' + val + ' ' + unit + ')';
        btnSell.title = 'Thu thập ngay +' + val + ' ' + unit;
        btnSell.classList.remove('disabled');
        btnSell.style.display = 'inline-flex';
    } else {
        var p = (typeof sellPrice === 'function') ? sellPrice(itemId) : 10;
        if (p <= 0) p = 10;
        if (sellPriceUI) sellPriceUI.innerText = p;
        if (sellBtnTextUI) sellBtnTextUI.innerText = sellWord + ' (+' + p + ')';
        btnSell.title = 'Bán nhận +' + p + ' Vàng';
        btnSell.classList.remove('disabled');
        btnSell.style.display = 'inline-flex';
    }
}

// Bán vật phẩm tại vị trí index: Cộng vàng, hiệu ứng bay tiền, giải phóng ô
function sellItemAtIndex(idx) {
    if (idx === null || idx === undefined || idx < 0 || idx >= TOTAL_CELLS) return;
    var item = boardData[idx];
    if (!item || !item.id || item.isRock || item.isLocked || item.isBubble || GENERATORS[item.id]) return;

    if (typeof isBoardCurrencyItem === 'function' && isBoardCurrencyItem(item.id)) {
        collectBoardCurrencyAtIndex(idx);
        return;
    }

    var soldCell = boardElement.children[idx];
    var price = (typeof sellPrice === 'function') ? sellPrice(item.id) : 10;
    if (price <= 0) price = 10;

    playerCoins += price;
    SAVE.coins = playerCoins;
    saveGame();

    if (soldCell) {
        spawnFlyingCurrency(soldCell, 'gold', price);
        triggerParticleBurst(soldCell, ['#ffd700', '#ffeb3b', '#00e676', '#ffffff']);
        showFloatingBadge(soldCell, '+' + price.toLocaleString('vi-VN') + ' 🪙', '#2e7d32');
    }
    playSound('bonus');

    boardData[idx] = makeEmptyCell();
    selectedIndex = null;
    updateSellButton(null);

    if (isAutoEnabled) fillBoardInstantly();
    renderBoard();
    updateUIStats();
}

function refreshLevelSelect() {
    if (!levelSelect) return;
    var MAX_GAME_LEVEL = 60;
    var unlockAll = SAVE.settings && SAVE.settings.unlockAllLevels;
    if (SAVE.maxLevel > MAX_GAME_LEVEL) {
        SAVE.maxLevel = MAX_GAME_LEVEL;
        saveGame();
    }
    levelSelect.innerHTML = '';
    RAW_LEVELS.filter(r => r[0] <= MAX_GAME_LEVEL).forEach(r => {
        var opt = document.createElement('option');
        opt.value = r[0];
        var st = SAVE.stars[r[0]] || 0;
        var mark = st ? ' ' + '★'.repeat(st) : ((!unlockAll && r[0] > SAVE.maxLevel) ? ' (Khóa)' : '');
        opt.textContent = `Lv.${r[0]}${mark}`;
        levelSelect.appendChild(opt);
    });
    levelSelect.value = Math.min(MAX_GAME_LEVEL, currentLevel);
}

function toggleAutoDebug() {
    isAutoEnabled = !isAutoEnabled;
    if (isAutoEnabled) {
        fillBoardInstantly();
        renderBoard();
    }
}

// ==========================================
// (Tính năng dọn dẹp bàn cờ tốn 3 năng lượng đã được gỡ bỏ theo yêu cầu)

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

// ==========================================
// HỆ THỐNG THĂNG CẤP TRẠI VIÊN & HÀNH TRÌNH DÃ NGOẠI (LEVEL UP & CAMP JOURNEY)
// ==========================================

function triggerLevelUp(newLevel) {
    playSound('bonus');
    currentLevel = newLevel;

    // Thưởng lên cấp đọc từ GAME_CONFIG.energy (cộng thẳng, cho phép tràn bình tới overflowCap)
    var eCfg = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.energy) ? GAME_CONFIG.energy : {};

    // 1. Thưởng Năng Lượng cố định (không còn "nạp đầy về 125⚡" để giữ giá trị xem Ads)
    var energyBonus = (typeof eCfg.levelUpEnergy === 'number') ? eCfg.levelUpEnergy : 30;
    playerEnergy = Math.min(getEnergyOverflowCap(), playerEnergy + energyBonus);
    SAVE.energy = playerEnergy;

    // 2. Thưởng Vàng (base + perLevel * cấp mới)
    var coinBonus = (eCfg.levelUpCoinsBase || 200) + (newLevel * (eCfg.levelUpCoinsPerLevel || 50));
    playerCoins += coinBonus;
    SAVE.coins = playerCoins;

    // 3. Thưởng Kim Cương (mốc chia hết cho 5 thưởng nhiều hơn)
    var gemBonus = (newLevel % 5 === 0) ? (eCfg.levelUpGemsMilestone || 5) : (eCfg.levelUpGems || 2);
    playerGems += gemBonus;
    SAVE.gems = playerGems;

    // 4. Kiểm tra và mở khóa các ô đá khóa (board_cell_rock_lock.png) tương ứng với cấp độ mới (Lv.3, 5, 7, 11, 15, 18)
    var unlockedRockCells = (typeof checkAndUnlockRocksByPlayerLevel === 'function')
        ? checkAndUnlockRocksByPlayerLevel(boardData, newLevel)
        : [];

    persistCurrentBoardState();
    updateUIStats();
    renderBoard();
    renderOrders();

    if (unlockedRockCells && unlockedRockCells.length > 0) {
        playSound('rock_crack');
        unlockedRockCells.forEach(function (rIdx) {
            var rCell = boardElement && boardElement.children[rIdx];
            if (rCell) {
                rCell.classList.remove('rock-reveal-anim');
                void rCell.offsetWidth;
                rCell.classList.add('rock-reveal-anim');
                triggerParticleBurst(rCell, ['#ffd700', '#ffeb3b', '#8d6e63', '#00e676', '#ffffff']);
                showFloatingBadge(rCell, '🔓 Mở khóa Lv.' + newLevel + '!', '#ff9800');
            }
        });
    }

    // Thông báo thăng cấp vui tươi dạng Toast (không hiện popup chặn game hay tự mở bong bóng thoại)
    playSound('win');
    if (newLevel === 4) {
        showToast('🎒 Đạt Cấp 4! Mở Ba Lô Dã Ngoại (+' + energyBonus + '⚡, +' + coinBonus.toLocaleString('vi-VN') + '🪙, +' + gemBonus + '💎) — Kéo vào bàn chơi nhé!', 4500);
    } else if (newLevel === 7) {
        showToast('🧰 Đạt Cấp 7! Mở Thùng Bếp & Sinh Tồn (+' + energyBonus + '⚡, +' + coinBonus.toLocaleString('vi-VN') + '🪙, +' + gemBonus + '💎) — Kéo vào bàn chơi nhé!', 4500);
    } else {
        showToast('🎉 Thăng cấp Lv.' + newLevel + '! (+' + energyBonus + ' ⚡, +' + coinBonus.toLocaleString('vi-VN') + ' 🪙, +' + gemBonus + ' 💎)');
    }

    // Hiệu ứng nhấp nháy phát sáng ở huy hiệu cấp độ trên thanh HUD để người chơi chủ động bấm vào xem
    var lvBadge = document.getElementById('current-lv-badge');
    if (lvBadge) {
        lvBadge.classList.remove('lv-badge-levelup-pulse');
        void lvBadge.offsetWidth;
        lvBadge.classList.add('lv-badge-levelup-pulse');
    }

    // Hiển thị câu chuyện cột mốc mới trên bong bóng thoại của thú cưng
    if (typeof LEVEL_STORY_DIALOGUES !== 'undefined' && LEVEL_STORY_DIALOGUES[newLevel]) {
        var stEntry = LEVEL_STORY_DIALOGUES[newLevel];
        var stLine = (stEntry.texts && stEntry.texts[0]) ? stEntry.texts[0] : stEntry.text;
        if (stLine && typeof setPetSpeech === 'function') {
            setPetSpeech(SAVE && SAVE.activePet, stLine, 5200);
        }
    }
}

function showLevelUpModal(info) {
    var genHtml = '';
    if (info.newGen === 'generator_backpack') {
        genHtml = '<div class="level-up-gen-unlock">' +
            '<img src="assets/images_webp/items/generator_backpack.webp" alt="Ba Lô" class="level-up-gen-img">' +
            '<div class="level-up-gen-desc">🎉 <b>MỞ KHÓA BA LÔ DÃ NGOẠI!</b><br>Nhận thêm nhánh: <i>Cà phê, Bánh mì kẹp & Bộ dụng cụ</i></div>' +
        '</div>';
    } else if (info.newGen === 'generator_crate') {
        genHtml = '<div class="level-up-gen-unlock">' +
            '<img src="assets/images_webp/items/generator_crate.webp" alt="Thùng Bếp" class="level-up-gen-img">' +
            '<div class="level-up-gen-desc">🎉 <b>MỞ KHÓA THÙNG BẾP TRẠI!</b><br>Nhận thêm nhánh: <i>Bếp nướng, Thảm dã ngoại & Đèn bão</i></div>' +
        '</div>';
    }

    var petMsg = (typeof SAVE !== 'undefined' && SAVE.activePet === 'character07')
        ? 'Meo meo! Tuyệt vời quá! Khu trại của chúng mình vừa thăng cấp rồi!'
        : 'Gâu gâu! Tuyệt vời quá! Trại viên vừa đạt cột mốc cấp độ mới!';

    var html = '<div class="level-up-popup">' +
        '<div class="level-up-badge-wrap">' +
            '<div class="level-up-big-num">Lv.' + info.level + '</div>' +
        '</div>' +
        '<div class="level-up-title">THĂNG CẤP TRẠI VIÊN!</div>' +
        '<div class="level-up-sub">' + petMsg + '</div>' +
        genHtml +
        '<div class="level-up-rewards-grid">' +
            '<div class="level-up-rw-item">' +
                '<img src="assets/images_webp/ui/icon_nangluong.webp" alt="Năng lượng">' +
                '<span>+' + info.energy + ' Năng Lượng</span>' +
            '</div>' +
            '<div class="level-up-rw-item">' +
                '<img src="assets/images_webp/ui/icon_glod.webp" alt="Vàng">' +
                '<span>+' + info.coins.toLocaleString('vi-VN') + ' Vàng</span>' +
            '</div>' +
            '<div class="level-up-rw-item">' +
                '<img src="assets/images_webp/ui/icon_ruby.webp" alt="Kim Cương">' +
                '<span>+' + info.gems + ' Kim Cương</span>' +
            '</div>' +
        '</div>' +
        '<div class="modal-buttons">' +
            '<button class="modal-btn primary btn-levelup-confirm" id="btn-levelup-confirm">TIẾP TỤC</button>' +
        '</div>' +
    '</div>';

    var overlay = createModal(html, 'level-up-modal-card', 'CHÚC MỪNG LÊN CẤP!');
    var confirmBtn = overlay.querySelector('#btn-levelup-confirm');
    if (confirmBtn) {
        confirmBtn.onclick = closeModal;
    }
}

function openCampJourneyModal(playerLevel, playerExp) {
    playerLevel = playerLevel || (SAVE && SAVE.playerLevel) || 1;
    playerExp = playerExp || (SAVE && SAVE.playerExp) || 0;
    var expNeeded = (typeof getExpRequiredForLevel === 'function') ? getExpRequiredForLevel(playerLevel) : 100;
    var pct = Math.min(100, Math.floor((playerExp / expNeeded) * 100));

    var milestones = [
        {
            lv: 1,
            title: 'Khu Trại Khởi Đầu',
            desc: 'Xe Kéo Cắm Trại mở sẵn (Bàn, Ghế, Lều) • Đơn tối đa Lv.4',
            icon: '🏕️'
        },
        {
            lv: 2,
            title: 'Đón Ánh Hoàng Hôn',
            desc: '+25 ⚡, +300 🪙, +2 💎 • Đơn tối đa Lv.5',
            icon: '⛏️'
        },
        {
            lv: 3,
            title: 'Mở Khóa Ô Đá Tầng 1',
            desc: 'Mở 8 ô đá tầng 1 • +25 ⚡, +350 🪙, +2 💎',
            icon: '🔓',
            special: true
        },
        {
            lv: 4,
            title: 'Mở Khóa Ba Lô Dã Ngoại',
            desc: '🎉 Mở máy phát 2: Ba Lô • Rơi 50% đồ Lv.2 • +25 ⚡, +400 🪙, +2 💎',
            icon: '🎒',
            special: true
        },
        {
            lv: 5,
            title: 'Khai Phá Bãi Cỏ Rộng',
            desc: 'Mở 3 ô đá tầng 1 • Rơi 50% đồ Lv.2 • +25 ⚡, +450 🪙, +5 💎 (Mốc Gem)',
            icon: '🌿',
            special: true
        },
        {
            lv: 6,
            title: 'Đường Mòn Ven Suối',
            desc: 'Máy phát nâng lên 75% đồ Lv.2 • +25 ⚡, +500 🪙, +2 💎 • Đơn mở rộng Lv.7',
            icon: '💧'
        },
        {
            lv: 7,
            title: 'Mở Khóa Thùng Bếp & Sinh Tồn',
            desc: '🎉 Mở máy phát 3: Thùng Bếp • Mở 7 ô đá tầng 2 • +25 ⚡, +550 🪙, +2 💎',
            icon: '🧰',
            special: true
        },
        {
            lv: 8,
            title: 'Đỉnh Cao Máy Phát Lv.3',
            desc: '⚡ Máy phát bứt phá sinh đồ Lv.3 (25%), Lv.2 (60%) • +25 ⚡, +600 🪙, +2 💎',
            icon: '⚡',
            special: true
        },
        {
            lv: 9,
            title: 'Bứt Phá Giới Hạn',
            desc: '+25 ⚡, +650 🪙, +2 💎 • Đơn hàng Lv.9 (Hải Sản Hấp Tôm Ngao)',
            icon: '🔥'
        },
        {
            lv: 10,
            title: 'Chuyên Gia Cắm Trại Lv.10',
            desc: '+25 ⚡, +700 🪙, +5 💎 (Mốc Gem) • Đơn tối đa Lv.10',
            icon: '🏕️',
            special: true
        },
        {
            lv: 11,
            title: 'Mở Rộng Đất Tầng 2',
            desc: 'Mở 4 ô đá tầng 2 • +25 ⚡, +750 🪙, +2 💎',
            icon: '🔓',
            special: true
        },
        {
            lv: 12,
            title: 'Thử Thách Nguồn Điện',
            desc: '+25 ⚡, +800 🪙, +2 💎 • Pin Năng Lượng Mặt Trời & Đơn Lv.10',
            icon: '🔋'
        },
        {
            lv: 13,
            title: 'Biệt Thự Glamping',
            desc: '+25 ⚡, +850 🪙, +2 💎 • Lều Đường Hầm & Đơn Lv.11',
            icon: '⛺'
        },
        {
            lv: 15,
            title: 'Bậc Thầy Cắm Trại',
            desc: 'Mở 5 ô đá tầng 3 • +25 ⚡, +950 🪙, +5 💎 (Mốc Gem) • Lều Mái Vòm Sàn Gỗ',
            icon: '⭐',
            special: true
        },
        {
            lv: 18,
            title: 'Giải Phóng Toàn Bộ Bàn Cờ',
            desc: 'Mở sạch 5 ô đá tầng 3 cuối cùng • +25 ⚡, +1.100 🪙, +2 💎',
            icon: '🏆',
            special: true
        },
        {
            lv: 20,
            title: 'Đỉnh Cao Dã Ngoại Toàn Game',
            desc: 'Mở trọn bộ siêu phẩm Lv.12 tối thượng & Danh hiệu Thủ Lĩnh Dã Ngoại • +25 ⚡, +1.200 🪙, +5 💎',
            icon: '👑',
            special: true
        }
    ];

    var listHtml = milestones.map(function (m) {
        var isPassed = playerLevel > m.lv;
        var isCurrent = playerLevel === m.lv;
        var statusClass = isPassed ? 'passed' : (isCurrent ? 'current' : 'locked');
        var badgeText = isPassed ? '✓ Đã mở' : (isCurrent ? 'Đang tiến tới' : 'Cần Lv.' + m.lv);
        return '<div class="journey-item ' + statusClass + (m.special ? ' special-milestone' : '') + '">' +
            '<div class="journey-info">' +
                '<div class="journey-title">Cấp ' + m.lv + ': ' + m.title + '</div>' +
                '<div class="journey-desc">' + m.desc + '</div>' +
            '</div>' +
            '<div class="journey-status-badge">' + badgeText + '</div>' +
        '</div>';
    }).join('');

    var activePetId = (typeof SAVE !== 'undefined' && SAVE.activePet) ? SAVE.activePet : 'character01';
    var petInfo = (typeof PET_CHARACTERS !== 'undefined' && Array.isArray(PET_CHARACTERS))
        ? PET_CHARACTERS.find(function (p) { return p.id === activePetId; })
        : null;
    var petImg = (petInfo && petInfo.img)
        ? petInfo.img
        : ((activePetId === 'character07') ? 'assets/images_webp/ui/character07.webp' : 'assets/images_webp/ui/character01.webp');
    var petName = (petInfo && petInfo.name)
        ? petInfo.name
        : ((activePetId === 'character07') ? 'Mèo Anh' : 'Chú Chó Golden');

    var html = '<div class="camp-journey-popup">' +
        '<div class="journey-header-card">' +
            '<img src="' + petImg + '" alt="Thú cưng" class="journey-pet-avatar">' +
            '<div class="journey-header-info">' +
                '<div class="journey-player-title">Trại Viên & ' + petName + '</div>' +
                '<div class="journey-level-val">Cấp Độ Hiện Tại: <b>Lv.' + playerLevel + '</b></div>' +
                '<div class="journey-exp-bar-wrap">' +
                    '<div class="journey-exp-fill" style="width:' + pct + '%"></div>' +
                    '<span class="journey-exp-text">' + playerExp + ' / ' + expNeeded + ' EXP (' + pct + '%)</span>' +
                '</div>' +
            '</div>' +
        '</div>' +
        '<div class="journey-sub-title">CỘT MỐC HÀNH TRÌNH DÃ NGOẠI</div>' +
        '<div class="journey-milestones-list">' + listHtml + '</div>' +
        '<div class="modal-buttons">' +
            '<button class="modal-btn primary" id="btn-journey-close">ĐÓNG</button>' +
        '</div>' +
    '</div>';

    var overlay = createModal(html, 'journey-modal-card', 'HÀNH TRÌNH CẮM TRẠI');
    var closeBtn = overlay.querySelector('#btn-journey-close');
    if (closeBtn) closeBtn.onclick = closeModal;

    // Tự động cuộn nhẹ đến cột mốc cấp độ hiện tại để người chơi dễ quan sát
    var curEl = overlay.querySelector('.journey-item.current');
    if (curEl) {
        setTimeout(function () {
            curEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }, 120);
    }
}

function initGame() {
    cleanOrphanedFx();
    if (typeof I18N !== 'undefined') {
        I18N.updateStaticHtml();
        I18N.syncItemChainsLanguage();
    }
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
    if (btnRefillEnergy) btnRefillEnergy.onclick = () => {
        if (document.getElementById('modal-overlay')) return;
        openEnergyShop();
    };
    var btnGemShop = document.getElementById('btn-gem-shop');
    if (btnGemShop) btnGemShop.onclick = () => {
        if (document.getElementById('modal-overlay')) return;
        openGemShop();
    };
    var btnCoinShop = document.getElementById('btn-coin-shop');
    if (btnCoinShop) btnCoinShop.onclick = () => {
        if (document.getElementById('modal-overlay')) return;
        openCoinShop();
    };
    var btnLuckyDrop = document.getElementById('btn-lucky-drop');
    if (btnLuckyDrop) btnLuckyDrop.onclick = () => {
        if (document.getElementById('modal-overlay')) return;
        openLuckyDrop();
    };


    var btnCamp = document.getElementById('btn-camp');
    if (btnCamp) btnCamp.onclick = () => {
        if (document.getElementById('modal-overlay')) return;
        openCamp(null, null);
    };

    var btnBook = document.getElementById('btn-book');
    if (btnBook) {
        var bookSecretTapCount = 0;
        var bookSecretTapResetTimer = null;
        var bookSingleClickTimer = null;

        btnBook.onclick = (e) => {
            if (e) e.stopPropagation();

            bookSecretTapCount++;

            // Mỗi lần chạm trong chuỗi, hủy lệnh mở Cẩm Nang đơn
            if (bookSingleClickTimer) {
                clearTimeout(bookSingleClickTimer);
                bookSingleClickTimer = null;
            }

            // Hẹn giờ reset nếu người dùng ngừng chạm quá 1.5s
            if (bookSecretTapResetTimer) {
                clearTimeout(bookSecretTapResetTimer);
            }
            bookSecretTapResetTimer = setTimeout(() => {
                bookSecretTapCount = 0;
            }, 1500);

            // Đạt đủ 5 lần chạm liên tục: Kích hoạt BẬT hoặc TẮT công cụ Test bí mật
            if (bookSecretTapCount >= 5) {
                bookSecretTapCount = 0;
                if (bookSecretTapResetTimer) clearTimeout(bookSecretTapResetTimer);
                if (bookSingleClickTimer) clearTimeout(bookSingleClickTimer);

                // Đóng modal cẩm nang nếu đang mở
                if (typeof closeModal === 'function') closeModal();

                var isCurrentlyOn = !!(typeof SAVE !== 'undefined' && SAVE && SAVE.settings && SAVE.settings.showTestTool);
                var newState = !isCurrentlyOn;

                if (typeof setDevToolEnabled === 'function') {
                    setDevToolEnabled(newState);
                } else if (typeof SAVE !== 'undefined' && SAVE && SAVE.settings) {
                    SAVE.settings.showTestTool = newState;
                    if (typeof saveGame === 'function') saveGame();
                    if (typeof updateDevToolVisibility === 'function') updateDevToolVisibility();
                }

                if (typeof playSound === 'function') playSound('win');
                if (typeof showToast === 'function') {
                    if (newState) {
                        showToast('🛠️ Đã BẬT công cụ Test bí mật!', '#2e7d32');
                    } else {
                        showToast('🔒 Đã TẮT công cụ Test bí mật!', '#c62828');
                    }
                }
                return;
            }

            // Nếu chạm 1 lần bình thường, sau 280ms không bấm tiếp thì mở Cẩm Nang
            bookSingleClickTimer = setTimeout(() => {
                bookSecretTapCount = 0;
                if (document.getElementById('modal-overlay')) return;
                openDiscoveryBook();
            }, 280);
        };
    }

    var btnMap = document.getElementById('btn-world-map');
    if (btnMap) {
        btnMap.onclick = () => {
            if (document.getElementById('modal-overlay')) return;
            openCampJourneyModal(SAVE.playerLevel, SAVE.playerExp);
        };
    }

    var btnSettings = document.getElementById('btn-settings');
    if (btnSettings) {
        btnSettings.onclick = () => {
            if (document.getElementById('modal-overlay')) return;
            openSettingsModal({
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
                showToast('Đã đặt lại dữ liệu ban đầu!');
            }
        });
        };
    }

    if (btnSell) {
        var onSellBtnClick = function (e) {
            if (e) {
                e.stopPropagation();
                e.preventDefault();
            }
            if (btnSell.classList.contains('disabled') || selectedIndex === null) return;
            sellItemAtIndex(selectedIndex);
        };
        btnSell.onclick = onSellBtnClick;
        btnSell.addEventListener('pointerdown', function (e) {
            e.stopPropagation();
        });
    }

    var btnMyCamp = document.getElementById('btn-my-camp');
    if (btnMyCamp) {
        btnMyCamp.onclick = () => {
            if (typeof openMyCamp === 'function') openMyCamp();
        };
    }

    var btnPowerBoost = document.getElementById('btn-power-boost');
    if (btnPowerBoost) {
        btnPowerBoost.onclick = function (e) {
            if (e) e.stopPropagation();
            togglePowerBoost();
        };
    }
    var btnStorage = document.getElementById('btn-storage');
    if (btnStorage) {
        btnStorage.onclick = function (e) {
            if (e) e.stopPropagation();
            openStorageModal();
        };
    }
    var btnStarChest = document.getElementById('btn-star-chest');
    if (btnStarChest) {
        btnStarChest.onclick = function (e) {
            if (e) e.stopPropagation();
            openStarChest();
        };
    }
    updatePowerBoostUI();
    updateStorageUI();
    updateStarChestUI();

    if (npcAvatarBtn) {
        npcAvatarBtn.onclick = () => {
            showIdleHint(true);
        };
    }
    if (npcSpeechBubble) {
        npcSpeechBubble.onclick = () => {
            var dlg = (typeof LEVEL_STORY_DIALOGUES !== 'undefined') ? LEVEL_STORY_DIALOGUES[currentLevel] : null;
            var texts = dlg && Array.isArray(dlg.texts) ? dlg.texts : [];
            if (texts.length > 1 && storyStepIndex < texts.length - 1) {
                advanceStoryStep();
                return;
            }
            hideNpcBubble();
            clearTutorialHand();
        };
    }

    // Theo dõi tương tác màn hình để reset bộ đếm 10 giây không tương tác
    function onUserScreenActivity(e) {
        if (hintTimer) clearTimeout(hintTimer);
        if (!levelWon && !document.getElementById('modal-overlay')) {
            hintTimer = setTimeout(function () {
                showIdleHint(false);
            }, HINT_DELAY_MS);
        }
        if (e && e.target && e.target.closest) {
            var isSpeechTrigger = e.target.closest('.pet-group-avatar-wrap') ||
                e.target.closest('#npc-avatar-btn') ||
                e.target.closest('.tray-item-slot') ||
                e.target.closest('#grid-board .cell') ||
                e.target.closest('#npc-speech-bubble');
            if (!isSpeechTrigger) {
                hideNpcBubble();
            }
        }
    }
    document.addEventListener('pointerdown', onUserScreenActivity, true);
    document.addEventListener('keydown', onUserScreenActivity, true);

    var startLv = Math.max(SAVE.level || 1, 1);
    getLevelConfig(startLv);
    loadLevel(startLv, { restoreState: true });
    applyElapsedEnergyRegen(false);

    // Bắt tương tác đầu tiên của người chơi để kích hoạt BGM nhẹ nhàng (tuân thủ autoplay policy)
    function onFirstUserGesture() {
        initAudio();
        updateBgmPlayback();
        document.removeEventListener('pointerdown', onFirstUserGesture, true);
        document.removeEventListener('keydown', onFirstUserGesture, true);
    }
    document.addEventListener('pointerdown', onFirstUserGesture, true);
    document.addEventListener('keydown', onFirstUserGesture, true);

    // Tự động lưu nguyên trạng bàn cờ đang chơi khi thoát hoặc đổi tab
    window.addEventListener('beforeunload', persistCurrentBoardState);
    window.addEventListener('pagehide', persistCurrentBoardState);

    window.loadLevel = loadLevel;
    window.persistCurrentBoardState = persistCurrentBoardState;
    window.executeMoveAndEffects = executeMoveAndEffects;
    window.sellItemAtIndex = sellItemAtIndex;
    window.updateOrderActionTutorials = updateOrderActionTutorials;
    window.checkAndShowTentLv4Hint = checkAndShowTentLv4Hint;
    window.placePendingGeneratorOnBoard = placePendingGeneratorOnBoard;
    window.handleGeneratorClick = handleGeneratorClick;
    window.deliverPetOrderGroup = deliverPetOrderGroup;
    window.renderOrders = renderOrders;
    window.renderBoard = renderBoard;
    window.findOrderMatch = findOrderMatch;

    if (typeof enhanceAll3sButtons === 'function') {
        enhanceAll3sButtons(document.body);
    }

    // Hiển thị gò cỏ và đám mây sau cùng khi bàn cờ và thú cưng đã sẵn sàng
    revealNpcStageBg();
}

// ==========================================
// TẢI VÀ HIỆN ẢNH NỀN NPC (npc_bg.webp) SAU CÙNG
// Tránh hiện tượng ảnh gò cỏ xuất hiện trước lơ lửng khi bàn chơi chưa render xong
// ==========================================
function revealNpcStageBg() {
    var cloudWrap = document.getElementById('npc-stage-cloud');
    if (cloudWrap) {
        var cloudImg = cloudWrap.querySelector('.npc-stage-cloud-img');
        if (cloudImg) {
            var cSrc = cloudImg.getAttribute('data-src') || 'assets/images_webp/background/may1.webp';
            if (!cloudImg.src || cloudImg.src.indexOf('may1.webp') === -1) {
                cloudImg.src = cSrc;
            }
        }
    }

    // Đợi một nhịp ngắn sau khi bàn cờ 7x9 và thú cưng đã render xong rồi mới fade-in mượt mà
    requestAnimationFrame(function () {
        setTimeout(function () {
            if (cloudWrap) cloudWrap.classList.add('is-ready');
        }, 150);
    });
}

// ==========================================
// CHẾ ĐỘ ×2 NĂNG LƯỢNG (POWER BOOST) & RƯƠNG SAO (STAR CHEST)
// ==========================================
function getPowerBoostMultiplier() {
    return 1;
}

function updatePowerBoostUI() {
    var btn = document.getElementById('btn-power-boost');
    var lbl = document.getElementById('power-boost-label');
    if (!btn || !lbl) return;
    var isBoost = (getPowerBoostMultiplier() === 2);
    btn.classList.toggle('is-active', isBoost);
    lbl.textContent = isBoost ? 'X2' : 'X1';
}

function togglePowerBoost() {
    if (typeof SAVE === 'undefined' || !SAVE) return;
    SAVE.powerBoost = (SAVE.powerBoost === 2) ? 1 : 2;
    updatePowerBoostUI();
    playSound('click');
    if (typeof saveGame === 'function') saveGame();
    if (typeof showToast === 'function') {
        showToast(SAVE.powerBoost === 2
            ? '⚡ Đã bật chế độ ×2: Tốn 2⚡ mỗi lần chạm để rớt đồ +1 cấp!'
            : '⚡ Đã chuyển về chế độ ×1 bình thường.', 2400);
    }
}

// Mốc sao tích lũy cho rương kế tiếp: khoảng cách tăng dần 10 → 12 → 14 ... tối đa 30 sao/rương
function getStarChestStep(chestIdx) {
    return Math.min(30, 10 + chestIdx * 2);
}

function getNextStarChestTarget() {
    var claimed = (typeof SAVE !== 'undefined' && SAVE && Array.isArray(SAVE.claimedStarChests))
        ? SAVE.claimedStarChests.length
        : 0;
    var total = 0;
    for (var i = 0; i <= claimed; i++) total += getStarChestStep(i);
    return total;
}

function updateStarChestUI(isOpeningNow) {
    var btn = document.getElementById('btn-star-chest');
    var iconEl = document.getElementById('star-chest-icon');
    if (!btn) return;
    var stars = (typeof SAVE !== 'undefined' && SAVE && typeof SAVE.questStars === 'number') ? SAVE.questStars : 0;
    var target = getNextStarChestTarget();
    var isReady = stars >= target;
    btn.classList.toggle('is-ready', isReady);
    btn.classList.toggle('is-opening', !!isOpeningNow);
    if (iconEl) {
        iconEl.src = isOpeningNow
            ? 'assets/images_webp/ui/icon_ruongmo.webp'
            : 'assets/images_webp/ui/icon_ruongdong.webp';
    }
}

function openStarChest() {
    if (typeof SAVE === 'undefined' || !SAVE) return;
    if (document.getElementById('star-chest-opening-overlay')) return;
    if (!Array.isArray(SAVE.claimedStarChests)) SAVE.claimedStarChests = [];
    var stars = SAVE.questStars || 0;
    var target = getNextStarChestTarget();
    if (stars < target) {
        var activePetId = SAVE.activePet || 'character01';
        var msg = 'Bạn đã nhận được ' + stars + '/' + target + ' Sao. Hãy hoàn thành thêm nhiệm vụ để mở rương nhé!';
        playSound('click');
        if (typeof setPetSpeech === 'function') {
            setPetSpeech(activePetId, msg, 3600);
        } else if (typeof showToast === 'function') {
            showToast(msg, 3000);
        }
        return;
    }

    SAVE.claimedStarChests.push(target);
    var chestNum = SAVE.claimedStarChests.length;
    var nextTarget = getNextStarChestTarget();
    var energyRw = 25;
    var coinRw = 300 + Math.min(20, chestNum) * 100;
    var gemRw = 2 + Math.min(4, Math.floor(chestNum / 3));

    playerEnergy = Math.min(getEnergyOverflowCap(), playerEnergy + energyRw);
    playerCoins += coinRw;
    playerGems += gemRw;
    SAVE.energy = playerEnergy;
    SAVE.coins = playerCoins;
    SAVE.gems = playerGems;

    updateStarChestUI(true);
    playSound('click');
    if (typeof saveGame === 'function') saveGame();

    var chestFrames = [
        'assets/images_webp/ui/icon_ruong_anim0.webp',
        'assets/images_webp/ui/icon_ruong_anim0a.webp',
        'assets/images_webp/ui/icon_ruong_anim1.webp',
        'assets/images_webp/ui/icon_ruong_anim2.webp',
        'assets/images_webp/ui/icon_ruong_anim3.webp'
    ];
    chestFrames.forEach(function (src) {
        var pre = new Image();
        pre.src = src;
    });

    var overlay = document.createElement('div');
    overlay.id = 'star-chest-opening-overlay';
    overlay.className = 'star-chest-opening-overlay';
    overlay.innerHTML =
        '<div class="star-chest-opening-backdrop"></div>' +
        '<div class="star-chest-opening-stage">' +
            '<img src="assets/images_webp/ui/star_reward.webp" class="star-chest-title-img" alt="Star Reward!">' +
            '<div class="star-chest-progress-line">' +
                '<span>' + stars + '/' + target + '</span>' +
                '<img src="assets/images_webp/ui/icon_star.webp" alt="⭐">' +
            '</div>' +
            '<div class="star-chest-card" id="star-chest-card">' +
                '<div class="star-chest-rewards-row is-visible" id="star-chest-rewards-row">' +
                    '<div class="star-chest-rw-inline" id="star-chest-rw-0"><span class="rw-plus">+' + energyRw + '</span><img src="assets/images_webp/ui/icon_nangluong.webp" alt="Năng lượng"></div>' +
                    '<div class="star-chest-rw-inline" id="star-chest-rw-1"><span class="rw-plus">+' + coinRw.toLocaleString('vi-VN') + '</span><img src="assets/images_webp/ui/icon_glod.webp" alt="Vàng"></div>' +
                    '<div class="star-chest-rw-inline" id="star-chest-rw-2"><span class="rw-plus">+' + gemRw + '</span><img src="assets/images_webp/ui/icon_ruby.webp" alt="Kim Cương"></div>' +
                '</div>' +
                '<div class="star-chest-hero-wrap">' +
                    '<div class="star-chest-glow-ring" id="star-chest-glow-ring"></div>' +
                    '<div class="star-chest-shockwave" id="star-chest-shockwave" aria-hidden="true"></div>' +
                    '<canvas id="star-chest-fx-canvas" class="star-chest-fx-canvas" width="320" height="320" aria-hidden="true"></canvas>' +
                    '<img id="star-chest-hero-img" class="star-chest-hero-img is-bouncing" src="' + chestFrames[0] + '" alt="Rương Sao">' +
                '</div>' +
                '<div class="star-chest-next-line">' +
                    '<span>Mốc nhận thưởng tiếp theo ' + nextTarget + '</span>' +
                    '<img src="assets/images_webp/ui/icon_star.webp" alt="⭐">' +
                '</div>' +
            '</div>' +
            '<div class="star-chest-tap-hint is-visible" id="star-chest-tap-hint">Chạm vào rương để mở quà!</div>' +
        '</div>';
    document.body.appendChild(overlay);

    var heroImg = overlay.querySelector('#star-chest-hero-img');
    var glowRing = overlay.querySelector('#star-chest-glow-ring');
    var shockwave = overlay.querySelector('#star-chest-shockwave');
    var fxCanvas = overlay.querySelector('#star-chest-fx-canvas');
    var fxCtx = fxCanvas ? fxCanvas.getContext('2d') : null;
    var tapHint = overlay.querySelector('#star-chest-tap-hint');
    var rwItems = [
        overlay.querySelector('#star-chest-rw-0'),
        overlay.querySelector('#star-chest-rw-1'),
        overlay.querySelector('#star-chest-rw-2')
    ];

    var openStep = 0; // 0: chưa mở (đang rung rinh), 1..3: đã mở từng món quà
    var tapLocked = false;
    var canBackdropClose = false;
    var activeParticles = [];
    var fxAnimId = null;

    var draw4PointStar = function (ctx, x, y, r, rot, color, alpha) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.beginPath();
        for (var i = 0; i < 8; i++) {
            var rad = (i % 2 === 0) ? r : r * 0.36;
            var a = (i * Math.PI) / 4;
            if (i === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
            else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    };

    var tickChestParticles = function () {
        if (!fxCtx || !fxCanvas || !document.body.contains(overlay)) {
            fxAnimId = null;
            return;
        }
        fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
        fxCtx.save();
        fxCtx.globalCompositeOperation = 'lighter';

        for (var i = activeParticles.length - 1; i >= 0; i--) {
            var p = activeParticles[i];
            p.life += 1;
            if (p.life >= p.maxLife) {
                activeParticles.splice(i, 1);
                continue;
            }
            p.vx *= p.drag;
            p.vy = p.vy * p.drag + p.gravity;
            p.x += p.vx;
            p.y += p.vy;
            p.rot += p.vRot;

            var t = p.life / p.maxLife;
            var alpha = t < 0.15 ? (t / 0.15) : Math.max(0, 1 - Math.pow((t - 0.15) / 0.85, 1.6));
            var scale = 1 - t * 0.45;

            if (p.kind === 'star') {
                draw4PointStar(fxCtx, p.x, p.y, p.size * scale, p.rot, p.color, alpha);
            } else if (p.kind === 'ribbon') {
                fxCtx.save();
                fxCtx.translate(p.x, p.y);
                fxCtx.rotate(p.rot);
                fxCtx.scale(Math.cos(p.life * 0.25), 1);
                fxCtx.globalAlpha = alpha * 0.95;
                fxCtx.fillStyle = p.color;
                fxCtx.fillRect(-p.size * 0.65, -p.size * 0.28, p.size * 1.3, p.size * 0.56);
                fxCtx.restore();
            } else {
                fxCtx.save();
                fxCtx.globalAlpha = alpha * 0.9;
                fxCtx.fillStyle = p.color;
                fxCtx.beginPath();
                fxCtx.arc(p.x, p.y, Math.max(1, p.size * 0.45 * scale), 0, Math.PI * 2);
                fxCtx.fill();
                fxCtx.restore();
            }
        }

        fxCtx.restore();
        if (activeParticles.length > 0) {
            fxAnimId = requestAnimationFrame(tickChestParticles);
        } else {
            fxAnimId = null;
        }
    };

    var spawnChestSparkleBurst = function (count) {
        if (!fxCtx || !fxCanvas) return;
        var total = count || 28;
        var cx = fxCanvas.width * 0.5;
        var cy = fxCanvas.height * 0.48;
        var colors = ['#ffe082', '#ffd54f', '#fff59d', '#ff8a65', '#80deea', '#f48fb1', '#ffffff'];
        var kinds = ['star', 'star', 'ribbon', 'orb'];

        for (var i = 0; i < total; i++) {
            var angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.65;
            var speed = 3.2 + Math.random() * 5.8;
            activeParticles.push({
                x: cx + (Math.random() - 0.5) * 26,
                y: cy + (Math.random() - 0.5) * 18,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1.4,
                gravity: 0.14 + Math.random() * 0.08,
                drag: 0.965,
                size: 6 + Math.random() * 7,
                rot: Math.random() * Math.PI * 2,
                vRot: (Math.random() - 0.5) * 0.24,
                color: colors[i % colors.length],
                kind: kinds[i % kinds.length],
                life: 0,
                maxLife: 34 + Math.floor(Math.random() * 24)
            });
        }

        if (shockwave) {
            shockwave.classList.remove('is-active');
            void shockwave.offsetWidth;
            shockwave.classList.add('is-active');
        }

        if (!fxAnimId) {
            fxAnimId = requestAnimationFrame(tickChestParticles);
        }
    };

    var closeChestOverlay = function () {
        if (fxAnimId) {
            cancelAnimationFrame(fxAnimId);
            fxAnimId = null;
        }
        if (overlay && overlay.parentNode) overlay.remove();
        updateStarChestUI(false);
    };

    var runChestOpenFrames = function (stepNum, isFinal) {
        if (!document.body.contains(overlay) || !heroImg) return;
        heroImg.classList.remove('is-bouncing', 'is-opened', 'is-step-pop');
        heroImg.src = chestFrames[0];
        void heroImg.offsetWidth;
        heroImg.classList.add('is-step-pop');

        setTimeout(function () {
            if (!document.body.contains(overlay) || !heroImg) return;
            heroImg.src = chestFrames[1];
        }, 50);

        setTimeout(function () {
            if (!document.body.contains(overlay) || !heroImg) return;
            heroImg.src = chestFrames[2];
        }, 100);

        setTimeout(function () {
            if (!document.body.contains(overlay) || !heroImg) return;
            heroImg.src = chestFrames[3];
        }, 150);

        setTimeout(function () {
            if (!document.body.contains(overlay) || !heroImg) return;
            heroImg.src = chestFrames[4];
            heroImg.classList.remove('is-step-pop');
            heroImg.classList.add('is-opened');

            var rwEl = rwItems[stepNum - 1];
            if (rwEl) rwEl.classList.add('is-revealed');

            if (stepNum === 1) {
                playSound('bonus');
                spawnChestSparkleBurst(26);
                if (typeof spawnFlyingCurrency === 'function') {
                    spawnFlyingCurrency(heroImg, 'energy', energyRw);
                }
                if (tapHint) tapHint.textContent = 'Chạm vào rương để nhận quà tiếp (1/3)';
            } else if (stepNum === 2) {
                playSound('bonus');
                spawnChestSparkleBurst(32);
                if (typeof spawnFlyingCurrency === 'function') {
                    spawnFlyingCurrency(heroImg, 'gold', coinRw);
                }
                if (tapHint) tapHint.textContent = 'Chạm vào rương để nhận quà cuối (2/3)';
            } else if (stepNum === 3) {
                if (glowRing) glowRing.classList.add('is-burst');
                playSound('win');
                spawnChestSparkleBurst(46);
                updateUIStats();
                if (typeof spawnFlyingCurrency === 'function') {
                    spawnFlyingCurrency(heroImg, 'ruby', gemRw);
                }
                if (tapHint) tapHint.textContent = 'Đã nhận đủ quà! Chạm ra ngoài để đóng';
                setTimeout(function () {
                    if (document.body.contains(overlay)) canBackdropClose = true;
                }, 400);
            }

            tapLocked = false;
        }, 200);
    };

    var playChest4FrameSequence = function (stepNum, isFinal) {
        if (!heroImg) return;
        if (stepNum === 1) {
            runChestOpenFrames(stepNum, isFinal);
            return;
        }
        // Từ lần chạm thứ 2 trở đi: diễn ngược từ frame mở (4 -> 3 -> 2 -> 1 -> 0) để đóng rương mượt rồi mở bung lại
        heroImg.classList.remove('is-bouncing', 'is-opened', 'is-step-pop');
        heroImg.src = chestFrames[4];
        setTimeout(function () {
            if (!document.body.contains(overlay) || !heroImg) return;
            heroImg.src = chestFrames[3];
        }, 38);
        setTimeout(function () {
            if (!document.body.contains(overlay) || !heroImg) return;
            heroImg.src = chestFrames[2];
        }, 76);
        setTimeout(function () {
            if (!document.body.contains(overlay) || !heroImg) return;
            heroImg.src = chestFrames[1];
        }, 114);
        setTimeout(function () {
            if (!document.body.contains(overlay) || !heroImg) return;
            runChestOpenFrames(stepNum, isFinal);
        }, 152);
    };

    var cardEl = overlay.querySelector('#star-chest-card');
    var handleChestTap = function (e) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        if (!document.body.contains(overlay) || tapLocked) return;

        if (openStep >= 3) {
            // Sau khi mở hết 3 quà: chỉ tắt khi người chơi chạm ra ngoài khung thẻ (hoặc đợi hết 5s)
            if (canBackdropClose && cardEl && !cardEl.contains(e.target)) {
                closeChestOverlay();
            }
            return;
        }

        tapLocked = true;
        openStep++;
        playChest4FrameSequence(openStep, openStep >= 3);
    };

    overlay.addEventListener('click', handleChestTap);
}

// ==========================================
// CHUỖI VÀNG / NĂNG LƯỢNG TRÊN BÀN, BONG BÓNG GHÉP ĐỒ & KHO LƯU TRỮ TẠM
// ==========================================
function collectBoardCurrencyAtIndex(idx) {
    var item = boardData[idx];
    if (!item || !item.id || typeof getBoardCurrencyInfo !== 'function') return;
    var info = getBoardCurrencyInfo(item.id);
    if (!info) return;

    var cellEl = boardElement && boardElement.children[idx];
    if (info.type === 'coin') {
        playerCoins += info.value;
        SAVE.coins = playerCoins;
        if (cellEl) {
            spawnFlyingCurrency(cellEl, 'gold', info.value);
            triggerParticleBurst(cellEl, ['#ffd700', '#ffeb3b', '#ffffff']);
            showFloatingBadge(cellEl, '+' + info.value + ' 🪙', '#2e7d32');
        }
    } else {
        playerEnergy = Math.min(getEnergyOverflowCap(), playerEnergy + info.value);
        SAVE.energy = playerEnergy;
        if (cellEl) {
            spawnFlyingCurrency(cellEl, 'energy', info.value);
            triggerParticleBurst(cellEl, ['#fff700', '#ff9800', '#ffffff']);
            showFloatingBadge(cellEl, '+' + info.value + ' ⚡', '#e65100');
        }
    }

    playSound('bonus');
    boardData[idx] = makeEmptyCell();
    if (selectedIndex === idx) {
        selectedIndex = null;
        updateSellButton(null);
    }
    persistCurrentBoardState();
    updateUIStats();
    renderBoard();
}

function tickBoardBubbles() {
    if (!Array.isArray(boardData) || !boardElement) return;
    var now = Date.now();
    var anyExpired = false;
    for (var i = 0; i < boardData.length; i++) {
        var c = boardData[i];
        if (!c || !c.isBubble) continue;
        var remMs = (c.bubbleExpiresAt || 0) - now;
        if (remMs <= 0) {
            boardData[i] = makeEmptyCell();
            anyExpired = true;
            if (boardElement.children[i]) {
                triggerParticleBurst(boardElement.children[i], ['#b3e5fc', '#81d4fa', '#ffffff']);
                showFloatingBadge(boardElement.children[i], '🫧 Bong bóng tan!', '#0288d1');
            }
        }
    }
    if (anyExpired) {
        persistCurrentBoardState();
        renderBoard();
    }
}

function openBubbleModal(idx) {
    var cell = boardData[idx];
    if (!cell || !cell.isBubble || !cell.id) return;
    var itemId = cell.id;
    var lv = itemLv(itemId);
    var name = (typeof getItemDisplayName === 'function') ? getItemDisplayName(itemId) : itemId;
    var imgPath = getItemImagePath(itemId);
    // Giá Kim Cương cân đối theo năng lượng thực tế (EV máy phát tăng ở cấp cao, 1💎 = 10⚡)
    var bubbleGemTable = { 4: 2, 5: 3, 6: 5, 7: 7, 8: 10, 9: 14 };
    var gemCost = bubbleGemTable[lv] || Math.max(2, Math.round(lv * 1.5));
    var bubbleAdsLeft = (typeof getAdsLeft === 'function') ? getAdsLeft('bubble') : 5;
    var canWatchAd = (lv <= 7 && bubbleAdsLeft > 0 && typeof simulateWatchAd === 'function');
    var secLeft = Math.max(1, Math.ceil(((cell.bubbleExpiresAt || Date.now()) - Date.now()) / 1000));

    var adBtnHtml = (lv <= 7 && typeof simulateWatchAd === 'function')
        ? '<button class="modal-btn ' + (canWatchAd ? 'primary' : 'disabled-btn') + '" id="btn-bubble-ad"' + (canWatchAd ? '' : ' disabled') + '>XEM ADS MỞ NGAY (' + bubbleAdsLeft + ' lượt)</button>'
        : '';

    var html = '<div class="level-up-popup">' +
        '<div class="bubble-modal-preview-wrap" style="position:relative;width:86px;height:86px;margin:0 auto 8px;">' +
            '<img src="' + imgPath + '" class="bubble-modal-inner-item" style="width:64px;height:64px;object-fit:contain;margin:11px;" alt="">' +
            '<img src="assets/images_webp/items/icon_bongbong.webp" class="bubble-modal-outer-shell" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;pointer-events:none;" alt="">' +
        '</div>' +
        '<div class="level-up-title">🫧 BONG BÓNG MAY MẮN</div>' +
        '<div class="level-up-sub"><b>' + name + '</b> (Lv.' + lv + ')<br>Hãy mở ngay trước khi bong bóng tự tan biến nhé!</div>' +
        '<div class="modal-buttons" style="flex-direction:column;gap:8px;margin-top:12px;">' +
            adBtnHtml +
            '<button class="modal-btn gem-btn" id="btn-bubble-gem">MỞ BẰNG ' + gemCost + ' KIM CƯƠNG</button>' +
            '<button class="modal-btn" id="btn-bubble-pop" style="background:#eceff1;color:#37474f;">Chọc vỡ (Giải phóng ô)</button>' +
        '</div>' +
    '</div>';

    var overlay = createModal(html, 'level-up-modal-card', 'BONG BÓNG VẬT PHẨM');

    var unlockBubble = function () {
        if (!boardData[idx] || !boardData[idx].isBubble) return;
        boardData[idx].isBubble = false;
        delete boardData[idx].bubbleExpiresAt;
        playSound('win');
        persistCurrentBoardState();
        renderBoard();
        if (boardElement && boardElement.children[idx]) {
            triggerParticleBurst(boardElement.children[idx], ['#b3e5fc', '#ffd700', '#ffffff']);
        }
    };

    var adBtn = overlay.querySelector('#btn-bubble-ad');
    if (adBtn && canWatchAd) {
        adBtn.onclick = function () {
            closeModal();
            simulateWatchAd('Mở Bong Bóng: ' + name, function () {
                if (typeof consumeAd === 'function') consumeAd('bubble');
                unlockBubble();
            });
        };
    }

    var gemBtn = overlay.querySelector('#btn-bubble-gem');
    if (gemBtn) {
        gemBtn.onclick = function () {
            if (playerGems < gemCost) {
                if (typeof showToast === 'function') showToast('Chưa đủ ' + gemCost + ' 💎!', '#c62828');
                return;
            }
            playerGems -= gemCost;
            SAVE.gems = playerGems;
            closeModal();
            unlockBubble();
            updateUIStats();
            if (typeof saveGame === 'function') saveGame();
        };
    }

    var popBtn = overlay.querySelector('#btn-bubble-pop');
    if (popBtn) {
        popBtn.onclick = function () {
            closeModal();
            if (!boardData[idx] || !boardData[idx].isBubble) return;
            boardData[idx] = makeEmptyCell();
            playSound('bubble');
            if (boardElement && boardElement.children[idx]) {
                triggerParticleBurst(boardElement.children[idx], ['#b3e5fc', '#81d4fa', '#ffffff']);
                showFloatingBadge(boardElement.children[idx], '🫧 Đã chọc vỡ!', '#0288d1');
            }
            persistCurrentBoardState();
            renderBoard();
        };
    }
}

var CAMP_STORAGE_CAP = 4;

function updateStorageUI() {
    var lbl = document.getElementById('storage-count-label');
    if (!lbl) return;
    var cnt = (typeof SAVE !== 'undefined' && SAVE && Array.isArray(SAVE.campStorage)) ? SAVE.campStorage.length : 0;
    lbl.textContent = cnt + '/' + CAMP_STORAGE_CAP;
}

function stashBoardItemToStorage(idx) {
    if (typeof SAVE === 'undefined' || !SAVE) return;
    if (!Array.isArray(SAVE.campStorage)) SAVE.campStorage = [];
    var item = boardData[idx];
    if (!item || !item.id || item.isRock || item.isLocked || item.isBubble || GENERATORS[item.id]) {
        if (typeof showToast === 'function') showToast('Không thể cất ô này vào Kho tạm!', '#c62828');
        return;
    }
    if (SAVE.campStorage.length >= CAMP_STORAGE_CAP) {
        if (typeof showToast === 'function') showToast('Kho tạm đã đầy (' + CAMP_STORAGE_CAP + '/' + CAMP_STORAGE_CAP + ')!', '#e65100');
        return;
    }
    SAVE.campStorage.push(item.id);
    boardData[idx] = makeEmptyCell();
    selectedIndex = null;
    updateSellButton(null);
    playSound('spawn');
    persistCurrentBoardState();
    updateStorageUI();
    renderBoard();
    if (typeof showToast === 'function') showToast('📦 Đã cất vào Kho tạm!', '#2e7d32');
}

function openStorageModal() {
    if (typeof SAVE === 'undefined' || !SAVE) return;
    if (!Array.isArray(SAVE.campStorage)) SAVE.campStorage = [];

    var slotsHtml = '';
    for (var i = 0; i < CAMP_STORAGE_CAP; i++) {
        var itId = SAVE.campStorage[i] || null;
        if (itId) {
            var itName = (typeof getItemDisplayName === 'function') ? getItemDisplayName(itId) : itId;
            slotsHtml += '<div class="storage-slot-card filled" data-sidx="' + i + '" title="Chạm để lấy ' + itName + ' ra bàn">' +
                '<img src="' + getItemImagePath(itId) + '" alt="">' +
            '</div>';
        } else {
            slotsHtml += '<div class="storage-slot-card"><span style="opacity:0.45;font-size:11px;">Trống</span></div>';
        }
    }

    var canStashSelected = (selectedIndex !== null && boardData[selectedIndex] && boardData[selectedIndex].id &&
        !boardData[selectedIndex].isRock && !boardData[selectedIndex].isLocked && !boardData[selectedIndex].isBubble &&
        !GENERATORS[boardData[selectedIndex].id] && SAVE.campStorage.length < CAMP_STORAGE_CAP);

    var stashBtnHtml = canStashSelected
        ? '<button class="modal-btn primary" id="btn-stash-selected">Cất món đang chọn</button>'
        : '';

    var html = '<div class="level-up-popup">' +
        '<div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:6px;">' +
            '<img src="assets/images_webp/ui/icon_box.webp" style="width:36px;height:36px;object-fit:contain;" alt="">' +
            '<div class="level-up-title" style="margin:0;">KHO LƯU TRỮ TẠM (' + SAVE.campStorage.length + '/' + CAMP_STORAGE_CAP + ')</div>' +
        '</div>' +
        '<div class="level-up-sub">Kéo đồ trên bàn thả vào biểu tượng Kho, hoặc chạm món trong Kho để đặt lại ra bàn!</div>' +
        '<div class="storage-grid">' + slotsHtml + '</div>' +
        '<div class="modal-buttons">' +
            stashBtnHtml +
            '<button class="modal-btn" id="btn-storage-close" style="background:#eceff1;color:#37474f;">Đóng</button>' +
        '</div>' +
    '</div>';

    var overlay = createModal(html, 'level-up-modal-card', 'KHO ĐỒ TẠM');
    overlay.querySelectorAll('.storage-slot-card.filled').forEach(function (card) {
        card.onclick = function () {
            var sIdx = parseInt(card.dataset.sidx, 10);
            var itId = SAVE.campStorage[sIdx];
            if (!itId) return;
            var empties = (typeof getEmptyIndexes === 'function') ? getEmptyIndexes(boardData) : [];
            if (!empties.length) {
                if (typeof showToast === 'function') showToast('Bàn cờ đang đầy, hãy ghép hoặc dọn 1 ô trống!', '#c62828');
                return;
            }
            var targetIdx = empties[0];
            boardData[targetIdx] = { id: itId, isRock: false, isLocked: false };
            SAVE.campStorage.splice(sIdx, 1);
            playSound('spawn');
            closeModal();
            persistCurrentBoardState();
            updateStorageUI();
            renderBoard();
        };
    });

    var stashBtn = overlay.querySelector('#btn-stash-selected');
    if (stashBtn) {
        stashBtn.onclick = function () {
            closeModal();
            stashBoardItemToStorage(selectedIndex);
        };
    }
    var closeBtn = overlay.querySelector('#btn-storage-close');
    if (closeBtn) closeBtn.onclick = closeModal;
}

initGame();