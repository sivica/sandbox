# Authored design improvements — 7 October 2026

## Implemented

| Milestone | Changes | Local verification |
| --- | --- | --- |
| SG-001 | Service card, quiet hero and featured list; treatment card and editorial details. Whitelisted layout IDs independent of palette. Inspector records a single-screen layout edit. Old saved specifications default to cards. | Same-palette structure assertions; invalid-ID rejection; inspector isolation, Undo/Redo and reload; static/export/interactive rendering shares trusted templates. |
| SG-002 | Service eyebrow/description and treatment heading/description are editable nested roles. Direct or scoped AI edits preserve other roles and screens. Missing requested AI roles fail safely. Facts stay in trusted markup. | Two-role direct edits; scoped synthetic response changes only the selected role despite unrelated model changes; omitted-role rejection; escaping, exact manifest/specification export, reload and Undo/Redo. |
| SG-003 | Three offline authored styles, two original thumbnails each, descriptive direction, named preview dialog and staged Apply. Accepted preset provenance distinguishes authored samples from AI. | Six rendered thumbnails; Preview preserves draft/versions and returns focus on Escape; Apply/Discard preserves accepted state; acceptance records local-authored provenance without an inference request. |

## Evidence and limits

Build and 60 automated checks pass: 21 protocol, 35 browser/export, one authentication recovery, three recorder. Eight new checks extend the previous 52. Browser checks cover 320, 390 and 1200 pixels, trusted 14:15 completion for all three styles, no horizontal document overflow and action targets at least 44px. Palette assertions cover normal text at 4.5:1 and accent/control boundaries at 3:1. Keyboard slot focus and native style-dialog focus/Escape are covered. Original CSS artwork and compositions use no external assets.

Synthetic evidence is in the ignored local `evidence/design-batch/` folder: test log, 18 screen captures, mobile/desktop picker captures, nested export and before/model-response/accepted isolation record. Run `npm test` to reproduce temporary evidence. Model responses for this batch are synthetic; no live allowance requests were made. The earlier continuous real-generation video and exported real generation remain historical deliverables and are not replaced by authored sample evidence.

Reload coverage round-trips the browser fixture's saved project and then uses the production loader/validator. Existing recovery coverage exercises the desktop persistence path. Physical-device and independent human acceptance are not claimed.

## Independent Review handoff

Ready for Review verification against SG-001, SG-002 and SG-003. The Review-owned benchmark gap/state files were not modified and these milestones are not labelled independently closed. The five fictional booking steps, fixed service facts, original controller and no-reservation completion are preserved. No production deployment or monitoring restart.
