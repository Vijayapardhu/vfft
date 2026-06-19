"use client";
import { useState, useCallback, useRef, useEffect } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export interface ToastInput {
  message: string;
  type?: ToastType;
}

const TOAST_DURATION = 4000;
let toastId = 0;
let globalListeners: Array<(toast: Toast) => void> = [];

/** Global toast function — call from anywhere without a hook. */
export function toast(input: string | ToastInput) {
  const id = String(++toastId);
  const t: Toast =
    typeof input === "string"
      ? { id, message: input, type: "info" }
      : { id, message: input.message, type: input.type ?? "info" };
  globalListeners.forEach((fn) => fn(t));
  return id;
}

/** Hook for components that need to render the Toaster. */
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = String(++toastId);
      const toastItem: Toast = { id, message, type };
      setToasts((prev) => [...prev, toastItem]);
      timers.current.set(
        id,
        setTimeout(() => removeToast(id), TOAST_DURATION),
      );
      return id;
    },
    [removeToast],
  );

  useEffect(() => {
    function handler(t: Toast) {
      setToasts((prev) => [...prev, t]);
      timers.current.set(
        t.id,
        setTimeout(() => removeToast(t.id), TOAST_DURATION),
      );
    }
    globalListeners.push(handler);
    return () => {
      globalListeners = globalListeners.filter((fn) => fn !== handler);
    };
  }, [removeToast]);

  return { toasts, addToast, removeToast };
}
