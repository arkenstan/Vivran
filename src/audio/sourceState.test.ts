import { describe, expect, it } from 'vitest';
import { audioSourceReducer, initialAudioSourceState } from './sourceState';

describe('audioSourceReducer', () => {
  it('moves through request, active, and stopped states', () => {
    const requesting = audioSourceReducer(initialAudioSourceState, { type: 'request' });
    expect(requesting.status).toBe('requesting');

    const active = audioSourceReducer(requesting, {
      type: 'activate',
      meta: {
        kind: 'display',
        label: 'Browser audio',
        startedAt: 1,
      },
    });

    expect(active.status).toBe('active');
    expect(active.meta?.label).toBe('Browser audio');

    const stopped = audioSourceReducer(active, { type: 'stop' });
    expect(stopped.status).toBe('stopped');
    expect(stopped.meta?.kind).toBe('display');
  });

  it('stores user-facing errors', () => {
    const next = audioSourceReducer(initialAudioSourceState, {
      type: 'error',
      error: {
        category: 'permission-denied',
        message: 'Capture permission was denied.',
      },
    });

    expect(next.status).toBe('error');
    expect(next.error?.category).toBe('permission-denied');
  });
});
