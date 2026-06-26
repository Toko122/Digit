import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { getUserByEmail } from '@/lib/queries/users';
import { signJWT } from '@/lib/jwt';

const loginSchema = z.object({
  email: z.string().email("ელ-ფოსტა არასწორია"),
  password: z.string().min(1, "პაროლის შეყვანა სავალდებულოა"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "არასწორი მონაცემები";
      return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
    }

    const { email, password } = result.data;

    // Fetch user
    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ success: false, error: "ელ-ფოსტა ან პაროლი არასწორია" }, { status: 401 });
    }

    // Check if user is active
    if (!user.is_active) {
      return NextResponse.json({ success: false, error: "თქვენი ანგარიში დეაქტივირებულია ადმინისტრატორის მიერ" }, { status: 403 });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json({ success: false, error: "ელ-ფოსტა ან პაროლი არასწორია" }, { status: 401 });
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
    console.error('Login API Error:', err);
    return NextResponse.json({ success: false, error: "სისტემაში შესვლისას დაფიქსირდა შეცდომა" }, { status: 500 });
  }
}
