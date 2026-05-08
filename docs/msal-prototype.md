MSAL / Azure AD prototype

This prototype uses Expo's auth flow (expo-auth-session) to sign in to Azure AD and obtain an access token.

How to use
1. Replace TENANT_ID and CLIENT_ID in app/auth/MSALAuth.js with your Azure AD tenant and app registration client id.
2. Ensure redirect URI is allowed in the app registration (use the Expo proxy redirect URI during development).
3. Run the app via Expo: npm install && npm start
4. Tap "Sign in with Azure AD", complete login in browser, and the app will show the Power App WebView with the access token set in the Authorization header.

Notes
- This is a lightweight prototype for validating authentication flows. For production use, implement PKCE, token refresh, secure token storage (Keychain/Keystore) and proper scope configuration for Dataverse access.
