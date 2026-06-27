import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/jwt';
import { getOrCreateWorkerProfile, addEducation, updateEducation, deleteEducation } from '@/lib/queries/workerProfiles';

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
    const profile = await getOrCreateWorkerProfile(workerId);

    const newEdu = await addEducation(profile.id, {
      institution: body.institution,
      degree: body.degree,
      field_of_study: body.field_of_study || null,
      start_date: new Date(body.start_date),
      end_date: body.end_date ? new Date(body.end_date) : null,
      description: body.description || null
    });

    return NextResponse.json({ success: true, education: newEdu });
  } catch (err) {
    console.error('Educations POST API error:', err);
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'განათლების დამატება ვერ მოხერხდა' }, { status: 500 });
  }
}

export async function PUT(
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
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'განათლების ID სავალდებულოა' }, { status: 400 });
    }

    const profile = await getOrCreateWorkerProfile(workerId);

    if (updates.start_date) updates.start_date = new Date(updates.start_date);
    if (updates.end_date) updates.end_date = new Date(updates.end_date);

    const updated = await updateEducation(profile.id, id, updates);
    return NextResponse.json({ success: true, education: updated });
  } catch (err) {
    console.error('Educations PUT API error:', err);
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'განათლების განახლება ვერ მოხერხდა' }, { status: 500 });
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
      return NextResponse.json({ success: false, error: 'განათლების ID სავალდებულოა' }, { status: 400 });
    }

    const profile = await getOrCreateWorkerProfile(workerId);
    await deleteEducation(profile.id, id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Educations DELETE API error:', err);
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'განათლების წაშლა ვერ მოხერხდა' }, { status: 500 });
  }
}
