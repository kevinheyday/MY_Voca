MY VOCA V5.3.190
Base: V5.3.189

Pattern inflection / grammar-slot standardization build

수정:
- strike a deal → struck a deal 같은 불규칙 동사 형태까지 동일 패턴으로 인식
- give up ~ing → give up retaking처럼 문법 슬롯(~ing) 실제 단어까지 함께 색상 표시
- end up ~ing / have a hard time ~ing / get used to -ing 등 같은 슬롯 패턴도 동일 처리
- settle in well → settling in well 등 silent-e 동사 변화 유지
- MY / 소리영어 / OPIC 공통 studyFindPatternHits 엔진에만 적용
- lowercase article a를 grammar placeholder A로 잘못 제거하던 문제 수정 (strike a deal 누락 원인)
- mvPatternInflectionAudit190() 추가

기존 학습/재생/녹음/선택/브리지 기능 유지
