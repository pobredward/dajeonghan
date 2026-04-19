// Google Analytics 4 설정
declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
  }
}

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID || ''

// 페이지뷰 추적
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_location: url,
    })
  }
}

// 이벤트 추적
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string
  category: string
  label?: string
  value?: number
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

// 앱 다운로드 이벤트 추적
export const trackAppDownload = (platform: 'ios' | 'android') => {
  event({
    action: 'download_app',
    category: 'engagement',
    label: platform,
  })
}

// 스크린샷 갤러리 이벤트 추적
export const trackScreenshotView = (screenshotId: string) => {
  event({
    action: 'view_screenshot',
    category: 'engagement',
    label: screenshotId,
  })
}

// 기능 카드 클릭 추적
export const trackFeatureClick = (featureName: string) => {
  event({
    action: 'click_feature',
    category: 'engagement',
    label: featureName,
  })
}

// 스크롤 깊이 추적 (25%, 50%, 75%, 100%)
export const trackScrollDepth = (depth: number) => {
  event({
    action: 'scroll_depth',
    category: 'engagement',
    label: `${depth}%`,
    value: depth,
  })
}