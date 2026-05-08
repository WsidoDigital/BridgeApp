import React, { useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import MSALAuth from './auth/MSALAuth';

export default function App() {
  const [token, setToken] = useState(null);
  const POWERAPP_URL = 'https://your-powerapp-url.example';

  if (!token) {
    return (
      <SafeAreaView style={styles.container}>
        <MSALAuth onSuccess={setToken} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bridging App - WebView (Authenticated)</Text>
      </View>
      <WebView
        source={{ uri: POWERAPP_URL, headers: { Authorization: `Bearer ${token}` } }}
        style={styles.webview}
        originWhitelist={["*"]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 12, backgroundColor: '#0a6', alignItems: 'center' },
  title: { color: '#fff', fontWeight: '600' },
  webview: { flex: 1 }
});
