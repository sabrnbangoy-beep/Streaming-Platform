import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { notFound } from 'next/navigation';
import type { Video } from '@/lib/types';
import VideoPlayer from '@/components/VideoPlayer';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Eye, Heart } from 'lucide-react';

type WatchPageProps = {
  params: { id: string };
};

async function getVideo(id: string) {
  try {
    const videoDocRef = doc(db, 'videos', id);
    const videoDoc = await getDoc(videoDocRef);
    if (!videoDoc.exists()) {
      return null;
    }

    // Increment view count in a non-blocking way
    updateDoc(videoDocRef, {
      views: increment(1)
    }).catch(err => console.error("Failed to increment views", err)); // Log error if update fails

    return { id: videoDoc.id, ...videoDoc.data() } as Video;
  } catch (error) {
    console.error("Error fetching video:", error);
    return null;
  }
}

export default async function WatchPage({ params }: WatchPageProps) {
  const video = await getVideo(params.id);

  if (!video) {
    notFound();
  }

  const uploadDate = video.uploadDate?.toDate ? video.uploadDate.toDate() : new Date();

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <VideoPlayer src={video.videoUrl} />
      </div>
      <div className="space-y-4">
        <Badge variant="secondary">{video.sport}</Badge>
        <h1 className="text-4xl font-bold tracking-tight font-headline">{video.title}</h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <span>
                Uploaded on {format(uploadDate, 'MMMM d, yyyy')}
            </span>
            <div className="flex items-center gap-1.5">
                <Eye className="h-4 w-4" />
                <span>{video.views ?? 0} views</span>
            </div>
            <div className="flex items-center gap-1.5">
                <Heart className="h-4 w-4" />
                <span>{video.likes ?? 0} likes</span>
            </div>
        </div>
        <div className="prose prose-lg max-w-none dark:prose-invert text-foreground">
           <p>{video.description}</p>
        </div>
      </div>
    </div>
  );
}

export const revalidate = 60; // Revalidate every 60 seconds
