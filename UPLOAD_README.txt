MY VOCA V5.3.136
- CSS Custom Highlight API 의존 제거. Samsung Internet에서도 보이는 DOM class 방식으로 변경.
- MY 수업 Correction: .myStudyEn 정확한 정답 문장을 직접 강조.
- MY 수업 Native Chunk: .myChunkExample 정확한 예문을 직접 강조.
- MY 수업 Speaking: 각 .mySpeakSentence를 직접 강조.
- 공통 speakOne은 화면 전체에서 실제 TTS text와 가장 정확히 일치하는 최소 DOM element를 찾아 문장을 강조.
- 기존 패턴색 HTML을 보존하면서 내부 텍스트 노드만 임시 word span으로 감싸 현재 단어를 표시.
- TTS 종료 시 임시 word span을 자동 해제해 원래 DOM 구조로 복원.
- Android TTS가 boundary 이벤트를 제공하지 않으면 문장 강조는 동작하고 단어 강조만 생략될 수 있음.
