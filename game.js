/* =====================================================================
 * ครัวสุขภาพ – 3 มื้อใน 1 วัน (ต้นแบบ)  |  Phaser 3
 * ส่วนที่ 1: ข้อมูล/เกณฑ์/ด่านและการสุ่ม  2: ตรรกะคำนวณ+แจ้งเตือน  3: UI (DOM)  4: ฉากเกม (Phaser)
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

/* ---------- 1.2) วัตถุดิบเพิ่มเติม + กลุ่มอาหาร + ชุดวัตถุดิบของแต่ละมื้อ ---------- */
// กลุ่มอาหาร (cat) ใช้แค่ตอนสุ่มให้แต่ละรอบมีความหลากหลาย ไม่เกี่ยวกับการตัดสินผล
const CAT_OF = { rice: 'staple', egg: 'protein', banana: 'fruit', apple: 'fruit', bread: 'staple', milk: 'drink', sausage: 'protein', cucumber: 'veg' };
Object.keys(CAT_OF).forEach(id => { FOOD_DB[id].cat = CAT_OF[id]; });

function addFood(id, name, emoji, cat, grams, label, e, p, c, f, na, k, ph) {
  FOOD_DB[id] = { id, name, emoji, cat, sprite: null, ref: REF, verified: false, portion: { grams, label },
    n: { energy: e, protein: p, carb: c, fat: f, sodium: na, potassium: k, phosphorus: ph } };
}
// ค่าทั้งหมดเป็น "ข้อมูลตัวอย่างสำหรับทดสอบระบบ" ต่อ 100 g (verified:false) ต้องแทนที่ด้วยข้อมูลจริงที่ตรวจสอบแล้วก่อนใช้งานจริง
//      id             ชื่อ                     emoji  กลุ่ม      g    ปริมาณ                 kcal  โปรตีน carb  ไขมัน  Na    K    P
addFood('oatmeal',      'ข้าวโอ๊ตต้ม',            '🥣', 'staple',  150, '1 ถ้วย',              71,   2.5,   12,   1.5,   4,    70,  77);
addFood('congee',       'ข้าวต้ม',                '🍲', 'staple',  200, '1 ถ้วย',              46,   1.2,   10,   0.2,   6,    22,  20);
addFood('soymilk',      'นมถั่วเหลือง',           '🥛', 'drink',   200, '1 แก้ว (200 มล.)',    54,   3.3,   6,    1.8,   12,   118, 52);
addFood('papaya',       'มะละกอสุก',              '🍈', 'fruit',   100, '6 ชิ้นพอดีคำ',        43,   0.5,   11,   0.3,   8,    182, 10);
addFood('pineapple',    'สับปะรด',                '🍍', 'fruit',   100, '6 ชิ้นพอดีคำ',        50,   0.5,   13,   0.1,   1,    109, 8);
addFood('friedegg',     'ไข่ดาว',                 '🍳', 'protein', 50,  '1 ฟอง',               196,  13.6,  0.8,  15,    207,  152, 200);
addFood('ham',          'แฮม',                    '🥓', 'protein', 30,  '2 แผ่น',              145,  21,    1.5,  5.5,   1200, 300, 250);
addFood('corn',         'ข้าวโพดต้ม',             '🌽', 'staple',  100, '1 ฝักเล็ก',           96,   3.4,   21,   1.5,   15,   270, 89);
addFood('sweetpotato',  'มันเทศต้ม',              '🍠', 'staple',  100, '1 หัวเล็ก',           86,   1.6,   20,   0.1,   55,   337, 47);
addFood('watermelon',   'แตงโม',                  '🍉', 'fruit',   150, '3 ชิ้น',              30,   0.6,   7.6,  0.2,   1,    112, 11);
addFood('brownrice',    'ข้าวกล้อง',              '🍚', 'staple',  100, '1 ถ้วยเล็ก',          112,  2.3,   23,   0.8,   5,    79,  83);
addFood('ricenoodle',   'เส้นเล็กลวก',            '🍜', 'staple',  120, '1 ถ้วย',              109,  0.9,   25,   0.2,   5,    18,  27);
addFood('vermicelli',   'วุ้นเส้นลวก',            '🍜', 'staple',  100, '1 ถ้วยเล็ก',          80,   0.1,   19,   0,     5,    8,   5);
addFood('instantnoodle','บะหมี่กึ่งสำเร็จรูป',     '🍜', 'staple',  70,  'ครึ่งซอง (รวมเครื่องปรุง)', 450, 10, 60,   19,    1800, 200, 100);
addFood('chicken',      'อกไก่ต้ม',               '🍗', 'protein', 60,  '3 ชิ้นพอดีคำ',        165,  31,    0,    3.6,   74,   256, 228);
addFood('pork',         'หมูสันในต้ม',            '🥩', 'protein', 60,  '3 ชิ้นพอดีคำ',        143,  26,    0,    3.5,   60,   380, 230);
addFood('fish',         'ปลานึ่ง',                '🐟', 'protein', 60,  '1 ชิ้น',              100,  20,    0,    2,     70,   330, 200);
addFood('tofu',         'เต้าหู้ขาว',             '🍥', 'protein', 80,  'ประมาณ 1/4 แผ่น',     76,   8,     1.9,  4.8,   7,    121, 97);
addFood('omelette',     'ไข่เจียว',               '🍳', 'protein', 60,  '1 ชิ้น',              250,  11,    1,    22,    300,  130, 170);
addFood('cleansoup',    'ต้มจืด',                 '🍲', 'soup',    200, '1 ถ้วย',              30,   3,     1,    1.2,   250,  90,  40);
addFood('cabbage',      'กะหล่ำปลีลวก',           '🥬', 'veg',     80,  '1 กำมือ',             23,   1.3,   5.5,  0.1,   8,    150, 22);
addFood('carrot',       'แครอทต้ม',               '🥕', 'veg',     50,  '5 ชิ้นพอดีคำ',        35,   0.8,   8,    0.2,   60,   235, 30);
addFood('pumpkin',      'ฟักทองนึ่ง',             '🎃', 'veg',     80,  '4 ชิ้นพอดีคำ',        26,   1,     6.5,  0.1,   1,    340, 44);
addFood('tomato',       'มะเขือเทศ',              '🍅', 'veg',     60,  '2 ลูกเล็ก',           18,   0.9,   3.9,  0.2,   5,    237, 24);
addFood('luffa',        'บวบต้ม',                 '🥒', 'veg',     80,  '1 ถ้วยเล็ก',          20,   1,     4.4,  0.2,   3,    139, 32);
addFood('stirveg',      'ผัดผักรวม',              '🥦', 'veg',     80,  '1 จานเล็ก',           60,   2,     6,    3.5,   250,  200, 40);
addFood('potato',       'มันฝรั่งต้ม',            '🥔', 'staple',  100, '1 หัวเล็ก',           87,   1.9,   20,   0.1,   6,    379, 44);
addFood('orange',       'ส้ม',                    '🍊', 'fruit',   130, '1 ผล',                47,   0.9,   12,   0.1,   0,    181, 14);
addFood('guava',        'ฝรั่ง',                  '🍐', 'fruit',   100, 'ครึ่งผล',             68,   2.6,   14,   1,     2,    417, 40);
addFood('grapes',       'องุ่น',                  '🍇', 'fruit',   80,  '8 ผล',                69,   0.7,   18,   0.2,   2,    191, 20);
addFood('pear',         'ลูกแพร์',                '🍐', 'fruit',   120, '1 ผลเล็ก',            57,   0.4,   15,   0.1,   1,    116, 12);
addFood('mango',        'มะม่วงสุก',              '🥭', 'fruit',   100, '4 ชิ้นพอดีคำ',        60,   0.8,   15,   0.4,   1,    168, 14);
addFood('shrimp',       'กุ้งต้ม',                '🍤', 'protein', 60,  '4 ตัวเล็ก',           99,   24,    0.2,  0.3,   111,  259, 237);
addFood('friedchicken', 'ไก่ทอด',                 '🍗', 'protein', 60,  '1 ชิ้นเล็ก',          260,  20,    10,   16,    500,  250, 200);
addFood('saltedfish',   'ปลาเค็ม',                '🐟', 'protein', 20,  '1 ชิ้นเล็ก',          190,  35,    0,    5,     5000, 400, 300);

/* ชุดวัตถุดิบที่สุ่มได้ของแต่ละมื้อ: สุ่มเฉพาะรายการที่มีข้อมูลโภชนาการครบ (ตรวจด้วย hasFullData) */
const MEAL_POOL = {
  breakfast: ['rice', 'brownrice', 'egg', 'friedegg', 'banana', 'apple', 'bread', 'milk', 'soymilk', 'sausage', 'ham', 'cucumber',
              'oatmeal', 'congee', 'papaya', 'pineapple', 'corn', 'sweetpotato', 'watermelon'],
  lunch:     ['rice', 'brownrice', 'ricenoodle', 'vermicelli', 'instantnoodle', 'chicken', 'pork', 'fish', 'tofu', 'omelette',
              'cleansoup', 'cabbage', 'carrot', 'pumpkin', 'tomato', 'cucumber', 'luffa', 'orange', 'guava', 'grapes', 'apple'],
  dinner:    ['rice', 'brownrice', 'congee', 'potato', 'chicken', 'pork', 'fish', 'shrimp', 'friedchicken', 'saltedfish', 'tofu', 'egg',
              'stirveg', 'cabbage', 'pumpkin', 'luffa', 'carrot', 'cleansoup', 'ham', 'apple', 'pear', 'mango', 'watermelon', 'milk'],
};
function hasFullData(id) {
  const f = FOOD_DB[id];
  return !!f && !!f.ref && !!f.portion && f.portion.grams > 0 && !!f.n && NUTRIENTS.every(nu => Number.isFinite(f.n[nu.key]));
}

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
/* ไอคอนของวัตถุดิบเพิ่มเติม: ใช้ตัวช่วยวาดแบบพื้นฐาน (ชาม จาน ผลไม้กลม) เพื่อให้โค้ดสั้นและสไตล์เข้ากับชุดเดิม */
function dots(c, col, pts, r) { c.fillStyle = col; pts.forEach(([x, y]) => { c.beginPath(); c.arc(x, y, r || 3.5, 0, 7); c.fill(); }); }
function blob(c, x, y, rx, ry, rot, fill, lw) { c.beginPath(); c.ellipse(x, y, rx, ry, rot || 0, 0, 7); fs(c, fill, lw || 4); }
function bowlOf(c, food, bowl, spots) {
  c.beginPath(); c.moveTo(18, 62); c.bezierCurveTo(24, 26, 104, 26, 110, 62); c.closePath(); fs(c, food);
  if (spots) dots(c, spots, [[44, 50], [62, 42], [80, 52], [54, 58], [74, 58], [92, 58]]);
  c.beginPath(); c.moveTo(12, 60); c.lineTo(116, 60); c.bezierCurveTo(112, 104, 90, 116, 64, 116); c.bezierCurveTo(38, 116, 16, 104, 12, 60); c.closePath(); fs(c, bowl);
  c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 4; c.beginPath(); c.moveTo(26, 80); c.quadraticCurveTo(64, 92, 102, 80); c.stroke();
}
function plateOf(c) { blob(c, 64, 78, 58, 34, 0, '#ffffff', 5); blob(c, 64, 78, 40, 21, 0, '#eef3f6', 2); }
function ball(c, body, o) {
  o = o || {}; const rx = o.rx || 40, ry = o.ry || 40, cy = o.cy || 70;
  c.beginPath(); c.ellipse(64, cy, rx, ry, 0, 0, 7); fs(c, body);
  if (o.ribs) { c.strokeStyle = o.ribs; c.lineWidth = 3; [-0.55, 0, 0.55].forEach(k => { c.beginPath(); c.ellipse(64, cy, Math.abs(k) * rx + 0.1, ry, 0, 0, 7); c.stroke(); }); }
  if (o.stem) { c.strokeStyle = '#7a4a1e'; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(64, cy - ry + 2); c.lineTo(67, cy - ry - 13); c.stroke(); }
  if (o.leaf) { c.beginPath(); c.ellipse(82, cy - ry - 3, 15, 7, -0.4, 0, 7); fs(c, o.leaf, 4); }
  if (o.spots) dots(c, o.spots, [[46, cy - 6], [80, cy - 12], [58, cy + 16], [84, cy + 10], [50, cy + 10]], 3);
  c.fillStyle = 'rgba(255,255,255,.45)'; c.beginPath(); c.ellipse(64 - rx * 0.45, cy - ry * 0.3, 6, 12, 0.4, 0, 7); c.fill();
}
function fishOf(c, body, tail) {
  plateOf(c); blob(c, 60, 78, 30, 15, 0, body);
  c.beginPath(); c.moveTo(88, 78); c.lineTo(108, 63); c.lineTo(108, 93); c.closePath(); fs(c, tail, 4);
  dots(c, INK, [[44, 74]], 2.8);
}
Object.assign(ICON_DRAW, {
  oatmeal(c)       { bowlOf(c, '#d8b98a', '#f4a261', '#fff3dc'); },
  congee(c)        { bowlOf(c, '#fffaf0', '#4aa3df', '#e6dcc4'); },
  brownrice(c)     { bowlOf(c, '#b98b5a', '#4aa3df', '#8a5f33'); },
  ricenoodle(c)    { bowlOf(c, '#f3ead2', '#e4572e', '#d9c9a0'); },
  vermicelli(c)    { bowlOf(c, '#e8eef2', '#8e6bbf', '#c7d3dc'); },
  instantnoodle(c) { bowlOf(c, '#f2c14e', '#e4572e', '#d99a1a'); },
  cleansoup(c) {
    c.beginPath(); c.moveTo(12, 58); c.lineTo(116, 58); c.bezierCurveTo(112, 104, 90, 116, 64, 116); c.bezierCurveTo(38, 116, 16, 104, 12, 58); c.closePath(); fs(c, '#4aa3df');
    blob(c, 64, 58, 52, 14, 0, '#f4dc8f'); dots(c, '#4caf50', [[44, 56], [80, 60], [96, 56]], 4);
    c.fillStyle = '#fff'; [[58, 56], [70, 61]].forEach(([x, y]) => c.fillRect(x - 4, y - 3, 8, 7));
  },
  soymilk(c) {
    c.beginPath(); c.moveTo(34, 22); c.lineTo(94, 22); c.lineTo(86, 112); c.lineTo(42, 112); c.closePath(); fs(c, '#fff4d6');
    c.beginPath(); c.moveTo(37, 46); c.lineTo(91, 46); c.lineTo(87, 108); c.lineTo(41, 108); c.closePath(); c.fillStyle = '#f3dca0'; c.fill();
    c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.ellipse(50, 74, 4, 16, 0.1, 0, 7); c.fill();
  },
  papaya(c) {
    blob(c, 64, 66, 38, 50, 0.5, '#f4a640', 5); blob(c, 64, 66, 26, 38, 0.5, '#ff8c42', 2);
    dots(c, '#3a2a1a', [[58, 56], [68, 62], [60, 70], [70, 74], [64, 82]], 3.2);
  },
  pineapple(c) {
    c.beginPath(); c.moveTo(64, 44); c.lineTo(44, 10); c.lineTo(58, 28); c.lineTo(64, 4); c.lineTo(70, 28); c.lineTo(84, 10); c.closePath(); fs(c, '#4caf50', 4);
    c.save(); c.beginPath(); c.ellipse(64, 82, 32, 40, 0, 0, 7); c.clip();
    c.fillStyle = '#ffc83d'; c.fillRect(20, 30, 90, 100); c.strokeStyle = '#d9992b'; c.lineWidth = 3;
    for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(64 + i * 12 - 20, 44); c.lineTo(64 + i * 12 + 20, 120); c.stroke(); c.beginPath(); c.moveTo(64 + i * 12 + 20, 44); c.lineTo(64 + i * 12 - 20, 120); c.stroke(); }
    c.restore(); c.beginPath(); c.ellipse(64, 82, 32, 40, 0, 0, 7); c.lineWidth = 5; c.strokeStyle = INK; c.stroke();
  },
  friedegg(c) {
    c.beginPath(); c.moveTo(24, 62); c.bezierCurveTo(14, 30, 56, 14, 76, 26); c.bezierCurveTo(112, 16, 122, 60, 104, 84); c.bezierCurveTo(98, 112, 52, 116, 36, 96); c.bezierCurveTo(20, 92, 22, 72, 24, 62); c.closePath(); fs(c, '#ffffff');
    c.beginPath(); c.arc(66, 62, 20, 0, 7); fs(c, '#ffb703', 4);
    c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.ellipse(59, 55, 5, 7, 0.5, 0, 7); c.fill();
  },
  ham(c) {
    rr(c, 14, 30, 100, 70, 22); fs(c, '#f08fa0');
    c.fillStyle = '#ffd1d9'; [[40, 56, 10, 6], [72, 48, 12, 7], [84, 76, 10, 6], [50, 80, 12, 6]].forEach(([x, y, a, b]) => { c.beginPath(); c.ellipse(x, y, a, b, 0.4, 0, 7); c.fill(); });
  },
  corn(c) {
    blob(c, 64, 54, 24, 46, 0, '#ffd93d', 5);
    c.fillStyle = '#e6b422'; [52, 60, 68, 76].forEach(x => [24, 36, 48, 60, 72, 84].forEach(y => { c.beginPath(); c.arc(x, y, 3, 0, 7); c.fill(); }));
    c.beginPath(); c.moveTo(26, 116); c.bezierCurveTo(24, 78, 56, 72, 68, 98); c.bezierCurveTo(56, 102, 44, 110, 26, 116); c.closePath(); fs(c, '#5cb85c', 4);
    c.beginPath(); c.moveTo(102, 116); c.bezierCurveTo(104, 80, 72, 74, 60, 98); c.bezierCurveTo(72, 104, 86, 110, 102, 116); c.closePath(); fs(c, '#7ed37f', 4);
  },
  sweetpotato(c) {
    c.save(); c.translate(64, 66); c.rotate(-0.45); blob(c, 0, 0, 52, 26, 0, '#b5527a', 5);
    c.strokeStyle = '#8a3558'; c.lineWidth = 3; [[-28, -4, -14, 6], [-2, -8, 12, 4], [24, -2, 34, 6]].forEach(([a, b, d, e]) => { c.beginPath(); c.moveTo(a, b); c.lineTo(d, e); c.stroke(); }); c.restore();
  },
  potato(c) { blob(c, 64, 68, 48, 34, -0.2, '#d9b27c', 5); dots(c, '#a77c4a', [[46, 60], [74, 54], [60, 80], [86, 72], [42, 78]], 3.5); },
  watermelon(c) {
    c.beginPath(); c.moveTo(8, 46); c.lineTo(120, 46); c.bezierCurveTo(116, 112, 12, 112, 8, 46); c.closePath(); fs(c, '#4caf50');
    c.beginPath(); c.moveTo(16, 48); c.lineTo(112, 48); c.bezierCurveTo(108, 102, 20, 102, 16, 48); c.closePath(); c.fillStyle = '#fff1d0'; c.fill();
    c.beginPath(); c.moveTo(22, 50); c.lineTo(106, 50); c.bezierCurveTo(102, 94, 26, 94, 22, 50); c.closePath(); c.fillStyle = '#ff5a6e'; c.fill();
    c.fillStyle = '#2b1a1a'; [[44, 64], [64, 72], [84, 64], [54, 80], [76, 80]].forEach(([x, y]) => { c.beginPath(); c.ellipse(x, y, 2.6, 4.5, 0.2, 0, 7); c.fill(); });
  },
  chicken(c) { plateOf(c); blob(c, 46, 78, 22, 14, -0.3, '#f6e3c4'); blob(c, 70, 72, 22, 14, 0.2, '#f6e3c4'); blob(c, 84, 86, 20, 13, -0.2, '#efd5ac'); },
  pork(c)    { plateOf(c); blob(c, 46, 78, 22, 14, -0.3, '#f1b8a8'); blob(c, 70, 72, 22, 14, 0.2, '#f1b8a8'); blob(c, 84, 86, 20, 13, -0.2, '#e9a392'); dots(c, '#fde4dc', [[44, 74], [70, 68], [82, 84]], 3); },
  fish(c)      { fishOf(c, '#9fb4c7', '#8aa2b8'); },
  saltedfish(c){ fishOf(c, '#c9b99a', '#b8a888'); dots(c, '#ffffff', [[54, 72], [66, 82], [74, 74]], 2.4); },
  shrimp(c) {
    plateOf(c);
    c.lineCap = 'round'; c.strokeStyle = INK; c.lineWidth = 22; c.beginPath(); c.arc(62, 82, 24, Math.PI * 1.1, Math.PI * 2.15); c.stroke();
    c.strokeStyle = '#ff8a5c'; c.lineWidth = 14; c.beginPath(); c.arc(62, 82, 24, Math.PI * 1.1, Math.PI * 2.15); c.stroke();
    c.beginPath(); c.moveTo(83, 93); c.lineTo(98, 86); c.lineTo(96, 104); c.closePath(); fs(c, '#ff6f3c', 4); dots(c, INK, [[40, 74]], 2.8);
  },
  friedchicken(c) {
    c.lineCap = 'round'; c.strokeStyle = INK; c.lineWidth = 14; c.beginPath(); c.moveTo(70, 72); c.lineTo(100, 102); c.stroke();
    c.strokeStyle = '#fff'; c.lineWidth = 7; c.beginPath(); c.moveTo(70, 72); c.lineTo(100, 102); c.stroke();
    blob(c, 108, 104, 8, 8, 0, '#ffffff', 4); blob(c, 98, 112, 8, 8, 0, '#ffffff', 4);
    blob(c, 50, 50, 36, 30, -0.5, '#d9822b', 5); dots(c, '#b8651b', [[38, 44], [56, 38], [48, 58], [66, 52], [34, 58]], 3.4);
  },
  tofu(c) {
    rr(c, 24, 40, 80, 62, 12); fs(c, '#fff7e6'); rr(c, 24, 40, 80, 20, 12); fs(c, '#fffdf4', 4);
    c.strokeStyle = '#eadfc4'; c.lineWidth = 3; c.beginPath(); c.moveTo(48, 70); c.lineTo(80, 70); c.moveTo(44, 84); c.lineTo(70, 84); c.stroke();
  },
  omelette(c) {
    blob(c, 64, 70, 54, 34, -0.15, '#ffd24d', 5);
    c.strokeStyle = '#e0a82a'; c.lineWidth = 3; c.beginPath(); c.ellipse(64, 70, 34, 18, -0.15, 0.2, 5.6); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(44, 56, 7, 4, -0.5, 0, 7); c.fill();
  },
  cabbage(c) {
    ball(c, '#a7d66b');
    c.strokeStyle = '#eaf7cf'; c.lineWidth = 4; [[64, 36, 64, 100], [64, 56, 36, 84], [64, 56, 92, 84]].forEach(([a, b, d, e]) => { c.beginPath(); c.moveTo(a, b); c.lineTo(d, e); c.stroke(); });
  },
  carrot(c) {
    c.strokeStyle = '#4caf50'; c.lineWidth = 8; c.lineCap = 'round'; [[54, 32, 46, 10], [64, 30, 64, 6], [74, 32, 84, 10]].forEach(([a, b, d, e]) => { c.beginPath(); c.moveTo(a, b); c.lineTo(d, e); c.stroke(); });
    c.beginPath(); c.moveTo(38, 34); c.quadraticCurveTo(64, 24, 90, 34); c.lineTo(70, 112); c.quadraticCurveTo(64, 124, 58, 112); c.closePath(); fs(c, '#ff8c2a');
    c.strokeStyle = '#e0701a'; c.lineWidth = 3; [[50, 52, 60, 54], [72, 66, 82, 62], [54, 80, 64, 82]].forEach(([a, b, d, e]) => { c.beginPath(); c.moveTo(a, b); c.lineTo(d, e); c.stroke(); });
  },
  pumpkin(c)  { ball(c, '#f4a340', { rx: 46, ry: 36, cy: 74, ribs: '#d9822b', stem: true }); },
  tomato(c) {
    ball(c, '#e63946', { rx: 46, ry: 36, cy: 76 });
    c.beginPath(); c.moveTo(64, 42); c.lineTo(52, 30); c.lineTo(60, 44); c.lineTo(44, 44); c.lineTo(58, 50); c.lineTo(76, 50); c.lineTo(84, 44); c.lineTo(70, 44); c.lineTo(80, 30); c.closePath(); fs(c, '#4caf50', 4);
  },
  orange(c)   { ball(c, '#ff9f1c', { leaf: '#4caf50', spots: '#e0850b' }); },
  guava(c)    { ball(c, '#a3d86b', { spots: '#6aa84f', stem: true }); },
  mango(c)    { ball(c, '#ffb703', { rx: 42, ry: 34, cy: 74, stem: true, leaf: '#4caf50' }); },
  grapes(c) {
    c.strokeStyle = '#7a4a1e'; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(64, 30); c.lineTo(66, 12); c.stroke();
    c.beginPath(); c.ellipse(82, 14, 14, 7, -0.3, 0, 7); fs(c, '#4caf50', 4);
    [[42, 48], [64, 46], [86, 48], [52, 70], [76, 70], [64, 92]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 14, 0, 7); fs(c, '#8e44ad', 4); dots(c, 'rgba(255,255,255,.55)', [[x - 4, y - 4]], 2.6); });
  },
  pear(c) {
    c.beginPath(); c.moveTo(64, 22); c.bezierCurveTo(80, 22, 80, 46, 88, 60); c.bezierCurveTo(110, 88, 92, 116, 64, 116); c.bezierCurveTo(36, 116, 18, 88, 40, 60); c.bezierCurveTo(48, 46, 48, 22, 64, 22); c.closePath(); fs(c, '#b5d65a');
    c.strokeStyle = '#7a4a1e'; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(64, 24); c.lineTo(68, 8); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.45)'; c.beginPath(); c.ellipse(46, 84, 6, 14, 0.3, 0, 7); c.fill();
  },
  luffa(c) {
    c.save(); c.translate(64, 64); c.rotate(-0.6); rr(c, -54, -17, 108, 34, 17); fs(c, '#a5d36a');
    c.strokeStyle = '#6fa23a'; c.lineWidth = 3; [-7, 7].forEach(y => { c.beginPath(); c.moveTo(-44, y); c.lineTo(44, y); c.stroke(); }); c.restore();
  },
  stirveg(c) {
    plateOf(c);
    blob(c, 48, 78, 16, 10, -0.3, '#4caf50', 3); blob(c, 74, 70, 16, 10, 0.3, '#66bb6a', 3); blob(c, 84, 86, 14, 9, -0.2, '#4caf50', 3);
    blob(c, 60, 88, 9, 7, 0, '#ffb703', 3); blob(c, 90, 72, 8, 6, 0, '#e63946', 3); blob(c, 46, 62, 8, 6, 0, '#ffb703', 3);
  },
});

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
    whoosh: t => tone(N(58), t, 0.4, 'sine', 0.09, null, N(81)),
    chime:  t => { tone(N(79), t, 0.5, 'sine', 0.09); tone(N(84), t + 0.14, 0.7, 'sine', 0.07); },
    night:  t => { tone(N(67), t, 0.7, 'sine', 0.09); tone(N(62), t + 0.22, 0.9, 'sine', 0.07); },
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

// ค่าเริ่มต้นร่วมกันทุกด่าน (ปรับเป็นรายด่านได้ที่ LEVELS):
//   pickCount = จำนวนที่ต้องใส่จาน · spawnCount = จำนวนวัตถุดิบที่สุ่มวาง (ไม่เกินจำนวนช่องวางของด่านนั้น)
//   minCats = จำนวนกลุ่มอาหารขั้นต่ำที่ต้องมีในรอบที่สุ่ม · hints = แสดงคำใบ้ตรง ๆ (คำแนะนำสลับวัตถุดิบ/ข้อความเตือนตอนใส่จาน) หรือไม่
//
// ผังห้อง/สิ่งกีดขวาง/ช่องวางวัตถุดิบของ "แต่ละด่านแยกกัน" (ไม่แชร์กัน) อยู่ในบล็อก ROOMS ด้านล่างทั้งหมด
// หน่วยทั้งหมดเป็นพิกัดพื้นที่ออกแบบ 960x540 · กล่องสี่เหลี่ยมคือ { x, y, w, h } (มุมซ้ายบน)
/*ROOMS-BEGIN*/
const CFG = { W: 960, H: 450, speed: 210, pickRange: 85, minX: 30, maxX: 930, minY: 208, maxY: 425, playerR: 18 };
const BIG = 1400;   // ความยาวส่วนที่วาดต่อออกไปนอกจอ (ให้พื้นหลังเต็มทุกสัดส่วนหน้าจอ)

// วงกลม (ตัวละคร) ชนกล่องสี่เหลี่ยมหรือไม่
function circleHitsRect(cx, cy, r, o) {
  const nx = Math.max(o.x, Math.min(cx, o.x + o.w)), ny = Math.max(o.y, Math.min(cy, o.y + o.h));
  const dx = cx - nx, dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

/* --- ด่าน 1 อาหารเช้า: ครัวเล็ก เคาน์เตอร์แถวเดียวด้านบน (คงตำแหน่งเดิมทุกอย่าง) --- */
const BREAKFAST_SLOTS = [90, 210, 330, 450, 570, 690, 810, 900].map(x => ({ x, y: 138, zone: 'back' }));
const BREAKFAST_ROOM = {
  bounds: { minX: 30, maxX: 930, minY: 208, maxY: 425 },
  obstacles: [],
  surfaces: [{ zone: 'back', x: -BIG, y: 96, w: 2 * BIG + 960, h: 80 }],
  counterSlots: BREAKFAST_SLOTS,
  start: { x: 480, y: 280 },
};

/* --- ด่าน 2 และ 3: ครัวใหญ่ (ผังเฟอร์นิเจอร์เดียวกัน แต่ช่องวางวัตถุดิบแยกชุดกัน) ---
 * ผังห้อง (มองจากด้านบนเฉียง):
 *   แถวหลังห้อง y 146–230 : ตู้เย็น | เคาน์เตอร์ A | อ่างล้างจาน | เคาน์เตอร์ B | เตา | เคาน์เตอร์ C (ยาวถึงตู้เก็บของ)
 *   เคาน์เตอร์ซ้าย x ≤ 100 (y 272–432) · เคาน์เตอร์ขวา x ≥ 860 · เกาะกลางห้อง x 330–630 (y 300–372)
 * วัตถุดิบวางได้เฉพาะบนพื้นผิวเคาน์เตอร์ (surfaces) เท่านั้น และตัวละครต้องเดินไปถึงได้ (ตรวจใน validateLevelLayout) */
const KITCHEN_OBSTACLES = [
  { x: -BIG, y: 90,  w: 2 * BIG + 960, h: 140 },   // แถวหลังห้องทั้งแถว (ตู้เย็น เคาน์เตอร์ อ่าง เตา ตู้เก็บของ)
  { x: -BIG, y: 272, w: BIG + 100,     h: 160 },   // เคาน์เตอร์ซ้าย
  { x: 860,  y: 272, w: BIG + 100,     h: 160 },   // เคาน์เตอร์ขวา
  { x: 330,  y: 300, w: 300,           h: 72 },    // เกาะกลางห้อง
];
const KITCHEN_SURFACES = [
  { zone: 'back',   x: 120,  y: 146, w: 120,       h: 60 },    // เคาน์เตอร์ A (ซ้ายอ่าง)
  { zone: 'back',   x: 348,  y: 146, w: 80,        h: 60 },    // เคาน์เตอร์ B (ระหว่างอ่างกับเตา)
  { zone: 'back',   x: 536,  y: 146, w: 248,       h: 60 },    // เคาน์เตอร์ C (ขวาเตาจนชิดตู้เก็บของ)
  { zone: 'left',   x: -BIG, y: 272, w: BIG + 100, h: 148 },   // เคาน์เตอร์ซ้าย
  { zone: 'right',  x: 860,  y: 272, w: BIG + 100, h: 148 },   // เคาน์เตอร์ขวา
  { zone: 'island', x: 330,  y: 300, w: 300,       h: 56 },    // เกาะกลางห้อง
];
const KITCHEN_BOUNDS = { minX: 30, maxX: 930, minY: 232, maxY: 445 };
// ด่านกลางวัน: 11 ช่อง (สุ่มใช้ 8 ช่องต่อรอบ และบังคับให้กระจายทุกโซน)
const LUNCH_SLOTS = [
  { x: 172, y: 176, zone: 'back' }, { x: 388, y: 176, zone: 'back' }, { x: 566, y: 176, zone: 'back' },
  { x: 656, y: 176, zone: 'back' }, { x: 746, y: 176, zone: 'back' },
  { x: 58,  y: 306, zone: 'left' }, { x: 58,  y: 386, zone: 'left' },
  { x: 902, y: 306, zone: 'right' }, { x: 902, y: 386, zone: 'right' },
  { x: 400, y: 328, zone: 'island' }, { x: 560, y: 328, zone: 'island' },
];
// ด่านเย็น: 12 ช่อง คนละชุดกับกลางวัน (เกาะกลางห้องวางได้ 3 จุด)
const DINNER_SLOTS = [
  { x: 168, y: 176, zone: 'back' }, { x: 392, y: 176, zone: 'back' }, { x: 565, y: 176, zone: 'back' },
  { x: 655, y: 176, zone: 'back' }, { x: 745, y: 176, zone: 'back' },
  { x: 60,  y: 300, zone: 'left' }, { x: 60,  y: 380, zone: 'left' },
  { x: 900, y: 300, zone: 'right' }, { x: 900, y: 380, zone: 'right' },
  { x: 385, y: 328, zone: 'island' }, { x: 480, y: 328, zone: 'island' }, { x: 575, y: 328, zone: 'island' },
];
const LUNCH_ROOM = { bounds: KITCHEN_BOUNDS, obstacles: KITCHEN_OBSTACLES, surfaces: KITCHEN_SURFACES, counterSlots: LUNCH_SLOTS,  start: { x: 232, y: 340 } };
const DINNER_ROOM = { bounds: KITCHEN_BOUNDS, obstacles: KITCHEN_OBSTACLES, surfaces: KITCHEN_SURFACES, counterSlots: DINNER_SLOTS, start: { x: 232, y: 340 } };

const LEVELS = [
  {
    id: 'breakfast', room: 'breakfast', meal: 'อาหารเช้า', mealShort: 'มื้อเช้า',
    timeIcon: '☀️', banner: 'ยามเช้า', clock: '07:30', fade: [255, 244, 220],
    title: 'ด่านที่ 1: อาหารเช้า',
    mission: 'เดินเก็บวัตถุดิบจากเคาน์เตอร์ แล้วกด E หรือคลิกที่กระเป๋าเพื่อจัดอาหารเช้าให้ครบ 3 อย่าง',
    pickCount: 3, spawnCount: 8, minCats: 3, hints: true, spreadZones: false, itemGlow: false,
    pool: MEAL_POOL.breakfast, ...BREAKFAST_ROOM,
  },
  {
    id: 'lunch', room: 'lunch', meal: 'อาหารกลางวัน', mealShort: 'มื้อกลางวัน',
    timeIcon: '🌞', banner: 'เที่ยงวัน', clock: '12:00', fade: [255, 250, 232],
    title: 'ด่านที่ 2: อาหารกลางวัน',
    mission: 'เดินสำรวจเคาน์เตอร์ทั่วครัว ดูข้อมูลแล้วเลือกจัดอาหารกลางวันให้ครบ 3 อย่าง',
    pickCount: 3, spawnCount: 8, minCats: 4, hints: true, spreadZones: true, itemGlow: false,
    pool: MEAL_POOL.lunch, ...LUNCH_ROOM,
  },
  {
    id: 'dinner', room: 'dinner', meal: 'อาหารเย็น', mealShort: 'มื้อเย็น',
    timeIcon: '🌙', banner: 'ค่ำคืน', clock: '18:30', fade: [20, 24, 58],
    title: 'ด่านที่ 3: อาหารเย็น',
    mission: 'ใช้ความรู้จากสองมื้อแรก เดินหาวัตถุดิบในครัวยามค่ำ แล้วจัดอาหารเย็นเอง',
    pickCount: 3, spawnCount: 8, minCats: 4, hints: false, spreadZones: true, itemGlow: true,
    pool: MEAL_POOL.dinner, ...DINNER_ROOM,
  },
];

/* ตรวจผังของด่าน (เตือนใน Console เท่านั้น ไม่หยุดเกม): ช่องต้องอยู่บนเคาน์เตอร์ ไม่ซ้อนกัน เดินไปเก็บถึง และจุดเริ่มไม่ติดสิ่งกีดขวาง */
function validateLevelLayout(L) {
  const B = L.bounds, r = CFG.playerR * 0.85, issues = [];
  const free = (x, y) => x >= B.minX && x <= B.maxX && y >= B.minY && y <= B.maxY && !L.obstacles.some(o => circleHitsRect(x, y, r, o));
  L.counterSlots.forEach((s, i) => {
    const onTop = L.surfaces.some(f => f.zone === s.zone && s.x - 24 >= f.x && s.x + 24 <= f.x + f.w && s.y - 24 >= f.y && s.y + 24 <= f.y + f.h);
    if (!onTop) issues.push(`ช่อง ${i} (${s.x},${s.y}) ไม่อยู่บนพื้นผิวเคาน์เตอร์`);
    L.counterSlots.forEach((t, j) => { if (j > i && Math.hypot(s.x - t.x, s.y - t.y) < 70) issues.push(`ช่อง ${i} กับ ${j} ใกล้กันเกินไป`); });
    let ok = false;
    for (let x = B.minX; x <= B.maxX && !ok; x += 6) for (let y = B.minY; y <= B.maxY && !ok; y += 6)
      if (free(x, y) && Math.hypot(x - s.x, y - s.y) <= CFG.pickRange - 10) ok = true;
    if (!ok) issues.push(`ช่อง ${i} (${s.x},${s.y}) ผู้เล่นเดินเข้าไปเก็บไม่ถึง`);
  });
  if (!free(L.start.x, L.start.y)) issues.push('จุดเริ่มต้นอยู่ในสิ่งกีดขวางหรือนอกขอบเขต');
  issues.forEach(m => console.warn(`[ผังด่าน ${L.id}] ${m}`));
  return issues;
}
/*ROOMS-END*/
LEVELS.forEach(validateLevelLayout);

/* สุ่มวัตถุดิบของด่าน: เฉพาะรายการที่ข้อมูลครบ ไม่ซ้ำ มีกลุ่มอาหารอย่างน้อย minCats กลุ่ม และ (ใหม่) ต้องมีชุดอาหารที่ผ่านเกณฑ์ซ่อนอยู่อย่างน้อย 3 ชุด — ดูหัวข้อ 1.6 */
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
/* ---------- 1.6) สุ่มวัตถุดิบแบบมีเงื่อนไข (Constraint-based Randomization) ----------
 * ลำดับ: (1) คำนวณทุกชุด 3 อย่างจาก pool ของด่านล่วงหน้า แล้วแยก "ผ่าน/ไม่ผ่าน" ด้วยเกณฑ์เดียวกับ evaluateMeal
 *        (2) สุ่ม "ชุดที่ผ่าน" 3 ชุดที่ต่างกัน (ซ้ำกันได้ไม่เกิน maxOverlap อย่าง) เป็นแกนของรอบนั้น
 *        (3) เติมวัตถุดิบอื่นให้ครบ spawnCount เป็นตัวเลือก/ตัวหลอก (เติมอย่างเดียว ชุดผ่านเดิมจึงไม่หายไป)
 *        (4) ตรวจซ้ำกับ \"ชุดวัตถุดิบที่จะวางจริง\" อีกครั้งก่อนวางฉาก  ถ้าไม่ผ่านจะสุ่มใหม่ / ผ่อนเงื่อนไขทีละขั้น / แจ้ง error
 * ผู้เล่นไม่เห็นชุดที่เตรียมไว้ และผลสรุปยังคำนวณจากสิ่งที่ผู้เล่นเลือกจริงใน evaluateMeal เท่านั้น
 * เกณฑ์ผ่านของชุดอาหาร = ไม่มีสารอาหารใดที่ evaluateMeal ตัดเป็น 'high' (เกินเกณฑ์) และพลังงาน/โปรตีนไม่ 'low'
 *   (ใช้ PROFILE เท่านั้น ไม่มีเกณฑ์ผ่าน/ไม่ผ่านของคาร์โบไฮเดรตและไขมัน เพราะ PROFILE ไม่ได้กำหนดไว้)
 *   ชุดที่ \"ผ่านเต็ม\" (strict) = ผ่าน และไม่มีแร่ธาตุตัวใดเกิน warnAt (70%) ของเกณฑ์ → evaluateMeal ให้ level 'good' */
const SPAWN_RULES = {
  minPass: 3,       // ต้องมีชุดที่ผ่านอย่างน้อยกี่ชุดในวัตถุดิบที่วางจริง
  maxOverlap: 1,    // 3 ชุดที่ใช้เป็นแกน ต้องมีวัตถุดิบซ้ำกันไม่เกินกี่อย่างระหว่างสองชุดใด ๆ (ให้เป็นคนละแนวทาง)
  noSharedCore: true, // และต้องไม่มีวัตถุดิบตัวใดตัวหนึ่งอยู่ในทั้ง 3 ชุด (กันกรณีทุกชุดมีข้าวสวยเหมือนกันหมด)
  minStrict: 1,     // อย่างน้อยกี่ชุดที่ผ่านเต็ม (ไฟเขียวทั้งหมด) ถ้าทำไม่ได้จะผ่อนเงื่อนไขนี้พร้อมแจ้งเตือน
  attempts: 300,    // จำนวนครั้งสุ่มสูงสุดต่อขั้น (กันลูปไม่รู้จบ)
};
const DEBUG_MEALS = typeof location !== 'undefined' && /[?&]debug=(meals|1)\b/.test(location.search || '');

function mealCheck(ids) {
  const reasons = [], near = [], totals = {};
  NUTRIENTS.forEach(nu => {
    const t = ids.reduce((s, id) => s + portionAmount(id, nu.key), 0);
    totals[nu.key] = t;
    const b = ruleBounds(nu.key);
    if (!b) return;                                    // ไม่มีเกณฑ์ใน PROFILE (คาร์โบไฮเดรต/ไขมัน) → ไม่ตัดสิน
    if (t > b.max) reasons.push({ key: nu.key, kind: 'high' });
    else if (b.type === 'range' && t < b.min) reasons.push({ key: nu.key, kind: 'low' });
    else if (b.type === 'max' && t / b.meal > PROFILE.warnAt) near.push(nu.key);
  });
  return { ids: ids.slice(), totals, reasons, near, pass: reasons.length === 0, strict: reasons.length === 0 && near.length === 0 };
}
function combinations(arr, k) {
  const out = [];
  (function rec(s, c) { if (c.length === k) { out.push(c.slice()); return; } for (let i = s; i < arr.length; i++) { c.push(arr[i]); rec(i + 1, c); c.pop(); } })(0, []);
  return out;
}
const overlapOf = (a, b) => a.ids.filter(x => b.ids.includes(x)).length;
// มีวัตถุดิบที่อยู่ครบทุกชุดใน group หรือไม่ (เฉพาะเมื่อ noSharedCore และ maxOv จำกัดอยู่ คือโหมดต้องการความหลากหลาย)
const hasSharedCore = group => group.length > 1 && group[0].ids.some(id => group.every(m => m.ids.includes(id)));
// หา k ชุดจาก list ที่ซ้ำกันไม่เกิน maxOv อย่างระหว่างสองชุดใด ๆ และ (ถ้าเปิด noSharedCore) ไม่มีตัวร่วมของทุกชุด (null ถ้าไม่มี)
function findDiverse(list, k, maxOv) {
  const rec = (s, chosen) => {
    if (chosen.length === k) return (SPAWN_RULES.noSharedCore && hasSharedCore(chosen)) ? null : chosen;
    for (let i = s; i < list.length; i++)
      if (chosen.every(c => overlapOf(c, list[i]) <= maxOv)) { const r = rec(i + 1, chosen.concat([list[i]])); if (r) return r; }
    return null;
  };
  return rec(0, []);
}

// ชุดอาหารทั้งหมดที่เป็นไปได้ของด่าน (คำนวณครั้งเดียวแล้วเก็บไว้)
const _comboCache = {};
function levelCombos(L) {
  if (_comboCache[L.id]) return _comboCache[L.id];
  const pool = L.pool.filter(id => { const ok = hasFullData(id); if (!ok) console.warn('ข้ามวัตถุดิบที่ข้อมูลไม่ครบ:', id); return ok; });
  const all = combinations(pool, L.pickCount).map(mealCheck);
  return (_comboCache[L.id] = { pool, all, pass: all.filter(m => m.pass), strict: all.filter(m => m.strict), fail: all.filter(m => !m.pass) });
}

// วิเคราะห์ \"ชุดวัตถุดิบที่จะวางจริง\": มีชุดที่ผ่านกี่ชุด / ผ่านเต็มกี่ชุด / มี 3 ชุดที่ต่างกันพอหรือไม่
function analyzeSet(ids, L) {
  const all = combinations(ids, L.pickCount).map(mealCheck);
  const pass = all.filter(m => m.pass), strict = all.filter(m => m.strict);
  return { all, pass, strict, diverse: findDiverse(pass, SPAWN_RULES.minPass, SPAWN_RULES.maxOverlap) };
}

// สร้าง \"แกน\" จากชุดที่ผ่าน minPass ชุดที่ต่างกัน รวมแล้วไม่เกิน n ชนิด (ถ้า needStrict จะให้ชุดแรกเป็นชุดผ่านเต็ม)
function buildSeed(L, n, maxOv, needStrict) {
  const { pass, strict } = levelCombos(L);
  if (!pass.length) return null;
  const firsts = needStrict && strict.length ? strict : pass;
  const chosen = [firsts[Math.floor(Math.random() * firsts.length)]];
  const union = () => [...new Set(chosen.flatMap(c => c.ids))];
  const cands = shuffle(pass.slice());
  while (chosen.length < SPAWN_RULES.minPass) {
    const last = chosen.length === SPAWN_RULES.minPass - 1;
    const nxt = cands.find(c => !chosen.includes(c) && chosen.every(x => overlapOf(x, c) <= maxOv) &&
      new Set([...union(), ...c.ids]).size <= n &&
      !(last && maxOv !== Infinity && SPAWN_RULES.noSharedCore && hasSharedCore(chosen.concat([c]))));
    if (!nxt) return null;
    chosen.push(nxt);
  }
  return union();
}

function pickIngredientsChecked(L) {
  const { pool } = levelCombos(L);
  const n = Math.min(L.spawnCount, L.counterSlots.length, pool.length);
  const tiers = [
    { name: 'เต็ม',                         ov: SPAWN_RULES.maxOverlap, strict: true,  cats: true  },
    { name: 'ผ่อนกลุ่มอาหาร (minCats)',     ov: SPAWN_RULES.maxOverlap, strict: true,  cats: false },
    { name: 'ผ่อน \"ชุดผ่านเต็ม\"',            ov: SPAWN_RULES.maxOverlap, strict: false, cats: false },
    { name: 'ผ่อนความแตกต่างของ 3 ชุด',     ov: Infinity,               strict: false, cats: false },
  ];
  let tries = 0;
  for (let ti = 0; ti < tiers.length; ti++) {
    const T = tiers[ti];
    let best = null;
    for (let t = 0; t < SPAWN_RULES.attempts; t++) {
      tries++;
      const seed = buildSeed(L, n, T.ov, T.strict);
      if (!seed) continue;
      const ids = shuffle(seed.concat(shuffle(pool.filter(id => !seed.includes(id)))).slice(0, Math.max(n, seed.length)));
      const cats = new Set(ids.map(id => FOOD_DB[id].cat)).size;
      if (!best || cats > best.cats) best = { ids, cats, seed };
      if (!T.cats || cats >= L.minCats) break;
    }
    if (best) {
      const an = analyzeSet(best.ids, L);   // ตรวจซ้ำกับชุดที่จะวางจริง ไม่เชื่อแค่ตอนสร้างแกน
      const okPass = an.pass.length >= SPAWN_RULES.minPass;
      if (okPass && (!T.cats || best.cats >= L.minCats || ti > 0)) {
        const relaxed = [];
        if (ti >= 1 && best.cats < L.minCats) relaxed.push(`กลุ่มอาหาร ${best.cats}/${L.minCats}`);
        if (an.strict.length < SPAWN_RULES.minStrict) relaxed.push('ไม่มีชุดผ่านเต็ม');
        if (!an.diverse) relaxed.push('3 ชุดซ้ำกันเกิน ' + SPAWN_RULES.maxOverlap + ' อย่าง');
        return { ids: best.ids, check: { ok: true, tier: T.name, tries, n, cats: best.cats, relaxed, analysis: an } };
      }
    }
  }
  // ทางสุดท้าย (ไม่ควรเกิด ถ้าข้อมูลใน pool ทำให้ไม่มีชุดผ่านเลย): สุ่มแบบเดิม แต่บันทึกว่าไม่ผ่านการตรวจ
  const ids = shuffle(pool.slice()).slice(0, n);
  const an = analyzeSet(ids, L);
  return { ids, check: { ok: false, tier: 'ไม่ผ่านการตรวจ (สุ่มแบบเดิม)', tries, n, cats: new Set(ids.map(id => FOOD_DB[id].cat)).size, relaxed: [], analysis: an } };
}
function pickIngredients(L) { return pickIngredientsChecked(L).ids; }

/* ---------- รายงาน Console ---------- */
const NUT_LABEL = key => (NUTRIENTS.find(n => n.key === key) || {}).label || key;
const reasonText = r => `${NUT_LABEL(r.key)}${r.kind === 'high' ? 'เกินเกณฑ์' : 'ต่ำกว่าช่วง'}`;
const nameOf = id => FOOD_DB[id].name;
function totalsRow(m) {
  const o = { ชุด: m.ids.map(nameOf).join(' + ') };
  NUTRIENTS.forEach(nu => { o[`${nu.label} (${nu.unit})`] = Math.round(m.totals[nu.key] * 10) / 10; });
  return o;
}
function logSpawn(L, ids, check) {
  const an = check.analysis, head = `[สุ่มวัตถุดิบ ${L.meal}]`;
  const line = `${head} วางจริง ${ids.length} ชิ้น · ชุดผ่าน ${an.pass.length} ชุด (ผ่านเต็ม ${an.strict.length}) จากทั้งหมด ${an.all.length} ชุด · ขั้นที่ใช้: ${check.tier} · สุ่ม ${check.tries} ครั้ง`;
  if (!check.ok) { console.error(`${line}\n${head} ✗ ไม่ผ่านการตรวจ: มีชุดผ่านน้อยกว่า ${SPAWN_RULES.minPass} ชุด — รอบนี้ไม่ได้รับการรับรอง`); return; }
  if (check.relaxed.length) console.warn(`${line}\n${head} ✓ ผ่าน ≥${SPAWN_RULES.minPass} ชุด แต่ผ่อนเงื่อนไข: ${check.relaxed.join(', ')}`);
  else console.info(`${line}\n${head} ✓ ผ่านการตรวจ`);
  if (DEBUG_MEALS) {
    console.log(`${head} วัตถุดิบ:`, ids.map(nameOf).join(', '));
    console.log(`${head} ชุดที่ผ่านซึ่งต่างกัน ${SPAWN_RULES.minPass} ชุด (ตัวอย่าง):`);
    console.table((an.diverse || an.pass.slice(0, SPAWN_RULES.minPass)).map(totalsRow));
  }
}

// ตรวจฐานข้อมูลของทุกด่าน (ขั้นที่ 1: มีชุดผ่านพอใน \"MEAL_POOL\" ไหม)  เรียกจาก Console ได้: auditMeals({ verbose: true })
function auditMeals(opt = {}) {
  const verbose = opt.verbose || DEBUG_MEALS;
  const withRule = NUTRIENTS.filter(n => PROFILE.rules[n.key]).map(n => `${n.label}(${PROFILE.rules[n.key].type === 'max' ? 'ห้ามเกิน' : 'ช่วง'})`);
  const noRule = NUTRIENTS.filter(n => !PROFILE.rules[n.key]).map(n => n.label);
  console.groupCollapsed(`[ตรวจชุดอาหารล่วงหน้า] ข้อมูลโภชนาการ verified:false (ตัวอย่าง) — ไม่มีการปรับตัวเลขเพื่อให้ผ่าน`);
  console.info(`สารอาหารที่มีเกณฑ์ตัดสิน: ${withRule.join(', ')} · ไม่มีเกณฑ์ผ่าน/ไม่ผ่าน (แสดงอย่างเดียว): ${noRule.join(', ')}`);
  const summary = [];
  LEVELS.forEach(L => {
    const C = levelCombos(L), okDb = C.pass.length >= SPAWN_RULES.minPass, div = findDiverse(C.pass, SPAWN_RULES.minPass, SPAWN_RULES.maxOverlap);
    const reasons = {};
    C.fail.forEach(m => m.reasons.forEach(r => { const k = reasonText(r); reasons[k] = (reasons[k] || 0) + 1; }));
    summary.push({ ด่าน: L.meal, วัตถุดิบใน_pool: C.pool.length, ชุดทั้งหมด: C.all.length, ผ่าน: C.pass.length, ผ่านเต็ม: C.strict.length, ไม่ผ่าน: C.fail.length, มี3ชุดต่างกัน: !!div, ผลตรวจฐานข้อมูล: okDb && div ? '✓' : '✗' });
    if (!okDb) console.error(`[${L.meal}] ✗ ใน MEAL_POOL มีชุดที่ผ่านเพียง ${C.pass.length} ชุด (ต้องการ ≥ ${SPAWN_RULES.minPass}) — ไม่ควรถือว่าด่านนี้ผ่านการตรวจ (ไม่ได้ปรับเกณฑ์/ตัวเลขให้เอง)`);
    else if (!div) console.warn(`[${L.meal}] ผ่าน ${C.pass.length} ชุด แต่หา 3 ชุดที่ต่างกัน (ซ้ำไม่เกิน ${SPAWN_RULES.maxOverlap} อย่าง) ไม่ได้`);
    if (verbose) {
      console.group(`[${L.meal}]`);
      console.log('เหตุผลที่ไม่ผ่าน (นับจำนวนชุด; หนึ่งชุดอาจมีหลายเหตุผล):', reasons);
      console.log('ตัวอย่างชุดที่ผ่านและต่างกัน:'); console.table((div || C.pass.slice(0, SPAWN_RULES.minPass)).map(totalsRow));
      console.groupEnd();
    }
  });
  console.table(summary);
  console.groupEnd();
  return summary;
}
// จำลองการสุ่มซ้ำ n รอบต่อด่าน (ขั้นที่ 2: วัตถุดิบที่วางจริงมีชุดผ่านพอไหม)  เรียก: auditSpawn(2000)
function auditSpawn(rounds = 1000) {
  const rows = LEVELS.map(L => {
    let bad = 0, relaxed = 0, minPass = Infinity, minStrict = Infinity, notDiverse = 0, lessCats = 0; const tiers = {}, seen = new Set();
    for (let i = 0; i < rounds; i++) {
      const { ids, check } = pickIngredientsChecked(L), an = check.analysis;
      tiers[check.tier] = (tiers[check.tier] || 0) + 1; seen.add(ids.slice().sort().join());
      if (!check.ok || an.pass.length < SPAWN_RULES.minPass) bad++;
      if (check.relaxed.length) relaxed++;
      if (!an.diverse) notDiverse++;
      if (check.cats < L.minCats) lessCats++;
      minPass = Math.min(minPass, an.pass.length); minStrict = Math.min(minStrict, an.strict.length);
    }
    return { ด่าน: L.meal, รอบ: rounds, ไม่ผ่าน: bad, ผ่อนเงื่อนไข: relaxed, ชุดผ่านน้อยสุด: minPass, ผ่านเต็มน้อยสุด: minStrict, ไม่มี3ชุดต่างกัน: notDiverse, กลุ่มอาหารไม่ถึงminCats: lessCats, ชุดวัตถุดิบไม่ซ้ำกัน: seen.size, ขั้นที่ใช้: JSON.stringify(tiers) };
  });
  console.table(rows);
  return rows;
}
if (typeof window !== 'undefined') { window.auditMeals = auditMeals; window.auditSpawn = auditSpawn; }

/* สุ่มช่องวางจาก counterSlots ของด่านนั้น: ถ้า spreadZones ให้มีอย่างน้อย 1 ช่องในทุกเคาน์เตอร์ (หลัง/ซ้าย/ขวา/กลาง) ผู้เล่นจึงต้องเดินสำรวจ */
function pickSlots(L, n) {
  const rest = shuffle(L.counterSlots.map(s => ({ ...s }))), chosen = [];
  if (L.spreadZones) {
    [...new Set(L.counterSlots.map(s => s.zone))].forEach(z => {
      const k = rest.findIndex(s => s.zone === z);
      if (k >= 0 && chosen.length < n) chosen.push(rest.splice(k, 1)[0]);
    });
  }
  while (chosen.length < n && rest.length) chosen.push(rest.shift());
  return shuffle(chosen);
}
function makeLevel(i) {
  const L = LEVELS[i], { ids: ingredients, check } = pickIngredientsChecked(L);
  logSpawn(L, ingredients, check);   // รายงานผลตรวจใน Console (ไม่แสดงให้ผู้เล่นเห็นว่าชุดไหนคือชุดที่เตรียมไว้)
  return { ...L, index: i, ingredients, slots: pickSlots(L, ingredients.length), spawnCheck: check };
}

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

  const others = state.level.ingredients.filter(id => !ids.includes(id));
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
    if (state.level.hints === false) a.tip = '';   // ด่านเย็น: ไม่บอกใบ้ตรง ๆ
    alerts.push(a);
  });
  const level = alerts.some(a => a.level === 'red') ? 'bad' : alerts.length ? 'warn' : 'good';
  return { rows, alerts, level };
}

/* สรุปทั้งวัน: รวมวัตถุดิบที่เลือกจริงของ 3 มื้อ เทียบกับ "เกณฑ์ต่อมื้อ × 3" (ใช้ตรรกะเดียวกับรายมื้อ ไม่เพิ่มเกณฑ์ใหม่) */
function evaluateDay(results) {
  const rows = NUTRIENTS.map(nu => {
    const perMeal = results.map(r => r.ids.reduce((s, id) => s + portionAmount(id, nu.key), 0));
    const total = perMeal.reduce((s, v) => s + v, 0);
    const mb = ruleBounds(nu.key);
    let bounds = null, status = 'none', kind = 'none', pct = null;
    if (mb) {
      const k = results.length || 1;
      bounds = mb.type === 'max' ? { type: 'max', max: mb.max * k } : { type: 'range', min: mb.min * k, max: mb.max * k };
      pct = total / (mb.meal * k);
      if (mb.type === 'max') {
        kind = total > bounds.max ? 'high' : pct > PROFILE.warnAt ? 'near' : 'ok';
        status = kind === 'high' ? 'red' : kind === 'near' ? 'yellow' : 'green';
      } else {
        kind = total > bounds.max ? 'high' : total < bounds.min ? 'low' : 'ok';
        status = kind === 'high' ? 'red' : kind === 'low' ? 'yellow' : 'green';
      }
    }
    return { ...nu, perMeal, total, bounds, pct, status, kind };
  });
  const level = rows.some(r => r.status === 'red') ? 'bad' : rows.some(r => r.status === 'yellow') ? 'warn' : 'good';
  return { rows, level };
}

const VERDICT = {
  good: { icon: '✅', cls: 'g', text: 'เหมาะสมตามเกณฑ์ตัวอย่าง' },
  warn: { icon: '⚠️', cls: 'y', text: 'พอใช้ แต่ควรระวังบางค่า' },
  bad:  { icon: '❌', cls: 'r', text: 'ยังไม่เหมาะ ลองเปลี่ยนวัตถุดิบ' },
};
const STATUS_ICON = { green: '✅', yellow: '⚠️', red: '❌', pending: '…', none: '' };
const STATUS_CLS  = { green: 'g', yellow: 'y', red: 'r', pending: '', none: '' };

/* ---------- 3) สถานะ + UI (DOM) ---------- */
try { auditMeals(); } catch (e) { console.error('ตรวจชุดอาหารล่วงหน้าไม่สำเร็จ', e); }   // รายงานใน Console ก่อนเริ่มเกม
const state = { mode: 'play', infoOpen: false, warnOpen: false, collected: [], plated: [], levelIndex: 0, level: makeLevel(0), results: [] };
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
    $('mission-title').textContent = `${lv.timeIcon || ''} ${lv.title}`.trim();
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
      `<tr class="th"><th></th><th>ต่อ ${f.ref.label}</th><th>ต่อ ${f.portion.label}</th><th>% เกณฑ์/เป้า${state.level.mealShort}</th></tr>` + rows;
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
    $('pm-title').textContent = `🍽️ จัด${state.level.meal}ใส่จาน`;
    $('pm-confirm').textContent = `ยืนยัน${state.level.meal}`;
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
    if (state.level.hints === false) { $('pm-msg').className = ''; $('pm-msg').textContent = 'ดูมาตรวัดแล้วตัดสินใจเองว่าจานนี้เหมาะหรือยัง'; return; }
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
    const hint = state.level.hints !== false;
    SFX.play(now.length && hint ? 'warn' : 'add');
    if (now.length && hint) UI.toast(`⚠️ ${FOOD_DB[id].emoji}${FOOD_DB[id].name} ทำให้${now.map(a => a.title).join(', ')}`);
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
    state.results[state.levelIndex] = { id: state.level.id, meal: state.level.meal, short: state.level.mealShort, ids: state.plated.slice(), level: ev.level };
    $('sm-title').textContent = `สรุป${state.level.meal}ของฉัน`;
    const lastLv = state.levelIndex >= LEVELS.length - 1;
    $('sm-restart').textContent = lastLv ? 'ดูสรุปทั้งวัน ➜' : `ไปด่านถัดไป: ${LEVELS[state.levelIndex + 1].meal} ➜`;
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
      `วิธีคำนวณ: ค่าต่อ 100 g × กรัมที่กิน ÷ 100 แล้วบวกกัน · เกณฑ์${state.level.mealShort} = เกณฑ์ต่อวัน × ${share}% ` +
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

  /* เริ่ม/เปลี่ยนด่าน: สุ่มวัตถุดิบใหม่ทุกครั้ง แล้วรีเซ็ตกระเป๋าและจาน */
  startLevel(i) {
    state.levelIndex = i; state.level = makeLevel(i);
    state.mode = 'play'; state.infoOpen = false; state.warnOpen = false; state.collected = []; state.plated = [];
    ['info-modal', 'plate-modal', 'summary-modal', 'warn-modal', 'day-modal'].forEach(id => $(id).classList.add('hidden'));
    if (scene) scene.resetWorld();
    UI.renderHud(); UI.toast(state.level.title);
  },
  next() { if (state.levelIndex >= LEVELS.length - 1) UI.showDay(); else UI.startLevel(state.levelIndex + 1); },
  retryLevel() { UI.startLevel(state.levelIndex); },
  restartAll() { state.results = []; UI.startLevel(0); },

  /* สรุปอาหารทั้งวัน (หลังจบมื้อเย็น) */
  showDay() {
    ['summary-modal', 'plate-modal', 'warn-modal', 'info-modal'].forEach(id => $(id).classList.add('hidden'));
    state.mode = 'day';
    const ev = evaluateDay(state.results), v = VERDICT[ev.level];
    SFX.play(ev.level === 'bad' ? 'bad' : 'good'); if (ev.level === 'good') confetti();
    $('dm-meals').innerHTML = state.results.map(r => {
      const mv = VERDICT[r.level];
      return `<div class="dmeal ${mv.cls}"><div class="dm-top"><b>${r.meal}</b><span class="dm-ico">${r.ids.map(id => ico(id, 26)).join('')}</span></div><small>${mv.icon} ${mv.text}</small></div>`;
    }).join('');
    $('dm-verdict').className = 'verdict ' + v.cls;
    $('dm-verdict').textContent = `${v.icon} ภาพรวมทั้งวัน: ${v.text}`;
    const head = `<tr class="th"><th>สารอาหาร</th>${state.results.map(r => `<th>${r.short}</th>`).join('')}<th>รวม</th><th>เกณฑ์ 3 มื้อ</th><th>ผล</th></tr>`;
    $('dm-table').innerHTML = head + ev.rows.filter(r => r.bounds).map(r => {
      const res = r.bounds ? `${STATUS_ICON[r.status]} ${r.kind === 'low' ? 'ต่ำ' : Math.round(r.pct * 100) + '%'}` : '—';
      return `<tr class="${r.mineral ? 'mineral' : ''}"><td>${r.label}</td>${r.perMeal.map(x => `<td>${fmt(x)}</td>`).join('')}` +
             `<td><b>${fmt(r.total)}</b> ${r.unit}</td><td>${limitText(r.bounds)}</td><td class="${STATUS_CLS[r.status]}">${res}</td></tr>`;
    }).join('');
    $('dm-formula').textContent = 'วิธีคำนวณ: รวมจากวัตถุดิบที่เลือกจริง 3 มื้อ เทียบกับ เกณฑ์ต่อมื้อ × 3 (ไม่รวมของว่าง) · % = ค่ารวม ÷ เกณฑ์/เป้า';
    $('dm-note').textContent = DATA_NOTE;
    $('day-modal').classList.remove('hidden');
    $('dm-restart').focus({ preventScroll: true });
  },

  bind() {
    $('im-close').onclick = UI.closeInfo;
    $('pm-close').onclick = UI.closePlate;
    $('pm-confirm').onclick = UI.confirmPlate;
    $('sm-restart').onclick = UI.next;
    $('sm-retry').onclick = UI.retryLevel;
    $('dm-restart').onclick = UI.restartAll;
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

/* ---------- 4.0) ชุดสีของห้อง: กลางวัน / กลางคืน (โครงห้องเดียวกัน เปลี่ยนแค่สีและแสง) ---------- */
const PAL_LUNCH = {
  ink: 0x1f2d4a, wall: 0xfdf0cf, tile: 0xffffff, tileLine: 0xeadbb2, trim: 0xe9b44c,
  floorA: 0xf7ead0, floorB: 0xefdcb8, seam: 0xd6bc90,
  top: 0xdea766, topHi: 0xeec283, topLine: 0xc2914f, cab: 0x9ad3b0, cabLine: 0x6fb08b, handle: 0xfff4d6,
  fridge: 0xf5fbff, fridgeLine: 0xc7d6df, metal: 0xc9d2dc, sink: 0xe3edf3, sinkIn: 0xb9c9d6,
  stove: 0x5c6679, burner: 0x2b3345, hood: 0xbcc6d2, pot: 0xe4572e, pan: 0x3d4a63,
  curtain: 0xff9f7a, frame: 0xffffff, rug: 0xf29b7b, rugIn: 0xf8c9a8,
  shelf: 0xc98a4b, shelfIn: 0xf7e6c4, clockFace: 0xffffff, lamp: 0xf2a65a,
  shadow: 0x2b2440, shadowA: 0.14,
  sky: [0x7fc8f0, 0x9bd6f5, 0xb8e3f8, 0xd6f0fb],
};
const PAL_DINNER = {
  ink: 0x141a38, wall: 0x434a82, tile: 0x5a5f98, tileLine: 0x454a7e, trim: 0x8a82b8,
  floorA: 0x3d3c66, floorB: 0x454472, seam: 0x2c2b50,
  top: 0xb09074, topHi: 0xc4a687, topLine: 0x8f7258, cab: 0x4e5a8e, cabLine: 0x39426e, handle: 0xd9d4ee,
  fridge: 0xcfd6ea, fridgeLine: 0x9aa3c6, metal: 0x9aa3bd, sink: 0xaeb8d0, sinkIn: 0x7e89aa,
  stove: 0x454d68, burner: 0x1b2036, hood: 0x8089a8, pot: 0xd9603d, pan: 0x2b3350,
  curtain: 0x8a6fb0, frame: 0xcfd3ee, rug: 0x6f5a9a, rugIn: 0x8a76b4,
  shelf: 0x8a6a56, shelfIn: 0x5a5380, clockFace: 0xf3f0e4, lamp: 0xf2a65a,
  shadow: 0x070920, shadowA: 0.3,
  sky: [0x0d1131, 0x151a47, 0x1f2560, 0x2c2f74],
};

class KitchenScene extends Phaser.Scene {
  constructor() { super('Kitchen'); }

  preload() {
    Object.keys(FOOD_DB).forEach(id => { if (ICON[id] && !this.textures.exists('food_' + id)) this.textures.addCanvas('food_' + id, ICON[id].canvas); });
  }

  create() {
    scene = this;
    this.level = state.level;
    this.roomObjs = []; this.roomTimers = []; this.busy = false; this._resetToken = 0;
    this.makeLightTextures();
    this.buildRoom();
    this.items = []; this.buildItems();
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
    this.showTimeBanner();
  }

  /* ===== ระบบฉาก: แต่ละด่านวาดแยกกัน (drawBreakfastRoom / drawLunchRoom / drawDinnerRoom) ===== */
  reg(o) { this.roomObjs.push(o); return o; }                 // ทุกอย่างที่เป็นของฉากต้องลงทะเบียน เพื่อลบทิ้งเมื่อเปลี่ยนด่าน
  clearRoom() {
    this.roomTimers.forEach(t => t.remove(false)); this.roomTimers = [];
    this.roomObjs.forEach(o => { this.tweens.killTweensOf(o); o.destroy(); }); this.roomObjs = [];
    this.vignette = null;
  }
  buildRoom() {
    const draw = { breakfast: this.drawBreakfastRoom, lunch: this.drawLunchRoom, dinner: this.drawDinnerRoom }[this.level.room] || this.drawBreakfastRoom;
    draw.call(this);
    this.layoutCamera();
  }

  // พื้นผิวเรืองแสงนุ่ม ๆ (วาดจากไล่เฉดวงกลม) ใช้ทำแสงไฟ แสงจันทร์ และขอบภาพมืดอ่อน ๆ — ใช้ได้ทั้ง WebGL/Canvas และเบากับมือถือ
  makeLightTextures() {
    const glow = (key, rgb) => {
      if (this.textures.exists(key)) return;
      const t = this.textures.createCanvas(key, 256, 256), c = t.getContext('2d');
      const g = c.createRadialGradient(128, 128, 0, 128, 128, 128);
      g.addColorStop(0, `rgba(${rgb},1)`); g.addColorStop(0.35, `rgba(${rgb},0.42)`); g.addColorStop(1, `rgba(${rgb},0)`);
      c.fillStyle = g; c.fillRect(0, 0, 256, 256); t.refresh();
    };
    glow('glow_warm', '255,204,120'); glow('glow_cream', '255,244,214'); glow('glow_orange', '255,146,56'); glow('glow_moon', '176,194,255');
    if (!this.textures.exists('vignette')) {
      const t = this.textures.createCanvas('vignette', 512, 288), c = t.getContext('2d');
      const g = c.createRadialGradient(256, 144, 110, 256, 144, 330);
      g.addColorStop(0, 'rgba(10,12,40,0)'); g.addColorStop(1, 'rgba(10,12,40,0.5)');   // มืดเฉพาะขอบ ไม่ทึบ ตรงกลางโปร่งใส
      c.fillStyle = g; c.fillRect(0, 0, 512, 288); t.refresh();
    }
  }
  addGlow(key, x, y, size, alpha, depth, flicker) {
    const im = this.reg(this.add.image(x, y, key).setDisplaySize(size, size).setAlpha(alpha).setBlendMode(Phaser.BlendModes.ADD).setDepth(depth == null ? 1 : depth));
    if (flicker) this.tweens.add({ targets: im, alpha: alpha * flicker, duration: 380 + Math.random() * 360, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return im;
  }
  addBeam(pts, col, alpha) {
    const b = this.reg(this.add.graphics().setDepth(1).setBlendMode(Phaser.BlendModes.ADD));
    b.fillStyle(col, alpha).fillPoints(pts, true);
    this.tweens.add({ targets: b, alpha: 0.72, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return b;
  }
  // ควันลอยจากหม้อบนเตา
  addSteam(x, y, col) {
    this.roomTimers.push(this.time.addEvent({ delay: 620, loop: true, callback: () => {
      const s = this.add.circle(x + (Math.random() - 0.5) * 10, y, 5 + Math.random() * 3, col, 0.55).setDepth(4);
      this.tweens.add({ targets: s, y: y - 38, x: s.x + (Math.random() - 0.5) * 16, scale: 2.2, alpha: 0, duration: 1100, onComplete: () => s.destroy() });
    } }));
  }
  // ฝุ่นละอองลอยในลำแสง
  addMotes(x0, y0, x1, y1, col, n) {
    for (let i = 0; i < n; i++) {
      const m = this.reg(this.add.circle(x0 + Math.random() * (x1 - x0), y0 + Math.random() * (y1 - y0), 1.5 + Math.random() * 1.5, col, 0.7).setDepth(2));
      this.tweens.add({ targets: m, y: m.y - 18 - Math.random() * 18, x: m.x + (Math.random() - 0.5) * 24, alpha: 0.15, duration: 2200 + Math.random() * 2400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: Math.random() * 1500 });
    }
  }

  /* ---------- ด่าน 1: ครัวเล็กยามเช้า (วาดเหมือนเดิม + แสงเช้าอุ่น ๆ และฝุ่นในลำแสง) ---------- */
  drawBreakfastRoom() {
    // ห้องครัว: วาดกว้างเกินพื้นที่ออกแบบ 960x540 เพื่อให้พื้นหลังเต็มจอทุกสัดส่วน
    const g = this.reg(this.add.graphics().setDepth(0)), M = 1400, W2 = CFG.W + 2 * M, W = CFG.W;
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
    //g.fillStyle(0xe76f51).fillRoundedRect(290, 292, 380, 118, 22);
    //g.fillStyle(0xf6d6a8).fillRoundedRect(302, 304, 356, 94, 14);
    //g.fillStyle(0xf4a261).fillRoundedRect(314, 316, 332, 70, 10);
    //g.fillStyle(0xe76f51); for (let x = 330; x < 640; x += 36) g.fillCircle(x, 351, 7);
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
    //[[16, 320], [944, 320]].forEach(([x, y]) => {
      //g.fillStyle(0xc2603a).fillCircle(x, y, 16).lineStyle(3, 0x1f2d4a).strokeCircle(x, y, 16);
      //g.fillStyle(0x4caf50); for (let a = 0; a < 6; a++) g.fillCircle(x + Math.cos(a * 1.05) * 9, y + Math.sin(a * 1.05) * 9, 8);
      //g.fillStyle(0x7ed37f).fillCircle(x, y, 7);
    //});
    // แสงแดดจากหน้าต่าง
    g.fillStyle(0xffffff, 0.22).fillPoints([{ x: 120, y: 236 }, { x: 200, y: 236 }, { x: 290, y: 430 }, { x: 210, y: 430 }], true);
    g.fillStyle(0xffffff, 0.16).fillPoints([{ x: 230, y: 236 }, { x: 280, y: 236 }, { x: 370, y: 430 }, { x: 320, y: 430 }], true);
    // แสงเช้าอุ่น ๆ ฟุ้งตามลำแสง + ฝุ่นละอองลอยในแสงแดด
    this.addGlow('glow_cream', 215, 330, 380, 0.13, 1);
    this.addGlow('glow_warm', 330, 380, 300, 0.08, 1);
    this.addMotes(150, 280, 330, 420, 0xfff6d0, 7);
  }

  /* ---------- ด่าน 2 และ 3: ครัวใหญ่ (วาดโครงห้องเดียวกันด้วยชุดสีต่างกัน) ---------- */
  drawBigKitchen(P, opt) {
    const g = this.reg(this.add.graphics().setDepth(0)), M = BIG, W = CFG.W, X0 = -700, X1 = W + 700, ink = P.ink, night = !!opt.night;
    const rect = (x, y, w, h, c, a) => g.fillStyle(c, a == null ? 1 : a).fillRect(x, y, w, h);
    const rrect = (x, y, w, h, r, c, lw) => { g.fillStyle(c).fillRoundedRect(x, y, w, h, r); g.lineStyle(lw || 2, ink).strokeRoundedRect(x, y, w, h, r); };
    const ln = (x1, y1, x2, y2) => { g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.strokePath(); };
    const circ = (x, y, r, c, lw) => { g.fillStyle(c).fillCircle(x, y, r); g.lineStyle(lw || 2, ink).strokeCircle(x, y, r); };

    // ผนัง + กระเบื้องกันเปื้อน
    rect(-M, -M, 2 * M + W, 146 + M, P.wall);
    rect(X0, 104, X1 - X0, 42, P.tile);
    g.lineStyle(2, P.tileLine);
    for (let y = 118; y < 146; y += 14) ln(X0, y, X1, y);
    for (let r = 0, y = 104; y < 146; y += 14, r++) for (let x = X0 + (r % 2 ? 14 : 0); x < X1; x += 28) ln(x, y, x, y + 14);
    g.lineStyle(4, P.trim); ln(-M, 104, W + M, 104);

    // พื้นไม้ปูแผ่น
    rect(-M, 230, 2 * M + W, 900 - 230 + M, P.floorA);
    g.lineStyle(2, P.seam);
    for (let y = 230, r = 0; y < 900; y += 40, r++) {
      if (r % 2) rect(X0, y, X1 - X0, 40, P.floorB);
      ln(X0, y, X1, y);
      for (let x = X0 + (r % 2 ? 60 : 0); x < X1; x += 120) ln(x, y, x, y + 40);
    }
    // พรมใต้เกาะกลางห้อง
    rrect(292, 290, 376, 126, 24, P.rug, 3); g.fillStyle(P.rugIn).fillRoundedRect(304, 302, 352, 102, 16);
    g.fillStyle(P.rug); for (let x = 322; x < 650; x += 34) g.fillCircle(x, 353, 6);

    // เคาน์เตอร์หลังห้อง: ท็อปไม้ + ตู้ด้านหน้า
    rect(-M, 146, 2 * M + W, 60, P.top); rect(-M, 146, 2 * M + W, 6, P.topHi);
    g.lineStyle(2, P.topLine); for (let x = X0; x < X1; x += 96) ln(x, 152, x, 206);
    rect(-M, 206, 2 * M + W, 24, P.cab);
    g.lineStyle(2, P.cabLine);
    for (let x = X0; x < X1; x += 84) { g.strokeRect(x + 4, 210, 76, 16); g.fillStyle(P.handle).fillRoundedRect(x + 34, 215, 16, 4, 2); }
    g.lineStyle(3, ink); ln(-M, 146, W + M, 146); ln(-M, 230, W + M, 230);

    // ตู้เย็น (ซ้ายสุด)
    rrect(20, 70, 92, 160, 8, P.fridge, 3); g.lineStyle(2, P.fridgeLine); ln(20, 126, 112, 126);
    rrect(98, 84, 5, 30, 2, P.metal); rrect(98, 138, 5, 44, 2, P.metal);
    g.fillStyle(0xff8fa3).fillRect(34, 146, 12, 12); g.fillStyle(0x6ec6ff).fillRect(52, 156, 12, 12); g.fillStyle(0xffffff).fillRect(40, 172, 22, 26);
    g.lineStyle(1, 0x9aa8bb); ln(44, 180, 58, 180); ln(44, 186, 56, 186);
    g.fillStyle(0x000000, 0.1).fillRect(20, 224, 92, 6);

    // หน้าต่าง 2 บาน: ท้องฟ้าเปลี่ยนตามเวลา (กลางวัน/กลางคืน)
    const stars = [];
    const win = (x, hasMoonSun) => {
      const y = 96, w = 170, h = 44, bh = h / P.sky.length;
      P.sky.forEach((c, i) => rect(x, y + i * bh, w, bh + 1, c));
      if (night) {
        rect(x, y + h - 14, w, 14, 0x0b0e2a);                                   // เส้นขอบฟ้าเมืองตอนกลางคืน
        [[8, 14, 10], [24, 20, 14], [44, 12, 9], [62, 22, 16], [86, 16, 12], [108, 24, 18], [128, 12, 10], [146, 18, 14]].forEach(([dx, hh, ww]) => {
          rect(x + dx, y + h - hh, ww, hh, 0x0b0e2a);
          if (hh > 12) { g.fillStyle(0xffd86b); g.fillRect(x + dx + 2, y + h - hh + 4, 2, 2); g.fillRect(x + dx + ww - 4, y + h - hh + 8, 2, 2); }
        });
        [[16, 10], [38, 22], [60, 8], [84, 16], [104, 8], [132, 20], [152, 10], [72, 26]].forEach(([dx, dy]) => stars.push([x + dx, y + dy]));
        if (hasMoonSun) { g.fillStyle(0xfff3c4).fillCircle(x + 126, y + 14, 9); g.fillStyle(P.sky[1]).fillCircle(x + 131, y + 11, 8); }   // พระจันทร์เสี้ยว
      } else {
        rect(x, y + h - 9, w, 9, 0x8fd18a);                                      // สนามหญ้า
        g.fillStyle(0xffffff, 0.95).fillEllipse(x + 36, y + 14, 34, 11).fillEllipse(x + 50, y + 11, 22, 11);   // เมฆ
        if (hasMoonSun) { g.fillStyle(0xffe27a).fillCircle(x + 132, y + 15, 10); g.fillStyle(0xfff4b0, 0.7).fillCircle(x + 132, y + 15, 15); }
        else g.fillStyle(0xffffff, 0.9).fillEllipse(x + 120, y + 18, 28, 9);
        g.fillStyle(0x4caf50).fillCircle(x + 90, y + h - 12, 8); g.fillStyle(0x8d6e63).fillRect(x + 89, y + h - 8, 2, 4);
      }
      g.lineStyle(6, P.frame).strokeRect(x, y, w, h); g.lineStyle(2, ink).strokeRect(x - 3, y - 3, w + 6, h + 6);
      g.lineStyle(4, P.frame); ln(x + w / 2, y, x + w / 2, y + h); ln(x, y + h / 2, x + w, y + h / 2);
      rect(x - 8, y + h + 2, w + 16, 6, P.frame); g.lineStyle(2, ink).strokeRect(x - 8, y + h + 2, w + 16, 6);   // ขอบหน้าต่างด้านล่าง
      rrect(x - 16, y - 4, 16, h + 12, 5, P.curtain); rrect(x + w, y - 4, 16, h + 12, 5, P.curtain);              // ผ้าม่าน
    };
    win(132, false); win(622, true);
    stars.forEach(([sx, sy], i) => {
      const s = this.reg(this.add.circle(sx, sy, 1.4 + (i % 3) * 0.4, 0xffffff, 0.95).setDepth(0.5));
      this.tweens.add({ targets: s, alpha: 0.2, duration: 700 + i * 130, yoyo: true, repeat: -1, delay: i * 90 });
    });

    // นาฬิกาแขวนผนัง บอกเวลาของมื้อ
    const [ch, cm] = opt.clock, cx = 352, cy = 124;
    circ(cx, cy, 17, P.clockFace, 3);
    g.lineStyle(2, ink); for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; ln(cx + Math.cos(a) * 13, cy + Math.sin(a) * 13, cx + Math.cos(a) * 15, cy + Math.sin(a) * 15); }
    const ha = ((ch % 12) + cm / 60) / 12 * Math.PI * 2 - Math.PI / 2, ma = cm / 60 * Math.PI * 2 - Math.PI / 2;
    g.lineStyle(3, ink); ln(cx, cy, cx + Math.cos(ha) * 8, cy + Math.sin(ha) * 8);
    g.lineStyle(2, ink); ln(cx, cy, cx + Math.cos(ma) * 12, cy + Math.sin(ma) * 12);

    // เครื่องดูดควัน + เตา
    g.fillStyle(P.hood).fillPoints([{ x: 444, y: 96 }, { x: 520, y: 96 }, { x: 538, y: 140 }, { x: 426, y: 140 }], true);
    g.lineStyle(3, ink).strokePoints([{ x: 444, y: 96 }, { x: 520, y: 96 }, { x: 538, y: 140 }, { x: 426, y: 140 }], true);
    g.lineStyle(2, P.metal); ln(452, 112, 512, 112); ln(448, 124, 516, 124);
    rrect(436, 150, 92, 52, 8, P.stove);
    [[458, 166], [506, 166], [458, 188], [506, 188]].forEach(([bx, by]) => circ(bx, by, 11, P.burner));
    circ(458, 166, 17, P.pot, 3); rrect(437, 162, 10, 6, 3, P.metal, 2); rrect(470, 162, 10, 6, 3, P.metal, 2); circ(458, 164, 4, P.metal, 2);   // หม้อบนเตา
    circ(506, 188, 14, P.pan, 3); rrect(518, 185, 20, 5, 2, P.pan, 2);                                                                              // กระทะ
    rrect(442, 210, 80, 14, 4, P.cab, 2); g.fillStyle(0x2b3345).fillRect(452, 213, 60, 8);                                                           // หน้าเตาอบ
    // อ่างล้างจาน
    rrect(252, 154, 84, 44, 12, P.sink, 3); rrect(260, 160, 68, 32, 9, P.sinkIn, 2);
    g.lineStyle(7, ink); g.beginPath(); g.moveTo(294, 160); g.lineTo(294, 146); g.lineTo(310, 146); g.lineTo(310, 154); g.strokePath();
    g.lineStyle(4, P.metal); g.beginPath(); g.moveTo(294, 160); g.lineTo(294, 146); g.lineTo(310, 146); g.lineTo(310, 154); g.strokePath();
    circ(280, 150, 4, P.metal); circ(326, 150, 4, P.metal);
    rrect(340, 150, 10, 16, 3, 0x7ec8e3, 2);                                                                                                         // ขวดน้ำยาล้างจาน

    // ของตกแต่งแขวนผนัง: ด่านกลางวัน = ราวแขวนแก้ว / ด่านเย็น = โคมไฟแขวน
    if (opt.decor === 'lunch') {
      g.lineStyle(3, 0x8d98a8); ln(556, 112, 612, 112);
      [[564, 0xff9f7a], [582, 0x7ec8e3], [600, 0xffd86b]].forEach(([mx, mc]) => { g.lineStyle(2, 0x8d98a8); ln(mx, 112, mx, 118); rrect(mx - 6, 118, 12, 14, 3, mc, 2); });
    } else {
      g.lineStyle(2, ink); ln(582, 88, 582, 112);
      const shade = [{ x: 566, y: 112 }, { x: 598, y: 112 }, { x: 610, y: 134 }, { x: 554, y: 134 }];
      g.fillStyle(P.lamp).fillPoints(shade, true); g.lineStyle(3, ink).strokePoints(shade, true);
      g.fillStyle(0xfff1a8).fillEllipse(582, 136, 34, 8);
    }
    // ตู้เก็บของขวา: ชั้นวางโหลและกล่อง + ตู้ด้านล่าง
    rrect(790, 74, 150, 156, 6, P.shelf, 3); rect(798, 82, 134, 100, P.shelfIn);
    g.lineStyle(3, P.shelf); ln(798, 114, 932, 114); ln(798, 148, 932, 148);
    [[806, 94, 16, 20, 0xff9f7a], [826, 98, 14, 16, 0x7ec8e3], [846, 92, 18, 22, 0xffd86b], [870, 100, 20, 14, 0x8fd18a], [896, 94, 16, 20, 0xf2a1c0], [914, 98, 12, 16, 0xb39ddb]].forEach(([jx, jy, jw, jh, jc]) => rrect(jx, jy, jw, jh, 3, jc, 2));
    [[806, 124, 22, 24, 0xe4572e], [832, 130, 16, 18, 0xffffff], [854, 122, 24, 26, 0x8fd18a], [884, 128, 18, 20, 0xffd86b], [908, 124, 20, 24, 0xff9f7a]].forEach(([jx, jy, jw, jh, jc]) => rrect(jx, jy, jw, jh, 3, jc, 2));
    [[808, 156, 36, 22], [852, 156, 36, 22], [896, 156, 32, 22]].forEach(([bx, by, bw, bh]) => rrect(bx, by, bw, bh, 6, 0xd9a05b, 2));        // ตะกร้า
    rect(798, 184, 134, 40, P.cab); g.lineStyle(2, ink); g.strokeRect(798, 184, 66, 40); g.strokeRect(866, 184, 66, 40);
    g.fillStyle(P.handle).fillRoundedRect(850, 198, 6, 12, 2).fillRoundedRect(874, 198, 6, 12, 2);

    // เกาะกลางห้อง
    rect(330, 300, 300, 56, P.top); rect(330, 300, 300, 5, P.topHi);
    g.lineStyle(2, P.topLine); for (let x = 378; x < 630; x += 96) ln(x, 305, x, 356);
    rect(330, 356, 300, 16, P.cab); g.lineStyle(2, P.cabLine); for (let x = 336; x + 66 <= 630; x += 72) g.strokeRect(x, 359, 66, 10);
    g.lineStyle(3, ink).strokeRect(330, 300, 300, 72); ln(330, 356, 630, 356);
    if (opt.decor === 'lunch') {   // แจกันดอกไม้กลางเกาะ (ด่านเย็นใช้ช่องกลางวางวัตถุดิบ จึงไม่ตั้งแจกัน)
      rrect(472, 330, 16, 22, 5, 0x7ec8e3, 2);
      [[474, 322, 0xff7aa8], [486, 320, 0xffd86b], [480, 314, 0xffffff]].forEach(([fx, fy, fc]) => circ(fx, fy, 5, fc, 2));
    }

    // เคาน์เตอร์ข้างซ้าย/ขวา (ต่อเนื่องออกนอกจอ)
    [[-M, M + 100], [860, M + 100]].forEach(([sx, sw]) => {
      rect(sx, 272, sw, 148, P.top); rect(sx, 272, sw, 5, P.topHi);
      g.lineStyle(2, P.topLine); for (let y = 320; y < 420; y += 50) ln(sx, y, sx + sw, y);
      rect(sx, 420, sw, 12, P.cab);
      g.lineStyle(3, ink).strokeRect(sx, 272, sw, 160); ln(sx, 420, sx + sw, 420);
    });

    // เงาใต้เคาน์เตอร์ ข้างเฟอร์นิเจอร์ และมุมห้อง (เข้มขึ้นตอนกลางคืน)
    const sh = this.reg(this.add.graphics().setDepth(0.6)), sa = P.shadowA;
    sh.fillStyle(P.shadow, sa).fillRect(-M, 230, 2 * M + W, 14);
    sh.fillStyle(P.shadow, sa).fillRect(-M, 432, M + 100, 18).fillRect(860, 432, M + 100, 18);
    sh.fillStyle(P.shadow, sa * 1.1).fillEllipse(480, 376, 332, 24);
    sh.fillStyle(P.shadow, sa).fillTriangle(112, 230, 168, 230, 112, 300).fillTriangle(790, 230, 738, 230, 790, 296);
    sh.fillStyle(P.shadow, sa * 0.8).fillTriangle(100, 272, 150, 272, 100, 300).fillTriangle(860, 272, 810, 272, 860, 300);
    this.roomHasNight = night;
  }

  drawLunchRoom() {
    this.drawBigKitchen(PAL_LUNCH, { clock: [12, 0], decor: 'lunch' });
    // แสงแดดกลางวันจ้า: ลำแสงจากหน้าต่างทั้งสองบานตกลงบนเคาน์เตอร์และพื้น + แสงฟุ้งรอบหน้าต่าง
    this.addGlow('glow_cream', 217, 160, 380, 0.28, 1);
    this.addGlow('glow_cream', 707, 160, 380, 0.28, 1);
    this.addBeam([{ x: 134, y: 146 }, { x: 298, y: 146 }, { x: 424, y: 440 }, { x: 262, y: 440 }], 0xfff0b8, 0.11);
    this.addBeam([{ x: 624, y: 146 }, { x: 778, y: 146 }, { x: 900, y: 436 }, { x: 748, y: 436 }], 0xfff0b8, 0.11);
    this.addMotes(180, 250, 400, 420, 0xffffff, 8); this.addMotes(660, 250, 880, 420, 0xffffff, 8);
    this.addSteam(458, 148, 0xffffff);
  }

  drawDinnerRoom() {
    this.drawBigKitchen(PAL_DINNER, { night: true, clock: [18, 30], decor: 'dinner' });
    // แสงจันทร์ผ่านหน้าต่าง (สีฟ้าเย็น)
    this.addGlow('glow_moon', 748, 118, 170, 0.5, 1);
    this.addGlow('glow_moon', 217, 128, 300, 0.2, 1);
    this.addBeam([{ x: 134, y: 146 }, { x: 298, y: 146 }, { x: 430, y: 440 }, { x: 266, y: 440 }], 0xa9bfff, 0.11);
    this.addBeam([{ x: 624, y: 146 }, { x: 778, y: 146 }, { x: 912, y: 436 }, { x: 758, y: 436 }], 0xa9bfff, 0.12);
    // แสงอุ่นจากโคมไฟแขวน ไฟเพดาน เตา และตู้เย็น (กะพริบเบา ๆ ให้ดูมีชีวิต)
    this.addGlow('glow_warm', 582, 138, 260, 0.55, 1, 0.8);
    this.addGlow('glow_warm', 582, 200, 380, 0.26, 1);
    this.addGlow('glow_warm', 240, 350, 400, 0.15, 1);
    this.addGlow('glow_warm', 480, 345, 440, 0.18, 1);
    this.addGlow('glow_warm', 720, 350, 400, 0.15, 1);
    this.addGlow('glow_orange', 482, 188, 210, 0.36, 1, 0.65);
    this.addGlow('glow_moon', 66, 190, 230, 0.2, 1, 0.8);
    this.addSteam(458, 148, 0xe6ebff);
    // ขอบภาพมืดอ่อน ๆ ให้บรรยากาศกลางคืน (ตรงกลางโปร่งใส ไม่บังตัวละครหรือวัตถุดิบ)
    this.vignette = this.reg(this.add.image(DESIGN_W / 2, DESIGN_H / 2, 'vignette').setDepth(20).setAlpha(0.8));
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
    const z = Math.max(0.1, Math.min(w / DESIGN_W, h / DESIGN_H));
    cam.setSize(w, h);
    cam.setZoom(z);
    cam.centerOn(DESIGN_W / 2, DESIGN_H / 2);
    if (this.vignette && this.vignette.active) this.vignette.setPosition(DESIGN_W / 2, DESIGN_H / 2).setDisplaySize(w / z + 8, h / z + 8);   // ขอบมืดอ่อนคลุมเต็มจอทุกสัดส่วน
  }

  makeItem(id, pos) {
    const f = FOOD_DB[id];
    const glow = this.level.itemGlow
      ? this.add.image(pos.x, pos.y, 'glow_warm').setDisplaySize(104, 104).setAlpha(0.34).setBlendMode(Phaser.BlendModes.ADD).setDepth(2)
      : null;                                                   // ด่านกลางคืน: แสงอุ่นใต้วัตถุดิบ ช่วยให้มองเห็นชัด
    const shadow = this.add.ellipse(pos.x, pos.y + 22, 46, 12, 0x000000, 0.18).setDepth(2);
    const visual = this.textures.exists('food_' + id)
      ? this.add.image(pos.x, pos.y, 'food_' + id).setDisplaySize(58, 58)
      : this.add.text(pos.x, pos.y, f.emoji, { fontSize: '46px' }).setOrigin(0.5);
    visual.setDepth(3);
    const label = this.add.text(pos.x, pos.y + 44, f.name, {
      fontFamily: 'Sarabun, Tahoma, sans-serif', fontSize: '19px', fontStyle: 'bold',
      color: '#fff', stroke: '#1f2d4a', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(3);
    return { id, x: pos.x, y: pos.y, visual, shadow, label, glow, collected: false, baseY: pos.y, s0: visual.scaleX };
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

  buildItems() {
    (this.items || []).forEach(it => {
      this.tweens.killTweensOf(it.visual);
      it.visual.destroy(); it.shadow.destroy(); it.label.destroy(); if (it.glow) it.glow.destroy();
    });
    this.level = state.level;
    // วัตถุดิบถูกสุ่มแล้ววางลงช่อง level.slots ซึ่งสุ่มมาจากช่องบนเคาน์เตอร์ของด่านนั้น ๆ เท่านั้น
    this.items = this.level.ingredients.map((id, i) => this.makeItem(id, this.level.slots[i]));
  }

  /* เปลี่ยนด่านแบบนุ่มนวล: เฟดไปสีของด่านใหม่ → สร้างห้อง/วัตถุดิบใหม่ → เฟดกลับ
   * ระหว่างเฟดตัวละครจะหยุดนิ่ง (busy) เพื่อไม่ให้เก็บของของฉากเก่าปนกับด่านใหม่ */
  resetWorld(instant) {
    const cam = this.cameras.main, fc = state.level.fade || [255, 253, 246], token = ++this._resetToken;
    let done = false;
    const apply = () => {
      if (done || token !== this._resetToken) return;
      done = true;
      this.clearRoom(); this.level = state.level;
      this.buildRoom(); this.buildItems();
      this.player.setPosition(this.level.start.x, this.level.start.y);
      this.dirAngle = Math.PI / 2; this.player.rotation = this.dirAngle;
      this.busy = false;
      cam.fadeIn(instant ? 1 : 460, fc[0], fc[1], fc[2]);
      this.showTimeBanner();
    };
    this.busy = true;
    if (instant) return apply();
    SFX.play('whoosh');
    cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, apply);
    cam.fadeOut(280, fc[0], fc[1], fc[2]);
    this.time.delayedCall(900, apply);                           // กันพลาดกรณีอีเวนต์เฟดไม่ถูกเรียก
  }

  // ป้ายบอกช่วงเวลาของมื้อ ลอยขึ้นกลางจอแล้วจางหาย
  showTimeBanner() {
    const L = this.level, night = L.room === 'dinner';
    const t = this.add.text(DESIGN_W / 2, 300, `${L.timeIcon}  ${L.banner}  ${L.clock}`, {
      fontFamily: 'Mali, Sarabun, sans-serif', fontSize: '40px', fontStyle: 'bold',
      color: night ? '#fff3c4' : '#ffffff', stroke: '#1f2d4a', strokeThickness: 7,
    }).setOrigin(0.5).setDepth(70).setAlpha(0);
    this.tweens.add({ targets: t, alpha: 1, y: 270, duration: 450, hold: 1100, yoyo: true, onComplete: () => t.destroy() });
    SFX.play(night ? 'night' : 'chime');
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
    it.shadow.setVisible(false); it.label.setVisible(false); if (it.glow) it.glow.setVisible(false);
    SFX.play('pop'); this.burst(it.x, it.y); this.floatText(it.x, it.y, `+ ${FOOD_DB[it.id].name}`);
    UI.renderHud(); UI.scrollBagTo(state.collected.length - 1); UI.toast(`เก็บ${FOOD_DB[it.id].name}แล้ว`);
  }

  update(time, dt) {
    const K = this.keys, JD = Phaser.Input.Keyboard.JustDown;
    const pressE = JD(K.e) || touch.e, pressF = JD(K.f) || touch.f, pressEsc = JD(K.esc);
    touch.e = touch.f = false;
    if (pressEsc) UI.escape();

    const uiLocked = !UI.canPlay();
    $('game-wrap').classList.toggle('locked', uiLocked);
    const locked = uiLocked || this.busy;                          // หน้าต่าง UI เปิดอยู่ หรือกำลังเปลี่ยนฉาก → เดิน/เก็บของไม่ได้
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
      // เดินพร้อมชนเฟอร์นิเจอร์: ลองขยับทีละแกน จึงเดินไถลไปตามขอบเคาน์เตอร์ได้ ไม่ติดค้าง
      const B = this.level.bounds || CFG, obs = this.level.obstacles || [], rad = CFG.playerR * 0.85;
      const step = CFG.speed * Math.min(dt, 50) / 1000;
      const free = (x, y) => !obs.some(o => circleHitsRect(x, y, rad, o));
      let nx = p.x, ny = p.y;
      const tx = Phaser.Math.Clamp(p.x + vx * step, B.minX, B.maxX);
      if (free(tx, ny)) nx = tx;
      const ty = Phaser.Math.Clamp(p.y + vy * step, B.minY, B.maxY);
      if (free(nx, ty)) ny = ty;
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
      if (it.glow) it.glow.setAlpha((hot ? 0.5 : 0.3) + Math.sin(time / 500 + i) * 0.05);
      if (hot) {
        const k = 1 + Math.sin(time / 160) * 0.08;
        this.hl.fillStyle(0xfff3b0, 0.5).fillCircle(it.x, it.baseY, 38 * k);
        this.hl.lineStyle(3, 0xffffff, 0.95).strokeEllipse(it.x, it.baseY + 24, 64 * k, 20 * k);
      }
    });

    if (near) {
      const txt = `กด E เก็บ${FOOD_DB[near.item.id].name} · F ดูข้อมูล`;
      this.prompt.setText(txt).setPosition(Phaser.Math.Clamp(p.x, 120, 840), p.y - 34).setVisible(true);
    } else if (state.collected.length > 0 && !this.busy) {
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
