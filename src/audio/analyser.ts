import { ANALYZER_CONFIG } from '../config';
import type { AnalyzerSettings } from './types';

export const FFT_SIZE_OPTIONS = ANALYZER_CONFIG.fftSizeOptions;

export const DEFAULT_ANALYZER_SETTINGS: AnalyzerSettings = ANALYZER_CONFIG.defaults;

export function configureAnalyser(analyser: AnalyserNode, settings: AnalyzerSettings): void {
  analyser.fftSize = settings.fftSize;
  analyser.smoothingTimeConstant = settings.smoothingTimeConstant;
  analyser.minDecibels = ANALYZER_CONFIG.minDecibels;
  analyser.maxDecibels = ANALYZER_CONFIG.maxDecibels;
}
