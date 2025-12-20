
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

    useEffect(() => {
        if (isSupabaseConfigured()) {
            fetchStats();
        } else {
            // Use Mock Data if DB is not configured
            setIsDbConnected(false);
            setTotalCount(MOCK_TOTAL_COUNT);
            setMbtiData(MOCK_MBTI_DATA);
            setTraitData(MOCK_TRAIT_DATA);
            setIsLoading(false);
        }
    }, []);

    const fetchStats = async () => {
        try {
            setIsLoading(true);

            // 1. Total Count
            const { count, error: countError } = await supabase
                .from('test_results')
                .select('*', { count: 'exact', head: true });

            if (!countError) {
                setTotalCount(count || 0);
                setIsDbConnected(true);
            }

            // 2. MBTI Distribution (Requires RPC or client-side processing)
            // For simplicity, we fetch all (limit 1000) and process, or use a customized view if available.
            // Using a simple approximation here: fetch last 1000 records
            const { data: results, error: dataError } = await supabase
                .from('test_results')
                .select('mbti, traits')
                .limit(1000);

            if (results) {
                // Process MBTI
                const mbtiCounts: Record<string, number> = {};
                results.forEach(r => {
                    if (r.mbti) mbtiCounts[r.mbti] = (mbtiCounts[r.mbti] || 0) + 1;
                });
                const mbtiChartData = Object.entries(mbtiCounts)
                    .map(([name, value]) => ({ name, value }))
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 10); // Top 10
                setMbtiData(mbtiChartData);

                // Process Traits
                const traitCounts: Record<string, number> = {};
                results.forEach(r => {
                    if (Array.isArray(r.traits)) {
                        r.traits.forEach((t: any) => {
                            // Assuming trait is object { id, name } or just string ID
                            const tName = typeof t === 'string' ? t : (t.name || t.id);
                            traitCounts[tName] = (traitCounts[tName] || 0) + 1;
                        });
                    }
                });
                const traitChartData = Object.entries(traitCounts)
                    .map(([name, value]) => ({ name, value }))
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 10); // Top 10
                setTraitData(traitChartData);
            }

        } catch (error) {
            console.error("Failed to fetch stats:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--rimworld-bg)] text-[var(--rimworld-text)] p-4 md:p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8 border-b border-[var(--rimworld-border-dim)] pb-4">
                    <h1 className="text-3xl font-bold text-[var(--rimworld-highlight)]">
                        📊 {t('app_title')} {t('statistics') || '통계'}
                    </h1>
                    <Link href="/" className="px-4 py-2 bg-[var(--rimworld-panel-light)] hover:bg-[var(--rimworld-panel)] border border-[var(--rimworld-border-dim)] rounded text-sm text-[var(--rimworld-text)] transition-colors">
                        {t('back_home')}
                    </Link>
                </div>

                {/* Connection Status Warning */}
                {!isDbConnected && !isLoading && (
                    <div className="bg-yellow-900/30 border border-yellow-700 p-4 rounded mb-8 text-yellow-200 text-sm animate-pulse">
                        🚧 <strong>Database Not Connected:</strong> Currently showing demo data. Please configure Supabase keys in .env.local.
                    </div>
                )}

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-[var(--rimworld-panel)] p-6 rounded-lg border border-[var(--rimworld-border-dim)] shadow-lg">
                        <h3 className="text-[var(--rimworld-text-dim)] text-sm uppercase tracking-wider mb-2">Total Participants</h3>
                        <p className="text-4xl font-bold text-[var(--rimworld-text)]">{totalCount.toLocaleString()}</p>
                    </div>
                    <div className="bg-[var(--rimworld-panel)] p-6 rounded-lg border border-[var(--rimworld-border-dim)] shadow-lg">
                        <h3 className="text-[var(--rimworld-text-dim)] text-sm uppercase tracking-wider mb-2">Most Common Type</h3>
                        <p className="text-4xl font-bold text-[#00C49F]">{mbtiData[0]?.name || '-'}</p>
                    </div>
                    <div className="bg-[var(--rimworld-panel)] p-6 rounded-lg border border-[var(--rimworld-border-dim)] shadow-lg">
                        <h3 className="text-[var(--rimworld-text-dim)] text-sm uppercase tracking-wider mb-2">Top Trait</h3>
                        <p className="text-4xl font-bold text-[#FFBB28]">{traitData[0]?.name || '-'}</p>
                    </div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    {/* MBTI Chart */}
                    <div className="bg-[var(--rimworld-panel)] p-6 rounded-lg border border-[var(--rimworld-border-dim)] shadow-lg">
                        <h3 className="text-xl font-bold text-[var(--rimworld-text)] mb-6 border-l-4 border-[#00C49F] pl-3">MBTI Distribution</h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={mbtiData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--rimworld-border-dim)" />
                                    <XAxis type="number" stroke="var(--rimworld-text-dim)" />
                                    <YAxis dataKey="name" type="category" stroke="var(--rimworld-text)" width={60} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--rimworld-panel-dark)', borderColor: 'var(--rimworld-border)', color: 'var(--rimworld-text)' }}
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
                    <div className="bg-[var(--rimworld-panel)] p-6 rounded-lg border border-[var(--rimworld-border-dim)] shadow-lg">
                        <h3 className="text-xl font-bold text-[var(--rimworld-text)] mb-6 border-l-4 border-[#FFBB28] pl-3">Top 10 Traits</h3>
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
                                    <Tooltip contentStyle={{ backgroundColor: '#222', borderColor: '#555', color: '#fff' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="text-center text-gray-500 text-xs mt-12 pb-8">
                    Data is collected anonymously for statistical purposes only.<br />
                    Powered by Rimworld Traits Test
                </div>
            </div>
        </div>
    );
}
