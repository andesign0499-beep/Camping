// =============================================================================
// MINI-GAME MAP 1: LÉN LẤY MẬT ONG RỪNG (STEALTH HONEY HARVEST — 60FPS CANVAS)
// - Tích lũy Vé Mật Ong (1/5 -> 5/5) khi hoàn thành đơn hàng NPC ngoài bàn chơi
// - Hỗ trợ Chơi Ngay khi đủ 5/5 vé HOẶC Chơi Thử trực tiếp từ popup giới thiệu
// - Điều khiển 1 ngón tay mượt mà (chạm & kéo bất kỳ đâu trên màn hình để lái muỗng mật)
// - Hiệu ứng ong bay sống động trên ảnh 1 frame (nhấp nhô, nghiêng mình, rung cánh, bóng đổ,
//   hạt phấn vàng, ong ngái ngủ Zzz tắt/bật ra-đa, ong đội trưởng quét đèn pha)
// =============================================================================

(function () {
    'use strict';

    var TICKET_TARGET = 5;
    var ASSET_DIR = 'assets/Minigame/matong/';

    // Cấu hình 2 frame vỗ cánh (10 fps) & kích thước 130% cho 3 loại ong
    // nativeFacing: 1 = ảnh gốc quay mặt sang PHẢI, -1 = ảnh gốc quay mặt sang TRÁI
    var BEE_ANIM_FPS = 10;
    var BEE_SPRITE_CONFIG = {
        ong1: {
            frames: [ASSET_DIR + 'ong1_frame1.png', ASSET_DIR + 'ong1_frame2.png'],
            nativeFacing: 1,
            drawW: 35,
            drawH: 36,
            bodyRadius: 12
        },
        ong2: {
            frames: [ASSET_DIR + 'ong2_frame1.png', ASSET_DIR + 'ong2_frame2.png'],
            nativeFacing: -1,
            drawW: 40,
            drawH: 36,
            bodyRadius: 12.5
        },
        ong3: {
            frames: [ASSET_DIR + 'ong3_frame1.png', ASSET_DIR + 'ong3_frame2.png'],
            nativeFacing: 1,
            drawW: 48,
            drawH: 49,
            bodyRadius: 15
        }
    };

    var SCENE_IMAGES_SRC = {
        bg: ASSET_DIR + 'bg_matong.jpg',
        branch: ASSET_DIR + 'caylon.png',
        hive: ASSET_DIR + 'toong.png',
        bushLeft: ASSET_DIR + 'cauduoi_trai.png',
        bushRight: ASSET_DIR + 'cayduoi_phai.png',
        spoon: ASSET_DIR + 'muong.png',
        ticketIcon: ASSET_DIR + 'icon_nhiemvu.png',
        entryThumb: ASSET_DIR + 'img_ve.png'
    };

    var imgCache = {};
    var imagesPreloaded = false;

    function loadImg(src) {
        if (imgCache[src]) return imgCache[src];
        var im = new Image();
        im.src = src;
        imgCache[src] = im;
        return im;
    }

    function preloadAllAssets() {
        if (imagesPreloaded) return;
        imagesPreloaded = true;
        Object.keys(SCENE_IMAGES_SRC).forEach(function (k) {
            loadImg(SCENE_IMAGES_SRC[k]);
        });
        Object.keys(BEE_SPRITE_CONFIG).forEach(function (bk) {
            BEE_SPRITE_CONFIG[bk].frames.forEach(loadImg);
        });
    }

    function ensureSaveMinigameState() {
        if (typeof SAVE === 'undefined' || !SAVE) return { honey: 1, honeyStage: 1 };
        if (!SAVE.minigameTickets || typeof SAVE.minigameTickets !== 'object') {
            SAVE.minigameTickets = { honey: 1, honeyStage: 1 };
        }
        if (typeof SAVE.minigameTickets.honey !== 'number' || SAVE.minigameTickets.honey < 0) {
            SAVE.minigameTickets.honey = 1;
        }
        if (typeof SAVE.minigameTickets.honeyStage !== 'number' || SAVE.minigameTickets.honeyStage < 1) {
            SAVE.minigameTickets.honeyStage = 1;
        }
        return SAVE.minigameTickets;
    }

    function getTicketCount() {
        return ensureSaveMinigameState().honey;
    }

    function updateTicketHUD() {
        var st = ensureSaveMinigameState();
        var lbl = document.getElementById('minigame-ticket-label');
        var btn = document.getElementById('btn-minigame-entry');
        var badge = document.getElementById('minigame-ready-dot');
        if (lbl) {
            lbl.textContent = st.honey + '/' + TICKET_TARGET;
        }
        if (btn) {
            var ready = st.honey >= TICKET_TARGET;
            btn.classList.toggle('is-ready', ready);
            btn.title = ready
                ? 'Đủ ' + st.honey + '/' + TICKET_TARGET + ' vé Mật Ong! Chạm để cùng Golden đi lấy mật ngay!'
                : 'Mini-game Lấy Mật Ong (' + st.honey + '/' + TICKET_TARGET + ' vé): Hoàn thành đơn NPC để tích vé hoặc bấm để Chơi Thử!';
        }
        if (badge) {
            badge.style.display = (st.honey >= TICKET_TARGET) ? 'flex' : 'none';
        }
    }

    // Hiệu ứng tấm vé mật ong bay từ khay NPC vừa giao về thẳng nút Mini-game góc trái
    function awardTicketFromOrder(sourceEl, count) {
        var amt = (typeof count === 'number' && count > 0) ? count : 1;
        var st = ensureSaveMinigameState();
        st.honey += amt;
        if (typeof saveGame === 'function') saveGame();

        var targetBtn = document.getElementById('btn-minigame-entry');
        if (!sourceEl || !targetBtn || (typeof window !== 'undefined' && window.autoBotRunning)) {
            updateTicketHUD();
            return;
        }

        var sRect = sourceEl.getBoundingClientRect();
        var tRect = targetBtn.getBoundingClientRect();
        if (!sRect.width || !tRect.width) {
            updateTicketHUD();
            return;
        }

        var flyer = document.createElement('img');
        flyer.src = SCENE_IMAGES_SRC.ticketIcon;
        flyer.className = 'flying-honey-ticket';
        var startX = sRect.left + sRect.width * 0.72 - 15;
        var startY = sRect.top + 6;
        var endX = tRect.left + tRect.width * 0.5 - 15;
        var endY = tRect.top + tRect.height * 0.5 - 15;
        flyer.style.left = startX + 'px';
        flyer.style.top = startY + 'px';
        document.body.appendChild(flyer);

        var dx = endX - startX;
        var dy = endY - startY;

        if (flyer.animate) {
            var anim = flyer.animate([
                { transform: 'translate3d(0,0,0) scale(0.75) rotate(-12deg)', opacity: 0.95 },
                { transform: 'translate3d(' + (dx * 0.48) + 'px,' + (dy * 0.48 - 34) + 'px,0) scale(1.28) rotate(10deg)', opacity: 1, offset: 0.48 },
                { transform: 'translate3d(' + dx + 'px,' + dy + 'px,0) scale(0.88) rotate(0deg)', opacity: 0.95 }
            ], {
                duration: 560,
                easing: 'cubic-bezier(0.22, 0.88, 0.32, 1.12)'
            });
            anim.onfinish = function () {
                if (flyer.parentNode) flyer.remove();
                updateTicketHUD();
                targetBtn.classList.remove('ticket-hit-bounce');
                void targetBtn.offsetWidth;
                targetBtn.classList.add('ticket-hit-bounce');
                if (st.honey === TICKET_TARGET && typeof showToast === 'function') {
                    showToast('Đủ 5/5 vé Mật Ong! Chạm biểu tượng Tổ Ong để đi lấy mật nhé!');
                }
            };
        } else {
            setTimeout(function () {
                if (flyer.parentNode) flyer.remove();
                updateTicketHUD();
            }, 500);
        }
    }

    // Mở popup giới thiệu Kem-Gỗ khi chưa đủ 5/5 vé (có nút Chơi Thử Ngay tiện lợi)
    function openHoneyIntroModal() {
        var st = ensureSaveMinigameState();
        if (st.honey >= TICKET_TARGET) {
            openHoneyMinigame({ useTickets: true });
            return;
        }
        if (typeof createModal !== 'function') {
            openHoneyMinigame({ useTickets: false });
            return;
        }

        var pct = Math.min(100, Math.round((st.honey / TICKET_TARGET) * 100));
        var html =
            '<div class="kw-modal-shell">' +
                '<div class="kw-summary-banner honey-intro-banner">' +
                    '<img src="' + SCENE_IMAGES_SRC.entryThumb + '" class="honey-intro-thumb" alt="Lấy Mật Ong">' +
                    '<div class="honey-intro-meta">' +
                        '<div class="honey-intro-title">Rừng Thông Lâm Viên • Tầng ' + st.honeyStage + '</div>' +
                        '<div class="honey-intro-sub">Hoàn thành đơn hàng NPC để tích đủ <b>5 vé Tổ Ong</b> cùng Golden đi lấy mật rừng!</div>' +
                        '<div class="dp-dt-bar honey-ticket-bar' + (pct >= 100 ? ' is-full' : '') + '">' +
                            '<div class="dp-dt-bar-fill" style="width:' + pct + '%"></div>' +
                            '<span class="dp-dt-bar-txt">Vé hiện có: ' + st.honey + ' / ' + TICKET_TARGET + '</span>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="kw-card-panel honey-intro-rules-card">' +
                    '<div class="honey-intro-rule-head">Phần thưởng chuyến đi lấy mật:</div>' +
                    '<div class="honey-intro-rewards-row">' +
                        '<span class="lucky-reward-pill"><img class="inline-ui-icon" src="assets/images_webp/ui/icon_nangluong.webp" alt=""> +35 Năng Lượng</span>' +
                        '<span class="lucky-reward-pill"><img class="inline-ui-icon" src="assets/images_webp/ui/icon_glod.webp" alt=""> +600~900 Vàng</span>' +
                        '<span class="lucky-reward-pill"><img class="inline-ui-icon" src="assets/images_webp/ui/icon_ruby.webp" alt=""> +3 Kim Cương</span>' +
                    '</div>' +
                    '<div class="honey-intro-rule-tip">' +
                        '• <b>Chạm & kéo</b> để lái chiếc muỗng gỗ khéo léo lên tổ mật trên cành cây.<br>' +
                        '• Né <b>sóng ra-đa trắng</b> và cẩn thận đàn ong sẽ <b>đuổi theo</b> nếu muỗng lại quá gần!<br>' +
                        '• Mẹo: Canh lúc <b>Ong Ngái Ngủ (Zzz)</b> nhắm mắt hoặc nhanh tay lách ra xa để cắt đuôi ong!' +
                    '</div>' +
                '</div>' +
                '<div class="modal-buttons dp-bottom-btn-row is-dual-btns">' +
                    '<button class="modal-btn gem-btn" id="btn-honey-practice">Chơi Thử Ngay</button>' +
                    '<button class="modal-btn primary" id="btn-honey-intro-close">Đóng</button>' +
                '</div>' +
            '</div>';

        var overlay = createModal(html, 'shop-box kem-wood-modal honey-intro-modal', 'LẤY MẬT ONG');
        var practiceBtn = overlay.querySelector('#btn-honey-practice');
        if (practiceBtn) {
            practiceBtn.onclick = function () {
                if (typeof closeModal === 'function') closeModal();
                openHoneyMinigame({ useTickets: false });
            };
        }
        var closeBtn = overlay.querySelector('#btn-honey-intro-close');
        if (closeBtn) {
            closeBtn.onclick = function () {
                if (typeof closeModal === 'function') closeModal();
            };
        }
    }

    // =========================================================================
    // ENGINE GAMEPLAY 60FPS TRÊN HỆ TỌA ĐỘ CHUẨN 500 x 896 (KHỚP TỶ LỆ 1000x1792)
    // =========================================================================
    var W = 500;
    var H = 896;
    var activeSession = null;

    function clamp(v, min, max) {
        return v < min ? min : (v > max ? max : v);
    }

    function normalizeAngleDiff(a, b) {
        var d = a - b;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        return d;
    }

    function lerpAngle(a, b, t) {
        return a + normalizeAngleDiff(b, a) * t;
    }

    // Đội hình bóng đá 3-3-2 gồm 8 cầu thủ ong phủ kín toàn sân (3 Hậu vệ - 3 Tiền vệ - 2 Tiền đạo)
    // Khóa chặt cả 2 biên trái/phải lẫn trung lộ, tự động bọc lót & hoán đổi vị trí liên tục!
    var FORMATION_SLOTS = [
        // Hàng Hậu Vệ gần tổ (3 vị trí: Biên Trái - Trung Vệ - Biên Phải)
        { id: 0, x: 76,  y: 274, patrolDx: 38, patrolDy: 12, baseLook: 1.18, sweepAmp: 0.48 },
        { id: 1, x: 250, y: 256, patrolDx: 44, patrolDy: 10, baseLook: 1.57, sweepAmp: 0.52 },
        { id: 2, x: 424, y: 274, patrolDx: 38, patrolDy: 12, baseLook: 1.96, sweepAmp: 0.48 },
        // Hàng Tiền Vệ giữa sân (3 vị trí: Cánh Trái - Trung Tâm - Cánh Phải)
        { id: 3, x: 72,  y: 432, patrolDx: 40, patrolDy: 18, baseLook: 1.15, sweepAmp: 0.50 },
        { id: 4, x: 250, y: 416, patrolDx: 46, patrolDy: 12, baseLook: 1.57, sweepAmp: 0.54 },
        { id: 5, x: 428, y: 432, patrolDx: 40, patrolDy: 18, baseLook: 1.99, sweepAmp: 0.50 },
        // Hàng Tiền Đạo tầng dưới (2 vị trí: Lệch Trái - Lệch Phải)
        { id: 6, x: 132, y: 586, patrolDx: 68, patrolDy: 16, baseLook: 1.32, sweepAmp: 0.50 },
        { id: 7, x: 368, y: 586, patrolDx: 68, patrolDy: 16, baseLook: 1.82, sweepAmp: 0.50 }
    ];

    function createStageBees(stageNum) {
        var speedMul = 1 + Math.min(0.26, (stageNum - 1) * 0.04);
        var half45 = Math.PI / 8; // Góc xòe tổng 45 độ (mỗi bên 22.5 độ)
        var specs = [
            { slotIdx: 0, type: 'ong1', mode: 'patrol',  speed: 58, chaseSpeed: 124, senseRadius: 96,  coneLen: 108, phase: 0.2 },
            { slotIdx: 1, type: 'ong3', mode: 'sweeper', speed: 54, chaseSpeed: 136, senseRadius: 110, coneLen: 116, phase: 1.0 },
            { slotIdx: 2, type: 'ong1', mode: 'patrol',  speed: 58, chaseSpeed: 124, senseRadius: 96,  coneLen: 108, phase: 2.0 },
            { slotIdx: 3, type: 'ong1', mode: 'patrol',  speed: 62, chaseSpeed: 126, senseRadius: 98,  coneLen: 110, phase: 3.1 },
            { slotIdx: 4, type: 'ong2', mode: 'sleeper', speed: 44, chaseSpeed: 112, senseRadius: 84,  coneLen: 104, phase: 4.1 },
            { slotIdx: 5, type: 'ong3', mode: 'sweeper', speed: 52, chaseSpeed: 134, senseRadius: 108, coneLen: 116, phase: 4.9 },
            { slotIdx: 6, type: 'ong1', mode: 'patrol',  speed: 64, chaseSpeed: 126, senseRadius: 98,  coneLen: 108, phase: 5.5 },
            { slotIdx: 7, type: 'ong3', mode: 'sweeper', speed: 56, chaseSpeed: 136, senseRadius: 110, coneLen: 116, phase: 0.8 }
        ];
        return specs.map(function (sp, idx) {
            var sl = FORMATION_SLOTS[sp.slotIdx];
            return {
                id: idx,
                slotIdx: sp.slotIdx,
                type: sp.type,
                mode: sp.mode,
                speed: sp.speed * speedMul,
                chaseSpeed: (sp.chaseSpeed + 38) * speedMul,
                maxChaseSpeed: (sp.chaseSpeed + 105) * speedMul,
                senseRadius: sp.senseRadius + 14,
                maxLeashDist: 215,
                maxChaseDuration: 2.9,
                vx: 0,
                vy: 0,
                wpX: sl.x,
                wpY: sl.y,
                flightPhase: 'cruise', // 'cruise' | 'hover' | 'burst'
                flightTimer: 0.4 + Math.random() * 1.1,
                speedFactor: 0.9 + Math.random() * 0.5,
                curveSign: (idx % 2 === 0) ? 1 : -1,
                sweepSpeed: (1.55 + (idx % 3) * 0.18) * speedMul,
                coneLen: sp.coneLen + 8,
                coneHalfAngle: half45,
                lookAngle: sl.baseLook,
                sleepCycle: 0.8,
                awakeDuration: 2.6,
                sleepDuration: 2.0,
                isSleeping: false,
                phase: sp.phase,
                coverCooldown: 0
            };
        });
    }

    function openHoneyMinigame(opts) {
        opts = opts || {};
        preloadAllAssets();
        closeHoneyMinigame();

        var st = ensureSaveMinigameState();
        var useTickets = !!opts.useTickets && st.honey >= TICKET_TARGET;
        var stageNum = st.honeyStage || 1;

        var root = document.createElement('div');
        root.id = 'honey-minigame-overlay';
        root.className = 'honey-mg-overlay';
        root.innerHTML =
            '<div class="honey-mg-backdrop"></div>' +
            '<div class="honey-mg-frame" id="honey-mg-frame">' +
                '<canvas id="honey-mg-canvas" class="honey-mg-canvas"></canvas>' +
                '<div class="honey-mg-topbar">' +
                    '<button type="button" class="honey-mg-exit-btn" id="btn-honey-mg-exit" title="Quay lại bàn chơi">✕ Thoát</button>' +
                    '<div class="honey-mg-hud-pill">' +
                        '<img src="' + SCENE_IMAGES_SRC.ticketIcon + '" alt="">' +
                        '<span id="honey-mg-stage-txt">' + (useTickets ? ('Tầng ' + stageNum) : 'Chơi Thử') + '</span>' +
                    '</div>' +
                '</div>' +
                '<div class="honey-mg-guide-banner" id="honey-mg-guide-banner">' +
                    'Chạm & kéo muỗng vượt qua đội hình đàn ong để tiến tới Tổ Mật!' +
                '</div>' +
                '<div class="honey-mg-result-layer" id="honey-mg-result-layer" style="display:none;"></div>' +
            '</div>';

        document.body.appendChild(root);

        var frameEl = root.querySelector('#honey-mg-frame');
        var canvas = root.querySelector('#honey-mg-canvas');
        var ctx = canvas.getContext('2d');
        var guideBannerEl = root.querySelector('#honey-mg-guide-banner');
        var resultLayerEl = root.querySelector('#honey-mg-result-layer');

        var state = {
            status: 'playing', // 'playing' | 'caught_anim' | 'caught_modal' | 'win_anim' | 'win_modal'
            elapsed: 0,
            lastTs: performance.now(),
            rafId: null,
            useTickets: useTickets,
            ticketsConsumed: false,
            reviveUsed: false,
            camouflageTimer: 0,
            shakeTimer: 0,
            shakeMag: 0,
            hasMovedOnce: false,
            rotationTimer: 3.8,
            hive: { x: 262, y: 157, hitY: 179, hitR: 32, bounce: 0 },
            spoon: {
                x: 250,
                y: 804,
                targetX: 250,
                targetY: 804,
                vx: 0,
                vy: 0,
                tilt: 0,
                headOffsetX: -16,
                headOffsetY: -30,
                headRadius: 10
            },
            drag: {
                active: false,
                pointerId: null,
                startPointerX: 0,
                startPointerY: 0,
                startSpoonX: 250,
                startSpoonY: 804
            },
            keys: {},
            bees: createStageBees(stageNum),
            fireflies: [],
            particles: [],
            floatingTexts: [],
            hiveDrips: [],
            orbitBees: [
                { angle: 0.2, speed: 2.0, rx: 48, ry: 16, yOff: -12, type: 'ong1', phase: 0.1 },
                { angle: 2.4, speed: -1.7, rx: 54, ry: 19, yOff: 6,  type: 'ong1', phase: 1.4 },
                { angle: 4.5, speed: 2.3, rx: 42, ry: 14, yOff: 20, type: 'ong3', phase: 2.7 }
            ],
            caughtByBee: null,
            suspicion: 0
        };

        // Khởi tạo đom đóm / hạt nắng lơ lửng trên đồng cỏ
        for (var fi = 0; fi < 22; fi++) {
            state.fireflies.push({
                x: Math.random() * W,
                y: 210 + Math.random() * (H - 260),
                r: 1.8 + Math.random() * 2.6,
                vx: (Math.random() - 0.5) * 14,
                vy: -6 - Math.random() * 12,
                phase: Math.random() * Math.PI * 2
            });
        }

        // Khởi tạo tọa độ & trạng thái đội hình ban đầu cho đàn ong
        state.bees.forEach(function (b) {
            var sl = FORMATION_SLOTS[b.slotIdx] || FORMATION_SLOTS[0];
            b.x = clamp(sl.x + (Math.random() - 0.5) * 44, 38, W - 38);
            b.y = clamp(sl.y + (Math.random() - 0.5) * 28, 224, 650);
            b.wpX = b.x;
            b.wpY = b.y;
            b.vx = 0;
            b.vy = 0;
            b.facing = (Math.cos(b.lookAngle) >= 0) ? 1 : -1;
            b.alertLevel = 0;
            b.aiState = 'patrol'; // 'patrol' | 'chase' | 'return'
            b.chaseTimer = 0;
            b.chaseCooldown = 0;
            b.coverCooldown = 0;
            b.zzzParticles = [];
            b.zzzSpawnAcc = 0;
        });

        function resizeCanvas() {
            if (!frameEl || !canvas) return;
            var rect = frameEl.getBoundingClientRect();
            var dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.max(1, Math.round(rect.width * dpr));
            canvas.height = Math.max(1, Math.round(rect.height * dpr));
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        function clientToLogical(clientX, clientY) {
            var rect = canvas.getBoundingClientRect();
            var sx = W / Math.max(1, rect.width);
            var sy = H / Math.max(1, rect.height);
            return {
                x: (clientX - rect.left) * sx,
                y: (clientY - rect.top) * sy
            };
        }

        function onPointerDown(e) {
            if (state.status !== 'playing') return;
            if (e.target && e.target.closest && e.target.closest('.honey-mg-topbar, .honey-mg-result-layer')) return;
            e.preventDefault();
            var pt = clientToLogical(e.clientX, e.clientY);
            state.drag.active = true;
            state.drag.pointerId = e.pointerId;
            state.drag.startPointerX = pt.x;
            state.drag.startPointerY = pt.y;
            state.drag.startSpoonX = state.spoon.x;
            state.drag.startSpoonY = state.spoon.y;

            if (!state.hasMovedOnce) {
                state.hasMovedOnce = true;
                if (guideBannerEl) guideBannerEl.classList.add('is-faded');
                if (state.useTickets && !state.ticketsConsumed) {
                    st.honey = Math.max(0, st.honey - TICKET_TARGET);
                    state.ticketsConsumed = true;
                    updateTicketHUD();
                    if (typeof saveGame === 'function') saveGame();
                }
            }
        }

        function onPointerMove(e) {
            if (!state.drag.active || e.pointerId !== state.drag.pointerId) return;
            if (state.status !== 'playing') return;
            e.preventDefault();
            var pt = clientToLogical(e.clientX, e.clientY);
            var dx = pt.x - state.drag.startPointerX;
            var dy = pt.y - state.drag.startPointerY;
            state.spoon.targetX = clamp(state.drag.startSpoonX + dx, 46, W - 46);
            state.spoon.targetY = clamp(state.drag.startSpoonY + dy, 135, H - 48);
        }

        function onPointerUp(e) {
            if (state.drag.active && e.pointerId === state.drag.pointerId) {
                state.drag.active = false;
                state.drag.pointerId = null;
            }
        }

        function onKeyDown(e) {
            state.keys[e.key] = true;
        }
        function onKeyUp(e) {
            state.keys[e.key] = false;
        }

        canvas.addEventListener('pointerdown', onPointerDown, { passive: false });
        window.addEventListener('pointermove', onPointerMove, { passive: false });
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointercancel', onPointerUp);
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);

        var exitBtn = root.querySelector('#btn-honey-mg-exit');
        if (exitBtn) {
            exitBtn.onclick = function () {
                if (typeof playSound === 'function') playSound('click');
                closeHoneyMinigame();
            };
        }

        function spawnBurst(x, y, colors, count, speedMax) {
            var n = count || 14;
            var spMax = speedMax || 150;
            for (var i = 0; i < n; i++) {
                var ang = Math.random() * Math.PI * 2;
                var sp = 35 + Math.random() * spMax;
                state.particles.push({
                    x: x,
                    y: y,
                    vx: Math.cos(ang) * sp,
                    vy: Math.sin(ang) * sp - 25,
                    r: 3 + Math.random() * 4.5,
                    life: 0,
                    maxLife: 0.42 + Math.random() * 0.35,
                    color: colors[i % colors.length]
                });
            }
        }

        function spawnFloatingText(x, y, text, color) {
            state.floatingTexts.push({
                x: x,
                y: y,
                text: text,
                color: color || '#fff8e1',
                life: 0,
                maxLife: 0.95
            });
        }

        function triggerCaught(bee) {
            if (state.status !== 'playing') return;
            state.status = 'caught_anim';
            state.drag.active = false;
            state.caughtByBee = bee;
            bee.alertLevel = 1;
            state.shakeTimer = 0.42;
            state.shakeMag = 9;
            if (typeof playSound === 'function') playSound('error');
            var hx = state.spoon.x + state.spoon.headOffsetX;
            var hy = state.spoon.y + state.spoon.headOffsetY;
            spawnBurst(hx, hy, ['#ff5252', '#ffab00', '#ffffff'], 18, 170);
            spawnFloatingText(bee.x, bee.y - 42, 'BỊ PHÁT HIỆN!', '#ff5252');

            setTimeout(function () {
                if (!activeSession || state.status !== 'caught_anim') return;
                state.status = 'caught_modal';
                showCaughtResultCard();
            }, 680);
        }

        function triggerWinHarvest() {
            if (state.status !== 'playing') return;
            state.status = 'win_anim';
            state.drag.active = false;
            state.hive.bounce = 1;
            if (typeof playSound === 'function') playSound('win');

            // Hút đầu muỗng vào đúng giọt mật tổ ong & nổ pháo hoa mật vàng rực rỡ
            state.spoon.targetX = state.hive.x - state.spoon.headOffsetX;
            state.spoon.targetY = state.hive.hitY - state.spoon.headOffsetY + 14;
            spawnBurst(state.hive.x, state.hive.hitY + 12, ['#ffd54f', '#ffb300', '#fff9c4', '#ffffff', '#ff8f00'], 36, 230);
            spawnFloatingText(state.hive.x, state.hive.hitY - 30, 'LẤY ĐƯỢC MẬT ONG RỒI!', '#ffd54f');

            setTimeout(function () {
                if (!activeSession || state.status !== 'win_anim') return;
                state.status = 'win_modal';
                showWinResultCard();
            }, 820);
        }

        function showCaughtResultCard() {
            if (!resultLayerEl) return;
            var canRevive = !state.reviveUsed && typeof simulateWatchAd === 'function';
            var reviveBtnHtml = canRevive
                ? '<button class="modal-btn primary kw-wide-action-btn" id="btn-honey-revive">Xem Ads Ngụy Trang Tiếp (2.8s)</button>'
                : '';

            resultLayerEl.style.display = 'flex';
            resultLayerEl.innerHTML =
                '<div class="honey-result-card">' +
                    '<div class="honey-result-ribbon is-danger">ĐÀN ONG PHÁT HIỆN!</div>' +
                    '<div class="honey-result-sub">' +
                        (canRevive
                            ? 'Suýt nữa là chạm tới tổ mật rồi! Bạn có muốn ngụy trang dưới tán lá để đi tiếp ngay tại chỗ không?'
                            : 'Đàn ong canh gác gắt quá! Hãy thử khéo léo lách qua lúc ong quay đi nhé!') +
                    '</div>' +
                    '<div class="honey-result-actions">' +
                        reviveBtnHtml +
                        '<button class="modal-btn gem-btn kw-wide-action-btn" id="btn-honey-retry">Thử Lại Từ Đầu</button>' +
                        '<button class="kw-subtle-link-btn" id="btn-honey-quit" type="button">Quay về bàn chơi</button>' +
                    '</div>' +
                '</div>';

            if (typeof enhanceAll3sButtons === 'function') enhanceAll3sButtons(resultLayerEl);

            var revBtn = resultLayerEl.querySelector('#btn-honey-revive');
            if (revBtn) {
                revBtn.onclick = function () {
                    simulateWatchAd('Ngụy Trang Lá Rừng Đi Tiếp (2.8s Bất Tử)', function () {
                        if (!activeSession) return;
                        state.reviveUsed = true;
                        state.camouflageTimer = 2.8;
                        state.suspicion = 0;
                        state.bees.forEach(function (b) {
                            b.alertLevel = 0;
                            b.aiState = 'return';
                            b.chaseTimer = 0;
                            b.chaseCooldown = 1.8;
                        });
                        state.caughtByBee = null;
                        resultLayerEl.style.display = 'none';
                        state.status = 'playing';
                        state.lastTs = performance.now();
                        spawnFloatingText(state.spoon.x, state.spoon.y - 45, 'NGỤY TRANG 2.8s!', '#69f0ae');
                    });
                };
            }

            var retryBtn = resultLayerEl.querySelector('#btn-honey-retry');
            if (retryBtn) {
                retryBtn.onclick = function () {
                    if (typeof playSound === 'function') playSound('click');
                    resetRunInPlace();
                };
            }

            var quitBtn = resultLayerEl.querySelector('#btn-honey-quit');
            if (quitBtn) {
                quitBtn.onclick = function () {
                    if (typeof playSound === 'function') playSound('click');
                    closeHoneyMinigame();
                };
            }
        }

        function grantHoneyRewards(multiplier) {
            var mul = multiplier || 1;
            var energyGain = 35 * mul;
            var goldGain = 800 * mul;
            var gemGain = 3 * mul;

            if (typeof playerEnergy !== 'undefined') {
                var eCap = (typeof getEnergyOverflowCap === 'function') ? getEnergyOverflowCap() : 999;
                playerEnergy = Math.min(eCap, playerEnergy + energyGain);
                if (typeof SAVE !== 'undefined' && SAVE) SAVE.energy = playerEnergy;
            }
            if (typeof playerCoins !== 'undefined') {
                playerCoins += goldGain;
                if (typeof SAVE !== 'undefined' && SAVE) SAVE.coins = playerCoins;
            }
            if (typeof playerGems !== 'undefined') {
                playerGems += gemGain;
                if (typeof SAVE !== 'undefined' && SAVE) SAVE.gems = playerGems;
            }

            if (state.useTickets) {
                st.honeyStage = (st.honeyStage || 1) + 1;
            }
            if (typeof updateUIStats === 'function') updateUIStats();
            if (typeof saveGame === 'function') saveGame();

            closeHoneyMinigame();

            var anchorEl = document.getElementById('btn-minigame-entry') || document.body;
            if (typeof spawnFlyingCurrency === 'function') {
                spawnFlyingCurrency(anchorEl, 'energy', energyGain);
                spawnFlyingCurrency(anchorEl, 'gold', Math.min(90, goldGain));
                spawnFlyingCurrency(anchorEl, 'ruby', gemGain);
            }
            if (typeof showToast === 'function') {
                showToast('Thu hoạch Mật Ong: +' + energyGain + '⚡, +' + goldGain.toLocaleString('vi-VN') + ' Vàng, +' + gemGain + ' Kim cương!');
            }
        }

        function showWinResultCard() {
            if (!resultLayerEl) return;
            var baseEnergy = 35;
            var baseGold = 800;
            var baseGem = 3;

            resultLayerEl.style.display = 'flex';
            resultLayerEl.innerHTML =
                '<div class="honey-result-card is-win">' +
                    '<div class="honey-result-ribbon is-win">THU HOẠCH MẬT THÀNH CÔNG!</div>' +
                    '<img src="' + SCENE_IMAGES_SRC.hive + '" class="honey-win-hive-img" alt="Tổ Mật">' +
                    '<div class="honey-result-sub">Tuyệt đỉnh! Bạn đã khéo léo vượt qua đội hình đàn ong và lấy trọn mật vàng óng!</div>' +
                    '<div class="honey-win-rewards">' +
                        '<div class="honey-win-rw-chip"><img src="assets/images_webp/ui/icon_nangluong.webp" alt=""><span>+' + baseEnergy + '</span></div>' +
                        '<div class="honey-win-rw-chip"><img src="assets/images_webp/ui/icon_glod.webp" alt=""><span>+' + baseGold.toLocaleString('vi-VN') + '</span></div>' +
                        '<div class="honey-win-rw-chip"><img src="assets/images_webp/ui/icon_ruby.webp" alt=""><span>+' + baseGem + '</span></div>' +
                    '</div>' +
                    '<div class="honey-result-actions">' +
                        (typeof simulateWatchAd === 'function'
                            ? '<button class="modal-btn gem-btn kw-wide-action-btn" id="btn-honey-claim-x2">Xem Ads Nhận Nhân Đôi (×2)</button>'
                            : '') +
                        '<button class="modal-btn primary kw-wide-action-btn" id="btn-honey-claim-normal">Nhận Thưởng</button>' +
                    '</div>' +
                '</div>';

            if (typeof enhanceAll3sButtons === 'function') enhanceAll3sButtons(resultLayerEl);

            var btnNormal = resultLayerEl.querySelector('#btn-honey-claim-normal');
            if (btnNormal) {
                btnNormal.onclick = function () {
                    if (typeof playSound === 'function') playSound('win');
                    grantHoneyRewards(1);
                };
            }

            var btnX2 = resultLayerEl.querySelector('#btn-honey-claim-x2');
            if (btnX2) {
                btnX2.onclick = function () {
                    simulateWatchAd('Nhân Đôi Mật Ong Rừng (×2 Toàn Bộ Quà)', function () {
                        if (typeof playSound === 'function') playSound('win');
                        grantHoneyRewards(2);
                    });
                };
            }
        }

        function resetRunInPlace() {
            state.status = 'playing';
            state.spoon.x = 250;
            state.spoon.y = 804;
            state.spoon.targetX = 250;
            state.spoon.targetY = 804;
            state.spoon.tilt = 0;
            state.suspicion = 0;
            state.camouflageTimer = 0;
            state.rotationTimer = 4.5;
            state.caughtByBee = null;
            state.bees = createStageBees(stageNum);
            state.bees.forEach(function (b) {
                var sl = FORMATION_SLOTS[b.slotIdx] || FORMATION_SLOTS[0];
                b.x = clamp(sl.x + (Math.random() - 0.5) * 44, 38, W - 38);
                b.y = clamp(sl.y + (Math.random() - 0.5) * 28, 224, 650);
                b.wpX = b.x;
                b.wpY = b.y;
                b.vx = 0;
                b.vy = 0;
                b.facing = (Math.cos(b.lookAngle) >= 0) ? 1 : -1;
                b.alertLevel = 0;
                b.aiState = 'patrol';
                b.chaseTimer = 0;
                b.chaseCooldown = 0;
                b.coverCooldown = 0;
                b.zzzParticles = [];
                b.zzzSpawnAcc = 0;
            });
            if (resultLayerEl) resultLayerEl.style.display = 'none';
            state.lastTs = performance.now();
        }

        // =====================================================================
        // CẬP NHẬT VẬT LÝ, TRÍ TUỆ ĐÀN ONG & VA CHẠM MỖI FRAME (60FPS)
        // =====================================================================
        function update(dt) {
            state.elapsed += dt;
            if (state.shakeTimer > 0) {
                state.shakeTimer = Math.max(0, state.shakeTimer - dt);
            }
            if (state.hive.bounce > 0) {
                state.hive.bounce = Math.max(0, state.hive.bounce - dt * 2.2);
            }
            if (state.camouflageTimer > 0) {
                state.camouflageTimer = Math.max(0, state.camouflageTimer - dt);
            }

            // Hỗ trợ phím mũi tên / WASD khi test trên máy tính
            if (state.status === 'playing') {
                var kbSpeed = 360 * dt;
                if (state.keys.ArrowLeft || state.keys.a || state.keys.A) state.spoon.targetX -= kbSpeed;
                if (state.keys.ArrowRight || state.keys.d || state.keys.D) state.spoon.targetX += kbSpeed;
                if (state.keys.ArrowUp || state.keys.w || state.keys.W) state.spoon.targetY -= kbSpeed;
                if (state.keys.ArrowDown || state.keys.s || state.keys.S) state.spoon.targetY += kbSpeed;
                state.spoon.targetX = clamp(state.spoon.targetX, 46, W - 46);
                state.spoon.targetY = clamp(state.spoon.targetY, 135, H - 48);
            }

            // Di chuyển muỗng mật mượt mà với tốc độ tối đa 450 px/s
            var prevX = state.spoon.x;
            var prevY = state.spoon.y;
            var toTx = state.spoon.targetX - state.spoon.x;
            var toTy = state.spoon.targetY - state.spoon.y;
            var toDist = Math.hypot(toTx, toTy);
            if (toDist > 0.2) {
                var maxSpoonStep = (state.status === 'playing' ? 450 : 560) * dt;
                var desiredStep = Math.min(toDist, toDist * Math.min(1, dt * 18), maxSpoonStep);
                state.spoon.x += (toTx / toDist) * desiredStep;
                state.spoon.y += (toTy / toDist) * desiredStep;
            }
            var vxSpoon = (state.spoon.x - prevX) / Math.max(0.001, dt);
            var vySpoon = (state.spoon.y - prevY) / Math.max(0.001, dt);
            var spoonSpeedNow = Math.hypot(vxSpoon, vySpoon);
            var targetTilt = clamp(vxSpoon * 0.0011, -0.30, 0.30);
            state.spoon.tilt += (targetTilt - state.spoon.tilt) * Math.min(1, dt * 12);

            // Hạt bụi sáng nhẹ bay ra khi kéo muỗng di chuyển
            if (state.status === 'playing' && Math.hypot(vxSpoon, vySpoon) > 45 && Math.random() < 0.45) {
                state.particles.push({
                    x: state.spoon.x + state.spoon.headOffsetX + (Math.random() - 0.5) * 12,
                    y: state.spoon.y + state.spoon.headOffsetY + (Math.random() - 0.5) * 12,
                    vx: (Math.random() - 0.5) * 20,
                    vy: 14 + Math.random() * 18,
                    r: 2.2 + Math.random() * 2.4,
                    life: 0,
                    maxLife: 0.35,
                    color: '#fff59d'
                });
            }

            // Giọt mật nhỏ tự nhiên rơi từ Tổ Ong
            if (Math.random() < dt * 0.85) {
                state.hiveDrips.push({
                    x: state.hive.x + (Math.random() - 0.5) * 8,
                    y: state.hive.y + 42,
                    vy: 28,
                    life: 0,
                    maxLife: 1.05
                });
            }
            for (var di = state.hiveDrips.length - 1; di >= 0; di--) {
                var dr = state.hiveDrips[di];
                dr.life += dt;
                dr.vy += 155 * dt;
                dr.y += dr.vy * dt;
                if (dr.life >= dr.maxLife) state.hiveDrips.splice(di, 1);
            }

            // Đom đóm đồng cỏ
            state.fireflies.forEach(function (f) {
                f.x += f.vx * dt;
                f.y += f.vy * dt;
                if (f.x < -10) f.x = W + 10;
                if (f.x > W + 10) f.x = -10;
                if (f.y < 190) f.y = H - 70;
            });

            // Ong nhỏ bay vòng quanh Tổ Ong
            state.orbitBees.forEach(function (ob) {
                ob.angle += ob.speed * dt;
            });

            // Hạt nổ & chữ bay
            for (var pi = state.particles.length - 1; pi >= 0; pi--) {
                var p = state.particles[pi];
                p.life += dt;
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.vy += 190 * dt;
                if (p.life >= p.maxLife) state.particles.splice(pi, 1);
            }
            for (var ti = state.floatingTexts.length - 1; ti >= 0; ti--) {
                var ft = state.floatingTexts[ti];
                ft.life += dt;
                ft.y -= 34 * dt;
                if (ft.life >= ft.maxLife) state.floatingTexts.splice(ti, 1);
            }

            // Tọa độ tâm đầu muỗng mật (vùng nhận mật & xét va chạm chuẩn xác)
            var headX = state.spoon.x + state.spoon.headOffsetX;
            var headY = state.spoon.y + state.spoon.headOffsetY;

            // Hàm điều phối bọc lót: khi 1 con ong rời vị trí (đuổi theo muỗng), gọi đồng đội gần nhất bay vào thế chỗ!
            function assignCoverForBee(leavingBee) {
                if (leavingBee.coverCooldown > 0) return;
                var vacatedSlot = FORMATION_SLOTS[leavingBee.slotIdx];
                if (!vacatedSlot) return;
                var bestMate = null;
                var bestDist = Infinity;
                for (var mi = 0; mi < state.bees.length; mi++) {
                    var mate = state.bees[mi];
                    if (mate === leavingBee) continue;
                    if (mate.aiState !== 'patrol' || mate.isSleeping || mate.coverCooldown > 0) continue;
                    var d = Math.hypot(mate.x - vacatedSlot.x, mate.y - vacatedSlot.y);
                    if (d < bestDist) {
                        bestDist = d;
                        bestMate = mate;
                    }
                }
                if (bestMate) {
                    var tmpSlot = leavingBee.slotIdx;
                    leavingBee.slotIdx = bestMate.slotIdx;
                    bestMate.slotIdx = tmpSlot;
                    leavingBee.coverCooldown = 2.6;
                    bestMate.coverCooldown = 2.6;
                }
            }

            // Hoán đổi vị trí định kỳ giữa các cầu thủ ong đang tuần tra để đội hình luôn linh hoạt không hở khoảng trống
            if (state.status === 'playing') {
                state.rotationTimer -= dt;
                if (state.rotationTimer <= 0) {
                    state.rotationTimer = 4.2 + Math.random() * 1.6;
                    var readyBees = state.bees.filter(function (mb) {
                        return mb.aiState === 'patrol' && !mb.isSleeping && mb.coverCooldown <= 0;
                    });
                    if (readyBees.length >= 2) {
                        var pickA = readyBees[Math.floor(Math.random() * readyBees.length)];
                        var slotA = FORMATION_SLOTS[pickA.slotIdx];
                        var nearestB = null;
                        var minD = Infinity;
                        for (var ri = 0; ri < readyBees.length; ri++) {
                            var cand = readyBees[ri];
                            if (cand === pickA) continue;
                            var slotB = FORMATION_SLOTS[cand.slotIdx];
                            var distAB = Math.hypot(slotA.x - slotB.x, slotA.y - slotB.y);
                            if (distAB < minD) {
                                minD = distAB;
                                nearestB = cand;
                            }
                        }
                        if (nearestB) {
                            var swapIdx = pickA.slotIdx;
                            pickA.slotIdx = nearestB.slotIdx;
                            nearestB.slotIdx = swapIdx;
                            pickA.coverCooldown = 3.0;
                            nearestB.coverCooldown = 3.0;
                        }
                    }
                }
            }

            // Chọn điểm bay ngẫu nhiên tự nhiên trong phạm vi khu vực đội hình của con ong
            function pickOrganicWaypoint(bee, slotObj) {
                var spreadX = Math.max(66, slotObj.patrolDx * 1.9);
                var spreadY = Math.max(46, slotObj.patrolDy * 2.8);
                var ang = Math.random() * Math.PI * 2;
                var rad = 0.35 + Math.random() * 0.65;
                bee.wpX = clamp(slotObj.x + Math.cos(ang) * spreadX * rad, 34, W - 34);
                bee.wpY = clamp(slotObj.y + Math.sin(ang) * spreadY * rad, 218, 668);
                bee.curveSign = (Math.random() < 0.5) ? 1 : -1;
            }

            // Cập nhật từng con ong (Bay tự nhiên có gia tốc & đột ngột tăng tốc + đội hình 4-3-3 bọc lót + đuổi đón đầu)
            var maxFrameDanger = 0;
            var dangerBee = null;
            var spoonInSafeBush = (headY > 710);

            for (var bi = 0; bi < state.bees.length; bi++) {
                var b = state.bees[bi];
                var slot = FORMATION_SLOTS[b.slotIdx] || FORMATION_SLOTS[0];
                var hoverY = Math.sin(state.elapsed * 6.8 + b.phase) * 3.8;

                if (b.chaseCooldown > 0) b.chaseCooldown = Math.max(0, b.chaseCooldown - dt);
                if (b.coverCooldown > 0) b.coverCooldown = Math.max(0, b.coverCooldown - dt);

                // Cập nhật chu kỳ ngủ Zzz cho Ong Ngái Ngủ (chỉ khi không đang đuổi theo)
                if (b.mode === 'sleeper') {
                    if (b.aiState !== 'chase') {
                        b.sleepCycle += dt;
                        var totalCyc = b.awakeDuration + b.sleepDuration;
                        var cycPos = b.sleepCycle % totalCyc;
                        b.isSleeping = (cycPos >= b.awakeDuration);
                    } else {
                        b.isSleeping = false;
                    }
                    if (b.isSleeping) {
                        b.zzzSpawnAcc += dt;
                        if (b.zzzSpawnAcc >= 0.55) {
                            b.zzzSpawnAcc = 0;
                            b.zzzParticles.push({ x: b.x + (b.facing * 9), y: b.y - 13, life: 0, maxLife: 1.1 });
                        }
                    }
                }

                if (state.status === 'caught_anim' && state.caughtByBee === b) {
                    b.x += (headX - b.x) * Math.min(1, dt * 6);
                    b.y += (headY - b.y) * Math.min(1, dt * 6);
                } else if (state.status === 'playing' && b.aiState === 'chase') {
                    // ĐANG ĐUỔI THEO CÓ GIA TỐC & ĐÓN ĐẦU HƯỚNG CHẠY CỦA MUỖNG!
                    b.chaseTimer += dt;
                    var leadX = clamp(headX + vxSpoon * 0.16, 36, W - 36);
                    var leadY = clamp(headY + vySpoon * 0.16, 170, 705);
                    var chaseDx = leadX - b.x;
                    var chaseDy = leadY - b.y;
                    var chaseDist = Math.max(1, Math.hypot(chaseDx, chaseDy));
                    var rawSpoonDist = Math.hypot(headX - b.x, headY - b.y);
                    var distFromSlot = Math.hypot(b.x - slot.x, b.y - slot.y);

                    var lostAggro = spoonInSafeBush ||
                        state.camouflageTimer > 0 ||
                        rawSpoonDist > (b.coneLen || 110) * 1.45 ||
                        distFromSlot > (b.maxLeashDist || 215) ||
                        b.chaseTimer >= (b.maxChaseDuration || 2.9);

                    if (lostAggro) {
                        b.aiState = 'return';
                        b.chaseTimer = 0;
                        b.chaseCooldown = 1.35;
                        b.alertLevel = Math.min(b.alertLevel, 0.35);
                        pickOrganicWaypoint(b, slot);
                    } else {
                        // Tăng tốc dần theo thời gian rượt đuổi (gia tốc mạnh lên tới maxChaseSpeed)
                        var ramp = clamp(b.chaseTimer / 0.85, 0, 1);
                        var targetSpd = b.chaseSpeed + (b.maxChaseSpeed - b.chaseSpeed) * ramp;
                        var desVx = (chaseDx / chaseDist) * targetSpd;
                        var desVy = (chaseDy / chaseDist) * targetSpd;
                        var chaseAccel = Math.min(1, dt * 6.5);
                        b.vx += (desVx - b.vx) * chaseAccel;
                        b.vy += (desVy - b.vy) * chaseAccel;
                        b.x = clamp(b.x + b.vx * dt, 26, W - 26);
                        b.y = clamp(b.y + b.vy * dt + Math.cos(state.elapsed * 12 + b.phase) * 0.4, 185, 705);

                        var angChase = Math.atan2(headY - b.y, headX - b.x);
                        b.lookAngle = lerpAngle(b.lookAngle, angChase, Math.min(1, dt * 12));
                        b.facing = (Math.cos(b.lookAngle) >= 0) ? 1 : -1;
                    }
                } else if (state.status === 'playing' && b.aiState === 'return') {
                    // BAY QUAY VỀ VỊ TRÍ ĐỘI HÌNH MỚI VỚI QUÁN TÍNH MƯỢT
                    var retDx = slot.x - b.x;
                    var retDy = slot.y - b.y;
                    var retDist = Math.hypot(retDx, retDy);
                    if (retDist <= 28) {
                        b.aiState = 'patrol';
                        pickOrganicWaypoint(b, slot);
                    } else {
                        var rSpd = Math.max(105, b.speed * 1.75);
                        var rDesVx = (retDx / retDist) * rSpd;
                        var rDesVy = (retDy / retDist) * rSpd;
                        b.vx += (rDesVx - b.vx) * Math.min(1, dt * 4.8);
                        b.vy += (rDesVy - b.vy) * Math.min(1, dt * 4.8);
                        b.x = clamp(b.x + b.vx * dt, 28, W - 28);
                        b.y = clamp(b.y + b.vy * dt, 200, 680);
                        var angRet = Math.atan2(b.vy, b.vx);
                        b.lookAngle = lerpAngle(b.lookAngle, angRet, Math.min(1, dt * 8));
                        b.facing = (Math.cos(b.lookAngle) >= 0) ? 1 : -1;
                    }
                } else {
                    // BAY TỰ NHIÊN KHÔNG THEO QUY LUẬT: THAY ĐỔI TỐC ĐỘ, LƠ LỬNG, VỌT TĂNG TỐC & LƯỢN CONG
                    b.flightTimer -= dt;
                    var distToWp = Math.hypot(b.wpX - b.x, b.wpY - b.y);
                    var distFromHome = Math.hypot(slot.x - b.x, slot.y - b.y);

                    if (b.isSleeping) {
                        // Đang ngủ Zzz: giảm dần vận tốc về lơ lửng tại chỗ
                        b.vx *= Math.max(0, 1 - dt * 4.5);
                        b.vy *= Math.max(0, 1 - dt * 4.5);
                        b.x = clamp(b.x + b.vx * dt, 28, W - 28);
                        b.y = clamp(b.y + b.vy * dt + hoverY * dt * 2.5, 205, 675);
                    } else {
                        if (distFromHome > 135) {
                            // Bọc lót / hoán đổi sang ô đội hình mới: tăng tốc bay sang thế chỗ!
                            b.flightPhase = 'burst';
                            b.wpX = slot.x + (Math.random() - 0.5) * 32;
                            b.wpY = slot.y + (Math.random() - 0.5) * 24;
                            b.flightTimer = 0.65;
                            b.speedFactor = 1.95;
                        } else if (b.flightTimer <= 0 || distToWp < 18) {
                            // Chuyển pha bay ngẫu nhiên: lơ lửng quan sát / bay lượn / bất ngờ vọt tăng tốc!
                            var roll = Math.random();
                            if (roll < 0.22) {
                                b.flightPhase = 'hover';
                                b.flightTimer = 0.25 + Math.random() * 0.55;
                                b.speedFactor = 0.15;
                            } else if (roll < 0.56) {
                                b.flightPhase = 'burst';
                                b.flightTimer = 0.55 + Math.random() * 0.75;
                                b.speedFactor = 1.75 + Math.random() * 0.65;
                                pickOrganicWaypoint(b, slot);
                            } else {
                                b.flightPhase = 'cruise';
                                b.flightTimer = 0.85 + Math.random() * 1.15;
                                b.speedFactor = 0.75 + Math.random() * 0.65;
                                pickOrganicWaypoint(b, slot);
                            }
                        }

                        var toWpX = b.wpX - b.x;
                        var toWpY = b.wpY - b.y;
                        var wpDist = Math.max(1, Math.hypot(toWpX, toWpY));
                        var desiredSpeed = b.speed * b.speedFactor;

                        // Cộng thêm lực lượn cong ngang (curve) để đường bay mềm mại tự nhiên như ong thật
                        var nx = toWpX / wpDist;
                        var ny = toWpY / wpDist;
                        var curveStr = (b.flightPhase === 'hover') ? 0 : (0.34 * b.curveSign * Math.sin(state.elapsed * 3.1 + b.phase));
                        var steerX = nx - ny * curveStr;
                        var steerY = ny + nx * curveStr;
                        var steerLen = Math.max(0.001, Math.hypot(steerX, steerY));

                        var targetVx = (steerX / steerLen) * desiredSpeed;
                        var targetVy = (steerY / steerLen) * desiredSpeed;
                        var accelRate = (b.flightPhase === 'burst') ? 5.6 : (b.flightPhase === 'hover' ? 4.2 : 3.2);
                        b.vx += (targetVx - b.vx) * Math.min(1, dt * accelRate);
                        b.vy += (targetVy - b.vy) * Math.min(1, dt * accelRate);

                        b.x = clamp(b.x + b.vx * dt, 28, W - 28);
                        b.y = clamp(b.y + b.vy * dt + hoverY * dt * 2.2, 205, 675);

                        // Hướng nhìn kết hợp giữa hướng bay thực tế & đảo mắt quét về phía sân dưới
                        var curSpd = Math.hypot(b.vx, b.vy);
                        var targetLook;
                        if (b.flightPhase === 'burst' && curSpd > 65) {
                            targetLook = Math.atan2(b.vy + 18, b.vx);
                        } else {
                            var sweepLook = slot.baseLook + Math.sin(state.elapsed * b.sweepSpeed + b.phase) * (slot.sweepAmp + 0.14);
                            targetLook = (curSpd > 32)
                                ? lerpAngle(sweepLook, Math.atan2(b.vy + 22, b.vx), 0.45)
                                : sweepLook;
                        }
                        b.lookAngle = lerpAngle(b.lookAngle, targetLook, Math.min(1, dt * 7.5));
                        b.facing = (Math.cos(b.lookAngle) >= 0) ? 1 : -1;
                    }
                }

                for (var zi = b.zzzParticles.length - 1; zi >= 0; zi--) {
                    var zp = b.zzzParticles[zi];
                    zp.life += dt;
                    zp.y -= 20 * dt;
                    zp.x += Math.sin(zp.life * 5) * 8 * dt;
                    if (zp.life >= zp.maxLife) b.zzzParticles.splice(zi, 1);
                }

                // Hạt phấn bay sau đuôi ong (bay dày hơn khi vọt tăng tốc hoặc rượt đuổi)
                if (Math.random() < dt * (b.aiState === 'chase' || b.flightPhase === 'burst' ? 11 : 5.5)) {
                    state.particles.push({
                        x: b.x - b.facing * 13,
                        y: b.y + 3 + (Math.random() - 0.5) * 6,
                        vx: -b.facing * (b.aiState === 'chase' ? 28 : 15),
                        vy: (Math.random() - 0.5) * 12,
                        r: 1.6 + Math.random() * 1.4,
                        life: 0,
                        maxLife: 0.32,
                        color: b.aiState === 'chase' ? 'rgba(255, 171, 64, 0.88)' : 'rgba(255, 241, 118, 0.85)'
                    });
                }

                // Xét phát hiện, kích hoạt truy đuổi, báo động đồng đội bọc lót & va chạm với đầu muỗng
                if (state.status === 'playing' && state.camouflageTimer <= 0 && state.hasMovedOnce) {
                    var effType = (b.type === 'ong2' && !b.isSleeping) ? 'ong1' : b.type;
                    var cfg = BEE_SPRITE_CONFIG[effType] || BEE_SPRITE_CONFIG.ong1;

                    // 1. Chạm trực tiếp vào người con ong -> bị chích ngay lập tức!
                    var bodyDist = Math.hypot(headX - b.x, headY - b.y);
                    if (bodyDist < cfg.bodyRadius + state.spoon.headRadius * 0.78) {
                        triggerCaught(b);
                        return;
                    }

                    // 2. Kiểm tra vùng sóng ra-đa phía trước mặt ong
                    var effConeLen = b.isSleeping ? (b.coneLen * 0.28) : b.coneLen;
                    var effHalfAng = b.isSleeping ? (b.coneHalfAngle * 0.52) : b.coneHalfAngle;
                    var eyeX = b.x + b.facing * 9;
                    var eyeY = b.y + 3;
                    var toHeadX = headX - eyeX;
                    var toHeadY = headY - eyeY;
                    var coneDist = Math.hypot(toHeadX, toHeadY);

                    var inCone = false;
                    var coneIntensity = 0;
                    if (coneDist <= effConeLen + state.spoon.headRadius * 0.38 && coneDist > 4) {
                        var angToHead = Math.atan2(toHeadY, toHeadX);
                        var angDiff = Math.abs(normalizeAngleDiff(angToHead, b.lookAngle));
                        if (angDiff <= effHalfAng) {
                            inCone = true;
                            var depthRatio = 1 - (coneDist / (effConeLen + 8));
                            var centerRatio = 1 - (angDiff / effHalfAng);
                            coneIntensity = (depthRatio > 0.28 && centerRatio > 0.30) ? 3.4 : 1.85;
                        }
                    }

                    // 3. Ong CHỈ phát hiện và đuổi theo khi muỗng lọt đúng vào phạm vi sóng ra-đa nó phát ra!
                    if (b.aiState === 'patrol' && b.chaseCooldown <= 0 && !b.isSleeping && !spoonInSafeBush && inCone) {
                        b.aiState = 'chase';
                        b.chaseTimer = 0;
                        b.alertLevel = Math.max(b.alertLevel, 0.45);
                        assignCoverForBee(b);
                        // Báo động nhẹ cho 1 đồng đội gần đó quay đầu & tăng tốc áp sát khu vực
                        for (var ai = 0; ai < state.bees.length; ai++) {
                            var ally = state.bees[ai];
                            if (ally !== b && ally.aiState === 'patrol' && !ally.isSleeping && Math.hypot(ally.x - b.x, ally.y - b.y) < 155) {
                                ally.flightPhase = 'burst';
                                ally.flightTimer = 0.7;
                                ally.speedFactor = 1.85;
                                ally.wpX = clamp((ally.x + headX) * 0.5, 34, W - 34);
                                ally.wpY = clamp((ally.y + headY) * 0.5, 215, 665);
                                break;
                            }
                        }
                        if (typeof playSound === 'function') playSound('click');
                    }

                    if (inCone) {
                        if (coneIntensity > maxFrameDanger) {
                            maxFrameDanger = coneIntensity;
                            dangerBee = b;
                        }
                        b.alertLevel = Math.min(1, b.alertLevel + dt * coneIntensity);
                    } else if (b.aiState === 'chase') {
                        b.alertLevel = Math.max(0.45, b.alertLevel - dt * 1.1);
                    } else {
                        b.alertLevel = Math.max(0, b.alertLevel - dt * 2.8);
                    }
                } else if (state.status === 'playing') {
                    b.alertLevel = Math.max(0, b.alertLevel - dt * 4);
                }
            }

            if (state.status === 'playing') {
                if (maxFrameDanger > 0 && dangerBee) {
                    state.suspicion = Math.min(1, state.suspicion + dt * maxFrameDanger);
                    if (state.suspicion >= 1 || dangerBee.alertLevel >= 1) {
                        triggerCaught(dangerBee);
                        return;
                    }
                } else {
                    state.suspicion = Math.max(0, state.suspicion - dt * 2.4);
                }

                // Kiểm tra chạm Tổ Mật Ong trên cành cây -> CHIẾN THẮNG!
                var distToHive = Math.hypot(headX - state.hive.x, headY - state.hive.hitY);
                if (distToHive <= state.hive.hitR + state.spoon.headRadius) {
                    triggerWinHarvest();
                }
            }
        }

        // =====================================================================
        // RENDER ĐỒ HỌA ĐA LỚP 60FPS
        // =====================================================================
        function render() {
            var cw = canvas.width;
            var ch = canvas.height;
            ctx.save();
            ctx.clearRect(0, 0, cw, ch);

            var scaleX = cw / W;
            var scaleY = ch / H;
            ctx.scale(scaleX, scaleY);

            // Rung màn hình khi bị phát hiện
            if (state.shakeTimer > 0) {
                var sAmt = state.shakeMag * (state.shakeTimer / 0.42);
                ctx.translate((Math.random() - 0.5) * sAmt * 2, (Math.random() - 0.5) * sAmt * 2);
            }

            // 1. NỀN ĐỒNG CỎ (bg_matong.jpg)
            var bgIm = loadImg(SCENE_IMAGES_SRC.bg);
            if (bgIm && bgIm.complete && bgIm.naturalWidth) {
                ctx.drawImage(bgIm, 0, 0, W, H);
            } else {
                var skyG = ctx.createLinearGradient(0, 0, 0, H);
                skyG.addColorStop(0, '#b3e5fc');
                skyG.addColorStop(0.28, '#aed581');
                skyG.addColorStop(1, '#558b2f');
                ctx.fillStyle = skyG;
                ctx.fillRect(0, 0, W, H);
            }

            // Đom đóm nắng vàng lơ lửng
            state.fireflies.forEach(function (f) {
                var alpha = 0.35 + 0.55 * (0.5 + 0.5 * Math.sin(state.elapsed * 3.2 + f.phase));
                ctx.fillStyle = 'rgba(255, 245, 157, ' + alpha.toFixed(2) + ')';
                ctx.beginPath();
                ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
                ctx.fill();
            });

            // 2. CÀNH CÂY LỚN & TỔ ONG MẬT (caylon.png + toong.png)
            var branchIm = loadImg(SCENE_IMAGES_SRC.branch);
            var hiveIm = loadImg(SCENE_IMAGES_SRC.hive);
            var branchSway = Math.sin(state.elapsed * 1.4) * 0.009;

            // Vòng sáng mục tiêu dưới Tổ Ong mời gọi người chơi kéo muỗng tới
            var headX = state.spoon.x + state.spoon.headOffsetX;
            var headY = state.spoon.y + state.spoon.headOffsetY;
            var distHive = Math.hypot(headX - state.hive.x, headY - state.hive.hitY);
            var hiveGlowBoost = clamp(1 - (distHive - 70) / 220, 0.25, 1);

            ctx.save();
            var hHalo = ctx.createRadialGradient(state.hive.x, state.hive.hitY, 8, state.hive.x, state.hive.hitY, 66);
            hHalo.addColorStop(0, 'rgba(255, 238, 88, ' + (0.45 * hiveGlowBoost).toFixed(2) + ')');
            hHalo.addColorStop(1, 'rgba(255, 193, 7, 0)');
            ctx.fillStyle = hHalo;
            ctx.beginPath();
            ctx.arc(state.hive.x, state.hive.hitY, 66, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Giọt mật nhỏ rơi từ tổ ong
            state.hiveDrips.forEach(function (dr) {
                var a = Math.max(0, 1 - dr.life / dr.maxLife);
                ctx.fillStyle = 'rgba(255, 193, 7, ' + a.toFixed(2) + ')';
                ctx.beginPath();
                ctx.ellipse(dr.x, dr.y, 2.8, 4.2, 0, 0, Math.PI * 2);
                ctx.fill();
            });

            // Tổ ong đung đưa nhẹ dưới cành cây (thu nhỏ còn 60% và hạ vừa đúng để cuống tổ chạm khít cành cây)
            if (hiveIm && hiveIm.complete && hiveIm.naturalWidth) {
                ctx.save();
                ctx.translate(state.hive.x, 103);
                var hiveSwing = Math.sin(state.elapsed * 2.1) * 0.038;
                var bounceScale = 1 + Math.sin(state.hive.bounce * Math.PI * 3) * 0.14 * state.hive.bounce;
                ctx.rotate(hiveSwing);
                ctx.scale(bounceScale, 2 - bounceScale * 0.99);
                ctx.drawImage(hiveIm, -38.5, 0, 77, 117);
                ctx.restore();
            }

            // Cành cây lớn phía trên
            if (branchIm && branchIm.complete && branchIm.naturalWidth) {
                ctx.save();
                ctx.rotate(branchSway);
                ctx.drawImage(branchIm, -6, -4, 474, 184);
                ctx.restore();
            }

            // 3 chú ong thật (2 frame, 10 fps) bay vòng quanh tổ mật
            state.orbitBees.forEach(function (ob) {
                var ox = state.hive.x + Math.cos(ob.angle) * ob.rx;
                var oy = state.hive.y + ob.yOff + Math.sin(ob.angle * 2) * ob.ry * 0.55;
                var oVx = -Math.sin(ob.angle) * ob.speed;
                var oFacing = (oVx >= 0) ? 1 : -1;
                var oCfg = BEE_SPRITE_CONFIG[ob.type] || BEE_SPRITE_CONFIG.ong1;
                var oFrameIdx = Math.floor(state.elapsed * BEE_ANIM_FPS + (ob.phase || 0) * 2) % oCfg.frames.length;
                var oIm = loadImg(oCfg.frames[oFrameIdx]);
                var oW = Math.round(oCfg.drawW * 0.56);
                var oH = Math.round(oCfg.drawH * 0.56);

                ctx.save();
                ctx.translate(ox, oy);
                var oFlipX = (oFacing === oCfg.nativeFacing) ? 1 : -1;
                ctx.scale(oFlipX, 1);
                if (oIm && oIm.complete && oIm.naturalWidth) {
                    ctx.drawImage(oIm, -oW / 2, -oH / 2, oW, oH);
                }
                ctx.restore();
            });

            // 3. BÓNG ĐỔ DƯỚI BÃI CỎ CHO ĐÀN ONG & MUỖNG MẬT
            state.bees.forEach(function (b) {
                ctx.fillStyle = 'rgba(34, 68, 20, 0.17)';
                ctx.beginPath();
                ctx.ellipse(b.x, b.y + 23, 13, 4.4, 0, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.fillStyle = 'rgba(34, 68, 20, 0.22)';
            ctx.beginPath();
            ctx.ellipse(state.spoon.x - 4, state.spoon.y + 30, 22, 7.5, 0, 0, Math.PI * 2);
            ctx.fill();

            // 4. RA-ĐA SÓNG TRẮNG MỜ NHẸ (~10%) LAN TỎA THEO HÌNH TAM GIÁC 45 ĐỘ PHÍA TRƯỚC MẶT ONG
            state.bees.forEach(function (b) {
                var effLen = b.isSleeping ? (b.coneLen * 0.28) : b.coneLen;
                var effHalf = b.isSleeping ? (b.coneHalfAngle * 0.52) : b.coneHalfAngle;
                var eyeX = b.x + b.facing * 9;
                var eyeY = b.y + 3;

                ctx.save();
                ctx.translate(eyeX, eyeY);
                ctx.rotate(b.lookAngle);

                var isChasing = (b.aiState === 'chase');
                var alertLv = clamp(b.alertLevel || 0, 0, 1);

                // Lớp nền nón tam giác rất mỏng (~6-10%) để hòa tự nhiên vào nền cỏ
                var baseGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, effLen);
                if (isChasing || alertLv > 0.35) {
                    var tintA = Math.min(0.18, 0.09 + alertLv * 0.08);
                    baseGrad.addColorStop(0, 'rgba(255, 138, 101, ' + tintA.toFixed(2) + ')');
                    baseGrad.addColorStop(0.65, 'rgba(255, 224, 178, ' + (tintA * 0.45).toFixed(2) + ')');
                    baseGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
                } else if (b.isSleeping) {
                    baseGrad.addColorStop(0, 'rgba(255, 255, 255, 0.04)');
                    baseGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
                } else {
                    baseGrad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
                    baseGrad.addColorStop(0.65, 'rgba(255, 255, 255, 0.03)');
                    baseGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
                }

                ctx.fillStyle = baseGrad;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.arc(0, 0, effLen, -effHalf, effHalf);
                ctx.closePath();
                ctx.fill();

                // Hai tia biên tam giác siêu mảnh mờ (~8%)
                if (!b.isSleeping) {
                    ctx.strokeStyle = isChasing
                        ? 'rgba(255, 171, 145, 0.16)'
                        : 'rgba(255, 255, 255, 0.08)';
                    ctx.lineWidth = 1.0;
                    ctx.beginPath();
                    ctx.moveTo(6, 0);
                    ctx.lineTo(Math.cos(-effHalf) * effLen * 0.94, Math.sin(-effHalf) * effLen * 0.94);
                    ctx.moveTo(6, 0);
                    ctx.lineTo(Math.cos(effHalf) * effLen * 0.94, Math.sin(effHalf) * effLen * 0.94);
                    ctx.stroke();
                }

                // Các vòng cung sóng màu trắng mờ nhẹ (~10-14%) chạy thưa dọc theo nón tam giác 45 độ
                var waveCount = b.isSleeping ? 1 : 2;
                var waveFreq = b.isSleeping ? 0.38 : (isChasing ? 1.25 : 0.72);
                ctx.lineCap = 'round';
                for (var wi = 0; wi < waveCount; wi++) {
                    var tWave = (state.elapsed * waveFreq + b.phase * 0.37 + wi / waveCount) % 1;
                    var waveR = 10 + tWave * (effLen - 10);
                    var fadeEnv = Math.sin(tWave * Math.PI);
                    var alphaMain = fadeEnv * (b.isSleeping ? 0.07 : (isChasing ? 0.34 : 0.14));
                    if (alphaMain <= 0.01) continue;

                    var arcHalf = effHalf * (0.86 + tWave * 0.12);
                    var strokeW = 2.2 - tWave * 0.9;

                    ctx.strokeStyle = isChasing
                        ? 'rgba(255, 224, 210, ' + alphaMain.toFixed(2) + ')'
                        : 'rgba(255, 255, 255, ' + alphaMain.toFixed(2) + ')';
                    ctx.lineWidth = strokeW;
                    ctx.beginPath();
                    ctx.arc(0, 0, waveR, -arcHalf, arcHalf);
                    ctx.stroke();
                }

                ctx.restore();
            });

            // 5. VẼ MUỖNG MẬT ONG CỦA NGƯỜI CHƠI (muong.png)
            var spoonIm = loadImg(SCENE_IMAGES_SRC.spoon);
            ctx.save();
            ctx.translate(state.spoon.x, state.spoon.y);
            ctx.rotate(state.spoon.tilt);

            // Hiệu ứng vòm lá ngụy trang nếu vừa hồi sinh bằng Ads
            if (state.camouflageTimer > 0) {
                var camoPulse = 0.55 + 0.25 * Math.sin(state.elapsed * 10);
                ctx.fillStyle = 'rgba(105, 240, 174, ' + (camoPulse * 0.35).toFixed(2) + ')';
                ctx.strokeStyle = 'rgba(185, 246, 202, 0.9)';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.arc(state.spoon.headOffsetX, state.spoon.headOffsetY, 32, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }

            // Vòng chấm tâm siêu mờ (~10%) quanh đầu muỗng
            ctx.strokeStyle = state.suspicion > 0.2
                ? 'rgba(255, 82, 82, 0.45)'
                : 'rgba(255, 255, 255, 0.10)';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.arc(state.spoon.headOffsetX, state.spoon.headOffsetY, state.spoon.headRadius + 2, 0, Math.PI * 2);
            ctx.stroke();

            if (spoonIm && spoonIm.complete && spoonIm.naturalWidth) {
                ctx.drawImage(spoonIm, -36, -46, 72, 92);
            }
            ctx.restore();

            // 7. VẼ ĐÀN ONG BAY LƯỢN (2 FRAME VỖ CÁNH 10 FPS; ONG NGỦ THỨC DẬY CHUYỂN THÀNH ONG 1)
            state.bees.forEach(function (b) {
                var effType = (b.type === 'ong2' && !b.isSleeping) ? 'ong1' : b.type;
                var cfg = BEE_SPRITE_CONFIG[effType] || BEE_SPRITE_CONFIG.ong1;
                var frameIdx = Math.floor(state.elapsed * BEE_ANIM_FPS + b.phase * 2) % cfg.frames.length;
                var beeIm = loadImg(cfg.frames[frameIdx]);

                ctx.save();
                ctx.translate(b.x, b.y);

                // Lật ngang chuẩn xác theo hướng mặt của từng ảnh gốc (ong1 & ong3 gốc quay phải, ong2 gốc quay trái)
                var flipX = (b.facing === cfg.nativeFacing) ? 1 : -1;
                var isChasing = (b.aiState === 'chase');
                var buzzFreq = b.isSleeping ? 10 : (isChasing ? 30 : 18);
                var buzzAmp = b.isSleeping ? 0.012 : (isChasing ? 0.032 : 0.02);
                var sx = flipX * (1 + Math.sin(state.elapsed * buzzFreq + b.phase) * buzzAmp);
                var sy = 1 - Math.sin(state.elapsed * buzzFreq + b.phase) * buzzAmp;
                var bankTilt = clamp((b.vx || 0) * 0.0014, -0.22, 0.22);

                ctx.rotate(bankTilt);
                ctx.scale(sx, sy);

                if (beeIm && beeIm.complete && beeIm.naturalWidth) {
                    ctx.drawImage(beeIm, -cfg.drawW / 2, -cfg.drawH / 2, cfg.drawW, cfg.drawH);
                }
                ctx.restore();

                // Chữ Zzz bay lên cho Ong Ngái Ngủ
                b.zzzParticles.forEach(function (zp) {
                    var za = Math.max(0, 1 - zp.life / zp.maxLife);
                    ctx.save();
                    ctx.font = '900 ' + Math.round(11 + zp.life * 6) + 'px "Baloo 2", sans-serif';
                    ctx.fillStyle = 'rgba(255, 255, 255, ' + za.toFixed(2) + ')';
                    ctx.strokeStyle = 'rgba(74, 20, 140, ' + (za * 0.75).toFixed(2) + ')';
                    ctx.lineWidth = 2.4;
                    ctx.strokeText('Z', zp.x, zp.y);
                    ctx.fillText('Z', zp.x, zp.y);
                    ctx.restore();
                });

                // Dấu chấm than (!) khi đang đuổi theo hoặc chấm hỏi (?) khi vừa mất dấu
                if (b.aiState === 'chase' || b.alertLevel > 0.18) {
                    ctx.save();
                    ctx.font = '900 18px "Baloo 2", sans-serif';
                    ctx.textAlign = 'center';
                    var showBang = (b.aiState === 'chase' || b.alertLevel >= 0.85);
                    var sym = showBang ? '!' : '?';
                    ctx.fillStyle = showBang ? '#ff3d00' : '#ffab00';
                    ctx.strokeStyle = '#3e2211';
                    ctx.lineWidth = 3.2;
                    ctx.strokeText(sym, b.x, b.y - cfg.drawH * 0.64);
                    ctx.fillText(sym, b.x, b.y - cfg.drawH * 0.64);
                    ctx.restore();
                }
            });

            // 8. HẠT PHẤN NỔ & CHỮ THƯỞNG BAY
            state.particles.forEach(function (p) {
                var pa = Math.max(0, 1 - p.life / p.maxLife);
                ctx.globalAlpha = pa;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1;

            state.floatingTexts.forEach(function (ft) {
                var fa = Math.max(0, 1 - ft.life / ft.maxLife);
                ctx.save();
                ctx.globalAlpha = fa;
                ctx.font = '800 16px "Baloo 2", "Nunito", sans-serif';
                ctx.textAlign = 'center';
                ctx.strokeStyle = '#3e2211';
                ctx.lineWidth = 4;
                ctx.strokeText(ft.text, ft.x, ft.y);
                ctx.fillStyle = ft.color;
                ctx.fillText(ft.text, ft.x, ft.y);
                ctx.restore();
            });

            // 9. HAI BỤI CÂY TIỀN CẢNH GÓC DƯỚI TRÁI & PHẢI (cauduoi_trai.png + cayduoi_phai.png)
            var bLeftIm = loadImg(SCENE_IMAGES_SRC.bushLeft);
            var bRightIm = loadImg(SCENE_IMAGES_SRC.bushRight);
            if (bLeftIm && bLeftIm.complete && bLeftIm.naturalWidth) {
                ctx.drawImage(bLeftIm, -10, H - 172, 182, 180);
            }
            if (bRightIm && bRightIm.complete && bRightIm.naturalWidth) {
                ctx.drawImage(bRightIm, W - 176, H - 168, 186, 176);
            }

            ctx.restore();
        }

        function loop(now) {
            if (!activeSession || activeSession.root !== root) return;
            var dt = Math.min(0.05, Math.max(0.001, (now - state.lastTs) / 1000));
            state.lastTs = now;
            update(dt);
            render();
            state.rafId = requestAnimationFrame(loop);
        }

        activeSession = {
            root: root,
            cleanup: function () {
                if (state.rafId) cancelAnimationFrame(state.rafId);
                window.removeEventListener('resize', resizeCanvas);
                window.removeEventListener('pointermove', onPointerMove);
                window.removeEventListener('pointerup', onPointerUp);
                window.removeEventListener('pointercancel', onPointerUp);
                window.removeEventListener('keydown', onKeyDown);
                window.removeEventListener('keyup', onKeyUp);
                if (root && root.parentNode) root.remove();
            }
        };

        state.rafId = requestAnimationFrame(loop);
    }

    function closeHoneyMinigame() {
        if (activeSession) {
            var fn = activeSession.cleanup;
            activeSession = null;
            fn();
        }
        var leftover = document.getElementById('honey-minigame-overlay');
        if (leftover) leftover.remove();
    }

    function bindEntryButton() {
        var btn = document.getElementById('btn-minigame-entry');
        if (btn && !btn._honeyBound) {
            btn._honeyBound = true;
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                if (document.getElementById('modal-overlay')) return;
                if (typeof playSound === 'function') playSound('click');
                var st = ensureSaveMinigameState();
                if (st.honey >= TICKET_TARGET) {
                    openHoneyMinigame({ useTickets: true });
                } else {
                    openHoneyIntroModal();
                }
            });
        }
        updateTicketHUD();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindEntryButton);
    } else {
        setTimeout(bindEntryButton, 0);
    }

    window.HONEY_MINIGAME = {
        open: openHoneyMinigame,
        openIntro: openHoneyIntroModal,
        close: closeHoneyMinigame,
        updateHUD: updateTicketHUD,
        awardTicketFromOrder: awardTicketFromOrder,
        getTicketCount: getTicketCount
    };
})();
