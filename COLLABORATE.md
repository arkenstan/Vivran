# Collaboration Guide

This guide is for people changing Vivran. Keep changes small, testable, and aligned with the app's existing split between audio sources, renderers, and controls.

## Project Shape

- `src/App.tsx` owns the main layout, focus mode, fullscreen toggle, and source routing.
- `src/audio/` owns browser capture, file playback, desktop capture bindings, analyser setup, and source state.
- `src/visuals/renderer.ts` owns 2D canvas visualizers.
- `src/components/ThreeVisualizerCanvas.tsx` owns React Three Fiber visualizers.
- `src/visuals/types.ts` defines visualizer mode IDs and preset types.
- `src/config.ts` contains shared app, analyser, 3D, and mode-option constants.
- `src-tauri/src/` owns native desktop commands.

## Before Changing Code

Run the fast checks when possible:

```bash
npm run lint
npm run test
npm run build
cargo check --manifest-path src-tauri/Cargo.toml
```

For Linux desktop release packaging:

```bash
CCACHE_DISABLE=1 npx tauri build --bundles deb,rpm
```

## Adding a 2D Canvas Visualizer

Use `src/visuals/renderer.ts`.

1. Add a new value to `VisualMode` in `src/visuals/types.ts`.
2. Add the dropdown label to `VISUAL_MODE_OPTIONS` in `src/config.ts`.
3. Add any persistent animation state to `VisualizerRenderState`.
4. Initialize that state in `createVisualizerRenderState()`.
5. Implement a standalone draw function that accepts canvas size, analyser data, preset, settings, and state as needed.
6. Add a `drawVisualizer()` switch case.
7. Add or update tests for mode registration and any pure helper logic.

Renderer rules:

- Do not allocate large arrays, gradients, classes, or temporary objects every frame.
- Reuse typed arrays or state stored in `VisualizerRenderState`.
- Always reset canvas state with `ctx.save()` and `ctx.restore()` around mode-specific styling.
- Keep text out of the visualizer canvas unless it is part of an actual mode.

## Adding a 3D Visualizer

Use `src/components/ThreeVisualizerCanvas.tsx`.

1. Add the mode to `VisualMode`.
2. Add it to `THREE_VISUAL_MODES` so `VisualizerCanvas` routes it to R3F.
3. Add the label to `VISUAL_MODE_OPTIONS`.
4. Add any constants to `THREE_CONFIG` in `src/config.ts`.
5. Create a standalone component that uses `useFrame()` for audio-reactive updates.
6. Store mutable animation data in `useRef()` or `useMemo()`, not React state.
7. Avoid `new` objects inside `useFrame()`; reuse `Object3D`, vectors, matrices, typed arrays, and geometry attributes.

For dense repeated objects, prefer `instancedMesh`. For dynamic terrain or waveform meshes, mutate geometry attributes and set `needsUpdate = true`.

## Audio Source Guidelines

- Browser tab/window capture lives in `src/audio/displaySource.ts`.
- Local file playback lives in `src/audio/fileSource.ts`.
- Desktop system audio lives in `src/audio/desktopSource.ts` and `src-tauri/src/audio.rs`.

Desktop system audio must remain loopback/system-output capture only. Do not silently fall back to microphone input for the system-audio button. If loopback capture is unavailable, return a clear user-facing error.

When adding a source:

1. Add a source kind to `AudioSourceKind`.
2. Keep source lifecycle cleanup complete: stop tracks, disconnect nodes, remove listeners, close contexts.
3. Normalize user-facing errors through `normalizeAudioError()`.
4. Add source reducer or factory tests when behavior changes.

## UI Guidelines

- Keep the first screen functional, not a marketing page.
- Prefer compact icon buttons for clear commands.
- Use tooltips through `title` and accessible names through `aria-label`.
- Keep controls responsive; verify mobile widths after layout changes.
- Focus mode should hide nonessential chrome and keep double-click/Escape exit behavior.
- Fullscreen and focus mode are separate: fullscreen controls the OS/browser window, focus mode controls app chrome.

## Desktop Build Notes

Linux system-output capture uses PipeWire through `flexaudio`. On systems without a running PipeWire session or loopback support, the app should report that system capture is unavailable rather than recording a microphone.

Tauri build and packaging references:

- Prerequisites: https://v2.tauri.app/start/prerequisites/
- Distribution guide: https://v2.tauri.app/distribute/

## Pull Request Checklist

- App builds with `npm run build`.
- Tests pass with `npm run test`.
- Lint passes with `npm run lint`.
- Native code compiles with `cargo check --manifest-path src-tauri/Cargo.toml` when touched.
- New visual modes are listed in `VISUAL_MODE_OPTIONS`.
- New desktop permissions are declared in `src-tauri/capabilities/default.json`.
- Screenshots or manual notes are included for significant UI or visualizer changes.
