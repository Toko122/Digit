import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { getUserByEmail, createUser, createBusiness } from '@/lib/queries/users';
import { signJWT } from '@/lib/jwt';

const registerSchema = z.object({
  fullname: z.string().min(2, "სახელი უნდა შედგებოდეს მინიმუმ 2 სიმბოლოსგან"),
  email: z.string().email("ელ-ფოსტა არასწორია"),
  password: z.string().min(6, "პაროლი უნდა იყოს მინიმუმ 6 სიმბოლო"),
  phone: z.string().nullable().optional(),
  role: z.enum(['business', 'worker']),
  businessName: z.string().nullable().optional(),
}).refine((data) => {
  if (data.role === 'business' && (!data.businessName || data.businessName.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: "კომპანიის სახელი სავალდებულოა ბიზნეს ანგარიშისთვის",
  path: ["businessName"]
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "არასწორი მონაცემები";
      return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
    }

    const { fullname, email, password, phone, role, businessName } = result.data;

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json({ success: false, error: "მომხმარებელი ამ ელ-ფოსტით უკვე არსებობს" }, { status: 400 });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await createUser(fullname, email, passwordHash, phone || null, role);

    // If role is business, create business record
    if (role === 'business' && businessName) {
      await createBusiness(user.id, businessName);
    }

    // Sign JWT
    const token = await signJWT({
      id: user.id,
      fullname: user.fullname,
      email: user.email,
      role: user.role,
      is_active: user.is_active
    });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 24 hours
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        role: user.role
      }
    });

  } catch (err: any) {
    console.error('Registration API Error:', err);
    return NextResponse.json({ success: false, error: "რეგისტრაციისას დაფიქსირდა შეცდომა" }, { status: 500 });
  }
}
