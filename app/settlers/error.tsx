"use client";

type SettlersErrorPageProps = {
    error: Error & { digest?: string };
    reset: () => void;
};

export default function SettlersErrorPage({ error, reset }: SettlersErrorPageProps) {
    console.error('[settlers] route error:', error);

    return (
        <div className="max-w-3xl mx-auto py-12 px-4">
            <div className="sim-panel p-6 space-y-4 text-center">
                <h1 className="text-2xl font-black text-[var(--sim-text-main)]">정착민 보관함을 불러오지 못했습니다.</h1>
                <p className="text-sm text-[var(--sim-text-sub)]">
                    일시적인 로딩 오류일 수 있습니다. 다시 시도하거나 홈으로 돌아가서 다시 진입해 주세요.
                </p>
                {error.message ? (
                    <div className="text-xs text-red-300 bg-red-950/25 border border-red-500/40 rounded-md px-3 py-2 break-all">
                        {error.message}
                    </div>
                ) : null}
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <button onClick={reset} className="sim-btn sim-btn-primary px-4 py-2 text-xs">
                        다시 시도
                    </button>
                    <a href="/" className="sim-btn sim-btn-secondary px-4 py-2 text-xs">
                        홈으로
                    </a>
                </div>
            </div>
        </div>
    );
}
