import { SlidersHorizontal } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import { FFT_SIZE_OPTIONS } from '../audio/analyser';
import type { AnalyzerSettings } from '../audio/types';
import { VISUAL_PRESETS } from '../visuals/presets';
import type { VisualMode, VisualPresetId } from '../visuals/types';

const VISUAL_MODES: Array<{ id: VisualMode; label: string }> = [
  { id: 'spectrum', label: 'Spectrum' },
  { id: 'waveform', label: 'Waveform' },
  { id: 'radial', label: 'Starburst' },
  { id: 'oscilloscope', label: 'Scope' },
  { id: 'constellation', label: 'Constellation' },
  { id: 'blob', label: 'Blob' },
  { id: 'tunnel', label: 'Tunnel' },
  { id: 'orb', label: '3D Orb' },
  { id: 'terrain', label: '3D Terrain' },
  { id: 'galaxy', label: '3D Galaxy' },
];

interface ModeSelectorProps {
  mode: VisualMode;
  setMode: (mode: VisualMode) => void;
}

interface VisualizationControlsProps {
  settings: AnalyzerSettings;
  setSettings: Dispatch<SetStateAction<AnalyzerSettings>>;
  reducedMotion: boolean;
  setReducedMotion: (enabled: boolean) => void;
}

interface ColorThemeSelectorProps {
  presetId: VisualPresetId;
  setPresetId: (preset: VisualPresetId) => void;
}

export function ModeSelector({
  mode,
  setMode,
}: ModeSelectorProps) {
  return (
    <section className="panel mode-panel" aria-labelledby="mode-heading">
      <div className="panel-heading">
        <h2 id="mode-heading">Visualizer</h2>
      </div>

      <label className="setting-group mode-setting">
        <span className="visually-hidden">Visualizer mode</span>
        <select value={mode} onChange={(event) => setMode(event.target.value as VisualMode)}>
          {VISUAL_MODES.map((visualMode) => (
            <option key={visualMode.id} value={visualMode.id}>
              {visualMode.label}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}

export function VisualizationControls({
  settings,
  setSettings,
  reducedMotion,
  setReducedMotion,
}: VisualizationControlsProps) {
  return (
    <section className="panel visualization-panel" aria-labelledby="settings-heading">
      <div className="panel-heading">
        <h2 id="settings-heading">Visualization Controls</h2>
        <SlidersHorizontal size={18} aria-hidden="true" />
      </div>

      <div className="visualization-controls">
        <label className="setting-group range-setting">
          <span className="setting-label">Sensitivity</span>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.02"
            value={settings.sensitivity}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                sensitivity: Number(event.target.value),
              }))
            }
          />
        </label>

        <label className="setting-group range-setting">
          <span className="setting-label">Smoothing</span>
          <input
            type="range"
            min="0"
            max="0.95"
            step="0.01"
            value={settings.smoothingTimeConstant}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                smoothingTimeConstant: Number(event.target.value),
              }))
            }
          />
        </label>

        <label className="setting-group fft-setting">
          <span className="setting-label">FFT size</span>
          <select
            value={settings.fftSize}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                fftSize: Number(event.target.value),
              }))
            }
          >
            {FFT_SIZE_OPTIONS.map((fftSize) => (
              <option key={fftSize} value={fftSize}>
                {fftSize}
              </option>
            ))}
          </select>
        </label>

        <label className="toggle-row">
          <input
            type="checkbox"
            checked={reducedMotion}
            onChange={(event) => setReducedMotion(event.target.checked)}
          />
          <span>Reduced motion</span>
        </label>
      </div>
    </section>
  );
}

export function ColorThemeSelector({ presetId, setPresetId }: ColorThemeSelectorProps) {
  const selectedPreset = VISUAL_PRESETS.find((preset) => preset.id === presetId) ?? VISUAL_PRESETS[0];

  return (
    <section className="panel color-panel" aria-labelledby="color-heading">
      <div className="panel-heading">
        <h2 id="color-heading">Color</h2>
        <span className="selected-theme">{selectedPreset.label}</span>
      </div>

      <div className="theme-swatches" aria-label="Color themes">
        {VISUAL_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className="theme-swatch"
            aria-label={`Use ${preset.label} theme`}
            aria-pressed={presetId === preset.id}
            title={preset.label}
            style={{
              background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary} 52%, ${preset.accent})`,
            }}
            onClick={() => setPresetId(preset.id)}
          />
        ))}
      </div>
    </section>
  );
}
