import React from "react";

type YouTubePlayerProps = {
  url: string;
  title?: string;
  autoplay?: boolean;
  controls?: boolean;
  className?: string;
};

const getYouTubeId = (url: string): string | null => {
  const regex =
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  url,
  title = "YouTube video",
  autoplay = false,
  controls = true,
  className = "",
}) => {
  if (!url) {
    return <div className="text-gray-400">No video provided</div>;
  }

  const videoId = getYouTubeId(url);

  if (!videoId) {
    return <div className="text-red-500 text-sm">Invalid YouTube URL</div>;
  }

  const params = new URLSearchParams({
    autoplay: autoplay ? "1" : "0",
    controls: controls ? "1" : "0",
    modestbranding: "1",
    rel: "0",
  });

  const embedUrl = `https://www.youtube.com/embed/${videoId}?${params.toString()}`;

  return (
    <div className={`w-full aspect-video rounded-xl overflow-hidden shadow-md ${className}`}>
      <iframe
        src={embedUrl}
        title={title}
        className="carpet"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
};

export default YouTubePlayer;