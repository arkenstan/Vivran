import { FileAudio, Info, MonitorUp, Square } from 'lucide-react';
import { useRef } from 'react';
import type { BrowserAudioCaptureSupport } from '../audio/browserSupport';
import { AudioSourceStatus, type AudioSourceState } from '../audio/types';

interface SourceControlsProps {
  sourceState: AudioSourceState;
  captureSupport: BrowserAudioCaptureSupport;
  compact?: boolean;
  onShareAudio: () => void;
  onChooseFile: (file: File) => void;
  onStop: () => void;
}

export function SourceControls({
  sourceState,
  captureSupport,
  compact = false,
  onShareAudio,
  onChooseFile,
  onStop,
}: SourceControlsProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const busy = sourceState.status === AudioSourceStatus.Requesting;
  const active = sourceState.status === AudioSourceStatus.Active;

  return (
    <section className={`panel source-panel ${compact ? 'is-compact' : ''}`} aria-labelledby="source-heading">
      <div className="panel-heading">
        <h2 id="source-heading">Source</h2>
        <span
          className={`info-icon tab-audio-${captureSupport.tabAudio}`}
          role="img"
          aria-label={captureSupport.guidance}
          title={captureSupport.guidance}
        >
          <Info size={16} aria-hidden="true" />
        </span>
      </div>

      <div className="source-actions">
        <button
          type="button"
          className="primary-action"
          disabled={busy || !captureSupport.canRequestDisplayCapture}
          aria-label={captureSupport.buttonLabel}
          title={captureSupport.buttonLabel}
          onClick={onShareAudio}
        >
          <MonitorUp size={20} aria-hidden="true" />
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
