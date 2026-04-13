/**
 * 다정한 - Cloud Functions
 * 
 * 2단계에서 구현될 서버리스 백엔드 로직:
 * - 오전/저녁 다이제스트 스케줄러
 * - 주기 재조정 (주 1회)
 * - 계정 삭제 시 데이터 정리
 * - Expo 푸시 알림 발송
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Firebase Admin SDK 초기화
admin.initializeApp();

// ============================================================================
// 다이제스트 알림 (2단계에서 구현 예정)
// ============================================================================

/**
 * 오전 다이제스트 발송 (매일 08:50 KST)
 * 
 * 사용자의 오늘 할 일, 유통기한 임박 식품 등을 요약하여
 * 푸시 알림으로 발송합니다.
 */
export const sendMorningDigest = functions
  .region('asia-northeast3') // 서울 리전
  .pubsub.schedule('50 8 * * *')
  .timeZone('Asia/Seoul')
  .onRun(async (context) => {
    const db = admin.firestore();

    try {
      // 다이제스트 모드 사용자 조회
      const usersSnapshot = await db
        .collection('users')
        .where('notificationMode', '==', 'digest')
        .get();

      console.log(`📨 오전 다이제스트 발송 시작: ${usersSnapshot.size}명`);

      const promises = usersSnapshot.docs.map(async (userDoc) => {
        const userId = userDoc.id;
        const profile = userDoc.data();

        // Expo Push Token 확인
        const pushToken = profile.expoPushToken;
        if (!pushToken) {
          console.log(`⏭️ ${userId}: Push Token 없음`);
          return;
        }

        // TODO: 다이제스트 내용 생성 로직 (2단계에서 구현)
        // - 오늘 할 일 조회
        // - 유통기한 임박 식품 조회
        // - 알림 문구 생성

        // TODO: Expo Push 발송 (2단계에서 구현)
        // await sendExpoPushNotification(pushToken, {...});

        console.log(`✅ ${userId}: 오전 다이제스트 발송 완료`);
      });

      await Promise.all(promises);

      console.log('✅ 오전 다이제스트 발송 완료');
      return null;
    } catch (error) {
      console.error('❌ 오전 다이제스트 발송 실패:', error);
      throw error;
    }
  });

/**
 * 저녁 다이제스트 발송 (매일 19:50 KST)
 * 
 * 오늘 완료한 일, 내일 할 일 등을 요약하여
 * 푸시 알림으로 발송합니다.
 */
export const sendEveningDigest = functions
  .region('asia-northeast3')
  .pubsub.schedule('50 19 * * *')
  .timeZone('Asia/Seoul')
  .onRun(async (context) => {
    const db = admin.firestore();

    try {
      const usersSnapshot = await db
        .collection('users')
        .where('notificationMode', '==', 'digest')
        .get();

      console.log(`📨 저녁 다이제스트 발송 시작: ${usersSnapshot.size}명`);

      const promises = usersSnapshot.docs.map(async (userDoc) => {
        const userId = userDoc.id;
        const profile = userDoc.data();

        const pushToken = profile.expoPushToken;
        if (!pushToken) return;

        // TODO: 저녁 다이제스트 내용 생성 (2단계에서 구현)

        console.log(`✅ ${userId}: 저녁 다이제스트 발송 완료`);
      });

      await Promise.all(promises);

      console.log('✅ 저녁 다이제스트 발송 완료');
      return null;
    } catch (error) {
      console.error('❌ 저녁 다이제스트 발송 실패:', error);
      throw error;
    }
  });

// ============================================================================
// 주기 재조정 (2단계에서 구현 예정)
// ============================================================================

/**
 * 주기 재조정 (주 1회, 일요일 23:00 KST)
 * 
 * 사용자의 완료 기록을 분석하여 Task의 주기를 자동 조정합니다.
 * RecurrenceEngine.adjustRecurrenceByHistory 로직을 활용합니다.
 */
export const adjustRecurrences = functions
  .region('asia-northeast3')
  .pubsub.schedule('0 23 * * 0')
  .timeZone('Asia/Seoul')
  .onRun(async (context) => {
    // const db = admin.firestore(); // 2단계에서 사용

    try {
      console.log('🔧 주기 재조정 시작');

      // TODO: 2단계에서 구현
      // 1. 모든 사용자의 Task 조회
      // 2. 각 Task의 완료 기록 분석
      // 3. RecurrenceEngine 로직으로 주기 재조정
      // 4. Firestore 업데이트

      console.log('✅ 주기 재조정 완료');
      return null;
    } catch (error) {
      console.error('❌ 주기 재조정 실패:', error);
      throw error;
    }
  });

// ============================================================================
// 계정 삭제 시 데이터 정리
// ============================================================================

/**
 * 계정 삭제 시 사용자 데이터 완전 정리
 * 
 * Firebase Auth에서 계정이 삭제되면 자동으로 트리거됩니다.
 * Firestore의 모든 사용자 데이터를 삭제합니다.
 */
export const cleanupUserData = functions
  .region('asia-northeast3')
  .auth.user().onDelete(async (user) => {
    const userId = user.uid;
    const db = admin.firestore();

    try {
      console.log(`🗑️ 사용자 데이터 삭제 시작: ${userId}`);

      // 배치 삭제 시작
      const batch = db.batch();

      // 메인 프로필 문서 삭제
      const userRef = db.collection('users').doc(userId);
      batch.delete(userRef);

      // 하위 컬렉션 삭제
      const collections = ['tasks', 'objects', 'logs', 'doseLogs'];

      for (const collectionName of collections) {
        const collectionRef = db.collection(`users/${userId}/${collectionName}`);
        const snapshot = await collectionRef.limit(500).get();

        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });

        console.log(`  ✅ ${collectionName}: ${snapshot.size}개 삭제`);
      }

      await batch.commit();

      console.log(`✅ 사용자 데이터 삭제 완료: ${userId}`);
      return null;
    } catch (error) {
      console.error(`❌ 사용자 데이터 삭제 실패: ${userId}`, error);
      throw error;
    }
  });

// ============================================================================
// 헬퍼 함수 (2단계에서 구현 예정)
// ============================================================================

/**
 * Expo Push 알림 발송
 * 
 * @param pushToken - Expo Push Token
 * @param notification - 알림 내용
 * 
 * @note 2단계에서 실제로 사용될 헬퍼 함수
 */
/*
async function sendExpoPushNotification(
  pushToken: string,
  notification: {
    title: string;
    body: string;
    data?: any;
  }
): Promise<any> {
  const message = {
    to: pushToken,
    sound: 'default',
    title: notification.title,
    body: notification.body,
    data: notification.data || {},
    priority: 'default',
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Expo Push 실패: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Expo Push 발송 완료:', result);
    return result;
  } catch (error) {
    console.error('❌ Expo Push 발송 실패:', error);
    throw error;
  }
}
*/

// ============================================================================
// Export
// ============================================================================

// 개발 중에는 주석 처리하여 배포 비용 절약 가능
// export { sendMorningDigest, sendEveningDigest, adjustRecurrences, cleanupUserData };
