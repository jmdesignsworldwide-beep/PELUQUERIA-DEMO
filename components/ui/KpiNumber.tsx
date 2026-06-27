"use client";

import { useEffect } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { cn } from "@/lib/cn";

/**
 * Número con count-up y tabular-nums. Pensado para montos RD$ (tandas futuras).
 * Respeta prefers-reduced-motion (muestra el valor final sin animar).
 */
export function KpiNumber({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  duration = 1.1,
  className,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(reduce ? value : 0);
  const rounded = useTransform(mv, (latest) =>
    latest.toLocaleString("es-DO", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  );

  useEffect(() => {
    if (reduce) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
    });
    return controls.stop;
  }, [value, duration, reduce, mv]);

  return (
    <span className={cn("tabular tracking-tight", className)}>
      {prefix}
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
}
