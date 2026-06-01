import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  Auth,
  Persistence,
} from 'firebase/auth';
// getReactNativePersistence는 firebase/auth의 react-native 전용 번들에만 있어
// TypeScript 메인 타입 정의에 없으므로 require()로 런타임 import
const { getReactNativePersistence } = require('firebase/auth') as {
  getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence;
};
import {
  getFirestore,
  Firestore,
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

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
  measurementId: FIREBASE_MEASUREMENT_ID
};

// Firebase 앱 초기화 (중복 방지)
const app: FirebaseApp = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApp();

// Auth 초기화 — 앱당 한 번만 initializeAuth를 호출해야 함
// 이미 초기화된 경우 getAuth()로 기존 인스턴스를 반환
let auth: Auth;
try {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  } else {
    auth = getAuth(app);
  }
} catch (e: any) {
  // auth/already-initialized: 앱이 이미 auth를 가지고 있으면 getAuth()로 재사용
  auth = getAuth(app);
}

// Firestore 초기화
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
