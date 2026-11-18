/**
 * Generator thư viện âm thanh miễn phí (CC0 / Public Domain) chuẩn 44.1kHz 16-bit Stereo
 * Tạo 28 file hiệu ứng âm thanh (SFX) âm sắc sáng, trong trẻo, lấp lánh tại assets/sfx_library/
 * và 5 bản nhạc nền (BGM) cắm trại vui tươi, bắt tai tại assets/music/
 */
const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;
const SFX_DIR = path.join(__dirname, '..', 'assets', 'sfx_library');
const MUSIC_DIR = path.join(__dirname, '..', 'assets', 'music');

if (!fs.existsSync(SFX_DIR)) fs.mkdirSync(SFX_DIR, { recursive: true });
if (!fs.existsSync(MUSIC_DIR)) fs.mkdirSync(MUSIC_DIR, { recursive: true });

function writeStereoWav(filePath, leftChannel, rightChannel) {
    const numSamples = leftChannel.length;
    const buffer = Buffer.alloc(44 + numSamples * 4);

    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + numSamples * 4, 4);
    buffer.write('WAVEfmt ', 8);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20); // PCM
    buffer.writeUInt16LE(2, 22); // Stereo (2 channels)
    buffer.writeUInt32LE(SAMPLE_RATE, 24);
    buffer.writeUInt32LE(SAMPLE_RATE * 4, 28);
    buffer.writeUInt16LE(4, 32);
    buffer.writeUInt16LE(16, 34);
    buffer.write('data', 36);
    buffer.writeUInt32LE(numSamples * 4, 40);

    for (let i = 0; i < numSamples; i++) {
        const l = Math.max(-1, Math.min(1, leftChannel[i]));
        const r = Math.max(-1, Math.min(1, rightChannel[i]));
        buffer.writeInt16LE(l < 0 ? (l * 0x8000) | 0 : (l * 0x7FFF) | 0, 44 + i * 4);
        buffer.writeInt16LE(r < 0 ? (r * 0x8000) | 0 : (r * 0x7FFF) | 0, 44 + i * 4 + 2);
    }
    fs.writeFileSync(filePath, buffer);
}

// Bộ cộng hưởng chuông pha lê / Celesta / Kalimba sáng (Multi-harmonic FM + Shimmer)
function addNote(L, R, startSec, durSec, freq, amp, opts = {}) {
    const startIdx = Math.floor(startSec * SAMPLE_RATE);
    const len = Math.floor(durSec * SAMPLE_RATE);
    const attack = opts.attack || 0.0025;
    const pan = opts.pan || 0; // -1..1
    const panL = Math.cos((pan + 1) * Math.PI / 4);
    const panR = Math.sin((pan + 1) * Math.PI / 4);
    const harmonics = opts.harmonics || [
        { mul: 1.0, amp: 1.0, decay: 1.0 },
        { mul: 2.0, amp: 0.42, decay: 0.65 },
        { mul: 3.0, amp: 0.22, decay: 0.45 },
        { mul: 4.0, amp: 0.10, decay: 0.30 }
    ];
    const pitchStartMul = opts.pitchStartMul || 1.0;
    const pitchSlideSec = opts.pitchSlideSec || 0.022;
    const fmRatio = opts.fmRatio || 2.0;
    const fmIndex = opts.fmIndex || 0.0;

    let phase = 0;
    for (let i = 0; i < len; i++) {
        const idx = startIdx + i;
        if (idx >= L.length) break;
        const t = i / SAMPLE_RATE;

        // Pitch envelope
        let curFreq = freq;
        if (pitchStartMul !== 1.0 && t < pitchSlideSec) {
            const p = t / pitchSlideSec;
            curFreq = freq * (pitchStartMul + (1.0 - pitchStartMul) * (1 - Math.pow(1 - p, 2)));
        }

        // Amplitude envelope
        const envAtk = t < attack ? (t / attack) : 1.0;
        const envDec = Math.exp(-t / (durSec * (opts.decayFactor || 0.28)));
        const env = envAtk * envDec;

        phase += (2 * Math.PI * curFreq) / SAMPLE_RATE;
        let sample = 0;

        for (let h = 0; h < harmonics.length; h++) {
            const hm = harmonics[h];
            const hEnv = Math.exp(-t / (durSec * 0.28 * hm.decay));
            const fmMod = fmIndex > 0 ? fmIndex * hEnv * Math.sin(phase * fmRatio) : 0;
            sample += hm.amp * hEnv * Math.sin(phase * hm.mul + fmMod);
        }

        // Stereo chorus micro-widening
        const stereoSpread = 0.08 * Math.sin(2 * Math.PI * 6.5 * t);
        L[idx] += sample * amp * env * (panL + stereoSpread);
        R[idx] += sample * amp * env * (panR - stereoSpread);
    }
}

// Hàm tạo hiệu ứng Pop / Bubble tần số cao giòn sáng
function addSweepPop(L, R, startSec, durSec, fStart, fEnd, amp, curve = 1.6) {
    const startIdx = Math.floor(startSec * SAMPLE_RATE);
    const len = Math.floor(durSec * SAMPLE_RATE);
    let phase = 0;
    for (let i = 0; i < len; i++) {
        const idx = startIdx + i;
        if (idx >= L.length) break;
        const t = i / SAMPLE_RATE;
        const p = Math.pow(t / durSec, curve);
        const f = fStart + (fEnd - fStart) * p;
        phase += (2 * Math.PI * f) / SAMPLE_RATE;
        const env = (t < 0.002 ? t / 0.002 : 1.0) * Math.pow(1 - t / durSec, 1.8);
        const s = (Math.sin(phase) + 0.32 * Math.sin(phase * 2.0)) * amp * env;
        L[idx] += s;
        R[idx] += s;
    }
}

function makeBuffer(durSec) {
    const n = Math.ceil(durSec * SAMPLE_RATE);
    return { L: new Float32Array(n), R: new Float32Array(n) };
}

// ============================================================================
// 1. TẠO 28 FILE SFX SÁNG, LẤP LÁNH, NẢY GIÒN (assets/sfx_library/)
// ============================================================================
const sfxCatalog = [
    // --- NHÓM 1: SPAWN (BẤM MÁY PHÁT) ---
    {
        id: 'spawn_crystal_pop',
        file: 'spawn_crystal_pop.wav',
        category: 'spawn',
        name: '💎 Pop Pha Lê Nảy Sáng (Khuyên dùng)',
        desc: 'Tiếng bật nắp giọt sương kết hợp chuông pha lê C6 sáng giòn, bấm nhanh cực bắt tai',
        build: () => {
            const b = makeBuffer(0.11);
            addSweepPop(b.L, b.R, 0, 0.042, 520, 1280, 0.48, 1.2);
            addNote(b.L, b.R, 0.008, 0.095, 1046.50, 0.36, { fmIndex: 0.8, fmRatio: 2.0, decayFactor: 0.24 });
            return b;
        }
    },
    {
        id: 'spawn_candy_bubble',
        file: 'spawn_candy_bubble.wav',
        category: 'spawn',
        name: '🍬 Bong Bóng Kẹo Ngọt Giòn',
        desc: 'Tiếng pop kẹo ngọt vui nhộn quãng cao (620Hz -> 1480Hz)',
        build: () => {
            const b = makeBuffer(0.10);
            addSweepPop(b.L, b.R, 0, 0.045, 580, 1480, 0.52, 1.1);
            addNote(b.L, b.R, 0.012, 0.08, 1318.51, 0.28, { decayFactor: 0.22 });
            return b;
        }
    },
    {
        id: 'spawn_star_plink',
        file: 'spawn_star_plink.wav',
        category: 'spawn',
        name: '✨ Sao Rơi Lấp Lánh (Star Plink)',
        desc: 'Hai nốt chuông nhỏ lướt cực nhanh G6 -> C7 tạo cảm giác phép thuật',
        build: () => {
            const b = makeBuffer(0.12);
            addSweepPop(b.L, b.R, 0, 0.032, 600, 1200, 0.35);
            addNote(b.L, b.R, 0, 0.075, 1567.98, 0.34, { fmIndex: 1.1, decayFactor: 0.22 });
            addNote(b.L, b.R, 0.025, 0.09, 2093.00, 0.30, { fmIndex: 0.9, decayFactor: 0.24 });
            return b;
        }
    },
    {
        id: 'spawn_kalimba_high',
        file: 'spawn_kalimba_high.wav',
        category: 'spawn',
        name: '🎵 Kalimba Quãng Cao Sáng Trong',
        desc: 'Tiếng gảy phím đàn Kalimba ở quãng 6 (E6 1318Hz) trong veo không trầm',
        build: () => {
            const b = makeBuffer(0.12);
            addSweepPop(b.L, b.R, 0, 0.028, 480, 1120, 0.35);
            addNote(b.L, b.R, 0.004, 0.11, 1318.51, 0.44, { pitchStartMul: 0.72, pitchSlideSec: 0.015, decayFactor: 0.26 });
            return b;
        }
    },
    {
        id: 'spawn_cork_snap',
        file: 'spawn_cork_snap.wav',
        category: 'spawn',
        name: '🍾 Bật Nắp Giòn Vui Nhộn',
        desc: 'Tiếng bật nút chai nảy cao giòn rụm',
        build: () => {
            const b = makeBuffer(0.09);
            addSweepPop(b.L, b.R, 0, 0.038, 450, 1620, 0.55, 0.85);
            addNote(b.L, b.R, 0.015, 0.065, 1760.00, 0.25, { decayFactor: 0.20 });
            return b;
        }
    },

    // --- NHÓM 2: MERGE (GHÉP ĐỒ DOPAMINE) ---
    {
        id: 'merge_celesta_sparkle',
        file: 'merge_celesta_sparkle.wav',
        category: 'merge',
        name: '🌟 Chuông Celesta Lấp Lánh (Khuyên dùng)',
        desc: 'Tiếng chuông Celesta kết hợp bụi sao (C6 + G6 + C7) cực kỳ cuốn hút khi leo Combo',
        build: () => {
            const b = makeBuffer(0.24);
            addSweepPop(b.L, b.R, 0, 0.030, 520, 1180, 0.38);
            addNote(b.L, b.R, 0.004, 0.19, 1046.50, 0.45, { pitchStartMul: 0.68, pitchSlideSec: 0.018, fmIndex: 1.2, fmRatio: 2.0, decayFactor: 0.30, pan: -0.15 });
            addNote(b.L, b.R, 0.032, 0.18, 1567.98, 0.28, { fmIndex: 0.9, fmRatio: 3.0, decayFactor: 0.28, pan: 0.20 });
            addNote(b.L, b.R, 0.058, 0.16, 2093.00, 0.22, { fmIndex: 0.7, fmRatio: 2.0, decayFactor: 0.25, pan: 0.0 });
            return b;
        }
    },
    {
        id: 'merge_fairy_harp',
        file: 'merge_fairy_harp.wav',
        category: 'merge',
        name: '🧚 Đàn Hạc Tiên Nữ (Fairy Harp)',
        desc: 'Lướt 3 dây đàn hạc sáng trong C6 -> E6 -> G6 lung linh',
        build: () => {
            const b = makeBuffer(0.26);
            addNote(b.L, b.R, 0.00, 0.20, 1046.50, 0.38, { pan: -0.25, decayFactor: 0.32 });
            addNote(b.L, b.R, 0.028, 0.20, 1318.51, 0.36, { pan: 0.0, decayFactor: 0.32 });
            addNote(b.L, b.R, 0.056, 0.20, 1567.98, 0.38, { pan: 0.25, decayFactor: 0.34 });
            return b;
        }
    },
    {
        id: 'merge_crystal_drop',
        file: 'merge_crystal_drop.wav',
        category: 'merge',
        name: '💧 Giọt Sương Pha Lê Nảy Sáng',
        desc: 'Tiếng giọt nước bật lên cao vút kèm tiếng ngân chuông thuỷ tinh',
        build: () => {
            const b = makeBuffer(0.22);
            addSweepPop(b.L, b.R, 0, 0.036, 480, 1360, 0.46, 1.1);
            addNote(b.L, b.R, 0.010, 0.19, 1174.66, 0.42, { fmIndex: 1.5, fmRatio: 2.0, decayFactor: 0.28 });
            addNote(b.L, b.R, 0.042, 0.16, 2349.32, 0.20, { fmIndex: 0.8, decayFactor: 0.24 });
            return b;
        }
    },
    {
        id: 'merge_marimba_bright',
        file: 'merge_marimba_bright.wav',
        category: 'merge',
        name: '🎶 Marimba Sáng Rực Rỡ',
        desc: 'Tiếng gõ phím Marimba quãng cao kết hợp chuông G6 vui nhộn',
        build: () => {
            const b = makeBuffer(0.20);
            addNote(b.L, b.R, 0, 0.15, 783.99, 0.45, { pitchStartMul: 0.65, pitchSlideSec: 0.015, decayFactor: 0.24 });
            addNote(b.L, b.R, 0.025, 0.16, 1567.98, 0.35, { decayFactor: 0.26 });
            return b;
        }
    },
    {
        id: 'merge_candy_ding',
        file: 'merge_candy_ding.wav',
        category: 'merge',
        name: '🍭 Chuông Kẹo Ngọt (Candy Ding)',
        desc: 'Tiếng Pop-Ding phong cách game giải đố kẹo ngọt cực nịnh tai',
        build: () => {
            const b = makeBuffer(0.22);
            addSweepPop(b.L, b.R, 0, 0.034, 560, 1440, 0.45);
            addNote(b.L, b.R, 0.018, 0.19, 1318.51, 0.42, { fmIndex: 1.0, decayFactor: 0.30 });
            addNote(b.L, b.R, 0.045, 0.16, 1975.53, 0.26, { fmIndex: 0.6, decayFactor: 0.26 });
            return b;
        }
    },
    {
        id: 'merge_magic_bell',
        file: 'merge_magic_bell.wav',
        category: 'merge',
        name: '🔔 Chuông Phép Thuật Ngân Trong',
        desc: 'Âm chuông bạc trong vắt kích thích cảm giác thành tựu',
        build: () => {
            const b = makeBuffer(0.25);
            addNote(b.L, b.R, 0, 0.22, 1046.50, 0.40, { fmIndex: 1.8, fmRatio: 2.41, decayFactor: 0.32 });
            addNote(b.L, b.R, 0.03, 0.20, 2093.00, 0.28, { fmIndex: 1.1, fmRatio: 2.0, decayFactor: 0.28 });
            return b;
        }
    },

    // --- NHÓM 3: BUBBLE & BONUS ---
    {
        id: 'bubble_soap_bright',
        file: 'bubble_soap_bright.wav',
        category: 'bubble',
        name: '🫧 Bong Bóng Xà Phòng Trong Veo (Khuyên dùng)',
        desc: 'Tiếng bong bóng căng tròn nảy lên quãng sáng kèm tia lấp lánh',
        build: () => {
            const b = makeBuffer(0.20);
            addSweepPop(b.L, b.R, 0, 0.055, 420, 1120, 0.42, 1.3);
            addSweepPop(b.L, b.R, 0.048, 0.065, 680, 1680, 0.46, 1.2);
            addNote(b.L, b.R, 0.095, 0.095, 2093.00, 0.25, { fmIndex: 0.8, decayFactor: 0.22 });
            return b;
        }
    },
    {
        id: 'bubble_water_sparkle',
        file: 'bubble_water_sparkle.wav',
        category: 'bubble',
        name: '💦 Bong Bóng Nước Lấp Lánh',
        desc: 'Ba nhịp bong bóng nước nảy liên tiếp lên cao',
        build: () => {
            const b = makeBuffer(0.22);
            addSweepPop(b.L, b.R, 0.00, 0.045, 460, 980, 0.36);
            addSweepPop(b.L, b.R, 0.04, 0.045, 620, 1320, 0.40);
            addSweepPop(b.L, b.R, 0.08, 0.055, 840, 1760, 0.44);
            return b;
        }
    },
    {
        id: 'bonus_gift_chime',
        file: 'bonus_gift_chime.wav',
        category: 'bonus',
        name: '🎁 Nhận Hộp Quà May Mắn',
        desc: 'Hợp âm chuông sáng C6 - E6 - G6 - C7 rạng rỡ',
        build: () => {
            const b = makeBuffer(0.32);
            [1046.50, 1318.51, 1567.98, 2093.00].forEach((f, i) => {
                addNote(b.L, b.R, i * 0.04, 0.22, f, 0.34, { fmIndex: 1.0, pan: (i - 1.5) * 0.2 });
            });
            return b;
        }
    },
    {
        id: 'rock_crack_crisp',
        file: 'rock_crack_crisp.wav',
        category: 'rock_crack',
        name: '⛏️ Tách Mở Ô Đá Giòn Tan',
        desc: 'Tiếng tách giòn kèm chuông báo mở khóa sáng sủa',
        build: () => {
            const b = makeBuffer(0.20);
            addSweepPop(b.L, b.R, 0, 0.035, 360, 880, 0.45);
            addNote(b.L, b.R, 0.025, 0.16, 880.00, 0.36, { decayFactor: 0.25 });
            addNote(b.L, b.R, 0.055, 0.14, 1318.51, 0.32, { decayFactor: 0.25 });
            return b;
        }
    },

    // --- NHÓM 4: ORDER READY & WIN ---
    {
        id: 'order_ready_celesta',
        file: 'order_ready_celesta.wav',
        category: 'order_ready',
        name: '✅ Đủ Đơn Hàng Chuông Đôi Sáng (Khuyên dùng)',
        desc: 'Hai nốt chuông pha lê G5 -> C6 -> E6 báo đơn hàng sẵn sàng cực vui tai',
        build: () => {
            const b = makeBuffer(0.30);
            addNote(b.L, b.R, 0.00, 0.16, 1046.50, 0.38, { fmIndex: 1.1, pan: -0.2 });
            addNote(b.L, b.R, 0.055, 0.18, 1318.51, 0.40, { fmIndex: 1.1, pan: 0.0 });
            addNote(b.L, b.R, 0.110, 0.19, 1567.98, 0.44, { fmIndex: 1.2, pan: 0.2 });
            return b;
        }
    },
    {
        id: 'order_ready_harp',
        file: 'order_ready_harp.wav',
        category: 'order_ready',
        name: '🎵 Đủ Đơn Hàng Lướt Đàn Hạc',
        desc: 'Tiếng lướt hạc 4 nốt nhanh báo hoàn thành món đồ yêu cầu',
        build: () => {
            const b = makeBuffer(0.32);
            [783.99, 1046.50, 1318.51, 1567.98].forEach((f, i) => {
                addNote(b.L, b.R, i * 0.035, 0.20, f, 0.35, { decayFactor: 0.30 });
            });
            return b;
        }
    },
    {
        id: 'order_ready_bell_triad',
        file: 'order_ready_bell_triad.wav',
        category: 'order_ready',
        name: '🔔 Đủ Đơn Hàng Tam Âm Pha Lê',
        desc: 'Tiếng chuông ngân tam âm Đô Trưởng cao vút',
        build: () => {
            const b = makeBuffer(0.28);
            addNote(b.L, b.R, 0, 0.22, 1318.51, 0.36, { fmIndex: 1.4 });
            addNote(b.L, b.R, 0.06, 0.22, 1975.53, 0.42, { fmIndex: 1.4 });
            return b;
        }
    },
    {
        id: 'win_fanfare_bright',
        file: 'win_fanfare_bright.wav',
        category: 'win',
        name: '🏆 Khải Hoàn Cắm Trại Rực Rỡ (Khuyên dùng)',
        desc: 'Khúc nhạc giao đơn / thắng màn 5 nốt Celesta & Harp tưng bừng',
        build: () => {
            const b = makeBuffer(0.55);
            const notes = [1046.50, 1318.51, 1567.98, 1760.00, 2093.00];
            notes.forEach((f, i) => {
                const dur = i === 4 ? 0.28 : 0.16;
                addNote(b.L, b.R, i * 0.06, dur, f, 0.38, { fmIndex: 1.2, pan: (i - 2) * 0.15 });
            });
            return b;
        }
    },
    {
        id: 'win_magic_arpeggio',
        file: 'win_magic_arpeggio.wav',
        category: 'win',
        name: '✨ Chuông Vàng Chiến Thắng',
        desc: 'Chuỗi hợp âm lấp lánh mừng hoàn thành đơn hàng thú cưng',
        build: () => {
            const b = makeBuffer(0.60);
            const notes = [783.99, 987.77, 1174.66, 1567.98, 1975.53, 2349.32];
            notes.forEach((f, i) => {
                addNote(b.L, b.R, i * 0.05, 0.24, f, 0.34, { fmIndex: 1.3 });
            });
            return b;
        }
    },

    // --- NHÓM 5: COINS & GEMS ---
    {
        id: 'coin_gold_shimmer',
        file: 'coin_gold_shimmer.wav',
        category: 'coin',
        name: '🪙 Đồng Xu Vàng Lấp Lánh (Khuyên dùng)',
        desc: 'Tiếng đồng xu vàng keng sáng trong ở tần số cao (E6 -> B6)',
        build: () => {
            const b = makeBuffer(0.16);
            addNote(b.L, b.R, 0, 0.12, 1567.98, 0.38, { fmIndex: 1.8, fmRatio: 2.4, decayFactor: 0.22 });
            addNote(b.L, b.R, 0.022, 0.13, 2349.32, 0.36, { fmIndex: 1.5, fmRatio: 2.4, decayFactor: 0.24 });
            return b;
        }
    },
    {
        id: 'coin_silver_clink',
        file: 'coin_silver_clink.wav',
        category: 'coin',
        name: '🥈 Tiếng Keng Bạc Trong Trẻo',
        desc: 'Tiếng xu chạm nhau mảnh, sắc nét và cực kỳ vui tai',
        build: () => {
            const b = makeBuffer(0.14);
            addNote(b.L, b.R, 0, 0.13, 2093.00, 0.38, { fmIndex: 2.1, fmRatio: 2.75, decayFactor: 0.20 });
            return b;
        }
    },
    {
        id: 'coin_ruby_crystal',
        file: 'coin_ruby_crystal.wav',
        category: 'coin',
        name: '💎 Kim Cương Pha Lê Tinh Khiết',
        desc: 'Tiếng thu hoạch kim cương lấp lánh cao vút',
        build: () => {
            const b = makeBuffer(0.18);
            addNote(b.L, b.R, 0, 0.15, 1760.00, 0.35, { fmIndex: 1.6 });
            addNote(b.L, b.R, 0.028, 0.15, 2637.02, 0.32, { fmIndex: 1.4 });
            return b;
        }
    },
    {
        id: 'coin_jackpot_ding',
        file: 'coin_jackpot_ding.wav',
        category: 'coin',
        name: '🎰 Tiếng Chuông Thưởng Jackpot',
        desc: 'Tiếng chuông nhận thưởng lớn rộn ràng',
        build: () => {
            const b = makeBuffer(0.20);
            addNote(b.L, b.R, 0, 0.18, 1318.51, 0.36, { fmIndex: 1.5 });
            addNote(b.L, b.R, 0.03, 0.17, 1975.53, 0.36, { fmIndex: 1.5 });
            return b;
        }
    },

    // --- NHÓM 6: UI & FULL BOARD ---
    {
        id: 'ui_move_crisp',
        file: 'ui_move_crisp.wav',
        category: 'move',
        name: '👆 Đặt Đồ Nhẹ Thanh Thoát',
        desc: 'Tiếng chạm nhẹ sáng thanh (không bị trầm đục)',
        build: () => {
            const b = makeBuffer(0.05);
            addSweepPop(b.L, b.R, 0, 0.026, 540, 880, 0.25);
            return b;
        }
    },
    {
        id: 'ui_button_bright',
        file: 'ui_button_bright.wav',
        category: 'move',
        name: '🔘 Bấm Nút Giao Diện Sáng',
        desc: 'Tiếng click giao diện giòn gọn',
        build: () => {
            const b = makeBuffer(0.06);
            addSweepPop(b.L, b.R, 0, 0.030, 620, 1120, 0.32);
            return b;
        }
    },
    {
        id: 'full_board_soft_bell',
        file: 'full_board_soft_bell.wav',
        category: 'full_board',
        name: '🚫 Báo Đầy Bàn Chuông Gỗ Sáng (Khuyên dùng)',
        desc: 'Hai nhịp gõ E5 -> C5 vừa lịch sự vừa rõ ràng, không bị trầm tối',
        build: () => {
            const b = makeBuffer(0.18);
            addNote(b.L, b.R, 0.00, 0.075, 659.25, 0.34, { decayFactor: 0.22 });
            addNote(b.L, b.R, 0.065, 0.095, 523.25, 0.32, { decayFactor: 0.24 });
            return b;
        }
    },
    {
        id: 'full_board_boing',
        file: 'full_board_boing.wav',
        category: 'full_board',
        name: '🌀 Báo Đầy Bàn Nhún Lò Xo Vui Nhộn',
        desc: 'Tiếng nhún đàn hồi vui tai khi bàn cờ hết chỗ',
        build: () => {
            const b = makeBuffer(0.18);
            addSweepPop(b.L, b.R, 0.00, 0.075, 520, 380, 0.36);
            addSweepPop(b.L, b.R, 0.065, 0.085, 460, 320, 0.34);
            return b;
        }
    }
];

for (const item of sfxCatalog) {
    const { L, R } = item.build();
    writeStereoWav(path.join(SFX_DIR, item.file), L, R);
}

// ============================================================================
// 2. TẠO 5 BẢN NHẠC NỀN (BGM) DÀI 32 Ô NHỊP (~65-72 GIÂY) VỚI VÒNG LẶP LIỀN MẠCH TUYỆT ĐỐI (CIRCULAR TAIL-WRAPPING LOOP)
// ============================================================================
function generateBgmTrack(opts) {
    const bpm = opts.bpm || 114;
    const beatSec = 60 / bpm;
    const bars = opts.bars || 32; // 32 ô nhịp (~65-72 giây) chia làm 4 chương A - B - C - A'
    const totalBeats = bars * 4;
    const loopSec = totalBeats * beatSec;
    const tailSec = 2.2; // Đuôi ngân 2.2 giây của ô nhịp cuối sẽ được cuộn tròn trộn vào đầu ô nhịp 1
    const loopSamples = Math.floor(loopSec * SAMPLE_RATE);
    const tailSamples = Math.floor(tailSec * SAMPLE_RATE);
    const rawBuf = makeBuffer(loopSec + tailSec);

    const chords = opts.chords; // Array of 4-note chord frequencies
    const bridgeChords = opts.bridgeChords || [
        chords[2] || chords[0],
        chords[3] || chords[1],
        chords[0],
        chords[1]
    ];
    const melodyScale = opts.melody;
    const style = opts.style || 'celesta';

    // 4 mẫu tiết tấu giai điệu cho 4 đoạn (A, B, C, A') giúp bản nhạc dài biến hóa tự nhiên, không nhàm chán
    const sectionRhythms = [
        [0.0, 0.5, 1.5, 2.0, 3.0, 3.5],          // Đoạn A (Ô nhịp 0-7): Nhịp điệu dã ngoại thư thái
        [0.0, 0.5, 1.0, 2.0, 2.5, 3.0, 3.5],     // Đoạn B (Ô nhịp 8-15): Rộn ràng, thêm nốt luyến
        [0.0, 0.75, 1.5, 2.5, 3.0, 3.5],         // Đoạn C (Ô nhịp 16-23): Đảo phách êm dịu (Bridge)
        [0.0, 0.5, 1.5, 2.0, 2.5, 3.0, 3.5]      // Đoạn A' (Ô nhịp 24-31): Cao trào nhẹ & kết mở về đầu vòng lặp
    ];

    for (let bar = 0; bar < bars; bar++) {
        const sectionIdx = Math.floor(bar / 8) % 4;
        const activeChords = (sectionIdx === 2) ? bridgeChords : chords;
        const chord = activeChords[bar % activeChords.length];
        const barStart = bar * 4 * beatSec;

        // 0. Âm trầm nền ấm nhẹ (Warm Root Pad/Bass) ở phách 1 và phách 3
        addNote(rawBuf.L, rawBuf.R, barStart, beatSec * 1.9, chord[0] * 0.5, 0.075, {
            pan: 0,
            fmIndex: 0.2,
            decayFactor: 0.45
        });
        addNote(rawBuf.L, rawBuf.R, barStart + 2 * beatSec, beatSec * 1.9, chord[1] * 0.5, 0.065, {
            pan: 0,
            fmIndex: 0.2,
            decayFactor: 0.45
        });

        // 1. Arpeggio / Marimba accompaniment (rải hợp âm 8 nốt móc đơn liên tục)
        const arpPattern = (sectionIdx % 2 === 0)
            ? [0, 1, 2, 3, 2, 1, 2, 3]
            : [0, 2, 1, 3, 2, 3, 1, 2];
        for (let step = 0; step < 8; step++) {
            const noteFreq = chord[arpPattern[step]];
            const t0 = barStart + step * (beatSec * 0.5);
            addNote(rawBuf.L, rawBuf.R, t0, beatSec * 0.95, noteFreq, 0.105, {
                pan: (step % 2 === 0 ? -0.28 : 0.28),
                fmIndex: style === 'musicbox' ? 1.0 : 0.38,
                decayFactor: 0.36
            });
        }

        // 2. Giai điệu chính (Marimba & Bell Chime) biến hóa theo từng đoạn
        const pat = sectionRhythms[sectionIdx];
        pat.forEach((beatOffset, idx) => {
            // Ở phách cuối của ô nhịp thứ 31 (cuối bài), đưa giai điệu về bậc 5 (Dominant) để nối mượt hoàn hảo về bậc 1 của ô nhịp 0
            let mIdx;
            if (bar === bars - 1 && idx === pat.length - 1) {
                mIdx = 2; // Bậc hòa âm dẫn về đầu bài
            } else {
                mIdx = (bar * 3 + sectionIdx * 2 + idx * 2 + (bar % 2)) % melodyScale.length;
            }
            let mFreq = melodyScale[mIdx];
            const t0 = barStart + beatOffset * beatSec;

            addNote(rawBuf.L, rawBuf.R, t0, beatSec * 0.92, mFreq, 0.15, {
                pan: Math.sin(bar * 0.7 + idx) * 0.32,
                fmIndex: style === 'celesta' ? 0.95 : 0.55,
                pitchStartMul: style === 'ukulele' ? 0.97 : 1.0,
                decayFactor: 0.34
            });

            // 3. Điểm chuông gió pha lê (Bell Chime Counter-Harmony) ở đoạn B và A'
            if ((sectionIdx === 1 || sectionIdx === 3) && (idx === 0 || idx === 3)) {
                addNote(rawBuf.L, rawBuf.R, t0 + beatSec * 0.25, beatSec * 1.1, mFreq * 1.5, 0.065, {
                    pan: -Math.sin(bar + idx) * 0.4,
                    fmIndex: 1.2,
                    decayFactor: 0.38
                });
            }
        });
    }

    // CUỘN ĐUÔI ÂM THANH (CIRCULAR LOOP TAIL-WRAPPING):
    // Cộng toàn bộ phần ngân dư sau loopSamples vào đầu bản nhạc để khi phát lặp lại không bị ngắt quãng hay khựng tiếng
    const finalL = new Float32Array(loopSamples);
    const finalR = new Float32Array(loopSamples);
    for (let i = 0; i < loopSamples; i++) {
        finalL[i] = rawBuf.L[i];
        finalR[i] = rawBuf.R[i];
    }
    for (let i = 0; i < tailSamples && i < loopSamples; i++) {
        const fade = 1.0 - (i / tailSamples);
        finalL[i] += rawBuf.L[loopSamples + i] * fade;
        finalR[i] += rawBuf.R[loopSamples + i] * fade;
    }

    // Làm mượt 128 mẫu (3ms) tại điểm nối biên (Cross-boundary smoothing) để triệt tiêu 100% tiếng click khi loop
    const smoothLen = 128;
    for (let i = 0; i < smoothLen; i++) {
        const alpha = i / smoothLen;
        const endIdx = loopSamples - smoothLen + i;
        finalL[endIdx] = finalL[endIdx] * (1 - alpha * 0.5) + finalL[0] * (alpha * 0.5);
        finalR[endIdx] = finalR[endIdx] * (1 - alpha * 0.5) + finalR[0] * (alpha * 0.5);
    }

    return { L: finalL, R: finalR };
}

const bgmTracks = [
    {
        id: 'bgm_goc_nho_nang_mai',
        file: 'Góc_Nhỏ_Nắng_Mai.mp3',
        wavAlias: 'Goc_Nho_Nang_Mai.wav',
        name: '☀️ Góc Nhỏ Nắng Mai (Acoustic & Celesta Sáng)',
        bpm: 110,
        style: 'celesta',
        chords: [
            [261.63, 329.63, 392.00, 523.25], // C
            [392.00, 493.88, 587.33, 783.99], // G
            [440.00, 523.25, 659.25, 880.00], // Am
            [349.23, 440.00, 523.25, 698.46]  // F
        ],
        melody: [523.25, 659.25, 783.99, 880.00, 1046.50, 880.00, 783.99, 659.25]
    },
    {
        id: 'bgm_mua_vang_khu_trai',
        file: 'Mưa_Vàng_Trên_Khu_Trại.mp3',
        wavAlias: 'Mua_Vang_Tren_Khu_Trai.wav',
        name: '🌼 Mưa Vàng Trên Khu Trại (Kalimba & Chuông Gió)',
        bpm: 116,
        style: 'kalimba',
        chords: [
            [349.23, 440.00, 523.25, 659.25], // Fmaj7
            [392.00, 493.88, 587.33, 783.99], // G
            [329.63, 392.00, 493.88, 659.25], // Em
            [440.00, 523.25, 659.25, 880.00]  // Am
        ],
        melody: [659.25, 783.99, 880.00, 1046.50, 1174.66, 1046.50, 880.00, 783.99]
    },
    {
        id: 'bgm_ukulele_suoi_nang',
        file: 'Ukulele_Suoi_Nang.wav',
        name: '🎸 Ukulele Suối Nắng (Dã Ngoại Rộn Ràng)',
        bpm: 122,
        style: 'ukulele',
        chords: [
            [261.63, 329.63, 392.00, 523.25],
            [440.00, 523.25, 659.25, 880.00],
            [349.23, 440.00, 523.25, 698.46],
            [392.00, 493.88, 587.33, 783.99]
        ],
        melody: [783.99, 880.00, 1046.50, 1318.51, 1174.66, 1046.50, 880.00, 783.99]
    },
    {
        id: 'bgm_hop_nhac_sao_dem',
        file: 'Hop_Nhac_Sao_Dem.wav',
        name: '🌌 Hộp Nhạc Sao Đêm (Music Box & Harp Lung Linh)',
        bpm: 98,
        style: 'musicbox',
        chords: [
            [523.25, 659.25, 783.99, 1046.50],
            [493.88, 587.33, 783.99, 987.77],
            [440.00, 523.25, 659.25, 880.00],
            [349.23, 440.00, 523.25, 698.46]
        ],
        melody: [1046.50, 1174.66, 1318.51, 1567.98, 1318.51, 1174.66, 1046.50, 783.99]
    },
    {
        id: 'bgm_pha_le_rung_thong',
        file: 'Pha_Le_Rung_Thong.wav',
        name: '🌲 Pha Lê Rừng Thông (Marimba & Bell Chime)',
        bpm: 118,
        style: 'celesta',
        chords: [
            [293.66, 369.99, 440.00, 587.33], // D
            [440.00, 554.37, 659.25, 880.00], // A
            [493.88, 587.33, 739.99, 987.77], // Bm
            [392.00, 493.88, 587.33, 783.99]  // G
        ],
        melody: [587.33, 739.99, 880.00, 1174.66, 987.77, 880.00, 739.99, 659.25]
    }
];

for (const t of bgmTracks) {
    const { L, R } = generateBgmTrack(t);
    writeStereoWav(path.join(MUSIC_DIR, t.file), L, R);
    if (t.wavAlias) {
        writeStereoWav(path.join(MUSIC_DIR, t.wavAlias), L, R);
    }
}

const manifest = {
    generatedAt: new Date().toISOString(),
    sfx: sfxCatalog.map(({ build, ...rest }) => ({ ...rest, path: 'assets/sfx_library/' + rest.file })),
    bgm: [
        { id: 'bgm_khu_trai_rang_ro', file: 'Khu_Trại_Rạng_Rỡ.mp3', path: 'assets/music/Khu_Trại_Rạng_Rỡ.mp3', name: '🏕️ Khu Trại Rạng Rỡ (Bản gốc)', bpm: 105 },
        ...bgmTracks.map(t => ({
            id: t.id,
            file: t.wavAlias || t.file,
            path: 'assets/music/' + (t.wavAlias || t.file),
            name: t.name,
            bpm: t.bpm
        }))
    ]
};

fs.writeFileSync(path.join(SFX_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
console.log('Generated', sfxCatalog.length, 'SFX files and', bgmTracks.length, 'BGM files successfully.');
