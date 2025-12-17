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
  description: "당신이 림월드에 떨어진다면 어떤 특성을 가질까요? 변방계 생존 적합성 테스트로 당신의 정착민 유형을 확인하세요.",
  keywords: ["림월드", "Rimworld", "성격 테스트", "MBTI", "변방계", "적성 검사", "심리 테스트", "게임", "생존", "특성"],
  authors: [{ name: "Nerdeyprite" }],
  openGraph: {
    title: "변방계 정착민 테스트",
    description: "당신은 낙천적인가요, 아니면 유리정신인가요? 림월드 세계관으로 보는 나의 성격 유형.",
    url: "https://test.ratkin.org",
    siteName: "변방계 정착민 테스트",
    images: [
      {
        url: "/og-image.png", // public 폴더에 해당 이미지 필요
        width: 1200,
        height: 630,
        alt: "변방계 정착민 테스트 미리보기",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "변방계 정착민 테스트",
    description: "당신의 림월드 특성을 확인해보세요!",
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
