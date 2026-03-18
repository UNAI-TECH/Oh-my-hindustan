import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, ActivityIndicator } from 'react-native';
import { useState } from 'react';

// For Android emulator, localhost is 10.0.2.2
// For actual physical device or iOS Simulator, use your local IP or localhost
const BACKEND_URL = 'http://10.0.2.2:3000'; // Make sure this matches your environment

export default function App() {
  const [status, setStatus] = useState('Not connected');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const testConnection = async () => {
    setLoading(true);
    setStatus('Connecting to backend...');
    setData(null);

    try {
      // Connect to the actual NestJS backend
      const response = await fetch(BACKEND_URL);
      const result = await response.text();
      
      setStatus('Successfully connected! ✅');
      setData(result);
    } catch (error) {
      console.error(error);
      setStatus('Connection failed ❌');
      setData(error.message + '\n\nMake sure the backend is running and the URL is correct.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Oh My Hindustan</Text>
      <Text style={styles.subtitle}>Expo Frontend</Text>
      
      <View style={styles.card}>
        <Text style={styles.statusLabel}>Backend Status:</Text>
        <Text style={[styles.statusText, status.includes('failed') ? styles.error : status.includes('Success') ? styles.success : null]}>
          {status}
        </Text>
        
        {loading && <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />}
        
        {data && (
          <View style={styles.dataContainer}>
            <Text style={styles.dataLabel}>Response:</Text>
            <Text style={styles.dataText}>{data}</Text>
          </View>
        )}
      </View>

      <Button title="Test Backend Connection" onPress={testConnection} />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 30,
  },
  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
    alignItems: 'center',
    minHeight: 150,
  },
  statusLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  success: {
    color: 'green',
  },
  error: {
    color: 'red',
  },
  loader: {
    marginTop: 20,
  },
  dataContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    width: '100%',
  },
  dataLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  dataText: {
    fontSize: 14,
    color: '#555',
  }
});
