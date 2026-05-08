import React, { useState } from 'react';
import { View, Button, Text, StyleSheet } from 'react-native';
import * as AuthSession from 'expo-auth-session';

// Replace these with your Azure AD values
const TENANT_ID = '<YOUR_TENANT_ID>';
const CLIENT_ID = '<YOUR_CLIENT_ID>';
const SCOPES = ['openid', 'profile', 'offline_access'];

export default function MSALAuth({ onSuccess }) {
  const [status, setStatus] = useState('idle');

  async function signIn() {
    try {
      setStatus('starting');
      const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });
      const authUrl =
        `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize` +
        `?client_id=${CLIENT_ID}` +
        `&response_type=token` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=${encodeURIComponent(SCOPES.join(' '))}`;

      const result = await AuthSession.startAsync({ authUrl });

      if (result.type === 'success' && result.params && result.params.access_token) {
        setStatus('success');
        onSuccess && onSuccess(result.params.access_token);
      } else if (result.type === 'dismiss') {
        setStatus('dismissed');
      } else {
        setStatus('error');
      }
    } catch (err) {
      console.warn('Auth error', err);
      setStatus('error');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Azure AD Authentication (Prototype)</Text>
      <Button title="Sign in with Azure AD" onPress={signIn} />
      <Text style={styles.status}>Status: {status}</Text>
      <Text style={styles.note}>Replace TENANT_ID and CLIENT_ID in app/auth/MSALAuth.js</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontWeight: '700', marginBottom: 8 },
  status: { marginTop: 8 },
  note: { marginTop: 6, fontSize: 12, color: '#666' }
});
