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
var btnSell = document.getElementById('btn-sell');
var sellPriceUI = document.getElementById('sell-price');
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
// ÂM THANH TIẾNG SÁO TRÚC NGŨ CUNG (WEB AUDIO SYNTHESIZER) & RUNG CẢM ỨNG
// ==========================================
var audioCtx = null;
var mergeComboStep = 0;
var lastMergeAudioTs = 0;

// Thang âm Sáo Trúc Ngũ Cung ấm áp (C5, D5, E5, G5, A5, C6, D6, E6, G6, A6)
var FLUTE_PENTATONIC_SCALE = [
    523.25, 587.33, 659.25, 783.99, 880.00,
    1046.50, 1174.66, 1318.51, 1567.98, 1760.00
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

// Hàm tổng hợp âm sắc Tiếng Sáo Trúc (Fundamental Sine + Soft Harmonic + Luyến ngón + Vibrato nhẹ)
function playFluteNote(freq, startTime, duration, peakGain, graceRatio) {
    if (!audioCtx) return;
    var mainOsc = audioCtx.createOscillator();
    var harmOsc = audioCtx.createOscillator();
    var filter = audioCtx.createBiquadFilter();
    var mainGain = audioCtx.createGain();
    var harmGain = audioCtx.createGain();

    mainOsc.type = 'sine';
    harmOsc.type = 'sine';

    // Bộ lọc thông thấp giữ âm sáo tròn, ấm, không chói gắt
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2100, startTime);

    var startFreq = graceRatio ? freq * graceRatio : freq;
    mainOsc.frequency.setValueAtTime(startFreq, startTime);
    harmOsc.frequency.setValueAtTime(startFreq * 2, startTime);
    if (graceRatio) {
        mainOsc.frequency.exponentialRampToValueAtTime(freq, startTime + 0.045);
        harmOsc.frequency.exponentialRampToValueAtTime(freq * 2, startTime + 0.045);
    }

    // Rung hơi sáo tự nhiên (Vibrato LFO 5.5Hz)
    if (duration >= 0.18) {
        var lfo = audioCtx.createOscillator();
        var lfoGain = audioCtx.createGain();
        lfo.frequency.setValueAtTime(5.5, startTime);
        lfoGain.gain.setValueAtTime(3.2, startTime);
        lfo.connect(lfoGain);
        lfoGain.connect(mainOsc.frequency);
        lfo.start(startTime + 0.05);
        lfo.stop(startTime + duration);
    }

    // Bao hình hơi thổi êm (Soft Attack & Natural Release)
    var attack = Math.min(0.028, duration * 0.25);
    mainGain.gain.setValueAtTime(0.001, startTime);
    mainGain.gain.linearRampToValueAtTime(peakGain, startTime + attack);
    mainGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    harmGain.gain.setValueAtTime(0.001, startTime);
    harmGain.gain.linearRampToValueAtTime(peakGain * 0.16, startTime + attack);
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

function playSound(type, itemId) {
    try {
        if (SAVE.settings && !SAVE.settings.sound) return;
        initAudio();
        if (!audioCtx) return;
        var now = audioCtx.currentTime;

        if (type === 'spawn') {
            // Tiếng gõ ống trúc / giọt sương nhẹ nhàng khi lấy đồ
            playFluteNote(392.00, now, 0.09, 0.10, 0.92);
        } else if (type === 'merge') {
            // Chuỗi giai điệu Sáo Trúc tăng dần theo nhịp ghép liên tiếp & cấp độ vật phẩm
            var nowMs = Date.now();
            if (nowMs - lastMergeAudioTs < 4500) {
                mergeComboStep = Math.min(mergeComboStep + 1, FLUTE_PENTATONIC_SCALE.length - 2);
            } else {
                var itemLv = 2;
                if (itemId && itemId.indexOf('_lv') !== -1) {
                    itemLv = parseInt(itemId.split('_lv')[1]) || 2;
                }
                mergeComboStep = Math.min(Math.max(itemLv - 2, 0), 4);
            }
            lastMergeAudioTs = nowMs;

            var n1 = FLUTE_PENTATONIC_SCALE[mergeComboStep];
            var n2 = FLUTE_PENTATONIC_SCALE[Math.min(mergeComboStep + 1, FLUTE_PENTATONIC_SCALE.length - 1)];

            // Nốt luyến mở đầu nhẹ + Nốt chính ngân vang ấm áp như tiếng sáo diều/sáo trúc
            playFluteNote(n1, now, 0.11, 0.13, 0.95);
            playFluteNote(n2, now + 0.065, 0.28, 0.18, 0.94);
            triggerVibrate(15);
        } else if (type === 'bonus') {
            // Tiếng sáo đôi trong trẻo khi nhận hộp tiếp tế
            playFluteNote(587.33, now, 0.14, 0.14, 0.95);
            playFluteNote(880.00, now + 0.08, 0.26, 0.17, 0.95);
        } else if (type === 'win') {
            // Khúc sáo trúc khải hoàn 5 nốt ngũ cung
            var winNotes = [523.25, 587.33, 659.25, 783.99, 1046.50];
            winNotes.forEach((freq, idx) => {
                var dur = (idx === winNotes.length - 1) ? 0.42 : 0.18;
                playFluteNote(freq, now + idx * 0.095, dur, 0.18, 0.96);
            });
            triggerVibrate([30, 50, 40]);
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
// HỆ THỐNG 3 NHÂN VẬT ĐỒNG HÀNH (GẤU NÂU - CÁO ĐỎ - DẾ MÈN)
// Luân phiên xuất hiện trò chuyện theo kịch bản 45 Level & hướng dẫn người chơi
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
        : { id: 'gau', name: '🐻 Bác Gấu Nâu', avatar: 'assets/images/items/avata_gau.png' };
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
    var npc = getNpcById(npcId || getCurrentNpcId());
    if (npcAvatarImg && npc.avatar) {
        if (npcAvatarImg.getAttribute('src') !== npc.avatar) {
            npcAvatarImg.setAttribute('src', npc.avatar);
        }
        npcAvatarImg.setAttribute('alt', npc.name);
    }
    if (npcSpeakerName) {
        npcSpeakerName.textContent = npc.name;
    }
    if (npcMoodDot) {
        npcMoodDot.textContent = moodEmoji || '💡';
    }
    if (npcBubbleTimer) {
        clearTimeout(npcBubbleTimer);
        npcBubbleTimer = null;
    }
    // Không hiện bong bóng thoại nếu đang mở bất kỳ bảng Modal nào
    if (document.getElementById('modal-overlay')) {
        hideNpcBubble();
        return;
    }
    if (speechText && npcSpeechBubble && npcSpeechText) {
        var oldToast = document.getElementById('game-toast');
        if (oldToast) oldToast.remove();
        npcSpeechText.textContent = speechText;
        npcSpeechBubble.style.display = 'block';
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
        setNpcState('cao', '❗', 'Đủ món lên hình rồi! Chạm vào ô NỘP màu xanh bên cạnh mình để giao đơn nhận Xu nhé!', 0);
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
            setNpcState('de', '🕸️', 'Kéo ' + itemName + ' thả đè lên ô Mạng Nhện 🕸️ cùng loại để phá nhện và nâng cấp nhé!', 0);
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
                ? 'Chào mừng tới Bữa Sáng Khởi Đầu! Chạm vào Thùng Đá ở giữa bàn cờ để chuẩn bị đồ ăn sáng cùng mình nhé!'
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

    // Chỉ hiển thị lời chào mở màn ngắn gọn (3.2s) khi mới bước vào Level (Lv 2 - 45)
    if (!levelIntroShown && typeof LEVEL_STORY_DIALOGUES !== 'undefined' && LEVEL_STORY_DIALOGUES[currentLevel]) {
        levelIntroShown = true;
        var story = LEVEL_STORY_DIALOGUES[currentLevel];
        setNpcState(story.npc, '💬', story.text, 3200);
        hintTimer = setTimeout(() => showIdleHint(false), HINT_DELAY_MS);
        return;
    }

    var readyCard = ordersContainer ? ordersContainer.querySelector('.order-card.ready') : null;
    if (readyCard) {
        if (npcMoodDot) npcMoodDot.textContent = '❗';
    } else {
        if (npcMoodDot) npcMoodDot.textContent = '💡';
    }
    hintTimer = setTimeout(() => showIdleHint(false), HINT_DELAY_MS);
}

function buildCharacterHintText(npcId, actionType, itemName, lvName) {
    if (actionType === 'deliver') {
        if (npcId === 'gau') return 'Món ăn nóng hổi xong rồi kìa! Chạm vào ô NỘP màu xanh bên cạnh mình để nhận Xu nhé!';
        if (npcId === 'cao') return 'Đơn hàng đẹp chuẩn góc máy rồi! Bấm vào ô NỘP màu xanh bên cạnh mình ngay nào!';
        return 'Mục tiêu đã hoàn tất! Hãy chạm vào ô NỘP màu xanh bên cạnh để giao hàng nhận thưởng!';
    }
    if (actionType === 'merge_web') {
        if (npcId === 'gau') return 'Trong màn "' + lvName + '", bạn thử kéo ' + itemName + ' vào ô Mạng Nhện 🕸️ đang sáng để dọn chỗ nấu nướng nhé!';
        if (npcId === 'cao') return 'Góc chụp đang vướng nhện kìa! Kéo ' + itemName + ' đè lên ô Mạng Nhện 🕸️ cùng loại để phá nhện nhé!';
        return 'Theo sổ tay sinh tồn: Ghép cặp ' + itemName + ' đang nhấp nháy sẽ phá vỡ lớp Mạng Nhện 🕸️ ngay lập tức!';
    }
    if (actionType === 'merge_free') {
        if (npcId === 'gau') return 'Mình thấy 2 ' + itemName + ' giống nhau kìa, ghép chúng lại để chuẩn bị đơn hàng cho "' + lvName + '" nhé!';
        if (npcId === 'cao') return 'Thử ghép 2 ' + itemName + ' đang sáng xem sao, lên cấp nhìn sẽ xịn hơn nhiều đấy!';
        return 'Phân tích bàn cờ: Nước đi tối ưu lúc này là ghép cặp ' + itemName + ' đang nhấp nháy!';
    }
    if (actionType === 'spawn') {
        if (npcId === 'gau') return 'Bàn cờ hết cặp ghép rồi, chạm vào Nguồn phát đang lấp lánh để lấy thêm nguyên liệu cho "' + lvName + '" nhé!';
        if (npcId === 'cao') return 'Chạm vào túi/thùng nguồn phát đang lấp lánh để mở thêm đồ cắm trại mới nào!';
        return 'Hiện chưa có cặp ghép khả dụng. Hãy chạm vào Nguồn phát đang sáng để bổ sung vật phẩm lên bàn cờ!';
    }
    return '';
}

function showIdleHint(isManualClick) {
    if (levelWon || dragState || document.getElementById('modal-overlay')) return;
    clearHintVisuals();

    var lvName = (currentLevelCfg && currentLevelCfg.name) ? currentLevelCfg.name : ('Màn ' + currentLevel);

    // Nếu người chơi chủ động bấm vào Avatar nhân vật -> Đổi lượt nhân vật và hiện bong bóng trò chuyện + gợi ý
    if (isManualClick) {
        var speakerId = getNextNpcId();
        var readyCard = ordersContainer ? ordersContainer.querySelector('.order-card.ready') : null;
        if (readyCard) {
            showTutorialHandTap(readyCard);
            setNpcState(speakerId, '❗', buildCharacterHintText(speakerId, 'deliver', '', lvName), 3500);
            return;
        }

        var bestManual = findBestMerge(boardData, currentOrders, currentLevelCfg);
        if (bestManual) {
            var cFromM = boardElement.children[bestManual.from];
            var cToM = boardElement.children[bestManual.to];
            if (cFromM) cFromM.classList.add('hint-pulse');
            if (cToM) cToM.classList.add('hint-pulse');
            var itemNameM = getItemDisplayName(boardData[bestManual.from].id);
            var isWebM = boardData[bestManual.to] && boardData[bestManual.to].isLocked;
            setNpcState(speakerId, '💡', buildCharacterHintText(speakerId, isWebM ? 'merge_web' : 'merge_free', itemNameM, lvName), 3500);
            return;
        }

        var emptiesM = getEmptyIndexes(boardData);
        if (playerEnergy > 0 && emptiesM.length > 0) {
            boardData.forEach((c, idx) => {
                if (c && GENERATORS[c.id] && !c.isLocked && boardElement.children[idx]) {
                    boardElement.children[idx].classList.add('hint-pulse');
                }
            });
            setNpcState(speakerId, '⚡', buildCharacterHintText(speakerId, 'spawn', '', lvName), 3500);
            return;
        }

        if (playerEnergy <= 0) {
            setNpcState('gau', '⚡', 'Hết năng lượng mất rồi! Bấm vào biểu tượng ⚡ ở góc trên để nghỉ ngơi tiếp sức nhé!', 3500);
            return;
        }
        if (emptiesM.length === 0) {
            setNpcState('de', '🗑️', 'Bàn cờ đầy kín rồi! Hãy chạm chọn 1 món cấp thấp rồi bấm nút BÁN ở dưới để giải phóng ô trống nhé!', 3500);
        }
        return;
    }

    // Gợi ý tự động sau 10s không thao tác: CHỈ làm sáng nhẹ ô trên bàn cờ (.hint-pulse), KHÔNG bật popup/bong bóng thoại gây rối!
    var best = findBestMerge(boardData, currentOrders, currentLevelCfg);
    if (best) {
        var cFrom = boardElement.children[best.from];
        var cTo = boardElement.children[best.to];
        if (cFrom) cFrom.classList.add('hint-pulse');
        if (cTo) cTo.classList.add('hint-pulse');
        return;
    }

    var empties = getEmptyIndexes(boardData);
    if (playerEnergy > 0 && empties.length > 0) {
        boardData.forEach((c, idx) => {
            if (c && GENERATORS[c.id] && !c.isLocked && boardElement.children[idx]) {
                boardElement.children[idx].classList.add('hint-pulse');
            }
        });
        return;
    }

    // Chỉ khi bàn cờ thực sự kẹt cứng (đầy bàn & không còn nước ghép) mới nhắc nhẹ
    if (empties.length === 0) {
        setNpcState('de', '🗑️', 'Bàn cờ đầy kín rồi! Hãy chọn 1 món cấp thấp rồi bấm nút BÁN ở dưới nhé!', 3500);
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

    levelBudget = computeEnergyBudget(boardData, orderIds, currentLevelCfg);
    playerEnergy = levelBudget;
    SAVE.lastEnergyTs = Date.now();

    if (isAutoEnabled) {
        fillBoardInstantly();
    }

    renderBoard();
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
    for (var i = 0; i < TOTAL_CELLS; i++) {
        var cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = i;

        var itemData = boardData[i];
        cell.classList.add(itemData && itemData.isRock ? 'bg-rock' : ((Math.floor(i / COLS) + (i % COLS)) % 2 === 0 ? 'bg-light' : 'bg-dark'));
        if (selectedIndex === i) cell.classList.add('selected');

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

function updateUIStats() {
    if (energyUI) energyUI.innerText = playerEnergy;
    if (coinUI) coinUI.innerText = playerCoins;
    if (gemUI) gemUI.innerText = playerGems;
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
                    o.done = true;
                    tutDeliveredOnce = true;
                    boardData[matchIdx] = makeEmptyCell();
                    var rw = orderReward(o.id);
                    playerCoins += rw;
                    playSound('win');
                    updateUIStats();
                    selectedIndex = null;
                    updateSellButton(null);

                    if (isAutoEnabled) fillBoardInstantly();
                    renderBoard();

                    // Nếu chưa thắng màn, chỉ hiện lời khen ngắn gọn từ nhân vật (không bắn thêm Toast trùng lặp)
                    if (!levelWon) {
                        var celebNpc = getNextNpcId();
                        var celebMsg = celebNpc === 'gau'
                            ? 'Tuyệt cú mèo! Đã nhận +' + rw + ' 💰, cùng làm món tiếp theo nào!'
                            : (celebNpc === 'cao'
                                ? 'Đẹp xuất sắc! Đã nhận +' + rw + ' 💰 từ đơn hàng!'
                                : 'Hoàn thành đơn hàng (+' + rw + ' 💰)! Tiếp tục nhé!');
                        setNpcState(celebNpc, '🎉', celebMsg, 2600);
                    }
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

    if (levelStatusMsg) {
        var allDone = currentOrders.every(o => o.done);
        var maxLv = RAW_LEVELS.length;
        var tags = [];
        if (currentLevelCfg && currentLevelCfg.bonus) tags.push('🎁Tiếp tế');
        if (currentLevelCfg && currentLevelCfg.spreadEvery) tags.push('🕸️Nhện lan');
        var suffix = tags.length ? ' • ' + tags.join(' ') : '';
        levelStatusMsg.innerText = (allDone && webs === 0)
            ? `🎉 THẮNG!`
            : (allDone ? "Phá nốt nhện!" : `Lv ${currentLevel}/${maxLv}${suffix}`);
        levelStatusMsg.className = (allDone && webs === 0) ? 'win' : '';
        if (allDone && webs === 0 && !levelWon) {
            levelWon = true;
            hideNpcBubble();
            clearHintVisuals();
            setTimeout(finishLevel, 650);
        }
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

    if (res.type === 'move') {
        playSound('spawn');
    } else if (res.type === 'merge') {
        tutMergeCount++;
        playSound('merge', res.newId);
        clearedWebs = clearAdjacentWebs(boardData, res.index, currentLevelCfg);
        bonusIdx = bonusDrop(boardData, currentLevelCfg, res.newId);
    }

    if (isAutoEnabled) fillBoardInstantly();
    renderBoard();

    if (res.type === 'merge') {
        var mergedCell = boardElement.children[res.index];
        triggerParticleBurst(mergedCell);
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
            showToast('💎 Đã nạp siêu tốc +' + GEM_ENERGY_PACK + ' năng lượng!', '#1565c0');
        },
        onRescue: function () {
            playerEnergy += 20;
            levelBudget += 20;
            playSound('bonus');
            updateUIStats();
            renderBoard();
            showToast('🏕️ Kiểm lâm tiếp viện +20 ⚡ miễn phí!', '#2e7d32');
        }
    });
}

function updateSellButton(itemId) {
    if (!btnSell || !sellPriceUI) return;
    if (!itemId || GENERATORS[itemId]) {
        btnSell.classList.add('disabled');
        sellPriceUI.innerText = '0';
    } else {
        sellPriceUI.innerText = sellPrice(itemId);
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
    var base = 50 + currentLevel * 10 + stars * 20;
    var coins = firstTime ? base : Math.round(base * 0.25);
    var gems = firstTime ? (stars === 3 ? 3 : 1) : 0;

    playerCoins += coins;
    playerGems += gems;
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
    if (btnToggleAuto) {
        if (isAutoEnabled) {
            btnToggleAuto.textContent = "⚡ AUTO: ON";
            btnToggleAuto.classList.add('active');
            fillBoardInstantly();
            renderBoard();
        } else {
            btnToggleAuto.textContent = "⚡ AUTO: OFF";
            btnToggleAuto.classList.remove('active');
        }
    }
}

function initGame() {
    refreshLevelSelect();
    if (levelSelect) {
        levelSelect.onchange = e => {
            var targetLv = parseInt(e.target.value);
            var unlockAll = SAVE.settings && SAVE.settings.unlockAllLevels;
            if (!unlockAll && targetLv > SAVE.maxLevel) {
                showToast('🔒 Màn này chưa mở! Bật "Mở khóa 45 màn" trong ⚙️ nếu muốn test.', '#c62828');
                levelSelect.value = currentLevel;
                return;
            }
            loadLevel(targetLv);
        };
    }
    if (btnPrevLv) btnPrevLv.onclick = () => { if (currentLevel > 1) loadLevel(currentLevel - 1); };
    if (btnNextLv) btnNextLv.onclick = () => {
        if (currentLevel < RAW_LEVELS.length) {
            var unlockAll = SAVE.settings && SAVE.settings.unlockAllLevels;
            if (!unlockAll && currentLevel + 1 > SAVE.maxLevel) {
                showToast('🔒 Hãy thắng màn hiện tại trước (hoặc mở khóa trong ⚙️)!', '#c62828');
                return;
            }
            loadLevel(currentLevel + 1);
        }
    };
    if (btnResetLv) btnResetLv.onclick = () => loadLevel(currentLevel);

    if (btnRefillEnergy) btnRefillEnergy.onclick = openEnergyShop;
    var btnGemShop = document.getElementById('btn-gem-shop');
    if (btnGemShop) btnGemShop.onclick = openEnergyShop;
    var btnCoinShop = document.getElementById('btn-coin-shop');
    if (btnCoinShop) btnCoinShop.onclick = openEnergyShop;

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

    if (btnToggleAuto) {
        btnToggleAuto.textContent = "⚡ AUTO: OFF";
        btnToggleAuto.classList.remove('active');
        btnToggleAuto.onclick = toggleAutoDebug;
    }

    if (btnSell) btnSell.onclick = () => {
        if (btnSell.classList.contains('disabled') || selectedIndex === null) return;
        var soldId = boardData[selectedIndex].id;
        var price = sellPrice(soldId);
        playerCoins += price;
        boardData[selectedIndex] = makeEmptyCell();
        selectedIndex = null;
        updateSellButton(null);
        showToast('🪙 Đã bán: +' + price + ' 💰', '#5d4037');

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
}

initGame();