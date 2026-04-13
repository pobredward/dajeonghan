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
  ScrollView,
  SafeAreaView
} from 'react-native';
import { PersonaType } from '@/types/user.types';
import { OnboardingService } from '@/services/OnboardingService';

interface Props {
  onSelect: (personaId: PersonaType) => void;
}

export const PersonaSelectionScreen: React.FC<Props> = ({ onSelect }) => {
  const personas = OnboardingService.getPersonas();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>어떤 분이신가요?</Text>
        <Text style={styles.subtitle}>
          생활 패턴에 맞는 추천을 드릴게요
        </Text>

        <View style={styles.grid}>
          {personas.map(persona => (
            <TouchableOpacity
              key={persona.id}
              style={styles.card}
              onPress={() => onSelect(persona.id as PersonaType)}
              activeOpacity={0.7}
            >
              <Text style={styles.icon}>{persona.icon}</Text>
              <Text style={styles.personaName}>{persona.name}</Text>
              <Text style={styles.description}>{persona.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.hint}>
          💡 나중에 언제든 변경할 수 있어요
        </Text>
      </ScrollView>
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
    backgroundColor: '#FFFFFF'
  },
  content: {
    padding: 20,
    paddingBottom: 40
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
  hint: {
    marginTop: 24,
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 20
  }
});
