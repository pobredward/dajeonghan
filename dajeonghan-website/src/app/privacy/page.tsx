import type { Metadata } from 'next'
import Link from 'next/link'
import { Footer } from '@/components/Footer'

export const metadata: Metadata = {
  title: '개인정보처리방침 | 다정한',
  description: '다정한 앱의 개인정보처리방침을 확인하세요.',
}

export default function PrivacyPolicyPage() {
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
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">개인정보처리방침</h1>
            <p className="text-sm text-neutral-500">시행일: 2026년 4월 13일</p>
          </div>

          {/* 인트로 */}
          <p className="text-neutral-600 leading-relaxed mb-10 p-4 bg-white rounded-xl border border-neutral-200">
            다정한(&quot;회사&quot; 또는 &quot;우리&quot;)는 사용자의 개인정보를 중요시하며, 개인정보보호법을 준수합니다.
          </p>

          <div className="space-y-8">
            {/* 1 */}
            <section>
              <h2 className="text-lg font-semibold text-neutral-900 mb-3">1. 수집하는 개인정보</h2>
              <div className="space-y-4 text-neutral-600 leading-relaxed">
                <div>
                  <p className="font-medium text-neutral-800 mb-1">필수 정보</p>
                  <ul className="space-y-1 pl-1">
                    <li>• 계정 정보: 이메일 주소 (선택적 계정 연결 시)</li>
                    <li>• 생활 데이터: 청소 일정, 식재료 정보, 약 복용 기록</li>
                    <li>• 기기 정보: 기기 식별자 (푸시 알림용)</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-neutral-800 mb-1">자동 수집 정보</p>
                  <ul className="space-y-1 pl-1">
                    <li>• 앱 사용 통계 (Firebase Analytics)</li>
                    <li>• 오류 로그 (Crashlytics)</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 2 */}
            <section>
              <h2 className="text-lg font-semibold text-neutral-900 mb-3">2. 개인정보의 수집 및 이용 목적</h2>
              <ul className="space-y-1 text-neutral-600 leading-relaxed pl-1">
                <li>• 서비스 제공: 생활 일정 관리, 알림 발송</li>
                <li>• 개인화: 사용자 패턴 기반 주기 조정</li>
                <li>• 서비스 개선: 통계 분석, 오류 수정</li>
              </ul>
            </section>

            {/* 3 */}
            <section>
              <h2 className="text-lg font-semibold text-neutral-900 mb-3">3. 개인정보의 보유 및 이용 기간</h2>
              <ul className="space-y-1 text-neutral-600 leading-relaxed pl-1">
                <li>• 계정 삭제 시까지 보유</li>
                <li>• 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관</li>
              </ul>
            </section>

            {/* 4 */}
            <section>
              <h2 className="text-lg font-semibold text-neutral-900 mb-3">4. 개인정보의 제3자 제공</h2>
              <p className="text-neutral-600 leading-relaxed mb-3">
                회사는 원칙적으로 사용자의 개인정보를 제3자에게 제공하지 않습니다.
              </p>
              <div>
                <p className="font-medium text-neutral-800 mb-1">처리 위탁:</p>
                <ul className="space-y-1 text-neutral-600 pl-1">
                  <li>• Firebase (Google LLC): 데이터 저장 및 인증</li>
                  <li>• Expo Push Service: 알림 발송</li>
                </ul>
              </div>
            </section>

            {/* 5 */}
            <section>
              <h2 className="text-lg font-semibold text-neutral-900 mb-3">5. 개인정보의 파기</h2>
              <p className="text-neutral-600 leading-relaxed">
                계정 삭제 요청 시 즉시 파기합니다. 단, 법령에 따라 보존이 필요한 경우 별도 저장합니다.
              </p>
            </section>

            {/* 6 */}
            <section>
              <h2 className="text-lg font-semibold text-neutral-900 mb-3">6. 사용자의 권리</h2>
              <ul className="space-y-1 text-neutral-600 leading-relaxed pl-1">
                <li>• 열람 권리: 본인의 개인정보를 열람할 수 있습니다</li>
                <li>• 정정 권리: 잘못된 정보를 수정할 수 있습니다</li>
                <li>• 삭제 권리: 계정 및 데이터를 삭제할 수 있습니다</li>
                <li>• 처리 정지 권리: 개인정보 처리 정지를 요청할 수 있습니다</li>
              </ul>
            </section>

            {/* 7 */}
            <section>
              <h2 className="text-lg font-semibold text-neutral-900 mb-3">7. 개인정보 보호책임자</h2>
              <ul className="space-y-1 text-neutral-600 leading-relaxed pl-1">
                <li>• 담당자: 다정한 개발팀</li>
                <li>
                  • 이메일:{' '}
                  <a
                    href="mailto:privacy@dajeonghan.app"
                    className="text-primary hover:underline"
                  >
                    privacy@dajeonghan.app
                  </a>
                </li>
                <li>• 문의: 이메일로 문의해 주세요</li>
              </ul>
            </section>

            {/* 8 */}
            <section>
              <h2 className="text-lg font-semibold text-neutral-900 mb-3">8. 정책 변경</h2>
              <p className="text-neutral-600 leading-relaxed">
                본 방침은 법령 또는 서비스 변경에 따라 수정될 수 있으며, 변경 시 앱 내 공지합니다.
              </p>
            </section>

            {/* 9 */}
            <section>
              <h2 className="text-lg font-semibold text-neutral-900 mb-3">9. 아동의 개인정보</h2>
              <p className="text-neutral-600 leading-relaxed">
                만 14세 미만 아동의 개인정보는 수집하지 않습니다.
              </p>
            </section>

            {/* 10 */}
            <section>
              <h2 className="text-lg font-semibold text-neutral-900 mb-3">10. 쿠키 및 추적 기술</h2>
              <p className="text-neutral-600 leading-relaxed">
                Firebase Analytics를 사용하여 앱 사용 통계를 수집합니다. 설정에서 비활성화할 수 있습니다.
              </p>
            </section>

            {/* 11 */}
            <section>
              <h2 className="text-lg font-semibold text-neutral-900 mb-3">11. 개인정보의 안전성 확보 조치</h2>
              <p className="text-neutral-600 leading-relaxed mb-2">
                회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:
              </p>
              <ul className="space-y-1 text-neutral-600 pl-1">
                <li>• 개인정보 암호화</li>
                <li>• 접근 권한 관리</li>
                <li>• 보안프로그램 설치 및 갱신</li>
                <li>• 개인정보 취급 직원의 최소화 및 교육</li>
              </ul>
            </section>

            {/* 12 */}
            <section>
              <h2 className="text-lg font-semibold text-neutral-900 mb-3">12. 권익침해 구제방법</h2>
              <p className="text-neutral-600 leading-relaxed mb-4">
                개인정보침해에 대한 신고나 상담이 필요한 경우 아래 기관에 문의하실 수 있습니다:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-white rounded-xl border border-neutral-200">
                  <p className="font-medium text-neutral-800 mb-1">개인정보침해신고센터</p>
                  <p className="text-sm text-neutral-500">privacy.kisa.or.kr</p>
                  <p className="text-sm text-neutral-500">국번없이 118</p>
                </div>
                <div className="p-4 bg-white rounded-xl border border-neutral-200">
                  <p className="font-medium text-neutral-800 mb-1">개인정보분쟁조정위원회</p>
                  <p className="text-sm text-neutral-500">www.kopico.go.kr</p>
                  <p className="text-sm text-neutral-500">1833-6972</p>
                </div>
                <div className="p-4 bg-white rounded-xl border border-neutral-200">
                  <p className="font-medium text-neutral-800 mb-1">대검찰청 사이버수사과</p>
                  <p className="text-sm text-neutral-500">www.spo.go.kr</p>
                  <p className="text-sm text-neutral-500">국번없이 1301</p>
                </div>
                <div className="p-4 bg-white rounded-xl border border-neutral-200">
                  <p className="font-medium text-neutral-800 mb-1">경찰청 사이버안전국</p>
                  <p className="text-sm text-neutral-500">cyberbureau.police.go.kr</p>
                  <p className="text-sm text-neutral-500">국번없이 182</p>
                </div>
              </div>
            </section>
          </div>

          {/* 시행일 */}
          <p className="mt-12 text-center text-sm text-neutral-400 italic">
            본 방침은 2026년 4월 13일부터 시행됩니다.
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
