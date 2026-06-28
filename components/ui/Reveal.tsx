"use client";

import { motion, Variants } from "framer-motion";
import { cn } from "@/lib/cn";

/**
 * Contenedor con entrada en cascada (stagger ~70ms con spring).
 * Envuelve hijos en <Reveal.Item> para que entren en secuencia.
 */
const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 260, damping: 26 },
  },
};

export function Reveal({
  children,
  className,
  once = true,
}: {
  children: React.ReactNode;
  className?: string;
  once?: boolean;
}) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: "-60px" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Export NOMBRADO (no `Reveal.Item`): los componentes compuestos por propiedad
 * estática no sobreviven el límite servidor/cliente de RSC. Para usarse dentro
 * de un Server Component hay que importarlo como export nombrado.
 */
export function RevealItem({
  children,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "li" | "section";
}) {
  const MotionTag = motion[as];
  return (
    <MotionTag variants={itemVariants} className={cn(className)}>
      {children}
    </MotionTag>
  );
}
