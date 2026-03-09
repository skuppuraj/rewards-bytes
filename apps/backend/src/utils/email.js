const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.sendVerificationEmail = async (to, token) => {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  await transporter.sendMail({
    from: `"Rewards Bytes" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Verify your Rewards Bytes account',
    html: `
      <h2>Welcome to Rewards Bytes!</h2>
      <p>Click the button below to verify your email and activate your organization.</p>
      <a href="${verifyUrl}" style="background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">
        Verify Email
      </a>
      <p>This link expires in 24 hours.</p>
    `
  });
};
