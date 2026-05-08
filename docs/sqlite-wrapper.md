SQLite wrapper (expo-sqlite)

This module provides a small async wrapper around expo-sqlite for the Bridging App.

Usage:

import db from '../app/storage/sqliteWrapper';

await db.initSchema();
await db.upsertEntity('local-1', null, 'form', { foo: 'bar' });
const rows = await db.getEntities();

API:
- initSchema(): create required tables
- upsertEntity(localId, dataverseId, entityType, payloadObj)
- getEntities(limit)
- addOp(opId, entityLocalId, opType, payloadObj)
- getPendingOps(limit)
- markOpDone(opId)
- deleteEntity(localId)
- clearAll()

Notes:
- This is intentionally small; later iterations should add migrations, batching, and stronger typing.
