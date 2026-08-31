export enum AudioSourceStatus {
  Idle = 'idle',
  Requesting = 'requesting',
  Active = 'active',
  Stopped = 'stopped',
  Error = 'error',
}

export enum AudioSourceKind {
  Display = 'display',
  File = 'file',
  Desktop = 'desktop',
}

export enum AudioErrorCategory {
  Unsupported = 'unsupported',
  PermissionDenied = 'permission-denied',
  NoAudio = 'no-audio',
  PlaybackBlocked = 'playback-blocked',
  Unknown = 'unknown',
}

export enum AudioSourceActionType {
  Request = 'request',
  Activate = 'activate',
  Stop = 'stop',
  Error = 'error',
}

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
  status: AudioSourceStatus;
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
