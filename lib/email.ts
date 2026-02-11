import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const fromAddress =
  process.env.EMAIL_FROM || "SparkyPass <onboarding@resend.dev>";

export async function sendVerificationEmail(
  to: string,
  name: string,
  verificationUrl: string
) {
  const { error } = await resend.emails.send({
    from: fromAddress,
    to,
    subject: "Verify your SparkyPass email",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #f59e0b; text-align: center;">⚡ SparkyPass</h1>
        <h2 style="text-align: center;">Verify Your Email</h2>
        <p>Hi ${name},</p>
        <p>Thanks for signing up for SparkyPass! Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #f59e0b; color: #000; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Verify Email
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
        <p style="color: #666; font-size: 14px; word-break: break-all;">${verificationUrl}</p>
        <p style="color: #666; font-size: 14px;">This link expires in 24 hours.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px; text-align: center;">
          If you didn't create a SparkyPass account, you can safely ignore this email.
        </p>
      </div>
    `,
    text: `Hi ${name},\n\nThanks for signing up for SparkyPass! Please verify your email address by visiting:\n\n${verificationUrl}\n\nThis link expires in 24 hours.\n\nIf you didn't create a SparkyPass account, you can safely ignore this email.`,
  });

  if (error) {
    console.error("Failed to send verification email:", error);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetUrl: string
) {
  const { error } = await resend.emails.send({
    from: fromAddress,
    to,
    subject: "Reset your SparkyPass password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #f59e0b; text-align: center;">⚡ SparkyPass</h1>
        <h2 style="text-align: center;">Reset Your Password</h2>
        <p>Hi ${name},</p>
        <p>We received a request to reset your password. Click the button below to choose a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #f59e0b; color: #000; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
        <p style="color: #666; font-size: 14px; word-break: break-all;">${resetUrl}</p>
        <p style="color: #666; font-size: 14px;">This link expires in 1 hour.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px; text-align: center;">
          If you didn't request a password reset, you can safely ignore this email.
        </p>
      </div>
    `,
    text: `Hi ${name},\n\nWe received a request to reset your password. Visit the link below to choose a new password:\n\n${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request a password reset, you can safely ignore this email.`,
  });

  if (error) {
    console.error("Failed to send password reset email:", error);
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
}
