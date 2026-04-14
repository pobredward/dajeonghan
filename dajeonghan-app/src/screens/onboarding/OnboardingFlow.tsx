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

type OnboardingNavigationProp = StackNavigationProp<RootStackParamList, 'Onboarding'>;

interface Props {
  userId: string;
  onComplete: () => void;
  navigation: OnboardingNavigationProp;
}

export const OnboardingFlow: React.FC<Props> = ({ userId, onComplete, navigation }) => {
  const [step, setStep] = useState<'terms' | 'persona' | 'questions' | 'tasks'>('terms');
  const [selectedPersona, setSelectedPersona] = useState<PersonaType | null>(null);
  const [answers, setAnswers] = useState<OnboardingAnswers>({});
  const [firstTasks, setFirstTasks] = useState<Task[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [allTasks, setAllTasks] = useState<Task[]>([]);

  const handleTermsAccept = () => {
    setStep('persona');
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
      // 프로필 저장
      if (userProfile) {
        const completedProfile = OnboardingService.markOnboardingCompleted(userProfile);
        await saveUserProfile(completedProfile);
        console.log('✅ 프로필 저장 완료:', completedProfile);
      }

      // 초기 테스크 저장
      if (allTasks.length > 0) {
        await saveTasks(allTasks);
        console.log(`✅ ${allTasks.length}개 테스크 저장 완료`);
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
          navigation={navigation}
        />
      )}
      {step === 'persona' && (
        <PersonaSelectionScreen 
          onSelect={handlePersonaSelect}
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
