import { FileAudio, Info, MonitorUp, Square, Volume2 } from 'lucide-react';
import { useRef } from 'react';
import type { BrowserAudioCaptureSupport } from '../audio/browserSupport';
import { AudioSourceStatus, type AudioSourceState } from '../audio/types';

export type PrimaryAudioSourceMode = 'browser-tab' | 'system-audio';

interface SourceControlsProps {
  sourceState: AudioSourceState;
  captureSupport: BrowserAudioCaptureSupport;
  primarySourceMode?: PrimaryAudioSourceMode;
  compact?: boolean;
  onShareAudio: () => void;
  onChooseFile: (file: File) => void;
  onStop: () => void;
}

export function SourceControls({
  sourceState,
  captureSupport,
  primarySourceMode = 'browser-tab',
  compact = false,
  onShareAudio,
  onChooseFile,
  onStop,
}: SourceControlsProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const busy = sourceState.status === AudioSourceStatus.Requesting;
  const active = sourceState.status === AudioSourceStatus.Active;
  const isSystemAudioMode = primarySourceMode === 'system-audio';
  const primaryLabel = isSystemAudioMode ? 'Use system audio' : captureSupport.buttonLabel;
  const guidance = isSystemAudioMode
    ? 'Capture system output from the desktop app. Microphone input is not used.'
    : captureSupport.guidance;

  return (
    <section className={`panel source-panel ${compact ? 'is-compact' : ''}`} aria-labelledby="source-heading">
      <div className="panel-heading">
        <h2 id="source-heading">Source</h2>
        <span
          className={`info-icon tab-audio-${isSystemAudioMode ? 'supported' : captureSupport.tabAudio}`}
          role="img"
          aria-label={guidance}
          title={guidance}
        >
          <Info size={16} aria-hidden="true" />
        </span>
      </div>

      <div className="source-actions">
        <button
          type="button"
          className="primary-action"
          disabled={busy || (!isSystemAudioMode && !captureSupport.canRequestDisplayCapture)}
          aria-label={primaryLabel}
          title={primaryLabel}
          onClick={onShareAudio}
        >
          {isSystemAudioMode ? <Volume2 size={20} aria-hidden="true" /> : <MonitorUp size={20} aria-hidden="true" />}
        </button>
        <button
          type="button"
          className="secondary-action"
          disabled={busy}
          aria-label="Choose audio file"
          title="Choose audio file"
          onClick={() => fileInputRef.current?.click()}
        >
          <FileAudio size={20} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="icon-action"
          disabled={!active}
          onClick={onStop}
          aria-label="Stop"
          title="Stop"
        >
          <Square size={20} aria-hidden="true" />
        </button>
      </div>

      <input
        ref={fileInputRef}
        className="visually-hidden"
        type="file"
        accept="audio/*"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) {
            onChooseFile(file);
          }
        }}
      />
    </section>
  );
}
