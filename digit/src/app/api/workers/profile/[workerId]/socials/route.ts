import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/jwt';
import { getOrCreateWorkerProfile, upsertSocialLink } from '@/lib/queries/workerProfiles';

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  const payload = await verifyJWT(token);
  if (!payload || !payload.is_active) return null;
  return payload;
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
    const { platform, url } = body;

    if (!platform || platform.trim() === '') {
      return NextResponse.json({ success: false, error: 'პლატფორმა სავალდებულოა' }, { status: 400 });
    }

    const profile = await getOrCreateWorkerProfile(workerId);
    const link = await upsertSocialLink(profile.id, platform, url);

    return NextResponse.json({ success: true, socialLink: link });
  } catch (err) {
    console.error('Socials PUT API error:', err);
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'სოციალური ბმულის შენახვა ვერ მოხერხდა' }, { status: 500 });
  }
}
