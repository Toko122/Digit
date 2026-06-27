import pool from '../db';

export async function submitReview(params: {
  taskId: string;
  workerId: string;
  reviewerId: string;
  reviewerRole: string;
  rating: number;
  reviewText: string | null;
}) {
  const { taskId, workerId, reviewerId, reviewerRole, rating, reviewText } = params;

  // Validation
  if (rating < 1 || rating > 5) {
    throw new Error('რეიტინგი უნდა იყოს 1-დან 5-მდე');
  }
  if (reviewText && reviewText.length > 1000) {
    throw new Error('შეფასების ტექსტი არ უნდა აღემატებოდეს 1000 სიმბოლოს');
  }
  if (reviewerRole !== 'business' && reviewerRole !== 'manager') {
    throw new Error('წვდომა უარყოფილია - მხოლოდ დამკვეთს ან მენეჯერს შეუძლია შეფასების დატოვება');
  }
  if (reviewerId === workerId) {
    throw new Error('წვდომა უარყოფილია - მუშას არ შეუძლია საკუთარი თავის შეფასება');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch and lock task row
    const taskRes = await client.query('SELECT * FROM tasks WHERE id = $1 FOR UPDATE', [taskId]);
    const task = taskRes.rows[0];
    if (!task) {
      throw new Error('დავალება ვერ მოიძებნა');
    }

    // 2. Validate task status
    if (task.status !== 'completed') {
      throw new Error('შეფასების დატოვება შესაძლებელია მხოლოდ დასრულებულ დავალებაზე');
    }

    // 3. Validate worker exists
    const workerRes = await client.query("SELECT * FROM users WHERE id = $1 AND role = 'worker'", [workerId]);
    const worker = workerRes.rows[0];
    if (!worker) {
      throw new Error('მუშა ვერ მოიძებნა');
    }

    // 4. Validate worker assignment
    const assignRes = await client.query(
      "SELECT * FROM task_assignments WHERE task_id = $1 AND worker_id = $2 AND status = 'accepted'",
      [taskId, workerId]
    );
    if (assignRes.rows.length === 0) {
      throw new Error('მუშა არ ყოფილა დანიშნული ამ დავალებაზე');
    }

    // 5. Validate reviewer belongs to task
    if (reviewerRole === 'business') {
      const bizRes = await client.query('SELECT id FROM businesses WHERE user_id = $1 LIMIT 1', [reviewerId]);
      const business = bizRes.rows[0];
      if (!business || task.business_id !== business.id) {
        throw new Error('წვდომა უარყოფილია - თქვენ არ ხართ ამ დავალების დამკვეთი');
      }
    }
    if (reviewerRole === 'manager' && task.manager_id !== reviewerId) {
      throw new Error('წვდომა უარყოფილია - თქვენ არ ხართ ამ დავალების მენეჯერი');
    }

    // 6. Check for duplicate review (update if exists to support edit)
    const duplicateRes = await client.query(
      'SELECT id FROM worker_reviews WHERE reviewer_id = $1 AND task_id = $2 AND worker_id = $3',
      [reviewerId, taskId, workerId]
    );
    if (duplicateRes.rows.length > 0) {
      const existingReviewId = duplicateRes.rows[0].id;
      await client.query(
        `UPDATE worker_reviews 
         SET rating = $1, review_text = $2, updated_at = NOW() 
         WHERE id = $3`,
        [rating, reviewText || null, existingReviewId]
      );
    } else {
      // 7. Insert review
      await client.query(
        `INSERT INTO worker_reviews (id, reviewer_id, reviewer_role, worker_id, task_id, rating, review_text, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW())`,
        [reviewerId, reviewerRole, workerId, taskId, rating, reviewText || null]
      );
    }

    // 8. Recalculate average rating
    const avgRes = await client.query(
      'SELECT COALESCE(AVG(rating), 0.0)::float as avg_rating FROM worker_reviews WHERE worker_id = $1',
      [workerId]
    );
    const newAvg = avgRes.rows[0]?.avg_rating || 0.0;

    // 9. Update worker_profiles
    await client.query(
      'UPDATE worker_profiles SET rating = $1, updated_at = NOW() WHERE user_id = $2',
      [newAvg, workerId]
    );

    await client.query('COMMIT');
    return { success: true };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
