"use client";

import { ReactNode } from "react";
import { TestProvider } from "../context/TestContext";
import { LanguageProvider } from "../context/LanguageContext";
import { ThemeProvider } from "../context/ThemeContext";

export function Providers({ children }: { children: ReactNode }) {
    return (
        <ThemeProvider>
            <LanguageProvider>
                <TestProvider>
                    {children}
                </TestProvider>
            </LanguageProvider>
        </ThemeProvider>
    );
}
