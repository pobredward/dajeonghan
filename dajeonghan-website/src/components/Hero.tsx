'use client'

import { useEffect, useRef } from 'react'
import { motion, useAnimation, useInView, type Variants } from 'framer-motion'
import { DownloadButtons } from './DownloadButtons'
import { Star, Users, Heart } from 'lucide-react'

export function Hero() {
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
    transition: {
      duration: 3,
      repeat: Infinity
    }
  }

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50 overflow-hidden">
      {/* 배경 장식 요소들 */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-secondary/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-primary/5 rounded-full blur-xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={controls}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[80vh]"
        >
          {/* 왼쪽: 텍스트 콘텐츠 */}
          <div className="text-center lg:text-left">
            <motion.div variants={itemVariants} className="mb-6">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Heart className="w-4 h-4" />
                따뜻한 생활 관리
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                <span className="text-gradient">체계적인 생활 관리</span>를 위한<br />
                <span className="text-neutral-800">스마트 라이프케어</span>
              </h1>
              
              <p className="text-xl text-neutral-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                간편하게 평면도를 그리고 가구별 맞춤 기능까지,<br />
                하나의 앱에서 <strong className="text-primary">다정하게</strong> 관리하세요
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="mb-8">
              <DownloadButtons />
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-neutral-500">
              <div className="flex items-center gap-1">
                <div className="flex text-yellow-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <span className="ml-2 font-medium">4.8점 평점</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>10만+ 다운로드</span>
              </div>
            </motion.div>
          </div>

          {/* 오른쪽: 2D 하우스 맵 미리보기 */}
          <div className="relative">
            <motion.div
              variants={itemVariants}
              animate={floatingAnimation}
              className="relative"
            >
              {/* 메인 앱 이미지 플레이스홀더 */}
              <div className="relative bg-gradient-to-br from-white to-neutral-100 rounded-3xl shadow-2xl p-8 mx-auto max-w-md">
                <div className="aspect-[9/16] bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden">
                  {/* 2D 하우스 맵 미리보기 모형 */}
                  <div className="relative w-full h-full p-6">
                    {/* 방 레이아웃 표현 */}
                    <div className="grid grid-cols-2 gap-2 h-1/2 mb-2">
                      <div className="bg-primary/30 rounded-lg flex items-center justify-center">
                        <div className="w-6 h-6 bg-primary/50 rounded"></div>
                      </div>
                      <div className="bg-secondary/30 rounded-lg flex items-center justify-center">
                        <div className="w-6 h-6 bg-secondary/50 rounded"></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 h-1/2">
                      <div className="bg-primary/20 rounded-lg flex items-center justify-center">
                        <div className="w-4 h-4 bg-primary/40 rounded"></div>
                      </div>
                      <div className="bg-secondary/20 rounded-lg flex items-center justify-center">
                        <div className="w-4 h-4 bg-secondary/40 rounded"></div>
                      </div>
                      <div className="bg-primary/20 rounded-lg flex items-center justify-center">
                        <div className="w-4 h-4 bg-primary/40 rounded"></div>
                      </div>
                    </div>
                    
                    {/* 플로팅 아이콘들 */}
                    <motion.div 
                      className="absolute top-4 right-4 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-xs shadow-lg"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    >
                      🧹
                    </motion.div>
                    <motion.div 
                      className="absolute bottom-6 left-4 w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-white text-xs shadow-lg"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      🏠
                    </motion.div>
                  </div>
                  
                  <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3">
                    <div className="text-xs text-neutral-600 mb-1">오늘의 할 일</div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-neutral-800">거실 청소</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 데코레이션 요소들 */}
              <motion.div 
                className="absolute -top-6 -left-6 w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                ✨
              </motion.div>
              <motion.div 
                className="absolute -bottom-4 -right-4 w-16 h-16 bg-green-400 rounded-full flex items-center justify-center shadow-lg"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              >
                💚
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* 스크롤 인디케이터 */}
        <motion.div 
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 border-2 border-neutral-300 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-neutral-300 rounded-full mt-2"></div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}