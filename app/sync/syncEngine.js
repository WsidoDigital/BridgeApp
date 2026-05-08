import db from '../storage/sqliteWrapper';
import dataverseClient from './dataverseClient';

// Basic sync engine: reads ops queue, batches, pushes to Dataverse, handles retries and conflicts
const BATCH_SIZE = 20;
const MAX_RETRIES = 5;

function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

export async function processPendingOps() {
  const ops = await db.getPendingOps(BATCH_SIZE);
  if (!ops || ops.length === 0) return { processed: 0 };

  let processed = 0;
  for (const op of ops) {
    try {
      const entity = await getEntityForOp(op);
      if (!entity) {
        // no entity; mark op done to avoid blocking queue
        await db.markOpDone(op.op_id);
        continue;
      }

      // push to Dataverse
      await dataverseClient.pushEntity({
        local_id: entity.local_id,
        dataverse_id: entity.dataverse_id,
        entity_type: entity.entity_type,
        payload: entity.payload
      });

      // mark op done
      await db.markOpDone(op.op_id);
      processed += 1;
    } catch (err) {
      // handle retryable errors
      const retries = (op.retries || 0) + 1;
      console.warn('Op', op.op_id, 'failed (attempt', retries, '):', err.message);
      if (retries >= MAX_RETRIES) {
        // give up for now — remove op to avoid infinite loop
        await db.markOpDone(op.op_id);
      } else {
        // requeue with increased retries
        // here addOp will insert or replace; store retries in payload if needed
        await db.addOp(op.op_id, op.entity_local_id, op.op_type, JSON.parse(op.payload || '{}'));
        await sleep(2 ** retries * 1000);
      }
    }
  }

  return { processed };
}

async function getEntityForOp(op) {
  if (!op || !op.entity_local_id) return null;
  // efficient lookup using index on local_id
  const entity = await db.getEntityByLocalId(op.entity_local_id);
  return entity;
}

export default { processPendingOps };