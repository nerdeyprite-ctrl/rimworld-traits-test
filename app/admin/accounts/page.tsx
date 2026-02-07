"use client";

import React, { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { useLanguage } from '../../../context/LanguageContext';
import Link from 'next/link';

type AccountEntry = {
    id: string;
    created_at: string;
};

export default function AdminAccountsPage() {
    const { language } = useLanguage();
    const [accounts, setAccounts] = useState<AccountEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAccounts = async () => {
            if (!isSupabaseConfigured()) {
                setError(language === 'ko' ? 'DB 설정이 완료되지 않았습니다.' : 'Database not configured.');
                setLoading(false);
                return;
            }

            try {
                const { data, error: fetchError } = await supabase
                    .from('settler_accounts')
                    .select('id, created_at')
                    .order('created_at', { ascending: false });

                if (fetchError) throw fetchError;
                setAccounts(data || []);
            } catch (err) {
                console.error('Failed to fetch accounts:', err);
                setError(language === 'ko' ? '계정 데이터를 가져오지 못했습니다.' : 'Failed to fetch account data.');
            } finally {
                setLoading(false);
            }
        };

        fetchAccounts();
    }, [language]);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-slate-200 p-4 md:p-8 font-sans">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center justify-between border-b border-[#333] pb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-[#e7c07a] tracking-tight mb-2">
                            👥 {language === 'ko' ? '전체 가입 계정 목록' : 'Registered Accounts List'}
                        </h1>
                        <p className="text-slate-400">
                            {language === 'ko'
                                ? `총 ${accounts.length}명의 정착민이 가입되어 있습니다.`
                                : `Total ${accounts.length} settlers have registered.`}
                        </p>
                    </div>
                    <Link
                        href="/"
                        className="px-6 py-2 bg-[#1c3d5a] hover:bg-[#2c5282] text-white border border-blue-900 rounded transition-colors text-sm font-bold"
                    >
                        {language === 'ko' ? '홈으로' : 'Home'}
                    </Link>
                </div>

                {loading ? (
                    <div className="text-center py-20 italic text-slate-500 animate-pulse">
                        {language === 'ko' ? '계정 목록 로딩 중...' : 'Loading accounts...'}
                    </div>
                ) : error ? (
                    <div className="p-8 bg-red-900/10 border border-red-900/40 rounded-lg text-center text-red-400">
                        {error}
                        <div className="mt-4 text-xs opacity-60">
                            {language === 'ko'
                                ? 'settler_accounts 테이블에 접근할 수 없습니다.'
                                : 'Cannot access settler_accounts table.'}
                        </div>
                    </div>
                ) : accounts.length === 0 ? (
                    <div className="text-center py-20 bg-[#111] border border-[#222] rounded-xl text-slate-500 italic">
                        {language === 'ko' ? '아직 가입한 계정이 없습니다.' : 'No accounts registered yet.'}
                    </div>
                ) : (
                    <div className="overflow-hidden border border-[#333] rounded-xl bg-[#111] shadow-2xl">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#1a1a1a] border-b border-[#333] text-[#9f752a] text-xs uppercase tracking-widest">
                                    <th className="px-6 py-4 font-bold">#</th>
                                    <th className="px-6 py-4 font-bold">{language === 'ko' ? '아이디' : 'Account ID'}</th>
                                    <th className="px-6 py-4 font-bold text-right">{language === 'ko' ? '가입 일시' : 'Signed up at'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {accounts.map((acc, idx) => (
                                    <tr key={acc.id} className="border-b border-[#222] hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4 text-slate-600 font-mono text-sm leading-none">
                                            {accounts.length - idx}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-white mb-0.5">{acc.id}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-xs text-slate-500 font-mono">
                                            {new Date(acc.created_at).toLocaleString('ko-KR', {
                                                year: 'numeric',
                                                month: '2-digit',
                                                day: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                second: '2-digit',
                                                hour12: false
                                            })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="bg-[#111] border border-[#333] p-4 rounded text-center">
                    <p className="text-xs text-slate-500 italic">
                        {language === 'ko'
                            ? '이 페이지는 관리 용도로 생성되었으며, 일반 사용자에게는 노출되지 않습니다.'
                            : 'This page is for administrative use and is not exposed to general users.'}
                    </p>
                </div>
            </div>
        </div>
    );
}
