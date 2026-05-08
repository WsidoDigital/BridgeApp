Sprint 1: RN skeleton & WebView prototype

This PR adds a minimal React Native (Expo) skeleton and a WebView-based prototype that hosts the Power App URL.

Files added:
- package.json (expo + react-native-webview)
- app/App.js (WebView prototype)

How to run (locally):
1. Install Expo CLI: npm install -g expo-cli
2. npm install
3. npm run start
4. Open on device via Expo Go or emulator

Notes:
- Replace the placeholder URL in app/App.js with the real Power App URL.
- This PR is a lightweight prototype to validate hosting and auth flows; next tasks: add MSAL, local DB and offline UX.
