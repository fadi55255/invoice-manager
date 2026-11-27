import { query } from '../../config/pool.js';

export async function logActivity({
  entityType,
  entityId,
  action,
  actor,
  metadata = {},
}) {
  try {
    await query(
      `INSERT INTO activity_logs (entity_type, entity_id, action, actor_id, actor_email, actor_role, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
      [
        entityType,
        entityId,
        action,
        actor?.id ?? null,
        actor?.email ?? null,
        actor?.role ?? null,
        JSON.stringify(metadata),
      ]
    );
  } catch (err) {
    console.warn('Activity log write skipped:', err?.message || err);
  }
}
