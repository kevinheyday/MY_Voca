MY VOCA V5.3.121
- 다른 브라우저/카카오톡 외부 브라우저에서 이전 버전이 열리는 캐시 문제를 완화했습니다.
- Service Worker: skipWaiting() + clients.claim() 적용
- 이전 버전 캐시 자동 삭제
- index.html/app.js/app.css는 network-first + no-store fetch
- Service Worker 등록 시 updateViaCache:'none' 사용
- 새 Service Worker가 설치되면 controllerchange 시 자동 새로고침
- HTML에 no-cache 메타 태그 추가
- GitHub Pages에 전체 파일을 덮어쓴 뒤 1회 새로고침 권장
