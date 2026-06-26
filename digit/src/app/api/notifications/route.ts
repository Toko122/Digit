import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/jwt';
import { getNotifications, markAsRead, markAllAsRead, getUnreadCount } from '@/lib/services/notification.service';
import { z } from 'zod';

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
    if (!user) {
      return NextResponse.json({ success: false, error: 'ავტორიზაცია საჭიროა' }, { status: 401 });
    }

    const list = await getNotifications(user.id);
    const count = await getUnreadCount(user.id);

    return NextResponse.json({
      success: true,
      notifications: list,
      unreadCount: count,
    });
  } catch (err: any) {
    console.error('Notifications GET API error:', err);
    return NextResponse.json({ success: false, error: 'შეტყობინებების წაკითხვისას დაფიქსირდა შეცდომა' }, { status: 500 });
  }
}

const patchSchema = z.object({
  notificationId: z.string().optional().nullable(),
  all: z.boolean().optional().nullable(),
});

export async function PATCH(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'ავტორიზაცია საჭიროა' }, { status: 401 });
    }

    const body = await request.json();
    const result = patchSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ success: false, error: 'არასწორი პარამეტრები' }, { status: 400 });
    }

    const { notificationId, all } = result.data;

    if (all) {
      await markAllAsRead(user.id);
    } else if (notificationId) {
      await markAsRead(notificationId);
    } else {
      return NextResponse.json({ success: false, error: 'პარამეტრები არასრულია' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Notifications PATCH API error:', err);
    return NextResponse.json({ success: false, error: 'სტატუსის განახლებისას დაფიქსირდა შეცდომა' }, { status: 500 });
  }
}
