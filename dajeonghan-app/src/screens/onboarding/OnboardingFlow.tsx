import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { TermsAgreementScreen } from './TermsAgreementScreen';
import { PersonaSelectionScreen } from './PersonaSelectionScreen';
import { QuestionScreen } from './QuestionScreen';
import { FirstTasksScreen } from './FirstTasksScreen';
import { OnboardingService, OnboardingAnswers } from '@/services/OnboardingService';
import { PersonaType } from '@/types/user.types';
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
  const [step, setStep] = useState<'terms' | 'persona' | 'questions' | 'tasks'>('terms');
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
    setStep('persona');
  };

  const handlePersonaBack = () => {
    setStep('terms');
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

      // 초기 태스크 저장 (userId 교체)
      if (allTasks.length > 0) {
        const tasksWithId = allTasks.map((t) => ({ ...t, userId: finalUserId }));
        await saveTasks(tasksWithId);
        console.log(`✅ ${tasksWithId.length}개 태스크 저장 완료`);
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
