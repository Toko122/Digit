import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/jwt';
import { postTask } from '@/lib/services/task.service';
import * as taskQueries from '@/lib/queries/tasks';
import { getBusinessByUserId } from '@/lib/queries/users';
import { z } from 'zod';

import { query } from '@/lib/db';
import { DetailedTask } from '@/lib/queries/tasks';

const createTaskSchema = z.object({
  title: z.string().min(3, "სათაური უნდა იყოს მინიმუმ 3 სიმბოლო"),
  description: z.string().min(10, "აღწერა უნდა იყოს მინიმუმ 10 სიმბოლო"),
  priority: z.enum(['low', 'medium', 'high']),
  imageUrls: z.array(z.string()).optional(),
});

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  
  const payload = await verifyJWT(token);
  if (!payload || !payload.is_active) return null;
  
  return payload;
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'business') {
      return NextResponse.json({ success: false, error: 'წვდომა უარყოფილია' }, { status: 403 });
    }

    // Get business record for this user
    const business = await getBusinessByUserId(user.id);
    if (!business) {
      return NextResponse.json({ success: false, error: 'ბიზნეს პროფილი ვერ მოიძებნა' }, { status: 404 });
    }

    const body = await request.json();
    const result = createTaskSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || 'არასწორი მონაცემები';
      return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
    }

    const { title, description, priority, imageUrls } = result.data;
    const task = await postTask(business.id, title, description, priority, imageUrls || []);

    return NextResponse.json({ success: true, task });
  } catch (err: any) {
    console.error('Task POST API error:', err);
    return NextResponse.json({ success: false, error: 'დავალების შექმნისას დაფიქსირდა შეცდომა' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'ავტორიზაცია საჭიროა' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope') || 'all';

    let tasks: DetailedTask[] = [];

    if (user.role === 'business') {
      const business = await getBusinessByUserId(user.id);
      if (!business) {
        return NextResponse.json({ success: false, error: 'ბიზნეს პროფილი ვერ მოიძებნა' }, { status: 404 });
      }
      tasks = await taskQueries.getTasksByBusiness(business.id);
    } else if (user.role === 'manager') {
      if (scope === 'feed') {
        // Unassigned tasks
        tasks = await taskQueries.getPendingTasks();
      } else if (scope === 'my') {
        // Tasks accepted by this manager
        tasks = await taskQueries.getTasksByManager(user.id);
      } else {
        tasks = await taskQueries.getAllDetailedTasks();
      }
    } else if (user.role === 'admin') {
      tasks = await taskQueries.getAllDetailedTasks();
    } else {
      return NextResponse.json({ success: false, error: 'არასწორი როლი' }, { status: 403 });
    }

    // Query reviewer's review states for these tasks to support Edit Review prefilling
    const reviewedRows = await query<{ task_id: string; rating: number; review_text: string | null }>(
      'SELECT task_id, rating, review_text FROM worker_reviews WHERE reviewer_id = $1',
      [user.id]
    );
    const reviewedMap = new Map(reviewedRows.map(r => [r.task_id, { rating: r.rating, review_text: r.review_text }]));

    const tasksWithReview = tasks.map(task => {
      const reviewInfo = reviewedMap.get(task.id);
      return {
        ...task,
        has_reviewed: !!reviewInfo,
        my_rating: reviewInfo ? reviewInfo.rating : null,
        my_review_text: reviewInfo ? reviewInfo.review_text : null,
      };
    });

    return NextResponse.json({ success: true, tasks: tasksWithReview });
  } catch (err: any) {
    console.error('Task GET API error:', err);
    return NextResponse.json({ success: false, error: 'დავალებების ჩატვირთვისას დაფიქსირდა შეცდომა' }, { status: 500 });
  }
}
