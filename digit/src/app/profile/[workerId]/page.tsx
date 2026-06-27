import { getSession } from '@/lib/session';
import { getFullWorkerProfile } from '@/lib/queries/workerProfiles';
import { getUserById } from '@/lib/queries/users';
import { redirect, notFound } from 'next/navigation';
import ProfileClient from './ProfileClient';

export default async function ProfilePage({
  params
}: {
  params: Promise<{ workerId: string }>
}) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const { workerId } = await params;
  
  // 1. Verify that the user exists and is a worker
  const user = await getUserById(workerId);
  if (!user || user.role !== 'worker') {
    notFound();
  }

  // 2. Load the profile details (will auto-create a blank one if needed)
  const initialData = await getFullWorkerProfile(workerId);
  const isOwner = session.user.id === workerId || session.user.role === 'admin';

  return (
    <ProfileClient 
      initialData={JSON.parse(JSON.stringify(initialData))} 
      currentUser={session.user} 
      isOwner={isOwner} 
      workerId={workerId} 
    />
  );
}
