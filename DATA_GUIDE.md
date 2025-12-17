# 림월드 정착민 테스트 데이터 가이드 (DATA_GUIDE.md)

이 문서는 `data/questions_ko.json`과 `data/questions_en.json`을 수정하거나 새로운 질문을 추가할 때 참고하는 가이드라인입니다.

---

## 1. 질문 ID 및 그룹 규칙

### A. ID 범위에 따른 테스트 단계 구분

| ID 범위 | 단계 (Phase) | 목적 | 노출 조건 |
| :--- | :--- | :--- | :--- |
| **1 ~ 199** | **1단계 (Trait Test)** | 기본 성향 파악 | 테스트 시작 시 40문제 랜덤 선택 |
| **200 ~ 999** | **1단계 (Background)** | 백스토리 결정 | 출신/유년기/성년기/사건/목표 각 1문제씩 순서대로 출제 |
| **1000 ~** | **2단계 (Skill Test)** | 스킬 정밀 분석 | "스킬 상세 분석" 버튼 클릭 시 15문제 랜덤 선택 |

### B. groupId 사용 규칙

- **목적**: 비슷한 질문이 한 테스트에 중복 출제되는 것을 방지
- **규칙**: 같은 `groupId`를 가진 질문들 중 **하나만** 랜덤 선택됨
- **예시**: `"groupId": "p1_mood_morning"` - 아침 기분 관련 질문 3가지 변형 중 1개만 출제

```json
// 같은 groupId를 가진 변형 질문들
{ "id": 1, "groupId": "p1_mood_morning", "text": "아침에 눈을 떴을 때..." },
{ "id": 101, "groupId": "p1_mood_morning", "text": "기상 직후 당신의 첫 생각은..." },
{ "id": 152, "groupId": "p1_mood_morning", "text": "알람이 울립니다. 반응은?..." }
```

---

## 2. 점수 시스템 및 밸런싱 원칙

### A. 특성(Trait) 점수 부여 가이드라인

**핵심 원칙: 한 질문으로 편향되지 않도록 점수를 보수적으로 책정**

| 답변의 확신도 | 부여 점수 | 사용 기준 |
| :--- | :--- | :--- |
| **매우 극단적** | `+2` 또는 `-2` | "흥분된다", "절대 먹지 않는다" 같은 명확한 극단 선택 |
| **확실한 성향** | `+1` 또는 `-1` | 일반적인 긍정/부정 답변 |
| **약한 암시** | `+0.5` (사용 자제) | 간접적인 연관성만 있는 경우 |

**스펙트럼 특성 (Mood, Work, Nerve, Beauty, Speed)**
- 답변 점수는 **자동으로 가중치가 곱해져** 스펙트럼 점수에 반영됨
- 예: `"sanguine": 1` 선택 시 → `mood_spectrum`에 `1 × 2 = +2` 가산
- **따라서 질문 작성 시 `+1`만 주어도 충분함** (시스템이 자동으로 배율 적용)

**독립 특성 (Psychopath, Cannibal, Nudist 등)**
- 스펙트럼 없이 단독으로 판정되는 특성
- **획득 조건**: 누적 점수 `3점 이상`
- 보수적으로 점수를 주어야 함 (5~6개 질문에서 일관되게 선택해야 획득)

### B. 스킬 점수 부여 가이드라인

| 답변의 전문성 | 부여 점수 | 사용 기준 |
| :--- | :--- | :--- |
| **직접적 역량 표현** | `+2` | "정확히 급소를 노린다", "필터를 만든다" |
| **간접적 관심** | `+1` | "궁금하다", "시도해본다" |
| **약한 부정** | `-1` | "잘 안 된다", "어렵다" |

**음수 점수는 최소화**: 스킬은 기본적으로 0~20 범위이므로 `-1` 이상은 지양

### C. 결격 사항 (Incapability) 누적 시스템

**새로운 누적 카운터 방식 도입** - 한 번의 선택으로 즉시 결격되지 않음

| 카운터 키 | 영향 스킬 | 스택 1 효과 | 스택 2+ 효과 |
| :--- | :--- | :--- | :--- |
| `inc_violence` | Shooting, Melee | 레벨 -8 패널티 | 완전 결격 (Incapable) |
| `inc_animals` | Animals | 레벨 -8 패널티 | 완전 결격 (Incapable) |
| `inc_intellectual` | Intellectual | 레벨 -8 패널티 | 완전 결격 (Incapable) |
| `inc_social` | Social | 레벨 -8 패널티 | 완전 결격 (Incapable) |

**사용 예시**:
```json
{
    "text": "습격이 발생! 적들이 쳐들어온다.",
    "answers": [
        { "text": "도망친다!", "scores": { "coward": 1, "inc_violence": 1 } },
        { "text": "침착하게 엄폐한다", "scores": { "iron_willed": 1, "Shooting": 1 } }
    ]
}
```
→ 사용자가 2번 이상 도망치면 전투 결격, 1번만 도망치면 레벨 -8 패널티만 받음

---

## 3. 특성 획득 로직 (Spectrum System)

### A. 스펙트럼 특성 판정

**5개 스펙트럼 존재**:
1. **Mood (기분)**: Depressive ← Pessimist ← (0) → Optimist → Sanguine
2. **Work (노동)**: Slothful ← Lazy ← (0) → Hard Worker → Industrious
3. **Nerve (신경)**: Volatile ← Nervous ← (0) → Steadfast → Iron-willed
4. **Beauty (외모)**: Staggeringly Ugly ← Ugly ← (0) → Pretty → Beautiful
5. **Speed (속도)**: Slowpoke ← (0) → Fast Walker → Jogger

**획득 조건** (TestContext.tsx의 SPECTRUM_CONFIG 참조):
```
극단 특성 (±6 이상): Sanguine, Depressive, Industrious, Slothful, etc.
약한 특성 (±3 이상): Optimist, Pessimist, Hard Worker, Lazy, etc.
```

**자동 가산 메커니즘**:
- 질문에서 `"optimist": 1` 점수를 받으면
- `mood_spectrum`에 `1 × 1(가중치) = +1` 추가
- `mood_spectrum`이 `+3` 도달 시 Optimist 특성 부여

### B. 독립 특성 판정

- 스펙트럼에 속하지 않는 특성 (Psychopath, Cannibal, Brawler 등)
- **획득 조건**: 해당 특성 키의 누적 점수 `≥ 3`
- **그룹 경합**: 같은 그룹 내 특성은 점수가 높은 것만 선택
- **충돌 방지**: `conflicts` 필드에 명시된 특성과는 동시 획득 불가

---

## 4. MBTI 산출 로직

MBTI는 **스킬 점수**를 기반으로 자동 계산됩니다.

| 지표 | 결정 공식 | 관련 스킬 |
| :--- | :--- | :--- |
| **E / I** | E: `Social×1.5 + Animals` <br> I: `Intellectual + Artistic` | Social, Animals, Intellectual, Artistic |
| **N / S** | N: `(Intellectual + Artistic)×1.2` <br> S: `Plants + Mining + Construction` | Intellectual, Artistic, Plants, Mining, Construction |
| **T / F** | F: `Medicine + Social + Animals` <br> T: `Shooting + Melee + Crafting` | Medicine, Social, Animals, Shooting, Melee, Crafting |
| **J / P** | J: `Construction + Cooking` (+근면 특성 보너스) <br> P: `Shooting + Melee` (+게으름 특성 보너스) | Construction, Cooking, Shooting, Melee |

---

## 5. 질문 작성 템플릿 및 체크리스트

### JSON 템플릿
```json
{
    "id": 105,
    "groupId": "p1_example_topic",  // 선택사항: 유사 질문 방지용
    "text": "질문 내용을 명확하고 간결하게 작성",
    "answers": [
        {
            "text": "선택지 1 - 극단적 긍정",
            "scores": {
                "optimist": 1,        // 스펙트럼은 +1로 충분 (자동 배율)
                "Intellectual": 2     // 스킬은 확실한 경우 +2
            }
        },
        {
            "text": "선택지 2 - 중립/회피",
            "scores": {
                "iron_willed": 1
            }
        },
        {
            "text": "선택지 3 - 극단적 부정",
            "scores": {
                "pessimist": 1,
                "wimp": 1
            }
        }
    ]
}
```

### 작성 전 체크리스트
- [ ] ID는 기존 질문과 중복되지 않는가?
- [ ] groupId는 비슷한 질문과 같은 값을 사용하는가?
- [ ] 각 답변은 명확히 구분되는 성향을 나타내는가?
- [ ] 점수는 보수적으로 책정되었는가? (+2는 극단적인 경우만)
- [ ] 한 질문에서 너무 많은 특성에 점수를 주지 않는가? (최대 2~3개 권장)
- [ ] 결격 시스템이 필요한 경우 `inc_` 카운터를 올바르게 사용했는가?

---

## 6. 사용 가능한 키 (Keys) 레퍼런스

### 스킬 키 (Skills)
- **전투**: `Shooting`, `Melee`
- **건설/채굴**: `Construction`, `Mining`
- **생활**: `Cooking`, `Plants`, `Animals`
- **전문**: `Crafting`, `Artistic`, `Medicine`
- **지식/사회**: `Social`, `Intellectual`

### 특성 키 (Traits) - 주요 예시
**스펙트럼 특성**:
- Mood: `sanguine`, `optimist`, `pessimist`, `depressive`
- Work: `industrious`, `hard_worker`, `lazy`, `slothful`
- Nerve: `iron_willed`, `steadfast`, `nervous`, `volatile`
- Beauty: `beautiful`, `pretty`, `ugly`, `staggeringly_ugly`
- Speed: `jogger`, `fast_walker`, `slowpoke`

**독립 특성**: `psychopath`, `cannibal`, `kind`, `brawler`, `wimp`, `greedy`, `jealous`, `pyromaniac`, `nudist`, `night_owl`, `bloodlust`, 등
→ 전체 목록은 `data/traits_ko.json` 및 `data/traits_en.json` 참조

### 결격 카운터 키
- `inc_violence`: 전투 기피 (Shooting, Melee 결격)
- `inc_animals`: 동물 공포 (Animals 결격)
- `inc_intellectual`: 지적 활동 거부 (Intellectual 결격)
- `inc_social`: 사회성 결여 (Social 결격)

---

## 7. 밸런스 조정 가이드라인

### 현재 밸런스 목표
- **평균 사용자가 획득하는 특성 개수**: 5~8개
- **극단 특성(±6) 획득 난이도**: 일관된 선택 8~10회 필요
- **약한 특성(±3) 획득 난이도**: 일관된 선택 4~5회 필요
- **스킬 열정(🔥) 획득**: 관련 질문 4~5개 선택 시 Minor, 8개 이상 선택 시 Major

### 밸런스 테스트 방법
1. 극단적 플레이 (전부 긍정 또는 전부 부정):
   - 스펙트럼 점수가 `±15` 이상 도달 → 극단 특성 2~3개 획득해야 정상
2. 중립 플레이 (고르게 선택):
   - 대부분의 스펙트럼 점수가 `±2` 이내 → 특성 거의 없어야 정상
3. 혼합 플레이 (실제 성향대로 선택):
   - 특성 5~8개, MBTI 타당하게 도출, 스킬 열정 2~3개 → 이상적

---

## 8. 문제 해결 (FAQ)

**Q: 질문을 추가했는데 테스트에서 안 나와요**
- ID 범위 확인 (1~199는 Trait, 1000+는 Skill)
- JSON 문법 오류 확인 (쉼표, 중괄호 등)

**Q: 특정 특성이 너무 쉽게/어렵게 획득돼요**
- 해당 특성 키를 포함한 질문 개수 확인
- 질문당 부여 점수를 +2→+1로 하향 (또는 +1→+2로 상향)

**Q: 결격이 너무 자주 발생해요**
- `inc_` 카운터를 사용하는 답변 개수 확인
- 카운터 없이 낮은 음수 점수(`-1`, `-2`)만 주도록 변경

**Q: MBTI가 이상하게 나와요**
- 관련 스킬 점수가 골고루 분포했는지 확인
- 가중치가 올바른지 TestContext.tsx 확인

