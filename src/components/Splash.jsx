// 앱 첫 화면 — 키움 앱 스플래시 형식: 문구 + 대표 캐릭터(도룡이) + 로딩 게이지 + 하단 중앙 키움증권 로고
// 게이지가 다 차면 '화면을 터치해 시작' 안내 → 터치 시 홈으로 (데이터 준비 후에는 언제든 터치로 넘어감)
import { useEffect, useRef, useState } from 'react';

const PRELOAD = [
  '/model/fish2d.png', '/model/dino2d.png', '/model/rabit2d.png', '/model/chick2d.png',
  '/brand/kiwoom-logo.png', '/model/fish.glb', '/model/dino_G.glb', '/model/rabit.glb', '/model/chick.glb',
];

export default function Splash({ ready, onDone }) {
  const [loaded, setLoaded] = useState(0);
  const [shown, setShown] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const start = useRef(performance.now());

  // 캐릭터 에셋 미리 받기 → 실제 진행률
  useEffect(() => {
    PRELOAD.forEach(u => fetch(u).catch(() => {}).finally(() => setLoaded(n => n + 1)));
  }, []);

  // 표시 게이지는 실제 진행률을 부드럽게 따라감 (최소 1.6초)
  useEffect(() => {
    let raf;
    const tick = () => {
      const t = (performance.now() - start.current) / 1600;
      const real = (loaded / PRELOAD.length) * 0.8 + (ready ? 0.2 : 0);
      const target = Math.min(real, Math.min(1, t)) * 100;
      setShown(s => (s < target ? Math.min(target, s + 1.6) : s));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [loaded, ready]);

  const full = shown >= 100;
  const go = () => {
    if (leaving || !ready) return;
    setLeaving(true);
    setTimeout(onDone, 400);
  };

  return (
    <div className={`splash ${leaving ? 'out' : ''}`} onClick={go} role="button" aria-label="시작하기">
      <div className="splash-copy">
        <p>잘 키우고 싶은 투자 본능</p>
        <h1><span>나만의 주식펫</span>을 키움</h1>
      </div>
      <div className="splash-pet">
        <div className="splash-glow" />
        <div className="splash-ring" />
        <img src="/model/fish2d.png" alt="도룡이" />
        <div className="splash-coins"><i /><i /><i /></div>
      </div>
      <div className={`splash-tap ${full ? 'on' : ''}`}>화면을 터치해 시작하세요</div>
      <div className="splash-bottom">
        <span>Ver.1.0.0</span>
        <div className="splash-bar"><div style={{ width: `${shown}%` }} /></div>
        <span className="pct">{Math.round(shown)}%</span>
      </div>
      <div className="splash-logo">
        <img src="/brand/kiwoom-logo.png" alt="키움증권" />
        <small>모의 서비스</small>
      </div>
    </div>
  );
}
