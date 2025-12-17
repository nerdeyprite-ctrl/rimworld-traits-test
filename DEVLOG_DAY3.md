
# [변방계 정착민 테스트] 개발일지 3일차: "이거 너 아냐?" 공유를 부르는 기술 (OG Image & i18n)

"테스트 결과가 아무리 정확해도, 친구에게 보여줄 수 없다면 의미가 없다."
3일차는 테스트의 꽃인 **바이럴(Viral)** 요소를 기술적으로 구현하는 데 집중했습니다. 단순히 링크만 던지는 게 아니라, 링크를 보는 순간 클릭하고 싶게 만드는 **동적 미리보기 이미지**와 글로벌 확장을 위한 **다국어 시스템**을 구축했습니다.

---

## 1. 세상에 단 하나뿐인 공유 이미지 (Dynamic Open Graph)

친구에게 링크를 보냈는데 썸네일이 그냥 로고라면 재미없겠죠.
Next.js의 강력한 기능인 `ImageResponse`(`@vercel/og`)를 활용하여, **사용자의 결과에 따라 실시간으로 변하는 썸네일**을 구현했습니다.

### 🖼️ 구현 원리 (`/api/og`)
1.  결과 페이지 URL에 쿼리 파라미터(`?name=홍길동&mbti=ENTJ&traits=사이코패스`)를 포함시킵니다.
2.  카카오톡이나 트위터 크롤러가 이 URL을 긁어갑니다.
3.  Next.js Edge Function이 요청을 가로채서, HTML/CSS로 디자인된 레이아웃에 데이터를 주입합니다.
4.  순식간에 이미지(PNG)로 변환하여 응답합니다.

```typescript
// app/api/og/route.tsx (Simplified)
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const mbti = searchParams.get('mbti');
    
    return new ImageResponse(
        (
            <div style={{ background: '#111', color: '#fff' }}>
                <h1>{name}님의 정착민 유형</h1>
                <div style={{ fontSize: 60 }}>{mbti}</div>
            </div>
        ),
        { width: 1200, height: 630 }
    );
}
```

이제 단톡방에 링크를 올리면 **"홍길동님은 사이코패스 특성을 가진 방화광입니다"**라는 이미지가 대문짝만하게 뜹니다. 클릭을 안 할 수가 없죠.

---

## 2. 공유 버튼 삼총사 (Kakao, X, Link)

한국인에게 필수인 카카오톡, 글로벌의 X(트위터), 그리고 만능 링크 복사 버튼을 구현했습니다.

### 🛠️ 카카오톡 SDK 연동의 험난한 길
`window.Kakao` 객체를 사용하는 과정은 생각보다 까다로웠습니다.
- **이슈**: 리액트 컴포넌트가 렌더링될 때 아직 스크립트가 로드되지 않아 `Kakao is undefined` 에러 발생.
- **해결**: `next/script`의 로딩 전략을 조절하고, `window` 객체 유무를 체크하는 안전장치를 추가했습니다. (물론 완벽한 해결은 5일차 로그에서 다룹니다)

---

## 3. 글로벌 진출 준비 (i18n 다국어 지원)

림월드는 전 세계적인 게임입니다. 한국어만 지원하기엔 아쉬워서 **국제화(i18n)** 기초 공사를 시작했습니다.

### 🌍 데이터 구조 분리
기존에 하나의 JSON에 뭉쳐있던 질문과 특성 데이터를 언어별로 쪼갰습니다.
- `questions.json` ➡️ `questions_ko.json`, `questions_en.json`
- `traits.json` ➡️ `traits_ko.json`, `traits_en.json`

### 🗣️ LanguageContext 도입
`useLanguage()` 훅을 만들어 앱 어디서든 현재 언어 상태(`ko`/`en`)에 접근하고, 언어를 즉시 전환할 수 있게 만들었습니다. 단순히 텍스트만 바뀌는 게 아니라, **MBTI 계산에 쓰이는 데이터 소스 자체가 실시간으로 교체**되는 구조입니다.

---

## 4. 마치며

이제 "테스트 -> 결과 확인 -> 친구에게 공유"라는 핵심 루프가 완성되었습니다.
하지만 아직 부족합니다. 결과 페이지에 나오는 '백스토리'가 너무 밋밋하고 질문 개수도 좀 적은 느낌이 듭니다.

### 🔜 Next Step: 백스토리 대격변
다음 4일차 개발일지에서는 단순 텍스트였던 백스토리를 **게임 데이터 수준으로 고도화**하고, 질문을 대폭 추가하여 정확도를 높이는 과정을 다루겠습니다.
