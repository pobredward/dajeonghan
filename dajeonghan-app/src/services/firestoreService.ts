/**
 * 다정한 - Firestore 서비스 레이어
 * 
 * Firestore와의 모든 상호작용을 관리합니다.
 * - Timestamp ↔ Date 변환
 * - CRUD 작업
 * - 쿼리 헬퍼
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  QueryConstraint,
  DocumentReference,
  CollectionReference,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Task, TaskQueryOptions, TaskLog, DoseLog } from '../types/task.types';
import { LifeObject } from '../types/lifeobject.types';
import { UserProfile } from '../types/user.types';

// ============================================================================
// Timestamp 변환 유틸리티
// ============================================================================

/**
 * Firestore Timestamp를 Date로 변환
 */
export const timestampToDate = (timestamp: Timestamp): Date => {
  return timestamp.toDate();
};

/**
 * Date를 Firestore Timestamp로 변환
 */
export const dateToTimestamp = (date: Date): Timestamp => {
  return Timestamp.fromDate(date);
};

/**
 * 객체 내의 모든 Date를 Timestamp로 변환 (재귀)
 * undefined 값은 제거하여 Firestore 호환성 보장
 */
export const convertDatesToTimestamps = <T>(obj: T): any => {
  if (obj instanceof Date) {
    return dateToTimestamp(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => convertDatesToTimestamps(item));
  }

  if (obj && typeof obj === 'object') {
    const converted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // undefined 값은 건너뛰기 (Firestore가 지원하지 않음)
      if (value !== undefined) {
        converted[key] = convertDatesToTimestamps(value);
      }
    }
    return converted;
  }

  return obj;
};

/**
 * 객체 내의 모든 Timestamp를 Date로 변환 (재귀)
 */
export const convertTimestampsToDates = <T>(obj: any): T => {
  if (obj instanceof Timestamp) {
    return timestampToDate(obj) as any;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => convertTimestampsToDates(item)) as any;
  }

  if (obj && typeof obj === 'object') {
    const converted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertTimestampsToDates(value);
    }
    return converted;
  }

  return obj;
};

// ============================================================================
// Task CRUD
// ============================================================================

/**
 * Task 저장 (생성 또는 업데이트)
 */
export const saveTask = async (task: Task): Promise<void> => {
  const taskRef = doc(db, `users/${task.userId}/tasks/${task.id}`);
  const firestoreTask = convertDatesToTimestamps(task);
  await setDoc(taskRef, firestoreTask);
};

/**
 * Task 조회
 */
export const getTask = async (userId: string, taskId: string): Promise<Task | null> => {
  const taskRef = doc(db, `users/${userId}/tasks/${taskId}`);
  const taskSnap = await getDoc(taskRef);

  if (!taskSnap.exists()) return null;

  const data = taskSnap.data();
  return convertTimestampsToDates<Task>({ id: taskSnap.id, ...data });
};

/**
 * Task 수정
 */
export const updateTask = async (userId: string, taskId: string, updates: Partial<Task>): Promise<void> => {
  const taskRef = doc(db, `users/${userId}/tasks/${taskId}`);
  const firestoreUpdates = {
    ...convertDatesToTimestamps(updates),
    updatedAt: dateToTimestamp(new Date()),
  };
  await updateDoc(taskRef, firestoreUpdates);
};

/**
 * Task 삭제 (소프트 삭제)
 */
export const deleteTask = async (userId: string, taskId: string): Promise<void> => {
  const taskRef = doc(db, `users/${userId}/tasks/${taskId}`);
  await updateDoc(taskRef, {
    deletedAt: dateToTimestamp(new Date()),
  });
};

/**
 * Task 영구 삭제
 */
export const hardDeleteTask = async (userId: string, taskId: string): Promise<void> => {
  const taskRef = doc(db, `users/${userId}/tasks/${taskId}`);
  await deleteDoc(taskRef);
};

/**
 * 사용자의 모든 Task 조회 (필터 및 정렬 옵션 지원)
 */
export const getTasks = async (userId: string, options?: TaskQueryOptions): Promise<Task[]> => {
  console.log('getTasks 호출됨, userId:', userId);
  const tasksRef = collection(db, `users/${userId}/tasks`);
  const constraints: QueryConstraint[] = [];

  // 필터 적용 (deletedAt 조건은 제거)
  if (options?.filter) {
    const { type, status, priority, dueDateRange } = options.filter;

    if (type) {
      constraints.push(where('type', '==', type));
    }

    if (status) {
      constraints.push(where('status', '==', status));
    }

    if (priority) {
      constraints.push(where('priority', '==', priority));
    }

    if (dueDateRange) {
      constraints.push(where('recurrence.nextDue', '>=', dateToTimestamp(dueDateRange.start)));
      constraints.push(where('recurrence.nextDue', '<=', dateToTimestamp(dueDateRange.end)));
    }
  }

  // 정렬 적용
  if (options?.sort) {
    const direction = options.sortDirection || 'asc';
    const sortField = options.sort === 'dueDate' ? 'recurrence.nextDue' : options.sort;
    constraints.push(orderBy(sortField, direction));
  }

  // 개수 제한
  if (options?.limit) {
    constraints.push(limit(options.limit));
  }

  const q = query(tasksRef, ...constraints);
  const querySnapshot = await getDocs(q);
  
  console.log('Firestore에서 가져온 Task 개수:', querySnapshot.docs.length);

  // deletedAt이 없거나 null인 문서만 필터링
  const tasks = querySnapshot.docs
    .map(doc => {
      const data = doc.data();
      console.log('Task 문서 데이터:', { id: doc.id, deletedAt: data.deletedAt, title: data.title });
      return convertTimestampsToDates<Task>({ id: doc.id, ...data });
    })
    .filter(task => !task.deletedAt); // deletedAt이 없거나 falsy인 경우만 포함

  console.log('필터링된 Task 개수:', tasks.length);
  return tasks;
};

/**
 * 오늘 해야 할 Task 조회
 */
export const getTodayTasks = async (userId: string): Promise<Task[]> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return getTasks(userId, {
    filter: {
      status: 'pending',
      dueDateRange: { start: today, end: tomorrow },
    },
    sort: 'urgencyScore',
    sortDirection: 'desc',
  });
};

/**
 * 연체된 Task 조회
 */
export const getOverdueTasks = async (userId: string): Promise<Task[]> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tasksRef = collection(db, `users/${userId}/tasks`);
  const q = query(
    tasksRef,
    where('status', '==', 'pending'),
    where('recurrence.nextDue', '<', dateToTimestamp(today)),
    orderBy('recurrence.nextDue', 'asc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs
    .map(doc => convertTimestampsToDates<Task>({ id: doc.id, ...doc.data() }))
    .filter(task => !task.deletedAt); // 클라이언트에서 deletedAt 필터링
};

// ============================================================================
// LifeObject CRUD
// ============================================================================

/**
 * LifeObject 저장
 */
export const saveLifeObject = async (obj: LifeObject): Promise<void> => {
  const objRef = doc(db, `users/${obj.userId}/objects/${obj.id}`);
  const firestoreObj = convertDatesToTimestamps(obj);
  await setDoc(objRef, firestoreObj);
};

/**
 * LifeObject 조회
 */
export const getLifeObject = async (userId: string, objectId: string): Promise<LifeObject | null> => {
  const objRef = doc(db, `users/${userId}/objects/${objectId}`);
  const objSnap = await getDoc(objRef);

  if (!objSnap.exists()) return null;

  const data = objSnap.data();
  return convertTimestampsToDates<LifeObject>({ id: objSnap.id, ...data });
};

/**
 * LifeObject 수정
 */
export const updateLifeObject = async (userId: string, objectId: string, updates: Partial<LifeObject>): Promise<void> => {
  const objRef = doc(db, `users/${userId}/objects/${objectId}`);
  const firestoreUpdates = {
    ...convertDatesToTimestamps(updates),
    updatedAt: dateToTimestamp(new Date()),
  };
  await updateDoc(objRef, firestoreUpdates);
};

/**
 * LifeObject 삭제 (소프트 삭제)
 */
export const deleteLifeObject = async (userId: string, objectId: string): Promise<void> => {
  const objRef = doc(db, `users/${userId}/objects/${objectId}`);
  await updateDoc(objRef, {
    deletedAt: dateToTimestamp(new Date()),
  });
};

/**
 * 사용자의 모든 LifeObject 조회
 */
export const getLifeObjects = async (userId: string, moduleType?: string): Promise<LifeObject[]> => {
  console.log('getLifeObjects 호출됨, userId:', userId, 'moduleType:', moduleType);
  const objsRef = collection(db, `users/${userId}/lifeObjects`); // 경로 수정
  const constraints: QueryConstraint[] = [];

  if (moduleType) {
    constraints.push(where('type', '==', moduleType));
  }

  const q = query(objsRef, ...constraints);
  const querySnapshot = await getDocs(q);
  
  console.log('Firestore에서 가져온 LifeObject 개수:', querySnapshot.docs.length);

  // deletedAt이 없거나 null인 문서만 필터링
  const objects = querySnapshot.docs
    .map(doc => {
      const data = doc.data();
      console.log('LifeObject 문서 데이터:', { id: doc.id, deletedAt: data.deletedAt, name: data.name });
      return convertTimestampsToDates<LifeObject>({ id: doc.id, ...data });
    })
    .filter(obj => !obj.deletedAt);

  console.log('필터링된 LifeObject 개수:', objects.length);
  return objects;
};

// ============================================================================
// UserProfile CRUD
// ============================================================================

/**
 * UserProfile 저장
 */
export const saveUserProfile = async (profile: UserProfile): Promise<void> => {
  const profileRef = doc(db, `users/${profile.userId}`);
  const firestoreProfile = convertDatesToTimestamps(profile);
  await setDoc(profileRef, firestoreProfile);
};

/**
 * UserProfile 조회
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const profileRef = doc(db, `users/${userId}`);
  const profileSnap = await getDoc(profileRef);

  if (!profileSnap.exists()) return null;

  const data = profileSnap.data();
  return convertTimestampsToDates<UserProfile>({ id: profileSnap.id, ...data });
};

/**
 * UserProfile 수정
 */
export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>): Promise<void> => {
  const profileRef = doc(db, `users/${userId}`);
  const firestoreUpdates = {
    ...convertDatesToTimestamps(updates),
    updatedAt: dateToTimestamp(new Date()),
  };
  await updateDoc(profileRef, firestoreUpdates);
};

// ============================================================================
// TaskLog CRUD
// ============================================================================

/**
 * TaskLog 저장
 */
export const saveTaskLog = async (log: TaskLog): Promise<void> => {
  const logRef = doc(db, `users/${log.userId}/logs/${log.id}`);
  const firestoreLog = convertDatesToTimestamps(log);
  await setDoc(logRef, firestoreLog);
};

/**
 * Task의 모든 로그 조회
 */
export const getTaskLogs = async (userId: string, taskId: string): Promise<TaskLog[]> => {
  const logsRef = collection(db, `users/${userId}/logs`);
  const q = query(
    logsRef,
    where('taskId', '==', taskId),
    orderBy('timestamp', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => 
    convertTimestampsToDates<TaskLog>({ id: doc.id, ...doc.data() })
  );
};

// ============================================================================
// DoseLog CRUD
// ============================================================================

/**
 * DoseLog 저장
 */
export const saveDoseLog = async (log: DoseLog): Promise<void> => {
  const logRef = doc(db, `users/${log.userId}/doseLogs/${log.id}`);
  const firestoreLog = convertDatesToTimestamps(log);
  await setDoc(logRef, firestoreLog);
};

/**
 * 약의 모든 복용 로그 조회
 */
export const getDoseLogs = async (userId: string, medicineId: string, startDate?: Date, endDate?: Date): Promise<DoseLog[]> => {
  const logsRef = collection(db, `users/${userId}/doseLogs`);
  const constraints: QueryConstraint[] = [where('medicineId', '==', medicineId)];

  if (startDate) {
    constraints.push(where('scheduledTime', '>=', dateToTimestamp(startDate)));
  }

  if (endDate) {
    constraints.push(where('scheduledTime', '<=', dateToTimestamp(endDate)));
  }

  constraints.push(orderBy('scheduledTime', 'desc'));

  const q = query(logsRef, ...constraints);
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map(doc => 
    convertTimestampsToDates<DoseLog>({ id: doc.id, ...doc.data() })
  );
};

// ============================================================================
// 배치 작업
// ============================================================================

/**
 * 여러 Task를 한 번에 저장
 */
export const saveTasks = async (tasks: Task[]): Promise<void> => {
  const promises = tasks.map(task => saveTask(task));
  await Promise.all(promises);
};

/**
 * 여러 LifeObject를 한 번에 저장
 */
export const saveLifeObjects = async (objects: LifeObject[]): Promise<void> => {
  const promises = objects.map(obj => saveLifeObject(obj));
  await Promise.all(promises);
};
