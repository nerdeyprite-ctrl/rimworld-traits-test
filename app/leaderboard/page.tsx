"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../../context/LanguageContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

type LeaderboardEntry = {
    id: number;
    created_at: string;
    settler_name: string;
    day_count: number;
    exit_type: 'death' | 'escape' | 'stay';
    account_id: string;
};

export default function LeaderboardPage() {
    const { language } = useLanguage();
    const router = useRouter();
    const [scores, setScores] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-slate-200 p-4 md:p-8 font-sans">
            <div className="max-w-4xl mx-auto space-y-8">
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
                                {scores.map((entry, idx) => (
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
                                            <div className="font-bold text-white text-base">{entry.settler_name}</div>
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
                )}

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
        </div>
    );
}
