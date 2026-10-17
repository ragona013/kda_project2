// 게임 로직 — 모의 시간(주차)·정기매수·색이 차오르는 펫·1주 완성·도감·적립 관리
import { db, getMeta, setMeta, resetAll } from './db.js';
import { byCode, toKRW, USDKRW, PET_NAMES } from './universe.js';
import { weekCalendar, loadWeeklyPrices, SIM_WEEKS } from './market.js';
import { placeOrder } from './broker.js';

export const MAX_PETS = 5; // 동시에 키울 수 있는 펫 수
const STAGE_NAMES = ['알', '아기', '성장기', '성체', '1주 완성'];

let WEEKS = [];
let PRICES = {};
let PRICE_SOURCE = 'mock';

export async function initMarket() {
  WEEKS = weekCalendar();
  const r = await loadWeeklyPrices(WEEKS);
  PRICES = r.prices;
  PRICE_SOURCE = r.source;
  return PRICE_SOURCE;
}

export const currentWeek = () => Number(getMeta('week', 0));
// 기본 캐릭터 = 우리 팀 캐릭터(B). 큐밍(A)은 메뉴에서 고르는 시안
export const theme = () => (getMeta('theme', 'B') === 'A' ? 'A' : 'B');
export const priceAt = (code, w) => PRICES[code].closes[Math.max(0, Math.min(w, SIM_WEEKS - 1))];
export const dateOf = w => WEEKS[Math.max(0, Math.min(w, SIM_WEEKS - 1))];
export const petName = code => PET_NAMES[theme()][byCode[code].char];

const won = n => `${Math.round(n).toLocaleString('ko-KR')}원`;
const fmtSh = n => `${Math.min(1, n).toFixed(2)}주`;
const amountLabel = a => (a % 10000 === 0 ? `${a / 10000}만원` : a % 1000 === 0 ? `${a / 1000}천원` : won(a));

function stageOf(shares) {
  if (shares >= 1) return 4;
  if (shares < 0.1) return 0;
  if (shares < 0.4) return 1;
  if (shares < 0.75) return 2;
  return 3;
}

// 받침에 따라 조사 고르기 (삼성전자를 / KODEX 200을 / 칩밍이야 / 룡룡이야)
export function josa(word, withB, withoutB) {
  const ch = word.trim().slice(-1);
  const code = ch.charCodeAt(0) - 0xAC00;
  let b;
  if (code >= 0 && code < 11172) b = code % 28 !== 0;
  else if (/[0-9]/.test(ch)) b = '013678'.includes(ch);
  else b = /[lmnr]/i.test(ch);
  return word + (b ? withB : withoutB);
}

const md = d => { const [, m, dd] = d.split('-').map(Number); return `${m}월 ${dd}일`; };

// 펫이 홈에서 먼저 건네는 이번 주 한 마디 (사실만: 등락률·조각·연속 기록)
function bubbleOf(v) {
  if (v.paused === 'p4') return `zzz… 4주 쉬는 중이야. ${md(v.resumeDate)} 금요일에 다시 모을게.`;
  if (v.paused === 'stop') return '적립을 멈췄어. 다시 모으고 싶으면 말해 줘.';
  if (v.paused === 'end') return '그동안 고마웠어. 모은 조각은 계좌에 그대로 있어.';
  if (v.buys <= 1) return `알이 도착했어! 금요일마다 ${amountLabel(v.amount)}씩 조각을 모을게.`;
  if (v.streak > 0 && v.streak % 4 === 0) return `벌써 ${v.streak}주 연속! 넣은 돈이 ${won(v.principal)}을 넘었어.`;
  const c = v.weekChangePct;
  if (c < 0) return `이번 주 ${c.toFixed(1)}%였어. 대신 같은 돈으로 조각을 ${(1 / (1 + c / 100)).toFixed(2)}배 모았어.`;
  return `이번 주 +${c.toFixed(1)}%. 금요일에 ${amountLabel(v.amount)} 또 모을 준비 됐어.`;
}

export function planView(p) {
  const s = byCode[p.code];
  const agg = db.prepare('SELECT COALESCE(SUM(shares),0) sh, COALESCE(SUM(amount),0) amt, COUNT(*) n FROM buys WHERE plan_id=?').get(p.id);
  const weeks = new Set(db.prepare('SELECT week FROM buys WHERE plan_id=?').all(p.id).map(b => b.week));
  const w = p.status === 'graduated' ? p.graduated_week : currentWeek();
  let streak = 0;
  for (let k = w; weeks.has(k); k--) streak++;
  const last = priceAt(p.code, w);
  const prev = priceAt(p.code, w - 1);
  const lastKRW = toKRW(s, last);
  const remain = Math.max(0, 1 - agg.sh);
  const v = {
    id: p.id, code: p.code, stock: s.name, name: petName(p.code), char: s.char, sector: s.sector, market: s.market,
    overview: s.overview, members: s.members || null,
    amount: p.amount, amountLabel: amountLabel(p.amount), status: p.status, paused: p.paused || null,
    resumeDate: p.pause_until != null ? dateOf(p.pause_until) : null,
    shares: agg.sh, principal: agg.amt, buys: agg.n, streak,
    lastPriceKRW: lastKRW, weekChangePct: prev ? ((last - prev) / prev) * 100 : 0,
    valueKRW: agg.sh * lastKRW,
    progress: Math.min(1, agg.sh), stage: stageOf(agg.sh), stageName: STAGE_NAMES[stageOf(agg.sh)],
    weeksToOne: remain > 0 ? Math.ceil((remain * lastKRW) / p.amount) : 0,
    createdDate: dateOf(p.created_week), graduatedDate: p.graduated_week != null ? dateOf(p.graduated_week) : null,
    dexNo: p.dex_no || null,
  };
  v.bubble = bubbleOf(v);
  return v;
}

export function getState() {
  const plans = db.prepare('SELECT * FROM plans ORDER BY id').all().map(planView);
  const week = currentWeek();
  const anyBuy = new Set(db.prepare('SELECT DISTINCT week FROM buys').all().map(b => b.week));
  const fridays = [];
  for (let k = week - 6; k <= week; k++) fridays.push(anyBuy.has(k) ? 1 : 0);
  fridays.push(-1); // 다가오는 금요일 (아직)
  const active = plans.filter(p => p.status === 'active' && p.paused !== 'end');
  return {
    week, date: dateOf(week), nextDate: dateOf(week + 1), lastWeek: SIM_WEEKS - 1,
    priceSource: PRICE_SOURCE, usdkrw: USDKRW, theme: theme(), maxPets: MAX_PETS,
    account: { has: getMeta('account', '1') === '1', masked: '···· 5678' },
    stats: {
      principal: plans.reduce((a, p) => a + p.principal, 0),
      weeklyTotal: active.filter(p => !p.paused).reduce((a, p) => a + p.amount, 0),
      graduated: plans.filter(p => p.status === 'graduated').length,
    },
    fridays,
    active,
    ended: plans.filter(p => p.status === 'active' && p.paused === 'end'),
    dex: plans.filter(p => p.status === 'graduated').sort((a, b) => a.dexNo - b.dexNo),
  };
}

function graduate(planId, week) {
  const no = (db.prepare('SELECT MAX(dex_no) m FROM plans').get().m || 0) + 1;
  db.prepare("UPDATE plans SET status='graduated', graduated_week=?, dex_no=?, paused=NULL WHERE id=?").run(week, no, planId);
}

function buy(plan, week) {
  const s = byCode[plan.code];
  const fill = placeOrder({ code: plan.code, amountKRW: plan.amount, price: priceAt(plan.code, week), stock: s });
  db.prepare('INSERT INTO buys(plan_id,week,price,price_krw,shares,amount) VALUES(?,?,?,?,?,?)')
    .run(plan.id, week, fill.price, fill.priceKRW, fill.shares, plan.amount);
  const total = db.prepare('SELECT SUM(shares) sh FROM buys WHERE plan_id=?').get(plan.id).sh;
  if (total >= 1) { graduate(plan.id, week); return { graduated: true, shares: fill.shares }; }
  return { graduated: false, shares: fill.shares };
}

const getPlan = id => {
  const p = db.prepare('SELECT * FROM plans WHERE id=?').get(id);
  if (!p) throw new Error('펫을 찾을 수 없어요.');
  return p;
};

export function canAddPet() {
  const n = db.prepare("SELECT COUNT(*) n FROM plans WHERE status='active' AND (paused IS NULL OR paused!='end')").get().n;
  return { ok: n < MAX_PETS, used: n, max: MAX_PETS };
}

export function createPlan(code, amount, { recurring = true } = {}) {
  if (!byCode[code]) throw new Error('지원하지 않는 종목이에요.');
  if (!(amount >= 1000)) throw new Error('최소 적립액은 1,000원이에요.');
  if (getMeta('account', '1') !== '1') throw new Error('키움증권 계좌가 필요해요.');
  const dup = db.prepare("SELECT id FROM plans WHERE code=? AND status='active' AND (paused IS NULL OR paused!='end')").get(code);
  if (dup) throw new Error(`이미 ${josa(byCode[code].name, '을', '를')} 모으고 있어요.`);
  if (!canAddPet().ok) throw new Error(`펫은 ${MAX_PETS}마리까지 키울 수 있어요. 한 마리가 1주를 채우면 자리가 생겨요.`);
  const week = currentWeek();
  const id = db.prepare('INSERT INTO plans(code,amount,created_week,paused) VALUES(?,?,?,?)').run(code, amount, week, recurring ? null : 'stop').lastInsertRowid;
  buy(getPlan(id), week); // 첫 조각 즉시 매수 → 알 도착
  const v = planView(getPlan(id));
  addChat(id, 'pet', `알이 도착했어! 나는 ${josa(v.stock, '을', '를')} 모으는 ${josa(v.name, '이야', '야')}. 첫 조각 ${v.shares.toFixed(4)}주를 모았어.` +
    (recurring ? `\n금요일마다 ${v.amountLabel}씩 조각이 늘어날 거야.` : '\n자동 구독은 꺼져 있어. 다시 모으고 싶으면 말해 줘.'));
  return v;
}

export function addChat(planId, role, content, card = null) {
  db.prepare('INSERT INTO chats(plan_id,role,content,card,week) VALUES(?,?,?,?,?)').run(planId ?? null, role, content, card ? JSON.stringify(card) : null, currentWeek());
}

export function getChats(planId, limit = 80) {
  const rows = planId
    ? db.prepare('SELECT * FROM chats WHERE plan_id=? ORDER BY id DESC LIMIT ?').all(planId, limit)
    : db.prepare('SELECT * FROM chats WHERE plan_id IS NULL ORDER BY id DESC LIMIT ?').all(limit);
  return rows.reverse().map(c => ({ ...c, card: c.card ? JSON.parse(c.card) : null }));
}

export function markCard(chatId, patch) {
  const c = db.prepare('SELECT card FROM chats WHERE id=?').get(chatId);
  if (!c?.card) return;
  db.prepare('UPDATE chats SET card=? WHERE id=?').run(JSON.stringify({ ...JSON.parse(c.card), ...patch }), chatId);
}

// 적립 관리 — 해지 대화의 선택지가 여기로 온다 (줄이기 · 쉬기 · 멈추기 · 다시 · 해지)
export function managePlan(id, action, opts = {}) {
  const p = getPlan(id);
  if (p.status !== 'active') throw new Error('이미 1주를 채운 펫이에요.');
  const v = planView(p);
  const week = currentWeek();
  let msg;
  if (action === 'down') {
    const amount = Math.max(1000, Number(opts.amount) || 1000);
    db.prepare('UPDATE plans SET amount=?, paused=NULL, pause_until=NULL WHERE id=?').run(amount, id);
    msg = `매주 ${josa(amountLabel(amount), '으로', '로')} 바꿨어. 조금씩이라도 계속 모으자. 금요일에 봐!`;
  } else if (action === 'pause') {
    db.prepare("UPDATE plans SET paused='p4', pause_until=? WHERE id=?").run(week + 5, id);
    msg = `4주 동안 푹 잘게. ${md(dateOf(week + 5))} 금요일에 다시 모을 거고, 그 전주에 알림으로 먼저 알려 줄게.`;
  } else if (action === 'stop') {
    db.prepare("UPDATE plans SET paused='stop', pause_until=NULL WHERE id=?").run(id);
    msg = '적립을 멈췄어. 모은 조각은 그대로야. 다시 시작하고 싶으면 언제든 말해 줘.';
  } else if (action === 'resume') {
    db.prepare('UPDATE plans SET paused=NULL, pause_until=NULL WHERE id=?').run(id);
    msg = `좋아! 이번 금요일부터 다시 ${v.amountLabel}씩 모을게.`;
  } else if (action === 'end') {
    db.prepare("UPDATE plans SET paused='end', pause_until=NULL WHERE id=?").run(id);
    msg = `해지했어. 모은 ${fmtSh(v.shares)}는 계좌에 그대로 있어. 언젠가 다시 보자.`;
  } else if (action === 'keep') {
    msg = '좋아, 그대로 둘게. 금요일에 봐!';
  } else throw new Error('알 수 없는 요청이에요.');
  if (opts.label) addChat(id, 'user', opts.label);
  if (opts.cardChatId) markCard(Number(opts.cardChatId), { status: 'done', doneText: action === 'end' ? '해지했어요' : action === 'keep' ? '그대로 두기로 했어요' : '처리했어요' });
  addChat(id, 'pet', msg);
  return planView(getPlan(id));
}

// 한 주 진행: 모든 활성 플랜 정기매수 → 색이 차오름 → 1주 완성 → 펫별 한 줄 기록
export function advance(n = 1) {
  const events = [];
  for (let i = 0; i < n; i++) {
    const week = currentWeek();
    if (week >= SIM_WEEKS - 1) break;
    const next = week + 1;
    setMeta('week', next);
    // 쉬기가 끝난 펫은 다시 모으기
    for (const p of db.prepare("SELECT * FROM plans WHERE status='active' AND paused='p4' AND pause_until<=?").all(next)) {
      db.prepare('UPDATE plans SET paused=NULL, pause_until=NULL WHERE id=?').run(p.id);
      addChat(p.id, 'pet', '잘 잤다! 오늘부터 다시 모을게.');
    }
    for (const p of db.prepare("SELECT * FROM plans WHERE status='active' AND paused IS NULL").all()) {
      const before = planView(p);
      const r = buy(p, next);
      const after = planView(getPlan(p.id));
      const c = after.weekChangePct;
      let line = `이번 주 ${r.shares.toFixed(4)}주를 모았어. 이제 ${fmtSh(after.shares)}.`;
      if (c <= -1) line += ` 가격이 ${c.toFixed(1)}% 내려서 같은 ${josa(after.amountLabel, '으로', '로')} 평소보다 더 모았어.`;
      if (r.graduated) { line = `1주를 다 채웠어! ${after.stock} 1주 완성. 조각 마을로 이사 갈 준비 됐어.`; events.push({ type: 'graduate', id: p.id, name: after.name, stock: after.stock }); }
      else if (after.stage > before.stage) { line += ` ${after.stageName} 단계로 자랐어!`; events.push({ type: 'grow', id: p.id, name: after.name, stage: after.stageName }); }
      addChat(p.id, 'pet', line);
    }
  }
  return { events, state: getState() };
}

// 도감 한 장 — 금요일마다 모은 조각 크기 + 성장 기록
export function diary(planId) {
  const p = getPlan(planId);
  const v = planView(p);
  const buys = db.prepare('SELECT * FROM buys WHERE plan_id=? ORDER BY week').all(p.id)
    .map(b => ({ date: dateOf(b.week), price: b.price, priceKRW: b.price_krw, shares: b.shares, amount: b.amount }));
  const best = buys.reduce((m, b) => (b.shares > (m?.shares || 0) ? b : m), null);
  return { plan: v, buys, best };
}

// 데모: 목표와 상관없이 바로 키우기 / 1주 완성
export function boostPlan(id, mode = 'next') {
  const p = getPlan(id);
  if (p.status !== 'active') throw new Error('이미 1주를 채운 펫이에요.');
  const v = planView(p);
  const steps = [0.1, 0.4, 0.75, 1];
  const target = mode === 'graduate' ? 1 : (steps.find(x => x > v.shares + 1e-9) ?? 1);
  const need = Math.max(0, target - v.shares) + 1e-6;
  const week = currentWeek();
  const s = byCode[p.code];
  const price = priceAt(p.code, week);
  const priceKRW = toKRW(s, price);
  db.prepare('INSERT INTO buys(plan_id,week,price,price_krw,shares,amount) VALUES(?,?,?,?,?,?)')
    .run(p.id, week, price, priceKRW, need, Math.ceil(need * priceKRW));
  if (v.shares + need >= 1) {
    graduate(p.id, week);
    addChat(p.id, 'pet', `[데모] 한 번에 밥을 먹고 1주를 다 채웠어! ${v.stock} 1주 완성.`);
    return { event: { type: 'graduate', id: p.id, name: v.name, stock: v.stock }, state: getState() };
  }
  const nv = planView(getPlan(p.id));
  addChat(p.id, 'pet', `[데모] ${nv.stageName} 단계로 자랐어! 이제 ${fmtSh(nv.shares)}.`);
  return { event: { type: 'grow', id: p.id, name: v.name, stage: nv.stageName }, state: getState() };
}

// 회사 소개용 시세 카드
export function quoteOf(code) {
  const s = byCode[code];
  const w = currentWeek();
  const closes = PRICES[code].closes.slice(0, w + 1);
  const last = closes.at(-1), prev = closes.at(-2) ?? last;
  return {
    type: 'stock', code, name: s.name, sector: s.sector, char: s.char, market: s.market,
    price: last, priceKRW: Math.round(toKRW(s, last)), weekChangePct: ((last - prev) / prev) * 100,
    date: dateOf(w), source: PRICES[code].source,
  };
}

export function setTheme(t) { setMeta('theme', t === 'B' ? 'B' : 'A'); return getState(); }
export function setAccount(has) { setMeta('account', has ? '1' : '0'); return getState(); }

export function reset(demo = true) {
  resetAll();
  setMeta('week', 0);
  setMeta('account', '1');
  if (!demo) return getState();
  // 데모: 33주 동안 모아온 상태 — 1주 완성 3마리(도감) + 키우는 중 3마리
  const at = (week, fn) => { while (currentWeek() < week) advance(1); fn(); };
  const END = 33;
  // 목표 조각에 맞춰 주간 금액을 잡음 (실제 시세가 바뀌어도 비슷한 모습이 되게)
  const amountFor = (code, target, n) => {
    const kr = toKRW(byCode[code], priceAt(code, END));
    return Math.max(1000, Math.round((target * kr) / n / 1000) * 1000);
  };
  createPlan('069500', 5000);
  createPlan('105560', 10000);
  at(6, () => createPlan('068270', 10000));
  at(12, () => createPlan('005930', amountFor('005930', 0.62, END - 12 + 1)));
  at(20, () => createPlan('005380', amountFor('005380', 0.31, END - 20 + 1)));
  at(25, () => createPlan('035420', amountFor('035420', 0.9, END - 25 + 1)));
  while (currentWeek() < END) advance(1);
  // 키우는 중인 펫이 데모 도중 1주를 넘겼다면 목표치 아래로 되돌림
  for (const p of db.prepare("SELECT * FROM plans WHERE code IN ('005930','005380','035420')").all()) {
    if (p.status === 'graduated') db.prepare("UPDATE plans SET status='active', graduated_week=NULL, dex_no=NULL WHERE id=?").run(p.id);
    const sh = db.prepare('SELECT SUM(shares) s FROM buys WHERE plan_id=?').get(p.id).s;
    if (sh >= 0.97) db.prepare('UPDATE buys SET shares=shares*? WHERE plan_id=?').run(0.92 / sh, p.id);
  }
  db.exec('DELETE FROM chats');
  for (const p of db.prepare("SELECT * FROM plans WHERE status='active'").all()) {
    const v = planView(p);
    addChat(p.id, 'pet', `안녕, 나 ${v.name}! ${josa(v.stock, '을', '를')} 모으고 있어. 지금 ${fmtSh(v.shares)}만큼 자랐어.`);
  }
  return getState();
}
