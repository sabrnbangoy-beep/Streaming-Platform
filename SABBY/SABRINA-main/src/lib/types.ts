import type { Timestamp } from 'firebase/firestore';

export type Video = {
  id: string;
  title: string;
  description: string;
  sport: SportCategory;
  videoUrl: string;
  thumbnailUrl: string;
  uploaderId: string;
  uploadDate: Timestamp;
  views: number;
  likes: number;
};

export type SportCategory = 'Football' | 'Basketball' | 'Motorsports' | 'Gaming' | 'Other';
