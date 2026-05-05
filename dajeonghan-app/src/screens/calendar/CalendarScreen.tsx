import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Modal,
  Alert,
  TextInput,
  Image,
  Linking,
} from 'react-native';
import { fetchTaskTemplateDetail } from '@/services/taskTemplateDetailService';
import { TaskTemplateDetail } from '@/types/furnitureTaskTemplate.types';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import * as KoreanHolidays from 'korean-holidays';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/contexts/AuthContext';
import { getTasks, getOverdueTasks, updateTask } from '@/services/firestoreService';
import { getHouseLayout } from '@/services/houseService';
import { Task, TaskDomain } from '@/types/task.types';
import { Colors, Typography, Spacing } from '@/constants';
import { Shadows } from '@/constants/Spacing';
import {
  isTaskCompleted,
  isOccurrenceCompleted,
  expandTaskOccurrences,
  buildMarkedDates,
  getMonthRange,
  toDateKey,
  getModuleIcon,
  getModuleLabel,
} from '@/utils/taskUtils';
import { RecurrenceEditor, getNextOccurrences, DayOfWeek } from '@/components/tasks/RecurrenceEditor';

// ─── 한국어 locale 설정 ───────────────────────────────────────
LocaleConfig.locales['kr'] = {
  monthNames: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
  monthNamesShort: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
  dayNames: ['일요일','월요일','화요일','수요일','목요일','금요일','토요일'],
  dayNamesShort: ['일','월','화','수','목','금','토'],
  today: '오늘',
};
LocaleConfig.defaultLocale = 'kr';

// ─── 타입 ─────────────────────────────────────────────────────
type FilterType = 'all' | TaskDomain;

const MODULE_FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'home', label: '집 관리' },
  { key: 'food', label: '음식' },
  { key: 'medicine', label: '약' },
  { key: 'pet', label: '반려동물' },
  { key: 'self_care', label: '자기관리' },
  { key: 'car', label: '차량' },
  { key: 'family', label: '가족' },
  { key: 'growth', label: '자기계발' },
];

// 날짜 상태 분류
function getDateCategory(task: Task): 'overdue' | 'today' | 'upcoming' {
  if (!task.recurrence?.nextDue) return 'upcoming';
  const due = new Date(task.recurrence.nextDue);
  due.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (due < today) return 'overdue';
  if (due.getTime() === today.getTime()) return 'today';
  return 'upcoming';
}

/**
 * Task의 completionDates를 기준으로, 아직 완료되지 않은 가장 이른 미래(또는 오늘) 발생일을 반환합니다.
 * 홈 탭 등에서 "다음 예정일" 표시에 사용되는 nextDue를 갱신하기 위해 사용합니다.
 */
function computeNextPendingDue(task: Task, completionDates: string[]): Date | null {
  if (!task.recurrence?.nextDue) return null;
  const interval = task.recurrence.interval || 1;
  const unit = task.recurrence.unit || 'day';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let candidate = new Date(task.recurrence.nextDue);
  candidate.setHours(0, 0, 0, 0);

  // 오늘보다 이전이면 앞으로 전진
  let safetyCount = 0;
  while (candidate < today && safetyCount < 366) {
    if (unit === 'day') candidate.setDate(candidate.getDate() + interval);
    else if (unit === 'week') candidate.setDate(candidate.getDate() + interval * 7);
    else if (unit === 'month') candidate.setMonth(candidate.getMonth() + interval);
    safetyCount++;
  }

  // 미완료 날짜를 찾을 때까지 최대 366회 전진
  safetyCount = 0;
  while (completionDates.includes(candidate.toDateString()) && safetyCount < 366) {
    if (unit === 'day') candidate.setDate(candidate.getDate() + interval);
    else if (unit === 'week') candidate.setDate(candidate.getDate() + interval * 7);
    else if (unit === 'month') candidate.setMonth(candidate.getMonth() + interval);
    safetyCount++;
  }

  return candidate;
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────
export const CalendarScreen: React.FC = () => {
  const { userId } = useAuth();

  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState(toDateKey(now));

  const [monthTasks, setMonthTasks] = useState<Task[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [overdueExpanded, setOverdueExpanded] = useState(false);

  // 가구 이모지 맵 (furnitureId → 가구 emoji)
  const [furnitureEmojiMap, setFurnitureEmojiMap] = useState<Record<string, string>>({});

  // 모달 state
  const [taskActionModal, setTaskActionModal] = useState<{
    visible: boolean;
    task: Task | null;
    action: 'postpone' | null;
  }>({ visible: false, task: null, action: null });
  const [taskDetailModal, setTaskDetailModal] = useState<{
    visible: boolean;
    task: Task | null;
  }>({ visible: false, task: null });
  const [postponeDays, setPostponeDays] = useState(1);
  const [taskLoadingStates, setTaskLoadingStates] = useState<Record<string, boolean>>({});

  // 편집 state
  const [editingField, setEditingField] = useState<'recurrence' | 'minutes' | 'title' | 'description' | null>(null);
  const [editRecurrenceUnit, setEditRecurrenceUnit] = useState<'day' | 'week' | 'month'>('week');
  const [editRecurrenceInterval, setEditRecurrenceInterval] = useState<number>(1);
  const [editStartDate, setEditStartDate] = useState<Date>(new Date());
  const [editSelectedDays, setEditSelectedDays] = useState<DayOfWeek[]>([]);
  const [editMinutes, setEditMinutes] = useState<number>(15);
  const [editHasTime, setEditHasTime] = useState<boolean>(false);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');

  // 상세 모달 탭 state
  const [detailActiveTab, setDetailActiveTab] = useState<'info' | 'why' | 'how'>('info');
  const [detailTemplateDetail, setDetailTemplateDetail] = useState<TaskTemplateDetail | null>(null);

  const bannerAnim = useRef(new Animated.Value(0)).current;
  const detailModalAnim = useRef(new Animated.Value(0)).current;
  const isFirstLoad = useRef(true);
  const yearRef = useRef(currentYear);
  const monthRef = useRef(currentMonth);
  const initialDateRef = useRef(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`);

  useEffect(() => { yearRef.current = currentYear; }, [currentYear]);
  useEffect(() => { monthRef.current = currentMonth; }, [currentMonth]);

  // ─── 가구 이모지 맵 로드 ─────────────────────────────────
  const loadFurnitureEmojiMap = useCallback(async () => {
    if (!userId) return;
    try {
      const layout = await getHouseLayout(userId);
      if (!layout) return;
      const map: Record<string, string> = {};
      layout.rooms?.forEach(room => {
        room.furnitures?.forEach(furniture => {
          map[furniture.id] = furniture.emoji;
        });
      });
      setFurnitureEmojiMap(map);
    } catch (e) {
      console.error('[CalendarScreen] 가구 이모지 맵 로드 실패:', e);
    }
  }, [userId]);

  // ─── 데이터 로드 ──────────────────────────────────────────
  const fetchData = useCallback(async (year: number, month: number) => {
    if (!userId) return;
    try {
      const { start } = getMonthRange(year, month);
      // nextDue가 이미 이후 달로 이동한 반복 Task도 포함하기 위해 종료일을 3개월 뒤로 확장
      const extendedEnd = new Date(year, month + 2, 0, 23, 59, 59, 999);
      const [monthData, overdueData] = await Promise.all([
        getTasks(userId, {
          filter: { dueDateRange: { start, end: extendedEnd } },
          sort: 'dueDate',
          sortDirection: 'asc',
        }),
        getOverdueTasks(userId),
      ]);
      setMonthTasks(monthData);
      setOverdueTasks(overdueData);
    } catch (e) {
      console.error('[CalendarScreen] 데이터 로드 실패:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
      isFirstLoad.current = false;
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      if (isFirstLoad.current) setLoading(true);
      loadFurnitureEmojiMap();
      fetchData(yearRef.current, monthRef.current);
    }, [fetchData, loadFurnitureEmojiMap])
  );

  const isMonthChangeTrigger = useRef(false);
  useEffect(() => {
    if (!isMonthChangeTrigger.current) return;
    isMonthChangeTrigger.current = false;
    fetchData(currentYear, currentMonth);
  }, [currentYear, currentMonth, fetchData]);

  useEffect(() => {
    if (overdueTasks.length > 0) {
      Animated.spring(bannerAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 9 }).start();
    }
  }, [overdueTasks.length]);

  // ─── 완료 핸들러 ─────────────────────────────────────────
  /**
   * occurrenceDate: 달력에서 클릭한 발생 날짜.
   * 반복 Task는 nextDue를 이동하지 않고 completionDates에 해당 날짜만 추가/제거합니다.
   * 일회성 Task는 기존과 동일하게 isCompleted 토글입니다.
   */
  const handleCompleteTask = useCallback(async (task: Task, occurrenceDate?: Date) => {
    const taskId = String(task.id);
    if (!userId || !taskId) return;

    // 달력에서 호출 시 occurrenceDate 기준으로, 상세 모달 등에서 호출 시 nextDue 기준으로 판정
    const targetDate = occurrenceDate ?? (task.recurrence?.nextDue ? new Date(task.recurrence.nextDue) : new Date());
    targetDate.setHours(0, 0, 0, 0);

    const currentlyCompleted = occurrenceDate
      ? isOccurrenceCompleted(task, targetDate)
      : isTaskCompleted(task);

    setTaskLoadingStates(prev => ({ ...prev, [taskId]: true }));

    try {
      let updatedFields: Partial<Task>;

      if (task.recurrence?.type === 'fixed') {
        const dateStr = targetDate.toDateString();
        const completionDates = [...(task.completionDates || [])];

        if (currentlyCompleted) {
          // 완료 취소: completionDates에서 해당 날짜 제거
          const idx = completionDates.indexOf(dateStr);
          if (idx > -1) completionDates.splice(idx, 1);
        } else {
          // 완료 처리: completionDates에 해당 날짜 추가
          if (!completionDates.includes(dateStr)) completionDates.push(dateStr);
        }

        // nextDue는 completionDates에 없는 가장 이른 미래 발생일로 업데이트
        // (홈 탭 등 다른 화면의 "다음 예정일" 표시를 위해 유지)
        const nextPendingDue = computeNextPendingDue(task, completionDates);

        updatedFields = {
          completionDates,
          lastCompletedAt: currentlyCompleted ? (completionDates.length > 0 ? new Date() : undefined) : new Date(),
          completionHistory: currentlyCompleted
            ? task.completionHistory
            : [...(task.completionHistory || []), { date: new Date(), postponed: false }],
          recurrence: nextPendingDue
            ? { ...task.recurrence!, nextDue: nextPendingDue }
            : task.recurrence,
          status: 'pending',
          updatedAt: new Date(),
        };
      } else {
        // 일회성 Task
        if (currentlyCompleted) {
          updatedFields = { isCompleted: false, status: 'pending', updatedAt: new Date() };
        } else {
          updatedFields = { isCompleted: true, completedAt: new Date(), updatedAt: new Date() };
        }
      }

      await updateTask(userId, taskId, updatedFields);

      // 낙관적 UI 업데이트
      setMonthTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updatedFields } : t));
      if (currentlyCompleted) {
        setOverdueTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updatedFields } : t));
      } else {
        setOverdueTasks(prev => prev.filter(t => t.id !== taskId));
      }
      if (taskDetailModal.task?.id === taskId) {
        setTaskDetailModal(prev => prev.task ? { ...prev, task: { ...prev.task, ...updatedFields } } : prev);
      }
    } catch (e) {
      console.error('[CalendarScreen] 완료 처리 실패:', e);
      Alert.alert('오류', '할 일 상태 변경에 실패했습니다.');
    } finally {
      setTaskLoadingStates(prev => ({ ...prev, [taskId]: false }));
    }
  }, [userId, taskDetailModal.task?.id]);

  // ─── 미루기 핸들러 ───────────────────────────────────────
  const handlePostponeTask = useCallback(async (task: Task) => {
    const taskId = String(task.id);
    if (!userId || !taskId) return;
    try {
      const currentDue = task.recurrence?.nextDue ? new Date(task.recurrence.nextDue) : new Date();
      const nextDue = new Date(currentDue);
      nextDue.setDate(nextDue.getDate() + postponeDays);

      const updatedFields: Partial<Task> = {
        recurrence: { ...task.recurrence!, nextDue },
        updatedAt: new Date(),
      };

      await updateTask(userId, taskId, updatedFields);
      setMonthTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updatedFields } : t));
      // 미뤄진 task는 연체 목록에서 제거 (nextDue가 미래로 이동)
      setOverdueTasks(prev => prev.filter(t => t.id !== taskId));
      setTaskActionModal({ visible: false, task: null, action: null });
      setPostponeDays(1);
      Alert.alert('완료', `할 일이 ${postponeDays}일 미뤄졌습니다.`);
    } catch (e) {
      console.error('[CalendarScreen] 미루기 실패:', e);
      Alert.alert('오류', '할 일 미루기에 실패했습니다.');
    }
  }, [userId, postponeDays]);

  // ─── 삭제 핸들러 ─────────────────────────────────────────
  const handleDeleteTask = useCallback((task: Task) => {
    const taskId = String(task.id);
    Alert.alert(
      '할 일 삭제',
      `"${task.title}"을(를) 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            if (!userId) return;
            try {
              await updateTask(userId, taskId, { deletedAt: new Date(), updatedAt: new Date() } as Partial<Task>);
              setMonthTasks(prev => prev.filter(t => t.id !== taskId));
              setOverdueTasks(prev => prev.filter(t => t.id !== taskId));
              setTaskDetailModal({ visible: false, task: null });
            } catch (e) {
              console.error('[CalendarScreen] 삭제 실패:', e);
              Alert.alert('오류', '할 일 삭제에 실패했습니다.');
            }
          },
        },
      ]
    );
  }, [userId]);

  const handleUpdateRecurrence = useCallback(async (
    task: Task,
    unit: 'day' | 'week' | 'month',
    interval: number,
    startDate: Date,
    hasTime: boolean,
    selectedDays: DayOfWeek[],
  ) => {
    if (!userId) return;
    const recurrenceType = unit === 'day' ? 'daily' : unit === 'week' ? 'weekly' : 'monthly';
    const updatedRecurrence = {
      ...task.recurrence,
      unit,
      interval,
      recurrenceType,
      nextDue: startDate,
      hasTime,
      selectedDays,
    };
    try {
      await updateTask(userId, String(task.id), { recurrence: updatedRecurrence } as Partial<Task>);
      setMonthTasks(prev => prev.map(t => t.id === task.id ? { ...t, recurrence: updatedRecurrence } : t));
      setOverdueTasks(prev => prev.map(t => t.id === task.id ? { ...t, recurrence: updatedRecurrence } : t));
      setTaskDetailModal(prev => ({
        ...prev,
        task: prev.task ? { ...prev.task, recurrence: updatedRecurrence } : null,
      }));
      setEditingField(null);
    } catch (e) {
      console.error('[CalendarScreen] 반복 업데이트 실패:', e);
      Alert.alert('오류', '반복 주기 수정에 실패했습니다.');
    }
  }, [userId]);

  const handleUpdateMinutes = useCallback(async (task: Task, minutes: number) => {
    if (!userId) return;
    try {
      await updateTask(userId, String(task.id), { estimatedMinutes: minutes } as Partial<Task>);
      setMonthTasks(prev => prev.map(t => t.id === task.id ? { ...t, estimatedMinutes: minutes } : t));
      setOverdueTasks(prev => prev.map(t => t.id === task.id ? { ...t, estimatedMinutes: minutes } : t));
      setTaskDetailModal(prev => ({
        ...prev,
        task: prev.task ? { ...prev.task, estimatedMinutes: minutes } : null,
      }));
      setEditingField(null);
    } catch (e) {
      console.error('[CalendarScreen] 소요시간 업데이트 실패:', e);
      Alert.alert('오류', '소요시간 수정에 실패했습니다.');
    }
  }, [userId]);

  const handleUpdateTitle = useCallback(async (task: Task, newTitle: string) => {
    if (!userId) return;
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    try {
      await updateTask(userId, String(task.id), { title: trimmed } as Partial<Task>);
      setMonthTasks(prev => prev.map(t => t.id === task.id ? { ...t, title: trimmed } : t));
      setOverdueTasks(prev => prev.map(t => t.id === task.id ? { ...t, title: trimmed } : t));
      setTaskDetailModal(prev => ({
        ...prev,
        task: prev.task ? { ...prev.task, title: trimmed } : null,
      }));
      setEditingField(null);
    } catch (e) {
      console.error('[CalendarScreen] 제목 업데이트 실패:', e);
      Alert.alert('오류', '제목 수정에 실패했습니다.');
    }
  }, [userId]);

  const handleUpdateDescription = useCallback(async (task: Task, newDescription: string) => {
    if (!userId) return;
    const trimmed = newDescription.trim();
    try {
      await updateTask(userId, String(task.id), { description: trimmed || undefined } as Partial<Task>);
      setMonthTasks(prev => prev.map(t => t.id === task.id ? { ...t, description: trimmed || undefined } : t));
      setOverdueTasks(prev => prev.map(t => t.id === task.id ? { ...t, description: trimmed || undefined } : t));
      setTaskDetailModal(prev => ({
        ...prev,
        task: prev.task ? { ...prev.task, description: trimmed || undefined } : null,
      }));
      setEditingField(null);
    } catch (e) {
      console.error('[CalendarScreen] 설명 업데이트 실패:', e);
      Alert.alert('오류', '설명 수정에 실패했습니다.');
    }
  }, [userId]);

  // ─── 파생 데이터 ──────────────────────────────────────────

  // 현재 달의 시작·끝 (occurrence 전개 범위)
  const { start: monthStart, end: monthEnd } = useMemo(
    () => getMonthRange(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  // 반복 Task를 날짜별 가상 인스턴스로 전개
  const monthOccurrences = useMemo(
    () => expandTaskOccurrences(monthTasks, monthStart, monthEnd),
    [monthTasks, monthStart, monthEnd]
  );

  const { markedDates } = useMemo(
    () => buildMarkedDates(monthTasks, selectedDate),
    [monthTasks, selectedDate]
  );

  const selectedDayOccurrences = useMemo(() => {
    const occ = monthOccurrences.filter(o => toDateKey(o.occurrenceDate) === selectedDate);
    const filtered = filter === 'all' ? occ : occ.filter(o => (o.task.domain ?? o.task.type) === filter);
    return filtered.sort((a, b) => {
      const scoreA = a.isCompleted ? 1 : 0;
      const scoreB = b.isCompleted ? 1 : 0;
      return scoreA - scoreB;
    });
  }, [monthOccurrences, selectedDate, filter]);

  const filteredOverdue = useMemo(
    () => (filter === 'all' ? overdueTasks : overdueTasks.filter(t => (t.domain ?? t.type) === filter)),
    [overdueTasks, filter]
  );

  // 날짜별 task 개수 집계 (모듈 필터 연동, occurrence 기반)
  const dayCountMap = useMemo(() => {
    const map: Record<string, { pending: number; overdue: number; completed: number }> = {};
    const source = filter === 'all' ? monthOccurrences : monthOccurrences.filter(o => (o.task.domain ?? o.task.type) === filter);
    for (const occ of source) {
      const key = toDateKey(occ.occurrenceDate);
      if (!map[key]) map[key] = { pending: 0, overdue: 0, completed: 0 };
      if (occ.isCompleted) map[key].completed++;
      else {
        const occMs = occ.occurrenceDate.getTime();
        const todayMs = new Date().setHours(0, 0, 0, 0);
        if (occMs < todayMs) map[key].overdue++;
        else map[key].pending++;
      }
    }
    return map;
  }, [monthOccurrences, filter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchData(yearRef.current, monthRef.current),
      loadFurnitureEmojiMap(),
    ]);
  }, [fetchData, loadFurnitureEmojiMap]);

  const handleMonthChange = useCallback((month: { year: number; month: number }) => {
    isMonthChangeTrigger.current = true;
    setCurrentYear(month.year);
    setCurrentMonth(month.month);

    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth() + 1;

    const isPast = month.year < todayYear || (month.year === todayYear && month.month < todayMonth);
    const isCurrent = month.year === todayYear && month.month === todayMonth;

    let defaultDate: Date;
    if (isCurrent) {
      defaultDate = today;
    } else if (isPast) {
      // 해당 월의 마지막 날
      defaultDate = new Date(month.year, month.month, 0);
    } else {
      // 미래 월: 1일
      defaultDate = new Date(month.year, month.month - 1, 1);
    }
    setSelectedDate(toDateKey(defaultDate));
  }, []);

  const handleDayPress = useCallback((day: { dateString: string }) => {
    setSelectedDate(day.dateString);
    setOverdueExpanded(false);
  }, []);

  const openDetailModal = useCallback((task: Task) => {
    // 편집 state 초기화
    setEditingField(null);
    const recurrence = task.recurrence;
    if (recurrence) {
      const unit: 'day' | 'week' | 'month' =
        recurrence.unit === 'day' ? 'day' : recurrence.unit === 'month' ? 'month' : 'week';
      setEditRecurrenceUnit(unit);
      setEditRecurrenceInterval(recurrence.interval ?? 1);
      setEditStartDate(recurrence.nextDue ? new Date(recurrence.nextDue) : new Date());
      setEditHasTime(recurrence.hasTime ?? false);
      setEditSelectedDays((recurrence.selectedDays ?? []) as DayOfWeek[]);
    }
    setEditMinutes(task.estimatedMinutes > 0 ? task.estimatedMinutes : 15);
    // 탭 초기화 및 템플릿 상세 정보 조회
    setDetailActiveTab('info');
    setDetailTemplateDetail(task.templateItemId ? fetchTaskTemplateDetail(task.templateItemId) : null);
    detailModalAnim.setValue(0);
    setTaskDetailModal({ visible: true, task });
    Animated.timing(detailModalAnim, { toValue: 1, duration: 100, useNativeDriver: true }).start();
  }, [detailModalAnim]);

  const selectedDateLabel = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const weekday = ['일','월','화','수','목','금','토'][date.getDay()];
    const isToday = selectedDate === toDateKey(new Date());
    return `${m}월 ${d}일 (${weekday})${isToday ? ' · 오늘' : ''}`;
  }, [selectedDate]);

  const renderDayComponent = useCallback(
    ({ date, state, onPress }: any) => {
      if (!date) return null;
      const dateObj = new Date(date.year, date.month - 1, date.day);
      const dow = dateObj.getDay();
      const isHoliday = KoreanHolidays.isHoliday(dateObj);
      const isSelected = date.dateString === selectedDate;
      const isDisabled = state === 'disabled';
      const isToday = date.dateString === toDateKey(new Date());

      let textColor: string = Colors.textPrimary;
      if (isDisabled) textColor = Colors.textDisabled;
      else if (isHoliday || dow === 0) textColor = Colors.error;
      else if (dow === 6) textColor = Colors.primary;

      const counts = dayCountMap[date.dateString];
      const total = counts ? counts.pending + counts.overdue + counts.completed : 0;
      const allDone = total > 0 && counts.pending === 0 && counts.overdue === 0;

      return (
        <TouchableOpacity onPress={() => !isDisabled && onPress(date)} activeOpacity={0.65} disabled={isDisabled}>
          <View style={styles.dayCell}>
            {total > 0 ? (
              /* task 있는 날: 라운드 사각형 뱃지 (위) */
              <View style={[
                styles.dayCellRect,
                allDone ? styles.dayCellRectDone : styles.dayCellRectPending,
              ]}>
                {allDone ? (
                  <Text style={styles.dayCellCheckText}>✓</Text>
                ) : (
                  <Text style={styles.dayCellCountText}>{total}</Text>
                )}
              </View>
            ) : (
              /* task 없는 날: 연한 박스 (내용 없음) */
              <View style={[styles.dayCellRect, styles.dayCellRectEmpty]} />
            )}
            {/* 날짜 숫자: 항상 아래 표시 */}
            {isSelected ? (
              <View style={styles.dayCellSelectedCircle}>
                <Text style={styles.dayCellDaySelected}>{date.day}</Text>
              </View>
            ) : isToday ? (
              <View style={styles.dayCellTodayCircle}>
                <Text style={[styles.dayCellDaySmall, styles.dayCellDayTodayInCircle]}>
                  {date.day}
                </Text>
              </View>
            ) : (
              <Text style={[styles.dayCellDaySmall, { color: textColor }]}>
                {date.day}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      );
    },
    [selectedDate, dayCountMap]
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>달력을 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 연체 요약 배너 ─────────────────────────────── */}
        {filteredOverdue.length > 0 && (
          <Animated.View style={[styles.overdueBanner, { opacity: bannerAnim, transform: [{ scaleY: bannerAnim }] }]}>
            <TouchableOpacity activeOpacity={0.85} onPress={() => setOverdueExpanded(prev => !prev)} style={styles.overdueBannerInner}>
              <View style={styles.overdueLeft}>
                <Text style={styles.overdueIcon}>⚠️</Text>
                <View>
                  <Text style={styles.overdueBannerTitle}>연체된 할 일 {filteredOverdue.length}개</Text>
                  <Text style={styles.overdueBannerSub}>탭하여 {overdueExpanded ? '접기' : '펼치기'}</Text>
                </View>
              </View>
              <Text style={styles.overdueChevron}>{overdueExpanded ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {overdueExpanded && (
              <View style={styles.overdueList}>
                {filteredOverdue.map(task => (
                  <TouchableOpacity key={task.id} style={styles.overdueRow} onPress={() => openDetailModal(task)} activeOpacity={0.75}>
                    <Text style={styles.overdueRowIcon}>{furnitureEmojiMap[task.furnitureId] || getModuleIcon((task.domain ?? task.type) as TaskDomain)}</Text>
                    <View style={styles.overdueRowContent}>
                      <Text style={styles.overdueRowTitle} numberOfLines={1}>{task.title}</Text>
                      {task.recurrence?.nextDue && (
                        <Text style={styles.overdueRowDue}>
                          {Math.ceil((new Date().getTime() - new Date(task.recurrence.nextDue).getTime()) / (1000 * 60 * 60 * 24))}일 연체
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </Animated.View>
        )}

        {/* ─── 월간 달력 ──────────────────────────────────── */}
        <View style={styles.calendarCard}>
          <Calendar
            current={initialDateRef.current}
            markedDates={markedDates}
            onDayPress={handleDayPress}
            onMonthChange={handleMonthChange}
            dayComponent={renderDayComponent}
            hideExtraDays={true}
            enableSwipeMonths
            renderHeader={(date) => {
              if (!date) return null;
              const year = date.getFullYear();
              const month = date.getMonth() + 1;
              return (
                <Text style={styles.calendarHeaderText}>{year}년 {month}월</Text>
              );
            }}
            theme={calendarTheme}
            style={styles.calendar}
          />
        </View>

        {/* ─── 모듈 필터 ──────────────────────────────────── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {MODULE_FILTERS.map(f => (
            <TouchableOpacity key={f.key} style={[styles.filterChip, filter === f.key && styles.filterChipActive]} onPress={() => setFilter(f.key)} activeOpacity={0.75}>
              <Text style={[styles.filterChipText, filter === f.key && styles.filterChipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ─── 선택일 task 목록 ────────────────────────────── */}
        <View style={styles.selectedSection}>
          <View style={styles.selectedHeader}>
            <Text style={styles.selectedDateLabel}>{selectedDateLabel}</Text>
            <View style={styles.selectedCountBadge}>
              <Text style={styles.selectedCountText}>{selectedDayOccurrences.length}</Text>
            </View>
          </View>

          {selectedDayOccurrences.length === 0 ? (
            <EmptyDay />
          ) : (
            selectedDayOccurrences.map(occ => (
              <TaskCard
                key={`${occ.task.id}-${toDateKey(occ.occurrenceDate)}`}
                task={occ.task}
                occurrenceDate={occ.occurrenceDate}
                isCompleted={occ.isCompleted}
                furnitureEmoji={furnitureEmojiMap[occ.task.furnitureId]}
                isLoading={taskLoadingStates[String(occ.task.id)] || false}
                onPress={() => openDetailModal(occ.task)}
                onCheck={() => handleCompleteTask(occ.task, occ.occurrenceDate)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* ─── Task 액션 모달 (미루기) ──────────────────────── */}
      <Modal
        visible={taskActionModal.visible}
        transparent
        animationType="slide"
        onRequestClose={() => setTaskActionModal({ visible: false, task: null, action: null })}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setTaskActionModal({ visible: false, task: null, action: null })} />
          <View style={styles.taskActionModalCompact}>
            {taskActionModal.task && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitleCompact} numberOfLines={1}>{taskActionModal.task.title}</Text>
                  <TouchableOpacity style={styles.closeButton} onPress={() => setTaskActionModal({ visible: false, task: null, action: null })}>
                    <Text style={styles.closeButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.postponeSectionCompact}>
                  <Text style={styles.postponeTitleCompact}>미루기</Text>
                  <View style={styles.postponeOptionsCompact}>
                    {[{ days: 1, label: '1일' }, { days: 2, label: '2일' }, { days: 3, label: '3일' }, { days: 7, label: '1주' }].map(option => (
                      <TouchableOpacity
                        key={option.days}
                        style={[styles.postponeOptionButton, postponeDays === option.days && styles.postponeOptionButtonActive]}
                        onPress={() => setPostponeDays(option.days)}
                      >
                        <Text style={[styles.postponeOptionText, postponeDays === option.days && styles.postponeOptionTextActive]}>{option.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={styles.postponeActions}>
                    <TouchableOpacity style={styles.postponeCancelButton} onPress={() => setTaskActionModal({ visible: false, task: null, action: null })}>
                      <Text style={styles.postponeCancelText}>취소</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.postponeConfirmButton} onPress={() => handlePostponeTask(taskActionModal.task!)}>
                      <Text style={styles.postponeConfirmText}>미루기</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ─── Task 상세 모달 ───────────────────────────────── */}
      <Modal
        visible={taskDetailModal.visible}
        transparent
        animationType="none"
        onRequestClose={() => setTaskDetailModal({ visible: false, task: null })}
      >
        <View style={styles.detailModalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setTaskDetailModal({ visible: false, task: null })} />
          <Animated.View style={[
            styles.taskDetailModal,
            {
              opacity: detailModalAnim,
              transform: [{ scale: detailModalAnim.interpolate({ inputRange: [0, 1], outputRange: [0.93, 1] }) }],
            },
          ]}>
            {taskDetailModal.task && (() => {
              const task = taskDetailModal.task!;
              // 달력에서 선택된 날짜 기준으로 완료 판정
              const [selY, selM, selD] = selectedDate.split('-').map(Number);
              const selDateObj = new Date(selY, selM - 1, selD);
              selDateObj.setHours(0, 0, 0, 0);
              const completed = task.recurrence?.type === 'fixed'
                ? isOccurrenceCompleted(task, selDateObj)
                : isTaskCompleted(task);
              const dueDate = task.recurrence?.nextDue ? new Date(task.recurrence.nextDue) : null;
              const today = new Date(); today.setHours(0, 0, 0, 0);
              const nextDue = dueDate ? new Date(dueDate) : null;
              if (nextDue) nextDue.setHours(0, 0, 0, 0);
              const hasPushedSchedule = nextDue && nextDue > today && (task.completionHistory?.length ?? 0) > 0;

              const diffMs = nextDue && !isNaN(nextDue.getTime()) ? nextDue.getTime() - today.getTime() : null;
              const diffDays = diffMs !== null ? Math.round(diffMs / (1000 * 60 * 60 * 24)) : null;
              const isOverdue = diffDays !== null && diffDays < 0;
              const isDueToday = diffDays === 0;

              let bannerBg = 'transparent';
              let bannerText = '';
              if (completed) { bannerBg = Colors.success + '18'; bannerText = '완료됨'; }
              else if (isOverdue) { bannerBg = Colors.error + '18'; bannerText = `${Math.abs(diffDays!)}일 연체 중`; }
              else if (isDueToday) { bannerBg = Colors.warning + '18'; bannerText = '오늘 마감'; }
              else if (diffDays !== null && diffDays <= 3) { bannerBg = Colors.primary + '12'; bannerText = `D-${diffDays}`; }

              const bannerTextColor = completed ? Colors.success : isOverdue ? Colors.error : isDueToday ? Colors.warning : Colors.primary;
              const furnitureEmoji = furnitureEmojiMap[task.furnitureId];

              return (
                <>
                  {/* 고정 헤더 */}
                  <View style={styles.detailHeaderFixed}>
                    {bannerText !== '' && (
                      <View style={[styles.detailStatusBanner, { backgroundColor: bannerBg }]}>
                        <Text style={[styles.detailStatusBannerText, { color: bannerTextColor }]}>{bannerText}</Text>
                      </View>
                    )}
                    <View style={styles.detailHeaderRow}>
                      <View style={styles.detailHeaderTitleRow}>
                        {furnitureEmoji && <Text style={styles.detailFurnitureEmoji}>{furnitureEmoji}</Text>}
                        <Text style={styles.detailTitle} numberOfLines={2}>{task.title}</Text>
                      </View>
                      <TouchableOpacity style={styles.closeButton} onPress={() => setTaskDetailModal({ visible: false, task: null })}>
                        <Text style={styles.closeButtonText}>×</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.detailModuleLabel}>{getModuleLabel((task.domain ?? task.type) as TaskDomain)}</Text>
                  </View>

                  {/* 탭 바 */}
                  {(() => {
                    const hasWhy = !!(detailTemplateDetail?.whyNeeded);
                    const hasHow = !!(detailTemplateDetail?.howTo || detailTemplateDetail?.imageUrls?.length);
                    const tabs: { key: 'info' | 'why' | 'how'; label: string; available: boolean }[] = [
                      { key: 'info', label: '정보', available: true },
                      { key: 'why', label: '이유', available: hasWhy },
                      { key: 'how', label: '진행방법', available: hasHow },
                    ];
                    return (
                      <View style={styles.detailTabBar}>
                        {tabs.map((tab) => {
                          const isActive = detailActiveTab === tab.key;
                          const isDisabled = !tab.available;
                          return (
                            <TouchableOpacity
                              key={tab.key}
                              style={[
                                styles.detailTabBarItem,
                                isActive && styles.detailTabBarItemActive,
                                isDisabled && styles.detailTabBarItemDisabled,
                              ]}
                              onPress={() => { if (!isDisabled) setDetailActiveTab(tab.key); }}
                              activeOpacity={isDisabled ? 1 : 0.75}
                              disabled={isDisabled}
                            >
                              <Text style={[
                                styles.detailTabBarItemText,
                                isActive && styles.detailTabBarItemTextActive,
                                isDisabled && styles.detailTabBarItemTextDisabled,
                              ]}>
                                {tab.label}
                              </Text>
                              {!tab.available && (
                                <View style={styles.detailTabBarPrepBadge}>
                                  <Text style={styles.detailTabBarPrepBadgeText}>준비중</Text>
                                </View>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    );
                  })()}

                  {/* 스크롤 콘텐츠 */}
                  <ScrollView style={styles.detailScrollContent} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Spacing.md }}>
                    {/* 이유 탭 */}
                    {detailActiveTab === 'why' && (
                      <CalendarTaskDetailTabContent
                        content={detailTemplateDetail?.whyNeeded}
                        icon="📌"
                        title="왜 해야 하나요?"
                      />
                    )}
                    {/* 진행방법 탭 */}
                    {detailActiveTab === 'how' && (
                      <CalendarTaskDetailTabContent
                        content={detailTemplateDetail?.howTo}
                        icon="📋"
                        title="어떻게 하나요?"
                        imageUrls={detailTemplateDetail?.imageUrls}
                        referenceLinks={detailTemplateDetail?.referenceLinks}
                      />
                    )}
                    {/* 정보 탭 */}
                    {detailActiveTab === 'info' && <View style={styles.detailSummaryCardV2}>
                      {dueDate && (
                        <View style={styles.detailSummaryRowItem}>
                          <Text style={styles.detailSummaryIcon}>📅</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.detailSummaryLabel}>다음 예정일</Text>
                            <Text style={[styles.detailSummaryValue, isOverdue && { color: Colors.error }, isDueToday && { color: Colors.warning }]}>
                              {task.recurrence?.hasTime
                                ? dueDate.toLocaleString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit' })
                                : dueDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
                            </Text>
                          </View>
                          {diffDays !== null && (
                            <View style={[styles.detailDdayBadge, isOverdue && { backgroundColor: Colors.error + '18' }, isDueToday && { backgroundColor: Colors.warning + '18' }, !isOverdue && !isDueToday && { backgroundColor: Colors.primary + '12' }]}>
                              <Text style={[styles.detailDdayText, isOverdue && { color: Colors.error }, isDueToday && { color: Colors.warning }, !isOverdue && !isDueToday && { color: Colors.primary }]}>
                                {completed ? '완료' : isOverdue ? `+${Math.abs(diffDays)}` : isDueToday ? 'D-Day' : `D-${diffDays}`}
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                      {/* 제목 행 */}
                      <TouchableOpacity
                        style={[
                          styles.detailSummaryRowItem,
                          styles.detailSummaryRowItemBorder,
                          editingField === 'title' && styles.detailSummaryRowItemActive,
                        ]}
                        onPress={() => {
                          if (editingField === 'title') {
                            setEditingField(null);
                          } else {
                            setEditTitle(task.title);
                            setEditingField('title');
                          }
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.detailSummaryIcon}>✏️</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.detailSummaryLabel}>제목</Text>
                          <Text style={[
                            styles.detailSummaryValue,
                            editingField === 'title' && { color: Colors.primary },
                          ]}>
                            {task.title}
                          </Text>
                        </View>
                        <Text style={styles.detailEditIcon}>{editingField === 'title' ? '▲' : '✏️'}</Text>
                      </TouchableOpacity>
                      {editingField === 'title' && (
                        <View style={styles.detailEditPanelInCard}>
                          <TextInput
                            style={styles.titleInput}
                            value={editTitle}
                            onChangeText={setEditTitle}
                            placeholder={task.title}
                            placeholderTextColor={Colors.textSecondary}
                            autoFocus
                            returnKeyType="done"
                            onSubmitEditing={() => handleUpdateTitle(task, editTitle)}
                            maxLength={100}
                          />
                          <View style={styles.detailRecurrenceEditorActions}>
                            <TouchableOpacity
                              style={styles.detailInlineSaveBtn}
                              onPress={() => handleUpdateTitle(task, editTitle)}
                              activeOpacity={0.85}
                            >
                              <Text style={styles.detailInlineSaveBtnText}>저장</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.detailInlineCancelBtn}
                              onPress={() => setEditingField(null)}
                              activeOpacity={0.8}
                            >
                              <Text style={styles.detailInlineCancelBtnText}>취소</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}

                      {/* 설명 행 */}
                      <TouchableOpacity
                        style={[
                          styles.detailSummaryRowItem,
                          styles.detailSummaryRowItemBorder,
                          editingField === 'description' && styles.detailSummaryRowItemActive,
                        ]}
                        onPress={() => {
                          if (editingField === 'description') {
                            setEditingField(null);
                          } else {
                            setEditDescription(task.description ?? '');
                            setEditingField('description');
                          }
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.detailSummaryIcon}>📝</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.detailSummaryLabel}>설명</Text>
                          <Text style={[
                            styles.detailSummaryValue,
                            editingField === 'description' && { color: Colors.primary },
                            !task.description && { color: Colors.textSecondary },
                          ]}>
                            {task.description || '미입력'}
                          </Text>
                        </View>
                        <Text style={styles.detailEditIcon}>{editingField === 'description' ? '▲' : '✏️'}</Text>
                      </TouchableOpacity>
                      {editingField === 'description' && (
                        <View style={styles.detailEditPanelInCard}>
                          <TextInput
                            style={[styles.titleInput, styles.descriptionInput]}
                            value={editDescription}
                            onChangeText={setEditDescription}
                            placeholder="설명을 입력하세요"
                            placeholderTextColor={Colors.textSecondary}
                            autoFocus
                            multiline
                            returnKeyType="default"
                            maxLength={500}
                          />
                          <View style={styles.detailRecurrenceEditorActions}>
                            <TouchableOpacity
                              style={styles.detailInlineSaveBtn}
                              onPress={() => handleUpdateDescription(task, editDescription)}
                              activeOpacity={0.85}
                            >
                              <Text style={styles.detailInlineSaveBtnText}>저장</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.detailInlineCancelBtn}
                              onPress={() => setEditingField(null)}
                              activeOpacity={0.8}
                            >
                              <Text style={styles.detailInlineCancelBtnText}>취소</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}

                      {task.recurrence?.type === 'fixed' && (
                        <>
                          <TouchableOpacity
                            style={[
                              styles.detailSummaryRowItem,
                              styles.detailSummaryRowItemBorder,
                              editingField === 'recurrence' && styles.detailSummaryRowItemActive,
                            ]}
                            onPress={() => {
                              if (editingField === 'recurrence') {
                                setEditingField(null);
                              } else {
                                const r = task.recurrence;
                                const unit: 'day' | 'week' | 'month' =
                                  r?.unit === 'day' ? 'day' : r?.unit === 'month' ? 'month' : 'week';
                                setEditRecurrenceUnit(unit);
                                setEditRecurrenceInterval(r?.interval ?? 1);
                                setEditStartDate(r?.nextDue ? new Date(r.nextDue) : new Date());
                                setEditHasTime(r?.hasTime ?? false);
                                setEditSelectedDays((r?.selectedDays ?? []) as DayOfWeek[]);
                                setEditingField('recurrence');
                              }
                            }}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.detailSummaryIcon}>🔁</Text>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.detailSummaryLabel}>반복 주기</Text>
                              <Text style={[styles.detailSummaryValue, editingField === 'recurrence' && { color: Colors.primary }]}>
                                {task.recurrence.interval}{task.recurrence.unit === 'day' ? '일' : task.recurrence.unit === 'week' ? '주' : '개월'}마다
                              </Text>
                            </View>
                            <Text style={styles.detailEditIcon}>{editingField === 'recurrence' ? '▲' : '✏️'}</Text>
                          </TouchableOpacity>

                          {editingField === 'recurrence' && (
                            <View style={styles.detailEditPanel}>
                              <RecurrenceEditor
                                unit={editRecurrenceUnit}
                                interval={editRecurrenceInterval}
                                selectedDays={editSelectedDays}
                                startDate={editStartDate}
                                onUnitChange={setEditRecurrenceUnit}
                                onIntervalChange={setEditRecurrenceInterval}
                                onToggleDayOfWeek={day => setEditSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])}
                                onStartDateChange={setEditStartDate}
                                getNextOccurrences={getNextOccurrences}
                                hasTime={editHasTime}
                                onHasTimeChange={setEditHasTime}
                              />
                              <View style={styles.detailRecurrenceEditorActions}>
                                <TouchableOpacity
                                  style={styles.detailInlineCancelBtn}
                                  onPress={() => setEditingField(null)}
                                >
                                  <Text style={styles.detailInlineCancelBtnText}>취소</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={styles.detailInlineSaveBtn}
                                  onPress={() => handleUpdateRecurrence(task, editRecurrenceUnit, editRecurrenceInterval, editStartDate, editHasTime, editSelectedDays)}
                                >
                                  <Text style={styles.detailInlineSaveBtnText}>저장</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          )}
                        </>
                      )}
                      <TouchableOpacity
                        style={[
                          styles.detailSummaryRowItem,
                          styles.detailSummaryRowItemBorder,
                          editingField === 'minutes' && styles.detailSummaryRowItemActiveOrange,
                        ]}
                        onPress={() => {
                          if (editingField === 'minutes') {
                            setEditingField(null);
                          } else {
                            setEditMinutes(task.estimatedMinutes > 0 ? task.estimatedMinutes : 15);
                            setEditingField('minutes');
                          }
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.detailSummaryIcon}>⏱</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.detailSummaryLabel}>예상 소요</Text>
                          <Text style={[styles.detailSummaryValue, editingField === 'minutes' && { color: Colors.warning }]}>
                            {task.estimatedMinutes > 0 ? `${task.estimatedMinutes}분` : '미설정'}
                          </Text>
                        </View>
                        <Text style={styles.detailEditIcon}>{editingField === 'minutes' ? '▲' : '✏️'}</Text>
                      </TouchableOpacity>

                      {editingField === 'minutes' && (
                        <View style={[styles.detailEditPanel, styles.detailEditPanelHeaderMinutes]}>
                          <View style={styles.detailInlineIntervalRow}>
                            <TouchableOpacity
                              style={styles.detailInlineStepBtn}
                              onPress={() => setEditMinutes(m => Math.max(5, m - 5))}
                            >
                              <Text style={styles.detailInlineStepText}>−</Text>
                            </TouchableOpacity>
                            <View style={styles.detailInlineValueBox}>
                              <Text style={styles.detailInlineNumber}>{editMinutes}</Text>
                              <Text style={styles.detailInlineUnit}>분</Text>
                            </View>
                            <TouchableOpacity
                              style={styles.detailInlineStepBtn}
                              onPress={() => setEditMinutes(m => Math.min(180, m + 5))}
                            >
                              <Text style={styles.detailInlineStepText}>+</Text>
                            </TouchableOpacity>
                          </View>
                          <View style={styles.detailRecurrenceEditorActions}>
                            <TouchableOpacity
                              style={styles.detailInlineCancelBtn}
                              onPress={() => setEditingField(null)}
                            >
                              <Text style={styles.detailInlineCancelBtnText}>취소</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.detailInlineSaveBtn}
                              onPress={() => handleUpdateMinutes(task, editMinutes)}
                            >
                              <Text style={styles.detailInlineSaveBtnText}>저장</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </View>}
                  </ScrollView>

                  {/* 고정 액션 버튼 */}
                  <View style={styles.detailActionsFixed}>
                    <View style={styles.detailActionsRow}>
                      <TouchableOpacity
                        style={[styles.detailActionCompactBtn, completed ? styles.detailCompleteBtnUndo : styles.detailCompleteBtnDone]}
                        onPress={() => {
                          const [y, m, d] = selectedDate.split('-').map(Number);
                          const selDate = new Date(y, m - 1, d);
                          selDate.setHours(0, 0, 0, 0);
                          handleCompleteTask(task, selDate);
                          setTaskDetailModal({ visible: false, task: null });
                        }}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.detailActionCompactIcon}>{completed ? '↩' : '✓'}</Text>
                        <Text style={styles.detailActionCompactText}>{completed ? '완료 취소' : '완료'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.detailActionCompactBtn, styles.detailSubBtn]}
                        onPress={() => { setTaskDetailModal({ visible: false, task: null }); setTaskActionModal({ visible: true, task, action: 'postpone' }); }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.detailActionCompactIcon}>⏰</Text>
                        <Text style={[styles.detailActionCompactText, { color: Colors.primary }]}>미루기</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.detailActionCompactBtn, styles.detailDeleteBtn]}
                        onPress={() => { setTaskDetailModal({ visible: false, task: null }); handleDeleteTask(task); }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.detailActionCompactIcon}>🗑</Text>
                        <Text style={[styles.detailActionCompactText, styles.detailDeleteBtnText]}>삭제</Text>
                      </TouchableOpacity>
                    </View>
                    {hasPushedSchedule && (
                      <TouchableOpacity style={styles.detailRevertBtn} activeOpacity={0.8}
                        onPress={async () => {
                          if (!userId) return;
                          const todayReset = new Date(); todayReset.setHours(0, 0, 0, 0);
                          const revertFields: Partial<Task> = {
                            recurrence: { ...task.recurrence!, nextDue: todayReset },
                            lastCompletedAt: undefined,
                            completionDates: [],
                            completionHistory: [],
                            status: 'pending',
                            updatedAt: new Date(),
                          };
                          await updateTask(userId, String(task.id), revertFields);
                          setMonthTasks(prev => prev.map(t => t.id === task.id ? { ...t, ...revertFields } : t));
                          setTaskDetailModal({ visible: false, task: null });
                        }}
                      >
                        <Text style={styles.detailRevertBtnText}>📌  원래 일정으로 복원</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              );
            })()}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

// ─── TaskCard 컴포넌트 ────────────────────────────────────────
interface TaskCardProps {
  task: Task;
  /** 달력에서 클릭된 발생 날짜. 카테고리(오늘/연체/예정) 판정에 사용 */
  occurrenceDate?: Date;
  /** occurrence 기반 완료 여부. 미전달 시 isTaskCompleted(task)로 fallback */
  isCompleted?: boolean;
  furnitureEmoji?: string;
  isLoading: boolean;
  onPress: () => void;
  onCheck: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, occurrenceDate, isCompleted: isCompletedProp, furnitureEmoji, isLoading, onPress, onCheck }) => {
  const completed = isCompletedProp !== undefined ? isCompletedProp : isTaskCompleted(task);

  // occurrenceDate가 있으면 해당 날짜 기준으로 카테고리 판정, 없으면 nextDue 기준
  const categoryDate = occurrenceDate ?? (task.recurrence?.nextDue ? new Date(task.recurrence.nextDue) : null);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const categoryDateMs = categoryDate ? new Date(categoryDate).setHours(0, 0, 0, 0) : null;
  const category: 'overdue' | 'today' | 'upcoming' = categoryDateMs === null
    ? 'upcoming'
    : categoryDateMs < today.getTime()
    ? 'overdue'
    : categoryDateMs === today.getTime()
    ? 'today'
    : 'upcoming';

  const dueDate = occurrenceDate ?? (task.recurrence?.nextDue ? new Date(task.recurrence.nextDue) : null);
  const overdueDays = dueDate && category === 'overdue'
    ? Math.ceil((new Date().getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const accentStyle = category === 'overdue'
    ? styles.taskCardAccentOverdue
    : category === 'today'
    ? styles.taskCardAccentToday
    : styles.taskCardAccentUpcoming;

  const cardBg = category === 'overdue'
    ? styles.taskCardOverdue
    : category === 'today'
    ? styles.taskCardToday
    : undefined;

  const checkboxStyle = category === 'today'
    ? styles.taskCheckboxNewToday
    : category === 'overdue'
    ? styles.taskCheckboxNewOverdue
    : undefined;

  const displayEmoji = furnitureEmoji || getModuleIcon((task.domain ?? task.type) as TaskDomain);

  return (
    <TouchableOpacity
      style={[styles.taskCard, cardBg, completed && styles.taskCardCompleted]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={accentStyle} />
      {/* 체크박스 */}
      <TouchableOpacity
        style={[styles.taskCheckboxNew, checkboxStyle, completed && styles.taskCheckboxNewCompleted, isLoading && styles.taskCheckboxNewLoading]}
        onPress={(e) => { e.stopPropagation(); if (!isLoading) onCheck(); }}
        activeOpacity={isLoading ? 1 : 0.4}
        disabled={isLoading}
      >
        {isLoading
          ? <ActivityIndicator size="small" color={Colors.white} />
          : completed
          ? <Text style={styles.taskCheckboxCheck}>✓</Text>
          : null
        }
      </TouchableOpacity>

      {/* 가구/모듈 이모지 */}
      <Text style={styles.taskCardEmoji}>{displayEmoji}</Text>

      {/* 본문 */}
      <View style={styles.taskCardBody}>
        <View style={styles.taskCardTitleRow}>
          <Text style={[styles.taskCardTitle, completed && styles.taskCardTitleCompleted]} numberOfLines={1}>
            {task.title}
          </Text>
          <View style={[
            styles.priorityPill,
            task.priority === 'high' && styles.priorityPillHigh,
            task.priority === 'medium' && styles.priorityPillMedium,
            task.priority === 'low' && styles.priorityPillLow,
          ]}>
            <Text style={[
              styles.priorityPillText,
              task.priority === 'high' && styles.priorityPillTextHigh,
              task.priority === 'medium' && styles.priorityPillTextMedium,
              task.priority === 'low' && styles.priorityPillTextLow,
            ]}>
              {task.priority === 'urgent' ? '긴급' : task.priority === 'high' ? '높음' : task.priority === 'medium' ? '보통' : '낮음'}
            </Text>
          </View>
        </View>
        <View style={styles.taskCardChipRow}>
          {category === 'overdue' && (
            <View style={styles.taskChipOverdue}>
              <Text style={styles.taskChipTextOverdue}>{overdueDays}일 연체</Text>
            </View>
          )}
          {category === 'today' && (
            <View style={completed ? styles.taskChipCompleted : styles.taskChipToday}>
              <Text style={completed ? styles.taskChipTextCompleted : styles.taskChipTextToday}>
                {completed ? '완료됨' : '오늘 마감'}
              </Text>
            </View>
          )}
          {category === 'upcoming' && dueDate && (
            <View style={styles.taskChipUpcoming}>
              <Text style={styles.taskChipTextUpcoming}>
                {dueDate.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}
              </Text>
            </View>
          )}
          {task.recurrence?.type === 'fixed' && (
            <View style={styles.taskChipRecurrence}>
              <Text style={styles.taskChipTextRecurrence}>
                🔁 {task.recurrence.unit === 'day' ? '매일' : task.recurrence.unit === 'week' ? '매주' : '매월'}
              </Text>
            </View>
          )}
          {dueDate && task.estimatedMinutes > 0 && (
            <View style={styles.taskChipTime}>
              <Text style={styles.taskChipTextTime}>⏱ {task.estimatedMinutes}분</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const EmptyDay: React.FC = () => (
  <View style={styles.emptyDay}>
    <Text style={styles.emptyDayIcon}>✅</Text>
    <Text style={styles.emptyDayText}>이 날에는 할 일이 없어요</Text>
    <Text style={styles.emptyDaySubtext}>여유로운 하루입니다</Text>
  </View>
);

const CalendarTaskDetailTabContent: React.FC<{
  content?: string;
  icon: string;
  title: string;
  imageUrls?: string[];
  referenceLinks?: { label: string; url: string }[];
}> = ({ content, icon, title, imageUrls, referenceLinks }) => (
  <View style={styles.calDetailTabContainer}>
    <View style={styles.calDetailTabTitleRow}>
      <Text style={styles.calDetailTabIcon}>{icon}</Text>
      <Text style={styles.calDetailTabTitle}>{title}</Text>
    </View>
    {content ? (
      <Text style={styles.calDetailTabContent}>{content}</Text>
    ) : (
      <View style={styles.calDetailTabEmptyBox}>
        <Text style={styles.calDetailTabEmptyText}>아직 내용이 준비 중이에요</Text>
      </View>
    )}
    {imageUrls && imageUrls.length > 0 && (
      <View style={styles.calDetailTabImageList}>
        {imageUrls.map((url, idx) => (
          <Image
            key={idx}
            source={{ uri: url }}
            style={styles.calDetailTabImage}
            resizeMode="cover"
          />
        ))}
      </View>
    )}
    {referenceLinks && referenceLinks.length > 0 && (
      <View style={styles.calDetailTabLinkList}>
        <Text style={styles.calDetailTabLinkSectionLabel}>참고 자료</Text>
        {referenceLinks.map((link, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.calDetailTabLinkItem}
            onPress={() => Linking.openURL(link.url)}
            activeOpacity={0.7}
          >
            <Text style={styles.calDetailTabLinkIcon}>
              {link.url.includes('youtube.com') || link.url.includes('youtu.be') ? '▶' : '🔗'}
            </Text>
            <Text style={styles.calDetailTabLinkLabel} numberOfLines={1}>
              {link.label}
            </Text>
            <Text style={styles.calDetailTabLinkArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    )}
  </View>
);

// ─── 달력 테마 ────────────────────────────────────────────────
const calendarTheme = {
  backgroundColor: Colors.surface,
  calendarBackground: Colors.surface,
  textSectionTitleColor: Colors.textSecondary,
  selectedDayBackgroundColor: Colors.primary,
  selectedDayTextColor: Colors.white,
  todayTextColor: Colors.primary,
  dayTextColor: Colors.textPrimary,
  textDisabledColor: Colors.textDisabled,
  dotColor: Colors.primary,
  selectedDotColor: Colors.white,
  arrowColor: Colors.primary,
  disabledArrowColor: Colors.lightGray,
  monthTextColor: Colors.textPrimary,
  indicatorColor: Colors.primary,
  textDayFontWeight: '400' as const,
  textMonthFontWeight: '700' as const,
  textDayHeaderFontWeight: '600' as const,
  textDayFontSize: 13,
  textMonthFontSize: 14,
  textDayHeaderFontSize: 10,
};

// ─── 스타일 ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  contentContainer: { paddingBottom: 120 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, gap: Spacing.md },
  loadingText: { ...Typography.bodySmall, color: Colors.textSecondary },

  // 연체 배너
  overdueBanner: { margin: Spacing.md, marginBottom: 0, backgroundColor: Colors.error + '10', borderRadius: 12, borderWidth: 1, borderColor: Colors.error + '30', overflow: 'hidden' },
  overdueBannerInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 4 },
  overdueLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  overdueIcon: { fontSize: 22 },
  overdueBannerTitle: { ...Typography.label, color: Colors.error },
  overdueBannerSub: { ...Typography.caption, color: Colors.error + 'AA', marginTop: 2 },
  overdueChevron: { fontSize: 12, color: Colors.error },
  overdueList: { borderTopWidth: 1, borderTopColor: Colors.error + '20', paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm },
  overdueRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, gap: Spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.error + '20' },
  overdueRowIcon: { fontSize: 18 },
  overdueRowContent: { flex: 1 },
  overdueRowTitle: { ...Typography.bodySmall, color: Colors.textPrimary, fontWeight: '500' },
  overdueRowDue: { ...Typography.caption, color: Colors.error, marginTop: 1 },

  // 달력
  calendarCard: { marginTop: Spacing.sm, marginHorizontal: Spacing.md, marginBottom: 0, backgroundColor: Colors.surface, borderRadius: 16, overflow: 'hidden', ...Shadows.small },
  calendar: { borderRadius: 16, paddingBottom: 4 },
  calendarHeaderText: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  dayCell: { width: 32, height: 52, justifyContent: 'flex-start', alignItems: 'center', paddingTop: 2 },
  // 라운드 사각형 뱃지 (위)
  dayCellRect: { width: 28, height: 28, borderRadius: 7, justifyContent: 'center', alignItems: 'center', marginBottom: 3 },
  dayCellRectEmpty: { backgroundColor: Colors.veryLightGray },
  dayCellRectPending: { backgroundColor: '#D0D0D0' },
  dayCellRectDone: { backgroundColor: '#D0E8D0', borderWidth: 1.5, borderColor: Colors.secondary },
  dayCellCountText: { fontSize: 13, fontWeight: '700', lineHeight: 16, color: Colors.white },
  dayCellCheckText: { fontSize: 13, fontWeight: '700', lineHeight: 16, color: Colors.secondary },
  // 날짜 숫자 (아래, 항상 표시)
  dayCellDaySmall: { fontSize: 11, fontWeight: '500', lineHeight: 13 },
  dayCellSelectedCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  dayCellDaySelected: { fontSize: 11, fontWeight: '800', color: Colors.white, lineHeight: 13 },
  dayCellTodayCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#BBBBBB', justifyContent: 'center', alignItems: 'center' },
  dayCellDayTodayInCircle: { fontSize: 11, fontWeight: '700', color: Colors.white, lineHeight: 13 },

  // 필터
  filterRow: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.sm },
  filterChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.veryLightGray },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText: { ...Typography.labelSmall, color: Colors.textSecondary },
  filterChipTextActive: { color: Colors.white },

  // 선택일
  selectedSection: { paddingHorizontal: Spacing.md, paddingTop: Spacing.xs },
  selectedHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm, paddingVertical: Spacing.xs },
  selectedDateLabel: { ...Typography.label, color: Colors.textPrimary, flex: 1 },
  selectedCountBadge: { backgroundColor: Colors.primary, borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  selectedCountText: { ...Typography.caption, color: Colors.white, fontWeight: '700' },

  // task 카드 (FurnitureTasksTab과 동일)
  taskCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 12, marginBottom: Spacing.sm, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2, overflow: 'hidden' },
  taskCardOverdue: { backgroundColor: Colors.error + '06' },
  taskCardToday: { backgroundColor: Colors.primary + '06' },
  taskCardCompleted: { opacity: 0.6, backgroundColor: Colors.success + '08' },
  taskCardAccentOverdue: { width: 4, alignSelf: 'stretch', backgroundColor: Colors.error },
  taskCardAccentToday: { width: 4, alignSelf: 'stretch', backgroundColor: Colors.primary },
  taskCardAccentUpcoming: { width: 4, alignSelf: 'stretch', backgroundColor: Colors.lightGray },
  taskCardEmoji: { fontSize: 20, marginHorizontal: 6 },

  // 체크박스
  taskCheckboxNew: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: Colors.lightGray, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center', marginLeft: Spacing.sm, marginRight: Spacing.sm, flexShrink: 0 },
  taskCheckboxNewToday: { borderColor: Colors.primary },
  taskCheckboxNewOverdue: { borderColor: Colors.error },
  taskCheckboxNewCompleted: { backgroundColor: Colors.success, borderColor: Colors.success },
  taskCheckboxNewLoading: { backgroundColor: Colors.gray, borderColor: Colors.gray },
  taskCheckboxCheck: { fontSize: 13, color: Colors.white, fontWeight: '700', lineHeight: 16 },

  // 카드 본문
  taskCardBody: { flex: 1, paddingVertical: Spacing.md, paddingRight: Spacing.md },
  taskCardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
  taskCardTitle: { ...Typography.body, color: Colors.textPrimary, fontWeight: '600', fontSize: 14, flex: 1, lineHeight: 18, marginRight: Spacing.xs },
  taskCardTitleCompleted: { textDecorationLine: 'line-through' as const, color: Colors.textSecondary },
  taskCardChipRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },

  // 우선순위 pill
  priorityPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10, backgroundColor: Colors.veryLightGray, flexShrink: 0 },
  priorityPillHigh: { backgroundColor: Colors.error + '20' },
  priorityPillMedium: { backgroundColor: Colors.warning + '20' },
  priorityPillLow: { backgroundColor: Colors.success + '20' },
  priorityPillText: { fontSize: 10, fontWeight: '600', color: Colors.textSecondary },
  priorityPillTextHigh: { color: Colors.error },
  priorityPillTextMedium: { color: Colors.warning },
  priorityPillTextLow: { color: Colors.success },

  // task 칩
  taskChipOverdue: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, backgroundColor: Colors.error + '18' },
  taskChipTextOverdue: { fontSize: 11, fontWeight: '600', color: Colors.error },
  taskChipToday: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, backgroundColor: Colors.primary + '18' },
  taskChipTextToday: { fontSize: 11, fontWeight: '600', color: Colors.primary },
  taskChipCompleted: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, backgroundColor: Colors.success + '18' },
  taskChipTextCompleted: { fontSize: 11, fontWeight: '600', color: Colors.success },
  taskChipUpcoming: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, backgroundColor: Colors.veryLightGray },
  taskChipTextUpcoming: { fontSize: 11, fontWeight: '500', color: Colors.textSecondary },
  taskChipRecurrence: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, backgroundColor: Colors.veryLightGray },
  taskChipTextRecurrence: { fontSize: 11, color: Colors.textSecondary },
  taskChipTime: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, backgroundColor: Colors.veryLightGray },
  taskChipTextTime: { fontSize: 11, color: Colors.textSecondary },

  // 빈 상태
  emptyDay: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.xs },
  emptyDayIcon: { fontSize: 40, marginBottom: Spacing.sm },
  emptyDayText: { ...Typography.body, color: Colors.textPrimary, fontWeight: '500' },
  emptyDaySubtext: { ...Typography.bodySmall, color: Colors.textSecondary },

  // 액션 모달
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  taskActionModalCompact: { backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 34, paddingHorizontal: Spacing.md },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.md },
  modalTitleCompact: { ...Typography.label, color: Colors.textPrimary, flex: 1, marginRight: Spacing.sm },
  closeButton: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.veryLightGray, justifyContent: 'center', alignItems: 'center' },
  closeButtonText: { fontSize: 18, color: Colors.textSecondary, lineHeight: 22 },
  postponeSectionCompact: { paddingBottom: Spacing.md },
  postponeTitleCompact: { ...Typography.label, color: Colors.textPrimary, marginBottom: Spacing.sm },
  postponeOptionsCompact: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  postponeOptionButton: { flex: 1, paddingVertical: Spacing.sm, borderRadius: 10, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.veryLightGray, alignItems: 'center' },
  postponeOptionButtonActive: { backgroundColor: Colors.primary + '18', borderColor: Colors.primary },
  postponeOptionText: { ...Typography.label, color: Colors.textSecondary },
  postponeOptionTextActive: { color: Colors.primary },
  postponeActions: { flexDirection: 'row', gap: Spacing.sm },
  postponeCancelButton: { flex: 1, paddingVertical: Spacing.sm + 2, borderRadius: 10, backgroundColor: Colors.background, alignItems: 'center' },
  postponeCancelText: { ...Typography.label, color: Colors.textSecondary },
  postponeConfirmButton: { flex: 2, paddingVertical: Spacing.sm + 2, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center' },
  postponeConfirmText: { ...Typography.label, color: Colors.white },

  // 상세 모달
  detailModalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.45)' },
  taskDetailModal: { backgroundColor: Colors.surface, borderRadius: 16, width: '92%', maxHeight: '82%', overflow: 'hidden' },
  detailHeaderFixed: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.veryLightGray },
  detailStatusBanner: { borderRadius: 8, paddingHorizontal: Spacing.sm, paddingVertical: 4, marginBottom: Spacing.sm, alignSelf: 'flex-start' },
  detailStatusBannerText: { ...Typography.labelSmall, fontWeight: '700' },
  detailHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  detailHeaderTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: Spacing.sm, marginRight: Spacing.sm },
  detailFurnitureEmoji: { fontSize: 22 },
  detailTitle: { ...Typography.h4, color: Colors.textPrimary, flex: 1 },
  detailModuleLabel: { ...Typography.caption, color: Colors.textSecondary, marginTop: 4 },
  detailScrollContent: { flexGrow: 0 },
  detailSummaryCardV2: { margin: Spacing.md, backgroundColor: Colors.background, borderRadius: 12, padding: Spacing.md, gap: Spacing.sm },
  detailSummaryRowItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  detailSummaryIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  detailSummaryLabel: { ...Typography.caption, color: Colors.textSecondary },
  detailSummaryValue: { ...Typography.bodySmall, color: Colors.textPrimary, fontWeight: '500' },
  detailDdayBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  detailDdayText: { ...Typography.labelSmall, fontWeight: '700' },
  detailActionsFixed: { padding: Spacing.md, paddingBottom: Spacing.lg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.veryLightGray, gap: Spacing.sm },
  detailActionsRow: { flexDirection: 'row', gap: Spacing.sm },
  detailActionCompactBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.sm + 2, borderRadius: 10, gap: 4 },
  detailCompleteBtnDone: { backgroundColor: Colors.success },
  detailCompleteBtnUndo: { backgroundColor: Colors.success + '20' },
  detailSubBtn: { backgroundColor: Colors.primary + '12', borderWidth: 1, borderColor: Colors.primary + '30' },
  detailDeleteBtn: { backgroundColor: Colors.error + '10' },
  detailActionCompactIcon: { fontSize: 14 },
  detailActionCompactText: { ...Typography.labelSmall, color: Colors.white, fontWeight: '600' },
  detailDeleteBtnText: { color: Colors.error },
  detailRevertBtn: { paddingVertical: Spacing.sm, alignItems: 'center', borderRadius: 10, backgroundColor: Colors.accent + '12', borderWidth: 1, borderColor: Colors.accent + '30' },
  detailRevertBtnText: { ...Typography.labelSmall, color: Colors.accent, fontWeight: '600' },

  // 편집 패널 스타일
  detailSummaryRowItemBorder: { paddingVertical: Spacing.xs, borderRadius: 8 },
  detailSummaryRowItemActive: { backgroundColor: Colors.primary + '08', padding: Spacing.xs },
  detailSummaryRowItemActiveOrange: { backgroundColor: Colors.warning + '08', padding: Spacing.xs },
  detailEditIcon: { fontSize: 14, color: Colors.textSecondary },
  detailEditPanel: {
    backgroundColor: Colors.background,
    borderRadius: 10,
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.veryLightGray,
  },
  detailEditPanelInCard: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.veryLightGray,
    backgroundColor: Colors.background,
  },
  titleInput: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: Colors.veryLightGray,
    borderRadius: 8,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    backgroundColor: Colors.white,
  },
  descriptionInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  detailEditPanelHeaderMinutes: {
    borderColor: Colors.warning + '40',
    borderWidth: 1.5,
  },
  detailInlineIntervalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  detailInlineStepBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center', alignItems: 'center',
  },
  detailInlineStepText: { fontSize: 20, color: Colors.primary, fontWeight: '700', lineHeight: 24 },
  detailInlineValueBox: { alignItems: 'center', minWidth: 72 },
  detailInlineNumber: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, lineHeight: 28 },
  detailInlineUnit: { ...Typography.caption, color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  detailRecurrenceEditorActions: {
    flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm,
  },
  detailInlineSaveBtn: {
    flex: 1, paddingVertical: Spacing.sm, borderRadius: 8,
    backgroundColor: Colors.primary, alignItems: 'center',
  },
  detailInlineSaveBtnText: { ...Typography.labelSmall, color: Colors.white, fontWeight: '700' },
  detailInlineCancelBtn: {
    flex: 1, paddingVertical: Spacing.sm, borderRadius: 8,
    backgroundColor: Colors.veryLightGray, alignItems: 'center',
  },
  detailInlineCancelBtnText: { ...Typography.labelSmall, color: Colors.textSecondary, fontWeight: '600' },

  // 상세 모달 탭 바
  detailTabBar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.veryLightGray,
    backgroundColor: Colors.surface,
  },
  detailTabBarItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm + 2,
    gap: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  detailTabBarItemActive: {
    borderBottomColor: Colors.primary,
  },
  detailTabBarItemDisabled: {
    opacity: 0.45,
  },
  detailTabBarItemText: {
    ...Typography.labelSmall,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  detailTabBarItemTextActive: {
    color: Colors.primary,
  },
  detailTabBarItemTextDisabled: {
    color: Colors.textDisabled,
  },
  detailTabBarPrepBadge: {
    backgroundColor: Colors.veryLightGray,
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  detailTabBarPrepBadgeText: {
    fontSize: 9,
    color: Colors.textSecondary,
  },

  // 탭 콘텐츠 (CalendarTaskDetailTabContent)
  calDetailTabContainer: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  calDetailTabTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  calDetailTabIcon: { fontSize: 18 },
  calDetailTabTitle: {
    ...Typography.label,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  calDetailTabContent: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  calDetailTabEmptyBox: {
    backgroundColor: Colors.veryLightGray,
    borderRadius: 10,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  calDetailTabEmptyText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  calDetailTabImageList: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  calDetailTabImage: {
    width: '100%',
    height: 180,
    borderRadius: 10,
  },
  calDetailTabLinkList: {
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  calDetailTabLinkSectionLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  calDetailTabLinkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 10,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  calDetailTabLinkIcon: { fontSize: 14 },
  calDetailTabLinkLabel: {
    ...Typography.bodySmall,
    color: Colors.primary,
    flex: 1,
  },
  calDetailTabLinkArrow: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
});
