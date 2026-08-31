MY VOCA V5.3.182
Base: restored stable V5.3.175

문장 말하기 메뉴 진입 오류 수정

확인한 원인
- 기존 mvOpenSentenceSpeakingActivity()가 openDay(...,'quiz')를 먼저 실행한 뒤
  setQuizMode('sentence')를 실행하고 있었음.
- openDay() 내부에서 activateDayTab('quiz') -> resetQuizSession()이 즉시 실행되기 때문에,
  진입 순간 기존 단어 퀴즈 모드로 문제가 먼저 렌더링되고 문장 UI만 뒤늦게 바뀌는 상태가 가능했음.

수정
- mvOpenSentenceSpeakingActivity()에서 quizMode='sentence'를 openDay()보다 먼저 확정.
- openDay()의 기존 공통 quiz/sentence 엔진이 처음부터 문장 deck을 렌더링하도록 수정.
- sentence source / resume / recording / TTS는 기존 공통 엔진 그대로 재사용.
- 별도 문장 말하기 엔진 또는 별도 녹음 코드는 추가하지 않음.

회귀 방지
- V5.3.175의 다른 기능은 변경하지 않음.
- 단어 퀴즈, DAY 학습, MY 수업, 소리영어, OPIC, 단어 비교,
  녹음, 전체 재생, 무한반복 코드는 그대로 유지.
