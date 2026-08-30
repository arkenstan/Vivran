import { configureAnalyser, DEFAULT_ANALYZER_SETTINGS } from './analyser';
import { AudioSourceException } from './errors';
import type { AudioSourceSession, SourceFactoryOptions } from './types';

export async function createFileAudioSource(
  file: File,
  options: SourceFactoryOptions = {},
): Promise<AudioSourceSession> {
  if (!file.type.startsWith('audio/')) {
    throw new AudioSourceException('unsupported', 'The selected file is not an audio file.');
  }

  const audioContext = options.audioContextFactory?.() ?? new AudioContext();
  const audioElement = new Audio();
  const objectUrl = URL.createObjectURL(file);

  audioElement.src = objectUrl;
  audioElement.loop = true;
  audioElement.preload = 'auto';

  const sourceNode = audioContext.createMediaElementSource(audioElement);
  const analyser = audioContext.createAnalyser();
  configureAnalyser(analyser, DEFAULT_ANALYZER_SETTINGS);
  sourceNode.connect(analyser);
  analyser.connect(audioContext.destination);

  const endHandler = (): void => {
    options.onEnded?.();
  };

  audioElement.addEventListener('ended', endHandler, { once: true });

  try {
    await audioElement.play();
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    sourceNode.disconnect();
    throw new AudioSourceException(
      'playback-blocked',
      'The browser blocked local audio playback.',
      error,
    );
  }

  return {
    kind: 'file',
    label: file.name,
    audioContext,
    sourceNode,
    analyser,
    cleanup: () => {
      audioElement.pause();
      audioElement.removeAttribute('src');
      audioElement.load();
      audioElement.removeEventListener('ended', endHandler);
      URL.revokeObjectURL(objectUrl);
    },
  };
}
