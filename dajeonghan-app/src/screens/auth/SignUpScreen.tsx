import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { signUpWithEmail } from '@/services/authService';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { AuthStackParamList } from '@/navigation/AuthNavigator';

type Props = {
  navigation: StackNavigationProp<AuthStackParamList, 'SignUp'>;
};

export const SignUpScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordRef = useRef<TextInput>(null);
  const passwordConfirmRef = useRef<TextInput>(null);

  const isPasswordMismatch = passwordConfirm.length > 0 && password !== passwordConfirm;

  const handleSignUp = async () => {
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

    setLoading(true);
    try {
      await signUpWithEmail(email.trim(), password);
      // 가입 성공 후 이메일 인증 화면으로 이동
      // Auth 상태가 변경되더라도 emailVerified=false이면 인증 화면에 머뭄
      navigation.navigate('EmailVerification', { email: email.trim() });
    } catch (e: any) {
      Alert.alert('회원가입 실패', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.description}>
            이메일 인증 후 모든 기능을 사용할 수 있습니다.
          </Text>

          {/* 이메일 */}
          <Text style={styles.label}>이메일</Text>
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

          {/* 비밀번호 */}
          <Text style={[styles.label, { marginTop: Spacing.md }]}>비밀번호</Text>
          <View style={styles.passwordRow}>
            <TextInput
              ref={passwordRef}
              style={styles.passwordInput}
              value={password}
              onChangeText={setPassword}
              placeholder="6자 이상"
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

          {/* 비밀번호 확인 */}
          <Text style={[styles.label, { marginTop: Spacing.md }]}>비밀번호 확인</Text>
          <View style={[styles.passwordRow, isPasswordMismatch && styles.inputError]}>
            <TextInput
              ref={passwordConfirmRef}
              style={styles.passwordInput}
              value={passwordConfirm}
              onChangeText={setPasswordConfirm}
              placeholder="비밀번호 재입력"
              placeholderTextColor={Colors.textDisabled}
              secureTextEntry={!showPasswordConfirm}
              returnKeyType="done"
              onSubmitEditing={handleSignUp}
            />
            <TouchableOpacity
              style={styles.visibleButton}
              onPress={() => setShowPasswordConfirm((v) => !v)}
              activeOpacity={0.7}
            >
              <Text style={styles.visibleButtonText}>{showPasswordConfirm ? '숨김' : '표시'}</Text>
            </TouchableOpacity>
          </View>
          {isPasswordMismatch && (
            <Text style={styles.errorText}>비밀번호가 일치하지 않습니다.</Text>
          )}

          {/* 회원가입 버튼 */}
          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.primaryButtonText}>회원가입</Text>
            )}
          </TouchableOpacity>

          {/* 약관 링크 */}
          <View style={styles.legalRow}>
            <Text style={styles.legalNote}>가입하면 </Text>
            <TouchableOpacity onPress={() => navigation.navigate('TermsOfService')} activeOpacity={0.7}>
              <Text style={styles.legalLink}>서비스 이용약관</Text>
            </TouchableOpacity>
            <Text style={styles.legalNote}> 및 </Text>
            <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')} activeOpacity={0.7}>
              <Text style={styles.legalLink}>개인정보 처리방침</Text>
            </TouchableOpacity>
            <Text style={styles.legalNote}>에 동의하게 됩니다.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  description: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  label: {
    ...Typography.label,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  input: {
    ...Typography.body,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.veryLightGray,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
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
    paddingVertical: Spacing.sm + 2,
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
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  primaryButtonText: {
    ...Typography.label,
    color: Colors.white,
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  legalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  legalNote: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  legalLink: {
    ...Typography.caption,
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
});
