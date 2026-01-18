import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  size?: "small" | "medium" | "large";
}

export const LoadingSpinner = ({
  className,
  size = "medium",
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    small: "w-4 h-4 border-2",
    medium: "w-6 h-6 border-2",
    large: "w-8 h-8 border-3",
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]",
          sizeClasses[size]
        )}
        role="status"
      >
        <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
          Loading...
        </span>
      </div>
    </div>
  );
};
