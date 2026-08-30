export type TwoDimensionalVisualMode =
  | 'waveform'
  | 'spectrum'
  | 'radial'
  | 'oscilloscope'
  | 'constellation'
  | 'blob'
  | 'tunnel';

export const THREE_VISUAL_MODES = ['orb', 'terrain', 'galaxy'] as const;

export type ThreeVisualMode = (typeof THREE_VISUAL_MODES)[number];

export type VisualMode = TwoDimensionalVisualMode | ThreeVisualMode;

export function isThreeVisualMode(mode: VisualMode): mode is ThreeVisualMode {
  return (THREE_VISUAL_MODES as readonly string[]).includes(mode);
}

export type VisualPresetId =
  | 'prism'
  | 'ember'
  | 'terminal'
  | 'aurora'
  | 'citrus'
  | 'lagoon'
  | 'vapor'
  | 'magma'
  | 'glacier'
  | 'solar'
  | 'midnight'
  | 'candy';

export interface VisualPreset {
  id: VisualPresetId;
  label: string;
  background: string;
  primary: string;
  secondary: string;
  accent: string;
  glow: string;
}
