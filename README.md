# tiger-gram

tiger-gram은 노노그램과 스도쿠를 하나의 UI에서 플레이할 수 있는 React + TypeScript 기반 로직 퍼즐 웹 앱입니다.

## 현재 구현 기능
- 라우팅: `/`, `/nonogram`, `/sudoku`
- 공통 UI 셸 + 게임 탭 네비게이션
- 노노그램
  - 쉬움/보통/어려움 티어별 퍼즐 생성
  - Web Worker 기반 비동기 생성 + 진행률 표시
  - 유일해(Unique solution) 검증 기반 생성
  - 솔버 메트릭 기반 로직 난이도(`easy|medium|hard|expert`) 표시
  - 드래그 칠하기/지우기, 우클릭 사이클 입력
- 스도쿠
  - 쉬움/보통/어려움 티어별 퍼즐 생성
  - 유일해 검증 기반 퍼즐 조각내기(carving)
  - 메모 모드, 숫자 패드 입력, 선택 하이라이트
  - 솔버 사용 기법 기반 로직 난이도(`easy|medium|hard|expert`) 표시
- 공통 게임 기능
  - 타이머, 재시작, 새 퍼즐, 포기
  - 승리 애니메이션(컨페티) + 효과음 + 음소거 토글
  - 로컬 리더보드(게임/난이도별 기록)
  - `localStorage` 영속화(`tiger-gram:*` prefix)

## 기술 스택
- React 19
- TypeScript (strict)
- Vite 6
- Tailwind CSS
- Vitest + React Testing Library

## 시작하기
```bash
yarn install
yarn dev
```

## 스크립트
- `yarn dev`: 개발 서버 실행
- `yarn build`: 타입체크 + 프로덕션 빌드
- `yarn preview`: 빌드 결과 로컬 확인
- `yarn test`: 테스트 실행
- `yarn test:watch`: 테스트 watch 모드
- `yarn lint`: ESLint 실행

## 난이도/티어 정책
### 노노그램 보드 크기
- `easy`: `5x5`
- `medium`: `10x10`
- `hard`: `15x15`

### 티어 파라미터 파싱
- `difficulty=expert`는 하위 호환으로 `hard`에 매핑
- 알 수 없는 값은 현재 구현에서 `easy`로 폴백

## 배포
- GitHub Pages 워크플로우: `.github/workflows/deploy-pages.yml`
- `main` push 또는 수동 실행 시 `dist/` 배포
- SPA 라우팅 fallback을 위해 `dist/index.html`을 `dist/404.html`로 복사
- GitHub Pages 경로: `https://mtgvim.github.io/tiger-gram/`
- 정적 에셋은 `import.meta.env.BASE_URL` 기준 경로를 사용해 하위 경로 배포를 지원

## PWA / 오프라인
- PWA 매니페스트: `public/manifest.webmanifest`
- 서비스 워커: `public/sw.js` (프로덕션 빌드에서 등록)
- 설치 제안(`beforeinstallprompt`) 노출 시점은 브라우저 정책(HTTPS, 사용 패턴)에 따라 다름
- 최소 오프라인 지원: 한 번 방문한 리소스의 재방문 캐시 + 라우트 fallback

## 에셋
- 랜딩 이미지: `public/concept.png` (`src/pages/LandingPage.tsx`에서 사용)
- 승리 효과음: `public/sounds/victory-fanfare.mp3`

## 서비스 URL
- https://mtgvim.github.io/tiger-gram/
