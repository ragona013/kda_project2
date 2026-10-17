// 홈 — 이번 주: 펫 말풍선 · 색이 차오르는 펫 · 최근 8번의 금요일 · 말 걸기 / 밥 주기
import PetReveal from '../components/PetReveal.jsx';
import Icon from '../components/Icon.jsx';
import { look } from '../chars';
import { md, daysToFriday, fmtSh } from '../api';

function remainText(p) {
  if (p.paused === 'p4') return `4주 쉬고 ${md(p.resumeDate)}에 다시 모아요`;
  if (p.paused === 'stop') return '모은 조각은 그대로, 적립만 멈췄어요';
  if (p.progress >= 1) return '1주를 다 채웠어요';
  return `1주까지 ${(1 - p.progress).toFixed(2)}주 · 약 ${p.weeksToOne}주 남음`;
}
const stageText = p => (p.paused === 'p4' ? '쉬는 중' : p.paused === 'stop' ? '적립 멈춤' : p.stageName);

export default function Home({ st, idx, setIdx, theme, fedJust, feeding, onFeed, onChat, onBubble, onTown, onQr, onMenu }) {
  const pets = st.active;
  const n = pets.length;
  const cur = n ? pets[Math.min(idx, n - 1)] : null;
  const L = cur ? look(theme, cur.char) : null;
  const dtf = daysToFriday();
  const ended = st.week >= st.lastWeek;

  return (
    <div className="home">
      <div className="home-top">
        <div>
          <div className="sub">{md(st.nextDate)} 금요일 · 모의 {st.week + 1}주차</div>
          <h1 className="display">{fedJust ? '이번 주 밥을 줬어요' : dtf === 0 ? '오늘은 금요일' : `금요일까지 ${dtf}일`}</h1>
        </div>
        <div className="top-actions">
          <button className="icon-btn" onClick={onQr} aria-label="키움페이 QR 스캔"><Icon name="qr" /></button>
          <button className="icon-btn" onClick={onTown} aria-label="조각 마을과 도감 열기">
            <Icon name="home" />
            <span className="badge">{st.dex.length}</span>
          </button>
          <button className="icon-btn" onClick={onMenu} aria-label="메뉴"><Icon name="more" /></button>
        </div>
      </div>

      {!cur && (
        <div className="empty-card">
          <div className="display">아직 키우는 펫이 없어요</div>
          <p>QR로 친구 초대를 받거나, 큐밍에게 "매주 5천원씩 S&P500 모을래"라고 말해 보세요.</p>
          <div className="row2">
            <button className="btn ghost" onClick={onQr}>QR로 시작</button>
            <button className="btn dark" onClick={() => onChat(null)}>큐밍에게 말하기</button>
          </div>
        </div>
      )}

      {cur && (
        <>
          <button className="bubble" onClick={() => onBubble(cur)} aria-label="펫이 보낸 이번 주 메시지 열기">
            <span className="face" style={{ background: L.tint }}><img src={L.img} alt="" /></span>
            <span className="bubble-text">{cur.bubble}</span>
            <Icon name="next" size={18} color="#8A8F9C" />
          </button>

          <div className="pet-card" style={{ background: L.tint }}>
            <div className="pet-card-top">
              <span className="pill">{cur.stock} · 매주 {cur.amountLabel}</span>
              <span className="stage">{stageText(cur)}</span>
            </div>
            <PetReveal theme={theme} char={cur.char} progress={cur.progress} size={232} faded={!!cur.paused} line
              label={fmtSh(cur.shares)} alt={`${cur.name}, ${fmtSh(cur.shares)} 모음`} />
            <div className="pet-name display">{cur.name}</div>
            <div className="pet-remain">{remainText(cur)}</div>
            {n > 1 && <>
              <button className="nav prev" onClick={() => setIdx((idx - 1 + n) % n)} aria-label="이전 펫"><Icon name="back" size={20} /></button>
              <button className="nav next" onClick={() => setIdx((idx + 1) % n)} aria-label="다음 펫"><Icon name="next" size={20} /></button>
            </>}
          </div>

          <div className="dots">{pets.map((p, i) => <span key={p.id} className={i === Math.min(idx, n - 1) ? 'on' : ''} />)}</div>
        </>
      )}

      <div className="fridays">
        <div className="fridays-head"><span>최근 8번의 금요일</span><span>{st.fridays.filter(x => x === 1).length}번 밥 먹음</span></div>
        <div className="fridays-grid">
          {st.fridays.map((f, i) => <span key={i} className={f === 1 ? 'fed' : f === -1 ? 'wait' : ''} />)}
        </div>
      </div>

      <div className="spacer" />
      <div className="home-actions">
        <button className="btn dark grow" onClick={() => onChat(cur)}>
          <Icon name="chat" size={20} stroke={1.8} />{cur ? `${cur.name}에게 말 걸기` : '큐밍에게 말 걸기'}
        </button>
        <button className="btn feed" onClick={onFeed} disabled={feeding || ended}>
          {feeding ? '먹는 중' : ended ? '모의 끝' : '밥 주기'}<small>모의 금요일</small>
        </button>
      </div>
    </div>
  );
}
