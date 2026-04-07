# 11. 개인정보 및 법적 준수

## 목표
개인정보보호법 및 앱 스토어 정책을 준수하는 안전한 서비스를 구축합니다.

## 법적 요구사항

### 개인정보보호법 (한국)
- 개인정보 수집 시 명시적 동의
- 수집 항목, 목적, 보유 기간 명시
- 개인정보 처리방침 공개
- 계정 삭제 및 데이터 다운로드 권리

### GDPR (유럽, 선택)
- Right to Access: 데이터 열람 권리
- Right to Erasure: 삭제 권리
- Right to Portability: 이동 권리

### 앱 스토어 정책
- **Google Play**: 건강 앱 선언, 개인정보 공개
- **App Store**: App Privacy Details, 데이터 수집 공개

## 개인정보처리방침

`docs/privacy-policy.md`:

```markdown
# 리브루프(liveloop) 개인정보처리방침

**시행일: 2026년 X월 X일**

리브루프("회사" 또는 "우리")는 사용자의 개인정보를 중요시하며, 개인정보보호법을 준수합니다.

## 1. 수집하는 개인정보

### 필수 정보
- **계정 정보**: 이메일 주소 (선택적 계정 연결 시)
- **생활 데이터**: 청소 일정, 식재료 정보, 약 복용 기록
- **기기 정보**: 기기 식별자 (푸시 알림용)

### 자동 수집 정보
- 앱 사용 통계 (Firebase Analytics)
- 오류 로그 (Crashlytics)

## 2. 개인정보의 수집 및 이용 목적

- **서비스 제공**: 생활 일정 관리, 알림 발송
- **개인화**: 사용자 패턴 기반 주기 조정
- **서비스 개선**: 통계 분석, 오류 수정

## 3. 개인정보의 보유 및 이용 기간

- 계정 삭제 시까지 보유
- 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관

## 4. 개인정보의 제3자 제공

회사는 원칙적으로 사용자의 개인정보를 제3자에게 제공하지 않습니다.

**처리 위탁:**
- Firebase (Google LLC): 데이터 저장 및 인증
- Expo Push Service: 알림 발송

## 5. 개인정보의 파기

계정 삭제 요청 시 즉시 파기합니다. 단, 법령에 따라 보존이 필요한 경우 별도 저장합니다.

## 6. 사용자의 권리

- **열람 권리**: 본인의 개인정보를 열람할 수 있습니다
- **정정 권리**: 잘못된 정보를 수정할 수 있습니다
- **삭제 권리**: 계정 및 데이터를 삭제할 수 있습니다
- **처리 정지 권리**: 개인정보 처리 정지를 요청할 수 있습니다

## 7. 개인정보 보호책임자

- 담당자: [이름]
- 이메일: privacy@liveloop.app
- 전화: [전화번호]

## 8. 정책 변경

본 방침은 법령 또는 서비스 변경에 따라 수정될 수 있으며, 변경 시 앱 내 공지합니다.

## 9. 아동의 개인정보

만 14세 미만 아동의 개인정보는 수집하지 않습니다.

## 10. 쿠키 및 추적 기술

Firebase Analytics를 사용하여 앱 사용 통계를 수집합니다. 설정에서 비활성화할 수 있습니다.
```

## 이용약관

`docs/terms-of-service.md`:

```markdown
# 리브루프(liveloop) 이용약관

**시행일: 2026년 X월 X일**

## 제1조 (목적)

본 약관은 리브루프(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.

## 제2조 (정의)

1. "서비스"란 리브루프가 제공하는 생활 관리 애플리케이션을 의미합니다.
2. "이용자"란 본 약관에 따라 서비스를 이용하는 자를 의미합니다.

## 제3조 (약관의 게시 및 개정)

1. 회사는 본 약관을 서비스 내에 게시합니다.
2. 회사는 약관을 개정할 수 있으며, 변경 시 7일 전 공지합니다.

## 제4조 (서비스의 제공)

1. 회사는 다음의 서비스를 제공합니다:
   - 청소 일정 관리
   - 식재료 유통기한 관리
   - 약 복용 알림
2. 서비스는 연중무휴 24시간 제공됩니다. 단, 시스템 점검 시 일시 중단될 수 있습니다.

## 제5조 (의료 조언 부인)

1. **본 서비스는 의료 기기가 아니며, 의료 조언을 제공하지 않습니다.**
2. 약 복용과 관련된 모든 결정은 의사 또는 약사와 상담하십시오.
3. 회사는 서비스 사용으로 인한 건강 관련 결과에 대해 책임지지 않습니다.

## 제6조 (이용자의 의무)

1. 이용자는 서비스를 불법적인 목적으로 사용할 수 없습니다.
2. 이용자는 본인의 계정 정보를 안전하게 관리할 책임이 있습니다.

## 제7조 (서비스 이용 제한)

회사는 다음의 경우 서비스 이용을 제한할 수 있습니다:
- 법령 위반
- 타인의 권리 침해
- 서비스 운영 방해

## 제8조 (책임의 제한)

1. 회사는 천재지변, 불가항력으로 인한 서비스 중단에 책임지지 않습니다.
2. 회사는 이용자 간 또는 이용자와 제3자 간의 분쟁에 개입하지 않습니다.
3. **회사는 서비스를 통해 제공되는 정보의 정확성, 완전성에 대해 보증하지 않습니다.**

## 제9조 (분쟁 해결)

1. 본 약관은 대한민국 법률에 따라 해석됩니다.
2. 서비스 이용과 관련된 분쟁은 회사 소재지 관할 법원에서 해결합니다.
```

## 건강 앱 면책 안내

`src/screens/medicine/DisclaimerScreen.tsx`:

```tsx
import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { Button } from '@/components/Button';
import { Colors, Typography, Spacing } from '@/constants';

interface Props {
  onAccept: () => void;
  onDecline: () => void;
}

export const DisclaimerScreen: React.FC<Props> = ({ onAccept, onDecline }) => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.title}>중요한 안내</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>본 앱은 의료 기기가 아닙니다</Text>
        <Text style={styles.text}>
          리브루프는 약 복용 일정을 기록하고 알림을 제공하는 도구일 뿐,
          의료 조언이나 진단을 제공하지 않습니다.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>의사/약사와 상담하세요</Text>
        <Text style={styles.text}>
          • 약물 복용 변경 시{'\n'}
          • 부작용 발생 시{'\n'}
          • 새로운 약 추가 시{'\n'}
          • 다른 약과 함께 복용 시
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>상호작용 경고 없음</Text>
        <Text style={styles.text}>
          본 앱은 약물 간 상호작용, 알레르기, 부작용 경고 기능을 제공하지 않습니다.
          여러 약을 복용하는 경우 반드시 전문가와 상담하세요.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>응급 상황</Text>
        <Text style={styles.text}>
          응급 상황 시 즉시 119에 연락하거나 가까운 병원을 방문하세요.
          본 앱은 응급 상황에 대응하지 않습니다.
        </Text>
      </View>

      <View style={styles.actions}>
        <Button
          title="이해했습니다"
          onPress={onAccept}
          variant="primary"
          fullWidth
        />
        <Button
          title="취소"
          onPress={onDecline}
          variant="text"
          fullWidth
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: Spacing.lg
  },
  icon: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: Spacing.md
  },
  title: {
    ...Typography.h1,
    textAlign: 'center',
    marginBottom: Spacing.xl
  },
  section: {
    marginBottom: Spacing.lg
  },
  sectionTitle: {
    ...Typography.h4,
    marginBottom: Spacing.sm
  },
  text: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 24
  },
  actions: {
    gap: Spacing.md,
    marginTop: Spacing.xl
  }
});
```

## 계정 삭제 기능

`src/screens/settings/DeleteAccountScreen.tsx`:

```tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Button } from '@/components/Button';
import { AuthService } from '@/services/authService';
import { Colors, Typography, Spacing } from '@/constants';

export const DeleteAccountScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleDelete = () => {
    Alert.alert(
      '계정 삭제',
      '정말로 계정을 삭제하시겠습니까?\n\n• 모든 데이터가 즉시 삭제됩니다\n• 삭제 후 복구할 수 없습니다\n\n이 작업은 되돌릴 수 없습니다.',
      [
        {
          text: '취소',
          style: 'cancel'
        },
        {
          text: '삭제',
          style: 'destructive',
          onPress: confirmDelete
        }
      ]
    );
  };

  const confirmDelete = async () => {
    setLoading(true);

    try {
      await AuthService.deleteAccount();
      
      Alert.alert(
        '삭제 완료',
        '계정이 삭제되었습니다.',
        [
          {
            text: '확인',
            onPress: () => {
              // 온보딩 화면으로 이동
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('오류', '계정 삭제 중 오류가 발생했습니다.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>⚠️</Text>
        <Text style={styles.title}>계정 삭제</Text>
        <Text style={styles.description}>
          계정을 삭제하면 다음 데이터가 영구적으로 삭제됩니다:
        </Text>

        <View style={styles.list}>
          <Text style={styles.listItem}>• 모든 테스크 및 일정</Text>
          <Text style={styles.listItem}>• 식재료 정보</Text>
          <Text style={styles.listItem}>• 약 복용 기록</Text>
          <Text style={styles.listItem}>• 완료 이력 및 통계</Text>
          <Text style={styles.listItem}>• 사용자 설정</Text>
        </View>

        <View style={styles.warning}>
          <Text style={styles.warningText}>
            이 작업은 되돌릴 수 없습니다.
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          title="계정 삭제"
          onPress={handleDelete}
          variant="primary"
          fullWidth
          loading={loading}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: Spacing.lg
  },
  content: {
    flex: 1
  },
  icon: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: Spacing.md
  },
  title: {
    ...Typography.h2,
    textAlign: 'center',
    marginBottom: Spacing.md
  },
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg
  },
  list: {
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.lg
  },
  listItem: {
    ...Typography.body,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm
  },
  warning: {
    backgroundColor: '#FFEBEE',
    padding: Spacing.md,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error
  },
  warningText: {
    ...Typography.label,
    color: Colors.error
  },
  actions: {
    paddingTop: Spacing.lg
  }
});
```

## 앱 스토어 메타데이터

### Google Play - 데이터 보안 섹션

```yaml
데이터 수집:
  - 개인 정보:
      - 이메일 주소: 선택적 (계정 연결 시)
  - 건강 및 피트니스:
      - 약 복용 정보: 필수 (약 모듈 사용 시)
  - 앱 활동:
      - 앱 상호작용: 필수 (서비스 개선용)

데이터 사용:
  - 앱 기능: 예
  - 개인화: 예
  - 분석: 예

데이터 공유:
  - 제3자 공유: 아니오
  - 선택 사항: 예 (익명 계정 사용 가능)

보안 방법:
  - 전송 중 암호화: 예 (HTTPS)
  - 삭제 요청 가능: 예
```

### App Store - App Privacy

```yaml
데이터 유형:
  건강 및 피트니스:
    - 복용 중인 약 목록
    - 복용 기록
    링크됨: 아니오 (익명화)
    추적에 사용: 아니오

  사용자 콘텐츠:
    - 청소 일정
    - 식재료 목록
    링크됨: 예
    추적에 사용: 아니오

  식별자:
    - 기기 ID
    링크됨: 아니오
    추적에 사용: 아니오

  진단:
    - 충돌 데이터
    링크됨: 아니오
    추적에 사용: 아니오
```

## 다음 단계
- 12-growth.md: 성장 전략 및 수익화
- 리텐션, 템플릿 공유, 프리미엄 기능
