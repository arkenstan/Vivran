import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { configureAnalyser, DEFAULT_ANALYZER_SETTINGS } from './analyser';
import { createDisplayAudioSource } from './displaySource';
import { normalizeAudioError } from './errors';
import { createFileAudioSource } from './fileSource';
import { initialAudioSourceState, audioSourceReducer } from './sourceState';
import { stopAudioSession } from './session';
import { AudioSourceActionType, type AnalyzerSettings, type AudioSourceSession } from './types';

export function useAudioEngine() {
  const [sourceState, dispatch] = useReducer(audioSourceReducer, initialAudioSourceState);
  const [settings, setSettings] = useState<AnalyzerSettings>(DEFAULT_ANALYZER_SETTINGS);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const sessionRef = useRef<AudioSourceSession | null>(null);

  const stop = useCallback(async () => {
    const currentSession = sessionRef.current;
    sessionRef.current = null;
    setAnalyser(null);
    await stopAudioSession(currentSession);
    dispatch({ type: AudioSourceActionType.Stop });
  }, []);

  const replaceSession = useCallback(
    async (nextSession: AudioSourceSession) => {
      const previousSession = sessionRef.current;
      sessionRef.current = nextSession;
      setAnalyser(nextSession.analyser);
      configureAnalyser(nextSession.analyser, settings);
      await stopAudioSession(previousSession);
      dispatch({
        type: AudioSourceActionType.Activate,
        meta: {
          kind: nextSession.kind,
          label: nextSession.label,
          startedAt: Date.now(),
        },
      });
    },
    [settings],
  );

  const startDisplayCapture = useCallback(async () => {
    dispatch({ type: AudioSourceActionType.Request });

    try {
      const session = await createDisplayAudioSource({
        onEnded: () => {
          void stop();
        },
      });
      await replaceSession(session);
    } catch (error) {
      await stopAudioSession(sessionRef.current);
      sessionRef.current = null;
      setAnalyser(null);
      dispatch({ type: AudioSourceActionType.Error, error: normalizeAudioError(error) });
    }
  }, [replaceSession, stop]);

  const startFile = useCallback(
    async (file: File) => {
      dispatch({ type: AudioSourceActionType.Request });

      try {
        const session = await createFileAudioSource(file, {
          onEnded: () => {
            void stop();
          },
        });
        await replaceSession(session);
      } catch (error) {
        await stopAudioSession(sessionRef.current);
        sessionRef.current = null;
        setAnalyser(null);
        dispatch({ type: AudioSourceActionType.Error, error: normalizeAudioError(error) });
      }
    },
    [replaceSession, stop],
  );

  useEffect(() => {
    if (analyser) {
      configureAnalyser(analyser, settings);
    }
  }, [analyser, settings]);

  useEffect(() => {
    return () => {
      void stopAudioSession(sessionRef.current);
      sessionRef.current = null;
    };
  }, []);

  return {
    analyser,
    settings,
    setSettings,
    sourceState,
    startDisplayCapture,
    startFile,
    stop,
  };
}
