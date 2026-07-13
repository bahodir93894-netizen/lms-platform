import { Spinner } from "@/components/ui/spinner";

interface LoadingSpinnerProps {
  /** Whether to show as full-page overlay */
  fullPage?: boolean;
  /** Custom loading message */
  message?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "w-5 h-5",
  md: "w-8 h-8",
  lg: "w-12 h-12",
};

/**
 * Reusable loading spinner with optional full-page overlay.
 * 
 * @example
 * ```tsx
 * <LoadingSpinner />
 * <LoadingSpinner fullPage message="Kurslar yuklanmoqda..." />
 * <LoadingSpinner size="sm" message="Saqlanmoqda..." />
 * ```
 */
export function LoadingSpinner({
  fullPage = false,
  message = "Yuklanmoqda...",
  size = "md",
}: LoadingSpinnerProps) {
  if (fullPage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner className={sizeClasses[size]} />
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center gap-3">
        <Spinner className={sizeClasses[size]} />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

/** Centered spinner for inline content areas */
export function InlineSpinner({ message = "Yuklanmoqda..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <Spinner className="w-8 h-8" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
