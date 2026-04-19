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

  // 3D 하우스 맵 일러스트레이션
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

  // 통합 생활관리 일러스트레이션
  const IntegratedManagementIllustration = () => (
    <div className="bg-gradient-to-br from-secondary/10 to-primary/10 rounded-3xl p-8 shadow-2xl">
      <div className="aspect-square bg-white/80 rounded-2xl p-6 relative">
        {/* 중앙 허브 */}
        <motion.div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center shadow-lg z-10"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <Home className="w-8 h-8 text-white" />
        </motion.div>
        
        {/* 주변 기능들 */}
        <motion.div 
          className="absolute top-4 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-green-400 rounded-full flex items-center justify-center shadow-lg"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0 }}
        >
          <Refrigerator className="w-6 h-6 text-white" />
        </motion.div>
        
        <motion.div 
          className="absolute top-1/2 right-4 transform -translate-y-1/2 w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center shadow-lg"
          animate={{ x: [0, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        >
          <Sparkles className="w-6 h-6 text-white" />
        </motion.div>
        
        <motion.div 
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-purple-400 rounded-full flex items-center justify-center shadow-lg"
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
        >
          💊
        </motion.div>
        
        <motion.div 
          className="absolute top-1/2 left-4 transform -translate-y-1/2 w-12 h-12 bg-orange-400 rounded-full flex items-center justify-center shadow-lg"
          animate={{ x: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
        >
          🧹
        </motion.div>

        {/* 연결 선들 */}
        <svg className="absolute inset-0 w-full h-full">
          <motion.line
            x1="50%" y1="50%" x2="50%" y2="20%"
            stroke="#FF6B6B" strokeWidth="2" strokeDasharray="4,4"
            animate={{ strokeDashoffset: [0, -8] }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.line
            x1="50%" y1="50%" x2="80%" y2="50%"
            stroke="#4ECDC4" strokeWidth="2" strokeDasharray="4,4"
            animate={{ strokeDashoffset: [0, -8] }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear", delay: 0.25 }}
          />
        </svg>
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
      title: "3D 하우스 맵",
      description: "직관적인 3D 인터페이스로 집 안의 모든 공간을 한눈에 파악하고 관리할 수 있습니다. 9가지 방 타입과 18종 가구를 자유롭게 배치하세요.",
      benefits: [
        "드래그 앤 드롭으로 쉬운 방 및 가구 배치",
        "실제 집 구조를 반영한 직관적인 관리",
        "방별, 가구별 맞춤 태스크 자동 생성",
        "시각적으로 명확한 진행 상황 확인"
      ],
      image: <HouseMapIllustration />,
      gradient: "from-primary/10 to-orange-100"
    },
    {
      icon: <Smartphone className="w-8 h-8 text-secondary" />,
      title: "통합 생활관리",
      description: "냉장고 유통기한, 청소 루틴, 약 복용 관리를 하나의 앱에서 완전 통합 관리할 수 있습니다. 더 이상 여러 앱을 오갈 필요가 없어요.",
      benefits: [
        "냉장고 식품 유통기한 자동 추적",
        "가구별 맞춤 청소 스케줄 관리",
        "약 복용 시간 알림 및 기록",
        "모든 생활 패턴을 한 곳에서 관리"
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
            다정한의 4가지 핵심 기능으로 복잡한 일상을 체계적이고 효율적으로 관리해보세요
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