// 키움페이 QR 간편결제 — 첫 조각 결제 + 매주 자동 구독
//   계좌 있음 → 결제 → 지문 인증 → 완료 (알 도착)
//   계좌 없음 → 비대면 개설 4단계 → 결제 화면으로 복귀
import { useState } from 'react';
import { api, won, md } from '../api';
import { look } from '../chars';
import Icon from '../components/Icon.jsx';

const INVITES = [
  { code: 'SPY', stock: 'S&P500 ETF' },
  { code: 'QQQ', stock: '나스닥100 ETF' },
  { code: '069500', stock: 'KODEX 200' },
];
const SIGN = [
  ['휴대폰 본인 확인', '이름과 휴대폰 번호로 확인'],
  ['신분증 촬영', '주민등록증이나 운전면허증'],
  ['내 은행 계좌 확인', '1원 입금 문구로 본인 계좌 확인'],
  ['비밀번호 정하기', '계좌 비밀번호와 간편 인증 등록'],
];
// 장식용 QR 모양 (11×11)
const QR = Array.from({ length: 121 }, (_, i) => {
  const r = Math.floor(i / 11), c = i % 11;
  const f = (rr, cc) => rr >= 0 && rr < 3 && cc >= 0 && cc < 3;
  return f(r, c) || f(r, c - 8) || f(r - 8, c) || (r * 7 + c * 13 + r * c) % 5 < 2;
});

export default function QrFlow({ st, theme, onClose, onState, onDone }) {
  const [step, setStep] = useState('scan');
  const [amt, setAmt] = useState(1000);
  const [sub, setSub] = useState(true);
  const [sign, setSign] = useState(0);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [newId, setNewId] = useState(null);
  const has = st.account.has;
  const [invite] = useState(() => INVITES.find(x => !st.active.some(a => a.code === x.code)) || INVITES[0]);
  const L = look(theme, 'etf');
  const petName = theme === 'A' ? '큐밍' : '도룡이';

  const setHas = async v => { const s = await api.account(v); onState(s); setSign(0); };
  const pay = async () => {
    setBusy(true); setErr('');
    try {
      const r = await api.createPlan(invite.code, amt, { recurring: sub });
      onState(r.state); setNewId(r.plan.id); setStep('paid');
    } catch (e) { setErr(e.message); setStep('pay'); }
    setBusy(false);
  };

  if (step === 'scan') return (
    <div className="overlay qr">
      <div className="bar-top"><button className="icon-btn plain" onClick={onClose} aria-label="닫기"><Icon name="close" size={20} /></button><b>키움페이 QR</b><span className="w44" /></div>
      <div className="viewfinder">
        <div className="vf-box">
          <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
          <div className="qr-code">{QR.map((on, i) => <span key={i} className={on ? 'on' : ''} />)}</div>
          <span className="scanline" />
        </div>
        <p>친구가 보낸 펫 초대 QR을<br />네모 안에 비춰 주세요</p>
      </div>
      <div className="qr-bottom">
        <div className="seg-row"><span className="sub">체험할 상황</span>
          <div className="seg grow">
            <button className={has ? 'on' : ''} aria-pressed={has} onClick={() => setHas(true)}>계좌 있음</button>
            <button className={!has ? 'on' : ''} aria-pressed={!has} onClick={() => setHas(false)}>계좌 없음</button>
          </div>
        </div>
        <button className="btn dark wide" onClick={() => setStep('pay')}>QR 인식하기 (모의)</button>
      </div>
    </div>
  );

  if (step === 'signup') return (
    <div className="overlay qr">
      <div className="bar-top"><button className="icon-btn plain" onClick={() => setStep('pay')} aria-label="뒤로"><Icon name="back" /></button><b>키움증권 계좌 만들기</b><span className="w44" /></div>
      <div className="sign-hero">
        <span className="egg big" />
        <div><div className="display">계좌가 생기면<br />알이 바로 도착해요</div><div className="sub">{invite.stock} {petName} 알 · {won(amt)}</div></div>
      </div>
      <div className="sign-steps">
        {SIGN.map(([t, s], i) => {
          const done = i < sign, now = i === sign;
          return (
            <div key={t} className="sign-row">
              <div className="log-rail"><span className={`sign-dot ${done ? 'done' : now ? 'now' : ''}`}>{done ? <Icon name="check" size={14} stroke={3} /> : i + 1}</span>{i < SIGN.length - 1 && <i className={done ? 'done' : ''} />}</div>
              <div><div className={`log-t ${done || now ? '' : 'muted'}`}>{t}</div><div className="sub">{done ? '완료' : s}</div></div>
            </div>
          );
        })}
        <div className="fine">모의 화면이에요. 실제 개설은 키움증권 비대면 계좌 개설 절차를 따릅니다.</div>
      </div>
      <div className="qr-bottom">
        <button className="btn dark wide" onClick={async () => { if (sign >= 4) { await setHas(true); setStep('pay'); } else setSign(sign + 1); }}>
          {sign >= 4 ? '개설 완료, 결제로 돌아가기' : '다음 (모의)'}
        </button>
      </div>
    </div>
  );

  if (step === 'paid') return (
    <div className="overlay qr paid">
      <div className="paid-pet" style={{ background: L.tint }}>
        <img src={L.img} alt="" />
        <span className="check"><Icon name="check" size={26} stroke={3} /></span>
      </div>
      <h1 className="display">결제 완료</h1>
      <div className="sub dark">{invite.stock} {petName} 알이 도착했어요</div>
      <div className="receipt">
        <div><span>지금 결제</span><b>{won(amt)}</b></div>
        <div><span>자동 구독</span><b>{sub ? `매주 금요일 ${won(amt)}` : '꺼짐'}</b></div>
        <div><span>결제 계좌</span><b>키움증권 {st.account.masked}</b></div>
      </div>
      <div className="spacer" />
      <button className="btn dark wide" onClick={() => onDone(newId)}>펫 보러 가기</button>
    </div>
  );

  // pay + auth
  return (
    <div className="overlay qr">
      <div className="bar-top"><button className="icon-btn plain" onClick={() => setStep('scan')} aria-label="뒤로"><Icon name="back" /></button><div className="center"><b>키움페이</b><div className="sub">간편결제</div></div><span className="w44" /></div>
      <div className="pay-body">
        <div className="invite" style={{ background: L.tint }}>
          <img src={L.img} alt="" />
          <div><div className="sub">친구가 보낸 펫 초대</div><div className="display">{invite.stock} {petName} 알</div><div className="sub dark">ETF · 무리로 다니는 {petName}</div></div>
        </div>
        <div className="amt-head"><b>지금 첫 조각</b><span>{won(amt)}</span></div>
        <div className="grid3 amt">
          {[1000, 5000, 10000].map(v => <button key={v} className={amt === v ? 'on' : ''} aria-pressed={amt === v} onClick={() => setAmt(v)}>{won(v)}</button>)}
        </div>
        <div className="sub-row">
          <div className="grow"><b>매주 금요일 {won(amt)} 자동 구독</b><div className="sub">{sub ? `다음 결제 ${md(st.nextDate)} (금) · 언제든 해지` : '꺼져 있어요 · 이번 한 번만 결제'}</div></div>
          <button className={`switch ${sub ? 'on' : ''}`} role="switch" aria-checked={sub} aria-label="자동 구독" onClick={() => setSub(!sub)}><span /></button>
        </div>
        <b className="label">결제 수단</b>
        {has ? (
          <div className="method">
            <span className="kw">키움</span>
            <div><b>키움증권 계좌 {st.account.masked}</b><div className="sub">예수금이 모자라면 연결 은행에서 자동 충전</div></div>
          </div>
        ) : (
          <div className="method warn">
            <span className="kw warn"><Icon name="alert" size={20} /></span>
            <div><b>키움증권 계좌가 아직 없어요</b><div className="sub">비대면으로 만들면 이 화면으로 돌아와 바로 결제돼요</div></div>
          </div>
        )}
        <div className="fine">예상 수익은 보여 드리지 않아요. 자동 구독은 언제든 끄거나 금액을 바꿀 수 있어요.</div>
        {err && <div className="err">{err}</div>}
      </div>
      <div className="qr-bottom">
        <button className="btn dark wide" disabled={busy} onClick={() => setStep(has ? 'auth' : 'signup')}>{has ? `${won(amt)} 결제하기` : '계좌 만들고 알 받기'}</button>
      </div>
      {step === 'auth' && (
        <div className="sheet-wrap">
          <button className="sheet-dim" onClick={() => setStep('pay')} aria-label="취소" />
          <div className="sheet auth">
            <span className="finger"><Icon name="finger" size={44} stroke={1.6} /></span>
            <b>지문으로 결제할게요</b>
            <div className="sub">{won(amt)} · 키움증권 계좌 {st.account.masked}</div>
            <button className="btn dark wide" disabled={busy} onClick={pay}>{busy ? '결제 중…' : '인증하기 (모의)'}</button>
            <button className="btn plain" onClick={() => setStep('pay')}>취소</button>
          </div>
        </div>
      )}
    </div>
  );
}
