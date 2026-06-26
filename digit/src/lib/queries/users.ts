import { query } from '../db';

export type UserRole = 'admin' | 'business' | 'manager' | 'worker';

export interface User {
  id: string;
  fullname: string;
  email: string;
  password_hash: string;
  phone: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Business {
  id: string;
  user_id: string;
  business_name: string;
  address: string | null;
  description: string | null;
  logo_url: string | null;
  created_at: Date;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const sql = 'SELECT * FROM users WHERE email = $1 LIMIT 1';
  const rows = await query<User>(sql, [email.toLowerCase().trim()]);
  return rows.length > 0 ? rows[0] : null;
}

export async function getUserById(id: string): Promise<User | null> {
  const sql = 'SELECT * FROM users WHERE id = $1 LIMIT 1';
  const rows = await query<User>(sql, [id]);
  return rows.length > 0 ? rows[0] : null;
}

export async function createUser(
  fullname: string,
  email: string,
  passwordHash: string,
  phone: string | null,
  role: UserRole
): Promise<User> {
  const sql = `
    INSERT INTO users (id, fullname, email, password_hash, phone, role, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, true, NOW(), NOW())
    RETURNING *
  `;
  const rows = await query<User>(sql, [
    fullname.trim(),
    email.toLowerCase().trim(),
    passwordHash,
    phone ? phone.trim() : null,
    role
  ]);
  return rows[0];
}

export async function createBusiness(
  userId: string,
  businessName: string,
  address: string | null = null,
  description: string | null = null,
  logoUrl: string | null = null
): Promise<Business> {
  const sql = `
    INSERT INTO businesses (id, user_id, business_name, address, description, logo_url, created_at)
    VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW())
    RETURNING *
  `;
  const rows = await query<Business>(sql, [
    userId,
    businessName.trim(),
    address,
    description,
    logoUrl
  ]);
  return rows[0];
}

export async function getBusinessByUserId(userId: string): Promise<Business | null> {
  const sql = 'SELECT * FROM businesses WHERE user_id = $1 LIMIT 1';
  const rows = await query<Business>(sql, [userId]);
  return rows.length > 0 ? rows[0] : null;
}

export async function getBusinessById(businessId: string): Promise<Business | null> {
  const sql = 'SELECT * FROM businesses WHERE id = $1 LIMIT 1';
  const rows = await query<Business>(sql, [businessId]);
  return rows.length > 0 ? rows[0] : null;
}

export async function getAllUsers(): Promise<User[]> {
  const sql = 'SELECT * FROM users ORDER BY created_at DESC';
  return query<User>(sql);
}

export async function getActiveManagers(): Promise<User[]> {
  const sql = "SELECT * FROM users WHERE role = 'manager' AND is_active = true";
  return query<User>(sql);
}

export async function getAllWorkers(): Promise<User[]> {
  const sql = "SELECT * FROM users WHERE role = 'worker' AND is_active = true ORDER BY fullname ASC";
  return query<User>(sql);
}

export async function updateUserStatus(id: string, isActive: boolean): Promise<User> {
  const sql = `
    UPDATE users 
    SET is_active = $2, updated_at = NOW() 
    WHERE id = $1 
    RETURNING *
  `;
  const rows = await query<User>(sql, [id, isActive]);
  if (rows.length === 0) {
    throw new Error(`User with id ${id} not found`);
  }
  return rows[0];
}

export async function updateUserRole(id: string, role: UserRole): Promise<User> {
  const sql = `
    UPDATE users 
    SET role = $2, updated_at = NOW() 
    WHERE id = $1 
    RETURNING *
  `;
  const rows = await query<User>(sql, [id, role]);
  if (rows.length === 0) {
    throw new Error(`User with id ${id} not found`);
  }
  return rows[0];
}

