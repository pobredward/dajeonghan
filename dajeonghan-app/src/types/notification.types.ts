/**
 * 다정한 - 알림 타입 정의
 * 
 * 알림 시스템에서 사용하는 타입들을 정의합니다.
 */

/**
 * 알림 채널 타입
 */
export type NotificationChannelType = 'default' | 'digest' | 'medicine' | 'food';

/**
 * 다이제스트 시간
 */
export type DigestTime = 'morning' | 'evening';

/**
 * 알림 데이터 인터페이스
 */
export interface NotificationData {
  type: 'digest' | 'medicine' | 'food' | 'cleaning' | 'task';
  time?: DigestTime;
  itemId?: string;
  itemName?: string;
  [key: string]: any;
}

/**
 * 다이제스트 섹션
 */
export interface DigestSection {
  type: 'cleaning' | 'food' | 'medicine';
  icon: string;
  items: string[];
  count: number;
}

/**
 * 다이제스트 콘텐츠
 */
export interface DigestContent {
  title: string;
  body: string;
  sections: DigestSection[];
  totalItems: number;
}

/**
 * 알림 권한 상태
 */
export type NotificationPermissionStatus = 'granted' | 'denied' | 'undetermined';

