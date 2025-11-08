import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  showPulse?: boolean;
  isActive?: boolean;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, showPulse, isActive, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-visible rounded-full",
      isActive ? "bg-primary/20 animate-progress-glow" : "bg-secondary",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        "h-full w-full flex-1 transition-all relative rounded-full",
        isActive 
          ? "bg-gradient-to-r from-primary via-primary/80 to-primary animate-progress-shimmer"
          : "bg-primary"
      )}
      style={{ 
        transform: `translateX(-${100 - (value || 0)}%)`,
        ...(isActive && {
          backgroundSize: "200% 100%",
        })
      }}
    >
      {showPulse && (
        <>
          <div 
            className="absolute inset-0 w-[200%] animate-sweep-pulse pointer-events-none"
            style={{
              background: "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.9) 50%, transparent 100%)",
              mixBlendMode: "overlay",
            }}
          />
          {/* Particles */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute bottom-0 w-1.5 h-1.5 rounded-full bg-primary-foreground animate-particle-rise pointer-events-none"
              style={{
                left: `${10 + i * 12}%`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </>
      )}
    </ProgressPrimitive.Indicator>
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
