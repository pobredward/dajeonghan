/**
 * 다정한 - 고급 설정 배너 컴포넌트
 * 
 * 온보딩 완료 후 7일이 지나면 표시되는 배너
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  onOpen: () => void;
  onDismiss: () => void;
}

export const AdvancedSettingsBanner: React.FC<Props> = ({ onOpen, onDismiss }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⚙️</Text>
      <View style={styles.content}>
        <Text style={styles.title}>고급 설정이 열렸어요!</Text>
        <Text style={styles.subtitle}>
          이제 주기, 알림, 모듈을 자유롭게 커스터마이징할 수 있습니다.
        </Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={onOpen}>
        <Text style={styles.buttonText}>보기</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
        <Text style={styles.dismissText}>×</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    margin: 16,
    flexDirection: 'row',
    alignItems: 'center'
  },
  icon: {
    fontSize: 32,
    marginRight: 12
  },
  content: {
    flex: 1
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#1A1A1A'
  },
  subtitle: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 16
  },
  button: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14
  },
  dismissButton: {
    marginLeft: 8,
    padding: 4
  },
  dismissText: {
    fontSize: 24,
    color: '#999999',
    lineHeight: 24
  }
});
