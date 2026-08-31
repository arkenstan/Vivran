import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { BrowserAudioCaptureSupport } from '../audio/browserSupport';
import { AudioSourceStatus, type AudioSourceState } from '../audio/types';
import { SourceControls } from './SourceControls';

const captureSupport: BrowserAudioCaptureSupport = {
  family: 'chromium',
  canRequestDisplayCapture: true,
  tabAudio: 'supported',
  buttonLabel: 'Share tab audio',
  guidance: 'Choose a tab and enable audio.',
};

const idleState: AudioSourceState = {
  status: AudioSourceStatus.Idle,
  meta: null,
  error: null,
};

describe('SourceControls', () => {
  it('uses system audio wording for the desktop source action', () => {
    const onShareAudio = vi.fn();

    render(
      <SourceControls
        sourceState={idleState}
        captureSupport={captureSupport}
        primarySourceMode="system-audio"
        onShareAudio={onShareAudio}
        onChooseFile={vi.fn()}
        onStop={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /use system audio/i }));

    expect(onShareAudio).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: /share tab audio/i })).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: /capture system output/i })).toBeInTheDocument();
  });
});
