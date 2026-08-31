import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { configureAnalyser, DEFAULT_ANALYZER_SETTINGS } from './analyser';
import { AudioSourceException } from './errors';
import { AudioErrorCategory, AudioSourceKind, type AudioSourceSession, type SourceFactoryOptions } from './types';

const workletCode = `
class PCMProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.buffer = new Float32Array(88200); // 2 seconds at 44.1kHz
        this.writeOffset = 0;
        this.readOffset = 0;
        this.port.onmessage = (e) => {
            const data = e.data;
            for (let i = 0; i < data.length; i++) {
                this.buffer[this.writeOffset] = data[i];
                this.writeOffset = (this.writeOffset + 1) % this.buffer.length;
            }
        };
    }
    process(inputs, outputs, parameters) {
        const output = outputs[0];
        const channel = output[0];
        for (let i = 0; i < channel.length; i++) {
            if (this.readOffset !== this.writeOffset) {
                channel[i] = this.buffer[this.readOffset];
                this.readOffset = (this.readOffset + 1) % this.buffer.length;
            } else {
                channel[i] = 0; // Underrun, output silence
            }
        }
        return true;
    }
}
registerProcessor('pcm-processor', PCMProcessor);
`;

export async function createDesktopAudioSource(options: SourceFactoryOptions = {}): Promise<AudioSourceSession> {
  let unlisten: UnlistenFn | undefined;
  
  try {
    const sampleRate = await invoke<number>('start_audio_capture');
    
    const audioContext = options.audioContextFactory?.() ?? new AudioContext({ sampleRate });
    
    const blob = new Blob([workletCode], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    await audioContext.audioWorklet.addModule(url);
    URL.revokeObjectURL(url);
    
    const sourceNode = new AudioWorkletNode(audioContext, 'pcm-processor');
    const analyser = audioContext.createAnalyser();
    configureAnalyser(analyser, DEFAULT_ANALYZER_SETTINGS);
    sourceNode.connect(analyser);
    // Worklets need to be connected to destination for process() to be called in some browsers,
    // but connecting to analyser might be enough if analyser is connected. 
    // Wait, visualizers often don't connect analyser to destination to avoid feedback.
    // However, AudioWorklet process() is driven by the destination. We should connect to a GainNode with 0 gain, then to destination.
    const silencer = audioContext.createGain();
    silencer.gain.value = 0;
    sourceNode.connect(silencer);
    silencer.connect(audioContext.destination);

    unlisten = await listen<number[]>('audio-data', (event) => {
      sourceNode.port.postMessage(event.payload);
    });

    return {
      kind: AudioSourceKind.Desktop,
      label: 'Desktop Audio Capture',
      audioContext,
      sourceNode,
      analyser,
      cleanup: async () => {
        if (unlisten) {
          unlisten();
        }
        await invoke('stop_audio_capture').catch(console.error);
        sourceNode.disconnect();
        silencer.disconnect();
      },
    };
  } catch (err) {
    throw new AudioSourceException(
      AudioErrorCategory.Unknown,
      typeof err === 'string' ? err : 'Failed to start desktop audio capture',
      err
    );
  }
}
