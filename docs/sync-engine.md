Sync engine (initial implementation)

Overview
- processPendingOps(): reads pending ops from ops queue and pushes entities to Dataverse using dataverseClient.pushEntity
- Retries uses exponential backoff; after MAX_RETRIES an op is removed to avoid blocking.

Files
- app/sync/syncEngine.js - core sync logic
- app/sync/dataverseClient.js - Dataverse HTTP client stub that uses access token from secure store

Usage
- Call processPendingOps() periodically (foreground or background) to sync local changes.
- Configure DATAVERSE_BASE_URL via environment or replace the stub URL.
- Ensure MSAL auth provides tokens with Dataverse scopes and tokens are stored under msal_access_token.

Next improvements
- Implement getEntityByLocalId in sqlite wrapper for efficient lookups
- Batch multiple ops into single API calls where supported
- Handle attachments separately (upload to blob storage then reference in Dataverse)
- Move failed ops to dead-letter queue and surface in UI
