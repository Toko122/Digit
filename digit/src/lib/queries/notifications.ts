import { query } from '../db';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  is_read: boolean | null;
  created_at: Date;
}

export async function createNotification(
  userId: string,
  title: string,
  body: string | null = null
): Promise<Notification> {
  const sql = `
    INSERT INTO notifications (id, user_id, title, body, is_read, created_at)
    VALUES (gen_random_uuid(), $1, $2, $3, false, NOW())
    RETURNING *
  `;
  const rows = await query<Notification>(sql, [userId, title.trim(), body]);
  return rows[0];
}

export async function getNotificationsByUser(userId: string): Promise<Notification[]> {
  const sql = `
    SELECT * FROM notifications
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT 50
  `;
  return query<Notification>(sql, [userId]);
}

export async function markNotificationAsRead(notificationId: string): Promise<Notification> {
  const sql = `
    UPDATE notifications
    SET is_read = true
    WHERE id = $1
    RETURNING *
  `;
  const rows = await query<Notification>(sql, [notificationId]);
  if (rows.length === 0) {
    throw new Error(`Notification with id ${notificationId} not found`);
  }
  return rows[0];
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const sql = `
    UPDATE notifications
    SET is_read = true
    WHERE user_id = $1
  `;
  await query(sql, [userId]);
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const sql = `
    SELECT COUNT(*)::integer as count 
    FROM notifications
    WHERE user_id = $1 AND is_read = false
  `;
  const rows = await query<{ count: number }>(sql, [userId]);
  return rows.length > 0 ? rows[0].count : 0;
}
