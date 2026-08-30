MY VOCA V5.3.166
Base: V5.3.165

무한 반복 재생 완전 표준화

확인된 문제:
- '현재 문장' 버튼 경로가 아직 M536.course를 ACTIVE_STUDY_COURSE보다 먼저 사용하고 있어,
  SORI 화면에서도 stale 'my' course로 라우팅될 수 있었음.
- 상단 ∞ 버튼, 카드 ∞ 버튼, 하단 현재 문장 버튼이 서로 다른 이벤트 경로를 사용하고 있었음.
- legacy repeatCurrent와 modern M536 infinite 상태가 UI에서도 혼재함.

수정:
- m536ToggleInfiniteByKey(course|lesson|tab|index) 단일 진입점 추가.
- 상단 ∞ / 카드 ∞ / 하단 현재 문장 버튼 모두 동일 delegated router 사용.
- 카드별 onclick 제거.
- 현재 문장 버튼의 course는 m536ActiveCourse()로 통일.
- M536 infinite 상태를 하단 버튼 ON/OFF 표시의 source-of-truth로 통일.
- 시작/해제 시 상단, 카드, 하단 버튼 상태를 동시에 sync.
- MY / SORI / OPIC 모두 동일 엔진, 동일 canonical key 사용.
- mvInfinityStandardAudit(course) 추가.

기존 유지:
- Pattern 영어+한글 뜻
- Pattern=teal/mint, Playback=purple
- 모든 문장 패턴 색상 표준
- SORI/MY speaking isolation
- 문장 말하기 이어하기
