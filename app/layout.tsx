import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import Layout from "../components/Layout";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "변방계 정착민 테스트 (Rimworld Traits Test)",
    template: "%s | 변방계 정착민 테스트",
  },
  description: "변방계 정착민 테스트에서 당신의 특성을 확인하세요. 당신이 림월드에 떨어진다면 어떤 특성과 기술을 가질까요? 변방계 생존 적합성 테스트입니다.",
  keywords: ["림월드 테스트", "림월드 테스트 사이트", "림월드", "Rimworld", "성격 테스트", "MBTI", "변방계", "적성 검사", "심리 테스트", "게임", "생존", "특성"],
  authors: [{ name: "Nerdeyprite" }],
  openGraph: {
    title: "변방계 정착민 테스트",
    description: "당신이 림월드에 떨어진다면 어떤 특성과 기술을 가질까요? 변방계 생존 시뮬레이션 테스트입니다.",
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
    title: "변방계 정착민 테스트",
    description: "당신의 림월드 특성과 기술을 확인해보세요!",
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
              "name": "변방계 정착민 테스트",
              "url": "https://test.ratkin.org",
              "description": "림월드 세계관을 기반으로 한 성격 유형 및 정착민 특성 테스트입니다.",
              "applicationCategory": "GameApplication",
              "genre": "Simulation",
              "operatingSystem": "Web",
              "author": {
                "@type": "Person",
                "name": "Nerdeyprite"
              },
              "keywords": "림월드, Rimworld, 테스트, 성격테스트, 림월드 테스트 사이트"
            })
          }}
        />
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
