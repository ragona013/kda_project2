// 나만의 주식펫을 키움 — API 서버 (Express, 포트 3001)
import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  initMarket, getState, createPlan, advance, diary, reset, addChat, getChats, currentWeek,
  boostPlan, managePlan, markCard, setTheme, setAccount,
} from './game.js';
import { handleMessage } from './agent.js';
import { getMeta, setMeta } from './db.js';
import { UNIVERSE } from './universe.js';
import { BROKER_MODE } from './broker.js';

const app = express();
app.set('trust proxy', 2); // Vercel → Railway 두 단계 프록시 뒤에서 실제 방문자 IP로 호출 제한
app.use(express.json({ limit: '100kb' }));

// 간단한 호출 제한 (IP당 분당 120회)
const hits = new Map();
app.use('/api', (req, res, next) => {
  const k = req.ip, now = Date.now();
  const h = (hits.get(k) || []).filter(t => now - t < 60000);
  h.push(now); hits.set(k, h);
  if (h.length > 120) return res.status(429).json({ error: '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.' });
  next();
});

const wrap = fn => async (req, res) => {
  try { res.json(await fn(req)); }
  catch (e) { res.status(400).json({ error: e.message }); }
};
const pid = v => (v == null || v === '' ? null : Number(v));

app.get('/api/health', (_, res) => res.json({ ok: true, broker: BROKER_MODE, week: currentWeek() }));
app.get('/api/state', wrap(() => getState()));
app.get('/api/universe', wrap(() => UNIVERSE.map(({ code, name, sector, char, market, overview }) => ({ code, name, sector, char, market, overview }))));
app.get('/api/chats', wrap(req => getChats(pid(req.query.planId))));

// 펫에게 말하기 (planId = 대화 중인 펫)
app.post('/api/chat', wrap(async req => {
  const message = String(req.body?.message || '').slice(0, 500);
  const planId = pid(req.body?.planId);
  if (!message.trim()) throw new Error('메시지를 입력해 주세요.');
  addChat(planId, 'user', message);
  const r = await handleMessage(message, planId);
  addChat(planId, 'pet', r.reply, r.card || null);
  return { chats: getChats(planId), state: getState() };
}));

// 확인 카드 승인 → 플랜 등록 (돈이 움직이는 일은 사용자 승인 후에만)
app.post('/api/plans', wrap(req => {
  const { code, amount, recurring, chatId, planId } = req.body || {};
  const p = createPlan(String(code), Number(amount), { recurring: recurring !== false });
  if (chatId) {
    markCard(Number(chatId), { status: 'done' });
    addChat(pid(planId), 'pet', `${p.stock} 알이 도착했어! 홈에서 옆으로 넘기면 보여.`);
  }
  return { plan: p, chats: getChats(pid(planId)), state: getState() };
}));

// 적립 관리: down(금액 줄이기) · pause(4주 쉬기) · stop(적립만 멈춤) · resume · end(해지) · keep
app.post('/api/plans/:id/manage', wrap(req => {
  const id = Number(req.params.id);
  const { action, amount, label, cardChatId } = req.body || {};
  const plan = managePlan(id, String(action), { amount, label, cardChatId });
  return { plan, chats: getChats(id), state: getState() };
}));

app.post('/api/sim/next', wrap(req => {
  const n = Math.min(8, Math.max(1, Number(req.body?.weeks) || 1));
  return advance(n);
}));

app.post('/api/plans/:id/boost', wrap(req => boostPlan(Number(req.params.id), req.body?.mode === 'graduate' ? 'graduate' : 'next')));
app.get('/api/plans/:id/diary', wrap(req => diary(Number(req.params.id))));

app.post('/api/theme', wrap(req => setTheme(req.body?.theme)));
app.post('/api/account', wrap(req => setAccount(req.body?.has !== false)));
app.post('/api/reset', wrap(req => ({ state: reset(req.body?.demo !== false) })));

// 빌드 결과물 서빙 (배포용)
const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^(?!\/api).*/, (_, res) => res.sendFile(path.join(dist, 'index.html')));
}

const PORT = Number(process.env.PORT) || 3001;
const source = await initMarket();
// 기본 캐릭터를 우리 팀 캐릭터로 바꾼 뒤 처음 실행: 테마를 바꾸고 데모를 그 캐릭터 이름으로 다시 채움
if (getMeta('theme_default') !== 'B') {
  setMeta('theme', 'B');
  setMeta('theme_default', 'B');
  reset(true);
}
if (getMeta('week') === null) reset(true); // 첫 실행: 데모 데이터
app.listen(PORT, process.env.HOST || (process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT_NAME ? '0.0.0.0' : '127.0.0.1'), () => {
  console.log(`[stock-pet] API http://localhost:${PORT}  · 시세: ${source} · 주문: ${BROKER_MODE} · 모의 주차: ${currentWeek()}`);
});
