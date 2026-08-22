MY VOCA V5.3.128
중요 변경:
1. 무한 반복 버튼은 pointerdown(손가락이 닿는 순간)부터 보라색으로 즉시 표시.
2. paintMyClassInfinityButton() 하나로 색상 처리를 통합.
3. 화면 오른쪽 위에 v5.3.128 배지를 표시하여 실제 최신 버전 로딩 여부를 확인 가능.
4. 개발 중 오래된 버전이 남는 문제를 없애기 위해 Service Worker를 임시 비활성화.
5. 접속 시 기존 Service Worker 등록과 Cache Storage를 자동 제거.
테스트:
- 화면 우측 상단에 반드시 v5.3.128이 보여야 함.
- 안 보이면 GitHub에 새 index.html이 아직 배포되지 않은 것.
- v5.3.128이 보인 상태에서 '∞ 집중' 버튼에 손을 대는 순간 보라색으로 변해야 함.
