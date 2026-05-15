/**
 * 다정한 - 공용 Task 유틸리티
 *
 * 완료 판정, 날짜 그룹핑, 카테고리 분류 등
 * CalendarScreen과 FurnitureTasksTab 양쪽에서 재사용합니다.
 */

import { Task, TaskDomain } from '@/types/task.types';
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
// nextDue 계산
// ─────────────────────────────────────────────

/**
 * 완료 처리 후 nextDue 계산: 오늘 이상의 가장 이른 미완료 발생일을 반환합니다.
 * "다음 예정일" 표시용으로 사용합니다.
 */
export function computeNextPendingDue(task: Task, completionDates: string[]): Date | null {
  if (!task.recurrence?.nextDue) return null;
  const interval = task.recurrence.interval || 1;
  const unit = task.recurrence.unit || 'day';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let candidate = new Date(task.recurrence.nextDue);
  candidate.setHours(0, 0, 0, 0);

  // 오늘보다 이전이면 앞으로 전진 (완료 처리 시에는 미래 일정을 보여주므로)
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

/**
 * 완료 취소 후 nextDue 계산: 과거 포함 가장 이른 미완료 발생일을 반환합니다.
 * 완료취소 시 연체 날짜(과거)로 nextDue를 되돌리기 위해 사용합니다.
 *
 * completionDates에서 제거한 날짜(uncompleteDate)를 시작점으로,
 * 해당 날짜가 미완료이면 그대로 반환합니다.
 */
export function computeNextPendingDueForUndo(
  task: Task,
  completionDates: string[],
  uncompleteDate: Date,
): Date | null {
  if (!task.recurrence?.nextDue) return null;
  const interval = task.recurrence.interval || 1;
  const unit = task.recurrence.unit || 'day';

  // 취소된 날짜를 후보로 시작 (과거여도 그대로 사용)
  let candidate = new Date(uncompleteDate);
  candidate.setHours(0, 0, 0, 0);

  // 해당 날짜가 이미 완료 목록에 없으면 바로 반환 (연체 날짜로 설정)
  if (!completionDates.includes(candidate.toDateString())) {
    return candidate;
  }

  // 혹시 여전히 완료 목록에 있으면 다음 미완료 발생일 탐색
  let safetyCount = 0;
  while (completionDates.includes(candidate.toDateString()) && safetyCount < 366) {
    if (unit === 'day') candidate.setDate(candidate.getDate() + interval);
    else if (unit === 'week') candidate.setDate(candidate.getDate() + interval * 7);
    else if (unit === 'month') candidate.setMonth(candidate.getMonth() + interval);
    safetyCount++;
  }

  return candidate;
}

// ─────────────────────────────────────────────
// 달력 가상 발생 인스턴스 (Virtual Occurrence)
// ─────────────────────────────────────────────

/**
 * 특정 날짜에 대한 Task 발생 인스턴스.
 * 달력에서 날짜마다 반복 Task를 독립적으로 표시하기 위해 사용합니다.
 */
export interface TaskOccurrence {
  task: Task;
  occurrenceDate: Date;
  isCompleted: boolean;
}

/**
 * 특정 날짜의 발생에 대한 완료 여부를 반환합니다.
 * completionDates 배열에 해당 날짜의 toDateString()이 있으면 완료입니다.
 */
export function isOccurrenceCompleted(task: Task, occurrenceDate: Date): boolean {
  if (!task.completionDates || task.completionDates.length === 0) return false;
  const dateStr = occurrenceDate.toDateString();
  return task.completionDates.includes(dateStr);
}

/**
 * Task 배열을 받아 monthStart~monthEnd 기간 내의 모든 가상 발생 인스턴스를 반환합니다.
 *
 * - fixed(반복) Task: 반복 규칙(unit, interval)으로 달 내 모든 발생 날짜 계산
 *   - Task 생성일(createdAt) 이전 날짜는 발생 날짜로 포함하지 않습니다.
 *   - 과거 미완료 발생(연체)도 포함합니다 — 해당 날짜를 선택하면 카드로 보여야 합니다.
 * - 일회성 Task: nextDue가 달 범위 안에 있으면 그대로 1개 반환
 */
export function expandTaskOccurrences(
  tasks: Task[],
  monthStart: Date,
  monthEnd: Date,
): TaskOccurrence[] {
  const occurrences: TaskOccurrence[] = [];

  const msStart = monthStart.getTime();
  const msEnd = monthEnd.getTime();

  for (const task of tasks) {
    if (!task.recurrence?.nextDue) continue;

    if (task.recurrence.type !== 'fixed') {
      // 일회성 Task: nextDue가 달 범위 내이면 그대로 추가
      const due = new Date(task.recurrence.nextDue);
      due.setHours(0, 0, 0, 0);
      if (due.getTime() >= msStart && due.getTime() <= msEnd) {
        occurrences.push({
          task,
          occurrenceDate: due,
          isCompleted: isOccurrenceCompleted(task, due),
        });
      }
      continue;
    }

    // 반복(fixed) Task: nextDue를 기준으로 역산하여 달 범위 내 모든 발생 날짜 계산
    const interval = task.recurrence.interval || 1;
    const unit = task.recurrence.unit || 'day';

    // nextDue를 startDate(= 사용자가 지정한 시작일)의 역할로 사용합니다.
    // createdAt을 하한선으로 쓰면 과거 startDate로 생성된 Task가 달력에서 차단되므로,
    // nextDue를 역산하여 도달하는 가장 이른 발생일 자체를 하한선으로 사용합니다.
    const effectiveStart = msStart;

    // nextDue에서 interval씩 빼며 effectiveStart 이전으로 이동 → 달 내 첫 번째 발생 기준점을 구함
    let anchor = new Date(task.recurrence.nextDue);
    anchor.setHours(0, 0, 0, 0);

    const maxIterations = 1500; // 무한루프 방지
    let safetyCount = 0;
    while (anchor.getTime() > effectiveStart && safetyCount < maxIterations) {
      if (unit === 'day') anchor.setDate(anchor.getDate() - interval);
      else if (unit === 'week') anchor.setDate(anchor.getDate() - interval * 7);
      else if (unit === 'month') anchor.setMonth(anchor.getMonth() - interval);
      safetyCount++;
    }

    // anchor가 effectiveStart보다 이전이면 다음 발생으로 전진
    while (anchor.getTime() < effectiveStart) {
      if (unit === 'day') anchor.setDate(anchor.getDate() + interval);
      else if (unit === 'week') anchor.setDate(anchor.getDate() + interval * 7);
      else if (unit === 'month') anchor.setMonth(anchor.getMonth() + interval);
    }

    // anchor부터 달 끝까지 모든 발생 날짜 추가 (연체 포함)
    let current = new Date(anchor);
    safetyCount = 0;
    while (current.getTime() <= msEnd && safetyCount < maxIterations) {
      const occDate = new Date(current);
      occurrences.push({
        task,
        occurrenceDate: occDate,
        isCompleted: isOccurrenceCompleted(task, occDate),
      });
      if (unit === 'day') current.setDate(current.getDate() + interval);
      else if (unit === 'week') current.setDate(current.getDate() + interval * 7);
      else if (unit === 'month') current.setMonth(current.getMonth() + interval);
      safetyCount++;
    }
  }

  return occurrences;
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
// 도메인 타입 헬퍼
// ─────────────────────────────────────────────

const DOMAIN_LABELS: Record<TaskDomain, string> = {
  home: '집 관리',
  food: '음식',
  medicine: '약',
  pet: '반려동물',
  self_care: '자기관리',
  car: '차량',
  family: '가족',
  growth: '자기계발',
};

const DOMAIN_ICONS: Record<TaskDomain, string> = {
  home: '🏠',
  food: '🥗',
  medicine: '💊',
  pet: '🐾',
  self_care: '🌿',
  car: '🚗',
  family: '👶',
  growth: '📚',
};

const DOMAIN_COLORS: Record<TaskDomain, string> = {
  home: Colors.cleaning,
  food: Colors.fridge,
  medicine: Colors.medicine,
  pet: Colors.selfCare,
  self_care: Colors.selfCare,
  car: Colors.selfDevelopment,
  family: Colors.accent,
  growth: Colors.selfDevelopment,
};

export function getModuleLabel(domain: TaskDomain): string {
  return DOMAIN_LABELS[domain] ?? domain;
}

export function getModuleIcon(domain: TaskDomain): string {
  return DOMAIN_ICONS[domain] ?? '📋';
}

export function getModuleColor(domain: TaskDomain): string {
  return DOMAIN_COLORS[domain] ?? Colors.primary;
}

/** @deprecated getModuleLabel 사용 */
export const getDomainLabel = getModuleLabel;
/** @deprecated getModuleIcon 사용 */
export const getDomainIcon = getModuleIcon;
/** @deprecated getModuleColor 사용 */
export const getDomainColor = getModuleColor;

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
