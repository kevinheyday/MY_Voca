MY VOCA V5.3.160
Base: V5.3.159

말하기 패턴 색상 공통 표준화
- MY 수업 / 소리영어 / OPIC 모두 같은 규칙 적용.
- 말하기 문장에 실제로 사용된 학습 패턴은 반드시 보라색 하이라이트.
- speaking 항목의 pattern / patterns / chunkRef / chunkRefs를 공통 해석.
- speaking에 별도 pattern 메타데이터가 없어도 같은 lesson의 Chunk와 문장을 대조해 자동 탐지.
- have → having, be → is/are, take → taking 같은 활용형도 패턴으로 인식하도록 matcher 강화.
- MY 전용 legacy Speaking decorator가 DOM을 다시 그린 뒤에도 공통 하이라이트를 재적용.
- 문장 말하기 Quiz용 speaking sentence cards에도 동일한 pattern metadata 전달.
- mvSpeakingPatternAudit(course, lesson) 점검 함수 추가.

표준 색상:
- Pattern: 진한 보라색 글자 + 연보라색 배경
- TTS 현재 문장 강조 중에도 패턴 식별 유지

Preserved:
- V5.3.159 SORI/MY speaking data isolation
- V5.3.158 SORI 핵심문장 정리 24개
- V5.3.157 문장 말하기 이어하기
- Single playback / infinite repeat / ChunkRefs
