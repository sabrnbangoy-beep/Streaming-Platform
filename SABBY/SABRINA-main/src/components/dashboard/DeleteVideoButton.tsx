'use client'

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { deleteDoc, doc } from 'firebase/firestore';
import { deleteObject, ref } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import type { Video } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface DeleteVideoButtonProps {
  video: Video;
  children: React.ReactNode;
}

export default function DeleteVideoButton({ video, children }: DeleteVideoButtonProps) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setLoading(true);
    try {
      // Delete Firestore document
      await deleteDoc(doc(db, 'videos', video.id));

      // Delete video from Storage
      const videoRef = ref(storage, video.videoUrl);
      await deleteObject(videoRef);

      // Delete thumbnail from Storage
      const thumbnailRef = ref(storage, video.thumbnailUrl);
      await deleteObject(thumbnailRef);

      toast({
        title: 'Success',
        description: 'Video deleted successfully.',
      });
      setOpen(false);
    } catch (error: any) {
      console.error('Error deleting video:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to delete video: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your video
            and remove its data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={loading} className="bg-destructive hover:bg-destructive/90">
             {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
