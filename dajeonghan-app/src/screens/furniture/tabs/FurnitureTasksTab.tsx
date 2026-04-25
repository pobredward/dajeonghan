import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Animated,
  Switch,
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import * as KoreanHolidays from 'korean-holidays';
import { Colors, Typography, Spacing } from '@/constants';

// 한국어 설정
LocaleConfig.locales['kr'] = {
  monthNames: [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ],
  monthNamesShort: [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ],
  dayNames: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
  dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
  today: '오늘'
};
LocaleConfig.defaultLocale = 'kr';
import { Room, Furniture } from '@/types/house.types';
import { LifeObject } from '@/types/lifeobject.types';
import { Task, PriorityLevel } from '@/types/task.types';
import { getLifeObjects, getTasks, updateTask, deleteTask } from '@/services/firestoreService';
import { getTemplateByFurnitureType } from '@/data/furnitureTaskTemplates';
import { TaskTemplateItem, TaskCustomization } from '@/types/furnitureTaskTemplate.types';
import { FurnitureTaskService } from '@/services/furnitureTaskService';
import { useAuth } from '@/contexts/AuthContext';

interface FurnitureTasksTabProps {
  furniture: Furniture;
  room: Room;
  onDataUpdate: () => void;
  initialTab?: 'info' | 'add';
  onTabChange?: (tab: 'info' | 'add') => void;
}

// Task 추가 모달 상태

// 요일 타입
type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

interface FurnitureWithData extends Furniture {
  linkedObjects: LifeObject[];
  linkedTasks: Task[];
  calculatedDirtyScore: number;
}

export const FurnitureTasksTab: React.FC<FurnitureTasksTabProps> = ({
  furniture,
  room,
  onDataUpdate,
  initialTab = 'info',
  onTabChange,
}) => {
  const { userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [taskLoadingStates, setTaskLoadingStates] = useState<{ [taskId: string]: boolean }>({});
  const [furnitureData, setFurnitureData] = useState<FurnitureWithData | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'add'>(initialTab);
  const [taskAddState, setTaskAddState] = useState<{
    step: 'template' | 'customize' | null;
    selectedTemplate: TaskTemplateItem | null;
  }>({
    step: null,
    selectedTemplate: null,
  });
  // 주기 설정 state는 아래에서 통합됨
  
  // Task 관리 state
  const [taskActionModal, setTaskActionModal] = useState<{
    visible: boolean;
    task: Task | null;
    action: 'complete' | 'postpone' | 'edit' | null;
  }>({
    visible: false,
    task: null,
    action: null,
  });
  const [taskDetailModal, setTaskDetailModal] = useState<{
    visible: boolean;
    task: Task | null;
  }>({
    visible: false,
    task: null,
  });
  const [taskAddModal, setTaskAddModal] = useState<{
    visible: boolean;
    template: TaskTemplateItem | null;
  }>({
    visible: false,
    template: null,
  });
  const [postponeDays, setPostponeDays] = useState<number>(1);
  const [upcomingCollapsed, setUpcomingCollapsed] = useState<boolean>(false);

  // Task 세부 모달 인라인 편집
  const [editingField, setEditingField] = useState<'recurrence' | 'minutes' | null>(null);
  const [editRecurrenceUnit, setEditRecurrenceUnit] = useState<'day' | 'week' | 'month'>('week');
  const [editRecurrenceInterval, setEditRecurrenceInterval] = useState<number>(1);
  const [editStartDate, setEditStartDate] = useState<Date>(new Date());
  const [editSelectedDays, setEditSelectedDays] = useState<DayOfWeek[]>([]);
  const [editMinutes, setEditMinutes] = useState<number>(15);
  const [editHasTime, setEditHasTime] = useState<boolean>(false);

  // Task 세부 모달 애니메이션
  const detailModalAnim = useRef(new Animated.Value(0)).current;

  // Task 추가 관련 state
  const [customization, setCustomization] = useState<TaskCustomization>({
    recurrenceType: 'daily',
    interval: 1,
    notificationEnabled: false,
  });
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);
  const [startDate, setStartDate] = useState<Date>(() => {
    const today = new Date();
    today.setHours(9, 0, 0, 0);
    return today;
  });
  const [hasTime, setHasTime] = useState<boolean>(false);

  // 완료 상태 확인 함수
  const isTaskCompleted = (task: Task): boolean => {
    if (task.recurrence && task.recurrence.type === 'fixed') {
      // 반복 Task: completionDates 배열에서 해당 nextDue 날짜가 완료되었는지 확인
      if (task.recurrence.nextDue) {
        const nextDueDateString = new Date(task.recurrence.nextDue).toDateString();
        
        if (task.completionDates) {
          // 새로운 방식: completionDates 배열 사용
          return task.completionDates.includes(nextDueDateString);
        } else if (task.lastCompletedAt) {
          // 기존 방식과의 호환성: lastCompletedAt 사용 (fallback)
          const lastCompletedDate = new Date(task.lastCompletedAt);
          const nextDueDate = new Date(task.recurrence.nextDue);
          
          lastCompletedDate.setHours(0, 0, 0, 0);
          nextDueDate.setHours(0, 0, 0, 0);
          
          return lastCompletedDate.getTime() === nextDueDate.getTime();
        }
      }
    } else {
      // 일회성 Task: isCompleted 또는 status 확인
      return task.isCompleted || task.status === 'completed';
    }
    
    return false;
  };

  // Task를 날짜별로 분류 (Hook은 항상 같은 순서로 호출되어야 함)
  const categorizedTasks = React.useMemo(() => {
    const furnitureLinkedTasks = furnitureData?.linkedTasks || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const overdue: Task[] = [];
    const todayTasks: Task[] = [];
    const upcomingTasks: Task[] = [];
    
    furnitureLinkedTasks.forEach(task => {
      if (!task.recurrence?.nextDue) {
        // nextDue가 없으면 upcoming으로 분류
        upcomingTasks.push(task);
        return;
      }
      
      const dueDate = new Date(task.recurrence.nextDue);
      dueDate.setHours(0, 0, 0, 0);
      
      // 완료 상태 확인
      const isCompleted = isTaskCompleted(task);
      
      if (dueDate < today) {
        // 연체된 할 일 중 완료되지 않은 것만 표시
        if (!isCompleted) {
          overdue.push(task);
        }
      } else if (dueDate.getTime() === today.getTime()) {
        // 오늘 할 일은 완료 여부와 상관없이 모두 표시
        todayTasks.push(task);
      } else {
        upcomingTasks.push(task);
      }
    });
    
    // 각 카테고리 내에서 날짜순 정렬
    overdue.sort((a, b) => {
      if (!a.recurrence?.nextDue || !b.recurrence?.nextDue) return 0;
      return new Date(a.recurrence.nextDue).getTime() - new Date(b.recurrence.nextDue).getTime();
    });
    
    todayTasks.sort((a, b) => {
      if (!a.recurrence?.nextDue || !b.recurrence?.nextDue) return 0;
      return new Date(a.recurrence.nextDue).getTime() - new Date(b.recurrence.nextDue).getTime();
    });
    
    upcomingTasks.sort((a, b) => {
      if (!a.recurrence?.nextDue || !b.recurrence?.nextDue) return 0;
      return new Date(a.recurrence.nextDue).getTime() - new Date(b.recurrence.nextDue).getTime();
    });
    
    return {
      overdue,
      today: todayTasks,
      upcoming: upcomingTasks,
    };
  }, [furnitureData?.linkedTasks]);

  // 미래 일정 계산 함수
  const getNextOccurrences = (
    startDate: Date,
    customization: TaskCustomization,
    selectedDays: DayOfWeek[],
    count: number
  ): Date[] => {
    const occurrences: Date[] = [];
    let currentDate = new Date(startDate);

    if (customization.recurrenceType === 'weekly' && selectedDays.length > 0) {
      // 특정 요일 선택된 경우
      let weekOffset = 0;
      
      while (occurrences.length < count && weekOffset < 52) { // 최대 1년
        const weekStart = new Date(currentDate);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // 주의 시작 (일요일)
        
        selectedDays.forEach(dayOfWeek => {
          const targetDate = new Date(weekStart);
          targetDate.setDate(targetDate.getDate() + dayOfWeek + (weekOffset * 7 * (customization.interval || 1)));
          
          if (targetDate >= startDate && occurrences.length < count) {
            occurrences.push(new Date(targetDate));
          }
        });
        
        weekOffset++;
      }
      
      return occurrences.sort((a, b) => a.getTime() - b.getTime()).slice(0, count);
    } else {
      // 일반적인 간격 반복
      for (let i = 0; i < count && i < 365; i++) { // 최대 365일
        const nextDate = new Date(currentDate);
        
        switch (customization.recurrenceType) {
          case 'daily':
            nextDate.setDate(nextDate.getDate() + (i * (customization.interval || 1)));
            break;
          case 'weekly':
            nextDate.setDate(nextDate.getDate() + (i * 7 * (customization.interval || 1)));
            break;
          case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + (i * (customization.interval || 1)));
            break;
        }
        
        occurrences.push(nextDate);
      }
    }

    return occurrences;
  };

  useEffect(() => {
    // 컴포넌트 마운트 시 기본 데이터 설정
    if (!furnitureData) {
      setFurnitureData({
        ...furniture,
        linkedObjects: [],
        linkedTasks: [],
        calculatedDirtyScore: furniture.dirtyScore || 0,
      });
    }
    
    loadFurnitureData();
  }, [furniture.id, userId]);

  // initialTab prop 변경 시 내부 상태 동기화
  useEffect(() => {
    console.log('FurnitureTasksTab: initialTab 변경됨:', initialTab);
    setActiveTab(initialTab);
    
    // Task 추가 탭으로 전환 시 템플릿 선택 단계로 시작
    if (initialTab === 'add') {
      console.log('Task 추가 모드로 설정');
      setTaskAddState({ step: 'template', selectedTemplate: null });
    } else {
      console.log('Task 확인 모드로 설정');
      // Task 확인 탭으로 전환 시 상태 초기화
      setTaskAddState({ step: null, selectedTemplate: null });
    }
  }, [initialTab]);

  const loadFurnitureData = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      
      // 모든 LifeObject와 Task 가져오기
      const allObjects = await getLifeObjects(userId!);
      const allTasks = await getTasks(userId!);
      
      console.log('getTasks에서 반환된 첫 번째 태스크:', allTasks[0]);
      console.log('모든 태스크 ID들:', allTasks.map(task => ({ 
        id: task.id, 
        idType: typeof task.id,
        keys: Object.keys(task)
      })));

      // 이 가구에 연결된 데이터 필터링
      const linkedObjects = allObjects.filter((obj) =>
        furniture.linkedObjectIds.includes(obj.id)
      );

      const linkedTasks = allTasks.filter((task) =>
        furniture.linkedObjectIds.includes(task.objectId) && 
        !isTaskCompleted(task)
      );
      
      console.log('전체 태스크 수:', allTasks.length);
      console.log('연결된 태스크들:', linkedTasks.map(task => ({
        id: task.id,
        idType: typeof task.id,
        title: task.title,
        objectId: task.objectId,
        fullTask: task
      })));
      
      // Task ID 유효성 검사
      linkedTasks.forEach(task => {
        if (typeof task.id !== 'string' || !task.id) {
          console.error('잘못된 Task ID:', task.id, typeof task.id, task);
        }
      });

      // dirtyScore 계산: 연체 Task 1개당 기본 15점 + 연체 일수당 5점(최대 30점)
      const now = new Date();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const overdueTasks = linkedTasks.filter(
        (task) => task.recurrence?.nextDue && new Date(task.recurrence.nextDue) < today
      );

      let calculatedDirtyScore = 0;
      overdueTasks.forEach((task) => {
        if (task.recurrence?.nextDue) {
          const daysOverdue = Math.floor(
            (now.getTime() - new Date(task.recurrence.nextDue).getTime()) /
              (1000 * 60 * 60 * 24)
          );
          calculatedDirtyScore += 15 + Math.min(daysOverdue * 5, 30);
        }
      });

      setFurnitureData({
        ...furniture,
        linkedObjects,
        linkedTasks,
        calculatedDirtyScore: Math.min(calculatedDirtyScore, 100),
      });
    } catch (error) {
      console.error('Failed to load furniture data:', error);
      Alert.alert('오류', '가구 데이터를 불러오는데 실패했습니다.');
      
      // 오류 발생 시 기본 데이터 설정
      setFurnitureData({
        ...furniture,
        linkedObjects: [],
        linkedTasks: [],
        calculatedDirtyScore: furniture.dirtyScore || 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShowTaskTemplates = () => {
    setActiveTab('add');
    setTaskAddState({ step: 'template', selectedTemplate: null });
  };

  const handleSelectTemplate = (template: TaskTemplateItem) => {
    // 기본 customization 설정
    setCustomization({
      recurrenceType: template.defaultRecurrence.type,
      interval: template.defaultRecurrence.interval || 1,
      estimatedMinutes: 0, // 소요시간 OFF 상태로 시작 (ON 시 template.estimatedMinutes로 초기화)
      priority: template.priority,
      notificationEnabled: true,
      notificationMinutesBefore: 30,
    });
    
    // 기본 시작일은 오늘
    const today = new Date();
    today.setHours(9, 0, 0, 0);
    setStartDate(today);
    
    // 요일 초기화
    setSelectedDays([]);
    
    setTaskAddModal({
      visible: true,
      template: template,
    });
  };

  const handleBackToTemplates = () => {
    setTaskAddState({ step: 'template', selectedTemplate: null });
  };

  const handleConfirmTask = async () => {
    console.log('handleConfirmTask 호출됨');
    console.log('taskAddModal.template:', taskAddModal.template);
    console.log('userId:', userId);
    
    if (!taskAddModal.template || !userId) {
      console.log('조건 실패 - template 또는 userId 없음');
      return;
    }

    try {
      console.log('Task 추가 시작...');
      console.log('customization.recurrenceType:', customization.recurrenceType);
      console.log('selectedDays:', selectedDays);
      setLoading(true);
      
      const customizationWithTime = { ...customization, hasTime };

      if (customizationWithTime.recurrenceType === 'weekly' && selectedDays.length > 1) {
        // 다중 요일 선택된 경우 - 각 요일별로 별도 Task 생성
        console.log('다중 요일 Task 생성 중...');
        
        for (const dayOfWeek of selectedDays) {
          const dayCustomization = {
            ...customizationWithTime,
            dayOfWeek,
          };
          
          await FurnitureTaskService.addTaskFromTemplate(
            userId,
            room.id,
            furniture.id,
            room.name,
            furniture.name,
            taskAddModal.template,
            dayCustomization,
            startDate
          );
          
          console.log(`Task 추가 완료 - 요일: ${dayOfWeek}`);
        }
      } else {
        // 단일 Task 생성
        let taskCustomization = customizationWithTime;
        
        if (customizationWithTime.recurrenceType === 'weekly' && selectedDays.length === 1) {
          taskCustomization = {
            ...customizationWithTime,
            dayOfWeek: selectedDays[0],
          };
        }
        
        await FurnitureTaskService.addTaskFromTemplate(
          userId,
          room.id,
          furniture.id,
          room.name,
          furniture.name,
          taskAddModal.template,
          taskCustomization,
          startDate
        );
      }

      console.log('Task 추가 성공!');
      
      // 조용히 완료 - UI 업데이트로 충분함
      
      // 초기화 및 정보 탭으로 이동
      setTaskAddState({ step: null, selectedTemplate: null });
      setActiveTab('info');
      
      // 데이터 새로고침
      await loadFurnitureData();
      onDataUpdate();
    } catch (error) {
      console.error('Task 추가 실패:', error);
      Alert.alert('오류', 'Task 추가에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const toggleDayOfWeek = (day: DayOfWeek) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  // TaskCustomizationForm에서 사용하는 핸들러 함수들
  const onCustomizationChange = (newCustomization: TaskCustomization) => {
    setCustomization(newCustomization);
  };

  const onToggleDayOfWeek = (day: DayOfWeek) => {
    toggleDayOfWeek(day);
  };

  const onDateChange = (newDate: Date) => {
    setStartDate(newDate);
  };

  // Task 액션 핸들러들
  const handleTaskPress = (task: Task) => {
    if (!task) {
      Alert.alert('오류', '유효하지 않은 할 일입니다.');
      return;
    }

    const taskId = String(task.id);
    if (!taskId || taskId === 'undefined' || taskId === 'null' || taskId === '[object Object]') {
      Alert.alert('오류', `유효하지 않은 할 일 ID입니다. (${taskId})`);
      return;
    }

    setTaskActionModal({
      visible: true,
      task,
      action: null,
    });
  };

  const handleCompleteTask = async (taskOrId: Task | string) => {
    // Task 객체 또는 ID를 받을 수 있도록 수정
    let task: Task;
    let taskId: string;
    
    if (typeof taskOrId === 'string') {
      taskId = taskOrId;
      const foundTask = linkedTasks.find(t => t.id === taskId);
      if (!foundTask) {
        console.error('Task를 찾을 수 없습니다:', taskId);
        Alert.alert('오류', 'Task를 찾을 수 없습니다.');
        return;
      }
      task = foundTask;
    } else {
      task = taskOrId;
      taskId = String(task.id);
    }
    
    console.log('handleCompleteTask 호출됨:', {
      task: task,
      taskId: taskId,
      taskIdType: typeof taskId,
      taskTitle: task?.title
    });

    if (!task) {
      console.error('Task가 null/undefined입니다.');
      Alert.alert('오류', 'Task가 존재하지 않습니다.');
      return;
    }
    if (!taskId || taskId === 'undefined' || taskId === 'null' || taskId === '[object Object]') {
      console.error('Task ID가 유효하지 않습니다:', task.id, typeof task.id);
      Alert.alert('오류', `유효하지 않은 할 일 ID입니다. (${taskId})`);
      return;
    }

    // 현재 완료 상태 확인
    const currentlyCompleted = isTaskCompleted(task);

    // 예정된 할 일(미래 일정)을 완료하려 할 때 확인 모달 표시
    if (!currentlyCompleted && task.recurrence && task.recurrence.nextDue) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const nextDueDate = new Date(task.recurrence.nextDue);
      nextDueDate.setHours(0, 0, 0, 0);
      
      if (nextDueDate > today) {
        // 미래 일정을 완료하려 할 때 확인 모달
        Alert.alert(
          '미래 일정 완료',
          `"${task.title}"은(는) ${nextDueDate.toLocaleDateString('ko-KR')}에 예정된 할 일입니다.\n\n미리 완료 처리하시겠습니까?\n(완료하면 다음 일정으로 변경됩니다)`,
          [
            {
              text: '취소',
              style: 'cancel'
            },
            {
              text: '완료',
              style: 'default',
              onPress: async () => {
                try {
                  setTaskLoadingStates(prev => ({ ...prev, [taskId]: true }));
                  console.log('미래 할 일 완료 처리 시작:', taskId, task.title);
                  await handleMarkAsComplete(task, taskId);
                } catch (error) {
                  console.error('Failed to complete future task:', error);
                  Alert.alert('오류', '할 일 완료에 실패했습니다.\n' + (error instanceof Error ? error.message : String(error)));
                } finally {
                  setTaskLoadingStates(prev => ({ ...prev, [taskId]: false }));
                }
              }
            }
          ]
        );
        return; // 여기서 함수 종료
      }
    }

    try {
      // 개별 Task 로딩 상태 설정
      setTaskLoadingStates(prev => ({ ...prev, [taskId]: true }));
      
      if (currentlyCompleted) {
        // 완료된 할 일을 취소할 때도 확인 모달
        if (task.recurrence && task.recurrence.type === 'fixed') {
          Alert.alert(
            '완료 취소',
            `"${task.title}"의 완료를 취소하시겠습니까?\n\n취소하면 이전 일정으로 되돌아갑니다.`,
            [
              {
                text: '아니오',
                style: 'cancel'
              },
              {
                text: '취소',
                style: 'destructive',
                onPress: async () => {
                  try {
                    console.log('완료 취소 처리 시작 (확인 모달에서):', {
                      taskId,
                      taskTitle: task.title,
                      currentNextDue: task.recurrence?.nextDue,
                      completionDates: task.completionDates
                    });
                    await handleUncompleteTask(task);
                  } catch (error) {
                    console.error('Failed to uncomplete task:', error);
                    Alert.alert('오류', '완료 취소에 실패했습니다.\n' + (error instanceof Error ? error.message : String(error)));
                  }
                }
              }
            ]
          );
          return; // 여기서 함수 종료
        } else {
          console.log('완료 취소 처리 시작:', taskId, task.title);
          await handleUncompleteTask(task);
        }
      } else {
        console.log('완료 처리 시작:', taskId, task.title);
        await handleMarkAsComplete(task, taskId);
      }
    } catch (error) {
      console.error('Failed to toggle task completion:', error);
      Alert.alert('오류', '할 일 상태 변경에 실패했습니다.\n' + (error instanceof Error ? error.message : String(error)));
    } finally {
      // 개별 Task 로딩 상태 해제
      setTaskLoadingStates(prev => ({ ...prev, [taskId]: false }));
    }
  };

  const handleMarkAsComplete = async (task: Task, taskId: string) => {
    // Task 완료 처리: 다음 일정으로 업데이트 또는 완료 상태로 변경
    let updatedTask: Partial<Task>;
    
    if (task.recurrence && task.recurrence.type === 'fixed') {
        // 반복 Task: 다음 일정 계산
        const currentDue = task.recurrence.nextDue ? new Date(task.recurrence.nextDue) : new Date();
        const nextDue = new Date(currentDue);
        const interval = task.recurrence.interval || 1;
        const unit = task.recurrence.unit || 'day';
        
        switch (unit) {
          case 'day':
            nextDue.setDate(nextDue.getDate() + interval);
            break;
          case 'week':
            nextDue.setDate(nextDue.getDate() + (interval * 7));
            break;
          case 'month':
            nextDue.setMonth(nextDue.getMonth() + interval);
            break;
        }
        
        // 완료 기록을 completionHistory에 추가
            const completionRecord = {
              date: new Date(),
              postponed: false,
              actualInterval: undefined
            };
        
        // 완료된 날짜들을 배열로 관리
        const completionDates = task.completionDates || [];
        const currentDueDateString = currentDue.toDateString();
        
        // 해당 날짜가 이미 완료 목록에 없으면 추가
        if (!completionDates.includes(currentDueDateString)) {
          completionDates.push(currentDueDateString);
        }
        
        updatedTask = {
          recurrence: {
            ...task.recurrence,
            nextDue,
          },
          lastCompletedAt: new Date(), // 마지막 완료 시간 (실제 완료 시점)
          completionDates, // 완료된 날짜들의 배열
          completionHistory: [...(task.completionHistory || []), completionRecord],
          status: 'pending', // 다음 일정을 위해 다시 pending으로 설정
          updatedAt: new Date(),
        };
        
        console.log('반복 태스크 다음 일정:', nextDue);
      } else {
        // 일회성 Task: 완료 상태로 변경
        updatedTask = {
          isCompleted: true,
          completedAt: new Date(),
          updatedAt: new Date(),
        };
        
        console.log('일회성 태스크 완료 처리');
      }
      
      console.log('updateTask 호출 전:', { userId, taskId, taskIdType: typeof taskId, updatedTask });
      await updateTask(userId!, taskId, updatedTask);
      console.log('Firestore 업데이트 완료');
      
      // UI 즉시 업데이트 (사용자 피드백)
      if (furnitureData) {
        if (task.recurrence && task.recurrence.type === 'fixed') {
          // 반복 Task: 완료 상태로 업데이트하여 체크박스를 체크된 상태로 표시
          const updatedLinkedTasks = furnitureData.linkedTasks.map(t => 
            t.id === taskId ? { 
              ...t, 
              ...updatedTask // updatedTask에 이미 모든 필요한 업데이트가 포함됨
            } : t
          );
          setFurnitureData({
            ...furnitureData,
            linkedTasks: updatedLinkedTasks
          });
        } else {
          // 일회성 Task: 목록에서 제거 (완료되었으므로)
          const filteredLinkedTasks = furnitureData.linkedTasks.filter(t => t.id !== taskId);
          setFurnitureData({
            ...furnitureData,
            linkedTasks: filteredLinkedTasks
          });
        }
      }
      
      // Task 완료 후 Firestore의 가구 dirtyScore 비동기 동기화 (평면도 반영)
      if (userId && task.objectId) {
        FurnitureTaskService.syncDirtyScoreAfterTaskComplete(userId, task.objectId).catch(
          (e) => console.error('dirtyScore 동기화 오류:', e)
        );
      }
      
      // Alert 없이 조용히 완료 (즉시 UI 피드백이 충분함)
      // 전체 데이터 새로고침은 제거 - 즉시 UI 업데이트로 충분함
  };

  const handleUncompleteTask = async (taskOrId: Task | string) => {
    // Task 객체 또는 ID를 받을 수 있도록 수정
    let task: Task;
    let taskId: string;
    
    if (typeof taskOrId === 'string') {
      taskId = taskOrId;
      const foundTask = linkedTasks.find(t => t.id === taskId);
      if (!foundTask) {
        console.error('Task를 찾을 수 없습니다:', taskId);
        Alert.alert('오류', 'Task를 찾을 수 없습니다.');
        return;
      }
      task = foundTask;
    } else {
      task = taskOrId;
      taskId = String(task.id);
    }
    
    // Task 완료 취소 처리
    let updatedTask: Partial<Task>;
    
    if (task.recurrence && task.recurrence.type === 'fixed') {
      // 반복 Task: 이전 일정으로 되돌리기
      const currentDue = task.recurrence.nextDue ? new Date(task.recurrence.nextDue) : new Date();
      const previousDue = new Date(currentDue);
      const interval = task.recurrence.interval || 1;
      const unit = task.recurrence.unit || 'day';
      
      switch (unit) {
        case 'day':
          previousDue.setDate(previousDue.getDate() - interval);
          break;
        case 'week':
          previousDue.setDate(previousDue.getDate() - (interval * 7));
          break;
        case 'month':
          previousDue.setMonth(previousDue.getMonth() - interval);
          break;
      }
      
      // 완료 기록에서 마지막 항목 제거
      const updatedCompletionHistory = [...(task.completionHistory || [])];
      if (updatedCompletionHistory.length > 0) {
        updatedCompletionHistory.pop();
      }
      
      // 완료된 날짜들에서 현재 날짜 제거
      const completionDates = [...(task.completionDates || [])];
      const currentDueDateString = currentDue.toDateString();
      const indexToRemove = completionDates.indexOf(currentDueDateString);
      if (indexToRemove > -1) {
        completionDates.splice(indexToRemove, 1);
      }
      
      updatedTask = {
        recurrence: {
          ...task.recurrence,
          nextDue: previousDue,
        },
        lastCompletedAt: completionDates.length > 0 ? new Date() : undefined,
        completionDates, // 해당 날짜를 제거한 완료 날짜 배열
        completionHistory: updatedCompletionHistory,
        status: 'pending',
        updatedAt: new Date(),
      };
      
      console.log('반복 태스크 이전 일정으로 되돌림:', {
        taskTitle: task.title,
        currentDue: currentDue.toISOString(),
        previousDue: previousDue.toISOString(),
        interval,
        unit,
        completionDates
      });
    } else {
      // 일회성 Task: 완료 취소
      updatedTask = {
        isCompleted: false,
        completedAt: undefined,
        status: 'pending',
        updatedAt: new Date(),
      };
      
      console.log('일회성 태스크 완료 취소 처리');
    }
    
    console.log('updateTask 호출 전 (완료 취소):', { userId, taskId, taskIdType: typeof taskId, updatedTask });
    await updateTask(userId!, taskId, updatedTask);
    console.log('Firestore 업데이트 완료 (완료 취소)');
    
    // UI 즉시 업데이트 (사용자 피드백)
    if (furnitureData) {
      if (task.recurrence && task.recurrence.type === 'fixed') {
        // 반복 Task: 완료 취소 상태로 업데이트
        const updatedLinkedTasks = furnitureData.linkedTasks.map(t => 
          t.id === taskId ? { 
            ...t, 
            ...updatedTask
          } : t
        );
        setFurnitureData({
          ...furnitureData,
          linkedTasks: updatedLinkedTasks
        });
      } else {
        // 일회성 Task: 완료 취소 상태로 업데이트 (목록에 다시 표시)
        const updatedLinkedTasks = furnitureData.linkedTasks.map(t => 
          t.id === taskId ? { 
            ...t, 
            ...updatedTask
          } : t
        );
        setFurnitureData({
          ...furnitureData,
          linkedTasks: updatedLinkedTasks
        });
      }
    }
    
    // Alert 없이 조용히 취소 (즉시 UI 피드백이 충분함)
    // 전체 데이터 새로고침은 제거 - 즉시 UI 업데이트로 충분함
  };

  const handleRevertToOriginalSchedule = async (task: Task) => {
    if (!task.recurrence || task.recurrence.type !== 'fixed') {
      Alert.alert('오류', '반복 할 일이 아닙니다.');
      return;
    }

    Alert.alert(
      '원래 일정으로 되돌리기',
      `"${task.title}"을(를) 원래 일정으로 되돌리시겠습니까?\n\n모든 완료 기록이 초기화되고 오늘 또는 연체된 상태로 변경됩니다.`,
      [
        {
          text: '취소',
          style: 'cancel'
        },
        {
          text: '되돌리기',
          style: 'destructive',
          onPress: async () => {
            try {
              const taskId = String(task.id);
              setTaskLoadingStates(prev => ({ ...prev, [taskId]: true }));

              // 오늘 날짜로 설정
              const today = new Date();
              today.setHours(0, 0, 0, 0);

              const updatedTask: Partial<Task> = {
                recurrence: {
                  ...task.recurrence,
                  nextDue: today, // 오늘로 되돌리기
                },
                lastCompletedAt: undefined, // 완료 기록 초기화
                completionDates: [], // 완료 날짜 배열 초기화
                completionHistory: [], // 완료 이력 초기화
                status: 'pending',
                updatedAt: new Date(),
              };

              console.log('원래 일정으로 되돌리기:', {
                taskTitle: task.title,
                originalNextDue: task.recurrence.nextDue,
                newNextDue: today.toISOString(),
              });

              await updateTask(userId!, taskId, updatedTask);

              // UI 즉시 업데이트
              if (furnitureData) {
                const updatedLinkedTasks = furnitureData.linkedTasks.map(t => 
                  t.id === taskId ? { ...t, ...updatedTask } : t
                );
                setFurnitureData({
                  ...furnitureData,
                  linkedTasks: updatedLinkedTasks
                });
              }

              Alert.alert('완료', '원래 일정으로 되돌렸습니다.');
            } catch (error) {
              console.error('Failed to revert to original schedule:', error);
              Alert.alert('오류', '일정 되돌리기에 실패했습니다.\n' + (error instanceof Error ? error.message : String(error)));
            } finally {
              setTaskLoadingStates(prev => ({ ...prev, [String(task.id)]: false }));
            }
          }
        }
      ]
    );
  };

  const handlePostponeTask = async (task: Task) => {
    if (!task) {
      Alert.alert('오류', '유효하지 않은 할 일입니다.');
      return;
    }

    // Task ID를 문자열로 강제 변환
    const taskId = String(task.id);
    if (!taskId || taskId === 'undefined' || taskId === 'null' || taskId === '[object Object]') {
      Alert.alert('오류', `유효하지 않은 할 일 ID입니다. (${taskId})`);
      return;
    }

    try {
      console.log('미루기 처리 시작:', taskId, task.title, `${postponeDays}일`);
      setLoading(true);
      
      const currentDue = task.recurrence && task.recurrence.nextDue 
        ? new Date(task.recurrence.nextDue) 
        : new Date();
      
      const nextDue = new Date(currentDue);
      nextDue.setDate(nextDue.getDate() + postponeDays);
      
      const updatedTask: Partial<Task> = {
        recurrence: {
          ...task.recurrence,
          nextDue,
        },
        updatedAt: new Date(),
      };
      
      console.log('미루기 새 일정:', nextDue);
      await updateTask(userId!, taskId, updatedTask);
      console.log('미루기 Firestore 업데이트 완료');
      
      // UI 업데이트
      await loadFurnitureData();
      onDataUpdate();
      
      setTaskActionModal({ visible: false, task: null, action: null });
      Alert.alert('완료', `할 일이 ${postponeDays}일 미뤄졌습니다.`);
    } catch (error) {
      console.error('Failed to postpone task:', error);
      Alert.alert('오류', '할 일 미루기에 실패했습니다.\n' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRecurrence = async (
    task: Task,
    unit: 'day' | 'week' | 'month',
    interval: number,
    startDate: Date,
    hasTime: boolean = false,
  ) => {
    if (!userId || !task.id) return;
    const nextDue = new Date(startDate);
    if (!hasTime) {
      nextDue.setHours(9, 0, 0, 0);
    }
    const updatedRecurrence = { ...task.recurrence, unit, interval, nextDue, hasTime };
    try {
      await updateTask(userId, task.id, { recurrence: updatedRecurrence });
      const updatedTask = { ...task, recurrence: updatedRecurrence };
      setFurnitureData(prev => prev ? {
        ...prev,
        linkedTasks: prev.linkedTasks.map(t => t.id === task.id ? updatedTask : t),
      } : prev);
      setTaskDetailModal(prev => ({ ...prev, task: prev.task ? updatedTask : null }));
      setEditingField(null);
    } catch {
      Alert.alert('오류', '반복 주기 변경에 실패했습니다.');
    }
  };

  const handleUpdateMinutes = async (task: Task, minutes: number) => {
    if (!userId || !task.id) return;
    try {
      await updateTask(userId, task.id, { estimatedMinutes: minutes });
      const updatedTask = { ...task, estimatedMinutes: minutes };
      setFurnitureData(prev => prev ? {
        ...prev,
        linkedTasks: prev.linkedTasks.map(t => t.id === task.id ? updatedTask : t),
      } : prev);
      setTaskDetailModal(prev => ({ ...prev, task: prev.task ? updatedTask : null }));
      setEditingField(null);
    } catch {
      Alert.alert('오류', '소요 시간 변경에 실패했습니다.');
    }
  };

  const handleUpdatePriority = async (task: Task, newPriority: PriorityLevel) => {
    if (!userId || !task.id) return;
    try {
      await updateTask(userId, task.id, { priority: newPriority });
      setFurnitureData(prev => prev ? {
        ...prev,
        linkedTasks: prev.linkedTasks.map(t =>
          t.id === task.id ? { ...t, priority: newPriority } : t
        ),
      } : prev);
      setTaskDetailModal(prev => ({
        ...prev,
        task: prev.task ? { ...prev.task, priority: newPriority } : null,
      }));
    } catch (error) {
      Alert.alert('오류', '우선순위 변경에 실패했습니다.');
    }
  };

  const handleDeleteTask = async (task: Task) => {
    if (!task) {
      Alert.alert('오류', '유효하지 않은 할 일입니다.');
      return;
    }

    // Task ID를 문자열로 강제 변환
    const taskId = String(task.id);
    if (!taskId || taskId === 'undefined' || taskId === 'null' || taskId === '[object Object]') {
      Alert.alert('오류', `유효하지 않은 할 일 ID입니다. (${taskId})`);
      return;
    }

    Alert.alert(
      '삭제 확인',
      `"${task.title}"을(를) 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('삭제 처리 시작:', taskId, task.title);
              setLoading(true);
              
              // 실제 삭제 대신 deletedAt 필드 설정 (소프트 삭제)
              const updatedTask: Partial<Task> = {
                deletedAt: new Date(),
                updatedAt: new Date(),
              };
              
              await updateTask(userId!, taskId, updatedTask);
              console.log('삭제 Firestore 업데이트 완료');
              
              // UI 업데이트
              await loadFurnitureData();
              onDataUpdate();
              
              setTaskActionModal({ visible: false, task: null, action: null });
              Alert.alert('완료', '할 일이 삭제되었습니다.');
            } catch (error) {
              console.error('Failed to delete task:', error);
              Alert.alert('오류', '할 일 삭제에 실패했습니다.\n' + (error instanceof Error ? error.message : String(error)));
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>데이터를 불러오는 중...</Text>
      </View>
    );
  }

  if (!furnitureData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>데이터를 불러오는데 실패했습니다.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadFurnitureData}>
          <Text style={styles.retryButtonText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { linkedTasks, linkedObjects, calculatedDirtyScore } = furnitureData || {
    linkedTasks: [],
    linkedObjects: [],
    calculatedDirtyScore: 0
  };


  return (
    <View style={styles.container}>
      {/* 컨텐츠 */}
      {activeTab === 'info' ? (
        // Task 확인 탭
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

          {/* ── 상단 요약 대시보드 ── */}
          <View style={styles.dashboardCard}>
            <View style={styles.dashboardRow}>
              <View style={[styles.dashboardItem, styles.dashboardItemOverdue]}>
                <Text style={[styles.dashboardCount, styles.dashboardCountOverdue]}>
                  {categorizedTasks.overdue.length}
                </Text>
                <Text style={styles.dashboardLabel}>⚠️ 연체</Text>
              </View>
              <View style={styles.dashboardDivider} />
              <View style={[styles.dashboardItem, styles.dashboardItemToday]}>
                <Text style={[styles.dashboardCount, styles.dashboardCountToday]}>
                  {categorizedTasks.today.length}
                </Text>
                <Text style={styles.dashboardLabel}>📅 오늘</Text>
              </View>
              <View style={styles.dashboardDivider} />
              <View style={styles.dashboardItem}>
                <Text style={styles.dashboardCount}>
                  {categorizedTasks.upcoming.length}
                </Text>
                <Text style={styles.dashboardLabel}>📋 예정</Text>
              </View>
            </View>

            {/* 더러움 게이지 */}
            {calculatedDirtyScore >= 15 && (
              <View style={styles.dirtyGaugeContainer}>
                <View style={styles.dirtyGaugeHeader}>
                  <Text style={styles.dirtyGaugeLabel}>청결도</Text>
                  <Text style={[
                    styles.dirtyGaugePercent,
                    calculatedDirtyScore >= 60 && styles.dirtyGaugePercentHigh,
                    calculatedDirtyScore >= 30 && calculatedDirtyScore < 60 && styles.dirtyGaugePercentMid,
                  ]}>
                    더러움 {Math.round(calculatedDirtyScore)}%
                  </Text>
                </View>
                <View style={styles.dirtyGaugeTrack}>
                  <View style={[
                    styles.dirtyGaugeFill,
                    { width: `${Math.min(calculatedDirtyScore, 100)}%` as any },
                    calculatedDirtyScore >= 60 && styles.dirtyGaugeFillHigh,
                    calculatedDirtyScore >= 30 && calculatedDirtyScore < 60 && styles.dirtyGaugeFillMid,
                  ]} />
                </View>
              </View>
            )}
          </View>

          {/* ── 전체 빈 상태 ── */}
          {categorizedTasks.overdue.length === 0 &&
           categorizedTasks.today.length === 0 &&
           categorizedTasks.upcoming.length === 0 && (
            <View style={styles.fullEmptyState}>
              <Text style={styles.fullEmptyIcon}>✅</Text>
              <Text style={styles.fullEmptyTitle}>등록된 할 일이 없어요</Text>
              <Text style={styles.fullEmptySubtext}>
                이 가구에 대한 관리 Task를 추가하면{'\n'}일정을 체계적으로 관리할 수 있어요
              </Text>
              <TouchableOpacity
                style={styles.fullEmptyButton}
                onPress={() => {
                  setActiveTab('add');
                  setTaskAddState({ step: 'template', selectedTemplate: null });
                  onTabChange?.('add');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.fullEmptyButtonText}>+ Task 추가하기</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── 전체 완료 상태 ── */}
          {categorizedTasks.overdue.length === 0 &&
           categorizedTasks.today.length > 0 &&
           categorizedTasks.today.every(t => isTaskCompleted(t)) && (
            <View style={styles.allDoneState}>
              <Text style={styles.allDoneIcon}>🎉</Text>
              <Text style={styles.allDoneTitle}>오늘 할 일을 모두 완료했어요!</Text>
              {categorizedTasks.upcoming.length > 0 && (
                <Text style={styles.allDoneSubtext}>
                  다음 예정일: {(() => {
                    const next = categorizedTasks.upcoming[0];
                    const d = next?.recurrence?.nextDue ? new Date(next.recurrence.nextDue) : null;
                    return d
                      ? next?.recurrence?.hasTime
                        ? d.toLocaleString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit' })
                        : d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
                      : '';
                  })()}
                </Text>
              )}
            </View>
          )}

          {/* ── 연체된 할 일 ── */}
          {categorizedTasks.overdue.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderV2Overdue}>
                <View style={styles.sectionHeaderV2Bar} />
                <View style={styles.sectionHeaderV2Content}>
                  <Text style={styles.sectionHeaderV2Title}>연체된 할 일</Text>
                  <View style={styles.overdueBadge}>
                    <Text style={styles.overdueBadgeText}>{categorizedTasks.overdue.length}</Text>
                  </View>
                </View>
              </View>

              {categorizedTasks.overdue.map((task) => {
                if (!task || typeof task.id !== 'string') return null;
                const dueDate = task.recurrence?.nextDue ? new Date(task.recurrence.nextDue) : null;
                const isCompleted = isTaskCompleted(task);
                const isTaskLoading = taskLoadingStates[task.id] || false;
                const overdueDays = dueDate
                  ? Math.ceil((new Date().getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
                  : 0;

                return (
                  <TouchableOpacity
                    key={task.id}
                    style={[styles.taskCard, styles.taskCardOverdue, isCompleted && styles.taskCardCompleted]}
                    onPress={() => {
                      detailModalAnim.setValue(0);
                      setEditingField(null);
                      setTaskDetailModal({ visible: true, task });
                      Animated.timing(detailModalAnim, {
                        toValue: 1,
                        duration: 100,
                        useNativeDriver: true,
                      }).start();
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.taskCardAccentOverdue} />
                    {/* 체크박스 */}
                    <TouchableOpacity
                      style={[styles.taskCheckboxNew, isCompleted && styles.taskCheckboxNewCompleted, isTaskLoading && styles.taskCheckboxNewLoading]}
                      onPress={(e) => { e.stopPropagation(); if (!isTaskLoading) handleCompleteTask(task); }}
                      activeOpacity={isTaskLoading ? 1 : 0.4}
                      disabled={isTaskLoading}
                    >
                      {isTaskLoading
                        ? <ActivityIndicator size="small" color={Colors.white} />
                        : isCompleted
                          ? <Text style={styles.taskCheckboxCheck}>✓</Text>
                          : null
                      }
                    </TouchableOpacity>

                    {/* 본문 */}
                    <View style={styles.taskCardBody}>
                      <View style={styles.taskCardTitleRow}>
                        <Text
                          style={[styles.taskCardTitle, isCompleted && styles.taskCardTitleCompleted]}
                          numberOfLines={1}
                        >
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
                            {task.priority === 'high' ? '높음' : task.priority === 'medium' ? '보통' : '낮음'}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.taskCardChipRow}>
                        <View style={styles.taskChipOverdue}>
                          <Text style={styles.taskChipTextOverdue}>{overdueDays}일 연체</Text>
                        </View>
                        {task.recurrence?.type === 'fixed' && (
                          <View style={styles.taskChipRecurrence}>
                            <Text style={styles.taskChipTextRecurrence}>
                              🔁 {task.recurrence.unit === 'day' ? '매일' : task.recurrence.unit === 'week' ? '매주' : '매월'}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* ── 오늘 할 일 ── */}
          {categorizedTasks.today.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderV2Today}>
                <View style={styles.sectionHeaderV2BarToday} />
                <View style={styles.sectionHeaderV2Content}>
                  <Text style={styles.sectionHeaderV2TitleToday}>오늘 할 일</Text>
                  <View style={styles.todayBadge}>
                    <Text style={styles.todayBadgeText}>{categorizedTasks.today.length}</Text>
                  </View>
                </View>
              </View>

              {categorizedTasks.today.map((task) => {
                if (!task || typeof task.id !== 'string') return null;
                const dueDate = task.recurrence?.nextDue ? new Date(task.recurrence.nextDue) : null;
                const isCompleted = isTaskCompleted(task);
                const isTaskLoading = taskLoadingStates[task.id] || false;

                return (
                  <TouchableOpacity
                    key={task.id}
                    style={[styles.taskCard, styles.taskCardToday, isCompleted && styles.taskCardCompleted]}
                    onPress={() => {
                      detailModalAnim.setValue(0);
                      setEditingField(null);
                      setTaskDetailModal({ visible: true, task });
                      Animated.timing(detailModalAnim, {
                        toValue: 1,
                        duration: 100,
                        useNativeDriver: true,
                      }).start();
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.taskCardAccentToday} />
                    {/* 체크박스 */}
                    <TouchableOpacity
                      style={[styles.taskCheckboxNew, styles.taskCheckboxNewToday, isCompleted && styles.taskCheckboxNewCompleted, isTaskLoading && styles.taskCheckboxNewLoading]}
                      onPress={(e) => { e.stopPropagation(); if (!isTaskLoading) handleCompleteTask(task); }}
                      activeOpacity={isTaskLoading ? 1 : 0.4}
                      disabled={isTaskLoading}
                    >
                      {isTaskLoading
                        ? <ActivityIndicator size="small" color={Colors.white} />
                        : isCompleted
                          ? <Text style={styles.taskCheckboxCheck}>✓</Text>
                          : null
                      }
                    </TouchableOpacity>

                    {/* 본문 */}
                    <View style={styles.taskCardBody}>
                      <View style={styles.taskCardTitleRow}>
                        <Text
                          style={[styles.taskCardTitle, isCompleted && styles.taskCardTitleCompleted]}
                          numberOfLines={1}
                        >
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
                            {task.priority === 'high' ? '높음' : task.priority === 'medium' ? '보통' : '낮음'}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.taskCardChipRow}>
                        <View style={isCompleted ? styles.taskChipCompleted : styles.taskChipToday}>
                          <Text style={isCompleted ? styles.taskChipTextCompleted : styles.taskChipTextToday}>
                            {isCompleted ? '완료됨' : '오늘 마감'}
                          </Text>
                        </View>
                        {task.recurrence?.type === 'fixed' && (
                          <View style={styles.taskChipRecurrence}>
                            <Text style={styles.taskChipTextRecurrence}>
                              🔁 {task.recurrence.unit === 'day' ? '매일' : task.recurrence.unit === 'week' ? '매주' : '매월'}
                            </Text>
                          </View>
                        )}
                        {dueDate && (task.estimatedMinutes ?? 0) > 0 && (
                          <View style={styles.taskChipTime}>
                            <Text style={styles.taskChipTextTime}>⏱ {task.estimatedMinutes}분</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* ── 예정된 할 일 ── */}
          {categorizedTasks.upcoming.length > 0 && (
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.sectionHeaderV2Upcoming}
                onPress={() => setUpcomingCollapsed(prev => !prev)}
                activeOpacity={0.7}
              >
                <View style={styles.sectionHeaderV2BarUpcoming} />
                <View style={styles.sectionHeaderV2Content}>
                  <Text style={styles.sectionHeaderV2TitleUpcoming}>예정된 할 일</Text>
                  <View style={styles.upcomingBadge}>
                    <Text style={styles.upcomingBadgeText}>{categorizedTasks.upcoming.length}</Text>
                  </View>
                </View>
                <Text style={styles.sectionCollapseIcon}>{upcomingCollapsed ? '▶' : '▼'}</Text>
              </TouchableOpacity>

              {!upcomingCollapsed && categorizedTasks.upcoming.map((task) => {
                if (!task || typeof task.id !== 'string') return null;
                const dueDate = task.recurrence?.nextDue ? new Date(task.recurrence.nextDue) : null;
                const isCompleted = isTaskCompleted(task);
                const isTaskLoading = taskLoadingStates[task.id] || false;

                return (
                  <TouchableOpacity
                    key={task.id}
                    style={[styles.taskCard, isCompleted && styles.taskCardCompleted]}
                    onPress={() => {
                      detailModalAnim.setValue(0);
                      setEditingField(null);
                      setTaskDetailModal({ visible: true, task });
                      Animated.timing(detailModalAnim, {
                        toValue: 1,
                        duration: 100,
                        useNativeDriver: true,
                      }).start();
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.taskCardAccentUpcoming} />
                    {/* 체크박스 */}
                    <TouchableOpacity
                      style={[styles.taskCheckboxNew, isCompleted && styles.taskCheckboxNewCompleted, isTaskLoading && styles.taskCheckboxNewLoading]}
                      onPress={(e) => { e.stopPropagation(); if (!isTaskLoading) handleCompleteTask(task); }}
                      activeOpacity={isTaskLoading ? 1 : 0.4}
                      disabled={isTaskLoading}
                    >
                      {isTaskLoading
                        ? <ActivityIndicator size="small" color={Colors.white} />
                        : isCompleted
                          ? <Text style={styles.taskCheckboxCheck}>✓</Text>
                          : null
                      }
                    </TouchableOpacity>

                    {/* 본문 */}
                    <View style={styles.taskCardBody}>
                      <View style={styles.taskCardTitleRow}>
                        <Text
                          style={[styles.taskCardTitle, styles.taskCardTitleUpcoming, isCompleted && styles.taskCardTitleCompleted]}
                          numberOfLines={1}
                        >
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
                            {task.priority === 'high' ? '높음' : task.priority === 'medium' ? '보통' : '낮음'}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.taskCardChipRow}>
                        {dueDate && (
                          <View style={styles.taskChipUpcoming}>
                            <Text style={styles.taskChipTextUpcoming}>
                              {task.recurrence?.hasTime
                                ? dueDate.toLocaleString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit' })
                                : dueDate.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' })}
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
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* 더미 섹션 — 아래 스크롤 공간 */}
          <View style={{ height: 40 }} />

        </ScrollView>
      ) : (
        // Task 추가 탭
        <ScrollView style={styles.content}>
          {(() => {
            console.log('Task 추가 탭 렌더링, activeTab:', activeTab, 'taskAddState.step:', taskAddState.step);
            return null;
          })()}
          {taskAddState.step === 'template' && (
            <TaskTemplateSelection 
              furnitureType={furniture.type}
              onSelectTemplate={handleSelectTemplate}
            />
          )}
          
          {taskAddState.step === 'customize' && taskAddState.selectedTemplate && (
            <TaskCustomizationForm
              template={taskAddState.selectedTemplate}
              customization={customization}
              onCustomizationChange={onCustomizationChange}
              startDate={startDate}
              onStartDateChange={onDateChange}
              selectedDays={selectedDays}
              onToggleDayOfWeek={onToggleDayOfWeek}
              getNextOccurrences={getNextOccurrences}
              hasTime={hasTime}
              onHasTimeChange={setHasTime}
              estimatedMinutes={customization.estimatedMinutes ?? taskAddState.selectedTemplate.estimatedMinutes}
              onEstimatedMinutesChange={(m) => onCustomizationChange({ ...customization, estimatedMinutes: m })}
            />
          )}
        </ScrollView>
      )}

      {/* Task 액션 모달 */}
      <Modal
        visible={taskActionModal.visible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setTaskActionModal({ visible: false, task: null, action: null })}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setTaskActionModal({ visible: false, task: null, action: null })}
          />
          
          <View style={styles.taskActionModalCompact}>
            {taskActionModal.task && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitleCompact} numberOfLines={1}>
                    {taskActionModal.task.title}
                  </Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setTaskActionModal({ visible: false, task: null, action: null })}
                  >
                    <Text style={styles.closeButtonText}>×</Text>
                  </TouchableOpacity>
                </View>

                {taskActionModal.action === 'postpone' ? (
                  <View style={styles.postponeSectionCompact}>
                    <Text style={styles.postponeTitleCompact}>미루기</Text>
                    <View style={styles.postponeOptionsCompact}>
                      {[
                        { days: 1, label: '1일' },
                        { days: 2, label: '2일' },
                        { days: 3, label: '3일' },
                        { days: 7, label: '1주' },
                      ].map(option => (
                        <TouchableOpacity
                          key={option.days}
                          style={[
                            styles.postponeOptionButton,
                            postponeDays === option.days && styles.postponeOptionButtonActive
                          ]}
                          onPress={() => setPostponeDays(option.days)}
                        >
                          <Text style={[
                            styles.postponeOptionText,
                            postponeDays === option.days && styles.postponeOptionTextActive
                          ]}>
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <View style={styles.postponeActions}>
                      <TouchableOpacity
                        style={styles.postponeCancelButton}
                        onPress={() => setTaskActionModal(prev => ({ ...prev, action: null }))}
                      >
                        <Text style={styles.postponeCancelText}>취소</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.postponeConfirmButton}
                        onPress={() => handlePostponeTask(taskActionModal.task!)}
                      >
                        <Text style={styles.postponeConfirmText}>미루기</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.modalActionsCompact}>
                    <TouchableOpacity
                      style={[styles.modalActionButton, styles.completeActionButton]}
                      onPress={() => handleCompleteTask(taskActionModal.task!)}
                    >
                      <Text style={styles.actionButtonEmoji}>✓</Text>
                      <Text style={styles.actionButtonLabel}>완료</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.modalActionButton, styles.postponeActionButton]}
                      onPress={() => setTaskActionModal(prev => ({ ...prev, action: 'postpone' }))}
                    >
                      <Text style={styles.actionButtonEmoji}>⏰</Text>
                      <Text style={styles.actionButtonLabel}>미루기</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.modalActionButton, styles.deleteActionButton]}
                      onPress={() => handleDeleteTask(taskActionModal.task!)}
                    >
                      <Text style={styles.actionButtonEmoji}>🗑️</Text>
                      <Text style={styles.actionButtonLabel}>삭제</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Task 세부정보 모달 */}
      <Modal
        visible={taskDetailModal.visible}
        transparent={true}
        animationType="none"
        onRequestClose={() => setTaskDetailModal({ visible: false, task: null })}
      >
        <View style={styles.detailModalOverlay}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setTaskDetailModal({ visible: false, task: null })}
          />
          <Animated.View style={[
            styles.taskDetailModal,
            {
              opacity: detailModalAnim,
              transform: [{ scale: detailModalAnim.interpolate({ inputRange: [0, 1], outputRange: [0.93, 1] }) }],
            }
          ]}>
            {taskDetailModal.task && (() => {
              const task = taskDetailModal.task!;
              const isCompleted = isTaskCompleted(task);
              const dueDate = task.recurrence?.nextDue ? new Date(task.recurrence.nextDue) : null;
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const nextDue = dueDate ? new Date(dueDate) : null;
              if (nextDue) nextDue.setHours(0, 0, 0, 0);
              const hasPushedSchedule = nextDue && nextDue > today && task.completionHistory && task.completionHistory.length > 0;

              // D-day 계산
              const diffMs = nextDue && !isNaN(nextDue.getTime()) ? nextDue.getTime() - today.getTime() : null;
              const diffDays = diffMs !== null ? Math.round(diffMs / (1000 * 60 * 60 * 24)) : null;
              const isOverdue = diffDays !== null && diffDays < 0;
              const isDueToday = diffDays === 0;

              // 상태 배너 설정
              let bannerBg = 'transparent';
              let bannerText = '';
              if (isCompleted) {
                bannerBg = Colors.success + '18';
                bannerText = '완료됨';
              } else if (isOverdue) {
                bannerBg = Colors.error + '18';
                bannerText = `${Math.abs(diffDays!)}일 연체 중`;
              } else if (isDueToday) {
                bannerBg = Colors.warning + '18';
                bannerText = '오늘 마감';
              } else if (diffDays !== null && diffDays <= 3) {
                bannerBg = Colors.primary + '12';
                bannerText = `D-${diffDays}`;
              }

              const bannerTextColor = isCompleted
                ? Colors.success
                : isOverdue
                ? Colors.error
                : isDueToday
                ? Colors.warning
                : Colors.primary;

              return (
                <>
                  {/* ── 고정 헤더 ── */}
                  <View style={styles.detailHeaderFixed}>
                    {/* 상태 배너 */}
                    {bannerText !== '' && (
                      <View style={[styles.detailStatusBanner, { backgroundColor: bannerBg }]}>
                        <Text style={[styles.detailStatusBannerText, { color: bannerTextColor }]}>
                          {bannerText}
                        </Text>
                      </View>
                    )}

                    <View style={styles.detailHeaderRow}>
                      <Text style={styles.detailTitle} numberOfLines={2}>{task.title}</Text>
                      <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => setTaskDetailModal({ visible: false, task: null })}
                      >
                        <Text style={styles.closeButtonText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* ── 스크롤 콘텐츠 ── */}
                  <ScrollView
                    style={styles.detailScrollContent}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: Spacing.md }}
                  >
                    {/* 요약 정보 카드 — 항상 compact */}
                    <View style={styles.detailSummaryCardV2}>
                      {dueDate && (
                        <View style={styles.detailSummaryRowItem}>
                          <Text style={styles.detailSummaryIcon}>📅</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.detailSummaryLabel}>다음 예정일</Text>
                            <Text style={[
                              styles.detailSummaryValue,
                              isOverdue && { color: Colors.error },
                              isDueToday && { color: Colors.warning },
                            ]}>
                              {task.recurrence?.hasTime
                                ? dueDate.toLocaleString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit' })
                                : dueDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
                            </Text>
                          </View>
                          {diffDays !== null && (
                            <View style={[
                              styles.detailDdayBadge,
                              isOverdue && { backgroundColor: Colors.error + '18' },
                              isDueToday && { backgroundColor: Colors.warning + '18' },
                              !isOverdue && !isDueToday && { backgroundColor: Colors.primary + '12' },
                            ]}>
                              <Text style={[
                                styles.detailDdayText,
                                isOverdue && { color: Colors.error },
                                isDueToday && { color: Colors.warning },
                                !isOverdue && !isDueToday && { color: Colors.primary },
                              ]}>
                                {isCompleted ? '완료' : isOverdue ? `+${Math.abs(diffDays)}` : isDueToday ? 'D-Day' : `D-${diffDays}`}
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                      {task.recurrence?.type === 'fixed' && (
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
                              setEditRecurrenceUnit(task.recurrence.unit as 'day' | 'week' | 'month');
                              setEditRecurrenceInterval(task.recurrence.interval || 1);
                              const initialStart = task.recurrence.nextDue
                                ? new Date(task.recurrence.nextDue)
                                : new Date();
                              const existingHasTime = task.recurrence.hasTime ?? false;
                              if (!existingHasTime) {
                                initialStart.setHours(9, 0, 0, 0);
                              }
                              setEditHasTime(existingHasTime);
                              setEditStartDate(initialStart);
                              setEditSelectedDays([]);
                              setEditingField('recurrence');
                            }
                          }}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.detailSummaryIcon}>🔁</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.detailSummaryLabel}>반복 주기</Text>
                            <Text style={[
                              styles.detailSummaryValue,
                              editingField === 'recurrence' && { color: Colors.primary },
                            ]}>
                              {task.recurrence.interval && task.recurrence.interval > 1 ? `${task.recurrence.interval} ` : ''}
                              {task.recurrence.unit === 'day' ? '매일' : task.recurrence.unit === 'week' ? '매주' : '매월'}
                            </Text>
                          </View>
                          <Text style={[
                            styles.detailEditIcon,
                            editingField === 'recurrence' && { color: Colors.primary, opacity: 1 },
                          ]}>
                            {editingField === 'recurrence' ? '▲' : '✏️'}
                          </Text>
                        </TouchableOpacity>
                      )}
                      {task.estimatedMinutes !== undefined && (
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
                              setEditMinutes(task.estimatedMinutes || 15);
                              setEditingField('minutes');
                            }
                          }}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.detailSummaryIcon}>⏱</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.detailSummaryLabel}>예상 소요</Text>
                            <Text style={[
                              styles.detailSummaryValue,
                              editingField === 'minutes' && { color: Colors.warning },
                            ]}>
                              {task.estimatedMinutes}분
                            </Text>
                          </View>
                          <Text style={[
                            styles.detailEditIcon,
                            editingField === 'minutes' && { color: Colors.warning, opacity: 1 },
                          ]}>
                            {editingField === 'minutes' ? '▲' : '✏️'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* 반복 주기 편집 패널 — 카드 바깥 */}
                    {editingField === 'recurrence' && (
                      <View style={styles.detailEditPanel}>
                        <View style={styles.detailEditPanelHeaderRecurrence}>
                          <View style={styles.detailEditPanelBar} />
                          <Text style={[styles.detailEditPanelTitle, { color: Colors.primary }]}>반복 주기 편집</Text>
                        </View>
                        <View style={styles.detailEditPanelBody}>
                          <RecurrenceEditor
                            unit={editRecurrenceUnit}
                            interval={editRecurrenceInterval}
                            selectedDays={editSelectedDays}
                            startDate={editStartDate}
                            onUnitChange={setEditRecurrenceUnit}
                            onIntervalChange={setEditRecurrenceInterval}
                            onToggleDayOfWeek={(day) => {
                              setEditSelectedDays(prev =>
                                prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
                              );
                            }}
                            onStartDateChange={setEditStartDate}
                            getNextOccurrences={getNextOccurrences}
                            hasTime={editHasTime}
                            onHasTimeChange={setEditHasTime}
                          />
                          <View style={styles.detailRecurrenceEditorActions}>
                            <TouchableOpacity
                              style={styles.detailInlineSaveBtn}
                              onPress={() => handleUpdateRecurrence(task, editRecurrenceUnit, editRecurrenceInterval, editStartDate, editHasTime)}
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
                      </View>
                    )}

                    {/* 예상 소요 편집 패널 — 카드 바깥 */}
                    {editingField === 'minutes' && (
                      <View style={styles.detailEditPanel}>
                        <View style={styles.detailEditPanelHeaderMinutes}>
                          <View style={[styles.detailEditPanelBar, { backgroundColor: Colors.warning }]} />
                          <Text style={[styles.detailEditPanelTitle, { color: Colors.warning }]}>예상 소요 시간 편집</Text>
                        </View>
                        <View style={styles.detailEditPanelBody}>
                          <View style={styles.detailInlineIntervalRow}>
                            <TouchableOpacity
                              style={styles.detailInlineStepBtn}
                              onPress={() => setEditMinutes(v => Math.max(5, v - 5))}
                            >
                              <Text style={styles.detailInlineStepText}>−</Text>
                            </TouchableOpacity>
                            <View style={styles.detailInlineValueBox}>
                              <Text style={styles.detailInlineNumber}>{editMinutes}</Text>
                              <Text style={styles.detailInlineUnit}>분</Text>
                            </View>
                            <TouchableOpacity
                              style={styles.detailInlineStepBtn}
                              onPress={() => setEditMinutes(v => Math.min(120, v + 5))}
                            >
                              <Text style={styles.detailInlineStepText}>+</Text>
                            </TouchableOpacity>
                          </View>
                          <View style={styles.detailRecurrenceEditorActions}>
                            <TouchableOpacity
                              style={[styles.detailInlineSaveBtn, { backgroundColor: Colors.warning }]}
                              onPress={() => handleUpdateMinutes(task, editMinutes)}
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
                      </View>
                    )}

                    {/* 설명 */}
                    {task.description && (
                      <View style={styles.detailDescBox}>
                        <Text style={styles.detailDescription}>{task.description}</Text>
                      </View>
                    )}

                    {/* 우선순위 선택 */}
                    <View style={styles.detailPrioritySection}>
                      <Text style={styles.detailPrioritySectionLabel}>우선순위</Text>
                      <View style={styles.detailPriorityRow}>
                        {(['low', 'medium', 'high'] as const).map((level) => {
                          const isActive = task.priority === level;
                          const label = level === 'low' ? '낮음' : level === 'medium' ? '보통' : '높음';
                          return (
                            <TouchableOpacity
                              key={level}
                              style={[
                                styles.formPriorityBtn,
                                level === 'high' && styles.formPriorityBtnHigh,
                                level === 'medium' && styles.formPriorityBtnMedium,
                                level === 'low' && styles.formPriorityBtnLow,
                                isActive && styles.formPriorityBtnActive,
                                isActive && level === 'high' && styles.formPriorityBtnActiveHigh,
                                isActive && level === 'medium' && styles.formPriorityBtnActiveMedium,
                                isActive && level === 'low' && styles.formPriorityBtnActiveLow,
                              ]}
                              onPress={() => handleUpdatePriority(task, level)}
                              activeOpacity={0.75}
                            >
                              <Text style={[
                                styles.formPriorityBtnText,
                                isActive && styles.formPriorityBtnTextActive,
                              ]}>{label}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  </ScrollView>

                  {/* ── 고정 액션 버튼 ── */}
                  <View style={styles.detailActionsFixed}>
                    <View style={styles.detailActionsRow}>
                      {/* 완료 / 완료취소 */}
                      <TouchableOpacity
                        style={[
                          styles.detailActionCompactBtn,
                          isCompleted ? styles.detailCompleteBtnUndo : styles.detailCompleteBtnDone,
                        ]}
                        onPress={() => {
                          handleCompleteTask(task);
                          setTaskDetailModal({ visible: false, task: null });
                        }}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.detailActionCompactIcon}>{isCompleted ? '↩' : '✓'}</Text>
                        <Text style={styles.detailActionCompactText}>{isCompleted ? '완료 취소' : '완료'}</Text>
                      </TouchableOpacity>

                      {/* 미루기 */}
                      <TouchableOpacity
                        style={[styles.detailActionCompactBtn, styles.detailSubBtn]}
                        onPress={() => {
                          setTaskDetailModal({ visible: false, task: null });
                          setTaskActionModal({ visible: true, task, action: 'postpone' });
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.detailActionCompactIcon}>⏰</Text>
                        <Text style={[styles.detailActionCompactText, { color: Colors.primary }]}>미루기</Text>
                      </TouchableOpacity>

                      {/* 삭제 */}
                      <TouchableOpacity
                        style={[styles.detailActionCompactBtn, styles.detailDeleteBtn]}
                        onPress={() => {
                          setTaskDetailModal({ visible: false, task: null });
                          handleDeleteTask(task);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.detailActionCompactIcon}>🗑</Text>
                        <Text style={[styles.detailActionCompactText, styles.detailDeleteBtnText]}>삭제</Text>
                      </TouchableOpacity>
                    </View>

                    {/* 일정 복원 (조건부 — 미뤄진 경우에만 별도 표시) */}
                    {hasPushedSchedule && (
                      <TouchableOpacity
                        style={styles.detailRevertBtn}
                        onPress={() => {
                          handleRevertToOriginalSchedule(task);
                          setTaskDetailModal({ visible: false, task: null });
                        }}
                        activeOpacity={0.8}
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

      {/* Task 추가 모달 */}
      <Modal
        visible={taskAddModal.visible}
        transparent={true}
        animationType="none"
        onRequestClose={() => setTaskAddModal({ visible: false, template: null })}
      >
        <View style={styles.taskAddModalOverlay}>
          <TouchableOpacity
            style={styles.taskAddModalBackdrop}
            activeOpacity={1}
            onPress={() => setTaskAddModal({ visible: false, template: null })}
          />

          <View style={styles.taskAddModalCentered}>
            {taskAddModal.template && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle} numberOfLines={2}>
                    {taskAddModal.template.title} 추가
                  </Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setTaskAddModal({ visible: false, template: null })}
                  >
                    <Text style={styles.closeButtonText}>×</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                  <TaskCustomizationForm
                    template={taskAddModal.template}
                    customization={customization}
                    onCustomizationChange={onCustomizationChange}
                    startDate={startDate}
                    onStartDateChange={onDateChange}
                    selectedDays={selectedDays}
                    onToggleDayOfWeek={onToggleDayOfWeek}
                    getNextOccurrences={getNextOccurrences}
                    hasTime={hasTime}
                    onHasTimeChange={setHasTime}
                    estimatedMinutes={customization.estimatedMinutes ?? taskAddModal.template.estimatedMinutes}
                    onEstimatedMinutesChange={(m) => onCustomizationChange({ ...customization, estimatedMinutes: m })}
                  />
                </ScrollView>
                
                {/* 고정된 하단 버튼 */}
                <View style={styles.modalFooter}>
                  <TouchableOpacity 
                    style={styles.modalCancelButton} 
                    onPress={() => setTaskAddModal({ visible: false, template: null })}
                  >
                    <Text style={styles.modalCancelButtonText}>취소</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.modalConfirmButton,
                      loading && styles.modalConfirmButtonDisabled
                    ]} 
                    onPress={() => {
                      if (loading) return;
                      console.log('추가 버튼 클릭됨');
                      handleConfirmTask();
                      setTaskAddModal({ visible: false, template: null });
                    }}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.modalConfirmButtonText}>추가</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

// 템플릿 선택 컴포넌트
const TaskTemplateSelection: React.FC<{
  furnitureType: string;
  onSelectTemplate: (template: TaskTemplateItem) => void;
}> = ({ furnitureType, onSelectTemplate }) => {
  const template = getTemplateByFurnitureType(furnitureType);

  if (!template) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>이 가구에 대한 Task 템플릿이 없습니다.</Text>
      </View>
    );
  }

  return (
    <View style={styles.templateSelectionWrapper}>
      {/* 섹션 헤더 V2 */}
      <View style={styles.templateSelectionHeader}>
        <View style={styles.templateSelectionHeaderBar} />
        <View style={styles.templateSelectionHeaderContent}>
          <Text style={styles.templateSelectionHeaderTitle}>
            {template.furnitureName} 관리
          </Text>
          <Text style={styles.templateSelectionHeaderSub}>
            추가할 Task를 선택하세요
          </Text>
        </View>
      </View>

      {/* 템플릿 카드 그리드 */}
      <View style={styles.templateGrid}>
        {template.tasks.map((task) => (
          <TouchableOpacity
            key={task.id}
            style={styles.templateCardNew}
            onPress={() => onSelectTemplate(task)}
            activeOpacity={0.75}
          >
            {/* 제목 + 우선순위 pill */}
            <View style={styles.templateCardTitleRow}>
              <Text style={styles.templateCardTitle} numberOfLines={1}>
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
                  {task.priority === 'high' ? '높음' : task.priority === 'medium' ? '보통' : '낮음'}
                </Text>
              </View>
            </View>

            {/* 설명 미리보기 */}
            {task.description ? (
              <Text style={styles.templateCardDesc} numberOfLines={1}>
                {task.description}
              </Text>
            ) : null}

            {/* 하단: 소요시간 칩 + 화살표 */}
            <View style={styles.templateCardFooter}>
              <View style={styles.taskChipTime}>
                <Text style={styles.taskChipTextTime}>⏱ {task.estimatedMinutes}분</Text>
              </View>
              <Text style={styles.templateCardArrow}>›</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// Task 커스터마이징 폼 컴포넌트 (전면 개편)
// ── 반복 설정 + 시작일 재사용 컴포넌트 ──
const RecurrenceEditor: React.FC<{
  unit: 'day' | 'week' | 'month';
  interval: number;
  selectedDays: DayOfWeek[];
  startDate: Date;
  onUnitChange: (unit: 'day' | 'week' | 'month') => void;
  onIntervalChange: (interval: number) => void;
  onToggleDayOfWeek: (day: DayOfWeek) => void;
  onStartDateChange: (date: Date) => void;
  getNextOccurrences: (startDate: Date, customization: TaskCustomization, selectedDays: DayOfWeek[], count: number) => Date[];
  hasTime?: boolean;
  onHasTimeChange?: (hasTime: boolean) => void;
  hasEstimatedTime?: boolean;
  onHasEstimatedTimeChange?: (v: boolean) => void;
  estimatedMinutes?: number;
  onEstimatedMinutesChange?: (minutes: number) => void;
}> = ({
  unit,
  interval,
  selectedDays,
  startDate,
  onUnitChange,
  onIntervalChange,
  onToggleDayOfWeek,
  onStartDateChange,
  getNextOccurrences,
  hasTime = false,
  onHasTimeChange,
  hasEstimatedTime = false,
  onHasEstimatedTimeChange,
  estimatedMinutes = 30,
  onEstimatedMinutesChange,
}) => {
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const [currentCalendarMonth, setCurrentCalendarMonth] = React.useState(startDate);

  // getNextOccurrences 호환을 위한 customization 객체 구성
  const pseudoCustomization: TaskCustomization = {
    recurrenceType: unit === 'day' ? 'daily' : unit === 'week' ? 'weekly' : 'monthly',
    interval,
  };

  return (
    <>
      {/* ── 반복 설정 섹션 ── */}
      <View style={styles.formSectionHeaderUpcoming}>
        <View style={styles.formSectionHeaderBar} />
        <Text style={styles.formSectionHeaderTitle}>반복 설정</Text>
      </View>

      <View style={styles.formSettingCard}>
        {/* 반복 주기 선택 */}
        <View style={styles.recurrenceGrid}>
          {(['day', 'week', 'month'] as const).map((u) => (
            <TouchableOpacity
              key={u}
              style={[
                styles.modernRecurrenceCard,
                unit === u && styles.modernRecurrenceCardActive,
              ]}
              onPress={() => onUnitChange(u)}
            >
              <Text style={styles.recurrenceIcon}>
                {u === 'day' ? '📅' : u === 'week' ? '📆' : '🗓️'}
              </Text>
              <Text style={[
                styles.modernRecurrenceText,
                unit === u && styles.modernRecurrenceTextActive,
              ]}>
                {u === 'day' ? '매일' : u === 'week' ? '매주' : '매월'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 간격 설정 */}
        <View style={styles.formIntervalRow}>
          <Text style={styles.formIntervalLabel}>간격</Text>
          <View style={styles.formIntervalControls}>
            <TouchableOpacity
              style={styles.formIntervalBtn}
              onPress={() => onIntervalChange(Math.max(1, interval - 1))}
            >
              <Text style={styles.formIntervalBtnText}>−</Text>
            </TouchableOpacity>
            <View style={styles.formIntervalValueBox}>
              <Text style={styles.formIntervalNumber}>{interval}</Text>
              <Text style={styles.formIntervalUnit}>
                {unit === 'day' ? '일마다' : unit === 'week' ? '주마다' : '개월마다'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.formIntervalBtn}
              onPress={() => onIntervalChange(Math.min(30, interval + 1))}
            >
              <Text style={styles.formIntervalBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 요일 선택 (주간 반복 시) */}
        {unit === 'week' && (
          <View style={styles.formDayPickerRow}>
            <Text style={styles.formIntervalLabel}>요일</Text>
            <View style={styles.formDayPicker}>
              {dayNames.map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.formDayBtn,
                    selectedDays.includes(index as DayOfWeek) && styles.formDayBtnActive,
                  ]}
                  onPress={() => onToggleDayOfWeek(index as DayOfWeek)}
                >
                  <Text style={[
                    styles.formDayBtnText,
                    selectedDays.includes(index as DayOfWeek) && styles.formDayBtnTextActive,
                  ]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* ── 시작일 섹션 ── */}
      <View style={styles.formSectionHeaderUpcoming}>
        <View style={styles.formSectionHeaderBar} />
        <Text style={styles.formSectionHeaderTitle}>시작일</Text>
      </View>

      <View style={styles.formSettingCard}>
        {/* 시작일 선택 */}
        <View style={styles.formStartDateRow}>
          <TouchableOpacity
            style={styles.formDateBtn}
            onPress={() => {
              const d = new Date(startDate);
              d.setDate(d.getDate() - 1);
              onStartDateChange(d);
            }}
          >
            <Text style={styles.formDateBtnText}>‹</Text>
          </TouchableOpacity>
          <View style={styles.formDateDisplay}>
            <Text style={styles.formDateText}>
              {startDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
            </Text>
            <Text style={styles.formDateWeekday}>
              {startDate.toLocaleDateString('ko-KR', { weekday: 'long' })}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.formDateBtn}
            onPress={() => {
              const d = new Date(startDate);
              d.setDate(d.getDate() + 1);
              onStartDateChange(d);
            }}
          >
            <Text style={styles.formDateBtnText}>›</Text>
          </TouchableOpacity>
        </View>

        {/* 달력 */}
        <View style={styles.calendarContainer}>
          <Calendar
            style={styles.calendar}
            current={startDate.toISOString().split('T')[0]}
            markedDates={(() => {
              const marked: { [key: string]: any } = {};
              const nextDates = getNextOccurrences(startDate, pseudoCustomization, selectedDays, 10);
              nextDates.forEach((date, index) => {
                const dateString = date.toISOString().split('T')[0];
                if (index < 3) {
                  marked[dateString] = {
                    selected: true,
                    selectedColor: Colors.primary,
                    selectedTextColor: Colors.white,
                  };
                } else {
                  marked[dateString] = { marked: true, dotColor: Colors.textSecondary };
                }
              });
              return marked;
            })()}
            dayComponent={({ date, state }) => {
              if (!date) return null;
              const dateObj = new Date(date.year, date.month - 1, date.day);
              const dayOfWeek = dateObj.getDay();
              const isHoliday = KoreanHolidays.isHoliday(dateObj);
              const nextDates = getNextOccurrences(startDate, pseudoCustomization, selectedDays, 50);
              const hasSchedule = nextDates.some(d => d.toISOString().split('T')[0] === date.dateString);
              let textColor: any = Colors.textPrimary;
              if (isHoliday || dayOfWeek === 0) textColor = '#FF3B30';
              else if (dayOfWeek === 6) textColor = '#007AFF';
              return (
                <View style={hasSchedule ? [styles.calendarDay, styles.calendarDayMarked] : styles.calendarDay}>
                  <Text style={[styles.calendarDayText, { color: textColor }]}>{date.day}</Text>
                </View>
              );
            }}
            theme={{
              backgroundColor: Colors.white,
              calendarBackground: Colors.white,
              textSectionTitleColor: Colors.textSecondary,
              selectedDayBackgroundColor: Colors.primary,
              selectedDayTextColor: Colors.white,
              todayTextColor: Colors.primary,
              dayTextColor: Colors.textPrimary,
              textDisabledColor: Colors.lightGray,
              dotColor: Colors.primary,
              selectedDotColor: Colors.white,
              arrowColor: Colors.primary,
              disabledArrowColor: Colors.lightGray,
              monthTextColor: Colors.textPrimary,
              indicatorColor: Colors.primary,
              textDayFontWeight: '400',
              textMonthFontWeight: '600',
              textDayHeaderFontWeight: '500',
              textDayFontSize: 12,
              textMonthFontSize: 14,
              textDayHeaderFontSize: 10,
            }}
            hideExtraDays={true}
            disableMonthChange={false}
            firstDay={1}
            hideDayNames={false}
            showWeekNumbers={false}
            disableArrowLeft={false}
            disableArrowRight={false}
            onMonthChange={(month) => {
              setCurrentCalendarMonth(new Date(month.year, month.month - 1, 1));
            }}
          />
        </View>
        <Text style={styles.formCalendarHint}>파란 테두리 = 반복 예정일</Text>
      </View>

      {/* ── 시간 설정 섹션 ── */}
      <View style={styles.formSectionHeaderUpcoming}>
        <View style={styles.formSectionHeaderBar} />
        <Text style={styles.formSectionHeaderTitle}>시간 설정</Text>
      </View>

      <View style={styles.formSettingCard}>
        {/* 시간 지정 토글 */}
        <View style={styles.formTimeToggleRow}>
          <Text style={styles.formIntervalLabel}>시간 지정</Text>
          <Switch
            value={hasTime}
            onValueChange={(v) => {
              onHasTimeChange?.(v);
              if (v) {
                const d = new Date(startDate);
                d.setHours(9, 0, 0, 0);
                onStartDateChange(d);
              }
            }}
            trackColor={{ false: Colors.lightGray, true: Colors.primary }}
            thumbColor={Colors.white}
          />
        </View>

        {/* 시간/분 스텝퍼 (hasTime=true일 때만 표시) */}
        {hasTime && (
          <View style={styles.formTimePickerRow}>
            {/* 시 */}
            <TouchableOpacity
              style={styles.formDateBtn}
              onPress={() => {
                const d = new Date(startDate);
                d.setHours((d.getHours() - 1 + 24) % 24);
                onStartDateChange(d);
              }}
            >
              <Text style={styles.formDateBtnText}>‹</Text>
            </TouchableOpacity>
            <View style={styles.formTimeValueBox}>
              <Text style={styles.formTimeValueText}>
                {String(startDate.getHours()).padStart(2, '0')}
              </Text>
              <Text style={styles.formTimeUnitLabel}>시</Text>
            </View>
            <TouchableOpacity
              style={styles.formDateBtn}
              onPress={() => {
                const d = new Date(startDate);
                d.setHours((d.getHours() + 1) % 24);
                onStartDateChange(d);
              }}
            >
              <Text style={styles.formDateBtnText}>›</Text>
            </TouchableOpacity>

            <Text style={styles.formTimeColon}>:</Text>

            {/* 분 (10분 단위) */}
            <TouchableOpacity
              style={styles.formDateBtn}
              onPress={() => {
                const d = new Date(startDate);
                const newMin = Math.floor(d.getMinutes() / 10) * 10;
                d.setMinutes((newMin - 10 + 60) % 60);
                onStartDateChange(d);
              }}
            >
              <Text style={styles.formDateBtnText}>‹</Text>
            </TouchableOpacity>
            <View style={styles.formTimeValueBox}>
              <Text style={styles.formTimeValueText}>
                {String(Math.floor(startDate.getMinutes() / 10) * 10).padStart(2, '0')}
              </Text>
              <Text style={styles.formTimeUnitLabel}>분</Text>
            </View>
            <TouchableOpacity
              style={styles.formDateBtn}
              onPress={() => {
                const d = new Date(startDate);
                const newMin = Math.floor(d.getMinutes() / 10) * 10;
                d.setMinutes((newMin + 10) % 60);
                onStartDateChange(d);
              }}
            >
              <Text style={styles.formDateBtnText}>›</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 구분선 */}
        {onHasEstimatedTimeChange !== undefined && (
          <View style={styles.formTimeDivider} />
        )}

        {/* 소요시간 토글 */}
        {onHasEstimatedTimeChange !== undefined && (
          <View style={styles.formTimeToggleRow}>
            <Text style={styles.formIntervalLabel}>소요시간 지정</Text>
            <Switch
              value={hasEstimatedTime}
              onValueChange={onHasEstimatedTimeChange}
              trackColor={{ false: Colors.lightGray, true: Colors.warning }}
              thumbColor={Colors.white}
            />
          </View>
        )}

        {/* 소요시간 스텝퍼 (hasEstimatedTime=true일 때만 표시) */}
        {onHasEstimatedTimeChange !== undefined && hasEstimatedTime && (
          <View style={styles.formIntervalRow}>
            <View style={styles.formIntervalControls}>
              <TouchableOpacity
                style={styles.formIntervalBtn}
                onPress={() => onEstimatedMinutesChange?.(Math.max(5, estimatedMinutes - 5))}
              >
                <Text style={styles.formIntervalBtnText}>−</Text>
              </TouchableOpacity>
              <View style={styles.formIntervalValueBox}>
                <Text style={styles.formIntervalNumber}>{estimatedMinutes}</Text>
                <Text style={styles.formIntervalUnit}>분</Text>
              </View>
              <TouchableOpacity
                style={styles.formIntervalBtn}
                onPress={() => onEstimatedMinutesChange?.(Math.min(180, estimatedMinutes + 5))}
              >
                <Text style={styles.formIntervalBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </>
  );
};

const TaskCustomizationForm: React.FC<{
  template: TaskTemplateItem;
  customization: TaskCustomization;
  onCustomizationChange: (customization: TaskCustomization) => void;
  startDate: Date;
  onStartDateChange: (date: Date) => void;
  selectedDays: DayOfWeek[];
  onToggleDayOfWeek: (day: DayOfWeek) => void;
  getNextOccurrences: (startDate: Date, customization: TaskCustomization, selectedDays: DayOfWeek[], count: number) => Date[];
  hasTime: boolean;
  onHasTimeChange: (hasTime: boolean) => void;
  estimatedMinutes: number;
  onEstimatedMinutesChange: (minutes: number) => void;
}> = ({
  template,
  customization,
  onCustomizationChange,
  startDate,
  onStartDateChange,
  selectedDays,
  onToggleDayOfWeek,
  getNextOccurrences,
  hasTime,
  onHasTimeChange,
  estimatedMinutes,
  onEstimatedMinutesChange,
}) => {
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const [currentCalendarMonth, setCurrentCalendarMonth] = React.useState(startDate);
  const [hasEstimatedTime, setHasEstimatedTime] = React.useState(false);

  // 주말 및 공휴일 색상 적용 함수
  const getDateColor = (dateString: string) => {
    const date = new Date(dateString);
    const dayOfWeek = date.getDay(); // 0 = 일요일, 6 = 토요일
    
    // 공휴일 확인
    const isHoliday = KoreanHolidays.isHoliday(date);
    
    if (isHoliday || dayOfWeek === 0) { // 공휴일 또는 일요일
      return '#FF3B30'; // 빨간색
    } else if (dayOfWeek === 6) { // 토요일
      return '#007AFF'; // 파란색
    }
    
    return Colors.textPrimary; // 평일
  };

  return (
    <View style={styles.modernForm}>

      {/* ── Task 요약 정보 카드 ── */}
      <View style={styles.formSummaryCard}>
        <Text style={styles.formSummaryDesc}>{template.description}</Text>
        <View style={styles.formSummaryBottom}>
          {/* 우선순위 선택 */}
          <View style={styles.formPriorityRow}>
            {(['low', 'medium', 'high'] as const).map((level) => {
              const isActive = (customization.priority || template.priority) === level;
              const label = level === 'low' ? '낮음' : level === 'medium' ? '보통' : '높음';
              return (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.formPriorityBtn,
                    level === 'high' && styles.formPriorityBtnHigh,
                    level === 'medium' && styles.formPriorityBtnMedium,
                    level === 'low' && styles.formPriorityBtnLow,
                    isActive && styles.formPriorityBtnActive,
                    isActive && level === 'high' && styles.formPriorityBtnActiveHigh,
                    isActive && level === 'medium' && styles.formPriorityBtnActiveMedium,
                    isActive && level === 'low' && styles.formPriorityBtnActiveLow,
                  ]}
                  onPress={() => onCustomizationChange({ ...customization, priority: level })}
                  activeOpacity={0.75}
                >
                  <Text style={[
                    styles.formPriorityBtnText,
                    isActive && styles.formPriorityBtnTextActive,
                  ]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      <RecurrenceEditor
        unit={customization.recurrenceType === 'daily' ? 'day' : customization.recurrenceType === 'weekly' ? 'week' : 'month'}
        interval={customization.interval || 1}
        selectedDays={selectedDays}
        startDate={startDate}
        onUnitChange={(u) => onCustomizationChange({
          ...customization,
          recurrenceType: u === 'day' ? 'daily' : u === 'week' ? 'weekly' : 'monthly',
        })}
        onIntervalChange={(v) => onCustomizationChange({ ...customization, interval: v })}
        onToggleDayOfWeek={onToggleDayOfWeek}
        onStartDateChange={onStartDateChange}
        getNextOccurrences={getNextOccurrences}
        hasTime={hasTime}
        onHasTimeChange={onHasTimeChange}
        hasEstimatedTime={hasEstimatedTime}
        onHasEstimatedTimeChange={(v) => {
          setHasEstimatedTime(v);
          if (v && estimatedMinutes === 0) {
            onEstimatedMinutesChange(template.estimatedMinutes);
          } else if (!v) {
            onEstimatedMinutesChange(0);
          }
        }}
        estimatedMinutes={estimatedMinutes === 0 ? template.estimatedMinutes : estimatedMinutes}
        onEstimatedMinutesChange={onEstimatedMinutesChange}
      />

      {/* 하단 여백 */}
      <View style={{ height: Spacing.lg }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // 모던 폼 스타일
  modernForm: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  modernHeader: {
    paddingBottom: Spacing.sm,
  },
  taskInfoCard: {
    paddingVertical: Spacing.xs,
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  modernTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.md,
  },
  modernSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  estimateText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 13,
  },
  priorityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.veryLightGray,
  },
  priorityBadgeHigh: {
    backgroundColor: Colors.error + '20',
  },
  priorityBadgeMedium: {
    backgroundColor: Colors.warning + '20',
  },
  priorityBadgeLow: {
    backgroundColor: Colors.success + '20',
  },
  priorityBadgeText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  // ── TaskTemplateSelection 새 스타일 ──
  templateSelectionWrapper: {
    paddingBottom: Spacing.md,
  },
  templateSelectionHeader: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: Colors.primary + '10',
    borderRadius: 10,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  templateSelectionHeaderBar: {
    width: 4,
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  templateSelectionHeaderContent: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  templateSelectionHeaderTitle: {
    ...Typography.label,
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  templateSelectionHeaderSub: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  templateCardNew: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    margin: 4,
    flex: 1,
    minWidth: '45%',
    maxWidth: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  templateCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 5,
    gap: 4,
  },
  templateCardTitle: {
    ...Typography.label,
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    lineHeight: 18,
  },
  templateCardDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
    marginBottom: Spacing.sm,
  },
  templateCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  templateCardArrow: {
    fontSize: 18,
    color: Colors.lightGray,
    fontWeight: '600',
    lineHeight: 20,
  },

  // ── TaskCustomizationForm 새 스타일 ──
  formSummaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'column',
    gap: Spacing.sm,
  },
  formSummaryBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  formPriorityRow: {
    flexDirection: 'row',
    gap: 6,
  },
  formPriorityBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.veryLightGray,
    backgroundColor: Colors.background,
  },
  formPriorityBtnHigh: {
    borderColor: Colors.error + '40',
  },
  formPriorityBtnMedium: {
    borderColor: Colors.warning + '40',
  },
  formPriorityBtnLow: {
    borderColor: Colors.success + '40',
  },
  formPriorityBtnActive: {
    borderWidth: 1.5,
  },
  formPriorityBtnActiveHigh: {
    backgroundColor: Colors.error + '18',
    borderColor: Colors.error,
  },
  formPriorityBtnActiveMedium: {
    backgroundColor: Colors.warning + '18',
    borderColor: Colors.warning,
  },
  formPriorityBtnActiveLow: {
    backgroundColor: Colors.success + '18',
    borderColor: Colors.success,
  },
  formPriorityBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  formPriorityBtnTextActive: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  formSummaryDesc: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  formSectionHeaderUpcoming: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.veryLightGray + '80',
    borderRadius: 10,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
    paddingVertical: Spacing.sm,
    paddingRight: Spacing.md,
  },
  formSectionHeaderBar: {
    width: 4,
    alignSelf: 'stretch',
    backgroundColor: Colors.lightGray,
    marginRight: Spacing.md,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  formSectionHeaderTitle: {
    ...Typography.label,
    color: Colors.textSecondary,
    fontWeight: '700',
    fontSize: 13,
  },
  formSettingCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  formIntervalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.veryLightGray,
  },
  formIntervalLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  formIntervalControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  formIntervalBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formIntervalBtnText: {
    fontSize: 18,
    color: Colors.primary,
    fontWeight: '700',
    lineHeight: 22,
  },
  formIntervalValueBox: {
    alignItems: 'center',
    minWidth: 64,
  },
  formIntervalNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  formIntervalUnit: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 1,
  },
  formDayPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.veryLightGray,
  },
  formDayPicker: {
    flexDirection: 'row',
    gap: 4,
  },
  formDayBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.veryLightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formDayBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  formDayBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  formDayBtnTextActive: {
    color: Colors.white,
  },
  formStartDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  formDateBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formDateBtnText: {
    fontSize: 22,
    color: Colors.primary,
    fontWeight: '600',
    lineHeight: 26,
  },
  formDateDisplay: {
    flex: 1,
    alignItems: 'center',
  },
  formDateText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  formDateWeekday: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  formCalendarHint: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    marginTop: Spacing.sm,
    opacity: 0.7,
  },

  modernSection: {
    marginBottom: Spacing.md,
  },
  compactCard: {
    marginBottom: Spacing.sm,
  },
  compactLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
    fontSize: 12,
    marginBottom: Spacing.xs,
    fontWeight: '500',
  },
  
  // 인라인 스타일들
  inlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.veryLightGray + '40',
    marginBottom: Spacing.xs,
    minHeight: 44,
  },
  inlineLabel: {
    ...Typography.label,
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  
  // 시작일 인라인 스타일
  inlineDateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
    justifyContent: 'flex-end',
  },
  compactArrowButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: Spacing.xs,
  },
  compactArrow: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  inlineDateText: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    minWidth: 80,
    textAlign: 'center',
  },
  
  // 간격 설정 인라인 스타일
  inlineIntervalSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
    justifyContent: 'flex-end',
  },
  compactIntervalButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: Spacing.xs,
  },
  compactIntervalIcon: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  inlineIntervalText: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    minWidth: 70,
    textAlign: 'center',
  },
  
  // 요일 선택 인라인 스타일
  inlineDayPicker: {
    flexDirection: 'row',
    flex: 2,
    justifyContent: 'flex-end',
    gap: 3,
  },
  compactDayButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.veryLightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactDayButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  compactDayButtonText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  compactDayButtonTextActive: {
    color: Colors.white,
  },
  modernSectionTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    fontSize: 15,
  },
  // 날짜 선택 스타일
  dateCard: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.veryLightGray + '60',
  },
  modernDateButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateArrow: {
    fontSize: 24,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  dateDisplay: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  modernDateText: {
    ...Typography.h4,
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  dateWeekday: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 1,
  },
  // 반복 주기 스타일
  recurrenceGrid: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  modernRecurrenceCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.veryLightGray,
    minHeight: 52,
  },
  modernRecurrenceCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  modernRecurrenceText: {
    ...Typography.label,
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  modernRecurrenceTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  recurrenceIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  // 간격 설정 스타일
  intervalCard: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.veryLightGray,
    marginTop: Spacing.xs,
  },
  intervalLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
    fontSize: 13,
    marginBottom: Spacing.sm,
  },
  intervalControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modernIntervalButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  intervalButtonIcon: {
    fontSize: 20,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  intervalDisplay: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  intervalNumber: {
    ...Typography.h3,
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
  },
  intervalUnit: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  // 요일 선택 스타일
  modernDayPicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  modernDayButton: {
    flex: 1,
    height: 34,
    borderRadius: 8,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.veryLightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernDayButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '15',
  },
  modernDayButtonText: {
    ...Typography.label,
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  modernDayButtonTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  errorText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 8,
  },
  retryButtonText: {
    ...Typography.label,
    color: Colors.white,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.veryLightGray,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    ...Typography.label,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  warningBox: {
    backgroundColor: Colors.warning + '20',
    borderColor: Colors.warning,
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  warningText: {
    ...Typography.body,
    color: Colors.warning,
    textAlign: 'center',
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: 8,
    marginBottom: Spacing.sm,
  },
  itemEmoji: {
    fontSize: 20,
    marginRight: Spacing.md,
  },
  taskCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.veryLightGray,
    marginRight: Spacing.md,
  },
  taskText: {
    ...Typography.body,
    color: Colors.textPrimary,
    flex: 1,
  },
  overdueText: {
    color: Colors.error,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    ...Typography.h4,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  emptySubtext: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  templateTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  templateSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    fontSize: 14,
  },
  templateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  templateDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  templateItem: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.veryLightGray,
  },
  templateItemCompact: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    margin: 4,
    flex: 1,
    minWidth: '45%',
    maxWidth: '48%',
    borderWidth: 1,
    borderColor: Colors.veryLightGray,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  templateItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  templateItemTitleCompact: {
    ...Typography.label,
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
  templateEstimateCompact: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 12,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: Spacing.xs,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  templateItemTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    flex: 1,
  },
  templatePriority: {
    fontSize: 16,
  },
  templateEstimate: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  backButton: {
    padding: Spacing.sm,
    marginRight: Spacing.md,
  },
  backButtonText: {
    ...Typography.label,
    color: Colors.primary,
  },
  formTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  formSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontSize: 14,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.veryLightGray + '60',
    backgroundColor: Colors.white,
    gap: Spacing.sm,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: Colors.veryLightGray,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 36,
  },
  modalCancelButtonText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 36,
  },
  modalConfirmButtonText: {
    ...Typography.body,
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  modalConfirmButtonDisabled: {
    backgroundColor: Colors.gray,
    opacity: 0.6,
  },
  formSection: {
    marginBottom: Spacing.lg,
  },
  formLabel: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateButton: {
    padding: Spacing.md,
  },
  dateText: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginHorizontal: Spacing.lg,
  },
  recurrenceRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  recurrenceButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    marginHorizontal: Spacing.xs,
    backgroundColor: Colors.white,
    borderColor: Colors.veryLightGray,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  recurrenceButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  recurrenceButtonText: {
    ...Typography.label,
    color: Colors.textPrimary,
  },
  recurrenceButtonTextActive: {
    color: Colors.white,
  },
  intervalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  intervalButton: {
    width: 40,
    height: 40,
    backgroundColor: Colors.white,
    borderColor: Colors.veryLightGray,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  intervalInput: {
    width: 60,
    height: 40,
    backgroundColor: Colors.white,
    borderColor: Colors.veryLightGray,
    borderWidth: 1,
    borderRadius: 8,
    textAlign: 'center',
    marginHorizontal: Spacing.sm,
    ...Typography.body,
  },
  dayPickerRow: {
    marginBottom: Spacing.md,
  },
  dayPickerLabel: {
    ...Typography.body,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  dayPicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayButton: {
    width: 36,
    height: 36,
    backgroundColor: Colors.white,
    borderColor: Colors.veryLightGray,
    borderWidth: 1,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayButtonText: {
    ...Typography.caption,
    color: Colors.textPrimary,
  },
  dayButtonTextActive: {
    color: Colors.white,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  confirmButtonText: {
    ...Typography.label,
    color: Colors.white,
    fontSize: 16,
  },

  // 섹션 헤더
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  taskCount: {
    ...Typography.caption,
    color: Colors.textSecondary,
    backgroundColor: Colors.veryLightGray,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    textAlign: 'center',
  },

  // 효율적인 Task 아이템
  taskItemEfficient: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 10,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
    minHeight: 48,
    borderWidth: 1,
    borderColor: Colors.veryLightGray,
  },
  taskItemCompleted: {
    borderColor: Colors.success + '40',
    backgroundColor: Colors.success + '08',
    opacity: 0.7,
  },
  taskItemOverdue: {
    borderColor: Colors.error + '40',
    backgroundColor: Colors.error + '08',
  },
  taskItemToday: {
    borderColor: Colors.warning + '40',
    backgroundColor: Colors.warning + '08',
  },

  // 완료 체크박스 (네모 박스)
  completeButtonEfficient: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.lightGray,
  },
  completeButtonOverdue: {
    backgroundColor: Colors.white,
    borderColor: Colors.error,
  },
  completeButtonToday: {
    backgroundColor: Colors.white,
    borderColor: Colors.warning,
  },
  completeButtonCompleted: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  completeButtonLoading: {
    backgroundColor: Colors.gray,
    borderColor: Colors.gray,
  },
  completeButtonLoader: {
    width: 14,
    height: 14,
  },
  completeButtonIcon: {
    fontSize: 14,
    color: 'transparent', // 기본적으로 투명 (빈 박스)
    fontWeight: 'bold',
  },
  completeButtonIconCompleted: {
    color: Colors.white, // 완료 시 흰색 체크마크
  },
  completeButtonIconOverdue: {
    color: Colors.error, // 연체 시 빨간색
  },
  completeButtonIconToday: {
    color: Colors.warning, // 오늘 할 일 시 주황색
  },

  // 메인 콘텐츠 영역
  taskMainContent: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 2,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 1,
  },
  taskTitleEfficient: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    lineHeight: 18,
  },
  taskTitleCompleted: {
    color: Colors.success,
    textDecorationLine: 'line-through' as const,
    opacity: 0.8,
  },
  taskTitleOverdue: {
    color: Colors.error,
  },
  taskTitleToday: {
    color: Colors.warning + 'DD',
  },

  // 우선순위 표시
  priorityIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.lightGray,
    marginLeft: Spacing.xs,
  },
  priorityHigh: {
    backgroundColor: Colors.error,
  },
  priorityMedium: {
    backgroundColor: Colors.warning,
  },
  priorityLow: {
    backgroundColor: Colors.success,
  },

  // 메타 정보 (효율적)
  taskMetaEfficient: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 1,
  },
  taskDueDateEfficient: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textSecondary,
    marginRight: Spacing.xs,
  },
  taskDueDateOverdue: {
    color: Colors.error,
    fontWeight: '600',
  },
  taskDueDateToday: {
    color: Colors.warning,
    fontWeight: '600',
  },
  taskRecurrenceEfficient: {
    ...Typography.caption,
    fontSize: 10,
    color: Colors.textSecondary,
    backgroundColor: Colors.veryLightGray,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },

  // 상태 표시 (우측)
  taskStatus: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  overdueStatus: {
    backgroundColor: Colors.error,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
  },
  todayStatus: {
    backgroundColor: Colors.warning,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
  },
  todayText: {
    ...Typography.caption,
    fontSize: 9,
    color: Colors.white,
    fontWeight: '600',
  },

  // 컴팩트 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  detailModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskAddModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    flex: 1,
  },
  taskAddModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  taskActionModalCompact: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 34, // Safe area
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 0,
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: Colors.veryLightGray + '60',
  },
  modalTitleCompact: {
    ...Typography.h4,
    color: Colors.textPrimary,
    flex: 1,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: Colors.textSecondary,
    lineHeight: 18,
  },

  // 액션 버튼들 (메인 모드)
  modalActionsCompact: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  modalActionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginHorizontal: Spacing.xs,
    borderRadius: 12,
  },
  completeActionButton: {
    backgroundColor: Colors.success + '15',
  },
  postponeActionButton: {
    backgroundColor: Colors.warning + '15',
  },
  deleteActionButton: {
    backgroundColor: Colors.error + '15',
  },
  actionButtonEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  actionButtonLabel: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontWeight: '600',
  },

  // 미루기 섹션 (미루기 모드)
  postponeSectionCompact: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  postponeTitleCompact: {
    ...Typography.label,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  postponeOptionsCompact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  postponeOptionButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: Colors.background,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.veryLightGray,
  },
  postponeOptionButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  postponeOptionText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  postponeOptionTextActive: {
    color: Colors.white,
  },
  postponeActions: {
    flexDirection: 'row',
  },
  postponeCancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    marginRight: Spacing.sm,
    borderRadius: 8,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  postponeConfirmButton: {
    flex: 2,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  postponeCancelText: {
    ...Typography.label,
    color: Colors.textSecondary,
  },
  postponeConfirmText: {
    ...Typography.label,
    color: Colors.white,
  },

  // 컴팩트 빈 상태
  emptyStateCompact: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: Spacing.sm,
    opacity: 0.6,
  },
  emptyTextCompact: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  emptySubtextCompact: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },

  // Task 세부정보 모달 스타일
  taskDetailModal: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    width: '92%',
    maxHeight: '82%',
  },
  taskAddModal: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 34, // Safe area
  },
  taskAddModalCentered: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    width: '95%',
    height: '85%',
    alignSelf: 'center',
    overflow: 'hidden',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.veryLightGray,
  },
  detailTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    flex: 1,
    lineHeight: 24,
  },
  detailContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  detailSection: {
    marginBottom: Spacing.lg,
  },
  detailSectionTitle: {
    ...Typography.label,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    minHeight: 32,
  },
  detailLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
    flex: 1,
  },
  detailValue: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  detailText: {
    ...Typography.body,
    color: Colors.textPrimary,
    textAlign: 'right',
    marginLeft: Spacing.xs,
  },
  detailDescription: {
    ...Typography.body,
    color: Colors.textPrimary,
    lineHeight: 22,
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: 8,
  },
  detailActionsContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.veryLightGray,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  detailActions: {
    flexDirection: 'row',
  },
  detailActionButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  detailActionButtonCompact: {
    flex: 1,
    paddingVertical: Spacing.sm,
    marginHorizontal: 2,
    borderRadius: 6,
    alignItems: 'center',
  },
  detailCompleteButton: {
    backgroundColor: Colors.success,
  },
  detailUncompleteButton: {
    backgroundColor: Colors.warning,
  },
  detailRevertButton: {
    backgroundColor: '#6B46C1', // 보라색 (되돌리기 의미)
  },
  detailPostponeButton: {
    backgroundColor: Colors.warning,
  },
  detailDeleteButton: {
    backgroundColor: Colors.error,
  },
  detailActionText: {
    ...Typography.label,
    color: Colors.white,
    fontWeight: '600',
  },
  detailActionTextCompact: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },

  // 모달 관련 스타일
  modernModal: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: Spacing.lg,
    maxHeight: '80%',
    width: '90%',
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'left',
  },
  modalContent: {
    backgroundColor: Colors.white,
    flex: 1,
    paddingHorizontal: 0,
  },

  // 미래 일정 미리보기 스타일
  previewCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.veryLightGray + '40',
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.veryLightGray + '40',
  },
  previewNumber: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '700',
    width: 24,
    textAlign: 'center',
    marginRight: Spacing.md,
  },
  previewDateInfo: {
    flex: 1,
  },
  previewDate: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: 2,
  },
  previewWeekday: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  previewMoreIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.veryLightGray + '60',
    marginTop: Spacing.sm,
  },
  previewMoreText: {
    ...Typography.h3,
    color: Colors.textSecondary,
    width: 24,
    textAlign: 'center',
    marginRight: Spacing.md,
  },
  previewMoreSubtext: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  
  // 달력 관련 스타일
  calendarContainer: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.veryLightGray + '40',
    maxHeight: 280,
  },
  calendar: {
    borderRadius: 8,
  },
  calendarHint: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    fontSize: 10,
    lineHeight: 14,
  },
  calendarDay: {
    width: 28,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
  },
  calendarDayMarked: {
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  calendarDayText: {
    fontSize: 12,
    fontWeight: '400',
  },
  
  // 카테고리별 섹션 스타일
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  overdueTitle: {
    color: Colors.error,
  },
  todayTitle: {
    color: Colors.primary,
  },
  upcomingTitle: {
    color: Colors.textSecondary,
  },
  
  // 카테고리별 배지 스타일
  overdueBadge: {
    backgroundColor: Colors.error,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  overdueBadgeText: {
    ...Typography.caption,
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  todayBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  todayBadgeText: {
    ...Typography.caption,
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  upcomingBadge: {
    backgroundColor: Colors.lightGray,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  upcomingBadgeText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  
  upcomingDateText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },

  // ── 상단 요약 대시보드 ──
  dashboardCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  dashboardRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
  },
  dashboardItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  dashboardItemOverdue: {},
  dashboardItemToday: {},
  dashboardCount: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  dashboardCountOverdue: {
    color: Colors.error,
  },
  dashboardCountToday: {
    color: Colors.primary,
  },
  dashboardLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  dashboardDivider: {
    width: 1,
    backgroundColor: Colors.veryLightGray,
    marginVertical: 6,
  },

  // 더러움 게이지
  dirtyGaugeContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.veryLightGray,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  dirtyGaugeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  dirtyGaugeLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
    fontSize: 12,
  },
  dirtyGaugePercent: {
    ...Typography.caption,
    color: Colors.success,
    fontWeight: '600',
    fontSize: 12,
  },
  dirtyGaugePercentMid: {
    color: Colors.warning,
  },
  dirtyGaugePercentHigh: {
    color: Colors.error,
  },
  dirtyGaugeTrack: {
    height: 6,
    backgroundColor: Colors.veryLightGray,
    borderRadius: 3,
    overflow: 'hidden',
  },
  dirtyGaugeFill: {
    height: 6,
    backgroundColor: Colors.success,
    borderRadius: 3,
  },
  dirtyGaugeFillMid: {
    backgroundColor: Colors.warning,
  },
  dirtyGaugeFillHigh: {
    backgroundColor: Colors.error,
  },
  cleaningCta: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.warning + '18',
    borderRadius: 8,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    alignSelf: 'flex-start',
  },
  cleaningCtaText: {
    ...Typography.caption,
    color: Colors.warning,
    fontWeight: '600',
    fontSize: 12,
  },

  // ── 전체 빈 상태 ──
  fullEmptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
    paddingHorizontal: Spacing.xl,
  },
  fullEmptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  fullEmptyTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  fullEmptySubtext: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  fullEmptyButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 12,
  },
  fullEmptyButtonText: {
    ...Typography.label,
    color: Colors.white,
    fontWeight: '700',
    fontSize: 15,
  },

  // ── 전체 완료 상태 ──
  allDoneState: {
    alignItems: 'center',
    backgroundColor: Colors.success + '12',
    borderRadius: 16,
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  allDoneIcon: {
    fontSize: 36,
    marginBottom: Spacing.sm,
  },
  allDoneTitle: {
    ...Typography.h4,
    color: Colors.success,
    fontWeight: '700',
    textAlign: 'center',
  },
  allDoneSubtext: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },

  // ── 섹션 헤더 V2 ──
  sectionHeaderV2Overdue: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error + '10',
    borderRadius: 10,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  sectionHeaderV2Bar: {
    width: 4,
    alignSelf: 'stretch',
    backgroundColor: Colors.error,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  sectionHeaderV2Content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  sectionHeaderV2Title: {
    ...Typography.label,
    color: Colors.error,
    fontWeight: '700',
    fontSize: 14,
  },
  sectionHeaderV2Today: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    borderRadius: 10,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  sectionHeaderV2BarToday: {
    width: 4,
    alignSelf: 'stretch',
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  sectionHeaderV2TitleToday: {
    ...Typography.label,
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  sectionHeaderV2Upcoming: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.veryLightGray + '60',
    borderRadius: 10,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  sectionHeaderV2BarUpcoming: {
    width: 4,
    alignSelf: 'stretch',
    backgroundColor: Colors.lightGray,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  sectionHeaderV2TitleUpcoming: {
    ...Typography.label,
    color: Colors.textSecondary,
    fontWeight: '700',
    fontSize: 14,
  },
  sectionCollapseIcon: {
    fontSize: 10,
    color: Colors.textSecondary,
    paddingRight: Spacing.md,
  },

  // ── 새 태스크 카드 ──
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  taskCardOverdue: {
    backgroundColor: Colors.error + '06',
  },
  taskCardToday: {
    backgroundColor: Colors.primary + '06',
  },
  taskCardCompleted: {
    opacity: 0.6,
    backgroundColor: Colors.success + '08',
  },
  taskCardAccentOverdue: {
    width: 4,
    alignSelf: 'stretch',
    backgroundColor: Colors.error,
  },
  taskCardAccentToday: {
    width: 4,
    alignSelf: 'stretch',
    backgroundColor: Colors.primary,
  },
  taskCardAccentUpcoming: {
    width: 4,
    alignSelf: 'stretch',
    backgroundColor: Colors.lightGray,
  },

  // 새 체크박스
  taskCheckboxNew: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: Colors.lightGray,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: Spacing.md,
    flexShrink: 0,
  },
  taskCheckboxNewToday: {
    borderColor: Colors.primary,
  },
  taskCheckboxNewCompleted: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  taskCheckboxNewLoading: {
    backgroundColor: Colors.gray,
    borderColor: Colors.gray,
  },
  taskCheckboxCheck: {
    fontSize: 13,
    color: Colors.white,
    fontWeight: '700',
    lineHeight: 16,
  },

  // 카드 본문
  taskCardBody: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingRight: Spacing.md,
  },
  taskCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  taskCardTitle: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: 14,
    flex: 1,
    lineHeight: 18,
    marginRight: Spacing.xs,
  },
  taskCardTitleCompleted: {
    textDecorationLine: 'line-through' as const,
    color: Colors.textSecondary,
  },
  taskCardTitleUpcoming: {
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  taskCardChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },

  // 우선순위 pill
  priorityPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: Colors.veryLightGray,
    flexShrink: 0,
  },
  priorityPillHigh: {
    backgroundColor: Colors.error + '20',
  },
  priorityPillMedium: {
    backgroundColor: Colors.warning + '20',
  },
  priorityPillLow: {
    backgroundColor: Colors.success + '20',
  },
  priorityPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  priorityPillTextHigh: {
    color: Colors.error,
  },
  priorityPillTextMedium: {
    color: Colors.warning,
  },
  priorityPillTextLow: {
    color: Colors.success,
  },

  // 칩 스타일
  taskChipOverdue: {
    backgroundColor: Colors.error + '18',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  taskChipTextOverdue: {
    fontSize: 11,
    color: Colors.error,
    fontWeight: '600',
  },
  taskChipToday: {
    backgroundColor: Colors.primary + '18',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  taskChipTextToday: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
  taskChipCompleted: {
    backgroundColor: Colors.success + '18',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  taskChipTextCompleted: {
    fontSize: 11,
    color: Colors.success,
    fontWeight: '600',
  },
  taskChipUpcoming: {
    backgroundColor: Colors.veryLightGray,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  taskChipTextUpcoming: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  taskChipRecurrence: {
    backgroundColor: Colors.primary + '12',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  taskChipTextRecurrence: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '500',
  },
  taskChipTime: {
    backgroundColor: Colors.veryLightGray,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  taskChipTextTime: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },

  // ── Detail Modal V2 ──
  // ── Task 세부 모달 v2 스타일 ──
  detailHeaderFixed: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.veryLightGray,
    overflow: 'hidden',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  detailStatusBanner: {
    paddingVertical: 7,
    alignItems: 'center',
  },
  detailStatusBannerText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  detailHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  detailScrollContent: {
    flexGrow: 0,
  },
  detailSummaryCardV2: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: 12,
    overflow: 'hidden',
  },
  detailSummaryRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 11,
    gap: Spacing.sm,
  },
  detailSummaryRowItemBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.veryLightGray,
  },
  detailDdayBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  detailDdayText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  detailSummaryIcon: {
    fontSize: 18,
    lineHeight: 24,
  },
  detailSummaryLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 14,
  },
  detailSummaryValue: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 18,
  },
  detailDescBox: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: 10,
    padding: Spacing.md,
  },
  // ── 편집 패널 (카드 바깥 분리형) ──
  detailSummaryRowItemActive: {
    backgroundColor: Colors.primary + '08',
  },
  detailSummaryRowItemActiveOrange: {
    backgroundColor: Colors.warning + '08',
  },
  detailEditPanel: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.veryLightGray,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  detailEditPanelHeaderRecurrence: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    paddingVertical: Spacing.sm,
    paddingRight: Spacing.md,
    overflow: 'hidden',
  },
  detailEditPanelHeaderMinutes: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning + '10',
    paddingVertical: Spacing.sm,
    paddingRight: Spacing.md,
    overflow: 'hidden',
  },
  detailEditPanelBar: {
    width: 4,
    alignSelf: 'stretch',
    backgroundColor: Colors.primary,
    marginRight: Spacing.md,
  },
  detailEditPanelTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  detailEditPanelBody: {
    padding: Spacing.md,
    gap: Spacing.md,
  },

  // ── 인라인 편집 스타일 ──
  detailEditIcon: {
    fontSize: 14,
    color: Colors.textSecondary,
    opacity: 0.6,
  },
  detailInlineEditor: {
    backgroundColor: Colors.primary + '08',
    borderTopWidth: 1,
    borderTopColor: Colors.primary + '20',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  detailInlineUnitRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  detailInlineUnitBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.veryLightGray,
    backgroundColor: Colors.white,
    alignItems: 'center',
  },
  detailInlineUnitBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  detailInlineUnitText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  detailInlineUnitTextActive: {
    color: Colors.white,
  },
  detailInlineIntervalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  detailInlineStepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailInlineStepText: {
    fontSize: 20,
    color: Colors.primary,
    fontWeight: '700',
    lineHeight: 24,
  },
  detailInlineValueBox: {
    alignItems: 'center',
    minWidth: 70,
  },
  detailInlineNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    lineHeight: 26,
  },
  detailInlineUnit: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  detailInlineSaveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    flex: 1,
  },
  detailInlineSaveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  detailInlineCancelBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.lightGray,
  },
  detailInlineCancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  detailRecurrenceEditorWrap: {
    borderTopWidth: 1,
    borderTopColor: Colors.primary + '20',
    backgroundColor: Colors.background,
  },
  detailRecurrenceEditorActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },

  detailPrioritySection: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  detailPrioritySectionLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailPriorityRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  detailCompletedBadge: {
    backgroundColor: Colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  detailCompletedBadgeText: {
    fontSize: 11,
    color: Colors.success,
    fontWeight: '600',
  },
  // ── 고정 액션 버튼 영역 ──
  detailActionsFixed: {
    borderTopWidth: 1,
    borderTopColor: Colors.veryLightGray,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  detailActionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  detailActionCompactBtn: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 12,
    gap: 3,
  },
  detailActionCompactIcon: {
    fontSize: 18,
    lineHeight: 22,
  },
  detailActionCompactText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
  detailCompleteBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailCompleteBtnDone: {
    backgroundColor: Colors.success,
  },
  detailCompleteBtnUndo: {
    backgroundColor: Colors.warning,
  },
  detailCompleteBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.3,
  },
  detailSecondRowBtns: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  detailSubBtn: {
    backgroundColor: Colors.primary + '10',
  },
  detailSubBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  detailDeleteBtn: {
    borderWidth: 1.5,
    borderColor: Colors.error + '50',
    backgroundColor: Colors.error + '08',
  },
  detailDeleteBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.error,
  },
  detailRevertBtn: {
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
    backgroundColor: Colors.veryLightGray + '80',
  },
  detailRevertBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  // (하위호환 유지용 — 이전 스타일명 참조가 남아 있을 경우 대비)
  detailSummaryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    minWidth: '30%',
  },
  detailPrimaryActions: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.veryLightGray,
  },
  detailPrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: 12,
    gap: 6,
  },
  detailPrimaryBtnComplete: { backgroundColor: Colors.success },
  detailPrimaryBtnUndo: { backgroundColor: Colors.warning },
  detailPrimaryBtnPostpone: { backgroundColor: Colors.primary + '18' },
  detailPrimaryBtnIcon: { fontSize: 16, color: Colors.white },
  detailPrimaryBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },
  detailSecondaryActions: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingBottom: 20,
    gap: Spacing.sm,
  },
  detailSecondaryBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: 10,
    backgroundColor: Colors.veryLightGray + '60',
    alignItems: 'center',
  },
  detailSecondaryBtnDelete: { backgroundColor: Colors.error + '12' },
  detailSecondaryBtnText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  detailSecondaryBtnTextDelete: { color: Colors.error },

  // 간단한 Task 아이템 스타일
  taskItemSimple: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    marginBottom: Spacing.xs,
  },
  
  taskCheckboxText: {
    fontSize: 16,
  },

  // ── 시간 설정 스타일 ──
  formTimeDivider: {
    height: 1,
    backgroundColor: Colors.veryLightGray,
    marginVertical: Spacing.sm,
  },
  formTimeToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  formTimePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.sm,
    gap: Spacing.xs,
  },
  formTimeValueBox: {
    alignItems: 'center',
    minWidth: 48,
  },
  formTimeValueText: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  formTimeUnitLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  formTimeColon: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginHorizontal: Spacing.xs,
    lineHeight: 36,
  },
});