"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTest } from '../../../context/TestContext';

export default function IntroPage() {
    const { setUserInfo, resetTest } = useTest();
    const router = useRouter();

    const [name, setName] = useState('');
    const [age, setAge] = useState<string>('20');
    const [gender, setGender] = useState<'Male' | 'Female'>('Male');

    useEffect(() => {
        resetTest();
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            alert("이름을 입력해주세요.");
            return;
        }

        const ageNum = parseInt(age) || 20;

        setUserInfo({
            name: name,
            age: ageNum,
            gender: gender
        });
        router.push('/test');
    };

    return (
        <div className="max-w-xl mx-auto flex flex-col items-center justify-center min-h-[60vh] animate-fade-in-up py-10">
            <div className="bg-[var(--rimworld-panel)] border-2 border-[var(--rimworld-border)] p-8 w-full shadow-2xl relative">
                {/* Decorative Corner Borders */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[var(--rimworld-highlight)]"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[var(--rimworld-highlight)]"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[var(--rimworld-highlight)]"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[var(--rimworld-highlight)]"></div>

                <div className="absolute top-0 right-0 p-2 text-[var(--rimworld-highlight)] font-mono text-xs opacity-70">PROTOCOL: ALIVE</div>

                <h1 className="text-2xl md:text-3xl font-bold text-[var(--rimworld-text)] mb-2 text-center">
                    생존자 등록 (Survivor Registration)
                </h1>
                <p className="text-center text-[var(--rimworld-text-dim)] text-sm mb-8">
                    동면관에서 깨어난 당신의 생체 정보를 입력하십시오.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Name Input */}
                    <div className="space-y-2">
                        <label className="block text-[var(--rimworld-text-dim)] font-bold text-sm uppercase tracking-wider">
                            호출 부호 (Code Name)
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="예: 럭키, 베로니카, 타이난, 히아신스"
                            className="w-full bg-[var(--rimworld-panel-dark)] border border-[var(--rimworld-border)] p-3 text-[var(--rimworld-text)] focus:border-[var(--rimworld-highlight)] outline-none transition-colors text-center font-bold"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Age Input */}
                        <div className="space-y-2">
                            <label className="block text-[var(--rimworld-text-dim)] font-bold text-sm uppercase tracking-wider text-xs md:text-sm">
                                생체 연령 (Bio Age)
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={age}
                                    onChange={(e) => setAge(e.target.value)}
                                    min={1}
                                    max={150}
                                    className="w-full bg-[var(--rimworld-panel-dark)] border border-[var(--rimworld-border)] p-3 text-[var(--rimworld-text)] focus:border-[var(--rimworld-highlight)] outline-none transition-colors text-center"
                                />
                                <span className="absolute right-3 top-3 text-[var(--rimworld-text-dim)] text-sm">세</span>
                            </div>
                        </div>

                        {/* Gender Selection */}
                        <div className="space-y-2">
                            <label className="block text-[var(--rimworld-text-dim)] font-bold text-sm uppercase tracking-wider text-xs md:text-sm">
                                성별 (Gender)
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setGender('Male')}
                                    className={`py-3 md:py-6 border-2 transition-all duration-300 flex flex-col items-center justify-center ${gender === 'Male'
                                        ? 'bg-[#1a3b50]/60 border-[#4a89dc] text-[#4a89dc] shadow-[0_0_15px_rgba(74,137,220,0.5)]'
                                        : 'bg-[var(--rimworld-panel-dark)] border-[var(--rimworld-border-dim)] text-[var(--rimworld-text-dim)] hover:border-[var(--rimworld-border)]'}`}
                                >
                                    <span className="block text-2xl md:text-3xl mb-1">♂</span>
                                    <span className="font-bold text-sm md:text-lg">Male</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setGender('Female')}
                                    className={`py-3 md:py-6 border-2 transition-all duration-300 flex flex-col items-center justify-center ${gender === 'Female'
                                        ? 'bg-[#3d1a2b]/60 border-[#d44a89] text-[#d44a89] shadow-[0_0_15px_rgba(212,74,137,0.5)]'
                                        : 'bg-[var(--rimworld-panel-dark)] border-[var(--rimworld-border-dim)] text-[var(--rimworld-text-dim)] hover:border-[var(--rimworld-border)]'}`}
                                >
                                    <span className="block text-2xl md:text-3xl mb-1">♀</span>
                                    <span className="font-bold text-sm md:text-lg">Female</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                        <button
                            type="submit"
                            className="w-full md:w-auto px-12 py-4 bg-[#6e4e1e] hover:bg-[#856026] text-white font-bold text-lg shadow-lg border border-[#9f752a] transition-all transform hover:scale-105"
                        >
                            테스트 시작하기
                        </button>

                        <div className="mt-4">
                            <a href="/admin/builder" className="text-[10px] text-gray-600 hover:text-gray-400">
                                DATA BUILDER
                            </a>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
