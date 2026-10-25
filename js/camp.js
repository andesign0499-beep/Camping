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

function closeModal() {
    var m = document.getElementById('modal-overlay');
    if (m) m.remove();
}

function createModal(innerHtml, extraClass, titleText) {
    closeModal();
    var oldToast = document.getElementById('game-toast');
    if (oldToast) oldToast.remove();
    if (typeof hideNpcBubble === 'function') hideNpcBubble();
    if (typeof clearHintVisuals === 'function') clearHintVisuals();

    var overlay = document.createElement('div');
    overlay.id = 'modal-overlay';

    var ribbonHtml = titleText ? ('<div class="popup-ribbon"><span>' + titleText + '</span></div>') : '';

    overlay.innerHTML = '<div class="modal-box ' + (extraClass || '') + '">' +
        ribbonHtml +
        '<div class="popup-bg-3slice" aria-hidden="true">' +
            '<div class="p3-top"></div>' +
            '<div class="p3-mid"></div>' +
            '<div class="p3-bot"></div>' +
        '</div>' +
        '<div class="modal-content-wrap">' + innerHtml + '</div>' +
    '</div>';

    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeModal();
    });

    document.body.appendChild(overlay);
    return overlay;
}

// ---------- 1. TOAST THÔNG BÁO (THAY THẾ ALERT) ----------
var toastTimer = null;
function showToast(msg, bg) {
    var old = document.getElementById('game-toast');
    if (old) old.remove();
    if (toastTimer) clearTimeout(toastTimer);

    var t = document.createElement('div');
    t.id = 'game-toast';
    t.style.background = bg || '#4e342e';
    t.textContent = msg;
    document.body.appendChild(t);

    toastTimer = setTimeout(function () {
        if (t.parentNode) t.remove();
    }, 2000);
}

// ---------- 2. MÀN HÌNH CHIẾN THẮNG ----------
function showWinModal(info, onReplay, onNext) {
    var starsHtml = '';
    for (var i = 1; i <= 3; i++) {
        var isStarOn = i <= info.stars;
        starsHtml += '<img src="assets/images/ui/icon_star.png" class="win-star-img' + (isStarOn ? ' on' : ' off') + '" ' +
            'style="animation-delay:' + (i * 0.16) + 's" alt="">';
    }
    var decorHtml = '';
    if (info.decor && info.firstTime) {
        var imgPath = info.decor[1] === 'ban_lv8' ? 'assets/images/items/ban_level8.png' : ('assets/images/items/' + info.decor[1] + '.png');
        decorHtml = '<div class="win-decor">' +
            '🎉 Mở khóa vật phẩm mới:' +
            '<div class="win-decor-item"><img src="' + imgPath + '" style="width:28px;height:28px;object-fit:contain;vertical-align:middle;margin-right:6px"> ' + info.decor[2] + '</div></div>';
    }
    var gemText = info.gems > 0 ? ' &nbsp;+' + info.gems + ' ' + ICON_RUBY_HTML : '';

    var baseWinCoins = (info.alreadyDoubled ? info.coins * 2 : info.coins);
    var totalCoinsWithSweep = baseWinCoins + (info.sweepCoins || 0);

    var sweepHtml = '';
    if (info.sweepCoins > 0) {
        sweepHtml = '<div class="win-sweep-banner">🧹 Thu dọn <b>' + info.sweepCount + '</b> vật phẩm thừa: <b style="color:#e65100">+' + info.sweepCoins.toLocaleString('vi-VN') + ' ' + ICON_GOLD_HTML + '</b></div>';
    }

    var nextBtnHtml = info.hasNext
        ? '<button class="modal-btn primary" id="mb-next">Màn tiếp</button>'
        : '<button class="modal-btn primary" id="mb-close">Đóng</button>';

    var doubleBtnHtml = info.alreadyDoubled
        ? '<button class="modal-btn disabled-btn win-btn-double" disabled id="mb-double-ad">✅ Đã x2 Thưởng (+' + (info.coins * 2).toLocaleString('vi-VN') + ' ' + ICON_GOLD_HTML + ')</button>'
        : '<button class="modal-btn gem-btn win-btn-double" id="mb-double-ad">🎬 x2 Vàng Thưởng (+' + info.coins.toLocaleString('vi-VN') + ' ' + ICON_GOLD_HTML + ')</button>';

    var overlay = createModal(
        '<div class="modal-sub">Level ' + info.level + ': ' + info.name + '</div>' +
        '<div class="win-stars">' + starsHtml + '</div>' +
        '<div class="win-coins">+' + totalCoinsWithSweep.toLocaleString('vi-VN') + ' ' + ICON_GOLD_HTML + gemText +
            (info.firstTime ? '' : ' <small>(chơi lại)</small>') + '</div>' +
        sweepHtml +
        decorHtml +
        '<div class="win-buttons-system">' +
            doubleBtnHtml +
            '<div class="win-btn-row">' +
                '<button class="modal-btn gem-btn" id="mb-replay">Chơi lại</button>' +
                nextBtnHtml +
            '</div>' +
        '</div>',
        'win-box',
        'HOÀN THÀNH'
    );

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
            simulateWatchAd('Nhân Đôi Vàng Thưởng Màn Chơi (+' + info.coins + ' 🪙)', function () {
                if (typeof playerCoins !== 'undefined') playerCoins += info.coins;
                if (typeof updateUIStats === 'function') updateUIStats();
                if (typeof playSound === 'function') playSound('win');
                var coinEl = document.getElementById('btn-coin-shop') || document.body;
                if (typeof spawnFlyingCurrency === 'function') spawnFlyingCurrency(coinEl, 'gold', Math.min(info.coins, 100));
                showToast('🎉 Đã x2 Vàng thành công: +' + info.coins + ' Vàng!', '#2e7d32');
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

// ---------- 3. KHU CẮM TRẠI (BẢN ĐỒ LƯỚI BÀN CHƠI 45 Ô & BỘ SƯU TẬP THÚ CƯNG) ----------
function openCamp(highlightLevel, onBack, initialTab) {
    var unlockedCount = countUnlockedDecors();
    var cellsHtml = '';

    CAMP_DECORS.forEach(function (d, idx) {
        var lv = d[0];
        var id = d[1];
        var name = d[2];
        var unlocked = isCampDecorUnlocked(d);
        var r = Math.floor(idx / 5);
        var c = idx % 5;
        var bgCls = (r + c) % 2 === 0 ? 'bg-light' : 'bg-dark';
        var imgPath = id === 'ban_lv8' ? 'assets/images/items/ban_level8.png' : ('assets/images/items/' + id + '.png');
        var itemContent = '<img src="' + imgPath + '" class="item-img" alt="' + name + '">';

        var isHighlighted = (lv === highlightLevel && unlocked);
        var extraCls = isHighlighted ? ' highlighted' : '';

        cellsHtml += '<div class="camp-cell ' + bgCls + (unlocked ? ' unlocked' : ' locked') + extraCls + '" ' +
            'data-lv="' + lv + '" data-id="' + id + '" data-name="' + name + '">' +
            itemContent +
            '<span class="camp-cell-num">' + lv + '</span>' +
        '</div>';
    });

    var petsList = (typeof PET_CHARACTERS !== 'undefined') ? PET_CHARACTERS : [
        { id: 'character01', name: 'Golden', img: 'assets/images/ui/character01.png', price: 0 },
        { id: 'character05', name: 'Labrador', img: 'assets/images/ui/character05.png', price: 30000 },
        { id: 'character04', name: 'Poodle', img: 'assets/images/ui/character04.png', price: 30000 },
        { id: 'character03', name: 'Bulldog', img: 'assets/images/ui/character03.png', price: 30000 },
        { id: 'character02', name: 'Béc-giê', img: 'assets/images/ui/character02.png', price: 30000 },
        { id: 'character10', name: 'Ba Tư', img: 'assets/images/ui/character10.png', price: 30000 },
        { id: 'character09', name: 'Maine Coon', img: 'assets/images/ui/character09.png', price: 30000 },
        { id: 'character08', name: 'Ragdoll', img: 'assets/images/ui/character08.png', price: 30000 },
        { id: 'character07', name: 'Mèo Anh', img: 'assets/images/ui/character07.png', price: 30000 },
        { id: 'character06', name: 'Xiêm', img: 'assets/images/ui/character06.png', price: 30000 }
    ];

    var defaultTab = (initialTab === 'pets') ? 'pets' : 'decor';

    var overlay = createModal(
        '<div class="camp-tab-nav">' +
            '<button class="camp-tab-btn' + (defaultTab === 'decor' ? ' active' : '') + '" id="tab-btn-decor">📦 Vật Phẩm</button>' +
            '<button class="camp-tab-btn' + (defaultTab === 'pets' ? ' active' : '') + '" id="tab-btn-pets">🐾 Thú Cưng</button>' +
        '</div>' +
        '<div id="camp-pane-decor" class="camp-tab-pane" style="' + (defaultTab === 'decor' ? '' : 'display:none;') + '">' +
            '<div class="modal-sub">Đã mở khóa: <b>' + unlockedCount + '/' + CAMP_DECORS.length + '</b> vật phẩm</div>' +
            '<div class="camp-board-wrap">' +
                '<div class="camp-grid">' +
                    cellsHtml +
                '</div>' +
            '</div>' +
            '<div id="camp-info-bar" class="camp-info-bar">Chạm vào một ô trên bàn cờ để xem chi tiết vật phẩm</div>' +
        '</div>' +
        '<div id="camp-pane-pets" class="camp-tab-pane" style="' + (defaultTab === 'pets' ? '' : 'display:none;') + '">' +
            '<div class="modal-sub" id="pets-unlocked-sub">Bộ sưu tập thú cưng đồng hành</div>' +
            '<div class="pets-scroll-wrap">' +
                '<div class="pets-grid" id="pets-grid-container"></div>' +
            '</div>' +
        '</div>' +
        '<div class="modal-buttons"><button class="modal-btn primary" id="mb-close">Đóng</button></div>',
        'camp-box',
        'KHU CẮM TRẠI'
    );

    var tabBtnDecor = overlay.querySelector('#tab-btn-decor');
    var tabBtnPets = overlay.querySelector('#tab-btn-pets');
    var paneDecor = overlay.querySelector('#camp-pane-decor');
    var panePets = overlay.querySelector('#camp-pane-pets');
    var petsGridContainer = overlay.querySelector('#pets-grid-container');
    var petsSub = overlay.querySelector('#pets-unlocked-sub');

    function switchTab(tab) {
        if (tab === 'decor') {
            tabBtnDecor.classList.add('active');
            tabBtnPets.classList.remove('active');
            paneDecor.style.display = '';
            panePets.style.display = 'none';
        } else {
            tabBtnPets.classList.add('active');
            tabBtnDecor.classList.remove('active');
            panePets.style.display = '';
            paneDecor.style.display = 'none';
            renderPetsGrid();
        }
    }

    tabBtnDecor.onclick = function () { switchTab('decor'); };
    tabBtnPets.onclick = function () { switchTab('pets'); };

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
                priceHtml = '<div class="pet-price owned">' + (isActive ? '🐾 Đang chọn' : 'Đã sở hữu') + '</div>';
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
                    showToast('⚠️ Bạn không đủ Vàng! Cần ' + cost.toLocaleString('vi-VN') + ' Vàng để mua ' + pet.name + '.', '#d32f2f');
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
                showToast('🎉 Bạn đã mua thành công & chọn ' + pet.name + ' làm bạn đồng hành!', '#2e7d32');
                renderPetsGrid();
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
                showToast('🐾 Đã chọn ' + pet.name + ' làm bạn đồng hành!', '#2e7d32');
                renderPetsGrid();
            };
        });
    }

    renderPetsGrid();

    var infoBar = overlay.querySelector('#camp-info-bar');
    overlay.querySelectorAll('.camp-cell').forEach(function (el) {
        el.onclick = function () {
            var lv = parseInt(el.dataset.lv);
            var id = el.dataset.id;
            var name = el.dataset.name;
            var d = getCampDecor(lv);
            var unlocked = isCampDecorUnlocked(d);
            if (unlocked) {
                var img = el.querySelector('.item-img');
                if (img) {
                    img.animate([
                        { transform: 'scale(0.7)' },
                        { transform: 'scale(1.2)' },
                        { transform: 'scale(1)' }
                    ], { duration: 300, easing: 'ease-out' });
                }
                var starInfo = SAVE && SAVE.stars && SAVE.stars[lv] ? (' (' + '★'.repeat(SAVE.stars[lv]) + ')') : '';
                infoBar.innerHTML = '✨ <b>' + name + '</b> (Ô #' + lv + ')' + starInfo + ' — Đã mở khóa vào khu trại!';
            } else {
                infoBar.innerHTML = '🔒 <b>Ô #' + lv + ' (' + name + ')</b> — Hãy vượt qua <b>Level ' + lv + '</b> để mở khóa!';
            }
        };
    });

    overlay.querySelector('#mb-close').onclick = function () {
        closeModal();
        if (onBack) onBack();
    };
}

// ==========================================
// ĐỊNH NGHĨA KINH TẾ IAP, QUẢNG CÁO & CỬA HÀNG
// Đọc từ js/config.js (GAME_CONFIG) để người dùng có thể dễ dàng chỉnh sửa
// ==========================================
var GEM_IAP_PACKS = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.iapPacks) ? GAME_CONFIG.iapPacks : [
    {
        id: 'gem_tier_1',
        name: 'Túi Kim Cương Nhỏ',
        gems: 30,
        bonusGems: 0,
        priceVnd: '5.000 ₫',
        badge: null,
        desc: 'Đủ 3 lần nạp siêu tốc (+120 ⚡)'
    },
    {
        id: 'gem_tier_2',
        name: 'Túi Kim Cương Vừa',
        gems: 60,
        bonusGems: 10,
        priceVnd: '10.000 ₫',
        badge: '+15% THÊM',
        desc: 'Tặng thêm +10 💎 khuyến mãi'
    },
    {
        id: 'gem_tier_3',
        name: 'Rương Kim Cương',
        gems: 90,
        bonusGems: 25,
        priceVnd: '15.000 ₫',
        badge: '⭐ HỜI NHẤT +28%',
        isPopular: true,
        desc: 'Tặng thêm +25 💎 khuyến mãi'
    },
    {
        id: 'gem_tier_4',
        name: 'Kho Báu Kim Cương',
        gems: 320,
        bonusGems: 180,
        priceVnd: '49.000 ₫',
        badge: '👑 SIÊU GIÁ TRỊ +56%',
        desc: 'Gói nạp tối thượng, nhận ngay 500 💎'
    }
];

var COIN_PACKS = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.coinExchangePacks) ? GAME_CONFIG.coinExchangePacks : [
    {
        id: 'coin_pack_1',
        name: 'Túi Vàng Nhỏ',
        coins: 300,
        gemCost: 5,
        desc: 'Đổi từ 5 Kim Cương'
    },
    {
        id: 'coin_pack_2',
        name: 'Rương Vàng Lớn',
        coins: 1000,
        gemCost: 15,
        badge: '⭐ TIẾT KIỆM 10%',
        desc: 'Đổi từ 15 Kim Cương'
    },
    {
        id: 'coin_pack_3',
        name: 'Kho Vàng Hoàng Gia',
        coins: 2200,
        gemCost: 30,
        badge: '🔥 SIÊU LỜI +20%',
        desc: 'Đổi từ 30 Kim Cương'
    }
];

// ---------- MÔ PHỎNG XEM QUẢNG CÁO (REWARDED AD) ----------
function simulateWatchAd(title, onReward) {
    var timerVal = 3;
    var overlay = createModal(
        '<div class="ad-sim-container">' +
            '<div class="ad-sim-topbar">' +
                '<span class="ad-sponsor-tag">🎬 QUẢNG CÁO TÀI TRỢ</span>' +
                '<span id="ad-sim-timer" class="ad-sim-timer">Bỏ qua sau 3s</span>' +
            '</div>' +
            '<div class="ad-sim-viewport">' +
                '<div class="ad-sim-badge">CAMPING MERGE ADVENTURE</div>' +
                '<div class="ad-sim-icon-glow">🏕️✨</div>' +
                '<div class="ad-sim-title">' + (title || 'Đang phát video tài trợ...') + '</div>' +
                '<div class="ad-sim-sub">Cảm ơn bạn đã xem quảng cáo ủng hộ trò chơi!</div>' +
                '<div class="ad-sim-pbar-wrap">' +
                    '<div id="ad-sim-pbar" class="ad-sim-pbar"></div>' +
                '</div>' +
            '</div>' +
            '<div class="ad-sim-bottom">' +
                '<button class="modal-btn disabled-btn" id="ad-sim-action" disabled>⏳ Đang phát (3s)...</button>' +
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
            if (actionBtn) actionBtn.innerText = '⏳ Đang phát (' + timerVal + 's)...';
        } else {
            clearInterval(countdownInterval);
            if (timerEl) timerEl.innerText = '✅ Hoàn tất';
            if (actionBtn) {
                actionBtn.className = 'modal-btn primary';
                actionBtn.disabled = false;
                actionBtn.innerText = '🎁 NHẬN THƯỞNG NGAY';
                actionBtn.onclick = function () {
                    closeModal();
                    if (onReward) onReward();
                };
            }
        }
    }, 800);
}

// ---------- MÔ PHỎNG MUA IAP (APPLE STORE / GOOGLE PLAY) ----------
function simulateBuyIAP(pack, onConfirm) {
    var overlay = createModal(
        '<div class="iap-dialog-container">' +
            '<div class="iap-header">' +
                '<span class="iap-store-badge"> App Store / Google Play</span>' +
                '<div class="iap-title">Xác Nhận Mua Gói IAP</div>' +
            '</div>' +
            '<div class="iap-pack-banner">' +
                '<div class="iap-pack-name">💎 ' + pack.name + '</div>' +
                (pack.badge ? '<span class="iap-pack-badge">' + pack.badge + '</span>' : '') +
            '</div>' +
            '<div class="iap-body">' +
                '<div class="iap-row">' +
                    '<span>Kim cương nhận:</span>' +
                    '<b style="color:#0288d1">+' + (pack.gems + (pack.bonusGems || 0)).toLocaleString('vi-VN') + ' ' + ICON_RUBY_HTML + '</b>' +
                '</div>' +
                (pack.coins ? '<div class="iap-row"><span>Vàng kèm theo:</span> <b style="color:#f57f17">+' + pack.coins.toLocaleString('vi-VN') + ' ' + ICON_GOLD_HTML + '</b></div>' : '') +
                (pack.energy ? '<div class="iap-row"><span>Năng lượng tức thì:</span> <b style="color:#2e7d32">+' + pack.energy + ' ' + ICON_ENERGY_HTML + '</b></div>' : '') +
                '<div class="iap-row price-row">' +
                    '<span>Tổng giá thanh toán:</span>' +
                    '<b class="iap-price-val">' + pack.priceVnd + '</b>' +
                '</div>' +
            '</div>' +
            '<div class="iap-mock-notice">' +
                '<small>💡 Đây là giao diện giả lập nạp IAP theo yêu cầu. Nhấn "Thanh Toán" để cộng ngay vật phẩm vào tài khoản!</small>' +
            '</div>' +
            '<div class="modal-buttons">' +
                '<button class="modal-btn gem-btn" id="btn-iap-cancel">Hủy Bỏ</button>' +
                '<button class="modal-btn primary" id="btn-iap-pay">Thanh Toán</button>' +
            '</div>' +
        '</div>',
        'iap-box'
    );

    overlay.querySelector('#btn-iap-cancel').onclick = closeModal;
    overlay.querySelector('#btn-iap-pay').onclick = function () {
        closeModal();
        if (onConfirm) onConfirm(pack);
    };
}

// ---------- 4A. CỬA HÀNG NĂNG LƯỢNG & CỨU TRỢ (TRẠM TIẾP NĂNG LƯỢNG) ----------
// opts: { energy, maxEnergy, coins, gems, secLeft, adsLeft, onBuyCoins, onBuyGems, onWatchAd, onRescue, onOpenGemShop }
function showEnergyShopModal(opts) {
    var canCoin = opts.coins >= ENERGY_PACK_PRICE;
    var canGem = opts.gems >= GEM_ENERGY_PRICE;
    var rescueCfg = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.energyShop && GAME_CONFIG.energyShop.rescue)
        ? GAME_CONFIG.energyShop.rescue
        : { enabled: false, amount: 15 };
    var needRescue = rescueCfg.enabled && opts.energy <= 5 && typeof opts.onRescue === 'function';

    var rescueHtml = needRescue
        ? '<div class="shop-card rescue-card">' +
            '<div class="shop-card-left">' +
                '<div class="shop-card-title">🏕️ Cứu Trợ Kiểm Lâm</div>' +
                '<div class="shop-card-desc">Hỗ trợ khẩn cấp khi cạn kiệt năng lượng (+' + rescueCfg.amount + ' ' + ICON_ENERGY_HTML + ')</div>' +
            '</div>' +
            '<button class="modal-btn primary" id="btn-shop-rescue">MIỄN PHÍ</button>' +
          '</div>'
        : '';

    var adAmt = (typeof AD_REWARDS !== 'undefined' && AD_REWARDS.energy) ? AD_REWARDS.energy.amount : 20;
    var adLeftText = typeof opts.adsLeft === 'number' ? ' • Còn ' + opts.adsLeft + ' lượt hôm nay' : '';

    var overlay = createModal(
        '<div id="shop-status-bar" class="modal-sub">' +
            'Hiện có: <b>' + opts.energy + ' ' + ICON_ENERGY_HTML + '</b> &nbsp;|&nbsp; ' +
            '<b>' + opts.coins.toLocaleString('vi-VN') + ' ' + ICON_GOLD_HTML + '</b> &nbsp;|&nbsp; ' +
            '<b>' + opts.gems + ' ' + ICON_RUBY_HTML + '</b><br>' +
            '<small>⏳ Tự động hồi +1 năng lượng sau mỗi ' + ENERGY_REGEN_SEC + ' giây (còn ' + opts.secLeft + 's)</small>' +
        '</div>' +
        '<div class="shop-scroll">' +
            // 1. Instant Skip Cooldown bằng Kim Cương
            '<div class="shop-card popular-card has-badge">' +
                '<span class="shop-badge popular">⚡ KHÔNG CẦN CHỜ</span>' +
                '<div class="shop-card-left">' +
                    '<div class="shop-card-title">' + ICON_RUBY_HTML + ' Nạp Siêu Tốc (+' + GEM_ENERGY_PACK + ' ' + ICON_ENERGY_HTML + ')</div>' +
                    '<div class="shop-card-desc">Bỏ qua thời gian chờ, nạp đầy vượt trần ngay tức thì!</div>' +
                '</div>' +
                '<button class="modal-btn ' + (canGem ? 'gem-btn' : 'disabled-btn') + '" id="btn-shop-gem">' + GEM_ENERGY_PRICE + ' ' + ICON_RUBY_HTML + '</button>' +
            '</div>' +
            // 2. Xem Ads nhận miễn phí
            '<div class="shop-card has-badge">' +
                '<span class="shop-badge best">MIỄN PHÍ 🎬</span>' +
                '<div class="shop-card-left">' +
                    '<div class="shop-card-title">🎬 Tiếp Tế Nhanh (+' + adAmt + ' ' + ICON_ENERGY_HTML + ')</div>' +
                    '<div class="shop-card-desc">Xem 1 video ngắn nhận ngay ' + adAmt + ' năng lượng miễn phí' + adLeftText + '</div>' +
                '</div>' +
                '<button class="modal-btn primary" id="btn-shop-ad">XEM ADS</button>' +
            '</div>' +
            // 3. Đổi Vàng
            '<div class="shop-card">' +
                '<div class="shop-card-left">' +
                    '<div class="shop-card-title">' + ICON_ENERGY_HTML + ' Gói Năng Lượng (+' + ENERGY_PACK + ')</div>' +
                    '<div class="shop-card-desc">Dùng Vàng từ ghép đồ, bán đồ hoặc nộp đơn</div>' +
                '</div>' +
                '<button class="modal-btn ' + (canCoin ? 'primary' : 'disabled-btn') + '" id="btn-shop-coin">' + ENERGY_PACK_PRICE.toLocaleString('vi-VN') + ' ' + ICON_GOLD_HTML + '</button>' +
            '</div>' +
            rescueHtml +
        '</div>' +
        '<div class="modal-buttons">' +
            '<button class="modal-btn primary" id="mb-close">Đóng</button>' +
        '</div>',
        'shop-box',
        'NĂNG LƯỢNG'
    );

    var shopStatusBar = overlay.querySelector('#shop-status-bar');
    overlay.querySelector('#btn-shop-coin').onclick = function () {
        if (!canCoin) {
            if (shopStatusBar) shopStatusBar.innerHTML = '<b style="color:#c62828">❌ Chưa đủ ' + ENERGY_PACK_PRICE.toLocaleString('vi-VN') + ' Vàng! Hãy ghép đồ (Lv.2+), nộp đơn hoặc bán đồ nhé.</b>';
            return;
        }
        closeModal();
        opts.onBuyCoins();
    };
    overlay.querySelector('#btn-shop-gem').onclick = function () {
        if (!canGem) {
            if (shopStatusBar) shopStatusBar.innerHTML = '<b style="color:#c62828">❌ Chưa đủ ' + GEM_ENERGY_PRICE + ' Kim cương! Hãy nạp thêm Kim Cương để bỏ qua thời gian chờ nhé.</b>';
            return;
        }
        closeModal();
        opts.onBuyGems();
    };
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
function showGemShopModal(opts) {
    var starterCfg = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.starterPack) ? GAME_CONFIG.starterPack : null;
    var isStarterBought = !!(SAVE && SAVE.starterPackBought);
    var starterHtml = (starterCfg && !isStarterBought)
        ? '<div class="shop-card starter-card has-badge">' +
            '<span class="shop-badge best">' + (starterCfg.badge || '🔥 GÓI TÂN THỦ') + '</span>' +
            '<div class="shop-card-left">' +
                '<div class="shop-card-title">🎒 ' + starterCfg.name + '</div>' +
                '<div class="shop-card-desc">' + starterCfg.desc + '</div>' +
            '</div>' +
            '<button class="modal-btn danger-btn" id="btn-buy-starter">' + starterCfg.priceVnd + '</button>' +
          '</div>'
        : '';

    var gemAdAmt = (typeof AD_REWARDS !== 'undefined' && AD_REWARDS.gem) ? AD_REWARDS.gem.amount : 3;
    var gemAdsLeft = typeof opts.adsLeft === 'number' ? ' • Còn ' + opts.adsLeft + ' lượt hôm nay' : '';

    var packsHtml = '';
    GEM_IAP_PACKS.forEach(function (p) {
        var total = p.gems + (p.bonusGems || 0);
        var badgeHtml = p.badge
            ? '<span class="shop-badge ' + (p.isPopular ? 'popular' : 'best') + '">' + p.badge + '</span>'
            : '';
        var cls = 'shop-card' + (p.isPopular ? ' popular-card' : '') + (p.badge ? ' has-badge' : '');
        packsHtml += '<div class="' + cls + '">' +
            badgeHtml +
            '<div class="shop-card-left">' +
                '<div class="shop-card-title">' + ICON_RUBY_HTML + ' ' + p.name + ' (+' + total.toLocaleString('vi-VN') + ')</div>' +
                '<div class="shop-card-desc">' + p.desc + (p.bonusGems ? ' (Gốc ' + p.gems + ' + Thưởng ' + p.bonusGems + ' 💎)' : '') + '</div>' +
            '</div>' +
            '<button class="modal-btn gem-btn btn-buy-pack" data-id="' + p.id + '">' + p.priceVnd + '</button>' +
        '</div>';
    });

    var overlay = createModal(
        '<div id="gem-status-bar" class="modal-sub">' +
            'Số dư: <b>' + opts.gems + ' ' + ICON_RUBY_HTML + '</b> &nbsp;|&nbsp; ' +
            '<b>' + opts.coins + ' ' + ICON_GOLD_HTML + '</b> &nbsp;|&nbsp; ' +
            '<b>' + opts.energy + ' ' + ICON_ENERGY_HTML + '</b><br>' +
            '<small>✨ Dùng Kim Cương để nạp đầy năng lượng siêu tốc không cần chờ đợi!</small>' +
        '</div>' +
        '<div class="shop-scroll">' +
            starterHtml +
            '<div class="shop-card has-badge">' +
                '<span class="shop-badge best">MIỄN PHÍ 🎬</span>' +
                '<div class="shop-card-left">' +
                    '<div class="shop-card-title">🎁 Quà Nhà Tài Trợ (+' + gemAdAmt + ' ' + ICON_RUBY_HTML + ')</div>' +
                    '<div class="shop-card-desc">Xem 1 video ngắn nhận ngay ' + gemAdAmt + ' Kim Cương miễn phí' + gemAdsLeft + '</div>' +
                '</div>' +
                '<button class="modal-btn primary" id="btn-gem-ad">XEM ADS</button>' +
            '</div>' +
            '<div class="shop-section-title">Danh Sách Gói Nạp IAP</div>' +
            packsHtml +
        '</div>' +
        '<div class="modal-buttons">' +
            '<button class="modal-btn primary" id="mb-close">Đóng</button>' +
        '</div>',
        'shop-box',
        'KIM CƯƠNG'
    );

    var starterBtn = overlay.querySelector('#btn-buy-starter');
    if (starterBtn && starterCfg) {
        starterBtn.onclick = function () {
            closeModal();
            opts.onBuyIAP(starterCfg);
        };
    }

    var adBtn = overlay.querySelector('#btn-gem-ad');
    if (adBtn) {
        adBtn.onclick = function () {
            closeModal();
            opts.onWatchAd();
        };
    }

    overlay.querySelectorAll('.btn-buy-pack').forEach(function (btn) {
        btn.onclick = function () {
            var id = btn.dataset.id;
            var pack = GEM_IAP_PACKS.find(function (p) { return p.id === id; });
            if (pack) {
                closeModal();
                opts.onBuyIAP(pack);
            }
        };
    });

    overlay.querySelector('#mb-close').onclick = closeModal;
}

// ---------- 4C. NGÂN HÀNG VÀNG ----------
function showCoinShopModal(opts) {
    var coinAdAmt = (typeof AD_REWARDS !== 'undefined' && AD_REWARDS.coin) ? AD_REWARDS.coin.amount : 100;
    var coinAdsLeft = typeof opts.adsLeft === 'number' ? ' • Còn ' + opts.adsLeft + ' lượt hôm nay' : '';

    var packsHtml = '';
    COIN_PACKS.forEach(function (p) {
        var badgeHtml = p.badge ? '<span class="shop-badge best">' + p.badge + '</span>' : '';
        packsHtml += '<div class="shop-card' + (p.badge ? ' has-badge' : '') + '">' +
            badgeHtml +
            '<div class="shop-card-left">' +
                '<div class="shop-card-title">' + ICON_GOLD_HTML + ' ' + p.name + ' (+' + p.coins.toLocaleString('vi-VN') + ')</div>' +
                '<div class="shop-card-desc">' + p.desc + '</div>' +
            '</div>' +
            '<button class="modal-btn primary btn-exchange-coin" data-id="' + p.id + '">' + p.gemCost + ' ' + ICON_RUBY_HTML + '</button>' +
        '</div>';
    });

    var overlay = createModal(
        '<div id="coin-status-bar" class="modal-sub">' +
            'Hiện có: <b>' + opts.coins + ' ' + ICON_GOLD_HTML + '</b> &nbsp;|&nbsp; ' +
            '<b>' + opts.gems + ' ' + ICON_RUBY_HTML + '</b><br>' +
            '<small>Vàng dùng để mua gói năng lượng (+' + ENERGY_PACK + ' ⚡) & dọn dẹp bàn cờ</small>' +
        '</div>' +
        '<div class="shop-scroll">' +
            '<div class="shop-card has-badge">' +
                '<span class="shop-badge best">MIỄN PHÍ 🎬</span>' +
                '<div class="shop-card-left">' +
                    '<div class="shop-card-title">🎬 Quà Tài Trợ Video (+' + coinAdAmt + ' ' + ICON_GOLD_HTML + ')</div>' +
                    '<div class="shop-card-desc">Xem 1 video ngắn nhận ngay ' + coinAdAmt + ' Vàng miễn phí' + coinAdsLeft + '</div>' +
                '</div>' +
                '<button class="modal-btn primary" id="btn-coin-ad">XEM ADS</button>' +
            '</div>' +
            '<div class="shop-section-title">Đổi Kim Cương Lấy Vàng</div>' +
            packsHtml +
        '</div>' +
        '<div class="modal-buttons">' +
            '<button class="modal-btn primary" id="mb-close">Đóng</button>' +
        '</div>',
        'shop-box',
        'NGÂN HÀNG VÀNG'
    );

    var adBtn = overlay.querySelector('#btn-coin-ad');
    if (adBtn) {
        adBtn.onclick = function () {
            closeModal();
            opts.onWatchAd();
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
            '<div class="lucky-drop-visual">🪂</div>' +
            '<div class="lucky-drop-desc">' +
                'Kiểm lâm vừa thả dù một kiện hàng tiếp tế đặc biệt xuống khu trại!<br>' +
                'Xem một đoạn video ngắn từ nhà tài trợ để nhận ngẫu nhiên phần quà:' +
            '</div>' +
            '<div class="lucky-drop-rewards-list">' +
                '<div class="lucky-reward-pill">' + ICON_ENERGY_HTML + ' +35 Năng Lượng</div>' +
                '<div class="lucky-reward-pill">' + ICON_GOLD_HTML + ' +300 Vàng</div>' +
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
        simulateWatchAd('Mở Kiện Hàng Tiếp Tế May Mắn 🎁', function () {
            var rolls = [
                { type: 'energy', val: 35, text: '+35 ⚡ Năng lượng', color: '#2e7d32' },
                { type: 'coin', val: 300, text: '+300 🪙 Vàng', color: '#f57f17' },
                { type: 'gem', val: 8, text: '+8 💎 Kim cương', color: '#1565c0' }
            ];
            var roll = rolls[Math.floor(Math.random() * rolls.length)];
            if (onReward) onReward(roll);
        });
    };
}

// ---------- 5. CẨM NANG SƯU TẬP 72 VẬT PHẨM ----------
function openDiscoveryBook(onRewardClaimed, statusMsgHtml) {
    var totalItems = ITEM_CHAINS.length * 8;
    var discCount = countDiscoveredItems();
    var unclaimedCount = countUnclaimedBookRewards();

    var chainsHtml = '';
    ITEM_CHAINS.forEach(function (ch) {
        var slotsHtml = '';
        var chainDisc = 0;
        var bgClass = typeof getCellBgClass === 'function' ? getCellBgClass(ch.line) : 'cell-bg-01';
        for (var lv = 1; lv <= 8; lv++) {
            var id = ch.line + '_lv' + lv;
            var imgPath = id === 'ban_lv8' ? 'assets/images/items/ban_level8.png' : ('assets/images/items/' + id + '.png');
            var isDisc = !!SAVE.discovered[id];
            var isClaimed = !!SAVE.claimedBook[id];
            if (isDisc) chainDisc++;

            var cls = 'book-slot ' + bgClass + (isDisc ? ' discovered' : ' locked') + (isDisc && !isClaimed ? ' claimable' : '');
            var badge = (isDisc && !isClaimed) ? '<span class="book-claim-tag">NHẬN</span>' : '';
            slotsHtml += '<div class="' + cls + '" data-id="' + id + '" data-name="' + ch.names[lv - 1] + '" data-lv="' + lv + '">' +
                '<img src="' + imgPath + '" alt="' + id + '">' +
                '<span class="book-lv">Lv.' + lv + '</span>' +
                badge +
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
                '<small class="book-chain-count">' + chainDisc + '/8</small>' +
            '</div>' +
            '<div class="book-grid">' + slotsHtml + '</div>' +
        '</div>';
    });

    var claimAllBtn = unclaimedCount > 0
        ? '<button class="modal-btn gem-btn" id="btn-claim-all">Nhận thưởng</button>'
        : '';

    var defaultDetail = statusMsgHtml || 'Chạm vào vật phẩm để xem tên & nhận Vàng ' + ICON_GOLD_HTML + ' / Kim cương ' + ICON_RUBY_HTML + ' khám phá lần đầu!';

    var overlay = createModal(
        '<div class="modal-sub">Đã khám phá: <b>' + discCount + '/' + totalItems + '</b> vật phẩm cắm trại</div>' +
        '<div id="book-detail-bar" class="camp-info-bar">' + defaultDetail + '</div>' +
        '<div class="book-scroll">' + chainsHtml + '</div>' +
        '<div class="modal-buttons book-buttons">' +
            '<button class="modal-btn primary" id="mb-close">Đóng</button>' +
            claimAllBtn +
        '</div>',
        'book-box',
        'CẨM NANG'
    );

    var detailBar = overlay.querySelector('#book-detail-bar');

    overlay.querySelectorAll('.book-slot').forEach(function (slot) {
        slot.onclick = function () {
            var id = slot.dataset.id;
            var name = slot.dataset.name;
            var lv = parseInt(slot.dataset.lv);
            var gen = getChainGenerator(id.split('_lv')[0]);
            if (!SAVE.discovered[id]) {
                detailBar.innerHTML = '🔒 <b>??? (Lv.' + lv + ')</b> — Xuất hiện từ <b>' + gen.name + '</b>. Hãy ghép tới cấp ' + lv + ' của dòng này để mở khóa!';
                return;
            }
            if (!SAVE.claimedBook[id]) {
                var rw = getBookReward(id);
                SAVE.claimedBook[id] = true;
                saveGame();
                if (onRewardClaimed) onRewardClaimed(rw.coins, rw.gems);
                var msg = '🎁 <b style="color:#2e7d32">Đã nhận thưởng ' + name + ': +' + rw.coins + ' ' + ICON_GOLD_HTML + (rw.gems ? ' +' + rw.gems + ' ' + ICON_RUBY_HTML : '') + '!</b>';
                openDiscoveryBook(onRewardClaimed, msg);
                return;
            }
            var rwInfo = getBookReward(id);
            detailBar.innerHTML = '✅ <b>' + name + ' (Lv.' + lv + ')</b> — Giá bán: ' + sellPrice(id) + ' ' + ICON_GOLD_HTML + ' | Thưởng đơn: ' + orderReward(id) + ' ' + ICON_GOLD_HTML + ' (Đã nhận +' + rwInfo.coins + ' ' + ICON_GOLD_HTML + ')';
        };
    });

    var claimAll = overlay.querySelector('#btn-claim-all');
    if (claimAll) {
        claimAll.onclick = function () {
            var totalC = 0, totalG = 0;
            Object.keys(SAVE.discovered).forEach(function (id) {
                if (!SAVE.claimedBook[id]) {
                    var rw = getBookReward(id);
                    totalC += rw.coins;
                    totalG += rw.gems;
                    SAVE.claimedBook[id] = true;
                }
            });
            saveGame();
            if (onRewardClaimed) onRewardClaimed(totalC, totalG);
            var allMsg = '🎉 <b style="color:#2e7d32">Đã nhận tất cả thưởng Cẩm Nang: +' + totalC + ' ' + ICON_GOLD_HTML + (totalG ? ' & +' + totalG + ' ' + ICON_RUBY_HTML : '') + '!</b>';
            openDiscoveryBook(onRewardClaimed, allMsg);
        };
    }

    overlay.querySelector('#mb-close').onclick = closeModal;
}

// ---------- 6. BẢN ĐỒ HÀNH TRÌNH 45 LEVEL (WORLD MAP) ----------
var CHAPTERS = [
    { title: 'Chương 1 Khởi đầu Bãi Cỏ (LV 1-10)', from: 1, to: 10 },
    { title: 'Chương 2 Rừng Sâu & Bờ Suối (LV 11-20)', from: 11, to: 20 },
    { title: 'Chương 3 Chinh Phục Đèo Cao (LV 21-35)', from: 21, to: 35 },
    { title: 'Chương 4 Đỉnh Tuyết Huyền Thoại (LV 36-45)', from: 36, to: 45 }
];

function openWorldMap(currentLv, onSelectLevel) {
    var totalStars = 0;
    Object.keys(SAVE.stars).forEach(function (k) { totalStars += SAVE.stars[k] || 0; });
    var unlockAll = SAVE.settings && SAVE.settings.unlockAllLevels;

    var chaptersHtml = '';
    CHAPTERS.forEach(function (ch, chIdx) {
        var isChUnlocked = unlockAll || ch.from <= SAVE.maxLevel;
        chaptersHtml += '<div class="chapter-title">' + ch.title + '</div>';

        if (!isChUnlocked) {
            chaptersHtml += '<div class="chapter-locked-card">' +
                '<img src="assets/images/ui/icon_lock.png" class="card-lock-icon" alt="">' +
                '<span>Hoàn thành Chương ' + chIdx + ' để mở khóa</span>' +
            '</div>';
            return;
        }

        var cardsHtml = '';
        for (var lv = ch.from; lv <= ch.to; lv++) {
            var cfg = getLevelConfig(lv);
            var st = SAVE.stars[lv] || 0;
            var unlocked = unlockAll || lv <= SAVE.maxLevel;
            var isCur = lv === currentLv;
            var cls = 'level-card' + (unlocked ? ' unlocked' : ' locked') + (isCur ? ' current' : '');
            var bgUrl = (typeof getLevelBackground === 'function') ? getLevelBackground(lv) : 'assets/images/ui/bg_01.jpg';

            var starsImgHtml = '';
            for (var sIdx = 1; sIdx <= 3; sIdx++) {
                var isStarOn = sIdx <= st;
                starsImgHtml += '<img src="assets/images/ui/icon_star.png" class="card-star-img' + (isStarOn ? '' : ' off') + '" alt="">';
            }

            var lockMaskHtml = !unlocked ? (
                '<div class="card-locked-mask">' +
                    '<img src="assets/images/ui/icon_lock.png" class="card-lock-icon" alt="">' +
                '</div>'
            ) : '';

            cardsHtml += '<div class="' + cls + '" data-lv="' + lv + '">' +
                '<div class="card-tag">' + cfg.name + '</div>' +
                '<div class="card-thumb" style="background-image:url(\'' + bgUrl + '\')">' +
                    '<span class="card-lv-badge">LV.' + lv + '</span>' +
                    '<div class="card-stars">' + starsImgHtml + '</div>' +
                    lockMaskHtml +
                '</div>' +
            '</div>';
        }
        chaptersHtml += '<div class="map-grid-2col">' + cardsHtml + '</div>';
    });

    var overlay = createModal(
        '<div class="map-scroll-area">' + chaptersHtml + '</div>' +
        '<div class="modal-buttons" style="margin-top:8px;flex-shrink:0">' +
            '<button class="modal-btn primary" id="mb-close">Đóng</button>' +
        '</div>',
        'map-popup-box',
        'BẢN ĐỒ HÀNH TRÌNH'
    );

    var closeBtn = overlay.querySelector('#mb-close');
    if (closeBtn) closeBtn.onclick = closeModal;

    overlay.querySelectorAll('.level-card').forEach(function (btn) {
        btn.onclick = function () {
            var lv = parseInt(btn.dataset.lv);
            var unlocked = (SAVE.settings && SAVE.settings.unlockAllLevels) || lv <= SAVE.maxLevel;
            if (!unlocked) {
                showToast('🔒 Hãy hoàn thành Level ' + (lv - 1) + ' trước (hoặc bật Mở khóa tất cả trong Cài đặt ⚙️)!', '#c62828');
                return;
            }
            closeModal();
            onSelectLevel(lv);
        };
    });

    var curNode = overlay.querySelector('.level-card.current');
    if (curNode) {
        setTimeout(function () {
            curNode.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }, 50);
    }
}

// ---------- 7. MÀN HÌNH CÀI ĐẶT & CHỌN MÀN NHANH ----------
// opts: { currentLevel, onSelectLevel, isAuto, onToggleAuto, onUnlockChanged, onRestartLevel, onResetAll }
function openSettingsModal(opts) {
    var s = SAVE.settings || {};
    var unlockAll = s.unlockAllLevels;
    var isAuto = opts.isAuto;

    var overlay = createModal(
        '<div class="popup-sub">Cài đặt màn chơi và dữ liệu</div>' +
        '<div class="st-rows">' +
            '<!-- Ngôn ngữ -->' +
            '<div class="lang-selector" id="st-lang-btn">' +
                '<div class="st-row-left">' +
                    '<img src="assets/images/ui/icon_ngonngu.png" class="st-icon" alt="">' +
                    '<span class="st-label">Tiếng Việt</span>' +
                '</div>' +
                '<img src="assets/images/ui/icon_down.png" class="lang-arrow" alt="">' +
            '</div>' +

            '<!-- Nhạc nền cắm trại -->' +
            '<div class="st-row">' +
                '<div class="st-row-left">' +
                    '<img src="assets/images/ui/icon_amthanh.png" class="st-icon" alt="">' +
                    '<span class="st-label">Nhạc nền cắm trại</span>' +
                '</div>' +
                '<button class="toggle-btn ' + (s.bgm !== false ? 'on' : 'off') + '" id="st-bgm">' +
                    (s.bgm !== false ? 'BẬT' : 'TẮT') +
                '</button>' +
            '</div>' +

            '<!-- Âm thanh hiệu ứng -->' +
            '<div class="st-row">' +
                '<div class="st-row-left">' +
                    '<img src="assets/images/ui/icon_mussic.png" class="st-icon" alt="">' +
                    '<span class="st-label">Âm thanh hiệu ứng</span>' +
                '</div>' +
                '<button class="toggle-btn ' + (s.sound ? 'on' : 'off') + '" id="st-sound">' +
                    (s.sound ? 'BẬT' : 'TẮT') +
                '</button>' +
            '</div>' +

            '<!-- Mở khóa 45 level -->' +
            '<div class="st-row">' +
                '<div class="st-row-left">' +
                    '<img src="assets/images/ui/icon_lock.png" class="st-icon" alt="">' +
                    '<span class="st-label">Mở khóa 45 level</span>' +
                '</div>' +
                '<button class="toggle-btn ' + (s.unlockAllLevels ? 'on' : 'off') + '" id="st-unlock">' +
                    (s.unlockAllLevels ? 'BẬT' : 'TẮT') +
                '</button>' +
            '</div>' +

            '<!-- Tự động đổ đầy bàn -->' +
            '<div class="st-row">' +
                '<div class="st-row-left">' +
                    '<img src="assets/images/ui/icon_auto.png" class="st-icon" alt="">' +
                    '<span class="st-label">Tự động đổ đầy bàn</span>' +
                '</div>' +
                '<button class="toggle-btn ' + (isAuto ? 'on' : 'off') + '" id="st-auto">' +
                    (isAuto ? 'BẬT' : 'TẮT') +
                '</button>' +
            '</div>' +
        '</div>' +

        '<div id="reset-confirm-area" class="reset-confirm-area" style="display:none">' +
            '<p style="margin-bottom:12px;">⚠️ Bạn chắc chắn muốn xóa toàn bộ tiến trình, sao, vàng và cẩm nang về ban đầu?</p>' +
            '<div class="st-actions">' +
                '<button class="modal-btn danger-btn" id="st-confirm-reset" style="flex:1">Xác nhận xóa hết</button>' +
                '<button class="modal-btn gem-btn" id="st-cancel-reset" style="flex:1">Hủy</button>' +
            '</div>' +
        '</div>' +

        '<div class="st-actions" id="st-main-btns">' +
            '<button class="st-act-btn green" id="st-close">Đóng</button>' +
            '<button class="st-act-btn blue" id="st-reset">Xóa dữ liệu</button>' +
        '</div>',
        'settings-popup-box',
        'CÀI ĐẶT'
    );

    var closeBtn = overlay.querySelector('#st-close');
    if (closeBtn) closeBtn.onclick = closeModal;

    var langBtn = overlay.querySelector('#st-lang-btn');
    if (langBtn) {
        langBtn.onclick = function () {
            showToast('🇻🇳 Hiện tại trò chơi hỗ trợ giao diện Tiếng Việt');
        };
    }

    overlay.querySelector('#st-bgm').onclick = function () {
        s.bgm = (s.bgm === false) ? true : false;
        saveGame();
        if (typeof updateBgmPlayback === 'function') updateBgmPlayback();
        openSettingsModal(opts);
    };
    overlay.querySelector('#st-sound').onclick = function () {
        s.sound = !s.sound;
        saveGame();
        openSettingsModal(opts);
    };
    overlay.querySelector('#st-unlock').onclick = function () {
        s.unlockAllLevels = !s.unlockAllLevels;
        saveGame();
        if (opts.onUnlockChanged) opts.onUnlockChanged();
        openSettingsModal(opts);
    };
    overlay.querySelector('#st-auto').onclick = function () {
        opts.onToggleAuto();
        opts.isAuto = !opts.isAuto;
        openSettingsModal(opts);
    };
    overlay.querySelector('#st-reset').onclick = function () {
        overlay.querySelector('#reset-confirm-area').style.display = 'block';
        overlay.querySelector('#st-main-btns').style.display = 'none';
    };
    overlay.querySelector('#st-cancel-reset').onclick = function () {
        overlay.querySelector('#reset-confirm-area').style.display = 'none';
        overlay.querySelector('#st-main-btns').style.display = 'flex';
    };
    overlay.querySelector('#st-confirm-reset').onclick = function () {
        closeModal();
        opts.onResetAll();
    };
}
