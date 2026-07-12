import * as React from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "primary"
  | "primary-pill"
  | "secondary-dark"
  | "secondary-light"
  | "tertiary"
  | "trading-up"
  | "trading-down"
  | "subscribe"
  | "danger";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-on-primary rounded-md h-10 px-6 hover:bg-primary-active active:bg-primary-active disabled:bg-primary-disabled disabled:text-muted disabled:cursor-not-allowed",
  "primary-pill":
    "bg-primary text-on-primary rounded-full h-11 px-8 hover:bg-primary-active active:bg-primary-active disabled:bg-primary-disabled disabled:text-muted disabled:cursor-not-allowed",
  "secondary-dark":
    "bg-surface-card-dark text-on-dark rounded-md h-10 px-6 hover:bg-surface-elevated-dark disabled:opacity-40 disabled:cursor-not-allowed",
  "secondary-light":
    "bg-canvas-light text-ink border border-hairline-on-light rounded-md h-10 px-6 hover:bg-surface-strong-light disabled:opacity-40 disabled:cursor-not-allowed",
  tertiary:
    "bg-transparent text-body rounded-md h-10 px-2 hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed",
  "trading-up":
    "bg-trading-up text-on-dark rounded-sm h-9 px-5 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed",
  "trading-down":
    "bg-trading-down text-on-dark rounded-sm h-9 px-5 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed",
  subscribe:
    "bg-primary text-on-primary rounded-sm h-7 px-4 hover:bg-primary-active disabled:bg-primary-disabled disabled:cursor-not-allowed",
  danger:
    "bg-danger text-on-dark rounded-md h-10 px-6 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed",
};

export function buttonVariants(variant: ButtonVariant = "primary", className?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 text-button transition-colors cursor-pointer whitespace-nowrap",
    variantClasses[variant],
    className,
  );
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={buttonVariants(variant, className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
