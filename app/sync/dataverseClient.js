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

export async function uploadAttachment(attachment) {
  // attachment: { id, entity_local_id, local_path }
  // Stub implementation: in production, read the file and upload to Dataverse or blob storage.
  // For now, simulate success.
  return { ok: true, location: null };
}

export default { pushEntity, uploadAttachment };