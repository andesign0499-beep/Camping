// =============================================================================
// HỆ THỐNG ĐỒ HỌA GPU & HIỆU ỨNG JUICINESS (PIXI.JS + PIXI-FILTERS + PARTICLE-EMITTER + GSAP)
// 1. PixiJS + pixi-filters + Glow:
//    - Viền sáng lung linh (Glow nhịp thở) cho dây đèn, đèn bão (congcu),
//      lửa trại (bep), tia sét (⚡) và viên kim cương (💎).
//    - Nắng chiều chiếu xiên nhẹ nhàng & hạt đom đóm lơ lửng trên đảo "Trại của bạn".
// 2. @pixi/particle-emitter:
//    - Vòng sóng ánh sáng + Tia sáng ngôi sao nổ tung đúng tâm khi ghép 2 món đồ (Merge).
//    - Khói trắng bồng bềnh và tàn lửa bay lên từ đống lửa trại ở màn hình "Trại của bạn".
//    - Bụi cỏ & lá non tung lên khi phá ô khóa đất (🔒 / đá) hoặc ô mạng nhện.
// 3. GSAP (GreenSock) + MotionPathPlugin:
//    - Khi bấm vào túi Balô / Thùng đồ (⚡): Vật phẩm bay theo đường vòng cung Parabol
//      rồi rơi xuống ô trống, nảy nhẹ 1 nhịp như có trọng lực.
//    - Khi ghép 2 món đồ (Merge): Phóng to từ scale: 0 lên 1.2 rồi thu về 1.0 với
//      hàm đàn hồi ease: "elastic.out(1, 0.5)" (hiệu ứng thạch rau câu bắt mắt).
//    - Khi nâng cấp / trang bị đồ ở "Trại của bạn": Rơi từ trên trời xuống đảo,
//      dẹp nhẹ khi chạm đất rồi nảy lên kèm bụi cỏ dưới chân.
// =============================================================================

(function () {
    'use strict';

    // Đăng ký MotionPathPlugin cho GSAP
    if (typeof window !== 'undefined' && window.gsap && window.MotionPathPlugin) {
        window.gsap.registerPlugin(window.MotionPathPlugin);
    }

    var boardApp = null;
    var boardFxContainer = null;
    var boardActiveEmitters = [];
    var boardActiveRings = [];
    var boardTickerRunning = false;

    var campApp = null;
    var campSunbeamContainer = null;
    var campParticleContainer = null;
    var campSmokeContainer = null;
    var campEmberContainer = null;
    var campFireflyContainer = null;
    var campSmokeEmitter = null;
    var campEmberEmitter = null;
    var campFireflyEmitter = null;
    var campExtraEmitters = [];
    var campSunbeams = [];
    var lastEquippedSnapshot = {};

    var softDotTex = null;
    var sparkTex = null;
    var ringTex = null;
    var smokeTex = null;
    var leafTex = null;
    var sunbeamTex = null;

    // Khởi tạo CSS cho hiệu ứng phát sáng nhịp thở của Đèn bão, Lửa trại, Tia sét ⚡ và Kim cương 💎
    function injectVisualFxStyles() {
        if (typeof document === 'undefined' || document.getElementById('visual-fx-styles')) return;
        var style = document.createElement('style');
        style.id = 'visual-fx-styles';
        style.textContent = [
            '@keyframes vfxLanternGlow {',
            '  0%, 100% { filter: drop-shadow(0 0 4px rgba(255, 213, 79, 0.75)) drop-shadow(0 2px 3px rgba(0, 0, 0, 0.22)); }',
            '  50% { filter: drop-shadow(0 0 9px rgba(255, 235, 59, 0.95)) drop-shadow(0 0 14px rgba(255, 160, 0, 0.55)) drop-shadow(0 2px 3px rgba(0, 0, 0, 0.22)); }',
            '}',
            '@keyframes vfxFireGlow {',
            '  0%, 100% { filter: drop-shadow(0 0 4px rgba(255, 112, 67, 0.75)) drop-shadow(0 2px 3px rgba(0, 0, 0, 0.22)); }',
            '  50% { filter: drop-shadow(0 0 9px rgba(255, 152, 0, 0.95)) drop-shadow(0 0 14px rgba(255, 87, 34, 0.6)) drop-shadow(0 2px 3px rgba(0, 0, 0, 0.22)); }',
            '}',
            '@keyframes vfxBoltGlow {',
            '  0%, 100% { filter: drop-shadow(0 0 3px rgba(255, 235, 59, 0.85)) drop-shadow(0 1px 2px rgba(0, 0, 0, 0.35)); }',
            '  50% { filter: drop-shadow(0 0 7px rgba(255, 255, 141, 1)) drop-shadow(0 0 11px rgba(255, 193, 7, 0.8)); }',
            '}',
            '@keyframes vfxGemGlow {',
            '  0%, 100% { filter: drop-shadow(0 0 3px rgba(255, 64, 129, 0.75)); }',
            '  50% { filter: drop-shadow(0 0 7px rgba(255, 128, 171, 1)) drop-shadow(0 0 11px rgba(245, 0, 87, 0.65)); }',
            '}',
            '.vfx-glow-lantern { animation: vfxLanternGlow 2.2s ease-in-out infinite; }',
            '.vfx-glow-fire { animation: vfxFireGlow 1.6s ease-in-out infinite; }',
            '.generator-energy-badge { animation: vfxBoltGlow 1.8s ease-in-out infinite; }',
            '#btn-refill-energy .hud-stat-icon { animation: vfxBoltGlow 2.0s ease-in-out infinite; }',
            '#btn-gem-shop .hud-stat-icon { animation: vfxGemGlow 2.4s ease-in-out infinite; }'
        ].join('\n');
        document.head.appendChild(style);
    }

    // Tạo các Texture hạt cho @pixi/particle-emitter
    function ensureParticleTextures() {
        if (typeof PIXI === 'undefined' || softDotTex) return;

        // 1. Hạt đốm sáng tròn mềm (Glow Orb / Ember / Firefly)
        var c1 = document.createElement('canvas');
        c1.width = 32;
        c1.height = 32;
        var ctx1 = c1.getContext('2d');
        var g1 = ctx1.createRadialGradient(16, 16, 1.5, 16, 16, 14);
        g1.addColorStop(0, 'rgba(255, 255, 255, 1)');
        g1.addColorStop(0.4, 'rgba(255, 253, 231, 0.9)');
        g1.addColorStop(0.75, 'rgba(255, 213, 79, 0.35)');
        g1.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx1.fillStyle = g1;
        ctx1.fillRect(0, 0, 32, 32);
        softDotTex = PIXI.Texture.from(c1);

        // 2. Tia sáng ngôi sao 4 cánh sắc nét (Merge Star Sparkle)
        var c2 = document.createElement('canvas');
        c2.width = 36;
        c2.height = 36;
        var ctx2 = c2.getContext('2d');
        ctx2.translate(18, 18);
        var g2 = ctx2.createRadialGradient(0, 0, 1, 0, 0, 16);
        g2.addColorStop(0, 'rgba(255, 255, 255, 1)');
        g2.addColorStop(0.5, 'rgba(255, 253, 231, 0.92)');
        g2.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx2.fillStyle = g2;
        ctx2.beginPath();
        for (var i = 0; i < 4; i++) {
            ctx2.rotate(Math.PI / 2);
            ctx2.moveTo(0, 0);
            ctx2.quadraticCurveTo(2.4, -3.5, 0, -15);
            ctx2.quadraticCurveTo(-2.4, -3.5, 0, 0);
        }
        ctx2.fill();
        ctx2.beginPath();
        ctx2.arc(0, 0, 3.5, 0, Math.PI * 2);
        ctx2.fill();
        sparkTex = PIXI.Texture.from(c2);

        // 3. Vòng sóng ánh sáng đồng tâm (Merge Shockwave Ring)
        var cRing = document.createElement('canvas');
        cRing.width = 96;
        cRing.height = 96;
        var ctxR = cRing.getContext('2d');
        var gR = ctxR.createRadialGradient(48, 48, 22, 48, 48, 46);
        gR.addColorStop(0, 'rgba(255, 255, 255, 0)');
        gR.addColorStop(0.55, 'rgba(255, 249, 196, 0.35)');
        gR.addColorStop(0.8, 'rgba(255, 255, 255, 0.92)');
        gR.addColorStop(1, 'rgba(255, 213, 79, 0)');
        ctxR.fillStyle = gR;
        ctxR.beginPath();
        ctxR.arc(48, 48, 46, 0, Math.PI * 2);
        ctxR.fill();
        ringTex = PIXI.Texture.from(cRing);

        // 4. Hạt khói mềm bồng bềnh (Campfire Smoke Puff)
        var c3 = document.createElement('canvas');
        c3.width = 48;
        c3.height = 48;
        var ctx3 = c3.getContext('2d');
        var g3 = ctx3.createRadialGradient(24, 24, 2, 24, 24, 20);
        g3.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
        g3.addColorStop(0.55, 'rgba(236, 239, 241, 0.22)');
        g3.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx3.fillStyle = g3;
        ctx3.beginPath();
        ctx3.arc(24, 24, 20, 0, Math.PI * 2);
        ctx3.fill();
        smokeTex = PIXI.Texture.from(c3);

        // 5. Hạt lá cỏ non (Grass & Dirt Burst khi phá ô khóa đất / mạng nhện)
        var c4 = document.createElement('canvas');
        c4.width = 24;
        c4.height = 24;
        var ctx4 = c4.getContext('2d');
        ctx4.translate(12, 12);
        ctx4.fillStyle = '#ffffff';
        ctx4.beginPath();
        ctx4.moveTo(0, -8);
        ctx4.quadraticCurveTo(5.5, -1, 0, 8);
        ctx4.quadraticCurveTo(-5.5, -1, 0, -8);
        ctx4.fill();
        leafTex = PIXI.Texture.from(c4);

        // 6. Dải tia nắng chiều mềm mại trong suốt (Sunbeam Ray Texture)
        var c5 = document.createElement('canvas');
        c5.width = 96;
        c5.height = 360;
        var ctx5 = c5.getContext('2d');
        var g5 = ctx5.createLinearGradient(0, 0, 96, 0);
        g5.addColorStop(0, 'rgba(255, 248, 205, 0)');
        g5.addColorStop(0.3, 'rgba(255, 248, 205, 0.14)');
        g5.addColorStop(0.5, 'rgba(255, 253, 231, 0.24)');
        g5.addColorStop(0.7, 'rgba(255, 248, 205, 0.14)');
        g5.addColorStop(1, 'rgba(255, 248, 205, 0)');
        ctx5.fillStyle = g5;
        ctx5.fillRect(0, 0, 96, 360);
        ctx5.globalCompositeOperation = 'destination-in';
        var g5v = ctx5.createLinearGradient(0, 0, 0, 360);
        g5v.addColorStop(0, 'rgba(0, 0, 0, 0)');
        g5v.addColorStop(0.18, 'rgba(0, 0, 0, 0.9)');
        g5v.addColorStop(0.7, 'rgba(0, 0, 0, 0.5)');
        g5v.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx5.fillStyle = g5v;
        ctx5.fillRect(0, 0, 96, 360);
        sunbeamTex = PIXI.Texture.from(c5);
    }

    // =========================================================================
    // PHẦN 1: HIỆU ỨNG BÀN CỜ 7x9 (PIXI.JS + PARTICLE-EMITTER + GLOW VIỀN ITEM)
    // =========================================================================
    function initTopSceneWeatherPixi() {
        injectVisualFxStyles();
    }

    function wakeBoardTicker() {
        if (!boardApp || boardTickerRunning) return;
        boardTickerRunning = true;
        boardApp.ticker.start();
    }

    function initBoardPixiOverlay() {
        injectVisualFxStyles();
        if (typeof PIXI === 'undefined' || boardApp) return;
        if (typeof document === 'undefined' || !document.body) return;

        ensureParticleTextures();

        try {
            var w = document.documentElement.clientWidth || window.innerWidth || 420;
            var h = document.documentElement.clientHeight || window.innerHeight || 780;

            boardApp = new PIXI.Application({
                width: w,
                height: h,
                backgroundAlpha: 0,
                antialias: true,
                resolution: Math.min(window.devicePixelRatio || 1, 2),
                autoDensity: true
            });

            var canvas = boardApp.view;
            canvas.id = 'board-pixi-overlay';
            canvas.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:180001;';
            document.body.appendChild(canvas);

            boardFxContainer = new PIXI.Container();
            boardApp.stage.addChild(boardFxContainer);

            boardApp.ticker.stop();
            boardTickerRunning = false;

            boardApp.ticker.add(function (delta) {
                var dtSec = (delta / 60);

                // Cập nhật vòng sóng ánh sáng Shockwave tại tâm ô ghép
                for (var r = boardActiveRings.length - 1; r >= 0; r--) {
                    var rg = boardActiveRings[r];
                    rg.elapsed += dtSec;
                    var prog = Math.min(1, rg.elapsed / rg.duration);
                    var easeOut = 1 - Math.pow(1 - prog, 3);
                    rg.sprite.scale.set(rg.startScale + (rg.endScale - rg.startScale) * easeOut);
                    rg.sprite.alpha = rg.startAlpha * (1 - prog);
                    if (prog >= 1) {
                        if (rg.sprite.parent) rg.sprite.parent.removeChild(rg.sprite);
                        rg.sprite.destroy();
                        boardActiveRings.splice(r, 1);
                    }
                }

                // Cập nhật các @pixi/particle-emitter đang nổ
                for (var i = boardActiveEmitters.length - 1; i >= 0; i--) {
                    var entry = boardActiveEmitters[i];
                    entry.emitter.update(dtSec);
                    entry.life -= dtSec;
                    if (entry.life <= 0 && entry.emitter.particleCount === 0) {
                        entry.emitter.destroy();
                        if (entry.container && entry.container.parent) {
                            entry.container.parent.removeChild(entry.container);
                        }
                        boardActiveEmitters.splice(i, 1);
                    }
                }

                if (boardActiveEmitters.length === 0 && boardActiveRings.length === 0) {
                    boardApp.renderer.render(boardApp.stage);
                    boardApp.ticker.stop();
                    boardTickerRunning = false;
                }
            });

            window.addEventListener('resize', function () {
                if (boardApp && boardApp.renderer) {
                    var nw = document.documentElement.clientWidth || window.innerWidth;
                    var nh = document.documentElement.clientHeight || window.innerHeight;
                    boardApp.renderer.resize(nw, nh);
                }
            });
        } catch (e) {
            console.warn('Board Pixi overlay notice:', e);
        }
    }

    // Đồng bộ hiệu ứng phát sáng ôm sát viền: chỉ áp dụng cho Đèn bão (congcu) từ Level 6 và Lửa/Bếp (bep) từ Level 6
    function syncBoardItemGlows() {
        injectVisualFxStyles();
        var gridBoard = document.getElementById('grid-board');
        if (!gridBoard) return;

        var cells = gridBoard.children;
        for (var i = 0; i < cells.length; i++) {
            var cell = cells[i];
            if (!cell || cell.classList.contains('locked')) continue;
            var img = cell.querySelector('.item-img');
            if (!img) continue;
            var id = img.dataset ? img.dataset.id : '';
            img.classList.remove('vfx-glow-lantern', 'vfx-glow-fire');
            if (!id) continue;

            if (id.indexOf('congcu_lv') === 0) {
                var lv = parseInt(id.split('_lv')[1], 10) || 1;
                if (lv >= 6) {
                    img.classList.add('vfx-glow-lantern');
                }
            }
        }
    }

    // Lấy tọa độ tâm chính xác tuyệt đối của vật phẩm trong ô bàn cờ
    function getCellExactCenter(cellEl) {
        if (!cellEl) return null;
        if (boardApp && boardApp.renderer) {
            var vw = document.documentElement.clientWidth || window.innerWidth;
            var vh = document.documentElement.clientHeight || window.innerHeight;
            if (Math.abs(boardApp.screen.width - vw) > 2 || Math.abs(boardApp.screen.height - vh) > 2) {
                boardApp.renderer.resize(vw, vh);
            }
        }
        var rect = cellEl.getBoundingClientRect();
        if (!rect || !rect.width) return null;
        return {
            x: rect.left + rect.width * 0.5,
            y: rect.top + rect.height * 0.5,
            size: rect.width
        };
    }

    // Đặt container của Emitter trực tiếp tại tâm (cx, cy) và giữ pos: { x: 0, y: 0 }
    function spawnPixiEmitterAtCenter(cx, cy, config, durationSec) {
        if (typeof PIXI === 'undefined' || !PIXI.particles || !PIXI.particles.Emitter) return false;
        if (typeof window !== 'undefined' && window.autoBotRunning) return true;
        if (!boardApp) initBoardPixiOverlay();
        if (!boardApp || !boardFxContainer) return false;

        try {
            var container = new PIXI.Container();
            container.position.set(cx, cy);
            boardFxContainer.addChild(container);

            var emitter = new PIXI.particles.Emitter(container, config);
            emitter.emit = true;
            boardActiveEmitters.push({
                emitter: emitter,
                container: container,
                life: durationSec || 0.55
            });
            wakeBoardTicker();
            return true;
        } catch (e) {
            return false;
        }
    }

    // 1. Tia sáng nổ tung đúng tâm khi ghép 2 món đồ bằng @pixi/particle-emitter
    function emitMergeBurst(cellEl, itemId) {
        if (!cellEl || (typeof window !== 'undefined' && window.autoBotRunning)) return false;
        if (!boardApp) initBoardPixiOverlay();
        ensureParticleTextures();
        if (!boardApp || !sparkTex || !softDotTex || !ringTex) return false;

        var center = getCellExactCenter(cellEl);
        if (!center) return false;

        var cx = center.x;
        var cy = center.y;

        var line = itemId ? String(itemId).split('_lv')[0] : '';
        var startColor = '#ffffff';
        var midColor = '#ffd54f';
        var endColor = '#ff9800';

        if (line === 'trai' || line === 'ban' || line === 'ghe') {
            startColor = '#ffffff';
            midColor = '#b9f6ca';
            endColor = '#ffd54f';
        }

        // Vòng sóng ánh sáng (Shockwave Ring) bung tròn đều từ tâm vật phẩm
        var ringSprite = new PIXI.Sprite(ringTex);
        ringSprite.anchor.set(0.5);
        ringSprite.position.set(cx, cy);
        ringSprite.tint = 0xfff59d;
        var targetRingScale = (center.size / 96) * 1.45;
        ringSprite.scale.set(targetRingScale * 0.25);
        ringSprite.alpha = 0.85;
        boardFxContainer.addChild(ringSprite);
        boardActiveRings.push({
            sprite: ringSprite,
            elapsed: 0,
            duration: 0.28,
            startScale: targetRingScale * 0.25,
            endScale: targetRingScale,
            startAlpha: 0.85
        });

        var emitterCfg = {
            lifetime: { min: 0.28, max: 0.52 },
            frequency: 0.001,
            particlesPerWave: 18,
            emitterLifetime: 0.03,
            maxParticles: 18,
            addAtBack: false,
            pos: { x: 0, y: 0 },
            behaviors: [
                {
                    type: 'alpha',
                    config: {
                        alpha: {
                            list: [
                                { time: 0, value: 1 },
                                { time: 0.65, value: 0.85 },
                                { time: 1, value: 0 }
                            ]
                        }
                    }
                },
                {
                    type: 'moveSpeed',
                    config: {
                        speed: {
                            list: [
                                { time: 0, value: 165 },
                                { time: 0.5, value: 75 },
                                { time: 1, value: 18 }
                            ]
                        }
                    }
                },
                {
                    type: 'scale',
                    config: {
                        scale: {
                            list: [
                                { time: 0, value: 0.35 },
                                { time: 0.3, value: 0.68 },
                                { time: 1, value: 0.1 }
                            ]
                        }
                    }
                },
                {
                    type: 'color',
                    config: {
                        color: {
                            list: [
                                { time: 0, value: startColor },
                                { time: 0.45, value: midColor },
                                { time: 1, value: endColor }
                            ]
                        }
                    }
                },
                {
                    type: 'rotation',
                    config: { minStart: 0, maxStart: 360, minSpeed: -160, maxSpeed: 160, accel: 0 }
                },
                {
                    type: 'textureRandom',
                    config: { textures: [sparkTex, softDotTex] }
                },
                {
                    type: 'burstSpawn',
                    config: {
                        spacing: 20,
                        start: 0,
                        distance: 4
                    }
                }
            ]
        };

        return spawnPixiEmitterAtCenter(cx, cy, emitterCfg, 0.55);
    }

    // 2. Bụi cỏ tung lên đúng tâm ô khi phá khóa đất (🔒 / đá) hoặc ô mạng nhện bằng @pixi/particle-emitter
    function emitUnlockGrassDust(cellEl, isRockBreak) {
        if (!cellEl || (typeof window !== 'undefined' && window.autoBotRunning)) return false;
        if (!boardApp) initBoardPixiOverlay();
        ensureParticleTextures();
        if (!boardApp || !leafTex || !smokeTex) return false;

        var center = getCellExactCenter(cellEl);
        if (!center) return false;

        var grassCfg = {
            lifetime: { min: 0.35, max: 0.65 },
            frequency: 0.001,
            particlesPerWave: 18,
            emitterLifetime: 0.04,
            maxParticles: 18,
            addAtBack: false,
            pos: { x: 0, y: 0 },
            behaviors: [
                {
                    type: 'alpha',
                    config: {
                        alpha: {
                            list: [
                                { time: 0, value: 0.92 },
                                { time: 0.65, value: 0.7 },
                                { time: 1, value: 0 }
                            ]
                        }
                    }
                },
                {
                    type: 'moveAcceleration',
                    config: {
                        accel: { x: 0, y: 280 },
                        minStart: 80,
                        maxStart: 155,
                        rotate: true
                    }
                },
                {
                    type: 'scale',
                    config: {
                        scale: {
                            list: [
                                { time: 0, value: 0.42 },
                                { time: 0.4, value: 0.62 },
                                { time: 1, value: 0.16 }
                            ]
                        }
                    }
                },
                {
                    type: 'color',
                    config: {
                        color: {
                            list: [
                                { time: 0, value: isRockBreak ? '#aed581' : '#c5e1a5' },
                                { time: 0.5, value: '#7cb342' },
                                { time: 1, value: '#8d6e63' }
                            ]
                        }
                    }
                },
                {
                    type: 'rotation',
                    config: { minStart: 0, maxStart: 360, minSpeed: -220, maxSpeed: 220, accel: 0 }
                },
                {
                    type: 'textureRandom',
                    config: { textures: [leafTex, smokeTex] }
                },
                {
                    type: 'spawnShape',
                    config: {
                        type: 'torus',
                        data: { x: 0, y: 0, radius: 10, innerRadius: 2, affectRotation: true }
                    }
                }
            ]
        };

        return spawnPixiEmitterAtCenter(center.x, center.y, grassCfg, 0.7);
    }

    // =========================================================================
    // PHẦN 2: MÀN HÌNH "TRẠI CỦA BẠN" (PIXI.JS + PARTICLE-EMITTER)
    // - Tia nắng chiều dịu nhẹ chiếu xiên qua rừng thông
    // - Khói trắng mảnh mai và tàn lửa nhỏ bay lên từ đống lửa trại / bếp trại
    // - Đom đóm / hạt nắng vàng nhỏ bay lơ lửng quanh cột đèn bão
    // =========================================================================
    function initOrUpdateCampPixiEffects() {
        if (typeof PIXI === 'undefined') return;
        var stageEl = document.getElementById('mycamp-stage');
        if (!stageEl) return;

        ensureParticleTextures();

        var cfg = (typeof MYCAMP_CONFIG !== 'undefined' && MYCAMP_CONFIG) ? MYCAMP_CONFIG : {};
        var bgCfg = cfg.background || {};
        var w = bgCfg.width || 460;
        var h = bgCfg.height || 569;

        if (!campApp) {
            try {
                campApp = new PIXI.Application({
                    width: w,
                    height: h,
                    backgroundAlpha: 0,
                    antialias: true,
                    resolution: Math.min(window.devicePixelRatio || 1, 2),
                    autoDensity: true
                });

                var view = campApp.view;
                view.id = 'mycamp-pixi-canvas';
                view.style.cssText = 'position:absolute;left:0;top:0;width:' + w + 'px;height:' + h + 'px;pointer-events:none;z-index:22;';
                stageEl.appendChild(view);

                campSunbeamContainer = new PIXI.Container();
                campParticleContainer = new PIXI.Container();

                campApp.stage.addChild(campSunbeamContainer);
                campApp.stage.addChild(campParticleContainer);

                // 1. Các dải nắng chiều chiếu xiên dịu nhẹ qua rừng thông (hoàn toàn trong suốt)
                var rayConfigs = [
                    { x: 115, y: 185, width: 75, height: 310, alpha: 0.28, phase: 0 },
                    { x: 215, y: 205, width: 95, height: 340, alpha: 0.32, phase: 1.6 },
                    { x: 315, y: 215, width: 70, height: 290, alpha: 0.24, phase: 3.1 }
                ];
                for (var r = 0; r < rayConfigs.length; r++) {
                    var rc = rayConfigs[r];
                    var ray = new PIXI.Sprite(sunbeamTex);
                    ray.anchor.set(0.5);
                    ray.x = rc.x;
                    ray.y = rc.y;
                    ray.width = rc.width;
                    ray.height = rc.height;
                    ray.rotation = -0.42;
                    ray.alpha = rc.alpha;
                    campSunbeamContainer.addChild(ray);
                    campSunbeams.push({
                        sprite: ray,
                        baseAlpha: rc.alpha,
                        baseX: rc.x,
                        phase: rc.phase
                    });
                }

                // 2. @pixi/particle-emitter: Khói trắng và tàn lửa bay lên từ đống lửa trại + đom đóm đèn bão (từ Level 6)
                if (PIXI.particles && PIXI.particles.Emitter) {
                    campSmokeContainer = new PIXI.Container();
                    campSmokeContainer.position.set(209, 406);
                    campParticleContainer.addChild(campSmokeContainer);

                    campSmokeEmitter = new PIXI.particles.Emitter(campSmokeContainer, {
                        lifetime: { min: 0.7, max: 1.2 },
                        frequency: 0.25,
                        emitterLifetime: -1,
                        maxParticles: 10,
                        addAtBack: true,
                        pos: { x: 0, y: 0 },
                        behaviors: [
                            {
                                type: 'alpha',
                                config: {
                                    alpha: {
                                        list: [
                                            { time: 0, value: 0.0 },
                                            { time: 0.25, value: 0.25 },
                                            { time: 0.7, value: 0.12 },
                                            { time: 1, value: 0 }
                                        ]
                                    }
                                }
                            },
                            {
                                type: 'moveAcceleration',
                                config: {
                                    accel: { x: 0.8, y: -1.5 },
                                    minStart: 2,
                                    maxStart: 3.5,
                                    rotate: false
                                }
                            },
                            {
                                type: 'scale',
                                config: {
                                    scale: {
                                        list: [
                                            { time: 0, value: 0.16 },
                                            { time: 0.5, value: 0.3 },
                                            { time: 1, value: 0.45 }
                                        ]
                                    }
                                }
                            },
                            {
                                type: 'color',
                                config: {
                                    color: {
                                        list: [
                                            { time: 0, value: '#fff8e1' },
                                            { time: 0.4, value: '#f5f5f5' },
                                            { time: 1, value: '#cfd8dc' }
                                        ]
                                    }
                                }
                            },
                            {
                                type: 'rotation',
                                config: { minStart: -96, maxStart: -84, minSpeed: -10, maxSpeed: 10, accel: 0 }
                            },
                            {
                                type: 'textureSingle',
                                config: { texture: smokeTex }
                            },
                            {
                                type: 'spawnShape',
                                config: {
                                    type: 'torus',
                                    data: { x: 0, y: 0, radius: 5, innerRadius: 0, affectRotation: false }
                                }
                            }
                        ]
                    });

                    campEmberContainer = new PIXI.Container();
                    campEmberContainer.position.set(209, 414);
                    campParticleContainer.addChild(campEmberContainer);

                    campEmberEmitter = new PIXI.particles.Emitter(campEmberContainer, {
                        lifetime: { min: 0.45, max: 0.8 },
                        frequency: 0.1,
                        particlesPerWave: 1,
                        emitterLifetime: -1,
                        maxParticles: 16,
                        addAtBack: false,
                        pos: { x: 0, y: 0 },
                        behaviors: [
                            {
                                type: 'alpha',
                                config: {
                                    alpha: {
                                        list: [
                                            { time: 0, value: 0.95 },
                                            { time: 0.5, value: 0.7 },
                                            { time: 1, value: 0 }
                                        ]
                                    }
                                }
                            },
                            {
                                type: 'moveAcceleration',
                                config: {
                                    accel: { x: 1, y: -3 },
                                    minStart: 2.2,
                                    maxStart: 5,
                                    rotate: false
                                }
                            },
                            {
                                type: 'scale',
                                config: {
                                    scale: {
                                        list: [
                                            { time: 0, value: 0.16 },
                                            { time: 0.35, value: 0.2 },
                                            { time: 1, value: 0.03 }
                                        ]
                                    }
                                }
                            },
                            {
                                type: 'color',
                                config: {
                                    color: {
                                        list: [
                                            { time: 0, value: '#fff9c4' },
                                            { time: 0.35, value: '#ffd54f' },
                                            { time: 0.7, value: '#ff9100' },
                                            { time: 1, value: '#ff3d00' }
                                        ]
                                    }
                                }
                            },
                            {
                                type: 'rotationStatic',
                                config: { min: -112, max: -68 }
                            },
                            {
                                type: 'textureSingle',
                                config: { texture: softDotTex }
                            },
                            {
                                type: 'spawnShape',
                                config: {
                                    type: 'torus',
                                    data: { x: 0, y: 0, radius: 7, innerRadius: 0, affectRotation: false }
                                }
                            }
                        ]
                    });

                    campFireflyContainer = new PIXI.Container();
                    campFireflyContainer.position.set(235, 265);
                    campParticleContainer.addChild(campFireflyContainer);

                    campFireflyEmitter = new PIXI.particles.Emitter(campFireflyContainer, {
                        lifetime: { min: 1.5, max: 2.8 },
                        frequency: 0.35,
                        emitterLifetime: -1,
                        maxParticles: 10,
                        addAtBack: false,
                        pos: { x: 0, y: 0 },
                        behaviors: [
                            {
                                type: 'alpha',
                                config: {
                                    alpha: {
                                        list: [
                                            { time: 0, value: 0 },
                                            { time: 0.35, value: 0.75 },
                                            { time: 0.75, value: 0.6 },
                                            { time: 1, value: 0 }
                                        ]
                                    }
                                }
                            },
                            {
                                type: 'moveSpeed',
                                config: {
                                    speed: {
                                        list: [
                                            { time: 0, value: 8 },
                                            { time: 1, value: 3 }
                                        ]
                                    }
                                }
                            },
                            {
                                type: 'scale',
                                config: {
                                    scale: {
                                        list: [
                                            { time: 0, value: 0.1 },
                                            { time: 0.5, value: 0.22 },
                                            { time: 1, value: 0.06 }
                                        ]
                                    }
                                }
                            },
                            {
                                type: 'color',
                                config: {
                                    color: {
                                        list: [
                                            { time: 0, value: '#fffde7' },
                                            { time: 1, value: '#ffd54f' }
                                        ]
                                    }
                                }
                            },
                            {
                                type: 'rotation',
                                config: { minStart: 0, maxStart: 360, minSpeed: -45, maxSpeed: 45, accel: 0 }
                            },
                            {
                                type: 'textureRandom',
                                config: { textures: [sparkTex, softDotTex] }
                            },
                            {
                                type: 'spawnShape',
                                config: {
                                    type: 'torus',
                                    data: { x: 0, y: 0, radius: 24, innerRadius: 4, affectRotation: false }
                                }
                            }
                        ]
                    });
                }

                var campElapsed = 0;
                campApp.ticker.add(function (delta) {
                    var myCampScreen = document.getElementById('my-camp-screen');
                    if (!myCampScreen || myCampScreen.style.display === 'none' || document.hidden) {
                        if (campApp && campApp.ticker && campApp.ticker.started) {
                            campApp.ticker.stop();
                        }
                        return;
                    }

                    var dtSec = delta / 60;
                    campElapsed += dtSec;

                    for (var i = 0; i < campSunbeams.length; i++) {
                        var sb = campSunbeams[i];
                        var wave = 0.75 + Math.sin(campElapsed * 0.9 + sb.phase) * 0.25;
                        sb.sprite.alpha = sb.baseAlpha * wave;
                        sb.sprite.x = sb.baseX + Math.sin(campElapsed * 0.5 + sb.phase) * 6;
                    }

                    if (campSmokeEmitter) campSmokeEmitter.update(dtSec);
                    if (campEmberEmitter) campEmberEmitter.update(dtSec);
                    if (campFireflyEmitter) campFireflyEmitter.update(dtSec);

                    for (var eIdx = campExtraEmitters.length - 1; eIdx >= 0; eIdx--) {
                        var ex = campExtraEmitters[eIdx];
                        ex.emitter.update(dtSec);
                        ex.life -= dtSec;
                        if (ex.life <= 0 && ex.emitter.particleCount === 0) {
                            ex.emitter.destroy();
                            if (ex.container && ex.container.parent) {
                                ex.container.parent.removeChild(ex.container);
                            }
                            campExtraEmitters.splice(eIdx, 1);
                        }
                    }
                });

                // Tạm dừng ticker ngay lập tức nếu Trại chưa mở hoặc đang ẩn
                var initCampScreen = document.getElementById('my-camp-screen');
                if (!initCampScreen || initCampScreen.style.display === 'none') {
                    campApp.ticker.stop();
                }
            } catch (e) {
                console.warn('MyCamp Pixi init notice:', e);
            }
        }

        if (campApp && campApp.view && campApp.view.parentNode !== stageEl) {
            stageEl.appendChild(campApp.view);
        }

        // Đồng bộ vị trí & trạng thái hiệu ứng Đèn bão (chỉ áp dụng từ Level 6: congcu_lv6..12)
        var slotLampEl = document.getElementById('mycamp-slot-lamp');
        var lampImg = slotLampEl ? slotLampEl.querySelector('img') : null;
        var lampItemId = slotLampEl ? (slotLampEl.getAttribute('data-item-id') || '') : '';
        var lampLv = (lampItemId.indexOf('congcu_lv') === 0) ? (parseInt(lampItemId.split('_lv')[1], 10) || 0) : 0;
        var hasLampLv6 = !!(slotLampEl && slotLampEl.style.display !== 'none' && lampImg && lampLv >= 6);

        if (lampImg) {
            if (hasLampLv6) {
                lampImg.classList.add('vfx-glow-lantern');
            } else {
                lampImg.classList.remove('vfx-glow-lantern');
            }
        }
        if (campFireflyContainer && slotLampEl) {
            var lx = parseFloat(slotLampEl.style.left || 226) + (parseFloat(slotLampEl.style.width || 18) * 0.5);
            var ly = parseFloat(slotLampEl.style.top || 256) + (parseFloat(slotLampEl.style.width || 18) * 0.55);
            campFireflyContainer.position.set(lx, ly);
        }
        if (campFireflyEmitter) {
            campFireflyEmitter.emit = hasLampLv6;
        }

        // Đồng bộ vị trí & trạng thái hiệu ứng cháy + khói + tàn lửa ở Bếp (chỉ áp dụng từ Level 6: bep_lv6..12)
        var slotStoveEl = document.getElementById('mycamp-slot-stove');
        var stoveImg = slotStoveEl ? slotStoveEl.querySelector('img') : null;
        var eq = (typeof SAVE !== 'undefined' && SAVE && SAVE.myCampEquipped) ? SAVE.myCampEquipped : {};
        var stoveVal = eq.stove;
        var stoveId = (typeof stoveVal === 'object' && stoveVal) ? stoveVal.id : (stoveVal || '');
        if (!stoveId && slotStoveEl) {
            stoveId = slotStoveEl.getAttribute('data-item-id') || '';
        }
        var stoveLv = (String(stoveId).indexOf('bep_lv') === 0) ? (parseInt(String(stoveId).split('_lv')[1], 10) || 0) : 0;
        var hasStoveLv6 = !!(slotStoveEl && slotStoveEl.style.display !== 'none' && stoveImg && stoveLv >= 6);

        if (stoveImg) {
            stoveImg.classList.remove('vfx-glow-fire');
        }
        if (slotStoveEl && (campSmokeContainer || campEmberContainer)) {
            var sx = parseFloat(slotStoveEl.style.left || 180) + (parseFloat(slotStoveEl.style.width || 58) * 0.5);
            var sy = parseFloat(slotStoveEl.style.top || 395) + 15;
            if (campSmokeContainer) campSmokeContainer.position.set(sx, sy - 4);
            if (campEmberContainer) campEmberContainer.position.set(sx, sy + 4);
        }
        if (campSmokeEmitter) campSmokeEmitter.emit = hasStoveLv6;
        if (campEmberEmitter) campEmberEmitter.emit = hasStoveLv6;

        var myCampScreenEl = document.getElementById('my-camp-screen');
        if (campApp && campApp.ticker) {
            if (myCampScreenEl && myCampScreenEl.style.display !== 'none' && !document.hidden) {
                if (!campApp.ticker.started) campApp.ticker.start();
            } else {
                if (campApp.ticker.started) campApp.ticker.stop();
            }
        }
    }

    function pauseCampPixiFx() {
        if (campApp && campApp.ticker && campApp.ticker.started) {
            campApp.ticker.stop();
        }
    }

    function resumeCampPixiFx() {
        var myCampScreenEl = document.getElementById('my-camp-screen');
        if (campApp && campApp.ticker && !campApp.ticker.started && !document.hidden) {
            if (myCampScreenEl && myCampScreenEl.style.display !== 'none') {
                campApp.ticker.start();
            }
        }
    }

    // Bụi cỏ tung lên dưới chân lều / bàn gỗ trên đảo khi vật phẩm rơi từ trên trời xuống chạm đất
    function emitCampItemLandingDust(x, y) {
        if (!campApp || !campParticleContainer || !PIXI.particles || !PIXI.particles.Emitter) return;
        ensureParticleTextures();
        try {
            var dustContainer = new PIXI.Container();
            dustContainer.position.set(x, y);
            campParticleContainer.addChild(dustContainer);

            var dustEmitter = new PIXI.particles.Emitter(dustContainer, {
                lifetime: { min: 0.35, max: 0.65 },
                frequency: 0.001,
                particlesPerWave: 18,
                emitterLifetime: 0.04,
                maxParticles: 18,
                addAtBack: false,
                pos: { x: 0, y: 0 },
                behaviors: [
                    {
                        type: 'alpha',
                        config: {
                            alpha: {
                                list: [
                                    { time: 0, value: 0.88 },
                                    { time: 0.6, value: 0.6 },
                                    { time: 1, value: 0 }
                                ]
                            }
                        }
                    },
                    {
                        type: 'moveAcceleration',
                        config: {
                            accel: { x: 0, y: 230 },
                            minStart: 70,
                            maxStart: 145,
                            rotate: true
                        }
                    },
                    {
                        type: 'scale',
                        config: {
                            scale: {
                                list: [
                                    { time: 0, value: 0.38 },
                                    { time: 0.5, value: 0.58 },
                                    { time: 1, value: 0.18 }
                                ]
                            }
                        }
                    },
                    {
                        type: 'color',
                        config: {
                            color: {
                                list: [
                                    { time: 0, value: '#dce775' },
                                    { time: 0.5, value: '#8bc34a' },
                                    { time: 1, value: '#d7ccc8' }
                                ]
                            }
                        }
                    },
                    {
                        type: 'rotation',
                        config: { minStart: -165, maxStart: -15, minSpeed: -180, maxSpeed: 180, accel: 0 }
                    },
                    {
                        type: 'textureRandom',
                        config: { textures: [leafTex, smokeTex] }
                    },
                    {
                        type: 'spawnShape',
                        config: {
                            type: 'rect',
                            data: { x: -26, y: -4, w: 52, h: 8 }
                        }
                    }
                ]
            });
            dustEmitter.emit = true;
            campExtraEmitters.push({ emitter: dustEmitter, container: dustContainer, life: 0.72 });
        } catch (e) {}
    }

    // =========================================================================
    // PHẦN 3: HIỆU ỨNG "NHÚN NHẢY" (JUICINESS) VỚI GSAP + MOTIONPATHPLUGIN
    // =========================================================================

    function gsapFlyFromGenerator(sourceEl, targetCell, flyerEl, dx, dy, itemLv, onLandCallback) {
        if (typeof window === 'undefined' || !window.gsap || (window.autoBotRunning)) {
            return false;
        }
        var gsap = window.gsap;

        if (sourceEl) {
            gsap.killTweensOf(sourceEl);
            gsap.fromTo(sourceEl,
                { scaleX: 1.18, scaleY: 0.82 },
                { scaleX: 1, scaleY: 1, duration: 0.46, ease: 'elastic.out(1, 0.42)', overwrite: 'auto' }
            );
        }

        var peakX = dx * 0.48;
        var peakY = Math.min(-42, Math.min(0, dy * 0.45) - 52);
        var tiltDeg = (dx >= 0 ? 1 : -1) * (14 + Math.random() * 10);

        gsap.set(flyerEl, { x: 0, y: 0, scale: 0.45, rotation: 0, opacity: 1 });

        var tl = gsap.timeline({
            onComplete: function () {
                if (typeof onLandCallback === 'function') {
                    onLandCallback();
                }
                var targetImg = targetCell ? targetCell.querySelector('.item-img') : null;
                if (targetImg) {
                    gsap.killTweensOf(targetImg);
                    var peakBounce = (itemLv >= 3) ? 1.28 : ((itemLv === 2) ? 1.2 : 1.14);
                    gsap.timeline()
                        .set(targetImg, { transformOrigin: '50% 85%' })
                        .fromTo(targetImg,
                            { scaleX: 1.24, scaleY: 0.76, y: 4 },
                            { scaleX: 0.92, scaleY: peakBounce, y: -7, duration: 0.13, ease: 'power2.out' }
                        )
                        .to(targetImg, {
                            scaleX: 1,
                            scaleY: 1,
                            y: 0,
                            duration: 0.36,
                            ease: 'elastic.out(1, 0.5)'
                        });
                }
            }
        });

        if (window.MotionPathPlugin) {
            tl.to(flyerEl, {
                duration: 0.32,
                scale: 1.05,
                rotation: tiltDeg,
                ease: 'power1.inOut',
                motionPath: {
                    path: [
                        { x: 0, y: 0 },
                        { x: peakX, y: peakY },
                        { x: dx, y: dy }
                    ],
                    curviness: 1.5
                }
            });
        } else {
            tl.to(flyerEl, {
                x: dx,
                duration: 0.32,
                ease: 'none'
            }, 0).to(flyerEl, {
                keyframes: [
                    { y: peakY, scale: 1.12, rotation: tiltDeg * 0.6, duration: 0.15, ease: 'power2.out' },
                    { y: dy, scale: 1.0, rotation: tiltDeg, duration: 0.17, ease: 'power2.in' }
                ]
            }, 0);
        }

        return true;
    }

    function gsapElasticMergePop(cellEl, itemId) {
        if (!cellEl || (typeof window !== 'undefined' && window.autoBotRunning)) return false;

        emitMergeBurst(cellEl, itemId);
        syncBoardItemGlows();

        var img = cellEl.querySelector('.item-img');
        if (!img || typeof window === 'undefined' || !window.gsap) return false;

        try {
            if (img.getAnimations) {
                var anims = img.getAnimations();
                for (var a = 0; a < anims.length; a++) {
                    if (anims[a] && anims[a].cancel) anims[a].cancel();
                }
            }
        } catch (e) {}

        var gsap = window.gsap;
        gsap.killTweensOf(img);
        gsap.set(img, { transformOrigin: '50% 50%', scale: 0 });
        gsap.timeline()
            .to(img, {
                scale: 1.2,
                duration: 0.14,
                ease: 'power2.out'
            })
            .to(img, {
                scale: 1.0,
                duration: 0.58,
                ease: 'elastic.out(1, 0.5)'
            });

        return true;
    }

    function gsapDropCampItemOnIsland(slotKey) {
        if (!slotKey || typeof window === 'undefined' || !window.gsap) return;
        var slotEl = document.getElementById('mycamp-slot-' + slotKey);
        if (!slotEl || slotEl.style.display === 'none') return;

        var gsap = window.gsap;
        var img = slotEl.querySelector('img') || slotEl;
        gsap.killTweensOf(img);

        var xCenter = parseFloat(slotEl.style.left || 180) + (parseFloat(slotEl.style.width || 80) * 0.5);
        var yBottom = parseFloat(slotEl.style.top || 320) + (parseFloat(slotEl.style.height || 70) * 0.75);

        gsap.set(img, { transformOrigin: '50% 90%', y: -150, scaleX: 0.84, scaleY: 1.18, opacity: 0 });
        gsap.timeline()
            .to(img, {
                y: 0,
                opacity: 1,
                scaleX: 0.92,
                scaleY: 1.1,
                duration: 0.28,
                ease: 'power3.in',
                onComplete: function () {
                    emitCampItemLandingDust(xCenter, yBottom);
                }
            })
            .to(img, {
                scaleX: 1.28,
                scaleY: 0.72,
                duration: 0.09,
                ease: 'power2.out'
            })
            .to(img, {
                scaleX: 1,
                scaleY: 1,
                duration: 0.62,
                ease: 'elastic.out(1, 0.45)'
            });
    }

    function onCampSceneRendered(forceDropSlotKey) {
        var screenEl = document.getElementById('my-camp-screen');
        var isVisible = screenEl && screenEl.style.display !== 'none';
        if (!isVisible) return false;

        initOrUpdateCampPixiEffects();

        var eq = (typeof SAVE !== 'undefined' && SAVE && SAVE.myCampEquipped) ? SAVE.myCampEquipped : {};
        var slots = ['tent', 'table', 'chair1', 'chair2', 'stove', 'lamp'];
        var droppedAny = false;

        if (forceDropSlotKey) {
            gsapDropCampItemOnIsland(forceDropSlotKey);
            droppedAny = true;
        } else {
            slots.forEach(function (sk) {
                var curVal = eq[sk];
                var curId = (typeof curVal === 'object' && curVal) ? curVal.id : curVal;
                if (curId && lastEquippedSnapshot[sk] && lastEquippedSnapshot[sk] !== curId) {
                    gsapDropCampItemOnIsland(sk);
                    droppedAny = true;
                }
            });
        }

        slots.forEach(function (sk) {
            var curVal = eq[sk];
            lastEquippedSnapshot[sk] = (typeof curVal === 'object' && curVal) ? curVal.id : (curVal || null);
        });

        return droppedAny;
    }

    function bootVisualFx() {
        injectVisualFxStyles();
        syncBoardItemGlows();
        if (typeof window !== 'undefined' && window.requestIdleCallback) {
            window.requestIdleCallback(function () {
                initBoardPixiOverlay();
            }, { timeout: 1500 });
        } else {
            setTimeout(initBoardPixiOverlay, 800);
        }
    }

    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', bootVisualFx);
        } else {
            setTimeout(bootVisualFx, 50);
        }

        // Tự động tạm dừng toàn bộ WebGL loop/ticker khi tab ẩn hoặc khi người dùng chuyển sang Photoshop/ứng dụng khác
        document.addEventListener('visibilitychange', function () {
            if (document.hidden) {
                pauseCampPixiFx();
                if (boardApp && boardApp.ticker && boardTickerRunning) {
                    boardApp.ticker.stop();
                    boardTickerRunning = false;
                }
            } else {
                resumeCampPixiFx();
            }
        });
    }

    window.VISUAL_FX = {
        initTopSceneWeatherPixi: initTopSceneWeatherPixi,
        initBoardPixiOverlay: initBoardPixiOverlay,
        syncBoardItemGlows: syncBoardItemGlows,
        emitMergeBurst: emitMergeBurst,
        emitUnlockGrassDust: emitUnlockGrassDust,
        gsapFlyFromGenerator: gsapFlyFromGenerator,
        gsapElasticMergePop: gsapElasticMergePop,
        initOrUpdateCampPixiEffects: initOrUpdateCampPixiEffects,
        pauseCampPixiFx: pauseCampPixiFx,
        resumeCampPixiFx: resumeCampPixiFx,
        gsapDropCampItemOnIsland: gsapDropCampItemOnIsland,
        onCampSceneRendered: onCampSceneRendered
    };
})();
