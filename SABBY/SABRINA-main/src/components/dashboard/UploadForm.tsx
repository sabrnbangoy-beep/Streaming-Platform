'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { generateVideoThumbnail } from '@/ai/flows/generate-video-thumbnail';
import { Loader2, Sparkles, Wand2 } from 'lucide-react';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import type { SportCategory } from '@/lib/types';

const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const ACCEPTED_VIDEO_TYPES = ["video/mp4"];
const MAX_THUMBNAIL_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const formSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  sport: z.enum(['Football', 'Basketball', 'Motorsports', 'Gaming', 'Other']),
  video: z
    .any()
    .refine(files => files?.length == 1, 'Video is required.')
    .refine(files => files?.[0]?.size <= MAX_VIDEO_SIZE, `Max file size is 50MB.`)
    .refine(
      files => ACCEPTED_VIDEO_TYPES.includes(files?.[0]?.type),
      "Please upload a video in MP4 format."
    ),
  thumbnailPrompt: z.string().optional(),
  thumbnailFile: z
    .any()
    .optional()
    .refine(files => !files || files?.length === 0 || files?.[0]?.size <= MAX_THUMBNAIL_SIZE, `Max thumbnail file size is 5MB.`)
    .refine(files => !files || files?.length === 0 || ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type), "Only .jpg, .png, and .webp formats are supported for thumbnails.")
});

type UploadFormValues = z.infer<typeof formSchema>;

interface UploadFormProps {
  onUploadComplete?: () => void;
}

const dataURIToBlob = (dataURI: string) => {
    const splitDataURI = dataURI.split(',');
    const byteString =
      splitDataURI[0].indexOf('base64') >= 0
        ? atob(splitDataURI[1])
        : decodeURI(splitDataURI[1]);
    const mimeString = splitDataURI[0].split(':')[1].split(';')[0];
  
    const ia = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
  
    return new Blob([ia], { type: mimeString });
};

export default function UploadForm({ onUploadComplete }: UploadFormProps) {
  const [loading, setLoading] = useState(false);
  const [generatingThumbnail, setGeneratingThumbnail] = useState(false);
  const [thumbnailDataUri, setThumbnailDataUri] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [status, setStatus] = useState('idle');

  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();

  const form = useForm<UploadFormValues>({
    resolver: zodResolver(formSchema),
  });

  const thumbnailFileWatcher = form.watch('thumbnailFile');

  useEffect(() => {
    if (thumbnailFileWatcher && thumbnailFileWatcher.length > 0) {
      const file = thumbnailFileWatcher[0];
      const previewUrl = URL.createObjectURL(file);
      setThumbnailPreview(previewUrl);
      setThumbnailDataUri(null); // Clear AI thumbnail if a file is chosen
      return () => URL.revokeObjectURL(previewUrl);
    } else if (!thumbnailDataUri) {
        setThumbnailPreview(null);
    }
  }, [thumbnailFileWatcher, thumbnailDataUri]);
  
  const handleGenerateThumbnail = async () => {
    const prompt = form.getValues('thumbnailPrompt');
    if (!prompt) {
      toast({
        variant: 'destructive',
        title: 'Prompt required',
        description: 'Please enter a prompt to generate a thumbnail.',
      });
      return;
    }
    setGeneratingThumbnail(true);
    try {
      const result = await generateVideoThumbnail({ prompt });
      if (result.thumbnailDataUri) {
        setThumbnailDataUri(result.thumbnailDataUri);
        setThumbnailPreview(result.thumbnailDataUri);
        form.setValue('thumbnailFile', undefined, { shouldValidate: true });
        toast({
          title: 'Thumbnail generated!',
          description: 'A new thumbnail has been created based on your prompt.',
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Generation failed',
        description: 'Could not generate a thumbnail. Please try again.',
      });
    } finally {
      setGeneratingThumbnail(false);
    }
  };
  
  const uploadFile = (file: File | Blob, path: string, onProgress?: (progress: number) => void) => {
    return new Promise<string>((resolve, reject) => {
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => reject(error),
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then(resolve);
        }
      );
    });
  };

  const onSubmit = async (data: UploadFormValues) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Not authenticated' });
      return;
    }
    setLoading(true);
    
    try {
      const uploadId = Date.now();
      
      const videoFile: File = data.video[0];
      const videoPath = `users/${user.uid}/videos/${uploadId}/${videoFile.name}`;
      
      const thumbnailFile: File | undefined = data.thumbnailFile?.[0];
      const thumbnailPath = `users/${user.uid}/videos/${uploadId}/thumbnail.png`;

      setStatus('Uploading video...');
      const videoUploadPromise = uploadFile(videoFile, videoPath, (progress) => {
        setUploadProgress(progress);
      });
      
      let thumbnailUploadPromise: Promise<string>;
      if (thumbnailFile) {
        setStatus('Uploading video and thumbnail...');
        thumbnailUploadPromise = uploadFile(thumbnailFile, thumbnailPath);
      } else if (thumbnailDataUri) {
         setStatus('Uploading video and thumbnail...');
        thumbnailUploadPromise = uploadFile(dataURIToBlob(thumbnailDataUri), thumbnailPath);
      } else {
        throw new Error("Thumbnail is missing. Please upload one or generate one with AI.");
      }

      const [videoUrl, thumbnailUrl] = await Promise.all([videoUploadPromise, thumbnailUploadPromise]);
      
      setStatus('Finalizing...');
      await addDoc(collection(db, 'videos'), {
        uploaderId: user.uid,
        title: data.title,
        description: data.description,
        sport: data.sport,
        videoUrl,
        thumbnailUrl,
        uploadDate: serverTimestamp(),
        views: 0,
        likes: 0,
      });
      
      toast({ title: 'Upload successful!', description: 'Your video is now live.' });
      if (onUploadComplete) {
        onUploadComplete();
      }
      router.push('/dashboard');
      
    } catch (error: any) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Upload failed', description: error.message });
    } finally {
      setLoading(false);
      setStatus('idle');
      setUploadProgress(null);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      
      <div className="space-y-2">
        <Label htmlFor="video">Video File (MP4 only, max 50MB)</Label>
        <Input id="video" type="file" accept="video/mp4" {...form.register('video')} />
        {form.formState.errors.video && (
          <p className="text-sm text-destructive">{form.formState.errors.video.message as string}</p>
        )}
      </div>

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
        <Select onValueChange={(value) => form.setValue('sport', value as SportCategory)} >
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

      <div className="space-y-4 rounded-lg border p-4">
        <h3 className="text-lg font-semibold">Video Thumbnail</h3>
        <p className="text-sm text-muted-foreground">
          Upload a custom thumbnail or generate one using AI.
        </p>

        <div className="space-y-2">
          <Label htmlFor="thumbnailFile">Upload from device</Label>
          <Input id="thumbnailFile" type="file" accept="image/png, image/jpeg, image/webp" {...form.register('thumbnailFile')} />
          {form.formState.errors.thumbnailFile && (
            <p className="text-sm text-destructive">{form.formState.errors.thumbnailFile.message as string}</p>
          )}
        </div>
        
        <div className="relative my-4 flex items-center">
            <div className="flex-grow border-t border-muted"></div>
            <span className="mx-4 flex-shrink text-xs text-muted-foreground">OR</span>
            <div className="flex-grow border-t border-muted"></div>
        </div>

        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Generate with AI</h4>
            </div>
            <div className="flex gap-2">
                <Input id="thumbnailPrompt" placeholder="e.g., A dramatic slam dunk" {...form.register('thumbnailPrompt')} />
                <Button type="button" onClick={handleGenerateThumbnail} disabled={generatingThumbnail}>
                    {generatingThumbnail ? <Loader2 className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4"/>}
                    <span className="ml-2 hidden sm:inline">Generate</span>
                </Button>
            </div>
        </div>
      </div>
      
      {thumbnailPreview && (
        <div className="space-y-2">
            <Label>Thumbnail Preview</Label>
            <div className="mt-2 aspect-video w-full max-w-sm overflow-hidden rounded-md border">
                <Image src={thumbnailPreview} alt="Thumbnail preview" width={1280} height={720} className="object-cover"/>
            </div>
        </div>
      )}

      {loading && (
        <div className="space-y-2">
          <Label>{status}</Label>
          {uploadProgress !== null && <Progress value={uploadProgress} />}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={loading || !thumbnailPreview}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Upload Video
      </Button>
    </form>
  );
}
