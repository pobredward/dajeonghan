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
  linkWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  User,
  UserCredential,
  AuthCredential,
} from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
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

    // 계정 연결 로그
    await logAccountLink(userCredential.user.uid, 'email');

    console.log('✅ 이메일 계정 연결 성공');
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
 * Google로 계정 연결
 * 
 * 익명 사용자를 Google 계정으로 업그레이드합니다.
 * React Native에서는 Google Sign-In 라이브러리 필요.
 */
export const linkWithGoogle = async (): Promise<User> => {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error('로그인된 사용자가 없습니다.');
  }

  if (!currentUser.isAnonymous) {
    throw new Error('이미 계정이 연결되어 있습니다.');
  }

  try {
    // React Native에서는 @react-native-google-signin/google-signin 사용
    // 웹에서는 signInWithPopup 사용
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);

    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential) {
      throw new Error('Google 인증 정보를 가져올 수 없습니다.');
    }

    const userCredential = await linkWithCredential(currentUser, credential);

    // 계정 연결 로그
    await logAccountLink(userCredential.user.uid, 'google');

    console.log('✅ Google 계정 연결 성공');
    return userCredential.user;
  } catch (error: any) {
    console.error('❌ Google 계정 연결 실패:', error);
    
    if (error.code === 'auth/credential-already-in-use') {
      throw new Error('이미 다른 계정에 연결된 Google 계정입니다.');
    }
    
    throw new Error(`Google 연결 실패: ${error.message}`);
  }
};

// ============================================================================
// 일반 로그인
// ============================================================================

/**
 * 이메일/비밀번호로 로그인
 */
export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ 이메일 로그인 성공');
    return userCredential.user;
  } catch (error: any) {
    console.error('❌ 이메일 로그인 실패:', error);
    
    if (error.code === 'auth/user-not-found') {
      throw new Error('존재하지 않는 계정입니다.');
    }
    
    if (error.code === 'auth/wrong-password') {
      throw new Error('비밀번호가 올바르지 않습니다.');
    }
    
    throw new Error(`로그인 실패: ${error.message}`);
  }
};

/**
 * 이메일/비밀번호로 회원가입
 */
export const signUpWithEmail = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('✅ 이메일 회원가입 성공');
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
const logAccountLink = async (userId: string, method: 'email' | 'google'): Promise<void> => {
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
  
  // 계정 연결
  linkWithEmail,
  linkWithGoogle,
  
  // 일반 로그인
  signInWithEmail,
  signUpWithEmail,
  
  // 로그아웃 및 관리
  signOut,
  getCurrentUser,
  getCurrentUserId,
  onAuthStateChanged,
  
  // 계정 삭제
  deleteAccount,
};
