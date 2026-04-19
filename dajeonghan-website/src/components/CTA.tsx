'use client'

import { motion, useAnimation, useInView, type Variants } from 'framer-motion'
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

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.2
      }
    }
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  }

  const floatingAnimation = {
    y: [0, -10, 0],
    rotate: [0, 5, 0],
    transition: {
      duration: 3,
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
              2D 평면도 그리기, 가구별 맞춤 관리, 스마트 알림, 66일 습관화까지
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

          {/* 특별 혜택 섹션 제거됨 */}

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