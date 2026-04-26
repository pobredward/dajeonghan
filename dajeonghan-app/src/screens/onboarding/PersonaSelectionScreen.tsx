/**
 * 다정한 - 페르소나 선택 화면
 * 
 * 온보딩 첫 단계: 사용자의 라이프스타일 페르소나 선택
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView
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
        생활 패턴에 맞는 추천을 드릴게요
      </Text>

      <View style={styles.grid}>
        {personas.map(persona => {
          const isSelected = selectedPersona === persona.id;
          return (
            <TouchableOpacity
              key={persona.id}
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => onSelect(persona.id as PersonaType)}
              activeOpacity={0.7}
            >
              <Text style={styles.icon}>{persona.icon}</Text>
              <Text style={styles.personaName}>{persona.name}</Text>
              <Text style={styles.description}>{persona.description}</Text>
              {isSelected && (
                <View style={styles.selectedBadge}>
                  <Text style={styles.selectedBadgeText}>✓ 선택됨</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.hint}>
        💡 나중에 언제든 변경할 수 있어요
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  content: {
    padding: 20,
    paddingBottom: 40
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
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    color: '#1A1A1A'
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24
  },
  grid: {
    gap: 16
  },
  card: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent'
  },
  cardSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3'
  },
  icon: {
    fontSize: 48,
    marginBottom: 12
  },
  personaName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
    color: '#1A1A1A'
  },
  description: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20
  },
  selectedBadge: {
    marginTop: 12,
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  selectedBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600'
  },
  hint: {
    marginTop: 24,
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 20
  }
});
