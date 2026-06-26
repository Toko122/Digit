import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('token');
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Logout API Error:', err);
    return NextResponse.json({ success: false, error: "სისტემიდან გამოსვლისას დაფიქსირდა შეცდომა" }, { status: 500 });
  }
}
