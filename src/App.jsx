// 나만의 주식펫을 키움 — 앱 셸
//   홈(이번 주) → 펫에게 말 걸기 / 밥 주기 → 1주 완성 → 조각 마을·도감 → 도감 한 장
//   키움페이 QR 간편결제 · 알림 미리보기 · 캐릭터 테마 A/B
import { useEffect, useState } from 'react';
import { api } from './api';
import { THEME_LABEL } from './chars';
import Splash from './components/Splash.jsx';
import Home from './screens/Home.jsx';
import ChatSheet from './screens/ChatSheet.jsx';
import Graduate from './screens/Graduate.jsx';
import Town from './screens/Town.jsx';
import DexDetail from './screens/DexDetail.jsx';
import QrFlow from './screens/QrFlow.jsx';
import PushPreview from './screens/PushPreview.jsx';

// 보이는 화면 높이(키보드 제외)를 --app-h 로 고정 → 입력창이 항상 키보드 바로 위
function useAppViewport() {
  useEffect(() => {
    const vv = window.visualViewport;
    const update = () => {
      document.documentElement.style.setProperty('--app-h', `${vv ? vv.height : window.innerHeight}px`);
      window.scrollTo(0, 0);
    };
    update();
    vv?.addEventListener('resize', update);
    vv?.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    return () => {
      vv?.removeEventListener('resize', update);
      vv?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);
}

export default function App() {
  useAppViewport();
  const [st, setSt] = useState(null);
  const [loadErr, setLoadErr] = useState('');
  const [splash, setSplash] = useState(true);
  const [idx, setIdx] = useState(0);
  const [screen, setScreen] = useState('home');      // home | town | detail
  const [townTab, setTownTab] = useState('village'); // village | list
  const [detailId, setDetailId] = useState(null);
  const [detailBack, setDetailBack] = useState('village');
  const [chat, setChat] = useState(null);            // { pet, intro } | null
  const [grad, setGrad] = useState(null);            // 1주 완성한 펫 id
  const [qr, setQr] = useState(false);
  const [push, setPush] = useState(false);
  const [menu, setMenu] = useState(false);
  const [feeding, setFeeding] = useState(false);
  const [fedJust, setFedJust] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    api.state().then(setSt).catch(() => setLoadErr('API 서버(3001)에 연결하지 못했어요. npm run dev 로 서버와 화면을 함께 실행해 주세요.'));
  }, []);

  const showToast = t => { setToast(t); setTimeout(() => setToast(null), 2600); };
  const theme = st?.theme || 'B';
  const n = st?.active.length || 0;
  const cur = n ? st.active[Math.min(idx, n - 1)] : null;
  const goPet = id => { const i = st.active.findIndex(p => p.id === id); setIdx(Math.max(0, i)); setScreen('home'); };
  const openDetail = (id, back) => { setDetailId(id); setDetailBack(back); setScreen('detail'); };

  const handleEvents = (events, state) => {
    const g = events.find(e => e.type === 'graduate');
    const grow = events.filter(e => e.type === 'grow').at(-1);
    if (g) setTimeout(() => setGrad(g.id), 1100);
    else if (grow) showToast(`${grow.name} ${grow.stage} 단계로 자랐어`);
    setSt(state);
  };

  const feed = async () => {
    if (feeding) return;
    setFeeding(true);
    try {
      const r = await api.next(1);
      handleEvents(r.events, r.state);
      setFedJust(true); setTimeout(() => setFedJust(false), 2600);
    } catch (e) { showToast(e.message); }
    setTimeout(() => setFeeding(false), 1200);
  };

  const menuAct = async a => {
    setMenu(false);
    try {
      if (a === 'A' || a === 'B') { setSt(await api.theme(a)); showToast(`${THEME_LABEL[a]}로 바꿨어요`); }
      if (a === 'push') setPush(true);
      if ((a === 'next' || a === 'graduate') && cur) { const r = await api.boost(cur.id, a); handleEvents([r.event], r.state); }
      if (a === 'demo' || a === 'fresh') { const r = await api.reset(a === 'demo'); setSt(r.state); setIdx(0); setScreen('home'); }
    } catch (e) { showToast(e.message); }
  };

  if (loadErr) return <div className="app"><div className="boot-err">{loadErr}</div></div>;
  if (splash || !st) return <div className="app"><Splash ready={!!st} onDone={() => setSplash(false)} /></div>;

  const gradPet = grad ? st.dex.find(p => p.id === grad) : null;

  return (
    <div className="app">
      {screen === 'home' && (
        <Home st={st} idx={idx} setIdx={setIdx} theme={theme} fedJust={fedJust} feeding={feeding}
          onFeed={feed} onChat={pet => setChat({ pet })} onBubble={pet => setChat({ pet, intro: pet.bubble })}
          onTown={() => { setTownTab('village'); setScreen('town'); }} onQr={() => setQr(true)} onMenu={() => setMenu(true)} />
      )}
      {screen === 'town' && (
        <Town st={st} theme={theme} tab={townTab} setTab={setTownTab} onBack={() => setScreen('home')}
          onDetail={id => openDetail(id, townTab)} onPet={goPet} />
      )}
      {screen === 'detail' && <DexDetail id={detailId} theme={theme} onBack={() => { setTownTab(detailBack); setScreen('town'); }} />}

      {chat && <ChatSheet pet={chat.pet ? st.active.find(p => p.id === chat.pet.id) || chat.pet : null} theme={theme} intro={chat.intro}
        onClose={() => setChat(null)} onState={setSt} />}
      {gradPet && <Graduate pet={gradPet} theme={theme} onDone={() => { setGrad(null); setChat(null); setTownTab('village'); setScreen('town'); }} />}
      {qr && <QrFlow st={st} theme={theme} onState={setSt} onClose={() => setQr(false)}
        onDone={id => { setQr(false); const i = st.active.findIndex(p => p.id === id); setIdx(Math.max(0, i)); setScreen('home'); }} />}
      {push && <PushPreview st={st} theme={theme} onClose={() => setPush(false)}
        onGo={(kind, id) => {
          setPush(false);
          if (kind === 'pet') goPet(id);
          if (kind === 'chat') { goPet(id); setChat({ pet: st.active.find(p => p.id === id) }); }
          if (kind === 'detail') openDetail(id, 'list');
          if (kind === 'home') setScreen('home');
        }} />}

      {menu && (
        <div className="sheet-wrap">
          <button className="sheet-dim" onClick={() => setMenu(false)} aria-label="메뉴 닫기" />
          <div className="sheet menu-sheet">
            <b className="menu-title">캐릭터</b>
            <div className="seg">
              {['B', 'A'].map(t => <button key={t} className={theme === t ? 'on' : ''} aria-pressed={theme === t} onClick={() => menuAct(t)}>{THEME_LABEL[t]}</button>)}
            </div>
            <button className="menu-item" onClick={() => menuAct('push')}>알림 미리보기</button>
            {cur && <>
              <b className="menu-title">데모 · {cur.name}</b>
              <div className="row2">
                <button className="btn ghost" onClick={() => menuAct('next')}>다음 단계로 키우기</button>
                <button className="btn ghost" onClick={() => menuAct('graduate')}>바로 1주 완성</button>
              </div>
            </>}
            <b className="menu-title">처음으로</b>
            <div className="row2">
              <button className="btn ghost" onClick={() => menuAct('demo')}>데모 데이터로</button>
              <button className="btn ghost" onClick={() => menuAct('fresh')}>빈 상태로</button>
            </div>
            <div className="fine center">모의 서비스 · 시세 {st.priceSource === 'real' ? '실제(주간 종가)' : st.priceSource === 'mixed' ? '일부 모의' : '모의'} · 환율 1달러 = {st.usdkrw.toLocaleString()}원</div>
          </div>
        </div>
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
