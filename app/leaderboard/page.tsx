"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../../context/LanguageContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Trait, Skill, Backstory } from '../../types/rimworld';
import ChatBox from '../components/ChatBox';

type LeaderboardEntry = {
    id: number;
    created_at: string;
    settler_name: string;
    day_count: number;
    exit_type: 'death' | 'escape' | 'stay';
    account_id: string;
    traits?: Trait[];
    skills?: Skill[];
    mbti?: string;
    backstory_childhood?: Backstory;
    backstory_adulthood?: Backstory;
    incapabilities?: string[];
    age?: number;
    gender?: 'Male' | 'Female';
};

export default function LeaderboardPage() {
    const { language, t } = useLanguage();
    const router = useRouter();
    const [scores, setScores] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedEntry, setSelectedEntry] = useState<LeaderboardEntry | null>(null);
    const [activeTab, setActiveTab] = useState<'leaderboard' | 'distribution'>('leaderboard');

    useEffect(() => {
        const fetchLeaderboard = async () => {
            if (!isSupabaseConfigured()) {
                setError(language === 'ko' ? 'DB 설정이 완료되지 않았습니다.' : 'Database not configured.');
                setLoading(false);
                return;
            }

            try {
                const { data, error: fetchError } = await supabase
                    .from('leaderboard_scores')
                    .select('*')
                    .order('day_count', { ascending: false })
                    .limit(100);

                if (fetchError) throw fetchError;
                setScores(data || []);
            } catch (err) {
                console.error('Failed to fetch leaderboard:', err);
                setError(language === 'ko' ? '순위 데이터를 가져오지 못했습니다.' : 'Failed to fetch ranking data.');
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, [language]);

    const getExitTypeLabel = (type: string) => {
        if (language === 'ko') {
            switch (type) {
                case 'escape': return '창공으로의 탈출';
                case 'death': return '변방계의 거름';
                case 'stay': return '영원한 정착';
                default: return type;
            }
        }
        return type.charAt(0).toUpperCase() + type.slice(1);
    };

    const getExitTypeColor = (type: string) => {
        switch (type) {
            case 'escape': return 'text-green-400';
            case 'death': return 'text-red-400';
            case 'stay': return 'text-blue-400';
            default: return 'text-slate-400';
        }
    };

    const getSkillName = (key: string) => t(key.toLowerCase());

    const sortedScores = [...scores].sort((a, b) => b.day_count - a.day_count);
    const nowMs = Date.now();
    const last24hScores = sortedScores.filter((entry) => new Date(entry.created_at).getTime() >= nowMs - 24 * 60 * 60 * 1000);
    const last7dScores = sortedScores.filter((entry) => new Date(entry.created_at).getTime() >= nowMs - 7 * 24 * 60 * 60 * 1000);

    const buildDistribution = (entries: LeaderboardEntry[]) => {
        const counts = new Map<number, number>();
        for (const entry of entries) {
            const day = Math.max(0, Math.floor(entry.day_count));
            counts.set(day, (counts.get(day) ?? 0) + 1);
        }
        const rows = Array.from(counts.entries()).sort((a, b) => a[0] - b[0]);
        const maxCount = rows.reduce((max, [, count]) => Math.max(max, count), 1);
        return { rows, maxCount };
    };

    const renderLeaderboardTable = (entries: LeaderboardEntry[]) => {
        if (entries.length === 0) {
            return (
                <div className="text-center py-16 bg-[#111] border border-[#222] rounded-xl text-slate-500 italic">
                    {language === 'ko' ? '해당 기간의 기록이 없습니다.' : 'No records for this period.'}
                </div>
            );
        }

        return (
            <div className="overflow-hidden border border-[#333] rounded-xl bg-[#111] shadow-2xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[#1a1a1a] border-b border-[#333] text-[#9f752a] text-xs uppercase tracking-widest">
                            <th className="px-6 py-4 font-bold">{language === 'ko' ? '순위' : 'Rank'}</th>
                            <th className="px-6 py-4 font-bold">{language === 'ko' ? '이름' : 'Name'}</th>
                            <th className="px-6 py-4 font-bold text-center">{language === 'ko' ? '생존일' : 'Days'}</th>
                            <th className="px-6 py-4 font-bold">{language === 'ko' ? '결말' : 'Fate'}</th>
                            <th className="px-6 py-4 font-bold text-right">{language === 'ko' ? '날짜' : 'Date'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.map((entry, idx) => (
                            <tr
                                key={entry.id}
                                className={`border-b border-[#222] hover:bg-white/[0.02] transition-colors ${idx < 3 ? 'bg-[#9f752a]/5' : ''}`}
                            >
                                <td className="px-6 py-4">
                                    <span className={`text-lg font-black ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-orange-400' : 'text-slate-600'}`}>
                                        #{idx + 1}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => setSelectedEntry(entry)}
                                        className="font-bold text-[#e2c178] hover:text-white text-base transition-colors text-left"
                                    >
                                        {entry.settler_name}
                                    </button>
                                    <div className="text-[10px] text-slate-500 uppercase font-mono">{entry.account_id}</div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="text-xl font-mono font-bold text-[#e7c07a]">{entry.day_count}</span>
                                    <span className="text-xs text-slate-500 ml-1">Days</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-xs font-bold px-2 py-1 rounded bg-black/40 border border-white/5 ${getExitTypeColor(entry.exit_type)}`}>
                                        {getExitTypeLabel(entry.exit_type)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right text-[10px] text-slate-500 font-mono">
                                    {new Date(entry.created_at).toLocaleString('ko-KR', {
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: false
                                    })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderDistributionTable = (entries: LeaderboardEntry[]) => {
        if (entries.length === 0) {
            return (
                <div className="text-center py-16 bg-[#111] border border-[#222] rounded-xl text-slate-500 italic">
                    {language === 'ko' ? '해당 기간의 기록이 없습니다.' : 'No records for this period.'}
                </div>
            );
        }

        const { rows, maxCount } = buildDistribution(entries);

        return (
            <div className="overflow-hidden border border-[#333] rounded-xl bg-[#111] shadow-2xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[#1a1a1a] border-b border-[#333] text-[#9f752a] text-xs uppercase tracking-widest">
                            <th className="px-6 py-4 font-bold">{language === 'ko' ? '스테이지' : 'Stage'}</th>
                            <th className="px-6 py-4 font-bold">{language === 'ko' ? '종료 수' : 'Count'}</th>
                            <th className="px-6 py-4 font-bold">{language === 'ko' ? '분포' : 'Distribution'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(([day, count]) => {
                            const widthPct = Math.max(2, Math.round((count / maxCount) * 100));
                            return (
                                <tr key={day} className="border-b border-[#222] hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="text-lg font-mono font-bold text-[#e7c07a]">{day}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-slate-300 font-mono">{count}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="h-3 w-full bg-black/40 border border-white/5 rounded">
                                            <div
                                                className="h-full rounded bg-[#e2c178]"
                                                style={{ width: `${widthPct}%` }}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-slate-200 p-4 md:p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex items-center justify-between border-b border-[#333] pb-6">
                    <div>
                        <h1 className="text-4xl font-bold text-[#e7c07a] tracking-tight mb-2">
                            🏆 {language === 'ko' ? '생존 리더보드' : 'Survival Leaderboard'}
                        </h1>
                        <p className="text-slate-400">
                            {language === 'ko' ? '가장 오래 살아남은 정착민들의 기록입니다.' : 'Historical records of the longest surviving settlers.'}
                        </p>
                    </div>
                    <button
                        onClick={() => router.push('/')}
                        className="px-6 py-2 bg-[#1c3d5a] hover:bg-[#2c5282] text-white border border-blue-900 rounded transition-colors text-sm font-bold"
                    >
                        {language === 'ko' ? '홈으로' : 'Home'}
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setActiveTab('leaderboard')}
                        className={`px-4 py-2 text-sm font-bold border rounded transition-colors ${
                            activeTab === 'leaderboard'
                                ? 'bg-[#9f752a]/20 border-[#9f752a] text-[#e7c07a]'
                                : 'bg-transparent border-[#333] text-slate-400 hover:text-slate-200 hover:border-[#666]'
                        }`}
                    >
                        {language === 'ko' ? '리더보드' : 'Leaderboard'}
                    </button>
                    <button
                        onClick={() => setActiveTab('distribution')}
                        className={`px-4 py-2 text-sm font-bold border rounded transition-colors ${
                            activeTab === 'distribution'
                                ? 'bg-[#9f752a]/20 border-[#9f752a] text-[#e7c07a]'
                                : 'bg-transparent border-[#333] text-slate-400 hover:text-slate-200 hover:border-[#666]'
                        }`}
                    >
                        {language === 'ko' ? '분포' : 'Distribution'}
                    </button>
                </div>

                {/* Main Content: Leaderboard + Chat */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Leaderboard - 2/3 width */}
                    <div className="lg:col-span-2">
                        {loading ? (
                            <div className="text-center py-20 italic text-slate-500 animate-pulse">
                                {language === 'ko' ? '데이터를 집계 중...' : 'Aggregating records...'}
                            </div>
                        ) : error ? (
                            <div className="p-8 bg-red-900/10 border border-red-900/40 rounded-lg text-center text-red-400">
                                {error}
                                <div className="mt-4 text-xs opacity-60">
                                    {language === 'ko'
                                        ? '아직 leaderboard_scores 테이블이 없거나 권한이 없을 수 있습니다.'
                                        : 'Table leaderboard_scores might be missing or permission denied.'}
                                </div>
                            </div>
                        ) : scores.length === 0 ? (
                            <div className="text-center py-20 bg-[#111] border border-[#222] rounded-xl text-slate-500 italic">
                                {language === 'ko' ? '아직 기록된 점수가 없습니다. 첫 정복자가 되어보세요!' : 'No records yet. Be the first conqueror!'}
                            </div>
                        ) : (
                            <div className="space-y-10">
                                <section className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-lg font-bold text-[#e2c178]">
                                            {language === 'ko' ? '최근 24시간' : 'Last 24 Hours'}
                                        </h2>
                                        <span className="text-xs text-slate-500 font-mono">{last24hScores.length}</span>
                                    </div>
                                    {activeTab === 'leaderboard'
                                        ? renderLeaderboardTable(last24hScores)
                                        : renderDistributionTable(last24hScores)}
                                </section>
                                <section className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-lg font-bold text-[#e2c178]">
                                            {language === 'ko' ? '최근 7일' : 'Last 7 Days'}
                                        </h2>
                                        <span className="text-xs text-slate-500 font-mono">{last7dScores.length}</span>
                                    </div>
                                    {activeTab === 'leaderboard'
                                        ? renderLeaderboardTable(last7dScores)
                                        : renderDistributionTable(last7dScores)}
                                </section>
                                <section className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-lg font-bold text-[#e2c178]">
                                            {language === 'ko' ? '역대' : 'All Time'}
                                        </h2>
                                        <span className="text-xs text-slate-500 font-mono">{sortedScores.length}</span>
                                    </div>
                                    {activeTab === 'leaderboard'
                                        ? renderLeaderboardTable(sortedScores)
                                        : renderDistributionTable(sortedScores)}
                                </section>
                            </div>
                        )}
                    </div>

                    {/* Chat - 1/3 width */}
                    <div className="lg:col-span-1">
                        <ChatBox />
                    </div>
                </div>

                <div className="text-center space-y-4 pt-10">
                    <p className="text-xs text-slate-600 italic">
                        {language === 'ko' ? '* 우주선 탈출 성공 시 생존일 가점이 부여됩니다.' : '* Bonuses are applied for successful ship escapes.'}
                    </p>
                    <button
                        onClick={() => router.push('/test/intro')}
                        className="px-10 py-4 bg-[#8b5a2b] hover:bg-[#a06b35] text-white font-bold text-lg shadow-[0_4px_0_#5a3a1a] active:shadow-none active:translate-y-1 transition-all"
                    >
                        {language === 'ko' ? '새 정착민으로 도전하기' : 'Try with New Settler'}
                    </button>
                </div>
            </div>

            {/* Character Stats Modal */}
            {selectedEntry && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[#1b1b1b] border border-[#6b6b6b] p-1 shadow-2xl flex flex-col w-full max-w-4xl max-h-[90vh] overflow-hidden">
                        {/* Header: Settler basic info */}
                        <div className="bg-[#2a2a2a] p-4 flex justify-between items-start border-b border-[#444]">
                            <div className="flex gap-4 items-center">
                                <div className="w-16 h-16 bg-[#111] border border-[#444] flex items-center justify-center text-4xl">
                                    {selectedEntry.gender === 'Female' ? '👩' : '👨'}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-[#e2c178] leading-tight">{selectedEntry.settler_name}</h2>
                                    <div className="text-xs text-slate-400 mt-1 uppercase font-mono tracking-wider">
                                        {selectedEntry.gender === 'Female' ? 'Female' : 'Male'}, {selectedEntry.age || 20} {language === 'ko' ? '세' : 'years old'} • {selectedEntry.mbti || 'Unknown'}
                                    </div>
                                    <div className="mt-1">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase ${getExitTypeColor(selectedEntry.exit_type)}`}>
                                            {getExitTypeLabel(selectedEntry.exit_type)} - {selectedEntry.day_count} DAYS
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedEntry(null)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                            {(!selectedEntry.traits || selectedEntry.traits.length === 0) && (!selectedEntry.skills || selectedEntry.skills.length === 0) ? (
                                <div className="py-20 text-center space-y-4 bg-[#111] border border-[#333] rounded-lg">
                                    <div className="text-4xl opacity-30">📜</div>
                                    <div className="text-slate-400">
                                        {language === 'ko'
                                            ? '이 정착민은 상세 정보 기록 기능 도입 전에 등록되었습니다.'
                                            : 'This settler was registered before detailed stats were added.'}
                                    </div>
                                    <div className="text-xs text-slate-600 italic">
                                        {language === 'ko'
                                            ? '(상세 스탯을 보려면 새로 시뮬레이션을 완료해야 합니다)'
                                            : '(New simulation needs to be completed to see detailed stats)'}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col md:flex-row gap-8">
                                    {/* Left Column: Backstory & Traits */}
                                    <div className="flex-1 space-y-8">
                                        {/* Backstory */}
                                        <section>
                                            <h3 className="text-xs font-bold text-[#e2c178] uppercase border-b border-[#444] pb-1 mb-4">{language === 'ko' ? '배경 정보' : 'Background'}</h3>
                                            <div className="space-y-4">
                                                {selectedEntry.backstory_childhood && (
                                                    <div className="bg-[#222] p-3 border border-[#333]">
                                                        <div className="text-[10px] text-slate-500 uppercase font-mono mb-1">{language === 'ko' ? '유년기' : 'Childhood'}</div>
                                                        <div className="text-sm font-bold text-slate-200 mb-1">{selectedEntry.backstory_childhood.title}</div>
                                                        <div className="text-xs text-slate-400 leading-relaxed italic">"{selectedEntry.backstory_childhood.description}"</div>
                                                    </div>
                                                )}
                                                {selectedEntry.backstory_adulthood && (
                                                    <div className="bg-[#222] p-3 border border-[#333]">
                                                        <div className="text-[10px] text-slate-500 uppercase font-mono mb-1">{language === 'ko' ? '성인기' : 'Adulthood'}</div>
                                                        <div className="text-sm font-bold text-slate-200 mb-1">{selectedEntry.backstory_adulthood.title}</div>
                                                        <div className="text-xs text-slate-400 leading-relaxed italic">"{selectedEntry.backstory_adulthood.description}"</div>
                                                    </div>
                                                )}
                                            </div>
                                        </section>

                                        {/* Trait List */}
                                        <section>
                                            <h3 className="text-xs font-bold text-[#e2c178] uppercase border-b border-[#444] pb-1 mb-4">{language === 'ko' ? '보유 특성' : 'Traits'}</h3>
                                            <div className="grid grid-cols-1 gap-2">
                                                {selectedEntry.traits?.map((trait: Trait, i: number) => (
                                                    <div key={i} className="bg-[#222] p-3 border border-[#333] hover:border-[#555] transition-colors">
                                                        <div className="text-sm font-bold text-white mb-1">{trait.name}</div>
                                                        <div className="text-[10px] text-slate-400 leading-tight line-clamp-2">{trait.description}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>

                                        {/* Incapabilities */}
                                        {selectedEntry.incapabilities && selectedEntry.incapabilities.length > 0 && (
                                            <section>
                                                <h3 className="text-xs font-bold text-red-500 uppercase border-b border-[#444] pb-1 mb-4">{language === 'ko' ? '결격 사항' : 'Incapacities'}</h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedEntry.incapabilities.map((incap: string, i: number) => (
                                                        <span key={i} className="px-2 py-1 bg-red-900/20 border border-red-900/50 text-red-400 text-[10px] font-bold uppercase tracking-wider">
                                                            {getSkillName(incap)}
                                                        </span>
                                                    ))}
                                                </div>
                                            </section>
                                        )}
                                    </div>

                                    {/* Right Column: Skills */}
                                    <div className="flex-1">
                                        <section>
                                            <h3 className="text-xs font-bold text-[#e2c178] uppercase border-b border-[#444] pb-1 mb-4">{language === 'ko' ? '보유 기술' : 'Skills'}</h3>
                                            <div className="space-y-3 bg-[#111] p-4 border border-[#333]">
                                                {selectedEntry.skills?.map((skill: Skill, i: number) => {
                                                    const levelRatio = (skill.level / 20) * 100;
                                                    const passionIcon = skill.passion === 'Major' ? '🔥🔥' : skill.passion === 'Minor' ? '🔥' : '';

                                                    return (
                                                        <div key={i} className="space-y-1">
                                                            <div className="flex justify-between items-end">
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="text-[11px] font-bold text-slate-300">{getSkillName(skill.name)}</span>
                                                                    <span className="text-[10px] leading-none mb-0.5">{passionIcon}</span>
                                                                </div>
                                                                <span className="text-[11px] font-mono font-bold text-white">{skill.level}</span>
                                                            </div>
                                                            <div className="h-2 bg-[#222] border border-[#333] relative overflow-hidden">
                                                                <div
                                                                    className="h-full bg-slate-500 transition-all duration-1000"
                                                                    style={{ width: `${levelRatio}%` }}
                                                                />
                                                                {/* Ticks */}
                                                                <div className="absolute inset-0 flex justify-between px-[10%] pointer-events-none">
                                                                    <div className="border-l border-black/30 h-full" />
                                                                    <div className="border-l border-black/30 h-full" />
                                                                    <div className="border-l border-black/30 h-full" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </section>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-[#2b2b2b] border-t border-[#6b6b6b] p-3 text-center">
                            <p className="text-[10px] text-gray-500 italic uppercase tracking-widest">
                                {language === 'ko' ? '변방계 생존 기록 데이터베이스' : 'Rimworld Survival Record Database'}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
