"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { MotionConfig } from "framer-motion";
import { BusinessType, Skin, getSkin } from "@/lib/skins";
import { THEME_KEY, ThemeMode } from "@/lib/theme";

/** Piel para el atributo data-skin. "neutral" es solo para el login pre-piel. */
export type SkinAttr = BusinessType | "neutral";

type AppContextValue = {
  skin: Skin;
  businessType: BusinessType;
  setBusinessType: (t: BusinessType) => void;
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (t: ThemeMode) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProviders({
  children,
  initialSkin = "salon",
  /** Si true, la piel puede cambiarse en runtime (solo para la página demo). */
  allowSkinSwitch = false,
}: {
  children: React.ReactNode;
  initialSkin?: SkinAttr;
  allowSkinSwitch?: boolean;
}) {
  const [skinAttr, setSkinAttr] = useState<SkinAttr>(initialSkin);
  const [theme, setThemeState] = useState<ThemeMode>("dark");

  // Para vocabulario, "neutral" cae a salon (el login no usa vocabulario).
  const businessType: BusinessType = skinAttr === "neutral" ? "salon" : skinAttr;

  // Carga inicial del tema persistido (el script en <head> ya lo aplicó al DOM;
  // aquí sincronizamos el estado de React con lo que el DOM ya muestra).
  useEffect(() => {
    const root = document.documentElement;
    const current = root.getAttribute("data-theme");
    if (current === "light" || current === "dark") {
      setThemeState(current);
    } else {
      const stored = window.localStorage.getItem(THEME_KEY);
      setThemeState(stored === "light" ? "light" : "dark");
    }
  }, []);

  // Aplica skin + theme al <html> y persiste el tema.
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-skin", skinAttr);
    root.setAttribute("data-theme", theme);
    root.style.colorScheme = theme;
    window.localStorage.setItem(THEME_KEY, theme);
  }, [skinAttr, theme]);

  const setBusinessType = useCallback(
    (t: BusinessType) => {
      if (allowSkinSwitch) setSkinAttr(t);
    },
    [allowSkinSwitch]
  );

  const setTheme = useCallback((t: ThemeMode) => setThemeState(t), []);
  const toggleTheme = useCallback(
    () => setThemeState((p) => (p === "dark" ? "light" : "dark")),
    []
  );

  const value = useMemo<AppContextValue>(
    () => ({
      skin: getSkin(businessType),
      businessType,
      setBusinessType,
      theme,
      toggleTheme,
      setTheme,
    }),
    [businessType, theme, setBusinessType, toggleTheme, setTheme]
  );

  return (
    <AppContext.Provider value={value}>
      {/* Todas las animaciones de framer respetan prefers-reduced-motion. */}
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp debe usarse dentro de <AppProviders>");
  return ctx;
}

export function useSkin() {
  return useApp().skin;
}
