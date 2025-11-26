"use client";

import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Logo({ className, iconOnly = false, size = "md" }: LogoProps) {
  const heightMap = {
    sm: "h-6",
    md: "h-8",
    lg: "h-10",
    xl: "h-14",
  };

  return (
    <div className={cn("relative flex items-center select-none", className)}>
      <div
        className={cn(
          "relative overflow-hidden flex items-center",
          heightMap[size],
          // If iconOnly, force square aspect ratio to crop to the icon
          iconOnly ? "aspect-square w-auto" : "w-auto"
        )}
      >
        {/* Light Mode Logo (Black on White) */}
        <img
          src="/logo-light.png"
          alt="Linkerly"
          className={cn(
            "h-full max-w-none transition-all dark:hidden mix-blend-multiply",
            iconOnly ? "object-cover object-left w-auto" : "object-contain"
          )}
        />
        
        {/* Dark Mode Logo (White on Black) */}
        <img
          src="/logo-dark.png"
          alt="Linkerly"
          className={cn(
            "h-full max-w-none transition-all hidden dark:block mix-blend-screen",
            iconOnly ? "object-cover object-left w-auto" : "object-contain"
          )}
        />
      </div>
    </div>
  );
}
