/**
 * 다정한 - 온보딩 질문 화면
 * 
 * 온보딩 두 번째 단계: 환경 설정 질문
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
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
  onBack: () => void;
  initialAnswers?: OnboardingAnswers;
}

export const QuestionScreen: React.FC<Props> = ({ onComplete, onBack, initialAnswers = {} }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>(initialAnswers);
  const [questionHistory, setQuestionHistory] = useState<number[]>([0]);
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

  const getPreviousQuestionIndex = (fromIndex: number): number => {
    for (let i = fromIndex - 1; i >= 0; i--) {
      if (shouldShowQuestion(questions[i])) {
        return i;
      }
    }
    return -1;
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
        setQuestionHistory([...questionHistory, nextIndex]);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        }).start();
      }
    });
  };

  const handleBack = () => {
    if (questionHistory.length <= 1) {
      onBack();
      return;
    }

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true
    }).start(() => {
      const newHistory = [...questionHistory];
      newHistory.pop();
      const previousIndex = newHistory[newHistory.length - 1];
      
      setQuestionHistory(newHistory);
      setCurrentQuestionIndex(previousIndex);
      
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true
      }).start();
    });
  };

  const progress = ((questionHistory.length) / questions.length) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>← 이전</Text>
        </TouchableOpacity>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Text style={styles.question}>{currentQuestion.question}</Text>

        <View style={styles.options}>
          {currentQuestion.options.map(option => {
            const isSelected = answers[currentQuestion.id] === option.value;
            return (
              <TouchableOpacity
                key={option.id}
                style={[styles.option, isSelected && styles.optionSelected]}
                onPress={() => handleAnswer(option.value)}
                activeOpacity={0.7}
              >
                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                  {option.label}
                </Text>
                {isSelected && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.hint}>
          {questionHistory.length} / {questions.length}
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20
  },
  header: {
    marginBottom: 20
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 16
  },
  backButtonText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600'
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2
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
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent'
  },
  optionSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3'
  },
  optionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A'
  },
  optionTextSelected: {
    color: '#2196F3'
  },
  checkmark: {
    fontSize: 18,
    color: '#2196F3',
    marginLeft: 8,
    fontWeight: '700'
  },
  hint: {
    marginTop: 32,
    fontSize: 14,
    color: '#999999',
    textAlign: 'center'
  }
});
