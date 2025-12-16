"use client";

import { ReactNode } from "react";
import { TestProvider } from "../context/TestContext";
import { LanguageProvider } from "../context/LanguageContext";

export function Providers({ children }: { children: ReactNode }) {
    return (
        <LanguageProvider>
            <TestProvider>
                {children}
            </TestProvider>
        </LanguageProvider>
    );
}
