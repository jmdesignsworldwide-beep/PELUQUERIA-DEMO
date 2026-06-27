"use client";

import { useRef } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import { cn } from "@/lib/cn";

/**
 * Card premium: glass, sombra en capas, y hover magnético (tilt + brillo que
 * sigue al cursor). Respeta prefers-reduced-motion (sin tilt).
 */
export function Card({
  children,
  className,
  interactive = true,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  as?: "div" | "section" | "article";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const rx = useSpring(0, { stiffness: 200, damping: 20 });
  const ry = useSpring(0, { stiffness: 200, damping: 20 });
  const gx = useMotionValue(50);
  const gy = useMotionValue(0);

  const glow = useMotionTemplate`radial-gradient(280px circle at ${gx}% ${gy}%, rgb(var(--accent) / 0.16), transparent 60%)`;

  function onMove(e: React.PointerEvent) {
    if (!interactive || reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    rx.set((0.5 - py) * 6);
    ry.set((px - 0.5) * 6);
    gx.set(px * 100);
    gy.set(py * 100);
  }

  function onLeave() {
    rx.set(0);
    ry.set(0);
    gx.set(50);
    gy.set(0);
  }

  const MotionTag = motion[as];

  return (
    <MotionTag
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={
        interactive && !reduce
          ? { rotateX: rx, rotateY: ry, transformPerspective: 900 }
          : undefined
      }
      whileHover={interactive ? { y: -3 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border glass shadow-layered",
        className
      )}
    >
      {interactive && !reduce && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: glow }}
        />
      )}
      {/* hairline superior metálico */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgb(var(--metallic) / 0.6), transparent)",
        }}
      />
      <div className="relative">{children}</div>
    </MotionTag>
  );
}
