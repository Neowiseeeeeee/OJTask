import nodemailer from "nodemailer";

// Pool-mode transporter — reuses the SMTP connection for speed.
// maxIdleTime is set to 2 minutes so we proactively close idle connections
// before Gmail's server-side 10-minute idle timeout kicks in.
// This avoids the "stale connection" error that caused silent failures before.
let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (_transporter) return _transporter;

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error("GMAIL_USER and GMAIL_APP_PASSWORD environment variables are required.");
  }

  _transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
    pool: true,
    maxConnections: 2,
    maxMessages: Infinity,
    // Close idle connections after 2 minutes (well before Gmail's 10-min timeout)
    idleTimeout: 120000,
    connectionTimeout: 15000,
    socketTimeout: 15000,
  });

  // Destroy pool on any connection-level error so next call rebuilds it cleanly
  _transporter.on("error", (err) => {
    console.error("❌ SMTP pool error, resetting transporter:", err.message);
    _transporter = null;
  });

  return _transporter;
}

async function sendWithRetry(mailOptions: nodemailer.SendMailOptions): Promise<void> {
  try {
    await getTransporter().sendMail(mailOptions);
  } catch (firstErr: any) {
    console.warn("⚠️  First SMTP send failed, resetting pool and retrying once:", firstErr?.message);
    // Reset the pool so the retry gets a fresh connection
    if (_transporter) {
      try { _transporter.close(); } catch {}
      _transporter = null;
    }
    // Retry with a fresh connection (no second retry — if this fails, let it throw)
    await getTransporter().sendMail(mailOptions);
  }
}

export async function verifyEmailConfig(): Promise<boolean> {
  try {
    await getTransporter().verify();
    console.log("✅ Email (Gmail SMTP) verified and ready");
    return true;
  } catch (err) {
    console.warn("⚠️  Email (Gmail SMTP) verification failed:", err);
    _transporter = null;
    return false;
  }
}

export async function sendOtpEmail(toEmail: string, otp: string, name: string): Promise<void> {
  const fromAddress = process.env.GMAIL_USER;
  console.log(`📧 Sending OTP email to ${toEmail}...`);

  await sendWithRetry({
    from: `"OJTask" <${fromAddress}>`,
    to: toEmail,
    subject: "OJTask password reset code",
    text: `Hi ${name},\n\nYour OJTask password reset code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, you can safely ignore this email.\n\n— OJTask`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1a1a1a;">
        <p style="margin:0 0 8px 0;font-size:15px;">Hi ${name},</p>
        <p style="margin:0 0 20px 0;font-size:15px;color:#444;">Use the code below to reset your OJTask password. It expires in <strong>10 minutes</strong>.</p>
        <div style="background:#f3f0ff;border-left:4px solid #7c3aed;padding:16px 24px;margin:0 0 20px 0;border-radius:4px;">
          <p style="margin:0;font-size:13px;color:#555;text-transform:uppercase;letter-spacing:1px;">Reset code</p>
          <p style="margin:4px 0 0 0;font-size:36px;font-weight:bold;letter-spacing:8px;color:#7c3aed;">${otp}</p>
        </div>
        <p style="margin:0;font-size:13px;color:#888;">If you didn't request this, ignore this email — your password won't change.</p>
        <hr style="margin:24px 0;border:none;border-top:1px solid #eee;">
        <p style="margin:0;font-size:12px;color:#bbb;">OJTask — Your internship, organized and on track.</p>
      </div>
    `,
  });

  console.log(`✅ OTP email sent to ${toEmail}`);
}

export async function sendContactEmail(name: string, fromEmail: string, subject: string, message: string): Promise<void> {
  const fromAddress = process.env.GMAIL_USER;

  await sendWithRetry({
    from: `"OJTask Contact Form" <${fromAddress}>`,
    to: "ojtask.connect@gmail.com",
    replyTo: fromEmail,
    subject: `[OJTask Contact] ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; background: #f9f9f9; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; background: linear-gradient(135deg, #7c3aed, #6d28d9); border-radius: 12px; padding: 12px 16px;">
            <span style="font-size: 22px; color: white; font-weight: bold;">OJTask Contact Form</span>
          </div>
        </div>
        <table style="width: 100%; margin-bottom: 20px; border-collapse: collapse;">
          <tr><td style="padding: 6px 0; color: #888; font-size: 13px; width: 90px;">From</td><td style="padding: 6px 0; font-size: 13px; color: #1a1a1a; font-weight: 600;">${name}</td></tr>
          <tr><td style="padding: 6px 0; color: #888; font-size: 13px;">Email</td><td style="padding: 6px 0; font-size: 13px; color: #7c3aed;"><a href="mailto:${fromEmail}" style="color:#7c3aed;">${fromEmail}</a></td></tr>
          <tr><td style="padding: 6px 0; color: #888; font-size: 13px;">Subject</td><td style="padding: 6px 0; font-size: 13px; color: #1a1a1a;">${subject}</td></tr>
        </table>
        <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 20px; font-size: 14px; color: #374151; line-height: 1.6; white-space: pre-wrap;">${message}</div>
        <p style="color: #aaa; font-size: 12px; margin-top: 20px; text-align: center;">Reply directly to this email to respond to ${name}.</p>
      </div>
    `,
  });
}

export async function sendWelcomeEmail(toEmail: string, name: string): Promise<void> {
  const fromAddress = process.env.GMAIL_USER;

  await sendWithRetry({
    from: `"OJTask" <${fromAddress}>`,
    to: toEmail,
    subject: "Welcome to OJTask!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9f9f9; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; background: linear-gradient(135deg, #7c3aed, #6d28d9); border-radius: 12px; padding: 12px 16px;">
            <span style="font-size: 28px; color: white; font-weight: bold;">⚡ OJTask</span>
          </div>
        </div>
        <h2 style="color: #1a1a1a;">Welcome, ${name}!</h2>
        <p style="color: #555;">Your account has been created. You can now sign in and start managing your internship.</p>
      </div>
    `,
  });
}
