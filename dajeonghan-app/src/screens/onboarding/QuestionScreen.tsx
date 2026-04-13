/**
 * 다정한 - 온보딩 질문 화면
 * 
 * 온보딩 두 번째 단계: 환경 설정 질문
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated
} from 'react-native';
import questionFlow from '@/templates/questionFlow.json';
import { OnboardingAnswers } from '@/services/OnboardingService';

interface Question {
  id: string;
  question: string;
  type: 'boolean' | 'select';
  condition?: Record<string, any>;
  options: Array<{
    id: string;
    label: string;
    value: any;
  }>;
}

interface Props {
  onComplete: (answers: OnboardingAnswers) => void;
}

export const QuestionScreen: React.FC<Props> = ({ onComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [fadeAnim] = useState(new Animated.Value(1));

  const questions = questionFlow.questions as Question[];
  const currentQuestion = questions[currentQuestionIndex];

  const shouldShowQuestion = (question: Question): boolean => {
    if (!question.condition) return true;

    const conditionKey = Object.keys(question.condition)[0];
    const conditionValue = question.condition[conditionKey];
    
    return answers[conditionKey] === conditionValue;
  };

  const getNextQuestionIndex = (fromIndex: number): number => {
    for (let i = fromIndex + 1; i < questions.length; i++) {
      if (shouldShowQuestion(questions[i])) {
        return i;
      }
    }
    return questions.length;
  };

  const handleAnswer = (value: any) => {
    const newAnswers = {
      ...answers,
      [currentQuestion.id]: value
    };
    setAnswers(newAnswers);

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true
    }).start(() => {
      const nextIndex = getNextQuestionIndex(currentQuestionIndex);
      
      if (nextIndex >= questions.length) {
        onComplete(newAnswers as OnboardingAnswers);
      } else {
        setCurrentQuestionIndex(nextIndex);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        }).start();
      }
    });
  };

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>

        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <Text style={styles.question}>{currentQuestion.question}</Text>

          <View style={styles.options}>
            {currentQuestion.options.map(option => (
              <TouchableOpacity
                key={option.id}
                style={styles.option}
                onPress={() => handleAnswer(option.value)}
                activeOpacity={0.7}
              >
                <Text style={styles.optionText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.hint}>
            {currentQuestionIndex + 1} / {questions.length}
          </Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 40
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 2
  },
  content: {
    flex: 1,
    justifyContent: 'center'
  },
  question: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 32,
    textAlign: 'center',
    color: '#1A1A1A',
    lineHeight: 36
  },
  options: {
    gap: 12
  },
  option: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center'
  },
  optionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A'
  },
  hint: {
    marginTop: 32,
    fontSize: 14,
    color: '#999999',
    textAlign: 'center'
  }
});
