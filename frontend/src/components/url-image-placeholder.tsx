import { cn } from "@/lib/utils";

interface UrlImagePlaceholderProps {
  title: string;
  className?: string;
}

export function UrlImagePlaceholder({ title, className }: UrlImagePlaceholderProps) {
  // Determine if we should use dark or light theme based on title length
  // This ensures the same URL always gets the same style without needing storage
  const isDark = title.length % 2 === 0;

  return (
    <div 
      className={cn(
        "w-full h-full flex items-center justify-center p-6 text-center transition-colors select-none",
        isDark ? "bg-zinc-950 text-zinc-50" : "bg-zinc-50 text-zinc-950",
        className
      )}
    >
      <span className="font-bold text-xl line-clamp-3 leading-tight tracking-tight break-words">
        {title || "Untitled Link"}
      </span>
    </div>
  );
}
