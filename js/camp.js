// ==========================================
// HỆ THỐNG MODAL GIAO DIỆN:
// 1. Toast thông báo mượt (thay thế alert)
// 2. Màn hình Chiến Thắng (Win Modal)
// 3. Khu Cắm Trại Tương Tác (Camp Modal)
// 4. Cửa Hàng Năng Lượng & Cứu Trợ Kiểm Lâm (Energy Shop Modal)
// 5. Cẩm Nang Sưu Tập 72 Vật Phẩm (Discovery Book Modal)
// 6. Bản Đồ Hành Trình 45 Màn Chơi (World Map Modal)
// 7. Cài Đặt Hệ Thống & Chọn Màn Chơi (Settings Modal)
// ==========================================

var ICON_GOLD_HTML = '<img class="inline-ui-icon" src="assets/images/ui/icon_glod.png" alt="Vàng">';
var ICON_RUBY_HTML = '<img class="inline-ui-icon" src="assets/images/ui/icon_ruby.png" alt="Kim cương">';
var ICON_ENERGY_HTML = '<img class="inline-ui-icon" src="assets/images/ui/icon_nangluong.png" alt="Năng lượng">';

// ==========================================
// HỆ THỐNG NÚT 3 MẢNH (3-SLICE BUTTON SYSTEM)
// Giữ nguyên tỉ lệ 2 đầu (aspect-ratio: 60/124), chỉ co giãn ngang phần giữa (center).
// Hỗ trợ 4 màu (Green, Blue, Orange-Red, Gray) và 5 kích thước chuẩn 4/8pt (24, 28, 32, 44, 48px).
// ==========================================
function enhance3sButton(btn) {
    if (!btn || btn.nodeType !== 1) return;
    var matches = btn.classList.contains('btn-3s') ||
                  btn.classList.contains('modal-btn') ||
                  btn.classList.contains('footer-img-btn') ||
                  btn.classList.contains('pet-action-btn') ||
                  btn.classList.contains('loc-action-btn') ||
                  btn.classList.contains('st-act-btn') ||
                  btn.classList.contains('camp-tab-btn');
    if (!matches) return;

    if (!btn.querySelector('.btn-3s-bg')) {
        var bg = document.createElement('span');
        bg.className = 'btn-3s-bg';
        bg.setAttribute('aria-hidden', 'true');
        bg.innerHTML = '<span class="b3-left"></span><span class="b3-mid"></span><span class="b3-right"></span>';

        var existingText = btn.querySelector('.btn-3s-text, .footer-btn-label');
        if (!existingText) {
            var txt = document.createElement('span');
            txt.className = 'btn-3s-text';
            while (btn.firstChild) {
                txt.appendChild(btn.firstChild);
            }
            btn.appendChild(bg);
            btn.appendChild(txt);
        } else {
            btn.insertBefore(bg, existingText);
        }
    }
}

function enhanceAll3sButtons(root) {
    var scope = root || document;
    if (scope.nodeType === 1 && (
        scope.classList.contains('btn-3s') ||
        scope.classList.contains('modal-btn') ||
        scope.classList.contains('footer-img-btn') ||
        scope.classList.contains('pet-action-btn') ||
        scope.classList.contains('loc-action-btn') ||
        scope.classList.contains('st-act-btn') ||
        scope.classList.contains('camp-tab-btn')
    )) {
        enhance3sButton(scope);
    }
    if (scope.querySelectorAll) {
        var btns = scope.querySelectorAll('.btn-3s, .modal-btn, .footer-img-btn, .pet-action-btn, .loc-action-btn, .st-act-btn, .camp-tab-btn');
        btns.forEach(enhance3sButton);
    }
}

function setBtnText(btn, text) {
    if (!btn) return;
    var label = btn.querySelector('.btn-3s-text, .footer-btn-label');
    if (label) {
        label.innerText = text;
    } else {
        btn.innerText = text;
        enhance3sButton(btn);
    }
}

window.enhance3sButton = enhance3sButton;
window.enhanceAll3sButtons = enhanceAll3sButtons;
window.setBtnText = setBtnText;

// MutationObserver tự động phát hiện và áp dụng 3-mảnh cho bất kỳ nút mới nào thêm vào DOM
if (typeof MutationObserver !== 'undefined' && typeof document !== 'undefined') {
    var btnObserver = new MutationObserver(function (mutations) {
        mutations.forEach(function (m) {
            if (m.type === 'childList') {
                m.addedNodes.forEach(function (node) {
                    if (node && node.nodeType === 1) {
                        enhanceAll3sButtons(node);
                    }
                });
            }
        });
    });
    if (document.body) {
        btnObserver.observe(document.body, { childList: true, subtree: true });
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            btnObserver.observe(document.body, { childList: true, subtree: true });
        });
    }
}

function closeModal() {
    if (typeof window.stopWinFireworks === 'function') {
        window.stopWinFireworks();
    }
    var canvas = document.getElementById('win-fireworks-canvas');
    if (canvas) canvas.remove();
    var modals = document.querySelectorAll('#modal-overlay, .modal-overlay, [id^="modal-overlay"]');
    modals.forEach(function (m) {
        m.remove();
    });
}

function createModal(innerHtml, extraClass, titleText) {
    closeModal();
    var oldToast = document.getElementById('game-toast');
    if (oldToast) oldToast.remove();
    if (typeof hideNpcBubble === 'function') hideNpcBubble();
    if (typeof clearHintVisuals === 'function') clearHintVisuals();

    // Triệt để dọn dẹp các lớp overlay hoặc modal-box cũ còn sót
    var leftovers = document.querySelectorAll('#modal-overlay, .modal-overlay');
    leftovers.forEach(function (el) { el.remove(); });

    var overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    var isWinModal = extraClass && extraClass.indexOf('win-box') !== -1;
    if (isWinModal) {
        overlay.classList.add('win-modal-overlay');
    }

    var ribbonHtml = (titleText && !isWinModal) ? ('<div class="popup-ribbon"><span>' + titleText + '</span></div>') : '';
    var bg3sliceHtml = !isWinModal ? ('<div class="popup-bg-3slice" aria-hidden="true">' +
            '<div class="p3-top"></div>' +
            '<div class="p3-mid"></div>' +
            '<div class="p3-bot"></div>' +
        '</div>') : '';

    overlay.innerHTML = '<div class="modal-box ' + (extraClass || '') + '">' +
        ribbonHtml +
        bg3sliceHtml +
        '<div class="modal-content-wrap">' + innerHtml + '</div>' +
    '</div>';

    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeModal();
    });

    document.body.appendChild(overlay);
    enhanceAll3sButtons(overlay);
    return overlay;
}

// ---------- 1. TOAST THÔNG BÁO (THAY THẾ ALERT) ----------
// Màu nền duy nhất chuẩn 3d221b trong suốt 86% (rgba(61, 34, 27, 0.86)), độ dài tối đa <= 48 ký tự
var toastTimer = null;
function showToast(msg) {
    var old = document.getElementById('game-toast');
    if (old) old.remove();
    if (toastTimer) clearTimeout(toastTimer);

    var cleanMsg = (msg || '').trim();
    if (cleanMsg.length > 48) {
        cleanMsg = cleanMsg.slice(0, 47) + '…';
    }

    var t = document.createElement('div');
    t.id = 'game-toast';
    t.style.background = 'rgba(61, 34, 27, 0.86)';
    t.textContent = cleanMsg;
    document.body.appendChild(t);

    toastTimer = setTimeout(function () {
        if (t.parentNode) t.remove();
    }, 1800);
}

// ---------- HIỆU ỨNG PHÁO HOA ĂN MỪNG CHIẾN THẮNG ----------
function startWinFireworks(targetOverlay, starCount) {
    if (typeof window.stopWinFireworks === 'function') {
        window.stopWinFireworks();
    }
    var oldCanvas = document.getElementById('win-fireworks-canvas');
    if (oldCanvas) oldCanvas.remove();

    var canvas = document.createElement('canvas');
    canvas.id = 'win-fireworks-canvas';
    canvas.style.position = 'fixed';
    canvas.style.inset = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '200001';

    var parent = targetOverlay || document.body;
    parent.appendChild(canvas);

    var ctx = canvas.getContext('2d');
    var w = canvas.width = window.innerWidth;
    var h = canvas.height = window.innerHeight;

    var handleResize = function () {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    var particles = [];
    var rockets = [];
    var isRunning = true;
    var animId = null;

    var colors = [
        '#ff1744', '#f50057', '#d500f9', '#651fff',
        '#00e5ff', '#00e676', '#ffea00', '#ff9100',
        '#ffffff', '#ff80ab', '#ffd700'
    ];

    function createExplosion(x, y, count, baseColor) {
        var pCount = count || 65;
        for (var i = 0; i < pCount; i++) {
            var angle = Math.random() * Math.PI * 2;
            var speed = 2.4 + Math.random() * 5.6;
            var col = baseColor || colors[Math.floor(Math.random() * colors.length)];
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                alpha: 1,
                decay: 0.012 + Math.random() * 0.016,
                color: col,
                size: 2.4 + Math.random() * 2.8,
                gravity: 0.08
            });
        }
    }

    function launchRocket() {
        if (!isRunning) return;
        var startX = w * (0.15 + Math.random() * 0.7);
        var targetY = h * (0.12 + Math.random() * 0.28);
        rockets.push({
            x: startX,
            y: h,
            targetY: targetY,
            vy: -(8.5 + Math.random() * 4),
            color: colors[Math.floor(Math.random() * colors.length)]
        });
    }

    // Nổ đợt đầu chúc mừng ngay lập tức (1 sao, 2 sao hay 3 sao đều có)
    setTimeout(function () {
        createExplosion(w * 0.28, h * 0.22, 75, '#ffd700');
        createExplosion(w * 0.72, h * 0.24, 75, '#00e5ff');
    }, 100);
    setTimeout(function () {
        createExplosion(w * 0.5, h * 0.16, 95, '#ff4081');
    }, 320);

    // Nếu đạt 3 sao thì nổ thêm đợt kim tuyến bùng nổ hoành tráng
    if (starCount >= 3) {
        setTimeout(function () {
            createExplosion(w * 0.38, h * 0.28, 80, '#ffeb3b');
            createExplosion(w * 0.62, h * 0.28, 80, '#d500f9');
        }, 550);
    }

    var launchInterval = setInterval(function () {
        if (!isRunning) return;
        launchRocket();
    }, 600);

    function loop() {
        if (!isRunning) return;
        ctx.clearRect(0, 0, w, h);

        // Update rockets
        for (var r = rockets.length - 1; r >= 0; r--) {
            var rk = rockets[r];
            rk.y += rk.vy;
            ctx.fillStyle = rk.color;
            ctx.beginPath();
            ctx.arc(rk.x, rk.y, 2.5, 0, Math.PI * 2);
            ctx.fill();

            // Trail
            particles.push({
                x: rk.x,
                y: rk.y,
                vx: (Math.random() - 0.5) * 0.8,
                vy: Math.random() * 1.5,
                alpha: 0.6,
                decay: 0.05,
                color: rk.color,
                size: 1.5,
                gravity: 0.02
            });

            if (rk.y <= rk.targetY) {
                createExplosion(rk.x, rk.y, 70, rk.color);
                rockets.splice(r, 1);
            }
        }

        // Update particles
        for (var i = particles.length - 1; i >= 0; i--) {
            var p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity || 0.06;
            p.vx *= 0.98;
            p.alpha -= p.decay;

            if (p.alpha <= 0) {
                particles.splice(i, 1);
            } else {
                ctx.save();
                ctx.globalAlpha = p.alpha;
                ctx.fillStyle = p.color;
                ctx.shadowBlur = 6;
                ctx.shadowColor = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }

        animId = requestAnimationFrame(loop);
    }
    loop();

    window.stopWinFireworks = function () {
        isRunning = false;
        clearInterval(launchInterval);
        window.removeEventListener('resize', handleResize);
        if (animId) cancelAnimationFrame(animId);
        if (canvas.parentNode) canvas.remove();
    };
}

// ---------- 2. MÀN HÌNH CHIẾN THẮNG QUA MÀN ----------
function showWinModal(info, onReplay, onNext) {
    // 1. Level Up Banner
    var levelUpHtml = '<div class="win-levelup-header">' +
        '<img src="assets/images/ui/level_up.png" class="win-levelup-img" alt="Level Up!">' +
    '</div>';

    // 2. Stars
    var starsHtml = '<div class="win-stars">';
    for (var i = 1; i <= 3; i++) {
        var isStarOn = i <= info.stars;
        starsHtml += '<img src="assets/images/ui/icon_star.png" class="win-star-img' + (isStarOn ? ' on' : ' off') + '" ' +
            'style="animation-delay:' + (i * 0.16) + 's" alt="">';
    }
    starsHtml += '</div>';

    // 3. Level label
    var levelTextHtml = '<div class="win-level-label">Level ' + info.level + '</div>';

    // 4. Kết hợp Vàng thưởng và Vàng bán vật phẩm thừa thành 1
    var baseWinCoins = (info.alreadyDoubled ? info.coins * 2 : info.coins);
    var totalCoins = baseWinCoins + (info.sweepCoins || 0);

    // 5. Rewards row (Năng lượng, Vàng tổng hợp, Kim cương)
    var rewardsHtml = '<div class="win-rewards-row">';
    if (info.energy && info.energy > 0) {
        rewardsHtml += '<div class="win-reward-item"><span class="reward-val">+' + info.energy + '</span> <img class="reward-icon" src="assets/images/ui/icon_nangluong.png" alt="Năng lượng"></div>';
    }
    rewardsHtml += '<div class="win-reward-item"><span class="reward-val">+' + totalCoins.toLocaleString('vi-VN') + '</span> <img class="reward-icon" src="assets/images/ui/icon_glod.png" alt="Vàng"></div>';
    if (info.gems && info.gems > 0) {
        rewardsHtml += '<div class="win-reward-item"><span class="reward-val">+' + info.gems + '</span> <img class="reward-icon" src="assets/images/ui/icon_ruby.png" alt="Kim cương"></div>';
    }
    rewardsHtml += '</div>';

    // 6. Vật phẩm thu thập vào khu trại (Icon cách đều nhau không cần nền)
    var completedList = (info.completedOrders && info.completedOrders.length)
        ? info.completedOrders
        : (info.decor ? [info.decor[1]] : []);
    var decorHtml = '';
    if (completedList.length > 0) {
        var itemsHtml = completedList.map(function (oId) {
            var imgPath = getItemImagePath(oId);
            return '<img src="' + imgPath + '" class="win-bare-item-img" alt="">';
        }).join('');
        var decorLabel = (typeof I18N !== 'undefined' && I18N.currentLang === 'en')
            ? 'Items collected to camp'
            : 'Vật phẩm thu thập vào khu trại';
        decorHtml = '<div class="win-decor-subtitle">' + decorLabel + '</div>' +
            '<div class="win-items-bare-row">' + itemsHtml + '</div>';
    }

    // 7. Dark Rounded Card chứa phần thưởng & vật phẩm
    var cardHtml = '<div class="win-dark-card">' +
        rewardsHtml +
        decorHtml +
    '</div>';

    // 8. Buttons
    var nextBtnHtml = info.hasNext
        ? '<button class="modal-btn primary" id="mb-next">' + (typeof I18N !== 'undefined' ? I18N.t('win.btn_next') : 'Màn tiếp') + '</button>'
        : '<button class="modal-btn primary" id="mb-close">' + (typeof I18N !== 'undefined' ? I18N.t('settings.close_btn') : 'Đóng') + '</button>';

    var replayBtnHtml = '<button class="modal-btn gem-btn" id="mb-replay">' + (typeof I18N !== 'undefined' ? I18N.t('win.btn_replay') : 'Chơi lại') + '</button>';

    var buttonsHtml = '<div class="win-buttons-system">' +
        '<div class="win-btn-row">' +
            replayBtnHtml +
            nextBtnHtml +
        '</div>' +
    '</div>';

    var innerHtml = levelUpHtml + starsHtml + levelTextHtml + cardHtml + buttonsHtml;

    var overlay = createModal(innerHtml, 'win-box', null);

    // KÍCH HOẠT PHÁO HOA SAU KHI TẠO MODAL OVERLAY (Cho tất cả các màn: 1 sao, 2 sao, 3 sao)
    startWinFireworks(overlay, info.stars || 1);

    // 1. Level Up Banner
    var levelUpHtml = '<div class="win-levelup-header">' +
        '<img src="assets/images/ui/level_up.png" class="win-levelup-img" alt="Level Up!">' +
    '</div>';

    // 2. Stars
    var starsHtml = '<div class="win-stars">';
    for (var i = 1; i <= 3; i++) {
        var isStarOn = i <= info.stars;
        starsHtml += '<img src="assets/images/ui/icon_star.png" class="win-star-img' + (isStarOn ? ' on' : ' off') + '" ' +
            'style="animation-delay:' + (i * 0.16) + 's" alt="">';
    }
    starsHtml += '</div>';

    // 3. Level label
    var levelTextHtml = '<div class="win-level-label">Level ' + info.level + '</div>';

    // 4. Kết hợp Vàng thưởng và Vàng bán vật phẩm thừa thành 1
    var baseWinCoins = (info.alreadyDoubled ? info.coins * 2 : info.coins);
    var totalCoins = baseWinCoins + (info.sweepCoins || 0);

    // 5. Rewards row (Năng lượng, Vàng tổng hợp, Kim cương)
    var rewardsHtml = '<div class="win-rewards-row">';
    if (info.energy && info.energy > 0) {
        rewardsHtml += '<div class="win-reward-item"><span class="reward-val">+' + info.energy + '</span> <img class="reward-icon" src="assets/images/ui/icon_nangluong.png" alt="Năng lượng"></div>';
    }
    rewardsHtml += '<div class="win-reward-item"><span class="reward-val">+' + totalCoins.toLocaleString('vi-VN') + '</span> <img class="reward-icon" src="assets/images/ui/icon_glod.png" alt="Vàng"></div>';
    if (info.gems && info.gems > 0) {
        rewardsHtml += '<div class="win-reward-item"><span class="reward-val">+' + info.gems + '</span> <img class="reward-icon" src="assets/images/ui/icon_ruby.png" alt="Kim cương"></div>';
    }
    rewardsHtml += '</div>';

    // 6. Vật phẩm thu thập vào khu trại (Icon cách đều nhau không cần nền)
    var completedList = (info.completedOrders && info.completedOrders.length)
        ? info.completedOrders
        : (info.decor ? [info.decor[1]] : []);
    var decorHtml = '';
    if (completedList.length > 0) {
        var itemsHtml = completedList.map(function (oId) {
            var imgPath = getItemImagePath(oId);
            return '<img src="' + imgPath + '" class="win-bare-item-img" alt="">';
        }).join('');
        var decorLabel = (typeof I18N !== 'undefined' && I18N.currentLang === 'en')
            ? 'Items collected to camp'
            : 'Vật phẩm thu thập vào khu trại';
        decorHtml = '<div class="win-decor-subtitle">' + decorLabel + '</div>' +
            '<div class="win-items-bare-row">' + itemsHtml + '</div>';
    }

    // 7. Dark Rounded Card chứa phần thưởng & vật phẩm
    var cardHtml = '<div class="win-dark-card">' +
        rewardsHtml +
        decorHtml +
    '</div>';

    // 8. Buttons
    var nextBtnHtml = info.hasNext
        ? '<button class="modal-btn primary" id="mb-next">' + (typeof I18N !== 'undefined' ? I18N.t('win.btn_next') : 'Màn tiếp') + '</button>'
        : '<button class="modal-btn primary" id="mb-close">' + (typeof I18N !== 'undefined' ? I18N.t('settings.close_btn') : 'Đóng') + '</button>';

    var replayBtnHtml = '<button class="modal-btn gem-btn" id="mb-replay">' + (typeof I18N !== 'undefined' ? I18N.t('win.btn_replay') : 'Chơi lại') + '</button>';

    var buttonsHtml = '<div class="win-buttons-system">' +
        '<div class="win-btn-row">' +
            replayBtnHtml +
            nextBtnHtml +
        '</div>' +
    '</div>';

    var innerHtml = levelUpHtml + starsHtml + levelTextHtml + cardHtml + buttonsHtml;

    var overlay = createModal(innerHtml, 'win-box', null);

    var didClickNext = false;
    var leaveWithoutNext = function () {
        if (!didClickNext && typeof onReplay === 'function') {
            onReplay();
        }
    };

    var closeBtn = overlay.querySelector('#mb-close');
    if (closeBtn) {
        closeBtn.onclick = function () {
            closeModal();
            leaveWithoutNext();
        };
    }

    var doubleBtn = overlay.querySelector('#mb-double-ad');
    if (doubleBtn && !info.alreadyDoubled) {
        doubleBtn.onclick = function () {
            simulateWatchAd('Nhân Đôi Vàng Thưởng Màn Chơi (+' + info.coins + ' Vàng)', function () {
                if (typeof playerCoins !== 'undefined') playerCoins += info.coins;
                if (typeof updateUIStats === 'function') updateUIStats();
                if (typeof playSound === 'function') playSound('win');
                var coinEl = document.getElementById('btn-coin-shop') || document.body;
                if (typeof spawnFlyingCurrency === 'function') spawnFlyingCurrency(coinEl, 'gold', Math.min(info.coins, 100));
                showToast('Đã x2 Vàng: +' + info.coins + ' Vàng!');
                var updatedInfo = Object.assign({}, info, { alreadyDoubled: true });
                showWinModal(updatedInfo, onReplay, onNext);
            });
        };
    }

    overlay.querySelector('#mb-replay').onclick = function () {
        closeModal();
        onReplay();
    };

    var nextBtn = overlay.querySelector('#mb-next');
    if (nextBtn) {
        nextBtn.onclick = function () {
            didClickNext = true;
            closeModal();
            onNext();
        };
    }

    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) {
            closeModal();
            leaveWithoutNext();
        }
    });
}

// ==========================================
// CẤU HÌNH VẬT PHẨM TRẠI CỦA BẠN (ITEMS KHU TRẠI 3D)
// ==========================================
if (typeof KHUTRAI_ITEMS === 'undefined') {
    var KHUTRAI_ITEMS = {
        // --- LỀU TRẠI (TENT) ---
        'trai_lv4': { type: 'tent',  path: 'assets/images/items_khutrai/trai_lv4.png', name: 'Bạt Tăng Che Nắng' },
        'trai_lv5': { type: 'tent',  path: 'assets/images/items_khutrai/trai_lv5.png', name: 'Lều Vòm Cắm Trại 2 Người' },
        'trai_lv6': { type: 'tent',  path: 'assets/images/items_khutrai/trai_lv6.png', name: 'Lều Gia Đình Chống Gió' },
        'trai_lv7': { type: 'tent',  path: 'assets/images/items_khutrai/trai_lv7.png', name: 'Lều Kim Tự Tháp Glamping' },
        'trai_lv8': { type: 'tent',  path: 'assets/images/items_khutrai/trai_lv8.png', name: 'Biệt Thự Lều Glamping' },

        // --- BÀN DÃ NGOẠI (TABLE) ---
        'ban_lv1':  { type: 'table', path: 'assets/images/items_khutrai/ban_lv1.png',  name: 'Bàn Nhôm Vuông Mini' },
        'ban_lv2':  { type: 'table', path: 'assets/images/items_khutrai/ban_lv2.png',  name: 'Bàn Vải Gấp Dã Ngoại' },
        'ban_lv3':  { type: 'table', path: 'assets/images/items_khutrai/ban_lv3.png',  name: 'Bàn Trà Dã Ngoại' },
        'ban_lv4':  { type: 'table', path: 'assets/images/items_khutrai/ban_lv4.png',  name: 'Bàn Gỗ Cuộn Dã Ngoại' },
        'ban_lv5':  { type: 'table', path: 'assets/images/items_khutrai/ban_lv5.png',  name: 'Bàn Dã Ngoại Kèm Giá Lưới' },
        'ban_lv6':  { type: 'table', path: 'assets/images/items_khutrai/ban_lv6.png',  name: 'Bàn Cắm Trại Đa Năng' },
        'ban_lv7':  { type: 'table', path: 'assets/images/items_khutrai/ban_lv7.png',  name: 'Bàn Chiến Thuật IGT' },
        'ban_lv8':  { type: 'table', path: 'assets/images/items_khutrai/ban_lv8.png',  name: 'Trạm Bếp Nấu Ăn Glamping' },

        // --- BẾP & LỬA TRẠI (STOVE) ---
        'bep_lv1':  { type: 'stove', path: 'assets/images/items_khutrai/bep_lv1.png',  name: 'Nhánh Củi Khô' },
        'bep_lv2':  { type: 'stove', path: 'assets/images/items_khutrai/bep_lv2.png',  name: 'Khúc Gỗ Tròn' },
        'bep_lv3':  { type: 'stove', path: 'assets/images/items_khutrai/bep_lv3.png',  name: 'Bó Củi Buộc Dây' },
        'bep_lv4':  { type: 'stove', path: 'assets/images/items_khutrai/bep_lv4.png',  name: 'Hố Đá Xếp Lửa' },
        'bep_lv5':  { type: 'stove', path: 'assets/images/items_khutrai/bep_lv5.png',  name: 'Đống Củi Trại Vòng Đá' },
        'bep_lv6':  { type: 'stove', path: 'assets/images/items_khutrai/bep_lv6.png',  name: 'Lửa Trại Rực Hồng' },
        'bep_lv7':  { type: 'stove', path: 'assets/images/items_khutrai/bep_lv7.png',  name: 'Lò Nướng Than Hoa Tròn' },
        'bep_lv8':  { type: 'stove', path: 'assets/images/items_khutrai/bep_lv8.png',  name: 'Bếp Nướng BBQ Chữ Nhật' },

        // --- GHẾ DÃ NGOẠI (CHAIR) ---
        'ghe_lv1':  { type: 'chair', path: 'assets/images/items_khutrai/ghe_lv1.png',  name: 'Ghế Đôn Xếp Mini' },
        'ghe_lv2':  { type: 'chair', path: 'assets/images/items_khutrai/ghe_lv2.png',  name: 'Ghế Xếp Tựa Lưng Xanh' },
        'ghe_lv3':  { type: 'chair', path: 'assets/images/items_khutrai/ghe_lv3.png',  name: 'Ghế Xếp Dã Ngoại Màu Cát' },
        'ghe_lv4':  { type: 'chair', path: 'assets/images/items_khutrai/ghe_lv4.png',  name: 'Ghế Xếp Có Tay Vịn' },
        'ghe_lv5':  { type: 'chair', path: 'assets/images/items_khutrai/ghe_lv5.png',  name: 'Ghế Câu Cá Có Khay' },
        'ghe_lv6':  { type: 'chair', path: 'assets/images/items_khutrai/ghe_lv6.png',  name: 'Ghế Mặt Trăng Moon Chair' },
        'ghe_lv7':  { type: 'chair', path: 'assets/images/items_khutrai/ghe_lv7.png',  name: 'Ghế Tựa Lưng Cao Có Gối' },
        'ghe_lv8':  { type: 'chair', path: 'assets/images/items_khutrai/ghe_lv8.png',  name: 'Ghế Đạo Diễn Cao Cấp' }
    };
}

function reconcileMyCampEquipped() {
    if (!SAVE) return;
    if (!SAVE.myCampEquipped || typeof SAVE.myCampEquipped !== 'object') {
        SAVE.myCampEquipped = {};
    }
    var eq = SAVE.myCampEquipped;
    var items = Array.isArray(SAVE.campItems) ? SAVE.campItems : [];
    var slots = ['tent', 'chair1', 'chair2', 'table', 'stove'];
    var usedUids = {};

    // Kiểm tra các slot đang có vật phẩm gắn -> BẮT BUỘC phải thực sự tồn tại trong kho SAVE.campItems
    slots.forEach(function (slot) {
        var val = eq[slot];
        if (!val) {
            eq[slot] = null;
            return;
        }

        var itemId = (typeof val === 'object' && val) ? val.id : val;
        var itemUid = (typeof val === 'object' && val) ? val.uid : null;

        // Nếu itemUid đang tồn tại trong kho campItems và chưa bị slot nào chiếm:
        if (itemUid && items.some(function (it) { return it.uid === itemUid; }) && !usedUids[itemUid]) {
            usedUids[itemUid] = true;
            eq[slot] = { id: itemId, uid: itemUid };
            return;
        }

        // Nếu chưa gắn uid hợp lệ, tìm ĐÚNG 1 instance chưa dùng trong kho campItems có cùng itemId:
        var match = items.find(function (it) {
            return it.id === itemId && !usedUids[it.uid];
        });

        if (match) {
            usedUids[match.uid] = true;
            eq[slot] = { id: itemId, uid: match.uid };
        } else {
            // TUYỆT ĐỐI BỎ ĐỒ MẶC ĐỊNH: Nếu không có trong kho đồ cắm trại -> Gỡ bỏ khỏi slot hoàn toàn!
            eq[slot] = null;
        }
    });
}

function autoEquipIfSlotEmpty(itemObj) {
    if (!SAVE || !itemObj) return false;
    if (!SAVE.myCampEquipped || typeof SAVE.myCampEquipped !== 'object') {
        SAVE.myCampEquipped = {};
    }
    if (!SAVE.myCampUnequipped || typeof SAVE.myCampUnequipped !== 'object') {
        SAVE.myCampUnequipped = {};
    }
    var eq = SAVE.myCampEquipped;
    var uneq = SAVE.myCampUnequipped;
    var itemId = itemObj.id;
    var itemCfg = (typeof KHUTRAI_ITEMS !== 'undefined') ? KHUTRAI_ITEMS[itemId] : null;
    if (!itemCfg) return false;

    var type = itemCfg.type;
    var entry = { id: itemId, uid: itemObj.uid };

    if (type === 'tent') {
        if (!eq.tent && !uneq.tent) { eq.tent = entry; return true; }
    } else if (type === 'table') {
        if (!eq.table && !uneq.table) { eq.table = entry; return true; }
    } else if (type === 'stove') {
        if (!eq.stove && !uneq.stove) { eq.stove = entry; return true; }
    } else if (type === 'chair') {
        if (!eq.chair1 && !uneq.chair1) {
            eq.chair1 = entry;
            return true;
        } else if (!eq.chair2 && !uneq.chair2) {
            if (!eq.chair1 || eq.chair1.uid !== itemObj.uid) {
                eq.chair2 = entry;
                return true;
            }
        }
    }
    return false;
}
if (typeof window !== 'undefined') {
    window.autoEquipIfSlotEmpty = autoEquipIfSlotEmpty;
}

function isItemEquippedInMyCamp(itemOrUid) {
    if (!SAVE || !SAVE.myCampEquipped || !itemOrUid) return false;
    var uid = (typeof itemOrUid === 'object' && itemOrUid) ? itemOrUid.uid : itemOrUid;
    var eq = SAVE.myCampEquipped;
    var slots = ['tent', 'chair1', 'chair2', 'table', 'stove'];

    for (var i = 0; i < slots.length; i++) {
        var val = eq[slots[i]];
        if (!val) continue;
        if (typeof val === 'object' && val.uid && val.uid === uid) {
            return true;
        }
    }
    return false;
}

function equipItemInMyCamp(item) {
    if (!SAVE || !item) return false;
    reconcileMyCampEquipped();

    var itemId = item.id || item;
    var itemUid = item.uid || null;

    var itemCfg = (typeof KHUTRAI_ITEMS !== 'undefined') ? KHUTRAI_ITEMS[itemId] : null;
    if (!itemCfg) return false;

    var type = itemCfg.type;
    var eq = SAVE.myCampEquipped;
    if (!SAVE.myCampUnequipped || typeof SAVE.myCampUnequipped !== 'object') {
        SAVE.myCampUnequipped = {};
    }
    var entry = { id: itemId, uid: itemUid };

    // Nguyên tắc: Chỉ được sử dụng 1 lều, 2 ghế, 1 bàn, 1 bếp
    if (type === 'tent') {
        eq.tent = entry;
        SAVE.myCampUnequipped.tent = false;
    } else if (type === 'table') {
        eq.table = entry;
        SAVE.myCampUnequipped.table = false;
    } else if (type === 'stove') {
        eq.stove = entry;
        SAVE.myCampUnequipped.stove = false;
    } else if (type === 'chair') {
        if (!eq.chair1) {
            eq.chair1 = entry;
            SAVE.myCampUnequipped.chair1 = false;
        } else if (!eq.chair2) {
            if (eq.chair1.uid !== itemUid) {
                eq.chair2 = entry;
                SAVE.myCampUnequipped.chair2 = false;
            } else {
                eq.chair1 = entry;
                SAVE.myCampUnequipped.chair1 = false;
            }
        } else {
            // Đã có 2 ghế -> nếu đang là ghế 1 thì cập nhật ghế 1, nếu là ghế 2 cập nhật ghế 2, còn lại dồn ghế 2 sang ghế 1 và thay ghế 2
            if (eq.chair1.uid === itemUid) {
                eq.chair1 = entry;
                SAVE.myCampUnequipped.chair1 = false;
            } else if (eq.chair2.uid === itemUid) {
                eq.chair2 = entry;
                SAVE.myCampUnequipped.chair2 = false;
            } else {
                eq.chair1 = eq.chair2;
                eq.chair2 = entry;
                SAVE.myCampUnequipped.chair1 = false;
                SAVE.myCampUnequipped.chair2 = false;
            }
        }
    }

    if (typeof saveGame === 'function') saveGame();
    return true;
}

function unequipItemInMyCamp(itemOrUid) {
    if (!SAVE || !SAVE.myCampEquipped || !itemOrUid) return false;
    if (!SAVE.myCampUnequipped || typeof SAVE.myCampUnequipped !== 'object') {
        SAVE.myCampUnequipped = {};
    }
    var uid = (typeof itemOrUid === 'object' && itemOrUid) ? itemOrUid.uid : itemOrUid;
    var eq = SAVE.myCampEquipped;
    var slots = ['tent', 'chair1', 'chair2', 'table', 'stove'];
    var changed = false;

    slots.forEach(function (slot) {
        var val = eq[slot];
        if (val && typeof val === 'object' && val.uid === uid) {
            eq[slot] = null;
            SAVE.myCampUnequipped[slot] = true;
            changed = true;
        } else if (val === uid) {
            eq[slot] = null;
            SAVE.myCampUnequipped[slot] = true;
            changed = true;
        }
    });

    if (changed && typeof saveGame === 'function') saveGame();
    return changed;
}

// ---------- 3. CỬA HÀNG (THÚ CƯNG & ĐIỂM ĐẾN) ----------
function openCamp(highlightLevel, onBack, initialTab) {
    var petsList = (typeof PET_CHARACTERS !== 'undefined') ? PET_CHARACTERS : [
        { id: 'character01', name: 'Golden', img: 'assets/images/ui/character01.png', price: 0 },
        { id: 'character05', name: 'Labrador', img: 'assets/images/ui/character05.png', price: 8000 },
        { id: 'character04', name: 'Poodle', img: 'assets/images/ui/character04.png', price: 16000 },
        { id: 'character03', name: 'Bulldog', img: 'assets/images/ui/character03.png', price: 28000 },
        { id: 'character02', name: 'Béc-giê', img: 'assets/images/ui/character02.png', price: 42000 },
        { id: 'character10', name: 'Ba Tư', img: 'assets/images/ui/character10.png', price: 60000 },
        { id: 'character09', name: 'Maine Coon', img: 'assets/images/ui/character09.png', price: 85000 },
        { id: 'character08', name: 'Ragdoll', img: 'assets/images/ui/character08.png', price: 115000 },
        { id: 'character07', name: 'Mèo Anh', img: 'assets/images/ui/character07.png', price: 150000 },
        { id: 'character06', name: 'Xiêm', img: 'assets/images/ui/character06.png', price: 200000 }
    ];

    var defaultTab = (initialTab === 'pets') ? 'pets' : 'locations';

    var overlay = createModal(
        '<div class="camp-tab-nav">' +
            '<button class="camp-tab-btn btn-3s' + (defaultTab === 'locations' ? ' active' : '') + '" id="tab-btn-locations">' + (typeof I18N !== 'undefined' ? I18N.t('camp.tab_destinations') : 'Điểm đến') + '</button>' +
            '<button class="camp-tab-btn btn-3s' + (defaultTab === 'pets' ? ' active' : '') + '" id="tab-btn-pets">' + (typeof I18N !== 'undefined' ? I18N.t('camp.tab_pets') : 'Thú cưng') + '</button>' +
        '</div>' +
        '<div id="camp-pane-locations" class="camp-tab-pane" style="' + (defaultTab === 'locations' ? '' : 'display:none;') + '">' +
            '<div class="modal-sub" id="loc-unlocked-sub">' + (typeof I18N !== 'undefined' ? I18N.t('camp.dest_sub', { count: (SAVE.ownedLocations ? SAVE.ownedLocations.length : 1), total: (typeof CAMP_LOCATIONS !== 'undefined' ? CAMP_LOCATIONS.length : 9) }) : 'Bộ sưu tập bối cảnh điểm đến') + '</div>' +
            '<div class="locations-scroll-wrap">' +
                '<div class="locations-list" id="locations-list-container"></div>' +
            '</div>' +
        '</div>' +
        '<div id="camp-pane-pets" class="camp-tab-pane" style="' + (defaultTab === 'pets' ? '' : 'display:none;') + '">' +
            '<div class="modal-sub" id="pets-unlocked-sub">' + (typeof I18N !== 'undefined' ? I18N.t('camp.pets_sub', { count: (SAVE.ownedPets ? SAVE.ownedPets.length : 1) }) : 'Bộ sưu tập thú cưng đồng hành') + '</div>' +
            '<div class="pets-scroll-wrap">' +
                '<div class="pets-grid" id="pets-grid-container"></div>' +
            '</div>' +
        '</div>' +
        '<div class="modal-buttons" id="camp-modal-buttons">' +
            '<button class="modal-btn primary" id="mb-close">' + (typeof I18N !== 'undefined' ? I18N.t('camp.btn_close') : 'Đóng') + '</button>' +
        '</div>',
        'camp-box',
        (typeof I18N !== 'undefined' ? I18N.t('camp.title') : 'CỬA HÀNG')
    );

    var tabBtnPets = overlay.querySelector('#tab-btn-pets');
    var tabBtnLocations = overlay.querySelector('#tab-btn-locations');
    var panePets = overlay.querySelector('#camp-pane-pets');
    var paneLocations = overlay.querySelector('#camp-pane-locations');
    var petsGridContainer = overlay.querySelector('#pets-grid-container');
    var petsSub = overlay.querySelector('#pets-unlocked-sub');
    var locationsListContainer = overlay.querySelector('#locations-list-container');
    var locSub = overlay.querySelector('#loc-unlocked-sub');

    function switchTab(tab) {
        tabBtnPets.classList.toggle('active', tab === 'pets');
        tabBtnLocations.classList.toggle('active', tab === 'locations');

        panePets.style.display = (tab === 'pets') ? '' : 'none';
        paneLocations.style.display = (tab === 'locations') ? '' : 'none';

        if (tab === 'pets') {
            renderPetsGrid();
        } else if (tab === 'locations') {
            renderLocationsList();
        }
    }

    tabBtnPets.onclick = function () { switchTab('pets'); };
    tabBtnLocations.onclick = function () { switchTab('locations'); };

    function renderPetsGrid() {
        if (!SAVE.ownedPets || !Array.isArray(SAVE.ownedPets)) SAVE.ownedPets = ['character01'];
        if (!SAVE.activePet) SAVE.activePet = 'character01';

        var ownedCount = SAVE.ownedPets.length;
        if (petsSub) {
            petsSub.innerHTML = 'Đã sở hữu: <b>' + ownedCount + '/' + petsList.length + '</b> thú cưng';
        }

        var html = '';
        petsList.forEach(function (pet) {
            var isOwned = SAVE.ownedPets.includes(pet.id);
            var isActive = (SAVE.activePet === pet.id);
            var cardCls = 'pet-card' + (isActive ? ' is-active' : '');

            var priceHtml = '';
            if (isOwned) {
                priceHtml = '<div class="pet-price owned">' + (isActive ? 'Đang chọn' : 'Đã sở hữu') + '</div>';
            } else {
                var p = (typeof pet.price === 'number') ? pet.price : 30000;
                priceHtml = '<div class="pet-price">' + p.toLocaleString('vi-VN') + ' ' + ICON_GOLD_HTML + '</div>';
            }

            var btnHtml = '';
            if (isActive) {
                btnHtml = '<button class="pet-action-btn btn-active" disabled>Đang dùng</button>';
            } else if (isOwned) {
                btnHtml = '<button class="pet-action-btn btn-equip" data-id="' + pet.id + '">Sử dụng</button>';
            } else {
                btnHtml = '<button class="pet-action-btn btn-buy" data-id="' + pet.id + '">Mua</button>';
            }

            html += '<div class="' + cardCls + '">' +
                '<div class="pet-avatar-wrap">' +
                    '<img src="' + pet.img + '" alt="' + pet.name + '" class="pet-avatar-img">' +
                '</div>' +
                '<div class="pet-name">' + pet.name + '</div>' +
                priceHtml +
                btnHtml +
            '</div>';
        });

        petsGridContainer.innerHTML = html;
        enhanceAll3sButtons(petsGridContainer);

        // Gắn sự kiện mua & sử dụng
        petsGridContainer.querySelectorAll('.btn-buy').forEach(function (btn) {
            btn.onclick = function () {
                var petId = btn.dataset.id;
                var pet = petsList.find(function (p) { return p.id === petId; });
                if (!pet) return;
                var cost = (typeof pet.price === 'number') ? pet.price : 30000;
                var currentCoins = (typeof playerCoins !== 'undefined') ? playerCoins : (SAVE.coins || 0);

                if (currentCoins < cost) {
                    if (typeof playSound === 'function') playSound('error');
                    showToast('Chưa đủ Vàng để mua ' + pet.name + '!');
                    return;
                }

                if (typeof playerCoins !== 'undefined') {
                    playerCoins -= cost;
                    SAVE.coins = playerCoins;
                } else {
                    SAVE.coins = Math.max(0, (SAVE.coins || 0) - cost);
                }

                if (!SAVE.ownedPets.includes(petId)) {
                    SAVE.ownedPets.push(petId);
                }
                SAVE.activePet = petId;
                saveGame();

                if (typeof updateUIStats === 'function') updateUIStats();
                if (typeof updateCompanionAvatar === 'function') updateCompanionAvatar();
                if (typeof playSound === 'function') playSound('win');
                showToast('Đã chọn ' + pet.name + ' đồng hành!');
                renderPetsGrid();
                if (typeof renderMyCampScene === 'function') renderMyCampScene();
            };
        });

        petsGridContainer.querySelectorAll('.btn-equip').forEach(function (btn) {
            btn.onclick = function () {
                var petId = btn.dataset.id;
                var pet = petsList.find(function (p) { return p.id === petId; });
                if (!pet) return;
                SAVE.activePet = petId;
                saveGame();

                if (typeof updateCompanionAvatar === 'function') updateCompanionAvatar();
                if (typeof playSound === 'function') playSound('tap');
                showToast('Đã chọn ' + pet.name + ' làm bạn đồng hành!', '#2e7d32');
                renderPetsGrid();
                if (typeof renderMyCampScene === 'function') renderMyCampScene();
            };
        });
    }

    function renderLocationsList() {
        if (!SAVE.ownedLocations || !Array.isArray(SAVE.ownedLocations)) SAVE.ownedLocations = ['loc_doibu'];
        if (!SAVE.ownedLocations.includes('loc_doibu')) SAVE.ownedLocations.unshift('loc_doibu');
        var locations = (typeof CAMP_LOCATIONS !== 'undefined') ? CAMP_LOCATIONS : [];
        if (!SAVE.activeLocation || !locations.some(function (l) { return l.id === SAVE.activeLocation; })) {
            SAVE.activeLocation = 'loc_doibu';
        }
        var ownedCount = SAVE.ownedLocations.length;
        if (locSub) {
            locSub.innerHTML = (typeof I18N !== 'undefined')
                ? I18N.t('camp.dest_sub', { count: ownedCount, total: locations.length })
                : ('Đã sở hữu: <b>' + ownedCount + '/' + locations.length + '</b> điểm đến cắm trại');
        }

        var html = '';
        locations.forEach(function (loc) {
            var isOwned = SAVE.ownedLocations.includes(loc.id);
            var isActive = (SAVE.activeLocation === loc.id);
            var cardCls = 'location-card' + (isActive ? ' is-active' : '');
            var locName = (typeof I18N !== 'undefined' && loc.nameKey) ? I18N.t('camp.' + loc.nameKey) : loc.name;

            var priceHtml = '';
            if (isOwned) {
                var statusText = isActive
                    ? ((typeof I18N !== 'undefined') ? I18N.t('camp.dest_active') : 'Đang dùng làm cảnh nền')
                    : ((typeof I18N !== 'undefined') ? I18N.t('camp.dest_owned') : 'Đã sở hữu');
                priceHtml = '<div class="loc-price-status ' + (isActive ? 'active' : 'owned') + '">' +
                    statusText +
                '</div>';
            } else {
                var p = (typeof loc.price === 'number') ? loc.price : 30000;
                priceHtml = '<div class="loc-price">' +
                    p.toLocaleString('vi-VN') + ' ' + (typeof ICON_GOLD_HTML !== 'undefined' ? ICON_GOLD_HTML : 'Vàng') +
                '</div>';
            }

            var btnHtml = '';
            if (isActive) {
                btnHtml = '<button class="loc-action-btn btn-active" disabled>' +
                    ((typeof I18N !== 'undefined') ? I18N.t('camp.dest_using') : 'Đang dùng') +
                '</button>';
            } else if (isOwned) {
                btnHtml = '<button class="loc-action-btn btn-equip" data-id="' + loc.id + '">' +
                    ((typeof I18N !== 'undefined') ? I18N.t('camp.dest_select') : 'Sử dụng') +
                '</button>';
            } else {
                btnHtml = '<button class="loc-action-btn btn-buy" data-id="' + loc.id + '">' +
                    ((typeof I18N !== 'undefined') ? I18N.t('camp.dest_buy') : 'Mua') +
                '</button>';
            }

            var cloudHtml = (loc.id === 'loc_matthan')
                ? '<div class="loc-card-clouds">' +
                    '<img src="assets/images/background/may2.webp" class="loc-card-cloud loc-card-cloud-top" alt="Mây đỉnh">' +
                    '<img src="assets/images/background/may1.webp" class="loc-card-cloud loc-card-cloud-bottom" alt="Mây sườn">' +
                  '</div>'
                : '';

            html += '<div class="' + cardCls + '">' +
                '<div class="loc-card-img-wrap">' +
                    '<img src="' + loc.img + '" alt="' + locName + '" class="loc-card-img">' +
                    cloudHtml +
                '</div>' +
                '<div class="loc-card-footer">' +
                    '<div class="loc-info-col">' +
                        '<div class="loc-name">' + locName + '</div>' +
                        priceHtml +
                    '</div>' +
                    '<div class="loc-action-col">' +
                        btnHtml +
                    '</div>' +
                '</div>' +
            '</div>';
        });

        locationsListContainer.innerHTML = html;
        enhanceAll3sButtons(locationsListContainer);

        locationsListContainer.querySelectorAll('.btn-buy').forEach(function (btn) {
            btn.onclick = function () {
                var locId = btn.dataset.id;
                var loc = locations.find(function (l) { return l.id === locId; });
                if (!loc) return;
                var cost = (typeof loc.price === 'number') ? loc.price : 30000;
                var currentCoins = (typeof playerCoins !== 'undefined') ? playerCoins : (SAVE.coins || 0);
                var locName = (typeof I18N !== 'undefined' && loc.nameKey) ? I18N.t('camp.' + loc.nameKey) : loc.name;

                if (currentCoins < cost) {
                    if (typeof playSound === 'function') playSound('error');
                    showToast('Chưa đủ Vàng để mua ' + locName + '!');
                    return;
                }

                if (typeof playerCoins !== 'undefined') {
                    playerCoins -= cost;
                    SAVE.coins = playerCoins;
                } else {
                    SAVE.coins = Math.max(0, (SAVE.coins || 0) - cost);
                }

                if (!SAVE.ownedLocations.includes(locId)) {
                    SAVE.ownedLocations.push(locId);
                }
                SAVE.activeLocation = locId;
                saveGame();

                if (typeof updateUIStats === 'function') updateUIStats();
                if (typeof updateActiveLocationBackground === 'function') updateActiveLocationBackground();
                if (typeof playSound === 'function') playSound('win');
                showToast('Mở khóa cảnh nền: ' + locName + '!');
                renderLocationsList();
                if (typeof renderMyCampScene === 'function') renderMyCampScene();
            };
        });

        locationsListContainer.querySelectorAll('.btn-equip').forEach(function (btn) {
            btn.onclick = function () {
                var locId = btn.dataset.id;
                var loc = locations.find(function (l) { return l.id === locId; });
                if (!loc) return;
                var locName = (typeof I18N !== 'undefined' && loc.nameKey) ? I18N.t('camp.' + loc.nameKey) : loc.name;
                SAVE.activeLocation = locId;
                saveGame();

                if (typeof updateActiveLocationBackground === 'function') updateActiveLocationBackground();
                if (typeof playSound === 'function') playSound('tap');
                showToast('Đổi cảnh nền: ' + locName + '!');
                renderLocationsList();
                if (typeof renderMyCampScene === 'function') renderMyCampScene();
            };
        });
    }

    if (defaultTab === 'pets') {
        renderPetsGrid();
    } else {
        renderLocationsList();
    }

    overlay.querySelector('#mb-close').onclick = function () {
        closeModal();
        if (onBack) onBack();
    };
}

// ==========================================
// POPUP "ĐỒ CẮM TRẠI" (MỞ TRONG MÀN HÌNH "TRẠI CỦA BẠN")
// ==========================================
function openCampItemsModal(onClose) {
    if (!SAVE.campItems || !Array.isArray(SAVE.campItems)) SAVE.campItems = [];
    reconcileMyCampEquipped();

    var title = (typeof I18N !== 'undefined' && I18N.t('camp.decor_modal_title')) ? I18N.t('camp.decor_modal_title') : 'ĐỒ CẮM TRẠI';

    var overlay = createModal(
        '<div class="camp-items-modal-pane">' +
            '<div class="modal-sub" id="camp-items-sub">' + (typeof I18N !== 'undefined' ? I18N.t('camp.items_sub', { count: SAVE.campItems.length }) : ('Đã thu thập: <b>' + SAVE.campItems.length + '</b> vật phẩm từ nhiệm vụ')) + '</div>' +
            '<div class="camp-items-wrap">' +
                '<div class="camp-items-grid" id="camp-items-grid"></div>' +
            '</div>' +
            '<div id="camp-info-bar" class="camp-info-bar">' + (typeof I18N !== 'undefined' ? I18N.t('camp.sell_prompt') : 'Chạm vào vật phẩm để xem chi tiết, trang bị hoặc bán lấy Vàng') + '</div>' +
        '</div>' +
        '<div class="modal-buttons" id="camp-decor-modal-buttons">' +
            '<button class="modal-btn primary" id="mb-close">' + (typeof I18N !== 'undefined' ? I18N.t('camp.btn_close') : 'Đóng') + '</button>' +
        '</div>',
        'camp-box camp-decor-modal',
        title
    );

    var infoBar = overlay.querySelector('#camp-info-bar');
    var itemsGrid = overlay.querySelector('#camp-items-grid');
    var itemsSub = overlay.querySelector('#camp-items-sub');
    var selectedCampItemUid = null;

    function sellSelectedCampItem(item) {
        if (!item) return;
        var price = sellPrice(item.id) || 10;
        if (typeof playerCoins !== 'undefined') {
            playerCoins += price;
            SAVE.coins = playerCoins;
        } else {
            SAVE.coins = (SAVE.coins || 0) + price;
        }

        removeCampItem(item.uid);

        if (typeof playSound === 'function') playSound('coin');
        showToast('Bán ' + item.name + ' (+' + price.toLocaleString('vi-VN') + ' Vàng)!');

        var coinEl = document.getElementById('btn-coin-shop') || document.body;
        if (typeof spawnFlyingCurrency === 'function') {
            spawnFlyingCurrency(coinEl, 'gold', Math.min(price, 80));
        }

        if (typeof updateUIStats === 'function') updateUIStats();
        renderMyCampScene();

        selectedCampItemUid = null;
        renderCampItems();
    }

    function renderCampItems() {
        if (!SAVE.campItems || !Array.isArray(SAVE.campItems)) SAVE.campItems = [];
        reconcileMyCampEquipped();

        if (itemsSub) {
            itemsSub.innerHTML = 'Đã thu thập: <b>' + SAVE.campItems.length + '</b> vật phẩm từ nhiệm vụ';
        }

        var selectedItem = selectedCampItemUid ? SAVE.campItems.find(function (it) { return it.uid === selectedCampItemUid; }) : null;
        if (!selectedItem) {
            selectedCampItemUid = null;
        }

        if (selectedItem) {
            var price = sellPrice(selectedItem.id) || 10;
            var displayName = (typeof getItemCleanName === 'function') ? getItemCleanName(selectedItem.id) : selectedItem.name;
            var isKhutrai = !!KHUTRAI_ITEMS[selectedItem.id];
            var isEquipped = isItemEquippedInMyCamp(selectedItem);

            if (infoBar) {
                var actionBtnsHtml = '';
                if (isKhutrai) {
                    if (isEquipped) {
                        actionBtnsHtml += '<button class="btn-3s btn-gray size-32 camp-inline-equip-btn" id="camp-inline-equip-btn">' +
                            'Tháo ra' +
                        '</button>';
                    } else {
                        actionBtnsHtml += '<button class="btn-3s btn-green size-32 camp-inline-equip-btn" id="camp-inline-equip-btn">' +
                            'Sử dụng' +
                        '</button>';
                    }
                }
                actionBtnsHtml += '<button class="btn-3s btn-danger size-32 camp-inline-sell-btn" id="camp-inline-sell-btn">' +
                    'Bán (+' + price.toLocaleString('vi-VN') + ' Vàng)' +
                '</button>';

                infoBar.innerHTML = '<div class="camp-info-content">' +
                    '<div class="camp-info-name"><b>' + displayName + '</b>' +
                        (isEquipped ? ' <span style="color:#27ae60;font-size:11px;font-weight:700;">(Đang dùng ở Trại)</span>' : '') +
                    '</div>' +
                    '<div class="camp-info-actions">' + actionBtnsHtml + '</div>' +
                '</div>';

                var inlineEquipBtn = infoBar.querySelector('#camp-inline-equip-btn');
                if (inlineEquipBtn) {
                    enhance3sButton(inlineEquipBtn);
                    inlineEquipBtn.onclick = function (e) {
                        e.stopPropagation();
                        if (isEquipped) {
                            unequipItemInMyCamp(selectedItem);
                            showToast('Đã tháo ' + displayName + ' khỏi Trại của bạn!');
                        } else {
                            equipItemInMyCamp(selectedItem);
                            showToast('Đã trang bị ' + displayName + ' vào Trại của bạn!');
                        }
                        if (typeof playSound === 'function') playSound('click');
                        renderMyCampScene();
                        renderCampItems();
                    };
                }

                var inlineSellBtn = infoBar.querySelector('#camp-inline-sell-btn');
                if (inlineSellBtn) {
                    enhance3sButton(inlineSellBtn);
                    inlineSellBtn.onclick = function (e) {
                        e.stopPropagation();
                        if (isEquipped) {
                            unequipItemInMyCamp(selectedItem);
                        }
                        sellSelectedCampItem(selectedItem);
                    };
                }
            }
        } else {
            if (infoBar) {
                infoBar.innerHTML = '<div class="camp-info-placeholder">' +
                    (SAVE.campItems.length > 0
                        ? 'Chạm vào vật phẩm để xem chi tiết, trang bị hoặc bán lấy Vàng'
                        : 'Chưa có vật phẩm nào trong khu trại.') +
                '</div>';
            }
        }

        if (!itemsGrid) return;

        if (SAVE.campItems.length === 0) {
            itemsGrid.innerHTML = '<div class="camp-empty-state">' +
                '<div class="camp-empty-icon"></div>' +
                '<div class="camp-empty-title">Khu Trại Chưa Có Vật Phẩm</div>' +
                '<div class="camp-empty-desc">Khi bạn vượt qua các màn chơi và hoàn thành đơn hàng nhiệm vụ, các món đồ đó sẽ được chuyển vào đây để lưu trữ hoặc bán lấy Vàng!</div>' +
            '</div>';
            return;
        }

        var html = '';
        SAVE.campItems.forEach(function (item, idx) {
            var isSelected = (item.uid === selectedCampItemUid);
            var isEquipped = isItemEquippedInMyCamp(item);
            var imgPath = getItemImagePath(item.id);
            var bgCls = (idx % 2 === 0) ? 'bg-light' : 'bg-dark';

            html += '<div class="camp-item-slot ' + bgCls + (isSelected ? ' is-selected' : '') + (isEquipped ? ' is-equipped' : '') + '" data-uid="' + item.uid + '">' +
                '<img src="' + imgPath + '" class="camp-item-slot-img" alt="' + item.name + '">' +
                (isEquipped ? '<span class="camp-slot-badge">Đang dùng</span>' : '') +
            '</div>';
        });

        itemsGrid.innerHTML = html;

        itemsGrid.querySelectorAll('.camp-item-slot').forEach(function (slotEl) {
            slotEl.onclick = function () {
                var uid = slotEl.dataset.uid;
                if (selectedCampItemUid === uid) {
                    var img = slotEl.querySelector('img');
                    if (img) {
                        img.animate([
                            { transform: 'scale(0.85)' },
                            { transform: 'scale(1.18)' },
                            { transform: 'scale(1)' }
                        ], { duration: 240, easing: 'ease-out' });
                    }
                } else {
                    selectedCampItemUid = uid;
                    if (typeof playSound === 'function') playSound('tap');
                    renderCampItems();
                }
            };
        });
    }

    renderCampItems();

    overlay.querySelector('#mb-close').onclick = function () {
        closeModal();
        renderMyCampScene();
        if (onClose) onClose();
    };
}
window.openCampItemsModal = openCampItemsModal;

// ==========================================
// ĐỊNH NGHĨA KINH TẾ QUẢNG CÁO & CỬA HÀNG
// Đọc từ js/config.js (GAME_CONFIG) để người dùng có thể dễ dàng chỉnh sửa
// ==========================================
var COIN_PACKS = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.coinExchangePacks) ? GAME_CONFIG.coinExchangePacks : [
    {
        id: 'coin_pack_1',
        name: 'Túi Vàng Nhỏ',
        coins: 3500,
        gemCost: 5,
        badge: null,
        desc: 'Đổi từ 5 Kim Cương'
    },
    {
        id: 'coin_pack_2',
        name: 'Rương Vàng Lớn',
        coins: 11000,
        gemCost: 15,
        badge: 'TIẾT KIỆM 15%',
        desc: 'Đổi từ 15 Kim Cương'
    },
    {
        id: 'coin_pack_3',
        name: 'Kho Vàng Hoàng Gia',
        coins: 25000,
        gemCost: 30,
        badge: 'SIÊU LỜI +30%',
        desc: 'Đổi từ 30 Kim Cương'
    }
];

// ---------- MÔ PHỎNG XEM QUẢNG CÁO (REWARDED AD) ----------
function simulateWatchAd(title, onReward) {
    var timerVal = 3;
    var overlay = createModal(
        '<div class="ad-sim-container">' +
            '<div class="ad-sim-topbar">' +
                '<span class="ad-sponsor-tag">QUẢNG CÁO TÀI TRỢ</span>' +
                '<span id="ad-sim-timer" class="ad-sim-timer">Bỏ qua sau 3s</span>' +
            '</div>' +
            '<div class="ad-sim-viewport">' +
                '<div class="ad-sim-badge">CAMPING MERGE ADVENTURE</div>' +
                '<div class="ad-sim-icon-glow"></div>' +
                '<div class="ad-sim-title">' + (title || 'Đang phát video tài trợ...') + '</div>' +
                '<div class="ad-sim-sub">Cảm ơn bạn đã xem quảng cáo ủng hộ trò chơi!</div>' +
                '<div class="ad-sim-pbar-wrap">' +
                    '<div id="ad-sim-pbar" class="ad-sim-pbar"></div>' +
                '</div>' +
            '</div>' +
            '<div class="ad-sim-bottom">' +
                '<button class="modal-btn disabled-btn" id="ad-sim-action" disabled>Đang phát (3s)...</button>' +
            '</div>' +
        '</div>',
        'ad-sim-box'
    );

    var pbar = overlay.querySelector('#ad-sim-pbar');
    var timerEl = overlay.querySelector('#ad-sim-timer');
    var actionBtn = overlay.querySelector('#ad-sim-action');

    setTimeout(function () {
        if (pbar) pbar.style.width = '100%';
    }, 50);

    var countdownInterval = setInterval(function () {
        timerVal--;
        if (timerVal > 0) {
            if (timerEl) timerEl.innerText = 'Bỏ qua sau ' + timerVal + 's';
            if (actionBtn) setBtnText(actionBtn, 'Đang phát (' + timerVal + 's)...');
        } else {
            clearInterval(countdownInterval);
            if (timerEl) timerEl.innerText = 'Hoàn tất';
            if (actionBtn) {
                actionBtn.className = 'modal-btn primary';
                actionBtn.disabled = false;
                setBtnText(actionBtn, 'NHẬN THƯỞNG NGAY');
                actionBtn.onclick = function () {
                    closeModal();
                    if (onReward) onReward();
                };
            }
        }
    }, 800);
}

// ---------- MÔ PHỎNG MUA IAP (ĐÃ ĐƯỢC CHUYỂN HOÀN TOÀN SANG QUẢNG CÁO MIỄN PHÍ) ----------
function simulateBuyIAP(pack, onConfirm) {
    if (onConfirm) onConfirm(pack);
}

// ---------- 4A. CỬA HÀNG NĂNG LƯỢNG & CỨU TRỢ (TRẠM TIẾP NĂNG LƯỢNG) ----------
// opts: { energy, maxEnergy, coins, gems, secLeft, adsLeft, onBuyCoins, onBuyGems, onWatchAd, onRescue, onOpenGemShop }
function showEnergyShopModal(opts) {
    var rescueCfg = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.energyShop && GAME_CONFIG.energyShop.rescue)
        ? GAME_CONFIG.energyShop.rescue
        : { enabled: false, amount: 15 };
    var needRescue = rescueCfg.enabled && opts.energy <= 5 && typeof opts.onRescue === 'function';

    var rescueHtml = needRescue
        ? '<div class="shop-card rescue-card">' +
            '<div class="shop-card-left">' +
                '<div class="shop-card-title">+' + rescueCfg.amount + ' ' + ICON_ENERGY_HTML + '</div>' +
                '<div class="shop-card-desc">Hỗ trợ khẩn cấp khi cạn kiệt năng lượng</div>' +
            '</div>' +
            '<button class="modal-btn primary" id="btn-shop-rescue">MIỄN PHÍ</button>' +
          '</div>'
        : '';

    var adAmt = (typeof AD_REWARDS !== 'undefined' && AD_REWARDS.energy) ? AD_REWARDS.energy.amount : 25;
    var adLeftText = typeof opts.adsLeft === 'number' ? ' • Còn ' + opts.adsLeft + ' lượt hôm nay' : '';

    var energyCoinPacks = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.energyShop && GAME_CONFIG.energyShop.coinPacks)
        ? GAME_CONFIG.energyShop.coinPacks
        : [
            { energy: 25, coinCost: 4000, desc: 'Dùng Vàng nhận thêm Năng Lượng chơi game' },
            { energy: 50, coinCost: 7500, desc: 'Dùng Vàng nhận thêm Năng Lượng chơi game' }
        ];

    var coinPacksHtml = '';
    energyCoinPacks.forEach(function (p, idx) {
        var canAfford = opts.coins >= p.coinCost;
        var desc = p.desc || 'Dùng Vàng nhận thêm Năng Lượng chơi game';
        coinPacksHtml += '<div class="shop-card">' +
            '<div class="shop-card-left">' +
                '<div class="shop-card-title">+' + p.energy + ' ' + ICON_ENERGY_HTML + '</div>' +
                '<div class="shop-card-desc">' + desc + '</div>' +
            '</div>' +
            '<button class="modal-btn ' + (canAfford ? 'primary' : 'disabled-btn') + ' btn-buy-energy-coin" data-idx="' + idx + '">' +
                p.coinCost.toLocaleString('vi-VN') + ' ' + ICON_GOLD_HTML +
            '</button>' +
        '</div>';
    });

    var gemPackCfg = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.energyShop && GAME_CONFIG.energyShop.gemPack)
        ? GAME_CONFIG.energyShop.gemPack
        : { energy: 50, gemCost: 8 };
    var canAffordGemPack = opts.gems >= gemPackCfg.gemCost;
    var gemPackHtml = '<div class="shop-card">' +
        '<div class="shop-card-left">' +
            '<div class="shop-card-title">+' + gemPackCfg.energy + ' ' + ICON_ENERGY_HTML + '</div>' +
            '<div class="shop-card-desc">Nạp siêu tốc bằng Kim Cương (Bỏ qua thời gian chờ)</div>' +
        '</div>' +
        '<button class="modal-btn ' + (canAffordGemPack ? 'gem-btn' : 'disabled-btn') + '" id="btn-buy-energy-gem">' +
            gemPackCfg.gemCost + ' ' + ICON_RUBY_HTML +
        '</button>' +
    '</div>';

    var curRegenSec = (typeof getEnergyRegenSec === 'function') ? getEnergyRegenSec() : ENERGY_REGEN_SEC;

    var overlay = createModal(
        '<div id="shop-status-bar" class="modal-sub">' +
            'Hiện có: <b>' + opts.energy + ' ' + ICON_ENERGY_HTML + '</b> &nbsp;|&nbsp; ' +
            '<b>' + opts.coins.toLocaleString('vi-VN') + ' ' + ICON_GOLD_HTML + '</b> &nbsp;|&nbsp; ' +
            '<b>' + opts.gems + ' ' + ICON_RUBY_HTML + '</b><br>' +
            '<small>Tự động hồi +1 năng lượng sau mỗi ' + curRegenSec + 's khi tương tác (còn ' + opts.secLeft + 's)</small>' +
        '</div>' +
        '<div class="shop-scroll">' +
            // 1. Xem Ads nhận năng lượng
            '<div class="shop-card">' +
                '<div class="shop-card-left">' +
                    '<div class="shop-card-title">+' + adAmt + ' ' + ICON_ENERGY_HTML + '</div>' +
                    '<div class="shop-card-desc">Xem 1 video ngắn nhận ngay miễn phí' + adLeftText + '</div>' +
                '</div>' +
                '<button class="modal-btn primary" id="btn-shop-ad">XEM ADS</button>' +
            '</div>' +
            // 2. Gói nạp siêu tốc bằng Kim Cương (+50 NL giá 8 Kim Cương)
            gemPackHtml +
            // 3. Các gói Đổi Vàng lấy năng lượng (+25 giá 3.000, +50 giá 6.000)
            coinPacksHtml +
            rescueHtml +
        '</div>' +
        '<div class="modal-buttons">' +
            '<button class="modal-btn primary" id="mb-close">Đóng</button>' +
        '</div>',
        'shop-box',
        'NĂNG LƯỢNG'
    );

    var shopStatusBar = overlay.querySelector('#shop-status-bar');
    var gemEnergyBtn = overlay.querySelector('#btn-buy-energy-gem');
    if (gemEnergyBtn) {
        gemEnergyBtn.onclick = function () {
            if (opts.gems < gemPackCfg.gemCost) {
                if (shopStatusBar) shopStatusBar.innerHTML = '<b style="color:#c62828">Chưa đủ ' + gemPackCfg.gemCost + ' Kim Cương! Hãy mở Cẩm Nang hoặc xem Ads tại Cửa Hàng Kim Cương nhé.</b>';
                return;
            }
            closeModal();
            if (opts.onBuyGems) opts.onBuyGems();
        };
    }

    overlay.querySelectorAll('.btn-buy-energy-coin').forEach(function (btn) {
        btn.onclick = function () {
            var idx = parseInt(btn.dataset.idx, 10);
            var pack = energyCoinPacks[idx];
            if (!pack) return;
            if (opts.coins < pack.coinCost) {
                if (shopStatusBar) shopStatusBar.innerHTML = '<b style="color:#c62828">Chưa đủ ' + pack.coinCost.toLocaleString('vi-VN') + ' Vàng! Hãy ghép đồ (Lv.2+), nộp đơn hoặc bán đồ nhé.</b>';
                return;
            }
            closeModal();
            if (opts.onBuyCoins) opts.onBuyCoins(pack);
        };
    });

    var adBtn = overlay.querySelector('#btn-shop-ad');
    if (adBtn) {
        adBtn.onclick = function () {
            closeModal();
            opts.onWatchAd();
        };
    }
    var rescueBtn = overlay.querySelector('#btn-shop-rescue');
    if (rescueBtn) {
        rescueBtn.onclick = function () {
            closeModal();
            opts.onRescue();
        };
    }
    overlay.querySelector('#mb-close').onclick = closeModal;
}

// ---------- 4B. CỬA HÀNG KIM CƯƠNG IAP (MÔ PHỎNG) ----------
function renderWithCurrencyIcons(str) {
    if (!str || typeof str !== 'string') return '';
    return str
        .replace(/🎁\s*/g, '')
        .replace(/✨\s*/g, '')
        .replace(/💎/g, ICON_RUBY_HTML)
        .replace(/[🪙🟨💰\uFFFD]/g, ICON_GOLD_HTML)
        .replace(/⚡/g, ICON_ENERGY_HTML);
}

function showGemShopModal(opts) {
    var gemAdAmt = (typeof AD_REWARDS !== 'undefined' && AD_REWARDS.gem) ? AD_REWARDS.gem.amount : 8;
    var gemAdsLeft = typeof opts.adsLeft === 'number' ? opts.adsLeft : (typeof getAdsLeft === 'function' ? getAdsLeft('gem') : 0);
    var dailyClaimed = !!opts.dailyGiftClaimed;

    // 1. Quà Tiếp Tế Hàng Ngày (Mỗi ngày 1 lần)
    var dailyAmt = (typeof AD_REWARDS !== 'undefined' && AD_REWARDS.dailyGift) ? AD_REWARDS.dailyGift.amount : 5;
    var dailyHtml = '<div class="shop-card starter-card has-badge">' +
        '<div class="shop-badge">HẰNG NGÀY</div>' +
        '<div class="shop-card-left">' +
            '<div class="shop-card-title">+' + dailyAmt + ' ' + ICON_RUBY_HTML + ' Quà Mỗi Ngày</div>' +
            '<div class="shop-card-desc">Đăng nhập mỗi ngày để nhận Kim Cương miễn phí</div>' +
        '</div>' +
        (dailyClaimed
            ? '<button class="modal-btn disabled-btn" disabled>ĐÃ NHẬN</button>'
            : '<button class="modal-btn primary" id="btn-claim-daily">Nhận Ngay</button>'
        ) +
    '</div>';

    // 2. Video Quảng Cáo Nhận Kim Cương (+8 Kim Cương)
    var canWatchGem = gemAdsLeft > 0;
    var gemAdHtml = '<div class="shop-card popular-card has-badge">' +
        '<div class="shop-badge" style="background:#0288d1;">PHỔ BIẾN</div>' +
        '<div class="shop-card-left">' +
            '<div class="shop-card-title">+' + gemAdAmt + ' ' + ICON_RUBY_HTML + ' Video Thưởng</div>' +
            '<div class="shop-card-desc">Xem 1 video ngắn nhận ngay ' + gemAdAmt + ' Kim Cương • Còn ' + gemAdsLeft + ' lượt hôm nay</div>' +
        '</div>' +
        '<button class="modal-btn ' + (canWatchGem ? 'primary' : 'disabled-btn') + '" id="btn-gem-watch-ad" ' + (canWatchGem ? '' : 'disabled') + '>' +
            (canWatchGem ? 'XEM ADS' : 'HẾT LƯỢT') +
        '</button>' +
    '</div>';

    // 3. Gói Test Thử Nghiệm (+500 Kim Cương)
    var testPackHtml = '<div class="shop-card has-badge" style="background:#f3e5f5;border-color:#ba68c8;">' +
        '<div class="shop-badge" style="background:#8e24aa;">TEST</div>' +
        '<div class="shop-card-left">' +
            '<div class="shop-card-title">+500 ' + ICON_RUBY_HTML + ' Gói Thử Nghiệm</div>' +
            '<div class="shop-card-desc">Gói nhận nhanh Kim Cương để kiểm tra tính năng</div>' +
        '</div>' +
        '<button class="modal-btn primary" id="btn-claim-test-gem" style="background:linear-gradient(180deg,#ab47bc,#7b1fa2);border-color:#6a1b9a;">Nhận Ngay</button>' +
    '</div>';

    // 4. Mẹo kiếm Kim Cương trong game
    var tipHtml = '<div class="shop-card" style="background:#fffde7;border:2px dashed #fbc02d;">' +
        '<div class="shop-card-left">' +
            '<div class="shop-card-title" style="color:#e65100;font-size:0.875rem;">Mẹo Nhận Thêm Kim Cương Trong Game</div>' +
            '<div class="shop-card-desc" style="font-size:0.75rem;line-height:1.4;">' +
                '• Vượt màn đạt 3 sao: <b>+2 ' + ICON_RUBY_HTML + '</b><br>' +
                '• Khám phá món mới trong Cẩm Nang: <b>+1 ' + ICON_RUBY_HTML + '</b><br>' +
                '• Ghép vật phẩm Cấp 8 hoàn hảo: <b>+1 ' + ICON_RUBY_HTML + '</b>' +
            '</div>' +
        '</div>' +
    '</div>';

    var overlay = createModal(
        '<div id="gem-status-bar" class="modal-sub">' +
            'Số dư: <b>' + opts.gems + ' ' + ICON_RUBY_HTML + '</b> &nbsp;|&nbsp; ' +
            '<b>' + opts.coins.toLocaleString('vi-VN') + ' ' + ICON_GOLD_HTML + '</b> &nbsp;|&nbsp; ' +
            '<b>' + opts.energy + ' ' + ICON_ENERGY_HTML + '</b><br>' +
            '<small>Kim Cương dùng để nạp năng lượng siêu tốc & đổi sang Vàng</small>' +
        '</div>' +
        '<div class="shop-scroll">' +
            dailyHtml +
            gemAdHtml +
            testPackHtml +
            tipHtml +
        '</div>' +
        '<div class="modal-buttons">' +
            '<button class="modal-btn primary" id="mb-close">Đóng</button>' +
        '</div>',
        'shop-box gem-shop-box',
        'TRẠM KIM CƯƠNG'
    );

    var dailyBtn = overlay.querySelector('#btn-claim-daily');
    if (dailyBtn && !dailyClaimed) {
        dailyBtn.onclick = function () {
            closeModal();
            if (opts.onClaimDailyFree) opts.onClaimDailyFree();
        };
    }
    var gemAdBtn = overlay.querySelector('#btn-gem-watch-ad');
    if (gemAdBtn && canWatchGem) {
        gemAdBtn.onclick = function () {
            closeModal();
            if (opts.onWatchAd) opts.onWatchAd();
        };
    }
    var testBtn = overlay.querySelector('#btn-claim-test-gem');
    if (testBtn) {
        testBtn.onclick = function () {
            closeModal();
            if (opts.onClaimTestGem) opts.onClaimTestGem();
        };
    }

    overlay.querySelector('#mb-close').onclick = closeModal;
}

// ---------- 4C. NGÂN HÀNG VÀNG ----------
function showCoinShopModal(opts) {
    var coinAdAmt = (typeof AD_REWARDS !== 'undefined' && AD_REWARDS.coin) ? AD_REWARDS.coin.amount : 1500;
    var coinAdsLeft = typeof getAdsLeft === 'function' ? getAdsLeft('coin') : 0;
    var coinAdHtml = '<div class="shop-card">' +
        '<div class="shop-card-left">' +
            '<div class="shop-card-title">+' + coinAdAmt.toLocaleString('vi-VN') + ' ' + ICON_GOLD_HTML + '</div>' +
            '<div class="shop-card-desc">Xem 1 video ngắn nhận Vàng miễn phí • Còn ' + coinAdsLeft + ' lượt hôm nay</div>' +
        '</div>' +
        '<button class="modal-btn ' + (coinAdsLeft > 0 ? 'primary' : 'disabled-btn') + '" id="btn-coin-watch-ad">XEM ADS</button>' +
    '</div>';

    var packsHtml = '';
    COIN_PACKS.forEach(function (p) {
        packsHtml += '<div class="shop-card">' +
            '<div class="shop-card-left">' +
                '<div class="shop-card-title">+' + p.coins.toLocaleString('vi-VN') + ' ' + ICON_GOLD_HTML + '</div>' +
                '<div class="shop-card-desc">' + p.desc + '</div>' +
            '</div>' +
            '<button class="modal-btn primary btn-exchange-coin" data-id="' + p.id + '">' + p.gemCost + ' ' + ICON_RUBY_HTML + '</button>' +
        '</div>';
    });

    var overlay = createModal(
        '<div id="coin-status-bar" class="modal-sub">' +
            'Hiện có: <b>' + opts.coins.toLocaleString('vi-VN') + ' ' + ICON_GOLD_HTML + '</b> &nbsp;|&nbsp; ' +
            '<b>' + opts.gems + ' ' + ICON_RUBY_HTML + '</b><br>' +
            '<small>Vàng dùng để mua gói năng lượng, thú cưng & điểm đến cắm trại</small>' +
        '</div>' +
        '<div class="shop-scroll">' +
            coinAdHtml +
            packsHtml +
        '</div>' +
        '<div class="modal-buttons">' +
            '<button class="modal-btn primary" id="mb-close">Đóng</button>' +
        '</div>',
        'shop-box',
        'NGÂN HÀNG VÀNG'
    );

    var coinAdBtn = overlay.querySelector('#btn-coin-watch-ad');
    if (coinAdBtn) {
        coinAdBtn.onclick = function () {
            closeModal();
            if (opts.onWatchAd) opts.onWatchAd();
        };
    }

    overlay.querySelectorAll('.btn-exchange-coin').forEach(function (btn) {
        btn.onclick = function () {
            var id = btn.dataset.id;
            var pack = COIN_PACKS.find(function (p) { return p.id === id; });
            if (pack) {
                closeModal();
                opts.onExchange(pack);
            }
        };
    });

    overlay.querySelector('#mb-close').onclick = closeModal;
}

// ---------- 4D. HỘP TIẾP TẾ MAY MẮN (LUCKY AIR DROP) ----------
function showLuckyDropModal(onReward) {
    var overlay = createModal(
        '<div class="lucky-drop-dialog">' +
            '<div class="lucky-drop-visual"></div>' +
            '<div class="lucky-drop-desc">' +
                'Kiểm lâm vừa thả dù một kiện hàng tiếp tế đặc biệt xuống khu trại!<br>' +
                'Xem một đoạn video ngắn từ nhà tài trợ để nhận ngẫu nhiên phần quà:' +
            '</div>' +
            '<div class="lucky-drop-rewards-list">' +
                '<div class="lucky-reward-pill">' + ICON_ENERGY_HTML + ' +35 Năng Lượng</div>' +
                '<div class="lucky-reward-pill">' + ICON_GOLD_HTML + ' +1.800 Vàng</div>' +
                '<div class="lucky-reward-pill">' + ICON_RUBY_HTML + ' +8 Kim Cương</div>' +
            '</div>' +
            '<div class="modal-buttons lucky-buttons">' +
                '<button class="modal-btn primary" id="btn-lucky-cancel">Đóng</button>' +
                '<button class="modal-btn gem-btn" id="btn-lucky-watch">Xem video</button>' +
            '</div>' +
        '</div>',
        'lucky-box',
        'TIẾP TẾ MAY MẮN'
    );

    overlay.querySelector('#btn-lucky-cancel').onclick = closeModal;
    overlay.querySelector('#btn-lucky-watch').onclick = function () {
        closeModal();
        simulateWatchAd('Mở Kiện Hàng Tiếp Tế May Mắn', function () {
            var rolls = [
                { type: 'energy', val: 35, text: '+35 Năng lượng', color: '#2e7d32' },
                { type: 'coin', val: 1800, text: '+1.800 Vàng', color: '#f57f17' },
                { type: 'gem', val: 8, text: '+8 Kim cương', color: '#1565c0' }
            ];
            var roll = rolls[Math.floor(Math.random() * rolls.length)];
            if (onReward) onReward(roll);
        });
    };
}

// ---------- 5. CẨM NANG SƯU TẬP VẬT PHẨM DÃ NGOẠI ----------
function openDiscoveryBook() {
    var totalItems = ITEM_CHAINS.reduce(function (sum, ch) { return sum + (ch.names ? ch.names.length : 8); }, 0);
    var discCount = countDiscoveredItems();

    var chainsHtml = '';
    ITEM_CHAINS.forEach(function (ch) {
        var slotsHtml = '';
        var chainDisc = 0;
        var maxChainLv = ch.names ? ch.names.length : 8;
        var bgClass = typeof getCellBgClass === 'function' ? getCellBgClass(ch.line) : 'cell-bg-01';
        for (var lv = 1; lv <= maxChainLv; lv++) {
            var id = ch.line + '_lv' + lv;
            var imgPath = id === 'ban_lv8' ? 'assets/images/items/ban_level8.png' : ('assets/images/items/' + id + '.png');
            var isDisc = !!SAVE.discovered[id];
            if (isDisc) chainDisc++;

            var cls = 'book-slot ' + bgClass + (isDisc ? ' discovered' : ' locked');
            slotsHtml += '<div class="' + cls + '" data-id="' + id + '" data-name="' + (ch.names[lv - 1] || id) + '" data-lv="' + lv + '">' +
                '<img src="' + imgPath + '" alt="' + id + '">' +
                '<span class="book-lv">Lv.' + lv + '</span>' +
            '</div>';
        }
        var gen = getChainGenerator(ch.line);
        chainsHtml += '<div class="book-chain">' +
            '<div class="book-chain-header">' +
                '<div class="book-chain-title-wrap">' +
                    '<img src="' + gen.icon + '" class="book-chest-icon" alt="' + gen.name + '" title="Rương: ' + gen.name + '">' +
                    '<span class="book-chain-title">' + ch.title + '</span>' +
                    '<span class="book-chest-tag">' + gen.name + '</span>' +
                '</div>' +
                '<small class="book-chain-count">' + chainDisc + '/' + maxChainLv + '</small>' +
            '</div>' +
            '<div class="book-grid">' + slotsHtml + '</div>' +
        '</div>';
    });

    var overlay = createModal(
        '<div class="modal-sub">' + (typeof I18N !== 'undefined' ? I18N.t('handbook.sub', { count: discCount, total: totalItems }) : ('Đã khám phá: <b>' + discCount + '/' + totalItems + '</b> vật phẩm cắm trại')) + '</div>' +
        '<div class="book-scroll">' + chainsHtml + '</div>' +
        '<div class="modal-buttons book-buttons">' +
            '<button class="modal-btn primary" id="mb-close">' + (typeof I18N !== 'undefined' ? I18N.t('handbook.btn_close') : 'Đóng') + '</button>' +
        '</div>',
        'book-box',
        (typeof I18N !== 'undefined' ? I18N.t('handbook.title') : 'CẨM NANG')
    );

    overlay.querySelectorAll('.book-slot').forEach(function (slot) {
        slot.onclick = function () {
            var id = slot.dataset.id;
            var name = slot.dataset.name;
            var lv = parseInt(slot.dataset.lv);
            var isDisc = !!SAVE.discovered[id];
            var img = slot.querySelector('img');
            if (img) {
                img.animate([
                    { transform: 'scale(0.8)' },
                    { transform: 'scale(1.18)' },
                    { transform: 'scale(1)' }
                ], { duration: 240, easing: 'ease-out' });
            }
            if (isDisc) {
                if (typeof playSound === 'function') playSound('tap');
                showToast(name + ' (Lv.' + lv + ')', '#4e342e');
            } else {
                var gen = getChainGenerator(id.split('_lv')[0]);
                if (typeof playSound === 'function') playSound('tap');
                showToast('Hãy ghép từ ' + gen.name + ' để mở khóa Lv.' + lv + '!', '#795548');
            }
        };
    });

    overlay.querySelector('#mb-close').onclick = closeModal;
}

// ---------- 6. BẢN ĐỒ HÀNH TRÌNH (WORLD MAP - LƯỚI 4 CỘT X 5 HÀNG, PHÂN 3 CHẶNG X 20 MÀN = 60 MÀN) ----------
function openWorldMap(currentLv, onSelectLevel) {
    var unlockAll = SAVE.settings && SAVE.settings.unlockAllLevels;

    // Đảm bảo tối thiểu 60 level được sinh cấu hình
    for (var genLv = RAW_LEVELS.length + 1; genLv <= 60; genLv++) {
        getLevelConfig(genLv);
    }

    // Tự động chuyển tới chặng của màn hiện tại (hoặc maxLevel)
    var cur = Math.min(60, currentLv || SAVE.maxLevel || 1);
    var currentStage = Math.max(1, Math.min(3, Math.ceil(cur / 20)));

    var overlay = createModal(
        '<div class="map-nav-header">' +
            '<button class="map-nav-btn" id="map-btn-prev" type="button" aria-label="Chặng trước">' +
                '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#ffffff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>' +
            '</button>' +
            '<div class="map-nav-title" id="map-nav-title"></div>' +
            '<button class="map-nav-btn" id="map-btn-next" type="button" aria-label="Chặng sau">' +
                '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#ffffff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>' +
            '</button>' +
        '</div>' +
        '<div class="map-scroll-area">' +
            '<div class="map-grid-5col" id="map-grid-container"></div>' +
        '</div>' +
        '<div class="map-stage-req" id="map-stage-req"></div>' +
        '<div class="modal-buttons map-modal-buttons">' +
            '<button class="modal-btn primary" id="mb-close">' + (typeof I18N !== 'undefined' ? I18N.t('map.btn_close') : 'Đóng') + '</button>' +
        '</div>',
        'map-popup-box',
        (typeof I18N !== 'undefined' ? I18N.t('map.title') : 'BẢN ĐỒ HÀNH TRÌNH')
    );

    var closeBtn = overlay.querySelector('#mb-close');
    if (closeBtn) closeBtn.onclick = closeModal;

    var navTitle = overlay.querySelector('#map-nav-title');
    var stageReqEl = overlay.querySelector('#map-stage-req');
    var gridContainer = overlay.querySelector('#map-grid-container');
    var btnPrev = overlay.querySelector('#map-btn-prev');
    var btnNext = overlay.querySelector('#map-btn-next');

    function renderStage(stage) {
        currentStage = Math.max(1, Math.min(3, stage));
        var stageSize = 20;
        var fromLv = (currentStage - 1) * stageSize + 1;
        var toLv = currentStage * stageSize;

        btnPrev.disabled = (currentStage <= 1);
        btnNext.disabled = (currentStage >= 3);

        var stageStars = 0;
        var nodesHtml = '';

        for (var lv = fromLv; lv <= toLv; lv++) {
            var st = SAVE.stars[lv] || 0;
            stageStars += st;
            var unlocked = unlockAll || lv <= SAVE.maxLevel;
            var isCur = lv === currentLv;

            var starsHtml = '<div class="map-level-stars">' +
                '<img src="assets/images/ui/icon_star.png" class="map-star-img' + (st >= 1 ? ' on' : ' off') + '" alt="">' +
                '<img src="assets/images/ui/icon_star.png" class="map-star-img' + (st >= 2 ? ' on' : ' off') + '" alt="">' +
                '<img src="assets/images/ui/icon_star.png" class="map-star-img' + (st >= 3 ? ' on' : ' off') + '" alt="">' +
            '</div>';

            if (unlocked) {
                nodesHtml += '<button class="map-level-btn' + (isCur ? ' current' : '') + '" data-lv="' + lv + '">' +
                    '<span class="map-level-num">' + lv + '</span>' +
                    starsHtml +
                '</button>';
            } else {
                nodesHtml += '<button class="map-level-btn locked" data-lv="' + lv + '">' +
                    '<img src="assets/images/ui/icon_lock.png" class="map-level-lock" alt="Khóa">' +
                    starsHtml +
                '</button>';
            }
        }

        navTitle.innerHTML = 'Chặng <b>' + currentStage + '</b>' +
            ' <span class="map-title-dot">•</span> ' +
            '<b>' + stageStars + '/60</b> ' +
            '<img src="assets/images/ui/icon_star.png" class="map-title-star-img" alt="">';
        gridContainer.innerHTML = nodesHtml;

        if (stageReqEl) {
            var starImgHtml = '<img src="assets/images/ui/icon_star.png" class="map-req-star-img" alt="">';
            var nextStage = currentStage + 1;
            if (nextStage <= 3) {
                if (stageStars >= 30) {
                    stageReqEl.className = 'map-stage-req unlocked';
                    stageReqEl.innerHTML = starImgHtml + ' <span>Đã đạt <b>30</b> sao để mở chặng <b>' + nextStage + '</b></span>';
                } else {
                    stageReqEl.className = 'map-stage-req';
                    stageReqEl.innerHTML = starImgHtml + ' <span>Đạt <b>30</b> sao để mở chặng <b>' + nextStage + '</b></span>';
                }
            } else {
                stageReqEl.className = 'map-stage-req unlocked';
                stageReqEl.innerHTML = '<span>Chặng cuối cùng của hành trình!</span>';
            }
        }

        gridContainer.querySelectorAll('.map-level-btn').forEach(function (btn) {
            btn.onclick = function () {
                var lv = parseInt(btn.dataset.lv, 10);
                var isUnlocked = unlockAll || lv <= SAVE.maxLevel;
                if (isUnlocked) {
                    if (typeof playSound === 'function') playSound('tap');
                    closeModal();
                    if (typeof onSelectLevel === 'function') {
                        onSelectLevel(lv);
                    }
                } else {
                    if (typeof playSound === 'function') playSound('error');
                    showToast('Hãy hoàn thành Level ' + (lv - 1) + ' trước nhé!', '#c62828');
                }
            };
        });
    }

    btnPrev.onclick = function () {
        if (currentStage > 1) {
            if (typeof playSound === 'function') playSound('tap');
            renderStage(currentStage - 1);
        }
    };

    btnNext.onclick = function () {
        if (currentStage < 3) {
            if (typeof playSound === 'function') playSound('tap');
            renderStage(currentStage + 1);
        }
    };

    renderStage(currentStage);
}

// ---------- 7. MÀN HÌNH CÀI ĐẶT & CHỌN MÀN NHANH ----------
// opts: { currentLevel, onSelectLevel, isAuto, onToggleAuto, onUnlockChanged, onRestartLevel, onResetAll, onCloudRestore }
function openSettingsModal(opts) {
    var s = SAVE.settings || {};
    var isAuto = !!opts.isAuto;
    var pid = SAVE.playerId || generatePlayerId();
    var gUser = SAVE.googleUser;

    function buildGoogleCardHtml(user) {
        if (!user) {
            return '<div class="st-google-unlinked">' +
                '<button class="google-auth-btn" id="st-google-login-btn" type="button">' +
                    '<svg class="google-logo-svg" viewBox="0 0 24 24" width="20" height="20">' +
                        '<path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>' +
                        '<path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>' +
                        '<path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.95 0 12s.45 3.83 1.25 5.42l4.03-3.15z"/>' +
                        '<path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>' +
                    '</svg>' +
                    '<span>' + (typeof I18N !== 'undefined' ? I18N.t('settings.google_login_btn') : 'Đăng nhập Google') + '</span>' +
                '</button>' +
            '</div>';
        }
        return '<div class="st-google-linked">' +
            '<div class="st-google-user-row">' +
                '<div class="st-google-avatar-wrap">' +
                    '<img src="' + (user.picture || user.photoURL || 'assets/images/ui/character01.png') + '" class="st-google-avatar" alt="">' +
                '</div>' +
                '<div class="st-google-user-meta">' +
                    '<div class="st-google-name">' + (user.name || user.displayName || 'Người chơi Google') + '</div>' +
                    '<div class="st-google-email">' + (user.email || '') + '</div>' +
                    '<div class="st-google-status">' + (typeof I18N !== 'undefined' ? I18N.t('settings.google_connected') : 'Đã liên kết tài khoản Google') + '</div>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    var accountCardHtml =
        '<div class="st-account-card">' +
            '<div class="st-account-id-row">' +
                '<div class="st-id-meta">' +
                    '<span class="st-id-label">' + (typeof I18N !== 'undefined' ? I18N.t('settings.user_id_label') : 'ID NGƯỜI CHƠI') + '</span>' +
                    '<span class="st-id-val" id="st-player-id-val">' + pid + '</span>' +
                '</div>' +
                '<div class="st-id-btn-group">' +
                    '<button class="st-edit-id-btn" id="st-edit-id-btn" type="button" title="' + (typeof I18N !== 'undefined' ? I18N.t('settings.edit_id') : 'Đổi ID người chơi') + '">' +
                        '<span>' + (typeof I18N !== 'undefined' ? I18N.t('settings.edit_id') : 'Đổi ID') + '</span>' +
                    '</button>' +
                    '<button class="st-copy-btn" id="st-copy-id-btn" type="button" title="' + (typeof I18N !== 'undefined' ? I18N.t('settings.copy') : 'Sao chép ID người chơi') + '">' +
                        '<svg class="st-copy-svg" viewBox="0 0 24 24" width="13" height="13" fill="currentColor">' +
                            '<path d="M16 1H4C2.9 1 2 1.9 2 3v14h2V3h12V1zm3 4H8C6.9 5 6 5.9 6 7v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>' +
                        '</svg>' +
                        '<span>' + (typeof I18N !== 'undefined' ? I18N.t('settings.copy') : 'Sao chép') + '</span>' +
                    '</button>' +
                '</div>' +
            '</div>' +
            '<!-- Khung chỉnh sửa ID inline (không mở popup mới, không chồng popup) -->' +
            '<div class="st-edit-id-inline" id="st-edit-id-inline" style="display:none;">' +
                '<div class="st-inline-input-row">' +
                    '<input type="text" id="st-inline-id-input" class="st-inline-input" maxlength="16" value="' + pid + '" autocomplete="off" spellcheck="false">' +
                    '<button type="button" class="modal-btn primary st-inline-btn" id="st-inline-save-btn">' + (typeof I18N !== 'undefined' ? I18N.t('settings.save') : 'Lưu') + '</button>' +
                    '<button type="button" class="modal-btn gem-btn st-inline-btn" id="st-inline-cancel-btn">' + (typeof I18N !== 'undefined' ? I18N.t('settings.cancel') : 'Hủy') + '</button>' +
                '</div>' +
                '<div id="st-inline-id-msg" class="st-inline-msg" style="display:none;"></div>' +
            '</div>' +
            '<div id="st-google-area">' + buildGoogleCardHtml(gUser) + '</div>' +
        '</div>';

    var curLang = (typeof I18N !== 'undefined' && I18N.currentLang === 'en') ? 'en' : 'vi';
    var isEn = (curLang === 'en');

    var langBoxHtml =
        '<div class="lang-dropdown-container" id="st-lang-container">' +
            '<div class="lang-dropdown-trigger" id="st-lang-trigger" role="button" tabindex="0" title="' + (typeof I18N !== 'undefined' ? I18N.t('settings.lang_dropdown_hint') : 'Bấm để mở danh sách chọn ngôn ngữ') + '">' +
                '<div class="st-row-left">' +
                    '<img src="assets/images/ui/icon_ngonngu.png" class="st-icon" alt="">' +
                    '<span class="st-label" id="st-lbl-lang">' + (typeof I18N !== 'undefined' ? I18N.t('settings.lang_label') : 'Ngôn ngữ') + '</span>' +
                '</div>' +
                '<div class="lang-current-pill">' +
                    (typeof I18N !== 'undefined' ? I18N.getFlagHtml(curLang, 22) : '') +
                    '<span class="lang-current-text">' + (isEn ? 'English' : 'Tiếng Việt') + '</span>' +
                    '<img src="assets/images/ui/icon_down.png" class="lang-arrow" id="st-lang-arrow" alt="▼">' +
                '</div>' +
            '</div>' +
            '<div class="lang-dropdown-menu" id="st-lang-menu" style="display:none">' +
                '<div class="lang-option-item ' + (curLang === 'vi' ? 'active' : '') + '" data-lang="vi">' +
                    '<div class="lang-opt-main">' +
                        (typeof I18N !== 'undefined' ? I18N.getFlagHtml('vi', 24) : '') +
                        '<div>' +
                            '<span class="lang-opt-title">Tiếng Việt</span>' +
                            '<span class="lang-opt-sub">(Vietnamese)</span>' +
                        '</div>' +
                    '</div>' +
                    (curLang === 'vi' ? '<span class="lang-opt-check">✓</span>' : '') +
                '</div>' +
                '<div class="lang-option-item ' + (curLang === 'en' ? 'active' : '') + '" data-lang="en">' +
                    '<div class="lang-opt-main">' +
                        (typeof I18N !== 'undefined' ? I18N.getFlagHtml('en', 24) : '') +
                        '<div>' +
                            '<span class="lang-opt-title">English</span>' +
                            '<span class="lang-opt-sub">(Tiếng Anh)</span>' +
                        '</div>' +
                    '</div>' +
                    (curLang === 'en' ? '<span class="lang-opt-check">✓</span>' : '') +
                '</div>' +
            '</div>' +
        '</div>';

    var overlay = createModal(
        '<div class="popup-sub">' + (typeof I18N !== 'undefined' ? I18N.t('settings.sub') : 'Cài đặt màn chơi và dữ liệu') + '</div>' +
        '<div class="st-rows">' +
            '<!-- Khối ID Người Chơi & Đồng Bộ Google -->' +
            accountCardHtml +

            '<!-- Ngôn ngữ -->' +
            langBoxHtml +

            '<!-- Nhạc nền cắm trại -->' +
            '<div class="st-row">' +
                '<div class="st-row-left">' +
                    '<img src="assets/images/ui/icon_amthanh.png" class="st-icon" alt="">' +
                    '<span class="st-label" id="st-lbl-bgm">' + (typeof I18N !== 'undefined' ? I18N.t('settings.bgm_label') : 'Nhạc nền cắm trại') + '</span>' +
                '</div>' +
                '<button class="toggle-btn ' + (s.bgm !== false ? 'on' : 'off') + '" id="st-bgm">' +
                    (s.bgm !== false ? (typeof I18N !== 'undefined' ? I18N.t('settings.on') : 'BẬT') : (typeof I18N !== 'undefined' ? I18N.t('settings.off') : 'TẮT')) +
                '</button>' +
            '</div>' +

            '<!-- Âm thanh hiệu ứng -->' +
            '<div class="st-row">' +
                '<div class="st-row-left">' +
                    '<img src="assets/images/ui/icon_mussic.png" class="st-icon" alt="">' +
                    '<span class="st-label" id="st-lbl-sfx">' + (typeof I18N !== 'undefined' ? I18N.t('settings.sfx_label') : 'Âm thanh hiệu ứng') + '</span>' +
                '</div>' +
                '<button class="toggle-btn ' + (s.sound ? 'on' : 'off') + '" id="st-sound">' +
                    (s.sound ? (typeof I18N !== 'undefined' ? I18N.t('settings.on') : 'BẬT') : (typeof I18N !== 'undefined' ? I18N.t('settings.off') : 'TẮT')) +
                '</button>' +
            '</div>' +

            '<!-- Mở khóa tất cả level -->' +
            '<div class="st-row">' +
                '<div class="st-row-left">' +
                    '<img src="assets/images/ui/icon_lock.png" class="st-icon" alt="">' +
                    '<span class="st-label" id="st-lbl-unlock">' + (typeof I18N !== 'undefined' ? I18N.t('settings.unlock_all') : 'Mở khóa tất cả level') + '</span>' +
                '</div>' +
                '<button class="toggle-btn ' + (s.unlockAllLevels ? 'on' : 'off') + '" id="st-unlock">' +
                    (s.unlockAllLevels ? (typeof I18N !== 'undefined' ? I18N.t('settings.on') : 'BẬT') : (typeof I18N !== 'undefined' ? I18N.t('settings.off') : 'TẮT')) +
                '</button>' +
            '</div>' +

            '<!-- Tự động đổ đầy bàn -->' +
            '<div class="st-row">' +
                '<div class="st-row-left">' +
                    '<img src="assets/images/ui/icon_auto.png" class="st-icon" alt="">' +
                    '<span class="st-label" id="st-lbl-auto">' + (typeof I18N !== 'undefined' ? I18N.t('settings.auto_fill') : 'Tự động đổ đầy bàn') + '</span>' +
                '</div>' +
                '<button class="toggle-btn ' + (isAuto ? 'on' : 'off') + '" id="st-auto">' +
                    (isAuto ? (typeof I18N !== 'undefined' ? I18N.t('settings.on') : 'BẬT') : (typeof I18N !== 'undefined' ? I18N.t('settings.off') : 'TẮT')) +
                '</button>' +
            '</div>' +
        '</div>' +

        '<div id="reset-confirm-area" class="reset-confirm-area" style="display:none">' +
            '<p style="margin-bottom:12px;">' + (typeof I18N !== 'undefined' ? I18N.t('settings.reset_warning') : 'Bạn chắc chắn muốn xóa toàn bộ tiến trình, sao, vàng và cẩm nang về ban đầu?') + '</p>' +
            '<div class="st-actions">' +
                '<button class="modal-btn danger-btn" id="st-confirm-reset" style="flex:2">' + (typeof I18N !== 'undefined' ? I18N.t('settings.reset_confirm') : 'Xác nhận xóa hết') + '</button>' +
                '<button class="modal-btn gem-btn" id="st-cancel-reset" style="flex:1">' + (typeof I18N !== 'undefined' ? I18N.t('settings.reset_cancel') : 'Hủy') + '</button>' +
            '</div>' +
        '</div>' +

        '<div class="st-actions" id="st-main-btns">' +
            '<button class="st-act-btn green" id="st-close">' + (typeof I18N !== 'undefined' ? I18N.t('settings.close_btn') : 'Đóng') + '</button>' +
            '<button class="st-act-btn blue" id="st-reset">' + (typeof I18N !== 'undefined' ? I18N.t('settings.reset_btn') : 'Xóa dữ liệu') + '</button>' +
        '</div>',
        'settings-popup-box',
        (typeof I18N !== 'undefined' ? I18N.t('settings.title') : 'CÀI ĐẶT')
    );

    var closeBtn = overlay.querySelector('#st-close');
    if (closeBtn) closeBtn.onclick = closeModal;

    // Elements
    var bgmBtn = overlay.querySelector('#st-bgm');
    var soundBtn = overlay.querySelector('#st-sound');
    var unlockBtn = overlay.querySelector('#st-unlock');
    var autoBtn = overlay.querySelector('#st-auto');

    // Cập nhật text trong popup cài đặt tại chỗ khi đổi ngôn ngữ
    function updateAllSettingsTexts(lang) {
        var isEnLang = (lang === 'en');

        // Tiêu đề Ribbon & Phụ đề
        var ribbonSpan = overlay.querySelector('.popup-ribbon span');
        if (ribbonSpan && typeof I18N !== 'undefined') ribbonSpan.textContent = I18N.t('settings.title');
        var subEl = overlay.querySelector('.popup-sub');
        if (subEl && typeof I18N !== 'undefined') subEl.textContent = I18N.t('settings.sub');

        // ID Người chơi & Các nút sao chép / đổi ID
        var idLabel = overlay.querySelector('.st-id-label');
        if (idLabel && typeof I18N !== 'undefined') idLabel.textContent = I18N.t('settings.user_id_label');
        var editBtnText = overlay.querySelector('#st-edit-id-btn span');
        if (editBtnText && typeof I18N !== 'undefined') editBtnText.textContent = I18N.t('settings.edit_id');
        var copyBtnText = overlay.querySelector('#st-copy-id-btn span');
        if (copyBtnText && typeof I18N !== 'undefined') copyBtnText.textContent = I18N.t('settings.copy');

        // Ngôn ngữ
        var langLabel = overlay.querySelector('#st-lbl-lang');
        if (langLabel && typeof I18N !== 'undefined') langLabel.textContent = I18N.t('settings.lang_label');
        var pillWrap = overlay.querySelector('.lang-current-pill');
        if (pillWrap && typeof I18N !== 'undefined') {
            pillWrap.innerHTML = I18N.getFlagHtml(lang, 22) +
                '<span class="lang-current-text">' + (isEnLang ? 'English' : 'Tiếng Việt') + '</span>' +
                '<img src="assets/images/ui/icon_down.png" class="lang-arrow" id="st-lang-arrow" alt="▼">';
        }

        // Tích chọn trong Menu ngôn ngữ
        var optItems = overlay.querySelectorAll('.lang-option-item');
        optItems.forEach(function (el) {
            var elLang = el.getAttribute('data-lang');
            var isSel = (elLang === lang);
            el.classList.toggle('active', isSel);
            var existingCheck = el.querySelector('.lang-opt-check');
            if (isSel && !existingCheck) {
                var chk = document.createElement('span');
                chk.className = 'lang-opt-check';
                chk.textContent = '✓';
                el.appendChild(chk);
            } else if (!isSel && existingCheck) {
                existingCheck.remove();
            }
        });

        // Nhãn các hàng chức năng
        var lblBgm = overlay.querySelector('#st-lbl-bgm');
        if (lblBgm && typeof I18N !== 'undefined') lblBgm.textContent = I18N.t('settings.bgm_label');
        var lblSfx = overlay.querySelector('#st-lbl-sfx');
        if (lblSfx && typeof I18N !== 'undefined') lblSfx.textContent = I18N.t('settings.sfx_label');
        var lblUnlock = overlay.querySelector('#st-lbl-unlock');
        if (lblUnlock && typeof I18N !== 'undefined') lblUnlock.textContent = I18N.t('settings.unlock_all');
        var lblAuto = overlay.querySelector('#st-lbl-auto');
        if (lblAuto && typeof I18N !== 'undefined') lblAuto.textContent = I18N.t('settings.auto_fill');

        // Nhãn các nút Bật / Tắt
        if (bgmBtn && typeof I18N !== 'undefined') {
            bgmBtn.textContent = I18N.t(s.bgm !== false ? 'settings.on' : 'settings.off');
        }
        if (soundBtn && typeof I18N !== 'undefined') {
            soundBtn.textContent = I18N.t(s.sound ? 'settings.on' : 'settings.off');
        }
        if (unlockBtn && typeof I18N !== 'undefined') {
            unlockBtn.textContent = I18N.t(s.unlockAllLevels ? 'settings.on' : 'settings.off');
        }
        if (autoBtn && typeof I18N !== 'undefined') {
            autoBtn.textContent = I18N.t(opts.isAuto ? 'settings.on' : 'settings.off');
        }

        // Các nút hành động chính ở chân popup
        var closeBtnEl = overlay.querySelector('#st-close');
        if (closeBtnEl && typeof I18N !== 'undefined') setBtnText(closeBtnEl, I18N.t('settings.close_btn'));
        var resetBtnEl = overlay.querySelector('#st-reset');
        if (resetBtnEl && typeof I18N !== 'undefined') setBtnText(resetBtnEl, I18N.t('settings.reset_btn'));

        // Khu vực xác nhận Xóa dữ liệu
        var resetWarn = overlay.querySelector('#reset-confirm-area p');
        if (resetWarn && typeof I18N !== 'undefined') resetWarn.textContent = I18N.t('settings.reset_warning');
        var resetConfirmBtn = overlay.querySelector('#st-confirm-reset');
        if (resetConfirmBtn && typeof I18N !== 'undefined') setBtnText(resetConfirmBtn, I18N.t('settings.reset_confirm'));
        var resetCancelBtn = overlay.querySelector('#st-cancel-reset');
        if (resetCancelBtn && typeof I18N !== 'undefined') setBtnText(resetCancelBtn, I18N.t('settings.reset_cancel'));

        // Cập nhật nhãn nút Google hoặc trạng thái liên kết
        var gBtnSpan = overlay.querySelector('#st-google-login-btn span');
        if (gBtnSpan && typeof I18N !== 'undefined') gBtnSpan.textContent = I18N.t('settings.google_login_btn');
        var gStatus = overlay.querySelector('.st-google-status');
        if (gStatus && typeof I18N !== 'undefined') gStatus.textContent = I18N.t('settings.google_connected');

        // Nút Lưu/Hủy chỉnh sửa ID inline
        var inlineSave = overlay.querySelector('#st-inline-save-btn');
        if (inlineSave && typeof I18N !== 'undefined') setBtnText(inlineSave, I18N.t('settings.save'));
        var inlineCancel = overlay.querySelector('#st-inline-cancel-btn');
        if (inlineCancel && typeof I18N !== 'undefined') setBtnText(inlineCancel, I18N.t('settings.cancel'));
    }

    // 1. CHỈNH SỬA ID NGƯỜI CHƠI TRỰC TIẾP (INLINE - KHÔNG TẠO POPUP CHỒNG)
    var editIdBtn = overlay.querySelector('#st-edit-id-btn');
    var editInlinePanel = overlay.querySelector('#st-edit-id-inline');
    var inlineInput = overlay.querySelector('#st-inline-id-input');
    var inlineSaveBtn = overlay.querySelector('#st-inline-save-btn');
    var inlineCancelBtn = overlay.querySelector('#st-inline-cancel-btn');
    var inlineMsg = overlay.querySelector('#st-inline-id-msg');
    var playerIdVal = overlay.querySelector('#st-player-id-val');

    if (editIdBtn && editInlinePanel) {
        editIdBtn.onclick = function (e) {
            e.stopPropagation();
            var isOpen = editInlinePanel.style.display !== 'none';
            if (isOpen) {
                editInlinePanel.style.display = 'none';
            } else {
                editInlinePanel.style.display = 'flex';
                if (inlineMsg) inlineMsg.style.display = 'none';
                if (inlineInput) {
                    inlineInput.value = SAVE.playerId || pid;
                    setTimeout(function () { inlineInput.focus(); }, 60);
                }
            }
        };
    }

    if (inlineCancelBtn && editInlinePanel) {
        inlineCancelBtn.onclick = function (e) {
            e.stopPropagation();
            editInlinePanel.style.display = 'none';
        };
    }

    if (inlineInput) {
        inlineInput.addEventListener('input', function () {
            inlineInput.value = inlineInput.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
        });
    }

    if (inlineSaveBtn && inlineInput) {
        inlineSaveBtn.onclick = function (e) {
            e.stopPropagation();
            var newId = (inlineInput.value || '').trim().toUpperCase();
            var curId = SAVE.playerId || pid;

            if (!newId || newId.length < 3) {
                if (inlineMsg) {
                    inlineMsg.style.display = 'block';
                    inlineMsg.style.background = '#ffebee';
                    inlineMsg.style.color = '#c62828';
                    inlineMsg.innerText = 'ID phải có ít nhất 3 ký tự!';
                }
                inlineInput.focus();
                return;
            }

            if (!/^[A-Z0-9_-]{3,16}$/.test(newId)) {
                if (inlineMsg) {
                    inlineMsg.style.display = 'block';
                    inlineMsg.style.background = '#ffebee';
                    inlineMsg.style.color = '#c62828';
                    inlineMsg.innerText = 'ID chỉ gồm chữ cái, số và dấu gạch (-)!';
                }
                inlineInput.focus();
                return;
            }

            if (newId === curId) {
                editInlinePanel.style.display = 'none';
                return;
            }

            inlineSaveBtn.disabled = true;
            setBtnText(inlineSaveBtn, '...');

            if (typeof FIREBASE_SYNC !== 'undefined' && FIREBASE_SYNC.isConfigured()) {
                FIREBASE_SYNC.claimPlayerId(newId, curId, function (success, resultOrMsg) {
                    inlineSaveBtn.disabled = false;
                    setBtnText(inlineSaveBtn, typeof I18N !== 'undefined' ? I18N.t('settings.save') : 'Lưu');
                    if (success) {
                        SAVE.playerId = newId;
                        if (typeof saveGame === 'function') saveGame();
                        if (FIREBASE_SYNC.getCurrentUser()) {
                            FIREBASE_SYNC.save(SAVE);
                        }
                        if (playerIdVal) playerIdVal.textContent = newId;
                        editInlinePanel.style.display = 'none';
                        showToast('Đã đổi ID thành công: ' + newId, '#2e7d32');
                    } else {
                        if (inlineMsg) {
                            inlineMsg.style.display = 'block';
                            inlineMsg.style.background = '#ffebee';
                            inlineMsg.style.color = '#c62828';
                            inlineMsg.innerText = resultOrMsg;
                        }
                    }
                });
            } else {
                SAVE.playerId = newId;
                if (typeof saveGame === 'function') saveGame();
                if (playerIdVal) playerIdVal.textContent = newId;
                inlineSaveBtn.disabled = false;
                setBtnText(inlineSaveBtn, typeof I18N !== 'undefined' ? I18N.t('settings.save') : 'Lưu');
                editInlinePanel.style.display = 'none';
                showToast('Đã đổi ID thành công: ' + newId, '#2e7d32');
            }
        };
    }

    // 2. SAO CHÉP ID NGƯỜI CHƠI
    var copyIdBtn = overlay.querySelector('#st-copy-id-btn');
    if (copyIdBtn) {
        copyIdBtn.onclick = function (e) {
            e.stopPropagation();
            var curSaveId = SAVE.playerId || pid;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(curSaveId).then(function () {
                    showToast('Đã sao chép ID: ' + curSaveId, '#2e7d32');
                }).catch(function () {
                    showToast('ID của bạn: ' + curSaveId, '#2e7d32');
                });
            } else {
                showToast('ID của bạn: ' + curSaveId);
            }
        };
    }

    // 3. ĐĂNG NHẬP GOOGLE & CẬP NHẬT GIAO DIỆN TẠI CHỖ (IN-PLACE)
    function bindGoogleLogin() {
        var gBtn = overlay.querySelector('#st-google-login-btn');
        if (gBtn) {
            gBtn.onclick = function (e) {
                e.stopPropagation();
                if (typeof FIREBASE_SYNC !== 'undefined' && FIREBASE_SYNC.isConfigured()) {
                    FIREBASE_SYNC.loginWithGoogle(function (user) {
                        showToast('Đăng nhập Google thành công!');
                        var gArea = overlay.querySelector('#st-google-area');
                        if (gArea) {
                            gArea.innerHTML = buildGoogleCardHtml({
                                picture: user.photoURL || user.picture,
                                name: user.displayName || user.name,
                                email: user.email
                            });
                        }
                    }, function (err) {
                        console.warn('Google sign-in notice:', err);
                        var msg = (err && err.message) ? err.message : String(err);
                        var code = (err && err.code) ? err.code : '';
                        if (code === 'auth/configuration-not-found' || msg.indexOf('configuration-not-found') !== -1) {
                            showToast('Chưa bật Google trong Firebase!');
                        } else if (code === 'auth/unauthorized-domain' || msg.indexOf('unauthorized-domain') !== -1) {
                            showToast('Vui lòng thêm domain vào Firebase!');
                        } else if (code === 'auth/popup-closed-by-user' || msg.indexOf('popup-closed-by-user') !== -1) {
                            showToast('Đã đóng cửa sổ chọn Google.');
                        } else if (code === 'auth/popup-blocked' || msg.indexOf('popup-blocked') !== -1) {
                            showToast('Trình duyệt đang chặn Popup!');
                        } else {
                            showToast('Đăng nhập Google thất bại!');
                        }
                    });
                } else {
                    showToast('Chưa cấu hình Firebase Google!');
                }
            };
        }
    }
    bindGoogleLogin();

    // 4. DROPDOWN CHỌN NGÔN NGỮ & CẬP NHẬT TẠI CHỖ (KHÔNG RE-RENDER POPUP)
    var langContainer = overlay.querySelector('#st-lang-container');
    var langTrigger = overlay.querySelector('#st-lang-trigger');
    var langMenu = overlay.querySelector('#st-lang-menu');
    var langArrow = overlay.querySelector('#st-lang-arrow');

    if (langTrigger && langMenu) {
        langTrigger.onclick = function (e) {
            e.stopPropagation();
            var isOpen = langMenu.style.display !== 'none';
            if (isOpen) {
                langMenu.style.display = 'none';
                if (langArrow) langArrow.classList.remove('rotated');
                if (langContainer) langContainer.classList.remove('open');
            } else {
                langMenu.style.display = 'flex';
                if (langArrow) langArrow.classList.add('rotated');
                if (langContainer) langContainer.classList.add('open');
            }
        };

        var options = overlay.querySelectorAll('.lang-option-item');
        options.forEach(function (opt) {
            opt.onclick = function (e) {
                e.stopPropagation();
                var targetLang = this.getAttribute('data-lang');
                if (typeof I18N !== 'undefined') {
                    I18N.setLanguage(targetLang);
                    if (typeof saveGame === 'function') saveGame();
                    var msg = targetLang === 'en'
                        ? I18N.t('toasts.lang_switched_en')
                        : I18N.t('toasts.lang_switched_vi');
                    showToast(msg, '#2e7d32');
                }
                // Cập nhật toàn bộ nhãn/text trong popup hiện tại mượt mà
                updateAllSettingsTexts(targetLang);
                // Đóng menu sổ xuống
                langMenu.style.display = 'none';
                var curArrow = overlay.querySelector('#st-lang-arrow');
                if (curArrow) curArrow.classList.remove('rotated');
                if (langContainer) langContainer.classList.remove('open');
            };
        });
    }

    // 5. CÁC NÚT BẬT/TẮT TÍNH NĂNG CẬP NHẬT TRỰC TIẾP (IN-PLACE, KHÔNG TẠO LẠI POPUP)
    if (bgmBtn) {
        bgmBtn.onclick = function (e) {
            e.stopPropagation();
            s.bgm = (s.bgm === false) ? true : false;
            if (typeof saveGame === 'function') saveGame();
            if (typeof updateBgmPlayback === 'function') updateBgmPlayback();
            var isOn = s.bgm !== false;
            bgmBtn.className = 'toggle-btn ' + (isOn ? 'on' : 'off');
            bgmBtn.textContent = typeof I18N !== 'undefined' ? I18N.t(isOn ? 'settings.on' : 'settings.off') : (isOn ? 'BẬT' : 'TẮT');
        };
    }

    if (soundBtn) {
        soundBtn.onclick = function (e) {
            e.stopPropagation();
            s.sound = !s.sound;
            if (typeof saveGame === 'function') saveGame();
            var isOn = !!s.sound;
            soundBtn.className = 'toggle-btn ' + (isOn ? 'on' : 'off');
            soundBtn.textContent = typeof I18N !== 'undefined' ? I18N.t(isOn ? 'settings.on' : 'settings.off') : (isOn ? 'BẬT' : 'TẮT');
        };
    }

    if (unlockBtn) {
        unlockBtn.onclick = function (e) {
            e.stopPropagation();
            s.unlockAllLevels = !s.unlockAllLevels;
            if (typeof saveGame === 'function') saveGame();
            if (opts.onUnlockChanged) opts.onUnlockChanged();
            var isOn = !!s.unlockAllLevels;
            unlockBtn.className = 'toggle-btn ' + (isOn ? 'on' : 'off');
            unlockBtn.textContent = typeof I18N !== 'undefined' ? I18N.t(isOn ? 'settings.on' : 'settings.off') : (isOn ? 'BẬT' : 'TẮT');
        };
    }

    if (autoBtn) {
        autoBtn.onclick = function (e) {
            e.stopPropagation();
            if (opts.onToggleAuto) opts.onToggleAuto();
            opts.isAuto = !opts.isAuto;
            var isOn = !!opts.isAuto;
            autoBtn.className = 'toggle-btn ' + (isOn ? 'on' : 'off');
            autoBtn.textContent = typeof I18N !== 'undefined' ? I18N.t(isOn ? 'settings.on' : 'settings.off') : (isOn ? 'BẬT' : 'TẮT');
        };
    }

    // 6. XÓA DỮ LIỆU & XÁC NHẬN (IN-PLACE)
    var resetBtn = overlay.querySelector('#st-reset');
    var resetArea = overlay.querySelector('#reset-confirm-area');
    var mainBtns = overlay.querySelector('#st-main-btns');
    var cancelResetBtn = overlay.querySelector('#st-cancel-reset');
    var confirmResetBtn = overlay.querySelector('#st-confirm-reset');

    if (resetBtn && resetArea && mainBtns) {
        resetBtn.onclick = function (e) {
            e.stopPropagation();
            resetArea.style.display = 'block';
            mainBtns.style.display = 'none';
        };
    }

    if (cancelResetBtn && resetArea && mainBtns) {
        cancelResetBtn.onclick = function (e) {
            e.stopPropagation();
            resetArea.style.display = 'none';
            mainBtns.style.display = 'flex';
        };
    }

    if (confirmResetBtn) {
        confirmResetBtn.onclick = function (e) {
            e.stopPropagation();
            closeModal();
            if (opts.onResetAll) opts.onResetAll();
        };
    }
}

// ---------- MODAL ĐĂNG NHẬP GOOGLE & ĐỒNG BỘ ĐÁM MÂY ----------
function showGoogleAuthModal(params) {
    var opts = params.opts || {};
    var onSuccess = params.onSuccess;

    var overlay = createModal(
        '<div class="google-auth-dialog">' +
            '<div class="google-dialog-header">' +
                '<svg class="google-logo-svg big" viewBox="0 0 24 24" width="36" height="36">' +
                    '<path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>' +
                    '<path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>' +
                    '<path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.95 0 12s.45 3.83 1.25 5.42l4.03-3.15z"/>' +
                    '<path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>' +
                '</svg>' +
                '<div class="google-dialog-title">Đăng Nhập Tài Khoản Google</div>' +
            '</div>' +
            '<div class="google-dialog-desc">' +
                'Liên kết Gmail của bạn để tự động lưu tiến trình (Level, Vàng, Cẩm Nang và Màn hình đang chơi dở) giúp bạn tiếp tục chơi trên bất kỳ máy tính hoặc điện thoại nào.' +
            '</div>' +

            '<div class="g-input-group">' +
                '<label class="g-input-label" for="g-email-input">Địa chỉ Email Google (Gmail):</label>' +
                '<input type="email" id="g-email-input" class="g-modal-input" placeholder="ví dụ: camping.player@gmail.com" value="' + (SAVE.googleUser ? SAVE.googleUser.email : '') + '" autocomplete="email">' +
            '</div>' +

            '<div id="g-cloud-found-notice" class="g-cloud-found-notice" style="display:none;"></div>' +

            '<div class="modal-buttons" style="margin-top:14px;flex-direction:column;gap:8px;">' +
                '<button class="modal-btn primary" id="g-submit-btn" style="width:100%;height:44px;">Đăng Nhập & Đồng Bộ Đám Mây</button>' +
                '<button class="modal-btn" id="g-open-fb-btn" style="width:100%;height:38px;font-size:0.8125rem;background:#fff3e0;border:1.5px solid #ffcc80;color:#e65100;">Cấu hình Google Firebase (100% Miễn phí)</button>' +
                '<button class="modal-btn gem-btn" id="g-open-import-btn" style="width:100%;height:40px;font-size:0.875rem;">Nhập mã sao lưu từ máy khác</button>' +
                '<button class="modal-btn" id="g-cancel-btn" style="width:100%;height:40px;">Quay lại</button>' +
            '</div>' +
        '</div>',
        'google-auth-box',
        'LƯU ĐÁM MÂY'
    );

    var emailInput = overlay.querySelector('#g-email-input');
    var submitBtn = overlay.querySelector('#g-submit-btn');
    var openFbBtn = overlay.querySelector('#g-open-fb-btn');
    var importBtn = overlay.querySelector('#g-open-import-btn');
    var cancelBtn = overlay.querySelector('#g-cancel-btn');
    var noticeBox = overlay.querySelector('#g-cloud-found-notice');

    if (cancelBtn) {
        cancelBtn.onclick = function () {
            closeModal();
            openSettingsModal(opts);
        };
    }

    if (openFbBtn) {
        openFbBtn.onclick = function () {
            closeModal();
            showFirebaseSetupModal(opts);
        };
    }

    if (importBtn) {
        importBtn.onclick = function () {
            closeModal();
            showImportSyncModal(opts);
        };
    }

    if (submitBtn && emailInput) {
        submitBtn.onclick = function () {
            var email = (emailInput.value || '').trim();
            if (!email || email.indexOf('@') === -1 || email.indexOf('.') === -1) {
                showToast('Vui lòng nhập đúng định dạng email (ví dụ: ten@gmail.com)', '#c62828');
                emailInput.focus();
                return;
            }

            // Kiểm tra xem đã có dữ liệu đám mây của tài khoản này chưa
            var existingCloud = restoreSaveFromCloud(email);
            if (existingCloud && (!SAVE.googleUser || SAVE.googleUser.email !== email)) {
                // Tìm thấy dữ liệu đám mây từ trước
                var cloudLv = existingCloud.level || 1;
                var cloudCoins = (existingCloud.coins || 0).toLocaleString('vi-VN');
                var cloudStars = existingCloud.stars ? Object.keys(existingCloud.stars).length : 0;

                noticeBox.style.display = 'block';
                noticeBox.innerHTML =
                    '<b>Tìm thấy dữ liệu Đám Mây của tài khoản này:</b><br>' +
                    '• Màn hiện tại: <b>Level ' + cloudLv + '</b> (' + cloudStars + ' màn đạt sao)<br>' +
                    '• Kho Vàng: <b>' + cloudCoins + ' Vàng</b><br>' +
                    '<div style="margin-top:8px;display:flex;gap:6px;">' +
                        '<button class="modal-btn primary" id="g-apply-cloud-btn" style="flex:1;height:36px;font-size:0.8125rem;">Nạp dữ liệu từ Đám Mây</button>' +
                        '<button class="modal-btn danger-btn" id="g-overwrite-cloud-btn" style="flex:1;height:36px;font-size:0.8125rem;">Ghi đè bằng máy này</button>' +
                    '</div>';

                var applyBtn = noticeBox.querySelector('#g-apply-cloud-btn');
                var overwriteBtn = noticeBox.querySelector('#g-overwrite-cloud-btn');

                if (applyBtn) {
                    applyBtn.onclick = function () {
                        SAVE = Object.assign(defaultSave(), existingCloud);
                        SAVE.googleUser = {
                            email: email,
                            name: email.split('@')[0],
                            picture: 'assets/images/ui/character01.png',
                            lastSynced: Date.now()
                        };
                        saveGame();
                        if (opts.onCloudRestore) opts.onCloudRestore();
                        closeModal();
                        showToast('Đồng bộ dữ liệu thành công!');
                        if (onSuccess) onSuccess();
                    };
                }

                if (overwriteBtn) {
                    overwriteBtn.onclick = function () {
                        SAVE.googleUser = {
                            email: email,
                            name: email.split('@')[0],
                            picture: 'assets/images/ui/character01.png',
                            lastSynced: Date.now()
                        };
                        syncSaveToCloud();
                        closeModal();
                        showToast('Đã lưu tiến trình lên Google!');
                        if (onSuccess) onSuccess();
                    };
                }
                return;
            }

            // Chưa có dữ liệu cũ -> liên kết và sao lưu tiến trình hiện tại ngay lập tức
            SAVE.googleUser = {
                email: email,
                name: email.split('@')[0],
                picture: 'assets/images/ui/character01.png',
                lastSynced: Date.now()
            };
            syncSaveToCloud();
            closeModal();
            showToast('Đã liên kết tài khoản Google!');
            if (onSuccess) onSuccess();
        };
    }
}

// ---------- MODAL NHẬP MÃ ĐỒNG BỘ CHUYỂN MÁY ----------
function showImportSyncModal(opts) {
    var overlay = createModal(
        '<div class="google-auth-dialog">' +
            '<div class="google-dialog-header">' +
                '<div style="font-size:2rem;line-height:1;margin-bottom:6px;"></div>' +
                '<div class="google-dialog-title">Nhập Mã Sao Lưu Chuyển Máy</div>' +
            '</div>' +
            '<div class="google-dialog-desc">' +
                'Dán Mã Đồng Bộ bạn đã bấm "Sao chép" từ máy tính hoặc điện thoại cũ vào ô bên dưới để khôi phục toàn bộ tiến trình trên máy này.' +
            '</div>' +

            '<div class="g-input-group">' +
                '<textarea id="g-import-code-area" class="g-modal-textarea" rows="4" placeholder="Dán mã sao lưu vào đây..."></textarea>' +
            '</div>' +

            '<div class="modal-buttons" style="margin-top:14px;flex-direction:column;gap:8px;">' +
                '<button class="modal-btn primary" id="g-do-import-btn" style="width:100%;height:44px;">Đồng Bộ Vào Máy Này</button>' +
                '<button class="modal-btn" id="g-cancel-import-btn" style="width:100%;height:40px;">Quay lại</button>' +
            '</div>' +
        '</div>',
        'google-auth-box',
        'ĐỒNG BỘ MÁY'
    );

    var codeArea = overlay.querySelector('#g-import-code-area');
    var doImportBtn = overlay.querySelector('#g-do-import-btn');
    var cancelBtn = overlay.querySelector('#g-cancel-import-btn');

    if (cancelBtn) {
        cancelBtn.onclick = function () {
            closeModal();
            openSettingsModal(opts);
        };
    }

    if (doImportBtn && codeArea) {
        doImportBtn.onclick = function () {
            var code = (codeArea.value || '').trim();
            if (!code) {
                showToast('Vui lòng dán mã sao lưu!');
                codeArea.focus();
                return;
            }

            var ok = importSyncCode(code);
            if (ok) {
                if (opts.onCloudRestore) opts.onCloudRestore();
                closeModal();
                showToast('Đồng bộ tiến trình thành công!');
            } else {
                showToast('Mã sao lưu không hợp lệ!');
            }
        };
    }
}

// ---------- MODAL HƯỚNG DẪN & CẤU HÌNH GOOGLE FIREBASE MIỄN PHÍ ----------
function showFirebaseSetupModal(opts) {
    var curCfg = (typeof FIREBASE_SYNC !== 'undefined') ? FIREBASE_SYNC.getActiveConfig() : null;
    var isLinked = !!curCfg;
    var overlay = createModal(
        '<div class="fb-guide-dialog">' +
            '<div class="fb-guide-header">' +
                '<span style="font-size:1.75rem;"></span>' +
                '<div>' +
                    '<h3 class="fb-guide-title">Lưu Trữ Google Firebase Miễn Phí</h3>' +
                    '<div style="font-size:0.75rem;color:#795548;">Spark Plan: 50.000 lượt đọc / 20.000 lượt ghi / ngày (100% Free)</div>' +
                '</div>' +
            '</div>' +

            '<div class="fb-step-list">' +
                '<div class="fb-step-item">' +
                    '<span class="fb-step-num">1</span>' +
                    '<div class="fb-step-text">' +
                        'Truy cập <b>Firebase Console</b> và tạo dự án mới (đặt tên ví dụ: <code>merge-camping-game</code>):<br>' +
                        '<a href="https://console.firebase.google.com/" target="_blank" class="fb-link-btn" rel="noreferrer">Mở Firebase Console ↗</a>' +
                    '</div>' +
                '</div>' +

                '<div class="fb-step-item">' +
                    '<span class="fb-step-num">2</span>' +
                    '<div class="fb-step-text">' +
                        'Vào menu <b>Authentication</b> -> Thẻ <b>Sign-in method</b> -> Chọn <b>Google</b> và bật <b>Enable</b>.' +
                    '</div>' +
                '</div>' +

                '<div class="fb-step-item">' +
                    '<span class="fb-step-num">3</span>' +
                    '<div class="fb-step-text">' +
                        'Vào menu <b>Firestore Database</b> -> Bấm <b>Create database</b> -> Chọn chế độ <b>Start in test mode</b>.' +
                    '</div>' +
                '</div>' +

                '<div class="fb-step-item">' +
                    '<span class="fb-step-num">4</span>' +
                    '<div class="fb-step-text">' +
                        'Bấm vào biểu tượng <b>Cài đặt dự án</b> (Project settings) -> Cuộn xuống mục <b>Your apps</b> -> Chọn Web <b>&lt;/&gt;</b> -> Sao chép đoạn <code>firebaseConfig = { ... }</code>.' +
                    '</div>' +
                '</div>' +

                '<div class="fb-step-item">' +
                    '<span class="fb-step-num">5</span>' +
                    '<div class="fb-step-text">' +
                        'Dán mã cấu hình của bạn vào ô dưới đây (hoặc dán trực tiếp vào file <code>js/config.js</code>):' +
                        '<textarea id="fb-config-input" class="g-modal-textarea" rows="3" placeholder="Dán đoạn firebaseConfig = { apiKey: &quot;...&quot;, projectId: &quot;...&quot; } vào đây...">' +
                            (curCfg ? JSON.stringify(curCfg, null, 2) : '') +
                        '</textarea>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>' +

        '<div class="modal-buttons" style="flex-direction:row;gap:8px;margin-top:8px;flex-shrink:0;">' +
            '<button class="modal-btn primary" id="fb-apply-cfg-btn" style="flex:2;height:42px;font-size:0.875rem;">Kích Hoạt</button>' +
            (isLinked ? '<button class="modal-btn danger-btn" id="fb-clear-cfg-btn" style="flex:1;height:42px;font-size:0.8125rem;">Hủy</button>' : '') +
            '<button class="modal-btn" id="fb-close-guide-btn" style="flex:1;height:42px;font-size:0.875rem;">Đóng</button>' +
        '</div>',
        'google-auth-box',
        'FIREBASE CLOUD'
    );

    var configInput = overlay.querySelector('#fb-config-input');
    var applyBtn = overlay.querySelector('#fb-apply-cfg-btn');
    var clearBtn = overlay.querySelector('#fb-clear-cfg-btn');
    var closeBtn = overlay.querySelector('#fb-close-guide-btn');

    if (closeBtn) {
        closeBtn.onclick = function () {
            closeModal();
            openSettingsModal(opts);
        };
    }

    if (clearBtn) {
        clearBtn.onclick = function () {
            if (typeof FIREBASE_SYNC !== 'undefined') {
                FIREBASE_SYNC.clearConfig();
                showToast('Đã xóa cấu hình Firebase.');
                closeModal();
                openSettingsModal(opts);
            }
        };
    }

    if (applyBtn && configInput) {
        applyBtn.onclick = function () {
            var rawText = (configInput.value || '').trim();
            if (!rawText) {
                showToast('Vui lòng dán mã cấu hình!');
                configInput.focus();
                return;
            }

            if (typeof FIREBASE_SYNC !== 'undefined') {
                var res = FIREBASE_SYNC.saveConfig(rawText);
                if (res.success) {
                    showToast('Kích hoạt Firebase thành công!');
                    closeModal();
                    openSettingsModal(opts);
                } else {
                    showToast('Cấu hình không hợp lệ!');
                }
            }
        };
    }
}

// ---------- MODAL ĐỔI ID NGƯỜI CHƠI & ĐỒNG BỘ ĐÁM MÂY ----------
function showEditPlayerIdModal(opts) {
    var curId = SAVE.playerId || generatePlayerId();
    var overlay = createModal(
        '<div class="popup-sub" style="margin-bottom:8px;">Đặt ID dễ nhớ cho tài khoản của bạn</div>' +
        '<div class="edit-id-dialog">' +
            '<div class="edit-id-desc">' +
                'Hệ thống sẽ kiểm tra và cập nhật trên <b>Đám Mây</b> nếu tên này chưa có ai sử dụng.' +
            '</div>' +

            '<div class="g-input-group">' +
                '<label class="g-input-label" for="new-player-id-input">ID Người Chơi Mới (3 - 16 ký tự):</label>' +
                '<input type="text" id="new-player-id-input" class="g-modal-input" maxlength="16" placeholder="ví dụ: CAMP-QUOCBAO" value="' + curId + '" style="text-transform:uppercase;font-weight:900;letter-spacing:1px;">' +
            '</div>' +

            '<div id="edit-id-msg-box" style="display:none;font-size:0.7813rem;font-weight:800;padding:6px 10px;border-radius:8px;margin-bottom:4px;"></div>' +

            '<div class="st-actions" style="margin-top:8px;">' +
                '<button class="st-act-btn green" id="btn-save-new-id">Lưu & Đồng Bộ</button>' +
                '<button class="st-act-btn blue" id="btn-cancel-edit-id">Quay lại</button>' +
            '</div>' +
        '</div>',
        'settings-popup-box',
        'ĐỔI ID'
    );

    var input = overlay.querySelector('#new-player-id-input');
    var saveBtn = overlay.querySelector('#btn-save-new-id');
    var cancelBtn = overlay.querySelector('#btn-cancel-edit-id');
    var msgBox = overlay.querySelector('#edit-id-msg-box');

    if (cancelBtn) {
        cancelBtn.onclick = function () {
            closeModal();
            openSettingsModal(opts);
        };
    }

    if (input) {
        setTimeout(function () { input.focus(); }, 150);
        input.addEventListener('input', function () {
            input.value = input.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
        });
    }

    if (saveBtn && input) {
        saveBtn.onclick = function () {
            var newId = (input.value || '').trim().toUpperCase();
            if (!newId || newId.length < 3) {
                msgBox.style.display = 'block';
                msgBox.style.background = '#ffebee';
                msgBox.style.color = '#c62828';
                msgBox.innerText = 'ID phải có ít nhất 3 ký tự!';
                input.focus();
                return;
            }

            if (!/^[A-Z0-9_-]{3,16}$/.test(newId)) {
                msgBox.style.display = 'block';
                msgBox.style.background = '#ffebee';
                msgBox.style.color = '#c62828';
                msgBox.innerText = 'ID chỉ được chứa chữ cái, số và dấu gạch (-)!';
                input.focus();
                return;
            }

            if (newId === curId) {
                closeModal();
                openSettingsModal(opts);
                return;
            }

            saveBtn.disabled = true;
            setBtnText(saveBtn, 'Đang kiểm tra...');

            if (typeof FIREBASE_SYNC !== 'undefined' && FIREBASE_SYNC.isConfigured()) {
                FIREBASE_SYNC.claimPlayerId(newId, curId, function (success, resultOrMsg) {
                    saveBtn.disabled = false;
                    setBtnText(saveBtn, 'Lưu & Đồng Bộ');
                    if (success) {
                        SAVE.playerId = newId;
                        saveGame();
                        if (FIREBASE_SYNC.getCurrentUser()) {
                            FIREBASE_SYNC.save(SAVE);
                        }
                        showToast('Đã đổi ID thành công: ' + newId, '#2e7d32');
                        closeModal();
                        openSettingsModal(opts);
                    } else {
                        msgBox.style.display = 'block';
                        msgBox.style.background = '#ffebee';
                        msgBox.style.color = '#c62828';
                        msgBox.innerText = resultOrMsg;
                    }
                });
            } else {
                SAVE.playerId = newId;
                saveGame();
                showToast('Đã đổi ID thành công: ' + newId, '#2e7d32');
                closeModal();
                openSettingsModal(opts);
            }
        };
    }
}

// ==========================================
// MÀN HÌNH "TRẠI CỦA BẠN" (MY CAMP SCREEN)
// ==========================================
var myCampState = {
    panX: 0,
    panY: 0,
    zoom: 1.0,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    startPanX: 0,
    startPanY: 0,
    isPinching: false,
    startPinchDist: 0,
    startPinchZoom: 1.0,
    hasMoved: false,
    initialized: false
};

function applyMyCampTransform(smooth) {
    var stage = document.getElementById('mycamp-stage');
    if (!stage) return;
    if (smooth) {
        stage.style.transition = 'transform 0.28s cubic-bezier(0.2, 0.9, 0.3, 1)';
        setTimeout(function () {
            if (stage) stage.style.transition = '';
        }, 300);
    } else {
        stage.style.transition = '';
    }
    stage.style.transform = 'translate(' + myCampState.panX + 'px, ' + myCampState.panY + 'px) scale(' + myCampState.zoom + ')';
}

function setMyCampZoom(targetZoom, smooth) {
    var cfg = (typeof MYCAMP_CONFIG !== 'undefined' && MYCAMP_CONFIG) ? MYCAMP_CONFIG : null;
    var vp = (cfg && cfg.viewport) ? cfg.viewport : {};
    var minZ = vp.minZoom !== undefined ? vp.minZoom : 0.7;
    var maxZ = vp.maxZoom !== undefined ? vp.maxZoom : 1.4;
    var clamped = Math.min(maxZ, Math.max(minZ, targetZoom));
    myCampState.zoom = Math.round(clamped * 1000) / 1000;
    applyMyCampTransform(smooth);
}

function setMyCampPan(x, y, smooth) {
    var limitX = Math.max(300, (typeof window !== 'undefined' && window.innerWidth ? window.innerWidth * 0.8 : 300));
    var limitY = Math.max(350, (typeof window !== 'undefined' && window.innerHeight ? window.innerHeight * 0.8 : 350));
    myCampState.panX = Math.min(limitX, Math.max(-limitX, Math.round(x)));
    myCampState.panY = Math.min(limitY, Math.max(-limitY, Math.round(y)));
    applyMyCampTransform(smooth);
}

function resetMyCampView(smooth) {
    var cfg = (typeof MYCAMP_CONFIG !== 'undefined' && MYCAMP_CONFIG) ? MYCAMP_CONFIG : null;
    var vp = (cfg && cfg.viewport) ? cfg.viewport : {};
    myCampState.panX = vp.initialPanX !== undefined ? vp.initialPanX : 0;
    myCampState.panY = vp.initialPanY !== undefined ? vp.initialPanY : 0;
    myCampState.zoom = vp.defaultZoom !== undefined ? vp.defaultZoom : 1.0;
    applyMyCampTransform(smooth !== false);
}

function initMyCampViewportInteractions() {
    var viewport = document.getElementById('mycamp-viewport');
    if (!viewport || viewport._panZoomInit) return;
    viewport._panZoomInit = true;

    // --- MOUSE DRAG ---
    viewport.addEventListener('mousedown', function (e) {
        if (e.button !== 0) return;
        var cfg = (typeof MYCAMP_CONFIG !== 'undefined' && MYCAMP_CONFIG) ? MYCAMP_CONFIG : null;
        if (cfg && cfg.viewport && cfg.viewport.enablePan === false) return;

        myCampState.isDragging = true;
        myCampState.hasMoved = false;
        myCampState.dragStartX = e.clientX;
        myCampState.dragStartY = e.clientY;
        myCampState.startPanX = myCampState.panX;
        myCampState.startPanY = myCampState.panY;
        viewport.classList.add('is-grabbing');
    });

    window.addEventListener('mousemove', function (e) {
        if (!myCampState.isDragging) return;
        var dx = e.clientX - myCampState.dragStartX;
        var dy = e.clientY - myCampState.dragStartY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) myCampState.hasMoved = true;
        setMyCampPan(myCampState.startPanX + dx, myCampState.startPanY + dy, false);
    });

    function endMouseDrag() {
        if (myCampState.isDragging) {
            myCampState.isDragging = false;
            viewport.classList.remove('is-grabbing');
        }
    }
    window.addEventListener('mouseup', endMouseDrag);

    // --- MOUSE WHEEL ZOOM ---
    viewport.addEventListener('wheel', function (e) {
        var cfg = (typeof MYCAMP_CONFIG !== 'undefined' && MYCAMP_CONFIG) ? MYCAMP_CONFIG : null;
        if (cfg && cfg.viewport && cfg.viewport.enableZoom === false) return;
        e.preventDefault();
        var delta = -Math.sign(e.deltaY) * 0.08;
        setMyCampZoom(myCampState.zoom + delta, false);
    }, { passive: false });

    // --- TOUCH DRAG & PINCH-ZOOM ---
    viewport.addEventListener('touchstart', function (e) {
        var cfg = (typeof MYCAMP_CONFIG !== 'undefined' && MYCAMP_CONFIG) ? MYCAMP_CONFIG : null;
        if (e.touches.length === 1) {
            if (cfg && cfg.viewport && cfg.viewport.enablePan === false) return;
            myCampState.isDragging = true;
            myCampState.isPinching = false;
            myCampState.hasMoved = false;
            myCampState.dragStartX = e.touches[0].clientX;
            myCampState.dragStartY = e.touches[0].clientY;
            myCampState.startPanX = myCampState.panX;
            myCampState.startPanY = myCampState.panY;
        } else if (e.touches.length === 2) {
            if (cfg && cfg.viewport && cfg.viewport.enableZoom === false) return;
            myCampState.isDragging = false;
            myCampState.isPinching = true;
            var t1 = e.touches[0], t2 = e.touches[1];
            myCampState.startPinchDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
            myCampState.startPinchZoom = myCampState.zoom;
        }
    }, { passive: false });

    viewport.addEventListener('touchmove', function (e) {
        if (e.cancelable) e.preventDefault();
        if (myCampState.isPinching && e.touches.length === 2) {
            var t1 = e.touches[0], t2 = e.touches[1];
            var dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
            if (myCampState.startPinchDist > 0) {
                var factor = dist / myCampState.startPinchDist;
                setMyCampZoom(myCampState.startPinchZoom * factor, false);
            }
        } else if (myCampState.isDragging && e.touches.length === 1) {
            var dx = e.touches[0].clientX - myCampState.dragStartX;
            var dy = e.touches[0].clientY - myCampState.dragStartY;
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) myCampState.hasMoved = true;
            setMyCampPan(myCampState.startPanX + dx, myCampState.startPanY + dy, false);
        }
    }, { passive: false });

    function endTouch(e) {
        if (e.touches.length === 1) {
            myCampState.isPinching = false;
            myCampState.isDragging = true;
            myCampState.dragStartX = e.touches[0].clientX;
            myCampState.dragStartY = e.touches[0].clientY;
            myCampState.startPanX = myCampState.panX;
            myCampState.startPanY = myCampState.panY;
        } else if (e.touches.length === 0) {
            myCampState.isDragging = false;
            myCampState.isPinching = false;
        }
    }
    viewport.addEventListener('touchend', endTouch);
    viewport.addEventListener('touchcancel', endTouch);

    // Double-click to reset view to center
    viewport.addEventListener('dblclick', function () {
        resetMyCampView(true);
    });
}

function openMyCamp() {
    var screen = document.getElementById('my-camp-screen');
    if (!screen) return;

    reconcileMyCampEquipped();
    initMyCampViewportInteractions();

    if (!myCampState.initialized) {
        resetMyCampView(false);
        myCampState.initialized = true;
    }

    renderMyCampScene();
    screen.style.display = 'block';

    if (typeof playSound === 'function') playSound('click');
}

function closeMyCamp() {
    var screen = document.getElementById('my-camp-screen');
    if (!screen) return;
    screen.style.display = 'none';

    stopCampAnimators();

    if (typeof playSound === 'function') playSound('click');
}

var campAnimTimers = {};
var petHoldState = {
    isHolding: false,
    timer: null
};

function stopCampAnimators() {
    Object.keys(campAnimTimers).forEach(function (k) {
        clearInterval(campAnimTimers[k]);
        delete campAnimTimers[k];
    });
    if (petHoldState.timer) {
        clearInterval(petHoldState.timer);
        petHoldState.timer = null;
    }
    petHoldState.isHolding = false;
}

// Thông báo bay lên (Số tiền thưởng / Thời gian đếm ngược)
function showPetFloatingToast(container, text, isGold) {
    if (!container) return;
    var toast = document.createElement('div');
    toast.className = 'pet-float-toast' + (isGold ? ' gold' : '');
    toast.innerHTML = text;
    container.appendChild(toast);
    setTimeout(function () {
        if (toast && toast.parentNode) toast.parentNode.removeChild(toast);
    }, 1250);
}

function startCampAnimators() {
    stopCampAnimators();

    var cfg = (typeof MYCAMP_CONFIG !== 'undefined' && MYCAMP_CONFIG) ? MYCAMP_CONFIG : null;

    // 1. CHẠY HOẠT ẢNH CHO THÚ CƯNG THEO CƠ CHẾ NGƯỜI CHƠI CHỌN MUA (SAVE.activePet)
    var activePetId = (SAVE && SAVE.activePet) ? SAVE.activePet : 'character01';
    var petConfig = (cfg && cfg.pets && cfg.pets[activePetId]) ? cfg.pets[activePetId] : null;

    if (petConfig) {
        var f1 = petConfig.state1Frames || petConfig.standFrames || petConfig.idleFrames || [];
        var f2 = petConfig.state2Frames || petConfig.sitFrames || petConfig.helloFrames || [];
        var sheet1 = petConfig.state1Sheet || null;
        var sheet2 = petConfig.state2Sheet || null;
        var hasSheet = !!(sheet1 || sheet2);

        if (f1.length || f2.length || hasSheet) {
            var elemId = 'mycamp-anim-pet';
            var canvasElem = document.getElementById(elemId + '-canvas');
            var imgElem = document.getElementById(elemId + '-img');

            if (canvasElem || imgElem) {
                var sheet1Img = null;
                var sheet2Img = null;
                if (sheet1) {
                    sheet1Img = new Image();
                    sheet1Img.src = sheet1.image;
                }
                if (sheet2) {
                    sheet2Img = new Image();
                    sheet2Img.src = sheet2.image;
                }
                if (!hasSheet) {
                    // Preload toàn bộ frames PNG nếu dùng ảnh rời
                    f1.concat(f2).forEach(function (src) {
                        var img = new Image();
                        img.src = src;
                    });
                }

                var fps = (petConfig.fps && petConfig.fps > 0) ? petConfig.fps : 8;
                var intervalMs = Math.round(1000 / fps);

                var s1DurationMs = (petConfig.state1Duration || petConfig.standDuration || petConfig.idleDuration || 5) * 1000;
                var s2DurationMs = (petConfig.state2Duration || petConfig.sitDuration || petConfig.helloDuration || 5) * 1000;
                var s1Width = petConfig.state1Width || petConfig.standWidth || petConfig.idleWidth || 60;
                var s2Width = petConfig.state2Width || petConfig.sitWidth || petConfig.helloWidth || 60;

                var currentState = (sheet1 || f1.length) ? 'state1' : 'state2';
                var currentFrameIdx = 0;
                var stateElapsedMs = 0;

                function drawSheetFrame(canvas, sheet, sheetImg, frameIdx, displayWidth) {
                    if (!canvas || !sheet || !sheetImg || !sheetImg.complete) return;
                    if (canvas.width !== sheet.frameWidth || canvas.height !== sheet.frameHeight) {
                        canvas.width = sheet.frameWidth;
                        canvas.height = sheet.frameHeight;
                    }
                    if (canvas.style.width !== displayWidth + 'px') {
                        canvas.style.width = displayWidth + 'px';
                    }
                    var col = frameIdx % sheet.cols;
                    var row = Math.floor(frameIdx / sheet.cols);
                    var sx = col * sheet.frameWidth;
                    var sy = row * sheet.frameHeight;
                    var ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(sheetImg, sx, sy, sheet.frameWidth, sheet.frameHeight, 0, 0, sheet.frameWidth, sheet.frameHeight);
                }

                // Vẽ ngay frame đầu tiên nếu dùng Sprite Sheet
                if (canvasElem && sheet1 && sheet1Img) {
                    if (sheet1Img.complete) {
                        drawSheetFrame(canvasElem, sheet1, sheet1Img, 0, s1Width);
                    } else {
                        sheet1Img.onload = function () {
                            if (currentState === 'state1') drawSheetFrame(canvasElem, sheet1, sheet1Img, 0, s1Width);
                        };
                    }
                }

                campAnimTimers['pet'] = setInterval(function () {
                    var canvas = document.getElementById(elemId + '-canvas');
                    var img = document.getElementById(elemId + '-img');
                    if (!canvas && !img) return;

                    var activeSheet = (currentState === 'state1') ? sheet1 : sheet2;
                    var activeSheetImg = (currentState === 'state1') ? sheet1Img : sheet2Img;
                    var frames = (currentState === 'state1') ? f1 : f2;
                    var totalCount = activeSheet ? activeSheet.totalFrames : (frames ? frames.length : 0);
                    if (totalCount <= 0) return;

                    currentFrameIdx = (currentFrameIdx + 1) % totalCount;
                    var targetWidth = (currentState === 'state1') ? s1Width : s2Width;

                    if (canvas && activeSheet && activeSheetImg) {
                        drawSheetFrame(canvas, activeSheet, activeSheetImg, currentFrameIdx, targetWidth);
                    } else if (img && frames && frames.length) {
                        img.src = frames[currentFrameIdx];
                        if (img.style.width !== targetWidth + 'px') {
                            img.style.width = targetWidth + 'px';
                        }
                    }

                    // Nếu có cả 2 trạng thái và không đang giữ vuốt ve thì luân phiên
                    var canAlternate = (sheet1 && sheet2) || (f1.length && f2.length);
                    if (canAlternate && !petHoldState.isHolding) {
                        stateElapsedMs += intervalMs;
                        var currentLimit = (currentState === 'state1') ? s1DurationMs : s2DurationMs;

                        if (stateElapsedMs >= currentLimit && currentFrameIdx === 0) {
                            currentState = (currentState === 'state1') ? 'state2' : 'state1';
                            stateElapsedMs = 0;
                            currentFrameIdx = 0;
                        }
                    }
                }, intervalMs);

                // Cập nhật biểu tượng đồng xu bé trên đầu thú cưng (khi hết 10 phút)
                var rwdCfg = (cfg && cfg.petReward) ? cfg.petReward : {
                    cooldownMinutes: 10,
                    minHoldSeconds: 1,
                    maxHoldSeconds: 3,
                    tiers: [
                        { seconds: 1, gold: 750 },
                        { seconds: 2, gold: 1200 },
                        { seconds: 3, gold: 2000 }
                    ]
                };
                var cooldownMs = (rwdCfg.cooldownMinutes || 10) * 60 * 1000;

                function updatePetReadyBadge() {
                    var badge = document.getElementById('mycamp-pet-ready-coin');
                    if (!badge) return;
                    var lastClaim = (SAVE && SAVE.lastPetRewardTime) ? SAVE.lastPetRewardTime : 0;
                    var elapsed = Date.now() - lastClaim;
                    var isReady = elapsed >= cooldownMs;
                    badge.style.display = isReady ? 'flex' : 'none';
                }
                updatePetReadyBadge();
                campAnimTimers['pet_cooldown'] = setInterval(updatePetReadyBadge, 2000);

                // Tương tác chạm & giữ nhận tiền dựa trên thời gian chạm (1s: 750, 2s: 1200, 3s: 2000)
                var container = document.getElementById(elemId);
                if (container && !container._petHoldInit) {
                    container._petHoldInit = true;
                    container.style.cursor = 'pointer';

                    // Chống mở context menu khi nhấn giữ lâu trên màn hình cảm ứng
                    container.addEventListener('contextmenu', function (e) {
                        e.preventDefault();
                    });

                    var holdStartTime = 0;
                    var lastTierReported = 0;

                    function getRewardTier(sec) {
                        if (sec >= 3.0) return { tier: 3, gold: 2000, isMax: true };
                        if (sec >= 2.0) return { tier: 2, gold: 1200, isMax: false };
                        if (sec >= 1.0) return { tier: 1, gold: 750, isMax: false };
                        return { tier: 0, gold: 0, isMax: false };
                    }

                    function onPetTouchDown(e) {
                        if (e.button !== undefined && e.button !== 0) return;
                        e.stopPropagation();

                        // 1. Chuyển ngay sang động tác anim thứ 2 khi người chơi chạm vào
                        if (f2.length || sheet2) {
                            currentState = 'state2';
                            stateElapsedMs = 0;
                            currentFrameIdx = 0;
                            var img = document.getElementById(elemId + '-img');
                            if (img && f2[0]) img.src = f2[0];
                            if (img) img.style.width = s2Width + 'px';
                            var canvas = document.getElementById(elemId + '-canvas');
                            if (canvas && sheet2 && sheet2Img) {
                                drawSheetFrame(canvas, sheet2, sheet2Img, 0, s2Width);
                            }
                        }

                        container.style.transition = 'transform 0.15s cubic-bezier(0.18, 0.89, 0.32, 1.28)';
                        container.style.transform = 'scale(1.15) translateY(-6px)';

                        var lastClaim = (SAVE && SAVE.lastPetRewardTime) ? SAVE.lastPetRewardTime : 0;
                        var elapsed = Date.now() - lastClaim;
                        var isReady = elapsed >= cooldownMs;

                        if (!isReady) {
                            // Chưa hết chu kỳ 10 phút: pet đổi tư thế, báo thời gian còn lại
                            if (typeof playSound === 'function') playSound('tap');
                            var remainMs = cooldownMs - elapsed;
                            var remainMins = Math.floor(remainMs / 60000);
                            var remainSecs = Math.floor((remainMs % 60000) / 1000);
                            var timeStr = (remainMins > 0 ? remainMins + 'p ' : '') + remainSecs + 's';
                            showPetFloatingToast(container, '⏳ Còn ' + timeStr + ' để nhận quà', false);

                            setTimeout(function () {
                                if (container && !petHoldState.isHolding) container.style.transform = '';
                            }, 200);
                            return;
                        }

                        // Đã hết 10 phút: Bắt đầu đếm thời gian giữ chạm để tính thưởng
                        petHoldState.isHolding = true;
                        holdStartTime = Date.now();
                        lastTierReported = 0;
                        if (typeof playSound === 'function') playSound('tap');

                        var indicator = document.getElementById('mycamp-pet-hold-indicator');
                        if (indicator) {
                            indicator.style.display = 'flex';
                            indicator.className = 'pet-hold-indicator';
                            indicator.innerHTML = 'Vuốt ve... 0.0s';
                        }

                        if (petHoldState.timer) clearInterval(petHoldState.timer);
                        petHoldState.timer = setInterval(function () {
                            if (!petHoldState.isHolding) {
                                clearInterval(petHoldState.timer);
                                return;
                            }

                            var holdSec = (Date.now() - holdStartTime) / 1000;
                            var info = getRewardTier(holdSec);

                            if (indicator) {
                                var dispSec = Math.min(holdSec, 3.0).toFixed(1) + 's';
                                if (info.tier === 0) {
                                    indicator.className = 'pet-hold-indicator';
                                    indicator.innerHTML = 'Vuốt ve... ' + dispSec;
                                } else if (info.isMax) {
                                    indicator.className = 'pet-hold-indicator tier-max';
                                    indicator.innerHTML = '🎉 ' + dispSec + ': +2.000 Vàng (Tối đa)';
                                } else {
                                    indicator.className = 'pet-hold-indicator tier-' + info.tier;
                                    indicator.innerHTML = '✨ ' + dispSec + ': +' + info.gold.toLocaleString('vi-VN') + ' Vàng';
                                }
                            }

                            if (info.tier > lastTierReported) {
                                lastTierReported = info.tier;
                                if (typeof playSound === 'function') playSound(info.isMax ? 'win' : 'coin');
                                container.style.transform = 'scale(' + (1.14 + info.tier * 0.04) + ') translateY(-' + (6 + info.tier * 2) + 'px)';
                            }

                            // Đạt mốc tối đa 3s: Tự động trao thưởng ngay lập tức
                            if (holdSec >= (rwdCfg.maxHoldSeconds || 3)) {
                                finalizeHoldReward();
                            }
                        }, 60);
                    }

                    function finalizeHoldReward() {
                        if (!petHoldState.isHolding) return;
                        petHoldState.isHolding = false;
                        if (petHoldState.timer) {
                            clearInterval(petHoldState.timer);
                            petHoldState.timer = null;
                        }

                        var holdSec = (Date.now() - holdStartTime) / 1000;
                        var info = getRewardTier(holdSec);

                        var indicator = document.getElementById('mycamp-pet-hold-indicator');
                        if (indicator) indicator.style.display = 'none';

                        if (container) {
                            container.style.transform = '';
                        }

                        if (info.gold > 0) {
                            // Nhận thưởng hợp lệ (>= 1s): Cộng tiền, lưu thời gian, bật tiền bay ra
                            if (typeof playerCoins !== 'undefined') playerCoins += info.gold;
                            SAVE.coins = (SAVE.coins || 0) + info.gold;
                            SAVE.lastPetRewardTime = Date.now();

                            if (typeof saveGame === 'function') saveGame();
                            if (typeof updateUIStats === 'function') updateUIStats();
                            if (typeof playSound === 'function') playSound('win');

                            // Hiệu ứng tiền bay ra
                            if (typeof spawnFlyingCurrency === 'function') {
                                spawnFlyingCurrency(container, 'gold', Math.min(info.gold, 80));
                            }

                            // Hiện số tiền nhận được bay lên
                            showPetFloatingToast(container, '+' + info.gold.toLocaleString('vi-VN') + ' Vàng', true);

                            // Cập nhật ẩn đồng xu trên đầu thú cưng
                            updatePetReadyBadge();
                        } else {
                            // Thả tay quá nhanh (< 1s): Không trừ lượt 10 phút, nhắc người chơi giữ lâu hơn
                            showPetFloatingToast(container, 'Giữ từ 1s - 3s để nhận tới 2.000 Vàng!', false);
                        }
                    }

                    container.addEventListener('mousedown', onPetTouchDown);
                    container.addEventListener('touchstart', onPetTouchDown, { passive: false });

                    window.addEventListener('mouseup', function () {
                        if (petHoldState.isHolding) finalizeHoldReward();
                    });
                    window.addEventListener('touchend', function () {
                        if (petHoldState.isHolding) finalizeHoldReward();
                    });
                    window.addEventListener('touchcancel', function () {
                        if (petHoldState.isHolding) finalizeHoldReward();
                    });
                }
            }
        }
    }

    // 2. CHẠY HOẠT ẢNH CHO CÁC ĐỐI TƯỢNG KHÁC TRONG MYCAMP_CONFIG.items
    var itemsList = (cfg && Array.isArray(cfg.items)) ? cfg.items : [];

    itemsList.forEach(function (item) {
        // Nếu item bị ẩn trong mycamp_config.js thì không chạy hoạt ảnh
        if (item.visible === false || item.hidden === true || item.enabled === false) return;
        if (item.type === 'pet' || item.id === 'slot-pet' || item.id === 'npc-dog-golden') return;
        if (item.type === 'anim_states') {
            // Đối tượng hoạt ảnh nhiều trạng thái (Đứng 1 lúc rồi ngồi)
            var elemId = 'mycamp-anim-' + item.id;
            var imgElem = document.getElementById(elemId + '-img');
            if (!imgElem) return;

            var standFrames = item.standFrames || [];
            var sitFrames = item.sitFrames || [];
            if (!standFrames.length && !sitFrames.length) return;

            // Preload toàn bộ ảnh đứng và ngồi vào bộ nhớ cache trình duyệt
            standFrames.concat(sitFrames).forEach(function (src) {
                var img = new Image();
                img.src = src;
            });

            var fps = (item.fps && item.fps > 0) ? item.fps : 8;
            var intervalMs = Math.round(1000 / fps);

            var currentState = 'stand'; // Trạng thái ban đầu: Đứng
            var currentFrameIdx = 0;
            var stateElapsedMs = 0;
            var standDurationMs = (item.standDuration || 5) * 1000;
            var sitDurationMs = (item.sitDuration || 5) * 1000;

            campAnimTimers[item.id] = setInterval(function () {
                var img = document.getElementById(elemId + '-img');
                if (!img) return;

                var frames = (currentState === 'stand') ? standFrames : sitFrames;
                if (!frames || !frames.length) return;

                // Tiến 1 khung hình
                currentFrameIdx = (currentFrameIdx + 1) % frames.length;
                img.src = frames[currentFrameIdx];

                // Cập nhật chiều rộng tương ứng với tư thế
                var targetWidth = (currentState === 'stand')
                    ? (item.standWidth || 56)
                    : (item.sitWidth || 72);
                if (img.style.width !== targetWidth + 'px') {
                    img.style.width = targetWidth + 'px';
                }

                // Tính thời gian chuyển đổi động tác
                stateElapsedMs += intervalMs;
                var currentLimit = (currentState === 'stand') ? standDurationMs : sitDurationMs;

                // Khi hết thời gian VÀ đã hoàn thành trọn vẹn 1 chu kỳ loop
                if (stateElapsedMs >= currentLimit && currentFrameIdx === 0) {
                    currentState = (currentState === 'stand') ? 'sit' : 'stand';
                    stateElapsedMs = 0;
                    currentFrameIdx = 0;
                }
            }, intervalMs);

            // Tương tác chạm (Tap / Click)
            var container = document.getElementById(elemId);
            if (container && !container._tapInit) {
                container._tapInit = true;
                container.style.cursor = 'pointer';
                container.addEventListener('click', function (e) {
                    e.stopPropagation();
                    if (typeof playSound === 'function') playSound('tap');

                    // Nếu đang ngồi thì bật dậy đứng ngay
                    if (currentState === 'sit') {
                        currentState = 'stand';
                        stateElapsedMs = 0;
                        currentFrameIdx = 0;
                    }

                    container.style.transition = 'transform 0.18s cubic-bezier(0.18, 0.89, 0.32, 1.28)';
                    container.style.transform = 'scale(1.18) translateY(-8px)';
                    setTimeout(function () {
                        if (container) container.style.transform = '';
                    }, 200);

                    showPetFloatingToast(container, '✨', false);
                });
            }
            return;
        }

        if (item.type !== 'anim') return;

        var framesList = item.frames || [];
        if (!framesList.length && item.framesPrefix && item.frameCount) {
            framesList = [];
            for (var f = 1; f <= item.frameCount; f++) {
                framesList.push(item.framesPrefix + f + (item.extension || '.png'));
            }
        }
        if (!framesList.length) return;

        // Preload frames to browser cache
        framesList.forEach(function (src) {
            var img = new Image();
            img.src = src;
        });

        var elemId = 'mycamp-anim-' + item.id;
        var fps = (item.fps && item.fps > 0) ? item.fps : 8;
        var intervalMs = Math.round(1000 / fps);
        var currentFrame = 0;

        campAnimTimers[item.id] = setInterval(function () {
            var img = document.getElementById(elemId + '-img');
            if (!img) return;
            currentFrame = (currentFrame + 1) % framesList.length;
            img.src = framesList[currentFrame];
        }, intervalMs);

        // Tap reaction
        var container = document.getElementById(elemId);
        if (container && !container._tapInit) {
            container._tapInit = true;
            container.style.cursor = 'pointer';
            container.addEventListener('click', function (e) {
                e.stopPropagation();
                if (typeof playSound === 'function') playSound('tap');

                container.style.transition = 'transform 0.18s cubic-bezier(0.18, 0.89, 0.32, 1.28)';
                container.style.transform = 'scale(1.18) translateY(-8px)';
                setTimeout(function () {
                    if (container) container.style.transform = '';
                }, 200);

                showPetFloatingToast(container, '✨', false);
            });
        }
    });
}

function renderMyCampScene() {
    var stage = document.getElementById('mycamp-stage');
    var itemsContainer = document.getElementById('mycamp-items-container') || stage;
    var screen = document.getElementById('my-camp-screen');
    if (!stage) return;

    var cfg = (typeof MYCAMP_CONFIG !== 'undefined' && MYCAMP_CONFIG) ? MYCAMP_CONFIG : null;
    var bgCfg = (cfg && cfg.background) ? cfg.background : {};
    var bgWidth = (bgCfg.width !== undefined) ? bgCfg.width : 400;
    var bgHeight = (bgCfg.height !== undefined) ? bgCfg.height : Math.round(bgWidth * 1640 / 1100);
    var bgColor = bgCfg.color || '#566443';
    var bgSrc = (typeof getMyCampBackgroundSrc === 'function')
        ? getMyCampBackgroundSrc()
        : (bgCfg.src || 'assets/images/items_khutrai/bg_khutrai.jpg');

    // 1. Cấu hình màu nền / Gradient 3 màu toàn màn hình
    if (screen) {
        if (bgCfg.gradient && bgCfg.gradient.enabled) {
            var grad = bgCfg.gradient;
            var angle = (grad.angle !== undefined) ? grad.angle : 180;
            var c1 = grad.color1 || '#2c3d28';
            var c2 = grad.color2 || '#475e3e';
            var c3 = grad.color3 || '#1f2b1c';
            screen.style.backgroundImage = 'linear-gradient(' + angle + 'deg, ' + c1 + ' 0%, ' + c2 + ' 50%, ' + c3 + ' 100%)';
            screen.style.backgroundColor = c2;
        } else {
            screen.style.backgroundImage = 'none';
            screen.style.backgroundColor = bgColor;
        }

        // Hiệu ứng ánh sáng nhẹ (Lighting Effect)
        var lightOverlay = document.getElementById('mycamp-lighting-overlay');
        if (!lightOverlay) {
            lightOverlay = document.createElement('div');
            lightOverlay.id = 'mycamp-lighting-overlay';
            lightOverlay.className = 'mycamp-lighting-overlay';
            screen.appendChild(lightOverlay);
        }
        var lightCfg = bgCfg.lighting || {};
        if (lightCfg.enabled) {
            lightOverlay.style.display = 'block';
            var lColor = lightCfg.color || 'rgba(255, 255, 215, 0.26)';
            var lPosX = lightCfg.positionX || '50%';
            var lPosY = lightCfg.positionY || '18%';
            var lSize = lightCfg.size || '72%';
            lightOverlay.style.background = 'radial-gradient(circle at ' + lPosX + ' ' + lPosY + ', ' + lColor + ' 0%, rgba(255, 255, 255, 0) ' + lSize + ')';
            if (lightCfg.pulse) {
                lightOverlay.classList.add('mycamp-light-pulse');
            } else {
                lightOverlay.classList.remove('mycamp-light-pulse');
            }
        } else {
            lightOverlay.style.display = 'none';
        }
    }

    // 2. Cố định kích thước nền và căn giữa sân khấu cắm trại
    stage.style.width = bgWidth + 'px';
    stage.style.height = bgHeight + 'px';
    stage.style.marginLeft = (-Math.round(bgWidth / 2)) + 'px';
    stage.style.marginTop = (-Math.round(bgHeight / 2)) + 'px';

    // 3. Ảnh nền khu trại (luôn nằm cùng tọa độ với các item)
    var bgImg = document.getElementById('mycamp-bg-img');
    if (bgImg) {
        if (bgImg.getAttribute('src') !== bgSrc) bgImg.src = bgSrc;
        bgImg.style.width = '100%';
        bgImg.style.height = '100%';
    }

    // 4. Lưới ô căn chỉnh (Grid overlay)
    var gridOverlay = document.getElementById('mycamp-grid-overlay');
    if (gridOverlay && cfg && cfg.grid) {
        gridOverlay.style.display = cfg.grid.show ? 'block' : 'none';
        if (cfg.grid.cellWidth && cfg.grid.cellHeight) {
            gridOverlay.style.backgroundSize = cfg.grid.cellWidth + 'px ' + cfg.grid.cellHeight + 'px';
        }
        if (cfg.grid.opacity !== undefined) {
            gridOverlay.style.opacity = cfg.grid.opacity;
        }
    }

    // 5. Render danh sách các đối tượng từ MYCAMP_CONFIG.items
    var eq = (SAVE && SAVE.myCampEquipped) ? SAVE.myCampEquipped : {};
    var itemsList = (cfg && Array.isArray(cfg.items)) ? cfg.items : [];

    var html = '';
    itemsList.forEach(function (item) {
        // TÍNH NĂNG ẨN / HIỆN: Nếu đặt visible: false hoặc hidden: true thì bỏ qua không vẽ lên bãi cắm trại
        if (item.visible === false || item.hidden === true || item.enabled === false) return;

        var style = 'position:absolute;' +
            'left:' + (typeof item.left === 'number' ? item.left + 'px' : item.left) + ';' +
            'top:' + (typeof item.top === 'number' ? item.top + 'px' : item.top) + ';' +
            'width:' + (typeof item.width === 'number' ? item.width + 'px' : item.width) + ';' +
            'height:' + (typeof item.height === 'number' ? item.height + 'px' : item.height) + ';' +
            'z-index:' + (item.zIndex !== undefined ? item.zIndex : 10) + ';';

        if (item.transform) style += 'transform:' + item.transform + ';';
        if (item.extraStyle) style += item.extraStyle + ';';

        var imgFit = item.fit ? ('object-fit:' + item.fit + ';height:100%;') : '';

        if (item.type === 'pet' || item.id === 'slot-pet' || item.id === 'npc-dog-golden') {
            // Thú cưng đồng hành theo cơ chế người chơi chọn mua (SAVE.activePet)
            var activePetId = (SAVE && SAVE.activePet) ? SAVE.activePet : 'character01';
            var petConfig = (cfg && cfg.pets && cfg.pets[activePetId]) ? cfg.pets[activePetId] : null;

            // Nếu con vật chưa có chuyển động (chưa có frame animation hay spritesheet) thì tự động để trống bãi cỏ
            var f1 = petConfig ? (petConfig.state1Frames || petConfig.standFrames || petConfig.idleFrames || []) : [];
            var f2 = petConfig ? (petConfig.state2Frames || petConfig.sitFrames || petConfig.helloFrames || []) : [];
            var s1Sheet = petConfig ? petConfig.state1Sheet : null;
            var s2Sheet = petConfig ? petConfig.state2Sheet : null;
            var hasSheet = !!(s1Sheet || s2Sheet);

            if (!petConfig || (!f1.length && !f2.length && !hasSheet)) {
                // "Nếu con vật nào chưa có chuyển động thì cứ để trống"
                return;
            }

            var petLeft = (petConfig.left !== undefined) ? petConfig.left : item.left;
            var petTop = (petConfig.top !== undefined) ? petConfig.top : item.top;
            var petWidth = (petConfig.width !== undefined) ? petConfig.width : item.width;
            var petHeight = (petConfig.height !== undefined) ? petConfig.height : item.height;
            var petZIndex = (petConfig.zIndex !== undefined) ? petConfig.zIndex : item.zIndex;

            var petStyle = 'position:absolute;' +
                'left:' + (typeof petLeft === 'number' ? petLeft + 'px' : petLeft) + ';' +
                'top:' + (typeof petTop === 'number' ? petTop + 'px' : petTop) + ';' +
                'width:' + (typeof petWidth === 'number' ? petWidth + 'px' : petWidth) + ';' +
                'height:' + (typeof petHeight === 'number' ? petHeight + 'px' : petHeight) + ';' +
                'z-index:' + (petZIndex !== undefined ? petZIndex : 18) + ';' +
                'display:flex;align-items:flex-end;justify-content:center;';

            var elemId = 'mycamp-anim-pet';
            var initialSrc = f1[0] || f2[0] || '';
            var initialW = petConfig.state1Width || petConfig.standWidth || petConfig.idleWidth || 60;

            html += '<div id="' + elemId + '" class="mycamp-item mycamp-anim-item mycamp-pet mycamp-pet-' + activePetId + '" data-pet-id="' + activePetId + '" style="' + petStyle + '" title="' + (petConfig.name || '') + '">';
            if (hasSheet) {
                var activeS = s1Sheet || s2Sheet;
                html += '<canvas id="' + elemId + '-canvas" class="mycamp-prop-img" style="display:block;width:' + initialW + 'px;height:auto;pointer-events:none;" width="' + activeS.frameWidth + '" height="' + activeS.frameHeight + '"></canvas>';
            } else {
                html += '<img id="' + elemId + '-img" src="' + initialSrc + '" class="mycamp-prop-img" style="display:block;width:' + initialW + 'px;height:auto;pointer-events:none;" alt="' + (petConfig.name || '') + '">';
            }
            // Đồng xu bé trên đầu thú cưng (hiển thị khi hết chu kỳ 10 phút để người chơi biết chạm vào nhận tiền)
            html += '<div id="mycamp-pet-ready-coin" class="pet-ready-coin" style="display:none;"><img src="assets/images/ui/icon_glod.png" class="pet-ready-coin-img" alt="Vàng"></div>';
            // Thanh trạng thái thời gian giữ chạm (vuốt ve)
            html += '<div id="mycamp-pet-hold-indicator" class="pet-hold-indicator" style="display:none;"></div>';
            html += '</div>';
            return;
        }

        if (item.type === 'decor' || item.type === 'cloud') {
            // Vật trang trí cố định (Cây thông, cột đèn, đám mây, v.v.)
            var elemId = 'mycamp-decor-' + item.id;
            var cloudClass = item.type === 'cloud'
                ? (' mycamp-cloud ' + (item.animClass || (item.id === 'cloud-top' ? 'mycamp-cloud-top-anim' : (item.id === 'cloud-bottom' ? 'mycamp-cloud-bottom-anim' : ''))))
                : '';
            var cloudImgStyle = (item.opacity !== undefined) ? ('opacity:' + item.opacity + ';') : '';
            html += '<div id="' + elemId + '" class="mycamp-item mycamp-' + item.id + cloudClass + '" style="' + style + '" title="' + (item.name || '') + '">';
            html += '<img src="' + item.src + '" class="mycamp-prop-img" style="' + imgFit + cloudImgStyle + '" alt="' + (item.name || '') + '">';
            html += '</div>';
        } else if (item.type === 'anim_states') {
            // Đối tượng hoạt ảnh nhiều trạng thái luân phiên (Đứng 1 lúc rồi ngồi)
            var elemId = 'mycamp-anim-' + item.id;
            var initialSrc = (item.standFrames && item.standFrames[0]) || (item.sitFrames && item.sitFrames[0]) || '';
            var initialWidth = item.standWidth || 56;
            html += '<div id="' + elemId + '" class="mycamp-item mycamp-anim-item mycamp-' + item.id + '" style="' + style + 'display:flex;align-items:flex-end;justify-content:center;" title="' + (item.name || '') + '">';
            html += '<img id="' + elemId + '-img" src="' + initialSrc + '" class="mycamp-prop-img" style="display:block;width:' + initialWidth + 'px;height:auto;pointer-events:none;" alt="' + (item.name || '') + '">';
            html += '</div>';
        } else if (item.type === 'anim') {
            // Đối tượng hoạt ảnh chuỗi hình (Sprite animation)
            var elemId = 'mycamp-anim-' + item.id;
            var framesList = item.frames || [];
            if (!framesList.length && item.framesPrefix && item.frameCount) {
                framesList = [];
                for (var f = 1; f <= item.frameCount; f++) {
                    framesList.push(item.framesPrefix + f + (item.extension || '.png'));
                }
            }
            var initialSrc = framesList[0] || '';
            html += '<div id="' + elemId + '" class="mycamp-item mycamp-anim-item mycamp-' + item.id + '" style="' + style + '" title="' + (item.name || '') + '">';
            html += '<img id="' + elemId + '-img" src="' + initialSrc + '" class="mycamp-prop-img" style="' + imgFit + '" alt="' + (item.name || '') + '">';
            html += '</div>';
        } else if (item.type === 'slot') {
            // Slot gắn đồ trang bị người chơi thu thập
            var elemId = 'mycamp-slot-' + item.slotKey;
            var equippedVal = eq[item.slotKey];
            var equippedId = (typeof equippedVal === 'object' && equippedVal) ? equippedVal.id : equippedVal;

            // BẢO VỆ TUYỆT ĐỐI: Chỉ hiển thị nếu itemUid thực sự nằm trong kho SAVE.campItems của người chơi
            var itemUid = (typeof equippedVal === 'object' && equippedVal) ? equippedVal.uid : null;
            var existsInCamp = false;
            if (itemUid && SAVE && Array.isArray(SAVE.campItems)) {
                existsInCamp = SAVE.campItems.some(function (it) { return it.uid === itemUid; });
            }

            var itemData = (existsInCamp && equippedId && typeof KHUTRAI_ITEMS !== 'undefined' && KHUTRAI_ITEMS)
                ? KHUTRAI_ITEMS[equippedId]
                : null;

            if (itemData) {
                html += '<div id="' + elemId + '" class="mycamp-item mycamp-' + item.slotKey + '" style="' + style + '" title="' + (itemData.name || item.name || '') + '">';
                html += '<img src="' + itemData.path + '" class="mycamp-prop-img" style="' + imgFit + '" alt="' + (itemData.name || item.name || '') + '">';
                html += '</div>';
            } else {
                html += '<div id="' + elemId + '" class="mycamp-item mycamp-' + item.slotKey + '" style="' + style + 'display:none;" title="' + (item.name || '') + '"></div>';
            }
        }
    });

    itemsContainer.innerHTML = html;

    // Khởi động các bộ chạy hoạt ảnh chuỗi hình
    startCampAnimators();

    // Áp dụng transform pan & zoom hiện tại
    applyMyCampTransform();
}

// Tự động gắn sự kiện cho các nút điều khiển Trại Của Bạn
if (typeof document !== 'undefined' && typeof document.getElementById === 'function') {
    function initMyCampListeners() {
        var myCampBtn = document.getElementById('btn-my-camp');
        if (myCampBtn) {
            myCampBtn.onclick = function () {
                openMyCamp();
            };
        }
        var backBtn = document.getElementById('btn-mycamp-back');
        if (backBtn) {
            backBtn.onclick = function () {
                closeMyCamp();
            };
        }
        var playBtn = document.getElementById('btn-mycamp-play');
        if (playBtn) {
            playBtn.onclick = function () {
                closeMyCamp();
            };
        }
        var decorBtn = document.getElementById('btn-mycamp-decor');
        if (decorBtn) {
            decorBtn.onclick = function () {
                openCampItemsModal();
            };
        }
        var resetBtn = document.getElementById('btn-mycamp-reset');
        if (resetBtn) {
            resetBtn.onclick = function () {
                resetMyCampView(true);
            };
        }
        initMyCampViewportInteractions();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMyCampListeners);
    } else {
        initMyCampListeners();
    }
}

