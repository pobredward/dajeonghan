import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { FridgeHomeScreen } from './src/modules/fridge/screens/FridgeHomeScreen';
import { AnalyticsService } from './src/services/analyticsService';
import { TemplateSharingService } from './src/services/templateSharingService';

export default function App() {
  useEffect(() => {
    AnalyticsService.logAppOpen();

    const initializeApp = async () => {
      try {
        await TemplateSharingService.checkInitialURL((templateId) => {
          console.log('템플릿 딥링크 수신:', templateId);
        });
      } catch (error) {
        console.error('초기화 오류:', error);
      }
    };

    initializeApp();

    const removeListener = TemplateSharingService.addURLListener((templateId) => {
      console.log('템플릿 딥링크 수신:', templateId);
    });

    return () => {
      removeListener();
    };
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <FridgeHomeScreen />
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
});
