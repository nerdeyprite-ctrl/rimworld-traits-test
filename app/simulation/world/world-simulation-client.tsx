"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../../../context/LanguageContext';

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

type PublicChoice = {
    id: string;
    label: LocalizedText;
    description: LocalizedText;
    delta: WorldDelta;
    points: number;
    ratio: number;
};

type ViewerState = {
    accountId: string;
    points: number;
    spentThisTurn: number;
    selectedChoiceId: string | null;
    nextRefillAt: string | null;
    turnSpendCap: number;
    canVote: boolean;
    voteBlockedReason: string | null;
};

type WorldSnapshot = {
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
        status: 'running' | 'success' | 'dead' | 'season_timeout';
    };
    game: {
        day: number;
        resources: {
            hp: number;
            food: number;
            meds: number;
            money: number;
        };
        maxDays: number;
        historyCount: number;
        lastResult: {
            selectedChoiceLabel: LocalizedText;
            delta: WorldDelta;
            day: number;
        } | null;
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
    viewer: ViewerState | null;
    storage: {
        mode: 'memory' | 'supabase';
        isPersistent: boolean;
        message: string | null;
    };
    message: string | null;
};

const fmtDuration = (targetIso: string | null, now: number) => {
    if (!targetIso) return '--:--:--';
    const diff = Math.max(0, Math.floor((new Date(targetIso).getTime() - now) / 1000));
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const fmtDelta = (delta: number) => {
    if (delta === 0) return '0';
    return delta > 0 ? `+${delta}` : `${delta}`;
};

const pickText = (text: LocalizedText, language: 'ko' | 'en') => (language === 'ko' ? text.ko : text.en);

const getBlockedReasonText = (reason: string | null, language: 'ko' | 'en') => {
    if (!reason) return null;
    if (reason === 'outside_hot_time') return language === 'ko' ? '핫타임(15:00~04:00 KST) 외에는 투표할 수 없습니다.' : 'Voting is only available during hot time (15:00~04:00 KST).';
    if (reason === 'not_enough_points') return language === 'ko' ? '투표 포인트가 부족합니다.' : 'Not enough voting points.';
    if (reason === 'turn_spend_cap_reached') return language === 'ko' ? '이번 턴 최대 3포인트까지 사용했습니다.' : 'You reached the per-turn cap (3 points).';
    if (reason === 'turn_not_open') return language === 'ko' ? '현재 투표 가능한 턴이 없습니다.' : 'There is no active turn to vote on.';
    if (reason === 'season_not_running') return language === 'ko' ? '현재 시즌이 진행 중이 아닙니다.' : 'The season is not currently running.';
    return language === 'ko' ? '현재 투표할 수 없습니다.' : 'You cannot vote right now.';
};

export default function WorldSimulationClient() {
    const { language } = useLanguage();
    const router = useRouter();
    const [snapshot, setSnapshot] = useState<WorldSnapshot | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [votePendingChoiceId, setVotePendingChoiceId] = useState<string | null>(null);
    const [accountId, setAccountId] = useState<string | null>(null);
    const [nowTick, setNowTick] = useState<number>(Date.now());

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const stored = localStorage.getItem('settler_account_id');
        setAccountId(stored);
    }, []);

    const fetchState = useCallback(async () => {
        try {
            const query = accountId ? `?accountId=${encodeURIComponent(accountId)}` : '';
            const response = await fetch(`/api/world-sim/state${query}`, { cache: 'no-store' });
            const body: unknown = await response.json().catch(() => null);
            if (!response.ok) {
                const message =
                    typeof (body as { error?: unknown })?.error === 'string'
                        ? (body as { error: string }).error
                        : `Failed to load state (${response.status}).`;
                throw new Error(message);
            }
            const nextSnapshot = (body as { snapshot?: WorldSnapshot })?.snapshot;
            if (!nextSnapshot) throw new Error('Empty world snapshot.');
            setSnapshot(nextSnapshot);
            setError(null);
        } catch (fetchError) {
            setError(fetchError instanceof Error ? fetchError.message : 'Failed to load world state.');
        } finally {
            setLoading(false);
        }
    }, [accountId]);

    useEffect(() => {
        void fetchState();
        const timer = window.setInterval(() => {
            void fetchState();
        }, 15000);
        return () => window.clearInterval(timer);
    }, [fetchState]);

    useEffect(() => {
        const timer = window.setInterval(() => {
            setNowTick(Date.now());
        }, 1000);
        return () => window.clearInterval(timer);
    }, []);

    const submitVote = async (choiceId: string) => {
        if (!accountId) {
            setError(language === 'ko' ? '로그인 후 투표할 수 있습니다.' : 'Login is required to vote.');
            return;
        }
        setVotePendingChoiceId(choiceId);
        try {
            const response = await fetch('/api/world-sim/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accountId,
                    choiceId,
                    points: 1
                })
            });
            const body: unknown = await response.json().catch(() => null);
            if (!response.ok) {
                const message =
                    typeof (body as { error?: unknown })?.error === 'string'
                        ? (body as { error: string }).error
                        : `Vote failed (${response.status}).`;
                throw new Error(message);
            }
            const nextSnapshot = (body as { snapshot?: WorldSnapshot })?.snapshot;
            if (nextSnapshot) {
                setSnapshot(nextSnapshot);
                setError(null);
            } else {
                void fetchState();
            }
        } catch (voteError) {
            setError(voteError instanceof Error ? voteError.message : 'Vote failed.');
        } finally {
            setVotePendingChoiceId(null);
        }
    };

    const turnRemainingText = useMemo(() => {
        return fmtDuration(snapshot?.turn?.endsAt ?? null, nowTick);
    }, [snapshot?.turn?.endsAt, nowTick]);

    const hotWindowRemainingText = useMemo(() => {
        return fmtDuration(snapshot?.hotTime.currentWindowEndsAt ?? null, nowTick);
    }, [snapshot?.hotTime.currentWindowEndsAt, nowTick]);

    const nextHotStartText = useMemo(() => {
        return fmtDuration(snapshot?.hotTime.nextWindowStartsAt ?? null, nowTick);
    }, [snapshot?.hotTime.nextWindowStartsAt, nowTick]);

    if (loading && !snapshot) {
        return <div className="p-20 text-center text-gray-400 animate-pulse">{language === 'ko' ? '월드 시뮬레이션 로딩 중...' : 'Loading world simulation...'}</div>;
    }

    return (
        <div className="max-w-5xl mx-auto py-8 space-y-6 animate-fade-in">
            <div className="sim-panel p-5 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--sim-text-main)]">
                            {language === 'ko' ? '전체 투표 모드' : 'Global Vote Mode'}
                        </h1>
                        <p className="text-xs text-[var(--sim-text-sub)] mt-1">
                            {language === 'ko'
                                ? '핫타임(15:00~04:00 KST)에만 투표 가능 · 턴당 30분 · 10분마다 1포인트 충전'
                                : 'Voting only in hot time (15:00~04:00 KST) · 30-minute turns · +1 point every 10 minutes'}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => void fetchState()}
                            className="sim-btn sim-btn-secondary px-4 py-2 text-xs"
                        >
                            {language === 'ko' ? '새로고침' : 'Refresh'}
                        </button>
                        <button
                            onClick={() => router.push('/')}
                            className="sim-btn sim-btn-ghost px-4 py-2 text-xs"
                        >
                            {language === 'ko' ? '홈으로' : 'Home'}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="text-xs text-red-300 bg-red-950/25 border border-red-500/40 rounded-md px-3 py-2">
                        {error}
                    </div>
                )}

                {snapshot && !snapshot.storage.isPersistent && (
                    <div className="text-xs text-amber-200 bg-amber-900/20 border border-amber-500/40 rounded-md px-3 py-2">
                        {language === 'ko'
                            ? `저장 모드: 메모리(서버 재시작 시 초기화). ${snapshot.storage.message ?? ''}`.trim()
                            : `Storage mode: memory only (resets on server restart). ${snapshot.storage.message ?? ''}`.trim()}
                    </div>
                )}

                {!accountId && (
                    <div className="text-xs text-amber-200 bg-amber-900/20 border border-amber-500/40 rounded-md px-3 py-2">
                        {language === 'ko'
                            ? '로그인 후 투표할 수 있습니다. (홈 화면에서 정착민 로그인)'
                            : 'Login is required to vote. (Use Settler Login on Home)'}
                    </div>
                )}
            </div>

            {snapshot && (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div className="sim-stat-tile text-center">
                            <div className="text-[10px] text-[var(--sim-text-muted)] uppercase">Day</div>
                            <div className="text-lg font-black text-[var(--sim-text-main)]">{snapshot.game.day} / {snapshot.game.maxDays}</div>
                        </div>
                        <div className="sim-stat-tile text-center">
                            <div className="text-[10px] text-red-400 uppercase">HP</div>
                            <div className="text-lg font-black text-[var(--sim-text-main)]">{snapshot.game.resources.hp}</div>
                        </div>
                        <div className="sim-stat-tile text-center">
                            <div className="text-[10px] text-amber-400 uppercase">{language === 'ko' ? '식량' : 'Food'}</div>
                            <div className="text-lg font-black text-[var(--sim-text-main)]">{snapshot.game.resources.food}</div>
                        </div>
                        <div className="sim-stat-tile text-center">
                            <div className="text-[10px] text-pink-400 uppercase">{language === 'ko' ? '치료제' : 'Meds'}</div>
                            <div className="text-lg font-black text-[var(--sim-text-main)]">{snapshot.game.resources.meds}</div>
                        </div>
                        <div className="sim-stat-tile text-center">
                            <div className="text-[10px] text-emerald-400 uppercase">{language === 'ko' ? '돈' : 'Money'}</div>
                            <div className="text-lg font-black text-[var(--sim-text-main)]">{snapshot.game.resources.money}</div>
                        </div>
                    </div>

                    <div className="sim-panel p-5 space-y-3">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs">
                            <div className="text-[var(--sim-text-sub)]">
                                {language === 'ko' ? '시즌 상태' : 'Season'}: <span className="font-bold text-[var(--sim-text-main)]">{snapshot.season.status}</span>
                            </div>
                            <div className="text-[var(--sim-text-sub)]">
                                {snapshot.hotTime.isActive
                                    ? (language === 'ko' ? `핫타임 종료까지 ${hotWindowRemainingText}` : `Hot time active · ${hotWindowRemainingText} left`)
                                    : (language === 'ko' ? `다음 핫타임까지 ${nextHotStartText}` : `Next hot time in ${nextHotStartText}`)}
                            </div>
                        </div>
                        {snapshot.viewer && (
                            <div className="text-xs text-[var(--sim-text-sub)] bg-[var(--sim-surface-2)] border border-[var(--sim-border)] rounded-md px-3 py-2">
                                <div>
                                    {language === 'ko' ? '내 포인트' : 'My Points'}: <span className="font-black text-[var(--sim-text-main)]">{snapshot.viewer.points}</span>
                                    {' · '}
                                    {language === 'ko' ? '이번 턴 사용' : 'Spent this turn'}: <span className="font-black text-[var(--sim-text-main)]">{snapshot.viewer.spentThisTurn}/{snapshot.viewer.turnSpendCap}</span>
                                </div>
                                {snapshot.viewer.nextRefillAt && (
                                    <div className="mt-1">
                                        {language === 'ko' ? '다음 충전까지' : 'Next refill in'}: {fmtDuration(snapshot.viewer.nextRefillAt, nowTick)}
                                    </div>
                                )}
                                {getBlockedReasonText(snapshot.viewer.voteBlockedReason, language) && (
                                    <div className="mt-1 text-amber-200">
                                        {getBlockedReasonText(snapshot.viewer.voteBlockedReason, language)}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="sim-panel p-6 space-y-4">
                        {!snapshot.turn ? (
                            <div className="text-center text-sm text-[var(--sim-text-sub)] py-10">
                                {language === 'ko'
                                    ? '현재 열려 있는 턴이 없습니다. 핫타임에 새 턴이 자동으로 열립니다.'
                                    : 'No active turn right now. New turns open automatically during hot time.'}
                            </div>
                        ) : (
                            <>
                                <div className="text-[10px] uppercase tracking-wider text-[var(--sim-text-muted)]">
                                    Day {snapshot.turn.day} · {language === 'ko' ? '투표 마감까지' : 'Ends in'} {turnRemainingText}
                                </div>
                                <h2 className="text-2xl font-black text-[var(--sim-text-main)]">
                                    {pickText(snapshot.turn.event.title, language)}
                                </h2>
                                <p className="text-sm text-[var(--sim-text-sub)] leading-relaxed">
                                    {pickText(snapshot.turn.event.description, language)}
                                </p>

                                <div className="space-y-2">
                                    {snapshot.turn.choices.map(choice => {
                                        const leading = snapshot.turn?.leadingChoiceIds.includes(choice.id);
                                        const voteEnabled =
                                            !!snapshot.viewer?.canVote &&
                                            (snapshot.viewer.selectedChoiceId === null || snapshot.viewer.selectedChoiceId === choice.id) &&
                                            votePendingChoiceId === null;

                                        return (
                                            <div key={choice.id} className="border border-[var(--sim-border)] rounded-md p-3 bg-[var(--sim-surface-2)]">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <div className={`font-bold text-sm ${leading ? 'text-emerald-300' : 'text-[var(--sim-text-main)]'}`}>
                                                            {pickText(choice.label, language)}
                                                        </div>
                                                        <div className="text-[11px] text-[var(--sim-text-sub)] mt-1">
                                                            {pickText(choice.description, language)}
                                                        </div>
                                                        <div className="text-[11px] text-[var(--sim-text-muted)] mt-1">
                                                            HP {fmtDelta(choice.delta.hp)} ·
                                                            {language === 'ko' ? ' 식량 ' : ' Food '} {fmtDelta(choice.delta.food)} ·
                                                            {language === 'ko' ? ' 치료제 ' : ' Meds '} {fmtDelta(choice.delta.meds)} ·
                                                            {language === 'ko' ? ' 돈 ' : ' Money '} {fmtDelta(choice.delta.money)}
                                                        </div>
                                                    </div>
                                                    <button
                                                        disabled={!voteEnabled}
                                                        onClick={() => void submitVote(choice.id)}
                                                        className={`sim-btn px-3 py-2 text-xs ${voteEnabled ? 'sim-btn-primary' : 'sim-btn-ghost opacity-60 cursor-not-allowed'}`}
                                                    >
                                                        {votePendingChoiceId === choice.id
                                                            ? (language === 'ko' ? '투표 중...' : 'Voting...')
                                                            : (language === 'ko' ? '+1 투표' : '+1 Vote')}
                                                    </button>
                                                </div>
                                                <div className="mt-2">
                                                    <div className="h-2 rounded bg-[var(--sim-surface-1)] overflow-hidden border border-[var(--sim-border)]">
                                                        <div
                                                            className={`h-full ${leading ? 'bg-emerald-500' : 'bg-[var(--sim-accent)]'}`}
                                                            style={{ width: `${Math.max(0, Math.min(100, choice.ratio * 100))}%` }}
                                                        />
                                                    </div>
                                                    <div className="mt-1 text-[10px] text-[var(--sim-text-muted)]">
                                                        {language === 'ko' ? '포인트' : 'Points'}: {choice.points} ({Math.round(choice.ratio * 100)}%)
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
