import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/jwt';
import { getOrCreateWorkerProfile, addCertification, updateCertification, deleteCertification } from '@/lib/queries/workerProfiles';

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

    const newCert = await addCertification(profile.id, {
      name: body.name,
      issuing_organization: body.issuing_organization,
      issue_date: new Date(body.issue_date),
      expiration_date: body.expiration_date ? new Date(body.expiration_date) : null,
      credential_id: body.credential_id || null,
      credential_url: body.credential_url || null
    });

    return NextResponse.json({ success: true, certification: newCert });
  } catch (err) {
    console.error('Certifications POST API error:', err);
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'სერტიფიკატის დამატება ვერ მოხერხდა' }, { status: 500 });
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
      return NextResponse.json({ success: false, error: 'სერტიფიკატის ID სავალდებულოა' }, { status: 400 });
    }

    const profile = await getOrCreateWorkerProfile(workerId);

    if (updates.issue_date) updates.issue_date = new Date(updates.issue_date);
    if (updates.expiration_date) updates.expiration_date = new Date(updates.expiration_date);

    const updated = await updateCertification(profile.id, id, updates);
    return NextResponse.json({ success: true, certification: updated });
  } catch (err) {
    console.error('Certifications PUT API error:', err);
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'სერტიფიკატის განახლება ვერ მოხერხდა' }, { status: 500 });
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
      return NextResponse.json({ success: false, error: 'სერტიფიკატის ID სავალდებულოა' }, { status: 400 });
    }

    const profile = await getOrCreateWorkerProfile(workerId);
    await deleteCertification(profile.id, id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Certifications DELETE API error:', err);
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'სერტიფიკატის წაშლა ვერ მოხერხდა' }, { status: 500 });
  }
}
