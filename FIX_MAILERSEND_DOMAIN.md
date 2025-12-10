# Fix MailerSend Domain Verification Error

## Error Message
```
The from.email domain must be verified in your account to send emails. #MS42207
```

## Problem
You're using `admin94428@gmail.com`, but MailerSend requires the **domain** to be verified. You cannot verify `gmail.com` - only Google can.

## Solutions

### Solution 1: Verify Your Own Domain (Recommended for Production)

If you have a domain (e.g., `dcs-coaching.com`):

1. **Go to MailerSend Dashboard:**
   - Navigate to **Domains** → **Add Domain**
   - Enter your domain (e.g., `dcs-coaching.com`)
   - Click **Add Domain**

2. **Add DNS Records:**
   - MailerSend will show you DNS records to add
   - Go to your domain registrar (e.g., GoDaddy, Namecheap)
   - Add the DNS records (SPF, DKIM, DMARC)
   - Wait for verification (can take a few minutes to 24 hours)

3. **Update Environment Variable:**
   ```
   MAIL_FROM = noreply@dcs-coaching.com
   ```
   (Use your verified domain)

4. **Redeploy** and test

### Solution 2: Use MailerSend Test Domain (For Testing)

MailerSend provides test domains for development:

1. **Check MailerSend Dashboard:**
   - Look for test email addresses
   - Usually something like `test@mailersend.com` or similar

2. **Or Use Sandbox Mode:**
   - MailerSend has a sandbox/test mode
   - Check their documentation for test email addresses

3. **Update Environment Variable:**
   ```
   MAIL_FROM = test@mailersend-test-domain.com
   ```
   (Use MailerSend's test domain)

### Solution 3: Add Single Sender Email (If Supported)

Some MailerSend plans allow single email verification:

1. **Go to MailerSend Dashboard:**
   - Navigate to **Senders** → **Add Sender**
   - Enter `admin94428@gmail.com`
   - Verify via email confirmation

2. **If verification email arrives:**
   - Click the verification link
   - Email should be verified

3. **Note:** This may not work for Gmail addresses - MailerSend typically requires domain verification

### Solution 4: Use a Different Email Service (Alternative)

If domain verification is not possible, consider:

**SendGrid** (Free tier: 100 emails/day)
- Easier setup
- Less strict domain requirements for free tier

**Resend** (Developer-friendly)
- Simple API
- Good for transactional emails

## Quick Fix for Testing

### Option A: Get a Free Domain
1. Get a free domain from:
   - Freenom (`.tk`, `.ml`, `.ga`)
   - Or use a subdomain from services like `*.ngrok.io`
2. Verify it in MailerSend
3. Use it for `MAIL_FROM`

### Option B: Use MailerSend Test Domain
1. Check MailerSend documentation for test domains
2. Use that for `MAIL_FROM`
3. This is only for testing, not production

## Recommended Setup for Production

1. **Get a domain** (e.g., `dcs-coaching.com`)
2. **Verify domain in MailerSend:**
   - Add domain
   - Add DNS records
   - Wait for verification
3. **Update Render environment:**
   ```
   MAIL_FROM = noreply@dcs-coaching.com
   MAIL_FROM_NAME = DCS Coaching
   ```
4. **Redeploy**

## Current Status

- ✅ API key is valid
- ✅ Sender object is created correctly
- ✅ Email parameters are correct
- ❌ Domain not verified in MailerSend

## Next Steps

1. **Choose a solution** from above
2. **Verify domain/sender** in MailerSend dashboard
3. **Update `MAIL_FROM`** in Render environment variables
4. **Redeploy** your service
5. **Test** send-otp endpoint again

## Check MailerSend Dashboard

Go to: https://app.mailersend.com/domains

- If you see your domain listed and verified ✅ → Use that domain
- If no domains → Add and verify one
- Check "Senders" section for single email verification option

