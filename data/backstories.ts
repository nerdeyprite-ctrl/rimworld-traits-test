
import { Backstory } from '../types/rimworld';

export interface BackstoryDef extends Backstory {
    skillBonuses: Record<string, number>;
    title_ko?: string;
    description_ko?: string;
}

export const BACKSTORIES: BackstoryDef[] = [
    // Childhood
    {
        id: 'apocalypse_survivor',
        title: 'Apocalypse Survivor',
        title_ko: '세기말 생존자',
        type: 'childhood',
        description: 'You survived a planetary catastrophe as a child, learning to scavenge and hide.',
        description_ko: '어린 시절 행성의 대재앙에서 살아남으며, 폐허 속에서 물자를 찾고 숨는 법을 배웠습니다.',
        skillBonuses: { 'Survival': 4, 'Stealth': 2, 'Social': -1 }
    },
    {
        id: 'cave_child',
        title: 'Cave Child',
        title_ko: '동굴 아이',
        type: 'childhood',
        description: 'Raised in deep tunnels, you are comfortable in the dark and tight spaces.',
        description_ko: '깊은 땅속 터널에서 자라나 어둠과 좁은 공간에 익숙합니다.',
        skillBonuses: { 'Mining': 4, 'Melee': 2 }
    },
    {
        id: 'urbworld_urchin',
        title: 'Urbworld Urchin',
        title_ko: '도시계 부랑아',
        type: 'childhood',
        description: 'You grew up on the streets of a massive city, begging and stealing to survive.',
        description_ko: '거대 도시의 뒷골목에서 자라며, 생존을 위해 구걸하고 훔치는 기술을 익혔습니다.',
        skillBonuses: { 'Social': 2, 'Melee': 2, 'Intellectual': 1 }
    },
    {
        id: 'privileged_prodigy',
        title: 'Privileged Prodigy',
        title_ko: '금수저 영재',
        type: 'childhood',
        description: 'You were given the best education money could buy, but lacked real world experience.',
        description_ko: '돈으로 살 수 있는 최고의 교육을 받았지만, 현실 세계에서의 경험은 부족합니다.',
        skillBonuses: { 'Intellectual': 4, 'Artistic': 3, 'Social': 1, 'Construction': -2 }
    },

    // Adulthood
    {
        id: 'planetary_gladiator',
        title: 'Planetary Gladiator',
        title_ko: '행성 검투사',
        type: 'adulthood',
        description: 'You fought in arenas for the entertainment of others.',
        description_ko: '타인의 유희를 위해 투기장에서 목숨을 걸고 싸웠습니다.',
        skillBonuses: { 'Melee': 6, 'Shooting': 2, 'Social': 1 }
    },
    {
        id: 'starship_captain',
        title: 'Starship Captain',
        title_ko: '우주선 선장',
        type: 'adulthood',
        description: 'You commanded a starship, making tough decisions and leading a crew.',
        description_ko: '우주선을 지휘하며 승무원들을 이끌고 어려운 결정을 내리는 역할을 수행했습니다.',
        skillBonuses: { 'Intellectual': 4, 'Social': 4, 'Shooting': 1 }
    },
    {
        id: 'medieval_lord',
        title: 'Medieval Lord',
        title_ko: '중세 영주',
        type: 'adulthood',
        description: 'You ruled over a small fiefdom on a feudal world.',
        description_ko: '봉건 행성에서 작은 영지를 다스리며 권력을 행사했습니다.',
        skillBonuses: { 'Social': 5, 'Melee': 3 }
    },
    {
        id: 'midworld_chef',
        title: 'Midworld Chef',
        title_ko: '중계 셰프',
        type: 'adulthood',
        description: 'You ran a kitchen in a decent restaurant on a civilized world.',
        description_ko: '문명화된 행성의 괜찮은 식당에서 주방을 책임졌습니다.',
        skillBonuses: { 'Cooking': 6, 'Plants': 2 }
    }
];
