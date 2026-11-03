/**
 * ==========================================================================
 * CẤU HÌNH MÀN HÌNH "TRẠI CỦA BẠN" (MY CAMP CONFIG)
 * ==========================================================================
 * File này giúp bạn chủ động tùy chỉnh:
 *  1. Kích thước ảnh nền (chiều rộng 400px), màu nền xung quanh (#566443).
 *  2. Thao tác Kéo (Pan) và Phóng to / Thu nhỏ (Zoom) lên/xuống tối đa 140%.
 *  3. Vị trí (left, top), kích thước (width, height), phân lớp (zIndex) của từng item.
 *  4. Thêm bất kỳ đối tượng trang trí cố định hoặc slot trang bị mới vào bãi trại.
 *  5. Bật / tắt lưới ô để kiểm tra căn chỉnh khi cần.
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

// 2. CẤU HÌNH SÂN KHẤU, ẢNH NỀN, THAO TÁC KÉO/ZOOM & VỊ TRÍ ITEM
var MYCAMP_CONFIG = {
    // -------------------------------------------------------------------------
    // I. CẤU HÌNH ẢNH NỀN & MÀU NỀN MÀN HÌNH
    // -------------------------------------------------------------------------
    background: {
        src: 'assets/images/items_khutrai/bg_khutrai.jpg', // File ảnh nền mặc định (nếu địa điểm chưa có ảnh _bg)
        width: 460,             // Chiều rộng ảnh nền cố định (mặc định 400px - bạn có thể sửa tại đây)
        height: 596,            // Chiều cao ảnh nền (tỷ lệ chuẩn 1100x1640 tương ứng 596px)
        color: '#566443'        // Màu nền màn hình (phần bao quanh không có ảnh nền)
    },

    // LIÊN KẾT ĐỊA ĐIỂM NGƯỜI DÙNG MUA VỚI ẢNH NỀN KHU TRẠI (HẬU TỐ _bg)
    // Khi người chơi mua và trang bị Điểm Đến trong Cửa Hàng, bãi trại sẽ tự động đổi sang ảnh nền tương ứng.
    // Nếu địa điểm chưa có ảnh riêng thì hệ thống tự động sử dụng ảnh nền mặc định bg_khutrai.jpg.
    locationBackgrounds: {
        'loc_doibu': 'assets/images/ui/bg_03_bg.jpg',     // Đồi Bù (bg_03.jpg -> bg_03_bg.jpg)
        'loc_matthan': 'assets/images/ui/bg07_bg.jpg',    // Núi Mắt Thần (bg07.jpg -> bg07_bg.jpg)
        'loc_bangioc': 'assets/images/ui/bg05_bg.jpg'     // Thác Bản Giốc (bg05.jpg -> bg05_bg.jpg)
    },

    // -------------------------------------------------------------------------
    // II. CẤU HÌNH KÉO (PAN) & PHÓNG TO / THU NHỎ (ZOOM) TOÀN BỘ KHÔNG GIAN
    // -------------------------------------------------------------------------
    viewport: {
        enablePan: true,        // Bật thao tác giữ chuột / ngón tay để kéo không gian
        enableZoom: true,       // Bật thao tác cuộn chuột / chụm 2 ngón tay để zoom
        defaultZoom: 1.0,       // Tỷ lệ hiển thị mặc định ban đầu (1.0 = 100%)
        minZoom: 0.7,           // Mức thu nhỏ tối thiểu (70%)
        maxZoom: 1.4,           // Mức phóng to tối đa (140% theo yêu cầu)
        initialPanX: 0,         // Độ lệch ngang ban đầu (0px = chính giữa màn hình)
        initialPanY: 0          // Độ lệch dọc ban đầu (0px = chính giữa màn hình)
    },

    // -------------------------------------------------------------------------
    // III. CẤU HÌNH LƯỚI Ô CĂN CHỈNH (GRID)
    // -------------------------------------------------------------------------
    grid: {
        show: false,            // Đổi thành true nếu bạn muốn hiện đường kẻ lưới để căn chỉnh
        cellWidth: 120,         // Bề ngang mỗi ô lưới (px)
        cellHeight: 60,         // Chiều cao mỗi ô lưới (px)
        color: '#000000',       // Màu viền lưới
        opacity: 0.5            // Độ mờ đục của đường kẻ
    },

    // -------------------------------------------------------------------------
    // IV. CẤU HÌNH THÚ CƯNG TRÊN BÃI CỎ (THEO CON VẬT NGƯỜI CHƠI CHỌN MUA)
    // -------------------------------------------------------------------------
    // Khu trại tự động hiển thị thú cưng theo con vật người chơi đang chọn (SAVE.activePet).
    // NẾU CON VẬT NÀO CHƯA CÓ CHUYỂN ĐỘNG THÌ KHU TRẠI SẼ TỰ ĐỘNG ĐỂ TRỐNG BÃI CỎ!
    // Bạn có thể chủ động sửa tọa độ (left, top), độ rộng, thời gian, frame cho từng con dưới đây:
    pets: {
        // 1. CHÚ CHÓ GOLDEN (character01) - Mặc định sở hữu
        'character01': {
            id: 'character01',
            name: 'Chú chó Golden',
            left: 108,               // Tọa độ ngang (px) - BẠN CHỦ ĐỘNG SỬA TẠI ĐÂY
            top: 320,                // Tọa độ dọc (px)   - BẠN CHỦ ĐỘNG SỬA TẠI ĐÂY
            width: 76,               // Chiều rộng khung bãi cỏ (px)
            height: 90,              // Chiều cao khung bãi cỏ (px)
            zIndex: 18,              // Phân lớp hiển thị (nằm trên bãi cỏ, cạnh bếp/ghế)
            fps: 8,                  // Tốc độ khung hình (8 hình/giây)

            // Động tác 1: ĐỨNG (Idle - 20 frame)
            state1Name: 'stand',
            state1Duration: 14,       // Thời gian ĐỨNG (giây) - BẠN CHỦ ĐỘNG SỬA TẠI ĐÂY
            state1Width: 56,         // Chiều rộng khi đứng (px)
            state1Frames: [
                'assets/images/npc_anim/goden_idle1.png',
                'assets/images/npc_anim/goden_idle2.png',
                'assets/images/npc_anim/goden_idle3.png',
                'assets/images/npc_anim/goden_idle4.png',
                'assets/images/npc_anim/goden_idle5.png',
                'assets/images/npc_anim/goden_idle6.png',
                'assets/images/npc_anim/goden_idle7.png',
                'assets/images/npc_anim/goden_idle8.png',
                'assets/images/npc_anim/goden_idle9.png',
                'assets/images/npc_anim/goden_idle10.png',
                'assets/images/npc_anim/goden_idle11.png',
                'assets/images/npc_anim/goden_idle12.png',
                'assets/images/npc_anim/goden_idle13.png',
                'assets/images/npc_anim/goden_idle14.png',
                'assets/images/npc_anim/goden_idle15.png',
                'assets/images/npc_anim/goden_idle16.png',
                'assets/images/npc_anim/goden_idle17.png',
                'assets/images/npc_anim/goden_idle18.png',
                'assets/images/npc_anim/goden_idle19.png',
                'assets/images/npc_anim/goden_idle20.png'
            ],

            // Động tác 2: NGỒI (Sit - 20 frame)
            state2Name: 'sit',
            state2Duration: 3,        // Thời gian NGỒI (giây) - BẠN CHỦ ĐỘNG SỬA TẠI ĐÂY
            state2Width: 72,         // Chiều rộng khi ngồi (px)
            state2Frames: [
                'assets/images/npc_anim/goden_sit1.png',
                'assets/images/npc_anim/goden_sit2.png',
                'assets/images/npc_anim/goden_sit3.png',
                'assets/images/npc_anim/goden_sit4.png',
                'assets/images/npc_anim/goden_sit5.png',
                'assets/images/npc_anim/goden_sit6.png',
                'assets/images/npc_anim/goden_sit7.png',
                'assets/images/npc_anim/goden_sit8.png',
                'assets/images/npc_anim/goden_sit9.png',
                'assets/images/npc_anim/goden_sit10.png',
                'assets/images/npc_anim/goden_sit11.png',
                'assets/images/npc_anim/goden_sit12.png',
                'assets/images/npc_anim/goden_sit13.png',
                'assets/images/npc_anim/goden_sit14.png',
                'assets/images/npc_anim/goden_sit15.png',
                'assets/images/npc_anim/goden_sit16.png',
                'assets/images/npc_anim/goden_sit17.png',
                'assets/images/npc_anim/goden_sit18.png',
                'assets/images/npc_anim/goden_sit19.png',
                'assets/images/npc_anim/goden_sit20.png'
            ]
        },

        // 2. CHÚ MÈO ANH (character07) - Mua trong Cửa Hàng
        'character07': {
            id: 'character07',
            name: 'Chú mèo Anh',
            left: 108,               // Tọa độ ngang (px) - BẠN CHỦ ĐỘNG SỬA TẠI ĐÂY
            top: 320,                // Tọa độ dọc (px)   - BẠN CHỦ ĐỘNG SỬA TẠI ĐÂY
            width: 76,               // Chiều rộng khung bãi cỏ (px)
            height: 90,              // Chiều cao khung bãi cỏ (px)
            zIndex: 18,              // Phân lớp hiển thị
            fps: 8,                  // Tốc độ khung hình (8 hình/giây)

            // Động tác 1: ĐỨNG NGHỈ (Idle - 15 frame)
            state1Name: 'idle',
            state1Duration: 8,        // Thời gian ĐỨNG NGHỈ (giây) - BẠN CHỦ ĐỘNG SỬA TẠI ĐÂY
            state1Width: 64,         // Chiều rộng khi đứng nghỉ (px) (tỷ lệ 180x214)
            state1Frames: [
                'assets/images/npc_anim/meoanh_idle1.png',
                'assets/images/npc_anim/meoanh_idle2.png',
                'assets/images/npc_anim/meoanh_idle3.png',
                'assets/images/npc_anim/meoanh_idle4.png',
                'assets/images/npc_anim/meoanh_idle5.png',
                'assets/images/npc_anim/meoanh_idle6.png',
                'assets/images/npc_anim/meoanh_idle7.png',
                'assets/images/npc_anim/meoanh_idle8.png',
                'assets/images/npc_anim/meoanh_idle9.png',
                'assets/images/npc_anim/meoanh_idle10.png',
                'assets/images/npc_anim/meoanh_idle11.png',
                'assets/images/npc_anim/meoanh_idle12.png',
                'assets/images/npc_anim/meoanh_idle13.png',
                'assets/images/npc_anim/meoanh_idle14.png',
                'assets/images/npc_anim/meoanh_idle15.png'
            ],

            // Động tác 2: VẪY TAY CHÀO (Hello - 20 frame)
            state2Name: 'hello',
            state2Duration: 4,        // Thời gian VẪY TAY CHÀO (giây) - BẠN CHỦ ĐỘNG SỬA TẠI ĐÂY
            state2Width: 64,         // Chiều rộng khi vẫy tay (px)
            state2Frames: [
                'assets/images/npc_anim/meoanh_hello1.png',
                'assets/images/npc_anim/meoanh_hello2.png',
                'assets/images/npc_anim/meoanh_hello3.png',
                'assets/images/npc_anim/meoanh_hello4.png',
                'assets/images/npc_anim/meoanh_hello5.png',
                'assets/images/npc_anim/meoanh_hello6.png',
                'assets/images/npc_anim/meoanh_hello7.png',
                'assets/images/npc_anim/meoanh_hello8.png',
                'assets/images/npc_anim/meoanh_hello9.png',
                'assets/images/npc_anim/meoanh_hello10.png',
                'assets/images/npc_anim/meoanh_hello11.png',
                'assets/images/npc_anim/meoanh_hello12.png',
                'assets/images/npc_anim/meoanh_hello13.png',
                'assets/images/npc_anim/meoanh_hello14.png',
                'assets/images/npc_anim/meoanh_hello15.png',
                'assets/images/npc_anim/meoanh_hello16.png',
                'assets/images/npc_anim/meoanh_hello17.png',
                'assets/images/npc_anim/meoanh_hello18.png',
                'assets/images/npc_anim/meoanh_hello19.png',
                'assets/images/npc_anim/meoanh_hello20.png'
            ]
        }

        // CÁC CON VẬT KHÁC (Labrador, Poodle, Bulldog, Béc-giê, Ba Tư, Maine Coon, Ragdoll, Xiêm):
        // Khi người chơi mua và chọn các con vật này, vì chưa có chuỗi ảnh chuyển động nên hệ thống
        // sẽ TỰ ĐỘNG ĐỂ TRỐNG bãi cỏ như yêu cầu. Sau này bạn chỉ cần bổ sung vào đây là hiển thị ngay!
    },

    // -------------------------------------------------------------------------
    // V. CẤU HÌNH THƯỞNG VUỐT VE THÚ CƯNG (PET REWARD CONFIG)
    // -------------------------------------------------------------------------
    // Chu kỳ 10 phút được chạm 1 lần. Khi hết 10 phút hiện đồng xu bé trên đầu thú cưng.
    // Người chơi chạm & giữ từ 1s - 3s để nhận tiền thưởng bay ra tương ứng:
    petReward: {
        cooldownMinutes: 10,     // Chu kỳ hồi chiêu (10 phút)
        minHoldSeconds: 1,       // Thời gian giữ tối thiểu để nhận vàng (1s)
        maxHoldSeconds: 3,       // Thời gian giữ tối đa (3s = mốc cao nhất)
        tiers: [
            { seconds: 1, gold: 750 },   // 1s -> 750 Vàng
            { seconds: 2, gold: 1200 },  // 2s -> 1.200 Vàng
            { seconds: 3, gold: 2000 }   // 3s -> 2.000 Vàng (tối đa)
        ]
    },

    // -------------------------------------------------------------------------
    // VI. DANH SÁCH CÁC ĐỐI TƯỢNG TRÊN BÃI CẮM TRẠI (ĐÃ CĂN CHUẨN TRÊN NỀN 400PX)
    // -------------------------------------------------------------------------
    // Tọa độ left (ngang) và top (dọc) được tính trực tiếp từ góc trên-trái (0, 0)
    // của ảnh nền 400px, đảm bảo ảnh nền và các item LUÔN CỐ ĐỊNH KHÔNG BỊ LỆCH NHAU!
    // -------------------------------------------------------------------------
    items: [
        // ==========================================
        // 1. VẬT TRANG TRÍ MẶC ĐỊNH (CỐ ĐỊNH)
        // ==========================================
        {
            id: 'tree-1',
            name: 'Cây thông bên trái (mỏm đá trái)',
            type: 'decor',
            src: 'assets/images/items_khutrai/tree.png',
            left: 45,
            top: 235,
            width: 38,
            height: 'auto',
            zIndex: 9
        },
        {
            id: 'tree-2',
            name: 'Cây thông ở giữa (sau lưng lều)',
            type: 'decor',
            src: 'assets/images/items_khutrai/tree.png',
            left: 200,
            top: 205,
            width: 36,
            height: 'auto',
            zIndex: 9
        },
        {
            id: 'lamp',
            name: 'Cột đèn dã ngoại (bên bờ suối)',
            type: 'decor',
            src: 'assets/images/items_khutrai/icon_den.png',
            left: 230,
            top: 245,
            width: 24,
            height: 'auto',
            zIndex: 13
        },

        // ==========================================
        // 2. CÁC VẬT DỤNG TRANG BỊ LINH HOẠT (SLOTS)
        // ==========================================
        {
            id: 'slot-tent',
            name: 'Lều cắm trại (Bãi cỏ bên trái)',
            type: 'slot',
            slotKey: 'tent',
            left: 85,
            top: 250,
            width: 140,
            height: 'auto',
            zIndex: 12
        },
        {
            id: 'slot-chair2',
            name: 'Ghế 2 (Bên phải, phía sau bàn)',
            type: 'slot',
            slotKey: 'chair2',
            left: 230,
            top: 315,
            width: 66,
            height: 'auto',
            zIndex: 14
        },
        {
            id: 'slot-chair1',
            name: 'Ghế 1 (Ghế trung tâm cạnh cửa lều)',
            type: 'slot',
            slotKey: 'chair1',
            left: 178,
            top: 338,
            width: 66,
            height: 'auto',
            zIndex: 15
        },
        {
            id: 'slot-table',
            name: 'Bàn dã ngoại (Phía trước ghế 2)',
            type: 'slot',
            slotKey: 'table',
            left: 238,
            top: 358,
            width: 85,
            height: 85,
            zIndex: 16,
            fit: 'contain'
        },
        {
            id: 'slot-stove',
            name: 'Bếp nướng dã ngoại (Phía trước ghế 1)',
            type: 'slot',
            slotKey: 'stove',
            left: 180,
            top: 395,
            width: 58,
            height: 'auto',
            zIndex: 17
        },

        // ==========================================
        // 3. VỊ TRÍ THÚ CƯNG ĐỒNG HÀNH TRÊN BÃI CỎ (PET SLOT)
        // ==========================================
        // Thú cưng sẽ tự động hiển thị theo con vật người chơi chọn mua (SAVE.activePet).
        // NẾU CON VẬT NÀO CHƯA CÓ CHUYỂN ĐỘNG THÌ HỆ THỐNG SẼ TỰ ĐỘNG ĐỂ TRỐNG BÃI CỎ!
        // Toàn bộ hoạt ảnh, thời gian, frame chi tiết của từng con đã được gom riêng ở mục "IV. pets" ở trên.
        {
            id: 'slot-pet',
            name: 'Thú cưng đồng hành (Gán theo người mua)',
            type: 'pet',             // Tự động lấy hoạt ảnh theo con vật SAVE.activePet
            left: 108,               // Tọa độ ngang mặc định (px) - BẠN CHỦ ĐỘNG SỬA TẠI ĐÂY
            top: 320,                // Tọa độ dọc mặc định (px)   - BẠN CHỦ ĐỘNG SỬA TẠI ĐÂY
            width: 76,               // Chiều rộng khung bãi cỏ (px)
            height: 90,              // Chiều cao khung bãi cỏ (px)
            zIndex: 18               // Phân lớp hiển thị (nằm trên bãi cỏ, cạnh bếp/ghế)
        }

        // ==========================================
        // MẪU ĐỂ BẠN TỰ THÊM ĐỐI TƯỢNG MỚI:
        // (Chỉ cần copy mẫu dưới, bỏ // và điền thông số)
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
