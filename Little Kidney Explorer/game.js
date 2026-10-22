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
    counterSlots: [70, 165, 260, 355, 450, 545, 640, 735].map(x => ({ x, y: 138 })),
    start: { x: 400, y: 330 },
  },
];

const CFG = { W: 800, H: 540, speed: 210, pickRange: 85, minX: 30, maxX: 770, minY: 208, maxY: 515, playerR: 18 };

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
    const t = $('toast'); t.textContent = msg; t.classList.remove('hidden');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.add('hidden'), 2200);
  },

  renderHud() {
    const lv = state.level;
    $('mission-title').textContent = lv.title;
    $('mission-text').textContent =
      `${lv.mission} (เก็บแล้ว ${state.collected.length}/${lv.ingredients.length} · ในจาน ${state.plated.length}/${lv.pickCount})`;
    $('bag-count').textContent = `${state.collected.length}/${lv.ingredients.length}`;
    $('bag-slots').innerHTML = '';
    for (let i = 0; i < lv.ingredients.length; i++) {
      const b = document.createElement('button');
      const id = state.collected[i];
      b.className = 'bag-slot';
      b.style.display = 'flex';
      b.style.alignItems = 'center';
      b.style.justifyContent = 'center';
      b.style.fontSize = '24px';
      
      if (id) {
        const f = FOOD_DB[id];
        b.classList.add('filled'); if (state.plated.includes(id)) b.classList.add('plated');
        b.textContent = f.emoji; b.title = `${f.name} – คลิกเพื่อรวมเข้าจานหรือดูข้อมูล`;
        b.onclick = () => UI.openPlate();
      } else { b.disabled = true; b.tabIndex = -1; }
      $('bag-slots').appendChild(b);
    }
  },

  openInfo(id) {
    const f = FOOD_DB[id];
    $('im-emoji').textContent = f.emoji;
    $('im-emoji').style.fontSize = '48px';$('im-name').textContent = f.name;
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

  openPlate() { state.mode = 'plate'; $('plate-modal').classList.remove('hidden'); UI.renderPlate(); },
  closePlate() { $('plate-modal').classList.add('hidden'); state.mode = 'play'; UI.renderHud(); },

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
      d.innerHTML = `<span class="e" style="font-size: 28px; display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px;">${f.emoji}</span><span class="n">${f.name}<small>${f.portion.label} · ${f.portion.grams} g</small></span><span class="b"></span>`;
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
        s.innerHTML = `<span class="e" style="font-size: 26px; display: inline-flex; align-items: center; justify-content: center;">${f.emoji}</span><span class="n">${f.name}</span>`;
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
    if (!state.plated.length) { $('pm-msg').className = '';$('pm-msg').textContent = 'เลือกวัตถุดิบมาใส่จาน มาตรวัดจะเตือนทันทีถ้าค่าไหนเกินเกณฑ์'; }
    else if (ev.alerts.length) {
      const a = ev.alerts.slice().sort((x, y) => (y.level === 'red') - (x.level === 'red'))[0];
      $('pm-msg').className = a.level === 'red' ? 'r' : 'y';$('pm-msg').textContent = `${STATUS_ICON[a.level === 'red' ? 'red' : 'yellow']} ${a.title}${ev.alerts.length > 1 ? ` (และอีก ${ev.alerts.length - 1} รายการ)` : ''}`;
    } else {
      $('pm-msg').className = 'g';$('pm-msg').textContent = ok ? '✅ ตอนนี้ทุกค่าอยู่ในเกณฑ์ตัวอย่าง กดยืนยันได้เลย' : `✅ ยังไม่เกินเกณฑ์ เลือกอีก ${need - state.plated.length} อย่าง`;
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
    if (now.length) UI.toast(`⚠️ ${FOOD_DB[id].emoji}${FOOD_DB[id].name} ทำให้${now.map(a => a.title).join(', ')}`);
  },
  removeFromPlate(id) { state.plated = state.plated.filter(x => x !== id); UI.renderPlate(); },

  confirmPlate() {
    if (state.plated.length !== state.level.pickCount) return;
    const ev = evaluateMeal(state.plated);
    if (ev.level === 'bad') return UI.openWarn(ev);
    UI.showSummary();
  },
  openWarn(ev) {
    $('wm-list').innerHTML = ev.alerts.filter(a => a.level === 'red').map(a =>
      `<li><b>${a.title}</b><br>${a.detail}${a.tip ? `<br><small>${a.tip}</small>` : ''}</li>`).join('');
    $('warn-modal').classList.remove('hidden'); state.warnOpen = true; $('wm-back').focus();
  },
  closeWarn() { $('warn-modal').classList.add('hidden'); state.warnOpen = false; },

  showSummary() {
    UI.closeWarn();
    const ev = evaluateMeal(state.plated), v = VERDICT[ev.level];
    $('plate-modal').classList.add('hidden');
    state.mode = 'summary';
    $('sm-items').innerHTML = state.plated.map(id => {
      const f = FOOD_DB[id];
      return `<div class="sitem"><span class="e" style="font-size: 26px; display: inline-flex; align-items: center; justify-content: center;">${f.emoji}</span><span class="n">${f.name}<small>${f.portion.label} (${f.portion.grams} g)</small></span></div>`;
    }).join('');
    $('sm-verdict').className = 'verdict ' + v.cls;
    $('sm-verdict').textContent = `${v.icon} ${v.text}`;
    $('sm-alerts').innerHTML = ev.alerts.length
      ? ev.alerts.map(a => `<div class="alert ${a.level === 'red' ? 'r' : 'y'}"><b>${STATUS_ICON[a.level]} ${a.title}</b><span>${a.detail}</span>${a.tip ? `<small>${a.tip}</small>` : ''}</div>`).join('')
      : '<div class="alert g"><b>✅ ทุกค่าอยู่ในเกณฑ์ตัวอย่าง</b></div>';
    const head = `<tr class="th"><th>สารอาหาร</th>${state.plated.map(id => `<th><span style="font-size: 22px;">${FOOD_DB[id].emoji}</span></th>`).join('')}<th>รวม</th><th>เกณฑ์/มื้อ</th><th>ผล</th></tr>`;
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
    $('summary-modal').classList.remove('hidden');$('sm-restart').focus();
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
let uiScale = 1;
function bindTouch() {
  const wrap = $('game-wrap');
  const isTouch = ('ontouchstart' in window) || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0);
  if (isTouch) wrap.classList.add('touch');
  const base = $('joy'), knob =$('joy-knob'), R = 50;
  let pid = null;
  const move = ev => {
    const r = base.getBoundingClientRect();
    let dx = (ev.clientX - (r.left + r.width / 2)) / uiScale, dy = (ev.clientY - (r.top + r.height / 2)) / uiScale;
    const len = Math.hypot(dx, dy);
    if (len > R) { dx *= R / len; dy *= R / len; }
    knob.style.transform = `translate(${dx}px,${dy}px)`;
    const l = Math.hypot(dx, dy);
    touch.x = l < 10 ? 0 : dx / R; touch.y = l < 10 ? 0 : dy / R;
  };
  const end = ev => { if (ev.pointerId !== pid) return; pid = null; touch.x = touch.y = 0; knob.style.transform = 'translate(0,0)'; };
  base.addEventListener('pointerdown', ev => { ev.preventDefault(); pid = ev.pointerId; base.setPointerCapture(pid); move(ev); });
  base.addEventListener('pointermove', ev => { if (ev.pointerId === pid) move(ev); });
  base.addEventListener('pointerup', end); base.addEventListener('pointercancel', end);
  $('btn-e').addEventListener('pointerdown', ev => { ev.preventDefault(); touch.e = true; });$('btn-f').addEventListener('pointerdown', ev => { ev.preventDefault(); touch.f = true; });
}

/* ---------- 4) ฉากเกม (Phaser) – มุมมองด้านบน (Top-down) ---------- */
class KitchenScene extends Phaser.Scene {
  constructor() { super('Kitchen'); }

  preload() {
    Object.values(FOOD_DB).forEach(f => { if (f.sprite) this.load.image('food_' + f.id, f.sprite); });
  }

  create() {
    scene = this;
    this.level = state.level;
    this.drawRoom();
    this.items = this.level.ingredients.map((id, i) => this.makeItem(id, this.level.counterSlots[i]));
    this.makePlayer();
    this.prompt = this.add.text(0, 0, '', {
      fontFamily: 'Sarabun, Tahoma, sans-serif', fontSize: '17px', fontStyle: 'bold', color: '#1f2d4a',
      backgroundColor: '#fffdf6', padding: { x: 10, y: 5 },
    }).setOrigin(0.5, 1).setDepth(50).setVisible(false);
    this.keys = this.input.keyboard.addKeys({
      left: 'LEFT', right: 'RIGHT', up: 'UP', down: 'DOWN', a: 'A', d: 'D', w: 'W', s: 'S', e: 'E', f: 'F', esc: 'ESC',
    });
    UI.bind(); UI.renderHud();
  }

  drawRoom() {
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(0xcfe8f5).fillRect(0, 0, CFG.W, 96);                              // ผนังด้านบน
    for (let iy = 0; iy < 6; iy++) for (let ix = 0; ix < 13; ix++) {              // พื้นกระเบื้อง
      g.fillStyle((ix + iy) % 2 ? 0xe9f1f6 : 0xdbe8ef).fillRect(ix * 62, 188 + iy * 62, 62, 62);
    }
    g.fillStyle(0xe0a35f).fillRect(0, 96, CFG.W, 80);                             // เคาน์เตอร์ (พื้นผิวด้านบน)
    g.fillStyle(0xc98a4b).fillRect(0, 176, CFG.W, 12);                            // ขอบเคาน์เตอร์
    g.lineStyle(3, 0x1f2d4a).strokeRect(0, 96, CFG.W, 92);
  }

  makeItem(id, pos) {
    const f = FOOD_DB[id];
    const shadow = this.add.ellipse(pos.x, pos.y + 22, 46, 12, 0x000000, 0.18).setDepth(2);
    const visual = f.sprite && this.textures.exists('food_' + id)
      ? this.add.image(pos.x, pos.y, 'food_' + id).setDisplaySize(48, 48)
      : this.add.text(pos.x, pos.y, f.emoji, { fontSize: '42px' }).setOrigin(0.5);
    visual.setDepth(3);
    const label = this.add.text(pos.x, pos.y + 44, f.name, {
      fontFamily: 'Sarabun, Tahoma, sans-serif', fontSize: '15px', fontStyle: 'bold',
      color: '#fff', stroke: '#1f2d4a', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(3);
    return { id, x: pos.x, y: pos.y, visual, shadow, label, collected: false, baseY: pos.y };
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
    g.fillStyle(0x3b2a20).fillEllipse(-3, 0, 17, 25);                                // ผม
    g.fillStyle(0xd9a37a).fillCircle(15, 0, 3);                                      // จมูก (บอกทิศหน้า)
    c.add([this.footL, this.footR, g]);
    this.player = c; this.walkT = 0; this.dirAngle = Math.PI / 2;
    c.rotation = this.dirAngle;
  }

  resetWorld() {
    this.items.forEach(it => {
      it.collected = false; it.visual.setVisible(true).setAlpha(1).setScale(1).y = it.baseY;
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
    this.tweens.add({ targets: it.visual, y: it.baseY - 40, alpha: 0, scale: 1.4, duration: 260,
      onComplete: () => it.visual.setVisible(false) });
    it.shadow.setVisible(false); it.label.setVisible(false);
    UI.renderHud(); UI.toast(`เก็บ${FOOD_DB[it.id].name}แล้ว`);
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
    } else this.walkT = 0;
    this.footL.x = Math.sin(this.walkT) * 7; this.footR.x = -Math.sin(this.walkT) * 7;

    const near = locked ? null : this.nearest();
    this.items.forEach(it => { if (!it.collected) it.visual.setScale(near && near.item === it ? 1.25 : 1); });
    
    // ตรวจสอบสถานะว่ามีการเก็บวัตถุดิบไว้ในกระเป๋าแล้วหรือยัง
    if (near) {
      const txt = `กด E เก็บ${FOOD_DB[near.item.id].name} · F ดูข้อมูล`;
      this.prompt.setText(txt).setPosition(Phaser.Math.Clamp(p.x, 120, 680), p.y - 34).setVisible(true);
    } else if (state.collected.length > 0) {
      // แสดงคำแนะนำกด E เมื่อมีวัตถุดิบในกระเป๋าอย่างน้อย 1 ชิ้นขึ้นไปเท่านั้น
      const txt = `กด E เพื่อจัดอาหารในช่องเก็บของ`;
      this.prompt.setText(txt).setPosition(Phaser.Math.Clamp(p.x, 120, 680), p.y - 34).setVisible(true);
    } else {
      // ซ่อนคำแนะนำเมื่อเริ่มต้นเกม (ยังไม่มีวัตถุดิบในกระเป๋า)
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

/* ---------- เริ่มเกม + ปรับขนาดหน้าจอ ---------- */
new Phaser.Game({
  type: Phaser.AUTO, width: CFG.W, height: CFG.H, parent: 'game', backgroundColor: '#dbe8ef',
  scene: KitchenScene,
});
function fit() {
  uiScale = Math.min(window.innerWidth / 960, window.innerHeight / 540);
  $('game-wrap').style.transform = `scale(${uiScale})`;
}
window.addEventListener('resize', fit); fit(); bindTouch();