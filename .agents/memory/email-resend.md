---
name: Email provider — Resend (not nodemailer/Gmail SMTP)
description: Why we switched from nodemailer+Gmail SMTP to Resend, and what config is needed.
---

## Rule
Always use Resend (`resend` npm package) for email delivery. Do NOT use nodemailer or Gmail SMTP.

**Why:** Render.com (and most cloud platforms) block outbound TCP on SMTP ports 465/587 to prevent spam abuse. Gmail SMTP worked in Replit dev but silently timed out (~30s) on the deployed app. Resend uses HTTPS (port 443) which is never blocked.

**How to apply:**
- `email.ts` imports `{ Resend } from "resend"` and reads `process.env.RESEND_API_KEY`
- `routes.ts` checks `process.env.RESEND_API_KEY` (not GMAIL_USER/GMAIL_APP_PASSWORD) for email-configured status
- The Resend "from" address uses `onboarding@resend.dev` as fallback if no custom domain is verified in Resend dashboard
- On Render.com: add `RESEND_API_KEY` as an environment variable in the Render dashboard
