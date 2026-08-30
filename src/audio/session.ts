import type { AudioSourceSession } from './types';

export async function stopAudioSession(session: AudioSourceSession | null): Promise<void> {
  if (!session) {
    return;
  }

  if (session.stream) {
    for (const track of session.stream.getTracks()) {
      track.stop();
    }
  }

  session.sourceNode.disconnect();
  await session.cleanup();

  if (session.audioContext.state !== 'closed') {
    await session.audioContext.close();
  }
}
