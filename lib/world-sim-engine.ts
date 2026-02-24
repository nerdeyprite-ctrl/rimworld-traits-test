import { createClient } from '@supabase/supabase-js';

type LocalizedText = {
    ko: string;
    en: string;
};

type WorldDelta = {
    hp: number;
    food: number;
    meds: number;
    money: number;
};

type WorldChoice = {
    id: string;
    label: LocalizedText;
    description: LocalizedText;
    delta: WorldDelta;
};

type WorldEvent = {
    id: string;
    title: LocalizedText;
    description: LocalizedText;
    choices: WorldChoice[];
};

type WorldResources = {
    hp: number;
    food: number;
    meds: number;
    money: number;
};

type TurnVote = {
    choiceId: string;
    points: number;
};

type ResolutionReason = 'most_voted' | 'tie_safety' | 'no_vote_safety';

type WorldTurn = {
    id: string;
    day: number;
    event: WorldEvent;
    startedAt: string;
    endsAt: string;
    voteTotals: Record<string, number>;
    votesByUser: Record<string, TurnVote>;
    resolvedChoiceId?: string;
    resolvedReason?: ResolutionReason;
};

type WorldHistoryEntry = {
    day: number;
    turnId: string;
    eventId: string;
    selectedChoiceId: string;
    selectedChoiceLabel: LocalizedText;
    reason: ResolutionReason;
    before: WorldResources;
    after: WorldResources;
    delta: WorldDelta;
    resolvedAt: string;
};

type PlayerCharge = {
    points: number;
    lastRefillAt: string;
};

type WorldStatus = 'running' | 'success' | 'dead' | 'season_timeout';
type WorldStorageMode = 'memory' | 'supabase';

type WorldState = {
    seasonId: string;
    seasonStartedAt: string;
    seasonEndsAt: string;
    status: WorldStatus;
    day: number;
    resources: WorldResources;
    currentTurn: WorldTurn | null;
    history: WorldHistoryEntry[];
    players: Record<string, PlayerCharge>;
    updatedAt: string;
};

type VoteRequest = {
    accountId: string;
    choiceId: string;
    points: number;
};

type PublicChoice = {
    id: string;
    label: LocalizedText;
    description: LocalizedText;
    delta: WorldDelta;
    points: number;
    ratio: number;
};

type ViewerVoteState = {
    accountId: string;
    points: number;
    spentThisTurn: number;
    selectedChoiceId: string | null;
    nextRefillAt: string | null;
    turnSpendCap: number;
    canVote: boolean;
    voteBlockedReason: string | null;
};

export type WorldPublicSnapshot = {
    config: {
        turnMinutes: number;
        pointRefillMinutes: number;
        maxStoredPoints: number;
        turnSpendCap: number;
        hotWindow: {
            timezone: 'Asia/Seoul';
            startHour: number;
            endHour: number;
        };
        maxDays: number;
        seasonDays: number;
    };
    serverNow: string;
    hotTime: {
        isActive: boolean;
        canVote: boolean;
        canOpenTurn: boolean;
        currentWindowEndsAt: string | null;
        nextWindowStartsAt: string;
    };
    season: {
        id: string;
        startedAt: string;
        endsAt: string;
        status: WorldStatus;
    };
    game: {
        day: number;
        resources: WorldResources;
        maxDays: number;
        historyCount: number;
        lastResult: WorldHistoryEntry | null;
    };
    turn: {
        id: string;
        day: number;
        startedAt: string;
        endsAt: string;
        event: {
            id: string;
            title: LocalizedText;
            description: LocalizedText;
        };
        totalPoints: number;
        leadingChoiceIds: string[];
        choices: PublicChoice[];
    } | null;
    viewer: ViewerVoteState | null;
    storage: {
        mode: WorldStorageMode;
        isPersistent: boolean;
        message: string | null;
    };
    message: string | null;
};

const TURN_MINUTES = 30;
const POINT_REFILL_MINUTES = 10;
const MAX_STORED_POINTS = 5;
const TURN_SPEND_CAP = 3;
const HOT_START_HOUR = 15; // KST
const HOT_END_HOUR = 4; // KST
const MAX_DAYS = 60;
const SEASON_DAYS = 7;
const HISTORY_LIMIT = 120;
const WORLD_STATE_TABLE = 'world_sim_state';
const WORLD_STATE_ROW_ID = 'global';

const START_RESOURCES: WorldResources = {
    hp: 10,
    food: 5,
    meds: 2,
    money: 5
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === 'object' && value !== null;
};

const sanitizeStatePayload = (payload: unknown): WorldState | null => {
    if (!isRecord(payload)) return null;

    const seasonId = typeof payload.seasonId === 'string' ? payload.seasonId : null;
    const seasonStartedAt = typeof payload.seasonStartedAt === 'string' ? payload.seasonStartedAt : null;
    const seasonEndsAt = typeof payload.seasonEndsAt === 'string' ? payload.seasonEndsAt : null;
    const status = typeof payload.status === 'string' ? payload.status : null;
    const dayRaw = typeof payload.day === 'number' ? payload.day : null;
    const resources = isRecord(payload.resources) ? payload.resources : null;
    const currentTurn = payload.currentTurn;
    const history = Array.isArray(payload.history) ? payload.history : null;
    const players = isRecord(payload.players) ? payload.players : null;
    const updatedAt = typeof payload.updatedAt === 'string' ? payload.updatedAt : null;

    if (!seasonId || !seasonStartedAt || !seasonEndsAt || !status || dayRaw === null || !resources || !history || !players || !updatedAt) {
        return null;
    }
    if (!['running', 'success', 'dead', 'season_timeout'].includes(status)) {
        return null;
    }

    const hp = typeof resources.hp === 'number' ? resources.hp : null;
    const food = typeof resources.food === 'number' ? resources.food : null;
    const meds = typeof resources.meds === 'number' ? resources.meds : null;
    const money = typeof resources.money === 'number' ? resources.money : null;
    if (hp === null || food === null || meds === null || money === null) {
        return null;
    }

    return {
        seasonId,
        seasonStartedAt,
        seasonEndsAt,
        status: status as WorldStatus,
        day: dayRaw,
        resources: {
            hp,
            food,
            meds,
            money
        },
        currentTurn: currentTurn as WorldTurn | null,
        history: history as WorldHistoryEntry[],
        players: players as Record<string, PlayerCharge>,
        updatedAt
    };
};

const WORLD_EVENTS: WorldEvent[] = [
    {
        id: 'quiet_maintenance',
        title: { ko: '조용한 날', en: 'Quiet Day' },
        description: {
            ko: '큰 사건은 없었습니다. 오늘 무엇에 집중할까요?',
            en: 'No major incidents. What should the colony focus on today?'
        },
        choices: [
            {
                id: 'maintain',
                label: { ko: '정비', en: 'Maintenance' },
                description: { ko: 'HP +1', en: 'HP +1' },
                delta: { hp: 1, food: 0, meds: 0, money: 0 }
            },
            {
                id: 'farm',
                label: { ko: '농사', en: 'Farming' },
                description: { ko: '식량 +2', en: 'Food +2' },
                delta: { hp: 0, food: 2, meds: 0, money: 0 }
            },
            {
                id: 'mine',
                label: { ko: '채굴', en: 'Mining' },
                description: { ko: '돈 +2', en: 'Money +2' },
                delta: { hp: 0, food: 0, meds: 0, money: 2 }
            }
        ]
    },
    {
        id: 'trader_visit',
        title: { ko: '상단 방문', en: 'Trader Caravan' },
        description: {
            ko: '상인들이 거래를 제안합니다.',
            en: 'A caravan offers to trade supplies.'
        },
        choices: [
            {
                id: 'buy_food',
                label: { ko: '식량 구매', en: 'Buy Food' },
                description: { ko: '돈 -1, 식량 +3', en: 'Money -1, Food +3' },
                delta: { hp: 0, food: 3, meds: 0, money: -1 }
            },
            {
                id: 'buy_meds',
                label: { ko: '치료제 구매', en: 'Buy Meds' },
                description: { ko: '돈 -1, 치료제 +2', en: 'Money -1, Meds +2' },
                delta: { hp: 0, food: 0, meds: 2, money: -1 }
            },
            {
                id: 'pass_trade',
                label: { ko: '거래 안 함', en: 'Pass' },
                description: { ko: '변화 없음', en: 'No changes' },
                delta: { hp: 0, food: 0, meds: 0, money: 0 }
            }
        ]
    },
    {
        id: 'raider_attack',
        title: { ko: '레이더 습격', en: 'Raider Attack' },
        description: {
            ko: '무장한 습격자들이 기지를 덮쳤습니다.',
            en: 'Armed raiders are attacking the base.'
        },
        choices: [
            {
                id: 'counter_attack',
                label: { ko: '정면전', en: 'Counter Attack' },
                description: { ko: 'HP -3, 돈 +1', en: 'HP -3, Money +1' },
                delta: { hp: -3, food: 0, meds: 0, money: 1 }
            },
            {
                id: 'hold_line',
                label: { ko: '방어전', en: 'Hold Position' },
                description: { ko: 'HP -2, 식량 -1', en: 'HP -2, Food -1' },
                delta: { hp: -2, food: -1, meds: 0, money: 0 }
            },
            {
                id: 'retreat',
                label: { ko: '후퇴', en: 'Retreat' },
                description: { ko: '식량 -2, 돈 -1', en: 'Food -2, Money -1' },
                delta: { hp: 0, food: -2, meds: 0, money: -1 }
            }
        ]
    },
    {
        id: 'disease_outbreak',
        title: { ko: '질병 확산', en: 'Disease Outbreak' },
        description: {
            ko: '캠프에 질병이 퍼지고 있습니다.',
            en: 'A disease is spreading through the camp.'
        },
        choices: [
            {
                id: 'use_meds',
                label: { ko: '치료제 사용', en: 'Use Meds' },
                description: { ko: '치료제 -1, HP +2', en: 'Meds -1, HP +2' },
                delta: { hp: 2, food: 0, meds: -1, money: 0 }
            },
            {
                id: 'isolation',
                label: { ko: '격리', en: 'Isolation' },
                description: { ko: '식량 -1, HP -1', en: 'Food -1, HP -1' },
                delta: { hp: -1, food: -1, meds: 0, money: 0 }
            },
            {
                id: 'work_through',
                label: { ko: '강행', en: 'Push Through' },
                description: { ko: 'HP -2, 돈 +1', en: 'HP -2, Money +1' },
                delta: { hp: -2, food: 0, meds: 0, money: 1 }
            }
        ]
    }
];

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

const toKstDate = (date: Date) => new Date(date.getTime() + KST_OFFSET_MS);

const fromKstDate = (date: Date) => new Date(date.getTime() - KST_OFFSET_MS);

const isHotTime = (date: Date) => {
    const kst = toKstDate(date);
    const hour = kst.getUTCHours();
    return hour >= HOT_START_HOUR || hour < HOT_END_HOUR;
};

const getCurrentHotWindowEnd = (date: Date): Date | null => {
    if (!isHotTime(date)) return null;
    const kst = toKstDate(date);
    const end = new Date(kst);
    if (kst.getUTCHours() >= HOT_START_HOUR) {
        end.setUTCDate(end.getUTCDate() + 1);
    }
    end.setUTCHours(HOT_END_HOUR, 0, 0, 0);
    return fromKstDate(end);
};

const getNextHotWindowStart = (date: Date): Date => {
    const kst = toKstDate(date);
    const start = new Date(kst);
    const hour = kst.getUTCHours();
    if (hour >= HOT_START_HOUR) {
        start.setUTCDate(start.getUTCDate() + 1);
    } else if (hour < HOT_END_HOUR) {
        start.setUTCHours(HOT_START_HOUR, 0, 0, 0);
        return fromKstDate(start);
    }
    start.setUTCHours(HOT_START_HOUR, 0, 0, 0);
    return fromKstDate(start);
};

const canOpenTurnNow = (date: Date) => {
    const windowEnd = getCurrentHotWindowEnd(date);
    if (!windowEnd) return false;
    return date.getTime() + TURN_MINUTES * 60 * 1000 <= windowEnd.getTime();
};

const toIso = (date: Date) => date.toISOString();

const addMinutes = (date: Date, minutes: number) => new Date(date.getTime() + minutes * 60 * 1000);

const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

const buildSeasonId = (date: Date) => {
    const kst = toKstDate(date);
    const y = kst.getUTCFullYear();
    const m = String(kst.getUTCMonth() + 1).padStart(2, '0');
    const d = String(kst.getUTCDate()).padStart(2, '0');
    const h = String(kst.getUTCHours()).padStart(2, '0');
    const min = String(kst.getUTCMinutes()).padStart(2, '0');
    return `season-${y}${m}${d}-${h}${min}`;
};

const randomFrom = <T,>(items: T[]): T => {
    const index = Math.floor(Math.random() * items.length);
    return items[index];
};

const pickEvent = () => randomFrom(WORLD_EVENTS);

const applyChoiceDelta = (before: WorldResources, delta: WorldDelta): { after: WorldResources; appliedDelta: WorldDelta } => {
    let hp = before.hp + delta.hp;
    let food = before.food + delta.food;
    let meds = before.meds + delta.meds;
    let money = before.money + delta.money;

    // End-of-day upkeep
    food -= 1;
    if (food < 0) {
        hp += food;
        food = 0;
    }

    hp = clamp(hp, 0, 20);
    food = clamp(food, 0, 30);
    meds = clamp(meds, 0, 30);
    money = clamp(money, 0, 30);

    const after: WorldResources = { hp, food, meds, money };
    const appliedDelta: WorldDelta = {
        hp: after.hp - before.hp,
        food: after.food - before.food,
        meds: after.meds - before.meds,
        money: after.money - before.money
    };
    return { after, appliedDelta };
};

const getSafetyScore = (before: WorldResources, choice: WorldChoice) => {
    const simulated = applyChoiceDelta(before, choice.delta).after;
    const hpWeight = 1000;
    const resourceWeight = 8;
    const afterResourceSum = simulated.food + simulated.meds + simulated.money;
    return simulated.hp * hpWeight + afterResourceSum * resourceWeight;
};

const chooseSafestChoice = (choices: WorldChoice[], before: WorldResources) => {
    const ordered = [...choices].sort((a, b) => getSafetyScore(before, b) - getSafetyScore(before, a));
    return ordered[0];
};

const refillPlayerCharge = (charge: PlayerCharge, now: Date): PlayerCharge => {
    const last = new Date(charge.lastRefillAt);
    const elapsed = now.getTime() - last.getTime();
    if (elapsed <= 0) return charge;

    const gained = Math.floor(elapsed / (POINT_REFILL_MINUTES * 60 * 1000));
    if (gained <= 0) return charge;

    const nextPoints = clamp(charge.points + gained, 0, MAX_STORED_POINTS);
    const nextLastRefill = addMinutes(last, gained * POINT_REFILL_MINUTES);

    return {
        points: nextPoints,
        lastRefillAt: toIso(nextLastRefill)
    };
};

const createInitialState = (now: Date): WorldState => ({
    seasonId: buildSeasonId(now),
    seasonStartedAt: toIso(now),
    seasonEndsAt: toIso(addDays(now, SEASON_DAYS)),
    status: 'running',
    day: 0,
    resources: { ...START_RESOURCES },
    currentTurn: null,
    history: [],
    players: {},
    updatedAt: toIso(now)
});

const createTurn = (state: WorldState, now: Date): WorldTurn => {
    const event = pickEvent();
    const voteTotals: Record<string, number> = {};
    event.choices.forEach(choice => {
        voteTotals[choice.id] = 0;
    });

    return {
        id: `turn-${state.seasonId}-${state.day + 1}-${Math.random().toString(36).slice(2, 8)}`,
        day: state.day + 1,
        event,
        startedAt: toIso(now),
        endsAt: toIso(addMinutes(now, TURN_MINUTES)),
        voteTotals,
        votesByUser: {}
    };
};

const summarizeTurnResult = (
    state: WorldState,
    turn: WorldTurn,
    selectedChoice: WorldChoice,
    reason: ResolutionReason,
    now: Date
) => {
    const before = { ...state.resources };
    const { after, appliedDelta } = applyChoiceDelta(before, selectedChoice.delta);

    const historyEntry: WorldHistoryEntry = {
        day: turn.day,
        turnId: turn.id,
        eventId: turn.event.id,
        selectedChoiceId: selectedChoice.id,
        selectedChoiceLabel: selectedChoice.label,
        reason,
        before,
        after,
        delta: appliedDelta,
        resolvedAt: toIso(now)
    };

    state.resources = after;
    state.day = turn.day;
    state.history = [historyEntry, ...state.history].slice(0, HISTORY_LIMIT);
    turn.resolvedChoiceId = selectedChoice.id;
    turn.resolvedReason = reason;

    if (after.hp <= 0) {
        state.status = 'dead';
    } else if (state.day >= MAX_DAYS) {
        state.status = 'success';
    }
};

const resolveTurnIfNeeded = (state: WorldState, now: Date): boolean => {
    const turn = state.currentTurn;
    if (!turn) return false;
    if (now.getTime() < new Date(turn.endsAt).getTime()) return false;

    const totals = turn.voteTotals;
    const totalPoints = Object.values(totals).reduce((sum, value) => sum + value, 0);
    let selectedChoice: WorldChoice;
    let reason: ResolutionReason;

    if (totalPoints <= 0) {
        selectedChoice = chooseSafestChoice(turn.event.choices, state.resources);
        reason = 'no_vote_safety';
    } else {
        const maxPoints = Math.max(...Object.values(totals));
        const leaders = turn.event.choices.filter(choice => totals[choice.id] === maxPoints);
        if (leaders.length === 1) {
            selectedChoice = leaders[0];
            reason = 'most_voted';
        } else {
            selectedChoice = chooseSafestChoice(leaders, state.resources);
            reason = 'tie_safety';
        }
    }

    summarizeTurnResult(state, turn, selectedChoice, reason, now);
    state.currentTurn = null;
    return true;
};

const handleSeasonTimeout = (state: WorldState, now: Date): boolean => {
    if (state.status !== 'running') return false;
    if (now.getTime() >= new Date(state.seasonEndsAt).getTime()) {
        state.status = 'season_timeout';
        state.currentTurn = null;
        return true;
    }
    return false;
};

const openTurnIfNeeded = (state: WorldState, now: Date): boolean => {
    if (state.status !== 'running') return false;
    if (state.currentTurn) return false;
    if (!canOpenTurnNow(now)) return false;

    state.currentTurn = createTurn(state, now);
    return true;
};

const tick = (state: WorldState, now: Date): boolean => {
    let changed = false;
    changed = handleSeasonTimeout(state, now) || changed;
    changed = resolveTurnIfNeeded(state, now) || changed;
    changed = openTurnIfNeeded(state, now) || changed;
    state.updatedAt = toIso(now);
    return changed;
};

const buildViewerState = (state: WorldState, now: Date, accountId: string | null): ViewerVoteState | null => {
    if (!accountId) return null;

    const rawCharge = state.players[accountId] ?? {
        points: MAX_STORED_POINTS,
        lastRefillAt: toIso(now)
    };
    const charge = refillPlayerCharge(rawCharge, now);

    const vote = state.currentTurn?.votesByUser[accountId];
    const spentThisTurn = vote?.points ?? 0;
    const selectedChoiceId = vote?.choiceId ?? null;

    const nextRefillAt = charge.points >= MAX_STORED_POINTS
        ? null
        : toIso(addMinutes(new Date(charge.lastRefillAt), POINT_REFILL_MINUTES));

    let voteBlockedReason: string | null = null;
    if (state.status !== 'running') {
        voteBlockedReason = 'season_not_running';
    } else if (!state.currentTurn) {
        voteBlockedReason = 'turn_not_open';
    } else if (!isHotTime(now)) {
        voteBlockedReason = 'outside_hot_time';
    } else if (spentThisTurn >= TURN_SPEND_CAP) {
        voteBlockedReason = 'turn_spend_cap_reached';
    } else if (charge.points <= 0) {
        voteBlockedReason = 'not_enough_points';
    }

    return {
        accountId,
        points: charge.points,
        spentThisTurn,
        selectedChoiceId,
        nextRefillAt,
        turnSpendCap: TURN_SPEND_CAP,
        canVote: voteBlockedReason === null,
        voteBlockedReason
    };
};

const getTurnPublicData = (turn: WorldTurn | null): WorldPublicSnapshot['turn'] => {
    if (!turn) return null;
    const totalPoints = Object.values(turn.voteTotals).reduce((sum, value) => sum + value, 0);
    const maxPoints = totalPoints > 0 ? Math.max(...Object.values(turn.voteTotals)) : 0;
    const leadingChoiceIds = totalPoints > 0
        ? turn.event.choices.filter(choice => turn.voteTotals[choice.id] === maxPoints).map(choice => choice.id)
        : [];

    return {
        id: turn.id,
        day: turn.day,
        startedAt: turn.startedAt,
        endsAt: turn.endsAt,
        event: {
            id: turn.event.id,
            title: turn.event.title,
            description: turn.event.description
        },
        totalPoints,
        leadingChoiceIds,
        choices: turn.event.choices.map(choice => {
            const points = turn.voteTotals[choice.id] ?? 0;
            const ratio = totalPoints <= 0 ? 0 : points / totalPoints;
            return {
                id: choice.id,
                label: choice.label,
                description: choice.description,
                delta: choice.delta,
                points,
                ratio
            };
        })
    };
};

const getStateMessage = (state: WorldState): string | null => {
    if (state.status === 'success') return 'max_days_reached';
    if (state.status === 'dead') return 'colony_dead';
    if (state.status === 'season_timeout') return 'season_timeout';
    return null;
};

const getPublicSnapshot = (state: WorldState, now: Date, accountId: string | null): WorldPublicSnapshot => {
    const hotActive = isHotTime(now);
    const hotEnd = getCurrentHotWindowEnd(now);
    const nextHotStart = getNextHotWindowStart(now);
    const viewer = buildViewerState(state, now, accountId);
    const turn = getTurnPublicData(state.currentTurn);

    return {
        config: {
            turnMinutes: TURN_MINUTES,
            pointRefillMinutes: POINT_REFILL_MINUTES,
            maxStoredPoints: MAX_STORED_POINTS,
            turnSpendCap: TURN_SPEND_CAP,
            hotWindow: {
                timezone: 'Asia/Seoul',
                startHour: HOT_START_HOUR,
                endHour: HOT_END_HOUR
            },
            maxDays: MAX_DAYS,
            seasonDays: SEASON_DAYS
        },
        serverNow: toIso(now),
        hotTime: {
            isActive: hotActive,
            canVote: hotActive,
            canOpenTurn: canOpenTurnNow(now),
            currentWindowEndsAt: hotEnd ? toIso(hotEnd) : null,
            nextWindowStartsAt: toIso(nextHotStart)
        },
        season: {
            id: state.seasonId,
            startedAt: state.seasonStartedAt,
            endsAt: state.seasonEndsAt,
            status: state.status
        },
        game: {
            day: state.day,
            resources: { ...state.resources },
            maxDays: MAX_DAYS,
            historyCount: state.history.length,
            lastResult: state.history[0] ?? null
        },
        turn,
        viewer,
        storage: {
            mode: worldStorageMode,
            isPersistent: worldStorageMode === 'supabase',
            message: worldStorageMessage
        },
        message: getStateMessage(state)
    };
};

let worldState: WorldState | null = null;
let worldStateLoaded = false;
let stateLock: Promise<void> = Promise.resolve();
let worldStorageMode: WorldStorageMode = 'memory';
let worldStorageMessage: string | null = 'Supabase not configured. Using memory-only state.';

const getServerSupabase = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;

    return createClient(url, key, {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        }
    });
};

const getStorageErrorText = (error: unknown) => {
    if (error instanceof Error && error.message.trim().length > 0) {
        return error.message;
    }
    return 'Unknown storage error';
};

const loadStateFromSupabase = async (): Promise<WorldState | null> => {
    const supabase = getServerSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
        .from(WORLD_STATE_TABLE)
        .select('payload')
        .eq('id', WORLD_STATE_ROW_ID)
        .maybeSingle();

    if (error) {
        throw new Error(`Supabase read failed: ${error.message}`);
    }

    const payload = (data as { payload?: unknown } | null)?.payload;
    const state = sanitizeStatePayload(payload);
    return state ?? null;
};

const persistStateToSupabase = async (state: WorldState): Promise<boolean> => {
    const supabase = getServerSupabase();
    if (!supabase) return false;

    const { error } = await supabase
        .from(WORLD_STATE_TABLE)
        .upsert(
            {
                id: WORLD_STATE_ROW_ID,
                payload: state
            },
            { onConflict: 'id' }
        );

    if (error) {
        throw new Error(`Supabase write failed: ${error.message}`);
    }
    return true;
};

const withStateLock = async <T,>(fn: () => Promise<T> | T): Promise<T> => {
    const previous = stateLock;
    let release: () => void = () => undefined;
    stateLock = new Promise<void>(resolve => {
        release = resolve;
    });

    await previous;
    try {
        return await fn();
    } finally {
        release();
    }
};

const ensureStateLoaded = async (now: Date): Promise<WorldState> => {
    if (worldState && worldStateLoaded) {
        return worldState;
    }

    if (!worldStateLoaded) {
        try {
            const loaded = await loadStateFromSupabase();
            if (loaded) {
                worldState = loaded;
                worldStorageMode = 'supabase';
                worldStorageMessage = null;
                worldStateLoaded = true;
                return worldState;
            }
        } catch (error) {
            worldStorageMode = 'memory';
            worldStorageMessage = `Supabase unavailable. Falling back to memory state (${getStorageErrorText(error)}).`;
        }
    }

    if (!worldState) {
        worldState = createInitialState(now);
    }
    worldStateLoaded = true;
    return worldState;
};

const persistIfPossible = async (state: WorldState) => {
    try {
        const persisted = await persistStateToSupabase(state);
        if (persisted) {
            worldStorageMode = 'supabase';
            worldStorageMessage = null;
            return;
        }
        worldStorageMode = 'memory';
        if (!worldStorageMessage) {
            worldStorageMessage = 'Supabase not configured. Using memory-only state.';
        }
    } catch (error) {
        worldStorageMode = 'memory';
        worldStorageMessage = `Supabase unavailable. Falling back to memory state (${getStorageErrorText(error)}).`;
    }
};

export const getWorldSnapshot = async (accountId?: string | null): Promise<WorldPublicSnapshot> => {
    return withStateLock(async () => {
        const now = new Date();
        const state = await ensureStateLoaded(now);
        const changed = tick(state, now);
        if (changed) {
            await persistIfPossible(state);
        }
        return getPublicSnapshot(state, now, accountId ?? null);
    });
};

export const submitWorldVote = async ({ accountId, choiceId, points }: VoteRequest): Promise<WorldPublicSnapshot> => {
    return withStateLock(async () => {
        const now = new Date();
        const state = await ensureStateLoaded(now);
        let shouldPersist = tick(state, now);

        if (state.status !== 'running') {
            throw new Error('Season is not running.');
        }
        if (!state.currentTurn) {
            throw new Error('No active turn to vote on.');
        }
        if (!isHotTime(now)) {
            throw new Error('Voting is available only during hot time (KST 15:00~04:00).');
        }
        if (!accountId.trim()) {
            throw new Error('accountId is required.');
        }

        const turn = state.currentTurn;
        const targetChoice = turn.event.choices.find(choice => choice.id === choiceId);
        if (!targetChoice) {
            throw new Error('Invalid choiceId.');
        }

        const rawCharge = state.players[accountId] ?? {
            points: MAX_STORED_POINTS,
            lastRefillAt: toIso(now)
        };
        const charge = refillPlayerCharge(rawCharge, now);
        if (charge.points !== rawCharge.points || charge.lastRefillAt !== rawCharge.lastRefillAt) {
            shouldPersist = true;
        }
        state.players[accountId] = charge;

        const vote = turn.votesByUser[accountId];
        if (vote && vote.choiceId !== choiceId) {
            throw new Error('Choice is locked for this turn. You can only add points to your first selected choice.');
        }

        const spentThisTurn = vote?.points ?? 0;
        if (spentThisTurn >= TURN_SPEND_CAP) {
            throw new Error(`Turn spend cap reached (${TURN_SPEND_CAP}).`);
        }
        if (charge.points <= 0) {
            throw new Error('Not enough voting points.');
        }

        const normalizedPoints = clamp(Math.floor(points), 1, TURN_SPEND_CAP);
        const spendable = Math.min(normalizedPoints, charge.points, TURN_SPEND_CAP - spentThisTurn);
        if (spendable <= 0) {
            throw new Error('No spendable points left for this turn.');
        }

        turn.votesByUser[accountId] = {
            choiceId,
            points: spentThisTurn + spendable
        };
        turn.voteTotals[choiceId] = (turn.voteTotals[choiceId] ?? 0) + spendable;
        charge.points -= spendable;
        state.players[accountId] = charge;
        shouldPersist = true;

        shouldPersist = tick(state, now) || shouldPersist;
        if (shouldPersist) {
            await persistIfPossible(state);
        }
        return getPublicSnapshot(state, now, accountId);
    });
};
