'use client'

import { motion, useAnimation, useInView } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { FeatureCard } from './FeatureCard'
import { 
  Home, 
  Smartphone, 
  Bell, 
  Target,
  Refrigerator,
  Sparkles,
  Calendar,
  Brain
} from 'lucide-react'

export function Features() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const controls = useAnimation()

  useEffect(() => {
    if (isInView) {
      controls.start('visible')
    }
  }, [controls, isInView])

  // 2D 하우스 맵 일러스트레이션
  const HouseMapIllustration = () => (
    <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-3xl p-8 shadow-2xl">
      <div className="aspect-square bg-white/80 rounded-2xl p-6 relative overflow-hidden">
        {/* 집 구조 표현 */}
        <div className="grid grid-cols-3 gap-3 h-full">
          <div className="space-y-3">
            <motion.div 
              className="bg-primary/30 rounded-xl h-20 flex items-center justify-center relative"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <Home className="w-6 h-6 text-primary" />
              <motion.div 
                className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.div>
            <div className="bg-secondary/20 rounded-xl h-16 flex items-center justify-center">
              <Refrigerator className="w-5 h-5 text-secondary" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="bg-yellow-200/50 rounded-xl h-16 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="bg-primary/20 rounded-xl h-24 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="bg-green-200/50 rounded-xl h-14 flex items-center justify-center">
              <Brain className="w-5 h-5 text-green-600" />
            </div>
            <div className="bg-secondary/30 rounded-xl h-20 flex items-center justify-center">
              <Bell className="w-5 h-5 text-secondary" />
            </div>
          </div>
        </div>
        
        {/* 플로팅 태스크 카드 */}
        <motion.div 
          className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-3 border-l-4 border-primary"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="text-xs text-neutral-500 mb-1">진행 중</div>
          <div className="text-sm font-medium text-neutral-800">거실 청소</div>
          <div className="w-full bg-neutral-100 rounded-full h-1.5 mt-2">
            <motion.div 
              className="bg-primary h-1.5 rounded-full"
              initial={{ width: "30%" }}
              animate={{ width: "70%" }}
              transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  )

  // 가구별 맞춤 생활관리 일러스트레이션
  const IntegratedManagementIllustration = () => (
    <div className="bg-gradient-to-br from-secondary/10 to-primary/10 rounded-3xl p-8 shadow-2xl">
      <div className="aspect-square bg-white/80 rounded-2xl p-6 relative">
        {/* 가구들을 평면도 스타일로 배치 */}
        <div className="grid grid-cols-2 gap-4 h-full">
          {/* 침대 */}
          <motion.div 
            className="bg-purple-100 rounded-xl p-3 cursor-pointer hover:bg-purple-200 transition-colors relative"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="text-2xl mb-2">🛏️</div>
            <div className="text-xs font-medium text-purple-800">침대</div>
            <motion.div 
              className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-xs text-white">💤</span>
            </motion.div>
          </motion.div>
          
          {/* 냉장고 */}
          <motion.div 
            className="bg-green-100 rounded-xl p-3 cursor-pointer hover:bg-green-200 transition-colors relative"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="text-2xl mb-2">🧊</div>
            <div className="text-xs font-medium text-green-800">냉장고</div>
            <motion.div 
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
            >
              <span className="text-xs text-white">!</span>
            </motion.div>
          </motion.div>
          
          {/* 책상 */}
          <motion.div 
            className="bg-blue-100 rounded-xl p-3 cursor-pointer hover:bg-blue-200 transition-colors relative"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="text-2xl mb-2">🏢</div>
            <div className="text-xs font-medium text-blue-800">책상</div>
            <motion.div 
              className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <span className="text-xs text-white">📊</span>
            </motion.div>
          </motion.div>
          
          {/* 소파 */}
          <motion.div 
            className="bg-orange-100 rounded-xl p-3 cursor-pointer hover:bg-orange-200 transition-colors relative"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="text-2xl mb-2">🛋️</div>
            <div className="text-xs font-medium text-orange-800">소파</div>
            <motion.div 
              className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            >
              <span className="text-xs text-white">✨</span>
            </motion.div>
          </motion.div>
        </div>
        
        {/* 중앙 설명 */}
        <motion.div 
          className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <div className="text-xs text-center text-neutral-600">
            <strong className="text-primary">가구를 눌러</strong> 맞춤 기능 확인
          </div>
        </motion.div>
      </div>
    </div>
  )

  // 스마트 알림 일러스트레이션
  const SmartNotificationIllustration = () => (
    <div className="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-3xl p-8 shadow-2xl">
      <div className="aspect-square bg-white/80 rounded-2xl p-6 relative">
        {/* 스마트폰 모양 */}
        <div className="mx-auto w-32 h-52 bg-neutral-800 rounded-2xl p-2 relative">
          <div className="w-full h-full bg-white rounded-xl p-4 overflow-hidden">
            {/* 알림들 */}
            <motion.div 
              className="bg-primary/10 rounded-lg p-3 mb-2"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <div className="flex items-center gap-2">
                <Bell className="w-3 h-3 text-primary" />
                <div className="text-xs font-medium">청소 알림</div>
              </div>
              <div className="text-xs text-neutral-600 mt-1">거실 청소 시간이에요</div>
            </motion.div>
            
            <motion.div 
              className="bg-secondary/10 rounded-lg p-3 mb-2"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              <div className="flex items-center gap-2">
                <Refrigerator className="w-3 h-3 text-secondary" />
                <div className="text-xs font-medium">냉장고</div>
              </div>
              <div className="text-xs text-neutral-600 mt-1">우유 유통기한 임박</div>
            </motion.div>
            
            <motion.div 
              className="bg-green-100 rounded-lg p-3"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.5 }}
            >
              <div className="flex items-center gap-2">
                <div className="text-xs">💊</div>
                <div className="text-xs font-medium">약 복용</div>
              </div>
              <div className="text-xs text-neutral-600 mt-1">오후 2시 복용 시간</div>
            </motion.div>
          </div>
          
          {/* 홈 버튼 */}
          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-neutral-300 rounded-full"></div>
        </div>
        
        {/* 알림 아이콘들 */}
        <motion.div 
          className="absolute top-4 right-4 w-8 h-8 bg-red-400 rounded-full flex items-center justify-center text-white text-sm"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          3
        </motion.div>
      </div>
    </div>
  )

  // 66일 습관화 일러스트레이션
  const HabitTrackingIllustration = () => (
    <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl p-8 shadow-2xl">
      <div className="aspect-square bg-white/80 rounded-2xl p-6 relative">
        {/* 달력 그리드 */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {Array.from({ length: 35 }, (_, i) => (
            <motion.div
              key={i}
              className={`aspect-square rounded-md flex items-center justify-center text-xs ${
                i < 28 
                  ? 'bg-primary text-white' 
                  : i < 32 
                  ? 'bg-primary/50 text-white' 
                  : 'bg-neutral-100 text-neutral-400'
              }`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.02, duration: 0.3 }}
            >
              {i < 30 ? '✓' : i + 1 - 30}
            </motion.div>
          ))}
        </div>
        
        {/* 진행률 바 */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-neutral-700">습관 형성 진행률</span>
              <span className="text-sm text-primary font-bold">45%</span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-2">
              <motion.div 
                className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: "45%" }}
                transition={{ duration: 2, delay: 1 }}
              />
            </div>
            <div className="text-xs text-neutral-500 mt-1">30일 / 66일</div>
          </div>
          
          {/* 배지 */}
          <motion.div 
            className="flex items-center gap-2 p-3 bg-yellow-100 rounded-lg"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
              🏆
            </div>
            <div>
              <div className="text-sm font-medium text-yellow-800">30일 달성!</div>
              <div className="text-xs text-yellow-600">꾸준함의 힘</div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )

  const features = [
    {
      icon: <Home className="w-8 h-8 text-primary" />,
      title: "2D 하우스 맵",
      description: "간편하게 내 집 평면도를 그리고 가구를 자유롭게 추가할 수 있습니다. 직관적인 2D 인터페이스로 누구나 쉽게 우리 집을 디지털화하세요.",
      benefits: [
        "손쉬운 평면도 그리기 도구",
        "다양한 가구 템플릿으로 빠른 배치",
        "실제 집 크기에 맞는 비율 조정",
        "완성된 맵으로 효율적인 공간 관리"
      ],
      image: <HouseMapIllustration />,
      gradient: "from-primary/10 to-orange-100"
    },
    {
      icon: <Smartphone className="w-8 h-8 text-secondary" />,
      title: "가구별 맞춤 생활관리",
      description: "침대를 누르면 수면 패턴 분석과 매트리스 관리, 책상을 누르면 업무 효율성 추적까지! 각 가구의 본질적 기능에 맞는 특별한 관리 도구를 제공합니다.",
      benefits: [
        "가구 종류별 전용 기능과 태스크",
        "냉장고: 유통기한부터 식단 관리까지",
        "침대: 수면 추적과 침구 관리",
        "책상: 집중 시간과 정리 상태 모니터링"
      ],
      image: <IntegratedManagementIllustration />,
      reverse: true,
      gradient: "from-secondary/10 to-blue-100"
    },
    {
      icon: <Bell className="w-8 h-8 text-yellow-600" />,
      title: "스마트 알림",
      description: "4채널 분리 시스템으로 다이제스트 알림(아침/저녁)과 즉시 알림을 지능적으로 관리합니다. 놓치지 않는 맞춤형 알림을 경험하세요.",
      benefits: [
        "아침/저녁 다이제스트로 하루 계획 정리",
        "긴급한 일은 즉시 알림으로 바로 확인",
        "4채널 분리로 알림 피로도 최소화",
        "개인 패턴에 맞춘 지능형 알림 타이밍"
      ],
      image: <SmartNotificationIllustration />,
      gradient: "from-yellow-100 to-orange-100"
    },
    {
      icon: <Target className="w-8 h-8 text-purple-600" />,
      title: "66일 습관화",
      description: "과학적 근거를 바탕으로 한 66일 습관 형성 엔진으로 스트릭을 추적하고, 마일스톤 배지와 주간 리포트로 동기를 부여합니다.",
      benefits: [
        "과학적 66일 습관 형성 이론 적용",
        "일별 스트릭 추적 및 시각화",
        "달성 단계별 배지 및 보상 시스템",
        "주간 리포트로 성장 과정 확인"
      ],
      image: <HabitTrackingIllustration />,
      reverse: true,
      gradient: "from-purple-100 to-pink-100"
    }
  ]

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 30 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-neutral-800 mb-6">
            <span className="text-gradient">핵심 기능</span>으로 경험하는
            <br />
            스마트한 생활 관리
          </h2>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
            평면도 그리기부터 가구별 맞춤 관리까지, 다정한의 4가지 핵심 기능으로 근본적인 생활의 불편함을 해결해보세요
          </p>
        </motion.div>

        <div className="space-y-32">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              benefits={feature.benefits}
              image={feature.image}
              reverse={feature.reverse}
              gradient={feature.gradient}
            />
          ))}
        </div>
      </div>
    </section>
  )
}