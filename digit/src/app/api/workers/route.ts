import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/jwt';
import { getAllWorkers } from '@/lib/queries/users';

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  
  const payload = await verifyJWT(token);
  if (!payload || !payload.is_active) return null;
  
  return payload;
}

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || (user.role !== 'manager' && user.role !== 'admin')) {
      return NextResponse.json({ success: false, error: 'წვდომა უარყოფილია' }, { status: 403 });
    }

    const workers = await getAllWorkers();

    return NextResponse.json({
      success: true,
      workers: workers.map(w => ({
        id: w.id,
        fullname: w.fullname,
        email: w.email,
        phone: w.phone
      }))
    });
  } catch (err: any) {
    console.error('Workers GET API Error:', err);
    return NextResponse.json({ success: false, error: 'მუშების სიის ჩატვირთვა ვერ მოხერხდა' }, { status: 500 });
  }
}
