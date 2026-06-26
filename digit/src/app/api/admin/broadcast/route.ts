import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/jwt';
import { getAllUsers } from '@/lib/queries/users';
import { createNotification } from '@/lib/queries/notifications';
import { z } from 'zod';

const broadcastSchema = z.object({
  title: z.string().min(1, "სათაური სავალდებულოა"),
  body: z.string().min(1, "შეტყობინების ტექსტი სავალდებულოა"),
  targetRole: z.enum(['all', 'business', 'manager', 'worker']),
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
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'წვდომა უარყოფილია' }, { status: 403 });
    }

    const body = await request.json();
    const result = broadcastSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || 'არასწორი მონაცემები';
      return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
    }

    const { title, body: content, targetRole } = result.data;

    // Fetch all users to filter
    const users = await getAllUsers();
    const targetUsers = users.filter(u => 
      u.is_active && 
      (targetRole === 'all' || u.role === targetRole) &&
      u.id !== user.id // Don't notify the sender admin
    );

    let count = 0;
    for (const target of targetUsers) {
      await createNotification(target.id, title, content);
      count++;
    }

    return NextResponse.json({ success: true, notifiedCount: count });
  } catch (err: any) {
    console.error('Broadcast API Error:', err);
    return NextResponse.json({ success: false, error: 'შეტყობინების გაგზავნა ვერ მოხერხდა' }, { status: 500 });
  }
}
