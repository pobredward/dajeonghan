/**
 * 다정한 - 페르소나 선택 화면
 *
 * 온보딩 첫 단계: 사용자의 라이프스타일 페르소나 선택
 * - 각 카드에 예상 Task 수 뱃지 표시 (청소 N개 + α)
 * - 선택 전 어떤 Task가 생길지 미리 파악 가능
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { PersonaType } from '@/types/user.types';
import { OnboardingService } from '@/services/OnboardingService';

interface Props {
  onSelect: (personaId: PersonaType) => void;
  onBack: () => void;
  selectedPersona: PersonaType | null;
}

export const PersonaSelectionScreen: React.FC<Props> = ({ onSelect, onBack, selectedPersona }) => {
  const personas = OnboardingService.getPersonas();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
        <Text style={styles.backButtonText}>← 뒤로</Text>
      </TouchableOpacity>

      <Text style={styles.title}>어떤 분이신가요?</Text>
      <Text style={styles.subtitle}>
        생활 패턴에 가장 가까운 것을 골라주세요{'\n'}선택에 맞게 할 일을 자동으로 준비해드려요
      </Text>

      <View style={styles.grid}>
        {personas.map(persona => {
          const isSelected = selectedPersona === persona.id;
          const taskCount = OnboardingService.getEstimatedTaskCount(persona.id as PersonaType);

          return (
            <TouchableOpacity
              key={persona.id}
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => onSelect(persona.id as PersonaType)}
              activeOpacity={0.7}
            >
              {/* 예상 Task 수 뱃지 */}
              <View style={styles.taskBadge}>
                <Text style={styles.taskBadgeText}>
                  할 일 약 {taskCount.total}개+
                </Text>
              </View>

              <Text style={styles.icon}>{persona.icon}</Text>
              <Text style={styles.personaName}>{persona.name}</Text>
              <Text style={styles.description}>{persona.description}</Text>

              {/* 청소 카운트 힌트 */}
              <Text style={styles.cleaningHint}>
                청소 {taskCount.cleaning}개 기본 포함
              </Text>

              {isSelected && (
                <View style={styles.selectedBadge}>
                  <Text style={styles.selectedBadgeText}>✓ 선택됨</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.noteBox}>
        <Text style={styles.noteText}>
          다음 질문에서 반려동물·차량·식물 등을 답하면{'\n'}
          추가 할 일이 자동으로 더 생겨요
        </Text>
      </View>

      <Text style={styles.hint}>
        나중에 언제든 변경할 수 있어요
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 20,
    paddingBottom: 48,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '600',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 15,
    color: '#666666',
    marginBottom: 28,
    textAlign: 'center',
    lineHeight: 22,
  },
  grid: {
    gap: 14,
  },
  card: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  cardSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  taskBadge: {
    position: 'absolute',
    top: 12,
    right: 14,
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFB300',
  },
  taskBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E65100',
  },
  icon: {
    fontSize: 44,
    marginBottom: 10,
    marginTop: 8,
  },
  personaName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
    color: '#1A1A1A',
  },
  description: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  cleaningHint: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '500',
    marginTop: 2,
  },
  selectedBadge: {
    marginTop: 10,
    backgroundColor: '#2196F3',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 12,
  },
  selectedBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  noteBox: {
    marginTop: 20,
    backgroundColor: '#F1F8FF',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  noteText: {
    fontSize: 13,
    color: '#444444',
    lineHeight: 20,
    textAlign: 'center',
  },
  hint: {
    marginTop: 16,
    fontSize: 13,
    color: '#AAAAAA',
    textAlign: 'center',
  },
});
