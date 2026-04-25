/**
 * 다정한 - 공용 Task 유틸리티
 *
 * 완료 판정, 날짜 그룹핑, 카테고리 분류 등
 * CalendarScreen과 FurnitureTasksTab 양쪽에서 재사용합니다.
 */

import { Task, ModuleType } from '@/types/task.types';
import { Colors } from '@/constants';

// ─────────────────────────────────────────────
// 완료 판정
// ─────────────────────────────────────────────

/**
 * task의 현재 완료 여부를 반환합니다.
 *
 * - 반복(fixed) task: completionDates 배열에 nextDue 날짜가 있으면 완료
 *   - fallback: lastCompletedAt이 nextDue와 같은 날이면 완료
 * - 일회성 task: isCompleted 또는 status === 'completed'
 */
export function isTaskCompleted(task: Task): boolean {
  if (task.recurrence && task.recurrence.type === 'fixed') {
    if (task.recurrence.nextDue) {
      const nextDueDateString = new Date(task.recurrence.nextDue).toDateString();

      if (task.completionDates) {
        return task.completionDates.includes(nextDueDateString);
      }

      if (task.lastCompletedAt) {
        const lastCompleted = new Date(task.lastCompletedAt);
        const nextDue = new Date(task.recurrence.nextDue);
        lastCompleted.setHours(0, 0, 0, 0);
        nextDue.setHours(0, 0, 0, 0);
        return lastCompleted.getTime() === nextDue.getTime();
      }
    }
    return false;
  }

  return !!(task.isCompleted || task.status === 'completed');
}

// ─────────────────────────────────────────────
// 날짜 그룹핑
// ─────────────────────────────────────────────

export type CategorizedTasks = {
  overdue: Task[];
  today: Task[];
  upcoming: Task[];
};

/**
 * task 배열을 연체 / 오늘 / 예정으로 분류합니다.
 * 각 카테고리 내에서 nextDue 오름차순 정렬을 적용합니다.
 */
export function categorizeTasks(tasks: Task[]): CategorizedTasks {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const overdue: Task[] = [];
  const todayTasks: Task[] = [];
  const upcomingTasks: Task[] = [];

  tasks.forEach(task => {
    if (!task.recurrence?.nextDue) {
      upcomingTasks.push(task);
      return;
    }

    const dueDate = new Date(task.recurrence.nextDue);
    dueDate.setHours(0, 0, 0, 0);

    const completed = isTaskCompleted(task);

    if (dueDate < today) {
      if (!completed) overdue.push(task);
    } else if (dueDate.getTime() === today.getTime()) {
      todayTasks.push(task);
    } else {
      upcomingTasks.push(task);
    }
  });

  const byDueAsc = (a: Task, b: Task) => {
    if (!a.recurrence?.nextDue || !b.recurrence?.nextDue) return 0;
    return (
      new Date(a.recurrence.nextDue).getTime() -
      new Date(b.recurrence.nextDue).getTime()
    );
  };

  overdue.sort(byDueAsc);
  todayTasks.sort(byDueAsc);
  upcomingTasks.sort(byDueAsc);

  return { overdue, today: todayTasks, upcoming: upcomingTasks };
}

// ─────────────────────────────────────────────
// 달력 markedDates 생성
// ─────────────────────────────────────────────

export type DayMeta = {
  hasOverdue: boolean;
  hasToday: boolean;
  count: number;
  allCompleted: boolean;
};

/**
 * task 배열로부터 달력의 markedDates 맵과 날짜별 메타를 생성합니다.
 *
 * markedDates 구조는 react-native-calendars가 기대하는 형식입니다.
 */
export function buildMarkedDates(
  tasks: Task[],
  selectedDate: string
): {
  markedDates: Record<string, any>;
  dayMetaMap: Record<string, DayMeta>;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = toDateKey(today);

  const dayMetaMap: Record<string, DayMeta> = {};

  tasks.forEach(task => {
    if (!task.recurrence?.nextDue) return;

    const due = new Date(task.recurrence.nextDue);
    due.setHours(0, 0, 0, 0);
    const key = toDateKey(due);

    if (!dayMetaMap[key]) {
      dayMetaMap[key] = { hasOverdue: false, hasToday: false, count: 0, allCompleted: true };
    }

    const meta = dayMetaMap[key];
    meta.count += 1;

    const completed = isTaskCompleted(task);
    if (!completed) meta.allCompleted = false;

    if (due < today) meta.hasOverdue = true;
    if (key === todayStr) meta.hasToday = true;
  });

  const markedDates: Record<string, any> = {};

  Object.entries(dayMetaMap).forEach(([dateStr, meta]) => {
    const isSelected = dateStr === selectedDate;
    const dotColor = meta.hasOverdue
      ? Colors.error
      : meta.hasToday
      ? Colors.primary
      : meta.allCompleted
      ? Colors.secondary
      : Colors.accent;

    markedDates[dateStr] = {
      marked: meta.count > 0,
      dotColor,
      selected: isSelected,
      selectedColor: Colors.primary,
      selectedTextColor: Colors.white,
    };
  });

  // 선택된 날짜가 task 없이도 selected 표시
  if (selectedDate && !markedDates[selectedDate]) {
    markedDates[selectedDate] = {
      selected: true,
      selectedColor: Colors.primary,
      selectedTextColor: Colors.white,
    };
  } else if (selectedDate && markedDates[selectedDate]) {
    markedDates[selectedDate] = {
      ...markedDates[selectedDate],
      selected: true,
      selectedColor: Colors.primary,
      selectedTextColor: Colors.white,
    };
  }

  return { markedDates, dayMetaMap };
}

// ─────────────────────────────────────────────
// 날짜 헬퍼
// ─────────────────────────────────────────────

/** Date → 'YYYY-MM-DD' 문자열 */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 주어진 날짜가 속한 월의 시작(00:00)과 끝(23:59:59.999) */
export function getMonthRange(year: number, month: number): { start: Date; end: Date } {
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

// ─────────────────────────────────────────────
// 모듈 타입 헬퍼
// ─────────────────────────────────────────────

const MODULE_LABELS: Record<ModuleType, string> = {
  cleaning: '청소',
  food: '음식',
  medicine: '약',
  self_care: '자기관리',
  self_development: '자기계발',
};

const MODULE_ICONS: Record<ModuleType, string> = {
  cleaning: '🧹',
  food: '🥗',
  medicine: '💊',
  self_care: '🌿',
  self_development: '📚',
};

const MODULE_COLORS: Record<ModuleType, string> = {
  cleaning: Colors.cleaning,
  food: Colors.fridge,
  medicine: Colors.medicine,
  self_care: Colors.selfCare,
  self_development: Colors.selfDevelopment,
};

export function getModuleLabel(type: ModuleType): string {
  return MODULE_LABELS[type] ?? type;
}

export function getModuleIcon(type: ModuleType): string {
  return MODULE_ICONS[type] ?? '📋';
}

export function getModuleColor(type: ModuleType): string {
  return MODULE_COLORS[type] ?? Colors.primary;
}

/**
 * 날짜 표시 포맷 (한국어 상대 표현)
 * - 오늘: '오늘 마감'
 * - 과거: 'N일 연체'
 * - 미래: 'M월 D일'
 */
export function formatDueLabel(nextDue: Date): { label: string; isOverdue: boolean; isToday: boolean } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(nextDue);
  due.setHours(0, 0, 0, 0);

  const diffMs = due.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return { label: '오늘 마감', isOverdue: false, isToday: true };
  if (diffDays < 0) return { label: `${Math.abs(diffDays)}일 연체`, isOverdue: true, isToday: false };
  if (diffDays === 1) return { label: '내일', isOverdue: false, isToday: false };

  const m = due.getMonth() + 1;
  const d = due.getDate();
  return { label: `${m}월 ${d}일`, isOverdue: false, isToday: false };
}
