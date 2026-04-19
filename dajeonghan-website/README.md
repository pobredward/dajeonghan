# 다정한 웹사이트

다정한 앱(3D 하우스 맵 기반 스마트 라이프케어 플랫폼)의 공식 마케팅 웹사이트입니다.

## 🌟 주요 기능

- **현대적인 디자인**: 따뜻하고 친근한 UI/UX 디자인
- **반응형 웹디자인**: 모든 디바이스에서 최적화된 경험
- **성능 최적화**: Next.js 16.2.4 + Tailwind CSS 4 최신 기술 스택
- **SEO 최적화**: 완벽한 메타데이터 및 구조화된 데이터
- **애니메이션**: Framer Motion을 활용한 부드러운 인터랙션

## 🚀 기술 스택

- **Frontend**: Next.js 16.2.4 (React 19.2.4)
- **스타일링**: Tailwind CSS 4
- **애니메이션**: Framer Motion 12.38.0
- **아이콘**: Lucide React 1.8.0
- **타이포그래피**: Pretendard + Inter
- **분석**: Google Analytics 4
- **배포**: Vercel (권장)

## 📱 웹사이트 구조

### 메인 페이지 섹션

1. **Hero Section**: 다정한 소개 및 다운로드 CTA
2. **Features Section**: 4가지 핵심 기능 소개
   - 3D 하우스 맵
   - 통합 생활관리
   - 스마트 알림
   - 66일 습관화
3. **App Screenshots**: 인터랙티브 앱 스크린샷 갤러리
4. **Testimonials**: 실제 사용자 후기
5. **CTA Section**: 최종 다운로드 유도 및 런칭 혜택
6. **Footer**: 연락처 및 법적 정보

## 🎨 디자인 시스템

### 컬러 팔레트
- **Primary**: #FF6B6B (따뜻한 코랄)
- **Secondary**: #4ECDC4 (부드러운 터쿼이즈)
- **Neutral**: #F8F9FA ~ #2D3748 (그라데이션)

### 타이포그래피
- **한글**: Pretendard Variable
- **영문**: Inter
- **크기**: 4xl~6xl (헤딩), xl~2xl (서브헤딩), base~lg (본문)

## 🛠️ 개발 환경 설정

### 필수 요구사항
- Node.js 23.10.0 이상
- npm 10.9.2 이상

### 설치 및 실행

```bash
# 저장소 클론
git clone [repository-url]
cd dajeonghan-website

# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env.local
# .env.local 파일에서 필요한 값들을 설정

# 개발 서버 실행
npm run dev
```

개발 서버는 [http://localhost:3000](http://localhost:3000)에서 실행됩니다.

### 빌드 및 배포

```bash
# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm run start

# 코드 품질 검사
npm run lint
```

## 📊 성과 측정

### Google Analytics 4 이벤트 추적

- **앱 다운로드**: `download_app` (iOS/Android 구분)
- **기능 클릭**: `click_feature` (기능별)
- **스크린샷 보기**: `view_screenshot` (화면별)
- **스크롤 깊도**: `scroll_depth` (25%, 50%, 75%, 100%)

### 주요 KPI

- 앱 다운로드 전환율
- 페이지 체류시간
- 스크롤 완료율
- 모바일 vs 데스크탑 트래픽

## 🚀 배포

### Vercel 배포 (권장)

```bash
# Vercel CLI 설치
npm i -g vercel

# 프로젝트 배포
vercel

# 환경변수 설정
vercel env add NEXT_PUBLIC_GA_ID
vercel env add NEXT_PUBLIC_APP_STORE_URL
vercel env add NEXT_PUBLIC_PLAY_STORE_URL
```

### 환경변수

```bash
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX                           # Google Analytics 4 ID
NEXT_PUBLIC_SITE_URL=https://dajeonghan.app              # 사이트 URL
NEXT_PUBLIC_APP_STORE_URL=https://apps.apple.com/...     # Apple App Store URL
NEXT_PUBLIC_PLAY_STORE_URL=https://play.google.com/...   # Google Play Store URL
```

## 📝 추가 기능 개발

### 향후 개선사항

1. **A/B 테스트**: 다른 CTA 문구나 디자인 테스트
2. **다국어 지원**: i18next를 활용한 영문 버전
3. **블로그 섹션**: 사용 팁이나 생활 관리 콘텐츠
4. **FAQ 페이지**: 자주 묻는 질문 모음
5. **고객 지원**: 문의 폼이나 채팅봇 연동

### 컴포넌트 확장

새로운 섹션 추가 시 다음 구조를 따라주세요:

```tsx
'use client'

import { motion, useAnimation, useInView } from 'framer-motion'
import { useEffect, useRef } from 'react'

export function NewSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const controls = useAnimation()

  useEffect(() => {
    if (isInView) {
      controls.start('visible')
    }
  }, [controls, isInView])

  // 컴포넌트 로직...
}
```

## 🤝 기여 가이드

1. 기능 개발 전 이슈 생성
2. `feature/기능명` 브랜치에서 개발
3. 커밋 메시지는 한글로 명확하게
4. PR 생성 시 스크린샷 첨부
5. 모바일 테스트 필수

## 📞 문의

- **이메일**: support@dajeonghan.app
- **개발사**: OnMind Lab
- **앱 다운로드**: [iOS](https://apps.apple.com/app/dajeonghan) | [Android](https://play.google.com/store/apps/details?id=com.onmindlab.dajeonghan)

---

© 2026 OnMind Lab. All rights reserved.