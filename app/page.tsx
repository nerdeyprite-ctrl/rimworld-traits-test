"use client";

import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';
import { useTest } from '../context/TestContext';
import { useEffect } from 'react';
import VisitorCounter from '../components/VisitorCounter';

export default function Home() {
  const { t, language } = useLanguage();
  const { resetTest } = useTest();

  // Reset test state whenever Home is mounted (returning from test/result)
  useEffect(() => {
    resetTest();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-12 animate-fade-in-up">
      <section className="text-center space-y-6">
        <h1 className="text-4xl md:text-6xl font-bold text-[var(--rimworld-highlight)] tracking-wider uppercase drop-shadow-md">
          {t('app_title')}
        </h1>
        <p className="text-sm md:text-base text-gray-400 mb-8 max-w-2xl mx-auto whitespace-pre-line leading-relaxed">
          {t('landing_subtitle')}
        </p>


        <Link href="/test/intro" className="inline-block px-12 py-4 bg-[#8b5a2b] hover:bg-[#a06b35] text-white font-bold text-lg shadow-[0_4px_0_#5a3a1a] active:shadow-none active:translate-y-1 transition-all border border-[#5a3a1a]">
          {t('start_test')}
        </Link>
        <VisitorCounter />
      </section>

      {/* Theme Section: Skills & Traits */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mt-12">
        {/* Traits Panel */}
        <div className="bg-[var(--rimworld-panel)] p-6 border border-[var(--rimworld-border)] relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-[var(--rimworld-border)] opacity-50"></div>
          <h2 className="text-2xl font-bold mb-4 text-[var(--rimworld-highlight)] flex items-center">
            {t('landing_traits_title')}
          </h2>
          <p className="text-gray-300 mb-4 text-sm whitespace-pre-line">
            {t('landing_traits_desc')}
          </p>
          {/* Detailed list kept static or partially translated for now due to complexity */}
          <ul className="list-none text-gray-400 text-sm space-y-2 pl-2 border-l-2 border-[var(--rimworld-border)]">
            {language === 'ko' ? (
              <>
                <li>• Mood (기분): 우울증 vs 낙천적</li>
                <li>• Work (노동): 게으름 vs 일벌레</li>
                <li>• Social (사교): 직설적 vs 다정다감</li>
              </>
            ) : (
              <>
                <li>• Mood: Depressive vs Sanguine</li>
                <li>• Work: Lazy vs Industrious</li>
                <li>• Social: Abrasive vs Kind</li>
              </>
            )}
          </ul>
        </div>

        {/* Skills Panel */}
        <div className="bg-[var(--rimworld-panel)] p-6 border border-[var(--rimworld-border)] relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-[var(--rimworld-border)] opacity-50"></div>
          <h2 className="text-2xl font-bold mb-4 text-[var(--rimworld-highlight)] flex items-center">
            {t('landing_skills_title')}
          </h2>
          <p className="text-gray-300 mb-4 text-sm whitespace-pre-line">
            {t('landing_skills_desc')}
          </p>
          <ul className="list-none text-gray-400 text-sm space-y-2 pl-2 border-l-2 border-[var(--rimworld-border)]">
            {language === 'ko' ? (
              <>
                <li>• 전투: 사격, 격투</li>
                <li>• 생존: 조리, 의학, 원예</li>
                <li>• 지능: 연구, 예술</li>
              </>
            ) : (
              <>
                <li>• Combat: Shooting, Melee</li>
                <li>• Survival: Cooking, Medicine, Plants</li>
                <li>• Intellect: Research, Artistic</li>
              </>
            )}
          </ul>
        </div>
      </section>

      {/* Info Section (Bottom) */}
      <div className="flex flex-col md:flex-row justify-center items-center gap-2 md:gap-6 text-xs md:text-sm text-[#9f752a] font-medium mt-16 bg-[var(--rimworld-panel)] p-3 border border-[var(--rimworld-border)] inline-block mx-auto rounded opacity-80 hover:opacity-100 transition-opacity">
        <span>⏱ {t('estimated_time')}</span>
        <span className="hidden md:inline text-gray-600"> | </span>
        <span>📝 {t('questions_count')}</span>
      </div>
    </div>
  );
}
