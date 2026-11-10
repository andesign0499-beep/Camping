// =============================================================================
// FILE CẤU HÌNH TRÒ CHƠI TOÀN DIỆN (GAME CONFIGURATION HUB)
// Người dùng có thể trực tiếp chỉnh sửa mọi thông số, vị trí bàn cờ, nhiệm vụ,
// kinh tế, năng lượng, tỷ lệ rơi và phần thưởng tại đây.
// =============================================================================

// =============================================================================
// =============================================================================
// SƠ ĐỒ TỌA ĐỘ BÀN CỜ 7x9 (63 Ô: TỪ Ô 0 ĐẾN Ô 62)
// Thiết lập khởi đầu: Đúng 5 ô trống item ở tâm, bao quanh bởi vòng mạng nhện,
// toàn bộ phía ngoài là các lớp đá tăng dần cấp độ để người chơi khám phá!
//
//          Cột 0   Cột 1   Cột 2   Cột 3   Cột 4   Cột 5   Cột 6
// Hàng 0:  [Đá 0]  [Đá 1]  [Đá 2]  [Đá 3]  [Đá 4]  [Đá 5]  [Đá 6]
// Hàng 1:  [Đá 7]  [Đá 8]  [Đá 9]  [Đá 10] [Đá 11] [Đá 12] [Đá 13]
// Hàng 2:  [Đá 14] [Đá 15] [Nhện16][Nhện17][Nhện18][Đá 19] [Đá 20]
// Hàng 3:  [Đá 21] [Nhện22][Trống23][XE KÉO][Trống25][Nhện26][Đá 27]
// Hàng 4:  [BaLô28][Nhện29][Trống30][Trống31][Trống32][Nhện33][Thùng34]
// Hàng 5:  [Đá 35] [Đá 36] [Nhện37][Nhện38][Nhện39][Đá 40] [Đá 41]
// Hàng 6:  [Đá 42] [Đá 43] [Đá 44] [Đá 45] [Đá 46] [Đá 47] [Đá 48]
// Hàng 7:  [Đá 49] [Đá 50] [Đá 51] [Đá 52] [Đá 53] [Đá 54] [Đá 55]
// Hàng 8:  [Đá 56] [Đá 57] [Đá 58] [Đá 59] [Đá 60] [Đá 61] [Đá 62]
// =============================================================================

var GAME_CONFIG = {
    // -------------------------------------------------------------------------
    // CẤU HÌNH VỊ TRÍ VÀ TỐC ĐỘ 4 ĐÁM MÂY HOÀNG HÔN (BG_ALL_MAY 1..4)
    // Bạn có thể trực tiếp sửa các thông số:
    // - top: Độ cao vị trí mây (tính theo pixel)
    // - speed: Thời gian bay hết màn hình (giây - số càng lớn thì mây bay càng chậm)
    // - direction: Hướng bay ('L2R': Trái sang Phải, 'R2L': Phải sang Trái)
    // - opacity: Độ đậm/nhạt của mây (0.0 đến 1.0)
    // -------------------------------------------------------------------------
    clouds: {
        // 1. Màn hình bàn chơi chính (Gameplay - mây bay cao hơn)
        gameplay: {
            cloud1: { top: 70, speed: 80, direction: 'L2R', opacity: 0.80 }, // Mây 1: Trái -> Phải
            cloud2: { top: 120, speed: 80, direction: 'R2L', opacity: 0.93 }, // Mây 2: Phải -> Trái
            cloud3: { top: 145, speed: 80, direction: 'L2R', opacity: 0.90 }, // Mây 3: Trái -> Phải
            cloud4: { top: 160, speed: 80, direction: 'R2L', opacity: 0.92 }  // Mây 4: Phải -> Trái
        },

        // 2. Màn hình "Trại của bạn" (My Camp - mây bay thấp hơn)
        myCamp: {
            cloud1: { top: 180, speed: 80, direction: 'L2R', opacity: 0.80 }, // Mây 1: Trái -> Phải
            cloud2: { top: 220, speed: 80, direction: 'R2L', opacity: 0.93 }, // Mây 2: Phải -> Trái
            cloud3: { top: 320, speed: 80, direction: 'L2R', opacity: 0.90 }, // Mây 3: Trái -> Phải
            cloud4: { top: 320, speed: 80, direction: 'R2L', opacity: 0.92 }  // Mây 4: Phải -> Trái
        }
    },

    // -------------------------------------------------------------------------
    // 1. CẤU HÌNH VỊ TRÍ CÁC ITEM VÀ MÁY PHÁT TRÊN BÀN CHƠI BAN ĐẦU
    // (Bàn cờ 7 cột x 9 hàng = 63 ô)
    // -------------------------------------------------------------------------
    initialBoard: {
        cols: 7,
        rows: 9,
        totalCells: 63,
        layoutVersion: 8,

        // A. VỊ TRÍ MÁY PHÁT MỞ SẴN BAN ĐẦU (CHỈ DUY NHẤT XE KÉO CẮM TRẠI Ở Ô 24)
        // Mở sẵn ngay đầu game, sinh nhánh: Bàn ('ban'), Ghế ('ghe'), Lều ('trai')
        generators: [
            { cell: 24, id: 'generator_cooler', name: 'Xe Kéo Cắm Trại (Mở sẵn ở ô 24)' }
        ],

        // B. LỘ TRÌNH MỞ KHÓA MÁY PHÁT MỚI THEO CẤP ĐỘ NGƯỜI CHƠI (LEVEL UNLOCK DOCK)
        // Không đặt sẵn Ba Lô và Thùng Đồ trên bàn chơi nữa!
        // - Level 1, 2, 3 : Chỉ có Xe Kéo ('generator_cooler') để người chơi hiểu rõ luật chơi.
        // - Đạt Level 4   : Xuất hiện icon Ba Lô ('generator_backpack') bên trái chú chó (có viền focus) để người chơi lôi vào bàn!
        // - Đạt Level 7   : Xuất hiện icon Thùng Đồ ('generator_crate') bên trái chú chó (có viền focus) để người chơi lôi vào bàn!
        generatorUnlockLevels: {
            generator_cooler: 1,
            generator_backpack: 4,
            generator_crate: 7
        },
        hiddenGenerators: [],

        // C. CÁC Ô TRỐNG ITEM BAN ĐẦU (5 Ô TRỐNG Ở TÂM: 23, 25, 30, 31, 32)
        freeItems: [],

        // D. VÒNG MẠNG NHỆN BAO QUANH VÙNG TÂM (9 Ô NHỆN CẤP 1-2 THUỘC NHÁNH XE KÉO)
        // (Các ô 22, 26, 33 là Ô Đá Khóa mở ở Level 3 theo sơ đồ thiết kế)
        webItems: [
            { cell: 16, id: 'trai_lv1', name: 'Cọc Cắm Trại dính nhện (Lv.1)' },
            { cell: 17, id: 'ban_lv1',  name: 'Bàn Xếp dính nhện (Lv.1)' },
            { cell: 18, id: 'ghe_lv1',  name: 'Ghế Xếp dính nhện (Lv.1)' },
            { cell: 29, id: 'ban_lv1',  name: 'Bàn Xếp dính nhện (Lv.1)' },
            { cell: 36, id: 'ghe_lv1',  name: 'Ghế Xếp dính nhện (Lv.1)' },
            { cell: 37, id: 'ghe_lv2',  name: 'Ghế Xếp dính nhện (Lv.2)' },
            { cell: 38, id: 'trai_lv2', name: 'Cọc Cắm Trại dính nhện (Lv.2)' },
            { cell: 39, id: 'ban_lv2',  name: 'Bàn Xếp dính nhện (Lv.2)' },
            { cell: 40, id: 'trai_lv1', name: 'Cọc Cắm Trại dính nhện (Lv.1)' }
        ],

        // E. DANH SÁCH 48 Ô ĐÁ KHỞI ĐẦU (BAO GỒM ĐÁ THƯỜNG VÀ ĐÁ KHÓA THEO LEVEL)
        rocks: [
            0, 1, 2, 3, 4, 5, 6,
            7, 8, 9, 10, 11, 12, 13,
            14, 15, 19, 20,
            21, 22, 26, 27,
            28, 33, 34,
            35, 41,
            42, 43, 44, 45, 46, 47, 48,
            49, 50, 51, 52, 53, 54, 55,
            56, 57, 58, 59, 60, 61, 62
        ],

        // F. DANH SÁCH Ô ĐÁ CÓ BIỂU TƯỢNG KHÓA (board_cell_rock_lock.png) THEO LEVEL NGƯỜI CHƠI
        // Mạng nhện nổ bên cạnh KHÔNG THỂ phá vỡ các ô đá này khi người chơi chưa đạt đủ Level yêu cầu!
        lockedRocks: {
            // Mở khóa ở Level 3 (8 ô)
            19: 3, 22: 3, 26: 3, 33: 3, 47: 3, 58: 3, 59: 3, 60: 3,
            // Mở khóa ở Level 5 (3 ô cụm trái giữa)
            14: 5, 21: 5, 28: 5,
            // Mở khóa ở Level 7 (7 ô: 3 ô cụm phải giữa + 4 ô góc dưới trái)
            20: 7, 27: 7, 34: 7, 42: 7, 49: 7, 56: 7, 57: 7,
            // Mở khóa ở Level 11 (4 ô góc dưới phải)
            54: 11, 55: 11, 61: 11, 62: 11,
            // Mở khóa ở Level 15 (5 ô góc trên trái)
            0: 15, 1: 15, 7: 15, 8: 15, 9: 15,
            // Mở khóa ở Level 18 (5 ô góc trên phải)
            5: 18, 6: 18, 11: 18, 12: 18, 13: 18
        }
    },

    // -------------------------------------------------------------------------
    // 2. HỆ THỐNG NHIỆM VỤ LAI (HYBRID ORDER SYSTEM: SLOT 1 CỐ ĐỊNH + SLOT 2 & 3 ĐỘNG QUÉT BÀN CỜ)
    // - Slot 1 (Món Khó - Cố định 100%): "Nhiệm vụ Cốt truyện" (Main Quest) lấy từ món đầu tiên của curatedOrders.
    // - Slot 2 & 3 (Món Vừa & Dễ - Động 100%): "Nhiệm vụ Tiêu thụ" (Side Quests) dùng thuật toán Board Scanner
    //   quét toàn bộ 63 ô trên bàn cờ (lọc đồ Lv.2 -> Lv.6), ưu tiên nhánh đang bị ứ đọng nhiều nhất,
    //   giao nhiệm vụ "Mồi" (+1 cấp kích thích chập đôi) hoặc "May mắn" (đòi đúng món đang găm trên bàn),
    //   và tự động bật chế độ "Giải cứu" (Van xả áp suất ở Slot 3) khi bàn cờ đầy trên 85%-90%!
    // -------------------------------------------------------------------------
    hybridOrders: {
        enabled: true,
        slot1FixedMainQuest: true,          // Slot 1 lấy cố định 100% món đầu tiên trong curatedOrders
        slot1OverMergeProtection: true,     // Nếu người chơi lỡ tay ghép vượt 1 cấp so với Slot 1, tự động nhận món vượt cấp đó!
        minScanLevel: 2,                    // Chỉ quét vật phẩm từ Level 2 trở lên (không lấy đồ Lv.1 vì quá dễ)
        maxScanLevel: 6,                    // Quét đến tối đa Level 6 cho nhiệm vụ phụ (Lv.7+ dành cho Slot 1)
        absorbOverMergedInSlot2: true,      // Nếu trên bàn có món Lv.6-Lv.7 bị ghép lỡ tay nằm thừa, Slot 2 ưu tiên hấp thụ ngay!
        teasingProbability: 0.55,           // Xác suất giao nhiệm vụ "Mồi" (cao hơn 1 cấp so với món cao nhất đang có của nhánh đó)
        serendipityProbability: 0.45,       // Xác suất đòi chính xác món người chơi đang găm trên bàn (tạo cảm giác "May mắn")
        rescueFillThreshold: 0.85,          // Khi vùng mở bị lấp đầy >= 85% (hoặc còn <= 3 ô trống): Slot 3 bật chế độ "Giải cứu"
        liveRescueFillThreshold: 0.90       // Khi đang chơi mà bàn cờ đầy >= 90% (<= 2 ô trống): Slot 3 lập tức đổi sang món có sẵn trên bàn!
    },

    // Danh sách 63 đơn hàng định hướng tiến trình:
    // - Phần tử [0] (Slot 1): Cố định 100% làm Nhiệm vụ Cốt truyện (Main Quest).
    //   Đặc biệt: Nhánh Ghế (ghe_lv...) luôn xuất hiện đúng 2 lần (cách nhau 3 nhiệm vụ) để người chơi có 2 ghế ghép vào trại.
    // - Phần tử [1], [2] (Slot 2 & 3): Làm mốc tham chiếu cấp độ / mặc định khi bàn cờ đang trống hoàn toàn.
    // - Tự động thích ứng: Nếu người chơi chưa đạt Level 4 (Ba Lô) hoặc Level 5 (Thùng Đồ) / chưa lôi máy phát vào bàn,
    //   đơn hàng sẽ chỉ lấy các nhánh thuộc máy phát ĐANG CÓ TRÊN BÀN CHƠI!
    curatedOrders: {
        // GIAI ĐOẠN 1: LÀM QUEN LUẬT CHƠI VỚI XE KÉO (Level 1 -> Level 3 | Order 1 - 12)
        // ---------------------------------------------------------
        // Chỉ xuất hiện 3 nhánh Xe Kéo (ban, ghe, trai) để người chơi hiểu rõ luật ghép và phá nhện mở bàn cờ
        1:  ['trai_lv3', 'ghe_lv2', 'ban_lv2'],
        2:  ['ban_lv3',  'ghe_lv2', 'trai_lv2'],
        3:  ['ghe_lv3',  'trai_lv2', 'ban_lv2'],  // Ghế Lv3 (Lần 1)
        4:  ['trai_lv4', 'ban_lv3', 'ghe_lv2'],
        5:  ['ban_lv4',  'ghe_lv3', 'trai_lv2'],
        6:  ['trai_lv4', 'trai_lv3', 'ban_lv2'],
        7:  ['ghe_lv3',  'ghe_lv3', 'ban_lv3'],   // Ghế Lv3 (Lần 2 - cách đúng 3 nhiệm vụ)
        8:  ['ban_lv5',  'trai_lv3', 'ghe_lv3'],
        9:  ['trai_lv5', 'ban_lv3', 'trai_lv3'],
        10: ['ban_lv5',  'ghe_lv4', 'ban_lv3'],
        11: ['ghe_lv4',  'trai_lv4', 'ghe_lv3'],  // Ghế Lv4 (Lần 1)
        12: ['trai_lv5', 'ban_lv4', 'trai_lv3'],

        // Order 13-20 (Giai đoạn Level 4 - Sau khi lôi Ba Lô vào bàn: Thêm an, cafe, congcu)
        13: ['an_lv3',     'cafe_lv2',   'ghe_lv3'],
        14: ['congcu_lv3', 'an_lv3',     'ban_lv3'],
        15: ['ghe_lv4',    'trai_lv3',   'congcu_lv2'], // Ghế Lv4 (Lần 2 - cách đúng 3 nhiệm vụ: 12, 13, 14)
        16: ['an_lv4',     'ghe_lv4',    'cafe_lv3'],
        17: ['congcu_lv4', 'ban_lv4',    'an_lv3'],
        18: ['cafe_lv5',   'trai_lv4',   'congcu_lv3'],
        19: ['an_lv5',     'ghe_lv4',    'ban_lv3'],
        20: ['congcu_lv5', 'cafe_lv4',   'trai_lv3'],

        // ---------------------------------------------------------
        // GIAI ĐOẠN 2: ĐẦY ĐỦ 3 MÁY PHÁT (Level 7+ - Sau khi lôi Thùng Đồ vào bàn | Order 21 - 33)
        // ---------------------------------------------------------
        21: ['bep_lv3',    'tham_lv2',   'trai_lv3'],   // Mở quen nhánh Thùng Đồ
        22: ['tham_lv4',   'an_lv4',     'ban_lv3'],
        23: ['antoan_lv4', 'congcu_lv4', 'ghe_lv3'],
        24: ['bep_lv5',    'cafe_lv4',   'ban_lv3'],
        25: ['tham_lv5',   'an_lv4',     'ghe_lv3'],
        26: ['ban_lv6',    'antoan_lv4', 'congcu_lv3'],
        27: ['ghe_lv6',    'cafe_lv5',   'bep_lv3'],
        28: ['congcu_lv6', 'tham_lv4',   'ban_lv4'],
        29: ['an_lv6',     'antoan_lv4', 'trai_lv3'],
        30: ['cafe_lv6',   'bep_lv5',    'ghe_lv3'],
        31: ['trai_lv6',   'congcu_lv5', 'tham_lv3'],
        32: ['bep_lv6',    'an_lv5',     'ban_lv4'],
        33: ['antoan_lv6', 'cafe_lv5',   'ghe_lv4'],

        // ---------------------------------------------------------
        // GIAI ĐOẠN 3: CHinh PHỤC CẤP CAO (Order 34 - 48)
        // - Slot 1: Lv.6 -> Lv.7 (Tối đa 1 món Lv.7/đơn) | Slot 2: Lv.4-5 | Slot 3: Lv.3-4
        // ---------------------------------------------------------
        34: ['ban_lv6', 'an_lv5', 'tham_lv4'],         // Máy phát: G1, G2, G3
        35: ['ghe_lv6', 'congcu_lv5', 'bep_lv4'],      // Máy phát: G1, G2, G3
        36: ['tham_lv6', 'trai_lv5', 'cafe_lv4'],      // Máy phát: G3, G1, G2
        37: ['bep_lv7', 'an_lv5', 'ban_lv4'],          // Máy phát: G3, G2, G1
        38: ['cafe_lv7', 'ghe_lv5', 'tham_lv4'],       // Máy phát: G2, G1, G3
        39: ['an_lv7', 'trai_lv5', 'bep_lv4'],         // Máy phát: G2, G1, G3
        40: ['trai_lv7', 'congcu_lv5', 'antoan_lv4'],  // Máy phát: G1, G2, G3
        41: ['tham_lv6', 'cafe_lv5', 'ban_lv4'],       // Máy phát: G3, G2, G1
        42: ['antoan_lv7', 'an_lv5', 'ghe_lv4'],       // Máy phát: G3, G2, G1
        43: ['ban_lv7', 'congcu_lv5', 'tham_lv4'],     // Máy phát: G1, G2, G3
        44: ['congcu_lv7', 'trai_lv5', 'bep_lv4'],     // Máy phát: G2, G1, G3
        45: ['bep_lv7', 'an_lv5', 'ghe_lv4'],          // Máy phát: G3, G2, G1
        46: ['tham_lv7', 'trai_lv5', 'cafe_lv4'],      // Máy phát: G3, G1, G2
        47: ['cafe_lv7', 'ban_lv5', 'antoan_lv4'],     // Máy phát: G2, G1, G3
        48: ['ghe_lv7', 'an_lv5', 'bep_lv4'],          // Máy phát: G1, G2, G3

        // ---------------------------------------------------------
        // GIAI ĐOẠN 4: END GAME ĐỀU ĐẶN & THƯ GIÃN (Order 49 - 63)
        // - Slot 1: Lv.7 -> Lv.8 (Chỉ duy nhất 1 món đỉnh cao ở Slot 1)
        // - Slot 2: Lv.5 (Món vừa) | Slot 3: Lv.3 -> Lv.4 (Van xả chống kẹt bàn cờ)
        // ---------------------------------------------------------
        49: ['bep_lv7', 'trai_lv5', 'cafe_lv4'],       // Máy phát: G3, G1, G2
        50: ['antoan_lv7', 'congcu_lv5', 'ban_lv4'],   // Máy phát: G3, G2, G1
        51: ['ban_lv8', 'tham_lv5', 'an_lv4'],         // Máy phát: G1, G3, G2
        52: ['an_lv7', 'ghe_lv5', 'bep_lv4'],          // Máy phát: G2, G1, G3
        53: ['trai_lv8', 'cafe_lv5', 'antoan_lv4'],    // Máy phát: G1, G2, G3
        54: ['tham_lv7', 'ban_lv5', 'congcu_lv4'],     // Máy phát: G3, G1, G2
        55: ['congcu_lv8', 'antoan_lv5', 'trai_lv4'],  // Máy phát: G2, G3, G1
        56: ['bep_lv8', 'an_lv5', 'ghe_lv4'],          // Máy phát: G3, G2, G1
        57: ['cafe_lv7', 'tham_lv5', 'ban_lv4'],       // Máy phát: G2, G3, G1
        58: ['ban_lv8', 'cafe_lv5', 'antoan_lv4'],     // Máy phát: G1, G2, G3
        59: ['ghe_lv8', 'bep_lv5', 'an_lv4'],          // Máy phát: G1, G3, G2
        60: ['antoan_lv8', 'congcu_lv5', 'trai_lv4'],  // Máy phát: G3, G2, G1
        61: ['an_lv8', 'ban_lv5', 'tham_lv4'],         // Máy phát: G2, G1, G3
        62: ['tham_lv8', 'ghe_lv5', 'cafe_lv4'],       // Máy phát: G3, G1, G2
        63: ['trai_lv8', 'bep_lv5', 'congcu_lv4']      // Máy phát: G1, G3, G2
    },

    // Cấu hình nhóm nhiệm vụ mặc định khi chưa bắt đầu chơi (khớp với Đơn số 1)
    initialOrders: {
        petId: 'character01',
        orders: [
            { id: 'trai_lv3', slotType: 'hard', desc: 'Slot 1: Món Khó (Lều trại Lv.3)' },
            { id: 'ghe_lv2', slotType: 'medium', desc: 'Slot 2: Món Vừa (Ghế xếp Lv.2)' },
            { id: 'ban_lv2', slotType: 'easy', desc: 'Slot 3: Món Dễ (Bàn xếp Lv.2)' }
        ]
    },

    // -------------------------------------------------------------------------
    // 3. TÀI NGUYÊN TÀI KHOẢN MỚI BAN ĐẦU (INITIAL PLAYER PROFILE)
    // -------------------------------------------------------------------------
    initialProfile: {
        coins: 500,     // Vàng khởi đầu cân bằng vừa phải
        gems: 25,       // Kim Cương khởi đầu
        energy: 150     // Năng lượng khởi đầu dồi dào
    },

    // -------------------------------------------------------------------------
    // 4. HỆ THỐNG NĂNG LƯỢNG (ENERGY SYSTEM)
    // -------------------------------------------------------------------------
    energy: {
        startEnergy: 150,           // Năng lượng ban đầu khi tạo tài khoản
        maxEnergyBase: 120,         // Năng lượng tối đa ở Level 1
        maxEnergyPerLevel: 5,       // Mỗi cấp độ tăng thêm giới hạn năng lượng tối đa
        maxEnergyCap: 250,          // Giới hạn kịch trần thanh năng lượng tự hồi
        regenIntervalSec: 30        // Thời gian hồi phục 1 điểm Năng lượng chuẩn: 30 giây (1 tiếng hồi đầy bình 120⚡)
    },

    // -------------------------------------------------------------------------
    // 5. TRẠM TIẾP NĂNG LƯỢNG (ENERGY SHOP)
    // Cân bằng hợp lý: 1⚡ ≈ 20 Vàng
    // -------------------------------------------------------------------------
    energyShop: {
        coinPacks: [
            { energy: 30, coinCost: 600, desc: 'Dùng Vàng mua 30 Năng Lượng' },
            { energy: 60, coinCost: 1100, desc: 'Dùng Vàng mua 60 Năng Lượng (Tiết kiệm ~10%)' }
        ],
        coinPack: {
            energy: 30,
            coinCost: 600
        },
        gemPack: {
            energy: 50,
            gemCost: 5              // 5 Kim Cương = 50 Năng Lượng (tỷ lệ chuẩn 1💎 = 10⚡)
        },
        rescue: {
            enabled: true,
            amount: 25              // Cứu trợ khẩn cấp 25⚡ khi hết sạch năng lượng
        }
    },

    // -------------------------------------------------------------------------
    // 6. NGÂN HÀNG ĐỔI KIM CƯƠNG RA VÀNG (COIN EXCHANGE)
    // -------------------------------------------------------------------------
    coinExchangePacks: [
        {
            id: 'coin_pack_1',
            name: 'Túi Vàng Nhỏ',
            coins: 1000,
            gemCost: 5,
            badge: null,
            desc: 'Đổi từ 5 Kim Cương (1💎 = 200🪙)'
        },
        {
            id: 'coin_pack_2',
            name: 'Rương Vàng Lớn',
            coins: 3200,
            gemCost: 15,
            badge: 'TIẾT KIỆM 15%',
            desc: 'Đổi từ 15 Kim Cương (1💎 = 213🪙)'
        },
        {
            id: 'coin_pack_3',
            name: 'Kho Vàng Hoàng Gia',
            coins: 7000,
            gemCost: 30,
            badge: 'SIÊU LỜI +35%',
            desc: 'Đổi từ 30 Kim Cương (1💎 = 233🪙)'
        }
    ],

    // -------------------------------------------------------------------------
    // 7. CÂN BẰNG THƯỞNG TRONG VÁN CHƠI (GAMEPLAY ECONOMY & REWARDS)
    // -------------------------------------------------------------------------
    gameplay: {
        // Hệ số thưởng Vàng khi nộp đơn hàng: Vàng = 12 * itemUnits(id) (Cân bằng chuẩn, chống lạm phát)
        orderRewardMultiplier: 12,

        // Hệ số tính giá bán vật phẩm trên bàn cờ: Giá bán = itemUnits(id) * 5 (~40% giá trị đơn hàng)
        sellMultiplier: 5,
        sellMinLevel: 1,
        sellDivisor: 1,

        // Thưởng Vàng và Kim Cương khi tạo ra vật phẩm cấp cao
        mergeRewards: {
            2: { coins: 0, gems: 0 },
            3: { coins: 2, gems: 0 },
            4: { coins: 5, gems: 0 },
            5: { coins: 10, gems: 0 },
            6: { coins: 20, gems: 0 },
            7: { coins: 40, gems: 1 },
            8: { coins: 80, gems: 1 }
        },

        // Thưởng chuỗi Combo ghép đồ liên tiếp
        combo: {
            enabled: true,
            windowSec: 4.0,
            baseCoins: 4,
            stepCoins: 3,
            maxCoins: 25
        },

        // Hệ số nhân điểm kinh nghiệm EXP nhận được từ mỗi đơn hàng (mặc định: 1.0)
        orderExpMultiplier: 1.0,

        // Nhấp liên tiếp vào thùng sinh đồ
        generatorBulkClicks: 6,
        generatorClickWindowMs: 550,

        // Tỷ lệ rơi vật phẩm từ 3 nguồn phát (Thùng chứa / Xe kéo / Ba lô)
        // Tăng tỷ lệ rơi thẳng Lv.2 và Lv.3 ngay từ đầu game để giảm 55% số lượng đồ Lv.1 gây chật bàn cờ!
        generatorDrops: {
            // Chia đều tuyệt đối tỷ lệ sinh đồ giữa 3 nhánh vật phẩm trong mỗi thùng chứa (1/3 : 1/3 : 1/3 = 33.33% mỗi món)
            equalBranchDistribution: true,
            // Ưu tiên chọn món trong túi cân bằng khớp với món lẻ đang nằm chờ ghép trên bàn cờ khi bàn sắp đầy
            smartPairAssist: true,
            branchWeights: {
                generator_cooler:   { ban: 1, ghe: 1, trai: 1 },      // Xe Kéo: 33.3% Bàn, 33.3% Ghế, 33.3% Lều
                generator_backpack: { an: 1, cafe: 1, congcu: 1 },    // Ba Lô: 33.3% Ăn, 33.3% Cà Phê, 33.3% Công Cụ
                generator_crate:    { tham: 1, antoan: 1, bep: 1 }    // Thùng Chứa: 33.3% Thảm, 33.3% An Toàn, 33.3% Bếp
            },
            minLevelForTierDrops: 4,    // Bắt đầu sinh đồ Lv.2 từ Level 4 (Level 1-3 sinh 100% đồ Lv.1)
            minLevelForLv3Drops: 8,     // Từ Level 8 trở lên phát ra item vật phẩm Lv.3 lên tới 60%
            // Công thức đặc biệt: Khi người chơi làm nhiệm vụ với item từ Level 8 trở lên (chỉ áp dụng cho máy phát chứa món đó)
            // HOẶC khi cấp độ tài khoản người chơi >= 12 (áp dụng cho tất cả máy phát):
            // Tăng tỷ lệ rơi Cấp 4 = 50%, Cấp 3 = 30%, Cấp 2 = 20%, Cấp 1 = 0%
            highLevelQuestDrops: {
                minQuestLevel: 8,
                minPlayerLevel: 12,
                lv4: 0.50,
                lv3: 0.30,
                lv2: 0.20,
                lv1: 0.00
            },
            tiers: [
                { maxLevel: 3,  lv1: 1.00, lv2: 0.00, lv3: 0.00, lv4: 0.00 }, // Level 1-3:  100% Cấp 1
                { maxLevel: 5,  lv1: 0.50, lv2: 0.50, lv3: 0.00, lv4: 0.00 }, // Level 4-5:  50% Cấp 1, 50% Cấp 2
                { maxLevel: 7,  lv1: 0.30, lv2: 0.70, lv3: 0.00, lv4: 0.00 }, // Level 6-7:  30% Cấp 1, 70% Cấp 2
                { maxLevel: 99, lv1: 0.00, lv2: 0.20, lv3: 0.30, lv4: 0.50 }  // Từ Level 12+ hoặc khi làm nhiệm vụ Lv.8+: 50% Cấp 4, 30% Cấp 3, 20% Cấp 2
            ]
        },

        // Cấu hình vật phẩm ẩn dưới lớp đá khi nứt thành mạng nhện:
        // Chỉ sinh ra các nhánh thuộc máy phát ĐANG ĐẶT TRÊN BÀN CHƠI và tăng dần cấp độ theo từng tầng đá từ trong ra ngoài (Lv.2 -> Lv.7)
        // để giữ nhịp độ mở rộng bàn cờ có thử thách, không bị mở bàn cờ quá nhanh.
        rockWebConfig: {
            onlyUseActiveGenerators: true,
            layerLevels: {
                1: [2, 3], // Tầng đá 1 (sát vùng nhện ban đầu): Lv.2 - Lv.3
                2: [3, 4], // Tầng đá 2: Lv.3 - Lv.4
                3: [4, 5], // Tầng đá 3: Lv.4 - Lv.5
                4: [5, 6]  // Tầng đá 4+ (rìa & góc bàn cờ): Lv.5 - Lv.6 (Ô bất ngờ lên tới Lv.7)
            },
            maxWebLevel: 6,
            surpriseMaxLevel: 7
        },

        // Thưởng qua màn chơi
        levelClear: {
            baseCoins: 60,
            perLevelCoins: 15,
            perStarCoins: 25,
            gems3Stars: 2,
            gems1Or2Stars: 1,
            energyPerStar: { 1: 3, 2: 5, 3: 7 },
            allowReplayReward: false
        }
    },

    // -------------------------------------------------------------------------
    // 8. BẢNG KINH NGHIỆM EXP YÊU CẦU LÊN LEVEL (LEVEL EXP TABLE)
    // Tăng đều mượt mà: Bắt đầu Level 1 với 195 EXP (chính xác đúng 3 nhiệm vụ đầu để lên cấp).
    // Toàn bộ các Level tiếp theo duy trì ổn định trong khoảng 3 - 7 nhiệm vụ/level.
    // Không có bước nhảy vọt % đột ngột, tốc độ tăng trưởng mượt mà theo chuẩn game casual merge quốc tế.
    // -------------------------------------------------------------------------
    expTable: {
        1: 195,    2: 570,    3: 950,    4: 1100,   5: 1950,
        6: 2050,   7: 2300,   8: 2550,   9: 3900,   10: 4200,
        11: 4500,  12: 4800,  13: 5050,  14: 5300,  15: 5550,
        16: 5700,  17: 5750,  18: 6000,  19: 6100,  20: 6250,
        21: 6400,  22: 6600,  23: 6850,  24: 7100,  25: 7350,
        26: 7650,  27: 7950,  28: 8250,  29: 8600,  30: 8950,
        31: 9300,  32: 9700,  33: 10100, 34: 10500, 35: 10950,
        36: 11400, 37: 11900, 38: 12400, 39: 12900, 40: 13450,
        41: 14000, 42: 14600, 43: 15200, 44: 15850, 45: 16500,
        46: 17200, 47: 17900, 48: 18650, 49: 19400, 50: 20200,
        51: 21000, 52: 21850, 53: 22700, 54: 23600, 55: 24500,
        56: 25450, 57: 26450, 58: 27450, 59: 28500, 60: 29600
    },

    // Điểm EXP cơ bản khi nộp từng cấp vật phẩm (Cân bằng lũy tiến theo công sức merge)
    itemExpByLevel: {
        1: 10,
        2: 25,
        3: 60,
        4: 125,
        5: 230,
        6: 390,
        7: 620,
        8: 940,
        9: 1380,
        10: 1960,
        11: 2700,
        12: 3600
    },

    // -------------------------------------------------------------------------
    // 9. THƯỞNG SỔ TAY CẨM NANG KHÁM PHÁ (DISCOVERY BOOK)
    // -------------------------------------------------------------------------
    discoveryBook: {
        coinsMultiplier: 25,
        gemUnlockMinLevel: 5,
        gemsReward: 1
    },

    // -------------------------------------------------------------------------
    // 10. QUẢNG CÁO XEM THƯỞNG & QUÀ TẶNG HÀNG NGÀY (REWARDED ADS)
    // -------------------------------------------------------------------------
    adRewards: {
        energy: { amount: 30, dailyLimit: 6 },
        gem: { amount: 8, dailyLimit: 6 },
        coin: { amount: 600, dailyLimit: 5 },
        dailyGift: { amount: 5, doubleAmount: 10 },
        mysteryChest: { minGems: 12, maxGems: 25, dailyLimit: 3 }
    },

    // -------------------------------------------------------------------------
    // 11. CẤU HÌNH GOOGLE FIREBASE CLOUD SYNC (LƯU TRỮ ĐÁM MÂY)
    // -------------------------------------------------------------------------
    firebase: {
        apiKey: "AIzaSyDUdvkcYYSzuOt4snJHLPhQWbVM-I_emLI",
        authDomain: "merge-camp-pets.firebaseapp.com",
        projectId: "merge-camp-pets",
        storageBucket: "merge-camp-pets.firebasestorage.app",
        messagingSenderId: "793303900011",
        appId: "1:793303900011:web:8cad0bb37b64514775b62e",
        measurementId: "G-GVZ3LWVREF"
    }
};

// =============================================================================
// CÁC HÀM XỬ LÝ NỘI BỘ VÀ TẠO LEVEL NỀN (INTERNAL PROCEDURAL GENERATORS)
// =============================================================================

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

var ALL_GENERATOR_IDS = ['generator_cooler', 'generator_backpack', 'generator_crate'];

function getTargetEmptyCells(lvNum, orderCount) {
    var base = 5;
    var target = base + (Math.max(1, parseInt(lvNum, 10) || 1) - 1);
    return Math.min(46, target);
}

function generateOrganicRockMask(patternName, patFn, targetRocks, rng) {
    targetRocks = Math.max(2, Math.min(52, targetRocks));
    var scores = [];
    for (var idx = 0; idx < 63; idx++) {
        var r = Math.floor(idx / 7);
        var c = idx % 7;

        if (r >= 3 && r <= 5 && c >= 2 && c <= 4) {
            scores.push({ idx: idx, score: -99999 });
            continue;
        }

        var score = 0;
        if (patFn && patFn(r, c)) score += 35;
        var distFromCenter = Math.abs(r - 4) + Math.abs(c - 3);
        score += distFromCenter * 5;
        if (r === 0 || r === 8) score += 12;
        if (c === 0 || c === 6) score += 10;
        if ((r === 0 || r === 8) && (c === 0 || c === 6)) score += 15;
        if ((r <= 1 || r >= 7) && (c <= 1 || c >= 5)) score += 8;
        score += (rng() * 4 - 2);
        scores.push({ idx: idx, score: score });
    }

    scores.sort(function (a, b) { return b.score - a.score; });
    var rockSet = new Set(scores.slice(0, targetRocks).map(function (s) { return s.idx; }));

    while (true) {
        var visited = new Set();
        var queue = [31];
        visited.add(31);
        while (queue.length > 0) {
            var curr = queue.shift();
            var cr = Math.floor(curr / 7), cc = curr % 7;
            var neighbors = [];
            if (cr > 0) neighbors.push(curr - 7);
            if (cr < 8) neighbors.push(curr + 7);
            if (cc > 0) neighbors.push(curr - 1);
            if (cc < 6) neighbors.push(curr + 1);

            for (var n = 0; n < neighbors.length; n++) {
                var nb = neighbors[n];
                if (!rockSet.has(nb) && !visited.has(nb)) {
                    visited.add(nb);
                    queue.push(nb);
                }
            }
        }

        var isolated = [];
        for (var check = 0; check < 63; check++) {
            if (!rockSet.has(check) && !visited.has(check)) {
                isolated.push(check);
            }
        }
        if (isolated.length === 0) break;

        var fixedAny = false;
        isolated.forEach(function (isoIdx) {
            var ir = Math.floor(isoIdx / 7), ic = isoIdx % 7;
            var inbs = [];
            if (ir > 0) inbs.push(isoIdx - 7);
            if (ir < 8) inbs.push(isoIdx + 7);
            if (ic > 0) inbs.push(isoIdx - 1);
            if (ic < 6) inbs.push(isoIdx + 1);

            var bridgeCandidate = inbs.filter(function (bIdx) {
                return rockSet.has(bIdx) && visited.has(bIdx);
            });
            if (bridgeCandidate.length > 0) {
                rockSet.delete(bridgeCandidate[0]);
                fixedAny = true;
            } else {
                rockSet.add(isoIdx);
                fixedAny = true;
            }
        });
        if (!fixedAny) break;
    }

    return Array.from(rockSet);
}

// Bảng đơn hàng cấp cơ sở cho 60 Level
var PROCEDURAL_LEVEL_ORDERS = {
    1: ['ghe_lv4', 'trai_lv3', 'ban_lv3'],
    2: ['ban_lv4', 'ghe_lv4', 'trai_lv3'],
    3: ['an_lv4', 'cafe_lv3', 'ghe_lv3'],
    4: ['cafe_lv4', 'an_lv4', 'ban_lv3'],
    5: ['bep_lv4', 'tham_lv3', 'an_lv3'],
    6: ['tham_lv4', 'bep_lv4', 'cafe_lv3'],
    7: ['trai_lv5', 'ban_lv4', 'ghe_lv3'],
    8: ['ghe_lv5', 'trai_lv4', 'bep_lv3'],
    9: ['congcu_lv4', 'an_lv4', 'tham_lv3'],
    10: ['trai_lv5', 'an_lv5', 'ban_lv4']
};

function generateLevelConfig(lvNum) {
    var seed = lvNum * 1234567 + 98765;
    function rng() {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
    }

    var patIdx = (lvNum === 1) ? 0 : (((lvNum - 1) * 5 + Math.floor((lvNum - 1) / 4)) % ORGANIC_PATTERN_NAMES.length);
    var patternName = ORGANIC_PATTERN_NAMES[patIdx];
    var patFn = ORGANIC_BOARD_PATTERNS[patternName] || ORGANIC_BOARD_PATTERNS.creek_bend;

    var orders = (PROCEDURAL_LEVEL_ORDERS && PROCEDURAL_LEVEL_ORDERS[lvNum])
        ? PROCEDURAL_LEVEL_ORDERS[lvNum].slice()
        : ['ghe_lv4', 'trai_lv3', 'ban_lv3'];

    var chosenGenIds = ALL_GENERATOR_IDS.slice();
    var targetEmpty = getTargetEmptyCells(lvNum, orders.length);
    var targetRocks = Math.max(2, Math.min(52, 63 - (targetEmpty + chosenGenIds.length + 8)));
    var rocks = generateOrganicRockMask(patternName, patFn, targetRocks, rng);

    return {
        level: lvNum,
        name: '',
        pattern: patternName,
        rocks: rocks,
        generators: GAME_CONFIG.initialBoard.generators.map(function (g) { return [g.cell, g.id]; }),
        freeItems: GAME_CONFIG.initialBoard.freeItems.map(function (f) { return [f.cell, f.id]; }),
        webItems: GAME_CONFIG.initialBoard.webItems.map(function (w) { return [w.cell, w.id]; }),
        orders: orders,
        mechanics: { adjWeb: false, bonus: false, spreadEvery: 0 },
        dialogue: null
    };
}

var TOTAL_INITIAL_LEVELS = 60;
var GENERATED_LEVELS_LIST = [];
for (var _lv = 1; _lv <= TOTAL_INITIAL_LEVELS; _lv++) {
    GENERATED_LEVELS_LIST.push(generateLevelConfig(_lv));
}

GAME_CONFIG.totalLevels = TOTAL_INITIAL_LEVELS;
GAME_CONFIG.levels = GENERATED_LEVELS_LIST;
GAME_CONFIG.generateLevelConfig = generateLevelConfig;

if (typeof window !== 'undefined') {
    window.GAME_CONFIG = GAME_CONFIG;
    window.CLOUD_CONFIG = GAME_CONFIG.clouds;
    window.generateLevelConfig = generateLevelConfig;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GAME_CONFIG;
}
