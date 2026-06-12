import { cn } from "@/lib/utils";

interface NotificationBadgeProps {
  count?: number;
  dot?: boolean;
  className?: string;
}

export function NotificationBadge({ count, dot = false, className }: NotificationBadgeProps) {
  if (!count && !dot) return null;

  if (dot || !count) {
    return (
      <span
        className={cn(
          "inline-block w-2 h-2 rounded-full bg-red-500 shrink-0",
          className,
        )}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-red-500 text-white font-bold leading-none shrink-0",
        count > 9 ? "min-w-[20px] h-5 text-[10px] px-1.5" : "w-5 h-5 text-[10px]",
        className,
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
