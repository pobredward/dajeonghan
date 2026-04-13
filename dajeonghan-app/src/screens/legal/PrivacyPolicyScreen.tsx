import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '@/constants';

export const PrivacyPolicyScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>개인정보처리방침</Text>
      <Text style={styles.date}>시행일: 2026년 4월 13일</Text>

      <Text style={styles.intro}>
        다정한("회사" 또는 "우리")는 사용자의 개인정보를 중요시하며, 개인정보보호법을 준수합니다.
      </Text>

      <Text style={styles.sectionTitle}>1. 수집하는 개인정보</Text>
      
      <Text style={styles.subTitle}>필수 정보</Text>
      <Text style={styles.text}>
        • 계정 정보: 이메일 주소 (선택적 계정 연결 시){'\n'}
        • 생활 데이터: 청소 일정, 식재료 정보, 약 복용 기록{'\n'}
        • 기기 정보: 기기 식별자 (푸시 알림용)
      </Text>

      <Text style={styles.subTitle}>자동 수집 정보</Text>
      <Text style={styles.text}>
        • 앱 사용 통계 (Firebase Analytics){'\n'}
        • 오류 로그 (Crashlytics)
      </Text>

      <Text style={styles.sectionTitle}>2. 개인정보의 수집 및 이용 목적</Text>
      <Text style={styles.text}>
        • 서비스 제공: 생활 일정 관리, 알림 발송{'\n'}
        • 개인화: 사용자 패턴 기반 주기 조정{'\n'}
        • 서비스 개선: 통계 분석, 오류 수정
      </Text>

      <Text style={styles.sectionTitle}>3. 개인정보의 보유 및 이용 기간</Text>
      <Text style={styles.text}>
        • 계정 삭제 시까지 보유{'\n'}
        • 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관
      </Text>

      <Text style={styles.sectionTitle}>4. 개인정보의 제3자 제공</Text>
      <Text style={styles.text}>
        회사는 원칙적으로 사용자의 개인정보를 제3자에게 제공하지 않습니다.
      </Text>
      <Text style={styles.subTitle}>처리 위탁:</Text>
      <Text style={styles.text}>
        • Firebase (Google LLC): 데이터 저장 및 인증{'\n'}
        • Expo Push Service: 알림 발송
      </Text>

      <Text style={styles.sectionTitle}>5. 개인정보의 파기</Text>
      <Text style={styles.text}>
        계정 삭제 요청 시 즉시 파기합니다. 단, 법령에 따라 보존이 필요한 경우 별도 저장합니다.
      </Text>

      <Text style={styles.sectionTitle}>6. 사용자의 권리</Text>
      <Text style={styles.text}>
        • 열람 권리: 본인의 개인정보를 열람할 수 있습니다{'\n'}
        • 정정 권리: 잘못된 정보를 수정할 수 있습니다{'\n'}
        • 삭제 권리: 계정 및 데이터를 삭제할 수 있습니다{'\n'}
        • 처리 정지 권리: 개인정보 처리 정지를 요청할 수 있습니다
      </Text>

      <Text style={styles.sectionTitle}>7. 개인정보 보호책임자</Text>
      <Text style={styles.text}>
        • 담당자: 다정한 개발팀{'\n'}
        • 이메일: privacy@dajeonghan.app{'\n'}
        • 문의: 앱 내 설정 {'>'} 고객센터
      </Text>

      <Text style={styles.sectionTitle}>8. 정책 변경</Text>
      <Text style={styles.text}>
        본 방침은 법령 또는 서비스 변경에 따라 수정될 수 있으며, 변경 시 앱 내 공지합니다.
      </Text>

      <Text style={styles.sectionTitle}>9. 아동의 개인정보</Text>
      <Text style={styles.text}>
        만 14세 미만 아동의 개인정보는 수집하지 않습니다.
      </Text>

      <Text style={styles.sectionTitle}>10. 쿠키 및 추적 기술</Text>
      <Text style={styles.text}>
        Firebase Analytics를 사용하여 앱 사용 통계를 수집합니다. 설정에서 비활성화할 수 있습니다.
      </Text>

      <Text style={styles.sectionTitle}>11. 개인정보의 안전성 확보 조치</Text>
      <Text style={styles.text}>
        회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:{'\n'}
        • 개인정보 암호화{'\n'}
        • 접근 권한 관리{'\n'}
        • 보안프로그램 설치 및 갱신{'\n'}
        • 개인정보 취급 직원의 최소화 및 교육
      </Text>

      <Text style={styles.sectionTitle}>12. 권익침해 구제방법</Text>
      <Text style={styles.text}>
        개인정보침해에 대한 신고나 상담이 필요한 경우 아래 기관에 문의하실 수 있습니다:{'\n\n'}
        • 개인정보침해신고센터{'\n'}
          privacy.kisa.or.kr / 국번없이 118{'\n\n'}
        • 개인정보분쟁조정위원회{'\n'}
          www.kopico.go.kr / 1833-6972{'\n\n'}
        • 대검찰청 사이버수사과{'\n'}
          www.spo.go.kr / 국번없이 1301{'\n\n'}
        • 경찰청 사이버안전국{'\n'}
          cyberbureau.police.go.kr / 국번없이 182
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface
  },
  contentContainer: {
    padding: Spacing.lg
  },
  title: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs
  },
  date: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl
  },
  intro: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: Spacing.lg
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm
  },
  subTitle: {
    ...Typography.label,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs
  },
  text: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: Spacing.sm
  }
});
