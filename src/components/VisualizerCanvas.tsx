import { useEffect, useRef } from 'react';
import type { AnalyzerSettings } from '../audio/types';
import { createVisualizerRenderState, drawVisualizer } from '../visuals/renderer';
import type { VisualMode, VisualPreset } from '../visuals/types';

type AudioByteData = Uint8Array<ArrayBuffer>;
type ThreeTerrainRendererInstance = import('../visuals/threeTerrain').ThreeTerrainRenderer;
type ThreeTerrainRendererConstructor = new (canvas: HTMLCanvasElement) => ThreeTerrainRendererInstance;

interface VisualizerCanvasProps {
  analyser: AnalyserNode | null;
  active: boolean;
  mode: VisualMode;
  preset: VisualPreset;
  settings: AnalyzerSettings;
  reducedMotion: boolean;
}

export function VisualizerCanvas({
  analyser,
  active,
  mode,
  preset,
  settings,
  reducedMotion,
}: VisualizerCanvasProps) {
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const canvas2dRef = useRef<HTMLCanvasElement | null>(null);
  const terrainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderStateRef = useRef(createVisualizerRenderState());
  const terrainRendererRef = useRef<ThreeTerrainRendererInstance | null>(null);
  const terrainConstructorRef = useRef<ThreeTerrainRendererConstructor | null>(null);
  const terrainImportRef = useRef<Promise<void> | null>(null);
  const terrainFrequencyDataRef = useRef<AudioByteData>(new Uint8Array(0));
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
    const terrainCanvas = terrainCanvasRef.current;
    const context = canvas?.getContext('2d');

    if (!surface || !canvas || !terrainCanvas || !context) {
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
      const interval = current.reducedMotion ? 140 : 16;

      if (time - lastDraw >= interval) {
        const rect = surface.getBoundingClientRect();
        const size = {
          width: rect.width,
          height: rect.height,
          pixelRatio: window.devicePixelRatio || 1,
        };

        if (current.mode === 'terrain' && current.active && current.analyser) {
          try {
            if (!terrainConstructorRef.current) {
              terrainImportRef.current ??= import('../visuals/threeTerrain').then((module) => {
                terrainConstructorRef.current = module.ThreeTerrainRenderer;
              });
              drawVisualizer(
                context,
                size,
                {
                  ...current,
                  mode: 'spectrum',
                },
                renderStateRef.current,
                time,
              );
            } else {
              if (!terrainRendererRef.current) {
                terrainRendererRef.current = new terrainConstructorRef.current(terrainCanvas);
              }

              if (terrainFrequencyDataRef.current.length !== current.analyser.frequencyBinCount) {
                terrainFrequencyDataRef.current = new Uint8Array(current.analyser.frequencyBinCount);
              }

              current.analyser.getByteFrequencyData(terrainFrequencyDataRef.current);
              terrainRendererRef.current.render({
                frequencyData: terrainFrequencyDataRef.current,
                preset: current.preset,
                settings: current.settings,
                width: size.width,
                height: size.height,
                pixelRatio: size.pixelRatio,
                reducedMotion: current.reducedMotion,
                currentTime: time,
              });
            }
          } catch {
            drawVisualizer(
              context,
              size,
              {
                ...current,
                mode: 'spectrum',
              },
              renderStateRef.current,
              time,
            );
          }
        } else {
          drawVisualizer(context, size, current, renderStateRef.current, time);
        }

        lastDraw = time;
      }

      frame = window.requestAnimationFrame(animate);
    };

    frame = window.requestAnimationFrame(animate);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      terrainRendererRef.current?.dispose();
      terrainRendererRef.current = null;
    };
  }, []);

  return (
    <div
      className={`visualizer-surface ${mode === 'terrain' ? 'is-terrain-mode' : ''}`}
      ref={surfaceRef}
      aria-label="Audio visualizer"
    >
      <canvas className="visualizer-canvas visualizer-canvas-2d" ref={canvas2dRef} />
      <canvas className="visualizer-canvas visualizer-canvas-terrain" ref={terrainCanvasRef} />
    </div>
  );
}
