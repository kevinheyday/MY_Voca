MY VOCA V5.3.164
Base: V5.3.163

패턴 표시 누락 + 색상 체계 수정

1. Chunk 패턴 매칭 보강
- 'far more + adjective than ~' 같은 문법형 패턴에서
  adjective / noun / verb 등은 실제 문장에 그대로 존재하는 단어가 아니라
  슬롯이라는 것을 공통 matcher가 이해하도록 수정.
- 예:
  Pattern: far more + adjective than ~
  Sentence: Alcohol can be far more harmful than cigarettes.
  → 'far more harmful than'을 패턴으로 인식/표시.

2. 색상 의미 표준 변경
- 패턴: TEAL / MINT (청록 글자 + 연민트 배경)
- 현재 재생 문장/단어: PURPLE
- 따라서 재생 중에도 패턴과 재생 상태를 시각적으로 구분할 수 있음.

3. 적용 범위
- MY 수업
- 소리영어
- OPIC
- 핵심문장
- Chunk 예문
- 말하기 문장
모두 동일한 규칙.

4. 유지
- 말하기 prompt/pattern 중복 제거
- SORI 무한반복 routing 수정
- 문장 말하기 이어하기
