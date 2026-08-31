MY VOCA V5.3.172
Base: V5.3.171

요청 반영
1. Drawer '2. 퀴즈' 아래에 과거 코드가 다시 추가하던 MY 수업 바로가기 삭제.
   - MY 수업은 오직 '1. 학습 > MY 수업'에서만 진입.
   - addDrawerMyClass()는 이제 legacy 항목 제거 역할만 수행.

2. Drawer '학습 기록 내보내기' 삭제.
   - 메뉴에서만 제거. 기존 export 데이터 함수 자체는 건드리지 않아 회귀 위험 최소화.

3. 문장 말하기 독립 화면의 '문장 말하기' 방식 선택 박스 삭제.
   - sentence activity에서는 quizModeSwitch 전체를 숨김.
   - 기존 sentence engine/진행상태/녹음 기능은 그대로 사용.

4. 단어 퀴즈 방식 이름/순서 변경.
   - 단어 맞추기
   - 유의어·반의어
   - 단어 말하기
   - 모르는 단어 선택
   - 문장 말하기는 Quiz UI에서 계속 숨김.
   - 내부 quizMode 값(choice/lexical/recall/favorite)은 변경하지 않아 기존 통계/오답/망각곡선 로직 보존.

표준화
- mvNormalizeQuizModeUI(): 퀴즈 탭 이름/순서 단일 관리.
- mvNormalizeDrawerMenu172(): legacy Drawer 항목 자동 제거.
- 기존 mvOpenQuizActivity / mvOpenSentenceSpeakingActivity 공통 Activity 라우팅 유지.
