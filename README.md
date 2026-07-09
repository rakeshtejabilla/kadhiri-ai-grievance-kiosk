# Kadhiri AI Public Grievance Kiosk

An unattended, government-branded desktop kiosk that lets a citizen walk up,
speak a complaint out loud, and walk away — with the audio automatically
recorded and uploaded to a backend for later review. There is **no** login,
keyboard, mouse, admin panel, speech recognition, or AI processing on the
device itself: it only records and uploads audio.

## Tech Stack

React 19 · TypeScript · Electron 33 · Vite 6 · Tailwind CSS 3 · Framer Motion ·
Zustand · React Router 7 · Axios

## Screens

| # | Screen | File |
|---|--------|------|
| 1 | Idle (recent complaints, announcements, how-to-use) | `src/pages/IdleScreen.tsx` |
| 2 | Recording (pulsing mic, live waveform, timer) | `src/pages/RecordingScreen.tsx` |
| 3 | Uploading (progress ring) | `src/pages/UploadingScreen.tsx` |
| 4 | Success (auto-return countdown) | `src/pages/SuccessScreen.tsx` |
| 5 | Upload Failed (queued + retry countdown) | `src/pages/UploadFailedScreen.tsx` |

## Citizen Workflow

```
App starts → Idle Screen
           → Motion Detected
           → Recording Starts
           → Motion Lost
           → Recording Stops → save audio.wav
           → POST /api/v1/audio/upload (multipart/form-data:
                machine_id, timestamp, location, audio.wav)
           → Upload Success → Success Screen → Idle Screen
             (or) Upload Failed → queued locally, retried automatically
                                   with a live countdown → Idle Screen
```

## Architecture — Hardware Abstraction

Everything that talks to physical hardware or the network sits behind an
interface in `electron/providers/`, and the **only** place that decides which
concrete implementation to use is `electron/providers/factory.ts`:

| Interface | Mock/dev implementation | Production implementation |
|---|---|---|
| `MotionSensorProvider` | `MockMotionSensorProvider` — Ctrl+M / Ctrl+N keyboard shortcuts | `GpioMotionSensorProvider` — scaffolded for Raspberry Pi GPIO (PIR/ultrasonic sensor); implement and swap in `factory.ts` |
| `AudioRecorderProvider` | `MockAudioRecorderProvider` — records real mic audio via `arecord` (ALSA), falls back to a silent WAV if `arecord` is unavailable | same class; already production-ready on any Linux box with ALSA |
| `UploaderProvider` | `MockUploaderProvider` — simulates network progress/success/failure | `HttpUploaderProvider` — real `axios` multipart POST, used automatically whenever `config.mockHardware` is `false` |
| `StorageProvider` | — | `LocalStorageProvider` — JSON-file-backed retry queue, already production-ready |

The React UI (`src/`) never imports any of the above directly. It only talks
to `window.electronAPI` (defined in `electron/preload/index.ts`) through the
`src/services/ipcClient.ts` wrapper, and to the Zustand store in
`src/store/kioskStore.ts`. This means the entire renderer can be developed
and demoed with `npm run dev` in a plain browser tab, with no Electron
process running at all (a no-op fallback API is used automatically — see
`src/services/ipcClient.ts`).

### Moving to real Raspberry Pi GPIO hardware

1. Wire your PIR/ultrasonic sensor to a GPIO pin.
2. Implement `GpioMotionSensorProvider` in
   `electron/providers/motion/GpioMotionSensorProvider.ts` (a worked example
   using the `onoff` npm package is included in a comment in that file).
3. In `electron/providers/factory.ts`, swap the `motion` provider from
   `MockMotionSensorProvider` to `GpioMotionSensorProvider`.
4. Set `"mockHardware": false` in `config.json`.

No other file — and zero React components — need to change.

## Project Structure

```
electron/
  main/            # App bootstrap, window creation, IPC handlers, workflow orchestrator
  preload/         # contextBridge — the only surface the renderer can call into Electron with
  providers/       # Hardware abstraction interfaces + Mock/real implementations + factory
  shared/          # IPC channel names & payload types shared by main and renderer
src/
  pages/           # The 5 kiosk screens
  components/      # Reusable presentational pieces (waveform, progress ring, cards, etc.)
  layouts/         # Fullscreen 1920x1080 kiosk shell
  hooks/           # useKioskMachine (IPC → store wiring), useClock
  store/           # Zustand store — single source of truth for on-screen state
  services/        # ipcClient (typed IPC wrapper), configService
  types/           # Kiosk domain types + window.electronAPI typing
  utils/           # Formatting helpers, static content (announcements, etc.)
config.json        # Per-machine configuration (see below)
electron-builder.yml
scripts/           # systemd auto-start unit + installer
```

## Configuration (`config.json`)

```json
{
  "machineId": "KADHIRI-KIOSK-001",
  "serverUrl": "https://grievance-api.kadhiri.gov.in",
  "location": "Kadhiri Mandal Office, Main Entrance",
  "district": "Kadhiri",
  "retryInterval": 60000,
  "maxRecordingDurationMs": 120000,
  "mockHardware": true
}
```

- `mockHardware: true` uses `MockUploaderProvider` (simulated network) so the
  full workflow can be demoed offline. Set it to `false` on a real deployment
  to use `HttpUploaderProvider`, which POSTs to
  `${serverUrl}/api/v1/audio/upload`.
- Field technicians can edit this file after install without rebuilding —
  see "Config resolution order" in `electron/main/configLoader.ts`.

## Getting Started (development)

```bash
npm install
npm run start      # runs Vite + tsc watch + Electron together
```

While the app is running (dev mode is windowed, not fullscreen, for
convenience):

- **Ctrl+M** — simulate a citizen walking up (motion detected → recording starts)
- **Ctrl+N** — simulate the citizen walking away (motion lost → recording stops → uploads)

To rehearse the failure/retry screen, run with:

```bash
KIOSK_FORCE_UPLOAD_FAILURE=1 npm run start
```

## Building for Production

```bash
npm run build          # type-checks, compiles electron/, builds the Vite renderer
npm run package        # electron-builder → AppImage + .deb for x64
npm run package:arm64  # AppImage + .deb for Raspberry Pi 5 (arm64)
```

Artifacts are written to `release/`.

## Deploying to a Kiosk (Raspberry Pi 5 / Ubuntu Mini PC)

1. Install the `.deb` (or run the AppImage) on the target machine.
2. Edit `/opt/kadhiri-kiosk/config.json` (or wherever it was installed) with
   the machine's real `machineId`, `serverUrl`, and `location`.
3. Install ALSA tools if not already present: `sudo apt install alsa-utils`.
4. Enable auto-start on boot:

   ```bash
   sudo ./scripts/install-autostart.sh
   ```

   This installs `scripts/kadhiri-kiosk.service` as a systemd unit that
   starts the kiosk on boot and restarts it automatically if it ever exits.

5. Reboot. The kiosk should come up fullscreen on the Idle Screen with no
   window chrome, no taskbar, and no way for a citizen to exit or navigate
   away (right-click, external navigation, and window close are all
   disabled — see `electron/main/windowManager.ts`).

## Notes on Quality

- **Clean architecture / SOLID**: hardware and network concerns are fully
  isolated behind interfaces (`MotionSensorProvider`, `AudioRecorderProvider`,
  `UploaderProvider`, `StorageProvider`); the orchestrator
  (`KioskOrchestrator`) depends only on those interfaces; the React UI
  depends only on the Zustand store and the typed IPC client.
- **Resilience**: failed uploads are queued to disk (`LocalStorageProvider`)
  and retried automatically, including across an app restart or power cut.
- **Strong typing**: every IPC channel and payload is defined once in
  `electron/shared/ipc-contract.ts` and shared by both processes — there is
  no `any` on the IPC boundary.
