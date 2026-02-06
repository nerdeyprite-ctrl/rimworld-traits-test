import React, { Suspense } from 'react';
import SettlersClient from './settlers-client';

export const metadata = {
    title: '정착민 보관함 - 변방계 정착민 테스트',
    description: '저장된 정착민들을 관리하고 시뮬레이션을 시작하세요.',
};

export default function SettlersPage() {
    return (
        <Suspense fallback={<div className="p-20 text-center text-gray-400 animate-pulse">로딩 중...</div>}>
            <SettlersClient />
        </Suspense>
    );
}
