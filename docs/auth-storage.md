Token storage, refresh, and PKCE notes

Files added:
- app/auth/MSALAuth.js: uses expo-auth-session useAuthRequest (PKCE) and exchanges code for tokens.
- Tokens are saved in secure storage (expo-secure-store) under keys msal_access_token, msal_refresh_token, msal_expires_at.

Developer notes:
- Replace TENANT_ID and CLIENT_ID in app/auth/MSALAuth.js.
- Add the Expo redirect URI (printable by `AuthSession.makeRedirectUri({useProxy:true})`) to the Azure AD app registration.
- For production, implement PKCE properly (this uses expo-auth-session PKCE helper), secure refresh token rotation, and token revocation on sign out.
