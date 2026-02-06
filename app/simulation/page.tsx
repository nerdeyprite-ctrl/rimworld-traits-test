import React, { Suspense } from 'react';
import SimulationClient from './simulation-client';

export default function SimulationPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center text-gray-400 animate-pulse">로딩 중...</div>}>
      <SimulationClient />
    </Suspense>
  );
}
