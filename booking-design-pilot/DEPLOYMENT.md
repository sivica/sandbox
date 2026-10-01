# Source and deployment

## Retrieve current handoff
Repository: https://github.com/sivica/sandbox
Draft PR: https://github.com/sivica/sandbox/pull/1

```sh
git clone --branch booking-design-pilot https://github.com/sivica/sandbox.git sandbox-handoff
cd sandbox-handoff
git rev-parse HEAD
cd booking-design-pilot
```

Use the branch tip for the corrected handoff. The receiving-developer agent reviewed f5f302b6b6ff07089887ef949ee92a8bf69f6bc9; later revisions include buyer-requested menu-count and email-error improvements. evidence/current-runtime.json preserves the pre-improvement application hashes. Historical baseline 1d25ab1668513275a896b844f38a4a9debd9f07d lacks today's test package and contains older runtime/container files. evidence/source-provenance.json and evidence/live/source-match.json describe historical revisions only.

## Railway
- Project: a549eb28-d30d-4e2d-a8ff-f632fac46f24.
- Service: booking-design-pilot, b3de0d08-f5a2-463a-9bed-73bca41fa7e6.
- Environment: production (Railway label; app is a prototype).
- Live: https://booking-design-pilot-production.up.railway.app/
- Dashboard: https://railway.com/project/a549eb28-d30d-4e2d-a8ff-f632fac46f24
- Verified application deployment: 923c04de-22e3-474f-ac22-c04b0f3c01ab, including Safari 16px controls/versioned CSS. Live suite passed 33/33 in 32.7s.

The subsequent buyer-feedback release changes the menu count and email-error correction behavior. For the latest upload ID and health consult Railway's deployment history. Public HANDOFF.md and other delivery documents are copied into the same container. Owner supplies receiving-developer account access; no credentials are packaged.

## Deploy
From booking-design-pilot/ with an authorized Railway CLI account:

```sh
railway link --project a549eb28-d30d-4e2d-a8ff-f632fac46f24 --service booking-design-pilot --environment production
railway status
railway up . --path-as-root --service booking-design-pilot --environment production --detach
```

Check deployment status/logs after upload, then compare live application and handoff files against the intended checkout. Caddy listens on PORT (default 8080), Railway terminates HTTPS. No explicit healthcheck path, application secrets or database are configured.

GitHub Actions runs source checks on branch pushes/PR changes and manual dispatch. Manual live_url adds deployed-site verification. There is no repository autodeploy or recurring schedule.

## Rollback and reproducibility
Select a retained successful deployment in Railway and use rollback/redeploy; verify its status and expected files. Alternatively check out a known-good revision and upload its app folder explicitly. Choose f5f302b for the reviewed application; its documentation predates these corrections. Rollback is documented, not exercised.

React and fonts load remotely; caddy:2-alpine is mutable. Test dependencies have a committed lockfile, but maintained production delivery still needs bundled runtime dependencies, an image digest/version and agreed asset/font/release policies.
