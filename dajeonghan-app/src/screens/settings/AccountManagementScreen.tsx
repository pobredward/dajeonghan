import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/contexts/AuthContext';
import {
  linkWithEmail,
  linkWithGoogleExpo,
  unlinkProvider,
  getLinkedProviders,
  signOut,
} from '@/services/authService';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import {
  GOOGLE_WEB_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID,
} from '@env';

WebBrowser.maybeCompleteAuthSession();

// ============================================================================
// Provider 정의 — 나중에 네이버/카카오 추가 시 이 배열에만 항목 추가
// ============================================================================
interface ProviderDef {
  id: string;
  label: string;
  description: string;
  iosOnly?: boolean;
}

const PROVIDER_DEFS: ProviderDef[] = [
  {
    id: 'password',
    label: '이메일/비밀번호',
    description: '이메일과 비밀번호로 로그인',
  },
  {
    id: 'google.com',
    label: 'Google',
    description: 'Google 계정으로 로그인',
  },
  {
    id: 'apple.com',
    label: 'Apple',
    description: 'Apple ID로 로그인 (Dev Build 지원)',
    iosOnly: true,
  },
  // 추후 추가 (Cloud Functions 서버 구축 후):
  // { id: 'naver.custom', label: '네이버', description: '네이버 계정으로 로그인' },
  // { id: 'kakao.custom', label: '카카오', description: '카카오 계정으로 로그인' },
];

// ============================================================================
// 이메일 연결 모달
// ============================================================================
interface EmailModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EmailLinkModal: React.FC<EmailModalProps> = ({ visible, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  const passwordRef = React.useRef<TextInput>(null);
  const passwordConfirmRef = React.useRef<TextInput>(null);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim() || !passwordConfirm.trim()) {
      Alert.alert('입력 오류', '모든 항목을 입력해주세요.');
      return;
    }
    if (password !== passwordConfirm) {
      Alert.alert('입력 오류', '비밀번호가 일치하지 않습니다.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('입력 오류', '비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    setSaving(true);
    try {
      await linkWithEmail(email.trim(), password);
      onSuccess();
    } catch (e: any) {
      Alert.alert('연결 실패', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>이메일 계정 연결</Text>
          <Text style={styles.modalSubtitle}>
            이메일과 비밀번호를 설정하면 기기를 바꿔도 같은 계정으로 로그인할 수 있습니다.
          </Text>

          <Text style={styles.inputLabel}>이메일</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="이메일 주소"
            placeholderTextColor={Colors.textDisabled}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />

          <Text style={[styles.inputLabel, { marginTop: Spacing.md }]}>비밀번호</Text>
          <View style={styles.passwordRow}>
            <TextInput
              ref={passwordRef}
              style={styles.passwordInput}
              value={password}
              onChangeText={setPassword}
              placeholder="6자 이상 비밀번호"
              placeholderTextColor={Colors.textDisabled}
              secureTextEntry={!showPassword}
              returnKeyType="next"
              onSubmitEditing={() => passwordConfirmRef.current?.focus()}
            />
            <TouchableOpacity
              style={styles.visibleButton}
              onPress={() => setShowPassword((v) => !v)}
              activeOpacity={0.7}
            >
              <Text style={styles.visibleButtonText}>{showPassword ? '숨김' : '표시'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.inputLabel, { marginTop: Spacing.md }]}>비밀번호 확인</Text>
          <View style={styles.passwordRow}>
            <TextInput
              ref={passwordConfirmRef}
              style={[
                styles.passwordInput,
                passwordConfirm.length > 0 && password !== passwordConfirm && styles.inputError,
              ]}
              value={passwordConfirm}
              onChangeText={setPasswordConfirm}
              placeholder="비밀번호 재입력"
              placeholderTextColor={Colors.textDisabled}
              secureTextEntry={!showPasswordConfirm}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
            <TouchableOpacity
              style={styles.visibleButton}
              onPress={() => setShowPasswordConfirm((v) => !v)}
              activeOpacity={0.7}
            >
              <Text style={styles.visibleButtonText}>{showPasswordConfirm ? '숨김' : '표시'}</Text>
            </TouchableOpacity>
          </View>
          {passwordConfirm.length > 0 && password !== passwordConfirm && (
            <Text style={styles.errorText}>비밀번호가 일치하지 않습니다.</Text>
          )}

          <TouchableOpacity
            style={[styles.primaryButton, saving && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.primaryButtonText}>연결하기</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.cancelButtonText}>취소</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ============================================================================
// Provider 행 컴포넌트
// ============================================================================
interface ProviderRowProps {
  def: ProviderDef;
  isLinked: boolean;
  canUnlink: boolean;
  onLink: () => void;
  onUnlink: () => void;
  loading: boolean;
}

const ProviderRow: React.FC<ProviderRowProps> = ({
  def,
  isLinked,
  canUnlink,
  onLink,
  onUnlink,
  loading,
}) => (
  <View style={styles.providerRow}>
    <View style={styles.providerInfo}>
      <Text style={styles.providerLabel}>{def.label}</Text>
      <Text style={styles.providerDesc}>{def.description}</Text>
    </View>
    {loading ? (
      <ActivityIndicator size="small" color={Colors.primary} />
    ) : isLinked ? (
      <TouchableOpacity
        style={[styles.unlinkButton, !canUnlink && styles.unlinkButtonDisabled]}
        onPress={canUnlink ? onUnlink : undefined}
        activeOpacity={canUnlink ? 0.7 : 1}
      >
        <Text style={[styles.unlinkButtonText, !canUnlink && styles.unlinkButtonTextDisabled]}>
          연결됨
        </Text>
      </TouchableOpacity>
    ) : (
      <TouchableOpacity style={styles.linkButton} onPress={onLink} activeOpacity={0.7}>
        <Text style={styles.linkButtonText}>연결</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ============================================================================
// 메인 화면
// ============================================================================
export const AccountManagementScreen: React.FC = () => {
  const { user } = useAuth();
  const [linkedProviders, setLinkedProviders] = useState<string[]>([]);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Google OAuth
  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    redirectUri: makeRedirectUri({ scheme: 'dajeonghan' }),
  });

  const refreshProviders = useCallback(() => {
    setLinkedProviders(getLinkedProviders());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshProviders();
    }, [refreshProviders])
  );

  // Google 응답 처리
  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const idToken = googleResponse.authentication?.idToken;
      if (!idToken) {
        Alert.alert('오류', 'Google 인증 정보를 받지 못했습니다.');
        setLoadingProvider(null);
        return;
      }
      (async () => {
        try {
          await linkWithGoogleExpo(idToken);
          refreshProviders();
          Alert.alert('완료', 'Google 계정이 연결되었습니다.');
        } catch (e: any) {
          Alert.alert('연결 실패', e.message);
        } finally {
          setLoadingProvider(null);
        }
      })();
    } else if (googleResponse?.type === 'error' || googleResponse?.type === 'dismiss') {
      setLoadingProvider(null);
    }
  }, [googleResponse]);

  const handleLink = async (providerId: string) => {
    setLoadingProvider(providerId);
    if (providerId === 'password') {
      setEmailModalVisible(true);
      setLoadingProvider(null);
      return;
    }
    if (providerId === 'google.com') {
      await googlePromptAsync();
      return;
    }
    if (providerId === 'apple.com') {
      setLoadingProvider(null);
      Alert.alert(
        'Apple 로그인',
        'Apple 계정 연결은 Dev Build에서 지원됩니다.\n(Expo Go 환경에서는 사용할 수 없습니다.)'
      );
      return;
    }
    setLoadingProvider(null);
  };

  const handleUnlink = (providerId: string) => {
    Alert.alert(
      '연결 해제',
      `${PROVIDER_DEFS.find((p) => p.id === providerId)?.label} 연결을 해제할까요?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '해제',
          style: 'destructive',
          onPress: async () => {
            setLoadingProvider(providerId);
            try {
              await unlinkProvider(providerId);
              refreshProviders();
            } catch (e: any) {
              Alert.alert('실패', e.message);
            } finally {
              setLoadingProvider(null);
            }
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true);
          try {
            await signOut();
          } catch (e: any) {
            Alert.alert('오류', e.message);
          } finally {
            setSigningOut(false);
          }
        },
      },
    ]);
  };

  const isAnonymous = user?.isAnonymous ?? true;
  const canUnlink = linkedProviders.length > 1;

  const visibleProviders = PROVIDER_DEFS.filter(
    (p) => !p.iosOnly || Platform.OS === 'ios'
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 계정 상태 배너 */}
        <View style={[styles.statusBanner, isAnonymous ? styles.statusBannerAnon : styles.statusBannerLinked]}>
          <Text style={styles.statusIcon}>{isAnonymous ? '👤' : '🔐'}</Text>
          <View style={styles.statusText}>
            <Text style={styles.statusTitle}>
              {isAnonymous ? '익명 계정' : '계정 연결됨'}
            </Text>
            <Text style={styles.statusDesc}>
              {isAnonymous
                ? '계정을 연결하면 기기를 바꿔도 데이터가 유지됩니다.'
                : `${linkedProviders.length}개의 로그인 방법이 연결되어 있습니다.`}
            </Text>
          </View>
        </View>

        {/* 로그인 방법 */}
        <Text style={styles.sectionLabel}>로그인 방법</Text>
        <View style={styles.card}>
          {visibleProviders.map((def, idx) => (
            <View key={def.id}>
              <ProviderRow
                def={def}
                isLinked={linkedProviders.includes(def.id)}
                canUnlink={canUnlink}
                onLink={() => handleLink(def.id)}
                onUnlink={() => handleUnlink(def.id)}
                loading={loadingProvider === def.id}
              />
              {idx < visibleProviders.length - 1 && <View style={styles.rowDivider} />}
            </View>
          ))}
        </View>

        {canUnlink && (
          <Text style={styles.hintText}>
            연결된 로그인 방법이 1개만 남으면 해제할 수 없습니다.
          </Text>
        )}

        {/* 로그아웃 */}
        <Text style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>계정</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleSignOut}
            disabled={signingOut}
            activeOpacity={0.7}
          >
            {signingOut ? (
              <ActivityIndicator size="small" color={Colors.error} />
            ) : (
              <Text style={styles.dangerText}>로그아웃</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <EmailLinkModal
        visible={emailModalVisible}
        onClose={() => setEmailModalVisible(false)}
        onSuccess={() => {
          setEmailModalVisible(false);
          refreshProviders();
          Alert.alert('완료', '이메일 계정이 연결되었습니다.');
        }}
      />
    </SafeAreaView>
  );
};

// ============================================================================
// Styles
// ============================================================================
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: { flex: 1 },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },

  /* 상태 배너 */
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  statusBannerAnon: {
    backgroundColor: '#FFF8E1',
  },
  statusBannerLinked: {
    backgroundColor: Colors.primaryLight,
  },
  statusIcon: {
    fontSize: 28,
  },
  statusText: { flex: 1 },
  statusTitle: {
    ...Typography.label,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  statusDesc: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 18,
  },

  /* 섹션 */
  sectionLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  hintText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },

  /* Provider 행 */
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    gap: Spacing.md,
  },
  providerInfo: { flex: 1 },
  providerLabel: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  providerDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  linkButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
  },
  linkButtonText: {
    ...Typography.bodySmall,
    color: Colors.white,
    fontWeight: '600',
  },
  unlinkButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  unlinkButtonDisabled: {
    borderColor: Colors.lightGray,
  },
  unlinkButtonText: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: '600',
  },
  unlinkButtonTextDisabled: {
    color: Colors.lightGray,
  },
  rowDivider: {
    height: 1,
    backgroundColor: Colors.veryLightGray,
    marginLeft: Spacing.md,
  },

  /* 액션 행 */
  actionRow: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'flex-start',
  },
  dangerText: {
    ...Typography.body,
    color: Colors.error,
    fontWeight: '600',
  },

  /* 이메일 모달 */
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
  input: {
    ...Typography.body,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.veryLightGray,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
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
  inputError: {
    borderColor: Colors.error,
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
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: 4,
    marginLeft: Spacing.xs,
  },
  primaryButton: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  primaryButtonText: {
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
