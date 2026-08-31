MY ENGLISH V5.3.181
Base: V5.3.180

Navigation Reset — 3줄 메뉴 / 소리영어 / OPIC 정상화

이번에는 누적 패치를 더하지 않고 네비게이션을 초기화했습니다.

핵심 수정
1. V177~V180의 EARLY NAVIGATION SAFETY LAYER 완전 제거
   - document capture 단계에서 클릭을 먼저 가로채던 구조 제거.
   - Drawer와 홈 모드의 여러 세대 이벤트 충돌 제거.

2. 독립 Navigation Script 추가
   - 메인 앱 script와 별도 <script id="mvNavigation181">로 실행.
   - Drawer menu button/panel/backdrop을 clean clone 후 하나의 이벤트만 연결.
   - 홈 DAY/MY/SORI/OPIC 버튼도 clean clone 후 하나의 공통 showHomeMode()만 사용.
   - legacy 코드가 홈 버튼을 다시 만드는 경우 80/260/520/900ms 재바인딩 + MutationObserver 보정.

3. 소리영어
   - .soriClassSection과 soriGroup1Card를 homePage 내부에서 직접 표시.
   - 소리영어 버튼 → 수업 박스 표시.
   - 수업 박스 클릭 → 기존 studyDirectOpenCourse/openStudyCourse 공통 학습 엔진 사용.

4. OPIC
   - OPIC 카드(opicGroup1Card)를 정적 HTML로 생성.
   - setTimeout 동적 생성에 의존하지 않음.
   - OPIC 버튼 → OPIC 수업 박스 표시.
   - 카드 클릭 → 같은 공통 course entry 사용.

5. 기존 기능 보존
   - 학습 데이터 / 퀴즈 / 문장 말하기 / 녹음
   - 전체 시작/정지 / 무한 반복 / 패턴 표시
   - localStorage 학습 기록
