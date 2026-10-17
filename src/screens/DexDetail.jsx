// 도감 한 장 — 캐릭터 · 소개 · 함께한 금요일 · 금요일마다 모은 조각 · 성장 기록
import { useEffect, useState } from 'react';
import { api, won, md, ymd, josa } from '../api';
import { look } from '../chars';
import Icon from '../components/Icon.jsx';

export default function DexDetail({ id, theme, onBack }) {
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { api.diary(id).then(setD).catch(e => setErr(e.message)); }, [id]);

  if (err) return <div className="detail"><button className="icon-btn plain" onClick={onBack} aria-label="뒤로"><Icon name="back" /></button><div className="err">{err}</div></div>;
  if (!d) return <div className="detail"><div className="loading">불러오는 중…</div></div>;

  const p = d.plan;
  const L = look(theme, p.char);
  const recent = d.buys.slice(-20);
  const mx = Math.max(...recent.map(b => b.shares)), mn = Math.min(...recent.map(b => b.shares));
  const bestIdx = recent.findIndex(b => b.shares === mx);
  const desc = theme === 'A'
    ? `${p.overview}. 이 회사를 모은 큐밍이라 ${L.wear} 있어요.`
    : `${p.overview}. ${L.acc} 회사는 ${josa(p.name, '이', '가')} 맡아요.`;

  return (
    <div className="detail">
      <div className="detail-top">
        <button className="icon-btn plain" onClick={onBack} aria-label="뒤로"><Icon name="back" /></button>
        <span className="sub strong">도감 No.{String(p.dexNo).padStart(3, '0')}</span>
      </div>
      <div className="detail-body">
        <div className="detail-hero" style={{ background: L.tint }}>
          <img src={L.img} alt={p.name} />
          <span className="stamp md">1주<br />완성</span>
          <div className="display detail-name">{p.name}</div>
          <div className="sub dark">{p.stock} · {p.sector}</div>
          <div className="tags">
            {theme === 'A' ? <>
              <span>종 · 큐밍</span><span>소품 · {L.acc}</span><span>몸 색 · {L.color}</span>
            </> : <>
              <span>캐릭터 · {p.name}</span><span>업종 담당 · {L.acc}</span>
            </>}
          </div>
        </div>
        <p className="detail-desc">{desc}</p>
        <div className="grid3">
          <div className="stat"><span>함께한 금요일</span><b>{p.buys}번</b></div>
          <div className="stat"><span>넣은 돈</span><b>{won(p.principal)}</b></div>
          <div className="stat"><span>매주</span><b>{p.amountLabel}</b></div>
        </div>
        <div className="bars-card">
          <b>금요일마다 모은 조각</b>
          <div className="sub">최근 {recent.length}번 · 같은 돈이라도 가격이 낮은 주엔 조각이 커요</div>
          <div className="bars">
            {recent.map((b, i) => (
              <span key={i} title={`${b.date} · ${b.shares.toFixed(4)}주`} className={i === bestIdx ? 'best' : ''}
                style={{ height: `${30 + 70 * (b.shares - mn) / ((mx - mn) || 1)}%` }} />
            ))}
          </div>
          <div className="bars-axis"><span>{md(recent[0]?.date)}</span><span>{md(recent.at(-1)?.date)}</span></div>
        </div>
        <div className="log">
          <b>성장 기록</b>
          {[
            { t: '알이 도착했어요', s: `${ymd(p.createdDate)} · 매주 ${p.amountLabel}로 시작`, c: 'start' },
            { t: '조각을 가장 크게 모은 금요일', s: `${ymd(recent[bestIdx]?.date)} · 가격이 낮았던 주`, c: 'best' },
            { t: '1주 완성, 조각 마을로 이사', s: `${ymd(p.graduatedDate)} · 금요일 ${p.buys}번째`, c: 'end' },
          ].map((l, i, a) => (
            <div key={i} className="log-row">
              <div className="log-rail"><span className={`log-dot ${l.c}`} />{i < a.length - 1 && <i />}</div>
              <div><div className="log-t">{l.t}</div><div className="sub">{l.s}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
