# tigoku-gram

노노그램과 스도쿠를 플레이할 수 있는 React + TypeScript 기반 로직 퍼즐 웹 앱입니다.

## 주요 기능
- 노노그램/스도쿠 탭 전환
- 노노그램 난이도별 랜덤 퍼즐 생성(쉬움/보통/어려움)
- 스도쿠 난이도별 랜덤 퍼즐 생성(쉬움/보통/어려움)
- 두 퍼즐 모두 보드 영역 반응형 스케일링(`w-full`, `max-width: 800px`)
- 노노그램 생성 진행률/상태 표시(워커 기반)

## 기술 스택
- React
- TypeScript
- Vite
- Tailwind CSS
- Vitest

## 시작하기
```bash
yarn install
yarn dev
```

## 스크립트
- `yarn dev`: 개발 서버 실행
- `yarn build`: 프로덕션 빌드
- `yarn preview`: 빌드 결과 미리보기
- `yarn test`: 테스트 실행
- `yarn lint`: 린트 실행

## 난이도 정책
### 노노그램 크기 티어
- `easy`: `10x10`
- `medium`: `15x15`
- `hard`: `20x20`

### 스도쿠 티어
- `easy`
- `medium`
- `hard`

참고: 과거 URL 파라미터로 `difficulty=expert`가 들어오면 내부적으로 `hard`로 매핑됩니다.

## 에셋
- 파비콘: `public/favicon.png`
- 컨셉 이미지: `public/concept.png`

## 저장소
- https://github.com/MTGVim/tigoku-gram
