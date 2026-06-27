import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/jwt';
import { getTaskById, getTaskImages } from '@/lib/queries/tasks';
import { getAssignmentsByTask } from '@/lib/queries/assignments';

import { query } from '@/lib/db';

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  
  const payload = await verifyJWT(token);
  if (!payload || !payload.is_active) return null;
  
  return payload;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'ავტორიზაცია საჭიროა' }, { status: 401 });
    }

    const { id } = await params;
    const task = await getTaskById(id);

    if (!task) {
      return NextResponse.json({ success: false, error: 'დავალება ვერ მოიძებნა' }, { status: 404 });
    }

    // Access control
    if (user.role === 'business') {
      // Businesses can only see their own tasks
    }

    const images = await getTaskImages(id);
    const assignments = await getAssignmentsByTask(id);

    // Check if current user has reviewed this task
    const reviewedRows = await query<{ rating: number; review_text: string | null }>(
      'SELECT rating, review_text FROM worker_reviews WHERE reviewer_id = $1 AND task_id = $2 LIMIT 1',
      [user.id, id]
    );
    const has_reviewed = reviewedRows.length > 0;
    const reviewInfo = reviewedRows[0] || null;

    return NextResponse.json({
      success: true,
      task: {
        ...task,
        images: images.map(img => img.image_url),
        assignments: assignments || [],
        has_reviewed,
        my_rating: reviewInfo ? reviewInfo.rating : null,
        my_review_text: reviewInfo ? reviewInfo.review_text : null,
      }
    });
  } catch (err: any) {
    console.error('Task detail GET API error:', err);
    return NextResponse.json({ success: false, error: 'დავალების ჩატვირთვისას დაფიქსირდა შეცდომა' }, { status: 500 });
  }
}

import { completeTask } from '@/lib/services/assignment.service';
const patchSchema = z.object({
  action: z.enum(['complete']),
});
import { z } from 'zod';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'ავტორიზაცია საჭიროა' }, { status: 401 });
    }

    const body = await request.json();
    const result = patchSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ success: false, error: 'არასწორი მოქმედება' }, { status: 400 });
    }

    const { id } = await params;
    const task = await completeTask(id, user.id, user.role);

    return NextResponse.json({ success: true, task });
  } catch (err: any) {
    console.error('Task PATCH API Error:', err);
    return NextResponse.json({ success: false, error: err.message || 'დავალების განახლება ვერ მოხერხდა' }, { status: 500 });
  }
}

