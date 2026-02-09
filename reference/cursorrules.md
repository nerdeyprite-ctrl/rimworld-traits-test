# Project Rules & Guidelines

이 프로젝트는 "RimWorld" 게임 스타일의 성격 테스트 웹사이트입니다.
아래의 원칙을 **엄격히(STRICTLY)** 준수하여 코드를 작성하십시오.

## 1. Zero Hallucination Policy (할루시네이션 금지)
- **절대 원칙:** `reference/rimworld_data.md` 파일에 명시된 특성(Traits)과 기술(Skills) 외에, 당신이 임의로 창작한 특성을 코드에 넣지 마십시오.
- 만약 사용자의 답변이 어떤 특성과도 연결하기 애매하다면, 새로운 특성을 만들지 말고 기존 특성의 점수 변동을 주지 않는 쪽을 택하십시오.
- 특성 간의 상충 관계(예: 우울증이면서 동시에 낙천적이면 불가능)를 로직에 반드시 반영하십시오.

## 2. Tech Stack & Style
- **Framework:** Next.js (App Router), TypeScript
- **Styling:** Tailwind CSS
- **State Management:** React Context API (복잡한 전역 상태 관리용) 또는 간단한 useState.

## 3. UI/UX Design Guidelines (RimWorld Theme)
- **Color Palette:**
  - Background: Dark Grey / Brown (`#111111`, `#1e1e1e`)
  - Text: White or Light Grey (`#dddddd`)
  - Highlight: Orange/Yellow for interaction (`#9f752a` - 림월드 UI 컬러 참고)
  - Interactive Panels: Semi-transparent black backgrounds with explicit borders.
- **Components:**
  - 버튼과 패널은 림월드 인게임 메뉴처럼 각진 형태(Square borders)를 유지하십시오.
  - 폰트는 가독성이 좋으면서도 게임 분위기가 나는 산세리프(Sans-serif) 계열을 우선 사용하십시오.

## 4. Code Structure for "Traits System"
- 특성 데이터는 하드코딩하지 말고 `data/traits.json`과 같은 JSON 파일이나 `constants` 객체로 분리하여, 비개발자도 수치를 조정할 수 있게 만드십시오.
- 각 질문(Question)은 특정 특성 점수(Score)에 가중치(Weight)를 주는 방식이어야 합니다. (1:1 대응 금지)

## 5. Language
- 코드는 영어로 변수명을 짓되, 주석과 사용자에게 보이는 텍스트(UI)는 **한국어(Korean)**를 사용하십시오.

# Role: Trait System Manager

## Core Requirement
- 시뮬레이션 코드 수정 시 `reference/rimworld_data.md` 파일을 최우선으로 참조할 것.
- 새로운 Trait 관련 기능을 추가하거나, 기존 Trait의 로직/변수를 수정할 경우 **반드시** `reference/rimworld_data.md` 파일도 동시에 업데이트해야 함.

## Workflow
1. 수정 사항이 Trait 시스템과 관련 있는지 확인.
2. 관련이 있다면 `reference/rimworld_data.md`를 읽어 현재 규격 확인.
3. 코드 수정 후, 변경된 내용을 바탕으로 `reference/rimworld_data.md`의 내용을 최신화(추가/삭제/수정)할 것.
4. 모든 응답 끝에 "rimworld_data.md 업데이트 완료" 여부를 표시할 것.

## Simulation Data Sync
   - **대상**: `simulation-client` 관련 코드 작업 시.
   - **필수 동작**: 코드 변경에 따라 `app/simulation/data` 폴더 내의 관련 파일들(JSON, 리소스 등)을 반드시 최신화할 것.
   - **확인**: 코드 로직이 바뀌었는데 데이터 파일이 그대로라면, 사용자에게 데이터 구조 변경 여부를 묻거나 직접 업데이트를 제안할 것.
