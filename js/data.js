// ==========================================
// DỮ LIỆU 45 LEVEL DUY NHẤT (Lộ trình mở khóa trọn vẹn Lv.1 -> Lv.8)
// - Lv 1 - 10 : Đơn hàng tối đa Lv.4 - Lv.5
// - Lv 11 - 25: Mở khóa đơn hàng Lv.6
// - Lv 26 - 35: Mở khóa đơn hàng Lv.7
// - Lv 36 - 45: Mở khóa trọn bộ 9 vật phẩm tối thượng Lv.8
// ==========================================

// Danh sách ảnh nền màn chơi & bản đồ (Tự động lặp tuần hoàn 1..N; khi thêm ảnh nền mới chỉ cần nối tiếp vào mảng này)
var LEVEL_BACKGROUNDS = [
    'assets/images/ui/bg_01.jpg',
    'assets/images/ui/bg_02.jpg',
    'assets/images/ui/bg_03.jpg',
    'assets/images/ui/bg04.jpg',
    'assets/images/ui/bg05.jpg'
];

function getLevelBackground(lvNum) {
    if (!LEVEL_BACKGROUNDS || !LEVEL_BACKGROUNDS.length) return 'assets/images/ui/bg_01.jpg';
    var idx = (Math.max(1, parseInt(lvNum, 10) || 1) - 1) % LEVEL_BACKGROUNDS.length;
    return LEVEL_BACKGROUNDS[idx];
}

var RAW_LEVELS = [
    // --- CHƯƠNG 1: KHỞI ĐẦU BÃI CỎ (Lv 1 - 10: Đơn hàng Lv.3 - Lv.5) ---
    [1, "Bữa Sáng Khởi Đầu", "box5x5", [[31,"generator_cooler"]], [], [[15,"an_lv1"],[19,"ban_lv1"],[37,"cafe_lv2"],[41,"cafe_lv2"]], ["an_lv4","ban_lv3"]],
    [2, "Dựng Lều Cắm Trại", "box5x5", [[31,"generator_backpack"]], [], [[15,"trai_lv1"],[17,"tham_lv1"],[19,"ghe_lv2"],[37,"ghe_lv2"],[41,"tham_lv2"]], ["trai_lv4","tham_lv4"]],
    [3, "Nhóm Lửa Giữa Rừng", "box5x5", [[31,"generator_crate"]], [], [[15,"bep_lv1"],[17,"congcu_lv1"],[19,"antoan_lv2"],[37,"antoan_lv2"],[39,"bep_lv2"],[41,"congcu_lv2"]], ["bep_lv4","congcu_lv4","antoan_lv3"]],
    [4, "Cà Phê Sương Sớm", "box5x5", [[30,"generator_cooler"],[32,"generator_backpack"]], [], [[15,"cafe_lv1"],[17,"an_lv2"],[19,"ghe_lv2"],[37,"ban_lv2"],[39,"tham_lv2"],[41,"trai_lv2"]], ["cafe_lv4","ghe_lv4","an_lv3"]],
    [5, "Bộ Ba Hành Trang", "box5x7", [[30,"generator_cooler"],[31,"generator_backpack"],[32,"generator_crate"]], [], [[8,"an_lv1"],[10,"trai_lv1"],[12,"bep_lv1"],[16,"ban_lv2"],[18,"tham_lv2"],[44,"congcu_lv2"],[46,"cafe_lv2"],[48,"antoan_lv2"]], ["an_lv4","trai_lv4","bep_lv4"], { adjWeb: true }],
    [6, "Bàn Trà Dưới Tán Cây", "box5x7", [[30,"generator_cooler"],[32,"generator_backpack"]], [], [[8,"ban_lv2"],[10,"ghe_lv1"],[12,"cafe_lv2"],[15,"an_lv2"],[19,"trai_lv2"],[43,"tham_lv2"],[45,"ban_lv3"],[47,"ghe_lv2"]], ["ban_lv5","ghe_lv4","cafe_lv4"], { adjWeb: true }],
    [7, "Thu Dọn Bãi Cỏ", "cross", [[30,"generator_crate"],[32,"generator_backpack"]], [], [[2,"congcu_lv2"],[4,"antoan_lv1"],[16,"bep_lv2"],[18,"trai_lv2"],[21,"tham_lv2"],[27,"ghe_lv2"],[58,"congcu_lv3"],[60,"antoan_lv2"]], ["congcu_lv5","antoan_lv4","tham_lv4"], { adjWeb: true }],
    [8, "Bữa Trưa Dã Ngoại", "cross", [[30,"generator_cooler"],[32,"generator_crate"]], [], [[2,"an_lv2"],[4,"bep_lv2"],[14,"ban_lv2"],[20,"congcu_lv2"],[42,"cafe_lv2"],[48,"antoan_lv2"],[58,"an_lv3"],[60,"bep_lv3"]], ["an_lv5","bep_lv5","ban_lv4"], { adjWeb: true }],
    [9, "Chỗ Ngủ Êm Ái", "rounded", [[30,"generator_backpack"],[32,"generator_crate"]], [], [[8,"tham_lv2"],[12,"trai_lv2"],[14,"ghe_lv2"],[20,"antoan_lv2"],[22,"bep_lv2"],[26,"congcu_lv2"],[42,"tham_lv3"],[48,"trai_lv3"],[51,"ghe_lv3"]], ["tham_lv5","trai_lv5","antoan_lv4"], { adjWeb: true }],
    [10, "Đêm Lửa Trại Đầu Tiên", "pillars", [[30,"generator_cooler"],[31,"generator_backpack"],[32,"generator_crate"]], [], [[7,"bep_lv2"],[13,"an_lv2"],[15,"trai_lv3"],[19,"ghe_lv2"],[21,"ban_lv2"],[27,"congcu_lv2"],[43,"cafe_lv2"],[47,"tham_lv2"],[49,"bep_lv3"],[55,"an_lv3"]], ["bep_lv5","an_lv5","trai_lv5"], { adjWeb: true }],

    // --- CHƯƠNG 2: RỪNG SÂU & BỜ SUỐI (Lv 11 - 25: Mở khóa Lv.6) ---
    [11, "Thung Lũng Gió Lộng", "valley", [[30,"generator_backpack"],[32,"generator_crate"]], [], [[2,"trai_lv2"],[4,"congcu_lv2"],[9,"ghe_lv2"],[11,"bep_lv2"],[15,"antoan_lv2"],[19,"tham_lv3"],[43,"trai_lv3"],[47,"congcu_lv3"],[58,"ghe_lv3"],[60,"bep_lv3"]], ["trai_lv5","congcu_lv5","tham_lv5"], { adjWeb: true }],
    [12, "Hương Vị Robusta", "hourglass", [[30,"generator_cooler"],[32,"generator_crate"]], [[24,"cafe_lv4"]], [[7,"cafe_lv3"],[13,"ban_lv2"],[15,"an_lv2"],[19,"bep_lv2"],[22,"congcu_lv2"],[26,"antoan_lv2"],[49,"cafe_lv4"],[51,"ban_lv3"],[53,"an_lv3"],[55,"bep_lv3"]], ["cafe_lv6","ban_lv5","bep_lv4"], { adjWeb: true }],
    [13, "Hai Bờ Suối Nhỏ", "islands", [[17,"generator_cooler"],[45,"generator_backpack"]], [[24,"an_lv4"]], [[7,"an_lv3"],[8,"cafe_lv2"],[12,"ban_lv2"],[13,"an_lv4"],[21,"cafe_lv2"],[27,"ban_lv2"],[35,"ghe_lv3"],[41,"tham_lv2"],[49,"trai_lv3"],[50,"ghe_lv3"],[54,"tham_lv3"],[55,"trai_lv3"]], ["an_lv6","ghe_lv5","trai_lv5"], { adjWeb: true }],
    [14, "Trạm Sơ Cứu Rừng Sâu", "fortress", [[30,"generator_crate"],[32,"generator_backpack"]], [[24,"antoan_lv4"]], [[8,"antoan_lv3"],[10,"congcu_lv3"],[12,"bep_lv2"],[15,"tham_lv3"],[19,"ghe_lv2"],[22,"trai_lv2"],[26,"antoan_lv4"],[36,"congcu_lv3"],[40,"bep_lv3"],[44,"tham_lv3"],[46,"ghe_lv3"]], ["antoan_lv6","congcu_lv5","tham_lv5"], { adjWeb: true }],
    [15, "Bữa Tiệc Trái Cây", "pillars", [[30,"generator_cooler"],[31,"generator_backpack"],[32,"generator_crate"]], [[24,"an_lv4"],[38,"ban_lv4"]], [[7,"an_lv3"],[9,"ban_lv3"],[11,"cafe_lv2"],[13,"ghe_lv3"],[15,"trai_lv2"],[19,"tham_lv2"],[21,"bep_lv2"],[27,"congcu_lv2"],[43,"antoan_lv2"],[47,"ban_lv4"],[49,"an_lv4"],[55,"ghe_lv3"]], ["an_lv6","ban_lv6","ghe_lv5"], { adjWeb: true }],
    [16, "Mắc Võng Giữa Rừng", "rounded", [[30,"generator_backpack"],[32,"generator_cooler"]], [[24,"tham_lv4"],[38,"trai_lv4"]], [[8,"tham_lv3"],[10,"ghe_lv2"],[12,"trai_lv3"],[14,"cafe_lv3"],[20,"ban_lv2"],[22,"an_lv2"],[26,"tham_lv4"],[36,"ghe_lv3"],[40,"trai_lv4"],[42,"cafe_lv3"],[48,"ban_lv3"],[52,"an_lv3"]], ["tham_lv6","trai_lv6","cafe_lv5"], { adjWeb: true }],
    [17, "Ánh Đèn Dây Lung Linh", "hourglass", [[30,"generator_crate"],[32,"generator_backpack"]], [[24,"congcu_lv4"],[38,"bep_lv4"]], [[7,"congcu_lv3"],[9,"bep_lv3"],[11,"antoan_lv2"],[13,"trai_lv3"],[15,"tham_lv2"],[19,"ghe_lv2"],[22,"congcu_lv4"],[26,"bep_lv4"],[49,"antoan_lv3"],[51,"trai_lv3"],[53,"tham_lv3"],[55,"ghe_lv3"]], ["congcu_lv6","bep_lv6","trai_lv5"], { adjWeb: true }],
    [18, "Bàn Gỗ Xếp Thủ Công", "islands", [[17,"generator_cooler"],[45,"generator_crate"]], [[24,"ban_lv4"],[38,"bep_lv4"]], [[7,"ban_lv3"],[8,"cafe_lv4"],[12,"an_lv2"],[13,"ban_lv4"],[21,"cafe_lv4"],[27,"an_lv3"],[35,"bep_lv3"],[41,"congcu_lv2"],[49,"antoan_lv2"],[50,"bep_lv4"],[54,"congcu_lv3"],[55,"antoan_lv3"]], ["ban_lv6","cafe_lv6","bep_lv6"], { adjWeb: true }],
    [19, "Trú Mưa Khẩn Cấp", "fortress", [[23,"generator_backpack"],[25,"generator_crate"]], [[16,"trai_lv4"],[40,"antoan_lv4"]], [[8,"trai_lv3"],[9,"antoan_lv3"],[11,"congcu_lv4"],[12,"tham_lv2"],[15,"ghe_lv2"],[19,"bep_lv2"],[22,"trai_lv4"],[26,"antoan_lv4"],[36,"congcu_lv4"],[40,"tham_lv3"],[43,"ghe_lv3"],[47,"bep_lv3"]], ["trai_lv6","antoan_lv6","congcu_lv6"], { adjWeb: true }],
    [20, "Lửa Trại Rực Hồng", "open", [[30,"generator_cooler"],[31,"generator_backpack"],[32,"generator_crate"]], [[23,"bep_lv4"],[24,"an_lv4"],[25,"trai_lv4"]], [[1,"bep_lv4"],[3,"an_lv4"],[5,"trai_lv4"],[7,"ghe_lv3"],[13,"cafe_lv2"],[14,"ban_lv2"],[20,"tham_lv2"],[42,"congcu_lv2"],[48,"antoan_lv2"],[49,"cafe_lv3"],[55,"ban_lv3"],[57,"tham_lv3"],[59,"congcu_lv3"],[61,"antoan_lv3"]], ["bep_lv6","an_lv6","trai_lv6"], { adjWeb: true }],
    [21, "Giải Cứu Thùng Đá", "pillars", [[30,"generator_backpack"],[31,"generator_cooler"],[32,"generator_crate"]], [[24,"an_lv4"],[38,"tham_lv4"]], [[7,"an_lv4"],[8,"tham_lv4"],[12,"ghe_lv4"],[13,"bep_lv2"],[14,"trai_lv2"],[20,"congcu_lv2"],[21,"cafe_lv2"],[27,"ban_lv2"],[42,"ghe_lv4"],[48,"trai_lv3"],[49,"congcu_lv3"],[50,"cafe_lv3"],[54,"ban_lv3"],[55,"bep_lv3"]], ["an_lv6","tham_lv6","ghe_lv6"], { adjWeb: true }],
    [22, "Góc Chill Cà Phê Moka", "hourglass", [[30,"generator_cooler"],[32,"generator_backpack"]], [[24,"cafe_lv4"],[38,"ban_lv4"]], [[7,"cafe_lv4"],[8,"ban_lv4"],[9,"ghe_lv4"],[11,"an_lv2"],[12,"trai_lv2"],[13,"tham_lv2"],[15,"cafe_lv3"],[19,"ban_lv3"],[49,"ghe_lv4"],[50,"an_lv3"],[51,"trai_lv3"],[53,"tham_lv3"],[54,"an_lv3"],[55,"trai_lv3"]], ["cafe_lv6","ban_lv6","ghe_lv6"], { adjWeb: true }],
    [23, "Đài Phát Thanh Rừng Già", "valley", [[30,"generator_crate"],[32,"generator_backpack"]], [[24,"antoan_lv4"],[38,"congcu_lv4"]], [[2,"antoan_lv4"],[3,"congcu_lv4"],[4,"bep_lv2"],[9,"trai_lv2"],[10,"tham_lv3"],[11,"ghe_lv2"],[15,"antoan_lv3"],[19,"congcu_lv3"],[43,"bep_lv3"],[47,"trai_lv3"],[51,"tham_lv3"],[53,"ghe_lv3"],[58,"bep_lv3"],[60,"trai_lv3"]], ["antoan_lv6","congcu_lv6","tham_lv5"], { adjWeb: true }],
    [24, "Bếp Nướng Than Hoa", "islands", [[17,"generator_crate"],[45,"generator_cooler"]], [[24,"bep_lv4"],[38,"an_lv4"]], [[7,"bep_lv4"],[8,"congcu_lv2"],[12,"antoan_lv2"],[13,"bep_lv3"],[15,"congcu_lv3"],[19,"antoan_lv3"],[21,"bep_lv3"],[27,"congcu_lv3"],[35,"an_lv4"],[41,"ban_lv3"],[43,"cafe_lv2"],[47,"an_lv3"],[49,"ban_lv3"],[55,"cafe_lv3"]], ["bep_lv6","an_lv6","ban_lv5"], { adjWeb: true }],
    [25, "Sofa Giữa Thiên Nhiên", "fortress", [[23,"generator_backpack"],[25,"generator_cooler"]], [[16,"tham_lv4"],[40,"ghe_lv4"]], [[8,"tham_lv4"],[9,"ghe_lv4"],[10,"trai_lv2"],[11,"ban_lv2"],[12,"cafe_lv4"],[15,"an_lv2"],[19,"tham_lv3"],[22,"ghe_lv3"],[26,"trai_lv3"],[36,"ban_lv3"],[40,"cafe_lv4"],[43,"an_lv3"],[45,"trai_lv3"],[47,"ban_lv3"]], ["tham_lv6","ghe_lv6","cafe_lv6"], { adjWeb: true }],

    // --- CHƯƠNG 3: CHINH PHỤC ĐÈO CAO (Lv 26 - 35: Mở khóa Lv.7) ---
    [26, "Bàn Chiến Thuật IGT", "pillars", [[30,"generator_cooler"],[31,"generator_backpack"],[32,"generator_crate"]], [[23,"ban_lv5"],[25,"ghe_lv5"]], [[7,"ban_lv5"],[8,"ghe_lv5"],[9,"cafe_lv2"],[11,"an_lv2"],[12,"trai_lv2"],[13,"tham_lv2"],[15,"bep_lv4"],[19,"congcu_lv2"],[21,"antoan_lv2"],[27,"cafe_lv3"],[43,"an_lv3"],[47,"trai_lv3"],[49,"bep_lv4"],[52,"ban_lv4"],[55,"ghe_lv4"]], ["ban_lv7","ghe_lv7","bep_lv6"], { adjWeb: true }],
    [27, "Đèn Bão Xuyên Đêm", "hourglass", [[30,"generator_crate"],[32,"generator_backpack"]], [[24,"congcu_lv5"],[38,"antoan_lv5"]], [[7,"congcu_lv5"],[8,"antoan_lv5"],[9,"bep_lv2"],[10,"trai_lv2"],[11,"tham_lv2"],[12,"ghe_lv4"],[13,"congcu_lv4"],[15,"antoan_lv4"],[19,"bep_lv3"],[49,"trai_lv3"],[50,"tham_lv3"],[51,"ghe_lv4"],[53,"bep_lv3"],[54,"trai_lv3"],[55,"tham_lv3"]], ["congcu_lv7","antoan_lv7","ghe_lv6"], { adjWeb: true }],
    [28, "Trạm Điện Dự Phòng", "open", [[30,"generator_crate"],[31,"generator_cooler"],[32,"generator_backpack"]], [[23,"antoan_lv5"],[25,"cafe_lv5"]], [[1,"antoan_lv5"],[2,"cafe_lv5"],[3,"bep_lv2"],[4,"congcu_lv2"],[5,"ban_lv4"],[7,"an_lv2"],[13,"trai_lv2"],[14,"tham_lv2"],[20,"ghe_lv2"],[42,"bep_lv3"],[48,"congcu_lv3"],[49,"ban_lv4"],[55,"an_lv3"],[57,"antoan_lv4"],[59,"cafe_lv4"],[61,"ghe_lv3"]], ["antoan_lv7","cafe_lv7","ban_lv6"], { adjWeb: true }],
    [29, "Khu Nghỉ Dưỡng Glamping", "open", [[30,"generator_backpack"],[31,"generator_cooler"],[32,"generator_crate"]], [[23,"trai_lv5"],[24,"tham_lv5"],[25,"ghe_lv5"]], [[1,"trai_lv5"],[2,"tham_lv5"],[3,"ghe_lv5"],[4,"an_lv2"],[5,"ban_lv2"],[7,"cafe_lv2"],[13,"bep_lv2"],[14,"congcu_lv2"],[20,"antoan_lv2"],[42,"an_lv3"],[48,"ban_lv3"],[49,"cafe_lv3"],[55,"bep_lv3"],[57,"trai_lv4"],[59,"tham_lv4"],[61,"ghe_lv4"]], ["trai_lv7","tham_lv7","ghe_lv7"], { adjWeb: true }],
    [30, "Tiệc Nướng Sườn Đồi", "open", [[30,"generator_cooler"],[31,"generator_backpack"],[32,"generator_crate"]], [[23,"an_lv5"],[24,"bep_lv5"],[25,"ban_lv5"]], [[1,"an_lv5"],[2,"bep_lv5"],[3,"ban_lv5"],[4,"cafe_lv2"],[5,"congcu_lv2"],[7,"antoan_lv2"],[13,"trai_lv2"],[14,"tham_lv2"],[20,"ghe_lv2"],[21,"cafe_lv3"],[27,"congcu_lv3"],[35,"antoan_lv3"],[41,"trai_lv3"],[42,"tham_lv3"],[48,"ghe_lv3"],[49,"an_lv4"],[55,"bep_lv4"],[57,"ban_lv4"]], ["an_lv7","bep_lv7","ban_lv7"], { adjWeb: true }],
    [31, "Bình Minh Trên Đỉnh Mây", "rounded", [[30,"generator_cooler"],[32,"generator_backpack"]], [[24,"cafe_lv5"],[38,"trai_lv5"]], [[8,"cafe_lv5"],[10,"an_lv3"],[12,"ban_lv2"],[14,"trai_lv5"],[20,"ghe_lv2"],[42,"tham_lv3"],[48,"cafe_lv4"],[50,"an_lv4"],[52,"trai_lv4"]], ["cafe_lv7","trai_lv7","an_lv5"], { adjWeb: true, bonus: true }],
    [32, "Trạm Quan Sát Sao Đêm", "pillars", [[30,"generator_crate"],[32,"generator_backpack"]], [[24,"congcu_lv5"],[38,"ghe_lv5"]], [[7,"congcu_lv5"],[9,"antoan_lv3"],[11,"bep_lv2"],[13,"tham_lv2"],[21,"trai_lv3"],[27,"ghe_lv5"],[43,"congcu_lv4"],[49,"antoan_lv4"],[55,"ghe_lv4"]], ["congcu_lv7","ghe_lv7","antoan_lv5"], { adjWeb: true, bonus: true }],
    [33, "Hang Nhện Cổ Thụ", "cross", [[30,"generator_crate"],[32,"generator_cooler"]], [[23,"bep_lv5"],[25,"an_lv5"]], [[2,"bep_lv5"],[4,"congcu_lv2"],[16,"an_lv5"],[18,"ban_lv2"],[21,"cafe_lv4"],[27,"antoan_lv3"],[58,"bep_lv4"],[60,"an_lv4"]], ["bep_lv7","an_lv7","cafe_lv5"], { adjWeb: true, bonus: true, spreadEvery: 12 }],
    [34, "Suối Nước Nóng Tự Nhiên", "islands", [[17,"generator_cooler"],[45,"generator_backpack"]], [[24,"ban_lv5"],[38,"tham_lv5"]], [[7,"ban_lv5"],[8,"cafe_lv3"],[12,"an_lv2"],[13,"ban_lv4"],[35,"tham_lv5"],[41,"ghe_lv2"],[49,"trai_lv3"],[55,"tham_lv4"]], ["ban_lv7","tham_lv7","cafe_lv5"], { adjWeb: true, bonus: true }],
    [35, "Cầu Tre Vượt Thác", "valley", [[30,"generator_crate"],[32,"generator_backpack"]], [[24,"antoan_lv5"],[38,"trai_lv5"]], [[2,"antoan_lv5"],[4,"congcu_lv3"],[9,"bep_lv2"],[11,"trai_lv5"],[15,"tham_lv3"],[19,"ghe_lv3"],[43,"antoan_lv4"],[47,"congcu_lv4"],[58,"trai_lv4"],[60,"bep_lv3"]], ["antoan_lv7","trai_lv7","congcu_lv5"], { adjWeb: true, bonus: true, spreadEvery: 12 }],

    // --- CHƯƠNG 4: ĐỈNH TUYẾT HUYỀN THOẠI (Lv 36 - 45: Mở khóa trọn bộ 9 vật phẩm tối thượng Lv.8!) ---
    [36, "Vườn Thảo Mộc Hoang Dã", "box5x7", [[30,"generator_cooler"],[31,"generator_backpack"],[32,"generator_crate"]], [[23,"an_lv6"],[25,"tham_lv4"]], [[8,"an_lv6"],[10,"an_lv5"],[12,"ghe_lv2"],[16,"bep_lv3"],[18,"congcu_lv2"],[44,"an_lv4"],[46,"tham_lv4"],[48,"bep_lv4"]], ["an_lv8","tham_lv6","bep_lv5"], { adjWeb: true, bonus: true }],
    [37, "Đêm Sương Mù Dày Đặc", "hourglass", [[30,"generator_crate"],[32,"generator_cooler"]], [[24,"congcu_lv6"],[38,"cafe_lv5"]], [[7,"congcu_lv6"],[9,"congcu_lv5"],[11,"antoan_lv2"],[13,"cafe_lv5"],[15,"bep_lv4"],[19,"ban_lv3"],[49,"congcu_lv4"],[51,"bep_lv4"],[53,"cafe_lv4"],[55,"antoan_lv3"]], ["congcu_lv8","cafe_lv7","bep_lv6"], { adjWeb: true, bonus: true, spreadEvery: 12 }],
    [38, "Lều Bạt Giữa Bão Tuyết", "fortress", [[23,"generator_backpack"],[25,"generator_crate"]], [[16,"trai_lv6"],[40,"bep_lv5"]], [[8,"trai_lv6"],[10,"trai_lv5"],[12,"ghe_lv2"],[15,"bep_lv5"],[19,"antoan_lv2"],[22,"tham_lv4"],[26,"trai_lv4"],[44,"tham_lv4"],[46,"bep_lv4"]], ["trai_lv8","bep_lv7","tham_lv6"], { adjWeb: true, bonus: true }],
    [39, "Bữa Tiệc Nướng Bên Thác", "pillars", [[30,"generator_cooler"],[32,"generator_crate"]], [[24,"ban_lv6"],[38,"an_lv5"]], [[7,"ban_lv6"],[9,"ban_lv5"],[11,"cafe_lv2"],[13,"bep_lv4"],[15,"congcu_lv3"],[19,"antoan_lv3"],[43,"an_lv5"],[47,"ban_lv4"],[49,"bep_lv4"],[55,"an_lv4"]], ["ban_lv8","an_lv7","bep_lv6"], { adjWeb: true, bonus: true, spreadEvery: 12 }],
    [40, "Trại Chính Giữa Đại Ngàn", "open", [[30,"generator_cooler"],[31,"generator_backpack"],[32,"generator_crate"]], [[23,"bep_lv6"],[24,"trai_lv5"],[25,"congcu_lv4"]], [[1,"bep_lv6"],[3,"bep_lv5"],[5,"tham_lv2"],[7,"an_lv2"],[13,"trai_lv5"],[14,"cafe_lv3"],[20,"bep_lv4"],[42,"congcu_lv4"],[48,"antoan_lv3"],[49,"trai_lv4"],[55,"an_lv3"],[57,"ghe_lv3"],[61,"bep_lv4"]], ["bep_lv8","trai_lv7","congcu_lv6"], { adjWeb: true, bonus: true, spreadEvery: 11 }],
    [41, "Thử Thách Kiểm Lâm", "valley", [[30,"generator_crate"],[32,"generator_backpack"]], [[24,"ghe_lv6"],[38,"antoan_lv5"]], [[2,"ghe_lv6"],[4,"ghe_lv5"],[9,"bep_lv3"],[11,"trai_lv3"],[15,"ghe_lv4"],[19,"tham_lv2"],[43,"antoan_lv5"],[47,"congcu_lv4"],[51,"antoan_lv4"],[53,"congcu_lv4"]], ["ghe_lv8","antoan_lv7","congcu_lv6"], { adjWeb: true, bonus: true }],
    [42, "Quán Cà Phê Trên Cây", "islands", [[17,"generator_cooler"],[45,"generator_backpack"]], [[24,"cafe_lv6"],[38,"ban_lv5"]], [[7,"cafe_lv6"],[8,"cafe_lv5"],[12,"an_lv3"],[13,"cafe_lv4"],[21,"ban_lv5"],[35,"ghe_lv4"],[41,"trai_lv2"],[49,"ban_lv4"],[50,"ghe_lv4"],[55,"trai_lv3"]], ["cafe_lv8","ban_lv7","ghe_lv6"], { adjWeb: true, bonus: true, spreadEvery: 11 }],
    [43, "Đêm Lửa Trại Cuối Mùa", "hourglass", [[30,"generator_crate"],[32,"generator_cooler"]], [[24,"antoan_lv6"],[38,"bep_lv5"]], [[7,"antoan_lv6"],[9,"antoan_lv5"],[11,"antoan_lv4"],[13,"an_lv4"],[15,"ban_lv3"],[19,"cafe_lv3"],[49,"bep_lv5"],[51,"congcu_lv3"],[53,"an_lv4"],[55,"bep_lv4"]], ["antoan_lv8","bep_lv7","an_lv6"], { adjWeb: true, bonus: true }],
    [44, "Bình Minh Bắc Cực Quang", "fortress", [[23,"generator_backpack"],[25,"generator_crate"]], [[16,"tham_lv6"],[40,"trai_lv6"]], [[8,"tham_lv6"],[10,"trai_lv6"],[12,"tham_lv5"],[15,"antoan_lv5"],[19,"congcu_lv3"],[22,"trai_lv5"],[26,"tham_lv4"],[44,"trai_lv4"],[46,"antoan_lv5"]], ["tham_lv8","trai_lv8","antoan_lv7"], { adjWeb: true, bonus: true, spreadEvery: 11 }],
    [45, "Huyền Thoại Vua Cắm Trại", "open", [[30,"generator_cooler"],[31,"generator_backpack"],[32,"generator_crate"]], [[23,"an_lv6"],[24,"trai_lv6"],[25,"bep_lv6"]], [[1,"an_lv6"],[2,"an_lv5"],[3,"cafe_lv3"],[5,"trai_lv6"],[7,"trai_lv5"],[13,"ghe_lv3"],[14,"bep_lv6"],[20,"bep_lv5"],[42,"antoan_lv3"],[48,"an_lv4"],[49,"trai_lv4"],[55,"bep_lv4"],[57,"ghe_lv3"],[59,"congcu_lv3"],[61,"ban_lv3"]], ["an_lv8","trai_lv8","bep_lv8"], { adjWeb: true, bonus: true, spreadEvery: 11 }]
];

function getLevelConfig(lvNum) {
    var row = RAW_LEVELS.find(r => r[0] === lvNum) || RAW_LEVELS[0];
    var mech = row[7] || {};
    return {
        num: row[0],
        name: row[1],
        pattern: row[2],
        gens: row[3],
        free: row[4],
        webs: row[5],
        rawOrders: row[6],
        adjWeb: mech.adjWeb !== undefined ? mech.adjWeb : (row[0] >= 5),
        bonus: !!mech.bonus,
        spreadEvery: mech.spreadEvery || 0
    };
}

// ==========================================
// 3 NHÂN VẬT ĐỒNG HÀNH & KỊCH BẢN TRÒ CHUYỆN 45 LEVEL
// ==========================================
var NPC_CHARACTERS = {
    gau: {
        id: 'gau',
        name: '🐻 Bác Gấu Nâu',
        avatar: 'assets/images/items/avata_gau.png',
        role: 'Bếp Trưởng & Pha Chế'
    },
    cao: {
        id: 'cao',
        name: '🦊 Nhiếp Ảnh Cáo',
        avatar: 'assets/images/items/avata_cao.png',
        role: 'Thám Hiểm & Săn Ảnh'
    },
    de: {
        id: 'de',
        name: '🦗 Học Giả Dế Mèn',
        avatar: 'assets/images/items/avata_de.png',
        role: 'Kỹ Thuật & Sổ Tay Sinh Tồn'
    }
};

var NPC_ORDER = ['gau', 'cao', 'de'];

var LEVEL_STORY_DIALOGUES = {
    // Chương 1: Khởi Đầu Bãi Cỏ (Lv 1 - 10)
    1:  { npc: 'gau', text: 'Chào mừng tới Bữa Sáng Khởi Đầu! Chạm vào Thùng Đá ở giữa bàn cờ để chuẩn bị đồ ăn sáng cùng mình nhé!' },
    2:  { npc: 'cao', text: 'Trời nắng đẹp quá! Giúp mình ghép Lều và Thảm từ Ba Lô để dựng góc chụp ảnh cắm trại đầu tiên nhé!' },
    3:  { npc: 'de',  text: 'Sương rừng bắt đầu xuống rồi! Mở Thùng Đồ Nghề để ghép Bếp Lửa, Công Cụ và Đồ Sơ Cứu giữ ấm cho cả đoàn nhé!' },
    4:  { npc: 'gau', text: 'Buổi sớm mà có tách Cà Phê nóng và chiếc Ghế êm ngắm sương sớm thì tuyệt cú mèo! Cùng pha chế nào!' },
    5:  { npc: 'de',  text: 'Mẹo mới từ Lv.5: Ghép vật phẩm ngay sát bên cạnh Mạng Nhện 🕸️ cũng sẽ làm rách toàn bộ nhện xung quanh đấy!' },
    6:  { npc: 'cao', text: 'Mình vừa tìm được tán cây cực chill! Hãy ghép Bàn Trà, Ghế Xếp và Cà Phê để cả nhóm ngồi nghỉ chân nhé!' },
    7:  { npc: 'de',  text: 'Bãi cỏ phía trước còn vướng nhiều mạng nhện quá, hãy ghép Công Cụ và Thảm để thu dọn lối đi thật sạch nhé!' },
    8:  { npc: 'gau', text: 'Đến giờ Bữa Trưa Dã Ngoại rồi! Bụng mình kêu ùng ục rồi, mau chuẩn bị Đồ Ăn, Bếp Nướng và Bàn Gỗ thôi!' },
    9:  { npc: 'cao', text: 'Đi bộ cả ngày mỏi chân ghê, tối nay tụi mình cần Chỗ Ngủ Êm Ái với Thảm và Lều thật ấm áp nhé!' },
    10: { npc: 'gau', text: 'Đêm Lửa Trại Đầu Tiên! Cả 3 tụi mình sẽ quây quần bên nhau, hãy hoàn thành các món lớn mừng cột mốc Lv.10 nào!' },

    // Chương 2: Rừng Sâu & Bờ Suối (Lv 11 - 25)
    11: { npc: 'cao', text: 'Bước vào Chương 2: Thung Lũng Gió Lộng! Gió thổi mạnh lắm, cần gia cố Lều, Công Cụ và Thảm thật chắc chắn nhé!' },
    12: { npc: 'gau', text: 'Hương Vị Robusta giữa rừng sâu! Từ màn này đơn hàng cấp 6 sẽ xuất hiện, pha giúp mình bình cà phê thượng hạng nhé!' },
    13: { npc: 'cao', text: 'Bàn cờ chia làm Hai Bờ Suối Nhỏ tuyệt đẹp! Hãy tận dụng khoảng trống ở cả hai bờ để ghép Đồ Ăn, Ghế và Lều nhé!' },
    14: { npc: 'de',  text: 'Rừng sâu nhiều gai góc, tụi mình cần dựng Trạm Sơ Cứu Rừng Sâu với Hộp Sơ Cứu Lv.6 để bảo vệ cả đoàn!' },
    15: { npc: 'gau', text: 'Mình tìm thấy quá trời quả rừng tươi ngon! Cùng bày Bữa Tiệc Trái Cây hoành tráng trên Bàn Tiệc và Ghế lớn nào!' },
    16: { npc: 'cao', text: 'Nghe tiếng chim hót bên suối kìa! Mắc Võng Giữa Rừng và nhâm nhi tách cà phê để mình chụp một tấm kỷ niệm nhé!' },
    17: { npc: 'de',  text: 'Rừng già tối rất nhanh, hãy ghép Công Cụ Ánh Sáng Lv.6 để thắp lên Ánh Đèn Dây Lung Linh khắp khu trại!' },
    18: { npc: 'gau', text: 'Bàn Gỗ Xếp Thủ Công kết hợp với Cà Phê và Bếp Nướng ở hai bờ suối sẽ tạo nên góc ẩm thực ngoài trời đỉnh nhất!' },
    19: { npc: 'de',  text: 'Mây đen kéo đến rồi! Mau dựng khu Trú Mưa Khẩn Cấp với Lều, Đồ Sơ Cứu và Công Cụ Lv.6 trước khi mưa đổ xuống!' },
    20: { npc: 'cao', text: 'Mưa tạnh rồi, Lửa Trại Rực Hồng giữa rừng đêm đẹp như tranh vẽ! Hãy hoàn thành bộ ba Lv.6 mừng cột mốc màn 20!' },
    21: { npc: 'gau', text: 'Ôi không, kho lương thực bị mạng nhện giăng kín! Hãy Giải Cứu Thùng Đá để chuẩn bị bữa tối và chỗ nghỉ cho đoàn nhé!' },
    22: { npc: 'gau', text: 'Sau buổi sáng bận rộn, hãy tạo một Góc Chill Cà Phê Moka thơm lừng với Bàn và Ghế hạng sang nào!' },
    23: { npc: 'de',  text: 'Ở Đài Phát Thanh Rừng Già, tụi mình cần thiết bị An Toàn và Công Cụ Lv.6 để bắt sóng liên lạc về trạm kiểm lâm!' },
    24: { npc: 'gau', text: 'Than hồng đã đỏ rực bên suối! Cùng chuẩn bị Bếp Nướng Than Hoa và Đồ Ăn Lv.6 thơm nức mũi nhé!' },
    25: { npc: 'cao', text: 'Khép lại Chương 2 bằng bộ Sofa Giữa Thiên Nhiên! Vừa êm ái vừa sang chảnh để chụp bộ ảnh bìa tạp chí cắm trại!' },

    // Chương 3: Chinh Phục Đèo Cao (Lv 26 - 35)
    26: { npc: 'de',  text: 'Chào mừng tới Chương 3: Đèo Cao! Tụi mình bắt đầu chế tạo vật phẩm Lv.7 siêu cấp, mở màn với Bàn Chiến Thuật IGT!' },
    27: { npc: 'de',  text: 'Gió đèo thổi rít suốt đêm! Hãy ghép Đèn Bão Xuyên Đêm và Thiết Bị An Toàn Lv.7 để giữ sáng cho toàn trại!' },
    28: { npc: 'gau', text: 'Lên đèo cao trời lạnh buốt, cần Trạm Điện Dự Phòng Lv.7 để chạy máy pha Cà Phê Espresso nóng hổi cho cả đoàn!' },
    29: { npc: 'cao', text: 'Biến sườn đèo thành Khu Nghỉ Dưỡng Glamping 5 sao với trọn bộ Lều, Thảm và Ghế Lv.7 đẹp mê hồn nào!' },
    30: { npc: 'gau', text: 'Cột mốc màn 30: Tiệc Nướng Sườn Đồi! Cả 3 món Đồ Ăn, Bếp và Bàn đều đạt cấp 7, bữa tiệc lớn nhất từ đầu hành trình!' },
    31: { npc: 'cao', text: 'Bình Minh Trên Đỉnh Mây! 🎁 Từ màn này, mỗi lần ghép ra món Lv.5+ bạn sẽ được nhận thêm 1 Hộp Tiếp Tế miễn phí đấy!' },
    32: { npc: 'de',  text: 'Đêm nay bầu trời trong vắt! Cùng dựng Trạm Quan Sát Sao Đêm với Công Cụ và Ghế Lv.7 để ngắm dải Ngân Hà nhé!' },
    33: { npc: 'de',  text: '⚠️ Cẩn thận ở Hang Nhện Cổ Thụ! Cứ mỗi 12 lần bấm nguồn phát, nhện sẽ giăng thêm 1 lưới mới. Hãy ghép thật khéo nhé!' },
    34: { npc: 'gau', text: 'Tuyệt vời! Tụi mình phát hiện một Suối Nước Nóng Tự Nhiên! Chuẩn bị Bàn, Thảm Lv.7 và Cà Phê để ngâm mình thư giãn nào!' },
    35: { npc: 'cao', text: 'Thử thách cuối Chương 3: Cầu Tre Vượt Thác! Nhện cổ thụ vẫn đang lan, hãy ghép thật nhanh để vượt thác lên Đỉnh Tuyết!' },

    // Chương 4: Đỉnh Tuyết Huyền Thoại (Lv 36 - 45)
    36: { npc: 'gau', text: 'Chào mừng tới Chương 4: Đỉnh Tuyết Huyền Thoại! Lần đầu tiên mở khóa món Tối Thượng Lv.8 tại Vườn Thảo Mộc Hoang Dã!' },
    37: { npc: 'de',  text: 'Đêm Sương Mù Dày Đặc trên núi tuyết! Hãy chế tạo Công Cụ Lv.8 tối thượng để soi sáng xuyên qua màn sương và lũ nhện!' },
    38: { npc: 'cao', text: 'Gió tuyết đang gào thét! Hãy ghép Lều Bạt Giữa Bão Tuyết đạt cấp độ Tối Thượng Lv.8 để cả đoàn trú ẩn an toàn nhé!' },
    39: { npc: 'gau', text: 'Giữa trời tuyết trắng mà có Bữa Tiệc Nướng Bên Thác trên chiếc Bàn Tối Thượng Lv.8 thì ấm lòng phải biết!' },
    40: { npc: 'gau', text: 'Màn 40: Trại Chính Giữa Đại Ngàn! Hãy thắp sáng Bếp Lửa Tối Thượng Lv.8 để xua tan cái lạnh vùng sơn cước!' },
    41: { npc: 'de',  text: 'Thử Thách Kiểm Lâm! Ghép chiếc Ghế Tối Thượng Lv.8 cùng bộ trang bị An Toàn để vượt qua bài kiểm tra khắc nghiệt nhất!' },
    42: { npc: 'cao', text: 'Một Quán Cà Phê Trên Cây phủ tuyết trắng! Hãy pha chế thức uống Cà Phê Tối Thượng Lv.8 cho bức ảnh để đời của mình nhé!' },
    43: { npc: 'de',  text: 'Đêm Lửa Trại Cuối Mùa! Trang bị An Toàn Tối Thượng Lv.8 sẽ bảo vệ trại của chúng ta trước cơn bão tuyết đêm nay!' },
    44: { npc: 'cao', text: 'Nhìn lên bầu trời kìa: Bình Minh Bắc Cực Quang! Hãy trải tấm Thảm Tối Thượng Lv.8 và dựng Lều Lv.8 để chiêm ngưỡng kỳ quan này!' },
    45: { npc: 'gau', text: '🏆 Màn Cuối 45: Huyền Thoại Vua Cắm Trại! Cả 3 tụi mình — Gấu, Cáo và Dế — cùng bạn chinh phục 3 đại đơn hàng Lv.8 cuối cùng!' }
};