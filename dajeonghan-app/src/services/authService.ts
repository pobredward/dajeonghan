/**
 * 다정한 - 인증 서비스
 * 
 * Firebase Authentication을 관리합니다.
 * - 익명 로그인 (온보딩)
 * - 이메일/Google 계정 연결
 * - 계정 삭제 (GDPR 준수)
 */

import {
  signInAnonymously,
  signInWithCredential,
  linkWithCredential,
  unlink,
  EmailAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  User,
} from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { dateToTimestamp } from './firestoreService';

// ============================================================================
// 익명 인증
// ============================================================================

/**
 * 익명 로그인 (온보딩 시작 시)
 * 
 * 사용자가 앱을 처음 실행할 때 자동으로 익명 계정을 생성합니다.
 * 나중에 이메일이나 Google 계정으로 연결할 수 있습니다.
 */
export const signInAnonymouslyAsync = async (): Promise<User> => {
  try {
    const userCredential = await signInAnonymously(auth);
    console.log('✅ 익명 로그인 성공:', userCredential.user.uid);
    return userCredential.user;
  } catch (error: any) {
    console.error('❌ 익명 로그인 실패:', error);
    throw new Error(`익명 로그인 실패: ${error.message}`);
  }
};

/**
 * 현재 사용자가 익명 사용자인지 확인
 */
export const isAnonymousUser = (): boolean => {
  return auth.currentUser?.isAnonymous ?? false;
};

// ============================================================================
// 계정 연결
// ============================================================================

/**
 * 이메일로 계정 연결
 * 
 * 익명 사용자를 이메일 계정으로 업그레이드합니다.
 * 모든 데이터는 유지됩니다.
 */
export const linkWithEmail = async (email: string, password: string): Promise<User> => {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error('로그인된 사용자가 없습니다.');
  }

  if (!currentUser.isAnonymous) {
    throw new Error('이미 계정이 연결되어 있습니다.');
  }

  try {
    const credential = EmailAuthProvider.credential(email, password);
    const userCredential = await linkWithCredential(currentUser, credential);

    // 이메일 인증 발송 (연결 후 emailVerified=false 상태이므로)
    await sendEmailVerification(userCredential.user);

    // 계정 연결 로그
    await logAccountLink(userCredential.user.uid, 'email');

    console.log('✅ 이메일 계정 연결 성공, 인증 이메일 발송 완료');
    return userCredential.user;
  } catch (error: any) {
    console.error('❌ 이메일 계정 연결 실패:', error);
    
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('이미 사용 중인 이메일입니다.');
    }
    
    throw new Error(`계정 연결 실패: ${error.message}`);
  }
};

/**
 * Google로 직접 로그인 (expo-auth-session 기반, Expo Go 호환)
 *
 * AuthScreen에서 expo-auth-session으로 idToken을 받아 호출합니다.
 * 신규 사용자는 Firebase Auth 계정이 자동 생성됩니다.
 */
export const signInWithGoogle = async (idToken: string): Promise<User> => {
  try {
    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(auth, credential);
    console.log('✅ Google 로그인 성공');
    return result.user;
  } catch (error: any) {
    console.error('❌ Google 로그인 실패:', error);
    throw new Error(`Google 로그인 실패: ${error.message}`);
  }
};

/**
 * Google로 계정 연결 (expo-auth-session 기반, Expo Go 호환)
 *
 * AccountManagementScreen에서 expo-auth-session으로 idToken을 받아 호출합니다.
 */
export const linkWithGoogleExpo = async (idToken: string): Promise<User> => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('로그인된 사용자가 없습니다.');

  try {
    const credential = GoogleAuthProvider.credential(idToken);
    const result = await linkWithCredential(currentUser, credential);
    await logAccountLink(result.user.uid, 'google');
    console.log('✅ Google 계정 연결 성공');
    return result.user;
  } catch (error: any) {
    console.error('❌ Google 계정 연결 실패:', error);
    if (error.code === 'auth/credential-already-in-use') {
      throw new Error('이미 다른 계정에 연결된 Google 계정입니다.');
    }
    throw new Error(`Google 연결 실패: ${error.message}`);
  }
};

/**
 * Apple로 계정 연결 (expo-auth-session 기반, Expo Go 호환)
 *
 * AccountManagementScreen에서 expo-auth-session으로 idToken/nonce를 받아 호출합니다.
 * iOS 전용입니다.
 */
export const linkWithApple = async (idToken: string, nonce: string): Promise<User> => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('로그인된 사용자가 없습니다.');

  try {
    const provider = new OAuthProvider('apple.com');
    const credential = provider.credential({ idToken, rawNonce: nonce });
    const result = await linkWithCredential(currentUser, credential);
    await logAccountLink(result.user.uid, 'apple');
    console.log('✅ Apple 계정 연결 성공');
    return result.user;
  } catch (error: any) {
    console.error('❌ Apple 계정 연결 실패:', error);
    if (error.code === 'auth/credential-already-in-use') {
      throw new Error('이미 다른 계정에 연결된 Apple 계정입니다.');
    }
    throw new Error(`Apple 연결 실패: ${error.message}`);
  }
};

/**
 * Provider 연결 해제
 *
 * 마지막 남은 provider는 해제하면 안 되므로 호출 전 검증 필요.
 */
export const unlinkProvider = async (providerId: string): Promise<User> => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('로그인된 사용자가 없습니다.');
  try {
    const user = await unlink(currentUser, providerId);
    console.log(`✅ Provider 연결 해제 성공: ${providerId}`);
    return user;
  } catch (error: any) {
    console.error('❌ Provider 연결 해제 실패:', error);
    throw new Error(`연결 해제 실패: ${error.message}`);
  }
};

/**
 * 현재 연결된 provider ID 목록
 *
 * 예: ['password', 'google.com', 'apple.com']
 */
export const getLinkedProviders = (): string[] => {
  return auth.currentUser?.providerData.map((p) => p.providerId) ?? [];
};

// ============================================================================
// 일반 로그인
// ============================================================================

/**
 * 이메일/비밀번호로 로그인
 *
 * emailVerified=false인 경우 세션을 유지한 채로 'auth/email-not-verified' 코드를 가진 에러를 throw합니다.
 * AuthScreen에서 이 코드를 감지해 EmailVerificationScreen으로 이동하며,
 * 화면을 벗어날 때 signOut을 처리합니다.
 */
export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (!user.emailVerified) {
      // 세션을 유지한 채로 에러를 throw → EmailVerificationScreen에서 재발송/인증 확인 가능
      const err: any = new Error('이메일 인증이 필요합니다.\n받은편지함의 인증 링크를 클릭해주세요.');
      err.code = 'auth/email-not-verified';
      throw err;
    }

    console.log('✅ 이메일 로그인 성공');
    return user;
  } catch (error: any) {
    if (error.code === 'auth/email-not-verified') throw error;

    console.error('❌ 이메일 로그인 실패:', error);

    if (error.code === 'auth/user-not-found') {
      throw new Error('존재하지 않는 계정입니다.');
    }

    if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    throw new Error(`로그인 실패: ${error.message}`);
  }
};

/**
 * 현재 로그인된 사용자 계정 삭제
 *
 * 미인증 이메일 계정 정리 등 고아 계정 방지에 사용됩니다.
 */
export const deleteCurrentUser = async (): Promise<void> => {
  const currentUser = auth.currentUser;
  if (!currentUser) return;
  try {
    await currentUser.delete();
    console.log('✅ 현재 사용자 계정 삭제 완료');
  } catch (error: any) {
    console.error('❌ 계정 삭제 실패:', error);
    throw new Error(`계정 삭제 실패: ${error.message}`);
  }
};

/**
 * 이메일/비밀번호로 회원가입 + 인증 이메일 발송
 */
export const signUpWithEmail = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(userCredential.user);
    console.log('✅ 이메일 회원가입 성공, 인증 이메일 발송 완료');
    return userCredential.user;
  } catch (error: any) {
    console.error('❌ 이메일 회원가입 실패:', error);

    if (error.code === 'auth/email-already-in-use') {
      throw new Error('이미 사용 중인 이메일입니다.');
    }

    if (error.code === 'auth/weak-password') {
      throw new Error('비밀번호는 최소 6자 이상이어야 합니다.');
    }

    throw new Error(`회원가입 실패: ${error.message}`);
  }
};

/**
 * 인증 이메일 재발송
 */
export const resendEmailVerification = async (): Promise<void> => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('로그인된 사용자가 없습니다.');
  try {
    await sendEmailVerification(currentUser);
    console.log('✅ 인증 이메일 재발송 완료');
  } catch (error: any) {
    console.error('❌ 인증 이메일 재발송 실패:', error);

    if (error.code === 'auth/too-many-requests') {
      throw new Error('잠시 후 다시 시도해주세요. (이메일 발송 횟수 초과)');
    }

    throw new Error(`재발송 실패: ${error.message}`);
  }
};

/**
 * 비밀번호 재설정 이메일 발송
 */
export const sendPasswordReset = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log('✅ 비밀번호 재설정 이메일 발송 완료');
  } catch (error: any) {
    console.error('❌ 비밀번호 재설정 이메일 발송 실패:', error);

    if (error.code === 'auth/user-not-found') {
      throw new Error('등록되지 않은 이메일입니다.');
    }

    if (error.code === 'auth/invalid-email') {
      throw new Error('유효하지 않은 이메일 형식입니다.');
    }

    throw new Error(`비밀번호 재설정 실패: ${error.message}`);
  }
};

// ============================================================================
// 로그아웃 및 계정 관리
// ============================================================================

/**
 * 로그아웃
 */
export const signOut = async (): Promise<void> => {
  try {
    await auth.signOut();
    console.log('✅ 로그아웃 성공');
  } catch (error: any) {
    console.error('❌ 로그아웃 실패:', error);
    throw new Error(`로그아웃 실패: ${error.message}`);
  }
};

/**
 * 현재 사용자 가져오기
 */
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

/**
 * 현재 사용자 UID 가져오기
 */
export const getCurrentUserId = (): string | null => {
  return auth.currentUser?.uid ?? null;
};

/**
 * 사용자 인증 상태 구독
 */
export const onAuthStateChanged = (callback: (user: User | null) => void) => {
  return auth.onAuthStateChanged(callback);
};

// ============================================================================
// 계정 삭제 (GDPR 준수)
// ============================================================================

/**
 * 계정 삭제
 * 
 * 1. Firestore 사용자 데이터 삭제
 * 2. Firebase Auth 계정 삭제
 * 
 * 주의: 하위 컬렉션은 Cloud Functions로 정리하는 것이 더 안전합니다.
 */
export const deleteAccount = async (): Promise<void> => {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error('로그인된 사용자가 없습니다.');
  }

  const userId = currentUser.uid;

  try {
    // 1. Firestore 데이터 삭제 (메인 문서만)
    await deleteUserData(userId);

    // 2. Auth 계정 삭제
    await currentUser.delete();

    console.log('✅ 계정 삭제 성공');
  } catch (error: any) {
    console.error('❌ 계정 삭제 실패:', error);
    
    if (error.code === 'auth/requires-recent-login') {
      throw new Error('보안을 위해 다시 로그인해주세요.');
    }
    
    throw new Error(`계정 삭제 실패: ${error.message}`);
  }
};

/**
 * 사용자 데이터 삭제 (Firestore)
 * 
 * 실제 프로덕션에서는 Cloud Functions로 처리하는 것이 권장됩니다.
 * (하위 컬렉션 재귀 삭제 필요)
 */
const deleteUserData = async (userId: string): Promise<void> => {
  try {
    // 메인 프로필 문서 삭제
    const userRef = doc(db, `users/${userId}`);
    await deleteDoc(userRef);

    // 하위 컬렉션은 Cloud Functions에서 처리
    // (여기서는 메인 문서만 삭제)
    
    console.log('✅ 사용자 데이터 삭제 완료');
  } catch (error: any) {
    console.error('❌ 사용자 데이터 삭제 실패:', error);
    throw error;
  }
};

// ============================================================================
// 로깅
// ============================================================================

/**
 * 계정 연결 로그 기록
 */
const logAccountLink = async (userId: string, method: 'email' | 'google' | 'apple'): Promise<void> => {
  try {
    const logRef = doc(db, `users/${userId}/logs/${Date.now()}_account_link`);
    await setDoc(logRef, {
      userId,
      type: 'account_link',
      method,
      timestamp: dateToTimestamp(new Date()),
      previouslyAnonymous: true,
    });
    
    console.log('✅ 계정 연결 로그 기록 완료');
  } catch (error: any) {
    console.error('⚠️ 계정 연결 로그 기록 실패:', error);
  }
};

// ============================================================================
// Export
// ============================================================================

export const AuthService = {
  // 익명 인증
  signInAnonymously: signInAnonymouslyAsync,
  isAnonymousUser,

  // 계정 연결 (익명 → 소셜/이메일, 기존 UID 유지)
  linkWithEmail,
  linkWithGoogleExpo,
  linkWithApple,

  // Provider 관리
  unlinkProvider,
  getLinkedProviders,

  // 일반 로그인
  signInWithEmail,
  signUpWithEmail,
  resendEmailVerification,
  sendPasswordReset,
  signInWithGoogle,

  // 로그아웃 및 관리
  signOut,
  getCurrentUser,
  getCurrentUserId,
  onAuthStateChanged,

  // 계정 삭제
  deleteAccount,
  deleteCurrentUser,
};
