import { Maximize2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AudioSourceStatus } from './audio/types';
import { SourceControls } from './components/SourceControls';
import { ColorThemeSelector, ModeSelector, VisualizationControls } from './components/SettingsPanel';
import { StatusPanel } from './components/StatusPanel';
import { VisualizerCanvas } from './components/VisualizerCanvas';
import { getBrowserAudioCaptureSupport } from './audio/browserSupport';
import { useAudioEngine } from './audio/useAudioEngine';
import { APP_CONFIG } from './config';
import { getPreset } from './visuals/presets';
import { VisualMode, VisualPresetId } from './visuals/types';

function getInitialReducedMotion(): boolean {
  return window.matchMedia?.(APP_CONFIG.defaultReducedMotionQuery).matches ?? false;
}

export function App() {
  const { analyser, settings, setSettings, sourceState, startDisplayCapture, startDesktopCapture, startFile, stop } = useAudioEngine();
  const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
  const [mode, setMode] = useState<VisualMode>(APP_CONFIG.defaultMode);
  const [presetId, setPresetId] = useState<VisualPresetId>(APP_CONFIG.defaultPreset);
  const [reducedMotion, setReducedMotion] = useState(getInitialReducedMotion);
  const [focusMode, setFocusMode] = useState(false);
  const preset = useMemo(() => getPreset(presetId), [presetId]);
  const captureSupport = useMemo(() => getBrowserAudioCaptureSupport(), []);
  const sourceActive = sourceState.status === AudioSourceStatus.Active;

  useEffect(() => {
    if (!focusMode) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setFocusMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [focusMode]);

  useEffect(() => {
    const handleFocusShortcut = (event: KeyboardEvent): void => {
      const target = event.target;

      if (
        event.key.toLowerCase() !== 'f' ||
        target instanceof HTMLInputElement ||
        target instanceof HTMLSelectElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLButtonElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }

      if (sourceActive) {
        setFocusMode(true);
      }
    };

    window.addEventListener('keydown', handleFocusShortcut);

    return () => {
      window.removeEventListener('keydown', handleFocusShortcut);
    };
  }, [sourceActive]);

  return (
    <main className={`app-shell ${focusMode ? 'is-focus-mode' : ''}`}>
      <section
        className="stage"
        aria-label="Audio visualizer stage"
        onDoubleClick={() => {
          if (focusMode) {
            setFocusMode(false);
          }
        }}
      >
        {!focusMode ? (
          <header className="app-header">
            <img className="app-logo" src={`${import.meta.env.BASE_URL}vivran-logo.png`} alt="Vivran logo" />
            <h1>Vivran</h1>
          </header>
        ) : null}
        {!sourceActive ? <p className="empty-state">Select an audio source to begin</p> : null}
        <VisualizerCanvas
          analyser={analyser}
          active={sourceState.status === AudioSourceStatus.Active}
          mode={mode}
          preset={preset}
          settings={settings}
          reducedMotion={reducedMotion}
        />
      </section>

      {!focusMode ? (
        <aside className="top-right-hud" aria-label="Source, status, and color controls">
          <SourceControls
            sourceState={sourceState}
            captureSupport={captureSupport}
            compact={sourceActive}
            onShareAudio={() => {
              if (isTauri) {
                void startDesktopCapture();
              } else {
                void startDisplayCapture();
              }
            }}
            onChooseFile={(file) => {
              void startFile(file);
            }}
            onStop={() => {
              void stop();
            }}
          />
          {sourceActive ? <ColorThemeSelector presetId={presetId} setPresetId={setPresetId} /> : null}
          <StatusPanel sourceState={sourceState} />
        </aside>
      ) : null}

      {!focusMode && sourceActive ? (
        <aside className="left-visualization-controls" aria-label="Visualization controls">
          <VisualizationControls
            settings={settings}
            setSettings={setSettings}
            reducedMotion={reducedMotion}
            setReducedMotion={setReducedMotion}
          />
        </aside>
      ) : null}

      {!focusMode ? (
        <div className="floating-controls">
          <aside id="visualizer-controls" className="control-rail" aria-label="Visualizer controls">
            <div className="toolbar-row toolbar-row-primary">
              {sourceActive ? <ModeSelector mode={mode} setMode={setMode} /> : null}
              {sourceActive ? (
                <button
                  type="button"
                  className="focus-action"
                  aria-label="Enter focus mode"
                  title="Enter focus mode"
                  onClick={() => {
                    setFocusMode(true);
                  }}
                >
                  <Maximize2 size={20} aria-hidden="true" />
                </button>
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}
    </main>
  );
}
