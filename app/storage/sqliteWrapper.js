import * as SQLite from 'expo-sqlite';

const DB_NAME = 'bridgeapp.db';
const db = SQLite.openDatabase(DB_NAME);

function executeSqlAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        sql,
        params,
        (_, result) => resolve(result),
        (_, err) => { reject(err); return false; }
      );
    }, err => reject(err));
  });
}

export async function initSchema() {
  await executeSqlAsync(`CREATE TABLE IF NOT EXISTS entities (
    local_id TEXT PRIMARY KEY,
    dataverse_id TEXT,
    entity_type TEXT,
    payload TEXT,
    updated_at INTEGER,
    pending INTEGER DEFAULT 0,
    deleted INTEGER DEFAULT 0
  );`);

  await executeSqlAsync(`CREATE TABLE IF NOT EXISTS attachments (
    id TEXT PRIMARY KEY,
    entity_local_id TEXT,
    local_path TEXT,
    uploaded INTEGER DEFAULT 0
  );`);

  await executeSqlAsync(`CREATE TABLE IF NOT EXISTS ops (
    op_id TEXT PRIMARY KEY,
    entity_local_id TEXT,
    op_type TEXT,
    payload TEXT,
    created_at INTEGER,
    retries INTEGER DEFAULT 0
  );`);
}

export async function upsertEntity(localId, dataverseId, entityType, payloadObj) {
  const now = Math.floor(Date.now() / 1000);
  const payload = JSON.stringify(payloadObj);
  await executeSqlAsync(
    `INSERT OR REPLACE INTO entities (local_id, dataverse_id, entity_type, payload, updated_at, pending, deleted) VALUES (?,?,?,?,?,1,0);`,
    [localId, dataverseId || null, entityType, payload, now]
  );
}

export async function getEntities(limit = 100) {
  const res = await executeSqlAsync(`SELECT * FROM entities LIMIT ?;`, [limit]);
  const rows = res.rows._array || [];
  return rows.map(r => ({ ...r, payload: JSON.parse(r.payload) }));
}

export async function addOp(opId, entityLocalId, opType, payloadObj) {
  const now = Math.floor(Date.now() / 1000);
  const payload = JSON.stringify(payloadObj || {});
  await executeSqlAsync(`INSERT OR REPLACE INTO ops (op_id, entity_local_id, op_type, payload, created_at, retries) VALUES (?,?,?,?,?,0);`, [opId, entityLocalId, opType, payload, now]);
}

export async function getPendingOps(limit = 100) {
  const res = await executeSqlAsync(`SELECT * FROM ops ORDER BY created_at ASC LIMIT ?;`, [limit]);
  return res.rows._array || [];
}

export async function markOpDone(opId) {
  await executeSqlAsync(`DELETE FROM ops WHERE op_id = ?;`, [opId]);
}

export async function deleteEntity(localId) {
  await executeSqlAsync(`UPDATE entities SET deleted=1, pending=1 WHERE local_id = ?;`, [localId]);
}

export async function clearAll() {
  await executeSqlAsync(`DELETE FROM entities;`);
  await executeSqlAsync(`DELETE FROM ops;`);
  await executeSqlAsync(`DELETE FROM attachments;`);
}

export async function getEntityByLocalId(localId) {
  const res = await executeSqlAsync(`SELECT * FROM entities WHERE local_id = ? LIMIT 1;`, [localId]);
  const rows = res.rows._array || [];
  if (rows.length === 0) return null;
  const r = rows[0];
  return { ...r, payload: r.payload ? JSON.parse(r.payload) : null };
}

export default {
  initSchema,
  upsertEntity,
  getEntities,
  getEntityByLocalId,
  addOp,
  getPendingOps,
  markOpDone,
  deleteEntity,
  clearAll,
};
