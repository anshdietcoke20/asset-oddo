"use client";

import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { cn } from "@/lib/utils";

type ToastTone = "default" | "success" | "danger";

interface ToastItem {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
}

let idCounter = 0;
let listeners: Array<(items: ToastItem[]) => void> = [];
let toasts: ToastItem[] = [];

function emit() {
  listeners.forEach((listener) => listener(toasts));
}

export function toast(input: { title: string; description?: string; tone?: ToastTone }) {
  const item: ToastItem = { id: ++idCounter, tone: "default", ...input };
  toasts = [...toasts, item];
  emit();
}

function dismissToast(id: number) {
  toasts = toasts.filter((item) => item.id !== id);
  emit();
}

const toneClasses: Record<ToastTone, string> = {
  default: "border-hairline-on-dark",
  success: "border-success",
  danger: "border-danger",
};

export function Toaster() {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  React.useEffect(() => {
    listeners.push(setItems);
    return () => {
      listeners = listeners.filter((listener) => listener !== setItems);
    };
  }, []);

  return (
    <ToastPrimitive.Provider swipeDirection="right">
      {items.map((item) => (
        <ToastPrimitive.Root
          key={item.id}
          duration={4000}
          onOpenChange={(open) => !open && dismissToast(item.id)}
          className={cn(
            "rounded-lg border bg-surface-card-dark px-4 py-3 text-on-dark shadow-lg",
            toneClasses[item.tone],
          )}
        >
          <ToastPrimitive.Title className="text-title-sm">{item.title}</ToastPrimitive.Title>
          {item.description && (
            <ToastPrimitive.Description className="mt-1 text-body-sm text-muted">
              {item.description}
            </ToastPrimitive.Description>
          )}
        </ToastPrimitive.Root>
      ))}
      <ToastPrimitive.Viewport className="fixed bottom-0 right-0 z-50 flex w-96 max-w-full flex-col gap-2 p-6 outline-none" />
    </ToastPrimitive.Provider>
  );
}
