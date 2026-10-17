async function req(path, opts = {}) {
  const r = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || `요청 실패 (${r.status})`);
  return data;
}

export const api = {
  state: () => req('/state'),
  chats: planId => req(`/chats?planId=${planId ?? ''}`),
  send: (message, planId) => req('/chat', { method: 'POST', body: { message, planId } }),
  createPlan: (code, amount, opts = {}) => req('/plans', { method: 'POST', body: { code, amount, ...opts } }),
  manage: (id, action, opts = {}) => req(`/plans/${id}/manage`, { method: 'POST', body: { action, ...opts } }),
  next: weeks => req('/sim/next', { method: 'POST', body: { weeks } }),
  diary: id => req(`/plans/${id}/diary`),
  boost: (id, mode) => req(`/plans/${id}/boost`, { method: 'POST', body: { mode } }),
  theme: theme => req('/theme', { method: 'POST', body: { theme } }),
  account: has => req('/account', { method: 'POST', body: { has } }),
  reset: demo => req('/reset', { method: 'POST', body: { demo } }),
};

export const won = n => `${Math.round(n || 0).toLocaleString('ko-KR')}원`;
// 조각 수 표기: 아주 작으면 소수 넷째 자리까지
export const fmtSh = n => `${Math.min(1, n || 0).toFixed((n || 0) < 0.01 ? 4 : 2)}주`;
export const md = d => { if (!d) return ''; const [, m, dd] = d.split('-').map(Number); return `${m}월 ${dd}일`; };
export const ymd = d => (d ? d.replaceAll('-', '.') : '');

// 받침에 따라 조사 고르기
export function josa(word, withB, withoutB) {
  const ch = String(word).trim().slice(-1);
  const code = ch.charCodeAt(0) - 0xAC00;
  let b;
  if (code >= 0 && code < 11172) b = code % 28 !== 0;
  else if (/[0-9]/.test(ch)) b = '013678'.includes(ch);
  else b = /[lmnr]/i.test(ch);
  return word + (b ? withB : withoutB);
}

// 실제 오늘 기준 다음 금요일까지 남은 날
export function daysToFriday(now = new Date()) {
  const d = (5 - now.getDay() + 7) % 7;
  return d;
}
