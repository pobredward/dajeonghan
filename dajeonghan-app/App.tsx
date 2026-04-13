import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { RootNavigator } from './src/navigation/RootNavigator';
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
    <SafeAreaProvider>
      <RootNavigator />
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
