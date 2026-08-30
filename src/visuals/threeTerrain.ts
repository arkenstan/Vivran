import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  LineBasicMaterial,
  LineSegments,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three';
import type { AnalyzerSettings } from '../audio/types';
import type { VisualPreset } from './types';

const TERRAIN_ROWS = 48;
const TERRAIN_COLUMNS = 64;
const GRID_WIDTH = 112;
const GRID_DEPTH = 146;
const FAR_ROW = TERRAIN_ROWS - 1;

type AudioByteData = Uint8Array<ArrayBuffer>;

export interface ThreeTerrainRenderOptions {
  frequencyData: AudioByteData;
  preset: VisualPreset;
  settings: AnalyzerSettings;
  width: number;
  height: number;
  pixelRatio: number;
  reducedMotion: boolean;
  currentTime: number;
}

export class ThreeTerrainRenderer {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(58, 1, 0.1, 520);
  private readonly geometry = new BufferGeometry();
  private readonly material = new LineBasicMaterial({
    transparent: true,
    opacity: 0.86,
    vertexColors: true,
    blending: AdditiveBlending,
    depthWrite: false,
  });
  private readonly terrain = new LineSegments(this.geometry, this.material);
  private readonly heights = new Float32Array(TERRAIN_ROWS * TERRAIN_COLUMNS);
  private readonly positions: Float32Array;
  private readonly colors: Float32Array;
  private readonly primaryColor = new Color();
  private readonly secondaryColor = new Color();
  private readonly accentColor = new Color();
  private lastWidth = 0;
  private lastHeight = 0;
  private lastFrameTime = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setClearColor(0x020006, 1);

    const segmentCount = TERRAIN_ROWS * (TERRAIN_COLUMNS - 1) + (TERRAIN_ROWS - 1) * TERRAIN_COLUMNS;
    this.positions = new Float32Array(segmentCount * 2 * 3);
    this.colors = new Float32Array(segmentCount * 2 * 3);

    this.geometry.setAttribute('position', new BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new BufferAttribute(this.colors, 3));
    this.terrain.frustumCulled = false;
    this.terrain.scale.setScalar(0.72);
    this.scene.add(this.terrain);

    this.camera.position.set(0, 62, 128);
    this.camera.lookAt(0, -8, -68);
  }

  render(options: ThreeTerrainRenderOptions): void {
    this.resize(options.width, options.height, options.pixelRatio);
    this.pushFrequencyFrame(
      options.frequencyData,
      options.settings.sensitivity,
      options.reducedMotion,
      options.currentTime,
    );
    this.updateLineGeometry(options.preset, options.currentTime);
    this.terrain.rotation.z = Math.sin(options.currentTime * 0.00028) * 0.018;
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    this.renderer.dispose();
  }

  private resize(width: number, height: number, pixelRatio: number): void {
    const boundedPixelRatio = Math.min(pixelRatio, 1.5);

    if (this.lastWidth === width && this.lastHeight === height) {
      return;
    }

    this.lastWidth = width;
    this.lastHeight = height;
    this.camera.aspect = width / Math.max(1, height);
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(boundedPixelRatio);
    this.renderer.setSize(width, height, false);
  }

  private pushFrequencyFrame(
    frequencyData: AudioByteData,
    sensitivity: number,
    reducedMotion: boolean,
    currentTime: number,
  ): void {
    const minInterval = reducedMotion ? 120 : 34;

    if (currentTime - this.lastFrameTime < minInterval) {
      return;
    }

    this.lastFrameTime = currentTime;
    this.heights.copyWithin(0, TERRAIN_COLUMNS);

    const rangeEnd = Math.max(1, Math.floor(frequencyData.length * 0.72));
    const amplitudeScale = reducedMotion ? 0.45 : 1;

    for (let column = 0; column < TERRAIN_COLUMNS; column += 1) {
      const start = Math.floor((column / TERRAIN_COLUMNS) * rangeEnd);
      const end = Math.max(start + 1, Math.floor(((column + 1) / TERRAIN_COLUMNS) * rangeEnd));
      let total = 0;

      for (let index = start; index < end; index += 1) {
        total += frequencyData[index] ?? 0;
      }

      const average = total / (end - start) / 255;
      this.heights[FAR_ROW * TERRAIN_COLUMNS + column] = Math.min(1, average * sensitivity * amplitudeScale) ** 1.35;
    }
  }

  private updateLineGeometry(preset: VisualPreset, currentTime: number): void {
    this.primaryColor.set(preset.primary);
    this.secondaryColor.set(preset.secondary);
    this.accentColor.set(preset.accent);

    let cursor = 0;

    for (let row = 0; row < TERRAIN_ROWS; row += 1) {
      for (let column = 0; column < TERRAIN_COLUMNS - 1; column += 1) {
        cursor = this.writeSegment(cursor, row, column, row, column + 1, currentTime);
      }
    }

    for (let column = 0; column < TERRAIN_COLUMNS; column += 3) {
      for (let row = 0; row < TERRAIN_ROWS - 1; row += 1) {
        cursor = this.writeSegment(cursor, row, column, row + 1, column, currentTime);
      }
    }

    const positionAttribute = this.geometry.getAttribute('position') as BufferAttribute;
    const colorAttribute = this.geometry.getAttribute('color') as BufferAttribute;
    positionAttribute.needsUpdate = true;
    colorAttribute.needsUpdate = true;
    this.geometry.computeBoundingSphere();
  }

  private writeSegment(
    cursor: number,
    rowA: number,
    columnA: number,
    rowB: number,
    columnB: number,
    currentTime: number,
  ): number {
    const nextCursor = this.writePoint(cursor, rowA, columnA, currentTime);
    return this.writePoint(nextCursor, rowB, columnB, currentTime);
  }

  private writePoint(cursor: number, row: number, column: number, currentTime: number): number {
    const rowRatio = row / (TERRAIN_ROWS - 1);
    const columnRatio = column / (TERRAIN_COLUMNS - 1);
    const height = this.heights[row * TERRAIN_COLUMNS + column];
    const x = (columnRatio - 0.5) * GRID_WIDTH;
    const z = 18 - rowRatio * GRID_DEPTH;
    const y = -13 + height * 34 + Math.sin(currentTime * 0.0012 + columnRatio * 9) * 0.35;
    const baseMix = rowRatio;
    const accentMix = height * 0.42;
    const mixedR = this.primaryColor.r + (this.secondaryColor.r - this.primaryColor.r) * baseMix;
    const mixedG = this.primaryColor.g + (this.secondaryColor.g - this.primaryColor.g) * baseMix;
    const mixedB = this.primaryColor.b + (this.secondaryColor.b - this.primaryColor.b) * baseMix;
    const r = mixedR + (this.accentColor.r - mixedR) * accentMix;
    const g = mixedG + (this.accentColor.g - mixedG) * accentMix;
    const b = mixedB + (this.accentColor.b - mixedB) * accentMix;
    const fade = 0.16 + (1 - rowRatio) * 0.84;

    this.positions[cursor] = x;
    this.positions[cursor + 1] = y;
    this.positions[cursor + 2] = z;
    this.colors[cursor] = r * fade;
    this.colors[cursor + 1] = g * fade;
    this.colors[cursor + 2] = b * fade;

    return cursor + 3;
  }
}
