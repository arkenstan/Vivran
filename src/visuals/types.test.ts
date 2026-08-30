import { describe, expect, it } from 'vitest';
import { isThreeVisualMode, VisualMode } from './types';

describe('visual mode classification', () => {
  it('identifies only Three.js visual modes', () => {
    expect(isThreeVisualMode(VisualMode.Orb)).toBe(true);
    expect(isThreeVisualMode(VisualMode.Terrain)).toBe(true);
    expect(isThreeVisualMode(VisualMode.Galaxy)).toBe(true);
    expect(isThreeVisualMode(VisualMode.Spectrum)).toBe(false);
  });
});
