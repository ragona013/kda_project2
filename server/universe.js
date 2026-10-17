// 모의 테스트용 종목 목록 (키움 소수점 거래 대상 가정)
// char: 업종 → 캐릭터 키 (화면에서 테마별로 그림·이름을 고름)
//   chip = 반도체·IT하드웨어   car = 자동차   net = 인터넷·소프트웨어
//   etf  = ETF (무리)          bio = 바이오   fin = 금융
//   A안 큐밍: 같은 종 + 업종 소품 + 종목 색 / B안 기존 캐릭터: 룡룡이·토깽이·삐약이·도룡이
// 실서비스는 종목명·기업개요·업종으로 캐릭터를 자동 생성
export const USDKRW = 1400; // 모의 환율 (고정)

export const UNIVERSE = [
  { code: '005930', name: '삼성전자',     market: 'KR', sector: '반도체',     petType: 'dino',   base: 70000,  aliases: ['삼전', '삼성'],
    overview: '메모리 반도체와 스마트폰을 만드는 국내 시가총액 1위 기업' },
  { code: '000660', name: 'SK하이닉스',   market: 'KR', sector: '반도체',     petType: 'dino',   base: 200000, aliases: ['하이닉스', '닉스'],
    overview: 'D램·낸드 메모리 전문 기업, AI 서버용 HBM 메모리 강자' },
  { code: '005380', name: '현대차',       market: 'KR', sector: '자동차',     petType: 'rabbit', base: 220000, aliases: ['현대자동차'],
    overview: '국내 최대 완성차 기업, 전기차·수소차까지 생산' },
  { code: '035420', name: 'NAVER',        market: 'KR', sector: '인터넷',     petType: 'chick',  base: 200000, aliases: ['네이버'],
    overview: '국내 1위 검색 포털, 쇼핑·웹툰·클라우드 사업' },
  { code: '035720', name: '카카오',       market: 'KR', sector: '인터넷',     petType: 'chick',  base: 45000,  aliases: [],
    overview: '카카오톡 기반 플랫폼 기업, 결제·모빌리티·콘텐츠 사업' },
  { code: '069500', name: 'KODEX 200',    market: 'KR', sector: 'ETF',        petType: 'fish',   base: 35000,  aliases: ['코덱스200', '코스피200'],
    overview: '코스피200 지수를 따라가는 ETF — 국내 대표 200개 기업에 한 번에 투자', members: 200 },
  { code: 'AAPL',   name: '애플',         market: 'US', sector: 'IT하드웨어', petType: 'dino',   base: 230,    aliases: ['apple', '아이폰'],
    overview: '아이폰·맥·서비스 생태계를 가진 미국 빅테크' },
  { code: 'NVDA',   name: '엔비디아',     market: 'US', sector: '반도체',     petType: 'dino',   base: 130,    aliases: ['nvidia', '엔비디아'],
    overview: 'AI 학습용 GPU 시장 1위 반도체 설계 기업' },
  { code: 'TSLA',   name: '테슬라',       market: 'US', sector: '자동차',     petType: 'rabbit', base: 250,    aliases: ['tesla'],
    overview: '전기차와 에너지 저장장치를 만드는 기업' },
  { code: 'MSFT',   name: '마이크로소프트', market: 'US', sector: '소프트웨어', petType: 'chick', base: 420,    aliases: ['마소', 'microsoft'],
    overview: '윈도우·오피스·클라우드(Azure)를 가진 소프트웨어 기업' },
  { code: 'SPY',    name: 'S&P500 ETF',   market: 'US', sector: 'ETF',        petType: 'fish',   base: 550,    aliases: ['s&p500', 'sp500', '에스앤피', 's&p'],
    overview: '미국 대표 500개 기업에 한 번에 투자하는 ETF', members: 500 },
  { code: 'QQQ',    name: '나스닥100 ETF', market: 'US', sector: 'ETF',       petType: 'fish',   base: 480,    aliases: ['나스닥', 'qqq'],
    overview: '나스닥 상위 100개 기술기업에 투자하는 ETF', members: 100 },
  { code: '068270', name: '셀트리온',     market: 'KR', sector: '바이오',     petType: 'chick',  base: 180000, aliases: [],
    overview: '바이오시밀러(복제 바이오의약품)를 개발·생산하는 기업' },
  { code: '105560', name: 'KB금융',       market: 'KR', sector: '금융',       petType: 'rabbit', base: 80000,  aliases: ['국민은행', 'kb'],
    overview: '국민은행·KB증권·KB손해보험 등을 거느린 금융지주' },
];

const CHAR_BY_SECTOR = { '반도체': 'chip', 'IT하드웨어': 'chip', '자동차': 'car', '인터넷': 'net', '소프트웨어': 'net', 'ETF': 'etf', '바이오': 'bio', '금융': 'fin' };
for (const s of UNIVERSE) s.char = CHAR_BY_SECTOR[s.sector] || 'etf';

// 펫 이름 (테마별)
export const PET_NAMES = {
  A: { chip: '칩밍', car: '부릉밍', net: '초록밍', etf: '모아밍', bio: '새싹밍', fin: '동전밍' },
  B: { chip: '룡룡이', car: '토깽이', net: '삐약이', etf: '도룡이', bio: '삐약이', fin: '토깽이' },
};

export const byCode = Object.fromEntries(UNIVERSE.map(s => [s.code, s]));

export function findStock(text) {
  const t = text.toLowerCase().replace(/\s+/g, '');
  // 긴 이름 우선 매칭 (SK하이닉스 vs 하이닉스 등)
  const cands = [];
  for (const s of UNIVERSE) {
    for (const k of [s.name, s.code, ...s.aliases]) {
      const key = k.toLowerCase().replace(/\s+/g, '');
      if (key && t.includes(key)) cands.push({ s, len: key.length });
    }
  }
  cands.sort((a, b) => b.len - a.len);
  return cands[0]?.s || null;
}

export function toKRW(stock, price) {
  return stock.market === 'US' ? price * USDKRW : price;
}
