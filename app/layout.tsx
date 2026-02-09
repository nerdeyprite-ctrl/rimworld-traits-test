import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import Layout from "../components/Layout";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { Sora, Noto_Sans_KR } from "next/font/google";

const displayFont = Sora({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-display",
});

const bodyFont = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-body",
});

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "림월드 정착민 테스트 | 변방계 생존 시뮬레이션 (Rimworld Test)",
    template: "%s | 림월드 정착민 테스트",
  },
  description: "림월드 정착민 테스트에서 당신의 특성과 기술을 확인하세요. 변방계 생존 시뮬레이션 기반으로 림월드 세계관에서의 정착민 적성을 평가합니다.",
  keywords: [
    "림월드 테스트",
    "림월드 정착민",
    "림월드 시뮬레이션",
    "림월드 시뮬",
    "림",
    "정착민",
    "변방계",
    "변방계 테스트",
    "변방계 정착민",
    "생존 테스트",
    "시뮬레이션",
    "Rimworld",
    "rimworld test",
    "Ratkin",
    "랫킨",
    "림월드 테스트 사이트",
    "성격 테스트",
    "MBTI",
    "적성 검사",
    "심리 테스트",
    "게임",
    "생존",
    "특성",
  ],
  authors: [{ name: "Nerdeyprite" }],
  openGraph: {
    title: "림월드 정착민 테스트 | 변방계 생존 시뮬레이션",
    description: "림월드 세계관에서 당신의 정착민 특성과 기술을 확인하세요. 변방계 생존 시뮬레이션 테스트입니다.",
    url: "https://test.ratkin.org",
    siteName: "변방계 정착민 테스트",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "변방계 정착민 테스트",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "림월드 정착민 테스트 | 변방계 생존 시뮬레이션",
    description: "림월드 세계관 기반 정착민 특성과 기술을 확인해보세요!",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "림월드 정착민 테스트",
              "alternateName": "변방계 정착민 테스트",
              "url": "https://test.ratkin.org",
              "description": "림월드 세계관을 기반으로 한 정착민 특성/기술 테스트 및 변방계 생존 시뮬레이션입니다.",
              "applicationCategory": "GameApplication",
              "genre": "Simulation",
              "operatingSystem": "Web",
              "author": {
                "@type": "Person",
                "name": "Nerdeyprite"
              },
              "keywords": "림월드 테스트, 림월드 정착민, 변방계, 변방계 테스트, 생존 테스트, 시뮬레이션, 림월드 시뮬레이션, rimworld test, Ratkin, 랫킨"
            })
          }}
        />
      </head>
      <body className={`${displayFont.variable} ${bodyFont.variable} font-[var(--font-body)]`}>
        <Providers>
          <Layout>
            {children}
          </Layout>
        </Providers>
        <Analytics />

        {/* Kakao SDK */}
        <Script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js"
          strategy="afterInteractive"
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
