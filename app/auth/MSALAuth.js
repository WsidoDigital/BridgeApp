import React, { useState, useEffect } from 'react';
import { View, Button, Text, StyleSheet } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';

// Replace these with your Azure AD values
const TENANT_ID = '<YOUR_TENANT_ID>';
const CLIENT_ID = '<YOUR_CLIENT_ID>';
const SCOPES = ['openid', 'profile', 'offline_access', 'offline_access', 'user.read'];

const ACCESS_TOKEN_KEY = 'msal_access_token';
const REFRESH_TOKEN_KEY = 'msal_refresh_token';
const EXPIRES_AT_KEY = 'msal_expires_at';

const discovery = {
  authorizationEndpoint: `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize`,
  tokenEndpoint: `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
};

export default function MSALAuth({ onSuccess }) {
  const [status, setStatus] = useState('idle');

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: CLIENT_ID,
      scopes: SCOPES,
      redirectUri: AuthSession.makeRedirectUri({ useProxy: true }),
      usePKCE: true,
    },
    discovery
  );

  useEffect(() => {
    (async () => {
      // check stored tokens
      const access = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
      const expiresAt = await SecureStore.getItemAsync(EXPIRES_AT_KEY);
      const refresh = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);

      const now = Math.floor(Date.now() / 1000);
      if (access && expiresAt && Number(expiresAt) > now) {
        setStatus('restored');
        onSuccess && onSuccess(access);
        return;
      }

      if (refresh) {
        setStatus('refreshing');
        const refreshed = await refreshTokens(refresh);
        if (refreshed) return;
      }

      setStatus('idle');
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (response?.type === 'success' && response.params?.code) {
        setStatus('exchanging');
        const code = response.params.code;
        const tokenResult = await exchangeCodeForTokens(code, request.codeVerifier);
        if (tokenResult) {
          onSuccess && onSuccess(tokenResult.access_token);
        } else {
          setStatus('error');
        }
      }
    })();
  }, [response]);

  async function exchangeCodeForTokens(code, codeVerifier) {
    try {
      const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });
      const body = new URLSearchParams();
      body.append('client_id', CLIENT_ID);
      body.append('grant_type', 'authorization_code');
      body.append('code', code);
      body.append('redirect_uri', redirectUri);
      body.append('code_verifier', codeVerifier);

      const res = await fetch(discovery.tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });

      const json = await res.json();
      if (json.access_token) {
        const now = Math.floor(Date.now() / 1000);
        const expiresAt = now + (json.expires_in || 3600);
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, json.access_token);
        if (json.refresh_token) await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, json.refresh_token);
        await SecureStore.setItemAsync(EXPIRES_AT_KEY, String(expiresAt));
        setStatus('success');
        return json;
      }

      console.warn('Token exchange failed', json);
      return null;
    } catch (err) {
      console.warn('Exchange error', err);
      return null;
    }
  }

  async function refreshTokens(refreshToken) {
    try {
      const body = new URLSearchParams();
      body.append('client_id', CLIENT_ID);
      body.append('grant_type', 'refresh_token');
      body.append('refresh_token', refreshToken);

      const res = await fetch(discovery.tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });

      const json = await res.json();
      if (json.access_token) {
        const now = Math.floor(Date.now() / 1000);
        const expiresAt = now + (json.expires_in || 3600);
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, json.access_token);
        if (json.refresh_token) await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, json.refresh_token);
        await SecureStore.setItemAsync(EXPIRES_AT_KEY, String(expiresAt));
        setStatus('success');
        onSuccess && onSuccess(json.access_token);
        return json;
      }

      console.warn('Refresh failed', json);
      return null;
    } catch (err) {
      console.warn('Refresh error', err);
      return null;
    }
  }

  async function signIn() {
    setStatus('starting');
    await promptAsync({ useProxy: true, showInRecents: true });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Azure AD Authentication (PKCE + Secure Storage)</Text>
      <Button disabled={!request} title="Sign in with Azure AD" onPress={signIn} />
      <Text style={styles.status}>Status: {status}</Text>
      <Text style={styles.note}>Replace TENANT_ID and CLIENT_ID in app/auth/MSALAuth.js and configure redirect URI in Azure AD app registration.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontWeight: '700', marginBottom: 8 },
  status: { marginTop: 8 },
  note: { marginTop: 6, fontSize: 12, color: '#666' }
});
