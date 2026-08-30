# Vivran Project Context

## Product goal

Create an audio visualizer that reacts to music playing in another browser window, especially browser music sites.

## Recommendation

Start with a web-first MVP using React, TypeScript, and Vite. Chromium browsers can ask the user to share a browser tab or window and include its audio in a `MediaStream`. This matches the primary workflow and allows fast iteration.

Keep audio acquisition behind an adapter so an Electron desktop shell can be added later for stronger system-wide capture. Desktop capture should be evaluated per platform rather than assumed to behave identically everywhere.

## Browser capture constraints

- `navigator.mediaDevices.getDisplayMedia` requires a user gesture.
- The browser prompts for a capture surface and permission for each session.
- A video/display track is required even when the application primarily needs audio.
- The user must explicitly enable audio sharing when selecting a tab/window/screen.
- Audio capture support differs by browser; Chromium is the reference target. Firefox and Safari may not expose equivalent tab/system audio capture.
- The API requires a secure context; `localhost` works for development.

## Planned MVP

- Browser-tab/window audio capture.
- Local audio-file fallback.
- Web Audio API analyzer pipeline.
- Waveform and frequency-spectrum visual modes.
- Reactive presets, sensitivity, smoothing, and color controls.
- Start, stop, restart, permission-error, and no-audio feedback.
- Responsive canvas rendering with resize and high-DPI handling.
- Focused automated tests plus manual Chromium verification.

## Deferred scope

- Electron packaging and native system loopback capture.
- Track metadata and playback controls for captured browser audio.
- Recording/export, MIDI/OSC, shader authoring, and plugin extensibility.

## Desktop direction

Electron can provide a more integrated desktop experience, but Linux capture depends on PipeWire and desktop configuration; Windows and macOS also have platform-specific permissions and loopback behavior. Revisit Electron after the shared analyzer and visualizer core are working in the web MVP.

## Initial decisions

- Web MVP first.
- Reactive visuals first.
- Chromium/Chrome is the supported reference browser.
- Permission is never assumed to persist.
- Cross-platform desktop support is a future direction, not a promise of identical behavior in the web MVP.
