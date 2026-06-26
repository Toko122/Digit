import * as notificationQueries from '../queries/notifications';

export async function createNotification(userId: string, title: string, body: string | null = null) {
  return notificationQueries.createNotification(userId, title, body);
}

export async function getNotifications(userId: string) {
  return notificationQueries.getNotificationsByUser(userId);
}

export async function markAsRead(notificationId: string) {
  return notificationQueries.markNotificationAsRead(notificationId);
}

export async function markAllAsRead(userId: string) {
  return notificationQueries.markAllNotificationsAsRead(userId);
}

export async function getUnreadCount(userId: string): Promise<number> {
  return notificationQueries.getUnreadNotificationCount(userId);
}
