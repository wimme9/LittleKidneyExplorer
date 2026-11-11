/* =====================================================================
 * ครัวสุขภาพ – ด่านอาหารเช้า (ต้นแบบ)  |  Phaser 3
 * ส่วนที่ 1: ข้อมูล/เกณฑ์  2: ตรรกะคำนวณ+แจ้งเตือน  3: UI (DOM)  4: ฉากเกม (Phaser)
 * ===================================================================== */
'use strict';

/* ---------- 1) ข้อมูล ---------- */
const NUTRIENTS = [
  { key: 'energy',     label: 'พลังงาน',      unit: 'kcal', mineral: false },
  { key: 'protein',    label: 'โปรตีน',       unit: 'g',    mineral: false },
  { key: 'carb',       label: 'คาร์โบไฮเดรต', unit: 'g',    mineral: false },
  { key: 'fat',        label: 'ไขมัน',        unit: 'g',    mineral: false },
  { key: 'sodium',     label: 'โซเดียม',      unit: 'mg',   mineral: true },
  { key: 'potassium',  label: 'โพแทสเซียม',   unit: 'mg',   mineral: true },
  { key: 'phosphorus', label: 'ฟอสฟอรัส',     unit: 'mg',   mineral: true },
];

const DATA_NOTE = 'ค่าโภชนาการและเกณฑ์เตือนทั้งหมดเป็นข้อมูลตัวอย่างสำหรับทดสอบเกมเท่านั้น ยังไม่ได้ตรวจสอบกับแหล่งข้อมูลทางการ ' +
  'และไม่ใช่คำแนะนำทางการแพทย์ ความต้องการจริงของเด็กโรคไตแต่ละคนต่างกันตามอายุ ระยะของโรค น้ำหนัก และผลเลือด ' +
  'ต้องให้แพทย์หรือนักกำหนดอาหารเป็นผู้กำหนด';

const REF = { amount: 100, unit: 'g', label: '100 กรัม' };
const FOOD_DB = {
  rice:     { id: 'rice',     name: 'ข้าวสวย',   emoji: '🍚', sprite: null, ref: REF, verified: false, portion: { grams: 100,  label: '1 ถ้วยเล็ก' },
              n: { energy: 130, protein: 2.7,  carb: 28,   fat: 0.3,  sodium: 1,    potassium: 35,  phosphorus: 43 } },
  egg:      { id: 'egg',      name: 'ไข่ต้ม',    emoji: '🥚', sprite: null, ref: REF, verified: false, portion: { grams: 50,  label: '1 ฟอง' },
              n: { energy: 155, protein: 12.6, carb: 1.1,  fat: 10.6, sodium: 124,  potassium: 126, phosphorus: 172 } },
  banana:   { id: 'banana',   name: 'กล้วย',     emoji: '🍌', sprite: null, ref: REF, verified: false, portion: { grams: 80,  label: '1 ผลเล็ก (ปอกแล้ว)' },
              n: { energy: 89,  protein: 1.1,  carb: 22.8, fat: 0.3,  sodium: 1,    potassium: 358, phosphorus: 22 } },
  apple:    { id: 'apple',    name: 'แอปเปิล',   emoji: '🍎', sprite: null, ref: REF, verified: false, portion: { grams: 120, label: '1 ผลเล็ก' },
              n: { energy: 52,  protein: 0.3,  carb: 13.8, fat: 0.2,  sodium: 1,    potassium: 107, phosphorus: 11 } },
  bread:    { id: 'bread',    name: 'ขนมปังขาว', emoji: '🍞', sprite: null, ref: REF, verified: false, portion: { grams: 30,  label: '1 แผ่น' },
              n: { energy: 265, protein: 9,    carb: 49,   fat: 3.2,  sodium: 491,  potassium: 115, phosphorus: 99 } },
  milk:     { id: 'milk',     name: 'นมจืด',     emoji: '🥛', sprite: null, ref: REF, verified: false, portion: { grams: 185, label: '1 กล่อง (180 มล.)' },
              n: { energy: 61,  protein: 3.2,  carb: 4.8,  fat: 3.3,  sodium: 43,   potassium: 132, phosphorus: 84 } },
  sausage:  { id: 'sausage',  name: 'ไส้กรอก',   emoji: '🌭', sprite: null, ref: REF, verified: false, portion: { grams: 40,  label: '2 ชิ้นเล็ก' },
              n: { energy: 300, protein: 12,   carb: 3,    fat: 27,   sodium: 1000, potassium: 200, phosphorus: 150 } },
  cucumber: { id: 'cucumber', name: 'แตงกวา',    emoji: '🥒', sprite: null, ref: REF, verified: false, portion: { grams: 80,  label: 'ครึ่งผล' },
              n: { energy: 15,  protein: 0.7,  carb: 3.6,  fat: 0.1,  sodium: 2,    potassium: 147, phosphorus: 24 } },
};

/* ---------- 1.5) ไอคอนอาหารวาดด้วยโค้ด (แทนอิโมจิ) ใช้ทั้งในฉากและหน้าต่าง UI ---------- */
const INK = '#1f2d4a';
function fs(c, fill, lw) { c.fillStyle = fill; c.fill(); c.lineWidth = lw || 5; c.strokeStyle = INK; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); }
function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
const ICON_DRAW = {
  rice(c) {
    c.beginPath(); c.moveTo(20, 66); c.bezierCurveTo(22, 18, 106, 18, 108, 66); c.closePath(); fs(c, '#ffffff');
    c.fillStyle = '#e3e9ee'; [[48, 44], [66, 34], [82, 48], [58, 56], [76, 60]].forEach(([x, y]) => { c.beginPath(); c.ellipse(x, y, 6, 3.2, 0.5, 0, 7); c.fill(); });
    c.beginPath(); c.moveTo(12, 62); c.lineTo(116, 62); c.bezierCurveTo(112, 104, 90, 116, 64, 116); c.bezierCurveTo(38, 116, 16, 104, 12, 62); c.closePath(); fs(c, '#4aa3df');
    c.strokeStyle = '#bfe3fa'; c.lineWidth = 4; c.beginPath(); c.moveTo(24, 80); c.quadraticCurveTo(64, 92, 104, 80); c.stroke();
  },
  egg(c) {
    c.beginPath(); c.moveTo(64, 12); c.bezierCurveTo(96, 12, 110, 64, 100, 90); c.bezierCurveTo(92, 114, 36, 114, 28, 90); c.bezierCurveTo(18, 64, 32, 12, 64, 12); c.closePath(); fs(c, '#fff6e3');
    c.fillStyle = 'rgba(255,255,255,.95)'; c.beginPath(); c.ellipse(48, 44, 7, 13, 0.4, 0, 7); c.fill();
  },
  banana(c) {
    c.beginPath(); c.moveTo(24, 30); c.bezierCurveTo(24, 90, 70, 118, 112, 86); c.bezierCurveTo(116, 80, 110, 74, 104, 76); c.bezierCurveTo(72, 92, 48, 76, 44, 30); c.closePath(); fs(c, '#ffd93d');
    c.beginPath(); c.moveTo(24, 30); c.lineTo(44, 30); c.lineTo(42, 16); c.lineTo(26, 16); c.closePath(); fs(c, '#8a5a2b', 4);
    c.strokeStyle = '#e0b020'; c.lineWidth = 3; c.beginPath(); c.moveTo(38, 46); c.bezierCurveTo(46, 82, 70, 94, 96, 86); c.stroke();
  },
  apple(c) {
    c.beginPath(); c.moveTo(64, 34); c.bezierCurveTo(92, 14, 120, 42, 110, 78); c.bezierCurveTo(104, 106, 82, 118, 64, 108); c.bezierCurveTo(46, 118, 24, 106, 18, 78); c.bezierCurveTo(8, 42, 36, 14, 64, 34); c.closePath(); fs(c, '#e63946');
    c.strokeStyle = '#7a4a1e'; c.lineWidth = 6; c.beginPath(); c.moveTo(64, 36); c.quadraticCurveTo(64, 22, 72, 12); c.stroke();
    c.beginPath(); c.ellipse(88, 20, 16, 8, -0.5, 0, 7); fs(c, '#4caf50', 4);
    c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(36, 58, 6, 12, 0.3, 0, 7); c.fill();
  },
  bread(c) {
    const p = () => { c.beginPath(); c.moveTo(28, 112); c.lineTo(28, 62); c.bezierCurveTo(6, 58, 8, 18, 38, 18); c.bezierCurveTo(48, 8, 80, 8, 90, 18); c.bezierCurveTo(120, 18, 122, 58, 100, 62); c.lineTo(100, 112); c.closePath(); };
    p(); fs(c, '#c98a4b');
    c.save(); c.translate(64, 66); c.scale(0.8, 0.8); c.translate(-64, -66); p(); c.fillStyle = '#fff1cf'; c.fill(); c.restore();
    c.fillStyle = 'rgba(224,163,95,.5)'; [[52, 60], [74, 78], [56, 94], [80, 52]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 3, 0, 7); c.fill(); });
  },
  milk(c) {
    c.beginPath(); c.moveTo(34, 44); c.lineTo(50, 18); c.lineTo(80, 18); c.lineTo(94, 44); c.closePath(); fs(c, '#dbe8ef');
    c.beginPath(); c.rect(34, 44, 60, 70); fs(c, '#ffffff');
    c.beginPath(); c.rect(34, 66, 60, 26); c.fillStyle = '#4aa3df'; c.fill(); c.lineWidth = 4; c.strokeStyle = INK; c.stroke();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(64, 79, 7, 0, 7); c.fill();
  },
  sausage(c) {
    rr(c, 12, 54, 104, 46, 22); fs(c, '#e0a35f');
    rr(c, 6, 40, 116, 32, 16); fs(c, '#c8553d');
    c.strokeStyle = '#ffd93d'; c.lineWidth = 5; c.beginPath(); c.moveTo(20, 56);
    for (let i = 1; i <= 8; i++) c.lineTo(20 + i * 11, i % 2 ? 48 : 62); c.stroke();
  },
  cucumber(c) {
    c.save(); c.translate(60, 52); c.rotate(-0.5); rr(c, -56, -18, 112, 36, 18); fs(c, '#4caf50');
    c.fillStyle = '#7ed37f'; [-30, -6, 18, 40].forEach(x => { c.beginPath(); c.ellipse(x, 0, 3, 8, 0, 0, 7); c.fill(); }); c.restore();
    c.beginPath(); c.arc(92, 94, 22, 0, 7); fs(c, '#8bd48a');
    c.beginPath(); c.arc(92, 94, 14, 0, 7); c.fillStyle = '#e9f7dc'; c.fill();
    c.fillStyle = '#b8dc9a'; [[86, 90], [98, 92], [92, 100], [90, 86]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 2.5, 0, 7); c.fill(); });
  },
};
const ICON = {};
Object.keys(FOOD_DB).forEach(id => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  if (ICON_DRAW[id]) ICON_DRAW[id](cv.getContext('2d'));
  ICON[id] = ICON_DRAW[id] ? { canvas: cv, url: cv.toDataURL() } : null;
});
const ico = (id, px) => ICON[id]
  ? `<img src="${ICON[id].url}" width="${px}" height="${px}" alt="" style="display:block;pointer-events:none">`
  : (FOOD_DB[id].emoji || '');

/* ---------- 1.6) เสียง (WebAudio สังเคราะห์เอง ไม่ต้องใช้ไฟล์เสียง) ---------- */
const SFX = (() => {
  let ctx = null, master = null, musicBus = null, muted = false, timer = 0, step = 0, next = 0;
  try { muted = localStorage.getItem('kk_muted') === '1'; } catch (e) { /* ใช้ค่าเริ่มต้น */ }
  const N = m => 440 * Math.pow(2, (m - 69) / 12);   // MIDI → Hz
  function tone(f, t, dur, type, vol, bus, f2) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus || master); o.start(t); o.stop(t + dur + 0.05);
  }
  const FX = {
    pop:    t => { tone(N(76), t, 0.12, 'sine', 0.22); tone(N(83), t + 0.07, 0.18, 'sine', 0.2); },
    click:  t => tone(N(72), t, 0.06, 'triangle', 0.12),
    step:   t => tone(140 + Math.random() * 30, t, 0.06, 'triangle', 0.06, null, 80),
    info:   t => { tone(N(84), t, 0.25, 'sine', 0.14); tone(N(91), t + 0.06, 0.3, 'sine', 0.1); },
    open:   t => { tone(N(67), t, 0.1, 'triangle', 0.15); tone(N(74), t + 0.07, 0.15, 'triangle', 0.15); },
    close:  t => { tone(N(74), t, 0.1, 'triangle', 0.13); tone(N(67), t + 0.07, 0.15, 'triangle', 0.13); },
    add:    t => { tone(N(72), t, 0.1, 'square', 0.06); tone(N(79), t + 0.07, 0.15, 'square', 0.06); },
    remove: t => tone(N(72), t, 0.1, 'triangle', 0.12, null, N(62)),
    warn:   t => { tone(N(55), t, 0.16, 'sawtooth', 0.07); tone(N(53), t + 0.2, 0.22, 'sawtooth', 0.07); },
    good:   t => { [72, 76, 79, 84].forEach((m, i) => tone(N(m), t + i * 0.12, 0.3, 'triangle', 0.18)); tone(N(88), t + 0.5, 0.6, 'sine', 0.14); },
    bad:    t => { tone(N(62), t, 0.28, 'triangle', 0.16, null, N(55)); tone(N(57), t + 0.28, 0.45, 'triangle', 0.16, null, N(50)); },
  };
  // เพลงพื้นหลังเบา ๆ: ทำนองสเกลเพนทาโทนิก + เบสไล่คอร์ด C–Am–F–G (หน่วยละ 1 จังหวะ)
  const MEL = [72, 0, 76, 0, 79, 76, 74, 0,  69, 0, 72, 0, 76, 72, 69, 0,  72, 0, 74, 0, 77, 74, 72, 0,  74, 0, 71, 0, 79, 74, 71, 0];
  const BASS = [48, 45, 41, 43];
  function schedule() {
    if (!ctx) return;
    while (next < ctx.currentTime + 0.4) {
      const m = MEL[step];
      if (m) tone(N(m), next, 0.34, 'triangle', 0.05, musicBus);
      if (step % 8 === 0) tone(N(BASS[step / 8]), next, 1.9, 'sine', 0.07, musicBus);
      next += 0.3; step = (step + 1) % 32;
    }
  }
  function updateBtn() { const b = document.getElementById('btn-sound'); if (b) { b.textContent = muted ? '🔇' : '🔊'; b.setAttribute('aria-pressed', String(!muted)); } }
  function resume() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      ctx = new AC(); master = ctx.createGain(); master.gain.value = muted ? 0 : 0.85; master.connect(ctx.destination);
      musicBus = ctx.createGain(); musicBus.gain.value = 0.7; musicBus.connect(master);
      next = ctx.currentTime + 0.2; timer = setInterval(schedule, 120);
    }
    if (ctx.state === 'suspended') ctx.resume();
  }
  document.addEventListener('visibilitychange', () => { if (ctx) { if (document.hidden) ctx.suspend(); else if (!muted) ctx.resume(); } });
  return {
    resume, updateBtn,
    play(name) { if (!ctx || muted || ctx.state !== 'running' || !FX[name]) return; FX[name](ctx.currentTime + 0.005); },
    toggle() { resume(); muted = !muted; try { localStorage.setItem('kk_muted', muted ? '1' : '0'); } catch (e) { /* ไม่เป็นไร */ } if (master) master.gain.value = muted ? 0 : 0.85; updateBtn(); if (!muted) FX.click(ctx.currentTime + 0.005); },
  };
})();
['pointerdown', 'keydown', 'touchstart'].forEach(ev => window.addEventListener(ev, () => SFX.resume(), { passive: true }));

/* ลูกเล่น: กระดาษสีเมื่อได้ผลลัพธ์ดี */
function confetti() {
  const box = document.createElement('div'); box.className = 'confetti';
  const cols = ['#ffd86b', '#3fbf7f', '#e4572e', '#4aa3df', '#ff9ec4'];
  for (let i = 0; i < 46; i++) {
    const p = document.createElement('i');
    p.style.cssText = `left:${Math.random() * 100}%;background:${cols[i % 5]};animation-delay:${(Math.random() * 0.7).toFixed(2)}s;animation-duration:${(1.8 + Math.random() * 1.4).toFixed(2)}s`;
    box.appendChild(p);
  }
  $('ui').appendChild(box); setTimeout(() => box.remove(), 4300);
}

const PROFILE = {
  label: 'เด็กตัวอย่าง (เกณฑ์สำหรับทดสอบเกม)',
  mealShare: 0.25,
  warnAt: 0.7,
  rules: {
    energy:     { type: 'range', daily: 1600, lo: 0.65, hi: 1.25 },
    protein:    { type: 'range', daily: 40,   lo: 0.8,  hi: 2.0 },
    sodium:     { type: 'max',   daily: 1500 },
    potassium:  { type: 'max',   daily: 2400 },
    phosphorus: { type: 'max',   daily: 1200 },
  },
};

const LEVELS = [
  {
    id: 'breakfast',
    title: 'ด่านที่ 1: อาหารเช้า',
    mission: 'เดินเก็บวัตถุดิบจากเคาน์เตอร์ แล้วกด E หรือคลิกที่กระเป๋าเพื่อจัดอาหารเช้าให้ครบ 3 อย่าง',
    pickCount: 3,
    ingredients: ['rice', 'egg', 'banana', 'apple', 'bread', 'milk', 'sausage', 'cucumber'],
    counterSlots: [90, 210, 330, 450, 570, 690, 810, 900].map(x => ({ x, y: 138 })),
    start: { x: 480, y: 280 },
  },
];

const CFG = { W: 960, H: 450, speed: 210, pickRange: 85, minX: 30, maxX: 930, minY: 208, maxY: 425, playerR: 18 };

/* ---------- 2) ตรรกะคำนวณ + แจ้งเตือน ---------- */
const fmt = v => (Math.round(v * 10) / 10).toLocaleString('en-US');

function portionAmount(id, key) {
  const f = FOOD_DB[id];
  if (f.ref.amount !== 100 || f.ref.unit !== 'g') throw new Error('ปริมาณอ้างอิงไม่สอดคล้องกัน ไม่สามารถคำนวณได้');
  return f.n[key] * f.portion.grams / 100;
}

function ruleBounds(key) {
  const r = PROFILE.rules[key];
  if (!r) return null;
  const meal = r.daily * PROFILE.mealShare;
  return r.type === 'max' ? { type: 'max', daily: r.daily, meal, max: meal }
                          : { type: 'range', daily: r.daily, meal, min: meal * r.lo, max: meal * r.hi };
}

function evaluateMeal(ids, opt = {}) {
  const rows = NUTRIENTS.map(nu => {
    const parts = ids.map(id => ({ id, v: portionAmount(id, nu.key) }));
    const total = parts.reduce((s, p) => s + p.v, 0);
    const b = ruleBounds(nu.key);
    let status = 'none', kind = 'none', pct = null;
    if (b) {
      pct = total / b.meal;
      if (b.type === 'max') {
        kind = total > b.max ? 'high' : pct > PROFILE.warnAt ? 'near' : 'ok';
        status = kind === 'high' ? 'red' : kind === 'near' ? 'yellow' : 'green';
      } else {
        kind = total > b.max ? 'high' : total < b.min ? 'low' : 'ok';
        status = kind === 'high' ? 'red' : kind === 'low' ? (opt.partial ? 'pending' : 'yellow') : 'green';
      }
    }
    return { ...nu, parts, total, bounds: b, pct, status, kind };
  });

  const others = Object.keys(FOOD_DB).filter(id => !ids.includes(id));
  const collectedOthers = others.filter(id => state.collected.includes(id));
  const pool = collectedOthers.length ? collectedOthers : others;
  const dish = id => `${FOOD_DB[id].emoji}${FOOD_DB[id].name}`;

  const alerts = [];
  rows.forEach(r => {
    if (r.status !== 'red' && r.status !== 'yellow') return;
    const b = r.bounds, u = r.unit;
    const a = { key: r.key, level: r.status, title: '', detail: '', tip: '' };
    if (r.kind === 'near') {
      a.title = `${r.label}ใกล้ถึงเกณฑ์แล้ว`;
      a.detail = `รวม ${fmt(r.total)} จากเกณฑ์ ${fmt(b.max)} ${u} (${Math.round(r.pct * 100)}%)`;
    } else if (r.kind === 'high') {
      a.title = `${r.label}${b.type === 'max' ? 'เกินเกณฑ์' : 'สูงเกินไป'}`;
      a.detail = b.type === 'max'
        ? `รวม ${fmt(r.total)} จากเกณฑ์ ${fmt(b.max)} ${u} (${Math.round(r.pct * 100)}%) เกินมา ${fmt(r.total - b.max)} ${u}`
        : `รวม ${fmt(r.total)} สูงกว่าช่วง ${fmt(b.min)}–${fmt(b.max)} ${u}`;
    } else {
      a.title = `${r.label}ต่ำไปหน่อย`;
      a.detail = `รวม ${fmt(r.total)} ต่ำกว่าช่วง ${fmt(b.min)}–${fmt(b.max)} ${u}`;
    }
    if (r.kind === 'high' || r.kind === 'near') {
      const top = r.parts.slice().sort((x, y) => y.v - x.v)[0];
      const cand = pool.slice().sort((x, y) => portionAmount(x, r.key) - portionAmount(y, r.key))[0];
      a.tip = `${dish(top.id)} ให้${r.label}มากที่สุด (${fmt(top.v)} ${u})`;
      if (cand && portionAmount(cand, r.key) < top.v)
        a.tip += ` · ลองสลับเป็น ${dish(cand)} (${fmt(portionAmount(cand, r.key))} ${u})${state.collected.includes(cand) ? '' : ' ต้องกลับไปเก็บก่อน'}`;
    } else {
      const safe = id => Object.keys(PROFILE.rules).every(k => {
        const bb = ruleBounds(k); return bb.type !== 'max' || portionAmount(id, k) <= bb.max * PROFILE.warnAt;
      });
      const cand = pool.filter(safe).sort((x, y) => portionAmount(y, r.key) - portionAmount(x, r.key))[0];
      if (cand) a.tip = `ลองเพิ่ม/สลับเป็น ${dish(cand)} (${fmt(portionAmount(cand, r.key))} ${u})${state.collected.includes(cand) ? '' : ' ต้องกลับไปเก็บก่อน'}`;
    }
    alerts.push(a);
  });
  const level = alerts.some(a => a.level === 'red') ? 'bad' : alerts.length ? 'warn' : 'good';
  return { rows, alerts, level };
}

const VERDICT = {
  good: { icon: '✅', cls: 'g', text: 'เหมาะสมตามเกณฑ์ตัวอย่าง' },
  warn: { icon: '⚠️', cls: 'y', text: 'พอใช้ แต่ควรระวังบางค่า' },
  bad:  { icon: '❌', cls: 'r', text: 'ยังไม่เหมาะ ลองเปลี่ยนวัตถุดิบ' },
};
const STATUS_ICON = { green: '✅', yellow: '⚠️', red: '❌', pending: '…', none: '' };
const STATUS_CLS  = { green: 'g', yellow: 'y', red: 'r', pending: '', none: '' };

/* ---------- 3) สถานะ + UI (DOM) ---------- */
const state = { mode: 'play', infoOpen: false, warnOpen: false, collected: [], plated: [], level: LEVELS[0] };
const $ = id => document.getElementById(id);
let scene = null;
let toastTimer = null;

function limitText(b) {
  if (!b) return '—';
  return b.type === 'max' ? `≤ ${fmt(b.max)}` : `${fmt(b.min)}–${fmt(b.max)}`;
}

const UI = {
  canPlay: () => state.mode === 'play' && !state.infoOpen,

  toast(msg) {
    const t = $('toast'); t.textContent = msg; t.classList.remove('hidden'); t.style.animation = 'none'; void t.offsetWidth; t.style.animation = '';
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.add('hidden'), 2200);
  },

  renderHud() {
    const lv = state.level;
    $('mission-title').textContent = lv.title;
    $('mission-text').textContent =
      `${lv.mission} (เก็บแล้ว ${state.collected.length}/${lv.ingredients.length} · ในจาน ${state.plated.length}/${lv.pickCount})`;
    $('bag-count').textContent = `${state.collected.length}/${lv.ingredients.length}`;
    const bagEl = $('bag-slots'), keepScroll = bagEl.scrollLeft;   // จำตำแหน่งเลื่อนไว้ ไม่ให้เด้งกลับต้นแถว
    bagEl.innerHTML = '';
    for (let i = 0; i < lv.ingredients.length; i++) {
      const b = document.createElement('button');
      const id = state.collected[i];
      b.className = 'bag-slot';
      
      if (id) {
        const f = FOOD_DB[id];
        b.classList.add('filled'); if (state.plated.includes(id)) b.classList.add('plated'); if (i >= (UI._n || 0)) b.classList.add('pop');
        b.innerHTML = ico(id, 30); b.title = `${f.name} – คลิกเพื่อรวมเข้าจานหรือดูข้อมูล`;
        b.onclick = () => UI.openPlate();
      } else { b.disabled = true; b.tabIndex = -1; }
      bagEl.appendChild(b);
    }
    bagEl.scrollLeft = keepScroll;
    UI._n = state.collected.length;
  },

  scrollBagTo(i) {
    const el = $('bag-slots'), s = el.children[i];
    if (s) el.scrollLeft = Math.max(0, s.offsetLeft - el.offsetLeft - (el.clientWidth - s.offsetWidth));
  },

  openInfo(id) {
    SFX.play('info');
    const f = FOOD_DB[id];
    $('im-emoji').innerHTML = ico(id, 60);
    $('im-name').textContent = f.name;
    $('im-ref').textContent = `ปริมาณที่กินในเกม: ${f.portion.label} = ${f.portion.grams} กรัม`;
    const rows = NUTRIENTS.map(nu => {
      const per = portionAmount(id, nu.key), b = ruleBounds(nu.key);
      let cell = '—', cls = '';
      if (b) {
        const pct = per / b.meal; cell = Math.round(pct * 100) + '%';
        if (b.type === 'max') cls = pct > 1 ? 'r' : pct > PROFILE.warnAt ? 'y' : 'g';
      }
      return `<tr class="${nu.mineral ? 'mineral' : ''}"><td>${nu.label}</td><td>${fmt(f.n[nu.key])}</td>` +
             `<td><b>${fmt(per)}</b> ${nu.unit}</td><td><span class="chip ${cls}">${cell}</span></td></tr>`;
    }).join('');
    $('im-table').innerHTML =
      `<tr class="th"><th></th><th>ต่อ ${f.ref.label}</th><th>ต่อ ${f.portion.label}</th><th>% เกณฑ์/เป้ามื้อเช้า</th></tr>` + rows;
    $('im-note').textContent = DATA_NOTE;
    $('info-modal').classList.remove('hidden');
    state.infoOpen = true;
    $('im-close').focus();
  },
  closeInfo() { $('info-modal').classList.add('hidden'); state.infoOpen = false; },

  openPlate() { SFX.play('open'); state.mode = 'plate'; $('plate-modal').classList.remove('hidden'); UI.renderPlate(); },
  closePlate() { SFX.play('close'); $('plate-modal').classList.add('hidden'); state.mode = 'play'; UI.renderHud(); },

  renderPlate() {
    const need = state.level.pickCount;
    const grid = $('pm-items'); grid.innerHTML = '';
    if (!state.collected.length) {
      grid.innerHTML = '<div class="empty">ยังไม่มีวัตถุดิบ ปิดหน้าต่างนี้ แล้วไปเก็บจากเคาน์เตอร์ก่อนนะ</div>';
    }
    state.collected.forEach(id => {
      const f = FOOD_DB[id], used = state.plated.includes(id), full = state.plated.length >= need;
      const d = document.createElement('div');
      d.className = 'pcard' + (used ? ' used' : '');
      d.innerHTML = `<span class="e" style="font-size: 28px; display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px;">${ico(id, 34)}</span><span class="n">${f.name}<small>${f.portion.label} · ${f.portion.grams} g</small></span><span class="b"></span>`;
      const info = document.createElement('button');
      info.className = 'btn small'; info.textContent = 'ข้อมูล'; info.onclick = () => UI.openInfo(id);
      const add = document.createElement('button');
      add.className = 'btn small primary'; add.textContent = used ? 'อยู่ในจาน' : 'ใส่จาน';
      add.disabled = used || full; add.onclick = () => UI.addToPlate(id);
      d.querySelector('.b').append(info, add);
      grid.appendChild(d);
    });
    const slots = $('pm-slots'); slots.innerHTML = '';
    for (let i = 0; i < need; i++) {
      const id = state.plated[i], s = document.createElement('div');
      s.className = 'slot' + (id ? ' filled' : '');
      if (id) {
        const f = FOOD_DB[id];
        s.innerHTML = `<span class="e" style="font-size: 26px; display: inline-flex; align-items: center; justify-content: center;">${ico(id, 30)}</span><span class="n">${f.name}</span>`;
        const rm = document.createElement('button');
        rm.className = 'btn small'; rm.textContent = 'นำออก'; rm.onclick = () => UI.removeFromPlate(id);
        s.appendChild(rm);
      } else s.textContent = 'ช่องว่าง – เลือกวัตถุดิบมาใส่';
      slots.appendChild(s);
    }
    $('pm-count').textContent = `${state.plated.length}/${need}`;
    const ok = state.plated.length === need;
    $('pm-confirm').disabled = !ok;

    const ev = evaluateMeal(state.plated, { partial: !ok });
    $('pm-meters').innerHTML = ev.rows.filter(r => r.bounds).map(r => {
      const scale = r.bounds.max * 1.25, w = Math.min(100, r.total / scale * 100);
      const cls = STATUS_CLS[r.status];
      return `<div class="meter"><span class="ml">${r.label}</span>` +
        `<div class="bar"><i class="${cls}" style="width:${w}%"></i><b class="lim" style="left:80%"></b></div>` +
        `<span class="mv ${cls}">${fmt(r.total)}/${r.bounds.type === 'max' ? fmt(r.bounds.max) : fmt(r.bounds.min) + '–' + fmt(r.bounds.max)} ${r.unit}</span></div>`;
    }).join('');
    if (!state.plated.length) { $('pm-msg').className = ''; $('pm-msg').textContent = 'เลือกวัตถุดิบมาใส่จาน มาตรวัดจะเตือนทันทีถ้าค่าไหนเกินเกณฑ์'; }
    else if (ev.alerts.length) {
      const a = ev.alerts.slice().sort((x, y) => (y.level === 'red') - (x.level === 'red'))[0];
      $('pm-msg').className = a.level === 'red' ? 'r' : 'y';
      $('pm-msg').textContent = `${STATUS_ICON[a.level === 'red' ? 'red' : 'yellow']} ${a.title}${ev.alerts.length > 1 ? ` (และอีก ${ev.alerts.length - 1} รายการ)` : ''}`;
    } else {
      $('pm-msg').className = 'g';
      $('pm-msg').textContent = ok ? '✅ ตอนนี้ทุกค่าอยู่ในเกณฑ์ตัวอย่าง กดยืนยันได้เลย' : `✅ ยังไม่เกินเกณฑ์ เลือกอีก ${need - state.plated.length} อย่าง`;
    }
  },

  addToPlate(id) {
    if (!state.collected.includes(id)) return;
    if (state.plated.includes(id)) return;
    if (state.plated.length >= state.level.pickCount) return;
    const before = new Set(evaluateMeal(state.plated, { partial: true }).alerts.filter(a => a.level === 'red').map(a => a.key));
    state.plated.push(id);
    const now = evaluateMeal(state.plated, { partial: true }).alerts.filter(a => a.level === 'red' && !before.has(a.key));
    UI.renderPlate();
    SFX.play(now.length ? 'warn' : 'add');
    if (now.length) UI.toast(`⚠️ ${FOOD_DB[id].emoji}${FOOD_DB[id].name} ทำให้${now.map(a => a.title).join(', ')}`);
  },
  removeFromPlate(id) { SFX.play('remove'); state.plated = state.plated.filter(x => x !== id); UI.renderPlate(); },

  confirmPlate() {
    if (state.plated.length !== state.level.pickCount) return;
    const ev = evaluateMeal(state.plated);
    if (ev.level === 'bad') return UI.openWarn(ev);
    UI.showSummary();
  },
  openWarn(ev) {
    $('wm-list').innerHTML = ev.alerts.filter(a => a.level === 'red').map(a =>
      `<li><b>${a.title}</b><br>${a.detail}${a.tip ? `<br><small>${a.tip}</small>` : ''}</li>`).join('');
    SFX.play('warn'); if (scene) scene.cameras.main.shake(180, 0.004);
    $('warn-modal').classList.remove('hidden'); state.warnOpen = true; $('wm-back').focus();
  },
  closeWarn() { $('warn-modal').classList.add('hidden'); state.warnOpen = false; },

  showSummary() {
    UI.closeWarn();
    const ev = evaluateMeal(state.plated), v = VERDICT[ev.level];
    $('plate-modal').classList.add('hidden');
    state.mode = 'summary';
    SFX.play(ev.level === 'bad' ? 'bad' : 'good'); if (ev.level === 'good') confetti();
    $('sm-items').innerHTML = state.plated.map(id => {
      const f = FOOD_DB[id];
      return `<div class="sitem"><span class="e" style="font-size: 26px; display: inline-flex; align-items: center; justify-content: center;">${ico(id, 30)}</span><span class="n">${f.name}<small>${f.portion.label} (${f.portion.grams} g)</small></span></div>`;
    }).join('');
    $('sm-verdict').className = 'verdict ' + v.cls;
    $('sm-verdict').textContent = `${v.icon} ${v.text}`;
    $('sm-alerts').innerHTML = ev.alerts.length
      ? ev.alerts.map(a => `<div class="alert ${a.level === 'red' ? 'r' : 'y'}"><b>${STATUS_ICON[a.level]} ${a.title}</b><span>${a.detail}</span>${a.tip ? `<small>${a.tip}</small>` : ''}</div>`).join('')
      : '<div class="alert g"><b>✅ ทุกค่าอยู่ในเกณฑ์ตัวอย่าง</b></div>';
    const head = `<tr class="th"><th>สารอาหาร</th>${state.plated.map(id => `<th><span style="font-size: 22px;">${ico(id, 26)}</span></th>`).join('')}<th>รวม</th><th>เกณฑ์/มื้อ</th><th>ผล</th></tr>`;
    const body = ev.rows.map(r => {
      const res = r.bounds
        ? `${STATUS_ICON[r.status]} ${r.kind === 'low' ? 'ต่ำ' : Math.round(r.pct * 100) + '%'}`
        : '—';
      return `<tr class="${r.mineral ? 'mineral' : ''}"><td>${r.label}</td>${r.parts.map(p => `<td>${fmt(p.v)}</td>`).join('')}` +
             `<td><b>${fmt(r.total)}</b> ${r.unit}</td><td>${limitText(r.bounds)}</td><td class="${STATUS_CLS[r.status]}">${res}</td></tr>`;
    }).join('');
    $('sm-table').innerHTML = head + body;
    const share = Math.round(PROFILE.mealShare * 100);
    $('sm-formula').textContent =
      `วิธีคำนวณ: ค่าต่อ 100 g × กรัมที่กิน ÷ 100 แล้วบวกกัน · เกณฑ์มื้อเช้า = เกณฑ์ต่อวัน × ${share}% ` +
      `(ต่อวัน: โซเดียม ${fmt(PROFILE.rules.sodium.daily)} mg, โพแทสเซียม ${fmt(PROFILE.rules.potassium.daily)} mg, ฟอสฟอรัส ${fmt(PROFILE.rules.phosphorus.daily)} mg, ` +
      `พลังงาน ${fmt(PROFILE.rules.energy.daily)} kcal, โปรตีน ${fmt(PROFILE.rules.protein.daily)} g) · % = ค่ารวม ÷ เกณฑ์/เป้าต่อมื้อ`;
    $('sm-note').textContent = DATA_NOTE;
    $('summary-modal').classList.remove('hidden');
    $('sm-restart').focus();
  },

  escape() {
    if (state.warnOpen) return UI.closeWarn();
    if (state.infoOpen) return UI.closeInfo();
    if (state.mode === 'plate') return UI.closePlate();
  },

  restart() {
    state.mode = 'play'; state.infoOpen = false; state.warnOpen = false; state.collected = []; state.plated = [];
    ['info-modal', 'plate-modal', 'summary-modal', 'warn-modal'].forEach(id => $(id).classList.add('hidden'));
    if (scene) scene.resetWorld();
    UI.renderHud();
  },

  bind() {
    $('im-close').onclick = UI.closeInfo;
    $('pm-close').onclick = UI.closePlate;
    $('pm-confirm').onclick = UI.confirmPlate;
    $('sm-restart').onclick = UI.restart;
    $('wm-back').onclick = UI.closeWarn;
    $('wm-go').onclick = UI.showSummary;
    document.querySelectorAll('.btn').forEach(b => b.addEventListener('click', () => SFX.play('click')));
    $('btn-sound').onclick = SFX.toggle; SFX.updateBtn();
    
    const bagWrap = document.querySelector('.bag-wrap');
    if (bagWrap) {
      bagWrap.style.cursor = 'pointer';
      bagWrap.onclick = () => {
        if (state.mode === 'play') {
          UI.openPlate();
        }
      };
    }
  },
};

/* ---------- 3.5) ควบคุมด้วยการสัมผัส (มือถือ) ---------- */
const touch = { x: 0, y: 0, e: false, f: false };
function bindTouch() {
  const wrap = $('game-wrap');
  const mq = q => { try { return window.matchMedia(q).matches; } catch (e) { return false; } };
  const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) ||
    mq('(pointer: coarse)') || mq('(hover: none)') || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
    /[?&]touch=1\b/.test(location.search);                    // ?touch=1 บังคับแสดงปุ่มบนคอมเพื่อทดสอบ
  if (isTouch) wrap.classList.add('touch');
  // เผื่อเบราว์เซอร์ในแอป (เช่น LINE) ตรวจไม่พบ: แตะจอครั้งแรกแล้วแสดงปุ่มทันที
  window.addEventListener('touchstart', () => wrap.classList.add('touch'), { once: true, passive: true });
  window.addEventListener('pointerdown', ev => { if (ev.pointerType === 'touch' || ev.pointerType === 'pen') wrap.classList.add('touch'); }, { passive: true });

  const base = $('joy'), knob = $('joy-knob');
  const R = () => (base.offsetWidth - knob.offsetWidth) / 2;   // ระยะลากสูงสุดของปุ่มจอย
  let pid = null;

  const move = ev => {
    const r = base.getBoundingClientRect();
    const k = (r.width / base.offsetWidth) || 1;            // สเกลปัจจุบันของกล่องเกม
    const dx0 = (ev.clientX - (r.left + r.width / 2)) / k;  // แปลงกลับเป็นหน่วย 960x540
    const dy0 = (ev.clientY - (r.top + r.height / 2)) / k;
    let dx = dx0, dy = dy0;
    const len = Math.hypot(dx, dy);
    const Rm = R();
    if (len > Rm) { dx *= Rm / len; dy *= Rm / len; }
    knob.style.transform = `translate(${dx}px,${dy}px)`;
    const magnitude = Math.hypot(dx, dy);
    touch.x = magnitude < 8 ? 0 : dx / Rm;
    touch.y = magnitude < 8 ? 0 : dy / Rm;
  };

  const end = ev => {
    if (ev.pointerId !== pid) return;
    pid = null;
    touch.x = touch.y = 0;
    knob.style.transform = 'translate(0,0)';
  };

  base.addEventListener('pointerdown', ev => {
    ev.preventDefault();
    if (pid !== null) return;
    pid = ev.pointerId;
    base.setPointerCapture(pid);
    move(ev);
  });
  base.addEventListener('pointermove', ev => { if (ev.pointerId === pid) move(ev); });
  base.addEventListener('pointerup', end);
  base.addEventListener('pointercancel', end);
  base.addEventListener('lostpointercapture', () => {
    pid = null; touch.x = touch.y = 0; knob.style.transform = 'translate(0,0)';
  });

  const bindAction = (id, key) => {
    const button = $(id);
    button.addEventListener('pointerdown', ev => {
      ev.preventDefault();
      if (key === 'e') touch.e = true;
      if (key === 'f') touch.f = true;
    });
    button.addEventListener('contextmenu', ev => ev.preventDefault());
  };
  bindAction('btn-e', 'e');
  bindAction('btn-f', 'f');
}

/* ---------- 4) ฉากเกม (Phaser) – มุมมองด้านบน (Top-down) ---------- */
class KitchenScene extends Phaser.Scene {
  constructor() { super('Kitchen'); }

  preload() {
    Object.keys(FOOD_DB).forEach(id => { if (ICON[id] && !this.textures.exists('food_' + id)) this.textures.addCanvas('food_' + id, ICON[id].canvas); });
  }

  create() {
    scene = this;
    this.level = state.level;
    this.drawRoom();
    this.items = this.level.ingredients.map((id, i) => this.makeItem(id, this.level.counterSlots[i]));
    this.makePlayer();
    this.hl = this.add.graphics().setDepth(2); this.stepT = 0;
    this.prompt = this.add.text(0, 0, '', {
      fontFamily: 'Sarabun, Tahoma, sans-serif', fontSize: '24px', fontStyle: 'bold', color: '#1f2d4a',
      backgroundColor: '#fffdf6', padding: { x: 12, y: 6 },
    }).setOrigin(0.5, 1).setDepth(50).setVisible(false);
    this.keys = this.input.keyboard.addKeys({
      left: 'LEFT', right: 'RIGHT', up: 'UP', down: 'DOWN', a: 'A', d: 'D', w: 'W', s: 'S', e: 'E', f: 'F', esc: 'ESC',
    });
    UI.bind(); UI.renderHud();
    this.layoutCamera(); this.scale.on('resize', this.layoutCamera, this);
  }

  drawRoom() {
    // ห้องครัว: วาดกว้างเกินพื้นที่ออกแบบ 960x540 เพื่อให้พื้นหลังเต็มจอทุกสัดส่วน
    const g = this.add.graphics().setDepth(0), M = 1400, W2 = CFG.W + 2 * M, W = CFG.W;
    const ln = (x1, y1, x2, y2) => { g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.strokePath(); };
    // ผนัง + กระเบื้องซับเวย์ (เฉพาะบริเวณที่มองเห็นได้จริง)
    g.fillStyle(0xe8f3ee).fillRect(-M, -M, W2, 96 + M);
    g.fillStyle(0xffffff).fillRect(-360, 56, W + 720, 40);
    g.lineStyle(2, 0xcfdcd6);
    for (let y = 72, r = 0; y <= 96; y += 16, r++) {
      ln(-360, y, W + 360, y);
      for (let x = -360 + (r % 2 ? 16 : 0); x < W + 360; x += 32) ln(x, y - 16, x, y);
    }
    g.lineStyle(4, 0x7fb8a6); ln(-M, 56, W + M, 56);                        // ขอบบนแผ่นกระเบื้อง
    // ราวแขวนอุปกรณ์ครัว
    g.lineStyle(4, 0x8d98a8); ln(-360, 66, W + 360, 66);
    [150, 270, 390, 510, 630, 750, 858].forEach((x, i) => {
      g.lineStyle(3, 0x8d98a8); ln(x, 66, x, 74);
      const k = i % 4;
      if (k === 0) { g.fillStyle(0xb0b8c4).fillCircle(x, 90, 8).lineStyle(2, 0x1f2d4a).strokeCircle(x, 90, 8); g.lineStyle(3, 0x8d98a8); ln(x, 74, x, 82); } // กระบวย
      if (k === 1) { g.fillStyle(0xe4572e).fillRoundedRect(x - 6, 74, 12, 20, 4).lineStyle(2, 0x1f2d4a).strokeRoundedRect(x - 6, 74, 12, 20, 4); }                  // ตะหลิว
      if (k === 2) { g.lineStyle(2, 0x6b7686); for (let d = -6; d <= 6; d += 4) ln(x, 74, x + d, 92); }                                                  // ตะกร้อ
      if (k === 3) { g.fillStyle(0x3d4a63).fillRoundedRect(x - 12, 80, 24, 14, 4).lineStyle(2, 0x1f2d4a).strokeRoundedRect(x - 12, 80, 24, 14, 4); g.lineStyle(3, 0x1f2d4a); ln(x, 74, x, 80); } // หม้อใบเล็ก
    });
    // พื้นกระเบื้องลายหมากรุก
    g.fillStyle(0xd6ebe6).fillRect(-M, 188, W2, 540 + M - 188);
    const cols = Math.ceil(M / 60), rows = Math.ceil((540 + M - 188) / 60);
    g.fillStyle(0xf4faf8);
    for (let iy = 0; iy < rows; iy++) for (let ix = -cols; ix < 16 + cols; ix++) {
      if (((ix + iy) % 2 + 2) % 2) g.fillRect(ix * 60, 188 + iy * 60, 60, 60);
    }
    // พรมกลางห้อง
    g.fillStyle(0xe76f51).fillRoundedRect(290, 292, 380, 118, 22);
    g.fillStyle(0xf6d6a8).fillRoundedRect(302, 304, 356, 94, 14);
    g.fillStyle(0xf4a261).fillRoundedRect(314, 316, 332, 70, 10);
    g.fillStyle(0xe76f51); for (let x = 330; x < 640; x += 36) g.fillCircle(x, 351, 7);
    // เคาน์เตอร์: พื้นไม้ + ขอบ + ตู้ด้านหน้า
    g.fillStyle(0xe0a35f).fillRect(-M, 96, W2, 80);
    g.fillStyle(0xf0bd7e).fillRect(-M, 96, W2, 6);
    g.lineStyle(2, 0xc98a4b); for (let x = -360; x < W + 360; x += 96) ln(x, 102, x, 176);
    g.fillStyle(0xb87939).fillRect(-M, 176, W2, 14);
    g.fillStyle(0xf7ecd6).fillRect(-M, 190, W2, 34);
    g.lineStyle(2, 0xcdb892);
    for (let x = -360; x < W + 360; x += 120) { g.strokeRect(x + 6, 196, 108, 22); g.fillStyle(0xb8a07a).fillRoundedRect(x + 54, 200, 12, 5, 2); }
    g.fillStyle(0x000000, 0.1).fillRect(-M, 224, W2, 10);                           // เงาใต้เคาน์เตอร์
    g.lineStyle(3, 0x1f2d4a); ln(-M, 96, W + M, 96); ln(-M, 224, W + M, 224);
    // ต้นไม้กระถางริมห้อง
    [[16, 320], [944, 320]].forEach(([x, y]) => {
      g.fillStyle(0xc2603a).fillCircle(x, y, 16).lineStyle(3, 0x1f2d4a).strokeCircle(x, y, 16);
      g.fillStyle(0x4caf50); for (let a = 0; a < 6; a++) g.fillCircle(x + Math.cos(a * 1.05) * 9, y + Math.sin(a * 1.05) * 9, 8);
      g.fillStyle(0x7ed37f).fillCircle(x, y, 7);
    });
    // แสงแดดจากหน้าต่าง
    g.fillStyle(0xffffff, 0.22).fillPoints([{ x: 120, y: 236 }, { x: 200, y: 236 }, { x: 290, y: 430 }, { x: 210, y: 430 }], true);
    g.fillStyle(0xffffff, 0.16).fillPoints([{ x: 230, y: 236 }, { x: 280, y: 236 }, { x: 370, y: 430 }, { x: 320, y: 430 }], true);
  }

  // ลูกเล่น: ประกายตอนเก็บของ ข้อความลอย ฝุ่นตอนเดิน
  burst(x, y) {
    const cols = [0xffd86b, 0xffffff, 0x3fbf7f, 0xff9ec4];
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6 + Math.random() * 0.3, d = 40 + Math.random() * 34;
      const p = this.add.circle(x, y, 4 + Math.random() * 3, cols[i % 4]).setDepth(60);
      this.tweens.add({ targets: p, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, alpha: 0, scale: 0.3, duration: 480, ease: 'Cubic.easeOut', onComplete: () => p.destroy() });
    }
    const ring = this.add.circle(x, y, 12).setStrokeStyle(4, 0xffd86b).setDepth(59);
    this.tweens.add({ targets: ring, scale: 4, alpha: 0, duration: 380, onComplete: () => ring.destroy() });
  }
  floatText(x, y, msg) {
    const t = this.add.text(x, y - 40, msg, { fontFamily: 'Mali, Sarabun, sans-serif', fontSize: '26px', fontStyle: 'bold', color: '#ffffff', stroke: '#1f2d4a', strokeThickness: 5 }).setOrigin(0.5).setDepth(61);
    this.tweens.add({ targets: t, y: y - 100, alpha: 0, duration: 900, ease: 'Cubic.easeOut', onComplete: () => t.destroy() });
  }
  dust(x, y) {
    const d = this.add.circle(x, y, 5, 0xffffff, 0.7).setDepth(5);
    this.tweens.add({ targets: d, alpha: 0, scale: 2.2, duration: 380, onComplete: () => d.destroy() });
  }

  // กล้อง: ย่อ/ขยายพื้นที่ออกแบบ 960x540 ให้พอดีจอ (สัดส่วนคงที่) ส่วนเกินแสดงห้องที่วาดต่อออกไป
  layoutCamera() {
    const w = this.scale.width, h = this.scale.height, cam = this.cameras.main;
    cam.setSize(w, h);
    cam.setZoom(Math.max(0.1, Math.min(w / DESIGN_W, h / DESIGN_H)));
    cam.centerOn(DESIGN_W / 2, DESIGN_H / 2);
  }

  makeItem(id, pos) {
    const f = FOOD_DB[id];
    const shadow = this.add.ellipse(pos.x, pos.y + 22, 46, 12, 0x000000, 0.18).setDepth(2);
    const visual = this.textures.exists('food_' + id)
      ? this.add.image(pos.x, pos.y, 'food_' + id).setDisplaySize(58, 58)
      : this.add.text(pos.x, pos.y, f.emoji, { fontSize: '46px' }).setOrigin(0.5);
    visual.setDepth(3);
    const label = this.add.text(pos.x, pos.y + 44, f.name, {
      fontFamily: 'Sarabun, Tahoma, sans-serif', fontSize: '19px', fontStyle: 'bold',
      color: '#fff', stroke: '#1f2d4a', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(3);
    return { id, x: pos.x, y: pos.y, visual, shadow, label, collected: false, baseY: pos.y, s0: visual.scaleX };
  }

  makePlayer() {
    const c = this.add.container(this.level.start.x, this.level.start.y).setDepth(10);
    this.footL = this.add.ellipse(0, -9, 15, 9, 0x1f2d4a);
    this.footR = this.add.ellipse(0, 9, 15, 9, 0x1f2d4a);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.15).fillEllipse(2, 3, 34, 44);                          // เงา
    g.fillStyle(0xf2c29b).fillCircle(2, -20, 6).fillCircle(2, 20, 6);               // มือ
    g.fillStyle(0xffd86b).fillEllipse(0, 0, 22, 42).lineStyle(2, 0x1f2d4a).strokeEllipse(0, 0, 22, 42); // ตัว/เสื้อ
    g.fillStyle(0xf2c29b).fillCircle(3, 0, 13);                                      // หัว
    g.fillStyle(0x000000).fillEllipse(-5, 0, 20, 28);                                // ผม (สีดำ)
    //g.fillStyle(0xffffff).fillCircle(-2, 0, 12).lineStyle(2, 0x1f2d4a).strokeCircle(-2, 0, 12); // หมวกเชฟ
    //g.fillStyle(0xeef2f6).fillCircle(-2, -5, 4).fillCircle(-2, 5, 4).fillCircle(-6, 0, 4);
    g.fillStyle(0xd9a37a).fillCircle(15, 0, 3);                                      // จมูก (บอกทิศหน้า)
    c.add([this.footL, this.footR, g]);
    this.player = c; this.walkT = 0; this.dirAngle = Math.PI / 2;
    c.rotation = this.dirAngle;
  }

  resetWorld() {
    this.items.forEach(it => {
      it.collected = false; it.visual.setVisible(true).setAlpha(1).setScale(it.s0).y = it.baseY;
      it.shadow.setVisible(true); it.label.setVisible(true);
    });
    this.player.setPosition(this.level.start.x, this.level.start.y);
    this.dirAngle = Math.PI / 2; this.player.rotation = this.dirAngle;
  }

  nearest() {
    const p = this.player;
    let best = null, bd = CFG.pickRange + 1;
    this.items.forEach(it => {
      if (it.collected) return;
      const d = Phaser.Math.Distance.Between(p.x, p.y, it.x, it.y);
      if (d <= CFG.pickRange && d < bd) { best = { type: 'item', item: it }; bd = d; }
    });
    return best;
  }

  collect(it) {
    if (it.collected || state.collected.includes(it.id)) return;
    it.collected = true; state.collected.push(it.id);
    this.tweens.add({ targets: it.visual, y: it.baseY - 40, alpha: 0, scale: it.s0 * 1.4, duration: 260,
      onComplete: () => it.visual.setVisible(false) });
    it.shadow.setVisible(false); it.label.setVisible(false);
    SFX.play('pop'); this.burst(it.x, it.y); this.floatText(it.x, it.y, `+ ${FOOD_DB[it.id].name}`);
    UI.renderHud(); UI.scrollBagTo(state.collected.length - 1); UI.toast(`เก็บ${FOOD_DB[it.id].name}แล้ว`);
  }

  update(time, dt) {
    const K = this.keys, JD = Phaser.Input.Keyboard.JustDown;
    const pressE = JD(K.e) || touch.e, pressF = JD(K.f) || touch.f, pressEsc = JD(K.esc);
    touch.e = touch.f = false;
    if (pressEsc) UI.escape();

    const locked = !UI.canPlay();
    $('game-wrap').classList.toggle('locked', locked);
    let vx = 0, vy = 0;
    if (!locked) {
      if (K.left.isDown || K.a.isDown) vx -= 1;
      if (K.right.isDown || K.d.isDown) vx += 1;
      if (K.up.isDown || K.w.isDown) vy -= 1;
      if (K.down.isDown || K.s.isDown) vy += 1;
      vx += touch.x; vy += touch.y;
    }
    const len = Math.hypot(vx, vy);
    if (len > 1) { vx /= len; vy /= len; }
    const p = this.player;
    if (len > 0.05) {
      let nx = Phaser.Math.Clamp(p.x + vx * CFG.speed * dt / 1000, CFG.minX, CFG.maxX);
      let ny = Phaser.Math.Clamp(p.y + vy * CFG.speed * dt / 1000, CFG.minY, CFG.maxY);
      p.setPosition(nx, ny);
      this.dirAngle = Phaser.Math.Angle.RotateTo(this.dirAngle, Math.atan2(vy, vx), 0.25);
      p.rotation = this.dirAngle;
      this.walkT += dt / 90;
      this.stepT += dt;
      if (this.stepT > 260) { this.stepT = 0; SFX.play('step'); this.dust(p.x - Math.cos(this.dirAngle) * 14, p.y - Math.sin(this.dirAngle) * 14); }
    } else { this.walkT = 0; this.stepT = 200; }
    this.footL.x = Math.sin(this.walkT) * 7; this.footR.x = -Math.sin(this.walkT) * 7;

    const near = locked ? null : this.nearest();
    this.hl.clear();
    this.items.forEach((it, i) => {
      if (it.collected) return;
      const hot = near && near.item === it;
      it.visual.setScale(it.s0 * (hot ? 1.25 : 1)).y = it.baseY + Math.sin(time / 350 + i) * 3;   // ลอยขึ้นลงเบา ๆ
      if (hot) {
        const k = 1 + Math.sin(time / 160) * 0.08;
        this.hl.fillStyle(0xfff3b0, 0.5).fillCircle(it.x, it.baseY, 38 * k);
        this.hl.lineStyle(3, 0xffffff, 0.95).strokeEllipse(it.x, it.baseY + 24, 64 * k, 20 * k);
      }
    });
    
    if (near) {
      const txt = `กด E เก็บ${FOOD_DB[near.item.id].name} · F ดูข้อมูล`;
      this.prompt.setText(txt).setPosition(Phaser.Math.Clamp(p.x, 120, 840), p.y - 34).setVisible(true);
    } else if (state.collected.length > 0) {
      const txt = `กด E เพื่อจัดอาหารในช่องเก็บของ`;
      this.prompt.setText(txt).setPosition(Phaser.Math.Clamp(p.x, 120, 840), p.y - 34).setVisible(true);
    } else {
      this.prompt.setVisible(false);
    }

    if (!locked) {
      if (pressE) {
        if (near) {
          this.collect(near.item);
        } else if (state.collected.length > 0) {
          UI.openPlate();
        }
      } else if (pressF && near) {
        UI.openInfo(near.item.id);
      }
    }
  }
}

/* ---------- เริ่มเกม + Responsive: ฉากเต็มจอ, UI ยึดขอบแล้วขยายด้วยสเกลเดียวกัน ---------- */
const DESIGN_W = 960, DESIGN_H = 540;   // พื้นที่ออกแบบ (UI และฉากหลัก) ที่ต้องมองเห็นครบเสมอ
let viewScale = 1;

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: '100%',
  height: '100%',
  backgroundColor: '#dbe8ef',
  scale: { mode: Phaser.Scale.RESIZE },   // แคนวาสเต็มจอจริง ไม่ยืดภาพ กล้องในฉากเป็นตัวกำหนดซูม
  scene: KitchenScene,
});

/* วัดพื้นที่ใช้งาน (หักรอยบาก/safe area) แล้วหาสเกลเดียวกันทั้งสองแกน → ตัวอักษรไม่ยืด */
function fit() {
  const stage = $('stage');
  const W = stage.clientWidth || window.innerWidth, H = stage.clientHeight || window.innerHeight;
  const cs = getComputedStyle($('safe'));
  const sl = parseFloat(cs.paddingLeft) || 0, sr = parseFloat(cs.paddingRight) || 0;
  const st = parseFloat(cs.paddingTop) || 0, sb = parseFloat(cs.paddingBottom) || 0;
  const aw = Math.max(1, W - sl - sr), ah = Math.max(1, H - st - sb);
  viewScale = Math.max(0.2, Math.min(aw / DESIGN_W, ah / DESIGN_H));
  const ui = $('ui');
  ui.style.left = sl + 'px'; ui.style.top = st + 'px';
  ui.style.width = (aw / viewScale) + 'px'; ui.style.height = (ah / viewScale) + 'px';   // ชั้น UI ยืดตามสัดส่วนจอ แต่ขนาดอักษรคงที่
  ui.style.transform = `scale(${viewScale})`;
  try { if (game.isBooted && game.scale) game.scale.refresh(); } catch (e) { /* ยังบูตไม่เสร็จ ไม่เป็นไร */ }
  try { if (scene && scene.layoutCamera) scene.layoutCamera(); } catch (e) { /* ฉากยังไม่พร้อม */ }
}
let fitRaf = 0;
const scheduleFit = () => { cancelAnimationFrame(fitRaf); fitRaf = requestAnimationFrame(fit); };
window.addEventListener('resize', scheduleFit, { passive: true });
window.addEventListener('orientationchange', () => { scheduleFit(); setTimeout(fit, 150); setTimeout(fit, 400); }, { passive: true });
document.addEventListener('fullscreenchange', scheduleFit);
if (window.visualViewport) window.visualViewport.addEventListener('resize', scheduleFit, { passive: true });
window.addEventListener('load', fit);
bindTouch();   // ผูกปุ่มก่อน fit() เสมอ เพื่อไม่ให้ error ใน fit ทำให้ปุ่มหาย
fit();
