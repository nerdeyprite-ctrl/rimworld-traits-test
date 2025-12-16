"use client";

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';

const Header = () => {
    const { language, setLanguage, t } = useLanguage();

    return (
        <header className="w-full bg-[var(--rimworld-panel)] border-b border-[var(--rimworld-border)] p-4 flex justify-between items-center shadow-md">
            <Link href="/" className="text-xl font-bold text-[var(--rimworld-highlight)] hover:opacity-80 transition-opacity">
                {t('app_title')}
            </Link>
            <nav className="flex items-center gap-4">
                <button
                    onClick={() => setLanguage('ko')}
                    className={`nav-btn p-1 rounded transition-all duration-300 ${language === 'ko' ? 'scale-110 opacity-100' : 'opacity-30 hover:opacity-100 grayscale'}`}
                    title="한국어"
                >
                    <span className="text-3xl filter drop-shadow-md">🇰🇷</span>
                </button>
                <div className="w-px h-5 bg-gray-600/50"></div>
                <button
                    onClick={() => setLanguage('en')}
                    className={`nav-btn p-1 rounded transition-all duration-300 ${language === 'en' ? 'scale-110 opacity-100' : 'opacity-30 hover:opacity-100 grayscale'}`}
                    title="English"
                >
                    <span className="text-3xl filter drop-shadow-md">🇺🇸</span>
                </button>
            </nav>
        </header>
    );
};

export default Header;
