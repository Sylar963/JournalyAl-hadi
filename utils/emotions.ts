const LEGACY_EMOTION_MAP = {
  happy: 'confident',
  calm: 'composed',
  sad: 'hesitant',
  angry: 'frustrated',
  neutral: 'composed',
} as const;

export function normalizeEmotionValue(emotion: string): string {
  return LEGACY_EMOTION_MAP[emotion as keyof typeof LEGACY_EMOTION_MAP] ?? emotion;
}
