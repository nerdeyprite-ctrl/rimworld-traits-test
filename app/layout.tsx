import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import Layout from "../components/Layout";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "변방계 정착민 테스트 (Rimworld Traits Test)",
  description: "당신이 림월드에 떨어진다면 어떤 특성을 가질까요? 변방계 생존 적합성 테스트.",
  openGraph: {
    title: "변방계 정착민 테스트",
    description: "당신은 낙천적인가요, 아니면 유리정신인가요? 지금 바로 확인하세요.",
    images: [{ url: '/og-image.png', width: 1200, height: 630 }], // Placeholder
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* SEO & Monetization Prep */}
        {/* google-site-verification could go here */}
      </head>
      <body>
        <Providers>
          <Layout>
            {children}
          </Layout>
        </Providers>
        <Analytics />

        {/* Kakao SDK */}
        <Script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js"
          integrity="sha384-DKYJZ8NLiK8MN4/C5NYuzXVrT00HNE/4/KxxPkggrGbPDHMcR6Rl52z0TunCVZCX"
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />

        {/* Google Analytics Skeleton */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'GA_MEASUREMENT_ID');
          `}
        </Script>
      </body>
    </html>
  );
}
