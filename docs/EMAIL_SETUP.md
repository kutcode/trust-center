# Email Setup Guide

This guide will help you configure secure email delivery for the Trust Center application.

## Overview

The Trust Center uses **Resend** for production email delivery, which provides:
- ✅ Built-in SPF, DKIM, DMARC authentication (ensures emails reach inboxes)
- ✅ High deliverability to Gmail, Hotmail, Yahoo, Outlook, and other major providers
- ✅ Free tier: 3,000 emails/month
- ✅ Secure API key authentication (no passwords)
- ✅ Automatic bounce handling and retry logic

For local development, we use **Mailpit** to capture emails without sending real messages.

## Quick Start

### 1. Sign Up for Resend

1. Go to [https://resend.com](https://resend.com)
2. Click "Sign Up" and create an account
3. Verify your email address
4. You'll automatically get 3,000 free emails/month

### 2. Get Your API Key

1. Log in to your Resend dashboard
2. Go to [API Keys](https://resend.com/api-keys)
3. Click "Create API Key"
4. Give it a name (e.g., "Trust Center Production")
5. Copy the API key (starts with `re_`)

### 3. Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Resend API key:
   ```env
   EMAIL_PROVIDER=resend
   RESEND_API_KEY=re_your_api_key_here
   SMTP_FROM=noreply@yourdomain.com
   ```

   **Note**: For the free tier, you can use `onboarding@resend.dev` as the `SMTP_FROM` address initially. To use your own domain, see [Custom Domain Setup](#custom-domain-setup) below.

### 4. Restart the Backend

```bash
docker-compose up -d --force-recreate backend
```

### 5. Test Email Sending

1. Go to the admin panel
2. Approve a document request
3. Check the recipient's inbox (and spam folder initially)
4. The email should arrive with document attachments

## Development Mode (Mailpit)

For local development, emails are captured by Mailpit instead of being sent:

1. **Default behavior**: If `EMAIL_PROVIDER` is not set or set to `mailpit`, emails go to Mailpit
2. **View emails**: Open [http://localhost:8025](http://localhost:8025) in your browser
3. **No configuration needed**: Mailpit works out of the box

## Custom Domain Setup (Optional)

To send emails from your own domain (e.g., `noreply@yourcompany.com`):

### Step 1: Add Domain in Resend

1. Go to [Domains](https://resend.com/domains) in Resend dashboard
2. Click "Add Domain"
3. Enter your domain (e.g., `yourcompany.com`)
4. Resend will provide DNS records to add

### Step 2: Add DNS Records

Add these DNS records to your domain's DNS settings:

**SPF Record** (TXT):
```
v=spf1 include:_spf.resend.com ~all
```

**DKIM Record** (TXT):
```
[Resend will provide this - unique per domain]
```

**DMARC Record** (TXT):
```
v=DMARC1; p=quarantine; rua=mailto:dmarc@yourcompany.com
```

### Step 3: Verify Domain

1. Wait for DNS propagation (can take up to 48 hours, usually much faster)
2. Click "Verify" in Resend dashboard
3. Once verified, update your `.env`:
   ```env
   SMTP_FROM=noreply@yourcompany.com
   ```

## Security Best Practices

### ✅ DO:

- **Use environment variables**: Never hardcode API keys in code
- **Rotate API keys**: Change your API keys every 90 days
- **Use different keys**: Separate keys for development and production
- **Monitor usage**: Check Resend dashboard regularly for suspicious activity
- **Validate emails**: The system automatically validates email addresses before sending
- **Rate limiting**: Built-in rate limiting prevents abuse

### ❌ DON'T:

- **Commit `.env` files**: Always keep `.env` in `.gitignore`
- **Share API keys**: Never share API keys in chat, email, or documentation
- **Use production keys in development**: Use Mailpit for local development
- **Log API keys**: The system sanitizes logs to prevent credential leaks

## Troubleshooting

### Emails Not Arriving

1. **Check spam folder**: New senders often go to spam initially
2. **Verify API key**: Check that `RESEND_API_KEY` is set correctly
3. **Check Resend dashboard**: Look for bounce or rejection reasons
4. **Verify email address**: Ensure recipient email is valid
5. **Check logs**: Backend logs show sanitized error messages

### "Invalid API Key" Error

- Verify your API key starts with `re_`
- Check that the key is copied correctly (no extra spaces)
- Ensure `EMAIL_PROVIDER=resend` is set
- Try creating a new API key in Resend dashboard

### Rate Limit Errors

- The system limits: 10 emails per 15 minutes per IP, 5 emails per hour per email address
- Wait for the rate limit window to reset
- For production, consider implementing Redis-based rate limiting

### Attachment Issues

- Maximum attachment size: 20MB total
- Supported formats: PDF, DOCX, images (PNG, JPG)
- If attachments fail, email still sends with magic link

## Production Deployment Checklist

- [ ] Resend account created and verified
- [ ] API key generated and added to `.env`
- [ ] `EMAIL_PROVIDER=resend` set in production environment
- [ ] Custom domain added and verified (optional but recommended)
- [ ] DNS records (SPF, DKIM, DMARC) configured
- [ ] `.env` file is NOT committed to version control
- [ ] Rate limiting configured appropriately
- [ ] Email templates tested with real recipients
- [ ] Monitoring set up for email delivery failures

## Email Provider Comparison

| Feature | Resend (Recommended) | SMTP (Gmail/Hotmail) |
|---------|----------------------|----------------------|
| Deliverability | ✅ Excellent (SPF/DKIM/DMARC) | ⚠️ Variable (depends on setup) |
| Setup Complexity | ✅ Easy (API key only) | ⚠️ Moderate (requires app passwords) |
| Free Tier | ✅ 3,000 emails/month | ✅ Unlimited (with limits) |
| Security | ✅ API keys (more secure) | ⚠️ Passwords (less secure) |
| Bounce Handling | ✅ Automatic | ❌ Manual |
| Analytics | ✅ Built-in dashboard | ❌ None |

## Support

- **Resend Documentation**: [https://resend.com/docs](https://resend.com/docs)
- **Resend Support**: [https://resend.com/support](https://resend.com/support)
- **Trust Center Issues**: Open an issue on GitHub

## Additional Resources

- [Resend API Reference](https://resend.com/docs/api-reference)
- [Email Deliverability Best Practices](https://resend.com/docs/deliverability)
- [SPF, DKIM, DMARC Explained](https://resend.com/docs/deliverability/authentication)

