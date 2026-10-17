// 1주 완성 — 펫이 다 칠해지고 도장이 찍히는 순간
import { look } from '../chars';
import { josa } from '../api';

export default function Graduate({ pet, theme, onDone }) {
  const L = look(theme, pet.char);
  return (
    <div className="overlay grad">
      <div className="sub">{pet.stock}</div>
      <h1 className="display grad-title">{josa(pet.name, '이', '가')}<br />1주가 됐어요</h1>
      <div className="grad-pet" style={{ background: L.tint }}>
        <img src={L.img} alt={pet.name} />
        <span className="stamp lg">1주<br />완성</span>
      </div>
      <div className="grid2">
        <div className="stat"><span>함께한 금요일</span><b>{pet.buys}번</b></div>
        <div className="stat"><span>도감 번호</span><b>No.{String(pet.dexNo).padStart(3, '0')}</b></div>
      </div>
      <div className="spacer" />
      <button className="btn dark wide" onClick={onDone}>조각 마을로 보내기</button>
    </div>
  );
}
