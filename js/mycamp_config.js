/**
 * ==========================================================================
 * CẤU HÌNH MÀN HÌNH "TRẠI CỦA BẠN" (MY CAMP CONFIG)
 * ==========================================================================
 * File này giúp bạn dễ dàng:
 *  1. Tùy chỉnh vị trí (left, top), kích thước (width, height), phân lớp (zIndex) của từng item.
 *  2. Thêm bất kỳ đối tượng trang trí cố định hoặc slot trang bị mới vào bãi cắm trại.
 *  3. Bật / tắt lưới ô 120px x 60px để kiểm tra căn chỉnh.
 *  4. Thêm các vật phẩm mới trong thư mục images/items_khutrai vào game.
 * ==========================================================================
 */

// 1. DANH SÁCH VẬT PHẨM KHU TRẠI CÓ THỂ THU THẬP & TRANG BỊ
var KHUTRAI_ITEMS = {
    // --- LỀU TRẠI (TENT) ---
    'trai_lv4': { type: 'tent',  path: 'assets/images/items_khutrai/trai_lv4.png', name: 'Bạt Tăng Che Nắng' },
    'trai_lv5': { type: 'tent',  path: 'assets/images/items_khutrai/trai_lv5.png', name: 'Lều Vòm Cắm Trại 2 Người' },
    'trai_lv6': { type: 'tent',  path: 'assets/images/items_khutrai/trai_lv6.png', name: 'Lều Gia Đình Chống Gió' },
    'trai_lv7': { type: 'tent',  path: 'assets/images/items_khutrai/trai_lv7.png', name: 'Lều Kim Tự Tháp Glamping' },
    'trai_lv8': { type: 'tent',  path: 'assets/images/items_khutrai/trai_lv8.png', name: 'Biệt Thự Lều Glamping' },

    // --- BÀN DÃ NGOẠI (TABLE) ---
    'ban_lv1':  { type: 'table', path: 'assets/images/items_khutrai/ban_lv1.png',  name: 'Bàn Nhôm Vuông Mini' },
    'ban_lv2':  { type: 'table', path: 'assets/images/items_khutrai/ban_lv2.png',  name: 'Bàn Vải Gấp Dã Ngoại' },
    'ban_lv3':  { type: 'table', path: 'assets/images/items_khutrai/ban_lv3.png',  name: 'Bàn Trà Dã Ngoại' },
    'ban_lv4':  { type: 'table', path: 'assets/images/items_khutrai/ban_lv4.png',  name: 'Bàn Gỗ Cuộn Dã Ngoại' },
    'ban_lv5':  { type: 'table', path: 'assets/images/items_khutrai/ban_lv5.png',  name: 'Bàn Dã Ngoại Kèm Giá Lưới' },
    'ban_lv6':  { type: 'table', path: 'assets/images/items_khutrai/ban_lv6.png',  name: 'Bàn Cắm Trại Đa Năng' },
    'ban_lv7':  { type: 'table', path: 'assets/images/items_khutrai/ban_lv7.png',  name: 'Bàn Chiến Thuật IGT' },
    'ban_lv8':  { type: 'table', path: 'assets/images/items_khutrai/ban_lv8.png',  name: 'Trạm Bếp Nấu Ăn Glamping' },

    // --- BẾP & LỬA TRẠI (STOVE) ---
    'bep_lv1':  { type: 'stove', path: 'assets/images/items_khutrai/bep_lv1.png',  name: 'Nhánh Củi Khô' },
    'bep_lv2':  { type: 'stove', path: 'assets/images/items_khutrai/bep_lv2.png',  name: 'Khúc Gỗ Tròn' },
    'bep_lv3':  { type: 'stove', path: 'assets/images/items_khutrai/bep_lv3.png',  name: 'Bó Củi Buộc Dây' },
    'bep_lv4':  { type: 'stove', path: 'assets/images/items_khutrai/bep_lv4.png',  name: 'Hố Đá Xếp Lửa' },
    'bep_lv5':  { type: 'stove', path: 'assets/images/items_khutrai/bep_lv5.png',  name: 'Đống Củi Trại Vòng Đá' },
    'bep_lv6':  { type: 'stove', path: 'assets/images/items_khutrai/bep_lv6.png',  name: 'Lửa Trại Rực Hồng' },
    'bep_lv7':  { type: 'stove', path: 'assets/images/items_khutrai/bep_lv7.png',  name: 'Lò Nướng Than Hoa Tròn' },
    'bep_lv8':  { type: 'stove', path: 'assets/images/items_khutrai/bep_lv8.png',  name: 'Bếp Nướng BBQ Chữ Nhật' },

    // --- GHẾ DÃ NGOẠI (CHAIR) ---
    'ghe_lv1':  { type: 'chair', path: 'assets/images/items_khutrai/ghe_lv1.png',  name: 'Ghế Đôn Xếp Mini' },
    'ghe_lv2':  { type: 'chair', path: 'assets/images/items_khutrai/ghe_lv2.png',  name: 'Ghế Xếp Tựa Lưng Xanh' },
    'ghe_lv3':  { type: 'chair', path: 'assets/images/items_khutrai/ghe_lv3.png',  name: 'Ghế Xếp Dã Ngoại Màu Cát' },
    'ghe_lv4':  { type: 'chair', path: 'assets/images/items_khutrai/ghe_lv4.png',  name: 'Ghế Xếp Có Tay Vịn' },
    'ghe_lv5':  { type: 'chair', path: 'assets/images/items_khutrai/ghe_lv5.png',  name: 'Ghế Câu Cá Có Khay' },
    'ghe_lv6':  { type: 'chair', path: 'assets/images/items_khutrai/ghe_lv6.png',  name: 'Ghế Mặt Trăng Moon Chair' },
    'ghe_lv7':  { type: 'chair', path: 'assets/images/items_khutrai/ghe_lv7.png',  name: 'Ghế Tựa Lưng Cao Có Gối' },
    'ghe_lv8':  { type: 'chair', path: 'assets/images/items_khutrai/ghe_lv8.png',  name: 'Ghế Đạo Diễn Cao Cấp' }
};

// 2. CẤU HÌNH SÂN KHẤU, LƯỚI Ô & CÁC ĐỐI TƯỢNG HIỂN THỊ
var MYCAMP_CONFIG = {
    // Cấu hình hiển thị lưới ô 120px x 60px
    grid: {
        show: false,             // Đặt false để tắt lưới ô đen (đổi thành true nếu cần căn chỉnh lại)
        cellWidth: 120,          // Bề ngang mỗi ô (120px)
        cellHeight: 60,          // Chiều cao mỗi ô (60px)
        color: '#000000',        // Màu viền lưới
        opacity: 1.0             // Độ đậm của lưới (0.0 đến 1.0)
    },

    // Cấu hình khung sân khấu chính (Stage - tổng bề ngang 3 ô = 360px)
    stage: {
        width: 400,
        height: 540,
        top: 'clamp(120px, 13vh, 120px)' // Khoảng cách từ đỉnh màn hình xuống
    },

    /**
     * DANH SÁCH CÁC ĐỐI TƯỢNG TRÊN BÃI CẮM TRẠI:
     * -------------------------------------------------------------
     * Mỗi đối tượng gồm các thuộc tính:
     *  - id: Mã định danh duy nhất của đối tượng
     *  - name: Tên mô tả (dễ nhớ)
     *  - type: 
     *      + 'decor': Vật trang trí cố định (có thuộc tính 'src' trỏ đến file ảnh)
     *      + 'slot' : Vị trí gắn đồ trang bị người chơi thu thập (có 'slotKey')
     *  - left: Tọa độ ngang tính từ mép trái sân khấu (px)
     *  - top: Tọa độ dọc tính từ đỉnh sân khấu (px)
     *  - width: Chiều rộng (px hoặc 'auto')
     *  - height: Chiều cao (px hoặc 'auto')
     *  - zIndex: Độ ưu tiên lớp hiển thị (số càng lớn càng nằm đè lên trên)
     *  - fit: (tùy chọn) 'contain' để giữ nguyên tỷ lệ không bị méo ảnh
     * 
     * ==> Bạn có thể tự do thêm mới bất kỳ vật trang trí nào bằng cách copy mẫu bên dưới!
     */
    items: [
        // ==========================================
        // I. VẬT TRANG TRÍ MẶC ĐỊNH (CỐ ĐỊNH)
        // ==========================================
        {
            id: 'tree-1',
            name: 'Cây thông bên trái',
            type: 'decor',
            src: 'assets/images/items_khutrai/tree.png',
            left: 0,
            top: 30,
            width: 48,
            height: 'auto',
            zIndex: 9
        },
        {
            id: 'tree-2',
            name: 'Cây thông ở giữa (sau lưng lều)',
            type: 'decor',
            src: 'assets/images/items_khutrai/tree.png',
            left: 156,
            top: 15,
            width: 48,
            height: 'auto',
            zIndex: 9
        },
        {
            id: 'lamp',
            name: 'Cột đèn dã ngoại',
            type: 'decor',
            src: 'assets/images/items_khutrai/icon_den.png',
            left: 279,
            top: 60,
            width: 42,
            height: 'auto',
            zIndex: 13
        },

        // ==========================================
        // II. CÁC VẬT DỤNG TRANG BỊ LINH HOẠT (SLOTS)
        // ==========================================
        {
            id: 'slot-tent',
            name: 'Lều cắm trại (2x3 ô)',
            type: 'slot',
            slotKey: 'tent',
            left: 0,
            top: 60,
            width: 240,
            height: 'auto',
            zIndex: 12
        },
        {
            id: 'slot-chair2',
            name: 'Ghế 2 (Bên phải, phía sau bàn)',
            type: 'slot',
            slotKey: 'chair2',
            left: 236,
            top: 180,
            width: 120,
            height: 'auto',
            zIndex: 14
        },
        {
            id: 'slot-chair1',
            name: 'Ghế 1 (Ghế trung tâm bên cạnh lều)',
            type: 'slot',
            slotKey: 'chair1',
            left: 128,
            top: 232,
            width: 120,
            height: 'auto',
            zIndex: 15
        },
        {
            id: 'slot-table',
            name: 'Bàn dã ngoại (1x2 ô)',
            type: 'slot',
            slotKey: 'table',
            left: 250,
            top: 296,
            width: 125,
            height: 125,
            zIndex: 16,
            fit: 'contain'
        },
        {
            id: 'slot-stove',
            name: 'Bếp nướng dã ngoại (1x1 ô)',
            type: 'slot',
            slotKey: 'stove',
            left: 132,
            top: 350,
            width: 80,
            height: 'auto',
            zIndex: 17
        }

        // ==========================================
        // MẪU ĐỂ BẠN TỰ THÊM ĐỐI TƯỢNG MỚI:
        // (Chỉ cần bỏ dấu comment // và điền thông số)
        // ==========================================
        /*
        ,{
            id: 'my-decor-item',
            name: 'Tên đồ trang trí mới',
            type: 'decor',
            src: 'assets/images/items_khutrai/ten_anh.png',
            left: 120,
            top: 200,
            width: 80,
            height: 'auto',
            zIndex: 10
        }
        */
    ]
};
