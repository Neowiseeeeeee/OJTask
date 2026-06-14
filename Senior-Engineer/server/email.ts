import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (_resend) return _resend;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY environment variable is required.");
  }
  _resend = new Resend(apiKey);
  return _resend;
}

const FROM_ADDRESS = "OJTask <onboarding@resend.dev>";

export async function verifyEmailConfig(): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("⚠️  RESEND_API_KEY is not set — email delivery disabled.");
    return false;
  }
  console.log("✅ Email (Resend) configured and ready");
  return true;
}

export async function sendOtpEmail(toEmail: string, otp: string, name: string): Promise<void> {
  console.log(`📧 Sending OTP email to ${toEmail}...`);

  const { error } = await getResend().emails.send({
    from: FROM_ADDRESS,
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

  if (error) {
    console.error("❌ Resend OTP send failed — name:", (error as any).name);
    console.error("❌ Resend OTP send failed — message:", (error as any).message);
    console.error("❌ Resend OTP send failed — statusCode:", (error as any).statusCode);
    console.error("❌ Resend OTP send failed — full:", JSON.stringify(error));
    const resendErr: any = new Error(`Resend rejected: ${(error as any).message}`);
    resendErr.resendName = (error as any).name;
    resendErr.resendStatus = (error as any).statusCode;
    throw resendErr;
  }

  console.log(`✅ OTP email sent to ${toEmail}`);
}

export async function sendContactEmail(name: string, fromEmail: string, subject: string, message: string): Promise<void> {
  const { error } = await getResend().emails.send({
    from: FROM_ADDRESS,
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

  if (error) {
    console.error("❌ Resend error sending contact email:", error);
    throw new Error(`Failed to send contact email: ${error.message}`);
  }
}

export async function sendWelcomeEmail(toEmail: string, name: string): Promise<void> {
  const { error } = await getResend().emails.send({
    from: FROM_ADDRESS,
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

  if (error) {
    console.error("❌ Resend error sending welcome email:", error);
    throw new Error(`Failed to send welcome email: ${error.message}`);
  }
}
