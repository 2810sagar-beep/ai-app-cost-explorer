# Deploy without writing code

The app is ready to build from this repository. This walkthrough uses App Platform's dashboard; no terminal is required. Its frontend is a **Static Site**, not a Node Web Service. The backend is a separate Functions component.

## Repair the lionfish-app deployment

The supplied November 10 logs show that commit `b47cc64` built successfully and produced `dist/`. They also show “This app may not specify any way to start a node process” and “no default process type”, followed by an application-container upload. That points to a Node Web Service configuration for the static frontend; the build itself did not fail. Runtime/deployment logs would confirm the final startup error.

### Repair the existing app

1. Open `lionfish-app` in App Platform and inspect its frontend component's resource type. It should be **Static Site**.
2. If the component editor allows changing the type, select **Static Site**, set build command `npm ci && npm run build`, and output directory `dist`. A static site needs no run command or listening port.
3. If the existing component cannot change type, use **Settings → App Spec → Edit**. In that existing specification, replace only the frontend entry under `services:` with the equivalent entry under `static_sites:`, retaining its name, GitHub repository/branch, and routes. Set `output_dir: dist`; remove the frontend's `run_command`, HTTP/health-check settings, instance count, and instance size. Preserve any Functions component, domains, environment variables, and other unrelated app settings.
4. If you want help with the spec, share its non-secret configuration or a screenshot of the component settings. Do not share secret variable values. Do not replace the entire app specification blindly if it already contains other resources.
5. Check that the proposed frontend hosting cost is $0/month within the free static allowance, save, and deploy. A commit to the repository cannot automatically convert a component already saved as a Web Service.

### Alternative: a new static-only app

Use the **Deploy to DigitalOcean** button in the repository README. The official template explicitly selects a Static Site, so the frontend is not detected as a long-running Node service. This creates a new app; it does not change `lionfish-app`. After the replacement works, remove the unused failed web-service component/app in the dashboard if you no longer need it, so it cannot continue incurring charges. Confirm its identity before deleting anything.

The Node.js range is also pinned to `24.x`, matching the version shown in the build logs. That removes the wide-range warning; the warning was not the deployment failure.

## 1. Deploy the static calculator first

1. Sign in to your existing DigitalOcean account and select the team with your $5 credit.
2. Prefer the **Deploy to DigitalOcean** button in the repository README, which loads `.do/deploy.template.yaml`. If creating manually, open **App Platform → Create App**, choose GitHub, and authorize access to `2810sagar-beep/ai-app-cost-explorer`.
3. Select branch `main`, source directory `/`.
4. Set the component type to **Static Site**. Do **not** leave it as a paid Node Web Service.
5. Build command: `npm ci && npm run build`. Output directory: `dist`.
6. Keep automatic deployment off while preparing the demo. No database, Droplet, or Spaces subscription is required to RUN this calculator.
7. Inspect the cost summary. This component should qualify for the static free allowance if the team has a free slot. If a paid container appears, correct the component type before deployment.
8. Deploy and open the generated HTTPS URL. Try a preset, edit assumptions, move the growth slider, open the calculation section, and export a scenario.

`.do/static-app.yaml` is the equivalent static app specification. If the dashboard offers importing an app spec, use that file. The platform must validate the actual spec and pricing before any creation; local checks cannot verify your account allowances.

## Where your new model key goes

Open **App Platform → your app → Settings → api (Functions) → Environment Variables → Edit → Add environment variable**. Paste the key only into `DO_MODEL_ACCESS_KEY`, select **Encrypt**, and use **Run and build time** scope. Add an encrypted `DEMO_ACCESS_CODE` of at least 16 random characters and set `LIVE_AI_ENABLED=true` when ready to test. Save and deploy the latest `main` revision for both components. If `api` is missing, follow section 2 first.

The website's Connections dialog takes the **public function URL** and your **private demo access code**. It never takes the model key. The read-only `DO_API_TOKEN` is optional for AI planning and is only needed for the separate hosting-price refresh.

## 2. Add the serverless API

1. In the app, choose **Add Resource → GitHub**, select the same repository and branch, and set the source directory to `/functions`.
2. Choose **Functions** as the resource type. This directory contains `project.yml` and the `explorer/api` function.
3. Add these **component-level** variables, not frontend or app-wide variables:

| Name | Value | Encrypt? |
| --- | --- | --- |
| `DO_MODEL_ACCESS_KEY` | Your model key, scoped to `openai-gpt-oss-20b` | Yes |
| `DO_API_TOKEN` | Optional for AI; token with `sizes:read` and `regions:read` enables the separate account price lookup | Yes |
| `DEMO_ACCESS_CODE` | A new random password of at least 16 characters, used only for this demo | Yes |
| `LIVE_AI_ENABLED` | `false` initially | No |

Use **Run and build time** scope on this Functions component so `project.yml` can substitute variables during deployment. The frontend must not have access to these variables. Never put them in `src/`, GitHub files, or an app spec committed to the repository.

4. Inspect the cost summary and Functions allowance. Functions have a free compute allowance, but bandwidth and overages can still be billed. Stop if the proposal introduces a paid service, job, worker, database, or storage subscription. We can review the proposal together before deployment if it is unclear.
5. Deploy the component. In **Settings → Functions component**, find the Functions table and copy the live URL for `explorer/api`. Use the URL shown by DigitalOcean rather than guessing a route.
6. In the website's **Connections** page, enter that URL and your private demo access code. Click **Check connection**. It should connect with AI disabled.
7. Click **Refresh DO hosting prices** to test read-only account integration. This reads available sizes in SYD1 and creates no resources. On failure, the app keeps its snapshot prices and explains the error.

`.do/app.yaml` provides the equivalent two-component app template. All secret values are intentionally empty, so a freshly deployed backend is locked. You still need to populate the encrypted component variables.

## 3. Enable and test AI within the credit budget

1. In Billing, confirm the $5 promotional credit is eligible for Serverless Inference. Keep auto-reload disabled. An empty prepaid balance does not necessarily stop other billable cloud resources.
2. Create a model access key in the DigitalOcean Model Access Keys page, scoped to GPT OSS 20B. Confirm the model is available to your account. No OpenAI account or OpenAI API subscription is required.
3. Set `LIVE_AI_ENABLED` to `true` on the Functions component and redeploy.
4. Recheck the connection. Paste your application description and click **Plan my base case**. The AI asks up to three relevant usage questions if information is missing. Answer them, or leave unknown details blank for labelled estimates, and click **Create my base case**. Review the values, explanations and uncertainties, then click **Apply this base case**. Until you apply, the forecast stays unchanged. The AI never changes your active-user count, hosting, prices, budget, or comparison model.
5. Optionally run one sample summarization to measure billable input/output tokens. The output token cap can cause an incomplete response on a reasoning-heavy sample; that returns an explicit error instead of fake results.

Each AI action is one bounded request with no automatic retry. A planning flow uses one request if the description is complete, or two when clarifying questions are needed. Descriptions are limited to 3,000 characters, answers to three × 600 characters, and sample text to 6,000. Model completions are capped at 2,048 tokens for planning and 1,024 for sample measurement. A private code protects billable operations. There is no global hard spending limiter across serverless instances. Protect the code, keep the demo restricted, monitor your balance, and stop well before the $5 budget. Server-side keys and the demo access code are different credentials.

## 4. After the interview

Set `LIVE_AI_ENABLED=false` and redeploy. Revoke the dedicated model and read-only API keys when finished. Delete billable components if any were created separately. The static calculator can remain available within its free allowances.

## Known verification limits

The frontend and backend handler can be tested locally without credit. Real inference, model permissions, API availability, platform routing, component detection, free-tier eligibility, and the deployment cost proposal require your authenticated DigitalOcean account and cannot be verified from source alone.

## Official references

- https://docs.digitalocean.com/products/app-platform/how-to/create-apps/
- https://docs.digitalocean.com/products/app-platform/how-to/add-deploy-do-button/
- https://docs.digitalocean.com/products/app-platform/how-to/update-app-spec/
- https://docs.digitalocean.com/products/app-platform/how-to/manage-functions/
- https://docs.digitalocean.com/products/functions/reference/project-configuration/
- https://docs.digitalocean.com/products/app-platform/details/pricing/
- https://docs.digitalocean.com/products/functions/details/pricing/
- https://docs.digitalocean.com/products/inference/how-to/manage-model-access-keys/
- https://docs.digitalocean.com/products/inference/how-to/manage-serverless-inference-prepayment/
