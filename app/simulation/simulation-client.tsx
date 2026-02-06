"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTest } from '../../context/TestContext';
import { useLanguage } from '../../context/LanguageContext';
import { TestResult } from '../../types/rimworld';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

type TraitMod = {
    pos: string[];
    neg: string[];
    goodText?: string;
    badText?: string;
};

type SimChoice = {
    id: string;
    label: string;
    description?: string;
    delta: { hp: number; meds: number; money: number };
    response?: string;
    skillGroup?: 'combat' | 'noncombat';
    skillTargets?: Array<'hp' | 'meds' | 'money'>;
};

type SimEventCategory = 'quiet' | 'noncombat' | 'danger';

type SimEvent = {
    id: string;
    title: string;
    description: string;
    category: SimEventCategory;
    weight: number;
    base: { hp: number; meds: number; money: number };
    traitMods?: {
        hp?: TraitMod;
        meds?: TraitMod;
        money?: TraitMod;
    };
    skillGroup?: 'combat' | 'noncombat';
    skillTargets?: Array<'hp' | 'meds' | 'money'>;
    choices?: SimChoice[];
};

type SimLogEntry = {
    day: number;
    season: string;
    title: string;
    description: string;
    response: string;
    delta: { hp: number; meds: number; money: number };
    after: { hp: number; meds: number; money: number };
    status?: 'good' | 'bad' | 'warn' | 'neutral';
};

type SimStatus = 'idle' | 'running' | 'dead' | 'success';

type PendingChoice = {
    day: number;
    season: string;
    event: SimEvent;
    dayStart: { hp: number; meds: number; money: number };
    baseAfter: { hp: number; meds: number; money: number };
    responseNotes: string[];
};

const MAX_DAYS = 60;
const START_STATS = { hp: 5, meds: 5, money: 5 };
const AUTO_INTERVAL_MS = 1500;

const COMBAT_SKILLS = ['Shooting', 'Melee', 'Medicine'] as const;
const NONCOMBAT_SKILLS = ['Plants', 'Cooking', 'Construction', 'Mining', 'Crafting', 'Social', 'Animals'] as const;

const clampStat = (value: number) => Math.max(0, Math.min(10, value));

const getSeasonLabel = (day: number, language: string) => {
    if (day <= 0) return language === 'ko' ? '시작' : 'Start';
    const seasonsKo = ['봄', '여름', '가을', '겨울'];
    const seasonsEn = ['Spring', 'Summer', 'Autumn', 'Winter'];
    const index = Math.min(3, Math.floor((day - 1) / 15));
    const seasonDay = ((day - 1) % 15) + 1;
    const seasonName = language === 'ko' ? seasonsKo[index] : seasonsEn[index];
    return language === 'ko' ? `${seasonName} ${seasonDay}일차` : `${seasonName} Day ${seasonDay}`;
};

const buildSupplyEvent = (language: string, money: number): SimEvent => {
    const isKo = language === 'ko';
    const choices: SimChoice[] = [];

    if (money >= 2) {
        choices.push({
            id: 'buy_large',
            label: isKo ? '대량 구매' : 'Buy Large',
            description: isKo ? '돈 2 → 치료제 4' : 'Money 2 → Meds 4',
            delta: { hp: 0, meds: 4, money: -2 },
            response: isKo ? '돈을 더 지불하고 치료제를 대량으로 구매했다.' : 'You buy a large supply of meds.'
        });
    }
    if (money >= 1) {
        choices.push({
            id: 'buy_small',
            label: isKo ? '소량 구매' : 'Buy Small',
            description: isKo ? '돈 1 → 치료제 2' : 'Money 1 → Meds 2',
            delta: { hp: 0, meds: 2, money: -1 },
            response: isKo ? '돈을 조금 써서 치료제를 구매했다.' : 'You buy a small amount of meds.'
        });
    }
    choices.push({
        id: 'skip',
        label: isKo ? '구매하지 않음' : 'Skip',
        description: isKo ? '거래를 포기한다.' : 'You skip the deal.',
        delta: { hp: 0, meds: 0, money: 0 },
        response: isKo ? '거래를 포기하고 넘어갔다.' : 'You pass on the offer.'
    });

    return {
        id: 'supply_buy',
        title: isKo ? '치료제 상인 등장' : 'Supply Trader',
        description: isKo ? '치료제를 살 수 있는 상인이 나타났다.' : 'A trader offers meds for money.',
        category: 'noncombat',
        weight: 0,
        base: { hp: 0, meds: 0, money: 0 },
        skillGroup: 'noncombat',
        skillTargets: ['meds', 'money'],
        choices
    };
};

const buildSimEvents = (language: string): SimEvent[] => {
    const isKo = language === 'ko';
    return [
        {
            id: 'quiet_day',
            title: isKo ? '조용한 날' : 'Quiet Day',
            description: isKo ? '큰 사건 없이 하루가 지나갔다.' : 'The day passes without major incidents.',
            category: 'quiet',
            weight: 40,
            base: { hp: 0, meds: 0, money: 0 }
        },
        {
            id: 'trade',
            title: isKo ? '상인 방문' : 'Trader Caravan',
            description: isKo ? '상인들이 들러 교역을 제안했다.' : 'A trader caravan offers a deal.',
            category: 'noncombat',
            weight: 7,
            base: { hp: 0, meds: 1, money: 2 },
            skillGroup: 'noncombat',
            skillTargets: ['money'],
            traitMods: {
                money: {
                    pos: ['kind', 'beautiful', 'pretty'],
                    neg: ['abrasive', 'ugly', 'staggeringly_ugly'],
                    goodText: isKo ? '호의적인 태도로 더 좋은 거래를 얻었다.' : 'Friendly manners improve the deal.',
                    badText: isKo ? '거친 태도로 손해를 봤다.' : 'Abrasive manners worsen the deal.'
                }
            }
        },
        {
            id: 'cargo_pods',
            title: isKo ? '보급 캡슐 추락' : 'Cargo Pods',
            description: isKo ? '하늘에서 보급 캡슐이 떨어졌다.' : 'Cargo pods crash nearby.',
            category: 'noncombat',
            weight: 7,
            base: { hp: 0, meds: 2, money: 1 },
            skillGroup: 'noncombat',
            skillTargets: ['meds', 'money']
        },
        {
            id: 'crop_boom',
            title: isKo ? '풍작' : 'Crop Boom',
            description: isKo ? '작물이 급성장해 풍작이 들었다.' : 'Crops surge with unexpected growth.',
            category: 'noncombat',
            weight: 7,
            base: { hp: 0, meds: 2, money: 0 },
            skillGroup: 'noncombat',
            skillTargets: ['meds'],
            traitMods: {
                meds: {
                    pos: ['industrious', 'hard_worker'],
                    neg: ['lazy', 'slothful'],
                    goodText: isKo ? '풍작을 잘 수확했다.' : 'You harvest the boom efficiently.',
                    badText: isKo ? '수확이 늦어 손실이 생겼다.' : 'You fail to capitalize on the boom.'
                }
            }
        },
        {
            id: 'ship_chunk',
            title: isKo ? '우주선 잔해' : 'Ship Chunk',
            description: isKo ? '우주선 잔해가 추락했다.' : 'A ship chunk crashes nearby.',
            category: 'noncombat',
            weight: 7,
            base: { hp: 0, meds: 0, money: 2 },
            skillGroup: 'noncombat',
            skillTargets: ['money'],
            traitMods: {
                money: {
                    pos: ['industrious', 'hard_worker'],
                    neg: ['lazy', 'slothful'],
                    goodText: isKo ? '잔해를 빠르게 회수했다.' : 'You salvage quickly.',
                    badText: isKo ? '회수에 실패해 손실이 생겼다.' : 'Salvage is inefficient.'
                }
            }
        },
        {
            id: 'blight',
            title: isKo ? '작물 역병' : 'Blight',
            description: isKo ? '작물이 역병으로 시들었다.' : 'A blight hits the crops.',
            category: 'noncombat',
            weight: 6,
            base: { hp: 0, meds: -2, money: 0 },
            skillGroup: 'noncombat',
            skillTargets: ['meds'],
            traitMods: {
                meds: {
                    pos: ['industrious', 'hard_worker', 'fast_learner'],
                    neg: ['lazy', 'slothful', 'sickly'],
                    goodText: isKo ? '신속한 대응으로 피해를 줄였다.' : 'Quick action limits the damage.',
                    badText: isKo ? '대응이 늦어 피해가 커졌다.' : 'Slow response worsens the loss.'
                }
            }
        },
        {
            id: 'wanderer',
            title: isKo ? '방랑자 합류' : 'Wanderer Joins',
            description: isKo ? '방랑자가 합류를 요청했다.' : 'A wanderer asks to join.',
            category: 'noncombat',
            weight: 6,
            base: { hp: 0, meds: -1, money: 1 },
            skillGroup: 'noncombat',
            skillTargets: ['money'],
            traitMods: {
                money: {
                    pos: ['kind', 'sanguine'],
                    neg: ['abrasive', 'pessimist'],
                    goodText: isKo ? '협력 덕에 돈이 늘었다.' : 'Cooperation boosts your money.',
                    badText: isKo ? '갈등으로 효율이 떨어졌다.' : 'Friction reduces efficiency.'
                }
            }
        },
        {
            id: 'raiders',
            title: isKo ? '레이더 습격' : 'Raider Attack',
            description: isKo ? '무장한 침입자들이 기지를 습격했다.' : 'Raiders assault the colony.',
            category: 'danger',
            weight: 4,
            base: { hp: -2, meds: -1, money: -1 },
            skillGroup: 'combat',
            skillTargets: ['hp', 'money'],
            traitMods: {
                hp: {
                    pos: ['tough', 'brawler', 'nimble', 'careful_shooter', 'iron_willed'],
                    neg: ['wimp', 'delicate', 'slowpoke', 'nervous', 'volatile'],
                    goodText: isKo ? '전투 경험으로 피해를 줄였다.' : 'Combat instincts reduce the damage.',
                    badText: isKo ? '주저함으로 피해가 커졌다.' : 'Hesitation makes the damage worse.'
                }
            },
            choices: [
                {
                    id: 'raid_fight',
                    label: isKo ? '정면전' : 'Full Assault',
                    description: isKo ? '큰 피해를 감수하고 맞선다.' : 'Take heavy damage to repel them.',
                    delta: { hp: -1, meds: 0, money: 1 },
                    response: isKo ? '정면으로 맞서 일부 전리품을 확보했다.' : 'You fight head-on and salvage some loot.'
                },
                {
                    id: 'raid_defend',
                    label: isKo ? '방어전' : 'Hold Position',
                    description: isKo ? '피해를 줄이지만 비용이 든다.' : 'Reduce damage at a cost.',
                    delta: { hp: 1, meds: 0, money: -1 },
                    response: isKo ? '방어선을 구축해 피해를 최소화했다.' : 'You fortify and reduce losses.'
                },
                {
                    id: 'raid_retreat',
                    label: isKo ? '후퇴' : 'Retreat',
                    description: isKo ? '물자를 포기하고 빠진다.' : 'Give up supplies and retreat.',
                    delta: { hp: 0, meds: -1, money: -2 },
                    response: isKo ? '물자를 포기하고 후퇴했다.' : 'You abandon supplies and retreat.'
                }
            ]
        },
        {
            id: 'manhunter',
            title: isKo ? '광포한 동물 무리' : 'Manhunter Pack',
            description: isKo ? '광포해진 동물들이 덮쳐왔다.' : 'A pack of enraged animals attacks.',
            category: 'danger',
            weight: 4,
            base: { hp: -2, meds: 1, money: 0 },
            skillGroup: 'combat',
            skillTargets: ['hp'],
            traitMods: {
                hp: {
                    pos: ['tough', 'nimble', 'brawler'],
                    neg: ['wimp', 'delicate'],
                    goodText: isKo ? '몸이 단단해 피해가 줄었다.' : 'Toughness reduces the harm.',
                    badText: isKo ? '연약해 큰 피해를 입었다.' : 'Fragility makes it worse.'
                },
                meds: {
                    pos: ['industrious', 'hard_worker'],
                    neg: ['lazy', 'slothful'],
                    goodText: isKo ? '처치 후 치료제를 효율적으로 확보했다.' : 'You process the meat efficiently.',
                    badText: isKo ? '처치 후 치료제 처리에 실패했다.' : 'You waste part of the meat.'
                }
            },
            choices: [
                {
                    id: 'hunt',
                    label: isKo ? '사냥' : 'Hunt',
                    description: isKo ? '위험하지만 더 많은 치료제를 얻는다.' : 'Risk more for extra meds.',
                    delta: { hp: -1, meds: 2, money: 0 },
                    response: isKo ? '사냥으로 더 많은 치료제를 확보했다.' : 'You secure extra meds by hunting.'
                },
                {
                    id: 'defend',
                    label: isKo ? '방어' : 'Defend',
                    description: isKo ? '안전하게 방어한다.' : 'Play it safe.',
                    delta: { hp: 1, meds: 0, money: 0 },
                    response: isKo ? '방어를 택해 피해를 줄였다.' : 'You defend to reduce damage.'
                },
                {
                    id: 'avoid',
                    label: isKo ? '회피' : 'Avoid',
                    description: isKo ? '피해를 피하지만 수확이 없다.' : 'Avoid damage but gain nothing.',
                    delta: { hp: 2, meds: -1, money: 0 },
                    response: isKo ? '회피에 성공했지만 수확이 줄었다.' : 'You avoid danger but lose the harvest.'
                }
            ]
        },
        {
            id: 'disease',
            title: isKo ? '질병 발생' : 'Disease Outbreak',
            description: isKo ? '질병이 퍼져 몸이 약해졌다.' : 'A disease spreads through the camp.',
            category: 'danger',
            weight: 3,
            base: { hp: -2, meds: -1, money: 0 },
            skillGroup: 'combat',
            skillTargets: ['hp'],
            traitMods: {
                hp: {
                    pos: ['tough', 'iron_willed'],
                    neg: ['sickly', 'delicate', 'wimp'],
                    goodText: isKo ? '강한 체력이 버텨냈다.' : 'Sturdy constitution resists.',
                    badText: isKo ? '몸이 약해 큰 피해를 입었다.' : 'Fragility makes it worse.'
                }
            }
        },
        {
            id: 'cold_snap',
            title: isKo ? '한파' : 'Cold Snap',
            description: isKo ? '갑작스러운 한파가 찾아왔다.' : 'A sudden cold snap hits.',
            category: 'danger',
            weight: 3,
            base: { hp: -1, meds: -1, money: 0 },
            skillGroup: 'noncombat',
            skillTargets: ['meds'],
            traitMods: {
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
            category: 'danger',
            weight: 3,
            base: { hp: -1, meds: 0, money: 0 },
            skillGroup: 'noncombat',
            skillTargets: ['money'],
            traitMods: {
                hp: {
                    pos: ['iron_willed', 'steadfast', 'optimist'],
                    neg: ['depressive', 'pessimist', 'sickly'],
                    goodText: isKo ? '정신력이 피해를 줄였다.' : 'Mental fortitude helps endure.',
                    badText: isKo ? '컨디션이 급격히 악화됐다.' : 'Condition deteriorates quickly.'
                }
            }
        },
        {
            id: 'fire',
            title: isKo ? '화재' : 'Fire',
            description: isKo ? '화재로 돈이 손실됐다.' : 'A fire destroys your funds.',
            category: 'danger',
            weight: 3,
            base: { hp: -1, meds: 0, money: -2 },
            skillGroup: 'noncombat',
            skillTargets: ['money'],
            traitMods: {
                money: {
                    pos: ['industrious', 'hard_worker'],
                    neg: ['pyromaniac', 'lazy'],
                    goodText: isKo ? '신속한 진압으로 피해를 줄였다.' : 'Quick response limits the damage.',
                    badText: isKo ? '방화 성향으로 피해가 커졌다.' : 'Pyromaniac tendencies worsen the fire.'
                }
            }
        }
    ];
};

const pickWeightedEvent = (events: SimEvent[]) => {
    const total = events.reduce((sum, e) => sum + e.weight, 0);
    const roll = Math.random() * total;
    let acc = 0;
    for (const e of events) {
        acc += e.weight;
        if (roll <= acc) return e;
    }
    return events[0];
};

export default function SimulationClient() {
    const { calculateFinalTraits, userInfo: contextUserInfo, testPhase: contextTestPhase, startSkillTest } = useTest();
    const { language } = useLanguage();
    const router = useRouter();
    const searchParams = useSearchParams();
    const s = searchParams.get('s');

    const [result, setResult] = useState<TestResult | null>(null);
    const [localUserInfo, setLocalUserInfo] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [isFullResult, setIsFullResult] = useState(false);
    const [simAuto, setSimAuto] = useState(false);
    const [pendingChoice, setPendingChoice] = useState<PendingChoice | null>(null);
    const autoResumeRef = useRef(false);
    const [simState, setSimState] = useState<{
        status: SimStatus;
        day: number;
        hp: number;
        meds: number;
        money: number;
        log: SimLogEntry[];
    }>({
        status: 'idle',
        day: 0,
        hp: START_STATS.hp,
        meds: START_STATS.meds,
        money: START_STATS.money,
        log: []
    });

    const userInfo = localUserInfo || contextUserInfo;

    useEffect(() => {
        const fetchSharedResult = async () => {
            if (s) {
                if (!isSupabaseConfigured()) {
                    setIsFullResult(false);
                    return;
                }
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
                    }
                } catch (err) {
                    console.error("Failed to fetch shared result:", err);
                } finally {
                    setLoading(false);
                }
            } else {
                const res = calculateFinalTraits();
                setResult(res);
                setIsFullResult(contextTestPhase === 'skill');
            }
        };
        fetchSharedResult();
    }, [s, language, contextTestPhase, calculateFinalTraits]);

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

    const skillMap = useMemo(() => {
        const map: Record<string, number> = {};
        if (result?.skills) {
            result.skills.forEach(skill => {
                map[skill.name] = skill.level;
            });
        }
        return map;
    }, [result]);

    const events = useMemo(() => buildSimEvents(language), [language]);

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

    const getSkillBonus = useCallback((group?: 'combat' | 'noncombat') => {
        if (!group) return { bonus: 0, note: '' };
        const pool = group === 'combat' ? COMBAT_SKILLS : NONCOMBAT_SKILLS;
        const levels = pool.map(name => skillMap[name] ?? 0);
        const avg = levels.reduce((sum, v) => sum + v, 0) / levels.length;
        let bonus = 0;
        if (avg <= 3) bonus = -1;
        else if (avg >= 13) bonus = 2;
        else if (avg >= 8) bonus = 1;

        let note = '';
        if (group === 'combat') {
            if (bonus > 0) note = language === 'ko' ? '전투 기술로 피해를 줄였다.' : 'Combat skills reduce the damage.';
            else if (bonus < 0) note = language === 'ko' ? '전투 기술이 부족해 피해가 커졌다.' : 'Poor combat skills worsen the damage.';
            else note = language === 'ko' ? '무난하게 전투에 대응했다.' : 'You handled the fight decently.';
        } else {
            if (bonus > 0) note = language === 'ko' ? '기술을 활용해 손실을 줄였다.' : 'Your skills limit the losses.';
            else if (bonus < 0) note = language === 'ko' ? '기술 부족으로 효율이 떨어졌다.' : 'Lack of skill reduces efficiency.';
            else note = language === 'ko' ? '무난하게 처리했다.' : 'You handled it adequately.';
        }
        return { bonus, note };
    }, [language, skillMap]);

    const startSimulation = useCallback(() => {
        const introText = language === 'ko'
            ? '당신의 캐릭터는 몇일차까지 살아남을 수 있을까요?'
            : 'How many days can your character survive?';
        setSimState({
            status: 'running',
            day: 0,
            hp: START_STATS.hp,
            meds: START_STATS.meds,
            money: START_STATS.money,
            log: [{
                day: 0,
                season: getSeasonLabel(0, language),
                title: language === 'ko' ? '시뮬레이션 시작' : 'Simulation Start',
                description: introText,
                response: language === 'ko' ? '생존 준비를 시작했다.' : 'You begin preparing for survival.',
                delta: { hp: 0, meds: 0, money: 0 },
                after: { hp: START_STATS.hp, meds: START_STATS.meds, money: START_STATS.money },
                status: 'neutral'
            }]
        });
        setPendingChoice(null);
        autoResumeRef.current = false;
        setSimAuto(false);
    }, [language]);

    const buildResponseText = (baseNotes: string[], traitNotes: string[], skillNote: string, choiceResponse?: string) => {
        const parts = [] as string[];
        if (choiceResponse) parts.push(choiceResponse);
        if (skillNote) parts.push(skillNote);
        if (traitNotes.length > 0) parts.push(...traitNotes);
        if (baseNotes.length > 0) parts.push(...baseNotes);
        return parts.filter(Boolean).join(' ') || (language === 'ko' ? '무난하게 하루를 버텼다.' : 'You made it through the day.');
    };

    const resolveEvent = (
        event: SimEvent,
        dayStart: { hp: number; meds: number; money: number },
        baseAfter: { hp: number; meds: number; money: number },
        baseNotes: string[],
        choice?: SimChoice
    ) => {
        let hp = baseAfter.hp;
        let meds = baseAfter.meds;
        let money = baseAfter.money;

        let hpDelta = event.base.hp + (choice?.delta.hp || 0);
        let medsDelta = event.base.meds + (choice?.delta.meds || 0);
        let moneyDelta = event.base.money + (choice?.delta.money || 0);
        const traitNotes: string[] = [];

        if (event.traitMods?.hp && (event.base.hp !== 0 || choice?.delta.hp)) {
            const { score, note } = getTraitScore(event.traitMods.hp);
            hpDelta += score;
            if (note) traitNotes.push(note);
        }
        if (event.traitMods?.meds && (event.base.meds !== 0 || choice?.delta.meds)) {
            const { score, note } = getTraitScore(event.traitMods.meds);
            medsDelta += score;
            if (note) traitNotes.push(note);
        }
        if (event.traitMods?.money && (event.base.money !== 0 || choice?.delta.money)) {
            const { score, note } = getTraitScore(event.traitMods.money);
            moneyDelta += score;
            if (note) traitNotes.push(note);
        }

        const skillGroup = choice?.skillGroup || event.skillGroup;
        const skillTargets = choice?.skillTargets || event.skillTargets;
        let skillNote = '';
        if (skillGroup && skillTargets && skillTargets.length > 0) {
            const { bonus, note } = getSkillBonus(skillGroup);
            skillTargets.forEach(target => {
                if (target === 'hp') hpDelta += bonus;
                if (target === 'meds') medsDelta += bonus;
                if (target === 'money') moneyDelta += bonus;
            });
            skillNote = note;
        }

        hp += hpDelta;
        meds += medsDelta;
        money += moneyDelta;

        hp = clampStat(hp);
        meds = clampStat(meds);
        money = clampStat(money);

        const delta = {
            hp: hp - dayStart.hp,
            meds: meds - dayStart.meds,
            money: money - dayStart.money
        };

        const responseText = buildResponseText(baseNotes, traitNotes, skillNote, choice?.response);

        return {
            after: { hp, meds, money },
            delta,
            responseText,
            status: hp <= 0 ? 'dead' : 'running'
        };
    };

    const advanceDay = useCallback(() => {
        if (simState.status !== 'running' || pendingChoice) return;

        const dayStart = { hp: simState.hp, meds: simState.meds, money: simState.money };
        const nextDay = simState.day + 1;
        const season = getSeasonLabel(nextDay, language);

        let hp = simState.hp;
        let meds = simState.meds;
        let money = simState.money;
        const responseNotes: string[] = [];

        if (hp <= 3 && meds > 0) {
            meds -= 1;
            hp += 2;
            responseNotes.push(language === 'ko' ? '치료제를 사용해 HP +2 회복했다.' : 'Used meds to heal +2 HP.');
        }
        if (money <= 0) {
            hp -= 1;
            responseNotes.push(language === 'ko' ? '돈이 부족해 거처 유지에 실패했다.' : 'No money to maintain shelter.');
        }

        hp = clampStat(hp);
        meds = clampStat(meds);
        money = clampStat(money);

        if (hp <= 0) {
            const delta = {
                hp: hp - dayStart.hp,
                meds: meds - dayStart.meds,
                money: money - dayStart.money
            };
            const entry: SimLogEntry = {
                day: nextDay,
                season,
                title: language === 'ko' ? '게임 오버' : 'Game Over',
                description: language === 'ko' ? '생존 유지에 실패했다.' : 'You could not sustain your colony.',
                response: responseNotes.join(' '),
                delta,
                after: { hp, meds, money },
                status: 'bad'
            };
            setSimState(prev => ({
                ...prev,
                day: nextDay,
                hp,
                meds,
                money,
                status: 'dead',
                log: [entry, ...prev.log].slice(0, 60)
            }));
            return;
        }

        let event: SimEvent;
        if (meds === 0 && money > 0 && Math.random() < 0.4) {
            event = buildSupplyEvent(language, money);
        } else {
            event = pickWeightedEvent(events);
        }

        if (event.choices && event.choices.length > 0) {
            autoResumeRef.current = simAuto;
            setSimAuto(false);
            setPendingChoice({
                day: nextDay,
                season,
                event,
                dayStart,
                baseAfter: { hp, meds, money },
                responseNotes
            });
            setSimState(prev => ({
                ...prev,
                day: nextDay,
                hp,
                meds,
                money
            }));
            return;
        }

        const resolved = resolveEvent(event, dayStart, { hp, meds, money }, responseNotes);
        const entryStatus: SimLogEntry['status'] = resolved.delta.hp < 0 ? 'bad' : resolved.delta.hp > 0 ? 'good' : 'neutral';
        const entry: SimLogEntry = {
            day: nextDay,
            season,
            title: event.title,
            description: event.description,
            response: resolved.responseText,
            delta: resolved.delta,
            after: resolved.after,
            status: entryStatus
        };

        const status: SimStatus = resolved.after.hp <= 0 ? 'dead' : (nextDay >= MAX_DAYS ? 'success' : 'running');

        setSimState(prev => {
            const log = [entry, ...prev.log].slice(0, 60);
            if (status === 'success') {
                log.unshift({
                    day: nextDay,
                    season,
                    title: language === 'ko' ? '우주선 완성' : 'Ship Complete',
                    description: language === 'ko'
                        ? '1년을 버텨 우주선을 만들고 탈출에 성공했다.'
                        : 'You survived a full year and escaped with your ship.',
                    response: language === 'ko' ? '모든 준비를 마쳤다.' : 'You complete all preparations.',
                    delta: { hp: 0, meds: 0, money: 0 },
                    after: resolved.after,
                    status: 'good'
                });
            }

            return {
                ...prev,
                day: nextDay,
                hp: resolved.after.hp,
                meds: resolved.after.meds,
                money: resolved.after.money,
                status,
                log
            };
        });
    }, [simState, pendingChoice, simAuto, language, events, skillMap, getTraitScore, getSkillBonus]);

    const resolveChoice = (choiceId: string) => {
        if (!pendingChoice) return;
        const choice = pendingChoice.event.choices?.find(c => c.id === choiceId);
        if (!choice) return;

        const resolved = resolveEvent(
            pendingChoice.event,
            pendingChoice.dayStart,
            pendingChoice.baseAfter,
            pendingChoice.responseNotes,
            choice
        );

        const entryStatus: SimLogEntry['status'] = resolved.delta.hp < 0 ? 'bad' : resolved.delta.hp > 0 ? 'good' : 'neutral';
        const entry: SimLogEntry = {
            day: pendingChoice.day,
            season: pendingChoice.season,
            title: pendingChoice.event.title,
            description: pendingChoice.event.description,
            response: resolved.responseText,
            delta: resolved.delta,
            after: resolved.after,
            status: entryStatus
        };

        const status: SimStatus = resolved.after.hp <= 0 ? 'dead' : (pendingChoice.day >= MAX_DAYS ? 'success' : 'running');

        setSimState(prev => {
            const log = [entry, ...prev.log].slice(0, 60);
            if (status === 'success') {
                log.unshift({
                    day: pendingChoice.day,
                    season: pendingChoice.season,
                    title: language === 'ko' ? '우주선 완성' : 'Ship Complete',
                    description: language === 'ko'
                        ? '1년을 버텨 우주선을 만들고 탈출에 성공했다.'
                        : 'You survived a full year and escaped with your ship.',
                    response: language === 'ko' ? '모든 준비를 마쳤다.' : 'You complete all preparations.',
                    delta: { hp: 0, meds: 0, money: 0 },
                    after: resolved.after,
                    status: 'good'
                });
            }

            return {
                ...prev,
                hp: resolved.after.hp,
                meds: resolved.after.meds,
                money: resolved.after.money,
                status,
                log
            };
        });
        const shouldResume = autoResumeRef.current && status === 'running';
        autoResumeRef.current = false;
        setPendingChoice(null);
        if (shouldResume) setSimAuto(true);
    };

    useEffect(() => {
        if (!simAuto || simState.status !== 'running' || pendingChoice) return;
        const timer = setInterval(() => {
            advanceDay();
        }, AUTO_INTERVAL_MS);
        return () => clearInterval(timer);
    }, [simAuto, simState.status, pendingChoice, advanceDay]);

    useEffect(() => {
        if (simState.status === 'dead' || simState.status === 'success') {
            setSimAuto(false);
        }
    }, [simState.status]);

    if (loading) {
        return <div className="p-20 text-center text-gray-400 animate-pulse">{language === 'ko' ? '결과를 불러오는 중...' : 'Loading results...'}</div>;
    }

    if (!result) {
        return <div className="p-10 text-center text-gray-500">{language === 'ko' ? '결과가 없습니다.' : 'No result found.'}</div>;
    }

    const canSimulate = isFullResult && result.skills && result.skills.length > 0;

    if (!canSimulate) {
        return (
            <div className="max-w-2xl mx-auto text-center bg-[#1b1b1b] border border-[#6b6b6b] p-8">
                <h1 className="text-2xl font-bold text-white mb-4">
                    {language === 'ko' ? '시뮬레이션 이용 불가' : 'Simulation Locked'}
                </h1>
                <p className="text-gray-400 mb-6">
                    {language === 'ko'
                        ? '스킬 설문까지 완료해야 시뮬레이션이 가능합니다.'
                        : 'You need to complete the skill test to run the simulation.'}
                </p>
                {contextTestPhase !== 'skill' && !s && (
                    <button
                        onClick={() => { startSkillTest(); router.push('/test'); }}
                        className="px-6 py-3 bg-[#9f752a] hover:bg-[#b08535] text-white font-bold border border-[#7a5a20]"
                    >
                        {language === 'ko' ? '스킬 설문으로 이동' : 'Go to Skill Test'}
                    </button>
                )}
                {(s || contextTestPhase === 'skill') && (
                    <button
                        onClick={() => router.push('/test/intro')}
                        className="px-6 py-3 bg-[#1c3d5a] hover:bg-[#2c5282] text-white font-bold border border-[#102a43]"
                    >
                        {language === 'ko' ? '테스트 다시 시작' : 'Start Test'}
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-[#9f752a]">
                        {language === 'ko' ? '생존 시뮬레이션' : 'Survival Simulation'}
                    </h1>
                    <p className="text-sm text-gray-400">
                        {language === 'ko'
                            ? '4계절 × 15일 = 60일 생존 시 우주선 탈출 성공'
                            : '4 Seasons × 15 days = Escape if you survive 60 days'}
                    </p>
                </div>
                <div className="text-right text-xs text-gray-500">
                    {language === 'ko' ? '정착민' : 'Colonist'}: <span className="text-gray-200">{userInfo?.name || '정착민'}</span>
                </div>
            </div>

            <div className="bg-[#111111] border border-[#6b6b6b] p-4 md:p-6 space-y-4">
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
                        <div className="text-gray-500">{language === 'ko' ? '치료제' : 'Meds'}</div>
                        <div className="text-white font-bold">{simState.meds} / 10</div>
                    </div>
                    <div className="bg-black/40 border border-gray-700 p-2">
                        <div className="text-gray-500">{language === 'ko' ? '돈' : 'Money'}</div>
                        <div className="text-white font-bold">{simState.money} / 10</div>
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
                        disabled={simState.status !== 'running' || !!pendingChoice}
                        className={`px-4 py-2 text-sm font-bold border ${simState.status === 'running' && !pendingChoice
                            ? 'bg-[#1c3d5a] hover:bg-[#2c5282] text-white border-blue-900'
                            : 'bg-[#333] text-gray-500 border-gray-700 cursor-not-allowed'}`}
                    >
                        {language === 'ko' ? '하루 진행' : 'Advance Day'}
                    </button>
                    <button
                        onClick={() => setSimAuto(prev => !prev)}
                        disabled={simState.status !== 'running' || !!pendingChoice}
                        className={`px-4 py-2 text-sm font-bold border ${simState.status === 'running' && !pendingChoice
                            ? 'bg-[#2b2b2b] hover:bg-[#3a3a3a] text-white border-gray-600'
                            : 'bg-[#333] text-gray-500 border-gray-700 cursor-not-allowed'}`}
                    >
                        {simAuto
                            ? (language === 'ko' ? '자동 진행 일시정지' : 'Pause Auto')
                            : (language === 'ko' ? '자동 진행 시작' : 'Start Auto')}
                    </button>
                </div>

                {pendingChoice && (
                    <div className="bg-black/40 border border-[#6b6b6b] p-4 space-y-3">
                        <div className="text-sm font-bold text-[#9f752a]">
                            {language === 'ko' ? '중요 사건 발생' : 'Important Event'}
                        </div>
                        <div className="text-white font-bold">{pendingChoice.event.title}</div>
                        <div className="text-gray-400 text-sm">{pendingChoice.event.description}</div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            {pendingChoice.event.choices?.map(choice => (
                                <button
                                    key={choice.id}
                                    onClick={() => resolveChoice(choice.id)}
                                    className="px-4 py-3 bg-[#1c3d5a] hover:bg-[#2c5282] text-white text-sm border border-blue-900"
                                >
                                    <div className="font-bold">{choice.label}</div>
                                    {choice.description && (
                                        <div className="text-xs text-white/70 mt-1">{choice.description}</div>
                                    )}
                                </button>
                            ))}
                        </div>
                        <div className="text-xs text-gray-500">
                            {language === 'ko' ? '선택을 완료해야 다음 날로 진행됩니다.' : 'Choose an action to continue.'}
                        </div>
                    </div>
                )}

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
            </div>

            <div className="bg-[#0f0f0f] border border-[#6b6b6b] p-5 shadow-xl">
                <h3 className="text-sm font-bold text-[#9f752a] mb-3">
                    {language === 'ko' ? '생존 로그' : 'Survival Log'}
                </h3>
                <div className="max-h-[420px] overflow-y-auto border border-gray-800 bg-black/30 p-3 space-y-3 text-xs">
                    {simState.log.length === 0 && (
                        <div className="text-gray-500">
                            {language === 'ko' ? '로그가 비어 있습니다.' : 'No logs yet.'}
                        </div>
                    )}
                    {simState.log.map((entry, idx) => (
                        <div key={`${entry.day}-${idx}`} className="border-b border-gray-800 pb-3">
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
                            </div>
                            <div className="text-gray-300 mt-1">
                                {language === 'ko' ? '사건' : 'Event'}: {entry.description}
                            </div>
                            <div className="text-[#9f752a] mt-1">
                                {language === 'ko' ? '대처' : 'Response'}: {entry.response}
                            </div>
                            <div className="text-gray-400 mt-1">
                                {language === 'ko' ? '결과' : 'Result'}: HP {entry.after.hp}({entry.delta.hp >= 0 ? `+${entry.delta.hp}` : entry.delta.hp}) / {language === 'ko' ? '치료제' : 'Meds'} {entry.after.meds}({entry.delta.meds >= 0 ? `+${entry.delta.meds}` : entry.delta.meds}) / {language === 'ko' ? '돈' : 'Money'} {entry.after.money}({entry.delta.money >= 0 ? `+${entry.delta.money}` : entry.delta.money})
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
