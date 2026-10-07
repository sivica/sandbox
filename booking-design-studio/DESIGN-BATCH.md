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

## Independent Review follow-ups

Review independently verified SG-001 on d0ee0f2 and reproduced three bounded follow-ups. They are corrected:

- **SG-002-F1 (P2):** one shared compatibility gate runs before inference in both the renderer and main process. Invalid description scopes disable generation with an explanation and a Use selected screen scope action. The manual target stays unchanged. Regressions verify no request or version for Date/contact/confirmation and isolated description refinement on both compatible screens.
- **SG-003-F1 (P2):** accepting an authored preset synchronizes the generation style. Preview, staging and discard preserve style and draft. A regression checks the next request's style/previous design, then a later explicit style choice.
- **SG-003-F2 (P3):** the focused close control is before the heading/screens. At 320px and 390px the dialog opens at scrollTop=0 with heading and first screen visible. Escape returns focus to the trigger.

Build and all **64 checks** pass: 21 protocol, 39 browser/export, one recovery, three recorder. The previous 60 remain passing; four regressions cover these follow-ups. Synthetic evidence is in ignored local `evidence/review-followups/`: complete log, no-request scope results, next-request style payloads, viewport/focus measurements and screenshots. No live inference or paid/account actions, deployment or monitor restart occurred. Independent Review retesting of SG-002/003 is pending; the Review-owned gap/state files remain unchanged.
