MY VOCA V5.3.123 NORMALIZED
- V5.3.122에서 index.html에 메인 app.js 실행 코드가 빠져 3줄 메뉴와 홈 기능이 동작하지 않던 문제 수정
- index.html 안에 app.js를 직접 포함하는 SINGLEFILE 구조로 정상화
- GitHub Pages뿐 아니라 로컬 index.html 실행에서도 UI/메뉴가 동작하도록 복구
- 음성 녹음 학습 메뉴 유지
- 문장 말하기 3단계와 음성 녹음 학습은 동일한 공용 Recorder 로직 유지
- 홈 화면 기본 표시 상태 재확인
- 새 음성 녹음 학습 화면은 기본 hidden 상태 유지
