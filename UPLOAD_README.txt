MY VOCA V5.3.127
- 무한 반복 버튼은 클릭 순간 controller보다 먼저 보라색으로 paint
- renderMyClass가 버튼을 새로 만들 때도 M536 상태를 읽어 active 상태로 HTML 자체를 생성
- 반복 중 250ms heartbeat가 active 색상을 강제로 유지
- active 상태 문구는 '집중' -> '반복 중'
- 기존 HARD STOP 로직 유지
