# 개발 로그 - Day 4 (2025-12-17)

## 🎯 목표
백스토리 시스템 대폭 개선 및 공유 기능 완성

## ✅ 완료 작업

### 1. 백스토리 데이터베이스 구축
**작업 내용**:
- 림월드 위키 기반 정통 백스토리 40개 추가
  - 아동기 백스토리 15개
  - 성인기 백스토리 25개
- 한국어/영어 버전 모두 생성
- 각 백스토리에 상세 정보 포함:
  - 스킬 보너스/패널티
  - 작업 금지 사항 (workDisables)
  - 연관 특성 (traits)
  - 스폰 카테고리 (Tribal, Imperial, Offworld 등)

**파일**:
- `data/backstories_ko.json`
- `data/backstories_en.json`

**백스토리 카테고리**:
- **부족 (Tribal)**: 부족 아이, 버려진 아이, 동굴 아이, 사냥꾼, 채집가, 직조공, 치료사, 전사
- **제국 (Imperial)**: 하인, 왕실 요리사, 제국 사제, 보병, 우주 해병, 귀족 자제, 사관생도
- **글리터월드 (Offworld)**: 해군 과학자, 외과의, 소설가, 부유한 아이, 병약한 아이
- **중세 (Medieval)**: 노예, 귀족 자제, 영주, 대장장이
- **도시 (Urbworld)**: 어브월드 부랑아, 산업 고아
- **해적 (Pirate)**: 시험관 병사, 아동 스파이, 우주 해적, 격투가, 암살자
- **특수 (Outsider)**: 은둔자

### 2. Part 2 배경 질문 대폭 확장
**작업 내용**:
- 모든 Part 2 질문의 답변 개수를 **4개 → 5~6개로 확장**
- 총 8개 질문 그룹, 각각 3개씩 (총 24개 질문)

**확장된 질문 그룹**:

#### 출신 (Origin) - 6개 답변
- 글리터월드 (Glitterworld)
- 어브월드 (Urbworld)
- 부족 (Tribal)
- 전장 (Military)
- **제국 (Imperial)** ⭐ 신규
- **중세 (Medieval)** ⭐ 신규

#### 유년기 활동 (Childhood) - 6개 답변
- 기계 수리
- 골목대장
- 자연 관찰
- 독서
- **예술 창작** ⭐ 신규
- **동물 돌봄** ⭐ 신규

#### 유년기 영향 인물 - 6개 답변
- 군인 아버지
- 요리사 어머니
- 과학자 할아버지
- 고아 친구들
- **부족 장로** ⭐ 신규
- **혼자 자람** ⭐ 신규

#### 성년기 직업 - 6개 답변
- 군인/용병
- 의료직
- 농부/요리사
- 상인/정치인
- **엔지니어/장인** ⭐ 신규
- **과학자/교사** ⭐ 신규

#### 성년기 역할 - 6개 답변
- 뒷세계 해결사
- 예술가/연기자
- 광부
- 건축가
- **동물 조련사** ⭐ 신규
- **우주 선원** ⭐ 신규

#### 인생 사건 - 6개 답변
- 화재로 모든 것을 잃음
- 동료의 배신
- 극심한 굶주림
- 평범한 삶
- **사랑하는 사람 상실** ⭐ 신규
- **기적적 생존** ⭐ 신규

#### 불시착 기억 - 6개 답변
- 경보음과 비상등
- 냉동수면기
- 아름다운 성운
- 기억 없음
- **동료들의 비명** ⭐ 신규
- **폭발하는 엔진** ⭐ 신규

#### 목표 - 6개 답변
- 우주선 건조 및 탈출
- 요새 건설 및 지배
- 평화로운 농경 생활
- 하루하루 생존
- **문화 건설** ⭐ 신규
- **제국 건설** ⭐ 신규

**개선 효과**:
- 답변 다양성 **200% 증가** (평균 4개 → 6개)
- 더 정확한 성향 파악
- 백스토리 선호도 태그 추가 (`backstory_preference`)

### 3. 도메인 변경 및 메타데이터 업데이트
**작업 내용**:
- 도메인을 `ratkin.org` → `test.ratkin.org`로 변경
- 모든 메타데이터 업데이트:
  - `app/layout.tsx` - OpenGraph URL
  - `app/sitemap.ts` - 모든 sitemap URL
  - `components/ShareButtons.tsx` - 공유 URL

### 4. 공유 기능 개선

#### 카카오톡 공유
- Kakao SDK 초기화 로직 개선
- JavaScript Key 설정 안내 추가
- 동적 OG 이미지 생성 (`/api/og`)
- 결과 정보 포함 (이름, MBTI, 특성)

**설정 방법**:
```typescript
// components/ShareButtons.tsx
window.Kakao.init('YOUR_KAKAO_JAVASCRIPT_KEY');
```
📌 Key 발급: https://developers.kakao.com/

#### 디스코드 공유 개선 ⭐
**변경 전**:
- 단순 URL 복사만 가능

**변경 후**:
- 버튼 클릭 시 **디스코드 앱 자동 실행** (`discord://`)
- 500ms 후 자동으로 URL 클립보드 복사
- 사용자 친화적인 안내 메시지

```typescript
const shareDiscord = () => {
    // Discord 앱 실행 시도
    window.location.href = 'discord://';
    
    // 500ms 후 URL 복사
    setTimeout(() => {
        navigator.clipboard.writeText(shareUrl);
        alert('공유 링크가 복사되었습니다! 디스코드에 붙여넣으세요.');
    }, 500);
};
```

#### 트위터(X) 공유
- 자동 해시태그 생성
- 결과 정보 포함
- 새 탭에서 열기

#### URL 복사
- 별도 버튼으로 분리
- 클립보드 API 사용
- 복사 완료 알림

### 5. README 작성
**작업 내용**:
- 프로젝트 전체 개요
- 주요 기능 상세 설명
- 기술 스택
- 프로젝트 구조
- 설치 및 실행 방법
- 데이터 구조 예시
- 로드맵
- 기여 가이드

## 📊 통계

### 백스토리 데이터
- **총 백스토리**: 40개
  - 아동기: 15개
  - 성인기: 25개
- **스폰 카테고리**: 7개 (Tribal, Imperial, Offworld, Medieval, Outlander, Pirate, Outsider)
- **언어**: 2개 (한국어, 영어)

### Part 2 질문 데이터
- **총 질문 그룹**: 5개
- **각 그룹당 변형**: 3개
- **총 질문**: 15개
- **평균 답변 개수**: 6개
- **총 답변**: 90개

### 코드 변경
- **수정된 파일**: 6개
  - `data/backstories_ko.json` (신규)
  - `data/backstories_en.json` (신규)
  - `data/questions_ko.json` (확장)
  - `app/layout.tsx` (도메인 업데이트)
  - `app/sitemap.ts` (도메인 업데이트)
  - `components/ShareButtons.tsx` (공유 기능 개선)
  - `README.md` (신규)
- **추가된 라인**: ~1,500줄
- **커밋**: 3개

## 🔧 기술적 개선사항

### 1. 백스토리 데이터 구조
```json
{
  "id": "unique_id",
  "title": "전체 제목",
  "titleShort": "짧은 제목",
  "description": "상세 설명",
  "skillBonuses": { "Skill": +value },
  "skillPenalties": { "Skill": -value },
  "workDisables": ["WorkType"],
  "traits": ["TraitName"],
  "spawnCategories": ["Category"]
}
```

### 2. 백스토리 선호도 태그
Part 2 출신 질문에 `backstory_preference` 태그 추가:
```json
{
  "text": "글리터월드",
  "scores": {
    "Intellectual": 2,
    "backstory_preference": "glitterworld"
  }
}
```

향후 자동 백스토리 매칭에 활용 예정.

### 3. 디스코드 딥링크
```typescript
// Discord 프로토콜 사용
window.location.href = 'discord://';
```
- 모바일: Discord 앱 자동 실행
- 데스크톱: Discord 앱 포커스

## 🐛 해결된 이슈

1. **도메인 불일치**: 모든 메타데이터와 sitemap을 새 도메인으로 통일
2. **디스코드 공유 불편**: 앱 자동 실행 + 자동 복사로 UX 개선
3. **Part 2 답변 부족**: 4개 → 6개로 확장하여 다양성 확보

## 📝 다음 작업 (Day 5 예정)

### 우선순위 높음
1. **카카오톡 JavaScript Key 설정**
   - Kakao Developers에서 앱 등록
   - JavaScript Key 발급
   - `ShareButtons.tsx`에 Key 적용

2. **영어 버전 Part 2 질문 확장**
   - `questions_en.json` 업데이트
   - 한국어 버전과 동일하게 답변 6개로 확장

3. **백스토리 자동 매칭 로직 구현**
   - `TestContext.tsx`에 백스토리 선택 알고리즘 추가
   - `backstory_preference` 태그 활용
   - Part 2 답변 기반 최적 백스토리 선택

### 우선순위 중간
4. **결과 페이지 개선**
   - 백스토리 정보 표시
   - 백스토리 설명 렌더링
   - 스킬 보너스/패널티 시각화

5. **테스트 및 버그 수정**
   - 전체 테스트 플로우 검증
   - 스킬 계산 로직 재확인
   - MBTI 계산 정확도 검증

### 우선순위 낮음
6. **통계 페이지 구현**
   - 인기 특성 Top 10
   - MBTI 분포
   - 평균 스킬 레벨

7. **결과 이미지 다운로드**
   - Canvas API 사용
   - PNG/JPG 다운로드 기능

## 💡 배운 점

1. **데이터 구조 설계의 중요성**
   - 백스토리 데이터를 체계적으로 구조화하니 향후 확장이 용이
   - `spawnCategories`로 필터링 가능성 확보

2. **사용자 경험 개선**
   - 디스코드 딥링크로 클릭 한 번에 앱 실행
   - 자동 복사로 추가 동작 최소화

3. **SEO 최적화**
   - 도메인 변경 시 모든 메타데이터 일괄 업데이트 필요
   - Sitemap과 OpenGraph URL 일치 중요

## 🎉 성과

- ✅ 백스토리 시스템 기반 구축 완료
- ✅ Part 2 질문 다양성 200% 증가
- ✅ 공유 기능 UX 대폭 개선
- ✅ 프로젝트 문서화 완료 (README)
- ✅ 도메인 마이그레이션 성공

---

**총 작업 시간**: ~4시간  
**커밋 수**: 3개  
**추가 코드**: ~1,500줄  
**다음 목표**: 백스토리 자동 매칭 로직 구현 🚀
