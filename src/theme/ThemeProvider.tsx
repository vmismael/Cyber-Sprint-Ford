import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import { usePlanStore } from '@/stores/usePlanStore';
import { colors, spacing, radius, blur, shadow, touchTarget } from './tokens';
import { typography, fontFamily } from './typography';
import { planAccents, type PlanAccent, type PlanId } from './plans';

export type Theme = {
  colors: typeof colors;
  spacing: typeof spacing;
  radius: typeof radius;
  blur: typeof blur;
  shadow: typeof shadow;
  touchTarget: typeof touchTarget;
  typography: typeof typography;
  fontFamily: typeof fontFamily;
  plan: { id: PlanId; surface: string } & PlanAccent;
};

const ThemeContext = createContext<Theme | null>(null);

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const v = h.length === 3
    ? h.split('').map((c) => parseInt(c + c, 16))
    : [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  return [v[0], v[1], v[2]];
}

function parseRgba(rgba: string): [number, number, number, number] {
  const m = rgba.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/);
  if (!m) return [0, 0, 0, 0];
  return [Number(m[1]), Number(m[2]), Number(m[3]), m[4] ? Number(m[4]) : 1];
}

function blendOver(tintRgba: string, baseHex: string): string {
  const [tr, tg, tb, ta] = parseRgba(tintRgba);
  const [br, bg, bb] = hexToRgb(baseHex);
  const r = Math.round(tr * ta + br * (1 - ta));
  const g = Math.round(tg * ta + bg * (1 - ta));
  const b = Math.round(tb * ta + bb * (1 - ta));
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const planId = usePlanStore((s) => s.plan);
  const theme = useMemo<Theme>(
    () => {
      const accent = planAccents[planId];
      return {
        colors,
        spacing,
        radius,
        blur,
        shadow,
        touchTarget,
        typography,
        fontFamily,
        plan: {
          id: planId,
          surface: blendOver(accent.tint, colors.bgElevated),
          ...accent,
        },
      };
    },
    [planId],
  );
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used inside <ThemeProvider>');
  }
  return ctx;
}
