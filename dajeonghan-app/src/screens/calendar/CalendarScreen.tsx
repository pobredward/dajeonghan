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
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import * as KoreanHolidays from 'korean-holidays';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/contexts/AuthContext';
import { getTasks, getOverdueTasks, updateTask } from '@/services/firestoreService';
import { getHouseLayout } from '@/services/houseService';
import { Task, ModuleType } from '@/types/task.types';
import { Colors, Typography, Spacing } from '@/constants';
import { Shadows } from '@/constants/Spacing';
import {
  isTaskCompleted,
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
type FilterType = 'all' | ModuleType;

const MODULE_FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'cleaning', label: '청소' },
  { key: 'food', label: '음식' },
  { key: 'medicine', label: '약' },
  { key: 'self_care', label: '자기관리' },
  { key: 'self_development', label: '자기계발' },
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

  // 가구 이모지 맵 (objectId → 가구 emoji)
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

  const bannerAnim = useRef(new Animated.Value(0)).current;
  const detailModalAnim = useRef(new Animated.Value(0)).current;
  const isFirstLoad = useRef(true);
  const yearRef = useRef(currentYear);
  const monthRef = useRef(currentMonth);

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
          furniture.linkedObjectIds?.forEach(objectId => {
            map[objectId] = furniture.emoji;
          });
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
      const { start, end } = getMonthRange(year, month);
      const [monthData, overdueData] = await Promise.all([
        getTasks(userId, {
          filter: { dueDateRange: { start, end } },
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
  const handleCompleteTask = useCallback(async (task: Task) => {
    const taskId = String(task.id);
    if (!userId || !taskId) return;

    const currentlyCompleted = isTaskCompleted(task);
    setTaskLoadingStates(prev => ({ ...prev, [taskId]: true }));

    try {
      let updatedFields: Partial<Task>;

      if (currentlyCompleted) {
        // 완료 취소
        if (task.recurrence?.type === 'fixed') {
          const currentDue = task.recurrence.nextDue ? new Date(task.recurrence.nextDue) : new Date();
          const interval = task.recurrence.interval || 1;
          const unit = task.recurrence.unit || 'day';
          const previousDue = new Date(currentDue);
          if (unit === 'day') previousDue.setDate(previousDue.getDate() - interval);
          else if (unit === 'week') previousDue.setDate(previousDue.getDate() - interval * 7);
          else if (unit === 'month') previousDue.setMonth(previousDue.getMonth() - interval);

          const completionDates = [...(task.completionDates || [])];
          const dueDateString = currentDue.toDateString();
          const idx = completionDates.indexOf(dueDateString);
          if (idx > -1) completionDates.splice(idx, 1);

          updatedFields = {
            recurrence: { ...task.recurrence, nextDue: previousDue },
            lastCompletedAt: completionDates.length > 0 ? new Date() : undefined,
            completionDates,
            status: 'pending',
            updatedAt: new Date(),
          };
        } else {
          updatedFields = {
            isCompleted: false,
            status: 'pending',
            updatedAt: new Date(),
          };
        }
      } else {
        // 완료 처리
        if (task.recurrence?.type === 'fixed') {
          const currentDue = task.recurrence.nextDue ? new Date(task.recurrence.nextDue) : new Date();
          const nextDue = new Date(currentDue);
          const interval = task.recurrence.interval || 1;
          const unit = task.recurrence.unit || 'day';
          if (unit === 'day') nextDue.setDate(nextDue.getDate() + interval);
          else if (unit === 'week') nextDue.setDate(nextDue.getDate() + interval * 7);
          else if (unit === 'month') nextDue.setMonth(nextDue.getMonth() + interval);

          const completionDates = task.completionDates ? [...task.completionDates] : [];
          const dueDateString = currentDue.toDateString();
          if (!completionDates.includes(dueDateString)) completionDates.push(dueDateString);

          updatedFields = {
            recurrence: { ...task.recurrence, nextDue },
            lastCompletedAt: new Date(),
            completionDates,
            completionHistory: [...(task.completionHistory || []), { date: new Date(), postponed: false }],
            status: 'pending',
            updatedAt: new Date(),
          };
        } else {
          updatedFields = {
            isCompleted: true,
            completedAt: new Date(),
            updatedAt: new Date(),
          };
        }
      }

      await updateTask(userId, taskId, updatedFields);

      // 낙관적 UI 업데이트
      setMonthTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updatedFields } : t));
      if (currentlyCompleted) {
        // 완료 취소 → 연체 목록 내 task 필드 갱신 (다시 연체 상태)
        setOverdueTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updatedFields } : t));
      } else {
        // 완료 처리 → 연체 목록에서 제거
        setOverdueTasks(prev => prev.filter(t => t.id !== taskId));
      }
      // 모달 내 task도 갱신
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
  const { markedDates } = useMemo(
    () => buildMarkedDates(monthTasks, selectedDate),
    [monthTasks, selectedDate]
  );

  const selectedDayTasks = useMemo(() => {
    const tasks = monthTasks.filter(task => {
      if (!task.recurrence?.nextDue) return false;
      return toDateKey(new Date(task.recurrence.nextDue)) === selectedDate;
    });
    const filtered = filter === 'all' ? tasks : tasks.filter(t => t.type === filter);
    return filtered.sort((a, b) => {
      const scoreA = isTaskCompleted(a) ? 1 : 0;
      const scoreB = isTaskCompleted(b) ? 1 : 0;
      return scoreA - scoreB;
    });
  }, [monthTasks, selectedDate, filter]);

  const filteredOverdue = useMemo(
    () => (filter === 'all' ? overdueTasks : overdueTasks.filter(t => t.type === filter)),
    [overdueTasks, filter]
  );

  // 날짜별 task 개수 집계 (모듈 필터 연동)
  const dayCountMap = useMemo(() => {
    const map: Record<string, { pending: number; overdue: number; completed: number }> = {};
    const source = filter === 'all' ? monthTasks : monthTasks.filter(t => t.type === filter);
    for (const task of source) {
      if (!task.recurrence?.nextDue) continue;
      const key = toDateKey(new Date(task.recurrence.nextDue));
      if (!map[key]) map[key] = { pending: 0, overdue: 0, completed: 0 };
      if (isTaskCompleted(task)) map[key].completed++;
      else if (getDateCategory(task) === 'overdue') map[key].overdue++;
      else map[key].pending++;
    }
    return map;
  }, [monthTasks, filter]);

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
    setSelectedDate(toDateKey(new Date(month.year, month.month - 1, 1)));
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
      const countColor = counts?.overdue > 0
        ? Colors.error
        : counts?.pending > 0
        ? Colors.primary
        : Colors.textDisabled;

      return (
        <TouchableOpacity onPress={() => !isDisabled && onPress(date)} activeOpacity={0.65} disabled={isDisabled}>
          <View style={[styles.dayCell, isSelected && styles.dayCellSelected]}>
            <Text style={[
              styles.dayCellText,
              { color: isSelected ? Colors.white : textColor },
              isToday && !isSelected && styles.dayCellToday,
            ]}>
              {date.day}
            </Text>
            {total > 0 && (
              <Text style={[styles.dayCellCount, { color: isSelected ? Colors.white : countColor }]}>
                {total}
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
                    <Text style={styles.overdueRowIcon}>{furnitureEmojiMap[task.objectId] || getModuleIcon(task.type)}</Text>
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
            current={`${currentYear}-${String(currentMonth).padStart(2, '0')}-01`}
            markedDates={markedDates}
            onDayPress={handleDayPress}
            onMonthChange={handleMonthChange}
            dayComponent={renderDayComponent}
            hideExtraDays={false}
            enableSwipeMonths
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
              <Text style={styles.selectedCountText}>{selectedDayTasks.length}</Text>
            </View>
          </View>

          {selectedDayTasks.length === 0 ? (
            <EmptyDay />
          ) : (
            selectedDayTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                furnitureEmoji={furnitureEmojiMap[task.objectId]}
                isLoading={taskLoadingStates[task.id] || false}
                onPress={() => openDetailModal(task)}
                onCheck={() => handleCompleteTask(task)}
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
              const completed = isTaskCompleted(task);
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
              const furnitureEmoji = furnitureEmojiMap[task.objectId];

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
                    <Text style={styles.detailModuleLabel}>{getModuleLabel(task.type)}</Text>
                  </View>

                  {/* 스크롤 콘텐츠 */}
                  <ScrollView style={styles.detailScrollContent} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Spacing.md }}>
                    <View style={styles.detailSummaryCardV2}>
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
                    </View>
                  </ScrollView>

                  {/* 고정 액션 버튼 */}
                  <View style={styles.detailActionsFixed}>
                    <View style={styles.detailActionsRow}>
                      <TouchableOpacity
                        style={[styles.detailActionCompactBtn, completed ? styles.detailCompleteBtnUndo : styles.detailCompleteBtnDone]}
                        onPress={() => { handleCompleteTask(task); setTaskDetailModal({ visible: false, task: null }); }}
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
  furnitureEmoji?: string;
  isLoading: boolean;
  onPress: () => void;
  onCheck: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, furnitureEmoji, isLoading, onPress, onCheck }) => {
  const completed = isTaskCompleted(task);
  const category = getDateCategory(task);
  const dueDate = task.recurrence?.nextDue ? new Date(task.recurrence.nextDue) : null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const overdueDays = dueDate && category === 'overdue'
    ? Math.ceil((new Date().getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
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

  const displayEmoji = furnitureEmoji || getModuleIcon(task.type);

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
  dayCell: { width: 30, height: 34, borderRadius: 15, justifyContent: 'center', alignItems: 'center', paddingTop: 1 },
  dayCellSelected: { backgroundColor: Colors.primary },
  dayCellText: { ...Typography.bodySmall, fontWeight: '500' },
  dayCellToday: { color: Colors.primary, fontWeight: '700' },
  dayCellCount: { fontSize: 8, fontWeight: '700', lineHeight: 10, textAlign: 'center' },

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
});
