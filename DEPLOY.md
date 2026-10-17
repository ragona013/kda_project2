# 배포 가이드 — Railway(서버) + Vercel(화면)

```
브라우저 ─▶ Vercel (React 정적 화면)
              └─ /api/* ─▶ Railway (Express 서버 + SQLite Volume)
```

## 1. Railway (먼저)
1. New Project → Deploy from GitHub repo → `kda_project2`
2. Variables
   - `NODE_ENV=production`
   - `DATA_DIR=/data`
   - (선택) `OPENAI_API_KEY`, `OPENAI_MODEL=gpt-4o-mini`, `naver_Client_ID`, `Client_Secret`
3. Volume 추가 → Mount path `/data` (없으면 재배포 때 DB가 초기화됨)
4. Settings → Networking → Generate Domain → 주소 복사
5. 확인: `https://<주소>/api/health` → `{"ok":true,...}`

## 2. Vercel
1. `vercel.json`의 `YOUR-RAILWAY-DOMAIN.up.railway.app`을 위 주소로 교체 후 push
2. Add New → Project → 같은 레포 import (Framework: Vite, 기본값 그대로)
3. Deploy → 발급된 주소에서 화면·대화 확인

## 주의
- 이 앱은 사용자 구분 없이 DB 하나를 공유하는 모의 서비스임 (방문자 모두 같은 상태를 봄)
- Node 22.5 이상 필요 (`node:sqlite`)
- 로컬 실행은 README 참고 (`npm install` → `npm run dev`)
