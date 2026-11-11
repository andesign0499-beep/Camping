// =============================================================================
// TỆP BIÊN TẬP TOÀN BỘ NGÔN NGỮ (VIỆT - ANH) CHO GAME MERGE CAMPING
// Bạn có thể dễ dàng xem, sửa đổi mọi câu chữ, nhãn nút, tên 108 món đồ,
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
        btn_camp: { vi: 'CỬA HÀNG', en: 'SHOP' },
        btn_camp_title: { vi: 'Cửa Hàng', en: 'Shop' },
        btn_book: { vi: 'CẨM NANG', en: 'HANDBOOK' },
        btn_book_title: { vi: 'Cẩm Nang Trò Chơi', en: 'Camping Handbook' },
        btn_sell: { vi: 'BÁN', en: 'SELL' },
        btn_sell_title: { vi: 'Bán Vật Phẩm Lấy Vàng', en: 'Sell Item for Gold' },
        btn_mycamp: { vi: 'Trại của bạn', en: 'Your Camp' },
        btn_mycamp_title: { vi: 'Trại của bạn', en: 'Your Camp' },
        deliver_tag: { vi: 'NỘP', en: 'DELIVER' }
    },

    // -------------------------------------------------------------------------
    // MỤC 2: TÊN 9 DÒNG SẢN PHẨM & 108 VẬT PHẨM (HANDBOOK & BOARD ITEMS)
    // -------------------------------------------------------------------------
    lines: {
        an: { vi: 'Ẩm Thực Dã Ngoại', en: 'Camp Cuisine' },
        ban: { vi: 'Bàn Dã Ngoại', en: 'Camp Tables' },
        cafe: { vi: 'Cà Phê & Đồ Uống', en: 'Coffee & Drinks' },
        trai: { vi: 'Lều Trại Trú Ngụ', en: 'Shelter & Tents' },
        tham: { vi: 'Chỗ Ngủ Êm Ái', en: 'Cozy Sleep' },
        ghe: { vi: 'Ghế Nghỉ Ngơi', en: 'Camp Chairs' },
        bep: { vi: 'Lửa & Bếp Trại', en: 'Campfire & Cooking' },
        congcu: { vi: 'Chiếu Sáng Dã Ngoại', en: 'Camp Lighting' },
        antoan: { vi: 'An Toàn & Năng Lượng', en: 'Safety & Power Gear' }
    },

    items: {
        // Dòng 1: Ẩm thực (an)
        an_lv1: { vi: 'Quả Táo Đỏ', en: 'Red Apple' },
        an_lv2: { vi: 'Giỏ Trái Cây Tươi', en: 'Fresh Fruit Basket' },
        an_lv3: { vi: 'Bánh Sandwich Kẹp', en: 'Club Sandwich' },
        an_lv4: { vi: 'Đùi Gà Nướng', en: 'Roasted Chicken Drumstick' },
        an_lv5: { vi: 'Bánh Pizza Dã Ngoại', en: 'Camp Pizza' },
        an_lv6: { vi: 'Nồi Lẩu Thập Cẩm Nóng', en: 'Hot Camping Stew Pot' },
        an_lv7: { vi: 'Khay Sushi Cá Hồi', en: 'Salmon Sushi Platter' },
        an_lv8: { vi: 'Sườn Nướng BBQ Sốt Đậm', en: 'Glazed BBQ Pork Ribs' },
        an_lv9: { vi: 'Đĩa Hải Sản Hấp Tôm Ngao', en: 'Steamed Seafood Platter' },
        an_lv10: { vi: 'Đùi Heo Xông Khói', en: 'Smoked Ham Hock' },
        an_lv11: { vi: 'Thịt Bò Wagyu Thượng Hạng', en: 'Premium Wagyu Steak' },
        an_lv12: { vi: 'Cua Hoàng Đế Thượng Hạng', en: 'Royal Steamed King Crab' },

        // Dòng 2: Bàn (ban)
        ban_lv1: { vi: 'Bàn Nhôm Vuông Mini', en: 'Mini Aluminum Table' },
        ban_lv2: { vi: 'Bàn Vải Khung Gấp', en: 'Folding Mesh Camp Table' },
        ban_lv3: { vi: 'Bàn Gỗ Xếp Chữ X', en: 'X-Frame Wood Camp Table' },
        ban_lv4: { vi: 'Bàn Xếp Chiến Thuật Xanh', en: 'Olive Folding Camp Table' },
        ban_lv5: { vi: 'Bàn Xếp Thổ Cẩm Dã Ngoại', en: 'Boho Pattern Camp Table' },
        ban_lv6: { vi: 'Bàn Gỗ Nan Xếp Dã Ngoại', en: 'Slatted Wood Picnic Table' },
        ban_lv7: { vi: 'Bàn Gỗ Khung Hợp Kim', en: 'Alloy-Frame Wood Table' },
        ban_lv8: { vi: 'Bàn Nhôm Gấp Cắm Trại', en: 'Aluminum Roll-Top Table' },
        ban_lv9: { vi: 'Bàn Dã Ngoại Gỗ Sồi', en: 'Oak Wood Camp Table' },
        ban_lv10: { vi: 'Bàn Gỗ Óc Chó Chân Cao', en: 'Telescopic Walnut Table' },
        ban_lv11: { vi: 'Bàn Bếp IGT Đơn Đa Năng', en: 'Single-Burner IGT Table' },
        ban_lv12: { vi: 'Trạm Bếp Inox Glamping', en: 'Glamping Kitchen Station' },

        // Dòng 3: Cà phê & Đồ uống (cafe)
        cafe_lv1: { vi: 'Hạt Cà Phê Rang', en: 'Roasted Coffee Beans' },
        cafe_lv2: { vi: 'Bao Tải Cà Phê Hạt', en: 'Burlap Coffee Bean Sack' },
        cafe_lv3: { vi: 'Cối Xay Cà Phê Cầm Tay', en: 'Manual Coffee Grinder' },
        cafe_lv4: { vi: 'Ấm Pha Moka Pot', en: 'Moka Pot Brewer' },
        cafe_lv5: { vi: 'Cốc Cà Phê Sứ Đỏ', en: 'Red Mug Hot Coffee' },
        cafe_lv6: { vi: 'Ly Cappuccino Bọt Sữa', en: 'Layered Cappuccino' },
        cafe_lv7: { vi: 'Ly Cà Phê Đen Đá', en: 'Iced Black Coffee' },
        cafe_lv8: { vi: 'Ly Cà Phê Sữa Đá', en: 'Iced Milk Coffee' },
        cafe_lv9: { vi: 'Trà Trái Cây Nhiệt Đới', en: 'Tropical Fruit Iced Tea' },
        cafe_lv10: { vi: 'Hũ Trà Đào Cam Sả', en: 'Peach Citrus Tea Jar' },
        cafe_lv11: { vi: 'Ấm Trà Hoa Thảo Mộc', en: 'Herbal Flower Teapot' },
        cafe_lv12: { vi: 'Bình Trà Trái Cây Tiệc Trại', en: 'Fruit Tea Party Dispenser' },

        // Dòng 4: Lều trại (trai)
        trai_lv1: { vi: 'Cọc Ghim Lều Xanh', en: 'Green Tent Peg' },
        trai_lv2: { vi: 'Cuộn Dây Dù Căng Lều', en: 'Orange Guyline Rope' },
        trai_lv3: { vi: 'Bộ Khung Cọc Lều', en: 'Folding Tent Pole Set' },
        trai_lv4: { vi: 'Lều Vòm Mini Cam Xanh', en: 'Mini Orange Dome Tent' },
        trai_lv5: { vi: 'Lều Vòm Cắm Trại Xanh Rêu', en: 'Olive Camp Tent' },
        trai_lv6: { vi: 'Lều Chữ A Vải Vàng', en: 'Yellow A-Frame Tent' },
        trai_lv7: { vi: 'Lều Vòm Gia Đình Nâu', en: 'Brown Family Dome Tent' },
        trai_lv8: { vi: 'Lều Đường Hầm Gia Đình', en: 'Beige Family Tunnel Tent' },
        trai_lv9: { vi: 'Lều Chuông Bell Glamping', en: 'Cream Bell Glamping Tent' },
        trai_lv10: { vi: 'Lều Vòm Cầu Geodesic', en: 'Geodesic Dome Tent' },
        trai_lv11: { vi: 'Lều Mái Vòm Sàn Gỗ Đèn LED', en: 'Lit Cabin Glamping Tent' },
        trai_lv12: { vi: 'Biệt Thự Lều Safari Hoàng Gia', en: 'Royal Safari Lodge Villa' },

        // Dòng 5: Chỗ ngủ (tham)
        tham_lv1: { vi: 'Tấm Chăn Cuộn Xám', en: 'Rolled Grey Camp Blanket' },
        tham_lv2: { vi: 'Gối Hơi Dã Ngoại Xanh', en: 'Blue Inflatable Pillow' },
        tham_lv3: { vi: 'Thảm Picnic Kẻ Ca-rô Đỏ', en: 'Red Gingham Picnic Mat' },
        tham_lv4: { vi: 'Thảm Cuộn Cách Nhiệt Xanh', en: 'Rolled Olive Foam Mat' },
        tham_lv5: { vi: 'Bộ Túi Ngủ Cuộn Cam', en: 'Rolled Orange Sleeping Gear' },
        tham_lv6: { vi: 'Túi Ngủ Xanh Rêu Ấm Áp', en: 'Olive Mummy Sleeping Bag' },
        tham_lv7: { vi: 'Đệm Hơi Đơn Kèm Bơm Tay', en: 'Air Mattress & Hand Pump' },
        tham_lv8: { vi: 'Bộ Chăn Đệm Gấp Dã Ngoại', en: 'Folded Camp Quilt & Pillow' },
        tham_lv9: { vi: 'Đệm Hơi Đôi Cao Cấp', en: 'Double Inflatable Air Bed' },
        tham_lv10: { vi: 'Giường Xếp Khung Nhôm', en: 'Aluminum Folding Camp Cot' },
        tham_lv11: { vi: 'Giường Xếp Chăn Bông Ấm', en: 'Quilted Glamping Camp Cot' },
        tham_lv12: { vi: 'Giường Ngủ Glamping Hoàng Gia', en: 'Royal Boho Glamping Bed' },

        // Dòng 6: Ghế (ghe)
        ghe_lv1: { vi: 'Ghế Đôn Xếp Cầu Vồng', en: 'Telescoping Folding Stool' },
        ghe_lv2: { vi: 'Ghế Xếp Mini Xanh Ngọc', en: 'Teal Mini Folding Chair' },
        ghe_lv3: { vi: 'Ghế Xếp Vải Bố Màu Cát', en: 'Khaki Canvas Camp Chair' },
        ghe_lv4: { vi: 'Ghế Xếp Xanh Rêu Tay Vịn', en: 'Olive Camp Armchair' },
        ghe_lv5: { vi: 'Ghế Xếp Thổ Cẩm Dã Ngoại', en: 'Boho Pattern Camp Chair' },
        ghe_lv6: { vi: 'Ghế Xếp Siêu Nhẹ Khung Cong', en: 'Ultralight Curved Chair' },
        ghe_lv7: { vi: 'Ghế Xếp Xanh Navy Cao Cấp', en: 'Navy Folding Camp Chair' },
        ghe_lv8: { vi: 'Ghế Gỗ Đệm Nâu Cổ Điển', en: 'Brown Wood-Arm Chair' },
        ghe_lv9: { vi: 'Ghế Khung Gỗ Vải Kem', en: 'Cream Wood Camp Chair' },
        ghe_lv10: { vi: 'Ghế Đạo Diễn Đỏ Trắng', en: 'Red Director Camp Chair' },
        ghe_lv11: { vi: 'Ghế Tựa Cao Khung Bạc', en: 'High-Back Camp Chair' },
        ghe_lv12: { vi: 'Ghế Đạo Diễn Glamping Đỏ', en: 'Royal Red Glamping Chair' },

        // Dòng 7: Bếp & Lửa (bep)
        bep_lv1: { vi: 'Nhánh Củi Khô', en: 'Dry Twig' },
        bep_lv2: { vi: 'Khúc Gỗ Tròn', en: 'Wooden Log' },
        bep_lv3: { vi: 'Bó Củi Buộc Dây', en: 'Firewood Bundle' },
        bep_lv4: { vi: 'Hố Đá Xếp Củi', en: 'Stone Fire Pit Base' },
        bep_lv5: { vi: 'Đống Củi Trại Vòng Đá', en: 'Stacked Firewood Pit' },
        bep_lv6: { vi: 'Lửa Trại Rực Hồng', en: 'Blazing Bonfire' },
        bep_lv7: { vi: 'Lò Nướng Than Hoa Tròn', en: 'Round Charcoal Grill' },
        bep_lv8: { vi: 'Bếp Nướng Than Inox Mini', en: 'Mini Stainless Charcoal Grill' },
        bep_lv9: { vi: 'Bếp Nướng Than Chân Xếp', en: 'Folding Leg BBQ Grill' },
        bep_lv10: { vi: 'Bếp Nướng Thuyền Đen', en: 'Black Barrel BBQ Grill' },
        bep_lv11: { vi: 'Bếp Nướng Chân Cao BBQ', en: 'Elevated Camp BBQ Grill' },
        bep_lv12: { vi: 'Đại Bếp Nướng BBQ Inox', en: 'Grand Stainless BBQ Grill' },

        // Dòng 8: Chiếu sáng dã ngoại (congcu)
        congcu_lv1: { vi: 'Bóng Đèn Treo Lều', en: 'Hanging Tent Bulb' },
        congcu_lv2: { vi: 'Đèn Pin Cầm Tay', en: 'Camp Flashlight' },
        congcu_lv3: { vi: 'Dây Đèn LED Đom Đóm', en: 'Warm String Lights' },
        congcu_lv4: { vi: 'Đèn Lồng Sạc Dã Ngoại', en: 'Compact Rechargeable Lantern' },
        congcu_lv5: { vi: 'Đèn Bảng LED Dã Ngoại', en: 'Folding LED Floodlight' },
        congcu_lv6: { vi: 'Đèn Bão Dã Ngoại Cam', en: 'Orange Storm Lantern' },
        congcu_lv7: { vi: 'Đèn Bão Xanh Rêu Cổ Điển', en: 'Olive Hurricane Lantern' },
        congcu_lv8: { vi: 'Đèn Bão Đỏ Cổ Điển', en: 'Classic Red Lantern' },
        congcu_lv9: { vi: 'Đèn Măng-Xông Quân Đội', en: 'Olive Mantle Lantern' },
        congcu_lv10: { vi: 'Đèn Măng-Xông Chụp Bạc', en: 'Silver Reflector Lantern' },
        congcu_lv11: { vi: 'Đèn Măng-Xông Đồng Vàng', en: 'Golden Brass Lantern' },
        congcu_lv12: { vi: 'Đèn Măng-Xông Hoàng Gia', en: 'Royal Gold Reflector Lantern' },

        // Dòng 9: An toàn & Năng lượng (antoan)
        antoan_lv1: { vi: 'Chai Xịt Chống Muỗi', en: 'Mosquito Repellent Spray' },
        antoan_lv2: { vi: 'Kem Chống Nắng Dã Ngoại', en: 'Camp Sunscreen Cream' },
        antoan_lv3: { vi: 'Túi Bàn Chải & Vệ Sinh', en: 'Travel Toiletry Kit' },
        antoan_lv4: { vi: 'Cáp Sạc Bọc Dù', en: 'Braided Charging Cable' },
        antoan_lv5: { vi: 'Pin Sạc Dự Phòng', en: 'Portable Power Bank' },
        antoan_lv6: { vi: 'Túi Y Tế Sơ Cứu', en: 'First Aid Medical Kit' },
        antoan_lv7: { vi: 'Đèn Khò Gas Mini', en: 'Portable Gas Torch' },
        antoan_lv8: { vi: 'Quạt Tích Điện Dã Ngoại', en: 'Rechargeable Camp Fan' },
        antoan_lv9: { vi: 'Tấm Pin Năng Lượng Mặt Trời', en: 'Solar Charging Panel' },
        antoan_lv10: { vi: 'Loa Bluetooth Dã Ngoại', en: 'Outdoor Bluetooth Speaker' },
        antoan_lv11: { vi: 'Trạm Sạc Dự Phòng Mini', en: 'Compact Power Station' },
        antoan_lv12: { vi: 'Trạm Năng Lượng Glamping', en: 'Glamping Power Station' }
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
        title: { vi: 'CỬA HÀNG', en: 'SHOP' },
        decor_modal_title: { vi: 'ĐỒ CẮM TRẠI', en: 'CAMP ITEMS' },
        decor_title: { vi: 'ĐỒ CẮM TRẠI', en: 'CAMP ITEMS' },
        btn_mycamp_decor: { vi: 'Đồ cắm trại', en: 'Camp Items' },
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
        dest_dongdo: { vi: 'Cao nguyên Lâm Viên', en: 'Lam Vien Plateau' },
        dest_doibu: { vi: 'Đồi Bù', en: 'Doi Bu Hill' },
        dest_matthan: { vi: 'Núi Mắt Thần', en: 'God Eye Mountain' },
        dest_bangioc: { vi: 'Thác Bản Giốc', en: 'Ban Gioc Waterfall' },
        dest_muine: { vi: 'Đồi Cát Mũi Né', en: 'Mui Ne Sand Dunes' },
        dest_yty: { vi: 'Đồi Cát Mũi Né', en: 'Mui Ne Sand Dunes' },
        dest_songnuocbinhba: { vi: 'Sóng nước Bình Ba', en: 'Binh Ba Waves' },
        dest_binhba: { vi: 'Sóng nước Bình Ba', en: 'Binh Ba Waves' }
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
        dev_tool: { vi: 'Bật công cụ Test & Bot', en: 'Enable Test & Bot Tool' },
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
        welcome_camp: { vi: 'Chào mừng bạn đến với khu trại nhỏ!', en: 'Welcome to the small camp!' },
        intro_lv1: { vi: 'Chạm Xe Kéo lấy đồ cắm trại và ghép giao đơn nhé!', en: 'Tap the wagon to get camping gear and complete quests!' },
        intro_lv2: { vi: 'Chạm Ba Lô để lấy bánh mì và pha cà phê ấm nóng nào!', en: 'Tap the Backpack to get sandwiches and warm coffee!' },
        intro_lv3: { vi: 'Chạm Thùng Đồ lấy thảm trải cỏ và bật bếp lửa sưởi ấm nhé!', en: 'Tap the Tool Crate to spread mats and light the fire!' },
        intro_lv4: { vi: 'Chạm Xe Kéo để ghép bàn gỗ và ghế tựa êm ái nào!', en: 'Tap the Wagon to merge wooden tables and chairs!' },
        intro_lv5: { vi: 'Mở Ba Lô chuẩn bị búa cắm cọc và làm bữa ăn no nê bạn nhé!', en: 'Open Backpack for tent hammers and hearty meals!' },
        intro_lv6: { vi: 'Mở Thùng Đồ chuẩn bị bếp nướng và hộp sơ cứu phòng thân nhé!', en: 'Open Tool Crate for BBQ stoves and first aid kits!' },
        intro_lv7: { vi: 'Chạm Xe Kéo dựng thêm bạt che lớn và bàn tiệc hoành tráng nhé!', en: 'Tap Wagon for large tarps and family banquet tables!' },
        intro_lv8: { vi: 'Mở Ba Lô pha bình cà phê nóng và lấy đèn pin đi dạo thôi!', en: 'Open Backpack for hot coffee flasks and flashlights!' },
        intro_lv9: { vi: 'Mở Thùng Đồ nhóm ngọn lửa trại rực rỡ cho đêm tiệc đáng nhớ nhé!', en: 'Open Tool Crate to light a warm campfire for the party!' },
        intro_lv10: { vi: 'Hội tụ 3 nguồn phát! Chạm thùng làm việc!', en: 'All 3 containers ready! Tap to play!' },
        intro_default: { vi: 'Ghép các món cùng loại để nộp đơn nhé!', en: 'Merge matching items to finish orders!' },

        // Gợi ý tình huống trong màn
        deliver_ready: { vi: 'Xong đơn! Chạm NỘP để nhận Vàng nhé!', en: 'Order ready! Tap DELIVER for Gold!' },
        deliver_order_hint: { vi: 'Ghép xong rồi! Chạm nút GIAO nhận thưởng và mở đất nhé!', en: 'Order ready! Tap DELIVER to level up and unlock land!' },
        tent_lv4_hint: { vi: 'Gâu! Có Lều rồi! Vào "Trại của bạn" dựng lều nhé!', en: 'You got a Tent! Tap "My Camp" to decorate your campsite!' },
        merge_web: { vi: 'Kéo {item} vào ô Nhện nhé!', en: 'Drag {item} onto the Web cell!' },
        merge_free: { vi: 'Ghép 2 {item} để giao đơn nhé!', en: 'Merge 2 {item} to complete order!' },
        spawn_prompt: { vi: 'Chạm Nguồn phát để lấy thêm đồ nhé!', en: 'Tap Generator to get items!' },
        out_of_energy: { vi: 'Hết năng lượng! Hãy nạp thêm nhé!', en: 'Out of energy! Please refill!' },
        board_full_sell: { vi: 'Bàn cờ đầy! Chọn đồ rồi bấm BÁN nhé!', en: 'Board is full! Pick item to SELL!' },
        board_full_merge: { vi: 'Bàn cờ đầy! Ghép cặp nhấp nháy nhé!', en: 'Board full! Merge the blinking pairs!' },
        board_full_no_moves: { vi: 'Bàn cờ hết nước! Chọn đồ rồi BÁN nhé!', en: 'Full & no moves! Pick item to SELL!' },
        need_item: { vi: 'Cần {item}! Hãy ghép nhé!', en: 'Need {item}! Merge to get it!' },
        item_guide: { vi: 'Món này là {name} (Level {lv}), nằm trong {gen} nhé!', en: 'This is {name} (Level {lv}), found in {gen}!' },
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
            var myCampBtn = document.getElementById('btn-my-camp');
            if (myCampBtn) {
                myCampBtn.title = this.t('hud.btn_mycamp_title') || 'Trại của bạn';
                var myCampLabel = myCampBtn.querySelector('.footer-btn-label');
                if (myCampLabel) myCampLabel.textContent = this.t('hud.btn_mycamp') || 'Trại của bạn';
            }

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
