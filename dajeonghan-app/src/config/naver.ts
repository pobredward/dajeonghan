import { NAVER_CLIENT_ID, NAVER_CLIENT_SECRET } from '@env';

export const NAVER_CONFIG = {
  clientId: NAVER_CLIENT_ID,
  clientSecret: NAVER_CLIENT_SECRET,
  
  redirectUri: 'dajeonghan://oauth/naver',
  
  authUrl: 'https://nid.naver.com/oauth2.0/authorize',
  tokenUrl: 'https://nid.naver.com/oauth2.0/token',
};
