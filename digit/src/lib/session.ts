import { cookies } from 'next/headers';
import { verifyJWT } from './jwt';
import { getUserById, getBusinessByUserId } from './queries/users';

export async function getSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;

    const payload = await verifyJWT(token);
    if (!payload || !payload.is_active) return null;

    const user = await getUserById(payload.id);
    if (!user || !user.is_active) return null;

    let business = null;
    if (user.role === 'business') {
      business = await getBusinessByUserId(user.id);
    }

    return {
      user: {
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        phone: user.phone,
        role: user.role,
        is_active: user.is_active,
      },
      business,
    };
  } catch (err) {
    console.error('Session helper error:', err);
    return null;
  }
}
