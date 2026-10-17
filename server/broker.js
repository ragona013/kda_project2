// 주문 어댑터
//  - sim (기본): 모의 시세로 금액 단위 소수점 매수 체결
//  - kiwoom: 키움 공식 MCP(kiwoom-exec-mcp, HTTP 모드)로 모의투자 주문 — 내부망 전용
//    KIWOOM_MCP_URL, KIWOOM_MODE=demo 설정 필요. 주문은 preview → confirm 2단계.
import { toKRW } from './universe.js';

export const BROKER_MODE = process.env.BROKER_MODE || 'sim';

export function placeOrder({ amountKRW, price, stock }) {
  if (BROKER_MODE === 'kiwoom') {
    // 연결 지점: kiwoom_order_preview → 사용자 승인 → kiwoom_order_submit(confirm=true)
    // 정기매수는 플랜 생성 때 사용자 승인을 받은 범위 안에서만 실행한다.
    throw new Error('키움 MCP 연동은 배포 단계에서 활성화 예정입니다. BROKER_MODE=sim 으로 실행하세요.');
  }
  const priceKRW = toKRW(stock, price);
  return { price, priceKRW, shares: amountKRW / priceKRW };
}
