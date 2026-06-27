import { Pool } from 'pg';

const connectionString = process.env.DB_URL;

if (!connectionString) {
  throw new Error("DB_URL environment variable is missing from .env.local");
}

const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

// Auto-ensure the complete database schema exists
async function ensureDatabaseSchema() {
  try {
    await pool.query(`
      BEGIN;

      -- Create custom types (enums) if they do not exist
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
              CREATE TYPE user_role AS ENUM ('worker', 'manager', 'business', 'admin');
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
              CREATE TYPE task_status AS ENUM ('pending', 'assigned', 'accepted', 'in_progress', 'completed', 'cancelled');
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assignment_status') THEN
              CREATE TYPE assignment_status AS ENUM ('pending', 'accepted', 'rejected');
          END IF;
      END$$;

      -- Standard auto-update trigger function for updated_at column
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- CORE TABLES
      CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          fullname VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          phone VARCHAR(55),
          role user_role NOT NULL,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      DROP TRIGGER IF EXISTS trigger_update_users_updated_at ON users;
      CREATE TRIGGER trigger_update_users_updated_at
          BEFORE UPDATE ON users
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();

      CREATE TABLE IF NOT EXISTS businesses (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
          business_name VARCHAR(255) NOT NULL,
          address TEXT,
          description TEXT,
          logo_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS tasks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
          manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          status task_status DEFAULT 'pending'::task_status,
          priority VARCHAR(50) DEFAULT 'normal',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      DROP TRIGGER IF EXISTS trigger_update_tasks_updated_at ON tasks;
      CREATE TRIGGER trigger_update_tasks_updated_at
          BEFORE UPDATE ON tasks
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();

      CREATE TABLE IF NOT EXISTS task_images (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
          image_url TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS task_assignments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
          manager_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          status assignment_status DEFAULT 'pending'::assignment_status,
          assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          responded_at TIMESTAMP WITH TIME ZONE
      );

      CREATE TABLE IF NOT EXISTS notifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          body TEXT,
          is_read BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- CORE WORKER PROFILE
      CREATE TABLE IF NOT EXISTS worker_profiles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL UNIQUE,
          profile_photo_url TEXT,
          cover_image_url TEXT,
          headline VARCHAR(255),
          about_me TEXT,
          hourly_rate NUMERIC(10, 2),
          currency VARCHAR(3) DEFAULT 'GEL' NOT NULL,
          experience_level VARCHAR(50) DEFAULT 'Intermediate' NOT NULL,
          availability VARCHAR(50) DEFAULT 'available' NOT NULL,
          location VARCHAR(255),
          resume_url TEXT,
          years_of_experience INT DEFAULT 0 NOT NULL,
          website_url VARCHAR(255),
          github_url VARCHAR(255),
          linkedin_url VARCHAR(255),
          visibility VARCHAR(50) DEFAULT 'public' NOT NULL,
          verification_status VARCHAR(50) DEFAULT 'unverified' NOT NULL,
          rating NUMERIC(3, 2) DEFAULT 0.0 NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          CONSTRAINT chk_hourly_rate CHECK (hourly_rate >= 0),
          CONSTRAINT chk_years_of_experience CHECK (years_of_experience >= 0),
          CONSTRAINT chk_experience_level CHECK (experience_level IN ('Entry', 'Intermediate', 'Expert')),
          CONSTRAINT chk_visibility CHECK (visibility IN ('public', 'private', 'connections_only')),
          CONSTRAINT chk_verification_status CHECK (verification_status IN ('unverified', 'pending', 'verified')),
          CONSTRAINT chk_availability CHECK (availability IN ('available', 'busy', 'unavailable'))
      );

      -- Drop triggers if they exist to make script rerun-safe
      DROP TRIGGER IF EXISTS trigger_update_worker_profiles_updated_at ON worker_profiles;
      CREATE TRIGGER trigger_update_worker_profiles_updated_at
          BEFORE UPDATE ON worker_profiles
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();

      CREATE INDEX IF NOT EXISTS idx_worker_profiles_user_id ON worker_profiles(user_id);
      CREATE INDEX IF NOT EXISTS idx_worker_profiles_location ON worker_profiles(location);
      CREATE INDEX IF NOT EXISTS idx_worker_profiles_verification ON worker_profiles(verification_status);

      -- Auto-create missing worker profiles for existing worker users
      INSERT INTO worker_profiles (id, user_id, headline, hourly_rate, currency, experience_level, availability, visibility, verification_status)
      SELECT gen_random_uuid(), id, '', 0.00, 'GEL', 'Intermediate', 'available', 'public', 'unverified'
      FROM users
      WHERE role = 'worker'
      ON CONFLICT (user_id) DO NOTHING;

      -- WORK EXPERIENCE
      CREATE TABLE IF NOT EXISTS worker_experiences (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          worker_profile_id UUID NOT NULL,
          title VARCHAR(255) NOT NULL,
          company_name VARCHAR(255) NOT NULL,
          location VARCHAR(255),
          start_date DATE NOT NULL,
          end_date DATE,
          is_current BOOLEAN DEFAULT FALSE NOT NULL,
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          
          FOREIGN KEY (worker_profile_id) REFERENCES worker_profiles(id) ON DELETE CASCADE,
          CONSTRAINT chk_experience_dates CHECK (end_date IS NULL OR start_date <= end_date),
          CONSTRAINT chk_experience_current CHECK (NOT (is_current = TRUE AND end_date IS NOT NULL))
      );

      DROP TRIGGER IF EXISTS trigger_update_worker_experiences_updated_at ON worker_experiences;
      CREATE TRIGGER trigger_update_worker_experiences_updated_at
          BEFORE UPDATE ON worker_experiences
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();

      CREATE INDEX IF NOT EXISTS idx_worker_experiences_profile_id ON worker_experiences(worker_profile_id);

      -- EDUCATION
      CREATE TABLE IF NOT EXISTS worker_educations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          worker_profile_id UUID NOT NULL,
          institution VARCHAR(255) NOT NULL,
          degree VARCHAR(255) NOT NULL,
          field_of_study VARCHAR(255),
          start_date DATE NOT NULL,
          end_date DATE,
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          
          FOREIGN KEY (worker_profile_id) REFERENCES worker_profiles(id) ON DELETE CASCADE,
          CONSTRAINT chk_education_dates CHECK (end_date IS NULL OR start_date <= end_date)
      );

      DROP TRIGGER IF EXISTS trigger_update_worker_educations_updated_at ON worker_educations;
      CREATE TRIGGER trigger_update_worker_educations_updated_at
          BEFORE UPDATE ON worker_educations
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();

      CREATE INDEX IF NOT EXISTS idx_worker_educations_profile_id ON worker_educations(worker_profile_id);

      -- SKILLS & WORKER SKILLS (MANY-TO-MANY)
      CREATE TABLE IF NOT EXISTS skills (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) NOT NULL UNIQUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_skills_name_lower ON skills (LOWER(name));

      CREATE TABLE IF NOT EXISTS worker_skills (
          worker_profile_id UUID NOT NULL,
          skill_id UUID NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          
          PRIMARY KEY (worker_profile_id, skill_id),
          FOREIGN KEY (worker_profile_id) REFERENCES worker_profiles(id) ON DELETE CASCADE,
          FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_worker_skills_skill_id ON worker_skills(skill_id);

      -- PORTFOLIO & PORTFOLIO IMAGES
      CREATE TABLE IF NOT EXISTS portfolio_projects (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          worker_profile_id UUID NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          github_url TEXT,
          live_url TEXT,
          completion_date DATE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          
          FOREIGN KEY (worker_profile_id) REFERENCES worker_profiles(id) ON DELETE CASCADE
      );

      DROP TRIGGER IF EXISTS trigger_update_portfolio_projects_updated_at ON portfolio_projects;
      CREATE TRIGGER trigger_update_portfolio_projects_updated_at
          BEFORE UPDATE ON portfolio_projects
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();

      CREATE INDEX IF NOT EXISTS idx_portfolio_projects_profile_id ON portfolio_projects(worker_profile_id);

      CREATE TABLE IF NOT EXISTS portfolio_images (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          portfolio_project_id UUID NOT NULL,
          image_url TEXT NOT NULL,
          is_primary BOOLEAN DEFAULT FALSE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          
          FOREIGN KEY (portfolio_project_id) REFERENCES portfolio_projects(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_portfolio_images_project_id ON portfolio_images(portfolio_project_id);

      CREATE TABLE IF NOT EXISTS portfolio_project_skills (
          portfolio_project_id UUID NOT NULL,
          skill_id UUID NOT NULL,
          
          PRIMARY KEY (portfolio_project_id, skill_id),
          FOREIGN KEY (portfolio_project_id) REFERENCES portfolio_projects(id) ON DELETE CASCADE,
          FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_portfolio_project_skills_skill_id ON portfolio_project_skills(skill_id);

      -- CERTIFICATIONS
      CREATE TABLE IF NOT EXISTS worker_certifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          worker_profile_id UUID NOT NULL,
          name VARCHAR(255) NOT NULL,
          issuing_organization VARCHAR(255) NOT NULL,
          issue_date DATE NOT NULL,
          expiration_date DATE,
          credential_id VARCHAR(100),
          credential_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          
          FOREIGN KEY (worker_profile_id) REFERENCES worker_profiles(id) ON DELETE CASCADE,
          CONSTRAINT chk_certification_dates CHECK (expiration_date IS NULL OR issue_date <= expiration_date)
      );

      DROP TRIGGER IF EXISTS trigger_update_worker_certifications_updated_at ON worker_certifications;
      CREATE TRIGGER trigger_update_worker_certifications_updated_at
          BEFORE UPDATE ON worker_certifications
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();

      CREATE INDEX IF NOT EXISTS idx_worker_certifications_profile_id ON worker_certifications(worker_profile_id);

      -- LANGUAGES
      CREATE TABLE IF NOT EXISTS worker_languages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          worker_profile_id UUID NOT NULL,
          language_name VARCHAR(100) NOT NULL,
          proficiency_level VARCHAR(50) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          
          FOREIGN KEY (worker_profile_id) REFERENCES worker_profiles(id) ON DELETE CASCADE,
          UNIQUE (worker_profile_id, language_name),
          CONSTRAINT chk_proficiency_level CHECK (proficiency_level IN ('elementary', 'conversational', 'professional', 'fluent', 'native'))
      );

      DROP TRIGGER IF EXISTS trigger_update_worker_languages_updated_at ON worker_languages;
      CREATE TRIGGER trigger_update_worker_languages_updated_at
          BEFORE UPDATE ON worker_languages
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();

      CREATE INDEX IF NOT EXISTS idx_worker_languages_profile_id ON worker_languages(worker_profile_id);

      -- SOCIAL LINKS
      CREATE TABLE IF NOT EXISTS worker_social_links (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          worker_profile_id UUID NOT NULL,
          platform VARCHAR(50) NOT NULL,
          url TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          
          FOREIGN KEY (worker_profile_id) REFERENCES worker_profiles(id) ON DELETE CASCADE,
          UNIQUE (worker_profile_id, platform),
          CONSTRAINT chk_platform_not_empty CHECK (TRIM(platform) <> ''),
          CONSTRAINT chk_url_not_empty CHECK (TRIM(url) <> '')
      );

      DROP TRIGGER IF EXISTS trigger_update_worker_social_links_updated_at ON worker_social_links;
      CREATE TRIGGER trigger_update_worker_social_links_updated_at
          BEFORE UPDATE ON worker_social_links
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();

      CREATE INDEX IF NOT EXISTS idx_worker_social_links_profile_id ON worker_social_links(worker_profile_id);

      -- WORKER REVIEWS
      CREATE TABLE IF NOT EXISTS worker_reviews (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          reviewer_role VARCHAR(20) NOT NULL,
          worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
          rating INT NOT NULL,
          review_text VARCHAR(1000),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          CONSTRAINT unique_reviewer_task UNIQUE (reviewer_id, task_id),
          CONSTRAINT unique_reviewer_task_worker UNIQUE (reviewer_id, task_id, worker_id)
      );

      DROP TRIGGER IF EXISTS trigger_update_worker_reviews_updated_at ON worker_reviews;
      CREATE TRIGGER trigger_update_worker_reviews_updated_at
          BEFORE UPDATE ON worker_reviews
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();

      CREATE INDEX IF NOT EXISTS idx_worker_reviews_worker_id ON worker_reviews(worker_id);
      CREATE INDEX IF NOT EXISTS idx_worker_reviews_reviewer_id ON worker_reviews(reviewer_id);
      CREATE INDEX IF NOT EXISTS idx_worker_reviews_task_id ON worker_reviews(task_id);
      CREATE INDEX IF NOT EXISTS idx_worker_reviews_created_at ON worker_reviews(created_at DESC);

      COMMIT;
    `);
    if (process.env.NODE_ENV !== 'production') {
      console.log('Successfully verified/created database schema.');
    }
  } catch (err) {
    console.error('Failed to auto-create database schema:', err);
  }
}
ensureDatabaseSchema();

export async function query<T = unknown>(text: string, params?: unknown[]): Promise<T[]> {
  const start = Date.now();
  try {
    const res = await pool.query(text, params as Parameters<typeof pool.query>[1]);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'production') {
      console.log('Executed query', { text, duration, rows: res.rowCount });
    }
    return res.rows as T[];
  } catch (error) {
    console.error('Database query error:', { text, error });
    throw error;
  }
}

export default pool;
