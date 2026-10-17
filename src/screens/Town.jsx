// 조각 마을(모여 사는 곳) + 도감 목록
import PetReveal from '../components/PetReveal.jsx';
import Icon from '../components/Icon.jsx';
import { look } from '../chars';
import { fmtSh } from '../api';

const SLOTS = [[28, 290], [206, 280], [112, 390], [256, 420], [20, 510], [150, 530], [270, 550], [60, 180]];
const no = n => `No.${String(n).padStart(3, '0')}`;

export default function Town({ st, theme, tab, setTab, onBack, onDetail, onPet }) {
  const residents = [
    ...st.dex.map(p => ({ ...p, kind: 'done' })),
    ...st.active.map(p => ({ ...p, kind: 'grow' })),
    ...st.ended.map(p => ({ ...p, kind: 'ended' })),
  ].slice(-SLOTS.length);
  const cards = [
    ...st.dex.map(p => ({ ...p, kind: 'done' })),
    ...st.active.map(p => ({ ...p, kind: 'grow' })),
  ];
  while (cards.length < 8) cards.push({ kind: 'empty', id: `e${cards.length}` });

  return (
    <div className="town">
      <div className="town-top">
        <button className="icon-btn plain" onClick={onBack} aria-label="홈으로"><Icon name="back" /></button>
        <div className="seg">
          <button className={tab === 'village' ? 'on' : ''} aria-pressed={tab === 'village'} onClick={() => setTab('village')}>마을</button>
          <button className={tab === 'list' ? 'on' : ''} aria-pressed={tab === 'list'} onClick={() => setTab('list')}>도감</button>
        </div>
      </div>

      {tab === 'village' ? (
        <div className="village-wrap">
          <div className="town-title">
            <h1 className="display">조각 마을</h1>
            <div className="sub">1주를 채운 주민 {st.dex.length} · 자라는 중 {st.active.length}</div>
          </div>
          <div className="village">
            <div className="hill back" /><div className="hill back2" /><div className="ground" />
            <div className="pond" />
            <div className="tree t1"><i /><b /></div><div className="tree t2"><i /><b /></div>
            <div className="sign"><span>조각 마을</span><i /></div>
            {residents.map((r, i) => {
              const L = look(theme, r.char);
              return (
                <button key={r.id} className="resident" style={{ left: SLOTS[i][0], top: SLOTS[i][1] }}
                  onClick={() => (r.kind === 'done' ? onDetail(r.id) : r.kind === 'grow' ? onPet(r.id) : null)}
                  aria-label={r.kind === 'done' ? `${r.name} 도감 열기` : `${r.name} 키우는 화면으로`}>
                  {r.kind === 'done'
                    ? <img className="hop" style={{ animationDelay: `${i * 0.35}s` }} src={L.img} alt="" />
                    : <PetReveal theme={theme} char={r.char} progress={r.progress} size={88} faded={r.kind === 'ended' || !!r.paused} hop delay={i * 0.35} />}
                  <span className={`tag ${r.kind}`}>{r.kind === 'done' ? r.name : r.kind === 'ended' ? `${r.name} · 종료` : `${r.name} ${fmtSh(r.shares)}`}</span>
                </button>
              );
            })}
          </div>
          <div className="town-foot">주민을 누르면 도감 한 장이 열려요. 흐린 친구는 아직 자라는 중이에요.</div>
        </div>
      ) : (
        <div className="list-wrap">
          <div className="town-title">
            <h1 className="display">도감</h1>
            <div className="sub">1주를 채운 순서대로 번호가 붙어요.</div>
          </div>
          <div className="dex-grid">
            {cards.map(c => c.kind === 'empty' ? (
              <div key={c.id} className="dex-card empty"><span>빈 자리</span></div>
            ) : (
              <button key={c.id} className="dex-card" style={{ background: c.kind === 'done' ? look(theme, c.char).tint : '#F5F6F8' }}
                onClick={() => (c.kind === 'done' ? onDetail(c.id) : onPet(c.id))}>
                <span className="dex-no">{c.kind === 'done' ? no(c.dexNo) : '자라는 중'}</span>
                <PetReveal theme={theme} char={c.char} progress={c.kind === 'done' ? 1 : c.progress} size={108} />
                <span className="display dex-name">{c.name}</span>
                <span className="dex-sub">{c.stock} · {c.kind === 'done' ? `금요일 ${c.buys}번` : fmtSh(c.shares)}</span>
                {c.kind === 'done' && <span className="stamp">1주<br />완성</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
