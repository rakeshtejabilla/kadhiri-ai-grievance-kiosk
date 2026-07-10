import { useEffect, useRef } from "react";

/**
 * Handles renderer-side audio recording via the Web MediaRecorder API.
 * The main process sends CMD_START_RECORDING and CMD_STOP_RECORDING commands.
 * When stopped, the WAV buffer is sent back to main via sendAudioDone().
 *
 * This hook must be mounted once at app root alongside useKioskMachine.
 * It enables audio capture on Windows/macOS/Linux without any native CLI tools.
 */
export function useMediaRecorder(): void {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api?.onCmdStartRecording || !api?.onCmdStopRecording) return; // not in Electron context

    const unsubStart = api.onCmdStartRecording(async () => {
      chunksRef.current = [];
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        recorder.start(250); // collect chunks every 250ms
      } catch (err) {
        console.error("[useMediaRecorder] Failed to start recording:", err);
      }
    });

    const unsubStop = api.onCmdStopRecording(async () => {
      const recorder = mediaRecorderRef.current;
      const stream = streamRef.current;

      if (!recorder || recorder.state === "inactive") return;

      await new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
        recorder.stop();
      });

      // Stop all mic tracks to release the microphone
      stream?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      mediaRecorderRef.current = null;

      // Combine chunks into a single Blob then convert to ArrayBuffer
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const arrayBuffer = await blob.arrayBuffer();

      // Send the audio data back to the main process
      api.sendAudioDone?.(arrayBuffer);
    });

    return () => {
      unsubStart();
      unsubStop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);
}
