/**
 * 다정한 - 온보딩 질문 화면
 *
 * 온보딩 두 번째 단계: 환경 설정 질문
 * - boolean / select / multiselect 지원
 * - '왜 물어보나요?' 툴팁
 * - 조건부 질문 분기 (condition 필드)
 * - multiselect는 '건너뛰기' 허용
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  ScrollView,
} from 'react-native';
import questionFlow from '@/templates/questionFlow.json';
import { OnboardingAnswers } from '@/services/OnboardingService';

interface QuestionOption {
  id: string;
  label: string;
  value: any;
}

interface Question {
  id: string;
  question: string;
  tooltip?: string;
  type: 'boolean' | 'select' | 'multiselect';
  condition?: Record<string, any>;
  options: QuestionOption[];
  allowSkip?: boolean;
  skipLabel?: string;
}

interface Props {
  onComplete: (answers: OnboardingAnswers) => void;
  onBack: () => void;
  initialAnswers?: OnboardingAnswers;
}

export const QuestionScreen: React.FC<Props> = ({ onComplete, onBack, initialAnswers = {} }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>(initialAnswers);
  const [multiselectBuffer, setMultiselectBuffer] = useState<any[]>([]);
  const [questionHistory, setQuestionHistory] = useState<number[]>([0]);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [tooltipVisible, setTooltipVisible] = useState(false);

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
      if (shouldShowQuestion(questions[i])) return i;
    }
    return questions.length;
  };

  const advanceToNext = (newAnswers: Record<string, any>) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      const nextIndex = getNextQuestionIndex(currentQuestionIndex);
      if (nextIndex >= questions.length) {
        onComplete(newAnswers as OnboardingAnswers);
      } else {
        setCurrentQuestionIndex(nextIndex);
        setQuestionHistory(prev => [...prev, nextIndex]);
        setMultiselectBuffer([]);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }).start();
      }
    });
  };

  const handleSingleAnswer = (value: any) => {
    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);
    advanceToNext(newAnswers);
  };

  const toggleMultiselectItem = (value: any) => {
    setMultiselectBuffer(prev => {
      const exists = prev.includes(value);
      return exists ? prev.filter(v => v !== value) : [...prev, value];
    });
  };

  const confirmMultiselect = () => {
    const newAnswers = { ...answers, [currentQuestion.id]: multiselectBuffer };
    setAnswers(newAnswers);
    advanceToNext(newAnswers);
  };

  const skipMultiselect = () => {
    const newAnswers = { ...answers, [currentQuestion.id]: [] };
    setAnswers(newAnswers);
    advanceToNext(newAnswers);
  };

  const handleBack = () => {
    if (questionHistory.length <= 1) {
      onBack();
      return;
    }

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      const newHistory = [...questionHistory];
      newHistory.pop();
      const previousIndex = newHistory[newHistory.length - 1];
      setQuestionHistory(newHistory);
      setCurrentQuestionIndex(previousIndex);
      setMultiselectBuffer(
        answers[questions[previousIndex]?.id] instanceof Array
          ? answers[questions[previousIndex].id]
          : []
      );
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
    });
  };

  const visibleQuestionCount = questions.filter(shouldShowQuestion).length;
  const visibleIndex = questionHistory.length;
  const progress = (visibleIndex / Math.max(visibleQuestionCount, 1)) * 100;

  const isMultiselect = currentQuestion.type === 'multiselect';
  const currentBuffer: any[] = isMultiselect
    ? multiselectBuffer
    : [];

  return (
    <View style={styles.container}>
      {/* 헤더 */}
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
        <Text style={styles.progressText}>{visibleIndex} / {visibleQuestionCount}</Text>
      </View>

      {/* 질문 + 툴팁 */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.questionRow}>
          <Text style={styles.question}>{currentQuestion.question}</Text>
          {currentQuestion.tooltip ? (
            <TouchableOpacity
              onPress={() => setTooltipVisible(true)}
              style={styles.tooltipButton}
              activeOpacity={0.7}
            >
              <Text style={styles.tooltipButtonText}>?</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* boolean / select */}
        {!isMultiselect && (
          <View style={styles.options}>
            {currentQuestion.options.map(option => {
              const isSelected = answers[currentQuestion.id] === option.value;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[styles.option, isSelected && styles.optionSelected]}
                  onPress={() => handleSingleAnswer(option.value)}
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
        )}

        {/* multiselect */}
        {isMultiselect && (
          <View>
            <Text style={styles.multiselectHint}>여러 개 선택 가능해요</Text>
            <ScrollView style={styles.multiselectScroll} scrollEnabled={false}>
              <View style={styles.multiselectGrid}>
                {currentQuestion.options.map(option => {
                  const isSelected = currentBuffer.includes(option.value);
                  return (
                    <TouchableOpacity
                      key={option.id}
                      style={[styles.multiselectChip, isSelected && styles.multiselectChipSelected]}
                      onPress={() => toggleMultiselectItem(option.value)}
                      activeOpacity={0.7}
                    >
                      {isSelected && <Text style={styles.chipCheckmark}>✓ </Text>}
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.multiselectActions}>
              {currentQuestion.allowSkip && (
                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={skipMultiselect}
                  activeOpacity={0.7}
                >
                  <Text style={styles.skipButtonText}>
                    {currentQuestion.skipLabel ?? '건너뛰기'}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  currentBuffer.length === 0 && styles.confirmButtonDisabled,
                ]}
                onPress={confirmMultiselect}
                activeOpacity={currentBuffer.length > 0 ? 0.7 : 1}
                disabled={currentBuffer.length === 0}
              >
                <Text style={styles.confirmButtonText}>
                  {currentBuffer.length > 0
                    ? `${currentBuffer.length}개 선택 완료`
                    : '항목을 선택해주세요'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Animated.View>

      {/* 툴팁 모달 */}
      <Modal
        visible={tooltipVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTooltipVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setTooltipVisible(false)}
        >
          <View style={styles.tooltipCard}>
            <Text style={styles.tooltipTitle}>왜 물어보나요?</Text>
            <Text style={styles.tooltipContent}>{currentQuestion.tooltip}</Text>
            <TouchableOpacity
              style={styles.tooltipClose}
              onPress={() => setTooltipVisible(false)}
            >
              <Text style={styles.tooltipCloseText}>확인</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  header: {
    marginBottom: 16,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'right',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: 28,
    gap: 8,
  },
  question: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1A1A1A',
    lineHeight: 34,
    flex: 1,
  },
  tooltipButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  tooltipButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2196F3',
  },
  options: {
    gap: 12,
  },
  option: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  optionText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  optionTextSelected: {
    color: '#2196F3',
  },
  checkmark: {
    fontSize: 18,
    color: '#2196F3',
    marginLeft: 8,
    fontWeight: '700',
  },
  multiselectHint: {
    fontSize: 13,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 16,
  },
  multiselectScroll: {
    maxHeight: 320,
  },
  multiselectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  multiselectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  multiselectChipSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  chipCheckmark: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '700',
  },
  chipText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  chipTextSelected: {
    color: '#2196F3',
  },
  multiselectActions: {
    marginTop: 24,
    gap: 10,
  },
  skipButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#CCCCCC',
  },
  skipButtonText: {
    fontSize: 15,
    color: '#888888',
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  confirmButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  tooltipCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  tooltipTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 10,
  },
  tooltipContent: {
    fontSize: 15,
    color: '#444444',
    lineHeight: 22,
    marginBottom: 20,
  },
  tooltipClose: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  tooltipCloseText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
