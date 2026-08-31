use flexaudio::{open, OutputFormat, SourceKind, StreamConfig};
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc, Mutex,
};
use std::thread::{self, JoinHandle};
use std::time::Duration;
use tauri::{AppHandle, Emitter, State};

const OUTPUT_SAMPLE_RATE: u32 = 48_000;
const OUTPUT_CHANNELS: u16 = 1;

pub struct AudioState {
    pub capture: Mutex<Option<SystemAudioCapture>>,
}

pub struct SystemAudioCapture {
    stop_requested: Arc<AtomicBool>,
    worker: Option<JoinHandle<()>>,
}

impl SystemAudioCapture {
    fn stop(mut self) {
        self.stop_requested.store(true, Ordering::SeqCst);

        if let Some(worker) = self.worker.take() {
            let _ = worker.join();
        }
    }
}

#[tauri::command]
pub fn start_audio_capture(app: AppHandle, state: State<'_, AudioState>) -> Result<u32, String> {
    stop_existing_capture(&state);

    let mut stream = open(StreamConfig {
        kind: SourceKind::SystemLoopback,
        exclude_self: true,
        output: OutputFormat {
            sample_rate: OUTPUT_SAMPLE_RATE,
            channels: OUTPUT_CHANNELS,
        },
        ..Default::default()
    })
    .map_err(map_flexaudio_error)?;

    stream.start().map_err(map_flexaudio_error)?;

    let stop_requested = Arc::new(AtomicBool::new(false));
    let worker_stop_requested = Arc::clone(&stop_requested);
    let worker = thread::Builder::new()
        .name("vivran-system-audio".into())
        .spawn(move || {
            while !worker_stop_requested.load(Ordering::SeqCst) {
                if let Some(chunk) = stream.poll_chunk() {
                    let _ = app.emit("audio-data", chunk.data);
                } else {
                    thread::sleep(Duration::from_millis(4));
                }
            }

            stream.stop();
        })
        .map_err(|error| {
            format!("Failed to start system audio worker thread: {error}")
        })?;

    *state.capture.lock().unwrap() = Some(SystemAudioCapture {
        stop_requested,
        worker: Some(worker),
    });

    Ok(OUTPUT_SAMPLE_RATE)
}

#[tauri::command]
pub fn stop_audio_capture(state: State<'_, AudioState>) -> Result<(), String> {
    stop_existing_capture(&state);
    Ok(())
}

fn stop_existing_capture(state: &State<'_, AudioState>) {
    if let Some(capture) = state.capture.lock().unwrap().take() {
        capture.stop();
    }
}

fn map_flexaudio_error(error: flexaudio::Error) -> String {
    match error {
        flexaudio::Error::Unsupported => {
            "System output capture is not supported in this environment.".into()
        }
        flexaudio::Error::UnsupportedOsVersion => {
            "System output capture is not supported by this operating system version.".into()
        }
        flexaudio::Error::PermissionDenied => {
            "Permission to capture system output was denied.".into()
        }
        flexaudio::Error::DeviceNotFound => {
            "No system output capture device was found.".into()
        }
        flexaudio::Error::Backend(message) if message.to_lowercase().contains("pipewire") => {
            "System output capture requires a running PipeWire audio session.".into()
        }
        other => format!("Failed to capture system output audio: {other}"),
    }
}
