const nodemailer = require('nodemailer');

const createTransporter = () => nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

exports.sendOTPEmail = async (email, otp, name) => {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: 'Verify your Rewards Bytes account',
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px; background: #f9fafb; border-radius: 12px;">
        <h2 style="color: #6366f1; margin-bottom: 8px;">Welcome to Rewards Bytes! 🎮</h2>
        <p style="color: #374151;">Hi ${name}, please verify your email to activate your account.</p>
        <div style="background: #fff; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
          <p style="color: #6b7280; font-size: 14px;">Your verification code</p>
          <h1 style="color: #111827; letter-spacing: 8px; font-size: 36px; margin: 8px 0;">${otp}</h1>
          <p style="color: #9ca3af; font-size: 12px;">Expires in 10 minutes</p>
        </div>
        <p style="color: #6b7280; font-size: 12px;">If you didn't create this account, please ignore this email.</p>
      </div>
    `,
  });
};
