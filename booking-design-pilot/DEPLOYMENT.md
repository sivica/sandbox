# Source and deployment

## Canonical published baseline

Repository: https://github.com/sivica/sandbox

Draft PR: https://github.com/sivica/sandbox/pull/1 (open, draft; checked 30 September 2026).

Branch: booking-design-pilot. Published baseline: `1d25ab1668513275a896b844f38a4a9debd9f07d`. Application fixes originated at `8d899de68ea58c5d1b15e88f58d24ad5542ca96f`.

To retrieve that baseline into a new directory:

```sh
git clone https://github.com/sivica/sandbox.git sandbox-handoff
cd sandbox-handoff
git checkout 1d25ab1668513275a896b844f38a4a9debd9f07d
cd booking-design-pilot
```

The runtime source has byte-identical app.js, index.html, styles.css, Dockerfile, Caddyfile and .dockerignore. This documentation revision updates the handoff, effort caveats and supporting delivery documents. Source provenance hashes are in evidence/source-provenance.json. Use repository history to identify the current documentation revision; the baseline above identifies unchanged application behavior.

## Existing Railway service

- Project: booking-design-pilot, `a549eb28-d30d-4e2d-a8ff-f632fac46f24`.
- Service: booking-design-pilot, `b3de0d08-f5a2-463a-9bed-73bca41fa7e6`.
- Environment name: production (this is the Railway environment label; the application is a concept).
- Existing deployment: `97470c00-d560-4eeb-902a-3a193700368b`, created 30 September 2026 16:14 UTC; status SUCCESS and instance RUNNING at packaging.
- URL: https://booking-design-pilot-production.up.railway.app/
- Dashboard: https://railway.com/project/a549eb28-d30d-4e2d-a8ff-f632fac46f24
- Workspace owner: Ivica Stojanoski. Receiving-developer access must be supplied by the owner; no credentials are packaged.

Deployment is a manual CLI upload. Railway reports no connected repository source, so pushing the PR does not automatically redeploy this service. No application secrets/database are required by the prototype. Caddy listens on PORT, default 8080; Railway domain targets port 8080 and terminates HTTPS. No explicit healthcheck path is configured.

## Redeploy after approved changes

Install/use Railway CLI and authenticate with an authorized account. From the repository booking-design-pilot/ folder:

```sh
railway link --project a549eb28-d30d-4e2d-a8ff-f632fac46f24 --service booking-design-pilot --environment production
railway status
railway up --service booking-design-pilot --environment production --detach
```

Confirm project/service before uploading. Detached upload returns before deployment health is known. Check the deployment status and logs in Railway, then verify the intended revision and live behavior. The publication workflow redeploys this documentation revision; consult Railway for its resulting deployment status.

## Rollback

In the service's Deployments view, select an earlier retained successful deployment and use the available rollback/redeploy control. Confirm the service becomes successful and the live application matches the intended version. If no suitable deployment is retained, retrieve the known-good baseline above and manually deploy from its booking-design-pilot/ folder. This creates a new deployment; the published baseline includes older handoff documentation. Rollback procedure is documented, not exercised.

## Reproducibility limits

React versions are named but load remotely at runtime; Google Fonts is also external. Docker uses `caddy:2-alpine`, a mutable tag. A new build can resolve different container/dependency artifacts. Before maintained production delivery, agree a local bundled build, lockfile, image digest/version and asset/font policy. No CI/autodeploy was added.

## Current verified deployment — 1 October 2026
Deployment f0f52472-a1b7-401b-b10a-da8b0d65b812 succeeded. Runtime files match source a2e132a4ca71a4c489c442c77a437f61abad0b81; 33/33 live checks passed. Earlier baseline descriptions above are historical. For this repository, deploy the app folder explicitly with `railway up . --path-as-root --service booking-design-pilot --environment production --detach`. The manual live_url GitHub Actions job verifies deployed behavior; no source autodeploy or recurring schedule is enabled. See evidence/live/REPORT.md.
