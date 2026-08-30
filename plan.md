## Plan: Vivran Browser-First Audio Visualizer

Build a React + TypeScript + Vite web MVP for Chromium-based browsers. The first release captures audio from a user-selected browser tab/window through `getDisplayMedia`, routes the stream into the Web Audio API, and renders responsive visual modes. Keep capture behind an `AudioSource` boundary so a later Electron shell can provide desktop/system loopback capture for Linux, Windows, and macOS without changing the analyzer or visualizer code.

**Steps**

1. Scaffold the empty repository as a Vite React TypeScript project with strict TypeScript, ESLint, and a minimal test setup. Add scripts for development, production build, lint, and tests.
2. Define the audio domain contracts and state model: source status (`idle`, `requesting`, `active`, `stopped`, `error`), source metadata, analyzer settings, visual preset, and user-facing error categories. Keep browser capture implementation separate from rendering/UI.
3. Implement browser capture using a user-initiated `navigator.mediaDevices.getDisplayMedia` call requesting audio and video, because browser screen-share audio requires a display track. Immediately create an `AudioContext`, `MediaStreamAudioSourceNode`, and `AnalyserNode`; do not persist permission assumptions. Stop every track and close/disconnect nodes on stop or source-ended events.
4. Add a fallback local-file input using an `<input type=file accept="audio/*">` and an `HTMLAudioElement` connected through `createMediaElementSource`, so the visualizer remains testable when a browser/site does not expose shareable audio. Keep microphone input out of the first release unless explicitly needed.
5. Build the visualizer engine around `requestAnimationFrame` and `AnalyserNode` data. Support at least waveform and frequency-spectrum modes, with stable canvas sizing via `ResizeObserver`, device-pixel-ratio scaling, cleanup on unmount, and a configurable smoothing/FFT size. Keep animation calculations independent from React render frequency.
6. Create the usable first screen: a clear source control area for `Share browser audio`, `Choose audio file`, and stop; a full-size canvas visualizer; mode/preset controls; sensitivity, smoothing, and color controls; status/error feedback; and a reduced-motion/accessibility path. Preserve a quiet operational layout rather than a marketing landing page.
7. Add a lightweight preset model with a few distinct reactive looks, keeping rendering functions composable so future WebGL/shader presets can be introduced without changing capture state. Avoid track metadata and playback controls in this MVP because captured browser audio does not reliably expose them.
8. Add focused tests for source-state transitions, cleanup when a stream ends, analyzer configuration, preset selection, and key UI states. Use mocked media devices/audio nodes for deterministic browser tests, then manually verify real capture in Chromium with a music tab and local-file fallback.
9. Document the supported path and limitations: HTTPS or localhost is required, capture must start from a user gesture, Chromium is the primary supported browser for audio capture, the user must select a share surface and enable audio, and Firefox/Safari may not provide equivalent tab/system audio. Include the future desktop-shell direction and Linux PipeWire/Windows/macOS permission considerations.
10. Verify with lint, unit/component tests, production build, and a manual browser matrix. Test start/stop/restart, source-ended behavior, denied permission, selected surface without audio, tab switching if offered, window resizing, high-DPI rendering, and mobile/narrow layouts. Confirm the project starts locally and provide the local URL.

**Architecture**

- `src/audio/` — source adapter contracts, browser display capture, local-file fallback, Web Audio lifecycle, and analyzer state.
- `src/visuals/` — canvas renderer, visual modes/presets, sizing, and animation loop.
- `src/components/` — source controls, visualizer canvas, settings, and status/error UI.
- `src/App.tsx` and `src/main.tsx` — page composition and application bootstrap.
- `src/**/*.test.ts(x)` — focused audio lifecycle and UI behavior tests.
- `README.md` — setup, browser requirements, limitations, and future desktop capture path.

**Verification**

- Run lint, unit/component tests, and production build.
- Start the Vite dev server and open the app over localhost in Chrome/Chromium.
- Select a browser tab playing music, explicitly enable/share its audio, and confirm waveform/spectrum motion responds.
- Stop sharing from both the app and browser controls; confirm tracks are released and a second capture starts cleanly.
- Test denied permission, no-audio selection, local-file fallback, resizing, high-DPI rendering, and narrow layouts.

**Decisions**

- First release is a web MVP, not Electron, because the primary input is browser music and Chromium exposes a user-selected display/tab audio path.
- Keep the implementation desktop-shell-ready through an audio-source adapter; defer Electron packaging and native/system loopback capture.
- Initial visuals are reactive waveform/spectrum/preset rendering; defer metadata, playback control, recording/export, MIDI/OSC, and shader/plugin authoring.
- Chromium/Chrome is the reference browser. Capture permissions are requested per session and never assumed to persist.
- Cross-platform desktop support is a future goal, not a claim of identical capture behavior in the web MVP.
