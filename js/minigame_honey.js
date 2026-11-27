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

    // Cấu hình danh sách frame cho từng loại ong (sẵn sàng mở rộng lên nhiều frame sau này)
    // nativeFacing: 1 = ảnh gốc quay mặt sang PHẢI, -1 = ảnh gốc quay mặt sang TRÁI
    var BEE_SPRITE_CONFIG = {
        ong1: {
            frames: [ASSET_DIR + 'ong1_frame1.png'],
            nativeFacing: 1,
            drawW: 27,
            drawH: 28,
            bodyRadius: 9.5
        },
        ong2: {
            frames: [ASSET_DIR + 'ong2_frame1.png'],
            nativeFacing: -1,
            drawW: 31,
            drawH: 28,
            bodyRadius: 10
        },
        ong3: {
            frames: [ASSET_DIR + 'ong3_frame1.png'],
            nativeFacing: 1,
            drawW: 37,
            drawH: 38,
            bodyRadius: 12
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
                        '• Tránh <b>vùng ra-đa màu vàng</b> và <b>thân đàn ong</b> đang bay tuần tra.<br>' +
                        '• Mẹo: Canh lúc <b>Ong Ngái Ngủ (Zzz)</b> nhắm mắt thu hẹp ra-đa để lách qua!' +
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

    function createStageBees(stageNum) {
        var speedMul = 1 + Math.min(0.24, (stageNum - 1) * 0.04);
        return [
            // 1. Ong Trinh Sát tầng dưới trái -> giữa (nhỏ gọn, chừa lối đi rộng rãi)
            {
                type: 'ong1',
                mode: 'patrol',
                ax: 76, ay: 642,
                bx: 268, by: 616,
                speed: 56 * speedMul,
                progress: 0.18,
                dir: 1,
                pauseTimer: 0,
                pauseDuration: 0.55,
                coneLen: 92,
                coneHalfAngle: 0.30,
                lookAngle: 0,
                phase: 0.2
            },
            // 2. Ong Trinh Sát tầng dưới phải -> giữa
            {
                type: 'ong1',
                mode: 'patrol',
                ax: 424, ay: 556,
                bx: 256, by: 536,
                speed: 58 * speedMul,
                progress: 0.35,
                dir: 1,
                pauseTimer: 0,
                pauseDuration: 0.52,
                coneLen: 94,
                coneHalfAngle: 0.30,
                lookAngle: Math.PI,
                phase: 1.7
            },
            // 3. Ong Đội Trưởng mũ phi công cánh phải
            {
                type: 'ong3',
                mode: 'sweeper',
                ax: 356, ay: 468,
                bx: 430, by: 420,
                speed: 42 * speedMul,
                progress: 0.5,
                dir: -1,
                pauseTimer: 0,
                pauseDuration: 0.40,
                baseLookAngle: 2.36,
                sweepAmp: 0.38,
                sweepSpeed: 1.45 * speedMul,
                coneLen: 104,
                coneHalfAngle: 0.32,
                lookAngle: 2.36,
                phase: 2.9
            },
            // 4. Ong Ngái Ngủ trung tâm (ngủ Zzz lâu hơn 2.8s để người chơi dễ lách qua)
            {
                type: 'ong2',
                mode: 'sleeper',
                ax: 168, ay: 452,
                bx: 264, by: 446,
                speed: 34 * speedMul,
                progress: 0.4,
                dir: 1,
                sleepCycle: 0.8,
                awakeDuration: 2.2,
                sleepDuration: 2.8,
                isSleeping: false,
                coneLen: 92,
                coneHalfAngle: 0.31,
                lookAngle: 2.28,
                phase: 4.1
            },
            // 5. Ong Trinh Sát cánh trái tầng trên
            {
                type: 'ong1',
                mode: 'patrol',
                ax: 76, ay: 382,
                bx: 214, by: 362,
                speed: 56 * speedMul,
                progress: 0.72,
                dir: -1,
                pauseTimer: 0,
                pauseDuration: 0.52,
                coneLen: 90,
                coneHalfAngle: 0.29,
                lookAngle: 0.5,
                phase: 5.3
            },
            // 6. Ong Đội Trưởng gác cổng dưới Tổ Mật
            {
                type: 'ong3',
                mode: 'sweeper',
                ax: 162, ay: 328,
                bx: 362, by: 328,
                speed: 48 * speedMul,
                progress: 0.22,
                dir: 1,
                pauseTimer: 0,
                pauseDuration: 0.45,
                baseLookAngle: 1.57,
                sweepAmp: 0.48,
                sweepSpeed: 1.55 * speedMul,
                coneLen: 98,
                coneHalfAngle: 0.31,
                lookAngle: 1.57,
                phase: 0.9
            }
        ];
    }

    function createBonusHoneyDrops() {
        return [
            { x: 96,  y: 545, r: 16, collected: false, phase: 0.4 },
            { x: 408, y: 486, r: 16, collected: false, phase: 1.9 },
            { x: 112, y: 308, r: 16, collected: false, phase: 3.2 }
        ];
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
                        '<span class="honey-mg-hud-sep">•</span>' +
                        '<span id="honey-mg-drops-txt">Giọt mật: 0/3</span>' +
                    '</div>' +
                '</div>' +
                '<div class="honey-mg-guide-banner" id="honey-mg-guide-banner">' +
                    'Chạm & kéo để di chuyển muỗng mật né vùng ra-đa vàng tiến tới Tổ Ong!' +
                '</div>' +
                '<div class="honey-mg-result-layer" id="honey-mg-result-layer" style="display:none;"></div>' +
            '</div>';

        document.body.appendChild(root);

        var frameEl = root.querySelector('#honey-mg-frame');
        var canvas = root.querySelector('#honey-mg-canvas');
        var ctx = canvas.getContext('2d');
        var dropsTxtEl = root.querySelector('#honey-mg-drops-txt');
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
            collectedDrops: 0,
            hive: { x: 262, y: 196, hitY: 212, hitR: 38, bounce: 0 },
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
            drops: createBonusHoneyDrops(),
            fireflies: [],
            particles: [],
            floatingTexts: [],
            hiveDrips: [],
            orbitBees: [
                { angle: 0.2, speed: 2.1, rx: 66, ry: 22, yOff: -16 },
                { angle: 2.4, speed: -1.8, rx: 72, ry: 25, yOff: 8 },
                { angle: 4.5, speed: 2.5, rx: 56, ry: 18, yOff: 26 }
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

        // Khởi tạo tọa độ ban đầu cho đàn ong
        state.bees.forEach(function (b) {
            b.x = b.ax + (b.bx - b.ax) * b.progress;
            b.y = b.ay + (b.by - b.ay) * b.progress;
            b.facing = (b.bx >= b.ax) ? 1 : -1;
            b.alertLevel = 0;
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
            state.spoon.targetY = clamp(state.drag.startSpoonY + dy, 175, H - 48);
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
                        state.bees.forEach(function (b) { b.alertLevel = 0; });
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
            var goldGain = (600 + state.collectedDrops * 100) * mul;
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
            var baseGold = 600 + state.collectedDrops * 100;
            var baseGem = 3;

            resultLayerEl.style.display = 'flex';
            resultLayerEl.innerHTML =
                '<div class="honey-result-card is-win">' +
                    '<div class="honey-result-ribbon is-win">THU HOẠCH MẬT THÀNH CÔNG!</div>' +
                    '<img src="' + SCENE_IMAGES_SRC.hive + '" class="honey-win-hive-img" alt="Tổ Mật">' +
                    '<div class="honey-result-sub">Tuyệt đỉnh! Bạn đã khéo léo vượt qua đàn ong và lấy trọn giọt mật vàng óng (' + state.collectedDrops + '/3 giọt phụ)!</div>' +
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
            state.collectedDrops = 0;
            state.caughtByBee = null;
            state.bees = createStageBees(stageNum);
            state.bees.forEach(function (b) {
                b.x = b.ax + (b.bx - b.ax) * b.progress;
                b.y = b.ay + (b.by - b.ay) * b.progress;
                b.facing = (b.bx >= b.ax) ? 1 : -1;
                b.alertLevel = 0;
                b.zzzParticles = [];
                b.zzzSpawnAcc = 0;
            });
            state.drops = createBonusHoneyDrops();
            if (dropsTxtEl) dropsTxtEl.textContent = 'Giọt mật: 0/3';
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
                var kbSpeed = 240 * dt;
                if (state.keys.ArrowLeft || state.keys.a || state.keys.A) state.spoon.targetX -= kbSpeed;
                if (state.keys.ArrowRight || state.keys.d || state.keys.D) state.spoon.targetX += kbSpeed;
                if (state.keys.ArrowUp || state.keys.w || state.keys.W) state.spoon.targetY -= kbSpeed;
                if (state.keys.ArrowDown || state.keys.s || state.keys.S) state.spoon.targetY += kbSpeed;
                state.spoon.targetX = clamp(state.spoon.targetX, 46, W - 46);
                state.spoon.targetY = clamp(state.spoon.targetY, 175, H - 48);
            }

            // Nội suy mượt cho muỗng mật + độ nghiêng theo vận tốc ngang
            var followRate = Math.min(1, dt * 18);
            var prevX = state.spoon.x;
            var prevY = state.spoon.y;
            state.spoon.x += (state.spoon.targetX - state.spoon.x) * followRate;
            state.spoon.y += (state.spoon.targetY - state.spoon.y) * followRate;
            var vxSpoon = (state.spoon.x - prevX) / Math.max(0.001, dt);
            var vySpoon = (state.spoon.y - prevY) / Math.max(0.001, dt);
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
                    x: state.hive.x + (Math.random() - 0.5) * 10,
                    y: state.hive.y + 62,
                    vy: 28,
                    life: 0,
                    maxLife: 1.15
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

            // Cập nhật từng con ong tuần tra & vùng quét ra-đa
            var maxFrameDanger = 0;
            var dangerBee = null;

            for (var bi = 0; bi < state.bees.length; bi++) {
                var b = state.bees[bi];
                var segDx = b.bx - b.ax;
                var segDy = b.by - b.ay;
                var segLen = Math.max(1, Math.hypot(segDx, segDy));

                if (state.status === 'playing' || state.status === 'win_anim') {
                    if (b.pauseTimer > 0) {
                        b.pauseTimer = Math.max(0, b.pauseTimer - dt);
                    } else {
                        b.progress += (b.speed * dt / segLen) * b.dir;
                        if (b.progress >= 1) {
                            b.progress = 1;
                            b.dir = -1;
                            b.pauseTimer = b.pauseDuration || 0.3;
                        } else if (b.progress <= 0) {
                            b.progress = 0;
                            b.dir = 1;
                            b.pauseTimer = b.pauseDuration || 0.3;
                        }
                    }
                } else if (state.status === 'caught_anim' && state.caughtByBee === b) {
                    // Ong phát hiện lao nhẹ về phía muỗng
                    b.x += (headX - b.x) * Math.min(1, dt * 5);
                    b.y += (headY - b.y) * Math.min(1, dt * 5);
                }

                if (state.status !== 'caught_anim' || state.caughtByBee !== b) {
                    var hoverY = Math.sin(state.elapsed * 6.8 + b.phase) * 5.5;
                    b.x = b.ax + segDx * b.progress;
                    b.y = b.ay + segDy * b.progress + hoverY;
                }

                // Tính góc hướng nhìn & hướng lật mặt của ong
                var moveVx = segDx * b.dir;
                var moveVy = segDy * b.dir;

                if (b.mode === 'sweeper') {
                    var targetSweep = b.baseLookAngle + Math.sin(state.elapsed * b.sweepSpeed + b.phase) * b.sweepAmp;
                    b.lookAngle = lerpAngle(b.lookAngle, targetSweep, Math.min(1, dt * 10));
                    b.facing = (Math.cos(b.lookAngle) >= 0) ? 1 : -1;
                } else if (b.mode === 'sleeper') {
                    b.sleepCycle += dt;
                    var totalCyc = b.awakeDuration + b.sleepDuration;
                    var cycPos = b.sleepCycle % totalCyc;
                    b.isSleeping = (cycPos >= b.awakeDuration);

                    // Khi ngủ: sinh chữ Zzz bay lên
                    if (b.isSleeping) {
                        b.zzzSpawnAcc += dt;
                        if (b.zzzSpawnAcc >= 0.55) {
                            b.zzzSpawnAcc = 0;
                            b.zzzParticles.push({ x: b.x + (b.facing * 7), y: b.y - 10, life: 0, maxLife: 1.1 });
                        }
                    }
                    var slAngle = (b.dir >= 0) ? 0.55 : (Math.PI - 0.55);
                    b.lookAngle = lerpAngle(b.lookAngle, slAngle, Math.min(1, dt * 6));
                    b.facing = (Math.cos(b.lookAngle) >= 0) ? 1 : -1;
                } else {
                    // Ong trinh sát nghiêng nhẹ chùm ra-đa xuống phía dưới đồng cỏ nơi muỗng đi lên
                    var rawMoveAngle = Math.atan2(moveVy + 28, moveVx);
                    b.lookAngle = lerpAngle(b.lookAngle, rawMoveAngle, Math.min(1, dt * 8.5));
                    b.facing = (Math.cos(b.lookAngle) >= 0) ? 1 : -1;
                }

                for (var zi = b.zzzParticles.length - 1; zi >= 0; zi--) {
                    var zp = b.zzzParticles[zi];
                    zp.life += dt;
                    zp.y -= 20 * dt;
                    zp.x += Math.sin(zp.life * 5) * 8 * dt;
                    if (zp.life >= zp.maxLife) b.zzzParticles.splice(zi, 1);
                }

                // Hạt phấn bay sau đuôi ong
                if (Math.random() < dt * 5.5) {
                    state.particles.push({
                        x: b.x - b.facing * 10,
                        y: b.y + 2 + (Math.random() - 0.5) * 5,
                        vx: -b.facing * 15,
                        vy: (Math.random() - 0.5) * 10,
                        r: 1.4 + Math.random() * 1.2,
                        life: 0,
                        maxLife: 0.32,
                        color: 'rgba(255, 241, 118, 0.85)'
                    });
                }

                // Xét va chạm với đầu muỗng khi đang chơi và không bật lá ngụy trang
                if (state.status === 'playing' && state.camouflageTimer <= 0 && state.hasMovedOnce) {
                    var cfg = BEE_SPRITE_CONFIG[b.type] || BEE_SPRITE_CONFIG.ong1;

                    // 1. Chạm trực tiếp vào người con ong -> bắt ngay lập tức!
                    var bodyDist = Math.hypot(headX - b.x, headY - b.y);
                    if (bodyDist < cfg.bodyRadius + state.spoon.headRadius * 0.72) {
                        triggerCaught(b);
                        return;
                    }

                    // 2. Nằm trong chùm ra-đa phía trước mặt ong
                    var effConeLen = b.isSleeping ? (b.coneLen * 0.28) : b.coneLen;
                    var effHalfAng = b.isSleeping ? (b.coneHalfAngle * 0.52) : b.coneHalfAngle;
                    var eyeX = b.x + b.facing * 7;
                    var eyeY = b.y + 2;
                    var toHeadX = headX - eyeX;
                    var toHeadY = headY - eyeY;
                    var coneDist = Math.hypot(toHeadX, toHeadY);

                    if (coneDist <= effConeLen + state.spoon.headRadius * 0.35 && coneDist > 4) {
                        var angToHead = Math.atan2(toHeadY, toHeadX);
                        var angDiff = Math.abs(normalizeAngleDiff(angToHead, b.lookAngle));
                        if (angDiff <= effHalfAng) {
                            var depthRatio = 1 - (coneDist / (effConeLen + 8));
                            var centerRatio = 1 - (angDiff / effHalfAng);
                            var intensity = (depthRatio > 0.30 && centerRatio > 0.32) ? 5.2 : 2.3;
                            if (intensity > maxFrameDanger) {
                                maxFrameDanger = intensity;
                                dangerBee = b;
                            }
                            b.alertLevel = Math.min(1, b.alertLevel + dt * intensity);
                        } else {
                            b.alertLevel = Math.max(0, b.alertLevel - dt * 3.5);
                        }
                    } else {
                        b.alertLevel = Math.max(0, b.alertLevel - dt * 3.5);
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
                    state.suspicion = Math.max(0, state.suspicion - dt * 3.2);
                }

                // Ăn các giọt mật thưởng trên đồng cỏ
                state.drops.forEach(function (d) {
                    if (d.collected) return;
                    if (Math.hypot(headX - d.x, headY - d.y) < d.r + state.spoon.headRadius + 4) {
                        d.collected = true;
                        state.collectedDrops++;
                        if (dropsTxtEl) dropsTxtEl.textContent = 'Giọt mật: ' + state.collectedDrops + '/3';
                        if (typeof playSound === 'function') playSound('coin');
                        spawnBurst(d.x, d.y, ['#ffd54f', '#ffb300', '#ffffff'], 14, 130);
                        spawnFloatingText(d.x, d.y - 12, '+100 Vàng!', '#ffe082');
                    }
                });

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
        function drawHoneyDropIcon(x, y, radius, pulse) {
            var r = radius * (1 + Math.sin(pulse) * 0.08);
            ctx.save();
            ctx.translate(x, y);

            // Hào quang vàng ấm
            var glow = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 1.9);
            glow.addColorStop(0, 'rgba(255, 238, 88, 0.72)');
            glow.addColorStop(1, 'rgba(255, 193, 7, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(0, 0, r * 1.9, 0, Math.PI * 2);
            ctx.fill();

            // Giọt mật vàng óng
            ctx.beginPath();
            ctx.moveTo(0, -r * 1.18);
            ctx.bezierCurveTo(r * 1.05, -r * 0.15, r * 0.95, r * 1.05, 0, r * 1.05);
            ctx.bezierCurveTo(-r * 0.95, r * 1.05, -r * 1.05, -r * 0.15, 0, -r * 1.18);
            ctx.closePath();
            var gDrop = ctx.createLinearGradient(0, -r, 0, r);
            gDrop.addColorStop(0, '#ffe57f');
            gDrop.addColorStop(0.55, '#ffb300');
            gDrop.addColorStop(1, '#e65100');
            ctx.fillStyle = gDrop;
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#8d4004';
            ctx.stroke();

            // Đốm sáng phản quang
            ctx.fillStyle = 'rgba(255,255,255,0.85)';
            ctx.beginPath();
            ctx.ellipse(-r * 0.28, -r * 0.18, r * 0.18, r * 0.32, -0.35, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

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
            var hHalo = ctx.createRadialGradient(state.hive.x, state.hive.hitY, 12, state.hive.x, state.hive.hitY, 92);
            hHalo.addColorStop(0, 'rgba(255, 238, 88, ' + (0.45 * hiveGlowBoost).toFixed(2) + ')');
            hHalo.addColorStop(1, 'rgba(255, 193, 7, 0)');
            ctx.fillStyle = hHalo;
            ctx.beginPath();
            ctx.arc(state.hive.x, state.hive.hitY, 92, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Giọt mật nhỏ rơi từ tổ ong
            state.hiveDrips.forEach(function (dr) {
                var a = Math.max(0, 1 - dr.life / dr.maxLife);
                ctx.fillStyle = 'rgba(255, 193, 7, ' + a.toFixed(2) + ')';
                ctx.beginPath();
                ctx.ellipse(dr.x, dr.y, 3.4, 5.2, 0, 0, Math.PI * 2);
                ctx.fill();
            });

            // Tổ ong đung đưa nhẹ dưới cành cây
            if (hiveIm && hiveIm.complete && hiveIm.naturalWidth) {
                ctx.save();
                ctx.translate(state.hive.x, 114);
                var hiveSwing = Math.sin(state.elapsed * 2.1) * 0.038;
                var bounceScale = 1 + Math.sin(state.hive.bounce * Math.PI * 3) * 0.14 * state.hive.bounce;
                ctx.rotate(hiveSwing);
                ctx.scale(bounceScale, 2 - bounceScale * 0.99);
                ctx.drawImage(hiveIm, -64, 0, 128, 195);
                ctx.restore();
            }

            // Cành cây lớn phía trên
            if (branchIm && branchIm.complete && branchIm.naturalWidth) {
                ctx.save();
                ctx.rotate(branchSway);
                ctx.drawImage(branchIm, -6, -4, 474, 184);
                ctx.restore();
            }

            // 3 chú ong thợ tí hon bay vòng quanh tổ mật tạo sức sống
            state.orbitBees.forEach(function (ob) {
                var ox = state.hive.x + Math.cos(ob.angle) * ob.rx;
                var oy = state.hive.y + ob.yOff + Math.sin(ob.angle * 2) * ob.ry * 0.55;
                ctx.save();
                ctx.fillStyle = 'rgba(255, 241, 118, 0.45)';
                ctx.beginPath();
                ctx.arc(ox - Math.cos(ob.angle) * 6, oy, 2.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.translate(ox, oy);
                ctx.fillStyle = '#ffd54f';
                ctx.strokeStyle = '#3e2723';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.ellipse(0, 0, 5.5, 4, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle = 'rgba(255,255,255,0.85)';
                ctx.beginPath();
                ctx.ellipse(0, -4.5, 3.2, 2.2, Math.sin(state.elapsed * 45) * 0.4, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });

            // 3. BÓNG ĐỔ DƯỚI BÃI CỎ CHO ĐÀN ONG & MUỖNG MẬT
            state.bees.forEach(function (b) {
                ctx.fillStyle = 'rgba(34, 68, 20, 0.16)';
                ctx.beginPath();
                ctx.ellipse(b.x, b.y + 18, 10, 3.4, 0, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.fillStyle = 'rgba(34, 68, 20, 0.22)';
            ctx.beginPath();
            ctx.ellipse(state.spoon.x - 4, state.spoon.y + 30, 22, 7.5, 0, 0, Math.PI * 2);
            ctx.fill();

            // 4. GIỌT MẬT THƯỞNG PHỤ TRÊN ĐỒNG CỎ
            state.drops.forEach(function (d) {
                if (d.collected) return;
                drawHoneyDropIcon(d.x, d.y + Math.sin(state.elapsed * 3.5 + d.phase) * 3.5, 11.5, state.elapsed * 4 + d.phase);
            });

            // 5. CHÙM ÁNH SÁNG RA-ĐA QUÉT PHÍA TRƯỚC MẶT ĐÀN ONG (KHỚP ẢNH DEMO)
            state.bees.forEach(function (b) {
                var effLen = b.isSleeping ? (b.coneLen * 0.28) : b.coneLen;
                var effHalf = b.isSleeping ? (b.coneHalfAngle * 0.52) : b.coneHalfAngle;
                var eyeX = b.x + b.facing * 7;
                var eyeY = b.y + 2;

                ctx.save();
                ctx.translate(eyeX, eyeY);
                ctx.rotate(b.lookAngle);

                var alertLv = clamp(b.alertLevel || 0, 0, 1);
                var grad = ctx.createRadialGradient(0, 0, 4, 0, 0, effLen);
                if (alertLv > 0.15) {
                    // Chuyển dần từ vàng chanh sang cam-đỏ khi phát hiện muỗng mật!
                    var rCol = 255;
                    var gCol = Math.round(235 - alertLv * 165);
                    var bCol = Math.round(60 - alertLv * 50);
                    grad.addColorStop(0, 'rgba(' + rCol + ',' + gCol + ',' + bCol + ',0.86)');
                    grad.addColorStop(0.62, 'rgba(' + rCol + ',' + gCol + ',' + bCol + ',0.42)');
                    grad.addColorStop(1, 'rgba(' + rCol + ',' + gCol + ',' + bCol + ',0)');
                } else if (b.isSleeping) {
                    grad.addColorStop(0, 'rgba(255, 249, 196, 0.36)');
                    grad.addColorStop(1, 'rgba(255, 249, 196, 0)');
                } else {
                    grad.addColorStop(0, 'rgba(255, 248, 82, 0.80)');
                    grad.addColorStop(0.55, 'rgba(255, 242, 75, 0.44)');
                    grad.addColorStop(1, 'rgba(255, 242, 75, 0)');
                }

                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.arc(0, 0, effLen, -effHalf, effHalf);
                ctx.closePath();
                ctx.fill();

                // Sóng radar mảnh chạy dọc chùm sáng tạo cảm giác dò tìm sinh động
                if (!b.isSleeping) {
                    var waveR = ((state.elapsed * 68 + b.phase * 30) % (effLen * 0.88)) + 12;
                    var waveAlpha = (1 - waveR / effLen) * 0.34;
                    ctx.strokeStyle = 'rgba(255, 255, 255, ' + waveAlpha.toFixed(2) + ')';
                    ctx.lineWidth = 1.6;
                    ctx.beginPath();
                    ctx.arc(0, 0, waveR, -effHalf * 0.86, effHalf * 0.86);
                    ctx.stroke();
                }

                ctx.restore();
            });

            // 6. VẼ MUỖNG MẬT ONG CỦA NGƯỜI CHƠI (muong.png)
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

            // Vòng chấm tâm nhẹ quanh đầu muỗng giúp người chơi căn lách cực chuẩn
            ctx.strokeStyle = state.suspicion > 0.2
                ? 'rgba(255, 82, 82, 0.85)'
                : 'rgba(255, 245, 157, 0.52)';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.arc(state.spoon.headOffsetX, state.spoon.headOffsetY, state.spoon.headRadius + 2, 0, Math.PI * 2);
            ctx.stroke();

            if (spoonIm && spoonIm.complete && spoonIm.naturalWidth) {
                ctx.drawImage(spoonIm, -36, -46, 72, 92);
            }
            ctx.restore();

            // 7. VẼ ĐÀN ONG BAY LƯỢN (HỖ TRỢ 1 FRAME VỚI HIỆU ỨNG VỖ CÁNH & NGHIÊNG MÌNH MƯỢT)
            state.bees.forEach(function (b) {
                var cfg = BEE_SPRITE_CONFIG[b.type] || BEE_SPRITE_CONFIG.ong1;
                var frameIdx = Math.floor(state.elapsed * 12) % cfg.frames.length;
                var beeIm = loadImg(cfg.frames[frameIdx]);

                ctx.save();
                ctx.translate(b.x, b.y);

                // Lật ngang chuẩn xác theo hướng mặt của từng ảnh gốc (ong1 & ong3 gốc quay phải, ong2 gốc quay trái)
                var flipX = (b.facing === cfg.nativeFacing) ? 1 : -1;
                var buzzFreq = b.isSleeping ? 14 : 38;
                var buzzAmp = b.isSleeping ? 0.018 : 0.036;
                var sx = flipX * (1 + Math.sin(state.elapsed * buzzFreq + b.phase) * buzzAmp);
                var sy = 1 - Math.sin(state.elapsed * buzzFreq + b.phase) * buzzAmp;
                var bankTilt = (b.isSleeping ? 0.02 : 0.07) * b.dir;

                ctx.rotate(bankTilt);
                ctx.scale(sx, sy);

                // Hiệu ứng bóng cánh vỗ mờ nhanh phía sau lưng giúp ảnh 1 frame trông như đang đập cánh thật!
                var wingFlutter = Math.sin(state.elapsed * (b.isSleeping ? 18 : 54) + b.phase);
                ctx.save();
                ctx.translate(-2, -cfg.drawH * 0.28);
                ctx.rotate(wingFlutter * 0.24);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.34)';
                ctx.beginPath();
                ctx.ellipse(0, 0, cfg.drawW * 0.24, cfg.drawH * 0.15, -0.35, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                if (beeIm && beeIm.complete && beeIm.naturalWidth) {
                    ctx.drawImage(beeIm, -cfg.drawW / 2, -cfg.drawH / 2, cfg.drawW, cfg.drawH);
                }
                ctx.restore();

                // Chữ Zzz bay lên cho Ong Ngái Ngủ
                b.zzzParticles.forEach(function (zp) {
                    var za = Math.max(0, 1 - zp.life / zp.maxLife);
                    ctx.save();
                    ctx.font = '900 ' + Math.round(9 + zp.life * 5) + 'px "Baloo 2", sans-serif';
                    ctx.fillStyle = 'rgba(255, 255, 255, ' + za.toFixed(2) + ')';
                    ctx.strokeStyle = 'rgba(74, 20, 140, ' + (za * 0.75).toFixed(2) + ')';
                    ctx.lineWidth = 2;
                    ctx.strokeText('Z', zp.x, zp.y);
                    ctx.fillText('Z', zp.x, zp.y);
                    ctx.restore();
                });

                // Dấu chấm hỏi (?) hoặc chấm than (!) trên đầu ong khi muỗng đi sát vào vùng quét
                if (b.alertLevel > 0.18) {
                    ctx.save();
                    ctx.font = '900 16px "Baloo 2", sans-serif';
                    ctx.textAlign = 'center';
                    var sym = b.alertLevel >= 0.95 ? '!' : '?';
                    ctx.fillStyle = b.alertLevel >= 0.95 ? '#ff3d00' : '#ffab00';
                    ctx.strokeStyle = '#3e2211';
                    ctx.lineWidth = 3;
                    ctx.strokeText(sym, b.x, b.y - cfg.drawH * 0.68);
                    ctx.fillText(sym, b.x, b.y - cfg.drawH * 0.68);
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
