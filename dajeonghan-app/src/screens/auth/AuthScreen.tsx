import React, { useEffect, useRef, useState } from 'react';
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
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import {
  signInWithEmail,
  signInAnonymouslyAsync,
  signInWithGoogle,
  sendPasswordReset,
} from '@/services/authService';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { AuthStackParamList } from '@/navigation/AuthNavigator';
import { GOOGLE_WEB_CLIENT_ID, GOOGLE_IOS_CLIENT_ID } from '@env';

WebBrowser.maybeCompleteAuthSession();

type Props = {
  navigation: StackNavigationProp<AuthStackParamList, 'Login'>;
};

export const AuthScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  const passwordRef = useRef<TextInput>(null);

  // Google OAuth (expo-auth-session)
  const [, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    redirectUri: makeRedirectUri({ scheme: 'dajeonghan' }),
  });

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const idToken = googleResponse.authentication?.idToken;
      if (idToken) {
        handleGoogleToken(idToken);
      }
    }
  }, [googleResponse]);

  const handleGoogleToken = async (idToken: string) => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle(idToken);
      // AuthContext의 onAuthStateChanged가 자동으로 처리
    } catch (e: any) {
      Alert.alert('Google 로그인 실패', e.message);
      setGoogleLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('입력 오류', '이메일과 비밀번호를 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmail(email.trim(), password);
      // AuthContext의 onAuthStateChanged가 자동으로 처리
    } catch (e: any) {
      Alert.alert('로그인 실패', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      Alert.alert('비밀번호 찾기', '이메일을 입력한 후 비밀번호 찾기를 눌러주세요.');
      return;
    }
    try {
      await sendPasswordReset(email.trim());
      Alert.alert('발송 완료', `${email.trim()}으로 비밀번호 재설정 이메일을 발송했습니다.`);
    } catch (e: any) {
      Alert.alert('오류', e.message);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await googlePromptAsync();
    } catch (e: any) {
      Alert.alert('Google 로그인 오류', e.message);
      setGoogleLoading(false);
    }
  };

  const handleAppleLogin = () => {
    Alert.alert(
      'Apple 로그인',
      'Apple 로그인은 Dev Build 환경에서 지원됩니다. Expo Go에서는 사용이 제한됩니다.',
    );
  };

  const handleGuestLogin = async () => {
    setGuestLoading(true);
    try {
      await signInAnonymouslyAsync();
      // AuthContext의 onAuthStateChanged가 자동으로 처리
    } catch (e: any) {
      Alert.alert('오류', e.message);
      setGuestLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
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
          {/* 헤더 */}
          <View style={styles.header}>
            <Text style={styles.appName}>다정한</Text>
            <Text style={styles.tagline}>나를 돌보는 가장 다정한 방법</Text>
          </View>

          {/* 이메일/비밀번호 입력 */}
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="이메일"
              placeholderTextColor={Colors.textDisabled}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />

            <View style={styles.passwordRow}>
              <TextInput
                ref={passwordRef}
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="비밀번호"
                placeholderTextColor={Colors.textDisabled}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleEmailLogin}
              />
              <TouchableOpacity
                style={styles.visibleButton}
                onPress={() => setShowPassword((v) => !v)}
                activeOpacity={0.7}
              >
                <Text style={styles.visibleButtonText}>{showPassword ? '숨김' : '표시'}</Text>
              </TouchableOpacity>
            </View>

            {/* 비밀번호 찾기 / 회원가입 */}
            <View style={styles.subRow}>
              <TouchableOpacity onPress={handlePasswordReset} activeOpacity={0.7}>
                <Text style={styles.subLink}>비밀번호 찾기</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('SignUp')} activeOpacity={0.7}>
                <Text style={styles.subLink}>회원가입</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleEmailLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.primaryButtonText}>로그인</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* 구분선 */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>또는</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* 소셜 로그인 */}
          <View style={styles.socialSection}>
            <TouchableOpacity
              style={[styles.socialButton, googleLoading && styles.buttonDisabled]}
              onPress={handleGoogleLogin}
              disabled={googleLoading}
              activeOpacity={0.85}
            >
              {googleLoading ? (
                <ActivityIndicator color={Colors.textPrimary} />
              ) : (
                <Text style={styles.socialButtonText}>Google로 계속하기</Text>
              )}
            </TouchableOpacity>

            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={styles.appleButton}
                onPress={handleAppleLogin}
                activeOpacity={0.85}
              >
                <Text style={styles.appleButtonText}>Apple로 계속하기</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.guestButton, guestLoading && styles.buttonDisabled]}
              onPress={handleGuestLogin}
              disabled={guestLoading}
              activeOpacity={0.7}
            >
              {guestLoading ? (
                <ActivityIndicator color={Colors.textSecondary} />
              ) : (
                <Text style={styles.guestButtonText}>게스트로 시작하기 (익명)</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* 약관 링크 */}
          <View style={styles.legalRow}>
            <TouchableOpacity onPress={() => navigation.navigate('TermsOfService')} activeOpacity={0.7}>
              <Text style={styles.legalLink}>서비스 이용약관</Text>
            </TouchableOpacity>
            <Text style={styles.legalDot}>·</Text>
            <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')} activeOpacity={0.7}>
              <Text style={styles.legalLink}>개인정보 처리방침</Text>
            </TouchableOpacity>
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
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  appName: {
    ...Typography.h1,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  tagline: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  form: {
    marginBottom: Spacing.lg,
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
    marginBottom: Spacing.sm,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.veryLightGray,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    marginBottom: Spacing.sm,
  },
  passwordInput: {
    ...Typography.body,
    color: Colors.textPrimary,
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
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
  subRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  subLink: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    ...Typography.label,
    color: Colors.white,
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.veryLightGray,
  },
  dividerText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginHorizontal: Spacing.md,
  },
  socialSection: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  socialButton: {
    borderWidth: 1,
    borderColor: Colors.veryLightGray,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  socialButtonText: {
    ...Typography.label,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  appleButton: {
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    backgroundColor: Colors.black,
  },
  appleButtonText: {
    ...Typography.label,
    color: Colors.white,
    fontSize: 15,
  },
  guestButton: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  guestButtonText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textDecorationLine: 'underline',
  },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legalLink: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textDecorationLine: 'underline',
  },
  legalDot: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
});
