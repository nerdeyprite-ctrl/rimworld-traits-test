# 변방계 정착민 테스트 (Rimworld Traits Test)

> 당신이 림월드에 떨어진다면 어떤 특성을 가질까요?

[![Deploy with Vercel](https://vercel.com/button)](https://test.ratkin.org)

## 🎮 프로젝트 소개

림월드(RimWorld) 게임의 특성 시스템을 기반으로 한 성격 테스트 웹 애플리케이션입니다. 사용자의 선택에 따라 림월드 정착민으로서의 특성, 스킬, MBTI, 백스토리를 분석합니다.

**🔗 라이브 데모**: [https://test.ratkin.org](https://test.ratkin.org)

## ✨ 주요 기능

### 📊 3단계 테스트 시스템
- **Part 1: 특성 테스트** (40문항) - 성격 특성 분석
- **Part 2: 배경 테스트** (10문항) - 출신, 유년기, 성년기, 인생 사건
- **Part 3: 스킬 테스트** (15문항) - 12가지 스킬 적성 평가

### 🎯 정교한 분석 시스템
- **특성 스펙트럼 계산**: Mood, Work, Nerve, Beauty, Speed 5개 축
- **독립 특성 판정**: 70+ 개의 림월드 특성
- **스킬 레벨 & 열정도**: 0-20 레벨, 3단계 열정 (없음/관심/타오름)
- **무능력 시스템**: 2회 이상 부정 선택 시 스킬 무능력 판정
- **MBTI 계산**: 스킬 기반 성격 유형 분석
- **백스토리 매칭**: 40개의 정통 림월드 백스토리 (아동기 15개 + 성인기 25개)

### 🌍 다국어 지원
- 한국어 (기본)
- English (완전 지원)

### 📱 공유 기능
- **카카오톡**: 동적 OG 이미지 생성
- **트위터(X)**: 자동 해시태그 및 링크
- **디스코드**: 앱 자동 실행 + 링크 복사
- **URL 복사**: 클립보드 복사

### 🎨 UI/UX
- 반응형 디자인 (모바일/태블릿/데스크톱)
- 다크 테마
- 진행률 표시
- 부드러운 애니메이션
- 접근성 최적화

## 🛠️ 기술 스택

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Analytics**: Vercel Analytics

### Backend & Deployment
- **Hosting**: Vercel
- **Domain**: test.ratkin.org
- **API Routes**: Next.js API Routes
- **OG Image Generation**: @vercel/og

### SEO & Sharing
- **Metadata**: Next.js Metadata API
- **Sitemap**: Dynamic sitemap.xml
- **Robots**: robots.txt
- **Social Sharing**: Kakao SDK, Twitter, Discord

## 📁 프로젝트 구조

```
rimworld-traits-test/
├── app/                      # Next.js App Router
│   ├── api/og/              # 동적 OG 이미지 생성
│   ├── result/              # 결과 페이지
│   ├── share/               # 공유 페이지 (동적 메타데이터)
│   ├── test/                # 테스트 페이지
│   ├── layout.tsx           # 루트 레이아웃
│   ├── page.tsx             # 랜딩 페이지
│   ├── robots.ts            # robots.txt 생성
│   └── sitemap.ts           # sitemap.xml 생성
├── components/              # React 컴포넌트
│   ├── Layout.tsx           # 메인 레이아웃
│   ├── ShareButtons.tsx     # 공유 버튼
│   └── VisitorCounter.tsx   # 방문자 카운터
├── context/                 # React Context
│   ├── LanguageContext.tsx  # 다국어 지원
│   └── TestContext.tsx      # 테스트 상태 관리
├── data/                    # 데이터 파일
│   ├── backstories_ko.json  # 백스토리 (한국어)
│   ├── backstories_en.json  # 백스토리 (영어)
│   ├── questions_ko.json    # 질문 (한국어)
│   ├── questions_en.json    # 질문 (영어)
│   ├── skills.json          # 스킬 정의
│   └── traits.json          # 특성 정의
├── types/                   # TypeScript 타입 정의
│   └── rimworld.ts
├── reference/               # 참고 문서
│   ├── rimworld_backstories.md
│   └── cursorrules.md
├── DATA_GUIDE.md            # 데이터 작성 가이드
└── DEVLOG_DAY3.md           # 개발 로그
```

## 🚀 시작하기

### 필수 요구사항
- Node.js 18.17 이상
- npm 또는 yarn

### 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/nerdeyprite-ctrl/rimworld-traits-test.git
cd rimworld-traits-test

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

### 빌드

```bash
# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

## 📊 데이터 구조

### 질문 데이터 (`questions_ko.json`, `questions_en.json`)
```json
{
  "id": 1,
  "groupId": "p1_mood_1",
  "text": "질문 내용",
  "answers": [
    {
      "text": "답변 내용",
      "scores": {
        "Mood": 2,
        "optimist": 1,
        "Social": 1
      }
    }
  ]
}
```

### 백스토리 데이터 (`backstories_ko.json`, `backstories_en.json`)
```json
{
  "id": "tribe_child",
  "title": "부족 아이",
  "titleShort": "부족민",
  "description": "부족 사회에서 자랐다...",
  "skillBonuses": {
    "Plants": 2,
    "Melee": 2
  },
  "workDisables": [],
  "traits": [],
  "spawnCategories": ["Tribal"]
}
```

자세한 내용은 [DATA_GUIDE.md](./DATA_GUIDE.md)를 참조하세요.

## 🎯 로드맵

### ✅ 완료
- [x] 기본 테스트 시스템 구현
- [x] 특성 스펙트럼 로직
- [x] 스킬 계산 및 무능력 시스템
- [x] MBTI 계산
- [x] 백스토리 데이터베이스 (40개)
- [x] Part 2 질문 확장 (답변 4개 → 6개)
- [x] 다국어 지원 (한국어/영어)
- [x] 공유 기능 (카카오톡/트위터/디스코드)
- [x] SEO 최적화
- [x] 도메인 연결 (test.ratkin.org)

### 🔄 진행 중
- [ ] 카카오톡 JavaScript Key 설정
- [ ] 영어 버전 Part 2 질문 확장
- [ ] 백스토리 자동 매칭 로직 구현

### 📋 예정
- [ ] 결과 이미지 다운로드 기능
- [ ] 통계 페이지 (인기 특성/MBTI)
- [ ] 친구와 비교 기능
- [ ] 모바일 앱 (React Native)

## 🤝 기여하기

기여는 언제나 환영합니다!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다.

## 👨‍💻 개발자

**Nerdeyprite**
- GitHub: [@nerdeyprite-ctrl](https://github.com/nerdeyprite-ctrl)

## 🙏 감사의 말

- [RimWorld](https://rimworldgame.com/) - 게임 및 특성 시스템
- [RimWorld Wiki](https://rimworldwiki.com/) - 백스토리 데이터
- [Vercel](https://vercel.com/) - 호스팅 및 배포
- [Next.js](https://nextjs.org/) - 프레임워크

---

⭐ 이 프로젝트가 마음에 드셨다면 Star를 눌러주세요!
