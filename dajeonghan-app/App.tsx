import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { db } from './src/config/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function App() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testFirebaseConnection();
  }, []);

  const testFirebaseConnection = async () => {
    try {
      await getDocs(collection(db, '_test'));
      setConnected(true);
      console.log('✅ Firebase 연결 성공');
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        setConnected(true);
        console.log('✅ Firebase 연결 성공 (권한 확인됨)');
      } else {
        console.error('❌ Firebase 연결 실패:', error);
        setConnected(false);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Firebase 연결 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>다정한</Text>
      <Text style={styles.subtitle}>dajeonghan</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Firebase 상태:</Text>
        <Text style={[
          styles.statusValue,
          { color: connected ? '#4CAF50' : '#F44336' }
        ]}>
          {connected ? '✅ 연결됨' : '❌ 연결 실패'}
        </Text>
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>프로젝트 ID: dajeonghan</Text>
        <Text style={styles.infoText}>번들 ID: com.onmindlab.dajeonghan</Text>
        <Text style={styles.infoText}>버전: 1.0.0</Text>
      </View>
      
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 40,
    fontWeight: '700',
    marginBottom: 8,
    color: '#2196F3',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  statusLabel: {
    fontSize: 16,
    marginRight: 8,
    color: '#333',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: '#F5F5F5',
    padding: 20,
    borderRadius: 12,
    width: '100%',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
});
