// =============================================================================

// CẤU HÌNH THÔNG SỐ & CÂN BẰNG KINH TẾ TRÒ CHƠI (GAME BALANCE CONFIG)

// Đã được tối ưu hóa theo chuẩn Casual Merge Quốc Tế (Sawtooth Pacing,

// Instant First-Merge, Anti-Board Lock & Balanced Economy Loop).

// Tất cả hệ thống (Bàn chơi, Shop, Quảng cáo, IAP, Cẩm Nang) sẽ tự động áp dụng.

// =============================================================================



var GAME_CONFIG = {

    // -------------------------------------------------------------------------

    // 0. CẤU HÌNH GOOGLE FIREBASE CLOUD SYNC (LƯU TRỮ ĐÁM MÂY MIỄN PHÍ)

    // Lấy thông tin này tại: https://console.firebase.google.com/

    // (Vào Cài đặt dự án -> Tạo ứng dụng Web -> Dán mã firebaseConfig vào đây)

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

        // Năng lượng ban đầu khi tạo tài khoản mới (Đủ chơi mượt suốt Chương 1: Lv.1 -> Lv.6).

        startEnergy: 80,



        // Trần năng lượng khởi điểm (khi chưa vượt qua màn nào).

        maxEnergyBase: 70,



        // Cộng thêm vào trần năng lượng tối đa mỗi khi vượt qua 1 level mới.

        // Ví dụ: qua 10 màn -> trần = 70 + 10*4 = 110 năng lượng.

        maxEnergyPerLevel: 4,



        // Giới hạn trần năng lượng tối đa tuyệt đối.

        maxEnergyCap: 200,



        // Thời gian tự động hồi phục +1 điểm năng lượng (tính bằng giây).

        // Tự động hồi +1 sau mỗi 30 giây khi người chơi tương tác với game

        regenIntervalSec: 30

    },



    // -------------------------------------------------------------------------

    // 2. TRẠM TIẾP NĂNG LƯỢNG (ENERGY SHOP)

    // -------------------------------------------------------------------------

    energyShop: {

        // Các gói đổi bằng Vàng: +25 NL (3.000 Vàng) và +50 NL (6.000 Vàng)

        coinPacks: [

            { energy: 25, coinCost: 3000, desc: 'Dùng Vàng nhận thêm Năng Lượng chơi game' },

            { energy: 50, coinCost: 6000, desc: 'Dùng Vàng nhận thêm Năng Lượng chơi game' }

        ],

        coinPack: {

            energy: 25,         // Nhận +25 năng lượng

            coinCost: 3000      // Tốn 3.000 Vàng (Tương đương hoàn thành ~2-3 màn)

        },



        // Gói nạp siêu tốc bằng Kim Cương (Bỏ qua thời gian chờ)

        gemPack: {

            energy: 50,         // Nhận +50 năng lượng

            gemCost: 8          // Tốn 8 Kim cương (Khớp với lượng Kim Cương tích lũy ở Lv.4)

        },



        // Tính năng Cứu TrỢ Kiểm Lâm (Miễn phí khi cạn kiệt năng lượng <= 5)

        // Bật true để giữ chân người chơi (Day-1 Retention) khi thiếu vài bước cuối để qua màn

        rescue: {

            enabled: true,      // Cho phép cứu trợ khẩn cấp

            amount: 20          // Số năng lượng cứu trợ

        }

    },



    // -------------------------------------------------------------------------

    // 3. QUẢNG CÁO XEM THƯỞNG (REWARDED ADS)

    // -------------------------------------------------------------------------

    adRewards: {

        // Xem quảng cáo tiếp tế năng lượng

        energy: {

            amount: 25,         // Số năng lượng nhận mỗi lần xem

            dailyLimit: 6       // Giới hạn số lượt xem tối đa mỗi ngày

        },



        // Xem quảng cáo nhận Kim Cương

        gem: {

            amount: 4,          // Xem 2 lần là đủ 8 Kim Cương mua gói 50 Năng lượng

            dailyLimit: 3       // Giới hạn số lượt xem tối đa mỗi ngày

        },



        // Xem quảng cáo nhận Vàng (Kinh tế x10)

        coin: {

            amount: 1500,       // Số Vàng nhận mỗi lần xem (1.500 Vàng)

            dailyLimit: 4       // Giới hạn số lượt xem tối đa mỗi ngày

        }

    },



    // -------------------------------------------------------------------------

    // 4. GÓI NẠP KIM CƯƠNG IAP (MÔ PHỎNG MUA BẰNG TIỀN THẬT)

    // -------------------------------------------------------------------------

    iapPacks: [

        {

            id: 'gem_tier_1',

            name: 'Túi Kim Cương Nhỏ',

            gems: 32,           // Số Kim Cương gốc (Đủ đúng 4 lần mua gói 8💎)

            bonusGems: 0,       // Thưởng thêm khuyến mãi

            priceVnd: '5.000 ₫',

            badge: null,

            desc: 'Đủ 4 lần nạp siêu tốc (+200 ⚡)'

        },

        {

            id: 'gem_tier_3',

            name: 'Rương Kim Cương',

            gems: 96,

            bonusGems: 40,      // Tổng nhận 136 Kim Cương

            priceVnd: '15.000 ₫',

            badge: '⭐ HỜI NHẤT +42%',

            isPopular: true,

            desc: 'Gói nạp tối ưu chi phí & hời nhất'

        },

        {

            id: 'gem_tier_4',

            name: 'Kho Báu Kim Cương',

            gems: 320,

            bonusGems: 180,     // Tổng nhận 500 Kim Cương

            priceVnd: '49.000 ₫',

            badge: '👑 SIÊU GIÁ TRỊ +56%',

            desc: 'Gói nạp tối thượng, nhận ngay 500 💎'

        }

    ],



    // Gói Tân Thủ đặc biệt (Kích thích chuyển đổi nạp lần đầu với giá trị gấp 3 lần)

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

    // 6. THƯỞNG KINH TẾ TRONG VÁN CHƠI (GAMEPLAY ECONOMY - KINH TẾ X10 & COMBO)

    // -------------------------------------------------------------------------

    gameplay: {

        // Hệ số thưởng Vàng khi hoàn thành 1 ĐƠN HÀNG (Kinh tế x10).

        // Công thức: orderReward = multiplier * 2^(level_item - 1).

        // Với multiplier = 60 (gấp đôi giá bán, tương đương 50% chi phí năng lượng):

        //  - Đơn Lv.1: 60 Vàng    | - Đơn Lv.5: 960 Vàng

        //  - Đơn Lv.2: 120 Vàng   | - Đơn Lv.6: 1.920 Vàng

        //  - Đơn Lv.3: 240 Vàng   | - Đơn Lv.7: 3.840 Vàng

        //  - Đơn Lv.4: 480 Vàng   | - Đơn Lv.8: 7.680 Vàng

        orderRewardMultiplier: 24,



        // Cấp tối thiểu để có thể BÁN ITEM lấy Vàng (từ Lv.1 - mở bán toàn bộ các cấp)

        sellMinLevel: 1,



        // Hệ số giá bán đồ theo năng lượng: sellPrice = Math.floor(2^(level_item - 1) * sellMultiplier / sellDivisor)

        // Mỗi 1⚡ mua bằng Vàng tương ứng: 3.000 Vàng / 25⚡ = 120 Vàng/1⚡.

        // Giá bán thu hồi ~12.5% giá trị năng lượng tạo ra: 15 Vàng / 1⚡.

        sellMultiplier: 15,

        sellDivisor: 1,



        // Thưởng Vàng và Kim Cương trực tiếp mỗi khi GHÉP THÀNH CÔNG ra item cấp mới (Kinh tế x10)

        // Mở thưởng từ Lv.4 để tạo hiệu ứng Dopamine mỗi khi ghép ra vật phẩm trung-cao cấp

        mergeRewards: {

            2: { coins: 0, gems: 0 },

            3: { coins: 0, gems: 0 },

            4: { coins: 15, gems: 0 },

            5: { coins: 35, gems: 0 },

            6: { coins: 80, gems: 0 },

            7: { coins: 180, gems: 1 }, // Ghép ra Lv.7 thưởng nóng 180 Vàng + 1 Kim Cương

            8: { coins: 400, gems: 2 }  // Ghép ra cấp tối đa Lv.8 thưởng nóng 400 Vàng + 2 Kim Cương

        },



        // CƠ CHẾ THƯỞNG COMBO GHÉP LIÊN TIẾP (COMBO REWARD SYSTEM)

        // Ghép liên tục trong khoảng thời gian quy định sẽ nhận thưởng Vàng tăng dần

        combo: {

            enabled: true,

            windowSec: 3.5,     // Khoảng thời gian tối đa (3.5 giây) giữa 2 lần ghép liên tiếp để duy trì combo

            baseCoins: 10,      // Thưởng Vàng ở Combo x2

            stepCoins: 15,      // Mỗi nấc combo tiếp theo cộng thêm Vàng (+10, +25, +40, +55, +70...)

            maxCoins: 200       // Giới hạn thưởng tối đa mỗi nấc combo

        },



        // CƠ CHẾ XẢ ĐẦY Ô TRỐNG TỪ MÁY PHÁT (BULK SPAWN)

        // Bấm liên tiếp đủ 6 lần vào máy phát để xả đồ ra toàn bộ ô trống (thay vì 2 lần)

        generatorBulkClicks: 6,

        generatorClickWindowMs: 550, // Khoảng thời gian tối đa giữa 2 lần bấm liên tiếp (mili-giây)



        // Thưởng khi HOÀN THÀNH MÀN CHƠI (Chiến thắng lần đầu - Kinh tế x10)

        // Công thức Vàng: baseCoins + level * perLevelCoins + stars * perStarCoins

        levelClear: {
            baseCoins: 150,
            perLevelCoins: 25,
            perStarCoins: 50,
            gems3Stars: 2,             // Đạt 3 sao nhận 2 Kim Cương
            gems1Or2Stars: 1,          // Đạt 1 hoặc 2 sao nhận 1 Kim Cương khuyến khích
            allowReplayReward: false   // Chơi lại màn đã thắng không nhận lại thưởng
        }

    },



    // -------------------------------------------------------------------------

    // 7. THƯỞNG SỔ TAY CẨM NANG (DISCOVERY BOOK REWARDS - KINH TẾ X10)

    // -------------------------------------------------------------------------

    discoveryBook: {

        // Vàng thưởng = level_item * coinsMultiplier (Lv.1 được 50, Lv.8 được 400 Vàng)

        coinsMultiplier: 50,



        // Hạ cấp độ item tối thiểu nhận Kim Cương trong cẩm nang xuống Lv.5

        gemUnlockMinLevel: 5,



        // Số Kim Cương nhận khi mở khóa item cấp cao trong cẩm nang

        gemsReward: 1

    },



    // -------------------------------------------------------------------------

    // 8. TÀI KHOẢN MỚI BAN ĐẦU (INITIAL USER PROFILE - KINH TẾ X10)

    // -------------------------------------------------------------------------

    initialProfile: {

        coins: 1000,            // Số Vàng khởi đầu (1.000 Vàng)

        gems: 8                 // Số Kim Cương khởi đầu (Đủ dùng thử 1 lần nạp năng lượng)

    },



    // -------------------------------------------------------------------------

    // 9. THÔNG SỐ TOÀN BỘ 45 LEVEL ĐÃ CÂN BẰNG (REBALANCED LEVELS CONFIGURATION)

    // Nguyên tắc cân bằng đã áp dụng:

    //  1. Bổ sung "freeItems" (Vật phẩm mồi mở sẵn) ở mọi màn từ Lv.1 -> Lv.45 để người chơi

    //     vào màn là có thể kéo ghép phá mạng nhện ngay lập tức mà chưa tốn năng lượng.

    //  2. Thiết kế Đơn hàng theo mô hình Kim Tự Tháp (1 Món Chính + 1 Món Vừa + 1 Món Nhẹ).

    //  3. Mở cơ chế "adjWeb: true" (Ghép cạnh phá nhện) sớm từ Level 3 thay vì Level 5.

    //  4. Mở cơ chế "bonus: true" (Hộp tiếp tế) ở các màn Boss (10, 15, 20, 25) và toàn bộ từ Lv.26+.

    //  5. Giãn nhịp nhện lan (spreadEvery) từ 11-12 lên 15-18 lượt bấm để tránh gây ức chế.

    // -------------------------------------------------------------------------

    levels: [
        // --- CHƯƠNG 1: KHỞI ĐẦU BÃI CỎ (Lv 1 - 10) ---
        {
            level: 1,
            name: "Bữa Sáng Khởi Đầu",
            pattern: "box5x5",
            generators: [[31,"generator_backpack"]],
            freeItems: [[23,"an_lv1"],[25,"cafe_lv1"]],
            webItems: [[15,"an_lv1"],[19,"cafe_lv1"],[37,"cafe_lv1"],[39,"an_lv2"]],
            orders: ["an_lv4","cafe_lv3"],
            mechanics: {"adjWeb":false,"bonus":false,"spreadEvery":0},
            dialogue: {"npc":"gau","text":"Chào mừng tới Bữa Sáng Khởi Đầu! Hãy ghép 2 món có sẵn vào ô mạng nhện rồi chạm vào Ba Lô để chuẩn bị bữa sáng nhé!"}
        },
        {
            level: 2,
            name: "Dựng Lều Cắm Trại",
            pattern: "box5x5",
            generators: [[31,"generator_cooler"]],
            freeItems: [[23,"trai_lv1"],[25,"ghe_lv1"]],
            webItems: [[15,"trai_lv1"],[17,"ghe_lv1"],[19,"ban_lv1"],[37,"ghe_lv1"],[39,"trai_lv2"]],
            orders: ["trai_lv4","ghe_lv3"],
            mechanics: {"adjWeb":false,"bonus":false,"spreadEvery":0},
            dialogue: {"npc":"cao","text":"Trời nắng đẹp quá! Giúp mình ghép Lều và Ghế từ Xe Kéo để dựng góc chụp ảnh cắm trại đầu tiên nhé!"}
        },
        {
            level: 3,
            name: "Nhóm Lửa Giữa Rừng",
            pattern: "box5x5",
            generators: [[31,"generator_crate"]],
            freeItems: [[23,"bep_lv1"],[25,"antoan_lv1"]],
            webItems: [[15,"bep_lv1"],[17,"antoan_lv1"],[19,"tham_lv1"],[37,"antoan_lv1"],[39,"bep_lv2"],[45,"tham_lv2"]],
            orders: ["bep_lv4","antoan_lv3","tham_lv3"],
            mechanics: {"adjWeb":true,"bonus":false,"spreadEvery":0},
            dialogue: {"npc":"de","text":"Mẹo hay từ Lv.3: Ghép vật phẩm ngay sát cạnh Mạng Nhện 🕸️ cũng sẽ làm rách nhện xung quanh! Cùng nhóm Bếp Lửa nào!"}
        },
        {
            level: 4,
            name: "Cà Phê Sương Sớm",
            pattern: "box5x5",
            generators: [[30,"generator_backpack"],[32,"generator_cooler"]],
            freeItems: [[23,"cafe_lv1"],[24,"ban_lv1"],[25,"congcu_lv1"]],
            webItems: [[15,"cafe_lv1"],[17,"ban_lv2"],[19,"congcu_lv1"],[37,"cafe_lv2"],[39,"ban_lv2"],[45,"congcu_lv2"]],
            orders: ["cafe_lv4","ban_lv4","congcu_lv3"],
            mechanics: {"adjWeb":true,"bonus":false,"spreadEvery":0},
            dialogue: {"npc":"gau","text":"Buổi sớm mà có tách Cà Phê nóng và chiếc Ghế êm ngắm sương sớm thì tuyệt cú mèo! Tận dụng các món có sẵn trên bàn nhé!"}
        },
        {
            level: 5,
            name: "Bộ Ba Hành Trang",
            pattern: "box5x7",
            generators: [[30,"generator_cooler"],[31,"generator_backpack"],[32,"generator_crate"]],
            freeItems: [[23,"an_lv2"],[24,"trai_lv1"],[25,"bep_lv1"]],
            webItems: [[8,"an_lv2"],[10,"trai_lv1"],[12,"bep_lv1"],[16,"an_lv1"],[18,"tham_lv1"],[43,"an_lv2"],[45,"trai_lv1"],[47,"bep_lv1"]],
            orders: ["an_lv5","trai_lv3","bep_lv3"],
            mechanics: {"adjWeb":true,"bonus":false,"spreadEvery":0},
            dialogue: {"npc":"de","text":"Cột mốc Lv.5: Cả 3 Nguồn Phát cùng xuất hiện! Hãy giải phóng các vật phẩm Lv.4 trong mạng nhện để hoàn thành đơn thật nhanh!"}
        },
        {
            level: 6,
            name: "Bàn Trà Dưới Tán Cây",
            pattern: "box5x7",
            generators: [[30,"generator_cooler"],[32,"generator_backpack"]],
            freeItems: [[23,"ban_lv2"],[25,"ghe_lv2"]],
            webItems: [[8,"ban_lv2"],[10,"ghe_lv2"],[12,"congcu_lv2"],[15,"an_lv1"],[19,"trai_lv1"],[43,"ban_lv3"],[45,"congcu_lv2"],[47,"ghe_lv2"]],
            orders: ["ban_lv5","ghe_lv4","congcu_lv4"],
            mechanics: {"adjWeb":true,"bonus":false,"spreadEvery":0},
            dialogue: {"npc":"cao","text":"Mình vừa tìm được tán cây cực chill! Hãy ghép Bàn Trà Lv.5, Ghế Xếp và Cà Phê để cả nhóm ngồi nghỉ chân nhé!"}
        },
        {
            level: 7,
            name: "Thu Dọn Bãi Cỏ",
            pattern: "cross",
            generators: [[30,"generator_backpack"],[32,"generator_crate"]],
            freeItems: [[23,"congcu_lv2"],[25,"antoan_lv2"]],
            webItems: [[2,"congcu_lv2"],[4,"antoan_lv2"],[16,"bep_lv1"],[18,"tham_lv2"],[21,"tham_lv2"],[27,"congcu_lv3"],[58,"congcu_lv2"],[60,"antoan_lv2"]],
            orders: ["congcu_lv5","antoan_lv4","tham_lv4"],
            mechanics: {"adjWeb":true,"bonus":false,"spreadEvery":0},
            dialogue: {"npc":"de","text":"Bãi cỏ phía trước còn vướng nhiều mạng nhện quá, hãy ghép Công Cụ và Thảm để thu dọn lối đi thật sạch nhé!"}
        },
        {
            level: 8,
            name: "Bữa Trưa Dã Ngoại",
            pattern: "cross",
            generators: [[30,"generator_cooler"],[31,"generator_backpack"],[32,"generator_crate"]],
            freeItems: [[23,"bep_lv2"],[25,"cafe_lv2"]],
            webItems: [[2,"bep_lv2"],[4,"cafe_lv2"],[14,"ban_lv1"],[20,"cafe_lv3"],[42,"ban_lv2"],[48,"bep_lv2"],[58,"cafe_lv3"],[60,"bep_lv3"]],
            orders: ["bep_lv5","cafe_lv5","ban_lv3"],
            mechanics: {"adjWeb":true,"bonus":false,"spreadEvery":0},
            dialogue: {"npc":"gau","text":"Đến giờ Bữa Trưa Dã Ngoại rồi! Bụng mình kêu ùng ục rồi, mau chuẩn bị Đồ Ăn, Bếp Nướng và Bàn Gỗ thôi!"}
        },
        {
            level: 9,
            name: "Chỗ Ngủ Êm Ái",
            pattern: "rounded",
            generators: [[30,"generator_crate"],[32,"generator_cooler"]],
            freeItems: [[23,"tham_lv2"],[25,"ghe_lv2"]],
            webItems: [[8,"tham_lv2"],[12,"ghe_lv2"],[14,"ghe_lv2"],[20,"antoan_lv1"],[22,"bep_lv1"],[26,"tham_lv3"],[42,"tham_lv2"],[48,"ghe_lv3"],[51,"antoan_lv1"]],
            orders: ["tham_lv5","ghe_lv5","antoan_lv2"],
            mechanics: {"adjWeb":true,"bonus":false,"spreadEvery":0},
            dialogue: {"npc":"cao","text":"Đi bộ cả ngày mỏi chân ghê, tối nay tụi mình cần Chỗ Ngủ Êm Ái với Thảm và Lều thật ấm áp nhé!"}
        },
        {
            level: 10,
            name: "Đêm Lửa Trại Đầu Tiên",
            pattern: "pillars",
            generators: [[30,"generator_cooler"],[31,"generator_backpack"],[32,"generator_crate"]],
            freeItems: [[23,"trai_lv2"],[24,"antoan_lv2"],[25,"an_lv1"]],
            webItems: [[7,"trai_lv3"],[13,"antoan_lv2"],[15,"trai_lv2"],[19,"ghe_lv1"],[21,"ban_lv1"],[27,"antoan_lv2"],[43,"an_lv2"],[47,"tham_lv1"],[49,"trai_lv2"],[55,"antoan_lv3"]],
            orders: ["trai_lv5","antoan_lv5","an_lv3","ban_lv2"],
            mechanics: {"adjWeb":true,"bonus":true,"spreadEvery":0},
            dialogue: {"npc":"gau","text":"Đêm Lửa Trại Đầu Tiên! 🎁 Đặc biệt ở màn 10: Ghép ra vật phẩm Lv.5+ sẽ được tặng thêm Hộp Tiếp Tế miễn phí!"}
        },
        // --- CHƯƠNG 2: RỪNG SÂU & BỜ SUỐI (Lv 11 - 25) ---
        {
            level: 11,
            name: "Thung Lũng Gió Lộng",
            pattern: "valley",
            generators: [[30,"generator_cooler"],[31,"generator_backpack"],[32,"generator_crate"]],
            freeItems: [[23,"trai_lv2"],[25,"congcu_lv2"]],
            webItems: [[2,"trai_lv2"],[4,"congcu_lv2"],[9,"cafe_lv2"],[11,"bep_lv2"],[15,"antoan_lv2"],[19,"tham_lv2"],[43,"trai_lv4"],[47,"congcu_lv3"],[58,"cafe_lv2"],[60,"bep_lv2"]],
            orders: ["trai_lv5","congcu_lv5","cafe_lv2"],
            mechanics: {"adjWeb":true,"bonus":false,"spreadEvery":0},
            dialogue: {"npc":"cao","text":"Bước vào Chương 2: Thung Lũng Gió Lộng! Gió thổi mạnh lắm, cần gia cố Lều, Công Cụ và Thảm thật chắc chắn nhé!"}
        },
        {
            level: 12,
            name: "Hương Vị Robusta",
            pattern: "hourglass",
            generators: [[30,"generator_cooler"],[31,"generator_backpack"],[32,"generator_crate"]],
            freeItems: [[24,"cafe_lv4"],[38,"ban_lv3"]],
            webItems: [[7,"cafe_lv4"],[13,"ban_lv3"],[15,"an_lv2"],[19,"bep_lv2"],[22,"congcu_lv2"],[26,"antoan_lv2"],[49,"cafe_lv4"],[51,"ban_lv3"],[53,"antoan_lv2"],[55,"bep_lv2"]],
            orders: ["cafe_lv6","ban_lv5","bep_lv2"],
            mechanics: {"adjWeb":true,"bonus":false,"spreadEvery":0},
            dialogue: {"npc":"gau","text":"Hương Vị Robusta giữa rừng sâu! Từ màn này đơn hàng cấp 6 sẽ xuất hiện, pha giúp mình bình cà phê thượng hạng nhé!"}
        },
        {
            level: 13,
            name: "Hai Bờ Suối Nhỏ",
            pattern: "islands",
            generators: [[17,"generator_backpack"],[45,"generator_cooler"]],
            freeItems: [[24,"an_lv4"],[38,"ghe_lv3"]],
            webItems: [[7,"an_lv4"],[8,"cafe_lv2"],[12,"ban_lv2"],[13,"an_lv3"],[21,"congcu_lv2"],[27,"ban_lv2"],[35,"ghe_lv3"],[41,"an_lv2"],[49,"trai_lv2"],[50,"ghe_lv2"],[54,"an_lv3"],[55,"trai_lv2"]],
            orders: ["an_lv6","ghe_lv5","trai_lv2"],
            mechanics: {"adjWeb":true,"bonus":false,"spreadEvery":0},
            dialogue: {"npc":"cao","text":"Bàn cờ chia làm Hai Bờ Suối Nhỏ tuyệt đẹp! Hãy tận dụng khoảng trống ở cả hai bờ để ghép Đồ Ăn, Ghế và Lều nhé!"}
        },
        {
            level: 14,
            name: "Trạm Sơ Cứu Rừng Sâu",
            pattern: "fortress",
            generators: [[30,"generator_crate"],[32,"generator_backpack"]],
            freeItems: [[24,"antoan_lv4"],[38,"tham_lv3"]],
            webItems: [[8,"antoan_lv4"],[10,"congcu_lv2"],[12,"bep_lv2"],[15,"tham_lv3"],[19,"tham_lv2"],[22,"an_lv2"],[26,"antoan_lv3"],[36,"an_lv2"],[40,"bep_lv3"],[44,"tham_lv3"],[46,"bep_lv2"]],
            orders: ["antoan_lv6","tham_lv5","an_lv2"],
            mechanics: {"adjWeb":true,"bonus":false,"spreadEvery":0},
            dialogue: {"npc":"de","text":"Rừng sâu nhiều gai góc, tụi mình cần dựng Trạm Sơ Cứu Rừng Sâu với Hộp Sơ Cứu Lv.6 để bảo vệ cả đoàn!"}
        },
        {
            level: 15,
            name: "Bữa Tiệc Trái Cây",
            pattern: "pillars",
            generators: [[30,"generator_backpack"],[32,"generator_cooler"]],
            freeItems: [[24,"ban_lv4"],[38,"trai_lv3"]],
            webItems: [[7,"ban_lv4"],[9,"trai_lv3"],[11,"cafe_lv2"],[13,"ghe_lv2"],[15,"trai_lv2"],[19,"an_lv2"],[21,"cafe_lv3"],[27,"ghe_lv2"],[43,"trai_lv3"],[47,"ban_lv3"],[49,"ban_lv3"],[55,"cafe_lv3"]],
            orders: ["ban_lv6","cafe_lv5","ghe_lv2"],
            mechanics: {"adjWeb":true,"bonus":true,"spreadEvery":0},
            dialogue: {"npc":"gau","text":"Mình tìm thấy quá trời quả rừng tươi ngon! Cùng bày Bữa Tiệc Trái Cây hoành tráng mừng cột mốc màn 15 nào!"}
        },
        {
            level: 16,
            name: "Mắc Võng Giữa Rừng",
            pattern: "rounded",
            generators: [[30,"generator_cooler"],[31,"generator_backpack"],[32,"generator_crate"]],
            freeItems: [[24,"tham_lv4"],[38,"bep_lv3"]],
            webItems: [[8,"tham_lv4"],[10,"ghe_lv2"],[12,"bep_lv3"],[14,"congcu_lv2"],[20,"ban_lv2"],[22,"an_lv2"],[26,"tham_lv4"],[36,"ghe_lv2"],[40,"bep_lv3"],[42,"congcu_lv2"],[48,"ban_lv2"],[52,"an_lv2"]],
            orders: ["tham_lv6","bep_lv5","congcu_lv2"],
            mechanics: {"adjWeb":true,"bonus":false,"spreadEvery":0},
            dialogue: {"npc":"cao","text":"Nghe tiếng chim hót bên suối kìa! Mắc Võng Giữa Rừng và nhâm nhi tách cà phê để mình chụp một tấm kỷ niệm nhé!"}
        },
        {
            level: 17,
            name: "Ánh Đèn Dây Lung Linh",
            pattern: "hourglass",
            generators: [[30,"generator_cooler"],[31,"generator_backpack"],[32,"generator_crate"]],
            freeItems: [[24,"congcu_lv4"],[38,"bep_lv4"]],
            webItems: [[7,"congcu_lv4"],[9,"bep_lv4"],[11,"antoan_lv2"],[13,"trai_lv2"],[15,"tham_lv2"],[19,"ghe_lv2"],[22,"congcu_lv4"],[26,"bep_lv4"],[49,"antoan_lv3"],[51,"trai_lv3"],[53,"tham_lv2"],[55,"antoan_lv3"]],
            orders: ["congcu_lv6","bep_lv6","tham_lv2"],
            mechanics: {"adjWeb":true,"bonus":false,"spreadEvery":0},
            dialogue: {"npc":"de","text":"Rừng già tối rất nhanh, hãy ghép Công Cụ Ánh Sáng Lv.6 để thắp lên Ánh Đèn Dây Lung Linh khắp khu trại!"}
        },
        {
            level: 18,
            name: "Bàn Gỗ Xếp Thủ Công",
            pattern: "islands",
            generators: [[17,"generator_cooler"],[31,"generator_backpack"],[45,"generator_crate"]],
            freeItems: [[24,"ghe_lv4"],[38,"cafe_lv4"]],
            webItems: [[7,"ghe_lv4"],[8,"cafe_lv4"],[12,"an_lv2"],[13,"ghe_lv4"],[21,"cafe_lv4"],[27,"an_lv3"],[35,"ban_lv3"],[41,"congcu_lv2"],[49,"tham_lv2"],[50,"ban_lv3"],[54,"tham_lv2"],[55,"an_lv3"]],
            orders: ["ghe_lv6","cafe_lv6","an_lv5"],
            mechanics: {"adjWeb":true,"bonus":false,"spreadEvery":0},
            dialogue: {"npc":"gau","text":"Bàn ghế dã ngoại kết hợp với Cà Phê và Đồ Ăn ở hai bờ suối sẽ tạo nên góc ẩm thực ngoài trời đỉnh nhất!"}
        },
        {
            level: 19,
            name: "Trú Mưa Khẩn Cấp",
            pattern: "fortress",
            generators: [[23,"generator_cooler"],[24,"generator_crate"],[25,"generator_backpack"]],
            freeItems: [[16,"trai_lv4"],[38,"antoan_lv4"]],
            webItems: [[8,"trai_lv4"],[9,"antoan_lv4"],[11,"congcu_lv3"],[12,"tham_lv2"],[15,"ghe_lv2"],[19,"bep_lv2"],[22,"trai_lv4"],[26,"antoan_lv4"],[36,"congcu_lv3"],[40,"tham_lv3"],[43,"ghe_lv2"],[47,"bep_lv2"]],
            orders: ["trai_lv6","antoan_lv6","congcu_lv5"],
            mechanics: {"adjWeb":true,"bonus":false,"spreadEvery":0},
            dialogue: {"npc":"de","text":"Mây đen kéo đến rồi! Mau dựng khu Trú Mưa Khẩn Cấp với Lều, Đồ Sơ Cứu Lv.6 và Công Cụ trước khi mưa đổ xuống!"}
        },
        {
            level: 20,
            name: "Lửa Trại Rực Hồng",
            pattern: "open",
            generators: [[30,"generator_cooler"],[31,"generator_backpack"],[32,"generator_crate"]],
            freeItems: [[23,"bep_lv4"],[24,"an_lv4"],[25,"trai_lv4"]],
            webItems: [[1,"bep_lv4"],[3,"an_lv4"],[5,"trai_lv4"],[7,"bep_lv4"],[13,"an_lv4"],[14,"trai_lv4"],[20,"tham_lv2"],[42,"congcu_lv2"],[48,"antoan_lv2"],[49,"cafe_lv2"],[55,"ban_lv2"],[57,"tham_lv2"],[59,"congcu_lv2"],[61,"cafe_lv3"]],
            orders: ["bep_lv6","an_lv6","trai_lv6","cafe_lv4"],
            mechanics: {"adjWeb":true,"bonus":true,"spreadEvery":0},
            dialogue: {"npc":"cao","text":"Mưa tạnh rồi, Lửa Trại Rực Hồng giữa rừng đêm đẹp như tranh vẽ! Hãy hoàn thành bộ ba Lv.6 cùng 1 chiếc Bàn phụ mừng cột mốc màn 20!"}
        },
        {
            level: 21,
            name: "Giải Cứu Thùng Đá",
            pattern: "pillars",
            generators: [[30,"generator_cooler"],[31,"generator_backpack"],[32,"generator_crate"]],
            freeItems: [[24,"an_lv4"],[38,"tham_lv4"]],
            webItems: [[7,"an_lv4"],[8,"tham_lv4"],[12,"ban_lv3"],[13,"an_lv4"],[14,"trai_lv2"],[20,"congcu_lv2"],[21,"cafe_lv2"],[27,"ban_lv3"],[42,"tham_lv4"],[48,"trai_lv2"],[49,"congcu_lv2"],[50,"cafe_lv2"],[54,"ban_lv2"],[55,"antoan_lv3"]],
            orders: ["an_lv6","tham_lv6","ban_lv5"],
            mechanics: {"adjWeb":true,"bonus":false,"spreadEvery":0},
            dialogue: {"npc":"gau","text":"Ôi không, kho lương thực bị mạng nhện giăng kín! Hãy Giải Cứu Thùng Đá để chuẩn bị bữa tối và chỗ nghỉ cho đoàn nhé!"}
        },
        {
            level: 22,
            name: "Góc Chill Cà Phê Moka",
            pattern: "hourglass",
            generators: [[30,"generator_backpack"],[32,"generator_cooler"]],
            freeItems: [[24,"cafe_lv4"],[38,"ban_lv4"]],
            webItems: [[7,"cafe_lv4"],[8,"ban_lv4"],[9,"ghe_lv3"],[11,"congcu_lv2"],[12,"trai_lv2"],[13,"cafe_lv3"],[15,"cafe_lv3"],[19,"ban_lv3"],[49,"ghe_lv3"],[50,"congcu_lv2"],[51,"trai_lv2"],[53,"congcu_lv2"],[54,"an_lv2"],[55,"trai_lv2"]],
            orders: ["cafe_lv6","ban_lv6","ghe_lv5"],
            mechanics: {"adjWeb":true,"bonus":false,"spreadEvery":0},
            dialogue: {"npc":"gau","text":"Sau buổi sáng bận rộn, hãy tạo một Góc Chill Cà Phê Moka thơm lừng với Bàn và Ghế hạng sang nào!"}
        },
        {
            level: 23,
            name: "Đài Phát Thanh Rừng Già",
            pattern: "valley",
            generators: [[30,"generator_crate"],[32,"generator_backpack"]],
            freeItems: [[24,"antoan_lv4"],[38,"congcu_lv4"]],
            webItems: [[2,"antoan_lv4"],[3,"congcu_lv4"],[4,"bep_lv2"],[9,"antoan_lv3"],[10,"congcu_lv3"],[11,"tham_lv2"],[15,"antoan_lv3"],[19,"congcu_lv3"],[43,"bep_lv3"],[47,"an_lv3"],[51,"tham_lv2"],[53,"an_lv3"],[58,"bep_lv2"],[60,"tham_lv2"]],
            orders: ["antoan_lv6","congcu_lv6","bep_lv4"],
            mechanics: {"adjWeb":true,"bonus":false,"spreadEvery":0},
            dialogue: {"npc":"de","text":"Ở Đài Phát Thanh Rừng Già, tụi mình cần thiết bị An Toàn và Công Cụ Lv.6 để bắt sóng liên lạc về trạm kiểm lâm!"}
        },
        {
            level: 24,
            name: "Bếp Nướng Than Hoa",
            pattern: "islands",
            generators: [[17,"generator_crate"],[31,"generator_backpack"],[45,"generator_cooler"]],
            freeItems: [[24,"bep_lv4"],[38,"trai_lv4"]],
            webItems: [[7,"bep_lv4"],[8,"congcu_lv2"],[12,"antoan_lv2"],[13,"bep_lv4"],[15,"congcu_lv2"],[19,"antoan_lv2"],[21,"bep_lv3"],[27,"cafe_lv3"],[35,"trai_lv4"],[41,"an_lv4"],[43,"cafe_lv2"],[47,"trai_lv4"],[49,"an_lv4"],[55,"cafe_lv3"]],
            orders: ["bep_lv6","trai_lv6","cafe_lv5"],
            mechanics: {"adjWeb":true,"bonus":false,"spreadEvery":0},
            dialogue: {"npc":"gau","text":"Than hồng đã đỏ rực bên suối! Cùng chuẩn bị Bếp Nướng Than Hoa, Bàn Tiệc và Đồ Ăn Lv.6 thơm nức mũi nhé!"}
        },
        {
            level: 25,
            name: "Sofa Giữa Thiên Nhiên",
            pattern: "fortress",
            generators: [[23,"generator_crate"],[24,"generator_cooler"],[25,"generator_backpack"]],
            freeItems: [[16,"tham_lv4"],[38,"ghe_lv4"]],
            webItems: [[8,"tham_lv4"],[9,"ghe_lv4"],[10,"tham_lv4"],[11,"ghe_lv4"],[12,"congcu_lv4"],[15,"an_lv2"],[19,"tham_lv3"],[22,"ghe_lv3"],[26,"trai_lv2"],[36,"ban_lv3"],[40,"congcu_lv4"],[43,"antoan_lv2"],[45,"trai_lv2"],[47,"ban_lv2"]],
            orders: ["tham_lv6","ghe_lv6","congcu_lv6","ban_lv4"],
            mechanics: {"adjWeb":true,"bonus":true,"spreadEvery":0},
            dialogue: {"npc":"cao","text":"Khép lại Chương 2 bằng bộ Sofa Giữa Thiên Nhiên! Vừa êm ái vừa sang chảnh để chụp bộ ảnh bìa tạp chí cắm trại!"}
        },
        // --- CHƯƠNG 3: CHINH PHỤC ĐÈO CAO (Lv 26 - 35) ---
        {
            level: 26,
            name: "Bàn Chiến Thuật IGT",
            pattern: "pillars",
            generators: [[30,"generator_cooler"],[32,"generator_crate"]],
            freeItems: [[23,"ban_lv5"],[25,"ghe_lv4"]],
            webItems: [[7,"ban_lv5"],[8,"ghe_lv4"],[9,"ban_lv5"],[11,"ban_lv2"],[12,"trai_lv2"],[13,"tham_lv3"],[15,"bep_lv4"],[19,"ban_lv2"],[21,"antoan_lv2"],[27,"ban_lv3"],[43,"ban_lv3"],[47,"tham_lv3"],[49,"bep_lv4"],[52,"ban_lv3"],[55,"ghe_lv4"]],
            orders: ["ban_lv7","ghe_lv6","tham_lv5"],
            mechanics: {"adjWeb":true,"bonus":true,"spreadEvery":0},
            dialogue: {"npc":"de","text":"Chào mừng tới Chương 3: Đèo Cao! Tụi mình bắt đầu chế tạo vật phẩm Lv.7 siêu cấp, mở màn với Bàn Chiến Thuật IGT!"}
        },
        {
            level: 27,
            name: "Đèn Bão Xuyên Đêm",
            pattern: "hourglass",
            generators: [[30,"generator_cooler"],[31,"generator_backpack"],[32,"generator_crate"]],
            freeItems: [[24,"congcu_lv5"],[38,"antoan_lv4"]],
            webItems: [[7,"congcu_lv5"],[8,"antoan_lv4"],[9,"congcu_lv5"],[10,"trai_lv3"],[11,"tham_lv2"],[12,"cafe_lv4"],[13,"congcu_lv4"],[15,"antoan_lv4"],[19,"bep_lv2"],[49,"trai_lv3"],[50,"tham_lv2"],[51,"cafe_lv4"],[53,"bep_lv2"],[54,"trai_lv2"],[55,"tham_lv2"]],
            orders: ["congcu_lv7","antoan_lv6","trai_lv5"],
            mechanics: {"adjWeb":true,"bonus":true,"spreadEvery":0},
            dialogue: {"npc":"de","text":"Gió đèo thổi rít suốt đêm! Hãy ghép Đèn Bão Xuyên Đêm Lv.7 và Thiết Bị An Toàn để giữ sáng cho toàn trại!"}
        },
        {
            level: 28,
            name: "Trạm Điện Dự Phòng",
            pattern: "open",
            generators: [[30,"generator_cooler"],[31,"generator_backpack"],[32,"generator_crate"]],
            freeItems: [[23,"antoan_lv5"],[25,"tham_lv4"]],
            webItems: [[1,"antoan_lv5"],[2,"tham_lv4"],[3,"antoan_lv5"],[4,"congcu_lv2"],[5,"ban_lv4"],[7,"an_lv2"],[13,"trai_lv2"],[14,"cafe_lv3"],[20,"ghe_lv2"],[42,"bep_lv2"],[48,"cafe_lv3"],[49,"ban_lv4"],[55,"an_lv2"],[57,"antoan_lv4"],[59,"tham_lv4"],[61,"cafe_lv2"]],
            orders: ["antoan_lv7","ban_lv6","cafe_lv5"],
            mechanics: {"adjWeb":true,"bonus":true,"spreadEvery":0},
            dialogue: {"npc":"gau","text":"Lên đèo cao trời lạnh buốt, cần Trạm Điện Dự Phòng Lv.7 để chạy máy pha Cà Phê Espresso nóng hổi cho cả đoàn!"}
        },
        {
            level: 29,
            name: "Khu Nghỉ Dưỡng Glamping",
            pattern: "open",
            generators: [[30,"generator_cooler"],[32,"generator_crate"]],
            freeItems: [[23,"trai_lv5"],[24,"tham_lv5"],[25,"ghe_lv4"]],
            webItems: [[1,"trai_lv5"],[2,"tham_lv5"],[3,"ghe_lv4"],[4,"trai_lv4"],[5,"tham_lv4"],[7,"ban_lv2"],[13,"bep_lv3"],[14,"ban_lv2"],[20,"antoan_lv2"],[42,"ban_lv2"],[48,"bep_lv3"],[49,"ban_lv2"],[55,"bep_lv2"],[57,"trai_lv4"],[59,"tham_lv4"],[61,"ghe_lv4"]],
            orders: ["trai_lv7","tham_lv7","bep_lv5"],
            mechanics: {"adjWeb":true,"bonus":true,"spreadEvery":0},
            dialogue: {"npc":"cao","text":"Biến sườn đèo thành Khu Nghỉ Dưỡng Glamping 5 sao với trọn bộ Lều, Thảm Lv.7 và Ghế đẹp mê hồn nào!"}
        },
        {
            level: 30,
            name: "Tiệc Nướng Sườn Đồi",
            pattern: "open",
            generators: [[30,"generator_cooler"],[31,"generator_backpack"],[32,"generator_crate"]],
            freeItems: [[23,"an_lv5"],[24,"bep_lv5"],[25,"congcu_lv4"]],
            webItems: [[1,"an_lv5"],[2,"bep_lv5"],[3,"congcu_lv4"],[4,"an_lv4"],[5,"bep_lv5"],[7,"antoan_lv2"],[13,"trai_lv2"],[14,"tham_lv2"],[20,"ghe_lv3"],[21,"cafe_lv2"],[27,"congcu_lv3"],[35,"antoan_lv2"],[41,"trai_lv2"],[42,"tham_lv2"],[48,"ghe_lv3"],[49,"an_lv4"],[55,"bep_lv4"],[57,"congcu_lv4"]],
            orders: ["an_lv7","bep_lv7","ghe_lv5"],
            mechanics: {"adjWeb":true,"bonus":true,"spreadEvery":0},
            dialogue: {"npc":"gau","text":"Cột mốc màn 30: Tiệc Nướng Sườn Đồi! Đại tiệc Đồ Ăn và Bếp Nướng cấp 7 hoành tráng nhất từ đầu hành trình!"}
        },
        {
            level: 31,
            name: "Bình Minh Trên Đỉnh Mây",
            pattern: "rounded",
            generators: [[30,"generator_backpack"],[32,"generator_cooler"]],
            freeItems: [[24,"cafe_lv5"],[38,"trai_lv4"]],
            webItems: [[8,"cafe_lv5"],[10,"cafe_lv4"],[12,"ban_lv3"],[14,"trai_lv4"],[20,"ghe_lv2"],[42,"an_lv3"],[48,"cafe_lv4"],[50,"an_lv3"],[52,"trai_lv4"]],
            orders: ["cafe_lv7","trai_lv6","an_lv4"],
            mechanics: {"adjWeb":true,"bonus":true,"spreadEvery":0},
            dialogue: {"npc":"cao","text":"Bình Minh Trên Đỉnh Mây! 🎁 Tận hưởng các Hộp Tiếp Tế miễn phí khi ghép ra vật phẩm Lv.5+ nhé!"}
        },
        {
            level: 32,
            name: "Trạm Quan Sát Sao Đêm",
            pattern: "pillars",
            generators: [[30,"generator_cooler"],[31,"generator_backpack"],[32,"generator_crate"]],
            freeItems: [[24,"congcu_lv5"],[38,"ghe_lv5"]],
            webItems: [[7,"congcu_lv5"],[9,"congcu_lv4"],[11,"ghe_lv5"],[13,"antoan_lv3"],[21,"bep_lv3"],[27,"ghe_lv4"],[43,"congcu_lv4"],[49,"antoan_lv3"],[55,"ghe_lv4"]],
            orders: ["ghe_lv7","congcu_lv7","antoan_lv5"],
            mechanics: {"adjWeb":true,"bonus":true,"spreadEvery":0},
            dialogue: {"npc":"de","text":"Đêm nay bầu trời trong vắt! Cùng dựng Trạm Quan Sát Sao Đêm với Công Cụ và Ghế Lv.7 để ngắm dải Ngân Hà nhé!"}
        },
        {
            level: 33,
            name: "Hang Nhện Cổ Thụ",
            pattern: "cross",
            generators: [[30,"generator_crate"],[32,"generator_backpack"]],
            freeItems: [[23,"bep_lv5"],[25,"an_lv5"]],
            webItems: [[2,"bep_lv5"],[4,"bep_lv5"],[16,"an_lv5"],[18,"tham_lv3"],[21,"cafe_lv3"],[27,"cafe_lv3"],[58,"bep_lv4"],[60,"an_lv5"]],
            orders: ["bep_lv7","an_lv7","tham_lv4"],
            mechanics: {"adjWeb":true,"bonus":true,"spreadEvery":16},
            dialogue: {"npc":"de","text":"⚠️ Cẩn thận ở Hang Nhện Cổ Thụ! Cứ mỗi 16 lần bấm nguồn phát, nhện sẽ giăng thêm 1 lưới mới. Hãy ghép thật khéo nhé!"}
        },
        {
            level: 34,
            name: "Suối Nước Nóng Tự Nhiên",
            pattern: "islands",
            generators: [[17,"generator_cooler"],[31,"generator_crate"],[45,"generator_backpack"]],
            freeItems: [[24,"ban_lv5"],[38,"tham_lv5"]],
            webItems: [[7,"ban_lv5"],[8,"ban_lv5"],[12,"tham_lv5"],[13,"ban_lv4"],[35,"tham_lv5"],[41,"congcu_lv3"],[49,"cafe_lv4"],[55,"cafe_lv4"]],
            orders: ["ban_lv7","tham_lv7","cafe_lv6"],
            mechanics: {"adjWeb":true,"bonus":true,"spreadEvery":0},
            dialogue: {"npc":"gau","text":"Tuyệt vời! Tụi mình phát hiện một Suối Nước Nóng Tự Nhiên! Chuẩn bị Bàn, Thảm Lv.7 và Cà Phê để ngâm mình thư giãn nào!"}
        },
        {
            level: 35,
            name: "Cầu Tre Vượt Thác",
            pattern: "valley",
            generators: [[30,"generator_cooler"],[31,"generator_backpack"],[32,"generator_crate"]],
            freeItems: [[24,"antoan_lv5"],[38,"cafe_lv5"]],
            webItems: [[2,"antoan_lv5"],[4,"antoan_lv4"],[9,"bep_lv2"],[11,"cafe_lv5"],[15,"cafe_lv4"],[19,"ghe_lv3"],[43,"antoan_lv4"],[47,"ban_lv3"],[58,"cafe_lv4"],[60,"ban_lv3"]],
            orders: ["antoan_lv7","cafe_lv7","ban_lv5"],
            mechanics: {"adjWeb":true,"bonus":true,"spreadEvery":16},
            dialogue: {"npc":"cao","text":"Thử thách cuối Chương 3: Cầu Tre Vượt Thác! Hãy tận dụng các món Lv.6 trong mạng nhện để vượt thác lên Đỉnh Tuyết!"}
        },
        // --- CHƯƠNG 4: ĐỈNH TUYẾT HUYỀN THOẠI (Lv 36 - 45) ---
        {
            level: 36,
            name: "Vườn Thảo Mộc Hoang Dã",
            pattern: "box5x7",
            generators: [[30,"generator_backpack"],[32,"generator_crate"]],
            freeItems: [[23,"an_lv6"],[25,"tham_lv4"]],
            webItems: [[8,"an_lv6"],[10,"an_lv5"],[12,"an_lv5"],[16,"bep_lv4"],[18,"tham_lv4"],[43,"an_lv4"],[45,"tham_lv4"],[47,"bep_lv4"]],
            orders: ["an_lv8","tham_lv6","bep_lv6"],
            mechanics: {"adjWeb":true,"bonus":true,"spreadEvery":0},
            dialogue: {"npc":"gau","text":"Chào mừng tới Chương 4: Đỉnh Tuyết Huyền Thoại! Lần đầu tiên mở khóa món Tối Thượng Lv.8 tại Vườn Thảo Mộc Hoang Dã!"}
        },
        {
            level: 37,
            name: "Đêm Sương Mù Dày Đặc",
            pattern: "hourglass",
            generators: [[30,"generator_backpack"],[32,"generator_crate"]],
            freeItems: [[24,"congcu_lv6"],[38,"cafe_lv5"]],
            webItems: [[7,"congcu_lv6"],[9,"congcu_lv5"],[11,"antoan_lv3"],[13,"cafe_lv5"],[15,"bep_lv4"],[19,"an_lv3"],[49,"congcu_lv5"],[51,"bep_lv4"],[53,"cafe_lv4"],[55,"antoan_lv3"]],
            orders: ["congcu_lv8","cafe_lv7","antoan_lv5"],
            mechanics: {"adjWeb":true,"bonus":true,"spreadEvery":16},
            dialogue: {"npc":"de","text":"Đêm Sương Mù Dày Đặc trên núi tuyết! Hãy chế tạo Công Cụ Lv.8 tối thượng để soi sáng xuyên qua màn sương và lũ nhện!"}
        },
        {
            level: 38,
            name: "Lều Bạt Giữa Bão Tuyết",
            pattern: "fortress",
            generators: [[23,"generator_cooler"],[25,"generator_crate"]],
            freeItems: [[16,"trai_lv6"],[40,"bep_lv5"]],
            webItems: [[8,"trai_lv6"],[10,"trai_lv5"],[12,"bep_lv5"],[15,"bep_lv5"],[19,"tham_lv4"],[22,"tham_lv4"],[26,"trai_lv5"],[44,"tham_lv4"],[46,"bep_lv4"]],
            orders: ["trai_lv8","bep_lv7","ghe_lv4"],
            mechanics: {"adjWeb":true,"bonus":true,"spreadEvery":0},
            dialogue: {"npc":"cao","text":"Gió tuyết đang gào thét! Hãy ghép Lều Bạt Giữa Bão Tuyết đạt cấp độ Tối Thượng Lv.8 để cả đoàn trú ẩn an toàn nhé!"}
        },
        {
            level: 39,
            name: "Bữa Tiệc Nướng Bên Thác",
            pattern: "pillars",
            generators: [[30,"generator_cooler"],[31,"generator_backpack"],[32,"generator_crate"]],
            freeItems: [[24,"ban_lv6"],[38,"an_lv5"]],
            webItems: [[7,"ban_lv6"],[9,"ban_lv5"],[11,"cafe_lv3"],[13,"ghe_lv4"],[15,"congcu_lv3"],[19,"antoan_lv3"],[43,"an_lv5"],[47,"ban_lv5"],[49,"ghe_lv4"],[55,"an_lv4"]],
            orders: ["ban_lv8","an_lv7","ghe_lv6"],
            mechanics: {"adjWeb":true,"bonus":true,"spreadEvery":16},
            dialogue: {"npc":"gau","text":"Giữa trời tuyết trắng mà có Bữa Tiệc Nướng Bên Thác trên chiếc Bàn Tối Thượng Lv.8 thì ấm lòng phải biết!"}
        },
        {
            level: 40,
            name: "Trại Chính Giữa Đại Ngàn",
            pattern: "open",
            generators: [[30,"generator_cooler"],[31,"generator_backpack"],[32,"generator_crate"]],
            freeItems: [[23,"bep_lv6"],[24,"trai_lv5"],[25,"congcu_lv4"]],
            webItems: [[1,"bep_lv6"],[3,"bep_lv5"],[5,"tham_lv3"],[7,"an_lv2"],[13,"trai_lv5"],[14,"trai_lv5"],[20,"bep_lv5"],[42,"congcu_lv5"],[48,"antoan_lv3"],[49,"trai_lv4"],[55,"tham_lv3"],[57,"ghe_lv3"],[61,"bep_lv4"]],
            orders: ["bep_lv8","trai_lv7","congcu_lv6"],
            mechanics: {"adjWeb":true,"bonus":true,"spreadEvery":15},
            dialogue: {"npc":"gau","text":"Màn 40: Trại Chính Giữa Đại Ngàn! Hãy thắp sáng Bếp Lửa Tối Thượng Lv.8 để xua tan cái lạnh vùng sơn cước!"}
        },
        {
            level: 41,
            name: "Thử Thách Kiểm Lâm",
            pattern: "valley",
            generators: [[30,"generator_cooler"],[31,"generator_backpack"],[32,"generator_crate"]],
            freeItems: [[24,"ghe_lv6"],[38,"antoan_lv5"]],
            webItems: [[2,"ghe_lv6"],[4,"ghe_lv5"],[9,"bep_lv3"],[11,"trai_lv3"],[15,"ghe_lv5"],[19,"an_lv3"],[43,"antoan_lv5"],[47,"congcu_lv5"],[51,"antoan_lv4"],[53,"congcu_lv4"]],
            orders: ["ghe_lv8","antoan_lv7","congcu_lv6"],
            mechanics: {"adjWeb":true,"bonus":true,"spreadEvery":0},
            dialogue: {"npc":"de","text":"Thử Thách Kiểm Lâm! Ghép chiếc Ghế Tối Thượng Lv.8 cùng bộ trang bị An Toàn để vượt qua bài kiểm tra khắc nghiệt nhất!"}
        },
        {
            level: 42,
            name: "Quán Cà Phê Trên Cây",
            pattern: "islands",
            generators: [[17,"generator_backpack"],[45,"generator_cooler"]],
            freeItems: [[24,"cafe_lv6"],[38,"ban_lv5"]],
            webItems: [[7,"cafe_lv6"],[8,"cafe_lv5"],[12,"congcu_lv3"],[13,"cafe_lv5"],[21,"ban_lv5"],[35,"trai_lv4"],[41,"ghe_lv3"],[49,"ban_lv4"],[50,"trai_lv4"],[55,"congcu_lv3"]],
            orders: ["cafe_lv8","ban_lv7","congcu_lv5"],
            mechanics: {"adjWeb":true,"bonus":true,"spreadEvery":15},
            dialogue: {"npc":"cao","text":"Một Quán Cà Phê Trên Cây phủ tuyết trắng! Hãy pha chế thức uống Cà Phê Tối Thượng Lv.8 cho bức ảnh để đời của mình nhé!"}
        },
        {
            level: 43,
            name: "Đêm Lửa Trại Cuối Mùa",
            pattern: "hourglass",
            generators: [[30,"generator_crate"],[32,"generator_backpack"]],
            freeItems: [[24,"antoan_lv6"],[38,"bep_lv5"]],
            webItems: [[7,"antoan_lv6"],[9,"antoan_lv5"],[11,"antoan_lv5"],[13,"an_lv5"],[15,"tham_lv3"],[19,"cafe_lv3"],[49,"bep_lv5"],[51,"cafe_lv3"],[53,"an_lv4"],[55,"bep_lv4"]],
            orders: ["antoan_lv8","bep_lv7","an_lv6"],
            mechanics: {"adjWeb":true,"bonus":true,"spreadEvery":0},
            dialogue: {"npc":"de","text":"Đêm Lửa Trại Cuối Mùa! Trang bị An Toàn Tối Thượng Lv.8 sẽ bảo vệ trại của chúng ta trước cơn bão tuyết đêm nay!"}
        },
        {
            level: 44,
            name: "Bình Minh Bắc Cực Quang",
            pattern: "fortress",
            generators: [[23,"generator_crate"],[25,"generator_cooler"]],
            freeItems: [[16,"tham_lv6"],[40,"ghe_lv5"]],
            webItems: [[8,"tham_lv6"],[10,"ghe_lv5"],[12,"tham_lv5"],[15,"antoan_lv5"],[19,"tham_lv5"],[22,"ghe_lv4"],[26,"tham_lv4"],[44,"ban_lv4"],[46,"antoan_lv5"]],
            orders: ["tham_lv8","ghe_lv7","antoan_lv7"],
            mechanics: {"adjWeb":true,"bonus":true,"spreadEvery":15},
            dialogue: {"npc":"cao","text":"Nhìn lên bầu trời kìa: Bình Minh Bắc Cực Quang! Hãy trải tấm Thảm Tối Thượng Lv.8 và dựng Lều Lv.7 để chiêm ngưỡng kỳ quan này!"}
        },
        {
            level: 45,
            name: "Huyền Thoại Vua Cắm Trại",
            pattern: "open",
            generators: [[30,"generator_cooler"],[31,"generator_backpack"],[32,"generator_crate"]],
            freeItems: [[23,"an_lv6"],[24,"trai_lv6"],[25,"bep_lv6"]],
            webItems: [[1,"an_lv6"],[2,"an_lv6"],[3,"cafe_lv3"],[5,"trai_lv6"],[7,"trai_lv6"],[13,"ghe_lv3"],[14,"bep_lv6"],[20,"bep_lv6"],[42,"antoan_lv3"],[48,"an_lv4"],[49,"trai_lv4"],[55,"bep_lv4"],[57,"ghe_lv3"],[59,"congcu_lv3"],[61,"cafe_lv3"]],
            orders: ["an_lv8","trai_lv8","bep_lv8","cafe_lv4"],
            mechanics: {"adjWeb":true,"bonus":true,"spreadEvery":15},
            dialogue: {"npc":"gau","text":"🏆 Màn Cuối 45: Huyền Thoại Vua Cắm Trại! Cả 3 tụi mình — Gấu, Cáo và Dế — cùng bạn chinh phục 3 đại đơn hàng Lv.8 cuối cùng!"}
        }
    ]

};





// =============================================================================

// CÁC HÀM HỖ TRỢ TIỆN ÍCH DÀNH RIÊNG CHO GAME ENGINE (KHÔNG CẦN CHỈNH SỬA)

// =============================================================================

if (typeof window !== 'undefined') {

    window.GAME_CONFIG = GAME_CONFIG;

}

if (typeof module !== 'undefined' && module.exports) {

    module.exports = GAME_CONFIG;

} 