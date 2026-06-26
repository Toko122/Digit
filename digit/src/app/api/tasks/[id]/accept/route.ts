import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/jwt';
import { acceptTask } from '@/lib/services/task.service';

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  
  const payload = await verifyJWT(token);
  if (!payload || !payload.is_active) return null;
  
  return payload;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'manager') {
      return NextResponse.json({ success: false, error: 'წვდომა უარყოფილია' }, { status: 403 });
    }

    const { id } = await params;
    const task = await acceptTask(id, user.id);

    return NextResponse.json({ success: true, task });
  } catch (err: any) {
    console.error('Accept task API Error:', err);
    return NextResponse.json({ success: false, error: err.message || 'დავალების მიღება ვერ მოხერხდა' }, { status: 500 });
  }
}
