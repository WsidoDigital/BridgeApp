import React from 'react';
import { SafeAreaView, View, Text, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bridging App - WebView Prototype</Text>
      </View>
      <WebView
        source={{ uri: 'https://your-powerapp-url.example' }}
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
