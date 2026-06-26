import { query } from '../db';

export type AssignmentStatus = 'pending' | 'accepted' | 'rejected';

export interface TaskAssignment {
  id: string;
  task_id: string;
  manager_id: string;
  worker_id: string;
  status: AssignmentStatus;
  assigned_at: Date;
  responded_at: Date | null;
}

export interface DetailedAssignment extends TaskAssignment {
  task_title: string;
  task_description: string;
  task_status: string;
  task_priority: string | null;
  business_name: string;
  logo_url: string | null;
  manager_name: string;
  worker_name: string;
}

export async function createAssignment(
  taskId: string,
  managerId: string,
  workerId: string
): Promise<TaskAssignment> {
  const sql = `
    INSERT INTO task_assignments (id, task_id, manager_id, worker_id, status, assigned_at, responded_at)
    VALUES (gen_random_uuid(), $1, $2, $3, 'pending', NOW(), NULL)
    RETURNING *
  `;
  const rows = await query<TaskAssignment>(sql, [taskId, managerId, workerId]);
  return rows[0];
}

export async function getAssignmentById(id: string): Promise<TaskAssignment | null> {
  const sql = 'SELECT * FROM task_assignments WHERE id = $1 LIMIT 1';
  const rows = await query<TaskAssignment>(sql, [id]);
  return rows.length > 0 ? rows[0] : null;
}

export async function getDetailedAssignmentById(id: string): Promise<DetailedAssignment | null> {
  const sql = `
    SELECT 
      ta.*,
      t.title as task_title,
      t.description as task_description,
      t.status as task_status,
      t.priority as task_priority,
      b.business_name,
      b.logo_url,
      u_m.fullname as manager_name,
      u_w.fullname as worker_name
    FROM task_assignments ta
    JOIN tasks t ON ta.task_id = t.id
    JOIN businesses b ON t.business_id = b.id
    JOIN users u_m ON ta.manager_id = u_m.id
    JOIN users u_w ON ta.worker_id = u_w.id
    WHERE ta.id = $1
    LIMIT 1
  `;
  const rows = await query<DetailedAssignment>(sql, [id]);
  return rows.length > 0 ? rows[0] : null;
}

export async function getAssignmentsByWorker(workerId: string): Promise<DetailedAssignment[]> {
  const sql = `
    SELECT 
      ta.*,
      t.title as task_title,
      t.description as task_description,
      t.status as task_status,
      t.priority as task_priority,
      b.business_name,
      b.logo_url,
      u_m.fullname as manager_name,
      u_w.fullname as worker_name
    FROM task_assignments ta
    JOIN tasks t ON ta.task_id = t.id
    JOIN businesses b ON t.business_id = b.id
    JOIN users u_m ON ta.manager_id = u_m.id
    JOIN users u_w ON ta.worker_id = u_w.id
    WHERE ta.worker_id = $1
    ORDER BY ta.assigned_at DESC
  `;
  return query<DetailedAssignment>(sql, [workerId]);
}

export async function getAssignmentsByTask(taskId: string): Promise<DetailedAssignment[]> {
  const sql = `
    SELECT 
      ta.*,
      t.title as task_title,
      t.description as task_description,
      t.status as task_status,
      t.priority as task_priority,
      b.business_name,
      b.logo_url,
      u_m.fullname as manager_name,
      u_w.fullname as worker_name
    FROM task_assignments ta
    JOIN tasks t ON ta.task_id = t.id
    JOIN businesses b ON t.business_id = b.id
    JOIN users u_m ON ta.manager_id = u_m.id
    JOIN users u_w ON ta.worker_id = u_w.id
    WHERE ta.task_id = $1
    ORDER BY ta.assigned_at DESC
  `;
  return query<DetailedAssignment>(sql, [taskId]);
}

export async function updateAssignmentStatus(
  assignmentId: string,
  status: AssignmentStatus
): Promise<TaskAssignment> {
  const sql = `
    UPDATE task_assignments
    SET status = $2, responded_at = NOW()
    WHERE id = $1
    RETURNING *
  `;
  const rows = await query<TaskAssignment>(sql, [assignmentId, status]);
  if (rows.length === 0) {
    throw new Error(`Assignment with id ${assignmentId} not found`);
  }
  return rows[0];
}

export async function getActiveAssignmentForTask(taskId: string): Promise<TaskAssignment | null> {
  const sql = `
    SELECT * FROM task_assignments 
    WHERE task_id = $1 AND status = 'accepted'
    LIMIT 1
  `;
  const rows = await query<TaskAssignment>(sql, [taskId]);
  return rows.length > 0 ? rows[0] : null;
}
