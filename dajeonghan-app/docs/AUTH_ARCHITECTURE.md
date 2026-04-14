# 현재 사용자 인증 구조 분석 및 개선안

## 현재 상태 분석

### 🔴 문제점

1. **하드코딩된 test-user**
   ```typescript
   userId="test-user"  // RootNavigator.tsx
   ```
   - 모든 사용자가 같은 ID 공유
   - 실제 프로덕션에서 사용 불가

2. **인증 로직 누락**
   - 앱 시작 시 익명 로그인이 자동으로 실행되지 않음
   - `AuthService`가 있지만 실제로 사용되지 않음

3. **온보딩 상태 관리 부재**
   - `isOnboarded`가 로컬 state로만 관리됨
   - 앱 재시작 시 온보딩 상태 유실

4. **소셜 로그인 연동 불가**
   - 익명 사용자 → 실제 계정 전환 흐름이 구현되지 않음

## ✅ 권장 아키텍처

### Phase 1: 익명 사용자 우선 (현재 구현)

```
앱 시작
  ↓
익명 로그인 (자동)
  ↓
uid 생성 (예: "AnonymousUser_abc123")
  ↓
온보딩 진행
  ↓
데이터 저장 (users/{uid})
  ↓
앱 사용
```

### Phase 2: 계정 연결 (선택적)

```
설정 > 계정 연결
  ↓
이메일/Google 로그인
  ↓
linkWithCredential() ← Firebase 기능
  ↓
uid 유지 (데이터 보존!)
  ↓
계정 연동 완료
```

## 구현 방안

### 1단계: AuthContext 생성

익명 로그인과 온보딩 상태를 전역으로 관리합니다.

```typescript
// src/contexts/AuthContext.tsx
import React, { createContext, useState, useEffect, useContext } from 'react';
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);

  // 1. 앱 시작 시 자동 익명 로그인
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Firebase Auth 상태 구독
        const unsubscribe = AuthService.onAuthStateChanged(async (firebaseUser) => {
          if (firebaseUser) {
            setUser(firebaseUser);
            await checkOnboardingStatus(firebaseUser.uid);
          } else {
            // 로그인된 사용자가 없으면 익명 로그인
            const anonymousUser = await AuthService.signInAnonymously();
            setUser(anonymousUser);
          }
          setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error('인증 초기화 실패:', error);
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // 2. 온보딩 상태 확인 (Firestore에서)
  const checkOnboardingStatus = async (uid?: string) => {
    const userId = uid || user?.uid;
    if (!userId) return;

    try {
      const profile = await getUserProfile(userId);
      setIsOnboarded(profile?.onboardingCompleted ?? false);
    } catch (error) {
      console.error('온보딩 상태 확인 실패:', error);
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
```

### 2단계: App.tsx 수정

```typescript
// App.tsx
import { AuthProvider } from './src/contexts/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
```

### 3단계: RootNavigator 수정

```typescript
// src/navigation/RootNavigator.tsx
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { OnboardingFlow } from '@/screens/onboarding/OnboardingFlow';
import { TabNavigator } from './TabNavigator';
import { useAuth } from '@/contexts/AuthContext';

const Stack = createStackNavigator();

export const RootNavigator: React.FC = () => {
  const { userId, loading, isOnboarded, checkOnboardingStatus } = useAuth();

  // 로딩 중
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isOnboarded ? (
          <Stack.Screen name="Onboarding">
            {(props) => (
              <OnboardingFlow
                {...props}
                userId={userId!}  // 실제 Firebase UID 사용
                onComplete={async () => {
                  await checkOnboardingStatus();  // 온보딩 상태 새로고침
                }}
              />
            )}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Main" component={TabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
```

### 4단계: 계정 연결 화면 추가

```typescript
// src/screens/settings/LinkAccountScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { AuthService } from '@/services/authService';
import { useAuth } from '@/contexts/AuthContext';

export const LinkAccountScreen: React.FC = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const isAnonymous = user?.isAnonymous ?? false;

  const handleLinkEmail = async () => {
    if (!email || !password) {
      Alert.alert('오류', '이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      await AuthService.linkWithEmail(email, password);
      Alert.alert('성공', '계정이 연결되었습니다!');
    } catch (error: any) {
      Alert.alert('오류', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkGoogle = async () => {
    setLoading(true);
    try {
      await AuthService.linkWithGoogle();
      Alert.alert('성공', 'Google 계정이 연결되었습니다!');
    } catch (error: any) {
      Alert.alert('오류', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAnonymous) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>✅ 계정이 연결되어 있습니다</Text>
        <Text style={styles.subtitle}>
          {user?.email ? `이메일: ${user.email}` : 'Google 계정으로 로그인됨'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>계정 연결</Text>
      <Text style={styles.subtitle}>
        계정을 연결하면 여러 기기에서 데이터를 동기화할 수 있습니다.
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>이메일로 연결</Text>
        <TextInput
          style={styles.input}
          placeholder="이메일"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="비밀번호 (6자 이상)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity
          style={styles.button}
          onPress={handleLinkEmail}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? '처리 중...' : '이메일로 연결'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>또는</Text>
        <TouchableOpacity
          style={[styles.button, styles.googleButton]}
          onPress={handleLinkGoogle}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Google로 연결</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          💡 현재는 익명으로 사용 중입니다. 계정을 연결하지 않아도 앱을 사용할 수 있지만,
          기기를 변경하면 데이터가 유실될 수 있습니다.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
    color: '#999',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  googleButton: {
    backgroundColor: '#DB4437',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 8,
    marginTop: 'auto',
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
});
```

## 데이터 구조

### Firestore 구조 (최종)

```
users/
  {uid}/  ← Firebase UID (익명 또는 실제 계정)
    - id: string
    - userId: string (= uid)
    - persona: PersonaType
    - environment: {...}
    - onboardingCompleted: boolean
    - isAnonymous: boolean  ← 추가
    - linkedAt?: timestamp  ← 계정 연결 시점
    - linkedMethod?: 'email' | 'google'
    
    tasks/
      {taskId}/
        - ...
    
    objects/
      {objectId}/
        - ...
```

## 마이그레이션 계획

### 기존 test-user 데이터 처리

```typescript
// 1회성 마이그레이션 스크립트 (Cloud Functions)
export const migrateTestUser = functions.https.onRequest(async (req, res) => {
  const testUserRef = admin.firestore().collection('users').doc('test-user');
  const testUserSnap = await testUserRef.get();
  
  if (!testUserSnap.exists) {
    res.send('No test-user data found');
    return;
  }
  
  // test-user 데이터를 삭제하거나 경고 표시
  await testUserRef.delete();
  
  res.send('Migration complete');
});
```

## 체크리스트

### 즉시 구현 필요 (필수)
- [ ] AuthContext 생성
- [ ] App.tsx에 AuthProvider 적용
- [ ] RootNavigator에서 useAuth 사용
- [ ] 익명 로그인 자동 실행
- [ ] 온보딩 상태를 Firestore에서 확인

### 나중에 구현 가능 (선택)
- [ ] 계정 연결 화면 추가
- [ ] Google Sign-In 라이브러리 설치
- [ ] 이메일 로그인 화면
- [ ] 비밀번호 재설정 기능

## 장점

### ✅ 현재 제안 방식

1. **즉시 사용 가능**
   - 앱 설치 즉시 익명 계정 생성
   - 온보딩 없이 바로 시작

2. **데이터 보존**
   - 익명 → 실제 계정 전환 시 데이터 유지
   - Firebase `linkWithCredential` 사용

3. **확장 가능**
   - 나중에 이메일/Google 추가 용이
   - Apple Sign-In, 카카오 등 추가 가능

4. **개인정보 보호**
   - 계정 연결 전까지 완전 익명
   - GDPR 준수 용이

5. **단순한 UX**
   - 회원가입 없이 바로 시작
   - 필요할 때만 계정 연결

### 🔴 대안: 필수 로그인 (비추천)

```
앱 시작 → 로그인/회원가입 화면 → 온보딩 → 앱 사용
```

**단점:**
- 진입 장벽 높음
- 온보딩 전에 계정 생성 필요
- 이탈률 증가

## 요약

### 현재 문제
- `userId="test-user"` 하드코딩
- 모든 사용자가 같은 데이터 공유

### 해결 방법
1. **AuthContext 생성** → 익명 로그인 자동화
2. **실제 Firebase UID 사용** → 사용자별 데이터 분리
3. **Firestore에서 온보딩 상태 확인** → 앱 재시작 시 유지
4. **나중에 계정 연결 기능 추가** → 데이터 보존하며 업그레이드

### 우선순위
1. ⚡️ **즉시**: AuthContext + 익명 로그인
2. 🔜 **다음**: 계정 연결 UI
3. 📅 **나중**: 소셜 로그인 (Google, Apple, 카카오)
