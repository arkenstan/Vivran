import { describe, expect, it } from 'vitest';
import { getPreset, VISUAL_PRESETS } from './presets';

describe('getPreset', () => {
  it('returns selected preset data', () => {
    expect(getPreset('ember').label).toBe('Ember');
  });

  it('includes an expanded theme set', () => {
    expect(VISUAL_PRESETS).toHaveLength(12);
    expect(VISUAL_PRESETS.map((preset) => preset.id)).toContain('aurora');
    expect(VISUAL_PRESETS.map((preset) => preset.id)).toContain('midnight');
  });
});
