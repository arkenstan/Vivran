import { Maximize2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { SourceControls } from './components/SourceControls';
import { ColorThemeSelector, ModeSelector, VisualizationControls } from './components/SettingsPanel';
import { StatusPanel } from './components/StatusPanel';
import { VisualizerCanvas } from './components/VisualizerCanvas';
import { getBrowserAudioCaptureSupport } from './audio/browserSupport';
import { useAudioEngine } from './audio/useAudioEngine';
import { getPreset } from './visuals/presets';
import type { VisualMode, VisualPresetId } from './visuals/types';

function getInitialReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

export function App() {
  const { analyser, settings, setSettings, sourceState, startDisplayCapture, startFile, stop } = useAudioEngine();
  const [mode, setMode] = useState<VisualMode>('spectrum');
  const [presetId, setPresetId] = useState<VisualPresetId>('prism');
  const [reducedMotion, setReducedMotion] = useState(getInitialReducedMotion);
  const [focusMode, setFocusMode] = useState(false);
  const preset = useMemo(() => getPreset(presetId), [presetId]);
  const captureSupport = useMemo(() => getBrowserAudioCaptureSupport(), []);

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
            <h1>Audio Visualizer</h1>
          </header>
        ) : null}
        <VisualizerCanvas
          analyser={analyser}
          active={sourceState.status === 'active'}
          mode={mode}
          preset={preset}
          settings={settings}
          reducedMotion={reducedMotion}
        />
      </section>

      {!focusMode ? (
        <aside className="top-right-hud" aria-label="Status and color controls">
          <ColorThemeSelector presetId={presetId} setPresetId={setPresetId} />
          <StatusPanel sourceState={sourceState} />
        </aside>
      ) : null}

      {!focusMode ? (
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
              <SourceControls
                sourceState={sourceState}
                captureSupport={captureSupport}
                onShareAudio={() => {
                  void startDisplayCapture();
                }}
                onChooseFile={(file) => {
                  void startFile(file);
                }}
                onStop={() => {
                  void stop();
                }}
              />
              <ModeSelector mode={mode} setMode={setMode} />
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
            </div>
          </aside>
        </div>
      ) : null}
    </main>
  );
}
