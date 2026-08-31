MY ENGLISH V5.3.177
Base: V5.3.176

네비게이션 정상화
- 3줄 메뉴를 app.js 최상단 독립 Navigation Safety Layer로 이동.
- 뒤쪽 선택 기능에서 오류가 나도 햄버거 메뉴 열기/닫기는 동작.
- 기존 중복 hamburger listener 제거.
- HTML onclick fallback 추가.
- 홈은 DAY VOCA / MY 수업 / 소리영어 / OPIC 4개 모드를 검사하고 누락 시 자동 복구.
- 홈 메뉴는 DAY VOCA 기준 홈으로 정상 복귀.
- Drawer의 각 학습 메뉴도 동일한 홈 모드 전환 코드를 사용.
- 학습/퀴즈/문장말하기/녹음/재생/무한반복 엔진은 변경하지 않음.
