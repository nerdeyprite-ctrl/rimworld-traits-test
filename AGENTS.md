## Skills

이 프로젝트에서 우선 사용하는 검증 스킬 목록입니다.

| Skill | Purpose |
|-------|---------|
| `verify-simulation-card-flow` | `/simulation` 카드 플립/턴 전환/선택지 스타일 및 이벤트 델타 표시 정합성을 검증합니다. |
| `verify-settler-profile-leaderboard-integrity` | 결과 자동저장 중복 방지, 리더보드 제출 조건/오류 노출, 모바일 가독성 규칙을 검증합니다. |
| `verify-implementation` | 등록된 `verify-*` 스킬을 순차 실행해 통합 검증 보고서를 생성합니다. |
| `manage-skills` | 세션 변경사항을 분석해 verify 스킬 커버리지 누락을 탐지하고 스킬 목록을 유지보수합니다. |

## Notes

- 기능 구현 후 및 PR 전에는 `$verify-implementation`을 실행합니다.
- 새로운 규칙/파일 패턴 도입 후에는 `$manage-skills`로 스킬 드리프트를 점검합니다.
