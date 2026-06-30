import { Info, AlertTriangle, AlertCircle, ShieldAlert, LucideIcon } from 'lucide-react';

export type NivelKey = 'Bajo' | 'Medio' | 'Alto' | 'Critico';

export type NivelConfig = {
  label: string;
  icon: LucideIcon;
  bg: string;
  text: string;
  accent: string;
  badge: string;
  border: string;
  borderGlow: [string, string, string];
  chip: string;
};

export const NIVEL_CONFIG: Record<NivelKey, NivelConfig> = {
  Bajo: {
    label: 'Bajo',
    icon: Info,
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-800 dark:text-blue-200',
    accent: 'text-blue-500',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
    borderGlow: ['rgba(59, 130, 246, 0.25)', 'rgba(59, 130, 246, 1)', 'rgba(59, 130, 246, 0.25)'],
    chip: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
  },
  Medio: {
    label: 'Medio',
    icon: AlertTriangle,
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-800 dark:text-amber-200',
    accent: 'text-amber-500',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
    borderGlow: ['rgba(245, 158, 11, 0.25)', 'rgba(245, 158, 11, 1)', 'rgba(245, 158, 11, 0.25)'],
    chip: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',
  },
  Alto: {
    label: 'Alto',
    icon: AlertCircle,
    bg: 'bg-orange-50 dark:bg-orange-950/40',
    text: 'text-orange-800 dark:text-orange-200',
    accent: 'text-orange-500',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    border: 'border-orange-200 dark:border-orange-800',
    borderGlow: ['rgba(249, 115, 22, 0.25)', 'rgba(249, 115, 22, 1)', 'rgba(249, 115, 22, 0.25)'],
    chip: 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700',
  },
  Critico: {
    label: 'Crítico',
    icon: ShieldAlert,
    bg: 'bg-red-50 dark:bg-red-950/40',
    text: 'text-red-800 dark:text-red-200',
    accent: 'text-red-500',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
    borderGlow: ['rgba(239, 68, 68, 0.25)', 'rgba(239, 68, 68, 1)', 'rgba(239, 68, 68, 0.25)'],
    chip: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
  },
};

export const NIVEL_KEYS = Object.keys(NIVEL_CONFIG) as NivelKey[];

export function getNivelConfig(estado: string): NivelConfig {
  return NIVEL_CONFIG[estado as NivelKey] ?? NIVEL_CONFIG.Bajo;
}
