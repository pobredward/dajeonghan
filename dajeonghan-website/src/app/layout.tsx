import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://dajeonghan.app'),
  title: "다정한 - 2D 하우스 맵 기반 스마트 라이프케어",
  description: "간편한 2D 평면도로 내 집을 그리고 가구별 맞춤 기능까지! 집안일부터 건강관리까지 하나의 앱에서 체계적이고 다정하게 관리하세요.",
  keywords: "생활관리 앱, 집안일 관리, 스마트홈 앱, 평면도 그리기, 가구 관리, 청소 스케줄, 약 복용 관리, 습관 추적, 2D 하우스 맵",
  authors: [{ name: "OnMind Lab" }],
  creator: "OnMind Lab",
  publisher: "OnMind Lab",
  robots: "index, follow",
  
  // Open Graph
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://dajeonghan.app",
    title: "다정한 - 2D 하우스 맵 기반 스마트 라이프케어",
    description: "간편한 2D 평면도로 내 집을 그리고 가구별 맞춤 기능까지! 집안일부터 건강관리까지 하나의 앱에서 관리하세요.",
    siteName: "다정한",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "다정한 - 스마트 라이프케어 앱"
      }
    ]
  },
  
  // Twitter
  twitter: {
    card: "summary_large_image",
    site: "@dajeonghan_app",
    creator: "@onmindlab",
    title: "다정한 - 2D 하우스 맵 기반 스마트 라이프케어",
    description: "간편한 2D 평면도로 내 집을 그리고 가구별 맞춤 기능까지! 집안일부터 건강관리까지 하나의 앱에서 관리하세요.",
    images: ["/twitter-image.png"]
  },
  
  // App Store / Play Store
  other: {
    "apple-itunes-app": "app-id=dajeonghan",
    "google-play-app": "app-id=com.onmindlab.dajeonghan"
  },
  
  // Verification
  verification: {
    google: "your-google-verification-code",
    other: {
      "naver-site-verification": "your-naver-verification-code"
    }
  },
  
  // Manifest
  manifest: "/manifest.json",
  
  // Icons
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "192x192", type: "image/png" },
      { url: "/dajeonghan-logo.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [
      { url: "/dajeonghan-logo.png", sizes: "180x180", type: "image/png" }
    ]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${inter.variable} h-full`}>
      <head>
        {/* 구조화된 데이터 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MobileApplication",
              "name": "다정한",
              "alternateName": "Dajeonghan",
              "description": "2D 하우스 맵 기반 스마트 라이프케어 플랫폼",
              "applicationCategory": "LifestyleApplication",
              "operatingSystem": ["iOS", "Android"],
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "KRW"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "ratingCount": "1200"
              },
              "author": {
                "@type": "Organization",
                "name": "OnMind Lab"
              }
            })
          }}
        />
        
        {/* 추가 메타 태그들 */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="다정한" />
        
        {/* 프리로드 중요 리소스 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        
        {/* Pretendard 폰트 */}
        <link 
          rel="stylesheet" 
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/web/variable/pretendard-variable.css"
        />
        
        {/* Google Analytics */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                    page_location: window.location.href,
                  });
                `
              }}
            />
          </>
        )}
      </head>
      <body className="min-h-full antialiased">
        {children}
      </body>
    </html>
  );
}
