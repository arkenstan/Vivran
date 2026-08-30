import type { AudioErrorCategory, AudioSourceError } from './types';

export class AudioSourceException extends Error {
  readonly category: AudioErrorCategory;
  readonly cause?: unknown;

  constructor(category: AudioErrorCategory, message: string, cause?: unknown) {
    super(message);
    this.name = 'AudioSourceException';
    this.category = category;
    this.cause = cause;
  }
}

export function normalizeAudioError(error: unknown): AudioSourceError {
  if (error instanceof AudioSourceException) {
    return {
      category: error.category,
      message: error.message,
      cause: error.cause,
    };
  }

  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
      return {
        category: 'permission-denied',
        message: 'Capture permission was denied.',
        cause: error,
      };
    }

    if (error.name === 'NotFoundError') {
      return {
        category: 'no-audio',
        message: 'No shareable audio source was found.',
        cause: error,
      };
    }
  }

  if (error instanceof Error) {
    return {
      category: 'unknown',
      message: error.message,
      cause: error,
    };
  }

  return {
    category: 'unknown',
    message: 'Audio capture failed.',
    cause: error,
  };
}
