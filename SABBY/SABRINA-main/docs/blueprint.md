# **App Name**: SportsCast

## Core Features:

- User Authentication: Email and password authentication via Firebase Auth for secure access and video uploads.
- Video Upload: Logged-in users can upload sports videos (MP4), with storage in Firebase Storage.
- Metadata Storage: Save video metadata (title, description, sport type, uploader ID, upload date, thumbnail URL) in Cloud Firestore.
- Public Video Streaming: Public homepage displaying all published videos with an adaptive video player for seamless viewing.
- User Dashboard: Logged-in users can upload new videos, view, edit, and delete their uploads.
- Firebase Security Rules: Configure Firebase Storage rules: Authenticated users upload, everyone can stream; Firestore rules: Users manage their video metadata.
- Thumbnail Generation: Generative AI tool that will allow the site to create thumbnails based on video upload and user instructions.

## Style Guidelines:

- Primary color: Vibrant orange (#FF7849) to evoke energy and excitement associated with sports.
- Background color: Light orange (#FFF2EC) for a bright and clean feel.
- Accent color: Yellow-orange (#FF974A) for interactive elements and calls to action.
- Body and headline font: 'Inter', a sans-serif, for a clean, modern user experience.
- Use clear and recognizable icons for video categories and user actions.
- Responsive layout with a focus on video previews and easy navigation.
- Subtle transitions and animations to enhance user engagement during video playback and navigation.