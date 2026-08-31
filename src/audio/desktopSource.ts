import type { UnlistenFn } from '@tauri-apps/api/event';
import { configureAnalyser, DEFAULT_ANALYZER_SETTINGS } from './analyser';
import { AudioSourceException } from './errors';
import { AudioErrorCategory, AudioSourceKind, type AudioSourceSession, type SourceFactoryOptions } from './types';

const workletCode = `
class PCMProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.buffer = new Float32Array(88200);
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
                channel[i] = 0;
            }
        }
        return true;
    }
}
registerProcessor('pcm-processor', PCMProcessor);
`;

export async function createDesktopAudioSource(options: SourceFactoryOptions = {}): Promise<AudioSourceSession> {
  let unlisten: UnlistenFn | undefined;
  let audioContext: AudioContext | undefined;
  let sourceNode: AudioWorkletNode | undefined;
  let silencer: GainNode | undefined;
  let stopNativeCapture: (() => Promise<unknown>) | undefined;
  
  try {
    const [{ invoke }, { listen }] = await Promise.all([
      import('@tauri-apps/api/core'),
      import('@tauri-apps/api/event'),
    ]);
    stopNativeCapture = () => invoke('stop_audio_capture');
    const sampleRate = await invoke<number>('start_audio_capture');
    
    audioContext = options.audioContextFactory?.() ?? new AudioContext({ sampleRate });
    
    const blob = new Blob([workletCode], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    try {
      await audioContext.audioWorklet.addModule(url);
    } finally {
      URL.revokeObjectURL(url);
    }
    
    const pcmNode = new AudioWorkletNode(audioContext, 'pcm-processor');
    sourceNode = pcmNode;
    const analyser = audioContext.createAnalyser();
    configureAnalyser(analyser, DEFAULT_ANALYZER_SETTINGS);
    pcmNode.connect(analyser);
    silencer = audioContext.createGain();
    silencer.gain.value = 0;
    pcmNode.connect(silencer);
    silencer.connect(audioContext.destination);

    unlisten = await listen<number[]>('audio-data', (event) => {
      pcmNode.port.postMessage(event.payload);
    });

    return {
      kind: AudioSourceKind.Desktop,
      label: 'System audio',
      audioContext,
      sourceNode: pcmNode,
      analyser,
      cleanup: async () => {
        if (unlisten) {
          unlisten();
        }
        await stopNativeCapture?.().catch(console.error);
        silencer?.disconnect();
      },
    };
  } catch (err) {
    if (unlisten) {
      unlisten();
    }

    sourceNode?.disconnect();
    silencer?.disconnect();

    if (audioContext && audioContext.state !== 'closed') {
      await audioContext.close().catch(console.error);
    }

    await stopNativeCapture?.().catch(console.error);

    throw new AudioSourceException(
      AudioErrorCategory.Unknown,
      typeof err === 'string' ? err : 'Failed to start system audio capture',
      err,
    );
  }
}
