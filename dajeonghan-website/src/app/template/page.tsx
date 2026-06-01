import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '템플릿 공유 - 다정한',
  description: '다정한 앱에서 공유된 생활 관리 템플릿입니다. 앱을 설치하고 템플릿을 적용해보세요.',
}

export default function TemplatePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-20 h-20 bg-white rounded-2xl shadow-lg mx-auto mb-6 flex items-center justify-center p-2">
            <Image
              src="/dajeonghan-logo.png"
              alt="다정한 로고"
              width={64}
              height={64}
              className="object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-neutral-800 mb-2">다정한 템플릿</h1>
          <p className="text-neutral-500 text-sm">생활 관리 템플릿을 공유받으셨나요?</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6 mb-6">
          <p className="text-neutral-600 leading-relaxed mb-4">
            공유받은 템플릿을 확인하려면 <strong className="text-neutral-800">다정한 앱</strong>이 필요합니다.
          </p>
          <p className="text-sm text-neutral-400">
            앱을 설치한 후 공유 링크를 다시 열면 자동으로 템플릿이 적용됩니다.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <a
            href="https://apps.apple.com/kr/app/id6761916450"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 bg-neutral-900 text-white px-6 py-4 rounded-xl font-medium hover:bg-neutral-700 transition-colors"
          >
            <span className="text-xl">🍎</span>
            <div className="text-left">
              <div className="text-xs opacity-70">Download on the</div>
              <div className="font-semibold">App Store</div>
            </div>
          </a>
          <a
            href="https://play.google.com/store/apps/details?id=com.onmindlab.dajeonghan"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 bg-neutral-900 text-white px-6 py-4 rounded-xl font-medium hover:bg-neutral-700 transition-colors"
          >
            <span className="text-xl">🤖</span>
            <div className="text-left">
              <div className="text-xs opacity-70">Get it on</div>
              <div className="font-semibold">Google Play</div>
            </div>
          </a>
        </div>

        <div className="mt-8">
          <Link href="/" className="text-sm text-neutral-400 hover:text-neutral-600 transition-colors">
            다정한 홈페이지로 이동
          </Link>
        </div>
      </div>
    </main>
  )
}
