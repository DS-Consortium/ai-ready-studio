# Camera Engine Notes

This file documents the new canvas-based camera engine for AI Ready Studio.

## Implementation Summary

- `src/lib/canvas-camera.ts` provides a single engine for:
  - live canvas preview with baked AR text overlays
  - video recording with audio
  - JPEG photo capture from the composited canvas
  - pinch and slider zoom support (1×–5×)
  - lens validation to ensure the preview is ready before recording/capture

## Features

- **True WYSIWYG preview**: The canvas preview now matches the saved video/photo output.
- **Photo mode**: Capture a JPEG snapshot directly from the canvas with filters and stickers baked in.
- **Zoom support**: Uses camera zoom constraint if available, with fallback to canvas transform.
- **Codec fallback**: The recorder selects recorded MIME type dynamically and preserves the blob type when uploading/sharing.
- **Lens validation**: The engine waits for camera readiness and ensures the chosen filter configuration is valid before enabling user capture.

## Store Readiness

- iOS Info.plist includes camera and microphone usage descriptions.
- Android manifest includes camera, microphone, and storage permissions.
- In-app privacy/report links are available in the footer.
- A lightweight submission note is available in `APP_STORE_SUBMISSION.md`.

## Notes for Review

- The camera preview is now drawn on `canvas` instead of a hidden video feed.
- Captured photos are created from the same canvas used for live preview.
- Video uploads use the MIME type returned by `MediaRecorder` to avoid format mismatches.
