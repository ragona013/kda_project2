// 회색 실루엣 위로, 모은 조각(0~1주)만큼 아래에서부터 색이 차오르는 펫
import { look, fillOf } from '../chars';

export default function PetReveal({ theme, char, progress, size = 240, faded = false, label, alt = '', line = false, hop = false, delay = 0 }) {
  const L = look(theme, char);
  const f = fillOf(theme, char, progress);
  return (
    <div className={`reveal ${hop ? 'hop' : ''}`} style={{ width: size, height: size, animationDelay: `${delay}s` }}>
      <img className="ghost" src={L.img} alt="" draggable="false" />
      <img className="fill" src={L.img} alt={alt} draggable="false" style={{ clipPath: f.clip, opacity: faded ? 0.45 : 1 }} />
      {line && progress < 1 && (
        <>
          <div className="waterline" style={{ top: f.line }} />
          <span className="wl-tag" style={{ top: f.line }}>{label}</span>
        </>
      )}
    </div>
  );
}
