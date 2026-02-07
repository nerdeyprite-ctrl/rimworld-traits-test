"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../../context/LanguageContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export default function SettlersClient() {
    const { language } = useLanguage();
    const router = useRouter();
    const [settlers, setSettlers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadSettlers = async () => {
            if (!isSupabaseConfigured()) {
                setError(language === 'ko' ? '시스템 설정(DB)이 완료되지 않았습니다.' : 'Database not configured.');
                setLoading(false);
                return;
            }

            const accountId = typeof window !== 'undefined' ? localStorage.getItem('settler_account_id') : null;
            if (!accountId) {
                setError(language === 'ko' ? '로그인이 필요합니다.' : 'Login required.');
                setLoading(false);
                return;
            }

            try {
                const { data, error: fetchError } = await supabase
                    .from('settler_profiles')
                    .select('*')
                    .eq('account_id', accountId)
                    .order('created_at', { ascending: false });

                if (fetchError) throw fetchError;
                setSettlers(data || []);
            } catch (err) {
                console.error('Failed to load settlers:', err);
                setError(language === 'ko' ? '정착민 목록을 불러오지 못했습니다.' : 'Failed to load settlers.');
            } finally {
                setLoading(false);
            }
        };

        loadSettlers();
    }, [language]);

    const handleDeleteSettler = async (e: React.MouseEvent, settlerId: string) => {
        e.stopPropagation();
        if (!confirm(language === 'ko' ? '정말 이 정착민을 삭제하시겠습니까?' : 'Are you sure you want to delete this settler?')) {
            return;
        }

        try {
            console.log('Attempting to delete settler:', settlerId);
            const { error: delError } = await supabase
                .from('settler_profiles')
                .delete()
                .eq('id', settlerId);

            if (delError) {
                console.error('Supabase delete error:', delError);
                throw delError;
            }

            console.log('Successfully deleted settler from DB.');
            setSettlers(prev => prev.filter(s => s.id !== settlerId));
            alert(language === 'ko' ? '정착민이 삭제되었습니다.' : 'Settler deleted.');
        } catch (err) {
            console.error('Delete failed:', err);
            alert(language === 'ko' ? '삭제에 실패했습니다. 네트워크 상태를 확인해주세요.' : 'Delete failed. Please check your network.');
        }
    };

    const handleSelectSettler = (settlerId: string) => {
        router.push(`/simulation?profile=${settlerId}`);
    };

    return (
        <div className="max-w-4xl mx-auto py-10 px-4 space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#333] pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-[#e7c07a] tracking-tight mb-2">
                        {language === 'ko' ? '정착민 보관함' : 'Settler Storage'}
                    </h1>
                    <p className="text-slate-400">
                        {language === 'ko' ? '당신이 저장한 정착민들을 관리하고 시뮬레이션을 시작하세요.' : 'Manage your saved settlers and start simulation.'}
                    </p>
                </div>
                <button
                    onClick={() => router.push('/')}
                    className="self-start px-6 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white border border-[#444] rounded transition-colors text-sm font-medium"
                >
                    {language === 'ko' ? '홈으로 돌아가기' : 'Back to Home'}
                </button>
            </div>

            {loading && (
                <div className="text-center py-20">
                    <div className="inline-block w-8 h-8 border-4 border-[#9f752a] border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-400">{language === 'ko' ? '정착민 목록을 불러오는 중...' : 'Loading settlers...'}</p>
                </div>
            )}

            {error && (
                <div className="bg-[#2a1a1a] border border-red-900/50 p-6 rounded-lg text-center">
                    <p className="text-red-400 mb-4 font-medium">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-300 border border-red-900/50 rounded transition-all"
                    >
                        {language === 'ko' ? '다시 시도' : 'Retry'}
                    </button>
                </div>
            )}

            {!loading && !error && settlers.length === 0 && (
                <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-12 text-center">
                    <div className="mb-6 opacity-20 flex justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    </div>
                    <p className="text-slate-400 mb-8 text-lg">
                        {language === 'ko' ? '아직 저장된 정착민이 없습니다.' : 'No saved settlers found.'}
                    </p>
                    <button
                        onClick={() => router.push('/test/intro')}
                        className="px-8 py-3 bg-[#8b5a2b] hover:bg-[#a06b35] text-white font-bold rounded shadow-lg transition-transform active:scale-95"
                    >
                        {language === 'ko' ? '첫 정착민 성격 검사하기' : 'Test First Settler'}
                    </button>
                </div>
            )}

            {!loading && !error && settlers.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {settlers.map((settler) => (
                        <div
                            key={settler.id}
                            className="bg-[#111] border border-[#333] hover:border-[#9f752a] rounded-xl p-6 transition-all group relative flex flex-col h-full"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-[#e7c07a] transition-colors">
                                        {settler.name || (language === 'ko' ? '무명 정착민' : 'Unnamed Settler')}
                                    </h3>
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <span>{settler.gender}</span>
                                        <span className="opacity-30">|</span>
                                        <span>{language === 'ko' ? `나이 ${settler.age}` : `Age ${settler.age}`}</span>
                                        <span className="opacity-30">|</span>
                                        <span suppressHydrationWarning>
                                            {new Date(settler.created_at).toLocaleString('ko-KR', {
                                                year: 'numeric',
                                                month: '2-digit',
                                                day: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                hour12: false
                                            })}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => handleDeleteSettler(e, settler.id)}
                                    className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                    title={language === 'ko' ? '삭제' : 'Delete'}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                </button>
                            </div>

                            <div className="space-y-4 mb-8 flex-grow">
                                <div className="flex flex-wrap gap-2">
                                    <span className="px-2 py-0.5 bg-[#1c3d5a] text-[#a5d8ff] text-[11px] font-bold rounded uppercase tracking-wider">
                                        {settler.mbti}
                                    </span>
                                    {(settler.traits || []).slice(0, 4).map((trait: any, idx: number) => (
                                        <span key={idx} className="px-2 py-0.5 bg-[#2d3748] text-slate-300 text-[11px] rounded">
                                            {typeof trait === 'string' ? trait : (trait.name || trait.id || JSON.stringify(trait))}
                                        </span>
                                    ))}
                                </div>
                                <div className="text-xs text-slate-500 italic line-clamp-2">
                                    {typeof settler.backstory_childhood === 'string' ? settler.backstory_childhood : (settler.backstory_childhood?.title || settler.backstory_childhood?.id || '')}
                                    {' - '}
                                    {typeof settler.backstory_adulthood === 'string' ? settler.backstory_adulthood : (settler.backstory_adulthood?.title || settler.backstory_adulthood?.id || '')}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => router.push(`/result?profile=${settler.id}`)}
                                    className="py-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white font-bold text-sm rounded border border-[#444] transition-colors flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                                    {language === 'ko' ? '상세보기' : 'Details'}
                                </button>
                                <button
                                    onClick={() => handleSelectSettler(settler.id)}
                                    className="py-3 bg-[#6e4e1e] hover:bg-[#856026] text-white font-bold text-sm rounded border border-[#9f752a] transition-colors flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                                    {language === 'ko' ? '시뮬레이션' : 'Simulation'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
