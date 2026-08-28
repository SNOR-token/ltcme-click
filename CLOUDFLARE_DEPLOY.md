# Deploy LTCme.click from GitHub

This repository is configured as a TanStack Start application on Cloudflare Workers.

## 1. Connect the repository

For an existing Worker:

1. Open **Cloudflare Dashboard > Workers & Pages**.
2. Select the Worker named **ltcme**.
3. Open **Settings > Builds**.
4. Select **Connect**, authorize GitHub, and choose **SNOR-token/ltcme-click**.

For a new Worker, use **Create application > Import a repository**, choose the same repository, and name the Worker **ltcme**.

## 2. Configure Workers Builds

Use these settings:

| Setting               | Value                        |
| --------------------- | ---------------------------- |
| Production branch     | main                         |
| Root directory        | /                            |
| Build command         | npm run build                |
| Deploy command        | npx wrangler deploy          |
| Non-production deploy | npx wrangler versions upload |

The Worker name must match the name in **wrangler.jsonc** (`ltcme`).

## 3. Configure build variables

In **Settings > Builds > Variables and secrets**, add the public values needed while Vite builds the browser bundle. Configure these before merging deployment changes because the build intentionally fails when either Supabase value is missing or points at the retired project.

- `VITE_SUPABASE_URL=https://sddeayzumvkdmdgqetyz.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY` — copy the Publishable key from Supabase **Settings > API Keys**
- VITE_PAYMENTS_CLIENT_TOKEN

## 4. Configure runtime variables and secrets

In **Settings > Variables & Secrets**, add the server-side values used by the deployed Worker:

- `SUPABASE_URL=https://sddeayzumvkdmdgqetyz.supabase.co`
- `SUPABASE_PUBLISHABLE_KEY` — the same browser-safe Publishable key
- `SUPABASE_SERVICE_ROLE_KEY` — add as an encrypted secret; never expose it to the browser or a build variable
- AI_API_KEY
- AI_BASE_URL (optional; defaults to the OpenAI-compatible endpoint)
- AI_MODEL (optional; defaults to gpt-4.1-mini)
- STRIPE_SANDBOX_SECRET_KEY
- STRIPE_LIVE_SECRET_KEY
- PAYMENTS_SANDBOX_WEBHOOK_SECRET
- PAYMENTS_LIVE_WEBHOOK_SECRET

Never commit secret values to Git.

## 5. Prepare the Supabase production project

The production project reference is `sddeayzumvkdmdgqetyz`. Apply the existing files in `supabase/migrations` before sending traffic to it. On IPv4-only networks, use the Session pooler URI from the Supabase **Connect** dialog with `supabase db push --db-url`.

In Supabase **Authentication**:

- Set the Site URL to `https://ltcme.click`.
- Allow `https://ltcme.click/**` and `https://www.ltcme.click/**` as redirect URLs.
- Keep Email sign-in and new-user signup enabled.
- Include `{{ .Token }}` in the Magic Link email template because the app verifies a six-digit email OTP.

## 6. Attach the domain

After the Worker preview succeeds, open **Settings > Domains & Routes** and attach **ltcme.click** as a custom domain. Verify the Worker URL first, then replace any older origin route or DNS record that still sends traffic to the previous host.

## 7. Verify the app and APK

Run:

    curl -I https://ltcme.click/
    curl -I https://ltcme.click/downloads/LTCme.apk

The APK is already tracked at **public/downloads/LTCme.apk**, so the second URL should return **200** after this repository is the active deployment.
