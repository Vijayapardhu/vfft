import { AlertTriangle } from "lucide-react";
import { Button } from "./button";

/** Error card with optional retry (UID §28). */
export function ErrorState({
  message = "Something went wrong while loading this.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[40vh] max-w-md flex-col items-center justify-center gap-4 px-5 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl border-4 border-ink bg-vred shadow-brutal">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <p className="font-bold">{message}</p>
      {onRetry && (
        <Button variant="ink" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
