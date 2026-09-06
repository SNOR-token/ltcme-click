# LTCme.click Deployment Verification Checklist

## Pre-Deployment Checklist

### 1. Code & Repository
- [ ] All changes committed to `main` branch
- [ ] Build passes locally (`npm run build`)
- [ ] TypeScript compilation succeeds (`tsc --noEmit`)
- [ ] All tests pass (if applicable)
- [ ] `routeTree.gen.ts` is up to date

### 2. Cloudflare Workers Configuration
- [ ] Worker named `ltcme` exists
- [ ] GitHub repository connected (SNOR-token/ltcme-click)
- [ ] Production branch set to `main`
- [ ] Build command: `npm run build`
- [ ] Deploy command: `npx wrangler deploy`
- [ ] AI binding enabled in wrangler.jsonc

### 3. Environment Variables (Build - Public)
- [ ] `VITE_SUPABASE_URL` = `https://sddeayzumvkdmdgqetyz.supabase.co`
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY` = [Your Supabase publishable key]
- [ ] `VITE_PAYMENTS_CLIENT_TOKEN` = [Your Stripe publishable key]

### 4. Environment Variables (Runtime - Encrypted)
- [ ] `SUPABASE_URL` = `https://sddeayzumvkdmdgqetyz.supabase.co`
- [ ] `SUPABASE_PUBLISHABLE_KEY` = [Your Supabase publishable key]
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = [Your Supabase service role key] **(ENCRYPTED)**
- [ ] `STRIPE_SANDBOX_SECRET_KEY` = [Sandbox secret key] **(ENCRYPTED)**
- [ ] `STRIPE_LIVE_SECRET_KEY` = [Live secret key] **(ENCRYPTED)**
- [ ] `PAYMENTS_SANDBOX_WEBHOOK_SECRET` = [Sandbox webhook secret] **(ENCRYPTED)**
- [ ] `PAYMENTS_LIVE_WEBHOOK_SECRET` = [Live webhook secret] **(ENCRYPTED)**
- [ ] `CF_AI_MODEL` = `@cf/openai/gpt-oss-20b` (optional)
- [ ] `CF_AI_FALLBACK_MODEL` = `@cf/zai-org/glm-4.7-flash` (optional)

### 5. Supabase Configuration
- [ ] Project ID: `sddeayzumvkdmdgqetyz`
- [ ] Site URL: `https://ltcme.click`
- [ ] Redirect URLs: `https://ltcme.click/**` and `https://www.ltcme.click/**`
- [ ] Email sign-in enabled
- [ ] New-user signup enabled
- [ ] Magic Link template includes `{{ .Token }}`
- [ ] All migrations applied to production database
- [ ] RLS policies configured correctly

### 6. Domain & SSL
- [ ] Custom domain `ltcme.click` attached
- [ ] DNS records properly configured
- [ ] SSL certificate provisioned and valid
- [ ] Domain verified in Cloudflare

## Post-Deployment Verification

### 1. Basic Connectivity
- [ ] `curl -I https://ltcme.click/` returns HTTP 200
- [ ] `curl -I https://www.ltcme.click/` returns HTTP 200
- [ ] `curl -I https://ltcme.click/downloads/LTCme.apk` returns HTTP 200
- [ ] Site loads without errors in browser
- [ ] No console errors in browser dev tools

### 2. Authentication
- [ ] Email signup works
- [ ] Email login works
- [ ] Magic link works
- [ ] Session persistence works
- [ ] Sign out works
- [ ] Authenticated routes redirect unauthenticated users

### 3. AI Chat Functionality
- [ ] AI chat box appears for authenticated users
- [ ] AI responds to messages (10 free messages)
- [ ] AI refuses to accept seed phrases/private keys
- [ ] Free message counter works (10 messages)
- [ ] Pro users get unlimited messages
- [ ] Error handling for AI failures

### 4. Wallet Functions
- [ ] Wallet creation works
- [ ] Wallet import works (seed phrase)
- [ ] Address generation works
- [ ] Balance display works
- [ ] Transaction history works
- [ ] Send LTC works (testnet/mainnet)
- [ ] Receive LTC works
- [ ] Fee estimation works

### 5. Pro Features
- [ ] `/guard` page loads
- [ ] Free exposure summary works
- [ ] Pro lock shows for non-subscribers
- [ ] Pro features visible for subscribers
- [ ] Subscription flow works (Stripe)
- [ ] Webhook processing works
- [ ] `/buy` page works
- [ ] `/tx-risk-analysis` page loads and works

### 6. AI Risk Analysis (New Feature)
- [ ] Page accessible via navigation
- [ ] Address scanning works
- [ ] Risk detection works (reuse, legacy, concentration)
- [ ] Risk scoring works
- [ ] Filtering by severity works
- [ ] Search functionality works
- [ ] Pro lock shows advanced features

### 7. Visual Enhancements
- [ ] Litecoin logo components render
- [ ] Background patterns visible
- [ ] Glass-morphism effects work
- [ ] Animations smooth
- [ ] Theme consistent across pages

## Monitoring & Maintenance

### 1. Cloudflare Monitoring
- [ ] Worker analytics show requests
- [ ] Error rates monitored
- [ ] Response times acceptable (< 1s)
- [ ] AI binding usage tracked

### 2. Supabase Monitoring
- [ ] Authentication requests tracked
- [ ] Database queries monitored
- [ ] AI usage table populated
- [ ] Subscription table updated

### 3. Payment Monitoring
- [ ] Stripe webhooks received
- [ ] Subscription status updated
- [ ] Payment failures logged
- [ ] Refunds handled correctly

## Performance Checklist

- [ ] Page load time < 2s
- [ ] AI response time < 5s
- [ ] Wallet balance updates < 1s
- [ ] Transaction history loads < 2s
- [ ] Mobile responsive design works
- [ ] Touch targets appropriate size
- [ ] Fonts legible on all devices

## Security Checklist

- [ ] No secrets in Git history
- [ ] All sensitive variables encrypted
- [ ] CORS headers configured
- [ ] CSRF protection in place
- [ ] Rate limiting configured
- [ ] Input validation on all endpoints
- [ ] AI safety filters working
- [ ] No XSS vulnerabilities
- [ ] No SQL injection vulnerabilities

## Rollback Plan

1. **Minor Issues**: Hotfix via Git commit to main
2. **Major Issues**: 
   - Revert to previous commit
   - Deploy known-good version
   - Disable affected features via feature flags
3. **Critical Issues**:
   - Disable Worker temporarily
   - Investigate locally
   - Deploy fix with thorough testing

## Contact & Support

- **Cloudflare Support**: [Cloudflare Dashboard](https://dash.cloudflare.com)
- **Supabase Support**: [Supabase Dashboard](https://app.supabase.com)
- **Stripe Support**: [Stripe Dashboard](https://dashboard.stripe.com)
- **GitHub Repository**: [SNOR-token/ltcme-click](https://github.com/SNOR-token/ltcme-click)

## Verification Commands

```bash
# Check deployment status
curl -I https://ltcme.click/

# Check specific endpoints
curl -I https://ltcme.click/api/health
curl -I https://ltcme.click/downloads/LTCme.apk

# Check build status in Cloudflare
# (Use Cloudflare Dashboard)

# Check GitHub Actions
# (Use GitHub Actions tab)

# Monitor logs
# (Use Cloudflare Worker logs)
```

## Deployment Summary

| Item | Status | Notes |
|------|--------|-------|
| Code | ✅ | All changes committed |
| Cloudflare | ✅ | Worker configured |
| Supabase | ✅ | Database ready |
| Stripe | ✅ | Payment processing ready |
| Domain | ✅ | ltcme.click attached |
| AI | ✅ | Workers AI binding configured |
| Deployment | ✅ | GitHub Actions configured |

---

**Last Updated**: $(date)
**Deployed by**: [Your Name]
**Version**: [Git Commit Hash]
