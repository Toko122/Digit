import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/jwt';
import { submitReview } from '@/lib/services/review.service';
import { z } from 'zod';

const reviewSchema = z.object({
  taskId: z.string().uuid('არასწორი დავალების ID'),
  workerId: z.string().uuid('არასწორი მუშის ID'),
  rating: z.number().min(1).max(5),
  reviewText: z.string().max(1000, 'ტექსტი არ უნდა აღემატებოდეს 1000 სიმბოლოს').nullable().optional(),
});

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  
  const payload = await verifyJWT(token);
  if (!payload || !payload.is_active) return null;
  
  return payload;
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'ავტორიზაცია საჭიროა' }, { status: 401 });
    }

    if (user.role !== 'business' && user.role !== 'manager') {
      return NextResponse.json({ success: false, error: 'წვდომა უარყოფილია - მხოლოდ დამკვეთს ან მენეჯერს შეუძლია შეფასების დატოვება' }, { status: 403 });
    }

    const body = await request.json();
    const result = reviewSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error.issues[0]?.message || 'არასწორი მონაცემები' }, { status: 400 });
    }

    const { taskId, workerId, rating, reviewText } = result.data;

    await submitReview({
      taskId,
      workerId,
      reviewerId: user.id,
      reviewerRole: user.role,
      rating,
      reviewText: reviewText || null,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Review POST API Error:', err);
    let status = 500;
    const errMsg = err.message || '';
    if (errMsg.includes('წვდომა უარყოფილია')) {
      status = 403;
    } else if (errMsg.includes('ვერ მოიძებნა')) {
      status = 404;
    } else if (
      errMsg.includes('რეიტინგი უნდა იყოს') || 
      errMsg.includes('არ ყოფილა დანიშნული') ||
      errMsg.includes('შეფასების ტექსტი')
    ) {
      status = 400;
    }
    return NextResponse.json({ success: false, error: err.message || 'შეფასების დატოვება ვერ მოხერხდა' }, { status });
  }
}
