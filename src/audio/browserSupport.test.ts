import { describe, expect, it, vi } from 'vitest';
import { getBrowserAudioCaptureSupport } from './browserSupport';

const mediaDevices = {
  getDisplayMedia: vi.fn(),
} as unknown as MediaDevices;

describe('getBrowserAudioCaptureSupport', () => {
  it('reports tab audio support for Chromium browsers', () => {
    const support = getBrowserAudioCaptureSupport(
      'Mozilla/5.0 Chrome/151.0.0.0 Safari/537.36',
      mediaDevices,
    );

    expect(support.family).toBe('chromium');
    expect(support.tabAudio).toBe('supported');
    expect(support.guidance).toMatch(/enable audio/i);
  });

  it('reports Firefox tab audio as unsupported for normal web pages', () => {
    const support = getBrowserAudioCaptureSupport(
      'Mozilla/5.0 Firefox/154.0',
      mediaDevices,
    );

    expect(support.family).toBe('firefox');
    expect(support.tabAudio).toBe('not-supported');
    expect(support.guidance).toMatch(/Chrome\/Edge/i);
  });
});
