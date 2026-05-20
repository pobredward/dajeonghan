import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { Button } from '@/components/Button';
import { AuthService } from '@/services/authService';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import {
  GOOGLE_WEB_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID,
  GOOGLE_ANDROID_CLIENT_ID,
} from '@env';

WebBrowser.maybeCompleteAuthSession();

interface Props {
  onDeleteSuccess?: () => void;
}

// ============================================================================
// 이메일 재인증 모달
// ============================================================================
interface EmailReauthModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
  loading: boolean;
  email: string;
}

const EmailReauthModal: React.FC<EmailReauthModalProps> = ({
  visible,
  onClose,
  onConfirm,
  loading,
  email,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleConfirm = () => {
    if (!password.trim()) {
      Alert.alert('입력 오류', '비밀번호를 입력해주세요.');
      return;
    }
    onConfirm(password);
  };

  const handleClose = () => {
    setPassword('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>신원 확인</Text>
          <Text style={styles.modalSubtitle}>
            계정 삭제를 위해 비밀번호를 입력해주세요.
          </Text>

          <Text style={styles.inputLabel}>이메일</Text>
          <View style={styles.emailDisplay}>
            <Text style={styles.emailText}>{email}</Text>
          </View>

          <Text style={[styles.inputLabel, { marginTop: Spacing.md }]}>비밀번호</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={styles.passwordInput}
              value={password}
              onChangeText={setPassword}
              placeholder="비밀번호 입력"
              placeholderTextColor={Colors.textDisabled}
              secureTextEntry={!showPassword}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleConfirm}
            />
            <TouchableOpacity
              style={styles.visibleButton}
              onPress={() => setShowPassword((v) => !v)}
              activeOpacity={0.7}
            >
              <Text style={styles.visibleButtonText}>{showPassword ? '숨김' : '표시'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.deleteButton, loading && styles.buttonDisabled]}
            onPress={handleConfirm}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.deleteButtonText}>계정 삭제</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={handleClose} activeOpacity={0.7}>
            <Text style={styles.cancelButtonText}>취소</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ============================================================================
// 메인 화면
// ============================================================================
export const DeleteAccountScreen: React.FC<Props> = ({ onDeleteSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [emailModalVisible, setEmailModalVisible] = useState(false);

  // Google OAuth — 재인증용
  const [, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
  });

  // Google 응답 처리
  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const idToken = googleResponse.authentication?.idToken;
      if (!idToken) {
        Alert.alert('오류', 'Google 인증 정보를 받지 못했습니다.');
        setLoading(false);
        return;
      }
      (async () => {
        try {
          const credential = AuthService.buildGoogleCredential(idToken);
          await AuthService.reauthenticate(credential);
          await performDelete();
        } catch (e: any) {
          Alert.alert('오류', e.message);
          setLoading(false);
        }
      })();
    } else if (googleResponse?.type === 'error' || googleResponse?.type === 'dismiss') {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleResponse]);

  const getLinkedProviders = () => AuthService.getLinkedProviders();

  const handleDelete = () => {
    Alert.alert(
      '계정 삭제',
      '정말로 계정을 삭제하시겠습니까?\n\n• 모든 데이터가 즉시 삭제됩니다\n• 삭제 후 복구할 수 없습니다\n\n이 작업은 되돌릴 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        { text: '삭제', style: 'destructive', onPress: startReauth },
      ]
    );
  };

  /**
   * 연결된 provider를 감지해 적합한 재인증 방법으로 분기합니다.
   * 우선순위: password > google.com > apple.com
   */
  const startReauth = async () => {
    const providers = getLinkedProviders();

    if (providers.includes('password')) {
      setEmailModalVisible(true);
      return;
    }

    setLoading(true);

    if (providers.includes('google.com')) {
      await googlePromptAsync();
      return;
    }

    if (providers.includes('apple.com')) {
      await reauthWithApple();
      return;
    }

    // 익명 계정 — 재인증 없이 바로 삭제 가능
    await performDelete();
  };

  const reauthWithApple = async () => {
    try {
      const rawNonce =
        Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce
      );
      const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });
      if (!appleCredential.identityToken) {
        throw new Error('Apple 인증 정보를 받지 못했습니다.');
      }
      const credential = AuthService.buildAppleCredential(
        appleCredential.identityToken,
        rawNonce
      );
      await AuthService.reauthenticate(credential);
      await performDelete();
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('오류', e.message);
      }
      setLoading(false);
    }
  };

  const handleEmailReauthConfirm = async (password: string) => {
    const user = AuthService.getCurrentUser();
    const email = user?.email ?? '';
    try {
      const credential = AuthService.buildEmailCredential(email, password);
      await AuthService.reauthenticate(credential);
      setEmailModalVisible(false);
      setLoading(true);
      await performDelete();
    } catch (e: any) {
      Alert.alert('인증 실패', e.message);
    }
  };

  const performDelete = async () => {
    try {
      await AuthService.deleteAccount();
      Alert.alert('삭제 완료', '계정이 삭제되었습니다.', [
        { text: '확인', onPress: () => onDeleteSuccess?.() },
      ]);
    } catch (e: any) {
      Alert.alert('오류', e.message);
    } finally {
      setLoading(false);
    }
  };

  const userEmail = AuthService.getCurrentUser()?.email ?? '';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.content}>
        <Text style={styles.icon}>⚠️</Text>
        <Text style={styles.title}>계정 삭제</Text>
        <Text style={styles.description}>
          계정을 삭제하면 다음 데이터가 영구적으로 삭제됩니다:
        </Text>

        <View style={styles.list}>
          <Text style={styles.listItem}>• 모든 테스크 및 일정</Text>
          <Text style={styles.listItem}>• 청소 일정 및 기록</Text>
          <Text style={styles.listItem}>• 식재료 정보</Text>
          <Text style={styles.listItem}>• 약 복용 기록</Text>
          <Text style={styles.listItem}>• 자기계발 및 자기돌봄 기록</Text>
          <Text style={styles.listItem}>• 완료 이력 및 통계</Text>
          <Text style={styles.listItem}>• 사용자 설정 및 선호도</Text>
        </View>

        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>⚠️ 주의사항</Text>
          <Text style={styles.warningText}>
            • 이 작업은 되돌릴 수 없습니다{'\n'}
            • 데이터는 즉시 삭제되며 복구할 수 없습니다{'\n'}
            • 삭제 후 다시 가입하더라도 이전 데이터는 복원되지 않습니다
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>💡 대안</Text>
          <Text style={styles.infoText}>
            잠시 쉬고 싶으신가요? 계정을 삭제하는 대신 앱의 알림을 끄거나 데이터를 백업하는
            방법도 있습니다.
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          title={loading ? '삭제 중...' : '계정 삭제'}
          onPress={handleDelete}
          variant="primary"
          fullWidth
          loading={loading}
          disabled={loading}
        />
      </View>

      <EmailReauthModal
        visible={emailModalVisible}
        onClose={() => setEmailModalVisible(false)}
        onConfirm={handleEmailReauthConfirm}
        loading={loading}
        email={userEmail}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    flexGrow: 1,
    padding: Spacing.lg,
  },
  content: {
    flex: 1,
  },
  icon: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.h2,
    textAlign: 'center',
    marginBottom: Spacing.md,
    color: Colors.textPrimary,
  },
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  list: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  listItem: {
    ...Typography.body,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    lineHeight: 24,
  },
  warningBox: {
    backgroundColor: '#FFEBEE',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
    marginBottom: Spacing.md,
  },
  warningTitle: {
    ...Typography.label,
    color: Colors.error,
    marginBottom: Spacing.xs,
  },
  warningText: {
    ...Typography.bodySmall,
    color: Colors.error,
    lineHeight: 20,
  },
  infoBox: {
    backgroundColor: Colors.primaryLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    marginBottom: Spacing.lg,
  },
  infoTitle: {
    ...Typography.label,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  infoText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  actions: {
    paddingTop: Spacing.lg,
  },

  /* 이메일 재인증 모달 */
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.veryLightGray,
    borderRadius: BorderRadius.full,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  modalSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  inputLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  emailDisplay: {
    borderWidth: 1,
    borderColor: Colors.veryLightGray,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.veryLightGray,
  },
  emailText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.veryLightGray,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
  },
  passwordInput: {
    ...Typography.body,
    color: Colors.textPrimary,
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  visibleButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  visibleButtonText: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: '600',
  },
  deleteButton: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  deleteButtonText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '700',
  },
  cancelButton: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
});
