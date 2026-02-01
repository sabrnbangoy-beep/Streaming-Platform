'use client';

type VideoPlayerProps = {
  src: string;
};

export default function VideoPlayer({ src }: VideoPlayerProps) {
  return (
    <div className="w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
      <video
        className="w-full h-full"
        controls
        autoPlay
        src={src}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
