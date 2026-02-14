# CLAUDE.md

# tiger-gram Implementation Snapshot
Version: 2026-02-14

tiger-gram은 노노그램과 스도쿠를 제공하는 웹 로직 퍼즐 앱이다.
이 문서는 "목표 스펙"이 아니라 "현재 구현 상태"를 기록한다.

---

## 1. Product Summary

- App Name: tiger-gram
- Tagline: Pure Logic. No Luck.
- Games: Nonogram + Sudoku
- Platform: Web (React SPA)
- Storage: localStorage (`tiger-gram:*`)
- Deployment: GitHub Pages (GitHub Actions)

---

## 2. Current Routes

- `/` : 소개 랜딩 페이지
- `/nonogram` : 노노그램 플레이
- `/sudoku` : 스도쿠 플레이
- `*` : `/`로 리다이렉트

---

## 3. Implemented Features

### 3.1 Nonogram

- 난이도 티어: `easy | medium | hard`
- 보드 크기 정책:
  - easy: 5x5
  - medium: 10x10
  - hard: 15x15
- 퍼즐 생성:
  - seed 기반 생성
  - fill profile 기반 후보 생성
  - 유일해 검증(count cap + node limit)
- 생성 실행:
  - Web Worker(`nonogram.worker.ts`)에서 비동기 생성
  - 진행률/시도 횟수 표시
- 플레이 UI:
  - 마우스 드래그로 칠하기/지우기
  - 우클릭으로 셀 상태 사이클
  - 행/열 클루 충족 시 색상 강조
- 로직 분석:
  - 솔버 메트릭(`maxLogicDepth`, `forcedMoves`, `usedRecursion`) 계산
  - 메트릭 기반 로직 난이도(`easy|medium|hard|expert`) 표시

### 3.2 Sudoku

- 난이도 티어: `easy | medium | hard`
- 생성:
  - seed 기반 solved grid 생성(밴드/스택/숫자 셔플)
  - givens 목표치 기준 carving
    - easy: 42
    - medium: 34
    - hard: 28
  - 유일해 검증(count cap=2)
- 플레이 UI:
  - 셀 선택 및 숫자 입력 패드
  - 메모 모드(후보 숫자 기록)
  - 같은 숫자/행/열/박스 하이라이트
- 로직 분석:
  - 솔버 기법 추적
    - naked/hidden single
    - naked/hidden pair
    - box-line reduction
    - x-wing, swordfish
  - 기법 점수 기반 로직 난이도(`easy|medium|hard|expert`) 표시

### 3.3 Shared Gameplay

- 상태: `playing | won | lost`
- 타이머
- 재시작 / 새 퍼즐 / 포기
- 승리 시:
  - confetti burst 애니메이션
  - 효과음 재생(`/sounds/victory-fanfare.mp3`, 음소거 토글 가능)
  - 리더보드 기록

### 3.4 Leaderboard / Persistence

- 로컬 퍼즐 리더보드(`leaderboard:v1`)
- 게임/난이도별 기록 누적 후 정렬
- 최대 150개 보관
- 구 포맷 레거시 데이터 마이그레이션 지원
- 모든 저장은 `src/lib/persistence.ts`를 통해 처리

---

## 4. Difficulty Query Parsing (Current Behavior)

- `difficulty=expert` -> `hard` (legacy alias)
- `difficulty`가 없거나 알 수 없는 값이면 `easy`로 폴백

---

## 5. Tech Stack

- React 19 + TypeScript(strict)
- Vite 6
- Tailwind CSS
- React Router
- Vitest + React Testing Library

---

## 6. Repository Structure

- `src/features/nonogram/`: nonogram generator/solver/worker/UI
- `src/features/sudoku/`: sudoku generator/solver/UI
- `src/components/`: AppShell, LeaderboardPanel, CelebrationBurst 등
- `src/pages/`: route-level pages
- `src/lib/`: rating/streak/leaderboard/persistence/validation
- `src/styles/`: global CSS + animation
- `tests/`: feature/lib 테스트

---

## 7. Deployment

GitHub Actions workflow: `.github/workflows/deploy-pages.yml`

- trigger: `main` push, `workflow_dispatch`
- build: `yarn install --frozen-lockfile` -> `yarn build`
- SPA fallback: `dist/index.html` -> `dist/404.html`
- deploy: GitHub Pages artifact 배포

Vite `base`는 `GITHUB_ACTIONS` / `GITHUB_REPOSITORY` 환경변수 기반으로 자동 설정된다.

---

## 8. Partial / Not Implemented Yet

아래 항목은 현재 코드에 구현되어 있지 않다.

- IndexedDB 저장소
- 이미지 -> 노노그램 변환 파이프라인
- 일간 퍼즐(Daily puzzle)
- 서버/클라우드 기반 글로벌 랭킹

현재 부분 구현:
- PWA manifest + service worker 기반 기본 설치/캐시 동작
- 완전한 오프라인 퍼스트 전략(정교한 runtime 전략/버전 정책)은 미구현

---

## 9. Brand Notes

- Tone: sharp, minimal, skill-driven
- Primary color tokens:
  - bg: `#0F0F14`
  - accent: `#FF3B3B`
  - logic: `#FFD166`
  - success: `#4CAF50`
- Fonts:
  - display: Space Grotesk
  - mono: IBM Plex Mono

---

## 10. Maintenance Rule

문서와 구현이 다르면 구현을 우선한다.
새 기능/정책 변경 시 아래 파일을 같은 PR에서 함께 갱신한다.

- `README.md`
- `AGENTS.md`
- `CLAUDE.md`
