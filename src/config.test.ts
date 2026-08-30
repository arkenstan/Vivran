import { describe, expect, it } from 'vitest';
import { ANALYZER_CONFIG, APP_CONFIG, THREE_CONFIG, VISUAL_MODE_OPTIONS } from './config';
import { VisualMode } from './visuals/types';

describe('application configuration', () => {
  it('keeps defaults aligned with supported visual and analyzer values', () => {
    expect(APP_CONFIG.defaultMode).toBe(VisualMode.Spectrum);
    expect(ANALYZER_CONFIG.fftSizeOptions).toContain(ANALYZER_CONFIG.defaults.fftSize);
    expect(THREE_CONFIG.terrain.scale).toBeLessThan(1);
  });

  it('exposes every visual mode exactly once', () => {
    const ids = VISUAL_MODE_OPTIONS.map((option) => option.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(Object.values(VisualMode).length);
  });
});
