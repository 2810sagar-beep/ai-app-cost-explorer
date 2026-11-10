# Scale · AI App Cost Explorer

Describe an AI application, review its workload assumptions, and inspect DigitalOcean and AWS cost forecasts as usage grows. Every estimate comes from formulas and a sourced price catalog. AI suggests assumptions; it cannot set prices or calculate bills.

## Deploy the frontend as a Static Site

[![Deploy to DigitalOcean](https://www.deploytodo.com/do-btn-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/2810sagar-beep/ai-app-cost-explorer/tree/main)

This button uses `.do/deploy.template.yaml` to explicitly select **Static Site**, build the app, and publish `dist/`. Review the proposed price: the frontend should be $0/month within your team's free static-site allowance. The template does not create a paid Node service, database, or bucket. Add the protected Functions backend separately using [DEPLOY.md](DEPLOY.md).

**Existing `lionfish-app` deployment:** a successful build followed by “no default process type” points to the frontend being configured as a Node Web Service. Redeploying code alone does not change an existing component's type. Follow the [deployment repair steps](DEPLOY.md#repair-the-lionfish-app-deployment) before retrying. The button creates a new app; it does not repair or remove the existing one.

## Current functionality

- Working manual calculator and three editable example scenarios.
- Same-model DigitalOcean vs AWS inference, hosting, storage, and outbound-transfer estimates.
- Interactive growth chart, cost per 1,000 tasks, budget thresholds, detailed formulas, and sources.
- JSON scenario export/import and growth CSV export.
- DigitalOcean inference can ask up to three workload questions, propose a base case with reasons and uncertainties, and apply it only after review. Optional sample token measurement.
- Optional authenticated DigitalOcean size/price lookup, scoped to read-only API access.
- Accessible keyboard controls, responsive layout, private backend demo code, and no frontend cloud secrets.

Live AI and platform access are **unconnected until server credentials are configured**. The manual calculator uses published price snapshots. Live deployment status must be verified in your DigitalOcean account; see [DEPLOY.md](DEPLOY.md).

## Run locally

Uses Node.js 24.x for the frontend build and checks. The separately deployed Functions backend uses its declared Node.js 22 runtime.

```sh
npm ci
npm run dev
```

Open the localhost URL printed by the preview server. `npm test` checks calculation boundaries and backend protections. `npm run build` produces `dist/`, a static site with no runtime Node dependency.

The development server executes the same backend handler as the Functions deployment. Credentials must be set in the server process environment. They are not loaded from a committed file or sent to the browser. An unconfigured backend fails closed. No credentials are needed to test the calculator.

## Comparison boundaries

The price catalog is checked on 2026-11-10. AWS GPT OSS prices in the reference are **Standard tier in ap-southeast-2 (Sydney)**, not global or US pricing. DO inference is a managed endpoint; identical residency is not assumed. The hypothetical hosting/storage comparison is Sydney. The demo itself can run in NYC without changing those forecast assumptions.

AWS hosting/storage uses Lightsail's simple bundles, not a deliberately expensive EC2/S3 architecture. AWS bucket selection chooses the least expensive listed bundle including applicable overages. The included Sydney VM transfer is half the headline Lightsail bundle allowance. GB/GiB conversion, retry usage, retention, and downloads are explicit.

Hosting stays fixed as users increase. CPU performance and capacity are not benchmarked. Neither memory class nor vCPU count guarantees equivalent performance. Storage is steady-state average retained uploads; file downloads are direct from the object bucket.

Taxes, discounts, credits, databases, vector storage, embeddings, OCR, paid external APIs, backups, load balancers, HA, cross-region replication, engineering labor, observability, and inference-endpoint transfer are excluded. These are planning estimates, not a universal lowest-price comparison or deployment recommendation.

## Architecture

React static frontend → optional DigitalOcean Functions API → DigitalOcean inference / read-only sizes API.

Pricing and formulas live in `src/catalog.js` and `src/costs.js`. The backend has no third-party dependencies. The server-side model used to operate the demo is GPT OSS 20B; the hypothetical model selected in the calculator is independent.

## Budget and privacy

The demo is designed for a $5 promotional-credit budget using free static hosting and the Functions free allowance. That is not a guaranteed spending cap. Input and output limits, explicit live-enable, a private demo code, and zero automatic retries limit exposure. There is no durable global usage counter. Keep auto-reload disabled, review the app cost proposal and actual credit eligibility, limit live demo access, and disable live inference after the interview.

Descriptions and sample text are sent to the configured backend and DigitalOcean only when you click an AI action. Manual calculations run in the browser. Cloud keys never belong in source code. The demo code stays in tab memory. Do not submit confidential sample text. Export files include the app description and assumptions, but exclude connection settings and credentials.

## Deployment

See [DEPLOY.md](DEPLOY.md) for dashboard-only instructions. `.do/static-app.yaml` supports a static-only first step. `.do/app.yaml` adds the protected Functions component. Templates use empty secret placeholders and live AI off. Do not create a paid Node web-service component by accepting automatic detection defaults.
