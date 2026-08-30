import type { AnalyzerSettings } from './types';

export const FFT_SIZE_OPTIONS = [512, 1024, 2048, 4096, 8192] as const;

export const DEFAULT_ANALYZER_SETTINGS: AnalyzerSettings = {
  fftSize: 2048,
  smoothingTimeConstant: 0.74,
  sensitivity: 1.08,
};

export function configureAnalyser(analyser: AnalyserNode, settings: AnalyzerSettings): void {
  analyser.fftSize = settings.fftSize;
  analyser.smoothingTimeConstant = settings.smoothingTimeConstant;
  analyser.minDecibels = -92;
  analyser.maxDecibels = -18;
}
