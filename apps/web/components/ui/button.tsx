import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-xl border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary border-transparent text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-[0.98] cursor-pointer duration-200 transition-all",
        outline:
          "bg-surface border-border text-foreground shadow-sm hover:bg-surface-hover active:scale-[0.98] cursor-pointer duration-200 transition-all",
        secondary:
          "bg-secondary border-transparent text-white shadow-sm hover:bg-secondary/90 active:scale-[0.98] cursor-pointer duration-200 transition-all",
        ghost:
          "border-transparent bg-transparent hover:bg-surface-hover hover:text-foreground active:scale-[0.98] cursor-pointer duration-200 transition-all",
        destructive:
          "bg-destructive border-transparent text-white shadow-sm hover:bg-destructive/90 active:scale-[0.98] cursor-pointer duration-200 transition-all",
        link: "text-primary underline underline-offset-4 hover:text-primary/90 cursor-pointer duration-200 transition-all",
        /* ── Soft UI Variants ── */
        subtle:
          "bg-accent-light border border-transparent text-accent-active shadow-none hover:bg-accent-light/80 active:scale-[0.98] cursor-pointer duration-200 transition-all",
        dashed:
          "bg-transparent border border-dashed border-border text-text-secondary shadow-none hover:border-primary hover:text-primary active:scale-[0.98] cursor-pointer duration-200 transition-all",
      },
      size: {
        default:
          "h-8 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-3 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-3.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xl: "h-11 gap-2 px-5 text-[15px] has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  accentColor,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    /** Dynamic accent color for module/topic-colored buttons (CSS color value) */
    accentColor?: string;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      style={
        accentColor
          ? ({
              "--btn-accent": accentColor,
              background: "var(--btn-accent)",
              borderColor: "var(--border)",
              color: "var(--ink)",
            } as React.CSSProperties)
          : undefined
      }
      {...props}
    />
  );
}

export { Button, buttonVariants };
