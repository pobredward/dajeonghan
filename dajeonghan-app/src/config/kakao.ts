import {
  KAKAO_NATIVE_APP_KEY,
  KAKAO_REST_API_KEY,
  KAKAO_JAVASCRIPT_KEY
} from '@env';

export const KAKAO_CONFIG = {
  nativeAppKey: KAKAO_NATIVE_APP_KEY,
  restApiKey: KAKAO_REST_API_KEY,
  javascriptKey: KAKAO_JAVASCRIPT_KEY,
  
  redirectUri: 'dajeonghan://oauth',
  
  authUrl: 'https://kauth.kakao.com/oauth/authorize',
  tokenUrl: 'https://kauth.kakao.com/oauth/token',
  logoutUrl: 'https://kapi.kakao.com/v1/user/logout',
};
