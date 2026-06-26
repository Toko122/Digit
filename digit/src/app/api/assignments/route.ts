import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/jwt';
import { assignWorker } from '@/lib/services/assignment.service';
import { z } from 'zod';

const assignSchema = z.object({
  taskId: z.string().uuid("დავალების ID არასწორია"),
  workerId: z.string().uuid("მუშის ID არასწორია"),
});

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  
  const payload = await verifyJWT(token);
  if (!payload || !payload.is_active) return null;
  
  return payload as { id: string; role: string; is_active: boolean; fullname: string; email: string };
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'manager') {
      return NextResponse.json({ success: false, error: 'წვდომა უარყოფილია' }, { status: 403 });
    }

    const body = await request.json();
    const result = assignSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || 'არასწორი მონაცემები';
      return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
    }

    const { taskId, workerId } = result.data;
    const assignment = await assignWorker(taskId, user.id, workerId);

    return NextResponse.json({ success: true, assignment });
  } catch (err: any) {
    console.error('Assignment POST API Error:', err);
    return NextResponse.json({ success: false, error: err.message || 'დავალების გადაცემა ვერ მოხერხდა' }, { status: 500 });
  }
}

import { getAssignmentsByWorker } from '@/lib/queries/assignments';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'worker') {
      return NextResponse.json({ success: false, error: 'წვდომა უარყოფილია' }, { status: 403 });
    }

    const list = await getAssignmentsByWorker(user.id);
    return NextResponse.json({ success: true, assignments: list });
  } catch (err: any) {
    console.error('Assignments GET API Error:', err);
    return NextResponse.json({ success: false, error: 'შემოთავაზებების ჩატვირთვა ვერ მოხერხდა' }, { status: 500 });
  }
}

