import React, { useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { TermsAgreementScreen } from './TermsAgreementScreen';
import { PersonaSelectionScreen } from './PersonaSelectionScreen';
import { QuestionScreen } from './QuestionScreen';
import { FirstTasksScreen } from './FirstTasksScreen';
import { OnboardingService, OnboardingAnswers } from '@/services/OnboardingService';
import { PersonaType } from '@/types/user.types';
import { Task } from '@/types/task.types';
import { RootStackParamList } from '@/navigation/RootNavigator';

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

    setFirstTasks(firstDay);
    setStep('tasks');
  };

  const handleQuestionsBack = () => {
    setStep('persona');
  };

  const handleTasksBack = () => {
    setStep('questions');
  };

  const handleStart = () => {
    onComplete();
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
