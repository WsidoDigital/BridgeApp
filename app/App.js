import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, StyleSheet, Button, FlatList } from 'react-native';
import { WebView } from 'react-native-webview';
import MSALAuth from './auth/MSALAuth';
import db from './storage/sqliteWrapper';

export default function App() {
  const [token, setToken] = useState(null);
  const [entities, setEntities] = useState([]);
  const POWERAPP_URL = 'https://apps.powerapps.com/play/e/300a3538-f5a2-4f96-9815-eebb54dbdfcf/a/44d75547-6568-4376-8198-8e9bc5a5687d?tenantId=7d667199-5c28-4a8c-ade8-bafde7c94c87&hint=0a19c064-6a1f-45c4-accf-c11ec7dc8d6d&sourcetime=1778236254490';

  useEffect(() => {
    (async () => {
      try {
        await db.initSchema();
        refreshEntities();
      } catch (err) {
        console.warn('DB init error', err);
      }
    })();
  }, []);

  async function refreshEntities() {
    const rows = await db.getEntities(50);
    setEntities(rows);
  }

  async function addDemoEntity() {
    const id = `local-${Date.now()}`;
    await db.upsertEntity(id, null, 'form', { createdAt: Date.now(), demo: true });
    await db.addOp(`op-${id}`, id, 'create', { demo: true });
    await refreshEntities();
  }

  async function clearAll() {
    await db.clearAll();
    refreshEntities();
  }

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

      <View style={styles.controls}>
        <Button title="Add demo entity" onPress={addDemoEntity} />
        <Button title="Refresh entities" onPress={refreshEntities} />
        <Button title="Clear all" onPress={clearAll} />
      </View>

      <View style={styles.listContainer}>
        <Text style={styles.subtitle}>Local entities (latest 50)</Text>
        <FlatList
          data={entities}
          keyExtractor={(item) => item.local_id}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text>{item.local_id} — {item.entity_type}</Text>
            </View>
          )}
        />
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
  webview: { flex: 1 },
  controls: { flexDirection: 'row', justifyContent: 'space-around', padding: 8 },
  listContainer: { maxHeight: 160, padding: 8 },
  subtitle: { fontWeight: '700', marginBottom: 6 },
  row: { paddingVertical: 4 }
});
