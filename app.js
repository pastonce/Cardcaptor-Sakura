/* ============================================================
   魔卡少女樱 · 库洛牌 × 小樱牌 展览 — 逻辑与交互
   原生实现、无外部依赖，可直接以 file:// 双击打开
   ============================================================ */
'use strict';

/* ---------- 常量 ---------- */
const CLOW_DIR   = 'assets/clow/';
const SAKURA_DIR = 'assets/sakura/';
const C_BACK     = 'assets/ClowCardSideB.jpeg';   // 库洛牌统一卡背
const S_BACK     = 'assets/SakuraCardSideB.jpeg'; // 小樱牌统一卡背

/* 魔法阵 SVG（头部背景 / 转化仪式 / 合成仪式 共用） */
const MAGIC_RING = `
<svg viewBox="0 0 240 240" aria-hidden="true">
  <g fill="none" stroke="currentColor">
    <circle cx="120" cy="120" r="112" stroke-width="2"/>
    <circle cx="120" cy="120" r="104" stroke-width="1" stroke-dasharray="3 7"/>
    <circle cx="120" cy="120" r="70" stroke-width="1"/>
    <circle cx="120" cy="120" r="58" stroke-width="1" stroke-dasharray="2 5"/>
    <path stroke-width="1.5" d="M120 14 L145 61 L195 45 L179 96 L226 120 L179 144 L195 195 L145 179 L120 226 L95 179 L45 195 L61 144 L14 120 L61 96 L45 45 L95 61 Z"/>
    <circle cx="120" cy="120" r="18" stroke-width="1.5"/>
  </g>
</svg>`;

/* ---------- 卡牌数据 ----------
   52 组一一对应的卡牌，按动画中的收服顺序排列 */
const CARDS = [
  { cn: '风', en: 'Windy' },   { cn: '翔', en: 'Fly' },      { cn: '影', en: 'Shadow' },
  { cn: '水', en: 'Watery' },  { cn: '雨', en: 'Rain' },     { cn: '树', en: 'Wood' },
  { cn: '跳', en: 'Jump' },    { cn: '幻', en: 'Illusion' }, { cn: '雷', en: 'Thunder' },
  { cn: '剑', en: 'Sword' },   { cn: '花', en: 'Flower' },   { cn: '盾', en: 'Shield' },
  { cn: '力', en: 'Power' },   { cn: '雾', en: 'Mist' },     { cn: '岚', en: 'Storm' },
  { cn: '浮', en: 'Float' },   { cn: '消', en: 'Erase' },    { cn: '灯', en: 'Glow' },
  { cn: '移', en: 'Move' },    { cn: '斗', en: 'Fight' },    { cn: '轮', en: 'Loop' },
  { cn: '眠', en: 'Sleep' },   { cn: '歌', en: 'Song' },     { cn: '小', en: 'Little' },
  { cn: '镜', en: 'Mirror' },  { cn: '迷', en: 'Maze' },     { cn: '戻', en: 'Return' },
  { cn: '击', en: 'Shot' },    { cn: '甘', en: 'Sweet' },    { cn: '驱', en: 'Dash' },
  { cn: '大', en: 'Big' },     { cn: '创', en: 'Create' },   { cn: '替', en: 'Change' },
  { cn: '冻', en: 'Freeze' },  { cn: '火', en: 'Firey' },    { cn: '矢', en: 'Arrow' },
  { cn: '雪', en: 'Snow' },    { cn: '声', en: 'Voice' },    { cn: '锭', en: 'Lock' },
  { cn: '云', en: 'Cloud' },   { cn: '梦', en: 'Dream' },    { cn: '砂', en: 'Sand' },
  { cn: '暗', en: 'Dark' },    { cn: '光', en: 'Light' },    { cn: '时', en: 'Time' },
  { cn: '双', en: 'Twin' },    { cn: '地', en: 'Earthy' },   { cn: '泡', en: 'Bubbles' },
  { cn: '波', en: 'Wave' },    { cn: '秤', en: 'Libra' },    { cn: '抜', en: 'Through' },
  { cn: '静', en: 'Silent' },
];

/* 三张特殊牌：无 + 爱 = 希望 */
const SPECIAL = {
  nothing: { cn: '无',   en: 'The Nothing', img: 'assets/CNothing.jpeg', side: 'clow',
             desc: '尚未写上名字的库洛牌，安静地等待着一个名字。' },
  unknown: { cn: '爱', en: 'The Unknown', img: 'assets/SUnknown.jpeg', side: 'sakura',
             desc: '由小樱的泪水与心意孕育而生的爱之牌。' },
  hope:    { cn: '希望', en: 'The Hope',    img: 'assets/SHope.jpeg',    side: 'sakura',
             desc: '「无」与「爱」合而为一，由最深的感情诞生的、最重要的一张牌。' },
};

/* ---------- 工具 ---------- */
const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

function stored(k) { try { return localStorage.getItem('ccs_' + k); } catch (e) { return null; } }
function save(k, v)  { try { localStorage.setItem('ccs_' + k, v); } catch (e) {} }

/* ---------- 状态 ---------- */
let mode        = stored('mode') === 'sakura' ? 'sakura' : 'clow'; // 当前卡组
let synthesized = stored('hope') === '1';   // 希望之牌是否已合成（跨刷新记忆）
let busy        = false;                    // 全局转化动画进行中
let ritualOn    = false;                    // 合成仪式播放中

const gridEl   = $('#grid');
const searchEl = $('#search');
const countEl  = $('#count');
const emptyEl  = $('#empty');
const ritualEl = $('#ritual');
const hopeStage = $('#hope-stage');
let selected = new Set();                   // 已选中的仪式卡

/* ---------- 详情数据 ---------- */
function pairData(card, i) {
  return {
    cn: card.cn,
    en: 'The ' + card.en,
    morphable: true,
    clowSrc:   CLOW_DIR + 'C' + card.en + '.jpeg',
    sakuraSrc: SAKURA_DIR + 'S' + card.en + '.jpeg',
    descClow:   '封印着古老力量的库洛牌，安静地沉睡着。',
    descSakura: '由小樱重新唤醒的小樱牌，焕发着新的光芒。',
  };
}
function specialData(sp) {
  return {
    cn: sp.cn, en: sp.en, morphable: false,
    clowSrc:   sp.side === 'clow'   ? sp.img : null,
    sakuraSrc: sp.side === 'sakura' ? sp.img : null,
    descClow: sp.desc, descSakura: sp.desc,
  };
}

/* ============================================================
   图鉴网格
   ============================================================ */
function buildGrid() {
  const frag = document.createDocumentFragment();
  CARDS.forEach((card, i) => {
    const el = document.createElement('article');
    el.className = 'card';
    el._card = card;
    const clowSrc   = CLOW_DIR + 'C' + card.en + '.jpeg';
    const sakuraSrc = SAKURA_DIR + 'S' + card.en + '.jpeg';
    el.innerHTML = `
      <button class="flip-zone" aria-label="翻面：${card.cn}（The ${card.en}）">
        <div class="flip-inner">
          <div class="flip-face front">
            <img src="${clowSrc}" data-clow="${clowSrc}" data-sakura="${sakuraSrc}" alt="${card.cn}" loading="lazy">
          </div>
          <div class="flip-face back">
            <img src="${mode === 'sakura' ? S_BACK : C_BACK}" alt="卡背" loading="lazy">
          </div>
        </div>
        <span class="card-no">${String(i + 1).padStart(2, '0')}</span>
      </button>
      <div class="card-meta">
        <span class="cn">${card.cn}</span>
        <span class="en">The ${card.en}</span>
        <button class="detail-btn" title="查看详情" aria-label="查看详情：${card.cn}">ⓘ</button>
      </div>`;
    el.querySelector('.flip-zone').addEventListener('click', () => el.classList.toggle('flipped'));
    el.querySelector('.detail-btn').addEventListener('click', () => openModal(pairData(card, i)));
    frag.appendChild(el);
  });
  gridEl.appendChild(frag);
}

function swapCardImages(el, toSakura) {
  const front = el.querySelector('.front img');
  const back  = el.querySelector('.back img');
  front.src = toSakura ? front.dataset.sakura : front.dataset.clow;
  back.src  = toSakura ? S_BACK : C_BACK;
}

/* 整面图鉴的转化：可见卡牌按顺序卷起波纹，隐藏卡牌静默换图 */
function morphAll(target) {
  if (busy || target === mode) return;
  busy = true;
  document.body.dataset.mode = target;   // 主题配色先行渐变
  mode = target;
  save('mode', target);
  updateModeUI();

  const toSakura = target === 'sakura';
  const items    = $$('#grid .card');
  const visible  = items.filter(el => !el.classList.contains('hidden'));
  items.forEach(el => { if (el.classList.contains('hidden')) swapCardImages(el, toSakura); });

  const step = visible.length > 28 ? 48 : 70;   // 波纹速度随数量自适应
  visible.forEach((el, i) => {
    setTimeout(() => {
      el.classList.add('morphing');
      setTimeout(() => {
        swapCardImages(el, toSakura);
        el.classList.remove('morphing');
      }, 400);
    }, i * step);
  });

  setTimeout(() => { busy = false; }, visible.length * step + 1000);
}

function updateModeUI() {
  $$('.mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
  $('#mode-switch').dataset.active = mode;
  $('#gallery-title').textContent = (mode === 'sakura' ? '小樱牌' : '库洛牌') + ' · 全 52 张';
  $('#transform-all').textContent = mode === 'sakura'
    ? '✦ 逆转 · 全部恢复为库洛牌'
    : '✦ 封印解除 · 全部转化为小樱牌';
  applyFilter();
}

function applyFilter() {
  const q = searchEl.value.trim().toLowerCase();
  let n = 0;
  gridEl.querySelectorAll('.card').forEach(el => {
    const c = el._card;
    const hit = !q || c.cn.includes(q)
      || c.en.toLowerCase().includes(q)
      || ('the ' + c.en.toLowerCase()).includes(q);
    el.classList.toggle('hidden', !hit);
    if (hit) n++;
  });
  emptyEl.classList.toggle('hidden', n > 0);
  countEl.textContent = `${n} / 52 张 · ${mode === 'sakura' ? '小樱牌' : '库洛牌'}`;
}

/* ============================================================
   详情弹窗（翻面 + 单张转化）
   ============================================================ */
const modalEl = $('#modal');
let modalData = null;
let modalSide = 'clow';   // 当前弹窗展示的是哪一面的卡

function openModal(data) {
  modalData = data;
  modalSide = data.sakuraSrc && (!data.clowSrc || mode === 'sakura') ? 'sakura' : 'clow';
  const cardEl = modalEl.querySelector('.modal-card');
  cardEl.classList.remove('flipped', 'morphing');
  $('#modal-name').textContent = data.cn;
  $('#modal-en').textContent   = data.en;
  $('#modal-face').src = modalSide === 'sakura' ? data.sakuraSrc : data.clowSrc;
  $('#modal-back').src = modalSide === 'sakura' ? S_BACK : C_BACK;
  $('#modal-desc').textContent = modalSide === 'sakura' ? data.descSakura : data.descClow;
  $('#modal-morph').classList.toggle('hidden', !data.morphable);
  updateMorphBtn();
  modalEl.classList.remove('hidden');
  document.body.classList.add('no-scroll');
  $('#modal-close').focus();
}

function closeModal() {
  modalEl.classList.add('hidden');
  document.body.classList.remove('no-scroll');
}

function updateMorphBtn() {
  if (!modalData || !modalData.morphable) return;
  $('#modal-morph').textContent = modalSide === 'sakura'
    ? '✦ 逆转 · 恢复为库洛牌'
    : '✦ 觉醒 · 转化为小樱牌';
}

function morphModal() {
  if (!modalData || !modalData.morphable) return;
  const toSakura = modalSide !== 'sakura';
  const cardEl = modalEl.querySelector('.modal-card');
  const r = cardEl.getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height / 2, { count: 24 });
  cardEl.classList.add('morphing');
  setTimeout(() => {
    modalSide = toSakura ? 'sakura' : 'clow';
    $('#modal-face').src = modalSide === 'sakura' ? modalData.sakuraSrc : modalData.clowSrc;
    $('#modal-back').src = modalSide === 'sakura' ? S_BACK : C_BACK;
    $('#modal-desc').textContent = modalSide === 'sakura' ? modalData.descSakura : modalData.descClow;
    cardEl.classList.remove('morphing');
    updateMorphBtn();
  }, 420);
}

/* ============================================================
   特别篇 · 希望之牌合成仪式
   ============================================================ */
function buildRitual() {
  const wrap = $('#ritual-cards');
  ['nothing', 'unknown'].forEach((key, idx) => {
    const sp = SPECIAL[key];
    const el = document.createElement('div');
    el.className = 'ritual-card';
    el.dataset.key = key;
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', '选中：' + sp.cn);
    el.innerHTML = `
      <img src="${sp.img}" alt="${sp.cn}">
      <span class="ritual-badge">${sp.side === 'clow' ? '库洛 · ' : '小樱 · '}${sp.cn}</span>
      <span class="ritual-check" aria-hidden="true">✦</span>
      <span class="merged-tag" aria-hidden="true">已融合 ✦</span>
      <button class="ritual-detail" title="查看详情" aria-label="查看详情：${sp.cn}">ⓘ</button>`;
    el.addEventListener('click', () => toggleSelect(el, key));
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSelect(el, key); }
    });
    el.querySelector('.ritual-detail').addEventListener('click', e => {
      e.stopPropagation();
      openModal(specialData(sp));
    });
    wrap.appendChild(el);
    // 两张仪式牌之间放一枚「✦」连接符
    if (idx === 0) {
      const plus = document.createElement('span');
      plus.className = 'plus';
      plus.setAttribute('aria-hidden', 'true');
      plus.textContent = '✦';
      wrap.appendChild(plus);
    }
  });
}

function toggleSelect(el, key) {
  if (synthesized) return;   // 已合成后仪式牌不可再选
  if (selected.has(key)) { selected.delete(key); el.classList.remove('selected'); }
  else { selected.add(key); el.classList.add('selected'); }
  $('#synthesize').disabled = selected.size < 2;
}

function synthesize() {
  if (synthesized || ritualOn || selected.size < 2) return;
  synthesized = true;
  save('hope', '1');
  $('#synthesize').disabled = true;
  $('#synthesize').textContent = '希望已诞生 ✦';
  playRitual();
}

/* 仪式动画：两张牌飞向舞台中央 → 闪光 → 希望之牌诞生 */
function playRitual() {
  ritualOn = true;
  const cards = $$('.ritual-card');
  const rect = hopeStage.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  ritualEl.classList.add('merging');
  cards.forEach(el => {
    const r = el.getBoundingClientRect();
    el.style.transform =
      `translate(${cx - (r.left + r.width / 2)}px, ${cy - (r.top + r.height / 2)}px) scale(.45)`;
  });

  setTimeout(() => {
    burst(cx, cy, { count: 30 });
    hopeStage.classList.add('burst');
    cards.forEach(el => el.classList.add('merged'));
  }, 900);

  setTimeout(() => {
    hopeStage.classList.remove('burst');
    revealHope();
    burst(cx, cy, { count: 42, hearts: true });
  }, 1900);

  setTimeout(() => {
    ritualEl.classList.remove('merging');
    cards.forEach(el => { el.style.transform = ''; });
    $('#replay').classList.remove('hidden');
    ritualOn = false;
  }, 2600);
}

function revealHope() {
  hopeStage.classList.add('revealed');
}

function replay() {
  if (!synthesized || ritualOn) return;
  $$('.ritual-card').forEach(el => {
    el.classList.remove('merged', 'selected');
    el.style.transform = '';
  });
  hopeStage.classList.remove('revealed');
  selected.clear();
  $('#replay').classList.add('hidden');
  playRitual();
}

/* ============================================================
   粒子 / 花瓣 / 闪光
   ============================================================ */
function burst(x, y, { count = 22, hearts = false } = {}) {
  const palette = ['#f2c14e', '#f58fb4', '#ffffff'];
  for (let i = 0; i < count; i++) {
    const p = document.createElement('span');
    const kinds = hearts ? ['star', 'heart', 'dot'] : ['star', 'dot', 'dot'];
    const kind = kinds[(Math.random() * kinds.length) | 0];
    p.className = 'particle ' + kind;
    if (kind === 'star')  p.textContent = '✦';
    if (kind === 'heart') p.textContent = '♥';
    if (kind === 'dot')   p.style.background = palette[(Math.random() * palette.length) | 0];
    if (kind !== 'dot')   p.style.fontSize = (9 + Math.random() * 11) + 'px';
    const a = Math.random() * Math.PI * 2;
    const d = 55 + Math.random() * 150;
    p.style.setProperty('--dx', Math.cos(a) * d + 'px');
    p.style.setProperty('--dy', (Math.sin(a) * d - 30) + 'px');
    p.style.left = x + 'px';
    p.style.top  = y + 'px';
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1250);
  }
}

/* 常驻飘落的樱花花瓣 */
function spawnPetals() {
  for (let i = 0; i < 14; i++) {
    const p = document.createElement('i');
    p.className = 'petal' + (Math.random() < .3 ? ' gold' : '');
    const s = 8 + Math.random() * 9;
    p.style.width = s + 'px';
    p.style.height = s + 'px';
    p.style.left = (Math.random() * 100) + 'vw';
    p.style.animationDuration = (9 + Math.random() * 10) + 's';
    p.style.animationDelay = (-Math.random() * 18) + 's';
    document.body.appendChild(p);
  }
}

function flashScreen() {
  const f = document.createElement('div');
  f.className = 'screen-flash';
  document.body.appendChild(f);
  setTimeout(() => f.remove(), 1200);
}

/* ============================================================
   事件绑定与启动
   ============================================================ */
function bindEvents() {
  $$('.mode-btn').forEach(b => b.addEventListener('click', () => morphAll(b.dataset.mode)));
  $('#transform-all').addEventListener('click', () => {
    if (busy) return;
    flashScreen();
    morphAll(mode === 'sakura' ? 'clow' : 'sakura');
  });
  searchEl.addEventListener('input', applyFilter);
  $('#synthesize').addEventListener('click', synthesize);
  $('#replay').addEventListener('click', replay);
  $('#modal-flip').addEventListener('click', () => modalEl.querySelector('.modal-card').classList.toggle('flipped'));
  $('#modal-morph').addEventListener('click', morphModal);
  $('#modal-close').addEventListener('click', closeModal);
  $$('#modal [data-close]').forEach(el => el.addEventListener('click', closeModal));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  $('#hope-flip').addEventListener('click', () => $('#hope-card').classList.toggle('flipped'));
  $('#hope-detail').addEventListener('click', () => openModal(specialData(SPECIAL.hope)));
}

function init() {
  document.body.dataset.mode = mode;
  // 注入三处魔法阵
  $('.hero-ring').innerHTML   = MAGIC_RING;
  $('.magic-overlay').innerHTML = MAGIC_RING;
  $('.stage-ring').innerHTML  = MAGIC_RING;
  buildGrid();
  buildRitual();
  bindEvents();
  spawnPetals();
  updateModeUI();
  // 若此前已合成过希望之牌，直接呈现
  if (synthesized) {
    revealHope();
    $('#synthesize').textContent = '希望已诞生 ✦';
    $('#synthesize').disabled = true;
    $$('.ritual-card').forEach(el => el.classList.add('merged'));
    $('#replay').classList.remove('hidden');
  }
}

init();
