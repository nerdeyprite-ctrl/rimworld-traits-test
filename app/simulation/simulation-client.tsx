"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTest } from '../../context/TestContext';
import { useLanguage } from '../../context/LanguageContext';
import { TestResult } from '../../types/rimworld';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

type SimDelta = { hp: number; food: number; meds: number; money: number };

type TraitMod = {
    pos: string[];
    neg: string[];
    goodText?: string;
    badText?: string;
};

type SkillCheckGroup = 'combat' | 'social' | 'medical' | 'survival' | 'craft';

type SkillCheck = {
    label: string;
    group: string[]; // Changed to string[]
    fixedChance?: number;
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

type SimChoice = {
    id: string;
    label: string;
    description?: string;
    delta: SimDelta;
    response?: string;
    skillCheck?: SkillCheck;
    requirements?: ChoiceRequirements;
    isSpecial?: boolean;
    specialReason?: string;
};

type SimEventCategory = 'quiet' | 'noncombat' | 'danger';

type SimEvent = {
    id: string;
    title: string;
    description: string;
    category: SimEventCategory;
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
};

type SimLogEntry = {
    day: number;
    season: string;
    title: string;
    description: string;
    response: string;
    delta: SimDelta;
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
};

type ExitType = 'death' | 'escape' | 'stay';

type CurrentCard = {
    day: number;
    season: string;
    event: SimEvent;
    entry?: SimLogEntry;
};

const MAX_DAYS = 60;
const START_STATS = { hp: 5, food: 5, meds: 5, money: 5 };
const CAMP_UPGRADE_COSTS = [3, 5];
const SHIP_BUILD_DAY = 60;

const SPECIAL_EVENT_IDS = ['raiders', 'trade', 'ship_built', 'manhunter', 'disease', 'wanderer'];

const COMBAT_SKILLS = ['Shooting', 'Melee'] as const;
const NONCOMBAT_SKILLS = ['Plants', 'Cooking', 'Construction', 'Mining', 'Crafting', 'Social', 'Animals'] as const;

const SKILL_GROUPS: Record<string, string[]> = {
    '전투': ['Shooting', 'Melee'],
    '사교': ['Social'],
    '의학': ['Medicine'],
    '재배': ['Plants'],
    '제작': ['Construction', 'Crafting', 'Mining'],
    '생존': ['Plants', 'Animals'],
    '격투': ['Melee'],
    '사격': ['Shooting']
};

const MOVEMENT_TRAITS = new Set(['fast_walker', 'jogger', 'nimble']);

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

const getEventIcon = (event?: SimEvent) => {
    if (!event) return '🎴';
    switch (event.id) {
        case 'raiders':
            return '⚔️';
        case 'manhunter':
            return '🦁';
        case 'disease':
            return '🩺';
        case 'cold_snap':
            return '❄️';
        case 'heat_wave':
            return '🔥';
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
            return event.category === 'danger' ? '⚠️' : event.category === 'noncombat' ? '🧭' : '🌤️';
    }
};

const getHealAmount = (medicineLevel: number) => {
    if (medicineLevel <= 3) return 1;
    if (medicineLevel <= 6) return 2;
    if (medicineLevel <= 10) return 3;
    return 4;
};

const getSkillChance = (level: number) => {
    if (level <= 3) return 30;
    if (level <= 6) return 60;
    if (level <= 10) return 80;
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
            response: isKo ? '식량을 대량으로 구매했습니다.' : 'You buy a large food supply.'
        });
        choices.push({
            id: 'buy_meds_large',
            label: isKo ? '치료제 대량 구매' : 'Buy Meds (Large)',
            description: isKo ? '돈 2 → 치료제 3' : 'Money 2 → Meds 3',
            delta: { hp: 0, food: 0, meds: 3, money: -2 },
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
            description: isKo ? '돈 1 → 치료제 2' : 'Money 1 → Meds 2',
            delta: { hp: 0, food: 0, meds: 2, money: -1 },
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
            description: isKo ? '큰 사건 없이 하루가 지나갔습니다.' : 'The day passes without major incidents.',
            category: 'quiet',
            weight: 40,
            base: { hp: 0, food: 0, meds: 0, money: 0 },
            choices: [
                {
                    id: 'quiet_pass',
                    label: isKo ? '무난하게 보내기' : 'Pass',
                    description: isKo ? '변화 없음' : 'No changes',
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    response: isKo ? '무난하게 하루를 버텼습니다.' : 'You made it through the day.'
                }
            ]
        },
        {
            id: 'trade',
            title: isKo ? '상단 방문' : 'Trader Caravan',
            description: isKo ? '상인들이 들러 교역을 제안했습니다.' : 'A trader caravan offers a deal.',
            category: 'noncombat',
            weight: 6,
            base: { hp: 0, food: 0, meds: 0, money: 0 },
            choices: [
                {
                    id: 'buy_food',
                    label: isKo ? '식량 구매' : 'Buy Food',
                    description: isKo ? '돈 -1 → 식량 +2' : 'Money -1 → Food +2',
                    delta: { hp: 0, food: 2, meds: 0, money: -1 },
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
                    response: isKo ? '협상을 시도했습니다.' : 'You attempt to negotiate.',
                    skillCheck: {
                        label: isKo ? '협상' : 'Negotiation',
                        group: ['사교'],
                        successDelta: { hp: 0, food: 1, meds: 1, money: 3 },
                        failDelta: { hp: 0, food: 0, meds: 0, money: -1 }
                    }
                }
            ]
        },
        {
            id: 'cargo_pods',
            title: isKo ? '보급 캡슐 추락' : 'Cargo Pods',
            description: isKo ? '하늘에서 보급 캡슐이 떨어졌습니다.' : 'Cargo pods crash nearby.',
            category: 'noncombat',
            weight: 6,
            base: { hp: 0, food: 0, meds: 0, money: 0 },
            choices: [
                {
                    id: 'cargo_collect',
                    label: isKo ? '물자 챙기기' : 'Collect',
                    description: isKo ? '식량 +1, 치료제 +1, 돈 +1' : 'Food +1, Meds +1, Money +1',
                    delta: { hp: 0, food: 1, meds: 1, money: 1 },
                    response: isKo ? '추락한 캡슐에서 유용한 물자들을 챙겼습니다.' : 'You collect useful supplies.'
                }
            ]
        },
        {
            id: 'crop_boom',
            title: isKo ? '풍작' : 'Crop Boom',
            description: isKo ? '작물이 급성장해 풍작이 들었습니다.' : 'Crops surge with unexpected growth.',
            category: 'noncombat',
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
                        successDelta: { hp: 0, food: 4, meds: 0, money: 0 },
                        failDelta: { hp: 0, food: 2, meds: 0, money: 0 }
                    }
                }
            ]
        },
        {
            id: 'blight',
            title: isKo ? '병충해' : 'Blight',
            description: isKo ? '작물이 병충해로 시들고 있습니다.' : 'A blight hits the crops.',
            category: 'noncombat',
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
                }
            ]
        },
        {
            id: 'ship_chunk',
            title: isKo ? '우주선 잔해' : 'Ship Chunk',
            description: isKo ? '우주선 잔해가 추락했습니다.' : 'A ship chunk crashes nearby.',
            category: 'noncombat',
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
                        successDelta: { hp: 0, food: 0, meds: 0, money: 3 },
                        failDelta: { hp: 0, food: 0, meds: 0, money: 1 }
                    }
                }
            ]
        },
        {
            id: 'wanderer',
            title: isKo ? '방랑자 합류' : 'Wanderer Joins',
            description: isKo ? '방랑자가 합류를 요청했습니다.' : 'A wanderer asks to join.',
            category: 'noncombat',
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
            weight: 4,
            base: { hp: 0, food: 0, meds: 0, money: 0 },
            choices: [
                {
                    id: 'forage_collect',
                    label: isKo ? '채집하기' : 'Forage',
                    description: isKo ? '식량 +2' : 'Food +2',
                    delta: { hp: 0, food: 2, meds: 0, money: 0 },
                    response: isKo ? '신선한 야생 딸기를 채집했습니다.' : 'You forage fresh berries.'
                }
            ]
        },
        {
            id: 'medical_cache',
            title: isKo ? '의료 상자 발견' : 'Medical Cache',
            description: isKo ? '버려진 의료 상자를 발견했습니다.' : 'You discover a medical cache.',
            category: 'noncombat',
            weight: 4,
            base: { hp: 0, food: 0, meds: 0, money: 0 },
            choices: [
                {
                    id: 'med_cache_collect',
                    label: isKo ? '의료품 챙기기' : 'Collect',
                    description: isKo ? '치료제 +2' : 'Meds +2',
                    delta: { hp: 0, food: 0, meds: 2, money: 0 },
                    response: isKo ? '상자 안에서 깨끗한 치료제들을 발견했습니다.' : 'You collect clean medical supplies.'
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
                        successDelta: { hp: -3, food: -1, meds: 0, money: 2 },
                        failDelta: { hp: -6, food: -1, meds: -1, money: -1 }
                    }
                },
                {
                    id: 'raid_defend',
                    label: isKo ? '방어전' : 'Hold Position',
                    description: isKo ? '체력 -2, 식량 -1, 돈 -2' : 'HP -2, Food -1, Money -2',
                    delta: { hp: -2, food: -1, meds: 0, money: -2 },
                    response: isKo ? '방어선을 구축해 피해를 줄였습니다.' : 'You fortify and take controlled damage.'
                },
                {
                    id: 'raid_retreat',
                    label: isKo ? '후퇴' : 'Retreat',
                    description: isKo ? '생존 기술 체크' : 'Survival skill check',
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    response: isKo ? '후퇴하며 물자를 포기했습니다.' : 'You retreat and abandon supplies.',
                    skillCheck: {
                        label: isKo ? '후퇴' : 'Retreat',
                        group: ['생존'],
                        fixedChance: 60,
                        successDelta: { hp: -2, food: -2, meds: 0, money: -3 },
                        failDelta: { hp: -4, food: -2, meds: 0, money: -4 }
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
                        successDelta: { hp: -3, food: 5, meds: 0, money: 0 },
                        failDelta: { hp: -5, food: 3, meds: 0, money: 0 }
                    }
                },
                {
                    id: 'defend',
                    label: isKo ? '방어' : 'Defend',
                    description: isKo ? '체력 -2, 식량 +1' : 'HP -2, Food +1',
                    delta: { hp: -2, food: 1, meds: 0, money: 0 },
                    response: isKo ? '방어를 택해 피해를 줄였습니다.' : 'You defend to reduce damage.'
                },
                {
                    id: 'avoid',
                    label: isKo ? '회피' : 'Avoid',
                    description: isKo ? '생존 기술 체크' : 'Survival skill check',
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    response: isKo ? '안전한 곳으로 몸을 피해 위험을 흘려보냈습니다.' : 'You avoid danger but lose the harvest.',
                    skillCheck: {
                        label: isKo ? '회피' : 'Evasion',
                        group: ['생존'],
                        fixedChance: 60,
                        successDelta: { hp: 0, food: 0, meds: 0, money: 0 },
                        failDelta: { hp: -2, food: 0, meds: 0, money: 0 }
                    }
                }
            ]
        },
        {
            id: 'disease',
            title: isKo ? '질병 발생' : 'Disease Outbreak',
            description: isKo ? '질병이 퍼져 몸이 약해졌습니다.' : 'A disease spreads through the camp.',
            category: 'danger',
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
            category: 'danger',
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
            category: 'danger',
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
            category: 'danger',
            weight: 1,
            base: { hp: 0, food: 0, meds: 0, money: 0 },
            choices: [
                {
                    id: 'fire_extinguish',
                    label: isKo ? '불길 진압' : 'Extinguish',
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

    // QUIET.md Special Choices
    if (event.id === 'quiet_day') {
        if (Math.random() < 0.15) {
            choices.push({
                id: 'work_day',
                label: isKo ? '일한다' : 'Work',
                description: isKo ? '돈 +1' : 'Money +1',
                delta: { hp: 0, food: 0, meds: 0, money: 1 },
                response: isKo ? '열심히 일해 은을 조금 벌었습니다.' : 'You worked hard and earned some silver.'
            });
        }
        if (traitIds.has('industrious') && Math.random() < 0.15) {
            choices.push({
                id: 'work_overtime',
                label: isKo ? '야근' : 'Overtime',
                description: isKo ? '제작 기술 체크' : 'Crafting skill check',
                delta: { hp: 0, food: 0, meds: 0, money: 0 },
                response: isKo ? '야근으로 추가 물자를 확보했습니다.' : 'You work overtime for extra supplies.',
                isSpecial: true,
                specialReason: isKo ? '근면성실' : 'Industrious',
                skillCheck: {
                    label: isKo ? '정진' : 'Hard Work',
                    group: ['제작'],
                    successDelta: { hp: 0, food: 1, meds: 0, money: 1 },
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
                skillCheck: {
                    label: isKo ? '휴식' : 'Rest',
                    group: ['의학'],
                    successDelta: { hp: 2, food: 0, meds: 0, money: 0 },
                    failDelta: { hp: 0, food: 0, meds: 0, money: 0 }
                }
            });
        }
    }

    // NONCOMBAT.md Special Choices
    if (event.id === 'trade') {
        if (social >= 15) {
            choices.push({
                id: 'master_trade',
                label: isKo ? '전설적인 거래' : 'Legendary Deal',
                description: isKo ? '식량 +3, 치료제 +3, 돈 +5' : 'Food +3, Meds +3, Money +5',
                delta: { hp: 0, food: 3, meds: 3, money: 5 },
                response: isKo ? '당신의 화술에 매료된 상인이 보따리를 풀었습니다.' : 'The trader was charmed by your words and gave you a legendary deal.',
                isSpecial: true,
                specialReason: isKo ? '사교 15+' : 'Social 15+'
            });
        }
        if (traitIds.has('kind')) {
            choices.push({
                id: 'kind_help',
                label: isKo ? '호의 베풀기' : 'Show Kindness',
                description: isKo ? '사교 기술 체크' : 'Social skill check',
                delta: { hp: 0, food: 0, meds: 0, money: 0 },
                response: isKo ? '호의로 거래를 시도했습니다.' : 'You offer kindness in the deal.',
                isSpecial: true,
                specialReason: isKo ? '다정다감' : 'Kind',
                skillCheck: {
                    label: isKo ? '호의' : 'Kindness',
                    group: ['사교'],
                    successDelta: { hp: 0, food: 1, meds: 1, money: 1 },
                    failDelta: { hp: 0, food: 0, meds: 0, money: -1 }
                }
            });
        }
        if (traitIds.has('abrasive')) {
            choices.push({
                id: 'abrasive_threat',
                label: isKo ? '협박' : 'Threaten',
                description: isKo ? '격투/사격 기술 체크' : 'Melee/Shooting skill check',
                delta: { hp: 0, food: 0, meds: 0, money: 0 },
                response: isKo ? '협박으로 거래를 시도했습니다.' : 'You attempt to threaten the trader.',
                isSpecial: true,
                specialReason: isKo ? '직설적' : 'Abrasive',
                skillCheck: {
                    label: isKo ? '협박' : 'Intimidation',
                    group: ['격투', '사격'],
                    successDelta: { hp: 0, food: 1, meds: 0, money: 2 },
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
            description: isKo ? '돈 +6' : 'Money +6',
            delta: { hp: 0, food: 0, meds: 0, money: 6 },
            response: isKo ? '당신의 정밀한 분해 기술 덕에 막대한 은을 챙겼습니다.' : 'Your precision salvage earned you a fortune in silver.',
            isSpecial: true,
            specialReason: isKo ? '제작 12+' : 'Crafting 12+'
        });
    }

    // DANGER.md Special Choices
    if (event.id === 'raiders') {
        if (shooting >= 15 || melee >= 15) {
            choices.push({
                id: 'raid_counter',
                label: isKo ? '완벽한 역습' : 'Perfect Counter',
                description: isKo ? '식량 +2, 치료제 +2, 돈 +6' : 'Food +2, Meds +2, Money +6',
                delta: { hp: 0, food: 2, meds: 2, money: 6 },
                response: isKo ? '완벽한 전술로 피해 없이 적들을 소탕했습니다.' : 'With perfect tactics, you wiped out the raiders without any damage.',
                isSpecial: true,
                specialReason: isKo ? '격투/사격 15+' : 'Melee/Shooting 15+'
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
                    successDelta: { hp: 2, food: 0, meds: 0, money: 2 },
                    failDelta: { hp: -2, food: 0, meds: 0, money: -1 }
                }
            });
        }
        if (traitIds.has('wimp')) {
            choices.push({
                id: 'wimp_hide',
                label: isKo ? '은신' : 'Hide',
                description: isKo ? '생존 기술 체크' : 'Survival skill check',
                delta: { hp: 1, food: 0, meds: 0, money: -1 },
                response: isKo ? '숨어서 상황을 피하려 했습니다.' : 'You try to hide from the raid.',
                isSpecial: true,
                specialReason: isKo ? '심약자' : 'Wimp',
                skillCheck: {
                    label: isKo ? '은신' : 'Stealth',
                    group: ['생존'],
                    successDelta: { hp: 1, food: 0, meds: 0, money: 0 },
                    failDelta: { hp: -1, food: 0, meds: 0, money: -1 }
                }
            });
        }
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

    if (event.id === 'disease' && medical >= 15) {
        choices.push({
            id: 'perfect_treat',
            label: isKo ? '완벽한 치료' : 'Miracle Cure',
            description: isKo ? '체력 +4, 치료제 -1' : 'HP +4, Meds -1',
            delta: { hp: 4, food: 0, meds: -1, money: 0 },
            response: isKo ? '당신의 신의에 가까운 의술로 질병을 완전히 극복했습니다.' : 'Your god-like medical skill completely cured the disease.',
            isSpecial: true,
            specialReason: isKo ? '의학 15+' : 'Medical 15+',
            requirements: { meds: 1 }
        });
    }

    if (event.id === 'fire' && traitIds.has('pyromaniac')) {
        choices.push({
            id: 'pyro_fuel',
            label: isKo ? '불길 확장' : 'Fuel the Fire',
            description: isKo ? '제작 기술 체크' : 'Crafting skill check',
            delta: { hp: -1, food: 0, meds: 0, money: 1 },
            response: isKo ? '불길이 번지는 것을 지켜보며 즐거움을 느꼈습니다.' : 'You feed the fire.',
            isSpecial: true,
            specialReason: isKo ? '방화광' : 'Pyromaniac',
            skillCheck: {
                label: isKo ? '방화' : 'Arson',
                group: ['제작'],
                successDelta: { hp: 0, food: 0, meds: 0, money: 2 },
                failDelta: { hp: -2, food: 0, meds: 0, money: -1 }
            }
        });
    }

    if (choices.length === 0) return event;
    return { ...event, choices };
};

export default function SimulationClient() {
    const { calculateFinalTraits, userInfo: contextUserInfo, testPhase: contextTestPhase } = useTest();
    const { language } = useLanguage();
    const router = useRouter();
    const searchParams = useSearchParams();
    const s = searchParams.get('s');
    const profileId = searchParams.get('profile');

    const [result, setResult] = useState<TestResult | null>(null);
    const [localUserInfo, setLocalUserInfo] = useState<any>(null);
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

    const getGroupAverage = useCallback((group?: string[]) => {
        if (!group || group.length === 0) return 0;
        let total = 0;
        let count = 0;
        group.forEach(g => {
            const pool = SKILL_GROUPS[g] || [g];
            pool.forEach(name => {
                total += skillMap[name] ?? 0;
                count++;
            });
        });
        return total / count;
    }, [skillMap]);

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
    }, [language, skillMap]);

    const rollSkillCheck = useCallback((check: SkillCheck) => {
        const avg = getGroupAverage(check.group);
        const chance = check.fixedChance ?? getSkillChance(avg);
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

    const submitScore = useCallback(async (exitType: ExitType, dayCount: number, penalize: boolean) => {
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
            const { error } = await supabase.from('leaderboard_scores').insert({
                account_id: accountId,
                settler_name: userInfo?.name || '정착민',
                day_count: finalDay,
                exit_type: exitType
            });
            if (error) throw error;
            setSubmitMessage(language === 'ko'
                ? `리더보드에 기록되었습니다. (일차 ${finalDay})`
                : `Submitted to leaderboard. (Day ${finalDay})`);
        } catch (err) {
            console.error('Failed to submit leaderboard score:', err);
            setSubmitMessage(language === 'ko' ? '리더보드 제출에 실패했습니다.' : 'Leaderboard submission failed.');
        }
    }, [language, userInfo]);

    const advanceDay = useCallback(() => {
        if (simState.status !== 'running' || pendingChoice) return;

        // If showing event face but result is ready, flip to result first
        if (currentCard?.entry && cardView === 'event') {
            setCardView('result');
            return;
        }

        if (currentCard && cardView === 'event') return;

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
        if (nextDay >= SHIP_BUILD_DAY && !hasShipBuilt) {
            const endingEvent: SimEvent = {
                id: 'ship_built',
                title: language === 'ko' ? '우주선 완성' : 'Ship Complete',
                description: language === 'ko'
                    ? '당신은 결국 우주선을 만들어냈습니다. 이로써 당신은 이 변방계에서 탈출할 수 있게 되었습니다. 지금 당장 탈출하거나, 아니면 더 여기 있기를 선택할 수 있습니다.'
                    : 'You finally completed the ship. You can escape now or stay and keep surviving.',
                category: 'noncombat',
                weight: 0,
                base: { hp: 0, food: 0, meds: 0, money: 0 },
                choices: [
                    {
                        id: 'escape_now',
                        label: language === 'ko' ? '지금 탈출하기' : 'Escape Now',
                        description: language === 'ko' ? '즉시 우주선에 탑승한다.' : 'Board the ship immediately.',
                        delta: { hp: 0, food: 0, meds: 0, money: 0 },
                        response: language === 'ko' ? '지금 탈출을 선택했다.' : 'You choose to escape now.'
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
            setHasShipBuilt(true);
            setShowEndingCard(true);
            setPendingChoice({
                day: nextDay,
                season,
                event: endingEvent,
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
            setCurrentCard({
                day: nextDay,
                season,
                event: endingEvent
            });
            setCardView('event');
            return;
        }

        if (food === 0 && money > 0 && Math.random() < 0.4) {
            event = buildSupplyEvent(language, money, food, meds);
        } else {
            event = pickWeightedEvent(events);
        }

        event = applyTraitChoices(event!, traitIds, skillMap, language);
        if (event.choices && event.choices.length > 0) {
            const available = event.choices
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
                })
                .filter(choice => meetsRequirements(choice, { food, meds, money }));
            const isSpecialEvent = SPECIAL_EVENT_IDS.includes(event.id);
            const hasPass = available.some(choice => choice.id === 'skip' || choice.id === 'pass');

            if (!hasPass && !isSpecialEvent) {
                available.push({
                    id: 'pass',
                    label: language === 'ko' ? '넘어간다' : 'Pass',
                    description: language === 'ko' ? '굳이 개입하지 않는다.' : 'Let it pass without meddling.',
                    delta: { hp: 0, food: 0, meds: 0, money: 0 },
                    response: language === 'ko' ? '상황을 지켜보며 넘어갔다.' : 'You let the situation pass.'
                });
            }
            if (available.length === 0) {
                event = { ...event, choices: undefined };
            } else {
                event = { ...event, choices: available };
            }
        }

        if (event.choices && event.choices.length > 0) {
            const isSpecial = SPECIAL_EVENT_IDS.includes(event.id);
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
            setCurrentCard({
                day: nextDay,
                season,
                event
            });
            setCardView('event');
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

        const status: SimStatus = resolved.after.hp <= 0 ? 'dead' : 'running';
        setSimState(prev => {
            const log = [entry, ...prev.log].slice(0, 60);
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
        setCurrentCard({
            day: nextDay,
            season,
            event,
            entry
        });
        setCardView('event');
    }, [simState, pendingChoice, language, events, traitIds, getTraitScore, getSkillBonus, currentCard, cardView, hasShipBuilt]);

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
            if (choice.id === 'escape_now') {
                submitScore('escape', pendingChoice.day, false);
                setSubmittedOnExit(true);
                setSimState(prev => ({
                    ...prev,
                    status: 'success'
                }));
                setPendingChoice(null);
                setShowEndingCard(false);
                setAllowContinue(false);
                setCanBoardShip(false);
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
                        delta: { hp: 0, food: 0, meds: 0, money: 0 },
                        after: { hp: simState.hp, food: simState.food, meds: simState.meds, money: simState.money },
                        status: 'good'
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
                        delta: { hp: 0, food: 0, meds: 0, money: 0 },
                        after: { hp: simState.hp, food: simState.food, meds: simState.meds, money: simState.money },
                        status: 'neutral'
                    }
                });
                setCardView('result');
                return;
            }
        }

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

        const status: SimStatus = resolved.after.hp <= 0 ? 'dead' : 'running';

        setSimState(prev => {
            const log = [entry, ...prev.log].slice(0, 60);
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
        setCurrentCard({
            day: pendingChoice.day,
            season: pendingChoice.season,
            event: pendingChoice.event,
            entry
        });
        setCardView('result');

        setPendingChoice(null);
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
        if (simState.status === 'dead' || simState.status === 'success') {
            // No auto-progress to turn off
        }
    }, [simState.status]);

    useEffect(() => {
        if (simState.status !== 'dead' || submittedOnDeath) return;
        setSubmittedOnDeath(true);
        submitScore('death', simState.day, true);
    }, [simState.status, simState.day, submittedOnDeath, submitScore]);

    useEffect(() => {
        if (simState.status !== 'success' || submittedOnExit) return;
        setSubmittedOnExit(true);
        submitScore('escape', simState.day, false);
    }, [simState.status, simState.day, submittedOnExit, submitScore]);


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
    const canUseMeds = simState.meds > 0 && simState.hp < 10 && simState.status === 'running';
    const nextCampCost = CAMP_UPGRADE_COSTS[simState.campLevel];
    const canUpgradeCamp = nextCampCost !== undefined && simState.money >= nextCampCost;
    const canAdvanceDay = simState.status === 'running' && !pendingChoice && (cardView === 'result' || !currentCard || (currentCard.entry && cardView === 'event'));
    const allChoices = pendingChoice?.event.choices ?? [];
    const canBoardNow = canBoardShip && simState.status === 'running' && !pendingChoice;

    const getVagueDeltaText = (label: string, delta: number) => {
        if (delta === 0) return '';
        const abs = Math.abs(delta);
        const isLarge = abs >= 3;
        const symbol = delta > 0 ? (isLarge ? '++' : '+') : (isLarge ? '--' : '-');
        return `${label} ${symbol}`;
    };

    const renderDeltaItems = (entry: SimLogEntry) => {
        if (!entry) return null;
        const { delta, after } = entry;
        const items = [];
        if (delta.hp !== 0) items.push({ label: 'HP', value: after.hp, delta: delta.hp, color: 'red' });
        if (delta.food !== 0) items.push({ label: language === 'ko' ? '식량' : 'Food', value: after.food, delta: delta.food, color: 'brown' });
        if (delta.meds !== 0) items.push({ label: language === 'ko' ? '치료제' : 'Meds', value: after.meds, delta: delta.meds, color: 'pink' });
        if (delta.money !== 0) items.push({ label: language === 'ko' ? '돈' : 'Money', value: after.money, delta: delta.money, color: 'green' });

        if (items.length === 0) return (
            <div className="mt-6 py-5 px-8 rounded-xl border border-slate-700 bg-slate-800/20 text-slate-400 text-sm font-medium">
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
            <div className="mt-8 flex flex-wrap justify-center gap-4">
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
                            className="px-6 py-4 rounded-2xl flex flex-col items-center justify-center min-w-[120px] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.3)] transition-all hover:scale-105"
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
        <div className="max-w-5xl mx-auto space-y-8 text-slate-100 pb-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-[#e7c07a] tracking-tight">
                        {language === 'ko' ? '생존 시뮬레이션' : 'Survival Simulation'}
                    </h1>
                    <p className="text-sm text-slate-400">
                        {language === 'ko'
                            ? '4계절 × 15일 = 60일 생존 시 우주선 탈출 성공'
                            : '4 Seasons × 15 days = Escape if you survive 60 days'}
                    </p>
                </div>
                <div className="text-right text-xs text-slate-400">
                    {language === 'ko' ? '정착민' : 'Colonist'}:{' '}
                    <span className="text-slate-100 font-semibold">{userInfo?.name || '정착민'}</span>
                </div>
            </div>
            <div className="flex flex-col items-center gap-4">
                <div className="relative w-full flex items-center justify-center">
                    <div className="relative">
                        <div
                            key={`card-${currentCard?.day ?? 'idle'}`}
                            className={`reigns-card reigns-card-enter ${cardView === 'result' ? 'reigns-card--flipped' : ''}`}
                        >
                            <div className="reigns-card-inner">
                                <div className="reigns-card-face reigns-card-front flex flex-col text-center">
                                    <div>
                                        <div className="text-xs text-slate-400">
                                            {currentCard
                                                ? `Day ${currentCard.day} • ${currentCard.season}`
                                                : (language === 'ko' ? '시뮬레이션 대기 중' : 'Simulation Standby')}
                                        </div>
                                        <div className="mt-4 text-2xl md:text-3xl font-bold text-white">
                                            {currentCard?.event.title || (language === 'ko' ? '생존 게임을 시작하세요' : 'Start the Survival Game')}
                                        </div>
                                        <div className="mt-4 text-4xl">
                                            {getEventIcon(currentCard?.event)}
                                        </div>
                                        <div className="mt-3 text-base md:text-lg text-slate-300">
                                            {currentCard?.event.description || (language === 'ko' ? '하단의 [시뮬레이션 시작] 버튼을 눌러주세요.' : 'Please press the [Start Simulation] button below.')}
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-6 space-y-3">
                                        {pendingChoice && (
                                            <div className="text-xs text-[#e7c07a]">
                                                {language === 'ko' ? '선택지를 골라 결과를 확인하세요.' : 'Choose an action to see the outcome.'}
                                            </div>
                                        )}
                                        {pendingChoice && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {allChoices.map(choice => {
                                                    let chanceText = '';
                                                    let outcomeInfo = [] as string[];

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

                                                        // Camp mitigation
                                                        if (eventObj.category === 'danger' && simState.campLevel > 0 && hpD < 0) {
                                                            hpD += Math.min(simState.campLevel, Math.abs(hpD));
                                                        }

                                                        const res = [] as string[];
                                                        if (hpD !== 0) res.push(getVagueDeltaText('HP', hpD));
                                                        if (foodD !== 0) res.push(getVagueDeltaText(language === 'ko' ? '식량' : 'Food', foodD));
                                                        if (medsD !== 0) res.push(getVagueDeltaText(language === 'ko' ? '치료제' : 'Meds', medsD));
                                                        if (moneyD !== 0) res.push(getVagueDeltaText(language === 'ko' ? '돈' : 'Money', moneyD));
                                                        return res;
                                                    };

                                                    if (choice.skillCheck) {
                                                        const avg = getGroupAverage(choice.skillCheck.group);
                                                        const chance = choice.skillCheck.fixedChance ?? getSkillChance(avg);
                                                        chanceText = language === 'ko' ? `성공 확률 ${chance}%` : `Success ${chance}%`;

                                                        const sText = getExpectation(choice.skillCheck.successDelta).join(', ');
                                                        const fText = getExpectation(choice.skillCheck.failDelta).join(', ');

                                                        if (sText) outcomeInfo.push(language === 'ko' ? `성공 시: ${sText}` : `On Success: ${sText}`);
                                                        if (fText) outcomeInfo.push(language === 'ko' ? `실패 시: ${fText}` : `On Fail: ${fText}`);
                                                    } else {
                                                        const info = getExpectation(choice.delta).join(', ');
                                                        if (info) outcomeInfo.push(info);
                                                        else outcomeInfo.push(language === 'ko' ? '변화 없음' : 'No changes');
                                                    }

                                                    return (
                                                        <div key={choice.id} className="group relative">
                                                            <button
                                                                onClick={() => resolveChoice(choice.id)}
                                                                className={`w-full px-4 py-3 rounded-xl bg-[#1c3d5a] hover:bg-[#2c5282] text-white text-sm border ${choice.isSpecial ? 'border-[#e7c07a] shadow-[0_0_10px_rgba(231,192,122,0.3)]' : 'border-blue-900'} shadow-md transition-all h-full flex flex-col items-center justify-center`}
                                                            >
                                                                <div className={`font-bold ${choice.isSpecial ? 'text-[#e7c07a]' : ''}`}>{choice.label}</div>
                                                                {choice.description && (
                                                                    <div className="text-xs text-white/70 mt-1">{choice.description}</div>
                                                                )}
                                                                {chanceText && (
                                                                    <div className="text-xs text-[#e7c07a] mt-2 font-semibold">{chanceText}</div>
                                                                )}
                                                            </button>
                                                            {outcomeInfo.length > 0 && (
                                                                <div className="invisible group-hover:visible absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-[#0a192f] border border-blue-800 rounded-lg shadow-2xl text-[10px] text-slate-200 pointer-events-none transition-all opacity-0 group-hover:opacity-100">
                                                                    <div className="font-bold text-[#e7c07a] mb-1 border-b border-blue-800/30 pb-1 flex justify-between items-center">
                                                                        <span>{language === 'ko' ? '예상 결과' : 'Expected Outcome'}</span>
                                                                        {choice.specialReason && (
                                                                            <span className="text-[9px] text-blue-300 ml-1">({choice.specialReason})</span>
                                                                        )}
                                                                    </div>
                                                                    {outcomeInfo.map((info, idx) => (
                                                                        <div key={idx} className="mt-0.5 leading-tight">{info}</div>
                                                                    ))}
                                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[#0a192f]"></div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="reigns-card-face reigns-card-back flex flex-col text-center">
                                    <div className="text-xs text-slate-400">
                                        {currentCard
                                            ? `Day ${currentCard.day} • ${currentCard.season}`
                                            : (language === 'ko' ? '게임 시작 전' : 'Before Starting')}
                                    </div>
                                    <div className="mt-4 text-2xl md:text-3xl font-bold text-white">
                                        {language === 'ko' ? '결과' : 'Result'}
                                    </div>
                                    <div className="mt-4 text-4xl">
                                        {getEventIcon(currentCard?.event)}
                                    </div>
                                    <div className="mt-3 text-base md:text-lg text-slate-300">
                                        {currentCard?.entry?.response || (language === 'ko' ? '시뮬레이션 시작 버튼을 누르면 첫 이벤트가 시작됩니다.' : 'Press the start button to begin the first event.')}
                                    </div>
                                    {currentCard?.entry && renderDeltaItems(currentCard.entry)}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={advanceDay}
                            disabled={!canAdvanceDay}
                            className={`absolute -right-12 md:-right-16 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full border text-lg font-bold ${canAdvanceDay
                                ? 'bg-[#1c3d5a] hover:bg-[#2c5282] text-white border-blue-900 shadow-lg'
                                : 'bg-[#333] text-gray-500 border-gray-700 cursor-not-allowed'}`}
                            aria-label={language === 'ko' ? '다음 날로 넘기기' : 'Advance to next day'}
                        >
                            →
                        </button>
                    </div>
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
            </div>

            <div className="bg-[#0f0f0f] border border-[#3b3b3b] rounded-xl shadow-lg p-4 md:p-6 space-y-5">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                    <div className="bg-[#171717] border border-[#2a2a2a] rounded-md p-3">
                        <div className="text-slate-400">{language === 'ko' ? '현재 일차' : 'Day'}</div>
                        <div className="text-white font-bold text-sm">{simState.day} / {MAX_DAYS}</div>
                    </div>
                    <div className="bg-[#171717] border border-[#2a2a2a] rounded-md p-3">
                        <div className="text-slate-400">{language === 'ko' ? '계절' : 'Season'}</div>
                        <div className="text-white font-bold text-sm">{getSeasonLabel(simState.day, language)}</div>
                    </div>
                    <div className="bg-[#171717] border border-[#2a2a2a] rounded-md p-3">
                        <div className="text-slate-400">HP</div>
                        <div className="text-white font-bold text-sm">{simState.hp} / 10</div>
                    </div>
                    <div className="bg-[#171717] border border-[#2a2a2a] rounded-md p-3">
                        <div className="text-slate-400">{language === 'ko' ? '식량' : 'Food'}</div>
                        <div className="text-white font-bold text-sm">{simState.food} / 10</div>
                    </div>
                    <div className="bg-[#171717] border border-[#2a2a2a] rounded-md p-3">
                        <div className="text-slate-400">{language === 'ko' ? '치료제' : 'Meds'}</div>
                        <div className="text-white font-bold text-sm">{simState.meds} / 10</div>
                    </div>
                    <div className="bg-[#171717] border border-[#2a2a2a] rounded-md p-3">
                        <div className="text-slate-400">{language === 'ko' ? '돈' : 'Money'}</div>
                        <div className="text-white font-bold text-sm">{simState.money} / 10</div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={startSimulation}
                        className="px-4 py-2 rounded-md bg-[#9f752a] hover:bg-[#b08535] text-white text-sm font-bold border border-[#7a5a20] shadow-sm"
                    >
                        {language === 'ko' ? '시뮬레이션 시작/재시작' : 'Start/Restart'}
                    </button>
                    <button
                        onClick={handleUseMeds}
                        disabled={!canUseMeds}
                        className={`px-4 py-2 text-sm font-bold border ${canUseMeds
                            ? 'bg-[#2d6a4f] hover:bg-[#40916c] text-white border-[#1b4332] rounded-md shadow-sm'
                            : 'bg-[#333] text-gray-500 border-gray-700 cursor-not-allowed rounded-md'}`}
                    >
                        {language === 'ko' ? `치료제 사용 (HP +${healAmount})` : `Use Meds (+${healAmount} HP)`}
                    </button>
                    <button
                        onClick={handleUpgradeCamp}
                        disabled={!canUpgradeCamp}
                        className={`px-4 py-2 text-sm font-bold border ${canUpgradeCamp
                            ? 'bg-[#3f2a56] hover:bg-[#5a3d7a] text-white border-[#2b1d3f] rounded-md shadow-sm'
                            : 'bg-[#333] text-gray-500 border-gray-700 cursor-not-allowed rounded-md'}`}
                    >
                        {language === 'ko'
                            ? `캠프 강화 Lv.${simState.campLevel}${nextCampCost !== undefined ? ` (돈 ${nextCampCost})` : ''}`
                            : `Camp Upgrade Lv.${simState.campLevel}${nextCampCost !== undefined ? ` (Money ${nextCampCost})` : ''}`}
                    </button>
                    <button
                        onClick={() => {
                            if (submittedOnExit) return;
                            submitScore('escape', simState.day, false);
                            setSubmittedOnExit(true);
                            setSimState(prev => ({ ...prev, status: 'success' }));
                        }}
                        disabled={!canBoardNow}
                        className={`px-4 py-2 text-sm font-bold border ${canBoardNow
                            ? 'bg-[#8b5a2b] hover:bg-[#a06b35] text-white border-[#5a3a1a] rounded-md shadow-sm'
                            : 'bg-[#333] text-gray-500 border-gray-700 cursor-not-allowed rounded-md'}`}
                    >
                        {language === 'ko' ? '우주선 탑승하기' : 'Board the Ship'}
                    </button>
                    <button
                        onClick={() => setShowLog(prev => !prev)}
                        className="px-4 py-2 rounded-md bg-[#1a1a1a] hover:bg-[#262626] text-slate-200 text-sm border border-[#2a2a2a]"
                    >
                        {showLog ? (language === 'ko' ? '로그 닫기' : 'Hide Log') : (language === 'ko' ? '로그 보기' : 'Show Log')}
                    </button>
                </div>
                {submitMessage && (
                    <div className="text-xs text-slate-400">
                        {submitMessage}
                    </div>
                )}
            </div>

            {
                showLog && (
                    <div className="bg-[#0d0d0d] border border-[#3b3b3b] rounded-xl p-5 shadow-xl">
                        <h3 className="text-sm font-bold text-[#e7c07a] mb-3">
                            {language === 'ko' ? '생존 로그' : 'Survival Log'}
                        </h3>
                        <div className="max-h-[480px] overflow-y-auto border border-[#2a2a2a] rounded-lg bg-black/40 p-3 space-y-3 text-xs">
                            {simState.log.length === 0 && (
                                <div className="text-slate-500">
                                    {language === 'ko' ? '로그가 비어 있습니다.' : 'No logs yet.'}
                                </div>
                            )}
                            {simState.log.map((entry, idx) => (
                                <div key={`${entry.day}-${idx}`} className="rounded-lg border border-[#2a2a2a] bg-[#121212] p-3 shadow-sm space-y-2">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="text-slate-500 text-xs">
                                            Day {entry.day} • {entry.season}
                                        </div>
                                        <div className={`font-bold text-xs uppercase tracking-wide px-2 py-1 rounded-md ${entry.status === 'good'
                                            ? 'text-green-400'
                                            : entry.status === 'bad'
                                                ? 'text-red-400'
                                                : 'text-slate-200'}`}
                                        >
                                            {entry.title}
                                        </div>
                                    </div>
                                    <div className="rounded-md border border-[#222] bg-[#1a1a1a] p-2 text-slate-300">
                                        {language === 'ko' ? '사건' : 'Event'}: {entry.description}
                                    </div>
                                    <div className="rounded-md border border-[#2a2112] bg-[#2b1f0e] p-2 text-[#f3d7a1]">
                                        {language === 'ko' ? '대처' : 'Response'}: {entry.response}
                                    </div>
                                    <div className="rounded-md border border-[#1b1b1b] bg-[#0f0f0f] p-2">
                                        {renderDeltaItems(entry)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            }
        </div >
    );
}

// Build trigger for Vercel deployment update
