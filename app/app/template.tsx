"use client";

import { motion } from "framer-motion";

/**
 * template.tsx se re-monta en cada navegación dentro de /app, así que cada
 * cambio de ruta entra con una transición suave. (MotionConfig en AppProviders
 * hace que respete prefers-reduced-motion.)
 */
export default function AppTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
