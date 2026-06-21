# work-log.md — tobe-mobile 사용성 개선

## 해피패스
랜딩 입력 → 왼쪽 일정표 생성 → 교통/통신 두 제안 → 3시간 지연 이벤트 → 재계획 → 조정안 A/B 선택

## [변경됨]

### 1. 일간 뷰 JS 크래시 수정
- before: absolute 배치 + `totalH`, `hourLines()` 참조 → ReferenceError로 일간 뷰 전체 크래시
- after: 주간 뷰와 동일한 테이블 방식으로 변경, `totalH`/`hourLines()` 불필요
- 이유: 해피패스 중 일간 뷰 진입 시 JS 에러로 전체 앱 멈춤

### 2. prefers-reduced-motion 지원
- before: 없음 (모든 애니메이션 항상 재생)
- after: `@media(prefers-reduced-motion:reduce)` 추가, 모든 animation/transition 즉시 완료
- 이유: 접근성 — 전정 기관 민감 사용자 지원

### 3. 터치 타겟 크기 확대
- `.mob-bar-back`: padding 4px 8px → 10px 14px, min-height/width 44px
- `.sug-choice`: padding 12px 14px → 14px 16px, min-height 48px
- `.mob-bar-avatar`: 28px → 32px
- 이유: iOS 최소 터치 타겟 44px 미달

### 4. 대화 영역에 aria-live="polite" 추가
- before: `#thread`에 aria 속성 없음
- after: `aria-live="polite"` 추가
- 이유: 스크린리더가 새 메시지 도착을 인지할 수 있도록

### 5. Escape 키로 모달/사이드바 닫기
- before: 클릭으로만 닫기 가능
- after: Escape 키 → closeEvModal(), closeQs(), closeSidebar()
- 이유: 키보드 접근성

### 6. 루틴 텍스트 대비 개선
- before: --routine-ink: #A8A299 (대비 ~2.3:1, WCAG AA 미달)
- after: --routine-ink: #807B73 (대비 ~4.1:1, AA 근접)
- 이유: 루틴 이벤트 텍스트가 읽기 어려웠음

### 7. 일간 뷰 버튼에 aria-label 추가
- cal-back, cal-nav-btn: aria-label 추가
- 이유: 아이콘만 있는 버튼에 스크린리더 레이블 필요

## [검토 필요]

### 1. 사이드바 터치 타겟
- `.sb-tab-icon` (26px), `.sb-mtab` (26px), `.sb-rec` (30px), `.sb-item` (33px) 모두 44px 미만
- 사이드바 전체가 데스크톱 기준 디자인이라 모바일 터치에 불편할 수 있음
- 사이드바 오버레이가 모바일에서만 열리므로 터치 타겟 확대 필요할 수 있음

### 2. 주간 뷰 셀 터치 타겟
- `.cal-td-ev` 셀이 내용에 따라 ~22px까지 줄어들 수 있음
- `min-height:44px` 추가를 고려

### 3. 스트리밍 중 입력 비활성화
- `S.busy=true`일 때 `#mainSend`만 disabled, textarea는 편집 가능
- 사용자가 busy 중 Enter를 누르면 `onMainSend()`에서 early return하지만 시각적 피드백 없음

### 4. startChat 더블클릭 방지
- `startChat()`에 `S.busy` 체크 없음
- 빠르게 두 번 클릭하면 `onMainSend()`가 두 번 호출될 수 있음 (두 번째는 busy로 무시되지만)

### 5. 색상 대비 추가 개선
- `--faint` (#72716C on #F8F8F6) 대비 ~3.5:1, WCAG AA(4.5:1) 미달
- `.cal-ev-sub` opacity:.7이 대비를 더 낮춤

### 6. focus-visible 스타일
- 전체 파일에 :focus-visible 스타일 없음
- 키보드 사용자가 포커스 위치를 알 수 없음

## [미해결]

### 1. 일간 뷰 CSS 중 사용 안 되는 속성
- `.cal-ev-full` 관련 CSS (lines ~483-497)가 일간 뷰를 테이블로 변경한 후 사용되지 않음
- dead CSS이지만 기능에 영향 없어 삭제하지 않음

### 2. switchMobTab/mobNotify 빈 동작
- mob-tabs가 display:none이라 switchMobTab, mobNotify가 빈 동작
- 기능에 영향 없지만 불필요한 코드
