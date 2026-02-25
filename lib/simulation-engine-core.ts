export type SharedSimEventCategory = 'quiet' | 'noncombat' | 'mind' | 'danger';

type CategoryWeightMap = Record<SharedSimEventCategory, number>;

export type CategorySelectionConfig = {
    day: number;
    daysSinceDanger: number;
    effectDangerBias?: number;
    endingPhaseActive?: boolean;
    includeMind?: boolean;
    forceDanger?: boolean;
    random?: () => number;
};

export type CategorySelectionResult = {
    category: SharedSimEventCategory;
    dangerChance: number;
    weights: CategoryWeightMap;
};

const EARLY_EASING_END_DAY = 80;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const getDangerChance = (day: number, daysSinceDanger: number) => {
    if (day <= 6) return 0;
    if (day >= 8 && day <= 10) return 5;
    if (daysSinceDanger >= 1 && daysSinceDanger <= 3) return 5;
    const n = Math.max(0, daysSinceDanger);
    const raw = 0.1875 * n * n + 1.375 * n - 2.5;
    return Math.round(raw);
};

export const getEarlyDangerChanceRelief = (day: number, daysSinceDanger: number, endingPhaseActive: boolean) => {
    if (endingPhaseActive) return 0;
    if (day > EARLY_EASING_END_DAY) return 0;
    if (daysSinceDanger <= 1) return 3;
    return 0;
};

const getCategoryWeights = ({
    day,
    daysSinceDanger,
    effectDangerBias = 0,
    endingPhaseActive = false,
    includeMind = true
}: Omit<CategorySelectionConfig, 'forceDanger' | 'random'>): Pick<CategorySelectionResult, 'dangerChance' | 'weights'> => {
    const baseDangerChance = getDangerChance(day, daysSinceDanger);
    const earlyRelief = getEarlyDangerChanceRelief(day, daysSinceDanger, endingPhaseActive);
    const dangerChance = clamp(baseDangerChance + effectDangerBias - earlyRelief, 0, 95);
    const remaining = Math.max(0, 100 - dangerChance);

    const quietWeight = remaining * (50 / 90);
    const nonCombatBaseWeight = remaining * (40 / 90);
    const mindWeight = includeMind ? nonCombatBaseWeight * 0.2 : 0;
    const nonCombatWeight = includeMind ? nonCombatBaseWeight * 0.8 : nonCombatBaseWeight;

    return {
        dangerChance,
        weights: {
            quiet: quietWeight,
            noncombat: nonCombatWeight,
            mind: mindWeight,
            danger: dangerChance
        }
    };
};

export const selectEventCategory = (config: CategorySelectionConfig): CategorySelectionResult => {
    const {
        day,
        daysSinceDanger,
        effectDangerBias = 0,
        endingPhaseActive = false,
        includeMind = true,
        forceDanger = false,
        random = Math.random
    } = config;

    const { dangerChance, weights } = getCategoryWeights({
        day,
        daysSinceDanger,
        effectDangerBias,
        endingPhaseActive,
        includeMind
    });

    if (forceDanger) {
        return {
            category: 'danger',
            dangerChance,
            weights
        };
    }

    const totalWeight = Object.values(weights).reduce((sum, weight) => sum + Math.max(0, weight), 0);
    if (totalWeight <= 0) {
        return {
            category: 'quiet',
            dangerChance,
            weights
        };
    }

    let roll = clamp(random(), 0, 0.999999999) * totalWeight;

    const ordered: SharedSimEventCategory[] = ['quiet', 'noncombat', 'mind', 'danger'];
    for (const category of ordered) {
        const weight = Math.max(0, weights[category]);
        if (weight <= 0) continue;
        roll -= weight;
        if (roll <= 0) {
            return {
                category,
                dangerChance,
                weights
            };
        }
    }

    return {
        category: 'danger',
        dangerChance,
        weights
    };
};

export const pickWeightedItem = <T>(
    items: T[],
    getWeight: (item: T) => number,
    random: () => number = Math.random
): T => {
    if (items.length === 0) {
        throw new Error('pickWeightedItem called with an empty array');
    }

    const weights = items.map(item => Math.max(0, getWeight(item)));
    const total = weights.reduce((sum, weight) => sum + weight, 0);

    if (total <= 0) {
        return items[0];
    }

    let roll = clamp(random(), 0, 0.999999999) * total;
    for (let index = 0; index < items.length; index += 1) {
        roll -= weights[index];
        if (roll <= 0) {
            return items[index];
        }
    }

    return items[items.length - 1];
};
