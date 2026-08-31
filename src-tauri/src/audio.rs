use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::Sample;
use std::sync::{mpsc, Mutex};
use std::thread;
use tauri::{AppHandle, Emitter, State};

pub struct AudioState {
    pub stream: Mutex<Option<cpal::Stream>>,
}

#[tauri::command]
pub fn start_audio_capture(app: AppHandle, state: State<'_, AudioState>) -> Result<u32, String> {
    let host = cpal::default_host();
    
    // For loopback capture on Linux, we often need a monitor device.
    let mut selected_device = None;
    if let Ok(devices) = host.input_devices() {
        for device in devices {
            if let Ok(name) = device.name() {
                if name.to_lowercase().contains("monitor") {
                    selected_device = Some(device);
                    break;
                }
            }
        }
    }
    
    let device = selected_device.or_else(|| host.default_input_device()).ok_or("No input device found")?;
    println!("Capturing audio from: {:?}", device.name().unwrap_or_else(|_| "unknown".into()));
    
    let config = device.default_input_config().map_err(|e| e.to_string())?;
    // The previous error was: `u32` is a primitive type and therefore doesn't have fields
    // which means config.sample_rate() actually evaluates to `u32`
    // (Wait, `SupportedStreamConfig` is from `cpal::SupportedStreamConfig`. Wait! `sample_rate()` returns `cpal::SampleRate`. Wait, I will use `config.sample_rate().0` but I will just assign it to `u32`)
    let sample_rate: u32 = config.sample_rate();
    
    let app_clone = app.clone();
    
    let stream = match config.sample_format() {
        cpal::SampleFormat::F32 => build_stream::<f32>(&device, &config.into(), app_clone)?,
        cpal::SampleFormat::I16 => build_stream::<i16>(&device, &config.into(), app_clone)?,
        cpal::SampleFormat::U16 => build_stream::<u16>(&device, &config.into(), app_clone)?,
        _ => return Err("Unsupported format".to_string()),
    };
    
    stream.play().map_err(|e| e.to_string())?;
    
    *state.stream.lock().unwrap() = Some(stream);
    
    Ok(sample_rate)
}

fn build_stream<T>(device: &cpal::Device, config: &cpal::StreamConfig, app: AppHandle) -> Result<cpal::Stream, String>
where
    T: cpal::Sample + cpal::SizedSample + Send + 'static,
    f32: cpal::FromSample<T>,
{
    let channels = config.channels as usize;
    let (tx, rx) = mpsc::sync_channel::<Vec<f32>>(10);
    
    thread::spawn(move || {
        while let Ok(data) = rx.recv() {
            let _ = app.emit("audio-data", data);
        }
    });

    let mut buffer = Vec::with_capacity(2048);
    
    let stream = device.build_input_stream(
        config,
        move |data: &[T], _: &_| {
            for frame in data.chunks(channels) {
                let mut sum = 0.0;
                for sample in frame {
                    sum += f32::from_sample(*sample);
                }
                buffer.push(sum / (channels as f32));
                
                if buffer.len() >= 2048 {
                    let _ = tx.try_send(buffer.clone());
                    buffer.clear();
                }
            }
        },
        |err| eprintln!("an error occurred on stream: {}", err),
        None,
    ).map_err(|e| e.to_string())?;
    Ok(stream)
}

#[tauri::command]
pub fn stop_audio_capture(state: State<'_, AudioState>) -> Result<(), String> {
    *state.stream.lock().unwrap() = None;
    Ok(())
}
