// 캐릭터 테마
//   A안 · 큐밍: 같은 종 + 업종 소품 + 종목 색 (키움 화살표 뿔)
//   B안 · 기존 캐릭터: 업종 담당 캐릭터 (룡룡이·토깽이·삐약이·도룡이)
// t, b = 그림 안에서 캐릭터가 차지하는 위·아래 위치(%) → 색이 차오르는 높이 계산에 사용
export const CHARS = {
  A: {
    chip: { img: '/pets/a/chip.svg', t: 16.5, b: 93, tint: '#EAF0FF', acc: '칩 배지', color: '파랑', wear: '칩 배지를 달고' },
    car:  { img: '/pets/a/car.svg',  t: 16.5, b: 93, tint: '#EEF2F7', acc: '레이싱 헬멧', color: '은회색', wear: '레이싱 헬멧을 쓰고' },
    net:  { img: '/pets/a/net.svg',  t: 11.5, b: 93, tint: '#E6F8EC', acc: '헤드셋', color: '초록', wear: '헤드셋을 끼고' },
    etf:  { img: '/pets/a/etf.svg',  t: 17.5, b: 95, tint: '#F3EFFF', acc: '무리 (3마리)', color: '여러 색', wear: '세 마리가 무리 지어 다니고' },
    bio:  { img: '/pets/a/bio.svg',  t: 5,    b: 93, tint: '#E5F5F7', acc: '새싹', color: '청록', wear: '머리에 새싹을 키우고' },
    fin:  { img: '/pets/a/fin.svg',  t: 16.5, b: 93, tint: '#FFF6D6', acc: '동전 목걸이', color: '노랑', wear: '동전 목걸이를 걸고' },
  },
  B: {
    chip: { img: '/pets/b/chip.png', t: 3.3,  b: 96.3, tint: '#E6F2DC', acc: '반도체·IT' },
    car:  { img: '/pets/b/car.png',  t: 3.3,  b: 96.7, tint: '#EEE9FA', acc: '자동차·금융' },
    net:  { img: '/pets/b/net.png',  t: 14.7, b: 96.7, tint: '#FFF3C9', acc: '인터넷·SW·바이오' },
    etf:  { img: '/pets/b/etf.png',  t: 4.3,  b: 96.7, tint: '#FCE8EE', acc: 'ETF' },
    bio:  { img: '/pets/b/net.png',  t: 14.7, b: 96.7, tint: '#FFF3C9', acc: '인터넷·SW·바이오' },
    fin:  { img: '/pets/b/car.png',  t: 3.3,  b: 96.7, tint: '#EEE9FA', acc: '자동차·금융' },
  },
};

export const THEME_LABEL = { B: '우리 캐릭터', A: '큐밍 (시안)' };

export const look = (theme, char) => (CHARS[theme] || CHARS.B)[char] || CHARS.B.etf;

// 모은 조각(0~1)만큼 아래에서부터 색이 차오르는 높이
export function fillOf(theme, char, progress) {
  const L = look(theme, char);
  const f = Math.max(0, Math.min(1, progress));
  const y = L.b - f * (L.b - L.t);
  return { clip: f >= 1 ? 'none' : `inset(${y.toFixed(1)}% 0 0 0)`, line: `${y.toFixed(1)}%` };
}
