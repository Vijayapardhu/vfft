"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertTriangle, Info, AlertOctagon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Toast, ToastType } from "@/hooks/useToast";

const iconMap: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="h-5 w-5" />,
  error: <AlertOctagon className="h-5 w-5" />,
  info: <Info className="h-5 w-5" />,
  warning: <AlertTriangle className="h-5 w-5" />,
};

const colorMap: Record<ToastType, string> = {
  success: "bg-vgreen",
  error: "bg-vred",
  info: "bg-vblue",
  warning: "bg-vyellow",
};

export function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className={cn(
        "flex items-center gap-3 rounded-2xl border-4 border-ink px-4 py-3 shadow-brutal-md",
        colorMap[toast.type],
      )}
    >
      {iconMap[toast.type]}
      <p className="flex-1 text-sm font-bold">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="grid h-6 w-6 place-items-center rounded-lg border-2 border-ink bg-cream"
      >
        <X className="h-3 w-3" />
      </button>
    </motion.div>
  );
}

export function Toaster({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[100] mx-auto flex max-w-md flex-col gap-2 px-4 lg:bottom-6 lg:right-6 lg:left-auto lg:mx-0">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={onDismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
