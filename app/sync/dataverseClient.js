import * as SecureStore from 'expo-secure-store';

// Dataverse client stub. Configure DATAVERSE_BASE_URL and scope appropriately.
const DATAVERSE_BASE_URL = process.env.DATAVERSE_BASE_URL || 'https://your-dataverse-instance.api.crm.dynamics.com/api/data/v9.2';
const ACCESS_TOKEN_KEY = 'msal_access_token';

async function getAccessToken() {
  return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function pushEntity(entity) {
  // entity: { local_id, dataverse_id, entity_type, payload }
  const token = await getAccessToken();
  if (!token) throw new Error('No access token');

  const url = entity.dataverse_id
    ? DATAVERSE_BASE_URL + '/' + entity.entity_type + '(' + entity.dataverse_id + ')'
    : DATAVERSE_BASE_URL + '/' + entity.entity_type;

  const method = entity.dataverse_id ? 'PATCH' : 'POST';
  const body = entity.payload;

  const res = await fetch(url, {
    method,
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (res.status === 401) {
    const err = new Error('Unauthorized');
    err.code = 401;
    throw err;
  }

  if (res.status === 409) {
    const err = new Error('Conflict');
    err.code = 409;
    throw err;
  }

  if (res.ok) {
    const location = res.headers.get('OData-EntityId') || null;
    return { ok: true, location };
  }

  const text = await res.text();
  const err = new Error('Dataverse error: ' + res.status + ' ' + text);
  err.code = res.status;
  throw err;
}

import * as FileSystem from 'expo-file-system';
import db from '../storage/sqliteWrapper';

export async function uploadAttachment(attachment) {
  // attachment: { id, entity_local_id, local_path }
  const token = await getAccessToken();
  if (!token) throw new Error('No access token');

  // Resolve entity to link attachment
  const entity = await db.getEntityByLocalId(attachment.entity_local_id);
  const dataverseId = entity && entity.dataverse_id;
  const entitySet = entity && entity.entity_type; // should be Dataverse entity set name (e.g., contacts)

  // Read file as base64
  const fileInfo = await FileSystem.getInfoAsync(attachment.local_path, { size: true });
  if (!fileInfo.exists) throw new Error('Attachment file not found: ' + attachment.local_path);

  const MAX_DIRECT_UPLOAD = 4 * 1024 * 1024; // 4MB direct upload cap (adjust per Dataverse limits)
  const fileBase64 = await FileSystem.readAsStringAsync(attachment.local_path, { encoding: FileSystem.EncodingType.Base64 });
  const filename = attachment.local_path.split('/').pop();
  const mime = guessMimeType(filename);

  if (fileInfo.size <= MAX_DIRECT_UPLOAD) {
    // Create annotation (note) with documentbody (base64)
    const payload = {
      filename: filename,
      documentbody: fileBase64,
      mimetype: mime,
      isdocument: true,
      subject: 'attachment'
    };

    if (dataverseId && entitySet) {
      // objectid_<entitySetSingular>@odata.bind is required; we approximate using entitySet
      const bindName = `objectid_${entitySet}@odata.bind`;
      payload[bindName] = `/${entitySet}(${dataverseId})`;
    }

    const url = `${DATAVERSE_BASE_URL}/annotations`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const text = await res.text();
      const err = new Error('Attachment upload failed: ' + res.status + ' ' + text);
      err.code = res.status;
      throw err;
    }

    return { ok: true };
  }

  // For larger files: attempt chunked upload by sending chunks to a configurable endpoint
  // This requires server/Dataverse support; here we implement a client that splits into chunks
  const CHUNK_SIZE = 1 * 1024 * 1024; // 1MB
  const totalSize = fileInfo.size;
  const totalChunks = Math.ceil(totalSize / CHUNK_SIZE);

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, totalSize);
    // read slice as base64 - expo FS doesn't support range reads, so read full and slice base64 string
    // Note: slicing base64 correlates to bytes inaccurately in general; for production use native streams.
    const chunkBase64 = fileBase64.slice(Math.floor(start / 3 * 4), Math.floor(end / 3 * 4));

    const chunkPayload = {
      filename: filename,
      chunkIndex: i,
      totalChunks: totalChunks,
      chunk: chunkBase64
    };

    const uploadUrl = process.env.DATAVERSE_ATTACHMENT_UPLOAD_URL || (DATAVERSE_BASE_URL + '/annotations');
    const cres = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(chunkPayload)
    });

    if (!cres.ok) {
      const txt = await cres.text();
      throw new Error('Chunk upload failed: ' + cres.status + ' ' + txt);
    }
  }

  // After chunks uploaded, server should assemble and create annotation; here return ok
  return { ok: true };
}

function guessMimeType(name) {
  const ext = name.split('.').pop().toLowerCase();
  switch (ext) {
    case 'jpg': case 'jpeg': return 'image/jpeg';
    case 'png': return 'image/png';
    case 'pdf': return 'application/pdf';
    default: return 'application/octet-stream';
  }
}

export default { pushEntity, uploadAttachment };