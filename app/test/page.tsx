"use client";

import React from 'react';
import { useTest } from '../../context/TestContext';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../../context/LanguageContext';

export default function TestPage() {
    const { currentQuestionIndex, handleAnswer, shuffledQuestions, testPhase } = useTest();
    const router = useRouter();
    const { t } = useLanguage();

    const questions = shuffledQuestions; // Use the shuffled list from context

    const question = questions[currentQuestionIndex];

    // Progress Percentage
    const progress = questions.length > 0 ? ((currentQuestionIndex) / questions.length) * 100 : 0;

    if (!question) {
        // If finished or invalid index
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

    // Determine Part Title
    let partTitle = '';
    if (testPhase === 'skill') {
        partTitle = t('part3_title');
    } else {
        if (currentQuestionIndex < 40) {
            partTitle = t('part1_title');
        } else {
            partTitle = t('part2_title');
        }
    }

    return (
        <div className="max-w-2xl mx-auto w-full flex flex-col min-h-[60vh] justify-center animate-fade-in">
            {/* Part Title */}
            <h3 className="text-[#9f752a] font-bold text-sm mb-2 uppercase tracking-widest text-left pl-1">
                {partTitle}
            </h3>

            {/* Progress Bar */}
            <div className="w-full bg-[var(--rimworld-border)] opacity-30 h-2 mb-8 relative border border-[var(--rimworld-border)]">
                <div
                    className="bg-[var(--rimworld-highlight)] h-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                ></div>
                <div className="absolute top-4 right-0 text-xs text-gray-500">
                    {currentQuestionIndex + 1} / {questions.length} ( {t('progress')} )
                </div>
            </div>

            {/* Question Card */}
            <div className="bg-[var(--rimworld-panel)] border border-[var(--rimworld-border)] p-8 shadow-xl relative">
                <div className="absolute -top-3 -left-3 w-6 h-6 border-t-2 border-l-2 border-[var(--rimworld-highlight)]"></div>
                <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b-2 border-r-2 border-[var(--rimworld-highlight)]"></div>

                <h2 className="text-xl md:text-2xl font-bold mb-8 text-center leading-relaxed whitespace-pre-line">
                    {question.text}
                </h2>

                <div className="space-y-3">
                    {question.answers.map((answer, idx) => (
                        <button
                            key={idx}
                            onClick={() => onAnswerClick(answer)}
                            className="w-full text-left p-4 bg-[var(--rimworld-text)]/5 hover:bg-[#9f752a]/20 border border-transparent hover:border-[#9f752a] transition-all duration-200 group"
                        >
                            <div className="flex items-center">
                                <span className="w-6 h-6 flex items-center justify-center border border-[var(--rimworld-border)] rounded-sm mr-4 text-xs bg-[var(--rimworld-bg)] text-[var(--rimworld-text)] group-hover:bg-[#9f752a] group-hover:text-white group-hover:border-[#9f752a] transition-colors">
                                    {String.fromCharCode(65 + idx)}
                                </span>
                                <span className="text-[var(--rimworld-text)] opacity-80 group-hover:opacity-100 group-hover:text-[var(--rimworld-text)]">{answer.text}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
