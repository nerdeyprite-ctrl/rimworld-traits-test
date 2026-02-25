import { createClient } from '@supabase/supabase-js';

type RawRecord = Record<string, unknown>;

export type WorldBaseSettlerTrait = {
    id: string;
    name: string;
    description?: string;
};

export type WorldBaseSettlerSkill = {
    name: string;
    level: number;
    passion: string | null;
};

export type WorldBaseSettler = {
    source: 'share';
    sourceId: string;
    name: string;
    age: number | null;
    gender: string | null;
    mbti: string;
    traits: WorldBaseSettlerTrait[];
    skills: WorldBaseSettlerSkill[];
    incapabilities: string[];
    backstory: {
        childhood: string | null;
        adulthood: string | null;
    };
};

const isRecord = (value: unknown): value is RawRecord => {
    return typeof value === 'object' && value !== null;
};

const toCleanString = (value: unknown): string | null => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
};

const normalizeTrait = (value: unknown, index: number): WorldBaseSettlerTrait | null => {
    if (typeof value === 'string') {
        const name = value.trim();
        if (!name) return null;
        return {
            id: `trait_${index + 1}`,
            name
        };
    }

    if (!isRecord(value)) return null;
    const id = toCleanString(value.id) ?? `trait_${index + 1}`;
    const name = toCleanString(value.name) ?? toCleanString(value.id);
    if (!name) return null;
    const description = toCleanString(value.description) ?? undefined;
    return {
        id,
        name,
        ...(description ? { description } : {})
    };
};

const normalizeSkill = (value: unknown): WorldBaseSettlerSkill | null => {
    if (!isRecord(value)) return null;

    const name = toCleanString(value.name);
    if (!name) return null;

    const levelRaw = typeof value.level === 'number'
        ? value.level
        : typeof value.level === 'string'
            ? Number(value.level)
            : NaN;
    if (!Number.isFinite(levelRaw)) return null;

    const passion = toCleanString(value.passion);

    return {
        name,
        level: Math.max(0, Math.min(20, Math.floor(levelRaw))),
        passion
    };
};

const normalizeIncapabilities = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];
    return value
        .map(item => toCleanString(item))
        .filter((item): item is string => !!item);
};

const normalizeBackstoryText = (value: unknown): string | null => {
    if (typeof value === 'string') {
        return toCleanString(value);
    }
    if (!isRecord(value)) return null;
    return (
        toCleanString(value.title)
        ?? toCleanString(value.titleShort)
        ?? toCleanString(value.id)
    );
};

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

const DEFAULT_BASE_SETTLER_SHARE_ID = '6757';

const getConfiguredShareId = () => {
    const raw = process.env.WORLD_BASE_SETTLER_SHARE_ID ?? DEFAULT_BASE_SETTLER_SHARE_ID;
    return raw.trim();
};

export const resolveWorldBaseSettler = async (): Promise<WorldBaseSettler | null> => {
    const shareId = getConfiguredShareId();
    if (!shareId) return null;

    const supabase = getServerSupabase();
    if (!supabase) return null;

    const filterValue: string | number = /^\d+$/.test(shareId) ? Number(shareId) : shareId;
    const { data, error } = await supabase
        .from('test_results')
        .select('id,name,age,gender,mbti,traits,skills,incapabilities,backstory_childhood,backstory_adulthood')
        .eq('id', filterValue)
        .maybeSingle();

    if (error) {
        throw new Error(`Failed to load world base settler (share=${shareId}): ${error.message}`);
    }
    if (!data) return null;

    const name = toCleanString(data.name) ?? '정착민';
    const mbti = toCleanString(data.mbti) ?? 'Unknown';
    const age = typeof data.age === 'number' && Number.isFinite(data.age)
        ? Math.max(0, Math.floor(data.age))
        : null;
    const gender = toCleanString(data.gender);

    const traits = Array.isArray(data.traits)
        ? data.traits
            .map((trait, index) => normalizeTrait(trait, index))
            .filter((trait): trait is WorldBaseSettlerTrait => !!trait)
        : [];

    const skills = Array.isArray(data.skills)
        ? data.skills
            .map(skill => normalizeSkill(skill))
            .filter((skill): skill is WorldBaseSettlerSkill => !!skill)
        : [];

    const incapabilities = normalizeIncapabilities(data.incapabilities);
    const childhood = normalizeBackstoryText(data.backstory_childhood);
    const adulthood = normalizeBackstoryText(data.backstory_adulthood);

    return {
        source: 'share',
        sourceId: String(data.id ?? shareId),
        name,
        age,
        gender,
        mbti,
        traits,
        skills,
        incapabilities,
        backstory: {
            childhood,
            adulthood
        }
    };
};
