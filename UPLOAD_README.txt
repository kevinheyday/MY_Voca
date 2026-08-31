MY VOCA V5.3.184
Base: V5.3.183

Speaking Bridge 화면 전환 오류 수정

확인된 원인
- v5.3.183에서 학습 → 문장 말하기 Bridge 자체는 실행됐지만,
  기존 openDay()는 homePage만 숨기고 myClassPage/myClassBottom은 숨기지 않음.
- 따라서 문장 말하기 화면이 아래에서 열려도 MY 수업/소리영어 화면이 위에 그대로 남아
  사용자가 보기에는 이동하지 않은 것처럼 보였음.

수정 범위
- mvOpenSpeakingBridge183()의 페이지 전환 부분만 수정.
- Bridge 진입 직전에 myClassPage / myClassBottom을 명시적으로 숨김.
- 이후 기존 openDay(...,'quiz') + 기존 sentence engine을 그대로 사용.
- 복귀 로직, 녹음, TTS, 퀴즈, 전체재생, 무한반복, DAY 학습에는 변경 없음.

동작
학습 화면 → 문장 말하기 → 현재 문장 1개 연습 → 학습으로 돌아가기 → 원래 course/lesson/tab/card 복귀
