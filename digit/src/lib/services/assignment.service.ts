import * as assignmentQueries from '../queries/assignments';
import * as taskQueries from '../queries/tasks';
import * as userQueries from '../queries/users';
import * as notificationService from './notification.service';

export async function assignWorker(taskId: string, managerId: string, workerId: string) {
  // 1. Fetch task details
  const task = await taskQueries.getTaskById(taskId);
  if (!task) {
    throw new Error('დავალება ვერ მოიძებნა');
  }

  // 2. Create the assignment
  const assignment = await assignmentQueries.createAssignment(taskId, managerId, workerId);

  // 3. Notify the worker
  try {
    await notificationService.createNotification(
      workerId,
      'ახალი შემოთავაზება',
      `მენეჯერმა გამოგიგზავნათ ახალი დავალება: "${task.title}"`
    );
  } catch (err) {
    console.error('Failed to notify worker on assignment:', err);
  }

  return assignment;
}

export async function respondToAssignment(
  assignmentId: string,
  workerId: string,
  status: 'accepted' | 'rejected'
) {
  // 1. Fetch assignment details
  const assignment = await assignmentQueries.getAssignmentById(assignmentId);
  if (!assignment) {
    throw new Error('შემოთავაზება ვერ მოიძებნა');
  }

  if (assignment.worker_id !== workerId) {
    throw new Error('თქვენ არ გაქვთ წვდომა ამ შემოთავაზებაზე');
  }

  if (assignment.status !== 'pending') {
    throw new Error('ამ შემოთავაზებაზე პასუხი უკვე გაცემულია');
  }

  // 2. Update assignment status
  const updatedAssignment = await assignmentQueries.updateAssignmentStatus(assignmentId, status);

  // 3. Get task and worker details for notifications
  const task = await taskQueries.getTaskById(assignment.task_id);
  const worker = await userQueries.getUserById(workerId);
  const workerName = worker ? worker.fullname : 'მუშა';

  if (!task) {
    throw new Error('დავალება ვერ მოიძებნა');
  }

  if (status === 'accepted') {
    // Update task status to in_progress
    await taskQueries.updateTaskStatus(task.id, 'in_progress');

    // Notify manager
    try {
      await notificationService.createNotification(
        assignment.manager_id,
        'შემოთავაზება მიღებულია',
        `მუშამ (${workerName}) მიიღო დავალება და დაიწყო მუშაობა: "${task.title}"`
      );
    } catch (err) {
      console.error('Failed to notify manager on assignment acceptance:', err);
    }
  } else {
    // Notify manager of rejection
    try {
      await notificationService.createNotification(
        assignment.manager_id,
        'შემოთავაზება უარყოფილია',
        `მუშამ (${workerName}) უარყო დავალება: "${task.title}"`
      );
    } catch (err) {
      console.error('Failed to notify manager on assignment rejection:', err);
    }
  }

  return updatedAssignment;
}

export async function completeTask(taskId: string, userId: string, userRole: string) {
  const task = await taskQueries.getTaskById(taskId);
  if (!task) {
    throw new Error('დავალება ვერ მოიძებნა');
  }

  if (task.status === 'completed') {
    throw new Error('დავალება უკვე დასრულებულია');
  }

  // If worker is completing, verify they have an accepted assignment
  if (userRole === 'worker') {
    const activeAssignment = await assignmentQueries.getActiveAssignmentForTask(taskId);
    if (!activeAssignment || activeAssignment.worker_id !== userId) {
      throw new Error('თქვენ არ გაქვთ ამ დავალების დასრულების უფლება');
    }
  } else if (userRole === 'manager') {
    if (task.manager_id !== userId) {
      throw new Error('თქვენ არ ხართ ამ დავალების მენეჯერი');
    }
  } else if (userRole !== 'admin') {
    throw new Error('ამ მოქმედების შესრულების უფლება არ გაქვთ');
  }

  // Update task status to completed
  const updatedTask = await taskQueries.updateTaskStatus(taskId, 'completed');

  // Fetch business details to notify business owner
  try {
    const business = await userQueries.getBusinessById(task.business_id);
    if (business) {
      await notificationService.createNotification(
        business.user_id,
        'დავალება დასრულებულია',
        `თქვენი დავალება "${task.title}" წარმატებით დასრულდა.`
      );
    }
  } catch (err) {
    console.error('Failed to notify business on task completion:', err);
  }

  // Notify manager if completed by worker
  if (userRole === 'worker' && task.manager_id) {
    try {
      const worker = await userQueries.getUserById(userId);
      const workerName = worker ? worker.fullname : 'მუშა';
      await notificationService.createNotification(
        task.manager_id,
        'დავალება დასრულდა მუშის მიერ',
        `მუშამ (${workerName}) დაასრულა დავალება: "${task.title}"`
      );
    } catch (err) {
      console.error('Failed to notify manager on task completion:', err);
    }
  }

  // Notify worker if completed by manager/admin
  if ((userRole === 'manager' || userRole === 'admin')) {
    try {
      const activeAssignment = await assignmentQueries.getActiveAssignmentForTask(taskId);
      if (activeAssignment) {
        await notificationService.createNotification(
          activeAssignment.worker_id,
          'დავალება დასრულებულია',
          `მენეჯერმა დაასრულა დავალება: "${task.title}"`
        );
      }
    } catch (err) {
      console.error('Failed to notify worker on task completion:', err);
    }
  }

  return updatedTask;
}
