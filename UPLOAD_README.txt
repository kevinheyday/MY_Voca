MY VOCA V5.3.183
Base: V5.3.182

학습 ↔ 문장 말하기 Speaking Bridge

변경 범위
- MY 수업 / 소리영어 / OPIC이 공유하는 표준 학습 화면의 하단
  '현재 문장' 버튼만 '문장 말하기'로 교체.
- DAY 단어 학습의 '현재 단어', 단어 퀴즈, 무한반복 버튼은 변경하지 않음.

동작
1. 학습 화면에서 🗣 문장 말하기 클릭
2. 현재 course / lesson / tab / item / 현재 재생 문장을 공통 Context로 저장
3. 학습 재생은 정지
4. 기존 문장 말하기 엔진에 현재 문장 1개만 전달
5. 기존 문장 말하기 1~3단계 + 기존 녹음 엔진으로 연습
6. '← 학습으로 돌아가기'를 누르면 원래 course / lesson / tab / item 위치로 복귀
7. 복귀 후 재생은 안전하게 정지 상태 유지

직접 진입 규칙
- Drawer/일반 문장 말하기 직접 진입: 복귀 링크 없음.
- 학습 화면의 Speaking Bridge로 진입했을 때만 복귀 링크 생성.

표준화
- 별도 말하기 엔진 없음.
- 별도 녹음 엔진 없음.
- newSentenceRecallQuestion / sentenceRecording* 기존 공통 코드 재사용.
- M536에는 현재 학습 Context를 읽는 read-only helper만 추가.
