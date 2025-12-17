# [변방계 정착민 테스트] 개발일지 3일차: 세상 밖으로 (공유 기능 & 배포)

드디어 마지막 퍼즐 조각을 맞췄습니다. 내부 로직과 UI를 완성한 뒤, 오늘은 이 테스트를 전 세계(혹은 내 친구들)에게 알리기 위한 **배포 및 공유 기능**에 전력을 쏟았습니다. 이제 링크 하나만 던져주면, 친구 놈이 변방계에서 살아남을 수 있을지 바로 판독 가능합니다.

---

## 1. "야 너 이거 해봐" - 공유 기능 구현 (SEO & OG Image)

심리 테스트의 생명은 **바이럴(Viral)**입니다. 링크를 받았을 때 클릭하고 싶게 만드는 미리보기가 필수적이죠. 이를 위해 **Next.js의 동적 OG(Open Graph) Image** 생성 기능을 적극 활용했습니다.

### 🖼️ 동적 메타데이터 & 이미지
단순히 똑같은 이미지만 보여주는 게 아닙니다. 결과 페이지의 URL에 따라 **정착민의 이름, 특성, MBTI**가 박힌 결과 카드를 즉석에서 생성해 보여줍니다. 디스코드나 카톡에 공유했을 때 "어? 내 이름이 박혀있네?" 하고 클릭하게 만드는 것이 핵심 전략입니다.

```typescript
// app/api/og/route.tsx (간략화)
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get('name');
  
  return new ImageResponse(
    (
      <div style={{ ...rimworldStyle }}>
        <h1>{name}의 변방계 생존 결과</h1>
        {/* 특성과 MBTI 표시 */}
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
```

추가로 `react-share` 라이브러리와 카카오톡 JS SDK를 연동하여, 버튼 한 번으로 주요 SNS에 결과를 뿌릴 수 있게 만들었습니다.

---

## 2. GitHub & Vercel 배포 파이프라인

로컬에서만 돌리면 의미가 없죠. 코드를 클라우드로 쏘아 올렸습니다.

1.  **GitHub Repository**: `rimworld-traits-test` 리포지토리를 생성하고 소스 코드를 업로드했습니다. 커밋 메시지 하나하나에 영혼을 담았습니다(?).
2.  **Vercel Deployment**: Next.js의 고향 Vercel에 프로젝트를 연결했습니다. `git push`만 하면 자동으로 빌드되고 배포되는 CI/CD 파이프라인의 맛... 짜릿합니다.
3.  **Analytics 연동**: `@vercel/analytics`를 설치했습니다. 이제 누가, 언제, 어디서 내 테스트를 방문했는지 실시간으로 감시... 아니, 모니터링할 수 있습니다.

---

## 3. 검색 엔진 최적화 (SEO)

아무리 잘 만들어도 검색에 안 걸리면 무용지물입니다. 
- **robots.txt & sitemap.xml**: 구글 봇에게 "여기 맛집이야, 어서 긁어가"라고 지도를 쥐여주었습니다.
- **Semantic Metadata**: `layout.tsx`에 적절한 Title, Description, Keywords를 배치하여 검색 품질을 높였습니다.

```typescript
export const metadata: Metadata = {
  metadataBase: new URL("https://ratkin.org"),
  title: "변방계 정착민 테스트",
  keywords: ["림월드", "MBTI", "성격 테스트", "Rimworld"],
  // ...
};
```

---

## 4. 마무리하며

이제 `ratkin.org` (혹은 배포된 도메인)에서 누구나 테스트를 즐길 수 있습니다. 
단순한 호기심에서 시작된 프로젝트였지만, **로직 설계 -> UI 디자인 -> 공유 기능 -> 배포**까지 웹 개발의 A to Z를 속성으로 훑을 수 있었던 알찬 시간이었습니다.

이제 남은 건, 여러분의 결과입니다. 
과연 당신은 **인육을 즐기는 사이코패스**일까요, 아니면 **누구에게나 사랑받는 낙천적 일벌레**일까요?

> *지금 바로 변방계로 떠나보세요!*
