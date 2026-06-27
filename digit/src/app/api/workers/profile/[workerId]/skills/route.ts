import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/jwt';
import { getOrCreateWorkerProfile, addSkill, removeSkill } from '@/lib/queries/workerProfiles';

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
  { params }: { params: Promise<{ workerId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'ავტორიზაცია საჭიროა' }, { status: 401 });
    }

    const { workerId } = await params;
    if (user.id !== workerId && user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'წვდომა უარყოფილია' }, { status: 403 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ success: false, error: 'უნარის დასახელება სავალდებულოა' }, { status: 400 });
    }

    const profile = await getOrCreateWorkerProfile(workerId);
    const skill = await addSkill(profile.id, name);

    return NextResponse.json({ success: true, skill });
  } catch (err) {
    console.error('Skills POST API error:', err);
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'უნარის დამატება ვერ მოხერხდა' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ workerId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'ავტორიზაცია საჭიროა' }, { status: 401 });
    }

    const { workerId } = await params;
    if (user.id !== workerId && user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'წვდომა უარყოფილია' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'უნარის ID სავალდებულოა' }, { status: 400 });
    }

    const profile = await getOrCreateWorkerProfile(workerId);
    await removeSkill(profile.id, id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Skills DELETE API error:', err);
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'უნარის წაშლა ვერ მოხერხდა' }, { status: 500 });
  }
}
