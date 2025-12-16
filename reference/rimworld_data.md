# RimWorld Data Constants (Source of Truth)
이 파일에 정의되지 않은 특성(Trait)이나 기술(Skill)은 절대 코드에 사용하지 말 것.

## 1. Skills (기술)
기술 레벨은 0에서 20까지이며, 열정(Passion)은 'None', 'Minor(불꽃1)', 'Major(불꽃2)'로 나뉨.
또한 결격도 존재하는데, 특정 분야의 결격을 가지고 있으면 아예 관련 행동을 할 수 없고, 훈련의 여지도 없다.

- Shooting (사격)
- Melee (격투)
- Construction (건설)
- Mining (채굴)
- Cooking (조리)
- Growing (원예)
- Animal (조련)
- Crafting (제작)
- Artistic (예술)
- Medicine (의학)
- Social (사교)
- Intellectual (연구)

0부터 20까지 기술 숙련도에 대한 명칭은 다음과 같다. (괄호 안은 예시이다)
0: 하나도 모름(0이라도 결격 사항만 아니라면 훈련의 여지가 있다.)
1: 완전 초보자
2: 초보자 (단궁 제작가능)
3: 기초적 (가시 함정 제작가능)
4: 기본적
5: 경험자 (딸기 재배가능)
6: 숙련자 (좋은 식사 조리가능)
7: 초급 종사자 (홉 재배가능)
8: 중급 종사자 (약뿌리 재배가능, 바닐라에 존재하는 모든 식사 조리가능, 채굴할 때 나오는 광물이 100%가 됨)
9: 전문가
10: 숙련 전문가 (악마가닥 재배가능)
11: 고급 전문가
12: 최고 전문가
13: 특급 전문가
14: 장인
15: 지역구 장인
16: 지역구 선구자
17: 행성 장인
18: 행성 선구자
19: 인간 문화재
20: 전설

2. Traits (특성) - 리스트
Rule:

정착민 생성 시, [Group] 내에서는 오직 하나의 특성만 가질 수 있음 (예: '못생김'이면서 동시에 '아름다움'일 수 없음).

**[Conflict]**에 명시된 특성은 함께 가질 수 없음.

효과(Effect)는 로직 구현 시 참조할 가중치임.

2.1. Spectrum Groups (상반 관계 그룹)
이 그룹 내의 특성들은 서로 양립할 수 없으며, 점수(Score)에 따라 결정됨.

[Group: Mood (기분)]

우울증 (Depressive): 항시 무드 -12

부정적 (Pessimist): 항시 무드 -6

(None/Normal)

긍정적 (Optimist): 항시 무드 +6

낙천적 (Sanguine): 항시 무드 +12

[Group: Nerves (신경/정신붕괴)]

유리정신 (Volatile): 정신붕괴 한계점 +15% (매우 쉽게 미침)

신경과민 (Nervous): 정신붕괴 한계점 +8%

(None/Normal)

확고한 의지 (Steadfast): 정신붕괴 한계점 -9%

철의 의지 (Iron-willed): 정신붕괴 한계점 -18% (잘 미치지 않음), [Conflict: 괴짜 천재]

[Group: Speed (이동 속도)]

느림보 (Slowpoke): 이동속도 -0.2 c/s

(None/Normal)

가벼운 발 (Fast walker): 이동속도 +0.2 c/s

신속 (Jogger): 이동속도 +0.4 c/s

[Group: Industriousness (작업 속도)]

나태 (Slothful): 작업 속도 -35%

게으름 (Lazy): 작업 속도 -20%

(None/Normal)

근면성실 (Hard Worker): 작업 속도 +20%

일벌레 (Industrious): 작업 속도 +35%

[Group: Appearance (외모/매력)]

충격적인 외모 (Staggeringly Ugly): 매력 -2 (관계도 최악)

못생김 (Ugly): 매력 -1

(None/Normal)

잘생김 (Pretty): 매력 +1

아름다움 (Beautiful): 매력 +2

[Group: Psychic Sensitivity (정신 감응력)]

정신적 무감각 (Psychically Deaf): 감응력 -100% (면역)

둔감한 정신 (Psychically dull): 감응력 -50%

(None/Normal)

민감한 정신 (Psychically sensitive): 감응력 +40%

정신적 초감각 (Psychically Hypersensitive): 감응력 +80%

[Group: Learning (학습 속도)]

느린 학습가 (Slow Learner): 경험치 습득 -75%

(None/Normal)

빠른 학습가 (Fast Learner): 경험치 습득 +75%

[Group: Drug Interest (약물 선호도)]

금주 (Teetotaler): 약물 혐오. 복용 시 무드 하락.

약물 선호 (Chemical Interest): 약물 갈망 발생, 무드 보너스/페널티 존재.

약물광 (Chemical Fascination): 약물 갈망 빈도 높음 (통제 어려움).

2.2. Standalone Traits (개별 특성)
점수 조건이 충족되면 부여됨. 단, Conflict 항목 확인 필수.

[Combat & Physical (전투/신체)]

강인함 (Tough): 받는 피해량 -50% (매우 강력). [Conflict: 연약함]

연약함 (Delicate): 받는 피해량 +15%. [Conflict: 강인함]

싸움꾼 (Brawler): 격투 +4, 사격 -4, 원거리 무기 착용 시 무드 하락. [Conflict: 신중한 사수, 난사광, 엄살쟁이]

신중한 사수 (Careful shooter): 명중률 +5, 조준 시간 길어짐. [Conflict: 난사광, 싸움꾼]

난사광 (Trigger-happy): 조준 시간 -50%, 명중률 -5. [Conflict: 신중한 사수, 싸움꾼]

재빠름 (Nimble): 근접 회피율 +15.

엄살쟁이 (Wimp): 고통 한계 -50% (쉽게 기절). [Conflict: 강인함, 싸움꾼, 피학적]

피학적 (Masochist): 고통을 느낄 때 무드 상승. [Conflict: 엄살쟁이]

[Mental & Lifestyle (정신/생활)]

방화광 (Pyromaniac): 스트레스 시 방화 충동. 소방 작업 불가.

식탐 (Gourmand): 요리 +4, 굶주림 빨리 짐. 스트레스 시 폭식. [Conflict: 검소]

검소 (Ascetic): 좁고 나쁜 침실 선호, 생식 페널티 없음. [Conflict: 탐욕, 시샘, 식탐]

탐욕 (Greedy): 좋은 침실 원함 (없으면 무드 하락). [Conflict: 검소]

시샘 (Jealous): 남보다 좋은 침실 원함 (없으면 무드 하락). [Conflict: 검소]

야행성 (Night Owl): 밤(23~6시) 활동 선호, 낮 활동 시 무드 하락.

실내 선호 (Undergrounder): 실내 욕구 있음, 갇혀 있어도 답답해하지 않음.

나체주의자 (Nudist): 알몸일 때 무드 상승, 옷 입으면 하락.

신체 개조주의자 (Body Modder): 인공 신체 이식 원함. [Conflict: 신체 순수주의자]

신체 순수주의자 (Body Purist): 인공 신체 이식 혐오. [Conflict: 신체 개조주의자]

숙면가 (Quick Sleeper): 수면 효율 +50% (잠을 적게 잠).

괴짜 천재 (Too smart): 학습 속도 +75%, 정신붕괴 한계점 +14% (잘 배우지만 예민함). [Conflict: 철의 의지]

대단한 기억력 (Great Memory): 기술 레벨 하락 속도 절반.

괴로운 예술가 (Tortured Artist): 항시 무드 -8, 정신붕괴 후 예술 영감 획득.

[Social & Relations (사회성)]

직설적 (Abrasive): 모욕 확률 높음. [Conflict: 다정다감]

다정다감 (Kind): 절대 모욕하지 않음, 타인 위로. [Conflict: 직설적, 사이코패스]

거슬리는 목소리 (Annoying Voice): 타인으로부터 관계도 하락 -25.

거친 숨소리 (Creepy Breathing): 타인으로부터 관계도 하락 -25.

남성 혐오 (Misandrist): 남성 대상 관계도 -25.

여성 혐오 (Misogynist): 여성 대상 관계도 -25.

은둔자 (Recluse): 사람이 적으면 무드 상승, 많으면 하락.

[Special / Dark (특수)]

식인종 (Cannibal): 인육 섭취/도축 시 무드 상승.

피의 갈망 (Bloodlust): 살해/시체 관찰 시 무드 상승, 인피 의류 선호. 싸움 잦음.

사이코패스 (Psychopath): 타인의 고통/도축/사망에 무드 변화 없음. 사교 활동 효과 없음. [Conflict: 다정다감]

병약체질 (Sickly): 주기적으로 질병 발생, 의학 +4.

면역체질 (Super Immune): 항체 생성 속도 +30%.

[Sexual Orientation (성적 지향)]

(Default/Heterosexual)

동성애 (Gay): 동성에게 끌림.

양성애 (Bisexual): 남녀 모두에게 끌림.

무성애 (Asexual): 누구에게도 끌리지 않음.

## 3. Work Types (작업 종류)
이 목록은 정착민이 수행할 수 있는 모든 작업을 정의한다. 결격 사항(Incapability) 매핑에 사용됨.

- Basic (기본 노동) - 운반, 청소
- Firefighting (소방 활동)
- Patient (환자) - 스스로 치료, 붕대 감기
- Doctor (의사) - 타인 치료
- Bed Rest (침상 안정)
- Warden (간수) - 포로 관리
- Handling (조련) - 동물 조련 및 훈련
- Cooking (조리)
- Hunting (사냥)
- Construction (건설)
- Growing (재배)
- Mining (채굴)
- Plant Cutting (벌목)
- Crafting (제작)
- Artistic (예술)
- Research (연구)

