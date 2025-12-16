import React from 'react';

const AdPlaceholder = () => {
    return (
        <div className="w-full flex justify-center py-4 bg-black/20">
            {/* 
        Monetization: 728x90 Leaderboard Ad 
        This needs to be responsive.
      */}
            <div className="w-[728px] h-[90px] bg-gray-800 border border-gray-600 flex items-center justify-center text-gray-400 text-sm">
                [AdSpace: 728x90 - Google AdSense]
            </div>
        </div>
    );
};

export default AdPlaceholder;
