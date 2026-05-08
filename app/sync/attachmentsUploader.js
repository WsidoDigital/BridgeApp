import db from '../storage/sqliteWrapper';
import dataverseClient from './dataverseClient';

// Attachments uploader: uploads pending attachments and marks them as uploaded.

export async function processPendingAttachments(limit = 10) {
  const atts = await db.getPendingAttachments(limit);
  if (!atts || atts.length === 0) return { processed: 0 };

  let processed = 0;
  for (const a of atts) {
    try {
      // dataverseClient.uploadAttachment should implement actual upload; here we call the stub.
      const res = await dataverseClient.uploadAttachment(a);
      if (res && res.ok) {
        await db.markAttachmentUploaded(a.id);
        processed += 1;
      } else {
        console.warn('Attachment upload failed for', a.id);
      }
    } catch (err) {
      console.warn('Attachment upload error for', a.id, err.message);
    }
  }

  return { processed };
}

export default { processPendingAttachments };