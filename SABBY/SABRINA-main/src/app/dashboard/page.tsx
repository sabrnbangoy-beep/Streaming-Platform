import DashboardVideoList from '@/components/dashboard/DashboardVideoList';
import UploadVideoButton from '@/components/dashboard/UploadVideoButton';

export default async function DashboardPage() {
  // Since we can't reliably get the user on the server without a session library,
  // we will pass the fetching logic to a client component.
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">My Dashboard</h1>
          <p className="text-muted-foreground">Manage your uploaded videos.</p>
        </div>
        <UploadVideoButton />
      </div>
      <DashboardVideoList />
    </div>
  );
}
