import * as taskQueries from '../queries/tasks';
import * as userQueries from '../queries/users';
import * as notificationService from './notification.service';

export async function postTask(
  businessId: string,
  title: string,
  description: string,
  priority: string | null,
  imageUrls: string[]
) {
  // 1. Create the task
  const task = await taskQueries.createTask(businessId, title, description, priority);

  // 2. Add images if any
  if (imageUrls && imageUrls.length > 0) {
    for (const url of imageUrls) {
      await taskQueries.createTaskImage(task.id, url);
    }
  }

  // 3. Notify all active managers
  try {
    const managers = await userQueries.getActiveManagers();
    for (const manager of managers) {
      await notificationService.createNotification(
        manager.id,
        'ახალი დავალება',
        `დაემატა ახალი დავალება: "${title}"`
      );
    }
  } catch (err) {
    console.error('Failed to send manager notifications for task creation:', err);
  }

  return task;
}

export async function acceptTask(taskId: string, managerId: string) {
  // 1. Fetch task details
  const task = await taskQueries.getTaskById(taskId);
  if (!task) {
    throw new Error('დავალება ვერ მოიძებნა');
  }

  if (task.status !== 'pending') {
    throw new Error('ეს დავალება უკვე მიღებულია სხვა მენეჯერის მიერ ან დასრულებულია');
  }

  // 2. Update task manager and status
  const updatedTask = await taskQueries.updateTaskManager(taskId, managerId, 'assigned');

  // 3. Notify the business owner
  try {
    const business = await userQueries.getBusinessById(task.business_id);
    if (business) {
      const managerUser = await userQueries.getUserById(managerId);
      const managerName = managerUser ? managerUser.fullname : 'მენეჯერი';
      await notificationService.createNotification(
        business.user_id,
        'დავალება მიღებულია',
        `მენეჯერმა (${managerName}) მიიღო თქვენი დავალება: "${task.title}"`
      );
    }
  } catch (err) {
    console.error('Failed to notify business owner on task acceptance:', err);
  }

  return updatedTask;
}

export async function rejectTask(_taskId: string, _managerId: string) {
  // If rejected: task remains visible to other managers.
  // We don't alter the task state in DB (it stays pending and unassigned).
  return { success: true, message: 'დავალება უარყოფილია' };
}

export async function getDetailedTask(taskId: string) {
  const task = await taskQueries.getTaskById(taskId);
  if (!task) return null;
  const images = await taskQueries.getTaskImages(taskId);
  return {
    ...task,
    images: images.map(img => img.image_url)
  };
}
