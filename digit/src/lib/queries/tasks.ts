import { query } from '../db';

export type TaskStatus = 'pending' | 'assigned' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

export interface Task {
  id: string;
  business_id: string;
  manager_id: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  priority: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface TaskImage {
  id: string;
  task_id: string;
  image_url: string;
  created_at: Date;
}

export interface DetailedTask extends Task {
  business_name: string;
  logo_url: string | null;
}

export async function createTask(
  businessId: string,
  title: string,
  description: string,
  priority: string | null
): Promise<Task> {
  const sql = `
    INSERT INTO tasks (id, business_id, manager_id, title, description, status, priority, created_at, updated_at)
    VALUES (gen_random_uuid(), $1, NULL, $2, $3, 'pending', $4, NOW(), NOW())
    RETURNING *
  `;
  const rows = await query<Task>(sql, [businessId, title.trim(), description.trim(), priority]);
  return rows[0];
}

export async function createTaskImage(taskId: string, imageUrl: string): Promise<TaskImage> {
  const sql = `
    INSERT INTO task_images (id, task_id, image_url, created_at)
    VALUES (gen_random_uuid(), $1, $2, NOW())
    RETURNING *
  `;
  const rows = await query<TaskImage>(sql, [taskId, imageUrl.trim()]);
  return rows[0];
}

export async function getTaskById(id: string): Promise<DetailedTask | null> {
  const sql = `
    SELECT t.*, b.business_name, b.logo_url
    FROM tasks t
    JOIN businesses b ON t.business_id = b.id
    WHERE t.id = $1
    LIMIT 1
  `;
  const rows = await query<DetailedTask>(sql, [id]);
  return rows.length > 0 ? rows[0] : null;
}

export async function getPendingTasks(): Promise<DetailedTask[]> {
  const sql = `
    SELECT t.*, b.business_name, b.logo_url
    FROM tasks t
    JOIN businesses b ON t.business_id = b.id
    WHERE t.status = 'pending'
    ORDER BY t.created_at DESC
  `;
  return query<DetailedTask>(sql);
}

export async function getTasksByBusiness(businessId: string): Promise<DetailedTask[]> {
  const sql = `
    SELECT t.*, b.business_name, b.logo_url
    FROM tasks t
    JOIN businesses b ON t.business_id = b.id
    WHERE t.business_id = $1
    ORDER BY t.created_at DESC
  `;
  return query<DetailedTask>(sql, [businessId]);
}

export async function getTasksByManager(managerId: string): Promise<DetailedTask[]> {
  const sql = `
    SELECT t.*, b.business_name, b.logo_url
    FROM tasks t
    JOIN businesses b ON t.business_id = b.id
    WHERE t.manager_id = $1
    ORDER BY t.created_at DESC
  `;
  return query<DetailedTask>(sql, [managerId]);
}

export async function getAllDetailedTasks(): Promise<DetailedTask[]> {
  const sql = `
    SELECT t.*, b.business_name, b.logo_url
    FROM tasks t
    JOIN businesses b ON t.business_id = b.id
    ORDER BY t.created_at DESC
  `;
  return query<DetailedTask>(sql);
}

export async function getTaskImages(taskId: string): Promise<TaskImage[]> {
  const sql = `
    SELECT * FROM task_images
    WHERE task_id = $1
    ORDER BY created_at ASC
  `;
  return query<TaskImage>(sql, [taskId]);
}

export async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<Task> {
  const sql = `
    UPDATE tasks
    SET status = $2, updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `;
  const rows = await query<Task>(sql, [taskId, status]);
  if (rows.length === 0) {
    throw new Error(`Task with id ${taskId} not found`);
  }
  return rows[0];
}

export async function updateTaskManager(
  taskId: string,
  managerId: string | null,
  status: TaskStatus
): Promise<Task> {
  const sql = `
    UPDATE tasks
    SET manager_id = $2, status = $3, updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `;
  const rows = await query<Task>(sql, [taskId, managerId, status]);
  if (rows.length === 0) {
    throw new Error(`Task with id ${taskId} not found`);
  }
  return rows[0];
}
