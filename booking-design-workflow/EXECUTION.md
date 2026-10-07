# Booking design workflow — autonomous execution brief

Plan: https://docs.google.com/document/d/1g5oBrSCaZyKYGjsM9Bp_kKB3IQQ-STU9IfWdfxIUIeM/edit
Baseline: 7d358877e74744078332c739368c9115c262d954
Runtime baseline: 4816737e7e318ee18422aa7342d51e5a563d4770
Working branch: kindred-design-workflow

## Authorized work, in dependency order

1. Generate three comparable React previews (calm spa, clean clinic, modern boutique) with identical fictional data and five booking screens. Default selection: calm spa. Finish a concrete preview before requesting optional feedback; do not wait for feedback to prepare exports and tests.
2. Capture loading, empty, invalid details, conflict, unresolved submission, retry, cancelled and late-cancellation-request states. Use one fictional Demo Relaxation service, MKD 1,400/60 minutes, weekdays 10–18, lunch closure, preparation/cleanup buffers and current lead/cancellation rules.
3. Build a runnable React 18/esbuild export ZIP with lockfile, demo entry, synthetic fixtures, documented props/API adapter, tokens-derived CSS, SVG assets, screenshots and README. Record exact source revision.
4. Integrate presentation with the existing booking controller without changing the persistence/API contract. Preserve exact pending payload/idempotency key, editing lock while outcome is unknown, conflict detail retention, receipt token recovery and HTTP 202 ownerRequest cancellation semantics. Keep UI/API same origin and prices server-authoritative. Correct stale hours copy.
5. Verify with disposable PostgreSQL only for destructive API suites. Test seed and activated fictional profiles separately, including Chromium, WebKit and landscape. Live checks may create/clean only their own synthetic records. Clean-unzip build the export.
6. Commit, create an attached draft PR, and deploy staging only after checks pass. Preserve original operational/evidence records and do not resume either monitor.
7. Capture actual Codex desktop interaction and browser flow. Produce captioned 60-second 1920x1080 MP4 using Playwright, FFmpeg/ffprobe; label accelerated waits and edited transitions. Never simulate generation as actual captured interaction.
8. Upload ZIP/video/poster/captions/storyboard/script to ChatGPT Drive folder 1tUMWvlagZgSaNKw0kWFj8GJ3G69mCHg2, verify links, and update plan milestones accurately. Prepare X copy without posting.

## Video storyboard

0–4s finished design; 4–10s actual Codex prompt; 10–24s three directions and refinement; 24–35s selected ZIP and independent build; 35–55s five-screen booking and saved confirmation; 55–60s “Codex workflow · fictional staging · synthetic bookings”.

## Input genuinely required

Desktop recording permission if macOS denies capture; account reauthentication if required; any automatic approval rejection that cannot be safely resolved. Finish unaffected local work while blocked. Do not ask to approve routine reversible implementation, exports, existing authorized staging deployment or draft PR creation.

## Boundaries

Use existing Codex subscription workflow, no new model API integration or standalone generator. No real customer data, production launch, payments, paid services, database exposure, SSH key registration, outgoing notifications, production backup work, business-owner acceptance claims or monitor restart. No new recurring automation unless requested. User feedback is optional for first pass; calm spa remains the default.

## Readiness

Repository clean at baseline before branch creation; no applicable AGENTS.md found in repo/ancestor inspection. React 18/esbuild dependencies present. Node, FFmpeg and ffprobe available. Playwright configuration includes Pixel 7 Chromium, mobile WebKit and landscape. Desktop recording permission and disposable PostgreSQL readiness remain to be checked during execution.
