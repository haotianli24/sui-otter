import { getGradientStyle } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface GradientAvatarProps {
  address: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  children?: React.ReactNode;
}

const sizeClasses = {
  sm: "h-8 w-8 text-sm",
  md: "h-12 w-12 text-base",
  lg: "h-16 w-16 text-lg",
  xl: "h-24 w-24 text-2xl",
};

export function GradientAvatar({ address, size = "md", className, children }: GradientAvatarProps) {
  const gradientStyle = getGradientStyle(address);
  const initials = address.slice(0, 2).toUpperCase();

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-bold text-white shadow-md",
        sizeClasses[size],
        className
      )}
      style={{ background: gradientStyle }}
    >
      {children || initials}
    </div>
  );
}

