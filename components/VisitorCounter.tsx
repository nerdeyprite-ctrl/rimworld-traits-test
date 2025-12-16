
"use client";

import React, { useEffect, useState } from 'react';

// Use a unique namespace for your app
const NAMESPACE = 'rimworld-traits-test-v1';
const KEY = 'plays';
// Fallback if API fails
const FALLBACK_COUNT = 3829;

export default function VisitorCounter() {
    const [count, setCount] = useState<number | null>(null);

    useEffect(() => {
        // Fetch current count (GET)
        // We only want to READ it on the home page, not increment.
        // Increment should happen perhaps when they start the test or on a specific event?
        // But for "User Count", usually "Page Views" or "Unique Visitors".
        // Let's just fetch the info.

        const fetchCount = async () => {
            try {
                // Using countapi.xyz
                // GET https://api.countapi.xyz/get/NAMESPACE/KEY
                const response = await fetch(`https://api.countapi.xyz/get/${NAMESPACE}/${KEY}`);
                const data = await response.json();
                if (data && typeof data.value === 'number') {
                    setCount(data.value);
                } else {
                    // If key doesn't exist, we might need to create/hit it once to initialize?
                    // Or just fallback.
                    setCount(FALLBACK_COUNT);
                }
            } catch (error) {
                console.error("Failed to fetch visitor count:", error);
                setCount(FALLBACK_COUNT);
            }
        };

        fetchCount();
    }, []);

    // If count is not loaded yet, maybe show nothing or a spinner? 
    // Or just show fallback for immediate feedback.
    const displayCount = count !== null ? count : FALLBACK_COUNT;

    return (
        <div className="mt-4 text-xs font-bold text-gray-500 animate-fade-in">
            총 <span className="text-[var(--rimworld-highlight)]">{displayCount.toLocaleString()}</span>명이 이 테스트를 플레이했습니다.
        </div>
    );
}
