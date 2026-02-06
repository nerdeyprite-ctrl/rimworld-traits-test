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

type SkillCheckGroup = 'combat' | 'social' | 'medical' | 'survival' | 'craft';

type SkillCheck = {
    label: string;
    group: SkillCheckGroup;
    successDelta: { hp: number; food: number; meds: number; money: number };
    failDelta: { hp: number; food: number; meds: number; money: number };
    successText?: string;
    failText?: string;
};

type ChoiceRequirements = {
    food?: number;
    meds?: number;
    money?: number;
};

type SimChoice = {
    id: string;
    label: string;
    description?: string;
    delta: { hp: number; food: number; meds: number; money: number };
    response?: string;
    skillCheck?: SkillCheck;
    requirements?: ChoiceRequirements;
};

type SimEventCategory = 'quiet' | 'noncombat' | 'danger';

type SimEvent = {
    id: string;
    title: string;
    description: string;
    category: SimEventCategory;
    weight: number;
    base: { hp: number; food: number; meds: number; money: number };
    traitMods?: {
        hp?: TraitMod;
        food?: TraitMod;
        meds?: TraitMod;
        money?: TraitMod;
    };
    skillGroup?: 'combat' | 'noncombat';
    skillTargets?: Array<'hp' | 'food' | 'meds' | 'money'>;
    choices?: SimChoice[];
};

type SimLogEntry = {
    day: number;
    season: string;
    title: string;
    description: string;
    response: string;
    delta: { hp: number; food: number; meds: number; money: number };
    after: { hp: number; food: number; meds: number; money: number };
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
};

const MAX_DAYS = 60;
const START_STATS = { hp: 5, food: 5, meds: 5, money: 5 };
const AUTO_INTERVAL_MS = 1500;
const CAMP_UPGRADE_COSTS = [3, 5];

const COMBAT_SKILLS = ['Shooting', 'Melee'] as const;
const NONCOMBAT_SKILLS = ['Plants', 'Cooking', 'Construction', 'Mining', 'Crafting', 'Social', 'Animals'] as const;

const SKILL_GROUPS: Record<SkillCheckGroup, string[]> = {
    combat: ['Shooting', 'Melee'],
    social: ['Social'],
    medical: ['Medicine'],
    survival: ['Plants', 'Animals'],
    craft: ['Construction', 'Crafting', 'Mining']
};

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

const getHealAmount = (medicineLevel: number) => {
    if (medicineLevel <= 3) return 1;
    if (medicineLevel <= 6) return 2;
    if (medicineLevel <= 10) return 3;
    return 4;
};

const getSkillChance = (avg: number) => {
    if (avg <= 3) return 30;
    if (avg <= 6) return 60;
    if (avg <= 10) return 80;
    return 95;
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
            response: isKo ? '식량을 대량으로 구매했다.' : 'You buy a large food supply.'
        });
        choices.push({
            id: 'buy_meds_large',
            label: isKo ? '치료제 대량 구매' : 'Buy Meds (Large)',
            description: isKo ? '돈 2 → 치료제 3' : 'Money 2 → Meds 3',
            delta: { hp: 0, food: 0, meds: 3, money: -2 },
            response: isKo ? '치료제를 대량으로 구매했다.' : 'You buy a large med supply.'
        });
    }
    if (money >= 1) {
        choices.push({
            id: 'buy_food_small',
            label: isKo ? '식량 소량 구매' : 'Buy Food (Small)',
            description: isKo ? '돈 1 → 식량 2' : 'Money 1 → Food 2',
            delta: { hp: 0, food: 2, meds: 0, money: -1 },
            response: isKo ? '식량을 소량 구매했다.' : 'You buy a small food supply.'
        });
        choices.push({
            id: 'buy_meds_small',
            label: isKo ? '치료제 소량 구매' : 'Buy Meds (Small)',
            description: isKo ? '돈 1 → 치료제 2' : 'Money 1 → Meds 2',
            delta: { hp: 0, food: 0, meds: 2, money: -1 },
            response: isKo ? '치료제를 소량 구매했다.' : 'You buy a small med supply.'
        });
    }

    if (food >= 2) {
        choices.push({
            id: 'sell_food',
            label: isKo ? '식량 판매' : 'Sell Food',
            description: isKo ? '식량 2 → 돈 1' : 'Food 2 → Money 1',
            delta: { hp: 0, food: -2, meds: 0, money: 1 },
            response: isKo ? '식량을 팔아 돈을 확보했다.' : 'You sell food for money.'
        });
    }
    if (meds >= 1) {
        choices.push({
            id: 'sell_meds',
            label: isKo ? '치료제 판매' : 'Sell Meds',
            description: isKo ? '치료제 1 → 돈 1' : 'Meds 1 → Money 1',
            delta: { hp: 0, food: 0, meds: -1, money: 1 },
            response: isKo ? '치료제를 팔아 돈을 확보했다.' : 'You sell meds for money.'
        });
    }

    choices.push({
        id: 'skip',
        label: isKo ? '거래하지 않음' : 'Skip',
        description: isKo ? '거래를 포기한다.' : 'You skip the deal.',
        delta: { hp: 0, food: 0, meds: 0, money: 0 },
        response: isKo ? '거래를 포기하고 넘어갔다.' : 'You pass on the offer.'
    });

    return {
        id: 'supply_trader',
        title: isKo ? '물자 상인 등장' : 'Supply Trader',
        description: isKo ? '식량과 치료제를 구매할 수 있다.' : 'A trader offers food and meds.',
        category: 'noncombat',
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
            description: isKo ? '큰 사건 없이 하루가 지나갔다.' : 'The day passes without major incidents.',
            category: 'quiet',
            weight: 40,
            base: { hp: 0, food: 0, meds: 0, money: 0 }
        },
        {
            id: 'trade',
            title: isKo ? '상인 방문' : 'Trader Caravan',
            description: isKo ? '상인들이 들러 교역을 제안했다.' : 'A trader caravan offers a deal.',
            category: 'noncombat',
            weight: 6,
            base: { hp: 0, food: 1, meds: 0, money: 1 },
            skillGroup: 'noncombat',
            skillTargets: ['money'],
            traitMods: {
                money: {
                    pos: ['kind', 'beautiful', 'pretty'],
                    neg: ['abrasive', 'ugly', 'staggeringly_ugly'],
                    goodText: isKo ? '호의적인 태도로 더 좋은 거래를 얻었다.' : 'Friendly manners improve the deal.',
                    badText: isKo ? '거친 태도로 손해를 봤다.' : 'Abrasive manners worsen the deal.'
                }
            },
            choices: [
                {
                    id: 'buy_food',
                    label: isKo ? '식량 구매' : 'Buy Food',
                    description: isKo ? '돈 1 → 식량 2' : 'Money 1 → Food 2',
                    delta: { hp: 0, food: 2, meds: 0, money: -1 },
                    response: isKo ? '식량을 구매했다.' : 'You buy food.',
                    requirements: { money: 1 }
                },
                {
                    id: 'buy_meds',
                    label: isKo ? '치료제 구매' : 'Buy Meds',
                    description: isKo ? '돈 1 → 치료제 2' : 'Money 1 → Meds 2',
                    delta: { hp: 0, food: 0, meds: 2, money: -1 },
                    response: isKo ? '치료제를 구매했다.' : 'You buy meds.',
                    requirements: { money: 1 }
                },
                {
                    id: 'negotiate',
                    label: isKo ? '협상' : 'Negotiate',
                    description: isKo ? '사교로 좋은 거래를 노린다.' : 'Use social skills for a better deal.',
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    response: isKo ? '협상을 시도했다.' : 'You attempt to negotiate.',
                    skillCheck: {
                        label: isKo ? '협상' : 'Negotiation',
                        group: 'social',
                        successDelta: { hp: 0, food: 1, meds: 1, money: 2 },
                        failDelta: { hp: 0, food: 0, meds: 0, money: -1 },
                        successText: isKo ? '협상에 성공해 더 좋은 거래를 얻었다.' : 'You negotiate a better deal.',
                        failText: isKo ? '협상에 실패해 손해를 봤다.' : 'Negotiations fail and you lose out.'
                    }
                }
            ]
        },
        {
            id: 'cargo_pods',
            title: isKo ? '보급 캡슐 추락' : 'Cargo Pods',
            description: isKo ? '하늘에서 보급 캡슐이 떨어졌다.' : 'Cargo pods crash nearby.',
            category: 'noncombat',
            weight: 6,
            base: { hp: 0, food: 1, meds: 1, money: 1 },
            skillGroup: 'noncombat',
            skillTargets: ['food', 'meds', 'money']
        },
        {
            id: 'foraging',
            title: isKo ? '채집 성공' : 'Foraging',
            description: isKo ? '근처에서 먹을거리를 찾아냈다.' : 'You forage for supplies nearby.',
            category: 'noncombat',
            weight: 4,
            base: { hp: 0, food: 2, meds: 0, money: 0 },
            skillGroup: 'noncombat',
            skillTargets: ['food']
        },
        {
            id: 'medical_cache',
            title: isKo ? '의료 상자 발견' : 'Medical Cache',
            description: isKo ? '버려진 의료 상자를 발견했다.' : 'You discover a medical cache.',
            category: 'noncombat',
            weight: 4,
            base: { hp: 0, food: 0, meds: 2, money: 0 },
            skillGroup: 'noncombat',
            skillTargets: ['meds']
        },
        {
            id: 'crop_boom',
            title: isKo ? '풍작' : 'Crop Boom',
            description: isKo ? '작물이 급성장해 풍작이 들었다.' : 'Crops surge with unexpected growth.',
            category: 'noncombat',
            weight: 6,
            base: { hp: 0, food: 3, meds: 0, money: 0 },
            skillGroup: 'noncombat',
            skillTargets: ['food'],
            traitMods: {
                food: {
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
            weight: 5,
            base: { hp: 0, food: 0, meds: 0, money: 2 },
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
            title: isKo ? '병충해' : 'Blight',
            description: isKo ? '작물이 병충해로 시들었다.' : 'A blight hits the crops.',
            category: 'noncombat',
            weight: 5,
            base: { hp: 0, food: -2, meds: 0, money: 0 },
            skillGroup: 'noncombat',
            skillTargets: ['food'],
            traitMods: {
                food: {
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
            weight: 4,
            base: { hp: 0, food: -1, meds: 0, money: 1 },
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
            weight: 6,
            base: { hp: -2, food: -1, meds: 0, money: -1 },
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
                    id: 'raid_assault',
                    label: isKo ? '정면전' : 'Full Assault',
                    description: isKo ? '위험하지만 전리품을 노린다.' : 'Risky but high reward.',
                    delta: { hp: -1, food: 0, meds: 0, money: 1 },
                    response: isKo ? '정면 돌격을 선택했다.' : 'You charge head-on.',
                    skillCheck: {
                        label: isKo ? '전투' : 'Combat',
                        group: 'combat',
                        successDelta: { hp: 1, food: 0, meds: 0, money: 2 },
                        failDelta: { hp: -2, food: 0, meds: 0, money: -1 },
                        successText: isKo ? '공격이 성공해 전리품을 챙겼다.' : 'You win and secure loot.',
                        failText: isKo ? '공격이 실패해 피해가 커졌다.' : 'The assault fails and you suffer.'
                    }
                },
                {
                    id: 'raid_defend',
                    label: isKo ? '방어전' : 'Hold Position',
                    description: isKo ? '피해를 줄이지만 돈이 든다.' : 'Reduce damage at a cost.',
                    delta: { hp: 1, food: 0, meds: 0, money: -1 },
                    response: isKo ? '방어선을 구축했다.' : 'You fortify your position.',
                    skillCheck: {
                        label: isKo ? '방어' : 'Defense',
                        group: 'combat',
                        successDelta: { hp: 1, food: 0, meds: 0, money: 0 },
                        failDelta: { hp: -1, food: 0, meds: 0, money: 0 },
                        successText: isKo ? '방어가 성공해 피해를 줄였다.' : 'Defense succeeds and damage is reduced.',
                        failText: isKo ? '방어가 무너졌다.' : 'The defense crumbles.'
                    }
                },
                {
                    id: 'raid_retreat',
                    label: isKo ? '후퇴' : 'Retreat',
                    description: isKo ? '피해를 피하지만 물자를 잃는다.' : 'Avoid damage but lose supplies.',
                    delta: { hp: 0, food: -1, meds: 0, money: -2 },
                    response: isKo ? '후퇴하며 물자를 포기했다.' : 'You retreat and abandon supplies.',
                    skillCheck: {
                        label: isKo ? '회피' : 'Escape',
                        group: 'survival',
                        successDelta: { hp: 1, food: 0, meds: 0, money: 0 },
                        failDelta: { hp: -1, food: 0, meds: 0, money: -1 },
                        successText: isKo ? '무사히 후퇴했다.' : 'You retreat safely.',
                        failText: isKo ? '후퇴 중 피해를 입었다.' : 'Retreat goes badly.'
                    }
                }
            ]
        },
        {
            id: 'manhunter',
            title: isKo ? '광포한 동물 무리' : 'Manhunter Pack',
            description: isKo ? '광포해진 동물들이 덮쳐왔다.' : 'A pack of enraged animals attacks.',
            category: 'danger',
            weight: 5,
            base: { hp: -2, food: 1, meds: 0, money: 0 },
            traitMods: {
                hp: {
                    pos: ['tough', 'nimble', 'brawler'],
                    neg: ['wimp', 'delicate'],
                    goodText: isKo ? '몸이 단단해 피해가 줄었다.' : 'Toughness reduces the harm.',
                    badText: isKo ? '연약해 큰 피해를 입었다.' : 'Fragility makes it worse.'
                }
            },
            choices: [
                {
                    id: 'hunt',
                    label: isKo ? '사냥' : 'Hunt',
                    description: isKo ? '위험하지만 더 많은 식량을 얻는다.' : 'Risk more for extra food.',
                    delta: { hp: -1, food: 2, meds: 0, money: 0 },
                    response: isKo ? '사냥으로 더 많은 식량을 확보했다.' : 'You secure extra food by hunting.',
                    skillCheck: {
                        label: isKo ? '사냥' : 'Hunting',
                        group: 'survival',
                        successDelta: { hp: 1, food: 2, meds: 0, money: 0 },
                        failDelta: { hp: -1, food: 0, meds: 0, money: 0 },
                        successText: isKo ? '사냥이 대성공했다.' : 'The hunt is a success.',
                        failText: isKo ? '사냥이 실패했다.' : 'The hunt fails.'
                    }
                },
                {
                    id: 'defend',
                    label: isKo ? '방어' : 'Defend',
                    description: isKo ? '안전하게 방어한다.' : 'Play it safe.',
                    delta: { hp: 1, food: 0, meds: 0, money: 0 },
                    response: isKo ? '방어를 택해 피해를 줄였다.' : 'You defend to reduce damage.',
                    skillCheck: {
                        label: isKo ? '방어' : 'Defense',
                        group: 'combat',
                        successDelta: { hp: 1, food: 0, meds: 0, money: 0 },
                        failDelta: { hp: -1, food: 0, meds: 0, money: 0 },
                        successText: isKo ? '방어가 성공했다.' : 'Defense succeeds.',
                        failText: isKo ? '방어가 무너졌다.' : 'Defense fails.'
                    }
                },
                {
                    id: 'avoid',
                    label: isKo ? '회피' : 'Avoid',
                    description: isKo ? '피해를 피하지만 수확이 없다.' : 'Avoid damage but gain nothing.',
                    delta: { hp: 1, food: -1, meds: 0, money: 0 },
                    response: isKo ? '회피에 성공했지만 수확이 줄었다.' : 'You avoid danger but lose the harvest.',
                    skillCheck: {
                        label: isKo ? '회피' : 'Evasion',
                        group: 'survival',
                        successDelta: { hp: 1, food: 0, meds: 0, money: 0 },
                        failDelta: { hp: -1, food: 0, meds: 0, money: 0 },
                        successText: isKo ? '안전하게 회피했다.' : 'You evade safely.',
                        failText: isKo ? '회피에 실패했다.' : 'Evasion fails.'
                    }
                }
            ]
        },
        {
            id: 'disease',
            title: isKo ? '질병 발생' : 'Disease Outbreak',
            description: isKo ? '질병이 퍼져 몸이 약해졌다.' : 'A disease spreads through the camp.',
            category: 'danger',
            weight: 3,
            base: { hp: -2, food: 0, meds: -1, money: 0 },
            traitMods: {
                hp: {
                    pos: ['tough', 'iron_willed'],
                    neg: ['sickly', 'delicate', 'wimp'],
                    goodText: isKo ? '강한 체력이 버텨냈다.' : 'Sturdy constitution resists.',
                    badText: isKo ? '몸이 약해 큰 피해를 입었다.' : 'Fragility makes it worse.'
                }
            },
            choices: [
                {
                    id: 'treat',
                    label: isKo ? '치료' : 'Treat',
                    description: isKo ? '치료제로 즉시 대응한다.' : 'Use meds immediately.',
                    delta: { hp: 1, food: 0, meds: -1, money: 0 },
                    response: isKo ? '치료에 나섰다.' : 'You begin treatment.',
                    skillCheck: {
                        label: isKo ? '치료' : 'Treatment',
                        group: 'medical',
                        successDelta: { hp: 2, food: 0, meds: 0, money: 0 },
                        failDelta: { hp: -1, food: 0, meds: 0, money: 0 },
                        successText: isKo ? '치료가 성공해 컨디션이 회복됐다.' : 'Treatment succeeds and you recover.',
                        failText: isKo ? '치료가 잘되지 않았다.' : 'Treatment fails to stabilize.'
                    }
                }
            ]
        },
        {
            id: 'cold_snap',
            title: isKo ? '한파' : 'Cold Snap',
            description: isKo ? '갑작스러운 한파가 찾아왔다.' : 'A sudden cold snap hits.',
            category: 'danger',
            weight: 3,
            base: { hp: -1, food: -1, meds: 0, money: 0 },
            skillGroup: 'noncombat',
            skillTargets: ['food'],
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
            weight: 2,
            base: { hp: -1, food: 0, meds: 0, money: 0 },
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
            weight: 1,
            base: { hp: -1, food: 0, meds: 0, money: -2 },
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

const applyTraitChoices = (event: SimEvent, traitIds: Set<string>, language: string) => {
    const isKo = language === 'ko';
    const choices = event.choices ? [...event.choices] : [];

    if (event.id === 'raiders' && traitIds.has('tough')) {
        choices.push({
            id: 'tough_charge',
            label: isKo ? '돌격' : 'Charge',
            description: isKo ? '강인함을 믿고 돌파한다.' : 'Charge through with toughness.',
            delta: { hp: -1, food: 0, meds: 0, money: 1 },
            response: isKo ? '강인함을 믿고 돌격했다.' : 'You charge with confidence.',
            skillCheck: {
                label: isKo ? '돌격' : 'Charge',
                group: 'combat',
                successDelta: { hp: 2, food: 0, meds: 0, money: 2 },
                failDelta: { hp: -2, food: 0, meds: 0, money: -1 },
                successText: isKo ? '돌격이 성공했다.' : 'The charge succeeds.',
                failText: isKo ? '돌격이 실패했다.' : 'The charge fails.'
            }
        });
    }

    if (event.id === 'raiders' && traitIds.has('wimp')) {
        choices.push({
            id: 'wimp_hide',
            label: isKo ? '은신' : 'Hide',
            description: isKo ? '숨어서 피해를 줄인다.' : 'Hide to avoid damage.',
            delta: { hp: 1, food: 0, meds: 0, money: -1 },
            response: isKo ? '숨어서 상황을 피하려 했다.' : 'You try to hide from the raid.',
            skillCheck: {
                label: isKo ? '은신' : 'Stealth',
                group: 'survival',
                successDelta: { hp: 1, food: 0, meds: 0, money: 0 },
                failDelta: { hp: -1, food: 0, meds: 0, money: -1 },
                successText: isKo ? '은신에 성공했다.' : 'You remain hidden.',
                failText: isKo ? '은신에 실패했다.' : 'You are discovered.'
            }
        });
    }

    if (event.id === 'trade' && traitIds.has('kind')) {
        choices.push({
            id: 'kind_help',
            label: isKo ? '호의 베풀기' : 'Show Kindness',
            description: isKo ? '상인에게 호의를 보인다.' : 'Offer kindness to the trader.',
            delta: { hp: 0, food: 0, meds: 0, money: 0 },
            response: isKo ? '호의로 거래를 시도했다.' : 'You offer kindness in the deal.',
            skillCheck: {
                label: isKo ? '호의' : 'Kindness',
                group: 'social',
                successDelta: { hp: 0, food: 1, meds: 1, money: 1 },
                failDelta: { hp: 0, food: 0, meds: 0, money: -1 },
                successText: isKo ? '호의가 통했다.' : 'Kindness pays off.',
                failText: isKo ? '호의가 통하지 않았다.' : 'Kindness backfires.'
            }
        });
    }

    if (event.id === 'trade' && traitIds.has('abrasive')) {
        choices.push({
            id: 'abrasive_threat',
            label: isKo ? '협박' : 'Threaten',
            description: isKo ? '강경한 태도로 압박한다.' : 'Force a deal with threats.',
            delta: { hp: 0, food: 0, meds: 0, money: 0 },
            response: isKo ? '협박으로 거래를 시도했다.' : 'You attempt to threaten the trader.',
            skillCheck: {
                label: isKo ? '협박' : 'Intimidation',
                group: 'combat',
                successDelta: { hp: 0, food: 1, meds: 0, money: 2 },
                failDelta: { hp: -1, food: 0, meds: 0, money: -1 },
                successText: isKo ? '협박이 통했다.' : 'The threat works.',
                failText: isKo ? '협박이 실패했다.' : 'The threat backfires.'
            }
        });
    }

    if (event.id === 'fire' && traitIds.has('pyromaniac')) {
        choices.push({
            id: 'pyro_fuel',
            label: isKo ? '불길 확장' : 'Fuel the Fire',
            description: isKo ? '위험하지만 보상을 노린다.' : 'Risky but tempting.',
            delta: { hp: -1, food: 0, meds: 0, money: 1 },
            response: isKo ? '불길을 확장하려 했다.' : 'You feed the fire.',
            skillCheck: {
                label: isKo ? '방화' : 'Arson',
                group: 'craft',
                successDelta: { hp: 0, food: 0, meds: 0, money: 2 },
                failDelta: { hp: -2, food: 0, meds: 0, money: -1 },
                successText: isKo ? '위험한 보상을 얻었다.' : 'You gain a risky reward.',
                failText: isKo ? '불길을 통제하지 못했다.' : 'You lose control of the blaze.'
            }
        });
    }

    if (event.id === 'quiet_day' && traitIds.has('industrious')) {
        choices.push({
            id: 'work_overtime',
            label: isKo ? '야근' : 'Overtime',
            description: isKo ? '돈과 식량을 더 확보한다.' : 'Work for extra supplies.',
            delta: { hp: -1, food: 1, meds: 0, money: 2 },
            response: isKo ? '야근으로 추가 물자를 확보했다.' : 'You work overtime for extra supplies.',
            skillCheck: {
                label: isKo ? '노동' : 'Labor',
                group: 'craft',
                successDelta: { hp: 0, food: 1, meds: 0, money: 1 },
                failDelta: { hp: -1, food: 0, meds: 0, money: 0 },
                successText: isKo ? '노동이 잘 풀렸다.' : 'The extra work pays off.',
                failText: isKo ? '과로로 컨디션이 나빠졌다.' : 'Overwork backfires.'
            }
        });
    }

    if (event.id === 'quiet_day' && traitIds.has('lazy')) {
        choices.push({
            id: 'rest_day',
            label: isKo ? '휴식' : 'Rest',
            description: isKo ? '체력을 회복한다.' : 'Recover some stamina.',
            delta: { hp: 1, food: 0, meds: 0, money: 0 },
            response: isKo ? '휴식을 택해 체력을 회복했다.' : 'You rest and recover.',
            skillCheck: {
                label: isKo ? '휴식' : 'Rest',
                group: 'medical',
                successDelta: { hp: 1, food: 0, meds: 0, money: 0 },
                failDelta: { hp: 0, food: 0, meds: 0, money: 0 },
                successText: isKo ? '휴식이 잘 통했다.' : 'Rest helps.',
                failText: isKo ? '휴식 효과가 미미했다.' : 'Rest has little effect.'
            }
        });
    }

    if (choices.length === 0) return event;
    return { ...event, choices };
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
        food: number;
        meds: number;
        money: number;
        campLevel: number;
        log: SimLogEntry[];
    }>({
        status: 'idle',
        day: 0,
        hp: START_STATS.hp,
        food: START_STATS.food,
        meds: START_STATS.meds,
        money: START_STATS.money,
        campLevel: 0,
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
            if (bonus > 0) note = language === 'ko' ? '기술을 활용해 효율을 높였다.' : 'Your skills improve efficiency.';
            else if (bonus < 0) note = language === 'ko' ? '기술 부족으로 효율이 떨어졌다.' : 'Lack of skill reduces efficiency.';
            else note = language === 'ko' ? '무난하게 처리했다.' : 'You handled it adequately.';
        }
        return { bonus, note };
    }, [language, skillMap]);

    const getGroupAverage = useCallback((group: SkillCheckGroup) => {
        const pool = SKILL_GROUPS[group];
        const levels = pool.map(name => skillMap[name] ?? 0);
        return levels.reduce((sum, v) => sum + v, 0) / levels.length;
    }, [skillMap]);

    const rollSkillCheck = useCallback((check: SkillCheck) => {
        const avg = getGroupAverage(check.group);
        const chance = getSkillChance(avg);
        const roll = Math.random() * 100;
        return { success: roll < chance, chance };
    }, [getGroupAverage]);

    const startSimulation = useCallback(() => {
        const introText = language === 'ko'
            ? '당신의 캐릭터는 몇일차까지 살아남을 수 있을까요?'
            : 'How many days can your character survive?';
        setSimState({
            status: 'running',
            day: 0,
            hp: START_STATS.hp,
            food: START_STATS.food,
            meds: START_STATS.meds,
            money: START_STATS.money,
            campLevel: 0,
            log: [{
                day: 0,
                season: getSeasonLabel(0, language),
                title: language === 'ko' ? '시뮬레이션 시작' : 'Simulation Start',
                description: introText,
                response: language === 'ko' ? '생존 준비를 시작했다.' : 'You begin preparing for survival.',
                delta: { hp: 0, food: 0, meds: 0, money: 0 },
                after: { hp: START_STATS.hp, food: START_STATS.food, meds: START_STATS.meds, money: START_STATS.money },
                status: 'neutral'
            }]
        });
        setPendingChoice(null);
        autoResumeRef.current = false;
        setSimAuto(false);
    }, [language]);

    const buildResponseText = (baseNotes: string[], traitNotes: string[], skillNote: string, choiceResponse?: string, systemNote?: string) => {
        const parts = [] as string[];
        if (choiceResponse) parts.push(choiceResponse);
        if (systemNote) parts.push(systemNote);
        if (skillNote) parts.push(skillNote);
        if (traitNotes.length > 0) parts.push(...traitNotes);
        if (baseNotes.length > 0) parts.push(...baseNotes);
        return parts.filter(Boolean).join(' ') || (language === 'ko' ? '무난하게 하루를 버텼다.' : 'You made it through the day.');
    };

    const resolveEvent = (
        event: SimEvent,
        dayStart: { hp: number; food: number; meds: number; money: number },
        baseAfter: { hp: number; food: number; meds: number; money: number },
        baseNotes: string[],
        campLevel: number,
        choice?: SimChoice
    ) => {
        let hp = baseAfter.hp;
        let food = baseAfter.food;
        let meds = baseAfter.meds;
        let money = baseAfter.money;

        const baseDelta = choice?.delta || { hp: 0, food: 0, meds: 0, money: 0 };
        let hpDelta = event.base.hp + baseDelta.hp;
        let foodDelta = event.base.food + baseDelta.food;
        let medsDelta = event.base.meds + baseDelta.meds;
        let moneyDelta = event.base.money + baseDelta.money;
        const traitNotes: string[] = [];
        let systemNote = '';
        let choiceResponse = choice?.response;

        if (choice?.skillCheck) {
            const { success, chance } = rollSkillCheck(choice.skillCheck);
            const resultDelta = success ? choice.skillCheck.successDelta : choice.skillCheck.failDelta;
            hpDelta += resultDelta.hp;
            foodDelta += resultDelta.food;
            medsDelta += resultDelta.meds;
            moneyDelta += resultDelta.money;
            systemNote = language === 'ko'
                ? `시스템: ${choice.skillCheck.label} ${success ? '성공' : '실패'} (확률 ${chance}%)`
                : `System: ${choice.skillCheck.label} ${success ? 'Success' : 'Fail'} (${chance}%)`;
            if (success && choice.skillCheck.successText) choiceResponse = choice.skillCheck.successText;
            if (!success && choice.skillCheck.failText) choiceResponse = choice.skillCheck.failText;
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

        if (event.category === 'danger' && campLevel > 0 && hpDelta < 0) {
            const mitigated = Math.min(campLevel, Math.abs(hpDelta));
            hpDelta += mitigated;
            if (mitigated > 0) {
                traitNotes.push(language === 'ko' ? '캠프 방벽이 피해를 줄였다.' : 'Camp defenses reduce the damage.');
            }
        }

        hp += hpDelta;
        food += foodDelta;
        meds += medsDelta;
        money += moneyDelta;

        hp = clampStat(hp);
        food = clampStat(food);
        meds = clampStat(meds);
        money = clampStat(money);

        const delta = {
            hp: hp - dayStart.hp,
            food: food - dayStart.food,
            meds: meds - dayStart.meds,
            money: money - dayStart.money
        };

        const responseText = buildResponseText(baseNotes, traitNotes, skillNote, choiceResponse, systemNote);

        return {
            after: { hp, food, meds, money },
            delta,
            responseText,
            status: hp <= 0 ? 'dead' : 'running'
        };
    };

    const meetsRequirements = (choice: SimChoice, state: { food: number; meds: number; money: number }) => {
        if (!choice.requirements) return true;
        if (choice.requirements.food && state.food < choice.requirements.food) return false;
        if (choice.requirements.meds && state.meds < choice.requirements.meds) return false;
        if (choice.requirements.money && state.money < choice.requirements.money) return false;
        return true;
    };

    const advanceDay = useCallback(() => {
        if (simState.status !== 'running' || pendingChoice) return;

        const dayStart = { hp: simState.hp, food: simState.food, meds: simState.meds, money: simState.money };
        const nextDay = simState.day + 1;
        const season = getSeasonLabel(nextDay, language);

        let hp = simState.hp;
        let food = simState.food;
        let meds = simState.meds;
        let money = simState.money;
        const responseNotes: string[] = [];

        if (hp <= 0) {
            return;
        }

        let event: SimEvent;
        if (food === 0 && money > 0 && Math.random() < 0.4) {
            event = buildSupplyEvent(language, money, food, meds);
        } else {
            event = pickWeightedEvent(events);
        }

        event = applyTraitChoices(event, traitIds, language);
        if (event.choices && event.choices.length > 0) {
            const available = event.choices.filter(choice => meetsRequirements(choice, { food, meds, money }));
            if (available.length === 0) {
                event = { ...event, choices: undefined };
            } else {
                event = { ...event, choices: available };
            }
        }

        if (event.choices && event.choices.length > 0) {
            autoResumeRef.current = simAuto;
            setSimAuto(false);
            setPendingChoice({
                day: nextDay,
                season,
                event,
                dayStart,
                baseAfter: { hp, food, meds, money },
                responseNotes
            });
            setSimState(prev => ({
                ...prev,
                day: nextDay,
                hp,
                food,
                meds,
                money
            }));
            return;
        }

        const resolved = resolveEvent(event, dayStart, { hp, food, meds, money }, responseNotes, simState.campLevel);
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
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    after: resolved.after,
                    status: 'good'
                });
            }

            return {
                ...prev,
                day: nextDay,
                hp: resolved.after.hp,
                food: resolved.after.food,
                meds: resolved.after.meds,
                money: resolved.after.money,
                status,
                log
            };
        });
    }, [simState, pendingChoice, simAuto, language, events, traitIds, getTraitScore, getSkillBonus]);

    const resolveChoice = (choiceId: string) => {
        if (!pendingChoice) return;
        const choice = pendingChoice.event.choices?.find(c => c.id === choiceId);
        if (!choice) return;

        const resolved = resolveEvent(
            pendingChoice.event,
            pendingChoice.dayStart,
            pendingChoice.baseAfter,
            pendingChoice.responseNotes,
            simState.campLevel,
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
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    after: resolved.after,
                    status: 'good'
                });
            }

            return {
                ...prev,
                hp: resolved.after.hp,
                food: resolved.after.food,
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

    const handleUseMeds = () => {
        if (pendingChoice) return;
        const medicineLevel = skillMap['Medicine'] ?? 0;
        const healAmount = getHealAmount(medicineLevel);
        setSimState(prev => {
            if (prev.meds <= 0 || prev.hp >= 10) return prev;
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

    const handleUpgradeCamp = () => {
        setSimState(prev => {
            const cost = CAMP_UPGRADE_COSTS[prev.campLevel];
            if (cost === undefined || prev.money < cost) return prev;
            const money = prev.money - cost;
            const campLevel = prev.campLevel + 1;
            const entry: SimLogEntry = {
                day: prev.day,
                season: getSeasonLabel(prev.day, language),
                title: language === 'ko' ? '캠프 업그레이드' : 'Camp Upgrade',
                description: language === 'ko' ? `캠프 방벽을 Lv.${campLevel}로 강화했다.` : `Camp defenses upgraded to Lv.${campLevel}.`,
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

    const medicineLevel = skillMap['Medicine'] ?? 0;
    const healAmount = getHealAmount(medicineLevel);
    const canUseMeds = simState.meds > 0 && simState.hp < 10 && !pendingChoice;
    const nextCampCost = CAMP_UPGRADE_COSTS[simState.campLevel];
    const canUpgradeCamp = nextCampCost !== undefined && simState.money >= nextCampCost;

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

                <div className="grid grid-cols-1 md:grid-cols-6 gap-3 text-xs">
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
                    <button
                        onClick={handleUseMeds}
                        disabled={!canUseMeds}
                        className={`px-4 py-2 text-sm font-bold border ${canUseMeds
                            ? 'bg-[#2d6a4f] hover:bg-[#40916c] text-white border-[#1b4332]'
                            : 'bg-[#333] text-gray-500 border-gray-700 cursor-not-allowed'}`}
                    >
                        {language === 'ko' ? `치료제 사용 (HP +${healAmount})` : `Use Meds (+${healAmount} HP)`}
                    </button>
                    <button
                        onClick={handleUpgradeCamp}
                        disabled={!canUpgradeCamp}
                        className={`px-4 py-2 text-sm font-bold border ${canUpgradeCamp
                            ? 'bg-[#3f2a56] hover:bg-[#5a3d7a] text-white border-[#2b1d3f]'
                            : 'bg-[#333] text-gray-500 border-gray-700 cursor-not-allowed'}`}
                    >
                        {language === 'ko'
                            ? `캠프 강화 Lv.${simState.campLevel}${nextCampCost !== undefined ? ` (돈 ${nextCampCost})` : ''}`
                            : `Camp Upgrade Lv.${simState.campLevel}${nextCampCost !== undefined ? ` (Money ${nextCampCost})` : ''}`}
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
                            {pendingChoice.event.choices?.map(choice => {
                                let chanceText = '';
                                if (choice.skillCheck) {
                                    const avg = getGroupAverage(choice.skillCheck.group);
                                    const chance = getSkillChance(avg);
                                    chanceText = language === 'ko'
                                        ? `성공 확률 ${chance}%`
                                        : `Success ${chance}%`;
                                }
                                return (
                                    <button
                                        key={choice.id}
                                        onClick={() => resolveChoice(choice.id)}
                                        className="px-4 py-3 bg-[#1c3d5a] hover:bg-[#2c5282] text-white text-sm border border-blue-900"
                                    >
                                        <div className="font-bold">{choice.label}</div>
                                        {choice.description && (
                                            <div className="text-xs text-white/70 mt-1">{choice.description}</div>
                                        )}
                                        {chanceText && (
                                            <div className="text-xs text-[#9f752a] mt-1">{chanceText}</div>
                                        )}
                                    </button>
                                );
                            })}
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
                                {language === 'ko' ? '결과' : 'Result'}: HP {entry.after.hp}({entry.delta.hp >= 0 ? `+${entry.delta.hp}` : entry.delta.hp}) / {language === 'ko' ? '식량' : 'Food'} {entry.after.food}({entry.delta.food >= 0 ? `+${entry.delta.food}` : entry.delta.food}) / {language === 'ko' ? '치료제' : 'Meds'} {entry.after.meds}({entry.delta.meds >= 0 ? `+${entry.delta.meds}` : entry.delta.meds}) / {language === 'ko' ? '돈' : 'Money'} {entry.after.money}({entry.delta.money >= 0 ? `+${entry.delta.money}` : entry.delta.money})
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
