import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/jwt';
import { getOrCreateWorkerProfile, addLanguage, deleteLanguage } from '@/lib/queries/workerProfiles';

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
    const { language_name, proficiency_level } = body;

    if (!language_name || language_name.trim() === '') {
      return NextResponse.json({ success: false, error: 'ენის დასახელება სავალდებულოა' }, { status: 400 });
    }

    if (!proficiency_level) {
      return NextResponse.json({ success: false, error: 'ენის ცოდნის დონე სავალდებულოა' }, { status: 400 });
    }

    const profile = await getOrCreateWorkerProfile(workerId);
    const newLang = await addLanguage(profile.id, {
      language_name,
      proficiency_level
    });

    return NextResponse.json({ success: true, language: newLang });
  } catch (err) {
    console.error('Languages POST API error:', err);
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'ენის დამატება ვერ მოხერხდა' }, { status: 500 });
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
      return NextResponse.json({ success: false, error: 'ენის ID სავალდებულოა' }, { status: 400 });
    }

    const profile = await getOrCreateWorkerProfile(workerId);
    await deleteLanguage(profile.id, id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Languages DELETE API error:', err);
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'ენის წაშლა ვერ მოხერხდა' }, { status: 500 });
  }
}
