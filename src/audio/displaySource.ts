import { configureAnalyser, DEFAULT_ANALYZER_SETTINGS } from './analyser';
import { getBrowserAudioCaptureSupport } from './browserSupport';
import { AudioSourceException } from './errors';
import type { AudioSourceSession, SourceFactoryOptions } from './types';

type DisplaySurfaceHint = 'browser' | 'window' | 'monitor';
type IncludeExcludeHint = 'include' | 'exclude';
type WindowAudioHint = 'exclude' | 'window' | 'system';

interface ExtendedAudioConstraints extends MediaTrackConstraints {
  suppressLocalAudioPlayback?: boolean;
  restrictOwnAudio?: boolean;
}

interface ExtendedVideoConstraints extends MediaTrackConstraints {
  displaySurface?: DisplaySurfaceHint;
}

interface ExtendedDisplayMediaOptions extends DisplayMediaStreamOptions {
  audio?: boolean | ExtendedAudioConstraints;
  video?: boolean | ExtendedVideoConstraints;
  preferCurrentTab?: boolean;
  selfBrowserSurface?: IncludeExcludeHint;
  surfaceSwitching?: IncludeExcludeHint;
  systemAudio?: IncludeExcludeHint;
  windowAudio?: WindowAudioHint;
  monitorTypeSurfaces?: IncludeExcludeHint;
}

export function createDisplayAudioCaptureOptions(
  supportedConstraints: MediaTrackSupportedConstraints = navigator.mediaDevices?.getSupportedConstraints?.() ?? {},
): ExtendedDisplayMediaOptions {
  const supported = supportedConstraints as Record<string, boolean | undefined>;
  const audio: ExtendedAudioConstraints = {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
  };

  if (supported.suppressLocalAudioPlayback) {
    audio.suppressLocalAudioPlayback = false;
  }

  if (supported.restrictOwnAudio) {
    audio.restrictOwnAudio = true;
  }

  return {
    audio,
    video: {
      displaySurface: 'browser',
      frameRate: {
        ideal: 1,
        max: 5,
      },
    },
    preferCurrentTab: false,
    selfBrowserSurface: 'exclude',
    surfaceSwitching: 'include',
    systemAudio: 'include',
    windowAudio: 'window',
    monitorTypeSurfaces: 'include',
  };
}

export async function createDisplayAudioSource(
  options: SourceFactoryOptions = {},
): Promise<AudioSourceSession> {
  const mediaDevices = navigator.mediaDevices;

  if (!mediaDevices?.getDisplayMedia) {
    throw new AudioSourceException(
      'unsupported',
      'This browser does not support display audio capture.',
    );
  }

  const stream = await mediaDevices.getDisplayMedia(
    createDisplayAudioCaptureOptions(mediaDevices.getSupportedConstraints?.()),
  );

  if (stream.getAudioTracks().length === 0) {
    for (const track of stream.getTracks()) {
      track.stop();
    }

    const support = getBrowserAudioCaptureSupport();
    throw new AudioSourceException(
      'no-audio',
      support.family === 'firefox'
        ? 'Firefox did not provide a tab audio track. Use Chrome/Edge for other-tab audio or choose a local audio file.'
        : 'The selected surface did not include audio. Choose a browser tab/window and enable audio in the share prompt.',
    );
  }

  const audioContext = options.audioContextFactory?.() ?? new AudioContext();
  const sourceNode = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  configureAnalyser(analyser, DEFAULT_ANALYZER_SETTINGS);
  sourceNode.connect(analyser);

  const endHandler = (): void => {
    options.onEnded?.();
  };

  for (const track of stream.getTracks()) {
    track.addEventListener('ended', endHandler, { once: true });
  }

  return {
    kind: 'display',
    label: getDisplayCaptureLabel(stream),
    stream,
    audioContext,
    sourceNode,
    analyser,
    cleanup: () => {
      for (const track of stream.getTracks()) {
        track.removeEventListener('ended', endHandler);
      }
    },
  };
}

function getDisplayCaptureLabel(stream: MediaStream): string {
  const displaySurface = stream.getVideoTracks()[0]?.getSettings().displaySurface;

  if (displaySurface === 'browser') {
    return 'Shared tab audio';
  }

  if (displaySurface === 'window') {
    return 'Shared window audio';
  }

  if (displaySurface === 'monitor') {
    return 'Shared screen audio';
  }

  return 'Shared browser audio';
}
