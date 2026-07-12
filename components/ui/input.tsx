import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  tone?: "dark" | "light";
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, tone = "dark", error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-10 w-full rounded-lg px-3 text-body-md outline-none transition-colors",
          tone === "dark" && "bg-surface-card-dark text-on-dark placeholder:text-muted",
          tone === "light" &&
            "bg-canvas-light text-ink border border-hairline-on-light placeholder:text-muted",
          error && "ring-2 ring-danger",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1 block text-caption text-muted-strong", className)}
      {...props}
    />
  );
}

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="mt-1 text-caption text-danger">{children}</p>;
}

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { tone?: "dark" | "light" }
>(({ className, tone = "dark", ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={cn(
        "h-10 w-full rounded-lg px-3 text-body-md outline-none transition-colors",
        tone === "dark" && "bg-surface-card-dark text-on-dark",
        tone === "light" && "bg-canvas-light text-ink border border-hairline-on-light",
        className,
      )}
      {...props}
    />
  );
});
Select.displayName = "Select";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { tone?: "dark" | "light" }
>(({ className, tone = "dark", ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-lg px-3 py-2 text-body-md outline-none transition-colors",
        tone === "dark" && "bg-surface-card-dark text-on-dark placeholder:text-muted",
        tone === "light" &&
          "bg-canvas-light text-ink border border-hairline-on-light placeholder:text-muted",
        className,
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";
