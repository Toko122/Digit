import { NextResponse } from 'next/server';
import { getWorkerReviews } from '@/lib/queries/workerProfiles';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ workerId: string }> }
) {
  try {
    const { workerId } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '5');

    const result = await getWorkerReviews(workerId, page, limit);

    return NextResponse.json({
      success: true,
      ...result,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit)
    });
  } catch (err: any) {
    console.error('Worker reviews GET API Error:', err);
    return NextResponse.json({ success: false, error: 'შეფასებების ჩატვირთვა ვერ მოხერხდა' }, { status: 500 });
  }
}
