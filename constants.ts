
import { type EmotionType, type ThemeConfig } from './types';

interface EmotionConfig {
  label: string;
  emoji: string;
  color: string;
  solidColor: string;
  textColor: string;
  hoverColor: string;
}

export const EMOTIONS_CONFIG: Record<EmotionType, EmotionConfig> = {
  happy: {
    label: 'Happy',
    emoji: '😄',
    color: 'bg-yellow-400/20 border-yellow-300',
    solidColor: 'bg-yellow-400',
    textColor: 'text-yellow-300',
    hoverColor: 'hover:bg-yellow-400/40'
  },
  calm: {
    label: 'Calm',
    emoji: '😌',
    color: 'bg-blue-400/20 border-blue-300',
    solidColor: 'bg-blue-400',
    textColor: 'text-blue-300',
    hoverColor: 'hover:bg-blue-400/40'
  },
  anxious: {
    label: 'Anxious',
    emoji: '😟',
    color: 'bg-amber-500/20 border-amber-400',
    solidColor: 'bg-amber-500',
    textColor: 'text-amber-400',
    hoverColor: 'hover:bg-amber-500/40'
  },
  sad: {
    label: 'Sad',
    emoji: '😢',
    color: 'bg-blue-600/20 border-blue-500',
    solidColor: 'bg-blue-600',
    textColor: 'text-blue-500',
    hoverColor: 'hover:bg-blue-600/40'
  },
  angry: {
    label: 'Angry',
    emoji: '😠',
    color: 'bg-red-500/20 border-red-400',
    solidColor: 'bg-red-500',
    textColor: 'text-red-400',
    hoverColor: 'hover:bg-red-500/40'
  },
};

export const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const THEMES_CONFIG: ThemeConfig[] = [
  {
    id: 'twilight',
    label: 'Twilight',
    colors: {
      background: 'bg-[#0c0c0e]',
      primary: 'bg-gray-900',
      secondary: 'bg-gray-800',
      accent: 'bg-yellow-500',
    },
  },
  {
    id: 'sunrise',
    label: 'Sunrise',
    colors: {
      background: 'bg-[#fafaf9]',
      primary: 'bg-slate-100',
      secondary: 'bg-slate-200',
      accent: 'bg-orange-500',
    },
  },
  {
    id: 'cyberpunk',
    label: 'Cyberpunk',
    colors: {
      background: 'bg-[#0d0221]',
      primary: 'bg-[#1d1049]',
      secondary: 'bg-[#2c1a6e]',
      accent: 'bg-pink-500',
    },
  },
  {
    id: 'forest',
    label: 'Forest',
    colors: {
      background: 'bg-[#0a140f]',
      primary: 'bg-[#111f19]',
      secondary: 'bg-[#1b3127]',
      accent: 'bg-amber-500',
    },
  },
];
