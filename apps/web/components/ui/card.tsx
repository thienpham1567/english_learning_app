import * as React from "react";
import { cn } from "@/lib/utils";

type AccentColor =
  | "accent"
  | "secondary"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "grammar"
  | "listening"
  | "reading"
  | "speaking"
  | "writing"
  | "vocabulary"
  | "review"
  | "assessment";

export interface CardProps extends React.ComponentProps<"div"> {
  size?: "default" | "sm" | "lg";
  interactive?: boolean;
  shadowSize?: "sm" | "default" | "md" | "lg" | "xl" | "none";
  accentColor?: AccentColor;
  accentPosition?: "top" | "left" | "right" | "bottom" | "full";
  bgType?: "default" | "alt" | "accent-light" | "muted" | "transparent";
}

function Card({
  className,
  size = "default",
  interactive = false,
  shadowSize = "default",
  accentColor,
  accentPosition = "top",
  bgType = "default",
  ...props
}: CardProps) {
  // Mapping shadow sizes
  const shadowClasses = {
    none: "shadow-none",
    sm: "shadow-sm",
    default: "shadow",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
  };

  // Mapping background colors
  const bgClasses = {
    default: "bg-card text-card-foreground",
    alt: "bg-surface-alt text-text-primary",
    "accent-light": "bg-accent-light text-text-primary",
    muted: "bg-bg-deep text-text-secondary",
    transparent: "bg-transparent text-text-primary",
  };

  // Mapping accent borders/backgrounds to Tailwind colors
  const accentClasses = accentColor
    ? {
        top: `border-t-4 border-t-${accentColor}`,
        left: `border-l-4 border-l-${accentColor}`,
        right: `border-r-4 border-r-${accentColor}`,
        bottom: `border-b-4 border-b-${accentColor}`,
        full: `bg-${accentColor} border-${accentColor} text-white`,
      }[accentPosition]
    : "";

  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "group/card flex flex-col overflow-hidden border-2 border-border text-sm",
        // Padding/gap sizes
        size === "sm" ? "p-4 gap-3 rounded-lg" : size === "lg" ? "p-8 gap-5 rounded-2xl" : "p-6 gap-4 rounded-xl",
        // Background
        bgClasses[bgType],
        // Shadow
        shadowClasses[shadowSize],
        // Accent styles
        accentClasses,
        // Interactive animations
        interactive && [
          "transition-all duration-150 cursor-pointer",
          // Hover state: lift up and make shadow deeper
          "hover:-translate-x-0.5 hover:-translate-y-0.5",
          shadowSize === "sm" && "hover:shadow",
          shadowSize === "default" && "hover:shadow-md",
          shadowSize === "md" && "hover:shadow-lg",
          shadowSize === "lg" && "hover:shadow-xl",
          // Active state: press down to original or smaller shadow
          "active:translate-x-0 active:translate-y-0",
          shadowSize === "default" && "active:shadow-sm",
          shadowSize === "md" && "active:shadow",
        ],
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "flex flex-col gap-1.5",
        className
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-display text-lg font-bold leading-none tracking-tight text-ink",
        className
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-xs text-text-muted", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("ml-auto flex items-center gap-1.5", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("text-sm leading-relaxed", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center gap-4 mt-auto border-t-2 border-border pt-4 -mx-6 -mb-6 px-6 py-4 bg-surface-alt group-data-[size=sm]/card:-mx-4 group-data-[size=sm]/card:-mb-4 group-data-[size=sm]/card:px-4 group-data-[size=sm]/card:py-3 group-data-[size=lg]/card:-mx-8 group-data-[size=lg]/card:-mb-8 group-data-[size=lg]/card:px-8 group-data-[size=lg]/card:py-5",
        className
      )}
      {...props}
    />
  );
}

export { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
