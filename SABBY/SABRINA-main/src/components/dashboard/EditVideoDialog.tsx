'use client'

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Video, SportCategory } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface EditVideoDialogProps {
  video: Video;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  sport: z.enum(['Football', 'Basketball', 'Motorsports', 'Gaming', 'Other']),
});

type EditFormValues = z.infer<typeof formSchema>;

export default function EditVideoDialog({ video, isOpen, onOpenChange }: EditVideoDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<EditFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: video.title,
      description: video.description,
      sport: video.sport as SportCategory,
    },
  });

  const onSubmit = async (data: EditFormValues) => {
    setLoading(true);
    try {
      const videoRef = doc(db, 'videos', video.id);
      await updateDoc(videoRef, {
        title: data.title,
        description: data.description,
        sport: data.sport,
      });
      toast({ title: 'Success', description: 'Video details updated.' });
      onOpenChange(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: `Failed to update: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Video Details</DialogTitle>
          <DialogDescription>
            Make changes to your video here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...form.register('title')} />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...form.register('description')} />
            {form.formState.errors.description && (
              <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="sport">Sport Category</Label>
            <Select onValueChange={(value) => form.setValue('sport', value as SportCategory)} defaultValue={video.sport}>
              <SelectTrigger>
                <SelectValue placeholder="Select a sport" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Football">Football</SelectItem>
                <SelectItem value="Basketball">Basketball</SelectItem>
                <SelectItem value="Motorsports">Motorsports</SelectItem>
                <SelectItem value="Gaming">Gaming</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.sport && (
              <p className="text-sm text-destructive">{form.formState.errors.sport.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
