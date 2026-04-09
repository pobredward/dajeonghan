# Step 10. Firebase 설정

> **🎯 목표**: Firebase 서비스를 프로덕션 환경에 맞게 설정하고 보안 규칙 구축

## 📌 단계 정보

**순서**: Step 10/13  
**Phase**: Phase 4 - 인프라 (Infrastructure)  
**의존성**: Step 09 완료 권장  
**예상 소요 시간**: 1일  
**난이도**: ⭐⭐⭐

### 이전 단계 요구사항
- ✅ Step 09 완료: UI/UX (전체 앱 플로우 테스트 가능)
- ✅ Step 01~08 완료: 모든 기능 (Security Rules 작성 위해)

### 다음 단계
- **Step 11**: 개인정보 및 법적 준수

### 이 단계가 필요한 이유
- 프로덕션 배포 전 필수
- 데이터 보안
- 멀티 디바이스 동기화

---

## 📋 완료 기준

이 단계를 완료하면:
- ✅ Firestore Security Rules 프로덕션 배포
- ✅ Firestore 인덱스 생성 완료
- ✅ 익명 인증 + 계정 연결 작동
- ✅ 오프라인 지속성 활성화
- ✅ Firebase Emulator로 로컬 테스트 가능

**예상 소요 시간**: 1일

---

## 🔥 핵심 개념

### Firebase의 역할

다정한은 Firebase를 "서버리스 백엔드"로 사용합니다:

```
[다정한 앱]
    ↓
[Firebase SDK]
    ↓
┌─────────────────────┐
│  Firebase Services  │
├─────────────────────┤
│ • Authentication    │ ← 사용자 인증
│ • Firestore         │ ← 데이터 저장
│ • Cloud Functions   │ ← 서버 로직 (2단계)
│ • Cloud Messaging   │ ← 푸시 알림 (2단계)
└─────────────────────┘
```

### 주요 서비스

1. **Authentication**: 익명 인증 → 나중에 이메일 연결
2. **Firestore**: 오프라인 우선 NoSQL 데이터베이스
3. **Security Rules**: 사용자별 데이터 접근 제어
4. **Cloud Functions**: 다이제스트 스케줄러 (2단계)
5. **Cloud Storage**: 이미지 저장 (2단계)

---

## Firestore Security Rules

`firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // 사용자는 자신의 데이터만 접근
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }

    // 익명 사용자도 자신의 데이터 접근 가능
    function isAuthenticated() {
      return request.auth != null;
    }

    // Users 컬렉션
    match /users/{userId} {
      allow read, write: if isOwner(userId);

      // 하위 컬렉션
      match /tasks/{taskId} {
        allow read, write: if isOwner(userId);
      }

      match /objects/{objectId} {
        allow read, write: if isOwner(userId);
      }

      match /logs/{logId} {
        allow read, write: if isOwner(userId);
      }
    }

    // Templates (읽기 전용, 모두 접근 가능)
    match /templates/{templateId} {
      allow read: if true;
      allow write: if false; // 관리자만 수정 (Admin SDK)
    }

    // Shared (가족/룸메 공유, 2단계)
    match /shared/{sharedId} {
      allow read: if isAuthenticated() && 
        request.auth.uid in resource.data.members;
      allow write: if isAuthenticated() &&
        request.auth.uid in resource.data.members;
    }

    // Digests (Cloud Functions가 생성)
    match /digests/{userId} {
      allow read: if isOwner(userId);
      allow write: if false; // Functions만 쓰기
    }

    // 기본: 모든 접근 거부
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Firestore 인덱스

`firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "tasks",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "recurrence.nextDue", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "tasks",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "type", "order": "ASCENDING" },
        { "fieldPath": "priority", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "objects",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "type", "order": "ASCENDING" },
        { "fieldPath": "metadata.recommendedConsumption", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "logs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

## Authentication 설정

`src/services/authService.ts`:

```typescript
import { 
  signInAnonymously, 
  linkWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
  User
} from 'firebase/auth';
import { auth } from './firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

export class AuthService {
  /**
   * 익명 로그인 (온보딩 시작)
   */
  static async signInAnonymously(): Promise<User> {
    const userCredential = await signInAnonymously(auth);
    return userCredential.user;
  }

  /**
   * 이메일로 계정 연결
   */
  static async linkWithEmail(email: string, password: string): Promise<User> {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('No user logged in');
    }

    if (!currentUser.isAnonymous) {
      throw new Error('User is already linked');
    }

    const credential = EmailAuthProvider.credential(email, password);
    const userCredential = await linkWithCredential(currentUser, credential);

    // 이메일 연결 완료 로그
    await this.logAccountLink(userCredential.user.uid, 'email');

    return userCredential.user;
  }

  /**
   * Google로 계정 연결
   */
  static async linkWithGoogle(): Promise<User> {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('No user logged in');
    }

    if (!currentUser.isAnonymous) {
      throw new Error('User is already linked');
    }

    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential) {
      const userCredential = await linkWithCredential(currentUser, credential);
      await this.logAccountLink(userCredential.user.uid, 'google');
      return userCredential.user;
    }

    throw new Error('Failed to link with Google');
  }

  /**
   * 로그아웃
   */
  static async signOut(): Promise<void> {
    await auth.signOut();
  }

  /**
   * 현재 사용자
   */
  static getCurrentUser(): User | null {
    return auth.currentUser;
  }

  /**
   * 계정 연결 로그
   */
  private static async logAccountLink(userId: string, method: string): Promise<void> {
    const logRef = doc(db, `users/${userId}/logs/account_link`);
    await setDoc(logRef, {
      method,
      timestamp: new Date(),
      previouslyAnonymous: true
    });
  }

  /**
   * 계정 삭제 (GDPR 준수)
   */
  static async deleteAccount(): Promise<void> {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('No user logged in');
    }

    const userId = currentUser.uid;

    // 1. Firestore 데이터 삭제
    await this.deleteUserData(userId);

    // 2. Auth 계정 삭제
    await currentUser.delete();
  }

  /**
   * 사용자 데이터 완전 삭제
   */
  private static async deleteUserData(userId: string): Promise<void> {
    // Firestore에서 사용자 데이터 삭제
    // 실제로는 Cloud Functions에서 처리하는 것이 더 안전
    const batch = db.batch();

    // 하위 컬렉션은 재귀적으로 삭제 필요
    // 여기서는 메인 문서만 삭제
    const userRef = doc(db, `users/${userId}`);
    batch.delete(userRef);

    await batch.commit();
  }
}
```

## Firestore 서비스 확장

`src/services/firestoreService.ts`:

```typescript
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  enableIndexedDbPersistence
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Task } from '@/types/task.types';
import { UserProfile } from '@/types/user.types';

// 오프라인 지속성 활성화
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
  } else if (err.code === 'unimplemented') {
    console.warn('The current browser does not support offline persistence');
  }
});

export class FirestoreService {
  /**
   * 사용자 프로필 저장
   */
  static async saveUserProfile(profile: UserProfile): Promise<void> {
    const userRef = doc(db, `users/${profile.userId}`);
    await setDoc(userRef, {
      ...profile,
      createdAt: Timestamp.fromDate(profile.createdAt),
      updatedAt: Timestamp.fromDate(profile.updatedAt)
    });
  }

  /**
   * 사용자 프로필 조회
   */
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    const userRef = doc(db, `users/${userId}`);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return null;

    const data = userSnap.data();
    return {
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate()
    } as UserProfile;
  }

  /**
   * 테스크 목록 조회 (오늘 할 일)
   */
  static async getTodayTasks(userId: string): Promise<Task[]> {
    const tasksRef = collection(db, `users/${userId}/tasks`);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const q = query(
      tasksRef,
      where('status', '==', 'pending'),
      where('recurrence.nextDue', '<=', Timestamp.fromDate(today)),
      orderBy('recurrence.nextDue', 'asc')
    );

    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      recurrence: {
        ...doc.data().recurrence,
        nextDue: doc.data().recurrence.nextDue.toDate(),
        lastCompleted: doc.data().recurrence.lastCompleted?.toDate()
      },
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate()
    })) as Task[];
  }

  /**
   * 테스크 저장/업데이트
   */
  static async saveTask(userId: string, task: Task): Promise<void> {
    const taskRef = doc(db, `users/${userId}/tasks/${task.id}`);
    
    await setDoc(taskRef, {
      ...task,
      recurrence: {
        ...task.recurrence,
        nextDue: Timestamp.fromDate(task.recurrence.nextDue),
        lastCompleted: task.recurrence.lastCompleted 
          ? Timestamp.fromDate(task.recurrence.lastCompleted)
          : null
      },
      completionHistory: task.completionHistory.map(h => ({
        ...h,
        date: Timestamp.fromDate(h.date)
      })),
      createdAt: Timestamp.fromDate(task.createdAt),
      updatedAt: Timestamp.fromDate(task.updatedAt)
    });
  }

  /**
   * 테스크 삭제
   */
  static async deleteTask(userId: string, taskId: string): Promise<void> {
    const taskRef = doc(db, `users/${userId}/tasks/${taskId}`);
    await deleteDoc(taskRef);
  }

  /**
   * 배치 쓰기 (여러 테스크 한 번에)
   */
  static async saveTasks(userId: string, tasks: Task[]): Promise<void> {
    const promises = tasks.map(task => this.saveTask(userId, task));
    await Promise.all(promises);
  }
}
```

## Cloud Functions (2단계)

`functions/package.json`:

```json
{
  "name": "dajeonghan-functions",
  "version": "1.0.0",
  "engines": {
    "node": "18"
  },
  "scripts": {
    "build": "tsc",
    "serve": "npm run build && firebase emulators:start --only functions",
    "deploy": "firebase deploy --only functions"
  },
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^4.5.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

`functions/src/index.ts`:

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

/**
 * 오전 다이제스트 발송 (매일 08:50 KST)
 */
export const sendMorningDigest = functions
  .region('asia-northeast3') // 서울 리전
  .pubsub.schedule('50 8 * * *')
  .timeZone('Asia/Seoul')
  .onRun(async (context) => {
    const db = admin.firestore();
    
    // 다이제스트 모드 사용자 조회
    const usersSnapshot = await db
      .collection('users')
      .where('notificationMode', '==', 'digest')
      .get();

    const promises = usersSnapshot.docs.map(async (userDoc) => {
      const userId = userDoc.id;
      const profile = userDoc.data();

      // Expo Push Token 확인
      const pushToken = profile.expoPushToken;
      if (!pushToken) return;

      // 다이제스트 내용 조회
      const digestDoc = await db
        .collection('digests')
        .doc(userId)
        .get();

      if (!digestDoc.exists) return;

      const digest = digestDoc.data()?.morning;
      if (!digest) return;

      // Expo Push 발송
      await sendExpoPushNotification(pushToken, {
        title: digest.title,
        body: digest.body,
        data: { type: 'digest', time: 'morning' }
      });

      // 발송 로그
      await db.collection('notification_logs').add({
        userId,
        type: 'morning_digest',
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        success: true
      });
    });

    await Promise.all(promises);
    
    console.log(`Sent morning digest to ${promises.length} users`);
  });

/**
 * 저녁 다이제스트 발송 (매일 19:50 KST)
 */
export const sendEveningDigest = functions
  .region('asia-northeast3')
  .pubsub.schedule('50 19 * * *')
  .timeZone('Asia/Seoul')
  .onRun(async (context) => {
    // sendMorningDigest와 유사, evening 다이제스트 발송
    // 코드 생략 (구조 동일)
  });

/**
 * 주기 재조정 (주 1회, 일요일 23:00)
 */
export const adjustRecurrences = functions
  .region('asia-northeast3')
  .pubsub.schedule('0 23 * * 0')
  .timeZone('Asia/Seoul')
  .onRun(async (context) => {
    const db = admin.firestore();
    
    // 모든 사용자의 테스크 조회 및 주기 재조정
    // RecurrenceEngine.adjustRecurrenceByHistory 로직 활용
    
    console.log('Recurrence adjustment completed');
  });

/**
 * 계정 삭제 시 데이터 정리
 */
export const cleanupUserData = functions
  .region('asia-northeast3')
  .auth.user().onDelete(async (user) => {
    const userId = user.uid;
    const db = admin.firestore();

    // 사용자 데이터 삭제
    const batch = db.batch();
    
    const userRef = db.collection('users').doc(userId);
    batch.delete(userRef);

    // 하위 컬렉션 삭제
    const collections = ['tasks', 'objects', 'logs'];
    
    for (const collectionName of collections) {
      const snapshot = await db
        .collection(`users/${userId}/${collectionName}`)
        .get();
      
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
    }

    await batch.commit();
    
    console.log(`Cleaned up data for user ${userId}`);
  });

/**
 * Expo Push 발송 헬퍼
 */
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
    priority: 'default'
  };

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(message)
  });

  if (!response.ok) {
    throw new Error(`Failed to send push notification: ${response.statusText}`);
  }

  return response.json();
}
```

## Firebase 배포

`firebase.json`:

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": {
    "source": "functions",
    "predeploy": [
      "npm --prefix \"$RESOURCE_DIR\" run build"
    ]
  },
  "storage": {
    "rules": "storage.rules"
  },
  "emulators": {
    "auth": {
      "port": 9099
    },
    "firestore": {
      "port": 8080
    },
    "functions": {
      "port": 5001
    },
    "storage": {
      "port": 9199
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

## 배포 명령어

```bash
# Firestore Rules 배포
firebase deploy --only firestore:rules

# Firestore Indexes 배포
firebase deploy --only firestore:indexes

# Cloud Functions 배포
firebase deploy --only functions

# 전체 배포
firebase deploy

# 로컬 에뮬레이터 실행
firebase emulators:start
```

## 환경 변수 설정 (Cloud Functions)

```bash
# Firebase 프로젝트 선택
firebase use production

# 환경 변수 설정
firebase functions:config:set expo.push.url="https://exp.host/--/api/v2/push/send"

# 확인
firebase functions:config:get
```

## 다음 단계
- 10-ui-ux.md: UI/UX 구현
- 홈 화면, 네비게이션, 공통 컴포넌트
