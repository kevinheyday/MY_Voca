MY VOCA V5.3.157
Base: V5.3.156

QUIZ · 문장 말하기 이어하기
- 문장 말하기에서 다른 화면으로 이동했다가 돌아오면 마지막 학습 위치를 복원합니다.
- 복원 단위:
  1) 현재 문장
  2) 현재 단계 (1 듣고 따라하기 / 2 빈칸 말하기 / 3 한글 보고 말하기)
  3) original / paraphrase 상태
  4) 문장 보기/숨기기 상태
- 진행 위치는 localStorage에 저장됩니다.
- 저장 Context는 DAY + 문장 소스(학습 예문/실전 리딩) + 필터(전체/틀린 문장)별로 분리됩니다.
- 따라서 다른 DAY나 다른 소스에서 공부한 위치와 섞이지 않습니다.
- 문장 퀴즈를 끝까지 완료하면 해당 Context의 이어하기 기록은 삭제됩니다.
- 퀴즈 화면으로 돌아올 때 문장 말하기 모드에서는 currentDay로 강제 초기화하지 않습니다.

Preserved:
- V5.3.154 single playback engine and infinite repeat.
- V5.3.155 Speaking English typography.
- V5.3.156 full SORI translations.
- ChunkRefs / Pattern Speaking / shared selection & scroll.
