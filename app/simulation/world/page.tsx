import React, { Suspense } from 'react';
import WorldSimulationClient from './world-simulation-client';

export default function WorldSimulationPage() {
    return (
        <Suspense fallback={<div className="p-20 text-center text-gray-400 animate-pulse">로딩 중...</div>}>
            <WorldSimulationClient />
        </Suspense>
    );
}

