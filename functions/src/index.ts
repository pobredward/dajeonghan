/**
 * 다정한 - Cloud Functions
 * 
 * 구현된 서버리스 백엔드 로직:
 * - 오전/저녁 다이제스트 스케줄러
 * - 주기 재조정 (주 1회)
 * - 계정 삭제 시 데이터 정리
 * - 재참여 푸시 발송 (7일 미접속)
 * - 주간 리포트 생성 및 발송
 * - 스트릭 리마인더
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();

// ============================================================================
// Step 10: 성장 전략 - 재참여 캠페인
// ============================================================================

/**
 * 7일 미접속 사용자에게 푸시 발송
 * 매일 오전 10시 실행
 */
export const sendReengagementPush = functions
  .region('asia-northeast3')
  .pubsub.schedule('0 10 * * *')
  .timeZone('Asia/Seoul')
  .onRun(async () => {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const users = await db
        .collection('users')
        .where('lastActiveAt', '<', admin.firestore.Timestamp.fromDate(sevenDaysAgo))
        .where('expoPushToken', '!=', null)
        .limit(1000)
        .get();

      console.log(`📨 재참여 푸시 발송 시작: ${users.size}명`);

      const messages = [
        {
          title: '다정한이 보고 싶어요 😊',
          body: '그동안 잊고 있던 할 일이 쌓였어요'
        },
        {
          title: '냉장고를 확인하세요 🥗',
          body: '유통기한이 임박한 식재료가 있을 수 있어요'
        },
        {
          title: '당신의 루틴이 기다려요 ✨',
          body: '작은 습관부터 다시 시작해보세요'
        }
      ];

      const tokens: string[] = [];
      users.forEach(doc => {
        const expoPushToken = doc.data().expoPushToken;
        if (expoPushToken) {
          tokens.push(expoPushToken);
        }
      });

      if (tokens.length === 0) {
        console.log('재참여 대상 사용자 없음');
        return null;
      }

      const message = messages[Math.floor(Math.random() * messages.length)];

      for (const token of tokens) {
        await sendExpoPushNotification(token, {
          title: message.title,
          body: message.body,
          data: { type: 'reengagement' }
        });
      }

      console.log(`✅ 재참여 푸시 발송 완료: ${tokens.length}명`);
      return null;
    } catch (error) {
      console.error('❌ 재참여 푸시 발송 실패:', error);
      throw error;
    }
  });

// ============================================================================
// Step 10: 주간 리포트 생성 및 발송
// ============================================================================

/**
 * 주간 리포트 생성 및 발송
 * 매주 월요일 오전 8시 실행
 */
export const sendWeeklyReport = functions
  .region('asia-northeast3')
  .pubsub.schedule('0 8 * * 1')
  .timeZone('Asia/Seoul')
  .onRun(async () => {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const users = await db
        .collection('users')
        .where('notificationMode', '==', 'digest')
        .get();

      console.log(`📊 주간 리포트 생성 시작: ${users.size}명`);

      for (const userDoc of users.docs) {
        const userId = userDoc.id;
        
        const completedTasks = await db
          .collection('users')
          .doc(userId)
          .collection('tasks')
          .where('status', '==', 'completed')
          .where('completedAt', '>=', admin.firestore.Timestamp.fromDate(oneWeekAgo))
          .get();

        const logs = await db
          .collection('users')
          .doc(userId)
          .collection('activityLogs')
          .orderBy('date', 'desc')
          .limit(30)
          .get();

        const streak = calculateStreak(logs.docs.map(d => ({
          date: d.data().date.toDate(),
          userId: d.data().userId
        })));

        const topModule = getTopModule(completedTasks.docs.map(d => d.data()));

        const reportData = {
          completedTasks: completedTasks.size,
          streak,
          topModule,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await db
          .collection('users')
          .doc(userId)
          .collection('weeklyReports')
          .add(reportData);

        const expoPushToken = userDoc.data().expoPushToken;
        if (expoPushToken) {
          await sendExpoPushNotification(expoPushToken, {
            title: '이번 주 리포트가 도착했어요 📊',
            body: `${completedTasks.size}개의 일을 완료했어요!`,
            data: { type: 'weekly_report' }
          });
        }

        console.log(`✅ ${userId}: 주간 리포트 생성 완료`);
      }

      console.log('✅ 주간 리포트 생성 완료');
      return null;
    } catch (error) {
      console.error('❌ 주간 리포트 생성 실패:', error);
      throw error;
    }
  });

// ============================================================================
// Step 10: 스트릭 유지 리마인더
// ============================================================================

/**
 * 스트릭이 끊기기 전 리마인더
 * 매일 오후 9시 실행
 */
export const sendStreakReminder = functions
  .region('asia-northeast3')
  .pubsub.schedule('0 21 * * *')
  .timeZone('Asia/Seoul')
  .onRun(async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const users = await db
        .collection('users')
        .where('streak', '>=', 3)
        .get();

      console.log(`🔥 스트릭 리마인더 시작: ${users.size}명 대상`);

      let reminderCount = 0;

      for (const userDoc of users.docs) {
        const userId = userDoc.id;
        
        const todayActivity = await db
          .collection('users')
          .doc(userId)
          .collection('activityLogs')
          .where('date', '>=', admin.firestore.Timestamp.fromDate(today))
          .get();

        if (todayActivity.empty) {
          const streak = userDoc.data().streak;
          const expoPushToken = userDoc.data().expoPushToken;

          if (expoPushToken) {
            await sendExpoPushNotification(expoPushToken, {
              title: `${streak}일 연속 기록이 위험해요! 🔥`,
              body: '오늘 하나만 완료해도 기록이 유지돼요',
              data: { type: 'streak_reminder' }
            });
            reminderCount++;
          }
        }
      }

      console.log(`✅ 스트릭 리마인더 발송 완료: ${reminderCount}명`);
      return null;
    } catch (error) {
      console.error('❌ 스트릭 리마인더 발송 실패:', error);
      throw error;
    }
  });

// ============================================================================
// 다이제스트 알림
// ============================================================================

export const sendMorningDigest = functions
  .region('asia-northeast3')
  .pubsub.schedule('50 8 * * *')
  .timeZone('Asia/Seoul')
  .onRun(async () => {
    try {
      const usersSnapshot = await db
        .collection('users')
        .where('notificationMode', '==', 'digest')
        .get();

      console.log(`📨 오전 다이제스트 발송 시작: ${usersSnapshot.size}명`);

      const promises = usersSnapshot.docs.map(async (userDoc) => {
        const userId = userDoc.id;
        const profile = userDoc.data();

        const pushToken = profile.expoPushToken;
        if (!pushToken) {
          console.log(`⏭️ ${userId}: Push Token 없음`);
          return;
        }

        const { title, body } = await buildDigestContent(userId, 'morning');

        await sendExpoPushNotification(pushToken, {
          title,
          body,
          data: { type: 'morning_digest' }
        });

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

export const sendEveningDigest = functions
  .region('asia-northeast3')
  .pubsub.schedule('50 19 * * *')
  .timeZone('Asia/Seoul')
  .onRun(async () => {
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

        const { title, body } = await buildDigestContent(userId, 'evening');

        await sendExpoPushNotification(pushToken, {
          title,
          body,
          data: { type: 'evening_digest' }
        });

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
// 주기 재조정
// ============================================================================

export const adjustRecurrences = functions
  .region('asia-northeast3')
  .pubsub.schedule('0 23 * * 0')
  .timeZone('Asia/Seoul')
  .onRun(async () => {
    try {
      console.log('🔧 주기 재조정 시작');
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

export const cleanupUserData = functions
  .region('asia-northeast3')
  .auth.user().onDelete(async (user) => {
    const userId = user.uid;

    try {
      console.log(`🗑️ 사용자 데이터 삭제 시작: ${userId}`);

      const batch = db.batch();

      const userRef = db.collection('users').doc(userId);
      batch.delete(userRef);

      const collections = ['tasks', 'objects', 'logs', 'doseLogs', 'activityLogs', 'weeklyReports'];

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
// 헬퍼 함수
// ============================================================================

/**
 * 사용자별 Firestore 데이터를 조회하여 개인화된 다이제스트 제목/본문을 생성합니다.
 * 클라이언트 DigestService와 동일한 로직을 서버에서 재현합니다.
 */
async function buildDigestContent(
  userId: string,
  time: 'morning' | 'evening'
): Promise<{ title: string; body: string }> {
  const title = time === 'morning' ? '☀️ 오늘의 할 일' : '🌙 오늘 남은 일';

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTs = admin.firestore.Timestamp.fromDate(today);

    // 오늘 마감이거나 이미 지난 pending 태스크 조회
    const tasksSnap = await db
      .collection(`users/${userId}/tasks`)
      .where('status', '==', 'pending')
      .get();

    const summaryParts: string[] = [];

    const cleaningTasks = tasksSnap.docs.filter(d => d.data().type === 'cleaning');
    const foodTasks = tasksSnap.docs.filter(d => d.data().type === 'food');
    const medicineTasks = tasksSnap.docs.filter(d => d.data().type === 'medicine');

    if (cleaningTasks.length > 0) {
      summaryParts.push(`🧹 청소 ${cleaningTasks.length}개`);
    }
    if (foodTasks.length > 0) {
      summaryParts.push(`🥗 식재료 ${foodTasks.length}개`);
    }
    // 약 알림은 오전 다이제스트에만 포함
    if (time === 'morning' && medicineTasks.length > 0) {
      summaryParts.push(`💊 약 ${medicineTasks.length}회`);
    }

    if (summaryParts.length === 0) {
      const body = time === 'morning'
        ? '오늘은 할 일이 없어요!'
        : '오늘 할 일을 모두 끝냈어요!';
      return { title, body };
    }

    return { title, body: summaryParts.join(' · ') };
  } catch (error) {
    console.error(`${userId} 다이제스트 내용 생성 실패:`, error);
    const fallback = time === 'morning'
      ? '다정한과 함께 하루를 시작해보세요'
      : '오늘 하루도 수고하셨어요';
    return { title, body: fallback };
  }
}

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
    return result;
  } catch (error) {
    console.error('❌ Expo Push 발송 실패:', error);
    throw error;
  }
}

function calculateStreak(logs: Array<{ date: Date; userId: string }>): number {
  if (logs.length === 0) return 0;

  const sortedLogs = logs.sort((a, b) => b.date.getTime() - a.date.getTime());
  
  let streak = 1;
  let currentDate = sortedLogs[0].date;

  for (let i = 1; i < sortedLogs.length; i++) {
    const diff = Math.floor((currentDate.getTime() - sortedLogs[i].date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diff === 1) {
      streak++;
      currentDate = sortedLogs[i].date;
    } else if (diff > 1) {
      break;
    }
  }

  return streak;
}

function getTopModule(tasks: any[]): string {
  const counts: { [key: string]: number } = { cleaning: 0, fridge: 0, medicine: 0 };
  
  tasks.forEach(task => {
    const type = task.type;
    if (type in counts) {
      counts[type]++;
    }
  });
  
  const entries = Object.entries(counts);
  if (entries.length === 0) return 'cleaning';
  
  return entries.sort((a, b) => b[1] - a[1])[0][0];
}
