// SQLite (Node 내장 node:sqlite) — 플랜·주간 매수 기록·펫별 대화·설정
let DatabaseSync;
try { ({ DatabaseSync } = await import('node:sqlite')); }
catch {
  console.error('\n[stock-pet] Node.js 22.5 이상이 필요해요 (내장 SQLite 사용). 현재: ' + process.version + '\n  → brew upgrade node  또는  nvm install 22\n');
  process.exit(1);
}
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = process.env.DATA_DIR || path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');
mkdirSync(dir, { recursive: true });

export const db = new DatabaseSync(path.join(dir, 'pet.db'));

// 예전 구조(v1)의 DB면 지우고 새로 만든다 → 첫 실행 때 데모 데이터가 다시 채워짐
const cols = db.prepare('PRAGMA table_info(plans)').all().map(c => c.name);
if (cols.length && !cols.includes('dex_no')) {
  db.exec('DROP TABLE IF EXISTS plans; DROP TABLE IF EXISTS buys; DROP TABLE IF EXISTS chats; DROP TABLE IF EXISTS meta;');
}

db.exec(`
  CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);
  CREATE TABLE IF NOT EXISTS plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL,
    amount INTEGER NOT NULL,                 -- 주간 적립액 (원)
    status TEXT NOT NULL DEFAULT 'active',   -- active | graduated
    paused TEXT,                             -- NULL | p4(4주 쉬기) | stop(적립만 멈춤) | end(해지)
    pause_until INTEGER,                     -- p4일 때 다시 모으는 주차
    created_week INTEGER NOT NULL,
    graduated_week INTEGER,
    dex_no INTEGER                           -- 도감 번호 (1주 완성 순서)
  );
  CREATE TABLE IF NOT EXISTS buys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER NOT NULL,
    week INTEGER NOT NULL,
    price REAL NOT NULL,                     -- 체결가 (현지 통화)
    price_krw REAL NOT NULL,
    shares REAL NOT NULL,
    amount INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER,                         -- 어느 펫과의 대화인지
    role TEXT NOT NULL,                      -- user | pet
    content TEXT NOT NULL,
    card TEXT,                               -- 카드 JSON (입양 확인·선택지·해지 확인·시세)
    week INTEGER
  );
`);

export const getMeta = (k, d = null) => db.prepare('SELECT value FROM meta WHERE key=?').get(k)?.value ?? d;
export const setMeta = (k, v) => db.prepare('INSERT INTO meta(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(k, String(v));

export function resetAll() {
  const keep = ['theme', 'theme_default'].map(k => [k, getMeta(k)]);
  db.exec('DELETE FROM plans; DELETE FROM buys; DELETE FROM chats; DELETE FROM meta;');
  for (const [k, v] of keep) if (v != null) setMeta(k, v);
}
