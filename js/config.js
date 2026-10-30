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
    if (lvNum === 1) return 5;
    if (lvNum === 2) return 6;
    if (lvNum === 3) return 7;
    if (lvNum === 4) return 8;
    if (lvNum === 5) return 9;
    if (lvNum === 6) return 10;
    if (lvNum === 7) return 12;
    if (lvNum === 8) return 14;
    if (lvNum === 9) return 16;
    if (lvNum === 10) return 18;
    if (lvNum <= 15) return 20 + (lvNum - 11) * 2; // Lv 11..15: 20..28
    if (lvNum <= 24) return Math.min(34, 29 + Math.floor((lvNum - 16) * 5 / 8)); // Lv 16..24: 29..34
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
    targetRocks = Math.max(2, Math.min(52, targetRocks));
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
// CÔNG THỨC SINH LEVEL TỰ ĐỘNG & NHỊP ĐIỆU PHÂN BỔ TUẦN HOÀN (PROCEDURAL LEVEL GENERATOR)
// - Cân bằng nhịp điệu phân bổ đều toàn bộ các item nhiệm vụ (trừ 9 level hướng dẫn).
// - Số lượng nhiệm vụ mỗi màn: 2 - 6 nhiệm vụ (bàn chơi hiển thị tối đa 4, ẩn phần còn lại).
// - Vật phẩm Cấp 8 xuất hiện làm nhiệm vụ từ Level 30.
// - Đảm bảo tới Level 120 toàn bộ 9 nhánh cắm trại đều xuất hiện đều đặn ở Cấp 8.
// - Cơ chế Cooldown chống lặp: Không bao giờ lặp cùng 1 vật phẩm ở các màn liền kề.
// - Không sử dụng tên level.
// =============================================================================

// Danh sách 9 nhánh vật phẩm cắm trại tương ứng 72 vật phẩm
var ALL_ITEM_LINES_9 = [
    'trai',   // 0: Xe Kéo (Cooler)
    'an',     // 1: Ba Lô (Backpack)
    'ban',    // 2: Xe Kéo (Cooler)
    'cafe',   // 3: Ba Lô (Backpack)
    'tham',   // 4: Thùng Dụng Cụ (Crate)
    'congcu', // 5: Ba Lô (Backpack)
    'ghe',    // 6: Xe Kéo (Cooler)
    'bep',    // 7: Thùng Dụng Cụ (Crate)
    'antoan'  // 8: Thùng Dụng Cụ (Crate)
];

// Cấu trúc cấp độ nhiệm vụ tăng tuyến tính mượt mà từ Màn 1 đến Màn 120
// Ưu tiên lều trại (trai) làm tiêu điểm kết thúc 3 chặng đầu:
// - Kết thúc Chặng 1 (Màn 20): Món tiêu điểm là trai_lv6 (Lều Gia Đình Chống Gió)
// - Kết thúc Chặng 2 (Màn 40): Món tiêu điểm là trai_lv7 (Lều Kim Tự Tháp Glamping)
// - Kết thúc Chặng 3 (Màn 60): Món tiêu điểm là trai_lv8 (Biệt Thự Lều Glamping)
// - Kết thúc Chặng 6 (Màn 120): Món tiêu điểm là trai_lv8 (Đỉnh Cao Cắm Trại)
// Loại bỏ lặp trai_lv4 ở Lv 1-10 (chỉ xuất hiện duy nhất 1 lần ở Màn 1)
function getProceduralTiersForLevel(lv) {
    if (lv === 1) return [4, 3];
    if (lv === 2) return [4, 3];
    if (lv === 3) return [4, 3, 3];
    if (lv === 4) return [4, 3];
    if (lv === 5) return [4, 4, 3];
    if (lv === 6) return [5, 4, 3];
    if (lv === 7) return [4, 3, 3];
    if (lv === 8) return [4, 4, 3];
    if (lv === 9) return [5, 4, 4];
    if (lv === 10) return [4, 4, 4];

    // Chặng 1: Màn 11 - 20 (Năng lượng: 14⚡ -> 22⚡, kết thúc tại Màn 20 với trai_lv6)
    if (lv <= 12) return [5, 4, 3, 3];
    if (lv <= 14) return [5, 4, 4, 3];
    if (lv <= 16) return [6, 4, 3, 3];
    if (lv <= 18) return [6, 4, 4, 3];
    if (lv <= 20) return [6, 5, 4, 3]; // Màn 20: trai_lv6

    // Chặng 2: Màn 21 - 40 (Năng lượng: 24⚡ -> 44⚡, kết thúc tại Màn 40 với trai_lv7)
    if (lv <= 23) return [6, 5, 4, 4];
    if (lv <= 26) return [6, 5, 5, 4];
    if (lv <= 29) return [6, 6, 5, 4];
    if (lv <= 32) return [7, 5, 4, 3];
    if (lv <= 35) return [7, 5, 4, 4];
    if (lv <= 38) return [7, 5, 5, 4];
    if (lv <= 40) return [7, 6, 4, 4]; // Màn 40: trai_lv7

    // Chặng 3: Màn 41 - 60 (Năng lượng: 46⚡ -> 116⚡, kết thúc tại Màn 60 với trai_lv8)
    if (lv <= 44) return [7, 6, 5, 4];
    if (lv <= 48) return [7, 6, 5, 5];
    if (lv <= 52) return [7, 6, 6, 5];
    if (lv <= 56) return [7, 6, 6, 5, 4];
    if (lv <= 59) return [7, 7, 5, 5, 4];
    if (lv === 60) return [8, 6, 5, 5, 4]; // Màn 60 climax: trai_lv8!

    // Chặng 4: Màn 61 - 80 (Năng lượng: 92⚡ -> 148⚡, Cấp 8 tiếp nối cho các nhánh còn lại)
    if (lv <= 65) return [8, 6, 5, 4, 3];
    if (lv <= 70) return [8, 6, 5, 5, 4];
    if (lv <= 75) return [8, 6, 6, 5, 4];
    if (lv <= 80) return [8, 7, 5, 5, 4];

    // Chặng 5: Màn 81 - 100 (Năng lượng: 164⚡ -> 204⚡)
    if (lv <= 85) return [8, 7, 6, 5, 4];
    if (lv <= 90) return [8, 7, 6, 5, 5];
    if (lv <= 95) return [8, 7, 6, 6, 5];
    if (lv <= 100) return [8, 7, 7, 5, 5];

    // Chặng 6: Màn 101 - 120 (Năng lượng: 220⚡ -> 284⚡, Cấp 8 kép và kết thúc tại 120 với trai_lv8)
    if (lv <= 105) return [8, 7, 7, 6, 5];
    if (lv <= 110) return [8, 7, 7, 6, 5, 5];
    if (lv <= 115) return [8, 8, 6, 6, 5, 5];
    return [8, 8, 7, 6, 5, 5]; // Màn 116 - 120
}

function getProceduralLeadLine(lv) {
    if (lv === 20 || lv === 40 || lv === 60 || lv === 120) return 'trai';

    if (lv <= 20) {
        var lines1 = ['an', 'ban', 'cafe', 'tham', 'congcu', 'ghe', 'bep', 'antoan', 'an'];
        return lines1[lv - 11];
    }
    if (lv < 40) {
        var lines2 = ['ban', 'cafe', 'tham', 'congcu', 'ghe', 'bep', 'antoan', 'trai', 'an'];
        return lines2[(lv - 21) % 9];
    }
    if (lv < 60) {
        var lines3 = ['cafe', 'tham', 'congcu', 'ghe', 'bep', 'antoan', 'trai', 'an', 'ban'];
        return lines3[(lv - 41) % 9];
    }
    var lines4 = ['tham', 'congcu', 'ghe', 'bep', 'antoan', 'trai', 'an', 'ban', 'cafe'];
    if (lv === 119) return 'antoan';
    return lines4[(lv - 61) % 9];
}

function buildProceduralOrdersMap() {
    var table = {};
    table[1] = ['trai_lv4', 'ghe_lv3'];
    table[2] = ['ban_lv4', 'ghe_lv3'];
    table[3] = ['ghe_lv4', 'ban_lv3', 'trai_lv3']; // trai_lv3 thay vì trai_lv4
    table[4] = ['an_lv4', 'cafe_lv3'];
    table[5] = ['congcu_lv4', 'an_lv4', 'cafe_lv3'];
    table[6] = ['an_lv5', 'congcu_lv4', 'cafe_lv3'];
    table[7] = ['tham_lv4', 'bep_lv3', 'antoan_lv3'];
    table[8] = ['bep_lv4', 'antoan_lv4', 'tham_lv3'];
    table[9] = ['bep_lv5', 'tham_lv4', 'antoan_lv4'];
    table[10] = ['ban_lv4', 'an_lv4', 'bep_lv4']; // ban_lv4 thay vì trai_lv4 (chỉ trai_lv4 duy nhất ở Màn 1)

    var lastSeen = {};
    for (var l = 1; l <= 10; l++) {
        table[l].forEach(function (it) { lastSeen[it] = l; });
    }

    for (var lv = 11; lv <= 120; lv++) {
        var tiers = getProceduralTiersForLevel(lv);
        var count = tiers.length;
        var lead = getProceduralLeadLine(lv);
        var leadIdx = ALL_ITEM_LINES_9.indexOf(lead);

        var currentOrders = [];
        for (var k = 0; k < count; k++) {
            var targetLv = tiers[k];

            // Bước nhảy stride = 4 (nguyên tố cùng nhau với 9) đảm bảo tuần hoàn đủ 9 nhánh không bao giờ trùng
            var lineIdx = (leadIdx + k * 4) % 9;
            var line = ALL_ITEM_LINES_9[lineIdx];

            var candidate = line + '_lv' + targetLv;

            // Cooldown chống lặp: Nếu món đồ cùng cấp vừa xuất hiện trong vòng 4 màn, tự động điều chỉnh cấp độ (không chỉnh lead)
            if (k > 0 && lastSeen[candidate] !== undefined && (lv - lastSeen[candidate]) < 4) {
                if (targetLv > 3 && currentOrders.indexOf(line + '_lv' + (targetLv - 1)) === -1) {
                    targetLv = targetLv - 1;
                } else if (!currentOrders.indexOf(line + '_lv' + (targetLv + 1)) === -1) {
                    targetLv = targetLv + 1;
                }
                candidate = line + '_lv' + targetLv;
            }

            currentOrders.push(candidate);
        }

        currentOrders.forEach(function (it) { lastSeen[it] = lv; });
        table[lv] = currentOrders;
    }
    return table;
}

var PROCEDURAL_LEVEL_ORDERS = buildProceduralOrdersMap();

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
    if (lvNum <= 3) {
        chosenGenIds = ['generator_cooler'];
    } else if (lvNum <= 6) {
        chosenGenIds = ['generator_backpack'];
    } else if (lvNum <= 9) {
        chosenGenIds = ['generator_crate'];
    } else {
        // Từ Level 10 trở đi: Mở khóa cả 3 nguồn phát trên bàn cờ
        // để hỗ trợ nhịp điệu phân bổ đa dạng toàn bộ 9 nhánh cắm trại
        chosenGenIds = ['generator_cooler', 'generator_backpack', 'generator_crate'];
    }

    // Thu thập các nhánh vật phẩm khả dụng từ nguồn phát của màn
    var availLines = [];
    chosenGenIds.forEach(function (gId) {
        (GENERATOR_POOLS[gId] || []).forEach(function (line) {
            if (availLines.indexOf(line) === -1) availLines.push(line);
        });
    });

    // 3. Danh sách nhiệm vụ theo nhịp điệu phân bổ tuần hoàn (2 - 6 nhiệm vụ/màn, hiển thị tối đa 4)
    var orders = (PROCEDURAL_LEVEL_ORDERS && PROCEDURAL_LEVEL_ORDERS[lvNum])
        ? PROCEDURAL_LEVEL_ORDERS[lvNum].slice()
        : ['trai_lv4', 'an_lv4', 'bep_lv4'];
    var orderCount = orders.length;

    // 4. Tạo danh sách vật phẩm hỗ trợ trong Mạng Nhện (webList) và Đồ Mồi Tự Do (freeList)
    var webList = [];
    var freeList = [];

    if (lvNum === 1) {
        freeList = ['trai_lv1', 'ghe_lv1'];
        webList = ['trai_lv1', 'ghe_lv1', 'ghe_lv1', 'trai_lv2'];
    } else if (lvNum === 2) {
        freeList = ['ban_lv1', 'ghe_lv1'];
        webList = ['ban_lv1', 'ghe_lv1', 'ghe_lv1', 'ban_lv2'];
    } else if (lvNum === 3) {
        freeList = ['ghe_lv1', 'ban_lv1'];
        webList = ['ghe_lv1', 'ban_lv1', 'trai_lv1', 'ghe_lv2'];
    } else if (lvNum === 4) {
        freeList = ['an_lv1', 'cafe_lv1'];
        webList = ['an_lv1', 'cafe_lv1', 'cafe_lv1', 'an_lv2'];
    } else if (lvNum === 5) {
        freeList = ['congcu_lv1', 'an_lv1'];
        webList = ['congcu_lv1', 'an_lv1', 'cafe_lv1', 'congcu_lv2'];
    } else if (lvNum === 6) {
        freeList = ['an_lv1', 'congcu_lv1'];
        webList = ['an_lv1', 'congcu_lv1', 'cafe_lv1', 'an_lv2'];
    } else if (lvNum === 7) {
        freeList = ['tham_lv1', 'bep_lv1'];
        webList = ['tham_lv1', 'bep_lv1', 'antoan_lv1', 'tham_lv2'];
    } else if (lvNum === 8) {
        freeList = ['bep_lv1', 'antoan_lv1'];
        webList = ['bep_lv1', 'antoan_lv1', 'tham_lv1', 'bep_lv2'];
    } else if (lvNum === 9) {
        freeList = ['bep_lv1', 'tham_lv1'];
        webList = ['bep_lv1', 'tham_lv1', 'antoan_lv1', 'bep_lv2'];
    } else if (lvNum === 10) {
        freeList = ['ban_lv1', 'an_lv1', 'bep_lv1'];
        webList = ['ban_lv1', 'an_lv1', 'bep_lv1', 'ban_lv2', 'an_lv2'];
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
    var targetRocks = Math.max(2, Math.min(52, 63 - (targetEmpty + chosenGenIds.length + webList.length + freeList.length)));
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
        ? 'Chạm Xe Kéo Dã Ngoại để lấy đồ cắm trại nhé!'
        : (lvNum === 2
            ? 'Khám phá thêm đồ cắm trại từ Xe Kéo nhé!'
            : (lvNum === 3
                ? 'Ghép các món nâng cao từ Xe Kéo Dã Ngoại nhé!'
                : (lvNum === 4
                    ? 'Ba Lô Dã Ngoại mới! Chạm Ba Lô để lấy đồ nhé!'
                    : (lvNum === 5
                        ? 'Chạm Ba Lô để chuẩn bị ẩm thực và dụng cụ nhé!'
                        : (lvNum === 6
                            ? 'Ghép các món cao cấp từ Ba Lô Dã Ngoại nhé!'
                            : (lvNum === 7
                                ? 'Thùng Dụng Cụ mới! Chạm để lấy thêm nguyên liệu!'
                                : (lvNum === 8
                                    ? 'Tạo vật dụng sinh hoạt từ Thùng Dụng Cụ nhé!'
                                    : (lvNum === 9
                                        ? 'Khám phá trọn vẹn đồ từ Thùng Dụng Cụ nhé!'
                                        : (lvNum === 10
                                            ? 'Hội tụ 3 nguồn phát! Chạm thùng để làm nhiệm vụ!'
                                            : 'Ghép các món cùng loại để hoàn thành nhiệm vụ nhé!')))))))));

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
        // Tỷ lệ rơi vật phẩm nâng cao từ thùng sinh đồ (Generator Tier Drop Rates)
        // Màn 1-10: 100% Cấp 1 để người chơi làm quen cơ chế ghép cơ bản
        // Màn 11+: Mở tỷ lệ rơi Cấp 2 và Cấp 3 để giảm bớt số lần click, tạo cảm giác bất ngờ may mắn
        generatorDrops: {
            minLevelForTierDrops: 11,
            tiers: [
                { maxLevel: 10,  lv1: 1.00, lv2: 0.00, lv3: 0.00 }, // Màn 1-10: 100% Lv1 (Hướng dẫn)
                { maxLevel: 20,  lv1: 0.78, lv2: 0.18, lv3: 0.04 }, // Màn 11-20: Mở nhẹ Lv2 (18%) & Lv3 (4%)
                { maxLevel: 40,  lv1: 0.70, lv2: 0.23, lv3: 0.07 }, // Màn 21-40: Nhiệm vụ Lv6/7 (23% Lv2, 7% Lv3)
                { maxLevel: 60,  lv1: 0.62, lv2: 0.26, lv3: 0.12 }, // Màn 41-60: Xuất hiện Lv8 (26% Lv2, 12% Lv3)
                { maxLevel: 90,  lv1: 0.55, lv2: 0.30, lv3: 0.15 }, // Màn 61-90: Cao cấp (30% Lv2, 15% Lv3)
                { maxLevel: 120, lv1: 0.50, lv2: 0.32, lv3: 0.18 }  // Màn 91-120: Đại kết cục (32% Lv2, 18% Lv3)
            ]
        },
        levelClear: {
            baseCoins: 150,
            perLevelCoins: 25,
            perStarCoins: 50,
            gems3Stars: 2,
            gems1Or2Stars: 1,
            energyPerStar: {
                1: 3,
                2: 5,
                3: 7
            },
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
