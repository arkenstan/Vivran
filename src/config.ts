import { VisualMode, VisualPresetId } from './visuals/types';

export const APP_CONFIG = {
  defaultMode: VisualMode.Spectrum,
  defaultPreset: VisualPresetId.Prism,
  defaultReducedMotionQuery: '(prefers-reduced-motion: reduce)',
  renderIntervalMs: 16,
  reducedMotionIntervalMs: 140,
} as const;

export const ANALYZER_CONFIG = {
  fftSizeOptions: [512, 1024, 2048, 4096, 8192] as const,
  defaults: {
    fftSize: 2048,
    smoothingTimeConstant: 0.74,
    sensitivity: 1.08,
  },
  minDecibels: -92,
  maxDecibels: -18,
} as const;

export const THREE_CONFIG = {
  terrain: {
    columns: 128,
    rows: 64,
    width: 34,
    depth: 40,
    scale: 0.68,
    camera: {
      position: [0, 18, 34] as [number, number, number],
      fov: 52,
      near: 0.1,
      far: 180,
    },
  },
  galaxy: {
    particleCount: 512,
  },
  canvas: {
    defaultCamera: {
      position: [0, 8, 16] as [number, number, number],
      fov: 52,
      near: 0.1,
      far: 180,
    },
    dpr: [1, 1.5] as [number, number],
  },
} as const;

export const VISUAL_MODE_OPTIONS = [
  { id: VisualMode.Spectrum, label: 'Spectrum' },
  { id: VisualMode.Waveform, label: 'Waveform' },
  { id: VisualMode.Radial, label: 'Starburst' },
  { id: VisualMode.Oscilloscope, label: 'Scope' },
  { id: VisualMode.Constellation, label: 'Constellation' },
  { id: VisualMode.Blob, label: 'Blob' },
  { id: VisualMode.Tunnel, label: 'Tunnel' },
  { id: VisualMode.Orb, label: '3D Orb' },
  { id: VisualMode.Terrain, label: '3D Terrain' },
  { id: VisualMode.Galaxy, label: '3D Galaxy' },
] as const;
