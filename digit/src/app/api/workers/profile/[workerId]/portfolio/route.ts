import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/jwt';
import { getOrCreateWorkerProfile, addPortfolioProject, updatePortfolioProject, deletePortfolioProject } from '@/lib/queries/workerProfiles';

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
    const { title, description, github_url, live_url, completion_date, images } = body;

    if (!title || title.trim() === '') {
      return NextResponse.json({ success: false, error: 'პროექტის დასახელება სავალდებულოა' }, { status: 400 });
    }

    const profile = await getOrCreateWorkerProfile(workerId);
    const newProject = await addPortfolioProject(profile.id, {
      title,
      description: description || null,
      github_url: github_url || null,
      live_url: live_url || null,
      completion_date: completion_date ? new Date(completion_date) : null
    }, images || []);

    return NextResponse.json({ success: true, portfolio: newProject });
  } catch (err) {
    console.error('Portfolio POST API error:', err);
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'პროექტის დამატება ვერ მოხერხდა' }, { status: 500 });
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
    const { id, title, description, github_url, live_url, completion_date, images } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'პროექტის ID სავალდებულოა' }, { status: 400 });
    }

    const profile = await getOrCreateWorkerProfile(workerId);
    
    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (github_url !== undefined) updates.github_url = github_url;
    if (live_url !== undefined) updates.live_url = live_url;
    if (completion_date !== undefined) updates.completion_date = completion_date ? new Date(completion_date) : null;

    const updated = await updatePortfolioProject(profile.id, id, updates, images);
    return NextResponse.json({ success: true, portfolio: updated });
  } catch (err) {
    console.error('Portfolio PUT API error:', err);
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'პროექტის განახლება ვერ მოხერხდა' }, { status: 500 });
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
      return NextResponse.json({ success: false, error: 'პროექტის ID სავალდებულოა' }, { status: 400 });
    }

    const profile = await getOrCreateWorkerProfile(workerId);
    await deletePortfolioProject(profile.id, id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Portfolio DELETE API error:', err);
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'პროექტის წაშლა ვერ მოხერხდა' }, { status: 500 });
  }
}
