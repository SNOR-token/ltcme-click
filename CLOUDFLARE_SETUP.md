# Cloudflare Workers Setup Guide for LTCme.click

## Quick Start

This project is a TanStack Start application deployed on Cloudflare Workers with AI capabilities.

## 1. Cloudflare Workers Configuration

### Create Worker
1. Go to **Cloudflare Dashboard > Workers & Pages**
2. Click **Create application > Worker**
3. Name it: `ltcme` (must match `name` in `wrangler.jsonc`)
4. Select **HTTP handler** template

### Connect GitHub Repository
1. In your Worker settings, go to **Settings > Builds**
2. Click **Connect** and authorize GitHub
3. Select repository: `SNOR-token/ltcme-click`
4. Branch: `main`

### Build Configuration
```
Production branch: main
Root directory: /
Build command: npm run build
Deploy command: npx wrangler deploy
```

## 2. Required Environment Variables

### Build Variables (Public - used during build)
In **Settings > Builds > Variables and secrets**:

```bash
VITE_SUPABASE_URL=https://sddeayzumvkdmdgqetyz.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key_here
VITE_PAYMENTS_CLIENT_TOKEN=your_stripe_publishable_key
```

### Runtime Variables (Server-side only)
In **Settings > Variables & Secrets**:

```bash
# Supabase (Server-side)
SUPABASE_URL=https://sddeayzumvkdmdgqetyz.supabase.co
SUPABASE_PUBLISHABLE_KEY=your_publishable_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here (ENCRYPTED)

# Cloudflare Workers AI (Automatic binding)
# The AI binding is automatically available - no key needed!
# Configure models in wrangler.jsonc or via environment:
CF_AI_MODEL=@cf/openai/gpt-oss-20b
CF_AI_FALLBACK_MODEL=@cf/zai-org/glm-4.7-flash

# Stripe Payment Processing
STRIPE_SANDBOX_SECRET_KEY=your_sandbox_secret_key (ENCRYPTED)
STRIPE_LIVE_SECRET_KEY=your_live_secret_key (ENCRYPTED)
PAYMENTS_SANDBOX_WEBHOOK_SECRET=your_sandbox_webhook_secret (ENCRYPTED)
PAYMENTS_LIVE_WEBHOOK_SECRET=your_live_webhook_secret (ENCRYPTED)
```

## 3. AI Binding Configuration

The `AI` binding is automatically configured in `wrangler.jsonc`:

```json
{
  "ai": {
    "binding": "AI"
  }
}
```

This uses Cloudflare's native Workers AI - **no API key required**.

## 4. Domain Setup

1. Go to **Settings > Domains & Routes**
2. Add custom domain: `ltcme.click`
3. Follow DNS verification instructions
4. Set as primary route: `ltcme.click/*`

## 5. Supabase Configuration

### Project Setup
- Project ID: `sddeayzumvkdmdgqetyz`
- Project URL: `https://sddeayzumvkdmdgqetyz.supabase.co`

### Authentication Settings
1. **Site URL**: `https://ltcme.click`
2. **Redirect URLs**: 
   - `https://ltcme.click/**`
   - `https://www.ltcme.click/**`
3. Enable: Email sign-in, new-user signup
4. **Magic Link template**: Include `{{ .Token }}` for OTP verification

### Database Migrations
Apply all migrations in `supabase/migrations/` to your production database.

## 6. Local Development

### Prerequisites
- Node.js v22+
- npm

### Setup
```bash
# Clone repository
git clone https://github.com/SNOR-token/ltcme-click.git
cd ltcme-click

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Edit .env with your credentials
nano .env  # or use your preferred editor

# Start development server
npm run dev
```

### Local .env File
```bash
# Browser-safe Supabase values
VITE_SUPABASE_PROJECT_ID=sddeayzumvkdmdgqetyz
VITE_SUPABASE_URL=https://sddeayzumvkdmdgqetyz.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
VITE_PAYMENTS_CLIENT_TOKEN=your_stripe_publishable_key

# Server-side Supabase bindings (for local dev)
SUPABASE_URL=https://sddeayzumvkdmdgqetyz.supabase.co
SUPABASE_PUBLISHABLE_KEY=your_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Models (optional - for local testing)
CF_AI_MODEL=@cf/openai/gpt-oss-20b
CF_AI_FALLBACK_MODEL=@cf/zai-org/glm-4.7-flash
```

## 7. Testing AI Chat Locally

The AI chat uses Cloudflare Workers AI binding which is only available in the deployed environment. For local testing:

1. **Without Workers AI**: The chat will fail gracefully with an error message
2. **With Workers AI**: Deploy to Cloudflare and test there

## 8. Deployment Commands

### Manual Deployment
```bash
# Build and deploy
npm run build
npx wrangler deploy

# Or use the combined command
npm run deploy
```

### GitHub Actions (Automatic)
Pushes to `main` branch automatically trigger:
1. Build
2. Deploy to Cloudflare Workers

## 9. Troubleshooting

### Common Issues

**"Cloudflare Workers AI binding is unavailable"**
- Ensure the Worker has the AI binding enabled
- This error only occurs in local dev - deployment works fine

**"Missing Supabase environment variables"**
- Verify all variables are set in Cloudflare dashboard
- Ensure SUPABASE_SERVICE_ROLE_KEY is encrypted

**"Build fails with vite not found"**
- Run `npm install` before building
- Ensure Node.js v22 is installed

**"Deployment fails with authentication error"**
- Verify CLOUDFLARE_API_TOKEN secret in GitHub Actions
- Verify CLOUDFLARE_ACCOUNT_ID secret in GitHub Actions

### Checking Deployment Status

```bash
# Check deployed Worker
curl -I https://ltcme.click/

# Check APK download
curl -I https://ltcme.click/downloads/LTCme.apk

# Check Worker logs in Cloudflare Dashboard
```

## 10. Monitoring

### Cloudflare Analytics
- View in **Workers & Pages > ltcme > Analytics**
- Monitor requests, errors, and performance

### Supabase Dashboard
- Monitor authentication, database queries
- View AI usage tracking

## 11. Security Checklist

- [ ] SUPABASE_SERVICE_ROLE_KEY is encrypted
- [ ] Stripe secret keys are encrypted
- [ ] Webhook secrets are encrypted
- [ ] No secrets committed to Git
- [ ] AI binding configured in wrangler.jsonc
- [ ] Supabase RLS policies applied
- [ ] Site URL configured in Supabase Auth

## 12. Useful Links

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/)
- [TanStack Start Documentation](https://tanstack.com/start/latest)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
