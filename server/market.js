// 주간 시세 — 한국: 네이버 금융, 미국: Yahoo Finance
// 실서비스에서는 키움 공식 MCP(kiwoom-exec-mcp)의 시세 조회로 교체
// 네트워크가 막히면 종목별 고정 시드의 모의 시세로 대체 (오프라인 데모용)
import { UNIVERSE } from './universe.js';

export const SIM_WEEKS = 60; // 모의 기간: 최근 60주

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';

// 최근 60주 금요일 날짜 (오래된 순)
export function weekCalendar(now = new Date()) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const back = (d.getDay() + 2) % 7 || 7; // 직전 금요일
  d.setDate(d.getDate() - back);
  const out = [];
  for (let i = SIM_WEEKS - 1; i >= 0; i--) {
    const w = new Date(d);
    w.setDate(d.getDate() - i * 7);
    out.push(`${w.getFullYear()}-${String(w.getMonth() + 1).padStart(2, '0')}-${String(w.getDate()).padStart(2, '0')}`);
  }
  return out;
}

const ymd = s => s.replaceAll('-', '');

async function fetchKR(code, start, end) {
  const url = `https://api.finance.naver.com/siseJson.naver?symbol=${code}&requestType=1&startTime=${ymd(start)}&endTime=${ymd(end)}&timeframe=day`;
  const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(6000) });
  const rows = JSON.parse((await r.text()).replace(/'/g, '"'));
  return rows
    .filter(row => /^\d{8}$/.test(String(row?.[0])))
    .map(row => ({ date: `${String(row[0]).slice(0, 4)}-${String(row[0]).slice(4, 6)}-${String(row[0]).slice(6, 8)}`, close: Number(row[4]) }))
    .filter(p => p.close > 0);
}

async function fetchUS(code) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${code}?interval=1d&range=2y`;
  const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(6000) });
  const res = (await r.json())?.chart?.result?.[0];
  const ts = res?.timestamp || [];
  const cl = res?.indicators?.quote?.[0]?.close || [];
  return ts.map((t, i) => ({ date: new Date(t * 1000).toISOString().slice(0, 10), close: cl[i] }))
    .filter(p => p.close > 0);
}

// 일봉 → 주간 달력(금요일) 기준 종가로 정렬
function alignToWeeks(daily, weeks) {
  if (!daily.length) return null;
  daily.sort((a, b) => a.date.localeCompare(b.date));
  const out = [];
  let j = 0, last = null;
  for (const w of weeks) {
    while (j < daily.length && daily[j].date <= w) { last = daily[j].close; j++; }
    out.push(last ?? daily[0].close);
  }
  return out;
}

// 결정적 모의 시세 (종목코드 시드 랜덤워크)
function synthetic(stock, n) {
  let seed = [...stock.code].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  const vol = stock.sector === 'ETF' ? 0.022 : 0.045;
  const drift = 0.002;
  const out = [];
  let p = stock.base * 0.85;
  for (let i = 0; i < n; i++) {
    const shock = (rnd() + rnd() + rnd() - 1.5) * 2 * vol;
    p = p * (1 + drift + shock);
    out.push(stock.market === 'US' ? Math.round(p * 100) / 100 : Math.round(p / 50) * 50);
  }
  return out;
}

export async function loadWeeklyPrices(weeks) {
  const start = new Date(weeks[0]); start.setDate(start.getDate() - 14);
  const startStr = start.toISOString().slice(0, 10);
  const result = {};
  let realCount = 0;
  await Promise.all(UNIVERSE.map(async s => {
    let series = null;
    try {
      const daily = s.market === 'KR' ? await fetchKR(s.code, startStr, weeks.at(-1)) : await fetchUS(s.code);
      series = alignToWeeks(daily, weeks);
    } catch { /* 네트워크 차단 → 모의 시세 */ }
    if (series) realCount++;
    result[s.code] = { closes: series || synthetic(s, weeks.length), source: series ? 'real' : 'mock' };
  }));
  return { prices: result, source: realCount === UNIVERSE.length ? 'real' : realCount ? 'mixed' : 'mock' };
}

// 종목 뉴스 (네이버 검색 API 키가 있을 때만)
export async function fetchNews(query) {
  const id = process.env.naver_Client_ID, secret = process.env.Client_Secret;
  if (!id || !secret) return [];
  try {
    const r = await fetch(`https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(query)}&display=3&sort=date`, {
      headers: { 'X-Naver-Client-Id': id, 'X-Naver-Client-Secret': secret }, signal: AbortSignal.timeout(5000),
    });
    const d = await r.json();
    return (d.items || []).map(n => n.title.replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
  } catch { return []; }
}
