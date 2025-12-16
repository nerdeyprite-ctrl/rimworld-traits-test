
import React, { useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

declare global {
    interface Window {
        Kakao: any;
    }
}

const ShareButtons = () => {
    const { t } = useLanguage();
    // Safely get current URL (client-side only)
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareTitle = t('app_title') + " - " + t('landing_subtitle');

    useEffect(() => {
        // Initialize Kakao SDK
        if (typeof window !== 'undefined' && window.Kakao && !window.Kakao.isInitialized()) {
            // Replace with your actual Kakao JavaScript Key
            // Since this project might be public, be careful with keys. Vercel env vars are better.
            // For now, using a placeholder.
            // window.Kakao.init('YOUR_KAKAO_JAVASCRIPT_KEY'); 
        }
    }, []);

    const shareKakao = () => {
        if (window.Kakao && window.Kakao.isInitialized()) {
            window.Kakao.Share.sendDefault({
                objectType: 'feed',
                content: {
                    title: t('app_title'),
                    description: t('landing_subtitle'),
                    imageUrl: 'https://placeholder.com/rimworld-og.png', // Needs real OG image
                    link: {
                        mobileWebUrl: currentUrl,
                        webUrl: currentUrl,
                    },
                },
                buttons: [
                    {
                        title: t('start_test'),
                        link: {
                            mobileWebUrl: currentUrl,
                            webUrl: currentUrl,
                        },
                    },
                ],
            });
        } else {
            // alert('Kakao SDK not initialized/configured.');
        }
    };

    const shareTwitter = () => {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(currentUrl)}`;
        window.open(twitterUrl, '_blank');
    };

    const copyUrl = () => {
        navigator.clipboard.writeText(currentUrl).then(() => {
            alert('URL이 복사되었습니다!');
        });
    };

    return (
        <div className="flex gap-4 justify-center mt-6">
            {/* Kakao Share */}
            <button onClick={shareKakao} className="bg-[#FEE500] p-2 rounded-full hover:opacity-80 transition-opacity" title="KakaoTalk Share">
                <img src="https://developers.kakao.com/assets/img/about/logos/kakaotalksharing/kakaotalk_sharing_btn_medium.png" alt="Kakao" className="w-8 h-8" />
            </button>

            {/* Twitter (X) Share */}
            <button onClick={shareTwitter} className="bg-black p-2 rounded-full hover:opacity-80 transition-opacity border border-gray-700" title="Share on X">
                <span className="text-white font-bold text-xl px-2">X</span>
            </button>

            {/* Instagram (Link Copy fallback as API is restricted) */}
            <button onClick={copyUrl} className="bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 p-2 rounded-full hover:opacity-80 transition-opacity" title="Copy Link (Instagram)">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
            </button>

            {/* URL Copy */}
            <button onClick={copyUrl} className="bg-gray-600 p-2 rounded-full hover:opacity-80 transition-opacity" title="Copy URL">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
            </button>
        </div>
    );
};

export default ShareButtons;
