DB schema & local persistence plan

Overview
- Use SQLite for structured local storage (react-native-sqlite-storage or better: WatermelonDB for performance)
- Keep an operations queue table to record local create/update/delete with timestamps and op id

Proposed schema (simplified)

-- Entities table (generic approach for Dataverse entities)
CREATE TABLE entities (
  local_id TEXT PRIMARY KEY,
  dataverse_id TEXT,
  entity_type TEXT,
  payload TEXT, -- JSON payload for flexibility
  updated_at INTEGER,
  pending INTEGER DEFAULT 0,
  deleted INTEGER DEFAULT 0
);

-- Attachments table
CREATE TABLE attachments (
  id TEXT PRIMARY KEY,
  entity_local_id TEXT,
  local_path TEXT,
  uploaded INTEGER DEFAULT 0
);

-- Ops queue
CREATE TABLE ops (
  op_id TEXT PRIMARY KEY,
  entity_local_id TEXT,
  op_type TEXT, -- create|update|delete
  payload TEXT,
  created_at INTEGER,
  retries INTEGER DEFAULT 0
);

Notes
- Use transactions for bulk operations and sync batching.
- Consider using a small ORM layer to map Dataverse schemas to local tables for performance.
- Enforce 0.5GB cap for attachments with eviction policy.
