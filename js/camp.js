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
    enhanceAll3sButtons(overlay);
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
    var completedList = (info.completedOrders && info.completedOrders.length)
        ? info.completedOrders
        : (info.decor ? [info.decor[1]] : []);
    if (completedList.length > 0) {
        var itemsHtml = completedList.map(function (oId) {
            var imgPath = getItemImagePath(oId);
            return '<div class="win-decor-icon-wrap">' +
                '<img src="' + imgPath + '" alt="">' +
            '</div>';
        }).join('');
        decorHtml = '<div class="win-decor">' +
            '<div class="win-decor-label">Đã chuyển vào khu trại:</div>' +
            '<div class="win-decor-row">' + itemsHtml + '</div>' +
        '</div>';
    }
    var gemText = info.gems > 0 ? ' &nbsp;+' + info.gems + ' ' + ICON_RUBY_HTML : '';
    var energyText = (info.energy && info.energy > 0) ? ' &nbsp;+' + info.energy + ' ' + ICON_ENERGY_HTML : '';

    var baseWinCoins = (info.alreadyDoubled ? info.coins * 2 : info.coins);
    var totalCoinsWithSweep = baseWinCoins + (info.sweepCoins || 0);

    var sweepHtml = '';
    if (info.sweepCoins > 0) {
        sweepHtml = '<div class="win-sweep-banner">Thu dọn <b>' + info.sweepCount + '</b> vật phẩm thừa: <b style="color:#e65100">+' + info.sweepCoins.toLocaleString('vi-VN') + ' ' + ICON_GOLD_HTML + '</b></div>';
    }

    var nextBtnHtml = info.hasNext
        ? '<button class="modal-btn primary" id="mb-next">Màn tiếp</button>'
        : '<button class="modal-btn primary" id="mb-close">Đóng</button>';

    var overlay = createModal(
        '<div class="modal-sub win-level-title">Level ' + info.level + '</div>' +
        '<div class="win-stars">' + starsHtml + '</div>' +
        '<div class="win-coins">+' + totalCoinsWithSweep.toLocaleString('vi-VN') + ' ' + ICON_GOLD_HTML + gemText + energyText +
            (info.firstTime ? '' : ' <small>(chơi lại)</small>') + '</div>' +
        sweepHtml +
        decorHtml +
        '<div class="win-buttons-system">' +
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

// ---------- 3. KHU CẮM TRẠI (KHO VẬT PHẨM NHIỆM VỤ, THÚ CƯNG & ĐIỂM ĐẾN) ----------
function openCamp(highlightLevel, onBack, initialTab) {
    if (!SAVE.campItems || !Array.isArray(SAVE.campItems)) SAVE.campItems = [];

    var petsList = (typeof PET_CHARACTERS !== 'undefined') ? PET_CHARACTERS : [
        { id: 'character01', name: 'Golden', img: 'assets/images/ui/character01.png', price: 0 },
        { id: 'character05', name: 'Labrador', img: 'assets/images/ui/character05.png', price: 12000 },
        { id: 'character04', name: 'Poodle', img: 'assets/images/ui/character04.png', price: 15000 },
        { id: 'character03', name: 'Bulldog', img: 'assets/images/ui/character03.png', price: 22000 },
        { id: 'character02', name: 'Béc-giê', img: 'assets/images/ui/character02.png', price: 28000 },
        { id: 'character10', name: 'Ba Tư', img: 'assets/images/ui/character10.png', price: 35000 },
        { id: 'character09', name: 'Maine Coon', img: 'assets/images/ui/character09.png', price: 42000 },
        { id: 'character08', name: 'Ragdoll', img: 'assets/images/ui/character08.png', price: 50000 },
        { id: 'character07', name: 'Mèo Anh', img: 'assets/images/ui/character07.png', price: 58000 },
        { id: 'character06', name: 'Xiêm', img: 'assets/images/ui/character06.png', price: 65000 }
    ];

    var defaultTab = (initialTab === 'pets' || initialTab === 'locations') ? initialTab : 'decor';

    var overlay = createModal(
        '<div class="camp-tab-nav">' +
            '<button class="camp-tab-btn btn-3s' + (defaultTab === 'pets' ? ' active' : '') + '" id="tab-btn-pets">Thú cưng</button>' +
            '<button class="camp-tab-btn btn-3s' + (defaultTab === 'locations' ? ' active' : '') + '" id="tab-btn-locations">Điểm đến</button>' +
            '<button class="camp-tab-btn btn-3s' + (defaultTab === 'decor' ? ' active' : '') + '" id="tab-btn-decor">Vật phẩm</button>' +
        '</div>' +
        '<div id="camp-pane-decor" class="camp-tab-pane" style="' + (defaultTab === 'decor' ? '' : 'display:none;') + '">' +
            '<div class="modal-sub" id="camp-items-sub">Đã thu thập: <b>' + SAVE.campItems.length + '</b> vật phẩm từ nhiệm vụ</div>' +
            '<div class="camp-items-wrap">' +
                '<div class="camp-items-grid" id="camp-items-grid"></div>' +
            '</div>' +
            '<div id="camp-info-bar" class="camp-info-bar">Chạm vào một vật phẩm để xem chi tiết hoặc bán lấy Vàng</div>' +
        '</div>' +
        '<div id="camp-pane-pets" class="camp-tab-pane" style="' + (defaultTab === 'pets' ? '' : 'display:none;') + '">' +
            '<div class="modal-sub" id="pets-unlocked-sub">Bộ sưu tập thú cưng đồng hành</div>' +
            '<div class="pets-scroll-wrap">' +
                '<div class="pets-grid" id="pets-grid-container"></div>' +
            '</div>' +
        '</div>' +
        '<div id="camp-pane-locations" class="camp-tab-pane" style="' + (defaultTab === 'locations' ? '' : 'display:none;') + '">' +
            '<div class="modal-sub" id="loc-unlocked-sub">Bộ sưu tập bối cảnh điểm đến</div>' +
            '<div class="locations-scroll-wrap">' +
                '<div class="locations-list" id="locations-list-container"></div>' +
            '</div>' +
        '</div>' +
        '<div class="modal-buttons" id="camp-modal-buttons">' +
            '<button class="modal-btn primary" id="mb-close">Đóng</button>' +
        '</div>',
        'camp-box',
        'KHU CẮM TRẠI'
    );

    var tabBtnDecor = overlay.querySelector('#tab-btn-decor');
    var tabBtnPets = overlay.querySelector('#tab-btn-pets');
    var tabBtnLocations = overlay.querySelector('#tab-btn-locations');
    var paneDecor = overlay.querySelector('#camp-pane-decor');
    var panePets = overlay.querySelector('#camp-pane-pets');
    var paneLocations = overlay.querySelector('#camp-pane-locations');
    var petsGridContainer = overlay.querySelector('#pets-grid-container');
    var petsSub = overlay.querySelector('#pets-unlocked-sub');
    var locationsListContainer = overlay.querySelector('#locations-list-container');
    var locSub = overlay.querySelector('#loc-unlocked-sub');
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
        showToast('💰 Đã bán ' + item.name + ' nhận +' + price.toLocaleString('vi-VN') + ' Vàng!', '#2e7d32');

        var coinEl = document.getElementById('btn-coin-shop') || document.body;
        if (typeof spawnFlyingCurrency === 'function') {
            spawnFlyingCurrency(coinEl, 'gold', Math.min(price, 80));
        }

        if (typeof updateUIStats === 'function') updateUIStats();

        selectedCampItemUid = null;
        renderCampItems();
    }

    function renderCampItems() {
        if (!SAVE.campItems || !Array.isArray(SAVE.campItems)) SAVE.campItems = [];

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
            if (infoBar) {
                infoBar.innerHTML = '<div class="camp-info-content">' +
                    '<div class="camp-info-name"><b>' + displayName + '</b></div>' +
                    '<button class="btn-3s btn-danger size-32 camp-inline-sell-btn" id="camp-inline-sell-btn">' +
                        '💰 Bán (+' + price.toLocaleString('vi-VN') + ' Vàng)' +
                    '</button>' +
                '</div>';
                var inlineSellBtn = infoBar.querySelector('#camp-inline-sell-btn');
                if (inlineSellBtn) {
                    enhance3sButton(inlineSellBtn);
                    inlineSellBtn.onclick = function (e) {
                        e.stopPropagation();
                        sellSelectedCampItem(selectedItem);
                    };
                }
            }
        } else {
            if (infoBar) {
                infoBar.innerHTML = '<div class="camp-info-placeholder">' +
                    (SAVE.campItems.length > 0
                        ? '💡 Chạm vào một vật phẩm để xem chi tiết hoặc bán lấy Vàng'
                        : '🏕️ Chưa có vật phẩm nào trong khu trại.') +
                '</div>';
            }
        }

        if (!itemsGrid) return;

        if (SAVE.campItems.length === 0) {
            itemsGrid.innerHTML = '<div class="camp-empty-state">' +
                '<div class="camp-empty-icon">🏕️</div>' +
                '<div class="camp-empty-title">Khu Trại Chưa Có Vật Phẩm</div>' +
                '<div class="camp-empty-desc">Khi bạn vượt qua các màn chơi và hoàn thành đơn hàng nhiệm vụ, các món đồ đó sẽ được chuyển vào đây để lưu trữ hoặc bán lấy Vàng!</div>' +
            '</div>';
            return;
        }

        var html = '';
        SAVE.campItems.forEach(function (item, idx) {
            var isSelected = (item.uid === selectedCampItemUid);
            var imgPath = getItemImagePath(item.id);
            var bgCls = (idx % 2 === 0) ? 'bg-light' : 'bg-dark';

            html += '<div class="camp-item-slot ' + bgCls + (isSelected ? ' is-selected' : '') + '" data-uid="' + item.uid + '">' +
                '<img src="' + imgPath + '" class="camp-item-slot-img" alt="' + item.name + '">' +
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

    function switchTab(tab) {
        tabBtnDecor.classList.toggle('active', tab === 'decor');
        tabBtnPets.classList.toggle('active', tab === 'pets');
        tabBtnLocations.classList.toggle('active', tab === 'locations');

        paneDecor.style.display = (tab === 'decor') ? '' : 'none';
        panePets.style.display = (tab === 'pets') ? '' : 'none';
        paneLocations.style.display = (tab === 'locations') ? '' : 'none';

        if (tab === 'decor') {
            renderCampItems();
        } else if (tab === 'pets') {
            renderPetsGrid();
        } else if (tab === 'locations') {
            renderLocationsList();
        }
    }

    tabBtnDecor.onclick = function () { switchTab('decor'); };
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

    function renderLocationsList() {
        if (!SAVE.ownedLocations || !Array.isArray(SAVE.ownedLocations)) SAVE.ownedLocations = ['loc_dongdo'];
        if (!SAVE.activeLocation) SAVE.activeLocation = 'loc_dongdo';

        var locations = (typeof CAMP_LOCATIONS !== 'undefined') ? CAMP_LOCATIONS : [];
        var ownedCount = SAVE.ownedLocations.length;
        if (locSub) {
            locSub.innerHTML = 'Đã sở hữu: <b>' + ownedCount + '/' + locations.length + '</b> điểm đến cắm trại';
        }

        var html = '';
        locations.forEach(function (loc) {
            var isOwned = SAVE.ownedLocations.includes(loc.id);
            var isActive = (SAVE.activeLocation === loc.id);
            var cardCls = 'location-card' + (isActive ? ' is-active' : '');

            var priceHtml = '';
            if (isOwned) {
                priceHtml = '<div class="loc-price-status ' + (isActive ? 'active' : 'owned') + '">' +
                    (isActive ? 'Đang dùng làm cảnh nền' : 'Đã sở hữu') +
                '</div>';
            } else {
                var p = (typeof loc.price === 'number') ? loc.price : 30000;
                priceHtml = '<div class="loc-price">' +
                    p.toLocaleString('vi-VN') + ' ' + (typeof ICON_GOLD_HTML !== 'undefined' ? ICON_GOLD_HTML : '🪙') +
                '</div>';
            }

            var btnHtml = '';
            if (isActive) {
                btnHtml = '<button class="loc-action-btn btn-active" disabled>Đang dùng</button>';
            } else if (isOwned) {
                btnHtml = '<button class="loc-action-btn btn-equip" data-id="' + loc.id + '">Sử dụng</button>';
            } else {
                btnHtml = '<button class="loc-action-btn btn-buy" data-id="' + loc.id + '">Mua</button>';
            }

            html += '<div class="' + cardCls + '">' +
                '<div class="loc-card-img-wrap">' +
                    '<img src="' + loc.img + '" alt="' + loc.name + '" class="loc-card-img">' +
                '</div>' +
                '<div class="loc-card-footer">' +
                    '<div class="loc-info-col">' +
                        '<div class="loc-name">' + loc.name + '</div>' +
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

                if (currentCoins < cost) {
                    if (typeof playSound === 'function') playSound('error');
                    showToast('⚠️ Bạn không đủ Vàng! Cần ' + cost.toLocaleString('vi-VN') + ' Vàng để mua điểm đến ' + loc.name + '.', '#d32f2f');
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
                showToast('🎉 Mở khóa thành công & đặt cảnh nền: ' + loc.name + '!', '#2e7d32');
                renderLocationsList();
            };
        });

        locationsListContainer.querySelectorAll('.btn-equip').forEach(function (btn) {
            btn.onclick = function () {
                var locId = btn.dataset.id;
                var loc = locations.find(function (l) { return l.id === locId; });
                if (!loc) return;
                SAVE.activeLocation = locId;
                saveGame();

                if (typeof updateActiveLocationBackground === 'function') updateActiveLocationBackground();
                if (typeof playSound === 'function') playSound('tap');
                showToast('🌄 Đã đổi cảnh nền sang: ' + loc.name + '!', '#2e7d32');
                renderLocationsList();
            };
        });
    }

    if (defaultTab === 'locations') {
        renderLocationsList();
    } else if (defaultTab === 'pets') {
        renderPetsGrid();
    } else {
        renderCampItems();
    }

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
            if (actionBtn) setBtnText(actionBtn, '⏳ Đang phát (' + timerVal + 's)...');
        } else {
            clearInterval(countdownInterval);
            if (timerEl) timerEl.innerText = '✅ Hoàn tất';
            if (actionBtn) {
                actionBtn.className = 'modal-btn primary';
                actionBtn.disabled = false;
                setBtnText(actionBtn, '🎁 NHẬN THƯỞNG NGAY');
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
            { energy: 25, coinCost: 3000, desc: 'Dùng Vàng nhận thêm Năng Lượng chơi game' },
            { energy: 50, coinCost: 6000, desc: 'Dùng Vàng nhận thêm Năng Lượng chơi game' }
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
            '<small>⏳ Tự động hồi +1 năng lượng sau mỗi ' + curRegenSec + 's khi tương tác (còn ' + opts.secLeft + 's)</small>' +
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
            // 2. Gói nạp siêu tốc bằng Kim Cương (+50 ⚡ giá 8 💎)
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
                if (shopStatusBar) shopStatusBar.innerHTML = '<b style="color:#c62828">❌ Chưa đủ ' + gemPackCfg.gemCost + ' Kim Cương! Hãy mở Cẩm Nang hoặc xem Ads tại Cửa Hàng Kim Cương nhé.</b>';
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
                if (shopStatusBar) shopStatusBar.innerHTML = '<b style="color:#c62828">❌ Chưa đủ ' + pack.coinCost.toLocaleString('vi-VN') + ' Vàng! Hãy ghép đồ (Lv.2+), nộp đơn hoặc bán đồ nhé.</b>';
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
    var gemAdAmt = (typeof AD_REWARDS !== 'undefined' && AD_REWARDS.gem) ? AD_REWARDS.gem.amount : 4;
    var gemAdsLeft = typeof opts.adsLeft === 'number' ? opts.adsLeft : (typeof getAdsLeft === 'function' ? getAdsLeft('gem') : 0);
    var gemAdHtml = '<div class="shop-card">' +
        '<div class="shop-card-left">' +
            '<div class="shop-card-title">+' + gemAdAmt + ' ' + ICON_RUBY_HTML + '</div>' +
            '<div class="shop-card-desc">Xem 1 video ngắn nhận Kim Cương miễn phí • Còn ' + gemAdsLeft + ' lượt hôm nay</div>' +
        '</div>' +
        '<button class="modal-btn ' + (gemAdsLeft > 0 ? 'primary' : 'disabled-btn') + '" id="btn-gem-watch-ad">XEM ADS</button>' +
    '</div>';

    var starterPack = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.starterPack) ? GAME_CONFIG.starterPack : null;
    var starterHtml = '';
    if (starterPack && (!SAVE || !SAVE.starterPackBought)) {
        starterHtml = '<div class="shop-card rescue-card">' +
            '<div class="shop-card-left">' +
                '<div class="shop-card-title">' + renderWithCurrencyIcons(starterPack.name) + '</div>' +
                '<div class="shop-card-desc">' + renderWithCurrencyIcons(starterPack.desc) + '</div>' +
            '</div>' +
            '<button class="modal-btn gem-btn" id="btn-buy-starter-pack">' + starterPack.priceVnd + '</button>' +
        '</div>';
    }

    var packsHtml = '';
    GEM_IAP_PACKS.forEach(function (p) {
        var total = p.gems + (p.bonusGems || 0);
        var bonusHtml = p.bonusGems ? ' (Thưởng +' + p.bonusGems + ' ' + ICON_RUBY_HTML + ')' : '';
        packsHtml += '<div class="shop-card">' +
            '<div class="shop-card-left">' +
                '<div class="shop-card-title">+' + total.toLocaleString('vi-VN') + ' ' + ICON_RUBY_HTML + '</div>' +
                '<div class="shop-card-desc">' + renderWithCurrencyIcons(p.desc) + bonusHtml + '</div>' +
            '</div>' +
            '<button class="modal-btn gem-btn btn-buy-pack" data-id="' + p.id + '">' + p.priceVnd + '</button>' +
        '</div>';
    });

    var overlay = createModal(
        '<div id="gem-status-bar" class="modal-sub">' +
            'Số dư: <b>' + opts.gems + ' ' + ICON_RUBY_HTML + '</b> &nbsp;|&nbsp; ' +
            '<b>' + opts.coins.toLocaleString('vi-VN') + ' ' + ICON_GOLD_HTML + '</b> &nbsp;|&nbsp; ' +
            '<b>' + opts.energy + ' ' + ICON_ENERGY_HTML + '</b><br>' +
            '<small>Kim Cương dùng để nạp năng lượng siêu tốc & các tính năng đặc biệt</small>' +
        '</div>' +
        '<div class="shop-scroll">' +
            starterHtml +
            gemAdHtml +
            packsHtml +
        '</div>' +
        '<div class="modal-buttons">' +
            '<button class="modal-btn primary" id="mb-close">Đóng</button>' +
        '</div>',
        'shop-box',
        'KIM CƯƠNG'
    );

    var gemAdBtn = overlay.querySelector('#btn-gem-watch-ad');
    if (gemAdBtn) {
        gemAdBtn.onclick = function () {
            closeModal();
            if (opts.onWatchAd) opts.onWatchAd();
        };
    }

    var starterBtn = overlay.querySelector('#btn-buy-starter-pack');
    if (starterBtn && starterPack) {
        starterBtn.onclick = function () {
            closeModal();
            if (opts.onBuyIAP) {
                opts.onBuyIAP(starterPack, true);
            }
        };
    }

    overlay.querySelectorAll('.btn-buy-pack').forEach(function (btn) {
        btn.onclick = function () {
            var id = btn.dataset.id;
            var pack = GEM_IAP_PACKS.find(function (p) { return p.id === id; });
            if (pack) {
                closeModal();
                opts.onBuyIAP(pack, false);
            }
        };
    });

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
            '<div class="lucky-drop-visual">🪂</div>' +
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
        simulateWatchAd('Mở Kiện Hàng Tiếp Tế May Mắn 🎁', function () {
            var rolls = [
                { type: 'energy', val: 35, text: '+35 ⚡ Năng lượng', color: '#2e7d32' },
                { type: 'coin', val: 1800, text: '+1.800 🪙 Vàng', color: '#f57f17' },
                { type: 'gem', val: 8, text: '+8 💎 Kim cương', color: '#1565c0' }
            ];
            var roll = rolls[Math.floor(Math.random() * rolls.length)];
            if (onReward) onReward(roll);
        });
    };
}

// ---------- 5. CẨM NANG SƯU TẬP 72 VẬT PHẨM ----------
function openDiscoveryBook() {
    var totalItems = ITEM_CHAINS.length * 8;
    var discCount = countDiscoveredItems();

    var chainsHtml = '';
    ITEM_CHAINS.forEach(function (ch) {
        var slotsHtml = '';
        var chainDisc = 0;
        var bgClass = typeof getCellBgClass === 'function' ? getCellBgClass(ch.line) : 'cell-bg-01';
        for (var lv = 1; lv <= 8; lv++) {
            var id = ch.line + '_lv' + lv;
            var imgPath = id === 'ban_lv8' ? 'assets/images/items/ban_level8.png' : ('assets/images/items/' + id + '.png');
            var isDisc = !!SAVE.discovered[id];
            if (isDisc) chainDisc++;

            var cls = 'book-slot ' + bgClass + (isDisc ? ' discovered' : ' locked');
            slotsHtml += '<div class="' + cls + '" data-id="' + id + '" data-name="' + ch.names[lv - 1] + '" data-lv="' + lv + '">' +
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
                '<small class="book-chain-count">' + chainDisc + '/8</small>' +
            '</div>' +
            '<div class="book-grid">' + slotsHtml + '</div>' +
        '</div>';
    });

    var overlay = createModal(
        '<div class="modal-sub">Đã khám phá: <b>' + discCount + '/' + totalItems + '</b> vật phẩm cắm trại</div>' +
        '<div class="book-scroll">' + chainsHtml + '</div>' +
        '<div class="modal-buttons book-buttons">' +
            '<button class="modal-btn primary" id="mb-close">Đóng</button>' +
        '</div>',
        'book-box',
        'CẨM NANG'
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
                showToast('📖 ' + name + ' (Lv.' + lv + ')', '#4e342e');
            } else {
                var gen = getChainGenerator(id.split('_lv')[0]);
                if (typeof playSound === 'function') playSound('tap');
                showToast('🔒 Hãy ghép từ ' + gen.name + ' để mở khóa Lv.' + lv + '!', '#795548');
            }
        };
    });

    overlay.querySelector('#mb-close').onclick = closeModal;
}

// ---------- 6. BẢN ĐỒ HÀNH TRÌNH (WORLD MAP - LƯỚI 4 CỘT X 5 HÀNG, PHÂN CHẶNG 20 MÀN) ----------
function openWorldMap(currentLv, onSelectLevel) {
    var unlockAll = SAVE.settings && SAVE.settings.unlockAllLevels;

    // Đảm bảo tối thiểu 120 level được sinh cấu hình
    for (var genLv = RAW_LEVELS.length + 1; genLv <= 120; genLv++) {
        getLevelConfig(genLv);
    }

    // Tự động chuyển tới chặng của màn hiện tại (hoặc maxLevel)
    var cur = Math.min(120, currentLv || SAVE.maxLevel || 1);
    var currentStage = Math.max(1, Math.min(6, Math.ceil(cur / 20)));

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
            '<button class="modal-btn primary" id="mb-close">Đóng</button>' +
        '</div>',
        'map-popup-box',
        'BẢN ĐỒ HÀNH TRÌNH'
    );

    var closeBtn = overlay.querySelector('#mb-close');
    if (closeBtn) closeBtn.onclick = closeModal;

    var navTitle = overlay.querySelector('#map-nav-title');
    var stageReqEl = overlay.querySelector('#map-stage-req');
    var gridContainer = overlay.querySelector('#map-grid-container');
    var btnPrev = overlay.querySelector('#map-btn-prev');
    var btnNext = overlay.querySelector('#map-btn-next');

    function renderStage(stage) {
        currentStage = Math.max(1, Math.min(6, stage));
        var stageSize = 20;
        var fromLv = (currentStage - 1) * stageSize + 1;
        var toLv = currentStage * stageSize;

        btnPrev.disabled = (currentStage <= 1);
        btnNext.disabled = (currentStage >= 6);

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
                    '<img src="assets/images/ui/icon_lock.png" class="map-level-lock" alt="🔒">' +
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
            if (nextStage <= 6) {
                if (stageStars >= 30) {
                    stageReqEl.className = 'map-stage-req unlocked';
                    stageReqEl.innerHTML = starImgHtml + ' <span>Đã đạt <b>30</b> sao để mở chặng <b>' + nextStage + '</b></span>';
                } else {
                    stageReqEl.className = 'map-stage-req';
                    stageReqEl.innerHTML = starImgHtml + ' <span>Đạt <b>30</b> sao để mở chặng <b>' + nextStage + '</b></span>';
                }
            } else {
                stageReqEl.className = 'map-stage-req unlocked';
                stageReqEl.innerHTML = '🏆 <span>Chặng cuối cùng của hành trình!</span>';
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
                    showToast('🔒 Hãy hoàn thành Level ' + (lv - 1) + ' trước nhé!', '#c62828');
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
        if (currentStage < 6) {
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
    var unlockAll = s.unlockAllLevels;
    var isAuto = opts.isAuto;
    var pid = SAVE.playerId || generatePlayerId();
    var gUser = SAVE.googleUser;

    var googleCardHtml = '';
    if (!gUser) {
        googleCardHtml =
            '<div class="st-google-unlinked">' +
                '<button class="google-auth-btn" id="st-google-login-btn" type="button">' +
                    '<svg class="google-logo-svg" viewBox="0 0 24 24" width="20" height="20">' +
                        '<path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>' +
                        '<path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>' +
                        '<path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.95 0 12s.45 3.83 1.25 5.42l4.03-3.15z"/>' +
                        '<path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>' +
                    '</svg>' +
                    '<span>Đăng nhập Google</span>' +
                '</button>' +
            '</div>';
    } else {
        googleCardHtml =
            '<div class="st-google-linked">' +
                '<div class="st-google-user-row">' +
                    '<div class="st-google-avatar-wrap">' +
                        '<img src="' + (gUser.picture || 'assets/images/ui/character01.png') + '" class="st-google-avatar" alt="">' +
                    '</div>' +
                    '<div class="st-google-user-meta">' +
                        '<div class="st-google-name">' + (gUser.name || 'Người chơi Google') + '</div>' +
                        '<div class="st-google-email">' + (gUser.email || '') + '</div>' +
                        '<div class="st-google-status">🟢 Đã liên kết tài khoản Google</div>' +
                    '</div>' +
                '</div>' +
            '</div>';
    }

    var accountCardHtml =
        '<div class="st-account-card">' +
            '<div class="st-account-id-row">' +
                '<div class="st-id-meta">' +
                    '<span class="st-id-label">ID NGƯỜI CHƠI</span>' +
                    '<span class="st-id-val" id="st-player-id-val">' + pid + '</span>' +
                '</div>' +
                '<div class="st-id-btn-group">' +
                    '<button class="st-edit-id-btn" id="st-edit-id-btn" type="button" title="Đổi ID người chơi">' +
                        '<span>✏️ Đổi ID</span>' +
                    '</button>' +
                    '<button class="st-copy-btn" id="st-copy-id-btn" type="button" title="Sao chép ID người chơi">' +
                        '<svg class="st-copy-svg" viewBox="0 0 24 24" width="13" height="13" fill="currentColor">' +
                            '<path d="M16 1H4C2.9 1 2 1.9 2 3v14h2V3h12V1zm3 4H8C6.9 5 6 5.9 6 7v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>' +
                        '</svg>' +
                        '<span>Sao chép</span>' +
                    '</button>' +
                '</div>' +
            '</div>' +
            googleCardHtml +
        '</div>';

    var overlay = createModal(
        '<div class="popup-sub">Cài đặt màn chơi và dữ liệu</div>' +
        '<div class="st-rows">' +
            '<!-- Khối ID Người Chơi & Đồng Bộ Google -->' +
            accountCardHtml +

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

            '<!-- Mở khóa tất cả level -->' +
            '<div class="st-row">' +
                '<div class="st-row-left">' +
                    '<img src="assets/images/ui/icon_lock.png" class="st-icon" alt="">' +
                    '<span class="st-label">Mở khóa tất cả level</span>' +
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
                '<button class="modal-btn danger-btn" id="st-confirm-reset" style="flex:2">Xác nhận xóa hết</button>' +
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

    // Đổi ID người chơi
    var editIdBtn = overlay.querySelector('#st-edit-id-btn');
    if (editIdBtn) {
        editIdBtn.onclick = function () {
            closeModal();
            showEditPlayerIdModal(opts);
        };
    }

    // Sao chép ID người chơi
    var copyIdBtn = overlay.querySelector('#st-copy-id-btn');
    if (copyIdBtn) {
        copyIdBtn.onclick = function () {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(pid).then(function () {
                    showToast('📋 Đã sao chép ID: ' + pid, '#2e7d32');
                }).catch(function () {
                    showToast('ID của bạn: ' + pid, '#2e7d32');
                });
            } else {
                showToast('ID của bạn: ' + pid, '#2e7d32');
            }
        };
    }

    // Đăng nhập Google (Tự động mở cửa sổ chọn tài khoản Google không cần nhập email)
    var googleLoginBtn = overlay.querySelector('#st-google-login-btn');
    if (googleLoginBtn) {
        googleLoginBtn.onclick = function () {
            if (typeof FIREBASE_SYNC !== 'undefined' && FIREBASE_SYNC.isConfigured()) {
                FIREBASE_SYNC.loginWithGoogle(function (user) {
                    showToast('🎉 Đăng nhập Google thành công: ' + (user.displayName || user.email), '#2e7d32');
                    openSettingsModal(opts);
                }, function (err) {
                    console.warn('Google sign-in notice:', err);
                    var msg = (err && err.message) ? err.message : String(err);
                    var code = (err && err.code) ? err.code : '';
                    if (code === 'auth/configuration-not-found' || msg.indexOf('configuration-not-found') !== -1) {
                        showToast('⚠️ Bạn chưa Bật "Google" trong Firebase Console > Authentication > Sign-in method!', '#c62828');
                    } else if (code === 'auth/unauthorized-domain' || msg.indexOf('unauthorized-domain') !== -1) {
                        showToast('⚠️ Vui lòng thêm domain/IP này vào Firebase Console > Authentication > Settings > Authorized domains!', '#c62828');
                    } else if (code === 'auth/popup-closed-by-user' || msg.indexOf('popup-closed-by-user') !== -1) {
                        showToast('ℹ️ Bạn đã đóng cửa sổ chọn tài khoản Google.', '#546e7a');
                    } else if (code === 'auth/popup-blocked' || msg.indexOf('popup-blocked') !== -1) {
                        showToast('⚠️ Trình duyệt đang chặn cửa sổ Popup. Vui lòng cho phép popup!', '#c62828');
                    } else {
                        showToast('⚠️ Đăng nhập Google không thành công: ' + msg, '#c62828');
                    }
                });
            } else {
                showToast('⚠️ Chưa cấu hình kết nối Firebase Google!', '#c62828');
            }
        };
    }

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
                '<button class="modal-btn" id="g-open-fb-btn" style="width:100%;height:38px;font-size:0.8125rem;background:#fff3e0;border:1.5px solid #ffcc80;color:#e65100;">🔥 Cấu hình Google Firebase (100% Miễn phí)</button>' +
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
                showToast('⚠️ Vui lòng nhập đúng định dạng email (ví dụ: ten@gmail.com)', '#c62828');
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
                    '<b>💡 Tìm thấy dữ liệu Đám Mây của tài khoản này:</b><br>' +
                    '• Màn hiện tại: <b>Level ' + cloudLv + '</b> (' + cloudStars + ' màn đạt sao)<br>' +
                    '• Kho Vàng: <b>' + cloudCoins + ' 🪙</b><br>' +
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
                        showToast('🎉 Đã đồng bộ thành công dữ liệu từ tài khoản Google!', '#2e7d32');
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
                        showToast('☁️ Đã ghi đè và sao lưu tiến trình máy này lên Google!', '#2e7d32');
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
            showToast('🎉 Đã liên kết tài khoản Google & lưu lên Đám Mây thành công!', '#2e7d32');
            if (onSuccess) onSuccess();
        };
    }
}

// ---------- MODAL NHẬP MÃ ĐỒNG BỘ CHUYỂN MÁY ----------
function showImportSyncModal(opts) {
    var overlay = createModal(
        '<div class="google-auth-dialog">' +
            '<div class="google-dialog-header">' +
                '<div style="font-size:2rem;line-height:1;margin-bottom:6px;">📋</div>' +
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
                showToast('⚠️ Vui lòng dán mã sao lưu vào ô!', '#c62828');
                codeArea.focus();
                return;
            }

            var ok = importSyncCode(code);
            if (ok) {
                if (opts.onCloudRestore) opts.onCloudRestore();
                closeModal();
                showToast('🎉 Đã đồng bộ tiến trình thành công từ thiết bị cũ!', '#2e7d32');
            } else {
                showToast('❌ Mã sao lưu không hợp lệ hoặc bị lỗi!', '#c62828');
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
                '<span style="font-size:1.75rem;">🔥</span>' +
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
                        'Bấm vào biểu tượng <b>Cài đặt dự án ⚙️</b> (Project settings) -> Cuộn xuống mục <b>Your apps</b> -> Chọn Web <b>&lt;/&gt;</b> -> Sao chép đoạn <code>firebaseConfig = { ... }</code>.' +
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
                showToast('Đã xóa cấu hình Firebase.', '#546e7a');
                closeModal();
                openSettingsModal(opts);
            }
        };
    }

    if (applyBtn && configInput) {
        applyBtn.onclick = function () {
            var rawText = (configInput.value || '').trim();
            if (!rawText) {
                showToast('⚠️ Vui lòng dán mã cấu hình Firebase vào ô!', '#c62828');
                configInput.focus();
                return;
            }

            if (typeof FIREBASE_SYNC !== 'undefined') {
                var res = FIREBASE_SYNC.saveConfig(rawText);
                if (res.success) {
                    showToast('🎉 Đã kích hoạt kết nối Google Firebase thành công!', '#2e7d32');
                    closeModal();
                    openSettingsModal(opts);
                } else {
                    showToast('❌ ' + (res.message || 'Cấu hình không hợp lệ!'), '#c62828');
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
                msgBox.innerText = '⚠️ ID phải có ít nhất 3 ký tự!';
                input.focus();
                return;
            }

            if (!/^[A-Z0-9_-]{3,16}$/.test(newId)) {
                msgBox.style.display = 'block';
                msgBox.style.background = '#ffebee';
                msgBox.style.color = '#c62828';
                msgBox.innerText = '⚠️ ID chỉ được chứa chữ cái, số và dấu gạch (-)!';
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
                        showToast('🎉 Đã đổi ID thành công: ' + newId, '#2e7d32');
                        closeModal();
                        openSettingsModal(opts);
                    } else {
                        msgBox.style.display = 'block';
                        msgBox.style.background = '#ffebee';
                        msgBox.style.color = '#c62828';
                        msgBox.innerText = '❌ ' + resultOrMsg;
                    }
                });
            } else {
                SAVE.playerId = newId;
                saveGame();
                showToast('🎉 Đã đổi ID thành công: ' + newId, '#2e7d32');
                closeModal();
                openSettingsModal(opts);
            }
        };
    }
}

