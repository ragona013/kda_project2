// 펫 에이전트 — 펫마다 대화창, 목적은 "최대한 오래 모으게 돕기"
//   ① 대화로 새 펫 데려오기 (문장 → 종목·금액 → 확인 카드 → 사용자 승인 시에만 매수)
//   ② 그만두고 싶을 때: 이유를 묻고 대안 제시 (줄이기 · 4주 쉬기 · 적립만 멈추기 · 바로 해지)
//   ③ 내 현황 · 용어 · 회사 소개 (사실만, 예측·추천 없음)
// 규칙 기반으로 먼저 처리하고, 나머지 자유 대화만 LLM(OpenAI 호환)에 넘김. 키가 없으면 안내 문구로 대체.
import { findStock, toKRW } from './universe.js';
import { findTerm, TERMS } from './terms.js';
import { getState, canAddPet, priceAt, currentWeek, quoteOf, planView, josa, MAX_PETS } from './game.js';
import { db } from './db.js';
import { fetchNews } from './market.js';

const won = n => `${Math.round(n).toLocaleString('ko-KR')}원`;

// 매매 판단·종목 추천 요청 → 정해진 거절 (투자권유 방지 가드레일)
const GUARD = /(추천|뭐\s*살|뭘\s*사|살까|사야\s*(해|하|할|돼|되|될|지)|팔아야|팔까|매도할까|매수할까|오를까|떨어질까|전망|목표가)/;

const REASONS = [
  { label: '돈이 빠듯해', say: '돈이 빠듯해' },
  { label: '떨어져서 무서워', say: '떨어져서 무서워' },
  { label: '다른 데 쓸래', say: '다른 데 쓸래' },
  { label: '바로 해지할래', say: '바로 해지할래' },
];

function parseAmount(text) {
  const t = text.replace(/,/g, '');
  let m = t.match(/(\d+(?:\.\d+)?)\s*만\s*원?/);
  if (m) return Math.round(parseFloat(m[1]) * 10000);
  m = t.match(/(\d+)\s*천\s*원?/);
  if (m) return parseInt(m[1]) * 1000;
  if (/천\s*원/.test(t)) return 1000;
  if (/만\s*원/.test(t)) return 10000;
  m = t.match(/(\d{4,})\s*원?/);
  if (m) return parseInt(m[1]);
  return null;
}

function statusReply(v) {
  if (v.paused === 'p4') return `지금은 쉬는 중이야. 모은 조각은 ${v.shares.toFixed(2)}주, 넣은 돈은 ${won(v.principal)}이야.`;
  return `지금 ${v.stock} **${v.shares.toFixed(2)}주**를 모았어. 넣은 돈은 ${won(v.principal)}이고, ` +
    (v.weeksToOne ? `지금처럼 매주 ${v.amountLabel}이면 1주까지 약 ${v.weeksToOne}주 남았어.` : '1주를 다 채웠어!');
}

async function llmReply(message, v) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  try {
    const r = await fetch(process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(10000),
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        max_tokens: 300,
        messages: [
          { role: 'system', content:
            `너는 키움증권 모의 서비스의 주식 펫 "${v?.name || '큐밍'}"이야. 반말로 친근하게 2~3문장으로 답해. ` +
            '사용자가 매주 소수점 주식을 꾸준히 모으도록 돕는 게 역할이야. 특정 종목 추천, 매수·매도 권유, 주가 전망은 절대 하지 마. ' +
            '사실과 개념 설명만 해. ' + (v ? '사용자 현황: ' + statusReply(v) : '') },
          { role: 'user', content: message },
        ],
      }),
    });
    if (!r.ok) return null;
    return (await r.json()).choices?.[0]?.message?.content?.trim() || null;
  } catch { return null; }
}

export async function handleMessage(message, planId) {
  const text = message.trim();
  const p = planId ? db.prepare('SELECT * FROM plans WHERE id=?').get(planId) : null;
  const v = p ? planView(p) : null;
  const stock = findStock(text);

  // 1) 그만두고 싶을 때 — 이유 묻기 → 대안
  if (v && /(그만\s*모을래|그만할래|해지할래|해지하고|해지\s*할|그만\s*둘래)/.test(text) && !/바로/.test(text)) {
    return { reply: '무슨 일 있어? 이유를 알려 주면 방법을 같이 찾아볼게.\n바로 해지도 할 수 있어.', card: { type: 'choices', options: REASONS } };
  }
  if (v && /돈이\s*빠듯/.test(text)) {
    return { reply: '그럴 수 있어. 그만두는 대신 이렇게도 할 수 있어.', card: { type: 'choices', options: [
      { label: '1천원으로 줄이기', action: 'down' }, { label: '4주 쉬기', action: 'pause' }, { label: '그래도 해지', say: '바로 해지할래' }] } };
  }
  if (v && /떨어져서\s*무서/.test(text)) {
    return { reply: `앞으로 어떻게 될지는 나도 몰라. 대신 지금까지의 사실은 이래.\n넣은 돈 **${won(v.principal)}** · 모은 조각 **${v.shares.toFixed(2)}주**\n떨어진 주에는 같은 돈으로 조각을 더 많이 모았어.`,
      card: { type: 'choices', options: [{ label: '계속 모으기', action: 'keep' }, { label: '4주 쉬기', action: 'pause' }, { label: '그래도 해지', say: '바로 해지할래' }] } };
  }
  if (v && /다른\s*데\s*쓸래/.test(text)) {
    return { reply: '모은 조각은 그대로 두고, 적립만 멈출 수도 있어.', card: { type: 'choices', options: [
      { label: '적립만 멈추기', action: 'stop' }, { label: '그래도 해지', say: '바로 해지할래' }] } };
  }
  if (v && /바로\s*해지/.test(text)) {
    return { reply: '알겠어. 아래에서 확인해 줘.', card: { type: 'end', planId: v.id, status: 'pending',
      sub: `매주 ${v.amountLabel} 자동 적립이 멈춰요. 지금까지 모은 ${v.shares.toFixed(2)}주는 계좌에 그대로 남고, 언제든 다시 시작할 수 있어요.` } };
  }
  if (v && /다시\s*모을래/.test(text)) {
    if (!v.paused) return { reply: `지금도 매주 ${v.amountLabel}씩 잘 모으고 있어!` };
    return { reply: '다시 모아 볼까? 확인만 눌러 줘.', card: { type: 'choices', options: [{ label: '다시 모으기 시작', action: 'resume' }] } };
  }

  // 2) 가드레일
  if (GUARD.test(text)) {
    let msg = '**뭘 사고팔지는 내가 정해 줄 수 없어.** 그건 네가 결정할 일이야.\n대신 이건 말해 줄 수 있어: 매주 같은 금액으로 모으면 가격이 내릴 때 **더 많은 조각**을 모으게 돼(정액분할매수).';
    if (v) msg += `\n지금 나는 ${v.shares.toFixed(2)}주까지 자랐어.`;
    return { reply: msg };
  }

  // 3) 새 펫 데려오기
  if (/(모을|모으|모아|적립|키울|키우고|데려)/.test(text) && stock) {
    const amount = parseAmount(text) || 5000;
    const slot = canAddPet();
    const st = getState();
    if (st.active.some(a => a.code === stock.code)) return { reply: `${josa(stock.name, '은', '는')} 이미 모으고 있어! 홈에서 옆으로 넘겨 봐.` };
    if (!slot.ok) return { reply: `펫은 ${MAX_PETS}마리까지 키울 수 있어. 한 마리가 1주를 채우면 자리가 생겨. 여러 회사를 한 번에 담고 싶다면 ETF 펫 하나로 나눠 담는 방법도 있어.` };
    const priceKRW = toKRW(stock, priceAt(stock.code, currentWeek()));
    const weeksToOne = Math.ceil(priceKRW / amount);
    const card = { type: 'plan', code: stock.code, stock: stock.name, sector: stock.sector, char: stock.char, amount, priceKRW: Math.round(priceKRW), weeksToOne, status: 'pending' };
    let msg = `좋아! **${stock.name}** 알을 이렇게 받을게. 확인해 줘.`;
    if (weeksToOne > 52) msg += `\n참고로 이 금액이면 1주까지 약 ${weeksToOne}주가 걸려. 천천히 자라도 괜찮다면 그대로, 빨리 키우고 싶다면 금액을 바꿔 봐.`;
    return { reply: msg, card };
  }
  if (/(새\s*펫|데려올래|추가할래)/.test(text)) {
    return { reply: '좋아! 어떤 종목을 모아 볼래? 이름과 금액을 말해 줘.\n예: "매주 5천원씩 S&P500 모을래"', card: { type: 'choices', options: [
      { label: 'S&P500', say: '매주 5천원씩 S&P500 모을래' }, { label: '애플', say: '매주 5천원씩 애플 모을래' }, { label: '카카오', say: '매주 5천원씩 카카오 모을래' }], note: '아래는 입력 예시예요' } };
  }

  // 4) 내 현황
  if (v && /(얼마|현황|모았|자랐|지금까지|요약)/.test(text)) return { reply: statusReply(v) };

  // 5) 용어
  const term = findTerm(text);
  if (term && !stock) return { reply: `**${term.key}**\n${term.text}` };

  // 6) 회사 소개 (+ 뉴스는 주 1회 한 줄 요약 원칙: 최신 1건만)
  const about = stock || (v && /(회사|뭐\s*하는|뭐하는)/.test(text) ? { ...v, name: v.stock } : null);
  if (about) {
    const code = about.code;
    const s = stock || { name: v.stock, sector: v.sector, overview: v.overview };
    const news = await fetchNews(s.name);
    let msg = `**${s.name}** · ${s.sector}\n${s.overview}이야.`;
    if (news.length) msg += `\n최근 소식 한 줄: ${news[0]}`;
    if (stock && !(v && v.code === stock.code)) msg += `\n이 펫을 키우고 싶으면 **"매주 5천원씩 ${stock.name} 모을래"**라고 말해 줘.`;
    return { reply: msg, card: quoteOf(code) };
  }

  // 7) 자유 대화
  const llm = await llmReply(text, v);
  if (llm) return { reply: llm };
  return { reply: `이런 걸 할 수 있어!\n• "얼마나 자랐어?" — 내 현황\n• "어떤 회사야?" — 회사 소개\n• "ETF가 뭐야?" — 용어 (${TERMS.slice(0, 3).map(t => t.key).join(', ')} 등)\n• "새 펫 데려올래" — 다른 종목 모으기` };
}
