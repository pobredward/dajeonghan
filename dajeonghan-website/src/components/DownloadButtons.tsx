'use client'

import { useState } from 'react'
import { Button } from './Button'
import { Apple, Play } from 'lucide-react'
import { trackAppDownload } from '@/lib/analytics'
import { RenewalModal } from './RenewalModal'

interface DownloadButtonsProps {
  showQR?: boolean
  className?: string
}

export function DownloadButtons({ showQR = false, className = '' }: DownloadButtonsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleDownload = (platform: 'ios' | 'android') => {
    trackAppDownload(platform)
    setIsModalOpen(true)
  }

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <Button
          onClick={() => handleDownload('ios')}
          variant="primary"
          size="lg"
          className="flex-1 bg-black hover:bg-neutral-800 text-white"
        >
          <Apple className="w-6 h-6 mr-3" />
          <div className="text-left">
            <div className="text-xs opacity-80">Download on the</div>
            <div className="text-sm font-semibold">App Store</div>
          </div>
        </Button>
        
        <Button
          onClick={() => handleDownload('android')}
          variant="primary"
          size="lg"
          className="flex-1 bg-black hover:bg-neutral-800 text-white"
        >
          <Play className="w-6 h-6 mr-3 fill-current" />
          <div className="text-left">
            <div className="text-xs opacity-80">Get it on</div>
            <div className="text-sm font-semibold">Google Play</div>
          </div>
        </Button>
      </div>
      
      {/* QR 코드는 임시로 제거 */}
      
      {/* 리뉴얼 안내 모달 */}
      <RenewalModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  )
}