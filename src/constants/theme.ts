/**
 * Design System — Premium Expense Tracker
 *
 * A single source of truth for every visual token in the app.
 * All screens must pull from these constants instead of ad-hoc values.
 */

import '@/global.css';

import { Platform } from 'react-native';

// ─── Color Palette ──────────────────────────────────────────────
export const Colors = {
  light: {
    // Core
    text: '#0F172A',
    textSecondary: '#64748B',
    textTertiary: '#94A3B8',
    background: '#F8FAFC',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E2E8F0',
    backgroundSubtle: '#F1F5F9',

    // Accent
    tint: '#6366F1', // Premium Indigo
    tintLight: '#818CF8',
    tintMuted: '#EEF2FF',
    tintSubtle: '#6366F115',

    // Semantic
    success: '#10B981',
    successLight: '#D1FAE5',
    successMuted: '#10B98115',
    danger: '#EF4444',
    dangerLight: '#FEE2E2',
    dangerMuted: '#EF444415',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    warningMuted: '#F59E0B15',
    info: '#3B82F6',
    infoLight: '#DBEAFE',
    infoMuted: '#3B82F615',

    // Income / Expense
    income: '#10B981',
    incomeBg: '#ECFDF5',
    expense: '#EF4444',
    expenseBg: '#FEF2F2',
    transfer: '#3B82F6',
    transferBg: '#EFF6FF',

    // Tab bar
    tabIconDefault: '#94A3B8',
    tabBarBg: '#FFFFFF',

    // Surface
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    card: '#FFFFFF',
    cardElevated: '#FFFFFF',
    overlay: 'rgba(15, 23, 42, 0.4)',
  },
  dark: {
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',
    background: '#0F172A',
    backgroundElement: '#1E293B',
    backgroundSelected: '#334155',
    backgroundSubtle: '#1E293B',
    tint: '#818CF8',
    tintLight: '#A5B4FC',
    tintMuted: '#312E81',
    tintSubtle: '#818CF815',
    success: '#34D399',
    successLight: '#064E3B',
    successMuted: '#34D39915',
    danger: '#F87171',
    dangerLight: '#7F1D1D',
    dangerMuted: '#F8717115',
    warning: '#FBBF24',
    warningLight: '#78350F',
    warningMuted: '#FBBF2415',
    info: '#60A5FA',
    infoLight: '#1E3A5F',
    infoMuted: '#60A5FA15',
    income: '#34D399',
    incomeBg: '#064E3B',
    expense: '#F87171',
    expenseBg: '#7F1D1D',
    transfer: '#60A5FA',
    transferBg: '#1E3A5F',
    tabIconDefault: '#64748B',
    tabBarBg: '#0F172A',
    border: '#334155',
    borderLight: '#1E293B',
    card: '#1E293B',
    cardElevated: '#334155',
    overlay: 'rgba(0, 0, 0, 0.6)',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

// ─── Fonts ──────────────────────────────────────────────────────
export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

// Font families loaded via expo-font in root layout
export const FontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extraBold: 'Inter_800ExtraBold',
} as const;

// ─── Spacing ────────────────────────────────────────────────────
export const Spacing = {
  /** 2px */ xs: 2,
  /** 4px */ sm: 4,
  /** 6px */ _6: 6,
  /** 8px */ md: 8,
  /** 10px */ _10: 10,
  /** 12px */ lg: 12,
  /** 16px */ xl: 16,
  /** 20px */ _20: 20,
  /** 24px */ _24: 24,
  /** 32px */ _32: 32,
  /** 40px */ _40: 40,
  /** 48px */ _48: 48,
  /** 64px */ _64: 64,

  // Legacy aliases (keep for backward compat)
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

// ─── Border Radius ──────────────────────────────────────────────
export const Radius = {
  /** 6px – tags, small chips */ xs: 6,
  /** 10px – inputs, small cards */ sm: 10,
  /** 14px – cards, buttons */ md: 14,
  /** 20px – large cards */ lg: 20,
  /** 28px – hero cards */ xl: 28,
  /** 999px – full pill */ full: 999,
} as const;

// ─── Shadows ────────────────────────────────────────────────────
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  /** Tinted shadow for the primary color accent */
  tint: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  /** Soft upward glow */
  glow: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 0,
  },
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
} as const;

// ─── Typography Scale ───────────────────────────────────────────
export const TypeScale = {
  /** 32px – Page titles */
  display: { fontSize: 32, lineHeight: 38, fontFamily: FontFamily.extraBold },
  /** 26px – Section hero */
  title: { fontSize: 26, lineHeight: 32, fontFamily: FontFamily.bold },
  /** 20px – Card titles */
  headline: { fontSize: 20, lineHeight: 26, fontFamily: FontFamily.bold },
  /** 17px – Emphasized body */
  bodyLarge: { fontSize: 17, lineHeight: 24, fontFamily: FontFamily.semiBold },
  /** 15px – Standard body */
  body: { fontSize: 15, lineHeight: 22, fontFamily: FontFamily.medium },
  /** 13px – Supporting text */
  caption: { fontSize: 13, lineHeight: 18, fontFamily: FontFamily.medium },
  /** 11px – Labels, overlines */
  overline: {
    fontSize: 11,
    lineHeight: 16,
    fontFamily: FontFamily.semiBold,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  /** 36px – Hero numbers */
  heroNumber: { fontSize: 36, lineHeight: 42, fontFamily: FontFamily.extraBold },
  /** 48px – Giant amount input */
  amountInput: { fontSize: 48, lineHeight: 56, fontFamily: FontFamily.extraBold },
} as const;

// ─── Layout ─────────────────────────────────────────────────────
export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
export const ScreenPadding = 20;
