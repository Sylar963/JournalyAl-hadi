import { normalizeEmotionValue } from '../utils/emotions';

describe('normalizeEmotionValue', () => {
  it('maps legacy emotions to trader-specific emotions', () => {
    expect(normalizeEmotionValue('happy')).toBe('confident');
    expect(normalizeEmotionValue('calm')).toBe('composed');
    expect(normalizeEmotionValue('sad')).toBe('hesitant');
    expect(normalizeEmotionValue('angry')).toBe('frustrated');
  });

  it('preserves current and non-mapped values', () => {
    expect(normalizeEmotionValue('euphoric')).toBe('euphoric');
    expect(normalizeEmotionValue('neutral')).toBe('neutral');
  });
});
