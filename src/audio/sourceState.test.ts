import { describe, expect, it } from 'vitest';
import { audioSourceReducer, initialAudioSourceState } from './sourceState';
import { AudioErrorCategory, AudioSourceActionType, AudioSourceKind, AudioSourceStatus } from './types';

describe('audioSourceReducer', () => {
  it('moves through request, active, and stopped states', () => {
    const requesting = audioSourceReducer(initialAudioSourceState, { type: AudioSourceActionType.Request });
    expect(requesting.status).toBe(AudioSourceStatus.Requesting);

    const active = audioSourceReducer(requesting, {
      type: AudioSourceActionType.Activate,
      meta: {
        kind: AudioSourceKind.Display,
        label: 'Browser audio',
        startedAt: 1,
      },
    });

    expect(active.status).toBe(AudioSourceStatus.Active);
    expect(active.meta?.label).toBe('Browser audio');

    const stopped = audioSourceReducer(active, { type: AudioSourceActionType.Stop });
    expect(stopped.status).toBe(AudioSourceStatus.Stopped);
    expect(stopped.meta?.kind).toBe(AudioSourceKind.Display);
  });

  it('stores user-facing errors', () => {
    const next = audioSourceReducer(initialAudioSourceState, {
      type: AudioSourceActionType.Error,
      error: {
        category: AudioErrorCategory.PermissionDenied,
        message: 'Capture permission was denied.',
      },
    });

    expect(next.status).toBe(AudioSourceStatus.Error);
    expect(next.error?.category).toBe(AudioErrorCategory.PermissionDenied);
  });
});
