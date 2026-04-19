'use client'

import { useState } from 'react'
import { Heart, Home, Mail, MapPin } from 'lucide-react'
import { RenewalModal } from './RenewalModal'

export function Footer() {
  const currentYear = new Date().getFullYear()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleDownloadClick = () => {
    setIsModalOpen(true)
  }

  return (
    <footer className="bg-neutral-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* 브랜드 섹션 */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-white rounded-xl p-1 flex items-center justify-center">
                <img 
                  src="/dajeonghan-logo.png" 
                  alt="다정한 로고" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gradient">다정한</h3>
                <p className="text-sm text-neutral-400">Dajeonghan</p>
              </div>
            </div>
            <p className="text-neutral-300 leading-relaxed mb-6 max-w-md">
              2D 평면도와 가구별 맞춤 기능으로 근본적인 생활의 불편함을 해결하는
              스마트 라이프케어 플랫폼입니다.
            </p>
            <div className="flex items-center gap-2 text-sm text-neutral-400">
              <Heart className="w-4 h-4 text-primary" />
              <span>더 나은 일상을 위한 따뜻한 기술</span>
            </div>
          </div>

          {/* 빠른 링크 */}
          <div>
            <h4 className="text-lg font-semibold mb-4">서비스</h4>
            <ul className="space-y-3 text-neutral-300">
              <li>
                <a href="#features" className="hover:text-primary transition-colors">
                  핵심 기능
                </a>
              </li>
              <li>
                <a href="#screenshots" className="hover:text-primary transition-colors">
                  앱 미리보기
                </a>
              </li>
              <li>
                <a href="#testimonials" className="hover:text-primary transition-colors">
                  사용자 후기
                </a>
              </li>
              <li>
                <a href="/download" className="hover:text-primary transition-colors">
                  다운로드
                </a>
              </li>
            </ul>
          </div>

          {/* 지원 */}
          <div>
            <h4 className="text-lg font-semibold mb-4">지원</h4>
            <ul className="space-y-3 text-neutral-300">
              <li>
                <a href="/support" className="hover:text-primary transition-colors">
                  고객지원
                </a>
              </li>
              <li>
                <a href="/faq" className="hover:text-primary transition-colors">
                  자주 묻는 질문
                </a>
              </li>
              <li>
                <a href="/privacy" className="hover:text-primary transition-colors">
                  개인정보처리방침
                </a>
              </li>
              <li>
                <a href="/terms" className="hover:text-primary transition-colors">
                  이용약관
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* 연락처 정보 */}
        <div className="border-t border-neutral-800 pt-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-neutral-300 max-w-2xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-neutral-800 rounded-lg flex items-center justify-center">
                <Mail className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="text-sm text-neutral-400">이메일</div>
                <div className="font-medium">onmindlabs@gmail.com</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-neutral-800 rounded-lg flex items-center justify-center">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="text-sm text-neutral-400">사업자 정보</div>
                <div className="font-medium">온마인드랩</div>
              </div>
            </div>
          </div>
        </div>

        {/* 다운로드 링크 */}
        <div className="border-t border-neutral-800 pt-8 mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h4 className="text-lg font-semibold mb-2">지금 다운로드하세요</h4>
              <p className="text-neutral-400">iOS와 Android에서 이용 가능합니다</p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={handleDownloadClick}
                className="flex items-center gap-3 bg-neutral-800 hover:bg-neutral-700 px-4 py-3 rounded-lg transition-colors"
              >
                <div className="text-2xl">🍎</div>
                <div>
                  <div className="text-xs text-neutral-400">Download on the</div>
                  <div className="font-semibold">App Store</div>
                </div>
              </button>
              <button 
                onClick={handleDownloadClick}
                className="flex items-center gap-3 bg-neutral-800 hover:bg-neutral-700 px-4 py-3 rounded-lg transition-colors"
              >
                <div className="text-2xl">🤖</div>
                <div>
                  <div className="text-xs text-neutral-400">Get it on</div>
                  <div className="font-semibold">Google Play</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* 저작권 및 법적 고지 */}
        <div className="border-t border-neutral-800 pt-8 text-center">
          <div className="text-neutral-400 text-sm">
            <p className="mb-2">
              © {currentYear} 온마인드랩(OnMindLab). All rights reserved.
            </p>
            <p className="mb-4">
              대표: 신선웅 | 업종: 소프트웨어 개발 및 공급업 | 
              설립년도: 2025년
            </p>
            <p className="text-xs text-neutral-500">
              본 앱은 개인 생활 관리를 위한 도구로, 의료적 조언을 대체하지 않습니다. 
              건강 관련 사항은 전문의와 상담하시기 바랍니다.
            </p>
          </div>
        </div>
        
        {/* 리뉴얼 안내 모달 */}
        <RenewalModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
        />
      </div>
    </footer>
  )
}