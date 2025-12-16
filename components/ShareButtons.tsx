import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { TestResult } from '../types/rimworld';
import { UserInfo } from '../context/TestContext';

declare global {
    interface Window {
        Kakao: any;
    }
}

interface ShareButtonsProps {
    result?: TestResult | null;
    userInfo?: UserInfo | null;
}

const ShareButtons = ({ result, userInfo }: ShareButtonsProps) => {
    const { t } = useLanguage();
    const [shareUrl, setShareUrl] = useState('');
    const [origin, setOrigin] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const currentOrigin = window.location.origin;
            setOrigin(currentOrigin);

            // Construct Share URL with Query Params if result exists
            // This points to the /share page which generates dynamic OG tags
            if (result && userInfo) {
                const params = new URLSearchParams();
                if (userInfo.name) params.set('name', userInfo.name);
                if (result.mbti) params.set('mbti', result.mbti);

                // Add top 3 traits
                const traitNames = result.traits.slice(0, 3).map(tr => tr.name).join(',');
                if (traitNames) params.set('traits', traitNames);

                params.set('age', userInfo.age.toString() || '20');
                params.set('gender', userInfo.gender || 'Male');

                setShareUrl(`${currentOrigin}/share?${params.toString()}`);
            } else {
                setShareUrl(window.location.href);
            }

            // Initialize Kakao SDK
            if (window.Kakao && !window.Kakao.isInitialized()) {
                // Replace with your actual Kakao JavaScript Key
                // 
                window.Kakao.init('YOUR_KAKAO_JAVASCRIPT_KEY');
            }
        }
    }, [result, userInfo]);

    const shareTitle = t('app_title') + " - " + t('landing_subtitle');

    const shareKakao = () => {
        if (window.Kakao && window.Kakao.isInitialized()) {
            const traitNames = result?.traits.slice(0, 3).map(tr => tr.name).join(', ') || '';
            const description = result && userInfo
                ? `${userInfo.name}님은 ${result.mbti} 유형입니다. (특성: ${traitNames})`
                : t('landing_subtitle');

            // Dynamic Image URL
            const imageUrl = result && userInfo
                ? `${origin}/api/og?name=${encodeURIComponent(userInfo.name || '')}&mbti=${encodeURIComponent(result.mbti || '')}&traits=${encodeURIComponent(traitNames)}`
                : 'https://placeholder.com/rimworld-og.png';

            window.Kakao.Share.sendDefault({
                objectType: 'feed',
                content: {
                    title: t('app_title'),
                    description: description,
                    imageUrl: imageUrl,
                    link: {
                        mobileWebUrl: shareUrl,
                        webUrl: shareUrl,
                    },
                },
                buttons: [
                    {
                        title: '결과 확인하기',
                        link: {
                            mobileWebUrl: shareUrl,
                            webUrl: shareUrl,
                        },
                    },
                    {
                        title: t('start_test'),
                        link: {
                            mobileWebUrl: origin,
                            webUrl: origin,
                        },
                    },
                ],
            });
        } else {
            alert('Kakao SDK not initialized. Please set your JS Key.');
        }
    };

    const shareTwitter = () => {
        const text = result
            ? `[변방계 정착민 테스트] 제 결과는 ${result.mbti}입니다. #${result.userInfo?.name}\n\n`
            : shareTitle;

        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
        window.open(twitterUrl, '_blank');
    };

    const copyUrl = () => {
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert('공유 링크가 복사되었습니다! (디스코드 등에 붙여넣으세요)');
        });
    };

    return (
        <div className="flex gap-4 justify-center mt-6">
            {/* Kakao Share */}
            <button onClick={shareKakao} className="bg-[#FEE500] p-2 rounded-full hover:opacity-80 transition-opacity flex items-center justify-center shadow-md w-12 h-12" title="KakaoTalk Share">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-black">
                    <path d="M12 3C7.58 3 4 5.79 4 9.24C4 11.28 5.34 13.09 7.42 14.2C7.3 14.93 6.96 16.59 6.96 16.59C6.96 16.59 9.87 15.68 11.45 14.61C11.63 14.63 11.81 14.64 12 14.64C16.42 14.64 20 11.85 20 8.4C20 5.79 16.42 3 12 3Z" />
                </svg>
            </button>

            {/* Twitter (X) Share */}
            <button onClick={shareTwitter} className="bg-black p-2 rounded-full hover:opacity-80 transition-opacity flex items-center justify-center border border-gray-700 shadow-md w-12 h-12" title="Share on X">
                <span className="text-white font-bold text-xl">X</span>
            </button>

            {/* Discord (Copy Link) */}
            <button onClick={copyUrl} className="bg-[#5865F2] p-2 rounded-full hover:opacity-80 transition-opacity flex items-center justify-center shadow-md w-12 h-12" title="Copy Link for Discord">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-white">
                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419z" />
                </svg>
            </button>

            {/* URL Copy */}
            <button onClick={copyUrl} className="bg-gray-600 p-2 rounded-full hover:opacity-80 transition-opacity flex items-center justify-center shadow-md w-12 h-12" title="Copy URL">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
            </button>
        </div>
    );
};

export default ShareButtons;
