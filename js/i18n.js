// =============================================================================
// TỆP BIÊN TẬP TOÀN BỘ NGÔN NGỮ (VIỆT - ANH) CHO GAME MERGE CAMPING
// Bạn có thể dễ dàng xem, sửa đổi mọi câu chữ, nhãn nút, tên 72 món đồ,
// lời thoại của chú chó và các thông báo trong game ngay tại tệp này.
// =============================================================================

var I18N_DATA = {
    // -------------------------------------------------------------------------
    // MỤC 1: THANH ĐIỀU HƯỚNG & GIAO DIỆN CHÍNH (HUD & FOOTER)
    // -------------------------------------------------------------------------
    hud: {
        map_title: { vi: 'Mở Bản Đồ Hành Trình', en: 'Open Adventure Map' },
        map_badge: { vi: 'Bản đồ', en: 'Map' },
        energy_title: { vi: 'Bấm để mở Trạm Tiếp Năng Lượng', en: 'Tap to open Energy Station' },
        gold_title: { vi: 'Bấm để mở Tiệm Vàng', en: 'Tap to open Gold Shop' },
        gem_title: { vi: 'Bấm để mở Cửa Hàng Kim Cương', en: 'Tap to open Diamond Shop' },
        settings_title: { vi: 'Cài đặt trò chơi & Lưu trữ', en: 'Game Settings & Sync' },
        npc_avatar_title: { vi: 'Chạm vào nhân vật để trò chuyện & xem gợi ý', en: 'Tap character to chat & see hints' },
        broom_title: { vi: 'Dọn dẹp bàn cờ: Bán vật phẩm thừa & gom nhóm gọn gàng (-3 Năng lượng)', en: 'Clean Board: Sell extras & tidy up (-3 Energy)' },
        btn_camp: { vi: 'KHU TRẠI', en: 'CAMP' },
        btn_camp_title: { vi: 'Khu Cắm Trại', en: 'Campground' },
        btn_book: { vi: 'CẨM NANG', en: 'HANDBOOK' },
        btn_book_title: { vi: 'Cẩm Nang Trò Chơi', en: 'Camping Handbook' },
        btn_sell: { vi: 'BÁN', en: 'SELL' },
        btn_sell_title: { vi: 'Bán Vật Phẩm Lấy Vàng', en: 'Sell Item for Gold' },
        deliver_tag: { vi: 'NỘP', en: 'DELIVER' }
    },

    // -------------------------------------------------------------------------
    // MỤC 2: TÊN 9 DÒNG SẢN PHẨM & 72 VẬT PHẨM (HANDBOOK & BOARD ITEMS)
    // -------------------------------------------------------------------------
    lines: {
        an: { vi: 'Ẩm Thực Dã Ngoại', en: 'Camp Cuisine' },
        ban: { vi: 'Bàn Dã Ngoại', en: 'Camp Tables' },
        cafe: { vi: 'Cà Phê Sương Sớm', en: 'Morning Coffee' },
        trai: { vi: 'Lều Trại Trú Ngụ', en: 'Shelter & Tents' },
        tham: { vi: 'Chỗ Ngủ Êm Ái', en: 'Cozy Sleep' },
        ghe: { vi: 'Ghế Nghỉ Ngơi', en: 'Camp Chairs' },
        bep: { vi: 'Lửa & Bếp Trại', en: 'Campfire & Cooking' },
        congcu: { vi: 'Dụng Cụ Sinh Tồn', en: 'Survival Tools' },
        antoan: { vi: 'Y Tế & An Toàn', en: 'First Aid & Safety' }
    },

    items: {
        // Dòng 1: Ẩm thực (an)
        an_lv1: { vi: 'Quả Táo Đỏ', en: 'Red Apple' },
        an_lv2: { vi: 'Ổ Bánh Mì Dài', en: 'Baguette Bread' },
        an_lv3: { vi: 'Bánh Sandwich Kẹp', en: 'Sandwich' },
        an_lv4: { vi: 'Tô Mì Sợi Nóng', en: 'Hot Noodle Bowl' },
        an_lv5: { vi: 'Đĩa Trái Cây Tươi', en: 'Fresh Fruit Plate' },
        an_lv6: { vi: 'Tô Hoa Quả Thập Cẩm', en: 'Mixed Fruit Bowl' },
        an_lv7: { vi: 'Đĩa Bánh Quy Nướng', en: 'Baked Cookies' },
        an_lv8: { vi: 'Đại Tiệc BBQ Xiên Nướng', en: 'BBQ Skewer Feast' },

        // Dòng 2: Bàn (ban)
        ban_lv1: { vi: 'Bàn Nhôm Vuông Mini', en: 'Mini Aluminum Table' },
        ban_lv2: { vi: 'Bàn Vải Gấp Dã Ngoại', en: 'Folding Fabric Table' },
        ban_lv3: { vi: 'Bàn Trà Dã Ngoại', en: 'Camp Tea Table' },
        ban_lv4: { vi: 'Bàn Gỗ Cuộn Dã Ngoại', en: 'Roll-Top Wooden Table' },
        ban_lv5: { vi: 'Bàn Dã Ngoại Kèm Giá Lưới', en: 'Table with Mesh Shelf' },
        ban_lv6: { vi: 'Bàn Cắm Trại Đa Năng', en: 'Multi-purpose Table' },
        ban_lv7: { vi: 'Bàn Chiến Thuật IGT', en: 'Tactical IGT Table' },
        ban_lv8: { vi: 'Trạm Bếp Nấu Ăn Glamping', en: 'Glamping Kitchen Station' },

        // Dòng 3: Cà phê (cafe)
        cafe_lv1: { vi: 'Hạt Cà Phê Robusta', en: 'Robusta Coffee Beans' },
        cafe_lv2: { vi: 'Cối Xay Cà Phê Tay Gỗ', en: 'Wooden Hand Grinder' },
        cafe_lv3: { vi: 'Ấm Rót Cổ Ngỗng', en: 'Gooseneck Kettle' },
        cafe_lv4: { vi: 'Tách Cà Phê Nóng', en: 'Hot Coffee Cup' },
        cafe_lv5: { vi: 'Gói Cà Phê Specialty', en: 'Specialty Coffee Pack' },
        cafe_lv6: { vi: 'Cối Xay Cầm Tay Inox', en: 'Stainless Steel Grinder' },
        cafe_lv7: { vi: 'Ấm Pha Moka Pot Ý', en: 'Italian Moka Pot' },
        cafe_lv8: { vi: 'Cốc Cà Phê Men Đỏ', en: 'Red Enamel Mug' },

        // Dòng 4: Lều trại (trai)
        trai_lv1: { vi: 'Cọc Ghim Lều Kim Loại', en: 'Metal Tent Peg' },
        trai_lv2: { vi: 'Cuộn Dây Dù Căng Lều', en: 'Guyline Rope Roll' },
        trai_lv3: { vi: 'Bộ Khung Cọc Chống Lều', en: 'Tent Pole Set' },
        trai_lv4: { vi: 'Bạt Tăng Che Mưa Nắng', en: 'Camping Tarp' },
        trai_lv5: { vi: 'Lều Vòm Cắm Trại 2 Người', en: '2-Person Dome Tent' },
        trai_lv6: { vi: 'Lều Gia Đình Chống Gió', en: 'Windproof Family Tent' },
        trai_lv7: { vi: 'Lều Kim Tự Tháp Glamping', en: 'Glamping Teepee Tent' },
        trai_lv8: { vi: 'Biệt Thự Lều Glamping', en: 'Luxury Glamping Villa' },

        // Dòng 5: Chỗ ngủ (tham)
        tham_lv1: { vi: 'Bạt Trải Đất Dã Ngoại', en: 'Ground Tarp' },
        tham_lv2: { vi: 'Thảm Xốp Cuộn Cách Nhiệt', en: 'Foam Sleeping Mat' },
        tham_lv3: { vi: 'Thảm Thổ Cẩm Dã Ngoại', en: 'Bohemian Picnic Rug' },
        tham_lv4: { vi: 'Chăn Đệm Gấp Ấm Áp', en: 'Warm Folding Quilt' },
        tham_lv5: { vi: 'Túi Ngủ Dã Ngoại', en: 'Camping Sleeping Bag' },
        tham_lv6: { vi: 'Võng Dù Giữa Rừng', en: 'Jungle Hammock' },
        tham_lv7: { vi: 'Sofa Hơi Dã Ngoại', en: 'Inflatable Air Sofa' },
        tham_lv8: { vi: 'Đệm Hơi Đôi Cao Cấp', en: 'Premium Double Air Bed' },

        // Dòng 6: Ghế (ghe)
        ghe_lv1: { vi: 'Ghế Đôn Xếp Mini', en: 'Mini Folding Stool' },
        ghe_lv2: { vi: 'Ghế Xếp Tựa Lưng Xanh', en: 'Green Backrest Chair' },
        ghe_lv3: { vi: 'Ghế Xếp Dã Ngoại Màu Cát', en: 'Khaki Camp Chair' },
        ghe_lv4: { vi: 'Ghế Xếp Có Tay Vịn', en: 'Armchair Folding Seat' },
        ghe_lv5: { vi: 'Ghế Câu Cá Có Khay', en: 'Fishing Chair with Tray' },
        ghe_lv6: { vi: 'Ghế Mặt Trăng Moon Chair', en: 'Moon Chair' },
        ghe_lv7: { vi: 'Ghế Tựa Lưng Cao Có Gối', en: 'High-back Pillow Chair' },
        ghe_lv8: { vi: 'Ghế Đạo Diễn Cao Cấp', en: 'Director Camping Chair' },

        // Dòng 7: Bếp & Lửa (bep)
        bep_lv1: { vi: 'Nhánh Củi Khô', en: 'Dry Twigs' },
        bep_lv2: { vi: 'Khúc Gỗ Tròn', en: 'Wooden Log' },
        bep_lv3: { vi: 'Bó Củi Buộc Dây', en: 'Firewood Bundle' },
        bep_lv4: { vi: 'Hố Đá Xếp Lửa', en: 'Stone Fire Pit' },
        bep_lv5: { vi: 'Đống Củi Trại Vòng Đá', en: 'Ring Campfire' },
        bep_lv6: { vi: 'Lửa Trại Rực Hồng', en: 'Blazing Bonfire' },
        bep_lv7: { vi: 'Lò Nướng Than Hoa Tròn', en: 'Round Charcoal Grill' },
        bep_lv8: { vi: 'Bếp Nướng BBQ Chữ Nhật', en: 'BBQ Grill Station' },

        // Dòng 8: Dụng cụ (congcu)
        congcu_lv1: { vi: 'Túi Vệ Sinh Cá Nhân', en: 'Toiletry Pouch' },
        congcu_lv2: { vi: 'Can Nước Dã Ngoại', en: 'Camp Water Jug' },
        congcu_lv3: { vi: 'Bộ Bát Đĩa Dã Ngoại', en: 'Camping Tableware Set' },
        congcu_lv4: { vi: 'Đầu Khò Lửa Cầm Tay', en: 'Handheld Torch Burner' },
        congcu_lv5: { vi: 'Bếp Gas Dã Ngoại Mini', en: 'Mini Camp Gas Stove' },
        congcu_lv6: { vi: 'Dây Đèn Led Lung Linh', en: 'Fairy String Lights' },
        congcu_lv7: { vi: 'Đèn Cắm Trại 3 Chân', en: 'Tripod Camp Lamp' },
        congcu_lv8: { vi: 'Đèn Bão Cổ Điển', en: 'Vintage Hurricane Lantern' },

        // Dòng 9: An toàn (antoan)
        antoan_lv1: { vi: 'Chai Xịt Côn Trùng', en: 'Bug Spray' },
        antoan_lv2: { vi: 'Tuýp Kem Chống Nắng', en: 'Sunscreen Tube' },
        antoan_lv3: { vi: 'Hộp Sơ Cứu Khẩn Cấp', en: 'First Aid Kit' },
        antoan_lv4: { vi: 'Xẻng Sinh Tồn Dã Ngoại', en: 'Survival Shovel' },
        antoan_lv5: { vi: 'Pin Sạc Dự Phòng', en: 'Power Bank' },
        antoan_lv6: { vi: 'Lều Trú Ẩn Khẩn Cấp', en: 'Emergency Shelter' },
        antoan_lv7: { vi: 'Bộ Đàm Loa Rừng Già', en: 'Walkie-Talkie' },
        antoan_lv8: { vi: 'Trạm Điện Di Động Dã Ngoại', en: 'Portable Power Station' }
    },

    // -------------------------------------------------------------------------
    // MỤC 3: THÙNG CHỨA NGUỒN PHÁT (GENERATORS)
    // -------------------------------------------------------------------------
    generators: {
        generator_cooler: { vi: 'Xe Kéo Dã Ngoại', en: 'Camping Wagon' },
        generator_backpack: { vi: 'Ba Lô Dã Ngoại', en: 'Camping Backpack' },
        generator_crate: { vi: 'Thùng Dụng Cụ', en: 'Tool Crate' }
    },

    // -------------------------------------------------------------------------
    // MỤC 4: BẢN ĐỒ HÀNH TRÌNH (WORLD MAP MODAL)
    // -------------------------------------------------------------------------
    map: {
        title: { vi: 'BẢN ĐỒ HÀNH TRÌNH', en: 'ADVENTURE MAP' },
        sub: { vi: 'Đã vượt qua: <b>{count}/{total}</b> màn chơi', en: 'Cleared: <b>{count}/{total}</b> stages' },
        btn_close: { vi: 'Đóng', en: 'Close' },
        level_label: { vi: 'Màn {0}', en: 'Level {0}' },
        current: { vi: 'Màn Hiện Tại', en: 'Current Stage' },
        locked: { vi: 'Chưa Mở Khóa', en: 'Locked' }
    },

    // -------------------------------------------------------------------------
    // MỤC 5: CẨM NANG DÃ NGOẠI (HANDBOOK MODAL)
    // -------------------------------------------------------------------------
    handbook: {
        title: { vi: 'CẨM NANG DÃ NGOẠI', en: 'CAMPING HANDBOOK' },
        sub: { vi: 'Đã khám phá: <b>{count}/{total}</b> vật phẩm cắm trại', en: 'Discovered: <b>{count}/{total}</b> camping items' },
        btn_close: { vi: 'Đóng', en: 'Close' },
        unlock_hint: { vi: 'Hãy ghép từ {gen} để mở khóa Lv.{lv}!', en: 'Merge from {gen} to unlock Lv.{lv}!' }
    },

    // -------------------------------------------------------------------------
    // MỤC 6: KHU CẮM TRẠI, THÚ CƯNG & ĐIỂM ĐẾN (CAMP MODAL)
    // -------------------------------------------------------------------------
    camp: {
        title: { vi: 'KHU CẮM TRẠI', en: 'CAMPGROUND' },
        tab_decor: { vi: 'Đồ Cắm Trại', en: 'Camp Items' },
        tab_pets: { vi: 'Thú Cưng', en: 'Pets' },
        tab_destinations: { vi: 'Điểm Đến', en: 'Locations' },
        btn_close: { vi: 'Đóng', en: 'Close' },

        // Kho vật phẩm
        items_sub: { vi: 'Đã thu thập: <b>{count}</b> vật phẩm từ nhiệm vụ', en: 'Collected: <b>{count}</b> items from quests' },
        empty_title: { vi: 'Khu Trại Chưa Có Vật Phẩm', en: 'Campground Is Empty' },
        empty_desc: { vi: 'Khi bạn vượt qua các màn chơi và hoàn thành đơn hàng nhiệm vụ, các món đồ đó sẽ được chuyển vào đây để lưu trữ hoặc bán lấy Vàng!', en: 'Complete stage orders to store your crafted items here, or sell them for extra Gold!' },
        sell_prompt: { vi: 'Chạm chọn 1 vật phẩm ở trên để xem chi tiết hoặc bán lấy Vàng', en: 'Tap an item above to view details or sell for Gold' },
        btn_sell_item: { vi: 'BÁN VẬT PHẨM (+{coins} Vàng)', en: 'SELL ITEM (+{coins} Gold)' },

        // Thú cưng
        pets_sub: { vi: 'Đã đồng hành: <b>{count}</b> thú cưng', en: 'Companion: <b>{count}</b> pets owned' },
        pet_active: { vi: 'Đang đồng hành', en: 'Active Companion' },
        pet_select: { vi: 'Chọn bạn này', en: 'Set Active' },
        pet_price: { vi: 'Giá: {coins} Vàng', en: 'Price: {coins} Gold' },
        pet_dog: { vi: 'Chú Chó Shiba', en: 'Shiba Dog' },
        pet_fox: { vi: 'Bé Cáo Nhanh Nhẹn', en: 'Swift Fox' },
        pet_goat: { vi: 'Chú Dê Núi', en: 'Mountain Goat' },

        // Điểm đến
        dest_sub: { vi: 'Đã sở hữu: <b>{count}/{total}</b> điểm đến cắm trại', en: 'Owned: <b>{count}/{total}</b> camp locations' },
        dest_active: { vi: 'Đang dùng làm cảnh nền', en: 'Current Background' },
        dest_select: { vi: 'Sử dụng', en: 'Equip' },
        dest_using: { vi: 'Đang dùng', en: 'In Use' },
        dest_owned: { vi: 'Đã sở hữu', en: 'Owned' },
        dest_buy: { vi: 'Mua', en: 'Buy' },
        dest_price: { vi: 'Giá: {coins} Vàng', en: 'Price: {coins} Gold' },
        dest_dongdo: { vi: 'Hồ Đồng Đò', en: 'Dong Do Lake' },
        dest_doibu: { vi: 'Đồi Bù', en: 'Doi Bu Hill' },
        dest_matthan: { vi: 'Núi Mắt Thần', en: 'God Eye Mountain' },
        dest_pudao: { vi: 'Bản Pú Đao', en: 'Pu Dao Village' },
        dest_taxua: { vi: 'Tà Xùa', en: 'Ta Xua Cloud Peak' },
        dest_bangioc: { vi: 'Thác Bản Giốc', en: 'Ban Gioc Waterfall' },
        dest_yty: { vi: 'Y Tý Đại Ngàn', en: 'Y Ty Highlands' },
        dest_biennhacu: { vi: 'Biển Nhà Cũ', en: 'Nha Cu Beach' },
        dest_songnuocbinhba: { vi: 'Sóng nước Bình Ba', en: 'Binh Ba Waves' }
    },

    // -------------------------------------------------------------------------
    // MỤC 7: CỬA HÀNG (ENERGY, GOLD, GEMS)
    // -------------------------------------------------------------------------
    shops: {
        // Năng lượng
        energy_title: { vi: 'TRẠM NĂNG LƯỢNG', en: 'ENERGY STATION' },
        energy_sub: { vi: 'Hồi phục miễn phí: <b>1 Năng lượng</b> mỗi 90 giây (Tối đa 100)', en: 'Free recovery: <b>1 Energy</b> every 90 seconds (Max 100)' },
        btn_ad_energy: { vi: 'Xem Quảng Cáo (+25 Năng Lượng)', en: 'Watch Ad (+25 Energy)' },
        buy_with_gold: { vi: 'Đổi bằng Vàng:', en: 'Exchange with Gold:' },
        pack_small: { vi: 'Gói Nhỏ (+15)', en: 'Small Pack (+15)' },
        pack_medium: { vi: 'Gói Vừa (+35)', en: 'Medium Pack (+35)' },
        pack_large: { vi: 'Gói Lớn (+80)', en: 'Large Pack (+80)' },

        // Vàng
        gold_title: { vi: 'TIỆM VÀNG DÃ NGOẠI', en: 'CAMP GOLD SHOP' },
        gold_sub: { vi: 'Đổi Kim Cương lấy Vàng để mua năng lượng & thú cưng', en: 'Exchange Diamonds for Gold to get energy & pets' },
        btn_ad_gold: { vi: 'Xem Quảng Cáo (+500 Vàng)', en: 'Watch Ad (+500 Gold)' },

        // Kim Cương
        gem_title: { vi: 'CỬA HÀNG KIM CƯƠNG', en: 'DIAMOND SHOP' },
        gem_sub: { vi: 'Kim Cương dùng để mua năng lượng và các gói đặc biệt', en: 'Diamonds can buy energy and exclusive packs' }
    },

    // -------------------------------------------------------------------------
    // MỤC 8: CÀI ĐẶT & ĐỒNG BỘ ĐÁM MÂY (SETTINGS MODAL)
    // -------------------------------------------------------------------------
    settings: {
        title: { vi: 'CÀI ĐẶT', en: 'SETTINGS' },
        sub: { vi: 'Cài đặt màn chơi và dữ liệu', en: 'Game Settings & Cloud Sync' },
        user_id_label: { vi: 'ID Người chơi:', en: 'Player ID:' },
        copy: { vi: 'Sao chép', en: 'Copy' },
        copied: { vi: 'Đã sao chép!', en: 'Copied!' },
        edit_id: { vi: 'Đổi ID', en: 'Edit ID' },
        save: { vi: 'Lưu', en: 'Save' },
        cancel: { vi: 'HỦY', en: 'CANCEL' },

        google_login_btn: { vi: 'Đăng nhập Google', en: 'Sign in with Google' },
        google_sync_title: { vi: 'Đồng bộ đám mây Google', en: 'Google Cloud Sync' },
        google_syncing: { vi: 'Đang đồng bộ...', en: 'Syncing...' },
        google_connected: { vi: 'Đã kết nối Google', en: 'Google Connected' },
        google_signout: { vi: 'Đăng xuất', en: 'Sign Out' },

        lang_label: { vi: 'Ngôn ngữ', en: 'Language' },
        lang_vi: { vi: 'Tiếng Việt', en: 'Tiếng Việt' },
        lang_vi_sub: { vi: 'Vietnamese', en: 'Vietnamese' },
        lang_en: { vi: 'English', en: 'English' },
        lang_en_sub: { vi: 'Tiếng Anh', en: 'English' },
        lang_current: { vi: 'Tiếng Việt', en: 'English' },
        lang_dropdown_hint: { vi: 'Bấm để mở danh sách chọn ngôn ngữ', en: 'Tap to select language' },
        lang_modal_title: { vi: 'CHỌN NGÔN NGỮ', en: 'SELECT LANGUAGE' },

        bgm_label: { vi: 'Nhạc nền cắm trại', en: 'Camping BGM' },
        sfx_label: { vi: 'Âm thanh hiệu ứng', en: 'Sound Effects' },
        on: { vi: 'BẬT', en: 'ON' },
        off: { vi: 'TẮT', en: 'OFF' },

        unlock_all: { vi: 'Mở khóa tất cả level', en: 'Unlock All Levels' },
        auto_fill: { vi: 'Tự động đổ đầy bàn', en: 'Auto-fill Board' },
        close_btn: { vi: 'Đóng', en: 'Close' },
        reset_btn: { vi: 'Xóa dữ liệu', en: 'Reset Data' },
        reset_warning: { vi: 'Bạn chắc chắn muốn xóa toàn bộ tiến trình, sao, vàng và cẩm nang về ban đầu?', en: 'Are you sure you want to reset all progress, stars, coins, and handbook?' },
        reset_confirm: { vi: 'Xác nhận xóa hết', en: 'Confirm Reset' },
        reset_cancel: { vi: 'Hủy', en: 'Cancel' },
        reset_title: { vi: 'Xóa toàn bộ dữ liệu & Chơi lại từ đầu', en: 'Reset All Data & Restart' },
        reset_confirm_prompt: { vi: 'BẠN CÓ CHẮC CHẮN MUỐN XÓA TOÀN BỘ DỮ LIỆU ĐÃ CHƠI?', en: 'ARE YOU SURE YOU WANT TO RESET ALL GAME DATA?' },
        reset_confirm_btn: { vi: 'XÁC NHẬN XÓA DỮ LIỆU', en: 'CONFIRM DATA RESET' }
    },

    // -------------------------------------------------------------------------
    // MỤC 9: MÀN HÌNH CHIẾN THẮNG (WIN MODAL)
    // -------------------------------------------------------------------------
    win: {
        title: { vi: 'MÀN HOÀN THÀNH!', en: 'LEVEL COMPLETED!' },
        subtitle: { vi: 'Tuyệt vời! Bạn đã hoàn thành xuất sắc màn chơi!', en: 'Awesome! You completed the stage successfully!' },
        items_collected: { vi: 'VẬT PHẨM THU THẬP VÀO KHU TRẠI:', en: 'ITEMS COLLECTED TO CAMP:' },
        new_discoveries: { vi: 'CÁC MỤC MỚI KHÁM PHÁ:', en: 'NEW DISCOVERIES:' },
        rewards_title: { vi: 'THƯỞNG CHIẾN THẮNG:', en: 'VICTORY REWARDS:' },
        btn_next: { vi: 'Màn Kế Tiếp', en: 'Next Level' },
        btn_replay: { vi: 'Chơi Lại', en: 'Replay' },
        btn_camp: { vi: 'Khu Trại', en: 'Campground' },
        btn_handbook: { vi: 'Cẩm Nang', en: 'Handbook' }
    },

    // -------------------------------------------------------------------------
    // MỤC 10: LỜI THOẠI & GỢI Ý CỦA CHÚ CHÓ (NPC TUTORIALS & HINTS)
    // (Lưu ý: Mọi câu thoại được biên tập ngắn gọn <= 48 ký tự)
    // -------------------------------------------------------------------------
    npc: {
        // Mở đầu Level 1 - 10
        intro_lv1: { vi: 'Chạm Xe Kéo Dã Ngoại để lấy đồ cắm trại nhé!', en: 'Tap Camping Wagon to get camping gear!' },
        intro_lv2: { vi: 'Chạm Xe Kéo để lấy thêm nguyên liệu nhé!', en: 'Keep tapping Wagon for more materials!' },
        intro_lv3: { vi: 'Chạm Xe Kéo để chuẩn bị đủ 3 nhóm đồ nhé!', en: 'Tap Wagon to prepare all 3 gear groups!' },
        intro_lv4: { vi: 'Ba Lô Dã Ngoại mới! Chạm để lấy đồ nhé!', en: 'New Backpack! Tap it to get new items!' },
        intro_lv5: { vi: 'Chạm Ba Lô chuẩn bị ẩm thực & dụng cụ!', en: 'Tap Backpack to prepare food & tools!' },
        intro_lv6: { vi: 'Ghép các món cao cấp từ Ba Lô Dã Ngoại nhé!', en: 'Merge higher items from the Backpack!' },
        intro_lv7: { vi: 'Thùng Dụng Cụ mới! Chạm để lấy thêm đồ!', en: 'New Tool Crate! Tap to explore gear!' },
        intro_lv8: { vi: 'Tạo đồ sinh hoạt từ Thùng Dụng Cụ nhé!', en: 'Make living & safety gear from Crate!' },
        intro_lv9: { vi: 'Khám phá trọn vẹn đồ từ Thùng Dụng Cụ!', en: 'Discover all items from the Tool Crate!' },
        intro_lv10: { vi: 'Hội tụ 3 nguồn phát! Chạm thùng làm việc!', en: 'All 3 containers ready! Tap to play!' },
        intro_default: { vi: 'Ghép các món cùng loại để nộp đơn nhé!', en: 'Merge matching items to finish orders!' },

        // Gợi ý tình huống trong màn
        deliver_ready: { vi: 'Xong đơn! Chạm NỘP để nhận Vàng nhé!', en: 'Order ready! Tap DELIVER for Gold!' },
        merge_web: { vi: 'Kéo {item} vào ô Nhện nhé!', en: 'Drag {item} onto the Web cell!' },
        merge_free: { vi: 'Ghép 2 {item} để giao đơn nhé!', en: 'Merge 2 {item} to complete order!' },
        spawn_prompt: { vi: 'Chạm Nguồn phát để lấy thêm đồ nhé!', en: 'Tap Generator to get items!' },
        out_of_energy: { vi: 'Hết năng lượng! Hãy nạp thêm nhé!', en: 'Out of energy! Please refill!' },
        board_full_sell: { vi: 'Bàn cờ đầy! Chọn đồ rồi bấm BÁN nhé!', en: 'Board is full! Pick item to SELL!' },
        board_full_merge: { vi: 'Bàn cờ đầy! Ghép cặp nhấp nháy nhé!', en: 'Board full! Merge the blinking pairs!' },
        board_full_no_moves: { vi: 'Bàn cờ hết nước! Chọn đồ rồi BÁN nhé!', en: 'Full & no moves! Pick item to SELL!' },
        need_item: { vi: 'Cần {item}! Hãy ghép nhé!', en: 'Need {item}! Merge to get it!' },
        clear_webs_win: { vi: 'Phá nốt {count} ô Nhện để thắng nhé!', en: 'Clear {count} Webs to win stage!' },
        first_deliver: { vi: 'Đủ món rồi! Chạm NỘP nhận Vàng nhé!', en: 'Order ready! Tap DELIVER for Gold!' },
        first_merge_web: { vi: 'Kéo {item} vào ô Nhện nhé!', en: 'Drag {item} onto the Web cell!' },
        first_merge_free: { vi: 'Ghép 2 {item} để nâng cấp nhé!', en: 'Merge 2 {item} to upgrade!' }
    },

    // -------------------------------------------------------------------------
    // MỤC 11: THÔNG BÁO NHANH (TOAST NOTIFICATIONS)
    // (Lưu ý: Mọi thông báo ngắn gọn <= 48 ký tự, nền duy nhất 3d221b trong suốt 86%)
    // -------------------------------------------------------------------------
    toasts: {
        energy_refilled: { vi: 'Đã nạp +{amount} Năng lượng!', en: 'Refilled +{amount} Energy!' },
        energy_full: { vi: 'Năng lượng đã đầy!', en: 'Energy is already full!' },
        buy_success: { vi: 'Mua thành công!', en: 'Purchase successful!' },
        not_enough_gold: { vi: 'Chưa đủ Vàng! Hãy ghép thêm nhé.', en: 'Not enough Gold! Merge to earn.' },
        not_enough_gems: { vi: 'Chưa đủ Kim Cương!', en: 'Not enough Diamonds!' },
        board_full: { vi: 'Bàn cờ đầy! Hãy ghép bớt đồ nhé.', en: 'Board is full! Merge to clear.' },
        tidy_sold: { vi: 'Đã dọn {count} món (+{coins} Vàng)!', en: 'Cleaned {count} items (+{coins} Gold)!' },
        tidy_clean: { vi: 'Bàn cờ đã gọn gàng!', en: 'Board is clean and organized!' },
        camp_sold: { vi: 'Đã bán {item} (+{coins} Vàng)!', en: 'Sold {item} (+{coins} Gold)!' },
        id_copied: { vi: 'Đã sao chép ID!', en: 'Player ID copied!' },
        lang_switched_vi: { vi: 'Đã đổi sang Tiếng Việt', en: 'Switched to Vietnamese' },
        lang_switched_en: { vi: 'Đã đổi sang Tiếng Anh', en: 'Switched to English' }
    }
};

// =============================================================================
// BỘ ĐIỀU KHIỂN ĐA NGÔN NGỮ (I18N CONTROLLER)
// =============================================================================
var I18N = (function () {
    // Khởi tạo ngôn ngữ mặc định: Tiếng Việt ('vi') và lưu vào bộ nhớ người chơi
    var savedLang = 'vi';
    try {
        if (typeof localStorage !== 'undefined') {
            var explicit = localStorage.getItem('camping_lang_explicit');
            if (explicit === '1') {
                var stored = localStorage.getItem('camping_language');
                if (stored === 'en' || stored === 'vi') {
                    savedLang = stored;
                }
            } else {
                // Mặc định luôn là Tiếng Việt và lưu vào bộ nhớ người chơi
                savedLang = 'vi';
                localStorage.setItem('camping_language', 'vi');
            }
        }
    } catch (e) {
        savedLang = 'vi';
    }

    return {
        currentLang: savedLang || 'vi',

        // Hàm lấy chuỗi đa ngôn ngữ theo đường dẫn key (vd: 'hud.btn_camp')
        t: function (path, params) {
            if (!path || typeof path !== 'string') return '';
            var parts = path.split('.');
            var target = I18N_DATA;
            for (var i = 0; i < parts.length; i++) {
                if (target && target[parts[i]]) {
                    target = target[parts[i]];
                } else {
                    return path; // Fallback trả về chính key nếu không tìm thấy
                }
            }
            var text = '';
            if (typeof target === 'object' && target !== null) {
                text = target[this.currentLang] || target['vi'] || target['en'] || '';
            } else if (typeof target === 'string') {
                text = target;
            }
            if (!text) return path;

            // Thay thế tham số {param} hoặc {0}, {1}
            if (params && typeof params === 'object') {
                for (var k in params) {
                    if (Object.prototype.hasOwnProperty.call(params, k)) {
                        text = text.replace(new RegExp('\\{' + k + '\\}', 'g'), params[k]);
                    }
                }
            }
            return text;
        },

        // Đổi ngôn ngữ và kích hoạt đồng bộ toàn bộ giao diện game
        setLanguage: function (lang) {
            this.currentLang = (lang === 'en') ? 'en' : 'vi';
            try {
                if (typeof localStorage !== 'undefined') {
                    localStorage.setItem('camping_language', this.currentLang);
                    localStorage.setItem('camping_lang_explicit', '1');
                }
            } catch (e) {}

            // Đồng bộ sang SAVE nếu có
            if (typeof SAVE !== 'undefined' && SAVE && SAVE.settings) {
                SAVE.settings.lang = this.currentLang;
            }
            if (typeof saveGame === 'function') {
                saveGame(true);
            }

            // Đồng bộ lại danh mục 72 vật phẩm
            this.syncItemChainsLanguage();

            // Cập nhật lại giao diện tĩnh HTML
            this.updateStaticHtml();

            return this.currentLang;
        },

        // Lấy tên vật phẩm theo mã ID và ngôn ngữ hiện tại
        getItemName: function (id) {
            if (!id) return '';
            if (I18N_DATA.generators && I18N_DATA.generators[id]) {
                return this.t('generators.' + id);
            }
            if (I18N_DATA.items && I18N_DATA.items[id]) {
                return this.t('items.' + id);
            }
            return id;
        },

        // Lấy tên dòng sản phẩm
        getLineTitle: function (line) {
            if (!line) return '';
            if (I18N_DATA.lines && I18N_DATA.lines[line]) {
                return this.t('lines.' + line);
            }
            return line;
        },

        // Trả về HTML biểu tượng lá cờ hình tròn dạng SVG sắc nét trên mọi thiết bị
        getFlagHtml: function (lang, size) {
            size = size || 24;
            if (lang === 'vi') {
                return '<span class="lang-flag-badge" style="width:' + size + 'px;height:' + size + 'px;" title="Tiếng Việt">' +
                    '<svg viewBox="0 0 32 32" width="' + size + '" height="' + size + '">' +
                        '<circle cx="16" cy="16" r="16" fill="#da251d"/>' +
                        '<polygon points="16,6 18.5,12.6 25.5,12.9 20,17.3 21.9,24.1 16,20.2 10.1,24.1 12,17.3 6.5,12.9 13.5,12.6" fill="#ffde00"/>' +
                    '</svg>' +
                '</span>';
            } else {
                return '<span class="lang-flag-badge" style="width:' + size + 'px;height:' + size + 'px;" title="English">' +
                    '<svg viewBox="0 0 32 32" width="' + size + '" height="' + size + '">' +
                        '<defs>' +
                            '<clipPath id="uk-flag-clip-' + size + '"><circle cx="16" cy="16" r="16"/></clipPath>' +
                        '</defs>' +
                        '<g clip-path="url(#uk-flag-clip-' + size + ')">' +
                            '<rect width="32" height="32" fill="#012169"/>' +
                            '<path d="M0,0 L32,32 M32,0 L0,32" stroke="#ffffff" stroke-width="5.5"/>' +
                            '<path d="M0,0 L32,32 M32,0 L0,32" stroke="#c8102e" stroke-width="3"/>' +
                            '<path d="M16,0 V32 M0,16 H32" stroke="#ffffff" stroke-width="9"/>' +
                            '<path d="M16,0 V32 M0,16 H32" stroke="#c8102e" stroke-width="5.5"/>' +
                        '</g>' +
                    '</svg>' +
                '</span>';
            }
        },

        // Đồng bộ dữ liệu tiêu đề và danh sách tên vào ITEM_CHAINS (dùng trong Cẩm Nang & Game)
        syncItemChainsLanguage: function () {
            if (typeof ITEM_CHAINS === 'undefined' || !Array.isArray(ITEM_CHAINS)) return;
            var self = this;
            ITEM_CHAINS.forEach(function (chain) {
                chain.title = self.getLineTitle(chain.line);
                if (Array.isArray(chain.names)) {
                    for (var i = 0; i < chain.names.length; i++) {
                        var itemId = chain.line + '_lv' + (i + 1);
                        chain.names[i] = self.getItemName(itemId);
                    }
                }
            });
        },

        // Cập nhật các nhãn tĩnh ngoài màn hình (Footer, Header button title)
        updateStaticHtml: function () {
            // Nút Footer
            var campBtn = document.getElementById('btn-camp');
            if (campBtn) {
                var campLabel = campBtn.querySelector('.footer-btn-label');
                if (campLabel) campLabel.textContent = this.t('hud.btn_camp');
                campBtn.title = this.t('hud.btn_camp_title');
            }
            var bookBtn = document.getElementById('btn-book');
            if (bookBtn) {
                var bookLabel = bookBtn.querySelector('.footer-btn-label');
                if (bookLabel) bookLabel.textContent = this.t('hud.btn_book');
                bookBtn.title = this.t('hud.btn_book_title');
            }
            var sellBtn = document.getElementById('btn-sell');
            if (sellBtn) {
                sellBtn.title = this.t('hud.btn_sell_title');
                var sellTextEl = document.getElementById('sell-btn-text');
                if (sellTextEl && typeof currentSelectedCell !== 'undefined' && currentSelectedCell === -1) {
                    sellTextEl.textContent = this.t('hud.btn_sell');
                }
            }

            // Nút Cây chổi dọn dẹp
            var broomBtn = document.getElementById('btn-tidy-board');
            if (broomBtn) broomBtn.title = this.t('hud.broom_title');

            // Header titles
            var mapBtn = document.getElementById('btn-world-map');
            if (mapBtn) mapBtn.title = this.t('hud.map_title');
            var energyBtn = document.getElementById('btn-refill-energy');
            if (energyBtn) energyBtn.title = this.t('hud.energy_title');
            var goldBtn = document.getElementById('btn-coin-shop');
            if (goldBtn) goldBtn.title = this.t('hud.gold_title');
            var gemBtn = document.getElementById('btn-gem-shop');
            if (gemBtn) gemBtn.title = this.t('hud.gem_title');
            var stBtn = document.getElementById('btn-settings');
            if (stBtn) stBtn.title = this.t('hud.settings_title');
            var npcBtn = document.getElementById('npc-avatar-btn');
            if (npcBtn) npcBtn.title = this.t('hud.npc_avatar_title');
        }
    };
})();

// Tự động kích hoạt đồng bộ ngôn ngữ ngay khi nạp xong file
try {
    if (typeof document !== 'undefined') {
        var onReady = function () {
            if (typeof I18N !== 'undefined') {
                I18N.syncItemChainsLanguage();
                I18N.updateStaticHtml();
            }
        };
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', onReady);
        } else {
            onReady();
        }
    }
} catch (e) {}
