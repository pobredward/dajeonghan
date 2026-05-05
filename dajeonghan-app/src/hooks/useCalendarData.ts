/**
 * 다정한 - 달력 데이터 훅
 *
 * 앱 시작 시 전체 태스크를 1회 로드하고 메모리에 캐시합니다.
 * 월 전환은 Firestore 재호출 없이 클라이언트 필터링으로 처리합니다.
 *
 * 모든 태스크는 반복형(fixed|flexible)이므로 Firestore 문서 수 = 태스크 수.
 * 범위 조건 없이 전체를 가져와도 문서가 폭발하지 않습니다.
 */

import { useState, useCallback, useRef } from 'react';
import { getAllTasks, getOverdueTasks } from '@/services/firestoreService';
import { Task } from '@/types/task.types';

export const CALENDAR_REFETCH_INTERVAL_MS = 30_000;

export interface UseCalendarDataResult {
  allTasks: Task[];
  overdueTasks: Task[];
  loading: boolean;
  refreshing: boolean;
  lastFetchedAt: React.MutableRefObject<number>;
  loadAll: (opts?: { silent?: boolean }) => Promise<void>;
  startRefreshing: () => void;
  updateTaskInCache: (taskId: string, partial: Partial<Task>) => void;
  removeTaskFromCache: (taskId: string) => void;
  removeFromOverdue: (taskId: string) => void;
}

export function useCalendarData(userId: string | null): UseCalendarDataResult {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const lastFetchedAt = useRef<number>(0);

  /**
   * 전체 태스크를 Firestore에서 로드합니다.
   * silent: true면 loading/refreshing 스피너 없이 백그라운드 갱신.
   */
  const loadAll = useCallback(async (opts?: { silent?: boolean }) => {
    if (!userId) return;
    const silent = opts?.silent ?? false;

    if (!silent) setLoading(true);

    try {
      const [tasks, overdue] = await Promise.all([
        getAllTasks(userId),
        getOverdueTasks(userId),
      ]);
      setAllTasks(tasks);
      setOverdueTasks(overdue);
      lastFetchedAt.current = Date.now();
    } catch (e) {
      console.error('[useCalendarData] 데이터 로드 실패:', e);
    } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  const startRefreshing = useCallback(() => {
    setRefreshing(true);
  }, []);

  /** 낙관적 업데이트: allTasks와 overdueTasks 양쪽 캐시를 동기적으로 갱신 */
  const updateTaskInCache = useCallback((taskId: string, partial: Partial<Task>) => {
    setAllTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...partial } : t));
    setOverdueTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...partial } : t));
  }, []);

  /** 낙관적 삭제: allTasks + overdueTasks 양쪽에서 즉시 제거 */
  const removeTaskFromCache = useCallback((taskId: string) => {
    setAllTasks(prev => prev.filter(t => t.id !== taskId));
    setOverdueTasks(prev => prev.filter(t => t.id !== taskId));
  }, []);

  /** 연체 목록에서만 제거 (완료/미루기 처리 시 allTasks는 유지) */
  const removeFromOverdue = useCallback((taskId: string) => {
    setOverdueTasks(prev => prev.filter(t => t.id !== taskId));
  }, []);

  return {
    allTasks,
    overdueTasks,
    loading,
    refreshing,
    lastFetchedAt,
    loadAll,
    startRefreshing,
    updateTaskInCache,
    removeTaskFromCache,
    removeFromOverdue,
  };
}
