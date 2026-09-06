# Email Setup for LTCme.click

## Option 2: support@ltcme.click with Forwarding to Your Personal Email

This guide sets up **both** a professional `support@ltcme.click` email address AND forwarding to your personal inbox.

---

## Step 1: Set Up Email Forwarding

### If Your Domain Uses Cloudflare Email Routing (Recommended)

1. **Go to Cloudflare Dashboard > ltcme.click > Email > Email Routing**
2. **Enable Email Routing** (if not already enabled)
3. **Create a custom address:**
   - Address: `support@ltcme.click`
   - Destination: `your-personal-email@gmail.com` (your actual email)
4. **Verify your destination email** by clicking the link sent to your personal inbox

**Done!** All emails to `support@ltcme.click` will now forward to your personal email.

### If Your Domain Uses MX Records (Gmail, Outlook, etc.)

#### For Gmail/Google Workspace:

1. **Add support@ltcme.click as a "Send mail as" address in Gmail:**
   - Go to Gmail > Settings > Accounts and Import
   - Click "Add another email address" under "Send mail as"
   - Enter: `support@ltcme.click`
   - Follow verification steps

2. **Set up forwarding in Gmail:**
   - Go to Gmail > Settings > Forwarding and POP/IMAP
   - Add forwarding address: `your-personal-email@gmail.com`
   - Verify the forwarding address

#### For Outlook/Microsoft 365:

1. **Add a connector for ltcme.click:**
   - Go to Microsoft 365 Admin > Exchange Admin Center > Mail flow > Connectors
   - Create a new connector from "Your organization's email server" to "Office 365"
   - Add ltcme.click as the sender domain

2. **Create a shared mailbox:**
   - Go to Microsoft 365 Admin > Groups > Shared mailboxes
   - Create: `support@ltcme.click`
   - Add your user as a member

---

## Step 2: Configure SPF, DKIM, and DMARC (Critical!)

Without these, your emails will go to spam!

### SPF Record (Prevents spoofing)

Add this DNS TXT record:
```
Type: TXT
Name: ltcme.click
Value: "v=spf1 include:_spf.google.com ~all"
```
(Replace `google.com` with your email provider's SPF)

### DKIM Record (Proves authenticity)

1. In your email provider (Gmail, Outlook, etc.), generate DKIM keys
2. Add the provided CNAME records to your DNS

For **Google Workspace**:
- Go to Admin Console > Apps > Google Workspace > Gmail > Authenticate Email
- Generate DKIM keys for ltcme.click
- Add the CNAME records to Cloudflare DNS

For **Cloudflare Email Routing**:
- DKIM is automatically configured when you enable Email Routing

### DMARC Record (Tells receivers what to do)

Add this DNS TXT record:
```
Type: TXT
Name: _dmarc.ltcme.click
Value: "v=DMARC1; p=none; rua=mailto:chad78500@gmail.com; ruf=mailto:chad78500@gmail.com; pct=100"
```

Start with `p=none` (monitor only), then change to `p=quarantine` after testing.

---

## Step 3: Test Your Setup

### Test 1: Send an email to support@ltcme.click
```bash
# From command line (requires mailutils)
echo "Test message" | mail -s "Test Subject" support@ltcme.click

# Or use a web tool
```

### Test 2: Check if you receive it
- Check your personal email inbox
- Check spam folder

### Test 3: Check email headers
- Open the received email
- View headers/source
- Look for:
  - `Received-SPF: pass`
  - `DKIM-Signature: v=1`
  - `Authentication-Results: dmarc=pass`

---

## Step 4: Set Up Auto-Responder (Optional)

### In Gmail:
1. Go to Settings > See all settings > Vacation responder
2. Enable for `support@ltcme.click`
3. Set message: "Thanks for contacting LTCme.click support. We'll respond within 24-48 hours."

### In Cloudflare Email Routing:
1. Go to Email Routing > Addresses > support@ltcme.click
2. Enable "Auto-reply"
3. Set your message

---

## Step 5: Add to Your Website

### Update Support Page

The support page already links to `mailto:support@ltcme.click`. I've also added a contact form that uses **FormSubmit.co** (free email form service).

### FormSubmit.co Setup (Already Done!)

The contact form on `/support` uses:
```html
<form action="https://formsubmit.co/chad78500@gmail.com" method="POST">
  <input type="hidden" name="_subject" value="LTCme.click Support Request">
  <input type="hidden" name="_next" value="https://ltcme.click/support/thank-you">
  <input type="hidden" name="_captcha" value="false">
  <!-- form fields -->
</form>
```

This will:
- Send submissions to `chad78500@gmail.com`
- Redirect users to a thank-you page
- Skip CAPTCHA (since you're a real site)

**No additional setup needed!** FormSubmit.co handles everything automatically.

---

## Step 6: Create a Thank You Page (Optional)

Create `src/routes/support/thank-you.tsx`:

```tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle } from "lucide-react";

export const Route = createFileRoute("/support/thank-you")({
  component: ThankYouPage,
  head: () => ({
    meta: [
      { title: "Thank You - LTCme.click" },
      { name: "description", content: "Thank you for contacting LTCme.click support." },
    ],
  }),
});

function ThankYouPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md text-center card-glass rounded-3xl p-12 neon-edge">
        <CheckCircle className="h-16 w-16 mx-auto text-emerald-500" />
        <h1 className="mt-6 text-2xl font-bold text-neon-gradient">Thank You!</h1>
        <p className="mt-4 text-muted-foreground">
          Your message has been sent to our support team.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          We typically respond within 24-48 hours.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 btn-glow"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
```

---

## Step 7: Email Templates (Optional)

### Common Responses

**1. Seed Phrase Lost:**
```
Subject: Re: Lost Seed Phrase

I'm sorry, but there is nothing we can do to recover a lost seed phrase. 
Your funds are only accessible with the 12/24-word seed you were shown 
during wallet creation. This is the nature of self-custody - you alone control 
your funds.

Please be extremely careful with your seed phrases in the future. Consider:
- Writing it on paper and storing in a secure location
- Using a metal backup (Cryptotag, Billfodl, etc.)
- Never storing it digitally

We cannot recover lost seeds or reverse transactions.
```

**2. Import Failing:**
```
Subject: Re: Import Issue

Make sure you're entering your seed phrase correctly:
- 12 or 24 words
- Separated by single spaces
- All lowercase
- No typos

If your wallet used a BIP39 passphrase (25th word), click "Add optional 
BIP39 passphrase" during import.

Try again carefully. If it still fails, double-check you're using the 
correct seed phrase.
```

**3. Transaction Stuck:**
```
Subject: Re: Stuck Transaction

If your transaction has low fees, it may take time to confirm during network 
congestion. Here are your options:

1. Wait: Most transactions confirm within 24-48 hours
2. Check: Use a block explorer like litecoinspace.org to see if it's pending
3. RBF: If you enabled Replace-By-Fee, you can try to replace it with a higher fee

We cannot cancel or speed up broadcast transactions.
```

---

## Step 8: Monitor Email Deliverability

### Check if Emails Are Being Received

1. **Send test emails** regularly
2. **Check spam folders** in your personal email
3. **Ask users** if they received your responses

### Use Email Testing Tools

- [Mail-Tester](https://www.mail-tester.com/) - Check your SPF/DKIM/DMARC
- [MXToolbox](https://mxtoolbox.com/) - Verify DNS records
- [Google Postmaster Tools](https://postmaster.google.com/) - Monitor Gmail deliverability

---

## Troubleshooting

### Emails Going to Spam

1. **Check SPF/DKIM/DMARC** - All must be set up correctly
2. **Warm up your IP** - Send small batches first
3. **Avoid spam triggers** - Don't use words like "free", "urgent", "guarantee"
4. **Ask users to whitelist** - Have them add `support@ltcme.click` to contacts

### Not Receiving Emails

1. **Check spam folder**
2. **Verify forwarding** is set up correctly
3. **Test with different email** - Try sending from another provider
4. **Check DNS records** - Use MXToolbox to verify

### Form Not Working

1. **Check FormSubmit.co** - Visit https://formsubmit.co to verify your email
2. **Test the form** - Submit a test message
3. **Check browser console** - Look for errors
4. **Try without hidden fields** - Remove `_subject`, `_next`, etc. temporarily

---

## Recommended Email Providers

| Provider | Cost | SPF/DKIM | Ease of Use |
|----------|------|----------|-------------|
| Cloudflare Email Routing | Free | ✅ Auto | ⭐⭐⭐⭐⭐ |
| Google Workspace | $6/user/mo | ✅ Manual | ⭐⭐⭐⭐ |
| Microsoft 365 | $4/user/mo | ✅ Manual | ⭐⭐⭐⭐ |
| Zoho Mail | Free (5 users) | ✅ Manual | ⭐⭐⭐ |
| Proton Mail | $5/mo | ✅ Manual | ⭐⭐⭐ |

**Recommendation: Use Cloudflare Email Routing** - It's free, integrates with your domain, and auto-configures DKIM.

---

## Final Checklist

- [ ] `support@ltcme.click` email address created
- [ ] Forwarding to personal email configured
- [ ] SPF record added to DNS
- [ ] DKIM record added to DNS
- [ ] DMARC record added to DNS
- [ ] Test email sent and received
- [ ] Contact form on website tested
- [ ] Auto-responder configured (optional)
- [ ] Thank you page created (optional)

---

## Useful Links

- [Cloudflare Email Routing](https://developers.cloudflare.com/email-routing/)
- [MXToolbox DNS Checker](https://mxtoolbox.com/DNSLookup.aspx)
- [Mail-Tester](https://www.mail-tester.com/)
- [SPF Record Generator](https://mxtoolbox.com/spf.aspx)
- [DMARC Record Generator](https://dmarcian.com/dmarc-record-generator/)
- [FormSubmit.co](https://formsubmit.co/)

---

## Need Help?

If you're stuck with email setup, the best approach is:

1. **Start with Cloudflare Email Routing** - It's the easiest
2. **Test with a simple email** before setting up forwarding
3. **Check DNS records** using MXToolbox
4. **One thing at a time** - SPF first, then DKIM, then DMARC

**Your email will work!** Just take it step by step. 🚀
