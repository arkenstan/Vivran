mod audio;

use std::sync::Mutex;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      #[cfg(debug_assertions)]
      {
        let window = app.get_webview_window("main").unwrap();
        window.open_devtools();
      }
      Ok(())
    })
    .manage(audio::AudioState {
        stream: Mutex::new(None),
    })
    .invoke_handler(tauri::generate_handler![
        audio::start_audio_capture,
        audio::stop_audio_capture
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
