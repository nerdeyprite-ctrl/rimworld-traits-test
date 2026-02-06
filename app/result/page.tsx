"use client";

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useTest } from '../../context/TestContext';
import { useLanguage } from '../../context/LanguageContext';
import { TestResult, Trait } from '../../types/rimworld';
import { useRouter, useSearchParams } from 'next/navigation';
import AdPlaceholder from '../../components/AdPlaceholder';
import ShareButtons from '../../components/ShareButtons';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

function ResultContent() {
    const { calculateFinalTraits, userInfo: contextUserInfo, testPhase: contextTestPhase, startSkillTest } = useTest();
    const { t, language } = useLanguage();
    const searchParams = useSearchParams();
    const s = searchParams.get('s');

    const [result, setResult] = useState<TestResult | null>(null);
    const [selectedTrait, setSelectedTrait] = useState<Trait | null>(null);
    const [localUserInfo, setLocalUserInfo] = useState<any>(null);
    const [isFullResult, setIsFullResult] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const userInfo = localUserInfo || contextUserInfo;
    const testPhase = localUserInfo ? (isFullResult ? 'skill' : 'trait') : contextTestPhase;

    // Scroll Hint Logic
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showScrollHint, setShowScrollHint] = useState(false);
    const [shareId, setShareId] = useState<string | null>(s);
    const isSavedRef = useRef(false);

    // Fetch result if ID provided or handle legacy link
    useEffect(() => {
        const fetchSharedResult = async () => {
            if (s) {
                setLoading(true);
                try {
                    const { data, error } = await supabase
                        .from('test_results')
                        .select('*')
                        .eq('id', s)
                        .single();

                    if (data && !error) {
                        const fetchedResult: TestResult = {
                            mbti: data.mbti,
                            traits: data.traits,
                            backstory: {
                                childhood: data.backstory_childhood,
                                adulthood: data.backstory_adulthood
                            },
                            skills: data.skills || [],
                            incapabilities: data.incapabilities || [],
                            scoreLog: {}
                        };
                        setResult(fetchedResult);
                        setLocalUserInfo({
                            name: data.name || '정착민',
                            age: data.age || 20,
                            gender: data.gender || 'Male'
                        });
                        setIsFullResult(!!data.skills && data.skills.length > 0);
                        isSavedRef.current = true;
                    }
                } catch (err) {
                    console.error("Failed to fetch shared result:", err);
                } finally {
                    setLoading(false);
                }
            } else if (searchParams.get('name')) {
                // Legacy URL handle (name, mbti, traits)
                const name = searchParams.get('name') || '정착민';
                const mbti = searchParams.get('mbti') || 'Unknown';
                const traitsStr = searchParams.get('traits') || '';
                const age = Number(searchParams.get('age')) || 20;
                const gender = (searchParams.get('gender') as any) || 'Male';

                // Reconstruct traits from names
                const traitNames = traitsStr.split(',');
                const reconstructedTraits: Trait[] = traitNames.filter(t => t).map(t => ({
                    id: t,
                    name: t,
                    description: '공유된 결과입니다.'
                }));

                const legacyResult: TestResult = {
                    mbti,
                    traits: reconstructedTraits,
                    backstory: {
                        childhood: { id: 'legacy', title: '데이터 없음', titleShort: 'N/A', description: '구버전 공유 링크는 상세 데이터를 포함하지 않습니다.' },
                        adulthood: { id: 'legacy', title: '데이터 없음', titleShort: 'N/A', description: '구버전 공유 링크는 상세 데이터를 포함하지 않습니다.' }
                    },
                    skills: [],
                    incapabilities: [],
                    scoreLog: {}
                };
                setResult(legacyResult);
                setLocalUserInfo({ name, age, gender });
                setIsFullResult(false);
                isSavedRef.current = true;
            } else {
                // Normal flow: calculate from context
                const res = calculateFinalTraits();
                setResult(res);
                setIsFullResult(contextTestPhase === 'skill');
            }
        };
        fetchSharedResult();
    }, [s, language, contextTestPhase, searchParams]);

    // Save logic
    useEffect(() => {
        if (!s && result && userInfo && isSupabaseConfigured()) {
            const saveKey = `${testPhase}_${userInfo.name}`;
            if (isSavedRef.current === (saveKey as any)) return;

            const saveStats = async () => {
                try {
                    const savePayload: any = {
                        mbti: result.mbti,
                        traits: result.traits,
                        backstory_childhood: result.backstory.childhood,
                        backstory_adulthood: result.backstory.adulthood,
                        skills: result.skills,
                        incapabilities: result.incapabilities,
                        name: userInfo.name,
                        age: userInfo.age,
                        gender: userInfo.gender
                    };

                    let data, error;
                    if (shareId) {
                        const res = await supabase.from('test_results').update(savePayload).eq('id', shareId).select('id').single();
                        data = res.data;
                        error = res.error;
                    } else {
                        const res = await supabase.from('test_results').insert(savePayload).select('id').single();
                        data = res.data;
                        error = res.error;
                    }

                    if (data && !error) {
                        setShareId(data.id.toString());
                    }
                } catch (err) {
                    console.error("Failed to save result:", err);
                }
                isSavedRef.current = saveKey as any;
            };
            saveStats();
        }
    }, [result, userInfo, testPhase, s, shareId]);

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            setShowScrollHint(scrollHeight > clientHeight && scrollTop + clientHeight < scrollHeight - 5);
        }
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [result]);

    const handleUnlockSkills = () => {
        startSkillTest();
        router.push('/test');
    };

    const handleSimulationClick = () => {
        const targetId = shareId || s;
        if (targetId) {
            router.push(`/simulation?s=${targetId}`);
            return;
        }
        router.push('/simulation');
    };

    if (loading) {
        return <div className="p-20 text-center text-gray-400 animate-pulse">{t('loading_gene')}...</div>;
    }

    if (!result) {
        return <div className="p-8 text-center text-gray-400">{t('loading_gene')}</div>;
    }

    const { traits, skills, mbti, backstory } = result;

    const getSkillName = (key: string) => t(key.toLowerCase());

    return (
        <div className="max-w-6xl mx-auto flex flex-col items-center justify-center min-h-[80vh] animate-fade-in p-4">

            {/* Header Title */}
            <h1 className="text-3xl text-white/90 mb-6 w-full text-left pl-2 border-b border-gray-700 pb-2 flex justify-between items-end">
                <span>{t('result_title')}</span>
                <span className="text-xs text-gray-500 uppercase tracking-widest mb-1">
                    Phase: {isFullResult ? 'Complete' : t('phase_initial')}
                </span>
            </h1>

            {/* Main Stats Panel - Mimicking Rimworld UI */}
            <div className="w-full bg-[#1b1b1b] border border-[#6b6b6b] p-1 shadow-2xl flex flex-col md:flex-row min-h-[600px]">

                {/* LEFT COLUMN: Basic Info & Backstory */}
                <div className="w-full md:w-1/3 bg-[#2b2b2b] p-6 flex flex-col border-r border-[#6b6b6b] relative">

                    {/* Name Box with MBTI integrated */}
                    <div className="bg-[#111111] border border-[#6b6b6b] p-4 mb-6 text-center shadow-inner relative overflow-hidden group">
                        <div className="text-xs text-gray-500 mb-2 uppercase tracking-widest">{t('name')}</div>
                        <div className="text-2xl text-white font-bold tracking-wider relative z-10">{userInfo?.name || '정착민'}</div>

                        {/* Subtler MBTI Badge */}
                        {mbti && (
                            <div className="mt-3 inline-block bg-[#333] border border-[#555] px-3 py-1 rounded text-xs text-[#9f752a] font-bold tracking-widest shadow-sm" title="변방계 성격 유형">
                                {mbti}
                            </div>
                        )}
                    </div>

                    {/* Gender & Age */}
                    <div className="flex justify-around items-center mb-6 bg-[#1f1f1f] p-3 rounded">
                        <div className="text-center">
                            <span className="block text-gray-500 text-[10px] uppercase">{t('gender')}</span>
                            <span className="text-white text-lg">{userInfo?.gender === 'Male' ? '♂ ' + t('male') : '♀ ' + t('female')}</span>
                        </div>
                        <div className="w-px h-8 bg-gray-600"></div>
                        <div className="text-center">
                            <span className="block text-gray-500 text-[10px] uppercase">{t('age')}</span>
                            <span className="text-white text-lg">{userInfo?.age}</span>
                        </div>
                    </div>

                    {/* Background Stories */}
                    <div className="flex-grow space-y-4">
                        {/* Background Stories Container */}
                        <div className="bg-[#111111] border border-[#6b6b6b] p-3 space-y-4">
                            {/* Childhood */}
                            <div>
                                <h4 className="text-[#a2a2a2] font-semibold mb-1 text-sm flex justify-between">
                                    <span>{t('childhood')}</span>
                                    {backstory.childhood.spawnCategories && (
                                        <span className="text-xs text-[#666] font-normal">[{backstory.childhood.spawnCategories[0]}]</span>
                                    )}
                                </h4>
                                <div className="bg-[#111] p-3 border border-[#333] group hover:border-[#555] transition-colors">
                                    <div className="text-[#e2c178] font-bold mb-1">
                                        {backstory.childhood.title}
                                    </div>
                                    <p className="text-gray-400 text-xs italic mb-2 leading-relaxed">
                                        {backstory.childhood.description}
                                    </p>

                                    {/* Skill Bonuses */}
                                    {backstory.childhood.skillBonuses && Object.keys(backstory.childhood.skillBonuses).length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2 border-t border-gray-800 pt-2">
                                            {Object.entries(backstory.childhood.skillBonuses).map(([skill, bonus]) => (
                                                <span key={skill} className={`text-[10px] px-1.5 py-0.5 rounded border ${bonus > 0 ? 'border-green-900 text-green-500 bg-green-900/10' : 'border-red-900 text-red-500 bg-red-900/10'}`}>
                                                    {getSkillName(skill)} {bonus > 0 ? `+${bonus}` : bonus}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Adulthood (Only if adult) */}
                            {backstory?.adulthood && userInfo.age >= 20 && (
                                <div>
                                    <h4 className="text-[#a2a2a2] font-semibold mb-1 text-sm flex justify-between">
                                        <span>{t('adulthood')}</span>
                                        {backstory.adulthood.spawnCategories && (
                                            <span className="text-xs text-[#666] font-normal">[{backstory.adulthood.spawnCategories[0]}]</span>
                                        )}
                                    </h4>
                                    <div className="bg-[#111] p-3 border border-[#333] group hover:border-[#555] transition-colors">
                                        <div className="text-[#e2c178] font-bold mb-1">
                                            {backstory.adulthood.title}
                                        </div>
                                        <p className="text-gray-400 text-xs italic mb-2 leading-relaxed">
                                            {backstory.adulthood.description}
                                        </p>

                                        {/* Skill Bonuses */}
                                        {backstory.adulthood.skillBonuses && Object.keys(backstory.adulthood.skillBonuses).length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-2 border-t border-gray-800 pt-2">
                                                {Object.entries(backstory.adulthood.skillBonuses).map(([skill, bonus]) => (
                                                    <span key={skill} className={`text-[10px] px-1.5 py-0.5 rounded border ${bonus > 0 ? 'border-green-900 text-green-500 bg-green-900/10' : 'border-red-900 text-red-500 bg-red-900/10'}`}>
                                                        {getSkillName(skill)} {bonus > 0 ? `+${bonus}` : bonus}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* Incapability Section */}
                        <div className="bg-[#111111] border border-[#6b6b6b] p-3 mt-4">
                            <h4 className="text-[#ff4d4d] font-bold text-sm mb-2 border-b border-gray-700 pb-1">
                                {t('incapable')}
                            </h4>
                            {result.incapabilities && result.incapabilities.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {result.incapabilities.map(skillKey => (
                                        <span key={skillKey} className="px-2 py-1 bg-[#3a1a1a] border border-[#ff4d4d] text-[#ff4d4d] text-xs font-bold rounded">
                                            {getSkillName(skillKey)}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-gray-500 text-xs italic">{t('none')}</div>
                            )}
                        </div>
                    </div>

                    {/* Flavor Text (Moved to Bottom) */}
                    {mbti && (
                        <div className="mt-6 text-center px-4 pt-4 border-t border-gray-700/50">
                            <span className="text-[10px] text-[#888] italic block">
                                {t('mbti_flavor')}
                            </span>
                        </div>
                    )}
                </div>

                {/* MIDDLE/RIGHT COLUMN: Traits & Skills */}
                <div className="w-full md:w-2/3 flex flex-col md:flex-row">

                    {/* Traits Column */}
                    <div className="w-full md:w-1/2 p-4 border-r border-[#6b6b6b] flex flex-col bg-[#212121] relative">
                        <h3 className="text-[#9f752a] font-bold mb-4 border-b border-gray-600 pb-1 flex justify-between">
                            <span>{t('traits')}</span>
                            <span className="text-[10px] text-gray-500 font-normal mt-1">{t('trait_click_hint')}</span>
                        </h3>

                        {/* Traits List Container */}
                        <div className="relative flex-grow mb-4 min-h-0">
                            <div
                                ref={scrollRef}
                                onScroll={checkScroll}
                                className="space-y-2 overflow-y-auto max-h-[350px] pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] h-full pb-16"
                            >
                                {traits.map(trait => {
                                    const isSelected = selectedTrait?.id === trait.id;
                                    return (
                                        <div
                                            key={trait.id}
                                            className={`group relative border p-3 flex items-start cursor-pointer transition-all duration-200 ${isSelected
                                                ? 'bg-[#444444] border-[#9f752a] shadow-md'
                                                : 'bg-[#333333] hover:bg-[#3a3a3a] border-[#111] hover:border-gray-500'
                                                }`}
                                            onClick={() => setSelectedTrait(trait)}
                                        >
                                            <div className="flex-grow">
                                                <div className={`text-sm font-bold ${isSelected ? 'text-[#ffc45d]' : 'text-white'}`}>{trait.name}</div>
                                                <div className="text-[10px] text-gray-400">{trait.group || 'General'}</div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {traits.length === 0 && (
                                    <div className="text-gray-500 text-sm italic text-center py-10">{t('no_traits')}</div>
                                )}
                            </div>

                            {/* Scroll Hint Overlay */}
                            {showScrollHint && (
                                <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-[#212121] via-[#212121]/90 to-transparent pointer-events-none flex items-end justify-center pb-6 transition-opacity duration-300 z-10">
                                    <div className="animate-bounce bg-[#111] bg-opacity-90 rounded-full p-1.5 border border-[#6b6b6b] shadow-lg mb-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#9f752a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                    <span className="absolute bottom-2 text-[10px] text-gray-500 font-mono animate-pulse">SCROLL</span>
                                </div>
                            )}
                        </div>

                        {/* Dedicated Description Panel (Fixed at bottom) */}
                        <div className="bg-[#111111] border border-[#6b6b6b] p-4 min-h-[120px] shadow-inner relative mt-auto">
                            {selectedTrait ? (
                                <div className="animate-fade-in">
                                    <h4 className="text-[#9f752a] font-bold text-sm mb-1">{selectedTrait.name}</h4>
                                    <p className="text-xs text-white mb-2">{selectedTrait.effect || t('none')}</p>
                                    <p className="text-[10px] text-gray-400 leading-relaxed">{selectedTrait.description}</p>
                                </div>
                            ) : (
                                <div className="text-gray-600 text-xs text-center flex flex-col items-center justify-center h-full opacity-60 whitespace-pre-line">
                                    {t('trait_select_hint')}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Skills Column */}
                    <div className="w-full md:w-1/2 p-4 bg-[#1e1e1e] relative flex flex-col">
                        <h3 className="text-[#9f752a] font-bold mb-4 border-b border-gray-600 pb-1">{t('skills')}</h3>

                        {/* Skills List - Only fully visible if isFullResult is true */}
                        <div className={`space-y-3 p-2 flex-grow transition-all duration-500 ${!isFullResult ? 'blur-sm opacity-30 pointer-events-none' : 'opacity-100'}`}>
                            {skills.map((skill, idx) => {
                                const isIncapable = result.incapabilities?.includes(skill.name);
                                const localizedName = getSkillName(skill.name);

                                // Passion & Level display for Normal
                                const fire = skill.passion === 'Major' ? '🔥🔥' : (skill.passion === 'Minor' ? '🔥' : '');
                                const level = isFullResult ? skill.level : 0;

                                return (
                                    <div key={idx} className="flex flex-col space-y-1">
                                        <div className="flex justify-between items-end text-xs mb-0.5">
                                            <span className={`font-bold ${isIncapable ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                                                {localizedName}
                                            </span>
                                            <div className="flex items-center">
                                                {!isIncapable && <span className="text-[#ffb000] text-[10px] mr-1">{fire}</span>}
                                                <span className="text-white font-mono">{isIncapable ? '-' : level}</span>
                                            </div>
                                        </div>
                                        {/* Bar Graph */}
                                        <div className="w-full h-3 bg-[#111] border border-gray-700 relative overflow-hidden">
                                            {isIncapable ? (
                                                <div className="w-full h-full bg-[#2a1a1a] flex items-center justify-center">
                                                    <span className="text-[9px] text-[#ff4d4d] font-bold tracking-widest">{t('skill_incapable')}</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <div
                                                        className="h-full bg-[#5b5b5b]"
                                                        style={{ width: `${(level / 20) * 100}%` }}
                                                    ></div>
                                                    {/* Ticks/Grid */}
                                                    <div className="absolute inset-0 flex">
                                                        {[...Array(9)].map((_, i) => (
                                                            <div key={i} className="flex-1 border-r border-black/20 h-full"></div>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Lock Overlay for Phase 1 */}
                        {!isFullResult && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/40 backdrop-blur-[1px]">
                                <h4 className="text-white font-bold mb-2 drop-shadow-md">상세 기술 분석 필요? (Should translate?) </h4>
                                {/* Wait, I forgot keys for this part. 
                                    Looking at keys again: 'unlock_skills', 'unlock_desc', 'unlock_info' 
                                */}
                                {/* Re-doing this block with translations */}
                                <h4 className="text-white font-bold mb-2 drop-shadow-md">Expert Verification Required</h4>
                                {/* I don't have a key for "Expert Verification Required". 
                                    I'll just use a generic "Phase 2 Required" or use 'unlock_skills' context.
                                    Actually I can use `t('phase_skill')` but that's "Phase 2: Skill Assessment".
                                    I will default to English "Skill Analysis Required" if no key found.
                                    Or I can just use Korean for now in the JSX below.
                                */}
                            </div>
                        )}

                        {/* Correcting the overlay block */}
                        {!isFullResult && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/40 backdrop-blur-[1px]">
                                <h4 className="text-white font-bold mb-2 drop-shadow-md">{t('phase_skill')}</h4>
                                <button
                                    onClick={handleUnlockSkills}
                                    className="bg-[#9f752a] hover:bg-[#b08535] text-white font-bold py-3 px-8 border-2 border-[#7a5a20] shadow-[0_0_20px_rgba(159,117,42,0.4)] transform hover:scale-105 transition-all text-sm animate-pulse"
                                >
                                    {t('unlock_skills')}
                                    <span className="block text-[10px] font-normal mt-1 text-white/80">{t('unlock_desc')}</span>
                                </button>
                                <p className="text-[10px] text-gray-400 mt-4 max-w-[200px] text-center">
                                    {t('unlock_info')}
                                </p>
                            </div>
                        )}

                        {isFullResult && (
                            <div className="mt-4 text-center animate-fade-in border-t border-gray-700 pt-2">
                                <p className="text-xs text-[#9f752a] font-bold">
                                    {t('analysis_complete')}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="w-full mt-6 space-y-4">
                <AdPlaceholder />

                <ShareButtons result={result} userInfo={userInfo} shareId={shareId} />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center bg-[#111111] p-4 border border-[#6b6b6b]">
                    <div className="md:justify-self-start">
                        <button
                            onClick={() => router.push('/')}
                            className="px-6 py-2 bg-[#333333] hover:bg-[#444444] text-white border border-gray-500 text-sm w-full md:w-auto"
                        >
                            {t('back_home')}
                        </button>
                    </div>
                    <div className="md:justify-self-center">
                        <button
                            onClick={handleSimulationClick}
                            className="px-6 py-2 bg-[#6e4e1e] hover:bg-[#856026] text-white border border-[#9f752a] text-sm font-bold shadow-lg w-full md:w-auto"
                        >
                            {language === 'ko' ? '시뮬레이션하기' : 'Run Simulation'}
                        </button>
                    </div>
                    <div className="md:justify-self-end">
                        <button
                            onClick={() => router.push('/stats')}
                            className="px-6 py-2 bg-[#1c3d5a] hover:bg-[#2c5282] text-white border border-blue-900 text-sm font-bold shadow-lg flex items-center gap-2 w-full md:w-auto"
                        >
                            <span>📊</span>
                            {language === 'ko' ? '전체 통계 보기' : 'View Global Stats'}
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
}

export default function ResultPage() {
    return (
        <Suspense fallback={<div className="p-20 text-center text-gray-400 animate-pulse">결과를 불러오는 중...</div>}>
            <ResultContent />
        </Suspense>
    );
}
