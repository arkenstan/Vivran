export type SourceStatus = 'idle' | 'requesting' | 'active' | 'stopped' | 'error';

export type AudioSourceKind = 'display' | 'file';

export type AudioErrorCategory =
  | 'unsupported'
  | 'permission-denied'
  | 'no-audio'
  | 'playback-blocked'
  | 'unknown';

export interface AudioSourceMeta {
  kind: AudioSourceKind;
  label: string;
  startedAt: number;
}

export interface AudioSourceError {
  category: AudioErrorCategory;
  message: string;
  cause?: unknown;
}

export interface AudioSourceState {
  status: SourceStatus;
  meta: AudioSourceMeta | null;
  error: AudioSourceError | null;
}

export interface AnalyzerSettings {
  fftSize: number;
  smoothingTimeConstant: number;
  sensitivity: number;
}

export interface AudioSourceSession {
  kind: AudioSourceKind;
  label: string;
  stream?: MediaStream;
  audioContext: AudioContext;
  sourceNode: AudioNode;
  analyser: AnalyserNode;
  cleanup: () => void | Promise<void>;
}

export interface SourceFactoryOptions {
  onEnded?: () => void;
  audioContextFactory?: () => AudioContext;
}
