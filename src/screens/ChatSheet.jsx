// 펫에게 말 걸기 — 아래에서 올라오는 대화 시트 (펫마다 대화가 따로 쌓임)
// 목적: 최대한 오래 모으게 돕기 — 그만두고 싶을 때 이유를 묻고 대안(줄이기·쉬기·멈추기)을 보여 줌
import { useEffect, useRef, useState } from 'react';
import { api, won, fmtSh } from '../api';
import { look } from '../chars';
import Icon from '../components/Icon.jsx';

function Rich({ text }) {
  return text.split('\n').map((line, i) => (
    <p key={i}>{line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
      part.startsWith('**') && part.endsWith('**') ? <b key={j}>{part.slice(2, -2)}</b> : part)}</p>
  ));
}

const pct = n => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;

export default function ChatSheet({ pet, theme, intro, onClose, onState }) {
  const [chats, setChats] = useState([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [used, setUsed] = useState({});
  const list = useRef();
  const planId = pet?.id ?? null;
  const L = pet ? look(theme, pet.char) : null;

  useEffect(() => { api.chats(planId).then(setChats).catch(e => setErr(e.message)); }, [planId]);
  useEffect(() => { const el = list.current; if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }); }, [chats.length, busy]);

  const run = async fn => {
    if (busy) return;
    setBusy(true); setErr('');
    try { const r = await fn(); if (r.chats) setChats(r.chats); if (r.state) onState(r.state); }
    catch (e) { setErr(e.message); }
    setBusy(false);
  };
  const send = msg => { const m = (msg ?? text).trim(); if (!m) return; setText(''); run(() => api.send(m, planId)); };
  const choose = (chatId, o) => {
    setUsed(u => ({ ...u, [chatId]: true }));
    if (o.say) return send(o.say);
    run(() => api.manage(planId, o.action, { label: o.label }));
  };

  const shown = [...chats];
  if (intro && (!shown.length || shown.at(-1).content !== intro)) shown.push({ id: 'intro', role: 'pet', content: intro });

  const chips = !pet ? ['새 펫 데려올래', 'ETF가 뭐야?', '정액분할매수가 뭐야?']
    : pet.paused ? ['다시 모을래', '얼마나 자랐어?', '어떤 회사야?']
      : ['얼마나 자랐어?', '어떤 회사야?', '새 펫 데려올래', '그만 모을래', '이거 더 살까?'];

  return (
    <div className="sheet-wrap">
      <button className="sheet-dim" onClick={onClose} aria-label="대화 닫기" />
      <div className="sheet chat">
        <div className="chat-head">
          {pet ? <span className="face lg" style={{ background: L.tint }}><img src={L.img} alt="" /></span>
            : <span className="face lg" style={{ background: '#E8ECFF' }}><img src="/model/Kcharacter.png" alt="" /></span>}
          <div className="grow">
            <div className="display chat-name">{pet ? pet.name : '큐밍'}</div>
            <div className="sub">{pet ? `${pet.stock} · ${fmtSh(pet.shares)} · ${pet.paused === 'p4' ? '쉬는 중' : pet.stageName}` : '새 펫 데려오기 · 용어 질문'}</div>
          </div>
          <button className="icon-btn round" onClick={onClose} aria-label="닫기"><Icon name="close" size={18} /></button>
        </div>

        <div className="chat-list" ref={list}>
          {shown.map(c => c.role === 'user' ? (
            <div key={c.id} className="msg me">{c.content}</div>
          ) : (
            <div key={c.id} className="msg-group">
              <div className="msg pet"><Rich text={c.content} /></div>
              {c.card?.type === 'choices' && (
                <div className="choices">
                  {c.card.note && <span className="note">{c.card.note}</span>}
                  {c.card.options.map(o => (
                    <button key={o.label} className="choice" disabled={used[c.id] || busy} onClick={() => choose(c.id, o)}>{o.label}</button>
                  ))}
                </div>
              )}
              {c.card?.type === 'plan' && (
                <div className="card-box">
                  <div className="card-row">
                    <span className="egg" />
                    <div><b>{c.card.stock} 알</b><div className="sub">매주 금요일 {won(c.card.amount)} · 1주까지 약 {c.card.weeksToOne}주</div></div>
                  </div>
                  <div className="fine">예상 수익은 보여 드리지 않아요. 확인을 누르면 첫 조각을 바로 모아요.</div>
                  {c.card.status === 'done' ? <div className="done-box">알을 받았어요</div>
                    : <button className="btn dark" disabled={busy} onClick={() => run(() => api.createPlan(c.card.code, c.card.amount, { chatId: c.id, planId }))}>알 받기</button>}
                </div>
              )}
              {c.card?.type === 'end' && (
                <div className="card-box">
                  <b>정기 적립 해지</b>
                  <div className="card-sub">{c.card.sub}</div>
                  {c.card.status === 'done' ? <div className="done-box">{c.card.doneText}</div> : (
                    <div className="row2">
                      <button className="btn ghost" disabled={busy} onClick={() => run(() => api.manage(c.card.planId, 'keep', { cardChatId: c.id }))}>다시 생각할래</button>
                      <button className="btn dark" disabled={busy} onClick={() => run(() => api.manage(c.card.planId, 'end', { cardChatId: c.id }))}>해지하기</button>
                    </div>
                  )}
                </div>
              )}
              {c.card?.type === 'stock' && (
                <div className="card-box quote">
                  <div className="card-row">
                    <img src={look(theme, c.card.char).img} alt="" className="quote-face" />
                    <div className="grow"><b>{c.card.name}</b><div className="sub">{c.card.sector} · {c.card.date}{c.card.source !== 'real' ? ' · 모의 시세' : ''}</div></div>
                    <div className="quote-price"><b>{won(c.card.priceKRW)}</b><span className={c.card.weekChangePct >= 0 ? 'up' : 'down'}>{pct(c.card.weekChangePct)}</span></div>
                  </div>
                  {(!pet || pet.code !== c.card.code) && <button className="btn ghost" onClick={() => send(`매주 5천원씩 ${c.card.name} 모을래`)}>이 펫 데려오기</button>}
                </div>
              )}
            </div>
          ))}
          {busy && <div className="msg pet typing"><i /><i /><i /></div>}
        </div>

        {err && <div className="err">{err}</div>}
        <div className="chips">{chips.map(c => <button key={c} onClick={() => send(c)} disabled={busy}>{c}</button>)}</div>
        <form className="composer" onSubmit={e => { e.preventDefault(); send(); }}>
          <label htmlFor="say" className="sr">펫에게 할 말</label>
          <input id="say" value={text} onChange={e => setText(e.target.value)} placeholder={`${pet ? pet.name : '큐밍'}에게 말해 보세요`} autoComplete="off" enterKeyHint="send" />
          <button className="send" disabled={busy || !text.trim()} aria-label="보내기"><Icon name="send" size={20} stroke={2.2} /></button>
        </form>
      </div>
    </div>
  );
}
