"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../../context/LanguageContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Trait, Skill, Backstory } from '../../types/rimworld';

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

            {/* Character Stats Modal */}
            {selectedEntry && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[#1b1b1b] border border-[#6b6b6b] p-1 shadow-2xl flex flex-col w-full max-w-4xl max-h-[90vh] overflow-hidden">
                        <div className="flex justify-between items-center bg-[#2b2b2b] border-b border-[#6b6b6b] p-4">
                            <h2 className="text-[#e2c178] font-bold tracking-widest flex items-center gap-2">
                                <span className="text-xs text-slate-500">COLONIST_PROFILE:</span>
                                {selectedEntry.settler_name}
                            </h2>
                            <button
                                onClick={() => setSelectedEntry(null)}
                                className="w-8 h-8 flex items-center justify-center bg-[#111] border border-[#555] text-white hover:bg-red-900 transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="overflow-y-auto p-4 md:p-6 bg-[#111]/50 space-y-6">
                            {selectedEntry.traits && selectedEntry.traits.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Left: Info & Backstory */}
                                    <div className="space-y-4">
                                        <div className="bg-[#111] border border-[#6b6b6b] p-3 text-center">
                                            <div className="text-[10px] text-gray-500 mb-1 uppercase tracking-widest">{t('gender')} / {t('age')}</div>
                                            <div className="text-lg text-white font-bold">
                                                {selectedEntry.gender === 'Male' ? '♂ ' + t('male') : '♀ ' + t('female')} / {selectedEntry.age}
                                            </div>
                                            {selectedEntry.mbti && (
                                                <div className="mt-2 inline-block bg-[#333] border border-[#555] px-3 py-1 rounded text-[10px] text-[#9f752a] font-bold tracking-widest shadow-sm">
                                                    {selectedEntry.mbti}
                                                </div>
                                            )}
                                        </div>

                                        <div className="bg-[#111] border border-[#6b6b6b] p-3 space-y-4">
                                            {selectedEntry.backstory_childhood && (
                                                <div>
                                                    <h4 className="text-[#a2a2a2] font-semibold mb-1 text-xs uppercase">{t('childhood')}</h4>
                                                    <div className="text-[#e2c178] font-bold text-sm">{selectedEntry.backstory_childhood.title}</div>
                                                    <p className="text-gray-400 text-[10px] italic leading-tight mt-1">{selectedEntry.backstory_childhood.description}</p>
                                                </div>
                                            )}
                                            {selectedEntry.backstory_adulthood && (
                                                <div>
                                                    <h4 className="text-[#a2a2a2] font-semibold mb-1 text-xs uppercase">{t('adulthood')}</h4>
                                                    <div className="text-[#e2c178] font-bold text-sm">{selectedEntry.backstory_adulthood.title}</div>
                                                    <p className="text-gray-400 text-[10px] italic leading-tight mt-1">{selectedEntry.backstory_adulthood.description}</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="bg-[#111] border border-[#6b6b6b] p-3">
                                            <h4 className="text-[#ff4d4d] font-bold text-xs mb-2 border-b border-gray-700 pb-1 uppercase">{t('incapable')}</h4>
                                            {selectedEntry.incapabilities && selectedEntry.incapabilities.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {selectedEntry.incapabilities.map(skill => (
                                                        <span key={skill} className="px-1.5 py-0.5 bg-[#3a1a1a] border border-[#ff4d4d] text-[#ff4d4d] text-[9px] font-bold rounded uppercase">
                                                            {getSkillName(skill)}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-gray-500 text-[10px] italic">{t('none')}</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Middle: Traits */}
                                    <div className="space-y-3">
                                        <h3 className="text-[#9f752a] font-bold text-sm border-b border-gray-600 pb-1 uppercase">{t('traits')}</h3>
                                        <div className="space-y-2">
                                            {selectedEntry.traits.map(trait => (
                                                <div key={trait.id} className="bg-[#222] border border-[#333] p-2 hover:border-[#555] transition-colors">
                                                    <div className="text-[#ffc45d] font-bold text-xs">{trait.name}</div>
                                                    <p className="text-gray-400 text-[9px] mt-1 leading-relaxed">{trait.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Right: Skills */}
                                    <div className="space-y-3">
                                        <h3 className="text-[#9f752a] font-bold text-sm border-b border-gray-600 pb-1 uppercase">{t('skills')}</h3>
                                        <div className="space-y-1.5">
                                            {selectedEntry.skills?.map((skill, idx) => {
                                                const isIncapable = selectedEntry.incapabilities?.includes(skill.name);
                                                const level = skill.level;
                                                const fire = skill.passion === 'Major' ? '🔥🔥' : (skill.passion === 'Minor' ? '🔥' : '');
                                                return (
                                                    <div key={idx} className="flex flex-col opacity-90">
                                                        <div className="flex justify-between items-end text-[10px] mb-0.5">
                                                            <span className={isIncapable ? 'text-gray-500 line-through' : 'text-gray-300 font-bold'}>
                                                                {getSkillName(skill.name)}
                                                            </span>
                                                            <div className="flex items-center">
                                                                {!isIncapable && <span className="text-[#ffb000] text-[8px] mr-1">{fire}</span>}
                                                                <span className="text-white font-mono">{isIncapable ? '-' : level}</span>
                                                            </div>
                                                        </div>
                                                        <div className="w-full h-1.5 bg-[#111] border border-gray-800 relative">
                                                            {!isIncapable && (
                                                                <div className="h-full bg-[#5b5b5b]" style={{ width: `${(level / 20) * 100}%` }}></div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-20 text-slate-500 italic">
                                    {language === 'ko' ? '이 정착민의 상세 능력치 정보가 없습니다.' : 'Detailed stats for this colonist are unavailable.'}
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
