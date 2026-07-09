import { useEffect } from "react";
import { ipcClient } from "@/services/ipcClient";
import { getKioskConfig } from "@/services/configService";
import { useKioskStore } from "@/store/kioskStore";
import { SUCCESS_AUTO_RETURN_SECONDS } from "@/utils/constants";

/**
 * Subscribes once (at app root) to every kiosk lifecycle event coming from
 * the Electron main process and translates them into store updates.
 * The UI reacts solely by observing `useKioskStore().screen`.
 */
export function useKioskMachine(): void {
  const store = useKioskStore();

  useEffect(() => {
    void getKioskConfig().then((config) => {
      store.setMachineInfo(config.machineId, config.location);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const unsubscribers = [
      ipcClient.onRecordingStarted(() => {
        store.startRecording();
      }),

      ipcClient.onRecordingStopped(() => {
        store.stopRecordingAndUpload();
      }),

      ipcClient.onUploadProgress(({ percent }) => {
        store.setUploadPercent(percent);
      }),

      ipcClient.onUploadSucceeded(() => {
        store.uploadSucceeded();
      }),

      ipcClient.onUploadFailed(({ message, willRetryInMs }) => {
        store.uploadFailed(message, Math.round(willRetryInMs / 1000));
      }),

      ipcClient.onUploadRetryScheduled(() => {
        // Just keeping the handler alive, state is already managed
      }),
    ];

    return () => unsubscribers.forEach((unsub) => unsub());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live recording timer while on the recording screen.
  useEffect(() => {
    if (store.screen !== "recording") return;
    const startedAt = Date.now();
    const interval = setInterval(() => {
      store.setRecordingElapsedMs(Date.now() - startedAt);
    }, 250);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.screen]);

  // Auto-return to idle after a successful submission.
  useEffect(() => {
    if (store.screen !== "success") return;
    const timeout = setTimeout(() => {
      store.goToIdle();
    }, SUCCESS_AUTO_RETURN_SECONDS * 1000);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.screen]);

  // Countdown + auto-return-to-idle while a retry is pending after a failure.
  useEffect(() => {
    if (store.screen !== "upload-failed") return;
    const interval = setInterval(() => {
      const next = store.retryInSeconds - 1;
      if (next <= 0) {
        store.goToIdle();
      } else {
        store.setRetryCountdown(next);
      }
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.screen, store.retryInSeconds]);
}

