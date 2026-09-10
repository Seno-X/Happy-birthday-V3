// ══ พารัลแลกซ์ (ใช้ transform-friendly offset, สมูทด้วย lerp) ══
let targetOffsetX = 0, targetOffsetY = 0;
let offsetX = 0, offsetY = 0;
const PARALLAX_RANGE = 10; // px สูงสุดที่ขยับ
let heartSceneActive = false; // หยุดวาดพื้นหลังตอนอยู่ในฉากหัวใจ ประหยัดแรงเครื่อง

window.addEventListener('pointermove', (e) => {
    const nx = (e.clientX / window.innerWidth - 0.5) * 2;  // -1 ถึง 1
    const ny = (e.clientY / window.innerHeight - 0.5) * 2;
    targetOffsetX = nx * PARALLAX_RANGE;
    targetOffsetY = ny * PARALLAX_RANGE;
});

function updateParallax() {
    offsetX += (targetOffsetX - offsetX) * 0.04;
    offsetY += (targetOffsetY - offsetY) * 0.04;
}


// ══ ดาว (พื้นหลังมืด) ══
const starsCanvas = document.getElementById('stars');
const sCtx = starsCanvas.getContext('2d');
let W, H, stars = [];

function initStars() {
    W = starsCanvas.width  = window.innerWidth;
    H = starsCanvas.height = window.innerHeight;
    stars = Array.from({length: 200}, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.4 + 0.2,
        a: Math.random(),
        da: (Math.random() - 0.5) * 0.006,
        speed: Math.random() * 0.2 + 0.05
    }));
}
function drawStars() {
    if (!heartSceneActive) {
        updateParallax();
        sCtx.clearRect(0, 0, W, H);
        stars.forEach(s => {
            s.a = Math.max(0.05, Math.min(1, s.a + s.da));
            if (s.a <= 0.05 || s.a >= 1) s.da *= -1;
            s.y -= s.speed;
            if (s.y < 0) { s.y = H; s.x = Math.random() * W; }
            const depth = s.r / 1.6; // ดาวใหญ่ (ใกล้กว่า) ขยับมากกว่า
            sCtx.beginPath();
            sCtx.arc(s.x + offsetX * depth, s.y + offsetY * depth, s.r, 0, Math.PI * 2);
            sCtx.fillStyle = `rgba(240,214,255,${s.a})`;
            sCtx.fill();
        });
    }
    requestAnimationFrame(drawStars);
}
window.addEventListener('resize', initStars);
initStars();
drawStars();


// ══ Particles (พื้นหลังสว่าง) ══
const pCanvas = document.getElementById('particles');
const pCtx = pCanvas.getContext('2d');
let pW, pH, particles = [];

function initParticles() {
    pW = pCanvas.width  = window.innerWidth;
    pH = pCanvas.height = window.innerHeight;
    particles = Array.from({length: 80}, () => ({
        x: Math.random() * pW,
        y: Math.random() * pH,
        r: Math.random() * 3 + 1,
        a: Math.random() * 0.6 + 0.2,
        speed: Math.random() * 0.5 + 0.2,
        drift: (Math.random() - 0.5) * 0.4,
        color: ['255,179,71','255,120,150','200,140,255'][Math.floor(Math.random()*3)]
    }));
}
function drawParticles() {
    if (!heartSceneActive) {
        pCtx.clearRect(0, 0, pW, pH);
        particles.forEach(p => {
            p.y -= p.speed;
            p.x += p.drift;
            if (p.y < 0) { p.y = pH; p.x = Math.random() * pW; }
            const depth = p.r / 4; // อนุภาคใหญ่ (ใกล้กว่า) ขยับมากกว่า
            pCtx.beginPath();
            pCtx.arc(p.x + offsetX * depth, p.y + offsetY * depth, p.r, 0, Math.PI * 2);
            pCtx.fillStyle = `rgba(${p.color},${p.a})`;
            pCtx.fill();
        });
    }
    requestAnimationFrame(drawParticles);
}
window.addEventListener('resize', initParticles);
initParticles();
drawParticles();


// ══ Toggle Switch (คลิกได้ + ลากได้) ══
const toggleSwitch = document.getElementById('toggle-switch');
const toggleKnob = document.getElementById('toggle-knob');
let isDay = false;

const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx;

function playToggleSound(toDay) {
    if (!audioCtx) audioCtx = new AudioCtx();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (toDay) {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
    } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(660, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(330, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
    }
    osc.start();
    osc.stop(audioCtx.currentTime + 0.6);
}

let sequenceTimers = [];

function clearSequence() {
    sequenceTimers.forEach(id => clearTimeout(id));
    sequenceTimers = [];
}

function setDayMode(next) {
    if (next === isDay) return;
    isDay = next;
    document.body.classList.toggle('day-mode', isDay);
    playToggleSound(isDay);
    clearSequence();

    if (isDay) {
        sequenceTimers.push(setTimeout(() => {
            document.getElementById('switch-wrap').classList.add('hidden');
        }, 10));
        sequenceTimers.push(setTimeout(() => {
            document.getElementById('message').classList.add('show');
        }, 700));
    } else {
        document.getElementById('message').classList.remove('show');
        document.getElementById('switch-wrap').classList.remove('hidden');
    }
}

const KNOB_MIN = 0;
const KNOB_MAX = 34; // ตรงกับ translateX ตอนกลางวันใน CSS
let dragging = false;
let dragMoved = false;
let dragStartX = 0;

toggleSwitch.addEventListener('pointerdown', (e) => {
    dragging = true;
    dragMoved = false;
    dragStartX = e.clientX;
    toggleSwitch.classList.add('dragging');
    toggleSwitch.setPointerCapture(e.pointerId);
});

toggleSwitch.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const delta = e.clientX - dragStartX;
    if (Math.abs(delta) > 3) dragMoved = true;
    const base = isDay ? KNOB_MAX : KNOB_MIN;
    const pos = Math.min(KNOB_MAX, Math.max(KNOB_MIN, base + delta));
    toggleKnob.style.transform = `translateX(${pos}px)`;
});

function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    toggleSwitch.classList.remove('dragging');
    toggleKnob.style.transform = '';

    if (!dragMoved) {
        // ถือเป็นการคลิกธรรมดา
        setDayMode(!isDay);
        return;
    }
    const delta = e.clientX - dragStartX;
    const base = isDay ? KNOB_MAX : KNOB_MIN;
    const pos = Math.min(KNOB_MAX, Math.max(KNOB_MIN, base + delta));
    setDayMode(pos > KNOB_MAX / 2);
}

toggleSwitch.addEventListener('pointerup', endDrag);
toggleSwitch.addEventListener('pointercancel', endDrag);


// ══ ปุ่มต่อไป → ฉากหัวใจ 3D ══
const nextBtn = document.getElementById('next-btn');
const heartScene = document.getElementById('heart-scene');

nextBtn.addEventListener('click', () => {
    heartScene.classList.add('show');
    heartSceneActive = true;
    startHeartScene();
});


// ══ ฉากหัวใจ 3D (ดาวสีแดงรวมกันเป็นรูปหัวใจ, หมุนได้) ══
const heartCanvas = document.getElementById('heart-canvas');
const hCtx = heartCanvas.getContext('2d');
let hW, hH;
let heartPoints = [];
let heartRunning = false;

function initHeartCanvas() {
    hW = heartCanvas.width = heartCanvas.clientWidth;
    hH = heartCanvas.height = heartCanvas.clientHeight;
}
window.addEventListener('resize', initHeartCanvas);

// สร้าง "ดวงเรืองแสง" ไว้ล่วงหน้าแค่ครั้งเดียว แล้วแปะซ้ำด้วย drawImage
// เร็วกว่าการคำนวณสี/วาดใหม่ต่อดวงทุกเฟรมมาก (ตัวการที่ทำให้กระตุก)
const GLOW_SIZE = 64;
const glowSprite = document.createElement('canvas');
glowSprite.width = glowSprite.height = GLOW_SIZE;
(function drawGlowSprite() {
    const gCtx = glowSprite.getContext('2d');
    const r = GLOW_SIZE / 2;
    const grad = gCtx.createRadialGradient(r, r, 0, r, r, r);
    grad.addColorStop(0,    'rgba(255,235,225,1)');
    grad.addColorStop(0.22, 'rgba(255,120,130,0.95)');
    grad.addColorStop(0.55, 'rgba(255,60,80,0.35)');
    grad.addColorStop(1,    'rgba(255,40,60,0)');
    gCtx.fillStyle = grad;
    gCtx.fillRect(0, 0, GLOW_SIZE, GLOW_SIZE);
})();

function randomUnitVector() {
    const z = Math.random() * 2 - 1;
    const theta = Math.random() * Math.PI * 2;
    const r = Math.sqrt(1 - z * z);
    return { x: r * Math.cos(theta), y: r * Math.sin(theta), z };
}
function cross(a, b) {
    return {
        x: a.y * b.z - a.z * b.y,
        y: a.z * b.x - a.x * b.z,
        z: a.x * b.y - a.y * b.x
    };
}
function normalize(v) {
    const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z) || 1;
    return { x: v.x / len, y: v.y / len, z: v.z / len };
}

function buildHeartPoints() {
    heartPoints = [];
    const target = 2600;              // ลดลงจากเดิมเล็กน้อย ชดเชยแรงที่ใช้วาดแสงฟุ้งที่ใหญ่ขึ้น ให้ลื่นขึ้น
    const SCALE_XY = 130;
    const SCALE_Z = 105;               // ความหนาตามแกน Z ให้ใกล้เคียง XY เพื่อไม่ให้แบน
    const maxAttempts = target * 14;
    let attempts = 0;

    // สุ่มจุดในกล่อง 3 มิติ แล้วเก็บเฉพาะจุดที่ตกอยู่ "ข้างใน" ทรงตันของหัวใจ
    // ใช้สมการอิมพลิซิตของหัวใจ (x²+y²-1)³ - x²y³ ≤ 0 เป็นฐาน แล้วบีบพื้นที่หน้าตัด
    // ให้เล็กลงเมื่อ |z| มาก (เหมือนแอปเปิล/หัวใจอวบ) เพื่อให้เป็นทรงตัน ไม่ใช่แผ่นแบน
    while (heartPoints.length < target && attempts < maxAttempts) {
        attempts++;
        const mx = Math.random() * 2.6 - 1.3;   // -1.3 .. 1.3
        const my = Math.random() * 2.8 - 1.3;   // -1.3 .. 1.5
        const mz = Math.random() * 2 - 1;       // -1 .. 1

        const taper = Math.max(0.22, Math.sqrt(Math.max(0, 1 - mz * mz)));
        const tx = mx / taper;
        const ty = my / taper;
        const f = Math.pow(tx * tx + ty * ty - 1, 3) - tx * tx * ty * ty * ty;

        if (f <= 0) {
            const targetX = mx * SCALE_XY;
            const targetY = -my * SCALE_XY;   // กลับด้าน ให้ปลายแหลมชี้ลงบนจอ
            const targetZ = mz * SCALE_Z;

            // สุ่มทิศทางบนทรงกลมรอบตัว ให้ดาวมาจากทุกทิศทาง 360° ไม่ใช่แค่ซ้าย-ขวา
            const dir = randomUnitVector();
            const R = 1300 + Math.random() * 700;
            const ref = Math.abs(dir.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
            const u1 = normalize(cross(dir, ref));
            const u2 = cross(dir, u1); // ตั้งฉากกับ dir และ u1 อยู่แล้ว (unit length)

            heartPoints.push({
                targetX, targetY, targetZ,
                startX: targetX + dir.x * R,
                startY: targetY + dir.y * R,
                startZ: targetZ + dir.z * R,
                u1, u2,
                delay: Math.random() * 500,             // ดีเลย์สุ่ม ให้ไม่มาถึงพร้อมกันหมด
                duration: ASSEMBLE_DURATION + (Math.random() - 0.5) * 500, // ความเร็วต่างกันเล็กน้อย
                swirlRadius: 50 + Math.random() * 150,
                swirlDir: Math.random() < 0.5 ? -1 : 1,
                swirlPhase: Math.random() * Math.PI * 2,
                swirlTurns: 1.4 + Math.random() * 1.4,
                size: 0.7 + Math.random() * 1.5,
                twinkle: Math.random() * Math.PI * 2,
                twinkleSpeed: 0.6 + Math.random() * 1.6  // แต่ละดวงระยิบระยับไม่พร้อมกัน
            });
        }
    }
}

const ASSEMBLE_DURATION = 1600; // ms ที่ใช้วิ่งเข้าที่ (ไม่รวมดีเลย์)
const ASSEMBLE_TOTAL = ASSEMBLE_DURATION + 1100; // เผื่อดีเลย์สุ่มสูงสุด + duration ที่แกว่งได้
let assembleStartTime = null;

// มุมหมุน: ออโต้ + ที่ผู้ใช้ลากเพิ่มเข้ามา
let autoYaw = 0;
let dragYaw = 0, dragPitch = 0;
let hDragging = false, hLastX = 0, hLastY = 0;

heartCanvas.addEventListener('pointerdown', (e) => {
    hDragging = true;
    hLastX = e.clientX;
    hLastY = e.clientY;
    heartCanvas.setPointerCapture(e.pointerId);
});
heartCanvas.addEventListener('pointermove', (e) => {
    if (!hDragging) return;
    const dx = e.clientX - hLastX;
    const dy = e.clientY - hLastY;
    hLastX = e.clientX;
    hLastY = e.clientY;
    dragYaw += dx * 0.008;
    dragPitch += dy * 0.008;
    dragPitch = Math.max(-1.2, Math.min(1.2, dragPitch));
});
heartCanvas.addEventListener('pointerup', () => { hDragging = false; });
heartCanvas.addEventListener('pointercancel', () => { hDragging = false; });

function drawHeart() {
    hCtx.clearRect(0, 0, hW, hH);

    autoYaw += 0.0035; // หมุนเองเบาๆ ตลอดเวลา
    const yaw = autoYaw + dragYaw;
    const pitch = dragPitch;

    const cosY = Math.cos(yaw), sinY = Math.sin(yaw);
    const cosX = Math.cos(pitch), sinX = Math.sin(pitch);
    const FOV = 320;
    const cx = hW / 2, cy = hH / 2;

    const now = performance.now();
    const elapsedGlobal = assembleStartTime !== null ? now - assembleStartTime : Infinity;
    const stillAssembling = elapsedGlobal < ASSEMBLE_TOTAL;
    const time = now * 0.0035;

    // วาดตรงในลูปเดียว ไม่สร้าง array/object ใหม่และไม่ sort ทุกเฟรม (ตัวการหลักที่ทำให้กระตุก)
    for (let i = 0; i < heartPoints.length; i++) {
        const p = heartPoints[i];
        let px = p.targetX, py = p.targetY, pz = p.targetZ;

        if (stillAssembling) {
            const t = Math.max(0, elapsedGlobal - p.delay);
            const progress = Math.min(1, t / p.duration);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out

            px = p.startX + (p.targetX - p.startX) * eased;
            py = p.startY + (p.targetY - p.startY) * eased;
            pz = p.startZ + (p.targetZ - p.startZ) * eased;

            const swirlFade = 1 - eased;
            const swirlAngle = p.swirlPhase + progress * p.swirlDir * Math.PI * p.swirlTurns;
            const swirlMag = Math.cos(swirlAngle) * p.swirlRadius * swirlFade;
            const swirlMag2 = Math.sin(swirlAngle) * p.swirlRadius * swirlFade;
            px += p.u1.x * swirlMag + p.u2.x * swirlMag2;
            py += p.u1.y * swirlMag + p.u2.y * swirlMag2;
            pz += p.u1.z * swirlMag + p.u2.z * swirlMag2;
        }

        // หมุนรอบแกน Y แล้วรอบแกน X
        let x = px * cosY - pz * sinY;
        let z = px * sinY + pz * cosY;
        const y = py * cosX - z * sinX;
        z = py * sinX + z * cosX;

        const scale = FOV / (FOV + z);
        const sx = cx + x * scale;
        const sy = cy + y * scale;

        const baseAlpha = Math.max(0.15, Math.min(1, scale * 0.9));
        const twinkle = 0.35 + 0.65 * Math.abs(Math.sin(time * p.twinkleSpeed + p.twinkle));
        const sizeMul = 0.75 + 0.6 * twinkle;
        // รัศมีใหญ่กว่าเดิมเพื่อให้เห็นแสงฟุ้งรอบๆ ชัดขึ้น (ตัวสไปรต์มีขอบจางอยู่แล้ว)
        const r = Math.max(1.2, p.size * scale * sizeMul * 3.2);

        hCtx.globalAlpha = baseAlpha * (0.45 + 0.55 * twinkle);
        hCtx.drawImage(glowSprite, sx - r, sy - r, r * 2, r * 2);
    }
    hCtx.globalAlpha = 1;

    if (heartRunning) requestAnimationFrame(drawHeart);
}

function startHeartScene() {
    if (heartRunning) return;
    heartRunning = true;
    initHeartCanvas();
    buildHeartPoints();
    assembleStartTime = performance.now();
    requestAnimationFrame(drawHeart);
}