MY VOCA V5.3.134
1. speakOne() 공통 TTS 레이어에서 현재 재생 문장을 강조하도록 표준화.
2. 문장이 1개인지 여러 개인지 판단하지 않으므로 첫 번째 문장부터 항상 강조.
3. 학습/퀴즈/문장말하기/MY수업/Chunk 등 speakOne 기반 재생에 공통 적용.
4. SpeechSynthesis boundary 이벤트를 지원하는 브라우저에서는 현재 단어도 진한 보라색+흰 글자로 강조.
5. Android/Samsung Internet/WebView에서 boundary 이벤트를 제공하지 않는 경우 문장 강조는 되지만 단어 강조는 브라우저 제약으로 생략될 수 있음.
6. 기존 패턴 색상 markup이 있는 문장은 HTML을 깨지 않도록 단어 span 분해를 하지 않아 문장 강조만 적용.
