"use client";

import React, { useState } from 'react';
import traitsData from '../../../data/traits.json';

// Simple types for the builder
interface TraitScore {
    traitId: string;
    score: number;
}

interface BuilderAnswer {
    text: string;
    scores: TraitScore[];
}

interface Question {
    id: number;
    text: string;
    answers: BuilderAnswer[];
}

export default function QuestionBuilder() {
    const [text, setText] = useState('');
    const [answers, setAnswers] = useState<BuilderAnswer[]>([
        { text: '', scores: [] },
        { text: '', scores: [] }
    ]);
    const [generatedJson, setGeneratedJson] = useState('');

    const traits = traitsData as any[];

    // Rimworld Skills (Hardcoded definition)
    const SKILLS = [
        'Shooting', 'Melee', 'Construction', 'Mining', 'Cooking',
        'Plants', 'Animals', 'Crafting', 'Artistic', 'Medicine',
        'Social', 'Intellectual'
    ];

    const handleAnswerChange = (idx: number, val: string) => {
        const newAnswers = [...answers];
        newAnswers[idx].text = val;
        setAnswers(newAnswers);
    };

    const addAnswer = () => {
        setAnswers([...answers, { text: '', scores: [] }]);
    };

    const removeAnswer = (idx: number) => {
        setAnswers(answers.filter((_, i) => i !== idx));
    };

    const addScore = (ansIdx: number) => {
        const newAnswers = [...answers];
        newAnswers[ansIdx].scores.push({ traitId: traits[0].id, score: 1 });
        setAnswers(newAnswers);
    };

    const updateScore = (ansIdx: number, scoreIdx: number, field: keyof TraitScore, value: any) => {
        const newAnswers = [...answers];
        newAnswers[ansIdx].scores[scoreIdx] = {
            ...newAnswers[ansIdx].scores[scoreIdx],
            [field]: value
        };
        setAnswers(newAnswers);
    };

    const removeScore = (ansIdx: number, scoreIdx: number) => {
        const newAnswers = [...answers];
        newAnswers[ansIdx].scores = newAnswers[ansIdx].scores.filter((_, i) => i !== scoreIdx);
        setAnswers(newAnswers);
    };

    const generate = () => {
        // Format to match the game's JSON structure
        const questionObj = {
            id: Date.now(), // Random temporary ID
            text: text,
            answers: answers.map(a => {
                const scoresObj: Record<string, number> = {};
                a.scores.forEach(s => {
                    scoresObj[s.traitId] = Number(s.score);
                });
                return {
                    text: a.text,
                    scores: scoresObj
                };
            })
        };
        setGeneratedJson(JSON.stringify(questionObj, null, 4));
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedJson);
        alert("Copied to clipboard!");
    };

    return (
        <div className="min-h-screen bg-[#111111] text-gray-300 p-8">
            <div className="max-w-4xl mx-auto border border-[#6b6b6b] bg-[#1e1e1e] p-6 shadow-2xl">
                <h1 className="text-2xl font-bold text-[#9f752a] mb-6 border-b border-gray-600 pb-2">
                    🛠️ Rimworld Question Builder
                </h1>

                {/* Question Text */}
                <div className="mb-6">
                    <label className="block text-sm font-bold uppercase mb-2">질문 내용 (Question)</label>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="w-full bg-black/30 border border-gray-600 p-3 text-white focus:border-[#9f752a] outline-none h-24"
                        placeholder="예: 폭염이 닥쳤을 때 당신의 반응은?"
                    />
                </div>

                {/* Answers */}
                <div className="space-y-6 mb-8">
                    {answers.map((ans, ansIdx) => (
                        <div key={ansIdx} className="bg-black/20 p-4 border border-gray-700 relative">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[#9f752a] font-bold text-sm">답변 #{ansIdx + 1}</span>
                                <button
                                    onClick={() => removeAnswer(ansIdx)}
                                    className="text-red-500 text-xs hover:text-red-400"
                                >
                                    삭제
                                </button>
                            </div>

                            <input
                                type="text"
                                value={ans.text}
                                onChange={(e) => handleAnswerChange(ansIdx, e.target.value)}
                                className="w-full bg-black/50 border border-gray-600 p-2 text-white mb-3 text-sm"
                                placeholder="답변 텍스트 입력..."
                            />

                            {/* Scores for this answer */}
                            <div className="space-y-2 pl-4 border-l-2 border-gray-600">
                                {ans.scores.map((score, scoreIdx) => (
                                    <div key={scoreIdx} className="flex gap-2 items-center">
                                        <select
                                            value={score.traitId}
                                            onChange={(e) => updateScore(ansIdx, scoreIdx, 'traitId', e.target.value)}
                                            className="bg-[#333] border border-gray-600 text-white text-xs p-1 rounded w-48"
                                        >
                                            <optgroup label="Skills">
                                                {SKILLS.map(skill => (
                                                    <option key={skill} value={skill}>[Skill] {skill}</option>
                                                ))}
                                            </optgroup>
                                            <optgroup label="Traits">
                                                {traits.map(t => (
                                                    <option key={t.id} value={t.id}>{t.name} ({t.id})</option>
                                                ))}
                                            </optgroup>
                                        </select>
                                        <input
                                            type="number"
                                            value={score.score}
                                            onChange={(e) => updateScore(ansIdx, scoreIdx, 'score', parseInt(e.target.value))}
                                            className="bg-[#333] border border-gray-600 text-white text-xs p-1 rounded w-16 text-center"
                                        />
                                        <button
                                            onClick={() => removeScore(ansIdx, scoreIdx)}
                                            className="text-gray-500 hover:text-red-400"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => addScore(ansIdx)}
                                    className="text-xs text-green-500 hover:text-green-400 flex items-center gap-1 mt-2"
                                >
                                    + 점수 효과 추가
                                </button>
                            </div>
                        </div>
                    ))}
                    <button
                        onClick={addAnswer}
                        className="w-full py-2 border border-dashed border-gray-600 text-gray-400 hover:border-[#9f752a] hover:text-[#9f752a]"
                    >
                        + 답변 추가하기
                    </button>
                </div>

                {/* Generator Action */}
                <div className="flex gap-4 border-t border-gray-600 pt-6">
                    <button
                        onClick={generate}
                        className="flex-1 bg-[#2a4d2a] hover:bg-[#3a6d3a] text-white py-3 font-bold shadow-lg"
                    >
                        JSON 생성 (Generate)
                    </button>
                </div>

                {/* Output Area */}
                {generatedJson && (
                    <div className="mt-8 relative">
                        <label className="block text-sm font-bold uppercase mb-2">결과 (JSON Output)</label>
                        <pre className="w-full bg-black p-4 text-green-400 font-mono text-xs overflow-auto border border-gray-700 h-48">
                            {generatedJson}
                        </pre>
                        <button
                            onClick={copyToClipboard}
                            className="absolute top-8 right-2 bg-white/10 hover:bg-white/20 text-white text-xs px-2 py-1"
                        >
                            Copy
                        </button>
                        <p className="text-gray-500 text-xs mt-2">
                            * 이 코드를 복사해서 `data/questions.json` 배열 안에 붙여넣으세요. (쉼표 주의)
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
