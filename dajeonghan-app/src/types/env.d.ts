/**
 * 다정한 - 환경 변수 타입 정의
 * 
 * React Native 환경 변수에 대한 TypeScript 타입을 제공합니다.
 */

declare module '@env' {
  export const FIREBASE_API_KEY: string;
  export const FIREBASE_AUTH_DOMAIN: string;
  export const FIREBASE_PROJECT_ID: string;
  export const FIREBASE_STORAGE_BUCKET: string;
  export const FIREBASE_MESSAGING_SENDER_ID: string;
  export const FIREBASE_APP_ID: string;
  export const FIREBASE_MEASUREMENT_ID: string;

  export const KAKAO_NATIVE_APP_KEY: string;
  export const KAKAO_REST_API_KEY: string;
  export const KAKAO_JAVASCRIPT_KEY: string;

  export const NAVER_CLIENT_ID: string;
  export const NAVER_CLIENT_SECRET: string;

  export const APPLE_TEAM_ID: string;
  export const APPLE_APP_ID: string;

  export const GOOGLE_WEB_CLIENT_ID: string;
  export const GOOGLE_IOS_CLIENT_ID: string;
}

declare const __DEV__: boolean;
