// =============================================================================
// CÔNG CỤ TEST & BOT TỰ ĐỘNG CHƠI (DEV & AUTO-TEST SUITE)
// Giúp tự động chơi trực tiếp trên giao diện và nhảy cấp tức thì để test game
// =============================================================================

(function () {
    'use strict';

    var autoBotTimer = null;
    var autoBotSpeed = 300; // ms
    var autoBotRunning = false;
    var autoBotStats = {
        ordersDelivered: 0,
        merges: 0,
        taps: 0,
        generatorsPlaced: 0,
        energySpent: 0
    };

    // 1. NHẢY NHANH CẤP ĐỘ (LEVEL JUMP)
    function jumpToLevel(targetLv) {
        var lv = Math.max(1, parseInt(targetLv, 10) || 1);
        if (typeof SAVE === 'undefined' || !SAVE) return;

        SAVE.playerLevel = lv;
        SAVE.level = lv;
        SAVE.playerExp = 0;
        if (typeof currentLevel !== 'undefined') currentLevel = lv;

        // Đặt năng lượng chuẩn 100⚡
        if (typeof playerEnergy !== 'undefined') {
            playerEnergy = 100;
            SAVE.energy = 100;
        }

        // Mở khóa ô đá theo cấp độ
        if (typeof boardData !== 'undefined' && Array.isArray(boardData)) {
            for (var l = 1; l <= lv; l++) {
                if (typeof checkAndUnlockRocksByPlayerLevel === 'function') {
                    checkAndUnlockRocksByPlayerLevel(boardData, l);
                }
            }

            // Đảm bảo máy phát tương ứng có mặt trên bàn
            if (lv >= 4 && !boardData.some(function (c) { return c && c.id === 'generator_backpack'; })) {
                var empties = (typeof getEmptyIndexes === 'function') ? getEmptyIndexes(boardData) : [];
                if (empties.length) boardData[empties[0]] = { id: 'generator_backpack', isRock: false, isLocked: false };
            }
            if (lv >= 7 && !boardData.some(function (c) { return c && c.id === 'generator_crate'; })) {
                var empties2 = (typeof getEmptyIndexes === 'function') ? getEmptyIndexes(boardData) : [];
                if (empties2.length) boardData[empties2[0]] = { id: 'generator_crate', isRock: false, isLocked: false };
            }
        }

        // Tái tạo đơn hàng chuẩn cho cấp độ đích
        SAVE.petOrderGroups = [];
        if (typeof ensurePetOrderGroups === 'function') {
            ensurePetOrderGroups(lv);
        }
        if (typeof syncCurrentOrdersFromGroups === 'function') {
            syncCurrentOrdersFromGroups();
        }

        if (typeof persistCurrentBoardState === 'function') persistCurrentBoardState();
        if (typeof renderBoard === 'function') renderBoard();
        if (typeof renderOrders === 'function') renderOrders();
        if (typeof updateUIStats === 'function') updateUIStats();
        if (typeof showToast === 'function') showToast('🚀 Đã nhảy tới Cấp ' + lv + ' (100⚡ chuẩn)!', '#2e7d32');
    }

    // 2. BƠM HOẶC ĐẶT LẠI TÀI NGUYÊN (RESOURCES)
    function addResources(energyAmt, coinAmt, gemAmt) {
        if (typeof SAVE === 'undefined' || !SAVE) return;
        if (energyAmt) {
            playerEnergy = (playerEnergy || 0) + energyAmt;
            SAVE.energy = playerEnergy;
        }
        if (coinAmt) {
            playerCoins = (playerCoins || 0) + coinAmt;
            SAVE.coins = playerCoins;
        }
        if (gemAmt) {
            playerGems = (playerGems || 0) + gemAmt;
            SAVE.gems = playerGems;
        }
        if (typeof persistCurrentBoardState === 'function') persistCurrentBoardState();
        if (typeof updateUIStats === 'function') updateUIStats();
        if (typeof showToast === 'function') showToast('⚡ Đã bơm +' + energyAmt + '⚡, +' + coinAmt + '🪙, +' + gemAmt + '💎', '#1565c0');
    }

    // ĐẶT LẠI TÀI NGUYÊN CHUẨN ĐỂ TEST ĐỘ KHAN HIẾM
    function resetResourcesToStandard() {
        if (typeof SAVE === 'undefined' || !SAVE) return;
        playerEnergy = 100;
        SAVE.energy = 100;
        playerCoins = 1000;
        SAVE.coins = 1000;
        playerGems = 10;
        SAVE.gems = 10;
        if (typeof persistCurrentBoardState === 'function') persistCurrentBoardState();
        if (typeof updateUIStats === 'function') updateUIStats();
        if (typeof showToast === 'function') showToast('🔄 Đã cân bằng lại tài nguyên: 100⚡, 1.000🪙, 10💎', '#2e7d32');
    }

    // 3. DỌN SẠCH CÁC Ô ĐỒ TRÊN BÀN (CHỈ GIỮ MÁY PHÁT & ĐÁ)
    function clearBoardItemsOnly() {
        if (typeof boardData === 'undefined' || !Array.isArray(boardData)) return;
        boardData.forEach(function (c, idx) {
            if (c && c.id && !c.isRock && !c.isLocked && !GENERATORS[c.id]) {
                boardData[idx] = makeEmptyCell();
            }
        });
        if (typeof persistCurrentBoardState === 'function') persistCurrentBoardState();
        if (typeof renderBoard === 'function') renderBoard();
        if (typeof showToast === 'function') showToast('🧹 Đã dọn sạch vật phẩm trên bàn cờ!', '#f57c00');
    }

    // 4. CÁC HÀM TRỢ GIÚP PHÂN TÍCH NHIỆM VỤ & BÀN CỜ CHO BOT
    // 4.1. Lấy danh sách các đơn hàng thực tế đang còn thiếu (chưa có trên bàn cờ)
    function getUnsatisfiedOrders() {
        var needed = [];
        if (typeof SAVE === 'undefined' || !SAVE || !Array.isArray(SAVE.petOrderGroups) || !SAVE.petOrderGroups.length) {
            return needed;
        }
        var available = {};
        if (typeof boardData !== 'undefined' && Array.isArray(boardData)) {
            boardData.forEach(function (c) {
                if (c && c.id && !c.isRock && !c.isLocked && !GENERATORS[c.id]) {
                    available[c.id] = (available[c.id] || 0) + 1;
                }
            });
        }
        var group = SAVE.petOrderGroups[0];
        if (group && Array.isArray(group.orders)) {
            group.orders.forEach(function (o) {
                if (!o || !o.id) return;
                if (o.stashed) return;
                if (available[o.id] && available[o.id] > 0) {
                    available[o.id]--;
                } else {
                    needed.push(o);
                }
            });
        }
        return needed;
    }

    // 4.2. Kiểm tra xem 1 món đồ trên bàn cờ có đang được bảo vệ (đạt đúng cấp độ đơn hàng cần giao) hay không
    function isItemProtectedForOrder(itemId) {
        if (!itemId || typeof SAVE === 'undefined' || !SAVE || !Array.isArray(SAVE.petOrderGroups) || !SAVE.petOrderGroups[0]) return false;
        var group = SAVE.petOrderGroups[0];
        var neededCount = 0;
        (group.orders || []).forEach(function (o) {
            if (o && o.id === itemId && !o.stashed) neededCount++;
        });
        if (neededCount === 0) return false;

        var countOnBoard = 0;
        if (typeof boardData !== 'undefined' && Array.isArray(boardData)) {
            boardData.forEach(function (c) {
                if (c && c.id === itemId && !c.isRock && !c.isLocked) {
                    countOnBoard++;
                }
            });
        }
        return countOnBoard <= neededCount;
    }

    // 4.3. Tìm ô đồ rác tối ưu nhất để bán giải phóng chỗ trống khi bàn cờ bị đầy
    function findBestTrashItemToSell() {
        if (typeof boardData === 'undefined' || !Array.isArray(boardData)) return -1;
        var neededIds = new Set();
        if (typeof SAVE !== 'undefined' && SAVE && Array.isArray(SAVE.petOrderGroups) && SAVE.petOrderGroups[0]) {
            (SAVE.petOrderGroups[0].orders || []).forEach(function (o) {
                if (o && o.id) neededIds.add(o.id);
            });
        }

        var bestIdx = -1;
        var lowestLv = 999;
        var bestIsNeeded = true;

        for (var idx = 0; idx < boardData.length; idx++) {
            var c = boardData[idx];
            if (!c || !c.id || c.isRock || c.isLocked || GENERATORS[c.id]) continue;
            var lv = (typeof itemLv === 'function') ? itemLv(c.id) : (parseInt(c.id.split('_lv')[1], 10) || 1);
            var isNeeded = neededIds.has(c.id);

            // Ưu tiên bán đồ không nằm trong đơn hàng đang cần
            if (!isNeeded && bestIsNeeded) {
                bestIsNeeded = false;
                lowestLv = lv;
                bestIdx = idx;
            } else if (!isNeeded && !bestIsNeeded) {
                if (lv < lowestLv) {
                    lowestLv = lv;
                    bestIdx = idx;
                }
            } else if (isNeeded && bestIsNeeded) {
                if (lv < lowestLv) {
                    lowestLv = lv;
                    bestIdx = idx;
                }
            }
        }
        return bestIdx;
    }

    // 4.4. Tự động kiểm tra và lôi máy phát mới vào bàn cờ khi đã đủ cấp độ mở khóa
    function checkAndPlacePendingGenerators() {
        if (typeof boardData === 'undefined' || !boardData.length) return false;
        var pLv = (typeof SAVE !== 'undefined' && SAVE && typeof SAVE.playerLevel === 'number') ? SAVE.playerLevel : 1;

        var pendingGens = (typeof getPendingDockGenerators === 'function')
            ? getPendingDockGenerators(boardData, pLv)
            : [];

        // Kiểm tra bổ sung nếu getPendingDockGenerators chưa trả về
        if (!pendingGens.length) {
            var unlockLevels = (typeof GAME_CONFIG !== 'undefined' && GAME_CONFIG.initialBoard && GAME_CONFIG.initialBoard.generatorUnlockLevels)
                ? GAME_CONFIG.initialBoard.generatorUnlockLevels
                : { generator_cooler: 1, generator_backpack: 4, generator_crate: 7 };
            if (pLv >= (unlockLevels.generator_backpack || 4) && !boardData.some(function (c) { return c && c.id === 'generator_backpack' && !c.isRock && !c.isLocked; })) {
                pendingGens.push('generator_backpack');
            }
            if (pLv >= (unlockLevels.generator_crate || 7) && !boardData.some(function (c) { return c && c.id === 'generator_crate' && !c.isRock && !c.isLocked; })) {
                pendingGens.push('generator_crate');
            }
        }

        if (pendingGens.length === 0) return false;

        var nextGen = pendingGens[0];
        var empties = (typeof getEmptyIndexes === 'function') ? getEmptyIndexes(boardData) : [];

        // Nếu không có ô trống, bán 1 item rác để lấy chỗ
        if (!empties.length) {
            var trashIdx = findBestTrashItemToSell();
            if (trashIdx !== -1 && typeof sellItemAtIndex === 'function') {
                sellItemAtIndex(trashIdx);
                return true;
            }
        }

        // Đặt máy phát lên bàn cờ
        if (typeof placePendingGeneratorOnBoard === 'function') {
            var ok = placePendingGeneratorOnBoard(nextGen, -1);
            if (ok) {
                autoBotStats.generatorsPlaced++;
                var gName = (nextGen === 'generator_backpack') ? 'Ba Lô Dã Ngoại' : 'Thùng Bếp & Sinh Tồn';
                if (typeof showToast === 'function') {
                    showToast('🤖 Bot đã tự động lôi ' + gName + ' vào bàn cờ!', '#2e7d32');
                }
                updateBotStatusUI();
                return true;
            }
        }
        return false;
    }

    // 4.5. LOGIC CHÍNH CỦA BOT TỰ ĐỘNG CHƠI (AUTO-BOT ENGINE)
    function botStep() {
        if (!autoBotRunning) return;
        if (typeof boardData === 'undefined' || !boardData.length) return;

        // BƯỚC 1: TỰ ĐỘNG GIAO ĐƠN HÀNG KHI ĐỦ ĐIỀU KIỆN
        var deliverGroupBtn = document.querySelector('.btn-group-deliver');
        if (deliverGroupBtn && !deliverGroupBtn.disabled) {
            deliverGroupBtn.click();
            autoBotStats.ordersDelivered++;
            updateBotStatusUI();
            return;
        }

        var unsatisfied = getUnsatisfiedOrders();
        if (unsatisfied.length === 0 && typeof SAVE !== 'undefined' && SAVE && Array.isArray(SAVE.petOrderGroups) && SAVE.petOrderGroups.length > 0) {
            if (typeof deliverPetOrderGroup === 'function') {
                deliverPetOrderGroup(0);
                autoBotStats.ordersDelivered++;
                updateBotStatusUI();
                return;
            }
        }

        // BƯỚC 2: TỰ ĐỘNG PHÁT HIỆN VÀ LÔI MÁY PHÁT MỚI VÀO BÀN CỜ (CẤP 4: BA LÔ, CẤP 7: THÙNG ĐỒ)
        if (checkAndPlacePendingGenerators()) {
            return;
        }

        // BƯỚC 3: GHÉP ĐỒ THÔNG MINH
        // 3.1. Thu thập các nhánh mà các đơn hàng còn thiếu đang cần
        var targetLines = new Set();
        unsatisfied.forEach(function (o) {
            if (o && o.id) {
                var ln = (typeof itemLine === 'function') ? itemLine(o.id) : o.id.split('_lv')[0];
                targetLines.add(ln);
            }
        });

        // 3.2. Ghép vào ô mạng nhện (kẹt mạng) để giải phóng ô cờ và mở đá
        for (var i = 0; i < boardData.length; i++) {
            var c1 = boardData[i];
            if (!c1 || !c1.id || c1.isRock || c1.isLocked || GENERATORS[c1.id]) continue;
            for (var j = 0; j < boardData.length; j++) {
                if (i === j) continue;
                var c2 = boardData[j];
                if (!c2 || !c2.id || c2.isRock || GENERATORS[c2.id]) continue;
                if (c2.isLocked && c2.id === c1.id) {
                    executeMoveAndEffects(i, j);
                    autoBotStats.merges++;
                    updateBotStatusUI();
                    return;
                }
            }
        }

        // 3.3. Ghép đồ thuộc nhánh nhiệm vụ đang cần (ưu tiên hoàn thành đơn)
        // Không ghép tiêu biến món đồ đã đạt đúng cấp độ đơn hàng đang cần
        for (var i = 0; i < boardData.length; i++) {
            var c1 = boardData[i];
            if (!c1 || !c1.id || c1.isRock || c1.isLocked || GENERATORS[c1.id]) continue;
            var line1 = (typeof itemLine === 'function') ? itemLine(c1.id) : c1.id.split('_lv')[0];
            if (!targetLines.has(line1)) continue;
            if (isItemProtectedForOrder(c1.id)) continue;

            for (var j = i + 1; j < boardData.length; j++) {
                var c2 = boardData[j];
                if (!c2 || !c2.id || c2.isRock || c2.isLocked || GENERATORS[c2.id]) continue;
                if (c2.id === c1.id) {
                    executeMoveAndEffects(i, j);
                    autoBotStats.merges++;
                    updateBotStatusUI();
                    return;
                }
            }
        }

        // 3.4. Ghép bất kỳ 2 món cùng loại khác để thu gọn bàn cờ (trừ món đã đủ để nộp)
        for (var i = 0; i < boardData.length; i++) {
            var c1 = boardData[i];
            if (!c1 || !c1.id || c1.isRock || c1.isLocked || GENERATORS[c1.id]) continue;
            if (isItemProtectedForOrder(c1.id)) continue;

            for (var j = i + 1; j < boardData.length; j++) {
                var c2 = boardData[j];
                if (!c2 || !c2.id || c2.isRock || c2.isLocked || GENERATORS[c2.id]) continue;
                if (c2.id === c1.id) {
                    executeMoveAndEffects(i, j);
                    autoBotStats.merges++;
                    updateBotStatusUI();
                    return;
                }
            }
        }

        // BƯỚC 4: BẤM MÁY PHÁT ĐỂ SINH ĐỒ
        // 4.1. Kiểm tra ô trống trên bàn cờ
        var empties = (typeof getEmptyIndexes === 'function') ? getEmptyIndexes(boardData) : [];
        if (!empties.length) {
            var sellIdx = findBestTrashItemToSell();
            if (sellIdx !== -1 && typeof sellItemAtIndex === 'function') {
                sellItemAtIndex(sellIdx);
                return;
            }
        }

        // 4.2. Tự hồi năng lượng nếu cạn (giả lập xem ads +50⚡)
        if (typeof playerEnergy !== 'undefined' && playerEnergy <= 5) {
            playerEnergy = 50;
            if (SAVE) SAVE.energy = 50;
            if (typeof updateUIStats === 'function') updateUIStats();
        }

        // 4.3. Chọn chính xác máy phát phục vụ cho đơn hàng đang thiếu
        var targetGen = 'generator_cooler';
        if (unsatisfied.length > 0) {
            var firstMissing = unsatisfied[0];
            var fLine = (typeof itemLine === 'function') ? itemLine(firstMissing.id) : firstMissing.id.split('_lv')[0];
            if (typeof getGeneratorForLine === 'function') {
                targetGen = getGeneratorForLine(fLine);
            } else if (typeof GENERATOR_BRANCH_MAP !== 'undefined') {
                for (var gId in GENERATOR_BRANCH_MAP) {
                    if (GENERATOR_BRANCH_MAP[gId].indexOf(fLine) !== -1) {
                        targetGen = gId;
                        break;
                    }
                }
            }
        }

        // 4.4. Tìm ô chứa máy phát mục tiêu trên bàn cờ
        var genCellIdx = -1;
        boardData.forEach(function (c, idx) {
            if (c && c.id === targetGen && !c.isRock && !c.isLocked) {
                genCellIdx = idx;
            }
        });

        // Nếu máy phát chưa có trên bàn cờ, lập tức lôi vào
        if (genCellIdx === -1) {
            if (typeof placePendingGeneratorOnBoard === 'function') {
                placePendingGeneratorOnBoard(targetGen, -1);
            }
            boardData.forEach(function (c, idx) {
                if (c && c.id === targetGen && !c.isRock && !c.isLocked) {
                    genCellIdx = idx;
                }
            });
        }

        // Fallback nếu vẫn không thấy máy phát đó, dùng máy phát bất kỳ có trên bàn
        if (genCellIdx === -1) {
            boardData.forEach(function (c, idx) {
                if (c && GENERATORS[c.id] && !c.isRock && !c.isLocked) {
                    genCellIdx = idx;
                }
            });
        }

        // 4.5. Thực hiện bấm máy phát
        if (genCellIdx !== -1) {
            var gridBoard = document.getElementById('grid-board');
            var cellEl = gridBoard && gridBoard.children[genCellIdx];
            var genItem = boardData[genCellIdx];
            if (cellEl && genItem) {
                if (typeof handleGeneratorClick === 'function') {
                    handleGeneratorClick(genItem, cellEl);
                } else {
                    cellEl.click();
                }
                autoBotStats.taps++;
                autoBotStats.energySpent++;
                updateBotStatusUI();
            }
        }
    }

    function startAutoBot(speedMs) {
        if (autoBotTimer) clearInterval(autoBotTimer);
        autoBotSpeed = speedMs || autoBotSpeed || 300;
        autoBotRunning = true;
        window.autoBotRunning = true;
        autoBotTimer = setInterval(botStep, autoBotSpeed);
        updateBotStatusUI();
        if (typeof showToast === 'function') showToast('🤖 Bot tự động chơi đã BẬT (' + autoBotSpeed + 'ms/nước)!', '#2e7d32');
    }

    function stopAutoBot() {
        if (autoBotTimer) {
            clearInterval(autoBotTimer);
            autoBotTimer = null;
        }
        autoBotRunning = false;
        window.autoBotRunning = false;
        updateBotStatusUI();
        if (typeof showToast === 'function') showToast('⏹️ Bot tự động chơi đã TẮT', '#c62828');
    }

    function toggleAutoBot() {
        if (autoBotRunning) stopAutoBot();
        else startAutoBot(autoBotSpeed);
    }

    // 5. GIAO DIỆN NÚT DEV & POPUP ĐIỀU KHIỂN
    function updateBotStatusUI() {
        var toggleBtn = document.getElementById('dev-bot-toggle-btn');
        var statsEl = document.getElementById('dev-bot-stats');
        var floatingPill = document.getElementById('dev-floating-status');

        if (toggleBtn) {
            toggleBtn.textContent = autoBotRunning ? '⏹️ DỪNG BOT' : '▶️ BẬT BOT TỰ CHƠI';
            toggleBtn.style.background = autoBotRunning ? '#d32f2f' : '#2e7d32';
        }
        if (statsEl) {
            statsEl.innerHTML = 'Đã giao: <b>' + autoBotStats.ordersDelivered + '</b> đơn | Ghép: <b>' + autoBotStats.merges + '</b> | Bấm máy: <b>' + autoBotStats.taps + '</b>' +
                (autoBotStats.generatorsPlaced ? ' | Đặt máy: <b>' + autoBotStats.generatorsPlaced + '</b>' : '');
        }
        if (floatingPill) {
            floatingPill.style.display = autoBotRunning ? 'flex' : 'none';
            floatingPill.innerHTML = '🤖 BOT ĐANG CHẠY (' + autoBotStats.ordersDelivered + ' đơn)';
        }
    }

    function openDevTestModal() {
        var existing = document.getElementById('dev-test-modal-overlay');
        if (existing) existing.remove();

        var overlay = document.createElement('div');
        overlay.id = 'dev-test-modal-overlay';
        overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.75); z-index:999999; display:flex; align-items:center; justify-content:center; padding:12px; box-sizing:border-box; font-family:sans-serif;';

        var pLv = (typeof SAVE !== 'undefined' && SAVE && SAVE.playerLevel) ? SAVE.playerLevel : 1;

        overlay.innerHTML =
            '<div style="background:#1e1e24; color:#fff; width:100%; max-width:440px; border-radius:16px; border:2px solid #4caf50; padding:18px; box-shadow:0 8px 32px rgba(0,0,0,0.8); max-height:90vh; overflow-y:auto;">' +
                '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; border-bottom:1px solid #333; padding-bottom:8px;">' +
                    '<h3 style="margin:0; font-size:17px; color:#a5d6a7; display:flex; align-items:center; gap:6px;">🛠️ BẢNG ĐIỀU KHIỂN TEST & BOT</h3>' +
                    '<button id="dev-close-btn" style="background:#444; border:none; color:#fff; width:30px; height:30px; border-radius:50%; font-size:16px; cursor:pointer;">✕</button>' +
                '</div>' +

                // SECTION 1: BOT TỰ CHƠI
                '<div style="background:#282830; border-radius:12px; padding:12px; margin-bottom:14px;">' +
                    '<div style="font-weight:bold; font-size:14px; color:#ffca28; margin-bottom:6px;">🤖 BOT TỰ ĐỘNG CHƠI (AUTO-BOT)</div>' +
                    '<div style="font-size:12px; color:#bbb; margin-bottom:10px;">Bot sẽ tự bấm máy phát, tự kéo ghép và nộp nhiệm vụ trực tiếp trên màn hình!</div>' +
                    '<div style="display:flex; gap:8px; margin-bottom:8px;">' +
                        '<button id="dev-bot-toggle-btn" style="flex:1; padding:10px; border:none; border-radius:8px; font-weight:bold; font-size:14px; color:#fff; cursor:pointer; background:' + (autoBotRunning ? '#d32f2f' : '#2e7d32') + ';">' +
                            (autoBotRunning ? '⏹️ DỪNG BOT' : '▶️ BẬT BOT TỰ CHƠI') +
                        '</button>' +
                    '</div>' +
                    '<div style="display:flex; align-items:center; gap:6px; font-size:12px; color:#eee;">' +
                        '<span>Tốc độ:</span>' +
                        '<button class="dev-speed-btn" data-speed="500" style="padding:4px 8px; border-radius:4px; border:1px solid #666; background:#333; color:#fff; cursor:pointer;">Vừa (0.5s)</button>' +
                        '<button class="dev-speed-btn" data-speed="250" style="padding:4px 8px; border-radius:4px; border:1px solid #4caf50; background:#2e7d32; color:#fff; cursor:pointer;">Nhanh (0.25s)</button>' +
                        '<button class="dev-speed-btn" data-speed="80" style="padding:4px 8px; border-radius:4px; border:1px solid #ff9800; background:#e65100; color:#fff; cursor:pointer;">Siêu Tốc</button>' +
                    '</div>' +
                    '<div id="dev-bot-stats" style="margin-top:8px; font-size:11px; color:#81c784;">' +
                        'Đã giao: <b>' + autoBotStats.ordersDelivered + '</b> đơn | Ghép: <b>' + autoBotStats.merges + '</b> | Bấm máy: <b>' + autoBotStats.taps + '</b>' +
                    '</div>' +
                '</div>' +

                // SECTION 2: NHẢY CẤP ĐỘ
                '<div style="background:#282830; border-radius:12px; padding:12px; margin-bottom:14px;">' +
                    '<div style="font-weight:bold; font-size:14px; color:#80d8ff; margin-bottom:6px;">🚀 NHẢY CẤP ĐỘ (LEVEL JUMP)</div>' +
                    '<div style="font-size:12px; color:#bbb; margin-bottom:8px;">Chọn cấp độ muốn test (tự mở đúng máy phát, phá đá và sinh đơn tương ứng):</div>' +
                    '<div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:6px;">' +
                        '<button class="dev-jump-btn" data-lv="1" style="padding:8px 4px; border-radius:6px; border:none; background:#37474f; color:#fff; font-size:12px; cursor:pointer; font-weight:bold;">Lv.1</button>' +
                        '<button class="dev-jump-btn" data-lv="4" style="padding:8px 4px; border-radius:6px; border:none; background:#00695c; color:#fff; font-size:12px; cursor:pointer; font-weight:bold;">Lv.4 (BaLô)</button>' +
                        '<button class="dev-jump-btn" data-lv="5" style="padding:8px 4px; border-radius:6px; border:none; background:#2e7d32; color:#fff; font-size:12px; cursor:pointer; font-weight:bold;">Lv.5 (Đồ 2)</button>' +
                        '<button class="dev-jump-btn" data-lv="7" style="padding:8px 4px; border-radius:6px; border:none; background:#d84315; color:#fff; font-size:12px; cursor:pointer; font-weight:bold;">Lv.7 (Thùng)</button>' +
                        '<button class="dev-jump-btn" data-lv="8" style="padding:8px 4px; border-radius:6px; border:none; background:#ad1457; color:#fff; font-size:12px; cursor:pointer; font-weight:bold;">Lv.8 (Đồ 3)</button>' +
                        '<button class="dev-jump-btn" data-lv="10" style="padding:8px 4px; border-radius:6px; border:none; background:#4527a0; color:#fff; font-size:12px; cursor:pointer; font-weight:bold;">Lv.10</button>' +
                        '<button class="dev-jump-btn" data-lv="15" style="padding:8px 4px; border-radius:6px; border:none; background:#283593; color:#fff; font-size:12px; cursor:pointer; font-weight:bold;">Lv.15</button>' +
                        '<button class="dev-jump-btn" data-lv="20" style="padding:8px 4px; border-radius:6px; border:none; background:#3e2723; color:#fff; font-size:12px; cursor:pointer; font-weight:bold;">Lv.20</button>' +
                    '</div>' +
                '</div>' +

                // SECTION 3: BƠM TÀI NGUYÊN & TIỆN ÍCH
                '<div style="background:#282830; border-radius:12px; padding:12px;">' +
                    '<div style="font-weight:bold; font-size:14px; color:#b39ddb; margin-bottom:8px;">⚡ CÂN BẰNG TÀI NGUYÊN & TIỆN ÍCH</div>' +
                    '<div style="display:flex; flex-wrap:wrap; gap:6px;">' +
                        '<button id="dev-reset-economy" style="width:100%; padding:9px; border-radius:6px; border:none; background:#2e7d32; color:#fff; font-weight:bold; cursor:pointer; font-size:12px; margin-bottom:4px;">🔄 Đặt Lại Chuẩn (100⚡, 1.000🪙, 10💎)</button>' +
                        '<button id="dev-add-energy" style="flex:1; padding:8px; border-radius:6px; border:none; background:#f57f17; color:#fff; font-weight:bold; cursor:pointer; font-size:12px;">+100 ⚡</button>' +
                        '<button id="dev-add-coins" style="flex:1; padding:8px; border-radius:6px; border:none; background:#fbc02d; color:#000; font-weight:bold; cursor:pointer; font-size:12px;">+2K 🪙</button>' +
                        '<button id="dev-add-gems" style="flex:1; padding:8px; border-radius:6px; border:none; background:#8e24aa; color:#fff; font-weight:bold; cursor:pointer; font-size:12px;">+20 💎</button>' +
                        '<button id="dev-clear-board" style="width:100%; padding:8px; border-radius:6px; border:none; background:#546e7a; color:#fff; font-weight:bold; cursor:pointer; font-size:12px; margin-top:4px;">🧹 Dọn Sạch Đồ Rác Trên Bàn</button>' +
                    '</div>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        // Bind events
        document.getElementById('dev-close-btn').onclick = function () {
            overlay.remove();
        };
        overlay.onclick = function (e) {
            if (e.target === overlay) overlay.remove();
        };

        document.getElementById('dev-bot-toggle-btn').onclick = function () {
            toggleAutoBot();
        };

        overlay.querySelectorAll('.dev-speed-btn').forEach(function (btn) {
            btn.onclick = function () {
                var spd = parseInt(this.getAttribute('data-speed'), 10) || 300;
                autoBotSpeed = spd;
                if (autoBotRunning) startAutoBot(autoBotSpeed);
                if (typeof showToast === 'function') showToast('⚡ Đã đổi tốc độ Bot: ' + autoBotSpeed + 'ms', '#1976d2');
            };
        });

        overlay.querySelectorAll('.dev-jump-btn').forEach(function (btn) {
            btn.onclick = function () {
                var target = parseInt(this.getAttribute('data-lv'), 10) || 1;
                jumpToLevel(target);
                overlay.remove();
            };
        });

        document.getElementById('dev-reset-economy').onclick = function () {
            resetResourcesToStandard();
            overlay.remove();
        };
        document.getElementById('dev-add-energy').onclick = function () { addResources(100, 0, 0); };
        document.getElementById('dev-add-coins').onclick = function () { addResources(0, 2000, 0); };
        document.getElementById('dev-add-gems').onclick = function () { addResources(0, 0, 20); };
        document.getElementById('dev-clear-board').onclick = function () { clearBoardItemsOnly(); };
    }

    // CẬP NHẬT TRẠNG THÁI HIỂN THỊ CỦA NÚT TEST THEO CÀI ĐẶT (TẮT LÀ XÓA TRIỆT ĐỂ KHỎI DOM)
    function updateDevToolVisibility() {
        var show = !!(typeof SAVE !== 'undefined' && SAVE && SAVE.settings && SAVE.settings.showTestTool);
        var btn = document.getElementById('dev-floating-btn');
        var pill = document.getElementById('dev-floating-status');
        var modal = document.getElementById('dev-test-modal-overlay');

        if (!show) {
            if (btn) btn.remove();
            if (pill) pill.remove();
            if (modal) modal.remove();
            if (autoBotRunning) stopAutoBot();
        } else {
            injectFloatingDevButton();
        }
        if (typeof cleanOrphanedFx === 'function') cleanOrphanedFx();
    }

    // TẠO NÚT TRÒN NỔI "🛠️ TEST" Ở GÓC MÀN HÌNH (CHỈ TẠO KHI ĐƯỢC BẬT TRONG CÀI ĐẶT)
    function injectFloatingDevButton() {
        var show = !!(typeof SAVE !== 'undefined' && SAVE && SAVE.settings && SAVE.settings.showTestTool);
        var existingBtn = document.getElementById('dev-floating-btn');
        var existingPill = document.getElementById('dev-floating-status');

        if (!show) {
            if (existingBtn) existingBtn.remove();
            if (existingPill) existingPill.remove();
            var modal = document.getElementById('dev-test-modal-overlay');
            if (modal) modal.remove();
            if (autoBotRunning) stopAutoBot();
            return;
        }

        if (!existingBtn) {
            var btn = document.createElement('button');
            btn.id = 'dev-floating-btn';
            btn.innerHTML = '🛠️ TEST';
            btn.title = 'Bấm để mở Bảng Điều Khiển Test & Bot Tự Chơi';
            btn.style.cssText = 'position:fixed; bottom:72px; right:12px; z-index:99999; display:block; background:linear-gradient(135deg, #2e7d32, #1b5e20); color:#fff; border:2px solid #a5d6a7; border-radius:24px; padding:8px 14px; font-weight:bold; font-size:13px; box-shadow:0 4px 16px rgba(0,0,0,0.4); cursor:pointer; transition:transform 0.15s; font-family:sans-serif;';

            btn.onmouseover = function () { this.style.transform = 'scale(1.08)'; };
            btn.onmouseout = function () { this.style.transform = 'scale(1.0)'; };
            btn.onclick = openDevTestModal;
            document.body.appendChild(btn);
        } else {
            existingBtn.style.display = 'block';
        }

        if (!existingPill) {
            var pill = document.createElement('div');
            pill.id = 'dev-floating-status';
            pill.style.cssText = 'position:fixed; top:8px; left:50%; transform:translateX(-50%); z-index:99999; background:#2e7d32; color:#fff; border-radius:20px; padding:6px 16px; font-weight:bold; font-size:12px; box-shadow:0 4px 12px rgba(0,0,0,0.4); display:' + (autoBotRunning ? 'flex' : 'none') + '; align-items:center; cursor:pointer; font-family:sans-serif;';
            pill.onclick = openDevTestModal;
            document.body.appendChild(pill);
        } else {
            existingPill.style.display = autoBotRunning ? 'flex' : 'none';
        }
    }

    // Export ra window để gọi từ console / script / settings
    window.jumpToLevel = jumpToLevel;
    window.addResources = addResources;
    window.resetResourcesToStandard = resetResourcesToStandard;
    window.clearBoardItemsOnly = clearBoardItemsOnly;
    window.startAutoBot = startAutoBot;
    window.stopAutoBot = stopAutoBot;
    window.toggleAutoBot = toggleAutoBot;
    window.openDevTestModal = openDevTestModal;
    window.updateDevToolVisibility = updateDevToolVisibility;
    window.setDevToolEnabled = function (enabled) {
        if (typeof SAVE !== 'undefined' && SAVE && SAVE.settings) {
            SAVE.settings.showTestTool = !!enabled;
            if (typeof saveGame === 'function') saveGame();
        }
        updateDevToolVisibility();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectFloatingDevButton);
    } else {
        injectFloatingDevButton();
    }
})();
