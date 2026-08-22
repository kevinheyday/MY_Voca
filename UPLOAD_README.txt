MY VOCA V5.3.124
1) MY 수업에서 무한 반복/전체 반복 중 홈 또는 다른 화면으로 이동하면 즉시 TTS와 반복 controller를 종료합니다.
   - goHome() 직접 중지
   - myClassPage hidden 상태 MutationObserver 안전장치
   - 다른 내비게이션 클릭 시 capture 단계에서 즉시 중지
2) 무한 반복 버튼 ON 상태를 M536 실제 infiniteKey와 직접 동기화합니다.
   - ON일 때 보라색 그라데이션
   - '반복 중' 문구 표시
   - aria-pressed=true 동기화
   - 반복 해제/화면 이동 시 원래 색으로 복원
