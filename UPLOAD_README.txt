MY VOCA V5.3.170
Base: V5.3.169

DAY VOCA 전용 '학습 재생 설정' 위치 정리

변경:
- '학습 재생 설정' 패널을 홈 공통 영역에서 제거.
- DAY별 학습(daySection) 내부로 이동.
- 따라서 DAY VOCA 모드에서만 표시됨.
- MY 수업 / 소리영어 / OPIC에서는 표시되지 않음.
- 학습 순서(homeOrderMode), 자동 읽기 범위(homeSpeechMode) 기능은 기존 그대로 유지.
- 구버전/캐시 DOM에서도 mvPlaceDayPlaybackPanel()이 시작 시 DAY 영역으로 자동 이동시킴.

표준:
- 공통 홈: 학습 모드 선택
- DAY VOCA: DAY 선택/반복 + 학습 재생 설정 + DAY 카드
- MY/SORI/OPIC: 각 과목 전용 반복/재생 UI만 표시

기존 유지:
- 카드 직접 진입
- 전체 시작/정지 토글
- 무한 반복 표준
- 패턴 색상/한글 뜻
- 문장 말하기 이어하기
