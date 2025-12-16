"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Answer, Trait, TestResult, Passion, Question } from '../types/rimworld';
import questionsKo from '../data/questions_ko.json';
import questionsEn from '../data/questions_en.json';
import traitsKo from '../data/traits_ko.json';
import traitsEn from '../data/traits_en.json';
import { BACKSTORIES } from '../data/backstories';
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
        // 1. Record Answer
        setAnswers(prev => ({ ...prev, [questionId]: answer }));

        // 2. Update Scores
        setScores(prev => {
            const newScores = { ...prev };
            Object.entries(answer.scores).forEach(([key, value]) => {
                const numericVal = Number(value);

                // Standard Score Add
                newScores[key] = (newScores[key] || 0) + numericVal;

                // Spectrum Score Add
                if (TRAIT_TO_SPECTRUM[key]) {
                    const { id: spectrumId, value: weight } = TRAIT_TO_SPECTRUM[key];
                    // Score logic: If answering 'industrious' (+1), add 1 * 2 = +2 to work_spectrum
                    // If answering 'lazy' (+1 to lazy), add 1 * -1 = -1 to work_spectrum
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

        // Separate scores for easier access
        const traitScores: Record<string, number> = {};
        const skillScores: Record<string, number> = {};

        Object.keys(scores).forEach(key => {
            if (R_SKILLS.includes(key)) {
                skillScores[key] = scores[key];
            } else {
                traitScores[key] = scores[key];
            }
        });

        // --- TRAIT LOGIC ---
        const candidates: { trait: Trait, score: number }[] = [];
        const getTraitDef = (id: string) => traitDefinitions.find(t => t.id === id);
        const processedTraitIds = new Set<string>(); // IDs handled by spectrum

        // 1. Spectrum Analysis
        Object.entries(SPECTRUM_CONFIG).forEach(([spectrumId, config]) => {
            const score = scores[spectrumId] || 0;

            // Find the BEST matching trait in this spectrum based on threshold
            let selectedTraitId: string | null = null;

            // Check from highest positive threshold down for positives
            // And lowest negative threshold up for negatives
            // Actually, we can just sort config by threshold descending?
            // +6, +3, -3, -6

            // Simplified Check:
            if (score >= 6) selectedTraitId = config.find(c => c.threshold === 6)?.id || null;
            else if (score >= 3) selectedTraitId = config.find(c => c.threshold === 3)?.id || null;
            else if (score <= -6) selectedTraitId = config.find(c => c.threshold === -6)?.id || null;
            else if (score <= -3) selectedTraitId = config.find(c => c.threshold === -3)?.id || null;

            if (selectedTraitId) {
                const def = getTraitDef(selectedTraitId);
                if (def) {
                    candidates.push({ trait: def, score: 100 }); // High priority
                }
            }

            // Mark all traits in this spectrum as processed so standalone logic doesn't pick them again
            config.forEach(c => processedTraitIds.add(c.id));
        });


        // 2. Standard/Group Logic (for non-spectrum traits)
        const groupScores: Record<string, { trait: Trait, score: number }[]> = {};
        const standalones: { trait: Trait, score: number }[] = [];

        Object.keys(traitScores).forEach(id => {
            if (processedTraitIds.has(id)) return; // Skip spectrum traits
            if (traitScores[id] <= 0) return;
            if (id.includes('_spectrum')) return; // Skip spectrum score keys

            const def = getTraitDef(id);
            if (!def) return;

            const item = { trait: def, score: traitScores[id] };
            if (def.group) {
                if (!groupScores[def.group]) groupScores[def.group] = [];
                groupScores[def.group].push(item);
            } else {
                standalones.push(item);
            }
        });

        // Pick Best from Groups
        Object.values(groupScores).forEach(groupItems => {
            groupItems.sort((a, b) => b.score - a.score);
            if (groupItems[0].score >= 3) {
                candidates.push(groupItems[0]);
            }
        });

        // Pick Standalones
        standalones.forEach(item => {
            if (item.score >= 3) {
                candidates.push(item);
            }
        });


        // 3. Global Sort & Conflict Resolution (Unlimited Traits)
        candidates.sort((a, b) => b.score - a.score);

        const finalTraits: Trait[] = [];
        const selectedIds = new Set<string>();

        for (const cand of candidates) {
            const conflicts = cand.trait.conflicts || [];
            if (!conflicts.some(c => selectedIds.has(c))) {
                finalTraits.push(cand.trait);
                selectedIds.add(cand.trait.id);
            }
        }

        // --- BACKSTORY LOGIC ---
        const calculateBackstoryScore = (story: typeof BACKSTORIES[0]) => {
            let score = 0;
            // Dot product of skill bonuses and user scores
            Object.entries(story.skillBonuses).forEach(([skill, bonus]) => {
                score += (scores[skill] || 0) * bonus;
            });
            // Add randomness
            return score + Math.random() * 5;
        };

        const childhoods = BACKSTORIES.filter(b => b.type === 'childhood');
        const adulthoods = BACKSTORIES.filter(b => b.type === 'adulthood');

        childhoods.sort((a, b) => calculateBackstoryScore(b) - calculateBackstoryScore(a));
        adulthoods.sort((a, b) => calculateBackstoryScore(b) - calculateBackstoryScore(a));

        const selectedChildhood = childhoods[0] || childhoods[Math.floor(Math.random() * childhoods.length)];
        const selectedAdulthood = adulthoods[0] || adulthoods[Math.floor(Math.random() * adulthoods.length)];

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

        const incapabilities: string[] = [];

        const finalSkills = R_SKILLS.map(skillName => {
            const rawScore = skillScores[skillName] || 0;

            // Incapability Logic
            if (rawScore <= -10) {
                incapabilities.push(skillName);
                return {
                    name: skillName,
                    level: 0,
                    passion: 'None' as Passion
                };
            }

            // Apply Backstory Bonuses to base level calculation
            const childhoodBonus = selectedChildhood.skillBonuses[skillName] || 0;
            const adulthoodBonus = selectedAdulthood.skillBonuses[skillName] || 0;
            const historyBonus = childhoodBonus + adulthoodBonus;

            // Base level logic: random base (0-3) + score + history
            const baseLevel = Math.floor(Math.random() * 3);
            let calculatedLevel = baseLevel + rawScore + Math.floor(historyBonus / 2);

            // Age Factor Logic
            // < 19: Low skill level (Learning phase)
            // 20 ~ 60: Skill accumulates, peaking at 60
            // > 60: Maintains peak experience
            let ageFactor = 1.0;
            const age = userInfo.age;

            if (age < 20) {
                // Age 0-19: 0.1 ~ 0.95
                ageFactor = Math.max(0.1, age / 20);
            } else if (age <= 60) {
                // Age 20-60: 1.0 ~ 1.5 (Experience growth)
                ageFactor = 1.0 + ((age - 20) / 40) * 0.5;
            } else {
                // Age 60+: Max experience (1.5x)
                ageFactor = 1.5;
            }

            let level = Math.floor(calculatedLevel * ageFactor);

            if (level > 20) level = 20;
            if (level < 0) level = 0;

            let passion: Passion = 'None';
            // Passion depends on RAW answers mostly, but history can nudge
            const passionScore = rawScore + (historyBonus > 0 ? 2 : 0);

            if (passionScore >= 8) passion = 'Major'; // 🔥🔥
            else if (passionScore >= 4) passion = 'Minor'; // 🔥

            return {
                name: skillName,
                level: level,
                passion: passion
            };
        });

        return {
            traits: finalTraits,
            skills: finalSkills,
            scoreLog: scores,
            backstory: {
                childhood: selectedChildhood,
                adulthood: selectedAdulthood
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
