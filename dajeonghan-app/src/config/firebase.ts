import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  initializeAuth, 
  Auth,
  browserLocalPersistence
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
 * React Native용 커스텀 Persistence 구현
 */
const reactNativePersistence = {
  ...browserLocalPersistence,
  async _get(key: string) {
    return AsyncStorage.getItem(key);
  },
  async _set(key: string, value: string) {
    return AsyncStorage.setItem(key, value);
  },
  async _remove(key: string) {
    return AsyncStorage.removeItem(key);
  }
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
 * Auth 초기화 (React Native persistence 사용)
 */
let auth: Auth;
try {
  auth = getAuth(app);
} catch (error) {
  auth = initializeAuth(app, {
    persistence: reactNativePersistence as any
  });
}

/**
 * Firestore 초기화
 */
export const db: Firestore = getFirestore(app);

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
