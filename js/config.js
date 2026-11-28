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
    // 0. CẤU HÌNH GIAO DIỆN BÀN CHƠI 7x9 (VẼ BẰNG CODE - SẮC NÉT, CÓ BÓNG ĐỔ)
    // Bạn có thể chủ động chỉnh màu nền, màu caro, độ dày stroke, bo góc, bóng đổ tại đây:
    // -------------------------------------------------------------------------
    boardStyle: {
        // Lớp khung nền dưới cùng bao cả bàn chơi 7x9
        baseBgColor: '#d4b997',                         // Mã màu nền lớp dưới cùng
        outerStrokeWidth: 2,                            // Độ dày viền ngoài (px)
        outerStrokeColor: '#caa075',                    // Mã màu viền ngoài
        borderRadius: 6,                                // Bo góc bàn chơi (px)
        boxShadow: '0 4px 12px rgba(46, 26, 10, 0.28)', // Bóng đổ nhẹ dưới khung bàn chơi

        // Lớp kẻ caro ở trên (xen kẽ với lớp nền dưới cùng)
        checkerLightColor: '#e1c8a9',                   // Mã màu ô caro sáng
        checkerStrokeWidth: 1,                          // Độ dày viền ô caro (px)
        checkerStrokeColor: '#c0a582',                  // Mã màu viền ô caro
        checkerBorderRadius: 2                          // Bo góc các ô caro phía trên (px)
    },

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
            cloud1: { top: 120, speed: 80, direction: 'L2R', opacity: 0.2 }, // Mây 1: Trái -> Phải
            cloud2: { top: 170, speed: 80, direction: 'R2L', opacity: 0.3 }, // Mây 2: Phải -> Trái
            cloud3: { top: 175, speed: 80, direction: 'L2R', opacity: 0.2 }, // Mây 3: Trái -> Phải
            cloud4: { top: 200, speed: 80, direction: 'R2L', opacity: 0.3 }  // Mây 4: Phải -> Trái
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
        layoutVersion: 11,

        // A. VỊ TRÍ MÁY PHÁT MỞ SẴN BAN ĐẦU (CHỈ DUY NHẤT XE KÉO CẮM TRẠI Ở Ô 24 - HÀNG 3 CỘT 3)
        // Mở sẵn ngay đầu game, sinh nhánh: Bàn ('ban'), Ghế ('ghe'), Lều ('trai')
        generators: [
            { cell: 24, id: 'generator_cooler', name: 'Xe Kéo Cắm Trại (Mở sẵn ở ô 24)' }
        ],

        // B. LỘ TRÌNH MỞ KHÓA 5 MÁY PHÁT THEO CẤP ĐỘ NGƯỜI CHƠI (LEVEL UNLOCK DOCK)
        // - Level 1..3  : Xe Kéo Dã Ngoại ('generator_cooler') -> Bàn, Ghế, Lều
        // - Đạt Level 4 : Giỏ Picnic ('generator_backpack') -> Đồ ăn, Hoa quả, Cà phê
        // - Đạt Level 7 : Ba Lô Sinh Tồn ('generator_crate') -> Đèn/Công cụ, An toàn, Chỗ ngủ
        // - Đạt Level 10: Gốc Cây Thảo Mộc ('generator_wood') -> Lửa & Bếp, Hoa rừng
        // - Đạt Level 13: Giỏ Đồ Chơi Thú Cưng ('generator_animal') -> Đồ chơi thú cưng, Câu cá & Thám hiểm
        generatorUnlockLevels: {
            generator_cooler: 1,
            generator_backpack: 4,
            generator_crate: 7,
            generator_wood: 10,
            generator_animal: 13
        },
        hiddenGenerators: [],

        // C. CÁC Ô TRỐNG ITEM BAN ĐẦU (5 Ô TRỐNG CÂN ĐỐI Ở TÂM: 23, 25, 30, 31, 32)
        freeItems: [],

        // D. VÒNG MẠNG NHỆN ĐỐI XỨNG BAO QUANH VÙNG TÂM (10 Ô NHỆN CẤP 1-2 THUỘC NHÁNH XE KÉO)
        // Tạo thành khung bát giác cân đối ở giữa bàn 7x9 (Hàng 2: 16..18, Hàng 3-4: 22,26,29,33, Hàng 5: 37..39)
        webItems: [
            { cell: 16, id: 'trai_lv1', name: 'Cọc Cắm Trại dính nhện (Lv.1)' },
            { cell: 17, id: 'ban_lv1',  name: 'Bàn Xếp dính nhện (Lv.1)' },
            { cell: 18, id: 'ghe_lv1',  name: 'Ghế Xếp dính nhện (Lv.1)' },
            { cell: 22, id: 'ban_lv1',  name: 'Bàn Xếp dính nhện (Lv.1)' },
            { cell: 26, id: 'ghe_lv1',  name: 'Ghế Xếp dính nhện (Lv.1)' },
            { cell: 29, id: 'trai_lv1', name: 'Cọc Cắm Trại dính nhện (Lv.1)' },
            { cell: 33, id: 'ban_lv1',  name: 'Bàn Xếp dính nhện (Lv.1)' },
            { cell: 37, id: 'ghe_lv2',  name: 'Ghế Xếp dính nhện (Lv.2)' },
            { cell: 38, id: 'trai_lv2', name: 'Cọc Cắm Trại dính nhện (Lv.2)' },
            { cell: 39, id: 'ban_lv2',  name: 'Bàn Xếp dính nhện (Lv.2)' }
        ],

        // E. DANH SÁCH 47 Ô ĐÁ KHỞI ĐẦU ĐỐI XỨNG TRÁI-PHẢI (BAO GỒM ĐÁ THƯỜNG VÀ ĐÁ KHÓA THEO LEVEL)
        rocks: [
            0, 1, 2, 3, 4, 5, 6,
            7, 8, 9, 10, 11, 12, 13,
            14, 15, 19, 20,
            21, 27,
            28, 34,
            35, 36, 40, 41,
            42, 43, 44, 45, 46, 47, 48,
            49, 50, 51, 52, 53, 54, 55,
            56, 57, 58, 59, 60, 61, 62
        ],

        // F. DANH SÁCH Ô ĐÁ CÓ BIỂU TƯỢNG KHÓA (board_cell_rock_lock.png) THEO LEVEL NGƯỜI CHƠI
        // Đã đổi chỗ 4 cặp ô khóa ↔ ô đất theo đúng hướng mũi tên đỏ (8↔2, 19↔11, 50↔44, 54↔60)
        lockedRocks: {
            // Mở khóa ở Level 3
            15: 3, 11: 3, 36: 3, 40: 3,
            // Mở khóa ở Level 5 (4 ô viền trái giữa)
            14: 5, 21: 5, 28: 5, 35: 5,
            // Mở khóa ở Level 7 (6 ô viền phải giữa & 2 ô đệm dưới)
            20: 7, 27: 7, 34: 7, 41: 7, 43: 7, 47: 7,
            // Mở khóa ở Level 11 (góc dưới trái & phải, đã đổi 50↔44 và 54↔60)
            42: 11, 44: 11, 49: 11, 56: 11, 57: 11,
            48: 11, 55: 11, 60: 11, 61: 11, 62: 11,
            // Mở khóa ở Level 15 (góc trên trái, đã đổi 8↔2)
            0: 15, 1: 15, 2: 15, 7: 15,
            // Mở khóa ở Level 18 (góc trên phải)
            5: 18, 6: 18, 12: 18, 13: 18
        }
    },

    // -------------------------------------------------------------------------
    // 2. HỆ THỐNG NHIỆM VỤ ĐA NPC & KỊCH BẢN CỐT TRUYỆN 6 CHƯƠNG (MULTI-NPC QUEST SYSTEM)
    // Áp dụng phân tích thiết kế từ Pines Peak:
    // - Nhiều NPC xuất hiện đồng thời và nối liền nhau trên bàn chơi (1 đến 3 nhiệm vụ cùng lúc).
    // - Mỗi NPC mang tính cách, tiểu sử, phong cách thoại và danh sách nhiệm vụ riêng biệt (1 - 3 item/nhiệm vụ).
    // - Phân loại nhiệm vụ đa dạng:
    //   + Story / Chapter Quest: Nhiệm vụ cốt truyện mở dựng từng khu vực trại.
    //   + Happy / Merchant Bonus Order (Đơn Hào Phóng): Thưởng thêm Năng lượng / Xu trực tiếp lên bàn chơi.
    //   + Quick / Side Order (1-2 món): Tạo nhịp hoàn thành ngắn xen kẽ khi người chơi đang ghép món cấp cao.
    // -------------------------------------------------------------------------
    hybridOrders: {
        enabled: true,
        slot1FixedMainQuest: true,
        slot1OverMergeProtection: true,
        minScanLevel: 2,
        maxScanLevel: 6,
        absorbOverMergedInSlot2: true,
        teasingProbability: 0.55,
        serendipityProbability: 0.45,
        rescueFillThreshold: 0.85,
        liveRescueFillThreshold: 0.90
    },

    // Cấu hình số lượng NPC xuất hiện cùng lúc và nối liền nhau trên bàn chơi
    multiNpcOrders: {
        maxSimultaneousNpcs: 3,             // Tối đa 3 NPC đặt đơn nối liền nhau cùng lúc trên bàn chơi
        unlockScheduleByLevel: {
            'character01': 1,               // Chương 1: Golden (Mặc định từ Level 1)
            'character04': 2,               // Chương 2: Poodle (Xuất hiện cùng Golden từ Level 2 hoặc sau 2 đơn đầu)
            'character03': 4,               // Chương 3: Bulldog (Tham gia từ Level 4 khi mở Giỏ Picnic)
            'character10': 7,               // Chương 4: Ba Tư (Tham gia từ Level 7 khi mở Ba Lô Sinh Tồn)
            'character07': 10,              // Chương 5: Mèo Anh (Tham gia từ Level 10 khi mở Gốc Cây Thảo Mộc)
            'character06': 13               // Chương 6: Xiêm (Tham gia từ Level 13 khi mở Giỏ Thú Cưng & Câu Cá)
        },
        happyOrderBonusChance: 0.35         // Tỷ lệ đơn hàng Hào Phóng thưởng thêm Năng lượng / Xu
    },

    // Hồ sơ 6 Nhân vật NPC & Chuỗi Nhiệm Vụ Riêng Biệt (1 đến 3 item mỗi nhiệm vụ)
    npcProfiles: {
        'character01': {
            id: 'character01',
            name: 'Golden',
            species: 'Chó Golden Retriever',
            chapter: 'Chương 1',
            unlockText: 'Khởi đầu miễn phí',
            unlockLevel: 1,
            price: 0,
            title: 'Golden — Trưởng Trại Hướng Đạo Ấm Áp',
            campZone: 'Lều Chính & Bãi Cỏ Ven Suối',
            story: 'Cựu trưởng đoàn hướng đạo sinh của Thung Lũng Thông Xanh. Golden thừa kế mảnh đất cắm trại ven suối này từ ông nội nhưng nhiều năm bỏ trống khiến cỏ mọc um tùm. Khi người chơi ghé qua, Golden lập tức mời bạn cùng hợp sức dựng lại một khu trại ấm cúng, nơi mọi vị khách đều tìm thấy bình yên.',
            traits: [
                '01. Nhiệt tình & Kiên nhẫn',
                '02. Lạc quan, hay khích lệ',
                '03. Tận tụy với kỹ năng sinh tồn cơ bản'
            ],
            speechStyle: 'Ấm áp, gần gũi, hay dùng từ ngữ khích lệ kiểu "Tuyệt lắm bạn ơi!", "Chầm chậm thôi, từng cọc lều một nhé!".',
            preferredLines: ['trai', 'ghe', 'ban', 'tham'],
            questList: [
                // 15 nhiệm vụ cốt truyện Chương 1 của Golden (mỗi item tối đa <= 3 lần toàn game, cách xa nhau >= 4 nhiệm vụ, không bao giờ lặp gần nhau)
                { id: 'golden_q1',  title: 'Dọn Bãi Cỏ Ven Suối',       items: ['trai_lv2', 'ban_lv2'],              dialogue: 'Chầm chậm thôi, từng cọc lều một nhé! Cùng mình dựng góc trại đầu tiên nào!' },
                { id: 'golden_q2',  title: 'Ghế Nghỉ Hướng Đạo (1/2)',  items: ['ghe_lv3', 'trai_lv3'],              dialogue: 'Tuyệt lắm bạn ơi! Ghép chiếc ghế xếp đầu tiên để nghỉ chân bên bờ suối nhé!' },
                { id: 'golden_q3',  title: 'Bàn Trà Gỗ Xếp Nhỏ',        items: ['ban_lv3', 'ghe_lv2'],               dialogue: 'Có thêm chiếc bàn xếp nhỏ bên ghế vải là bày được bình nước mát rồi!' },
                { id: 'golden_q4',  title: 'Bạt Tăng Che Nắng Sớm',     items: ['trai_lv4'],                         dialogue: 'Tuyệt lắm bạn ơi! Căng tấm bạt tăng che nắng đầu tiên cho bãi cỏ ven suối nào!' },
                { id: 'golden_q5',  title: 'Bàn Gỗ Cuộn Ven Suối',      items: ['ban_lv4', 'trai_lv2'],              dialogue: 'Có chiếc bàn gỗ cuộn này, khách ghé thăm sẽ có chỗ bày đồ thật gọn gàng!' },
                { id: 'golden_q6',  title: 'Đôi Ghế Tay Vịn (1/2)',     items: ['ghe_lv4', 'trai_lv5'],              dialogue: 'Chầm chậm thôi! Mình nâng cấp lên ghế có tay vịn ngồi ngắm suối cho êm nhé!' },
                { id: 'golden_q7',  title: 'Ghế Nghỉ Hướng Đạo (2/2)',  items: ['ghe_lv3', 'ban_lv5'],               dialogue: 'Thêm 1 chiếc ghế xếp giống hệt nữa là đủ bộ đôi ghế đẹp cho khu trại rồi!' },
                { id: 'golden_q8',  title: 'Góc Trại Xanh Mát',         items: ['trai_lv3', 'tham_lv2'],             dialogue: 'Trải thêm tấm thảm nhỏ bên cọc lều cho góc nghỉ trưa thật sạch sẽ nào!' },
                { id: 'golden_q9',  title: 'Bàn Kèm Giá Lưới Tiện Lợi', items: ['ban_lv6', 'tham_lv3'],              dialogue: 'Kỹ năng hướng đạo cơ bản: Luôn giữ đồ đạc khô ráo trên bàn và thảm cách nhiệt!' },
                { id: 'golden_q10', title: 'Cặp Ghế Câu Cá (1/2)',      items: ['ghe_lv5', 'trai_lv4'],              dialogue: 'Chuẩn bị ghế câu cá có khay để ngồi thư giãn bên dòng suối trong vắt nhé!' },
                { id: 'golden_q11', title: 'Đôi Ghế Tay Vịn (2/2)',     items: ['ghe_lv4', 'tham_lv4'],              dialogue: 'Tuyệt lắm bạn ơi! Chiếc ghế tay vịn thứ hai sẽ giúp bãi cỏ cân đối hoàn hảo!' },
                { id: 'golden_q12', title: 'Lều Chữ A Chống Gió',       items: ['trai_lv6', 'ban_lv4'],              dialogue: 'Đêm rừng gió lớn mấy cũng yên tâm vì đã có lều chữ A kiên cố!' },
                { id: 'golden_q13', title: 'Bàn Cắm Trại Đa Năng',      items: ['ban_lv7', 'trai_lv5'],              dialogue: 'Tuyệt lắm bạn ơi! Chiếc bàn đa năng này sẽ là tâm điểm của Lều Chính!' },
                { id: 'golden_q14', title: 'Lều Gia Đình Vững Chãi',    items: ['trai_lv7', 'tham_lv5'],             dialogue: 'Khu Lều Chính & Bãi Cỏ Ven Suối của ông nội năm xưa đã hồi sinh rực rỡ rồi!' },
                { id: 'golden_q15', title: 'Cặp Ghế Câu Cá & Biệt Thự', items: ['trai_lv8', 'ghe_lv5'],              dialogue: 'Tự hào về bạn quá! Mọi vị khách đến Thung Lũng Thông Xanh đều tìm thấy bình yên!' }
            ]
        },

        'character04': {
            id: 'character04',
            name: 'Poodle',
            species: 'Chó Poodle Nâu',
            chapter: 'Chương 2',
            unlockText: 'Mở khóa: 5.000 Vàng',
            unlockLevel: 2,
            price: 5000,
            title: 'Poodle — Nghệ Sĩ Glamping & Tiệc Trà',
            campZone: 'Góc Tiệc Trà & Dây Đèn Bờ Suối',
            uniqueGenerator: 'Hộp Vải Thổ Cẩm & Gốm Sứ (Unique)',
            story: 'Từng là nhà thiết kế nội thất nổi tiếng giữa trung tâm thành phố, Poodle cảm thấy cạn kiệt cảm hứng giữa những khối bê tông xám xịt. Chú tìm đến Đồi Thông Xanh để theo đuổi phong cách "Glamping chữa lành" — biến từng chiếc ghế gấp, chiếc bàn vải thổ cẩm và dây đèn vàng thành một tác phẩm nghệ thuật sống.',
            traits: [
                '01. Tinh tế & Cầu toàn thẩm mỹ',
                '02. Duyên dáng, giàu cảm xúc',
                '03. Yêu nghệ thuật pha cà phê thủ công'
            ],
            speechStyle: 'Nhẹ nhàng, bay bổng, hay khen màu sắc và ánh sáng ("Ôi, họa tiết thổ cẩm này hợp với ánh nắng chiều quá!").',
            preferredLines: ['cafe', 'congcu', 'hoa', 'ghe', 'ban'],
            questList: [
                // 15 nhiệm vụ cốt truyện Chương 2 của Poodle (mỗi item <= 3 lần toàn game, phân bổ đều không trùng lặp gần nhau)
                { id: 'poodle_q1',  title: 'Góc Ngồi Thư Giãn',          items: ['ghe_lv2', 'cafe_lv2'],              dialogue: 'Một góc Glamping chữa lành thì không thể thiếu chiếc ghế êm và hương cà phê sớm!' },
                { id: 'poodle_q2',  title: 'Hương Cà Phê Thủ Công',      items: ['cafe_lv3', 'qua_lv2'],              dialogue: 'Tiếng cối xay cà phê thủ công hòa cùng hương cam tươi thật lãng mạn làm sao~' },
                { id: 'poodle_q3',  title: 'Ấm Moka Pot Kiểu Ý',         items: ['cafe_lv4', 'an_lv2'],               dialogue: 'Đặt ấm Moka Pot bên chiếc bánh sừng bò nóng hổi, hương thơm lan tỏa khắp đồi thông!' },
                { id: 'poodle_q4',  title: 'Bàn Trà Thổ Cẩm',            items: ['ban_lv5', 'qua_lv3'],               dialogue: 'Ôi, họa tiết thổ cẩm trên chiếc bàn này hợp với ánh nắng chiều bên bờ suối quá!' },
                { id: 'poodle_q5',  title: 'Tách Cappuccino Nghệ Thuật', items: ['cafe_lv6', 'congcu_lv2'],           dialogue: 'Nhìn lớp bọt sữa Cappuccino mịn màng này xem, đúng chuẩn tiệc trà Glamping!' },
                { id: 'poodle_q6',  title: 'Dây Đèn Đom Đóm Bờ Suối',    items: ['congcu_lv3', 'cafe_lv5'],           dialogue: 'Giăng dây đèn LED đom đóm vàng ấm lên, góc tiệc trà lung linh như tranh vẽ!' },
                { id: 'poodle_q7',  title: 'Cặp Ghế Mặt Trăng (1/2)',    items: ['ghe_lv6', 'hoa_lv2'],               dialogue: 'Ghế Mặt Trăng Moon Chair tròn trịa êm ái là tuyệt tác cho góc thưởng trà!' },
                { id: 'poodle_q8',  title: 'Ánh Đèn Lồng Dịu Nhẹ',       items: ['congcu_lv4', 'hoa_lv3'],            dialogue: 'Ánh đèn lồng cam dịu nhẹ chiếu lên khóm hoa rừng thật nên thơ!' },
                { id: 'poodle_q9',  title: 'Đèn Bão Cổ Điển Vintage',    items: ['congcu_lv6', 'cafe_lv7'],           dialogue: 'Ánh đèn bão cam cổ điển phản chiếu xuống mặt suối đẹp đến nao lòng!' },
                { id: 'poodle_q10', title: 'Đôi Ghế Đạo Diễn (1/2)',     items: ['ghe_lv8', 'hoa_lv4'],               dialogue: 'Ghế Đạo Diễn cao cấp kết hợp hoa đồng nội tinh khôi — chuẩn mực thẩm mỹ!' },
                { id: 'poodle_q11', title: 'Bình Hoa Oải Hương Tím',     items: ['hoa_lv6', 'cafe_lv8', 'congcu_lv5'],dialogue: 'Ôi, sắc tím hoa oải hương đặt cạnh ly cà phê sữa đá mới tinh tế làm sao!' },
                { id: 'poodle_q12', title: 'Cặp Ghế Mặt Trăng (2/2)',    items: ['ghe_lv6', 'ghe_lv7'],               dialogue: 'Thêm chiếc Ghế Mặt Trăng thứ hai và ghế thư giãn cho đôi bạn tri kỷ!' },
                { id: 'poodle_q13', title: 'Lều Chóp Bell Tent Cổ Tích', items: ['trai_lv9', 'congcu_lv8', 'hoa_lv5'],dialogue: 'Chiếc lều Bell Tent màu kem dưới ánh đèn bão đỏ là giấc mơ Glamping của đời mình!' },
                { id: 'poodle_q14', title: 'Đôi Ghế Đạo Diễn (2/2)',     items: ['ghe_lv8', 'cafe_lv9'],              dialogue: 'Hoàn thiện cặp Ghế Đạo Diễn cùng ly trà trái cây nhiệt đới rực rỡ sắc màu!' },
                { id: 'poodle_q15', title: 'Đại Tiệc Trà Hoa Thảo Mộc',  items: ['cafe_lv11', 'ghe_lv9'],             dialogue: 'Ấm trà hoa thảo mộc nóng và ghế nghỉ sang trọng — tuyệt tác chữa lành tâm hồn!' }
            ]
        },

        'character03': {
            id: 'character03',
            name: 'Bulldog',
            species: 'Chó Bulldog Pháp',
            chapter: 'Chương 3',
            unlockText: 'Mở khóa: 9.000 Vàng',
            unlockLevel: 4,
            price: 9000,
            title: 'Bulldog — Kỹ Sư Cơ Khí & Đầu Bếp Lửa Trại',
            campZone: 'Bếp Đá Lửa Trại & Cầu Gỗ Qua Suối',
            uniqueGenerator: 'Hòm Đồ Nghề Thợ Mộc (Unique)',
            story: 'Cựu thợ mộc kiêm bếp trưởng tiệc nướng ngoài trời có tiếng ở thị trấn chân núi. Bulldog không nói nhiều nhưng thấy gì lung lay là phải sửa cho thật chắc chắn. Chú mang theo bộ đồ nghề cơ khí để bắc cây cầu gỗ qua suối xanh và xây một chiếc bếp đá nướng Pizza giòn rụm cho cả trại.',
            traits: [
                '01. Trầm tính nhưng hào sảng',
                '02. Thực tế, trọng chất lượng',
                '03. Đam mê đồ nướng củi và mộc thủ công'
            ],
            speechStyle: 'Ngắn gọn, dứt khoát, ấm áp kiểu đàn anh ("Cứ để anh đóng cái cầu này! Còn em lo nhóm lửa cho nóng nhé!").',
            preferredLines: ['bep', 'an', 'ban', 'antoan'],
            questList: [
                // 15 nhiệm vụ cốt truyện Chương 3 của Bulldog (mỗi item <= 3 lần toàn game, cách xa nhau)
                { id: 'bulldog_q1',  title: 'Bữa Ăn Tiếp Sức Thợ Mộc',    items: ['an_lv3', 'bep_lv2'],                dialogue: 'Làm việc nặng là phải ăn no! Đưa anh ổ Sandwich phô mai để lấy sức xẻ gỗ nhé!' },
                { id: 'bulldog_q2',  title: 'Cơm Cuộn Bên Bờ Suối',       items: ['an_lv4', 'antoan_lv2'],             dialogue: 'Cứ để anh đo đạc mố cầu gỗ! Em chuẩn bị cơm nắm Onigiri và găng tay bảo hộ nhé!' },
                { id: 'bulldog_q3',  title: 'Gia Cố Mặt Bàn Gỗ',          items: ['ban_lv3', 'an_lv5'],                dialogue: 'Bàn trại là phải chắc như bàn thạch! Xong đĩa Kimbap này anh đóng lại khung bàn ngay!' },
                { id: 'bulldog_q4',  title: 'Pizza Nóng Ra Lò',           items: ['an_lv6', 'bep_lv3'],                dialogue: 'Hực! Pizza xúc xích phô mai kéo sợi nóng hổi đây, ăn một miếng là khỏe re!' },
                { id: 'bulldog_q5',  title: 'Đồ Nghề Kỹ Sư Đêm',          items: ['antoan_lv4', 'congcu_lv4'],         dialogue: 'Cáp sạc bọc dù và đèn sạc phải bền bỉ thì ca trực đóng cầu đêm mới chuẩn được!' },
                { id: 'bulldog_q6',  title: 'Bàn Chiến Thuật IGT',        items: ['ban_lv7', 'antoan_lv5'],            dialogue: 'Khung bàn chiến thuật IGT lắp ghép chuẩn từng milimet! Hàng chất lượng đấy!' },
                { id: 'bulldog_q7',  title: 'Pizza Hải Sản Đãi Cả Đội',   items: ['an_lv7', 'ban_lv6'],                dialogue: 'Cầu gỗ qua suối nối xong nhịp đầu rồi! Nướng ngay chiếc Pizza hải sản ăn mừng nào!' },
                { id: 'bulldog_q8',  title: 'Xây Hố Đá Lửa Trại',         items: ['bep_lv4', 'antoan_lv6'],            dialogue: 'Cứ để anh xếp vòng đá lửa trại! Luôn để sẵn túi sơ cứu bên cạnh cho an toàn nhé!' },
                { id: 'bulldog_q9',  title: 'Ngọn Lửa Trại Rực Hồng',     items: ['bep_lv6', 'an_lv8'],                dialogue: 'Lửa trại bùng lên rồi! Đưa xiên cá viên phết sốt vào nướng vàng ruộm thôi!' },
                { id: 'bulldog_q10', title: 'Lò Nướng Than Hoa Tròn',     items: ['bep_lv7', 'antoan_lv7'],            dialogue: 'Có đèn khò gas mini này thì châm lò than hoa chỉ mất 30 giây! Gọn và chuẩn!' },
                { id: 'bulldog_q11', title: 'Trạm Bếp Nấu Ăn Glamping',   items: ['ban_lv8', 'bep_lv8', 'an_lv9'],     dialogue: 'Trạm bếp gỗ kết hợp bếp nướng inox và xiên tôm sa tế — đúng tay nghề bếp trưởng!' },
                { id: 'bulldog_q12', title: 'Bàn Tiệc Gỗ Sồi Hoàng Gia',  items: ['ban_lv9', 'bep_lv9'],               dialogue: 'Gỗ sồi nguyên khối anh tự tay bào nhẵn đấy! Bày tiệc nướng lên đây thì hết ý!' },
                { id: 'bulldog_q13', title: 'Mực Nướng Sa Tế Đỏ Lửa',     items: ['an_lv10', 'bep_lv5'],               dialogue: 'Bếp nướng giữ nhiệt cực tốt, nướng mực tươi nguyên con thơm điếc mũi luôn!' },
                { id: 'bulldog_q14', title: 'Lò Đá Nướng Pizza & BBQ',    items: ['bep_lv11'],                         dialogue: 'Đỉnh cao lửa trại! Bếp nướng chân cao nung đỏ lửa chuẩn bài bếp trưởng!' },
                { id: 'bulldog_q15', title: 'Đại Trạm Bếp Trưởng Bulldog',items: ['bep_lv12'],                         dialogue: 'Cầu gỗ đã vững, đại trạm bếp BBQ đã xong! Tự hào tay nghề anh em mình!' }
            ]
        },

        'character10': {
            id: 'character10',
            name: 'Ba Tư',
            species: 'Mèo Ba Tư Trắng',
            chapter: 'Chương 4',
            unlockText: 'Mở khóa: 20.000 Vàng',
            unlockLevel: 7,
            price: 20000,
            title: 'Ba Tư — Nhà Thảo Mộc & Kiểm Lâm Rừng Thông',
            campZone: 'Vườn Nấm Đỏ & Cây Thông Tổ Ong',
            uniqueGenerator: 'Sổ Ép Tiêu Bản Thực Vật (Unique)',
            story: 'Nhà thực vật học kiêm kiểm lâm yêu sự tĩnh lặng. Khi thấy cây cầu gỗ mới nối sang bìa rừng thông phía đông, cô mèo Ba Tư lập tức xuất hiện để bảo vệ hệ sinh thái nấm hương, dâu rừng và tổ ong vàng quý hiếm trên tán cây. Cô dạy người chơi cách thu hoạch bền vững mà không tốn sức.',
            traits: [
                '01. Điềm đạm, quý phái kiểu mèo',
                '02. Uyên bác về thiên nhiên',
                '03. Khó tính lúc đầu nhưng rất chu đáo'
            ],
            speechStyle: 'Lịch thiệp, nhẹ nhàng nhưng có chút kiêu kỳ dễ thương ("Meo~ Đừng giẫm lên khóm nấm đỏ ấy chứ, để tôi chỉ cách hái đúng điệu!").',
            preferredLines: ['hoa', 'qua', 'cafe', 'thucung', 'tham'],
            questList: [
                // 15 nhiệm vụ cốt truyện Chương 4 của Ba Tư (mỗi item <= 3 lần toàn game, cách xa nhau >= 4 nhiệm vụ)
                { id: 'batu_q1',  title: 'Trái Ngọt Bìa Rừng Thông',    items: ['qua_lv4', 'tham_lv3'],              dialogue: 'Meo~ Đừng giẫm lên khóm nấm đỏ ấy chứ! Trải thảm ra rồi thưởng thức lê rừng mát lịm này đi!' },
                { id: 'batu_q2',  title: 'Bảo Vệ Thảm Thực Vật',        items: ['antoan_lv3', 'qua_lv5', 'cafe_lv4'],dialogue: 'Vào rừng thông của tôi là phải giữ gìn vệ sinh sạch sẽ và thu hoạch đúng điệu nhé~' },
                { id: 'batu_q3',  title: 'Dứa Vàng & Trà Thảo Mộc',     items: ['qua_lv6', 'cafe_lv6'],              dialogue: 'Purr... Trái dứa rừng chín mọng thắt nơ này có hương thơm thật thanh khiết!' },
                { id: 'batu_q4',  title: 'Rổ Dâu Tây Đồi Cao Nguyên',   items: ['qua_lv7', 'thucung_lv2'],           dialogue: 'Meo~ Những quả dâu tây đỏ mọng sương sớm này chỉ mọc ở sườn đồi thông phía đông thôi đấy!' },
                { id: 'batu_q5',  title: 'Góc Nghỉ Kiểm Lâm Quý Phái',  items: ['tham_lv6', 'congcu_lv5'],           dialogue: 'Kiểm lâm cũng cần một chiếc đệm êm và ánh sáng dịu để ghi chép sổ tiêu bản thực vật chứ~' },
                { id: 'batu_q6',  title: 'Tiêu Bản Hoa Đồng Nội',       items: ['hoa_lv4', 'thucung_lv3'],           dialogue: 'Cúc trắng, oải hương tím, mao lương vàng — hệ sinh thái Đồi Thông Xanh thật kỳ diệu!' },
                { id: 'batu_q7',  title: 'Đĩa Việt Quất Rừng Xanh',     items: ['qua_lv8', 'hoa_lv5'],               dialogue: 'Meo~ Việt quất rừng giàu dưỡng chất đặt cạnh lọ hoa cúc trắng mới thanh lịch làm sao!' },
                { id: 'batu_q8',  title: 'Hũ Trà Đào Cam Sả Thanh Mát', items: ['cafe_lv10', 'hoa_lv6'],             dialogue: 'Tôi đã pha công thức trà đào cam sả kết hợp hương oải hương rừng giúp bạn thư giãn đây~' },
                { id: 'batu_q9',  title: 'Giỏ Mây Trái Cây Thượng Hạng',items: ['qua_lv9', 'qua_lv6'],               dialogue: 'Tuyệt phẩm của rừng thông! Giỏ mây đầy ắp trái ngọt thu hoạch bền vững mà không hại cây rừng!' },
                { id: 'batu_q10', title: 'Bình Hoa Mao Lương Nắng Mai', items: ['hoa_lv7', 'tham_lv7'],              dialogue: 'Đặt bình hoa mao lương vàng rực bên đệm nghỉ đôi, hương rừng sẽ ru bạn ngủ thật ngon~' },
                { id: 'batu_q11', title: 'Món Quà Nhỏ Cho Thú Rừng',    items: ['thucung_lv4', 'qua_lv7'],           dialogue: 'Các bé thú nhỏ quanh Vườn Nấm Đỏ cũng thích nô đùa với chiếc đĩa bay cầu vồng này lắm!' },
                { id: 'batu_q12', title: 'Đệm Tròn Dấu Chân Êm Ái',     items: ['thucung_lv7', 'hoa_lv8'],           dialogue: 'Meo~ Chiếc đệm tròn viền dây thừng và bình hoa thảo nguyên này rất hợp với gu của tôi!' },
                { id: 'batu_q13', title: 'Ấm Trà Hoa Thảo Mộc Cổ Điển', items: ['thucung_lv6', 'qua_lv8'],           dialogue: 'Thưởng thức hương trái ngọt ấm áp giữa sương rừng là nghệ thuật sống đấy~' },
                { id: 'batu_q14', title: 'Khu Bảo Tồn Thú Cưng Rừng',   items: ['thucung_lv9', 'hoa_lv7'],           dialogue: 'Tuy lúc đầu tôi hơi khắt khe, nhưng bạn đã chăm sóc khu rừng và thú cưng rất chu đáo!' },
                { id: 'batu_q15', title: 'Đại Bình Trà Thảo Nguyên',    items: ['cafe_lv12', 'hoa_lv9'],             dialogue: 'Purr~ Vườn Nấm Đỏ & Cây Thông Tổ Ong nay đã trở thành thiên đường sinh thái tuyệt đẹp!' }
            ]
        },

        'character07': {
            id: 'character07',
            name: 'Mèo Anh',
            species: 'Mèo Anh Lông Ngắn Xám',
            chapter: 'Chương 5',
            unlockText: 'Mở khóa: 50.000 Vàng',
            unlockLevel: 10,
            price: 50000,
            title: 'Mèo Anh — Thương Nhân Hậu Cần & Chủ Kho Báu',
            campZone: 'Quầy Tiếp Tế & Dốc Sương Mù Bắc',
            story: 'Ông chủ chuỗi xe hàng dã ngoại lưu động nổi tiếng khắp các thung lũng. Nghe tin Đồi Thông Xanh có mật ong rừng và đặc sản trứ danh, Mèo Anh lập tức đánh xe tới mở Trạm Giao Thương. Chú cũng chính là người nắm giữ tấm bản đồ cũ chỉ ra lối xuyên qua màn sương mù phía bắc khu trại.',
            traits: [
                '01. Khôn ngoan & Nhạy bén kinh doanh',
                '02. Sành ăn (cực mê Sandwich & BBQ)',
                '03. Hào phóng với đối tác uy tín'
            ],
            speechStyle: 'Vui vẻ, tính toán nhanh nhạy ("Khách đông thế này là hốt bạc rồi! Giao nhanh cho tôi đơn này, tôi thưởng thêm Rương Tiền nhé!").',
            preferredLines: ['an', 'qua', 'antoan', 'tham', 'bep'],
            isMerchantBonusNpc: true,
            questList: [
                // 15 nhiệm vụ cốt truyện Chương 5 của Mèo Anh (mỗi item <= 3 lần toàn game, không lặp gần nhau)
                { id: 'meoanh_q1',  title: 'Khai Trương Quầy Tiếp Tế',     items: ['an_lv5', 'qua_lv5', 'bep_lv4'],     isHappyOrder: true, dialogue: 'Khách đông thế này là hốt bạc rồi! Giao nhanh đơn khai trương này, tôi thưởng thêm quà nhé!' },
                { id: 'meoanh_q2',  title: 'Combo Sandwich & Cà Phê Sữa', items: ['an_lv6', 'cafe_lv7'],               isHappyOrder: false,dialogue: 'Thương nhân sành ăn như tôi nhìn chiếc Pizza và ly cà phê mát lạnh này là biết đắt hàng ngay!' },
                { id: 'meoanh_q3',  title: 'Nguồn Điện Cho Xe Hàng Lưu Động',items: ['antoan_lv7', 'bep_lv6'],          isHappyOrder: true, dialogue: 'Quầy Tiếp Tế ở Dốc Sương Mù Bắc cần lửa ấm và đồ nghề xịn, đối tác lo giúp tôi nhé!' },
                { id: 'meoanh_q4',  title: 'Quạt Mát & Trái Cây Đặc Sản', items: ['antoan_lv8', 'qua_lv7', 'tham_lv6'],isHappyOrder: false,dialogue: 'Làm ăn uy tín là phải chu đáo! Khách vừa có quạt mát, đệm êm lại được ăn dâu tây rừng!' },
                { id: 'meoanh_q5',  title: 'Tiệc Xiên Nướng Hốt Bạc',     items: ['an_lv8', 'bep_lv7'],                isHappyOrder: true, dialogue: 'Mùi xiên nướng thơm phức thế này khách xếp hàng dài cả dốc núi! Giao ngay nhận thưởng lớn!' },
                { id: 'meoanh_q6',  title: 'Pin Mặt Trời Trạm Giao Thương',items: ['antoan_lv9', 'ban_lv9'],            isHappyOrder: false,dialogue: 'Đầu tư tấm pin năng lượng mặt trời này là bài toán kinh doanh siêu lợi nhuận, tiết kiệm điện!' },
                { id: 'meoanh_q7',  title: 'Tôm Nướng Sa Tế & Trà Nhiệt Đới',items: ['an_lv9', 'cafe_lv9', 'qua_lv8'],  isHappyOrder: true, dialogue: 'Thực đơn VIP của Trạm Giao Thương! Giao đơn này tôi bật mí một góc bản đồ Dốc Sương Mù Bắc!' },
                { id: 'meoanh_q8',  title: 'Giường Xếp Nghỉ Trưa Thương Nhân',items: ['tham_lv8', 'bep_lv8'],           isHappyOrder: false,dialogue: 'Kiếm tiền cả sáng rồi, ông chủ như tôi cũng phải có chiếc giường xếp khung nhôm ngả lưng chứ!' },
                { id: 'meoanh_q9',  title: 'Âm Nhạc Khuấy Động Phiên Chợ',items: ['antoan_lv10', 'bep_lv9'],           isHappyOrder: true, dialogue: 'Bật loa Bluetooth xập xình bên bếp than hồng, doanh thu Quầy Tiếp Tế tăng gấp đôi luôn!' },
                { id: 'meoanh_q10', title: 'Đệm Chăn Bông & Giỏ Trái Cây', items: ['tham_lv9', 'qua_lv9'],              isHappyOrder: true, dialogue: 'Hàng thượng hạng cho khách VIP! Đối tác uy tín như bạn xứng đáng nhận thưởng hậu hĩnh!' },
                { id: 'meoanh_q11', title: 'Đại Tiệc Hải Sản & Quầy Bar',  items: ['ban_lv10', 'an_lv7'],               isHappyOrder: false,dialogue: 'Bàn Quầy Bar cắm trại kết hợp pizza hải sản — thương vụ triệu vàng của chúng ta đây rồi!' },
                { id: 'meoanh_q12', title: 'Trạm Sạc Dự Phòng Hậu Cần',    items: ['antoan_lv11', 'bep_lv10'],          isHappyOrder: true, dialogue: 'Có trạm sạc dự phòng này, màn sương mù phía bắc dày đặc mấy cũng không làm khó được đoàn xe!' },
                { id: 'meoanh_q13', title: 'Đùi Heo BBQ Độc Quyền',        items: ['an_lv11'],                          isHappyOrder: true, dialogue: 'Món tủ tôi mê nhất: Đùi heo nướng BBQ bóng mật ong! Giao liền tay, rương thưởng mở ngay!' },
                { id: 'meoanh_q14', title: 'Trạm Năng Lượng Glamping',     items: ['antoan_lv12', 'tham_lv8'],          isHappyOrder: true, dialogue: 'Đỉnh cao hậu cần! Trạm năng lượng Glamping cấp điện cho toàn bộ Dốc Sương Mù Bắc!' },
                { id: 'meoanh_q15', title: 'Trao Tấm Bản Đồ Xuyên Sương Mù',items: ['ban_lv12'],                        isHappyOrder: true, dialogue: 'Đối tác số một của tôi! Tấm bản đồ cổ mở lối lên Đỉnh Rừng Thông & Đài Thiên Văn là của bạn!' }
            ]
        },

        'character06': {
            id: 'character06',
            name: 'Xiêm',
            species: 'Mèo Xiêm Thanh Thoát',
            chapter: 'Chương 6',
            unlockText: 'Mở khóa: 68.000 Vàng',
            unlockLevel: 13,
            price: 68000,
            title: 'Xiêm — Nhà Thám Hiểm Đỉnh Cao & Kẻ Săn Sao',
            campZone: 'Đỉnh Rừng Thông & Đài Thiên Văn',
            story: 'Nhà leo núi chuyên nghiệp và người yêu thiên văn học từng chinh phục mọi đỉnh núi trong vùng. Khi màn sương mù phía bắc Đồi Thông Xanh tan đi, Xiêm xuất hiện với chiếc khăn vàng đặc trưng, mời người chơi dựng Đài Quan Sát Sao và mở ra chuỗi Chuyến Thám Hiểm Tuần tới những vùng đất kỳ thú mới.',
            traits: [
                '01. Điềm tĩnh & Sắc sảo',
                '02. Ưa chinh phục thử thách cấp cao',
                '03. Trân trọng vẻ đẹp bầu trời đêm'
            ],
            speechStyle: 'Trầm lắng, sâu sắc, truyền cảm hứng chinh phục ("Đằng sau màn sương mù luôn là bầu trời sao đẹp nhất. Bạn sẵn sàng cho hành trình mới chưa?").',
            preferredLines: ['cauca', 'congcu', 'trai', 'antoan', 'thucung'],
            questList: [
                // 15 nhiệm vụ cốt truyện Chương 6 của Xiêm (mỗi item <= 3 lần toàn game, cách xa nhau >= 4 nhiệm vụ)
                { id: 'xiem_q1',  title: 'Vượt Qua Màn Sương Mù Bắc',   items: ['cauca_lv3', 'congcu_lv6'],           dialogue: 'Đằng sau màn sương mù luôn là bầu trời sao đẹp nhất. Bạn sẵn sàng cho hành trình mới chưa?' },
                { id: 'xiem_q2',  title: 'Câu Cá Suối Thượng Nguồn',    items: ['cauca_lv4', 'thucung_lv5', 'bep_lv6'],dialogue: 'Dòng suối trên đỉnh núi trong vắt, thả cần câu trúc và tận hưởng sự tĩnh lặng của đại ngàn.' },
                { id: 'xiem_q3',  title: 'Cần Câu Máy & Đèn Bão Xanh',  items: ['cauca_lv5', 'congcu_lv7'],           dialogue: 'Một nhà thám hiểm sắc sảo luôn chuẩn bị thiết bị chuẩn xác trước khi màn đêm buông xuống.' },
                { id: 'xiem_q4',  title: 'Liên Lạc Từ Đỉnh Rừng Thông', items: ['cauca_lv6', 'antoan_lv8'],           dialogue: 'Tín hiệu bộ đàm từ Đỉnh Rừng Thông đã thông suốt! Gió trên cao thật mát lành.' },
                { id: 'xiem_q5',  title: 'Ống Nhòm Quan Sát Tinh Vân',  items: ['cauca_lv7', 'congcu_lv9'],           dialogue: 'Qua ống nhòm xanh rêu và ánh đèn măng-xông, dải Ngân Hà hiện lên rõ từng chòm sao.' },
                { id: 'xiem_q6',  title: 'Hạ Thủy Thuyền Kayak Vượt Thác',items: ['cauca_lv8', 'thucung_lv7'],        dialogue: 'Khoảnh khắc chinh phục! Hạ thủy thuyền Kayak cam vượt dòng thác thượng nguồn Đồi Thông Xanh!' },
                { id: 'xiem_q7',  title: 'Lều Vòm Cầu Geodesic Ngắm Sao',items: ['trai_lv10', 'congcu_lv10'],         dialogue: 'Lều Dome kính thiên văn Geodesic giúp chúng ta nằm ngắm trọn vẹn bầu trời sao đêm!' },
                { id: 'xiem_q8',  title: 'Đôi Ghế Bập Bênh Ngắm Sao (1/2)',items: ['ghe_lv10', 'thucung_lv8'],        dialogue: 'Ngả lưng trên ghế bập bênh nhâm nhi trà ấm và đếm sao băng cùng tôi nhé.' },
                { id: 'xiem_q9',  title: 'Đèn Măng-Xông Đồng Săn Sao',  items: ['congcu_lv11', 'cauca_lv6'],          dialogue: 'Ánh sáng vàng dịu của đèn măng-xông đồng không làm lóa mắt khi quan sát thiên văn.' },
                { id: 'xiem_q10', title: 'Lều Thổ Cẩm Cho Đội Thám Hiểm Nhí',items: ['thucung_lv11', 'cauca_lv7'],    dialogue: 'Đội thú cưng thám hiểm đã có chiếc lều thổ cẩm riêng bên cạnh đài quan sát!' },
                { id: 'xiem_q11', title: 'Biệt Thự Vòm Đài Thiên Văn',  items: ['trai_lv11', 'cauca_lv8'],            dialogue: 'Biệt thự vòm sàn gỗ với dải đèn LED ấm áp — trạm dừng chân mơ ước trên Đỉnh Rừng Thông!' },
                { id: 'xiem_q12', title: 'Đèn Cực Quang Thượng Hạng',   items: ['congcu_lv12'],                       dialogue: 'Kiệt tác ánh sáng! Chiếc đèn măng-xông hoàng gia tỏa sáng như dải cực quang giữa rừng đêm!' },
                { id: 'xiem_q13', title: 'Bạn Đồng Hành Trên Đỉnh Cao', items: ['thucung_lv10', 'cauca_lv9'],         dialogue: 'Những người bạn nhỏ trên đỉnh núi cũng háo hức đón chờ cơn mưa sao băng đêm nay.' },
                { id: 'xiem_q14', title: 'Đôi Ghế Bập Bênh Ngắm Sao (2/2)',items: ['ghe_lv10', 'tham_lv9'],           dialogue: 'Đủ hai chiếc ghế bập bênh trên Đài Thiên Văn rồi — nơi bầu trời gần mặt đất nhất!' },
                { id: 'xiem_q15', title: 'Lâu Đài Cắm Trại Đỉnh Cao',   items: ['trai_lv12'],                         dialogue: 'Đỉnh cao thám hiểm! Bạn đã chinh phục trọn vẹn 6 Chương của Đồi Thông Xanh!' }
            ]
        }
    },

    // Cấu hình nhóm nhiệm vụ khởi đầu mặc định khi tạo tài khoản mới (Golden & Poodle nối liền nhau)
    initialOrders: {
        petId: 'character01',
        orders: [
            { id: 'trai_lv2', slotType: 'hard', desc: 'Golden Slot 1: Lều trại Lv.2' },
            { id: 'ban_lv2',  slotType: 'medium', desc: 'Golden Slot 2: Bàn xếp Lv.2' }
        ]
    },

    // -------------------------------------------------------------------------
    // 3. TÀI NGUYÊN TÀI KHOẢN MỚI BAN ĐẦU (INITIAL PLAYER PROFILE)
    // -------------------------------------------------------------------------
    initialProfile: {
        coins: 500,     // Vàng khởi đầu cân bằng vừa phải
        gems: 25,       // Kim Cương khởi đầu
        energy: 110     // Năng lượng khởi đầu đủ chơi mượt Lv.1 -> Lv.4-5
    },

    // -------------------------------------------------------------------------
    // 4. HỆ THỐNG NĂNG LƯỢNG (ENERGY SYSTEM - CÂN BẰNG CHO GAME THUẦN ADS)
    // -------------------------------------------------------------------------
    energy: {
        startEnergy: 110,           // Năng lượng ban đầu khi tạo tài khoản
        maxEnergyBase: 100,         // Năng lượng tối đa ở Level 1
        maxEnergyPerLevel: 2,       // Mỗi cấp độ tăng thêm +2 giới hạn năng lượng tối đa
        maxEnergyCap: 150,          // Giới hạn kịch trần thanh năng lượng tự hồi
        regenIntervalSec: 60,       // Thời gian hồi phục 1 điểm Năng lượng: 60 giây (100 phút đầy bình 100⚡)
        overflowCap: 999,           // Trần năng lượng tràn khi nhận thưởng (Ads/Rương/Lên cấp) vượt bình
        levelUpEnergy: 30,          // Thưởng năng lượng mỗi lần lên cấp (cộng thẳng, có thể tràn bình)
        levelUpCoinsBase: 200,      // Vàng lên cấp = base + perLevel * cấp mới
        levelUpCoinsPerLevel: 50,
        levelUpGems: 2,             // Kim cương mỗi cấp
        levelUpGemsMilestone: 5     // Kim cương ở mốc chia hết cho 5 (Lv.5, 10, 15...)
    },

    // -------------------------------------------------------------------------
    // 5. TRẠM TIẾP NĂNG LƯỢNG (ENERGY SHOP)
    // Cân bằng chuẩn Ad-Supported: 1⚡ ≈ 40 Vàng (để Vàng không làm mất giá trị xem Ads +40⚡)
    // -------------------------------------------------------------------------
    energyShop: {
        coinPacks: [
            { energy: 30, coinCost: 1200, desc: 'Dùng Vàng mua 30 Năng Lượng' },
            { energy: 60, coinCost: 2200, desc: 'Dùng Vàng mua 60 Năng Lượng (Tiết kiệm ~8%)' }
        ],
        coinPack: {
            energy: 30,
            coinCost: 1200
        },
        gemPack: {
            energy: 50,
            gemCost: 5              // 5 Kim Cương = 50 Năng Lượng (tỷ lệ chuẩn 1💎 = 10⚡)
        },
        rescue: {
            enabled: true,
            amount: 25,             // Cứu trợ khẩn cấp 25⚡ khi hết sạch năng lượng
            dailyLimit: 2           // Tối đa 2 lần/ngày (chống lặp vô hạn làm mất giá trị xem Ads)
        }
    },

    // -------------------------------------------------------------------------
    // 6. NGÂN HÀNG ĐỔI KIM CƯƠNG RA VÀNG (COIN EXCHANGE)
    // -------------------------------------------------------------------------
    coinExchangePacks: [
        {
            id: 'coin_pack_1',
            name: 'Túi Vàng Nhỏ',
            coins: 1500,
            gemCost: 5,
            badge: null,
            desc: 'Đổi từ 5 Kim Cương (1💎 = 300🪙)'
        },
        {
            id: 'coin_pack_2',
            name: 'Rương Vàng Lớn',
            coins: 5000,
            gemCost: 15,
            badge: 'TIẾT KIỆM 15%',
            desc: 'Đổi từ 15 Kim Cương (1💎 = 333🪙)'
        },
        {
            id: 'coin_pack_3',
            name: 'Kho Vàng Hoàng Gia',
            coins: 11000,
            gemCost: 30,
            badge: 'SIÊU LỜI +22%',
            desc: 'Đổi từ 30 Kim Cương (1💎 = 367🪙)'
        }
    ],

    // -------------------------------------------------------------------------
    // 7. CÂN BẰNG THƯỞNG TRONG VÁN CHƠI (GAMEPLAY ECONOMY & REWARDS)
    // -------------------------------------------------------------------------
    gameplay: {
        // Công tắc bật/tắt nhanh bong bóng trò chuyện NPC & các hint gợi ý trên bàn chơi (đổi thành true khi muốn mở lại)
        showNpcSpeechBubble: false,
        showBoardHints: false,

        // Hệ số thưởng Vàng khi nộp đơn hàng & bán đồ (đọc theo bảng cân bằng theo EV máy phát, chống lạm phát & chống farm vô hạn)
        orderRewardMultiplier: 12,
        itemGoldByLevel: {
            1: 10, 2: 22, 3: 46, 4: 90, 5: 165, 6: 280,
            7: 440, 8: 680, 9: 1020, 10: 1500, 11: 2150, 12: 3000
        },

        // Hệ số tính giá bán vật phẩm trên bàn cờ (~15% giá trị đơn hàng, luôn thấp hơn giá mua 40🪙/⚡)
        sellMultiplier: 5,
        sellMinLevel: 1,
        sellDivisor: 1,
        itemSellByLevel: {
            1: 2, 2: 4, 3: 8, 4: 15, 5: 28, 6: 50,
            7: 85, 8: 140, 9: 225, 10: 360, 11: 550, 12: 800
        },

        // Thưởng Vàng và Kim Cương trực tiếp khi tạo ra vật phẩm cấp rất cao (Lv.8+)
        // Các cấp Lv.4 - Lv.7 đã có cơ chế rớt Xu/Năng lượng trực tiếp lên bàn chơi (board_coin / board_energy) nên đặt = 0 để không thưởng trùng
        mergeRewards: {
            2: { coins: 0, gems: 0 },
            3: { coins: 0, gems: 0 },
            4: { coins: 0, gems: 0 },
            5: { coins: 0, gems: 0 },
            6: { coins: 0, gems: 0 },
            7: { coins: 0, gems: 0 },
            8: { coins: 5, gems: 0 },
            9: { coins: 10, gems: 0 },
            10: { coins: 20, gems: 1 }
        },

        // Chuỗi Combo ghép đồ liên tiếp:
        // Tắt thưởng Vàng bay trực tiếp (enabled: false) vì đã có cơ chế sinh Xu trên bàn chơi (board_coin_lv1..5).
        // Giữ lại hiệu ứng âm nhạc leo thang âm & huy hiệu Combo thị giác, chỉ rớt 1 Xu Lv.1 lên bàn khi đạt mốc Combo cao (x6, x12).
        combo: {
            enabled: false,
            windowSec: 3.8,
            baseCoins: 0,
            stepCoins: 0,
            maxCoins: 0,
            boardCoinEveryNCombos: 6
        },

        // Hệ số nhân điểm kinh nghiệm EXP nhận được từ mỗi đơn hàng (mặc định: 1.0)
        orderExpMultiplier: 1.0,

        // Nhấp liên tiếp vào thùng sinh đồ
        generatorBulkClicks: 6,
        generatorClickWindowMs: 550,

        // Cấu hình Âm thanh SFX chủ đạo: Bộ Kalimba Sáng Trong (bright_kalimba - Sáng, Mộc Ấm, Trong Trẻo)
        // Người chơi / nhà phát triển có thể tinh chỉnh, chọn thư viện mẫu âm thanh miễn phí hoặc phối nhạc nền tại sfx-studio.html
        audioSfx: {
            presetName: 'bright_kalimba',
            masterVolume: 1.15,
            bgmVolume: 0.14,
            preferredBgmIndex: 0,        // Mặc định chọn bài đang có trong assets/music/ (Ukulele_Suoi_Nang.wav) lặp liền mạch
            pitchSemitoneOffset: 0,      // Cho phép nâng/hạ cao độ toàn bộ game (-12 đến +24 bán cung)
            brightnessHighShelfDb: 5.5,  // Độ sáng Treble vừa vặn giúp tiếng Kalimba trong trẻo mà không bị chói gắt
            sparkleBellMix: 0.30,        // Độ ngân phím đàn Kalimba mộc sáng
            // 1. Tiếng bấm máy phát sinh đồ: Pop giọt sương + Gảy phím Kalimba B5 (987.77Hz) sáng giòn 45ms
            spawn: {
                fStart: 480,
                fEnd: 1180,
                duration: 0.045,
                gain: 0.16,
                bellFreq: 987.77,
                woodFreq: 392,
                woodGain: 0.09,
                filterCutoff: 4600,
                jitter: 0.035
            },
            // 2. Tiếng đặt/di chuyển đồ sang ô trống: tiếng gõ phím Kalimba nhẹ thanh thoát 24ms
            move: {
                fStart: 520,
                fEnd: 840,
                duration: 0.024,
                gain: 0.05,
                filterCutoff: 3400
            },
            // 3. Tiếng ghép đồ cố định theo từng Cấp độ vật phẩm (Level 1 -> 7 tăng từ C5 -> B5, từ Level 8 vòng lại C5 -> G5):
            // Ghép cùng cấp thì giữ nguyên cao độ của cấp đó; chỉ khi ghép nâng lên cấp cao hơn thì âm thanh mới thay đổi!
            merge: {
                fixedByItemLevel: true,
                baseNotes: [
                    523.25,  // Level 1: C5 (Đô 5)
                    587.33,  // Level 2: D5 (Rê 5)
                    659.25,  // Level 3: E5 (Mi 5)
                    698.46,  // Level 4: F5 (Pha 5)
                    783.99,  // Level 5: G5 (Son 5)
                    880.00,  // Level 6: A5 (La 5)
                    987.77,  // Level 7: B5 (Si 5)
                    523.25,  // Level 8: Vòng lại C5 (Đô 5)
                    587.33,  // Level 9: D5 (Rê 5)
                    659.25,  // Level 10: E5 (Mi 5)
                    698.46,  // Level 11: F5 (Pha 5)
                    783.99   // Level 12: G5 (Son 5)
                ],
                popRatioStart: 0.58,
                popDuration: 0.024,
                bodyDuration: 0.115,
                gain: 0.18,
                harmonic2Gain: 0.30,
                sparkleGain: 0.09,
                filterCutoff: 4800,
                waveType: 'sine'
            },
            // 4. Tiếng sinh Bong Bóng: tiếng bong bóng nước + gảy Kalimba C6 (420Hz -> 980Hz -> 1480Hz)
            bubble: {
                fStart: 420,
                fMid: 980,
                fEnd: 1480,
                duration: 0.120,
                gain: 0.16
            },
            // 5. Tiếng cảnh báo Bàn Cờ Đầy: 2 nốt gõ Kalimba mộc D5 -> A4 (587.33Hz -> 440Hz) lịch sự, rõ ràng
            full_board: {
                f1: 587.33,
                f2: 440.00,
                duration: 0.065,
                gap: 0.065,
                gain: 0.13,
                filterCutoff: 2400
            },
            // 6. Tiếng hoàn thành món trong đơn hàng: Tam âm Kalimba sáng trong (G5 -> C6 -> E6)
            order_ready: {
                note1: 783.99,
                note2: 1046.50,
                note3: 1318.51,
                gap: 0.052,
                duration: 0.130,
                gain: 0.15
            },
            // 7. Tiếng xu bay & thu hoạch vàng: tiếng chuông Kalimba vàng trong trẻo (C6 -> A6)
            coin: {
                baseFreq: 1318.51,
                duration: 0.110,
                gain: 0.10,
                shimmerRatio: 2.3,
                filterCutoff: 5200
            }
        },

        // Tỷ lệ rơi vật phẩm từ 3 nguồn phát (Thùng chứa / Xe kéo / Ba lô)
        // Tăng tỷ lệ rơi thẳng Lv.2 và Lv.3 ngay từ đầu game để giảm 55% số lượng đồ Lv.1 gây chật bàn cờ!
        generatorDrops: {
            // Ưu tiên sinh đúng các nhánh đang cần trên thanh nhiệm vụ (1 nhánh: 100%; >=2 nhánh: chia đều 50/50 hoặc 33/33/33; 0 nhánh cần: chia đều toàn bộ nhánh máy phát)
            prioritizeQuestBranches: true,
            equalBranchDistribution: true,
            // Ưu tiên chọn món trong túi cân bằng khớp với món lẻ đang nằm chờ ghép trên bàn cờ khi bàn sắp đầy
            smartPairAssist: true,
            branchWeights: {
                generator_cooler:   { ban: 1, ghe: 1, trai: 1 },       // Xe Kéo: Bàn, Ghế, Lều
                generator_backpack: { an: 1, qua: 1, cafe: 1 },        // Giỏ Picnic: Đồ Ăn, Hoa Quả, Cà Phê
                generator_crate:    { congcu: 1, antoan: 1, tham: 1 }, // Ba Lô Sinh Tồn: Đèn/Công Cụ, An Toàn, Chỗ Ngủ
                generator_wood:     { bep: 1, hoa: 1 },                // Gốc Cây Thảo Mộc: Lửa & Bếp, Hoa Rừng
                generator_animal:   { thucung: 1, cauca: 1 }           // Giỏ Thú Cưng & Câu Cá: Đồ Chơi Thú Cưng, Câu Cá & Thám Hiểm
            },
            minLevelForTierDrops: 4,    // Bắt đầu sinh đồ Lv.2 từ Level 4 (Level 1-3 sinh 100% đồ Lv.1)
            minLevelForLv3Drops: 8,     // Từ Level 8 trở lên bắt đầu pha thêm đồ Lv.3 mượt mà (không bị tụt EV)
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
            // Chế độ Siêu Cấp (Capstone Boost): Chỉ kích hoạt cho máy phát đang gánh nhiệm vụ đỉnh cao Lv.11 - Lv.12
            // giúp món Lv.11-12 nằm trong ~1 bình năng lượng (165-260⚡) thay vì kéo dài 4-6 tiếng
            capstoneQuestDrops: {
                lv11: { lv5: 0.20, lv4: 0.50, lv3: 0.30, lv2: 0.00 },
                lv12: { lv5: 0.40, lv4: 0.45, lv3: 0.15, lv2: 0.00 }
            },
            tiers: [
                { maxLevel: 3,  lv1: 1.00, lv2: 0.00, lv3: 0.00, lv4: 0.00 }, // Level 1-3:  100% Cấp 1 (EV 1.00)
                { maxLevel: 5,  lv1: 0.50, lv2: 0.50, lv3: 0.00, lv4: 0.00 }, // Level 4-5:  50% C1, 50% C2 (EV 1.50)
                { maxLevel: 7,  lv1: 0.25, lv2: 0.75, lv3: 0.00, lv4: 0.00 }, // Level 6-7:  25% C1, 75% C2 (EV 1.75)
                { maxLevel: 9,  lv1: 0.15, lv2: 0.60, lv3: 0.25, lv4: 0.00 }, // Level 8-9:  15% C1, 60% C2, 25% C3 (EV 2.35)
                { maxLevel: 11, lv1: 0.00, lv2: 0.50, lv3: 0.40, lv4: 0.10 }, // Level 10-11: 50% C2, 40% C3, 10% C4 (EV 3.40)
                { maxLevel: 99, lv1: 0.00, lv2: 0.20, lv3: 0.30, lv4: 0.50 }  // Level 12+:  50% C4, 30% C3, 20% C2 (EV 5.60)
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
    // 9. THƯỞNG SỔ TAY CẨM NANG KHÁM PHÁ (DISCOVERY BOOK - 1.1)
    // -------------------------------------------------------------------------
    discoveryBook: {
        coinsMultiplier: 25,
        gemUnlockMinLevel: 5,
        gemsReward: 1,
        gemsHighMinLevel: 8,
        gemsHighReward: 2,
        gemsCapstoneMinLevel: 10,
        gemsCapstoneReward: 3,
        chainCompletionReward: {
            energy: 30,
            gems: 5,
            coins: 300
        }
    },

    // -------------------------------------------------------------------------
    // 9B. THƯỞNG ĐIỂM DANH MỖI NGÀY (7 NGÀY + MỐC TÍCH LŨY 8/15/22/30 NGÀY)
    // Ngày 1 -> 6: Mỗi ngày chỉ thưởng 1 loại (Vàng HOẶC Năng lượng HOẶC Kim cương)
    // Ngày 7: Thưởng lớn cả 3 loại
    // -------------------------------------------------------------------------
    dailyPass: {
        cycleDurationDays: 7,
        sevenDayRewards: [
            { day: 1, title: 'Ngày 1', energy: 0,   coins: 300,  gems: 0 },
            { day: 2, title: 'Ngày 2', energy: 40,  coins: 0,    gems: 0 },
            { day: 3, title: 'Ngày 3', energy: 0,   coins: 0,    gems: 8 },
            { day: 4, title: 'Ngày 4', energy: 0,   coins: 600,  gems: 0 },
            { day: 5, title: 'Ngày 5', energy: 60,  coins: 0,    gems: 0 },
            { day: 6, title: 'Ngày 6', energy: 0,   coins: 0,    gems: 15 },
            { day: 7, title: 'Ngày 7', energy: 100, coins: 1500, gems: 25, isGrand: true }
        ],
        dailyTasks: [
            { id: 'merge_25', type: 'merge', target: 25, title: 'Ghép vật phẩm 25 lần', energy: 20, coins: 250, gems: 0 },
            { id: 'order_3',  type: 'order', target: 3,  title: 'Hoàn thành 3 đơn hàng NPC', energy: 15, coins: 400, gems: 2 },
            { id: 'camp_1',   type: 'camp',  target: 1,  title: 'Ghé thăm hoặc vuốt ve thú ở Trại', energy: 20, coins: 200, gems: 2 }
        ],
        dailyAllClearChest: {
            energy: 40,
            coins: 600,
            gems: 5
        }
    },

    // -------------------------------------------------------------------------
    // 10. QUẢNG CÁO XEM THƯỞNG & QUÀ TẶNG HÀNG NGÀY (REWARDED ADS)
    // -------------------------------------------------------------------------
    adRewards: {
        energy: { amount: 40, dailyLimit: 6 },   // 1 Ad = 40⚡ (nguồn năng lượng mạnh nhất qua Ads)
        gem: { amount: 3, dailyLimit: 5 },       // 1 Ad = 3💎 (≈30⚡ quy đổi) để Ad Năng lượng luôn đáng xem hơn
        coin: { amount: 2500, dailyLimit: 5 },
        bubble: { dailyLimit: 5 },               // Tối đa 5 lần xem Ad mở bong bóng/ngày
        dailyGift: { amount: 5, doubleAmount: 10 },
        mysteryChest: { minGems: 12, maxGems: 25, dailyLimit: 3 },
        luckyDrop: { energy: 40, coin: 2500, gem: 4, dailyLimit: 3 }
    },

    // -------------------------------------------------------------------------
    // 10B. KHO LƯU TRỮ TẠM MỞ RỘNG (4 -> 12 Ô) & CỨU TRỢ NĂNG LƯỢNG
    // Ô 1..4: Miễn phí | Ô 5..6: Vàng | Ô 7..8: Xem Ads tích lũy | Ô 9..12: Kim Cương
    // -------------------------------------------------------------------------
    storage: {
        defaultCap: 4,
        maxCap: 12,
        allowStashSecondaryGenerators: true,
        slotUnlocks: {
            5:  { type: 'coin', cost: 3000 },
            6:  { type: 'coin', cost: 6000 },
            7:  { type: 'ad',   adsRequired: 2 },
            8:  { type: 'ad',   adsRequired: 3 },
            9:  { type: 'gem',  cost: 15 },
            10: { type: 'gem',  cost: 25 },
            11: { type: 'gem',  cost: 35 },
            12: { type: 'gem',  cost: 50 }
        }
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
    'generator_cooler': ['ban', 'ghe', 'trai'],
    'generator_backpack': ['an', 'qua', 'cafe'],
    'generator_crate': ['congcu', 'antoan', 'tham'],
    'generator_wood': ['bep', 'hoa'],
    'generator_animal': ['thucung', 'cauca']
};

var ALL_GENERATOR_IDS = ['generator_cooler', 'generator_backpack', 'generator_crate', 'generator_wood', 'generator_animal'];

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

function applyBoardStyleConfig(cfg) {
    if (typeof document === 'undefined' || !document.documentElement) return;
    var s = cfg || (GAME_CONFIG && GAME_CONFIG.boardStyle);
    if (!s) return;
    var root = document.documentElement.style;
    if (s.baseBgColor != null) root.setProperty('--board-base-bg', s.baseBgColor);
    if (s.outerStrokeWidth != null) root.setProperty('--board-outer-stroke-w', (typeof s.outerStrokeWidth === 'number' ? s.outerStrokeWidth + 'px' : s.outerStrokeWidth));
    if (s.outerStrokeColor != null) root.setProperty('--board-outer-stroke-color', s.outerStrokeColor);
    if (s.borderRadius != null) root.setProperty('--board-radius', (typeof s.borderRadius === 'number' ? s.borderRadius + 'px' : s.borderRadius));
    if (s.boxShadow != null) root.setProperty('--board-shadow', s.boxShadow);
    if (s.checkerLightColor != null) root.setProperty('--board-checker-light', s.checkerLightColor);
    if (s.checkerStrokeWidth != null) root.setProperty('--board-checker-stroke-w', (typeof s.checkerStrokeWidth === 'number' ? s.checkerStrokeWidth + 'px' : s.checkerStrokeWidth));
    if (s.checkerStrokeColor != null) root.setProperty('--board-checker-stroke-color', s.checkerStrokeColor);
    if (s.checkerBorderRadius != null) root.setProperty('--board-checker-radius', (typeof s.checkerBorderRadius === 'number' ? s.checkerBorderRadius + 'px' : s.checkerBorderRadius));
}

if (typeof window !== 'undefined') {
    window.GAME_CONFIG = GAME_CONFIG;
    window.BOARD_STYLE_CONFIG = GAME_CONFIG.boardStyle;
    window.CLOUD_CONFIG = GAME_CONFIG.clouds;
    window.generateLevelConfig = generateLevelConfig;
    window.applyBoardStyleConfig = applyBoardStyleConfig;
    applyBoardStyleConfig(GAME_CONFIG.boardStyle);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GAME_CONFIG;
}
