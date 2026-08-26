# Deploy LTCme.click from GitHub

This repository is configured as a TanStack Start application on Cloudflare Workers.

## 1. Connect the repository

For an existing Worker:

1. Open **Cloudflare Dashboard > Workers & Pages**.
2. Select the Worker named **ltcme-click**.
3. Open **Settings > Builds**.
4. Select **Connect**, authorize GitHub, and choose **SNOR-token/ltcme-click**.

For a new Worker, use **Create application > Import a repository**, choose the same repository, and name the Worker **ltcme-click**.

## 2. Configure Workers Builds

Use these settings:

| Setting               | Value                        |
| --------------------- | ---------------------------- |
| Production branch     | main                         |
| Root directory        | /                            |
| Build command         | npm run build                |
| Deploy command        | npx wrangler deploy          |
| Non-production deploy | npx wrangler versions upload |

The Worker name must match the name in **wrangler.jsonc**.

## 3. Configure build variables

In **Settings > Builds > Variables and secrets**, add the public values needed while Vite builds the browser bundle:

- VITE_SUPABASE_URL
- VITE_SUPABASE_PUBLISHABLE_KEY
- VITE_PAYMENTS_CLIENT_TOKEN

## 4. Configure runtime variables and secrets

In **Settings > Variables & Secrets**, add the server-side values used by the deployed Worker:

- SUPABASE_URL
- SUPABASE_PUBLISHABLE_KEY
- SUPABASE_SERVICE_ROLE_KEY
- AI_API_KEY
- AI_BASE_URL (optional; defaults to the OpenAI-compatible endpoint)
- AI_MODEL (optional; defaults to gpt-4.1-mini)
- STRIPE_SANDBOX_SECRET_KEY
- STRIPE_LIVE_SECRET_KEY
- PAYMENTS_SANDBOX_WEBHOOK_SECRET
- PAYMENTS_LIVE_WEBHOOK_SECRET

Never commit secret values to Git.

## 5. Attach the domain

After the Worker preview succeeds, open **Settings > Domains & Routes** and attach **ltcme.click** as a custom domain. Verify the Worker URL first, then replace any older origin route or DNS record that still sends traffic to the previous host.

## 6. Verify the app and APK

Run:

    curl -I https://ltcme.click/
    curl -I https://ltcme.click/downloads/LTCme.apk

The APK is already tracked at **public/downloads/LTCme.apk**, so the second URL should return **200** after this repository is the active deployment.
