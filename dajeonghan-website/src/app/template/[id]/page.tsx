import type { Metadata } from 'next'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  return {
    title: '템플릿 공유 - 다정한',
    description: `다정한 앱에서 공유된 생활 관리 템플릿(${id})입니다. 앱을 설치하고 템플릿을 적용해보세요.`,
    openGraph: {
      title: '다정한 템플릿 공유',
      description: '다정한 앱에서 공유된 생활 관리 템플릿입니다.',
      url: `https://dajeonghan.app/template/${id}`,
      siteName: '다정한',
    },
  }
}

export default async function TemplateDetailPage({ params }: Props) {
  const { id } = await params

  const appDeepLink = `dajeonghan://template/${id}`
  const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.onmindlab.dajeonghan'
  const appStoreUrl = 'https://apps.apple.com/kr/app/id6761916450'

  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-20 h-20 bg-white rounded-2xl shadow-lg mx-auto mb-6 flex items-center justify-center p-2">
            <img
              src="/dajeonghan-logo.png"
              alt="다정한 로고"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-neutral-800 mb-2">생활 관리 템플릿</h1>
          <p className="text-neutral-500 text-sm">누군가 다정한 앱의 템플릿을 공유했어요</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6 mb-6">
          <div className="flex items-center gap-3 bg-neutral-50 rounded-xl p-3 mb-4">
            <div className="w-10 h-10 bg-neutral-200 rounded-lg flex items-center justify-center text-neutral-500 text-lg">
              📋
            </div>
            <div className="text-left">
              <div className="text-xs text-neutral-400">템플릿 ID</div>
              <div className="text-sm font-mono font-medium text-neutral-700 break-all">{id}</div>
            </div>
          </div>
          <p className="text-neutral-600 leading-relaxed text-sm">
            이 템플릿을 확인하려면 <strong className="text-neutral-800">다정한 앱</strong>이 필요합니다.
            앱이 설치되어 있다면 아래 버튼으로 바로 열 수 있어요.
          </p>
        </div>

        <div className="flex flex-col gap-3 mb-4">
          {/* 앱으로 열기 (딥링크) */}
          <a
            href={appDeepLink}
            className="flex items-center justify-center gap-2 bg-blue-500 text-white px-6 py-4 rounded-xl font-semibold hover:bg-blue-600 transition-colors"
          >
            <span>앱으로 열기</span>
            <span className="text-lg">→</span>
          </a>

          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-neutral-200" />
            <span className="text-xs text-neutral-400">앱이 없다면</span>
            <div className="flex-1 h-px bg-neutral-200" />
          </div>

          <a
            href={appStoreUrl}
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
            href={playStoreUrl}
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

        <div className="mt-6">
          <Link href="/" className="text-sm text-neutral-400 hover:text-neutral-600 transition-colors">
            다정한 홈페이지로 이동
          </Link>
        </div>
      </div>
    </main>
  )
}
