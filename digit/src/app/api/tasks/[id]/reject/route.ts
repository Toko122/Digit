import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/jwt';

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  
  const payload = await verifyJWT(token);
  if (!payload || !payload.is_active) return null;
  
  return payload;
}

export async function POST(
  _request: Request,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'manager') {
      return NextResponse.json({ success: false, error: 'წვდომა უარყოფილია' }, { status: 403 });
    }

    // In Digit, a manager rejecting a task means it remains pending for other managers.
    // We just return success, and the frontend will temporarily filter it out from their view.
    return NextResponse.json({ success: true, message: 'დავალება უარყოფილია მენეჯერის მიერ' });
  } catch (err: any) {
    console.error('Reject task API Error:', err);
    return NextResponse.json({ success: false, error: 'დავალების უარყოფა ვერ მოხერხდა' }, { status: 500 });
  }
}
