export const ROUTES = {
  idle: "/",
  recording: "/recording",
  uploading: "/uploading",
  success: "/success",
  uploadFailed: "/upload-failed",
} as const;

export const RECENT_COMPLAINTS = [
  "Street light repaired in Main Road, Kadiri",
  "Water leakage fixed in Mandal Office",
  "Garbage cleared in Market Area",
  "Drainage cleaned in School Road",
] as const;

export const ANNOUNCEMENTS = [
  {
    title: "Every Complaint Matters",
    body: "Together we can build a better and stronger community.",
  },
  {
    title: "Keep Your Surroundings Clean",
    body: "Keep your surroundings clean and green. Together we can build a better tomorrow.",
  },
] as const;

export const HOW_TO_USE_STEPS = [
  "Stand in front of the kiosk",
  "Speak your complaint",
  "Move away after speaking",
] as const;

export const SUCCESS_AUTO_RETURN_SECONDS = 10;
