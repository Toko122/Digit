import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/jwt';
import { respondToAssignment } from '@/lib/services/assignment.service';
import { z } from 'zod';

const respondSchema = z.object({
  status: z.enum(['accepted', 'rejected']),
});

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  
  const payload = await verifyJWT(token);
  if (!payload || !payload.is_active) return null;
  
  return payload as { id: string; role: string; is_active: boolean; fullname: string; email: string };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'worker') {
      return NextResponse.json({ success: false, error: 'წვდომა უარყოფილია' }, { status: 403 });
    }

    const body = await request.json();
    const result = respondSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || 'არასწორი მონაცემები';
      return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
    }

    const { id } = await params;
    const { status } = result.data;
    const assignment = await respondToAssignment(id, user.id, status);

    return NextResponse.json({ success: true, assignment });
  } catch (err: any) {
    console.error('Assignment PATCH API Error:', err);
    return NextResponse.json({ success: false, error: err.message || 'პასუხის გაცემა ვერ მოხერხდა' }, { status: 500 });
  }
}
