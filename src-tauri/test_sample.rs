use cpal::SampleRate;
fn main() {
    let sr = SampleRate(44100);
    let val = sr.0;
}
