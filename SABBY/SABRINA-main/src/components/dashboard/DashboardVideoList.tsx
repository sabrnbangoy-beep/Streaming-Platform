'use client'

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import type { Video } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Trash2, Eye, Heart } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '../ui/skeleton';
import DeleteVideoButton from './DeleteVideoButton';
import EditVideoDialog from './EditVideoDialog';
import Link from 'next/link';

export default function DashboardVideoList() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);

  useEffect(() => {
    if (!user) {
        setLoading(false);
        return;
    };

    const videosCollection = collection(db, 'videos');
    const q = query(
      videosCollection,
      where('uploaderId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userVideos: Video[] = [];
      querySnapshot.forEach((doc) => {
        userVideos.push({ id: doc.id, ...doc.data() } as Video);
      });
      
      // Sort videos by date on the client-side to avoid needing a composite index
      userVideos.sort((a, b) => {
        const dateA = a.uploadDate?.toDate ? a.uploadDate.toDate().getTime() : 0;
        const dateB = b.uploadDate?.toDate ? b.uploadDate.toDate().getTime() : 0;
        return dateB - dateA;
      });

      setVideos(userVideos);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching videos in real-time:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-16 w-24 rounded-md" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                    <Skeleton className="h-8 w-8" />
                </div>
            ))}
        </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed rounded-lg">
        <h3 className="text-xl font-semibold">No videos uploaded yet</h3>
        <p className="text-muted-foreground mt-2">
          Click the button above to upload your first video!
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Thumbnail</TableHead>
              <TableHead>Title & Sport</TableHead>
              <TableHead className="hidden md:table-cell">Uploaded</TableHead>
              <TableHead className="hidden sm:table-cell">Views</TableHead>
              <TableHead className="hidden sm:table-cell">Likes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {videos.map((video) => (
              <TableRow key={video.id}>
                <TableCell>
                  <Link href={`/watch/${video.id}`}>
                    <Image
                      src={video.thumbnailUrl}
                      alt={video.title}
                      width={100}
                      height={56}
                      className="rounded-md object-cover aspect-video"
                    />
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/watch/${video.id}`} className="font-medium hover:underline">{video.title}</Link>
                  <div className="text-sm text-muted-foreground">
                    <Badge variant="outline">{video.sport}</Badge>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {video.uploadDate?.toDate ? formatDistanceToNow(video.uploadDate.toDate(), { addSuffix: true }) : ''}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <div className="flex items-center justify-start gap-1">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{video.views ?? 0}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                   <div className="flex items-center justify-start gap-1">
                    <Heart className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{video.likes ?? 0}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingVideo(video)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DeleteVideoButton video={video}>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                            <span className="text-destructive">Delete</span>
                        </DropdownMenuItem>
                      </DeleteVideoButton>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {editingVideo && (
        <EditVideoDialog 
            video={editingVideo} 
            isOpen={!!editingVideo}
            onOpenChange={(isOpen) => {
                if (!isOpen) setEditingVideo(null);
            }}
        />
      )}
    </>
  );
}
