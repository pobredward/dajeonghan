'use client'

import { motion, useAnimation, useInView } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { DownloadButtons } from './DownloadButtons'
import { Smartphone, Heart, Star, Sparkles } from 'lucide-react'

export function CTA() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const controls = useAnimation()

  useEffect(() => {
    if (isInView) {
      controls.start('visible')
    }
  }, [controls, isInView])

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' }
    }
  }

  const floatingAnimation = {
    y: [0, -10, 0],
    rotate: [0, 5, 0],
    transition: {
      duration: 3,
      ease: 'easeInOut',
      repeat: Infinity
    }
  }

  return (
    <section className="py-20 bg-gradient-to-br from-primary/5 via-white to-secondary/5 relative overflow-hidden">
      {/* 배경 장식 */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-secondary/5 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={controls}
          className="text-center"
        >
          {/* 상단 배지 */}
          <motion.div variants={itemVariants} className="mb-8">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-secondary text-white px-6 py-3 rounded-full text-sm font-medium shadow-lg">
              <Sparkles className="w-4 h-4" />
              지금 다운로드하고 체계적인 생활 시작하기
            </div>
          </motion.div>

          {/* 메인 헤드라인 */}
          <motion.div variants={itemVariants} className="mb-12">
            <h2 className="text-4xl md:text-6xl font-bold text-neutral-800 mb-6 leading-tight">
              <span className="text-gradient">다정한</span>과 함께
              <br />
              새로운 생활을 시작하세요
            </h2>
            <p className="text-xl md:text-2xl text-neutral-600 max-w-4xl mx-auto leading-relaxed">
              3D 하우스 맵, 통합 생활관리, 스마트 알림, 66일 습관화까지
              <br />
              <strong className="text-primary">무료로</strong> 다운로드하고 지금 바로 경험해보세요
            </p>
          </motion.div>

          {/* 다운로드 버튼 */}
          <motion.div variants={itemVariants} className="mb-16">
            <DownloadButtons showQR={true} />
          </motion.div>

          {/* 신뢰 지표들 */}
          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
          >
            <motion.div 
              className="flex flex-col items-center p-6 bg-white/50 backdrop-blur-sm rounded-2xl shadow-lg"
              whileHover={{ y: -5, scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center mb-4 shadow-lg">
                <Star className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-neutral-800 mb-2">4.8★</div>
              <div className="text-neutral-600">앱스토어 평점</div>
              <div className="text-sm text-neutral-500 mt-1">1,200+ 리뷰</div>
            </motion.div>

            <motion.div 
              className="flex flex-col items-center p-6 bg-white/50 backdrop-blur-sm rounded-2xl shadow-lg"
              whileHover={{ y: -5, scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center mb-4 shadow-lg">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-neutral-800 mb-2">10만+</div>
              <div className="text-neutral-600">다운로드</div>
              <div className="text-sm text-neutral-500 mt-1">iOS · Android</div>
            </motion.div>

            <motion.div 
              className="flex flex-col items-center p-6 bg-white/50 backdrop-blur-sm rounded-2xl shadow-lg"
              whileHover={{ y: -5, scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-16 h-16 bg-gradient-to-r from-pink-400 to-red-400 rounded-full flex items-center justify-center mb-4 shadow-lg">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-neutral-800 mb-2">95%</div>
              <div className="text-neutral-600">재사용 의향</div>
              <div className="text-sm text-neutral-500 mt-1">사용자 만족도</div>
            </motion.div>
          </motion.div>

          {/* 특별 혜택 */}
          <motion.div 
            variants={itemVariants}
            className="bg-gradient-to-r from-primary to-secondary rounded-3xl p-8 text-white relative overflow-hidden"
          >
            {/* 배경 패턴 */}
            <div className="absolute inset-0">
              <div className="absolute top-4 left-4 w-12 h-12 border border-white/20 rounded-full"></div>
              <div className="absolute bottom-8 right-8 w-16 h-16 border border-white/20 rounded-full"></div>
              <div className="absolute top-1/2 right-1/4 w-8 h-8 border border-white/20 rounded-full"></div>
            </div>

            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="text-left">
                <h3 className="text-2xl md:text-3xl font-bold mb-4">
                  🎉 런칭 기념 특별 혜택
                </h3>
                <div className="space-y-3 text-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold">✓</span>
                    </div>
                    <span>모든 프리미엄 기능 <strong>30일 무료</strong></span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold">✓</span>
                    </div>
                    <span>전용 템플릿 <strong>100개 무료</strong> 제공</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold">✓</span>
                    </div>
                    <span>개인 맞춤 설정 <strong>무료 상담</strong></span>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-white/20 rounded-xl backdrop-blur-sm">
                  <div className="text-sm opacity-90">
                    <strong>📅 한정 혜택:</strong> 2026년 5월 31일까지
                  </div>
                </div>
              </div>

              <motion.div 
                className="flex justify-center lg:justify-end"
                animate={floatingAnimation}
              >
                <div className="relative">
                  <div className="w-48 h-48 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-white/30">
                    <div className="text-6xl">🎁</div>
                  </div>
                  <motion.div 
                    className="absolute -top-4 -right-4 w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  >
                    <span className="text-2xl">✨</span>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* 마지막 액션 유도 */}
          <motion.div variants={itemVariants} className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 text-neutral-600">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span className="text-lg">지금 다운로드하면 <strong className="text-primary">5분 내</strong> 설정 완료!</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}