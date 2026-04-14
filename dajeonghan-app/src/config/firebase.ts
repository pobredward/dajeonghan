import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  initializeAuth, 
  Auth,
  getReactNativePersistence
} from 'firebase/auth';
import { 
  getFirestore, 
  Firestore,
  enableIndexedDbPersistence,
  enableMultiTabIndexedDbPersistence
} from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
  FIREBASE_MEASUREMENT_ID
} from '@env';

/**
 * Firebase 설정 (환경 변수에서 로드)
 */
const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
  measurementId: FIREBASE_MEASUREMENT_ID
};

/**
 * Firebase 앱 초기화 (중복 방지)
 */
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  console.log('🔥 Firebase 초기화 완료');
} else {
  app = getApps()[0];
  console.log('🔥 Firebase 이미 초기화됨');
}

/**
 * Auth 초기화 (플랫폼별 persistence)
 */
let auth: Auth;
const isReactNative = Platform.OS === 'ios' || Platform.OS === 'android';

if (isReactNative) {
  // React Native: AsyncStorage persistence 사용
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
  console.log('✅ React Native Auth: AsyncStorage persistence 활성화');
} else {
  // 웹: 기본 persistence 사용
  auth = getAuth(app);
  console.log('✅ 웹 Auth: 기본 persistence 활성화');
}

/**
 * Firestore 초기화
 */
export const db: Firestore = getFirestore(app);

/**
 * Firestore 오프라인 지속성 활성화
 * 
 * React Native: IndexedDB가 아닌 AsyncStorage 기반 지속성 사용
 * 웹: IndexedDB 기반 오프라인 지속성 사용
 */
const enableOfflinePersistence = async () => {
  try {
    if (isReactNative) {
      // React Native에서는 기본적으로 AsyncStorage 기반 persistence가 활성화됨
      console.log('✅ React Native: 오프라인 지속성 자동 활성화');
    } else {
      // 웹 환경: IndexedDB 기반 persistence 활성화
      try {
        await enableMultiTabIndexedDbPersistence(db);
        console.log('✅ 웹: 멀티탭 오프라인 지속성 활성화');
      } catch (err: any) {
        if (err.code === 'unimplemented') {
          // 멀티탭 지원 불가 시 단일탭 모드로 fallback
          await enableIndexedDbPersistence(db);
          console.log('✅ 웹: 단일탭 오프라인 지속성 활성화');
        } else {
          throw err;
        }
      }
    }
  } catch (err: any) {
    if (err.code === 'failed-precondition') {
      console.warn('⚠️ 여러 탭이 열려있어 하나의 탭에서만 오프라인 지속성이 활성화됩니다.');
    } else if (err.code === 'unimplemented') {
      console.warn('⚠️ 현재 브라우저는 오프라인 지속성을 지원하지 않습니다.');
    } else {
      console.error('❌ 오프라인 지속성 활성화 실패:', err);
    }
  }
};

// 오프라인 지속성 활성화 실행
enableOfflinePersistence();

/**
 * Storage 초기화
 */
export const storage: FirebaseStorage = getStorage(app);

export { app, auth };

/**
 * 개발 환경 체크
 */
export const isDevelopment = __DEV__;

if (isDevelopment) {
  console.log('📱 Environment:', {
    projectId: firebaseConfig.projectId,
    isDevelopment
  });
}
