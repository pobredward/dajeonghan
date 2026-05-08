import type { Metadata } from 'next'
import Link from 'next/link'
import { Footer } from '@/components/Footer'

export const metadata: Metadata = {
  title: '이용약관 | 다정한',
  description: '다정한 앱의 이용약관을 확인하세요.',
}

export default function TermsOfServicePage() {
  return (
    <>
      <main className="min-h-screen bg-neutral-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* 뒤로가기 */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-primary transition-colors mb-10"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
            홈으로 돌아가기
          </Link>

          {/* 헤더 */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">이용약관</h1>
            <p className="text-sm text-neutral-500">시행일: 2026년 4월 13일</p>
          </div>

          <div className="space-y-8">
            {/* 제1조 */}
            <section>
              <h2 className="text-lg font-semibold text-neutral-900 mb-3">제1조 (목적)</h2>
              <p className="text-neutral-600 leading-relaxed">
                본 약관은 다정한(이하 &quot;서비스&quot;)의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
              </p>
            </section>

            {/* 제2조 */}
            <section>
              <h2 className="text-lg font-semibold text-neutral-900 mb-3">제2조 (정의)</h2>
              <ol className="space-y-1 text-neutral-600 leading-relaxed list-none pl-0">
                <li>1. &quot;서비스&quot;란 다정한이 제공하는 생활 관리 애플리케이션을 의미합니다.</li>
                <li>2. &quot;이용자&quot;란 본 약관에 따라 서비스를 이용하는 자를 의미합니다.</li>
                <li>3. &quot;콘텐츠&quot;란 이용자가 서비스에 입력한 청소 일정, 식재료, 약 정보 등을 의미합니다.</li>
              </ol>
            </section>

            {/* 제3조 */}
            <section>
              <h2 className="text-lg font-semibold text-neutral-900 mb-3">제3조 (약관의 게시 및 개정)</h2>
              <ol className="space-y-1 text-neutral-600 leading-relaxed list-none pl-0">
                <li>1. 회사는 본 약관을 서비스 내에 게시합니다.</li>
                <li>2. 회사는 약관을 개정할 수 있으며, 변경 시 7일 전 공지합니다.</li>
                <li>3. 이용자가 변경된 약관에 동의하지 않을 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다.</li>
              </ol>
            </section>

            {/* 제4조 */}
            <section>
              <h2 className="text-lg font-semibold text-neutral-900 mb-3">제4조 (서비스의 제공)</h2>
              <div className="space-y-3 text-neutral-600 leading-relaxed">
                <div>
                  <p className="mb-2">1. 회사는 다음의 서비스를 제공합니다:</p>
                  <ul className="space-y-1 pl-4">
                    <li>• 청소 일정 관리</li>
                    <li>• 식재료 유통기한 관리</li>
                    <li>• 약 복용 알림</li>
                    <li>• 자기계발 목표 관리</li>
                    <li>• 자기돌봄 활동 관리</li>
                  </ul>
                </div>
                <p>2. 서비스는 연중무휴 24시간 제공됩니다. 단, 시스템 점검 시 일시 중단될 수 있습니다.</p>
                <p>3. 회사는 서비스 제공에 필요한 경우 정기점검을 실시할 수 있으며, 정기점검시간은 서비스 제공화면에 공지합니다.</p>
              </div>
            </section>

            {/* 제5조 - 경고 박스 */}
            <section>
              <h2 className="text-lg font-semibold text-neutral-900 mb-3">제5조 (의료 조언 부인)</h2>
              <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                <div className="flex items-start gap-3 mb-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-red-500 shrink-0 mt-0.5"
                  >
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                    <path d="M12 9v4" />
                    <path d="M12 17h.01" />
                  </svg>
                  <p className="text-sm font-semibold text-red-700">중요 안내</p>
                </div>
                <ol className="space-y-2 text-red-700 font-semibold leading-relaxed text-sm list-none pl-0">
                  <li>1. 본 서비스는 의료 기기가 아니며, 의료 조언을 제공하지 않습니다.</li>
                  <li>2. 약 복용과 관련된 모든 결정은 의사 또는 약사와 상담하십시오.</li>
                  <li>3. 회사는 서비스 사용으로 인한 건강 관련 결과에 대해 책임지지 않습니다.</li>
                  <li>4. 서비스는 약물 간 상호작용, 알레르기, 부작용 경고 기능을 제공하지 않습니다.</li>
                  <li>5. 응급 상황 시 즉시 119에 연락하거나 가까운 병원을 방문하십시오.</li>
                </ol>
              </div>
            </section>

            {/* 제6조 */}
            <section>
              <h2 className="text-lg font-semibold text-neutral-900 mb-3">제6조 (이용자의 의무)</h2>
              <ol className="space-y-2 text-neutral-600 leading-relaxed list-none pl-0">
                <li>1. 이용자는 서비스를 불법적인 목적으로 사용할 수 없습니다.</li>
                <li>2. 이용자는 본인의 계정 정보를 안전하게 관리할 책임이 있습니다.</li>
                <li>3. 이용자는 타인의 개인정보를 도용하거나 부정하게 사용할 수 없습니다.</li>
                <li>4. 이용자는 서비스 이용 중 알게 된 정보를 회사의 사전 승낙 없이 복제, 송신, 출판, 배포, 방송 등 기타 방법에 의하여 영리목적으로 이용하거나 제3자에게 이용하게 할 수 없습니다.</li>
              </ol>
            </section>

            {/* 제7조 */}
            <section>
              <h2 className="text-lg font-semibold text-neutral-900 mb-3">제7조 (서비스 이용 제한)</h2>
              <p className="text-neutral-600 leading-relaxed mb-2">
                회사는 다음의 경우 서비스 이용을 제한할 수 있습니다:
              </p>
              <ul className="space-y-1 text-neutral-600 pl-1">
                <li>• 법령 위반</li>
                <li>• 타인의 권리 침해</li>
                <li>• 서비스 운영 방해</li>
                <li>• 허위 정보 유포</li>
              </ul>
            </section>

            {/* 제8조 */}
            <section>
              <h2 className="text-lg font-semibold text-neutral-900 mb-3">제8조 (저작권 및 데이터 소유권)</h2>
              <ol className="space-y-2 text-neutral-600 leading-relaxed list-none pl-0">
                <li>1. 서비스 내 모든 콘텐츠에 대한 저작권은 이용자에게 있습니다.</li>
                <li>2. 회사는 서비스 제공을 위해 필요한 범위 내에서만 이용자의 콘텐츠를 사용합니다.</li>
                <li>3. 회사가 제공하는 템플릿, UI, 로고 등의 지적재산권은 회사에 귀속됩니다.</li>
              </ol>
            </section>

            {/* 제9조 */}
            <section>
              <h2 className="text-lg font-semibold text-neutral-900 mb-3">제9조 (개인정보 보호)</h2>
              <p className="text-neutral-600 leading-relaxed">
                회사는 관련 법령이 정하는 바에 따라 이용자의 개인정보를 보호하기 위해 노력합니다. 자세한 내용은{' '}
                <Link href="/privacy" className="text-primary hover:underline">
                  개인정보처리방침
                </Link>
                을 참조하십시오.
              </p>
            </section>

            {/* 제10조 */}
            <section>
              <h2 className="text-lg font-semibold text-neutral-900 mb-3">제10조 (책임의 제한)</h2>
              <ol className="space-y-2 text-neutral-600 leading-relaxed list-none pl-0">
                <li>1. 회사는 천재지변, 불가항력으로 인한 서비스 중단에 책임지지 않습니다.</li>
                <li>2. 회사는 이용자 간 또는 이용자와 제3자 간의 분쟁에 개입하지 않습니다.</li>
                <li>3. 회사는 서비스를 통해 제공되는 정보의 정확성, 완전성에 대해 보증하지 않습니다.</li>
                <li>4. 회사는 무료로 제공되는 서비스 이용과 관련하여 관련 법령에 특별한 규정이 없는 한 책임을 지지 않습니다.</li>
              </ol>
            </section>

            {/* 제11조 */}
            <section>
              <h2 className="text-lg font-semibold text-neutral-900 mb-3">제11조 (계약 해지 및 이용 제한)</h2>
              <ol className="space-y-2 text-neutral-600 leading-relaxed list-none pl-0">
                <li>1. 이용자는 언제든지 서비스 이용을 중단하고 계정을 삭제할 수 있습니다.</li>
                <li>2. 계정 삭제 시 모든 데이터가 즉시 삭제되며, 복구할 수 없습니다.</li>
                <li>3. 회사는 이용자가 본 약관을 위반한 경우 사전 통보 없이 이용을 제한하거나 계약을 해지할 수 있습니다.</li>
              </ol>
            </section>

            {/* 제12조 */}
            <section>
              <h2 className="text-lg font-semibold text-neutral-900 mb-3">제12조 (손해배상)</h2>
              <ol className="space-y-2 text-neutral-600 leading-relaxed list-none pl-0">
                <li>1. 회사는 무료로 제공하는 서비스와 관련하여 이용자에게 발생한 어떠한 손해에 대해서도 책임을 지지 않습니다. 다만, 회사의 고의 또는 중과실에 의한 경우에는 그러하지 아니합니다.</li>
                <li>2. 이용자가 본 약관을 위반하여 회사에 손해를 끼친 경우 이용자는 회사에 그 손해를 배상하여야 합니다.</li>
              </ol>
            </section>

            {/* 제13조 */}
            <section>
              <h2 className="text-lg font-semibold text-neutral-900 mb-3">제13조 (분쟁 해결)</h2>
              <ol className="space-y-2 text-neutral-600 leading-relaxed list-none pl-0">
                <li>1. 본 약관은 대한민국 법률에 따라 해석됩니다.</li>
                <li>2. 서비스 이용과 관련된 분쟁은 회사 소재지 관할 법원에서 해결합니다.</li>
                <li>3. 회사와 이용자는 서비스와 관련하여 발생한 분쟁을 원만하게 해결하기 위하여 필요한 모든 노력을 하여야 합니다.</li>
              </ol>
            </section>

            {/* 제14조 */}
            <section>
              <h2 className="text-lg font-semibold text-neutral-900 mb-3">제14조 (준거법 및 재판관할)</h2>
              <p className="text-neutral-600 leading-relaxed">
                본 약관과 서비스 이용에 관한 분쟁에 대해서는 대한민국 법을 준거법으로 합니다.
              </p>
            </section>
          </div>

          {/* 시행일 */}
          <p className="mt-12 text-center text-sm text-neutral-400 italic">
            본 약관은 2026년 4월 13일부터 시행됩니다.
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
