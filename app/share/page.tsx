import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

// Define the shape of searchParams we expect
type Props = {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function getShareData(searchParams: { [key: string]: string | string[] | undefined }) {
    const s = (searchParams.s as string);
    if (s) {
        try {
            const { data, error } = await supabase
                .from('test_results')
                .select('*')
                .eq('id', s)
                .single();

            if (data && !error) {
                const traits = Array.isArray(data.traits)
                    ? data.traits.map((t: any) => typeof t === 'string' ? t : t.name).join(',')
                    : '';
                return {
                    name: data.name || '정착민',
                    mbti: data.mbti || 'Unknown',
                    traits: traits,
                    age: data.age?.toString() || '20',
                    gender: data.gender || 'Male'
                };
            }
        } catch (e) {
            console.error("Error fetching share data:", e);
        }
    }

    // Legacy / Fallback
    return {
        name: (searchParams.name as string) || '정착민',
        mbti: (searchParams.mbti as string) || 'Unknown',
        traits: (searchParams.traits as string) || '',
        age: (searchParams.age as string) || '20',
        gender: (searchParams.gender as string) || 'Male'
    };
}

// Generate Metadata for Social Sharing (Dynamic OG Image)
export async function generateMetadata(
    { searchParams }: Props
): Promise<Metadata> {
    const params = await searchParams;
    const { name, mbti, traits } = await getShareData(params);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://test.ratkin.org';

    // Construct Traits Query for Image
    const traitList = traits ? traits.split(',') : [];
    const tQuery = traitList.map((t: string, i: number) => `t${i + 1}=${encodeURIComponent(t)}`).join('&');

    const ogUrl = `${siteUrl}/api/og?name=${encodeURIComponent(name)}&mbti=${encodeURIComponent(mbti)}&${tQuery}`;

    return {
        metadataBase: new URL(siteUrl),
        title: `${name}의 변방계 적성 검사 결과`,
        description: `"${name}"님은 ${mbti} 유형입니다. 주요 특성: ${traits}`,
        openGraph: {
            title: `${name}의 변방계 생존 시뮬레이션 결과`,
            description: `특성: ${traits} | 유형: ${mbti}\n당신도 지금 테스트해보세요!`,
            images: [ogUrl],
            url: `${siteUrl}/share?name=${encodeURI(name)}&mbti=${mbti}&traits=${encodeURI(traits)}`,
        },
        twitter: {
            card: 'summary_large_image',
            title: `${name}의 변방계 적성 검사 결과`,
            description: `특성: ${traits}`,
            images: [ogUrl],
        },
    };
}

export default async function SharePage({ searchParams }: Props) {
    const params = await searchParams;
    const { name, mbti, traits: traitsStr, age, gender } = await getShareData(params);
    const traits = traitsStr ? traitsStr.split(',') : [];

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] py-12 px-4 animate-fade-in text-center">

            <div className="bg-[#1b1b1b] border-2 border-[#6b6b6b] p-8 max-w-2xl w-full shadow-2xl relative">
                {/* Header */}
                <div className="border-b border-gray-600 pb-4 mb-6">
                    <div className="text-[#9f752a] font-bold text-sm tracking-widest uppercase mb-1">DATA LOG #39482</div>
                    <h1 className="text-3xl font-bold text-white">생존자 분석 데이터</h1>
                </div>

                {/* User Info */}
                <div className="mb-8">
                    <div className="text-gray-400 text-sm mb-2">IDENTIFIER</div>
                    <div className="text-4xl font-bold text-white mb-2">{name}</div>
                    <div className="text-gray-500 text-xs uppercase tracking-wider">
                        {gender === 'Male' ? 'Male' : 'Female'} | Age {age}
                    </div>
                </div>

                {/* Result MBTI & Traits */}
                <div className="bg-[#111] border border-[#333] p-6 mb-8 rounded">
                    <div className="text-[#9f752a] font-bold text-3xl mb-4">{mbti}</div>
                    <div className="flex flex-wrap justify-center gap-2">
                        {traits.map((t: string, i: number) => (
                            <span key={i} className="px-3 py-1 bg-[#333] border border-gray-600 text-white text-sm rounded">
                                {t}
                            </span>
                        ))}
                        {traits.length === 0 && <span className="text-gray-500">데이터 없음</span>}
                    </div>
                </div>

                <div className="text-gray-300 mb-8 whitespace-pre-line">
                    이 생존자의 상세 데이터가 궁금하신가요?
                    <br />
                    지금 바로 당신의 적성도 테스트해보세요.
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    {params.s && (
                        <Link
                            href={`/result?s=${params.s}`}
                            className="inline-block px-8 py-4 bg-[#1c3d5a] hover:bg-[#2c5282] text-white font-bold text-lg shadow-[0_4px_0_#102a43] active:translate-y-1 active:shadow-none transition-all border border-[#102a43]"
                        >
                            상세 결과 확인하기
                        </Link>
                    )}
                    <Link
                        href="/"
                        className="inline-block px-10 py-4 bg-[#8b5a2b] hover:bg-[#a06b35] text-white font-bold text-lg shadow-[0_4px_0_#5a3a1a] active:translate-y-1 active:shadow-none transition-all border border-[#5a3a1a]"
                    >
                        나도 테스트하기
                    </Link>
                </div>
            </div>

        </div>
    );
}
