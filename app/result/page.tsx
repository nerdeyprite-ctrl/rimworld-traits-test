"use client";

import React, { useEffect, useState, useRef, useMemo, useCallback, Suspense } from 'react';
import { useTest } from '../../context/TestContext';
import { useLanguage } from '../../context/LanguageContext';
import { TestResult, Trait } from '../../types/rimworld';
import { useRouter, useSearchParams } from 'next/navigation';
import AdPlaceholder from '../../components/AdPlaceholder';
import ShareButtons from '../../components/ShareButtons';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

type TraitMod = {
    pos: string[];
    neg: string[];
    goodText?: string;
    badText?: string;
};

type SimEvent = {
    id: string;
    title: string;
    description: string;
    base: { hp: number; food: number; resources: number; };
    mods?: {
        hp?: TraitMod;
        food?: TraitMod;
        resources?: TraitMod;
    };
};

type SimLogEntry = {
    day: number;
    season: string;
    title: string;
    description: string;
    delta: { hp: number; food: number; resources: number; };
    notes?: string[];
    status?: 'good' | 'bad' | 'warn' | 'neutral';
};

type SimStatus = 'idle' | 'running' | 'dead' | 'success';

const MAX_DAYS = 60;
const START_STATS = { hp: 5, food: 5, resources: 5 };

const getSeasonLabel = (day: number, language: string) => {
    if (day <= 0) return language === 'ko' ? '시작' : 'Start';
    const seasonsKo = ['봄', '여름', '가을', '겨울'];
    const seasonsEn = ['Spring', 'Summer', 'Autumn', 'Winter'];
    const index = Math.min(3, Math.floor((day - 1) / 15));
    const seasonDay = ((day - 1) % 15) + 1;
    const seasonName = language === 'ko' ? seasonsKo[index] : seasonsEn[index];
    return language === 'ko' ? `${seasonName} ${seasonDay}일차` : `${seasonName} Day ${seasonDay}`;
};

const buildSimEvents = (language: string): SimEvent[] => {
    const isKo = language === 'ko';
    return [
        {
            id: 'quiet',
            title: isKo ? '조용한 날' : 'Quiet Day',
            description: isKo ? '큰 사건 없이 하루가 지나갔다.' : 'The day passes without major incidents.',
            base: { hp: 0, food: 0, resources: 0 }
        },
        {
            id: 'raiders',
            title: isKo ? '레이더 습격' : 'Raider Attack',
            description: isKo ? '무장한 침입자들이 기지를 습격했다.' : 'Raiders assault the colony.',
            base: { hp: -2, food: -1, resources: -1 },
            mods: {
                hp: {
                    pos: ['tough', 'brawler', 'nimble', 'careful_shooter', 'iron_willed'],
                    neg: ['wimp', 'delicate', 'slowpoke', 'nervous', 'volatile'],
                    goodText: isKo ? '전투 경험으로 피해를 줄였다.' : 'Combat instincts reduce the damage.',
                    badText: isKo ? '주저함으로 피해가 커졌다.' : 'Hesitation makes the damage worse.'
                }
            }
        },
        {
            id: 'manhunter',
            title: isKo ? '광포한 동물 무리' : 'Manhunter Pack',
            description: isKo ? '광포해진 동물들이 덮쳐왔다.' : 'A pack of enraged animals attacks.',
            base: { hp: -2, food: 1, resources: 0 },
            mods: {
                hp: {
                    pos: ['tough', 'nimble', 'brawler'],
                    neg: ['wimp', 'delicate'],
                    goodText: isKo ? '몸이 단단해 피해가 줄었다.' : 'Toughness reduces the harm.',
                    badText: isKo ? '연약해 큰 피해를 입었다.' : 'Fragility makes it worse.'
                },
                food: {
                    pos: ['industrious', 'hard_worker'],
                    neg: ['lazy', 'slothful'],
                    goodText: isKo ? '처치 후 식량을 효율적으로 확보했다.' : 'You process the meat efficiently.',
                    badText: isKo ? '처치 후 식량 처리에 실패했다.' : 'You waste part of the meat.'
                }
            }
        },
        {
            id: 'trade',
            title: isKo ? '상인 방문' : 'Trader Caravan',
            description: isKo ? '상인들이 들러 교역을 제안했다.' : 'A trader caravan offers a deal.',
            base: { hp: 0, food: 1, resources: 2 },
            mods: {
                resources: {
                    pos: ['kind', 'beautiful', 'pretty'],
                    neg: ['abrasive', 'ugly', 'staggeringly_ugly'],
                    goodText: isKo ? '호의적인 태도로 더 좋은 거래를 얻었다.' : 'Friendly manners improve the deal.',
                    badText: isKo ? '거친 태도로 손해를 봤다.' : 'Abrasive manners worsen the deal.'
                }
            }
        },
        {
            id: 'cargo_pod',
            title: isKo ? '보급 캡슐 추락' : 'Cargo Pods',
            description: isKo ? '하늘에서 보급 캡슐이 떨어졌다.' : 'Cargo pods crash nearby.',
            base: { hp: 0, food: 2, resources: 1 }
        },
        {
            id: 'blight',
            title: isKo ? '작물 역병' : 'Blight',
            description: isKo ? '작물이 역병으로 시들었다.' : 'A blight hits the crops.',
            base: { hp: 0, food: -2, resources: 0 },
            mods: {
                food: {
                    pos: ['industrious', 'hard_worker', 'fast_learner'],
                    neg: ['lazy', 'slothful', 'sickly'],
                    goodText: isKo ? '신속한 대응으로 피해를 줄였다.' : 'Quick action limits the damage.',
                    badText: isKo ? '대응이 늦어 피해가 커졌다.' : 'Slow response worsens the loss.'
                }
            }
        },
        {
            id: 'crop_boom',
            title: isKo ? '풍작' : 'Crop Boom',
            description: isKo ? '작물이 급성장해 풍작이 들었다.' : 'Crops surge with unexpected growth.',
            base: { hp: 0, food: 2, resources: 0 },
            mods: {
                food: {
                    pos: ['industrious', 'hard_worker'],
                    neg: ['lazy', 'slothful'],
                    goodText: isKo ? '풍작을 잘 수확했다.' : 'You harvest the boom efficiently.',
                    badText: isKo ? '수확이 늦어 손실이 생겼다.' : 'You fail to capitalize on the boom.'
                }
            }
        },
        {
            id: 'cold_snap',
            title: isKo ? '한파' : 'Cold Snap',
            description: isKo ? '갑작스러운 한파가 찾아왔다.' : 'A sudden cold snap hits.',
            base: { hp: -1, food: -1, resources: 0 },
            mods: {
                hp: {
                    pos: ['iron_willed', 'steadfast', 'sanguine'],
                    neg: ['depressive', 'pessimist', 'sickly'],
                    goodText: isKo ? '정신력이 버텨낸다.' : 'Strong will keeps you going.',
                    badText: isKo ? '체력이 급격히 떨어졌다.' : 'Weakness hits hard.'
                }
            }
        },
        {
            id: 'heat_wave',
            title: isKo ? '폭염' : 'Heat Wave',
            description: isKo ? '무더위가 이어졌다.' : 'Relentless heat drains you.',
            base: { hp: -1, food: 0, resources: 0 },
            mods: {
                hp: {
                    pos: ['iron_willed', 'steadfast', 'optimist'],
                    neg: ['depressive', 'pessimist', 'sickly'],
                    goodText: isKo ? '정신력이 피해를 줄였다.' : 'Mental fortitude helps endure.',
                    badText: isKo ? '컨디션이 급격히 악화됐다.' : 'Condition deteriorates quickly.'
                }
            }
        },
        {
            id: 'disease',
            title: isKo ? '질병 발생' : 'Disease Outbreak',
            description: isKo ? '질병이 퍼져 몸이 약해졌다.' : 'A disease spreads through the camp.',
            base: { hp: -2, food: -1, resources: 0 },
            mods: {
                hp: {
                    pos: ['tough', 'iron_willed'],
                    neg: ['sickly', 'delicate', 'wimp'],
                    goodText: isKo ? '강한 체력이 버텨냈다.' : 'Sturdy constitution resists.',
                    badText: isKo ? '몸이 약해 큰 피해를 입었다.' : 'Fragility makes it worse.'
                }
            }
        },
        {
            id: 'wanderer',
            title: isKo ? '방랑자 합류' : 'Wanderer Joins',
            description: isKo ? '방랑자가 합류를 요청했다.' : 'A wanderer asks to join.',
            base: { hp: 0, food: -1, resources: 1 },
            mods: {
                resources: {
                    pos: ['kind', 'sanguine'],
                    neg: ['abrasive', 'pessimist'],
                    goodText: isKo ? '협력 덕에 자원이 늘었다.' : 'Cooperation boosts resources.',
                    badText: isKo ? '갈등으로 효율이 떨어졌다.' : 'Friction reduces efficiency.'
                }
            }
        },
        {
            id: 'psychic_drone',
            title: isKo ? '사이킥 드론' : 'Psychic Drone',
            description: isKo ? '사이킥 드론이 정신을 압박한다.' : 'A psychic drone weighs on everyone.',
            base: { hp: -1, food: 0, resources: 0 },
            mods: {
                hp: {
                    pos: ['iron_willed', 'steadfast', 'sanguine'],
                    neg: ['volatile', 'nervous', 'depressive'],
                    goodText: isKo ? '강한 정신력으로 견뎠다.' : 'Strong will shrugs it off.',
                    badText: isKo ? '정신적 타격이 컸다.' : 'Mental strain hits hard.'
                }
            }
        },
        {
            id: 'ship_chunk',
            title: isKo ? '우주선 잔해' : 'Ship Chunk',
            description: isKo ? '우주선 잔해가 추락했다.' : 'A ship chunk crashes nearby.',
            base: { hp: -1, food: 0, resources: 2 },
            mods: {
                resources: {
                    pos: ['industrious', 'hard_worker'],
                    neg: ['lazy', 'slothful'],
                    goodText: isKo ? '잔해를 빠르게 회수했다.' : 'You salvage quickly.',
                    badText: isKo ? '회수에 실패해 손실이 생겼다.' : 'Salvage is inefficient.'
                }
            }
        },
        {
            id: 'fire',
            title: isKo ? '화재' : 'Fire',
            description: isKo ? '화재로 자원이 손실됐다.' : 'A fire destroys supplies.',
            base: { hp: -1, food: 0, resources: -2 },
            mods: {
                resources: {
                    pos: ['industrious', 'hard_worker'],
                    neg: ['pyromaniac', 'lazy'],
                    goodText: isKo ? '신속한 진압으로 피해를 줄였다.' : 'Quick response limits the damage.',
                    badText: isKo ? '방화 성향으로 피해가 커졌다.' : 'Pyromaniac tendencies worsen the fire.'
                }
            }
        }
    ];
};

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
    const simPanelRef = useRef<HTMLDivElement>(null);

    const [showSimulation, setShowSimulation] = useState(false);
    const [simAuto, setSimAuto] = useState(false);
    const [simState, setSimState] = useState<{
        status: SimStatus;
        day: number;
        hp: number;
        food: number;
        resources: number;
        log: SimLogEntry[];
    }>({
        status: 'idle',
        day: 0,
        hp: START_STATS.hp,
        food: START_STATS.food,
        resources: START_STATS.resources,
        log: []
    });

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

    const events = useMemo(() => buildSimEvents(language), [language]);

    const traitIds = useMemo(() => {
        const ids = new Set<string>();
        if (result?.traits) {
            result.traits.forEach((tr: any) => {
                if (typeof tr === 'string') {
                    ids.add(tr);
                } else if (tr?.id) {
                    ids.add(tr.id);
                } else if (tr?.name) {
                    ids.add(tr.name);
                }
            });
        }
        return ids;
    }, [result]);

    const getTraitScore = useCallback((mod?: TraitMod) => {
        if (!mod) return { score: 0, note: '' };
        let score = 0;
        mod.pos.forEach(id => {
            if (traitIds.has(id)) score += 1;
        });
        mod.neg.forEach(id => {
            if (traitIds.has(id)) score -= 1;
        });
        score = Math.max(-2, Math.min(2, score));
        let note = '';
        if (score > 0 && mod.goodText) note = mod.goodText;
        if (score < 0 && mod.badText) note = mod.badText;
        return { score, note };
    }, [traitIds]);

    const startSimulation = useCallback(() => {
        const introText = language === 'ko'
            ? '당신의 캐릭터는 몇일차까지 살아남을 수 있을까요?'
            : 'How many days can your character survive?';
        setSimState({
            status: 'running',
            day: 0,
            hp: START_STATS.hp,
            food: START_STATS.food,
            resources: START_STATS.resources,
            log: [{
                day: 0,
                season: getSeasonLabel(0, language),
                title: language === 'ko' ? '시뮬레이션 시작' : 'Simulation Start',
                description: introText,
                delta: { hp: 0, food: 0, resources: 0 },
                status: 'neutral'
            }]
        });
        setSimAuto(false);
    }, [language]);

    const advanceDay = useCallback(() => {
        setSimState(prev => {
            if (prev.status !== 'running') return prev;

            const nextDay = prev.day + 1;
            let hp = prev.hp;
            let food = prev.food - 1;
            let resources = prev.resources;
            const notes: string[] = [];

            if (food < 0) {
                food = 0;
                hp -= 1;
                notes.push(language === 'ko' ? '식량이 부족해 체력이 감소했다.' : 'Starvation reduces your HP.');
            }
            if (resources <= 0) {
                hp -= 1;
                notes.push(language === 'ko' ? '자원이 부족해 거처 유지에 실패했다.' : 'Lack of resources hurts your shelter.');
            }

            if (hp <= 0) {
                const deathEntry: SimLogEntry = {
                    day: nextDay,
                    season: getSeasonLabel(nextDay, language),
                    title: language === 'ko' ? '게임 오버' : 'Game Over',
                    description: language === 'ko'
                        ? '생존 유지에 실패했다.'
                        : 'You could not sustain your colony.',
                    delta: { hp: -1, food: 0, resources: 0 },
                    notes,
                    status: 'bad'
                };
                return {
                    ...prev,
                    day: nextDay,
                    hp: 0,
                    food: Math.max(0, food),
                    resources: Math.max(0, resources),
                    status: 'dead',
                    log: [deathEntry, ...prev.log].slice(0, 60)
                };
            }

            const event = events[Math.floor(Math.random() * events.length)];
            let hpDelta = event.base.hp;
            let foodDelta = event.base.food;
            let resourceDelta = event.base.resources;
            const traitNotes: string[] = [];

            if (event.mods?.hp && event.base.hp !== 0) {
                const { score, note } = getTraitScore(event.mods.hp);
                hpDelta += score;
                if (note) traitNotes.push(note);
            }
            if (event.mods?.food && event.base.food !== 0) {
                const { score, note } = getTraitScore(event.mods.food);
                foodDelta += score;
                if (note) traitNotes.push(note);
            }
            if (event.mods?.resources && event.base.resources !== 0) {
                const { score, note } = getTraitScore(event.mods.resources);
                resourceDelta += score;
                if (note) traitNotes.push(note);
            }

            hp += hpDelta;
            food += foodDelta;
            resources += resourceDelta;

            hp = Math.max(0, Math.min(10, hp));
            food = Math.max(0, Math.min(10, food));
            resources = Math.max(0, Math.min(10, resources));

            let status: SimStatus = 'running';
            if (hp <= 0) status = 'dead';
            if (nextDay >= MAX_DAYS && hp > 0) status = 'success';

            const entryStatus: SimLogEntry['status'] = hpDelta < 0 ? 'bad' : hpDelta > 0 ? 'good' : 'neutral';
            const entry: SimLogEntry = {
                day: nextDay,
                season: getSeasonLabel(nextDay, language),
                title: event.title,
                description: event.description,
                delta: { hp: hpDelta, food: foodDelta, resources: resourceDelta },
                notes: [...notes, ...traitNotes],
                status: entryStatus
            };

            const newLog = [entry, ...prev.log].slice(0, 60);

            if (status === 'success') {
                const successEntry: SimLogEntry = {
                    day: nextDay,
                    season: getSeasonLabel(nextDay, language),
                    title: language === 'ko' ? '우주선 완성' : 'Ship Complete',
                    description: language === 'ko'
                        ? '1년을 버텨 우주선을 만들고 탈출에 성공했다.'
                        : 'You survived a full year and escaped with your ship.',
                    delta: { hp: 0, food: 0, resources: 0 },
                    status: 'good'
                };
                newLog.unshift(successEntry);
            }

            return {
                ...prev,
                day: nextDay,
                hp,
                food,
                resources,
                status,
                log: newLog
            };
        });
    }, [events, getTraitScore, language]);

    useEffect(() => {
        if (!simAuto || simState.status !== 'running') return;
        const timer = setInterval(() => {
            advanceDay();
        }, 700);
        return () => clearInterval(timer);
    }, [simAuto, simState.status, advanceDay]);

    useEffect(() => {
        if (simState.status === 'dead' || simState.status === 'success') {
            setSimAuto(false);
        }
    }, [simState.status]);

    const handleUnlockSkills = () => {
        startSkillTest();
        router.push('/test');
    };

    const handleSimulationClick = () => {
        setShowSimulation(true);
        startSimulation();
        setTimeout(() => {
            simPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
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

                {showSimulation && (
                    <div ref={simPanelRef} className="bg-[#0f0f0f] border border-[#6b6b6b] p-5 shadow-xl space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                            <h3 className="text-lg font-bold text-[#9f752a]">
                                {language === 'ko' ? '생존 시뮬레이션' : 'Survival Simulation'}
                            </h3>
                            <span className="text-xs text-gray-500">
                                {language === 'ko'
                                    ? '4계절 × 15일 = 60일 생존 시 탈출 성공'
                                    : '4 Seasons × 15 days = Escape if you survive 60 days'}
                            </span>
                        </div>

                        <p className="text-sm text-gray-400">
                            {language === 'ko'
                                ? '당신의 캐릭터는 몇일차까지 살아남을 수 있을까요?'
                                : 'How many days can your character survive?'}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
                            <div className="bg-black/40 border border-gray-700 p-2">
                                <div className="text-gray-500">{language === 'ko' ? '현재 일차' : 'Day'}</div>
                                <div className="text-white font-bold">{simState.day} / {MAX_DAYS}</div>
                            </div>
                            <div className="bg-black/40 border border-gray-700 p-2">
                                <div className="text-gray-500">{language === 'ko' ? '계절' : 'Season'}</div>
                                <div className="text-white font-bold">{getSeasonLabel(simState.day, language)}</div>
                            </div>
                            <div className="bg-black/40 border border-gray-700 p-2">
                                <div className="text-gray-500">HP</div>
                                <div className="text-white font-bold">{simState.hp} / 10</div>
                            </div>
                            <div className="bg-black/40 border border-gray-700 p-2">
                                <div className="text-gray-500">{language === 'ko' ? '식량' : 'Food'}</div>
                                <div className="text-white font-bold">{simState.food} / 10</div>
                            </div>
                            <div className="bg-black/40 border border-gray-700 p-2">
                                <div className="text-gray-500">{language === 'ko' ? '자원' : 'Resources'}</div>
                                <div className="text-white font-bold">{simState.resources} / 10</div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={startSimulation}
                                className="px-4 py-2 bg-[#9f752a] hover:bg-[#b08535] text-white text-sm font-bold border border-[#7a5a20]"
                            >
                                {language === 'ko' ? '시뮬레이션 시작/재시작' : 'Start/Restart'}
                            </button>
                            <button
                                onClick={advanceDay}
                                disabled={simState.status !== 'running'}
                                className={`px-4 py-2 text-sm font-bold border ${simState.status === 'running'
                                    ? 'bg-[#1c3d5a] hover:bg-[#2c5282] text-white border-blue-900'
                                    : 'bg-[#333] text-gray-500 border-gray-700 cursor-not-allowed'}`}
                            >
                                {language === 'ko' ? '하루 진행' : 'Advance Day'}
                            </button>
                            <button
                                onClick={() => setSimAuto(prev => !prev)}
                                disabled={simState.status !== 'running'}
                                className={`px-4 py-2 text-sm font-bold border ${simState.status === 'running'
                                    ? 'bg-[#2b2b2b] hover:bg-[#3a3a3a] text-white border-gray-600'
                                    : 'bg-[#333] text-gray-500 border-gray-700 cursor-not-allowed'}`}
                            >
                                {simAuto
                                    ? (language === 'ko' ? '자동 진행 일시정지' : 'Pause Auto')
                                    : (language === 'ko' ? '자동 진행 시작' : 'Start Auto')}
                            </button>
                        </div>

                        {simState.status === 'dead' && (
                            <div className="text-red-400 text-sm font-bold">
                                {language === 'ko' ? `${simState.day}일차에 사망했습니다.` : `You died on day ${simState.day}.`}
                            </div>
                        )}
                        {simState.status === 'success' && (
                            <div className="text-green-400 text-sm font-bold">
                                {language === 'ko' ? '60일 생존! 우주선 탈출 성공.' : 'Survived 60 days! Escape successful.'}
                            </div>
                        )}

                        <div className="max-h-56 overflow-y-auto border border-gray-800 bg-black/30 p-3 space-y-3 text-xs">
                            {simState.log.length === 0 && (
                                <div className="text-gray-500">
                                    {language === 'ko' ? '로그가 비어 있습니다.' : 'No logs yet.'}
                                </div>
                            )}
                            {simState.log.map((entry, idx) => (
                                <div key={`${entry.day}-${idx}`} className="border-b border-gray-800 pb-2">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="text-gray-500">
                                            Day {entry.day} • {entry.season}
                                        </div>
                                        <div className={`font-bold ${entry.status === 'good'
                                            ? 'text-green-400'
                                            : entry.status === 'bad'
                                                ? 'text-red-400'
                                                : 'text-gray-200'}`}
                                        >
                                            {entry.title}
                                        </div>
                                        <div className="text-gray-400">
                                            HP {entry.delta.hp >= 0 ? `+${entry.delta.hp}` : entry.delta.hp} / {language === 'ko' ? '식량' : 'Food'} {entry.delta.food >= 0 ? `+${entry.delta.food}` : entry.delta.food} / {language === 'ko' ? '자원' : 'Resources'} {entry.delta.resources >= 0 ? `+${entry.delta.resources}` : entry.delta.resources}
                                        </div>
                                    </div>
                                    <div className="text-gray-300 mt-1">{entry.description}</div>
                                    {entry.notes && entry.notes.length > 0 && (
                                        <div className="text-[11px] text-[#9f752a] mt-1">
                                            {entry.notes.join(' ')}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

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
