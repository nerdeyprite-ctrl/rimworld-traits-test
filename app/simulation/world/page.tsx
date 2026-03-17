import React, { Suspense } from 'react';
import WorldSimulationClient from './world-simulation-client';
import { isWorldSimEnabled } from '../../../lib/world-sim-feature';

export default function WorldSimulationPage() {
    if (!isWorldSimEnabled()) {
        return (
            <div className="max-w-3xl mx-auto py-12 px-4">
                <div className="sim-panel p-6 space-y-4 text-center">
                    <h1 className="text-2xl font-black text-[var(--sim-text-main)]">월드 시뮬레이션 임시 비활성화</h1>
                    <p className="text-sm text-[var(--sim-text-sub)]">
                        핵심 시뮬레이션 경험 개선에 집중하기 위해 월드 투표 모드는 잠시 닫아두었습니다.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        <a href="/simulation" className="sim-btn sim-btn-primary px-4 py-2 text-xs">
                            일반 시뮬레이션으로 이동
                        </a>
                        <a href="/" className="sim-btn sim-btn-secondary px-4 py-2 text-xs">
                            홈으로
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <Suspense fallback={<div className="p-20 text-center text-gray-400 animate-pulse">로딩 중...</div>}>
            <WorldSimulationClient />
        </Suspense>
    );
}
