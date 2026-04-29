/**
 * 다정한 - Auth Context
 * 
 * 인증 상태와 온보딩 상태를 전역으로 관리합니다.
 * user가 null이면 RootNavigator가 AuthNavigator를 렌더링합니다.
 */

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { AuthService } from '@/services/authService';
import { getUserProfile } from '@/services/firestoreService';

interface AuthContextType {
  user: User | null;
  userId: string | null;
  loading: boolean;
  isOnboarded: boolean;
  isGuestOnboarding: boolean;
  startGuestOnboarding: () => void;
  cancelGuestOnboarding: () => void;
  checkOnboardingStatus: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);
  // 게스트(익명) 온보딩 진행 중 플래그
  // Firebase 계정은 온보딩 완료 시점에 생성되므로 그 전까지 user=null 상태를 유지
  const [isGuestOnboarding, setIsGuestOnboarding] = useState(false);

  const startGuestOnboarding = () => setIsGuestOnboarding(true);
  const cancelGuestOnboarding = () => setIsGuestOnboarding(false);

  // 앱 시작 시 Firebase Auth 상태 구독
  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged(async (firebaseUser) => {
      console.log('🔐 Auth State Changed:', firebaseUser?.uid || 'No user');

      if (firebaseUser) {
        setUser(firebaseUser);
        await checkOnboardingStatus(firebaseUser.uid);
      } else {
        // 로그인된 사용자 없음 → 로그인 화면으로 (자동 익명 로그인 하지 않음)
        setUser(null);
        setIsOnboarded(false);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 온보딩 상태 확인 (Firestore에서)
  const checkOnboardingStatus = async (uid?: string) => {
    const targetUid = uid || user?.uid;
    if (!targetUid) {
      console.log('⚠️ userId 없음, 온보딩 상태 확인 불가');
      return;
    }

    try {
      console.log('📋 온보딩 상태 확인 중...', targetUid);
      const profile = await getUserProfile(targetUid);
      const completed = profile?.onboardingCompleted ?? false;
      setIsOnboarded(completed);
      console.log('✅ 온보딩 상태:', completed ? '완료' : '미완료');
    } catch (error) {
      console.error('❌ 온보딩 상태 확인 실패:', error);
      setIsOnboarded(false);
    }
  };

  // 이메일 인증 완료 후 auth.currentUser를 강제 갱신
  const refreshUser = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    await currentUser.reload();
    // reload() 후 auth.currentUser를 다시 참조해야 갱신된 User 객체(메서드 포함)를 얻을 수 있음
    const refreshed = auth.currentUser;
    if (refreshed) {
      setUser(refreshed);
      await checkOnboardingStatus(refreshed.uid);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userId: user?.uid ?? null,
        loading,
        isOnboarded,
        isGuestOnboarding,
        startGuestOnboarding,
        cancelGuestOnboarding,
        checkOnboardingStatus,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
