import UploadForm from '@/components/dashboard/UploadForm';
import { Card, CardContent } from '@/components/ui/card';

export default function UploadPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Upload a New Video</h1>
        <p className="text-muted-foreground">Share your best sports moments with the world.</p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <UploadForm />
        </CardContent>
      </Card>
    </div>
  );
}
