MY VOCA V5.3.129
핵심 수정:
- DAY Loop Training에서 잘 동작하는 방식 그대로 MY 수업 집중 반복 버튼에 적용.
- M536 재생 상태와 버튼 색상을 분리.
- MY_CLASS_INFINITY_VISUAL_KEY 하나로 버튼 색상만 단순 제어.
- 같은 버튼 누르면 focused 해제, 다른 버튼 누르면 새 focused로 즉시 변경.
- renderMyClass로 카드가 다시 그려져도 visual key 기준으로 색상 복원.
- 화면 이동/전체 정지 시 visual key도 즉시 초기화.
테스트:
1. 우측 상단 v5.3.129 확인.
2. MY 수업 > CORRECTION 1의 ∞ 집중 버튼 터치.
3. Day Loop Sentence 버튼처럼 즉시 보라색으로 바뀌어야 함.
4. 같은 버튼 다시 누르면 흰색으로 복원되어야 함.
