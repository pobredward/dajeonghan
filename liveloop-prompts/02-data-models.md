# 02. 데이터 모델 설계

## 목표
리브루프의 핵심 데이터 구조를 TypeScript 타입과 Firestore 컬렉션으로 설계합니다.

## 핵심 원칙
- **생활 객체 중심**: 테스크는 물건·공간·사람과 연결
- **주기 자동화**: 완료 시 다음 due를 자동 계산
- **개인화**: 실행 이력 기반 주기 조정
- **오프라인 우선**: 로컬 데이터 + 동기화

## TypeScript 타입 정의

### 1. 기본 공통 타입 (`src/types/common.types.ts`)

```typescript
export type ModuleType = 'cleaning' | 'food' | 'medicine';

export type RecurrenceType = 'fixed' | 'flexible';

export type RecurrenceUnit = 'day' | 'week' | 'month';

export type PriorityLevel = 'urgent' | 'high' | 'medium' | 'low';

export type TaskStatus = 'pending' | 'completed' | 'postponed';

export type NotificationTiming = 'immediate' | 'digest' | 'silent';

export interface Recurrence {
  type: RecurrenceType;
  interval: number;
  unit: RecurrenceUnit;
  nextDue: Date;
  lastCompleted?: Date;
}

export interface NotificationSettings {
  enabled: boolean;
  timing: NotificationTiming;
  advanceHours: number[]; // 예: [24, 3] = 24시간 전, 3시간 전
}

export interface CompletionHistory {
  date: Date;
  postponed: boolean;
  actualInterval?: number; // 이전 완료부터 경과 일수
}
```

### 2. 생활 객체 타입 (`src/types/task.types.ts`)

```typescript
import { ModuleType } from './common.types';

export interface LifeObject {
  id: string;
  userId: string;
  type: ModuleType;
  name: string;
  metadata: CleaningMetadata | FoodMetadata | MedicineMetadata;
  createdAt: Date;
  updatedAt: Date;
}

// 청소 메타데이터
export interface CleaningMetadata {
  room: string; // '거실', '침실', '화장실', '주방'
  difficulty: 1 | 2 | 3 | 4 | 5;
  healthPriority: boolean; // 화장실/주방은 true
}

// 식재료 메타데이터
export interface FoodMetadata {
  category: '채소' | '과일' | '육류' | '해산물' | '유제품' | '조미료' | '기타';
  purchaseDate: Date;
  expiryDate?: Date; // 라벨 날짜
  expiryType?: 'sell_by' | 'consume_by'; // 유통기한 vs 소비기한
  storageCondition: '냉장' | '냉동' | '실온';
  storageType: '밀폐용기' | '비닐' | '원래포장';
  state: '통' | '손질' | '조리';
  recommendedConsumption?: Date; // 자동 계산된 권장 소진일
  quantity?: string; // '1개', '500g'
}

// 약 메타데이터
export interface MedicineMetadata {
  type: '처방약' | '일반약' | '영양제';
  dosage: string; // '1정', '1포'
  schedule: {
    frequency: 'daily' | 'specific_days';
    days?: number[]; // [1,3,5] = 월수금
    times: string[]; // ['08:00', '20:00']
    mealTiming: '식전' | '식후' | '무관';
  };
  totalQuantity: number;
  remainingQuantity: number;
  refillThreshold: number; // 7일치 남으면 알림
}
```

### 3. 테스크 타입 (`src/types/task.types.ts`)

```typescript
import {
  ModuleType,
  PriorityLevel,
  TaskStatus,
  Recurrence,
  NotificationSettings,
  CompletionHistory
} from './common.types';

export interface Task {
  id: string;
  userId: string;
  objectId: string; // LifeObject 참조
  title: string;
  description?: string;
  type: ModuleType;
  
  // 주기 관리
  recurrence: Recurrence;
  
  // 우선순위
  priority: PriorityLevel;
  estimatedMinutes: number; // 예상 소요 시간
  
  // 상태
  status: TaskStatus;
  
  // 알림
  notificationSettings: NotificationSettings;
  
  // 이력
  completionHistory: CompletionHistory[];
  
  // 자동 계산 필드
  dirtyScore?: number; // 청소 모듈: 경과일 기반
  urgencyScore?: number; // 우선순위 계산 점수
  
  // 메타
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
```

### 4. 사용자 프로필 타입 (`src/types/user.types.ts`)

```typescript
export type NotificationMode = 'immediate' | 'digest' | 'minimal';

export type PersonaType = 
  | 'student_20s_male'
  | 'student_20s_female'
  | 'worker_single'
  | 'worker_roommate'
  | 'newlywed'
  | 'pet_owner'
  | 'custom';

export interface UserEnvironment {
  hasWasher: boolean;
  hasDryer: boolean;
  usesCoinLaundry: boolean;
  cookingFrequency: 'rarely' | 'sometimes' | 'often' | 'daily';
  hasPet: boolean;
  petType?: string;
  householdSize: number;
}

export interface UserProfile {
  userId: string;
  persona: PersonaType;
  environment: UserEnvironment;
  notificationMode: NotificationMode;
  digestTimes: string[]; // ['09:00', '20:00']
  onboardingCompleted: boolean;
  onboardingDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### 5. 로그 타입 (`src/types/task.types.ts`)

```typescript
export interface TaskLog {
  id: string;
  userId: string;
  taskId: string;
  objectId: string;
  action: 'completed' | 'postponed' | 'skipped';
  timestamp: Date;
  note?: string;
  nextDue?: Date; // 완료 시 계산된 다음 due
}

export interface DoseLog {
  id: string;
  userId: string;
  medicineId: string;
  scheduledTime: Date;
  actualTime?: Date;
  taken: boolean;
  note?: string;
}
```

## Firestore 컬렉션 구조

```
/users/{userId}
  - profile: UserProfile
  - settings: { notificationMode, digestTimes, ... }

/users/{userId}/objects/{objectId}
  - LifeObject 데이터
  - 청소/냉장고/약 객체

/users/{userId}/tasks/{taskId}
  - Task 데이터
  - 각 객체에 연결된 테스크

/users/{userId}/logs/{logId}
  - TaskLog 또는 DoseLog
  - 완료/미루기 이력

/templates/{templateId}
  - 공개 템플릿 데이터 (읽기 전용)

/shared/{sharedId}
  - 가족/룸메 공유 데이터 (2단계)
```

## Firestore 인덱스 요구사항

```
컬렉션: tasks
필드: userId (Ascending), nextDue (Ascending), status (Ascending)
용도: 오늘 할 일 쿼리

컬렉션: tasks
필드: userId (Ascending), type (Ascending), priority (Descending)
용도: 모듈별 우선순위 정렬

컬렉션: objects
필드: userId (Ascending), type (Ascending), metadata.recommendedConsumption (Ascending)
용도: 냉장고 임박 식재료
```

## 데이터 변환 유틸리티

`src/services/firestoreService.ts`:

```typescript
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebaseConfig';

// Firestore Timestamp ↔ Date 변환
export const timestampToDate = (timestamp: Timestamp): Date => {
  return timestamp.toDate();
};

export const dateToTimestamp = (date: Date): Timestamp => {
  return Timestamp.fromDate(date);
};

// Task 저장
export const saveTask = async (task: Task): Promise<void> => {
  const taskRef = doc(db, `users/${task.userId}/tasks/${task.id}`);
  
  const firestoreTask = {
    ...task,
    recurrence: {
      ...task.recurrence,
      nextDue: dateToTimestamp(task.recurrence.nextDue),
      lastCompleted: task.recurrence.lastCompleted 
        ? dateToTimestamp(task.recurrence.lastCompleted)
        : null
    },
    completionHistory: task.completionHistory.map(h => ({
      ...h,
      date: dateToTimestamp(h.date)
    })),
    createdAt: dateToTimestamp(task.createdAt),
    updatedAt: dateToTimestamp(task.updatedAt)
  };
  
  await setDoc(taskRef, firestoreTask);
};

// Task 조회
export const getTask = async (userId: string, taskId: string): Promise<Task | null> => {
  const taskRef = doc(db, `users/${userId}/tasks/${taskId}`);
  const taskSnap = await getDoc(taskRef);
  
  if (!taskSnap.exists()) return null;
  
  const data = taskSnap.data();
  
  return {
    ...data,
    recurrence: {
      ...data.recurrence,
      nextDue: timestampToDate(data.recurrence.nextDue),
      lastCompleted: data.recurrence.lastCompleted
        ? timestampToDate(data.recurrence.lastCompleted)
        : undefined
    },
    completionHistory: data.completionHistory.map((h: any) => ({
      ...h,
      date: timestampToDate(h.date)
    })),
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt)
  } as Task;
};
```

## 기본 데이터 검증

`src/types/validation.ts`:

```typescript
import { Task, LifeObject } from './task.types';

export const isValidTask = (task: Partial<Task>): task is Task => {
  return !!(
    task.id &&
    task.userId &&
    task.objectId &&
    task.title &&
    task.type &&
    task.recurrence &&
    task.priority &&
    task.status
  );
};

export const isValidLifeObject = (obj: Partial<LifeObject>): obj is LifeObject => {
  return !!(
    obj.id &&
    obj.userId &&
    obj.type &&
    obj.name &&
    obj.metadata
  );
};
```

## 다음 단계
- 03-core-engine.md: 공통 엔진 구현
- 데이터 모델을 기반으로 주기/미루기/알림 로직 개발
