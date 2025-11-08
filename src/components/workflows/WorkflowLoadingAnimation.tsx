import { useState } from "react";
import { Loader2 } from "lucide-react";

interface WorkflowLoadingAnimationProps {
  workflowName: string;
}

const videoMap: Record<string, string> = {
  finder_felix: '/videos/felix-ladeanimation.mp4',
  analyse_anna: '/videos/anna-ladeanimation.mp4',
  pitch_paul: '/videos/paul-ladeanimation.mp4',
  branding_britta: '/videos/britta-ladeanimation.mp4',
};

export function WorkflowLoadingAnimation({ workflowName }: WorkflowLoadingAnimationProps) {
  const [hasError, setHasError] = useState(false);
  const videoSrc = videoMap[workflowName];

  if (!videoSrc || hasError) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center py-4 animate-fade-in">
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        onError={() => setHasError(true)}
        className="max-w-[400px] max-h-[300px] w-full h-auto object-contain rounded-lg md:max-w-[400px] sm:max-w-[280px]"
      >
        <source src={videoSrc} type="video/mp4" />
      </video>
    </div>
  );
}
