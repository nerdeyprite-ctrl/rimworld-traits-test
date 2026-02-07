"use client";

import React from 'react';
import { useTest } from '../../context/TestContext';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../../context/LanguageContext';

export default function TestPage() {
    const { currentQuestionIndex, handleAnswer, shuffledQuestions } = useTest();
    const router = useRouter();
    const { t } = useLanguage();

    const questions = shuffledQuestions;
    const question = questions[currentQuestionIndex];

    // Progress Percentage
    const progress = questions.length > 0 ? ((currentQuestionIndex) / questions.length) * 100 : 0;

    if (!question) {
        if (questions.length > 0 && currentQuestionIndex >= questions.length) {
            router.push('/result');
            return null;
        }
        return <div className="p-10 text-center text-gray-500">{t('loading')}</div>;
    }

    const onAnswerClick = (answer: any) => {
        handleAnswer(question.id, answer);
        if (currentQuestionIndex + 1 >= questions.length) {
            router.push('/result');
        }
    };

    // Calculate current part based on question ID
    const part = question ? (question.id >= 1000 ? 3 : question.id >= 200 ? 2 : 1) : 1;

    // Part theme configuration
    const partThemes = {
        1: { color: '#4d7c0f', bg: 'rgba(77, 124, 15, 0.1)', title: t('part1_title'), desc: t('part1_desc'), tag: '[ 특성 분석 ]' },
        2: { color: '#0369a1', bg: 'rgba(3, 105, 161, 0.1)', title: t('part2_title'), desc: t('part2_desc'), tag: '[ 배경 추적 ]' },
        3: { color: '#9f752a', bg: 'rgba(159, 117, 42, 0.1)', title: t('part3_title'), desc: t('part3_desc'), tag: '[ 기술 검증 ]' },
    };

    const theme = partThemes[part as keyof typeof partThemes] || partThemes[1];

    return (
        <div className="max-w-2xl mx-auto w-full flex flex-col min-h-[60vh] justify-center animate-fade-in py-8">
            {/* Header Area */}
            <div className="flex justify-between items-end mb-4 px-1">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span
                            className="w-2 h-2 rounded-full animate-pulse"
                            style={{ backgroundColor: theme.color }}
                        ></span>
                        <h3
                            className="font-bold text-xs uppercase tracking-[0.2em]"
                            style={{ color: theme.color }}
                        >
                            {theme.title}
                        </h3>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                        SCANNING_PHASE_{part}
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-2xl font-black text-white/20 select-none">
                        #{String(currentQuestionIndex + 1).padStart(2, '0')} / {questions.length}
                    </span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-900 h-1.5 mb-12 relative overflow-hidden rounded-full">
                <div
                    className="h-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(159,117,42,0.3)]"
                    style={{
                        width: `${progress}%`,
                        backgroundColor: theme.color
                    }}
                ></div>
                <div className="absolute top-4 right-0 text-[10px] text-slate-500 font-mono tracking-tighter">
                    {currentQuestionIndex + 1} / {questions.length} ( {Math.round(progress)}% COMPLETED )
                </div>
            </div>

            {/* Question Card */}
            <div className="bg-[#121212]/80 backdrop-blur-md border border-white/5 p-8 md:p-12 shadow-2xl relative overflow-hidden group">
                {/* Decorative Elements */}
                <div
                    className="absolute -top-3 -left-3 w-8 h-8 border-t-2 border-l-2 transition-colors duration-500"
                    style={{ borderColor: theme.color }}
                ></div>
                <div
                    className="absolute -bottom-3 -right-3 w-8 h-8 border-b-2 border-r-2 transition-colors duration-500"
                    style={{ borderColor: theme.color }}
                ></div>

                <div
                    className="absolute top-0 right-0 p-4 font-mono text-[9px] opacity-20 group-hover:opacity-40 transition-opacity"
                    style={{ color: theme.color }}
                >
                    {theme.tag}
                </div>

                <div className="relative z-10">
                    <h2 className="text-xl md:text-3xl font-bold mb-12 text-center leading-tight whitespace-pre-line text-white/90">
                        {question.text}
                    </h2>

                    <div className="space-y-4">
                        {question.answers.map((answer: any, idx: number) => (
                            <button
                                key={idx}
                                onClick={() => onAnswerClick(answer)}
                                className="w-full text-left p-5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 transition-all duration-300 group/btn relative overflow-hidden"
                            >
                                <div
                                    className="absolute inset-y-0 left-0 w-0 group-hover/btn:w-1.5 transition-all duration-300"
                                    style={{ backgroundColor: theme.color }}
                                ></div>
                                <div className="flex items-center">
                                    <span className="w-7 h-7 flex items-center justify-center border border-white/10 text-[10px] bg-black text-slate-500 group-hover/btn:text-white transition-colors font-bold mr-5">
                                        {String.fromCharCode(65 + idx)}
                                    </span>
                                    <span className="text-slate-300 group-hover/btn:text-white text-sm md:text-base transition-colors leading-snug">
                                        {answer.text}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-8 text-center">
                <p className="text-[10px] text-slate-600 font-mono tracking-widest uppercase opacity-50">
                    Neural Simulation Data Packet #{question.id}
                </p>
            </div>
        </div>
    );
}
