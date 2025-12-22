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

    const initializeTest = (phase: TestPhase = 'trait') => {
        try {
            const currentQuestionsData = language === 'ko' ? questionsKo : questionsEn;
            const allQuestions = currentQuestionsData as unknown as Question[];
            let finalQ: Question[] = [];

            if (phase === 'trait') {
                // PART 1: General Traits (ID < 200) - Pick 40
                const part1Questions = allQuestions.filter(q => q.id < 200);

                // Group by groupId (or use ID as unique group)
                const groups: Record<string, Question[]> = {};
                part1Questions.forEach(q => {
                    const key = q.groupId || `unique_${q.id}`;
                    if (!groups[key]) groups[key] = [];
                    groups[key].push(q);
                });

                // Get list of group keys and shuffle
                const groupKeys = shuffleArray(Object.keys(groups));

                // Select 40 unique groups (or as many as available if < 40)
                const selectedKeys = groupKeys.slice(0, 40);

                // For each selected group, pick ONE random question
                const selectedPart1 = selectedKeys.map(key => {
                    const variants = groups[key];
                    return variants[Math.floor(Math.random() * variants.length)];
                });

                // PART 2: Background (200 <= ID < 1000) - Pick 1 from each step group
                // We want specifically these 5 steps in order
                const part2Groups = ['p2_origin', 'p2_childhood', 'p2_adulthood', 'p2_event', 'p2_goal'];
                const part2QuestionsFull = allQuestions.filter(q => q.id >= 200 && q.id < 1000);

                const selectedPart2 = part2Groups.map(groupKey => {
                    const variants = part2QuestionsFull.filter(q => q.groupId === groupKey);
                    if (variants.length === 0) {
                        // Fallback if no groupId found (e.g. english data not updated yet), pick by ID range as fallback?
                        // Or just return null/skip. Let's try to be robust.
                        // For now assuming data is correct. If strict mode, maybe just pick random from that range?
                        // Fallback: Pick by approximate ID mapping if we know it (201=origin, etc) but that's messy.
                        // Let's rely on data being correct or just picking logic.
                        // Backup hack: if no variants found for 'p2_origin', try finding ID 201.
                        // But we will ensure data is correct.
                        return variants[0];
                    }
                    return variants[Math.floor(Math.random() * variants.length)];
                }).filter(q => q !== undefined); // Filter out undefineds if any group missing

                // Combine: Part 1 then Part 2
                const combinedQuestions = [...shuffleArray(selectedPart1), ...selectedPart2];

                // Shuffle answers for each question
                finalQ = combinedQuestions.map((q: Question) => ({
                    ...q,
                    answers: shuffleArray(q.answers)
                }));

            } else {
                // Phase 2: Skill Assessment (ID >= 1000)
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

            // Only reset answers/scores if starting fresh (trait phase)
            if (phase === 'trait') {
                setAnswers({});
                setScores({});
            }
        } catch (error) {
            console.error("Failed to load questions:", error);
        }
    };

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

    const resetTest = () => {
        setUserInfo({ name: '정착민', age: 20, gender: 'Male' });
        initializeTest('trait');
    };

    const startSkillTest = () => {
        initializeTest('skill');
    };

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

    const handleAnswer = (questionId: number, answer: Answer) => {
        // 1. Record Answer with part information
        const answerWithPart: Answer = {
            ...answer,
            part: testPhase === 'trait' ? (questionId < 200 ? 1 : 2) : 3
        };
        setAnswers(prev => ({ ...prev, [questionId]: answerWithPart }));

        // 2. Update Scores
        setScores(prev => {
            const newScores = { ...prev };
            Object.entries(answer.scores).forEach(([key, value]) => {
                const numericVal = Number(value);

                // If we are in 'skill' phase, only allow skill-related scores
                // This prevents Part 3 answers from changing already determined traits/backstories
                const isSkillKey = R_SKILLS.includes(key) || key.startsWith('inc_');
                if (testPhase === 'skill' && !isSkillKey) {
                    return; // Skip non-skill scores in skill phase
                }

                // Standard Score Add
                newScores[key] = (newScores[key] || 0) + numericVal;

                // Spectrum Score Add (Only in trait phase)
                if (testPhase === 'trait' && TRAIT_TO_SPECTRUM[key]) {
                    const { id: spectrumId, value: weight } = TRAIT_TO_SPECTRUM[key];
                    newScores[spectrumId] = (newScores[spectrumId] || 0) + (numericVal * weight);
                }
            });
            return newScores;
        });

        // 3. Move to Next Question
        setCurrentQuestionIndex(prev => prev + 1);
    };

    const calculateFinalTraits = (): TestResult | null => {
        const traitsData = language === 'ko' ? traitsKo : traitsEn;
        const traitDefinitions = traitsData as Trait[];

        // Separate answers by part - only use P1+P2 for traits and backstory
        const traitAnswers = Object.values(answers).filter(a => a.part === 1 || a.part === 2);

        // --- 1. TRAIT & BACKSTORY SCORES (P1 + P2 ONLY) ---
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

                        // Spectrum Score 계산 (handleAnswer와 동일)
                        if (TRAIT_TO_SPECTRUM[id]) {
                            const { id: spectrumId, value: weight } = TRAIT_TO_SPECTRUM[id];
                            traitScores[spectrumId] = (traitScores[spectrumId] || 0) + (numericScore * weight);
                        }
                    }
                });
            }
        });

        // --- TRAIT SELECTION LOGIC (WEIGHTED RANDOM) ---
        const selectTraits = (scores: Record<string, number>): Trait[] => {
            const getTraitDef = (id: string) => traitDefinitions.find(t => t.id === id);

            // 강한 특성: 선택지 하나로도 확정 (낮은 임계값, 무조건 표시)
            const STRONG_TRAITS: Record<string, number> = {
                // 성적 지향 (1점 이상이면 확정 - 질문 1개)
                'gay': 1,
                'bisexual': 1,
                'asexual': 1,
                // 극단적 특성 (3점 이상이면 확정)
                'cannibal': 3,
                'nudist': 3,
                'pyromaniac': 3,
                'psychopath': 3
            };

            const processedTraitIds = new Set<string>();
            const guaranteedTraits: Trait[] = []; // 강한 특성 (무조건 표시)
            const candidates: { trait: Trait, score: number }[] = [];

            // 1. 강한 특성 먼저 확정
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

            // 2. Spectrum 분석 (3점 이상 후보 포함)
            Object.entries(SPECTRUM_CONFIG).forEach(([spectrumId, config]) => {
                const rawScore = scores[spectrumId] || 0;
                let selectedTraitId: string | null = null;

                if (rawScore >= 6) {
                    selectedTraitId = config.find(c => c.threshold === 6)?.id || null;
                } else if (rawScore >= 3) {
                    selectedTraitId = config.find(c => c.threshold === 3)?.id || null;
                } else if (rawScore <= -6) {
                    selectedTraitId = config.find(c => c.threshold === -6)?.id || null;
                } else if (rawScore <= -3) {
                    selectedTraitId = config.find(c => c.threshold === -3)?.id || null;
                }

                if (selectedTraitId && !processedTraitIds.has(selectedTraitId)) {
                    const def = getTraitDef(selectedTraitId);
                    if (def) {
                        candidates.push({
                            trait: def,
                            score: Math.abs(rawScore)
                        });
                    }
                }

                config.forEach(c => processedTraitIds.add(c.id));
            });

            // 3. 일반 특성 (임계값 5점)
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

                const item = {
                    trait: def,
                    score: rawScore
                };

                if (def.group) {
                    if (!groupScores[def.group]) groupScores[def.group] = [];
                    groupScores[def.group].push(item);
                } else {
                    standalones.push(item);
                }
            });

            // 그룹별 최고점만 선택
            Object.values(groupScores).forEach(groupItems => {
                groupItems.sort((a, b) => b.score - a.score);
                candidates.push(groupItems[0]);
            });

            // 독립 특성 추가
            standalones.forEach(item => {
                candidates.push(item);
            });

            // 4. 충돌 해결 (강한 특성 기준)
            const selectedIds = new Set<string>(guaranteedTraits.map(t => t.id));
            const validCandidates = candidates.filter(cand => {
                const conflicts = cand.trait.conflicts || [];
                return !conflicts.some(c => selectedIds.has(c));
            });

            // 5. 가중 랜덤 선택 (점수 비율 기반) - 동적 특성 개수 제한
            // 강한 특성 0-1개: 총 4-5개
            // 강한 특성 2개 이상: 총 6개
            const strongTraitCount = guaranteedTraits.length;
            let MAX_TOTAL_TRAITS: number;

            if (strongTraitCount === 0) {
                MAX_TOTAL_TRAITS = 4;
            } else if (strongTraitCount === 1) {
                MAX_TOTAL_TRAITS = 5;
            } else {
                MAX_TOTAL_TRAITS = 6;
            }

            const remainingSlots = Math.max(0, MAX_TOTAL_TRAITS - strongTraitCount);
            let finalRegularTraits: Trait[] = [];

            if (validCandidates.length <= remainingSlots) {
                // 후보가 남은 슬롯보다 적거나 같으면 전부 선택
                finalRegularTraits = validCandidates.map(c => c.trait);
            } else {
                // 가중 랜덤 선택
                const totalScore = validCandidates.reduce((sum, c) => sum + c.score, 0);
                const selectedCandidates: typeof validCandidates = [];
                const remainingCandidates = [...validCandidates];

                for (let i = 0; i < remainingSlots && remainingCandidates.length > 0; i++) {
                    // 현재 남은 후보들의 총점 계산
                    const currentTotal = remainingCandidates.reduce((sum, c) => sum + c.score, 0);

                    // 랜덤 값 생성 (0 ~ currentTotal)
                    let random = Math.random() * currentTotal;

                    // 가중치에 따라 선택
                    let selectedIndex = 0;
                    for (let j = 0; j < remainingCandidates.length; j++) {
                        random -= remainingCandidates[j].score;
                        if (random <= 0) {
                            selectedIndex = j;
                            break;
                        }
                    }

                    // 선택된 후보 추가 및 제거
                    const selected = remainingCandidates.splice(selectedIndex, 1)[0];
                    selectedCandidates.push(selected);

                    // 충돌하는 특성 제거
                    const conflicts = selected.trait.conflicts || [];
                    for (let k = remainingCandidates.length - 1; k >= 0; k--) {
                        if (conflicts.includes(remainingCandidates[k].trait.id)) {
                            remainingCandidates.splice(k, 1);
                        }
                    }
                }

                finalRegularTraits = selectedCandidates.map(c => c.trait);
            }

            // 강한 특성 + 일반 특성 결합
            const finalResult = [...guaranteedTraits, ...finalRegularTraits];

            // 디버깅 로그
            console.log('=== Trait Selection Debug ===');
            console.log('Input scores:', scores);

            // 모든 특성 점수를 정렬하여 출력
            const allScores = Object.entries(scores)
                .filter(([key]) => !key.includes('_spectrum'))
                .sort((a, b) => (b[1] as number) - (a[1] as number));
            console.log('All trait scores (sorted):');
            allScores.forEach(([trait, score]) => {
                console.log(`  ${trait}: ${score}`);
            });

            console.log('Strong traits:', guaranteedTraits.map(t => t.id));
            console.log('Max total traits:', MAX_TOTAL_TRAITS);
            console.log('Remaining slots for regular traits:', remainingSlots);
            console.log('Valid candidates:', validCandidates.map(c => ({ id: c.trait.id, score: c.score })));
            console.log('Final regular traits:', finalRegularTraits.map(t => t.id));
            console.log('Total final traits:', finalResult.map(t => t.id));
            console.log('============================');

            return finalResult;
        };

        // Calculate Traits Based on P1+P2 scores
        const finalTraits = selectTraits(traitScores);
        const selectedIds = new Set(finalTraits.map(t => t.id));

        // --- 2. BACKSTORY LOGIC (P1 + P2 ONLY) ---
        const backstoriesData = language === 'ko' ? backstoriesKo : backstoriesEn;

        // Calculate backstory score with multiple factors (Only using P1+P2 data)
        const calculateBackstoryScore = (story: any) => {
            let score = 0;

            // 1. Skill bonuses alignment (P1+P2 ONLY)
            if (story.skillBonuses) {
                Object.entries(story.skillBonuses).forEach(([skill, bonus]) => {
                    const skillScore = p1p2SkillScores[skill] || 0;
                    score += skillScore * (bonus as number) * 0.3;
                });
            }

            // 2. Backstory preference from Part 2 (40% weight)
            if (story.spawnCategories && story.spawnCategories.length > 0) {
                story.spawnCategories.forEach((category: string) => {
                    const categoryLower = category.toLowerCase();
                    Object.keys(backstoryPreferences).forEach(pref => {
                        if (categoryLower.includes(pref.toLowerCase()) || pref.toLowerCase().includes(categoryLower)) {
                            score += backstoryPreferences[pref] * 10;
                        }
                    });
                });
            }

            // 3. Trait compatibility
            if (story.traits && story.traits.length > 0) {
                story.traits.forEach((traitId: string) => {
                    if (selectedIds.has(traitId)) {
                        score += 20;
                    }
                });
            }

            // 4. Penalty for work disables
            if (story.workDisables && story.workDisables.length > 0) {
                score -= story.workDisables.length * 2;
            }

            // 5. Variety
            score += Math.random() * 5;

            return score;
        };

        const childhoods = backstoriesData.childhood || [];
        const adulthoods = backstoriesData.adulthood || [];

        const scoredChildhoods = childhoods.map(story => ({
            story,
            score: calculateBackstoryScore(story)
        })).sort((a, b) => b.score - a.score);

        const scoredAdulthoods = adulthoods.map(story => ({
            story,
            score: calculateBackstoryScore(story)
        })).sort((a, b) => b.score - a.score);

        const selectedChildhood = scoredChildhoods[0]?.story || childhoods[0];
        const selectedAdulthood = scoredAdulthoods[0]?.story || adulthoods[0];

        // --- EXTRACT SKILL SCORES (from all parts P1+P2+P3) ---
        const skillScores: Record<string, number> = {};
        Object.keys(scores).forEach(key => {
            if (R_SKILLS.includes(key)) {
                skillScores[key] = scores[key];
            }
        });

        // --- MBTI LOGIC ---
        // E vs I: Social + Animals
        const scoreE = (skillScores['Social'] || 0) * 1.5 + (skillScores['Animals'] || 0);
        const scoreI = (skillScores['Intellectual'] || 0) + (skillScores['Artistic'] || 0);
        const EI = scoreE >= scoreI ? 'E' : 'I';

        // N vs S: Intellectual + Artistic vs Plants + Mining + Construction
        const scoreN = (skillScores['Intellectual'] || 0) * 1.2 + (skillScores['Artistic'] || 0) * 1.2;
        const scoreS = (skillScores['Plants'] || 0) + (skillScores['Mining'] || 0) + (skillScores['Construction'] || 0);
        const NS = scoreN >= scoreS ? 'N' : 'S';

        // F vs T: Medicine + Social + Animals vs Shooting + Melee + Crafting
        const scoreF = (skillScores['Medicine'] || 0) + (skillScores['Social'] || 0) + (skillScores['Animals'] || 0);
        const scoreT = (skillScores['Shooting'] || 0) + (skillScores['Melee'] || 0) + (skillScores['Crafting'] || 0);
        const FT = scoreF >= scoreT ? 'F' : 'T';

        // P vs J: (Trait-based approximation)
        // Hard Worker leads to J, Lazy leads to P. If no trait, randomized or based on Shooting (P) vs Construction (J)
        let scoreJ = (skillScores['Construction'] || 0) + (skillScores['Cooking'] || 0);
        let scoreP = (skillScores['Shooting'] || 0) + (skillScores['Melee'] || 0);
        if (selectedIds.has('hard_worker') || selectedIds.has('industrious')) scoreJ += 10;
        if (selectedIds.has('lazy') || selectedIds.has('slothful')) scoreP += 10;
        const JP = scoreP >= scoreJ ? 'P' : 'J';

        const mbti = `${EI}${NS}${FT}${JP}`;


        // --- SKILL LOGIC ---
        // Base value: 0. Score adds to it.
        // Range: 0-20.
        // Passion: Minor (🔥) if score > 5, Major (🔥🔥) if score > 10 (Example logic)

        // --- SKILL LOGIC ---
        const incapabilities: string[] = [];

        // Define Incapability Mapping
        const INCAPABILITY_MAP: Record<string, string[]> = {
            'inc_violence': ['Shooting', 'Melee'],
            'inc_animals': ['Animals'],
        };

        // 1. Pre-calculate raw stats and potential passion scores for all skills
        const skillInfo = R_SKILLS.map(skillName => {
            const rawScore = skillScores[skillName] || 0;
            const historyBonus = ((selectedChildhood?.skillBonuses?.[skillName as keyof typeof selectedChildhood.skillBonuses] as number) || 0) +
                ((selectedAdulthood?.skillBonuses?.[skillName as keyof typeof selectedAdulthood.skillBonuses] as number) || 0);

            let isTotallyIncapable = false;
            let penalty = 0;

            Object.entries(INCAPABILITY_MAP).forEach(([incKey, affectedSkills]) => {
                if (affectedSkills.includes(skillName)) {
                    const count = scores[incKey] || 0;
                    if (count >= 2) isTotallyIncapable = true;
                    else if (count === 1) penalty += 8;
                }
            });

            if (rawScore <= -19) isTotallyIncapable = true;

            if (isTotallyIncapable) {
                if (!incapabilities.includes(skillName)) incapabilities.push(skillName);
                return { name: skillName, isTotallyIncapable: true, level: 0, passion: 'None' as Passion, passionScore: -100 };
            }

            // Adjusted level logic: 
            // - historyBonus: exact value (Rimworld style)
            // - rawScore: divide by 3 for balanced impact from survey
            const baseLevel = Math.floor(Math.random() * 3); // 0, 1, or 2 base
            let calculatedLevel = baseLevel + (rawScore / 3) + historyBonus - penalty;

            // Age Factor Logic
            let ageFactor = 1.0;
            const age = userInfo.age;
            if (age < 20) ageFactor = Math.max(0.1, age / 20);
            else if (age <= 60) ageFactor = 1.0 + ((age - 20) / 40) * 0.5;
            else ageFactor = 1.5;

            let finalLevel = Math.floor(calculatedLevel * ageFactor);
            if (finalLevel > 20) finalLevel = 20;
            if (finalLevel < 0) finalLevel = 0;

            // Prepare passion scoring
            const passionScore = rawScore + (historyBonus > 0 ? 2 : 0);

            return {
                name: skillName,
                isTotallyIncapable: false,
                level: finalLevel,
                passionScore: passionScore,
                passion: 'None' as Passion
            };
        });

        // 2. Assign Passions with limits: Max 2 Majors (🔥🔥), Max Total 8 Flames
        const sortedForPassion = [...skillInfo]
            .filter(s => !s.isTotallyIncapable)
            .sort((a, b) => b.passionScore - a.passionScore);

        let majorCount = 0;
        let totalFlames = 0;
        const MAJOR_LIMIT = 2;
        const TOTAL_FLAME_LIMIT = 8;

        const passionMap: Record<string, Passion> = {};

        sortedForPassion.forEach(s => {
            if (s.passionScore >= 8 && majorCount < MAJOR_LIMIT && (totalFlames + 2) <= TOTAL_FLAME_LIMIT) {
                passionMap[s.name] = 'Major';
                majorCount++;
                totalFlames += 2;
            } else if (s.passionScore >= 4 && (totalFlames + 1) <= TOTAL_FLAME_LIMIT) {
                passionMap[s.name] = 'Minor';
                totalFlames += 1;
            } else {
                passionMap[s.name] = 'None';
            }
        });

        // 3. Assemble final skill list
        const finalSkills = skillInfo.map(s => ({
            name: s.name,
            level: s.level,
            passion: passionMap[s.name] || 'None'
        }));

        return {
            traits: finalTraits,
            skills: finalSkills,
            scoreLog: scores,
            backstory: {
                childhood: selectedChildhood as unknown as Backstory,
                adulthood: selectedAdulthood as unknown as Backstory
            },
            mbti: mbti,
            incapabilities: incapabilities
        };
    };

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
