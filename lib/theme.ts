import { BusinessType } from "@/lib/skins";

export type ThemeMode = "light" | "dark";

export const THEME_KEY = "jm-theme";

/**
 * Script que aplica skin+theme al <html> ANTES del primer paint (evita el
 * parpadeo de tema al recargar). Se inyecta en <head> desde un Server Component,
 * por eso vive en un módulo neutral (no "use client").
 */
export function themeBootScript(initialSkin: BusinessType) {
  return `(function(){try{var t=localStorage.getItem('${THEME_KEY}');if(t!=='light'&&t!=='dark'){t='dark';}var r=document.documentElement;r.setAttribute('data-theme',t);r.setAttribute('data-skin','${initialSkin}');r.style.colorScheme=t;}catch(e){}})();`;
}
