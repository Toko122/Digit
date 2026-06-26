import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/jwt';
import { getAllUsers, updateUserStatus, updateUserRole } from '@/lib/queries/users';
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
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'წვდომა უარყოფილია' }, { status: 403 });
    }

    const list = await getAllUsers();
    
    return NextResponse.json({
      success: true,
      users: list.map(u => ({
        id: u.id,
        fullname: u.fullname,
        email: u.email,
        phone: u.phone,
        role: u.role,
        is_active: u.is_active,
        created_at: u.created_at,
      }))
    });
  } catch (err: any) {
    console.error('Admin users GET API Error:', err);
    return NextResponse.json({ success: false, error: 'მომხმარებლების ჩატვირთვა ვერ მოხერხდა' }, { status: 500 });
  }
}

const toggleSchema = z.object({
  userId: z.string().uuid("მომხმარებლის ID არასწორია"),
  isActive: z.boolean().optional(),
  role: z.enum(['admin', 'business', 'manager', 'worker']).optional(),
}).refine(data => data.isActive !== undefined || data.role !== undefined, {
  message: "დასაშვებია სტატუსის ან როლის შეცვლა",
});

export async function PATCH(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'წვდომა უარყოფილია' }, { status: 403 });
    }

    const body = await request.json();
    const result = toggleSchema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || 'არასწორი მონაცემები';
      return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
    }

    const { userId, isActive, role } = result.data;
    
    // Prevent admin from deactivating or modifying themselves
    if (userId === user.id) {
      return NextResponse.json({ success: false, error: 'საკუთარი თავის რედაქტირება შეუძლებელია' }, { status: 400 });
    }

    let updatedUser = null;
    if (isActive !== undefined) {
      updatedUser = await updateUserStatus(userId, isActive);
    }
    if (role !== undefined) {
      updatedUser = await updateUserRole(userId, role);
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err: any) {
    console.error('Admin users PATCH API Error:', err);
    return NextResponse.json({ success: false, error: err.message || 'მომხმარებლის რედაქტირება ვერ მოხერხდა' }, { status: 500 });
  }
}
