"use client";

import React, { useEffect, useState } from 'react';

// Use a unique namespace for your app
const NAMESPACE = 'rimworld-traits-test';
const KEY = 'visits';

export default function VisitorCounter() {
    const [count, setCount] = useState<number | null>(null);

    useEffect(() => {
        const fetchCount = async () => {
            try {
                // Using counterapi.dev which is more reliable
                // /up increments the counter and returns the new value
                const response = await fetch(`https://api.counterapi.dev/v1/${NAMESPACE}/${KEY}/up`);
                const data = await response.json();

                if (data && typeof data.count === 'number') {
                    setCount(data.count);
                } else {
                    // Fallback silently or just retry? For now, we rely on the component returning null if no count
                    console.warn('Invalid counter response', data);
                }
            } catch (error) {
                console.error("Failed to fetch visitor count:", error);
            }
        };

        fetchCount();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (count === null) return null;

    return (
        <div className="mt-4 text-xs font-bold text-gray-500 animate-fade-in">
            총 <span className="text-[var(--rimworld-highlight)]">{count.toLocaleString()}</span>명이 이 테스트를 플레이했습니다.
        </div>
    );
}
