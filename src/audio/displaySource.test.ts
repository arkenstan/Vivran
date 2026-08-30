import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDisplayAudioCaptureOptions, createDisplayAudioSource } from './displaySource';
import { stopAudioSession } from './session';
import { AudioErrorCategory } from './types';

function createTrack(kind: string, settings: MediaTrackSettings = {}) {
  const listeners = new Map<string, EventListener>();
  return {
    kind,
    getSettings: vi.fn(() => settings),
    stop: vi.fn(),
    addEventListener: vi.fn((event: string, listener: EventListener) => {
      listeners.set(event, listener);
    }),
    removeEventListener: vi.fn((event: string) => {
      listeners.delete(event);
    }),
    emit(event: string) {
      listeners.get(event)?.(new Event(event));
    },
  };
}

function createAudioContextMock() {
  const sourceNode = {
    connect: vi.fn(),
    disconnect: vi.fn(),
  };
  const analyser = {
    fftSize: 0,
    smoothingTimeConstant: 0,
    minDecibels: 0,
    maxDecibels: 0,
  };

  return {
    context: {
      state: 'running',
      createMediaStreamSource: vi.fn(() => sourceNode),
      createAnalyser: vi.fn(() => analyser),
      close: vi.fn(async () => undefined),
    } as unknown as AudioContext,
    sourceNode,
    analyser,
  };
}

describe('createDisplayAudioSource', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('requests an audio-enabled browser tab capture surface', () => {
    const options = createDisplayAudioCaptureOptions({
      suppressLocalAudioPlayback: true,
      restrictOwnAudio: true,
    } as MediaTrackSupportedConstraints);

    expect(options).toMatchObject({
      preferCurrentTab: false,
      selfBrowserSurface: 'exclude',
      surfaceSwitching: 'include',
      systemAudio: 'include',
      windowAudio: 'window',
      video: expect.objectContaining({
        displaySurface: 'browser',
      }),
      audio: expect.objectContaining({
        suppressLocalAudioPlayback: false,
        restrictOwnAudio: true,
      }),
    });
  });

  it('creates and cleans up a display audio session', async () => {
    const audioTrack = createTrack('audio');
    const videoTrack = createTrack('video', { displaySurface: 'browser' });
    const stream = {
      getAudioTracks: vi.fn(() => [audioTrack]),
      getVideoTracks: vi.fn(() => [videoTrack]),
      getTracks: vi.fn(() => [audioTrack, videoTrack]),
    } as unknown as MediaStream;
    const mediaDevices = {
      getDisplayMedia: vi.fn(async () => stream),
      getSupportedConstraints: vi.fn(() => ({})),
    };
    const audioContextMock = createAudioContextMock();
    const onEnded = vi.fn();

    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: mediaDevices,
    });

    const session = await createDisplayAudioSource({
      audioContextFactory: () => audioContextMock.context,
      onEnded,
    });

    expect(mediaDevices.getDisplayMedia).toHaveBeenCalledWith(
      expect.objectContaining({
        audio: expect.any(Object),
        video: expect.any(Object),
      }),
    );
    expect(session.label).toBe('Shared tab audio');
    expect(audioContextMock.context.createMediaStreamSource).toHaveBeenCalledWith(stream);
    expect(audioContextMock.sourceNode.connect).toHaveBeenCalledWith(audioContextMock.analyser);

    audioTrack.emit('ended');
    expect(onEnded).toHaveBeenCalledTimes(1);

    await stopAudioSession(session);
    expect(audioTrack.stop).toHaveBeenCalled();
    expect(videoTrack.stop).toHaveBeenCalled();
    expect(audioContextMock.sourceNode.disconnect).toHaveBeenCalled();
    expect(audioContextMock.context.close).toHaveBeenCalled();
  });

  it('stops tracks and throws when the selected surface has no audio', async () => {
    const videoTrack = createTrack('video');
    const stream = {
      getAudioTracks: vi.fn(() => []),
      getVideoTracks: vi.fn(() => [videoTrack]),
      getTracks: vi.fn(() => [videoTrack]),
    } as unknown as MediaStream;

    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getDisplayMedia: vi.fn(async () => stream),
        getSupportedConstraints: vi.fn(() => ({})),
      },
    });

    await expect(createDisplayAudioSource()).rejects.toMatchObject({
      category: AudioErrorCategory.NoAudio,
    });
    expect(videoTrack.stop).toHaveBeenCalled();
  });
});
