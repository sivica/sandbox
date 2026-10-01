# Repeatable browser verification

From booking-design-pilot/:

```sh
npm ci
npx playwright install chromium webkit
npm test
npm run test:report
```

The suite serves the local source with a loopback-only Node server. Set BASE_URL to test a deployed URL explicitly. Dependencies are pinned; runtime React and fonts still load externally and require internet. CI runs in GitHub Actions on the draft branch, PR changes and manual dispatch, with read-only repository permissions and a 20-minute job limit. It uploads the HTML report, screenshots and failure traces for 14 days.

## 1 October 2026 result
33/33 local tests passed (11 scenarios × 3 browser profiles): Pixel 7 Chromium emulation, iPhone 13 WebKit emulation, and 844×390 Chromium landscape. This is browser emulation, not physical-device evidence. Checks cover five-screen focus/status markup and axe scans, error descriptions at focus time, empty and repeated invalid email correction, pending locks/failure retry, unavailable recovery, loading/empty restoration, and 200% relative text size/page overflow.

The first regression recorded null error description at focus on original source. Focus now runs after React commits the error markup. Original progress spans also failed axe aria-prohibited-attr; semantic list items now carry the names/current state. Contrast scans wait for the screen fade to complete to assess its settled state. No rule was disabled.

The suite does not prove audible speech, full gesture navigation, physical iOS behavior or all WCAG requirements. Internal text-range overflow and minimum button dimensions are checked at 200% text; enlarged screenshots were inspected. Native select options and hidden text are excluded. Emulator fresh/repeated email speech captions were captured; physical email speech remains inconclusive pending retest. Earlier physical results apply to the previously deployed revision.

Saved evidence: [baseline](evidence/automation/baseline-focus-failure.md), [WebKit confirmation](evidence/automation/webkit-confirmation.png), [200% text](evidence/automation/webkit-enlarged-confirmation.png).

Additional scenarios verify keyboard-only form traversal/Enter submission and axe checks on validation, failed submission and unavailable states. WebKit uses Option+Tab to include the submit button under its default keyboard policy. The text-size check asserts that the heading actually doubles. No audible screen-reader pass is inferred.

Prior 27-test suite passed cloud CI twice. Expanded suite also passed 33/33 in [GitHub Actions](https://github.com/sivica/sandbox/actions/runs/36788827176) (47.3s); result and source SHA are in [STATUS.md](STATUS.md). See [overnight evidence](evidence/overnight/REPORT.md).

## Live-site verification
33/33 executions passed against Railway on 1 October (32.3s). [Evidence](evidence/live/REPORT.md). For cloud replay, manually dispatch Booking browser verification on booking-design-pilot and set live_url to https://booking-design-pilot-production.up.railway.app/. Both source and live jobs run; live artifacts are named booking-live-evidence. No recurring cloud schedule is enabled.
