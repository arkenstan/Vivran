import { useCallback, useEffect, useState } from 'react';

type TauriWindow = {
  isFullscreen: () => Promise<boolean>;
  setFullscreen: (fullscreen: boolean) => Promise<void>;
};

function isDesktopApp(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

async function getTauriWindow(): Promise<TauriWindow | null> {
  if (!isDesktopApp()) {
    return null;
  }

  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  return getCurrentWindow();
}

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const refreshFullscreen = useCallback(async () => {
    const tauriWindow = await getTauriWindow();

    if (tauriWindow) {
      setIsFullscreen(await tauriWindow.isFullscreen());
      return;
    }

    setIsFullscreen(Boolean(document.fullscreenElement));
  }, []);

  const setFullscreen = useCallback(
    async (fullscreen: boolean) => {
      const tauriWindow = await getTauriWindow();

      if (tauriWindow) {
        await tauriWindow.setFullscreen(fullscreen);
        await refreshFullscreen();
        return;
      }

      if (fullscreen) {
        await document.documentElement.requestFullscreen();
      } else if (document.fullscreenElement) {
        await document.exitFullscreen();
      }

      setIsFullscreen(Boolean(document.fullscreenElement));
    },
    [refreshFullscreen],
  );

  const toggleFullscreen = useCallback(async () => {
    await setFullscreen(!isFullscreen);
  }, [isFullscreen, setFullscreen]);

  useEffect(() => {
    void refreshFullscreen();

    const handleFullscreenChange = (): void => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [refreshFullscreen]);

  return {
    isFullscreen,
    setFullscreen,
    toggleFullscreen,
  };
}
