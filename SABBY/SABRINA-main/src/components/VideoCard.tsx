import Link from 'next/link';
import Image from 'next/image';
import type { Video } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Eye, Heart } from 'lucide-react';

type VideoCardProps = {
  video: Video;
};

export default function VideoCard({ video }: VideoCardProps) {
  const uploadDate = video.uploadDate?.toDate ? video.uploadDate.toDate() : new Date();

  return (
    <Link href={`/watch/${video.id}`} className="group block">
      <div className="overflow-hidden rounded-lg shadow-md transition-shadow duration-300 group-hover:shadow-xl bg-card">
        <div className="relative aspect-video w-full">
          <Image
            src={video.thumbnailUrl || 'https://picsum.photos/seed/generic-sports/600/400'}
            alt={video.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint="sports video"
          />
        </div>
        <div className="p-4">
          <Badge variant="secondary" className="mb-2">{video.sport}</Badge>
          <h3 className="truncate text-lg font-semibold leading-tight text-foreground font-headline" title={video.title}>
            {video.title}
          </h3>
           <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
            <span>
                {formatDistanceToNow(uploadDate, { addSuffix: true })}
            </span>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>{video.views ?? 0}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    <span>{video.likes ?? 0}</span>
                </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
