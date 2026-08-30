import type { AnalyzerSettings } from '../audio/types';
import { VisualMode, type VisualPreset } from './types';

const CONSTELLATION_PARTICLE_COUNT = 78;
const CONSTELLATION_CONNECTION_DISTANCE = 112;
const CONSTELLATION_BASS_BINS = 10;
const BLOB_BANDS = 14;
const TUNNEL_MAX_RINGS = 34;
const TUNNEL_BASS_BINS = 9;
const TWO_PI = Math.PI * 2;

type AudioByteData = Uint8Array<ArrayBuffer>;

export interface DrawOptions {
  analyser: AnalyserNode | null;
  mode: VisualMode;
  preset: VisualPreset;
  settings: AnalyzerSettings;
  active: boolean;
  reducedMotion: boolean;
}

export interface CanvasSize {
  width: number;
  height: number;
  pixelRatio: number;
}

export class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseRadius: number;
  burst = 0;

  constructor(width: number, height: number) {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.vx = (Math.random() - 0.5) * 0.42;
    this.vy = (Math.random() - 0.5) * 0.42;
    this.baseRadius = 1.6 + Math.random() * 2.6;
  }

  reset(width: number, height: number): void {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
  }

  pulse(strength: number): void {
    this.burst = Math.max(this.burst, strength);
    this.vx += (Math.random() - 0.5) * strength * 1.15;
    this.vy += (Math.random() - 0.5) * strength * 1.15;
  }

  update(width: number, height: number, volume: number, reducedMotion: boolean): void {
    const speedLimit = reducedMotion ? 0.55 : 2.35;
    const drift = reducedMotion ? 0.22 : 0.72 + volume * 0.7;

    this.x += this.vx * drift;
    this.y += this.vy * drift;
    this.vx *= 0.988;
    this.vy *= 0.988;
    this.burst *= 0.9;

    const speed = Math.hypot(this.vx, this.vy);
    if (speed > speedLimit) {
      this.vx = (this.vx / speed) * speedLimit;
      this.vy = (this.vy / speed) * speedLimit;
    }

    if (this.x < -8) {
      this.x = width + 8;
    } else if (this.x > width + 8) {
      this.x = -8;
    }

    if (this.y < -8) {
      this.y = height + 8;
    } else if (this.y > height + 8) {
      this.y = -8;
    }
  }

  get radius(): number {
    return this.baseRadius * (1 + this.burst * 0.9);
  }
}

export class Ring {
  radius: number;
  rotation: number;
  thickness: number;
  hue: number;

  constructor(hue: number) {
    this.radius = 4;
    this.rotation = Math.random() * TWO_PI;
    this.thickness = 1.5;
    this.hue = hue;
  }

  update(rotationSpeed: number, reducedMotion: boolean): void {
    this.radius += reducedMotion ? 2.3 : 5.8;
    this.rotation += rotationSpeed * (reducedMotion ? 0.25 : 1);
    this.thickness = 1.4 + this.radius * 0.012;
  }
}

export interface VisualizerRenderState {
  frequencyData: AudioByteData;
  waveData: AudioByteData;
  particles: Particle[];
  lastParticleWidth: number;
  lastParticleHeight: number;
  lastBassAverage: number;
  spectrumGradient: CanvasGradient | null;
  spectrumGradientHeight: number;
  spectrumGradientPreset: string;
  blobBands: Float32Array<ArrayBuffer>;
  rings: Ring[];
  lastTunnelBassAverage: number;
}

export function createVisualizerRenderState(): VisualizerRenderState {
  return {
    frequencyData: new Uint8Array(0),
    waveData: new Uint8Array(0),
    particles: [],
    lastParticleWidth: 0,
    lastParticleHeight: 0,
    lastBassAverage: 0,
    spectrumGradient: null,
    spectrumGradientHeight: 0,
    spectrumGradientPreset: '',
    blobBands: new Float32Array(BLOB_BANDS),
    rings: [],
    lastTunnelBassAverage: 0,
  };
}

function clear(ctx: CanvasRenderingContext2D, size: CanvasSize, preset: VisualPreset): void {
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = preset.background;
  ctx.fillRect(0, 0, size.width, size.height);
}

function drawIdle(ctx: CanvasRenderingContext2D, size: CanvasSize, preset: VisualPreset): void {
  clear(ctx, size, preset);
  const centerY = size.height / 2;
  const barCount = 38;
  const gap = 6;
  const barWidth = Math.max(3, (size.width - gap * (barCount - 1)) / barCount);

  ctx.save();
  ctx.shadowColor = preset.glow;
  ctx.shadowBlur = 18;

  for (let index = 0; index < barCount; index += 1) {
    const x = index * (barWidth + gap);
    const height = 8 + Math.sin(index * 0.8) * 5 + (index % 5) * 2;
    ctx.fillStyle = index % 3 === 0 ? preset.secondary : preset.primary;
    ctx.globalAlpha = 0.28;
    ctx.fillRect(x, centerY - height / 2, barWidth, height);
  }

  ctx.restore();
}

export function drawWaveform(
  ctx: CanvasRenderingContext2D,
  size: CanvasSize,
  waveData: AudioByteData,
  preset: VisualPreset,
  sensitivity: number,
): void {
  clear(ctx, size, preset);

  const sliceWidth = size.width / Math.max(1, waveData.length - 1);
  const centerY = size.height / 2;

  ctx.save();
  ctx.lineWidth = Math.max(2, size.width / 420);
  ctx.strokeStyle = preset.primary;
  ctx.shadowColor = preset.glow;
  ctx.shadowBlur = 20;
  ctx.beginPath();

  for (let index = 0; index < waveData.length; index += 1) {
    const normalized = (waveData[index] - 128) / 128;
    const y = centerY + normalized * centerY * 0.78 * sensitivity;
    const x = index * sliceWidth;

    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.stroke();

  ctx.lineWidth = 1;
  ctx.strokeStyle = preset.secondary;
  ctx.globalAlpha = 0.34;
  ctx.beginPath();
  ctx.moveTo(0, centerY);
  ctx.lineTo(size.width, centerY);
  ctx.stroke();
  ctx.restore();
}

function getSpectrumGradient(
  ctx: CanvasRenderingContext2D,
  size: CanvasSize,
  preset: VisualPreset,
  state: VisualizerRenderState,
): CanvasGradient {
  const key = `${preset.primary}:${preset.secondary}:${preset.accent}`;

  if (state.spectrumGradient && state.spectrumGradientHeight === size.height && state.spectrumGradientPreset === key) {
    return state.spectrumGradient;
  }

  const gradient = ctx.createLinearGradient(0, size.height, 0, 0);
  gradient.addColorStop(0, preset.primary);
  gradient.addColorStop(0.6, preset.secondary);
  gradient.addColorStop(1, preset.accent);

  state.spectrumGradient = gradient;
  state.spectrumGradientHeight = size.height;
  state.spectrumGradientPreset = key;

  return gradient;
}

export function drawSpectrum(
  ctx: CanvasRenderingContext2D,
  size: CanvasSize,
  frequencyData: AudioByteData,
  preset: VisualPreset,
  sensitivity: number,
  state: VisualizerRenderState,
): void {
  clear(ctx, size, preset);

  const barCount = Math.min(96, frequencyData.length);
  const gap = size.width < 520 ? 2 : 4;
  const barWidth = Math.max(2, (size.width - gap * (barCount - 1)) / barCount);
  const gradient = getSpectrumGradient(ctx, size, preset, state);

  ctx.save();
  ctx.shadowColor = preset.glow;
  ctx.shadowBlur = 16;

  for (let index = 0; index < barCount; index += 1) {
    const bucket = Math.floor((index / barCount) * frequencyData.length);
    const value = Math.min(255, frequencyData[bucket] * sensitivity);
    const height = Math.max(3, (value / 255) * size.height * 0.9);
    const x = index * (barWidth + gap);
    const y = size.height - height;

    ctx.fillStyle = gradient;
    ctx.globalAlpha = 0.78 + (index / barCount) * 0.2;
    ctx.fillRect(x, y, barWidth, height);
  }

  ctx.restore();
}

export function drawRadialStarburst(
  ctx: CanvasRenderingContext2D,
  size: CanvasSize,
  frequencyData: AudioByteData,
  preset: VisualPreset,
  sensitivity: number,
): void {
  clear(ctx, size, preset);

  const centerX = size.width / 2;
  const centerY = size.height / 2;
  const shortestSide = Math.min(size.width, size.height);
  const innerRadius = Math.max(42, shortestSide * 0.16);
  const maxBarLength = shortestSide * 0.34;
  const bufferLength = frequencyData.length;
  const angleStep = TWO_PI / bufferLength;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(2, shortestSide / 240);
  ctx.shadowBlur = 14;

  for (let index = 0; index < bufferLength; index += 1) {
    const amplitude = Math.min(1, (frequencyData[index] / 255) * sensitivity);
    const angle = index * angleStep - Math.PI / 2;
    const startX = centerX + Math.cos(angle) * innerRadius;
    const startY = centerY + Math.sin(angle) * innerRadius;
    const endRadius = innerRadius + 10 + amplitude * maxBarLength;
    const endX = centerX + Math.cos(angle) * endRadius;
    const endY = centerY + Math.sin(angle) * endRadius;
    const hue = (index / bufferLength) * 360 + amplitude * 72;
    const color = `hsl(${hue}, 92%, ${56 + amplitude * 16}%)`;

    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.globalAlpha = 0.42 + amplitude * 0.58;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }

  ctx.lineWidth = 1;
  ctx.strokeStyle = preset.secondary;
  ctx.globalAlpha = 0.28;
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(centerX, centerY, innerRadius * 0.82, 0, TWO_PI);
  ctx.stroke();
  ctx.restore();
}

export function drawNeonOscilloscope(
  ctx: CanvasRenderingContext2D,
  size: CanvasSize,
  waveData: AudioByteData,
  preset: VisualPreset,
  sensitivity: number,
): void {
  clear(ctx, size, preset);

  const bufferLength = waveData.length;
  const sliceWidth = size.width / Math.max(1, bufferLength - 1);
  const centerY = size.height / 2;
  const neonColor = preset.accent;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let gridY = 0; gridY <= 6; gridY += 1) {
    const y = (size.height / 6) * gridY;
    ctx.moveTo(0, y);
    ctx.lineTo(size.width, y);
  }
  ctx.stroke();

  ctx.strokeStyle = neonColor;
  ctx.shadowColor = neonColor;
  ctx.shadowBlur = 26;
  ctx.lineWidth = Math.max(2.5, size.width / 330);
  ctx.beginPath();

  for (let index = 0; index < bufferLength; index += 1) {
    const v = waveData[index] / 128;
    const centered = (v - 1) * sensitivity;
    const y = centerY + centered * centerY * 0.86;
    const x = index * sliceWidth;

    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.lineWidth = 1;
  ctx.strokeStyle = preset.primary;
  ctx.globalAlpha = 0.42;
  ctx.beginPath();
  ctx.moveTo(0, centerY);
  ctx.lineTo(size.width, centerY);
  ctx.stroke();
  ctx.restore();
}

export function drawConstellation(
  ctx: CanvasRenderingContext2D,
  size: CanvasSize,
  frequencyData: AudioByteData,
  preset: VisualPreset,
  sensitivity: number,
  reducedMotion: boolean,
  state: VisualizerRenderState,
): void {
  clear(ctx, size, preset);
  ensureParticles(state, size);

  const bassAverage = averageBins(frequencyData, CONSTELLATION_BASS_BINS) / 255;
  const volume = averageBins(frequencyData, frequencyData.length) / 255;
  const beatStrength = Math.max(0, bassAverage * sensitivity - 0.58);
  const isBeat = beatStrength > 0.1 && bassAverage > state.lastBassAverage + 0.04;

  if (isBeat && !reducedMotion) {
    for (let index = 0; index < state.particles.length; index += 1) {
      state.particles[index].pulse(Math.min(1.3, beatStrength * 2.1));
    }
  }

  state.lastBassAverage = bassAverage;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  for (let index = 0; index < state.particles.length; index += 1) {
    state.particles[index].update(size.width, size.height, volume, reducedMotion);
  }

  ctx.lineWidth = 1;
  for (let first = 0; first < state.particles.length; first += 1) {
    const particleA = state.particles[first];

    for (let second = first + 1; second < state.particles.length; second += 1) {
      const particleB = state.particles[second];
      const dx = particleA.x - particleB.x;
      const dy = particleA.y - particleB.y;
      const distance = Math.hypot(dx, dy);

      if (distance < CONSTELLATION_CONNECTION_DISTANCE) {
        const proximity = 1 - distance / CONSTELLATION_CONNECTION_DISTANCE;
        const opacity = Math.min(0.82, proximity * (0.16 + volume * sensitivity * 0.95));
        ctx.strokeStyle = `rgba(125, 211, 252, ${opacity})`;
        ctx.beginPath();
        ctx.moveTo(particleA.x, particleA.y);
        ctx.lineTo(particleB.x, particleB.y);
        ctx.stroke();
      }
    }
  }

  ctx.fillStyle = preset.secondary;
  ctx.shadowColor = preset.glow;
  ctx.shadowBlur = 16 + bassAverage * 16;

  for (let index = 0; index < state.particles.length; index += 1) {
    const particle = state.particles[index];
    ctx.globalAlpha = Math.min(1, 0.58 + volume * 0.8 + particle.burst * 0.24);
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, TWO_PI);
    ctx.fill();
  }

  ctx.restore();
}

export function drawBlob(
  ctx: CanvasRenderingContext2D,
  size: CanvasSize,
  frequencyData: AudioByteData,
  preset: VisualPreset,
  sensitivity: number,
  currentTime: number,
  state: VisualizerRenderState,
): void {
  clear(ctx, size, preset);
  updateBlobBands(state, frequencyData);

  const centerX = size.width / 2;
  const centerY = size.height / 2;
  const shortestSide = Math.min(size.width, size.height);
  const baseRadius = shortestSide * 0.19;
  const pulseRadius = shortestSide * 0.19 * sensitivity;
  const anchorCount = BLOB_BANDS * 2;
  const gradientAngle = currentTime * 0.00028;
  const gradientReach = shortestSide * 0.34;
  const gradient = ctx.createLinearGradient(
    centerX + Math.cos(gradientAngle) * gradientReach,
    centerY + Math.sin(gradientAngle) * gradientReach,
    centerX + Math.cos(gradientAngle + Math.PI) * gradientReach,
    centerY + Math.sin(gradientAngle + Math.PI) * gradientReach,
  );

  gradient.addColorStop(0, preset.primary);
  gradient.addColorStop(0.52, preset.secondary);
  gradient.addColorStop(1, preset.accent);

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.shadowColor = preset.glow;
  ctx.shadowBlur = 28;

  for (let layer = 0; layer < 3; layer += 1) {
    const layerScale = 1 - layer * 0.07;
    const alpha = 0.42 - layer * 0.1;
    drawBlobLayer(
      ctx,
      state,
      centerX,
      centerY,
      baseRadius * layerScale,
      pulseRadius * layerScale,
      anchorCount,
      currentTime,
      gradient,
      alpha,
    );
  }

  ctx.restore();
}

export function drawTunnel(
  ctx: CanvasRenderingContext2D,
  size: CanvasSize,
  frequencyData: AudioByteData,
  sensitivity: number,
  reducedMotion: boolean,
  currentTime: number,
  state: VisualizerRenderState,
): void {
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#02030a';
  ctx.fillRect(0, 0, size.width, size.height);

  const bassAverage = averageBins(frequencyData, TUNNEL_BASS_BINS) / 255;
  const highAverage = averageFrequencyRange(frequencyData, 0.58, 0.95) / 255;
  const beatStrength = Math.max(0, bassAverage * sensitivity - 0.6);
  const isBeat = beatStrength > 0.08 && bassAverage > state.lastTunnelBassAverage + 0.035;

  if (isBeat && state.rings.length < TUNNEL_MAX_RINGS) {
    state.rings.unshift(new Ring((currentTime * 0.05 + bassAverage * 180) % 360));
  }

  state.lastTunnelBassAverage = bassAverage;

  const centerX = size.width / 2;
  const centerY = size.height / 2;
  const maxRadius = Math.hypot(size.width, size.height) * 0.58;
  const rotationSpeed = 0.006 + highAverage * 0.06 * sensitivity;

  ctx.globalCompositeOperation = 'lighter';
  ctx.shadowBlur = 24;

  for (let index = state.rings.length - 1; index >= 0; index -= 1) {
    const ring = state.rings[index];
    ring.update(rotationSpeed, reducedMotion);

    if (ring.radius > maxRadius) {
      state.rings.splice(index, 1);
      continue;
    }

    const closeness = ring.radius / maxRadius;
    const hue = (ring.hue + currentTime * 0.025 + index * 18) % 360;
    const alpha = Math.max(0.12, 1 - closeness * 0.74);
    const sides = index % 2 === 0 ? 6 : 8;

    ctx.strokeStyle = `hsla(${hue}, 96%, ${62 + closeness * 14}%, ${alpha})`;
    ctx.shadowColor = `hsla(${hue}, 96%, 62%, 0.55)`;
    ctx.lineWidth = Math.max(1.2, ring.thickness + closeness * 5.5);
    drawPolygonRing(ctx, centerX, centerY, ring.radius, ring.rotation, sides);
  }

  ctx.restore();
}

export function drawVisualizer(
  ctx: CanvasRenderingContext2D,
  size: CanvasSize,
  options: DrawOptions,
  state: VisualizerRenderState,
  currentTime: number,
): void {
  if (!options.active || !options.analyser) {
    drawIdle(ctx, size, options.preset);
    return;
  }

  ensureAudioBuffers(state, options.analyser);

  switch (options.mode) {
    case VisualMode.Waveform:
      options.analyser.getByteTimeDomainData(state.waveData);
      drawWaveform(ctx, size, state.waveData, options.preset, options.settings.sensitivity);
      return;
    case VisualMode.Spectrum:
      options.analyser.getByteFrequencyData(state.frequencyData);
      drawSpectrum(ctx, size, state.frequencyData, options.preset, options.settings.sensitivity, state);
      return;
    case VisualMode.Radial:
      options.analyser.getByteFrequencyData(state.frequencyData);
      drawRadialStarburst(ctx, size, state.frequencyData, options.preset, options.settings.sensitivity);
      return;
    case VisualMode.Oscilloscope:
      options.analyser.getByteTimeDomainData(state.waveData);
      drawNeonOscilloscope(ctx, size, state.waveData, options.preset, options.settings.sensitivity);
      return;
    case VisualMode.Constellation:
      options.analyser.getByteFrequencyData(state.frequencyData);
      drawConstellation(
        ctx,
        size,
        state.frequencyData,
        options.preset,
        options.settings.sensitivity,
        options.reducedMotion,
        state,
      );
      return;
    case VisualMode.Terrain:
    case VisualMode.Orb:
    case VisualMode.Galaxy:
      options.analyser.getByteFrequencyData(state.frequencyData);
      drawSpectrum(ctx, size, state.frequencyData, options.preset, options.settings.sensitivity, state);
      return;
    case VisualMode.Blob:
      options.analyser.getByteFrequencyData(state.frequencyData);
      drawBlob(ctx, size, state.frequencyData, options.preset, options.settings.sensitivity, currentTime, state);
      return;
    case VisualMode.Tunnel:
      options.analyser.getByteFrequencyData(state.frequencyData);
      drawTunnel(
        ctx,
        size,
        state.frequencyData,
        options.settings.sensitivity,
        options.reducedMotion,
        currentTime,
        state,
      );
      return;
    default: {
      const exhaustive: never = options.mode;
      return exhaustive;
    }
  }
}

function ensureAudioBuffers(state: VisualizerRenderState, analyser: AnalyserNode): void {
  if (state.frequencyData.length !== analyser.frequencyBinCount) {
    state.frequencyData = new Uint8Array(analyser.frequencyBinCount);
  }

  if (state.waveData.length !== analyser.fftSize) {
    state.waveData = new Uint8Array(analyser.fftSize);
  }
}

function ensureParticles(state: VisualizerRenderState, size: CanvasSize): void {
  const needsInitialization = state.particles.length !== CONSTELLATION_PARTICLE_COUNT;
  const sizeChanged =
    Math.abs(state.lastParticleWidth - size.width) > 16 || Math.abs(state.lastParticleHeight - size.height) > 16;

  if (needsInitialization) {
    state.particles = [];

    for (let index = 0; index < CONSTELLATION_PARTICLE_COUNT; index += 1) {
      state.particles.push(new Particle(size.width, size.height));
    }
  } else if (sizeChanged) {
    for (let index = 0; index < state.particles.length; index += 1) {
      state.particles[index].reset(size.width, size.height);
    }
  }

  state.lastParticleWidth = size.width;
  state.lastParticleHeight = size.height;
}

function updateBlobBands(state: VisualizerRenderState, frequencyData: AudioByteData): void {
  for (let band = 0; band < BLOB_BANDS; band += 1) {
    const target = averageBand(frequencyData, band, BLOB_BANDS) / 255;
    state.blobBands[band] += (target - state.blobBands[band]) * 0.24;
  }
}

function drawBlobLayer(
  ctx: CanvasRenderingContext2D,
  state: VisualizerRenderState,
  centerX: number,
  centerY: number,
  baseRadius: number,
  pulseRadius: number,
  anchorCount: number,
  currentTime: number,
  fillStyle: CanvasGradient,
  alpha: number,
): void {
  const firstAngle = -Math.PI / 2;
  const lastAngle = firstAngle - TWO_PI / anchorCount;
  const firstRadius = getBlobRadius(state, 0, baseRadius, pulseRadius, currentTime);
  const lastRadius = getBlobRadius(state, anchorCount - 1, baseRadius, pulseRadius, currentTime);
  const firstX = centerX + Math.cos(firstAngle) * firstRadius;
  const firstY = centerY + Math.sin(firstAngle) * firstRadius;
  const lastX = centerX + Math.cos(lastAngle) * lastRadius;
  const lastY = centerY + Math.sin(lastAngle) * lastRadius;

  ctx.globalAlpha = alpha;
  ctx.fillStyle = fillStyle;
  ctx.beginPath();
  ctx.moveTo((firstX + lastX) / 2, (firstY + lastY) / 2);

  for (let anchor = 0; anchor < anchorCount; anchor += 1) {
    const angle = firstAngle + (anchor / anchorCount) * TWO_PI;
    const nextAngle = firstAngle + ((anchor + 1) / anchorCount) * TWO_PI;
    const radius = getBlobRadius(state, anchor, baseRadius, pulseRadius, currentTime);
    const nextRadius = getBlobRadius(state, anchor + 1, baseRadius, pulseRadius, currentTime);
    const anchorX = centerX + Math.cos(angle) * radius;
    const anchorY = centerY + Math.sin(angle) * radius;
    const nextX = centerX + Math.cos(nextAngle) * nextRadius;
    const nextY = centerY + Math.sin(nextAngle) * nextRadius;

    ctx.quadraticCurveTo(anchorX, anchorY, (anchorX + nextX) / 2, (anchorY + nextY) / 2);
  }

  ctx.closePath();
  ctx.fill();
}

function getBlobRadius(
  state: VisualizerRenderState,
  anchor: number,
  baseRadius: number,
  pulseRadius: number,
  currentTime: number,
): number {
  const band = anchor % BLOB_BANDS;
  const wobble = Math.sin(currentTime * 0.0016 + anchor * 0.83) * baseRadius * 0.045;
  return baseRadius + state.blobBands[band] * pulseRadius + wobble;
}

function drawPolygonRing(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  rotation: number,
  sides: number,
): void {
  ctx.beginPath();

  for (let side = 0; side < sides; side += 1) {
    const angle = rotation + (side / sides) * TWO_PI;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;

    if (side === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.closePath();
  ctx.stroke();
}

function averageBins(data: AudioByteData, count: number): number {
  const limit = Math.min(count, data.length);

  if (limit === 0) {
    return 0;
  }

  let total = 0;
  for (let index = 0; index < limit; index += 1) {
    total += data[index];
  }

  return total / limit;
}

function averageBand(data: AudioByteData, band: number, bandCount: number): number {
  const start = Math.floor((band / bandCount) * data.length);
  const end = Math.max(start + 1, Math.floor(((band + 1) / bandCount) * data.length));
  let total = 0;

  for (let index = start; index < end; index += 1) {
    total += data[index] ?? 0;
  }

  return total / (end - start);
}

function averageFrequencyRange(data: AudioByteData, startRatio: number, endRatio: number): number {
  const start = Math.floor(data.length * startRatio);
  const end = Math.max(start + 1, Math.floor(data.length * endRatio));
  let total = 0;

  for (let index = start; index < end; index += 1) {
    total += data[index] ?? 0;
  }

  return total / (end - start);
}
