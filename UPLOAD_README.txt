MY VOCA V5.3.159
Base: V5.3.158

SORI 말하기 문장 교차오염 수정
원인:
- 공통 renderMyClass()는 SORI speaking 데이터를 정상 렌더링하고 있었음.
- 그러나 과거 MY 수업 전용 Speaking 패턴 강조 decorator가 렌더 직후 실행되면서
  MY_CLASS_LESSON_x.speaking 데이터를 myspeak 영역에 다시 덮어씀.
- 그래서 화면 상단의 SORI Prompt/Chunk/Cue는 맞지만 본문 영어만 MY 수업 문장으로 바뀌었음.

수정:
- MY 전용 decorator는 ACTIVE_STUDY_COURSE === 'my'일 때만 실행.
- render wrapper / 탭 click hook / 초기 delayed hook 모두 동일한 course guard 적용.
- SORI와 향후 OPIC speaking 데이터는 각 course registry 데이터만 사용.
- mvSpeakingCourseAudit(course) 추가.

SORI Speaking 1 기대값:
Prompt: Look beyond ~
Cue: 개인의 건강을 넘어서 더 큰 그림을 봐야 한다.
English: We need to look beyond personal health and see the bigger picture.
Korean: 우리는 개인의 건강을 넘어서 더 큰 그림을 봐야 합니다.

Preserved:
- V5.3.158 SORI 핵심문장 정리(24개)
- V5.3.157 문장 말하기 이어하기
- Single playback / infinite repeat / ChunkRefs / Pattern Speaking
