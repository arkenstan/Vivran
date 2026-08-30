import { describe, expect, it } from 'vitest';
import { configureAnalyser } from './analyser';

describe('configureAnalyser', () => {
  it('applies analyzer settings', () => {
    const analyser = {
      fftSize: 0,
      smoothingTimeConstant: 0,
      minDecibels: 0,
      maxDecibels: 0,
    } as AnalyserNode;

    configureAnalyser(analyser, {
      fftSize: 4096,
      smoothingTimeConstant: 0.4,
      sensitivity: 1.2,
    });

    expect(analyser.fftSize).toBe(4096);
    expect(analyser.smoothingTimeConstant).toBe(0.4);
    expect(analyser.minDecibels).toBe(-92);
    expect(analyser.maxDecibels).toBe(-18);
  });
});
