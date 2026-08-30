export type BrowserFamily = 'chromium' | 'firefox' | 'safari' | 'unknown';

export interface BrowserAudioCaptureSupport {
  family: BrowserFamily;
  canRequestDisplayCapture: boolean;
  tabAudio: 'supported' | 'not-supported' | 'unknown';
  buttonLabel: string;
  guidance: string;
}

export function getBrowserAudioCaptureSupport(
  userAgent = navigator.userAgent,
  mediaDevices = navigator.mediaDevices,
): BrowserAudioCaptureSupport {
  const canRequestDisplayCapture = typeof mediaDevices?.getDisplayMedia === 'function';
  const family = detectBrowserFamily(userAgent);

  if (!canRequestDisplayCapture) {
    return {
      family,
      canRequestDisplayCapture,
      tabAudio: 'not-supported',
      buttonLabel: 'Share tab audio',
      guidance: 'This browser does not expose display capture to web pages. Use Chrome, Edge, or a local audio file.',
    };
  }

  if (family === 'chromium') {
    return {
      family,
      canRequestDisplayCapture,
      tabAudio: 'supported',
      buttonLabel: 'Share tab audio',
      guidance: 'In Chrome or Edge, choose a browser tab and enable audio in the share prompt.',
    };
  }

  if (family === 'firefox') {
    return {
      family,
      canRequestDisplayCapture,
      tabAudio: 'not-supported',
      buttonLabel: 'Try Firefox capture',
      guidance:
        'Firefox can open screen sharing, but normal web pages do not receive other-tab audio from that picker. Use Chrome/Edge for tab audio or choose a local file.',
    };
  }

  return {
    family,
    canRequestDisplayCapture,
    tabAudio: 'unknown',
    buttonLabel: 'Share tab audio',
    guidance: 'If your browser offers audio in the share prompt, choose a tab or window and enable audio.',
  };
}

function detectBrowserFamily(userAgent: string): BrowserFamily {
  if (/Firefox\//.test(userAgent)) {
    return 'firefox';
  }

  if (/Edg\//.test(userAgent) || (/Chrome\//.test(userAgent) && !/OPR\//.test(userAgent))) {
    return 'chromium';
  }

  if (/Safari\//.test(userAgent) && !/Chrome\//.test(userAgent)) {
    return 'safari';
  }

  return 'unknown';
}
