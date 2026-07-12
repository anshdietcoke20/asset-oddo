import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeTone =
  | "neutral"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "trading-up"
  | "trading-down";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-surface-elevated-dark text-body",
  primary: "bg-primary-disabled text-primary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/15 text-danger",
  info: "bg-info/15 text-info",
  "trading-up": "bg-trading-up/15 text-trading-up",
  "trading-down": "bg-trading-down/15 text-trading-down",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-0.5 text-caption",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
