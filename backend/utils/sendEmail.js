const nodemailer = require("nodemailer");

async function getTransporter() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }

  // Dev fallback: Ethereal test inbox
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
}

module.exports = async function sendEmail({ to, subject, html, text }) {
  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"FertiSmart SL" <no-reply@fertismart.lk>',
    to,
    subject,
    html,
    text,
  });

  const preview = nodemailer.getTestMessageUrl(info);
  if (preview) console.log(`[email] Preview URL: ${preview}`);
};