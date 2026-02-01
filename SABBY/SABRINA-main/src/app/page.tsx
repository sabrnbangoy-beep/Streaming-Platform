import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Video } from '@/lib/types';
import VideoCard from '@/components/VideoCard';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Clapperboard, PlusCircle } from 'lucide-react';

async function getVideos() {
  try {
    const videosCollection = collection(db, 'videos');
    const q = query(videosCollection, orderBy('uploadDate', 'desc'));
    const querySnapshot = await getDocs(q);
    const videos: Video[] = [];
    querySnapshot.forEach(doc => {
      videos.push({ id: doc.id, ...doc.data() } as Video);
    });
    return videos;
  } catch (error) {
    console.error("Error fetching videos: ", error);
    return [];
  }
}

export default async function Home() {
  const videos = await getVideos();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col items-center justify-center text-center">
         <Clapperboard className="h-16 w-16 mb-4 text-primary" />
        <h1 className="text-4xl font-bold tracking-tight font-headline">Welcome to SportsCast</h1>
        <p className="mt-2 text-lg text-muted-foreground">Your home for community-driven sports content.</p>
        <Button asChild className="mt-6">
          <Link href="/dashboard/upload"><PlusCircle className="mr-2"/> Upload Your Video</Link>
        </Button>
      </div>

      {videos.length > 0 ? (
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
          {videos.map(video => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted bg-card p-12 text-center">
            <Clapperboard className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">No videos yet</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              Be the first to share your epic sports moments!
            </p>
        </div>
      )}
    </div>
  );
}

export const revalidate = 60; // Revalidate every 60 seconds
