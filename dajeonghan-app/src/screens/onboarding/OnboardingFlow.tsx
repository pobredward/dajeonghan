/**
 * 다정한 - 온보딩 플로우 통합
 * 
 * 페르소나 선택 → 질문 → 첫 할일 → 완료
 */

import React, { useState } from 'react';
import { View } from 'react-native';
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
  const [step, setStep] = useState<'persona' | 'questions' | 'tasks'>('persona');
  const [selectedPersona, setSelectedPersona] = useState<PersonaType | null>(null);
  const [answers, setAnswers] = useState<OnboardingAnswers>({});
  const [firstTasks, setFirstTasks] = useState<Task[]>([]);

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
