# Personal studio completion evidence

Recorded on 7 October 2026. All data in previews and prompts was fictional.

## Actual account observations
- GPT-6-Astra accepted a reference-image request and returned a schema-valid five-screen proposal; accepted as version 5.
- A scoped Date and slots/action refinement increased padding from 20 to 28 while preserving other fields.
- Native subscription lifecycle display reported renewal at 2026-10-07T13:55:03.682Z and successful remote revocation at 2026-10-07T14:15:17.278Z. The connector records revocation success only after HTTP 200.
- Returning OAuth used the same saved registration and the same profile/plan permissions. Model discovery and a completed inference request succeeded afterwards. Its proposal was discarded to retain the exported design.
- The encrypted credential file was not opened or included in any deliverable.

## Continuous recording
- Final successful take: 210 frames, 104.388 seconds capture duration, zero capture errors, no cap. Encoded video duration: 105.4 seconds (final frame hold), 1200 × 868, H.264/yuv420p, no audio.
- Actual generation -> proposed design -> accept -> select booking button -> real refinement -> accept -> interactive five-screen walkthrough -> 14:15 confirmation -> export.
- Capture at 2 fps, encoded 25 fps. No sequence edits, simulated generation, speed changes or replacement still slides. Pointer/click activity and natural waiting remain.
- Account identity and renewal metadata were hidden before the first frame and restored only after capture stopped. OAuth pages were outside the captured app window.
- Earlier takes exposed a blank preview defect. The final take follows the fix: create the scripted iframe only while its dialog is open. Earlier failed captures are not delivered as the final demo.
- FFprobe checked codec/container/duration; FFmpeg decoded the full MP4; sampled frames and actual native confirmation were visually inspected.

## Export
- Version e53498d2-8db4-4cdf-a189-741cae7e42ef, parent c7e1921d-4e47-4b08-9c4a-1e9f731d8fbc, source chatgpt, component action, scope Date and slots. Padding 28.
- ZIP contains a validated design specification, five matching static screen previews, interactive-design.html and the separate trusted booking-controller baseline. The preview creates no appointment.

## Automated coverage
49 checks pass: 21 protocol, 24 browser/export, one terminal authentication recovery, three recorder. Added tests cover image conversion and non-persistence, recording identity privacy, repeat preview opening, usage-limit failure preserving the design and successful retry. The clean exported package installs and builds. Review failure cases and corrections are covered in REVIEW-FIXES.md.

Usage-limit tests simulate server responses. They do not prove the account's actual reset timing, allowance amount or a live exhaustion event. Independent human screen-reader and physical-device acceptance was not performed. Those checks remain optional for this personal demo.

## Official references
- https://developers.openai.com/siwc/token-sharing-open-source/profiles-and-sessions
- https://developers.openai.com/siwc/token-sharing-open-source/models-and-inference
- https://developers.openai.com/api/docs/guides/images-vision
