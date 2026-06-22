import type { Priority } from './types';

export const PRIORITY_COLORS: Record<
  Priority,
  { bg: string; text: string; light: string; border: string }
> = {
  must: {
    bg: '#ef4444',
    text: '#fff',
    light: 'rgba(239,68,68,0.1)',
    border: 'rgba(239,68,68,0.3)',
  },
  better: {
    bg: '#f59e0b',
    text: '#fff',
    light: 'rgba(245,158,11,0.1)',
    border: 'rgba(245,158,11,0.3)',
  },
  want: {
    bg: '#22c55e',
    text: '#fff',
    light: 'rgba(34,197,94,0.1)',
    border: 'rgba(34,197,94,0.3)',
  },
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  must: 'Must',
  better: 'Better',
  want: 'Want',
};

export const PRIORITY_CYCLE: Record<Priority, Priority> = {
  must: 'better',
  better: 'want',
  want: 'must',
};

export const HIGHLIGHT_COLORS: Record<
  Priority,
  { bg: string; hoverBg: string; border: string }
> = {
  must: {
    bg: 'rgba(239,68,68,0.15)',
    hoverBg: 'rgba(239,68,68,0.25)',
    border: '#ef4444',
  },
  better: {
    bg: 'rgba(245,158,11,0.15)',
    hoverBg: 'rgba(245,158,11,0.25)',
    border: '#f59e0b',
  },
  want: {
    bg: 'rgba(34,197,94,0.15)',
    hoverBg: 'rgba(34,197,94,0.25)',
    border: '#22c55e',
  },
};

export const USERNAME_KEY = 'fb-username';
export const SIDEBAR_WIDTH_KEY = 'fb-sidebar-width';
