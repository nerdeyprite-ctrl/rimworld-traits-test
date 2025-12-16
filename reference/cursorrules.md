# Project Rules & Guidelines

이 프로젝트는 "RimWorld" 게임 스타일의 성격 테스트 웹사이트입니다.
아래의 원칙을 **엄격히(STRICTLY)** 준수하여 코드를 작성하십시오.

## 1. Zero Hallucination Policy (할루시네이션 금지)
- **절대 원칙:** `reference/rimworld_constants.md` 파일에 명시된 특성(Traits)과 기술(Skills) 외에, 당신이 임의로 창작한 특성을 코드에 넣지 마십시오.
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

## 6. Monetization & Tracking Principles (수익화 및 추적 원칙)

수익 창출은 이 프로젝트의 최우선 목표이다.

- **AdSense 준비:** 결과 페이지와 메인 페이지 하단에 Google AdSense 광고를 삽입할 수 있는 **반응형 컨테이너(Placeholder)**를 미리 구현할 것.
- **광고 유도 기능:** '풀 테스트(상세 결과)'를 보기 전에 **전면 광고**를 시청하도록 유도하는 로직을 미리 설계할 것. (예: "상세 스탯을 보려면 광고를 시청해주세요" 버튼)
- **분석 스크립트:** Google Analytics(GA) 또는 기타 트래픽 분석 도구를 쉽게 삽입할 수 있도록 **Head 태그 영역에 Script 컴포넌트를 미리 구성**할 것.
- **공유 기능 필수:** 테스트 결과 페이지에 카카오톡/X(트위터)/페이스북 공유 버튼을 구현하고, 공유 시 썸네일 이미지(OG Image)가 보이도록 **SEO 메타태그**를 완벽하게 구성할 것.