import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  showPulse?: boolean;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, showPulse, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn("relative h-4 w-full overflow-hidden rounded-full bg-secondary", className)}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all relative"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    >
      {showPulse && (
        <div 
          className="absolute inset-0 w-[150%] animate-sweep-pulse pointer-events-none"
          style={{
            background: "linear-gradient(90deg, transparent 0%, hsl(var(--primary-foreground) / 0.4) 50%, transparent 100%)",
            mixBlendMode: "overlay",
          }}
        />
      )}
    </ProgressPrimitive.Indicator>
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
