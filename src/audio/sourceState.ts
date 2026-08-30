import type { AudioSourceError, AudioSourceMeta, AudioSourceState } from './types';

export type AudioSourceAction =
  | { type: 'request' }
  | { type: 'activate'; meta: AudioSourceMeta }
  | { type: 'stop' }
  | { type: 'error'; error: AudioSourceError };

export const initialAudioSourceState: AudioSourceState = {
  status: 'idle',
  meta: null,
  error: null,
};

export function audioSourceReducer(
  state: AudioSourceState,
  action: AudioSourceAction,
): AudioSourceState {
  switch (action.type) {
    case 'request':
      return {
        status: 'requesting',
        meta: null,
        error: null,
      };
    case 'activate':
      return {
        status: 'active',
        meta: action.meta,
        error: null,
      };
    case 'stop':
      return {
        status: 'stopped',
        meta: state.meta,
        error: null,
      };
    case 'error':
      return {
        status: 'error',
        meta: null,
        error: action.error,
      };
    default: {
      const exhaustive: never = action;
      return exhaustive;
    }
  }
}
