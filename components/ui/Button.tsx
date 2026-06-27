"use client";

import { forwardRef } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

type ButtonProps = {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  children?: React.ReactNode;
} & Omit<React.ComponentProps<typeof motion.button>, "ref" | "children">;

const base =
  "relative inline-flex select-none items-center justify-center gap-2 rounded-xl font-medium tracking-tight transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none";

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-contrast shadow-glow hover:brightness-[1.06] active:brightness-95",
  secondary:
    "glass border border-border text-fg hover:border-accent/50 hover:text-accent",
  ghost: "text-fg/80 hover:bg-surface-2 hover:text-accent",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
        disabled={disabled || loading}
        className={cn(
          base,
          sizes[size],
          variants[variant],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="animate-spin" size={16} />}
        {children}
      </motion.button>
    );
  }
);
