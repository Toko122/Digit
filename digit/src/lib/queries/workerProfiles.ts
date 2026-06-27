import { query } from '../db';
import { DetailedAssignment, getAssignmentsByWorker } from './assignments';

export interface WorkerProfile {
  id: string;
  user_id: string;
  fullname: string;
  email: string;
  phone: string | null;
  profile_photo_url: string | null;
  cover_image_url: string | null;
  headline: string | null;
  about_me: string | null;
  hourly_rate: number | null;
  currency: string;
  experience_level: string;
  availability: string;
  location: string | null;
  resume_url: string | null;
  years_of_experience: number;
  website_url: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  visibility: string;
  verification_status: string;
  rating: number;
  completed_jobs?: number;
  jobs_in_progress?: number;
  created_at: Date;
  updated_at: Date;
}

export interface WorkerExperience {
  id: string;
  worker_profile_id: string;
  title: string;
  company_name: string;
  location: string | null;
  start_date: Date;
  end_date: Date | null;
  is_current: boolean;
  description: string | null;
}

export interface WorkerEducation {
  id: string;
  worker_profile_id: string;
  institution: string;
  degree: string;
  field_of_study: string | null;
  start_date: Date;
  end_date: Date | null;
  description: string | null;
}

export interface Skill {
  id: string;
  name: string;
}

export interface PortfolioProject {
  id: string;
  worker_profile_id: string;
  title: string;
  description: string | null;
  github_url: string | null;
  live_url: string | null;
  completion_date: Date | null;
  images: string[];
}

export interface WorkerCertification {
  id: string;
  worker_profile_id: string;
  name: string;
  issuing_organization: string;
  issue_date: Date;
  expiration_date: Date | null;
  credential_id: string | null;
  credential_url: string | null;
}

export interface WorkerLanguage {
  id: string;
  worker_profile_id: string;
  language_name: string;
  proficiency_level: string;
}

export interface WorkerSocialLink {
  id: string;
  worker_profile_id: string;
  platform: string;
  url: string;
}

export interface WorkerRatingStats {
  averageRating: number;
  totalReviews: number;
  starCounts: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface WorkerReview {
  id: string;
  reviewer_id: string;
  reviewer_name: string;
  reviewer_role: string;
  worker_id: string;
  task_id: string;
  task_title: string;
  rating: number;
  review_text: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface FullWorkerProfile {
  profile: WorkerProfile;
  experiences: WorkerExperience[];
  educations: WorkerEducation[];
  skills: Skill[];
  portfolio: PortfolioProject[];
  certifications: WorkerCertification[];
  languages: WorkerLanguage[];
  socialLinks: WorkerSocialLink[];
  assignments: DetailedAssignment[];
  ratingStats: WorkerRatingStats;
}

// -------------------------------------------------------------
// CORE PROFILE QUERIES
// -------------------------------------------------------------

export async function getWorkerProfileByUserId(userId: string): Promise<WorkerProfile | null> {
  const sql = `
    SELECT 
      wp.*,
      u.fullname,
      u.email,
      u.phone,
      (
        SELECT COUNT(*)::int 
        FROM task_assignments ta 
        JOIN tasks t ON ta.task_id = t.id 
        WHERE ta.worker_id = u.id AND ta.status = 'accepted' AND t.status = 'completed'
      ) as completed_jobs,
      (
        SELECT COUNT(*)::int 
        FROM task_assignments ta 
        JOIN tasks t ON ta.task_id = t.id 
        WHERE ta.worker_id = u.id AND ta.status = 'accepted' AND t.status = 'in_progress'
      ) as jobs_in_progress
    FROM worker_profiles wp
    JOIN users u ON wp.user_id = u.id
    WHERE wp.user_id = $1
    LIMIT 1
  `;
  const rows = await query<WorkerProfile>(sql, [userId]);
  return rows.length > 0 ? rows[0] : null;
}

export async function getOrCreateWorkerProfile(userId: string): Promise<WorkerProfile> {
  const existing = await getWorkerProfileByUserId(userId);
  if (existing) return existing;

  // If not exists, insert a default blank profile
  const insertSql = `
    INSERT INTO worker_profiles (id, user_id, headline, hourly_rate, currency, experience_level, availability, visibility, verification_status)
    VALUES (gen_random_uuid(), $1, '', 0.00, 'GEL', 'Intermediate', 'available', 'public', 'unverified')
    RETURNING *
  `;
  await query(insertSql, [userId]);

  const freshProfile = await getWorkerProfileByUserId(userId);
  if (!freshProfile) {
    throw new Error("Failed to create worker profile");
  }
  return freshProfile;
}

export async function updateWorkerProfile(
  userId: string,
  fields: Partial<Omit<WorkerProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<WorkerProfile> {
  // Ensure profile exists
  const profile = await getOrCreateWorkerProfile(userId);

  const keys = Object.keys(fields) as Array<keyof typeof fields>;
  if (keys.length === 0) return profile;

  // Check if we need to update phone in the users table
  if ('phone' in fields) {
    const phoneVal = fields.phone !== undefined ? fields.phone : null;
    await query('UPDATE users SET phone = $2 WHERE id = $1', [userId, phoneVal]);
    delete fields.phone;
  }

  const setClauses: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  for (const key of Object.keys(fields)) {
    const val = (fields as Record<string, unknown>)[key];
    setClauses.push(`${key} = $${idx}`);
    values.push(val === undefined ? null : val);
    idx++;
  }

  values.push(profile.id);
  const sql = `
    UPDATE worker_profiles
    SET ${setClauses.join(', ')}, updated_at = NOW()
    WHERE id = $${idx}
    RETURNING *
  `;

  await query(sql, values);
  const updated = await getWorkerProfileByUserId(userId);
  if (!updated) throw new Error("Profile not found after update");
  return updated;
}

// -------------------------------------------------------------
// EXPERIENCE QUERIES
// -------------------------------------------------------------

export async function getExperiences(profileId: string): Promise<WorkerExperience[]> {
  const sql = `SELECT * FROM worker_experiences WHERE worker_profile_id = $1 ORDER BY start_date DESC`;
  return query<WorkerExperience>(sql, [profileId]);
}

export async function addExperience(
  profileId: string,
  exp: Omit<WorkerExperience, 'id' | 'worker_profile_id'>
): Promise<WorkerExperience> {
  const sql = `
    INSERT INTO worker_experiences (id, worker_profile_id, title, company_name, location, start_date, end_date, is_current, description)
    VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;
  const rows = await query<WorkerExperience>(sql, [
    profileId,
    exp.title.trim(),
    exp.company_name.trim(),
    exp.location ? exp.location.trim() : null,
    exp.start_date,
    exp.is_current ? null : exp.end_date,
    exp.is_current,
    exp.description ? exp.description.trim() : null
  ]);
  return rows[0];
}

export async function updateExperience(
  profileId: string,
  expId: string,
  exp: Partial<Omit<WorkerExperience, 'id' | 'worker_profile_id'>>
): Promise<WorkerExperience> {
  const fields = Object.keys(exp);
  const setClauses = fields.map((f, i) => `${f} = $${i + 3}`);
  const values = fields.map(f => (exp as Record<string, unknown>)[f]);

  const sql = `
    UPDATE worker_experiences
    SET ${setClauses.join(', ')}, updated_at = NOW()
    WHERE id = $1 AND worker_profile_id = $2
    RETURNING *
  `;
  const rows = await query<WorkerExperience>(sql, [expId, profileId, ...values]);
  if (rows.length === 0) throw new Error("Experience not found or unauthorized");
  return rows[0];
}

export async function deleteExperience(profileId: string, expId: string): Promise<void> {
  const sql = `DELETE FROM worker_experiences WHERE id = $1 AND worker_profile_id = $2`;
  await query(sql, [expId, profileId]);
}

// -------------------------------------------------------------
// EDUCATION QUERIES
// -------------------------------------------------------------

export async function getEducations(profileId: string): Promise<WorkerEducation[]> {
  const sql = `SELECT * FROM worker_educations WHERE worker_profile_id = $1 ORDER BY start_date DESC`;
  return query<WorkerEducation>(sql, [profileId]);
}

export async function addEducation(
  profileId: string,
  edu: Omit<WorkerEducation, 'id' | 'worker_profile_id'>
): Promise<WorkerEducation> {
  const sql = `
    INSERT INTO worker_educations (id, worker_profile_id, institution, degree, field_of_study, start_date, end_date, description)
    VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;
  const rows = await query<WorkerEducation>(sql, [
    profileId,
    edu.institution.trim(),
    edu.degree.trim(),
    edu.field_of_study ? edu.field_of_study.trim() : null,
    edu.start_date,
    edu.end_date,
    edu.description ? edu.description.trim() : null
  ]);
  return rows[0];
}

export async function updateEducation(
  profileId: string,
  eduId: string,
  edu: Partial<Omit<WorkerEducation, 'id' | 'worker_profile_id'>>
): Promise<WorkerEducation> {
  const fields = Object.keys(edu);
  const setClauses = fields.map((f, i) => `${f} = $${i + 3}`);
  const values = fields.map(f => (edu as Record<string, unknown>)[f]);

  const sql = `
    UPDATE worker_educations
    SET ${setClauses.join(', ')}, updated_at = NOW()
    WHERE id = $1 AND worker_profile_id = $2
    RETURNING *
  `;
  const rows = await query<WorkerEducation>(sql, [eduId, profileId, ...values]);
  if (rows.length === 0) throw new Error("Education not found or unauthorized");
  return rows[0];
}

export async function deleteEducation(profileId: string, eduId: string): Promise<void> {
  const sql = `DELETE FROM worker_educations WHERE id = $1 AND worker_profile_id = $2`;
  await query(sql, [eduId, profileId]);
}

// -------------------------------------------------------------
// SKILLS QUERIES
// -------------------------------------------------------------

export async function getSkills(profileId: string): Promise<Skill[]> {
  const sql = `
    SELECT s.* 
    FROM skills s
    JOIN worker_skills ws ON s.id = ws.skill_id
    WHERE ws.worker_profile_id = $1
    ORDER BY s.name ASC
  `;
  return query<Skill>(sql, [profileId]);
}

export async function addSkill(profileId: string, skillName: string): Promise<Skill> {
  const normalized = skillName.trim();
  
  // 1. Get or create skill in global table
  const selectSql = `SELECT * FROM skills WHERE LOWER(name) = LOWER($1) LIMIT 1`;
  const skillRows = await query<Skill>(selectSql, [normalized]);
  
  let skillId;
  if (skillRows.length > 0) {
    skillId = skillRows[0].id;
  } else {
    const insertSql = `INSERT INTO skills (id, name) VALUES (gen_random_uuid(), $1) RETURNING *`;
    const insertRows = await query<Skill>(insertSql, [normalized]);
    skillId = insertRows[0].id;
  }

  // 2. Link skill to worker profile (ignore duplicate link attempts)
  const linkSql = `
    INSERT INTO worker_skills (worker_profile_id, skill_id)
    VALUES ($1, $2)
    ON CONFLICT DO NOTHING
  `;
  await query(linkSql, [profileId, skillId]);

  return { id: skillId, name: normalized };
}

export async function removeSkill(profileId: string, skillId: string): Promise<void> {
  const sql = `DELETE FROM worker_skills WHERE worker_profile_id = $1 AND skill_id = $2`;
  await query(sql, [profileId, skillId]);
}

// -------------------------------------------------------------
// PORTFOLIO QUERIES
// -------------------------------------------------------------

export async function getPortfolio(profileId: string): Promise<PortfolioProject[]> {
  const projectsSql = `SELECT * FROM portfolio_projects WHERE worker_profile_id = $1 ORDER BY completion_date DESC, created_at DESC`;
  const projects = await query<PortfolioProject>(projectsSql, [profileId]);

  for (const proj of projects) {
    const imagesSql = `SELECT image_url FROM portfolio_images WHERE portfolio_project_id = $1 ORDER BY is_primary DESC, created_at ASC`;
    const imageRows = await query<{ image_url: string }>(imagesSql, [proj.id]);
    proj.images = imageRows.map(r => r.image_url);
  }

  return projects;
}

export async function addPortfolioProject(
  profileId: string,
  project: Omit<PortfolioProject, 'id' | 'worker_profile_id' | 'images'>,
  images: string[]
): Promise<PortfolioProject> {
  const sql = `
    INSERT INTO portfolio_projects (id, worker_profile_id, title, description, github_url, live_url, completion_date)
    VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  const rows = await query<PortfolioProject>(sql, [
    profileId,
    project.title.trim(),
    project.description ? project.description.trim() : null,
    project.github_url ? project.github_url.trim() : null,
    project.live_url ? project.live_url.trim() : null,
    project.completion_date
  ]);

  const newProj = rows[0];

  // Insert images
  if (images && images.length > 0) {
    for (let i = 0; i < images.length; i++) {
      const imgSql = `
        INSERT INTO portfolio_images (id, portfolio_project_id, image_url, is_primary)
        VALUES (gen_random_uuid(), $1, $2, $3)
      `;
      await query(imgSql, [newProj.id, images[i], i === 0]);
    }
  }

  newProj.images = images || [];
  return newProj;
}

export async function updatePortfolioProject(
  profileId: string,
  projectId: string,
  project: Partial<Omit<PortfolioProject, 'id' | 'worker_profile_id' | 'images'>>,
  images?: string[]
): Promise<PortfolioProject> {
  const fields = Object.keys(project);
  let updatedProj: PortfolioProject;

  if (fields.length > 0) {
    const setClauses = fields.map((f, i) => `${f} = $${i + 3}`);
    const values = fields.map(f => (project as Record<string, unknown>)[f]);

    const sql = `
      UPDATE portfolio_projects
      SET ${setClauses.join(', ')}, updated_at = NOW()
      WHERE id = $1 AND worker_profile_id = $2
      RETURNING *
    `;
    const rows = await query<PortfolioProject>(sql, [projectId, profileId, ...values]);
    if (rows.length === 0) throw new Error("Portfolio project not found or unauthorized");
    updatedProj = rows[0];
  } else {
    const selectSql = `SELECT * FROM portfolio_projects WHERE id = $1 AND worker_profile_id = $2 LIMIT 1`;
    const rows = await query<PortfolioProject>(selectSql, [projectId, profileId]);
    if (rows.length === 0) throw new Error("Portfolio project not found or unauthorized");
    updatedProj = rows[0];
  }

  // Update images if provided
  if (images !== undefined) {
    // Delete existing
    await query(`DELETE FROM portfolio_images WHERE portfolio_project_id = $1`, [projectId]);
    
    // Insert new
    for (let i = 0; i < images.length; i++) {
      const imgSql = `
        INSERT INTO portfolio_images (id, portfolio_project_id, image_url, is_primary)
        VALUES (gen_random_uuid(), $1, $2, $3)
      `;
      await query(imgSql, [projectId, images[i], i === 0]);
    }
    updatedProj.images = images;
  } else {
    const imagesSql = `SELECT image_url FROM portfolio_images WHERE portfolio_project_id = $1 ORDER BY is_primary DESC, created_at ASC`;
    const imageRows = await query<{ image_url: string }>(imagesSql, [projectId]);
    updatedProj.images = imageRows.map(r => r.image_url);
  }

  return updatedProj;
}

export async function deletePortfolioProject(profileId: string, projectId: string): Promise<void> {
  const sql = `DELETE FROM portfolio_projects WHERE id = $1 AND worker_profile_id = $2`;
  await query(sql, [projectId, profileId]);
}

// -------------------------------------------------------------
// CERTIFICATION QUERIES
// -------------------------------------------------------------

export async function getCertifications(profileId: string): Promise<WorkerCertification[]> {
  const sql = `SELECT * FROM worker_certifications WHERE worker_profile_id = $1 ORDER BY issue_date DESC`;
  return query<WorkerCertification>(sql, [profileId]);
}

export async function addCertification(
  profileId: string,
  cert: Omit<WorkerCertification, 'id' | 'worker_profile_id'>
): Promise<WorkerCertification> {
  const sql = `
    INSERT INTO worker_certifications (id, worker_profile_id, name, issuing_organization, issue_date, expiration_date, credential_id, credential_url)
    VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;
  const rows = await query<WorkerCertification>(sql, [
    profileId,
    cert.name.trim(),
    cert.issuing_organization.trim(),
    cert.issue_date,
    cert.expiration_date,
    cert.credential_id ? cert.credential_id.trim() : null,
    cert.credential_url ? cert.credential_url.trim() : null
  ]);
  return rows[0];
}

export async function updateCertification(
  profileId: string,
  certId: string,
  cert: Partial<Omit<WorkerCertification, 'id' | 'worker_profile_id'>>
): Promise<WorkerCertification> {
  const fields = Object.keys(cert);
  const setClauses = fields.map((f, i) => `${f} = $${i + 3}`);
  const values = fields.map(f => (cert as Record<string, unknown>)[f]);

  const sql = `
    UPDATE worker_certifications
    SET ${setClauses.join(', ')}, updated_at = NOW()
    WHERE id = $1 AND worker_profile_id = $2
    RETURNING *
  `;
  const rows = await query<WorkerCertification>(sql, [certId, profileId, ...values]);
  if (rows.length === 0) throw new Error("Certification not found or unauthorized");
  return rows[0];
}

export async function deleteCertification(profileId: string, certId: string): Promise<void> {
  const sql = `DELETE FROM worker_certifications WHERE id = $1 AND worker_profile_id = $2`;
  await query(sql, [certId, profileId]);
}

// -------------------------------------------------------------
// LANGUAGE QUERIES
// -------------------------------------------------------------

export async function getLanguages(profileId: string): Promise<WorkerLanguage[]> {
  const sql = `SELECT * FROM worker_languages WHERE worker_profile_id = $1 ORDER BY language_name ASC`;
  return query<WorkerLanguage>(sql, [profileId]);
}

export async function addLanguage(
  profileId: string,
  lang: Omit<WorkerLanguage, 'id' | 'worker_profile_id'>
): Promise<WorkerLanguage> {
  const sql = `
    INSERT INTO worker_languages (id, worker_profile_id, language_name, proficiency_level)
    VALUES (gen_random_uuid(), $1, $2, $3)
    ON CONFLICT (worker_profile_id, language_name) 
    DO UPDATE SET proficiency_level = EXCLUDED.proficiency_level, updated_at = NOW()
    RETURNING *
  `;
  const rows = await query<WorkerLanguage>(sql, [
    profileId,
    lang.language_name.trim(),
    lang.proficiency_level
  ]);
  return rows[0];
}

export async function deleteLanguage(profileId: string, langId: string): Promise<void> {
  const sql = `DELETE FROM worker_languages WHERE id = $1 AND worker_profile_id = $2`;
  await query(sql, [langId, profileId]);
}

// -------------------------------------------------------------
// SOCIAL LINK QUERIES
// -------------------------------------------------------------

export async function getSocialLinks(profileId: string): Promise<WorkerSocialLink[]> {
  const sql = `SELECT * FROM worker_social_links WHERE worker_profile_id = $1 ORDER BY platform ASC`;
  return query<WorkerSocialLink>(sql, [profileId]);
}

export async function upsertSocialLink(
  profileId: string,
  platform: string,
  url: string
): Promise<WorkerSocialLink | null> {
  const trimmedUrl = url ? url.trim() : '';
  
  if (trimmedUrl === '') {
    // If URL is empty, delete this platform link
    await query(`DELETE FROM worker_social_links WHERE worker_profile_id = $1 AND platform = $2`, [profileId, platform]);
    return null;
  }

  const sql = `
    INSERT INTO worker_social_links (id, worker_profile_id, platform, url)
    VALUES (gen_random_uuid(), $1, $2, $3)
    ON CONFLICT (worker_profile_id, platform)
    DO UPDATE SET url = EXCLUDED.url, updated_at = NOW()
    RETURNING *
  `;
  const rows = await query<WorkerSocialLink>(sql, [profileId, platform, trimmedUrl]);
  return rows[0];
}

// -------------------------------------------------------------
// COMBINED PROFILE QUERY
// -------------------------------------------------------------

export async function getFullWorkerProfile(userId: string): Promise<FullWorkerProfile> {
  const profile = await getOrCreateWorkerProfile(userId);

  const [
    experiences,
    educations,
    skills,
    portfolio,
    certifications,
    languages,
    socialLinks,
    assignments,
    ratingStats
  ] = await Promise.all([
    getExperiences(profile.id),
    getEducations(profile.id),
    getSkills(profile.id),
    getPortfolio(profile.id),
    getCertifications(profile.id),
    getLanguages(profile.id),
    getSocialLinks(profile.id),
    getAssignmentsByWorker(profile.user_id),
    getWorkerRatingStats(profile.user_id)
  ]);

  return {
    profile,
    experiences,
    educations,
    skills,
    portfolio,
    certifications,
    languages,
    socialLinks,
    assignments,
    ratingStats
  };
}

export interface SearchWorkersResult {
  workers: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function searchAndFilterWorkers(params: {
  search?: string;
  availability?: string;
  profession?: string;
  minExperience?: number;
  minRating?: number;
  city?: string;
  skills?: string[];
  languages?: string[];
  minHourlyRate?: number;
  maxHourlyRate?: number;
  minCompletedJobs?: number;
  sortBy?: 'newest' | 'highest_rated' | 'most_experienced' | 'recently_active';
  page?: number;
  limit?: number;
}): Promise<SearchWorkersResult> {
  const page = params.page && params.page > 0 ? params.page : 1;
  const limit = params.limit && params.limit > 0 ? params.limit : 10;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const values: any[] = [];
  let paramIdx = 1;

  // Search filter
  if (params.search && params.search.trim()) {
    const searchVal = `%${params.search.trim()}%`;
    conditions.push(`(
      u.fullname ILIKE $${paramIdx} OR 
      wp.headline ILIKE $${paramIdx} OR 
      wp.location ILIKE $${paramIdx} OR 
      EXISTS (
        SELECT 1 FROM worker_skills ws 
        JOIN skills s ON ws.skill_id = s.id 
        WHERE ws.worker_profile_id = wp.id AND s.name ILIKE $${paramIdx}
      ) OR
      EXISTS (
        SELECT 1 FROM worker_languages wl 
        WHERE wl.worker_profile_id = wp.id AND wl.language_name ILIKE $${paramIdx}
      )
    )`);
    values.push(searchVal);
    paramIdx++;
  }

  // Availability filter
  if (params.availability) {
    conditions.push(`wp.availability = $${paramIdx}`);
    values.push(params.availability);
    paramIdx++;
  }

  // Profession (headline) filter
  if (params.profession && params.profession.trim()) {
    conditions.push(`wp.headline ILIKE $${paramIdx}`);
    values.push(`%${params.profession.trim()}%`);
    paramIdx++;
  }

  // Experience level (years of experience) filter
  if (params.minExperience !== undefined && params.minExperience >= 0) {
    conditions.push(`wp.years_of_experience >= $${paramIdx}`);
    values.push(params.minExperience);
    paramIdx++;
  }

  // Rating filter
  if (params.minRating !== undefined && params.minRating >= 0) {
    conditions.push(`wp.rating >= $${paramIdx}`);
    values.push(params.minRating);
    paramIdx++;
  }

  // City filter
  if (params.city && params.city.trim()) {
    conditions.push(`wp.location ILIKE $${paramIdx}`);
    values.push(`%${params.city.trim()}%`);
    paramIdx++;
  }

  // Hourly rate filters
  if (params.minHourlyRate !== undefined && params.minHourlyRate >= 0) {
    conditions.push(`wp.hourly_rate >= $${paramIdx}`);
    values.push(params.minHourlyRate);
    paramIdx++;
  }
  if (params.maxHourlyRate !== undefined && params.maxHourlyRate >= 0) {
    conditions.push(`wp.hourly_rate <= $${paramIdx}`);
    values.push(params.maxHourlyRate);
    paramIdx++;
  }

  // Skills filter (match ALL selected skills)
  if (params.skills && params.skills.length > 0) {
    conditions.push(`(
      SELECT COUNT(DISTINCT s.name) 
      FROM worker_skills ws 
      JOIN skills s ON ws.skill_id = s.id 
      WHERE ws.worker_profile_id = wp.id AND s.name = ANY($${paramIdx})
    ) = $${paramIdx + 1}`);
    values.push(params.skills);
    values.push(params.skills.length);
    paramIdx += 2;
  }

  // Languages filter (match ALL selected languages)
  if (params.languages && params.languages.length > 0) {
    conditions.push(`(
      SELECT COUNT(DISTINCT wl.language_name) 
      FROM worker_languages wl 
      WHERE wl.worker_profile_id = wp.id AND wl.language_name = ANY($${paramIdx})
    ) = $${paramIdx + 1}`);
    values.push(params.languages);
    values.push(params.languages.length);
    paramIdx += 2;
  }

  // Completed jobs filter
  if (params.minCompletedJobs !== undefined && params.minCompletedJobs >= 0) {
    conditions.push(`(
      SELECT COUNT(*)::int 
      FROM task_assignments ta 
      JOIN tasks t ON ta.task_id = t.id 
      WHERE ta.worker_id = u.id AND ta.status = 'accepted' AND t.status = 'completed'
    ) >= $${paramIdx}`);
    values.push(params.minCompletedJobs);
    paramIdx++;
  }

  const whereClause = conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : '';

  // Count query
  const countSql = `
    SELECT COUNT(*)::int as total
    FROM worker_profiles wp
    JOIN users u ON wp.user_id = u.id
    WHERE u.role = 'worker' AND u.is_active = true ${whereClause}
  `;
  const countRows = await query<{ total: number }>(countSql, values);
  const total = countRows[0]?.total || 0;

  // Sorting
  let orderClause = 'ORDER BY u.fullname ASC';
  if (params.sortBy) {
    switch (params.sortBy) {
      case 'newest':
        orderClause = 'ORDER BY u.created_at DESC';
        break;
      case 'highest_rated':
        orderClause = 'ORDER BY wp.rating DESC';
        break;
      case 'most_experienced':
        orderClause = 'ORDER BY wp.years_of_experience DESC';
        break;
      case 'recently_active':
        orderClause = 'ORDER BY wp.updated_at DESC';
        break;
    }
  }

  // Data query
  const limitIdx = paramIdx;
  const offsetIdx = paramIdx + 1;
  const dataValues = [...values, limit, offset];

  const dataSql = `
    SELECT 
      wp.*,
      u.fullname,
      u.email,
      u.phone,
      u.created_at as user_created_at,
      (
        SELECT COALESCE(JSON_AGG(s.name), '[]'::json) 
        FROM worker_skills ws 
        JOIN skills s ON ws.skill_id = s.id 
        WHERE ws.worker_profile_id = wp.id
      ) as skills,
      (
        SELECT COALESCE(JSON_AGG(wl.language_name), '[]'::json)
        FROM worker_languages wl
        WHERE wl.worker_profile_id = wp.id
      ) as languages,
      (
        SELECT COUNT(*)::int 
        FROM task_assignments ta 
        JOIN tasks t ON ta.task_id = t.id 
        WHERE ta.worker_id = u.id AND ta.status = 'accepted' AND t.status = 'completed'
      ) as completed_jobs,
      (
        SELECT COUNT(*)::int 
        FROM task_assignments ta 
        JOIN tasks t ON ta.task_id = t.id 
        WHERE ta.worker_id = u.id AND ta.status = 'accepted' AND t.status = 'in_progress'
      ) as jobs_in_progress
    FROM worker_profiles wp
    JOIN users u ON wp.user_id = u.id
    WHERE u.role = 'worker' AND u.is_active = true ${whereClause}
    ${orderClause}
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;

  const workers = await query<any>(dataSql, dataValues);

  return {
    workers,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}

export async function getWorkerRatingStats(workerUserId: string): Promise<WorkerRatingStats> {
  const sql = `
    SELECT 
      COALESCE(AVG(rating), 0.0)::float as avg_rating,
      COUNT(*)::int as total_reviews,
      COUNT(CASE WHEN rating = 5 THEN 1 END)::int as star_5,
      COUNT(CASE WHEN rating = 4 THEN 1 END)::int as star_4,
      COUNT(CASE WHEN rating = 3 THEN 1 END)::int as star_3,
      COUNT(CASE WHEN rating = 2 THEN 1 END)::int as star_2,
      COUNT(CASE WHEN rating = 1 THEN 1 END)::int as star_1
    FROM worker_reviews
    WHERE worker_id = $1
  `;
  const rows = await query<any>(sql, [workerUserId]);
  const r = rows[0] || {};
  return {
    averageRating: Math.round((r.avg_rating || 0.0) * 10) / 10,
    totalReviews: r.total_reviews || 0,
    starCounts: {
      1: r.star_1 || 0,
      2: r.star_2 || 0,
      3: r.star_3 || 0,
      4: r.star_4 || 0,
      5: r.star_5 || 0,
    }
  };
}

export async function getWorkerReviews(
  workerUserId: string,
  page = 1,
  limit = 5
): Promise<{ reviews: WorkerReview[]; total: number }> {
  const offset = (page - 1) * limit;
  const countSql = `SELECT COUNT(*)::int as total FROM worker_reviews WHERE worker_id = $1`;
  const countRes = await query<{ total: number }>(countSql, [workerUserId]);
  const total = countRes[0]?.total || 0;

  const sql = `
    SELECT 
      r.*,
      u.fullname as reviewer_name,
      t.title as task_title
    FROM worker_reviews r
    JOIN users u ON r.reviewer_id = u.id
    JOIN tasks t ON r.task_id = t.id
    WHERE r.worker_id = $1
    ORDER BY r.created_at DESC
    LIMIT $2 OFFSET $3
  `;
  const reviews = await query<WorkerReview>(sql, [workerUserId, limit, offset]);
  return { reviews, total };
}
