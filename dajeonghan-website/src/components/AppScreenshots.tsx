'use client'

import { motion, useAnimation, useInView } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Screenshot {
  id: string
  title: string
  description: string
  category: string
  mockup: React.ReactNode
}

export function AppScreenshots() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const controls = useAnimation()
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (isInView) {
      controls.start('visible')
    }
  }, [controls, isInView])

  // 목업 스크린 컴포넌트들
  const HouseMapMockup = () => (
    <div className="bg-gradient-to-b from-neutral-100 to-neutral-200 rounded-2xl p-4 h-full flex flex-col">
      <div className="bg-primary/10 rounded-xl p-3 mb-3 flex-1">
        <div className="grid grid-cols-2 gap-2 h-full">
          <div className="bg-primary/20 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 bg-primary/40 rounded-full mx-auto mb-1"></div>
              <div className="text-xs text-primary font-medium">거실</div>
            </div>
          </div>
          <div className="bg-secondary/20 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 bg-secondary/40 rounded-full mx-auto mb-1"></div>
              <div className="text-xs text-secondary font-medium">주방</div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg p-2 shadow-sm">
        <div className="text-xs text-neutral-600 mb-1">오늘의 할 일</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span className="text-xs text-neutral-800">거실 청소</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-xs text-neutral-800">주방 정리</span>
          </div>
        </div>
      </div>
    </div>
  )

  const FridgeMockup = () => (
    <div className="bg-gradient-to-b from-green-50 to-green-100 rounded-2xl p-4 h-full">
      <div className="bg-white rounded-xl shadow-sm p-3 h-full">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-neutral-800">냉장고</h3>
          <div className="w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
            <span className="text-xs text-white font-bold">3</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg border-l-4 border-red-400">
            <div>
              <div className="text-xs font-medium text-red-800">우유</div>
              <div className="text-xs text-red-600">1일 남음</div>
            </div>
            <div className="text-lg">🥛</div>
          </div>
          <div className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
            <div>
              <div className="text-xs font-medium text-yellow-800">달걀</div>
              <div className="text-xs text-yellow-600">3일 남음</div>
            </div>
            <div className="text-lg">🥚</div>
          </div>
          <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg border-l-4 border-green-400">
            <div>
              <div className="text-xs font-medium text-green-800">사과</div>
              <div className="text-xs text-green-600">7일 남음</div>
            </div>
            <div className="text-lg">🍎</div>
          </div>
        </div>
      </div>
    </div>
  )

  const CleaningMockup = () => (
    <div className="bg-gradient-to-b from-blue-50 to-blue-100 rounded-2xl p-4 h-full">
      <div className="bg-white rounded-xl shadow-sm p-3 h-full">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-neutral-800">청소 일정</h3>
          <div className="text-lg">🧹</div>
        </div>
        <div className="space-y-2">
          <motion.div 
            className="p-3 bg-primary/10 rounded-lg"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-primary">거실 청소</div>
                <div className="text-xs text-neutral-600">매일 오후 3시</div>
              </div>
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-xs text-white">70%</span>
              </div>
            </div>
          </motion.div>
          <div className="p-3 bg-neutral-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-neutral-600">화장실 청소</div>
                <div className="text-xs text-neutral-500">주 2회</div>
              </div>
              <div className="w-6 h-6 bg-neutral-300 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const BedSpecialMockup = () => (
    <div className="bg-gradient-to-b from-purple-50 to-purple-100 rounded-2xl p-4 h-full">
      <div className="bg-white rounded-xl shadow-sm p-3 h-full">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-neutral-800">침대 관리</h3>
          <div className="text-lg">🛏️</div>
        </div>
        <div className="space-y-2">
          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-400 rounded-full flex items-center justify-center text-white text-xs">😴</div>
              <div>
                <div className="text-sm font-medium text-purple-800">수면 패턴</div>
                <div className="text-xs text-purple-600">어젯밤 7시간 30분</div>
              </div>
            </div>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center text-white text-xs">🧺</div>
              <div>
                <div className="text-sm font-medium text-blue-800">침구 교체</div>
                <div className="text-xs text-blue-600">이번 주 일요일 예정</div>
              </div>
            </div>
          </div>
          <motion.div 
            className="p-3 bg-yellow-50 rounded-lg border border-yellow-200"
            animate={{ backgroundColor: ["rgb(254 249 195)", "rgb(253 246 178)", "rgb(254 249 195)"] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-white text-xs">🌙</div>
              <div>
                <div className="text-sm font-medium text-yellow-800">취침 준비</div>
                <div className="text-xs text-yellow-600">30분 후 알림 예정</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )

  const MedicineMockup = () => (
    <div className="bg-gradient-to-b from-purple-50 to-purple-100 rounded-2xl p-4 h-full">
      <div className="bg-white rounded-xl shadow-sm p-3 h-full">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-neutral-800">복용 관리</h3>
          <div className="text-lg">💊</div>
        </div>
        <div className="space-y-2">
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center text-white text-xs font-bold">✓</div>
              <div>
                <div className="text-sm font-medium text-green-800">비타민</div>
                <div className="text-xs text-green-600">오전 8시 복용완료</div>
              </div>
            </div>
          </div>
          <motion.div 
            className="p-3 bg-orange-50 rounded-lg border border-orange-200"
            animate={{ backgroundColor: ["rgb(255 247 237)", "rgb(254 240 221)", "rgb(255 247 237)"] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center text-white text-xs">!</div>
              <div>
                <div className="text-sm font-medium text-orange-800">오메가3</div>
                <div className="text-xs text-orange-600">오후 2시 복용 예정</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )

  const HabitMockup = () => (
    <div className="bg-gradient-to-b from-pink-50 to-pink-100 rounded-2xl p-4 h-full">
      <div className="bg-white rounded-xl shadow-sm p-3 h-full">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-neutral-800">습관 추적</h3>
          <div className="text-lg">🏆</div>
        </div>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-neutral-700">30일 연속</span>
              <span className="text-xs text-primary font-bold">45%</span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-2">
              <motion.div 
                className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: "45%" }}
                transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
              />
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 14 }, (_, i) => (
              <motion.div
                key={i}
                className={`aspect-square rounded text-xs flex items-center justify-center ${
                  i < 10 ? 'bg-primary text-white' : 'bg-neutral-200'
                }`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                {i < 10 ? '✓' : ''}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const NotificationMockup = () => (
    <div className="bg-gradient-to-b from-yellow-50 to-yellow-100 rounded-2xl p-4 h-full">
      <div className="bg-white rounded-xl shadow-sm p-3 h-full space-y-2">
        <div className="text-center mb-3">
          <h3 className="text-sm font-semibold text-neutral-800">알림</h3>
        </div>
        <motion.div 
          className="p-2 bg-red-50 rounded-lg border-l-4 border-red-400"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="text-xs font-medium text-red-800">긴급</div>
          <div className="text-xs text-red-600">약 복용 시간</div>
        </motion.div>
        <motion.div 
          className="p-2 bg-blue-50 rounded-lg border-l-4 border-blue-400"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <div className="text-xs font-medium text-blue-800">일반</div>
          <div className="text-xs text-blue-600">청소 시간 알림</div>
        </motion.div>
        <motion.div 
          className="p-2 bg-green-50 rounded-lg border-l-4 border-green-400"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <div className="text-xs font-medium text-green-800">다이제스트</div>
          <div className="text-xs text-green-600">오늘 할 일 정리</div>
        </motion.div>
      </div>
    </div>
  )

  const screenshots: Screenshot[] = [
    {
      id: '1',
      title: '2D 하우스 맵',
      description: '간편한 평면도 그리기로 내 집을 디지털화하고 가구 배치까지',
      category: '핵심기능',
      mockup: <HouseMapMockup />
    },
    {
      id: '2',
      title: '냉장고 관리',
      description: '유통기한 추적으로 식품 낭비 없이 효율적으로 관리',
      category: '생활관리',
      mockup: <FridgeMockup />
    },
    {
      id: '3',
      title: '청소 스케줄',
      description: '가구별 맞춤 청소 일정으로 체계적인 집 관리',
      category: '생활관리',
      mockup: <CleaningMockup />
    },
    {
      id: '4',
      title: '침대 특별기능',
      description: '수면 패턴 추적부터 침구 교체 알림까지 침대만의 특별한 관리',
      category: '가구관리',
      mockup: <BedSpecialMockup />
    },
    {
      id: '5',
      title: '습관 추적',
      description: '66일 습관 형성으로 꾸준한 생활 패턴 만들기',
      category: '습관관리',
      mockup: <HabitMockup />
    },
    {
      id: '6',
      title: '스마트 알림',
      description: '4채널 분리 알림으로 놓치지 않는 일정 관리',
      category: '알림',
      mockup: <NotificationMockup />
    }
  ]

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % screenshots.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + screenshots.length) % screenshots.length)
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  return (
    <section className="py-20 bg-gradient-to-br from-neutral-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 30 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-neutral-800 mb-6">
            앱에서 <span className="text-gradient">직접 경험</span>해보세요
          </h2>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
            평면도 그리기부터 가구별 특별 기능까지! 실제 앱 화면으로 다정한이 어떻게 근본적인 불편함을 해결하는지 확인해보세요
          </p>
        </motion.div>

        <div className="relative">
          {/* 메인 캐러셀 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center mb-12">
            {/* 이전 스크린샷 (데스크탑에서만 표시) */}
            <motion.div 
              className="hidden lg:block"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 0.5, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="transform scale-75 opacity-50">
                <div className="bg-neutral-800 rounded-3xl p-3 shadow-xl max-w-xs mx-auto">
                  <div className="aspect-[9/16] bg-white rounded-2xl overflow-hidden">
                    {screenshots[(currentIndex - 1 + screenshots.length) % screenshots.length].mockup}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 현재 스크린샷 */}
            <motion.div 
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="bg-neutral-800 rounded-3xl p-4 shadow-2xl max-w-sm mx-auto">
                <div className="aspect-[9/16] bg-white rounded-2xl overflow-hidden">
                  {screenshots[currentIndex].mockup}
                </div>
                {/* 홈 인디케이터 */}
                <div className="flex justify-center mt-3">
                  <div className="w-20 h-1 bg-neutral-600 rounded-full"></div>
                </div>
              </div>
              
              {/* 설명 */}
              <div className="text-center mt-8">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-3">
                  {screenshots[currentIndex].category}
                </div>
                <h3 className="text-2xl font-bold text-neutral-800 mb-2">
                  {screenshots[currentIndex].title}
                </h3>
                <p className="text-neutral-600 max-w-md mx-auto">
                  {screenshots[currentIndex].description}
                </p>
              </div>
            </motion.div>

            {/* 다음 스크린샷 (데스크탑에서만 표시) */}
            <motion.div 
              className="hidden lg:block"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 0.5, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="transform scale-75 opacity-50">
                <div className="bg-neutral-800 rounded-3xl p-3 shadow-xl max-w-xs mx-auto">
                  <div className="aspect-[9/16] bg-white rounded-2xl overflow-hidden">
                    {screenshots[(currentIndex + 1) % screenshots.length].mockup}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* 네비게이션 버튼 */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <button
              onClick={prevSlide}
              className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-neutral-50 transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-neutral-600" />
            </button>
            <button
              onClick={nextSlide}
              className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-neutral-50 transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-neutral-600" />
            </button>
          </div>

          {/* 도트 인디케이터 */}
          <div className="flex justify-center gap-2">
            {screenshots.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  index === currentIndex 
                    ? 'bg-primary scale-125' 
                    : 'bg-neutral-300 hover:bg-neutral-400'
                }`}
              />
            ))}
          </div>
        </div>

        {/* 자동 슬라이드 효과 */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-2 text-sm text-neutral-500">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            실제 앱에서 더 많은 기능을 경험해보세요
          </div>
        </div>
      </div>
    </section>
  )
}

// 자동 슬라이드 훅 추가
export function useAutoSlide(screenshots: Screenshot[], currentIndex: number, setCurrentIndex: (index: number) => void) {
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((currentIndex + 1) % screenshots.length)
    }, 5000) // 5초마다 자동 슬라이드

    return () => clearInterval(interval)
  }, [currentIndex, screenshots.length, setCurrentIndex])
}