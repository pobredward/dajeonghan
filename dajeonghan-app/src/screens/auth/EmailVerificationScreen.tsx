import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { auth } from '@/config/firebase';
import { resendEmailVerification, deleteCurrentUser, signOut } from '@/services/authService';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants';
import { AuthStackParamList } from '@/navigation/AuthNavigator';

const RESEND_COOLDOWN_SECONDS = 60;

type Props = {
  navigation: StackNavigationProp<AuthStackParamList, 'EmailVerification'>;
  route: RouteProp<AuthStackParamList, 'EmailVerification'>;
};

export const EmailVerificationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { email, fromLogin = false } = route.params;
  const { refreshUser } = useAuth();
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [leavingAccount, setLeavingAccount] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 재발송 쿨다운 타이머
  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN_SECONDS);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  // Android 하드웨어 백버튼 차단
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => true;
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, []),
  );

  const handleCheckVerification = async () => {
    setChecking(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('오류', '로그인 상태가 아닙니다. 로그인 화면으로 돌아가 다시 시도해주세요.');
        navigation.navigate('Login');
        return;
      }

      await currentUser.reload();

      if (auth.currentUser?.emailVerified) {
        await refreshUser();
      } else {
        Alert.alert(
          '미인증',
          '아직 이메일이 인증되지 않았습니다.\n받은편지함을 확인해주세요. (스팸함도 확인해주세요)',
        );
      }
    } catch (e: any) {
      Alert.alert('오류', e.message);
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setResending(true);
    try {
      await resendEmailVerification();
      startCooldown();
      Alert.alert('재발송 완료', `${email}으로 인증 이메일을 다시 보냈습니다.`);
    } catch (e: any) {
      Alert.alert('재발송 실패', e.message);
    } finally {
      setResending(false);
    }
  };

  // 화면을 떠날 때: fromLogin 경로라면 signOut, 회원가입 경로라면 미인증 계정 삭제
  const handleLeave = async () => {
    setLeavingAccount(true);
    try {
      if (fromLogin) {
        // 로그인 시도로 진입한 경우: 세션을 종료만 하고 계정은 유지
        await signOut();
        navigation.navigate('Login');
      } else {
        // 회원가입 직후 진입한 경우: 미인증 고아 계정 삭제 후 회원가입으로
        try {
          await deleteCurrentUser();
        } catch {
          // 삭제 실패해도 진행
        }
        navigation.navigate('SignUp');
      }
    } catch {
      // signOut 실패해도 Login으로 이동
      navigation.navigate('Login');
    } finally {
      setLeavingAccount(false);
    }
  };

  const isResendDisabled = resending || cooldown > 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.container}>
        <Text style={styles.icon}>✉️</Text>
        <Text style={styles.title}>이메일을 확인해주세요</Text>
        <Text style={styles.description}>
          <Text style={styles.emailText}>{email}</Text>
          {'\n'}
          {fromLogin
            ? '로 인증 이메일이 발송된 적 있습니다.'
            : '으로 인증 이메일을 발송했습니다.'}
          {'\n\n'}
          이메일의 링크를 클릭한 후{'\n'}"인증 완료 확인" 버튼을 눌러주세요.
        </Text>

        <TouchableOpacity
          style={[styles.primaryButton, checking && styles.buttonDisabled]}
          onPress={handleCheckVerification}
          disabled={checking}
          activeOpacity={0.85}
        >
          {checking ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.primaryButtonText}>인증 완료 확인</Text>
          )}
        </TouchableOpacity>

        <View style={styles.subRow}>
          <TouchableOpacity
            style={isResendDisabled ? styles.buttonDisabled : undefined}
            onPress={handleResend}
            disabled={isResendDisabled}
            activeOpacity={0.7}
          >
            {resending ? (
              <ActivityIndicator color={Colors.primary} size="small" />
            ) : (
              <Text style={styles.subLink}>
                {cooldown > 0 ? `재발송 (${cooldown}초 후 가능)` : '인증 이메일 재발송'}
              </Text>
            )}
          </TouchableOpacity>

          <Text style={styles.subDot}>·</Text>

          <TouchableOpacity
            onPress={handleLeave}
            disabled={leavingAccount}
            activeOpacity={0.7}
          >
            {leavingAccount ? (
              <ActivityIndicator color={Colors.primary} size="small" />
            ) : (
              <Text style={styles.subLink}>
                {fromLogin ? '로그인으로 돌아가기' : '다른 이메일로 가입'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            이메일이 오지 않는다면 스팸함을 확인하거나 재발송 버튼을 눌러주세요.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  icon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h3,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: Spacing.xl,
  },
  emailText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    alignSelf: 'stretch',
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
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  subLink: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: '600',
  },
  subDot: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  infoBox: {
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    alignSelf: 'stretch',
  },
  infoText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
