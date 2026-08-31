import { AlertTriangle, AudioLines } from 'lucide-react';
import { AudioSourceStatus, type AudioSourceState } from '../audio/types';

interface StatusPanelProps {
  sourceState: AudioSourceState;
}

export function StatusPanel({ sourceState }: StatusPanelProps) {
  const activeLabel = sourceState.meta?.label ?? 'No active source';

  return (
    <section className="panel status-panel" aria-live="polite" aria-labelledby="status-heading">
      <div className="panel-heading">
        <h2 id="status-heading">Status</h2>
        {sourceState.status === AudioSourceStatus.Error ? (
          <AlertTriangle size={18} aria-hidden="true" />
        ) : (
          <AudioLines size={18} aria-hidden="true" />
        )}
      </div>
      <p className="status-copy">
        {sourceState.status === AudioSourceStatus.Active ? activeLabel : statusText(sourceState)}
      </p>
      {sourceState.error ? <p className="error-copy">{sourceState.error.message}</p> : null}
    </section>
  );
}

function statusText(sourceState: AudioSourceState): string {
  switch (sourceState.status) {
    case AudioSourceStatus.Idle:
      return 'Ready';
    case AudioSourceStatus.Requesting:
      return 'Starting audio source';
    case AudioSourceStatus.Stopped:
      return 'Stopped';
    case AudioSourceStatus.Error:
      return sourceState.error?.category ?? 'Error';
    case AudioSourceStatus.Active:
      return sourceState.meta?.label ?? 'Active';
    default: {
      const exhaustive: never = sourceState.status;
      return exhaustive;
    }
  }
}
