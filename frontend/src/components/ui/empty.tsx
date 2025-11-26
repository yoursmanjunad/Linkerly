"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface EmptyProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export function Empty({
  title,
  description = "",
  actionLabel,
  onAction,
  icon,
  className,
}: EmptyProps) {
  return (
    <div
      className={cn(
        "w-full h-[350px] flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/40 p-8 text-center",
        className
      )}
    >
      <div className="flex flex-col items-center gap-4 max-w-sm">

        {/* Optional icon */}
        {icon && (
          <div className="p-4 rounded-full bg-muted border shadow-sm">
            {icon}
          </div>
        )}

        <h3 className="text-lg font-semibold">{title}</h3>

        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}

        {actionLabel && onAction && (
          <Button
            variant="default"
            size="sm"
            className="mt-2 active:scale-95 transition-all duration-200"
            onClick={onAction}
          >
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
