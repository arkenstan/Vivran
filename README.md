# Vivran

Vivran is a browser-first audio visualizer for Chromium-based browsers. It can capture audio from a user-selected browser tab, window, or screen through `getDisplayMedia`, then render responsive 2D and 3D visuals with the Web Audio API. A local audio-file source is included as a reliable fallback.

## Features

- Capture audio from a browser tab, window, or screen using the browser share dialog.
- Use local audio files when browser audio capture is unavailable.
- Visualize live audio with waveform, spectrum, radial starburst, oscilloscope, constellation, blob, and tunnel modes.
- Use Three.js-powered 3D Orb, Terrain, and Galaxy visualizers.
- Apply reactive color themes with bloom and emissive lighting.
- Adjust sensitivity, smoothing, and FFT size.
- Respect reduced-motion preferences and provide a focus mode for a distraction-free view.
- Stop and restart sources safely with audio-track cleanup and clear permission/error feedback.
- Deploy automatically to GitHub Pages through GitHub Actions.

## Setup

```bash
npm install
npm run dev
```

The app must run in a secure context. `localhost` works for development.

## Scripts

- `npm run dev` starts the Vite dev server.
- `npm run build` type-checks and builds production assets.
- `npm run lint` runs ESLint.
- `npm run test` runs the Vitest suite.

## GitHub Pages

The repository includes a GitHub Actions workflow that builds and deploys the app to GitHub Pages whenever changes are pushed to `main`. In the repository settings, set **Pages > Source** to **GitHub Actions**.

The Vite base path automatically becomes `/Vivran/` in GitHub Actions and remains `/` for local development. If the repository is renamed, update the `base` value in `vite.config.ts` to match the new repository name.

## Browser Support

Chromium/Chrome and Edge are the reference browsers for other-tab audio. Use **Share tab audio**, choose a browser tab in the share prompt, and enable the audio option. The app asks the browser to prefer tab surfaces, exclude the visualizer's own tab, allow tab switching when available, and include audio.

Firefox can expose screen sharing to web pages, but it does not currently provide other-tab audio tracks through the same normal web-page `getDisplayMedia` path. The app detects Firefox and explains that limitation in the source panel. Use Chrome/Edge for tab audio, or use the local-file source as a fallback.

Browser audio capture requires a user gesture, a selected display surface, and the audio checkbox enabled in the browser's share prompt. Permission is requested per session and is never assumed to persist.

## Capture Notes

The browser capture path requests both audio and video because shared-tab audio is tied to display capture. The app routes only audio into an `AnalyserNode`; it does not display or store the captured video track. Stopping from the app or from browser sharing controls releases all tracks and closes the Web Audio nodes.

## Future Desktop Direction

The audio source boundary is designed so an Electron shell can later provide platform-specific desktop/system loopback capture without replacing the visualizer core. Linux capture should be evaluated with PipeWire and desktop portal behavior; Windows and macOS have their own permission and loopback constraints.
