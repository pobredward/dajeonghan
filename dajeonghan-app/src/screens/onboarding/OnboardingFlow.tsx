import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { TermsAgreementScreen } from './TermsAgreementScreen';
import { PersonaSelectionScreen } from './PersonaSelectionScreen';
import { QuestionScreen } from './QuestionScreen';
import { FirstTasksScreen } from './FirstTasksScreen';
import { HouseLayoutSelectionScreen } from '@/screens/house/HouseLayoutSelectionScreen';
import { OnboardingService, OnboardingAnswers } from '@/services/OnboardingService';
import { PersonaType } from '@/types/user.types';
import { HouseLayout } from '@/types/house.types';
import { Task } from '@/types/task.types';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { saveUserProfile, saveTasks } from '@/services/firestoreService';
import { signOut, signInAnonymouslyAsync } from '@/services/authService';

type OnboardingNavigationProp = StackNavigationProp<RootStackParamList, 'Onboarding'>;

interface Props {
  userId: string;
  isGuestOnboarding: boolean;
  onBack?: () => void;
  onComplete: () => void;
  navigation: OnboardingNavigationProp;
}

export const OnboardingFlow: React.FC<Props> = ({
  userId,
  isGuestOnboarding,
  onBack,
  onComplete,
  navigation,
}) => {
  const [step, setStep] = useState<'terms' | 'layout' | 'persona' | 'questions' | 'tasks'>('terms');
  const [selectedLayoutType, setSelectedLayoutType] = useState<HouseLayout['layoutType']>('studio');
  const [selectedPersona, setSelectedPersona] = useState<PersonaType | null>(null);
  const [answers, setAnswers] = useState<OnboardingAnswers>({});
  const [firstTasks, setFirstTasks] = useState<Task[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [allTasks, setAllTasks] = useState<Task[]>([]);

  const handleTermsBack = async () => {
    if (isGuestOnboarding) {
      // 게스트 모드: Firebase 계정이 없으므로 단순히 플래그 해제 (onBack이 cancelGuestOnboarding 호출)
      onBack?.();
    } else {
      // 일반 로그인 사용자: 로그아웃 → user=null → 로그인 화면
      try {
        await signOut();
      } catch (e) {
        console.error('로그아웃 실패:', e);
      }
    }
  };

  const handleTermsAccept = () => {
    setStep('layout');
  };

  const handleLayoutSelect = async (layoutType: HouseLayout['layoutType']) => {
    setSelectedLayoutType(layoutType);
    setStep('persona');
  };

  const handleLayoutBack = () => {
    setStep('terms');
  };

  const handlePersonaBack = () => {
    setStep('layout');
  };

  const handlePersonaSelect = (personaId: PersonaType) => {
    setSelectedPersona(personaId);
    setStep('questions');
  };

  const handleQuestionsComplete = async (questionAnswers: OnboardingAnswers) => {
    setAnswers(questionAnswers);

    if (!selectedPersona) return;

    const profile = OnboardingService.createProfileFromPersona(
      userId,
      selectedPersona,
      questionAnswers
    );

    const tasks = await OnboardingService.createInitialTasks(userId, profile);

    const firstDay = OnboardingService.generateFirstDayTasks(tasks);

    setUserProfile(profile);
    setAllTasks(tasks);
    setFirstTasks(firstDay);
    setStep('tasks');
  };

  const handleQuestionsBack = () => {
    setStep('persona');
  };

  const handleTasksBack = () => {
    setStep('questions');
  };

  const handleStart = async () => {
    try {
      let finalUserId = userId;

      if (isGuestOnboarding) {
        // 온보딩 완료 시점에 익명 계정 생성 (뒤로가기로 취소 시 계정이 쌓이지 않음)
        console.log('👤 게스트 온보딩 완료 → 익명 계정 생성');
        const anonymousUser = await signInAnonymouslyAsync();
        finalUserId = anonymousUser.uid;
      }

      // userProfile의 userId를 실제 uid로 교체
      const profileWithId = userProfile
        ? { ...userProfile, userId: finalUserId }
        : null;

      // 프로필 저장
      if (profileWithId) {
        const completedProfile = OnboardingService.markOnboardingCompleted(profileWithId);
        await saveUserProfile(completedProfile);
        console.log('✅ 프로필 저장 완료');
      }

      // userId가 교체된 태스크 목록 준비
      const tasksWithId = allTasks.map((t) => ({ ...t, userId: finalUserId }));

      // 1. 집 레이아웃(+기본 가구) 저장 — Task 저장보다 먼저 실행
      const hasWasher = profileWithId?.environment?.hasWasher ?? true;
      const savedLayout = await OnboardingService.createAndSaveLayout(
        finalUserId,
        selectedLayoutType,
        hasWasher
      );

      // 2. lifeObject 문서 생성 → Task의 objectId를 실제 Firestore ID로 교체
      //    (직접 추가 Task와 동일한 구조를 갖게 하여 HouseMapScreen 집계 및
      //     lifeObject 조회가 정상 작동하도록 함)
      const tasksWithLifeObjects = await OnboardingService.createLifeObjectsForTasks(
        finalUserId,
        tasksWithId
      );

      // 3. 실제 objectId로 가구-Task 연동 (레이아웃 linkedObjectIds 업데이트)
      const templates = selectedPersona
        ? OnboardingService.getCleaningTemplates(selectedPersona)
        : [];
      const linkedLayout = OnboardingService.linkTasksToFurnitures(
        savedLayout,
        tasksWithLifeObjects,
        templates
      );
      // 연동 결과를 Firestore에 반영
      const { saveHouseLayout } = await import('@/services/houseService');
      await saveHouseLayout(linkedLayout);
      console.log('✅ 가구-Task 연동 완료');

      // 4. objectId가 교체된 태스크 저장
      if (tasksWithLifeObjects.length > 0) {
        await saveTasks(tasksWithLifeObjects);
        console.log(`✅ ${tasksWithLifeObjects.length}개 태스크 저장 완료`);
      }

      onComplete();
    } catch (error) {
      console.error('❌ 온보딩 데이터 저장 실패:', error);
      Alert.alert(
        '저장 실패',
        '온보딩 정보를 저장하는데 실패했습니다. 다시 시도해주세요.',
        [{ text: '확인' }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {step === 'terms' && (
        <TermsAgreementScreen
          onAccept={handleTermsAccept}
          onBack={handleTermsBack}
          navigation={navigation}
        />
      )}
      {step === 'layout' && (
        <HouseLayoutSelectionScreen
          onSelect={handleLayoutSelect}
          onBack={handleLayoutBack}
          isOnboarding
        />
      )}
      {step === 'persona' && (
        <PersonaSelectionScreen
          onSelect={handlePersonaSelect}
          onBack={handlePersonaBack}
          selectedPersona={selectedPersona}
        />
      )}
      {step === 'questions' && (
        <QuestionScreen 
          onComplete={handleQuestionsComplete}
          onBack={handleQuestionsBack}
          initialAnswers={answers}
        />
      )}
      {step === 'tasks' && (
        <FirstTasksScreen 
          tasks={firstTasks} 
          onStart={handleStart}
          onBack={handleTasksBack}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
