// ==========================================
// HỆ THỐNG MODAL GIAO DIỆN:
// 1. Toast thông báo mượt (thay thế alert)
// 2. Màn hình Chiến Thắng (Win Modal)
// 3. Khu Cắm Trại Tương Tác (Camp Modal)
// 4. Cửa Hàng Năng Lượng & Cứu Trợ Kiểm Lâm (Energy Shop Modal - thay thế confirm)
// 5. Sổ Tay Sưu Tập 72 Vật Phẩm (Discovery Book Modal)
// 6. Bản Đồ Hành Trình 45 Màn Chơi (World Map Modal)
// 7. Cài Đặt Hệ Thống (Settings Modal)
// ==========================================

function closeModal() {
    var m = document.getElementById('modal-overlay');
    if (m) m.remove();
}

function createModal(innerHtml, extraClass) {
    closeModal();
    // Ẩn ngay mọi toast, bong bóng thoại NPC và bàn tay hướng dẫn để không bao giờ chồng 2 popup
    var oldToast = document.getElementById('game-toast');
    if (oldToast) oldToast.remove();
    if (typeof hideNpcBubble === 'function') hideNpcBubble();
    if (typeof clearHintVisuals === 'function') clearHintVisuals();

    var overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    overlay.innerHTML = '<div class="modal-box ' + (extraClass || '') + '">' + innerHtml + '</div>';
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

    // Khi hiện Toast thì ẩn bong bóng thoại NPC để tránh 2 thông báo chồng nhau
    if (typeof hideNpcBubble === 'function') hideNpcBubble();

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
        starsHtml += '<span class="win-star' + (i <= info.stars ? ' on' : '') +
            '" style="animation-delay:' + (i * 0.22) + 's">★</span>';
    }
    var decorHtml = '';
    if (info.decor) {
        decorHtml = '<div class="win-decor">' +
            (info.firstTime ? '🎉 Mở khóa vật trang trí mới:' : 'Vật trang trí màn này:') +
            '<div class="win-decor-item">' + info.decor[1] + ' ' + info.decor[2] + '</div></div>';
    }
    var gemText = info.gems > 0 ? ' &nbsp;+' + info.gems + ' 💎' : '';

    var overlay = createModal(
        '<div class="modal-title">🎉 HOÀN THÀNH!</div>' +
        '<div class="modal-sub">Level ' + info.level + ': ' + info.name + '</div>' +
        '<div class="win-stars">' + starsHtml + '</div>' +
        '<div class="win-coins">+' + info.coins + ' 💰' + gemText +
            (info.firstTime ? '' : ' <small>(chơi lại)</small>') + '</div>' +
        decorHtml +
        '<div class="modal-buttons">' +
            '<button class="modal-btn" id="mb-camp">⛺ Khu trại</button>' +
            '<button class="modal-btn" id="mb-replay">🔄 Chơi lại</button>' +
            (info.hasNext ? '<button class="modal-btn primary" id="mb-next">Màn tiếp ▶</button>' : '') +
        '</div>'
    );

    overlay.querySelector('#mb-replay').onclick = function () { closeModal(); onReplay(); };
    overlay.querySelector('#mb-camp').onclick = function () {
        openCamp(info.level, function () { showWinModal(info, onReplay, onNext); });
    };
    var nextBtn = overlay.querySelector('#mb-next');
    if (nextBtn) nextBtn.onclick = function () { closeModal(); onNext(); };
}

// ---------- 3. KHU CẮM TRẠI TƯƠNG TÁC ----------
function openCamp(highlightLevel, onBack) {
    var decorsHtml = '';
    CAMP_DECORS.forEach(function (d) {
        var unlocked = !!SAVE.stars[d[0]];
        var cls = 'camp-decor ' + (unlocked ? 'unlocked' : 'locked') + (d[0] === highlightLevel && unlocked ? ' new' : '');
        var title = unlocked ? (d[2] + ' (Lv.' + d[0] + ')') : ('Hoàn thành Level ' + d[0] + ' để mở khóa');
        decorsHtml += '<div class="' + cls + '" data-lv="' + d[0] + '" title="' + title + '" ' +
            'style="left:' + d[3] + '%;top:' + d[4] + '%;--sz:' + d[5] + '">' + d[1] + '</div>';
    });

    var overlay = createModal(
        '<div class="modal-title">⛺ KHU CẮM TRẠI</div>' +
        '<div class="modal-sub">Đã mở khóa <b>' + countUnlockedDecors() + '/' + CAMP_DECORS.length + '</b> vật trang trí (Chạm vào đồ vật để xem)</div>' +
        '<div class="camp-scene">' +
            '<div class="camp-static" style="left:88%;top:12%;--sz:9">☀️</div>' +
            '<div class="camp-static" style="left:5%;top:46%;--sz:11">🌲</div>' +
            '<div class="camp-static" style="left:94%;top:44%;--sz:11">🌲</div>' +
            '<div class="camp-static" style="left:15%;top:49%;--sz:8">🌲</div>' +
            decorsHtml +
        '</div>' +
        '<div id="camp-info-bar" class="camp-info-bar">Chạm vào một vật trang trí trên bãi trại để xem chi tiết</div>' +
        '<div class="modal-buttons"><button class="modal-btn primary" id="mb-close">Đóng</button></div>',
        'camp-box'
    );

    var infoBar = overlay.querySelector('#camp-info-bar');
    overlay.querySelectorAll('.camp-decor').forEach(function (el) {
        el.onclick = function () {
            var lv = parseInt(el.dataset.lv);
            var d = getCampDecor(lv);
            var unlocked = !!SAVE.stars[lv];
            if (unlocked) {
                el.animate([{ transform: 'translate(-50%,-50%) scale(1.35)' }, { transform: 'translate(-50%,-50%) scale(1)' }], { duration: 280 });
                infoBar.innerHTML = '✨ <b>' + d[1] + ' ' + d[2] + '</b> — Đã mở khóa ở Level ' + lv + ' (' + '★'.repeat(SAVE.stars[lv]) + ')';
            } else {
                infoBar.innerHTML = '🔒 <b>' + d[2] + '</b> — Hãy vượt qua <b>Level ' + lv + '</b> để đặt vào khu trại!';
            }
        };
    });

    overlay.querySelector('#mb-close').onclick = function () {
        closeModal();
        if (onBack) onBack();
    };
}

// ---------- 4. CỬA HÀNG NĂNG LƯỢNG & CỨU TRỢ (THAY THẾ CONFIRM) ----------
// opts: { energy, budget, coins, gems, secLeft, onBuyCoins, onBuyGems, onRescue }
function showEnergyShopModal(opts) {
    var canCoin = opts.coins >= ENERGY_PACK_PRICE;
    var canGem = opts.gems >= GEM_ENERGY_PRICE;
    var needRescue = opts.energy <= 5;

    var rescueHtml = needRescue
        ? '<div class="shop-card rescue-card">' +
            '<div class="shop-card-left">' +
                '<div class="shop-card-title">🏕️ Cứu Trợ Kiểm Lâm</div>' +
                '<div class="shop-card-desc">Hỗ trợ khẩn cấp khi bạn cạn năng lượng (+20 ⚡)</div>' +
            '</div>' +
            '<button class="modal-btn primary" id="btn-shop-rescue">MIỄN PHÍ</button>' +
          '</div>'
        : '';

    var overlay = createModal(
        '<div class="modal-title">⚡ TRẠM TIẾP NĂNG LƯỢNG</div>' +
        '<div id="shop-status-bar" class="modal-sub">Hiện có: <b>' + opts.energy + ' ⚡</b> &nbsp;|&nbsp; <b>' + opts.coins + ' 💰</b> &nbsp;|&nbsp; <b>' + opts.gems + ' 💎</b><br>' +
            '<small>⏳ Tự động hồi +1 ⚡ sau mỗi ' + ENERGY_REGEN_SEC + ' giây (còn ' + opts.secLeft + 's)</small></div>' +
        '<div class="shop-list">' +
            '<div class="shop-card">' +
                '<div class="shop-card-left">' +
                    '<div class="shop-card-title">⚡ Gói Năng Lượng Vừa (+' + ENERGY_PACK + ' ⚡)</div>' +
                    '<div class="shop-card-desc">Dùng xu tích lũy từ bán đồ & đơn hàng</div>' +
                '</div>' +
                '<button class="modal-btn ' + (canCoin ? 'primary' : 'disabled-btn') + '" id="btn-shop-coin">' + ENERGY_PACK_PRICE + ' 💰</button>' +
            '</div>' +
            '<div class="shop-card">' +
                '<div class="shop-card-left">' +
                    '<div class="shop-card-title">💎 Gói Siêu Tốc (+' + GEM_ENERGY_PACK + ' ⚡)</div>' +
                    '<div class="shop-card-desc">Dùng kim cương nhận từ Sổ Tay Sưu Tập</div>' +
                '</div>' +
                '<button class="modal-btn ' + (canGem ? 'gem-btn' : 'disabled-btn') + '" id="btn-shop-gem">' + GEM_ENERGY_PRICE + ' 💎</button>' +
            '</div>' +
            rescueHtml +
        '</div>' +
        '<div class="modal-buttons">' +
            '<button class="modal-btn" id="mb-close">Đóng</button>' +
        '</div>'
    );

    var shopStatusBar = overlay.querySelector('#shop-status-bar');
    overlay.querySelector('#btn-shop-coin').onclick = function () {
        if (!canCoin) {
            if (shopStatusBar) shopStatusBar.innerHTML = '<b style="color:#c62828">❌ Chưa đủ ' + ENERGY_PACK_PRICE + ' xu! Hãy nộp đơn hoặc bán bớt đồ.</b>';
            return;
        }
        closeModal();
        opts.onBuyCoins();
    };
    overlay.querySelector('#btn-shop-gem').onclick = function () {
        if (!canGem) {
            if (shopStatusBar) shopStatusBar.innerHTML = '<b style="color:#c62828">❌ Chưa đủ ' + GEM_ENERGY_PRICE + ' kim cương! Hãy mở Sổ Tay nhận thưởng.</b>';
            return;
        }
        closeModal();
        opts.onBuyGems();
    };
    var rescueBtn = overlay.querySelector('#btn-shop-rescue');
    if (rescueBtn) {
        rescueBtn.onclick = function () {
            closeModal();
            opts.onRescue();
        };
    }
    overlay.querySelector('#mb-close').onclick = closeModal;
}

// ---------- 5. SỔ TAY SƯU TẬP 72 VẬT PHẨM ----------
function openDiscoveryBook(onRewardClaimed, statusMsgHtml) {
    var totalItems = ITEM_CHAINS.length * 8;
    var discCount = countDiscoveredItems();
    var unclaimedCount = countUnclaimedBookRewards();

    var chainsHtml = '';
    ITEM_CHAINS.forEach(function (ch) {
        var slotsHtml = '';
        var chainDisc = 0;
        for (var lv = 1; lv <= 8; lv++) {
            var id = ch.line + '_lv' + lv;
            var imgPath = id === 'ban_lv8' ? 'assets/images/items/ban_level8.png' : ('assets/images/items/' + id + '.png');
            var isDisc = !!SAVE.discovered[id];
            var isClaimed = !!SAVE.claimedBook[id];
            if (isDisc) chainDisc++;

            var cls = 'book-slot' + (isDisc ? ' discovered' : ' locked') + (isDisc && !isClaimed ? ' claimable' : '');
            var badge = (isDisc && !isClaimed) ? '<span class="book-claim-tag">NHẬN</span>' : '';
            slotsHtml += '<div class="' + cls + '" data-id="' + id + '" data-name="' + ch.names[lv - 1] + '" data-lv="' + lv + '">' +
                '<img src="' + imgPath + '" alt="' + id + '">' +
                '<span class="book-lv">Lv.' + lv + '</span>' +
                badge +
            '</div>';
        }
        chainsHtml += '<div class="book-chain">' +
            '<div class="book-chain-header">' +
                '<span>' + ch.icon + ' ' + ch.title + '</span>' +
                '<small>' + chainDisc + '/8</small>' +
            '</div>' +
            '<div class="book-grid">' + slotsHtml + '</div>' +
        '</div>';
    });

    var claimAllBtn = unclaimedCount > 0
        ? '<button class="modal-btn primary" id="btn-claim-all">🎁 Nhận hết thưởng (' + unclaimedCount + ')</button>'
        : '';

    var defaultDetail = statusMsgHtml || 'Chạm vào vật phẩm để xem tên & nhận thưởng khám phá lần đầu!';

    var overlay = createModal(
        '<div class="modal-title">📖 SỔ TAY SƯU TẬP</div>' +
        '<div class="modal-sub">Đã khám phá: <b>' + discCount + '/' + totalItems + '</b> vật phẩm cắm trại</div>' +
        '<div id="book-detail-bar" class="camp-info-bar">' + defaultDetail + '</div>' +
        '<div class="book-scroll">' + chainsHtml + '</div>' +
        '<div class="modal-buttons">' +
            claimAllBtn +
            '<button class="modal-btn" id="mb-close">Đóng</button>' +
        '</div>',
        'book-box'
    );

    var detailBar = overlay.querySelector('#book-detail-bar');

    overlay.querySelectorAll('.book-slot').forEach(function (slot) {
        slot.onclick = function () {
            var id = slot.dataset.id;
            var name = slot.dataset.name;
            var lv = parseInt(slot.dataset.lv);
            if (!SAVE.discovered[id]) {
                detailBar.innerHTML = '🔒 <b>??? (Lv.' + lv + ')</b> — Hãy ghép tới cấp ' + lv + ' của dòng này để mở khóa!';
                return;
            }
            if (!SAVE.claimedBook[id]) {
                var rw = getBookReward(id);
                SAVE.claimedBook[id] = true;
                saveGame();
                if (onRewardClaimed) onRewardClaimed(rw.coins, rw.gems);
                var msg = '🎁 <b style="color:#2e7d32">Đã nhận thưởng ' + name + ': +' + rw.coins + ' 💰' + (rw.gems ? ' +' + rw.gems + ' 💎' : '') + '!</b>';
                openDiscoveryBook(onRewardClaimed, msg);
                return;
            }
            var rwInfo = getBookReward(id);
            detailBar.innerHTML = '✅ <b>' + name + ' (Lv.' + lv + ')</b> — Giá bán: ' + sellPrice(id) + ' 💰 | Thưởng đơn: ' + orderReward(id) + ' 💰 (Đã nhận +' + rwInfo.coins + '💰)';
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
            var allMsg = '🎉 <b style="color:#2e7d32">Đã nhận tất cả thưởng Sổ Tay: +' + totalC + ' 💰' + (totalG ? ' & +' + totalG + ' 💎' : '') + '!</b>';
            openDiscoveryBook(onRewardClaimed, allMsg);
        };
    }

    overlay.querySelector('#mb-close').onclick = closeModal;
}

// ---------- 6. BẢN ĐỒ HÀNH TRÌNH 45 LEVEL (WORLD MAP) ----------
var CHAPTERS = [
    { title: 'Chương 1: Khởi Đầu Bãi Cỏ (Lv 1 – 10)', from: 1, to: 10, bg: '#e8f5e9' },
    { title: 'Chương 2: Rừng Sâu & Bờ Suối (Lv 11 – 25)', from: 11, to: 25, bg: '#e0f2f1' },
    { title: 'Chương 3: Chinh Phục Đèo Cao (Lv 26 – 35)', from: 26, to: 35, bg: '#fff3e0' },
    { title: 'Chương 4: Đỉnh Tuyết Huyền Thoại (Lv 36 – 45)', from: 36, to: 45, bg: '#ede7f6' }
];

function openWorldMap(currentLv, onSelectLevel) {
    var totalStars = 0;
    Object.keys(SAVE.stars).forEach(function (k) { totalStars += SAVE.stars[k] || 0; });
    var unlockAll = SAVE.settings && SAVE.settings.unlockAllLevels;

    var chaptersHtml = '';
    CHAPTERS.forEach(function (ch) {
        var nodesHtml = '';
        for (var lv = ch.from; lv <= ch.to; lv++) {
            var cfg = getLevelConfig(lv);
            var st = SAVE.stars[lv] || 0;
            var unlocked = unlockAll || lv <= SAVE.maxLevel;
            var isCur = lv === currentLv;
            var cls = 'map-node' + (unlocked ? ' unlocked' : ' locked') + (isCur ? ' current' : '');
            var starStr = st > 0 ? ('★'.repeat(st) + '☆'.repeat(3 - st)) : (unlocked ? '☆☆☆' : '🔒');
            var badge = cfg.spreadEvery ? '<span class="map-badge">🕷️</span>' : (cfg.bonus ? '<span class="map-badge">🎁</span>' : '');
            nodesHtml += '<button class="' + cls + '" data-lv="' + lv + '" title="Level ' + lv + ': ' + cfg.name + '">' +
                badge +
                '<div class="map-lv-num">' + (isCur ? '🏕️ ' : '') + 'Lv.' + lv + '</div>' +
                '<div class="map-lv-name">' + cfg.name + '</div>' +
                '<div class="map-lv-stars ' + (st > 0 ? 'has-star' : '') + '">' + starStr + '</div>' +
            '</button>';
        }
        chaptersHtml += '<div class="map-chapter" style="background:' + ch.bg + '">' +
            '<div class="map-chapter-title">' + ch.title + '</div>' +
            '<div class="map-grid">' + nodesHtml + '</div>' +
        '</div>';
    });

    var overlay = createModal(
        '<div class="modal-title">🗺️ BẢN ĐỒ HÀNH TRÌNH</div>' +
        '<div class="modal-sub">Tổng số sao: <b>' + totalStars + ' / ' + (RAW_LEVELS.length * 3) + ' ★</b> &nbsp;|&nbsp; Mở khóa: <b>Lv.' + SAVE.maxLevel + '/45</b></div>' +
        '<div class="book-scroll map-scroll">' + chaptersHtml + '</div>' +
        '<div class="modal-buttons">' +
            '<button class="modal-btn primary" id="mb-close">Đóng</button>' +
        '</div>',
        'book-box'
    );

    overlay.querySelectorAll('.map-node').forEach(function (btn) {
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

    overlay.querySelector('#mb-close').onclick = closeModal;
}

// ---------- 7. MÀN HÌNH CÀI ĐẶT ----------
// opts: { isAuto, onToggleAuto, onRestartLevel, onResetAll }
function openSettingsModal(opts) {
    var s = SAVE.settings;
    var overlay = createModal(
        '<div class="modal-title">⚙️ CÀI ĐẶT TRÒ CHƠI</div>' +
        '<div class="modal-sub">Tùy chỉnh âm thanh, cảm ứng và dữ liệu</div>' +
        '<div class="settings-list">' +
            '<div class="setting-row">' +
                '<span>🔊 Âm thanh hiệu ứng</span>' +
                '<button class="modal-btn ' + (s.sound ? 'primary' : '') + '" id="st-sound">' + (s.sound ? 'ĐANG BẬT' : 'ĐANG TẮT') + '</button>' +
            '</div>' +
            '<div class="setting-row">' +
                '<span>📳 Rung phản hồi khi ghép</span>' +
                '<button class="modal-btn ' + (s.vibrate ? 'primary' : '') + '" id="st-vib">' + (s.vibrate ? 'ĐANG BẬT' : 'ĐANG TẮT') + '</button>' +
            '</div>' +
            '<div class="setting-row">' +
                '<span>🔓 Mở khóa toàn bộ 45 màn (Test)</span>' +
                '<button class="modal-btn ' + (s.unlockAllLevels ? 'primary' : '') + '" id="st-unlock">' + (s.unlockAllLevels ? 'ĐANG BẬT' : 'ĐANG TẮT') + '</button>' +
            '</div>' +
            '<div class="setting-row">' +
                '<span>⚡ Tự động đổ đầy bàn (Debug Auto)</span>' +
                '<button class="modal-btn ' + (opts.isAuto ? 'primary' : '') + '" id="st-auto">' + (opts.isAuto ? 'ĐANG BẬT' : 'ĐANG TẮT') + '</button>' +
            '</div>' +
        '</div>' +
        '<div id="reset-confirm-area" class="reset-confirm-area" style="display:none">' +
            '<p>⚠️ Bạn chắc chắn muốn xóa toàn bộ tiến trình, sao, xu và sổ tay về ban đầu?</p>' +
            '<div class="modal-buttons">' +
                '<button class="modal-btn danger-btn" id="st-confirm-reset">Xác nhận xóa hết</button>' +
                '<button class="modal-btn" id="st-cancel-reset">Hủy</button>' +
            '</div>' +
        '</div>' +
        '<div class="modal-buttons" id="st-main-btns">' +
            '<button class="modal-btn" id="st-restart">🔄 Chơi lại màn này</button>' +
            '<button class="modal-btn danger-btn" id="st-reset">🗑️ Xóa dữ liệu</button>' +
            '<button class="modal-btn primary" id="mb-close">Đóng</button>' +
        '</div>'
    );

    overlay.querySelector('#st-sound').onclick = function () {
        s.sound = !s.sound;
        saveGame();
        openSettingsModal(opts);
    };
    overlay.querySelector('#st-vib').onclick = function () {
        s.vibrate = !s.vibrate;
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
    overlay.querySelector('#st-restart').onclick = function () {
        closeModal();
        opts.onRestartLevel();
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
    overlay.querySelector('#mb-close').onclick = closeModal;
}
