MY ENGLISH V5.3.180
Base: V5.3.179

전체 네비게이션 재점검 / 정상화

핵심 원인
- 소리영어 홈 버튼은 선택 상태만 바뀌는데 실제 .soriClassSection / soriGroup1Card가 없는 상태가 생길 수 있었음.
- Drawer의 early capture router와 뒤쪽 개별 action handler가 서로 다른 함수 경로를 사용해 일부 메뉴가 무반응이 될 수 있었음.

수정
1. mvEnsureCourseHomeSection180()
- SORI/OPIC 홈 section이 없으면 공통 규칙으로 생성.
- SORI 카드(soriGroup1Card)가 없으면 현재 SORI_GROUP_1 데이터로 자동 생성.
- Chunk / 핵심 문장 / 말하기 / 소리 Point 개수 표시.

2. mvShowHomeCourse180()
- DAY / MY / SORI / OPIC 홈 전환을 하나의 함수로 통일.
- SORI를 누르면 반드시 SORI 수업 카드가 보임.

3. mvRouteDrawerAction180()
- 3줄 메뉴의 모든 action을 하나의 Router로 통일.
- 단어 퀴즈 / 단어 비교 / 문장 말하기 / 음성 녹음 / 통계 / 망각곡선 / Config / 사용방법 / 업데이트 / 앱정보 모두 기존 엔진으로 연결.
- 기능별 별도 복제 코드 없음.

4. Course card
- MY / SORI / OPIC 카드 클릭도 하나의 공통 delegated route 사용.

보존
- 기존 학습 데이터
- 문장 말하기 이어하기
- 녹음 엔진
- 전체 재생/정지
- 무한 반복
- 패턴 표시
