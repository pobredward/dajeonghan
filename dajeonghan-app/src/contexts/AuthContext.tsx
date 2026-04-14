/**
 * 다정한 - Auth Context
 * 
 * 익명 로그인과 온보딩 상태를 전역으로 관리합니다.
 */

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { AuthService } from '@/services/authService';
import { getUserProfile } from '@/services/firestoreService';

interface AuthContextType {
  user: User | null;
  userId: string | null;
  loading: boolean;
  isOnboarded: boolean;
  checkOnboardingStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);

  // 1. 앱 시작 시 Firebase Auth 상태 구독
  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged(async (firebaseUser) => {
      console.log('🔐 Auth State Changed:', firebaseUser?.uid || 'No user');
      
      if (firebaseUser) {
        // 로그인된 사용자가 있음
        setUser(firebaseUser);
        await checkOnboardingStatus(firebaseUser.uid);
      } else {
        // 로그인된 사용자가 없음 → 자동 익명 로그인
        try {
          console.log('👤 익명 로그인 시도...');
          const anonymousUser = await AuthService.signInAnonymously();
          setUser(anonymousUser);
          console.log('✅ 익명 로그인 성공:', anonymousUser.uid);
        } catch (error) {
          console.error('❌ 익명 로그인 실패:', error);
        }
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. 온보딩 상태 확인 (Firestore에서)
  const checkOnboardingStatus = async (uid?: string) => {
    const userId = uid || user?.uid;
    if (!userId) {
      console.log('⚠️ userId 없음, 온보딩 상태 확인 불가');
      return;
    }

    try {
      console.log('📋 온보딩 상태 확인 중...', userId);
      const profile = await getUserProfile(userId);
      const completed = profile?.onboardingCompleted ?? false;
      setIsOnboarded(completed);
      console.log('✅ 온보딩 상태:', completed ? '완료' : '미완료');
    } catch (error) {
      console.error('❌ 온보딩 상태 확인 실패:', error);
      setIsOnboarded(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userId: user?.uid ?? null,
        loading,
        isOnboarded,
        checkOnboardingStatus,
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
