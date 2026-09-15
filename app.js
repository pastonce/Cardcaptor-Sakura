/* ============================================================
   魔卡少女樱 · 库洛牌 × 小樱牌 展览 — 逻辑与交互
   原生实现、无外部依赖，可直接以 file:// 双击打开
   ============================================================ */
'use strict';

/* ---------- 常量 ---------- */
const ASSETS     = './asserts/';                       // 所有卡图统一放在 asserts 目录下
const CLOW_DIR   = ASSETS + 'clow/';
const SAKURA_DIR = ASSETS + 'sakura/';
const C_BACK     = ASSETS + 'ClowCardSideB.jpeg';    // 库洛牌统一卡背
const S_BACK     = ASSETS + 'SakuraCardSideB.jpeg';  // 小樱牌统一卡背

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

/* ---------- 52 张一一对应的卡牌（按动画中的收服顺序） ---------- */
const CARDS = [
  { cn: '风', en: 'Windy' },   { cn: '翔', en: 'Fly' },      { cn: '影', en: 'Shadow' },
  { cn: '水', en: 'Watery' },  { cn: '雨', en: 'Rain' },     { cn: '树', en: 'Wood' },
  { cn: '跳', en: 'Jump' },    { cn: '幻', en: 'Illusion' }, { cn: '静', en: 'Silent' },
  { cn: '雷', en: 'Thunder' }, { cn: '剑', en: 'Sword' },    { cn: '花', en: 'Flower' },
  { cn: '盾', en: 'Shield' },  { cn: '时', en: 'Time' },     { cn: '力', en: 'Power' },
  { cn: '雾', en: 'Mist' },    { cn: '岚', en: 'Storm' },    { cn: '浮', en: 'Float' },
  { cn: '消', en: 'Erase' },   { cn: '灯', en: 'Glow' },     { cn: '移', en: 'Move' },
  { cn: '斗', en: 'Fight' },   { cn: '轮', en: 'Loop' },     { cn: '眠', en: 'Sleep' },
  { cn: '歌', en: 'Song' },    { cn: '小', en: 'Little' },   { cn: '镜', en: 'Mirror' },
  { cn: '迷', en: 'Maze' },    { cn: '戻', en: 'Return' },   { cn: '击', en: 'Shot' },
  { cn: '甘', en: 'Sweet' },   { cn: '驱', en: 'Dash' },     { cn: '大', en: 'Big' },
  { cn: '创', en: 'Create' },  { cn: '替', en: 'Change' },   { cn: '冻', en: 'Freeze' },
  { cn: '火', en: 'Firey' },   { cn: '雪', en: 'Snow' },     { cn: '声', en: 'Voice' },
  { cn: '锭', en: 'Lock' },    { cn: '云', en: 'Cloud' },    { cn: '梦', en: 'Dream' },
  { cn: '砂', en: 'Sand' },    { cn: '光', en: 'Light' },    { cn: '暗', en: 'Dark' },
  { cn: '双', en: 'Twin' },    { cn: '地', en: 'Earthy' },   { cn: '秤', en: 'Libra' },
  { cn: '波', en: 'Wave' },    { cn: '泡', en: 'Bubbles' },  { cn: '矢', en: 'Arrow' },
  { cn: '抜', en: 'Through' },
];

/* ---------- 各牌「象征」释义 ----------
   资料整理自萌娘百科《库洛牌》条目（CC BY-NC-SA），按英文名索引 */
const SYMBOLS = {
  Windy:     '前进、充实、期待的暗示³',
  Fly:       '挑战飞跃的机会',
  Shadow:    '未知的部分，问题的发生与消除',
  Watery:    '协调性，打开他人心扉的力量',
  Rain:      '最后终究会好转',
  Wood:      '象征各自的成长与发展⁴',
  Jump:      '实力发挥、最佳状态',
  Illusion:  '想要从现实中逃离的欲望',
  Silent:    '思虑深远、充电期',
  Thunder:   '若能不迷失自己，便能有幸运的发展',
  Sword:     '真实的探求、报偿，有时是破坏力',
  Flower:    '成果、报酬、目标达标率很高的时期',
  Shield:    '保护，为了保持调和的防卫手段',
  Time:      '各种体验的磨练、自立',
  Power:     '愿望的实现、扩展',
  Mist:      '判定事态，决定出方向',
  Storm:     '激烈的感情，欲求不满的消解',
  Float:     '由束缚中解放、自由',
  Erase:     '运气的停滞，等一下的警告',
  Glow:      '幸运的预兆',
  Move:      '注意浮躁的行动与发言',
  Fight:     '大转机的前兆',
  Loop:      '连结、更上一层楼的机会',
  Sleep:     '休息、平稳的心境',
  Song:      '欢喜、调和、治疗的力量',
  Little:    '虽然小,却也是有意义的蜕变期',
  Mirror:    '深切看清自己的时期',
  Maze:      '丧失自信、混乱',
  Return:    '败者复活，永不放弃',
  Shot:      '锁定目标',
  Sweet:     '新恋情、受欢迎、依赖心的表现',
  Dash:      '以瞬间爆发力得到胜利，与自己的战斗',
  Big:       '极大的可能性与能力，知识欲的提高',
  Create:    '丰富的感受性感受力的开花结果',
  Change:    '心情的切换、浪费',
  Freeze:    '基础能力的成型，我行我素也OK',
  Firey:     '强烈的信条信念，突破难关',
  Snow:      '崭新的起点、和平、纯净',
  Voice:     '想成为朋友，和睦相处的心情',
  Lock:      '智能、英知。对真实、内心的察觉',
  Cloud:     '你的决断将造成决定性的结果',
  Dream:     '了解自己的机会，潜在意识的发展期',
  Sand:      '不要害怕改变，加以挑战',
  Light:     '由自己来主导对未来的展望',
  Dark:      '照旧、顺着自然的发展前进¹',
  Twin:      '最佳搭挡的出现',
  Earthy:    '生命的发源地，努力与包容性的象征²',
  Libra:     '对人生、行动、思考的比重调整',
  Wave:      '柔软的姿态为你带来好运气',
  Bubbles:   '感情的净化，由恶性循环脱离的时机',
  Arrow:     '能量的高涨、积极性',
  Through:   '没有预期到的事态的好转',
};

/* ---------- 「Past 有话说」----------
   每张牌在详情里的一句话。改哪张就改哪一行后面的字符串。
   · 52 张普通牌按英文名索引（行尾注释是对应的中文名）
   · 三张特殊牌用「特殊:中文名」
   现在全是同一句占位，等你自己填 —— 填完刷新即可，无需改别处 */
const PAST_NOTES = {
  /* ---------- 52 张普通牌 ---------- */
  Windy:    '🌸开局一张“风”，装备全靠打（别问装备是怎么被吹走的',   // 风
  Fly:      '🌸有了这张牌小樱才能随时起飞，那我不禁陷入沉思，鸟为什么会飞？',   // 翔
  Shadow:   '🌸捕风捉影，怕黑吗？！那就向灯呼救吧！（静牌の天敌）',   // 影
  Watery:   '🌸区区水牌，被桃矢手撕，所谓水善利万物而不争...气',   // 水
  Rain:     '🌸被水牌的大手压力了还哭唧唧，调皮又可爱，她只是想见萧敬腾——',   // 雨
  Wood:     '🌸她甚至是自己变回了牌我哭死，美丽又温柔，她只是想晒个太阳——',   // 树
  Jump:     '🌸“地心引力，那是什么？”不过叫声很有喜感，而且自己摔了，整段垮掉',   // 跳
  Illusion: '🌸据传，卖火柴的小女孩就曾遇到这张牌...',   // 幻
  Silent:   '🌸---------- The Shy ----------',   // 静
  Thunder:  '🌸雷电法王！小樱小狼第一次配合收牌，那么问题来了应该电谁？',   // 雷
  Sword:    '🌸帅 Sword 帅！这是最强之剑任何盾都无法抵挡',   // 剑
  Flower:   '🌸对方拒绝被封印并邀请你跳了一支舞，美哭了（能变出花田的魔法）',   // 花
  Shield:   '🌸强 Shield 强！这是最强之盾任何剑都无法击破（甚至抵挡时间',   // 盾
  Time:     '☯️旅行者你醒啦，快去跟迪娜泽黛会合吧~（护妻专用牌说是，不过是不是也能时停play...？',   // 时
  Power:    '🌸怪力萝莉，可惜被坏小孩做局了（悲',   // 力
  Mist:     '🌸看起来可能大概也许是硫酸雾x',   // 雾
  Storm:    '☯️最速被收服の纪录保持者',   // 岚
  Float:    '🌸F浮 = ρ液 × V排 × g',   // 浮
  Erase:    '◼揭示◼◼之◼时◼◼◼◼◼还未◼到◼◼',   // 消
  Glow:     '◼揭示◼◼之◼时◼◼◼◼◼还未◼到◼◼',   // 灯
  Move:     '◼揭示◼◼之◼时◼◼◼◼◼还未◼到◼◼',   // 移
  Fight:    '◼揭示◼◼之◼时◼◼◼◼◼还未◼到◼◼',   // 斗
  Loop:     '◼揭示◼◼之◼时◼◼◼◼◼还未◼到◼◼',   // 轮
  Sleep:    '◼揭示◼◼之◼时◼◼◼◼◼还未◼到◼◼',   // 眠
  Song:     '◼揭示◼◼之◼时◼◼◼◼◼还未◼到◼◼',   // 歌
  Little:   '◼揭示◼◼之◼时◼◼◼◼◼还未◼到◼◼',   // 小
  Mirror:   '◼揭示◼◼之◼时◼◼◼◼◼还未◼到◼◼',   // 镜
  Maze:     '◼揭示◼◼之◼时◼◼◼◼◼还未◼到◼◼',   // 迷
  Return:   '◼揭示◼◼之◼时◼◼◼◼◼还未◼到◼◼',   // 戻
  Shot:     '◼揭示◼◼之◼时◼◼◼◼◼还未◼到◼◼',   // 击
  Sweet:    '◼揭示◼◼之◼时◼◼◼◼◼还未◼到◼◼',   // 甘
  Dash:     '◼揭示◼◼之◼时◼◼◼◼◼还未◼到◼◼',   // 驱
  Big:      '◼揭示◼◼之◼时◼◼◼◼◼还未◼到◼◼',   // 大
  Create:   '◼揭示◼◼之◼时◼◼◼◼◼还未◼到◼◼',   // 创
  Change:   '◼揭示◼◼之◼时◼◼◼◼◼还未◼到◼◼',   // 替
  Freeze:   '◼揭示◼◼之◼时◼◼◼◼◼还未◼到◼◼',   // 冻
  Firey:    '◼揭示◼◼之◼时◼◼◼◼◼还未◼到◼◼',   // 火
  Snow:     '◼揭示◼◼之◼时◼◼◼◼◼还未◼到◼◼',   // 雪
  Voice:    '◼揭示◼◼之◼时◼◼◼◼◼还未◼到◼◼',   // 声
  Lock:     '◼揭示◼◼之◼时◼◼◼◼◼还未◼到◼◼',   // 锭
  Cloud:    '◼揭示◼◼之◼时◼◼◼◼◼还未◼到◼◼',   // 云
  Dream:    '◼揭示◼◼之◼时◼◼◼◼◼还未◼到◼◼',   // 梦
  Sand:     '◼揭示◼◼之◼时◼◼◼◼◼还未◼到◼◼',   // 砂
  Light:    '◼揭示◼◼之◼时◼◼◼◼◼还未◼到◼◼',   // 光
  Dark:     '◼揭示◼◼之◼时◼◼◼◼◼还未◼到◼◼',   // 暗
  Twin:     '◼揭示◼◼之◼时◼◼◼◼◼还未◼到◼◼',   // 双
  Earthy:   '◼揭示◼◼之◼时◼◼◼◼◼还未◼到◼◼',   // 地
  Libra:    '◼揭示◼◼之◼时◼◼◼◼◼还未◼到◼◼',   // 秤
  Wave:     '◼揭示◼◼之◼时◼◼◼◼◼还未◼到◼◼',   // 波
  Bubbles:  '◼揭示◼◼之◼时◼◼◼◼◼还未◼到◼◼',   // 泡
  Arrow:    '◼揭示◼◼之◼时◼◼◼◼◼还未◼到◼◼',   // 矢
  Through:  '◼揭示◼◼之◼时◼◼◼◼◼还未◼到◼◼',   // 抜

  /* ---------- 三张特殊牌 ---------- */
  '特殊:无':   '◼揭示◼◼之◼时◼◼◼◼◼还未◼到◼◼',   // 无
  '特殊:爱':   '◼揭示◼◼之◼时◼◼◼◼◼还未◼到◼◼',   // 爱
  '特殊:希望':  '◼揭示◼◼之◼时◼◼◼◼◼还未◼到◼◼',   // 希望
};

/* ---------- 三张特殊牌 ----------
   无 与 爱 默认藏在图鉴之外，只有在对应当前卡组中「精确搜索」才会现身。
   两张都拖进卡槽 → 合成最重要的「希望」。 */
const SPECIAL = {
  nothing: {
    key: 'nothing', cn: '无', en: 'The Nothing', img: ASSETS + 'CNothing.jpeg', side: 'clow',
    frame: 'clow',                                  // 描边固定为库洛黄
    terms: ['无', 'the nothing', 'nothing'],
    desc: '尚未写上名字的库洛牌，安静地等待着被唤醒。',
  },
  love: {
    key: 'love', cn: '爱', en: 'The Love', img: ASSETS + 'SUnknown.jpeg', side: 'sakura',
    frame: 'sakura',                                // 描边固定为小樱粉
    terms: ['爱', '心', 'the love', 'the heart', 'love', 'heart'],
    desc: '由小樱的心意与泪水孕育而生的无名之牌。',
  },
  hope: {
    key: 'hope', cn: '希望', en: 'The Hope', img: ASSETS + 'SHope.jpeg', side: 'sakura',
    frame: 'hope',                                  // 描边固定为希望红
    desc: '「无」与「爱」合而为一，由最深的感情诞生的、最重要的一张牌。',
  },
};
const SPECIAL_ORDER = ['nothing', 'love'];   // 需要凑齐的两张

/* 合成前后，希望牌的两种呈现：未诞生时它只是一张「未知」的牌 */
const HOPE_FACE = {
  locked: {
    img: ASSETS + 'SHope-uncreated.jpeg', cn: '◼◼', en: 'The ◼◼◼◼',
    desc: '◼◼◼◼◼◼◼◼◼◼', tag: '✦ ◼◼◼◼◼◼ ✦',
    title: '✦ ◼◼之牌 ✦', motto: '◼◼',
  },
  revealed: {
    img: ASSETS + 'SHope.jpeg', cn: '希望', en: 'The Hope',
    desc: '由最深的感情诞生之牌', tag: '✦ 最重要的一张 ✦',
    title: '✦ 希望之牌 ✦', motto: '希望',
  },
};

/* ---------- 工具 ---------- */
const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const modeName = () => (mode === 'sakura' ? '小樱牌' : '库洛牌');

function stored(k) { try { return localStorage.getItem('ccs_' + k); } catch (e) { return null; } }
function save(k, v)  { try { localStorage.setItem('ccs_' + k, v); } catch (e) {} }

/* ---------- 状态 ---------- */
let mode        = stored('mode') === 'sakura' ? 'sakura' : 'clow';  // 当前卡组
let synthesized = false;    // 希望之牌是否已合成 —— 刻意不持久化，每次进入/刷新都从未知态开始
let busy        = false;                     // 整面转化动画进行中
let combining   = false;                     // 合成动画进行中
let suppressClickUntil = 0;                  // 拖拽结束后抑制误触发的点击
let secretHeard = false;                     // 当前是否已处于「密语命中」状态

/* ---------- 元素 ---------- */
const gridEl    = $('#grid');
const searchEl  = $('#search');
const countEl   = $('#count');
const emptyEl   = $('#empty');
const toastEl   = $('#toast');
const hopeStage = $('#hope-stage');

/* ---------- 翻面 ----------
   每次都从当前角度再加 180°，于是「正面→背面」和「背面→正面」朝同一方向转。
   若只靠 .flipped 类在 0/180 之间来回切，两次的转向会正好相反。
   类本身仍保留 —— 卡号、指针样式等还靠它判断正反面 */
function flipCard(el, dir) {
  el._flips = (el._flips || 0) + (dir === -1 ? -1 : 1);   // 传 -1 即逆时针
  el.style.setProperty('--flip', (el._flips * 180) + 'deg');
  el.classList.toggle('flipped', Math.abs(el._flips % 2) === 1);
}
function resetFlip(el) {
  el._flips = 0;
  el.style.removeProperty('--flip');
  el.classList.remove('flipped');
}

/* ---------- 两侧抽屉 ---------- */
const drawers = { left: $('#drawer-left'), right: $('#drawer-right') };
const EDGE_ZONE = 120;   // 拖牌时距屏幕边缘多近就自动展开抽屉

function setDrawer(side, open) {
  const el = drawers[side];
  if (!el) return;
  el.classList.toggle('open', open);
  const tab = el.querySelector('.drawer-tab');
  if (tab) tab.setAttribute('aria-expanded', open ? 'true' : 'false');
  // 诗篇抽屉一拉开就重放竖排文字的浮现，并把光标送进密码框（已解锁则都不做）
  if (side === 'right' && open) { riseRiddle(); focusLock(); }
}
const isDrawerOpen = side => !!drawers[side] && drawers[side].classList.contains('open');
const autoOpened = { left: false, right: false };   // 记录「是拖牌顺手拉开的」，便于离开时收回

function toggleDrawer(side) {
  autoOpened[side] = false;                         // 手动操作过，就不再自动收回
  setDrawer(side, !isDrawerOpen(side));
}

/* 拖牌时抽屉的两段判定，距离刻意不同：
   展开 —— 只要碰到边缘把手那点宽度（TAB_ZONE）就弹出，不必先划很远；
   收回 —— 要等指针离开抽屉展开后的整个宽度才收回，否则牌刚放进去、
          手还没移开就会被判定为「离开」，抽屉立刻缩回去。 */
const TAB_ZONE = 46;   // 与 .drawer 的 --tab-w 一致

function edgeDrawers(x) {
  const W = window.innerWidth;
  const openL = x < TAB_ZONE;                                  // 触发展开
  const openR = x > W - TAB_ZONE;
  const holdL = x < (drawers.left.offsetWidth || EDGE_ZONE);   // 维持展开
  const holdR = x > W - (drawers.right.offsetWidth || EDGE_ZONE);

  for (const [side, want, hold] of [['left', openL, holdL], ['right', openR, holdR]]) {
    if (want) {
      setDrawer(side, true);
      autoOpened[side] = true;
    } else if (autoOpened[side] && !hold) {
      setDrawer(side, false);
      autoOpened[side] = false;
    }
    // 把手附近亮起，或指针已经在展开的抽屉上时持续亮着
    drawers[side].classList.toggle('near', want || (isDrawerOpen(side) && hold));
  }
}
function clearEdgeDrawers() {
  drawers.left.classList.remove('near');
  drawers.right.classList.remove('near');
}

/* ---------- 详情数据 ---------- */
function specialData(sp) {
  return {
    cn: sp.cn, en: sp.en, morphable: false, frame: sp.frame,
    clowSrc:   sp.side === 'clow'   ? sp.img : null,
    sakuraSrc: sp.side === 'sakura' ? sp.img : null,
    descClow: sp.desc, descSakura: sp.desc,
    sym: '',                          // 三张特殊牌不在该资料的收录范围内
    past: PAST_NOTES['特殊:' + sp.cn] || '',
  };
}
function pairData(card) {
  return {
    cn: card.cn, en: 'The ' + card.en, morphable: true,
    clowSrc:   CLOW_DIR + 'C' + card.en + '.jpeg',
    sakuraSrc: SAKURA_DIR + 'S' + card.en + '.jpeg',
    descClow:   '封印着古老力量的库洛牌，安静地沉睡着。',
    descSakura: '由小樱重新唤醒的小樱牌，焕发着新的光芒。',
    sym: SYMBOLS[card.en] || '',
    past: PAST_NOTES[card.en] || '',
  };
}

/* ============================================================
   图鉴网格
   ============================================================ */
function buildGrid() {
  const frag = document.createDocumentFragment();

  CARDS.forEach((card, i) => {
    const clowSrc   = CLOW_DIR + 'C' + card.en + '.jpeg';
    const sakuraSrc = SAKURA_DIR + 'S' + card.en + '.jpeg';
    const el = document.createElement('article');
    el.className = 'card';
    el._card = card;
    el._cn = card.cn;
    el._en = 'The ' + card.en;
    el._special = null;
    el.innerHTML = `
      <button class="flip-zone" aria-label="翻面：${card.cn}（The ${card.en}）">
        <div class="flip-inner">
          <div class="flip-face front">
            <img src="${mode === 'sakura' ? sakuraSrc : clowSrc}" data-clow="${clowSrc}" data-sakura="${sakuraSrc}" alt="${card.cn}" loading="lazy">
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
    const zone = el.querySelector('.flip-zone');
    zone.addEventListener('click', () => {
      if (performance.now() < suppressClickUntil) return;
      flipCard(el);
    });
    el.querySelector('.detail-btn').addEventListener('click', () => openModal(pairData(card)));
    attachDrag(zone);
    frag.appendChild(el);
  });

  /* 两张隐藏之牌：默认不显示，只在搜索时现身 */
  SPECIAL_ORDER.forEach(key => {
    const sp = SPECIAL[key];
    const el = document.createElement('article');
    el.className = 'card special hidden framed frame-' + sp.frame;   // 描边色随牌固定，不随主题切换
    el._card = null;
    el._cn = sp.cn;
    el._en = sp.en;
    el._special = key;
    el._frame = sp.frame;
    el.innerHTML = `
      <button class="flip-zone" aria-label="翻面：${sp.cn}（${sp.en}）">
        <div class="flip-inner">
          <div class="flip-face front"><img src="${sp.img}" alt="${sp.cn}"></div>
          <div class="flip-face back"><img src="${sp.side === 'clow' ? C_BACK : S_BACK}" alt="卡背"></div>
        </div>
        <span class="card-no">✦</span>
      </button>
      <div class="card-meta">
        <span class="cn">${sp.cn}</span>
        <span class="en">${sp.en}</span>
        <button class="detail-btn" title="查看详情" aria-label="查看详情：${sp.cn}">ⓘ</button>
      </div>`;
    const zone = el.querySelector('.flip-zone');
    zone.addEventListener('click', () => {
      if (performance.now() < suppressClickUntil) return;
      flipCard(el);
    });
    el.querySelector('.detail-btn').addEventListener('click', () => openModal(specialData(sp)));
    attachDrag(zone);
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
  document.body.classList.toggle('to-sakura', toSakura);   // 转化波纹换成小樱粉
  const items    = $$('#grid .card').filter(el => !el._special);
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

  setTimeout(() => {
    busy = false;
    document.body.classList.remove('to-sakura');   // 波纹配色只在转化期间生效
  }, visible.length * step + 1000);
}

function updateModeUI() {
  $('#gallery-title').textContent = modeName() + ' · 全 52 张';
  $('#transform-all').textContent = mode === 'sakura'
    ? '✦ 封印 · 恢复为库洛牌 ✦'
    : '✦ 收服 · 转化为小樱牌 ✦';
  applyFilter();   // 卡组变了，隐藏之牌的可见性要重新判定
}

/* 精确搜索命中哪张隐藏之牌（且必须处在它所属的卡组中） */
function matchedSpecial(q) {
  if (!q) return null;
  for (const key of SPECIAL_ORDER) {
    const sp = SPECIAL[key];
    if (sp.side !== mode) continue;
    if (sp.terms.indexOf(q) !== -1) return key;
  }
  return null;
}

function applyFilter() {
  const raw = searchEl.value.trim();
  const q = raw.toLowerCase();
  const hidden = matchedSpecial(q);
  let n = 0;

  // 密语：一字不差才作数，命中后只留四张牌，并按「暗 → 地 → 风 → 树」的次序排开
  if (POEM_SECRETS.indexOf(raw) !== -1) {
    const order = POEM_TARGETS.map(t => t.id.replace('en:', ''));
    gridEl.querySelectorAll('.card').forEach(el => {
      const i = el._special ? -1 : order.indexOf(el._en);
      el.classList.toggle('hidden', i === -1);
      el.style.order = i === -1 ? '' : i;
      if (i !== -1) n++;
    });
    countEl.textContent = `${n} / ${n} 张 · 密语`;
    countEl.classList.add('revealed');
    emptyEl.classList.add('hidden');
    if (!secretHeard) toast('✦ 我听到了哦 ✦');
    secretHeard = true;
    return;
  }
  secretHeard = false;

  gridEl.querySelectorAll('.card').forEach(el => {
    el.style.order = '';                     // 清掉密语留下的排序
    if (el._special) {                       // 隐藏之牌：只有被搜索命中才现身
      const hit = el._special === hidden;
      el.classList.toggle('hidden', !hit);
      if (hit) n++;
      return;
    }
    const c = el._card;
    const hit = !q || c.cn.includes(q)
      || c.en.toLowerCase().includes(q)
      || ('the ' + c.en.toLowerCase()).includes(q);
    el.classList.toggle('hidden', !hit);
    if (hit) n++;
  });

  const total = 52 + (hidden ? 1 : 0);
  countEl.textContent = `${n} / ${total} 张 · ${modeName()}`;
  countEl.classList.toggle('revealed', !!hidden);
  emptyEl.classList.toggle('hidden', n > 0);
}

/* ============================================================
   拖拽：任意卡牌都可拖到合成台的卡槽
   ============================================================ */
const DRAG_THRESHOLD = 8;
let pending = null;   // 按下但还没开始拖
let active  = null;   // 正在拖

function payloadOf(cardEl) {
  const front = cardEl.querySelector('.flip-face.front img');
  return { cn: cardEl._cn, en: cardEl._en, img: front.getAttribute('src'),
           special: cardEl._special, frame: cardEl._frame || null };
}

/* cardElOverride 用于非图鉴卡片（如合成台上的希望牌） */
function attachDrag(zoneEl, cardElOverride) {
  zoneEl.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.target.closest('.detail-btn')) return;
    const cardEl = cardElOverride || zoneEl.closest('.card');
    if (!cardEl) return;
    if (cardEl.classList.contains('locked')) return;   // 未诞生的牌不可拖
    pending = { cardEl, x: e.clientX, y: e.clientY,
                rect: zoneEl.getBoundingClientRect(), payload: payloadOf(cardEl) };
    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancel);
  });
}

function onPointerMove(e) {
  if (!pending) return;
  if (!active) {
    if (Math.hypot(e.clientX - pending.x, e.clientY - pending.y) < DRAG_THRESHOLD) return;
    startDrag();
  }
  e.preventDefault();
  moveGhost(e.clientX, e.clientY);
  autoScroll(e.clientY);
  hoverSlot(e.clientX, e.clientY);
  edgeDrawers(e.clientX);
}

function startDrag() {
  const { payload, rect, x, y } = pending;
  const ghost = document.createElement('div');
  ghost.className = 'drag-ghost' + (payload.frame ? ' frame-' + payload.frame : '');
  ghost.style.width  = rect.width + 'px';
  ghost.style.height = rect.height + 'px';
  ghost.innerHTML = `<img src="${payload.img}" alt="">`;
  document.body.appendChild(ghost);

  active = { payload, ghost, offX: x - rect.left, offY: y - rect.top, srcEl: pending.cardEl };
  // 把希望牌从左侧抽屉里拖走时，顺手收起抽屉让出视野
  if (active.srcEl.id === 'hope-card') { setDrawer('left', false); autoOpened.left = false; }
  active.srcEl.classList.add('drag-src');
  document.body.classList.add('dragging');
  moveGhost(x, y);
}

function moveGhost(x, y) {
  active.ghost.style.transform =
    `translate3d(${x - active.offX}px, ${y - active.offY}px, 0) rotate(3deg) scale(1.05)`;
}

/* 拖到视口上下边缘时自动滚动，方便从图鉴拖到页面下方 */
function autoScroll(y) {
  const margin = 90, speed = 15;
  if (y < margin) {
    window.scrollBy(0, -speed * (1 - y / margin));
  } else if (y > window.innerHeight - margin) {
    window.scrollBy(0, speed * (1 - (window.innerHeight - y) / margin));
  }
}

/* 判定外圈的宽度，与 CSS 里的 --hit 同源（只读一次，避免每帧重算样式） */
let hitPadCache = null;
function hitPad() {
  if (hitPadCache === null) {
    hitPadCache = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--hit')
    ) || 12;
  }
  return hitPadCache;
}

/* 落点判定：视觉框内优先；落在框外的判定外圈里时，取离中心最近的那个。
   相邻卡槽的外圈可能重叠（方位槽与阵心只隔 7px），取最近才不会误判 */
function slotAt(x, y) {
  const pad = hitPad();
  let best = null, bestD = Infinity;
  for (const s of $$('.slot')) {
    const r = s.getBoundingClientRect();
    if (x < r.left - pad || x > r.right + pad || y < r.top - pad || y > r.bottom + pad) continue;
    const inside = x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    const d = inside ? -1
                     : Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2));
    if (d < bestD) { bestD = d; best = s; }
  }
  return best;
}

function hoverSlot(x, y) {
  const target = slotAt(x, y);
  $$('.slot').forEach(s => s.classList.toggle('drag-over', s === target));
}

function onPointerUp(e) {
  if (active) {
    const slot = slotAt(e.clientX, e.clientY);
    if (slot) {
      active.ghost.remove();
      // 落到哪个投放区，就交给哪个区的规则
      if (slot.classList.contains('poem-slot')) handlePoemDrop(active.payload, slot);
      else                                      handleDrop(active.payload, slot);
    } else {
      returnGhost();
    }
    suppressClickUntil = performance.now() + 350;
  }
  cleanupDrag();
}

function onPointerCancel() {
  if (active) returnGhost();
  cleanupDrag();
}

function returnGhost() {
  const { ghost } = active;
  const r = active.srcEl.getBoundingClientRect();
  ghost.style.transform = `translate3d(${r.left}px, ${r.top}px, 0) scale(.9)`;
  ghost.classList.add('returning');
  setTimeout(() => ghost.remove(), 320);
}

function cleanupDrag() {
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerup', onPointerUp);
  window.removeEventListener('pointercancel', onPointerCancel);
  $$('.slot').forEach(s => s.classList.remove('drag-over'));
  clearEdgeDrawers();
  if (active) {
    active.srcEl.classList.remove('drag-src');
    document.body.classList.remove('dragging');
  }
  pending = null;
  active = null;
}

/* ============================================================
   合成台：两张牌都放对 → 希望诞生
   ============================================================ */
function placedKeys() {
  return $$('#drop-zone .slot')
    .filter(s => s.dataset.filled === '1')
    .map(s => s._payload.special);
}

function handleDrop(payload, slotEl) {
  if (combining) return;
  if (slotEl.dataset.filled === '1') { rejectSlot(slotEl, '这个卡槽已经有牌了'); return; }
  // 只收「无」与「爱」。不能只判 payload.special 是否存在 ——
  // 希望牌同样是特殊牌，那样会让它也能塞进这两个卡槽
  if (SPECIAL_ORDER.indexOf(payload.special) === -1) {
    rejectSlot(slotEl, '这不是仪式需要的牌…'); return;
  }
  if (placedKeys().indexOf(payload.special) !== -1) { rejectSlot(slotEl, '这张牌已经放上去了'); return; }

  placeCard(slotEl, payload);
  slotEl.classList.add('accepted');
  setTimeout(() => slotEl.classList.remove('accepted'), 600);

  const r = slotEl.getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height / 2, { count: 14 });

  if (placedKeys().length === 2) combine();   // 两张都放对，自动开始合成
}

function rejectSlot(slotEl, msg) {
  slotEl.classList.add('reject');
  setTimeout(() => slotEl.classList.remove('reject'), 520);
  toast(msg);
}

function placeCard(slotEl, payload) {
  slotEl.dataset.filled = '1';
  slotEl.classList.add('filled');
  slotEl._payload = payload;
  const div = document.createElement('div');
  div.className = 'slot-card' + (payload.frame ? ' frame-' + payload.frame : '');   // 落槽后保留描边色
  div.innerHTML = `<img src="${payload.img}" alt="${payload.cn}">`;
  slotEl.appendChild(div);
}

function clearSlots() {
  $$('#drop-zone .slot').forEach(s => {
    const card = s.querySelector('.slot-card');
    if (card) card.remove();
    delete s.dataset.filled;
    delete s._payload;
    s.classList.remove('filled', 'accepted');
  });
}

/* 合成动画：卡槽中的两张牌飞向希望之牌 → 闪光 → 希望现身 */
function combine() {
  combining = true;
  const hopeCard = $('#hope-card');
  const hr = hopeCard.getBoundingClientRect();
  const cx = hr.left + hr.width / 2;
  const cy = hr.top + hr.height / 2;

  $$('#drop-zone .slot-card').forEach((el, i) => {
    const r = el.getBoundingClientRect();
    setTimeout(() => {
      el.style.transform =
        `translate(${cx - (r.left + r.width / 2)}px, ${cy - (r.top + r.height / 2)}px)`
        + ` scale(.25) rotate(${i ? 24 : -24}deg)`;
      el.style.opacity = '0';
    }, 260 + i * 190);
  });

  setTimeout(() => {
    burst(cx, cy, { count: 38, hearts: true });
    flashScreen(false, $('#hope-card'));     // 以希望牌为中心炸开
  }, 900);

  setTimeout(() => {
    clearSlots();
    // try/finally：哪怕这里出任何差错，也不能把 combining 卡在 true 上让拖牌彻底失效
    try {
      if (!synthesized) {
        synthesized = true;
        revealHope();
      } else {
        pulseHope();     // 已合成过：再演一次合成，希望之牌亮起回应
      }
      applyHopeState();
      hopeStage.classList.add('burst');
      setTimeout(() => hopeStage.classList.remove('burst'), 1000);
    } finally {
      combining = false;
    }
  }, 1150);
}

function revealHope() { hopeStage.classList.add('revealed'); }

function pulseHope() {
  const el = $('#hope-card');
  el.classList.remove('pulse');
  void el.offsetWidth;      // 重排以便重复触发动画
  el.classList.add('pulse');
  setTimeout(() => el.classList.remove('pulse'), 1100);
}

/* 按「是否已合成」刷新希望牌的一切：
   未合成 → 换成未诞生图并压暗、名字叫「未知 / The Null」、不可翻面、不可查看详情 */
function applyHopeState() {
  const s = synthesized ? HOPE_FACE.revealed : HOPE_FACE.locked;
  const face = $('#hope-face');
  face.src = s.img;
  face.alt = s.cn;
  $('#hope-name').textContent = s.cn;
  $('#hope-en').textContent   = s.en;
  $('#hope-desc').textContent = s.desc;
  $('#hope-tag').textContent  = s.tag;
  $('#tab-left-text').textContent = s.title;   // 抽屉把手就是它的名字
  $('#motto-name').textContent    = s.motto;   // 题词里的关键字一并遮蔽
  $('#hope-card').classList.toggle('locked', !synthesized);
  $('#hope-flip').disabled = !synthesized;
  $('#hope-flip').setAttribute('aria-label', synthesized ? '翻面：希望' : '它还未诞生');
  $('#hope-detail').classList.toggle('hidden', !synthesized);
  // 让希望牌也能被拖走（拖拽系统按这些字段取用卡牌信息）
  const hc = $('#hope-card');
  hc._cn = s.cn;
  hc._en = s.en;
  hc._special = synthesized ? 'hope' : null;
  hc._frame = 'hope';
}

/* ============================================================
   你手捧希望而来：五张牌各归其位，诗才完整
   ============================================================ */
/* blocks = 该句英文去掉空格与标点后的字母数，用作初始遮挡的方块数 */
const POEM_TARGETS = [
  { key: 'night',  id: 'en:The Dark',   word: '夜晚', rest: '潮湿',   blocks: 15 },  // The night is moist
  { key: 'ground', id: 'en:The Earthy', word: '地',   rest: '面潮湿', blocks: 12 },  // the ground wet
  { key: 'air',    id: 'en:The Windy',  word: '空气', rest: '寂静',   blocks: 8  },  // air still
  { key: 'wood',   id: 'en:The Wood',   word: '树',   rest: '林沉默', blocks: 11 },  // trees silent,
];
/* 题目同样先整体遮蔽；「希望」和诗中的关键字一样，由希望牌点亮 */
const POEM_TITLE = { word: '希望', pre: '你手捧', preBlocks: 3, post: '而来', postBlocks: 2 };
/* 搜索框里的密语：一字不差地输入，即按诗里的次序唤来那四张牌 */
const POEM_SECRETS = ['今夜我爱你', '你手捧希望而来'];
/* 右侧抽屉把手：揭晓前是五个方块，揭晓后就是那句诗 */
const POEM_TAB = { locked: '✦◼◼◼◼◼✦', revealed: '✦今夜我爱你✦' };
/* 逐句揭晓的顺序：先题目，再四句（与魔法阵上卡牌的次序一致） */
const POEM_PART_KEYS = ['title', ...POEM_TARGETS.map(t => t.key)];
const POEM_CENTER_KEY = 'hope';
const POEM_TOTAL = POEM_TARGETS.length + 1;                 // 四方向 + 阵心
const poemDone = new Set();

const payloadId = p => (p.special ? 'special:' + p.special : 'en:' + p.en);
const maskOf = n => '◼'.repeat(n);
/* data-poem 在整首诗里唯一，题目用 .poem-title、诗句用 .poem-line，
   所以这里不能限定类名，否则取题目会落空 */
const poemLine = key => document.querySelector('[data-poem="' + key + '"]');

/* 初始状态：整首诗只剩方块，认不出是哪一首。
   关键字自己也先占着等量的方块，揭开时是「顶掉」而不是「插在前面」 */
function buildPoem() {
  POEM_TARGETS.forEach(t => {
    const line = poemLine(t.key);
    line.querySelector('.poem-key').textContent  = maskOf(t.word.length);
    line.querySelector('.poem-mask').textContent = maskOf(t.blocks - t.word.length);
  });
  const title = poemLine('title');
  title.querySelector('.poem-key').textContent         = maskOf(POEM_TITLE.word.length);
  title.querySelector('[data-part="pre"]').textContent  = maskOf(POEM_TITLE.preBlocks);
  title.querySelector('[data-part="post"]').textContent = maskOf(POEM_TITLE.postBlocks);
}

function handlePoemDrop(payload, slotEl) {
  if (slotEl.dataset.filled === '1') { rejectSlot(slotEl, '这个位置已经有牌了'); return; }
  const id = payloadId(payload);
  const target = POEM_TARGETS.find(t => t.id === id);

  if (slotEl.classList.contains('poem-center')) {
    if (id !== 'special:hope') { rejectSlot(slotEl, '阵心只留给最重要的那张牌'); return; }
    placeCard(slotEl, payload);
    poemDone.add(POEM_CENTER_KEY);
    revealPoemKey({ key: 'title', word: POEM_TITLE.word });   // 题目里的「希望」亮起
  } else {
    if (!target)                  { rejectSlot(slotEl, '这里没有它的位置…'); return; }
    if (poemDone.has(target.key)) { rejectSlot(slotEl, '这张牌已经放入过了'); return; }
    placeCard(slotEl, payload);
    poemDone.add(target.key);
    revealPoemKey(target);
  }

  slotEl.classList.add('accepted');
  setTimeout(() => slotEl.classList.remove('accepted'), 600);

  const r = slotEl.getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height / 2, { count: 12 });

  if (poemDone.size === POEM_TOTAL) finishPoem();
}

/* 关键字浮现在该句开头（地牌只给「地」，树牌只给「树」），其余仍是方块 */
function revealPoemKey(target) {
  const key = poemLine(target.key).querySelector('.poem-key');
  key.textContent = target.word;      // 顶掉它原先占位的那几个方块
  key.classList.add('lit');
  key.classList.remove('pop');
  void key.offsetWidth;          // 重排，保证动画每次都从头播
  key.classList.add('pop');
}

/* 揭晓整首诗的一段：题目补全两侧，诗句把方块换成真句 */
function revealPoemPart(key) {
  if (key === 'title') {
    const t = poemLine('title');
    const pre  = t.querySelector('[data-part="pre"]');
    const post = t.querySelector('[data-part="post"]');
    pre.textContent = POEM_TITLE.pre;    pre.classList.add('shown');
    post.textContent = POEM_TITLE.post;  post.classList.add('shown');
    return;
  }
  const target = POEM_TARGETS.find(x => x.key === key);
  if (!target) return;
  const m = poemLine(key).querySelector('.poem-mask');
  m.textContent = target.rest;
  m.classList.add('shown');
}

/* 集齐之后：魔法阵转动 → 闪光 → 整首诗显形 → 今夜我爱你 */
const CHARGE_MS = 4400;   // 集齐之后先蓄力这么久，再揭晓
const SETTLE_MS = 2400;   // 揭晓之后再等这么久，一切才算落定
/* 前五次闪光的时间点：每闪一次揭晓一句（题目 → 夜晚 → 地面 → 空气 → 树林），
   间隔逐次收紧。必须早于下面的临界闪光，否则大爆发会抢在最后一句前面 */
const HINT_FLASH_AT = [500, 1100, 1600, 2000, 2300];   // 间隔 600 → 500 → 400 → 300，越逼越紧
const CRIT_AT = 2600;              // 第六次闪光：临界一击（与第五次只隔 300）
// 之后到揭晓留出 1800ms 的空档：魔法阵在这段时间里一路加速到最快，是「蓄力」
const CRIT_MS = 1500;              // 它的持续时间比平时长，之后「今夜我爱你」才现身
const QUAKE_MS = 1100;             // 单次震动时长，与 CSS 里 quake 动画一致

function finishPoem() {
  const circle = $('#poem-circle');
  document.body.classList.add('petals-still');   // 仪式期间花瓣静止

  const reveal = () => {
    // 从当前实际角度接续减速，避免动画换挡时角度突跳
    const ring = $('.poem-ring');
    const tf = getComputedStyle(ring).transform;
    let rot = 0;
    if (tf && tf !== 'none') {
      const m = new DOMMatrixReadOnly(tf);
      rot = Math.atan2(m.b, m.a) * 180 / Math.PI;
    }
    ring.style.setProperty('--r0', rot.toFixed(2) + 'deg');

    circle.classList.remove('charging');
    circle.classList.add('slowing');
    setTimeout(() => {
      circle.classList.remove('slowing');
      circle.classList.add('complete');
    }, 1500);                                    // 与五个字依次现身同时收尾

    // 兜底：正常流程下五句已在五次闪光里逐句显形，这里保证状态一定完整
    POEM_PART_KEYS.forEach(revealPoemPart);

    // 最高潮：今夜我爱你 —— 魔法阵震动 + 粒子，字逐个炸出来。
    // 这里刻意不再打白光：任何满屏亮起都会盖住逐字登场的节奏
    $('#tab-right-text').textContent = POEM_TAB.revealed;   // 把手也揭晓
    const last = $('#poem-last');
    last.classList.add('show');
    const lr = last.getBoundingClientRect();
    const lx = lr.left + lr.width / 2;
    const ly = lr.top + lr.height / 2;

    pulseQuake(circle, 1100);
    // 震动峰值在动画的 8% 处（约 90ms），让图鉴的翻牌与那一击同步
    setTimeout(quakeFlipGallery, 100);
    burst(lx, ly, { count: 40, hearts: true });
    setTimeout(() => burst(lx, ly, { count: 48, hearts: true }), 430);
    setTimeout(() => burst(lx, ly, { count: 48, hearts: true }), 900);
  };

  // 先把视线聚到魔法阵（必要时拉开右侧抽屉），再进入充能
  const wait = focusOnCircle();
  setTimeout(() => {
    circle.style.setProperty('--charge-ms', CHARGE_MS + 'ms');   // 让 CSS 的加速时长与这里同步
    circle.classList.add('charging');               // 圆环一路加速自转 + 明暗搏动

    // 一次闪光揭晓一句；震动只跟着闪光走，不再另有不规律的震
    HINT_FLASH_AT.forEach((at, i) => setTimeout(() => {
      flashScreen(false, circle);            // 以右侧魔法阵为中心
      pulseQuake(circle, QUAKE_MS);
      revealPoemPart(i === 0 ? 'title' : POEM_TARGETS[i - 1].key);
      // 第五次震动：顺手把图鉴震翻一次（最后一次震动时会再翻一次，正好转回原面）
      if (i === 4) setTimeout(quakeFlipGallery, 100);
    }, at));

    // 第六次闪光：临界一击，比前面几次亮得更久
    setTimeout(() => {
      flashScreen(true, circle);
      const c = circleCenter();
      burst(c.x, c.y, { count: 36, hearts: true });
      pulseQuake(circle, CRIT_MS);
    }, CRIT_AT);

    setTimeout(reveal, CHARGE_MS);
  }, wait);

  // 完全落定之后：花瓣重新飘落，这时才放出「再读一次」
  setTimeout(() => {
    document.body.classList.remove('petals-still');
    $('#poem-reset').classList.remove('hidden');
  }, wait + CHARGE_MS + SETTLE_MS);
}

const circleCenter = () => {
  const r = $('#poem-circle').getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};

/* 震翻图鉴：把当前搜索结果里可见的牌，按「每行自右向左」依次翻一次（逆时针）。
   先按 offsetTop 分行（网格行对齐，同一行的值完全相同），
   各行内部从右往左错开，但**各行同时开始** —— 是横着一排排推过去，
   不是翻完上一行再翻下一行。
   在第五次震动与最后一次震动各调一次，两次各 180°，合起来正好转回原来那一面 */
function quakeFlipGallery() {
  const rows = new Map();
  $$('#grid .card')
    .filter(el => !el.classList.contains('hidden'))
    .forEach(el => {
      const key = el.offsetTop;
      if (!rows.has(key)) rows.set(key, []);
      rows.get(key).push(el);
    });

  rows.forEach(row => {
    row.map(el => ({ el, left: el.getBoundingClientRect().left }))
       .sort((a, b) => b.left - a.left)              // 本行内从右往左
       .forEach(({ el }, i) => setTimeout(() => flipCard(el, -1), i * 60));
  });
}

/* 触发一次震动；连续触发时先强制重排，保证动画每次都从头播 */
function pulseQuake(circle, ms) {
  clearTimeout(circle._quakeTimer);
  circle.classList.remove('quake');
  void circle.offsetWidth;
  circle.classList.add('quake');
  circle._quakeTimer = setTimeout(() => circle.classList.remove('quake'), ms);
}

/* 若魔法阵不在视野里，先平滑滚过去；返回需要等待的毫秒数 */
/* —— 魔法阵在右侧抽屉里：揭晓前先确保抽屉是打开的
   （原来这里是把页面滚动到魔法阵，改成抽屉后不再需要滚动） */
function focusOnCircle() {
  if (isDrawerOpen('right')) return 0;
  setDrawer('right', true);
  return 480;                      // 等抽屉滑入
}

function resetPoem() {
  poemDone.clear();
  $$('.poem-slot').forEach(s => {
    const c = s.querySelector('.slot-card');
    if (c) c.remove();
    delete s.dataset.filled;
    delete s._payload;
    s.classList.remove('filled', 'accepted');
  });
  POEM_TARGETS.forEach(t => {
    const line = poemLine(t.key);
    const k = line.querySelector('.poem-key');
    k.textContent = maskOf(t.word.length);
    k.classList.remove('lit', 'pop');
    const m = line.querySelector('.poem-mask');
    m.textContent = maskOf(t.blocks - t.word.length);
    m.classList.remove('shown');
  });
  const title = poemLine('title');
  const tk = title.querySelector('.poem-key');
  tk.textContent = maskOf(POEM_TITLE.word.length);
  tk.classList.remove('lit', 'pop');
  const pre  = title.querySelector('[data-part="pre"]');
  const post = title.querySelector('[data-part="post"]');
  pre.textContent = maskOf(POEM_TITLE.preBlocks);    pre.classList.remove('shown');
  post.textContent = maskOf(POEM_TITLE.postBlocks);  post.classList.remove('shown');
  $('#poem-last').classList.remove('show');
  $('#tab-right-text').textContent = POEM_TAB.locked;
  const circle = $('#poem-circle');
  clearTimeout(circle._quakeTimer);
  circle.classList.remove('complete', 'charging', 'slowing', 'quake');
  $('.poem-ring').style.removeProperty('--r0');
  document.body.classList.remove('petals-still');   // 花瓣恢复飘落
  $('#poem-reset').classList.add('hidden');
}

let toastTimer = null;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1800);
}

/* ============================================================
   详情弹窗（翻面 + 单张转化）
   ============================================================ */
const modalEl = $('#modal');
let modalData = null;
let modalSide = 'clow';

function openModal(data) {
  modalData = data;
  modalSide = data.sakuraSrc && (!data.clowSrc || mode === 'sakura') ? 'sakura' : 'clow';

  // 特征色挂在 .modal-body 上，卡面与文字都能继承到 --frame
  const bodyEl = modalEl.querySelector('.modal-body');
  bodyEl.classList.remove('frame-clow', 'frame-sakura', 'frame-hope');
  bodyEl.classList.toggle('is-special', !!data.frame);
  if (data.frame) bodyEl.classList.add('frame-' + data.frame);

  resetFlip(modalEl.querySelector('.modal-card'));   // 每次打开都从正面起算，角度归零
  modalEl.querySelector('.modal-card').classList.remove('morphing');
  $('#modal-name').textContent = data.cn;
  $('#modal-en').textContent   = data.en;
  // 「象征」释义：只有 52 张普通牌有，特殊牌整块隐藏
  $('#modal-sym').textContent  = data.sym || '';
  $('#modal-sym-box').classList.toggle('hidden', !data.sym);
  // 「Past 有话说」：只有填了内容才显示
  $('#modal-past').textContent = data.past || '';
  $('#modal-past-box').classList.toggle('hidden', !data.past);
  applyModalSide();
  $('#modal-morph').classList.toggle('hidden', !data.morphable);
  modalEl.classList.remove('hidden');
  document.body.classList.add('no-scroll');
  $('#modal-close').focus();
}

/* 按当前展示的是库洛面还是小樱面，刷新弹窗里的图与文字 */
function applyModalSide() {
  modalEl.querySelector('.modal-body').dataset.side = modalSide;
  $('#modal-face').src = modalSide === 'sakura' ? modalData.sakuraSrc : modalData.clowSrc;
  $('#modal-back').src = modalSide === 'sakura' ? S_BACK : C_BACK;
  $('#modal-desc').textContent = modalSide === 'sakura' ? modalData.descSakura : modalData.descClow;
  updateMorphBtn();
}

function closeModal() {
  modalEl.classList.add('hidden');
  document.body.classList.remove('no-scroll');
}

function updateMorphBtn() {
  if (!modalData || !modalData.morphable) return;
  $('#modal-morph').textContent = modalSide === 'sakura'
    ? '✦ 封印 · 恢复为库洛牌 ✦'
    : '✦ 收服 · 转化为小樱牌 ✦';
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
    applyModalSide();
    cardEl.classList.remove('morphing');
  }, 420);
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

/* hold = true 时用更长的闪光（临界那一击用）；
   origin 传入元素则以它为中心炸开，不传则用屏幕中心 */
function flashScreen(hold, origin) {
  const f = document.createElement('div');
  f.className = 'screen-flash' + (hold ? ' hold' : '');
  if (origin) {
    const r = origin.getBoundingClientRect();
    f.style.setProperty('--fx', (r.left + r.width / 2) + 'px');
    f.style.setProperty('--fy', (r.top + r.height / 2) + 'px');
  }
  document.body.appendChild(f);
  setTimeout(() => f.remove(), hold ? 1600 : 1200);
}

/* ============================================================
   密码门：两层，解开前整页既看不见也点不到。

   改密码：控制台执行 gateHash('新密码') 得到摘要，替换下面对应那行即可。
   ============================================================ */
const GATE_LEVELS = [
  { len: 2, question: '最喜欢的两个数字？', ok: '还有第二关！？',
    hash: '6b51d431df5d7f141cbececcf79edf3dd861c3b4069f0b11661a3eefacbba918' },
  { len: 4, question: '最让人想说“私、気になります！”的四个数字？', ok: '好奇心，值得被嘉奖哦~',
    hash: '216da54b5931a6d37cca8e29953361fe02c680bbd8b482343f508e32e8e9cc3b' },
];
const GATE_WRONG = '笨蛋——再想想呢？';

let gateLevel = 0;
let gateChecking = false;                    // 防止连打时重复校验
const gateDigits = () => [...$('#gate-inputs').children];

/* 用 Web Crypto 算摘要。file:// 下 Chrome 也把它当安全上下文，这个 API 可用 */
async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

/* 改密码用的小工具：控制台执行 gateHash('新密码') 即可拿到摘要 */
window.gateHash = text => sha256Hex(text).then(h => { console.log('摘要：', h); return h; });

let gateMsgTimer = null;
function gateSay(msg, kind) {
  const el = $('#gate-msg');
  el.textContent = msg;
  el.className = 'gate-msg' + (kind ? ' ' + kind : '');
  clearTimeout(gateMsgTimer);
  // 答错的提示自己退场，免得一直挂在那里
  if (msg && kind === 'bad') {
    gateMsgTimer = setTimeout(() => {
      el.textContent = '';
      el.className = 'gate-msg';
    }, 2600);
  }
}

function buildGate(level) {
  const cfg = GATE_LEVELS[level];
  $('#gate-question').textContent = cfg.question;
  const box = $('#gate-inputs');
  box.innerHTML = '';
  for (let i = 0; i < cfg.len; i++) {
    const inp = document.createElement('input');
    inp.className = 'gate-digit';
    inp.type = 'text';
    inp.inputMode = 'numeric';
    inp.maxLength = 1;
    inp.autocomplete = 'off';
    inp.setAttribute('aria-label', '第 ' + (i + 1) + ' 位数字');
    inp.addEventListener('input', () => {
      inp.value = inp.value.replace(/\D/g, '').slice(0, 1);      // 只留数字
      if (inp.value && i < cfg.len - 1) box.children[i + 1].focus();
      if (gateDigits().every(d => d.value)) gateCheck();          // 填满即校验
    });
    inp.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !inp.value && i > 0) box.children[i - 1].focus();
      if (e.key === 'Enter') gateCheck();
    });
    box.appendChild(inp);
  }
  box.children[0].focus();
}

async function gateCheck() {
  if (gateChecking) return;
  const cfg = GATE_LEVELS[gateLevel];
  const typed = gateDigits().map(d => d.value).join('');
  if (typed.length < cfg.len) return;

  gateChecking = true;
  let got = '';
  try { got = await sha256Hex(typed); } catch (e) { got = ''; }
  gateChecking = false;

  if (got === cfg.hash) {
    gateSay(cfg.ok, 'good');
    if (gateLevel < GATE_LEVELS.length - 1) {
      setTimeout(() => { gateLevel++; gateSay(''); buildGate(gateLevel); }, 1250);
    } else {
      setTimeout(gateUnlock, 1350);
    }
  } else {
    gateSay(GATE_WRONG, 'bad');
    const panel = $('#gate-panel');
    panel.classList.remove('shake');
    void panel.offsetWidth;                    // 重排，保证连错也能重复触发
    panel.classList.add('shake');
    setTimeout(() => {
      gateDigits().forEach(d => { d.value = ''; });
      $('#gate-inputs').children[0].focus();
    }, 430);
  }
}

function gateUnlock() {
  const g = $('#gate');
  // 整块淡出即可，页头那颗本来就在后面等着
  g.classList.add('done');
  document.body.classList.remove('no-scroll');
  setTimeout(() => g.remove(), 900);
}

/* ============================================================
   右侧抽屉的诗篇密码：12 位数字，只是排成两行显示，密码本身仍是一整串。

   改密码：控制台执行 gateHash('新密码') 得到摘要，替换下面这行。
   ============================================================ */
const LOCK_HASH = 'b8cb0038746176052f8f15c8d9b4b21292a76ec9a05d44beab47f87f9a2011bf';
const LOCK_COLS = 6;                    // 每行 6 位，两行共 12 位
const LOCK_LINE_STEP = 140;             // 竖排文字：每个字之间差这么久
const LOCK_LINE_GAP  = 700;             // 竖排文字：两列之间差这么久（≈ 5 × STEP）

/* 竖排的文字。各列都垂直居中于两行密码的中线上（见 style.css 的 --lk-text-pitch），
   于是「吾问汝」三个字正好落在第一行／两行中间／第二行上 */
const LOCK_TEXT = {
  /* 问句在右，从右向左读 */
  riddle: ['吾问汝', '汝为人乎？'],
  /* 答句在左，同样从右向左读 */
  answer: ['否，吾乃天', '壶中之天！'],
};

/* 答对之后在密码正下方打出来的宣告，分两行。固定用希望红（见 style.css 的 .lock-open）。
   lead 是这一行第一个字的起始时刻 —— 接在左侧两列的浮现之后 */
const LOCK_OPEN = [
  { sel: '#lock-open-l1', text: '为您开启封印了九十万六百六十六册幻书的迷宫书架', lead: 2330, step: 38 },
  { sel: '#lock-open-l2', text: '通往睿智的门扉！',                                 lead: 3300, step: 62 },
];

let lockChecking = false;
let lockMsgTimer = null;

const lockDigits = () => [...$('#lock-grid').children];

function lockSay(msg, kind) {
  const el = $('#lock-msg');
  if (!el) return;
  el.textContent = msg;
  el.className = 'lock-msg' + (kind ? ' ' + kind : '');
  clearTimeout(lockMsgTimer);
  if (msg && kind === 'bad') {
    lockMsgTimer = setTimeout(() => { el.textContent = ''; el.className = 'lock-msg'; }, 2600);
  }
}

/* 竖排一列：逐字一个 span，好让每个字各自掌握出现的时机 */
function buildLockLine(box, text, li) {
  const p = document.createElement('p');
  p.className = 'vline';
  [...text].forEach((ch, ci) => {
    const s = document.createElement('span');
    s.textContent = ch;
    if (ch === '，') s.classList.add('punct');
    // 靠前的那一列（也是靠右的那一列）先出现，列内自上而下 —— 合起来就是按阅读顺序浮现
    s.style.transitionDelay = (li * LOCK_LINE_GAP + ci * LOCK_LINE_STEP) + 'ms';
    p.appendChild(s);
  });
  box.appendChild(p);
}

function buildLock() {
  const grid = $('#lock-grid');
  const total = LOCK_COLS * 2;
  for (let i = 0; i < total; i++) {
    const r = Math.floor(i / LOCK_COLS);
    const inp = document.createElement('input');
    inp.className = 'lock-digit';
    inp.type = 'text';
    inp.inputMode = 'numeric';
    inp.maxLength = 1;
    inp.autocomplete = 'off';
    inp.setAttribute('aria-label', '第 ' + (r + 1) + ' 行第 ' + (i % LOCK_COLS + 1) + ' 位数字');
    inp.addEventListener('input', () => {
      inp.value = inp.value.replace(/\D/g, '').slice(0, 1);       // 只留数字
      if (inp.value && i < total - 1) grid.children[i + 1].focus();
      if (lockDigits().every(d => d.value)) lockCheck();          // 12 位填满即校验
    });
    inp.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !inp.value && i > 0) grid.children[i - 1].focus();
      if (e.key === 'Enter') lockCheck();
    });
    grid.appendChild(inp);
  }
  buildLockLine($('#lock-riddle'), LOCK_TEXT.riddle[0], 0);
  buildLockLine($('#lock-riddle'), LOCK_TEXT.riddle[1], 1);
  buildLockLine($('#lock-answer'), LOCK_TEXT.answer[0], 0);
  buildLockLine($('#lock-answer'), LOCK_TEXT.answer[1], 1);

  // 宣告逐字铺开，第二行接在第一行后面
  LOCK_OPEN.forEach(line => {
    const box = $(line.sel);
    [...line.text].forEach((ch, i) => {
      const s = document.createElement('span');
      s.textContent = ch;
      s.style.transitionDelay = (line.lead + i * line.step) + 'ms';
      box.appendChild(s);
    });
  });
}

/* 每次拉开抽屉都重放一遍右侧两列的浮现。
   这里不能用「摘掉类 → 强制重排 → 加回类」那套：它依赖浏览器把中间态
   真的当成一次样式变化，而 .risen 只改后代的 opacity/transform，不触发布局，
   实测第二次展开时浏览器并不重放过渡。
   改用 Web Animations —— 每次都显式新建一条动画，必然从头播。
   fill 用 backwards：延迟期间保持「藏着」的初态，播完交还给 CSS 的终态 */
function riseRiddle() {
  const lock = $('#poem-lock');
  if (!lock) return;
  lock.classList.add('risen');
  [...lock.querySelectorAll('.lock-riddle .vline')].forEach((line, li) => {
    [...line.children].forEach((s, ci) => {
      s.getAnimations().forEach(a => a.cancel());     // 连点抽屉时先掐掉上一条
      s.animate(
        [{ opacity: 0, transform: 'translateY(7px)' },
         { opacity: 1, transform: 'none' }],
        { duration: 550, delay: li * LOCK_LINE_GAP + ci * LOCK_LINE_STEP, easing: 'ease', fill: 'backwards' }
      );
    });
  });
}

async function lockCheck() {
  if (lockChecking) return;
  const digits = lockDigits();
  const typed = digits.map(d => d.value).join('');
  if (typed.length < digits.length) return;

  lockChecking = true;
  let got = '';
  try { got = await sha256Hex(typed); } catch (e) { got = ''; }
  lockChecking = false;

  if (got === LOCK_HASH) { lockSay(''); lockSolve(); return; }

  lockSay(GATE_WRONG, 'bad');
  const box = $('#lock-center');
  box.classList.remove('shake');
  void box.offsetWidth;                                        // 重排，保证连错也能重复触发
  box.classList.add('shake');
  setTimeout(() => {
    digits.forEach(d => { d.value = ''; });
    digits[0].focus();
  }, 430);
}

/* 解开的一刻。时间线全部压在 CSS 上（见 style.css 的 .lock-art 一段），是单行道：
        0ms 两行密码消失、左侧两列浮现
     1750ms 钥匙飞入（两列铺完之后才起飞）
     2330ms 宣告铺第一行，3300ms 第二行，3750ms 末句弹一下
     4500ms 钥匙拧转
     5050ms 锁孔爆光
     5450ms 一记长闪，锁层在闪光底下淡出、诗篇同时切出
   这里只负责在最后那一刻点火 */
const UNLOCK_END = 5450;

function lockSolve() {
  const lock = $('#poem-lock');
  lock.classList.add('solved', 'lit');        // 左侧两列浮现，随后宣告与开锁同时上演
  setTimeout(() => {
    flashScreen(true, $('#lock-art'));         // 长闪：复用转化用的那一记，只是按住更久
    lock.classList.add('done');                // 锁层在闪光下面退场，换诗篇上来
    $('#poem').classList.remove('hidden');
    setTimeout(() => lock.remove(), 900);
  }, UNLOCK_END);
}

/* 抽屉拉开时才把焦点送进去。页面刚加载时主密码门还占着焦点，不去抢 */
function focusLock() {
  if (!$('#poem-lock') || $('#gate')) return;
  const first = lockDigits().find(d => !d.value);
  if (first) first.focus({ preventScroll: true });
}

/* ============================================================
   事件绑定与启动
   ============================================================ */
function bindEvents() {
  $('#transform-all').addEventListener('click', () => {
    if (busy) return;
    flashScreen();
    morphAll(mode === 'sakura' ? 'clow' : 'sakura');
  });
  searchEl.addEventListener('input', applyFilter);
  // 两侧抽屉的把手
  $$('.drawer-tab').forEach(t => t.addEventListener('click', () => toggleDrawer(t.dataset.drawer)));
  $('#modal-flip').addEventListener('click', () => flipCard(modalEl.querySelector('.modal-card')));
  $('#modal-morph').addEventListener('click', morphModal);
  $('#modal-close').addEventListener('click', closeModal);
  $$('#modal [data-close]').forEach(el => el.addEventListener('click', closeModal));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  $('#hope-flip').addEventListener('click', () => {
    if (!synthesized) return;                     // 未诞生：不可翻面
    flipCard($('#hope-card'));
  });
  $('#hope-detail').addEventListener('click', () => {
    if (!synthesized) { toast('它还未诞生…'); return; }   // 未诞生：不可查看详情
    openModal(specialData(SPECIAL.hope));
  });
  // 合成之后，希望牌本身也可以被拖去献诗
  attachDrag($('#hope-flip'), $('#hope-card'));
  $('#poem-reset').addEventListener('click', resetPoem);
  // 屏蔽浏览器原生的图片拖拽，避免和自定义拖牌冲突
  document.addEventListener('dragstart', e => {
    if (e.target.closest('#grid')) e.preventDefault();
  });
}

function init() {
  document.body.dataset.mode = mode;
  // 先绑事件再渲染：后面任何渲染环节出问题，也不会连累按钮/搜索全部失灵
  bindEvents();
  // 密码门：先上锁再干别的，未解锁时也禁止页面滚动
  if ($('#gate')) {
    document.body.classList.add('no-scroll');
    buildGate(0);
  }
  // 右侧抽屉的诗篇密码，与主密码门各自独立
  if ($('#poem-lock')) buildLock();
  // 页头 / 合成台 / 诗篇三处魔法阵都改用图片素材（见 style.css），不再注入 SVG；
  // 只剩弹窗里那圈转化动效仍用 SVG
  $('.magic-overlay').innerHTML = MAGIC_RING;
  buildGrid();
  buildPoem();
  spawnPetals();
  updateModeUI();
  applyHopeState();   // 每次进入都从「未知」态开始
  // 预加载真正的希望牌：合成瞬间切换 src 时不会因为解码而滞留旧图
  const preload = new Image();
  preload.src = HOPE_FACE.revealed.img;
}

init();
