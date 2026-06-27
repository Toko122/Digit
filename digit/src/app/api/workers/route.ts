import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/jwt';
import { searchAndFilterWorkers } from '@/lib/queries/workerProfiles';

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  
  const payload = await verifyJWT(token);
  if (!payload || !payload.is_active) return null;
  
  return payload;
}

export async function GET(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user || (user.role !== 'manager' && user.role !== 'admin')) {
      return NextResponse.json({ success: false, error: 'წვდომა უარყოფილია' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const availability = searchParams.get('availability') || undefined;
    const profession = searchParams.get('profession') || undefined;
    const minExperience = searchParams.get('minExperience') ? parseInt(searchParams.get('minExperience')!) : undefined;
    const minRating = searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : undefined;
    const city = searchParams.get('city') || undefined;
    
    const skillsRaw = searchParams.get('skills');
    const skills = skillsRaw ? skillsRaw.split(',').map(s => s.trim()).filter(Boolean) : undefined;
    
    const languagesRaw = searchParams.get('languages');
    const languages = languagesRaw ? languagesRaw.split(',').map(l => l.trim()).filter(Boolean) : undefined;

    const minHourlyRate = searchParams.get('minHourlyRate') ? parseFloat(searchParams.get('minHourlyRate')!) : undefined;
    const maxHourlyRate = searchParams.get('maxHourlyRate') ? parseFloat(searchParams.get('maxHourlyRate')!) : undefined;
    const minCompletedJobs = searchParams.get('minCompletedJobs') ? parseInt(searchParams.get('minCompletedJobs')!) : undefined;
    
    const sortBy = (searchParams.get('sortBy') as any) || undefined;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : (page ? 10 : 100);

    const result = await searchAndFilterWorkers({
      search,
      availability,
      profession,
      minExperience,
      minRating,
      city,
      skills,
      languages,
      minHourlyRate,
      maxHourlyRate,
      minCompletedJobs,
      sortBy,
      page,
      limit
    });

    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (err: any) {
    console.error('Workers GET API Error:', err);
    return NextResponse.json({ success: false, error: 'მუშების სიის ჩატვირთვა ვერ მოხერხდა' }, { status: 500 });
  }
}
