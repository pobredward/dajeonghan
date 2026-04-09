# 02. 데이터 모델 v2 (공간 기반 아키텍처)

> **🎯 목표**: 공간 중심의 계층적 데이터 구조를 TypeScript 타입과 Firestore 스키마로 완벽하게 설계

## 📋 완료 기준

이 단계를 완료하면:
- ✅ v2 데이터 모델 완성 (HomeLayout → Room → Item → Feature → Task)
- ✅ 모든 TypeScript 타입 정의
- ✅ Firestore 컬렉션 구조 확정
- ✅ 데이터 변환 유틸리티 구현
- ✅ 점수 계산 필드 추가

**예상 소요 시간**: 4-5시간

---

## 🏗️ v1 vs v2 비교

### v1 구조 (flat)
```
User
  └── Task[] (flat list)
```

**문제점**:
- ❌ Task와 물리적 객체의 관계가 불명확
- ❌ 공간 정보 부족
- ❌ 확장성 제한

### v2 구조 (계층적)
```
User
  └── HomeLayout
        └── Room[]
              └── Item[]
                    └── Feature[]
                          └── Task[]
```

**장점**:
- ✅ 현실 세계와 1:1 매핑
- ✅ 공간별 관리 직관적
- ✅ 무한 확장 가능
- ✅ 점수 계산 계층적

---

## 📦 TypeScript 타입 정의

### 1. 공간 관련 타입

`src/types/home-layout.types.ts`:

```typescript
export type HomeType = 
  | 'one_room'      // 원룸
  | 'studio'        // 오픈형 원룸
  | 'two_room'      // 투룸
  | 'apartment'     // 아파트
  | 'custom';       // 커스텀

export type RoomType =
  | 'kitchen'       // 주방
  | 'bathroom'      // 화장실
  | 'living_room'   // 거실
  | 'bedroom'       // 침실
  | 'entrance'      // 현관
  | 'balcony'       // 베란다
  | 'storage'       // 창고
  | 'garage'        // 차고 (차량)
  | 'outdoor'       // 실외 (정원)
  | 'custom';       // 커스텀

export type ItemType =
  // 주방
  | 'fridge' | 'sink' | 'stove' | 'microwave' 
  | 'dishwasher' | 'oven' | 'rice_cooker'
  // 화장실
  | 'toilet' | 'washbasin' | 'shower' | 'bathtub'
  | 'washing_machine' | 'dryer'
  // 거실
  | 'sofa' | 'tv' | 'air_purifier' | 'humidifier'
  // 침실
  | 'bed' | 'closet' | 'desk'
  // 기타
  | 'plant' | 'pet_area' | 'vehicle' 
  | 'custom';

export type FeatureCategory =
  | 'cleaning'      // 청소 주기
  | 'inventory'     // 재고 관리
  | 'maintenance'   // 유지보수
  | 'reminder';     // 일반 알림

export interface HomeLayout {
  id: string;
  userId: string;
  homeType: HomeType;
  totalArea?: number;        // 평수 (선택)
  rooms: Room[];
  overallScore: number;      // 전체 집 점수 (계산값)
  createdAt: Date;
  updatedAt: Date;
}

export interface Room {
  id: string;
  homeLayoutId: string;
  type: RoomType;
  name: string;
  customName?: string;
  position: Position2D;
  size: Size2D;
  color: string;
  imageUrl?: string;         // 방 이미지 (옵션)
  items: RoomItem[];
  score: number;             // 방 점수 (계산값)
  isEnabled: boolean;
  order: number;             // 표시 순서
  createdAt: Date;
  updatedAt: Date;
}

export interface RoomItem {
  id: string;
  roomId: string;
  type: ItemType;
  name: string;
  customName?: string;
  icon: string;
  position: Position2D;      // 방 안에서 상대 위치
  features: ItemFeature[];
  score: number;             // 아이템 점수 (계산값)
  isEnabled: boolean;
  metadata?: Record<string, any>;  // 아이템별 추가 정보
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ItemFeature {
  id: string;
  itemId: string;
  category: FeatureCategory;
  name: string;
  description?: string;
  enabled: boolean;
  config: FeatureConfig;
  taskIds: string[];         // 이 기능이 생성한 Task들
  createdAt: Date;
  updatedAt: Date;
}

export interface FeatureConfig {
  cleaning?: CleaningConfig;
  inventory?: InventoryConfig;
  maintenance?: MaintenanceConfig;
  reminder?: ReminderConfig;
}

export interface CleaningConfig {
  interval: number;
  unit: 'day' | 'week' | 'month';
  estimatedMinutes: number;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  healthPriority?: boolean;
  tools?: string[];          // 필요한 도구
  difficulty?: 1 | 2 | 3 | 4 | 5;
}

export interface InventoryConfig {
  type: 'food' | 'supply' | 'medicine';
  trackExpiry: boolean;
  lowStockAlert: boolean;
  autoReorder?: boolean;
  categories?: string[];
  alertThreshold?: number;   // 재고 알림 기준
}

export interface MaintenanceConfig {
  interval: number;
  unit: 'day' | 'week' | 'month' | 'year';
  estimatedCost?: number;
  professionalRequired?: boolean;
  vendor?: string;           // 업체 정보
  lastServiceDate?: Date;
}

export interface ReminderConfig {
  interval: number;
  unit: 'day' | 'week' | 'month';
  message: string;
  customTime?: string;       // HH:mm
}

// 유틸리티 타입
export interface Position2D {
  x: number;
  y: number;
}

export interface Size2D {
  width: number;
  height: number;
}
```

---

### 2. Task 타입 (v2 업데이트)

`src/types/task.types.ts`:

```typescript
import { ModuleType, PriorityLevel, TaskStatus } from './common.types';

// v2: Task는 ItemFeature와 연결됨
export interface Task {
  id: string;
  userId: string;
  
  // v2: 공간 기반 연결
  itemId: string;            // 어떤 아이템의 Task인지
  featureId?: string;        // 어떤 기능에서 생성됐는지 (옵션)
  roomId: string;            // 어떤 방의 Task인지
  
  title: string;
  description?: string;
  type: ModuleType;          // 'cleaning' | 'food' | 'medicine'
  
  // 주기 관리
  recurrence: Recurrence;
  
  // 우선순위
  priority: PriorityLevel;
  estimatedMinutes: number;
  
  // 상태
  status: TaskStatus;
  
  // 알림
  notificationSettings: NotificationSettings;
  
  // 이력
  completionHistory: CompletionHistory[];
  
  // v2: 점수 영향도
  scoreImpact: number;       // 완료 시 올라갈 점수 (1-20)
  
  // 메타
  tags?: string[];           // 태그 (검색용)
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// 기존 타입 유지 (v1 호환)
export interface Recurrence {
  type: 'fixed' | 'flexible';
  interval: number;
  unit: 'day' | 'week' | 'month';
  nextDue: Date;
  lastCompleted?: Date;
}

export interface NotificationSettings {
  enabled: boolean;
  timing: 'immediate' | 'digest' | 'silent';
  advanceHours: number[];
}

export interface CompletionHistory {
  date: Date;
  postponed: boolean;
  actualInterval?: number;
  scoreGained?: number;      // v2: 획득한 점수
}
```

---

## 🗄️ Firestore 스키마 v2

### 컬렉션 구조

```
/users/{userId}
  - profile: UserProfile
  - settings: UserSettings
  
  /homeLayout/{layoutId}  🆕
    - HomeLayout 데이터
    
    /rooms/{roomId}  🆕
      - Room 데이터
      
      /items/{itemId}  🆕
        - RoomItem 데이터
        
        /features/{featureId}  🆕
          - ItemFeature 데이터

  /tasks/{taskId}
    - Task 데이터 (v2: itemId, roomId 추가)

  /logs/{logId}
    - TaskLog (완료/미루기 이력)

  /inventories/{inventoryId}  🆕
    - 재고 데이터 (식재료, 생필품 등)

/presets/  🆕
  /items/{presetId}
    - ItemPreset (공개 프리셋)
  
  /foods/{foodId}
    - FoodPreset (식재료 300+)

/templates/{templateId}
  - 온보딩 템플릿 (기존)
```

### 주요 인덱스

```javascript
// tasks 컬렉션
{
  collection: 'tasks',
  fields: [
    { field: 'userId', order: 'ascending' },
    { field: 'roomId', order: 'ascending' },  // 🆕
    { field: 'nextDue', order: 'ascending' }
  ]
}

{
  collection: 'tasks',
  fields: [
    { field: 'userId', order: 'ascending' },
    { field: 'itemId', order: 'ascending' },  // 🆕
    { field: 'status', order: 'ascending' }
  ]
}

// items 컬렉션 (하위 컬렉션)
{
  collection: 'items',
  fields: [
    { field: 'roomId', order: 'ascending' },
    { field: 'score', order: 'ascending' },   // 🆕
    { field: 'isEnabled', order: 'ascending' }
  ]
}
```

---

## 🔄 데이터 변환 유틸리티

`src/utils/firestoreConverters.ts`:

```typescript
import { Timestamp } from 'firebase/firestore';
import { HomeLayout, Room, RoomItem } from '@/types/home-layout.types';

/**
 * HomeLayout Firestore Converter
 */
export const homeLayoutConverter = {
  toFirestore: (layout: HomeLayout) => {
    return {
      ...layout,
      createdAt: Timestamp.fromDate(layout.createdAt),
      updatedAt: Timestamp.fromDate(layout.updatedAt),
      rooms: layout.rooms.map(room => ({
        ...room,
        createdAt: Timestamp.fromDate(room.createdAt),
        updatedAt: Timestamp.fromDate(room.updatedAt),
        items: room.items.map(item => ({
          ...item,
          createdAt: Timestamp.fromDate(item.createdAt),
          updatedAt: Timestamp.fromDate(item.updatedAt)
        }))
      }))
    };
  },
  
  fromFirestore: (snapshot: any): HomeLayout => {
    const data = snapshot.data();
    return {
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
      rooms: data.rooms.map((room: any) => ({
        ...room,
        createdAt: room.createdAt.toDate(),
        updatedAt: room.updatedAt.toDate(),
        items: room.items.map((item: any) => ({
          ...item,
          createdAt: item.createdAt.toDate(),
          updatedAt: item.updatedAt.toDate()
        }))
      }))
    };
  }
};

/**
 * Task v2 Converter (itemId, roomId 추가)
 */
export const taskV2Converter = {
  toFirestore: (task: Task) => {
    return {
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
    };
  },
  
  fromFirestore: (snapshot: any): Task => {
    const data = snapshot.data();
    return {
      ...data,
      recurrence: {
        ...data.recurrence,
        nextDue: data.recurrence.nextDue.toDate(),
        lastCompleted: data.recurrence.lastCompleted?.toDate()
      },
      completionHistory: data.completionHistory.map((h: any) => ({
        ...h,
        date: h.date.toDate()
      })),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate()
    };
  }
};
```

---

## 🔢 점수 계산 필드

### ScoreMetadata 인터페이스

```typescript
// src/types/score.types.ts

export interface ScoreMetadata {
  score: number;                    // 현재 점수 (0-100)
  previousScore?: number;           // 이전 점수
  lastUpdated: Date;                // 마지막 업데이트
  trend: 'improving' | 'stable' | 'declining';  // 추세
}

export interface RoomScoreDetails extends ScoreMetadata {
  roomId: string;
  itemScores: {
    itemId: string;
    score: number;
    weight: number;             // 가중치 (중요도)
  }[];
  pendingTaskCount: number;
  overdueTaskCount: number;
}

export interface ItemScoreDetails extends ScoreMetadata {
  itemId: string;
  featureScores: {
    featureId: string;
    category: FeatureCategory;
    score: number;
  }[];
  completionRate: number;       // 완료율 (%)
  avgDelayDays: number;         // 평균 지연 일수
}

// Room과 Item에 추가
export interface Room {
  // ... 기존 필드
  scoreMetadata?: RoomScoreDetails;  // 🆕
}

export interface RoomItem {
  // ... 기존 필드
  scoreMetadata?: ItemScoreDetails;  // 🆕
}
```

---

## 🔧 데이터 접근 서비스

`src/services/homeLayoutService.ts`:

```typescript
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '@/services/firebase/firebaseConfig';
import { HomeLayout, Room, RoomItem } from '@/types/home-layout.types';
import { homeLayoutConverter } from '@/utils/firestoreConverters';

export class HomeLayoutService {
  /**
   * HomeLayout 저장 (초기 생성)
   */
  static async createHomeLayout(
    userId: string,
    homeType: HomeType,
    rooms: Room[]
  ): Promise<HomeLayout> {
    const layout: HomeLayout = {
      id: `home_${userId}_${Date.now()}`,
      userId,
      homeType,
      rooms,
      overallScore: 100,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const layoutRef = doc(db, `users/${userId}/homeLayout/main`);
    await setDoc(layoutRef, homeLayoutConverter.toFirestore(layout));

    return layout;
  }

  /**
   * HomeLayout 조회
   */
  static async getHomeLayout(userId: string): Promise<HomeLayout | null> {
    const layoutRef = doc(db, `users/${userId}/homeLayout/main`)
      .withConverter(homeLayoutConverter);
    const layoutSnap = await getDoc(layoutRef);

    if (!layoutSnap.exists()) return null;
    return layoutSnap.data();
  }

  /**
   * 방 추가
   */
  static async addRoom(userId: string, room: Room): Promise<void> {
    const layout = await this.getHomeLayout(userId);
    if (!layout) throw new Error('HomeLayout not found');

    layout.rooms.push(room);
    layout.updatedAt = new Date();

    const layoutRef = doc(db, `users/${userId}/homeLayout/main`);
    await updateDoc(layoutRef, homeLayoutConverter.toFirestore(layout));
  }

  /**
   * 아이템 추가
   */
  static async addItem(
    userId: string,
    roomId: string,
    item: RoomItem
  ): Promise<void> {
    const layout = await this.getHomeLayout(userId);
    if (!layout) throw new Error('HomeLayout not found');

    const room = layout.rooms.find(r => r.id === roomId);
    if (!room) throw new Error('Room not found');

    room.items.push(item);
    layout.updatedAt = new Date();

    const layoutRef = doc(db, `users/${userId}/homeLayout/main`);
    await updateDoc(layoutRef, homeLayoutConverter.toFirestore(layout));
  }

  /**
   * 전체 점수 재계산 및 업데이트
   */
  static async updateScores(
    userId: string,
    allTasks: Task[]
  ): Promise<void> {
    const layout = await this.getHomeLayout(userId);
    if (!layout) return;

    // 1. 각 아이템 점수 계산
    for (const room of layout.rooms) {
      for (const item of room.items) {
        item.score = ScoreCalculator.calculateItemScore(item, allTasks);
      }
      
      // 2. 방 점수 계산
      room.score = ScoreCalculator.calculateRoomScore(room, allTasks);
    }

    // 3. 전체 집 점수 계산
    layout.overallScore = ScoreCalculator.calculateHomeScore(layout.rooms, allTasks);
    layout.updatedAt = new Date();

    // 4. 저장
    const layoutRef = doc(db, `users/${userId}/homeLayout/main`);
    await updateDoc(layoutRef, homeLayoutConverter.toFirestore(layout));
  }
}
```

---

## 🔗 Task와 Item 연결

`src/services/taskItemLinkService.ts`:

```typescript
import { Task } from '@/types/task.types';
import { RoomItem } from '@/types/home-layout.types';

export class TaskItemLinkService {
  /**
   * Task 완료 시 Item 점수 업데이트
   */
  static async onTaskCompleted(
    userId: string,
    task: Task
  ): Promise<void> {
    // 1. Task 완료 처리 (기존 로직)
    await this.completeTask(task);

    // 2. Item 점수 재계산
    const allTasks = await this.getAllTasksForItem(task.itemId);
    const item = await this.getItem(task.itemId);
    
    const newScore = ScoreCalculator.calculateItemScore(item, allTasks);
    const scoreGained = newScore - item.score;

    // 3. 점수 업데이트
    await this.updateItemScore(task.itemId, newScore);

    // 4. Room 및 Home 점수 업데이트
    await HomeLayoutService.updateScores(userId, await this.getAllTasks(userId));

    // 5. 축하 애니메이션 트리거 (점수 상승 시)
    if (scoreGained > 0) {
      await this.triggerCelebration(userId, {
        type: 'task_completed',
        scoreGained,
        newScore
      });
    }
  }

  /**
   * 여러 Task 완료 시 (10분 코스 등)
   */
  static async onMultipleTasksCompleted(
    userId: string,
    tasks: Task[]
  ): Promise<void> {
    let totalScoreGained = 0;

    // 순차 완료
    for (const task of tasks) {
      await this.completeTask(task);
      // 점수 계산은 마지막에 한 번만
    }

    // 전체 점수 재계산
    await HomeLayoutService.updateScores(userId, await this.getAllTasks(userId));

    // 대형 축하 애니메이션
    await this.triggerCelebration(userId, {
      type: 'multiple_tasks_completed',
      taskCount: tasks.length,
      message: `${tasks.length}개 완료! 대단해요! 🎉`
    });
  }
}
```

---

## 📊 데이터 마이그레이션 (v1 → v2)

### 마이그레이션 스크립트

`src/utils/migration.ts`:

```typescript
import { Task as TaskV1 } from '@/types/task.types.v1';
import { Task as TaskV2, HomeLayout } from '@/types/task.types';

/**
 * v1 Task를 v2로 변환
 * 
 * v1: Task만 존재
 * v2: HomeLayout → Room → Item → Task
 */
export async function migrateV1ToV2(userId: string): Promise<void> {
  console.log('🔄 Starting migration from v1 to v2...');

  // 1. v1 Task 조회
  const v1Tasks = await getV1Tasks(userId);
  console.log(`Found ${v1Tasks.length} v1 tasks`);

  // 2. 기본 HomeLayout 생성
  const defaultLayout = await createDefaultHomeLayout(userId);

  // 3. Task를 분석하여 Item에 매핑
  for (const v1Task of v1Tasks) {
    // 타입별로 아이템 찾기 또는 생성
    const item = await findOrCreateItemForTask(v1Task, defaultLayout);
    
    // v2 Task로 변환
    const v2Task: TaskV2 = {
      ...v1Task,
      itemId: item.id,
      roomId: item.roomId,
      scoreImpact: calculateScoreImpact(v1Task)
    };

    // 저장
    await saveTaskV2(v2Task);
  }

  console.log('✅ Migration completed');
}

async function createDefaultHomeLayout(userId: string): Promise<HomeLayout> {
  // 가장 일반적인 투룸 구조 생성
  const rooms: Room[] = [
    {
      id: `room_kitchen_${Date.now()}`,
      type: 'kitchen',
      name: '주방',
      items: [
        { type: 'fridge', name: '냉장고', icon: '🧊' },
        { type: 'sink', name: '싱크대', icon: '🚰' }
      ]
    },
    {
      id: `room_bathroom_${Date.now()}`,
      type: 'bathroom',
      name: '화장실',
      items: [
        { type: 'toilet', name: '변기', icon: '🚽' },
        { type: 'washing_machine', name: '세탁기', icon: '👕' }
      ]
    },
    {
      id: `room_bedroom_${Date.now()}`,
      type: 'bedroom',
      name: '침실',
      items: [
        { type: 'bed', name: '침대', icon: '🛏️' }
      ]
    }
  ];

  return await HomeLayoutService.createHomeLayout(userId, 'two_room', rooms);
}
```

---

## ✅ 테스트 체크리스트

- [ ] HomeLayout 생성 및 Firestore 저장
- [ ] Room 추가/수정/삭제
- [ ] Item 추가/수정/삭제
- [ ] Feature 활성화 시 Task 자동 생성
- [ ] Task 완료 시 Item 점수 업데이트
- [ ] Item 점수 변경 시 Room 점수 업데이트
- [ ] Room 점수 변경 시 Home 점수 업데이트
- [ ] Firestore Converter 정상 작동
- [ ] v1 → v2 마이그레이션 성공

---

## 🚀 다음 단계

- **03-core-engine-v2.md**: ScoreCalculator 추가
- **04-home-layout.md**: 집 배치도 UI 구현

---

**계층적 데이터 구조로 무한 확장 가능! 🏗️✨**
