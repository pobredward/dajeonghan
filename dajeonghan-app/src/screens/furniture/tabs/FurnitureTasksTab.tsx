import React, { useState, useEffect } from 'react';
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
import { Task } from '@/types/task.types';
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

  // Task 추가 관련 state
  const [customization, setCustomization] = useState<TaskCustomization>({
    recurrenceType: 'daily',
    interval: 1,
    notificationEnabled: false,
  });
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);
  const [startDate, setStartDate] = useState<Date>(new Date());

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
        !task.isCompleted && 
        task.status !== 'completed'
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

      // dirtyScore 계산
      const now = new Date();
      const overdueTasks = linkedTasks.filter(
        (task) => task.recurrence.nextDue && new Date(task.recurrence.nextDue) < now
      );

      let calculatedDirtyScore = 0;
      overdueTasks.forEach((task) => {
        if (task.recurrence.nextDue) {
          const daysOverdue = Math.floor(
            (now.getTime() - new Date(task.recurrence.nextDue).getTime()) /
              (1000 * 60 * 60 * 24)
          );
          calculatedDirtyScore += Math.min(daysOverdue * 10, 50);
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
      estimatedMinutes: template.estimatedMinutes,
      priority: template.priority,
      notificationEnabled: true,
      notificationMinutesBefore: 30,
    });
    
    // 기본 시작일은 내일
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    setStartDate(tomorrow);
    
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
    if (!taskAddState.selectedTemplate || !userId) return;

    try {
      setLoading(true);
      
      await FurnitureTaskService.addTaskFromTemplate(
        userId,
        room.id,
        furniture.id,
        room.name,
        furniture.name,
        taskAddState.selectedTemplate,
        customization
      );

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

  const handleCompleteTask = async (task: Task) => {
    console.log('handleCompleteTask 호출됨:', {
      task: task,
      taskId: task?.id,
      taskIdType: typeof task?.id,
      taskTitle: task?.title
    });

    if (!task) {
      console.error('Task가 null/undefined입니다.');
      Alert.alert('오류', 'Task가 존재하지 않습니다.');
      return;
    }

    // Task ID를 문자열로 강제 변환
    const taskId = String(task.id);
    if (!taskId || taskId === 'undefined' || taskId === 'null' || taskId === '[object Object]') {
      console.error('Task ID가 유효하지 않습니다:', task.id, typeof task.id);
      Alert.alert('오류', `유효하지 않은 할 일 ID입니다. (${taskId})`);
      return;
    }

    // 현재 완료 상태 확인
    const today = new Date().toDateString();
    let currentlyCompleted = false;
    
    if (task.recurrence && task.recurrence.type === 'fixed') {
      // 반복 Task: 오늘 완료했는지 확인
      if (task.lastCompletedAt) {
        const lastCompletedDate = new Date(task.lastCompletedAt).toDateString();
        currentlyCompleted = lastCompletedDate === today;
      }
    } else {
      // 일회성 Task: isCompleted 또는 status 확인
      currentlyCompleted = task.isCompleted || task.status === 'completed';
    }

    try {
      // 개별 Task 로딩 상태 설정
      setTaskLoadingStates(prev => ({ ...prev, [taskId]: true }));
      
      if (currentlyCompleted) {
        console.log('완료 취소 처리 시작:', taskId, task.title);
        await handleUncompleteTask(task, taskId);
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
        
        updatedTask = {
          recurrence: {
            ...task.recurrence,
            nextDue,
          },
          lastCompletedAt: new Date(), // 마지막 완료 시간 기록
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
              ...updatedTask,
              lastCompletedAt: new Date() // UI에서 즉시 완료 상태 반영
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
      
      // Alert 없이 조용히 완료 (즉시 UI 피드백이 충분함)
      // 전체 데이터 새로고침은 제거 - 즉시 UI 업데이트로 충분함
  };

  const handleUncompleteTask = async (task: Task, taskId: string) => {
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
      
      updatedTask = {
        recurrence: {
          ...task.recurrence,
          nextDue: previousDue,
        },
        lastCompletedAt: updatedCompletionHistory.length > 0 
          ? updatedCompletionHistory[updatedCompletionHistory.length - 1].date 
          : undefined, // 이전 완료 시간으로 되돌리기 (없으면 undefined)
        completionHistory: updatedCompletionHistory,
        status: 'pending',
        updatedAt: new Date(),
      };
      
      console.log('반복 태스크 이전 일정으로 되돌림:', previousDue);
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
        <ScrollView style={styles.content}>
          {calculatedDirtyScore > 30 && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                🧹 청소가 필요해요 (더러움 {Math.round(calculatedDirtyScore)}%)
              </Text>
            </View>
          )}

          {linkedTasks.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>할 일</Text>
                <Text style={styles.taskCount}>{linkedTasks.length}</Text>
              </View>
              
              {linkedTasks.map((task, index) => {
                console.log(`렌더링 태스크 ${index}:`, {
                  id: task.id,
                  idType: typeof task.id,
                  title: task.title
                });

                if (!task || typeof task.id !== 'string') {
                  console.error('렌더링 중 잘못된 task:', task);
                  return null;
                }

                const isOverdue = task.recurrence && task.recurrence.nextDue && new Date(task.recurrence.nextDue) < new Date();
                const dueDate = task.recurrence && task.recurrence.nextDue ? new Date(task.recurrence.nextDue) : null;
                const isToday = dueDate && dueDate.toDateString() === new Date().toDateString();
                
                // 완료 상태 판단
                const today = new Date().toDateString();
                let isCompleted = false;
                
                if (task.recurrence && task.recurrence.type === 'fixed') {
                  // 반복 Task: 오늘 완료했는지 확인
                  if (task.lastCompletedAt) {
                    const lastCompletedDate = new Date(task.lastCompletedAt).toDateString();
                    isCompleted = lastCompletedDate === today;
                  }
                } else {
                  // 일회성 Task: isCompleted 또는 status 확인
                  isCompleted = task.isCompleted || task.status === 'completed';
                }
                
                console.log(`Task ${task.title} 완료 상태:`, {
                  isRecurring: task.recurrence && task.recurrence.type === 'fixed',
                  lastCompletedAt: task.lastCompletedAt,
                  lastCompletedAtString: task.lastCompletedAt ? new Date(task.lastCompletedAt).toDateString() : null,
                  todayString: today,
                  isCompletedResult: isCompleted,
                  taskIsCompleted: task.isCompleted,
                  taskStatus: task.status
                });

                const isTaskLoading = taskLoadingStates[task.id] || false;
                
                return (
                  <TouchableOpacity 
                    key={task.id} 
                    style={[
                      styles.taskItemEfficient,
                      isCompleted && styles.taskItemCompleted,
                      isOverdue && !isCompleted && styles.taskItemOverdue,
                      isToday && !isCompleted && styles.taskItemToday
                    ]}
                    onPress={() => setTaskDetailModal({ visible: true, task })}
                    activeOpacity={0.8}
                  >
                    {/* 좌측: 완료/완료취소 버튼 */}
                    <TouchableOpacity 
                      style={[
                        styles.completeButtonEfficient,
                        isCompleted && styles.completeButtonCompleted,
                        isOverdue && !isCompleted && styles.completeButtonOverdue,
                        isToday && !isCompleted && styles.completeButtonToday,
                        isTaskLoading && styles.completeButtonLoading
                      ]}
                      onPress={(e) => {
                        e.stopPropagation();
                        if (!isTaskLoading) {
                          handleCompleteTask(task);
                        }
                      }}
                      activeOpacity={isTaskLoading ? 1 : 0.4}
                      disabled={isTaskLoading}
                    >
                      {isTaskLoading ? (
                        <ActivityIndicator 
                          size="small" 
                          color={Colors.white} 
                          style={styles.completeButtonLoader}
                        />
                      ) : (
                        <Text style={[
                          styles.completeButtonIcon,
                          isCompleted && styles.completeButtonIconCompleted
                        ]}>✓</Text>
                      )}
                    </TouchableOpacity>

                    {/* 메인 콘텐츠 영역 */}
                    <View style={styles.taskMainContent}>
                      <View style={styles.taskHeader}>
                        <Text 
                          style={[
                            styles.taskTitleEfficient, 
                            isCompleted && styles.taskTitleCompleted,
                            isOverdue && !isCompleted && styles.taskTitleOverdue,
                            isToday && !isCompleted && styles.taskTitleToday
                          ]} 
                          numberOfLines={1}
                        >
                          {task.title}
                        </Text>
                        
                        {/* 우선순위 표시 */}
                        <View style={[
                          styles.priorityIndicator,
                          task.priority === 'high' && styles.priorityHigh,
                          task.priority === 'medium' && styles.priorityMedium,
                          task.priority === 'low' && styles.priorityLow,
                        ]} />
                      </View>
                      
                      {dueDate && (
                        <View style={styles.taskMetaEfficient}>
                          <Text style={[
                            styles.taskDueDateEfficient,
                            isOverdue && styles.taskDueDateOverdue,
                            isToday && styles.taskDueDateToday
                          ]}>
                            {isToday ? '오늘 마감' : 
                             isOverdue ? `${Math.ceil((new Date().getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))}일 연체` :
                             dueDate.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' })}
                          </Text>
                          
                          {task.recurrence.type === 'fixed' && (
                            <Text style={styles.taskRecurrenceEfficient}>
                              {task.recurrence.unit === 'day' ? '매일' :
                               task.recurrence.unit === 'week' ? '매주' : '매월'} 반복
                            </Text>
                          )}
                        </View>
                      )}
                    </View>

                    {/* 우측: 상태 표시 */}
                    <View style={styles.taskStatus}>
                      {isOverdue && (
                        <View style={styles.overdueStatus}>
                          <Text style={styles.overdueText}>연체</Text>
                        </View>
                      )}
                      {isToday && !isOverdue && (
                        <View style={styles.todayStatus}>
                          <Text style={styles.todayText}>오늘</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {linkedTasks.length === 0 && (
            <View style={styles.emptyStateCompact}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTextCompact}>할 일이 없습니다</Text>
              <Text style={styles.emptySubtextCompact}>Task 추가에서 새로운 할 일을 만들어보세요</Text>
            </View>
          )}
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
        animationType="slide"
        onRequestClose={() => setTaskDetailModal({ visible: false, task: null })}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setTaskDetailModal({ visible: false, task: null })}
          />
          
          <View style={styles.taskDetailModal}>
            {taskDetailModal.task && (
              <>
                <View style={styles.detailHeader}>
                  <Text style={styles.detailTitle} numberOfLines={2}>
                    {taskDetailModal.task.title}
                  </Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setTaskDetailModal({ visible: false, task: null })}
                  >
                    <Text style={styles.closeButtonText}>×</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.detailContent}>
                  {/* 기본 정보 */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>기본 정보</Text>
                    
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>우선순위</Text>
                      <View style={styles.detailValue}>
                        <View style={[
                          styles.priorityDot,
                          taskDetailModal.task.priority === 'high' && styles.priorityHigh,
                          taskDetailModal.task.priority === 'medium' && styles.priorityMedium,
                          taskDetailModal.task.priority === 'low' && styles.priorityLow,
                        ]} />
                        <Text style={styles.detailText}>
                          {taskDetailModal.task.priority === 'high' ? '높음' :
                           taskDetailModal.task.priority === 'medium' ? '보통' : '낮음'}
                        </Text>
                      </View>
                    </View>

                    {taskDetailModal.task.recurrence.nextDue && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>예정일</Text>
                        <Text style={styles.detailText}>
                          {new Date(taskDetailModal.task.recurrence.nextDue).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            weekday: 'short'
                          })}
                        </Text>
                      </View>
                    )}

                    {taskDetailModal.task.recurrence.type === 'fixed' && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>반복</Text>
                        <Text style={styles.detailText}>
                          {taskDetailModal.task.recurrence.interval === 1 ? '' : `${taskDetailModal.task.recurrence.interval}`}
                          {taskDetailModal.task.recurrence.unit === 'day' ? '매일' :
                           taskDetailModal.task.recurrence.unit === 'week' ? '매주' : '매월'}
                        </Text>
                      </View>
                    )}

                    {taskDetailModal.task.estimatedMinutes && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>예상 소요시간</Text>
                        <Text style={styles.detailText}>
                          {taskDetailModal.task.estimatedMinutes}분
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* 설명 */}
                  {taskDetailModal.task.description && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>설명</Text>
                      <Text style={styles.detailDescription}>
                        {taskDetailModal.task.description}
                      </Text>
                    </View>
                  )}

                  {/* 생성/수정 정보 */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>기타 정보</Text>
                    
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>생성일</Text>
                      <Text style={styles.detailText}>
                        {taskDetailModal.task.createdAt.toLocaleDateString('ko-KR')}
                      </Text>
                    </View>

                    {taskDetailModal.task.updatedAt && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>최근 수정</Text>
                        <Text style={styles.detailText}>
                          {taskDetailModal.task.updatedAt.toLocaleDateString('ko-KR')}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* 액션 버튼들 */}
                <View style={styles.detailActions}>
                  <TouchableOpacity
                    style={[styles.detailActionButton, styles.detailCompleteButton]}
                    onPress={() => {
                      handleCompleteTask(taskDetailModal.task!);
                      setTaskDetailModal({ visible: false, task: null });
                    }}
                  >
                    <Text style={styles.detailActionText}>완료</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.detailActionButton, styles.detailPostponeButton]}
                    onPress={() => {
                      setTaskDetailModal({ visible: false, task: null });
                      setTaskActionModal({ 
                        visible: true, 
                        task: taskDetailModal.task, 
                        action: 'postpone' 
                      });
                    }}
                  >
                    <Text style={styles.detailActionText}>미루기</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.detailActionButton, styles.detailDeleteButton]}
                    onPress={() => {
                      setTaskDetailModal({ visible: false, task: null });
                      handleDeleteTask(taskDetailModal.task!);
                    }}
                  >
                    <Text style={styles.detailActionText}>삭제</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
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
                    style={styles.modalConfirmButton} 
                    onPress={() => {
                      handleConfirmTask();
                      setTaskAddModal({ visible: false, template: null });
                    }}
                  >
                    <Text style={styles.modalConfirmButtonText}>추가</Text>
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
    <View>
      <Text style={styles.templateTitle}>{template.furnitureName} 관리</Text>
      <Text style={styles.templateSubtitle}>추가할 Task를 선택하세요</Text>

      <View style={styles.templateGrid}>
        {template.tasks.map((task) => (
          <TouchableOpacity
            key={task.id}
            style={styles.templateItemCompact}
            onPress={() => onSelectTemplate(task)}
            activeOpacity={0.7}
          >
            <View style={styles.templateItemHeader}>
              <Text style={styles.templateItemTitleCompact} numberOfLines={1}>
                {task.title}
              </Text>
              <View style={[
                styles.priorityDot,
                task.priority === 'high' && styles.priorityHigh,
                task.priority === 'medium' && styles.priorityMedium,
                task.priority === 'low' && styles.priorityLow,
              ]} />
            </View>
            <Text style={styles.templateEstimateCompact}>{task.estimatedMinutes}분</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// Task 커스터마이징 폼 컴포넌트 (전면 개편)
const TaskCustomizationForm: React.FC<{
  template: TaskTemplateItem;
  customization: TaskCustomization;
  onCustomizationChange: (customization: TaskCustomization) => void;
  startDate: Date;
  onStartDateChange: (date: Date) => void;
  selectedDays: DayOfWeek[];
  onToggleDayOfWeek: (day: DayOfWeek) => void;
  getNextOccurrences: (startDate: Date, customization: TaskCustomization, selectedDays: DayOfWeek[], count: number) => Date[];
}> = ({
  template,
  customization,
  onCustomizationChange,
  startDate,
  onStartDateChange,
  selectedDays,
  onToggleDayOfWeek,
  getNextOccurrences,
}) => {
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const [currentCalendarMonth, setCurrentCalendarMonth] = React.useState(startDate);

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
      {/* 헤더 */}
      <View style={styles.modernHeader}>
        <View style={styles.taskInfoCard}>
          <Text style={styles.modernSubtitle}>{template.description}</Text>
          <Text style={styles.estimateText}>⏱️ 예상 시간: {template.estimatedMinutes}분</Text>
        </View>
      </View>

      {/* 달력 */}
      <View style={styles.modernSection}>
        <View style={styles.calendarContainer}>
          <Calendar
            style={styles.calendar}
            current={startDate.toISOString().split('T')[0]}
            markedDates={(() => {
              const marked: { [key: string]: any } = {};
              const nextDates = getNextOccurrences(startDate, customization, selectedDays, 10);
              
              // 일정이 있는 날짜에 표시
              nextDates.forEach((date, index) => {
                const dateString = date.toISOString().split('T')[0];
                
                // 앞의 3개 일정은 파란 배경, 나머지는 점 표시
                if (index < 3) {
                  marked[dateString] = {
                    selected: true,
                    selectedColor: Colors.primary,
                    selectedTextColor: Colors.white,
                  };
                } else {
                  marked[dateString] = {
                    marked: true,
                    dotColor: Colors.textSecondary,
                  };
                }
              });
              
              return marked;
            })()}
            dayComponent={({date, state}) => {
              if (!date) return null;
              
              const dateObj = new Date(date.year, date.month - 1, date.day);
              const dayOfWeek = dateObj.getDay();
              const isHoliday = KoreanHolidays.isHoliday(dateObj);
              const dateString = date.dateString;
              const nextDates = getNextOccurrences(startDate, customization, selectedDays, 50);
              const hasSchedule = nextDates.some(d => d.toISOString().split('T')[0] === dateString);
              const scheduleIndex = nextDates.findIndex(d => d.toISOString().split('T')[0] === dateString);
              
              // 색상 결정
              let textColor: any = Colors.textPrimary;
              if (isHoliday || dayOfWeek === 0) {
                textColor = '#FF3B30'; // 공휴일/일요일 - 빨간색
              } else if (dayOfWeek === 6) {
                textColor = '#007AFF'; // 토요일 - 파란색
              }
              
              // 일정이 있는 경우 스타일링
              let containerStyle: any = styles.calendarDay;
              let textStyle: any = [styles.calendarDayText, { color: textColor }];
              
              if (hasSchedule) {
                // 모든 일정은 파란 테두리로만 표시
                containerStyle = [styles.calendarDay, styles.calendarDayMarked];
              }
              
              return (
                <View style={containerStyle}>
                  <Text style={textStyle}>{date.day}</Text>
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
              // 월이 변경될 때마다 재렌더링하여 공휴일 색상 업데이트
              setCurrentCalendarMonth(new Date(month.year, month.month - 1, 1));
            }}
            />
          </View>
      </View>

      {/* 일정 설정 */}
      <View style={styles.modernSection}>
        <Text style={styles.modernSectionTitle}>📅 일정 설정</Text>
        
        {/* 시작일 선택 - 인라인 스타일 */}
        <View style={styles.inlineCard}>
          <Text style={styles.inlineLabel}>시작일</Text>
          <View style={styles.inlineDateSelector}>
            <TouchableOpacity 
              style={styles.compactArrowButton}
              onPress={() => {
                const newDate = new Date(startDate);
                newDate.setDate(newDate.getDate() - 1);
                onStartDateChange(newDate);
              }}
            >
              <Text style={styles.compactArrow}>‹</Text>
            </TouchableOpacity>
            
            <Text style={styles.inlineDateText}>
              {startDate.toLocaleDateString('ko-KR', { 
                month: 'short', 
                day: 'numeric',
              })} {(() => {
                const today = new Date();
                const diffTime = startDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const weekday = startDate.toLocaleDateString('ko-KR', { weekday: 'short' });
                
                if (diffDays === 0) {
                  return `${weekday}`;
                } else if (diffDays === 1) {
                  return `${weekday}`;
                } else if (diffDays === -1) {
                  return `${weekday}`;
                } else {
                  return `${weekday}`;
                }
              })()}
            </Text>
            
            <TouchableOpacity 
              style={styles.compactArrowButton}
              onPress={() => {
                const newDate = new Date(startDate);
                newDate.setDate(newDate.getDate() + 1);
                onStartDateChange(newDate);
              }}
            >
              <Text style={styles.compactArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 반복 주기 선택 */}
        <View style={styles.compactCard}>
          <Text style={styles.compactLabel}>반복 주기</Text>
          <View style={styles.recurrenceGrid}>
            {(['daily', 'weekly', 'monthly'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.modernRecurrenceCard,
                  customization.recurrenceType === type && styles.modernRecurrenceCardActive
                ]}
                onPress={() => onCustomizationChange({ ...customization, recurrenceType: type })}
              >
                <Text style={styles.recurrenceIcon}>
                  {type === 'daily' ? '📅' : type === 'weekly' ? '📆' : '🗓️'}
                </Text>
                <Text style={[
                  styles.modernRecurrenceText,
                  customization.recurrenceType === type && styles.modernRecurrenceTextActive
                ]}>
                  {type === 'daily' ? '매일' : type === 'weekly' ? '매주' : '매월'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* 간격 설정 - 인라인 스타일 */}
          <View style={styles.inlineCard}>
            <Text style={styles.inlineLabel}>간격</Text>
            <View style={styles.inlineIntervalSelector}>
              <TouchableOpacity 
                style={styles.compactIntervalButton}
                onPress={() => onCustomizationChange({ 
                  ...customization, 
                  interval: Math.max(1, (customization.interval || 1) - 1)
                })}
              >
                <Text style={styles.compactIntervalIcon}>−</Text>
              </TouchableOpacity>
              
              <Text style={styles.inlineIntervalText}>
                {customization.interval || 1}
                {customization.recurrenceType === 'daily' ? '일마다' : 
                 customization.recurrenceType === 'weekly' ? '주마다' : '개월마다'}
              </Text>
              
              <TouchableOpacity 
                style={styles.compactIntervalButton}
                onPress={() => onCustomizationChange({ 
                  ...customization, 
                  interval: Math.min(30, (customization.interval || 1) + 1)
                })}
              >
                <Text style={styles.compactIntervalIcon}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 요일 선택 (주간 반복시) - 인라인 스타일 */}
        {customization.recurrenceType === 'weekly' && (
          <View style={styles.inlineCard}>
            <Text style={styles.inlineLabel}>요일</Text>
            <View style={styles.inlineDayPicker}>
              {dayNames.map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.compactDayButton,
                    selectedDays.includes(index as DayOfWeek) && styles.compactDayButtonActive
                  ]}
                  onPress={() => onToggleDayOfWeek(index as DayOfWeek)}
                >
                  <Text style={[
                    styles.compactDayButtonText,
                    selectedDays.includes(index as DayOfWeek) && styles.compactDayButtonTextActive
                  ]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>



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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: 34, // Safe area
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
  detailActions: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.veryLightGray,
  },
  detailActionButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  detailCompleteButton: {
    backgroundColor: Colors.success,
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
});