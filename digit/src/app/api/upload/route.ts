import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/jwt';
import cloudinary from '@/lib/cloudinary';
import { UploadApiResponse } from 'cloudinary';

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

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'ფაილი არ არის ატვირთული' }, { status: 400 });
    }

    // 1. Accept only image files
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ success: false, error: 'დასაშვებია მხოლოდ სურათების ატვირთვა' }, { status: 400 });
    }

    // 2. Maximum size 5MB
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ success: false, error: 'ფაილის ზომა არ უნდა აღემატებოდეს 5MB-ს' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 3. Upload directly to Cloudinary using upload_stream
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'digit_uploads',
          resource_type: 'image',
        },
        (error, uploadResult) => {
          if (error) {
            reject(error);
          } else if (!uploadResult) {
            reject(new Error('Cloudinary upload returned no result'));
          } else {
            resolve(uploadResult);
          }
        }
      ).end(buffer);
    });

    // 4. Return the Cloudinary secure URL in the API response
    const fileUrl = result.secure_url;

    return NextResponse.json({ success: true, url: fileUrl });
  } catch (err: any) {
    console.error('Upload API Error:', err);
    return NextResponse.json({ success: false, error: 'ფაილის ატვირთვისას დაფიქსირდა შეცდომა' }, { status: 500 });
  }
}
