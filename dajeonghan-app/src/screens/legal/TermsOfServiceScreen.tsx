import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '@/constants';

export const TermsOfServiceScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>이용약관</Text>
      <Text style={styles.date}>시행일: 2026년 4월 13일</Text>

      <Text style={styles.sectionTitle}>제1조 (목적)</Text>
      <Text style={styles.text}>
        본 약관은 다정한(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
      </Text>

      <Text style={styles.sectionTitle}>제2조 (정의)</Text>
      <Text style={styles.text}>
        1. "서비스"란 다정한이 제공하는 생활 관리 애플리케이션을 의미합니다.{'\n'}
        2. "이용자"란 본 약관에 따라 서비스를 이용하는 자를 의미합니다.{'\n'}
        3. "콘텐츠"란 이용자가 서비스에 입력한 청소 일정, 식재료, 약 정보 등을 의미합니다.
      </Text>

      <Text style={styles.sectionTitle}>제3조 (약관의 게시 및 개정)</Text>
      <Text style={styles.text}>
        1. 회사는 본 약관을 서비스 내에 게시합니다.{'\n'}
        2. 회사는 약관을 개정할 수 있으며, 변경 시 7일 전 공지합니다.{'\n'}
        3. 이용자가 변경된 약관에 동의하지 않을 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다.
      </Text>

      <Text style={styles.sectionTitle}>제4조 (서비스의 제공)</Text>
      <Text style={styles.text}>
        1. 회사는 다음의 서비스를 제공합니다:{'\n'}
           • 청소 일정 관리{'\n'}
           • 식재료 유통기한 관리{'\n'}
           • 약 복용 알림{'\n'}
           • 자기계발 목표 관리{'\n'}
           • 자기돌봄 활동 관리{'\n\n'}
        2. 서비스는 연중무휴 24시간 제공됩니다. 단, 시스템 점검 시 일시 중단될 수 있습니다.{'\n'}
        3. 회사는 서비스 제공에 필요한 경우 정기점검을 실시할 수 있으며, 정기점검시간은 서비스 제공화면에 공지합니다.
      </Text>

      <Text style={styles.sectionTitle}>제5조 (의료 조언 부인)</Text>
      <Text style={styles.warningText}>
        1. 본 서비스는 의료 기기가 아니며, 의료 조언을 제공하지 않습니다.{'\n'}
        2. 약 복용과 관련된 모든 결정은 의사 또는 약사와 상담하십시오.{'\n'}
        3. 회사는 서비스 사용으로 인한 건강 관련 결과에 대해 책임지지 않습니다.{'\n'}
        4. 서비스는 약물 간 상호작용, 알레르기, 부작용 경고 기능을 제공하지 않습니다.{'\n'}
        5. 응급 상황 시 즉시 119에 연락하거나 가까운 병원을 방문하십시오.
      </Text>

      <Text style={styles.sectionTitle}>제6조 (이용자의 의무)</Text>
      <Text style={styles.text}>
        1. 이용자는 서비스를 불법적인 목적으로 사용할 수 없습니다.{'\n'}
        2. 이용자는 본인의 계정 정보를 안전하게 관리할 책임이 있습니다.{'\n'}
        3. 이용자는 타인의 개인정보를 도용하거나 부정하게 사용할 수 없습니다.{'\n'}
        4. 이용자는 서비스 이용 중 알게 된 정보를 회사의 사전 승낙 없이 복제, 송신, 출판, 배포, 방송 등 기타 방법에 의하여 영리목적으로 이용하거나 제3자에게 이용하게 할 수 없습니다.
      </Text>

      <Text style={styles.sectionTitle}>제7조 (서비스 이용 제한)</Text>
      <Text style={styles.text}>
        회사는 다음의 경우 서비스 이용을 제한할 수 있습니다:{'\n'}
        • 법령 위반{'\n'}
        • 타인의 권리 침해{'\n'}
        • 서비스 운영 방해{'\n'}
        • 허위 정보 유포
      </Text>

      <Text style={styles.sectionTitle}>제8조 (저작권 및 데이터 소유권)</Text>
      <Text style={styles.text}>
        1. 서비스 내 모든 콘텐츠에 대한 저작권은 이용자에게 있습니다.{'\n'}
        2. 회사는 서비스 제공을 위해 필요한 범위 내에서만 이용자의 콘텐츠를 사용합니다.{'\n'}
        3. 회사가 제공하는 템플릿, UI, 로고 등의 지적재산권은 회사에 귀속됩니다.
      </Text>

      <Text style={styles.sectionTitle}>제9조 (개인정보 보호)</Text>
      <Text style={styles.text}>
        회사는 관련 법령이 정하는 바에 따라 이용자의 개인정보를 보호하기 위해 노력합니다. 자세한 내용은 개인정보처리방침을 참조하십시오.
      </Text>

      <Text style={styles.sectionTitle}>제10조 (책임의 제한)</Text>
      <Text style={styles.text}>
        1. 회사는 천재지변, 불가항력으로 인한 서비스 중단에 책임지지 않습니다.{'\n'}
        2. 회사는 이용자 간 또는 이용자와 제3자 간의 분쟁에 개입하지 않습니다.{'\n'}
        3. 회사는 서비스를 통해 제공되는 정보의 정확성, 완전성에 대해 보증하지 않습니다.{'\n'}
        4. 회사는 무료로 제공되는 서비스 이용과 관련하여 관련 법령에 특별한 규정이 없는 한 책임을 지지 않습니다.
      </Text>

      <Text style={styles.sectionTitle}>제11조 (계약 해지 및 이용 제한)</Text>
      <Text style={styles.text}>
        1. 이용자는 언제든지 서비스 이용을 중단하고 계정을 삭제할 수 있습니다.{'\n'}
        2. 계정 삭제 시 모든 데이터가 즉시 삭제되며, 복구할 수 없습니다.{'\n'}
        3. 회사는 이용자가 본 약관을 위반한 경우 사전 통보 없이 이용을 제한하거나 계약을 해지할 수 있습니다.
      </Text>

      <Text style={styles.sectionTitle}>제12조 (손해배상)</Text>
      <Text style={styles.text}>
        1. 회사는 무료로 제공하는 서비스와 관련하여 이용자에게 발생한 어떠한 손해에 대해서도 책임을 지지 않습니다. 다만, 회사의 고의 또는 중과실에 의한 경우에는 그러하지 아니합니다.{'\n'}
        2. 이용자가 본 약관을 위반하여 회사에 손해를 끼친 경우 이용자는 회사에 그 손해를 배상하여야 합니다.
      </Text>

      <Text style={styles.sectionTitle}>제13조 (분쟁 해결)</Text>
      <Text style={styles.text}>
        1. 본 약관은 대한민국 법률에 따라 해석됩니다.{'\n'}
        2. 서비스 이용과 관련된 분쟁은 회사 소재지 관할 법원에서 해결합니다.{'\n'}
        3. 회사와 이용자는 서비스와 관련하여 발생한 분쟁을 원만하게 해결하기 위하여 필요한 모든 노력을 하여야 합니다.
      </Text>

      <Text style={styles.sectionTitle}>제14조 (준거법 및 재판관할)</Text>
      <Text style={styles.text}>
        본 약관과 서비스 이용에 관한 분쟁에 대해서는 대한민국 법을 준거법으로 합니다.
      </Text>

      <Text style={styles.footer}>
        본 약관은 2026년 4월 13일부터 시행됩니다.
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
  sectionTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm
  },
  text: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: Spacing.sm
  },
  warningText: {
    ...Typography.body,
    color: Colors.error,
    lineHeight: 24,
    marginBottom: Spacing.sm,
    fontWeight: '600'
  },
  footer: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
    fontStyle: 'italic'
  }
});
