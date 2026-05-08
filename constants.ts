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
    id: 'insilico',
    label: 'Insilico',
    colors: {
      background: 'bg-[#09121f]',
      primary: 'bg-[#111c2d]',
      secondary: 'bg-[#1a2940]',
      accent: 'bg-[#8eb8ff]',
    },
  },
  {
    id: 'cscalp',
    label: 'CScalp',
    colors: {
      background: 'bg-[#0a0d12]',
      primary: 'bg-[#141a22]',
      secondary: 'bg-[#1d2632]',
      accent: 'bg-[#d7dde5]',
    },
  },
  {
    id: 'bloomberg',
    label: 'Bloomberg',
    colors: {
      background: 'bg-[#0d0d0f]',
      primary: 'bg-[#17181d]',
      secondary: 'bg-[#23252c]',
      accent: 'bg-[#f0a23b]',
    },
  },
];

export const WISDOM_QUOTES = [
  "The secret of change is to focus all of your energy not on fighting the old, but on building the new.",
  "Waste no more time arguing about what a good man should be. Be one.",
  "The mind is everything. What you think you become.",
  "You have power over your mind — not outside events. Realize this, and you will find strength.",
  "Peace comes from within. Do not seek it without.",
  "The best revenge is not to be like your enemy.",
  "Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.",
  "He who lives in harmony with himself lives in harmony with the universe.",
  "Three things cannot be long hidden: the sun, the moon, and the truth.",
  "The happiness of your life depends upon the quality of your thoughts."
];

export const AD_MESSAGES = [
  {
    title: "Unlock Deeper Insights",
    message: "Generate a full wellness report on the Reports page to understand your emotional patterns.",
    icon: 'reports'
  },
  {
    title: "A Moment of Wisdom",
    message: "The happiness of your life depends upon the quality of your thoughts.",
    icon: 'sparkles'
  },
  {
    title: "Personalize Your Space",
    message: "Did you know you can change your theme in the Settings view? Find a look that calms you.",
    icon: 'settings'
  },
  {
    title: "Did You Know?",
    message: "You can attach an image to any journal entry to capture the moment visually.",
    icon: 'upload'
  },
  {
    title: "Stay Consistent",
    message: "Journaling is most effective when it's a regular habit. Keep up the great work!",
    icon: 'journal'
  },
  {
    title: "Thalex Exchange",
    message: "Trade BTC, ETH, and more with low fees. Sign up with referral code OWNBZS for exclusive benefits.",
    url: "https://thalex.com/exchange/sign-up?referral=OWNBZS",
    icon: 'exchange'
  },
  {
    title: "Coincall Exchange",
    message: "Options trading with deep liquidity. Use referral code 43394533 to get started.",
    url: "https://www.coincall.com/r/43394533",
    icon: 'exchange'
  },
  {
    title: "Bybit Exchange",
    message: "World's fastest-growing crypto exchange. Sign up via our link for exclusive bonuses.",
    url: "https://www.bybit.com/sign-up?affiliate_id=146658&group_id=1511275&group_type=1&ref_code=146658",
    icon: 'exchange'
  },
  {
    title: "Oggregator",
    message: "The all-in-one options aggregator. Compare spreads across exchanges and find the best prices.",
    url: "https://www.oggregator.xyz",
    icon: 'exchange'
  }
];
