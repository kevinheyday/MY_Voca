MY VOCA V5.3.169
Base: V5.3.168

학습 카드 직접 진입 수정

이번 변경:
- MY 수업 1~5, 소리영어 카드에 HTML 자체 onclick을 직접 부여.
- 카드 클릭 시 이벤트 추론/closest/delegation에 의존하지 않고 studyDirectOpenCourse(course, lesson)를 호출.
- studyDirectOpenCourse는 먼저 homePage를 숨기고 myClassPage를 직접 연 뒤 header/render를 실행.
- content:// 로컬 실행에서도 일반 click이 누락될 경우 pointerup fallback이 직접 열도록 유지.
- 기존 pointerup/click capture에서 stopImmediatePropagation을 제거하여 inline onclick을 막지 않음.
- OPIC 동적 카드에도 동일한 direct onclick 적용.
- 체크박스/버튼 클릭 제외 로직은 fallback route에서 유지.

표준:
DAY 카드처럼 MY / SORI / OPIC 카드 본문 클릭 = 즉시 해당 학습 화면 진입.

기존 유지:
- 전체 시작/정지 토글 표준
- 무한 반복 표준
- 패턴 색상 + 한글 뜻
- 문장 말하기 이어하기
