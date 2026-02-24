"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTest } from '../../context/TestContext';
import { useLanguage } from '../../context/LanguageContext';
import { TestResult } from '../../types/rimworld';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

type SimDelta = { hp: number; food: number; meds: number; money: number };
type SimTraitLike = string | { id?: string; name?: string };
type SimUserInfo = { name?: string; age?: number; gender?: string };

type TraitMod = {
    pos: string[];
    neg: string[];
    goodText?: string;
    badText?: string;
};

type SkillCheck = {
    label: string;
    group: string[]; // Changed to string[]
    fixedChance?: number;
    chanceMultiplier?: number;
    advanced?: boolean;
    greatSuccessDelta?: SimDelta;
    greatSuccessText?: string;
    successDelta: SimDelta;
    failDelta: SimDelta;
    successText?: string;
    failText?: string;
};

type ChoiceRequirements = {
    food?: number;
    meds?: number;
    money?: number;
};

type NextDayEffect = {
    id: string;
    sourceEventId: string;
    remainingDays: number;
    hpMod?: number;
    foodMod?: number;
    medsMod?: number;
    moneyMod?: number;
    dangerBias?: number;
    foodGainPenalty?: number;
    disableHealing?: boolean;
    forceDangerNextDay?: boolean;
    obfuscateUi?: boolean;
    applyBeforeEra100?: boolean;
    tone?: 'positive' | 'negative';
    noteKo: string;
    noteEn: string;
};

type TurnEffectModifiers = {
    foodGainPenalty: number;
    disableHealing: boolean;
    obfuscateUi: boolean;
};

type DuelTrack = 'combat' | 'crafting' | 'research' | 'art';
type QuietAutoPreset = 'manual' | 'quiet_rest' | 'quiet_farming' | 'quiet_hunting' | 'quiet_mining';
type QuietAutoPresetChoice = Exclude<QuietAutoPreset, 'manual'>;

const QUIET_PRESET_CONFIG: Array<{
    id: QuietAutoPresetChoice;
    labelKo: string;
    labelEn: string;
    group: string[];
    hasGreat: boolean;
}> = [
    {
        id: 'quiet_rest',
        labelKo: '정비',
        labelEn: 'Maintenance',
        group: ['Construction', 'Crafting', 'Medicine'],
        hasGreat: true
    },
    {
        id: 'quiet_farming',
        labelKo: '농사',
        labelEn: 'Farming',
        group: ['Plants', 'Animals'],
        hasGreat: true
    },
    {
        id: 'quiet_hunting',
        labelKo: '사냥',
        labelEn: 'Hunting',
        group: ['Shooting', 'Melee'],
        hasGreat: true
    },
    {
        id: 'quiet_mining',
        labelKo: '채광',
        labelEn: 'Mining',
        group: ['Mining', 'Intellectual'],
        hasGreat: true
    }
];

type DuelOpponent = {
    id: string;
    name: string;
    combat: number;
    crafting: number;
    research: number;
    art: number;
};

type SimChoice = {
    id: string;
    label: string;
    description?: string;
    delta: SimDelta;
    response?: string;
    skillCheck?: SkillCheck;
    requirements?: ChoiceRequirements;
    nextDayEffect?: NextDayEffect;
    isSpecial?: boolean;
    specialReason?: string;
    isRainbow?: boolean;
    isRareSpawn?: boolean;
    duelTrack?: DuelTrack;
};

type SimEventCategory = 'quiet' | 'noncombat' | 'mind' | 'danger';
type NonCombatSubtype = 'support' | 'tradeoff' | 'attrition' | 'special';
type NonCombatSpawnSubtype = Exclude<NonCombatSubtype, 'special'>;
type NonCombatSubtypeWeights = Record<NonCombatSpawnSubtype, number>;

type SimEvent = {
    id: string;
    title: string;
    description: string;
    category: SimEventCategory;
    nonCombatSubtype?: NonCombatSubtype;
    weight: number;
    base: SimDelta;
    traitMods?: {
        hp?: TraitMod;
        food?: TraitMod;
        meds?: TraitMod;
        money?: TraitMod;
    };
    skillGroup?: string[]; // Multiple skills possible
    skillTargets?: Array<'hp' | 'food' | 'meds' | 'money'>;
    choices?: SimChoice[];
    isRainbow?: boolean;
    duelOpponent?: DuelOpponent;
};

type SimLogEntry = {
    day: number;
    season: string;
    title: string;
    description: string;
    response: string;
    responseCard?: string;
    delta: SimDelta;
    eventDelta?: SimDelta;
    after: SimDelta;
    status?: 'good' | 'bad' | 'warn' | 'neutral';
};

type SimStatus = 'idle' | 'running' | 'dead' | 'success';

type PendingChoice = {
    day: number;
    season: string;
    event: SimEvent;
    dayStart: { hp: number; food: number; meds: number; money: number };
    baseAfter: { hp: number; food: number; meds: number; money: number };
    responseNotes: string[];
    turnEffectModifiers: TurnEffectModifiers;
};

type SimState = {
    status: SimStatus;
    day: number;
    hp: number;
    food: number;
    meds: number;
    money: number;
    campLevel: number;
    petCount: number;
    loverCount: number;
    spouseCount: number;
    log: SimLogEntry[];
    hasSerum: boolean;
    serumTraderShown: boolean;
    daysSinceDanger: number;
    evacActive: boolean;
    evacCountdown: number;
    evacForceThreatNextDay: boolean;
    deathDuringEvac: boolean;
    evacReady: boolean;
    era100Shown: boolean;
    activeEffects: NextDayEffect[];
    skillProgress: Record<string, { level: number; xp: number }>; // 숙련도 시스템
};

type ExitType = 'death' | 'escape' | 'stay';
type DeathContext = 'evac_failed' | null;

type CurrentCard = {
    day: number;
    season: string;
    event: SimEvent;
    entry?: SimLogEntry;
};

type TurnPhase = 'idle' | 'preparing' | 'advancing';

type PreparedTurn = {
    simState: SimState;
    pendingChoice: PendingChoice | null;
    currentCard: CurrentCard;
    cardView: 'event' | 'result';
    hasShipBuilt?: boolean;
    showEndingCard?: boolean;
    allowContinue?: boolean;
    canBoardShip?: boolean;
    showLaunchReadyPrompt?: boolean;
    showDeathResult?: boolean;
};

const MAX_DAYS = 60;
const TEMP_SAVE_KEY = 'rimworld_sim_temp_save';

const START_STATS = { hp: 10, food: 5, meds: 2, money: 5 };
const BASE_UPGRADE_COSTS = [5, 10];
const SHIP_BUILD_DAY = 60;
const EVAC_SURVIVAL_DAYS = 15;
const SIEGE_EVENT_IDS = new Set([
    'siege_emp_lockdown',
    'siege_breach_wave',
    'siege_supply_burn',
    'siege_signal_jamming',
    'siege_night_hunt'
]);
const ERA_100_DAY = 100;
const EARLY_EASING_END_DAY = 80;
const MICRO_SCALE_STEP_DAYS = 10;
const MICRO_SCALE_PER_STEP = 0.015;
const MICRO_SCALE_CAP = 0.30;
const NONCOMBAT_SUBTYPE_ORDER: NonCombatSpawnSubtype[] = ['support', 'tradeoff', 'attrition'];
const NONCOMBAT_MIN_SUBTYPE_WEIGHT = 5;
const NONCOMBAT_SPAWN_TUNING = {
    base: { support: 46, tradeoff: 36, attrition: 18 },
    postEarlyShift: { support: -4, tradeoff: -1, attrition: 5 },
    post100BasePressure: 6,
    post100EraPressurePer100Days: 3,
    post100MicroPressureScale: 20,
    evacShift: { support: -10, tradeoff: -4, attrition: 14 },
    criticalGuardShift: { support: 14, tradeoff: 4, attrition: -18 },
    dangerBiasDivisor: 2,
    dangerBiasPositiveCap: 10,
    dangerBiasNegativeCap: 8
} as const;

const SKILL_GROUPS: Record<string, string[]> = {
    '전투': ['Shooting', 'Melee'],
    '사교': ['Social'],
    '의학': ['Medicine'],
    '재배': ['Plants'],
    '제작': ['Construction', 'Crafting', 'Mining'],
    '생존': ['Plants', 'Animals'],
    '격투': ['Melee'],
    '사격': ['Shooting'],
    '연구': ['Intellectual'],
    '지능': ['Intellectual']
};

const MOVEMENT_TRAITS = new Set(['fast_walker', 'jogger', 'nimble', 'slowpoke']);

const clampStat = (value: number, max: number = 20) => Math.max(0, Math.min(max, value));

const getSeasonLabel = (day: number, language: string) => {
    if (day <= 0) return language === 'ko' ? '시작' : 'Start';
    const seasonsKo = ['봄', '여름', '가을', '겨울'];
    const seasonsEn = ['Spring', 'Summer', 'Autumn', 'Winter'];
    const yearIndex = Math.floor((day - 1) / 60) + 1;
    const seasonIndex = Math.floor(((day - 1) % 60) / 15);
    const seasonDay = ((day - 1) % 15) + 1;
    const yearLabel = language === 'ko' ? `${yearIndex}년차` : `Year ${yearIndex}`;
    const seasonName = language === 'ko' ? seasonsKo[seasonIndex] : seasonsEn[seasonIndex];
    return language === 'ko'
        ? `${seasonName} ${seasonDay}일차 (${yearLabel})`
        : `${seasonName} Day ${seasonDay} (${yearLabel})`;
};

const ALL_SKILLS = [
    'Shooting', 'Melee', 'Construction', 'Mining', 'Cooking', 'Plants',
    'Animals', 'Crafting', 'Artistic', 'Medicine', 'Social', 'Intellectual'
];

const SKILL_NAMES_KO: Record<string, string> = {
    Shooting: '사격',
    Melee: '격투',
    Construction: '건설',
    Mining: '채굴',
    Cooking: '요리',
    Plants: '재배',
    Animals: '조련',
    Crafting: '제작',
    Artistic: '예술',
    Medicine: '의학',
    Social: '사교',
    Intellectual: '연구'
};

const TRAIT_EFFECTS: Record<string, { ko: string; en: string }> = {
    fast_walker: { ko: "성공 확률 +10% (이동/회피 관련)", en: "Success chance +10% (Movement/Evasion)" },
    jogger: { ko: "성공 확률 +20% (이동/회피 관련)", en: "Success chance +10% (Movement/Evasion)" },
    nimble: { ko: "성공 확률 +10% (이동/회피 관련)", en: "Success chance +10% (Movement/Evasion)" },
    slowpoke: { ko: "성공 확률 -20% (이동/회피 관련)", en: "Success chance -20% (Movement/Evasion)" },
    tough: { ko: "받는 모든 HP 피해량 50% 감소 (반올림), [전용 선택지 추가]", en: "All HP damage received reduced by 50% (rounded), [Special choice added]" },
    greedy: { ko: "시작 물자: 은 +10 보너스", en: "Starting items: +10 Silver bonus" },
    ascetic: { ko: "시작 물자: HP +5 보너스, 은 -5 페널티", en: "Starting items: +5 HP bonus, -5 Silver penalty" },
    wimp: { ko: "시작 물자: 치료제 +3 보너스, [전용 선택지 추가]", en: "Starting items: +3 Meds bonus, [Special choice added]" },
    industrious: { ko: "[전용 선택지 추가]", en: "[Special choice added]" },
    hard_worker: { ko: "[전용 선택지 추가]", en: "[Special choice added]" },
    lazy: { ko: "[전용 선택지 추가]", en: "[Special choice added]" },
    kind: { ko: "[전용 선택지 추가]", en: "[Special choice added]" },
    abrasive: { ko: "[전용 선택지 추가]", en: "[Special choice added]" },
    pyromaniac: { ko: "[전용 선택지 추가]", en: "[Special choice added]" },
};

const TRAIT_NAMES_KO: Record<string, string> = {
    fast_walker: '가벼운 발',
    jogger: '신속',
    nimble: '재빠름',
    slowpoke: '느림보',
    tough: '강인함',
    greedy: '탐욕',
    ascetic: '검소',
    wimp: '엄살쟁이',
    industrious: '일벌레',
    hard_worker: '근면성실',
    lazy: '게으름',
    kind: '다정다감',
    abrasive: '직설적',
    pyromaniac: '방화광',
    iron_willed: '철의 의지',
    psychopath: '사이코패스'
};

const TEXT_SCRAMBLE_GLYPHS = ['#', '%', '&', '*', '?', '@', '!', '+', '=', '~', '/', '\\', '|', ';', ':'];

const scrambleText = (text: string) => {
    if (!text) return text;
    return Array.from(text).map((ch, idx) => {
        if (ch === ' ' || ch === '\n' || ch === '\t') return ch;
        const code = ch.codePointAt(0) ?? 0;
        return TEXT_SCRAMBLE_GLYPHS[(code + idx * 11) % TEXT_SCRAMBLE_GLYPHS.length];
    }).join('');
};

const getRawSkillLevel = (skills: unknown, skillName: string) => {
    if (!Array.isArray(skills)) return 0;
    const entry = skills.find(item => {
        if (!item || typeof item !== 'object') return false;
        return (item as { name?: unknown }).name === skillName;
    }) as { level?: unknown } | undefined;
    if (!entry) return 0;
    const parsed = Number(entry.level);
    if (!Number.isFinite(parsed)) return 0;
    return Math.max(0, parsed);
};

const getRawAverage = (skills: unknown, names: string[]) => {
    if (names.length === 0) return 0;
    const total = names.reduce((sum, name) => sum + getRawSkillLevel(skills, name), 0);
    return total / names.length;
};

const mapToDuelOpponent = (row: { id?: unknown; name?: unknown; skills?: unknown }): DuelOpponent | null => {
    const id = typeof row.id === 'string' ? row.id : '';
    const name = typeof row.name === 'string' && row.name.trim().length > 0 ? row.name.trim() : '';
    if (!id || !name) return null;
    const skills = row.skills;
    return {
        id,
        name,
        combat: getRawAverage(skills, ['Shooting', 'Melee']),
        crafting: getRawAverage(skills, ['Construction', 'Crafting', 'Mining']),
        research: getRawSkillLevel(skills, 'Intellectual'),
        art: getRawSkillLevel(skills, 'Artistic')
    };
};

const buildSoulDuelEvent = (language: string, opponent: DuelOpponent): SimEvent => {
    const isKo = language === 'ko';
    return {
        id: 'soul_duel',
        title: isKo ? '영혼의 승부' : 'Soul Duel',
        description: isKo ? `상대는 ${opponent.name}입니다.` : `Your opponent is ${opponent.name}.`,
        category: 'mind',
        weight: 0,
        base: { hp: 0, food: 0, meds: 0, money: 0 },
        duelOpponent: opponent,
        choices: [
            {
                id: 'soul_duel_combat',
                label: isKo ? '전투' : 'Combat',
                description: isKo ? '전투 숙련 비교' : 'Compare combat skill',
                delta: { hp: 0, food: 0, meds: 0, money: 0 },
                response: isKo ? '전투 감각으로 영혼의 결투에 나섭니다.' : 'You challenge with combat instinct.',
                duelTrack: 'combat'
            },
            {
                id: 'soul_duel_crafting',
                label: isKo ? '제작' : 'Crafting',
                description: isKo ? '제작 숙련 비교' : 'Compare crafting skill',
                delta: { hp: 0, food: 0, meds: 0, money: 0 },
                response: isKo ? '손기술과 설계 감각으로 승부를 겁니다.' : 'You challenge with building and crafting expertise.',
                duelTrack: 'crafting'
            },
            {
                id: 'soul_duel_research',
                label: isKo ? '연구' : 'Research',
                description: isKo ? '연구 숙련 비교' : 'Compare research skill',
                delta: { hp: 0, food: 0, meds: 0, money: 0 },
                response: isKo ? '이론과 분석력으로 맞섭니다.' : 'You challenge with analysis and intellect.',
                duelTrack: 'research'
            },
            {
                id: 'soul_duel_art',
                label: isKo ? '예술' : 'Art',
                description: isKo ? '예술 숙련 비교' : 'Compare artistic skill',
                delta: { hp: 0, food: 0, meds: 0, money: 0 },
                response: isKo ? '감각과 표현력으로 승부를 봅니다.' : 'You challenge with artistic expression.',
                duelTrack: 'art'
            }
        ]
    };
};

const getEventIcon = (event?: SimEvent) => {
    if (!event) return '🎴';
    switch (event.id) {
        case 'raiders':
            return '⚔️';
        case 'mortar_raid':
            return '🎯';
        case 'emp_raid':
            return '⚡️';
        case 'manhunter':
            return '🦁';
        case 'shambler_horde':
            return '🧟';
        case 'infestation':
            return '🐜';
        case 'disease':
            return '🩺';
        case 'toxic_fallout':
            return '🤢';
        case 'psychic_drone':
            return '🧠';
        case 'psychic_soother':
            return '💫';
        case 'madness_frenzy':
            return '🌀';
        case 'soul_duel':
            return '⚖️';
        case 'cold_snap':
            return '❄️';
        case 'heat_wave':
            return '🔥';
        case 'solar_flare':
            return '☀️';
        case 'fire':
            return '🔥';
        case 'wanderer':
            return '🧑';
        case 'trade':
            return '🪙';
        case 'cargo_pods':
            return '📦';
        case 'ship_chunk':
            return '🛰️';
        case 'meteorite':
            return '☄️';
        case 'thrumbo':
            return '🦄';
        case 'medical_cache':
            return '🧰';
        case 'foraging':
        case 'crop_boom':
        case 'blight':
            return '🌾';
        case 'supply_trader':
            return '💰';
        case 'quiet_day':
            return '🌤️';
        default:
            return event.category === 'danger'
                ? '⚠️'
                : event.category === 'mind'
                    ? '🧠'
                    : event.category === 'noncombat'
                        ? '🧭'
                        : '🌤️';
    }
};

const getHealAmount = (medicineLevel: number) => {
    if (medicineLevel <= 3) return 1;
    if (medicineLevel <= 6) return 2;
    if (medicineLevel <= 10) return 3;
    return 4;
};

// 일반 선택지 성공 확률 (Lv 0: 20%, Lv 15+: 95%)
const getSkillChance = (level: number, isAdvanced: boolean = false) => {
    if (isAdvanced) {
        // 특수 선택지 (Lv 12-20): 30% → 80% (2차 함수)
        if (level < 12) return 0; // 레벨 12 미만은 선택 불가
        if (level >= 20) return 80;
        const chance = (-0.75 * level * level) + (30.25 * level) - 225;
        return Math.max(30, Math.min(80, Math.round(chance)));
    } else {
        // 일반 선택지 (Lv 0-20): 20% → 95%
        const chance = 20 + (level * 5);
        return Math.min(95, chance);
    }
};

const getDangerChance = (day: number, daysSinceDanger: number) => {
    if (day <= 6) return 0;
    if (day >= 8 && day <= 10) return 5;
    if (daysSinceDanger >= 1 && daysSinceDanger <= 3) return 5;
    const n = Math.max(0, daysSinceDanger);
    const raw = 0.1875 * n * n + 1.375 * n - 2.5;
    return Math.round(raw);
};

const getEra = (day: number) => Math.max(0, Math.floor(day / 100));

const getFailPenaltyMultiplier = (day: number) => {
    const era = getEra(day);
    if (era <= 0) return 1.0;
    if (era === 1) return 1.12;
    if (era === 2) return 1.26;
    if (era === 3) return 1.42;
    return 1.6;
};

const getMicroDifficultyBonus = (day: number) => {
    if (day < ERA_100_DAY) return 0;
    const steps = Math.floor((day - ERA_100_DAY) / MICRO_SCALE_STEP_DAYS);
    return Math.min(MICRO_SCALE_CAP, steps * MICRO_SCALE_PER_STEP);
};

const getEffectiveFailPenaltyMultiplier = (day: number) => {
    const base = getFailPenaltyMultiplier(day);
    return base * (1 + getMicroDifficultyBonus(day));
};

const getEarlyDangerChanceRelief = (day: number, daysSinceDanger: number, endingPhaseActive: boolean) => {
    if (endingPhaseActive) return 0;
    if (day > EARLY_EASING_END_DAY) return 0;
    if (daysSinceDanger <= 1) return 3;
    return 0;
};

const normalizeNonCombatSubtypeWeights = (weights: NonCombatSubtypeWeights): NonCombatSubtypeWeights => {
    const safeWeights = { ...weights };
    NONCOMBAT_SUBTYPE_ORDER.forEach(subtype => {
        safeWeights[subtype] = Math.max(NONCOMBAT_MIN_SUBTYPE_WEIGHT, safeWeights[subtype]);
    });
    return safeWeights;
};

const getNonCombatSubtype = (event: SimEvent): NonCombatSubtype => {
    if (event.category !== 'noncombat') return 'special';
    return event.nonCombatSubtype ?? 'tradeoff';
};

const getNonCombatSubtypeWeights = (context: {
    day: number;
    isEvac: boolean;
    effectDangerBias: number;
    hp: number;
    food: number;
    meds: number;
    money: number;
}): NonCombatSubtypeWeights => {
    const { day, isEvac, effectDangerBias, hp, food, meds, money } = context;

    let support = NONCOMBAT_SPAWN_TUNING.base.support;
    let tradeoff = NONCOMBAT_SPAWN_TUNING.base.tradeoff;
    let attrition = NONCOMBAT_SPAWN_TUNING.base.attrition;

    if (day > EARLY_EASING_END_DAY) {
        support += NONCOMBAT_SPAWN_TUNING.postEarlyShift.support;
        tradeoff += NONCOMBAT_SPAWN_TUNING.postEarlyShift.tradeoff;
        attrition += NONCOMBAT_SPAWN_TUNING.postEarlyShift.attrition;
    }

    if (day >= ERA_100_DAY) {
        const eraPressure = Math.floor((day - ERA_100_DAY) / 100) * NONCOMBAT_SPAWN_TUNING.post100EraPressurePer100Days;
        const microPressure = Math.round(getMicroDifficultyBonus(day) * NONCOMBAT_SPAWN_TUNING.post100MicroPressureScale);
        const totalPressure = NONCOMBAT_SPAWN_TUNING.post100BasePressure + eraPressure + microPressure;
        support -= Math.ceil(totalPressure * 0.45);
        tradeoff -= Math.floor(totalPressure * 0.2);
        attrition += totalPressure;
    }

    if (isEvac) {
        support += NONCOMBAT_SPAWN_TUNING.evacShift.support;
        tradeoff += NONCOMBAT_SPAWN_TUNING.evacShift.tradeoff;
        attrition += NONCOMBAT_SPAWN_TUNING.evacShift.attrition;
    }

    if (effectDangerBias > 0) {
        const shift = Math.min(
            NONCOMBAT_SPAWN_TUNING.dangerBiasPositiveCap,
            Math.ceil(effectDangerBias / NONCOMBAT_SPAWN_TUNING.dangerBiasDivisor)
        );
        support -= shift;
        attrition += shift;
    } else if (effectDangerBias < 0) {
        const shift = Math.min(
            NONCOMBAT_SPAWN_TUNING.dangerBiasNegativeCap,
            Math.ceil(Math.abs(effectDangerBias) / NONCOMBAT_SPAWN_TUNING.dangerBiasDivisor)
        );
        support += shift;
        attrition -= shift;
    }

    // Critical-resource guard to avoid repeated no-counterplay attrition chains.
    const criticalResourceState = hp <= 2 || food <= 1 || (food <= 2 && meds <= 0) || (food === 0 && money === 0);
    if (criticalResourceState) {
        support += NONCOMBAT_SPAWN_TUNING.criticalGuardShift.support;
        tradeoff += NONCOMBAT_SPAWN_TUNING.criticalGuardShift.tradeoff;
        attrition += NONCOMBAT_SPAWN_TUNING.criticalGuardShift.attrition;
    }

    return normalizeNonCombatSubtypeWeights({
        support,
        tradeoff,
        attrition
    });
};

const pickNonCombatEvent = (
    events: SimEvent[],
    context: {
        day: number;
        isEvac: boolean;
        effectDangerBias: number;
        hp: number;
        food: number;
        meds: number;
        money: number;
    }
): SimEvent => {
    if (events.length === 0) {
        throw new Error('pickNonCombatEvent called with an empty event list');
    }

    const randomPool = events.filter(event => getNonCombatSubtype(event) !== 'special');
    const selectionPool = randomPool.length > 0 ? randomPool : events;

    const grouped: Record<NonCombatSpawnSubtype, SimEvent[]> = {
        support: [],
        tradeoff: [],
        attrition: []
    };

    selectionPool.forEach(event => {
        const subtype = getNonCombatSubtype(event);
        if (subtype === 'special') return;
        grouped[subtype].push(event);
    });

    const availableSubtypes = NONCOMBAT_SUBTYPE_ORDER.filter(subtype => grouped[subtype].length > 0);
    if (availableSubtypes.length === 0) {
        return pickWeightedEvent(selectionPool);
    }

    const weights = getNonCombatSubtypeWeights(context);
    const total = availableSubtypes.reduce((sum, subtype) => sum + weights[subtype], 0);
    let roll = Math.random() * total;
    let pickedSubtype = availableSubtypes[0];

    for (const subtype of availableSubtypes) {
        roll -= weights[subtype];
        if (roll <= 0) {
            pickedSubtype = subtype;
            break;
        }
    }

    return pickWeightedEvent(grouped[pickedSubtype]);
};

const isNegativeEffect = (effect: NextDayEffect) => {
    if (effect.tone === 'negative') return true;
    if (effect.disableHealing || (effect.foodGainPenalty ?? 0) > 0 || effect.forceDangerNextDay) return true;
    if ((effect.dangerBias ?? 0) > 0) return true;
    if ((effect.hpMod ?? 0) < 0 || (effect.foodMod ?? 0) < 0 || (effect.medsMod ?? 0) < 0 || (effect.moneyMod ?? 0) < 0) return true;
    return false;
};

const isPositiveEffect = (effect: NextDayEffect) => {
    if (effect.tone === 'positive') return true;
    if ((effect.dangerBias ?? 0) < 0) return true;
    if ((effect.hpMod ?? 0) > 0 || (effect.foodMod ?? 0) > 0 || (effect.medsMod ?? 0) > 0 || (effect.moneyMod ?? 0) > 0) return true;
    return false;
};

const scaleNegativeDelta = (value: number, multiplier: number) => {
    if (value >= 0) return value;
    return -Math.ceil(Math.abs(value) * multiplier);
};

// 대성공 확률 (Lv 6: 5%, Lv 15: 50%, Lv 20: 60%)
const getGreatSuccessChance = (level: number) => {
    if (level < 6) return 0;
    if (level <= 15) {
        const chance = 5 + (level - 6) * 5;
        return Math.min(50, chance);
    }
    const chance = 50 + (level - 15) * 2;
    return Math.min(60, chance);
};

// 레벨업에 필요한 경험치 계산
const getXpForLevel = (level: number) => {
    return 100 + (level * 20); // Lv 0→1: 100, Lv 1→2: 120, Lv 2→3: 140...
};

// 열정에 따른 경험치 배율
const getPassionMultiplier = (passions: Record<string, number>, skill: string): number => {
    const passion = passions[skill] || 0;
    if (passion >= 2) return 1.5; // 불꽃 (Major)
    if (passion === 1) return 1.0; // 관심 (Minor)
    return 0.5; // 없음
};

// 경험치 획득 및 레벨업 처리
const gainSkillXp = (
    currentProgress: Record<string, { level: number; xp: number }>,
    skill: string,
    baseXp: number,
    passions: Record<string, number>
): { level: number; xp: number; leveledUp: boolean } => {
    const current = currentProgress[skill] || { level: 0, xp: 0 };
    const multiplier = getPassionMultiplier(passions, skill);
    const gainedXp = Math.floor(baseXp * multiplier);

    let newXp = current.xp + gainedXp;
    let newLevel = current.level;
    let leveledUp = false;

    // 레벨업 체크 (최대 레벨 20)
    while (newLevel < 20 && newXp >= getXpForLevel(newLevel)) {
        newXp -= getXpForLevel(newLevel);
        newLevel++;
        leveledUp = true;
    }

    // 레벨 20에 도달하면 XP는 0으로
    if (newLevel >= 20) {
        newXp = 0;
    }

    return { level: newLevel, xp: newXp, leveledUp };
};

const buildSupplyEvent = (language: string, money: number, food: number, meds: number): SimEvent => {
    const isKo = language === 'ko';
    const choices: SimChoice[] = [];

    if (money >= 2) {
        choices.push({
            id: 'buy_food_large',
            label: isKo ? '식량 대량 구매' : 'Buy Food (Large)',
            description: isKo ? '돈 2 → 식량 4' : 'Money 2 → Food 4',
            delta: { hp: 0, food: 4, meds: 0, money: -2 },
            response: isKo ? '식량을 대량으로 구매했습니다.' : 'You buy a large food supply.'
        });
        choices.push({
            id: 'buy_meds_large',
            label: isKo ? '치료제 대량 구매' : 'Buy Meds (Large)',
            description: isKo ? '돈 2 → 치료제 2' : 'Money 2 → Meds 2',
            delta: { hp: 0, food: 0, meds: 2, money: -2 },
            response: isKo ? '치료제를 대량으로 구매했습니다.' : 'You buy a large med supply.'
        });

    }
    if (money >= 1) {
        choices.push({
            id: 'buy_food_small',
            label: isKo ? '식량 소량 구매' : 'Buy Food (Small)',
            description: isKo ? '돈 1 → 식량 2' : 'Money 1 → Food 2',
            delta: { hp: 0, food: 2, meds: 0, money: -1 },
            response: isKo ? '식량을 소량 구매했습니다.' : 'You buy a small food supply.'
        });
        choices.push({
            id: 'buy_meds_small',
            label: isKo ? '치료제 소량 구매' : 'Buy Meds (Small)',
            description: isKo ? '돈 1 → 치료제 1' : 'Money 1 → Meds 1',
            delta: { hp: 0, food: 0, meds: 1, money: -1 },
            response: isKo ? '치료제를 소량 구매했습니다.' : 'You buy a small med supply.'
        });

    }

    if (food >= 2) {
        choices.push({
            id: 'sell_food',
            label: isKo ? '식량 판매' : 'Sell Food',
            description: isKo ? '식량 2 → 돈 1' : 'Food 2 → Money 1',
            delta: { hp: 0, food: -2, meds: 0, money: 1 },
            response: isKo ? '식량을 팔아 은을 확보했습니다.' : 'You sell food for money.'
        });
    }
    if (meds >= 1) {
        choices.push({
            id: 'sell_meds',
            label: isKo ? '치료제 판매' : 'Sell Meds',
            description: isKo ? '치료제 1 → 돈 1' : 'Meds 1 → Money 1',
            delta: { hp: 0, food: 0, meds: -1, money: 1 },
            response: isKo ? '치료제를 팔아 은을 확보했습니다.' : 'You sell meds for money.'
        });
    }

    choices.push({
        id: 'skip',
        label: isKo ? '거래하지 않음' : 'Skip',
        description: isKo ? '거래를 포기한다.' : 'You skip the deal.',
        delta: { hp: 0, food: 0, meds: 0, money: 0 },
        response: isKo ? '거래를 포기하고 넘어갔습니다.' : 'You pass on the offer.'
    });

    return {
        id: 'supply_trader',
        title: isKo ? '물자 상인 등장' : 'Supply Trader',
        description: isKo ? '식량과 치료제를 구매할 수 있는 상인이 도착했습니다.' : 'A trader offers food and meds.',
        category: 'noncombat',
        nonCombatSubtype: 'support',
        weight: 0,
        base: { hp: 0, food: 0, meds: 0, money: 0 },
        choices
    };
};

const buildSimEvents = (language: string): SimEvent[] => {
    const isKo = language === 'ko';
    return [
        {
            id: 'quiet_day',
            title: isKo ? '조용한 날' : 'Quiet Day',
            description: isKo ? '큰 사건 없이 하루가 지나갔습니다. 오늘 무엇에 집중하시겠습니까?' : 'The day passes without major incidents. What will you focus on today?',
            category: 'quiet',
            weight: 40,
            base: { hp: 0, food: 0, meds: 0, money: 0 },
            choices: [
                {
                    id: 'quiet_rest',
                    label: isKo ? '1. 정비' : '1. Maintenance',
                    description: isKo ? '건설/제작/의학 기술 체크' : 'Construction/Crafting/Medicine skill check',
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    skillCheck: {
                        label: isKo ? '정비' : 'Maintenance',
                        group: ['Construction', 'Crafting', 'Medicine'],
                        successDelta: { hp: 1, food: 0, meds: 0, money: 0 },
                        greatSuccessDelta: { hp: 2, food: 0, meds: 0, money: 0 },
                        failDelta: { hp: 0, food: 0, meds: 0, money: 0 },
                        successText: isKo ? '충분한 정비를 하며 기력을 회복했습니다.' : 'You recovered energy through maintenance.',
                        greatSuccessText: isKo ? '대성공! 정비가 완벽하게 끝나 몸과 장비가 최상의 상태가 되었습니다.' : 'Great success! Perfect maintenance restored you and the gear.',
                        failText: isKo ? '정비를 시도했으나 별다른 성과가 없었습니다.' : 'You tried to maintain the base, but failed to recover.'
                    }
                },
                {
                    id: 'quiet_farming',
                    label: isKo ? '2. 농사' : '2. Farming',
                    description: isKo ? '재배/조련 기술 체크' : 'Plants/Animals skill check',
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    skillCheck: {
                        label: isKo ? '농사' : 'Farming',
                        group: ['Plants', 'Animals'],
                        successDelta: { hp: 0, food: 1, meds: 0, money: 0 },
                        greatSuccessDelta: { hp: 0, food: 3, meds: 0, money: 0 },
                        failDelta: { hp: 0, food: 0, meds: 0, money: 0 },
                        successText: isKo ? '밭을 일구어 신선한 식량을 확보했습니다.' : 'You secured fresh food by farming.',
                        greatSuccessText: isKo ? '대성공! 풍작으로 식량을 넉넉히 확보했습니다.' : 'Great success! A bumper crop filled the stores.',
                        failText: isKo ? '열심히 일했으나 이번 수확은 허탕이었습니다.' : 'You worked hard, but the harvest was poor.'
                    }
                },
                {
                    id: 'quiet_hunting',
                    label: isKo ? '3. 사냥' : '3. Hunting',
                    description: isKo ? '사격/격투 기술 체크' : 'Shooting/Melee skill check',
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    skillCheck: {
                        label: isKo ? '사냥' : 'Hunting',
                        group: ['Shooting', 'Melee'],
                        successDelta: { hp: 0, food: 1, meds: 0, money: 0 },
                        greatSuccessDelta: { hp: 0, food: 3, meds: 0, money: 0 },
                        failDelta: { hp: 0, food: 0, meds: 0, money: 0 },
                        successText: isKo ? '사냥에 성공해 식량을 확보했습니다.' : 'You successfully hunted and secured food.',
                        greatSuccessText: isKo ? '대성공! 큰 사냥감으로 식량을 대량 확보했습니다.' : 'Great success! A big catch brought in plenty of food.',
                        failText: isKo ? '사냥에 실패해 소득이 없었습니다.' : 'You failed to hunt anything.'
                    }
                },
                {
                    id: 'quiet_mining',
                    label: isKo ? '4. 광물 채광' : '4. Mining',
                    description: isKo ? '채굴/연구 기술 체크' : 'Mining/Intellectual skill check',
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    skillCheck: {
                        label: isKo ? '채광' : 'Mining',
                        group: ['Mining', 'Intellectual'],
                        successDelta: { hp: 0, food: 0, meds: 0, money: 1 },
                        greatSuccessDelta: { hp: 0, food: 0, meds: 0, money: 3 },
                        failDelta: { hp: 0, food: 0, meds: 0, money: 0 },
                        successText: isKo ? '근처 암석에서 유용한 광물을 성공적으로 채굴했습니다.' : 'You successfully mined useful minerals.',
                        greatSuccessText: isKo ? '대성공! 고품질 광맥을 찾아 은을 넉넉히 확보했습니다.' : 'Great success! You hit a rich vein and secured plenty of silver.',
                        failText: isKo ? '하루 종일 곡갱이질을 했으나 소득이 없었습니다.' : 'You spent all day mining with no gain.'
                    }
                }
            ]
        },
        {
            id: 'trade',
            title: isKo ? '상단 방문' : 'Trader Caravan',
            description: isKo ? '상인들이 들러 교역을 제안했습니다.' : 'A trader caravan offers a deal.',
            category: 'noncombat',
            nonCombatSubtype: 'tradeoff',
            weight: 6,
            base: { hp: 0, food: 0, meds: 0, money: 0 },
            choices: [
                {
                    id: 'buy_food',
                    label: isKo ? '식량 구매' : 'Buy Food',
                    description: isKo ? '돈 -1 → 식량 +3' : 'Money -1 → Food +3',
                    delta: { hp: 0, food: 3, meds: 0, money: -1 },
                    requirements: { money: 1 },
                    response: isKo ? '상인에게서 신선한 식량을 샀습니다.' : 'You buy food.'
                },
                {
                    id: 'buy_meds',
                    label: isKo ? '치료제 구매' : 'Buy Meds',
                    description: isKo ? '돈 -1 → 치료제 +2' : 'Money -1 → Meds +2',
                    delta: { hp: 0, food: 0, meds: 2, money: -1 },
                    requirements: { money: 1 },
                    response: isKo ? '상인에게서 치료제를 샀습니다.' : 'You buy meds.'
                },
                {
                    id: 'negotiate',
                    label: isKo ? '협상' : 'Negotiate',
                    description: isKo ? '사교 기술 체크' : 'Social skill check',
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    response: isKo ? '화술을 발휘해 유리한 조건으로 거래를 시도합니다.' : 'You attempt to negotiate a better deal.',
                    skillCheck: {
                        label: isKo ? '협상' : 'Negotiation',
                        group: ['사교'],
                        successDelta: { hp: 0, food: 3, meds: 2, money: -1 },
                        failDelta: { hp: 0, food: 1, meds: 1, money: -2 }
                    }

                },
                {
                    id: 'trade_pass',
                    label: isKo ? '그냥 보내기' : 'Pass',
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    response: isKo ? '거래 없이 상단을 돌려보냈습니다.' : 'You let the caravan pass.'
                }
            ]
        },
        {
            id: 'cargo_pods',
            title: isKo ? '보급 캡슐 추락' : 'Cargo Pods',
            description: isKo ? '하늘에서 보급 캡슐이 떨어졌습니다.' : 'Cargo pods crash nearby.',
            category: 'noncombat',
            nonCombatSubtype: 'support',
            weight: 6,
            base: { hp: 0, food: 0, meds: 0, money: 0 },
            choices: [
                {
                    id: 'cargo_collect',
                    label: isKo ? '물자 챙기기' : 'Collect',
                    description: isKo ? '식량 +1, 치료제 +1, 돈 +1' : 'Food +1, Meds +1, Money +1',
                    delta: { hp: 0, food: 1, meds: 1, money: 1 },
                    response: isKo ? '추락한 캡슐에서 유용한 물자들을 챙겼습니다.' : 'You collect useful supplies.'
                },
                {
                    id: 'cargo_ignore',
                    label: isKo ? '무시하기' : 'Ignore',
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    response: isKo ? '보급품을 포기하고 하던 일에 집중했습니다.' : 'You ignored the pods.'
                }
            ]
        },
        {
            id: 'crop_boom',
            title: isKo ? '풍작' : 'Crop Boom',
            description: isKo ? '작물이 급성장해 풍작이 들었습니다.' : 'Crops surge with unexpected growth.',
            category: 'noncombat',
            nonCombatSubtype: 'support',
            weight: 6,
            base: { hp: 0, food: 0, meds: 0, money: 0 },
            choices: [
                {
                    id: 'crop_harvest',
                    label: isKo ? '수확하기' : 'Harvest',
                    description: isKo ? '재배 기술 체크' : 'Plants skill check',
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    response: isKo ? '풍작을 맞이해 식량을 수확했습니다.' : 'You harvest the crops.',
                    skillCheck: {
                        label: isKo ? '수확' : 'Harvest',
                        group: ['재배'],
                        successDelta: { hp: 0, food: 6, meds: 0, money: 0 },
                        failDelta: { hp: 0, food: 3, meds: 0, money: 0 }
                    }
                },
                {
                    id: 'crop_ignore',
                    label: isKo ? '무시하기' : 'Ignore',
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    response: isKo ? '수확 시기를 놓쳐 작물들이 그대로 밭에서 썩어버렸습니다.' : 'The crops rot in the field.'
                }
            ]
        },
        {
            id: 'blight',
            title: isKo ? '병충해' : 'Blight',
            description: isKo ? '작물이 병충해로 시들고 있습니다.' : 'A blight hits the crops.',
            category: 'noncombat',
            nonCombatSubtype: 'attrition',
            weight: 5,
            base: { hp: 0, food: 0, meds: 0, money: 0 },
            choices: [
                {
                    id: 'blight_remove',
                    label: isKo ? '병든 작물 제거' : 'Remove Blight',
                    description: isKo ? '재배 기술 체크' : 'Plants skill check',
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    response: isKo ? '병충해 확산을 막기 위해 병든 작물을 도려냈습니다.' : 'You remove the blighted crops.',
                    skillCheck: {
                        label: isKo ? '대응' : 'Response',
                        group: ['재배'],
                        successDelta: { hp: 0, food: -1, meds: 0, money: 0 },
                        failDelta: { hp: 0, food: -3, meds: 0, money: 0 }
                    }
                },
                {
                    id: 'blight_ignore',
                    label: isKo ? '방치하기' : 'Ignore',
                    delta: { hp: 0, food: -5, meds: 0, money: 0 },
                    response: isKo ? '병충해를 방치한 결과, 거의 모든 작물이 말라 죽었습니다.' : 'The blight wiped out the crops.'
                }
            ]
        },
        {
            id: 'ship_chunk',
            title: isKo ? '우주선 잔해' : 'Ship Chunk',
            description: isKo ? '우주선 잔해가 추락했습니다.' : 'A ship chunk crashes nearby.',
            category: 'noncombat',
            nonCombatSubtype: 'support',
            weight: 5,
            base: { hp: 0, food: 0, meds: 0, money: 0 },
            choices: [
                {
                    id: 'chunk_salvage',
                    label: isKo ? '잔해 분해' : 'Salvage',
                    description: isKo ? '제작 기술 체크' : 'Crafting skill check',
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    response: isKo ? '잔해를 분해해 고철과 부품을 회수했습니다.' : 'You salvage components from the chunk.',
                    skillCheck: {
                        label: isKo ? '분해' : 'Salvage',
                        group: ['제작'],
                        successDelta: { hp: 0, food: 0, meds: 0, money: 6 },
                        failDelta: { hp: 0, food: 0, meds: 0, money: 2 }
                    }

                },
                {
                    id: 'chunk_ignore',
                    label: isKo ? '방치' : 'Ignore',
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    response: isKo ? '우주선 잔해를 무시하고 일과를 계속했습니다.' : 'You ignored the chunk.'
                }
            ]
        },
        {
            id: 'wanderer',
            title: isKo ? '방랑자 합류' : 'Wanderer Joins',
            description: isKo ? '방랑자가 합류를 요청했습니다.' : 'A wanderer asks to join.',
            category: 'noncombat',
            nonCombatSubtype: 'tradeoff',
            weight: 4,
            base: { hp: 0, food: 0, meds: 0, money: 0 },
            choices: [
                {
                    id: 'wanderer_accept',
                    label: isKo ? '합류 수락' : 'Accept',
                    description: isKo ? '식량 -2 → 돈 +2' : 'Food -2 → Money +2',
                    delta: { hp: 0, food: -2, meds: 0, money: 2 },
                    response: isKo ? '방랑자를 받아들였습니다.' : 'You accept the wanderer.'
                },
                {
                    id: 'wanderer_decline',
                    label: isKo ? '정중히 거절' : 'Decline',
                    description: isKo ? '식량 -1 → 돈 +1' : 'Food -1 → Money +1',
                    delta: { hp: 0, food: -1, meds: 0, money: 1 },
                    response: isKo ? '정중히 거절했습니다.' : 'You decline politely.'
                },
                {
                    id: 'wanderer_interview',
                    label: isKo ? '평판 확인' : 'Interview',
                    description: isKo ? '사교 기술 체크' : 'Social skill check',
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    response: isKo ? '합류 조건을 조율했습니다.' : 'You negotiate conditions.',
                    skillCheck: {
                        label: isKo ? '협상' : 'Negotiation',
                        group: ['사교'],
                        successDelta: { hp: 0, food: -1, meds: 0, money: 3 },
                        failDelta: { hp: 0, food: -2, meds: 0, money: 1 }
                    }
                }
            ]
        },
        {
            id: 'foraging',
            title: isKo ? '채집 성공' : 'Foraging',
            description: isKo ? '근처에서 먹을거리를 찾아냈습니다.' : 'You forage for supplies nearby.',
            category: 'noncombat',
            nonCombatSubtype: 'support',
            weight: 4,
            base: { hp: 0, food: 0, meds: 0, money: 0 },
            choices: [
                {
                    id: 'forage_collect',
                    label: isKo ? '채집하기' : 'Forage',
                    description: isKo ? '식량 +3' : 'Food +3',
                    delta: { hp: 0, food: 3, meds: 0, money: 0 },
                    response: isKo ? '신선한 야생 딸기를 대량으로 채집했습니다.' : 'You forage fresh berries.'
                },
                {
                    id: 'forage_ignore',
                    label: isKo ? '무시' : 'Ignore',
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    response: isKo ? '채집을 포기하고 하던 일에 집중했습니다.' : 'You ignored the berries.'
                }
            ]
        },
        {
            id: 'medical_cache',
            title: isKo ? '의료 상자 발견' : 'Medical Cache',
            description: isKo ? '버려진 의료 상자를 발견했습니다.' : 'You discover a medical cache.',
            category: 'noncombat',
            nonCombatSubtype: 'support',
            weight: 4,
            base: { hp: 0, food: 0, meds: 0, money: 0 },
            choices: [
                {
                    id: 'med_cache_collect',
                    label: isKo ? '의료품 챙기기' : 'Collect',
                    description: isKo ? '치료제 +2' : 'Meds +2',
                    delta: { hp: 0, food: 0, meds: 2, money: 0 },
                    response: isKo ? '상자 안에서 깨끗한 치료제들을 발견했습니다.' : 'You collect clean medical supplies.'
                },
                {
                    id: 'med_cache_ignore',
                    label: isKo ? '방치' : 'Ignore',
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    response: isKo ? '무엇이 들었을지 모를 상자를 멀리하기로 했습니다.' : 'You left the cache alone.'
                }
            ]
        },
        {
            id: 'raiders',
            title: isKo ? '레이더 습격' : 'Raider Attack',
            description: isKo ? '무장한 침입자들이 기지를 습격했습니다!' : 'Raiders assault the colony.',
            category: 'danger',
            weight: 6,
            base: { hp: 0, food: 0, meds: 0, money: 0 },
            choices: [
                {
                    id: 'raid_assault',
                    label: isKo ? '정면전' : 'Counter Attack',
                    description: isKo ? '격투/사격 기술 체크' : 'Melee/Shooting skill check',
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    response: isKo ? '무기를 들고 습격자들과 맞서 싸웁니다.' : 'You fight back against the raiders.',
                    skillCheck: {
                        label: isKo ? '전투' : 'Combat',
                        group: ['격투', '사격'],
                        successDelta: { hp: -2, food: -1, meds: 0, money: 2 },
                        failDelta: { hp: -6, food: -1, meds: 0, money: -1 }
                    }
                },
                {
                    id: 'raid_defend',
                    label: isKo ? '방어전' : 'Hold Position',
                    description: isKo ? '체력 -3, 식량 -1, 돈 -4' : 'HP -3, Food -1, Money -4',
                    delta: { hp: -3, food: -1, meds: 0, money: -4 },
                    response: isKo ? '방어선을 구축해 피해를 줄였습니다.' : 'You fortify and take controlled damage.'
                },
                {
                    id: 'raid_retreat',
                    label: isKo ? '후퇴' : 'Retreat',
                    description: isKo ? '고정 확률 60%' : 'Fixed 60%',
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    response: isKo ? '후퇴하며 물자를 일부 포기했습니다. (가벼운 발/신속/재빠름 특성 보너스 적용)' : 'You retreat and abandon supplies.',
                    skillCheck: {
                        label: isKo ? '후퇴' : 'Retreat',
                        group: ['생존'],
                        fixedChance: 60,
                        successDelta: { hp: -2, food: -2, meds: 0, money: -4 },
                        failDelta: { hp: -6, food: -2, meds: 0, money: -4 }
                    }
                }
            ]
        },
        {
            id: 'mortar_raid',
            title: isKo ? '박격포 습격' : 'Mortar Raid',
            description: isKo ? '적의 박격포가 기지를 두드리며 출혈과 파편 피해를 유발합니다.' : 'Enemy mortars pound the base, causing bleeding and shrapnel injuries.',
            category: 'danger',
            weight: 4,
            base: { hp: 0, food: 0, meds: 0, money: 0 },
            choices: [
                {
                    id: 'mortar_assault',
                    label: isKo ? '박격포 진지 돌파' : 'Storm the Emplacement',
                    description: isKo ? '격투/사격 기술 체크' : 'Melee/Shooting skill check',
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    response: isKo ? '연막을 뚫고 적진으로 돌격합니다.' : 'You charge through the smoke into enemy lines.',
                    skillCheck: {
                        label: isKo ? '돌파' : 'Assault',
                        group: ['격투', '사격'],
                        successDelta: { hp: -3, food: -1, meds: 0, money: 2 },
                        failDelta: { hp: -7, food: -1, meds: 0, money: 2 }
                    }
                },
                {
                    id: 'mortar_counter',
                    label: isKo ? '박격포 맞대응' : 'Counter-battery',
                    description: isKo ? '제작/연구 기술 체크' : 'Crafting/Intellectual skill check',
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    response: isKo ? '급히 포대를 구성해 맞박격포를 쏘아 올립니다.' : 'You assemble a quick battery and fire back.',
                    skillCheck: {
                        label: isKo ? '대응' : 'Counter',
                        group: ['제작', '연구'],
                        successDelta: { hp: -2, food: 0, meds: 0, money: 0 },
                        failDelta: { hp: -5, food: 0, meds: 0, money: -2 }
                    }
                },
                {
                    id: 'mortar_hunker',
                    label: isKo ? '엄폐 및 지혈 (치료제 최소 1개 이상 치료제 1개 기본 소모)' : 'Hunker and Triage',
                    description: isKo ? '의학 기술 체크' : 'Medical skill check',
                    delta: { hp: 0, food: 0, meds: -1, money: 0 },
                    response: isKo ? '두꺼운 벽 뒤로 숨어 출혈을 최소화합니다.' : 'You take cover and focus on stopping the bleeding.',
                    requirements: { meds: 1 },
                    skillCheck: {
                        label: isKo ? '지혈' : 'Triage',
                        group: ['의학'],
                        successDelta: { hp: -2, food: 0, meds: 0, money: 0 },
                        failDelta: { hp: -2, food: 0, meds: -1, money: 0 }
                    }
                }
            ]
        },
        {
            id: 'emp_raid',
            title: isKo ? 'EMP 습격' : 'EMP Raid',
            description: isKo ? 'EMP 폭탄이 터지며 전자기기가 마비됩니다.' : 'An EMP blast knocks out all electronics.',
            category: 'danger',
            weight: 4,
            base: { hp: 0, food: 0, meds: 0, money: 0 },
            choices: [
                {
                    id: 'emp_restore',
                    label: isKo ? '긴급 복구' : 'Emergency Repair',
                    description: isKo ? '제작/연구 기술 체크' : 'Crafting/Intellectual skill check',
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    response: isKo ? '급하게 회로를 복구하고 전원을 재가동합니다.' : 'You patch the circuits and restore power.',
                    skillCheck: {
                        label: isKo ? '복구' : 'Restore',
                        group: ['제작', '연구'],
                        successDelta: { hp: -2, food: 0, meds: 0, money: -1 },
                        failDelta: { hp: -5, food: 0, meds: 0, money: -3 }
                    }
                },
                {
                    id: 'emp_manual_defense',
                    label: isKo ? '수동 방어선' : 'Manual Defense',
                    description: isKo ? '격투/사격 기술 체크' : 'Melee/Shooting skill check',
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    response: isKo ? '포탑 없이 사람 손으로 방어선을 유지합니다.' : 'You hold the line without turrets.',
                    skillCheck: {
                        label: isKo ? '방어' : 'Defense',
                        group: ['격투', '사격'],
                        successDelta: { hp: -3, food: -1, meds: 0, money: 0 },
                        failDelta: { hp: -6, food: -3, meds: 0, money: 0 }
                    }
                },
                {
                    id: 'emp_blackout',
                    label: isKo ? '전원 차단 대기' : 'Power Down',
                    description: isKo ? '체력 -5' : 'HP -5',
                    delta: { hp: -5, food: 0, meds: 0, money: 0 },
                    response: isKo ? '불필요한 손실을 막기 위해 전원을 내리고 버팁니다.' : 'You power down and ride out the disruption.',
                    nextDayEffect: {
                        id: 'emp_blackout_after',
                        sourceEventId: 'emp_raid',
                        remainingDays: 3,
                        dangerBias: 3,
                        tone: 'negative',
                        noteKo: '전력 공백으로 다음날 경계가 약해집니다.',
                        noteEn: 'Power vacuum weakens defenses on the next day.'
                    }
                }
            ]
        },
        {
            id: 'shambler_horde',
            title: isKo ? '대량의 휘청이는자 접근' : 'Shambler Horde',
            description: isKo ? '전투력은 낮지만 끈질긴 움직이는 시체들이 소모전을 강요합니다.' : 'Slow, relentless shamblers force a war of attrition.',
            category: 'danger',
            weight: 5,
            base: { hp: 0, food: 0, meds: 0, money: 0 },
            choices: [
                {
                    id: 'shambler_grind',
                    label: isKo ? '소모전' : 'Grind Them Down',
                    description: isKo ? '격투/사격 기술 체크' : 'Melee/Shooting skill check',
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    response: isKo ? '하나씩 꾸준히 베어 넘깁니다.' : 'You cut them down one by one.',
                    skillCheck: {
                        label: isKo ? '지구전' : 'Attrition',
                        group: ['격투', '사격'],
                        successDelta: { hp: -1, food: -3, meds: 0, money: 0 },
                        failDelta: { hp: -3, food: -5, meds: 0, money: 0 }
                    }
                },
                {
                    id: 'shambler_chokepoint',
                    label: isKo ? '차단선 구축' : 'Build a Chokepoint',
                    description: isKo ? '제작 기술 체크' : 'Crafting skill check',
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    response: isKo ? '문과 바리케이드로 동선을 좁혀 대응합니다.' : 'You funnel them through barricades and doors.',
                    skillCheck: {
                        label: isKo ? '구축' : 'Build',
                        group: ['제작'],
                        successDelta: { hp: 0, food: -2, meds: 0, money: -2 },
                        failDelta: { hp: -2, food: -4, meds: 0, money: -2 }
                    },
                    nextDayEffect: {
                        id: 'shambler_chokepoint_after',
                        sourceEventId: 'shambler_horde',
                        remainingDays: 3,
                        moneyMod: -1,
                        foodGainPenalty: 1,
                        tone: 'negative',
                        noteKo: '긴급 바리케이드 유지비로 다음날 자금이 줄어듭니다.',
                        noteEn: 'Emergency barricade upkeep drains money the next day.'
                    }
                },
                {
                    id: 'shambler_lure',
                    label: isKo ? '미끼 유인' : 'Lure Away',
                    description: isKo ? '생존 기술 체크' : 'Survival skill check',
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    response: isKo ? '소음을 이용해 무리를 다른 방향으로 유인합니다.' : 'You use noise and bait to draw them away.',
                    skillCheck: {
                        label: isKo ? '유인' : 'Lure',
                        group: ['생존'],
                        successDelta: { hp: -2, food: 0, meds: 0, money: -1 },
                        failDelta: { hp: -5, food: 0, meds: 0, money: -1 }
                    }
                }
            ]
        },
        {
            id: 'manhunter',
            title: isKo ? '광포한 동물 무리' : 'Manhunter Pack',
            description: isKo ? '광포해진 동물들이 기지를 덮쳐왔습니다!' : 'A pack of enraged animals attacks.',
            category: 'danger',
            weight: 5,
            base: { hp: 0, food: 0, meds: 0, money: 0 },
            choices: [
                {
                    id: 'hunt',
                    label: isKo ? '사냥' : 'Hunt',
                    description: isKo ? '격투/사격 기술 체크' : 'Melee/Shooting skill check',
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    response: isKo ? '동물들을 사냥해 식량을 확보하려 합니다.' : 'You secure extra food by hunting.',
                    skillCheck: {
                        label: isKo ? '사냥' : 'Hunting',
                        group: ['격투', '사격'],
                        successDelta: { hp: -3, food: 6, meds: 0, money: 0 },
                        failDelta: { hp: -6, food: 4, meds: 0, money: 0 }
                    }
                },
                {
                    id: 'defend',
                    label: isKo ? '방어' : 'Defend',
                    description: isKo ? '체력 -4, 식량 +2' : 'HP -4, Food +2',
                    delta: { hp: -4, food: 2, meds: 0, money: 0 },
                    response: isKo ? '방어를 택해 피해를 줄였습니다.' : 'You defend to reduce damage.',
                    nextDayEffect: {
                        id: 'manhunter_defend_after',
                        sourceEventId: 'manhunter',
                        remainingDays: 3,
                        hpMod: -1,
                        tone: 'negative',
                        noteKo: '방어전 후유증으로 다음날 체력이 감소합니다.',
                        noteEn: 'Defensive strain reduces HP on the next day.'
                    }
                },
                {
                    id: 'avoid',
                    label: isKo ? '회피' : 'Avoid',
                    description: isKo ? '고정 확률 70%' : 'Fixed 70%',
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    response: isKo ? '안전한 곳으로 몸을 피해 위험을 흘려보냈습니다.' : 'You avoid danger but lose the harvest.',
                    skillCheck: {
                        label: isKo ? '회피' : 'Evasion',
                        group: ['생존'],
                        fixedChance: 70,
                        successDelta: { hp: 0, food: 0, meds: 0, money: 0 },
                        failDelta: { hp: -4, food: 0, meds: 0, money: 0 }
                    }
                }
            ]
        },
        {
            id: 'siege_emp_lockdown',
            title: isKo ? '공성: EMP 봉쇄' : 'Siege: EMP Lockdown',
            description: isKo ? '전자장비가 동시에 마비되며 공성 포격이 시작됩니다.' : 'Electronics fail at once while siege bombardment begins.',
            category: 'danger',
            weight: 3,
            base: { hp: 0, food: 0, meds: 0, money: 0 },
            choices: [
                {
                    id: 'siege_emp_push',
                    label: isKo ? '발전기실 돌파' : 'Push Generator Room',
                    description: isKo ? '격투/사격 기술 체크' : 'Melee/Shooting skill check',
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    response: isKo ? '정전 구역을 뚫고 발전기를 재가동하려 합니다.' : 'You force your way into the blackout zone.',
                    skillCheck: {
                        label: isKo ? '재가동 돌파' : 'Restart Push',
                        group: ['격투', '사격'],
                        successDelta: { hp: -3, food: 0, meds: 0, money: 1 },
                        failDelta: { hp: -6, food: -1, meds: -1, money: -2 }
                    }
                },
                {
                    id: 'siege_emp_isolate',
                    label: isKo ? '구역 격리' : 'Sector Isolation',
                    description: isKo ? '체력 -4, 식량 -2, 돈 -2' : 'HP -4, Food -2, Money -2',
                    delta: { hp: -4, food: -2, meds: 0, money: -2 },
                    response: isKo ? '핵심 구역만 남기고 봉쇄해 손실을 제한합니다.' : 'You isolate critical sectors to cap losses.',
                    nextDayEffect: {
                        id: 'siege_emp_isolate_after',
                        sourceEventId: 'siege_emp_lockdown',
                        remainingDays: 3,
                        dangerBias: 2,
                        forceDangerNextDay: true,
                        tone: 'negative',
                        noteKo: 'EMP 잔류파로 적의 추격이 가속됩니다.',
                        noteEn: 'Residual EMP signal accelerates enemy pursuit.'
                    }
                },
                {
                    id: 'siege_emp_rewire',
                    label: isKo ? '수동 배선' : 'Manual Rewire',
                    description: isKo ? '제작/연구 기술 체크' : 'Crafting/Intellectual skill check',
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    response: isKo ? '임시 배선으로 시스템을 최소한으로 복구합니다.' : 'You manually rewire a minimal power grid.',
                    skillCheck: {
                        label: isKo ? '수동 복구' : 'Manual Restore',
                        group: ['제작', '연구'],
                        successDelta: { hp: -2, food: 0, meds: 0, money: -1 },
                        failDelta: { hp: -5, food: -1, meds: 0, money: -3 }
                    }
                }
            ]
        },
        {
            id: 'siege_breach_wave',
            title: isKo ? '공성: 방벽 돌파 웨이브' : 'Siege: Breach Waves',
            description: isKo ? '연속 웨이브가 방벽의 약점을 집요하게 두드립니다.' : 'Successive waves hammer the weakest points of your walls.',
            category: 'danger',
            weight: 3,
            base: { hp: 0, food: 0, meds: 0, money: 0 },
            choices: [
                {
                    id: 'siege_breach_front',
                    label: isKo ? '전면 저지' : 'Frontline Stop',
                    description: isKo ? '격투/사격 기술 체크' : 'Melee/Shooting skill check',
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    response: isKo ? '정면 화력으로 웨이브를 끊으려 합니다.' : 'You attempt to break the wave head-on.',
                    skillCheck: {
                        label: isKo ? '정면 저지' : 'Frontline',
                        group: ['격투', '사격'],
                        successDelta: { hp: -2, food: -1, meds: 0, money: 2 },
                        failDelta: { hp: -6, food: -2, meds: -1, money: -1 }
                    }
                },
                {
                    id: 'siege_breach_fallback',
                    label: isKo ? '후퇴 방어선' : 'Fallback Line',
                    description: isKo ? '체력 -5, 식량 -2, 돈 -1' : 'HP -5, Food -2, Money -1',
                    delta: { hp: -5, food: -2, meds: 0, money: -1 },
                    response: isKo ? '외곽을 포기하고 내부 방어선으로 물러납니다.' : 'You concede the outer wall and retreat inward.',
                    nextDayEffect: {
                        id: 'siege_breach_fallback_after',
                        sourceEventId: 'siege_breach_wave',
                        remainingDays: 3,
                        hpMod: -1,
                        tone: 'negative',
                        noteKo: '후퇴 후유증으로 다음날 체력이 추가로 감소합니다.',
                        noteEn: 'Fallback fatigue reduces HP again on the next day.'
                    }
                },
                {
                    id: 'siege_breach_patch',
                    label: isKo ? '응급 보수' : 'Emergency Patch',
                    description: isKo ? '제작 기술 체크' : 'Crafting skill check',
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    response: isKo ? '틈을 급히 메우며 시간을 법니다.' : 'You patch the breach to buy time.',
                    skillCheck: {
                        label: isKo ? '응급 보수' : 'Patch',
                        group: ['제작'],
                        successDelta: { hp: -2, food: -1, meds: 0, money: -1 },
                        failDelta: { hp: -5, food: -2, meds: 0, money: -3 }
                    }
                }
            ]
        },
        {
            id: 'siege_supply_burn',
            title: isKo ? '공성: 보급고 화재' : 'Siege: Supply Fire',
            description: isKo ? '포격으로 보급고에 불이 붙었습니다. 물자와 생존 사이를 선택해야 합니다.' : 'Shelling ignites your supply depot. You must choose between goods and survival.',
            category: 'danger',
            weight: 3,
            base: { hp: 0, food: 0, meds: 0, money: 0 },
            choices: [
                {
                    id: 'siege_supply_rescue',
                    label: isKo ? '보급고 구조' : 'Depot Rescue',
                    description: isKo ? '의학/제작 기술 체크' : 'Medicine/Crafting skill check',
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    response: isKo ? '화염 속에서 최대한 물자를 건져냅니다.' : 'You salvage supplies from the flames.',
                    skillCheck: {
                        label: isKo ? '화재 구조' : 'Fire Rescue',
                        group: ['의학', '제작'],
                        successDelta: { hp: -2, food: 1, meds: 1, money: -1 },
                        failDelta: { hp: -5, food: -2, meds: -1, money: -3 }
                    }
                },
                {
                    id: 'siege_supply_abandon',
                    label: isKo ? '보급고 포기' : 'Abandon Depot',
                    description: isKo ? '체력 -4, 식량 -3, 치료제 -1, 돈 -2' : 'HP -4, Food -3, Meds -1, Money -2',
                    delta: { hp: -4, food: -3, meds: -1, money: -2 },
                    response: isKo ? '인명 피해를 막기 위해 보급고를 포기합니다.' : 'You abandon the depot to avoid casualties.',
                    nextDayEffect: {
                        id: 'siege_supply_abandon_after',
                        sourceEventId: 'siege_supply_burn',
                        remainingDays: 4,
                        foodMod: -1,
                        foodGainPenalty: 1,
                        tone: 'negative',
                        noteKo: '소실된 보급 여파로 다음날 식량이 더 줄어듭니다.',
                        noteEn: 'Supply loss aftermath reduces food again the next day.'
                    }
                },
                {
                    id: 'siege_supply_counter',
                    label: isKo ? '역포격' : 'Counter Bombard',
                    description: isKo ? '사격/연구 기술 체크' : 'Shooting/Intellectual skill check',
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    response: isKo ? '적 포대를 제압해 화재 확산을 멈추려 합니다.' : 'You counter-bombard to stop further spread.',
                    skillCheck: {
                        label: isKo ? '역포격' : 'Counter Fire',
                        group: ['사격', '연구'],
                        successDelta: { hp: -2, food: -1, meds: 0, money: 1 },
                        failDelta: { hp: -6, food: -3, meds: -1, money: -2 }
                    }
                }
            ]
        },
        {
            id: 'siege_signal_jamming',
            title: isKo ? '공성: 통신 재밍' : 'Siege: Signal Jamming',
            description: isKo ? '적이 통신과 센서를 교란해 지휘 체계를 흔듭니다.' : 'Enemy jamming disrupts comms and sensor coordination.',
            category: 'danger',
            weight: 3,
            base: { hp: 0, food: 0, meds: 0, money: 0 },
            choices: [
                {
                    id: 'siege_signal_trace',
                    label: isKo ? '재밍 원점 추적' : 'Trace Source',
                    description: isKo ? '연구/사격 기술 체크' : 'Intellectual/Shooting skill check',
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    response: isKo ? '재밍 신호를 역추적해 교란원을 노립니다.' : 'You backtrack the signal and strike the jammer.',
                    skillCheck: {
                        label: isKo ? '신호 추적' : 'Signal Trace',
                        group: ['연구', '사격'],
                        successDelta: { hp: -2, food: 0, meds: 0, money: 1 },
                        failDelta: { hp: -5, food: -1, meds: 0, money: -2 }
                    },
                    nextDayEffect: {
                        id: 'siege_signal_trace_after',
                        sourceEventId: 'siege_signal_jamming',
                        remainingDays: 3,
                        dangerBias: -2,
                        tone: 'positive',
                        noteKo: '교란원 타격으로 다음날 위험이 낮아집니다.',
                        noteEn: 'Jammer disruption lowers danger on the next day.'
                    }
                },
                {
                    id: 'siege_signal_local',
                    label: isKo ? '로컬 수동 운영' : 'Local Manual Ops',
                    description: isKo ? '체력 -3, 돈 -2' : 'HP -3, Money -2',
                    delta: { hp: -3, food: 0, meds: 0, money: -2 },
                    response: isKo ? '자동화를 포기하고 수동 운영으로 버팁니다.' : 'You fall back to manual local operations.',
                    nextDayEffect: {
                        id: 'siege_signal_local_after',
                        sourceEventId: 'siege_signal_jamming',
                        remainingDays: 4,
                        hpMod: -1,
                        disableHealing: true,
                        tone: 'negative',
                        noteKo: '수동 운영 피로가 누적되어 회복이 봉쇄됩니다.',
                        noteEn: 'Manual-ops fatigue accumulates and blocks recovery.'
                    }
                },
                {
                    id: 'siege_signal_silent',
                    label: isKo ? '침묵 프로토콜' : 'Silent Protocol',
                    description: isKo ? '식량 -1, 치료제 -1' : 'Food -1, Meds -1',
                    delta: { hp: 0, food: -1, meds: -1, money: 0 },
                    response: isKo ? '신호 노출을 막기 위해 활동을 축소합니다.' : 'You reduce activity to avoid signal exposure.',
                    nextDayEffect: {
                        id: 'siege_signal_silent_after',
                        sourceEventId: 'siege_signal_jamming',
                        remainingDays: 3,
                        dangerBias: 2,
                        forceDangerNextDay: true,
                        tone: 'negative',
                        noteKo: '침묵으로 적을 속였지만 추격이 따라붙습니다.',
                        noteEn: 'Silence buys time, but pursuit still catches up.'
                    }
                }
            ]
        },
        {
            id: 'siege_night_hunt',
            title: isKo ? '공성: 야간 추격전' : 'Siege: Night Hunt',
            description: isKo ? '야간 정찰대가 기지 외곽을 집요하게 훑고 있습니다.' : 'Night hunters sweep the perimeter relentlessly.',
            category: 'danger',
            weight: 3,
            base: { hp: 0, food: 0, meds: 0, money: 0 },
            choices: [
                {
                    id: 'siege_night_ambush',
                    label: isKo ? '매복 역습' : 'Ambush Counterstrike',
                    description: isKo ? '격투/사격 기술 체크' : 'Melee/Shooting skill check',
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    response: isKo ? '야음을 이용해 정찰대를 역습합니다.' : 'You use darkness to ambush the hunters.',
                    skillCheck: {
                        label: isKo ? '야간 역습' : 'Night Ambush',
                        group: ['격투', '사격'],
                        successDelta: { hp: -2, food: 0, meds: 0, money: 1 },
                        failDelta: { hp: -6, food: -1, meds: -1, money: -1 }
                    },
                    nextDayEffect: {
                        id: 'siege_night_ambush_after',
                        sourceEventId: 'siege_night_hunt',
                        remainingDays: 3,
                        dangerBias: -1,
                        tone: 'positive',
                        noteKo: '역습 성공 여파로 다음날 적 압박이 소폭 줄어듭니다.',
                        noteEn: 'Successful ambush slightly lowers pressure next day.'
                    }
                },
                {
                    id: 'siege_night_lockdown',
                    label: isKo ? '완전 통제' : 'Full Lockdown',
                    description: isKo ? '체력 -2, 식량 -2, 돈 -1' : 'HP -2, Food -2, Money -1',
                    delta: { hp: -2, food: -2, meds: 0, money: -1 },
                    response: isKo ? '기지를 봉쇄하고 손실을 통제합니다.' : 'You lock down the base and minimize exposure.',
                    nextDayEffect: {
                        id: 'siege_night_lockdown_after',
                        sourceEventId: 'siege_night_hunt',
                        remainingDays: 4,
                        foodMod: -1,
                        foodGainPenalty: 1,
                        tone: 'negative',
                        noteKo: '통제 유지 비용으로 다음날 식량이 추가 소모됩니다.',
                        noteEn: 'Lockdown upkeep consumes extra food next day.'
                    }
                },
                {
                    id: 'siege_night_track',
                    label: isKo ? '정찰 역추적' : 'Track Their Scouts',
                    description: isKo ? '생존/연구 기술 체크' : 'Survival/Intellectual skill check',
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    response: isKo ? '추적 흔적을 따라 적 동선을 파악합니다.' : 'You track movement patterns of enemy scouts.',
                    skillCheck: {
                        label: isKo ? '역추적' : 'Counter Tracking',
                        group: ['생존', '연구'],
                        successDelta: { hp: -1, food: 0, meds: 0, money: 0 },
                        failDelta: { hp: -4, food: -1, meds: 0, money: -1 }
                    },
                    nextDayEffect: {
                        id: 'siege_night_track_after',
                        sourceEventId: 'siege_night_hunt',
                        remainingDays: 5,
                        dangerBias: 3,
                        tone: 'negative',
                        noteKo: '역추적 흔적이 노출되어 다음날 위험이 커집니다.',
                        noteEn: 'Tracking traces expose your route, raising next-day danger.'
                    }
                }
            ]
        },
        {
            id: 'disease',
            title: isKo ? '질병 발생' : 'Disease Outbreak',
            description: isKo ? '질병이 퍼져 몸이 약해졌습니다.' : 'A disease spreads through the camp.',
            category: 'noncombat',
            nonCombatSubtype: 'attrition',
            weight: 3,
            base: { hp: 0, food: 0, meds: 0, money: 0 },
            choices: [
                {
                    id: 'treat_with_meds',
                    label: isKo ? '치료제 사용' : 'Use Meds',
                    description: isKo ? '체력 +2, 치료제 -1' : 'HP +2, Meds -1',
                    delta: { hp: 2, food: 0, meds: -1, money: 0 },
                    response: isKo ? '치료제를 써 상태가 회복되었습니다.' : 'You use meds and recover.',
                    requirements: { meds: 1 }
                },
                {
                    id: 'treat_without_meds',
                    label: isKo ? '무치료 치료' : 'Treat Without Meds',
                    description: isKo ? '의학 기술 체크' : 'Medical skill check',
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    response: isKo ? '치료제 없이 치료를 시도했습니다.' : 'You attempt treatment without meds.',
                    skillCheck: {
                        label: isKo ? '치료' : 'Treatment',
                        group: ['의학'],
                        successDelta: { hp: 1, food: 0, meds: 0, money: 0 },
                        failDelta: { hp: -2, food: 0, meds: 0, money: 0 }
                    }
                }
            ]
        },
        {
            id: 'cold_snap',
            title: isKo ? '한파' : 'Cold Snap',
            description: isKo ? '갑작스러운 한파가 찾아왔습니다.' : 'A sudden cold snap hits.',
            category: 'noncombat',
            nonCombatSubtype: 'attrition',
            weight: 3,
            base: { hp: 0, food: 0, meds: 0, money: 0 },
            choices: [
                {
                    id: 'cold_endure',
                    label: isKo ? '한파 견디기' : 'Endure',
                    description: isKo ? '재배 기술 체크' : 'Plants skill check',
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    response: isKo ? '추위에 떨며 한파를 견뎌냈습니다.' : 'You endure the cold.',
                    skillCheck: {
                        label: isKo ? '대응' : 'Response',
                        group: ['재배'],
                        successDelta: { hp: -1, food: 0, meds: 0, money: 0 },
                        failDelta: { hp: -1, food: -2, meds: 0, money: 0 }
                    }
                }
            ]
        },
        {
            id: 'heat_wave',
            title: isKo ? '폭염' : 'Heat Wave',
            description: isKo ? '무더위가 이어지고 있습니다.' : 'Relentless heat drains you.',
            category: 'noncombat',
            nonCombatSubtype: 'attrition',
            weight: 2,
            base: { hp: 0, food: 0, meds: 0, money: 0 },
            choices: [
                {
                    id: 'heat_endure',
                    label: isKo ? '폭염 견디기' : 'Endure',
                    description: isKo ? '체력 -1' : 'HP -1',
                    delta: { hp: -1, food: 0, meds: 0, money: 0 },
                    response: isKo ? '무더위 속에서 하루를 버텼습니다.' : 'You endure the heat wave.'
                }
            ]
        },
        {
            id: 'fire',
            title: isKo ? '화재' : 'Fire',
            description: isKo ? '화재가 발생해 귀중품들이 불타고 있습니다!' : 'A fire destroys your funds.',
            category: 'noncombat',
            nonCombatSubtype: 'attrition',
            weight: 1,
            base: { hp: 0, food: 0, meds: 0, money: 0 },
            choices: [
                {
                    id: 'fire_extinguish',
                    label: isKo ? '화재 진압' : 'Extinguish',
                    description: isKo ? '제작 기술 체크' : 'Crafting skill check',
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    response: isKo ? '목숨을 걸고 불길을 진압했습니다.' : 'You extinguish the fire.',
                    skillCheck: {
                        label: isKo ? '진압' : 'Extinguish',
                        group: ['제작'],
                        successDelta: { hp: -1, food: 0, meds: 0, money: -1 },
                        failDelta: { hp: -2, food: 0, meds: 0, money: -3 }
                    }
                }
            ]
        },
        {
            id: 'infestation',
            title: isKo ? '곤충 군락 습격' : 'Infestation',
            description: isKo ? '드릴 작업 중 땅속에서 거대한 곤충들이 쏟아져 나옵니다!' : 'Insects emerge from the ground!',
            category: 'danger',
            weight: 3,
            base: { hp: 0, food: 0, meds: 0, money: 0 },
            choices: [
                {
                    id: 'infest_fight',
                    label: isKo ? '군락 소탕' : 'Fight',
                    description: isKo ? '격투/사격 기술 체크' : 'Melee/Shooting skill check',
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    response: isKo ? '무기를 들고 곤충들과 맞서 싸워 군락을 파괴했습니다.' : 'You fought back the infestation.',
                    skillCheck: {
                        label: isKo ? '교전' : 'Engagement',
                        group: ['격투', '사격'],
                        successDelta: { hp: -3, food: 4, meds: 0, money: 0 },
                        failDelta: { hp: -6, food: -2, meds: 0, money: 0 }
                    }
                },
                {
                    id: 'infest_suppress',
                    label: isKo ? '화력 진압' : 'Suppress',
                    description: isKo ? '격투/사격 기술 체크' : 'Melee/Shooting skill check',
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    response: isKo ? '흔적도 없이 곤충을 쓸어버렸습니다.' : 'You suppress and wipe out the insects.',
                    skillCheck: {
                        label: isKo ? '진압' : 'Suppress',
                        group: ['격투', '사격'],
                        successDelta: { hp: -2, food: 0, meds: 0, money: 0 },
                        failDelta: { hp: -5, food: 0, meds: 0, money: 0 }
                    },
                    nextDayEffect: {
                        id: 'infest_suppress_after',
                        sourceEventId: 'infestation',
                        remainingDays: 3,
                        dangerBias: 3,
                        tone: 'negative',
                        noteKo: '잔존 군락 자극으로 다음날 위험이 높아집니다.',
                        noteEn: 'Residual hive agitation increases danger on the next day.'
                    }
                }
            ]
        },
        {
            id: 'toxic_fallout',
            title: isKo ? '독성 낙진' : 'Toxic Fallout',
            description: isKo ? '하늘에서 정체 모를 독성 가루가 내립니다.' : 'Toxic dust falls from the sky.',
            category: 'noncombat',
            nonCombatSubtype: 'attrition',
            weight: 2,
            base: { hp: 0, food: 0, meds: 0, money: 0 },
            choices: [
                {
                    id: 'fallout_stay',
                    label: isKo ? '실내 대피' : 'Stay Inside',
                    description: isKo ? '식량 -3' : 'Food -3',
                    delta: { hp: 0, food: -3, meds: 0, money: 0 },
                    response: isKo ? '실내에서 버티며 낙진이 끝나기를 기다립니다.' : 'You wait out the fallout indoors.'
                }
            ]
        },
        {
            id: 'psychic_drone',
            title: isKo ? '심리적 파동' : 'Psychic Drone',
            description: isKo ? '머릿속을 울리는 기분 나쁜 파동이 기지에 퍼집니다.' : 'A psychic wave distresses everyone.',
            category: 'mind',
            weight: 2,
            base: { hp: 0, food: 0, meds: 0, money: 0 },
            choices: [
                {
                    id: 'drone_resist',
                    label: isKo ? '정신 집중' : 'Resist',
                    description: isKo ? '연구 기술 체크' : 'Intellectual skill check',
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    response: isKo ? '강한 정신력으로 파동을 이겨내려 노력합니다.' : 'You focus your mind to resist.',
                    skillCheck: {
                        label: isKo ? '집중' : 'Focus',
                        group: ['Intellectual'],
                        successDelta: { hp: 0, food: 0, meds: 0, money: 0 },
                        failDelta: { hp: -3, food: 0, meds: 0, money: 0 }
                    }
                }
            ]
        },
        {
            id: 'madness_frenzy',
            title: isKo ? '광란' : 'Frenzy',
            description: isKo
                ? '환청과 환시가 폭주합니다. 다음 며칠간 사건 정보가 제대로 읽히지 않을 수 있습니다.'
                : 'Hallucinations and noise surge. Event text may become unreadable for the next few days.',
            category: 'mind',
            weight: 1,
            base: { hp: 0, food: 0, meds: 0, money: 0 },
            choices: [
                {
                    id: 'frenzy_anchor',
                    label: isKo ? '이성을 붙잡는다' : 'Anchor Your Mind',
                    description: isKo ? '연구/사교 기술 체크' : 'Intellectual/Social skill check',
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    response: isKo ? '마음이 무너지는 감각을 억지로 붙잡습니다.' : 'You force your mind to hold together.',
                    skillCheck: {
                        label: isKo ? '정신 고정' : 'Mental Anchor',
                        group: ['Intellectual', 'Social'],
                        successDelta: { hp: -1, food: 0, meds: 0, money: 0 },
                        failDelta: { hp: -3, food: 0, meds: 0, money: 0 }
                    },
                    nextDayEffect: {
                        id: 'frenzy_blindness_anchor',
                        sourceEventId: 'madness_frenzy',
                        remainingDays: 3,
                        obfuscateUi: true,
                        applyBeforeEra100: true,
                        tone: 'negative',
                        noteKo: '광란 후유증: 다음 3일간 사건/선택지 텍스트를 식별할 수 없습니다.',
                        noteEn: 'Frenzy aftereffect: event and choice text become unreadable for 3 days.'
                    }
                },
                {
                    id: 'frenzy_sedate',
                    label: isKo ? '진정제 투여' : 'Use Sedatives',
                    description: isKo ? '치료제 1 소모, 체력 -1' : 'Spend 1 meds, HP -1',
                    requirements: { meds: 1 },
                    delta: { hp: -1, food: 0, meds: -1, money: 0 },
                    response: isKo ? '진정제로 몸은 가라앉았지만 판단은 흐려집니다.' : 'Sedatives calm your body, but your judgment blurs.',
                    nextDayEffect: {
                        id: 'frenzy_blindness_sedate',
                        sourceEventId: 'madness_frenzy',
                        remainingDays: 3,
                        obfuscateUi: true,
                        applyBeforeEra100: true,
                        tone: 'negative',
                        noteKo: '광란 후유증: 다음 3일간 사건/선택지 텍스트를 식별할 수 없습니다.',
                        noteEn: 'Frenzy aftereffect: event and choice text become unreadable for 3 days.'
                    }
                }
            ]
        },
        {
            id: 'soul_duel',
            title: isKo ? '영혼의 승부' : 'Soul Duel',
            description: isKo ? '상대는 정체불명의 정착민입니다.' : 'Your opponent is an unknown settler.',
            category: 'mind',
            weight: 1,
            base: { hp: 0, food: 0, meds: 0, money: 0 }
        },
        {
            id: 'breakup',
            title: isKo ? '이별' : 'Breakup',
            description: isKo ? '사랑하던 연인이 당신을 떠났습니다. 마음이 찢어지는 듯한 고통을 느낍니다.' : 'Your lover has left you. You feel a heart-wrenching pain.',
            category: 'mind',
            weight: 2,
            base: { hp: -2, food: 0, meds: 0, money: 0 },
            choices: [
                {
                    id: 'breakup_accept',
                    label: isKo ? '받아들이기' : 'Accept',
                    description: isKo ? '슬픔을 견딥니다.' : 'Endure the sadness.',
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    response: isKo ? '시간이 약일 것입니다...' : 'Time will heal...'
                }
            ]
        },
        {
            id: 'marriage',
            title: isKo ? '결혼식' : 'Marriage Ceremony',
            description: isKo ? '연인과 평생을 함께하기로 약속했습니다. 축복 속에서 결혼식이 열립니다.' : 'You and your lover promised to be together forever. A wedding is held amidst blessings.',
            category: 'mind',
            weight: 2,
            base: { hp: 0, food: 0, meds: 0, money: 0 },
            choices: [
                {
                    id: 'celebrate',
                    label: isKo ? '축하한다' : 'Celebrate',
                    description: isKo ? '모두가 기뻐합니다.' : 'Everyone is happy.',
                    delta: { hp: 2, food: -5, meds: 0, money: 0 },
                    response: isKo ? '행복한 결혼식이었습니다. 기분이 매우 좋습니다.' : 'It was a happy wedding. Mood is very good.'
                }
            ]
        },
        {
            id: 'divorce',
            title: isKo ? '이혼' : 'Divorce',
            description: isKo ? '배우자와의 관계가 돌이킬 수 없이 악화되었습니다. 결국 각자의 길을 가기로 했습니다.' : 'Relationship with spouse has deteriorated irreversibly. You decided to go separate ways.',
            category: 'mind',
            weight: 2,
            base: { hp: 0, food: 0, meds: 0, money: 0 },
            choices: [
                {
                    id: 'accept_divorce',
                    label: isKo ? '받아들인다' : 'Accept',
                    delta: { hp: -2, food: 0, meds: 0, money: 0 },
                    response: isKo ? '씁쓸하지만 어쩔 수 없습니다. 마음이 아픕니다.' : 'Bitter but inevitable. Heartbroken.'
                }
            ]
        },
        {
            id: 'pet_death',
            title: isKo ? '반려동물의 죽음' : 'Death of a Pet',
            description: isKo ? '기지에서 오랫동안 함께한 애정하는 반려동물이 세상을 떠났습니다.' : 'Your beloved bonded pet has passed away.',
            category: 'mind',
            weight: 2,
            base: { hp: -3, food: 0, meds: 0, money: 0 },
            choices: [
                {
                    id: 'pet_mourn',
                    label: isKo ? '애도하기' : 'Mourn',
                    description: isKo ? '슬픔에 잠깁니다.' : 'Mourn the loss.',
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    response: isKo ? '무지개 다리를 건넌 그 아이를 추억합니다.' : 'You remember the pet fondly.'
                }
            ]
        },
        {
            id: 'psychic_soother',
            title: isKo ? '정신 안정기' : 'Psychic Soother',
            description: isKo ? '기분 좋은 파동이 정착지에 퍼지며 마음이 평온해집니다.' : 'A pleasant psychic wave spreads, bringing peace of mind.',
            category: 'mind',
            weight: 3,
            base: { hp: 2, food: 0, meds: 0, money: 0 },
            choices: [
                {
                    id: 'soother_enjoy',
                    label: isKo ? '평온 즐기기' : 'Enjoy the Peace',
                    delta: { hp: 1, food: 0, meds: 0, money: 0 },
                    response: isKo ? '몸과 마음이 회복되는 것을 느낍니다.' : 'You feel your body and mind recovering.'
                }
            ]
        },
        {
            id: 'party',
            title: isKo ? '파티' : 'Party',
            description: isKo ? '정착민들이 모여 즐거운 파티를 엽니다! 기분이 최고조에 달합니다.' : 'Everyone gathers for a party! Spirits are high.',
            category: 'quiet',
            weight: 5,
            base: { hp: 2, food: -1, meds: 0, money: 0 },
            choices: [
                {
                    id: 'party_dance',
                    label: isKo ? '춤추고 즐기기' : 'Dance and Enjoy',
                    delta: { hp: 1, food: 0, meds: 0, money: 0 },
                    response: isKo ? '오랜만의 즐거운 시간에 활력이 샘솟습니다.' : 'The fun time rejuvenates you.'
                }
            ]
        },
        {
            id: 'solar_flare',
            title: isKo ? '태양 흑점 폭발' : 'Solar Flare',
            description: isKo ? '강력한 자기장 폭풍이 몰아쳐 모든 전자기기가 마비되었습니다!' : 'A solar flare disables all electronics.',
            category: 'noncombat',
            nonCombatSubtype: 'attrition',
            weight: 3,
            base: { hp: 0, food: 0, meds: 0, money: 0 },
            choices: [
                {
                    id: 'flare_check',
                    label: isKo ? '장비 점검' : 'Check Gear',
                    description: isKo ? '제작 기술 체크' : 'Crafting skill check',
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    response: isKo ? '기기들을 보호하려 노력했지만 일부 부품이 타버렸습니다.' : 'You tried to save the gear.',
                    skillCheck: {
                        label: isKo ? '점검' : 'Check',
                        group: ['제작'],
                        successDelta: { hp: 0, food: 0, meds: 0, money: -1 },
                        failDelta: { hp: 0, food: 0, meds: 0, money: -3 }
                    }
                },
                {
                    id: 'solar_ignore',
                    label: isKo ? '방치' : 'Ignore',
                    delta: { hp: 0, food: 0, meds: 0, money: -4 },
                    response: isKo ? '전자기기 보호를 포기했습니다. 상당량의 장비가 과부하로 타버렸습니다.' : 'You let the devices burn out.'
                }
            ]
        },
        {
            id: 'meteorite',
            title: isKo ? '운석 낙하' : 'Meteorite',
            description: isKo ? '거대한 운석이 기지 근처에 추락했습니다!' : 'A meteorite crashes nearby.',
            category: 'noncombat',
            nonCombatSubtype: 'tradeoff',
            weight: 3,
            base: { hp: 0, food: 0, meds: 0, money: 0 },
            choices: [
                {
                    id: 'meteor_mine',
                    label: isKo ? '채굴하기' : 'Mine',
                    description: isKo ? '생존 기술 체크' : 'Survival skill check',
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    response: isKo ? '힘들게 운석을 채굴하여 귀중한 은을 확보했습니다.' : 'You mined the meteorite for silver.',
                    skillCheck: {
                        label: isKo ? '채굴' : 'Mining',
                        group: ['제작'],
                        successDelta: { hp: -1, food: 0, meds: 0, money: 5 },
                        failDelta: { hp: -3, food: 0, meds: 0, money: 2 }
                    }
                },
                {
                    id: 'meteor_ignore',
                    label: isKo ? '방치' : 'Ignore',
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    response: isKo ? '위험을 피해 운석을 방치했습니다.' : 'You left the meteorite alone.'
                }
            ]
        },
        {
            id: 'thrumbo',
            title: isKo ? '트럼보 출현' : 'Thrumbo Passes',
            description: isKo ? '전설적인 생물, 트럼보가 기지 근처를 배회합니다.' : 'A mythical Thrumbo is wandering nearby.',
            category: 'noncombat',
            nonCombatSubtype: 'support',
            weight: 2,
            base: { hp: 0, food: 0, meds: 0, money: 0 },
            choices: [
                {
                    id: 'thrumbo_observe',
                    label: isKo ? '조심히 관찰' : 'Observe',
                    description: isKo ? '사교 기술 체크' : 'Social skill check',
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    response: isKo ? '먼발치에서 트럼보를 관찰하며 생태 정보를 얻었습니다.' : 'You gained data by observing the Thrumbo.',
                    skillCheck: {
                        label: isKo ? '관찰' : 'Observation',
                        group: ['사교'],
                        successDelta: { hp: 0, food: 2, meds: 0, money: 0 },
                        failDelta: { hp: 0, food: 0, meds: 0, money: 0 }
                    }
                },
                {
                    id: 'thrumbo_ignore',
                    label: isKo ? '무시한다' : 'Ignore',
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    response: isKo ? '전설적인 생물이 기지 근처를 배회하지만, 관심을 끄기로 했습니다.' : 'You ignore the Thrumbo.'
                }
            ]
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

const applyTraitChoices = (event: SimEvent, traitIds: Set<string>, skillMap: Record<string, number>, language: string) => {
    const isKo = language === 'ko';
    const choices = event.choices ? [...event.choices] : [];

    // Global high skill checks
    const shooting = skillMap[isKo ? '사격' : 'Shooting'] || 0;
    const melee = skillMap[isKo ? '격투' : 'Melee'] || 0;
    const social = skillMap[isKo ? '사교' : 'Social'] || 0;
    const crafting = skillMap[isKo ? '제작' : 'Crafting'] || 0;
    const medical = skillMap[isKo ? '의학' : 'Medical'] || 0;
    const plants = skillMap[isKo ? '재배' : 'Plants'] || 0;
    const intellectual = skillMap[isKo ? '연구' : 'Intellectual'] || 0;

    // QUIET.md Special Choices
    if (event.id === 'quiet_day') {
        if (Math.random() < 0.15) {
            choices.push({
                id: 'work_day',
                label: isKo ? '일한다' : 'Work',
                description: isKo ? '돈 +3' : 'Money +3',
                delta: { hp: 0, food: 0, meds: 0, money: 3 },
                response: isKo ? '열심히 일해 은을 꽤 벌었습니다.' : 'You worked hard and earned quite a bit of silver.',
                isRareSpawn: true
            });
        }
        if ((traitIds.has('industrious') || traitIds.has('hard_worker')) && Math.random() < 0.10) {
            choices.push({
                id: 'work_overtime',
                label: isKo ? '야근' : 'Overtime',
                description: isKo ? '제작 기술 체크' : 'Crafting skill check',
                delta: { hp: 0, food: 0, meds: 0, money: 0 },
                response: isKo ? '야근으로 추가 물자를 확보했습니다.' : 'You work overtime for extra supplies.',
                isSpecial: true,
                specialReason: isKo ? (traitIds.has('hard_worker') ? '근면성실' : '일벌레') : 'Work Ethic',
                isRareSpawn: true,
                skillCheck: {
                    label: isKo ? '정진' : 'Hard Work',
                    group: ['제작'],
                    chanceMultiplier: 2,
                    successDelta: { hp: 0, food: 3, meds: 0, money: 3 },
                    failDelta: { hp: 0, food: 0, meds: 0, money: 0 }
                }
            });
        }
        if (traitIds.has('lazy') && Math.random() < 0.1) {
            choices.push({
                id: 'rest_day',
                label: isKo ? '휴식' : 'Rest',
                description: isKo ? '의학 기술 체크' : 'Medical skill check',
                delta: { hp: 0, food: 0, meds: 0, money: 0 },
                response: isKo ? '휴식을 택해 체력을 회복했습니다.' : 'You rest and recover.',
                isSpecial: true,
                specialReason: isKo ? '게으름' : 'Lazy',
                isRareSpawn: true,
                skillCheck: {
                    label: isKo ? '휴식' : 'Rest',
                    group: ['의학'],
                    chanceMultiplier: 2,
                    successDelta: { hp: 3, food: 0, meds: 0, money: 0 },
                    failDelta: { hp: 0, food: 0, meds: 0, money: 0 }
                }
            });
        }
    }

    // NONCOMBAT.md Special Choices
    if (event.id === 'trade') {
        if (social >= 12) {
            choices.push({
                id: 'master_trade',
                label: isKo ? '전설적인 거래' : 'Legendary Trade',
                description: isKo ? '식량 +5, 치료제 +3, 돈 +5' : 'Food +5, Meds +3, Money +5',
                delta: { hp: 0, food: 5, meds: 3, money: 5 },
                response: isKo ? '당신의 화술과 비전에 매료된 상인이 보따리를 풀었습니다.' : 'The trader was charmed by your words and vision, and gave you a legendary deal.',
                isSpecial: true,
                specialReason: isKo ? '사교 12+' : 'Social 12+'

            });
        }
        if (traitIds.has('kind')) {
            choices.push({
                id: 'kind_help',
                label: isKo ? '호의 베풀기' : 'Kind Offer',
                description: isKo ? '사교 기술 체크' : 'Social skill check',
                delta: { hp: 0, food: 0, meds: 0, money: 0 },
                response: isKo ? '호의로 거래를 시도했습니다.' : 'You offer kindness in the deal.',
                isSpecial: true,
                specialReason: isKo ? '다정다감' : 'Kind',
                skillCheck: {
                    label: isKo ? '호의' : 'Kindness',
                    group: ['사교'],
                    chanceMultiplier: 2,
                    successDelta: { hp: 0, food: 2, meds: 2, money: -1 },
                    failDelta: { hp: 0, food: 0, meds: 0, money: -1 }
                }

            });
        }
        if (traitIds.has('abrasive')) {
            choices.push({
                id: 'abrasive_threat',
                label: isKo ? '협박' : 'Intimidate',
                description: isKo ? '격투/사격 기술 체크' : 'Melee/Shooting skill check',
                delta: { hp: 0, food: 0, meds: 0, money: 0 },
                response: isKo ? '협박으로 거래를 시도했습니다.' : 'You attempt to threaten the trader.',
                isSpecial: true,
                specialReason: isKo ? '직설적' : 'Abrasive',
                skillCheck: {
                    label: isKo ? '협박' : 'Intimidation',
                    group: ['격투', '사격'],
                    chanceMultiplier: 2,
                    successDelta: { hp: 0, food: 2, meds: 1, money: 2 },
                    failDelta: { hp: -1, food: 0, meds: 0, money: -1 }
                }

            });
        }
    }

    if (event.id === 'blight' && plants >= 12) {
        choices.push({
            id: 'plant_save',
            label: isKo ? '해충 전문가' : 'Pest Specialist',
            description: isKo ? '식량 +2' : 'Food +2',
            delta: { hp: 0, food: 2, meds: 0, money: 0 },
            response: isKo ? '해충 전문가인 당신에게 이 정도 병충해는 아무것도 아니었습니다.' : 'As a pest specialist, you saved the crops with ease.',
            isSpecial: true,
            specialReason: isKo ? '재배 12+' : 'Plants 12+'
        });
    }

    if (event.id === 'ship_chunk' && crafting >= 12) {
        choices.push({
            id: 'perfect_salvage',
            label: isKo ? '정밀 분해' : 'Precision Salvage',
            description: isKo ? '제작 기술 체크' : 'Crafting skill check',
            delta: { hp: 0, food: 0, meds: 0, money: 0 },
            response: isKo ? '당신의 정밀한 분해 기술 덕에 막대한 이득을 챙겼습니다.' : 'Your precision salvage earned you a fortune.',
            isSpecial: true,
            specialReason: isKo ? '제작 12+' : 'Crafting 12+',
            skillCheck: {
                label: isKo ? '정밀 분해' : 'Precision Salvage',
                group: ['제작'],
                advanced: true,
                successDelta: { hp: 0, food: 0, meds: 0, money: 10 },
                failDelta: { hp: 0, food: 0, meds: 0, money: 4 }
            }

        });
    }

    // DANGER.md Special Choices
    if (event.id === 'raiders') {
        if (shooting >= 12 || melee >= 12) {
            choices.push({
                id: 'raid_counter',
                label: isKo ? '완벽한 역습' : 'Perfect Counter',
                description: isKo ? '식량 +2, 치료제 +2, 돈 +6' : 'Food +2, Meds +2, Money +6',
                delta: { hp: 0, food: 2, meds: 2, money: 6 },
                response: isKo ? '완벽한 전술로 피해 없이 적들을 소탕했습니다.' : 'With perfect tactics, you wiped out the raiders without any damage.',
                isSpecial: true,
                specialReason: isKo ? '격투/사격 12+' : 'Melee/Shooting 12+'
            });
        }
        if (traitIds.has('tough')) {
            choices.push({
                id: 'tough_charge',
                label: isKo ? '강인한 돌격' : 'Tough Charge',
                description: isKo ? '격투/사격 기술 체크' : 'Melee/Shooting skill check',
                delta: { hp: 0, food: 0, meds: 0, money: 0 },
                response: isKo ? '강인함을 믿고 돌격했습니다.' : 'You charge with confidence.',
                isSpecial: true,
                specialReason: isKo ? '강인함' : 'Tough',
                skillCheck: {
                    label: isKo ? '돌격' : 'Charge',
                    group: ['격투', '사격'],
                    successDelta: { hp: -4, food: -1, meds: 0, money: 2 },
                    failDelta: { hp: -6, food: -1, meds: 0, money: 2 }
                }
            });
        }
        if (traitIds.has('wimp')) {
            choices.push({
                id: 'wimp_hide',
                label: isKo ? '은신' : 'Stealth',
                description: isKo ? '고정 확률 70%' : 'Fixed 70%',
                delta: { hp: 0, food: 0, meds: 0, money: 0 },
                response: isKo ? '겁에 질려 숨죽인 채 적들이 지나가길 기다립니다. (가벼운 발/신속/재빠름 특성 보너스 적용)' : 'You hide in fear.',
                isSpecial: true,
                specialReason: isKo ? '엄살쟁이' : 'Wimp',
                skillCheck: {
                    label: isKo ? '은신' : 'Stealth',
                    group: ['생존'],
                    fixedChance: 70,
                    successDelta: { hp: 0, food: -2, meds: 0, money: -2 },
                    failDelta: { hp: -2, food: -4, meds: 0, money: -4 }
                }
            });
        }
        if (traitIds.has('pyromaniac')) {
            choices.push({
                id: 'raid_fire',
                label: isKo ? '화염병 투척' : 'Throw Molotov',
                description: isKo ? '사격 기술 체크' : 'Shooting skill check',
                delta: { hp: 0, food: 0, meds: 0, money: 0 },
                response: isKo ? '화염병을 던져 적들을 혼란에 빠뜨립니다!' : 'You throw molotovs to confuse enemies.',
                isSpecial: true,
                specialReason: isKo ? '방화광' : 'Pyromaniac',
                skillCheck: {
                    label: isKo ? '방화' : 'Arson',
                    group: ['사격'],
                    successDelta: { hp: -2, food: 0, meds: 0, money: -2 },
                    failDelta: { hp: -4, food: 0, meds: 0, money: -2 }
                }
            });
        }
    }

    if (event.id === 'mortar_raid' && (shooting >= 12 || melee >= 12)) {
        choices.push({
            id: 'mortar_sabotage',
            label: isKo ? '야간 기습' : 'Night Sabotage',
            description: isKo ? '격투/사격 기술 체크' : 'Melee/Shooting skill check',
            delta: { hp: 0, food: 0, meds: 0, money: 0 },
            response: isKo ? '어둠을 이용해 박격포 진지를 파괴했습니다.' : 'You used the darkness to sabotage the mortars.',
            isSpecial: true,
            specialReason: isKo ? '격투/사격 12+' : 'Melee/Shooting 12+',
            skillCheck: {
                label: isKo ? '기습' : 'Sabotage',
                group: ['격투', '사격'],
                advanced: true,
                successDelta: { hp: -2, food: 0, meds: 0, money: 3 },
                failDelta: { hp: -5, food: 0, meds: 0, money: 3 }
            }
        });
    }

    if (event.id === 'emp_raid' && (crafting >= 12 || intellectual >= 12)) {
        choices.push({
            id: 'emp_harden',
            label: isKo ? 'EMP 차폐 강화' : 'EMP Hardening',
            description: isKo ? '제작/연구 기술 체크' : 'Crafting/Intellectual skill check',
            delta: { hp: 0, food: 0, meds: 0, money: 0 },
            response: isKo ? '차폐 설계를 적용해 피해를 크게 줄였습니다.' : 'You apply hardening and greatly reduce the damage.',
            isSpecial: true,
            specialReason: isKo ? '제작/연구 12+' : 'Crafting/Intellectual 12+',
            skillCheck: {
                label: isKo ? '차폐' : 'Hardening',
                group: ['제작', '연구'],
                advanced: true,
                successDelta: { hp: -1, food: 0, meds: 0, money: -1 },
                failDelta: { hp: -2, food: 0, meds: 0, money: -3 }
            }
        });
    }

    if (event.id === 'shambler_horde' && (shooting >= 12 || melee >= 12)) {
        choices.push({
            id: 'shambler_killbox',
            label: isKo ? '화력망 구축' : 'Killbox Fireline',
            description: isKo ? '격투/사격 기술 체크' : 'Melee/Shooting skill check',
            delta: { hp: 0, food: 0, meds: 0, money: 0 },
            response: isKo ? '화력망으로 무리를 빠르게 정리했습니다.' : 'You clear the horde quickly with a fireline.',
            isSpecial: true,
            specialReason: isKo ? '격투/사격 12+' : 'Melee/Shooting 12+',
            skillCheck: {
                label: isKo ? '화력망' : 'Fireline',
                group: ['격투', '사격'],
                advanced: true,
                successDelta: { hp: 0, food: 0, meds: 0, money: -3 },
                failDelta: { hp: -2, food: 0, meds: 0, money: -3 }
            }
        });
    }

    if (event.id === 'infestation' && traitIds.has('pyromaniac')) {
        choices.push({
            id: 'infest_burn',
            label: isKo ? '불태우기' : 'Burn It Down',
            description: isKo ? '격투/사격 기술 체크' : 'Melee/Shooting skill check',
            delta: { hp: 0, food: 0, meds: 0, money: 0 },
            response: isKo ? '흔적도 없이 곤충을 불태웠습니다.' : 'You burn the infestation to the ground.',
            isSpecial: true,
            specialReason: isKo ? '방화광' : 'Pyromaniac',
            skillCheck: {
                label: isKo ? '방화' : 'Arson',
                group: ['격투', '사격'],
                successDelta: { hp: 0, food: 0, meds: 0, money: 0 },
                failDelta: { hp: -4, food: 0, meds: 0, money: -4 }
            }
        });
    }

    if (event.id === 'manhunter' && (shooting >= 12 || melee >= 12)) {
        choices.push({
            id: 'hunt_all',
            label: isKo ? '동물 섬멸' : 'Exterminate',
            description: isKo ? '체력 -2, 식량 +7' : 'HP -2, Food +7',
            delta: { hp: -2, food: 7, meds: 0, money: 0 },
            response: isKo ? '달려드는 동물들을 모두 사냥해 축제를 열었습니다.' : 'You hunted all the attackers and held a feast.',
            isSpecial: true,
            specialReason: isKo ? '격투/사격 12+' : 'Melee/Shooting 12+'
        });
    }

    if (event.id === 'disease' && medical >= 12) {
        choices.push({
            id: 'perfect_treat',
            label: isKo ? '완벽한 치료' : 'Miracle Cure',
            description: isKo ? '체력 +4, 치료제 -1' : 'HP +4, Meds -1',
            delta: { hp: 4, food: 0, meds: -1, money: 0 },
            response: isKo ? '당신의 신의에 가까운 의술로 질병을 완전히 극복했습니다.' : 'Your god-like medical skill completely cured the disease.',
            isSpecial: true,
            specialReason: isKo ? '의학 12+' : 'Medical 12+',
            requirements: { meds: 1 }
        });
    }

    if (event.id === 'fire' && traitIds.has('pyromaniac')) {
        // Remove existing 'Extinguish' choice
        const extIndex = choices.findIndex(c => c.id === 'fire_extinguish');
        if (extIndex !== -1) {
            choices.splice(extIndex, 1);
        }

        // Add 'Watch the Fire' choice
        choices.push({
            id: 'pyro_watch',
            label: isKo ? '불길 감상' : 'Watch the Fire',
            description: isKo ? '체력 -2, 돈 -3' : 'HP -2, Money -3',
            delta: { hp: -2, food: 0, meds: 0, money: -3 },
            response: isKo ? '불길이 타오르는 것을 넋을 잃고 바라보았습니다.' : 'You stared at the flames in a trance.',
            isSpecial: true,
            specialReason: isKo ? '방화광' : 'Pyromaniac'
        });
    }
    if (event.id === 'psychic_drone' && traitIds.has('iron_willed')) {
        choices.push({
            id: 'iron_will_ignore',
            label: isKo ? '철의 의지' : 'Iron Will',
            description: isKo ? '아무런 영향을 받지 않습니다.' : 'Completely unaffected.',
            delta: { hp: 3, food: 0, meds: 0, money: 0 },
            response: isKo ? '당신의 의지는 강철과 같아서 이 정도 파동은 간지럽지도 않습니다.' : 'Your will is like iron; this drone is nothing to you.',
            isSpecial: true,
            specialReason: isKo ? '철의 의지' : 'Iron Will'
        });
    }

    if (event.id === 'breakup' && traitIds.has('psychopath')) {
        choices.push({
            id: 'psychopath_breakup',
            label: isKo ? '냉담함' : 'Apathy',
            description: isKo ? '아무런 감정도 느끼지 않습니다.' : 'Feel absolutely nothing.',
            delta: { hp: 2, food: 0, meds: 0, money: 0 },
            response: isKo ? '연인이 떠났습니까? 그래서요? 당신에겐 아무런 상관이 없습니다.' : 'So they left. So what? It means nothing to you.',
            isSpecial: true,
            specialReason: isKo ? '사이코패스' : 'Psychopath'
        });
    }

    if (event.id === 'pet_death' && traitIds.has('psychopath')) {
        choices.push({
            id: 'psychopath_pet',
            label: isKo ? '효율적 사고' : 'Efficient Thinking',
            description: isKo ? '도축하여 고기로 사용합니다.' : 'Butcher for meat.',
            delta: { hp: 3, food: 5, meds: 0, money: 0 },
            response: isKo ? '죽은 동물은 좋은 단백질 공급원일 뿐입니다.' : 'Dead animals are just good protein sources.',
            isSpecial: true,
            specialReason: isKo ? '사이코패스' : 'Psychopath'
        });
    }

    if (event.id === 'psychic_soother' && traitIds.has('iron_willed')) {
        choices.push({
            id: 'iron_will_soother',
            label: isKo ? '철의 의지' : 'Iron Will',
            description: isKo ? '정신적 고통에 면역입니다.' : 'Immune to psychic distress.',
            delta: { hp: 1, food: 0, meds: 0, money: 0 },
            response: isKo ? '당신의 강철 같은 의지는 그 어떤 정신적 파동에도 흔들리지 않습니다.' : 'Your iron will is unaffected by any psychic wave.',
            isSpecial: true,
            specialReason: isKo ? '철의 의지' : 'Iron Will'
        });
    }

    if (event.id === 'party' && traitIds.has('psychopath')) {
        choices.push({
            id: 'psychopath_party',
            label: isKo ? '이용' : 'Exploit',
            description: isKo ? '파티 분위기를 이용해 이득을 취합니다.' : 'Exploit the party atmosphere for personal gain.',
            delta: { hp: 0, food: 0, meds: 0, money: 5 },
            response: isKo ? '당신은 파티의 혼란 속에서 교묘하게 이득을 취했습니다.' : 'You subtly gained an advantage amidst the party chaos.',
            isSpecial: true,
            specialReason: isKo ? '사이코패스' : 'Psychopath'
        });
    }

    if (choices.length === 0) return event;
    return { ...event, choices };
};

interface HelpModalProps {
    onClose: () => void;
    language: 'ko' | 'en';
}

interface SimModalShellProps {
    title: string;
    icon: string;
    accentClassName?: string;
    maxWidthClassName?: string;
    onClose: () => void;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

interface SimStatTileProps {
    label: string;
    value: string;
    labelClassName?: string;
    valueClassName?: string;
}

function SimStatTile({ label, value, labelClassName = '', valueClassName = '' }: SimStatTileProps) {
    return (
        <div className="sim-stat-tile flex flex-col items-center">
            <div className={`text-[10px] text-[var(--sim-text-muted)] font-bold uppercase leading-none mb-1 ${labelClassName}`}>{label}</div>
            <div className={`text-[var(--sim-text-main)] font-black text-base ${valueClassName}`}>{value}</div>
        </div>
    );
}

function SimModalShell({
    title,
    icon,
    accentClassName = 'text-[var(--sim-accent)]',
    maxWidthClassName = 'max-w-2xl',
    onClose,
    children,
    footer
}: SimModalShellProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className={`sim-modal-shell flex flex-col max-h-[85vh] ${maxWidthClassName}`}>
                <div className="bg-[var(--sim-surface-3)]/70 p-4 flex justify-between items-center border-b border-[var(--sim-border)]">
                    <h3 className={`text-base md:text-lg font-black uppercase tracking-[0.14em] flex items-center gap-2 ${accentClassName}`}>
                        <span>{icon}</span>{title}
                    </h3>
                    <button onClick={onClose} className="sim-btn sim-btn-ghost h-8 w-8 flex items-center justify-center text-sm">✕</button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 text-[var(--sim-text-sub)]">
                    {children}
                </div>
                {footer && <div className="p-4 border-t border-[var(--sim-border)] bg-[var(--sim-surface-1)]/75">{footer}</div>}
            </div>
        </div>
    );
}

function HelpModal({ onClose, language }: HelpModalProps) {
    const [activeTab, setActiveTab] = useState<'system' | 'event' | 'trait' | 'skill'>('system');

    const tabs = [
        { id: 'system', label: language === 'ko' ? '시스템' : 'System', icon: '⚙️' },
        { id: 'event', label: language === 'ko' ? '이벤트' : 'Event', icon: '📅' },
        { id: 'trait', label: language === 'ko' ? '특성' : 'Trait', icon: '🧬' },
        { id: 'skill', label: language === 'ko' ? '기술' : 'Skill', icon: '📊' },
    ] as const;

    return (
        <SimModalShell
            title={language === 'ko' ? '생존 가이드' : 'Survival Guide'}
            icon="📖"
            onClose={onClose}
            maxWidthClassName="max-w-3xl"
            footer={(
                <div className="text-center">
                    <button onClick={onClose} className="sim-btn sim-btn-primary px-8 py-2 text-xs">
                        {language === 'ko' ? '닫기' : 'Close'}
                    </button>
                </div>
            )}
        >
                <div className="flex border-b border-[var(--sim-border)] bg-[var(--sim-surface-1)] -mt-2 mb-4">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-3 text-xs md:text-sm font-bold uppercase tracking-[0.12em] transition-all flex items-center justify-center gap-2
                                ${activeTab === tab.id
                                    ? 'bg-[var(--sim-surface-3)] text-[var(--sim-accent)] border-b-2 border-[var(--sim-accent)]'
                                    : 'text-[var(--sim-text-muted)] hover:text-[var(--sim-text-main)] hover:bg-[var(--sim-surface-2)]'
                                }`}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                    {activeTab === 'system' && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h4 className="sim-section-title border-b border-[var(--sim-border)] pb-1 mb-2">
                                    {language === 'ko' ? '기지 강화' : 'Base Upgrades'}
                                </h4>
                                <p className="text-[var(--sim-text-sub)] text-xs leading-relaxed">
                                    {language === 'ko'
                                        ? '기지 레벨이 오를 때마다 정착지가 더 안전해집니다. 강화된 기지는 위험 이벤트에서 받는 피해를 줄여줍니다.'
                                        : 'Upgrading your base makes the settlement safer. Fortifications reduce damage during danger events.'}
                                </p>
                                <ul className="space-y-1 text-xs text-[var(--sim-text-muted)] list-disc list-inside bg-[var(--sim-surface-1)]/70 p-3 rounded-lg border border-[var(--sim-border)]">
                                    <li>{language === 'ko' ? '레벨 0: 기본 상태' : 'Level 0: Basic'}</li>
                                    <li>{language === 'ko' ? '레벨 1: 위험 이벤트 피해 -1' : 'Level 1: Danger damage -1'}</li>
                                    <li>{language === 'ko' ? '레벨 2: 위험 이벤트 피해 -2 (최대)' : 'Level 2: Danger damage -2 (max)'}</li>
                                </ul>
                            </div>

                            <div className="space-y-2">
                                <h4 className="sim-section-title border-b border-[var(--sim-border)] pb-1 mb-2">
                                    {language === 'ko' ? '생존 규칙' : 'Survival Rules'}
                                </h4>
                                <ul className="space-y-2 text-xs text-[var(--sim-text-sub)]">
                                    <li>
                                        <span className="text-red-400 font-bold">{language === 'ko' ? '식량:' : 'Food:'}</span>
                                        {language === 'ko'
                                            ? ' 매일 식량이 1씩 감소합니다. 식량이 0이 되면 체력이 감소합니다.'
                                            : ' Food decreases by 1 every day. If food is 0, HP decreases.'}
                                    </li>
                                    <li>
                                        <span className="text-green-400 font-bold">{language === 'ko' ? '대성공:' : 'Great Success:'}</span>
                                        {language === 'ko'
                                            ? ' 요리/재배 평균 레벨이 높을수록 식량 대성공 확률이 올라가며, 대성공 시 식량 +2를 추가로 얻습니다.'
                                            : 'Higher Cooking/Plants average increases the great success chance, granting +2 extra food.'}
                                    </li>
                                    <li>
                                        <span className="text-blue-400 font-bold">{language === 'ko' ? '치료:' : 'Healing:'}</span>
                                        {language === 'ko'
                                            ? ' 치료제를 사용하여 체력을 회복할 수 있습니다. 회복량은 의학 등급에 따라 달라집니다.'
                                            : ' Use meds to restore HP. Amount depends on Medicine skill.'}
                                    </li>
                                    <li>
                                        <span className="text-purple-400 font-bold">{language === 'ko' ? '멘탈:' : 'Mental:'}</span>
                                        {language === 'ko'
                                            ? ' 특정 특성(철의 의지, 사이코패스 등)은 정신적 충격 이벤트에서 특별한 선택지를 제공합니다.'
                                            : ' Traits like Iron Will or Psychopath unlock special choices in mental events.'}
                                    </li>
                                </ul>
                            </div>

                            <div className="space-y-2">
                                <h4 className="sim-section-title border-b border-[var(--sim-border)] pb-1 mb-2">
                                    {language === 'ko' ? '자원 한도' : 'Resource Caps'}
                                </h4>
                                <ul className="space-y-2 text-xs text-[var(--sim-text-sub)]">
                                    <li>
                                        {language === 'ko'
                                            ? '체력 최대 20, 식량/치료제/돈은 최대 30까지 저장됩니다.'
                                            : 'HP caps at 20, and Food/Meds/Money cap at 30.'}
                                    </li>
                                    <li>
                                        {language === 'ko'
                                            ? '체력이 0 이하가 되면 사망합니다.'
                                            : 'You die if HP reaches 0.'}
                                    </li>
                                </ul>
                            </div>

                            <div className="space-y-2">
                                <h4 className="sim-section-title border-b border-[var(--sim-border)] pb-1 mb-2">
                                    {language === 'ko' ? '우주선 / 엔딩' : 'Ship / Ending'}
                                </h4>
                                <ul className="space-y-2 text-xs text-[var(--sim-text-sub)]">
                                    <li>
                                        {language === 'ko'
                                            ? '60일차에 우주선이 완성됩니다. 즉시 탈출하거나 계속 생존을 선택할 수 있습니다.'
                                            : 'The ship completes on Day 60. You can escape immediately or keep surviving.'}
                                    </li>
                                    <li>
                                        {language === 'ko'
                                            ? '우주선 완성 이후에는 언제든 탑승 버튼으로 탈출 가능합니다.'
                                            : 'After completion, you can board the ship anytime.'}
                                    </li>
                                </ul>
                            </div>

                            <div className="space-y-2">
                                <h4 className="sim-section-title border-b border-[var(--sim-border)] pb-1 mb-2">
                                    {language === 'ko' ? '부활 혈청' : 'Resurrector Serum'}
                                </h4>
                                <ul className="space-y-2 text-xs text-[var(--sim-text-sub)]">
                                    <li>
                                        {language === 'ko'
                                            ? '보유한 은이 충분하면 낮은 확률로 혈청 상인이 등장합니다.'
                                            : 'With enough money, a serum trader can appear at a low chance.'}
                                    </li>
                                    <li>
                                        {language === 'ko'
                                            ? '혈청을 보유한 상태에서 사망하면 HP 10으로 1회 부활합니다.'
                                            : 'If you die while holding the serum, you revive once with HP 10.'}
                                    </li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {activeTab === 'event' && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h4 className="sim-section-title border-b border-[var(--sim-border)] pb-1 mb-2">
                                    {language === 'ko' ? '이벤트 종류' : 'Event Types'}
                                </h4>
                                <div className="grid gap-3">
                                    <div className="sim-card p-3">
                                        <div className="text-red-400 font-bold text-xs mb-1">⚔️ {language === 'ko' ? '위협 (Danger)' : 'Danger'}</div>
                                        <div className="text-[var(--sim-text-muted)] text-[10px] leading-relaxed">
                                            {language === 'ko'
                                                ? '습격/공격성 사건입니다. 전투 기술이 중요합니다.'
                                                : 'Raid-style threats. Combat skills matter most.'}
                                        </div>
                                    </div>
                                    <div className="sim-card p-3">
                                        <div className="text-purple-400 font-bold text-xs mb-1">🧠 {language === 'ko' ? '정신 (Mind)' : 'Mind'}</div>
                                        <div className="text-[var(--sim-text-muted)] text-[10px] leading-relaxed">
                                            {language === 'ko'
                                                ? '관계, 상실, 심령 파동 등 정신적 사건입니다. 감정적 피해/회복이 중심입니다.'
                                                : 'Relationships, loss, and psychic waves. Emotional impact and recovery.'}
                                        </div>
                                    </div>
                                    <div className="sim-card p-3">
                                        <div className="text-blue-400 font-bold text-xs mb-1">📦 {language === 'ko' ? '자원 (Resource)' : 'Resource'}</div>
                                        <div className="text-[var(--sim-text-muted)] text-[10px] leading-relaxed">
                                            {language === 'ko'
                                                ? '자원/비전투 사건입니다. 사교나 기술이 도움이 됩니다.'
                                                : 'Resource and non-combat events. Social or technical skills help.'}
                                        </div>
                                    </div>
                                    <div className="sim-card p-3">
                                        <div className="text-[var(--sim-text-sub)] font-bold text-xs mb-1">☁️ {language === 'ko' ? '일상 (Daily)' : 'Daily'}</div>
                                        <div className="text-[var(--sim-text-muted)] text-[10px] leading-relaxed">
                                            {language === 'ko'
                                                ? '조용한 하루입니다. 정착민의 주 기술에 따라 자원을 채집하거나 기지를 보수합니다.'
                                                : 'A quiet day. Settlers use main skills to gather or maintain.'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'trait' && (
                        <div className="space-y-4">
                            <div className="text-xs text-[var(--sim-text-muted)] mb-2">
                                {language === 'ko'
                                    ? '보유한 특성에 따라 게임 내에서 지속적인 효과를 받거나, 특정 이벤트에서 선택지가 추가됩니다.'
                                    : 'Traits provide passive effects or unlock special choices in events.'}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {Object.entries(TRAIT_EFFECTS).map(([id, effect]) => (
                                    <div key={id} className="sim-card p-2 flex flex-col justify-center">
                                        <span className="text-[var(--sim-accent)] font-bold text-xs mb-1 capitalize">
                                            {language === 'ko' ? (TRAIT_NAMES_KO[id] || id.replace(/_/g, ' ')) : id.replace(/_/g, ' ')}
                                        </span>
                                        <span className="text-[10px] text-[var(--sim-text-muted)] leading-tight">{language === 'ko' ? effect.ko : effect.en}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'skill' && (
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <h4 className="sim-section-title border-b border-[var(--sim-border)] pb-1 mb-2">
                                    {language === 'ko' ? '의학 기술 (Medicine)' : 'Medicine Skill'}
                                </h4>
                                <p className="text-[var(--sim-text-sub)] text-xs mb-2">
                                    {language === 'ko'
                                        ? '의학 레벨이 높을수록 치료제 사용 시 회복량이 증가합니다.'
                                        : 'Higher Medicine level increases HP restored by meds.'}
                                </p>
                                <div className="grid grid-cols-4 gap-2 text-center">
                                    <div className="sim-card p-2">
                                        <div className="text-[10px] text-[var(--sim-text-muted)]">Lv 0-3</div>
                                        <div className="text-green-400 font-bold text-sm">+1 HP</div>
                                    </div>
                                    <div className="sim-card p-2">
                                        <div className="text-[10px] text-[var(--sim-text-muted)]">Lv 4-6</div>
                                        <div className="text-green-400 font-bold text-sm">+2 HP</div>
                                    </div>
                                    <div className="sim-card p-2">
                                        <div className="text-[10px] text-[var(--sim-text-muted)]">Lv 7-10</div>
                                        <div className="text-green-400 font-bold text-sm">+3 HP</div>
                                    </div>
                                    <div className="sim-card p-2">
                                        <div className="text-[10px] text-[var(--sim-text-muted)]">Lv 11+</div>
                                        <div className="text-green-400 font-bold text-sm">+4 HP</div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="sim-section-title border-b border-[var(--sim-border)] pb-1 mb-2">
                                    {language === 'ko' ? '기술 체크' : 'Skill Checks'}
                                </h4>
                                <p className="text-[var(--sim-text-sub)] text-xs">
                                    {language === 'ko'
                                        ? '이벤트 발생 시 관련 기술 평균 레벨로 성공 확률이 결정됩니다. 성공 확률은 5~95% 범위로 제한됩니다.'
                                        : 'Skill checks use the average level of the related skills. Chances are clamped to 5~95%.'}
                                </p>
                                <p className="text-[var(--sim-text-muted)] text-[10px] leading-relaxed">
                                    {language === 'ko'
                                        ? '기본 확률은 레벨 0 기준 20%에서 시작해 레벨 1마다 5%씩 증가합니다. 고정 확률 이벤트는 이동 특성(재빠른 걸음/민첩 +10, 신속 +20, 느림보 -20)의 보정을 받습니다.'
                                        : 'Base chance starts at 20% at level 0 and increases by 5% per level. Fixed-chance events are modified by movement traits (+10 each for Fast Walker/Nimble, +20 for Jogger, -20 for Slowpoke).'}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <h4 className="sim-section-title border-b border-[var(--sim-border)] pb-1 mb-2">
                                    {language === 'ko' ? '기술 보너스' : 'Skill Bonuses'}
                                </h4>
                                <p className="text-[var(--sim-text-sub)] text-xs">
                                    {language === 'ko'
                                        ? '스킬 체크가 없는 이벤트는 관련 기술 평균에 따라 결과가 보정됩니다.'
                                        : 'Events without skill checks get a bonus based on the related skill average.'}
                                </p>
                                <p className="text-[var(--sim-text-muted)] text-[10px] leading-relaxed">
                                    {language === 'ko'
                                        ? '평균 레벨 3 이하: -1, 8 이상: +1, 13 이상: +2'
                                        : 'Avg ≤ 3: -1, Avg ≥ 8: +1, Avg ≥ 13: +2'}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <h4 className="sim-section-title border-b border-[var(--sim-border)] pb-1 mb-2">
                                    {language === 'ko' ? '숙련도 & 경험치' : 'Proficiency & XP'}
                                </h4>
                                <p className="text-[var(--sim-text-sub)] text-xs">
                                    {language === 'ko'
                                        ? '스킬 체크가 발생하면 관련 기술에 경험치가 누적됩니다.'
                                        : 'Skill checks grant XP to the related skills.'}
                                </p>
                                <p className="text-[var(--sim-text-muted)] text-[10px] leading-relaxed">
                                    {language === 'ko'
                                        ? '기본 10 XP + 성공 보너스 5 XP, 열정에 따라 배율(없음 0.5 / 관심 1.0 / 불꽃 1.5)이 적용됩니다.'
                                        : 'Base 10 XP + 5 on success, multiplied by passion (None 0.5 / Minor 1.0 / Major 1.5).'}
                                </p>
                            </div>
                        </div>
                    )}
        </SimModalShell>
    );
}

export default function SimulationClient() {
    const { calculateFinalTraits, userInfo: contextUserInfo, testPhase: contextTestPhase } = useTest();
    const { language } = useLanguage();
    const router = useRouter();
    const searchParams = useSearchParams();
    const s = searchParams.get('s');
    const profileId = searchParams.get('profile');

    const [result, setResult] = useState<TestResult | null>(null);
    const [localUserInfo, setLocalUserInfo] = useState<SimUserInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [isFullResult, setIsFullResult] = useState(false);
    const selectedSettlerRef = useRef(false);
    const [pendingChoice, setPendingChoice] = useState<PendingChoice | null>(null);
    const [startQueued, setStartQueued] = useState(false);
    const [cardView, setCardView] = useState<'event' | 'result'>('event');
    const [currentCard, setCurrentCard] = useState<CurrentCard | null>(null);
    const [showLog, setShowLog] = useState(false);
    const [hasShipBuilt, setHasShipBuilt] = useState(false);
    const [showEndingCard, setShowEndingCard] = useState(false);
    const [allowContinue, setAllowContinue] = useState(false);
    const [canBoardShip, setCanBoardShip] = useState(false);
    const [submittedOnDeath, setSubmittedOnDeath] = useState(false);
    const [submittedOnExit, setSubmittedOnExit] = useState(false);
    const [submitMessage, setSubmitMessage] = useState<string | null>(null);
    const [showTraitsModal, setShowTraitsModal] = useState(false);
    const [showSkillsModal, setShowSkillsModal] = useState(false);
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [hasTempSave, setHasTempSave] = useState(false);
    const [showBoardConfirm, setShowBoardConfirm] = useState(false);
    const [showEndingConfirm, setShowEndingConfirm] = useState(false);
    const [showLaunchReadyPrompt, setShowLaunchReadyPrompt] = useState(false);
    const [showLaunchConfirm, setShowLaunchConfirm] = useState(false);
    const [showDeathResult, setShowDeathResult] = useState(false);
    const [turnPhase, setTurnPhase] = useState<TurnPhase>('idle');
    const [preparedTurn, setPreparedTurn] = useState<PreparedTurn | null>(null);
    const [duelOpponents, setDuelOpponents] = useState<DuelOpponent[]>([]);
    const [quietAutoPreset, setQuietAutoPreset] = useState<QuietAutoPreset>('manual');
    const prepareTimerRef = useRef<number | null>(null);
    const animateTimerRef = useRef<number | null>(null);


    const [simState, setSimState] = useState<SimState>({
        status: 'idle',
        day: 0,
        hp: START_STATS.hp,
        food: START_STATS.food,
        meds: START_STATS.meds,
        money: START_STATS.money,
        campLevel: 0,
        petCount: 1,
        loverCount: 1,
        spouseCount: 0,
        log: [],
        hasSerum: false,
        serumTraderShown: false,
        daysSinceDanger: 0,
        evacActive: false,
        evacCountdown: 0,
        evacForceThreatNextDay: false,
        deathDuringEvac: false,
        evacReady: false,
        era100Shown: false,
        activeEffects: [],
        skillProgress: {} // 숙련도는 빈 객체로 시작
    });

    // 임시저장 데이터 로드 체크
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(TEMP_SAVE_KEY);
            if (saved) {
                setHasTempSave(true);
            }
        }
    }, []);

    // 시뮬레이션 상태가 변경될 때마다 자동 저장
    useEffect(() => {
        if (typeof window === 'undefined') return;

        if (simState.status === 'running') {
            const saveData = {
                simState,
                pendingChoice,
                currentCard,
                cardView,
                hasShipBuilt,
                showEndingCard,
                allowContinue,
                canBoardShip,
                localUserInfo,
                result,
                isFullResult,
                submittedOnDeath,
                submittedOnExit,
                quietAutoPreset
            };
            localStorage.setItem(TEMP_SAVE_KEY, JSON.stringify(saveData));
        } else if (simState.status === 'dead' || simState.status === 'success') {
            localStorage.removeItem(TEMP_SAVE_KEY);
            setHasTempSave(false);
        }
    }, [
        simState, pendingChoice, currentCard, cardView,
        hasShipBuilt, showEndingCard, allowContinue, canBoardShip,
        localUserInfo, result, isFullResult, submittedOnDeath, submittedOnExit, quietAutoPreset
    ]);

    const resumeSimulation = useCallback(() => {
        if (typeof window === 'undefined') return;
        const saved = localStorage.getItem(TEMP_SAVE_KEY);
        if (!saved) return;
        try {
            const data = JSON.parse(saved);
            setSimState({
                ...data.simState,
                daysSinceDanger: data.simState?.daysSinceDanger ?? 0,
                evacActive: data.simState?.evacActive ?? false,
                evacCountdown: data.simState?.evacCountdown ?? 0,
                evacForceThreatNextDay: data.simState?.evacForceThreatNextDay ?? false,
                deathDuringEvac: data.simState?.deathDuringEvac ?? false,
                evacReady: data.simState?.evacReady ?? false,
                era100Shown: data.simState?.era100Shown ?? false,
                activeEffects: data.simState?.activeEffects ?? []
            });
            setPendingChoice(data.pendingChoice);
            setCurrentCard(data.currentCard);
            setCardView(data.cardView);
            setHasShipBuilt(data.hasShipBuilt);
            setShowEndingCard(data.showEndingCard);
            setAllowContinue(data.allowContinue);
            setCanBoardShip(data.canBoardShip);
            setLocalUserInfo(data.localUserInfo);
            setResult(data.result);
            setIsFullResult(data.isFullResult);
            if (data.submittedOnDeath !== undefined) setSubmittedOnDeath(data.submittedOnDeath);
            if (data.submittedOnExit !== undefined) setSubmittedOnExit(data.submittedOnExit);
            if (data.quietAutoPreset) {
                const preset = data.quietAutoPreset as QuietAutoPreset;
                const allowed: QuietAutoPreset[] = ['manual', 'quiet_rest', 'quiet_farming', 'quiet_hunting', 'quiet_mining'];
                setQuietAutoPreset(allowed.includes(preset) ? preset : 'manual');
            }
            selectedSettlerRef.current = true;
            setHasTempSave(false);
        } catch (e) {
            console.error("Failed to parse temp save:", e);
        }
    }, []);


    const userInfo = localUserInfo || contextUserInfo;

    useEffect(() => {
        const fetchSharedResult = async () => {
            if (selectedSettlerRef.current && result) return;

            // 1. 프로필 ID로 정착민 정보 로드 (정착민 보관함에서 온 경우)
            if (profileId) {
                if (!isSupabaseConfigured()) {
                    setLoading(false);
                    return;
                }
                setLoading(true);
                try {
                    const { data, error } = await supabase
                        .from('settler_profiles')
                        .select('*')
                        .eq('id', profileId)
                        .single();

                    if (data && !error) {
                        const fetchedResult: TestResult = {
                            mbti: data.mbti,
                            traits: data.traits || [],
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
                        selectedSettlerRef.current = true;
                    }
                } catch (err) {
                    console.error("Failed to fetch profile result:", err);
                } finally {
                    setLoading(false);
                }
                return;
            }

            // 2. 공유 ID(s)로 결과 로드
            if (s) {
                if (!isSupabaseConfigured()) {
                    setIsFullResult(false);
                    setLoading(false);
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
                        selectedSettlerRef.current = true;
                    }
                } catch (err) {
                    console.error("Failed to fetch shared result:", err);
                } finally {
                    setLoading(false);
                }
            } else {
                // 3. 현재 진행 중인 테스트 결과 사용
                const res = calculateFinalTraits();
                setResult(res);
                setIsFullResult(contextTestPhase === 'skill');
                setLoading(false);
            }
        };
        fetchSharedResult();
    }, [s, profileId, language, contextTestPhase, calculateFinalTraits, result]);

    useEffect(() => {
        if (!isSupabaseConfigured()) return;
        let cancelled = false;
        const loadDuelOpponents = async () => {
            try {
                const { data, error } = await supabase
                    .from('settler_profiles')
                    .select('id,name,skills')
                    .limit(160);
                if (error) throw error;
                const pool = (data ?? [])
                    .map(row => mapToDuelOpponent(row as { id?: unknown; name?: unknown; skills?: unknown }))
                    .filter((op): op is DuelOpponent => !!op)
                    .filter(op => !profileId || op.id !== profileId);
                if (!cancelled) {
                    setDuelOpponents(pool);
                }
            } catch (error) {
                console.error('Failed to load duel opponents:', error);
                if (!cancelled) {
                    setDuelOpponents([]);
                }
            }
        };
        loadDuelOpponents();
        return () => {
            cancelled = true;
        };
    }, [profileId]);


    const traitIds = useMemo(() => {
        const ids = new Set<string>();
        if (result?.traits) {
            result.traits.forEach((tr: SimTraitLike) => {
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

    const passions = useMemo(() => {
        const map: Record<string, number> = {};
        if (result?.skills) {
            result.skills.forEach(skill => {
                let passionValue = 0;
                if (typeof skill.passion === 'string') {
                    if (skill.passion === 'Major') passionValue = 2;
                    else if (skill.passion === 'Minor') passionValue = 1;
                    else if (skill.passion === 'None') passionValue = 0;
                    else {
                        const parsed = parseInt(skill.passion, 10);
                        passionValue = Number.isNaN(parsed) ? 0 : parsed;
                    }
                } else {
                    passionValue = skill.passion || 0;
                }
                map[skill.name] = passionValue;
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

    const getGroupAverage = useCallback((group?: string[]) => {
        if (!group || group.length === 0) return 0;
        let total = 0;
        let count = 0;
        group.forEach(g => {
            const pool = SKILL_GROUPS[g] || [g];
            pool.forEach(name => {
                // 정착민 기본 스킬 + 게임 내 숙련도 레벨
                const baseSkill = skillMap[name] ?? 0;
                const progressLevel = simState.skillProgress[name]?.level ?? 0;
                total += baseSkill + progressLevel;
                count++;
            });
        });
        return total / count;
    }, [skillMap, simState.skillProgress]);

    const getCurrentDuelStat = useCallback((track: DuelTrack) => {
        const getSkill = (name: string) => (skillMap[name] ?? 0) + (simState.skillProgress[name]?.level ?? 0);
        if (track === 'combat') return (getSkill('Shooting') + getSkill('Melee')) / 2;
        if (track === 'crafting') return (getSkill('Construction') + getSkill('Crafting') + getSkill('Mining')) / 3;
        if (track === 'research') return getSkill('Intellectual');
        return getSkill('Artistic');
    }, [skillMap, simState.skillProgress]);

    const pickDuelOpponent = useCallback((): DuelOpponent => {
        if (duelOpponents.length > 0) {
            return duelOpponents[Math.floor(Math.random() * duelOpponents.length)];
        }

        const baseCombat = getCurrentDuelStat('combat');
        const baseCrafting = getCurrentDuelStat('crafting');
        const baseResearch = getCurrentDuelStat('research');
        const baseArt = getCurrentDuelStat('art');
        const vary = (base: number) => Math.max(0, Math.min(20, base + (Math.random() * 6 - 3)));
        return {
            id: `fallback-${Date.now()}`,
            name: language === 'ko' ? '이방인' : 'Wanderer',
            combat: vary(baseCombat),
            crafting: vary(baseCrafting),
            research: vary(baseResearch),
            art: vary(baseArt)
        };
    }, [duelOpponents, getCurrentDuelStat, language]);

    const getSkillBonus = useCallback((group?: string[]) => {
        if (!group || group.length === 0) return { bonus: 0, note: '' };
        const avg = getGroupAverage(group);
        let bonus = 0;
        if (avg <= 3) bonus = -1;
        else if (avg >= 13) bonus = 2;
        else if (avg >= 8) bonus = 1;

        let note = '';
        const getRandomNote = (notes: string[]) => notes[Math.floor(Math.random() * notes.length)];

        // Simple heuristic for combat/non-combat note selection
        const isCombat = group.some(g => g.includes('전투') || g.includes('격투') || g.includes('사격'));

        if (isCombat) {
            if (bonus > 0) {
                note = language === 'ko'
                    ? getRandomNote(['전투 기술을 발휘해 피해를 최소화했다.', '숙련된 전투 지식으로 위기를 넘겼다.', '전공을 살려 적절히 대응했다.'])
                    : getRandomNote(['Combat skills minimized the damage.', 'Experienced tactics helped survive.', 'Your expertise paid off in the fight.']);
            } else if (bonus < 0) {
                note = language === 'ko'
                    ? getRandomNote(['전투 기술이 미비해 불필요한 피해를 입었다.', '경험 부족으로 인해 적의 공세에 밀렸다.', '전투 대응이 늦어 피해가 커졌다.'])
                    : getRandomNote(['Poor combat skills led to more injuries.', 'Lack of experience made the fight harder.', 'Slow combat response worsened the damage.']);
            } else {
                note = language === 'ko' ? '무난하게 전투를 치렀다.' : 'You handled the fight adequately.';
            }
        } else {
            if (bonus > 0) {
                note = language === 'ko'
                    ? getRandomNote(['뛰어난 숙련도로 예상보다 좋은 결과를 얻었다.', '기술적 지식을 활용해 효율을 극대화했다.', '전문가다운 솜씨로 일을 깔끔하게 처리했다.'])
                    : getRandomNote(['High skill led to better results than expected.', 'Technical knowledge maximized efficiency.', 'Expert handling wrapped things up nicely.']);
            } else if (bonus < 0) {
                note = language === 'ko'
                    ? getRandomNote(['서툰 솜씨 때문에 일이 꼬이고 말았다.', '업무 숙련도가 낮아 평소보다 효율이 떨어졌다.', '익숙하지 않은 작업에 결과가 신통치 않다.'])
                    : getRandomNote(['Amateur handling caused some issues.', 'Low proficiency reduced the overall efficiency.', 'Clumsy skills led to a poor outcome.']);
            } else {
                note = language === 'ko' ? '현상을 유지하며 무난히 처리했다.' : 'You handled it adequately without issues.';
            }
        }
        return { bonus, note };
    }, [language, getGroupAverage]);

    const rollSkillCheck = useCallback((check: SkillCheck) => {
        const avg = getGroupAverage(check.group);
        let chance = check.fixedChance ?? getSkillChance(avg, check.advanced);
        let greatChance = check.greatSuccessDelta ? getGreatSuccessChance(avg) : 0;

        // 확률 배율 적용
        if (check.chanceMultiplier) {
            chance *= check.chanceMultiplier;
        }

        // 이동속도/회피 관련 특성 보정 (고정 확률인 경우)
        if (check.fixedChance !== undefined) {
            let moveBonus = 0;
            if (traitIds.has('fast_walker')) moveBonus += 10;
            if (traitIds.has('jogger')) moveBonus += 10;
            if (traitIds.has('nimble')) moveBonus += 10;
            if (traitIds.has('slowpoke')) moveBonus -= 20;

            if (moveBonus !== 0) {
                chance += moveBonus;
            }
        }

        // 확률 범위 제한 + 반올림
        chance = Math.max(5, Math.min(95, chance));
        chance = Math.round(chance);
        chance = Math.max(5, Math.min(95, chance));

        if (greatChance > 0) {
            greatChance = Math.round(greatChance);
            greatChance = Math.max(0, Math.min(greatChance, chance));
        }

        const roll = Math.random() * 100;
        if (greatChance > 0 && roll < greatChance) {
            return { success: true, great: true, chance, greatChance };
        }
        return { success: roll < chance, great: false, chance, greatChance };
    }, [getGroupAverage, traitIds]);

    const startSimulation = useCallback(() => {
        const introText = language === 'ko'
            ? '당신의 캐릭터는 몇일차까지 살아남을 수 있을까요?'
            : 'How many days can your character survive?';

        let startHp = START_STATS.hp;
        const startFood = START_STATS.food;
        let startMeds = START_STATS.meds;
        let startMoney = START_STATS.money;

        if (traitIds.has('greedy')) startMoney = 15;
        if (traitIds.has('ascetic')) {
            startHp = 15;
            startMoney = 0;
        }
        if (traitIds.has('wimp')) startMeds = 5;
        if (traitIds.has('hard_worker') || traitIds.has('industrious')) {
            // Additional check or starting bonus could be added here later
        }

        const isAsexual = traitIds.has('asexual');
        setSimState({
            status: 'running',
            day: 0,
            hp: startHp,
            food: startFood,
            meds: startMeds,
            money: startMoney,
            campLevel: 0,
            petCount: 1,
            loverCount: isAsexual ? 0 : 1,
            spouseCount: 0,
            log: [{
                day: 0,
                season: getSeasonLabel(0, language),
                title: language === 'ko' ? '시뮬레이션 시작' : 'Simulation Start',
                description: introText,
                response: language === 'ko' ? '생존 준비를 시작했다.' : 'You begin preparing for survival.',
                delta: { hp: 0, food: 0, meds: 0, money: 0 },
                after: { hp: startHp, food: startFood, meds: startMeds, money: startMoney },
                status: 'neutral'
            }],
            hasSerum: false,
            serumTraderShown: false,
            daysSinceDanger: 0,
        evacActive: false,
        evacCountdown: 0,
        evacForceThreatNextDay: false,
        deathDuringEvac: false,
        evacReady: false,
        era100Shown: false,
        activeEffects: [],
        skillProgress: ALL_SKILLS.reduce((acc, skill) => {
            acc[skill] = { level: 0, xp: 0 };
            return acc;
        }, {} as Record<string, { level: number; xp: number }>)
        });
        setPendingChoice(null);
        setCurrentCard(null);
        setCardView('event');
        setShowLog(false);
        setStartQueued(true);
        setHasShipBuilt(false);
        setShowEndingCard(false);
        setAllowContinue(false);
        setCanBoardShip(false);
        setSubmittedOnDeath(false);
        setSubmittedOnExit(false);
        setSubmitMessage(null);
        setSubmittedOnDeath(false);
        setSubmittedOnExit(false);
        setSubmitMessage(null);
        setShowBoardConfirm(false);
        setShowEndingConfirm(false);
        setShowLaunchReadyPrompt(false);
        setShowLaunchConfirm(false);
        setShowDeathResult(false);
        setTurnPhase('idle');
        setPreparedTurn(null);
    }, [language, traitIds]);

    const buildResponseText = useCallback((
        baseNotes: string[],
        traitNotes: string[],
        skillNote: string,
        choiceResponse?: string,
        systemNote?: string,
        lineBreaks?: boolean
    ) => {
        const parts = [] as string[];
        if (choiceResponse) parts.push(choiceResponse);
        const systemParts: string[] = [];
        if (systemNote) systemParts.push(systemNote);
        if (skillNote) systemParts.push(skillNote);
        if (traitNotes.length > 0) systemParts.push(...traitNotes);
        if (baseNotes.length > 0) systemParts.push(...baseNotes);
        const sep = lineBreaks ? '\n' : ' ';
        if (parts.length > 0 && systemParts.length > 0) {
            return `${parts.join(' ')}${sep}${systemParts.join(sep)}`;
        }
        if (parts.length > 0) return parts.join(' ');
        if (systemParts.length > 0) return systemParts.join(sep);
        return language === 'ko' ? '무난하게 하루를 버텼다.' : 'You made it through the day.';
    }, [language]);

    const resolveEvent = useCallback((
        event: SimEvent,
        eventDay: number,
        dayStart: { hp: number; food: number; meds: number; money: number },
        baseAfter: { hp: number; food: number; meds: number; money: number },
        baseNotes: string[],
        campLevel: number,
        choice?: SimChoice,
        turnEffectModifiers?: TurnEffectModifiers
    ) => {
        let hp = baseAfter.hp;
        let food = baseAfter.food;
        let meds = baseAfter.meds;
        let money = baseAfter.money;
        let petCount = simState.petCount;
        let loverCount = simState.loverCount;
        let spouseCount = simState.spouseCount;

        // Apply count changes based on event ID
        if (event.id === 'pet_death') {
            petCount = Math.max(0, petCount - 1);
        } else if (event.id === 'breakup') {
            loverCount = Math.max(0, loverCount - 1);
        } else if (event.id === 'marriage') {
            loverCount = Math.max(0, loverCount - 1);
            spouseCount += 1;
        } else if (event.id === 'divorce') {
            spouseCount = Math.max(0, spouseCount - 1);
        }

        const baseDelta = choice?.delta || { hp: 0, food: 0, meds: 0, money: 0 };
        let hpDelta = event.base.hp + baseDelta.hp;
        let foodDelta = event.base.food + baseDelta.food;
        let medsDelta = event.base.meds + baseDelta.meds;
        let moneyDelta = event.base.money + baseDelta.money;
        const traitNotes: string[] = [];
        let systemNote = '';
        let choiceResponse = choice?.skillCheck ? undefined : choice?.response;
        let skillOutcome: 'great' | 'success' | 'fail' | null = null;

        const skillXpGains: Array<{ skill: string; newLevel: number; newXp: number; leveledUp: boolean }> = [];

        if (choice?.skillCheck) {
            const { success, great, chance, greatChance } = rollSkillCheck(choice.skillCheck);
            skillOutcome = great ? 'great' : (success ? 'success' : 'fail');
            const resultDelta = great && choice.skillCheck.greatSuccessDelta
                ? choice.skillCheck.greatSuccessDelta
                : (success ? choice.skillCheck.successDelta : choice.skillCheck.failDelta);
            hpDelta += resultDelta.hp;
            foodDelta += resultDelta.food;
            medsDelta += resultDelta.meds;
            moneyDelta += resultDelta.money;
            systemNote = language === 'ko'
                ? `${choice.skillCheck.label} ${great ? '대성공' : (success ? '성공' : '실패')} (확률 ${chance}%${greatChance ? `, 대성공 ${greatChance}%` : ''})`
                : `${choice.skillCheck.label} ${great ? 'Great Success' : (success ? 'Success' : 'Fail')} (${chance}%${greatChance ? `, Great ${greatChance}%` : ''})`;
            if (great && choice.skillCheck.greatSuccessText) choiceResponse = choice.skillCheck.greatSuccessText;
            if (!great && success && choice.skillCheck.successText) choiceResponse = choice.skillCheck.successText;
            if (!success && choice.skillCheck.failText) choiceResponse = choice.skillCheck.failText;
            if (success && !choiceResponse && choice.response) choiceResponse = choice.response;

            // 경험치 획득 로직
            const baseXp = 10; // 기본 경험치
            const successBonus = success ? 5 : 0; // 성공 시 추가 경험치
            const totalXp = baseXp + successBonus;

            // 관련 스킬들에 경험치 부여
            choice.skillCheck.group.forEach(groupName => {
                const skills = SKILL_GROUPS[groupName] || [groupName];
                skills.forEach(skill => {
                    const result = gainSkillXp(simState.skillProgress, skill, totalXp, passions);
                    skillXpGains.push({ skill, newLevel: result.level, newXp: result.xp, leveledUp: result.leveledUp });
                });
            });
        }

        if (event.traitMods?.hp && (event.base.hp !== 0 || baseDelta.hp !== 0)) {
            const { score, note } = getTraitScore(event.traitMods.hp);
            hpDelta += score;
            if (note) traitNotes.push(note);
        }
        if (event.traitMods?.food && (event.base.food !== 0 || baseDelta.food !== 0)) {
            const { score, note } = getTraitScore(event.traitMods.food);
            foodDelta += score;
            if (note) traitNotes.push(note);
        }
        if (event.traitMods?.meds && (event.base.meds !== 0 || baseDelta.meds !== 0)) {
            const { score, note } = getTraitScore(event.traitMods.meds);
            medsDelta += score;
            if (note) traitNotes.push(note);
        }
        if (event.traitMods?.money && (event.base.money !== 0 || baseDelta.money !== 0)) {
            const { score, note } = getTraitScore(event.traitMods.money);
            moneyDelta += score;
            if (note) traitNotes.push(note);
        }

        const canApplySkillBonus = !choice?.skillCheck;
        let skillNote = '';
        if (canApplySkillBonus && event.skillGroup && event.skillTargets && event.skillTargets.length > 0) {
            const { bonus, note } = getSkillBonus(event.skillGroup);
            event.skillTargets.forEach(target => {
                if (target === 'hp') hpDelta += bonus;
                if (target === 'food') foodDelta += bonus;
                if (target === 'meds') medsDelta += bonus;
                if (target === 'money') moneyDelta += bonus;
            });
            skillNote = note;
        }

        if ((turnEffectModifiers?.foodGainPenalty ?? 0) > 0 && foodDelta > 0) {
            const penalty = turnEffectModifiers?.foodGainPenalty ?? 0;
            const reduced = Math.max(0, foodDelta - penalty);
            if (reduced !== foodDelta) {
                traitNotes.push(language === 'ko'
                    ? `지속 효과: 식량 획득량이 ${foodDelta}→${reduced}로 감소했습니다.`
                    : `Ongoing effect: food gain reduced ${foodDelta}→${reduced}.`);
                foodDelta = reduced;
            }
        }

        if (event.category === 'danger' && skillOutcome === 'fail') {
            const failMult = getEffectiveFailPenaltyMultiplier(eventDay);
            hpDelta = scaleNegativeDelta(hpDelta, failMult);
            foodDelta = scaleNegativeDelta(foodDelta, failMult);
            medsDelta = scaleNegativeDelta(medsDelta, failMult);
            moneyDelta = scaleNegativeDelta(moneyDelta, failMult);
            if (eventDay <= EARLY_EASING_END_DAY && hpDelta < 0 && !simState.evacActive && !simState.evacReady) {
                hpDelta = Math.min(0, hpDelta + 1);
                traitNotes.push(language === 'ko'
                    ? '초반 완충: 피해를 조금 덜 받았습니다.'
                    : 'Early-game easing: damage slightly reduced.');
            }
        }

        if (event.category === 'danger' && campLevel > 0 && hpDelta < 0) {
            const mitigated = Math.min(campLevel, Math.abs(hpDelta));
            hpDelta += mitigated;
            if (mitigated > 0) {
                traitNotes.push(language === 'ko' ? '캠프 방벽이 피해를 줄였다.' : 'Camp defenses reduce the damage.');
            }
        }

        if (traitIds.has('tough') && hpDelta < 0) {
            const original = hpDelta;
            // 피해 절반 (소숫점 5 이상 반올림)
            hpDelta = Math.round(Math.abs(hpDelta) * 0.5) * -1;
            if (hpDelta !== original) {
                traitNotes.push(language === 'ko'
                    ? `강인함: 피해가 감소했습니다. (${original} → ${hpDelta})`
                    : `Tough: Damage mitigated. (${original} → ${hpDelta})`);
            }
        }

        const eventOutcomeDelta: SimDelta = {
            hp: hpDelta,
            food: foodDelta,
            meds: medsDelta,
            money: moneyDelta
        };

        hp += hpDelta;
        food += foodDelta;
        meds += medsDelta;
        money += moneyDelta;

        hp = clampStat(hp);
        food = clampStat(food, 30);
        meds = clampStat(meds, 30);
        money = clampStat(money, 30);

        const delta = {
            hp: hp - dayStart.hp,
            food: food - dayStart.food,
            meds: meds - dayStart.meds,
            money: money - dayStart.money
        };

        // Skill Progress 업데이트 및 알림
        const updatedSkillProgress = { ...simState.skillProgress };
        skillXpGains.forEach(gain => {
            updatedSkillProgress[gain.skill] = { level: gain.newLevel, xp: gain.newXp };
            if (gain.leveledUp) {
                traitNotes.push(language === 'ko'
                    ? `🎉 ${gain.skill} 레벨 UP! (Lv.${gain.newLevel})`
                    : `🎉 ${gain.skill} Level UP! (Lv.${gain.newLevel})`);
            }
        });

        const responseText = buildResponseText(baseNotes, traitNotes, skillNote, choiceResponse, systemNote);
        const responseTextCard = buildResponseText(baseNotes, traitNotes, skillNote, choiceResponse, systemNote, true);

        return {
            after: { hp, food, meds, money },
            counts: { petCount, loverCount, spouseCount },
            delta,
            eventOutcomeDelta,
            responseText,
            responseTextCard,
            status: hp <= 0 ? 'dead' : 'running',
            skillProgress: updatedSkillProgress
        };
    }, [
        simState.petCount,
        simState.loverCount,
        simState.spouseCount,
        simState.skillProgress,
        simState.evacActive,
        simState.evacReady,
        traitIds,
        passions,
        language,
        rollSkillCheck,
        getTraitScore,
        getSkillBonus,
        buildResponseText
    ]);

    const meetsRequirements = (choice: SimChoice, state: { food: number; meds: number; money: number }) => {
        if (!choice.requirements) return true;
        if (choice.requirements.food && state.food < choice.requirements.food) return false;
        if (choice.requirements.meds && state.meds < choice.requirements.meds) return false;
        if (choice.requirements.money && state.money < choice.requirements.money) return false;
        return true;
    };

    const submitScore = useCallback(async (exitType: ExitType, dayCount: number, penalize: boolean, deathContext: DeathContext = null) => {
        if (!isSupabaseConfigured()) {
            setSubmitMessage(language === 'ko' ? '리더보드 제출에 실패했습니다. (DB 미설정)' : 'Leaderboard submission failed. (DB not configured)');
            return;
        }
        const accountId = typeof window !== 'undefined' ? localStorage.getItem('settler_account_id') : null;
        if (!accountId) {
            setSubmitMessage(language === 'ko' ? '로그인이 필요합니다.' : 'Login required.');
            return;
        }
        const finalDay = penalize ? Math.floor(dayCount * 0.9) : dayCount;
        try {
            const payload = {
                account_id: accountId,
                settler_name: userInfo?.name || '정착민',
                day_count: finalDay,
                exit_type: exitType,
                traits: result?.traits || [],
                skills: result?.skills || [],
                mbti: result?.mbti || '',
                backstory_childhood: result?.backstory?.childhood || null,
                backstory_adulthood: result?.backstory?.adulthood || null,
                incapabilities: result?.incapabilities || [],
                age: userInfo?.age || 20,
                gender: userInfo?.gender || 'Male'
            };
            if (deathContext) {
                (payload as Record<string, unknown>).death_context = deathContext;
            }
            let { error } = await supabase.from('leaderboard_scores').insert(payload);
            // Backward compatibility: if schema isn't migrated yet, retry without death_context.
            if (error && (deathContext || String((error as { message?: unknown }).message ?? '').includes('death_context'))) {
                const fallbackPayload = { ...payload };
                delete (fallbackPayload as Record<string, unknown>).death_context;
                ({ error } = await supabase.from('leaderboard_scores').insert(fallbackPayload));
            }
            if (error) throw error;
            setSubmitMessage(language === 'ko'
                ? `리더보드에 기록되었습니다. (일차 ${finalDay})`
                : `Submitted to leaderboard. (Day ${finalDay})`);
        } catch (err) {
            console.error('Failed to submit leaderboard score:', err);
            const detail = (typeof err === 'object' && err && 'message' in err)
                ? String((err as { message?: unknown }).message ?? '')
                : '';
            setSubmitMessage(language === 'ko'
                ? `리더보드 제출에 실패했습니다.${detail ? ` (${detail})` : ''}`
                : `Leaderboard submission failed.${detail ? ` (${detail})` : ''}`);
        }
    }, [language, userInfo, result]);

    const prepareNextTurn = useCallback((): PreparedTurn | null => {
        if (simState.status !== 'running' || pendingChoice) return null;
        if (currentCard && cardView === 'event') return null;

        const nextDay = simState.day + 1;
        const season = getSeasonLabel(nextDay, language);

        let hp = simState.hp;
        let food = simState.food;
        let meds = simState.meds;
        let money = simState.money;
        const responseNotes: string[] = [];
        let effectDangerBias = 0;
        let effectForceDanger = false;
        let effectFoodGainPenalty = 0;
        let effectDisableHealing = false;
        let effectObfuscateUi = false;
        const activeEffects = simState.activeEffects ?? [];
        const remainingEffects: NextDayEffect[] = [];

        if (nextDay > 0 && activeEffects.length > 0) {
            activeEffects.forEach(effect => {
                hp += effect.hpMod ?? 0;
                food += effect.foodMod ?? 0;
                meds += effect.medsMod ?? 0;
                money += effect.moneyMod ?? 0;
                effectDangerBias += effect.dangerBias ?? 0;
                effectFoodGainPenalty += effect.foodGainPenalty ?? 0;
                if (effect.disableHealing) effectDisableHealing = true;
                if (effect.forceDangerNextDay) effectForceDanger = true;
                if (effect.obfuscateUi) effectObfuscateUi = true;
                responseNotes.push(language === 'ko' ? effect.noteKo : effect.noteEn);
                const nextRemaining = effect.remainingDays - 1;
                if (nextRemaining > 0) {
                    remainingEffects.push({ ...effect, remainingDays: nextRemaining });
                }
            });
        }

        const turnEffectModifiers: TurnEffectModifiers = {
            foodGainPenalty: effectFoodGainPenalty,
            disableHealing: effectDisableHealing,
            obfuscateUi: effectObfuscateUi
        };

        if (nextDay > 0) {
            food -= 1;
            if (food < 0) {
                food = 0;
                hp -= 1;
                responseNotes.push(language === 'ko' ? '식량이 부족하여 체력이 저하되었습니다.' : 'Lack of food decreased your HP.');
            }
        }

        hp = clampStat(hp);
        food = clampStat(food, 30);
        meds = clampStat(meds, 30);
        money = clampStat(money, 30);

        let hasSerumForDay = simState.hasSerum;
        if (hp <= 0 && hasSerumForDay) {
            hp = 10;
            hasSerumForDay = false;
            responseNotes.push(
                language === 'ko'
                    ? '부활 혈청이 작동해 죽음을 피했습니다.'
                    : 'Resurrector Serum activated and prevented death.'
            );
        }

        const dayStart = { hp, food, meds, money };

        // 일일 식량 대성공 보너스는 dayStart 이후에 적용해 결과 delta에 반영
        let dailyGreatSuccess = false;
        const dailyGreatSuccessNote = language === 'ko'
            ? '대성공! 숙련된 요리/재배로 식량을 추가 확보했습니다.'
            : 'Great success! Skilled cooking/farming secured extra food.';
        if (nextDay > 0) {
            const foodSkillAvg = getGroupAverage(['Plants', 'Cooking']);
            const greatChance = getGreatSuccessChance(foodSkillAvg);
            if (greatChance > 0) {
                const roll = Math.random() * 100;
                if (roll < greatChance) {
                    food += 2;
                    dailyGreatSuccess = true;
                }
            }
        }

        food = clampStat(food, 30);
        const baseSimState: SimState = {
            ...simState,
            day: nextDay,
            hp,
            food,
            meds,
            money,
            hasSerum: hasSerumForDay
        };
        if (hp <= 0) {
            const deathDuringEvac = simState.evacActive && simState.evacCountdown > 0;
            if (deathDuringEvac) {
                responseNotes.push(
                    language === 'ko'
                        ? '탈출을 갈망하다 사망했습니다.'
                        : 'Died yearning for escape.'
                );
            }
            const deathEvent: SimEvent = {
                id: 'starvation_death',
                title: language === 'ko' ? '굶주림' : 'Starvation',
                description: language === 'ko'
                    ? '식량이 바닥나 끝내 쓰러졌습니다.'
                    : 'You collapsed from lack of food.',
                category: 'danger',
                weight: 0,
                base: { hp: 0, food: 0, meds: 0, money: 0 }
            };
            const resolved = resolveEvent(deathEvent, nextDay, dayStart, { hp, food, meds, money }, responseNotes, simState.campLevel);
            const entry: SimLogEntry = {
                day: nextDay,
                season,
                title: deathEvent.title,
                description: deathEvent.description,
                response: resolved.responseText,
                responseCard: resolved.responseTextCard,
                delta: resolved.delta,
                eventDelta: resolved.eventOutcomeDelta,
                after: { ...resolved.after, hp: 0 },
                status: 'bad'
            };
            return {
                simState: {
                    ...baseSimState,
                    status: 'dead',
                    hp: 0,
                    food: resolved.after.food,
                    meds: resolved.after.meds,
                    money: resolved.after.money,
                    activeEffects: remainingEffects,
                    deathDuringEvac,
                    log: [entry, ...simState.log].slice(0, 60)
                },
                pendingChoice: null,
                currentCard: {
                    day: nextDay,
                    season,
                    event: deathEvent,
                    entry
                },
                cardView: 'result',
                showDeathResult: true
            };
        }

        if (nextDay >= SHIP_BUILD_DAY && !hasShipBuilt) {
            const endingEvent: SimEvent = {
                id: 'ship_built',
                title: language === 'ko' ? '우주선 완성' : 'Ship Complete',
                description: language === 'ko'
                    ? '당신은 결국 우주선을 만들어냈습니다. 이로써 당신은 이 변방계에서 탈출할 수 있게 되었습니다. 지금 당장 탈출하거나, 아니면 더 여기 있기를 선택할 수 있습니다.'
                    : 'You finally completed the ship. You can escape now or stay and keep surviving.',
                category: 'noncombat',
                nonCombatSubtype: 'special',
                weight: 0,
                base: { hp: 0, food: 0, meds: 0, money: 0 },
                choices: [
                    {
                        id: 'begin_evac',
                        label: language === 'ko' ? '탈출 준비 개시' : 'Start Evacuation',
                        description: language === 'ko' ? `탈출 카운트다운 ${EVAC_SURVIVAL_DAYS}일 시작` : `Start ${EVAC_SURVIVAL_DAYS}-day evacuation countdown`,
                        delta: { hp: 0, food: 0, meds: 0, money: 0 },
                        response: language === 'ko' ? `우주선 시동을 걸었습니다. ${EVAC_SURVIVAL_DAYS}일만 더 버티면 탈출합니다.` : `Ship startup initiated. Survive ${EVAC_SURVIVAL_DAYS} more days to escape.`
                    },
                    {
                        id: 'stay_longer',
                        label: language === 'ko' ? '계속 변방계에서 살아가기' : 'Keep Surviving',
                        description: language === 'ko' ? '계속 도전한다.' : 'Keep pushing further.',
                        delta: { hp: 0, food: 0, meds: 0, money: 0 },
                        response: language === 'ko' ? '더 살아남기로 했다.' : 'You decide to stay.'
                    }
                ]
            };
            return {
                simState: {
                    ...baseSimState,
                    daysSinceDanger: (simState.daysSinceDanger ?? 0) + 1,
                    activeEffects: remainingEffects
                },
                pendingChoice: {
                    day: nextDay,
                    season,
                    event: endingEvent,
                    dayStart,
                    baseAfter: { hp, food, meds, money },
                    responseNotes,
                    turnEffectModifiers
                },
                currentCard: {
                    day: nextDay,
                    season,
                    event: endingEvent
                },
                cardView: 'event',
                hasShipBuilt: true,
                showEndingCard: true
            };
        }

        if (nextDay === ERA_100_DAY && !simState.era100Shown) {
            const omenEvent: SimEvent = {
                id: 'era100_omen',
                title: language === 'ko' ? '100일의 전조' : 'Omen of Day 100',
                description: language === 'ko'
                    ? '기지가 오래 버틴 대가를 치를 시간이 왔습니다. 이제 선택의 여파가 다음 날까지 남습니다.'
                    : 'The cost of long survival is here. From now on, your choices will echo into the next day.',
                category: 'noncombat',
                nonCombatSubtype: 'special',
                weight: 0,
                base: { hp: 0, food: 0, meds: 0, money: 0 },
                choices: [
                    {
                        id: 'omen_stabilize',
                        label: language === 'ko' ? '안정 우선' : 'Prioritize Stability',
                        description: language === 'ko' ? '돈 -1, 다음날 위험도 -2%' : 'Money -1, next-day danger -2%',
                        delta: { hp: 0, food: 0, meds: 0, money: -1 },
                        response: language === 'ko' ? '기지 내부를 정비해 변수부터 줄였습니다.' : 'You stabilize internal systems first.',
                        nextDayEffect: {
                            id: 'omen_stabilize_after',
                            sourceEventId: 'era100_omen',
                            remainingDays: 3,
                            dangerBias: -2,
                            tone: 'positive',
                            noteKo: '안정화 여파: 다음날 위험 확률이 낮아집니다.',
                            noteEn: 'Stabilization aftereffect: danger chance is lower today.'
                        }
                    },
                    {
                        id: 'omen_aggressive',
                        label: language === 'ko' ? '공격적 준비' : 'Aggressive Prep',
                        description: language === 'ko' ? '다음날 체력 -1, 위험도 +4%' : 'Next day HP -1, danger +4%',
                        delta: { hp: 0, food: 0, meds: 0, money: 0 },
                        response: language === 'ko' ? '외곽 전초를 무리하게 확장했습니다.' : 'You overextend forward outposts.',
                        nextDayEffect: {
                            id: 'omen_aggressive_after',
                            sourceEventId: 'era100_omen',
                            remainingDays: 4,
                            hpMod: -1,
                            dangerBias: 4,
                            tone: 'negative',
                            noteKo: '과확장 여파: 다음날 체력이 줄고 위험이 커집니다.',
                            noteEn: 'Overextension aftereffect: lower HP and higher danger today.'
                        }
                    },
                    {
                        id: 'omen_stockpile',
                        label: language === 'ko' ? '보급 집중' : 'Stockpile Focus',
                        description: language === 'ko' ? '다음날 식량 +1, 돈 -1, 위험도 +2%' : 'Next day Food +1, Money -1, danger +2%',
                        delta: { hp: 0, food: 0, meds: 0, money: 0 },
                        response: language === 'ko' ? '현금 흐름을 깎아 비상 보급을 늘렸습니다.' : 'You convert cash flow into emergency supplies.',
                        nextDayEffect: {
                            id: 'omen_stockpile_after',
                            sourceEventId: 'era100_omen',
                            remainingDays: 3,
                            foodMod: 1,
                            moneyMod: -1,
                            foodGainPenalty: 1,
                            dangerBias: 2,
                            tone: 'negative',
                            noteKo: '비축 여파: 식량은 늘지만 자금이 줄고 위험이 약간 증가합니다.',
                            noteEn: 'Stockpile aftereffect: more food, less money, slightly higher danger today.'
                        }
                    }
                ]
            };
            return {
                simState: {
                    ...baseSimState,
                    era100Shown: true,
                    activeEffects: remainingEffects
                },
                pendingChoice: {
                    day: nextDay,
                    season,
                    event: omenEvent,
                    dayStart,
                    baseAfter: { hp, food, meds, money },
                    responseNotes,
                    turnEffectModifiers
                },
                currentCard: {
                    day: nextDay,
                    season,
                    event: omenEvent
                },
                cardView: 'event'
            };
        }

        let event: SimEvent;
        let serumTraderShown = simState.serumTraderShown;
        let evacForceThreatNextDay = simState.evacForceThreatNextDay;
        if (simState.evacActive) {
            const dangerPool = events.filter(e => e.category === 'danger' && !SIEGE_EVENT_IDS.has(e.id));
            const siegePool = events.filter(e => e.category === 'danger' && SIEGE_EVENT_IDS.has(e.id));
            const nonCombatPool = events.filter(e => e.category === 'noncombat');
            const quietPool = events.filter(e => e.category === 'quiet');

            let selectedCat: SimEventCategory;
            if (simState.evacForceThreatNextDay || effectForceDanger) {
                selectedCat = 'danger';
                evacForceThreatNextDay = false;
            } else {
                const evacDangerWeight = Math.max(35, Math.min(85, 60 + effectDangerBias));
                const evacNonCombatWeight = Math.max(10, Math.min(35, 20 - Math.floor(effectDangerBias / 2)));
                const roll = Math.random() * 100;
                if (roll < evacDangerWeight) selectedCat = 'danger';
                else if (roll < evacDangerWeight + evacNonCombatWeight) selectedCat = 'noncombat';
                else selectedCat = 'quiet';
            }

            if (selectedCat === 'danger') {
                const preferSiege = Math.random() < 0.5;
                if (preferSiege && siegePool.length > 0) {
                    event = pickWeightedEvent(siegePool);
                } else if (dangerPool.length > 0) {
                    event = pickWeightedEvent(dangerPool);
                } else if (siegePool.length > 0) {
                    event = pickWeightedEvent(siegePool);
                } else {
                    event = pickWeightedEvent(events.filter(e => e.category === 'danger'));
                }
            } else if (selectedCat === 'noncombat') {
                event = nonCombatPool.length > 0
                    ? pickNonCombatEvent(nonCombatPool, {
                        day: nextDay,
                        isEvac: true,
                        effectDangerBias,
                        hp,
                        food,
                        meds,
                        money
                    })
                    : pickWeightedEvent(events);
            } else {
                event = quietPool.length > 0 ? pickWeightedEvent(quietPool) : pickWeightedEvent(events);
                evacForceThreatNextDay = true;
            }
        } else if (nextDay === 7) {
            const filteredDanger = events.filter(e => e.category === 'danger');
            event = filteredDanger.length > 0 ? pickWeightedEvent(filteredDanger) : pickWeightedEvent(events);
        } else if (money >= 15 && !simState.serumTraderShown && Math.random() < 0.05) {
            event = {
                id: 'resurrector_trader',
                title: language === 'ko' ? '부활 혈청 상인' : 'Resurrector Serum Trader',
                description: language === 'ko'
                    ? '특별한 물건을 취급하는 정체불명의 상인이 기지에 머무르기를 요청합니다. 그는 죽음조차 되돌릴 수 있다는 전설의 부활 혈청을 가지고 있다고 주장합니다.'
                    : 'A mysterious trader with rare artifacts visits. He claims to possess a legendary resurrector serum.',
                category: 'noncombat',
                nonCombatSubtype: 'special',
                weight: 0,
                base: { hp: 0, food: 0, meds: 0, money: 0 },
                isRainbow: true,
                choices: [
                    {
                        id: 'buy_serum',
                        label: language === 'ko' ? '구매한다 (돈 15)' : 'Buy (Money 15)',
                        description: language === 'ko' ? '전설적인 혈청을 구매합니다.' : 'Purchase the serum.',
                        delta: { hp: 0, food: 0, meds: 0, money: -15 },
                        response: language === 'ko' ? '부활 혈청을 구매했습니다! 기묘한 무지개빛 광채가 혈청병에서 뿜어져 나옵니다.' : 'You purchased the serum! A strange rainbow glow emits from the vial.',
                        isRainbow: true
                    },
                    {
                        id: 'pass_serum',
                        label: language === 'ko' ? '보낸다' : 'Dismiss',
                        delta: { hp: 0, food: 0, meds: 0, money: 0 },
                        response: language === 'ko' ? '상인을 돌려보냈습니다. 상인은 기분 나쁜 웃음을 지으며 사라졌습니다.' : 'You dismissed the trader.'
                    }
                ]
            };
            serumTraderShown = true;
        } else if (food === 0 && money > 0 && Math.random() < 0.4) {
            event = buildSupplyEvent(language, money, food, meds);
        } else {
            const baseDangerChance = getDangerChance(nextDay, simState.daysSinceDanger ?? 0);
            const earlyRelief = getEarlyDangerChanceRelief(
                nextDay,
                simState.daysSinceDanger ?? 0,
                simState.evacActive || simState.evacReady
            );
            const dangerChance = Math.max(0, Math.min(95, baseDangerChance + effectDangerBias - earlyRelief));
            const remaining = Math.max(0, 100 - dangerChance);
            const wQuiet = remaining * (50 / 90);
            let wNonCombat = remaining * (40 / 90);
            const wMind = wNonCombat * 0.2;
            wNonCombat = wNonCombat * 0.8;
            const wDanger = dangerChance;
            const totalSetWeight = wQuiet + wNonCombat + wMind + wDanger;
            const roll = Math.random() * totalSetWeight;
            let selectedCat: SimEventCategory = 'quiet';
            if (effectForceDanger) {
                selectedCat = 'danger';
            } else if (roll <= wQuiet) selectedCat = 'quiet';
            else if (roll <= wQuiet + wNonCombat) selectedCat = 'noncombat';
            else if (roll <= wQuiet + wNonCombat + wMind) selectedCat = 'mind';
            else selectedCat = 'danger';

            const filteredEvents = events.filter(e => {
                if (e.category !== selectedCat) return false;
                if (e.id === 'era100_omen') return false;
                if (SIEGE_EVENT_IDS.has(e.id) && nextDay < 100) return false;
                if (traitIds.has('asexual') && (e.id === 'breakup' || e.id === 'marriage' || e.id === 'divorce')) return false;
                if (e.id === 'pet_death' && simState.petCount <= 0) return false;
                if (e.id === 'breakup' && simState.loverCount <= 0) return false;
                if (e.id === 'marriage' && (simState.loverCount <= 0 || simState.spouseCount > 0)) return false;
                if (e.id === 'divorce' && simState.spouseCount <= 0) return false;
                return true;
            });
            if (selectedCat === 'noncombat' && filteredEvents.length > 0) {
                event = pickNonCombatEvent(filteredEvents, {
                    day: nextDay,
                    isEvac: false,
                    effectDangerBias,
                    hp,
                    food,
                    meds,
                    money
                });
            } else {
                event = filteredEvents.length > 0 ? pickWeightedEvent(filteredEvents) : pickWeightedEvent(events);
            }
        }

        if (event.id === 'soul_duel') {
            event = buildSoulDuelEvent(language, pickDuelOpponent());
        }

        if (dailyGreatSuccess && event.id === 'quiet_day') {
            responseNotes.push(dailyGreatSuccessNote);
        }

        event = applyTraitChoices(event!, traitIds, skillMap, language);
        const nextDaysSinceDanger = event.category === 'danger'
            ? 0
            : (simState.daysSinceDanger ?? 0) + 1;

        if (event.choices && event.choices.length > 0) {
            const available = event.choices
                .filter(choice => meetsRequirements(choice, { food, meds, money }))
                .map(choice => {
                    if (choice.skillCheck && (choice.id === 'avoid' || choice.id === 'raid_retreat')) {
                        const hasMoveTrait = Array.from(MOVEMENT_TRAITS).some(id => traitIds.has(id));
                        return {
                            ...choice,
                            skillCheck: {
                                ...choice.skillCheck,
                                fixedChance: hasMoveTrait ? 90 : 60
                            }
                        };
                    }
                    return choice;
                });
            event = available.length === 0 ? { ...event, choices: undefined } : { ...event, choices: available };
        }

        if (event.id === 'quiet_day' && event.choices && event.choices.length > 0 && quietAutoPreset !== 'manual') {
            const autoChoice = event.choices.find(choice => choice.id === quietAutoPreset) ?? event.choices[0];
            const autoPlanNote = language === 'ko'
                ? `주간 프리셋 자동 실행: ${autoChoice.label}`
                : `Weekly preset auto-run: ${autoChoice.label}`;
            const resolved = resolveEvent(
                event,
                nextDay,
                dayStart,
                { hp, food, meds, money },
                [...responseNotes, autoPlanNote],
                simState.campLevel,
                autoChoice,
                turnEffectModifiers
            );

            let finalHp = resolved.after.hp;
            let finalStatus: SimStatus = finalHp <= 0 ? 'dead' : 'running';
            let finalResponse = resolved.responseText;
            let finalResponseCard = resolved.responseTextCard;
            let finalHasSerum = baseSimState.hasSerum;
            let finalEvacCountdown = simState.evacCountdown;
            let finalEvacReady = simState.evacReady;
            let finalDeathDuringEvac = false;
            let shouldPromptLaunchReady = false;
            let finalActiveEffects = remainingEffects;

            if (finalHp <= 0 && finalHasSerum) {
                finalHp = 10;
                finalStatus = 'running';
                finalHasSerum = false;
                const reviveText = language === 'ko'
                    ? ' 하지만 부활 혈청이 작동하여 당신을 죽음에서 다시 일으켜 세웠습니다!'
                    : ' However, the Resurrector Serum activated and brought you back to life!';
                finalResponse += reviveText;
                finalResponseCard += reviveText;
            }

            if (simState.evacActive && finalStatus === 'running') {
                finalEvacCountdown = Math.max(0, simState.evacCountdown - 1);
                if (finalEvacCountdown === 0) {
                    finalEvacReady = true;
                    shouldPromptLaunchReady = true;
                    finalResponse += language === 'ko'
                        ? ' 탈출 준비가 완료되었습니다. 우주선 출발을 선택할 수 있습니다.'
                        : ' Evacuation prep is complete. You can launch the ship anytime.';
                    finalResponseCard += language === 'ko'
                        ? '\n탈출 준비 완료! 우주선 출발 가능.'
                        : '\nEvacuation prep complete! Ship launch available.';
                }
            } else if (!simState.evacActive && !finalEvacReady) {
                finalEvacCountdown = 0;
            }

            if (finalStatus === 'dead' && simState.evacActive && simState.evacCountdown > 0) {
                finalDeathDuringEvac = true;
                finalResponse += language === 'ko'
                    ? ' 탈출 웨이브를 견뎌내지 못했습니다.'
                    : ' You failed to withstand the evacuation wave.';
                finalResponseCard += language === 'ko'
                    ? '\n탈출 웨이브를 견뎌내지 못했습니다.'
                    : '\nFailed to withstand the evacuation wave.';
            }

            const canApplyNextDayEffect = !!autoChoice.nextDayEffect && finalStatus === 'running'
                && (nextDay >= ERA_100_DAY || autoChoice.nextDayEffect.applyBeforeEra100);
            if (canApplyNextDayEffect && autoChoice.nextDayEffect) {
                finalActiveEffects = [...remainingEffects, { ...autoChoice.nextDayEffect }];
                finalResponse += language === 'ko'
                    ? ` 다음 일차 영향이 남았습니다: ${autoChoice.nextDayEffect.noteKo}`
                    : ` Next-day consequence applied: ${autoChoice.nextDayEffect.noteEn}`;
                finalResponseCard += language === 'ko'
                    ? `\n다음 일차 영향: ${autoChoice.nextDayEffect.noteKo}`
                    : `\nNext-day consequence: ${autoChoice.nextDayEffect.noteEn}`;
            }

            const entryStatus: SimLogEntry['status'] = resolved.delta.hp < 0 ? 'bad' : resolved.delta.hp > 0 ? 'good' : 'neutral';
            const entry: SimLogEntry = {
                day: nextDay,
                season,
                title: event.title,
                description: event.description,
                response: finalResponse,
                responseCard: finalResponseCard,
                delta: resolved.delta,
                eventDelta: resolved.eventOutcomeDelta,
                after: { ...resolved.after, hp: finalHp },
                status: entryStatus
            };

            return {
                simState: {
                    ...baseSimState,
                    hp: finalHp,
                    food: resolved.after.food,
                    meds: resolved.after.meds,
                    money: resolved.after.money,
                    petCount: resolved.counts.petCount,
                    loverCount: resolved.counts.loverCount,
                    spouseCount: resolved.counts.spouseCount,
                    status: finalStatus,
                    hasSerum: finalHasSerum,
                    serumTraderShown,
                    evacActive: simState.evacActive && finalEvacCountdown > 0,
                    evacCountdown: finalEvacCountdown,
                    evacForceThreatNextDay: simState.evacActive && finalEvacCountdown > 0 ? evacForceThreatNextDay : false,
                    deathDuringEvac: finalDeathDuringEvac,
                    evacReady: finalEvacReady,
                    activeEffects: finalActiveEffects,
                    skillProgress: resolved.skillProgress,
                    daysSinceDanger: nextDaysSinceDanger,
                    log: [entry, ...simState.log].slice(0, 60)
                },
                pendingChoice: null,
                currentCard: {
                    day: nextDay,
                    season,
                    event,
                    entry
                },
                cardView: 'event',
                showLaunchReadyPrompt: shouldPromptLaunchReady
            };
        }

        if (event.choices && event.choices.length > 0) {
            return {
                simState: {
                    ...baseSimState,
                    daysSinceDanger: nextDaysSinceDanger,
                    serumTraderShown,
                    evacForceThreatNextDay,
                    deathDuringEvac: false,
                    activeEffects: remainingEffects
                },
                pendingChoice: {
                    day: nextDay,
                    season,
                    event,
                    dayStart,
                    baseAfter: { hp, food, meds, money },
                    responseNotes,
                    turnEffectModifiers
                },
                currentCard: {
                    day: nextDay,
                    season,
                    event
                },
                cardView: 'event'
            };
        }

        const resolved = resolveEvent(event, nextDay, dayStart, { hp, food, meds, money }, responseNotes, simState.campLevel, undefined, turnEffectModifiers);
        let finalHp = resolved.after.hp;
        let finalStatus: SimStatus = finalHp <= 0 ? 'dead' : 'running';
        let finalResponse = resolved.responseText;
        let finalResponseCard = resolved.responseTextCard;
        let finalHasSerum = baseSimState.hasSerum;
        let finalEvacCountdown = simState.evacCountdown;
        let finalEvacReady = simState.evacReady;
        let finalDeathDuringEvac = false;
        let shouldPromptLaunchReady = false;

        if (finalHp <= 0 && finalHasSerum) {
            finalHp = 10;
            finalStatus = 'running';
            finalHasSerum = false;
            const reviveText = language === 'ko'
                ? ' 하지만 부활 혈청이 작동하여 당신을 죽음에서 다시 일으켜 세웠습니다!'
                : ' However, the Resurrector Serum activated and brought you back to life!';
            finalResponse += reviveText;
            finalResponseCard += reviveText;
        }

        if (simState.evacActive && finalStatus === 'running') {
            finalEvacCountdown = Math.max(0, simState.evacCountdown - 1);
            if (finalEvacCountdown === 0) {
                finalEvacReady = true;
                shouldPromptLaunchReady = true;
                finalResponse += language === 'ko'
                    ? ' 탈출 준비가 완료되었습니다. 우주선 출발을 선택할 수 있습니다.'
                    : ' Evacuation prep is complete. You can launch the ship anytime.';
                finalResponseCard += language === 'ko'
                    ? '\n탈출 준비 완료! 우주선 출발 가능.'
                    : '\nEvacuation prep complete! Ship launch available.';
            }
        } else if (!simState.evacActive && !finalEvacReady) {
            finalEvacCountdown = 0;
        }

        if (finalStatus === 'dead' && simState.evacActive && simState.evacCountdown > 0) {
            finalDeathDuringEvac = true;
            finalResponse += language === 'ko'
                ? ' 탈출 웨이브를 견뎌내지 못했습니다.'
                : ' You failed to withstand the evacuation wave.';
            finalResponseCard += language === 'ko'
                ? '\n탈출 웨이브를 견뎌내지 못했습니다.'
                : '\nFailed to withstand the evacuation wave.';
        }

        const entryStatus: SimLogEntry['status'] = resolved.delta.hp < 0 ? 'bad' : resolved.delta.hp > 0 ? 'good' : 'neutral';
        const entry: SimLogEntry = {
            day: nextDay,
            season,
            title: event.title,
            description: event.description,
            response: finalResponse,
            responseCard: finalResponseCard,
            delta: resolved.delta,
            eventDelta: resolved.eventOutcomeDelta,
            after: { ...resolved.after, hp: finalHp },
            status: entryStatus
        };

        return {
            simState: {
                ...baseSimState,
                hp: finalHp,
                food: resolved.after.food,
                meds: resolved.after.meds,
                money: resolved.after.money,
                petCount: resolved.counts.petCount,
                loverCount: resolved.counts.loverCount,
                spouseCount: resolved.counts.spouseCount,
                status: finalStatus,
                hasSerum: finalHasSerum,
                serumTraderShown,
                evacActive: simState.evacActive && finalEvacCountdown > 0,
                evacCountdown: finalEvacCountdown,
                evacForceThreatNextDay: simState.evacActive && finalEvacCountdown > 0 ? evacForceThreatNextDay : false,
                deathDuringEvac: finalDeathDuringEvac,
                evacReady: finalEvacReady,
                activeEffects: remainingEffects,
                skillProgress: resolved.skillProgress,
                daysSinceDanger: nextDaysSinceDanger,
                log: [entry, ...simState.log].slice(0, 60)
            },
            pendingChoice: null,
            currentCard: {
                day: nextDay,
                season,
                event,
                entry
            },
            cardView: 'event',
            showLaunchReadyPrompt: shouldPromptLaunchReady
        };
    }, [simState, pendingChoice, language, events, traitIds, skillMap, resolveEvent, currentCard, cardView, hasShipBuilt, getGroupAverage, pickDuelOpponent, quietAutoPreset]);

    const applyPreparedTurn = useCallback((nextTurn: PreparedTurn) => {
        setSimState(nextTurn.simState);
        setPendingChoice(nextTurn.pendingChoice);
        setCurrentCard(nextTurn.currentCard);
        setCardView(nextTurn.cardView);
        if (nextTurn.hasShipBuilt !== undefined) setHasShipBuilt(nextTurn.hasShipBuilt);
        if (nextTurn.showEndingCard !== undefined) setShowEndingCard(nextTurn.showEndingCard);
        if (nextTurn.allowContinue !== undefined) setAllowContinue(nextTurn.allowContinue);
        if (nextTurn.canBoardShip !== undefined) setCanBoardShip(nextTurn.canBoardShip);
        if (nextTurn.showLaunchReadyPrompt) setShowLaunchReadyPrompt(true);
        if (nextTurn.showDeathResult !== undefined) setShowDeathResult(nextTurn.showDeathResult);
    }, []);

    const advanceDay = useCallback(() => {
        const nextTurn = prepareNextTurn();
        if (!nextTurn) return;
        applyPreparedTurn(nextTurn);
    }, [prepareNextTurn, applyPreparedTurn]);

    useEffect(() => {
        if (!startQueued) return;
        if (simState.status !== 'running' || simState.day !== 0 || currentCard || pendingChoice) return;
        setStartQueued(false);
        advanceDay();
    }, [startQueued, simState.status, simState.day, currentCard, pendingChoice, advanceDay]);

    const resolveChoice = (choiceId: string) => {
        if (!pendingChoice) return;
        const choice = pendingChoice.event.choices?.find(c => c.id === choiceId);
        if (!choice) return;

        if (pendingChoice.event.id === 'ship_built') {
            if (choice.id === 'begin_evac') {
                const ok = window.confirm(
                    language === 'ko'
                        ? `우주선 시동을 걸면 ${EVAC_SURVIVAL_DAYS}일 버텨야 탈출합니다. 곧 습격이 몰아닥칠 텐데 시작하시겠습니까?`
                        : `Starting ship launch requires surviving ${EVAC_SURVIVAL_DAYS} more days. Raids will intensify—start now?`
                );
                if (!ok) return;
                const finalOk = window.confirm(
                    language === 'ko'
                        ? '탈출 준비를 시작하면 습격이 몰아닥칠 수 있습니다. 마지막 확인입니다. 시작하시겠습니까?'
                        : 'Starting evacuation can trigger heavy raids. Final confirmation—start now?'
                );
                if (!finalOk) return;
                setAllowContinue(true);
                setCanBoardShip(false);
                setShowEndingCard(false);
                setPendingChoice(null);
                setSimState(prev => ({
                    ...prev,
                    evacActive: true,
                    evacCountdown: EVAC_SURVIVAL_DAYS,
                    evacForceThreatNextDay: false,
                    deathDuringEvac: false,
                    evacReady: false
                }));
                setCurrentCard({
                    day: pendingChoice.day,
                    season: pendingChoice.season,
                    event: pendingChoice.event,
                    entry: {
                        day: pendingChoice.day,
                        season: pendingChoice.season,
                        title: pendingChoice.event.title,
                        description: pendingChoice.event.description,
                        response: choice.response || '',
                        responseCard: choice.response || '',
                        delta: { hp: 0, food: 0, meds: 0, money: 0 },
                        eventDelta: { hp: 0, food: 0, meds: 0, money: 0 },
                        after: { hp: simState.hp, food: simState.food, meds: simState.meds, money: simState.money },
                        status: 'neutral'
                    }
                });
                setCardView('result');
                return;
            }
            if (choice.id === 'stay_longer') {
                setAllowContinue(true);
                setCanBoardShip(true);
                setShowEndingCard(false);
                setPendingChoice(null);
                setCurrentCard({
                    day: pendingChoice.day,
                    season: pendingChoice.season,
                    event: pendingChoice.event,
                    entry: {
                        day: pendingChoice.day,
                        season: pendingChoice.season,
                        title: pendingChoice.event.title,
                        description: pendingChoice.event.description,
                        response: choice.response || '',
                        responseCard: choice.response || '',
                        delta: { hp: 0, food: 0, meds: 0, money: 0 },
                        eventDelta: { hp: 0, food: 0, meds: 0, money: 0 },
                        after: { hp: simState.hp, food: simState.food, meds: simState.meds, money: simState.money },
                        status: 'neutral'
                    }
                });
                setCardView('result');
                return;
            }
        }

        let effectiveChoice = choice;
        if (pendingChoice.event.id === 'soul_duel' && choice.duelTrack) {
            const opponent = pendingChoice.event.duelOpponent;
            const playerScore = getCurrentDuelStat(choice.duelTrack);
            const opponentScore = opponent ? opponent[choice.duelTrack] : 0;
            const won = playerScore >= opponentScore;
            effectiveChoice = {
                ...choice,
                delta: { ...choice.delta, hp: won ? 3 : -3 },
                response: language === 'ko'
                    ? `${opponent?.name ?? '상대'}와의 영혼의 승부에서 ${won ? '승리했습니다.' : '패배했습니다.'}`
                    : `You ${won ? 'won' : 'lost'} the soul duel against ${opponent?.name ?? 'the rival'}.`
            };
        }

        const resolved = resolveEvent(
            pendingChoice.event,
            pendingChoice.day,
            // Use current state as baseline to include any changes made while pending (e.g. using meds)
            { hp: simState.hp, food: simState.food, meds: simState.meds, money: simState.money },
            { hp: simState.hp, food: simState.food, meds: simState.meds, money: simState.money },
            pendingChoice.responseNotes,
            simState.campLevel,
            effectiveChoice,
            pendingChoice.turnEffectModifiers
        );

        let finalHp = resolved.after.hp;
        let finalStatus: SimStatus = finalHp <= 0 ? 'dead' : 'running';
        let finalResponse = resolved.responseText;
        let finalResponseCard = resolved.responseTextCard;
        let finalHasSerum = simState.hasSerum;
        const finalCounts = resolved.counts;
        let finalEvacCountdown = simState.evacCountdown;
        let finalEvacReady = simState.evacReady;
        let finalDeathDuringEvac = false;
        let shouldPromptLaunchReady = false;
        let finalActiveEffects = simState.activeEffects;

        if (finalHp <= 0 && finalHasSerum) {
            finalHp = 10;
            finalStatus = 'running';
            finalHasSerum = false;
            const reviveText = language === 'ko'
                ? ' 하지만 부활 혈청이 작동하여 당신을 죽음에서 다시 일으켜 세웠습니다!'
                : ' However, the Resurrector Serum activated and brought you back to life!';
            finalResponse += reviveText;
            finalResponseCard += reviveText;
        }

        if (pendingChoice.event.id === 'resurrector_trader' && choice.id === 'buy_serum') {
            finalHasSerum = true;
        }

        if (simState.evacActive && finalStatus === 'running') {
            finalEvacCountdown = Math.max(0, simState.evacCountdown - 1);
            if (finalEvacCountdown === 0) {
                finalEvacReady = true;
                shouldPromptLaunchReady = true;
                finalResponse += language === 'ko'
                    ? ' 탈출 준비가 완료되었습니다. 우주선 출발을 선택할 수 있습니다.'
                    : ' Evacuation prep is complete. You can launch the ship anytime.';
                finalResponseCard += language === 'ko'
                    ? '\n탈출 준비 완료! 우주선 출발 가능.'
                    : '\nEvacuation prep complete! Ship launch available.';
            }
        } else if (!simState.evacActive && !finalEvacReady) {
            finalEvacCountdown = 0;
        }

        if (finalStatus === 'dead' && simState.evacActive && simState.evacCountdown > 0) {
            finalDeathDuringEvac = true;
            finalResponse += language === 'ko'
                ? ' 탈출 웨이브를 견뎌내지 못했습니다.'
                : ' You failed to withstand the evacuation wave.';
            finalResponseCard += language === 'ko'
                ? '\n탈출 웨이브를 견뎌내지 못했습니다.'
                : '\nFailed to withstand the evacuation wave.';
        }

        const canApplyNextDayEffect = !!choice.nextDayEffect && finalStatus === 'running'
            && (pendingChoice.day >= ERA_100_DAY || choice.nextDayEffect.applyBeforeEra100);
        if (canApplyNextDayEffect && choice.nextDayEffect) {
            finalActiveEffects = [...simState.activeEffects, { ...choice.nextDayEffect }];
            finalResponse += language === 'ko'
                ? ` 다음 일차 영향이 남았습니다: ${choice.nextDayEffect.noteKo}`
                : ` Next-day consequence applied: ${choice.nextDayEffect.noteEn}`;
            finalResponseCard += language === 'ko'
                ? `\n다음 일차 영향: ${choice.nextDayEffect.noteKo}`
                : `\nNext-day consequence: ${choice.nextDayEffect.noteEn}`;
        }

        const entryStatus: SimLogEntry['status'] = resolved.delta.hp < 0 ? 'bad' : resolved.delta.hp > 0 ? 'good' : 'neutral';
        const entry: SimLogEntry = {
            day: pendingChoice.day,
            season: pendingChoice.season,
            title: pendingChoice.event.title,
            description: pendingChoice.event.description,
            response: finalResponse,
            responseCard: finalResponseCard,
            delta: resolved.delta,
            eventDelta: resolved.eventOutcomeDelta,
            after: { ...resolved.after, hp: finalHp },
            status: entryStatus
        };

        setSimState(prev => {
            const log = [entry, ...prev.log].slice(0, 60);
            return {
                ...prev,
                hp: finalHp,
                food: resolved.after.food,
                meds: resolved.after.meds,
                money: resolved.after.money,
                // Update counts
                petCount: finalCounts.petCount,
                loverCount: finalCounts.loverCount,
                spouseCount: finalCounts.spouseCount,
                status: finalStatus,
                hasSerum: finalHasSerum,
                evacActive: simState.evacActive && finalEvacCountdown > 0,
                evacCountdown: finalEvacCountdown,
                deathDuringEvac: finalDeathDuringEvac,
                evacForceThreatNextDay: simState.evacActive && finalEvacCountdown > 0 ? simState.evacForceThreatNextDay : false,
                evacReady: finalEvacReady,
                activeEffects: finalActiveEffects,
                skillProgress: resolved.skillProgress,
                log
            };
        });
        setCurrentCard({
            day: pendingChoice.day,
            season: pendingChoice.season,
            event: pendingChoice.event,
            entry
        });
        setCardView('result');

        setPendingChoice(null);
        if (shouldPromptLaunchReady) setShowLaunchReadyPrompt(true);
    };

    const handleUseMeds = () => {
        // if (pendingChoice) return; // 선택지 중에도 사용 가능하도록 변경
        const medicineLevel = skillMap['Medicine'] ?? 0;
        const healAmount = getHealAmount(medicineLevel);
        setSimState(prev => {
            const healingBlockedEffect = prev.activeEffects.find(effect => effect.disableHealing);
            if (healingBlockedEffect) {
                const entry: SimLogEntry = {
                    day: prev.day,
                    season: getSeasonLabel(prev.day, language),
                    title: language === 'ko' ? '치료 불가' : 'Healing Blocked',
                    description: language === 'ko' ? '치료제를 사용할 수 없습니다.' : 'You cannot use meds right now.',
                    response: language === 'ko'
                        ? `지속 영향으로 회복이 봉쇄되었습니다: ${healingBlockedEffect.noteKo}`
                        : `Recovery is blocked by an ongoing effect: ${healingBlockedEffect.noteEn}`,
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    after: { hp: prev.hp, food: prev.food, meds: prev.meds, money: prev.money },
                    status: 'warn'
                };
                return {
                    ...prev,
                    log: [entry, ...prev.log].slice(0, 60)
                };
            }
            if (prev.meds <= 0 || prev.hp >= 20) return prev;
            const hp = clampStat(prev.hp + healAmount);
            const meds = prev.meds - 1;
            const entry: SimLogEntry = {
                day: prev.day,
                season: getSeasonLabel(prev.day, language),
                title: language === 'ko' ? '치료제 사용' : 'Use Meds',
                description: language === 'ko' ? '치료제를 사용했다.' : 'You use meds.',
                response: language === 'ko'
                    ? `치료제로 HP +${hp - prev.hp} 회복했다.`
                    : `You recover +${hp - prev.hp} HP with meds.`,
                delta: { hp: hp - prev.hp, food: 0, meds: -1, money: 0 },
                after: { hp, food: prev.food, meds, money: prev.money },
                status: 'good'
            };
            return {
                ...prev,
                hp,
                meds,
                log: [entry, ...prev.log].slice(0, 60)
            };
        });
    };

    const handleUpgradeBase = () => {
        setSimState(prev => {
            const cost = BASE_UPGRADE_COSTS[prev.campLevel];
            if (cost === undefined || prev.money < cost) return prev;
            const money = prev.money - cost;
            const campLevel = prev.campLevel + 1;
            const entry: SimLogEntry = {
                day: prev.day,
                season: getSeasonLabel(prev.day, language),
                title: language === 'ko' ? '기지 업그레이드' : 'Base Upgrade',
                description: language === 'ko' ? `기지 방벽을 Lv.${campLevel}로 강화했다.` : `Base defenses upgraded to Lv.${campLevel}.`,
                response: language === 'ko' ? '방어력이 상승했다.' : 'Defense has improved.',
                delta: { hp: 0, food: 0, meds: 0, money: -cost },
                after: { hp: prev.hp, food: prev.food, meds: prev.meds, money },
                status: 'good'
            };
            return {
                ...prev,
                money,
                campLevel,
                log: [entry, ...prev.log].slice(0, 60)
            };
        });
    };

    const launchShipNow = () => {
        setSimState(prev => ({
            ...prev,
            status: 'success',
            evacActive: false,
            evacCountdown: 0
        }));
        setShowLaunchReadyPrompt(false);
        setShowLaunchConfirm(false);
    };

    useEffect(() => {
        if (simState.status === 'dead' || simState.status === 'success') {
            // No auto-progress to turn off
        }
    }, [simState.status]);

    useEffect(() => {
        if (simState.status !== 'dead' || submittedOnDeath) return;
        setSubmittedOnDeath(true);
        submitScore('death', simState.day, true, simState.deathDuringEvac ? 'evac_failed' : null);
    }, [simState.status, simState.day, simState.deathDuringEvac, submittedOnDeath, submitScore]);

    useEffect(() => {
        if (simState.status !== 'success' || submittedOnExit) return;
        setSubmittedOnExit(true);
        submitScore('escape', simState.day, false);
    }, [simState.status, simState.day, submittedOnExit, submitScore]);

    useEffect(() => {
        return () => {
            if (prepareTimerRef.current !== null) {
                window.clearTimeout(prepareTimerRef.current);
            }
            if (animateTimerRef.current !== null) {
                window.clearTimeout(animateTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (turnPhase !== 'idle' && prepareTimerRef.current === null && animateTimerRef.current === null) {
            setTurnPhase('idle');
        }
    }, [turnPhase]);


    const allChoices = pendingChoice?.event.choices ?? [];
    const canAdvanceDay = (simState.status === 'running' || (simState.status === 'dead' && showDeathResult))
        && !pendingChoice
        && turnPhase === 'idle'
        && (cardView === 'result' || !currentCard || (currentCard.entry && cardView === 'event'));

    useEffect(() => {
        const isTypingTarget = (target: EventTarget | null) => {
            if (!(target instanceof HTMLElement)) return false;
            const tag = target.tagName;
            return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
        };
        const onKeyDown = (e: KeyboardEvent) => {
            if (isTypingTarget(e.target)) return;
            if (pendingChoice) {
                if (e.key >= '1' && e.key <= '6') {
                    const idx = Number(e.key) - 1;
                    const choice = allChoices[idx];
                    if (choice) {
                        e.preventDefault();
                        resolveChoice(choice.id);
                    }
                }
                if (e.key >= '7' && e.key <= '9') {
                    const idx = Number(e.key) - 1;
                    const choice = allChoices[idx];
                    if (choice) {
                        e.preventDefault();
                        resolveChoice(choice.id);
                    }
                }
                if (e.key === '0') {
                    const idx = 9;
                    const choice = allChoices[idx];
                    if (choice) {
                        e.preventDefault();
                        resolveChoice(choice.id);
                    }
                }
                return;
            }
            if (e.key === 'ArrowRight' || e.key === 'Enter') {
                if (canAdvanceDay) {
                    e.preventDefault();
                    handleAdvanceDay();
                }
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [pendingChoice, allChoices, canAdvanceDay, handleAdvanceDay, resolveChoice]);

    if (loading) {
        return <div className="p-20 text-center text-gray-400 animate-pulse">{language === 'ko' ? '결과를 불러오는 중...' : 'Loading results...'}</div>;
    }

    if (!result) {
        return <div className="p-10 text-center text-gray-500">{language === 'ko' ? '결과가 없습니다.' : 'No result found.'}</div>;
    }

    const canSimulate = isFullResult && result.skills && result.skills.length > 0;

    if (!canSimulate) {
        return (
            <div className="max-w-2xl mx-auto text-center sim-panel p-8">
                <h1 className="text-2xl font-bold text-[var(--sim-text-main)] mb-4">
                    {language === 'ko' ? '시뮬레이션 이용 불가' : 'Simulation Locked'}
                </h1>
                <p className="text-[var(--sim-text-sub)] mb-6">
                    {language === 'ko'
                        ? '스킬 설문까지 완료해야 시뮬레이션이 가능합니다.'
                        : 'You need to complete the skill test to run the simulation.'}
                </p>
                {(s || contextTestPhase === 'skill') && (
                    <button
                        onClick={() => router.push('/test/intro')}
                        className="sim-btn sim-btn-secondary px-6 py-3"
                    >
                        {language === 'ko' ? '테스트 다시 시작' : 'Start Test'}
                    </button>
                )}
            </div>
        );
    }


    const medicineLevel = skillMap['Medicine'] ?? 0;
    const healAmount = getHealAmount(medicineLevel);
    const hasHealingBlockActive = simState.activeEffects.some(effect => effect.disableHealing);
    const hasNegativeActiveEffect = simState.activeEffects.some(isNegativeEffect);
    const hasPositiveActiveEffect = !hasNegativeActiveEffect && simState.activeEffects.some(isPositiveEffect);
    const canUseMeds = simState.meds > 0 && simState.hp < 20 && simState.status === 'running' && !hasHealingBlockActive;
    const nextBaseCost = BASE_UPGRADE_COSTS[simState.campLevel];
    const canUpgradeBase = nextBaseCost !== undefined && simState.money >= nextBaseCost;
    const canStartEvac = hasShipBuilt && simState.status === 'running' && !simState.evacActive && !simState.evacReady && !pendingChoice;
    const canLaunchNow = hasShipBuilt && simState.status === 'running' && simState.evacReady && !simState.evacActive && !pendingChoice;
    const canBoardNow = canStartEvac || canLaunchNow;
    const isCurrentDangerCard = simState.status === 'running' && currentCard?.event.category === 'danger';
    const isPreparedDangerCard = preparedTurn?.currentCard.event.category === 'danger';
    const isDangerChoiceContext = pendingChoice?.event.category === 'danger';
    const isUiCorrupted = !!pendingChoice?.turnEffectModifiers?.obfuscateUi;
    const isPreparedUiCorrupted = !!preparedTurn?.pendingChoice?.turnEffectModifiers?.obfuscateUi;
    const showEffectPulse = simState.status === 'running' && simState.activeEffects.length > 0 && !simState.evacActive;
    const effectPulseMode = hasNegativeActiveEffect ? 'negative' : (hasPositiveActiveEffect ? 'positive' : 'none');
    const quietPresetOptions: Array<{ id: QuietAutoPreset; label: string }> = useMemo(() => ([
        { id: 'manual', label: language === 'ko' ? '수동 선택' : 'Manual' },
        ...QUIET_PRESET_CONFIG.map(config => ({
            id: config.id,
            label: language === 'ko' ? config.labelKo : config.labelEn
        }))
    ]), [language]);
    const quietPresetChanceRows = useMemo(() => {
        return QUIET_PRESET_CONFIG.map(config => {
            const avg = getGroupAverage(config.group);
            let chance = Math.max(5, Math.min(95, getSkillChance(avg)));
            chance = Math.round(chance);
            const greatChance = config.hasGreat
                ? Math.max(0, Math.min(chance, Math.round(getGreatSuccessChance(avg))))
                : 0;
            return {
                id: config.id,
                label: language === 'ko' ? config.labelKo : config.labelEn,
                chance,
                greatChance
            };
        });
    }, [getGroupAverage, language]);
    const selectedQuietPresetRow = quietPresetChanceRows.find(row => row.id === quietAutoPreset);

    function handleAdvanceDay() {
        if (turnPhase !== 'idle') {
            if (prepareTimerRef.current === null && animateTimerRef.current === null) {
                setTurnPhase('idle');
            } else {
                return;
            }
        }
        if (simState.status === 'dead' && showDeathResult) {
            setShowDeathResult(false);
            return;
        }
        if (currentCard?.entry && cardView === 'event') {
            setCardView('result');
            return;
        }
        if (!canAdvanceDay) return;

        const nextTurn = prepareNextTurn();
        if (!nextTurn) return;

        setPreparedTurn(nextTurn);
        setTurnPhase('preparing');
        prepareTimerRef.current = window.setTimeout(() => {
            setTurnPhase('advancing');
            animateTimerRef.current = window.setTimeout(() => {
                applyPreparedTurn(nextTurn);
                setPreparedTurn(null);
                setTurnPhase('idle');
                animateTimerRef.current = null;
            }, 220);
            prepareTimerRef.current = null;
        }, 140);
    }

    const getExactDeltaText = (label: string, delta: number) => {
        if (delta === 0) return '';
        const sign = delta > 0 ? '+' : '';
        return `${label} ${sign}${delta}`;
    };

    const renderDeltaItems = (entry: SimLogEntry) => {
        if (!entry) return null;
        const delta = entry.eventDelta ?? entry.delta;
        const { after } = entry;
        const items = [];
        if (delta.hp !== 0) items.push({ label: 'HP', value: after.hp, delta: delta.hp, color: 'red' });
        if (delta.food !== 0) items.push({ label: language === 'ko' ? '식량' : 'Food', value: after.food, delta: delta.food, color: 'brown' });
        if (delta.meds !== 0) items.push({ label: language === 'ko' ? '치료제' : 'Meds', value: after.meds, delta: delta.meds, color: 'pink' });
        if (delta.money !== 0) items.push({ label: language === 'ko' ? '돈' : 'Money', value: after.money, delta: delta.money, color: 'green' });

        if (items.length === 0) return (
            <div className="mt-6 py-4 px-6 rounded-xl border border-[var(--sim-border)] bg-[var(--sim-surface-1)]/70 text-[var(--sim-text-muted)] text-sm font-medium">
                {language === 'ko' ? '자원 변화 없음' : 'No resource changes'}
            </div>
        );

        const colorMap: Record<string, { text: string, bg: string, border: string }> = {
            red: { text: '#ff5f5f', bg: 'rgba(255, 95, 95, 0.15)', border: '#ff3b3b' },
            brown: { text: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)', border: '#d97706' },
            pink: { text: '#f472b6', bg: 'rgba(244, 114, 182, 0.15)', border: '#db2777' },
            green: { text: '#4ade80', bg: 'rgba(74, 222, 128, 0.15)', border: '#16a34a' }
        };

        return (
            <div className="mt-6 flex flex-wrap justify-center gap-3">
                {items.map((item, idx) => {
                    const c = colorMap[item.color];
                    return (
                        <div
                            key={idx}
                            style={{
                                color: c.text,
                                backgroundColor: c.bg,
                                borderColor: c.border,
                                borderWidth: '2px',
                                borderStyle: 'solid'
                            }}
                            className="px-4 py-3 rounded-xl flex flex-col items-center justify-center min-w-[110px] shadow-[0_10px_20px_-6px_rgba(0,0,0,0.25)] transition-all"
                        >
                            <span className="text-[11px] font-black opacity-80 uppercase tracking-widest mb-1">{item.label}</span>
                            <div className="flex flex-col items-center gap-0.5">
                                <span className="text-3xl font-black leading-none">
                                    {item.delta > 0 ? `+${item.delta}` : item.delta}
                                </span>
                                <span className="text-[10px] font-bold opacity-70 mt-1 whitespace-nowrap">
                                    {language === 'ko' ? '현재' : 'Total'} {item.value}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-10 text-[var(--sim-text-main)]">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-[var(--sim-accent)] tracking-tight">
                        {language === 'ko' ? '생존 시뮬레이션' : 'Survival Simulation'}
                    </h1>
                    <p className="text-sm text-[var(--sim-text-sub)]">
                        {language === 'ko'
                            ? '4계절 × 15일 = 60일 생존 시 우주선 탈출 성공'
                            : '4 Seasons × 15 days = Escape if you survive 60 days'}
                    </p>
                </div>
                <div className="text-right text-xs text-[var(--sim-text-sub)]">
                    {language === 'ko' ? '정착민' : 'Colonist'}:{' '}
                    <span className="sim-chip px-3 py-1 text-[var(--sim-text-main)]">{userInfo?.name || '정착민'}</span>
                </div>
            </div>

            <div className="flex flex-col items-center gap-4">
                <div className="relative w-full flex items-center justify-center">
                    <div className="relative">
                        <div aria-hidden className={`reigns-card-stack reigns-card-stack--back-1 ${preparedTurn ? 'reigns-card-stack--preview' : ''}`}>
                            {preparedTurn && (
                                <div className={`reigns-card-stack-content ${isPreparedDangerCard ? 'reigns-card-stack-content--danger' : ''} ${preparedTurn.currentCard.event.isRainbow ? 'rainbow-glow' : ''}`}>
                                    <div className="reigns-card-stack-meta">
                                        {`Day ${preparedTurn.currentCard.day} • ${preparedTurn.currentCard.season}`}
                                    </div>
                                    <div className="reigns-card-stack-title">
                                        {isPreparedUiCorrupted ? scrambleText(preparedTurn.currentCard.event.title) : preparedTurn.currentCard.event.title}
                                    </div>
                                    <div className="reigns-card-stack-icon">{isPreparedUiCorrupted ? '◼️' : getEventIcon(preparedTurn.currentCard.event)}</div>
                                    <div className="reigns-card-stack-body">
                                        {isPreparedUiCorrupted ? scrambleText(preparedTurn.currentCard.event.description) : preparedTurn.currentCard.event.description}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div
                            className={`reigns-card rounded-[18px] ${cardView === 'result' && simState.status === 'running' ? 'reigns-card--flipped' : ''} ${turnPhase === 'advancing' ? 'reigns-card--advance' : ''} ${simState.evacActive && simState.status === 'running' ? 'ring-2 ring-red-500/70 shadow-[0_0_24px_rgba(168,85,247,0.45)]' : ''} ${showEffectPulse && effectPulseMode === 'negative' ? 'ring-2 ring-red-500/60 shadow-[0_0_22px_rgba(239,68,68,0.35)]' : ''} ${showEffectPulse && effectPulseMode === 'positive' ? 'ring-2 ring-emerald-500/70 shadow-[0_0_22px_rgba(16,185,129,0.35)]' : ''}`}
                        >
                            {simState.evacActive && simState.status === 'running' && (
                                <div
                                    aria-hidden
                                    className="pointer-events-none absolute inset-0 z-30 rounded-[18px] border-2 border-red-400/70 animate-pulse"
                                />
                            )}
                            {showEffectPulse && effectPulseMode === 'negative' && (
                                <div
                                    aria-hidden
                                    className="pointer-events-none absolute inset-0 z-20 rounded-[18px] border-2 border-red-400/70 animate-pulse"
                                />
                            )}
                            {showEffectPulse && effectPulseMode === 'positive' && (
                                <div
                                    aria-hidden
                                    className="pointer-events-none absolute inset-0 z-20 rounded-[18px] border-2 border-emerald-400/70 animate-pulse"
                                />
                            )}
                            <div className="reigns-card-inner">
                                {simState.status === 'dead' && !showDeathResult ? (
                                    <div className="reigns-card-face reigns-card-front flex flex-col items-center justify-center text-center p-6 space-y-4">
                                        <div className="text-[var(--sim-danger)] text-3xl font-black tracking-tighter">GAME OVER</div>
                                        <div className="text-5xl">💀</div>
                                        <div className="text-[var(--sim-text-main)] text-lg font-bold">
                                            {simState.deathDuringEvac
                                                ? (language === 'ko' ? '탈출 웨이브를 견뎌내지 못함' : 'Failed to withstand the evacuation wave')
                                                : (language === 'ko' ? `${simState.day}일차에 사망` : `Died on Day ${simState.day}`)}
                                        </div>
                                        <div className="text-[var(--sim-text-sub)] text-xs leading-relaxed px-4">
                                            {language === 'ko'
                                                ? '사망으로 인해 최종 점수가 10% 감소되어 리더보드에 저장되었습니다.'
                                                : 'Final score reduced by 10% due to death and saved to leaderboard.'}
                                        </div>
                                        <div className="flex flex-row w-full gap-2 mt-4 px-2">
                                            <button
                                                onClick={() => window.location.reload()}
                                                className="sim-btn sim-btn-danger flex-1 py-3 text-xs"
                                            >
                                                {language === 'ko' ? '재도전' : 'Restart'}
                                            </button>
                                            <button
                                                onClick={() => router.push('/leaderboard')}
                                                className="sim-btn sim-btn-ghost flex-1 py-3 text-xs"
                                            >
                                                {language === 'ko' ? '순위표' : 'Ranking'}
                                            </button>
                                            <button
                                                onClick={() => router.push('/')}
                                                className="sim-btn sim-btn-ghost flex-1 py-3 text-xs"
                                            >
                                                {language === 'ko' ? '홈으로' : 'Home'}
                                            </button>
                                        </div>
                                    </div>
                                ) : simState.status === 'success' ? (
                                    <div className="reigns-card-face reigns-card-front flex flex-col items-center justify-center text-center p-6 space-y-4">
                                        <div className="text-[var(--sim-success)] text-3xl font-black tracking-tighter">VICTORY</div>
                                        <div className="text-5xl">🚀</div>
                                        <div className="text-[var(--sim-text-main)] text-lg font-bold">
                                            {language === 'ko' ? '탈출 카운트다운 생존 성공!' : 'Evacuation Survival Success!'}
                                        </div>
                                        <div className="text-[var(--sim-text-sub)] text-xs leading-relaxed px-4">
                                            {language === 'ko'
                                                ? '탈출 준비 이후 15일을 버텨 우주선을 발진시켰습니다. 점수가 리더보드에 기록되었습니다.'
                                                : 'You survived 15 evacuation days and launched the ship. Score recorded on leaderboard.'}
                                        </div>
                                        <div className="flex flex-row w-full gap-2 mt-4 px-2">
                                            <button
                                                onClick={() => window.location.reload()}
                                                className="sim-btn sim-btn-primary flex-1 py-3 text-xs"
                                            >
                                                {language === 'ko' ? '다시하기' : 'Restart'}
                                            </button>
                                            <button
                                                onClick={() => router.push('/leaderboard')}
                                                className="sim-btn sim-btn-ghost flex-1 py-3 text-xs"
                                            >
                                                {language === 'ko' ? '순위표' : 'Ranking'}
                                            </button>
                                            <button
                                                onClick={() => router.push('/')}
                                                className="sim-btn sim-btn-ghost flex-1 py-3 text-xs"
                                            >
                                                {language === 'ko' ? '홈으로' : 'Home'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className={`reigns-card-face reigns-card-front ${isCurrentDangerCard ? 'reigns-card-front--danger' : ''} flex flex-col text-center ${currentCard?.event.isRainbow ? 'rainbow-glow' : ''}`}>
                                            <div className="flex flex-col h-full">
                                                <div className="text-xs text-[var(--sim-text-sub)]">
                                                    {currentCard
                                                        ? `Day ${currentCard.day} • ${currentCard.season}`
                                                        : (language === 'ko' ? '시뮬레이션 대기 중' : 'Simulation Standby')}
                                                </div>
                                                {simState.evacActive && simState.status === 'running' && (
                                                    <div className="mt-2 text-[11px] font-black text-red-300 tracking-wide">
                                                        {language === 'ko'
                                                            ? `탈출까지 ${simState.evacCountdown}일 남음!`
                                                            : `${simState.evacCountdown} days until escape!`}
                                                    </div>
                                                )}
                                                <div className="mt-4 text-2xl md:text-3xl font-bold text-[var(--sim-text-main)] leading-tight">
                                                    {isUiCorrupted
                                                        ? scrambleText(currentCard?.event.title || (language === 'ko' ? '생존 게임을 시작하세요' : 'Start the Survival Game'))
                                                        : (currentCard?.event.title || (language === 'ko' ? '생존 게임을 시작하세요' : 'Start the Survival Game'))}
                                                </div>
                                                <div className="mt-4 text-5xl">
                                                    {isUiCorrupted ? '◼️' : getEventIcon(currentCard?.event)}
                                                </div>
                                                <div className="mt-4 text-sm md:text-base text-[var(--sim-text-sub)] leading-relaxed overflow-y-auto max-h-[120px] px-2 custom-scrollbar">
                                                    {isUiCorrupted
                                                        ? scrambleText(currentCard?.event.description || (language === 'ko' ? '시뮬레이션 대기 중 생존 게임을 시작하세요' : 'Simulation Standby: Start the Survival Game'))
                                                        : (currentCard?.event.description || (language === 'ko' ? '시뮬레이션 대기 중 생존 게임을 시작하세요' : 'Simulation Standby: Start the Survival Game'))}
                                                </div>

                                                {!currentCard && (
                                                    <div className="mt-auto pt-6 flex flex-col sm:flex-row gap-3 justify-center">
                                                        <button
                                                            onClick={resumeSimulation}
                                                            className={`sim-btn sim-btn-secondary flex-1 px-6 py-3 text-sm ${!hasTempSave ? 'hidden' : ''}`}
                                                        >
                                                            {language === 'ko' ? '이어하기' : 'Resume'}
                                                        </button>
                                                        <button
                                                            onClick={startSimulation}
                                                            className="sim-btn sim-btn-primary flex-1 px-6 py-3 text-sm"
                                                        >
                                                            {language === 'ko' ? (hasTempSave ? '새로 시작' : '시작하기') : (hasTempSave ? 'New Game' : 'Start')}
                                                        </button>
                                                    </div>
                                                )}

                                                <div className="mt-auto pt-4 space-y-2">
                                                    {pendingChoice && (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                            {allChoices.map(choice => {
                                                                const getExpectation = (choiceDelta: SimDelta) => {
                                                                    const eventObj = pendingChoice.event;
                                                                    let hpD = eventObj.base.hp + choiceDelta.hp;
                                                                    let foodD = eventObj.base.food + choiceDelta.food;
                                                                    let medsD = eventObj.base.meds + choiceDelta.meds;
                                                                    let moneyD = eventObj.base.money + choiceDelta.money;

                                                                    if (eventObj.traitMods?.hp && (eventObj.base.hp !== 0 || choiceDelta.hp !== 0)) hpD += getTraitScore(eventObj.traitMods.hp).score;
                                                                    if (eventObj.traitMods?.food && (eventObj.base.food !== 0 || choiceDelta.food !== 0)) foodD += getTraitScore(eventObj.traitMods.food).score;
                                                                    if (eventObj.traitMods?.meds && (eventObj.base.meds !== 0 || choiceDelta.meds !== 0)) medsD += getTraitScore(eventObj.traitMods.meds).score;
                                                                    if (eventObj.traitMods?.money && (eventObj.base.money !== 0 || choiceDelta.money !== 0)) moneyD += getTraitScore(eventObj.traitMods.money).score;

                                                                    if (!choice.skillCheck && eventObj.skillGroup && eventObj.skillTargets) {
                                                                        const { bonus } = getSkillBonus(eventObj.skillGroup);
                                                                        eventObj.skillTargets.forEach(t => {
                                                                            if (t === 'hp') hpD += bonus;
                                                                            if (t === 'food') foodD += bonus;
                                                                            if (t === 'meds') medsD += bonus;
                                                                            if (t === 'money') moneyD += bonus;
                                                                        });
                                                                    }
                                                                    if (eventObj.category === 'danger' && simState.campLevel > 0 && hpD < 0) {
                                                                        hpD += Math.min(simState.campLevel, Math.abs(hpD));
                                                                    }

                                                                    const res = [] as string[];
                                                                    if (hpD !== 0) res.push(getExactDeltaText('HP', hpD));
                                                                    if (foodD !== 0) res.push(getExactDeltaText(language === 'ko' ? '식량' : 'Food', foodD));
                                                                    if (medsD !== 0) res.push(getExactDeltaText(language === 'ko' ? '치료제' : 'Meds', medsD));
                                                                    if (moneyD !== 0) res.push(getExactDeltaText(language === 'ko' ? '돈' : 'Money', moneyD));
                                                                    return res;
                                                                };

                                                                let chanceText = '';
                                                                const outcomeInfo = [] as string[];
                                                                if (choice.skillCheck) {
                                                                    const avg = getGroupAverage(choice.skillCheck.group);
                                                                    let chance = choice.skillCheck.fixedChance ?? getSkillChance(avg, choice.skillCheck.advanced);
                                                                    let greatChance = choice.skillCheck.greatSuccessDelta ? getGreatSuccessChance(avg) : 0;
                                                                    if (choice.skillCheck.chanceMultiplier) chance *= choice.skillCheck.chanceMultiplier;
                                                                    chance = Math.max(5, Math.min(95, chance));
                                                                    chance = Math.round(chance);
                                                                    chance = Math.max(5, Math.min(95, chance));
                                                                    if (greatChance > 0) {
                                                                        greatChance = Math.round(greatChance);
                                                                        greatChance = Math.max(0, Math.min(greatChance, chance));
                                                                    }
                                                                    chanceText = language === 'ko' ? `${chance}%` : `${chance}%`;
                                                                    const sText = getExpectation(choice.skillCheck.successDelta).join(', ');
                                                                    const fText = getExpectation(choice.skillCheck.failDelta).join(', ');
                                                                    const gText = choice.skillCheck.greatSuccessDelta ? getExpectation(choice.skillCheck.greatSuccessDelta).join(', ') : '';
                                                                    if (sText) outcomeInfo.push(language === 'ko' ? `성공: ${sText}` : `S: ${sText}`);
                                                                    if (fText) outcomeInfo.push(language === 'ko' ? `실패: ${fText}` : `F: ${fText}`);
                                                                    if (gText) outcomeInfo.push(language === 'ko' ? `대성공: ${gText}` : `G: ${gText}`);
                                                                } else {
                                                                    const info = getExpectation(choice.delta).join(', ');
                                                                    if (info) outcomeInfo.push(info);
                                                                }

                                                                return (
                                                                    <div key={choice.id} className="group relative">
                                                                        <button
                                                                            onClick={() => resolveChoice(choice.id)}
                                                                            className={`sim-btn sim-btn-secondary w-full px-3 py-2.5 text-xs border ${isDangerChoiceContext ? 'sim-choice--danger' : ''} ${choice.isRainbow ? 'rainbow-glow border-purple-500' : (choice.isRareSpawn ? 'sim-choice--rare' : (choice.isSpecial ? 'sim-choice--special' : 'border-[var(--sim-border)]'))} flex flex-col items-center justify-center min-h-[50px]`}
                                                                        >
                                                                            <div className="font-bold">{isUiCorrupted ? scrambleText(choice.label) : choice.label}</div>
                                                                            {!isUiCorrupted && chanceText && <div className="text-[10px] text-[var(--sim-accent)] font-black">{chanceText}</div>}
                                                                        </button>
                                                                        {!isUiCorrupted && outcomeInfo.length > 0 && (
                                                                            <div className="invisible group-hover:visible absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 p-2 bg-[var(--sim-surface-1)] border border-[var(--sim-border)] rounded-lg shadow-2xl text-[9px] text-[var(--sim-text-sub)] pointer-events-none opacity-0 group-hover:opacity-100 transition-all">
                                                                                <div className="font-black text-[var(--sim-accent)] border-b border-[var(--sim-border)] pb-1 mb-1">{language === 'ko' ? '예상 결과' : 'Expectation'}</div>
                                                                                {outcomeInfo.map((info, i) => <div key={i}>{info}</div>)}
                                                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[var(--sim-surface-1)]"></div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="reigns-card-face reigns-card-back flex flex-col text-center p-6">
                                            <div className="text-xs text-[var(--sim-accent)] font-bold uppercase tracking-wider mb-2">
                                                {language === 'ko' ? '사건 결과' : 'Event Result'}
                                            </div>
                                            <div className="flex-1 flex flex-col justify-center overflow-y-auto px-2">
                                                <div className="text-sm md:text-base text-[var(--sim-text-main)] leading-relaxed font-medium mb-4 whitespace-pre-line">
                                                    {currentCard?.entry?.responseCard || currentCard?.entry?.response || (language === 'ko' ? '결과를 불러오는 중...' : 'Loading results...')}
                                                </div>
                                                {currentCard?.entry && renderDeltaItems(currentCard.entry)}
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-[var(--sim-border)]">
                                                <div className="text-[10px] text-[var(--sim-text-muted)] italic">
                                                    {language === 'ko' ? '화살표 버튼을 눌러 다음 날로 이동하세요' : 'Press the arrow to advance day'}
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {(simState.status === 'running' || (simState.status === 'dead' && showDeathResult)) && (
                            <button
                                onClick={handleAdvanceDay}
                                disabled={!canAdvanceDay}
                                className={`absolute right-3 bottom-3 md:-right-20 md:top-1/2 md:bottom-auto md:-translate-y-1/2 h-12 w-12 md:h-14 md:w-14 rounded-full border-2 flex items-center justify-center transition-all z-20 ${canAdvanceDay
                                    ? 'bg-[var(--sim-accent)] hover:brightness-110 text-white border-[var(--sim-accent)] shadow-[0_4px_14px_rgba(0,0,0,0.28)] hover:scale-105 active:scale-95 animate-bounce-x'
                                    : 'bg-[var(--sim-surface-2)] text-[var(--sim-text-muted)] border-[var(--sim-border)] cursor-not-allowed opacity-50'
                                    }`}
                                title={language === 'ko' ? '다음 날로' : 'Next Day'}
                            >
                                <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="sim-panel p-4 md:p-6 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <SimStatTile label={language === 'ko' ? 'Day' : 'Day'} value={`${simState.day} / ${MAX_DAYS}`} />
                    <SimStatTile
                        label={language === 'ko' ? '계절' : 'Season'}
                        value={getSeasonLabel(simState.day, language)}
                        valueClassName="text-[var(--sim-accent)] truncate w-full text-center"
                    />
                    <SimStatTile label="HP" value={`${simState.hp} / 20`} labelClassName="text-red-500/80" />
                    <SimStatTile label={language === 'ko' ? '식량' : 'Food'} value={`${simState.food} / 30`} labelClassName="text-amber-600" />
                    <SimStatTile label={language === 'ko' ? '치료제' : 'Meds'} value={`${simState.meds} / 30`} labelClassName="text-pink-500" />
                    <SimStatTile label={language === 'ko' ? '돈' : 'Money'} value={`${simState.money} / 30`} labelClassName="text-green-500" />
                </div>
                {simState.evacActive && simState.status === 'running' && (
                    <div className="text-center text-xs font-bold text-red-300 bg-red-900/20 border border-red-500/40 rounded-lg px-3 py-2">
                        {language === 'ko'
                            ? `긴급 탈출 카운트다운 진행 중: ${simState.evacCountdown}일 남음`
                            : `Emergency evacuation countdown active: ${simState.evacCountdown} days remaining`}
                    </div>
                )}
                {simState.activeEffects.length > 0 && (
                    <div className={`rounded-lg px-3 py-2 border ${hasNegativeActiveEffect ? 'bg-red-900/15 border-red-500/40 text-red-200' : 'bg-emerald-900/15 border-emerald-500/40 text-emerald-200'}`}>
                        <div className="text-xs font-bold mb-1">
                            {hasNegativeActiveEffect
                                ? (language === 'ko' ? '위험한 지속 영향 활성' : 'Dangerous Ongoing Effects Active')
                                : (language === 'ko' ? '유리한 지속 영향 활성' : 'Beneficial Ongoing Effects Active')}
                        </div>
                        <div className="space-y-1">
                            {simState.activeEffects.map(effect => (
                                <div key={effect.id} className="text-[11px] leading-relaxed">
                                    • {language === 'ko' ? effect.noteKo : effect.noteEn} ({language === 'ko' ? `${effect.remainingDays}일` : `${effect.remainingDays}d`})
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <div className="rounded-lg border border-[var(--sim-border)] bg-[var(--sim-surface-1)]/70 px-3 py-3">
                    <div className="text-[11px] font-bold text-[var(--sim-text-sub)] mb-2">
                        {language === 'ko' ? '평범한 날 자동 프리셋' : 'Quiet Day Auto Preset'}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <label className="text-[10px] text-[var(--sim-text-muted)] uppercase tracking-wide">
                            {language === 'ko' ? '프리셋' : 'Preset'}
                        </label>
                        <select
                            value={quietAutoPreset}
                            onChange={(e) => setQuietAutoPreset(e.target.value as QuietAutoPreset)}
                            className="w-full sm:w-auto min-w-[180px] px-3 py-2 text-xs bg-[var(--sim-surface-2)] border border-[var(--sim-border)] rounded-md text-[var(--sim-text-main)]"
                        >
                            {quietPresetOptions.map(option => (
                                <option key={option.id} value={option.id}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    {quietAutoPreset === 'manual' ? (
                        <div className="mt-2 text-[10px] text-[var(--sim-text-muted)]">
                            {language === 'ko'
                                ? '수동 선택 모드입니다. 평범한 날에 직접 선택지를 고릅니다.'
                                : 'Manual mode: choose options directly on quiet days.'}
                        </div>
                    ) : selectedQuietPresetRow ? (
                        <div className="mt-2 text-[10px] text-[var(--sim-text-sub)]">
                            {language === 'ko'
                                ? `예상 성공률 ${selectedQuietPresetRow.chance}%`
                                : `Estimated success ${selectedQuietPresetRow.chance}%`}
                            {selectedQuietPresetRow.greatChance > 0 && (
                                <span className="text-[var(--sim-accent)] font-semibold">
                                    {language === 'ko'
                                        ? ` · 대성공 ${selectedQuietPresetRow.greatChance}%`
                                        : ` · Great ${selectedQuietPresetRow.greatChance}%`}
                                </span>
                            )}
                        </div>
                    ) : null}
                    <div className="mt-2 text-[10px] text-[var(--sim-text-muted)]">
                        {language === 'ko'
                            ? '자동 프리셋은 평범한 날에만 적용됩니다. 결과 카드는 기존처럼 직접 넘깁니다.'
                            : 'Auto preset applies only on quiet days. Result cards still require manual advance.'}
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 justify-between items-center pt-2 border-t border-[var(--sim-border)]">
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={handleUseMeds}
                            disabled={!canUseMeds}
                            className={`sim-btn px-4 py-2 text-xs ${canUseMeds
                                ? 'sim-btn-secondary'
                                : 'bg-[var(--sim-surface-2)] text-[var(--sim-text-muted)] border border-[var(--sim-border)] cursor-not-allowed opacity-50'
                                }`}
                        >
                            {hasHealingBlockActive
                                ? (language === 'ko' ? '💉 치료 봉쇄 중' : '💉 Healing Blocked')
                                : (language === 'ko' ? `💉 치료제 사용 (+${healAmount})` : `💉 Use Meds (+${healAmount})`)}
                        </button>
                        <button
                            onClick={handleUpgradeBase}
                            disabled={!canUpgradeBase}
                            className={`sim-btn px-4 py-2 text-xs ${canUpgradeBase
                                ? 'sim-btn-primary'
                                : 'bg-[var(--sim-surface-2)] text-[var(--sim-text-muted)] border border-[var(--sim-border)] cursor-not-allowed opacity-50'
                                }`}
                        >
                            {language === 'ko'
                                ? `🏰 기지 강화 Lv.${simState.campLevel} (${nextBaseCost})`
                                : `🏰 Upgrade Lv.${simState.campLevel} (${nextBaseCost})`}
                        </button>
                        <button
                            onClick={() => {
                                if (submittedOnExit) return;
                                if (pendingChoice) {
                                    alert(language === 'ko' ? '선택지를 먼저 해결해야 합니다.' : 'Resolve the current choice first.');
                                    return;
                                }
                                if (canLaunchNow) {
                                    setShowLaunchConfirm(true);
                                } else {
                                    setShowBoardConfirm(true);
                                }
                            }}
                            disabled={!canBoardNow}
                            className={`sim-btn px-4 py-2 text-xs ${canBoardNow
                                ? 'sim-btn-danger'
                                : 'bg-[var(--sim-surface-2)] text-[var(--sim-text-muted)] border border-[var(--sim-border)] cursor-not-allowed opacity-50'
                                }`}
                        >
                            {simState.evacActive
                                ? (language === 'ko' ? `🛸 탈출 준비 중 (${simState.evacCountdown}일)` : `🛸 Evac Active (${simState.evacCountdown}d)`)
                                : simState.evacReady
                                    ? (language === 'ko' ? '🛸 우주선 출발' : '🛸 Launch Ship')
                                    : (language === 'ko' ? `🛸 탈출 준비 시작 (${EVAC_SURVIVAL_DAYS}일)` : `🛸 Start Evac (${EVAC_SURVIVAL_DAYS}d)`)}
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button onClick={() => setShowLog(!showLog)} className="sim-btn sim-btn-ghost px-3 py-2 text-[10px] uppercase">
                            {showLog ? (language === 'ko' ? '로그 닫기' : 'Hide Logs') : (language === 'ko' ? '로그 보기' : 'Show Logs')}
                        </button>
                        <button onClick={() => setShowTraitsModal(true)} className="sim-btn sim-btn-ghost px-3 py-2 text-[10px] uppercase">
                            {language === 'ko' ? '특성' : 'Traits'}
                        </button>
                        <button onClick={() => setShowSkillsModal(true)} className="sim-btn sim-btn-ghost px-3 py-2 text-[10px] uppercase">
                            {language === 'ko' ? '기술' : 'Skills'}
                        </button>
                        <button onClick={() => setShowHelpModal(true)} className="sim-btn sim-btn-primary px-3 py-2 text-[10px] uppercase flex items-center gap-1">
                            <span>?</span> {language === 'ko' ? '도움말' : 'Help'}
                        </button>
                    </div>
                </div>

                {submitMessage && (
                    <div className="text-[10px] text-[var(--sim-accent)] font-medium text-center animate-pulse">
                        {submitMessage}
                    </div>
                )}
            </div>

            {showLog && (
                <div className="sim-panel p-5 animate-in slide-in-from-bottom-5 duration-300">
                    <h3 className="text-xs font-black text-[var(--sim-accent)] mb-4 uppercase tracking-[0.2em]">
                        --- {language === 'ko' ? '정착지 생존 기록' : 'Colony Survival Chronicles'} ---
                    </h3>
                    <div className="max-h-[500px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                        {simState.log.length === 0 && <div className="text-[var(--sim-text-muted)] text-xs italic text-center py-10">{language === 'ko' ? '아직 기록된 내용이 없습니다.' : 'Chronicles are empty.'}</div>}
                        {simState.log.map((entry, idx) => (
                            <div key={`${entry.day}-${idx}`} className="sim-card p-4 space-y-3 hover:border-[var(--sim-accent)] transition-colors">
                                <div className="flex items-center justify-between border-b border-[var(--sim-border)] pb-2">
                                    <div className="text-[10px] text-[var(--sim-text-muted)] font-bold">DAY {entry.day} • {entry.season}</div>
                                    <div className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${entry.status === 'good' ? 'bg-green-900/30 text-green-400' : entry.status === 'bad' ? 'bg-red-900/30 text-red-400' : 'bg-[var(--sim-surface-1)] text-[var(--sim-text-muted)] border border-[var(--sim-border)]'}`}>
                                        {entry.title}
                                    </div>
                                </div>
                                <div className="text-xs text-[var(--sim-text-sub)] leading-relaxed"><span className="text-[var(--sim-accent)]/80 font-bold mr-1">{language === 'ko' ? '상황:' : 'Event:'}</span> {entry.description}</div>
                                <div className="text-xs text-[var(--sim-text-main)] font-medium bg-[var(--sim-surface-1)] p-2 rounded-lg border border-[var(--sim-border)]"><span className="text-[var(--sim-accent)] font-bold mr-1">{language === 'ko' ? '대처:' : 'Response:'}</span> {entry.response}</div>
                                <div className="pt-1">{renderDeltaItems(entry)}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modals are unchanged but kept here for structural integrity or omitted if too long? I'll include them briefly or use simpler versions to fit. */}
            {showHelpModal && (
                <HelpModal onClose={() => setShowHelpModal(false)} language={language} />
            )}

            {showTraitsModal && (
                <SimModalShell
                    title={language === 'ko' ? '특성 목록' : 'Traits'}
                    icon="🧬"
                    maxWidthClassName="max-w-md"
                    onClose={() => setShowTraitsModal(false)}
                    footer={(
                        <div className="flex justify-end">
                            <button onClick={() => setShowTraitsModal(false)} className="sim-btn sim-btn-ghost px-6 py-2 text-xs">
                                {language === 'ko' ? '확인' : 'OK'}
                            </button>
                        </div>
                    )}
                >
                        <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {result.traits.map((tr: SimTraitLike) => {
                                const trId = typeof tr === 'string' ? tr : (tr.id ?? tr.name ?? 'unknown_trait');
                                const trName = typeof tr === 'string' ? tr : (tr.name ?? tr.id ?? 'Unknown Trait');
                                const effect = TRAIT_EFFECTS[trId];
                                return (
                                    <div key={trId} className="sim-card p-3">
                                        <div className="font-bold text-[var(--sim-accent)] text-sm mb-1">{trName}</div>
                                        {effect && <div className="text-[10px] text-[var(--sim-text-muted)] leading-relaxed">{language === 'ko' ? effect.ko : effect.en}</div>}
                                    </div>
                                );
                            })}
                        </div>
                </SimModalShell>
            )}

            {showSkillsModal && (
                <SimModalShell
                    title={language === 'ko' ? '기술/숙련도' : 'Skills & Proficiency'}
                    icon="📊"
                    maxWidthClassName="max-w-lg"
                    onClose={() => setShowSkillsModal(false)}
                    footer={(
                        <div className="flex justify-end">
                            <button onClick={() => setShowSkillsModal(false)} className="sim-btn sim-btn-ghost px-6 py-2 text-xs">
                                {language === 'ko' ? '확인' : 'OK'}
                            </button>
                        </div>
                    )}
                >
                        <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {ALL_SKILLS.map(skill => {
                                const baseLevel = skillMap[skill] || 0;
                                const progress = simState.skillProgress[skill] || { level: 0, xp: 0 };
                                const totalLevel = baseLevel + progress.level;
                                const passion = passions[skill] || 0;
                                const skillName = language === 'ko' ? (SKILL_NAMES_KO[skill] || skill) : skill;
                                const xpNeeded = progress.level >= 20 ? 0 : getXpForLevel(progress.level);
                                const xpPercent = progress.level >= 20 || xpNeeded === 0
                                    ? 100
                                    : Math.min(100, Math.floor((progress.xp / xpNeeded) * 100));
                                const passionIcon = passion >= 2 ? '🔥🔥' : passion === 1 ? '🔥' : '0';
                                const nextLevelText = progress.level >= 20
                                    ? 'MAX'
                                    : language === 'ko'
                                        ? `다음 레벨까지 ${xpPercent}%`
                                        : `Next level ${xpPercent}%`;

                                return (
                                    <div key={skill} className="sim-card p-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="min-w-0">
                                                <div className="text-sm font-bold text-[var(--sim-text-main)] truncate">{skillName}</div>
                                                <div className="text-[10px] text-[var(--sim-text-muted)] mt-0.5">{nextLevelText}</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="text-[10px] font-bold text-[var(--sim-text-sub)] bg-[var(--sim-surface-1)] border border-[var(--sim-border)] px-2 py-1 rounded">
                                                    {language === 'ko' ? '열정' : 'Passion'} <span className="text-xs font-black">{passionIcon}</span>
                                                </div>
                                                <div className="text-sm font-black text-[var(--sim-info)] bg-[var(--sim-surface-1)] border border-[var(--sim-border)] px-2 py-1 rounded">
                                                    <span className="text-base leading-none">{totalLevel}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-2 h-2 bg-[var(--sim-surface-1)] border border-[var(--sim-border)] rounded">
                                            <div className="h-full bg-gradient-to-r from-[var(--sim-info)] to-cyan-300 rounded" style={{ width: `${xpPercent}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                </SimModalShell>
            )}

            {showLaunchReadyPrompt && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in zoom-in-95 duration-200">
                    <div className="sim-modal-shell w-full max-w-md border-2 border-[var(--sim-accent)]">
                        <div className="bg-[var(--sim-accent)]/10 p-6 text-center border-b border-[var(--sim-border)]">
                            <div className="text-3xl mb-2">🛸</div>
                            <h3 className="text-xl font-black text-[var(--sim-accent)] uppercase tracking-widest">
                                {language === 'ko' ? '탈출 준비 완료' : 'Evac Ready'}
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-[var(--sim-text-sub)] text-sm leading-relaxed text-center font-medium">
                                {language === 'ko'
                                    ? '15일을 버텨 우주선 출발이 가능합니다. 출발하지 않고 계속 도전하시겠습니까?'
                                    : 'You survived 15 days. The ship is ready to launch. Continue the challenge?'}
                            </p>
                        </div>
                        <div className="p-4 bg-[var(--sim-surface-1)]/70 flex gap-3">
                            <button
                                onClick={() => setShowLaunchReadyPrompt(false)}
                                className="sim-btn sim-btn-ghost flex-1 py-3 text-sm"
                            >
                                {language === 'ko' ? '계속 도전' : 'Keep Challenging'}
                            </button>
                            <button
                                onClick={launchShipNow}
                                className="sim-btn sim-btn-danger flex-1 py-3 text-sm"
                            >
                                {language === 'ko' ? '지금 출발' : 'Launch Now'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showLaunchConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in zoom-in-95 duration-200">
                    <div className="sim-modal-shell w-full max-w-md border-2 border-[var(--sim-accent)]">
                        <div className="bg-[var(--sim-accent)]/10 p-6 text-center border-b border-[var(--sim-border)]">
                            <div className="text-3xl mb-2">🚀</div>
                            <h3 className="text-xl font-black text-[var(--sim-accent)] uppercase tracking-widest">
                                {language === 'ko' ? '우주선 출발' : 'Launch Ship'}
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-[var(--sim-text-sub)] text-sm leading-relaxed text-center font-medium">
                                {language === 'ko'
                                    ? '지금 출발하면 바로 엔딩입니다. 괜찮습니까?'
                                    : 'Launching now ends the game immediately. Proceed?'}
                            </p>
                        </div>
                        <div className="p-4 bg-[var(--sim-surface-1)]/70 flex gap-3">
                            <button
                                onClick={() => setShowLaunchConfirm(false)}
                                className="sim-btn sim-btn-ghost flex-1 py-3 text-sm"
                            >
                                {language === 'ko' ? '취소' : 'Cancel'}
                            </button>
                            <button
                                onClick={launchShipNow}
                                className="sim-btn sim-btn-danger flex-1 py-3 text-sm"
                            >
                                {language === 'ko' ? '출발' : 'Launch'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modals */}
            {(showBoardConfirm || showEndingConfirm) && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in zoom-in-95 duration-200">
                    <div className="sim-modal-shell w-full max-w-md border-2 border-[var(--sim-accent)]">
                        <div className="bg-[var(--sim-accent)]/10 p-6 text-center border-b border-[var(--sim-border)]">
                            <div className="text-3xl mb-2">🚀</div>
                            <h3 className="text-xl font-black text-[var(--sim-accent)] uppercase tracking-widest">
                                {language === 'ko' ? '우주선 탑승' : 'Board Spaceship'}
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-[var(--sim-text-sub)] text-sm leading-relaxed text-center font-medium">
                                {showEndingConfirm
                                    ? (language === 'ko'
                                        ? '정말 떠나시겠습니까? 계속 생존하여 더 높은 기록을 세울 수 있습니다.'
                                        : 'Do you really want to leave? You can continue to survive for a higher record.')
                                    : (language === 'ko'
                                        ? `우주선 시동을 걸면 ${EVAC_SURVIVAL_DAYS}일 버텨야 탈출합니다. 곧 습격이 몰아닥칠 텐데 시작하시겠습니까?`
                                        : `Starting ship launch requires surviving ${EVAC_SURVIVAL_DAYS} more days. Raids will intensify—start now?`)
                                }
                            </p>
                        </div>
                        <div className="p-4 bg-[var(--sim-surface-1)]/70 flex gap-3">
                            <button
                                onClick={() => {
                                    setShowBoardConfirm(false);
                                    setShowEndingConfirm(false);
                                }}
                                className="sim-btn sim-btn-ghost flex-1 py-3 text-sm"
                            >
                                {showEndingConfirm ? (language === 'ko' ? '계속 도전하기' : 'Continue Challenge') : (language === 'ko' ? '취소' : 'Cancel')}
                            </button>
                            <button
                                onClick={() => {
                                    if (showEndingConfirm) {
                                        const shouldStartNow = window.confirm(
                                            language === 'ko'
                                                ? '정말로 지금 시작하겠습니까?'
                                                : 'Start right now?'
                                        );
                                        if (!shouldStartNow) return;
                                    }
                                    const finalConfirm = window.confirm(
                                        language === 'ko'
                                            ? '탈출 준비를 시작하면 습격이 몰아닥칠 수 있습니다. 마지막 확인입니다. 시작하시겠습니까?'
                                            : 'Starting evacuation can trigger heavy raids. Final confirmation—start now?'
                                    );
                                    if (!finalConfirm) return;
                                    setSimState(prev => ({
                                        ...prev,
                                        evacActive: true,
                                        evacCountdown: EVAC_SURVIVAL_DAYS,
                                        evacForceThreatNextDay: false,
                                        deathDuringEvac: false,
                                        evacReady: false
                                    }));
                                    setShowBoardConfirm(false);
                                    setShowEndingConfirm(false);
                                    setPendingChoice(null); // Ensure pending choice is cleared if any
                                }}
                                className="sim-btn sim-btn-danger flex-1 py-3 text-sm"
                            >
                                {showEndingConfirm ? (language === 'ko' ? '지금 탈출하기' : 'Escape Now') : (language === 'ko' ? '탈출 준비 시작' : 'Start Evac')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Build trigger for Vercel deployment update
