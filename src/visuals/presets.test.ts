import { describe, expect, it } from 'vitest';
import { getPreset, VISUAL_PRESETS } from './presets';
import { VisualPresetId } from './types';

describe('getPreset', () => {
  it('returns selected preset data', () => {
    expect(getPreset(VisualPresetId.Ember).label).toBe('Ember');
  });

  it('includes an expanded theme set', () => {
    expect(VISUAL_PRESETS).toHaveLength(12);
    expect(VISUAL_PRESETS.map((preset) => preset.id)).toContain(VisualPresetId.Aurora);
    expect(VISUAL_PRESETS.map((preset) => preset.id)).toContain(VisualPresetId.Midnight);
  });
});
