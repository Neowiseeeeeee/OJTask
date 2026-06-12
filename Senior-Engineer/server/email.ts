import nodemailer from "nodemailer";

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error("GMAIL_USER and GMAIL_APP_PASSWORD environment variables are required for email sending.");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

export async function sendOtpEmail(toEmail: string, otp: string, name: string): Promise<void> {
  const transporter = getTransporter();
  const fromAddress = process.env.GMAIL_USER;

  await transporter.sendMail({
    from: `"OJTask" <${fromAddress}>`,
    to: toEmail,
    subject: "Your OJTask Password Reset Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9f9f9; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; background: linear-gradient(135deg, #7c3aed, #6d28d9); border-radius: 12px; padding: 12px 16px;">
            <span style="font-size: 28px; color: white; font-weight: bold;">⚡ OJTask</span>
          </div>
        </div>
        <h2 style="color: #1a1a1a; margin-bottom: 8px;">Password Reset Request</h2>
        <p style="color: #555; margin-bottom: 24px;">Hi ${name}, use the code below to reset your password. This code expires in <strong>10 minutes</strong>.</p>
        <div style="background: #fff; border: 2px solid #7c3aed; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 42px; font-weight: bold; letter-spacing: 10px; color: #7c3aed;">${otp}</span>
        </div>
        <p style="color: #888; font-size: 13px;">If you didn't request this, you can safely ignore this email. Your password will not change.</p>
      </div>
    `,
  });
}

export async function sendContactEmail(name: string, fromEmail: string, subject: string, message: string): Promise<void> {
  const transporter = getTransporter();
  const fromAddress = process.env.GMAIL_USER;

  await transporter.sendMail({
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
  const transporter = getTransporter();
  const fromAddress = process.env.GMAIL_USER;

  await transporter.sendMail({
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
