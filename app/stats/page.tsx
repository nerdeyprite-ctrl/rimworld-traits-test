
"use client";

import React, { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useLanguage } from '../../context/LanguageContext';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import Link from 'next/link';

// Mock Data for fallback
const MOCK_TOTAL_COUNT = 1234;
const MOCK_TOTAL_COUNT_WEEK = 234;
const MOCK_MBTI_DATA = [
    { name: 'ENTJ', value: 400 },
    { name: 'INFP', value: 300 },
    { name: 'ESTP', value: 300 },
    { name: 'ISFJ', value: 200 }
];
const MOCK_TRAIT_DATA = [
    { name: '낙천적', value: 150 },
    { name: '식인종', value: 120 },
    { name: '피의 갈망', value: 100 },
    { name: '강인함', value: 90 },
    { name: '다정함', value: 80 }
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function StatsPage() {
    const { t } = useLanguage();
    const [totalCount, setTotalCount] = useState<number>(0);
    const [mbtiData, setMbtiData] = useState<any[]>([]);
    const [traitData, setTraitData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDbConnected, setIsDbConnected] = useState(false);
    const [statsRange, setStatsRange] = useState<'week' | 'all'>('week');

    useEffect(() => {
        if (isSupabaseConfigured()) {
            fetchStats(statsRange);
        } else {
            // Use Mock Data if DB is not configured
            setIsDbConnected(false);
            setTotalCount(statsRange === 'week' ? MOCK_TOTAL_COUNT_WEEK : MOCK_TOTAL_COUNT);
            setMbtiData(MOCK_MBTI_DATA);
            setTraitData(MOCK_TRAIT_DATA);
            setIsLoading(false);
        }
    }, [statsRange]);

    const getWeekStartIso = () => {
        const now = new Date();
        const day = now.getDay(); // 0 (Sun) - 6 (Sat)
        const diffToMonday = (day + 6) % 7;
        const start = new Date(now);
        start.setDate(now.getDate() - diffToMonday);
        start.setHours(0, 0, 0, 0);
        return start.toISOString();
    };

    const fetchStats = async (range: 'week' | 'all') => {
        try {
            setIsLoading(true);
            const weekStartIso = range === 'week' ? getWeekStartIso() : null;

            // 1. Total Count
            let countQuery = supabase
                .from('test_results')
                .select('*', { count: 'exact', head: true });
            if (weekStartIso) {
                countQuery = countQuery.gte('created_at', weekStartIso);
            }
            const { count, error: countError } = await countQuery;

            if (!countError) {
                setTotalCount(count || 0);
                setIsDbConnected(true);
            }

            // 2. MBTI Distribution
            let resultsQuery = supabase
                .from('test_results')
                .select('mbti, traits')
                .limit(1000);
            if (weekStartIso) {
                resultsQuery = resultsQuery.gte('created_at', weekStartIso);
            }
            const { data: results, error: dataError } = await resultsQuery;

            if (results) {
                // Process MBTI
                const mbtiCounts: Record<string, number> = {};
                results.forEach(r => {
                    if (r.mbti) mbtiCounts[r.mbti] = (mbtiCounts[r.mbti] || 0) + 1;
                });
                const mbtiChartData = Object.entries(mbtiCounts)
                    .map(([name, value]) => ({ name, value }))
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 10);
                setMbtiData(mbtiChartData);

                // Process Traits
                const traitCounts: Record<string, number> = {};
                results.forEach(r => {
                    if (Array.isArray(r.traits)) {
                        r.traits.forEach((t: any) => {
                            const tName = typeof t === 'string' ? t : (t.name || t.id);
                            traitCounts[tName] = (traitCounts[tName] || 0) + 1;
                        });
                    }
                });
                const traitChartData = Object.entries(traitCounts)
                    .map(([name, value]) => ({ name, value }))
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 10);
                setTraitData(traitChartData);
            }

        } catch (error) {
            console.error("Failed to fetch stats:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--rimworld-bg)] text-[var(--rimworld-text)] p-4 md:p-8 font-sans transition-colors duration-300">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 border-b border-[var(--rimworld-border)] pb-4 gap-4">
                    <h1 className="text-3xl font-bold text-[var(--rimworld-highlight)]">
                        📊 {t('app_title')} {t('statistics') || '통계'}
                    </h1>
                    <div className="flex items-center gap-3">
                        <div className="flex bg-[var(--rimworld-panel)] border border-[var(--rimworld-border)] rounded overflow-hidden text-sm">
                            <button
                                className={`px-3 py-2 ${statsRange === 'week' ? 'bg-[#9f752a] text-white' : 'text-[var(--rimworld-text)] hover:bg-gray-700/20'}`}
                                onClick={() => setStatsRange('week')}
                            >
                                이번 주
                            </button>
                            <button
                                className={`px-3 py-2 ${statsRange === 'all' ? 'bg-[#9f752a] text-white' : 'text-[var(--rimworld-text)] hover:bg-gray-700/20'}`}
                                onClick={() => setStatsRange('all')}
                            >
                                전체
                            </button>
                        </div>
                        <Link href="/" className="px-4 py-2 bg-[var(--rimworld-panel)] border border-[var(--rimworld-border)] hover:bg-gray-700/20 rounded text-sm text-[var(--rimworld-text)] transition-colors">
                            {t('back_home')}
                        </Link>
                    </div>
                </div>

                {/* Connection Status Warning */}
                {!isDbConnected && !isLoading && (
                    <div className="bg-yellow-900/10 border border-yellow-700/50 p-4 rounded mb-8 text-yellow-600 dark:text-yellow-200 text-sm animate-pulse">
                        🚧 <strong>Database Not Connected:</strong> Currently showing demo data. Please configure Supabase keys in .env.local.
                    </div>
                )}

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-[var(--rimworld-card)] p-6 rounded-lg border border-[var(--rimworld-border)] shadow-lg">
                        <h3 className="opacity-60 text-sm uppercase tracking-wider mb-2">
                            {statsRange === 'week' ? 'This Week Participants' : 'Total Participants'}
                        </h3>
                        <p className="text-4xl font-bold">{totalCount.toLocaleString()}</p>
                    </div>
                    <div className="bg-[var(--rimworld-card)] p-6 rounded-lg border border-[var(--rimworld-border)] shadow-lg">
                        <h3 className="opacity-60 text-sm uppercase tracking-wider mb-2">Most Common Type</h3>
                        <p className="text-4xl font-bold text-[#00C49F]">{mbtiData[0]?.name || '-'}</p>
                    </div>
                    <div className="bg-[var(--rimworld-card)] p-6 rounded-lg border border-[var(--rimworld-border)] shadow-lg">
                        <h3 className="opacity-60 text-sm uppercase tracking-wider mb-2">Top Trait</h3>
                        <p className="text-4xl font-bold text-[#FFBB28]">{traitData[0]?.name || '-'}</p>
                    </div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    {/* MBTI Chart */}
                    <div className="bg-[var(--rimworld-card)] p-6 rounded-lg border border-[var(--rimworld-border)] shadow-lg">
                        <h3 className="text-xl font-bold mb-6 border-l-4 border-[#00C49F] pl-3">MBTI Distribution</h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={mbtiData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" />
                                    <XAxis type="number" stroke="var(--rimworld-text)" opacity={0.5} />
                                    <YAxis dataKey="name" type="category" stroke="var(--rimworld-text)" width={60} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--rimworld-panel)', borderColor: 'var(--rimworld-border)', color: 'var(--rimworld-text)' }}
                                        itemStyle={{ color: '#00C49F' }}
                                    />
                                    <Bar dataKey="value" fill="#00C49F" radius={[0, 4, 4, 0]}>
                                        {mbtiData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Traits Pie Chart */}
                    <div className="bg-[var(--rimworld-card)] p-6 rounded-lg border border-[var(--rimworld-border)] shadow-lg">
                        <h3 className="text-xl font-bold mb-6 border-l-4 border-[#FFBB28] pl-3">Top 10 Traits</h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={traitData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {traitData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: 'var(--rimworld-panel)', borderColor: 'var(--rimworld-border)', color: 'var(--rimworld-text)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="text-center opacity-40 text-xs mt-12 pb-8">
                    Data is collected anonymously for statistical purposes only.<br />
                    Powered by Rimworld Traits Test
                </div>
            </div>
        </div>
    );
}
