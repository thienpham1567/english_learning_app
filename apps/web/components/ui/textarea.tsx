import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-lg border-2 border-border bg-surface-alt px-2.5 py-2 text-sm text-ink transition-all outline-none placeholder:text-text-muted focus-visible:shadow-(--shadow-sm) focus-visible:translate-x-[-1px] focus-visible:translate-y-[-1px] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
