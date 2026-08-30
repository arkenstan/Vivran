import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import {
  DoubleSide,
  type BufferAttribute,
  type IcosahedronGeometry,
  type InstancedMesh,
  type Mesh,
  type MeshPhysicalMaterial,
  type MeshStandardMaterial,
  Object3D,
  type PlaneGeometry,
} from 'three';
import type { AnalyzerSettings } from '../audio/types';
import type { ThreeVisualMode, VisualPreset } from '../visuals/types';

type AudioByteData = Uint8Array<ArrayBuffer>;

const TERRAIN_COLUMNS = 128;
const TERRAIN_ROWS = 64;
const TERRAIN_WIDTH = 34;
const TERRAIN_DEPTH = 40;
const GALAXY_PARTICLE_COUNT = 512;

interface ThreeVisualizerCanvasProps {
  analyser: AnalyserNode | null;
  active: boolean;
  mode: ThreeVisualMode;
  preset: VisualPreset;
  settings: AnalyzerSettings;
  reducedMotion: boolean;
}

interface ThreeSceneProps {
  analyser: AnalyserNode | null;
  active: boolean;
  preset: VisualPreset;
  settings: AnalyzerSettings;
  reducedMotion: boolean;
}

export function ThreeVisualizerCanvas({
  analyser,
  active,
  mode,
  preset,
  settings,
  reducedMotion,
}: ThreeVisualizerCanvasProps) {
  return (
    <Canvas
      className="visualizer-r3f"
      camera={{
        position: mode === 'terrain' ? [0, 18, 34] : [0, 8, 16],
        fov: 52,
        near: 0.1,
        far: 180,
      }}
      dpr={[1, 1.5]}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      }}
    >
      <color attach="background" args={[preset.background]} />
      <ambientLight intensity={0.4} />
      <pointLight position={[0, 8, 8]} intensity={1.8} color={preset.primary} />
      <pointLight position={[-8, -2, -6]} intensity={0.8} color={preset.accent} />

      {mode === 'orb' ? (
        <GlowingOrbAnalyser
          analyser={analyser}
          active={active}
          preset={preset}
          settings={settings}
          reducedMotion={reducedMotion}
        />
      ) : null}
      {mode === 'terrain' ? (
        <TerrainSpectrogram
          analyser={analyser}
          active={active}
          preset={preset}
          settings={settings}
          reducedMotion={reducedMotion}
        />
      ) : null}
      {mode === 'galaxy' ? (
        <InstancedGalaxy
          analyser={analyser}
          active={active}
          preset={preset}
          settings={settings}
          reducedMotion={reducedMotion}
        />
      ) : null}

      <EffectComposer multisampling={0}>
        <Bloom intensity={0.72} luminanceThreshold={0.08} luminanceSmoothing={0.72} mipmapBlur />
      </EffectComposer>
    </Canvas>
  );
}

export function GlowingOrbAnalyser({ analyser, active, preset, settings, reducedMotion }: ThreeSceneProps) {
  const meshRef = useRef<Mesh<IcosahedronGeometry, MeshStandardMaterial> | null>(null);
  const geometryRef = useRef<IcosahedronGeometry | null>(null);
  const materialRef = useRef<MeshStandardMaterial | null>(null);
  const frequencyDataRef = useRef<AudioByteData>(new Uint8Array(0));
  const basePositionsRef = useRef<Float32Array | null>(null);
  const smoothedBassRef = useRef(0);
  const smoothedVolumeRef = useRef(0);

  useLayoutEffect(() => {
    const positions = geometryRef.current?.attributes.position;

    if (positions) {
      basePositionsRef.current = new Float32Array(positions.array as ArrayLike<number>);
    }
  }, []);

  useEffect(() => {
    if (!materialRef.current) {
      return;
    }

    materialRef.current.color.set(preset.secondary);
    materialRef.current.emissive.set(preset.primary);
  }, [preset]);

  useFrame(({ clock }) => {
    const frequencyData = readFrequencyData(analyser, active, frequencyDataRef);
    const bass = averageBins(frequencyData, 18) / 255;
    const volume = averageRange(frequencyData, 0.08, 0.82) / 255;
    smoothedBassRef.current += (bass - smoothedBassRef.current) * 0.18;
    smoothedVolumeRef.current += (volume - smoothedVolumeRef.current) * 0.12;

    const smoothedBass = smoothedBassRef.current;
    const smoothedVolume = smoothedVolumeRef.current;
    const scale = 1.12 + smoothedVolume * settings.sensitivity * 0.55 + smoothedBass * 0.45;
    meshRef.current?.scale.set(scale, scale, scale);

    if (meshRef.current) {
      meshRef.current.rotation.x += reducedMotion ? 0.0015 : 0.0035 + smoothedVolume * 0.006;
      meshRef.current.rotation.y += reducedMotion ? 0.002 : 0.006 + smoothedBass * 0.014;
    }

    const geometry = geometryRef.current;
    const basePositions = basePositionsRef.current;

    if (geometry && basePositions) {
      const positions = geometry.attributes.position as BufferAttribute;
      const array = positions.array as Float32Array;
      const time = clock.elapsedTime;
      const spike = Math.max(0, smoothedBass * settings.sensitivity - 0.26);
      const wobbleAmount = reducedMotion ? 0.08 : 0.18 + spike * 0.88;

      for (let index = 0; index < array.length; index += 3) {
        const baseX = basePositions[index];
        const baseY = basePositions[index + 1];
        const baseZ = basePositions[index + 2];
        const ripple =
          Math.sin(baseX * 3.8 + time * 1.7) + Math.sin(baseY * 4.2 + time * 1.1) + Math.cos(baseZ * 3.4 + time * 1.4);
        const displacement = 1 + Math.max(0, ripple / 3) * wobbleAmount;

        array[index] = baseX * displacement;
        array[index + 1] = baseY * displacement;
        array[index + 2] = baseZ * displacement;
      }

      positions.needsUpdate = true;
    }

    if (materialRef.current) {
      materialRef.current.emissiveIntensity = 1.05 + smoothedBass * 2.9 + smoothedVolume * 1.4;
    }
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <icosahedronGeometry ref={geometryRef} args={[2.3, 4]} />
        <meshStandardMaterial
          ref={materialRef}
          color={preset.secondary}
          emissive={preset.primary}
          emissiveIntensity={1.2}
          wireframe
          roughness={0.32}
          metalness={0.08}
        />
      </mesh>
      <mesh scale={2.55}>
        <icosahedronGeometry args={[2.3, 2]} />
        <meshStandardMaterial
          color={preset.accent}
          emissive={preset.accent}
          emissiveIntensity={0.28}
          transparent
          opacity={0.08}
          wireframe
        />
      </mesh>
    </group>
  );
}

export function TerrainSpectrogram({ analyser, active, preset, settings, reducedMotion }: ThreeSceneProps) {
  const meshRef = useRef<Mesh<PlaneGeometry, MeshStandardMaterial> | null>(null);
  const geometryRef = useRef<PlaneGeometry | null>(null);
  const materialRef = useRef<MeshStandardMaterial | null>(null);
  const frequencyDataRef = useRef<AudioByteData>(new Uint8Array(0));
  const heightsRef = useRef(new Float32Array(TERRAIN_ROWS * TERRAIN_COLUMNS));
  const lastFrameTimeRef = useRef(0);

  useEffect(() => {
    if (!materialRef.current) {
      return;
    }

    materialRef.current.color.set(preset.primary);
    materialRef.current.emissive.set(preset.secondary);
  }, [preset]);

  useFrame(({ clock }) => {
    const frameInterval = reducedMotion ? 0.12 : 0.032;

    if (clock.elapsedTime - lastFrameTimeRef.current < frameInterval) {
      return;
    }

    lastFrameTimeRef.current = clock.elapsedTime;
    const frequencyData = readFrequencyData(analyser, active, frequencyDataRef);
    const heights = heightsRef.current;
    heights.copyWithin(TERRAIN_COLUMNS, 0, (TERRAIN_ROWS - 1) * TERRAIN_COLUMNS);

    const rangeEnd = Math.max(1, Math.floor(frequencyData.length * 0.72));
    const heightScale = reducedMotion ? 4.5 : 9.5;

    for (let column = 0; column < TERRAIN_COLUMNS; column += 1) {
      const start = Math.floor((column / TERRAIN_COLUMNS) * rangeEnd);
      const end = Math.max(start + 1, Math.floor(((column + 1) / TERRAIN_COLUMNS) * rangeEnd));
      let total = 0;

      for (let index = start; index < end; index += 1) {
        total += frequencyData[index] ?? 0;
      }

      const average = total / (end - start) / 255;
      heights[column] = Math.min(1, average * settings.sensitivity) ** 1.3 * heightScale;
    }

    const geometry = geometryRef.current;

    if (!geometry) {
      return;
    }

    const positions = geometry.attributes.position as BufferAttribute;
    const array = positions.array as Float32Array;

    for (let row = 0; row < TERRAIN_ROWS; row += 1) {
      for (let column = 0; column < TERRAIN_COLUMNS; column += 1) {
        array[(row * TERRAIN_COLUMNS + column) * 3 + 2] = heights[row * TERRAIN_COLUMNS + column];
      }
    }

    positions.needsUpdate = true;
    geometry.computeBoundingSphere();

    if (meshRef.current) {
      meshRef.current.position.z = 5 + Math.sin(clock.elapsedTime * 0.65) * 0.12;
    }

    if (materialRef.current) {
      materialRef.current.emissiveIntensity = 0.7 + averageBins(frequencyData, 14) / 255;
    }
  });

  return (
    <group position={[0, -3.7, 8]} rotation={[0.28, 0, 0]} scale={0.68}>
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry ref={geometryRef} args={[TERRAIN_WIDTH, TERRAIN_DEPTH, TERRAIN_COLUMNS - 1, TERRAIN_ROWS - 1]} />
        <meshStandardMaterial
          ref={materialRef}
          color={preset.primary}
          emissive={preset.secondary}
          emissiveIntensity={0.85}
          metalness={0}
          roughness={0.66}
          side={DoubleSide}
          wireframe
        />
      </mesh>
    </group>
  );
}

export function InstancedGalaxy({ analyser, active, preset, settings, reducedMotion }: ThreeSceneProps) {
  const meshRef = useRef<InstancedMesh | null>(null);
  const materialRef = useRef<MeshPhysicalMaterial | null>(null);
  const frequencyDataRef = useRef<AudioByteData>(new Uint8Array(0));
  const dummy = useMemo(() => new Object3D(), []);
  const galaxy = useMemo(() => {
    const positions = new Float32Array(GALAXY_PARTICLE_COUNT * 3);
    const phase = new Float32Array(GALAXY_PARTICLE_COUNT);

    for (let index = 0; index < GALAXY_PARTICLE_COUNT; index += 1) {
      const ratio = index / GALAXY_PARTICLE_COUNT;
      const arm = index % 5;
      const angle = ratio * Math.PI * 14 + arm * 1.256;
      const radius = 1.4 + ratio * 8.9;
      const offset = Math.sin(index * 19.19) * 0.55;
      const cursor = index * 3;

      positions[cursor] = Math.cos(angle) * radius + Math.cos(arm) * offset;
      positions[cursor + 1] = (Math.sin(index * 7.31) - 0.5) * 1.2;
      positions[cursor + 2] = Math.sin(angle) * radius + Math.sin(arm) * offset;
      phase[index] = angle;
    }

    return { positions, phase };
  }, []);

  useEffect(() => {
    if (!materialRef.current) {
      return;
    }

    materialRef.current.color.set(preset.secondary);
    materialRef.current.emissive.set(preset.primary);
  }, [preset]);

  useFrame(({ clock }) => {
    const frequencyData = readFrequencyData(analyser, active, frequencyDataRef);
    const mesh = meshRef.current;

    if (!mesh) {
      return;
    }

    const rotation = clock.elapsedTime * (reducedMotion ? 0.05 : 0.16);
    const cosRotation = Math.cos(rotation);
    const sinRotation = Math.sin(rotation);
    const dataLength = Math.max(1, frequencyData.length);
    let total = 0;

    for (let index = 0; index < GALAXY_PARTICLE_COUNT; index += 1) {
      const bin = Math.min(dataLength - 1, Math.floor((index / GALAXY_PARTICLE_COUNT) * dataLength));
      const amplitude = (frequencyData[bin] ?? 0) / 255;
      const cursor = index * 3;
      const baseX = galaxy.positions[cursor];
      const baseY = galaxy.positions[cursor + 1];
      const baseZ = galaxy.positions[cursor + 2];
      const wave = Math.sin(galaxy.phase[index] + clock.elapsedTime * 1.35) * 0.25;
      const height = amplitude * settings.sensitivity * (reducedMotion ? 2.4 : 6.2);
      const scale = 0.08 + amplitude * 0.42;

      dummy.position.set(
        baseX * cosRotation - baseZ * sinRotation,
        baseY + height + wave,
        baseX * sinRotation + baseZ * cosRotation,
      );
      dummy.scale.set(scale, scale * (1 + amplitude * 3.4), scale);
      dummy.rotation.set(0.4 + amplitude, rotation + galaxy.phase[index], 0.2);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
      total += amplitude;
    }

    mesh.instanceMatrix.needsUpdate = true;

    if (materialRef.current) {
      materialRef.current.emissiveIntensity = 0.82 + (total / GALAXY_PARTICLE_COUNT) * 2.4;
    }
  });

  return (
    <group rotation={[0.24, 0, 0]} position={[0, -1.2, 0]}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, GALAXY_PARTICLE_COUNT]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhysicalMaterial
          ref={materialRef}
          color={preset.secondary}
          emissive={preset.primary}
          emissiveIntensity={1}
          roughness={0.78}
          metalness={0.22}
          clearcoat={0.55}
          clearcoatRoughness={0.42}
        />
      </instancedMesh>
    </group>
  );
}

function readFrequencyData(
  analyser: AnalyserNode | null,
  active: boolean,
  frequencyDataRef: React.MutableRefObject<AudioByteData>,
): AudioByteData {
  if (analyser && frequencyDataRef.current.length !== analyser.frequencyBinCount) {
    frequencyDataRef.current = new Uint8Array(analyser.frequencyBinCount);
  }

  if (analyser && active) {
    analyser.getByteFrequencyData(frequencyDataRef.current);
  } else {
    for (let index = 0; index < frequencyDataRef.current.length; index += 1) {
      frequencyDataRef.current[index] *= 0.9;
    }
  }

  return frequencyDataRef.current;
}

function averageBins(data: AudioByteData, bins: number): number {
  const count = Math.min(bins, data.length);

  if (count === 0) {
    return 0;
  }

  let total = 0;

  for (let index = 0; index < count; index += 1) {
    total += data[index] ?? 0;
  }

  return total / count;
}

function averageRange(data: AudioByteData, startRatio: number, endRatio: number): number {
  if (data.length === 0) {
    return 0;
  }

  const start = Math.floor(data.length * startRatio);
  const end = Math.max(start + 1, Math.floor(data.length * endRatio));
  let total = 0;

  for (let index = start; index < end; index += 1) {
    total += data[index] ?? 0;
  }

  return total / (end - start);
}
