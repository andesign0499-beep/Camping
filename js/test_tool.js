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
    function getItemLineHelper(id) {
        if (!id) return '';
        return (typeof itemLine === 'function') ? itemLine(id) : String(id).split('_lv')[0];
    }

    function getItemLvHelper(id) {
        if (!id) return 1;
        return (typeof itemLv === 'function') ? itemLv(id) : (parseInt(String(id).split('_lv')[1], 10) || 1);
    }

    // 4.1. Lấy danh sách các đơn hàng thực tế đang còn thiếu (chưa stashed và chưa có sẵn trên bàn cờ)
    function getUnsatisfiedOrders() {
        var needed = [];
        if (typeof SAVE === 'undefined' || !SAVE || !Array.isArray(SAVE.petOrderGroups) || !SAVE.petOrderGroups.length) {
            return needed;
        }
        var group = SAVE.petOrderGroups[0];
        if (!group || group._isDelivering) return needed;

        var available = {};
        if (typeof boardData !== 'undefined' && Array.isArray(boardData)) {
            boardData.forEach(function (c) {
                if (c && c.id && !c.isRock && !c.isLocked && !GENERATORS[c.id]) {
                    available[c.id] = (available[c.id] || 0) + 1;
                }
            });
        }
        if (Array.isArray(group.orders)) {
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

    // 4.2. Phân tích toàn cảnh bàn cờ và đơn hàng hiện tại để quyết định ghép thông minh
    function analyzeBoardForBot() {
        var unlockedCountsById = {};
        var maxWebLvByLine = {};
        var unlockedUnitsByLine = {};
        var emptyCount = 0;

        if (typeof boardData !== 'undefined' && Array.isArray(boardData)) {
            for (var i = 0; i < boardData.length; i++) {
                var c = boardData[i];
                if (!c || !c.id) {
                    emptyCount++;
                    continue;
                }
                if (c.isRock || GENERATORS[c.id]) continue;
                var ln = getItemLineHelper(c.id);
                var lv = getItemLvHelper(c.id);
                if (c.isLocked) {
                    if (lv > (maxWebLvByLine[ln] || 0)) {
                        maxWebLvByLine[ln] = lv;
                    }
                } else {
                    unlockedCountsById[c.id] = (unlockedCountsById[c.id] || 0) + 1;
                    unlockedUnitsByLine[ln] = (unlockedUnitsByLine[ln] || 0) + Math.pow(2, lv - 1);
                }
            }
        }

        var neededCountById = {};
        var maxNeededLvByLine = {};
        var targetLines = new Set();

        if (typeof SAVE !== 'undefined' && SAVE && Array.isArray(SAVE.petOrderGroups) && SAVE.petOrderGroups[0]) {
            var grp = SAVE.petOrderGroups[0];
            (grp.orders || []).forEach(function (o) {
                if (o && o.id && !o.stashed) {
                    neededCountById[o.id] = (neededCountById[o.id] || 0) + 1;
                    var ln = getItemLineHelper(o.id);
                    var lv = getItemLvHelper(o.id);
                    targetLines.add(ln);
                    if (lv > (maxNeededLvByLine[ln] || 0)) {
                        maxNeededLvByLine[ln] = lv;
                    }
                }
            });
        }

        return {
            unlockedCountsById: unlockedCountsById,
            maxWebLvByLine: maxWebLvByLine,
            unlockedUnitsByLine: unlockedUnitsByLine,
            emptyCount: emptyCount,
            neededCountById: neededCountById,
            maxNeededLvByLine: maxNeededLvByLine,
            targetLines: targetLines
        };
    }

    // Kiểm tra xem có được phép tiêu thụ `consumeCount` (1 khi ghép vào nhện, 2 khi ghép 2 ô mở) của `itemId` hay không
    function canConsumeItemsForMerge(itemId, consumeCount, analysis) {
        if (!itemId) return false;
        var info = analysis || analyzeBoardForBot();
        var countOnBoard = info.unlockedCountsById[itemId] || 0;
        var neededNow = info.neededCountById[itemId] || 0;

        // Tuyệt đối không bao giờ ghép làm thiếu số lượng món đang cần trực tiếp cho đơn hiện tại!
        if (countOnBoard - consumeCount < neededNow) {
            return false;
        }

        var ln = getItemLineHelper(itemId);
        var lv = getItemLvHelper(itemId);
        var maxLv = (typeof getItemMaxLevel === 'function') ? getItemMaxLevel(ln) : (ln === 'tham' ? 8 : 12);
        if (lv >= maxLv) return false;

        // Nếu ghép vào ô mạng nhện (consumeCount === 1): luôn cho phép vì không làm giảm cấp mà còn mở khóa ô!
        if (consumeCount === 1) {
            return true;
        }

        // Nếu nhánh này có ô mạng nhện ở cấp cao hơn (lv < maxWebLvByLine[ln]), cho phép ghép lên để phá nhện
        if ((info.maxWebLvByLine[ln] || 0) > lv) {
            return true;
        }

        // Nếu thuộc nhánh đơn hàng hiện tại đang cần:
        if (info.targetLines.has(ln)) {
            var targetLv = info.maxNeededLvByLine[ln] || 2;
            if (lv < targetLv) {
                return true; // Ghép tích cực từ cấp thấp lên tới đúng cấp đơn hàng yêu cầu
            }
            // Nếu đã bằng hoặc vượt cấp đơn hàng: cho phép ghép tiếp khi có từ 2 món trở lên ngoài số lượng đang cần để gom gọn ô
            return (countOnBoard - neededNow >= 2);
        }

        // Nếu thuộc nhánh phụ (chưa có trong đơn hiện tại):
        // Cho phép ghép dồn tự do khi có từ 2 món trở lên (đặc biệt ở cấp < 7) để giải phóng ô cờ tối đa,
        // không bao giờ để tồn đọng hàng loạt món trùng lặp chiếm diện tích bàn cờ!
        if (lv < 7) {
            return countOnBoard >= 2;
        }
        return (countOnBoard >= 3) || (info.emptyCount <= 10);
    }

    // Kiểm tra xem ô `cellIdx` có nằm cạnh ô đá (isRock) để ưu tiên phá băng/mở đá hay không
    function hasAdjacentRock(cellIdx) {
        if (typeof boardData === 'undefined' || !Array.isArray(boardData)) return false;
        var cols = 7;
        var r = Math.floor(cellIdx / cols);
        var c = cellIdx % cols;
        var dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (var d = 0; d < dirs.length; d++) {
            var nr = r + dirs[d][0];
            var nc = c + dirs[d][1];
            if (nr >= 0 && nr < 9 && nc >= 0 && nc < cols) {
                var nCell = boardData[nr * cols + nc];
                if (nCell && nCell.isRock) return true;
            }
        }
        return false;
    }

    // 4.3. Tìm ô đồ rác tối ưu nhất để bán giải phóng chỗ trống khi bàn cờ bị đầy
    // Tuyệt đối bảo vệ nguyên liệu đang ghép cho đơn hàng hiện tại
    function findBestTrashItemToSell() {
        if (typeof boardData === 'undefined' || !Array.isArray(boardData)) return -1;
        var info = analyzeBoardForBot();

        var bestIdx = -1;
        var bestScore = Infinity;

        for (var idx = 0; idx < boardData.length; idx++) {
            var c = boardData[idx];
            if (!c || !c.id || c.isRock || c.isLocked || GENERATORS[c.id]) continue;
            var ln = getItemLineHelper(c.id);
            var lv = getItemLvHelper(c.id);

            // Điểm càng thấp càng ưu tiên bán trước
            var score = lv * 10;

            // 1. Bảo vệ tuyệt đối vật phẩm khớp trực tiếp với đơn hàng đang cần
            if ((info.neededCountById[c.id] || 0) > 0) {
                score += 100000;
            }
            // 2. Bảo vệ nguyên liệu cấp thấp thuộc nhánh đơn hàng đang cần ghép
            else if (info.targetLines.has(ln) && lv < (info.maxNeededLvByLine[ln] || 2)) {
                score += 10000 + (lv * 100);
            }
            // 3. Bảo vệ vật phẩm đã chuẩn bị đúng cấp prepLv cho nhiệm vụ kế tiếp của Slot 1
            else {
                var prepLv = (typeof SAVE !== 'undefined' && SAVE && SAVE.slot1BranchLevelMap && typeof SAVE.slot1BranchLevelMap[ln] === 'number')
                    ? (SAVE.slot1BranchLevelMap[ln] + 1)
                    : 2;
                if (lv === prepLv && (info.unlockedCountsById[c.id] || 0) === 1) {
                    score += 500;
                }
            }

            if (score < bestScore) {
                bestScore = score;
                bestIdx = idx;
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

    // 4.5. LOGIC CHÍNH CỦA BOT TỰ ĐỘNG CHƠI (AUTO-BOT ENGINE THÔNG MINH v2)
    function botStep() {
        if (!autoBotRunning) return;
        if (typeof boardData === 'undefined' || !boardData.length) return;
        if (typeof SAVE === 'undefined' || !SAVE || !Array.isArray(SAVE.petOrderGroups) || !SAVE.petOrderGroups.length) return;

        var activeGroup = SAVE.petOrderGroups[0];
        if (!activeGroup || activeGroup._isDelivering) return;

        // BƯỚC 0: TỰ ĐỘNG NẠP THÊM NĂNG LƯỢNG KHI HẾT (AUTO-REFILL CHO BOT)
        // Đảm bảo bot luôn có năng lượng dồi dào chơi liên tục, không bị ngắt quãng hoặc bị popup cửa hàng chặn lại
        if (typeof playerEnergy !== 'undefined' && playerEnergy < 30) {
            playerEnergy = (playerEnergy || 0) + 100;
            if (typeof SAVE !== 'undefined' && SAVE) SAVE.energy = playerEnergy;
            if (typeof updateUIStats === 'function') updateUIStats();
            if (typeof closeModal === 'function') closeModal();
            var modalEl0 = document.getElementById('modal-overlay');
            if (modalEl0) modalEl0.remove();
        }

        // BƯỚC 1: TỰ ĐỘNG CẤT NGAY VẬT PHẨM ĐÃ HOÀN THÀNH LÊN KHAY ĐƠN HÀNG (STASH)
        // Giúp giải phóng ô cờ tức thì và tránh tuyệt đối việc ghép nhầm hoặc bán nhầm món đã xong!
        if (Array.isArray(activeGroup.orders)) {
            for (var oi = 0; oi < activeGroup.orders.length; oi++) {
                var ord = activeGroup.orders[oi];
                if (ord && ord.id && !ord.stashed) {
                    var matchIdx = -1;
                    for (var bi = 0; bi < boardData.length; bi++) {
                        var cell = boardData[bi];
                        if (cell && cell.id === ord.id && !cell.isRock && !cell.isLocked) {
                            matchIdx = bi;
                            break;
                        }
                    }
                    if (matchIdx !== -1 && typeof handleCellDoubleClick === 'function') {
                        handleCellDoubleClick(matchIdx);
                        return; // Cất món xong lập tức nhường lượt để state và khay được cập nhật an toàn
                    }
                }
            }
        }

        // BƯỚC 2: TỰ ĐỘNG GIAO ĐƠN HÀNG KHI TẤT CẢ CÁC MÓN TRONG NHÓM ĐÃ ĐỦ
        var allStashed = Array.isArray(activeGroup.orders) && activeGroup.orders.length > 0 &&
            activeGroup.orders.every(function (o) { return o && o.stashed; });
        var unsatisfied = getUnsatisfiedOrders();

        if ((allStashed || unsatisfied.length === 0) && !activeGroup._isDelivering) {
            if (typeof deliverPetOrderGroup === 'function') {
                deliverPetOrderGroup(0);
                autoBotStats.ordersDelivered++;
                updateBotStatusUI();
                return;
            }
        }

        // BƯỚC 3: TỰ ĐỘNG PHÁT HIỆN VÀ LÔI MÁY PHÁT MỚI VÀO BÀN CỜ (CẤP 4: BA LÔ, CẤP 7: THÙNG ĐỒ)
        if (checkAndPlacePendingGenerators()) {
            return;
        }

        // BƯỚC 4: GHÉP ĐỒ THÔNG MINH THEO THỨ TỰ ƯU TIÊN CHIẾN THUẬT
        var analysis = analyzeBoardForBot();

        // 4.1. Ưu tiên số 1: Ghép mở khóa ô mạng nhện (c1 tự do + c2 bị khóa mạng nhện)
        // Sắp xếp ưu tiên: Ô nhện sát đá -> Nhánh đơn hàng đang cần -> Cấp độ cao nhất trước
        var webMerges = [];
        for (var i = 0; i < boardData.length; i++) {
            var c1 = boardData[i];
            if (!c1 || !c1.id || c1.isRock || c1.isLocked || GENERATORS[c1.id]) continue;
            if (!canConsumeItemsForMerge(c1.id, 1, analysis)) continue;

            for (var j = 0; j < boardData.length; j++) {
                if (i === j) continue;
                var c2 = boardData[j];
                if (!c2 || !c2.id || c2.isRock || GENERATORS[c2.id]) continue;
                if (c2.isLocked && c2.id === c1.id) {
                    var lnW = getItemLineHelper(c1.id);
                    var lvW = getItemLvHelper(c1.id);
                    var adjRock = hasAdjacentRock(j) ? 1 : 0;
                    var isTarget = analysis.targetLines.has(lnW) ? 1 : 0;
                    webMerges.push({
                        from: i,
                        to: j,
                        score: (adjRock * 1000) + (isTarget * 200) + (lvW * 10)
                    });
                }
            }
        }
        if (webMerges.length > 0) {
            webMerges.sort(function (a, b) { return b.score - a.score; });
            var resW = executeMoveAndEffects(webMerges[0].from, webMerges[0].to);
            if (!resW || resW.type === 'merge') {
                autoBotStats.merges++;
            }
            updateBotStatusUI();
            return;
        }

        // 4.2. Thu thập tất cả các cặp ô tự do có thể ghép hợp lệ và phân loại ưu tiên:
        // - Nhóm A (type 1): Nhánh mục tiêu của đơn hàng hiện tại (lv < maxNeededLv) -> Ghép từ cấp thấp nhất lên cao (Lv.1 -> Lv.2 -> Lv.3...)
        // - Nhóm B (type 2): Nhánh có ô mạng nhện cấp cao hơn đang chờ trên bàn (lv < maxWebLv) -> Ghép bắc cầu để phá nhện
        // - Nhóm C (type 3): Ghép thu gọn bàn cờ & dọn sạch đồ trùng lặp -> Ghép từ cấp thấp nhất lên
        var freeMerges = [];
        for (var m1 = 0; m1 < boardData.length; m1++) {
            var item1 = boardData[m1];
            if (!item1 || !item1.id || item1.isRock || item1.isLocked || GENERATORS[item1.id]) continue;
            if (!canConsumeItemsForMerge(item1.id, 2, analysis)) continue;

            for (var m2 = m1 + 1; m2 < boardData.length; m2++) {
                var item2 = boardData[m2];
                if (!item2 || !item2.id || item2.isRock || item2.isLocked || GENERATORS[item2.id]) continue;
                if (item2.id === item1.id) {
                    var lnM = getItemLineHelper(item1.id);
                    var lvM = getItemLvHelper(item1.id);
                    var priorityGroup = 3;
                    if (analysis.targetLines.has(lnM) && lvM < (analysis.maxNeededLvByLine[lnM] || 2)) {
                        priorityGroup = 1;
                    } else if (lvM < (analysis.maxWebLvByLine[lnM] || 0)) {
                        priorityGroup = 2;
                    }
                    freeMerges.push({
                        from: m1,
                        to: m2,
                        priorityGroup: priorityGroup,
                        lv: lvM
                    });
                    break; // Đã tìm được cặp cho m1
                }
            }
        }

        if (freeMerges.length > 0) {
            freeMerges.sort(function (a, b) {
                if (a.priorityGroup !== b.priorityGroup) return a.priorityGroup - b.priorityGroup;
                // Luôn ghép từ cấp thấp nhất (Lv.1 -> Lv.2 -> Lv.3) để dồn chuỗi gọn gàng, không để sót đồ lẻ
                return a.lv - b.lv;
            });
            var resF = executeMoveAndEffects(freeMerges[0].from, freeMerges[0].to);
            if (!resF || resF.type === 'merge') {
                autoBotStats.merges++;
            }
            updateBotStatusUI();
            return;
        }

        // BƯỚC 5: BẤM MÁY PHÁT ĐỂ SINH ĐỒ
        // 5.1. Kiểm tra ô trống trên bàn cờ; nếu đầy và không còn cặp ghép thì bán món đồ rác ít giá trị nhất
        var empties = (typeof getEmptyIndexes === 'function') ? getEmptyIndexes(boardData) : [];
        if (!empties.length) {
            var sellIdx = findBestTrashItemToSell();
            if (sellIdx !== -1 && typeof sellItemAtIndex === 'function') {
                sellItemAtIndex(sellIdx);
                return;
            }
        }

        // 5.2. Tự nạp năng lượng khi sắp hết trước khi bấm máy phát
        if (typeof playerEnergy !== 'undefined' && playerEnergy <= 10) {
            playerEnergy = (playerEnergy || 0) + 100;
            if (SAVE) SAVE.energy = playerEnergy;
            if (typeof updateUIStats === 'function') updateUIStats();
            if (typeof closeModal === 'function') closeModal();
            var modalEl2 = document.getElementById('modal-overlay');
            if (modalEl2) modalEl2.remove();
        }

        // 5.3. Chọn máy phát thông minh: Ưu tiên hoàn thành món đơn hàng nào cần ÍT năng lượng/đơn vị còn thiếu nhất trước
        // để nhanh chóng cất món đó lên khay, giải phóng tối đa mặt bằng cho món khó!
        var targetGen = 'generator_cooler';
        if (unsatisfied.length > 0) {
            var sortedUnsatisfied = unsatisfied.slice().sort(function (oA, oB) {
                var lnA = getItemLineHelper(oA.id);
                var lvA = getItemLvHelper(oA.id);
                var lnB = getItemLineHelper(oB.id);
                var lvB = getItemLvHelper(oB.id);

                var reqA = Math.pow(2, lvA - 1) - (analysis.unlockedUnitsByLine[lnA] || 0);
                var reqB = Math.pow(2, lvB - 1) - (analysis.unlockedUnitsByLine[lnB] || 0);
                return reqA - reqB;
            });

            var bestMissing = sortedUnsatisfied[0];
            var fLine = getItemLineHelper(bestMissing.id);
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
                // Đóng trạm năng lượng nếu vô tình mở ra
                var modalEl3 = document.getElementById('modal-overlay');
                if (modalEl3) {
                    if (typeof closeModal === 'function') closeModal();
                    else modalEl3.remove();
                }
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
