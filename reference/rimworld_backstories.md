# RimWorld 백스토리 데이터베이스

> AI 참고용 백스토리 목록 (퀴즈/테스트 사이트 제작용)  
> 출처: RimWorld 게임 파일 및 공식 위키
> 
> **주의**: 게임 파일에 직접 접근할 수 없어 전체 목록을 가져오지 못했습니다.  
> 아래는 확인 가능한 일부 백스토리들입니다.

---

## 데이터 구조

```json
{
  "id": "백스토리_고유ID",
  "title": "백스토리 제목",
  "titleShort": "짧은 제목",
  "type": "childhood | adulthood",
  "description": "백스토리 설명",
  "skillGains": {
    "스킬명": 수치
  },
  "skillLosses": {
    "스킬명": -수치
  },
  "workDisables": ["작업1", "작업2"],
  "spawnCategories": ["카테고리1", "카테고리2"]
}
```

---

## 아동기 백스토리 (Childhood Backstories)

### 귀족/상류층

#### Noble Child (귀족 자제)
- **ID**: NobleChild
- **설명**: 중세 세계의 귀족 가문에서 자랐다. 승마, 정치, 종교 교육을 받았다.
- **스킬**: 사교 +3, 지적 +2
- **작업 금지**: 단순 노동, 숙련 노동
- **카테고리**: Medieval, Offworld

#### Glitterworld Kid (글리터월드 키드)
- **ID**: GlitterworldKid
- **설명**: 첨단 글리터월드에서 편안하게 자랐다.
- **스킬**: 예술 +2, 사교 +2
- **작업 금지**: 단순 노동, 숙련 노동
- **카테고리**: Offworld

### 종교/수도원

#### Convent Child (수도원 아이)
- **ID**: ConventChild  
- **설명**: 수녀원에서 자랐다. 근면과 복종을 배웠지만 기술은 이단이라고 배웠다.
- **스킬**: 식물 +2, 손재주 +2, 지적 -3
- **작업 금지**: 연구
- **카테고리**: Medieval

### 농업/자연

#### Farm Kid (농가 소년/소녀)
- **ID**: FarmKid
- **설명**: 림월드의 농부 가정에서 자랐다. 매일 농장 일을 했다.
- **스킬**: 식물 +4, 동물 +2
- **작업 금지**: 없음
- **카테고리**: Offworld, Tribal

#### Biome Farmer (바이옴 농부)
- **ID**: BiomeFarmer
- **설명**: 바이오돔에서 농업을 배웠다. 외계 환경에 적응하는 동물을 키웠다.
- **스킬**: 식물 +3, 동물 +3
- **작업 금지**: 없음
- **카테고리**: Offworld

### 기술/제조

#### Smith Apprentice (대장장이 견습생)
- **ID**: SmithApprentice
- **설명**: 중세 세계에서 대장장이 밑에서 수련했다.
- **스킬**: 손재주 +4, 근접 +2
- **작업 금지**: 없음
- **카테고리**: Medieval

#### Spacer Child (우주선 아이)
- **ID**: SpacerChild
- **설명**: 대형 우주선에서 자랐다. 기계와 시스템을 다루는 법을 배웠다.
- **스킬**: 지적 +3, 건설 +2, 동물 -2
- **작업 금지**: 없음
- **카테고리**: Offworld

### 도시/빈민가

#### Urbworld Urchin (어브월드 부랑아)
- **ID**: UrbworldUrchin
- **설명**: 산업 도시의 어두운 구역에서 자랐다. 모든 음식을 위해 싸워야 했다.
- **스킬**: 근접 +3, 사격 +2, 사교 -2
- **작업 금지**: 없음
- **카테고리**: Offworld

### 전투/군사

#### Child Soldier (소년병)
- **ID**: ChildSoldier
- **설명**: 어린 나이에 전투를 강요받았다. 폭력만이 삶의 방식이었다.
- **스킬**: 사격 +4, 근접 +3, 사교 -3
- **작업 금지**: 없음
- **카테고리**: Offworld, Tribal

#### Vat-grown Child (시험관 아이)
- **ID**: VatgrownChild
- **설명**: 실험실에서 자랐다. 파괴의 도구로 만들어졌다.
- **스킬**: 사격 +4, 근접 +4, 사교 -4
- **작업 금지**: 예술, 요리
- **카테고리**: Offworld

### 범죄/불법

#### Child Spy (아동 스파이)
- **ID**: ChildSpy
- **설명**: 아이는 무고해 보이기에 훌륭한 스파이가 된다. 침투 기술을 배웠다.
- **스킬**: 사교 +4, 사격 +2, 지적 -2
- **작업 금지**: 없음
- **카테고리**: Offworld

#### Child Slave (아동 노예)
- **ID**: ChildSlave
- **설명**: 어린 나이에 노예로 팔렸다. 광산에서 일했다.
- **스킬**: 채광 +4, 건설 +2, 사교 -3
- **작업 금지**: 없음
- **카테고리**: Offworld

### 고아/생존자

#### Orphan (고아)
- **ID**: Orphan
- **설명**: 거리에서 홀로 자랐다. 생존을 위해 무엇이든 했다.
- **스킬**: 근접 +2, 사격 +2, 사교 -1
- **작업 금지**: 없음
- **카테고리**: Offworld, Tribal

### 부족

#### Tribal Child (부족 아이)
- **ID**: TribalChild
- **설명**: 부족 사회에서 자랐다. 자연과 함께 생활하는 법을 배웠다.
- **스킬**: 근접 +3, 식물 +2, 지적 -3
- **작업 금지**: 없음
- **특징**: Natural 명상 집중
- **카테고리**: Tribal

---

## 성인기 백스토리 (Adulthood Backstories)

### 전투/군사

#### Marine (해병대원)
- **ID**: Marine
- **설명**: 군사 훈련 프로그램에 참여했다. 육체적 훈련에서 탁월했다.
- **스킬**: 사격 +6, 근접 +4
- **작업 금지**: 예술, 손재주
- **카테고리**: Offworld

#### Recon Sniper (정찰 저격수)
- **ID**: ReconSniper
- **설명**: 전문 저격수로 훈련받았다. 원거리 전투의 달인이다.
- **스킬**: 사격 +9, 사교 -2
- **작업 금지**: 없음
- **카테고리**: Offworld

#### Knight (기사)
- **ID**: Knight
- **설명**: 중세 세계의 기사였다. 명예와 전투 기술을 배웠다.
- **스킬**: 근접 +8, 사교 +3
- **작업 금지**: 단순 노동, 숙련 노동
- **카테고리**: Medieval

#### Mercenary (용병)
- **ID**: Mercenary
- **설명**: 노예 사냥꾼들을 탈출한 후 용병으로 일했다.
- **스킬**: 사격 +5, 근접 +4, 사교 -2
- **작업 금지**: 없음
- **카테고리**: Offworld, Pirate

#### Infantry Medic (야전 의무병)
- **ID**: InfantryMedic
- **설명**: 군대에서 의무병으로 복무했다. 전장에서 부상자를 치료했다.
- **스킬**: 의료 +7, 사격 +3
- **작업 금지**: 없음
- **카테고리**: Offworld

### 의료/과학

#### Doctor (의사)
- **ID**: Doctor
- **설명**: 우주선의 의사였다. 뛰어난 외과의사였다.
- **스킬**: 의료 +8, 지적 +3
- **작업 금지**: 단순 노동
- **카테고리**: Offworld

#### Navy Scientist (해군 과학자)
- **ID**: NavyScientist
- **설명**: 해군에서 과학자로 일했다. 첨단 기술을 연구했다.
- **스킬**: 지적 +8
- **작업 금지**: 단순 노동, 숙련 노동
- **카테고리**: Offworld

#### Defector (망명자)
- **ID**: Defector
- **설명**: 독재 정권을 탈출했다. 추적자들을 피해 도망치며 스스로 치료하는 법을 배웠다.
- **스킬**: 의료 +5, 사격 +5, 사교 -3
- **작업 금지**: 없음
- **카테고리**: Offworld

### 엔지니어/기술

#### Chief Engineer (수석 엔지니어)
- **ID**: ChiefEngineer
- **설명**: 대형 우주선의 수석 엔지니어였다. 복잡한 시스템의 전문가다.
- **스킬**: 건설 +6, 손재주 +5
- **작업 금지**: 단순 노동
- **카테고리**: Offworld

#### Construction Engineer (건설 엔지니어)
- **ID**: ConstructionEngineer
- **설명**: 건설 프로젝트를 지휘했다. 구조물 설계와 건축의 달인이다.
- **스킬**: 건설 +7, 식물 -2
- **작업 금지**: 지적, 요리
- **카테고리**: Offworld

#### Explosive Engineer (폭발물 엔지니어)
- **ID**: ExplosiveEngineer
- **설명**: 광산에서 폭발물 엔지니어로 일했다. 기술에 매우 진지했다.
- **스킬**: 건설 +5, 채광 +3
- **작업 금지**: 단순 노동
- **카테고리**: Offworld

### 제조/장인

#### Smith (대장장이)
- **ID**: Smith
- **설명**: 중세 세계의 대장장이였다. 높은 품질의 작품으로 명성을 얻었다.
- **스킬**: 손재주 +7, 근접 +3
- **작업 금지**: 없음
- **카테고리**: Medieval

#### Jeweler (보석상)
- **ID**: Jeweler
- **설명**: 장신구 제작의 예술가였다. 은하계를 여행하며 작품을 팔았다.
- **스킬**: 손재주 +6, 예술 +4
- **작업 금지**: 단순 노동
- **카테고리**: Offworld

#### Chef (요리사)
- **ID**: Chef
- **설명**: 전문 요리사로 일했다. 맛있는 음식을 만드는 법을 알고 있다.
- **스킬**: 요리 +7
- **작업 금지**: 없음
- **카테고리**: Offworld

#### Exotic Chef (왕실 요리사)
- **ID**: ExoticChef
- **설명**: 왕실 요리사였다. 최고급 요리를 준비했다.
- **스킬**: 요리 +9
- **작업 금지**: 단순 노동, 숙련 노동
- **카테고리**: Offworld, Medieval

### 사회/정치

#### Medieval Lord (중세 영주)
- **ID**: MedievalLord
- **설명**: 중세 세계의 귀족이었다. 돌로 만든 저택에서 살았다.
- **스킬**: 사교 +8, 사격 +4, 근접 +4
- **작업 금지**: 단순 노동, 숙련 노동
- **카테고리**: Medieval

#### Politician (정치인)
- **ID**: Politician
- **설명**: 정치 경력을 쌓았다. 사람들을 설득하는 법을 알고 있다.
- **스킬**: 사교 +8
- **작업 금지**: 단순 노동, 숙련 노동
- **카테고리**: Offworld

#### Merchant (상인)
- **ID**: Merchant
- **설명**: 행성을 여행하며 무역을 했다. 협상의 달인이다.
- **스킬**: 사교 +6
- **작업 금지**: 없음
- **카테고리**: Offworld, Medieval

### 노동/생산

#### Planetary Miner (행성 광부)
- **ID**: PlanetaryMiner
- **설명**: 광산에서 일했다. 광물 채굴의 전문가다.
- **스킬**: 채광 +8
- **작업 금지**: 없음
- **카테고리**: Offworld

#### Farmer (농부)
- **ID**: Farmer
- **설명**: 소규모 농장을 운영했다. 작물 재배에 능숙하다.
- **스킬**: 식물 +7, 동물 +3
- **작업 금지**: 없음
- **카테고리**: Offworld, Medieval, Tribal

#### Factory Worker (공장 노동자)
- **ID**: FactoryWorker
- **설명**: 산업 시대 공장에서 일했다. 단순하고 숙련되지 않은 일을 했다.
- **스킬**: 건설 +3, 손재주 +2
- **작업 금지**: 없음
- **카테고리**: Offworld

### 범죄/불법

#### Thief (도둑)
- **ID**: Thief
- **설명**: 조직 범죄를 위해 일하는 전문 도둑이었다.
- **스킬**: 사교 +3, 근접 +3
- **작업 금지**: 없음
- **카테고리**: Offworld, Pirate

#### Pirate (해적)
- **ID**: Pirate
- **설명**: 우주 해적으로 활동했다. 약탈과 전투가 일상이었다.
- **스킬**: 사격 +5, 근접 +4, 사교 -2
- **작업 금지**: 없음
- **카테고리**: Pirate

#### Assassin (암살자)
- **ID**: Assassin
- **설명**: 전문 암살자였다. 인간 위협을 제거하는 일을 했다.
- **스킬**: 사격 +6, 근접 +5, 사교 -3
- **작업 금지**: 없음
- **카테고리**: Offworld, Pirate

---

## 스킬 목록

게임 내 12가지 스킬:

1. **사격 (Shooting)**: 원거리 무기 정확도
2. **근접 (Melee)**: 근접 전투 능력
3. **건설 (Construction)**: 건물 건설 속도와 품질
4. **채광 (Mining)**: 채광 속도
5. **요리 (Cooking)**: 요리 속도와 음식 중독 방지
6. **식물 (Plants)**: 농사 속도와 수확량
7. **동물 (Animals)**: 동물 조련과 관리
8. **손재주 (Crafting)**: 아이템 제작 속도와 품질
9. **예술 (Artistic)**: 예술품 품질
10. **의료 (Medicine)**: 치료 속도와 수술 성공률
11. **사교 (Social)**: 협상, 채용, 거래 능력
12. **지적 (Intellectual)**: 연구 속도

---

## 작업 금지 태그

- **ManualDumb**: 단순 노동 (운반, 청소)
- **ManualSkilled**: 숙련 노동 (건설, 채광)
- **Violent**: 폭력 (사냥, 전투)
- **Caring**: 돌봄 (의료, 간호)
- **Social**: 사교 (외교, 무역)
- **Intellectual**: 지적 (연구)
- **Animals**: 동물 관련
- **Artistic**: 예술
- **Crafting**: 제작
- **Cooking**: 요리
- **PlantWork**: 식물
- **Mining**: 채광

---

## 스폰 카테고리

- **Offworld**: 우주에서 온 일반적인 식민지 주민
- **Tribal**: 부족 출신
- **Medieval**: 중세 세계 출신
- **Pirate**: 해적
- **ImperialRoyal**: 제국 왕족 (Royalty DLC)
- **Outlander**: 외부인

---

## 퀴즈/테스트 사이트 구현 가이드

### 추천 질문 유형

1. **성격/가치관**: "당신이 가장 중요하게 여기는 것은?"
   - 명예와 전통 → 귀족, 기사
   - 지식과 발견 → 과학자, 연구원
   - 생존과 실용 → 농부, 광부

2. **선호 활동**: "여가 시간에 무엇을 하나요?"
   - 책 읽기 → 지적 스킬 높음
   - 운동 → 전투 스킬 높음
   - 요리 → 요리 스킬 높음

3. **문제 해결**: "위기 상황에서 어떻게 대처하나요?"
   - 싸운다 → 전투 백스토리
   - 협상한다 → 사교 백스토리
   - 도망친다 → 생존 백스토리

4. **성장 환경**: "어떤 환경에서 자랐나요?"
   - 도시 → Urbworld, Glitterworld
   - 시골 → Farm, Tribal
   - 특수 시설 → Spacer, Lab

### 결과 매칭 알고리즘

```python
def match_backstory(answers):
    scores = {}
    
    # 각 답변에 따라 백스토리 점수 계산
    for backstory in all_backstories:
        score = 0
        
        # 스킬 선호도 매칭
        if user_prefers_combat:
            score += backstory.shooting + backstory.melee
        
        # 작업 금지 고려
        if user_hates_manual_labor and "ManualDumb" in backstory.workDisables:
            score += 10
            
        scores[backstory.id] = score
    
    return sorted(scores, key=scores.get, reverse=True)[:3]
```

---

## 주의사항

**이 문서의 한계**:
- 게임 파일에 직접 접근할 수 없어 **전체 백스토리 목록을 가져오지 못했습니다**
- 위 목록은 검색과 문서 조사를 통해 확인된 일부입니다
- 실제 게임에는 약 **36개 아동기 + 85개 성인기 백스토리**가 있습니다
- 정확한 스킬 수치와 설명은 게임 파일을 직접 확인해야 합니다

**완전한 데이터베이스를 만들려면**:
1. RimWorld 게임 폴더 → Data → Core → Defs → Backstories → Backstories.xml
2. 또는 Steam Workshop 모드 "[RF] Editable Backstories" 다운로드
3. XML 파일을 파싱하여 JSON으로 변환

---

*이 문서는 AI가 참고할 수 있도록 구조화된 백스토리 데이터베이스입니다.*

### 스폰 카테고리

1. **Offworld** - 우주에서 온 일반적인 식민지 주민
2. **Tribal** - 부족 출신
3. **Medieval** - 중세 세계 출신
4. **Pirate** - 해적
5. **ImperialRoyal** - 제국 왕족
6. **Outlander** - 외부인

### 작업 비활성화 태그

- **ManualDumb** - 단순 노동 (운반, 청소)
- **ManualSkilled** - 숙련 노동 (건설, 채광)
- **Violent** - 폭력적 작업 (사냥, 전투)
- **Caring** - 돌봄 (의료, 간호)
- **Social** - 사교 (외교, 무역)
- **Intellectual** - 지적 (연구)
- **Animals** - 동물 관련
- **Artistic** - 예술
- **Crafting** - 제작
- **Cooking** - 요리
- **PlantWork** - 식물 관련
- **Mining** - 채광

---

## 백스토리 선택 메커니즘

### 무작위 vs 플레이어 생성

1. **일반 폰**
   - 25% 확률로 특정 백스토리 시도
   - 50/50 확률로 상위 50개 또는 무작위 20개 선택

2. **세력 리더**
   - 항상 특정 백스토리 시도
   - PirateKing 태그 필요

3. **필터링 조건**
   - 성별 (지정된 경우)
   - 세력 유형에 맞는 카테고리
   - 비활성화되지 않은 작업 태그

---

## 백스토리 사용 팁

### 식민지 시작 시 추천 조합

1. **균형잡힌 팀**
   - 의사 1명 (Infantry Medic / Doctor)
   - 연구원 1명 (Navy Scientist)
   - 건설가 1명 (Construction Engineer)
   - 농부 1명 (Farmer)
   - 전사 1명 (Recon Sniper / Marine)

2. **생존 우선**
   - 요리사 (Chef)
   - 의사 (Doctor)
   - 건설가 (Construction Engineer)

3. **전투 집중**
   - 여러 명의 Marine / Recon Sniper
   - 최소 1명의 의무병 (Infantry Medic)

### 피해야 할 조합

- **귀족 백스토리 + 작은 식민지**
  - 단순 노동과 숙련 노동을 할 수 없어 부담
  
- **모순되는 백스토리**
  - 아동기에서 특정 스킬을 높이고 성인기에서 같은 스킬을 비활성화하는 경우

---

## 참고 사항

- 13세가 되면 아동 백스토리가 부여됨
- 20세 미만 청소년은 성인 백스토리가 없음
- 자연적으로 20세가 된 식민지 주민은 성인 백스토리를 얻지 못함
- 모드를 통해 백스토리를 수정하거나 추가할 수 있음

---

## DLC 백스토리 정보

### Royalty DLC (2020년 2월 24일)
- **추가 백스토리**: 1.1 업데이트에서 부족 관련 백스토리 다수 추가
- **특징**: 제국 타이틀, 사이캐스팅, 명상 시스템 도입
- **백스토리 영향**: 부족 출신 백스토리는 Natural 명상 집중 획득 (애니마 트리에서 명상 가능)

### Ideology DLC (2021년 7월 20일)
- **추가 백스토리**: 확인된 전용 백스토리 없음
- **특징**: 이데올로기 시스템, 의식, 사회적 역할 추가
- **백스토리 영향**: 기존 백스토리와 이데올로기가 상호작용

### Biotech DLC (2022년 10월 21일)
- **추가 백스토리**: 확인된 전용 백스토리 없음 (단, 아동 성장 시스템 추가)
- **특징**: 아동, 유전자 변형, 메카니터 시스템
- **백스토리 영향**: 
  - 13세가 되면 아동 백스토리 부여
  - 20세 미만 청소년은 성인 백스토리 없음
  - 자연적으로 20세가 된 식민지 주민은 성인 백스토리를 얻지 못함

### Anomaly DLC (2024년 4월 11일)
- **추가 백스토리**: "Researcher" 태그 백스토리 추가 가능성 언급됨 (미확인)
- **특징**: 코즈믹 호러 테마, 엔티티, 격리 시설
- **백스토리 영향**: 신비한 이방인(Mysterious Stranger)이 알 수 없는 백스토리로 합류 가능

### Odyssey DLC (2025년 7월 11일)
- **추가 백스토리**: 확인된 전용 백스토리 없음
- **특징**: 그래브십, 새로운 바이옴, 40종 이상의 동물, 탐험 시스템
- **백스토리 영향**: 확인된 정보 없음

**참고**: 대부분의 DLC는 백스토리보다는 게임 메커니즘과 시스템 추가에 집중합니다. 백스토리 관련 모드(Vanilla Backstories Expanded, Childhood Backstories 등)를 통해 더 다양한 백스토리를 추가할 수 있습니다.

---

## 관련 모드

### 백스토리 관련 인기 모드

1. **Editable Backstories**
   - 바닐라 백스토리를 편집 가능한 XML로 대체
   - 300개 이상의 정리된 백스토리 제공

2. **Vanilla Backstories Expanded**
   - 150개 이상의 새로운 백스토리 추가
   - 커뮤니티 제작 백스토리 포함

3. **Medieval Backstories**
   - 중세 테마 백스토리 추가
   - 아동 39개, 성인 68개

4. **Childhood Backstories**
   - 13세가 되는 아이들을 위한 백스토리
   - 게임 중 성장하는 아이들에게 적절한 백스토리 부여

---

## 데이터 출처

이 문서는 다음 소스를 기반으로 작성되었습니다:

- RimWorld 공식 위키 (rimworldwiki.com)
- RimWorld 게임 데이터 파일 (Backstories.xml)
- 커뮤니티 모드 및 문서
- GitHub 리포지토리 (RimWorld-English, RimWorld-Finnish)

**주의**: 게임 버전에 따라 일부 백스토리가 변경되거나 추가/제거될 수 있습니다.

---

*이 문서는 RimWorld 팬 커뮤니티를 위해 작성되었습니다.*  
*게임 개발사: Ludeon Studios*  
*최신 정보는 공식 위키를 참조하세요: https://rimworldwiki.com*



여기 밑에는 위키에 있던 백스토리 문서야.
Generic adult backstories
Title
(Short Title)	Description	Skill Modifications	Work types	Traits	Tribal	Outlander	Pirate	Offworld	Outsider	Imperial
Common	Imperial
Fighter	Imperial
Royal	Bodytype
House Servant
(Servant)	[PAWN_nameDef] was a low-level servant in a royal house.
[PAWN_pronoun] cleaned rooms and moved items as directed by the senior staff, while attempting to remain invisible to the lords and ladies of the house.	
Cooking: +3
Construction: +3
Mining: +4
+ManualDumb
-	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	Ex.png	Ex.png	Naked Hulk south.pngNaked Female south.png
Head Butler
(Butler)	[PAWN_nameDef] was the head servant in a royal house.
[PAWN_pronoun] managed the other servants to ensure the lord's will was done, even before the lord knew what it was.	
Social: +4
Cooking: +3
Crafting: +2
+ManualDumb
+ManualSkilled
+Social
-	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	Ex.png	Ex.png	Naked Fat south.pngNaked Fat south.png
Royal Masseuse
(Masseuse)	[PAWN_nameDef] was a massage artist for an extended royal house. [PAWN_pronoun] serviced many members of the royal family, and their guests.
[PAWN_nameDef] occasionally offered something extra, if the lord or lady was in the mood. Advancing in this line of work meant having refined social skills.	
Social: +6
-	Beautiful	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	Ex.png	Ex.png	Naked Male south.pngNaked Female south.png
Menagerie Keeper
(Zookeeper)	[PAWN_nameDef] managed the royal menagerie of a powerful family at their estate.
[PAWN_nameDef]'s job saw [PAWN_pronoun] feeding elephants, tranquilizing lions, and training birds to display their plumage to titled visitors.	
Animals: +8
+Animals
Beautiful	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	Ex.png	Ex.png	Naked Thin south.pngNaked Female south.png
Ballet Dancer
(Dancer/Ballerina)	[PAWN_nameDef] was a dancer in a traditional ballet troupe. [PAWN_pronoun] mastered the ancient motions and entertained thousands.	
Social: +3
Melee: +3
+Social
Nimble	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	Ex.png	Ex.png	Naked Thin south.pngNaked Thin south.png
Ornament Maker
(Ornamenter)	[PAWN_nameDef] crafted watches, medals, machined jewelry and other complex curios for royal patrons.	
Crafting: +5
Artistic: +5
+Artistic
+ManualSkilled
-	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	Ex.png	Ex.png	Naked Thin south.pngNaked Thin south.png
Royal Cook
(Cook)	[PAWN_nameDef] made meals for [PAWN_possessive] aristocratic patrons.
Only the finest food was acceptable, so [PAWN_nameDef] tended a small garden on the mansion grounds to get the freshest herbs and vegetables. [PAWN_pronoun] fell in love with the food [PAWN_objective]self.	
Cooking: +7
Plants: +2
+Cooking
+PlantWork
Gourmand	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	Ex.png	Ex.png	Naked Fat south.pngNaked Fat south.png
Imperial Priest
(Priest/Priestess)	[PAWN_nameDef] was a priest in the imperial church.
[PAWN_pronoun] spent half [PAWN_possessive] time studying books to understand the relationship between God's aspects and the facets of [PAWN_possessive] society. The other half was spent preaching the evils of sloth and drink.	
Social: +5
Intellectual: +5
+Social
+Intellectual
Teetotaler	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	Ex.png	Ex.png	Naked Male south.pngNaked Female south.png
Imperial Inquisitor
(Inquisitor/Inquisitress)	[PAWN_nameDef] was an inquisitor in the imperial church's anti-heresy school.
[PAWN_nameDef] hunted unorthodox thoughts wherever they could be found - art, music, code, even private conversations. Upon finding deviance, [PAWN_pronoun] exposed it to bring on the punishment of the collective. And [PAWN_pronoun] could always find the deviance if [PAWN_pronoun] looked hard enough.	
Social: +4
Intellectual: +4
+Social
+Intellectual
Abrasive	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	Ex.png	Ex.png	Naked Thin south.pngNaked Thin south.png
Church Psychic
(Psychic)	[PAWN_nameDef] was a psychic in the imperial church's psychic school.
[PAWN_nameDef] trained [PAWN_possessive] mind to sense the collective emotions and impressions of the people. It was a way to touch the spirit of the empire. It was also a way to root out heretical trends in thought.	
Social: +3
Intellectual: +5
+Social
+Intellectual
Psychically hypersensitive	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	Ex.png	Ex.png	Naked Thin south.pngNaked Thin south.png
Corporate Drone
(Drone)	[PAWN_nameDef] worked in a very large office complex along with thousands of other suited drones.
The work itself consisted of endless organizational drudgery and pointless meetings, punctuated by the occasional performance review.	
Social: +2
Intellectual: +4
+Intellectual
-	Ex.png	Ex.png	Ex.png	Check.png	Ex.png	Check.png	Ex.png	Ex.png	Naked Male south.pngNaked Female south.png
Corporate Manager
(Manager)	[PAWN_nameDef] worked in a massive open-plan office, ensuring that [PAWN_possessive] assigned team of workers stayed mostly on-task.
The job was intensely political. In order to advance, [PAWN_nameDef] learned how to arrange things so [PAWN_pronoun] could take credit for work done by almost anyone.	
Social: +6
Intellectual: +2
+Social
-	Ex.png	Ex.png	Ex.png	Check.png	Ex.png	Check.png	Ex.png	Ex.png	Naked Male south.pngNaked Female south.png
Corporate Fixer
(Fixer)	[PAWN_nameDef] was a fixer for an energy corporation. [PAWN_pronoun] work required knowing when to push, when to pull, when to back down and when to strike. The job fit [PAWN_possessive] natural lack of empathy.
While violence was unusual, [PAWN_nameDef] stayed prepared for anything.	
Social: +4
Shooting: +3
Melee: +3
+Social
+Violent
Psychopath	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	Ex.png	Ex.png	Naked Male south.pngNaked Female south.png
Planetary Miner
(Miner)	[PAWN_nameDef] was a mining engineer for a major planetary mining corporation. [PAWN_pronoun] work kept [PAWN_objective] underground for weeks at a time, and [PAWN_pronoun] grew to appreciate the darkness.	
Mining: +8
+Mining
Undergrounder	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	Ex.png	Ex.png	Naked Fat south.pngNaked Fat south.png
Mailman/Mail Carrier
(Mailman/Mailwoman)	[PAWN_nameDef] carried mail on [PAWN_possessive] assigned routes. Sometimes [PAWN_pronoun] was even sent to deliver special packages to stylish corporate offices or mansions.
[PAWN_nameDef] got pretty good at avoiding and fighting off angry dogs.	
Melee: +4
-	Nimble	Ex.png	Ex.png	Ex.png	Check.png	Ex.png	Check.png	Ex.png	Ex.png	Naked Male south.pngNaked Female south.png
Assembler
(Assembler)	[PAWN_nameDef] worked on factory assembly lines, putting together products with the help of robots.	
Crafting: +7
+ManualSkilled
-	Ex.png	Ex.png	Ex.png	Check.png	Ex.png	Check.png	Ex.png	Ex.png	Naked Hulk south.pngNaked Female south.png
Builder
(Builder)	[PAWN_nameDef] worked on construction sites, building everyday structures according to [PAWN_possessive] boss' instructions.	
Construction: +7
+ManualDumb
+ManualSkilled
-	Ex.png	Ex.png	Ex.png	Check.png	Ex.png	Check.png	Ex.png	Ex.png	Naked Hulk south.pngNaked Hulk south.png
Crop Farmer
(Farmer)	[PAWN_nameDef] ran a crop farm. [PAWN_pronoun] analyzed soil, agricultural equipment, weather patterns, and price trends to optimize the planting and harvesting of massive crop fields.	
Plants: +8
+PlantWork
-	Ex.png	Ex.png	Ex.png	Check.png	Ex.png	Check.png	Ex.png	Ex.png	Naked Hulk south.pngNaked Female south.png
Livestock Farmer
(Farmer)	[PAWN_nameDef] ran a livestock farm. [PAWN_pronoun] analyzed animal genetics, feed types, birth and slaughter methods, and price trends to optimize the raising of huge animal herds.	
Animals: +7
+Animals
-	Ex.png	Ex.png	Ex.png	Check.png	Ex.png	Check.png	Ex.png	Ex.png	Naked Hulk south.pngNaked Female south.png
Line Infanteer
(Infanteer)	[PAWN_nameDef] was an ordinary infanteer in an imperial battalion.
Conscripted at a young age to add bodies the army, [PAWN_nameDef] learned the methods of fighting well enough to satisfy [PAWN_possessive] officers. However, [PAWN_pronoun] never quite understood what was going on around [PAWN_objective] enough to really believe in it.	
Shooting: +4
Melee: +3
+Violent
-	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	Check.png	Naked Thin south.pngNaked Thin south.png
Pious Soldier
(Pious Soldier)	When not training or combat, [PAWN_nameDef] was often at the chaplain's side. [PAWN_pronoun] dedicated [PAWN_possessive] life to serving both [PAWN_possessive] lord and [PAWN_possessive] religion.	
Shooting: +6
Melee: +4
+Violent
-	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	Ex.png	Naked Male south.pngNaked Female south.png
Infantry Engineer
(Engineer)	Despite being in an infantry battalion, [PAWN_nameDef] rarely fired a gun. [PAWN_possessive] specialty was the rapid construction of defenses, traps, defensive installations, and sapping tunnels.	
Construction: +6
Mining: +4
-	-	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	Check.png	Naked Male south.pngNaked Female south.png
Infantry Medic
(Medic)	[PAWN_nameDef] treated the combat wounds of [PAWN_possessive] fallen comrades.	
Medicine: +7
-	-	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	Check.png	Naked Male south.pngNaked Female south.png
Military Cook
(Army Cook)	They say an army marches on its stomach. [PAWN_nameDef]'s job was to prepared chow to keep [PAWN_possessive] unit marching, no matter the conditions.
The job required [PAWN_objective] to pay attention to both the nutritional and psychological needs of the troops.	
Cooking: +7
Shooting: +2
+Cooking
-	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	Ex.png	Naked Male south.pngNaked Female south.png
Loyal Janissary
(Janissary)	[PAWN_nameDef] was a janissary in a great lord's army. Even more than the other troops, [PAWN_pronoun] felt a sense of duty, and [PAWN_pronoun] drew [PAWN_possessive] life's meaning from the effort [PAWN_pronoun] put to fulfilling [PAWN_possessive] duty.	
Shooting: +7
Melee: +4
+Violent
Industrious	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	Check.png	Naked Hulk south.pngNaked Thin south.png
Recon Sniper
(Sniper)	[PAWN_nameDef] was a professional military sniper. [PAWN_pronoun] was trained to rapidly reach into unexpected firing positions, snipe key targets, and escape before enemies could pinpoint [PAWN_possessive] location.	
Shooting: +9
+Violent
Jogger	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	Check.png	Naked Thin south.pngNaked Thin south.png
Shipcracker
(Shipcracker)	[PAWN_nameDef]'s role was to launch through the vacuum of space, land on the enemy ship's hull, punch holes to the interior, and conquer it in room-to-room combat. [PAWN_pronoun] became very good at wielding heavy cataphract weapons to cut both steel and flesh.
[PAWN_pronoun] also developed a taste for the drugs [PAWN_pronoun] used to cope with the overwhelming stress.	
Shooting: +3
Melee: +5
Mining: +4
+Violent
Chemical interest	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	Check.png	Naked Hulk south.pngNaked Hulk south.png
Broken Soldier
(Soldier)	[PAWN_pronoun] was a strong soldier in a long war of succession. In [PAWN_possessive] final battle, [PAWN_possessive] unit was sacrificed to cover a retreat. [PAWN_nameDef] watched [PAWN_possessive] comrades die and was the only survivor.
The experience broke [PAWN_objective] inside, leaving [PAWN_objective] without the coping strategies to moderate [PAWN_possessive] emotions.
[PAWN_nameDef] learned to draw in the hospital.	
Artistic: +2
+Violent
−Violent
Volatile	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	Naked Hulk south.pngNaked Thin south.png
Intelligence Agent
(Intel)	[PAWN_nameDef] was a high-ranking counterintelligence agent tasked with thwarting enemy spies.	
Intellectual: +6
Social: +3
+Social
+Intellectual
-	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	Ex.png	Naked Male south.pngNaked Female south.png
Deserter
(Deserter)	After countless battles for a cause [PAWN_pronoun] did not believe in, [PAWN_nameDef] threw down [PAWN_possessive] arms and deserted. [PAWN_nameDef] lived in isolation, hunted by those [PAWN_pronoun] had deserted.	
Shooting: +4
Melee: +2
Crafting: +2
+Violent
-	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	Check.png	Naked Male south.pngNaked Female south.png
Warmonger
(Warmonger)	[PAWN_nameDef] revelled in bloodshed. Soldiers who served with [PAWN_objective] were terrified of [PAWN_possessive] ferocity. They rarely socialized with [PAWN_nameDef], and [PAWN_pronoun] did not mind the isolation.	
Shooting: +7
Melee: +4
Social: +-3
+Violent
−Caring
Bloodlust	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	Check.png	Naked Hulk south.pngNaked Hulk south.png
Infantry Officer
(Officer)	[PAWN_nameDef] was an officer in an imperial battalion. [PAWN_pronoun] developed the social and combat skills to do [PAWN_possessive] job well and was respected by the men.	
Social: +4
Shooting: +5
+Violent
-	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	Check.png	Naked Male south.pngNaked Female south.png
Disgraced Officer
(Officer)	[PAWN_nameDef] was an officer in an imperial battalion. [PAWN_pronoun] developed the social and combat skills to do [PAWN_possessive] job well and was respected by the men.
When [PAWN_possessive] unit came under direct fire for the first time, [PAWN_nameDef] fled to a bunker and hid. [PAWN_pronoun] was demoted and never escaped the disgrace.	
Social: +4
Shooting: +5
+Violent
Wimp	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	Check.png	Naked Thin south.pngNaked Thin south.png
Military Commissar
(Commissar)	[PAWN_nameDef] was an internal spymaster in an imperial army battalion. [PAWN_pronoun] made sure that the men were loyal, and did not fall back unless ordered. This made [PAWN_objective] unpopular, but [PAWN_pronoun] gained great skill at detecting the slightest dishonesty.	
Shooting: +3
Social: +6
+Social
+Violent
-	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	Ex.png	Naked Hulk south.pngNaked Thin south.png
Artilleryman/Artillerywoman
(Artilleer)	[PAWN_nameDef] loaded shells and aimed artillery to pound [PAWN_possessive] army's enemies from afar.	
Shooting: +6
Melee: +1
+Violent
-	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	Ex.png	Naked Thin south.pngNaked Thin south.png
Demolitionist
(Demolitionist)	[PAWN_nameDef] manufactured and planted explosives used to breach enemy defenses. Dealing with explosives every day taught [PAWN_objective] to keep a level head and steady hand.	
Shooting: +4
Crafting: +4
+Violent
Steadfast	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	Ex.png	Naked Male south.pngNaked Female south.png
Firebomber
(Firebomber)	[PAWN_nameDef] piloted a small fighter-bomber design specialized in spreading incendiary gel on flammable targets.
Conditioned to love the sight of a target lighting up, [PAWN_pronoun] grew to love fire in all its forms - war, cooking, and even for cauterizing wounds in the hospital.	
Shooting: +3
Cooking: +3
Medicine: +2
+Violent
Pyromaniac	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	Ex.png	Naked Thin south.pngNaked Thin south.png
Military Chaplain
(Chaplain)	[PAWN_nameDef] stayed with the troops in training and in combat, administering to the dying and reinforcing the faith of the living.
Like all imperial chaplains, [PAWN_pronoun] vowed never to fight [PAWN_objective]self. However, [PAWN_pronoun] acted as a medic and treated the wounded.	
Medicine: +6
Intellectual: +2
+Caring
+Intellectual
−Violent
-	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	Ex.png	Check.png	Naked Male south.pngNaked Female south.png
Royal Guard
(Guard)	[PAWN_nameDef] guarded the personal palace of a powerful lord.
While violence was rare, palace intrigue was constant. [PAWN_nameDef]'s work taught [PAWN_pronoun] to handle both words and guns.	
Shooting: +4
Melee: +3
Social: +3
+Violent
+Social
-	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	Ex.png	Naked Male south.pngNaked Female south.png
Propagandist
(Propagandist)	[PAWN_nameDef] was a skilled artist and military propagandist. [PAWN_pronoun] created works of art depicting [PAWN_possessive] lords and armies fovourably.	
Artistic: +6
Social: +2
+Artistic
-	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	Ex.png	Naked Thin south.pngNaked Thin south.png
Warmaster
(Warmaster)	[PAWN_nameDef] was warmaster to a mid-level royal house. [PAWN_pronoun] oversaw military aspects of the family's strategy.
On the rare occasion a battle occurred, [PAWN_nameDef] directed the military commanders.	
Shooting: +2
Melee: +2
Social: +4
Intellectual: +4
+Violent
-	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	Naked Hulk south.pngNaked Female south.png
Regent
(Regent)	When [PAWN_nameDef]'s family's ally was killed, and his young son inherited his throne, [PAWN_nameDef] was appointed as regent to rule in the child's stead.
[PAWN_pronoun] oversaw diverse matters of house and title, from finances to war to greedy relatives intent on usurping the throne. [PAWN_nameDef] himself never abused [PAWN_possessive] position.	
Social: +5
Intellectual: +4
Work types	-	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	Naked Hulk south.pngNaked Female south.png
Beastmaster
(Beastmaster)	[PAWN_nameDef]'s family had more children than they had proper titles to inherit. Being of low rank in the birth order, [PAWN_nameDef] was given the honorary title of beastmaster.
[PAWN_nameDef] managed the family's extensive menagerie. While [PAWN_pronoun] never worked hands-on with the beasts, [PAWN_pronoun] connected with them. Few others appreciated [PAWN_objective] the way they did.	
Animals: +8
+Animals
-	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	Naked Thin south.pngNaked Female south.png
Arts Patron
(Patron)	[PAWN_nameDef] managed [PAWN_possessive] family's investments in the arts.
[PAWN_pronoun] chose artists to patronize and worked with them to produce the expressions that most glorify [PAWN_possessive] family, the Imperial church, and the Empire itself.	
Social: +5
Artistic: +5
+Social
Nimble	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	Naked Thin south.pngNaked Thin south.png
Spymaster
(Spymaster)	As soon as [PAWN_pronoun] was old enough, [PAWN_nameDef] was given the post of spymaster for [PAWN_possessive] house. [PAWN_possessive] cold, calculating nature made [PAWN_objective] a natural at the arts of blade, poison, and betrayal.	
Social: +4
Shooting: +3
Melee: +3
+Social
+Violent
Psychopath	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	Naked Male south.pngNaked Female south.png
Landworker
(Landworker)	[PAWN_nameDef] held the position of landworker in [PAWN_possessive] royal house. [PAWN_pronoun] managed the family's lands and all the resources on them - both agricultural and mineral.
Though [PAWN_pronoun] would never work the machines [PAWN_objective]self, managing these enterprises required learning the methods of farming and mining in detail.	
Plants: +6
Mining: +6
+PlantWork
+Mining
-	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	Naked Male south.pngNaked Female south.png
Navy Scientist
(Scientist)	Interstellar warfare is won by technology, so glitterworld navies are always at the peak of modern research. Even better, they occasionally find archotechnological artifacts floating in space.
[PAWN_nameDef] worked in a navy lab.	
Intellectual: +8
+Intellectual
-	Ex.png	Ex.png	Ex.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Male south.pngNaked Female south.png
Glitterworld Empath
(Empath)	[PAWN_nameDef] found it easy to relate to others and mediate conflict. [PAWN_pronoun] was selected to train as an empath. The training intensified [PAWN_possessive] natural abilities, but [PAWN_pronoun] became unable to cause others pain.	
Social: +8
Medicine: +2
+Social
−Violent
−Psychopath	Ex.png	Ex.png	Ex.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Thin south.pngNaked Thin south.png
Glitterworld Surgeon
(Surgeon)	[PAWN_nameDef] worked as a surgeon on a world mostly free of disease and human suffering, so [PAWN_possessive] job focused on elaborate and creative cosmetic surgeries.
[PAWN_pronoun] understands human biology, deeply, but has never had to remove a tumour — or a bullet.	
Artistic: +5
Medicine: +3
Social: +1
+Caring
+Artistic
-	Ex.png	Ex.png	Check.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Male south.pngNaked Female south.png
Novelist
(Novelist)	[PAWN_nameDef] lived on a glitterworld, penning wildly successful novels. [PAWN_pronoun] lived a carefree lifestyle, spending [PAWN_possessive] days writing and [PAWN_possessive] nights partying - and has never done a day's manual labour in [PAWN_possessive] life.	
Construction: −5
Mining: −5
Artistic: +8
+Intellectual
−ManualDumb
−Social
-	Ex.png	Ex.png	Ex.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Thin south.pngNaked Thin south.png
Charity Worker
(Altruist)	Glitterworlds are havens of comfort for those lucky enough to live there, but [PAWN_nameDef] could not ignore the nearby trashworlds where the people suffered and starved. [PAWN_pronoun] spent [PAWN_possessive] life appealing for donations and supporting those in need.	
Social: +6
Mining: −3
+Caring
+Social
−Violent
−Psychopath	Ex.png	Ex.png	Ex.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Thin south.pngNaked Thin south.png
Glitterworld Officer
(Officer)	Though glitterworlds are peaceful places, they often remain prepared for war. [PAWN_nameDef]'s unit rarely saw any real action.
Though [PAWN_pronoun] pursued [PAWN_possessive] artistic hobbies, [PAWN_possessive] subordinates preferred to entertain themselves by brawling, so [PAWN_nameDef] got good at breaking up fights.	
Melee: +6
Artistic: +4
+Violent
−ManualDumb
-	Ex.png	Ex.png	Check.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Hulk south.pngNaked Hulk south.png
Biosphere Manager
(Botanist)	[PAWN_nameDef] lived on a peaceful glitterworld where all menial work was done by robots, while the people mostly devoted themselves to leisure. [PAWN_pronoun] managed the plant and animal life of a sprawling park, where citizens came to admire nature's beauty.	
Shooting: −4
Animals: +6
Plants: +6
+Artistic
−ManualDumb
−Crafting
−Cooking
-	Ex.png	Ex.png	Ex.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Male south.pngNaked Female south.png
VR Designer
(Game Dev)	[PAWN_nameDef] designed virtual reality simulations for glitterworld citizens. [PAWN_pronoun] put great effort into the details of [PAWN_possessive] virtual worlds, learning all [PAWN_pronoun] could about plant life to make [PAWN_possessive] landscapes as realistic as possible.	
Construction: +3
Plants: +4
Artistic: +5
+Artistic
−ManualDumb
-	Ex.png	Ex.png	Ex.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Thin south.pngNaked Thin south.png
Architect
(Architect)	[PAWN_nameDef] designed the construction of buildings. On [PAWN_possessive] glitterworld home, the technical aspect of architecture was handled by an AI, whilst the labour was done by robots. This freed [PAWN_objective] up to push the artistic limits of his craft, but also meant [PAWN_pronoun] never had to get [PAWN_possessive] hands dirty.	
Construction: +5
Artistic: +7
Crafting: −3
+Intellectual
−ManualDumb
-	Ex.png	Ex.png	Ex.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Male south.pngNaked Female south.png
Sculptor
(Sculptor)	[PAWN_nameDef] started off sculpting person-sized artworks, but [PAWN_pronoun] soon began to think bigger. With the help of mining robots, [PAWN_pronoun] learned how to carve huge monuments out of cliffsides. Soon the parks of the glitterworld where [PAWN_pronoun] lived were full of giant stone figures.	
Plants: −4
Mining: +4
Artistic: +9
+Artistic
−ManualDumb
−Crafting
−Cooking
-	Ex.png	Ex.png	Ex.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Fat south.pngNaked Fat south.png
Medieval Farm Oaf
(Oaf)	Tilling, hoeing, guiding ox carts, pushing wheelbarrows. Digging ditches, planting seeds, predicting the harvest.\n\nMedieval-level farmers aren't educated in the usual sense, but they know a lot about growing plants without technology. That said, such a life leaves one essentially incapable of participating in intellectual, technology-driven activities.	
Plants: +8
Mining: +3
+ManualDumb
+PlantWork
+Mining
−Intellectual
-	Ex.png	Ex.png	Check.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Fat south.pngNaked Fat south.png
Medieval Lord
(Noble)	[PAWN_nameDef] was a lord on a preindustrial planet. [PAWN_pronoun] went to parties, managed the underlings, and even learned some swordplay.\n\n[PAWN_possessive] soft hands did not hold a work tool during that entire time. [PAWN_pronoun] considers manual labor to be beneath [PAWN_objective].	
Social: +7
Melee: +5
Shooting: +5
+Social
−ManualDumb
−ManualSkilled
-	Ex.png	Ex.png	Ex.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Hulk south.pngNaked Thin south.png
Medieval Minstrel
(Minstrel)	[PAWN_nameDef] was a traveling entertainer on a medieval world.\n\n[PAWN_pronoun] could always be found telling stories or singing songs, and is capable of protecting [PAWN_objective]self from the dangers of the road. However, [PAWN_pronoun] was always conspicuously absent whenever there was hard labour to be done.	
Social: +4
Artistic: +3
Melee: +2
−ManualSkilled
−Hauling
-	Ex.png	Ex.png	Check.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Fat south.pngNaked Fat south.png
Taster
(Taster)	As the taster for a medieval king, any dish served at the royal table had to be sampled first by [PAWN_nameDef]. [PAWN_pronoun] lived a decadent lifestyle at court, getting fat and doing very little work.	
Cooking: +7
Construction: −4
Crafting: −4
+Cooking
−ManualDumb
-	Ex.png	Ex.png	Check.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Fat south.pngNaked Fat south.png
Blacksmith
(Blacksmith)	As a smith on a medieval world, [PAWN_nameDef] gained a reputation for the high quality of [PAWN_possessive] work. [PAWN_pronoun] wasn't bad at using the swords [PAWN_pronoun] forged either.	
Shooting: −5
Melee: +4
Crafting: +6
+ManualDumb
+ManualSkilled
−Intellectual
-	Ex.png	Ex.png	Check.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Male south.pngNaked Female south.png
Message Carrier
(Messenger)	On a medieval world, the fastest way to send a message is to give it to somebody on a horse and hope they survive the journey. [PAWN_nameDef] was that somebody.	
Melee: +3
Animals: +4
−Intellectual
-	Ex.png	Ex.png	Check.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Hulk south.pngNaked Hulk south.png
Medieval Doctor
(Quack)	[PAWN_nameDef] worked as a doctor on a medieval planet. [PAWN_pronoun] firmly believes that most ailments can be cured with a little bloodletting.\n\n[PAWN_pronoun] was also a master anaesthetist, developing a specialty technique that involved a heavy blow to the head.	
Melee: +6
Medicine: +1
+Caring
-	Ex.png	Ex.png	Ex.png	Check.png	Check.png	Ex.png	Ex.png	Ex.png	Naked Male south.pngNaked Thin south.png
Herbalist
(Herbalist)	[PAWN_nameDef] lived in the forest near a village. Though many of the villagers feared [PAWN_objective], sick villagers would come to [PAWN_objective] to purchase salves and poultices made from the herbs [PAWN_pronoun] grew in [PAWN_possessive] garden. [PAWN_pronoun] was happy to help them — for a price.	
Plants: +4
Medicine: +4
Social: −2
+Caring
+PlantWork
-	Ex.png	Ex.png	Check.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Thin south.pngNaked Thin south.png
Medieval Sailor
(Sailor)	[PAWN_nameDef] explored the oceans on a wooden ship, seeking out plant and animal specimens from exotic places, and occasionally fending off pirates. [PAWN_pronoun] loved the sea so much [PAWN_pronoun] refused to do all but the barest minimum of work on land, except to sell the treasures [PAWN_pronoun] collected.	
Melee: +4
Social: +4
Animals: +4
+ManualDumb
−ManualSkilled
-	Ex.png	Ex.png	Check.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Male south.pngNaked Female south.png
Policeman/Policewoman
(Policeman/Policewoman)	[PAWN_nameDef] kept the peace as a line officer in a municipal police force.
[PAWN_pronoun] was trained in de-escalation, physical control, shooting, and other police skills.	
Social: +3
Shooting: +4
Melee: +3
+Social
+Violent
-	Ex.png	Check.png	Ex.png	Check.png	Ex.png	Check.png	Ex.png	Ex.png	-
Chef
(Chef)	[PAWN_nameDef] ran a high-class restaurant. [PAWN_pronoun] was famous among patrons for [PAWN_possessive] creative culinary specialties, and infamous among kitchen workers for [PAWN_possessive] casual disdain for grunt work.	
Cooking: +6
Social: +2
+Cooking
−Cleaning
−ManualDumb
-	Ex.png	Ex.png	Check.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Male south.pngNaked Female south.png
Housemate/Housewife
(Housemate/Housewife)	As an adult, [PAWN_nameDef] kept house and cared for children while [PAWN_possessive] spouse worked.	
Cooking: +3
Medicine: +3
Crafting: +2
+ManualDumb
-	Ex.png	Check.png	Ex.png	Check.png	Ex.png	Check.png	Ex.png	Ex.png	Naked Male south.pngNaked Female south.png
Inventor
(Inventor)	On [PAWN_possessive] homeworld, [PAWN_nameDef] worked as a moderately successful inventor. [PAWN_pronoun] developed several minor technologies.	
Crafting: +5
Intellectual: +2
+Intellectual
+Crafting
-	Ex.png	Check.png	Ex.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Thin south.pngNaked Thin south.png
Teacher
(Teacher)	[PAWN_nameDef] was educated in the liberal arts and taught at a public school. [PAWN_pronoun] was widely knowledgeable and well-liked by [PAWN_possessive] students.	
Intellectual: +3
Social: +4
+Intellectual
+Social
-	Ex.png	Check.png	Ex.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Male south.pngNaked Female south.png
Civil Servant
(Bureaucrat)	[PAWN_nameDef] worked as a low-ranking administrator for a moribund government bureaucracy. [PAWN_pronoun] is most at home filling out complicated paperwork and playing office politics.	
Social: +3
Intellectual: +3
Construction: −2
-

-	Ex.png	Check.png	Ex.png	Check.png	Ex.png	Check.png	Ex.png	Ex.png	Naked Male south.pngNaked Female south.png
Bartender
(Barkeep)	[PAWN_nameDef] worked as a bartender in a seedy establishment. The job was one part drink-mixing, one part diplomacy, and one part head-bashing.	
Social: +4
Melee: +2
Cooking: +2
+Social
+Cooking
-	Ex.png	Check.png	Check.png	Check.png	Ex.png	Check.png	Ex.png	Ex.png	Naked Hulk south.pngNaked Fat south.png
Conceptual Artist
(Artist)	[PAWN_nameDef] was well-known in art circles on [PAWN_possessive] home world for [PAWN_possessive] unique and creative conceptual artworks.
Nobody was sure exactly what [PAWN_pronoun] was trying to communicate, but [PAWN_possessive] pieces were highly valued by collectors.	
Artistic: +8
Crafting: +1
+Artistic
−Social
−Caring
−Hauling
-	Ex.png	Ex.png	Ex.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Male south.pngNaked Female south.png
Evangelist
(Evangelist)	As a youth, [PAWN_nameDef] experienced a religious awakening. [PAWN_pronoun] decided to spend the rest of [PAWN_possessive] life spreading the word of [PAWN_possessive] deity, the beauty of its culture, and its unusual medical tradition.	
Social: +4
Artistic: +4
Medicine: −3
+Social
+Caring
-	Ex.png	Check.png	Ex.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Male south.pngNaked Female south.png
Ascetic Priest
(Priest)	After taking a vow of silence, [PAWN_nameDef] joined a monastery to spend [PAWN_possessive] days in quiet contemplation.
[PAWN_pronoun] found happiness growing vegetables in the garden and making cheese in the monastery cellars.	
Plants: +4
Medicine: +2
Cooking: +2
+PlantWork
+ManualDumb
−Violent
−Social
Ascetic	Ex.png	Check.png	Ex.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Thin south.pngNaked Thin south.png
Escaped Convict
(Escapee)	[PAWN_nameDef] denies involvement in the crimes that brought about [PAWN_possessive] incarceration in a brutal penal colony. [PAWN_pronoun] escaped by tunneling beneath the perimeter using modified cutlery.	
Mining: +4
Crafting: +2
+Violent
−Caring
-	Ex.png	Check.png	Check.png	Check.png	Ex.png	Check.png	Ex.png	Ex.png	Naked Male south.pngNaked Female south.png
Nurse
(Nurse)	[PAWN_nameDef] worked in a hospital, doing routine work such as changing bandages and taking temperatures.
It was a busy job, but [PAWN_pronoun] could always find time for a chat with a patient.	
Social: +4
Medicine: +5
+Caring
−Violent
-	Ex.png	Check.png	Ex.png	Check.png	Ex.png	Check.png	Ex.png	Ex.png	Naked Male south.pngNaked Female south.png
House Servant
(Servant)	[PAWN_nameDef] was a domestic servant to wealthy homeowners.
[PAWN_pronoun] got to know the kitchens and basements of [PAWN_possessive] master's mansion well, but never did any work outside.	
Cooking: +4
Plants: −3
Mining: −3
+ManualDumb
+Cleaning
−Intellectual
-	Ex.png	Check.png	Check.png	Check.png	Ex.png	Check.png	Ex.png	Ex.png	Naked Fat south.pngNaked Fat south.png
Bodyguard
(Bodyguard)	[PAWN_nameDef] protected whoever paid [PAWN_objective]. [PAWN_pronoun] gained proficiency in many different combat forms, and was known for [PAWN_possessive] ruthlessness against those who crossed [PAWN_objective].	
Shooting: +4
Melee: +4
+Violent
−Social
-	Ex.png	Check.png	Check.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Hulk south.pngNaked Hulk south.png
Mathematician
(Math Prof)	[PAWN_nameDef] did mathematical research at a university.
[PAWN_pronoun] spent much of [PAWN_possessive] spare time immersed in shooting simulations, though [PAWN_pronoun] was frequently ridiculed by other players for [PAWN_possessive] terrible aim.	
Shooting: −3
Intellectual: +8
+Intellectual
−ManualDumb
-	Ex.png	Ex.png	Ex.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Thin south.pngNaked Thin south.png
Paramedic
(Paramedic)	[PAWN_nameDef]'s job was to respond rapidly to medical emergencies. [PAWN_pronoun] is used to dealing with severe injuries with only limited medical supplies.
[PAWN_pronoun] treated so many gunshot wounds over the years that even seeing a gun made [PAWN_objective] uncomfortable.	
Shooting: −5
Medicine: +6
+Caring
+Violent
-	Ex.png	Check.png	Ex.png	Check.png	Ex.png	Check.png	Ex.png	Ex.png	Naked Male south.pngNaked Female south.png
Gardener
(Gardener)	[PAWN_nameDef] worked at the mansion of a powerful family, tending the lavish gardens as part of a team of servants.	
Plants: +8
+ManualDumb
+PlantWork
−Intellectual
−Crafting
-	Ex.png	Ex.png	Check.png	Check.png	Ex.png	Check.png	Ex.png	Ex.png	Naked Male south.pngNaked Female south.png
Torturer
(Torturer)	Working for a tyrannical dictator, [PAWN_nameDef] earned a reputation as an expert in 'persuasion.' Any prisoner who went down into the dungeons left with no secrets - and with [PAWN_nameDef]'s smile scarred permanently into their nightmares.	
Melee: +6
+Violent
−Social
−Caring
Psychopath	Ex.png	Check.png	Check.png	Check.png	Ex.png	Check.png	Ex.png	Ex.png	Naked Male south.pngNaked Female south.png
Defector
(Defector)	Early in [PAWN_possessive] adulthood, [PAWN_nameDef] decided to leave the oppressive dictatorship where [PAWN_pronoun] lived. [PAWN_possessive] defection was not well-received, and agents were sent out after [PAWN_objective].
[PAWN_pronoun] spent years on the run, treating [PAWN_possessive] own wounds so no doctor could betray [PAWN_objective]. The ordeal made [PAWN_objective] bitter and untrusting	
Shooting: +5
Social: −4
Medicine: +3
+Violent
+Caring
−Artistic
-	Ex.png	Check.png	Check.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Male south.pngNaked Female south.png
Construction Engineer
(Builder)	[PAWN_nameDef] was a construction worker. [PAWN_pronoun] lead a team which built everything from office blocks to cathedrals.
[PAWN_possessive] busy job and numerous nearby fast-food outlets meant [PAWN_pronoun] never cooked for [PAWN_objective]self.	
Construction: +8
Plants: −3
+ManualSkilled
−Intellectual
−Cooking
-	Ex.png	Ex.png	Check.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Hulk south.pngNaked Female south.png
Rancher
(Rancher)	[PAWN_nameDef] owned and operated a successful ranch where [PAWN_pronoun] raised animals for meat and wool.
[PAWN_pronoun] refused to do any dumb labour [PAWN_pronoun] could pay someone else to do for [PAWN_objective].	
Animals: +8
Cooking: −4
Mining: −4
+Animals
−ManualDumb
-	Ex.png	Check.png	Check.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Fat south.pngNaked Fat south.png
Low-Wage Worker
(Grunt)	[PAWN_nameDef] worked a variety of casual jobs to support [PAWN_possessive] family, gaining a set of basic hands-on skills.	
Cooking: +4
Plants: +3
Crafting: +3
+ManualDumb
+Cleaning
-	Ex.png	Check.png	Check.png	Check.png	Ex.png	Check.png	Ex.png	Ex.png	Naked Male south.pngNaked Female south.png
Model
(Model)	[PAWN_nameDef] modelled clothes and jewellery for advertisers, and was also used as a physical blueprint for characters in virtual reality simulations.	
Social: +5
Artistic: +6
+Social
+Artistic
−ManualDumb
−Intellectual
−ManualSkilled
−Caring
Beautiful	Ex.png	Ex.png	Ex.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Hulk south.pngNaked Thin south.png
Geologist
(Geologist)	[PAWN_nameDef] worked with miners and cave-diggers, identifying rock types and natural formations.
During [PAWN_possessive] years underground [PAWN_pronoun] also gained experience repairing drilling machines and other technical equipment.	
Mining: +8
Crafting: +3
+Intellectual
-	Ex.png	Check.png	Check.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Male south.pngNaked Female south.png
Jailbird
(Jailbird)	[PAWN_nameDef] spent most of [PAWN_possessive] life in prisons, where [PAWN_pronoun] was put to work in the kitchens. [PAWN_pronoun] had a habit of getting into fights, and developed an aggressive way of speaking.	
Melee: +5
Cooking: +3
+Violent
−Social
−Caring
-	Ex.png	Check.png	Check.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Hulk south.pngNaked Hulk south.png
Actor
(Actor)	[PAWN_nameDef] travelled with a company of actors, playing to packed theatres and loving audiences everywhere. [PAWN_pronoun] was a perfectionist, and made [PAWN_possessive] own props and costumes rather than use the ones [PAWN_pronoun] was given.	
Social: +8
Crafting: +3
+Social
−ManualDumb
-	Ex.png	Check.png	Ex.png	Check.png	Ex.png	Check.png	Ex.png	Ex.png	Naked Male south.pngNaked Female south.png
Veterinarian
(Vet)	[PAWN_nameDef] treated sick and injured animals for a living. Seeing their suffering affected [PAWN_possessive] stance on the practice of eating meat, and for many years [PAWN_pronoun] lived as a vegetarian.	
Animals: +4
Medicine: +4
Cooking: −4
+Caring
-	Ex.png	Check.png	Ex.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Male south.pngNaked Female south.png
Explosives Expert
(Blaster)	[PAWN_nameDef] was an explosive engineer employed in mines. [PAWN_pronoun] took [PAWN_possessive] job very seriously and was well-versed in the technicalities - so much so that [PAWN_pronoun] refused to demean [PAWN_objective]self by helping with the clean-up once [PAWN_possessive] carefully-calculated explosion was complete.	
Mining: +5
Intellectual: +5
+Violent
−ManualDumb
-	Ex.png	Check.png	Check.png	Check.png	Ex.png	Check.png	Ex.png	Ex.png	Naked Fat south.pngNaked Fat south.png
Counselor
(Counselor)	A terrifying trauma when [PAWN_nameDef] was a young adult caused [PAWN_objective] to develop a serious eating disorder. With counseling [PAWN_pronoun] learned to have a healthier relationship with food, and decided to put [PAWN_possessive] new skills to use helping others overcome their emotional problems.	
Social: +9
+Social
−Cookingtypes
-	Ex.png	Check.png	Ex.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Thin south.pngNaked Thin south.png
Recruiter
(Recruiter)	[PAWN_nameDef] was part of a revered order of martial artists, infamous both for their skill in combat and for their practice of refusing to treat their wounded.
[PAWN_pronoun] travelled [PAWN_possessive] homeworld, judging the young people [PAWN_pronoun] met to determine if they might be suitable for training.	
Melee: +5
Social: +5
+Social
−Caring
-	Ex.png	Check.png	Check.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Male south.pngNaked Female south.png
Drifter
(Drifter)	[PAWN_nameDef] never figured out what to do with [PAWN_possessive] life. [PAWN_pronoun] travelled often, taking up casual work wherever [PAWN_pronoun] found it.
[PAWN_pronoun] also occasionally worked on a novel that [PAWN_pronoun] knew would be a bestseller - just as soon as [PAWN_pronoun] could find a publisher who was interested	
Cooking: +3
Construction: +3
Artistic: −4
-

-	Ex.png	Check.png	Check.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Thin south.pngNaked Thin south.png
Machine Collector
(Collector)	[PAWN_nameDef] was obsessed with old machines and arcane pieces of technology. [PAWN_pronoun] obtained them wherever [PAWN_pronoun] could, and loved taking them apart to see how they worked.
[PAWN_pronoun] had a habit of talking about [PAWN_possessive] collection long after people around [PAWN_objective] had stopped listening.	
Social: −3
Crafting: +6
Intellectual: +6
+Crafting
-	Ex.png	Check.png	Ex.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Male south.pngNaked Female south.png
Con Artist
(Con Artist)	[PAWN_nameDef] never created anything in [PAWN_possessive] life. [PAWN_pronoun] did, however, prove to be a natural at getting others to give [PAWN_objective] what they had created.	
Social: +10
+Social
−Violent
-	Ex.png	Check.png	Ex.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Male south.pngNaked Thin south.png
Factory Worker
(Worker)	[PAWN_nameDef] did menial, unskilled work in an industrial factory. [PAWN_possessive] job also included caring for the mules and horses which transported the goods.	
Animals: +3
Construction: +3
Crafting: +2
+ManualDumb
+ManualSkilled
+Animals
−Intellectual
−Artistic
−Cooking
-	Ex.png	Check.png	Check.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Hulk south.pngNaked Hulk south.png
Psychiatric Patient
(Patient)	[PAWN_nameDef] spent most of [PAWN_possessive] adult life in an insane asylum. [PAWN_possessive] industrial homeworld had a poor understanding of mental illness, and [PAWN_pronoun] was treated more like an animal than a person.
Though [PAWN_pronoun] eventually recovered and was released, [PAWN_possessive] experience dampened many of [PAWN_possessive] basic life skills.	
Cooking: −2
Crafting: −2
−Social
−Caring
−Violent
-	Ex.png	Check.png	Ex.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Thin south.pngNaked Thin south.png
Human Computer
(Computer)	[PAWN_nameDef] turned out to have an excellent memory and a gift for performing complex calculations in [PAWN_possessive] head. An industrial-world dictator decided to employ [PAWN_nameDef] to keep track of [PAWN_possessive] state's finances and expenditure.	
Shooting: +3
Intellectual: +7
+Intellectual
−Artistic
-	Ex.png	Ex.png	Check.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Thin south.pngNaked Thin south.png
Sheriff
(Sheriff)	[PAWN_nameDef] was the law enforcer in an isolated industrial town. [PAWN_pronoun] dealt with petty crime, dispute resolution, and the occasional drunken saloon shootout.	
Shooting: +4
Melee: +4
Social: +4
+Violent
-	Ex.png	Check.png	Check.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Fat south.pngNaked Fat south.png
Urbworld Entrepreneur
(Entrepreneur)	In the urbworlds, most suffer. But someone has to run the corporations.
[PAWN_nameDef] learned the skills of the trade - greasing palms and technical analysis. [PAWN_pronoun] is a sociointellectual machine.	
Social: +6
Intellectual: +3
+Social
-	Ex.png	Ex.png	Ex.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Male south.pngNaked Thin south.png
Joywire Artist
(Joywirer)	[PAWN_nameDef] worked in an urbworld lab developing cutting-edge joywire software to maximize user pleasure.
When the local government imposed harsh restrictions on joywire manufacturing, [PAWN_pronoun] began selling [PAWN_possessive] products on the black market.	
Artistic: +3
Intellectual: +2
Medicine: +2
+Intellectual
−ManualDumb
-	Ex.png	Ex.png	Check.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Male south.pngNaked Female south.png
Mafia Boss
(Boss)	[PAWN_nameDef] was a high-ranking member of an urbworld crime syndicate.
[PAWN_pronoun] bribed officials, maintained the loyalty of [PAWN_possessive] subordinates, and extracted overdue payments - by any means necessary.	
Shooting: +4
Melee: +3
Social: +4
+Social
−ManualDumb
−Caring
−Cooking
-	Ex.png	Ex.png	Check.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Hulk south.pngNaked Female south.png
Urbworld Drone
(Drone)	[PAWN_nameDef] worked as a mindless construction drone on a massive urbworld. Though [PAWN_pronoun] is now freed from the brutal social experiments to which [PAWN_pronoun] was subjected, [PAWN_pronoun] remains incapable of creative thought and leadership.	
Construction: +5
Mining: +4
Social: −2
+ManualDumb
+ManualSkilled
−Artistic
−Intellectual
-	Ex.png	Ex.png	Check.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Hulk south.pngNaked Hulk south.png
Urbworld Rebel
(Rebel)	Most of the people on [PAWN_nameDef]'s world gave up their individuality to join together in an online hivemind. [PAWN_nameDef] joined a rebel faction that rejected technology entirely.	
Melee: +3
Construction: +3
Mining: +2
+ManualDumb
−Intellectual
−Crafting
-	Ex.png	Ex.png	Check.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Hulk south.pngNaked Female south.png
Caveworld Illuminator
(Illuminator)	Among tunnel-dwellers, those with vision as strong as [PAWN_nameDef]’s are revered as sages. [PAWN_pronoun] would lead the way, marking spots to dig with bioluminescent fungus and warning others of impending danger.	
Mining: +3
Social: +2
+Mining
+ManualSkilled
Undergrounder	Ex.png	Ex.png	Check.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Male south.pngNaked Female south.png
Colony Settler
(Settler)	[PAWN_nameDef] was a settler on a new colony world.
Such a life requires a jack-of-all trades at basic hands-on tasks.	
Construction: +4
Plants: +4
Mining: +4
+ManualDumb
+ManualSkilled
-	Ex.png	Check.png	Ex.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Hulk south.pngNaked Female south.png
Deep Space Miner
(Miner)	[PAWN_nameDef] did the sweaty, grimy work of pulling metal out of asteroids on a deep space rig. [PAWN_pronoun] used [PAWN_possessive] hands-on industrial skills daily - and wasn't bad in a bar fight either.	
Mining: +7
Construction: +3
Melee: +2
+ManualDumb
+ManualSkilled
-	Ex.png	Ex.png	Check.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Fat south.pngNaked Female south.png
Starship Janitor
(Janitor)	While other passengers pass the years between star systems in cryptosleep sarcophagi, [PAWN_nameDef] had to wake up at periodic intervals to perform inspections, check the navigation systems, and to oil the mechanoids.	
Construction: +2
Crafting: +3
+ManualDumb
+ManualSkilled
-	Ex.png	Ex.png	Ex.png	Check.png	Ex.png	Check.png	Ex.png	Ex.png	Naked Male south.pngNaked Female south.png
Castaway
(Castaway)	[PAWN_nameDef] was the only survivor of a ship crash on an unhabited animal world. For many years until [PAWN_possessive] rescue [PAWN_pronoun] scrounged an existence out of whatever [PAWN_pronoun] could find.
[PAWN_possessive] survival skills became razor-sharp, but spending so long alone severely dampened [PAWN_possessive] conversational[sic] abilities.	
Melee: +5
Animals: +3
Construction: +4
+ManualDumb
+PlantWork
−Intellectual
−Social
−Artistic
-	Ex.png	Ex.png	Check.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Hulk south.pngNaked Hulk south.png
Taxonomist
(Taxonomist)	[PAWN_nameDef] travelled between star systems, studying and classifying the plant and animal life [PAWN_pronoun] found in the hopes of creating a complete catalogue.	
Animals: +5
Plants: +5
+Intellectual
−Violent
-	Ex.png	Ex.png	Ex.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Thin south.pngNaked Thin south.png
Space Tactician
(Tactician)	[PAWN_nameDef] joined the space navy in an unstable system, fraught with large-scale interplanetary wars. [PAWN_pronoun] turned out to have a sharp mind for battle, and became adept at commanding combat units to great effect.	
Shooting: +4
Intellectual: +4
+Intellectual
−Social
−Artistic
-	Ex.png	Ex.png	Check.png	Check.png	Ex.png	Check.png	Ex.png	Ex.png	Naked Thin south.pngNaked Thin south.png
Hermit
(Hermit)	Worn out by the pressures of social interaction, [PAWN_nameDef] left [PAWN_possessive] crowded city to live a simple life in the wilderness. There, [PAWN_pronoun] spent [PAWN_possessive] days alone, tending [PAWN_possessive] garden and crafting the simple tools [PAWN_pronoun] needed to survive.	
Plants: +4
Crafting: +3
Construction: +1
+PlantWork
+ManualDumb
+Crafting
−Social
Ascetic	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	Ex.png	Ex.png	Ex.png	Naked Thin south.pngNaked Thin south.png
Space Pirate
(Pirate)	Piracy appears everywhere that governments are weak and society spread thin. [PAWN_nameDef] was part of this age-old part of human existence, extorting and smashing peaceful trade ships for profit.	
Melee: +4
Shooting: +4
+Violent
-	Ex.png	Ex.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Hulk south.pngNaked Female south.png
Pit Brawler
(Brawler)	[PAWN_nameDef] was nine years old when [PAWN_pronoun] got in [PAWN_possessive] first fight. [PAWN_pronoun] won, but more important was the enjoyment of [PAWN_possessive] audience. Pit fighting turned out to be a lucrative career for those who could survive it. And it was even mostly legal.	
Melee: +8
+Violent
−Intellectual
−Caring
Brawler	Ex.png	Ex.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Hulk south.pngNaked Female south.png
Illegal Shipwright
(Shipwright)	There is a law that says that you're not allowed to put terawatt-range grasers on a cargo scow. Especially if you hide them under what looks like a communications dish for better ambush potential. [PAWN_nameDef] discovered that there is great profit to be made, however, from those who are uninterested in these laws.	
Construction: +7
+ManualSkilled
-	Ex.png	Ex.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Fat south.pngNaked Fat south.png
Gigolo/Courtesan
(Gigolo/Courtesan)	[PAWN_nameDef] was used for [PAWN_possessive] body by hundreds of customers in brothels on several planets. [PAWN_pronoun] gained some mental marks and a special kind of street smarts.	
Social: +8
Melee: +3
+Social
−ManualDumb
−ManualSkilled
Beautiful	Ex.png	Ex.png	Check.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Hulk south.pngNaked Thin south.png
Space Marine
(Marine)	[PAWN_nameDef] was a warrior in an Imperial navy. [PAWN_possessive] job was to punch into enemy starships, gun down the crew, and capture the ship intact. And [PAWN_pronoun] was good at it.	
Melee: +5
Shooting: +7
+Violent
-	Ex.png	Ex.png	Check.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Hulk south.pngNaked Thin south.png
Assassin
(Assassin)	[PAWN_nameDef] was a professional assassin. [PAWN_pronoun] was cold, calculating, and made a good profit. In this business, an utter lack of empathy was an asset.	
Melee: +10
Shooting: +10
+Violent
−Intellectual
−ManualDumb
−ManualSkilled
−Social
−Caring
Psychopath	Ex.png	Ex.png	Check.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Hulk south.pngNaked Thin south.png
Hunter
(Hunter)	[PAWN_nameDef] tracked, trapped and killed animals for their meat and leather.
[PAWN_nameDef] used both ranged and melee weapons. Sometimes, [PAWN_pronoun] hunted alongside animals.	
Shooting: +4
Melee: +3
Animals: +2
+Violent
+Animals
-	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Male south.pngNaked Female south.png
Logger
(Logger)	[PAWN_nameDef] chopped trees and hauled their lumber back to the tribe. [PAWN_pronoun] wielded [PAWN_possessive] axe with the finesse of an artist and the force of a charging muffalo.	
Plants: +6
Melee: +3
+PlantWork
-	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Hulk south.pngNaked Hulk south.png
Gatherer
(Gatherer)	Using [PAWN_possessive] knowledge of plants, roots, and berries, [PAWN_nameDef] could find food in even the most barren landscapes. [PAWN_pronoun] stayed away from animals.	
Plants: +8
Animals: −2
+PlantWork
-	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Male south.pngNaked Female south.png
Digger
(Digger)	[PAWN_nameDef] carved living spaces and mined minerals from the sides of hills and mountains. [PAWN_pronoun] learned to feel at home picking through rock and shoring up cave walls.	
Mining: +6
Construction: +2
+Mining
Undergrounder	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Hulk south.pngNaked Hulk south.png
Weaver
(Weaver)	[PAWN_nameDef] was an expert at working wool, plant fibers and natural dyes into beautiful clothing for [PAWN_possessive] kin. [PAWN_possessive] handicrafts were traded frequently with other settlements.	
Crafting: +6
Plants: +2
+Crafting
-	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Male south.pngNaked Female south.png
Framer
(Framer)	[PAWN_nameDef] was responsible for erecting structures for [PAWN_possessive] fellow tribespeople to live in. This included both temporary structures for nomadic travel, and permanent settlements. Gathering building materials from local plant life was part of the job.	
Construction: +6
Plants: +2
+ManualSkilled
-	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Male south.pngNaked Female south.png
Stew Keeper
(Stewkeeper)	[PAWN_nameDef] prepared meals from the plants and animals brought in by gatherers, farmers, and hunters of [PAWN_possessive] tribe. [PAWN_pronoun] had to make sure it was calorie-efficient, long-lasting, and healthy. [PAWN_pronoun] often processed and sometime[sic] gathered plants [PAWN_objective]self.	
Cooking: +6
Plants: +2
+Cooking
-	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Male south.pngNaked Female south.png
Tamer
(Tamer)	[PAWN_nameDef]'s role in [PAWN_possessive] tribe was to connect with the natural world around - especially the world of animals. In addition to fulfilling a spiritual role, [PAWN_pronoun] also tamed wild beasts and cared for them as they served the tribe.	
Animals: +6
Social: +2
+Animals
-	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Male south.pngNaked Female south.png
Carver
(Carver)	[PAWN_nameDef] carved artworks for [PAWN_possessive] tribe from wood, stone, and occasionally, more exotic materials. The work was sometimes sold, and sometimes kept to beautify settlements and provide a focus for rituals.	
Artistic: +7
+Artistic
-	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Male south.pngNaked Female south.png
Healer
(Healer)	After [PAWN_possessive] tribe’s elder healer was killed in a raid, [PAWN_nameDef] took on the role. [PAWN_pronoun] spent [PAWN_possessive] days scrounging up herbs and mineral compounds from the nearby area to use in surprisingly effective remedies.	
Medicine: +5
Plants: +3
+Caring
-	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Male south.pngNaked Female south.png
Hearth Tender
(Tender)	While the others were out hunting and foraging, [PAWN_nameDef] would stay at home to cook and take care of the young and sick.	
Cooking: +4
Medicine: +3
Crafting: +2
-

Undergrounder	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Male south.pngNaked Female south.png
Warrior
(Warrior)	[PAWN_nameDef] was a fearsome warrior, proficient with many weapons. [PAWN_pronoun] participated in many battles.	
Melee: +4
Shooting: +4
+Violent
-	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Male south.pngNaked Female south.png
Archer
(Archer)	[PAWN_nameDef] fought for [PAWN_possessive] tribe. [PAWN_pronoun] and specialized in the use of bows, pila, and other ranged weapons.	
Melee: +2
Shooting: +7
+Violent
-	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Thin south.pngNaked Thin south.png
Brave
(Brave)	[PAWN_nameDef] wielded ikwa, axes, clubs, and other close-ranged weapons in battles for [PAWN_possessive] tribe.	
Melee: +7
Shooting: +2
+Violent
-	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Hulk south.pngNaked Hulk south.png
Scout
(Scout)	Since [PAWN_possessive] tribe made contact with local outlanders, [PAWN_nameDef] contracted [PAWN_possessive] services out as a guide. Frequent contact with ancient technology made [PAWN_objective] comfortable with the lost machines.	
Shooting: +2
Intellectual: +2
Social: +2
+Violent
Jogger	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Male south.pngNaked Female south.png
Vengeful Hunter
(Vengeful)	Following the death of a close friend by animal attack, [PAWN_nameDef] hunted the beast responsible. [PAWN_pronoun] tracked it to a nearby village, only to find one of the villagers wearing its pelt.	
Shooting: +4
Melee: +6
+Violent
−Animals
-	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Hulk south.pngNaked Hulk south.png
Muffalo Shaman
(Shaman)	Because of [PAWN_possessive] quiet wisdom and great strength, [PAWN_nameDef] became the spiritual guide for [PAWN_possessive] tribe. [PAWN_pronoun] had a special connection with the great spirit of the muffalo.	
Melee: +5
Social: +2
-

-	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Hulk south.pngNaked Hulk south.png
Lore Keeper
(Keeper)	[PAWN_nameDef] was one of a long line of lore keepers in [PAWN_possessive] tribe. Every night around the fire, [PAWN_pronoun] would pass on ancient knowledge and helpful wisdom through stories.	
Intellectual: +2
Social: +3
Artistic: +2
+Intellectual
-	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Male south.pngNaked Female south.png
Loner
(Loner)	[PAWN_nameDef] never much liked the tribal council or the yearly festivals. [PAWN_pronoun] preferred the open plain and the whistle of wind through the rocks.
[PAWN_pronoun] visited [PAWN_possessive] tribe from time to time, but mostly took care of [PAWN_objective]self using [PAWN_possessive] own survival skills.	
Shooting: +3
Melee: +2
Plants: +5
Construction: +1
−Social
-	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Thin south.pngNaked Thin south.png
Banished
(Banished)	[PAWN_nameDef]'s tribe banished [PAWN_objective] following a bloody dispute. [PAWN_pronoun] survived in the wilds alone for a long time.	
Melee: +3
Shooting: +2
Plants: +4
−Social
-	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Thin south.pngNaked Thin south.png
Malingerer
(Malingerer)	[PAWN_nameDef] often feigned sickness in order to avoid [PAWN_possessive] responsibilities. While resting in the sick hut, [PAWN_pronoun] told stories to the children.	
Intellectual: +2
Social: +5
−ManualDumb
-	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Male south.pngNaked Female south.png


Generic childhood backstories
Title
(Short Title)	Description	Skill Modifications	Work types	Traits	Tribal	Outlander	Pirate	Offworld	Outsider	Imperial
Common	Imperial
Fighter	Imperial
Royal	Bodytype
Tribe Child
(Tribal)	[PAWN_nameDef] grew up in a tribe, running around the village, moving with the muffalo herds, learning essential skills from [PAWN_possessive] parents.\n\n[PAWN_pronoun] never learned to read and never saw a machine that wasn't an ancient ruin.	
Plants: +2
Melee: +2
Shooting: +2
Intellectual: −3
-

-	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	-
Abandoned Child
(Abandoned)	[PAWN_nameDef] was born sickly. Thinking that [PAWN_pronoun] would only burden the tribe, [PAWN_possessive] parents exposed [PAWN_objective] to the elements. Somehow, [PAWN_pronoun] survived.	
Melee: +3
Crafting: +3
Social: −2
-

-	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Male south.pngNaked Female south.png
Reclusive Child
(Reclusive)	[PAWN_nameDef] didn't learn to speak until [PAWN_pronoun] was nearly five years old. Even then [PAWN_pronoun] preferred to keep to [PAWN_objective]self.
To the chagrin of [PAWN_possessive] caretakers, [PAWN_pronoun] made a habit of wandering off to live in the wilderness for weeks at a time.	
Melee: +4
Crafting: +3
−Social
-	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	-
Herder
(Herder)	[PAWN_nameDef] tended the muffalo herds, keeping them safe from predators and treating sick animals. It was quiet work, but [PAWN_pronoun] enjoyed being away from people.	
Medicine: +3
Melee: +3
Social: −2
-

-	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	-
Scavenger
(Scavenger)	[PAWN_nameDef] spent [PAWN_possessive] childhood escaping grunt work to go digging through wrecks and ruins for treasures. [PAWN_possessive] natural curiosity got [PAWN_objective] into a lot of trouble, but it also yielded many interesting finds.	
Mining: +3
Intellectual: +3
−ManualDumb
-	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	-
Cave Child
(Cave Child)	[PAWN_nameDef] grew up in a large and intricate cave complex that extended deep into a mountainside. [PAWN_pronoun] helped the adults maintain and improve the deep caves.	
Mining: +3
Construction: +3
-

Undergrounder	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	-
Sole Survivor
(Survivor)	[PAWN_nameDef]'s entire tribe was wiped out in a raid. Though [PAWN_pronoun] was adopted by another group, [PAWN_pronoun] was emotionally scarred, and preferred to stay near home, cooking and tending crops.	
Plants: +3
Cooking: +3
−Violence
-	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	-
Vengeful Child
(Vengeful)	As a child, [PAWN_nameDef] returned to [PAWN_possessive] village to find that it had been wiped out by bandits. [PAWN_pronoun] swore revenge on the attackers and began a violent rampage across the wilderness.	
Melee: +3
Shooting: +3
−Caring
-	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	-
Fire Keeper
(Firekeep)	[PAWN_nameDef] was responsible for keeping the tribe's fire going. [PAWN_pronoun] took this responsibility very seriously.	
Crafting: +2
Cooking: +2
-

-	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	-
Hideaway
(Hideaway)	[PAWN_nameDef]'s overprotective parents encouraged [PAWN_objective] to stay at home nearly every day. Though [PAWN_pronoun] had a lot of time to read and pursue crafting hobbies, [PAWN_pronoun] never developed normal social skills.	
Intellectual: +3
Crafting: +3
Social: −2
-

-	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	-
Crash Baby
(Crashbaby)	As a baby, [PAWN_nameDef] was the only survivor of a deadly spacecraft crash. A passing tribe discovered [PAWN_objective] in the wreckage and adopted [PAWN_objective].	
Social: +3
Intellectual: +2
-

-	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	-
Budding Artist
(Artist)	[PAWN_nameDef] had a knack for art. Traders and collectors from many different societies sought to buy [PAWN_possessive] creations.	
Artistic: +5
-

-	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	-
Bully
(Bully)	[PAWN_nameDef] tormented other children for fun. To keep [PAWN_objective] busy, an elder assigned [PAWN_objective] to a hunting party at an early age.	
Melee: +2
Shooting: +3
−Caring
-	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	-
Bookworm
(Bookworm)	Rather than socialize with the other children, [PAWN_nameDef] preferred to get lost in literature. [PAWN_pronoun] taught [PAWN_objective]self to read at an early age with books bought from passing traders.	
Intellectual: +6
Artistic: +2
Social: −3
−ManualDumb
-	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	-
Industrial Orphan
(Orphan)	[PAWN_nameDef] never knew [PAWN_possessive] parents. [PAWN_possessive] earliest memories were of drudgery in the mines and workhouses of [PAWN_possessive] industrial world.
Because of this, [PAWN_pronoun] never received a proper education.	
Crafting: +3
Mining: +3
Intellectual: −2
-

-	Ex.png	Ex.png	Check.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	-
Urbworld Urchin
(Urchin)	The urbworlds - ancient and deep industrial cityscapes bursting with humanity and poison. [PAWN_nameDef] grew up in the dark, unwanted reaches of such a place. [PAWN_pronoun] had to fight for every scrap of food.	
Melee: +4
Shooting: +2
-

-	Ex.png	Ex.png	Check.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	-
Test Subject
(Testee)	On the most corrupt urbworlds, scientists without a moral compass commit unspeakable atrocities in the name of research. [PAWN_nameDef] was kept alone in a sealed facility from birth and subjected to a variety of behavioural experiments in an attempt to turn [PAWN_objective] into a perfect super-soldier.	
Shooting: +4
−Social
−Caring
−Firefighting
-	Ex.png	Ex.png	Check.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	-
Wreckage Explorer
(Explorer)	[PAWN_nameDef] was tasked with watching [PAWN_possessive] family's herds, but often shirked [PAWN_possessive] duties to go exploring the crashed warships scattered around the planet.	
Animals: +3
Intellectual: +3
-

-	Ex.png	Check.png	Check.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	-
Apocalypse Survivor
(Survivor)	[PAWN_nameDef] was born during a time of unrest on [PAWN_possessive] homeworld, as climate change threatened mass starvation and flooding. As [PAWN_pronoun] grew up the situation worsened - billions died and peaceful states descended into anarchy. [PAWN_nameDef] and [PAWN_possessive] parents did whatever they had to to survive.	
Shooting: +4
Artistic: −3
Intellectual: −3
-

-	Ex.png	Ex.png	Check.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	-
Caveworld Tender
(Cave Kid)	[PAWN_nameDef] grew up in cave complex deep beneath the surface of an inhospitable world. [PAWN_pronoun] worked with the other children tending the tribe’s fungus crops.	
Plants: +4
Mining: +2
Shooting: −3
-

Undergrounder	Ex.png	Ex.png	Check.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	-
Caveworld Tunneler
(Tunneler)	[PAWN_nameDef] worked as a digger in the massive underground cave complex.
[PAWN_pronoun] knows rock so well that [PAWN_pronoun] can almost navigate caves by smell.	
Construction: +1
Mining: +6
Shooting: −2
−Intellectual
−Crafting
Undergrounder	Ex.png	Ex.png	Check.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	Naked Hulk south.pngNaked Hulk south.png
Scout
(Scout)	Born to the administrators of a rimworld colony, [PAWN_nameDef] was enrolled in a youth program that taught military scouting skills.
[PAWN_pronoun] learned to survive in the wilderness, to obey, and not to ask questions.	
Shooting: +3
Crafting: +2
Construction: +1
−Artistic
−Intellectual
-	Ex.png	Check.png	Check.png	Check.png	Ex.png	Check.png	Ex.png	Ex.png	-
Shelter Child
(Shelterkid)	[PAWN_nameDef] grew up in a shelter deep beneath a toxic world. [PAWN_pronoun] received a comprehensive education, but had no opportunity to do physical labour.	
Intellectual: +3
Medicine: +3
Social: +2
Construction: −2
Mining: −2
-

-	Ex.png	Ex.png	Check.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	-
Vatgrown Soldier
(Vatgrown)	[PAWN_nameDef] wasn't made as a person, but as an instrument of destruction. Grown in a bioweapons facility and taught combat during [PAWN_possessive] accelerated growth, [PAWN_nameDef] still has a proclivity for combat of all kinds and an aversion to human contact.	
Melee: +4
Shooting: +4
−Social
−Caring
-	Ex.png	Ex.png	Check.png	Check.png	Ex.png	Check.png	Check.png	Ex.png	-
Sickly Child
(Patient)	As a child, [PAWN_nameDef] suffered from a rare disease. Quarantined in a hospital, [PAWN_pronoun] had minimal human contact and got little physical exercise. In the sterile hospital environment, however, [PAWN_pronoun] became very familiar with science and medicine.	
Intellectual: +4
Medicine: +5
Melee: −2
Social: −2
Construction: −2
-

-	Ex.png	Check.png	Ex.png	Check.png	Ex.png	Check.png	Check.png	Ex.png	-
Frightened Child
(Scared)	[PAWN_nameDef] grew up with a laundry list of phobias and neuroses. [PAWN_pronoun] feared, among other things, doctors and foodborne pathogens.
As a result, [PAWN_pronoun] learned to cook and care for [PAWN_objective]self, but many of [PAWN_possessive] fears dog [PAWN_objective] in adulthood.	
Medicine: +3
Cooking: +3
−Violent
-	Ex.png	Check.png	Ex.png	Check.png	Ex.png	Check.png	Ex.png	Ex.png	-
Coma Child
(Coma Child)	A childhood accident put [PAWN_nameDef] into a coma. [PAWN_pronoun] didn’t wake up until [PAWN_pronoun] was in [PAWN_possessive] late teens. [PAWN_possessive] body never recovered from the years of inactivity, but people tend to take pity on [PAWN_objective] when they hear [PAWN_possessive] story.	
Social: +4
Construction: −2
Mining: −2
-

-	Ex.png	Check.png	Check.png	Check.png	Ex.png	Check.png	Check.png	Ex.png	Naked Thin south.pngNaked Thin south.png
Pyromaniac
(Pyro)	From an early age, [PAWN_nameDef] had an unhealthy fascination with fire. [PAWN_pronoun] would set refuse heaps ablaze and become so entranced by the flames [PAWN_pronoun] would absent-mindedly burn [PAWN_objective]self.
One day while playing with matches, [PAWN_pronoun] carelessly burned down [PAWN_possessive] home.	
Social: −3
Cooking: −2
Artistic: +3
−Firefighting
Pyromaniac	Ex.png	Check.png	Check.png	Check.png	Ex.png	Check.png	Check.png	Ex.png	-
Mute
(Mute)	[PAWN_nameDef] was greatly affected by a traumatic event early in [PAWN_possessive] life. For many years [PAWN_pronoun] refused to speak to people, preferring instead to play with [PAWN_possessive] household's numerous pets.	
Animals: +5
−Social
-	Ex.png	Check.png	Ex.png	Check.png	Ex.png	Check.png	Check.png	Ex.png	-
War Refugee
(Refugee)	War broke out in [PAWN_nameDef]'s home when [PAWN_pronoun] was a baby. [PAWN_possessive] parents fled with [PAWN_objective], seeking safety wherever they could find it. [PAWN_nameDef]'s earliest memories are of being taught how to defend [PAWN_objective]self.
The violence and destruction [PAWN_pronoun] witnessed left [PAWN_objective] scarred for life.	
Cooking: +2
Crafting: +2
−Violent
-	Ex.png	Check.png	Ex.png	Check.png	Ex.png	Check.png	Ex.png	Ex.png	-
Musical Kid
(Musician)	As a child, [PAWN_nameDef] had a talent for playing musical instruments and singing. [PAWN_pronoun] was given expert training and loved to perform in recitals and concerts, though the lavish praise [PAWN_pronoun] received made [PAWN_objective] a little self-obsessed.	
Social: −2
Artistic: +5
-

-	Ex.png	Check.png	Check.png	Check.png	Ex.png	Check.png	Check.png	Ex.png	-
Child Star
(Star)	[PAWN_nameDef] was well-known throughout [PAWN_possessive] homeworld as a child actor in films and TV shows. [PAWN_possessive] fame put [PAWN_objective] in contact with many different kinds of people, but also tended to get in the way of [PAWN_possessive] education.	
Social: +3
Artistic: +3
Intellectual: −2
−ManualDumb
-	Ex.png	Ex.png	Check.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	-
Child Spy
(Spy)	Children are presumed innocent, which makes them excellent spies. [PAWN_nameDef] was trained in the art of infiltration when [PAWN_pronoun] was just a small child.
[PAWN_possessive] years undercover gave [PAWN_objective] experience with social manipulation and lying, but [PAWN_pronoun] never had a normal education.	
Social: +4
Intellectual: −2
-

-	Ex.png	Check.png	Check.png	Check.png	Ex.png	Check.png	Check.png	Ex.png	-
Shop Kid
(Shopkid)	[PAWN_nameDef]'s mother was often ill, and it fell to [PAWN_objective] to run the store which was their only source of income. [PAWN_pronoun] learned a little about the exotic artifacts which [PAWN_pronoun] sold, and a lot about the art of the deal.	
Social: +4
Intellectual: +2
-

-	Ex.png	Check.png	Check.png	Check.png	Ex.png	Check.png	Check.png	Ex.png	-
Organ Farm
(Organ Farm)	[PAWN_nameDef] was raised in an illegal underground organ farm. [PAWN_possessive] body was used to grow organic implants for wounded mercenaries. Though [PAWN_possessive] upbringing has left [PAWN_objective] haunted, it has also given [PAWN_objective] a unique understanding of human biology.	
Medicine: +5
−Violent
-	Ex.png	Check.png	Ex.png	Check.png	Ex.png	Check.png	Ex.png	Ex.png	Naked Male south.pngNaked Female south.png
Medical Assistant
(Medic)	[PAWN_nameDef] was born during a catastrophic war in which both sides used incendiary weapons. [PAWN_pronoun] grew up helping [PAWN_possessive] parents in an infirmary, treating the cascade of horrific burns from the battlefields. [PAWN_pronoun] was left with a lifelong fear of fire.	
Medicine: +5
−Firefighting
−Pyromaniac	Ex.png	Check.png	Check.png	Check.png	Ex.png	Check.png	Check.png	Ex.png	-
Cult Child
(Cult Kid)	[PAWN_nameDef] was born into a powerful cult which shunned advanced technology and believed that all illness could be cured by cleansing the soul through sacred art.
After [PAWN_possessive] first glimpse of the outside world, [PAWN_pronoun] decided to run away.	
Medicine: −3
Artistic: +5
−Intellectual
-	Ex.png	Check.png	Check.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	-
Story Writer
(Writer)	As a child, [PAWN_nameDef] was addicted to reading. [PAWN_pronoun] would spend all day in [PAWN_possessive] local library with [PAWN_possessive] nose in a book. When budget cuts forced the library to close, [PAWN_nameDef] was distraught. [PAWN_pronoun] decided to fill the gap by writing [PAWN_possessive] own stories instead.	
Artistic: +4
Intellectual: +3
-

-	Ex.png	Check.png	Check.png	Check.png	Ex.png	Check.png	Check.png	Ex.png	-
Medieval Slave
(Slave)	[PAWN_nameDef] grew up pulling carts and digging holes on a medieval world. Simple manual labor is [PAWN_possessive] oldest companion - along with the master's lash.
[PAWN_pronoun] didn't learn to read until age nine.	
Plants: +2
Construction: +2
Mining: +2
Intellectual: −3
-	-	Ex.png	Ex.png	Check.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	-
Medieval Lordling/Lady
(Lordling/Lady)	[PAWN_nameDef] was a minor noble in an old kingdom on a medieval world. [PAWN_pronoun] grew up in a manor made of stone, served by bowing lowerclassmen.
Such a life teaches no technical skills and instils a lifelong aversion to manual labor - but [PAWN_nameDef] learned early the ways of social manipulation.	
Social: +4
Construction: −1
Mining: −1
Plants: −1
−ManualDumb
-	Ex.png	Ex.png	Ex.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	-
Convent Child
(Illicit)	The child of an illicit affair, [PAWN_nameDef] was bought up by nuns in a medieval convent. [PAWN_pronoun] learned the value of hard work and submission, but was taught that technology is heretical.	
Construction: +3
Plants: +3
−Intellectual
−Violent
-	Ex.png	Ex.png	Ex.png	Check.png	Ex.png	Ex.png	Ex.png	Ex.png	-
Country Lordling/Lady
(Field Lord/Lady)	[PAWN_nameDef] grew up in a noble family's manor in the outer country. [PAWN_possessive] early years were full of lessons in horseback riding, politics, and religion.
[PAWN_nameDef] and [PAWN_possessive] friends found many ways to break the rules and have fun in the fields and forests.	
Plants: +2
Animals: +3
Social: +1
-	-	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	-
Urban Lordling/Lady
(City Lord/Lady)	[PAWN_nameDef] was born to a royal house with a grand manor in a great city. [PAWN_pronoun] spent [PAWN_possessive] youth in lessons on politics.
Whenever [PAWN_pronoun] could, [PAWN_pronoun] would escape with [PAWN_possessive] friends to explore the half-built substructure of the metropolis.	
Construction: +3
Social: +2
-	-	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	-
Shipbound Lordling/Lady
(Ship Lord/Lady)	[PAWN_nameDef]'s family held their power base on a grand, ancient starship. Born and raised on the ship, [PAWN_nameDef] learned all about the rigors of shipboard life, and the politics and methods of interstellar battle and orbital invasion.
[PAWN_pronoun] learned to feel most at home with strong walls close on all sides and the gentle hiss of atmosphere regulators.	
Shooting: +2
Construction: +2
-	Undergrounder	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	-
Pampered Lordling/Princess
(Pampered)	[PAWN_nameDef]'s parents did not want another heir. Fearing a succession fight, they decided to neutralize [PAWN_objective] early.
They pampered [PAWN_nameDef] from birth, preventing [PAWN_objective] from developing the grit or knowledge necessary to be a threat to their favored son. [PAWN_nameDef] learned little more than how to manipulate the royal staff to get more food	
Social: +2
−ManualDumb
-	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	-
Unwanted Survivor
(Survivor)	[PAWN_nameDef]'s noble family did not want [PAWN_objective], but could not afford to be seen directly assassinating [PAWN_objective] either. They attempted to get [PAWN_objective] killed by assigning [PAWN_objective] dangerous training without proper protection at too young an age.
Against all odds, [PAWN_nameDef] survived the jousting contests, horsewar matches, riverrun competitions and warzones. In the end, it only made [PAWN_objective] stronger.	
Melee: +3
Shooting: +2
Cooking: +2
Medicine: +2
−ManualDumb
Tough, Iron-willed	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	Check.png	-
Ship Boy/Girl
(Ship Boy/Girl)	[PAWN_nameDef] was born to low-ranked servants on an ancient starship. The ship's machine persona was like a third parent to [PAWN_objective], and the parts crafting crew [PAWN_pronoun] worked for was like a second family.
[PAWN_nameDef] rarely saw plants or animals, and still finds them unnerving to touch.	
Crafting: +6
−Animals
−PlantWork
-	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	Ex.png	-
Military Cadet
(Cadet)	[PAWN_nameDef] was levied from [PAWN_possessive] family at a young age to become a soldier. [PAWN_pronoun] lived in barracks with other military kids, learning about duty, weapons, pain, and victory.
The trainers sometimes let the kids escape the base to enjoy the wider world. They wanted soldiers who can think independently.	
Shooting: +4
Melee: +3
−Animals
−PlantWork
-	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	Check.png	-
Political Captive
(Captive)	[PAWN_nameDef] was kidnapped by a rival family and held for ransom. To pass the time in captivity, [PAWN_pronoun] read books and practiced martial arts. [PAWN_nameDef] had few opportunities to develop [PAWN_possessive] social skills.	
Melee: +3
Intellectual: +3
−Social
-	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	Check.png	-
Delinquent
(Delinquent)	[PAWN_nameDef] spent most of [PAWN_possessive] childhood behind bars. Following an unsuccessful escape attempt, [PAWN_pronoun] was pressed into the military.	
Shooting: +1
Melee: +4
+Violent
−Animals
−PlantWork
-	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	Ex.png	-
Rich Kid
(Rich Kid)	[PAWN_nameDef] came from a wealthy and influential bloodline. [PAWN_possessive] expensive education included lessons on dueling, leadership, and military strategy.	
Melee: +2
Shooting: +2
Intellectual: +2
-

-	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	Check.png	-
Street Rat
(Street Rat)	[PAWN_nameDef] belonged to a gang of street thieves. [PAWN_possessive] days were spent picking pockets, settling disputes over territory, or high on whatever drugs [PAWN_pronoun] could get [PAWN_possessive] hands on.	
Melee: +5
Intellectual: −1
+Violent
Chemical interest	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	Check.png	Ex.png	-
Soldier's Kid
(Soldier Kid)	[PAWN_nameDef] was raised on the ancient starship where [PAWN_possessive] parents were stationed. [PAWN_pronoun] learned the basics of firearm operations and maintenance from the soldiers on board. [PAWN_nameDef] became accustomed to a strict routine and frequent discipline.	
Shooting: +4
Melee: +2
+Violent
−Animals
−PlantWork
Neurotic	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	Ex.png	-
Machinist
(Machinist)	[PAWN_nameDef] had a knack for machinery. [PAWN_pronoun] supplemented [PAWN_possessive] family's income by repairing and modifying black market weapons.	
Crafting: +3
Intellectual: +2
Shooting: +1
-

-	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	Check.png	Ex.png	-
Serving Boy/Girl
(House Boy/Girl)	[PAWN_nameDef] was the child of house servants, and was trained to carry on the family duty.
[PAWN_pronoun] carried things and polished silverware, but was never allowed into the lords' part of the house.	
Cooking: +2
Construction: +1
-

-	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	Check.png	Ex.png	-
Royal Bastard
(Bastard)	[PAWN_nameDef] the child of a lord and a prostitute.
[PAWN_possessive] father's line was secure and his holdings strong. Nobody ever came to [PAWN_nameDef] to endorse a bid for the title. [PAWN_pronoun] earned [PAWN_possessive] bread cleaning the brothel, but always felt [PAWN_pronoun] deserved much more.	
Social: +2
Artistic: +2
-

Greedy	Ex.png	Ex.png	Ex.png	Ex.png	Ex.png	Check.png	Check.png	Check.png	-
War Bastard
(Bastard)	[PAWN_nameDef] was born nine months after [PAWN_possessive] mother's town was conquered by enemy soldiers. The child of violence with no acknowledged father, [PAWN_nameDef] grew up at the bottom of the social pyramid.
[PAWN_possessive] mother instilled her bitterness towards men and war into [PAWN_nameDef]. [PAWN_possessive] pet rabbit offered more warmth than any human in [PAWN_possessive] life.	
Animals: +3
−Violent
Misandrist