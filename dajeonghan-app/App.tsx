import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FridgeHomeScreen } from './src/modules/fridge/screens/FridgeHomeScreen';

export default function App() {
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
