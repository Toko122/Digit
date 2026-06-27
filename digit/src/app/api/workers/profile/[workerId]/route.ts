import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/jwt';
import { getFullWorkerProfile, updateWorkerProfile } from '@/lib/queries/workerProfiles';

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  
  const payload = await verifyJWT(token);
  if (!payload || !payload.is_active) return null;
  
  return payload;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ workerId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'ავტორიზაცია საჭიროა' }, { status: 401 });
    }

    const { workerId } = await params;
    const fullProfile = await getFullWorkerProfile(workerId);

    return NextResponse.json({
      success: true,
      ...fullProfile
    });
  } catch (err) {
    console.error('Worker profile GET API error:', err);
    return NextResponse.json({ success: false, error: 'პროფილის ჩატვირთვისას დაფიქსირდა შეცდომა' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ workerId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'ავტორიზაცია საჭიროა' }, { status: 401 });
    }

    const { workerId } = await params;

    // Authorization: Only owner or admin can edit
    if (user.id !== workerId && user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'წვდომა უარყოფილია - რედაქტირება შეუძლია მხოლოდ მფლობელს' }, { status: 403 });
    }

    const body = await request.json();

    // Whitelist updates
    const allowedFields = [
      'headline',
      'about_me',
      'hourly_rate',
      'currency',
      'experience_level',
      'availability',
      'location',
      'website_url',
      'github_url',
      'linkedin_url',
      'visibility',
      'profile_photo_url',
      'cover_image_url',
      'resume_url',
      'phone',
      'years_of_experience'
    ];

    const updates: Record<string, string | number | null> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    // Convert numeric fields if necessary
    if (updates.hourly_rate !== undefined && updates.hourly_rate !== null) {
      updates.hourly_rate = parseFloat(String(updates.hourly_rate)) || 0;
    }
    if (updates.years_of_experience !== undefined && updates.years_of_experience !== null) {
      updates.years_of_experience = parseInt(String(updates.years_of_experience)) || 0;
    }

    const updatedProfile = await updateWorkerProfile(workerId, updates);

    return NextResponse.json({
      success: true,
      profile: updatedProfile
    });
  } catch (err) {
    console.error('Worker profile PATCH API error:', err);
    return NextResponse.json({ success: false, error: 'პროფილის განახლებისას დაფიქსირდა შეცდომა' }, { status: 500 });
  }
}
