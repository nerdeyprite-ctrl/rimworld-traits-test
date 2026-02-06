"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Answer, Trait, TestResult, Passion, Question, Backstory } from '../types/rimworld';
import questionsKo from '../data/questions_ko.json';
import questionsEn from '../data/questions_en.json';
import traitsKo from '../data/traits_ko.json';
import traitsEn from '../data/traits_en.json';
import backstoriesKo from '../data/backstories_ko.json';
import backstoriesEn from '../data/backstories_en.json';
import { useLanguage } from './LanguageContext';

// Rimworld Skills
const R_SKILLS = [
    'Shooting', 'Melee', 'Construction', 'Mining', 'Cooking',
    'Plants', 'Animals', 'Crafting', 'Artistic', 'Medicine',
    'Social', 'Intellectual'
];

export interface UserInfo {
    name: string;
    age: number;
    gender: 'Male' | 'Female';
}


export type TestPhase = 'trait' | 'skill';

interface TestContextType {
    userInfo: UserInfo;
    setUserInfo: (info: UserInfo) => void;
    currentQuestionIndex: number;
    answers: Record<number, Answer>; // questionId -> Answer
    scores: Record<string, number>; // traitId OR skillId -> score
    handleAnswer: (questionId: number, answer: Answer) => void;
    calculateFinalTraits: () => TestResult | null;
    resetTest: () => void;
    shuffledQuestions: Question[];
    startSkillTest: () => void;
    testPhase: TestPhase;
}

const TestContext = createContext<TestContextType | undefined>(undefined);

export const TestProvider = ({ children }: { children: ReactNode }) => {
    const { language } = useLanguage();
    const [userInfo, setUserInfo] = useState<UserInfo>({ name: '정착민', age: 20, gender: 'Male' });
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, Answer>>({});
    const [scores, setScores] = useState<Record<string, number>>({}); // Stores both trait scores and skill scores
    const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
    const [testPhase, setTestPhase] = useState<TestPhase>('trait');

    // Helper to shuffle array
    const shuffleArray = (array: any[]) => {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    };

    const QUESTIONS_PER_TRAIT_TEST = 40;
    const QUESTIONS_PER_SKILL_TEST = 15;

    const initializeTest = React.useCallback((phase: TestPhase = 'trait') => {
        try {
            const currentQuestionsData = language === 'ko' ? questionsKo : questionsEn;
            const allQuestions = currentQuestionsData as unknown as Question[];
            let finalQ: Question[] = [];

            if (phase === 'trait') {
                const part1Questions = allQuestions.filter(q => q.id < 200);
                const groups: Record<string, Question[]> = {};
                part1Questions.forEach(q => {
                    const key = q.groupId || `unique_${q.id}`;
                    if (!groups[key]) groups[key] = [];
                    groups[key].push(q);
                });

                const groupKeys = shuffleArray(Object.keys(groups));
                const selectedKeys = groupKeys.slice(0, 40);
                const selectedPart1 = selectedKeys.map(key => {
                    const variants = groups[key];
                    return variants[Math.floor(Math.random() * variants.length)];
                });

                const part2Groups = ['p2_origin', 'p2_childhood', 'p2_adulthood', 'p2_event', 'p2_goal'];
                const part2QuestionsFull = allQuestions.filter(q => q.id >= 200 && q.id < 1000);
                const selectedPart2 = part2Groups.map(groupKey => {
                    const variants = part2QuestionsFull.filter(q => q.groupId === groupKey);
                    return variants[Math.floor(Math.random() * variants.length)];
                }).filter(q => q !== undefined);

                const combinedQuestions = [...shuffleArray(selectedPart1), ...selectedPart2];
                finalQ = combinedQuestions.map((q: Question) => ({
                    ...q,
                    answers: shuffleArray(q.answers)
                }));
            } else {
                const skillQuestions = allQuestions.filter(q => q.id >= 1000);
                const shuffledSkills = shuffleArray(skillQuestions).slice(0, 15);
                finalQ = shuffledSkills.map((q: Question) => ({
                    ...q,
                    answers: shuffleArray(q.answers)
                }));
            }

            setShuffledQuestions(finalQ);
            setCurrentQuestionIndex(0);
            setTestPhase(phase);
            if (phase === 'trait') {
                setAnswers({});
                setScores({});
            }
        } catch (error) {
            console.error("Failed to load questions:", error);
        }
    }, [language]);

    // Initialize on mount or language change (Resetting on language change might be too aggressive, 
    // but for now let's just ensure we have questions loaded. 
    // Actually, if we switch language, we want to keep progress but translate the questions.)

    // Initial Load
    useEffect(() => {
        if (shuffledQuestions.length === 0) {
            initializeTest('trait');
        }
    }, []);

    // Effect to update questions when language changes
    useEffect(() => {
        if (shuffledQuestions.length > 0) {
            const currentQuestionsData = language === 'ko' ? questionsKo : questionsEn;
            const sourceQuestions = currentQuestionsData as unknown as Question[];

            setShuffledQuestions(prev => {
                return prev.map(q => {
                    const newQ = sourceQuestions.find(sq => sq.id === q.id);
                    // If we found the translated question, use its text/answers text but keep the shuffled answer order if possible?
                    // Re-shuffling answers might be confusing if user is staring at them.
                    // But our answers structure doesn't store IDs... just text. 
                    // So we probably have to just replace the whole question object. 
                    // To imply "same answer order", we'd need answer IDs. 
                    // Since we don't have answer IDs, maybe we just leave it for now or accept a re-shuffle of text if we reload.
                    // Simple approach: Just replace with new content found by ID. 
                    // Note: This replaces 'answers' array too, which means order might reset to default if we just take `newQ`.
                    // But `initializeTest` shuffled them. 
                    // Let's just re-initialize if language changes? that's easiest.
                    // User request: "Korean, English switchable".
                    // If I'm on question 5, and I switch to English, I want to be on question 5 in English.

                    if (newQ) {
                        // Attempt to match answers by index? No, answers were shuffled.
                        // This is tricky without answer IDs.
                        // Let's just return newQ and let it be. The user might see answers shuffle. Acceptable for MVP.
                        return newQ;
                    }
                    return q;
                });
            });
        }
    }, [language]);

    const resetTest = React.useCallback(() => {
        setUserInfo({ name: '정착민', age: 20, gender: 'Male' });
        initializeTest('trait');
    }, [initializeTest]);

    const startSkillTest = React.useCallback(() => {
        initializeTest('skill');
    }, [initializeTest]);

    // --- SPECTRUM LOGIC CONFIGURATION ---
    const SPECTRUM_CONFIG: Record<string, { id: string, threshold: number, type: 'min' | 'max' }[]> = {
        'mood_spectrum': [ // Sanguine > Optimist > (0) > Pessimist > Depressive
            { id: 'sanguine', threshold: 6, type: 'min' },
            { id: 'optimist', threshold: 3, type: 'min' },
            { id: 'pessimist', threshold: -3, type: 'max' },
            { id: 'depressive', threshold: -6, type: 'max' }
        ],
        'work_spectrum': [ // Industrious > Hard Worker > (0) > Lazy > Slothful
            { id: 'industrious', threshold: 6, type: 'min' },
            { id: 'hard_worker', threshold: 3, type: 'min' },
            { id: 'lazy', threshold: -3, type: 'max' },
            { id: 'slothful', threshold: -6, type: 'max' }
        ],
        'nerve_spectrum': [ // Iron-willed > Steadfast > (0) > Nervous > Volatile
            { id: 'iron_willed', threshold: 6, type: 'min' },
            { id: 'steadfast', threshold: 3, type: 'min' },
            { id: 'nervous', threshold: -3, type: 'max' },
            { id: 'volatile', threshold: -6, type: 'max' }
        ],
        'beauty_spectrum': [ // Beautiful > Pretty > (0) > Ugly > Staggeringly Ugly
            { id: 'beautiful', threshold: 6, type: 'min' },
            { id: 'pretty', threshold: 3, type: 'min' },
            { id: 'ugly', threshold: -3, type: 'max' },
            { id: 'staggeringly_ugly', threshold: -6, type: 'max' }
        ],
        'speed_spectrum': [ // Jogger > Fast Walker > (0) > Slowpoke
            { id: 'jogger', threshold: 6, type: 'min' },
            { id: 'fast_walker', threshold: 3, type: 'min' },
            { id: 'slowpoke', threshold: -3, type: 'max' }
        ]
    };

    const TRAIT_TO_SPECTRUM: Record<string, { id: string, value: number }> = {
        // Mood
        'sanguine': { id: 'mood_spectrum', value: 2 },
        'optimist': { id: 'mood_spectrum', value: 1 },
        'pessimist': { id: 'mood_spectrum', value: -1 },
        'depressive': { id: 'mood_spectrum', value: -2 },
        // Work
        'industrious': { id: 'work_spectrum', value: 2 },
        'hard_worker': { id: 'work_spectrum', value: 1 },
        'lazy': { id: 'work_spectrum', value: -1 },
        'slothful': { id: 'work_spectrum', value: -2 },
        // Nerves
        'iron_willed': { id: 'nerve_spectrum', value: 2 },
        'steadfast': { id: 'nerve_spectrum', value: 1 },
        'nervous': { id: 'nerve_spectrum', value: -1 },
        'volatile': { id: 'nerve_spectrum', value: -2 },
        // Beauty
        'beautiful': { id: 'beauty_spectrum', value: 2 },
        'pretty': { id: 'beauty_spectrum', value: 1 },
        'ugly': { id: 'beauty_spectrum', value: -1 },
        'staggeringly_ugly': { id: 'beauty_spectrum', value: -2 },
        // Speed
        'jogger': { id: 'speed_spectrum', value: 2 },
        'fast_walker': { id: 'speed_spectrum', value: 1 },
        'slowpoke': { id: 'speed_spectrum', value: -1 }
    };

    const handleAnswer = React.useCallback((questionId: number, answer: Answer) => {
        const answerWithPart: Answer = {
            ...answer,
            part: testPhase === 'trait' ? (questionId < 200 ? 1 : 2) : 3
        };
        setAnswers(prev => ({ ...prev, [questionId]: answerWithPart }));

        setScores(prev => {
            const newScores = { ...prev };
            Object.entries(answer.scores).forEach(([key, value]) => {
                const numericVal = Number(value);
                const isSkillKey = R_SKILLS.includes(key) || key.startsWith('inc_');
                if (testPhase === 'skill' && !isSkillKey) return;

                newScores[key] = (newScores[key] || 0) + numericVal;
                if (testPhase === 'trait' && TRAIT_TO_SPECTRUM[key]) {
                    const { id: spectrumId, value: weight } = TRAIT_TO_SPECTRUM[key];
                    newScores[spectrumId] = (newScores[spectrumId] || 0) + (numericVal * weight);
                }
            });
            return newScores;
        });

        setCurrentQuestionIndex(prev => prev + 1);
    }, [testPhase]);

    const calculateFinalTraits = React.useCallback((): TestResult | null => {
        const traitsData = language === 'ko' ? traitsKo : traitsEn;
        const traitDefinitions = traitsData as Trait[];
        const traitAnswers = Object.values(answers).filter(a => a.part === 1 || a.part === 2);

        const traitScores: Record<string, number> = {};
        const backstoryPreferences: Record<string, number> = {};
        const p1p2SkillScores: Record<string, number> = {};

        traitAnswers.forEach(answer => {
            if (answer.scores) {
                Object.entries(answer.scores).forEach(([id, score]) => {
                    if (id === 'backstory_preference') {
                        const pref = score as string;
                        backstoryPreferences[pref] = (backstoryPreferences[pref] || 0) + 1;
                    } else if (R_SKILLS.includes(id)) {
                        p1p2SkillScores[id] = (p1p2SkillScores[id] || 0) + (score as number);
                    } else {
                        const numericScore = score as number;
                        traitScores[id] = (traitScores[id] || 0) + numericScore;
                        if (TRAIT_TO_SPECTRUM[id]) {
                            const { id: spectrumId, value: weight } = TRAIT_TO_SPECTRUM[id];
                            traitScores[spectrumId] = (traitScores[spectrumId] || 0) + (numericScore * weight);
                        }
                    }
                });
            }
        });

        const selectTraits = (scores: Record<string, number>): Trait[] => {
            const getTraitDef = (id: string) => traitDefinitions.find(t => t.id === id);
            const STRONG_TRAITS: Record<string, number> = {
                'gay': 1, 'bisexual': 1, 'asexual': 1,
                'cannibal': 3, 'nudist': 3, 'pyromaniac': 3, 'psychopath': 4
            };
            const processedTraitIds = new Set<string>();
            const guaranteedTraits: Trait[] = [];
            const candidates: { trait: Trait, score: number }[] = [];

            Object.entries(STRONG_TRAITS).forEach(([traitId, threshold]) => {
                const rawScore = scores[traitId] || 0;
                if (rawScore >= threshold) {
                    const def = getTraitDef(traitId);
                    if (def) {
                        guaranteedTraits.push(def);
                        processedTraitIds.add(traitId);
                    }
                }
            });

            Object.entries(SPECTRUM_CONFIG).forEach(([spectrumId, config]) => {
                const rawScore = scores[spectrumId] || 0;
                let selectedTraitId: string | null = null;
                if (rawScore >= 6) selectedTraitId = config.find(c => c.threshold === 6)?.id || null;
                else if (rawScore >= 3) selectedTraitId = config.find(c => c.threshold === 3)?.id || null;
                else if (rawScore <= -6) selectedTraitId = config.find(c => c.threshold === -6)?.id || null;
                else if (rawScore <= -3) selectedTraitId = config.find(c => c.threshold === -3)?.id || null;

                if (selectedTraitId && !processedTraitIds.has(selectedTraitId)) {
                    const def = getTraitDef(selectedTraitId);
                    if (def) candidates.push({ trait: def, score: Math.abs(rawScore) });
                }
                config.forEach(c => processedTraitIds.add(c.id));
            });

            const NORMAL_THRESHOLD = 5;
            const groupScores: Record<string, { trait: Trait, score: number }[]> = {};
            const standalones: { trait: Trait, score: number }[] = [];

            Object.keys(scores).forEach(id => {
                if (processedTraitIds.has(id)) return;
                if (id.includes('_spectrum')) return;
                const rawScore = scores[id] || 0;
                if (rawScore < NORMAL_THRESHOLD) return;
                const def = getTraitDef(id);
                if (!def) return;
                if (def.group) {
                    if (!groupScores[def.group]) groupScores[def.group] = [];
                    groupScores[def.group].push({ trait: def, score: rawScore });
                } else {
                    standalones.push({ trait: def, score: rawScore });
                }
            });

            Object.values(groupScores).forEach(items => {
                items.sort((a, b) => b.score - a.score);
                candidates.push(items[0]);
            });
            standalones.forEach(item => candidates.push(item));

            const selectedIds = new Set<string>(guaranteedTraits.map(t => t.id));
            const validCandidates = candidates.filter(cand => {
                const conflicts = cand.trait.conflicts || [];
                return !conflicts.some(c => selectedIds.has(c));
            });

            const strongTraitCount = guaranteedTraits.length;
            let maxTotal = strongTraitCount === 0 ? 4 : strongTraitCount === 1 ? 5 : 6;
            const remainingSlots = Math.max(0, maxTotal - strongTraitCount);
            let finalRegular: Trait[] = [];

            if (validCandidates.length <= remainingSlots) {
                finalRegular = validCandidates.map(c => c.trait);
            } else {
                const remaining = [...validCandidates];
                for (let i = 0; i < remainingSlots && remaining.length > 0; i++) {
                    const currentTotal = remaining.reduce((sum, c) => sum + c.score, 0);
                    let random = Math.random() * currentTotal;
                    let selectedIndex = 0;
                    for (let j = 0; j < remaining.length; j++) {
                        random -= remaining[j].score;
                        if (random <= 0) { selectedIndex = j; break; }
                    }
                    const selected = remaining.splice(selectedIndex, 1)[0];
                    finalRegular.push(selected.trait);
                    const conflicts = selected.trait.conflicts || [];
                    for (let k = remaining.length - 1; k >= 0; k--) {
                        if (conflicts.includes(remaining[k].trait.id)) remaining.splice(k, 1);
                    }
                }
            }
            return [...guaranteedTraits, ...finalRegular];
        };

        const finalTraits = selectTraits(traitScores);
        const selectedIds = new Set(finalTraits.map(t => t.id));
        const backstoriesData = language === 'ko' ? backstoriesKo : backstoriesEn;

        const calculateBackstoryScore = (story: any) => {
            let score = 0;
            if (story.skillBonuses) {
                Object.entries(story.skillBonuses).forEach(([skill, bonus]) => {
                    score += (p1p2SkillScores[skill] || 0) * (bonus as number) * 0.3;
                });
            }
            if (story.spawnCategories) {
                story.spawnCategories.forEach((category: string) => {
                    const catLower = category.toLowerCase();
                    Object.keys(backstoryPreferences).forEach(pref => {
                        if (catLower.includes(pref.toLowerCase()) || pref.toLowerCase().includes(catLower)) score += backstoryPreferences[pref] * 10;
                    });
                });
            }
            if (story.traits) story.traits.forEach((tId: string) => { if (selectedIds.has(tId)) score += 20; });
            if (story.workDisables) score -= story.workDisables.length * 2;
            score += Math.random() * 5;
            return score;
        };

        const childhoods = backstoriesData.childhood || [];
        const adulthoods = backstoriesData.adulthood || [];
        const selectedChildhood = [...childhoods].sort((a, b) => calculateBackstoryScore(b) - calculateBackstoryScore(a))[0] || childhoods[0];
        const selectedAdulthood = [...adulthoods].sort((a, b) => calculateBackstoryScore(b) - calculateBackstoryScore(a))[0] || adulthoods[0];

        const skillScores: Record<string, number> = {};
        Object.keys(scores).forEach(key => { if (R_SKILLS.includes(key)) skillScores[key] = scores[key]; });

        const scoreE = (skillScores['Social'] || 0) * 1.5 + (skillScores['Animals'] || 0);
        const scoreI = (skillScores['Intellectual'] || 0) + (skillScores['Artistic'] || 0);
        const EI = scoreE >= scoreI ? 'E' : 'I';
        const scoreN = (skillScores['Intellectual'] || 0) * 1.2 + (skillScores['Artistic'] || 0) * 1.2;
        const scoreS = (skillScores['Plants'] || 0) + (skillScores['Mining'] || 0) + (skillScores['Construction'] || 0);
        const NS = scoreN >= scoreS ? 'N' : 'S';
        const scoreF = (skillScores['Medicine'] || 0) + (skillScores['Social'] || 0) + (skillScores['Animals'] || 0);
        const scoreT = (skillScores['Shooting'] || 0) + (skillScores['Melee'] || 0) + (skillScores['Crafting'] || 0);
        const FT = scoreF >= scoreT ? 'F' : 'T';
        let scoreJ = (skillScores['Construction'] || 0) + (skillScores['Cooking'] || 0);
        let scoreP = (skillScores['Shooting'] || 0) + (skillScores['Melee'] || 0);
        if (selectedIds.has('hard_worker') || selectedIds.has('industrious')) scoreJ += 10;
        if (selectedIds.has('lazy') || selectedIds.has('slothful')) scoreP += 10;
        const JP = scoreP >= scoreJ ? 'P' : 'J';

        const mbti = `${EI}${NS}${FT}${JP}`;
        const incapabilities: string[] = [];

        const skillInfo = R_SKILLS.map(skillName => {
            const rawScore = skillScores[skillName] || 0;
            const historyBonus = ((selectedChildhood?.skillBonuses?.[skillName as keyof typeof selectedChildhood.skillBonuses] as number) || 0) +
                ((selectedAdulthood?.skillBonuses?.[skillName as keyof typeof selectedAdulthood.skillBonuses] as number) || 0);
            let isTotallyIncapable = false;
            let penalty = 0;
            if (scores['inc_violence'] >= 2 && ['Shooting', 'Melee'].includes(skillName)) isTotallyIncapable = true;
            if (scores['inc_animals'] >= 2 && skillName === 'Animals') isTotallyIncapable = true;
            if (rawScore <= -19) isTotallyIncapable = true;
            if (isTotallyIncapable) {
                if (!incapabilities.includes(skillName)) incapabilities.push(skillName);
                return { name: skillName, isTotallyIncapable: true, level: 0, passion: 'None' as Passion, passionScore: -100 };
            }
            const ageFactor = userInfo.age < 20 ? Math.max(0.1, userInfo.age / 20) : (userInfo.age <= 60 ? 1.0 + ((userInfo.age - 20) / 40) * 0.5 : 1.5);
            let finalLevel = Math.floor(Math.max(0, Math.min(20, (Math.floor(Math.random() * 3) + (rawScore / 3) + historyBonus - penalty) * ageFactor)));
            return { name: skillName, isTotallyIncapable: false, level: finalLevel, passionScore: rawScore + (historyBonus > 0 ? 2 : 0), passion: 'None' as Passion };
        });

        const sortedForPassion = [...skillInfo].filter(s => !s.isTotallyIncapable).sort((a, b) => b.passionScore - a.passionScore);
        let majorCount = 0, totalFlames = 0;
        const passionMap: Record<string, Passion> = {};
        sortedForPassion.forEach(s => {
            if (s.passionScore >= 8 && majorCount < 2 && (totalFlames + 2) <= 8) { passionMap[s.name] = 'Major'; majorCount++; totalFlames += 2; }
            else if (s.passionScore >= 4 && (totalFlames + 1) <= 8) { passionMap[s.name] = 'Minor'; totalFlames += 1; }
            else passionMap[s.name] = 'None';
        });

        return {
            traits: finalTraits,
            skills: skillInfo.map(s => ({ name: s.name, level: s.level, passion: passionMap[s.name] || 'None' })),
            scoreLog: scores,
            backstory: { childhood: selectedChildhood as unknown as Backstory, adulthood: selectedAdulthood as unknown as Backstory },
            mbti: mbti, incapabilities: incapabilities
        };
    }, [answers, scores, userInfo.age, language]);

    return (
        <TestContext.Provider value={{
            userInfo,
            setUserInfo,
            currentQuestionIndex,
            answers,
            scores,
            handleAnswer,
            calculateFinalTraits,
            resetTest,
            shuffledQuestions,
            startSkillTest,
            testPhase
        }}>
            {children}
        </TestContext.Provider>
    );
};

export const useTest = () => {
    const context = useContext(TestContext);
    if (context === undefined) {
        throw new Error('useTest must be used within a TestProvider');
    }
    return context;
};
