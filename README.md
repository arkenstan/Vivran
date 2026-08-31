<p align="center">
  <img src="public/vivran-logo.png" alt="Vivran logo" width="128" height="128">
</p>

# Vivran

Vivran is a reactive audio visualizer for browser and Linux desktop use. It can visualize shared browser-tab audio, local audio files, or system output audio from the Tauri desktop app.

Try the web app: [Vivran](https://arkenstan.github.io/Vivran/)

## Features

- Browser audio capture through `getDisplayMedia` in Chromium-based browsers.
- Linux desktop system-output capture through Tauri and PipeWire loopback.
- Local audio-file playback for reliable offline visualization.
- 2D canvas visualizers: Spectrum, Waveform, Starburst, Scope, Constellation, Blob, and Tunnel.
- 3D React Three Fiber visualizers: 3D Orb, 3D Terrain, and 3D Galaxy.
- Color themes with live swatches.
- Sensitivity, smoothing, FFT size, and reduced-motion controls.
- Focus mode that hides app chrome and locks attention on the visualizer.
- Fullscreen support in both browser and Tauri desktop builds.
- Web favicon, PWA manifest icons, and generated Tauri desktop icons.

## Requirements

- Node.js and npm.
- Rust and Cargo for desktop builds.
- Linux desktop builds require the Tauri Linux prerequisites and PipeWire development/runtime packages for system audio capture.

See Tauri's official prerequisites page for distro-specific Linux dependencies:

https://v2.tauri.app/start/prerequisites/

## Web Development

```bash
npm install
npm run dev
```

Open the local Vite URL shown in the terminal.

## Web Production Build

```bash
npm run build
```

The static web build is written to `dist/`.

## Linux Desktop Development

```bash
npm install
npm run tauri -- dev
```

In the desktop app, use the speaker source button to capture system output audio. Microphone input is not used for the system-audio source.

## Linux Desktop Production Build

Build Debian and RPM packages:

```bash
CCACHE_DISABLE=1 npx tauri build --bundles deb,rpm
```

Outputs:

- `src-tauri/target/release/bundle/deb/`
- `src-tauri/target/release/bundle/rpm/`
- `src-tauri/target/release/app`

To try all configured Linux bundle targets:

```bash
CCACHE_DISABLE=1 npm run tauri -- build
```

If AppImage bundling fails because of `linuxdeploy`, build `deb,rpm` explicitly as shown above.

## Release Builds

GitHub Actions builds Linux and Windows desktop packages when a GitHub Release is created. The workflow is defined in `.github/workflows/release-desktop.yml` and uploads generated bundles to the release.

Current release targets:

- Linux: `.deb` and `.rpm`
- Windows: NSIS installer

## Other Operating Systems

This project is configured with Tauri, but only the Linux desktop build flow is documented here. For macOS, Windows, Android, or iOS packaging, follow Tauri's official distribution guide:

https://v2.tauri.app/distribute/

## Keyboard Shortcuts

- `F`: enter focus mode when an audio source is active.
- `Escape`: exit focus mode.
- Double-click the visualizer while in focus mode to leave focus mode.

Fullscreen is available from the toolbar button. Browser and operating-system fullscreen shortcuts, such as `F11` on many Linux/Windows environments, continue to be handled by the platform.

## Useful Commands

```bash
npm run lint
npm run test
npm run build
cargo check --manifest-path src-tauri/Cargo.toml
```

## Icons

The app logo source is:

```text
public/vivran-logo.png
```

Regenerate Tauri desktop icons:

```bash
npx tauri icon public/vivran-logo.png
```

Web icons live in `public/` and are linked from `index.html`.
