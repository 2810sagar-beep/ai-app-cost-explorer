# Deploy without writing code

The app is ready to build from this repository. It has not yet been deployed to your DigitalOcean account. This walkthrough uses App Platform's dashboard; no terminal is required.

## 1. Deploy the static calculator first

1. Sign in to your existing DigitalOcean account and select the team with your $5 credit.
2. Open **App Platform → Create App**, choose GitHub, and authorize access to `2810sagar-beep/ai-app-cost-explorer`.
3. Select branch `main`, source directory `/`.
4. Set the component type to **Static Site**. Do **not** leave it as a paid Node Web Service.
5. Build command: `npm ci && npm run build`. Output directory: `dist`.
6. Keep automatic deployment off while preparing the demo. No database, Droplet, or Spaces subscription is required to RUN this calculator.
7. Inspect the cost summary. This component should qualify for the static free allowance if the team has a free slot. If a paid container appears, correct the component type before deployment.
8. Deploy and open the generated HTTPS URL. Try a preset, edit assumptions, move the growth slider, open the calculation section, and export a scenario.

`.do/static-app.yaml` is the equivalent static app specification. If the dashboard offers importing an app spec, use that file. The platform must validate the actual spec and pricing before any creation; local checks cannot verify your account allowances.

## 2. Add the serverless API

1. In the app, choose **Add Resource → GitHub**, select the same repository and branch, and set the source directory to `/functions`.
2. Choose **Functions** as the resource type. This directory contains `project.yml` and the `explorer/api` function.
3. Add these **component-level** variables, not frontend or app-wide variables:

| Name | Value | Encrypt? |
| --- | --- | --- |
| `DO_MODEL_ACCESS_KEY` | Your model key, scoped to `openai-gpt-oss-20b` | Yes |
| `DO_API_TOKEN` | Token with `sizes:read` and `regions:read` | Yes |
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
4. Recheck the connection. Paste your application description, click **Suggest assumptions**, and review all suggested values. The AI does not determine the rates or cloud winner.
5. Optionally run one sample summarization to measure billable input/output tokens. The output token cap can cause an incomplete response on a reasoning-heavy sample; that returns an explicit error instead of fake results.

Each AI action is one bounded request, with no automatic retry: descriptions max 3,000 characters; sample text max 6,000; model completions max 1,536 / 1,024 tokens. A private code protects billable operations. There is no global hard spending limiter across serverless instances. Protect the code, keep the demo restricted, monitor your balance, and stop well before the $5 budget. Server-side keys and the demo access code are different credentials.

## 4. After the interview

Set `LIVE_AI_ENABLED=false` and redeploy. Revoke the dedicated model and read-only API keys when finished. Delete billable components if any were created separately. The static calculator can remain available within its free allowances.

## Known verification limits

The frontend and backend handler can be tested locally without credit. Real inference, model permissions, API availability, platform routing, component detection, free-tier eligibility, and the deployment cost proposal require your authenticated DigitalOcean account and cannot be verified from source alone.

## Official references

- https://docs.digitalocean.com/products/app-platform/how-to/create-apps/
- https://docs.digitalocean.com/products/app-platform/how-to/manage-functions/
- https://docs.digitalocean.com/products/functions/reference/project-configuration/
- https://docs.digitalocean.com/products/app-platform/details/pricing/
- https://docs.digitalocean.com/products/functions/details/pricing/
- https://docs.digitalocean.com/products/inference/how-to/manage-model-access-keys/
- https://docs.digitalocean.com/products/inference/how-to/manage-serverless-inference-prepayment/
