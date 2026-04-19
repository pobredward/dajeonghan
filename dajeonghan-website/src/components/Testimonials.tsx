'use client'

import { motion, useAnimation, useInView, type Variants } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { Star, Quote } from 'lucide-react'

interface Testimonial {
  id: string
  name: string
  age: number
  occupation: string
  rating: number
  content: string
  highlight: string
  platform: 'ios' | 'android'
  avatar: string
}

export function Testimonials() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const controls = useAnimation()

  useEffect(() => {
    if (isInView) {
      controls.start('visible')
    }
  }, [controls, isInView])

  const testimonials: Testimonial[] = [
    {
      id: '1',
      name: '김민정',
      age: 28,
      occupation: '직장인',
      rating: 5,
      content: '평면도 그리기도 간단하고, 가구마다 다른 기능들이 정말 신기해요. 침대 눌러서 수면 패턴 보고, 냉장고에서 유통기한 관리까지! 이런 걸 원했던 거 같아요.',
      highlight: '음식 낭비가 거의 없어졌어요',
      platform: 'ios',
      avatar: '👩🏻‍💼'
    },
    {
      id: '2',
      name: '이지훈',
      age: 32,
      occupation: '개발자',
      rating: 5,
      content: '복잡한 기능들이 생각보다 직관적이에요. 청소 스케줄, 약 복용, 식품 관리를 한 앱에서 다 할 수 있어서 핸드폰에 앱이 줄었어요. 66일 습관 추적 기능으로 꾸준히 관리하게 되더라구요.',
      highlight: '한 앱에서 다 할 수 있어서 편리해요',
      platform: 'android',
      avatar: '👨🏻‍💻'
    },
    {
      id: '3',
      name: '박소영',
      age: 35,
      occupation: '주부',
      rating: 5,
      content: '아이 둘과 남편 약까지 관리하기 힘들었는데, 다정한 덕분에 모든 가족의 일정을 체계적으로 관리할 수 있게 됐어요. 알림도 너무 스마트해서 중요한 건 놓치지 않고, 스팸 같은 느낌도 안 들어요.',
      highlight: '가족 전체 일정을 체계적으로 관리',
      platform: 'ios',
      avatar: '👩🏻‍🏫'
    },
    {
      id: '4',
      name: '정현수',
      age: 24,
      occupation: '대학생',
      rating: 4,
      content: '자취하면서 집 관리가 정말 어려웠는데, 다정한으로 평면도 그려서 관리하니까 엄마한테 칭찬받았어요 ㅋㅋ 특히 각 가구마다 다른 기능들이 있어서 재미있게 할 수 있어요.',
      highlight: '각 가구마다 다른 기능들이 재미있어요',
      platform: 'android',
      avatar: '👨🏻‍🎓'
    },
    {
      id: '5',
      name: '최영미',
      age: 42,
      occupation: '간호사',
      rating: 5,
      content: '교대근무 때문에 생활패턴이 불규칙한데, 다정한이 제 스케줄에 맞춰서 알림을 주니까 정말 도움이 돼요. 약 복용도 빠뜨리지 않게 되고, 집 관리도 훨씬 수월해졌습니다.',
      highlight: '불규칙한 생활패턴에도 맞춤 관리',
      platform: 'ios',
      avatar: '👩🏻‍⚕️'
    },
    {
      id: '6',
      name: '문준호',
      age: 29,
      occupation: '마케터',
      rating: 5,
      content: '앱 디자인도 예쁘고 기능도 실용적이에요. 66일 습관 추적이 생각보다 동기부여가 되더라구요. 배지 모으는 재미도 있고, 주간 리포트 보면서 성취감도 느껴져요. 강추합니다!',
      highlight: '66일 습관 추적으로 동기부여',
      platform: 'android',
      avatar: '👨🏻‍💼'
    }
  ]

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1
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

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating 
              ? 'text-yellow-400 fill-current' 
              : 'text-neutral-300'
          }`}
        />
      ))}
    </div>
  )

  const PlatformBadge = ({ platform }: { platform: 'ios' | 'android' }) => (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
      platform === 'ios' 
        ? 'bg-gray-900 text-white' 
        : 'bg-green-600 text-white'
    }`}>
      {platform === 'ios' ? '🍎' : '🤖'}
      {platform === 'ios' ? 'App Store' : 'Play Store'}
    </div>
  )

  return (
    <section className="py-20 bg-gradient-to-br from-white to-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 30 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-neutral-800 mb-6">
            <span className="text-gradient">실제 사용자</span>들의
            <br />
            생생한 후기
          </h2>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed mb-8">
            다정한과 함께 달라진 일상을 경험한 사용자들의 진솔한 이야기를 들어보세요
          </p>
          
          {/* 평점 통계 */}
          <motion.div 
            className="flex flex-wrap items-center justify-center gap-8 text-sm text-neutral-600"
            variants={itemVariants}
          >
            <div className="flex items-center gap-2">
              <div className="flex text-yellow-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-5 h-5 fill-current" />
                ))}
              </div>
              <span className="font-bold text-lg text-neutral-800">4.8</span>
              <span>평균 평점</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-neutral-800">1,200+</span>
              <span>리뷰</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-neutral-800">95%</span>
              <span>재사용 의향</span>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={controls}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {testimonials.map((testimonial) => (
            <motion.div
              key={testimonial.id}
              variants={itemVariants}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 relative group"
              whileHover={{ y: -4 }}
            >
              {/* 인용 부호 */}
              <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Quote className="w-8 h-8 text-primary" />
              </div>

              {/* 사용자 정보 */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center text-xl">
                  {testimonial.avatar}
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-800">
                    {testimonial.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-neutral-500">
                    <span>{testimonial.age}세</span>
                    <span>•</span>
                    <span>{testimonial.occupation}</span>
                  </div>
                </div>
              </div>

              {/* 평점 */}
              <div className="flex items-center justify-between mb-4">
                <StarRating rating={testimonial.rating} />
                <PlatformBadge platform={testimonial.platform} />
              </div>

              {/* 리뷰 내용 */}
              <blockquote className="text-neutral-700 leading-relaxed mb-4 text-sm">
                {testimonial.content}
              </blockquote>

              {/* 하이라이트 */}
              <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg p-3 border-l-4 border-primary">
                <div className="text-primary font-medium text-sm">
                  "{testimonial.highlight}"
                </div>
              </div>

              {/* 호버 효과 */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </motion.div>
          ))}
        </motion.div>

        {/* 더 많은 리뷰 보기 CTA */}
        <motion.div 
          className="text-center mt-16"
          variants={itemVariants}
          initial="hidden"
          animate={controls}
        >
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {['👨🏻‍💼', '👩🏻‍⚕️', '👨🏻‍🎓', '👩🏻‍🏫'].map((avatar, index) => (
                  <div 
                    key={index}
                    className="w-10 h-10 bg-white rounded-full border-2 border-white flex items-center justify-center shadow-sm"
                  >
                    {avatar}
                  </div>
                ))}
              </div>
              <div className="text-left ml-3">
                <div className="text-sm font-medium text-neutral-800">
                  10만+ 사용자가 이미 경험했어요
                </div>
                <div className="text-xs text-neutral-600">
                  앱스토어에서 더 많은 리뷰를 확인하세요
                </div>
              </div>
            </div>
            
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors cursor-pointer"
            >
              리뷰 더보기 →
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}