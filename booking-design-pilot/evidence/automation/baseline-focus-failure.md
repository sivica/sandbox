# Baseline regression — 1 October 2026
Original app.js at c8cd51f: Chromium mobile email focus event recorded `[null]` rather than `["Enter a valid email address."]`. The field received focus before React committed aria-describedby and the error element. This proves a DOM timing issue; it does not prove the cause of the inconclusive physical TalkBack speech.
