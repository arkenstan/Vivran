import { useEffect, useRef } from 'react';
import type { AnalyzerSettings } from '../audio/types';
import { APP_CONFIG } from '../config';
import { ThreeVisualizerCanvas } from './ThreeVisualizerCanvas';
import { createVisualizerRenderState, drawVisualizer } from '../visuals/renderer';
import { isThreeVisualMode, type VisualMode, type VisualPreset } from '../visuals/types';

interface VisualizerCanvasProps {
  analyser: AnalyserNode | null;
  active: boolean;
  mode: VisualMode;
  preset: VisualPreset;
  settings: AnalyzerSettings;
  reducedMotion: boolean;
}

export function VisualizerCanvas({ analyser, active, mode, preset, settings, reducedMotion }: VisualizerCanvasProps) {
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const canvas2dRef = useRef<HTMLCanvasElement | null>(null);
  const renderStateRef = useRef(createVisualizerRenderState());
  const propsRef = useRef({
    analyser,
    active,
    mode,
    preset,
    settings,
    reducedMotion,
  });

  propsRef.current = {
    analyser,
    active,
    mode,
    preset,
    settings,
    reducedMotion,
  };

  useEffect(() => {
    const surface = surfaceRef.current;
    const canvas = canvas2dRef.current;
    const context = canvas?.getContext('2d');

    if (!surface || !canvas || !context) {
      return undefined;
    }

    let frame = 0;
    let lastDraw = 0;
    let disposed = false;

    const resize = (): void => {
      const rect = surface.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * pixelRatio));
      canvas.height = Math.max(1, Math.floor(rect.height * pixelRatio));
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(surface);
    resize();

    const animate = (time: number): void => {
      if (disposed) {
        return;
      }

      const current = propsRef.current;
      const isCurrentThreeMode = isThreeVisualMode(current.mode);
      const interval = current.reducedMotion ? APP_CONFIG.reducedMotionIntervalMs : APP_CONFIG.renderIntervalMs;

      if (!isCurrentThreeMode && time - lastDraw >= interval) {
        const rect = surface.getBoundingClientRect();
        const size = {
          width: rect.width,
          height: rect.height,
          pixelRatio: window.devicePixelRatio || 1,
        };

        drawVisualizer(context, size, current, renderStateRef.current, time);

        lastDraw = time;
      }

      frame = window.requestAnimationFrame(animate);
    };

    frame = window.requestAnimationFrame(animate);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div
      className={`visualizer-surface ${isThreeVisualMode(mode) ? 'is-three-mode' : ''}`}
      ref={surfaceRef}
      aria-label="Audio visualizer"
    >
      <canvas className="visualizer-canvas visualizer-canvas-2d" ref={canvas2dRef} />
      {isThreeVisualMode(mode) ? (
        <ThreeVisualizerCanvas
          analyser={analyser}
          active={active}
          mode={mode}
          preset={preset}
          settings={settings}
          reducedMotion={reducedMotion}
        />
      ) : null}
    </div>
  );
}
