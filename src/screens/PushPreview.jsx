// 푸시 알림 미리보기 — 지금 내 펫 데이터로 만든 알림 + 보내는 규칙
import { look } from '../chars';
import { won, josa, md, fmtSh } from '../api';
import Icon from '../components/Icon.jsx';

const RULES = [
  '기본은 주 1회: 금요일 10시 적립 결과 한 통. 하락·연속 기록 소식도 이 한 통에 합쳐요',
  '따로 보내는 건 4가지뿐: 1주 완성 / 연속 기록 / 쉬기 끝나기 1주 전 / 적립 전날 잔액 부족',
  '밤 9시~아침 8시에는 보내지 않아요',
  '하락 알림은 사실만: 등락률·모은 조각. 예측·매수 권유 문구는 쓰지 않아요',
  '광고성 알림은 별도로 수신 동의한 사람에게만',
  '3주 연속 안 열면 월 1회 요약으로 줄여요',
];

function Noti({ img, tag, time, title, body, faded, onClick }) {
  return (
    <button className="noti" onClick={onClick}>
      <span className="kw">키움</span>
      <span className="noti-body">
        <span className="noti-meta"><span>{tag}</span><span>{time}</span></span>
        <b>{title}</b>
        <span className="noti-text">{body}</span>
      </span>
      {img && <img src={img} alt="" style={{ opacity: faded ? 0.5 : 1 }} />}
    </button>
  );
}

export default function PushPreview({ st, theme, onClose, onGo }) {
  const p = st.active.find(x => !x.paused) || st.active[0];
  const img = x => (x ? look(theme, x.char).img : null);
  const down = st.active.find(x => x.weekChangePct < 0 && !x.paused);
  const g = st.dex.at(-1);
  const streak = [...st.active].sort((a, b) => b.streak - a.streak)[0];
  const sleeper = st.active.find(x => x.paused === 'p4');

  return (
    <div className="overlay push">
      <div className="bar-top"><button className="icon-btn plain" onClick={onClose} aria-label="닫기"><Icon name="close" size={20} /></button><b>알림 미리보기</b><span className="w44" /></div>
      <div className="push-body">
        <div className="lock"><div>{md(st.nextDate)} 금요일</div><b>10:00</b></div>
        <div className="push-group">매주 금요일 10시, 한 통만</div>
        {p && <Noti img={img(p)} tag="평소 금요일" time="지금" title={`${josa(p.name, '이', '가')} 이번 주 밥을 먹었어요`}
          body={`${p.amountLabel} 적립 완료 · 이제 ${fmtSh(p.shares)}`} onClick={() => onGo('pet', p.id)} />}
        {(down || p) && (() => {
          const x = down || p; const c = down ? down.weekChangePct : -3;
          return <Noti img={img(x)} tag={down ? '떨어진 금요일' : '떨어진 금요일 (예시)'} time="지금" title={`${x.name} · 이번 주 ${c.toFixed(1)}%였어요`}
            body={`${x.amountLabel} 적립 완료. 같은 돈으로 조각을 ${(1 / (1 + c / 100)).toFixed(2)}배 모았어요`} onClick={() => onGo('chat', x.id)} />;
        })()}
        <div className="push-group">일이 있을 때만</div>
        {g && <Noti img={img(g)} tag="1주 완성" time="금 10:00" title={`${josa(g.name, '이', '가')} ${g.stock} 1주가 됐어요`} body="조각 마을로 이사할 준비가 끝났어요" onClick={() => onGo('detail', g.id)} />}
        {streak && <Noti img={img(streak)} tag="연속 기록" time="금 10:00" title={`${streak.name} · ${Math.max(4, Math.floor(streak.streak / 4) * 4)}주 연속 모았어요`} body={`넣은 돈이 ${won(Math.floor(streak.principal / 10000) * 10000)}을 넘었어요`} onClick={() => onGo('pet', streak.id)} />}
        {(sleeper || p) && <Noti img={img(sleeper || p)} faded tag="쉬기 끝나기 1주 전" time="금 10:00" title={`${josa((sleeper || p).name, '이', '가')} 다음 주에 깨어나요`}
          body={`${sleeper ? md(sleeper.resumeDate) : '다음 주 금요일'}부터 다시 모아요. 금액을 바꾸려면 눌러 주세요`} onClick={() => onGo('chat', (sleeper || p).id)} />}
        <Noti tag="적립 전날" time="목 18:00" title="내일 적립할 예수금이 모자라요" body={`연결 은행에서 ${won(st.stats.weeklyTotal || 10000)}을 자동으로 채워 둘게요`} onClick={() => onGo('home')} />
        <div className="rules">
          <b><Icon name="bell" size={18} /> 알림 보내는 규칙</b>
          <ul>{RULES.map(r => <li key={r}>{r}</li>)}</ul>
        </div>
      </div>
    </div>
  );
}
