
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type Language = 'ko' | 'en';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Simple dictionary for UI strings
const translations: Record<Language, Record<string, string>> = {
    ko: {
        'app_title': '변방계 정착민 테스트',
        'start_test': '테스트 시작하기',
        'landing_subtitle': '"당신이 30일간의 불시착 후 살아남을 확률은 몇 퍼센트입니까?"\n변방계 세계관 기반 성격 유형 및 적성 검사',
        'landing_traits_title': '✦ 특성 (Traits)',
        'landing_traits_desc': '낙천적, 유리정신, 식인종...\n당신의 고유한 성격은 정착지의 운명을 결정합니다.',
        'landing_skills_title': '⚔ 기술 (Skills)',
        'landing_skills_desc': '사격, 의학, 조리...\n어떤 분야에서 전설적인 능력을 발휘할 수 있나요?',
        'subtitle': '림월드 생존 시뮬레이션: 당신의 특성과 능력치는?',
        'loading': '신경 시뮬레이션 로딩 중...',
        'phase_trait': '1단계: 성격 유형 분석',
        'phase_skill': '2단계: 기술 능력 평가',
        'result_title': '캐릭터 생성 결과',
        'phase_complete': '분석 완료',
        'phase_initial': '초기 유전자 분석',
        'name': '이름',
        'gender': '성별',
        'age': '나이',
        'male': '남성',
        'female': '여성',
        'childhood': '유년기',
        'adulthood': '성년기',
        'incapable': '결격 사항',
        'none': '없음',
        'traits': '특성',
        'skills': '기술',
        'unlock_skills': '▶ 스킬 정밀 검사 시작',
        'unlock_desc': '(추가 설문 진행)',
        'unlock_info': '당신의 선택에 따라 사격, 격투, 조리 등 구체적인 기술 능력치와 열정이 결정됩니다.',
        'analysis_complete': '★ 정착민 분석 완료 ★',
        'back_home': '< 처음으로',
        'save_image': '이미지 저장',
        'trait_click_hint': '* 클릭하여 상세 확인',
        'trait_select_hint': '특성을 선택하면\n상세 정보가 표시됩니다.',
        'mbti_flavor': '"변방계에서 당신의 생존 방식입니다."',
        'skill_incapable': '결격 (INCAPABLE)',
        'loading_gene': '유전자 분석 중...',
        'no_traits': '특이 사항 없음',
        'unknown': '알 수 없음',
        'shooting': '사격',
        'melee': '격투',
        'construction': '건설',
        'mining': '채굴',
        'cooking': '조리',
        'plants': '원예',
        'animals': '조련',
        'crafting': '제작',
        'artistic': '예술',
        'medicine': '의학',
        'social': '사교',
        'intellectual': '연구',
        'progress': '진행률',
        'part1_title': 'PART 1: 성향 분석',
        'part1_desc': '당신의 깊은 무의식 속에 잠재되어 있는 고유한 성향과 기질을 분석합니다.',
        'part2_title': 'PART 2: 배경 탐색',
        'part2_desc': '당신이 변방계에 오기 전 어떤 삶을 살았는지, 과거의 배경을 추적합니다.',
        'part3_title': 'PART 3: 기술 정밀 검사',
        'part3_desc': '정착지 생존에 필요한 실무 기술과 각 분야에 대한 열정을 최종적으로 평가합니다.',
        'estimated_time': '예상 소요 시간: 약 10~15분',
        'questions_count': '총 60문항 (통합 분석)'
    },
    en: {
        'app_title': 'Rimworld Colonist Test',
        'start_test': 'Start Test',
        'part1_title': 'PART 1: Personality Analysis',
        'part1_desc': 'Analyzing the unique tendencies and temperaments latent in your deep subconscious.',
        'part2_title': 'PART 2: Background Check',
        'part2_desc': 'Tracking your past background and the life you lived before arriving at the Rim.',
        'part3_title': 'PART 3: Skill Assessment',
        'part3_desc': 'Final evaluation of practical survival skills and passions for each field.',
        'estimated_time': 'Estimated Time: ~12 min',
        'questions_count': 'Total 60 Questions (Unified)',
        'landing_subtitle': '"What is your survival rate after 30 days of crash landing?"\nPersonality and aptitude test based on Rimworld universe',
        'landing_traits_title': '✦ Traits',
        'landing_traits_desc': 'Sanguine, Volatile, Cannibal...\nYour unique traits decide the colony\'s fate.',
        'landing_skills_title': '⚔ Skills',
        'landing_skills_desc': 'Shooting, Medicine, Cooking...\nIn which field can you display legendary abilities?',
        'subtitle': 'Rimworld Survival Simulation: What are your traits and skills?',
        'loading': 'Loading Neuro-simulation...',
        'phase_trait': 'Phase 1: Trait Analysis',
        'phase_skill': 'Phase 2: Skill Assessment',
        'result_title': 'Character Generation Result',
        'phase_complete': 'Analysis Complete',
        'phase_initial': 'Initial Gene Analysis',
        'name': 'Name',
        'gender': 'Gender',
        'age': 'Age',
        'male': 'Male',
        'female': 'Female',
        'childhood': 'Childhood',
        'adulthood': 'Adulthood',
        'incapable': 'Incapable',
        'none': 'None',
        'traits': 'Traits',
        'skills': 'Skills',
        'unlock_skills': '▶ Start Precision Skill Test',
        'unlock_desc': '(Additional Questions)',
        'unlock_info': 'Determines specific skill levels and passions like Shooting, Melee, Cooking based on your choices.',
        'analysis_complete': '★ Colonist Analysis Complete ★',
        'back_home': '< Back to Home',
        'save_image': 'Save Image',
        'trait_click_hint': '* Click to see details',
        'trait_select_hint': 'Select a trait to\nview details.',
        'mbti_flavor': '"Your survival style in the Rimworld."',
        'skill_incapable': 'INCAPABLE',
        'loading_gene': 'Analyzing Genes...',
        'no_traits': 'No Traits',
        'unknown': 'Unknown',
        'shooting': 'Shooting',
        'melee': 'Melee',
        'construction': 'Construction',
        'mining': 'Mining',
        'cooking': 'Cooking',
        'plants': 'Plants',
        'animals': 'Animals',
        'crafting': 'Crafting',
        'artistic': 'Artistic',
        'medicine': 'Medicine',
        'social': 'Social',
        'intellectual': 'Intellectual',
        'progress': 'Progress'
    }
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [language, setLanguage] = useState<Language>('ko');

    const t = (key: string) => {
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
