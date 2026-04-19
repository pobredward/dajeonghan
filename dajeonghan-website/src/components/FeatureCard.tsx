'use client'

import { motion, useAnimation, useInView } from 'framer-motion'
import { useEffect, useRef } from 'react'

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  benefits: string[]
  image?: React.ReactNode
  reverse?: boolean
  gradient?: string
}

export function FeatureCard({ 
  icon, 
  title, 
  description, 
  benefits, 
  image, 
  reverse = false,
  gradient = 'from-primary/10 to-secondary/10'
}: FeatureCardProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
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
        staggerChildren: 0.1
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

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.8, ease: 'easeOut' }
    }
  }

  return (
    <motion.div
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={controls}
      className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-16 ${reverse ? 'lg:grid-flow-col-dense' : ''}`}
    >
      {/* 텍스트 콘텐츠 */}
      <div className={`${reverse ? 'lg:col-start-2' : ''}`}>
        <motion.div variants={itemVariants} className="mb-6">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className={`p-3 bg-gradient-to-r ${gradient} rounded-2xl`}>
              {icon}
            </div>
          </div>
          
          <h3 className="text-3xl md:text-4xl font-bold text-neutral-800 mb-4">
            {title}
          </h3>
          
          <p className="text-lg text-neutral-600 leading-relaxed mb-6">
            {description}
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-3">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="flex items-start gap-3"
            >
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-neutral-700 font-medium">{benefit}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* 이미지/일러스트레이션 */}
      <motion.div
        variants={imageVariants}
        className={`${reverse ? 'lg:col-start-1' : ''}`}
      >
        <div className="relative">
          {image || (
            <div className={`bg-gradient-to-br ${gradient} rounded-3xl p-8 shadow-2xl`}>
              <div className="aspect-square bg-white/50 rounded-2xl flex items-center justify-center">
                <div className="text-6xl opacity-50">{icon}</div>
              </div>
            </div>
          )}
          
          {/* 데코레이션 요소 */}
          <motion.div 
            className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400 rounded-full"
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360]
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div 
            className="absolute -bottom-4 -left-4 w-6 h-6 bg-pink-400 rounded-full"
            animate={{ 
              y: [0, -10, 0],
              x: [0, 5, 0]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
      </motion.div>
    </motion.div>
  )
}