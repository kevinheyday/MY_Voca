MY VOCA V5.3.174
Base: V5.3.173

Drawer 버전 / 업데이트 / 앱 정보 수정

1. Drawer 버전 제거
- Drawer 상단의 오래된 'v5.1 · Compare Center' 문구 완전 제거.
- 앱 정보 메뉴의 작은 설명에도 버전을 직접 쓰지 않음.
- 홈 화면 버전 표시는 기존대로 유지.

2. 업데이트 내역 수정
- 기존 usagePage + scroll 방식 제거.
- mvOpenUpdateHistory() 공통 정보 오버레이로 독립 동작.
- 최근 v5.3.170~v5.3.174 변경사항 표시.

3. 앱 정보 수정
- 오래된 v5.3.95 alert 완전 제거.
- mvOpenAppInfo()에서 MV_APP_VERSION 단일 기준 사용.
- 현재 버전 v5.3.174 및 현재 학습 구조 표시.

표준화
- MV_APP_VERSION 하나가 앱 정보/업데이트 내역의 버전 source-of-truth.
- 업데이트 내역과 앱 정보는 mvInfoOverlay 공통 UI 사용.
- 기존 학습/퀴즈/문장말하기/녹음/재생 엔진은 변경하지 않음.
