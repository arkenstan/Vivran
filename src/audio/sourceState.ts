import {
  AudioSourceActionType,
  AudioSourceStatus,
  type AudioSourceError,
  type AudioSourceMeta,
  type AudioSourceState,
} from './types';

export type AudioSourceAction =
  | { type: AudioSourceActionType.Request }
  | { type: AudioSourceActionType.Activate; meta: AudioSourceMeta }
  | { type: AudioSourceActionType.Stop }
  | { type: AudioSourceActionType.Error; error: AudioSourceError };

export const initialAudioSourceState: AudioSourceState = {
  status: AudioSourceStatus.Idle,
  meta: null,
  error: null,
};

export function audioSourceReducer(state: AudioSourceState, action: AudioSourceAction): AudioSourceState {
  switch (action.type) {
    case AudioSourceActionType.Request:
      return {
        status: AudioSourceStatus.Requesting,
        meta: null,
        error: null,
      };
    case AudioSourceActionType.Activate:
      return {
        status: AudioSourceStatus.Active,
        meta: action.meta,
        error: null,
      };
    case AudioSourceActionType.Stop:
      return {
        status: AudioSourceStatus.Stopped,
        meta: state.meta,
        error: null,
      };
    case AudioSourceActionType.Error:
      return {
        status: AudioSourceStatus.Error,
        meta: null,
        error: action.error,
      };
    default: {
      const exhaustive: never = action;
      return exhaustive;
    }
  }
}
