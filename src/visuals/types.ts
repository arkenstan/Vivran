export enum VisualMode {
  Waveform = 'waveform',
  Spectrum = 'spectrum',
  Radial = 'radial',
  Oscilloscope = 'oscilloscope',
  Constellation = 'constellation',
  Blob = 'blob',
  Tunnel = 'tunnel',
  Orb = 'orb',
  Terrain = 'terrain',
  Galaxy = 'galaxy',
}

export const THREE_VISUAL_MODES = [VisualMode.Orb, VisualMode.Terrain, VisualMode.Galaxy] as const;

export type ThreeVisualMode = (typeof THREE_VISUAL_MODES)[number];

export function isThreeVisualMode(mode: VisualMode): mode is ThreeVisualMode {
  return (THREE_VISUAL_MODES as readonly string[]).includes(mode);
}

export enum VisualPresetId {
  Prism = 'prism',
  Ember = 'ember',
  Terminal = 'terminal',
  Aurora = 'aurora',
  Citrus = 'citrus',
  Lagoon = 'lagoon',
  Vapor = 'vapor',
  Magma = 'magma',
  Glacier = 'glacier',
  Solar = 'solar',
  Midnight = 'midnight',
  Candy = 'candy',
}

export interface VisualPreset {
  id: VisualPresetId;
  label: string;
  background: string;
  primary: string;
  secondary: string;
  accent: string;
  glow: string;
}
