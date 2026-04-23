import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Colors, Typography, Spacing } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { HouseLayout } from '@/types/house.types';
import {
  getHouseLayout,
  saveHouseLayout,
  getLayoutTemplate,
} from '@/services/houseService';
import { HouseLayoutSelectionScreen } from './HouseLayoutSelectionScreen';
import { HouseEditorScreen } from './HouseEditorScreen';
import { HouseMapScreen } from './HouseMapScreen';
import { HouseStackParamList } from '@/navigation/HouseNavigator';

type NavigationProp = StackNavigationProp<HouseStackParamList, 'HouseMain'>;

type SetupStep = 'select_layout' | 'edit_layout' | 'view';

export const HouseSetupFlow: React.FC = () => {
  const { userId } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const [step, setStep] = useState<SetupStep>('select_layout');
  const [layout, setLayout] = useState<HouseLayout | null>(null);
  const [loading, setLoading] = useState(true);

  useLayoutEffect(() => {
    if (step === 'view' && layout) {
      navigation.setOptions({
        title: '내 집',
        headerRight: () => (
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('HouseEditor', { layout });
            }}
            style={{ marginRight: 16 }}
          >
            <Text style={{ color: Colors.primary, fontWeight: '600', fontSize: 16 }}>편집</Text>
          </TouchableOpacity>
        ),
      });
    } else if (step === 'select_layout') {
      navigation.setOptions({
        title: '집 구조 설정',
        headerRight: undefined,
      });
    } else if (step === 'edit_layout') {
      navigation.setOptions({
        title: '집 편집',
        headerRight: undefined,
      });
    } else {
      navigation.setOptions({
        title: '',
        headerRight: undefined,
      });
    }
  }, [navigation, step, layout]);

  useEffect(() => {
    loadHouseLayout();
  }, [userId]);

  // 편집 화면에서 돌아올 때 최신 레이아웃을 다시 불러옴
  useFocusEffect(
    React.useCallback(() => {
      if (!userId || loading) return;
      refreshLayoutIfNeeded();
    }, [userId, step])
  );

  const refreshLayoutIfNeeded = async () => {
    if (!userId || step !== 'view') return;
    try {
      const existingLayout = await getHouseLayout(userId);
      if (existingLayout) {
        setLayout(existingLayout);
      }
    } catch (error) {
      console.error('Failed to refresh house layout:', error);
    }
  };

  const loadHouseLayout = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const existingLayout = await getHouseLayout(userId);
      
      if (existingLayout) {
        setLayout(existingLayout);
        setStep('view');
      } else {
        setStep('select_layout');
      }
    } catch (error) {
      console.error('Failed to load house layout:', error);
      Alert.alert('오류', '집 구조를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleLayoutSelect = async (layoutType: HouseLayout['layoutType']) => {
    if (!userId) return;

    try {
      const template = getLayoutTemplate(layoutType);
      const newLayout: HouseLayout = {
        ...template,
        id: 'main',
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setLayout(newLayout);
      setStep('edit_layout');
    } catch (error) {
      console.error('Failed to create layout:', error);
      Alert.alert('오류', '집 구조를 생성하는데 실패했습니다.');
    }
  };

  const handleSaveLayout = async (updatedLayout: HouseLayout) => {
    if (!userId) return;

    try {
      await saveHouseLayout(updatedLayout);
      setLayout(updatedLayout);
      setStep('view');
      Alert.alert('완료', '집 구조가 저장되었습니다!');
    } catch (error) {
      console.error('Failed to save layout:', error);
      Alert.alert('오류', '집 구조를 저장하는데 실패했습니다.');
    }
  };

  const handleEditLayout = () => {
    setStep('edit_layout');
  };

  const handleCancelEdit = () => {
    setStep('view');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>집 구조 불러오는 중...</Text>
      </View>
    );
  }

  if (step === 'select_layout') {
    return <HouseLayoutSelectionScreen onSelect={handleLayoutSelect} />;
  }

  if (step === 'edit_layout' && layout) {
    return (
      <HouseEditorScreen
        initialLayout={layout}
        onSave={handleSaveLayout}
        onCancel={handleCancelEdit}
      />
    );
  }

  if (step === 'view' && layout) {
    return <HouseMapScreen layout={layout} />;
  }

  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>문제가 발생했습니다.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  errorText: {
    ...Typography.body,
    color: Colors.error,
  },
});
