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
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import {
  signInWithEmail,
  signInWithGoogle,
  signInWithApple,
  sendPasswordReset,
} from '@/services/authService';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { AuthStackParamList } from '@/navigation/AuthNavigator';
import { GOOGLE_WEB_CLIENT_ID, GOOGLE_IOS_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID } from '@env';

WebBrowser.maybeCompleteAuthSession();

type Props = {
  navigation: StackNavigationProp<AuthStackParamList, 'Login'>;
};

export const AuthScreen: React.FC<Props> = ({ navigation }) => {
  const { startGuestOnboarding } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  const passwordRef = useRef<TextInput>(null);

  // Google OAuth (expo-auth-session)
  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
  });

  useEffect(() => {
    if (!googleResponse) return;
    if (googleResponse.type === 'success') {
      const idToken = googleResponse.authentication?.idToken;
      if (idToken) {
        handleGoogleToken(idToken);
      } else {
        setGoogleLoading(false);
      }
    } else {
      // 취소(dismiss/cancel) 또는 에러 → 로딩 해제
      setGoogleLoading(false);
    }
  }, [googleResponse]);

  const handleGoogleToken = async (idToken: string) => {
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
      // 성공 시 AuthContext의 onAuthStateChanged가 자동으로 처리
    } catch (e: any) {
      if ((e as any).code === 'auth/email-not-verified') {
        // 미인증 계정 → 인증 화면으로 이동 (세션 유지 상태, 화면 이탈 시 signOut 처리)
        navigation.navigate('EmailVerification', { email: email.trim(), fromLogin: true });
      } else {
        Alert.alert('로그인 실패', e.message);
      }
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

  const handleAppleLogin = async () => {
    setAppleLoading(true);
    try {
      // rawNonce: Apple에 전달할 원문, hashedNonce: Apple 요청 시 SHA-256 해시
      const rawNonce = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce,
      );
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });
      if (credential.identityToken) {
        // Firebase에는 rawNonce(원문)를 전달해야 Firebase가 자체적으로 해시해 검증
        await signInWithApple(credential.identityToken, rawNonce);
      } else {
        Alert.alert('Apple 로그인 오류', 'Apple 인증 정보를 받지 못했습니다.');
      }
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Apple 로그인 실패', e.message);
      }
    } finally {
      setAppleLoading(false);
    }
  };

  const handleGuestLogin = () => {
    // Firebase 계정을 즉시 생성하지 않고, 온보딩 완료 시점에 생성
    // → 뒤로가기 반복 시 고아 익명 계정이 쌓이지 않음
    startGuestOnboarding();
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
                style={[styles.appleButton, appleLoading && styles.buttonDisabled]}
                onPress={handleAppleLogin}
                disabled={appleLoading}
                activeOpacity={0.85}
              >
                {appleLoading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.appleButtonText}>Apple로 계속하기</Text>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.guestButton}
              onPress={handleGuestLogin}
              activeOpacity={0.7}
            >
              <Text style={styles.guestButtonText}>게스트로 시작하기 (익명)</Text>
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
