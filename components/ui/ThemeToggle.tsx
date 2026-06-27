"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useApp } from "@/components/providers/AppProviders";
import { cn } from "@/lib/cn";

/** Toggle sol/luna. El estado se persiste en AppProviders (localStorage). */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useApp();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      title={isDark ? "Tema claro" : "Tema oscuro"}
      className={cn(
        "relative grid h-10 w-10 place-items-center rounded-full border border-border",
        "glass text-fg/80 transition-colors hover:text-accent hover:shadow-glow",
        className
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isDark ? "moon" : "sun"}
          initial={{ y: 8, opacity: 0, rotate: -30 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: -8, opacity: 0, rotate: 30 }}
          transition={{ type: "spring", stiffness: 420, damping: 28 }}
          className="absolute"
        >
          {isDark ? <Moon size={18} /> : <Sun size={18} />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
