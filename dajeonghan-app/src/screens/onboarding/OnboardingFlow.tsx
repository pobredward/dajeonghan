import React, { useState } from 'react';
import { View } from 'react-native';
import { TermsAgreementScreen } from './TermsAgreementScreen';
import { PersonaSelectionScreen } from './PersonaSelectionScreen';
import { QuestionScreen } from './QuestionScreen';
import { FirstTasksScreen } from './FirstTasksScreen';
import { OnboardingService, OnboardingAnswers } from '@/services/OnboardingService';
import { PersonaType } from '@/types/user.types';
import { Task } from '@/types/task.types';

interface Props {
  userId: string;
  onComplete: () => void;
}

export const OnboardingFlow: React.FC<Props> = ({ userId, onComplete }) => {
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

  const handleStart = () => {
    onComplete();
  };

  return (
    <View style={{ flex: 1 }}>
      {step === 'terms' && (
        <TermsAgreementScreen onAccept={handleTermsAccept} />
      )}
      {step === 'persona' && (
        <PersonaSelectionScreen onSelect={handlePersonaSelect} />
      )}
      {step === 'questions' && (
        <QuestionScreen onComplete={handleQuestionsComplete} />
      )}
      {step === 'tasks' && (
        <FirstTasksScreen tasks={firstTasks} onStart={handleStart} />
      )}
    </View>
  );
};
