// =============================================================================
// CẤU HÌNH THÔNG SỐ & CÂN BẰNG KINH TẾ TRÒ CHƠI (GAME BALANCE CONFIG)
// Hỗ trợ sinh tự động 120 Level hiện tại và mở rộng vô hạn trong tương lai.
// =============================================================================

// Bộ hàm địa hình tự nhiên bất đối xứng (tránh hoàn toàn kiểu sắp xếp đều 5x5, 5x6, 5x7)
var ORGANIC_BOARD_PATTERNS = {
    creek_bend: function (r, c) { return (r === 0 || r === 8 || (r === 1 && (c <= 1 || c >= 5)) || (r === 2 && (c === 0 || c === 6)) || (r === 3 && c === 0) || (r === 5 && c === 6) || (r === 6 && (c === 0 || c === 6)) || (r === 7 && (c <= 1 || c >= 5)) || (r === 2 && c === 4) || (r === 6 && c === 2)); },
    pine_alcove: function (r, c) { return ((r === 0 && c !== 3) || (r === 8 && c !== 3) || (r === 1 && (c === 0 || c >= 5)) || (r === 2 && c === 6) || (r === 3 && c === 1) || (r === 4 && (c === 0 || c === 6)) || (r === 5 && c === 5) || (r === 6 && c === 0) || (r === 7 && (c <= 1 || c >= 6))); },
    stepping_glade: function (r, c) { return ((r === 0 && (c <= 2 || c >= 5)) || (r === 1 && (c <= 1 || c === 6)) || (r === 2 && c === 0) || (r === 6 && c === 6) || (r === 7 && (c === 0 || c >= 5)) || (r === 8 && (c <= 1 || c >= 4)) || (r === 3 && c === 5) || (r === 5 && c === 1)); },
    boulder_trail: function (r, c) { return ((r === 0 && c !== 2 && c !== 3) || (r === 8 && c !== 3 && c !== 4) || (c === 0 && (r <= 2 || r >= 6)) || (c === 6 && (r <= 2 || r >= 6)) || (r === 2 && c === 2) || (r === 4 && c === 5) || (r === 6 && c === 4)); },
    zigzag: function (r, c) { return ((r === 0 && c <= 4) || (r === 1 && c <= 1) || (r === 3 && c === 6) || (r === 4 && c === 0) || (r === 5 && c === 6) || (r === 7 && c >= 5) || (r === 8 && c >= 2) || (r === 2 && c === 4) || (r === 6 && c === 2)); },
    cross: function (r, c) { return (((r <= 1 || r >= 7) && (c <= 1 || c >= 5)) || (r === 0 && c === 3) || (r === 8 && c === 3) || (r === 3 && c === 1) || (r === 5 && c === 5)); },
    hourglass: function (r, c) { return ((r === 0 && c !== 3) || (r === 8 && c !== 3) || (r >= 3 && r <= 5 && (c === 0 || c === 6)) || (r === 4 && (c === 1 || c === 5)) || (r === 1 && c === 0) || (r === 7 && c === 6)); },
    pillars: function (r, c) { return ((r === 0 && (c <= 1 || c >= 5)) || (r === 8 && (c <= 1 || c >= 5)) || ((r === 2 || r === 6) && (c === 2 || c === 4)) || (r === 4 && (c === 0 || c === 6))); },
    valley: function (r, c) { return ((c === 0 && r !== 3 && r !== 4) || (c === 6 && r !== 4 && r !== 5) || (r === 0 && (c <= 2 || c >= 5)) || (r === 8 && (c <= 1 || c >= 4)) || (r === 2 && c === 4) || (r === 6 && c === 2)); },
    islands: function (r, c) { return ((r === 0 && c !== 2) || (r === 8 && c !== 4) || (r === 4 && c !== 2 && c !== 4) || (r === 2 && c === 0) || (r === 6 && c === 6)); },
    fortress: function (r, c) { return ((r === 0 && c !== 3) || (r === 8 && c !== 3) || (c === 0 && r !== 4) || (c === 6 && r !== 4) || (r === 2 && c === 2) || (r === 6 && c === 4) || (r === 4 && c === 3)); },
    open: function (r, c) { return (((r === 0 || r === 8) && (c <= 1 || c >= 5)) || ((r === 1 || r === 7) && (c === 0 || c === 6)) || (r === 2 && c === 1) || (r === 6 && c === 5) || (r === 3 && c === 5) || (r === 5 && c === 1)); }
};

var ORGANIC_PATTERN_NAMES = [
    'creek_bend', 'pine_alcove', 'stepping_glade', 'boulder_trail',
    'zigzag', 'cross', 'hourglass', 'pillars', 'valley', 'islands', 'fortress', 'open'
];

var GENERATOR_POOLS = {
    'generator_backpack': ['an', 'cafe', 'congcu'],
    'generator_cooler': ['ban', 'ghe', 'trai'],
    'generator_crate': ['tham', 'antoan', 'bep']
};

var ALL_GENERATOR_IDS = ['generator_backpack', 'generator_cooler', 'generator_crate'];

// =============================================================================
// CÔNG THỨC PHÂN BỔ Ô TRỐNG TĂNG DẦN THEO MẠCH TIẾN TRÌNH NHIỆM VỤ
// Đảm bảo số ô trống tăng mượt mà, người chơi bắt đầu với khu vực tinh gọn (16 ô)
// và mở rộng dần không gian bàn chơi theo số lượng và độ phức tạp của đơn hàng.
// =============================================================================
function getTargetEmptyCells(lvNum, orderCount) {
    if (lvNum === 1) return 16;
    if (lvNum === 2) return 17;
    if (lvNum <= 5) return 19 + (lvNum - 3) * 2; // Lv 3: 19, Lv 4: 21, Lv 5: 23
    if (lvNum <= 12) return Math.min(30, 25 + Math.floor((lvNum - 6) * 5 / 6)); // Lv 6..12: 25..30
    if (lvNum <= 24) return Math.min(34, 31 + Math.floor((lvNum - 13) * 3 / 11)); // Lv 13..24: 31..34
    if (lvNum <= 40) return Math.min(38, 35 + Math.floor((lvNum - 25) * 3 / 15)); // Lv 25..40: 35..38
    if (lvNum <= 60) return Math.min(42, 39 + Math.floor((lvNum - 41) * 3 / 19)); // Lv 41..60: 39..42
    if (lvNum <= 85) return Math.min(45, 43 + Math.floor((lvNum - 61) * 2 / 24)); // Lv 61..85: 43..45
    if (lvNum <= 105) return Math.min(47, 46 + Math.floor((lvNum - 86) * 1 / 19)); // Lv 86..105: 46..47
    return Math.min(49, 48 + Math.floor((lvNum - 106) * 1 / 14)); // Lv 106..120+: 48..49
}

// =============================================================================
// HÀM KHẮC TẠO ĐÁ TỰ NHIÊN BẤT ĐỐI XỨNG THEO ĐÚNG SỐ LƯỢNG ĐÁ MỤC TIÊU (ROCK MASK)
// - Giữ nguyên nét đặc trưng của từng địa hình tự nhiên (creek, alcove, trail...).
// - Luôn bảo vệ 100% vùng trung tâm chơi game (r: 3..5, c: 2..4).
// - Kiểm tra BFS flood-fill đảm bảo toàn bộ ô trống liên thông hoàn toàn (không bị cô lập).
// =============================================================================
function generateOrganicRockMask(patternName, patFn, targetRocks, rng) {
    targetRocks = Math.max(2, Math.min(42, targetRocks));
    var scores = [];
    for (var idx = 0; idx < 63; idx++) {
        var r = Math.floor(idx / 7);
        var c = idx % 7;

        // Vùng lõi trung tâm chơi cờ tuyệt đối an toàn, không bao giờ sinh đá
        if (r >= 3 && r <= 5 && c >= 2 && c <= 4) {
            scores.push({ idx: idx, score: -99999 });
            continue;
        }

        var score = 0;
        // 1. Dấu ấn địa hình tự nhiên gốc
        if (patFn && patFn(r, c)) {
            score += 35;
        }

        // 2. Khoảng cách xa tâm (ưu tiên đá viền ngoài và các góc)
        var distFromCenter = Math.abs(r - 4) + Math.abs(c - 3);
        score += distFromCenter * 5;

        // 3. Ưu tiên mép cạnh và 4 góc bàn chơi
        if (r === 0 || r === 8) score += 12;
        if (c === 0 || c === 6) score += 10;
        if ((r === 0 || r === 8) && (c === 0 || c === 6)) score += 15;
        if ((r <= 1 || r >= 7) && (c <= 1 || c >= 5)) score += 8;

        // 4. Độ gồ ghề bất đối xứng ngẫu nhiên tất định
        score += (rng() * 4 - 2);
        scores.push({ idx: idx, score: score });
    }

    scores.sort(function (a, b) { return b.score - a.score; });
    var rockSet = new Set(scores.slice(0, targetRocks).map(function (s) { return s.idx; }));

    // 5. Bảo đảm tính liên thông của các ô trống (không để bất kỳ ô trống đơn lẻ nào bị cô lập giữa đá)
    while (true) {
        var visited = new Set();
        var queue = [31]; // Ô trung tâm (4, 3)
        visited.add(31);
        while (queue.length > 0) {
            var curr = queue.shift();
            var cr = Math.floor(curr / 7), cc = curr % 7;
            var neighbors = [];
            if (cr > 0) neighbors.push(curr - 7);
            if (cr < 8) neighbors.push(curr + 7);
            if (cc > 0) neighbors.push(curr - 1);
            if (cc < 6) neighbors.push(curr + 1);
            for (var ni = 0; ni < neighbors.length; ni++) {
                var n = neighbors[ni];
                if (!rockSet.has(n) && !visited.has(n)) {
                    visited.add(n);
                    queue.push(n);
                }
            }
        }

        var disconnected = [];
        for (var i = 0; i < 63; i++) {
            if (!rockSet.has(i) && !visited.has(i)) {
                disconnected.push(i);
            }
        }
        if (disconnected.length === 0) break;

        // Biến các ô cô lập thành đá
        for (var di = 0; di < disconnected.length; di++) {
            rockSet.add(disconnected[di]);
        }

        // Bù trừ un-rock lại các ô đá gần vùng mở và gần tâm nhất để giữ đúng targetRocks
        while (rockSet.size > targetRocks) {
            var bestCand = -1, bestDist = 999;
            rockSet.forEach(function (rk) {
                var rr = Math.floor(rk / 7), rc = rk % 7;
                var bordersVisited = (rr > 0 && visited.has(rk - 7)) ||
                                     (rr < 8 && visited.has(rk + 7)) ||
                                     (rc > 0 && visited.has(rk - 1)) ||
                                     (rc < 6 && visited.has(rk + 1));
                if (bordersVisited) {
                    var d = Math.abs(rr - 4) + Math.abs(rc - 3);
                    if (d < bestDist) {
                        bestDist = d;
                        bestCand = rk;
                    }
                }
            });
            if (bestCand !== -1) {
                rockSet.delete(bestCand);
                visited.add(bestCand);
            } else {
                break;
            }
        }
    }

    var rockArr = [];
    rockSet.forEach(function (idx) { rockArr.push(idx); });
    rockArr.sort(function (a, b) { return a - b; });
    return rockArr;
}

// =============================================================================
// CÔNG THỨC SINH LEVEL TỰ ĐỘNG (PROCEDURAL LEVEL GENERATOR: LV.1 -> 120 & VÔ HẠN)
// - Tăng dần số lượng nhiệm vụ cần chế tạo (từ 2 -> 10+ nhiệm vụ).
// - Sắp xếp đá, nguồn phát, mạng nhện và đồ mồi theo địa hình tự nhiên bất đối xứng.
// - Không sử dụng tên level.
// =============================================================================
function generateLevelConfig(lvNum) {
    lvNum = Math.max(1, parseInt(lvNum, 10) || 1);

    // Bộ sinh số giả ngẫu nhiên tất định theo seed lvNum (luôn cho ra cùng 1 màn cố định cho mỗi số lvNum)
    var seed = ((lvNum * 2654435761) ^ 0x9E3779B9) >>> 0;
    function rng() {
        seed = (seed + 0x6D2B79F5) >>> 0;
        var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    // 1. Chọn địa hình bất đối xứng (không bao giờ trùng địa hình với màn liền trước)
    var patIdx;
    if (lvNum <= 6) {
        patIdx = lvNum - 1;
    } else {
        patIdx = (lvNum * 5 + Math.floor(lvNum / 4)) % ORGANIC_PATTERN_NAMES.length;
        var prevIdx = ((lvNum - 1) <= 6)
            ? (lvNum - 2)
            : (((lvNum - 1) * 5 + Math.floor((lvNum - 1) / 4)) % ORGANIC_PATTERN_NAMES.length);
        if (patIdx === prevIdx) {
            patIdx = (patIdx + 1) % ORGANIC_PATTERN_NAMES.length;
        }
    }
    var patternName = ORGANIC_PATTERN_NAMES[patIdx];
    var patFn = ORGANIC_BOARD_PATTERNS[patternName] || ORGANIC_BOARD_PATTERNS.creek_bend;

    // 2. Chọn số lượng và chủng loại nguồn phát (Generators)
    var chosenGenIds = [];
    if (lvNum === 1) {
        chosenGenIds = ['generator_backpack'];
    } else if (lvNum === 2) {
        chosenGenIds = ['generator_cooler'];
    } else if (lvNum === 3) {
        chosenGenIds = ['generator_crate'];
    } else if (lvNum === 5 || lvNum % 4 === 0 || lvNum % 5 === 0 || lvNum >= 36) {
        chosenGenIds = ['generator_cooler', 'generator_backpack', 'generator_crate'];
    } else {
        var g1 = ALL_GENERATOR_IDS[lvNum % 3];
        var g2 = ALL_GENERATOR_IDS[(lvNum + 1) % 3];
        chosenGenIds = [g1, g2];
    }

    // Thu thập các nhánh vật phẩm khả dụng từ nguồn phát của màn
    var availLines = [];
    chosenGenIds.forEach(function (gId) {
        (GENERATOR_POOLS[gId] || []).forEach(function (line) {
            if (availLines.indexOf(line) === -1) availLines.push(line);
        });
    });

    // 3. Công thức số lượng nhiệm vụ (tăng dần từ 2 lên 10+ nhiệm vụ; bàn chơi hiển thị tối đa 4, ẩn phần còn lại)
    var orderCount;
    if (lvNum <= 2) orderCount = 2;
    else if (lvNum <= 5) orderCount = 3;
    else if (lvNum <= 12) orderCount = 4;
    else if (lvNum <= 24) orderCount = 5;
    else if (lvNum <= 40) orderCount = 6;
    else if (lvNum <= 60) orderCount = 7;
    else if (lvNum <= 85) orderCount = 8;
    else if (lvNum <= 105) orderCount = 9;
    else if (lvNum <= 120) orderCount = 10;
    else orderCount = 10 + Math.floor((lvNum - 120) / 20);

    // Cấp độ vật phẩm chủ đạo theo tiến trình
    var leadLv;
    if (lvNum <= 4) leadLv = 4;
    else if (lvNum <= 12) leadLv = 5;
    else if (lvNum <= 25) leadLv = 6;
    else if (lvNum <= 35) leadLv = 7;
    else leadLv = (lvNum <= 45 || lvNum % 2 === 0 || lvNum % 5 === 0) ? 8 : 7;

    var secLv = Math.max(3, leadLv - 1);
    var thirdLv = lvNum <= 4 ? 3 : Math.max(3, leadLv - 2);

    var orders = [];
    if (lvNum === 1) {
        orders = ['an_lv4', 'cafe_lv3'];
    } else if (lvNum === 2) {
        orders = ['trai_lv4', 'ghe_lv3'];
    } else {
        var queueLvPattern = [3, 4, Math.min(5, leadLv - 1), 3, 4, Math.min(5, leadLv - 1)];
        for (var k = 0; k < orderCount; k++) {
            var targetLv;
            if (k === 0) targetLv = leadLv;
            else if (k === 1) targetLv = secLv;
            else if (k === 2) targetLv = thirdLv;
            else targetLv = queueLvPattern[(k - 3 + lvNum) % queueLvPattern.length];

            var lineIdx = (lvNum * 4 + k * 2 + Math.floor(k / availLines.length)) % availLines.length;
            var line = availLines[lineIdx];
            var candidate = line + '_lv' + targetLv;

            // Tránh trùng lặp y hệt đơn hàng liền kề
            var tries = 0;
            while (orders.indexOf(candidate) !== -1 && tries < availLines.length * 3) {
                tries++;
                line = availLines[(lineIdx + tries) % availLines.length];
                var altLv = targetLv;
                if (tries >= availLines.length) {
                    altLv = Math.max(2, Math.min(leadLv, targetLv - 1 + (tries % 2)));
                }
                candidate = line + '_lv' + altLv;
            }
            orders.push(candidate);
        }
    }

    // 4. Tạo danh sách vật phẩm hỗ trợ trong Mạng Nhện (webList) và Đồ Mồi Tự Do (freeList)
    var webList = [];
    var freeList = [];

    if (lvNum === 1) {
        freeList = ['an_lv1', 'cafe_lv1'];
        webList = ['an_lv1', 'cafe_lv1', 'cafe_lv1', 'an_lv2'];
    } else if (lvNum === 2) {
        freeList = ['trai_lv1', 'ghe_lv1'];
        webList = ['trai_lv1', 'ghe_lv1', 'ghe_lv1', 'trai_lv2'];
    } else if (lvNum <= 4) {
        var l0 = orders[0].split('_lv')[0];
        var l1 = orders[1].split('_lv')[0];
        var l2 = orders[2].split('_lv')[0];
        freeList = [l0 + '_lv1', l1 + '_lv1'];
        webList = [l0 + '_lv1', l0 + '_lv2', l1 + '_lv1', l1 + '_lv2', l2 + '_lv1', l2 + '_lv2'];
    } else {
        orders.forEach(function (ordId, oIdx) {
            var oLine = ordId.split('_lv')[0];
            var oLv = parseInt(ordId.split('_lv')[1], 10) || 3;

            if (oIdx === 0) {
                var fLv0 = (oLv >= 5) ? 2 : 1;
                var wLv0 = Math.max(1, oLv - 2);
                freeList.push(oLine + '_lv' + fLv0);
                webList.push(oLine + '_lv' + wLv0);
                webList.push(oLine + '_lv' + wLv0);
                if (oLv >= 6) {
                    webList.push(oLine + '_lv' + Math.max(1, oLv - 3));
                }
            } else if (oIdx === 1) {
                var fLv1 = 1;
                var wLv1 = Math.max(1, oLv - 2);
                freeList.push(oLine + '_lv' + fLv1);
                webList.push(oLine + '_lv' + wLv1);
                webList.push(oLine + '_lv' + wLv1);
            } else if (oIdx === 2) {
                var wLv2 = Math.max(1, oLv - 1);
                webList.push(oLine + '_lv' + wLv2);
                if (freeList.length < 3) {
                    freeList.push(oLine + '_lv1');
                }
            } else if (webList.length < 13) {
                // Trợ lực 50% cho các đơn hàng trong hàng đợi để nhịp độ mở khóa đơn mới luôn hào hứng
                var qSub = Math.max(1, oLv - 1);
                webList.push(oLine + '_lv' + qSub);
            }
        });

        // BẢO VỆ TUYỆT ĐỐI: Đồ mồi tự do (freeList) chỉ là vật phẩm cấp thấp (Lv.1 - Lv.2) để người chơi có mồi ghép,
        // TUYỆT ĐỐI KHÔNG BAO GIỜ trùng với bất kỳ đơn hàng nhiệm vụ nào (tránh việc vừa vào ván đã có sẵn đồ nộp ngay).
        for (var fi = 0; fi < freeList.length; fi++) {
            var fLine = freeList[fi].split('_lv')[0];
            var fLv = parseInt(freeList[fi].split('_lv')[1], 10) || 1;
            if (fLv >= 3 || orders.indexOf(freeList[fi]) !== -1) {
                freeList[fi] = fLine + '_lv1';
            }
        }
    }

    // Giới hạn hợp lý số lượng mạng nhện để không gian bàn cờ mở rộng thoáng đãng ở các level cao
    var maxWebs = (lvNum <= 2) ? 4 : (lvNum <= 4 ? 6 : Math.min(6, 4 + Math.floor(orderCount / 3)));
    if (webList.length > maxWebs) {
        webList = webList.slice(0, maxWebs);
    }

    // 5. Xác định số ô trống tăng dần và tạo mặt nạ đá tự nhiên (Rock Mask)
    var targetEmpty = getTargetEmptyCells(lvNum, orderCount);
    var targetRocks = Math.max(2, Math.min(42, 63 - (targetEmpty + chosenGenIds.length + webList.length + freeList.length)));
    var rocks = generateOrganicRockMask(patternName, patFn, targetRocks, rng);
    var rockSet = new Set(rocks);

    var openCells = [];
    var isOpenMap = {};
    for (var idx = 0; idx < 63; idx++) {
        if (!rockSet.has(idx)) {
            openCells.push(idx);
            isOpenMap[idx] = true;
        }
    }

    function getNeighbors(cellIdx) {
        var row = Math.floor(cellIdx / 7), col = cellIdx % 7;
        var out = [];
        if (row > 0) out.push((row - 1) * 7 + col);
        if (row < 8) out.push((row + 1) * 7 + col);
        if (col > 0) out.push(row * 7 + (col - 1));
        if (col < 6) out.push(row * 7 + (col + 1));
        return out;
    }

    // Đặt vị trí nguồn phát theo bố cục lệch tự nhiên (tránh xếp hàng ngang cứng nhắc)
    var genFormations1 = [[31], [24], [38], [30], [32]];
    var genFormations2 = [[23, 39], [25, 37], [17, 45], [24, 37], [30, 25], [23, 32]];
    var genFormations3 = [[24, 30, 32], [23, 31, 39], [23, 25, 38], [17, 31, 45], [24, 37, 39], [25, 30, 38]];

    var rawGenPos = chosenGenIds.length === 1
        ? genFormations1[lvNum % genFormations1.length]
        : (chosenGenIds.length === 2
            ? genFormations2[lvNum % genFormations2.length]
            : genFormations3[lvNum % genFormations3.length]);

    var usedCells = {};
    var generators = [];
    rawGenPos.forEach(function (preferredIdx, gIdx) {
        var finalIdx = preferredIdx;
        if (!isOpenMap[finalIdx] || usedCells[finalIdx]) {
            // Tìm ô trống gần tâm (4,3) nhất
            var bestDist = 999;
            openCells.forEach(function (cand) {
                if (usedCells[cand]) return;
                var cr = Math.floor(cand / 7), cc = cand % 7;
                var d = Math.abs(cr - 4) + Math.abs(cc - 3);
                if (d < bestDist) {
                    bestDist = d;
                    finalIdx = cand;
                }
            });
        }
        usedCells[finalIdx] = true;
        generators.push([finalIdx, chosenGenIds[gIdx]]);
    });

    // 6. Đặt vị trí Mạng Nhện và Đồ Mồi theo cụm tự nhiên bất đối xứng (tránh xếp hàng đều đặn)
    // Giữ tối thiểu 2 ô trống sát nguồn phát để nguồn phát luôn thông thoáng
    var reservedBreathing = {};
    generators.forEach(function (g) {
        var gNeighbors = getNeighbors(g[0]).filter(function (nIdx) {
            return isOpenMap[nIdx] && !usedCells[nIdx];
        });
        gNeighbors.sort(function () { return rng() - 0.5; });
        for (var b = 0; b < Math.min(2, gNeighbors.length); b++) {
            reservedBreathing[gNeighbors[b]] = true;
        }
    });

    var shapeMode = lvNum % 6;
    var candidateWebCells = openCells.filter(function (cIdx) {
        return !usedCells[cIdx] && !reservedBreathing[cIdx];
    });

    candidateWebCells.sort(function (a, b) {
        var ra = Math.floor(a / 7), ca = a % 7;
        var rb = Math.floor(b / 7), cb = b % 7;
        var scoreA = 0, scoreB = 0;
        if (shapeMode === 0) {
            scoreA = (ra + ca) * 0.7 + Math.sin(a * 1.3) * 2.5;
            scoreB = (rb + cb) * 0.7 + Math.sin(b * 1.3) * 2.5;
        } else if (shapeMode === 1) {
            scoreA = Math.hypot(ra - 4, ca - 3) + (ca % 2) * 1.4;
            scoreB = Math.hypot(rb - 4, cb - 3) + (cb % 2) * 1.4;
        } else if (shapeMode === 2) {
            scoreA = Math.abs(ra - ca) * 0.9 + Math.cos(a * 0.9) * 2.0;
            scoreB = Math.abs(rb - cb) * 0.9 + Math.cos(b * 0.9) * 2.0;
        } else if (shapeMode === 3) {
            scoreA = ((ra * 3 + ca * 5) % 7) + Math.hypot(ra - 3.5, ca - 3) * 0.5;
            scoreB = ((rb * 3 + cb * 5) % 7) + Math.hypot(rb - 3.5, cb - 3) * 0.5;
        } else if (shapeMode === 4) {
            scoreA = Math.abs(ra - 4) * 1.1 + ((ra + ca) % 3) * 1.3;
            scoreB = Math.abs(rb - 4) * 1.1 + ((rb + cb) % 3) * 1.3;
        } else {
            scoreA = Math.abs(ca - 3) * 1.2 + Math.sin(ra * 2.1 + ca) * 2.2;
            scoreB = Math.abs(cb - 3) * 1.2 + Math.sin(rb * 2.1 + cb) * 2.2;
        }
        return (scoreB + rng() * 1.2) - (scoreA + rng() * 1.2);
    });

    // Đảm bảo luôn có đủ ô trống khả dụng để đặt toàn bộ webList
    if (candidateWebCells.length < webList.length) {
        var extra = openCells.filter(function (cIdx) {
            return !usedCells[cIdx] && candidateWebCells.indexOf(cIdx) === -1;
        });
        candidateWebCells = candidateWebCells.concat(extra);
    }

    var webItems = [];
    for (var w = 0; w < webList.length && w < candidateWebCells.length; w++) {
        var wCell = candidateWebCells[w];
        usedCells[wCell] = true;
        webItems.push([wCell, webList[w]]);
    }

    // Đặt freeItems ngay sát cạnh ô mạng nhện cùng loại (để đầu ván người chơi có thể kéo ghép phá nhện ngay)
    var freeItems = [];
    freeList.forEach(function (fId) {
        var placedCell = -1;
        // Ưu tiên 1: Ô trống kề sát ô nhện có cùng mã vật phẩm fId
        for (var i = 0; i < webItems.length; i++) {
            if (webItems[i][1] === fId) {
                var adj = getNeighbors(webItems[i][0]).filter(function (nIdx) {
                    return isOpenMap[nIdx] && !usedCells[nIdx];
                });
                if (adj.length > 0) {
                    placedCell = adj[Math.floor(rng() * adj.length)];
                    break;
                }
            }
        }
        // Ưu tiên 2: Ô trống kề sát bất kỳ ô nhện nào
        if (placedCell === -1) {
            for (var j = 0; j < webItems.length; j++) {
                var adjAny = getNeighbors(webItems[j][0]).filter(function (nIdx) {
                    return isOpenMap[nIdx] && !usedCells[nIdx];
                });
                if (adjAny.length > 0) {
                    placedCell = adjAny[Math.floor(rng() * adjAny.length)];
                    break;
                }
            }
        }
        // Ưu tiên 3: Ô trống bất kỳ
        if (placedCell === -1) {
            var remOpen = openCells.filter(function (cIdx) { return !usedCells[cIdx]; });
            if (remOpen.length > 0) {
                placedCell = remOpen[Math.floor(rng() * remOpen.length)];
            }
        }
        if (placedCell !== -1) {
            usedCells[placedCell] = true;
            freeItems.push([placedCell, fId]);
        }
    });

    var adjWeb = lvNum >= 3;
    var bonus = (lvNum === 10 || lvNum === 15 || lvNum === 20 || lvNum === 25 || lvNum >= 26);
    var spreadEvery = (lvNum >= 33 && (lvNum % 4 === 0 || lvNum % 7 === 0)) ? (lvNum >= 40 ? 15 : 16) : 0;

    var npcList = ['gau', 'cao', 'de'];
    var leadNpc = npcList[(lvNum - 1) % 3];
    var defaultText = lvNum === 1
        ? 'Hãy kéo ghép 2 món có sẵn vào ô mạng nhện rồi chạm vào Ba Lô để chuẩn bị nguyên liệu nhé!'
        : (lvNum === 2
            ? 'Hãy kéo ghép các món có sẵn vào mạng nhện rồi chạm vào Xe Kéo để hoàn thành nhiệm vụ nhé!'
            : 'Ghép các vật phẩm cùng loại để hoàn thành nhiệm vụ! Khi xong 1 nhiệm vụ, nhiệm vụ tiếp theo sẽ xuất hiện!');

    return {
        level: lvNum,
        name: '',
        pattern: patternName,
        rocks: rocks,
        generators: generators,
        freeItems: freeItems,
        webItems: webItems,
        orders: orders,
        mechanics: {
            adjWeb: adjWeb,
            bonus: bonus,
            spreadEvery: spreadEvery
        },
        dialogue: {
            npc: leadNpc,
            text: defaultText
        }
    };
}

var TOTAL_INITIAL_LEVELS = 120;
var GENERATED_LEVELS_LIST = [];
for (var _lv = 1; _lv <= TOTAL_INITIAL_LEVELS; _lv++) {
    GENERATED_LEVELS_LIST.push(generateLevelConfig(_lv));
}

var GAME_CONFIG = {
    totalLevels: TOTAL_INITIAL_LEVELS,
    levels: GENERATED_LEVELS_LIST,
    generateLevelConfig: generateLevelConfig,

    // -------------------------------------------------------------------------
    // 0. CẤU HÌNH GOOGLE FIREBASE CLOUD SYNC (LƯU TRỮ ĐÁM MÂY MIỄN PHÍ)
    // -------------------------------------------------------------------------
    firebase: {
        apiKey: "AIzaSyDUdvkcYYSzuOt4snJHLPhQWbVM-I_emLI",
        authDomain: "merge-camp-pets.firebaseapp.com",
        projectId: "merge-camp-pets",
        storageBucket: "merge-camp-pets.firebasestorage.app",
        messagingSenderId: "793303900011",
        appId: "1:793303900011:web:8cad0bb37b64514775b62e",
        measurementId: "G-GVZ3LWVREF"
    },

    // -------------------------------------------------------------------------
    // 1. HỆ THỐNG NĂNG LƯỢNG (ENERGY SYSTEM)
    // -------------------------------------------------------------------------
    energy: {
        startEnergy: 80,
        maxEnergyBase: 70,
        maxEnergyPerLevel: 4,
        maxEnergyCap: 200,
        regenIntervalSec: 30
    },

    // -------------------------------------------------------------------------
    // 2. TRẠM TIẾP NĂNG LƯỢNG (ENERGY SHOP)
    // -------------------------------------------------------------------------
    energyShop: {
        coinPacks: [
            { energy: 25, coinCost: 3000, desc: 'Dùng Vàng nhận thêm Năng Lượng chơi game' },
            { energy: 50, coinCost: 6000, desc: 'Dùng Vàng nhận thêm Năng Lượng chơi game' }
        ],
        coinPack: {
            energy: 25,
            coinCost: 3000
        },
        gemPack: {
            energy: 50,
            gemCost: 8
        },
        rescue: {
            enabled: true,
            amount: 20
        }
    },

    // -------------------------------------------------------------------------
    // 3. QUẢNG CÁO XEM THƯỞNG (REWARDED ADS)
    // -------------------------------------------------------------------------
    adRewards: {
        energy: {
            amount: 25,
            dailyLimit: 6
        },
        gem: {
            amount: 4,
            dailyLimit: 3
        },
        coin: {
            amount: 1500,
            dailyLimit: 4
        }
    },

    // -------------------------------------------------------------------------
    // 4. GÓI NẠP KIM CƯƠNG IAP (MÔ PHỎNG MUA BẰNG TIỀN THẬT)
    // -------------------------------------------------------------------------
    iapPacks: [
        {
            id: 'gem_tier_1',
            name: 'Túi Kim Cương Nhỏ',
            gems: 32,
            bonusGems: 0,
            priceVnd: '5.000 ₫',
            badge: null,
            desc: 'Đủ 4 lần nạp siêu tốc (+200 ⚡)'
        },
        {
            id: 'gem_tier_3',
            name: 'Rương Kim Cương',
            gems: 96,
            bonusGems: 40,
            priceVnd: '15.000 ₫',
            badge: '⭐ HỜI NHẤT +42%',
            isPopular: true,
            desc: 'Gói nạp tối ưu chi phí & hời nhất'
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
    ],

    starterPack: {
        id: 'starter_pack_camping',
        name: 'Gói Hành Trang Tân Thủ',
        gems: 40,
        coins: 4500,
        energy: 60,
        priceVnd: '5.000 ₫',
        badge: '🎁 ƯU ĐÃI 300%',
        desc: 'Nhận ngay 40 💎 + 4.500 🪙 + 60 ⚡ (Chỉ 1 lần)'
    },

    // -------------------------------------------------------------------------
    // 5. NGÂN HÀNG ĐỔI VÀNG (ĐỔI KIM CƯƠNG RA VÀNG - KINH TẾ X10)
    // -------------------------------------------------------------------------
    coinExchangePacks: [
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
            badge: '⭐ TIẾT KIỆM 15%',
            desc: 'Đổi từ 15 Kim Cương'
        },
        {
            id: 'coin_pack_3',
            name: 'Kho Vàng Hoàng Gia',
            coins: 25000,
            gemCost: 30,
            badge: '🔥 SIÊU LỜI +30%',
            desc: 'Đổi từ 30 Kim Cương'
        }
    ],

    // -------------------------------------------------------------------------
    // 6. THƯỞNG KINH TẾ TRONG VÁN CHƠI (GAMEPLAY ECONOMY)
    // -------------------------------------------------------------------------
    gameplay: {
        orderRewardMultiplier: 24,
        sellMinLevel: 1,
        sellMultiplier: 15,
        sellDivisor: 1,
        mergeRewards: {
            2: { coins: 0, gems: 0 },
            3: { coins: 0, gems: 0 },
            4: { coins: 15, gems: 0 },
            5: { coins: 35, gems: 0 },
            6: { coins: 80, gems: 0 },
            7: { coins: 180, gems: 1 },
            8: { coins: 400, gems: 2 }
        },
        combo: {
            enabled: true,
            windowSec: 3.5,
            baseCoins: 10,
            stepCoins: 15,
            maxCoins: 200
        },
        generatorBulkClicks: 6,
        generatorClickWindowMs: 550,
        levelClear: {
            baseCoins: 150,
            perLevelCoins: 25,
            perStarCoins: 50,
            gems3Stars: 2,
            gems1Or2Stars: 1,
            allowReplayReward: false
        }
    },

    // -------------------------------------------------------------------------
    // 7. THƯỞNG SỔ TAY CẨM NANG
    // -------------------------------------------------------------------------
    discoveryBook: {
        coinsMultiplier: 50,
        gemUnlockMinLevel: 5,
        gemsReward: 1
    },

    // -------------------------------------------------------------------------
    // 8. TÀI KHOẢN MỚI BAN ĐẦU
    // -------------------------------------------------------------------------
    initialProfile: {
        coins: 1000,
        gems: 8
    },

    // -------------------------------------------------------------------------
    // 9. DANH SÁCH 120 LEVEL SINH TỰ ĐỘNG (VÀ TỰ ĐỘNG MỞ RỘNG TRONG TƯƠNG LAI)
    // -------------------------------------------------------------------------
    levels: GENERATED_LEVELS_LIST
};

if (typeof window !== 'undefined') {
    window.GAME_CONFIG = GAME_CONFIG;
    window.generateLevelConfig = generateLevelConfig;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GAME_CONFIG;
}
