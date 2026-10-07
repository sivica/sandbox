# Review corrections — 7 October 2026

All five P2 findings in the receiving-developer review are corrected.

| Finding | Correction | Regression evidence |
| --- | --- | --- |
| Stale image attachment | Selection/removal immediately increments a reference revision, aborts the prior reader and invalidates generation. Both read and decode callbacks ignore older revisions. Generation stays disabled while the current image is pending. | Delayed old read cannot replace a newer image; removal during a read prevents reappearance and image submission. |
| Preview changes editing target | Preview has its own screen state. Opening, changing or closing preview leaves the selected editing screen/component/scope intact. | Preview changed to confirmation, then a manual Date and slots action edit changed screen 2 with the correct manifest scope. |
| Recording save failure gets stuck | Stop returns authoritative recording=false plus a retained directory and save error. Failed manifest metadata stays in the main process for Retry recording save. Failed final capture stops safely and saves existing frames with an error count. | Manifest failure/retry at recorder and UI layers; final capture failure saves partial evidence without leaving recording active. |
| Revocation does not retry | Three attempts maximum with 250/500ms backoff for network/5xx failures, retaining the renewable token until attempts finish. Permanent 4xx fails immediately; exhausted failures still clear local credentials and report uncertainty. | Network recovery, 503 recovery, 400 no-retry and persistent 503 three-attempt checks. No real account revocation repeated. |
| Keyboard slot selection loses focus | Slot selection updates aria-pressed on existing buttons instead of replacing the root. | Enter on 14:15 retains focus on that selected button. Shared code fixes both studio and exported interactive design. |

Build and 52 automated checks pass: 21 protocol, 27 browser/export, one authentication recovery, three recorder. Verification uses synthetic fixtures; no real account requests or allowance were used for these fixes.

The continuous video is preserved as historical evidence of the demonstrated workflow. Its measured dimensions are corrected to 1200 × 868. The reviewed export preserves the same ChatGPT specification and version manifest; only public/interactive-design.html changes, adding the keyboard-focus fix. The separately exported booking-controller baseline remains unchanged.

Source package and shared checklist are updated for this reviewed revision. Independent human/device acceptance and actual allowance exhaustion remain unperformed. These corrections have not yet received a second independent review.

## Follow-up product review corrections

- Pending proposals have a separate five-screen picker, including before any design is accepted. Browsing them preserves the proposal and does not alter canvas selection or request scope. Accepted AI metadata uses the scope/component captured with its proposal.
- Undo follows the selected version's parent. Redo keeps the active undone path, clears on a new edit or explicit version selection, and cannot switch into an unrelated chronological branch. Archived versions remain available through the version picker. Missing/pruned parents disable Undo.
- Manual edit metadata uses the selected editing screen and element rather than the AI composer's scope. Shared accent changes are labelled All screens, and the saved fields are included in metadata.

Three new regressions verify reviewing all five screens before first acceptance, editing an older version then Undo/Redo, and mismatched composer/editor scope in an actual generated ZIP manifest. Build and all 52 checks pass. No live account calls were made. These fixes have not received a second independent product review.

## Design batch follow-ups

Independent Review verified SG-001 and found an unsupported nested scope, stale generation style after preset acceptance, and mobile preview autofocus scrolling past the heading. All three are corrected; four new regression checks bring the suite to 64 passing checks. See DESIGN-BATCH.md and ignored local evidence/review-followups. SG-002/003 independent retesting remains pending.
