import React from 'react';
import AdPlaceholder from './AdPlaceholder';

const Footer = () => {
    return (
        <footer className="mt-auto w-full">
            {/* Monetization Area */}
            <AdPlaceholder />

            <div className="bg-[var(--rimworld-panel)] border-t border-[var(--rimworld-border)] p-4 text-center text-sm text-gray-500">
                <p>&copy; {new Date().getFullYear()} 변방계 정착민 테스트. RimWorld is a registered trademark of Ludeon Studios.</p>
                <p className="mt-1">이 사이트는 팬 메이드 프로젝트이며 공식과 관련이 없습니다.</p>
            </div>
        </footer>
    );
};

export default Footer;
