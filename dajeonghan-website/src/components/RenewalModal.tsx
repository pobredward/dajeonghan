'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Heart, Sparkles } from 'lucide-react'

interface RenewalModalProps {
  isOpen: boolean
  onClose: () => void
}

export function RenewalModal({ isOpen, onClose }: RenewalModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 배경 오버레이 */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* 모달 */}
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            <motion.div
              className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 relative"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              {/* 닫기 버튼 */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 bg-neutral-100 hover:bg-neutral-200 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-neutral-600" />
              </button>

              {/* 상단 아이콘 */}
              <div className="text-center mb-6">
                <motion.div
                  className="w-20 h-20 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="w-12 h-12 bg-white rounded-full p-2">
                    <img 
                      src="/dajeonghan-logo.png" 
                      alt="다정한 로고" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                </motion.div>
                
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                  <h3 className="text-xl font-bold text-neutral-800">다정한 리뉴얼 안내</h3>
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                </div>
              </div>

              {/* 메시지 */}
              <div className="text-center space-y-4">
                <div className="text-6xl mb-4">
                  <motion.span
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    😊
                  </motion.span>
                </div>
                
                <p className="text-lg text-neutral-700 leading-relaxed">
                  안녕하세요! 현재 <strong className="text-primary">다정한</strong> 어플은 
                  더 나은 서비스를 위해 열심히 리뉴얼 중이에요
                </p>
                
                <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl p-4 border border-primary/20">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Heart className="w-5 h-5 text-primary" />
                    <span className="text-primary font-semibold">곧 새로운 모습으로!</span>
                  </div>
                  <p className="text-sm text-neutral-600">
                    더욱 똑똑하고 사용하기 쉬운 다정한으로<br />
                    다시 찾아뵐게요. 조금만 기다려주세요!
                  </p>
                </div>

                <div className="pt-2">
                  <motion.div 
                    className="text-2xl mb-2"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    💕
                  </motion.div>
                  <p className="text-sm text-neutral-500">
                    업데이트 소식은 웹사이트를 통해 전해드릴게요
                  </p>
                </div>
              </div>

              {/* 확인 버튼 */}
              <motion.button
                onClick={onClose}
                className="w-full mt-6 bg-gradient-to-r from-primary to-secondary text-white py-3 px-6 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                알겠어요! 기다릴게요 ✨
              </motion.button>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}