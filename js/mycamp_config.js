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
    'trai_lv4': { type: 'tent',  path: 'assets/images_webp/items_khutrai/trai_lv4.webp', name: 'Bạt Tăng Che Nắng' },
    'trai_lv5': { type: 'tent',  path: 'assets/images_webp/items_khutrai/trai_lv5.webp', name: 'Lều Vòm Cắm Trại 2 Người' },
    'trai_lv6': { type: 'tent',  path: 'assets/images_webp/items_khutrai/trai_lv6.webp', name: 'Lều Gia Đình Chống Gió' },
    'trai_lv7': { type: 'tent',  path: 'assets/images_webp/items_khutrai/trai_lv7.webp', name: 'Lều Kim Tự Tháp Glamping' },
    'trai_lv8': { type: 'tent',  path: 'assets/images_webp/items_khutrai/trai_lv8.webp', name: 'Biệt Thự Lều Glamping' },
    'trai_lv9': { type: 'tent',  path: 'assets/images_webp/items_khutrai/trai_lv9.webp', name: 'Lều Safari Hoàng Gia' },
    'trai_lv10': { type: 'tent', path: 'assets/images_webp/items_khutrai/trai_lv10.webp', name: 'Lều Dome Kính Thiên Văn' },
    'trai_lv11': { type: 'tent', path: 'assets/images_webp/items_khutrai/trai_lv11.webp', name: 'Biệt Thự Vòm Glamping' },
    'trai_lv12': { type: 'tent', path: 'assets/images_webp/items_khutrai/trai_lv112.webp', name: 'Lâu Đài Cắm Trại Đỉnh Cao' },

    // --- BÀN DÃ NGOẠI (TABLE) ---
    'ban_lv1':  { type: 'table', path: 'assets/images_webp/items_khutrai/ban_lv1.webp',  name: 'Bàn Nhôm Vuông Mini' },
    'ban_lv2':  { type: 'table', path: 'assets/images_webp/items_khutrai/ban_lv2.webp',  name: 'Bàn Vải Gấp Dã Ngoại' },
    'ban_lv3':  { type: 'table', path: 'assets/images_webp/items_khutrai/ban_lv3.webp',  name: 'Bàn Trà Dã Ngoại' },
    'ban_lv4':  { type: 'table', path: 'assets/images_webp/items_khutrai/ban_lv4.webp',  name: 'Bàn Gỗ Cuộn Dã Ngoại' },
    'ban_lv5':  { type: 'table', path: 'assets/images_webp/items_khutrai/ban_lv5.webp',  name: 'Bàn Dã Ngoại Kèm Giá Lưới' },
    'ban_lv6':  { type: 'table', path: 'assets/images_webp/items_khutrai/ban_lv6.webp',  name: 'Bàn Cắm Trại Đa Năng' },
    'ban_lv7':  { type: 'table', path: 'assets/images_webp/items_khutrai/ban_lv7.webp',  name: 'Bàn Chiến Thuật IGT' },
    'ban_lv8':  { type: 'table', path: 'assets/images_webp/items_khutrai/ban_lv8.webp',  name: 'Trạm Bếp Nấu Ăn Glamping' },
    'ban_lv9':  { type: 'table', path: 'assets/images_webp/items_khutrai/ban_lv9.webp',  name: 'Bàn Tiệc Gỗ Sồi Hoàng Gia' },
    'ban_lv10': { type: 'table', path: 'assets/images_webp/items_khutrai/ban_lv10.webp', name: 'Bàn Quầy Bar Cắm Trại' },
    'ban_lv11': { type: 'table', path: 'assets/images_webp/items_khutrai/ban_lv11.webp', name: 'Bàn Đảo Bếp Sang Trọng' },
    'ban_lv12': { type: 'table', path: 'assets/images_webp/items_khutrai/ban_lv12.webp', name: 'Bàn Hoàng Gia Đỉnh Cao' },

    // --- BẾP & LỬA TRẠI (STOVE) ---
    'bep_lv1':  { type: 'stove', path: 'assets/images_webp/items_khutrai/bep_lv1.webp',  name: 'Nhánh Củi Khô' },
    'bep_lv2':  { type: 'stove', path: 'assets/images_webp/items_khutrai/bep_lv2.webp',  name: 'Khúc Gỗ Tròn' },
    'bep_lv3':  { type: 'stove', path: 'assets/images_webp/items_khutrai/bep_lv3.webp',  name: 'Bó Củi Buộc Dây' },
    'bep_lv4':  { type: 'stove', path: 'assets/images_webp/items_khutrai/bep_lv4.webp',  name: 'Hố Đá Xếp Lửa' },
    'bep_lv5':  { type: 'stove', path: 'assets/images_webp/items_khutrai/bep_lv5.webp',  name: 'Đống Củi Trại Vòng Đá' },
    'bep_lv6':  { type: 'stove', path: 'assets/images_webp/items_khutrai/bep_lv6.webp',  name: 'Lửa Trại Rực Hồng' },
    'bep_lv7':  { type: 'stove', path: 'assets/images_webp/items_khutrai/bep_lv7.webp',  name: 'Lò Nướng Than Hoa Tròn' },
    'bep_lv8':  { type: 'stove', path: 'assets/images_webp/items_khutrai/bep_lv8.webp',  name: 'Bếp Nướng BBQ Chữ Nhật' },
    'bep_lv9':  { type: 'stove', path: 'assets/images_webp/items_khutrai/bep_lv9.webp',  name: 'Bếp Ga Đôi Dã Ngoại' },
    'bep_lv10': { type: 'stove', path: 'assets/images_webp/items_khutrai/bep_lv10.webp', name: 'Bếp Củi Sưởi Đa Năng' },
    'bep_lv11': { type: 'stove', path: 'assets/images_webp/items_khutrai/bep_lv11.webp', name: 'Lò Nướng Pizza Ngoài Trời' },
    'bep_lv12': { type: 'stove', path: 'assets/images_webp/items_khutrai/bep_lv12.webp', name: 'Trạm Bếp Cắm Trại Đỉnh Cao' },

    // --- GHẾ DÃ NGOẠI (CHAIR) ---
    'ghe_lv1':  { type: 'chair', path: 'assets/images_webp/items_khutrai/ghe_lv1.webp',  name: 'Ghế Đôn Xếp Mini' },
    'ghe_lv2':  { type: 'chair', path: 'assets/images_webp/items_khutrai/ghe_lv2.webp',  name: 'Ghế Xếp Tựa Lưng Xanh' },
    'ghe_lv3':  { type: 'chair', path: 'assets/images_webp/items_khutrai/ghe_lv3.webp',  name: 'Ghế Xếp Dã Ngoại Màu Cát' },
    'ghe_lv4':  { type: 'chair', path: 'assets/images_webp/items_khutrai/ghe_lv4.webp',  name: 'Ghế Xếp Có Tay Vịn' },
    'ghe_lv5':  { type: 'chair', path: 'assets/images_webp/items_khutrai/ghe_lv5.webp',  name: 'Ghế Câu Cá Có Khay' },
    'ghe_lv6':  { type: 'chair', path: 'assets/images_webp/items_khutrai/ghe_lv6.webp',  name: 'Ghế Mặt Trăng Moon Chair' },
    'ghe_lv7':  { type: 'chair', path: 'assets/images_webp/items_khutrai/ghe_lv7.webp',  name: 'Ghế Tựa Lưng Cao Có Gối' },
    'ghe_lv8':  { type: 'chair', path: 'assets/images_webp/items_khutrai/ghe_lv8.webp',  name: 'Ghế Đạo Diễn Cao Cấp' },
    'ghe_lv9':  { type: 'chair', path: 'assets/images_webp/items_khutrai/ghe_lv9.webp',  name: 'Ghế Sofa Hơi Đôi Dã Ngoại' },
    'ghe_lv10': { type: 'chair', path: 'assets/images_webp/items_khutrai/ghe_lv10.webp', name: 'Ghế Bập Bênh Thư Giãn' },
    'ghe_lv11': { type: 'chair', path: 'assets/images_webp/items_khutrai/ghe_lv11.webp', name: 'Giường Xếp Glamping Đệm Dày' },
    'ghe_lv12': { type: 'chair', path: 'assets/images_webp/items_khutrai/ghe_lv12.webp', name: 'Ghế Ngai Vàng Cắm Trại Đỉnh Cao' },

    // --- ĐÈN BÃO TREO CỘT ĐÈN TỪ LEVEL 6 (LAMP) ---
    'congcu_lv6':  { type: 'lamp', path: 'assets/images_webp/items_khutrai/congcu_lv6.webp',  name: 'Đèn Bão Dã Ngoại Vintage' },
    'congcu_lv7':  { type: 'lamp', path: 'assets/images_webp/items_khutrai/congcu_lv7.webp',  name: 'Đèn Cắm Trại Chân Cao Tripod' },
    'congcu_lv8':  { type: 'lamp', path: 'assets/images_webp/items_khutrai/congcu_lv8.webp',  name: 'Đèn Bão Cổ Điển Retro' },
    'congcu_lv9':  { type: 'lamp', path: 'assets/images_webp/items_khutrai/congcu_lv9.webp',  name: 'Cột Đèn Glamping Đôi' },
    'congcu_lv10': { type: 'lamp', path: 'assets/images_webp/items_khutrai/congcu_lv10.webp', name: 'Đèn Thao Tác Chuyên Dụng' },
    'congcu_lv11': { type: 'lamp', path: 'assets/images_webp/items_khutrai/congcu_lv11.webp', name: 'Hệ Thống Chiếu Sáng Trại Glamping' },
    'congcu_lv12': { type: 'lamp', path: 'assets/images_webp/items_khutrai/congcu_lv12.webp', name: 'Đèn Cực Quang Glamping Thượng Hạng' }
};

// 2. CẤU HÌNH SÂN KHẤU, ẢNH NỀN, THAO TÁC KÉO/ZOOM & VỊ TRÍ ITEM
var MYCAMP_CONFIG = {
    // -------------------------------------------------------------------------
    // I. CẤU HÌNH ẢNH NỀN, MÀU GRADIENT & HIỆU ỨNG ÁNH SÁNG
    // -------------------------------------------------------------------------
    background: {
        src: 'assets/images_webp/background/bg_nuimatthan.webp', // File ảnh nền mặc định (nếu địa điểm chưa có ảnh _bg)
        width: 460,             // Chiều rộng ảnh nền cố định (mặc định 400px - bạn có thể sửa tại đây)
        height: 569,            // Chiều cao ảnh nền (tỷ lệ 800x989 tương ứng 569px)
        color: '#263622',       // Màu nền màn hình dự phòng
        fullScreenBg: 'assets/images_webp/ui/bg_game_all.jpg', // Lớp 1 (đáy): Ảnh bầu trời kéo 100% full màn hình

        // ==========================================
        // 1. TÙY CHỈNH GRADIENT MÀU NỀN MÀN HÌNH (LỚP THỨ 3)
        // 👉 Đè nhẹ 20% chân hòn đảo để hiển thị rõ bãi trại và tạo độ tương phản cho nút đáy:
        // ==========================================
        gradient: {
            enabled: true,              // true: Bật dải màu gradient overlay đè 20% chân đảo
            angle: 180,                 // Góc dải màu (độ): 180 = từ trên xuống dưới
            color1: '#263622'           // Màu trầm đáy màn hình
        },

        // ==========================================
        // 2. TÙY CHỈNH HIỆU ỨNG ÁNH SÁNG NHẸ (LIGHTING EFFECT)
        // 💡 Tạo vệt nắng tự nhiên rọi xuống bãi trại giúp khung cảnh có chiều sâu
        // ==========================================
        lighting: {
            enabled: false,             // true: Bật hiệu ứng ánh sáng nhẹ | false: Tắt (Đã tắt vệt nắng nhẹ overlay)
            color: 'rgba(255, 255, 215, 0.26)', // Màu và độ sáng (màu vàng nắng nhẹ, độ mờ 26%)
            positionX: '50%',           // Vị trí ngang của tâm sáng (0% = trái, 50% = giữa, 100% = phải)
            positionY: '18%',           // Vị trí dọc của tâm sáng (18% = chiếu từ trên trời rọi xuống)
            size: '72%',                // Bán kính vùng phủ ánh sáng (VD: 60%, 70%, 80%)
            pulse: false,               // true: Ánh sáng thở nhẹ bồng bềnh tự nhiên | false: Tĩnh
            sunbeams: false,            // true: Bật tia nắng chiều chiếu xiên bay qua lại | false: Tắt (Đã tắt dải nắng bay)
            fireflies: true             // true: Bật đom đóm / hạt ánh sáng bay lơ lửng quanh đèn | false: Tắt
        }
    },

    // LIÊN KẾT ĐỊA ĐIỂM NGƯỜI DÙNG MUA VỚI ẢNH NỀN KHU TRẠI (TẤT CẢ ĐÃ NÉN WEBP CHUẨN ~40%)
    // Khi người chơi mua và trang bị Điểm Đến trong Cửa Hàng, bãi trại sẽ tự động đổi sang ảnh nền tương ứng.
    // Nếu địa điểm chưa có ảnh riêng thì hệ thống tự động sử dụng ảnh nền mặc định bg_nuimatthan.webp.
    locationBackgrounds: {
        'loc_dongdo': 'assets/images_webp/background/bg_hodongdo.webp',             // Cao nguyên Lâm Viên (Mặc định)
        'loc_matthan': 'assets/images_webp/background/bg_nuimatthan.webp',          // Núi Mắt Thần (WebP nén ~40.6%)
        'loc_bangioc': 'assets/images_webp/background/bg_thacbandoc.webp',          // Thác Bản Giốc (WebP nén ~42.4%)
        'loc_muine': 'assets/images_webp/background/bg_doichatmuine.webp',          // Đồi Cát Mũi Né (WebP nén ~47.2%)
        'loc_songnuocbinhba': 'assets/images_webp/background/bg_songnuocbinhba.webp' // Sóng nước Bình Ba (WebP nén ~44.9%)
    },

    // =========================================================================
    // CẤU HÌNH HIỂN THỊ ẢNH NỀN NGOÀI MÀN CHƠI CHÍNH (TOP SCENE)
    // 💡 Căn giữa theo chiều ngang, padding top = 0 để không bị tràn mép trên,
    //    chiều ngang tối thiểu 375px để hình ảnh rõ nét và không bị bé
    // =========================================================================
    mainPlayScene: {
        position: 'center -40px',          // Căn ngang ở giữa, dọc sát mép trên (0px)
        size: 'max(375px, 75%) auto'     // Chiều ngang tối thiểu 375px
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
    // IV. CẤU HÌNH KÍCH THƯỚC & VỊ TRÍ TỪNG NPC TRÊN BÀN CHƠI VÀ TRONG TRẠI CỦA TÔI
    // -------------------------------------------------------------------------
    // 1. TRÊN BÀN CHƠI CHÍNH (boardNpcDisplay):
    //    Bạn có thể tự do chỉnh chiều cao (height), chiều rộng (width: 'auto' hoặc số px),
    //    độ lệch dọc (bottom), độ lệch ngang (offsetX), và kích thước/vị trí hòn đảo (islandWidth, islandBottom, islandOffsetX)
    //    của từng chú chó / chú mèo khi đứng cạnh khay nhiệm vụ trên bàn chơi:
    boardNpcDisplay: {
        showIsland: false,      // Ẩn hòn đảo cỏ cũ vì NPC nay đứng bán thân (half-body) ngay phía sau mép trên khay đơn hàng chuẩn Merge
        defaultIsland: {
            width: 56,
            bottom: -16,
            offsetX: 2
        },

        // Kích thước & vị trí từng NPC đứng sau khay đơn hàng (chỉnh trực tiếp tại đây):
        // - height: Độ to/cao tổng thể của nhân vật (px)
        // - bottom: Độ cao nhô lên trên khay (tăng lên như -18, -10, 0 để đẩy NPC cao lên; giảm xuống -35, -42 để hạ thấp xuống)
        // - offsetX: Dịch sang phải (+) hoặc sang trái (-) tính bằng px
        'character01': {        // 1. Chó Golden
            name: 'Golden',
            bustHeight: 74,
            height: 114,
            width: 'auto',
            bottom: -40,
            offsetX: 2,
            initialRestSec: 0,
            loopRestSec: 8
        },
        'character04': {        // 2. Chó Poodle
            name: 'Poodle',
            bustHeight: 70,
            height: 108,
            width: 'auto',
            bottom: -36,
            offsetX: 2,
            initialRestSec: 1,
            loopRestSec: 8
        },
        'character03': {        // 3. Chó Bulldog
            name: 'Bulldog',
            bustHeight: 68,
            height: 104,
            width: 'auto',
            bottom: -34,
            offsetX: 2,
            initialRestSec: 2,
            loopRestSec: 8
        },
        'character10': {        // 4. Mèo Ba Tư (chân ngắn nên nâng bottom lên -18 để lộ rõ tay & thân trên)
            name: 'Mèo Ba Tư',
            bustHeight: 70,
            height: 102,
            width: 'auto',
            bottom: -18,
            offsetX: 2,
            initialRestSec: 3,
            loopRestSec: 8
        },
        'character07': {        // 5. Mèo Anh
            name: 'Mèo Anh',
            bustHeight: 68,
            height: 98,
            width: 'auto',
            bottom: -20,
            offsetX: 2,
            initialRestSec: 4,
            loopRestSec: 8
        },
        'character06': {        // 6. Mèo Xiêm
            name: 'Mèo Xiêm',
            bustHeight: 72,
            height: 110,
            width: 'auto',
            bottom: -36,
            offsetX: 2,
            initialRestSec: 5,
            loopRestSec: 8
        }
    },

    // 2. VỊ TRÍ RƯƠNG SAO NHẬN QUÀ TRÊN MÀN CHƠI CHÍNH (starChestPosition):
    //    Đẩy cao lên gần nút Setting để không bị vướng các NPC đứng ở hàng nhiệm vụ bên dưới
    starChestPosition: {
        top: 64,                // Khoảng cách từ mép trên màn hình xuống (px) -> nằm ngay dưới nút Setting
        right: 12               // Khoảng cách từ mép phải màn hình vào (px)
    },

    // 3. TRONG MÀN HÌNH "TRẠI CỦA TÔI" (pets):
    //    Khu trại tự động hiển thị thú cưng theo con vật người chơi đang chọn (SAVE.activePet).
    //    Bạn có thể chủ động sửa tọa độ (left, top), kích thước khung (width, height) và độ rộng nhân vật (state1Width, state2Width, state3Width) cho từng chú chó / chú mèo dưới đây:
    pets: {
        // 1. CHÚ CHÓ GOLDEN (character01) - Mặc định sở hữu
        'character01': {
            id: 'character01',
            name: 'Chú chó Golden',
            left: 108,
            top: 320,
            width: 76,
            height: 90,
            zIndex: 18,
            fps: 8,

            state1Name: 'anim1',
            state1Duration: 12,
            state1Width: 56,
            state1Sheet: {
                image: 'assets/images_webp/npc_sheets/golden_anim1.webp',
                frameWidth: 145,
                frameHeight: 229,
                cols: 5,
                rows: 4,
                totalFrames: 20
            },

            state2Name: 'anim2',
            state2Duration: 3.5,
            state2Width: 72,
            state2Sheet: {
                image: 'assets/images_webp/npc_sheets/golden_anim2.webp',
                frameWidth: 200,
                frameHeight: 205,
                cols: 5,
                rows: 4,
                totalFrames: 20
            },

            state3Name: 'anim3',
            state3Duration: 3.875,
            state3Width: 74,
            state3Chance: 0.35,
            state3Sheet: {
                image: 'assets/images_webp/npc_sheets/golden_anim3.webp',
                frameWidth: 198,
                frameHeight: 230,
                cols: 6,
                rows: 6,
                totalFrames: 31
            }
        },

        // 2. CHÚ CHÓ POODLE (character04)
        'character04': {
            id: 'character04',
            name: 'Chú chó Poodle',
            left: 108,
            top: 320,
            width: 76,
            height: 90,
            zIndex: 18,
            fps: 8,

            state1Name: 'anim1',
            state1Duration: 10,
            state1Width: 60,
            state1Sheet: {
                image: 'assets/images_webp/npc_sheets/poodle_anim1.webp',
                frameWidth: 140,
                frameHeight: 200,
                cols: 5,
                rows: 5,
                totalFrames: 24
            },

            state2Name: 'anim2',
            state2Duration: 3.125,
            state2Width: 60,
            state2Sheet: {
                image: 'assets/images_webp/npc_sheets/poodle_anim2.webp',
                frameWidth: 140,
                frameHeight: 200,
                cols: 5,
                rows: 5,
                totalFrames: 25
            },

            state3Name: 'anim3',
            state3Duration: 3.0,
            state3Width: 60,
            state3Chance: 0.35,
            state3Sheet: {
                image: 'assets/images_webp/npc_sheets/poodle_anim3.webp',
                frameWidth: 140,
                frameHeight: 200,
                cols: 5,
                rows: 5,
                totalFrames: 24
            }
        },

        // 3. CHÚ CHÓ BULLDOG (character03)
        'character03': {
            id: 'character03',
            name: 'Chú chó Bulldog',
            left: 108,
            top: 320,
            width: 76,
            height: 90,
            zIndex: 18,
            fps: 8,

            state1Name: 'anim1',
            state1Duration: 10,
            state1Width: 68,
            state1Sheet: {
                image: 'assets/images_webp/npc_sheets/bulldog_anim1.webp',
                frameWidth: 174,
                frameHeight: 205,
                cols: 5,
                rows: 5,
                totalFrames: 24
            },

            state2Name: 'anim2',
            state2Duration: 3.125,
            state2Width: 68,
            state2Sheet: {
                image: 'assets/images_webp/npc_sheets/bulldog_anim2.webp',
                frameWidth: 174,
                frameHeight: 205,
                cols: 5,
                rows: 5,
                totalFrames: 25
            },

            state3Name: 'anim3',
            state3Duration: 3.0,
            state3Width: 68,
            state3Chance: 0.35,
            state3Sheet: {
                image: 'assets/images_webp/npc_sheets/bulldog_anim3.webp',
                frameWidth: 174,
                frameHeight: 205,
                cols: 5,
                rows: 5,
                totalFrames: 24
            }
        },

        // 4. CHÚ MÈO BA TƯ (character10)
        'character10': {
            id: 'character10',
            name: 'Chú mèo Ba Tư',
            left: 108,
            top: 320,
            width: 76,
            height: 90,
            zIndex: 18,
            fps: 8,

            state1Name: 'anim1',
            state1Duration: 10,
            state1Width: 68,
            state1Sheet: {
                image: 'assets/images_webp/npc_sheets/batu_anim1.webp',
                frameWidth: 200,
                frameHeight: 209,
                cols: 5,
                rows: 5,
                totalFrames: 24
            },

            state2Name: 'anim2',
            state2Duration: 3.125,
            state2Width: 68,
            state2Sheet: {
                image: 'assets/images_webp/npc_sheets/batu_anim2.webp',
                frameWidth: 200,
                frameHeight: 209,
                cols: 5,
                rows: 5,
                totalFrames: 25
            },

            state3Name: 'anim3',
            state3Duration: 3.0,
            state3Width: 68,
            state3Chance: 0.35,
            state3Sheet: {
                image: 'assets/images_webp/npc_sheets/batu_anim3.webp',
                frameWidth: 200,
                frameHeight: 209,
                cols: 5,
                rows: 5,
                totalFrames: 24
            }
        },

        // 5. CHÚ MÈO ANH (character07)
        'character07': {
            id: 'character07',
            name: 'Chú mèo Anh',
            left: 108,
            top: 320,
            width: 76,
            height: 90,
            zIndex: 18,
            fps: 8,

            state1Name: 'anim1',
            state1Duration: 10,
            state1Width: 66,
            state1Sheet: {
                image: 'assets/images_webp/npc_sheets/meoanh_anim1.webp',
                frameWidth: 165,
                frameHeight: 189,
                cols: 5,
                rows: 5,
                totalFrames: 24
            },

            state2Name: 'anim2',
            state2Duration: 3.125,
            state2Width: 66,
            state2Sheet: {
                image: 'assets/images_webp/npc_sheets/meoanh_anim2.webp',
                frameWidth: 165,
                frameHeight: 189,
                cols: 5,
                rows: 5,
                totalFrames: 25
            },

            state3Name: 'anim3',
            state3Duration: 3.0,
            state3Width: 66,
            state3Chance: 0.35,
            state3Sheet: {
                image: 'assets/images_webp/npc_sheets/meoanh_anim3.webp',
                frameWidth: 165,
                frameHeight: 189,
                cols: 5,
                rows: 5,
                totalFrames: 24
            }
        },

        // 5. CHÚ MÈO XIÊM (character06)
        'character06': {
            id: 'character06',
            name: 'Chú mèo Xiêm',
            left: 108,
            top: 320,
            width: 76,
            height: 90,
            zIndex: 18,
            fps: 8,

            state1Name: 'anim1',
            state1Duration: 10,
            state1Width: 58,
            state1Sheet: {
                image: 'assets/images_webp/npc_sheets/meoxiem_anim1.webp',
                frameWidth: 143,
                frameHeight: 220,
                cols: 5,
                rows: 5,
                totalFrames: 24
            },

            state2Name: 'anim2',
            state2Duration: 3.125,
            state2Width: 58,
            state2Sheet: {
                image: 'assets/images_webp/npc_sheets/meoxiem_anim2.webp',
                frameWidth: 143,
                frameHeight: 220,
                cols: 5,
                rows: 5,
                totalFrames: 25
            },

            state3Name: 'anim3',
            state3Duration: 3.0,
            state3Width: 58,
            state3Chance: 0.35,
            state3Sheet: {
                image: 'assets/images_webp/npc_sheets/meoxiem_anim3.webp',
                frameWidth: 143,
                frameHeight: 220,
                cols: 5,
                rows: 5,
                totalFrames: 24
            }
        }
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
            { seconds: 1, gold: 400 },   // 1s -> 400 Vàng
            { seconds: 2, gold: 700 },   // 2s -> 700 Vàng
            { seconds: 3, gold: 1200 }   // 3s -> 1.200 Vàng (tối đa)
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
        // 0. CÁC ĐÁM MÂY BAY KHUNG CẢNH (CLOUDS)
        // 💡 MẸO ẨN / HIỆN: visible: true (HIỆN) / false (ẨN)
        //    Có thể tùy chỉnh tọa độ (left, top), độ rộng (width), độ mờ (opacity)
        // ==========================================
        {
            id: 'cloud-top',
            name: 'Đám mây bay trên (đỉnh núi Mắt Thần)',
            type: 'cloud',
            visible: true,           // Đổi thành false để ẨN, true để HIỆN
            src: 'assets/images_webp/background/may2.webp',
            left: 75,
            top: 25,
            width: 310,
            height: 'auto',
            zIndex: 4,
            opacity: 0.92
        },
        {
            id: 'cloud-bottom',
            name: 'Đám mây bay dưới (sườn núi)',
            type: 'cloud',
            visible: true,           // Đổi thành false để ẨN, true để HIỆN
            src: 'assets/images_webp/background/may1.webp',
            left: 65,
            top: 145,
            width: 280,
            height: 'auto',
            zIndex: 5,
            opacity: 0.88
        },

        // ==========================================
        // 1. VẬT TRANG TRÍ MẶC ĐỊNH (CỐ ĐỊNH)
        // 💡 MẸO ẨN / HIỆN: Bạn có thể bật hoặc tắt bất kỳ món nào dưới đây:
        //    visible: true   -> HIỂN THỊ TRÊN BÃI TRẠI
        //    visible: false  -> ẨN KHỎI BÃI TRẠI
        // ==========================================
        {
            id: 'tree-1',
            name: 'Cây thông bên trái (mỏm đá trái)',
            type: 'decor',
            visible: false,           // Đổi thành false để ẨN, true để HIỆN - BẠN CHỦ ĐỘNG SỬA TẠI ĐÂY
            src: 'assets/images_webp/items_khutrai/tree.webp',
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
            visible: false,           // Đổi thành false để ẨN, true để HIỆN - BẠN CHỦ ĐỘNG SỬA TẠI ĐÂY
            src: 'assets/images_webp/items_khutrai/tree.webp',
            left: 200,
            top: 205,
            width: 36,
            height: 'auto',
            zIndex: 9
        },
        {
            id: 'lamp',
            name: 'Cột đèn dã ngoại (bên bờ suối - tự động ẩn nếu chưa có đèn Lv.6+)',
            type: 'decor',
            visible: true,           // Đổi thành false để ẨN, true để HIỆN - BẠN CHỦ ĐỘNG SỬA TẠI ĐÂY
            src: 'assets/images_webp/items_khutrai/icon_den.webp',
            left: 230,               // Tọa độ ngang cột đèn (px) - BẠN CHỦ ĐỘNG SỬA TẠI ĐÂY
            top: 245,                // Tọa độ dọc cột đèn (px)   - BẠN CHỦ ĐỘNG SỬA TẠI ĐÂY
            width: 24,               // Chiều rộng cột đèn (px)   - BẠN CHỦ ĐỘNG SỬA TẠI ĐÂY
            height: 'auto',
            zIndex: 14
        },
        {
            id: 'slot-lamp',
            name: 'Đèn bão treo dưới cột đèn (Tự động gắn theo đèn từ Level 6 người chơi đang có)',
            type: 'slot',
            slotKey: 'lamp',
            left: 223,               // Tọa độ ngang đèn treo (px) - BẠN CHỦ ĐỘNG SỬA TẠI ĐÂY
            top: 254,                // Tọa độ dọc đèn treo (px)   - BẠN CHỦ ĐỘNG SỬA TẠI ĐÂY
            width: 26,               // Chiều rộng đèn treo (px)   - BẠN CHỦ ĐỘNG SỬA TẠI ĐÂY
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
            left: 108,
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
            left: 236,
            top: 364,
            width: 75,
            height: 75,
            zIndex: 16,
            fit: 'contain'
        },
        {
            id: 'slot-stove',
            name: 'Bếp nướng dã ngoại (Phía trước ghế 1)',
            type: 'slot',
            slotKey: 'stove',
            left: 202,
            top: 410,
            width: 40,
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
            src: 'assets/images_webp/items_khutrai/ten_anh.webp',
            left: 120,
            top: 200,
            width: 80,
            height: 'auto',
            zIndex: 10
        }
        */
    ]
};
