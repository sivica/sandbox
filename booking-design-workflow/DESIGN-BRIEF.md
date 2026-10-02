# Reusable Codex design brief

Generate a mobile-first treatment booking interface for Kindred, a fictional staging studio. Use the current repository controller and API contract; generate presentation code and styles with the existing Codex subscription workflow. Do not add an inference backend or claim that the interface itself calls AI.

Create calm spa, clean clinic and modern boutique variations using identical five-screen content. Prefer calm spa, with warm paper, deep green contrast, restrained serif headings, generous touch targets and system body fonts. Clinic uses a structured sans-serif hierarchy and blue; boutique uses plum, editorial headings and asymmetric accents.

One Demo Relaxation treatment, 60 minutes, MKD 1,400. Simulated profile: weekdays 10–18; lunch 13–14; 15-minute preparation/cleanup; 24-hour lead/cancellation; 30-day horizon. Real availability comes from the server. Do not show these as real business-approved rules.

Preserve semantic headings, explicit form labels, keyboard focus, status announcements, 48px controls, 200% text and mobile/landscape layout. Include loading, empty, invalid, conflict, unresolved retry, cancelled and late cancellation states. Keep exact idempotency payload/key, private receipt handling and 202 owner-request semantics.

Export runnable React 18/esbuild code, token-derived CSS, assets, preview fixtures, lockfile, README, source revision and screenshots. Never include credentials or private receipt tokens. Fixtures must remain outside staging bundles.
