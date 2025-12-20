"use client";

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

const Header = () => {
    const { language, setLanguage, t } = useLanguage();
    const { theme, toggleTheme } = useTheme();

    return (
        <header className="w-full bg-[var(--rimworld-panel)] border-b border-[var(--rimworld-border)] p-4 flex justify-between items-center shadow-md">
            <Link href="/" className="text-xl font-bold text-[var(--rimworld-highlight)] hover:opacity-80 transition-opacity">
                {t('app_title')}
            </Link>
            <nav className="flex items-center gap-4">
                {/* Creator Links */}
                <div className="flex items-center gap-4 mr-2 border-r border-gray-600/30 pr-4">
                    <a href="https://ratkin.org/" target="_blank" rel="noopener noreferrer"
                        className="text-gray-400 hover:text-[var(--rimworld-highlight)] transition-colors" title="Official Website">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                    </a>
                    <a href="https://x.com/NERDEY185694" target="_blank" rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white transition-colors" title="X (Twitter)">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                    </a>
                    <a href="https://www.youtube.com/@NERDEYPIRTE" target="_blank" rel="noopener noreferrer"
                        className="text-gray-400 hover:text-[#ff0000] transition-colors" title="YouTube">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.377.505 9.377.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                        </svg>
                    </a>
                </div>

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full hover:bg-[var(--rimworld-border)] transition-colors text-[var(--rimworld-text)] mr-2"
                    title={theme === 'dark' ? t('theme_light') : t('theme_dark')}
                >
                    {theme === 'dark' ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707m12.728 12.728L12 12m0 0l-4-4m4 4l4-4m-4 4l-4 4m4-4l4 4" />
                            <circle cx="12" cy="12" r="5" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                    )}
                </button>

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
