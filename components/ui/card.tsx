import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: "dark" | "light" | "elevated";
}

export function Card({ className, tone = "dark", ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl p-6",
        tone === "dark" && "bg-surface-card-dark text-on-dark",
        tone === "elevated" && "bg-surface-elevated-dark text-on-dark",
        tone === "light" && "bg-canvas-light text-ink border border-hairline-on-light",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-3 flex items-center justify-between", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-title-sm", className)} {...props} />;
}
